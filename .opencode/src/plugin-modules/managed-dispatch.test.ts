import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  createManagedDispatch,
  parseDelegationPolicy,
  parseWorkflowRegistryCapacity,
} from "./managed-dispatch.ts";
import { HarnessLifecyclePlugin } from "./harness-lifecycle.ts";
import { captureArtifacts, captureWorkspace } from "./acceptance-proof.ts";
import {
  TASK_THREAD_ROLE_PACKET_FIELDS,
  formatTaskThreadEnvelope,
  formatTaskResultWrapper,
} from "./task-thread-policy.ts";
import type { TaskThreadRole } from "./task-thread-policy.ts";

const roots: string[] = [];
test.after(() => {
  for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
});

function fixture(role: TaskThreadRole = "researcher", timeoutMs = 10) {
  const root = fs.mkdtempSync("/var/tmp/harness-managed-test-");
  roots.push(root);
  const workspace = path.join(root, "workspace");
  fs.mkdirSync(workspace);
  assert.equal(spawnSync("git", ["init", "-q", workspace]).status, 0);
  fs.mkdirSync(path.join(workspace, "src"));
  fs.writeFileSync(path.join(workspace, "src/a.txt"), "initial");
  assert.equal(spawnSync("git", ["-C", workspace, "add", "src/a.txt"]).status, 0);
  assert.equal(
    spawnSync("git", [
      "-C",
      workspace,
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "-qm",
      "fixture",
    ]).status,
    0,
  );
  const trace = path.join(root, "trace");
  fs.mkdirSync(path.join(trace, "orchestrations/fixture"), { recursive: true });
  const taskMode =
    role === "validator" ? "validation" : role === "implementer" ? "implementation" : "research";
  const spec = {
    schemaVersion: "1.0.0",
    orchestrationId: "fixture",
    goal: "Local offline fixture",
    deliverables: ["src/a.txt"],
    nonGoals: ["No external calls"],
    allowedPaths: ["src/"],
    workUnits: [
      {
        id: "a",
        goal: "bounded work",
        deliverable: "src/a.txt",
        nonGoals: ["unrelated edits"],
        allowedPaths: ["src/"],
        acceptanceGateIds: ["gate-a"],
      },
    ],
    acceptanceGates: [
      { id: "gate-a", criterion: "command succeeds", evidenceCommand: "true", workUnitIds: ["a"] },
    ],
    roleModeTaskMapping: [{ workUnitId: "a", role, taskMode, boundedTask: "Inspect fixture" }],
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
      maxTotalLeafAgents: 4,
      maxLeafAgentsByRole: { researcher: 2, planner: 2, implementer: 2, validator: 2 },
      maxRemediationCyclesPerWorkUnit: 1,
    },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
    routingMetadataStatus: "absent",
  };
  const specFile = path.join(trace, "orchestrations/fixture/normalized-spec.json");
  fs.writeFileSync(specFile, JSON.stringify(spec));
  let now = 100;
  const telemetry: Record<string, unknown>[] = [];
  const options = {
    workspaceRoot: workspace,
    traceRoot: trace,
    recoveryParent: root,
    now: () => now,
    timeoutMs,
    telemetry: (r: Record<string, unknown>) => telemetry.push(r),
  };
  const managed = createManagedDispatch(options);

  function packet(id = "task"): Record<string, unknown> {
    const known: Record<string, unknown> = {
      orchestrationId: "fixture",
      delegationTaskId: id,
      scopeKey: "a",
      dispatchKind: "fresh",
      taskMode,
      routingMetadataStatus: "absent",
      scopedQuestion: "Read fixture",
      freshnessRequirements: "current",
      downstreamNeeds: "validation",
      approvedPlan: "Edit src/a.txt",
      acceptanceStandard: "gate passes",
      verificationCommands: ["true"],
      commandsToRun: ["true"],
      targetPaths: ["src/a.txt"],
      allowedEditScope: ["src/"],
    };
    return Object.fromEntries(
      TASK_THREAD_ROLE_PACKET_FIELDS[role].required.map((key) => [
        key,
        known[key] ?? ["explicit requirement"],
      ]),
    );
  }

  const args = (p = packet()) => ({
    subagent_type: role,
    prompt: formatTaskThreadEnvelope({ version: 1, kind: "fresh", role, packet: p }),
  });

  async function start() {
    await managed.beforeTask({ sessionID: "parent", callID: "call" }, args());
    managed.sessionCreated({ id: "child", parentID: "parent" });
  }

  function success() {
    const reference = `orchestrations/fixture/roles/${role}/result.md`;
    const absolute = path.join(trace, reference);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, "verified fixture");
    const sha256 = captureArtifacts(trace, [reference])[reference];
    const fields =
      role === "researcher"
        ? [
            "citedFindings",
            "sourceList",
            "implementationImplications",
            "risks",
            "recommendedNextRole",
          ]
        : role === "validator"
          ? [
              "passFailMatrixOrFindings",
              "commandOutputs",
              "schemaResults",
              "securityAndActivationFindings",
              "remediationList",
            ]
          : ["changedFiles", "rationale", "schemaOrBoundaryChoices", "commandsRun", "handoffNotes"];
    return {
      version: 1,
      orchestrationId: "fixture",
      delegationTaskId: "task",
      scopeKey: "a",
      role,
      taskMode,
      outcome: "success",
      summary: "Fixture checked",
      evidence: [{ reference, command: "true", exitCode: 0 }],
      artifacts: [{ reference, sha256 }],
      outputContract: {
        ...Object.fromEntries(fields.map((key) => [key, ["fixture evidence"]])),
        traceArtifactPath: reference,
      },
    };
  }

  const finish = (result: unknown, sessionId = "child", callID = "call") =>
    managed.afterTask(
      { callID },
      {
        metadata: { sessionId },
        output: formatTaskResultWrapper(JSON.stringify(result), sessionId),
      },
    );
  return {
    root,
    workspace,
    trace,
    spec,
    specFile,
    managed,
    options,
    telemetry,
    packet,
    args,
    start,
    success,
    finish,
    advance: () => {
      now += 11;
    },
  };
}

test("current task view is bound, bounded, fresh, and never exposes packet contents", async () => {
  const f = fixture();
  assert.equal(f.managed.currentTaskView("parent"), null);
  await f.managed.beforeTask(
    { sessionID: "parent", callID: "call" },
    f.args({
      ...f.packet(),
      scopedQuestion: "packet-only-secret-marker",
    }),
  );
  assert.equal(f.managed.currentTaskView("parent"), null);
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  const expected = {
    orchestrationId: "fixture",
    scopeKey: "a",
    delegationTaskId: "task",
    role: "researcher",
    taskMode: "research",
    goal: "bounded work",
  };
  const view = f.managed.currentTaskView("parent");
  assert.deepEqual(view, expected);
  assert.deepEqual(Object.keys(view!).sort(), Object.keys(expected).sort());
  assert.deepEqual(f.managed.currentTaskView("child"), expected);
  assert.notEqual(f.managed.currentTaskView("child"), view);
  assert.ok(JSON.stringify(view).length < 300);
  assert.ok(!JSON.stringify(view).includes("packet-only-secret-marker"));
  assert.equal(f.managed.currentTaskView("other"), null);
  for (const bad of [undefined, null, "", 2, {}, "child "]) {
    assert.equal(f.managed.currentTaskView(bad), null);
  }
  assert.equal(f.finish(f.success()).outcome, "success");
  assert.equal(f.managed.currentTaskView("child"), null);
  assert.equal(f.managed.currentTaskView("parent"), null);
});

test("compaction pointer stays parent-bound after terminal work without reviving a child", async () => {
  const f = fixture("researcher");
  assert.equal(f.managed.compactionPointer("parent"), null);
  await f.start();
  assert.deepEqual(f.managed.compactionPointer("parent"), { orchestrationId: "fixture" });
  assert.equal(f.managed.compactionPointer("child"), null);
  assert.equal(f.managed.compactionPointer("unrelated"), null);
  f.finish(f.success());
  assert.deepEqual(f.managed.compactionPointer("parent"), { orchestrationId: "fixture" });
  assert.equal(f.managed.compactionPointer("child"), null);
});

test("external action admits the bound primary but denies children and a stopped guard", async () => {
  const f = fixture("researcher");
  f.managed.assertExternalActionCaller("parent");
  assert.throws(() => f.managed.assertExternalActionCaller(""), /bound native primary/);
  await f.start();
  f.managed.assertExternalActionCaller("parent");
  assert.throws(() => f.managed.assertExternalActionCaller("child"), /bound native primary/);
  f.finish(f.success());
  f.managed.assertExternalActionCaller("parent");
  assert.throws(() => f.managed.assertExternalActionCaller("child"), /bound native primary/);
  f.managed.interrupt("fixture stop");
  assert.throws(() => f.managed.assertExternalActionCaller("parent"), /bound native primary/);
});

test("current task view fails closed on unsafe goals and stale reservations", async () => {
  for (const goal of ["x".repeat(241), "bad\nline", "bad\u007fdel", "bad\u0085c1"]) {
    const f = fixture();
    fs.writeFileSync(
      f.specFile,
      JSON.stringify({
        ...f.spec,
        workUnits: [{ ...f.spec.workUnits[0], goal }],
      }),
    );
    await f.start();
    assert.equal(f.managed.currentTaskView("parent"), null);
    assert.equal(f.managed.currentTaskView("child"), null);
  }
  const expired = fixture();
  await expired.start();
  expired.advance();
  assert.equal(expired.managed.currentTaskView("parent"), null);
  assert.equal(expired.managed.snapshot().runs[0]!.attempts[0]!.state, "cancel-requested");
  const interrupted = fixture();
  await interrupted.start();
  interrupted.managed.interrupt("test");
  assert.equal(interrupted.managed.currentTaskView("child"), null);
  const blocked = fixture();
  await blocked.start();
  const { outputContract: _unused, ...result } = blocked.success();
  blocked.finish({ ...result, outcome: "blocked", reason: "fixture" });
  assert.equal(blocked.managed.currentTaskView("child"), null);
});

