var __rewriteRelativeImportExtension = (this && this.__rewriteRelativeImportExtension) || function (path, preserveJsx) {
    if (typeof path === "string" && /^\.\.?\//.test(path)) {
        return path.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+?)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
            return tsx ? preserveJsx ? ".jsx" : ".js" : d && (!ext || !cm) ? m : (d + ext + "." + cm.toLowerCase() + "js");
        });
    }
    return path;
};
import path from "node:path";
import { createManagedDispatch, parseDelegationPolicy } from "./managed-dispatch.js";
import { managedCompactionSafe, reportedInputCompactionDecision } from "./context-budget.js";
const COMPACTION_HANDOFF = [
    "Harness compaction handoff: preserve the user's current goal, observed results versus unknowns, blocker, permissions, and exact next action.",
    "Retain known orchestrationId, scopeKey, delegationTaskId, role/mode, outcome, and validator gates; never infer child success from a running or missing result.",
    "Keep pointers to the active orchestration INDEX.md, immutable normalized-spec.json, " +
        "dispatch-started.json, role traces and validator evidence under the configured trace root; " +
        "these are evidence, not a resumable Task checkpoint.",
    "For managed delegation the parent reloads delegation-orchestrator/SKILL.md as sole protocol " +
        "and the immutable memory-management protocol; leaves follow their exact role packets and " +
        "must not load the parent skill.",
    "After compaction reconcile actual workspace Git HEAD/index/status, files, marker, child " +
        "state and gate evidence before dispatch. Interrupted or already-started uncertain work " +
        "requires a fresh reviewed orchestration ID, never replay of a previous child thread.",
].join(" ");
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
// This is an advisory compaction reminder, never a resumed Task or authorization.
function taskCompactionHint(value) {
    if (!isRecord(value))
        return null;
    const { orchestrationId, scopeKey, delegationTaskId, role, taskMode, goal } = value;
    const validId = (field) => typeof field === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(field);
    const modes = {
        researcher: ["research"],
        planner: ["plan", "synthesis"],
        implementer: ["implementation", "integration"],
        validator: ["validation", "review", "artifact-proof", "integration-check"],
    };
    if (!validId(orchestrationId) ||
        !validId(scopeKey) ||
        !validId(delegationTaskId) ||
        typeof role !== "string" ||
        !Object.hasOwn(modes, role) ||
        typeof taskMode !== "string" ||
        !modes[role].includes(taskMode) ||
        typeof goal !== "string" ||
        !goal.length ||
        goal.length > 240 ||
        /[\u0000-\u001f\u007f-\u009f]/.test(goal))
        return null;
    const hint = `Harness advisory: live session-bound task ${orchestrationId}/${scopeKey}/${delegationTaskId} (${role}/${taskMode}); ` +
        `approved work-unit goal (quoted data): ${JSON.stringify(goal)}. ` +
        "Continuity is not authorization or a checkpoint; reconcile state and gates before acting.";
    return hint.length <= 900 ? hint : null;
}
export const HarnessLifecyclePlugin = async (context = {}, dispatchFactory = createManagedDispatch) => {
    const { client } = context;
    function logDiagnostic(message, extra) {
        try {
            Promise.resolve(client.app.log({ body: { service: "opencode-harness", level: "debug", message, extra } })).catch(() => { });
        }
        catch { }
    }
    const workspaceRoot = process.env.OPENCODE_HARNESS_WORKSPACE_ROOT || context.directory || "";
    // A prepared runtime is importable without installed dependencies. Active OpenCode sessions
    // have a workspace and require the plugin SDK before exposing managed tools.
    const sdkName = "@opencode-ai/" + "plugin";
    const toolApi = context.toolFactory ??
        (workspaceRoot && dispatchFactory === createManagedDispatch
            ? (await import(__rewriteRelativeImportExtension(sdkName))).tool
            : undefined);
    if (workspaceRoot &&
        dispatchFactory === createManagedDispatch &&
        (typeof toolApi !== "function" || typeof toolApi.schema?.string !== "function"))
        throw new Error("OpenCode plugin tool API unavailable");
    const traceRoot = process.env.OPENCODE_HARNESS_TRACE_ROOT ||
        (workspaceRoot ? path.join(workspaceRoot, ".memory") : "");
    function assertWorkspaceIdentity() {
        if (process.env.OPENCODE_HARNESS_WORKSPACE_ROOT && context.directory !== workspaceRoot)
            throw new Error("managed workspace mismatch; open the correct project harness instance");
    }
    const managedSessions = new Set();
    const compactionAttempts = new Set();
    const compactionInFlight = new Set();
    let nativeConfig = {};
    const delegationValue = context.delegationPolicy ?? process.env.OPENCODE_HARNESS_DELEGATION;
    if (typeof delegationValue === "string" && delegationValue.length > 8192)
        throw new Error("delegation policy exceeds bound");
    const delegation = parseDelegationPolicy(delegationValue);
    const nativeSession = isRecord(client?.session) ? client.session : {};
    const capable = ["messages", "get", "status", "abort"].every((name) => typeof nativeSession[name] === "function");
    async function sessionCall(name, child) {
        const method = nativeSession[name];
        if (typeof method !== "function")
            throw new Error(`native session.${name} capability unavailable`);
        const response = await method.call(nativeSession, child ? { path: { id: child }, query: { limit: 256 } } : {});
        if (!isRecord(response) || response.error || response.data === undefined)
            throw new Error(`native session.${name} failed`);
        return response.data;
    }
    async function messages(child) {
        const data = await sessionCall("messages", child);
        if (!Array.isArray(data) || data.length > 256)
            throw new Error("native message list unavailable or oversized");
        return data;
    }
    const transport = {
        enabled: capable && process.env.OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS === "true",
        models: async (parent, role) => {
            const list = await messages(parent);
            const assistant = list
                .filter(isRecord)
                .findLast((m) => isRecord(m.info) && m.info.role === "assistant");
            const info = isRecord(assistant?.info) ? assistant.info : {};
            if (typeof info.providerID !== "string" || typeof info.modelID !== "string")
                throw new Error("actual parent model identity unavailable");
            const parentModel = info.providerID + "/" + info.modelID;
            const agents = isRecord(nativeConfig.agent) ? nativeConfig.agent : {};
            const agent = isRecord(agents[role]) ? agents[role] : {};
            return {
                parent: parentModel,
                worker: typeof agent.model === "string" ? agent.model : parentModel,
            };
        },
        inspect: async (child) => {
            const session = await sessionCall("get", child);
            const status = await sessionCall("status");
            if (!isRecord(session) ||
                session.id !== child ||
                typeof session.parentID !== "string" ||
                !isRecord(status))
                throw new Error("native session identity/status unavailable");
            const current = status[child];
            const idle = current === undefined || (isRecord(current) && current.type === "idle");
            return { parent: session.parentID, idle, messages: await messages(child) };
        },
        abort: async (child) => {
            if ((await sessionCall("abort", child)) !== true)
                throw new Error("native abort acknowledgement unavailable");
        },
    };
    const dispatch = dispatchFactory({
        workspaceRoot,
        traceRoot,
        telemetry: (event) => logDiagnostic("Harness task state changed.", event),
        delegation,
        backgroundTransport: transport,
    });
    function noManagedWork() {
        return typeof dispatch.snapshot === "function" && managedCompactionSafe(dispatch.snapshot());
    }
    async function considerCompaction(id, idleEvent) {
        if (compactionInFlight.has(id) || !noManagedWork())
            return;
        compactionInFlight.add(id);
        try {
            const provider = isRecord(client?.provider) ? client.provider : {};
            if (!["get", "status", "messages", "summarize"].every((name) => typeof nativeSession[name] === "function") ||
                typeof provider.list !== "function")
                return;
            const session = await sessionCall("get", id);
            const status = await sessionCall("status");
            const list = await messages(id);
            const response = await provider.list();
            if (!isRecord(response) || response.error || !isRecord(response.data))
                return;
            const evidence = {
                session,
                status,
                messages: list,
                idleEvent,
                providers: response.data,
                managed: dispatch.snapshot?.(),
            };
            const decision = reportedInputCompactionDecision(evidence);
            if (decision.status !== "request-eligible" || !noManagedWork())
                return;
            const key = id + "\0" + decision.messageID;
            if (compactionAttempts.has(key))
                return;
            const fresh = reportedInputCompactionDecision({
                ...evidence,
                session: await sessionCall("get", id),
                status: await sessionCall("status"),
                messages: await messages(id),
                managed: dispatch.snapshot?.(),
            });
            if (fresh.status !== "request-eligible" ||
                fresh.messageID !== decision.messageID ||
                fresh.providerID !== decision.providerID ||
                fresh.modelID !== decision.modelID ||
                !noManagedWork() ||
                compactionAttempts.has(key))
                return;
            compactionAttempts.add(key);
            const result = await nativeSession.summarize({ path: { id }, body: { providerID: fresh.providerID, modelID: fresh.modelID } });
            if (!isRecord(result) || result.error || result.data !== true)
                logDiagnostic("Reported-input proxy native summarize unconfirmed.", {});
        }
        catch {
            logDiagnostic("Reported-input proxy skipped after native read/request failure.", {});
        }
        finally {
            compactionInFlight.delete(id);
        }
    }
    function isDelegateCommand(command) {
        return /^\s*(\/delegate-|node\s+.*resolve-model-routing|node\s+.*model-routing-helper)/.test(command);
    }
    const blockedRoleCommands = new Set([
        "delegate-research",
        "delegate-plan",
        "delegate-implement",
        "delegate-validate",
    ]);
    return {
        tool: toolApi
            ? {
                harness_verify: toolApi({
                    description: "Run an exact assigned validator gate in the managed read-only sandbox and report its observed exit status.",
                    args: { command: toolApi.schema.string() },
                    async execute({ command }, context) {
                        if (!dispatch.verifyCommand)
                            throw new Error("managed verification unavailable");
                        return JSON.stringify(dispatch.verifyCommand(context.sessionID, command));
                    },
                }),
                harness_trace: toolApi({
                    description: "Create one immutable Markdown artifact in the assigned role trace directory.",
                    args: { filePath: toolApi.schema.string(), content: toolApi.schema.string() },
                    async execute({ filePath, content }, context) {
                        if (!dispatch.writeTrace)
                            throw new Error("managed trace writing unavailable");
                        return dispatch.writeTrace(context.sessionID, filePath, content);
                    },
                }),
                harness_source_edit: toolApi({
                    description: "Implementer-only: create an exact assigned source file or replace it when complete prior UTF-8 contents match.",
                    args: {
                        filePath: toolApi.schema.string(),
                        expectedContent: toolApi.schema.string(),
                        content: toolApi.schema.string(),
                    },
                    async execute({ filePath, expectedContent, content }, context) {
                        if (!dispatch.editSource)
                            throw new Error("managed source editing unavailable");
                        return JSON.stringify(dispatch.editSource(context.sessionID, filePath, expectedContent, content));
                    },
                }),
                harness_source_replace: toolApi({
                    description: "Implementer-only: replace one unique exact UTF-8 fragment in a packet-assigned regular source file when its current bytes match.",
                    args: {
                        filePath: toolApi.schema.string(),
                        expectedContent: toolApi.schema.string(),
                        content: toolApi.schema.string(),
                    },
                    async execute({ filePath, expectedContent, content }, context) {
                        if (!dispatch.replaceSource)
                            throw new Error("managed source replacement unavailable");
                        return JSON.stringify(dispatch.replaceSource(context.sessionID, filePath, expectedContent, content));
                    },
                }),
                harness_recovery_status: toolApi({
                    description: "Orchestrator-only: inspect a stopped managed run and report whether native termination and workspace proof permit a fresh workflow in this session.",
                    args: {},
                    async execute(_args, context) {
                        if (!dispatch.recoveryStatus)
                            throw new Error("managed recovery status unavailable");
                        return JSON.stringify(await dispatch.recoveryStatus(context.sessionID));
                    },
                }),
                harness_recovery_resolve: toolApi({
                    description: "Orchestrator-only: retry termination of the exact stopped, launch-confirmed child, then check native parent and idle identity before reviewing effects.",
                    args: {},
                    async execute(_args, context) {
                        if (!dispatch.resolveRecovery)
                            throw new Error("managed recovery resolution unavailable");
                        return JSON.stringify(await dispatch.resolveRecovery(context.sessionID));
                    },
                }),
                harness_recovery_release: toolApi({
                    description: "Orchestrator-only: after reviewing exact stopped-run effects, release the guard for fresh IDs only when the native child is proven terminal and the tree hash still matches.",
                    args: { expectedTreeHash: toolApi.schema.string() },
                    async execute({ expectedTreeHash }, context) {
                        if (!dispatch.releaseForFresh)
                            throw new Error("managed recovery release unavailable");
                        return JSON.stringify(await dispatch.releaseForFresh(context.sessionID, expectedTreeHash));
                    },
                }),
            }
            : {},
        config: async (cfg) => {
            assertWorkspaceIdentity();
            if (!isRecord(cfg))
                throw new Error("native config unavailable");
            nativeConfig = cfg;
            if (delegation.mode === "background" && !transport.enabled)
                throw new Error("background mode requires native session APIs and OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true");
        },
        "experimental.session.compacting": async (input, output) => {
            if (!Array.isArray(output.context))
                throw new Error("native compaction context unavailable");
            output.context.push(COMPACTION_HANDOFF);
            if (typeof input.sessionID !== "string" || !input.sessionID)
                return;
            try {
                const hint = taskCompactionHint(dispatch.currentTaskView?.(input.sessionID));
                if (hint)
                    output.context.push(hint);
            }
            catch {
                // Unavailable or malformed advisory data never changes the generic handoff.
            }
        },
        "chat.message": async (input) => {
            if (typeof input.sessionID === "string" && managedSessions.has(input.sessionID))
                await dispatch.reconcileBackground?.();
        },
        event: async ({ event }) => {
            const eventRecord = isRecord(event) ? event : {};
            const type = eventRecord.type ?? eventRecord.name ?? "unknown";
            if (type === "session.created") {
                logDiagnostic("OpenCode harness loaded.", { event: "session-created" });
                const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
                if (isRecord(properties.info)) {
                    dispatch.sessionCreated(properties.info);
                    if (typeof properties.info.id === "string" &&
                        typeof properties.info.parentID === "string" &&
                        managedSessions.has(properties.info.parentID))
                        managedSessions.add(properties.info.id);
                }
            }
            if (type === "session.idle" || type === "session.status") {
                const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
                if (typeof properties.sessionID === "string" &&
                    (type === "session.idle" ||
                        (isRecord(properties.status) && properties.status.type === "idle"))) {
                    await dispatch.reconcileBackground?.(properties.sessionID);
                    await considerCompaction(properties.sessionID, {
                        type,
                        sessionID: properties.sessionID,
                        status: properties.status,
                    });
                }
            }
            if (type === "session.error" || type === "session.deleted") {
                const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
                const info = isRecord(properties.info) ? properties.info : {};
                const sessionId = properties.sessionID ?? info.id;
                if (managedSessions.size &&
                    (typeof sessionId !== "string" || managedSessions.has(sessionId)))
                    (dispatch.interruptIfCurrent ??
                        ((_id, reason) => dispatch.interrupt(reason)))(sessionId, type === "session.error" ? "managed session error" : "managed session deleted");
            }
        },
        "command.execute.before": async (input) => {
            const command = String(input?.command ?? "").replace(/^\//, "");
            if (blockedRoleCommands.has(command)) {
                throw new Error("Harness guardrail: direct role commands are not a managed dispatch surface; use /delegate-orchestration so Task policy enforcement applies.");
            }
        },
        "tool.execute.before": async (input, output) => {
            const args = isRecord(output?.args) ? output.args : undefined;
            if (input?.tool === "task") {
                if (dispatchFactory === createManagedDispatch &&
                    (!workspaceRoot || !path.isAbsolute(workspaceRoot)))
                    throw new Error("Harness managed dispatch requires an absolute workspace root");
                await dispatch.beforeTask(input, args ?? {});
                if (typeof input.sessionID === "string")
                    managedSessions.add(input.sessionID);
            }
            else {
                output.args = dispatch.beforeTool(input, args ?? {});
            }
            const command = input?.tool === "bash" ? String(args?.command ?? "") : "";
            if (/rm\s+-rf\s+(\.opencode|\.memory)(\/?)(\s|$)/.test(command)) {
                throw new Error("Harness guardrail: destructive deletion of harness-managed directories requires explicit cleanup approval.");
            }
            if (isDelegateCommand(command)) {
                logDiagnostic("Delegation command observed.", { event: "delegation-command-observed" });
            }
        },
        "tool.execute.after": async (input, output) => {
            if (input?.tool === "task")
                dispatch.afterTask(input, output);
            else
                dispatch.afterTool(input, output);
        },
    };
};
