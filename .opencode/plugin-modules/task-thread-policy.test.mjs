import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { HarnessLifecyclePlugin } from "./harness-lifecycle.js";
import { TASK_THREAD_ROLE_PACKET_FIELDS, createTaskThreadPolicy, formatTaskResultWrapper, formatTaskThreadEnvelope, } from "./task-thread-policy.js";
// Explicit test-only dependency injection. Production plugin composition never
// supplies this factory and always uses the managed workflow/proof adapter.
const standalonePolicyFactory = ({ telemetry }) => {
    const policy = createTaskThreadPolicy({ telemetry: (event) => telemetry?.({ ...event }) });
    return {
        beforeTask: async (input, args) => policy.beforeTask({ sessionID: input.sessionID, callID: input.callID, args }),
        beforeTool: (_input, args) => args,
        afterTool: () => { },
        afterTask: (input, output) => policy.afterTask({ callID: input.callID, output: output.output, metadata: output.metadata }),
        sessionCreated: () => { },
        interrupt: () => { },
    };
};
const offlineTool = Object.assign((definition) => definition, {
    schema: { string: () => ({}) },
});
const roleValues = {
    researcher: ["question", ["sources"], "current", "plan"],
    planner: ["goal", ["scope"], ["research"], ["paths"], ["criteria"]],
    implementer: ["plan", ["paths"], ["scope"], ["schema"], ["preserve"], ["test"]],
    validator: [["files"], ["criteria"], ["commands"], ["schemas"], "pass"],
};
const taskModes = {
    researcher: "research",
    planner: "plan",
    implementer: "implementation",
    validator: "validation",
};
function packet(role = "implementer", overrides = {}) {
    const common = {
        orchestrationId: "2026-08-04-test",
        delegationTaskId: "task-1",
        scopeKey: "root",
        dispatchKind: "fresh",
        taskMode: taskModes[role],
        routingMetadataStatus: "absent",
    };
    const fields = TASK_THREAD_ROLE_PACKET_FIELDS[role].required.filter((field) => !Object.hasOwn(common, field));
    return {
        ...common,
        ...Object.fromEntries(fields.map((field, index) => [field, roleValues[role][index]])),
        ...overrides,
    };
}
const fresh = (role = "implementer", overrides = {}) => formatTaskThreadEnvelope({ kind: "fresh", version: 1, role, packet: packet(role, overrides) });
const request = (overrides = {}) => formatTaskThreadEnvelope({
    kind: "clarification-request",
    version: 1,
    delegationTaskId: "task-1",
    requestNonce: "nonce-1",
    question: "Which documented choice applies?",
    ...overrides,
});
const response = (overrides = {}) => formatTaskThreadEnvelope({
    kind: "clarification-response",
    version: 1,
    delegationTaskId: "task-1",
    requestNonce: "nonce-1",
    answer: "Use the approved first choice.",
    ...overrides,
});
const wrapped = (text, child = "child-1") => formatTaskResultWrapper(text, child);
const freshArgs = (overrides = {}) => ({
    description: "one scope",
    subagent_type: "implementer",
    prompt: fresh(),
    ...overrides,
});
function authorize(policy, { parent = "parent-1", child = "child-1", call = "call-1" } = {}) {
    policy.beforeTask({ sessionID: parent, callID: call, args: freshArgs() });
    policy.afterTask({
        callID: call,
        output: wrapped(request(), child),
        metadata: { sessionId: child },
    });
}
test("fresh packets exactly carry every role input contract", () => {
    for (const role of Object.keys(TASK_THREAD_ROLE_PACKET_FIELDS)) {
        const policy = createTaskThreadPolicy();
        policy.beforeTask({
            sessionID: "parent",
            callID: role,
            args: { subagent_type: role, prompt: fresh(role) },
        });
    }
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "missing",
        args: freshArgs({ prompt: fresh("implementer", { orchestrationId: undefined }) }),
    }), /role packet|invalid orchestrationId/);
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "extra",
        args: freshArgs({ prompt: fresh("implementer", { ambiguousExtra: "no" }) }),
    }), /role packet/);
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "routing",
        args: freshArgs({ prompt: fresh("implementer", { routingMetadataStatus: "invented" }) }),
    }), /routingMetadataStatus/);
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "mode",
        args: freshArgs({ prompt: fresh("implementer", { taskMode: "review" }) }),
    }), /taskMode/);
    createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "external-roots",
        args: freshArgs({
            prompt: fresh("implementer", {
                workspaceRoot: "/workspace",
                runtimeRoot: "/runtime",
                traceRoot: "/trace",
            }),
        }),
    });
});
test("fresh dispatch requires a valid envelope and omission of task_id", () => {
    const policy = createTaskThreadPolicy();
    policy.beforeTask({ sessionID: "parent-1", callID: "call-1", args: freshArgs() });
    assert.throws(() => policy.beforeTask({
        sessionID: "parent-1",
        callID: "call-2",
        args: freshArgs({ task_id: null }),
    }), /invalid task_id/);
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "p",
        callID: "c",
        args: freshArgs({ prompt: "plain prompt" }),
    }), /malformed policy envelope/);
});
test("only one exact completed Task wrapper authorizes clarification", () => {
    for (const output of [
        request(),
        `incidental ${wrapped(request())}`,
        `${wrapped(request())}\n${wrapped(request())}`,
        `<task id="child-1" state="completed"><task_result>${request()}</task_result></task>`,
        formatTaskResultWrapper(request(), "wrong-child"),
        formatTaskResultWrapper(request(), "child-1", "running"),
    ]) {
        const policy = createTaskThreadPolicy();
        policy.beforeTask({ sessionID: "parent-1", callID: "call-1", args: freshArgs() });
        policy.afterTask({ callID: "call-1", output, metadata: { sessionId: "child-1" } });
        assert.throws(() => policy.beforeTask({
            sessionID: "parent-1",
            callID: "next",
            args: { subagent_type: "implementer", prompt: response(), task_id: "child-1" },
        }), /not authorized/);
    }
    const policy = createTaskThreadPolicy();
    authorize(policy);
    policy.beforeTask({
        sessionID: "parent-1",
        callID: "next",
        args: { subagent_type: "implementer", prompt: response(), task_id: "child-1" },
    });
});
test("invalid wrapper versus invalid structured result reports fixed redacted categories", () => {
    for (const [output, reason] of [
        ["private-output-sentinel", "invalid-native-wrapper"],
        [wrapped("private-output-sentinel"), "invalid-structured-result"],
    ]) {
        const events = [];
        const policy = createTaskThreadPolicy({ telemetry: (event) => events.push(event) });
        policy.beforeTask({ sessionID: "parent-1", callID: "call-1", args: freshArgs() });
        assert.deepEqual(policy.afterTask({
            callID: "call-1",
            output,
            metadata: { sessionId: "child-1" },
        }), { outcome: "rejected" });
        assert.deepEqual(policy.stateSnapshot(), { calls: 0, tasks: 0, delegationIds: 1 });
        assert.deepEqual(events.at(-1), {
            event: "terminal",
            delegationTaskId: "task-1",
            scopeKey: "root",
            reason,
        });
        assert.doesNotMatch(JSON.stringify(events), /private-output-sentinel|child-1|parent-1|nonce-1/);
    }
});
test("ordinary results, restart, and unauthorized reuse fail closed", () => {
    const policy = createTaskThreadPolicy();
    policy.beforeTask({ sessionID: "parent-1", callID: "call-1", args: freshArgs() });
    policy.afterTask({
        callID: "call-1",
        output: wrapped("completed"),
        metadata: { sessionId: "child-1" },
    });
    assert.throws(() => policy.beforeTask({
        sessionID: "parent-1",
        callID: "call-2",
        args: { subagent_type: "implementer", prompt: response(), task_id: "child-1" },
    }), /not authorized/);
    assert.throws(() => createTaskThreadPolicy().beforeTask({
        sessionID: "parent-1",
        callID: "call-3",
        args: { subagent_type: "implementer", prompt: response(), task_id: "child-1" },
    }), /not authorized/);
});
test("one matching response is atomic and old nonces cannot return in later turns", () => {
    const policy = createTaskThreadPolicy();
    authorize(policy);
    const args = { subagent_type: "implementer", prompt: response(), task_id: "child-1" };
    policy.beforeTask({ sessionID: "parent-1", callID: "call-2", args });
    assert.throws(() => policy.beforeTask({ sessionID: "parent-1", callID: "call-3", args }), /not authorized/);
    policy.afterTask({
        callID: "call-2",
        output: wrapped(request({ requestNonce: "nonce-2" })),
        metadata: { sessionId: "child-1" },
    });
    policy.beforeTask({
        sessionID: "parent-1",
        callID: "call-4",
        args: { ...args, prompt: response({ requestNonce: "nonce-2" }) },
    });
    policy.afterTask({
        callID: "call-4",
        output: wrapped(request({ requestNonce: "nonce-1" })),
        metadata: { sessionId: "child-1" },
    });
    assert.throws(() => policy.beforeTask({ sessionID: "parent-1", callID: "replay", args }), /not authorized/);
});
test("wrong parent, child, role, task, and nonce cannot use authorization", () => {
    for (const mutate of [
        (entry) => {
            entry.sessionID = "wrong-parent";
        },
        (entry) => {
            entry.args.task_id = "wrong-child";
        },
        (entry) => {
            entry.args.subagent_type = "validator";
        },
        (entry) => {
            entry.args.prompt = response({ delegationTaskId: "wrong-task" });
        },
        (entry) => {
            entry.args.prompt = response({ requestNonce: "wrong-nonce" });
        },
    ]) {
        const policy = createTaskThreadPolicy();
        authorize(policy);
        const entry = {
            sessionID: "parent-1",
            callID: "next",
            args: { subagent_type: "implementer", prompt: response(), task_id: "child-1" },
        };
        mutate(entry);
        assert.throws(() => policy.beforeTask(entry));
    }
});
test("changed task contract fields are never continuation envelopes", () => {
    const policy = createTaskThreadPolicy();
    authorize(policy);
    for (const extra of [
        "scopeKey",
        "role",
        "targetPaths",
        "approvedPlan",
        "remediation",
        "retry",
        "followUp",
    ]) {
        const parsed = {
            kind: "clarification-response",
            version: 1,
            delegationTaskId: "task-1",
            requestNonce: "nonce-1",
            answer: "answer",
            [extra]: "changed",
        };
        assert.throws(() => policy.beforeTask({
            sessionID: "parent-1",
            callID: `call-${extra}`,
            args: {
                subagent_type: "implementer",
                task_id: "child-1",
                prompt: formatTaskThreadEnvelope(parsed),
            },
        }), /unexpected/);
    }
});
test("state is bounded, terminal tasks are evicted, and missing after hooks fail closed at the cap", () => {
    const policy = createTaskThreadPolicy({
        limits: { calls: 2, tasks: 2, delegationIds: 3, noncesPerTask: 2 },
    });
    policy.beforeTask({ sessionID: "p", callID: "one", args: freshArgs() });
    policy.afterTask({ callID: "one", output: wrapped("done"), metadata: { sessionId: "child-1" } });
    assert.deepEqual(policy.stateSnapshot(), { calls: 0, tasks: 0, delegationIds: 1 });
    policy.beforeTask({
        sessionID: "p",
        callID: "two",
        args: freshArgs({ prompt: fresh("implementer", { delegationTaskId: "task-2" }) }),
    });
    policy.beforeTask({
        sessionID: "p",
        callID: "three",
        args: freshArgs({ prompt: fresh("implementer", { delegationTaskId: "task-3" }) }),
    });
    assert.throws(() => policy.beforeTask({
        sessionID: "p",
        callID: "four",
        args: freshArgs({ prompt: fresh("implementer", { delegationTaskId: "task-4" }) }),
    }), /in-flight Task limit/);
    assert.deepEqual(policy.stateSnapshot(), { calls: 2, tasks: 0, delegationIds: 3 });
});
test("malformed, extra-field, deeply nested, and oversized envelopes reject without raw telemetry", () => {
    const events = [];
    const policy = createTaskThreadPolicy({
        telemetry: (event) => events.push(JSON.stringify(event)),
    });
    assert.throws(() => policy.beforeTask({
        sessionID: "p",
        callID: "bad",
        args: freshArgs({ prompt: fresh("implementer", { secret: "raw-secret" }) }),
    }), /role packet/);
    assert.throws(() => policy.beforeTask({
        sessionID: "p",
        callID: "large",
        args: freshArgs({ prompt: "x".repeat(17000) }),
    }), /oversized/);
    let nested = "value";
    for (let index = 0; index < 10; index++)
        nested = { nested };
    assert.throws(() => policy.beforeTask({
        sessionID: "p",
        callID: "deep",
        args: freshArgs({ prompt: fresh("implementer", { approvedPlan: nested }) }),
    }), /oversized/);
    policy.beforeTask({
        sessionID: "parent",
        callID: "ok",
        args: freshArgs({
            prompt: fresh("implementer", { approvedPlan: "raw-goal", targetPaths: ["private/raw-path"] }),
        }),
    });
    policy.afterTask({
        callID: "ok",
        output: wrapped("raw-output", "child"),
        metadata: { sessionId: "child" },
    });
    assert.doesNotMatch(events.join("\n"), /raw-goal|raw-path|raw-output|raw-secret/);
});
test("lifecycle adapter guards Task and blocks direct role commands", async () => {
    const methods = ["error", "log", "warn", "info"];
    const originals = {
        error: console.error,
        log: console.log,
        warn: console.warn,
        info: console.info,
    };
    const consoleCalls = [];
    for (const method of methods)
        console[method] = (...parts) => consoleCalls.push([method, ...parts]);
    const records = [];
    const tuiCalls = [];
    try {
        const hooks = await HarnessLifecyclePlugin({
            client: {
                app: {
                    log: (record) => {
                        records.push(record);
                        return Promise.resolve();
                    },
                },
                tui: {
                    appendPrompt: () => {
                        tuiCalls.push("appendPrompt");
                        throw new Error("TUI must not be called");
                    },
                    showToast: () => {
                        tuiCalls.push("showToast");
                        throw new Error("TUI must not be called");
                    },
                },
            },
        }, standalonePolicyFactory);
        await hooks.event({ event: { type: "session.created" } });
        await hooks["tool.execute.before"]({ tool: "task", sessionID: "parent", callID: "call" }, { args: freshArgs() });
        await hooks["tool.execute.after"]({ tool: "task", sessionID: "parent", callID: "call" }, { output: wrapped("raw-output-secret", "child"), metadata: { sessionId: "child" } });
        await hooks["tool.execute.before"]({ tool: "bash" }, { args: { command: "/delegate-orchestration raw-command-secret" } });
        await assert.rejects(() => hooks["command.execute.before"]({ command: "delegate-implement" }), /not a managed dispatch surface/);
        await assert.rejects(() => hooks["tool.execute.before"]({ tool: "bash", args: { command: "safe" } }, { args: { command: "rm -rf .memory" } }), /destructive deletion/);
        assert.deepEqual(consoleCalls, []);
        assert.deepEqual(tuiCalls, []);
        assert.deepEqual(records, [
            {
                body: {
                    service: "opencode-harness",
                    level: "debug",
                    message: "OpenCode harness loaded.",
                    extra: { event: "session-created" },
                },
            },
            {
                body: {
                    service: "opencode-harness",
                    level: "debug",
                    message: "Harness task state changed.",
                    extra: { event: "fresh-in-flight", delegationTaskId: "task-1", scopeKey: "root" },
                },
            },
            {
                body: {
                    service: "opencode-harness",
                    level: "debug",
                    message: "Harness task state changed.",
                    extra: {
                        event: "terminal",
                        delegationTaskId: "task-1",
                        scopeKey: "root",
                        reason: "invalid-structured-result",
                    },
                },
            },
            {
                body: {
                    service: "opencode-harness",
                    level: "debug",
                    message: "Delegation command observed.",
                    extra: { event: "delegation-command-observed" },
                },
            },
        ]);
        assert.doesNotMatch(JSON.stringify(records), /raw-output-secret|raw-command-secret|HARNESS_TASK_THREAD_POLICY/);
    }
    finally {
        for (const method of methods)
            console[method] = originals[method];
    }
});
test("lifecycle diagnostics contain logger failures without fallback or policy changes", async () => {
    const methods = ["error", "log", "warn", "info"];
    const originals = {
        error: console.error,
        log: console.log,
        warn: console.warn,
        info: console.info,
    };
    const consoleCalls = [];
    for (const method of methods)
        console[method] = (...parts) => consoleCalls.push([method, ...parts]);
    const tuiCalls = [];
    let logCalls = 0;
    try {
        const hooks = await HarnessLifecyclePlugin({
            client: {
                app: {
                    log: () => {
                        if (++logCalls === 1)
                            throw new Error("logger threw");
                        return Promise.reject(new Error("logger rejected"));
                    },
                },
                tui: {
                    appendPrompt: () => {
                        tuiCalls.push("appendPrompt");
                        throw new Error("TUI must not be called");
                    },
                    showToast: () => {
                        tuiCalls.push("showToast");
                        throw new Error("TUI must not be called");
                    },
                },
            },
        }, standalonePolicyFactory);
        await hooks.event({ event: { type: "session.created" } });
        await hooks["tool.execute.before"]({ tool: "task", sessionID: "parent", callID: "call" }, { args: freshArgs() });
        await hooks["tool.execute.after"]({ tool: "task", callID: "call" }, { output: wrapped("done", "child"), metadata: { sessionId: "child" } });
        await hooks["tool.execute.before"]({ tool: "bash" }, { args: { command: "/delegate-orchestration safe" } });
        await new Promise((resolve) => setImmediate(resolve));
        await assert.rejects(() => hooks["tool.execute.before"]({ tool: "task", sessionID: "parent", callID: "invalid" }, { args: freshArgs({ task_id: null }) }), /invalid task_id/);
        assert.equal(logCalls, 4);
        assert.deepEqual(consoleCalls, []);
        assert.deepEqual(tuiCalls, []);
    }
    finally {
        for (const method of methods)
            console[method] = originals[method];
    }
});
test("compaction preserves native context and generic durable pointers", async () => {
    const hooks = await HarnessLifecyclePlugin({ directory: "/fixture", toolFactory: offlineTool }, standalonePolicyFactory);
    const output = { context: ["native context"] };
    await hooks["experimental.session.compacting"]({ sessionID: "parent" }, output);
    assert.equal(output.context[0], "native context");
    assert.match(output.context[1], /delegation-orchestrator\/SKILL\.md/);
    assert.match(output.context[1], /dispatch-started\.json/);
    assert.match(output.context[1], /fresh reviewed orchestration ID/);
    assert.doesNotMatch(output.context[1], /Project Open Court|PROJECT_PROGRESS\.md/);
    await assert.rejects(() => hooks["experimental.session.compacting"]({ sessionID: "parent" }, {}), /context unavailable/);
    assert.ok(hooks.tool.harness_trace);
    assert.ok(hooks.tool.harness_source_edit);
    assert.ok(hooks.tool.harness_source_replace);
    assert.ok(hooks.tool.harness_recovery_status);
    assert.ok(hooks.tool.harness_recovery_resolve);
    assert.ok(hooks.tool.harness_recovery_release);
    assert.ok(hooks.tool.harness_verify);
});
test("compaction adds one bounded advisory only for the live session-bound view", async () => {
    const valid = {
        orchestrationId: "2026-10-23-fixture",
        scopeKey: "work-unit",
        delegationTaskId: "task-1",
        role: "implementer",
        taskMode: "implementation",
        goal: 'Review "quoted" goal, not instructions',
    };
    let current = valid;
    const queries = [];
    const boundFactory = (options) => ({
        ...standalonePolicyFactory(options),
        currentTaskView: (session) => {
            queries.push(session);
            return session === "parent" || session === "child" ? current : null;
        },
    });
    const hooks = await HarnessLifecyclePlugin({}, boundFactory);
    const compact = async (sessionID) => {
        const output = { context: ["native context"] };
        await hooks["experimental.session.compacting"]({ sessionID }, output);
        assert.equal(output.context[0], "native context");
        assert.match(output.context[1], /dispatch-started\.json/);
        return output.context;
    };
    for (const session of ["parent", "child"]) {
        const context = await compact(session);
        assert.equal(context.length, 3);
        assert.match(context[2], /2026-10-23-fixture\/work-unit\/task-1 \(implementer\/implementation\)/);
        assert.ok(context[2].includes(JSON.stringify(valid.goal)));
        assert.match(context[2], /not authorization or a checkpoint/);
        assert.ok(context[2].length <= 900);
    }
    assert.equal((await compact("unrelated")).length, 2);
    assert.equal((await compact(undefined)).length, 2);
    assert.deepEqual(queries, ["parent", "child", "unrelated"]);
    current = null; // An expired or terminal adapter view is null.
    assert.equal((await compact("parent")).length, 2);
    for (const malformed of [
        { ...valid, goal: "x".repeat(241) },
        { ...valid, goal: "bad\ncontrol" },
        { ...valid, role: "constructor" },
        { ...valid, taskMode: "review" },
        { ...valid, scopeKey: "invalid/path" },
        { ...valid, goal: { secret: "raw-packet-secret" } },
    ]) {
        current = malformed;
        assert.equal((await compact("child")).length, 2);
    }
    current = { ...valid, packet: "raw-packet-secret", reference: "private-reference-secret" };
    const context = await compact("parent");
    assert.equal(context.length, 3);
    assert.doesNotMatch(context.join(" "), /raw-packet-secret|private-reference-secret/);
});
test("bound V1 parent compaction quotes reviewed handoff without copying another session", async () => {
    const trace = fs.mkdtempSync(path.join(os.tmpdir(), "harness-v1-handoff-"));
    const id = "2026-10-25-reviewed-context";
    const directory = path.join(trace, "orchestrations", id);
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(directory, "COMPACTION_HANDOFF.md"), `# Compaction handoff: ${id}

## Initial user request
Keep the court ball physical.

## Current goal and success criteria
Measure first contact and verify observed displacement.

## User decisions and constraints
No Git mutation; one diagnostic round only.

## Architectural invariants
State drives animation, not vice versa.

## Context and evidence
Fixture passes; live PIE remains unknown.

## Instructions and protocol
Read project instructions, progress and delegation-orchestrator/SKILL.md.

## Observed state and next safe action
Reconcile tree and run an independent validator.
`, { mode: 0o600 });
    const previous = process.env.OPENCODE_HARNESS_TRACE_ROOT;
    process.env.OPENCODE_HARNESS_TRACE_ROOT = trace;
    try {
        const factory = (options) => ({
            ...standalonePolicyFactory(options),
            compactionPointer: (session) => (session === "bound-parent" ? { orchestrationId: id } : null),
        });
        const hooks = await HarnessLifecyclePlugin({}, factory);
        const bound = { context: ["native context"] };
        await hooks["experimental.session.compacting"]({ sessionID: "bound-parent" }, bound);
        assert.equal(bound.context.length, 3);
        assert.match(bound.context[2], /Keep the court ball physical/);
        assert.match(bound.context[2], /No Git mutation/);
        assert.match(bound.context[2], /State drives animation/);
        assert.match(bound.context[2], /live PIE remains unknown/);
        assert.match(bound.context[2], /not a new permission or instruction source/);
        const unrelated = { context: ["native context"] };
        await hooks["experimental.session.compacting"]({ sessionID: "other" }, unrelated);
        assert.equal(unrelated.context.length, 2);
    }
    finally {
        if (previous === undefined)
            delete process.env.OPENCODE_HARNESS_TRACE_ROOT;
        else
            process.env.OPENCODE_HARNESS_TRACE_ROOT = previous;
        fs.rmSync(trace, { recursive: true, force: true });
    }
});
test("active plugin registers SDK-backed tools when the SDK is installed", async (t) => {
    try {
        import.meta.resolve("@opencode-ai/plugin");
    }
    catch {
        t.skip("portable offline installation does not include the SDK");
        return;
    }
    const hooks = await HarnessLifecyclePlugin({ directory: process.cwd() });
    assert.equal(typeof hooks.tool.harness_verify, "object");
    assert.equal(typeof hooks.tool.harness_trace, "object");
    assert.equal(typeof hooks.tool.harness_source_edit, "object");
    assert.equal(typeof hooks.tool.harness_source_replace, "object");
    assert.equal(typeof hooks.tool.harness_recovery_status, "object");
    assert.equal(typeof hooks.tool.harness_recovery_resolve, "object");
    assert.equal(typeof hooks.tool.harness_recovery_release, "object");
});
test("idle completed parent requests native compaction once from reported input evidence", async () => {
    let summarize = 0;
    const state = { stopped: false, background: null, runs: [] };
    const info = {
        id: "turn",
        parentID: "user",
        sessionID: "primary",
        role: "assistant",
        providerID: "provider",
        modelID: "model",
        time: { created: 102, completed: 103 },
        tokens: { input: 1, cache: { read: 59, write: 0 } },
    };
    const hooks = await HarnessLifecyclePlugin({
        directory: "/fixture",
        client: {
            app: { log: () => { } },
            session: {
                get: async () => ({ data: { id: "primary", time: { compacting: 100 } } }),
                status: async () => ({ data: { primary: { type: "idle" } } }),
                messages: async () => ({
                    data: [
                        {
                            info: {
                                id: "user",
                                sessionID: "primary",
                                role: "user",
                                time: { created: 101 },
                                model: { providerID: "provider", modelID: "model" },
                            },
                        },
                        { info },
                    ],
                }),
                summarize: async () => {
                    summarize++;
                    return { data: true };
                },
            },
            provider: {
                list: async () => ({
                    data: {
                        all: [
                            { id: "provider", models: { model: { id: "model", limit: { context: 100 } } } },
                        ],
                    },
                }),
            },
        },
    }, (options) => ({ ...standalonePolicyFactory(options), snapshot: () => state }));
    const event = { event: { type: "session.idle", properties: { sessionID: "primary" } } };
    await hooks.event(event);
    await hooks.event(event);
    assert.equal(summarize, 1);
});
test("lifecycle forwards managed hook boundaries and relevant session interruption", async () => {
    const observed = [];
    const hooks = await HarnessLifecyclePlugin({}, (options) => ({
        ...standalonePolicyFactory(options),
        beforeTask: async () => {
            observed.push("task-before");
        },
        beforeTool: (_input, args) => {
            observed.push("tool-before");
            return { ...args, restricted: true };
        },
        afterTool: () => {
            observed.push("tool-after");
        },
        afterTask: () => {
            observed.push("task-after");
            return { outcome: "rejected" };
        },
        sessionCreated: (info) => {
            observed.push("created:" + String(info.id));
        },
        interrupt: (reason) => {
            observed.push(reason);
        },
    }));
    await hooks["tool.execute.before"]({ tool: "task", sessionID: "parent", callID: "call" }, { args: freshArgs() });
    await hooks.event({
        event: { type: "session.created", properties: { info: { id: "child", parentID: "parent" } } },
    });
    const toolOutput = { args: { command: "safe" } };
    await hooks["tool.execute.before"]({ tool: "bash", sessionID: "child", callID: "tool" }, toolOutput);
    assert.equal(toolOutput.args.restricted, true);
    await hooks["tool.execute.after"]({ tool: "bash", sessionID: "child", callID: "tool" }, { metadata: { exit: 0 } });
    await hooks["tool.execute.after"]({ tool: "task", sessionID: "parent", callID: "call" }, {});
    await hooks.event({ event: { type: "session.error", properties: { sessionID: "unrelated" } } });
    assert.equal(observed.includes("managed session error"), false);
    await hooks.event({ event: { type: "session.error", properties: { sessionID: "child" } } });
    await hooks.event({ event: { type: "session.deleted", properties: { info: { id: "parent" } } } });
    assert.deepEqual(observed, [
        "task-before",
        "created:child",
        "tool-before",
        "tool-after",
        "task-after",
        "managed session error",
        "managed session deleted",
    ]);
});
test("managed lifecycle refuses a different native project directory", async () => {
    const original = process.env.OPENCODE_HARNESS_WORKSPACE_ROOT;
    process.env.OPENCODE_HARNESS_WORKSPACE_ROOT = "/fixture/expected";
    try {
        const mismatch = await HarnessLifecyclePlugin({ directory: "/fixture/other" }, standalonePolicyFactory);
        await assert.rejects(() => mismatch.config({}), /managed workspace mismatch/);
        const matching = await HarnessLifecyclePlugin({ directory: "/fixture/expected" }, standalonePolicyFactory);
        await matching.config({});
    }
    finally {
        if (original === undefined)
            delete process.env.OPENCODE_HARNESS_WORKSPACE_ROOT;
        else
            process.env.OPENCODE_HARNESS_WORKSPACE_ROOT = original;
    }
});
