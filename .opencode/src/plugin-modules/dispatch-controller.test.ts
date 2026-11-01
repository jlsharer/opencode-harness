import assert from "node:assert/strict";
import test from "node:test";
import {
  createDispatchController,
  gateObligationsFor,
  validateWorkflow,
  safeScopePath,
  withinScope,
} from "./dispatch-controller.ts";
import type { DispatchRequest } from "./dispatch-controller.ts";

export function validWorkflow() {
  return {
    schemaVersion: "1.0.0",
    routingMetadataStatus: "absent",
    orchestrationId: "fixture",
    goal: "Offline controller fixture",
    deliverables: ["src/"],
    nonGoals: ["Unrelated changes"],
    allowedPaths: ["src/"],
    workUnits: ["a", "b", "c"].map((id) => ({
      id,
      goal: "work",
      deliverable: "src/" + id,
      nonGoals: ["Unrelated changes"],
      allowedPaths: ["src/"],
      acceptanceGateIds: ["gate-" + id],
    })),
    acceptanceGates: ["a", "b", "c"].map((id) => ({
      id: "gate-" + id,
      criterion: "checks pass",
      evidenceCommand: "node --test",
      workUnitIds: [id],
    })),
    roleModeTaskMapping: ["a", "b", "c"].map((workUnitId) => ({
      workUnitId,
      role: "researcher",
      taskMode: "research",
      boundedTask: "Inspect supplied evidence",
    })),
    dag: {
      dependencies: [] as { workUnitId: string; dependsOn: string[] }[],
      parallelism: { mode: "parallel", authorization: "explicit", distinctCapacityEvidence: null },
    },
    budgets: {
      defaultRemediationCyclesPerWorkUnit: 1,
      maxTotalLeafAgents: 12,
      maxLeafAgentsByRole: { researcher: 6, planner: 2, implementer: 2, validator: 2 },
      maxRemediationCyclesPerWorkUnit: 1,
    },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
  };
}

const request = (
  id = "attempt-a",
  unit = "a",
  role: DispatchRequest["role"] = "researcher",
  taskMode = "research",
): DispatchRequest => ({ id, workUnitId: unit, role, taskMode, parentSessionId: "parent" });

const hash = "a".repeat(64);
const parallel = { maxConcurrent: 3, maxConcurrentByRole: { researcher: 3 } };

test("current review mode requires every unit gate before completing", () => {
  const spec = validWorkflow();
  mapping(spec, "a", "validator", "review");
  spec.workUnits[0]!.acceptanceGateIds.push("review-extra");
  spec.acceptanceGates.push({
    id: "review-extra",
    criterion: "review",
    evidenceCommand: "true",
    workUnitIds: ["a"],
  });
  const controller = createDispatchController(spec);
  controller.reserve(request("review", "a", "validator", "review"));
  for (const gateIds of [[], ["gate-a"]]) {
    assert.throws(() => controller.complete("review", "success", { treeHash: hash, gateIds }));
    assert.equal(controller.snapshot().attempts[0]!.state, "running");
    assert.deepEqual(controller.snapshot().gates, {});
  }
  controller.complete("review", "success", { treeHash: hash, gateIds: ["gate-a", "review-extra"] });
  assert.equal(controller.snapshot().gates["review-extra"], hash);
});

test("current normalization rejects gate-free review units", () => {
  const spec = validWorkflow();
  mapping(spec, "a", "validator", "review");
  spec.workUnits[0]!.acceptanceGateIds = [];
  assert.throws(() => validateWorkflow(spec), /acceptanceGateIds/);
});

test("current default deadline expires at exactly five minutes even with unbounded budgets", () => {
  let now = 100;
  const controller = createDispatchController(
    { ...validWorkflow(), budgets: { mode: "unbounded" } },
    { now: () => now },
  );
  assert.equal(controller.reserve(request()).deadline, 300100);
  now = 300099;
  assert.equal(controller.snapshot().attempts[0]!.state, "running");
  now = 300100;
  assert.equal(controller.snapshot().attempts[0]!.state, "cancel-requested");
  assert.equal(controller.snapshot().active, 1);
  assert.throws(() => controller.complete("attempt-a", "success"), /late/);
});

test("current deadline authority captures construction options and detaches returned records", () => {
  let now = 100;
  const options = { now: () => now, timeoutMs: 50 };
  const controller = createDispatchController(validWorkflow(), options);
  options.timeoutMs = 1000;
  const first = controller.reserve(request());
  assert.equal(first.deadline, 150);
  first.deadline = 9999;
  controller.snapshot().attempts[0]!.deadline = 9999;
  assert.equal(controller.snapshot().attempts[0]!.deadline, 150);
  controller.complete("attempt-a", "failed");
  now = 110;
  assert.equal(controller.reserve(request("retry")).deadline, 160);
});

function mapping(
  spec: ReturnType<typeof validWorkflow>,
  unit: string,
  role: string,
  taskMode: string,
) {
  spec.roleModeTaskMapping = spec.roleModeTaskMapping.filter((m) => m.workUnitId !== unit);
  spec.roleModeTaskMapping.push({ workUnitId: unit, role, taskMode, boundedTask: "bounded" });
}