test("managed native hooks accept correlated research with exact artifact proof and reject duplicate completion", async () => {
  const f = fixture();
  await f.start();
  assert.equal(f.finish(f.success()).outcome, "success");
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
  assert.throws(() => f.finish(f.success()), /duplicate|uncorrelated/);
  assert.equal(f.telemetry.at(-1)!.event, "completed");
});
test("a terminal blocked run permits a different fresh orchestration in the same parent session", async () => {
  const f = fixture();
  await f.start();
  const { outputContract: _output, ...blocked } = f.success();
  assert.equal(
    f.finish({ ...blocked, outcome: "blocked", reason: "scoped implementation incomplete" })
      .outcome,
    "blocked",
  );
  assert.equal(f.managed.snapshot().stopped, false);
  const nextId = "fresh-after-blocked";
  fs.mkdirSync(path.join(f.trace, "orchestrations", nextId));
  fs.writeFileSync(
    path.join(f.trace, "orchestrations", nextId, "normalized-spec.json"),
    JSON.stringify({ ...f.spec, orchestrationId: nextId }),
  );
  await f.managed.beforeTask(
    { sessionID: "parent", callID: "fresh" },
    f.args({ ...f.packet("new-task"), orchestrationId: nextId }),
  );
  assert.equal(f.managed.snapshot().runs.length, 2);
  assert.equal(f.managed.snapshot().runs[1]!.active, 1);
  f.managed.sessionCreated({ id: "next-child", parentID: "parent" });
  assert.equal(f.managed.currentTaskView("child"), null);
  assert.equal(f.managed.currentTaskView("next-child")?.delegationTaskId, "new-task");
  assert.ok(fs.existsSync(path.join(f.trace, "orchestrations", nextId, "dispatch-started.json")));
});

test("workflow capacity defaults to unlimited and finite overrides retain start-marker refusal", async () => {
  assert.equal(parseWorkflowRegistryCapacity(), null);
  assert.equal(parseWorkflowRegistryCapacity("unlimited"), null);
  assert.equal(parseWorkflowRegistryCapacity("1"), 1);
  assert.equal(parseWorkflowRegistryCapacity("16"), 16);
  assert.equal(parseWorkflowRegistryCapacity("9007199254740991"), Number.MAX_SAFE_INTEGER);
  for (const invalid of ["0", "01", "1.5", "-1", "1e3", "9007199254740992", "", 0, null, true])
    assert.throws(() => parseWorkflowRegistryCapacity(invalid), /workflow registry capacity/);

  const f = fixture();
  const unlimited = createManagedDispatch(f.options);
  for (let index = 0; index < 17; index++) {
    const id = `capacity-${index}`;
    fs.mkdirSync(path.join(f.trace, "orchestrations", id));
    fs.writeFileSync(
      path.join(f.trace, "orchestrations", id, "normalized-spec.json"),
      JSON.stringify({ ...f.spec, orchestrationId: id }),
    );
    const callID = `call-${index}`;
    const child = `child-${index}`;
    await unlimited.beforeTask(
      { sessionID: "parent", callID },
      f.args({ ...f.packet(`task-${index}`), orchestrationId: id }),
    );
    unlimited.sessionCreated({ id: child, parentID: "parent" });
    const { outputContract: _unused, ...result } = f.success();
    const blocked = {
      ...result,
      orchestrationId: id,
      delegationTaskId: `task-${index}`,
      outcome: "blocked",
      reason: "measurement incomplete",
      artifacts: [],
    };
    unlimited.afterTask(
      { callID },
      {
        metadata: { sessionId: child },
        output: formatTaskResultWrapper(JSON.stringify(blocked), child),
      },
    );
  }
  assert.equal(unlimited.snapshot().runs.length, 17);
  assert.ok(fs.existsSync(path.join(f.trace, "orchestrations/capacity-16/dispatch-started.json")));
  await assert.rejects(
    unlimited.beforeTask(
      { sessionID: "parent", callID: "replay" },
      f.args({ ...f.packet("task-0"), orchestrationId: "capacity-0" }),
    ),
    /fresh child task|duplicate dispatch/,
  );
  const restarted = createManagedDispatch({ ...f.options, registryCapacity: null });
  await assert.rejects(
    restarted.beforeTask(
      { sessionID: "parent", callID: "restart-replay" },
      f.args({ ...f.packet("restart-task"), orchestrationId: "capacity-0" }),
    ),
    /already started or cannot be reserved/,
  );

  const capped = fixture();
  const finite = createManagedDispatch({
    ...capped.options,
    registryCapacity: parseWorkflowRegistryCapacity("1"),
  });
  await finite.beforeTask({ sessionID: "parent", callID: "first" }, capped.args());
  finite.sessionCreated({ id: "first-child", parentID: "parent" });
  const { outputContract: _unused, ...result } = capped.success();
  finite.afterTask(
    { callID: "first" },
    {
      metadata: { sessionId: "first-child" },
      output: formatTaskResultWrapper(
        JSON.stringify({ ...result, outcome: "blocked", reason: "done" }),
        "first-child",
      ),
    },
  );
  const nextId = "over-capacity";
  fs.mkdirSync(path.join(capped.trace, "orchestrations", nextId));
  fs.writeFileSync(
    path.join(capped.trace, "orchestrations", nextId, "normalized-spec.json"),
    JSON.stringify({ ...capped.spec, orchestrationId: nextId }),
  );
  await assert.rejects(
    finite.beforeTask(
      { sessionID: "parent", callID: "second" },
      capped.args({ ...capped.packet("second-task"), orchestrationId: nextId }),
    ),
    /workflow registry capacity reached/,
  );
  assert.equal(
    fs.existsSync(path.join(capped.trace, "orchestrations", nextId, "dispatch-started.json")),
    false,
  );
});
test("late events from a completed child cannot stop a later managed task", async () => {
  const f = fixture();
  const hooks = await HarnessLifecyclePlugin({ directory: f.workspace }, () => f.managed);
  await hooks["tool.execute.before"](
    { tool: "task", sessionID: "parent", callID: "call" },
    { args: f.args() },
  );
  await hooks.event({
    event: { type: "session.created", properties: { info: { id: "child", parentID: "parent" } } },
  });
  await hooks["tool.execute.after"](
    { tool: "task", callID: "call" },
    {
      metadata: { sessionId: "child" },
      output: formatTaskResultWrapper(JSON.stringify(f.success()), "child"),
    },
  );
  await hooks.event({ event: { type: "session.deleted", properties: { sessionID: "child" } } });
  assert.equal(f.managed.snapshot().stopped, false);
  const nextId = "new-after-old-child";
  fs.mkdirSync(path.join(f.trace, "orchestrations", nextId));
  fs.writeFileSync(
    path.join(f.trace, "orchestrations", nextId, "normalized-spec.json"),
    JSON.stringify({ ...f.spec, orchestrationId: nextId }),
  );
  await hooks["tool.execute.before"](
    { tool: "task", sessionID: "parent", callID: "next-call" },
    { args: f.args({ ...f.packet("new-task"), orchestrationId: nextId }) },
  );
  await hooks.event({
    event: {
      type: "session.created",
      properties: { info: { id: "next-child", parentID: "parent" } },
    },
  });
  await hooks.event({ event: { type: "session.error", properties: { sessionID: "child" } } });
  assert.equal(f.managed.snapshot().stopped, false);
  await hooks.event({ event: { type: "session.error", properties: { sessionID: "next-child" } } });
  assert.equal(f.managed.snapshot().stopped, true);
});
test("managed runtime rejects null packets without reservation and serializes same-scope race", async () => {
  const f = fixture();
  await assert.rejects(
    f.managed.beforeTask(
      { sessionID: "parent", callID: "null" },
      f.args({ ...f.packet(), scopedQuestion: null }),
    ),
    /invalid/,
  );
  assert.equal(f.managed.snapshot().runs.length, 0);
  const outcomes = await Promise.allSettled(
    ["one", "two"].map((id) =>
      f.managed.beforeTask({ sessionID: "parent", callID: id }, f.args(f.packet(id))),
    ),
  );
  assert.equal(outcomes.filter((v) => v.status === "fulfilled").length, 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
});
test("exact external actions remain available to the bound primary during managed work", async () => {
  const f = fixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  assert.doesNotThrow(() => f.managed.assertExternalActionCaller("parent"));
  assert.throws(() => f.managed.assertExternalActionCaller("other"), /bound native primary/);
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  assert.throws(() => f.managed.assertExternalActionCaller("child"), /bound native primary/);
});
test("active primary shell writes only to its isolated external directory", async () => {
  const f = fixture();
  const managed = createManagedDispatch({ ...f.options, allowActiveIsolatedShell: true });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  assert.throws(() => managed.authorizeIsolatedPrimary("other", null), /bound native primary/);
  managed.authorizeIsolatedPrimary("parent", null);
  const root = managed.isolatedPrimaryShellRoot("parent");
  const checked = managed.beforeTool(
    { sessionID: "parent", callID: "shell", tool: "bash" },
    { command: "printf safe > result.txt", workdir: f.workspace },
  );
  assert.equal(checked.workdir, root);
  assert.match(String(checked.command), /bwrap/);
  assert.ok(!root.startsWith(f.workspace + path.sep));
  assert.ok(!root.startsWith(f.trace + path.sep));
  assert.equal(spawnSync("/bin/sh", ["-c", String(checked.command)]).status, 0);
  assert.equal(fs.readFileSync(path.join(root, "result.txt"), "utf8"), "safe");
  const denied = managed.beforeTool(
    { sessionID: "parent", callID: "denied-shell", tool: "bash" },
    { command: `printf bad > ${path.join(f.workspace, "src/forbidden.txt")}` },
  );
  assert.notEqual(spawnSync("/bin/sh", ["-c", String(denied.command)]).status, 0);
  assert.equal(fs.existsSync(path.join(f.workspace, "src/forbidden.txt")), false);
});
test("known write-producing managed gate rejects before creating a refusal marker", async () => {
  const f = fixture();
  fs.writeFileSync(
    f.specFile,
    JSON.stringify({
      ...f.spec,
      acceptanceGates: [
        {
          ...f.spec.acceptanceGates[0],
          evidenceCommand: "node .opencode/scripts/validate-" + "harness.mts",
        },
      ],
    }),
  );
  await assert.rejects(
    f.managed.beforeTask({ sessionID: "parent", callID: "unsafe" }, f.args()),
    /managed acceptance gate needs read-only/,
  );
  assert.equal(f.managed.snapshot().runs.length, 0);
  assert.equal(
    fs.existsSync(path.join(f.trace, "orchestrations/fixture/dispatch-started.json")),
    false,
  );
});
test("managed workflow mutation is rejected at tool and result boundaries", async () => {
  const f = fixture();
  await f.start();
  const result = f.success();
  fs.writeFileSync(f.specFile, JSON.stringify({ ...f.spec, goal: "Changed goal" }));
  assert.throws(
    () => f.managed.beforeTool({ sessionID: "child", tool: "read" }, { filePath: "src/a.txt" }),
    /workflow changed/,
  );
  assert.throws(() => f.finish(result), /workflow changed/);
  assert.equal(f.managed.snapshot().stopped, true);
});
test("managed result rejects out-of-scope edits and stale or missing artifacts", async () => {
  for (const mutation of ["outside", "stale", "missing"]) {
    const f = fixture("implementer");
    await f.start();
    const result = f.success();
    const artifact = path.join(f.trace, result.artifacts[0]!.reference);
    if (mutation === "outside")
      fs.writeFileSync(path.join(f.workspace, "outside.txt"), "unauthorized");
    else if (mutation === "stale") fs.appendFileSync(artifact, "changed");
    else fs.unlinkSync(artifact);
    assert.throws(
      () => f.finish(result),
      mutation === "outside"
        ? /outside|scope/
        : mutation === "stale"
          ? /digest|mismatched/
          : /ENOENT|missing/,
    );
    assert.equal(f.managed.snapshot().stopped, true, mutation);
  }
});
test("orchestrator can release a stopped adapter only after completed native child and reviewed tree", async () => {
  const f = fixture("implementer");
  const managed = createManagedDispatch({
    ...f.options,
    backgroundTransport: {
      enabled: false,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({ parent: "parent", idle: true, messages: [] }),
      abort: async () => {},
    },
  });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  managed.sessionCreated({ id: "child", parentID: "parent" });
  const result = f.success();
  fs.appendFileSync(path.join(f.trace, result.artifacts[0]!.reference), "tamper");
  assert.throws(
    () =>
      managed.afterTask(
        { callID: "call" },
        {
          metadata: { sessionId: "child" },
          output: formatTaskResultWrapper(JSON.stringify(result), "child"),
        },
      ),
    /digest/,
  );
  assert.equal(managed.snapshot().stopped, true);
  assert.throws(
    () => managed.beforeTool({ sessionID: "child", tool: "harness_recovery_status" }, {}),
    /primary session/,
  );
  assert.deepEqual(
    managed.beforeTool({ sessionID: "parent", tool: "harness_recovery_status" }, {}),
    {},
  );
  const status = await managed.recoveryStatus("parent");
  assert.equal(status.state, "ready");
  if (status.state !== "ready") throw new Error("expected native termination proof");
  const otherPrimary = await managed.recoveryStatus("new-primary");
  assert.equal(otherPrimary.state, "ready");
  assert.match(otherPrimary.nextAction, /only the bound parent/);
  await assert.rejects(
    () => managed.releaseForFresh("new-primary", status.treeHash),
    /bound stopped parent/,
  );
  assert.throws(
    () => managed.beforeTool({ sessionID: "parent", tool: "write" }, { filePath: "src/a.txt" }),
    /isolated recovery shell/,
  );
  assert.equal(
    managed.beforeTool({ sessionID: "parent", tool: "read" }, { filePath: "src/a.txt" }).filePath,
    "src/a.txt",
  );
  await assert.rejects(() => managed.releaseForFresh("parent", "0".repeat(64)), /changed worker/);
  assert.equal(managed.snapshot().stopped, true);
  const released = await managed.releaseForFresh("parent", status.treeHash);
  assert.equal(released.state, "fresh-only");
  assert.equal(managed.snapshot().stopped, false);
  assert.throws(() => managed.beforeTool({ sessionID: "child", tool: "read" }, {}), /terminal/);
  await assert.rejects(
    () => managed.beforeTask({ sessionID: "parent", callID: "old-run" }, f.args(f.packet("other"))),
    /interrupted/,
  );
  const nextId = "new-after-recovery";
  fs.mkdirSync(path.join(f.trace, "orchestrations", nextId));
  fs.writeFileSync(
    path.join(f.trace, "orchestrations", nextId, "normalized-spec.json"),
    JSON.stringify({ ...f.spec, orchestrationId: nextId }),
  );
  await managed.beforeTask(
    { sessionID: "parent", callID: "new-call" },
    f.args({ ...f.packet("new-task"), orchestrationId: nextId }),
  );
  assert.equal(managed.snapshot().runs.length, 2);
  assert.equal(managed.interruptIfCurrent("child", "late old child deletion"), false);
  assert.equal(managed.snapshot().stopped, false);
  assert.ok(fs.existsSync(path.join(f.trace, "orchestrations/fixture/dispatch-started.json")));
});

test("uncertain live worker or out-of-scope effects never unlock stopped recovery", async () => {
  const f = fixture("implementer");
  await f.start();
  f.managed.interrupt("unverified blocking worker");
  const uncertain = await f.managed.recoveryStatus("parent");
  assert.equal(uncertain.state, "blocked");
  await assert.rejects(() => f.managed.releaseForFresh("parent", "0".repeat(64)), /uncertain/);
  assert.equal(f.managed.snapshot().stopped, true);
  const outside = fixture("implementer");
  const managed = createManagedDispatch({
    ...outside.options,
    backgroundTransport: {
      enabled: false,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({ parent: "parent", idle: true, messages: [] }),
      abort: async () => {},
    },
  });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, outside.args());
  managed.sessionCreated({ id: "child", parentID: "parent" });
  const result = outside.success();
  fs.writeFileSync(path.join(outside.workspace, "outside.txt"), "unauthorized");
  assert.throws(
    () =>
      managed.afterTask(
        { callID: "call" },
        {
          metadata: { sessionId: "child" },
          output: formatTaskResultWrapper(JSON.stringify(result), "child"),
        },
      ),
    /outside|scope/,
  );
  assert.equal((await managed.recoveryStatus("parent")).state, "blocked");
  assert.equal(managed.snapshot().stopped, true);
});

