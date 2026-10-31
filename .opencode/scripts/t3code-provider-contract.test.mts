import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { globalOperation } from "../../bin/global-harness.ts";
import { createDispatchController } from "../src/plugin-modules/dispatch-controller.ts";
import {
  default as globalPlugin,
  createGlobalNativeAdapter,
  replaceGlobalResult,
} from "../src/plugin-modules/global-native-plugin.ts";
import type {
  GlobalControlTool,
  GlobalNativeContext,
  NativeEvent,
} from "../src/plugin-modules/global-native-plugin.ts";
import {
  createGlobalProtocol,
  declaredFileEvidence,
} from "../src/plugin-modules/global-protocol.ts";
import {
  TASK_THREAD_ROLE_PACKET_FIELDS,
  formatTaskThreadEnvelope,
} from "../src/plugin-modules/task-thread-policy.ts";
import type { TaskThreadRole } from "../src/plugin-modules/task-thread-policy.ts";
import { TASK_MODES, taskContractShape } from "../src/plugin-modules/task-contracts.ts";
import type { TaskEvidence } from "../src/plugin-modules/task-contracts.ts";

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

function structured(role: TaskThreadRole = "researcher", id = "task", sha256 = "a".repeat(64)) {
  const fields = Object.keys(taskContractShape(role).requiredSuccessOutput);
  return {
    version: 1,
    orchestrationId: "run",
    delegationTaskId: id,
    scopeKey: "unit",
    role,
    taskMode: TASK_MODES[role][0],
    outcome: "success",
    summary: "checked",
    evidence: [
      { reference: "test.log", command: "node --test", exitCode: 0, sha256 },
    ] as TaskEvidence[],
    artifacts: [{ reference: "result.md", sha256 }] as TaskEvidence[],
    outputContract: {
      ...Object.fromEntries(fields.map((k) => [k, "evidence"])),
      traceArtifactPath: "result.md",
    },
  };
}

function fixture(
  t: { after(fn: () => void): void },
  options: Parameters<typeof createGlobalNativeAdapter>[1] = {},
) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "native-global-λ-"));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.writeFileSync(path.join(cwd, "a.txt"), "evidence");
  const sessions = new Map<string, Awaited<ReturnType<GlobalNativeContext["session"]["get"]>>>([
    ["parent", { id: "parent", agent: "build", location: { directory: cwd } }],
    [
      "child",
      { id: "child", parentID: "parent", agent: "researcher", location: { directory: cwd } },
    ],
    [
      "validator",
      { id: "validator", parentID: "parent", agent: "validator", location: { directory: cwd } },
    ],
  ]);
  const hooks = new Map<string, (event: NativeEvent) => Promise<void>>();
  const commands = new Map<
    string,
    { execute(input: { sessionID: string; prompt: { text: string } }): Promise<void> }
  >();
  let executions = 0;
  const nativeCalls: { input: unknown; context: Record<string, unknown> }[] = [];
  const modelTools = new Map<string, GlobalControlTool>();
  const ctx: GlobalNativeContext = {
    session: {
      get: async ({ sessionID }) => {
        const s = sessions.get(sessionID);
        if (!s) throw new Error("missing session");
        return s;
      },
    },
    tool: {
      transform: async (fn) => {
        fn({
          add: (definition) => {
            modelTools.set(definition.name, definition);
          },
        });
      },
      hook: async (name, fn) => {
        hooks.set(name, fn);
      },
      list: async () => [
        {
          id: "subagent",
          execute: async (input, context) => {
            nativeCalls.push({ input, context });
            executions++;
            return nativeResult(structured(), "child", "raw");
          },
        },
      ],
    },
    command: {
      transform: async (fn) => {
        fn({
          add: (definition) => {
            commands.set(definition.name, definition);
          },
        });
      },
    },
  };
  const adapter = createGlobalNativeAdapter(ctx, { persist: async () => {}, ...options });
  return {
    cwd,
    sessions,
    hooks,
    commands,
    modelTools,
    adapter,
    ctx,
    nativeCalls,
    executions: () => executions,
  };
}

function event(role: TaskThreadRole = "researcher", id = "task"): NativeEvent {
  return {
    tool: "subagent",
    sessionID: "parent",
    agent: "build",
    messageID: "message",
    id,
    input: {
      agent: role,
      description: "inspect evidence",
      prompt: formatTaskThreadEnvelope({
        kind: "fresh",
        version: 1,
        role,
        packet: packet(role, id),
      }),
      background: false,
    },
  };
}