test("workflow validates references and rejects cycles, duplicate declarations and missing mappings", () => {
  assert.equal(validateWorkflow(validWorkflow()).workUnits.length, 3);
  const mutations = [
    (s: ReturnType<typeof validWorkflow>) => {
      s.dag.dependencies = [
        { workUnitId: "a", dependsOn: ["b"] },
        { workUnitId: "b", dependsOn: ["a"] },
      ];
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.dag.dependencies = [{ workUnitId: "a", dependsOn: ["missing"] }];
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.workUnits[0]!.acceptanceGateIds = ["unknown"];
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.acceptanceGates[0]!.workUnitIds = ["unknown"];
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.workUnits.push(s.workUnits[0]!);
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.roleModeTaskMapping.pop();
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.roleModeTaskMapping[0]!.taskMode = "integration";
    },
    (s: ReturnType<typeof validWorkflow>) => {
      s.dag.parallelism.authorization = "";
    },
  ];
  for (const mutate of mutations) {
    const spec = validWorkflow();
    mutate(spec);
    assert.throws(() => validateWorkflow(spec));
  }
});
test("REA static capability is exact, scoped and rejects other operations", () => {
  const spec = validWorkflow();
  const policy = {
    path: "/tmp/fixture.exe",
    sha256: "a".repeat(64),
    tools: ["rea_inspect_pe_imports"],
  };
  Object.assign(spec.workUnits[0]!, { reaStaticInspection: policy });
  assert.deepEqual(validateWorkflow(spec).workUnits[0]!.reaStaticInspection, policy);
  for (const changed of [
    { ...policy, path: "/tmp/../etc/passwd" },
    { ...policy, sha256: "not-a-digest" },
    { ...policy, tools: ["rea_open_binary"] },
  ]) {
    const invalid = validWorkflow();
    Object.assign(invalid.workUnits[0]!, { reaStaticInspection: changed });
    assert.throws(() => validateWorkflow(invalid), /REA/);
  }
  const unrelated = validWorkflow();
  Object.assign(unrelated.workUnits[0]!, { reaStaticInspection: policy });
  mapping(unrelated, "a", "planner", "plan");
  assert.throws(() => validateWorkflow(unrelated), /REA/);
});
test("write-producing source and package QA cannot become managed acceptance gates", () => {
  for (const command of [
    "node .opencode/scripts/validate-" + "harness.mts",
    "node .opencode/scripts/validate-portable-harness.mjs --root .",
    "npm pack --dry-run --json",
    "npm test",
    "npm run build",
  ]) {
    const spec = validWorkflow();
    spec.acceptanceGates[0]!.evidenceCommand = command;
    assert.throws(() => validateWorkflow(spec), /managed acceptance gate needs read-only/);
  }
  const readOnly = validWorkflow();
  readOnly.acceptanceGates[0]!.evidenceCommand =
    "node --check .opencode/plugin-modules/managed-dispatch.js";
  assert.equal(
    validateWorkflow(readOnly).acceptanceGates[0]!.evidenceCommand,
    readOnly.acceptanceGates[0]!.evidenceCommand,
  );
});
test("scope containment and unsupported authority fail closed", () => {
  for (const path of ["/tmp/a", "../a", "src/../a", ".git/config", "src/*", "src\\a", "src//a"])
    assert.throws(() => safeScopePath(path));
  assert.equal(withinScope("src/a.ts", ["src/"]), true);
  assert.equal(withinScope("src-other/a.ts", ["src/"]), false);
  const spec = validWorkflow();
  spec.workUnits[0]!.allowedPaths = ["other/"];
  assert.throws(() => validateWorkflow(spec), /scope exceeds/);
  for (const field of ["liveProviders", "userGlobalMutation"] as const) {
    const changed = validWorkflow();
    changed.authorization[field] = true;
    assert.throws(() => validateWorkflow(changed), /unsupported/);
  }
});
test("reservation is atomic across concurrent callers and failed reservations consume no attempts", async () => {
  const controller = createDispatchController(validWorkflow());
  const results = await Promise.allSettled(
    [request("one", "a"), request("two", "b")].map((r) =>
      Promise.resolve().then(() => controller.reserve(r)),
    ),
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(controller.snapshot().attempts.length, 1);
  assert.equal(controller.snapshot().counts.researcher, 1);
});
test("explicit parallel readers respect per-role default and configured capacities", () => {
  const one = createDispatchController(validWorkflow(), { maxConcurrent: 3 });
  one.reserve(request());
  assert.throws(() => one.reserve(request("two", "b")), /role capacity/);
  const two = createDispatchController(validWorkflow(), parallel);
  two.reserve(request());
  two.reserve(request("two", "b"));
  assert.equal(two.snapshot().active, 2);
});
test("same-scope dispatch regression and serial writer isolation", () => {
  const readers = createDispatchController(validWorkflow(), parallel);
  readers.reserve(request());
  assert.throws(() => readers.reserve(request("duplicate-scope")), /scope already reserved/);
  const spec = validWorkflow();
  mapping(spec, "b", "implementer", "implementation");
  const controller = createDispatchController(spec, parallel);
  controller.reserve(request());
  assert.throws(
    () => controller.reserve(request("writer", "b", "implementer", "implementation")),
    /writer isolation/,
  );
  controller.complete("attempt-a", "success");
  controller.reserve(request("writer", "b", "implementer", "implementation"));
  assert.throws(() => controller.reserve(request("reader", "c")), /writer isolation/);
  const serial = validWorkflow();
  serial.dag.parallelism.mode = "serial";
  const serialController = createDispatchController(serial, parallel);
  serialController.reserve(request());
  assert.throws(() => serialController.reserve(request("two", "b")), /capacity/);
});
test("duplicate dispatch/completion, changed parent, undeclared tasks and completed tasks reject", () => {
  const controller = createDispatchController(validWorkflow(), parallel);
  controller.reserve(request());
  assert.throws(() => controller.reserve(request()), /duplicate dispatch/);
  assert.throws(
    () => controller.reserve({ ...request("other", "b"), parentSessionId: "other" }),
    /another parent/,
  );
  assert.throws(() => controller.reserve(request("other", "b", "planner", "plan")), /undeclared/);
  controller.complete("attempt-a", "success");
  assert.throws(() => controller.complete("attempt-a", "success"), /duplicate/);
  assert.throws(() => controller.reserve(request("new")), /already succeeded/);
  assert.throws(() => controller.complete("missing", "success"), /unknown/);
});
test("role modes execute in declared order and failed roles cannot unlock successors", () => {
  const spec = validWorkflow();
  spec.roleModeTaskMapping.unshift({
    workUnitId: "a",
    role: "planner",
    taskMode: "plan",
    boundedTask: "plan",
  });
  const controller = createDispatchController(spec);
  assert.throws(() => controller.reserve(request()), /prior task/);
  controller.reserve(request("plan", "a", "planner", "plan"));
  controller.complete("plan", "failed");
  assert.throws(() => controller.reserve(request()), /prior task/);
  controller.reserve(request("plan-retry", "a", "planner", "plan"));
  controller.complete("plan-retry", "success");
  controller.reserve(request());
});
test("prior-mode refusal identifies only a fixed predecessor and does not charge the writer", () => {
  const spec = validWorkflow();
  spec.workUnits = spec.workUnits.slice(0, 1);
  spec.acceptanceGates = spec.acceptanceGates.slice(0, 1);
  spec.roleModeTaskMapping = [
    { workUnitId: "a", role: "researcher", taskMode: "research", boundedTask: "inspect" },
    { workUnitId: "a", role: "planner", taskMode: "plan", boundedTask: "plan" },
    { workUnitId: "a", role: "implementer", taskMode: "implementation", boundedTask: "edit" },
  ];
  const writer = request("sensitive-task", "a", "implementer", "implementation");
  for (const outcome of ["blocked", "failed", "success"] as const) {
    const controller = createDispatchController(spec);
    const refuse = (predecessor: string, state: string) => {
      const before = controller.snapshot();
      assert.throws(
        () => controller.reserve(writer),
        (error: unknown) => {
          assert.equal(
            (error as Error).message,
            `Harness dispatch controller: prior task mode not ready: ${predecessor} (${state})`,
          );
          assert.doesNotMatch(
            (error as Error).message,
            /sensitive-task|parent|src\/|gate-a|a:planner/,
          );
          return true;
        },
      );
      assert.deepEqual(controller.snapshot(), before);
    };
    refuse("researcher/research", "unknown");
    controller.reserve(request("research", "a"));
    controller.complete("research", "success");
    refuse("planner/plan", "unknown");
    controller.reserve(request("plan", "a", "planner", "plan"));
    controller.complete("plan", outcome);
    if (outcome === "success") {
      controller.reserve(writer);
      assert.equal(controller.snapshot().counts.implementer, 1);
    } else refuse("planner/plan", outcome);
  }
});
test("dependency readiness includes validator gates, and invalid proofs do not terminally complete", () => {
  const spec = validWorkflow();
  mapping(spec, "a", "validator", "validation");
  spec.dag.dependencies = [{ workUnitId: "b", dependsOn: ["a"] }];
  const controller = createDispatchController(spec, parallel);
  assert.throws(() => controller.reserve(request("b", "b")), /dependency/);
  controller.reserve(request("validate", "a", "validator", "validation"));
  for (const proof of [
    {},
    { treeHash: "bad", gateIds: ["gate-a"] },
    { treeHash: hash, gateIds: ["gate-b"] },
  ])
    assert.throws(() => controller.complete("validate", "success", proof));
  assert.equal(controller.snapshot().active, 1);
  controller.complete("validate", "success", { treeHash: hash, gateIds: ["gate-a"] });
  controller.reserve(request("b", "b"));
  assert.equal(controller.snapshot().gates["gate-a"], hash);
});
test("shared gates allow the separate downstream validator but block ordinary consumers", () => {
  const spec = validWorkflow();
  mapping(spec, "b", "validator", "validation");
  spec.workUnits[1]!.acceptanceGateIds = ["gate-a"];
  spec.acceptanceGates[0]!.workUnitIds = ["a", "b"];
  spec.dag.dependencies = [
    { workUnitId: "b", dependsOn: ["a"] },
    { workUnitId: "c", dependsOn: ["a"] },
  ];
  const controller = createDispatchController(spec, parallel);
  controller.reserve(request());
  controller.complete("attempt-a", "success");
  assert.throws(() => controller.reserve(request("consumer", "c")), /gate not ready/);
  controller.reserve(request("validate", "b", "validator", "validation"));
  controller.complete("validate", "success", { treeHash: hash, gateIds: ["gate-a"] });
  controller.reserve(request("consumer", "c"));
});
test("total, per-role and remediation budgets count failed/blocked/launch attempts without retry multiplication", () => {
  const total = validWorkflow();
  total.budgets.maxTotalLeafAgents = 1;
  const controller = createDispatchController(total);
  controller.reserve(request());
  controller.failLaunch("attempt-a");
  assert.throws(() => controller.reserve(request("other", "b")), /agent budget/);
  const role = validWorkflow();
  role.budgets.maxLeafAgentsByRole.researcher = 1;
  const roleController = createDispatchController(role);
  roleController.reserve(request());
  roleController.complete("attempt-a", "blocked");
  assert.throws(() => roleController.reserve(request("other", "b")), /agent budget/);
  const retry = createDispatchController(validWorkflow());
  retry.reserve(request());
  retry.failLaunch("attempt-a");
  assert.equal(retry.snapshot().active, 0);
  retry.reserve(request("retry"));
  retry.complete("retry", "failed");
  assert.throws(() => retry.reserve(request("third")), /remediation budget/);
  assert.equal(retry.snapshot().counts.researcher, 2);
});
test("timeouts retain capacity until reconciliation and reject late result and clarification", () => {
  let now = 100;
  const controller = createDispatchController(validWorkflow(), {
    ...parallel,
    now: () => now,
    timeoutMs: 10,
  });
  controller.reserve(request());
  controller.clarification("attempt-a");
  now = 110;
  assert.throws(() => controller.continueClarification("attempt-a"), /stale/);
  assert.equal(controller.snapshot().active, 1);
  assert.equal(controller.snapshot().attempts[0]!.state, "cancel-requested");
  assert.throws(() => controller.complete("attempt-a", "success"), /late/);
  assert.throws(() => controller.reserve(request("other", "b")), /reconciled/);
  controller.reconcileCancelled("attempt-a");
  assert.equal(controller.snapshot().active, 0);
  assert.throws(() => controller.reserve(request("other", "b")), /cannot resume/);
});
test("explicit cancel, interruption and fresh controller never revive old task authorization", () => {
  const controller = createDispatchController(validWorkflow(), parallel);
  controller.reserve(request());
  controller.cancel("attempt-a");
  assert.throws(() => controller.complete("attempt-a", "success"), /cancelled/);
  controller.reconcileCancelled("attempt-a");
  assert.throws(() => controller.reconcileCancelled("attempt-a"), /not pending/);
  const fresh = createDispatchController(validWorkflow());
  assert.throws(() => fresh.continueClarification("attempt-a"), /unknown/);
  assert.throws(() => fresh.complete("attempt-a", "success"), /unknown/);
  fresh.reserve(request());
  fresh.interrupt();
  assert.equal(fresh.snapshot().resumable, false);
  assert.throws(() => fresh.reserve(request("other", "b")), /cannot resume/);
});
test("clarification retains reservation, does not spend another attempt, and expires with original deadline", () => {
  const controller = createDispatchController(validWorkflow());
  controller.reserve(request());
  controller.clarification("attempt-a");
  assert.throws(() => controller.complete("attempt-a", "success"), /late/);
  assert.throws(() => controller.reserve(request("other", "b")), /capacity/);
  controller.continueClarification("attempt-a");
  controller.complete("attempt-a", "success");
  assert.equal(controller.snapshot().counts.researcher, 1);
});
test("validated workflow and returned snapshots cannot mutate authoritative limits or state", () => {
  const raw = validWorkflow();
  const controller = createDispatchController(raw);
  raw.budgets.maxTotalLeafAgents = 100;
  assert.equal(controller.spec.budgets.mode, "bounded");
  if (controller.spec.budgets.mode !== "bounded") throw new Error("expected bounded fixture");
  assert.equal(controller.spec.budgets.maxTotalLeafAgents, 12);
  assert.throws(() => {
    if (controller.spec.budgets.mode === "bounded")
      controller.spec.budgets.maxTotalLeafAgents = 100;
  }, TypeError);
  assert.throws(() => {
    controller.spec.dag.dependencies.push({ workUnitId: "a", dependsOn: ["b"] });
  }, TypeError);
  const attempt = controller.reserve(request());
  attempt.state = "success";
  const snapshot = controller.snapshot();
  snapshot.attempts[0]!.state = "success";
  snapshot.counts.researcher = 99;
  assert.equal(controller.snapshot().attempts[0]!.state, "running");
  assert.equal(controller.snapshot().counts.researcher, 1);
});
test("unbounded/default budgets remove attempts, role and remediation caps without removing guards", () => {
  for (const budgets of [{}, { mode: "unbounded" }]) {
    let now = 0;
    const controller = createDispatchController(
      { ...validWorkflow(), budgets },
      { now: () => now, timeoutMs: 10 },
    );
    assert.deepEqual(controller.spec.budgets, { mode: "unbounded" });
    for (let index = 0; index < 1050; index++) {
      const id = `retry-${index}`;
      controller.reserve(request(id));
      controller.chargeContinuation(id);
      controller.complete(id, "failed");
    }
    controller.reserve(request("final"));
    assert.throws(() => controller.reserve(request("duplicate")), /capacity/);
    assert.throws(
      () => controller.reserve({ ...request("other-parent", "b"), parentSessionId: "other" }),
      /another parent/,
    );
    now = 11;
    assert.throws(() => controller.complete("final", "success"), /late/);
    assert.throws(() => controller.reserve(request("after-timeout")), /uncertain/);
    controller.reconcileCancelled("final");
    assert.throws(() => controller.reserve(request("after-cancel")), /interrupted/);
  }
});

test("budget modes reject ambiguous, malformed and accidentally downgraded limits", () => {
  const legacy = validWorkflow();
  assert.equal(validateWorkflow(legacy).budgets.mode, "bounded");
  assert.equal(
    validateWorkflow({ ...legacy, budgets: { ...legacy.budgets, mode: "bounded" } }).budgets.mode,
    "bounded",
  );
  for (const budgets of [
    { mode: "unbounded", maxTotalLeafAgents: 1 },
    { ...legacy.budgets, mode: "unknown" },
    { mode: "bounded" },
    { maxTotalLeafAgents: 1 },
    { mode: null },
  ])
    assert.throws(() => validateWorkflow({ ...legacy, budgets }));
});

test("one remediation generation covers implementation and revalidation; failed reservation is atomic", () => {
  const spec = validWorkflow();
  spec.roleModeTaskMapping = [
    { workUnitId: "a", role: "implementer", taskMode: "implementation", boundedTask: "edit" },
    { workUnitId: "a", role: "validator", taskMode: "validation", boundedTask: "check" },
    ...spec.roleModeTaskMapping.filter((m) => m.workUnitId !== "a"),
  ];
  const c = createDispatchController(spec);
  c.reserve(request("i1", "a", "implementer", "implementation"));
  c.complete("i1", "success");
  assert.throws(
    () => c.reserve(request("early", "a", "implementer", "implementation")),
    /already succeeded/,
  );
  c.reserve(request("v1", "a", "validator", "validation"));
  c.complete("v1", "failed");
  const before = c.snapshot();
  assert.throws(() =>
    c.reserve({
      ...request("bad", "a", "implementer", "implementation"),
      parentSessionId: "other",
    }),
  );
  assert.deepEqual(c.snapshot(), before);
  c.reserve(request("i2", "a", "implementer", "implementation"));
  c.complete("i2", "success");
  c.reserve(request("v2", "a", "validator", "validation"));
  c.complete("v2", "failed");
  assert.throws(
    () => c.reserve(request("i3", "a", "implementer", "implementation")),
    /remediation budget/,
  );
  assert.equal(c.snapshot().attempts.length, 4);
});

test("late clarification is rejected before entering guidance state", () => {
  let time = 0;
  const c = createDispatchController(validWorkflow(), { now: () => time, timeoutMs: 10 });
  c.reserve(request());
  time = 11;
  assert.throws(() => c.clarification("attempt-a"), /invalid clarification/);
  assert.equal(c.snapshot().attempts[0]!.state, "cancel-requested");
});

test("normalized schema rejects missing, extra and inconsistent fields", () => {
  for (const mutate of [
    (s: Record<string, unknown>) => {
      delete s.routingMetadataStatus;
    },
    (s: Record<string, unknown>) => {
      s.unexpected = true;
    },
    (s: Record<string, unknown>) => {
      s.routingMetadataStatus = "present";
    },
    (s: Record<string, unknown>) => {
      s.routingMetadata = {};
    },
  ]) {
    const s = validWorkflow();
    mutate(s);
    assert.throws(() => validateWorkflow(s));
  }
  const s = validWorkflow();
  s.acceptanceGates[0]!.workUnitIds = ["b"];
  assert.throws(() => validateWorkflow(s), /cover/);
});

test("staged dependent writes invalidate prior gates and permit budgeted revalidation", () => {
  const spec = validWorkflow();
  spec.budgets.maxLeafAgentsByRole.validator = 4;
  spec.workUnits = spec.workUnits.slice(0, 2);
  spec.acceptanceGates = spec.acceptanceGates.slice(0, 2);
  spec.roleModeTaskMapping = ["a", "b"].flatMap((workUnitId) => [
    { workUnitId, role: "implementer", taskMode: "implementation", boundedTask: "edit" },
    { workUnitId, role: "validator", taskMode: "validation", boundedTask: "check" },
  ]);
  spec.dag.dependencies = [{ workUnitId: "b", dependsOn: ["a"] }];
  const c = createDispatchController(spec);
  c.reserve(request("ia", "a", "implementer", "implementation"));
  c.complete("ia", "success");
  c.reserve(request("va", "a", "validator", "validation"));
  c.complete("va", "success", { treeHash: hash, gateIds: ["gate-a"] });
  const before = c.snapshot();
  assert.throws(() =>
    c.reserve({
      ...request("bad", "b", "implementer", "implementation"),
      parentSessionId: "other",
    }),
  );
  assert.deepEqual(c.snapshot(), before);
  c.reserve(request("ib", "b", "implementer", "implementation"));
  assert.deepEqual(c.snapshot().gates, {});
  c.complete("ib", "success");
  assert.throws(() => c.reserve(request("vb-early", "b", "validator", "validation")), /dependency/);
  c.reserve(request("va2", "a", "validator", "validation"));
  c.complete("va2", "success", { treeHash: hash, gateIds: ["gate-a"] });
  c.reserve(request("vb", "b", "validator", "validation"));
  c.complete("vb", "success", { treeHash: hash, gateIds: ["gate-b"] });
  assert.equal(Object.keys(c.snapshot().gates).length, 2);
  assert.equal(c.snapshot().attempts.length, 5);
});

test("in-scope implementation can proceed directly to independent validation without an integration pass", () => {
  const spec = validWorkflow();
  spec.workUnits = spec.workUnits.slice(0, 1);
  spec.acceptanceGates = spec.acceptanceGates.slice(0, 1);
  spec.roleModeTaskMapping = [
    {
      workUnitId: "a",
      role: "implementer",
      taskMode: "implementation",
      boundedTask: "implement and fix in-scope coherence",
    },
    {
      workUnitId: "a",
      role: "validator",
      taskMode: "validation",
      boundedTask: "independent acceptance",
    },
  ];
  spec.budgets.maxTotalLeafAgents = 2;
  const c = createDispatchController(spec);
  c.reserve(request("implementation", "a", "implementer", "implementation"));
  c.complete("implementation", "success");
  assert.deepEqual(c.snapshot().gates, {});
  assert.throws(
    () => c.reserve(request("unneeded", "a", "implementer", "integration")),
    /undeclared/,
  );
  c.reserve(request("validation", "a", "validator", "validation"));
  c.complete("validation", "success", { treeHash: hash, gateIds: ["gate-a"] });
  assert.equal(c.snapshot().attempts.length, 2);
  assert.equal(c.snapshot().gates["gate-a"], hash);
});

test("distinct integration deliverable adds one dispatch and still requires independent validation", () => {
  const spec = validWorkflow();
  spec.workUnits = spec.workUnits.slice(0, 1);
  spec.acceptanceGates = spec.acceptanceGates.slice(0, 1);
  spec.roleModeTaskMapping = [
    { workUnitId: "a", role: "implementer", taskMode: "implementation", boundedTask: "edit" },
    {
      workUnitId: "a",
      role: "implementer",
      taskMode: "integration",
      boundedTask: "stitch independent output",
    },
    { workUnitId: "a", role: "validator", taskMode: "validation", boundedTask: "accept" },
  ];
  const c = createDispatchController(spec);
  for (const taskMode of ["implementation", "integration"]) {
    c.reserve(request(taskMode, "a", "implementer", taskMode));
    c.complete(taskMode, "success");
    assert.deepEqual(c.snapshot().gates, {});
  }
  c.reserve(request("validate", "a", "validator", "validation"));
  c.complete("validate", "success", { treeHash: hash, gateIds: ["gate-a"] });
  assert.equal(c.snapshot().attempts.length, 3);
});

// A v2 review with no duties must not inherit the unit's gate authority.
export function v2Workflow() {
  const spec = validWorkflow();
  return {
    ...spec,
    schemaVersion: "2.0.0",
    roleModeTaskMapping: spec.roleModeTaskMapping.flatMap((m) => [
      {
        ...m,
        role: "validator",
        taskMode: "review",
        gateObligations: [] as string[],
        taskTimeoutMs: 25,
      },
      {
        ...m,
        role: "validator",
        taskMode: "validation",
        gateObligations: ["gate-" + m.workUnitId],
        taskTimeoutMs: 50,
      },
    ]),
  };
}

test("v2 advisory review does not close or bypass gates", () => {
  const spec = v2Workflow();
  spec.dag.dependencies = [{ workUnitId: "b", dependsOn: ["a"] }];
  spec.acceptanceGates[0]!.workUnitIds.push("b");
  spec.workUnits[1]!.acceptanceGateIds.push("gate-a");
  spec.roleModeTaskMapping.find(
    (m) => m.workUnitId === "a" && m.taskMode === "validation",
  )!.gateObligations = [];
  spec.roleModeTaskMapping
    .find((m) => m.workUnitId === "b" && m.taskMode === "validation")!
    .gateObligations.push("gate-a");
  const controller = createDispatchController(spec);
  controller.reserve(request("review-a", "a", "validator", "review"));
  controller.complete("review-a", "success", { treeHash: hash, gateIds: [] });
  controller.reserve(request("validate-a", "a", "validator", "validation"));
  controller.complete("validate-a", "success", { treeHash: hash, gateIds: [] });
  assert.deepEqual(controller.snapshot().gates, {});
  assert.throws(
    () => controller.reserve(request("review-b", "b", "validator", "review")),
    /dependency gate/,
  );
});

test("v2 gate owners are unique and complete", () => {
  assert.equal(createDispatchController(v2Workflow()).spec.schemaVersion, "2.0.0");
  for (const mutate of [
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[1]!.gateObligations = [];
    },
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[0]!.gateObligations = ["gate-a"];
    },
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[1]!.gateObligations.push("gate-a");
    },
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[1]!.gateObligations = ["unknown"];
    },
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[1]!.role = "researcher";
      s.roleModeTaskMapping[1]!.taskMode = "research";
    },
    (s: ReturnType<typeof v2Workflow>) => {
      s.roleModeTaskMapping[1]!.gateObligations = ["gate-b"];
    },
  ]) {
    const spec = v2Workflow();
    mutate(spec);
    assert.throws(() => createDispatchController(spec));
  }
});