test("recovery release rejects a changed tree or immutable workflow after ready status", async () => {
  const f = backgroundFixture();
  await f.start();
  await f.managed.cancelBackground("parent");
  const ready = await f.managed.recoveryStatus("parent");
  assert.equal(ready.state, "ready");
  if (ready.state !== "ready") throw new Error("expected reconciled background child");
  fs.writeFileSync(path.join(f.workspace, "src/a.txt"), "changed in allowed scope");
  await assert.rejects(() => f.managed.releaseForFresh("parent", ready.treeHash), /changed worker/);
  assert.equal(f.managed.snapshot().stopped, true);
  fs.writeFileSync(f.specFile, JSON.stringify({ ...f.spec, goal: "changed spec" }));
  assert.equal((await f.managed.recoveryStatus("parent")).state, "blocked");
  fs.writeFileSync(f.specFile, JSON.stringify(f.spec));
  fs.unlinkSync(path.join(f.trace, "orchestrations/fixture/dispatch-started.json"));
  assert.equal((await f.managed.recoveryStatus("parent")).state, "blocked");
  assert.equal(f.managed.snapshot().stopped, true);
});
test("managed child binding rejects unknown tool and result sessions", async () => {
  const f = fixture();
  await f.start();
  assert.throws(() => f.managed.beforeTool({ sessionID: "unknown", tool: "read" }, {}), /unbound/);
  assert.throws(() => f.finish(f.success(), "unknown"), /not observed/);
  assert.equal(f.managed.snapshot().stopped, true);
});
test("managed clarification cannot survive interruption, restart, stale nonce, or deadline", async () => {
  const f = fixture();
  await f.start();
  const result = {
    version: 1,
    orchestrationId: "fixture",
    delegationTaskId: "task",
    scopeKey: "a",
    role: "researcher",
    taskMode: "research",
    outcome: "clarification",
    summary: "Need choice",
    requestNonce: "nonce",
    question: "Which input?",
    evidence: [],
    artifacts: [],
  };
  assert.equal(f.finish(result).outcome, "clarification");
  assert.equal(f.managed.currentTaskView("parent")?.goal, "bounded work");
  assert.equal(f.managed.currentTaskView("child")?.delegationTaskId, "task");
  const response = (nonce: string) => ({
    subagent_type: "researcher",
    task_id: "child",
    prompt: formatTaskThreadEnvelope({
      version: 1,
      kind: "clarification-response",
      delegationTaskId: "task",
      requestNonce: nonce,
      answer: "fixture",
    }),
  });
  await assert.rejects(
    f.managed.beforeTask({ sessionID: "parent", callID: "reply" }, response("stale")),
  );
  await assert.rejects(
    createManagedDispatch(f.options).beforeTask(
      { sessionID: "parent", callID: "reply" },
      response("nonce"),
    ),
    /no live/,
  );
  f.advance();
  await assert.rejects(
    f.managed.beforeTask({ sessionID: "parent", callID: "reply" }, response("nonce")),
    /stale/,
  );
  f.managed.interrupt("fixture interruption");
  await assert.rejects(
    f.managed.beforeTask({ sessionID: "parent", callID: "fresh" }, f.args(f.packet("new"))),
    /non-resumable/,
  );
});
test("an unacknowledged blocking clarification continuation cannot be released on idle alone", async () => {
  const f = fixture();
  const managed = createManagedDispatch({
    ...f.options,
    backgroundTransport: {
      enabled: false,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({ parent: "parent", idle: true, messages: [] }),
      abort: async () => {},
    },
  });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  managed.sessionCreated({ id: "child", parentID: "parent" });
  const clarification = {
    version: 1,
    orchestrationId: "fixture",
    delegationTaskId: "task",
    scopeKey: "a",
    role: "researcher",
    taskMode: "research",
    outcome: "clarification",
    summary: "Need a choice",
    requestNonce: "nonce",
    question: "Which fixture?",
    evidence: [],
    artifacts: [],
  };
  assert.equal(
    managed.afterTask(
      { callID: "call" },
      {
        metadata: { sessionId: "child" },
        output: formatTaskResultWrapper(JSON.stringify(clarification), "child"),
      },
    ).outcome,
    "clarification",
  );
  await managed.beforeTask(
    { sessionID: "parent", callID: "reply" },
    {
      task_id: "child",
      subagent_type: "researcher",
      prompt: formatTaskThreadEnvelope({
        version: 1,
        kind: "clarification-response",
        delegationTaskId: "task",
        requestNonce: "nonce",
        answer: "fixture",
      }),
    },
  );
  managed.interrupt("continuation launch is unacknowledged");
  assert.equal((await managed.recoveryStatus("parent")).state, "blocked");
  await assert.rejects(() => managed.releaseForFresh("parent", "0".repeat(64)), /uncertain/);
});
test("managed tools deny shell for research, unauthorized commands, and edits outside scope", async () => {
  const research = fixture();
  await research.start();
  assert.throws(
    () =>
      research.managed.beforeTool(
        { sessionID: "child", callID: "shell", tool: "bash" },
        { command: "true" },
      ),
    /no shell/,
  );
  const writer = fixture("implementer");
  await writer.start();
  assert.throws(
    () =>
      writer.managed.beforeTool(
        { sessionID: "child", callID: "shell", tool: "bash" },
        { command: "touch outside" },
      ),
    /exact verification/,
  );
  assert.throws(
    () =>
      writer.managed.beforeTool(
        { sessionID: "child", tool: "write" },
        { filePath: "outside.txt", content: "bad" },
      ),
    /outside allowed/,
  );
  assert.throws(
    () => writer.managed.beforeTool({ sessionID: "child", tool: "apply_patch" }, {}),
    /unsupported/,
  );
});
test("managed validator tool records native exit proof and trace creation is role-bound", async () => {
  const f = fixture("validator", 10_000);
  await f.start();
  assert.throws(() => f.managed.verifyCommand("parent", "true"), /bound validator child/);
  assert.throws(() => f.managed.verifyCommand("child", "false"), /exact verification/);
  assert.equal(f.managed.verifyCommand("child", "true").exitCode, 0);
  const file = "orchestrations/fixture/roles/validator/proof.md";
  assert.equal(f.managed.writeTrace("child", file, "# Validator proof\n"), file);
  assert.throws(() => f.managed.writeTrace("child", file, "replacement"), /EEXIST/);
  assert.throws(() => f.managed.writeTrace("child", "src/a.txt", "bad"), /outside assigned/);
  assert.equal(f.finish(f.success()).outcome, "success");
  assert.throws(() => f.managed.verifyCommand("child", "true"), /bound validator child/);
  assert.throws(() => f.managed.writeTrace("child", file, "late"), /bound role child/);
});
test("each managed role can write only its own immutable trace", async () => {
  for (const role of ["researcher", "implementer", "validator"] as const) {
    const f = fixture(role);
    await f.start();
    const own = `orchestrations/fixture/roles/${role}/proof.md`;
    assert.equal(f.managed.writeTrace("child", own, `# ${role}\n`), own);
    assert.throws(() => f.managed.writeTrace("parent", own, "bad"), /bound role child/);
    if (role !== "validator")
      assert.throws(
        () => f.managed.writeTrace("child", "orchestrations/fixture/roles/validator/no.md", "bad"),
        /outside assigned/,
      );
  }
});
test("managed source edit checks exact target and complete prior contents", async () => {
  const f = fixture("implementer");
  await f.managed.beforeTask(
    { sessionID: "parent", callID: "call" },
    f.args({ ...f.packet(), targetPaths: ["src/a.txt", "src/new.txt", "src/nested/skill.md"] }),
  );
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  assert.throws(
    () => f.managed.editSource("parent", "src/a.txt", "initial", "bad"),
    /bound implementer/,
  );
  assert.throws(
    () => f.managed.editSource("child", "src/other.txt", "", "bad"),
    /outside assigned/,
  );
  assert.throws(
    () => f.managed.editSource("child", "src/a.txt", "stale", "new"),
    /stale or mismatched/,
  );
  assert.equal(
    f.managed.editSource("child", "src/a.txt", "initial", "replacement").filePath,
    "src/a.txt",
  );
  assert.throws(
    () => f.managed.editSource("child", "src/a.txt", "initial", "second"),
    /stale or mismatched/,
  );
  assert.equal(
    f.managed.editSource("child", "src/new.txt", "", "new source").filePath,
    "src/new.txt",
  );
  assert.equal(
    f.managed.editSource("child", "src/nested/skill.md", "", "# New skill\n").filePath,
    "src/nested/skill.md",
  );
  assert.equal(
    fs.readFileSync(path.join(f.workspace, "src/nested/skill.md"), "utf8"),
    "# New skill\n",
  );
  assert.throws(() => f.managed.editSource("child", "src/new.txt", "", "overwrite"), /EEXIST/);
  const reader = fixture();
  await reader.start();
  assert.throws(
    () => reader.managed.editSource("child", "src/a.txt", "initial", "bad"),
    /bound implementer/,
  );
});
test("managed fragment replacement is exact, unique, scoped and bound to the live implementer", async () => {
  const f = fixture("implementer");
  await f.start();
  assert.throws(
    () => f.managed.replaceSource("parent", "src/a.txt", "initial", "changed"),
    /bound implementer/,
  );
  assert.throws(
    () => f.managed.replaceSource("child", "src/other.txt", "initial", "changed"),
    /assigned target/,
  );
  assert.equal(
    f.managed.replaceSource("child", "src/a.txt", "init", "found").filePath,
    "src/a.txt",
  );
  const file = path.join(f.workspace, "src/a.txt");
  assert.equal(fs.readFileSync(file, "utf8"), "foundial");
  assert.throws(
    () => f.managed.replaceSource("child", "src/a.txt", "init", "other"),
    /exactly one/,
  );
  assert.throws(
    () => f.managed.replaceSource("child", "src/a.txt", "found", "found"),
    /bounded distinct/,
  );
  assert.throws(
    () => f.managed.replaceSource("child", "src/a.txt", "a".repeat(8193), "x"),
    /bounded distinct/,
  );
  fs.writeFileSync(file, "same same");
  assert.throws(() => f.managed.replaceSource("child", "src/a.txt", "same", "new"), /exactly one/);
  assert.equal(fs.readFileSync(file, "utf8"), "same same");
  const reader = fixture();
  await reader.start();
  assert.throws(
    () => reader.managed.replaceSource("child", "src/a.txt", "initial", "changed"),
    /bound implementer/,
  );
  const linked = fixture("implementer");
  await linked.start();
  fs.unlinkSync(path.join(linked.workspace, "src/a.txt"));
  fs.symlinkSync("../outside.txt", path.join(linked.workspace, "src/a.txt"));
  assert.throws(
    () => linked.managed.replaceSource("child", "src/a.txt", "initial", "changed"),
    /symlink/,
  );
});
test("managed independent validator requires observed command status, not declared result evidence", async () => {
  const missing = fixture("validator");
  await missing.start();
  assert.throws(() => missing.finish(missing.success()), /trusted command success/);
  const f = fixture("validator");
  await f.start();
  const input = { sessionID: "child", callID: "check", tool: "bash" };
  const authorized = f.managed.beforeTool(input, { command: "true" });
  const child = spawnSync("/bin/sh", ["-c", String(authorized.command)], {
    cwd: f.workspace,
    encoding: "utf8",
  });
  assert.equal(child.status, 0, child.stderr);
  f.managed.afterTool(input, { metadata: { exit: child.status } });
  assert.equal(f.finish(f.success()).outcome, "success");
  assert.match(f.managed.snapshot().runs[0]!.gates["gate-a"]!, /^[a-f0-9]{64}$/);
});
test("managed validator rejects stale command trees and missing native exit status", async () => {
  for (const mutation of ["tree", "exit"]) {
    const f = fixture("validator");
    await f.start();
    const input = { sessionID: "child", callID: "check", tool: "bash" };
    f.managed.beforeTool(input, { command: "true" });
    if (mutation === "tree") fs.appendFileSync(path.join(f.workspace, "src/a.txt"), "changed");
    assert.throws(
      () => f.managed.afterTool(input, { metadata: mutation === "exit" ? {} : { exit: 0 } }),
      /tree|exit status/,
    );
  }
});

