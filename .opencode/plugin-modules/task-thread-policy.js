const ENVELOPE_START = "<<<HARNESS_TASK_THREAD_POLICY_V1>>>";
const ENVELOPE_END = "<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>";
const ROLES = ["researcher", "planner", "implementer", "validator"];
const TASK_MODES = Object.freeze({
    researcher: ["research"],
    planner: ["plan", "synthesis"],
    implementer: ["implementation", "integration"],
    validator: ["validation", "review", "artifact-proof", "integration-check"],
});
const LIMITS = {
    prompt: 16384,
    id: 160,
    text: 4096,
    packetEntries: 256,
    packetDepth: 8,
    calls: 64,
    tasks: 256,
    delegationIds: 1024,
    noncesPerTask: 32,
};
export const TASK_THREAD_ROLE_PACKET_FIELDS = Object.freeze({
    researcher: {
        required: [
            "orchestrationId",
            "delegationTaskId",
            "scopeKey",
            "dispatchKind",
            "taskMode",
            "scopedQuestion",
            "sourceConstraints",
            "freshnessRequirements",
            "downstreamNeeds",
            "routingMetadataStatus",
        ],
        optional: [
            "relevantPaths",
            "documentationTargets",
            "workspaceRoot",
            "runtimeRoot",
            "traceRoot",
        ],
    },
    planner: {
        required: [
            "orchestrationId",
            "delegationTaskId",
            "scopeKey",
            "dispatchKind",
            "taskMode",
            "approvedGoal",
            "scopeBoundaries",
            "researchEvidence",
            "deliverablePaths",
            "acceptanceCriteria",
            "routingMetadataStatus",
        ],
        optional: [
            "dependencies",
            "assumptions",
            "conflictsOrDecisions",
            "roleOutputs",
            "workspaceRoot",
            "runtimeRoot",
            "traceRoot",
        ],
    },
    implementer: {
        required: [
            "orchestrationId",
            "delegationTaskId",
            "scopeKey",
            "dispatchKind",
            "taskMode",
            "approvedPlan",
            "targetPaths",
            "allowedEditScope",
            "schemaRequirements",
            "preservationRequirements",
            "verificationCommands",
            "routingMetadataStatus",
        ],
        optional: [
            "styleConstraints",
            "handoffRequirements",
            "pathRelationships",
            "manifestExpectations",
            "workspaceRoot",
            "runtimeRoot",
            "traceRoot",
        ],
    },
    validator: {
        required: [
            "orchestrationId",
            "delegationTaskId",
            "scopeKey",
            "dispatchKind",
            "taskMode",
            "changedFiles",
            "verificationCriteria",
            "commandsToRun",
            "schemaContracts",
            "acceptanceStandard",
            "routingMetadataStatus",
        ],
        optional: [
            "expectedWarnings",
            "skippedCheckPolicy",
            "riskAreas",
            "artifactExpectations",
            "pathRelationships",
            "workspaceRoot",
            "runtimeRoot",
            "traceRoot",
        ],
    },
});
const SHAPES = {
    fresh: ["kind", "packet", "role", "version"],
    "clarification-request": ["delegationTaskId", "kind", "question", "requestNonce", "version"],
    "clarification-response": ["answer", "delegationTaskId", "kind", "requestNonce", "version"],
};
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isRole(value) {
    return typeof value === "string" && ROLES.includes(value);
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function policyError(reason) {
    return new Error(`Harness task-thread policy: ${reason}`);
}
function boundedString(value, label, maximum = LIMITS.text) {
    if (typeof value !== "string" || !value.trim() || value.length > maximum)
        throw policyError(`invalid ${label}`);
    return value;
}
function validateBoundedValue(value, label, depth = 0, counter = { entries: 0 }) {
    if (depth > LIMITS.packetDepth || ++counter.entries > LIMITS.packetEntries)
        throw policyError(`oversized ${label}`);
    if (typeof value === "string")
        return boundedString(value, label);
    if (typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value)) ||
        value === null)
        return value;
    if (Array.isArray(value)) {
        if (!value.length)
            throw policyError(`invalid ${label}`);
        value.forEach((entry, index) => validateBoundedValue(entry, `${label}[${index}]`, depth + 1, counter));
        return value;
    }
    if (!isRecord(value))
        throw policyError(`invalid ${label}`);
    const keys = Object.keys(value);
    if (!keys.length || keys.some((key) => !key || key.length > LIMITS.id))
        throw policyError(`invalid ${label}`);
    keys.forEach((key) => validateBoundedValue(value[key], `${label}.${key}`, depth + 1, counter));
    return value;
}
function exactShape(value, expectedKind) {
    if (!isRecord(value) || value.kind !== expectedKind || value.version !== 1)
        throw policyError(`invalid ${expectedKind} envelope`);
    const keys = Object.keys(value).sort();
    const expected = SHAPES[expectedKind];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]))
        throw policyError(`unexpected ${expectedKind} envelope fields`);
}
function parseEnvelope(value, expectedKind) {
    if (typeof value !== "string" || value.length > LIMITS.prompt)
        throw policyError("missing or oversized policy envelope");
    const prefix = `${ENVELOPE_START}\n`;
    const suffix = `\n${ENVELOPE_END}`;
    if (!value.startsWith(prefix) || !value.endsWith(suffix))
        throw policyError("malformed policy envelope");
    let envelope;
    try {
        envelope = JSON.parse(value.slice(prefix.length, -suffix.length));
    }
    catch {
        throw policyError("malformed policy envelope JSON");
    }
    exactShape(envelope, expectedKind);
    if (expectedKind === "fresh") {
        if (!isRole(envelope.role))
            throw policyError("invalid role");
        const shape = TASK_THREAD_ROLE_PACKET_FIELDS[envelope.role];
        const packet = envelope.packet;
        if (!isRecord(packet))
            throw policyError("invalid role packet");
        const allowed = new Set([...shape.required, ...shape.optional]);
        const keys = Object.keys(packet);
        if (shape.required.some((key) => !Object.hasOwn(packet, key)) ||
            keys.some((key) => !allowed.has(key)))
            throw policyError("role packet does not match input contract");
        validateBoundedValue(packet, "role packet");
        boundedString(packet.orchestrationId, "orchestrationId", LIMITS.id);
        boundedString(packet.delegationTaskId, "delegationTaskId", LIMITS.id);
        boundedString(packet.scopeKey, "scopeKey", LIMITS.id);
        if (packet.dispatchKind !== "fresh")
            throw policyError("invalid dispatchKind");
        if (typeof packet.taskMode !== "string" || !TASK_MODES[envelope.role].includes(packet.taskMode))
            throw policyError("invalid taskMode");
        if (typeof packet.routingMetadataStatus !== "string" ||
            !["present", "absent"].includes(packet.routingMetadataStatus))
            throw policyError("invalid routingMetadataStatus");
        return { kind: "fresh", version: 1, role: envelope.role, packet };
    }
    else {
        const delegationTaskId = boundedString(envelope.delegationTaskId, "delegationTaskId", LIMITS.id);
        const requestNonce = boundedString(envelope.requestNonce, "requestNonce", LIMITS.id);
        const field = expectedKind === "clarification-request" ? "question" : "answer";
        const text = boundedString(envelope[field], field);
        return expectedKind === "clarification-request"
            ? {
                kind: "clarification-request",
                version: 1,
                delegationTaskId,
                requestNonce,
                question: text,
            }
            : {
                kind: "clarification-response",
                version: 1,
                delegationTaskId,
                requestNonce,
                answer: text,
            };
    }
}
function parseTaskResult(output, childId) {
    if (typeof output !== "string" || output.length > LIMITS.prompt * 2)
        throw policyError("missing or oversized Task result wrapper");
    const match = /^<task id="([^"\n]+)" state="completed">\n<task_result>\n([\s\S]*)\n<\/task_result>\n<\/task>$/.exec(output);
    if (!match || match[1] !== childId)
        throw policyError("malformed or mismatched Task result wrapper");
    return match[2] ?? "";
}
function digest(value) {
    let hash = 0xcbf29ce484222325n;
    for (const byte of new TextEncoder().encode(value)) {
        hash ^= BigInt(byte);
        hash = BigInt.asUintN(64, hash * 0x100000001b3n);
    }
    return hash.toString(16).padStart(16, "0");
}
function sanitizedIdentifier(value) {
    return typeof value === "string"
        ? value.replace(/[^A-Za-z0-9._:-]/g, "_").slice(0, LIMITS.id)
        : undefined;
}
export function formatTaskThreadEnvelope(envelope) {
    return `${ENVELOPE_START}\n${JSON.stringify(envelope)}\n${ENVELOPE_END}`;
}
export function formatTaskResultWrapper(text, childId, state = "completed") {
    return `<task id="${childId}" state="${state}">\n<task_result>\n${text}\n</task_result>\n</task>`;
}
export function createTaskThreadPolicy({ telemetry = () => { }, limits = {}, } = {}) {
    const cap = { ...LIMITS, ...limits };
    const boundedLimitKeys = ["calls", "tasks", "delegationIds", "noncesPerTask"];
    for (const key of boundedLimitKeys)
        if (!Number.isInteger(cap[key]) || cap[key] < 1 || cap[key] > LIMITS[key])
            throw policyError(`invalid ${key} limit`);
    const callsByCallId = new Map();
    const tasksByChildId = new Map();
    const delegationTaskIds = new Set();
    const notice = (event, fields = {}) => telemetry({
        event,
        delegationTaskId: sanitizedIdentifier(fields.delegationTaskId),
        scopeKey: sanitizedIdentifier(fields.scopeKey),
        ...(fields.reason ? { reason: fields.reason } : {}),
    });
    const removeTask = (childId, task) => {
        task.state = "terminal";
        task.requestNonceDigest = null;
        task.seenNonceDigests.clear();
        tasksByChildId.delete(childId);
    };
    function beforeTask({ sessionID, callID, args }) {
        const parentId = sanitizedIdentifier(boundedString(sessionID, "parent session ID", LIMITS.id));
        const callKey = sanitizedIdentifier(boundedString(callID, "call ID", LIMITS.id));
        if (!isRecord(args))
            throw policyError("Task arguments are missing");
        if (callsByCallId.has(callKey))
            throw policyError("duplicate call ID");
        if (callsByCallId.size >= cap.calls)
            throw policyError("in-flight Task limit reached");
        if (!Object.hasOwn(args, "task_id")) {
            const envelope = parseEnvelope(args.prompt, "fresh");
            const packet = envelope.packet;
            const delegationKey = sanitizedIdentifier(packet.delegationTaskId);
            const scopeKey = sanitizedIdentifier(packet.scopeKey);
            if (args.subagent_type !== envelope.role)
                throw policyError("fresh role does not match subagent_type");
            if (delegationTaskIds.has(delegationKey))
                throw policyError("delegationTaskId must identify exactly one fresh child task");
            if (delegationTaskIds.size >= cap.delegationIds || tasksByChildId.size >= cap.tasks)
                throw policyError("task policy state capacity reached");
            delegationTaskIds.add(delegationKey);
            callsByCallId.set(callKey, {
                kind: "fresh",
                sessionID: parentId,
                delegationTaskId: delegationKey,
                scopeKey,
                role: envelope.role,
                contractDigest: digest(JSON.stringify(packet)),
            });
            notice("fresh-in-flight", { delegationTaskId: delegationKey, scopeKey });
            return;
        }
        const childId = sanitizedIdentifier(boundedString(args.task_id, "task_id", LIMITS.id));
        const envelope = parseEnvelope(args.prompt, "clarification-response");
        const task = tasksByChildId.get(childId);
        const nonceDigest = digest(envelope.requestNonce);
        if (!task || task.state !== "awaiting-guidance")
            throw policyError("task_id reuse is not authorized by an in-progress clarification request");
        if (task.parentSessionID !== parentId ||
            task.delegationTaskId !== sanitizedIdentifier(envelope.delegationTaskId) ||
            task.requestNonceDigest !== nonceDigest ||
            args.subagent_type !== task.role)
            throw policyError("clarification response does not match the recorded task");
        task.state = "continuation-in-flight";
        task.requestNonceDigest = null;
        callsByCallId.set(callKey, { kind: "clarification-response", childId, task });
        notice("continuation-in-flight", {
            delegationTaskId: task.delegationTaskId,
            scopeKey: task.scopeKey,
        });
    }
    function afterTask({ callID, output, metadata, error }) {
        const callKey = sanitizedIdentifier(boundedString(callID, "call ID", LIMITS.id));
        const call = callsByCallId.get(callKey);
        if (!call)
            throw policyError("uncorrelatable Task completion");
        callsByCallId.delete(callKey);
        const rawChildId = isRecord(metadata) ? metadata.sessionId : undefined;
        const childId = typeof rawChildId === "string" && rawChildId ? sanitizedIdentifier(rawChildId) : undefined;
        const mismatchedContinuation = call.kind === "clarification-response" && call.childId && childId !== call.childId;
        if (error || !childId || mismatchedContinuation) {
            if (call.kind === "clarification-response" && call.childId)
                removeTask(call.childId, call.task);
            notice("terminal", {
                delegationTaskId: call.kind === "fresh" ? call.delegationTaskId : call.task.delegationTaskId,
                reason: error ? "execution-error" : "missing-or-mismatched-child-metadata",
            });
            return;
        }
        let task = call.kind === "clarification-response" ? call.task : undefined;
        if (call.kind === "fresh") {
            if (tasksByChildId.has(childId))
                throw policyError("child session ID was already recorded");
            task = {
                parentSessionID: call.sessionID,
                delegationTaskId: call.delegationTaskId,
                scopeKey: call.scopeKey,
                role: call.role,
                contractDigest: call.contractDigest,
                state: "fresh-in-flight",
                requestNonceDigest: null,
                seenNonceDigests: new Set(),
            };
            tasksByChildId.set(childId, task);
        }
        if (!task)
            throw policyError("uncorrelatable Task completion");
        try {
            const request = parseEnvelope(parseTaskResult(output, childId), "clarification-request");
            const nonceDigest = digest(request.requestNonce);
            if (sanitizedIdentifier(request.delegationTaskId) !== task.delegationTaskId)
                throw policyError("clarification request does not match the recorded task");
            if (task.seenNonceDigests.has(nonceDigest))
                throw policyError("clarification request nonce was already used");
            if (task.seenNonceDigests.size >= cap.noncesPerTask)
                throw policyError("clarification turn limit reached");
            task.seenNonceDigests.add(nonceDigest);
            task.state = "awaiting-guidance";
            task.requestNonceDigest = nonceDigest;
            notice("awaiting-guidance", {
                delegationTaskId: task.delegationTaskId,
                scopeKey: task.scopeKey,
            });
        }
        catch {
            removeTask(childId, task);
            notice("terminal", {
                delegationTaskId: task.delegationTaskId,
                scopeKey: task.scopeKey,
                reason: "ordinary-or-invalid-result",
            });
        }
    }
    const stateSnapshot = () => Object.freeze({
        calls: callsByCallId.size,
        tasks: tasksByChildId.size,
        delegationIds: delegationTaskIds.size,
    });
    return { beforeTask, afterTask, stateSnapshot };
}
