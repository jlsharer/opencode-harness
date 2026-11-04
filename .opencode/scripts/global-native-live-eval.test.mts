import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import plugin, {
  createGlobalNativeLiveEval,
  auditGlobalLiveEvalNativeContract,
} from "./global-native-live-eval.mts";
import type {
  EvalNativeContext,
  EvalTool,
  EvalNativeToolContext,
  EvalSnapshot,
} from "./global-native-live-eval.mts";
import type { NativeEvent } from "../src/plugin-modules/global-native-plugin.ts";
import {
  formatTaskThreadEnvelope,
  TASK_THREAD_ROLE_PACKET_FIELDS,
} from "../src/plugin-modules/task-thread-policy.ts";
import type { TaskThreadRole } from "../src/plugin-modules/task-thread-policy.ts";
import { TASK_MODES } from "../src/plugin-modules/task-contracts.ts";
import type { TaskContext } from "../src/plugin-modules/task-contracts.ts";

function workflow() {
  return {
    schemaVersion: "1.0.0",
    routingMetadataStatus: "absent",
    orchestrationId: "run",
    goal: "Verify declared file",
    deliverables: ["a.txt"],
    nonGoals: ["other work"],
    allowedPaths: ["a.txt"],
    workUnits: [
      {
        id: "unit",
        goal: "inspect",
        deliverable: "evidence",
        nonGoals: ["other"],
        allowedPaths: ["a.txt"],
        acceptanceGateIds: ["gate"],
      },
    ],
    acceptanceGates: [
      {
        id: "gate",
        criterion: "file checks pass",
        evidenceCommand: "node --test",
        workUnitIds: ["unit"],
      },
    ],
    roleModeTaskMapping: [
      { workUnitId: "unit", role: "researcher", taskMode: "research", boundedTask: "inspect" },
      {
        workUnitId: "unit",
        role: "validator",
        taskMode: "validation",
        boundedTask: "independent validation",
      },
    ],
    dag: {
      dependencies: [],
      parallelism: {
        mode: "serial",
        authorization: "not-authorized",
        distinctCapacityEvidence: null,
      },
    },
    budgets: {
      defaultRemediationCyclesPerWorkUnit: 1,
      maxRemediationCyclesPerWorkUnit: 1,
      maxTotalLeafAgents: 6,
      maxLeafAgentsByRole: { researcher: 2, planner: 0, implementer: 2, validator: 2 },
    },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
  };
}

function packet(role: TaskThreadRole = "researcher", id = "task") {
  const values: Record<string, unknown> = {
    orchestrationId: "run",
    delegationTaskId: id,
    scopeKey: "unit",
    dispatchKind: "fresh",
    taskMode: TASK_MODES[role][0],
    routingMetadataStatus: "absent",
    scopedQuestion: "Find evidence",
    freshnessRequirements: "current",
    downstreamNeeds: "acceptance",
    acceptanceStandard: "check file",
    approvedGoal: "inspect file",
    approvedPlan: "approved",
  };
  return Object.fromEntries(
    TASK_THREAD_ROLE_PACKET_FIELDS[role].required.map((k) => [k, values[k] ?? ["bounded input"]]),
  );
}

const context: TaskContext = {
  orchestrationId: "run",
  delegationTaskId: "task",
  scopeKey: "unit",
  role: "researcher",
  taskMode: "research",
};

const nativeContext = (sessionID = "parent", id = "control"): EvalNativeToolContext => ({
  sessionID,
  agent: sessionID === "parent" ? "build" : "researcher",
  messageID: "message-" + id,
  id,
  signal: new AbortController().signal,
  progress: async () => {},
});

function result(outcome = "clarification") {
  const text = JSON.stringify({
    ...context,
    version: 1,
    outcome,
    summary: "Need decision",
    evidence: [],
    artifacts: [],
    requestNonce: "nonce",
    question: "Which file?",
  });
  return {
    output: { sessionID: "child", status: "completed", output: text },
    content: `<subagent sessionID="child" state="completed">\n${text}\n</subagent>`,
    metadata: { sessionID: "child", status: "completed" },
  };
}

