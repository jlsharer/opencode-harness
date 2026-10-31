import assert from "node:assert/strict";
import test from "node:test";
import { TASK_MODES, taskContractShape, validateTaskPacket, validateTaskResult, } from "./task-contracts.js";
import { TASK_THREAD_ROLE_PACKET_FIELDS, createTaskThreadPolicy, formatTaskThreadEnvelope, formatTaskResultWrapper, } from "./task-thread-policy.js";
const context = {
    orchestrationId: "run",
    delegationTaskId: "task",
    scopeKey: "root",
    role: "implementer",
    taskMode: "implementation",
};
const output = {
    changedFiles: ["src/a.ts"],
    rationale: "requested change",
    schemaOrBoundaryChoices: "preserved",
    commandsRun: ["node --test"],
    handoffNotes: "independent validation required",
    traceArtifactPath: ".memory/result.md",
};
const success = () => ({
    ...context,
    version: 1,
    outcome: "success",
    summary: "Implemented",
    evidence: [{ reference: ".memory/test.log", command: "node --test", exitCode: 0 }],
    artifacts: [{ reference: ".memory/result.md", sha256: "a".repeat(64) }],
    outputContract: { ...output },
});
function packet(role, mode) {
    const values = {
        orchestrationId: "run",
        delegationTaskId: "task",
        scopeKey: "root",
        dispatchKind: "fresh",
        taskMode: mode,
        routingMetadataStatus: "absent",
        scopedQuestion: "Find evidence",
        freshnessRequirements: "current",
        downstreamNeeds: "planning",
        approvedGoal: "Fix behavior",
        approvedPlan: "Implement plan",
        acceptanceStandard: "all checks pass",
    };
    return Object.fromEntries(TASK_THREAD_ROLE_PACKET_FIELDS[role].required.map((k) => [
        k,
        values[k] ?? ["explicit requirement"],
    ]));
}
test("typed packets preserve every existing role and mode, rejecting null and wrong substantive types", () => {
    for (const role of Object.keys(TASK_MODES))
        for (const mode of TASK_MODES[role]) {
            const valid = packet(role, mode);
            assert.equal(validateTaskPacket(role, valid), valid);
            for (const field of TASK_THREAD_ROLE_PACKET_FIELDS[role].required) {
                for (const bad of [null, false, 42, {}, [], " "]) {
                    assert.throws(() => validateTaskPacket(role, { ...valid, [field]: bad }), /invalid/, role + "." + field);
                }
            }
            assert.throws(() => validateTaskPacket(role, { ...valid, unknown: "extra" }));
        }
});
test("references and prose are bounded and concrete", () => {
    const valid = packet("implementer", "integration");
    for (const targetPaths of [
        [""],
        [null],
        [{ path: "a" }],
        Array(33).fill("a"),
        ["a".repeat(2049)],
    ])
        assert.throws(() => validateTaskPacket("implementer", { ...valid, targetPaths }));
    assert.throws(() => validateTaskPacket("implementer", { ...valid, approvedPlan: "x".repeat(4097) }));
});
test("rendered packet types match validation for every role and optional field", () => {
    for (const role of Object.keys(TASK_MODES)) {
        const shape = taskContractShape(role);
        const values = Object.fromEntries(Object.entries({ ...shape.requiredPacket, ...shape.optionalPacket }).map(([field, type]) => [
            field,
            type === "string" ? "bounded prose" : ["bounded prose"],
        ]));
        Object.assign(values, {
            dispatchKind: "fresh",
            taskMode: TASK_MODES[role][0],
            routingMetadataStatus: "absent",
        });
        assert.equal(validateTaskPacket(role, values), values);
        assert.deepEqual(Object.keys(shape.requiredPacket), [
            ...TASK_THREAD_ROLE_PACKET_FIELDS[role].required,
        ]);
    }
    assert.equal(taskContractShape("researcher").requiredPacket.downstreamNeeds, "string");
    assert.throws(() => validateTaskPacket("researcher", {
        ...packet("researcher", "research"),
        downstreamNeeds: ["planning"],
    }), /downstreamNeeds.*expected nonempty string/);
});
test("path and summary reference items fail with indexed corrective diagnostics", () => {
    for (const label of ["evidence", "artifacts"]) {
        assert.throws(() => validateTaskResult({ ...success(), [label]: [{ path: "plan.md", summary: "read" }] }, context), new RegExp(label + "\\[0\\] fields path, summary; allowed: reference, sha256, command, exitCode"));
    }
    const valid = { ...success(), evidence: [{ reference: "research.md" }] };
    assert.equal(validateTaskResult(valid, context).outcome, "success");
});
test("success requires exact identity, meaningful role output, evidence and artifact linkage", () => {
    assert.equal(validateTaskResult(success(), context).outcome, "success");
    assert.equal(validateTaskResult(JSON.stringify(success()), context).outcome, "success");
    for (const key of ["orchestrationId", "delegationTaskId", "scopeKey", "role", "taskMode"])
        assert.throws(() => validateTaskResult({ ...success(), [key]: "other" }, context));
    for (const bad of [
        { evidence: [] },
        { artifacts: [] },
        { outputContract: null },
        { summary: "" },
        { outputContract: { ...output, commandsRun: null } },
        { outputContract: { ...output, traceArtifactPath: "different" } },
        { evidence: [{ reference: "log", command: "test" }] },
        { evidence: [{ reference: "log", exitCode: 0 }] },
        { artifacts: [{ reference: ".memory/result.md", sha256: "bad" }] },
        { extra: true },
    ])
        assert.throws(() => validateTaskResult({ ...success(), ...bad }, context));
});
test("non-success outcomes cannot masquerade as acceptance", () => {
    for (const outcome of ["blocked", "failed"]) {
        const result = {
            ...context,
            version: 1,
            outcome,
            summary: "Cannot finish",
            reason: "Required input absent",
            evidence: [],
            artifacts: [],
        };
        assert.equal(validateTaskResult(result, context).outcome, outcome);
        assert.throws(() => validateTaskResult({ ...result, reason: null }, context));
        assert.throws(() => validateTaskResult({ ...result, outputContract: output }, context));
    }
    const result = {
        ...context,
        version: 1,
        outcome: "clarification",
        summary: "Need choice",
        requestNonce: "nonce",
        question: "Which branch?",
        evidence: [],
        artifacts: [],
    };
    assert.equal(validateTaskResult(result, context).outcome, "clarification");
    assert.throws(() => validateTaskResult({ ...result, requestNonce: "" }, context));
});
test("policy rejects audit null regression before recording a task and terminal prose never accepts", () => {
    const policy = createTaskThreadPolicy();
    const args = (p) => ({
        subagent_type: "implementer",
        prompt: formatTaskThreadEnvelope({ kind: "fresh", version: 1, role: "implementer", packet: p }),
    });
    assert.throws(() => policy.beforeTask({
        sessionID: "p",
        callID: "c",
        args: args({ ...packet("implementer", "implementation"), approvedPlan: null }),
    }));
    assert.deepEqual(policy.stateSnapshot(), { calls: 0, tasks: 0, delegationIds: 0 });
    policy.beforeTask({
        sessionID: "p",
        callID: "c",
        args: args(packet("implementer", "implementation")),
    });
    assert.deepEqual(policy.afterTask({
        callID: "c",
        output: formatTaskResultWrapper("done", "child"),
        metadata: { sessionId: "child" },
    }), { outcome: "rejected" });
});
test("policy accepts structured terminal output and correlates structured clarification", () => {
    const policy = createTaskThreadPolicy();
    policy.beforeTask({
        sessionID: "p",
        callID: "c",
        args: {
            subagent_type: "implementer",
            prompt: formatTaskThreadEnvelope({
                kind: "fresh",
                version: 1,
                role: "implementer",
                packet: packet("implementer", "implementation"),
            }),
        },
    });
    assert.equal(policy.afterTask({
        callID: "c",
        output: formatTaskResultWrapper(JSON.stringify(success()), "child"),
        metadata: { sessionId: "child" },
    })?.outcome, "success");
    const second = createTaskThreadPolicy();
    second.beforeTask({
        sessionID: "p",
        callID: "c",
        args: {
            subagent_type: "implementer",
            prompt: formatTaskThreadEnvelope({
                kind: "fresh",
                version: 1,
                role: "implementer",
                packet: packet("implementer", "implementation"),
            }),
        },
    });
    const clarification = {
        ...context,
        version: 1,
        outcome: "clarification",
        summary: "Need choice",
        requestNonce: "nonce",
        question: "Which branch?",
        evidence: [],
        artifacts: [],
    };
    assert.equal(second.afterTask({
        callID: "c",
        output: formatTaskResultWrapper(JSON.stringify(clarification), "child"),
        metadata: { sessionId: "child" },
    })?.outcome, "clarification");
    assert.throws(() => second.beforeTask({
        sessionID: "p",
        callID: "reply",
        args: {
            subagent_type: "implementer",
            task_id: "child",
            prompt: formatTaskThreadEnvelope({
                version: 1,
                kind: "clarification-response",
                delegationTaskId: "task",
                requestNonce: "stale",
                answer: "main",
            }),
        },
    }));
});
