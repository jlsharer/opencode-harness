import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { acquireArtifact, } from "./operator-approved-artifact-install.js";
import { installArchive, verifyInstall, } from "./operator-approved-archive-install.js";
import fs from "node:fs";
import path from "node:path";
import { createManagedDispatch, parseDelegationPolicy, parseWorkflowRegistryCapacity, } from "./managed-dispatch.js";
import { enforceRecoveryShell } from "./managed-execution.js";
import { admitV2Subagent, completedV2Subagent, runningV2Subagent, v2JsonResult, } from "./v2-dispatch-bridge.js";
import { validateTaskResult } from "./task-contracts.js";
import { appendV2CompactionContext } from "./compaction-handoff.js";
import { parseWin64RelaunchPolicy, relaunchExistingWin64Snapshot, planWin64Build, buildWin64Snapshot, planWin64Cases, runWin64Cases, verifyWin64Snapshot, verifyWin64CaseLog, } from "./external-win64-relaunch.js";
import { loadRoutingConfigSelection } from "../routing/routing-config-loader.mjs";
import { normalizeAndValidateRoutingConfig, resolveAllHarnessRoleAssignments, resolveRoutingDecision, } from "../routing/routing-policy.mjs";
import { planTraceRootPermissions, TRACE_ONLY_ROLES, TRACE_PERMISSION_ROLES, } from "./trace-root-permissions.js";
function exactActionRequest(raw, names) {
    if (typeof raw !== "string" || raw.length > 4096)
        throw new Error("bounded action request required");
    const value = JSON.parse(raw);
    if (!value ||
        typeof value !== "object" ||
        Array.isArray(value) ||
        Object.keys(value).sort().join("\0") !== [...names].sort().join("\0"))
        throw new Error("exact action request fields required");
    return value;
}
export function v2PermissionSource(caller) {
    const messageID = caller.assistantMessageID ?? caller.messageID;
    const id = caller.id ?? caller.toolCallID;
    if (!messageID || !id)
        throw new Error("native V2 tool invocation identity unavailable");
    return { type: "tool", messageID, id };
}
export const BOUNDED_APPROVAL_ACTIONS = [
    "harness.external-artifact-download",
    "harness.external-archive-install",
    "harness.external-recovery-build",
    "harness.external-recovery-shell",
    "harness.external-win64-build",
    "harness.external-win64-cases",
];
export function boundedApproval(action, challenge, policy) {
    if (!challenge || challenge.length > 16384)
        throw new Error("bounded approval challenge invalid");
    const digest = createHash("sha256")
        .update(JSON.stringify({ schemaVersion: 1, action, policy }))
        .digest("hex");
    const prefix = `harness-policy-v1:${digest}:`;
    return { resources: [`${prefix}${challenge}`], save: [`${prefix}*`] };
}
export function primaryExternalApprovalRules(existing) {
    const asks = BOUNDED_APPROVAL_ACTIONS.map((action) => ({ action, resource: "*", effect: "ask" }));
    // Keep configured denies last so neither an ask nor a saved approval can override them.
    const denies = existing.filter((rule) => rule.effect === "deny");
    return [...existing, ...asks, ...denies];
}
function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("V2 native event contract unavailable");
    return value;
}
function data(value) {
    const source = record(value);
    return source.data && typeof source.data === "object" ? record(source.data) : source;
}
function nativeTool(name) {
    const known = {
        shell: "bash",
        read: "read",
        grep: "grep",
        glob: "glob",
        edit: "edit",
        write: "write",
        webfetch: "webfetch",
    };
    return known[String(name)] ?? String(name);
}
function beforeInput(event) {
    const input = record(event.input);
    const tool = nativeTool(event.tool);
    const args = { ...input };
    if ((tool === "edit" || tool === "write" || tool === "read") && "path" in args)
        args.filePath = args.path;
    return { input, tool, args };
}
function tracePlan(workspaceRoot, traceRoot, runtimeRoot) {
    const agents = Object.fromEntries(TRACE_PERMISSION_ROLES.map((role) => [role, { permission: {} }]));
    const external = planTraceRootPermissions({ agent: agents }, {
        workspaceRoot,
        traceRoot,
        runtimeRoot,
        directory: workspaceRoot,
        env: {},
    });
    if (!external && traceRoot !== path.join(workspaceRoot, ".memory"))
        throw new Error("V2 trace root is not the exact project memory directory");
    const stat = fs.lstatSync(traceRoot);
    if (!stat.isDirectory() ||
        stat.isSymbolicLink() ||
        stat.uid !== process.getuid?.() ||
        (stat.mode & 0o777) !== 0o700)
        throw new Error("V2 trace root must be current-user mode 0700");
    const relativeRoot = path.relative(workspaceRoot, traceRoot).split(path.sep).join("/");
    const plan = external ?? {
        schemaVersion: "1.0.0",
        workspaceRoot,
        traceRoot,
        roles: [...TRACE_PERMISSION_ROLES],
        permissions: TRACE_PERMISSION_ROLES.map((role) => ({
            role,
            externalDirectory: `${traceRoot}/orchestrations/*/roles/${role}/*`,
            edit: TRACE_ONLY_ROLES.includes(role)
                ? `${relativeRoot}/orchestrations/*/roles/${role}/*.md`
                : null,
        })),
    };
    const values = {
        schemaVersion: plan.schemaVersion,
        workspaceRoot: plan.workspaceRoot,
        traceRoot: plan.traceRoot,
        roles: plan.roles,
        permissions: plan.permissions,
    };
    return {
        ...values,
        permissionPlanDigest: createHash("sha256").update(JSON.stringify(values)).digest("hex"),
    };
}
async function localModelReady(base, model) {
    if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}\/v1$/.test(base))
        return false;
    const read = async (url) => {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: "omit",
            redirect: "error",
            signal: AbortSignal.timeout(1500),
        });
        if (!response.ok || !response.body)
            throw new Error("local route unavailable");
        const reader = response.body.getReader();
        const chunks = [];
        let size = 0;
        try {
            while (true) {
                const part = await reader.read();
                if (part.done)
                    break;
                size += part.value.byteLength;
                if (size > 65536)
                    throw new Error("local route response exceeds bound");
                chunks.push(part.value);
            }
        }
        finally {
            await reader.cancel();
        }
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    };
    try {
        const health = record(await read(new URL("/health", base).href));
        const models = record(await read(`${base}/models`));
        return (health.status === "ok" &&
            Array.isArray(models.data) &&
            models.data.some((entry) => entry && typeof entry === "object" && entry.id === model));
    }
    catch {
        return false;
    }
}
async function registerRoles(context, plan) {
    const routing = normalizeAndValidateRoutingConfig(loadRoutingConfigSelection({
        startPath: plan.workspaceRoot,
        fallbackDirectory: path.join(process.env.OPENCODE_HARNESS_RUNTIME_ROOT, "routing"),
    }).document);
    const assignments = resolveAllHarnessRoleAssignments(routing).assignments;
    const variants = Object.fromEntries(TRACE_PERMISSION_ROLES.map((role) => [
        role,
        resolveRoutingDecision({ config: routing, request: { role } }).variant,
    ]));
    const selected = TRACE_PERMISSION_ROLES.map((role) => assignments[role]?.model).filter((model) => typeof model === "string");
    if (selected.length) {
        const response = await context.model.list();
        const models = Array.isArray(response) ? response : record(response).data;
        if (!Array.isArray(models))
            throw new Error("V2 routing model inventory unavailable");
        const local = TRACE_PERMISSION_ROLES.some((role) => Boolean(assignments[role]?.catalogName));
        const providerResponse = local ? await context.provider.list() : [];
        const providers = Array.isArray(providerResponse)
            ? providerResponse
            : record(providerResponse).data;
        if (!Array.isArray(providers))
            throw new Error("V2 routing provider inventory unavailable");
        for (const model of selected) {
            const slash = model.indexOf("/");
            const missing = slash <= 0 ||
                !models.some((entry) => entry &&
                    typeof entry === "object" &&
                    entry.providerID === model.slice(0, slash) &&
                    entry.id === model.slice(slash + 1) &&
                    entry.enabled === true);
            if (missing) {
                for (const role of TRACE_PERMISSION_ROLES) {
                    const assignment = assignments[role];
                    if (assignment?.model !== model)
                        continue;
                    if (assignment.catalogName && !routing.localRouting.forceLocalForHarnessSubagents)
                        assignments[role] = null;
                    else
                        throw new Error("V2 routing selection is absent from the active native model inventory");
                }
            }
            for (const role of TRACE_PERMISSION_ROLES) {
                const assignment = assignments[role];
                const variant = variants[role];
                if (assignment?.model !== model || !variant)
                    continue;
                const entry = models.find((candidate) => candidate &&
                    typeof candidate === "object" &&
                    candidate.providerID === model.slice(0, slash) &&
                    candidate.id === model.slice(slash + 1));
                if (Array.isArray(entry?.variants) &&
                    entry.variants.some((item) => item && typeof item === "object" && "id" in item && item.id === variant))
                    continue;
                if (assignment.catalogName && !routing.localRouting.forceLocalForHarnessSubagents)
                    assignments[role] = null;
                else
                    throw new Error("V2 routing variant is absent from the native model inventory");
            }
            for (const role of TRACE_PERMISSION_ROLES) {
                const assignment = assignments[role];
                if (assignment?.model !== model || !assignment.catalogName)
                    continue;
                const provider = providers.find((entry) => entry &&
                    typeof entry === "object" &&
                    (entry.id === model.slice(0, slash) || entry.provider?.id === model.slice(0, slash)));
                if ((provider?.settings?.baseURL ?? provider?.provider?.settings?.baseURL) ===
                    assignment.routingServiceUrl)
                    continue;
                if (!routing.localRouting.forceLocalForHarnessSubagents)
                    assignments[role] = null;
                else
                    throw new Error("V2 native provider endpoint does not match the selected catalog");
            }
        }
        const readiness = new Map();
        for (const role of TRACE_PERMISSION_ROLES) {
            const assignment = assignments[role];
            if (!assignment?.catalogName || !assignment.routingServiceUrl)
                continue;
            const key = `${assignment.routingServiceUrl}\0${assignment.model}`;
            if (!readiness.has(key))
                readiness.set(key, await localModelReady(assignment.routingServiceUrl, assignment.model.slice(assignment.model.indexOf("/") + 1)));
            if (readiness.get(key))
                continue;
            if (!routing.localRouting.forceLocalForHarnessSubagents)
                assignments[role] = null;
            else
                throw new Error("V2 required local routing endpoint is unavailable");
        }
    }
    const transformed = new Set();
    await context.agent.transform((editor) => {
        // Register only after the native project agent source: later rules win.
        // Code Mode offers session_move outside normal tool hooks; keep direct
        // subagent tools while removing that unguarded path from primary agents.
        for (const item of editor.list()) {
            if (TRACE_PERMISSION_ROLES.includes(String(item.id)) ||
                (item.mode !== "primary" && item.mode !== "all") ||
                item.hidden === true)
                continue;
            editor.update(String(item.id), (agent) => {
                if (!Array.isArray(agent.permissions))
                    throw new Error("V2 primary permissions unavailable");
                agent.permissions = [
                    ...primaryExternalApprovalRules(agent.permissions),
                    { action: "execute", resource: "*", effect: "deny" },
                ];
            });
        }
        for (const role of TRACE_PERMISSION_ROLES) {
            if (!editor.get(role))
                throw new Error(`V2 harness role unavailable: ${role}`);
            editor.update(role, (agent) => {
                const permissions = agent.permissions;
                if (!Array.isArray(permissions))
                    throw new Error(`V2 role permissions unavailable: ${role}`);
                const entry = plan.permissions.find((item) => item.role === role);
                const rules = [
                    { action: "execute", resource: "*", effect: "deny" },
                    { action: "subagent", resource: "*", effect: "deny" },
                    { action: "external_directory", resource: entry.externalDirectory, effect: "allow" },
                    ...(entry.edit ? [{ action: "edit", resource: entry.edit, effect: "allow" }] : []),
                ];
                agent.permissions = [...permissions, ...rules];
                const model = assignments[role]?.model;
                if (model) {
                    const slash = model.indexOf("/");
                    agent.model = {
                        providerID: model.slice(0, slash),
                        id: model.slice(slash + 1),
                        ...(variants[role] ? { variant: variants[role] } : {}),
                    };
                }
            });
            transformed.add(role);
        }
    });
    return async () => {
        for (let attempt = 0; attempt < 50; attempt++) {
            await context.agent.reload();
            const value = await context.agent.list();
            const agents = Array.isArray(value) ? value : record(value).data;
            if (transformed.size === TRACE_PERMISSION_ROLES.length && Array.isArray(agents)) {
                const ready = TRACE_PERMISSION_ROLES.every((role) => {
                    const agent = agents.find((item) => item && typeof item === "object" && item.id === role);
                    return (agent &&
                        Array.isArray(agent.permissions) &&
                        agent.permissions.some((item) => record(item).action === "execute" && record(item).effect === "deny") &&
                        (!assignments[role]?.model ||
                            (agent.model?.providerID ===
                                assignments[role].model.split("/")[0] &&
                                agent.model?.id ===
                                    assignments[role].model.split("/")
                                        .slice(1)
                                        .join("/") &&
                                (!variants[role] || agent.model?.variant === variants[role]))));
                });
                const primaries = agents.filter((item) => item &&
                    typeof item === "object" &&
                    (item.mode === "primary" || item.mode === "all") &&
                    item.hidden !== true);
                if (ready &&
                    primaries.length > 0 &&
                    primaries.every((agent) => Array.isArray(agent.permissions) &&
                        agent.permissions.some((item) => record(item).action === "execute" && record(item).effect === "deny")))
                    return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        throw new Error("V2 effective role permissions unavailable");
    };
}
async function waitForNativeAgentSource(context, signal) {
    const deadline = Date.now() + 30000;
    for (let attempt = 0; Date.now() < deadline && !signal.aborted; attempt++) {
        const value = await context.plugin.list();
        const plugins = Array.isArray(value) ? value : record(value).data;
        if (Array.isArray(plugins) &&
            plugins.some((item) => item &&
                typeof item === "object" &&
                item.id === "opencode.config.agent" &&
                item.state?.status === "active"))
            return;
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("V2 native agent source is not active");
}
function activationMarker(plan) {
    const filename = process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH;
    const nonce = process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE;
    if (!filename && !nonce)
        return;
    if (!filename ||
        !path.isAbsolute(filename) ||
        path.normalize(filename) !== filename ||
        !/^[a-f0-9]{64}$/.test(nonce ?? ""))
        throw new Error("V2 activation probe requires exact marker and nonce");
    const parent = fs.lstatSync(path.dirname(filename));
    if (!parent.isDirectory() ||
        parent.isSymbolicLink() ||
        parent.uid !== process.getuid?.() ||
        (parent.mode & 0o777) !== 0o700)
        throw new Error("V2 activation marker parent is unsafe");
    fs.writeFileSync(filename, JSON.stringify({ ...plan, nonce }) + "\n", {
        flag: "wx",
        mode: 0o600,
    });
}
/** Diagnostic only: native admission and typed packets remain the authorization boundary. */
export async function v2DispatchStatus(ready, activationFailed, stopped, verifyRoles) {
    if (stopped)
        return { status: "stopped", managedSubagent: false };
    if (!ready || !verifyRoles)
        return {
            status: activationFailed ? "unavailable" : "activating",
            managedSubagent: false,
        };
    try {
        await verifyRoles();
        return {
            status: "ready",
            managedSubagent: true,
            nativeTool: "subagent",
            roles: [...TRACE_PERMISSION_ROLES],
        };
    }
    catch {
        return { status: "unavailable", managedSubagent: false };
    }
}
/** Only the read-only Code Mode alias enters the Code Mode catalog. */
export function v2HarnessToolCodeMode(name) {
    return name === "harness_dispatch_status_code";
}
export const V2NativePlugin = {
    id: "opencode-harness.v2",
    async setup(context) {
        const workspaceRoot = process.env.OPENCODE_HARNESS_WORKSPACE_ROOT;
        const runtimeRoot = process.env.OPENCODE_HARNESS_RUNTIME_ROOT;
        const traceRoot = process.env.OPENCODE_HARNESS_TRACE_ROOT;
        if (process.env.OPENCODE_HARNESS_NATIVE_API !== "v2" ||
            !workspaceRoot ||
            !path.isAbsolute(workspaceRoot) ||
            context.location.directory !== workspaceRoot ||
            !runtimeRoot ||
            !path.isAbsolute(runtimeRoot) ||
            !traceRoot ||
            !path.isAbsolute(traceRoot))
            throw new Error("V2 harness requires matching launcher-set roots");
        const delegation = parseDelegationPolicy(process.env.OPENCODE_HARNESS_DELEGATION);
        const externalRelaunch = parseWin64RelaunchPolicy(process.env.OPENCODE_HARNESS_WIN64_RELAUNCH);
        const job = context.job;
        const backgroundEnabled = process.env.OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS === "true" &&
            job &&
            typeof job.get === "function" &&
            typeof job.wait === "function" &&
            typeof job.cancel === "function";
        if (delegation.mode === "background" && !backgroundEnabled)
            throw new Error("V2 background requires native subagent Job get/wait/cancel capability");
        const plan = tracePlan(workspaceRoot, traceRoot, runtimeRoot);
        const transport = backgroundEnabled
            ? {
                enabled: true,
                models: async (parent, role) => {
                    const session = data(await context.session.get({ sessionID: parent }));
                    const response = await context.agent.list();
                    const agents = Array.isArray(response) ? response : record(response).data;
                    if (!Array.isArray(agents))
                        throw new Error("V2 agent model inventory unavailable");
                    const agent = agents.find((candidate) => candidate?.id === role);
                    const parentModel = record(session.model);
                    const workerModel = agent?.model ? record(agent.model) : parentModel;
                    const ref = (model) => `${model.providerID}/${model.id}`;
                    return { parent: ref(parentModel), worker: ref(workerModel) };
                },
                inspect: async (child) => {
                    const session = data(await context.session.get({ sessionID: child }));
                    const current = await job.get({ id: child });
                    const worker = current ? data(current) : null;
                    const terminal = worker && worker.status !== "running";
                    const idle = Boolean(terminal) &&
                        (worker?.status === "completed"
                            ? session.outcome === "succeeded"
                            : Boolean(session.outcome)) &&
                        Boolean(session.time && record(session.time).idle);
                    return {
                        parent: String(session.parentID ?? ""),
                        idle,
                        messages: [],
                        ...(terminal
                            ? {
                                job: {
                                    status: String(worker.status),
                                    startedAt: Number(worker.started_at),
                                    completedAt: Number(worker.completed_at),
                                    ...(worker.status === "completed" && typeof worker.output === "string"
                                        ? { output: v2JsonResult(worker.output) }
                                        : {}),
                                },
                            }
                            : {}),
                    };
                },
                abort: async (child) => {
                    await context.session.interrupt({ sessionID: child, resume: false });
                    const cancelled = data(await job.cancel({ id: child }));
                    if (cancelled.status === "running")
                        throw new Error("native Job remains active");
                    const result = data(await job.wait({ id: child, timeout: 2000 }));
                    if (result.timedOut || !result.info || data(result.info).status === "running")
                        throw new Error("native Job termination unconfirmed");
                    await Promise.race([
                        context.session.wait({ sessionID: child }),
                        new Promise((_resolve, reject) => setTimeout(() => reject(new Error("native child idle unconfirmed")), 2000)),
                    ]);
                },
            }
            : undefined;
        const dispatch = createManagedDispatch({
            workspaceRoot,
            traceRoot,
            runtimeRoot,
            allowActiveIsolatedShell: true,
            delegation,
            registryCapacity: parseWorkflowRegistryCapacity(process.env.OPENCODE_HARNESS_WORKFLOW_REGISTRY_CAPACITY),
            ...(transport ? { backgroundTransport: transport } : {}),
        });
        const handoff = (event, kind) => {
            try {
                appendV2CompactionContext(event.system, traceRoot, dispatch.compactionPointer(event.sessionID)?.orchestrationId ?? null, kind);
            }
            catch {
                // A malformed handoff is unknown state, never a model instruction.
            }
        };
        await context.session.hook("compaction", async (event) => handoff(event, "compaction"));
        await context.session.hook("context", async (event) => handoff(event, "context"));
        const backgroundObservers = new Set();
        let ready = false;
        let activationFailed = false;
        let verifyRoles = null;
        const abort = new AbortController();
        const watch = (async () => {
            for await (const event of context.event.subscribe({ signal: abort.signal })) {
                const value = record(event);
                if (value.type === "session.synthetic") {
                    const event = record(value.data);
                    const metadata = event.metadata ? record(event.metadata) : {};
                    if (metadata.source === "subagent" &&
                        typeof metadata.childID === "string" &&
                        ["completed", "error", "cancelled"].includes(String(metadata.state)) &&
                        dispatch.currentTaskView(event.sessionID)?.role === metadata.agent) {
                        const view = dispatch.currentTaskView(event.sessionID);
                        void dispatch
                            .reconcileBackground(metadata.childID)
                            .then(() => {
                            const run = dispatch
                                .snapshot()
                                .runs.find((candidate) => candidate.attempts.some((attempt) => attempt.id === view.delegationTaskId));
                            const attempt = run?.attempts.find((item) => item.id === view.delegationTaskId);
                            if (!attempt || attempt.state === "running")
                                return;
                            const filename = path.join(traceRoot, "orchestrations", view.orchestrationId, "validation", `${view.delegationTaskId}-v2-terminal-observation.json`);
                            try {
                                fs.writeFileSync(filename, JSON.stringify({
                                    kind: "v2-background-terminal-observation",
                                    acceptanceProof: false,
                                    orchestrationId: view.orchestrationId,
                                    delegationTaskId: view.delegationTaskId,
                                    nativeState: metadata.state,
                                    controllerState: attempt.state,
                                }) + "\n", { flag: "wx", mode: 0o600 });
                            }
                            catch {
                                // Coordination only; acceptance remains controller- and validator-bound.
                            }
                        })
                            .catch(() => dispatch.interrupt("V2 native background terminal result rejected"));
                    }
                    continue;
                }
                if (value.type !== "session.created")
                    continue;
                const data = record(value.data);
                if (typeof data.sessionID !== "string" ||
                    (data.parentID !== undefined && typeof data.parentID !== "string"))
                    throw new Error("V2 native session.created identity unavailable");
                dispatch.sessionCreated({ id: data.sessionID, parentID: data.parentID });
            }
        })().catch(() => dispatch.interrupt("V2 native session event stream unavailable"));
        await context.tool.hook("execute.before", async (event) => {
            if (event.tool === "subagent") {
                if (!ready)
                    throw new Error("V2 harness guard activation is incomplete");
                await admitV2Subagent(event, (input, args) => dispatch.beforeTask(input, args));
                return;
            }
            const { input, tool, args } = beforeInput(event);
            if (tool === "bash" &&
                (dispatch.snapshot().stopped || dispatch.isActiveParent(event.sessionID))) {
                if (typeof event.sessionID !== "string")
                    throw new Error("native recovery session identity unavailable");
                const native = data(await context.session.get({ sessionID: event.sessionID }));
                if (native.id !== event.sessionID ||
                    (native.parentID !== undefined && native.parentID !== null))
                    throw new Error("native primary session identity unavailable for recovery shell");
                dispatch.authorizeIsolatedPrimary(event.sessionID, native.parentID);
                const root = dispatch.isolatedPrimaryShellRoot(event.sessionID);
                if (typeof event.messageID !== "string" ||
                    typeof event.id !== "string" ||
                    typeof event.agent !== "string" ||
                    typeof args.command !== "string")
                    throw new Error("native recovery shell permission identity unavailable");
                if (!args.command.trim() || args.command.length > 16384)
                    throw new Error("recovery shell requires a bounded command");
                const timeoutMs = typeof args.timeout === "number" && Number.isSafeInteger(args.timeout) && args.timeout > 0
                    ? Math.min(args.timeout, 300000)
                    : 300000;
                const challenge = JSON.stringify({
                    command: args.command,
                    writeRoot: root,
                    network: false,
                    scriptPolicy: "allow-exact-command",
                    timeoutMs,
                });
                await context.permission.assert({
                    sessionID: event.sessionID,
                    agent: event.agent,
                    source: { type: "tool", messageID: event.messageID, id: event.id },
                    action: "harness.external-recovery-shell",
                    ...boundedApproval("harness.external-recovery-shell", challenge, {
                        command: args.command,
                        writeRoot: root,
                        network: false,
                        scriptPolicy: "allow-exact-command",
                        timeoutMs,
                    }),
                });
                if (!(dispatch.snapshot().stopped || dispatch.isActiveParent(event.sessionID)) ||
                    dispatch.isolatedPrimaryShellRoot(event.sessionID) !== root)
                    throw new Error("isolated shell state changed after approval");
            }
            const checked = dispatch.beforeTool({ sessionID: event.sessionID, callID: event.id, tool }, args);
            if ("filePath" in checked && "path" in input)
                input.path = checked.filePath;
            if ("command" in checked && "command" in input)
                input.command = checked.command;
            if ("workdir" in checked && "workdir" in input)
                input.workdir = checked.workdir;
            if ("timeout" in checked && "timeout" in input)
                input.timeout = checked.timeout;
        });
        await context.tool.hook("execute.after", async (event) => {
            if (event.tool !== "subagent") {
                const result = event.status === "completed" ? record(event.result) : {};
                const metadata = result.metadata && typeof result.metadata === "object" ? result.metadata : {};
                dispatch.afterTool({ sessionID: event.sessionID, callID: event.id, tool: nativeTool(event.tool) }, { metadata });
                return;
            }
            let view = null;
            const observe = (outcome, artifacts = [], diagnostic = null) => {
                if (!view)
                    return;
                const accepted = dispatch
                    .snapshot()
                    .runs.find((run) => run.attempts.some((attempt) => attempt.id === view.delegationTaskId));
                const target = path.join(traceRoot, "orchestrations", view.orchestrationId, "validation", `${view.delegationTaskId}-v2-observation.json`);
                try {
                    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
                    fs.writeFileSync(target, JSON.stringify({
                        kind: "v2-managed-validation-observation",
                        acceptanceProof: false,
                        orchestrationId: view.orchestrationId,
                        delegationTaskId: view.delegationTaskId,
                        role: view.role,
                        outcome,
                        ...(diagnostic ? { diagnostic } : {}),
                        gates: accepted?.gates ?? {},
                        artifacts: artifacts.map((artifact) => ({
                            reference: artifact.reference,
                            ...(artifact.sha256 ? { sha256: artifact.sha256 } : {}),
                        })),
                    }) + "\n", { flag: "wx", mode: 0o600 });
                }
                catch {
                    // Coordination only; a trace pointer is never acceptance proof.
                }
            };
            try {
                const result = record(event.result);
                const output = record(result.output);
                if (typeof output.sessionID !== "string")
                    throw new Error("native child ID unavailable");
                const response = record(await context.session.get({ sessionID: output.sessionID }));
                const child = response.data && typeof response.data === "object" ? record(response.data) : response;
                const checked = output.status === "running"
                    ? runningV2Subagent(event, { id: child.id, parentID: child.parentID, model: child.model }, data(await job.get({ id: output.sessionID })).started_at)
                    : completedV2Subagent(event, { id: child.id, parentID: child.parentID });
                dispatch.sessionCreated(child);
                view = dispatch.currentTaskView(event.sessionID);
                const completed = dispatch.afterTask(checked.input, checked.output);
                let diagnostic = null;
                if (completed.outcome === "rejected" && view && typeof output.output === "string") {
                    try {
                        validateTaskResult(v2JsonResult(output.output), {
                            orchestrationId: view.orchestrationId,
                            delegationTaskId: view.delegationTaskId,
                            scopeKey: view.scopeKey,
                            role: view.role,
                            taskMode: view.taskMode,
                        });
                        diagnostic = "native wrapper or task-thread correlation rejected";
                    }
                    catch (error) {
                        const text = error instanceof Error ? error.message : "invalid typed result";
                        diagnostic = text.startsWith("Harness task contract:")
                            ? text.slice(0, 120)
                            : "invalid V2 terminal result";
                    }
                }
                observe(completed.outcome, "result" in completed ? (completed.result?.artifacts ?? []) : [], diagnostic);
                if (completed.outcome === "running" && view) {
                    const current = view;
                    const childID = child.id;
                    let pending = false;
                    const timer = setInterval(() => {
                        if (pending)
                            return;
                        pending = true;
                        void dispatch
                            .reconcileBackground(childID)
                            .then(() => {
                            const snapshot = dispatch.snapshot();
                            const run = snapshot.runs.find((candidate) => candidate.attempts.some((attempt) => attempt.id === current.delegationTaskId));
                            const attempt = run?.attempts.find((item) => item.id === current.delegationTaskId);
                            if (!attempt || (attempt.state === "running" && !snapshot.stopped))
                                return;
                            clearInterval(timer);
                            backgroundObservers.delete(timer);
                            const filename = path.join(traceRoot, "orchestrations", current.orchestrationId, "validation", `${current.delegationTaskId}-v2-terminal-observation.json`);
                            try {
                                fs.writeFileSync(filename, JSON.stringify({
                                    kind: "v2-background-terminal-observation",
                                    acceptanceProof: false,
                                    orchestrationId: current.orchestrationId,
                                    delegationTaskId: current.delegationTaskId,
                                    controllerState: attempt.state,
                                    stopped: snapshot.stopped,
                                }) + "\n", { flag: "wx", mode: 0o600 });
                            }
                            catch {
                                // Coordination only; no acceptance proof is inferred.
                            }
                        })
                            .catch(() => {
                            clearInterval(timer);
                            backgroundObservers.delete(timer);
                            dispatch.interrupt("V2 background Job inspection rejected");
                        })
                            .finally(() => {
                            pending = false;
                        });
                    }, 250);
                    timer.unref();
                    backgroundObservers.add(timer);
                }
            }
            catch {
                dispatch.interrupt("V2 native subagent completion could not be proven");
                observe("result-proof-failed");
                if (event.status === "completed" && event.result && typeof event.result === "object")
                    record(event.result).content = [
                        {
                            type: "text",
                            text: "Harness V2 managed result rejected; the workflow is stopped and requires fresh reviewed evidence.",
                        },
                    ];
            }
        });
        await context.tool.transform((editor) => {
            const direct = new Set([
                "read",
                "grep",
                "glob",
                "edit",
                "write",
                "shell",
                "webfetch",
                "subagent",
            ]);
            for (const tool of editor.list()) {
                if (!direct.has(tool.id))
                    continue;
                editor.update(tool.id, (value) => {
                    const options = value.options && typeof value.options === "object" ? record(value.options) : {};
                    value.options = { ...options, codemode: false };
                });
            }
            const add = (name, description, fields, execute) => editor.add({
                name,
                description,
                input: {
                    type: "object",
                    properties: Object.fromEntries(fields.map((field) => [field, { type: "string" }])),
                    required: [...fields],
                    additionalProperties: false,
                },
                options: { codemode: v2HarnessToolCodeMode(name) },
                execute,
            });
            const output = (value) => ({ content: JSON.stringify(value ?? null) });
            const within = (root, target) => target.startsWith(root + path.sep);
            const actionRoot = async (caller) => {
                if (((!ready || activationFailed) && !dispatch.snapshot().stopped) ||
                    !caller.sessionID ||
                    !caller.agent)
                    throw new Error("V2 external action caller unavailable");
                v2PermissionSource(caller);
                const native = data(await context.session.get({ sessionID: caller.sessionID }));
                if (native.id !== caller.sessionID ||
                    (native.parentID !== undefined && native.parentID !== null))
                    throw new Error("external action requires native primary session identity");
                if (dispatch.snapshot().stopped) {
                    dispatch.authorizeRecoveryPrimary(caller.sessionID, native.parentID);
                    return dispatch.recoveryActionRoot(caller.sessionID);
                }
                dispatch.assertExternalActionCaller(caller.sessionID);
                return null;
            };
            const actionPath = (target, recoveryRoot) => {
                if (typeof target !== "string" ||
                    !path.isAbsolute(target) ||
                    path.resolve(target) !== target)
                    throw new Error("external action requires canonical absolute target");
                if ([workspaceRoot, traceRoot, runtimeRoot].some((root) => target === root || within(root, target) || within(target, root)) ||
                    (recoveryRoot !== null && !within(recoveryRoot, target)))
                    throw new Error("external action target outside isolated recovery scope");
            };
            add("harness_external_artifact_download", "Primary-only exact owner-approved HTTPS download to a new private external file; no managed gate", ["request"], async (args, caller) => {
                const request = exactActionRequest(args.request, [
                    "url",
                    "sha256",
                    "destination",
                    "maxBytes",
                    "timeoutMs",
                ]);
                const root = await actionRoot(caller);
                actionPath(request.destination, root);
                const bytes = await acquireArtifact(request, async (challenge) => {
                    await context.permission.assert({
                        sessionID: caller.sessionID,
                        agent: caller.agent,
                        source: v2PermissionSource(caller),
                        action: "harness.external-artifact-download",
                        ...boundedApproval("harness.external-artifact-download", challenge, {
                            sourceUrl: request.url,
                            sha256: request.sha256,
                            destinationParent: path.dirname(request.destination),
                            maxBytes: request.maxBytes,
                            timeoutMs: request.timeoutMs,
                        }),
                    });
                    actionPath(request.destination, await actionRoot(caller));
                    return challenge;
                });
                return output({ destination: request.destination, sha256: request.sha256, bytes });
            });
            add("harness_external_archive_install", "Primary-only exact owner-approved inert SHA-pinned archive install and independent verification; no managed gate", ["request"], async (args, caller) => {
                const request = exactActionRequest(args.request, [
                    "sourceUrl",
                    "version",
                    "archive",
                    "sha256",
                    "destination",
                    "maxArchiveBytes",
                    "maxExpandedBytes",
                    "maxFiles",
                    "scriptPolicy",
                ]);
                const root = await actionRoot(caller);
                actionPath(request.archive, root);
                actionPath(request.destination, root);
                const result = await installArchive(request, async (challenge) => {
                    await context.permission.assert({
                        sessionID: caller.sessionID,
                        agent: caller.agent,
                        source: v2PermissionSource(caller),
                        action: "harness.external-archive-install",
                        ...boundedApproval("harness.external-archive-install", challenge, {
                            sourceUrl: request.sourceUrl,
                            version: request.version,
                            archive: request.archive,
                            sha256: request.sha256,
                            destinationParent: path.dirname(request.destination),
                            maxArchiveBytes: request.maxArchiveBytes,
                            maxExpandedBytes: request.maxExpandedBytes,
                            maxFiles: request.maxFiles,
                            scriptPolicy: request.scriptPolicy,
                        }),
                    });
                    const currentRoot = await actionRoot(caller);
                    actionPath(request.archive, currentRoot);
                    actionPath(request.destination, currentRoot);
                    return challenge;
                });
                const proof = await verifyInstall(request.destination, request.archive, request.sha256, request.version);
                return output({ ...result, proof, destination: request.destination });
            });
            add("harness_external_recovery_build", "Primary-only exact owner-approved offline build in the isolated stopped-run recovery directory; no managed gate", ["request"], async (args, caller) => {
                const request = exactActionRequest(args.request, [
                    "command",
                    "timeoutMs",
                    "maxOutputBytes",
                    "scriptPolicy",
                ]);
                if (typeof request.command !== "string" ||
                    !request.command.trim() ||
                    request.command.length > 16384 ||
                    !Number.isSafeInteger(request.timeoutMs) ||
                    request.timeoutMs < 1 ||
                    request.timeoutMs > 300000 ||
                    !Number.isSafeInteger(request.maxOutputBytes) ||
                    request.maxOutputBytes < 1 ||
                    request.maxOutputBytes > 1048576 ||
                    request.scriptPolicy !== "allow-exact-command")
                    throw new Error("invalid exact recovery build policy or limits");
                const root = await actionRoot(caller);
                if (root === null)
                    throw new Error("recovery build requires a stopped run");
                const challenge = JSON.stringify({ ...request, writeRoot: root, network: false });
                await context.permission.assert({
                    sessionID: caller.sessionID,
                    agent: caller.agent,
                    source: v2PermissionSource(caller),
                    action: "harness.external-recovery-build",
                    ...boundedApproval("harness.external-recovery-build", challenge, {
                        ...request,
                        writeRoot: root,
                        network: false,
                    }),
                });
                if ((await actionRoot(caller)) !== root)
                    throw new Error("recovery build scope changed after approval");
                const wrapped = enforceRecoveryShell({ command: request.command, timeout: request.timeoutMs }, root);
                const result = spawnSync("/bin/sh", ["-c", String(wrapped.command)], {
                    cwd: root,
                    encoding: "utf8",
                    timeout: request.timeoutMs,
                    maxBuffer: request.maxOutputBytes,
                    env: { PATH: "/usr/bin:/bin", HOME: root, TMPDIR: root },
                });
                return output({
                    exitCode: result.status,
                    signal: result.signal,
                    error: result.error?.message ?? null,
                    stdout: result.stdout ?? "",
                    stderr: result.stderr ?? "",
                    writeRoot: root,
                    accepted: false,
                });
            });
            add("harness_dispatch_status", "Check whether this V2 session has an activated guarded subagent route and all four harness roles; not an authorization to dispatch", [], async () => output(await v2DispatchStatus(ready, activationFailed, dispatch.snapshot().stopped, verifyRoles)));
            add("harness_dispatch_status_code", "Read-only Code Mode alias for the exact V2 guarded dispatch status; not an authorization to dispatch", [], async () => output(await v2DispatchStatus(ready, activationFailed, dispatch.snapshot().stopped, verifyRoles)));
            if (externalRelaunch)
                add("harness_external_win64_relaunch", "Operator-pinned external action: verify and relaunch one EXISTING Win64 snapshot without preparing/building; not a managed validation gate", ["snapshot"], async (args, caller) => {
                    if (!ready || activationFailed)
                        throw new Error("V2 harness guard is not active");
                    dispatch.assertExternalActionCaller(caller.sessionID);
                    if (args.snapshot !== externalRelaunch.snapshot || !caller.agent)
                        throw new Error("external relaunch caller or snapshot is not authorized");
                    await context.permission.assert({
                        sessionID: caller.sessionID,
                        agent: caller.agent,
                        source: v2PermissionSource(caller),
                        action: "harness.external-win64-relaunch",
                        resources: [externalRelaunch.snapshot],
                    });
                    dispatch.assertExternalActionCaller(caller.sessionID);
                    return output(relaunchExistingWin64Snapshot(workspaceRoot, externalRelaunch, externalRelaunch.snapshot));
                });
            add("harness_win64_build_plan", "Read-only exact source, script and new Win64 snapshot destination plan; no build or managed gate", ["snapshot"], async (args, caller) => {
                if (!ready || activationFailed)
                    throw new Error("V2 harness guard is not active");
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(planWin64Build(workspaceRoot, String(args.snapshot)));
            });
            add("harness_external_win64_build", "Primary-only, exact owner-approved nonoverwriting Win64 Editor build from pinned source and script; no managed gate or case acceptance", ["request"], async (args, caller) => {
                if (!ready || activationFailed || !caller.agent)
                    throw new Error("V2 harness guard or build caller unavailable");
                dispatch.assertExternalActionCaller(caller.sessionID);
                const request = exactActionRequest(args.request, [
                    "snapshot",
                    "destination",
                    "scriptSha256",
                    "sourceSha256",
                    "scriptPolicy",
                    "permittedWrites",
                    "timeoutMs",
                    "maxOutputBytes",
                ]);
                const planned = planWin64Build(workspaceRoot, request.snapshot);
                for (const key of [
                    "destination",
                    "scriptSha256",
                    "sourceSha256",
                    "scriptPolicy",
                    "permittedWrites",
                ])
                    if (request[key] !== planned[key])
                        throw new Error(`Win64 build plan changed: ${key}`);
                await context.permission.assert({
                    sessionID: caller.sessionID,
                    agent: caller.agent,
                    source: v2PermissionSource(caller),
                    action: "harness.external-win64-build",
                    ...boundedApproval("harness.external-win64-build", JSON.stringify({
                        ...request,
                        networkPolicy: "no-network-requested",
                        managedGate: false,
                    }), {
                        workspaceRoot,
                        scriptSha256: request.scriptSha256,
                        sourceSha256: request.sourceSha256,
                        destinationParent: path.win32.dirname(request.destination),
                        scriptPolicy: request.scriptPolicy,
                        permittedWrites: request.permittedWrites,
                        timeoutMs: request.timeoutMs,
                        maxOutputBytes: request.maxOutputBytes,
                    }),
                });
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(buildWin64Snapshot(workspaceRoot, request));
            });
            add("harness_win64_cases_plan", "Read-only exact existing Win64 snapshot and case-log plan; no test execution or managed gate", ["snapshot"], async (args, caller) => {
                if (!ready || activationFailed)
                    throw new Error("V2 harness guard is not active");
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(planWin64Cases(workspaceRoot, String(args.snapshot)));
            });
            add("harness_win64_snapshot_verify", "Read-only independent hashes for an existing Win64 snapshot and current source; no build or managed gate", ["snapshot"], async (args, caller) => {
                if (!ready || activationFailed)
                    throw new Error("V2 harness guard is not active");
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(verifyWin64Snapshot(workspaceRoot, String(args.snapshot)));
            });
            add("harness_win64_cases_verify", "Read-only results from a completed or pending nine-case log on the verified existing snapshot; no test execution or managed gate", ["snapshot"], async (args, caller) => {
                if (!ready || activationFailed)
                    throw new Error("V2 harness guard is not active");
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(verifyWin64CaseLog(workspaceRoot, String(args.snapshot)));
            });
            add("harness_external_win64_cases", "Primary-only owner-approved nine native cases on an existing pinned snapshot; individual results required, never a managed gate", ["request"], async (args, caller) => {
                if (!ready || activationFailed || !caller.agent)
                    throw new Error("V2 harness guard or cases caller unavailable");
                dispatch.assertExternalActionCaller(caller.sessionID);
                const request = exactActionRequest(args.request, [
                    "snapshot",
                    "destination",
                    "scriptSha256",
                    "sourceSha256",
                    "manifestSha256",
                    "caseLog",
                    "scriptPolicy",
                    "permittedWrites",
                    "timeoutMs",
                    "maxOutputBytes",
                ]);
                const planned = planWin64Cases(workspaceRoot, request.snapshot);
                for (const key of [
                    "destination",
                    "scriptSha256",
                    "sourceSha256",
                    "manifestSha256",
                    "caseLog",
                    "scriptPolicy",
                    "permittedWrites",
                ])
                    if (request[key] !== planned[key])
                        throw new Error(`Win64 cases plan changed: ${key}`);
                await context.permission.assert({
                    sessionID: caller.sessionID,
                    agent: caller.agent,
                    source: v2PermissionSource(caller),
                    action: "harness.external-win64-cases",
                    ...boundedApproval("harness.external-win64-cases", JSON.stringify({
                        ...request,
                        networkPolicy: "no-network-requested",
                        managedGate: false,
                    }), {
                        workspaceRoot,
                        scriptSha256: request.scriptSha256,
                        sourceSha256: request.sourceSha256,
                        destinationParent: path.win32.dirname(request.destination),
                        scriptPolicy: request.scriptPolicy,
                        permittedWrites: request.permittedWrites,
                        timeoutMs: request.timeoutMs,
                        maxOutputBytes: request.maxOutputBytes,
                    }),
                });
                dispatch.assertExternalActionCaller(caller.sessionID);
                return output(runWin64Cases(workspaceRoot, request));
            });
            add("harness_verify", "Run the exact assigned managed validator gate", ["command"], async (args, child) => output(dispatch.verifyCommand(child.sessionID, String(args.command))));
            add("harness_trace", "Create an immutable role trace; filePath must be trace-root-relative orchestrations/<orchestrationId>/roles/<role>/<artifact-id>.md, without a .memory prefix or absolute workspace path", ["filePath", "content"], async (args, child) => output(dispatch.writeTrace(child.sessionID, String(args.filePath), String(args.content))));
            add("harness_source_edit", "Edit only an exact assigned source file", ["filePath", "expectedContent", "content"], async (args, child) => output(dispatch.editSource(child.sessionID, String(args.filePath), String(args.expectedContent), String(args.content))));
            add("harness_source_replace", "Replace one unique assigned source fragment", ["filePath", "expectedContent", "content"], async (args, child) => output(dispatch.replaceSource(child.sessionID, String(args.filePath), String(args.expectedContent), String(args.content))));
            add("harness_recovery_status", "Inspect the exact stopped managed run", [], async (_args, child) => output(await dispatch.recoveryStatus(child.sessionID)));
            add("harness_recovery_resolve", "Resolve the exact stopped native child", [], async (_args, child) => output(await dispatch.resolveRecovery(child.sessionID)));
            add("harness_recovery_release", "Permit only a new reviewed workflow after native proof", ["expectedTreeHash"], async (args, child) => output(await dispatch.releaseForFresh(child.sessionID, String(args.expectedTreeHash))));
        });
        await context.tool.reload();
        const activation = Promise.resolve()
            .then(() => waitForNativeAgentSource(context, abort.signal))
            .then(() => registerRoles(context, plan))
            .then(async (check) => {
            await check();
            verifyRoles = check;
        })
            .then(() => {
            if (abort.signal.aborted)
                throw new Error("V2 plugin unloaded before activation");
            activationMarker(plan);
            ready = true;
        })
            .catch((error) => {
            activationFailed = true;
            const message = error instanceof Error ? error.message : "";
            const safe = /^V2 (?:effective role|native agent|harness role|primary permissions|role permissions|routing|activation)/.test(message)
                ? message.slice(0, 160)
                : "native role activation unavailable";
            if (process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH)
                process.stderr.write(`opencode-harness: V2 role activation failed: ${safe}\n`);
            dispatch.interrupt("V2 effective permissions or activation marker unavailable");
        });
        return () => {
            for (const timer of backgroundObservers)
                clearInterval(timer);
            backgroundObservers.clear();
            abort.abort();
            void watch;
            void activation;
            dispatch.interrupt("V2 native plugin unloaded");
        };
    },
};