test("v2 association edges agree", () => {
  const spec = v2Workflow();
  spec.acceptanceGates[0]!.workUnitIds.push("b");
  assert.throws(() => createDispatchController(spec), /association/);
  const legacy = validWorkflow();
  legacy.acceptanceGates[0]!.workUnitIds.push("b");
  assert.deepEqual(createDispatchController(legacy).spec.associationDiagnostics, [
    { workUnitId: "b", gateId: "gate-a", unitDeclares: false, gateDeclares: true },
  ]);
});

test("admitted duration survives clarification and snapshot mutation", () => {
  let now = 100;
  const spec = v2Workflow();
  const controller = createDispatchController(spec, { now: () => now });
  const first = controller.reserve(request("review", "a", "validator", "review"));
  assert.equal(first.taskTimeoutMs, 25);
  assert.equal(first.deadline, 125);
  spec.roleModeTaskMapping[0]!.taskTimeoutMs = 999;
  first.deadline = 999;
  controller.snapshot().attempts[0]!.deadline = 999;
  controller.clarification("review");
  now = 124;
  controller.continueClarification("review");
  assert.equal(controller.snapshot().attempts[0]!.state, "running");
  now = 125;
  assert.equal(controller.snapshot().attempts[0]!.state, "cancel-requested");
  assert.equal(controller.snapshot().active, 1);
  assert.throws(
    () => controller.complete("review", "success", { gateIds: [], treeHash: hash }),
    /late/,
  );
});

