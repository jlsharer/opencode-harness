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
  projectHarnessCollision,
} from "../src/plugin-modules/global-native-plugin.ts";
import type {
  GlobalControlTool,
  GlobalNativeContext,
  NativeEvent,
} from "../src/plugin-modules/global-native-plugin.ts";
import * as globalProtocolModule from "../src/plugin-modules/global-protocol.ts";
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
import {
  buildWorkflowExamples,
  buildTaskContractExamples,
} from "./render-task-contract-examples.mts";

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

function acceptedProtocolRun(protocol = createGlobalProtocol()) {
  const parent = "parent";
  const cwd = "/var/tmp";
  const hash = "a".repeat(64);
  protocol.admitOrchestration(parent, cwd, workflow());
  for (const role of ["researcher", "validator"] as const) {
    const { context } = protocol.admitTask(parent, role, role, packet(role, role));
    protocol.started(parent, context, { id: role + "-child", parentID: parent, agent: role });
    protocol.result(
      parent,
      context,
      structured(role, role, hash),
      role === "validator" ? { treeHash: hash, gateIds: ["gate"] } : {},
    );
  }
  assert.deepEqual(protocol.accept(parent, "run", hash), { accepted: true, treeHash: hash });
  return protocol;
}

test("current global gate associations can demand evidence for a gate that never closes", () => {
  const protocol = createGlobalProtocol();
  const spec = workflow();
  spec.acceptanceGates.push({
    id: "extra",
    criterion: "extra",
    evidenceCommand: "true",
    workUnitIds: ["unit"],
  });
  protocol.admitOrchestration("parent", "/var/tmp", spec);
  for (const role of ["researcher", "validator"] as const) {
    const { context } = protocol.admitTask("parent", role, role, packet(role, role));
    protocol.started("parent", context, { id: role, parentID: "parent", agent: role });
    const result = structured(role, role);
    if (role === "validator") {
      const proof = { treeHash: "a".repeat(64), gateIds: ["gate"] };
      assert.throws(() => protocol.result("parent", context, result, proof), /command-backed/);
      result.evidence.push({
        reference: "extra.log",
        command: "true",
        exitCode: 0,
        sha256: proof.treeHash,
      });
      protocol.result("parent", context, result, proof);
    } else protocol.result("parent", context, result);
  }
  assert.equal(protocol.snapshot("parent", "run").gates.extra, undefined);
  assert.throws(() => protocol.accept("parent", "run", "a".repeat(64)), /incomplete/);
});

test("current accepted global runs retain their orchestration ledger slots", () => {
  const protocol = acceptedProtocolRun();
  for (let index = 1; index < 128; index++)
    protocol.admitOrchestration("parent", "/var/tmp", {
      ...workflow(),
      orchestrationId: `run-${index}`,
    });
  assert.throws(
    () =>
      protocol.admitOrchestration("parent", "/var/tmp", {
        ...workflow(),
        orchestrationId: "run-128",
      }),
    /exhausted/,
  );
});

test("current global ledger keys include parent but its 128 slots are shared", () => {
  const protocol = createGlobalProtocol();
  protocol.admitOrchestration("first", "/var/tmp", workflow());
  assert.throws(() => protocol.admitOrchestration("first", "/var/tmp", workflow()), /duplicate/);
  protocol.admitOrchestration("second", "/var/tmp", workflow());
  for (const parent of ["first", "second"]) {
    for (let index = 1; index < 64; index++)
      protocol.admitOrchestration(parent, "/var/tmp", {
        ...workflow(),
        orchestrationId: `run-${index}`,
      });
  }
  assert.throws(() => protocol.admitOrchestration("third", "/var/tmp", workflow()), /exhausted/);
});

test("current accepted global history still forbids child reuse in a fresh run", () => {
  const protocol = acceptedProtocolRun();
  protocol.admitOrchestration("parent", "/var/tmp", { ...workflow(), orchestrationId: "fresh" });
  const { context } = protocol.admitTask("parent", "fresh-call", "researcher", {
    ...packet("researcher", "fresh-task"),
    orchestrationId: "fresh",
  });
  assert.throws(
    () =>
      protocol.started("parent", context, {
        id: "researcher-child",
        parentID: "parent",
        agent: "researcher",
      }),
    /reused/,
  );
  protocol.started("parent", context, {
    id: "never-used-child",
    parentID: "parent",
    agent: "researcher",
  });
  assert.equal(protocol.snapshot("parent", "fresh").active, 1);
});

test("current declared-file proof misses an undeclared input that changes actual command behavior", async (t) => {
  const cwd = fs.mkdtempSync("/var/tmp/global-input-proof-");
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  fs.writeFileSync(path.join(cwd, "a.txt"), "declared");
  const input = path.join(cwd, "b.txt");
  fs.writeFileSync(input, "pass");
  const run = () =>
    spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        "import fs from 'node:fs'; const value = fs.readFileSync('b.txt', 'utf8'); console.log(value); process.exitCode = value === 'pass' ? 0 : 1;",
      ],
      { cwd, encoding: "utf8" },
    );
  const before = await declaredFileEvidence(cwd, ["a.txt"]);
  assert.equal(run().status, 0);
  fs.writeFileSync(input, "fail");
  const changed = run();
  assert.equal(changed.status, 1, changed.stderr);
  assert.equal(changed.stdout.trim(), "fail");
  assert.deepEqual(await declaredFileEvidence(cwd, ["a.txt"]), before);
  fs.writeFileSync(path.join(cwd, "a.txt"), "changed declared input");
  assert.notEqual((await declaredFileEvidence(cwd, ["a.txt"])).sha256, before.sha256);
});