test("fresh process cannot replay an already-started orchestration ID", async () => {
  const f = fixture();
  await f.start();
  const restarted = createManagedDispatch({ workspaceRoot: f.workspace, traceRoot: f.trace });
  await assert.rejects(
    restarted.beforeTask({ sessionID: "parent", callID: "new-call" }, f.args(f.packet("new-task"))),
    /already started|non-resumable/,
  );
});

test("completed child stays constrained and cannot become a new orchestrator", async () => {
  const f = fixture();
  await f.start();
  f.finish(f.success());
  assert.throws(
    () =>
      f.managed.beforeTool(
        { sessionID: "child", callID: "late", tool: "bash" },
        { command: "true" },
      ),
    /terminal managed child/,
  );
  assert.throws(
    () =>
      f.managed.beforeTool(
        { sessionID: "child", callID: "late", tool: "write" },
        { filePath: "src/a.txt", content: "late" },
      ),
    /terminal managed child/,
  );
  await assert.rejects(
    f.managed.beforeTask({ sessionID: "child", callID: "nested" }, f.args(f.packet("new-task"))),
    /children cannot delegate/,
  );
  f.managed.interrupt("test");
  assert.throws(
    () =>
      f.managed.beforeTool(
        { sessionID: "parent", callID: "late", tool: "bash" },
        { command: "true" },
      ),
    /authenticated native primary/,
  );
});

