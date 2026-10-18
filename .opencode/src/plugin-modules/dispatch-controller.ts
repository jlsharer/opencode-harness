import { TASK_MODES } from "./task-contracts.ts";
import type { TaskContext } from "./task-contracts.ts";

type Role = TaskContext["role"];
type RecordValue = Record<string, unknown>;

const ROLES: Role[] = ["researcher", "planner", "implementer", "validator"];

export interface WorkflowSpec {
  orchestrationId: string;
  allowedPaths: string[];
  validationInputs: string[];
  workUnits: { id: string; allowedPaths: string[]; acceptanceGateIds: string[] }[];
  acceptanceGates: { id: string; evidenceCommand: string; workUnitIds: string[] }[];
  roleModeTaskMapping: { workUnitId: string; role: Role; taskMode: string }[];
  dag: {
    dependencies: { workUnitId: string; dependsOn: string[] }[];
    parallelism: { mode: "serial" | "parallel" };
  };
  budgets: {
    maxTotalLeafAgents: number;
    maxLeafAgentsByRole: Record<Role, number>;
    maxRemediationCyclesPerWorkUnit: number;
  };
}

function fail(message: string): never {
  throw new Error(`Harness dispatch controller: ${message}`);
}

function record(value: unknown, label: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`invalid ${label}`);
  return value as RecordValue;
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim() || value.length > 4096) fail(`invalid ${label}`);
  return value;
}

function id(value: unknown): string {
  const result = text(value, "identifier");
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(result)) fail("unsafe identifier");
  return result;
}

function list(value: unknown, label: string, empty = false): unknown[] {
  if (!Array.isArray(value) || value.length > 256 || (!empty && !value.length))
    fail(`invalid ${label}`);
  return value;
}

function strings(value: unknown, label: string, empty = false): string[] {
  const values = list(value, label, empty).map((entry) => text(entry, label));
  if (new Set(values).size !== values.length) fail(`duplicate ${label}`);
  return values;
}

function integer(value: unknown, label: string, minimum = 1, maximum = 1024): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < minimum ||
    value > maximum
  )
    fail(`invalid ${label}`);
  return value;
}

export function safeScopePath(value: string): string {
  if (value.startsWith("/") || value.includes("\\") || /[\0\r\n*?\[\]{}:]/.test(value))
    fail("unsafe scope path");
  const components = value.replace(/\/$/, "").split("/");
  if (components.some((part) => !part || part === "." || part === ".." || part === ".git"))
    fail("unsafe scope path");
  return value;
}

export function withinScope(filename: string, allowed: readonly string[]): boolean {
  safeScopePath(filename);
  return allowed.some((item) =>
    item.endsWith("/") ? filename.startsWith(item) : filename === item,
  );
}

function exact(value: RecordValue, required: string[], optional: string[] = []) {
  if (
    required.some((key) => !Object.hasOwn(value, key)) ||
    Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))
  )
    fail("missing or unexpected normalized field");
}