function fixture(
  t: { after(fn: () => void): void },
  options: Parameters<typeof createGlobalNativeAdapter>[1] = {},
) {
  const cwd = fs.mkdtempSync("/var/tmp/native-global-λ-");
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
  const sessionHooks = new Map<
    string,
    (event: { sessionID: string; system: { type: "text"; text: string }[] }) => Promise<void>
  >();
  const commands = new Map<
    string,
    { execute(input: { sessionID: string; prompt: { text: string } }): Promise<void> }
  >();
  let executions = 0;
  const nativeCalls: { input: unknown; context: Record<string, unknown> }[] = [];
  const modelTools = new Map<string, GlobalControlTool>();
  const ctx: GlobalNativeContext = {
    session: {
      hook: async (name, callback) => {
        sessionHooks.set(name, callback);
      },
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
    sessionHooks,
    commands,
    modelTools,
    adapter,
    ctx,
    nativeCalls,
    executions: () => executions,
  };
}

test("global context/compaction inject automatic delegation before admission, never into leaves", async (t) => {
  const f = fixture(t, { collision: async () => "project entry" });
  await f.adapter.register();
  for (const name of ["context", "compaction"]) {
    const hook = f.sessionHooks.get(name);
    assert.ok(hook);
    const parent = { sessionID: "parent", system: [] as { type: "text"; text: string }[] };
    await hook(parent);
    await hook(parent);
    assert.equal(parent.system.length, 1);
    assert.match(parent.system[0]!.text, /managed delegation automatically/);
    assert.match(parent.system[0]!.text, /harness_orchestration/);
    const child = { sessionID: "child", system: [] as { type: "text"; text: string }[] };
    await hook(child);
    assert.deepEqual(child.system, []);
  }
  await assert.rejects(admit(f.adapter), /migrate-project.*File presence/s);
  f.adapter.dispose();
  const system: { type: "text"; text: string }[] = [];
  await f.sessionHooks.get("context")!({ sessionID: "parent", system });
  assert.deepEqual(system, []);
});

test("collision preflight walks actual cwd ancestors and recognizes explicit inert migration", async (t) => {
  const f = fixture(t);
  const entry = path.join(f.cwd, ".opencode/plugins/index.js");
  fs.mkdirSync(path.dirname(entry), { recursive: true });
  const nested = path.join(f.cwd, "nested/project");
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(
    entry,
    "export { HarnessPlugin as default } from '../plugin-modules/harness-lifecycle.js';",
  );
  assert.equal(await projectHarnessCollision(nested), entry);
  fs.writeFileSync(entry, 'export default { id: "opencode-harness.legacy-disabled", setup() {} };');
  assert.equal(await projectHarnessCollision(nested), null);
  fs.writeFileSync(entry, 'export default { id: "unrelated-plugin", setup() {} };');
  assert.equal(await projectHarnessCollision(nested), null);
});

test("global unbounded workflow retries beyond legacy budgets without bypassing independent acceptance", async (t) => {
  const f = fixture(t);
  const spec = { ...workflow(), budgets: { mode: "unbounded" } };
  await f.adapter.action("parent", { version: 1, action: "orchestration.admit", spec });
  for (let index = 0; index < 24; index++) {
    const attempt = event("researcher", `retry-${index}`);
    await f.adapter.before(attempt);
    attempt.status = "error";
    await f.adapter.after(attempt);
  }
  await assert.rejects(
    f.adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    /incomplete|gate|complete|failed/,
  );
  const final = event("researcher", "final-research");
  await f.adapter.before(final);
  final.status = "completed";
  final.result = nativeResult(structured("researcher", "final-research"));
  await f.adapter.after(final);
  assert.notEqual(
    (final.result as { metadata: { harness?: string } }).metadata.harness,
    "rejected",
  );
  await assert.rejects(
    f.adapter.action("parent", {
      version: 1,
      action: "orchestration.accept",
      orchestrationId: "run",
    }),
    /incomplete|gate|complete|failed/,
  );
});

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

function v2GlobalWorkflow() {
  const spec = workflow();
  return {
    ...spec,
    schemaVersion: "2.0.0",
    roleModeTaskMapping: [
      {
        workUnitId: "unit",
        role: "validator",
        taskMode: "review",
        boundedTask: "advisory",
        gateObligations: [],
        taskTimeoutMs: 25,
      },
      {
        workUnitId: "unit",
        role: "validator",
        taskMode: "validation",
        boundedTask: "prove",
        gateObligations: ["gate"],
        taskTimeoutMs: 50,
      },
    ],
  };
}

for (const binding of ["stale", "missing", "current"] as const)
  test(`v2 global advisory review requires current-tree result evidence: ${binding}`, () => {
    const spec = buildWorkflowExamples()[1]!;
    spec.roleModeTaskMapping = spec.roleModeTaskMapping.filter((m) => m.role === "validator");
    const example = buildTaskContractExamples().find(
      (e) =>
        e.context.role === "validator" &&
        e.context.taskMode === "review" &&
        e.result.outcome === "success",
    )!;
    const identity = {
      orchestrationId: spec.orchestrationId,
      scopeKey: "parser",
      delegationTaskId: "advisory-" + binding,
      taskMode: "review",
    };
    const protocol = createGlobalProtocol({ now: () => 100 });
    protocol.admitOrchestration("parent", "/var/tmp", spec);
    const { context } = protocol.admitTask("parent", "advisory-call", "validator", {
      ...example.packet,
      ...identity,
    });
    protocol.started("parent", context, {
      id: "advisory-child",
      parentID: "parent",
      agent: "validator",
    });
    const result = {
      ...example.result,
      ...identity,
      evidence: [
        {
          reference: "review.log",
          ...(binding === "missing"
            ? {}
            : { sha256: (binding === "current" ? "a" : "b").repeat(64) }),
        },
      ],
    };
    const complete = () =>
      protocol.result("parent", context, result, { treeHash: "a".repeat(64), gateIds: [] });
    if (binding === "current") {
      complete();
      assert.equal(protocol.snapshot("parent", spec.orchestrationId).attempts[0]!.state, "success");
    } else {
      assert.throws(complete, /tree-bound advisory evidence required/);
      assert.equal(protocol.snapshot("parent", spec.orchestrationId).attempts[0]!.state, "running");
      assert.equal(protocol.snapshot("parent", spec.orchestrationId).active, 1);
    }
    assert.deepEqual(protocol.snapshot("parent", spec.orchestrationId).gates, {});
    assert.throws(
      () => protocol.accept("parent", spec.orchestrationId, "a".repeat(64)),
      /incomplete/,
    );
  });

test("v2 global advisory review completes only its mapping and exact owner closes final acceptance", () => {
  const protocol = createGlobalProtocol();
  protocol.admitOrchestration("parent", "/var/tmp", v2GlobalWorkflow());
  const reviewPacket = { ...packet("validator", "review"), taskMode: "review" };
  const { context } = protocol.admitTask("parent", "review-call", "validator", reviewPacket);
  protocol.started("parent", context, {
    id: "review-child",
    parentID: "parent",
    agent: "validator",
  });
  const review = {
    ...structured("validator", "review"),
    taskMode: "review",
    evidence: [{ reference: "review.log", sha256: "a".repeat(64) }],
  };
  protocol.result("parent", context, review, { treeHash: "a".repeat(64), gateIds: [] });
  assert.deepEqual(protocol.snapshot("parent", "run").gates, {});
  assert.throws(() => protocol.accept("parent", "run", "a".repeat(64)), /incomplete/);
  const owner = protocol.admitTask(
    "parent",
    "owner-call",
    "validator",
    packet("validator", "owner"),
  );
  protocol.started("parent", owner.context, {
    id: "owner-child",
    parentID: "parent",
    agent: "validator",
  });
  assert.throws(
    () =>
      protocol.result("parent", owner.context, structured("validator", "owner"), {
        treeHash: "a".repeat(64),
        gateIds: [],
      }),
    /gate/,
  );
  protocol.result("parent", owner.context, structured("validator", "owner"), {
    treeHash: "a".repeat(64),
    gateIds: ["gate"],
  });
  assert.equal(protocol.accept("parent", "run", "a".repeat(64)).accepted, true);
});

test("global fake clock enforces admitted duration at exact immutable deadline", () => {
  let now = 100;
  const protocol = createGlobalProtocol({ now: () => now, maxTaskTimeoutMs: 50 });
  protocol.admitOrchestration("parent", "/var/tmp", v2GlobalWorkflow());
  const { context } = protocol.admitTask("parent", "review-call", "validator", {
    ...packet("validator", "review"),
    taskMode: "review",
  });
  protocol.started("parent", context, {
    id: "review-child",
    parentID: "parent",
    agent: "validator",
  });
  assert.equal(protocol.snapshot("parent", "run").attempts[0]!.deadline, 125);
  now = 124;
  assert.equal(protocol.snapshot("parent", "run").attempts[0]!.state, "running");
  now = 125;
  assert.equal(protocol.snapshot("parent", "run").attempts[0]!.state, "cancel-requested");
  assert.throws(
    () =>
      protocol.result(
        "parent",
        context,
        { ...structured("validator", "review"), taskMode: "review" },
        { treeHash: "a".repeat(64), gateIds: [] },
      ),
    /late/,
  );
  assert.equal(protocol.snapshot("parent", "run").active, 1);
  const rejected = createGlobalProtocol({ maxTaskTimeoutMs: 24 });
  assert.throws(
    () => rejected.admitOrchestration("parent", "/var/tmp", v2GlobalWorkflow()),
    /ceiling/,
  );
});

test("v2 global final acceptance rejects advisory completion invalidated by a later writer", () => {
  const base = workflow();
  const spec = {
    ...base,
    schemaVersion: "2.0.0",
    budgets: { mode: "unbounded" },
    workUnits: ["a", "b", "c"].map((id) => ({
      ...base.workUnits[0]!,
      id,
      acceptanceGateIds: id === "c" ? ["gate-a", "gate-b", "gate-c"] : ["gate-" + id],
    })),
    acceptanceGates: ["a", "b", "c"].map((id) => ({
      ...base.acceptanceGates[0]!,
      id: "gate-" + id,
      workUnitIds: id === "c" ? ["c"] : [id, "c"],
    })),
    roleModeTaskMapping: [
      {
        workUnitId: "a",
        role: "validator",
        taskMode: "review",
        boundedTask: "advisory",
        gateObligations: [],
      },
      {
        workUnitId: "b",
        role: "implementer",
        taskMode: "implementation",
        boundedTask: "write",
        gateObligations: [],
      },
      {
        workUnitId: "c",
        role: "validator",
        taskMode: "validation",
        boundedTask: "prove all",
        gateObligations: ["gate-a", "gate-b", "gate-c"],
      },
    ],
  };
  const protocol = createGlobalProtocol();
  protocol.admitOrchestration("parent", "/var/tmp", spec);
  const complete = (
    unit: string,
    role: TaskThreadRole,
    mode: string,
    id: string,
    gateIds: string[],
  ) => {
    const { context } = protocol.admitTask("parent", id, role, {
      ...packet(role, id),
      scopeKey: unit,
      taskMode: mode,
    });
    protocol.started("parent", context, { id: id + "-child", parentID: "parent", agent: role });
    protocol.result(
      "parent",
      context,
      { ...structured(role, id), scopeKey: unit, taskMode: mode },
      { treeHash: "a".repeat(64), gateIds },
    );
  };
  complete("a", "validator", "review", "review", []);
  complete("b", "implementer", "implementation", "writer", []);
  complete("c", "validator", "validation", "owner", ["gate-a", "gate-b", "gate-c"]);
  assert.throws(() => protocol.accept("parent", "run", "a".repeat(64)), /incomplete/);
  complete("a", "validator", "review", "review-fresh", []);
  assert.equal(protocol.accept("parent", "run", "a".repeat(64)).accepted, true);
});

test("v2 observed declared revision rejects stale advisory and allows fresh exact current recovery", async (t) => {
  const f = fixture(t);
  const spec = { ...v2GlobalWorkflow(), budgets: { mode: "unbounded" } };
  const files = ["a.txt", "a.test.mjs"];
  fs.writeFileSync(
    path.join(f.cwd, "a.test.mjs"),
    'import { readFileSync } from "node:fs"; import assert from "node:assert/strict"; assert.ok(["evidence", "B"].includes(readFileSync("a.txt", "utf8")));',
  );
  spec.allowedPaths.push("a.test.mjs");
  spec.workUnits[0]!.allowedPaths.push("a.test.mjs");
  spec.workUnits.push({ ...structuredClone(spec.workUnits[0]!), id: "owner-unit" });
  spec.acceptanceGates[0]!.workUnitIds.push("owner-unit");
  spec.roleModeTaskMapping[1]!.workUnitId = "owner-unit";
  const protocol = createGlobalProtocol({ now: () => 100 });
  protocol.admitOrchestration("parent", f.cwd, spec);
  const complete = (mode: string, id: string, hash: string) => {
    const { context } = protocol.admitTask("parent", id, "validator", {
      ...packet("validator", id),
      taskMode: mode,
      scopeKey: mode === "review" ? "unit" : "owner-unit",
    });
    protocol.started("parent", context, {
      id: id + "-child",
      parentID: "parent",
      agent: "validator",
    });
    protocol.result(
      "parent",
      context,
      { ...structured("validator", id, hash), taskMode: mode, scopeKey: context.scopeKey },
      { treeHash: hash, gateIds: mode === "review" ? [] : ["gate"] },
    );
    return context;
  };
  const a = await declaredFileEvidence(f.cwd, files);
  const old = complete("review", "review-a", a.sha256);
  fs.writeFileSync(path.join(f.cwd, "a.txt"), "B");
  const b = await declaredFileEvidence(f.cwd, files);
  assert.notEqual(a.sha256, b.sha256);
  // Two validator units share the exact admitted run-wide domain. Execute the actual gate on B.
  const gate = spawnSync("node", ["--test"], { cwd: f.cwd, encoding: "utf8" });
  assert.equal(gate.status, 0, gate.stderr);
  complete("validation", "owner-b", b.sha256);
  assert.throws(() => protocol.accept("parent", "run", b.sha256), /incomplete|stale/);
  assert.deepEqual(protocol.snapshot("parent", "run").gates, {});
  assert.throws(
    () =>
      protocol.admitTask("parent", "old-call", "validator", {
        ...packet("validator", "review-a"),
        taskMode: "review",
      }),
    /duplicate/,
  );
  assert.throws(
    () => protocol.result("parent", old, structured("validator", "review-a")),
    /late|duplicate/,
  );
  complete("review", "review-b", b.sha256);
  complete("validation", "owner-b-fresh", b.sha256);
  assert.equal(protocol.accept("parent", "run", b.sha256).accepted, true);
});

test("exact replay ledger ceilings include reservations and canonical UTF-8 bytes", () => {
  const create = (globalProtocolModule as unknown as { createGlobalReplayLedger: () => any })
    .createGlobalReplayLedger;
  assert.equal(typeof create, "function");
  const ledger = create();
  const records = Array.from({ length: 65536 }, (_, i) => ({
    kind: "child",
    key: JSON.stringify(["child-" + i]),
  }));
  const bytes = records.reduce((n, r) => n + Buffer.byteLength(JSON.stringify(r)), 0);
  const token = ledger.reserve(records.length, bytes);
  assert.equal(ledger.snapshot().identityRecords, 65536);
  assert.throws(() => ledger.reserve(1, 1), /exhausted/);
  ledger.settle(token, records);
  assert.equal(ledger.snapshot().canonicalBytes, bytes);
  assert.equal(ledger.has("child", JSON.stringify(["child-65535"])), true);
  const byteLedger = create();
  const record = {
    kind: "run",
    key: JSON.stringify(["parent", "run"]),
    summary: {
      parentID: "parent",
      orchestrationId: "run",
      cwd: "/var/tmp/λ",
      generation: "generation",
      specDigest: "a".repeat(64),
      treeHash: "b".repeat(64),
      gates: [{ id: "gate", evidenceHash: "b".repeat(64) }],
      sequence: Number.MAX_SAFE_INTEGER,
    },
  };
  record.summary.cwd += "a".repeat(16777216 - Buffer.byteLength(JSON.stringify(record)));
  assert.equal(Buffer.byteLength(JSON.stringify(record)), 16777216);
  const reserved = byteLedger.reserve(1, 16777216);
  assert.throws(() => byteLedger.reserve(1, 1), /exhausted/);
  byteLedger.settle(reserved, [record]);
  assert.equal(byteLedger.snapshot().canonicalBytes, 16777216);
  const unused = create();
  const credit = unused.reserve(3, 1000);
  unused.releaseUnadmitted(credit);
  assert.equal(unused.snapshot().identityRecords, 0);
});

async function acceptedNativeRun(f: ReturnType<typeof fixture>, runId: string, attempts = 2) {
  const spec = { ...workflow(), orchestrationId: runId, budgets: { mode: "unbounded" } };
  await f.adapter.action("parent", { version: 2, action: "orchestration.admit", spec });
  const proof = await declaredFileEvidence(f.cwd, ["a.txt"]);
  let last!: NativeEvent;
  for (let i = 0; i < attempts; i++) {
    const role = i === attempts - 1 ? "validator" : "researcher";
    const id = runId + "-task-" + i;
    const child = runId + "-child-" + i;
    const call = event(role, id);
    (call.input as Record<string, unknown>).prompt = formatTaskThreadEnvelope({
      kind: "fresh",
      version: 1,
      role,
      packet: { ...packet(role, id), orchestrationId: runId },
    });
    f.sessions.set(child, {
      id: child,
      parentID: "parent",
      agent: role,
      location: { directory: f.cwd },
    });
    await f.adapter.before(call);
    const result: Record<string, unknown> = {
      ...structured(role, id, proof.sha256),
      orchestrationId: runId,
    };
    if (i < attempts - 2) {
      Object.assign(result, { outcome: "failed", reason: "bounded retry" });
      delete result.outputContract;
    }
    call.status = "completed";
    call.result = nativeResult(result, child);
    await f.adapter.after(call);
    assert.equal((call.result as any).metadata.status, "completed", JSON.stringify(call.result));
    last = call;
  }
  const acceptance = (await f.adapter.action("parent", {
    version: 2,
    action: "orchestration.accept",
    orchestrationId: runId,
  })) as any;
  assert.match(acceptance.acceptanceDigest, /^[a-f0-9]{64}$/);
  return { acceptance, last };
}

test("v2 accepted retirement crosses resident run and call ceilings with exact late rejection", async (t) => {
  const f = fixture(t, { now: () => 100 });
  let late!: NativeEvent;
  let canonicalBytes = 0;
  for (let i = 0; i < 129; i++) {
    const runId = "retired-" + i;
    const { acceptance, last } = await acceptedNativeRun(f, runId, 32);
    canonicalBytes += Buffer.byteLength(
      JSON.stringify({
        kind: "run",
        key: JSON.stringify(["parent", runId]),
        summary: acceptance.summary,
      }),
    );
    for (let task = 0; task < 32; task++) {
      for (const record of [
        { kind: "task", key: JSON.stringify(["parent", runId, runId + "-task-" + task]) },
        { kind: "call", key: JSON.stringify(["parent", runId + "-task-" + task]) },
        { kind: "child", key: JSON.stringify([runId + "-child-" + task]) },
      ])
        canonicalBytes += Buffer.byteLength(JSON.stringify(record));
    }
    const request = {
      version: 2,
      action: "retire",
      orchestrationId: runId,
      acceptanceDigest: acceptance.acceptanceDigest,
    };
    const retired = await f.adapter.action("parent", request);
    assert.deepEqual(await f.adapter.action("parent", request), retired);
    assert.equal(
      ((await f.adapter.action("parent", { version: 2, action: "status" })) as any).residentRuns
        .used,
      0,
    );
    if (i === 0) late = last;
  }
  const status = (await f.adapter.action("parent", { version: 2, action: "status" })) as any;
  assert.equal(status.residentCalls.used, 0);
  assert.equal(status.replay.identityRecords, 129 * (1 + 32 * 3));
  assert.equal(status.replay.reservedRecords, 0);
  assert.equal(status.replay.reservedSummaryBytes, 0);
  assert.equal(status.replay.canonicalBytes, canonicalBytes);
  assert.throws(() => f.adapter.protocol.snapshot("parent", "retired-0"), /not admitted/);
  await assert.rejects(
    f.adapter.action("parent", {
      version: 2,
      action: "orchestration.admit",
      spec: { ...workflow(), orchestrationId: "retired-0" },
    }),
    /duplicate|retired/,
  );
  await assert.rejects(f.adapter.before(late), /duplicate|stale/);
  await f.adapter.after(late);
  assert.equal((late.result as any).metadata.harness, "rejected");
  assert.doesNotMatch(JSON.stringify(late.result), /outputContract/);
  f.adapter.dispose();
  late.result = {
    output: { status: "completed" },
    content: [{ type: "resource", data: "success" }],
    metadata: { success: true },
  };
  await f.adapter.after(late);
  assert.equal((late.result as any).metadata.harness, "rejected");
  await ordinary(f.adapter);
});

test("v2 acceptance tracks every observed revision, even after a declared change and revert", () => {
  const protocol = createGlobalProtocol({ now: () => 100 });
  const spec = { ...v2GlobalWorkflow(), budgets: { mode: "unbounded" } };
  protocol.admitOrchestration("parent", "/var/tmp", spec);
  const complete = (mode: string, id: string, hash: string) => {
    const { context } = protocol.admitTask("parent", id, "validator", {
      ...packet("validator", id),
      taskMode: mode,
    });
    protocol.started("parent", context, { id, parentID: "parent", agent: "validator" });
    protocol.result(
      "parent",
      context,
      { ...structured("validator", id, hash), taskMode: mode },
      { treeHash: hash, gateIds: mode === "review" ? [] : ["gate"] },
    );
  };
  complete("review", "review-a", "a".repeat(64));
  complete("validation", "owner-b", "b".repeat(64));
  // Observing B must already make review available, before final acceptance.
  complete("review", "review-b", "b".repeat(64));
  assert.throws(() => protocol.accept("parent", "run", "a".repeat(64)), /incomplete|stale/);
  assert.deepEqual(protocol.snapshot("parent", "run").gates, {});
});

test("retirement preparation failure preserves full accepted records and exact bindings", () => {
  const protocol = createGlobalProtocol({ generation: "generation" });
  acceptedProtocolRun(protocol);
  const state = protocol.status("parent", "/var/tmp");
  const acceptanceDigest = state.runs[0]!.acceptanceDigest!;
  const proof = {
    generation: "generation",
    parentID: "parent",
    cwd: "/var/tmp",
    pending: false,
    callsConsumed: true,
    prepare: () => () => {},
  };
  for (const [parent, cwd, digest, override] of [
    ["other", "/var/tmp", acceptanceDigest, {}],
    ["parent", "/var/tmp/other", acceptanceDigest, {}],
    ["parent", "/var/tmp", "f".repeat(64), {}],
    ["parent", "/var/tmp", acceptanceDigest, { generation: "other" }],
    ["parent", "/var/tmp", acceptanceDigest, { pending: true }],
    ["parent", "/var/tmp", acceptanceDigest, { callsConsumed: false }],
  ] as const)
    assert.throws(
      () => protocol.retire(parent, cwd, "run", digest, { ...proof, ...override }),
      /mismatch|refused|unknown/,
    );
  assert.throws(
    () =>
      protocol.retire("parent", "/var/tmp", "run", acceptanceDigest, {
        ...proof,
        prepare: () => {
          throw new Error("injected preparation failure");
        },
      }),
    /injected/,
  );
  assert.deepEqual(protocol.status("parent", "/var/tmp"), state);
  assert.equal(protocol.snapshot("parent", "run").attempts.length, 2);
  const retired = protocol.retire("parent", "/var/tmp", "run", acceptanceDigest, proof);
  assert.deepEqual(protocol.retire("parent", "/var/tmp", "run", acceptanceDigest, proof), retired);
  assert.throws(() => protocol.snapshot("parent", "run"), /not admitted/);
  assert.throws(() => protocol.admitOrchestration("parent", "/var/tmp", workflow()), /duplicate/);
  protocol.admitOrchestration("parent", "/var/tmp", { ...workflow(), orchestrationId: "new-run" });
  const next = protocol.admitTask("parent", "new-call", "researcher", {
    ...packet("researcher", "researcher"),
    orchestrationId: "new-run",
  });
  assert.throws(
    () =>
      protocol.started("parent", next.context, {
        id: "researcher-child",
        parentID: "parent",
        agent: "researcher",
      }),
    /reused/,
  );
});

test("native v2 control exact fields, refusals, immutable summary and duplicate-after retirement race", async (t) => {
  const f = fixture(t, { now: () => 100 });
  await f.adapter.register();
  assert.deepEqual(
    (f.modelTools.get("harness_orchestration")!.input.properties as any).version.enum,
    [1, 2],
  );
  for (const input of [
    { version: 1, action: "status" },
    { version: 1, action: "retire" },
    { version: 3, action: "status" },
    { version: 2, action: "clear" },
    { version: 2, action: "status", parentID: "parent" },
    {
      version: 2,
      action: "retire",
      orchestrationId: "run",
      acceptanceDigest: "a".repeat(64),
      force: true,
    },
  ])
    await assert.rejects(f.adapter.action("parent", input), /version|unsupported|unexpected/);
  await admit(f.adapter);
  await assert.rejects(
    f.adapter.action("parent", {
      version: 2,
      action: "retire",
      orchestrationId: "run",
      acceptanceDigest: "a".repeat(64),
    }),
    /not accepted/,
  );
  const call = event();
  await f.adapter.before(call);
  const live = (await f.adapter.action("parent", { version: 2, action: "status" })) as any;
  assert.equal(live.replay.reservedRecords, 1);
  assert.ok(live.replay.reservedSummaryBytes > 0, "unaccepted fixed summary remains reserved");
  assert.match(live.runs[0].retirementRefusal, /admitted.*callback/);
  assert.ok(
    live.replay.reservedBytes >=
      Buffer.byteLength(JSON.stringify({ kind: "child", key: JSON.stringify(["x".repeat(160)]) })),
  );
  const context = {
    orchestrationId: "run",
    delegationTaskId: "task",
    scopeKey: "unit",
    role: "researcher",
    taskMode: "research",
  };
  await f.adapter.action("parent", { version: 1, action: "task.cancel", context });
  await assert.rejects(
    f.adapter.action("parent", {
      version: 2,
      action: "retire",
      orchestrationId: "run",
      acceptanceDigest: "a".repeat(64),
    }),
    /not accepted|uncertain/,
  );
  const { acceptance, last } = await acceptedNativeRun(f, "accepted");
  const request = {
    version: 2,
    action: "retire",
    orchestrationId: "accepted",
    acceptanceDigest: acceptance.acceptanceDigest,
  };
  const originalSummary = structuredClone(acceptance.summary);
  acceptance.summary.cwd = "/forged";
  await assert.rejects(
    f.adapter.action("parent", { ...request, acceptanceDigest: "f".repeat(64) }),
    /digest/,
  );
  const original = f.sessions.get("parent")!;
  f.sessions.set("parent", { ...original, location: { directory: f.cwd + "/elsewhere" } });
  await assert.rejects(f.adapter.action("parent", request), /cwd/);
  f.sessions.set("parent", original);
  const [, retired] = await Promise.all([
    f.adapter.after(last),
    f.adapter.action("parent", request),
  ]);
  assert.equal((last.result as any).metadata.harness, "rejected");
  assert.deepEqual((retired as any).summary, originalSummary);
  for (const result of [
    "success",
    {
      output: { status: "success" },
      content: "success",
      metadata: { status: "completed", arbitrary: "success" },
    },
    { content: [{ type: "image", data: "success" }] },
  ]) {
    last.result = result;
    await f.adapter.after(last);
    assert.equal((last.result as any).metadata.harness, "rejected");
    assert.doesNotMatch(JSON.stringify(last.result), /success/);
  }
  const status = (await f.adapter.action("parent", { version: 2, action: "status" })) as any;
  assert.equal(status.residentRuns.used, 1);
  assert.equal(status.replay.reservedRecords, 1, "cancelled unknown child credit is retained");
});

test("native acceptance rechecks frozen cwd after awaited persistence and disposal", async (t) => {
  for (const mutation of ["cwd", "dispose"] as const) {
    let mutate = () => {};
    const f = fixture(t, {
      persist: async (record) => {
        if (record.event === "orchestration.accept") mutate();
      },
    });
    // Complete through the real adapter, then mutate native identity at the acceptance await.
    mutate = () => {
      if (mutation === "cwd") f.sessions.get("parent")!.location.directory = f.cwd + "/moved";
      else f.adapter.dispose();
    };
    await assert.rejects(acceptedNativeRun(f, "raced"), /cwd|disposed/);
    assert.equal(f.adapter.protocol.status("parent", f.cwd).runs[0]!.accepted, false);
  }
});

for (const mutation of [
  "cwd",
  "parent-id",
  "parent-role",
  "child-id",
  "child-parent",
  "child-role",
] as const)
  test(`result persistence drift rejects managed evidence and retirement: ${mutation}`, async (t) => {
    let mutate = () => {};
    const f = fixture(t, {
      persist: async (record) => {
        if (record.event === "task.result" && record.role === "validator") mutate();
      },
    });
    await admit(f.adapter);
    const research = event();
    await f.adapter.before(research);
    research.status = "completed";
    research.result = nativeResult(structured(), "child");
    await f.adapter.after(research);
    assert.equal((research.result as any).metadata.status, "completed");
    const originalParent = structuredClone(f.sessions.get("parent")!);
    const originalChild = structuredClone(f.sessions.get("validator")!);
    mutate = () => {
      if (mutation === "cwd") f.sessions.get("parent")!.location.directory = f.cwd + "/moved";
      if (mutation === "parent-id") f.sessions.get("parent")!.id = "other-parent";
      if (mutation === "parent-role") f.sessions.get("parent")!.agent = "plan";
      if (mutation === "child-id") f.sessions.get("validator")!.id = "other-child";
      if (mutation === "child-parent") f.sessions.get("validator")!.parentID = "other-parent";
      if (mutation === "child-role") f.sessions.get("validator")!.agent = "researcher";
    };
    const validation = event("validator", "validation");
    await f.adapter.before(validation);
    validation.status = "completed";
    validation.result = nativeResult(
      structured("validator", "validation", (await declaredFileEvidence(f.cwd, ["a.txt"])).sha256),
      "validator",
    );
    await f.adapter.after(validation);
    assert.equal((validation.result as any).metadata.harness, "rejected");
    assert.doesNotMatch(JSON.stringify(validation.result), /outputContract|<subagent/);
    assert.deepEqual(f.adapter.protocol.snapshot("parent", "run").gates, {});
    f.sessions.set("parent", originalParent);
    f.sessions.set("validator", originalChild);
    await assert.rejects(
      f.adapter.action("parent", {
        version: 2,
        action: "orchestration.accept",
        orchestrationId: "run",
      }),
      /incomplete|gate|failed/,
    );
    await assert.rejects(
      f.adapter.action("parent", {
        version: 2,
        action: "retire",
        orchestrationId: "run",
        acceptanceDigest: "a".repeat(64),
      }),
      /not accepted|uncertain/,
    );
    await ordinary(f.adapter);
  });

for (const changeRevision of [false, true])
  test(`failed review remediation remains bounded across revision observations: ${changeRevision}`, () => {
    const spec = v2GlobalWorkflow();
    spec.budgets.maxLeafAgentsByRole.validator = 6;
    const protocol = createGlobalProtocol({ now: () => 100 });
    protocol.admitOrchestration("parent", "/var/tmp", spec);
    for (let i = 0; i < 2; i++) {
      const id = "failed-review-" + i;
      const { context } = protocol.admitTask("parent", "call-" + i, "validator", {
        ...packet("validator", id),
        taskMode: "review",
      });
      protocol.started("parent", context, {
        id: "child-" + i,
        parentID: "parent",
        agent: "validator",
      });
      const result: Record<string, unknown> = {
        ...structured("validator", id),
        taskMode: "review",
        outcome: "failed",
        reason: "review found a defect",
      };
      delete result.outputContract;
      protocol.result("parent", context, result, {
        treeHash: (changeRevision && i === 1 ? "b" : "a").repeat(64),
        gateIds: [],
      });
    }
    assert.throws(
      () =>
        protocol.admitTask("parent", "third-call", "validator", {
          ...packet("validator", "third-review"),
          taskMode: "review",
        }),
      /remediation budget exhausted/,
    );
    assert.equal(protocol.snapshot("parent", "run").attempts.length, 2);
  });

test("pending admission persistence cannot return launch authority after native cwd moves", async (t) => {
  let mutate = () => {};
  const f = fixture(t, {
    persist: async (record) => {
      if (record.event === "task.admit") mutate();
    },
  });
  await admit(f.adapter);
  mutate = () => {
    f.sessions.get("parent")!.location.directory = f.cwd + "/moved";
  };
  await assert.rejects(f.adapter.before(event()), /cwd/);
  assert.equal(f.adapter.protocol.status("parent", f.cwd).replay.reservedRecords, 1);
});

test("real protocol denies exhausted identity and byte credit before controller authority", () => {
  for (const bound of ["records", "bytes"] as const) {
    const ledger = globalProtocolModule.createGlobalReplayLedger();
    const protocol = createGlobalProtocol({ replayLedger: ledger, generation: "g" });
    protocol.admitOrchestration("parent", "/var/tmp/λ", workflow());
    const remaining = ledger.snapshot();
    ledger.reserve(
      bound === "records" ? remaining.remainingRecords : 1,
      bound === "bytes" ? remaining.remainingBytes : 1,
    );
    assert.throws(() => protocol.admitTask("parent", "call", "researcher", packet()), /exhausted/);
    assert.equal(protocol.snapshot("parent", "run").attempts.length, 0);
    assert.equal(ledger.has("task", JSON.stringify(["parent", "run", "task"])), false);
  }
});

test("native consumed callbacks without retirement still exhaust the 4096 resident call slots", async (t) => {
  const f = fixture(t, { now: () => 100 });
  await f.adapter.action("parent", {
    version: 2,
    action: "orchestration.admit",
    spec: { ...workflow(), budgets: { mode: "unbounded" } },
  });
  const hash = (await declaredFileEvidence(f.cwd, ["a.txt"])).sha256;
  for (let i = 0; i < 4096; i++) {
    const id = "consumed-" + i;
    const child = "child-" + i;
    const call = event("researcher", id);
    f.sessions.set(child, {
      id: child,
      parentID: "parent",
      agent: "researcher",
      location: { directory: f.cwd },
    });
    await f.adapter.before(call);
    const result: Record<string, unknown> = {
      ...structured("researcher", id, hash),
      outcome: "failed",
      reason: "fixture retry",
    };
    delete result.outputContract;
    call.status = "completed";
    call.result = nativeResult(result, child);
    await f.adapter.after(call);
    assert.equal((call.result as any).metadata.status, "completed");
  }
  await assert.rejects(f.adapter.before(event("researcher", "one-over")), /exhausted/);
  assert.equal(f.adapter.protocol.snapshot("parent", "run").attempts.length, 4096);
  assert.equal(
    ((await f.adapter.action("parent", { version: 2, action: "status" })) as any).residentCalls
      .used,
    4096,
  );
});

test("pending native command notification blocks retirement until its exact invocation finishes", async (t) => {
  const f = fixture(t, { now: () => 100 });
  let entered!: () => void, finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const release = new Promise<void>((resolve) => {
    finish = resolve;
  });
  f.ctx.session.synthetic = async () => {
    entered();
    await release;
  };
  await f.adapter.register();
  await admit(f.adapter);
  const command = f.commands
    .get("delegate-research")!
    .execute({ sessionID: "parent", prompt: { text: (event().input as any).prompt } });
  await pending;
  const validator = event("validator", "validation");
  await f.adapter.before(validator);
  validator.status = "completed";
  validator.result = nativeResult(
    structured("validator", "validation", (await declaredFileEvidence(f.cwd, ["a.txt"])).sha256),
    "validator",
  );
  await f.adapter.after(validator);
  const accepted = (await f.adapter.action("parent", {
    version: 2,
    action: "orchestration.accept",
    orchestrationId: "run",
  })) as any;
  const request = {
    version: 2,
    action: "retire",
    orchestrationId: "run",
    acceptanceDigest: accepted.acceptanceDigest,
  };
  await assert.rejects(f.adapter.action("parent", request), /pending/);
  assert.equal(
    ((await f.adapter.action("parent", { version: 2, action: "status" })) as any).runs[0]
      .retirementRefusal,
    "pending command",
  );
  finish();
  await command;
  assert.equal(((await f.adapter.action("parent", request)) as any).retired, true);
});

test("disposal while a real after callback awaits persistence replaces every success surface", async (t) => {
  let entered!: () => void, finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const release = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const f = fixture(t, {
    persist: async (record) => {
      if (record.event === "task.result") {
        entered();
        await release;
      }
    },
  });
  await admit(f.adapter);
  const call = event();
  await f.adapter.before(call);
  call.status = "completed";
  call.result = nativeResult(structured(), "child");
  const completing = f.adapter.after(call);
  await pending;
  f.adapter.dispose();
  finish();
  await completing;
  assert.equal((call.result as any).metadata.harness, "rejected");
  assert.doesNotMatch(JSON.stringify(call.result), /outputContract|<subagent/);
  await ordinary(f.adapter);
});