function nativeResult(
  result: unknown,
  childID = "child",
  format: "raw" | "normalized" = "normalized",
) {
  const text = JSON.stringify(result);
  const wrapper = `<subagent sessionID="${childID}" state="completed">\n${text}\n</subagent>`;
  return {
    output: { sessionID: childID, status: "completed", output: text },
    // Native Tool.runtime.execute normalizes content before execute.after hooks.
    // Direct Tool.Info executors used by slash commands still return the raw string.
    content: format === "raw" ? wrapper : [{ type: "text" as const, text: wrapper }],
    metadata: { sessionID: childID, status: "completed" },
  };
}

for (const format of ["normalized", "raw"] as const)
  test(`native ${format} subagent content preserves output and verified child correlation`, async (t) => {
    const f = fixture(t);
    await admit(f.adapter);
    const call = event();
    await f.adapter.before(call);
    call.status = "completed";
    call.result = nativeResult(structured(), "child", format);
    await f.adapter.after(call);
    assert.equal(
      (call.result as { metadata: { status: string } }).metadata.status,
      "completed",
      JSON.stringify(call.result),
    );
  });

async function admit(adapter: ReturnType<typeof createGlobalNativeAdapter>) {
  await adapter.action("parent", { version: 1, action: "orchestration.admit", spec: workflow() });
}

async function ordinary(adapter: ReturnType<typeof createGlobalNativeAdapter>) {
  for (const sessionID of ["parent", "another-session"])
    for (const tool of ["shell", "read", "edit", "patch", "web", "code"]) {
      const call = {
        tool,
        sessionID,
        agent: "build",
        messageID: "m",
        id: "ordinary",
        input: { command: "native unchanged", unusual: [1, 2] },
      };
      const before = structuredClone(call);
      await adapter.before(call);
      await adapter.after(call);
      assert.deepEqual(call, before);
    }
}

for (const mutation of [
  "extra-block",
  "empty",
  "file",
  "wrong-text",
  "extra-field",
  "missing",
  "fallback-json",
] as const)
  test(`normalized content rejection keeps verified identities explicit: ${mutation}`, async (t) => {
    const records: Record<string, unknown>[] = [];
    const f = fixture(t, {
      persist: async (record) => {
        records.push(record);
      },
    });
    await admit(f.adapter);
    const call = event();
    await f.adapter.before(call);
    const result = nativeResult(structured(), "child", "raw");
    const wrapper = String(result.content);
    const invalid = {
      "extra-block": [
        { type: "text", text: wrapper },
        { type: "text", text: "unverified success" },
      ],
      empty: [],
      file: [{ type: "file", uri: "file:///unverified", mime: "text/plain" }],
      "wrong-text": [{ type: "text", text: "unverified success" }],
      "extra-field": [{ type: "text", text: wrapper, extra: "unverified success" }],
      missing: undefined,
      "fallback-json": JSON.stringify(result.output),
    };
    call.status = "completed";
    call.result = { ...result, content: invalid[mutation] };
    await assert.doesNotReject(f.adapter.after(call));
    const rejected = call.result as {
      output: Record<string, unknown>;
      metadata: { harness: string };
    };
    assert.equal(rejected.metadata.harness, "rejected");
    assert.equal(rejected.output.parentSessionID, "parent");
    assert.equal(rejected.output.verifiedChildSessionID, "child");
    assert.equal(Object.hasOwn(rejected.output, "sessionID"), false);
    assert.equal(records.at(-1)?.event, "task.rejected");
    assert.equal(records.at(-1)?.verifiedChildSessionID, "child");
    assert.doesNotMatch(JSON.stringify(call.result), /unverified success|file:\/\/\/unverified/);
    await ordinary(f.adapter);
  });

test("pinned native foreground success and independent command-backed acceptance", async (t) => {
  const { adapter, cwd } = fixture(t);
  await admit(adapter);
  const first = event();
  await adapter.before(first);
  first.status = "completed";
  first.result = nativeResult(structured());
  await adapter.after(first);
  assert.equal((first.result as { metadata: { status: string } }).metadata.status, "completed");
  await assert.rejects(
    adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    /incomplete/,
  );
  const proof = await declaredFileEvidence(cwd, ["a.txt"]);
  const second = event("validator", "validation");
  await adapter.before(second);
  second.status = "completed";
  second.result = nativeResult(structured("validator", "validation", proof.sha256), "validator");
  await adapter.after(second);
  assert.deepEqual(
    await adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    { accepted: true, treeHash: proof.sha256 },
  );
  await ordinary(adapter);
});