async function host(t: { after(fn: () => unknown): void }, timeoutMs = 1000) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "gn-fixture-"));
  fs.writeFileSync(path.join(cwd, "a.txt"), "evidence");
  const sessions = new Map([
    ["parent", { id: "parent", agent: "build", location: { directory: cwd } }],
    [
      "child",
      { id: "child", agent: "researcher", parentID: "parent", location: { directory: cwd } },
    ],
  ]);
  const tools = new Map<string, EvalTool>();
  const hooks = new Map<string, (event: NativeEvent) => Promise<void>>();
  let subscribed = false;
  let closed = false;
  let wake: ((v: IteratorResult<{ type: string; data: unknown }>) => void) | undefined;
  const queue: { type: string; data: unknown }[] = [];
  let liveRegistrations = 0;
  const registration = (cleanup = () => {}) => {
    liveRegistrations++;
    let live = true;
    return {
      dispose: async () => {
        if (live) {
          live = false;
          liveRegistrations--;
          cleanup();
        }
      },
    };
  };
  let lookup: (() => Promise<void>) | null = null;
  const ctx: EvalNativeContext = {
    location: { directory: cwd },
    options: { evaluationRoot: cwd, traceRoot: path.join(cwd, "trace") },
    plugin: { list: async () => [] },
    session: {
      get: async ({ sessionID }) => {
        await lookup?.();
        const s = sessions.get(sessionID);
        if (!s) throw Error("missing session");
        return structuredClone(s);
      },
      hook: async () => registration(),
    },
    tool: {
      transform: async (fn) => {
        const added: string[] = [];
        fn({
          add: (d) => {
            added.push(d.name);
            tools.set(d.name, d as EvalTool);
          },
        });
        return registration(() => {
          for (const name of added) tools.delete(name);
        });
      },
      hook: async (name, fn) => {
        hooks.set(name, fn);
        return registration(() => {
          if (hooks.get(name) === fn) hooks.delete(name);
        });
      },
      list: async () => [
        { id: "subagent", execute: async () => ({}) },
        ...Array.from(tools.values(), (v) => ({
          id: v.name,
          execute: async (input: unknown, context: Record<string, unknown>) =>
            v.execute(input, context as EvalNativeToolContext),
        })),
      ],
    },
    command: { transform: async () => registration() },
    event: {
      subscribe: ({ signal }) => {
        subscribed = true;
        signal.addEventListener(
          "abort",
          () => {
            closed = true;
            wake?.({ done: true, value: undefined });
          },
          { once: true },
        );
        return {
          [Symbol.asyncIterator]() {
            return {
              next: async () =>
                queue.length
                  ? { done: false, value: queue.shift()! }
                  : closed
                    ? { done: true, value: undefined }
                    : new Promise((r) => {
                        wake = r;
                      }),
            };
          },
        };
      },
    },
  };

  function emit(type: string, data: unknown) {
    const e = { type, data };
    if (wake) {
      const r = wake;
      wake = undefined;
      r({ done: false, value: e });
    } else queue.push(e);
  }

  const driver = await createGlobalNativeLiveEval(ctx, {
    traceRoot: path.join(cwd, "trace"),
    timeoutMs,
  });
  t.after(async () => {
    await driver.dispose();
    fs.rmSync(cwd, { recursive: true, force: true });
  });
  const control = async (input: unknown) =>
    tools.get("harness_orchestration")!.execute(input, nativeContext());
  await control({ version: 1, action: "orchestration.admit", spec: workflow() });
  const event: NativeEvent = {
    tool: "subagent",
    sessionID: "parent",
    agent: "build",
    messageID: "fresh-message",
    id: "fresh-call",
    input: {
      agent: "researcher",
      description: "inspect",
      prompt: formatTaskThreadEnvelope({
        version: 1,
        kind: "fresh",
        role: "researcher",
        packet: packet(),
      }),
      background: false,
    },
  };
  const before = async (e: NativeEvent) => hooks.get("execute.before")!(e);
  const after = async (e: NativeEvent) => hooks.get("execute.after")!(e);

  async function clarify() {
    await before(event);
    event.status = "completed";
    event.result = result();
    await after(event);
    assert.equal((event.result as { metadata: { status: string } }).metadata.status, "completed");
  }

  const arm = async (
    mode: "continuation-rendezvous" | "completed-after-hold" = "continuation-rendezvous",
    controlVersion: 1 | 2 = 1,
  ) =>
    (
      await tools.get("harness_eval_control")!.execute(
        {
          action: "arm",
          mode,
          controlVersion,
          context,
          childSessionID: "child",
          requestNonce: "nonce",
        },
        nativeContext(),
      )
    ).output as EvalSnapshot;

  async function continuation(
    mode: "continuation-rendezvous" | "completed-after-hold" = "continuation-rendezvous",
    version: 1 | 2 = 1,
  ) {
    await clarify();
    const armed = await arm(mode, version);
    const e = {
      ...event,
      id: "continue-call",
      messageID: "continue-message",
      input: {
        agent: "researcher",
        description: "continue",
        prompt: armed.continuationPrompt,
        sessionID: "child",
        background: false,
      },
    };
    await before(e);
    return { armed, e };
  }

  const progress = (e: NativeEvent) =>
    emit("session.tool.progress", {
      sessionID: e.sessionID,
      assistantMessageID: e.messageID,
      id: e.id,
      metadata: { sessionID: "child", status: "running" },
    });
  return {
    ctx,
    driver,
    tools,
    sessions,
    event,
    before,
    after,
    clarify,
    arm,
    continuation,
    progress,
    emit,
    control,
    subscribed: () => subscribed,
    closed: () => closed,
    liveRegistrations: () => liveRegistrations,
    lookup: (fn: (() => Promise<void>) | null) => {
      lookup = fn;
    },
    close: () => {
      closed = true;
      wake?.({ done: true, value: undefined });
    },
  };
}

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