test("ceiling rejects without clamping", () => {
  for (const duration of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, 3600001]) {
    const spec = v2Workflow();
    spec.roleModeTaskMapping[0]!.taskTimeoutMs = duration;
    assert.throws(() => createDispatchController(spec), /timeout|duration/i);
  }
  const omitted = v2Workflow();
  for (const m of omitted.roleModeTaskMapping) Reflect.deleteProperty(m, "taskTimeoutMs");
  assert.equal(
    createDispatchController(omitted).spec.roleModeTaskMapping[0]!.taskTimeoutMs,
    300000,
  );
  assert.throws(() => createDispatchController(omitted, { maxTaskTimeoutMs: 299999 }), /ceiling/);
  assert.throws(() => createDispatchController(v2Workflow(), { timeoutMs: 0 }), /v2|legacy/);
  for (const ceiling of [0, -1, 1.5, NaN, Infinity, 3600001])
    assert.throws(() => createDispatchController(v2Workflow(), { maxTaskTimeoutMs: ceiling }));
  for (const duration of [1, 3600000]) {
    const spec = v2Workflow();
    spec.roleModeTaskMapping[0]!.taskTimeoutMs = duration;
    assert.equal(
      createDispatchController(spec, { now: () => 100 }).reserve(
        request("review", "a", "validator", "review"),
      ).deadline,
      100 + duration,
    );
  }
});