test("four-role add implementation reaches acceptance with reference-shaped planning evidence", async (t) => {
  const f = fixture(t);
  const spec = workflow();
  const roles = ["researcher", "planner", "implementer", "validator"] as const;
  const files = ["add.mjs", "add.test.mjs"];
  spec.allowedPaths = files;
  spec.deliverables = files;
  spec.workUnits[0]!.allowedPaths = files;
  spec.acceptanceGates[0]!.evidenceCommand = "node --test add.test.mjs";
  spec.roleModeTaskMapping = roles.map((role) => ({
    workUnitId: "unit",
    role,
    taskMode: TASK_MODES[role][0]!,
    boundedTask: `bounded ${role} task`,
  }));
  spec.budgets.maxTotalLeafAgents = 4;
  spec.budgets.maxLeafAgentsByRole = { researcher: 1, planner: 1, implementer: 1, validator: 1 };
  for (const role of roles)
    f.sessions.set(role, {
      id: role,
      parentID: "parent",
      agent: role,
      location: { directory: f.cwd },
    });
  await f.adapter.action("parent", {
    version: 1,
    action: "orchestration.admit",
    spec,
    evidenceFiles: files,
  });
  const observedCommands: string[] = [];
  let researchArtifact = "";
  for (const role of roles) {
    const call = event(role, `${role}-task`);
    await f.adapter.before(call);
    if (role === "implementer") {
      fs.writeFileSync(
        path.join(f.cwd, "add.mjs"),
        "export function add(a, b) { return a + b; }\n",
      );
      fs.writeFileSync(
        path.join(f.cwd, "add.test.mjs"),
        "import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { add } from './add.mjs';\ntest('positive', () => assert.equal(add(2, 3), 5));\ntest('negative', () => assert.equal(add(-1, 1), 0));\n",
      );
    }
    const proof = await declaredFileEvidence(f.cwd, files);
    const result = structured(role, `${role}-task`, proof.sha256);
    const artifact = path.join(f.cwd, `${role}-artifact.md`);
    fs.writeFileSync(artifact, `# ${role}\nObserved bounded ${role} task.\n`);
    result.artifacts = [{ reference: artifact }];
    result.outputContract.traceArtifactPath = artifact;
    if (role === "researcher") researchArtifact = artifact;
    if (role === "researcher" || role === "planner")
      result.evidence = [
        { reference: role === "planner" ? researchArtifact : "missing target files" },
      ];
    else {
      const execution = spawnSync(process.execPath, ["--test", "add.test.mjs"], {
        cwd: f.cwd,
        encoding: "utf8",
        env: Object.fromEntries(
          Object.entries(process.env).filter(([key]) => key !== "NODE_TEST_CONTEXT"),
        ),
      });
      assert.equal(execution.status, 0, execution.stderr);
      assert.match(execution.stdout, /pass 2/);
      observedCommands.push(role);
      result.evidence = [
        {
          reference: "test output",
          command: "node --test add.test.mjs",
          exitCode: execution.status!,
          sha256: proof.sha256,
        },
      ];
    }
    call.status = "completed";
    call.result = nativeResult(result, role);
    await f.adapter.after(call);
    assert.equal(
      (call.result as { metadata: { status: string } }).metadata.status,
      "completed",
      JSON.stringify(call.result),
    );
    if (role !== "validator")
      await assert.rejects(
        f.adapter.action("parent", {
          version: 1,
          action: "orchestration.accept",
          orchestrationId: "run",
        }),
        /incomplete/,
      );
  }
  assert.deepEqual(observedCommands, ["implementer", "validator"]);
  const proof = await declaredFileEvidence(f.cwd, files);
  assert.deepEqual(
    await f.adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    { accepted: true, treeHash: proof.sha256 },
  );
});

test("native default-agent parent admits researcher and validator when session agent is unset", async (t) => {
  const f = fixture(t);
  Reflect.deleteProperty(f.sessions.get("parent")!, "agent");
  await admit(f.adapter);
  for (const role of ["researcher", "validator"] as const) {
    const id = role === "researcher" ? "task" : "validation";
    const call = event(role, id);
    await f.adapter.before(call);
    const proof = await declaredFileEvidence(f.cwd, ["a.txt"]);
    call.status = "completed";
    call.result = nativeResult(
      structured(role, id, proof.sha256),
      role === "researcher" ? "child" : "validator",
    );
    await f.adapter.after(call);
    assert.equal((call.result as { metadata: { status: string } }).metadata.status, "completed");
  }
  const accepted = await f.adapter.action("parent", {
    version: 1,
    action: "orchestration.accept",
    orchestrationId: "run",
  });
  assert.equal((accepted as { accepted: boolean }).accepted, true);
  await ordinary(f.adapter);
});

