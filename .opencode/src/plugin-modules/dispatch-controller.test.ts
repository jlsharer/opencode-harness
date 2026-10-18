import assert from "node:assert/strict";
import test from "node:test";
import {
  createDispatchController,
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
  assert.equal(controller.spec.budgets.maxTotalLeafAgents, 12);
  assert.throws(() => {
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
});