export function validateWorkflow(input: unknown): WorkflowSpec {
  const value = record(input, "workflow");
  exact(
    value,
    [
      "schemaVersion",
      "orchestrationId",
      "goal",
      "deliverables",
      "nonGoals",
      "allowedPaths",
      "workUnits",
      "acceptanceGates",
      "roleModeTaskMapping",
      "dag",
      "budgets",
      "scopeExpansion",
      "authorization",
      "routingMetadataStatus",
    ],
    ["routingMetadata", "validationInputs"],
  );
  if (value.routingMetadataStatus === "present") record(value.routingMetadata, "routingMetadata");
  else if (value.routingMetadataStatus !== "absent" || Object.hasOwn(value, "routingMetadata"))
    fail("invalid routing metadata status");
  if (value.schemaVersion !== "1.0.0") fail("unsupported workflow version");
  text(value.goal, "goal");
  strings(value.deliverables, "deliverables");
  strings(value.nonGoals, "nonGoals");
  const allowedPaths = strings(value.allowedPaths, "allowedPaths").map(safeScopePath);
  const workUnits = list(value.workUnits, "workUnits").map((entry) => {
    const unit = record(entry, "workUnit");
    exact(unit, ["id", "goal", "deliverable", "nonGoals", "allowedPaths", "acceptanceGateIds"]);
    text(unit.goal, "work unit goal");
    text(unit.deliverable, "work unit deliverable");
    strings(unit.nonGoals, "unit nonGoals");
    const paths = strings(unit.allowedPaths, "unit allowedPaths").map(safeScopePath);
    if (paths.some((p) => !withinScope(p, allowedPaths))) fail("unit scope exceeds workflow scope");
    return {
      id: id(unit.id),
      allowedPaths: paths,
      acceptanceGateIds: strings(unit.acceptanceGateIds, "acceptanceGateIds").map(id),
    };
  });
  const units = new Set(workUnits.map((u) => u.id));
  if (units.size !== workUnits.length) fail("duplicate work unit");
  const acceptanceGates = list(value.acceptanceGates, "acceptanceGates").map((entry) => {
    const gate = record(entry, "gate");
    exact(gate, ["id", "criterion", "evidenceCommand", "workUnitIds"]);
    text(gate.criterion, "criterion");
    return {
      id: id(gate.id),
      evidenceCommand: text(gate.evidenceCommand, "evidenceCommand"),
      workUnitIds: strings(gate.workUnitIds, "gate workUnitIds").map(id),
    };
  });
  const gates = new Set(acceptanceGates.map((g) => g.id));
  if (gates.size !== acceptanceGates.length) fail("duplicate gate");
  for (const unit of workUnits)
    if (unit.acceptanceGateIds.some((g) => !gates.has(g))) fail("unknown acceptance gate");
  for (const gate of acceptanceGates)
    if (gate.workUnitIds.some((u) => !units.has(u))) fail("unknown gate work unit");
  for (const unit of workUnits)
    if (
      unit.acceptanceGateIds.some(
        (gate) => !acceptanceGates.find((g) => g.id === gate)!.workUnitIds.includes(unit.id),
      )
    )
      fail("gate does not cover work unit");
  const roleModeTaskMapping = list(value.roleModeTaskMapping, "roleModeTaskMapping").map(
    (entry) => {
      const mapping = record(entry, "mapping");
      exact(mapping, ["workUnitId", "role", "taskMode", "boundedTask"]);
      const role = text(mapping.role, "role") as Role;
      const taskMode = text(mapping.taskMode, "taskMode");
      text(mapping.boundedTask, "boundedTask");
      if (!ROLES.includes(role) || !TASK_MODES[role].includes(taskMode)) fail("invalid role mode");
      const workUnitId = id(mapping.workUnitId);
      if (!units.has(workUnitId)) fail("unknown mapping work unit");
      return { workUnitId, role, taskMode };
    },
  );
  const mappingKeys = roleModeTaskMapping.map((m) => `${m.workUnitId}:${m.role}:${m.taskMode}`);
  if (
    new Set(mappingKeys).size !== mappingKeys.length ||
    workUnits.some((u) => !roleModeTaskMapping.some((m) => m.workUnitId === u.id))
  )
    fail("duplicate or missing mapping");
  const dag = record(value.dag, "dag");
  exact(dag, ["dependencies", "parallelism"]);
  const dependencies = list(dag.dependencies, "dependencies", true).map((entry) => {
    const edge = record(entry, "dependency");
    exact(edge, ["workUnitId", "dependsOn"]);
    const workUnitId = id(edge.workUnitId);
    const dependsOn = strings(edge.dependsOn, "dependsOn", true).map(id);
    if (!units.has(workUnitId) || dependsOn.some((u) => !units.has(u) || u === workUnitId))
      fail("unknown or self dependency");
    return { workUnitId, dependsOn };
  });
  if (new Set(dependencies.map((e) => e.workUnitId)).size !== dependencies.length)
    fail("duplicate dependency entry");
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(unit: string) {
    if (visiting.has(unit)) fail("cyclic dependency graph");
    if (visited.has(unit)) return;
    visiting.add(unit);
    for (const dependency of dependencies.find((e) => e.workUnitId === unit)?.dependsOn ?? [])
      visit(dependency);
    visiting.delete(unit);
    visited.add(unit);
  }

  for (const unit of units) visit(unit);
  const parallel = record(dag.parallelism, "parallelism");
  exact(parallel, ["mode", "authorization", "distinctCapacityEvidence"]);
  if (parallel.mode !== "serial" && parallel.mode !== "parallel") fail("invalid parallelism");
  if (
    parallel.mode === "parallel" &&
    parallel.authorization !== "explicit" &&
    !(
      typeof parallel.distinctCapacityEvidence === "string" &&
      parallel.distinctCapacityEvidence.trim()
    )
  )
    fail("parallelism not authorized");
  if (
    !["explicit", "not-authorized"].includes(String(parallel.authorization)) ||
    !(
      parallel.distinctCapacityEvidence === null ||
      typeof parallel.distinctCapacityEvidence === "string"
    )
  )
    fail("invalid parallel authorization");
  const budgets = record(value.budgets, "budgets");
  if (budgets.defaultRemediationCyclesPerWorkUnit !== 1) fail("invalid default remediation budget");
  exact(budgets, [
    "defaultRemediationCyclesPerWorkUnit",
    "maxRemediationCyclesPerWorkUnit",
    "maxTotalLeafAgents",
    "maxLeafAgentsByRole",
  ]);
  const byRole = record(budgets.maxLeafAgentsByRole, "role budgets");
  exact(byRole, ["researcher", "planner", "implementer", "validator"]);
  const maxLeafAgentsByRole = Object.fromEntries(
    ROLES.map((role) => [role, integer(byRole[role], `${role} budget`, 0)]),
  ) as Record<Role, number>;
  const authorization = record(value.authorization, "authorization");
  exact(authorization, ["liveProviders", "userGlobalMutation", "git"]);
  if (authorization.liveProviders !== false || authorization.userGlobalMutation !== false)
    fail("live providers and global mutation are unsupported by this controller");
  const git = record(authorization.git, "git authorization");
  exact(git, ["commit", "amend", "push", "otherMutation"]);
  if (["commit", "amend", "push", "otherMutation"].some((key) => git[key] !== false))
    fail("Git mutation is unsupported by this controller");
  const scope = record(value.scopeExpansion, "scopeExpansion");
  exact(scope, ["policy", "requiresUserApproval"]);
  if (typeof scope.requiresUserApproval !== "boolean") fail("invalid scope approval");
  if (scope.policy !== "deny")
    fail("scope expansion is unsupported; register a separately reviewed workflow");
  return {
    orchestrationId: id(value.orchestrationId),
    validationInputs:
      value.validationInputs === undefined
        ? []
        : strings(value.validationInputs, "validationInputs", true).map(safeScopePath),
    allowedPaths,
    workUnits,
    acceptanceGates,
    roleModeTaskMapping,
    dag: { dependencies, parallelism: { mode: parallel.mode } },
    budgets: {
      maxTotalLeafAgents: integer(budgets.maxTotalLeafAgents, "total budget"),
      maxLeafAgentsByRole,
      maxRemediationCyclesPerWorkUnit: integer(
        budgets.maxRemediationCyclesPerWorkUnit,
        "remediation budget",
        0,
        16,
      ),
    },
  };
}