test("explicit caller mismatches, missing callers and managed leaves remain rejected", async (t) => {
  const f = fixture(t);
  await admit(f.adapter);
  const mismatch = event();
  mismatch.agent = "plan";
  await assert.rejects(f.adapter.before(mismatch), /caller agent mismatch/);
  Reflect.deleteProperty(f.sessions.get("parent")!, "agent");
  const missing = event();
  missing.agent = " ";
  await assert.rejects(f.adapter.before(missing), /caller agent unavailable/);
  const leaf = event();
  leaf.agent = "researcher";
  await assert.rejects(f.adapter.before(leaf), /leaves cannot delegate/);
  const forged = event();
  forged.sessionID = "child";
  await assert.rejects(f.adapter.before(forged), /primary parent/);
  await ordinary(f.adapter);
});

test("direct role commands resolve the selected native default without hardcoding build", async (t) => {
  const f = fixture(t);
  Reflect.deleteProperty(f.sessions.get("parent")!, "agent");
  f.ctx.agent = {
    list: async () => [
      { id: "custom-primary", mode: "primary", hidden: false },
      { id: "build", mode: "primary", hidden: false },
    ],
  };
  await f.adapter.register();
  await admit(f.adapter);
  await f.commands.get("delegate-research")!.execute({
    sessionID: "parent",
    prompt: { text: (event().input as { prompt: string }).prompt },
  });
  assert.equal(f.executions(), 1);
  assert.equal(f.nativeCalls[0]!.context.agent, "custom-primary");
  const unavailable = fixture(t);
  Reflect.deleteProperty(unavailable.sessions.get("parent")!, "agent");
  await unavailable.adapter.register();
  await admit(unavailable.adapter);
  await assert.rejects(
    unavailable.commands.get("delegate-research")!.execute({
      sessionID: "parent",
      prompt: { text: (event().input as { prompt: string }).prompt },
    }),
    /default agent unavailable/,
  );
  assert.equal(unavailable.executions(), 0);
  await ordinary(unavailable.adapter);
});

test("setup exposes a direct model-callable control tool rather than only slash commands", async (t) => {
  const f = fixture(t);
  const dispose = await globalPlugin.setup(f.ctx);
  assert.equal(typeof dispose, "function");
  t.after(() => dispose?.());
  assert.equal(f.commands.size, 5);
  const tool = f.modelTools.get("harness_orchestration");
  assert.ok(tool, "the parent needs a real tool for natural-language admission");
  assert.deepEqual(tool.options, { codemode: false });
  assert.deepEqual(tool.input.required, ["version", "action"]);
});

test("two native locations load the global plugin without blocking each other's admission", async (t) => {
  const first = fixture(t);
  const second = fixture(t);
  second.sessions.set("parent-b", {
    id: "parent-b",
    agent: "build",
    location: { directory: second.cwd },
  });
  second.sessions.delete("parent");
  const previousStateHome = process.env.XDG_STATE_HOME;
  process.env.XDG_STATE_HOME = path.join(first.cwd, "private-state");
  t.after(() => {
    if (previousStateHome === undefined) delete process.env.XDG_STATE_HOME;
    else process.env.XDG_STATE_HOME = previousStateHome;
  });
  const disposeFirst = await globalPlugin.setup(first.ctx);
  const disposeSecond = await globalPlugin.setup(second.ctx);
  t.after(() => {
    disposeFirst?.();
    disposeSecond?.();
  });
  const request = {
    version: 1,
    action: "orchestration.admit",
    spec: workflow(),
    evidenceFiles: ["a.txt"],
  };
  const firstResult = await first.modelTools
    .get("harness_orchestration")!
    .execute(request, { sessionID: "parent" });
  const secondResult = await second.modelTools
    .get("harness_orchestration")!
    .execute(request, { sessionID: "parent-b" });
  assert.equal((firstResult.output as { workspaceRoot: string }).workspaceRoot, first.cwd);
  assert.equal((secondResult.output as { workspaceRoot: string }).workspaceRoot, second.cwd);
  assert.notEqual(
    (firstResult.output as { traceRoot: string }).traceRoot,
    (secondResult.output as { traceRoot: string }).traceRoot,
  );
  disposeFirst?.();
  await assert.rejects(
    first.modelTools.get("harness_orchestration")!.execute(request, { sessionID: "parent" }),
    /disposed/,
  );
  const fresh = {
    ...request,
    spec: { ...workflow(), orchestrationId: "after-other-location-closes" },
  };
  const stillActive = await second.modelTools
    .get("harness_orchestration")!
    .execute(fresh, { sessionID: "parent-b" });
  assert.equal((stillActive.output as { admitted: string }).admitted, fresh.spec.orchestrationId);
});