test("staged writer invalidates accepted gates; accepted artifacts remain checked until invalidation", async () => {
  for (const tamper of [false, true]) {
    const f = fixture("validator");
    const writer = fixture("implementer");
    f.spec.workUnits.push({ ...f.spec.workUnits[0]!, id: "b", acceptanceGateIds: ["gate-b"] });
    f.spec.acceptanceGates.push({
      ...f.spec.acceptanceGates[0]!,
      id: "gate-b",
      workUnitIds: ["b"],
    });
    f.spec.roleModeTaskMapping.push({
      workUnitId: "b",
      role: "implementer",
      taskMode: "implementation",
      boundedTask: "next stage",
    });
    fs.writeFileSync(f.specFile, JSON.stringify(f.spec));
    await f.start();
    const input = { sessionID: "child", callID: "check", tool: "bash" };
    const authorized = f.managed.beforeTool(input, { command: "true" });
    const command = spawnSync("/bin/sh", ["-c", String(authorized.command)], { encoding: "utf8" });
    assert.equal(command.status, 0, command.stderr);
    f.managed.afterTool(input, { metadata: { exit: command.status } });
    const success = f.success();
    f.finish(success);
    if (tamper) fs.appendFileSync(path.join(f.trace, success.artifacts[0]!.reference), "tampered");
    const next = writer.args({ ...writer.packet("next"), scopeKey: "b" });
    const beforeMalformed = f.managed.snapshot();
    await assert.rejects(
      f.managed.beforeTask(
        { sessionID: "parent", callID: "malformed" },
        { ...next, subagent_type: "researcher" },
      ),
      /subagent_type/,
    );
    assert.deepEqual(f.managed.snapshot(), beforeMalformed);

    if (tamper)
      await assert.rejects(
        f.managed.beforeTask({ sessionID: "parent", callID: "next" }, next),
        /artifact changed/,
      );
    else {
      await f.managed.beforeTask({ sessionID: "parent", callID: "next" }, next);
      assert.deepEqual(f.managed.snapshot().runs[0]!.gates, {});
      f.managed.sessionCreated({ id: "next-child", parentID: "parent" });
      const args = f.managed.beforeTool(
        { sessionID: "next-child", callID: "edit", tool: "write" },
        { filePath: "src/a.txt", content: "next revision" },
      );
      assert.equal(args.filePath, path.join(f.workspace, "src/a.txt"));
    }
  }
});

test("ignored validation input changes reject before completion and after acceptance", async () => {
  for (const phase of ["completion", "dependent"]) {
    const f = fixture("validator");
    const command = 'test "$(cat dist/input.json)" = good';
    fs.writeFileSync(path.join(f.workspace, ".gitignore"), "dist/\n");
    fs.mkdirSync(path.join(f.workspace, "dist"));
    fs.writeFileSync(path.join(f.workspace, "dist/input.json"), "good");
    Object.assign(f.spec, { validationInputs: ["dist/input.json"] });
    f.spec.acceptanceGates[0]!.evidenceCommand = command;
    fs.writeFileSync(f.specFile, JSON.stringify(f.spec));
    await f.managed.beforeTask(
      { sessionID: "parent", callID: "call" },
      f.args({ ...f.packet(), commandsToRun: [command] }),
    );
    f.managed.sessionCreated({ id: "child", parentID: "parent" });
    const input = { sessionID: "child", callID: "check", tool: "bash" };
    const wrapped = f.managed.beforeTool(input, { command });
    const execute = () =>
      spawnSync("/bin/sh", ["-c", String(wrapped.command)], { encoding: "utf8" });
    assert.equal(execute().status, 0);
    f.managed.afterTool(input, { metadata: { exit: 0 } });
    if (phase === "dependent") assert.equal(f.finish(f.success()).outcome, "success");
    fs.writeFileSync(path.join(f.workspace, "dist/input.json"), "bad");
    assert.equal(execute().status, 1);
    if (phase === "completion") assert.throws(() => f.finish(f.success()), /out-of-scope|stale/);
    else
      await assert.rejects(
        f.managed.beforeTask({ sessionID: "parent", callID: "next" }, f.args(f.packet("next"))),
        /accepted scope changed/,
      );
  }
});

test("ordinary ignored content permits research and verification but undeclared reads are masked", async () => {
  for (const role of ["researcher", "validator"] as const) {
    const f = fixture(role);
    fs.writeFileSync(
      path.join(f.workspace, ".gitignore"),
      "node_modules/\ndist/\n.env\nhidden-input.txt\n",
    );
    fs.mkdirSync(path.join(f.workspace, "node_modules/example"), { recursive: true });
    fs.mkdirSync(path.join(f.workspace, "dist"));
    fs.writeFileSync(path.join(f.workspace, "node_modules/example/index.js"), "dependency");
    fs.writeFileSync(path.join(f.workspace, "dist/input.json"), "generated");
    fs.writeFileSync(path.join(f.workspace, ".env"), "fixture-secret-not-read");
    fs.writeFileSync(path.join(f.workspace, "hidden-input.txt"), "good");
    const command =
      "test ! -s hidden-input.txt && test ! -s .env && test ! -e node_modules/example/index.js && test ! -e dist/input.json";
    f.spec.acceptanceGates[0]!.evidenceCommand = command;
    fs.writeFileSync(f.specFile, JSON.stringify(f.spec));
    await f.managed.beforeTask(
      { sessionID: "parent", callID: "call" },
      f.args(role === "validator" ? { ...f.packet(), commandsToRun: [command] } : f.packet()),
    );
    f.managed.sessionCreated({ id: "child", parentID: "parent" });
    if (role === "validator") {
      const input = { sessionID: "child", callID: "check", tool: "bash" };
      const wrapped = f.managed.beforeTool(input, { command });
      const result = spawnSync("/bin/sh", ["-c", String(wrapped.command)], { encoding: "utf8" });
      assert.equal(result.status, 0, result.stderr);
      f.managed.afterTool(input, { metadata: { exit: result.status } });
    }
    assert.equal(f.finish(f.success()).outcome, "success");
  }
});

test("malformed role correlation cannot consume a zero-remediation attempt", async () => {
  const f = fixture("implementer");
  f.spec.budgets.maxRemediationCyclesPerWorkUnit = 0;
  fs.writeFileSync(f.specFile, JSON.stringify(f.spec));
  const before = f.managed.snapshot();
  await assert.rejects(
    f.managed.beforeTask(
      { sessionID: "parent", callID: "bad" },
      { ...f.args(), subagent_type: "researcher" },
    ),
    /subagent_type/,
  );
  assert.deepEqual(f.managed.snapshot(), before);
  assert.equal(
    fs.existsSync(path.join(f.trace, "orchestrations/fixture/dispatch-started.json")),
    false,
  );
  await f.managed.beforeTask({ sessionID: "parent", callID: "fixed" }, f.args(f.packet("fixed")));
  assert.equal(f.managed.snapshot().runs[0]!.attempts.length, 1);
});

const backgroundPolicy = {
  mode: "background",
  resources: { gpu: { maxConcurrentRequests: 2, orchestratorHeadroom: 1 } },
  providerResources: { fixture: "gpu" },
  maxQueuedUpdates: 2,
  maxUpdateBytes: 256,
};

function backgroundFixture(timeoutMs = 60000, role: TaskThreadRole = "researcher") {
  const f = fixture(role);
  let idle = false;
  let messages: unknown[] = [];
  let aborted = false;
  let abortError = false;
  let abortCalls = 0;
  let abortWait: (() => Promise<void>) | undefined;
  let inspection: (() => Promise<void>) | undefined;
  const managed = createManagedDispatch({
    ...f.options,
    timeoutMs,
    delegation: backgroundPolicy,
    backgroundTransport: {
      enabled: true,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => {
        const result = { parent: "parent", idle, messages };
        if (inspection) await inspection();
        return result;
      },
      abort: async () => {
        abortCalls++;
        if (abortWait) await abortWait();
        if (abortError) throw new Error("abort unavailable");
        aborted = true;
        idle = true;
      },
    },
  });
  const ack = (callID = "call") =>
    managed.afterTask(
      { callID },
      {
        metadata: {
          sessionId: "child",
          jobId: "child",
          background: true,
          model: { providerID: "fixture", modelID: "worker" },
        },
        output: '<task id="child" state="running">\n<summary>Background task started</summary>',
      },
    );
  const start = async () => {
    await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
    managed.sessionCreated({ id: "child", parentID: "parent" });
    ack();
    await Promise.resolve();
  };
  const terminal = (count = 1, result: unknown = f.success()) => {
    idle = true;
    messages = Array.from({ length: count }, (_, index) => ({
      info: { id: `u${index}`, role: "user" },
      parts: [],
    }));
    messages.push({
      info: {
        id: "answer",
        parentID: `u${count - 1}`,
        role: "assistant",
        time: { completed: 1 },
        finish: "stop",
      },
      parts: [{ type: "text", text: JSON.stringify(result) }],
    });
  };
  const update = (requestId = "update") => ({
    task_id: "child",
    subagent_type: "researcher",
    prompt: formatTaskThreadEnvelope({
      version: 1,
      kind: "queued-update",
      delegationTaskId: "task",
      requestId,
      context: "Additional source context; keep scope unchanged",
    }),
  });
  return {
    ...f,
    managed,
    ack,
    start,
    terminal,
    update,
    setIdle: (value: boolean) => {
      idle = value;
    },
    aborted: () => aborted,
    abortCalls: () => abortCalls,
    abortWith: (fn: (() => Promise<void>) | undefined) => {
      abortWait = fn;
    },
    failAbort: () => {
      abortError = true;
    },
    restoreAbort: () => {
      abortError = false;
    },
    inspectWith: (fn: (() => Promise<void>) | undefined) => {
      inspection = fn;
    },
    setMessages: (value: unknown[]) => {
      messages = value;
      idle = true;
    },
  };
}

test("background policy is closed and blocking default refuses native background", async () => {
  assert.equal(parseDelegationPolicy().mode, "blocking");
  assert.throws(() => parseDelegationPolicy({ ...backgroundPolicy, extra: true }), /exactly/);
  const f = fixture();
  await assert.rejects(
    () =>
      f.managed.beforeTask(
        { sessionID: "parent", callID: "call" },
        { ...f.args(), background: true },
      ),
    /disabled/,
  );
  assert.equal(f.managed.snapshot().runs.length, 0);
});

test("background admission reserves physical headroom and auto falls back conservatively", async () => {
  for (const mode of ["background", "auto"]) {
    const f = fixture();
    const managed = createManagedDispatch({
      ...f.options,
      delegation: {
        ...backgroundPolicy,
        mode,
        resources: { gpu: { maxConcurrentRequests: 1, orchestratorHeadroom: 1 } },
      },
      backgroundTransport: {
        enabled: true,
        models: async () => ({ parent: "fixture/a", worker: "fixture/b" }),
        inspect: async () => {
          throw Error("unused");
        },
        abort: async () => {},
      },
    });
    const args = { ...f.args(), background: undefined as boolean | undefined };
    if (mode === "background") {
      await assert.rejects(
        () => managed.beforeTask({ sessionID: "parent", callID: "call" }, args),
        /headroom/,
      );
      assert.equal(managed.snapshot().runs.length, 0);
    } else {
      await managed.beforeTask({ sessionID: "parent", callID: "call" }, args);
      assert.equal(args.background, false);
    }
  }
});