export interface DispatchRequest {
  id: string;
  workUnitId: string;
  role: Role;
  taskMode: string;
  parentSessionId: string;
}
export interface Attempt extends DispatchRequest {
  state:
    | "running"
    | "awaiting-guidance"
    | "cancel-requested"
    | "success"
    | "blocked"
    | "failed"
    | "cancelled";
  startedAt: number;
  deadline: number;
  reason?: string;
}
export interface CompletionProof {
  gateIds?: string[];
  treeHash?: string;
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

export function createDispatchController(
  input: unknown,
  options: {
    now?: () => number;
    maxConcurrent?: number;
    maxConcurrentByRole?: Partial<Record<Role, number>>;
    timeoutMs?: number;
  } = {},
) {
  const spec = deepFreeze(validateWorkflow(input));
  const now = options.now ?? Date.now;
  const maxConcurrent = integer(options.maxConcurrent ?? 1, "capacity", 1, 16);
  const maxConcurrentByRole = Object.fromEntries(
    ROLES.map((role) => [
      role,
      integer(options.maxConcurrentByRole?.[role] ?? 1, role + " capacity", 1, 16),
    ]),
  ) as Record<Role, number>;
  const timeoutMs = integer(options.timeoutMs ?? 300000, "timeout", 1, 3600000);
  const attempts = new Map<string, Attempt>();
  const completed = new Map<string, string>();
  const gates = new Map<string, string>();
  const counts = Object.fromEntries(ROLES.map((role) => [role, 0])) as Record<Role, number>;
  const retries = new Map<string, number>();
  const lastAttemptGeneration = new Map<string, number>();
  let owner: string | null = null;
  let interrupted = false;
  const key = (r: DispatchRequest) => `${r.workUnitId}:${r.role}:${r.taskMode}`;
  const active = () =>
    [...attempts.values()].filter((a) =>
      ["running", "awaiting-guidance", "cancel-requested"].includes(a.state),
    );
  const unitDone = (unit: string) =>
    spec.roleModeTaskMapping
      .filter((m) => m.workUnitId === unit)
      .every((m) => completed.has(`${unit}:${m.role}:${m.taskMode}`));

  function sweep() {
    for (const attempt of active())
      if (attempt.state !== "cancel-requested" && now() >= attempt.deadline) {
        attempt.state = "cancel-requested";
        attempt.reason = "timeout: worker termination must be reconciled";
      }
  }

  function reserve(request: DispatchRequest): Attempt {
    sweep();
    if (interrupted) fail("ephemeral workflow interrupted; cannot resume");
    id(request.id);
    id(request.workUnitId);
    text(request.parentSessionId, "parentSessionId");
    if (owner !== null && owner !== request.parentSessionId)
      fail("workflow belongs to another parent");
    if (attempts.has(request.id)) fail("duplicate dispatch");
    if (
      !spec.roleModeTaskMapping.some(
        (m) =>
          m.workUnitId === request.workUnitId &&
          m.role === request.role &&
          m.taskMode === request.taskMode,
      )
    )
      fail("undeclared task");
    const sequence = spec.roleModeTaskMapping.filter((m) => m.workUnitId === request.workUnitId);
    const index = sequence.findIndex(
      (m) => m.role === request.role && m.taskMode === request.taskMode,
    );
    const generation = retries.get(request.workUnitId) ?? 0;
    const reopensSuccess =
      completed.has(key(request)) &&
      request.role === "implementer" &&
      sequence.slice(index + 1).some((m) => {
        const mappingKey = `${m.workUnitId}:${m.role}:${m.taskMode}`;
        const latest = [...attempts.values()].filter((a) => key(a) === mappingKey).at(-1);
        return (
          m.role === "validator" &&
          lastAttemptGeneration.get(mappingKey) === generation &&
          latest &&
          ["blocked", "failed"].includes(latest.state)
        );
      });
    if (completed.has(key(request)) && !reopensSuccess) fail("task already succeeded");
    const pending = active();
    if (pending.some((a) => a.state === "cancel-requested"))
      fail("uncertain worker must be reconciled");
    if (pending.length >= (spec.dag.parallelism.mode === "serial" ? 1 : maxConcurrent))
      fail("capacity exhausted");
    if (pending.filter((a) => a.role === request.role).length >= maxConcurrentByRole[request.role])
      fail("role capacity exhausted");
    if (pending.some((a) => a.workUnitId === request.workUnitId)) fail("scope already reserved");
    // Until worktree isolation exists all writers are serialized with all other work.
    if (
      pending.length &&
      (request.role === "implementer" || pending.some((a) => a.role === "implementer"))
    )
      fail("writer isolation requires serial execution");
    for (const dependency of spec.dag.dependencies.find((e) => e.workUnitId === request.workUnitId)
      ?.dependsOn ?? []) {
      if (!unitDone(dependency)) fail("dependency not ready");
      const required = spec.workUnits.find((u) => u.id === dependency)!.acceptanceGateIds;
      // Only the declared downstream validator may run to close an outstanding
      // dependency gate. Other consumers must wait, including shared-gate consumers.
      for (const gate of required) {
        const definition = spec.acceptanceGates.find((g) => g.id === gate)!;
        const closesGate =
          request.role === "validator" &&
          definition.workUnitIds.includes(request.workUnitId) &&
          spec.workUnits.find((u) => u.id === request.workUnitId)!.acceptanceGateIds.includes(gate);
        if (!gates.has(gate) && !closesGate) fail("dependency gate not ready");
      }
    }
    if (
      sequence
        .slice(0, index)
        .some((m) => !completed.has(`${m.workUnitId}:${m.role}:${m.taskMode}`))
    )
      fail("prior task mode not ready");
    const startsCycle =
      lastAttemptGeneration.has(key(request)) &&
      (lastAttemptGeneration.get(key(request)) === generation || reopensSuccess);
    if (
      startsCycle &&
      (retries.get(request.workUnitId) ?? 0) >= spec.budgets.maxRemediationCyclesPerWorkUnit
    )
      fail("remediation budget exhausted");
    if (
      attempts.size >= spec.budgets.maxTotalLeafAgents ||
      counts[request.role] >= spec.budgets.maxLeafAgentsByRole[request.role]
    )
      fail("agent budget exhausted");
    // All validation occurs before this synchronous reservation; there is no await race.
    owner = request.parentSessionId;
    const nextGeneration = startsCycle ? generation + 1 : generation;
    if (startsCycle) {
      retries.set(request.workUnitId, nextGeneration);
      for (const mapping of sequence.slice(index))
        completed.delete(`${mapping.workUnitId}:${mapping.role}:${mapping.taskMode}`);
      for (const gate of spec.acceptanceGates)
        if (gate.workUnitIds.includes(request.workUnitId)) gates.delete(gate.id);
    }
    lastAttemptGeneration.set(key(request), nextGeneration);
    // A writer begins a new tree revision. Dependency authorization was checked above;
    // prior acceptance must now be re-established on that revision, without charging
    // a remediation cycle merely for successful validators rerunning after new work.
    if (request.role === "implementer" && gates.size) {
      gates.clear();
      for (const mapping of spec.roleModeTaskMapping) {
        const mappingKey = `${mapping.workUnitId}:${mapping.role}:${mapping.taskMode}`;
        if (mapping.role === "validator" && completed.has(mappingKey)) {
          completed.delete(mappingKey);
          lastAttemptGeneration.delete(mappingKey);
        }
      }
    }
    counts[request.role] += 1;
    const attempt: Attempt = {
      ...request,
      state: "running",
      startedAt: now(),
      deadline: now() + timeoutMs,
    };
    attempts.set(request.id, attempt);
    return { ...attempt };
  }

  function current(attemptId: string): Attempt {
    const value = attempts.get(attemptId);
    if (!value) fail("unknown attempt");
    return value;
  }

  function complete(
    attemptId: string,
    outcome: "success" | "blocked" | "failed",
    proof: CompletionProof = {},
  ) {
    sweep();
    const attempt = current(attemptId);
    if (attempt.state !== "running") fail("duplicate, cancelled, or late completion");
    if (outcome === "success" && attempt.role === "validator") {
      if (!proof.treeHash || !/^[a-f0-9]{64}$/.test(proof.treeHash) || !proof.gateIds?.length)
        fail("independent tree-bound gate evidence required");
      const required = spec.workUnits.find((u) => u.id === attempt.workUnitId)!.acceptanceGateIds;
      if (
        proof.gateIds.some((g) => !required.includes(g)) ||
        required.some((g) => !proof.gateIds!.includes(g))
      )
        fail("gate evidence mismatch");
      for (const gate of proof.gateIds) gates.set(gate, proof.treeHash);
    }
    attempt.state = outcome;
    if (outcome === "success") completed.set(key(attempt), attempt.id);
    return { ...attempt };
  }

  function clarification(attemptId: string) {
    sweep();
    const attempt = current(attemptId);
    if (attempt.state !== "running") fail("invalid clarification state");
    attempt.state = "awaiting-guidance";
  }

  function continueClarification(attemptId: string) {
    sweep();
    const attempt = current(attemptId);
    if (attempt.state !== "awaiting-guidance") fail("stale clarification");
    attempt.state = "running";
  }

  function cancel(attemptId: string) {
    const attempt = current(attemptId);
    if (!["running", "awaiting-guidance"].includes(attempt.state))
      fail("cannot cancel terminal attempt");
    attempt.state = "cancel-requested";
    attempt.reason = "termination acknowledgement required";
  }

  function reconcileCancelled(attemptId: string) {
    const attempt = current(attemptId);
    if (attempt.state !== "cancel-requested") fail("cancellation not pending");
    attempt.state = "cancelled";
    interrupted = true;
  }

  function failLaunch(attemptId: string) {
    const attempt = current(attemptId);
    if (attempt.state !== "running") fail("invalid launch failure");
    attempt.state = "failed";
    attempt.reason = "launch failed before execution";
  }

  function interrupt() {
    interrupted = true;
    for (const attempt of active()) {
      attempt.state = "cancel-requested";
      attempt.reason = "interrupted; non-resumable";
    }
  }

  function snapshot() {
    sweep();
    return {
      mode: "ephemeral" as const,
      resumable: false,
      interrupted,
      active: active().length,
      attempts: [...attempts.values()].map((a) => ({ ...a })),
      counts: { ...counts },
      gates: Object.fromEntries(gates),
    };
  }

  return {
    spec,
    reserve,
    complete,
    clarification,
    continueClarification,
    cancel,
    reconcileCancelled,
    failLaunch,
    sweep,
    interrupt,
    snapshot,
  };
}