test("teardown rejects only its own managed actions and late results while ordinary tools remain usable", async (t) => {
  const f = fixture(t);
  await f.adapter.register();
  await admit(f.adapter);
  const pending = event();
  await f.adapter.before(pending);
  f.adapter.dispose();
  f.adapter.dispose();
  await assert.rejects(f.adapter.register(), /disposed/);
  await assert.rejects(
    f.modelTools
      .get("harness_orchestration")!
      .execute(
        { version: 1, action: "orchestration.accept", orchestrationId: "run" },
        { sessionID: "parent" },
      ),
    /disposed/,
  );
  pending.status = "completed";
  pending.result = nativeResult(structured());
  await assert.doesNotReject(f.adapter.after(pending));
  assert.equal((pending.result as { metadata: { harness: string } }).metadata.harness, "rejected");
  assert.match(JSON.stringify(pending.result), /disposed/);
  await ordinary(f.adapter);
  const independent = fixture(t);
  await assert.doesNotReject(admit(independent.adapter));
});

test("parent model tool admits, validates native children and accepts without invoking a slash executor", async (t) => {
  const f = fixture(t);
  await f.adapter.register();
  // Model/tool clients cannot execute a slash command. Make accidental use fail.
  f.commands.clear();
  const tool = f.modelTools.get("harness_orchestration")!;
  assert.ok(tool);
  await assert.rejects(tool.execute({}, { sessionID: "parent" }), /version/);
  await assert.rejects(
    tool.execute(
      { version: 1, action: "orchestration.admit", spec: workflow() },
      { sessionID: "child" },
    ),
    /primary parent/,
  );
  await assert.rejects(
    tool.execute(
      { version: 1, action: "orchestration.admit", spec: workflow(), sessionID: "forged" },
      { sessionID: "parent" },
    ),
    /unexpected/,
  );
  const admitted = await tool.execute(
    { version: 1, action: "orchestration.admit", spec: workflow(), evidenceFiles: ["a.txt"] },
    { sessionID: "parent" },
  );
  assert.equal((admitted.output as { admitted: string }).admitted, "run");
  assert.deepEqual(JSON.parse(admitted.content), admitted.output);
  const accept = { version: 1, action: "orchestration.accept", orchestrationId: "run" };
  await assert.rejects(tool.execute(accept, { sessionID: "parent" }), /incomplete/);
  for (const role of ["researcher", "validator"] as const) {
    const id = role === "researcher" ? "task" : "validation";
    const call = event(role, id);
    await f.hooks.get("execute.before")!(call);
    const proof = await declaredFileEvidence(f.cwd, ["a.txt"]);
    call.status = "completed";
    call.result = nativeResult(
      structured(role, id, proof.sha256),
      role === "researcher" ? "child" : "validator",
    );
    await f.hooks.get("execute.after")!(call);
    assert.equal((call.result as { metadata: { status: string } }).metadata.status, "completed");
  }
  const accepted = await tool.execute(accept, { sessionID: "parent" });
  assert.equal((accepted.output as { accepted: boolean }).accepted, true);
  assert.deepEqual(JSON.parse(accepted.content), accepted.output);
  await ordinary(f.adapter);
});

for (const mutation of [
  "json",
  "output-child",
  "metadata-child",
  "status",
  "content",
  "role",
  "task",
  "extra",
  "missing-child",
  "parent",
  "child-role",
] as const)
  test("all-surface local rejection: " + mutation, async (t) => {
    const { adapter, sessions } = fixture(t);
    await admit(adapter);
    const call = event();
    await adapter.before(call);
    call.status = "completed";
    const result = nativeResult(structured());
    if (mutation === "json") result.output.output = "{broken secret payload";
    if (mutation === "output-child") result.output.sessionID = "wrong";
    if (mutation === "metadata-child") result.metadata.sessionID = "wrong";
    if (mutation === "status") result.output.status = "running";
    if (mutation === "content") result.content += "secret payload";
    if (["role", "task", "extra"].includes(mutation)) {
      const value = structured() as Record<string, unknown>;
      value[mutation === "task" ? "delegationTaskId" : mutation] = "bad";
      call.result = nativeResult(value);
    } else call.result = result;
    if (mutation === "missing-child") sessions.delete("child");
    if (mutation === "parent") sessions.get("child")!.parentID = "forged";
    if (mutation === "child-role") sessions.get("child")!.agent = "implementer";
    await assert.doesNotReject(adapter.after(call));
    assert.equal((call.result as { metadata: { harness: string } }).metadata.harness, "rejected");
    if (
      ["output-child", "metadata-child", "missing-child", "parent", "child-role"].includes(mutation)
    )
      assert.equal(
        (call.result as { output: Record<string, unknown> }).output.verifiedChildSessionID,
        undefined,
      );
    assert.doesNotMatch(JSON.stringify(call.result), /secret payload/);
    assert.equal(adapter.protocol.snapshot("parent", "run").gates.gate, undefined);
    await ordinary(adapter);
  });

