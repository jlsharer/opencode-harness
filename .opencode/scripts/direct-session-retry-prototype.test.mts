import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildTaskContractExamples } from "./render-task-contract-examples.mts";
import { captureArtifacts, captureWorkspace } from "../src/plugin-modules/acceptance-proof.ts";
import {
  createPrototype,
  auditNativeSource,
  auditNativeToolContract,
} from "./direct-session-retry-prototype.mts";
import * as prototype from "./direct-session-retry-prototype.mts";
import type {
  DirectSessionApi,
  NativeMessage,
  SessionInfo,
} from "./direct-session-retry-prototype.mts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function fixture(run: (f: ReturnType<typeof setup>) => Promise<void>) {
  const root = mkdtempSync(path.join(os.tmpdir(), "direct-session-prototype-"));
  const git = (...args: string[]) =>
    execFileSync("git", ["-C", root, ...args], { stdio: "ignore" });
  git("init");
  writeFileSync(path.join(root, "source.txt"), "before");
  git("add", ".");
  git(
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.invalid",
    "commit",
    "-m",
    "fixture",
  );
  try {
    await run(setup(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function setup(root: string) {
  const example = buildTaskContractExamples().find((x) => x.context.role === "implementer")!;
  const workflow = {
    schemaVersion: "1.0.0",
    routingMetadataStatus: "absent",
    orchestrationId: "prototype",
    goal: "bounded spike",
    deliverables: ["source.txt"],
    nonGoals: ["other writes"],
    allowedPaths: ["source.txt"],
    workUnits: [
      {
        id: "unit",
        goal: "work",
        deliverable: "source.txt",
        nonGoals: ["other writes"],
        allowedPaths: ["source.txt"],
        acceptanceGateIds: ["gate"],
      },
    ],
    acceptanceGates: [
      { id: "gate", criterion: "proof", evidenceCommand: "fixture check", workUnitIds: ["unit"] },
    ],
    roleModeTaskMapping: [
      { workUnitId: "unit", role: "implementer", taskMode: "implementation", boundedTask: "work" },
    ],
    dag: {
      dependencies: [],
      parallelism: {
        mode: "serial",
        authorization: "not-authorized",
        distinctCapacityEvidence: null,
      },
    },
    budgets: { mode: "unbounded" },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
  };
  let now = 0;
  const timers = new Map<() => void, number>();
  const clock = {
    now: () => now,
    schedule(ms: number, callback: () => void) {
      timers.set(callback, now + ms);
      return () => {
        timers.delete(callback);
      };
    },
  };
  const advance = (ms: number) => {
    now += ms;
    for (const [callback, due] of [...timers])
      if (due <= now) {
        timers.delete(callback);
        callback();
      }
  };
  const abort = new AbortController();
  const trusted = {
    sessionID: "parent",
    agent: "primary",
    messageID: "parent-message",
    id: "call-1",
    signal: abort.signal,
  };
  const records = new Map<string, { info: SessionInfo; text: string; promptID: string }>();
  const events: string[] = [];
  let proofFailures = 0;
  let mutate: (messages: NativeMessage[]) => NativeMessage[] = (m) => m;
  const api: DirectSessionApi = {
    async create(input) {
      const id = `child-${records.size + 1}`;
      const info = { id, parentID: input.parentID, agent: input.agent, time: {} };
      records.set(id, { info, text: "", promptID: "" });
      events.push("create:" + id);
      return info;
    },
    async prompt(input) {
      const r = records.get(input.sessionID)!;
      r.promptID = input.id!;
      r.text = input.text;
      events.push("prompt:" + input.sessionID);
      return {
        id: input.id!,
        sessionID: input.sessionID,
        type: "user",
        payload: { text: input.text },
        delivery: "queue",
        time: { created: 1 },
      };
    },
    async wait({ sessionID }) {
      events.push("finalizer:" + sessionID);
      writeFileSync(path.join(root, "source.txt"), sessionID);
      const r = records.get(sessionID)!;
      r.info = { ...r.info, outcome: "succeeded", time: { idle: 2 } };
      events.push("wait:" + sessionID);
    },
    async get({ sessionID }) {
      return records.get(sessionID)!.info;
    },
    async context({ sessionID }) {
      events.push("context:" + sessionID);
      const r = records.get(sessionID)!;
      const packet = JSON.parse(r.text) as Record<string, unknown>;
      const result = {
        ...example.result,
        orchestrationId: packet.orchestrationId,
        delegationTaskId: packet.delegationTaskId,
        scopeKey: packet.scopeKey,
        role: "implementer",
        taskMode: "implementation",
        summary: "UNTRUSTED CHILD TEXT",
      };
      return mutate([
        { id: r.promptID, type: "user", text: r.text, time: { created: 1 } },
        {
          id: "assistant-" + sessionID,
          type: "assistant",
          agent: "implementer",
          content: [{ type: "text", text: JSON.stringify(result) }],
          finish: "stop",
          time: { created: 1, completed: 2 },
        },
        { id: "idle-" + sessionID, type: "idle", outcome: "succeeded", time: { created: 2 } },
      ]);
    },
    async interrupt({ sessionID }) {
      events.push("interrupt:" + sessionID);
      return { interrupted: true };
    },
  };
  const wrapper = createPrototype({
    api,
    root,
    workflow,
    clock,
    parent: { sessionID: "parent", agent: "primary" },
    limits: {
      timeoutMs: 1000,
      reconciliationMs: 30,
      maxAttempts: 2,
      maxContextMessages: 32,
      maxContextBytes: 65536,
    },
    proof({ before, after, taskID }) {
      events.push("proof:" + taskID);
      execFileSync(
        process.execPath,
        [
          "-e",
          "if (!/^child-[12]$/.test(require('node:fs').readFileSync('source.txt','utf8'))) process.exit(1)",
        ],
        { cwd: root },
      );
      const artifacts = captureArtifacts(root, ["source.txt"]);
      return {
        before,
        after,
        current: captureWorkspace(root),
        allowedPaths: ["source.txt"],
        artifacts,
        currentArtifacts: artifacts,
        commands:
          proofFailures-- > 0
            ? []
            : [
                {
                  command: "fixture check",
                  exitCode: 0,
                  treeHash: after.treeHash,
                  taskId: "independent-validator",
                },
              ],
        validatorTaskId: "independent-validator",
      };
    },
  });
  return {
    root,
    api,
    wrapper,
    trusted,
    records,
    events,
    abort,
    example,
    advance,
    elapse(ms: number) {
      now += ms;
    },
    packet: {
      ...example.packet,
      orchestrationId: "prototype",
      scopeKey: "unit",
      delegationTaskId: "ignored-template-id",
      taskMode: "implementation",
    },
    rejectProofOnce() {
      proofFailures = 1;
    },
    mutate(fn: typeof mutate) {
      mutate = fn;
    },
  };
}

test("native context without per-message sessionID accepts after settled wait and real proof", () =>
  fixture(async (f) => {
    const result = await f.wrapper.run(f.trusted, f.packet);
    assert.equal(result.status, "accepted");
    assert.equal(f.wrapper.snapshot().active, 0);
    assert.equal(f.wrapper.snapshot().attempts[0]!.state, "success");
    assert.ok(f.events.indexOf("finalizer:child-1") < f.events.indexOf("context:child-1"));
    assert.equal(readFileSync(path.join(f.root, "source.txt"), "utf8"), "child-1");
    assert.ok(!JSON.stringify(result).includes("UNTRUSTED"));
    assert.deepEqual(Object.keys(result).sort(), ["attempts", "reason", "status"]);
  }));

test("ordinary proof rejection releases only safe settled attempt then creates fresh child/task/prompt", () =>
  fixture(async (f) => {
    f.rejectProofOnce();
    const result = await f.wrapper.run(f.trusted, f.packet);
    assert.equal(result.status, "accepted");
    const attempts = f.wrapper.snapshot().attempts;
    assert.deepEqual(
      attempts.map((a) => a.state),
      ["failed", "success"],
    );
    assert.notEqual(attempts[0]!.id, attempts[1]!.id);
    const records = [...f.records.values()];
    assert.equal(records.length, 2);
    assert.notEqual(records[0]!.promptID, records[1]!.promptID);
    assert.ok(f.events.indexOf("proof:prototype-task-1") < f.events.indexOf("create:child-2"));
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "denied");
  }));

for (const variant of [
  "stale-task",
  "cross-context-prompt-id",
  "cross-context-prompt-text",
  "absent-own-prompt",
  "extra-user",
  "duplicate",
  "failed-idle",
  "failed-final",
  "missing-final",
  "wrong-agent",
  "oversize",
  "malformed",
])
  test("retains reservation and hides all child channels: " + variant, () =>
    fixture(async (f) => {
      f.mutate((m) => {
        const a = m[1]!;
        if (variant === "stale-task")
          a.content![0]!.text = a.content![0]!.text!.replace(/prototype-task-1/g, "old-task");
        if (variant === "cross-context-prompt-id") m[0]!.id = "msg_other_child_prompt";
        if (variant === "cross-context-prompt-text") m[0]!.text = "UNTRUSTED other prompt";
        if (variant === "absent-own-prompt") m.shift();
        if (variant === "extra-user")
          m.splice(1, 0, {
            id: "steer",
            type: "user",
            text: "UNTRUSTED STEER",
          });
        if (variant === "duplicate") m.splice(2, 0, { ...a });
        if (variant === "failed-idle") m[2]!.outcome = "failed";
        if (variant === "failed-final")
          m.splice(2, 0, { ...a, id: "last-assistant", error: { message: "UNTRUSTED error" } });
        if (variant === "missing-final") m.splice(1, 1);
        if (variant === "wrong-agent") a.agent = "planner";
        if (variant === "oversize") a.content![0]!.text = "x".repeat(65537);
        if (variant === "malformed") a.content![0]!.text = "UNTRUSTED malformed";
        return m;
      });
      const result = await f.wrapper.run(f.trusted, f.packet);
      assert.equal(result.status, "stopped");
      assert.equal(f.wrapper.snapshot().active, 1);
      assert.ok(!JSON.stringify(result).includes("UNTRUSTED"));
      assert.ok(!f.events.some((event) => event.startsWith("proof:")));
      assert.equal(f.records.size, 1);
    }),
  );

test("out-of-scope write blocks retry even when proof would reject", () =>
  fixture(async (f) => {
    f.rejectProofOnce();
    const wait = f.api.wait;
    f.api.wait = async (input) => {
      await wait(input);
      writeFileSync(path.join(f.root, "outside.txt"), "scope drift");
    };
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.equal(f.records.size, 1);
  }));

test("cross-parent and caller-supplied authority are denied before native launch", () =>
  fixture(async (f) => {
    assert.equal(
      (await f.wrapper.run({ ...f.trusted, sessionID: "other" }, f.packet)).status,
      "denied",
    );
    assert.equal(
      (await f.wrapper.run(f.trusted, { ...f.packet, sessionID: "parent" })).status,
      "denied",
    );
    assert.equal(f.records.size, 0);
    assert.equal(f.wrapper.snapshot().active, 0);
  }));

test("pending prompt cancellation cannot use early interrupt as wait proof or release capacity", () =>
  fixture(async (f) => {
    const pending = deferred<Awaited<ReturnType<DirectSessionApi["prompt"]>>>();
    const prompt = f.api.prompt;
    let entered!: () => void;
    const entry = new Promise<void>((r) => {
      entered = r;
    });
    f.api.prompt = async (input) => {
      const ack = await prompt(input);
      entered();
      await pending.promise;
      return ack;
    };
    const result = f.wrapper.run(f.trusted, f.packet);
    await entry;
    f.abort.abort();
    assert.equal((await f.wrapper.run({ ...f.trusted, id: "call-2" }, f.packet)).status, "denied");
    await new Promise((r) => setImmediate(r));
    f.advance(30);
    assert.equal((await result).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.ok(f.events.includes("interrupt:child-1"));
    assert.ok(!f.events.includes("wait:child-1"));
    pending.resolve({
      id: "unused",
      sessionID: "child-1",
      type: "user",
      payload: { text: "" },
      delivery: "queue",
      time: { created: 1 },
    });
    await new Promise((r) => setImmediate(r));
    assert.equal(f.wrapper.snapshot().active, 1);
  }));

test("late create stays correlated after timeout with no child at stopped return", () =>
  fixture(async (f) => {
    const pending = deferred<SessionInfo>();
    f.api.create = () => pending.promise;
    const running = f.wrapper.run(f.trusted, f.packet);
    await new Promise((r) => setImmediate(r));
    f.advance(1000);
    await new Promise((r) => setImmediate(r));
    f.advance(30);
    const result = await running;
    assert.equal(result.status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
    pending.resolve({ id: "late-child", parentID: "parent", agent: "implementer", time: {} });
    await new Promise((r) => setImmediate(r));
    assert.ok(f.events.includes("interrupt:late-child"));
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.ok(!f.events.some((e) => e.startsWith("prompt:")));
  }));

test("native failed Session.Info defeats earlier successful assistant and idle text", () =>
  fixture(async (f) => {
    const get = f.api.get;
    f.api.get = async (input) => ({ ...(await get(input)), outcome: "failed" });
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
  }));

test(
  "optional pinned source audit; fixtures alone are not native-source evidence",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const result = auditNativeSource(process.env.DIRECT_SESSION_NATIVE_SOURCE!);
    assert.equal(result.commit, "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824");
    assert.equal(result.source, "committed Git blobs at exact pin");
    const paths = [
      "packages/plugin/src/promise/adapter.ts",
      "packages/plugin/src/promise/plugin.ts",
    ];
    const dirty = execFileSync(
      "git",
      [
        "-C",
        process.env.DIRECT_SESSION_NATIVE_SOURCE!,
        "diff",
        "--name-only",
        result.commit,
        "--",
        ...paths,
      ],
      { encoding: "utf8", maxBuffer: 4194304 },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
    assert.deepEqual(
      result.workingTreeDifferences.filter((file) => paths.includes(file)).sort(),
      dirty.sort(),
    );
  },
);

test("finalizer must settle before any context/proof and successful parent return", () =>
  fixture(async (f) => {
    const done = deferred<void>();
    const wait = f.api.wait;
    f.api.wait = async (input) => {
      await done.promise;
      await wait(input);
    };
    const running = f.wrapper.run(f.trusted, f.packet);
    await new Promise((r) => setImmediate(r));
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.ok(
      !f.events.some((event) => event.startsWith("context:") || event.startsWith("proof:")),
    );
    done.resolve();
    assert.equal((await running).status, "accepted");
  }));

test("stale acknowledgment never authorizes wait or proof", () =>
  fixture(async (f) => {
    const prompt = f.api.prompt;
    f.api.prompt = async (input) => ({ ...(await prompt(input)), id: "stale-prompt" });
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.ok(!f.events.some((event) => event.startsWith("wait:")));
  }));

test("duplicate child on retry stops without prompting the old child twice", () =>
  fixture(async (f) => {
    f.rejectProofOnce();
    const create = f.api.create;
    f.api.create = async (input) =>
      f.records.size ? f.records.get("child-1")!.info : create(input);
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.equal(f.events.filter((e) => e.startsWith("prompt:")).length, 1);
  }));

test("unsupported implementation mode is denied before reservation or native calls", () =>
  fixture(async (f) => {
    const result = await f.wrapper.run(f.trusted, { ...f.packet, taskMode: "integration" });
    assert.equal(result.status, "denied");
    assert.equal(f.wrapper.snapshot().attempts.length, 0);
    assert.equal(f.records.size, 0);
  }));

test("rejected context read rechecks scope and retains reservation", () =>
  fixture(async (f) => {
    f.api.context = async () => {
      writeFileSync(path.join(f.root, "outside.txt"), "drift");
      throw new Error("UNTRUSTED host error");
    };
    const result = await f.wrapper.run(f.trusted, f.packet);
    assert.equal(result.status, "stopped");
    assert.match(result.reason, /scope unsafe/);
    assert.equal(f.wrapper.snapshot().active, 1);
    assert.ok(!JSON.stringify(result).includes("UNTRUSTED"));
  }));

test("audit missing source fails unavailable rather than becoming fixture proof", () => {
  assert.throws(
    () => auditNativeSource("/nonexistent/direct-session-prototype-source"),
    /unavailable/,
  );
});

test("elapsed deadline cannot accept while timer callback is delayed", () =>
  fixture(async (f) => {
    const context = f.api.context;
    f.api.context = async (input) => {
      const messages = await context(input);
      f.elapse(1000);
      return messages;
    };
    assert.equal((await f.wrapper.run(f.trusted, f.packet)).status, "stopped");
    assert.equal(f.wrapper.snapshot().active, 1);
  }));

for (const [label, declaration] of [
  ["invented required session identity", "sessionID: string;"],
  ["invented optional field", "fabricated?: string;"],
  ["variant-only required field", "agent: string;"],
  ["optional native field made required", "metadata: Record<string, unknown>;"],
])
  test(
    "pinned field audit rejects " + label,
    { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
    () => {
      const source = readFileSync(
        new URL("./direct-session-retry-prototype.mts", import.meta.url),
        "utf8",
      );
      const changed =
        declaration === "agent: string;"
          ? source.replace("  agent?: string;", "  agent: string;")
          : source.replace(
              "export interface NativeMessage {",
              "export interface NativeMessage {\n" + declaration,
            );
      assert.notEqual(changed, source, "mutation must apply: " + label);
      assert.throws(
        () => auditNativeSource(process.env.DIRECT_SESSION_NATIVE_SOURCE!, changed),
        /native message projection/,
      );
    },
  );

test(
  "actual production projection agrees with committed public APIs",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const source = readFileSync(
      new URL("../src/plugin-modules/direct-session-transport.ts", import.meta.url),
      "utf8",
    );
    const result = auditNativeSource(process.env.DIRECT_SESSION_NATIVE_SOURCE!, source);
    assert.equal(result.commit, "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824");
    assert.throws(
      () =>
        auditNativeSource(
          process.env.DIRECT_SESSION_NATIVE_SOURCE!,
          source.replace("id?: string | undefined;", "id: string;"),
        ),
      /public API projection/,
    );
    assert.throws(
      () =>
        auditNativeSource(
          process.env.DIRECT_SESSION_NATIVE_SOURCE!,
          source.replace(
            "wait(input: { sessionID: string }): Promise<void>",
            "wait(input: { sessionID: string }): Promise<SessionInfo>",
          ),
        ),
      /public API projection/,
    );
    assert.throws(
      () =>
        auditNativeSource(
          process.env.DIRECT_SESSION_NATIVE_SOURCE!,
          source.replace("readonly messageID: string;", "readonly messageID?: string;"),
        ),
      /caller projection/,
    );
  },
);

for (const [label, before, after] of [
  [
    "context invented session identity",
    "export interface NativeMessage {",
    "export interface NativeMessage {\n  sessionID: string;",
  ],
  [
    "context invented optional field",
    "export interface NativeMessage {",
    "export interface NativeMessage {\n  fabricated?: string;",
  ],
  ["context variant-only field made required", "  agent?: string;", "  agent: string;"],
  [
    "context native optional field made required",
    "export interface NativeMessage {",
    "export interface NativeMessage {\n  metadata: Record<string, unknown>;",
  ],
  ["model variant made required", "variant?: string | undefined;", "variant: string;"],
  [
    "unsupported prompt delivery variant",
    'delivery?: "queue" | "steer" | undefined;',
    'delivery?: "unsupported" | undefined;',
  ],
  [
    "create result adds nonexistent required field",
    "export interface SessionInfo {",
    "export interface SessionInfo {\n  nonexistentRequiredField: string;",
  ],
  ["session optional field made required", "parentID?: string | undefined;", "parentID: string;"],
  ["session nested idle made required", "time: { idle?: unknown };", "time: { idle: unknown };"],
  [
    "model adds nonexistent optional field",
    "export interface DirectModelRef {",
    "export interface DirectModelRef {\n  fabricated?: string;",
  ],
  ["model required identity made optional", "  providerID: string;", "  providerID?: string;"],
  ["prompt result adds field", 'type: "user";', 'type: "user"; fabricated?: string;'],
  [
    "prompt result required identity made optional",
    "    sessionID: string;\n    type:",
    "    sessionID?: string;\n    type:",
  ],
  ["prompt result wrong tag", 'type: "user";', 'type: "synthetic";'],
  ["prompt result widens tag", 'type: "user";', "type: string;"],
  ["prompt result wrong delivery", 'delivery: "queue" | "steer";', 'delivery: "queue";'],
  ["prompt result widens delivery", 'delivery: "queue" | "steer";', "delivery: string;"],
  [
    "prompt payload adds field",
    "payload: { text: string };",
    "payload: { text: string; fabricated: string };",
  ],
  [
    "prompt time adds field",
    "time: { created: unknown };",
    "time: { created: unknown; idle?: unknown };",
  ],
] as const)
  test(
    "pinned production field audit rejects " + label,
    { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
    () => {
      const source = readFileSync(
        new URL("../src/plugin-modules/direct-session-transport.ts", import.meta.url),
        "utf8",
      );
      const changed = source.replace(before, after);
      assert.notEqual(changed, source, "mutation must apply: " + label);
      assert.throws(
        () => auditNativeSource(process.env.DIRECT_SESSION_NATIVE_SOURCE!, changed),
        /projection/,
      );
    },
  );
test(
  "committed ToolEditor and return ordering audit rejects structural mutations",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const read = (file: string) =>
      execFileSync(
        "git",
        [
          "-C",
          process.env.DIRECT_SESSION_NATIVE_SOURCE!,
          "show",
          `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824:${file}`,
        ],
        { encoding: "utf8" },
      );
    const source = {
      tool: read("packages/plugin/src/promise/tool.ts"),
      adapter: read("packages/plugin/src/promise/adapter.ts"),
      core: read("packages/core/src/tool.ts"),
      sessionID: read("packages/schema/src/session-id.ts"),
      message: read("packages/schema/src/session-message.ts"),
    };
    auditNativeToolContract(source);
    for (const [key, before, after, error] of [
      ["tool", "Types.Mutable<Info>", "Readonly<Info>", /ToolEditor/],
      [
        "adapter",
        "executePromiseTool(value, input, context)",
        "executePromiseTool(tool, input, context)",
        /ToolEditor/,
      ],
      [
        "adapter",
        "...context,\n        signal,",
        "...context,\n        wrongSignal: signal,",
        /signal/,
      ],
      [
        "core",
        "{ output: afterEvent.result.output }",
        "{ output: execution.value.output }",
        /ordering/,
      ],
      [
        "core",
        "{ metadata: afterEvent.result.metadata }",
        "{ metadata: execution.value.metadata }",
        /ordering/,
      ],
      ["sessionID", 'Schema.isStartingWith("ses")', 'Schema.isStartingWith("other")', /codec/],
    ] as const) {
      assert.notEqual(source[key].replace(before, after), source[key]);
      assert.throws(
        () => auditNativeToolContract({ ...source, [key]: source[key].replace(before, after) }),
        error,
      );
    }
  },
);

const recoveryPaths = {
  adapter: "packages/plugin/src/promise/adapter.ts",
  tool: "packages/plugin/src/promise/tool.ts",
  coreTool: "packages/core/src/tool.ts",
  sessionDomain: "packages/plugin/src/promise/session.ts",
  pluginContext: "packages/plugin/src/promise/plugin.ts",
  session: "packages/core/src/session/session.ts",
  execution: "packages/core/src/session/execution.ts",
  coordinator: "packages/core/src/session/run-coordinator.ts",
  restart: "packages/core/src/session/execution/restart.ts",
};

function recoverySource() {
  return Object.fromEntries(
    Object.entries(recoveryPaths).map(([key, file]) => [
      key,
      execFileSync(
        "git",
        [
          "-C",
          process.env.DIRECT_SESSION_NATIVE_SOURCE!,
          "show",
          `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824:${file}`,
        ],
        { encoding: "utf8", maxBuffer: 4194304 },
      ),
    ]),
  ) as unknown as prototype.NativeRecoverySource;
}

test("direct recovery source audit rejects missing and oversized pure fields", () => {
  assert.throws(
    () => prototype.auditNativeRecoveryContract({} as prototype.NativeRecoverySource),
    /recovery source/,
  );
  for (const key of Object.keys(recoveryPaths)) {
    const source = Object.fromEntries(
      Object.keys(recoveryPaths).map((name) => [name, "valid bounded text"]),
    );
    delete source[key];
    assert.throws(
      () =>
        prototype.auditNativeRecoveryContract(source as unknown as prototype.NativeRecoverySource),
      /recovery source/,
    );
    source[key] = "x".repeat(4194305);
    assert.throws(
      () =>
        prototype.auditNativeRecoveryContract(source as unknown as prototype.NativeRecoverySource),
      /recovery source/,
    );
  }
});

test(
  "direct recovery source audit rejects structural branch and ordering mutations",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const source = recoverySource();
    prototype.auditNativeRecoveryContract(source);
    prototype.auditNativeRecoveryContract(
      Object.fromEntries(
        Object.entries(source).map(([key, text]) => [key, "// harmless formatting\n" + text]),
      ) as unknown as prototype.NativeRecoverySource,
    );
    for (const [key, before, after] of [
      ["adapter", "error instanceof Tool.Error", "false"],
      ["adapter", "String(error), error", "String(error), error: new Error(String(error))"],
      ["adapter", "catch: toolError", "catch: (error) => error"],
      ["tool", 'readonly status: "error"', 'readonly status: "completed"'],
      ["coreTool", 'Effect.catchTag("Tool.Error",', "Effect.catchCause("],
      ["coreTool", "error: execution.failure", "error: new Error(String(execution.failure))"],
      [
        "coreTool",
        'yield* hooks.trigger("tool", "execute.after", afterEvent)\n        return yield* afterEvent.error',
        'return yield* afterEvent.error\n        yield* hooks.trigger("tool", "execute.after", afterEvent)',
      ],
      ["session", "yield* execution.awaitIdle(sessionID)", "yield* Effect.void"],
      ["session", "yield* execution.wake(sessionID)", "yield* execution.awaitIdle(sessionID)"],
      ["execution", "awaitIdle: coordinator.awaitIdle", "awaitIdle: () => Effect.void"],
      [
        "execution",
        'outcome.reason === "shutdown" ? undefined : releaseOnCommit(sessionID)',
        "releaseOnCommit(sessionID)",
      ],
      ["coordinator", "Effect.andThen(awaitIdle(key))", "Effect.asVoid"],
      ["coordinator", "options.settled?.(key, exit, execution.interruptionReason)", "Effect.void"],
      [
        "coordinator",
        "if (execution.pendingWake) start(key, false, execution.pendingWake)",
        "if (false) start(key, false, execution.pendingWake)",
      ],
      ["restart", "store.listSuspended()", "Effect.succeed([])"],
      ["restart", ".resume(sessionID)", ".awaitIdle(sessionID)"],
      [
        "pluginContext",
        "readonly session: SessionDomain",
        "readonly session: SessionDomain & { epoch: number }",
      ],
      ["sessionDomain", '  | "wait"', '  | "inbox"'],
    ] as const) {
      const changed = source[key].replace(before, after);
      assert.notEqual(changed, source[key], key + " mutation must apply: " + before);
      assert.throws(
        () =>
          prototype.auditNativeRecoveryContract({
            ...source,
            [key]: changed + "\n/* " + before + " */",
          }),
        /recovery source/,
        key + " semantic mutation",
      );
    }
  },
);

test("direct recovery committed reader rejects wrong pin", () => {
  assert.throws(() => auditNativeSource(process.cwd()), /pin mismatch/);
});

test(
  "direct recovery committed reader bounds blob output and missing blobs",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "direct-audit-reader-"));
    const original = process.env.PATH;
    const git = execFileSync("which", ["git"], { encoding: "utf8" }).trim();
    try {
      for (const mode of ["overflow", "missing"]) {
        const script = path.join(root, "git");
        writeFileSync(
          script,
          [
            "#!/usr/bin/env node",
            "const {spawnSync}=require('node:child_process');",
            "const args=process.argv.slice(2);if(args.includes('show')) {",
            mode === "overflow"
              ? "process.stdout.write('x'.repeat(4194305));"
              : "process.exitCode=1;",
            `} else {const r=spawnSync(${JSON.stringify(git)},args,{stdio:'inherit'});process.exitCode=r.status??1;}`,
            "",
          ].join("\n"),
        );
        chmodSync(script, 0o700);
        process.env.PATH = root + path.delimiter + original;
        assert.throws(
          () => auditNativeSource(process.env.DIRECT_SESSION_NATIVE_SOURCE!),
          /unavailable|bounded/,
        );
      }
    } finally {
      process.env.PATH = original;
      rmSync(root, { recursive: true, force: true });
    }
  },
);

