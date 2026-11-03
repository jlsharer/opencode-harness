import assert from "node:assert/strict";
import fs, {
  chmodSync,
  linkSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";
import test from "node:test";
import { createDirectSessionLease } from "./direct-session-lease.ts";

function fixture(run: (root: string, traceRoot: string) => void) {
  const root = mkdtempSync("/var/tmp/direct-session-lease-");
  chmodSync(root, 0o700);
  const trace = path.join(root, "trace");
  mkdirSync(trace, { mode: 0o700 });
  try {
    run(root, trace);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const identity = {
  orchestrationId: "run",
  specDigest: "a".repeat(64),
  delegationTaskId: "task",
  parentSessionID: "parent",
  parentAgent: "primary",
  parentMessageID: "message",
  parentCallID: "call",
  childID: "ses_child",
  promptID: "msg_prompt",
  deadline: 1000,
};
test("exclusive fixed lease owner-only before launch blocks competing setup and reload", () =>
  fixture((root, traceRoot) => {
    const first = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const second = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    first.assertClear();
    const lease = first.acquire(identity);
    const marker = path.join(traceRoot, "orchestrations/.direct-session-unresolved.json");
    assert.equal(lstatSync(marker).mode & 0o777, 0o600);
    assert.equal(lstatSync(path.dirname(marker)).mode & 0o777, 0o700);
    assert.equal(JSON.parse(readFileSync(marker, "utf8")).orchestrationId, "run");
    assert.throws(() => second.assertClear());
    assert.throws(() => second.acquire({ ...identity, orchestrationId: "new" }));
    assert.throws(() => createDirectSessionLease({ traceRoot, workspaceRoot: root }).assertClear());
    assert.throws(() => second.release(lease));
    assert.throws(() => first.release({} as typeof lease));
    first.release(lease);
    second.assertClear();
    assert.throws(() => first.release(lease));
  }));
test("completed history has no cumulative cap or enumeration", () =>
  fixture((root, traceRoot) => {
    const parent = path.join(traceRoot, "orchestrations");
    mkdirSync(parent, { mode: 0o700 });
    for (let i = 0; i < 4100; i++) mkdirSync(path.join(parent, `completed-${i}`), { mode: 0o700 });
    const originalStat = fs.lstatSync;
    const originalRead = fs.readdirSync;
    const originalOpen = fs.opendirSync;
    const observed: string[] = [];
    Reflect.set(fs, "lstatSync", ((value: fs.PathLike, ...args: unknown[]) => {
      observed.push(String(value));
      return Reflect.apply(originalStat, fs, [value, ...args]);
    }) as typeof fs.lstatSync);
    fs.readdirSync = (() => {
      throw new Error("history enumeration forbidden");
    }) as typeof fs.readdirSync;
    fs.opendirSync = (() => {
      throw new Error("history enumeration forbidden");
    }) as typeof fs.opendirSync;
    syncBuiltinESMExports();
    try {
      const lease = createDirectSessionLease({ traceRoot, workspaceRoot: root });
      lease.assertClear();
      lease.release(lease.acquire(identity));
      lease.assertClear();
      assert.ok(observed.length < 250);
      assert.ok(!observed.some((value) => value.includes("completed-")));
      assert.ok(observed.includes(path.join(parent, ".direct-session-unresolved.json")));
    } finally {
      Reflect.set(fs, "lstatSync", originalStat);
      fs.readdirSync = originalRead;
      fs.opendirSync = originalOpen;
      syncBuiltinESMExports();
    }
  }));
for (const kind of ["malformed", "symlink", "mode", "hardlink"] as const)
  test("unsafe existing marker fails closed: " + kind, () =>
    fixture((root, traceRoot) => {
      const parent = path.join(traceRoot, "orchestrations");
      mkdirSync(parent, { mode: 0o700 });
      const marker = path.join(parent, ".direct-session-unresolved.json");
      if (kind === "symlink") symlinkSync(path.join(root, "missing"), marker);
      else writeFileSync(marker, "malformed", { mode: kind === "mode" ? 0o644 : 0o600 });
      if (kind === "hardlink") linkSync(marker, marker + ".linked");
      assert.throws(() =>
        createDirectSessionLease({ traceRoot, workspaceRoot: root }).assertClear(),
      );
    }),
  );
test("cleanup permission failure retains original marker", () =>
  fixture((root, traceRoot) => {
    const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const lease = manager.acquire(identity);
    const parent = path.join(traceRoot, "orchestrations");
    const marker = path.join(parent, ".direct-session-unresolved.json");
    const bytes = readFileSync(marker, "utf8");
    chmodSync(parent, 0o500);
    assert.throws(() => manager.release(lease));
    assert.equal(readFileSync(marker, "utf8"), bytes);
    chmodSync(parent, 0o700);
  }));
test("replacement marker and parent never deleted on failed release", () =>
  fixture((root, traceRoot) => {
    const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const lease = manager.acquire(identity);
    const parent = path.join(traceRoot, "orchestrations");
    const marker = path.join(parent, ".direct-session-unresolved.json");
    renameSync(marker, marker + ".old");
    writeFileSync(marker, "replacement", { mode: 0o600 });
    assert.throws(() => manager.release(lease));
    assert.equal(readFileSync(marker, "utf8"), "replacement");
    renameSync(parent, parent + ".old");
    mkdirSync(parent, { mode: 0o700 });
    writeFileSync(marker, "other", { mode: 0o600 });
    assert.throws(() => manager.release(lease));
    assert.equal(readFileSync(marker, "utf8"), "other");
  }));
test("changed marker bytes retain evidence and symlink roots are rejected", () =>
  fixture((root, traceRoot) => {
    const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const lease = manager.acquire(identity);
    const marker = path.join(traceRoot, "orchestrations/.direct-session-unresolved.json");
    writeFileSync(marker, "changed", { mode: 0o600 });
    assert.throws(() => manager.release(lease));
    assert.equal(readFileSync(marker, "utf8"), "changed");
    const alias = path.join(root, "alias");
    symlinkSync(traceRoot, alias);
    assert.throws(() => createDirectSessionLease({ traceRoot: alias, workspaceRoot: root }));
    assert.throws(() =>
      createDirectSessionLease({ traceRoot: traceRoot + "/", workspaceRoot: root }),
    );
  }));

test("owned lease assertion validates without removing or consuming its marker", () =>
  fixture((root, traceRoot) => {
    const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const lease = manager.acquire(identity);
    const marker = path.join(traceRoot, "orchestrations/.direct-session-unresolved.json");
    const before = lstatSync(marker);
    const bytes = readFileSync(marker, "utf8");
    manager.assertClear(lease);
    manager.assertClear(lease);
    assert.equal(lstatSync(marker).ino, before.ino);
    assert.equal(readFileSync(marker, "utf8"), bytes);
    assert.throws(() => manager.assertClear(), /unresolved/);
    manager.release(lease);
    manager.assertClear();
    assert.throws(() => manager.assertClear(lease), /unowned/);
  }));
test("owned lease assertion rejects forged and foreign tokens even without a marker", () =>
  fixture((root, traceRoot) => {
    const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    const other = createDirectSessionLease({ traceRoot, workspaceRoot: root });
    assert.throws(() => manager.assertClear({} as ReturnType<typeof manager.acquire>), /unowned/);
    const lease = manager.acquire(identity);
    assert.throws(() => other.assertClear(lease), /unowned/);
    manager.assertClear(lease);
    manager.release(lease);
  }));
for (const kind of ["bytes", "mode", "inode", "parent", "parent-mode", "root"] as const)
  test("owned lease assertion rejects tampering and retains evidence: " + kind, () =>
    fixture((root, traceRoot) => {
      const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
      const lease = manager.acquire(identity);
      const parent = path.join(traceRoot, "orchestrations");
      const marker = path.join(parent, ".direct-session-unresolved.json");
      const bytes = readFileSync(marker, "utf8");
      if (kind === "bytes") writeFileSync(marker, "changed", { mode: 0o600 });
      if (kind === "mode") chmodSync(marker, 0o644);
      if (kind === "inode") {
        renameSync(marker, marker + ".old");
        writeFileSync(marker, bytes, { mode: 0o600 });
      }
      if (kind === "parent") {
        renameSync(parent, parent + ".old");
        mkdirSync(parent, { mode: 0o700 });
        writeFileSync(marker, bytes, { mode: 0o600 });
      }
      if (kind === "parent-mode") chmodSync(parent, 0o500);
      if (kind === "root") chmodSync(traceRoot, 0o750);
      assert.throws(() => manager.assertClear(lease));
      assert.equal(readFileSync(marker, "utf8"), kind === "bytes" ? "changed" : bytes);
      if (kind === "parent-mode") chmodSync(parent, 0o700);
      if (kind === "root") chmodSync(traceRoot, 0o700);
    }),
  );

for (const stage of ["before unlink", "after unlink", "after replacement"] as const)
  test(`recovery cleanup failure ${stage}`, () =>
    fixture((root, traceRoot) => {
      const manager = createDirectSessionLease({ traceRoot, workspaceRoot: root });
      const lease = manager.acquire(identity);
      const marker = path.join(traceRoot, "orchestrations/.direct-session-unresolved.json");
      const original = fs.unlinkSync;
      fs.unlinkSync = ((filename) => {
        if (String(filename) !== marker) return original(filename);
        if (stage !== "before unlink") original(filename);
        if (stage === "after replacement") writeFileSync(marker, "replacement", { mode: 0o600 });
        throw new Error("injected cleanup failure");
      }) as typeof fs.unlinkSync;
      syncBuiltinESMExports();
      try {
        assert.throws(
          () => manager.release(lease),
          (error: unknown) => {
            const diagnostic = error as Error & { markerPath: string; markerState: string };
            assert.equal(diagnostic.name, "DirectLeaseCleanupError");
            assert.equal(diagnostic.markerPath, marker);
            assert.equal(diagnostic.markerState, stage === "after unlink" ? "missing" : "present");
            return true;
          },
        );
      } finally {
        fs.unlinkSync = original;
        syncBuiltinESMExports();
      }
    }));
