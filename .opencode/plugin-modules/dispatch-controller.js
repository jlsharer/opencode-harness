import { TASK_MODES } from "./task-contracts.js";
import path from "node:path";
const ROLES = ["researcher", "planner", "implementer", "validator"];
function fail(message) {
    throw new Error(`Harness dispatch controller: ${message}`);
}
function record(value, label) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        fail(`invalid ${label}`);
    return value;
}
function text(value, label) {
    if (typeof value !== "string" || !value.trim() || value.length > 4096)
        fail(`invalid ${label}`);
    return value;
}
/** Known non-read-only gates fail before a workflow is registered or consumes attempts.
 * This is not a general shell analyzer: other gates still need a reviewed input/write boundary. */
function managedGate(value) {
    const command = text(value, "evidenceCommand");
    if (/^node\s+\.opencode\/scripts\/validate-(?:harness\.mts|portable-harness\.mjs)(?:\s|$)/.test(command) ||
        /^(?:npm|pnpm|yarn|bun)\s+(?:pack|install|ci|test|run\s+(?:build|compile|format|test(?::\S+)?|check:generated))(?:\s|$)/.test(command))
        fail("managed acceptance gate needs read-only inputs and no host writes; run package/source QA separately outside managed verification");
    return command;
}
function id(value) {
    const result = text(value, "identifier");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(result))
        fail("unsafe identifier");
    return result;
}
function list(value, label, empty = false) {
    if (!Array.isArray(value) || value.length > 256 || (!empty && !value.length))
        fail(`invalid ${label}`);
    return value;
}
function strings(value, label, empty = false) {
    const values = list(value, label, empty).map((entry) => text(entry, label));
    if (new Set(values).size !== values.length)
        fail(`duplicate ${label}`);
    return values;
}
function integer(value, label, minimum = 1, maximum = 1024) {
    if (typeof value !== "number" ||
        !Number.isSafeInteger(value) ||
        value < minimum ||
        value > maximum)
        fail(`invalid ${label}`);
    return value;
}
function requireCanonicalPath(value) {
    if (!path.isAbsolute(value) ||
        value === "/" ||
        value.includes("\0") ||
        value.includes("\\") ||
        path.resolve(value) !== value)
        fail("invalid REA target path");
    return value;
}
export function safeScopePath(value) {
    if (value.startsWith("/") || value.includes("\\") || /[\0\r\n*?\[\]{}:]/.test(value))
        fail("unsafe scope path");
    const components = value.replace(/\/$/, "").split("/");
    if (components.some((part) => !part || part === "." || part === ".." || part === ".git"))
        fail("unsafe scope path");
    return value;
}
export function withinScope(filename, allowed) {
    safeScopePath(filename);
    return allowed.some((item) => item.endsWith("/") ? filename.startsWith(item) : filename === item);
}
function exact(value, required, optional = []) {
    if (required.some((key) => !Object.hasOwn(value, key)) ||
        Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key)))
        fail("missing or unexpected normalized field");
}
export function validateWorkflow(input, acceptanceGatePolicy = "legacy-read-only") {
    if (!["legacy-read-only", "native-host"].includes(acceptanceGatePolicy))
        fail("invalid acceptance gate policy");
    const value = record(input, "workflow");
    exact(value, [
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
    ], ["routingMetadata", "validationInputs"]);
    if (value.routingMetadataStatus === "present")
        record(value.routingMetadata, "routingMetadata");
    else if (value.routingMetadataStatus !== "absent" || Object.hasOwn(value, "routingMetadata"))
        fail("invalid routing metadata status");
    if (value.schemaVersion !== "1.0.0")
        fail("unsupported workflow version");
    text(value.goal, "goal");
    strings(value.deliverables, "deliverables");
    strings(value.nonGoals, "nonGoals");
    const allowedPaths = strings(value.allowedPaths, "allowedPaths").map(safeScopePath);
    const workUnits = list(value.workUnits, "workUnits").map((entry) => {
        const unit = record(entry, "workUnit");
        exact(unit, ["id", "goal", "deliverable", "nonGoals", "allowedPaths", "acceptanceGateIds"], ["reaStaticInspection"]);
        text(unit.goal, "work unit goal");
        text(unit.deliverable, "work unit deliverable");
        strings(unit.nonGoals, "unit nonGoals");
        const paths = strings(unit.allowedPaths, "unit allowedPaths").map(safeScopePath);
        if (paths.some((p) => !withinScope(p, allowedPaths)))
            fail("unit scope exceeds workflow scope");
        let reaStaticInspection;
        if (unit.reaStaticInspection !== undefined) {
            const policy = record(unit.reaStaticInspection, "REA static inspection");
            exact(policy, ["path", "sha256", "tools"]);
            if (typeof policy.path !== "string" ||
                !policy.path.startsWith("/") ||
                policy.path !== requireCanonicalPath(policy.path) ||
                typeof policy.sha256 !== "string" ||
                !/^[a-f0-9]{64}$/.test(policy.sha256))
                fail("invalid REA target identity");
            const tools = strings(policy.tools, "REA tools");
            if (tools.some((tool) => tool !== "rea_inspect_pe_imports"))
                fail("unsupported REA static tool");
            reaStaticInspection = { path: policy.path, sha256: policy.sha256, tools };
        }
        return {
            id: id(unit.id),
            allowedPaths: paths,
            acceptanceGateIds: strings(unit.acceptanceGateIds, "acceptanceGateIds").map(id),
            ...(reaStaticInspection ? { reaStaticInspection } : {}),
        };
    });
    const units = new Set(workUnits.map((u) => u.id));
    if (units.size !== workUnits.length)
        fail("duplicate work unit");
    const acceptanceGates = list(value.acceptanceGates, "acceptanceGates").map((entry) => {
        const gate = record(entry, "gate");
        exact(gate, ["id", "criterion", "evidenceCommand", "workUnitIds"]);
        text(gate.criterion, "criterion");
        return {
            id: id(gate.id),
            evidenceCommand: acceptanceGatePolicy === "native-host"
                ? text(gate.evidenceCommand, "evidenceCommand")
                : managedGate(gate.evidenceCommand),
            workUnitIds: strings(gate.workUnitIds, "gate workUnitIds").map(id),
        };
    });
    const gates = new Set(acceptanceGates.map((g) => g.id));
    if (gates.size !== acceptanceGates.length)
        fail("duplicate gate");
    for (const unit of workUnits)
        if (unit.acceptanceGateIds.some((g) => !gates.has(g)))
            fail("unknown acceptance gate");
    for (const gate of acceptanceGates)
        if (gate.workUnitIds.some((u) => !units.has(u)))
            fail("unknown gate work unit");
    for (const unit of workUnits)
        if (unit.acceptanceGateIds.some((gate) => !acceptanceGates.find((g) => g.id === gate).workUnitIds.includes(unit.id)))
            fail("gate does not cover work unit");
    const roleModeTaskMapping = list(value.roleModeTaskMapping, "roleModeTaskMapping").map((entry) => {
        const mapping = record(entry, "mapping");
        exact(mapping, ["workUnitId", "role", "taskMode", "boundedTask"]);
        const role = text(mapping.role, "role");
        const taskMode = text(mapping.taskMode, "taskMode");
        text(mapping.boundedTask, "boundedTask");
        if (!ROLES.includes(role) || !TASK_MODES[role].includes(taskMode))
            fail("invalid role mode");
        const workUnitId = id(mapping.workUnitId);
        if (!units.has(workUnitId))
            fail("unknown mapping work unit");
        return { workUnitId, role, taskMode };
    });
    const mappingKeys = roleModeTaskMapping.map((m) => `${m.workUnitId}:${m.role}:${m.taskMode}`);
    if (new Set(mappingKeys).size !== mappingKeys.length ||
        workUnits.some((u) => !roleModeTaskMapping.some((m) => m.workUnitId === u.id)))
        fail("duplicate or missing mapping");
    for (const unit of workUnits)
        if (unit.reaStaticInspection &&
            !roleModeTaskMapping.some((mapping) => mapping.workUnitId === unit.id && ["researcher", "validator"].includes(mapping.role)))
            fail("REA static inspection requires a researcher or validator work unit");
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
    const visiting = new Set();
    const visited = new Set();
    function visit(unit) {
        if (visiting.has(unit))
            fail("cyclic dependency graph");
        if (visited.has(unit))
            return;
        visiting.add(unit);
        for (const dependency of dependencies.find((e) => e.workUnitId === unit)?.dependsOn ?? [])
            visit(dependency);
        visiting.delete(unit);
        visited.add(unit);
    }
    for (const unit of units)
        visit(unit);
    const parallel = record(dag.parallelism, "parallelism");
    exact(parallel, ["mode", "authorization", "distinctCapacityEvidence"]);
    if (parallel.mode !== "serial" && parallel.mode !== "parallel")
        fail("invalid parallelism");
    if (parallel.mode === "parallel" &&
        parallel.authorization !== "explicit" &&
        !(typeof parallel.distinctCapacityEvidence === "string" &&
            parallel.distinctCapacityEvidence.trim()))
        fail("parallelism not authorized");
    if (!["explicit", "not-authorized"].includes(String(parallel.authorization)) ||
        !(parallel.distinctCapacityEvidence === null ||
            typeof parallel.distinctCapacityEvidence === "string"))
        fail("invalid parallel authorization");
    const budgets = record(value.budgets, "budgets");
    if (budgets.defaultRemediationCyclesPerWorkUnit !== 1)
        fail("invalid default remediation budget");
    exact(budgets, [
        "defaultRemediationCyclesPerWorkUnit",
        "maxRemediationCyclesPerWorkUnit",
        "maxTotalLeafAgents",
        "maxLeafAgentsByRole",
    ]);
    const byRole = record(budgets.maxLeafAgentsByRole, "role budgets");
    exact(byRole, ["researcher", "planner", "implementer", "validator"]);
    const maxLeafAgentsByRole = Object.fromEntries(ROLES.map((role) => [role, integer(byRole[role], `${role} budget`, 0)]));
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
    if (typeof scope.requiresUserApproval !== "boolean")
        fail("invalid scope approval");
    if (scope.policy !== "deny")
        fail("scope expansion is unsupported; register a separately reviewed workflow");
    return {
        orchestrationId: id(value.orchestrationId),
        validationInputs: value.validationInputs === undefined
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
            maxRemediationCyclesPerWorkUnit: integer(budgets.maxRemediationCyclesPerWorkUnit, "remediation budget", 0, 16),
        },
    };
}
function deepFreeze(value) {
    if (value && typeof value === "object") {
        Object.values(value).forEach(deepFreeze);
        Object.freeze(value);
    }
    return value;
}
export function createDispatchController(input, options = {}) {
    const spec = deepFreeze(validateWorkflow(input, options.acceptanceGatePolicy));
    const now = options.now ?? Date.now;
    const maxConcurrent = integer(options.maxConcurrent ?? 1, "capacity", 1, 16);
    const maxConcurrentByRole = Object.fromEntries(ROLES.map((role) => [
        role,
        integer(options.maxConcurrentByRole?.[role] ?? 1, role + " capacity", 1, 16),
    ]));
    const timeoutMs = integer(options.timeoutMs ?? 300000, "timeout", 1, 3600000);
    const attempts = new Map();
    const completed = new Map();
    const gates = new Map();
    const counts = Object.fromEntries(ROLES.map((role) => [role, 0]));
    const retries = new Map();
    const lastAttemptGeneration = new Map();
    let owner = null;
    let interrupted = false;
    let continuations = 0;
    const key = (r) => `${r.workUnitId}:${r.role}:${r.taskMode}`;
    const active = () => [...attempts.values()].filter((a) => ["running", "awaiting-guidance", "cancel-requested"].includes(a.state));
    const unitDone = (unit) => spec.roleModeTaskMapping
        .filter((m) => m.workUnitId === unit)
        .every((m) => completed.has(`${unit}:${m.role}:${m.taskMode}`));
    function sweep() {
        for (const attempt of active())
            if (attempt.state !== "cancel-requested" && now() >= attempt.deadline) {
                attempt.state = "cancel-requested";
                attempt.reason = "timeout: worker termination must be reconciled";
            }
    }
    function reserve(request) {
        sweep();
        if (interrupted)
            fail("ephemeral workflow interrupted; cannot resume");
        id(request.id);
        id(request.workUnitId);
        text(request.parentSessionId, "parentSessionId");
        if (owner !== null && owner !== request.parentSessionId)
            fail("workflow belongs to another parent");
        if (attempts.has(request.id))
            fail("duplicate dispatch");
        if (!spec.roleModeTaskMapping.some((m) => m.workUnitId === request.workUnitId &&
            m.role === request.role &&
            m.taskMode === request.taskMode))
            fail("undeclared task");
        const sequence = spec.roleModeTaskMapping.filter((m) => m.workUnitId === request.workUnitId);
        const index = sequence.findIndex((m) => m.role === request.role && m.taskMode === request.taskMode);
        const generation = retries.get(request.workUnitId) ?? 0;
        const reopensSuccess = completed.has(key(request)) &&
            request.role === "implementer" &&
            sequence.slice(index + 1).some((m) => {
                const mappingKey = `${m.workUnitId}:${m.role}:${m.taskMode}`;
                const latest = [...attempts.values()].filter((a) => key(a) === mappingKey).at(-1);
                return (m.role === "validator" &&
                    lastAttemptGeneration.get(mappingKey) === generation &&
                    latest &&
                    ["blocked", "failed"].includes(latest.state));
            });
        if (completed.has(key(request)) && !reopensSuccess)
            fail("task already succeeded");
        const pending = active();
        if (pending.some((a) => a.state === "cancel-requested"))
            fail("uncertain worker must be reconciled");
        if (pending.length >= (spec.dag.parallelism.mode === "serial" ? 1 : maxConcurrent))
            fail("capacity exhausted");
        if (pending.filter((a) => a.role === request.role).length >= maxConcurrentByRole[request.role])
            fail("role capacity exhausted");
        if (pending.some((a) => a.workUnitId === request.workUnitId))
            fail("scope already reserved");
        // Until worktree isolation exists all writers are serialized with all other work.
        if (pending.length &&
            (request.role === "implementer" || pending.some((a) => a.role === "implementer")))
            fail("writer isolation requires serial execution");
        for (const dependency of spec.dag.dependencies.find((e) => e.workUnitId === request.workUnitId)
            ?.dependsOn ?? []) {
            if (!unitDone(dependency))
                fail("dependency not ready");
            const required = spec.workUnits.find((u) => u.id === dependency).acceptanceGateIds;
            // Only the declared downstream validator may run to close an outstanding
            // dependency gate. Other consumers must wait, including shared-gate consumers.
            for (const gate of required) {
                const definition = spec.acceptanceGates.find((g) => g.id === gate);
                const closesGate = request.role === "validator" &&
                    definition.workUnitIds.includes(request.workUnitId) &&
                    spec.workUnits.find((u) => u.id === request.workUnitId).acceptanceGateIds.includes(gate);
                if (!gates.has(gate) && !closesGate)
                    fail("dependency gate not ready");
            }
        }
        const missing = sequence
            .slice(0, index)
            .find((m) => !completed.has(`${m.workUnitId}:${m.role}:${m.taskMode}`));
        if (missing) {
            const latest = [...attempts.values()]
                .filter((a) => a.workUnitId === missing.workUnitId &&
                a.role === missing.role &&
                a.taskMode === missing.taskMode)
                .at(-1);
            const state = ["success", "failed", "blocked", "running"].includes(latest?.state ?? "")
                ? latest.state
                : "unknown";
            // Only validated mapping enums and a fixed state leave this boundary.
            fail(`prior task mode not ready: ${missing.role}/${missing.taskMode} (${state})`);
        }
        const startsCycle = lastAttemptGeneration.has(key(request)) &&
            (lastAttemptGeneration.get(key(request)) === generation || reopensSuccess);
        if (startsCycle &&
            (retries.get(request.workUnitId) ?? 0) >= spec.budgets.maxRemediationCyclesPerWorkUnit)
            fail("remediation budget exhausted");
        if (attempts.size + continuations >= spec.budgets.maxTotalLeafAgents ||
            counts[request.role] >= spec.budgets.maxLeafAgentsByRole[request.role])
            fail("agent budget exhausted");
        // All validation occurs before this synchronous reservation; there is no await race.
        owner = request.parentSessionId;
        const nextGeneration = startsCycle ? generation + 1 : generation;
        if (startsCycle) {
            retries.set(request.workUnitId, nextGeneration);
            for (const mapping of sequence.slice(index))
                completed.delete(`${mapping.workUnitId}:${mapping.role}:${mapping.taskMode}`);
            for (const gate of spec.acceptanceGates)
                if (gate.workUnitIds.includes(request.workUnitId))
                    gates.delete(gate.id);
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
        const attempt = {
            ...request,
            state: "running",
            startedAt: now(),
            deadline: now() + timeoutMs,
        };
        attempts.set(request.id, attempt);
        return { ...attempt };
    }
    function current(attemptId) {
        const value = attempts.get(attemptId);
        if (!value)
            fail("unknown attempt");
        return value;
    }
    function complete(attemptId, outcome, proof = {}) {
        sweep();
        const attempt = current(attemptId);
        if (attempt.state !== "running")
            fail("duplicate, cancelled, or late completion");
        if (outcome === "success" && attempt.role === "validator") {
            if (!proof.treeHash || !/^[a-f0-9]{64}$/.test(proof.treeHash) || !proof.gateIds?.length)
                fail("independent tree-bound gate evidence required");
            const required = spec.workUnits.find((u) => u.id === attempt.workUnitId).acceptanceGateIds;
            if (proof.gateIds.some((g) => !required.includes(g)) ||
                required.some((g) => !proof.gateIds.includes(g)))
                fail("gate evidence mismatch");
            for (const gate of proof.gateIds)
                gates.set(gate, proof.treeHash);
        }
        attempt.state = outcome;
        if (outcome === "success")
            completed.set(key(attempt), attempt.id);
        return { ...attempt };
    }
    function clarification(attemptId) {
        sweep();
        const attempt = current(attemptId);
        if (attempt.state !== "running")
            fail("invalid clarification state");
        attempt.state = "awaiting-guidance";
    }
    function continueClarification(attemptId) {
        sweep();
        const attempt = current(attemptId);
        if (attempt.state !== "awaiting-guidance")
            fail("stale clarification");
        attempt.state = "running";
    }
    function chargeContinuation(attemptId) {
        sweep();
        const attempt = current(attemptId);
        if (interrupted || attempt.state !== "running")
            fail("continuation requires a running task");
        if (attempts.size + continuations >= spec.budgets.maxTotalLeafAgents ||
            counts[attempt.role] >= spec.budgets.maxLeafAgentsByRole[attempt.role])
            fail("agent budget exhausted");
        continuations++;
        counts[attempt.role]++;
    }
    function cancel(attemptId) {
        const attempt = current(attemptId);
        if (!["running", "awaiting-guidance"].includes(attempt.state))
            fail("cannot cancel terminal attempt");
        attempt.state = "cancel-requested";
        attempt.reason = "termination acknowledgement required";
    }
    function reconcileCancelled(attemptId) {
        const attempt = current(attemptId);
        if (attempt.state !== "cancel-requested")
            fail("cancellation not pending");
        attempt.state = "cancelled";
        interrupted = true;
    }
    function failLaunch(attemptId) {
        const attempt = current(attemptId);
        if (attempt.state !== "running")
            fail("invalid launch failure");
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
            mode: "ephemeral",
            resumable: false,
            interrupted,
            active: active().length,
            continuations,
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
        chargeContinuation,
        reconcileCancelled,
        failLaunch,
        sweep,
        interrupt,
        snapshot,
    };
}