test("deadline arithmetic fails atomically", () => {
  let time = NaN;
  const controller = createDispatchController(v2Workflow(), { now: () => time });
  for (time of [NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => controller.reserve(request("review", "a", "validator", "review")),
      /clock|deadline/,
    );
    assert.equal(controller.snapshot().attempts.length, 0);
    assert.equal(controller.snapshot().counts.validator, 0);
  }
  time = 100;
  assert.equal(controller.reserve(request("review", "a", "validator", "review")).deadline, 125);
});

test("v2 exact owner closure and immutable lookup", () => {
  const controller = createDispatchController(v2Workflow());
  const mapping = { workUnitId: "a", role: "validator" as const, taskMode: "validation" };
  const gates = gateObligationsFor(controller.spec, mapping);
  assert.deepEqual(
    gates.map((g) => g.id),
    ["gate-a"],
  );
  assert.throws(() => {
    (gates as unknown as unknown[]).push({});
  });
  assert.throws(() => {
    gates[0]!.owner!.workUnitId = "b";
  });
  controller.reserve(request("review", "a", "validator", "review"));
  controller.complete("review", "success", { treeHash: hash, gateIds: [] });
  controller.reserve(request("owner", "a", "validator", "validation"));
  for (const gateIds of [[], ["gate-a", "gate-b"], ["gate-a", "gate-a"]])
    assert.throws(() => controller.complete("owner", "success", { treeHash: hash, gateIds }));
  controller.complete("owner", "success", { treeHash: hash, gateIds: ["gate-a"] });
  assert.deepEqual(controller.snapshot().gates, { "gate-a": hash });
});