test("a parent session cannot be exposed as a verified subagent identity", async (t) => {
  const f = fixture(t);
  await admit(f.adapter);
  const call = event();
  await f.adapter.before(call);
  call.status = "completed";
  call.result = nativeResult(structured(), "parent");
  await f.adapter.after(call);
  const rejected = call.result as {
    output: Record<string, unknown>;
    metadata: { harness: string };
  };
  assert.equal(rejected.metadata.harness, "rejected");
  assert.equal(rejected.output.parentSessionID, "parent");
  assert.equal(rejected.output.verifiedChildSessionID, undefined);
  assert.equal(Object.hasOwn(rejected.output, "sessionID"), false);
  await ordinary(f.adapter);
});

test("persistence error, cancellation, duplicate result and native error never stop ordinary tools", async (t) => {
  let fail = false;
  const { adapter } = fixture(t, {
    persist: async () => {
      if (fail) throw new Error("disk unavailable");
    },
  });
  await admit(adapter);
  const call = event();
  await adapter.before(call);
  fail = true;
  call.status = "completed";
  call.result = nativeResult(structured());
  await adapter.after(call);
  assert.match(JSON.stringify(call.result), /disk unavailable/);
  await ordinary(adapter);
  const cancelled = fixture(t);
  await admit(cancelled.adapter);
  const c = event();
  await cancelled.adapter.before(c);
  await cancelled.adapter.action("parent", {
    version: 1,
    action: "task.cancel",
    context: {
      orchestrationId: "run",
      delegationTaskId: "task",
      scopeKey: "unit",
      role: "researcher",
      taskMode: "research",
    },
  });
  c.status = "completed";
  c.result = nativeResult(structured());
  await cancelled.adapter.after(c);
  assert.match(JSON.stringify(c.result), /rejected/);
  await ordinary(cancelled.adapter);
  const duplicate = fixture(t);
  await admit(duplicate.adapter);
  const d = event();
  await duplicate.adapter.before(d);
  d.status = "completed";
  d.result = nativeResult(structured());
  await duplicate.adapter.after(d);
  await duplicate.adapter.after(d);
  assert.match(JSON.stringify(d.result), /duplicate/);
  const error = fixture(t);
  await admit(error.adapter);
  const e = event();
  await error.adapter.before(e);
  e.status = "error";
  await error.adapter.after(e);
  await ordinary(error.adapter);
});

test("direct commands share admission, Code Mode inner hooks cannot bypass, malformed input never executes", async (t) => {
  const { adapter, commands, executions } = fixture(t);
  await adapter.register();
  assert.equal(commands.size, 5);
  for (const [name, command] of commands)
    if (name !== "delegate-orchestration")
      await assert.rejects(
        command.execute({ sessionID: "parent", prompt: { text: "incomplete" } }),
      );
  assert.equal(executions(), 0);
  await admit(adapter);
  await commands.get("delegate-research")!.execute({
    sessionID: "parent",
    prompt: { text: (event().input as { prompt: string }).prompt },
  });
  assert.equal(executions(), 1);
  await assert.rejects(adapter.before(event()), /duplicate|succeeded/);
  await ordinary(adapter);
});

test("authority, moved cwd, collisions and packet violations reject only managed work", async (t) => {
  const { adapter, sessions } = fixture(t);
  await admit(adapter);
  const bad = event();
  (bad.input as Record<string, unknown>).background = true;
  await assert.rejects(adapter.before(bad), /foreground/);
  const continuation = event();
  (continuation.input as Record<string, unknown>).sessionID = "old";
  await assert.rejects(adapter.before(continuation));
  const leaf = event();
  leaf.sessionID = "child";
  leaf.agent = "researcher";
  await assert.rejects(adapter.before(leaf), /cannot delegate/);
  sessions.get("parent")!.location.directory += "-moved";
  await assert.rejects(adapter.before(event()), /cwd moved/);
  await ordinary(adapter);
  const collision = fixture(t, { collision: async () => "portable plugin" });
  await assert.rejects(admit(collision.adapter), /collision/);
  await ordinary(collision.adapter);
  const pure = createGlobalProtocol();
  pure.admitOrchestration("parent", "/tmp", workflow());
  assert.throws(() => pure.admitTask("forged", "call", "researcher", packet()));
  assert.throws(() =>
    pure.admitTask("parent", "call", "researcher", { ...packet(), taskMode: "implementation" }),
  );
});

