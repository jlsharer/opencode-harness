import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, writeFile, mkdir, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import {
  expandIndexedReferences,
  managedCompactionSafe,
  reportedInputCompactionDecision,
  validateUsageTelemetry,
} from "./context-budget.ts";

const hash = (text: string) => createHash("sha256").update(text).digest("hex");

const budget = { maxEntries: 2, maxBytes: 16, maxReferenceBytes: 12 };
test("usage is unknown without measurements and preserves genuine zero", () => {
  assert.equal(validateUsageTelemetry(undefined).status, "unknown");
  assert.equal(validateUsageTelemetry({}).inputTokens, null);
  assert.deepEqual(validateUsageTelemetry({ inputTokens: 0, costUsd: 0 }), {
    status: "reported",
    inputTokens: 0,
    outputTokens: null,
    costUsd: 0,
  });
});
test("usage rejects estimates, negative, fractional, infinite and unsafe counts", () => {
  for (const value of [
    { estimatedTokens: 2 },
    { inputTokens: -1 },
    { outputTokens: 1.5 },
    { inputTokens: Number.MAX_SAFE_INTEGER + 1 },
    { costUsd: Infinity },
    { costUsd: -1 },
    [],
  ])
    assert.throws(() => validateUsageTelemetry(value));
});
test("explicit indexed expansion is byte bounded and hash bound", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "context-budget-"));
  try {
    await writeFile(path.join(root, "a.txt"), "hello");
    const index = { a: { path: "a.txt", sha256: hash("hello") } };
    const result = await expandIndexedReferences(root, index, ["a"], budget);
    assert.equal(result.bytes, 5);
    assert.equal(result.entries[0]?.content, "hello");
    await assert.rejects(expandIndexedReferences(root, index, ["a", "a"], budget), /duplicate/);
    await assert.rejects(expandIndexedReferences(root, index, ["missing"], budget), /unknown/);
    await assert.rejects(
      expandIndexedReferences(root, index, ["a"], { ...budget, maxReferenceBytes: 4 }),
      /byte/,
    );
    await writeFile(path.join(root, "a.txt"), "other");
    await assert.rejects(expandIndexedReferences(root, index, ["a"], budget), /stale/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("rejects traversal, symlink leaf and ancestor, directories and invalid utf8", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "context-budget-"));
  const expand = (relative: string, sha256 = hash("hello")) =>
    expandIndexedReferences(root, { a: { path: relative, sha256 } }, ["a"], budget);
  try {
    await mkdir(path.join(root, "dir"));
    await writeFile(path.join(root, "dir/a"), "hello");
    await symlink("dir/a", path.join(root, "leaf"));
    await symlink("dir", path.join(root, "link"));
    for (const relative of ["../a", "/etc/passwd", "dir/../a", "dir//a", "leaf", "link/a", "dir"])
      await assert.rejects(expand(relative));
    const invalid = Buffer.from([255]);
    await writeFile(path.join(root, "invalid"), invalid);
    await assert.rejects(expand("invalid", createHash("sha256").update(invalid).digest("hex")));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
test("enforces aggregate bytes and hard budget ceilings", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "context-budget-"));
  try {
    await writeFile(path.join(root, "a"), "123456789");
    await writeFile(path.join(root, "b"), "123456789");
    const index = {
      a: { path: "a", sha256: hash("123456789") },
      b: { path: "b", sha256: hash("123456789") },
    };
    await assert.rejects(expandIndexedReferences(root, index, ["a", "b"], budget), /byte/);
    await assert.rejects(
      expandIndexedReferences(root, index, [], { ...budget, maxEntries: 129 }),
      /budget/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function compactionFixture() {
  return {
    session: { id: "primary", time: { compacting: 100 } },
    status: { primary: { type: "idle" } },
    idleEvent: { type: "session.idle", sessionID: "primary" },
    managed: { stopped: false, background: null, runs: [] as unknown[] },
    providers: {
      all: [{ id: "provider", models: { model: { id: "model", limit: { context: 100 } } } }],
    },
    messages: [
      {
        info: {
          id: "user",
          sessionID: "primary",
          role: "user",
          time: { created: 101 },
          model: { providerID: "provider", modelID: "model" },
        },
      },
      {
        info: {
          id: "turn",
          parentID: "user",
          sessionID: "primary",
          role: "assistant",
          providerID: "provider",
          modelID: "model",
          time: { created: 102, completed: 103 },
          tokens: { input: 60 },
        },
      },
    ],
  };
}

test("reported input threshold is conservative and exact at 60 percent", () => {
  const fixture = compactionFixture();
  assert.equal(reportedInputCompactionDecision(fixture).status, "request-eligible");
  const tokens = (fixture.messages[1]!.info as { tokens: { input: number } }).tokens;
  tokens.input = 59;
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  tokens.input = 60;
  fixture.providers.all[0]!.models.model.limit.context = 101;
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  fixture.providers.all[0]!.models.model.limit.context = Number.MAX_SAFE_INTEGER;
  tokens.input = Number.MAX_SAFE_INTEGER;
  assert.equal(reportedInputCompactionDecision(fixture).status, "request-eligible");
});

test("reported cached input counts toward the threshold without using lifetime totals", () => {
  const fixture = compactionFixture();
  const tokens = (
    fixture.messages[1]!.info as {
      tokens: { input: number; cache?: { read?: number; write?: number } };
    }
  ).tokens;
  tokens.input = 1;
  tokens.cache = { read: 58, write: 0 };
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  tokens.cache.write = 1;
  assert.equal(reportedInputCompactionDecision(fixture).status, "request-eligible");
  tokens.cache = { read: 238464, write: 0 };
  fixture.providers.all[0]!.models.model.limit.context = 256000;
  assert.equal(reportedInputCompactionDecision(fixture).status, "request-eligible");
  tokens.cache.read = -1;
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  tokens.cache.read = Number.MAX_SAFE_INTEGER;
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  tokens.cache = { read: 0, write: 0 };
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
});

test("compaction skips busy, child, stale, missing and uncertain work", () => {
  const fixture = compactionFixture();
  const complete = {
    interrupted: false,
    active: 0,
    attempts: [{ state: "success" }, { state: "blocked" }],
  };
  fixture.managed.runs = [complete];
  assert.equal(managedCompactionSafe(fixture.managed), true);
  for (const run of [
    { ...complete, active: 1 },
    { ...complete, interrupted: true },
    { ...complete, attempts: [{ state: "running" }] },
    {},
  ]) {
    fixture.managed.runs = [run];
    assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  }
  fixture.managed.runs = [complete];
  fixture.managed.stopped = true;
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  fixture.managed.stopped = false;
  fixture.status.primary.type = "busy";
  assert.equal(reportedInputCompactionDecision(fixture).status, "skip");
  fixture.status.primary.type = "idle";
  assert.equal(
    reportedInputCompactionDecision({
      ...fixture,
      session: { ...fixture.session, parentID: "parent" },
    }).status,
    "skip",
  );
  assert.equal(
    reportedInputCompactionDecision({ ...fixture, messages: fixture.messages.slice(0, 1) }).status,
    "skip",
  );
});