test("background start retains capacity, allows parent questions, and accepts only authoritative terminal evidence", async () => {
  const f = backgroundFixture();
  await f.start();
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.equal(
    f.managed.beforeTool({ sessionID: "parent", tool: "question" }, { questions: [] })
      .questions instanceof Array,
    true,
  );
  assert.throws(
    () =>
      f.managed.beforeTool(
        { sessionID: "parent", tool: "write" },
        { filePath: "src/a.txt", content: "bad" },
      ),
    /parent workspace tools/,
  );
  await assert.rejects(
    () => f.managed.beforeTask({ sessionID: "parent", callID: "other" }, f.args(f.packet("other"))),
    /capacity/,
  );
  assert.throws(() => f.ack(), /duplicate/);
  f.terminal();
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "success");
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});

test("V2 native Job terminal proof binds generation, parent and typed result", async () => {
  const f = fixture("researcher");
  let idle = false;
  let job: { status: string; startedAt: number; completedAt?: number; output?: string } = {
    status: "running",
    startedAt: 123,
  };
  const managed = createManagedDispatch({
    ...f.options,
    delegation: backgroundPolicy,
    backgroundTransport: {
      enabled: true,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({ parent: "parent", idle, messages: [], job }),
      abort: async () => {},
    },
  });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  managed.sessionCreated({ id: "child", parentID: "parent" });
  managed.afterTask(
    { callID: "call" },
    {
      metadata: {
        sessionId: "child",
        jobId: "child",
        background: true,
        jobStartedAt: 123,
        model: { providerID: "fixture", modelID: "worker" },
      },
      output: '<task id="child" state="running">\nBackground launch</task>',
    },
  );
  await Promise.resolve();
  idle = true;
  job = {
    status: "completed",
    startedAt: 123,
    completedAt: 124,
    output: JSON.stringify(f.success()),
  };
  await managed.reconcileBackground("child");
  assert.equal(managed.snapshot().runs[0]!.attempts[0]!.state, "success");

  const stale = fixture("researcher");
  const rejected = createManagedDispatch({
    ...stale.options,
    delegation: backgroundPolicy,
    backgroundTransport: {
      enabled: true,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({
        parent: "parent",
        idle: true,
        messages: [],
        job: {
          status: "completed",
          startedAt: 122,
          completedAt: 124,
          output: JSON.stringify(stale.success()),
        },
      }),
      abort: async () => {},
    },
  });
  await rejected.beforeTask({ sessionID: "parent", callID: "call" }, stale.args());
  rejected.sessionCreated({ id: "child", parentID: "parent" });
  rejected.afterTask(
    { callID: "call" },
    {
      metadata: {
        sessionId: "child",
        jobId: "child",
        background: true,
        jobStartedAt: 123,
        model: { providerID: "fixture", modelID: "worker" },
      },
      output: '<task id="child" state="running">\nBackground launch</task>',
    },
  );
  await rejected.reconcileBackground("child").catch((error: unknown) => {
    assert.match(String(error), /Job completion is not correlated/);
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(rejected.snapshot().stopped, true);
});

test("V2 cancellation requires a terminal Job from the acknowledged generation", async () => {
  const f = fixture("researcher");
  let generation = 123;
  let status = "running";
  const managed = createManagedDispatch({
    ...f.options,
    delegation: backgroundPolicy,
    backgroundTransport: {
      enabled: true,
      models: async () => ({ parent: "fixture/parent", worker: "fixture/worker" }),
      inspect: async () => ({
        parent: "parent",
        idle: status !== "running",
        messages: [],
        job: {
          status,
          startedAt: generation,
          ...(status !== "running" ? { completedAt: 124 } : {}),
        },
      }),
      abort: async () => {
        status = "cancelled";
        generation = 122;
      },
    },
  });
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  managed.sessionCreated({ id: "child", parentID: "parent" });
  managed.afterTask(
    { callID: "call" },
    {
      metadata: {
        sessionId: "child",
        jobId: "child",
        background: true,
        jobStartedAt: 123,
        model: { providerID: "fixture", modelID: "worker" },
      },
      output: '<task id="child" state="running">\nBackground launch</task>',
    },
  );
  await assert.rejects(() => managed.cancelBackground("parent"), /termination not reconciled/);
  assert.equal((await managed.recoveryStatus("parent")).state, "blocked");
});

test("queued context update is bounded, charged, ordered, and distinct from clarification", async () => {
  const f = backgroundFixture();
  await f.start();
  const args = f.update();
  await f.managed.beforeTask({ sessionID: "parent", callID: "update-call" }, args);
  f.ack("update-call");
  assert.match(args.prompt, /SAME immutable task/);
  assert.equal(f.managed.snapshot().runs[0]!.continuations, 1);
  assert.equal(f.managed.snapshot().runs[0]!.counts.researcher, 2);
  await assert.rejects(
    () => f.managed.beforeTask({ sessionID: "parent", callID: "duplicate" }, f.update()),
    /duplicate/,
  );
  f.terminal(1);
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  f.setIdle(false);
  await assert.rejects(
    () => f.managed.beforeTask({ sessionID: "parent", callID: "over-budget" }, f.update("next")),
    /budget/,
  );
  f.terminal(2);
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "success");
});

test("background cancellation retains lease until abort acknowledgement and rejects late completion", async () => {
  const f = backgroundFixture();
  await f.start();
  assert.equal(f.managed.currentTaskView("child")?.goal, "bounded work");
  await f.managed.cancelBackground("parent");
  assert.equal(f.managed.currentTaskView("parent"), null);
  assert.equal(f.managed.currentTaskView("child"), null);
  assert.equal(f.aborted(), true);
  assert.equal(f.managed.snapshot().stopped, true);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
  f.terminal();
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
});
test("reconciled background cancellation permits a fresh ID after orchestrator review", async () => {
  const f = backgroundFixture();
  await f.start();
  await f.managed.cancelBackground("parent");
  const status = await f.managed.recoveryStatus("parent");
  assert.equal(status.state, "ready");
  if (status.state !== "ready") throw new Error("expected reconciled cancellation");
  assert.equal((await f.managed.releaseForFresh("parent", status.treeHash)).state, "fresh-only");
  const nextId = "new-after-cancellation";
  fs.mkdirSync(path.join(f.trace, "orchestrations", nextId));
  fs.writeFileSync(
    path.join(f.trace, "orchestrations", nextId, "normalized-spec.json"),
    JSON.stringify({ ...f.spec, orchestrationId: nextId }),
  );
  await f.managed.beforeTask(
    { sessionID: "parent", callID: "new-call" },
    f.args({ ...f.packet("new-task"), orchestrationId: nextId }),
  );
  assert.equal(f.managed.snapshot().runs.length, 2);
  assert.equal(f.managed.snapshot().stopped, false);
});
test("the bound orchestrator can use the recovery tools while ordinary stopped tools stay denied", async () => {
  const f = backgroundFixture();
  await f.start();
  await f.managed.cancelBackground("parent");
  const offlineTool = Object.assign((definition: Record<string, unknown>) => definition, {
    schema: { string: () => ({}) },
  });
  const hooks = await HarnessLifecyclePlugin(
    { directory: f.workspace, toolFactory: offlineTool },
    () => f.managed,
  );
  const statusTool = hooks.tool.harness_recovery_status as {
    execute: (args: Record<string, string>, context: { sessionID: string }) => Promise<string>;
  };
  const resolveTool = hooks.tool.harness_recovery_resolve as {
    execute: (args: Record<string, string>, context: { sessionID: string }) => Promise<string>;
  };
  const releaseTool = hooks.tool.harness_recovery_release as {
    execute: (
      args: { expectedTreeHash: string },
      context: { sessionID: string },
    ) => Promise<string>;
  };
  await assert.rejects(
    () =>
      hooks["tool.execute.before"](
        { tool: "harness_recovery_status", sessionID: "child" },
        { args: {} },
      ),
    /primary session/,
  );
  const input = { tool: "harness_recovery_status", sessionID: "parent" };
  const output = { args: {} };
  await hooks["tool.execute.before"](input, output);
  const status = JSON.parse(await statusTool.execute({}, { sessionID: "parent" }));
  assert.equal(status.state, "ready");
  await hooks["tool.execute.before"](
    { tool: "harness_recovery_resolve", sessionID: "parent" },
    { args: {} },
  );
  assert.equal(JSON.parse(await resolveTool.execute({}, { sessionID: "parent" })).state, "blocked");
  await hooks["tool.execute.before"](
    { tool: "harness_recovery_release", sessionID: "parent" },
    { args: { expectedTreeHash: status.treeHash } },
  );
  const released = JSON.parse(
    await releaseTool.execute({ expectedTreeHash: status.treeHash }, { sessionID: "parent" }),
  );
  assert.equal(released.state, "fresh-only");
  assert.equal(f.managed.snapshot().stopped, false);
});

test("background stale workspace proof fails and restart cannot restore reservation", async () => {
  const f = backgroundFixture();
  await f.start();
  fs.writeFileSync(path.join(f.workspace, "src/a.txt"), "external mutation");
  f.terminal();
  await assert.rejects(() => f.managed.reconcileBackground("child"), /scope|changed/);
  assert.equal(f.managed.snapshot().stopped, true);
  const fresh = createManagedDispatch(f.options);
  await assert.rejects(
    () => fresh.beforeTask({ sessionID: "parent", callID: "new" }, f.args()),
    /already started/,
  );
});

test("lost parent keeps old callback uncertain while a separate workspace and trace admit fresh progress", async () => {
  const old = fixture();
  await old.managed.beforeTask({ sessionID: "lost-parent", callID: "pending" }, old.args());
  old.managed.interrupt("parent session lost before native callback");
  const status = await old.managed.recoveryStatus("new-primary");
  assert.equal(status.state, "blocked");
  assert.match(status.nextAction, /same-session recovery shell/);
  assert.deepEqual(
    old.managed.beforeTool({ sessionID: "new-primary", tool: "read" }, { filePath: "src/a.txt" }),
    { filePath: "src/a.txt" },
  );
  assert.throws(
    () => old.managed.authorizeRecoveryPrimary("child", "lost-parent"),
    /native primary/,
  );
  assert.throws(
    () => old.managed.beforeTool({ sessionID: "new-primary", tool: "bash" }, { command: "true" }),
    /authenticated native primary/,
  );
  old.managed.authorizeRecoveryPrimary("new-primary", undefined);
  const shell = old.managed.beforeTool(
    { sessionID: "new-primary", callID: "recovery-shell", tool: "bash" },
    { command: "printf progress > result.txt" },
  );
  assert.equal(typeof shell.workdir, "string");
  const recoveryRoot = String(shell.workdir);
  assert.equal(spawnSync("/bin/sh", ["-c", String(shell.command)]).status, 0);
  assert.equal(fs.readFileSync(path.join(recoveryRoot, "result.txt"), "utf8"), "progress");
  const nested = old.managed.beforeTool(
    { sessionID: "new-primary", callID: "nested-workdir", tool: "bash" },
    { command: "printf nested > nested.txt", workdir: path.join(old.workspace, "src") },
  );
  assert.equal(nested.workdir, recoveryRoot);
  assert.equal(spawnSync("/bin/sh", ["-c", String(nested.command)]).status, 0);
  assert.equal(fs.readFileSync(path.join(recoveryRoot, "nested.txt"), "utf8"), "nested");
  const denied = old.managed.beforeTool(
    { sessionID: "new-primary", callID: "recovery-denied", tool: "bash" },
    { command: `printf bad > ${path.join(old.workspace, "src/forbidden.txt")}` },
  );
  assert.notEqual(spawnSync("/bin/sh", ["-c", String(denied.command)]).status, 0);
  assert.equal(fs.existsSync(path.join(old.workspace, "src/forbidden.txt")), false);
  const traceDenied = old.managed.beforeTool(
    { sessionID: "new-primary", callID: "recovery-trace-denied", tool: "bash" },
    { command: `printf bad > ${path.join(old.trace, "forbidden.txt")}` },
  );
  assert.notEqual(spawnSync("/bin/sh", ["-c", String(traceDenied.command)]).status, 0);
  assert.equal(fs.existsSync(path.join(old.trace, "forbidden.txt")), false);
  assert.equal((await old.managed.recoveryStatus("new-primary")).recoveryShellRoot, recoveryRoot);
  assert.throws(
    () => old.managed.beforeTool({ sessionID: "child", tool: "bash" }, { command: "true" }),
    /authenticated native primary/,
  );
  fs.renameSync(recoveryRoot, recoveryRoot + "-moved");
  assert.throws(
    () => old.managed.beforeTool({ sessionID: "new-primary", tool: "bash" }, { command: "true" }),
    /ENOENT|identity changed/,
  );
  await assert.rejects(() => old.managed.resolveRecovery("new-primary"), /bound stopped parent/);
  await assert.rejects(
    () => old.managed.beforeTask({ sessionID: "new-primary", callID: "replay" }, old.args()),
    /interrupted/,
  );
  const oldMarker = path.join(old.trace, "orchestrations/fixture/dispatch-started.json");
  assert.equal(fs.existsSync(oldMarker), true);

  const fresh = fixture();
  const freshId = "fresh-isolated-after-loss";
  fs.mkdirSync(path.join(fresh.trace, "orchestrations", freshId));
  fs.writeFileSync(
    path.join(fresh.trace, "orchestrations", freshId, "normalized-spec.json"),
    JSON.stringify({ ...fresh.spec, orchestrationId: freshId }),
  );
  const before = captureWorkspace(fresh.workspace).treeHash;
  fs.writeFileSync(path.join(old.workspace, "src/a.txt"), "old worker side effect remains unknown");
  assert.equal(captureWorkspace(fresh.workspace).treeHash, before);
  await fresh.managed.beforeTask(
    { sessionID: "fresh-parent", callID: "fresh-call" },
    fresh.args({ ...fresh.packet("fresh-task"), orchestrationId: freshId }),
  );
  assert.equal(fresh.managed.snapshot().stopped, false);
  assert.equal(fresh.managed.snapshot().runs[0]!.attempts[0]!.state, "running");
  assert.equal(fs.existsSync(oldMarker), true);
  assert.equal(
    fs.existsSync(path.join(fresh.trace, "orchestrations", freshId, "dispatch-started.json")),
    true,
  );
});

test("stopped V1-style run creates a private same-session shell beneath an owned home", async () => {
  const f = fixture();
  const home = path.join(f.root, "home");
  fs.mkdirSync(home, { mode: 0o755 });
  const priorState = process.env.XDG_STATE_HOME;
  delete process.env.XDG_STATE_HOME;
  try {
    const { recoveryParent: _unused, ...options } = f.options;
    const managed = createManagedDispatch({
      ...options,
      recoveryHome: home,
      traceRoot: path.join(f.workspace, ".memory"),
    });
    managed.interrupt("native callback identity unavailable");
    managed.authorizeRecoveryPrimary("primary", undefined);
    const shell = managed.beforeTool(
      { sessionID: "primary", tool: "bash" },
      { command: "printf progress > result.txt" },
    );
    assert.ok(String(shell.workdir).startsWith(path.join(home, "opencode-harness-recovery")));
    assert.equal(spawnSync("/bin/sh", ["-c", String(shell.command)]).status, 0);
    assert.equal(
      fs.readFileSync(path.join(String(shell.workdir), "result.txt"), "utf8"),
      "progress",
    );
    fs.chmodSync(home, 0o777);
    const unsafe = createManagedDispatch({
      ...options,
      recoveryHome: home,
      traceRoot: path.join(f.workspace, ".memory"),
    });
    unsafe.interrupt("native callback identity unavailable");
    unsafe.authorizeRecoveryPrimary("primary", undefined);
    assert.throws(
      () => unsafe.beforeTool({ sessionID: "primary", tool: "bash" }, { command: "true" }),
      /existing current-user mode-0700 external parent/,
    );
  } finally {
    if (priorState === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = priorState;
  }
});

test("failed native abort retains uncertain capacity", async () => {
  const f = backgroundFixture();
  await f.start();
  f.failAbort();
  await assert.rejects(() => f.managed.cancelBackground("parent"), /abort unavailable/);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancel-requested");
  assert.equal(f.managed.snapshot().stopped, true);
  assert.equal((await f.managed.recoveryStatus("parent")).state, "blocked");
  await assert.rejects(() => f.managed.resolveRecovery("child"), /primary session/);
  assert.equal((await f.managed.resolveRecovery("parent")).state, "blocked");
  f.restoreAbort();
  assert.equal((await f.managed.resolveRecovery("parent")).state, "terminated");
  const reviewed = await f.managed.recoveryStatus("parent");
  assert.equal(reviewed.state, "ready");
  if (reviewed.state !== "ready") throw new Error("expected reviewed recovery proof");
  assert.equal((await f.managed.releaseForFresh("parent", reviewed.treeHash)).state, "fresh-only");
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
});

test("uncertain pre-launch or pending continuation cannot be resolved by an idle abort", async () => {
  const f = backgroundFixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  f.managed.interrupt("launch not acknowledged");
  assert.equal((await f.managed.resolveRecovery("parent")).state, "blocked");
  assert.equal((await f.managed.recoveryStatus("parent")).state, "blocked");
});

test("recovery resolver is bound to stopped runs and leaves worker reserved if abort fails", async () => {
  const f = backgroundFixture();
  await f.start();
  await assert.rejects(() => f.managed.resolveRecovery("parent"), /bound stopped parent/);
  f.failAbort();
  await assert.rejects(() => f.managed.cancelBackground("parent"), /abort unavailable/);
  const before = f.abortCalls();
  assert.equal((await f.managed.resolveRecovery("parent")).state, "blocked");
  assert.equal(f.abortCalls(), before + 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
});

test("recovery cannot release capacity while its retry abort is in flight", async () => {
  const f = backgroundFixture();
  await f.start();
  f.failAbort();
  await assert.rejects(() => f.managed.cancelBackground("parent"), /abort unavailable/);
  f.restoreAbort();
  let releaseAbort!: () => void;
  let entered!: () => void;
  const enteredAbort = new Promise<void>((resolve) => {
    entered = resolve;
  });
  f.abortWith(
    () =>
      new Promise<void>((resolve) => {
        releaseAbort = resolve;
        entered();
      }),
  );
  const resolution = f.managed.resolveRecovery("parent");
  await enteredAbort;
  assert.equal((await f.managed.recoveryStatus("parent")).state, "blocked");
  await assert.rejects(() => f.managed.resolveRecovery("parent"), /in progress/);
  await assert.rejects(() => f.managed.releaseForFresh("parent", "0".repeat(64)), /progress/);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  releaseAbort();
  assert.equal((await resolution).state, "terminated");
  const status = await f.managed.recoveryStatus("parent");
  assert.equal(status.state, "ready");
});

test("native error without finish rejects immediately", async () => {
  const f = backgroundFixture();
  await f.start();
  f.setMessages([
    { info: { id: "u", role: "user" } },
    {
      info: {
        id: "a",
        role: "assistant",
        parentID: "u",
        time: { completed: 1 },
        error: { name: "Failure" },
      },
      parts: [],
    },
  ]);
  await assert.rejects(() => f.managed.reconcileBackground("child"), /worker failed/);
  assert.equal(f.managed.snapshot().stopped, true);
});

test("idle event during in-flight inspection is reconciled again", async () => {
  const f = backgroundFixture();
  await f.start();
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  f.inspectWith(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
        entered();
      }),
  );
  const first = f.managed.reconcileBackground("child");
  await started;
  f.terminal();
  f.inspectWith(undefined);
  await f.managed.reconcileBackground("child");
  release();
  await first;
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "success");
});