test("replacement erases arbitrary rich success-bearing surfaces", () => {
  const call = event();
  call.result = {
    output: "secret",
    content: [{ type: "image", data: "secret" }],
    metadata: { sessionID: "claimed", success: true },
    extra: "secret",
  };
  replaceGlobalResult(call, "invalid");
  assert.doesNotMatch(JSON.stringify(call.result), /secret|claimed|success/);
});

test("one researcher and one validator budget allows exact-child clarification through acceptance", async (t) => {
  const { adapter, cwd } = fixture(t);
  const spec = workflow();
  spec.budgets.maxTotalLeafAgents = 2;
  spec.budgets.maxLeafAgentsByRole = { researcher: 1, planner: 0, implementer: 0, validator: 1 };
  await adapter.action("parent", { version: 1, action: "orchestration.admit", spec });
  const first = event();
  await adapter.before(first);
  first.status = "completed";
  first.result = nativeResult({
    version: 1,
    orchestrationId: "run",
    delegationTaskId: "task",
    scopeKey: "unit",
    role: "researcher",
    taskMode: "research",
    outcome: "clarification",
    summary: "Need one decision",
    evidence: [],
    artifacts: [],
    requestNonce: "fresh-nonce",
    question: "Which file?",
  });
  await adapter.after(first);
  assert.equal((first.result as { metadata: { status: string } }).metadata.status, "completed");
  const answer = {
    kind: "clarification-response",
    version: 1,
    delegationTaskId: "task",
    requestNonce: "fresh-nonce",
    answer: "Use the declared a.txt file",
  };
  const continued = event();
  continued.id = "answer-call";
  const input = continued.input as Record<string, unknown>;
  input.sessionID = "child";
  input.prompt = formatTaskThreadEnvelope(answer);
  const wrong = structuredClone(continued);
  (wrong.input as Record<string, unknown>).prompt = formatTaskThreadEnvelope({
    ...answer,
    requestNonce: "forged",
  });
  await assert.rejects(adapter.before(wrong), /stale|forged/);
  await adapter.before(continued);
  await assert.rejects(adapter.before(continued), /stale|forged/);
  continued.status = "completed";
  continued.result = nativeResult(structured());
  await adapter.after(continued);
  assert.equal((continued.result as { metadata: { status: string } }).metadata.status, "completed");
  await assert.rejects(adapter.before({ ...continued, id: "terminal-reuse" }), /stale|forged/);
  const proof = await declaredFileEvidence(cwd, ["a.txt"]);
  const validator = event("validator", "validation");
  await adapter.before(validator);
  validator.status = "completed";
  validator.result = nativeResult(structured("validator", "validation", proof.sha256), "validator");
  await adapter.after(validator);
  assert.equal((validator.result as { metadata: { status: string } }).metadata.status, "completed");
  assert.deepEqual(
    await adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    { accepted: true, treeHash: proof.sha256 },
  );
  await ordinary(adapter);
});

test("same-child clarification cap remains eight with a single leaf-agent slot", async (t) => {
  const { adapter } = fixture(t);
  const spec = workflow();
  spec.budgets.maxTotalLeafAgents = 1;
  spec.budgets.maxLeafAgentsByRole.researcher = 1;
  await adapter.action("parent", { version: 1, action: "orchestration.admit", spec });
  let call = event();
  await adapter.before(call);
  for (let turn = 0; turn <= 8; turn++) {
    call.status = "completed";
    call.result = nativeResult({
      version: 1,
      orchestrationId: "run",
      delegationTaskId: "task",
      scopeKey: "unit",
      role: "researcher",
      taskMode: "research",
      outcome: "clarification",
      summary: "Need a bounded decision",
      evidence: [],
      artifacts: [],
      requestNonce: `nonce-${turn}`,
      question: "Confirm the same declared scope?",
    });
    await adapter.after(call);
    if (turn === 8) {
      assert.match(JSON.stringify(call.result), /exhausted clarification nonce/);
      break;
    }
    assert.equal((call.result as { metadata: { status: string } }).metadata.status, "completed");
    call = event();
    call.id = `answer-${turn}`;
    Object.assign(call.input as object, {
      sessionID: "child",
      prompt: formatTaskThreadEnvelope({
        kind: "clarification-response",
        version: 1,
        delegationTaskId: "task",
        requestNonce: `nonce-${turn}`,
        answer: "Keep the declared scope",
      }),
    });
    await adapter.before(call);
  }
  await assert.rejects(
    adapter.before(event("validator", "validation")),
    /prior task mode not ready/,
  );
  await ordinary(adapter);
});