test(
  "direct recovery source rejects wake/settlement reordering and unrelated token camouflage",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const source = recoverySource();
    const wake =
      "if (input.resume !== false) yield* execution.wake(sessionID)\n        return admitted";
    const reordered = source.session.replace(
      wake,
      "return admitted\n        if (input.resume !== false) yield* execution.wake(sessionID)",
    );
    assert.notEqual(reordered, source.session);
    assert.throws(
      () => prototype.auditNativeRecoveryContract({ ...source, session: reordered }),
      /recovery source/,
    );
    const successor =
      "if (execution.pendingWake) start(key, false, execution.pendingWake)\n      else executions.delete(key)\n      Deferred.doneUnsafe(execution.done, exit)";
    const earlyDone = source.coordinator.replace(
      successor,
      "Deferred.doneUnsafe(execution.done, exit)\n      if (execution.pendingWake) start(key, false, execution.pendingWake)\n      else executions.delete(key)",
    );
    assert.notEqual(earlyDone, source.coordinator);
    assert.throws(
      () => prototype.auditNativeRecoveryContract({ ...source, coordinator: earlyDone }),
      /recovery source/,
    );
    const camouflage =
      source.adapter.replace("error instanceof Tool.Error", "false") +
      `
      function unrelated(error: unknown) {
        return error instanceof Tool.Error ? error : new Tool.Error({
          message: error instanceof Error ? error.message : String(error), error
        });
      }
    `;
    assert.throws(
      () => prototype.auditNativeRecoveryContract({ ...source, adapter: camouflage }),
      /recovery source/,
    );
  },
);