test("actual native model mismatch fails closed", async () => {
  const f = backgroundFixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  assert.throws(
    () =>
      f.managed.afterTask(
        { callID: "call" },
        {
          metadata: {
            sessionId: "child",
            jobId: "child",
            background: true,
            model: { providerID: "other", modelID: "worker" },
          },
          output: '<task id="child" state="running">',
        },
      ),
    /acknowledgement/,
  );
  assert.equal(f.managed.snapshot().stopped, true);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
});

test("background clarification preserves the original deadline", async () => {
  const f = backgroundFixture(50);
  await f.start();
  const { outputContract: _contract, ...clarification } = f.success();
  void _contract;
  f.terminal(1, {
    ...clarification,
    outcome: "clarification",
    summary: "Need choice",
    requestNonce: "nonce",
    question: "Which input?",
    evidence: [],
    artifacts: [],
  });
  await f.managed.reconcileBackground("child");
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "awaiting-guidance");
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(f.aborted(), true);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
});

test("acknowledged update call IDs cannot be replayed with a new request ID", async () => {
  const f = backgroundFixture();
  await f.start();
  await f.managed.beforeTask({ sessionID: "parent", callID: "update-call" }, f.update());
  f.ack("update-call");
  await assert.rejects(
    () =>
      f.managed.beforeTask({ sessionID: "parent", callID: "update-call" }, f.update("different")),
    /duplicate/,
  );
  await f.managed.cancelBackground("parent");
});