test("directory scopes use declared files; parent sessions, cwd moves and actual project collisions stay distinct", async (t) => {
  const f = fixture(t);
  const spec = workflow();
  spec.allowedPaths = ["data/"];
  spec.workUnits[0]!.allowedPaths = ["data/"];
  fs.mkdirSync(path.join(f.cwd, "data"));
  fs.writeFileSync(path.join(f.cwd, "data/a.txt"), "nested");
  await f.adapter.action("parent", {
    version: 1,
    action: "orchestration.admit",
    spec,
    evidenceFiles: ["data/a.txt", "data/anticipated.txt"],
  });
  assert.deepEqual(f.adapter.protocol.evidenceFiles("parent", "run"), [
    "data/a.txt",
    "data/anticipated.txt",
  ]);
  const second = fixture(t);
  await admit(second.adapter);
  assert.notEqual(f.cwd, second.cwd);
  assert.equal(second.adapter.protocol.cwd("parent", "run"), second.cwd);
  fs.mkdirSync(path.join(second.cwd, ".opencode/plugins"), { recursive: true });
  fs.writeFileSync(
    path.join(second.cwd, ".opencode/plugins/index.js"),
    "import '../plugin-modules/harness-lifecycle.js';",
  );
  await assert.rejects(second.adapter.before(event()), /collision/);
  await ordinary(second.adapter);
});

test("default trace storage rejects symlink ancestry before writing outside its root", async (t) => {
  const f = fixture(t);
  const outside = path.join(f.cwd, "outside");
  fs.mkdirSync(outside, { mode: 0o700 });
  fs.symlinkSync(outside, path.join(f.cwd, "linked"));
  const ctx: GlobalNativeContext = {
    session: {
      get: async () => ({ id: "parent", agent: "build", location: { directory: f.cwd } }),
    },
    tool: { transform: async () => {}, hook: async () => {}, list: async () => [] },
    command: { transform: async () => {} },
  };
  const adapter = createGlobalNativeAdapter(ctx, { traceRoot: path.join(f.cwd, "linked/traces") });
  await assert.rejects(admit(adapter), /unsafe trace/);
  assert.deepEqual(fs.readdirSync(outside), []);
  await ordinary(adapter);
});

test("installed admission returns the immutable release root with usable resource paths", async (t) => {
  const f = fixture(t);
  const options = {
    configRoot: path.join(f.cwd, "native"),
    stateRoot: path.join(f.cwd, "state"),
    apply: true,
  };
  globalOperation("install", options);
  const release = globalOperation("doctor", options).activeRelease as string;
  const installed = (await import(
    pathToFileURL(path.join(release, ".opencode/plugin-modules/global-native-plugin.js")).href
  )) as typeof import("../src/plugin-modules/global-native-plugin.ts");
  const adapter = installed.createGlobalNativeAdapter(f.ctx, { persist: async () => {} });
  await adapter.register();
  const control = f.modelTools.get("harness_orchestration");
  assert.ok(control, "installed package must expose model-callable admission");
  const admitted = (
    await control.execute(
      {
        version: 1,
        action: "orchestration.admit",
        spec: workflow(),
      },
      { sessionID: "parent" },
    )
  ).output as { runtimeRoot: string };
  assert.equal(admitted.runtimeRoot, release);
  for (const resource of [
    ".opencode/contracts/role-io-contracts.json",
    ".opencode/plugin-modules/global-utilities.js",
    ".opencode/schemas",
  ])
    assert.ok(fs.existsSync(path.join(admitted.runtimeRoot, resource)), resource);
});

test("global gates use native host policy while legacy gates keep read-only restrictions", (t) => {
  const { cwd } = fixture(t);
  const commands = [
    "npm test",
    "npm run build",
    "node .opencode/scripts/validate-harness.mts",
    "node .opencode/scripts/validate-portable-harness.mjs --root .",
    "python3 reviewed_project_check.py --write-report",
  ];
  for (const command of commands) {
    const spec = workflow();
    spec.acceptanceGates[0]!.evidenceCommand = command;
    const protocol = createGlobalProtocol();
    assert.equal(protocol.admitOrchestration("parent", cwd, spec), "run");
    if (command !== commands.at(-1))
      assert.throws(() => createDispatchController(spec), /read-only inputs/);
  }
  for (const command of ["", "   ", "x".repeat(4097)]) {
    const spec = workflow();
    spec.acceptanceGates[0]!.evidenceCommand = command;
    assert.throws(
      () => createGlobalProtocol().admitOrchestration("parent", cwd, spec),
      /invalid evidenceCommand/,
    );
  }
});