test("v2 exact shared-gate owner alone may cross dependency while advisory and ordinary consumers wait", () => {
  const spec = v2Workflow();
  spec.roleModeTaskMapping = [
    { ...spec.roleModeTaskMapping[0]!, role: "researcher", taskMode: "research" },
    { ...spec.roleModeTaskMapping[3]!, gateObligations: ["gate-a", "gate-b"] },
    ...spec.roleModeTaskMapping.slice(4),
  ];
  spec.workUnits[1]!.acceptanceGateIds.push("gate-a");
  spec.acceptanceGates[0]!.workUnitIds.push("b");
  spec.dag.dependencies = [
    { workUnitId: "b", dependsOn: ["a"] },
    { workUnitId: "c", dependsOn: ["a"] },
  ];
  const controller = createDispatchController(spec);
  controller.reserve(request());
  controller.complete("attempt-a", "success");
  assert.throws(
    () => controller.reserve(request("review-c", "c", "validator", "review")),
    /dependency gate/,
  );
  controller.reserve(request("owner-b", "b", "validator", "validation"));
  assert.throws(
    () => controller.complete("owner-b", "success", { treeHash: hash, gateIds: ["gate-b"] }),
    /mismatch/,
  );
  controller.complete("owner-b", "success", { treeHash: hash, gateIds: ["gate-a", "gate-b"] });
  controller.reserve(request("review-c", "c", "validator", "review"));
});