test("background validator still requires independently observed command proof", async () => {
  const f = backgroundFixture(60000, "validator");
  await f.start();
  f.terminal();
  await assert.rejects(() => f.managed.reconcileBackground("child"), /trusted command success/);
  assert.equal(f.managed.snapshot().stopped, true);
  assert.equal(Object.keys(f.managed.snapshot().runs[0]!.gates).length, 0);
});

test("auto mode falls back when native model lookup is unavailable", async () => {
  const f = fixture();
  const managed = createManagedDispatch({
    ...f.options,
    delegation: { ...backgroundPolicy, mode: "auto" },
    backgroundTransport: {
      enabled: true,
      models: async () => {
        throw new Error("unavailable");
      },
      inspect: async () => {
        throw new Error("unused");
      },
      abort: async () => {},
    },
  });
  const args = { ...f.args(), background: undefined as boolean | undefined };
  await managed.beforeTask({ sessionID: "parent", callID: "call" }, args);
  assert.equal(args.background, false);
  assert.equal(managed.snapshot().runs[0]!.active, 1);
});

async function startBackgroundLifecycle(f: ReturnType<typeof backgroundFixture>) {
  const hooks = await HarnessLifecyclePlugin({ directory: f.workspace }, () => f.managed);
  await hooks["tool.execute.before"](
    { tool: "task", sessionID: "parent", callID: "call" },
    { args: f.args() },
  );
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  f.ack();
  await Promise.resolve();
  return hooks;
}

test("idle/status/chat notifications cannot consume a clarification twice and its deadline remains active", async () => {
  const f = backgroundFixture(200);
  const hooks = await startBackgroundLifecycle(f);
  const { outputContract: _contract, ...result } = f.success();
  void _contract;
  f.terminal(1, {
    ...result,
    outcome: "clarification",
    summary: "Need choice",
    requestNonce: "nonce",
    question: "Which input?",
    evidence: [],
    artifacts: [],
  });
  await f.managed.reconcileBackground("child");
  for (let i = 0; i < 3; i++) {
    await hooks.event({ event: { type: "session.idle", properties: { sessionID: "child" } } });
    await hooks.event({
      event: {
        type: "session.status",
        properties: { sessionID: "child", status: { type: "idle" } },
      },
    });
    await hooks["chat.message"]({ sessionID: "parent" });
  }
  assert.equal(f.managed.snapshot().stopped, false);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "awaiting-guidance");
  assert.throws(() => f.ack(), /duplicate/);
  await new Promise((resolve) => setTimeout(resolve, 250));
  assert.equal(f.abortCalls(), 1);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
});

test("parent error/deletion initiates one native abort and retains capacity until termination", async () => {
  for (const type of ["session.error", "session.deleted"]) {
    const f = backgroundFixture();
    const hooks = await startBackgroundLifecycle(f);
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    f.abortWith(() => pending);
    await hooks.event({ event: { type, properties: { sessionID: "parent" } } });
    const cancellation = f.managed.cancelBackground("parent");
    f.managed.interrupt("duplicate interruption");
    await Promise.resolve();
    assert.equal(f.abortCalls(), 1);
    assert.equal(f.managed.snapshot().runs[0]!.active, 1);
    assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancel-requested");
    release();
    await cancellation;
    assert.equal(f.managed.snapshot().runs[0]!.active, 0);
    assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
  }
});

test("interrupt abort failure retains capacity without recursive retry", async () => {
  const f = backgroundFixture(50);
  await f.start();
  f.failAbort();
  f.managed.interrupt("parent failure");
  await assert.rejects(() => f.managed.cancelBackground("parent"), /abort unavailable/);
  f.managed.interrupt("duplicate failure");
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(f.abortCalls(), 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancel-requested");
});

test("model acknowledgement mismatch aborts the actual bound worker", async () => {
  const f = backgroundFixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.abortWith(() => pending);
  assert.throws(
    () =>
      f.managed.afterTask(
        { callID: "call" },
        {
          metadata: {
            sessionId: "child",
            jobId: "child",
            background: true,
            model: { providerID: "other", modelID: "worker" },
          },
          output: '<task id="child" state="running">',
        },
      ),
    /acknowledgement/,
  );
  const cancellation = f.managed.cancelBackground("parent");
  await Promise.resolve();
  assert.equal(f.abortCalls(), 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  release();
  await cancellation;
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});

test("interruption before native start cannot release an idle but not-yet-launched child", async () => {
  const f = backgroundFixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  f.managed.interrupt("parent stopped before child creation");
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  const pending = f.managed.cancelBackground("parent");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(f.abortCalls(), 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.throws(() => f.ack(), /termination in progress/);
  await pending;
  assert.equal(f.abortCalls(), 2);
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});

test("awaiting background clarification still accepts explicit cancellation control", async () => {
  const f = backgroundFixture();
  await f.start();
  const { outputContract: _contract, ...result } = f.success();
  void _contract;
  f.terminal(1, {
    ...result,
    outcome: "clarification",
    summary: "Need choice",
    requestNonce: "nonce",
    question: "Which input?",
    evidence: [],
    artifacts: [],
  });
  await f.managed.reconcileBackground("child");
  await assert.rejects(
    () =>
      f.managed.beforeTask(
        { sessionID: "parent", callID: "cancel-call" },
        {
          task_id: "child",
          subagent_type: "researcher",
          prompt: formatTaskThreadEnvelope({
            version: 1,
            kind: "cancel",
            delegationTaskId: "task",
            requestId: "cancel-one",
          }),
        },
      ),
    /cancelled and termination reconciled/,
  );
  assert.equal(f.managed.snapshot().runs[0]!.attempts[0]!.state, "cancelled");
});

test("launch arriving during an earlier abort still requires a post-launch abort", async () => {
  const f = backgroundFixture();
  await f.managed.beforeTask({ sessionID: "parent", callID: "call" }, f.args());
  f.managed.sessionCreated({ id: "child", parentID: "parent" });
  let release!: () => void;
  const pendingAbort = new Promise<void>((resolve) => {
    release = resolve;
  });
  f.abortWith(() => pendingAbort);
  f.managed.interrupt("before acknowledgement");
  const cancelled = f.managed.cancelBackground("parent");
  await Promise.resolve();
  assert.equal(f.abortCalls(), 1);
  assert.throws(() => f.ack(), /termination in progress/);
  release();
  await cancelled;
  assert.equal(f.abortCalls(), 2);
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});

for (const duringAbort of [false, true])
  test(`clarification continuation cancellation waits for new launch (during abort: ${duringAbort})`, async () => {
    const f = backgroundFixture();
    await f.start();
    const { outputContract: _contract, ...result } = f.success();
    void _contract;
    f.terminal(1, {
      ...result,
      outcome: "clarification",
      summary: "Need choice",
      requestNonce: "nonce",
      question: "Which input?",
      evidence: [],
      artifacts: [],
    });
    await f.managed.reconcileBackground("child");
    await f.managed.reconcileBackground("child");
    await f.managed.beforeTask(
      { sessionID: "parent", callID: "reply" },
      {
        task_id: "child",
        subagent_type: "researcher",
        prompt: formatTaskThreadEnvelope({
          version: 1,
          kind: "clarification-response",
          delegationTaskId: "task",
          requestNonce: "nonce",
          answer: "fixture",
        }),
      },
    );
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    if (duringAbort) f.abortWith(() => pending);
    f.managed.interrupt("continuation interrupted before launch");
    const cancelled = f.managed.cancelBackground("parent");
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(f.abortCalls(), 1);
    assert.equal(f.managed.snapshot().runs[0]!.active, 1);
    assert.throws(() => f.ack("reply"), /termination in progress/);
    release();
    await cancelled;
    assert.equal(f.abortCalls(), 2);
    assert.equal(f.managed.snapshot().runs[0]!.active, 0);
  });

test("queued update cancellation waits for its native admission after aborting the previous turn", async () => {
  const f = backgroundFixture();
  await f.start();
  await f.managed.beforeTask({ sessionID: "parent", callID: "update-call" }, f.update());
  f.managed.interrupt("queued update not yet launched");
  const cancelled = f.managed.cancelBackground("parent");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.throws(() => f.ack("update-call"), /termination in progress/);
  await cancelled;
  assert.equal(f.abortCalls(), 2);
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});

test("cancellation retains capacity until every pending queued launch is acknowledged", async () => {
  const f = backgroundFixture();
  const specPath = path.join(f.trace, "orchestrations/fixture/normalized-spec.json");
  const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
  spec.budgets.maxLeafAgentsByRole.researcher = 3;
  fs.writeFileSync(specPath, JSON.stringify(spec));
  await f.start();
  await f.managed.beforeTask({ sessionID: "parent", callID: "update-one" }, f.update("one"));
  await f.managed.beforeTask({ sessionID: "parent", callID: "update-two" }, f.update("two"));
  f.managed.interrupt("two pending native launches");
  const cancelled = f.managed.cancelBackground("parent");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.throws(() => f.ack("update-one"), /termination in progress/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(f.abortCalls(), 1);
  assert.equal(f.managed.snapshot().runs[0]!.active, 1);
  assert.throws(() => f.ack("update-two"), /termination in progress/);
  await cancelled;
  assert.equal(f.abortCalls(), 2);
  assert.equal(f.managed.snapshot().runs[0]!.active, 0);
});