async function observedSettlement(operation: Promise<unknown>, milliseconds = 150) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation.then(
        () => "resolved",
        (error: unknown) => String(error),
      ),
      new Promise<string>((resolve) => {
        timer = setTimeout(() => resolve("still pending"), milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

test("FIXTURE armed before wait expires and retains ownership until real admission settles", async (t) => {
  const f = await host(t, 35);
  await f.clarify();
  const armed = await f.arm();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.lookup(() => blocked);
  const before = f.before({
    ...f.event,
    id: "blocked-continuation",
    messageID: "blocked-message",
    input: {
      agent: "researcher",
      description: "continue",
      prompt: armed.continuationPrompt,
      sessionID: "child",
      background: false,
    },
  });
  try {
    const outcome = await observedSettlement(before);
    await f.driver.dispose();
    assert.match(outcome, /deadline|timeout/);
    assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
    assert.ok(f.liveRegistrations() > 0, "pending authoritative before retains registrations");
  } finally {
    f.lookup(null);
    release();
    assert.notEqual(await observedSettlement(before), "resolved", "late admission cannot launch");
    assert.equal(
      await observedSettlement(
        (async () => {
          for (let i = 0; i < 80 && f.liveRegistrations(); i++)
            await new Promise((resolve) => setTimeout(resolve, 5));
          assert.equal(f.liveRegistrations(), 0);
        })(),
        500,
      ),
      "resolved",
      "real admission and its trace writes eventually settle",
    );
  }
  assert.equal(f.liveRegistrations(), 0, "settled authoritative work permits resource cleanup");
  assert.equal(f.driver.snapshot().cancellation, null);
});

for (const action of ["status", "arm"] as const) {
  for (const active of [false, true]) {
    if (active && action === "arm") continue;
    test(`FIXTURE eval ${action} initial lookup is bounded with active=${active}`, async (t) => {
      const f = await host(t, 35);
      if (active) await f.continuation();
      else if (action === "arm") await f.clarify();
      let release!: () => void;
      const blocked = new Promise<void>((resolve) => {
        release = resolve;
      });
      f.lookup(() => blocked);
      const operation =
        action === "arm"
          ? f.arm()
          : f.tools.get("harness_eval_control")!.execute({ action }, nativeContext());
      try {
        const outcome = await observedSettlement(operation);
        await f.driver.dispose();
        assert.match(outcome, /deadline|timeout/);
        assert.ok(f.liveRegistrations() > 0, "pending initial lookup retains ownership");
      } finally {
        f.lookup(null);
        release();
        assert.notEqual(await observedSettlement(operation), "resolved");
        await tick();
        await tick();
      }
      assert.equal(f.liveRegistrations(), 0);
      if (!active) assert.equal(f.driver.snapshot().attemptID, null, "late lookup cannot arm");
      assert.equal(f.driver.snapshot().cancellation, null);
    });
  }

  for (const preAborted of [false, true]) {
    test(`FIXTURE eval ${action} initial lookup observes abort preAborted=${preAborted}`, async (t) => {
      const f = await host(t, 1000);
      if (action === "arm") await f.clarify();
      let release!: () => void;
      const blocked = new Promise<void>((resolve) => {
        release = resolve;
      });
      f.lookup(() => blocked);
      const controller = new AbortController();
      if (preAborted) controller.abort();
      const c = { ...nativeContext(), signal: controller.signal };
      const input =
        action === "status"
          ? { action }
          : {
              action,
              mode: "continuation-rendezvous",
              controlVersion: 1,
              context,
              childSessionID: "child",
              requestNonce: "nonce",
            };
      const operation = f.tools.get("harness_eval_control")!.execute(input, c);
      if (!preAborted) {
        await tick();
        controller.abort();
      }
      try {
        assert.match(await observedSettlement(operation), /abort/);
      } finally {
        f.lookup(null);
        release();
        assert.notEqual(await observedSettlement(operation), "resolved");
      }
      assert.equal(f.driver.snapshot().attemptID, null);
    });
  }
}

test("FIXTURE eval arm abort during later identity lookup cannot create an attempt", async (t) => {
  const f = await host(t, 1000);
  await f.clarify();
  const controller = new AbortController();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  let entered!: () => void;
  const waiting = new Promise<void>((resolve) => {
    entered = resolve;
  });
  f.lookup(async () => {
    if (++calls > 1) {
      entered();
      await blocked;
    }
  });
  const operation = f.tools.get("harness_eval_control")!.execute(
    {
      action: "arm",
      mode: "continuation-rendezvous",
      controlVersion: 1,
      context,
      childSessionID: "child",
      requestNonce: "nonce",
    },
    { ...nativeContext(), signal: controller.signal },
  );
  await waiting;
  controller.abort();
  try {
    assert.match(await observedSettlement(operation), /abort/);
  } finally {
    f.lookup(null);
    release();
    await tick();
  }
  assert.equal(f.driver.snapshot().attemptID, null);
});

test("FIXTURE direct arm has a finite deadline and cannot create a late attempt", async (t) => {
  const f = await host(t, 35);
  await f.clarify();
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.lookup(() => blocked);
  const operation = f.driver.arm(
    {
      mode: "continuation-rendezvous",
      controlVersion: 1,
      context,
      childSessionID: "child",
      requestNonce: "nonce",
    },
    "parent",
  );
  try {
    assert.match(await observedSettlement(operation), /deadline|timeout/);
    await f.driver.dispose();
    assert.ok(f.liveRegistrations() > 0);
  } finally {
    f.lookup(null);
    release();
    assert.notEqual(await observedSettlement(operation), "resolved");
    await tick();
  }
  assert.equal(f.driver.snapshot().attemptID, null);
});

test("FIXTURE eval arm shares one deadline across initial and later identity lookups", async (t) => {
  const f = await host(t, 200);
  await f.clarify();
  let releaseFirst!: () => void;
  let releaseLater!: () => void;
  const first = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  const later = new Promise<void>((resolve) => {
    releaseLater = resolve;
  });
  let calls = 0;
  f.lookup(() => (++calls === 1 ? first : later));
  const operation = f.arm();
  const timer = setTimeout(releaseFirst, 140);
  try {
    assert.match(await observedSettlement(operation, 280), /deadline|timeout/);
  } finally {
    clearTimeout(timer);
    f.lookup(null);
    releaseFirst();
    releaseLater();
    assert.notEqual(await observedSettlement(operation), "resolved");
  }
  assert.equal(f.driver.snapshot().attemptID, null);
});

function json(value: unknown): void {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) {
    value.forEach(json);
    return;
  }
  assert.equal(typeof value, "object");
  assert.ok(value);
  Object.values(value).forEach(json);
}

test("FIXTURE refuses arm before authentic registered clarification", async (t) => {
  const f = await host(t);
  await assert.rejects(f.arm(), /clarification/);
  assert.equal(f.subscribed(), true);
});
for (const version of [1, 2] as const)
  test(`FIXTURE control ${version} cancels during owned pending native rendezvous and rejects natural late callback`, async (t) => {
    const f = await host(t);
    const { armed, e } = await f.continuation("continuation-rendezvous", version);
    f.progress(e);
    await tick();
    const promise = f.tools
      .get("harness_eval_rendezvous")!
      .execute(
        { attemptID: armed.attemptID, token: armed.token },
        nativeContext("child", "rendezvous"),
      );
    await promise;
    const cancelled = f.driver.snapshot();
    json(cancelled);
    assert.deepEqual(cancelled.cancellation, {
      output: { childID: "child", termination: "unconfirmed" },
      content: '{"childID":"child","termination":"unconfirmed"}',
    });
    e.status = "completed";
    e.result = result("success");
    await f.after(e);
    const snap = f.driver.snapshot();
    assert.equal(snap.diagnostic, "OBSERVED");
    assert.equal((e.result as { metadata: { harness: string } }).metadata.harness, "rejected");
    await assert.rejects(
      f.control({ version: 2, action: "orchestration.accept", orchestrationId: "run" }),
    );
    const status = await f.control({ version: 2, action: "status" });
    assert.match(JSON.stringify(status), /"accepted":false/);
    assert.match(JSON.stringify(status), /"acceptanceDigest":null/);
    assert.match(JSON.stringify(status), /termination uncertain/);
    await assert.rejects(
      f.control({
        version: 2,
        action: "retire",
        orchestrationId: "run",
        acceptanceDigest: "a".repeat(64),
      }),
    );
    await assert.rejects(f.before({ ...e, id: "reuse" }));
  });
test("FIXTURE completed hold cancels outside adapter queue and releases original event unchanged", async (t) => {
  const f = await host(t);
  const { e } = await f.continuation("completed-after-hold");
  e.status = "completed";
  e.result = result("success");
  await f.after(e);
  const snap = f.driver.snapshot();
  assert.equal(snap.diagnostic, "OBSERVED");
  assert.equal(snap.callbackBeforeHash, snap.callbackReleaseHash);
  assert.match(JSON.stringify(snap.result), /rejected/);
});
test("FIXTURE stale execution event and wrong progress cannot make ready", async (t) => {
  const f = await host(t, 30);
  const { armed, e } = await f.continuation();
  f.emit("session.execution.started", { sessionID: "child" });
  f.progress({ ...e, id: "old-call" });
  await tick();
  await assert.rejects(
    f.tools
      .get("harness_eval_rendezvous")!
      .execute(
        { attemptID: armed.attemptID, token: armed.token },
        nativeContext("child", "rendezvous"),
      ),
    /progress|boundary/,
  );
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
  assert.equal(f.driver.snapshot().cancellation, null);
});
test("FIXTURE wrong nonce, parent, task and duplicate arm fail closed", async (t) => {
  const f = await host(t);
  await f.clarify();
  for (const change of [
    { requestNonce: "wrong" },
    { context: { ...context, delegationTaskId: "other" } },
    { childSessionID: "other" },
  ])
    await assert.rejects(
      f.driver.arm(
        {
          mode: "continuation-rendezvous",
          controlVersion: 1,
          context,
          childSessionID: "child",
          requestNonce: "nonce",
          ...change,
        },
        "parent",
      ),
    );
  await assert.rejects(
    f.driver.arm(
      {
        mode: "continuation-rendezvous",
        controlVersion: 1,
        context,
        childSessionID: "child",
        requestNonce: "nonce",
      },
      "child",
    ),
  );
  await f.arm();
  await assert.rejects(f.arm(), /active|attempt/);
});
test("FIXTURE native child identity movement blocks cancellation", async (t) => {
  const f = await host(t);
  const { armed, e } = await f.continuation();
  f.progress(e);
  await tick();
  f.sessions.get("child")!.agent = "validator";
  await assert.rejects(
    f.tools
      .get("harness_eval_rendezvous")!
      .execute(
        { attemptID: armed.attemptID, token: armed.token },
        nativeContext("child", "rendezvous"),
      ),
  );
  assert.equal(f.driver.snapshot().cancellation, null);
});
test("FIXTURE pre-aborted rendezvous and repeated dispose settle without cancellation", async (t) => {
  const f = await host(t);
  const { armed, e } = await f.continuation();
  f.progress(e);
  await tick();
  const c = nativeContext("child", "rendezvous");
  const controller = new AbortController();
  controller.abort();
  c.signal = controller.signal;
  await assert.rejects(
    f.tools
      .get("harness_eval_rendezvous")!
      .execute({ attemptID: armed.attemptID, token: armed.token }, c),
  );
  await f.driver.dispose();
  await f.driver.dispose();
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
});
test("FIXTURE default entry rejects duplicate ownership and missing isolated options", async (t) => {
  const f = await host(t);
  await assert.rejects(plugin.setup({ ...f.ctx, options: {} }));
  await assert.rejects(plugin.setup(f.ctx), /own|duplicate|adapter|control/);
});

for (const mode of ["continuation-rendezvous", "completed-after-hold"] as const)
  test(`FIXTURE ${mode} timeout during native lookup settles owned wait`, async (t) => {
    const f = await host(t, 40);
    const { armed, e } = await f.continuation(mode);
    f.progress(e);
    await tick();
    f.lookup(() => new Promise(() => {}));
    if (mode === "continuation-rendezvous")
      await assert.rejects(
        f.tools
          .get("harness_eval_rendezvous")!
          .execute(
            { attemptID: armed.attemptID, token: armed.token },
            nativeContext("child", "rendezvous"),
          ),
        /deadline/,
      );
    else {
      e.status = "completed";
      e.result = result("success");
      await assert.rejects(
        Promise.race([
          f.after(e),
          new Promise((_, reject) =>
            setTimeout(() => reject(Error("owned after wait did not settle")), 150),
          ),
        ]),
        /authoritative native after unresolved/,
      );
    }
    assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
    f.lookup(null);
  });
test("FIXTURE cleanup disposes actual host registrations and subscription", async (t) => {
  const f = await host(t);
  await f.driver.dispose();
  await tick();
  assert.equal(f.liveRegistrations(), 0);
  assert.equal(f.closed(), true);
  assert.equal(f.tools.has("harness_orchestration"), false);
});
test("FIXTURE default native entry loads one adapter and both eval tools with cleanup", async (t) => {
  const f = await host(t);
  await f.driver.dispose();
  const cleanup = await plugin.setup(f.ctx);
  assert.equal(typeof cleanup, "function");
  assert.deepEqual([...f.tools.keys()].sort(), [
    "harness_eval_control",
    "harness_eval_rendezvous",
    "harness_orchestration",
  ]);
  await cleanup();
  assert.equal(f.liveRegistrations(), 0);
});
test("FIXTURE duplicate exact progress prevents cancellation", async (t) => {
  const f = await host(t);
  const { armed, e } = await f.continuation();
  f.progress(e);
  f.progress(e);
  await tick();
  await assert.rejects(
    f.tools
      .get("harness_eval_rendezvous")!
      .execute(
        { attemptID: armed.attemptID, token: armed.token },
        nativeContext("child", "rendezvous"),
      ),
  );
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
  assert.equal(f.driver.snapshot().cancellation, null);
});
test("FIXTURE wrong token and wrong child cannot consume valid one-use rendezvous", async (t) => {
  const f = await host(t);
  const { armed, e } = await f.continuation();
  f.progress(e);
  await tick();
  const tool = f.tools.get("harness_eval_rendezvous")!;
  await assert.rejects(
    tool.execute(
      { attemptID: armed.attemptID, token: "wrong" },
      nativeContext("child", "rendezvous"),
    ),
  );
  await assert.rejects(
    tool.execute(
      { attemptID: armed.attemptID, token: armed.token },
      nativeContext("parent", "rendezvous"),
    ),
  );
  await tool.execute(
    { attemptID: armed.attemptID, token: armed.token },
    nativeContext("child", "rendezvous"),
  );
  await assert.rejects(
    tool.execute(
      { attemptID: armed.attemptID, token: armed.token },
      nativeContext("child", "again"),
    ),
  );
});
for (const kind of ["payload", "observations", "subscription"] as const)
  test(`FIXTURE ${kind} loss/overflow is INCONCLUSIVE`, async (t) => {
    const f = await host(t);
    await f.continuation();
    if (kind === "subscription") f.close();
    else if (kind === "payload") f.emit("fixture", { text: "x".repeat(65537) });
    else for (let i = 0; i < 260; i++) f.emit("fixture", { i });
    await tick();
    await tick();
    assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
    assert.ok(f.driver.snapshot().observations.length <= 256);
  });
test("FIXTURE ordinary tools and unrelated after payloads remain untouched", async (t) => {
  const f = await host(t);
  const e: NativeEvent = {
    ...f.event,
    tool: "read",
    input: { file: "a.txt" },
    status: "completed",
    result: { output: "ordinary" },
  };
  const before = structuredClone(e);
  await f.before(e);
  await f.after(e);
  assert.deepEqual(e, before);
  assert.equal(f.driver.snapshot().observations.length, 0);
});
test("FIXTURE evaluation expiry leaves unrelated native subagents ordinary", async (t) => {
  const f = await host(t, 35);
  await f.continuation();
  await new Promise((resolve) => setTimeout(resolve, 45));
  const e: NativeEvent = {
    ...f.event,
    id: "ordinary-call",
    input: { agent: "explore", description: "ordinary", prompt: "ordinary native task" },
  };
  const original = structuredClone(e);
  await f.before(e);
  assert.deepEqual(e, original);
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
  await assert.rejects(
    f.before({ ...f.event, id: "unrelated-managed", messageID: "unrelated-message" }),
    /terminal or duplicate task/,
    "another managed dispatch retains its real admission rejection",
  );
});
test("FIXTURE malformed selected result and duplicate callback never become observed success", async (t) => {
  const f = await host(t);
  const { e } = await f.continuation("completed-after-hold");
  e.status = "completed";
  e.result = { ...result(), output: { sessionID: "wrong" } };
  await f.after(e);
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
  assert.match(JSON.stringify(e.result), /rejected/);
  await f.after(e);
  assert.equal(f.driver.snapshot().diagnostic, "INCONCLUSIVE");
});
const nativeSourceFiles = [
  "packages/plugin/src/promise/plugin.ts",
  "packages/plugin/src/promise/tool.ts",
  "packages/plugin/src/promise/event.ts",
  "packages/plugin/src/promise/registration.ts",
  "packages/plugin/src/promise/adapter.ts",
  "packages/schema/src/tool.ts",
  "packages/schema/src/event.ts",
  "packages/schema/src/session-event.ts",
  "packages/core/src/tool.ts",
  "packages/core/src/tool/plugin/subagent.ts",
  "packages/core/src/plugin/module.ts",
  "packages/plugin/src/host.ts",
  "packages/plugin/src/source.ts",
  "packages/core/src/session/runner/publish-llm-event.ts",
];
test(
  "ARTIFACT pinned Git blobs satisfy source contract, with mutation negatives",
  { skip: !process.env.DIRECT_SESSION_NATIVE_SOURCE },
  () => {
    const root = process.env.DIRECT_SESSION_NATIVE_SOURCE!;
    const commit = "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824";
    const source = Object.fromEntries(
      nativeSourceFiles.map((file) => {
        const r = spawnSync("git", ["-C", root, "show", commit + ":" + file], { encoding: "utf8" });
        assert.equal(r.status, 0, r.stderr);
        return [file, r.stdout];
      }),
    );
    auditGlobalLiveEvalNativeContract(source);
    for (const [file, old, replacement] of [
      ["packages/schema/src/tool.ts", "readonly messageID:", "readonly wrongMessageID:"],
      ["packages/schema/src/session-event.ts", "assistantMessageID:", "wrongMessageID:"],
      ["packages/core/src/tool/plugin/subagent.ts", ": input.prompt", ': "WRAPPED" + input.prompt'],
      [
        "packages/core/src/tool.ts",
        "const execution = yield* execute(tool, input, context)",
        "const execution = yield* wrongExecution(tool, input, context)",
      ],
      [
        "packages/plugin/src/promise/registration.ts",
        "readonly dispose: () => Promise<void>",
        "readonly dispose: () => void",
      ],
    ])
      assert.throws(
        () =>
          auditGlobalLiveEvalNativeContract({
            ...source,
            [file!]: source[file!]!.replaceAll(old!, replacement!),
          }),
        /incompatible/,
      );
  },
);
test("ARTIFACT source evaluation never enters installed manifest or package/startup closure", () => {
  for (const file of [
    ".opencode/global.manifest.json",
    ".opencode/portable.manifest.json",
    ".opencode/runtime.manifest.json",
    ".opencode/plugins/index.js",
  ]) {
    assert.doesNotMatch(fs.readFileSync(file, "utf8"), /global-native-live-eval/);
  }
  const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
  assert.ok(!pkg.files.some((s: string) => s.includes("scripts/global-native-live-eval")));
});

test("FIXTURE timed-out authentic after throws and replaces every visible success surface immediately", async (t) => {
  const f = await host(t, 35);
  const { e } = await f.continuation("completed-after-hold");
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.lookup(() => blocked);
  e.status = "completed";
  e.result = result("success");
  await assert.rejects(f.after(e), /authoritative native after unresolved/);
  const rejected = e.result as {
    output: { status: string };
    content: string;
    metadata: { harness: string };
  };
  assert.equal(rejected.output.status, "rejected");
  assert.equal(rejected.metadata.harness, "rejected");
  assert.deepEqual(JSON.parse(rejected.content), rejected.output);
  await f.driver.dispose();
  assert.ok(f.liveRegistrations() > 0, "unresolved native callback keeps ownership");
  f.lookup(null);
  release();
  await tick();
  await tick();
  assert.match(JSON.stringify(e.result), /rejected/);
});