test("v2 writer invalidates completed advisory review even before any gate closed", () => {
  const spec = v2Workflow();
  spec.roleModeTaskMapping = [
    ...spec.roleModeTaskMapping.slice(0, 2),
    { ...spec.roleModeTaskMapping[2]!, role: "implementer", taskMode: "implementation" },
    spec.roleModeTaskMapping[3]!,
    ...spec.roleModeTaskMapping.slice(4),
  ];
  const controller = createDispatchController(spec);
  controller.reserve(request("review-a", "a", "validator", "review"));
  controller.complete("review-a", "success", { treeHash: hash, gateIds: [] });
  controller.reserve(request("writer-b", "b", "implementer", "implementation"));
  controller.complete("writer-b", "success");
  assert.throws(
    () => controller.reserve(request("owner-a", "a", "validator", "validation")),
    /prior task mode/,
  );
  controller.reserve(request("review-a-fresh", "a", "validator", "review"));
});

test("versioned mapping fields reject omissions, unknown fields and v1 additions", () => {
  for (const field of ["gateObligations", "taskTimeoutMs"]) {
    const legacy = validWorkflow();
    Object.assign(legacy.roleModeTaskMapping[0]!, {
      [field]: field === "gateObligations" ? [] : 25,
    });
    assert.throws(() => createDispatchController(legacy), /unexpected/);
  }
  const missing = v2Workflow();
  Reflect.deleteProperty(missing.roleModeTaskMapping[0]!, "gateObligations");
  assert.throws(() => createDispatchController(missing), /normalized field/);
  const extra = v2Workflow();
  Object.assign(extra.roleModeTaskMapping[0]!, { arbitrary: true });
  assert.throws(() => createDispatchController(extra), /normalized field/);
});

test("reservation samples the clock once and retry preserves admitted duration", () => {
  let now = 100,
    samples = 0;
  const controller = createDispatchController(v2Workflow(), {
    now: () => {
      samples++;
      return now;
    },
  });
  controller.reserve(request("review", "a", "validator", "review"));
  assert.equal(samples, 1);
  controller.complete("review", "failed");
  now = 110;
  const retry = controller.reserve(request("retry", "a", "validator", "review"));
  assert.equal(retry.taskTimeoutMs, 25);
  assert.equal(retry.deadline, 135);
  assert.equal(controller.diagnostics().maxTaskTimeoutMs, 3600000);
  assert.equal(controller.diagnostics().attempts[1]!.remainingMs, 25);
});
