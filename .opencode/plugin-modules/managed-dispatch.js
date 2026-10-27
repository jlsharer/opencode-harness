import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { withinScope, createDispatchController } from "./dispatch-controller.js";
import { formatTaskResultWrapper, createTaskThreadPolicy } from "./task-thread-policy.js";
import { validateTaskPacket } from "./task-contracts.js";
import { captureWorkspace, ignoredWorkspacePaths, captureArtifacts, assertAllowedTransition, verifyAcceptance, } from "./acceptance-proof.js";
import { enforceManagedTool } from "./managed-execution.js";
import { expandIndexedReferences, validateUsageTelemetry } from "./context-budget.js";
function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("managed dispatch requires an object");
    return value;
}
function identifier(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(value))
        throw new Error("managed dispatch requires an exact identifier");
    return value;
}
function readDocument(root, relative) {
    if (!path.isAbsolute(root) ||
        path.resolve(root) !== root ||
        fs.realpathSync(root) !== root ||
        relative.split("/").some((p) => !p || p === "." || p === ".."))
        throw new Error("unsafe workflow reference");
    const filename = path.join(root, relative);
    let current = path.parse(filename).root;
    for (const component of filename.slice(current.length).split(path.sep)) {
        current = path.join(current, component);
        if (fs.lstatSync(current).isSymbolicLink())
            throw new Error("workflow reference contains symlink");
    }
    const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
    try {
        const stat = fs.fstatSync(fd);
        if (!stat.isFile() || stat.size > 1048576)
            throw new Error("workflow specification exceeds bound");
        const bytes = fs.readFileSync(fd);
        const after = fs.fstatSync(fd);
        if (stat.ino !== after.ino || stat.size !== after.size || stat.mtimeMs !== after.mtimeMs)
            throw new Error("workflow changed during read");
        return {
            value: JSON.parse(bytes.toString("utf8")),
            digest: createHash("sha256").update(bytes).digest("hex"),
        };
    }
    finally {
        fs.closeSync(fd);
    }
}
function envelope(prompt) {
    if (typeof prompt !== "string" || prompt.length > 16384)
        throw new Error("invalid managed Task envelope");
    const match = /^<<<HARNESS_TASK_THREAD_POLICY_V1>>>\n([\s\S]*)\n<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>$/.exec(prompt);
    if (!match)
        throw new Error("invalid managed Task envelope");
    return record(JSON.parse(match[1]));
}
/** Unlimited by default; an explicit positive integer bounds retained controllers. */
export function parseWorkflowRegistryCapacity(value) {
    if (value === undefined || value === "unlimited")
        return null;
    if (typeof value === "string" && /^[1-9][0-9]*$/.test(value)) {
        const capacity = Number(value);
        if (Number.isSafeInteger(capacity))
            return capacity;
    }
    throw new Error("workflow registry capacity must be a positive safe integer when set");
}
export function parseDelegationPolicy(value) {
    if (value === undefined)
        return {
            mode: "blocking",
            resources: {},
            providerResources: {},
            maxQueuedUpdates: 4,
            maxUpdateBytes: 4096,
        };
    const input = typeof value === "string" ? JSON.parse(value) : value;
    const cfg = record(input);
    if (Object.keys(cfg).sort().join(",") !==
        "maxQueuedUpdates,maxUpdateBytes,mode,providerResources,resources")
        throw new Error("delegation policy requires exactly mode, resources, providerResources, maxQueuedUpdates, maxUpdateBytes");
    if (!["blocking", "background", "auto"].includes(String(cfg.mode)))
        throw new Error("invalid delegation mode");
    const bounded = (v, max) => {
        if (typeof v !== "number" || !Number.isSafeInteger(v) || v < 1 || v > max)
            throw new Error("invalid delegation bound");
        return v;
    };
    const resources = Object.create(null);
    for (const [name, raw] of Object.entries(record(cfg.resources))) {
        identifier(name);
        const entry = record(raw);
        if (Object.keys(entry).sort().join(",") !== "maxConcurrentRequests,orchestratorHeadroom")
            throw new Error("invalid physical resource fields");
        resources[name] = {
            maxConcurrentRequests: bounded(entry.maxConcurrentRequests, 16),
            orchestratorHeadroom: bounded(entry.orchestratorHeadroom, 16),
        };
        if (resources[name].orchestratorHeadroom > resources[name].maxConcurrentRequests)
            throw new Error("resource headroom exceeds capacity");
    }
    const providerResources = Object.create(null);
    for (const [provider, resource] of Object.entries(record(cfg.providerResources))) {
        identifier(provider);
        if (typeof resource !== "string" || !Object.hasOwn(resources, resource))
            throw new Error("provider resource is not declared");
        providerResources[provider] = resource;
    }
    if (Object.keys(resources).length > 16 || Object.keys(providerResources).length > 64)
        throw new Error("resource inventory exceeds bound");
    return {
        mode: cfg.mode,
        resources,
        providerResources,
        maxQueuedUpdates: bounded(cfg.maxQueuedUpdates, 16),
        maxUpdateBytes: bounded(cfg.maxUpdateBytes, 8192),
    };
}
/** Adapter-local memory is deliberately ephemeral. A new plugin instance cannot restore it. */
export function createManagedDispatch(options) {
    const registryCapacity = options.registryCapacity === undefined ? null : options.registryCapacity;
    if (registryCapacity !== null &&
        (!Number.isSafeInteger(registryCapacity) || registryCapacity < 1))
        throw new Error("invalid workflow registry capacity");
    const delegation = parseDelegationPolicy(options.delegation);
    const transport = options.backgroundTransport;
    let reconciling = false;
    let reconcileAgain = false;
    const runs = new Map();
    const knownChildren = new Set();
    let active = null;
    let stopped = false;
    let recoveryOwner = null;
    let recoveryId = null;
    let recoveryReason = null;
    let recoveryBefore = null;
    let recoveryAllowedPaths = [];
    let recoveryProofReady = false;
    let recoveryResolving = false;
    let recoveryFault = false;
    let terminationReconciled = false;
    let recoveries = 0;
    const report = options.telemetry ?? (() => { });
    function snapshot(id, validationInputs = runs.get(id)?.controller.spec.validationInputs ?? []) {
        return captureWorkspace(options.workspaceRoot, {
            validationInputs,
            ...(options.traceRoot === path.join(options.workspaceRoot, ".memory")
                ? { excludePaths: [`.memory/orchestrations/${id}`] }
                : {}),
        });
    }
    function verifySpec(run) {
        if (readDocument(options.traceRoot, run.marker).value === null)
            throw new Error("non-resumable start marker missing");
        if (readDocument(options.traceRoot, run.source).digest !== run.digest)
            throw new Error("workflow changed after registration; restart requires a fresh orchestration ID");
    }
    function interrupt(reason, terminal) {
        if (stopped && active && !terminal)
            recoveryFault = true;
        recoveryProofReady = false;
        if (!stopped) {
            recoveryOwner = active?.run.parent ?? terminal?.parent ?? null;
            recoveryId = active?.context.orchestrationId ?? terminal?.orchestrationId ?? null;
            recoveryReason = reason;
            if (active) {
                recoveryBefore = active.before;
                const unit = active.run.controller.spec.workUnits.find((entry) => entry.id === active.context.scopeKey);
                recoveryAllowedPaths =
                    active.context.role === "implementer" ? (unit?.allowedPaths ?? []) : [];
            }
        }
        if (terminal &&
            !active &&
            terminal.parent === recoveryOwner &&
            terminal.orchestrationId === recoveryId) {
            terminationReconciled = true;
            recoveryFault = false;
        }
        stopped = true;
        if (active?.timer)
            clearTimeout(active.timer);
        for (const run of runs.values())
            run.controller.interrupt();
        report({ event: "interrupted", mode: "ephemeral", resumable: false, reason });
        if (active?.background && active.childId && transport)
            void cancelBackground(active.run.parent, reason).catch(() => report({ event: "termination-uncertain", mode: "ephemeral", resumable: false }));
    }
    async function chooseBackground(parent, role, requested) {
        if (requested !== undefined && typeof requested !== "boolean")
            throw new Error("background must be boolean");
        if (delegation.mode === "blocking") {
            if (requested === true)
                throw new Error("managed background delegation is disabled");
            return null;
        }
        if (requested === false)
            return null;
        let reason = "native background/session capabilities unavailable";
        if (transport?.enabled) {
            let models;
            try {
                models = await transport.models(parent, role);
            }
            catch {
                if (delegation.mode === "auto" && requested !== true) {
                    report({ event: "background-fallback", reason: "native model identity unavailable" });
                    return null;
                }
                throw new Error("native model identity unavailable for background admission");
            }
            const provider = (model) => {
                if (!/^[^/\s]+\/[^\s]+$/.test(model))
                    throw new Error("native model identity unavailable");
                return model.split("/")[0];
            };
            const parentResource = delegation.providerResources[provider(models.parent)];
            const workerResource = delegation.providerResources[provider(models.worker)];
            if (parentResource && workerResource) {
                const worker = delegation.resources[workerResource];
                // Reserve declared headroom even for a separate orchestrator resource:
                // it also covers native auxiliary requests on the worker resource.
                if (worker.maxConcurrentRequests - worker.orchestratorHeadroom >= 1)
                    return models.worker;
                reason = "physical resource has no worker capacity after reserved orchestrator headroom";
            }
            else
                reason = "actual parent/worker provider lacks explicit physical-resource mapping";
        }
        if (delegation.mode === "background" || requested === true)
            throw new Error(reason);
        report({ event: "background-fallback", reason });
        return null;
    }
    async function cancelBackground(parent, reason = "explicit cancellation") {
        const task = active;
        if (!task?.background || task.run.parent !== parent || !task.childId || !transport)
            throw new Error("no bound background worker to cancel");
        if (task.termination)
            return task.termination;
        const state = task.run.controller
            .snapshot()
            .attempts.find((a) => a.id === task.context.delegationTaskId)?.state;
        if (state !== "cancel-requested")
            task.run.controller.cancel(task.context.delegationTaskId);
        if (task.timer)
            clearTimeout(task.timer);
        report({ event: "cancel-requested", delegationTaskId: task.context.delegationTaskId, reason });
        // Publish the single termination promise before invoking native abort: abort itself
        // may emit session.error and re-enter interruption. Never release on acknowledgement alone.
        task.termination = Promise.resolve()
            .then(async () => {
            const launchedWhenAbortRequested = task.nativeStarted;
            await transport.abort(task.childId);
            if (!launchedWhenAbortRequested) {
                // A session-created event can precede native job launch. Idle then is not
                // termination proof: retain capacity and abort again once launch is observed.
                if (!task.nativeStarted)
                    await new Promise((resolve) => {
                        task.startWaiter = resolve;
                    });
                await transport.abort(task.childId);
            }
            const observed = await transport.inspect(task.childId);
            if (active !== task ||
                observed.parent !== parent ||
                !observed.idle ||
                (task.nativeJobStartedAt !== undefined &&
                    (observed.job?.startedAt !== task.nativeJobStartedAt ||
                        typeof observed.job.completedAt !== "number" ||
                        !Number.isSafeInteger(observed.job.completedAt) ||
                        observed.job.completedAt < observed.job.startedAt ||
                        observed.job.status === "running")))
                throw new Error("native termination not reconciled; capacity retained");
            task.run.controller.reconcileCancelled(task.context.delegationTaskId);
            recoveryBefore = task.before;
            const unit = task.run.controller.spec.workUnits.find((entry) => entry.id === task.context.scopeKey);
            recoveryAllowedPaths =
                task.context.role === "implementer" ? (unit?.allowedPaths ?? []) : [];
            active = null;
            interrupt("background cancellation reconciled; fresh reviewed workflow required", {
                parent,
                orchestrationId: task.context.orchestrationId,
            });
        })
            .catch((error) => {
            interrupt("native abort or idle reconciliation failed; termination uncertain");
            throw error;
        })
            .finally(() => {
            task.terminationSettled = true;
        });
        return task.termination;
    }
    async function reconcileBackground(child) {
        const task = active;
        if (!task?.background || !task.acknowledged || !task.childId || !transport || stopped)
            return;
        if (task.reconciledMessages === task.expectedMessages)
            return;
        if (child !== undefined && child !== task.childId)
            return;
        if (reconciling) {
            reconcileAgain = true;
            return;
        }
        reconciling = true;
        try {
            const revision = task.revision;
            const observed = await transport.inspect(task.childId);
            if (active !== task || stopped || task.revision !== revision || !observed.idle)
                return;
            if (observed.parent !== task.run.parent)
                throw new Error("native background parent identity mismatch");
            if (observed.job) {
                const job = observed.job;
                if (!Number.isSafeInteger(job.startedAt) ||
                    typeof job.completedAt !== "number" ||
                    !Number.isSafeInteger(job.completedAt) ||
                    job.completedAt < job.startedAt ||
                    task.nativeJobStartedAt !== job.startedAt ||
                    job.status !== "completed" ||
                    typeof job.output !== "string" ||
                    job.output.length > 32768)
                    throw new Error("native background Job completion is not correlated");
                if (task.updateCalls.size || task.pendingLaunches.size)
                    return;
                const completion = completeTask({ callID: task.callId }, {
                    metadata: { sessionId: task.childId },
                    output: formatTaskResultWrapper(job.output, task.childId),
                });
                if (completion.outcome === "clarification")
                    task.reconciledMessages = task.expectedMessages;
                else if (task.timer)
                    clearTimeout(task.timer);
                return;
            }
            if (observed.messages.length > 256)
                throw new Error("native message inventory exceeds bound");
            const messages = observed.messages.map(record);
            const users = messages.filter((m) => record(m.info).role === "user");
            if (users.length < task.expectedMessages)
                return; // Native queued update has not run yet.
            if (users.length !== task.expectedMessages)
                throw new Error("unregistered child context mutation");
            const lastUser = record(users.at(-1)?.info);
            const assistant = messages.findLast((m) => record(m.info).role === "assistant" && record(m.info).parentID === lastUser.id);
            if (!assistant)
                return;
            const info = record(assistant.info);
            if (info.error)
                throw new Error("native background worker failed");
            if (!record(info.time).completed ||
                !info.finish ||
                ["tool-calls", "unknown"].includes(String(info.finish)))
                return;
            if (!Array.isArray(assistant.parts))
                throw new Error("native result parts unavailable");
            const parts = assistant.parts.map(record);
            if (parts.some((p) => p.type === "tool" && record(p.state).status === "error"))
                throw new Error("native background tool failed");
            const text = parts.findLast((p) => p.type === "text")?.text;
            if (typeof text !== "string" || text.length > 32768)
                throw new Error("native terminal result unavailable or oversized");
            if (task.updateCalls.size)
                return;
            const completion = completeTask({ callID: task.callId }, {
                metadata: { sessionId: task.childId },
                output: formatTaskResultWrapper(text, task.childId),
            });
            if (completion.outcome === "clarification")
                task.reconciledMessages = task.expectedMessages;
            else if (task.timer)
                clearTimeout(task.timer);
        }
        catch (error) {
            interrupt("background result reconciliation rejected");
            throw error;
        }
        finally {
            reconciling = false;
            if (reconcileAgain) {
                reconcileAgain = false;
                await reconcileBackground();
            }
        }
    }
    let dispatching = false;
    function recoveryCaller(sessionID) {
        const id = identifier(sessionID);
        if (!stopped || !recoveryOwner || id !== recoveryOwner || knownChildren.has(id))
            throw new Error("managed recovery requires the bound stopped parent");
        return id;
    }
    /** Retry a failed or unobserved native termination without replaying the old Task.
     * An acknowledged launch is mandatory: abort+idle before launch is not a fence.
     */
    async function resolveRecovery(sessionID) {
        const parent = recoveryCaller(sessionID);
        if (recoveryResolving)
            throw new Error("managed recovery termination already in progress");
        const task = active;
        if (!task ||
            !recoveryId ||
            task.context.orchestrationId !== recoveryId ||
            !task.childId ||
            !transport ||
            task.pendingLaunches.size !== 0 ||
            (!task.background && !task.foregroundCompleted) ||
            (task.termination && !task.terminationSettled))
            return {
                state: "blocked",
                reason: "native launch or child identity has not been reconciled; await the native Task callback",
            };
        recoveryResolving = true;
        recoveryProofReady = false;
        try {
            // A completed blocking Task needs only inspection. For an interrupted
            // background Task, a fresh abort acknowledgement is required even if an
            // earlier abort failed or appeared to succeed before termination.
            if (task.background)
                await transport.abort(task.childId);
            const observed = await transport.inspect(task.childId);
            if (active !== task ||
                !stopped ||
                observed.parent !== parent ||
                !observed.idle ||
                (task.nativeJobStartedAt !== undefined &&
                    (observed.job?.startedAt !== task.nativeJobStartedAt ||
                        typeof observed.job.completedAt !== "number" ||
                        !Number.isSafeInteger(observed.job.completedAt) ||
                        observed.job.completedAt < observed.job.startedAt ||
                        observed.job.status === "running")) ||
                task.pendingLaunches.size !== 0)
                throw new Error("native child termination or parent identity remains uncertain");
            const state = task.run.controller
                .snapshot()
                .attempts.find((entry) => entry.id === task.context.delegationTaskId)?.state;
            if (state === "cancel-requested")
                task.run.controller.reconcileCancelled(task.context.delegationTaskId);
            else if (state !== "cancelled")
                throw new Error("old task is not terminal or cancel-requested");
            recoveryBefore = task.before;
            const unit = task.run.controller.spec.workUnits.find((entry) => entry.id === task.context.scopeKey);
            recoveryAllowedPaths = task.context.role === "implementer" ? (unit?.allowedPaths ?? []) : [];
            active = null;
            terminationReconciled = true;
            recoveryFault = false;
            report({ event: "recovery-termination-reconciled", priorOrchestrationId: recoveryId });
            return { state: "terminated", orchestrationId: recoveryId };
        }
        catch {
            return {
                state: "blocked",
                reason: "native abort, identity, or idle proof unavailable",
            };
        }
        finally {
            recoveryResolving = false;
        }
    }
    async function recoveryStatus(sessionID) {
        const parent = recoveryCaller(sessionID);
        recoveryProofReady = false;
        const blocked = (reason) => ({
            state: "blocked",
            orchestrationId: recoveryId,
            reason,
            nextAction: "retain the old marker; await pending native callbacks or retry harness_recovery_resolve, then request status again",
        });
        if (!recoveryId ||
            !recoveryReason ||
            !recoveryBefore ||
            recoveryFault ||
            recoveryResolving ||
            dispatching ||
            reconciling ||
            recoveries >= 4)
            return blocked("recovery state is uncertain or process limit reached");
        const task = active;
        if (task) {
            if (task.background ||
                !task.foregroundCompleted ||
                task.pendingLaunches.size !== 0 ||
                !task.childId ||
                !transport)
                return blocked("native worker launch or termination remains unverified");
            try {
                const observed = await transport.inspect(task.childId);
                if (!stopped || active !== task || observed.parent !== parent || !observed.idle)
                    return blocked("native worker is not confirmed idle under the bound parent");
            }
            catch {
                return blocked("native session identity or idle status is unavailable");
            }
        }
        else if (!terminationReconciled)
            return blocked("native termination was not reconciled");
        try {
            for (const run of runs.values())
                verifySpec(run);
            const current = snapshot(recoveryId);
            assertAllowedTransition(recoveryBefore, current, recoveryAllowedPaths);
            const changed = [
                ...new Set([...Object.keys(recoveryBefore.files), ...Object.keys(current.files)]),
            ]
                .filter((name) => recoveryBefore.files[name] !== current.files[name])
                .sort();
            if (changed.length > 32)
                return blocked("workspace effects exceed review bound");
            recoveryProofReady = true;
            return {
                state: "ready",
                orchestrationId: recoveryId,
                treeHash: current.treeHash,
                changedFiles: changed,
                reason: recoveryReason,
                nextAction: "review workspace effects, then request fresh-only release with this tree hash",
            };
        }
        catch {
            return blocked("workflow marker, specification or workspace inventory changed");
        }
    }
    async function releaseForFresh(sessionID, expectedTreeHash) {
        const parent = recoveryCaller(sessionID);
        if (typeof expectedTreeHash !== "string" || !/^[a-f0-9]{64}$/.test(expectedTreeHash))
            throw new Error("managed recovery requires an exact reviewed tree hash");
        if (recoveryResolving)
            throw new Error("managed recovery termination still in progress");
        const proof = await recoveryStatus(parent);
        if (proof.state !== "ready" || proof.treeHash !== expectedTreeHash)
            throw new Error("managed recovery cannot release an uncertain or changed worker");
        for (const run of runs.values())
            verifySpec(run);
        if (snapshot(recoveryId).treeHash !== expectedTreeHash)
            throw new Error("managed recovery workspace changed after native reconciliation");
        const prior = recoveryId;
        active = null;
        stopped = false;
        recoveryOwner = null;
        recoveryId = null;
        recoveryReason = null;
        recoveryBefore = null;
        recoveryAllowedPaths = [];
        recoveryProofReady = false;
        recoveryFault = false;
        terminationReconciled = false;
        recoveries++;
        report({ event: "fresh-recovery-enabled", priorOrchestrationId: prior, resumable: false });
        return { state: "fresh-only", priorOrchestrationId: prior, treeHash: proof.treeHash };
    }
    function interruptIfCurrent(sessionID, reason) {
        if (!active)
            return false;
        if (sessionID !== undefined && sessionID !== active.run.parent && sessionID !== active.childId)
            return false;
        interrupt(reason);
        return true;
    }
    async function beforeTask(input, args) {
        if (dispatching)
            throw new Error("managed dispatch admission already in progress");
        dispatching = true;
        try {
            await admitTask(input, args);
        }
        finally {
            dispatching = false;
        }
    }
    async function admitTask(input, args) {
        if (stopped)
            throw new Error("managed run interrupted; non-resumable");
        const parent = identifier(input.sessionID);
        if (knownChildren.has(parent))
            throw new Error("managed children cannot delegate, including after completion");
        const callId = identifier(input.callID);
        const parsed = envelope(args.prompt);
        if (Object.hasOwn(args, "task_id") &&
            ["queued-update", "cancel"].includes(String(parsed.kind))) {
            const task = active;
            if (!task?.background ||
                !task.acknowledged ||
                task.run.parent !== parent ||
                task.childId !== args.task_id ||
                !transport)
                throw new Error("no bound background reservation for control");
            const keys = parsed.kind === "cancel"
                ? "delegationTaskId,kind,requestId,version"
                : "context,delegationTaskId,kind,requestId,version";
            if (Object.keys(parsed).sort().join(",") !== keys ||
                parsed.version !== 1 ||
                parsed.delegationTaskId !== task.context.delegationTaskId ||
                args.subagent_type !== task.context.role)
                throw new Error("background control must preserve exact task identity");
            const requestId = identifier(parsed.requestId);
            if (task.updateIds.has(requestId) || task.controlCalls.has(callId) || callId === task.callId)
                throw new Error("duplicate background control");
            if (parsed.kind === "cancel") {
                task.updateIds.add(requestId);
                task.controlCalls.add(callId);
                await cancelBackground(parent);
                throw new Error("Background task cancelled and termination reconciled; no new Task dispatched");
            }
            task.run.controller.sweep();
            if (task.run.controller.snapshot().attempts.find((a) => a.id === task.context.delegationTaskId)
                ?.state !== "running")
                throw new Error("background worker is not running");
            verifySpec(task.run);
            if (task.revision >= delegation.maxQueuedUpdates ||
                typeof parsed.context !== "string" ||
                !parsed.context.trim() ||
                Buffer.byteLength(parsed.context) > delegation.maxUpdateBytes)
                throw new Error("queued update exceeds configured bound");
            // Reject a terminal child rather than allowing native Task to resurrect it.
            const observed = await transport.inspect(task.childId);
            if (active !== task || stopped || observed.parent !== parent || observed.idle)
                throw new Error("worker is no longer running; use a fresh task");
            if (task.revision >= delegation.maxQueuedUpdates || task.updateIds.has(requestId))
                throw new Error("queued update reservation lost");
            task.run.controller.chargeContinuation(task.context.delegationTaskId);
            task.updateIds.add(requestId);
            task.updateCalls.add(callId);
            task.pendingLaunches.add(callId);
            task.nativeStarted = false;
            task.controlCalls.add(callId);
            task.revision++;
            task.expectedMessages++;
            task.commands = [];
            args.background = true;
            args.prompt =
                "Queued context update for the SAME immutable task; no scope or permission expansion. Return the original structured task result after incorporating this context.\n" +
                    parsed.context;
            report({
                event: "context-update-queued",
                delegationTaskId: task.context.delegationTaskId,
                revision: task.revision,
                bytes: Buffer.byteLength(parsed.context),
            });
            return;
        }
        if (Object.hasOwn(args, "task_id")) {
            if (!active || active.run.parent !== parent || active.childId !== args.task_id)
                throw new Error("no live clarification reservation");
            active.run.controller.sweep();
            if (active.run.controller
                .snapshot()
                .attempts.find((a) => a.id === active.context.delegationTaskId)?.state !==
                "awaiting-guidance")
                throw new Error("stale clarification reservation");
            verifySpec(active.run);
            active.run.policy.beforeTask({ sessionID: parent, callID: callId, args });
            active.run.controller.continueClarification(active.context.delegationTaskId);
            active.callId = callId;
            if (active.background) {
                active.acknowledged = false;
                active.pendingLaunches.add(callId);
                active.nativeStarted = false;
                active.expectedMessages++;
                args.background = true;
            }
            else {
                active.foregroundCompleted = false;
                active.pendingLaunches.add(callId);
            }
            return;
        }
        // The native adapter stays serial even if the pure controller supports independent readers.
        if (active) {
            active.run.controller.sweep();
            throw new Error("managed capacity reserved; complete or reconcile the current task");
        }
        createTaskThreadPolicy().validateBeforeTask({ sessionID: parent, callID: callId, args });
        const role = parsed.role;
        const packet = validateTaskPacket(role, parsed.packet);
        const workerModel = await chooseBackground(parent, role, args.background);
        const background = workerModel !== null;
        args.background = background;
        const orchestrationId = identifier(packet.orchestrationId);
        if (orchestrationId.includes(":"))
            throw new Error("unsafe orchestration path");
        const source = `orchestrations/${orchestrationId}/normalized-spec.json`;
        const doc = readDocument(options.traceRoot, source);
        let run = runs.get(orchestrationId);
        if (!run) {
            if (registryCapacity !== null && runs.size >= registryCapacity)
                throw new Error("workflow registry capacity reached");
            const controller = createDispatchController(doc.value, {
                ...(options.now ? { now: options.now } : {}),
                ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
            });
            if (controller.spec.orchestrationId !== orchestrationId)
                throw new Error("workflow identity mismatch");
            const baseline = snapshot(orchestrationId, controller.spec.validationInputs);
            const marker = `orchestrations/${orchestrationId}/dispatch-started.json`;
            try {
                fs.writeFileSync(path.join(options.traceRoot, marker), JSON.stringify({ mode: "ephemeral", resumable: false, orchestrationId }) + "\n", { flag: "wx", mode: 0o600 });
            }
            catch {
                throw new Error("orchestration ID already started or cannot be reserved; non-resumable, use a fresh reviewed ID");
            }
            run = {
                marker,
                controller,
                policy: createTaskThreadPolicy(),
                digest: doc.digest,
                parent,
                source,
                baseline,
                accepted: new Map(),
            };
            runs.set(orchestrationId, run);
        }
        if (run.parent !== parent || run.digest !== doc.digest)
            throw new Error("workflow owner or content changed");
        const context = {
            orchestrationId,
            delegationTaskId: identifier(packet.delegationTaskId),
            scopeKey: identifier(packet.scopeKey),
            role,
            taskMode: String(packet.taskMode),
        };
        const before = snapshot(orchestrationId);
        for (const [gate, proof] of run.accepted) {
            if (!run.controller.snapshot().gates[gate]) {
                run.accepted.delete(gate);
                continue;
            }
            if (proof.tree.treeHash !== before.treeHash)
                throw new Error("accepted scope changed; begin a fresh workflow");
            const currentArtifacts = captureArtifacts(options.traceRoot, Object.keys(proof.artifacts));
            if (Object.keys(proof.artifacts).some((file) => proof.artifacts[file] !== currentArtifacts[file]))
                throw new Error("accepted artifact changed; begin a fresh workflow");
        }
        const unit = run.controller.spec.workUnits.find((entry) => entry.id === context.scopeKey);
        if (!unit)
            throw new Error("unknown work unit scope");
        if (role === "implementer" &&
            packet.targetPaths.some((file) => !withinScope(file, unit.allowedPaths)))
            throw new Error("packet target exceeds declared scope");
        assertAllowedTransition(run.baseline, before, run.controller.spec.allowedPaths);
        // Optional explicitly indexed context is validated and measured, never recursively retrieved.
        const contextFile = path.join(options.traceRoot, `orchestrations/${orchestrationId}/context-index.json`);
        if (fs.existsSync(contextFile)) {
            const indexDoc = record(readDocument(options.traceRoot, `orchestrations/${orchestrationId}/context-index.json`)
                .value);
            const requests = record(indexDoc.tasks);
            const requested = requests[context.delegationTaskId];
            if (requested !== undefined) {
                if (!Array.isArray(requested) || requested.some((v) => typeof v !== "string"))
                    throw new Error("invalid requested context IDs");
                const expanded = await expandIndexedReferences(options.workspaceRoot, record(indexDoc.index), requested, { maxEntries: 8, maxBytes: 32768, maxReferenceBytes: 8192 });
                // Evidence is delivered through existing packet fields, not an unvalidated prompt suffix.
                const field = role === "researcher"
                    ? "sourceConstraints"
                    : role === "planner"
                        ? "researchEvidence"
                        : role === "implementer"
                            ? "preservationRequirements"
                            : "schemaContracts";
                const original = packet[field];
                packet[field] = [
                    ...original,
                    ...expanded.entries.map((entry) => `${entry.path} sha256=${entry.sha256}\n${entry.content}`),
                ];
                validateTaskPacket(role, packet);
                args.prompt = `<<<HARNESS_TASK_THREAD_POLICY_V1>>>\n${JSON.stringify({ ...parsed, packet })}\n<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>`;
                report({
                    event: "context-expanded",
                    references: expanded.entries.length,
                    bytes: expanded.bytes,
                    tokens: null,
                });
            }
        }
        // Recheck after asynchronous context reads before atomically reserving.
        if (active || stopped)
            throw new Error("managed dispatch reservation lost");
        verifySpec(run);
        if (snapshot(orchestrationId).treeHash !== before.treeHash)
            throw new Error("workspace changed while expanding context");
        // Goals are validated by the controller but intentionally omitted from its projection.
        const selected = record(doc.value).workUnits;
        const selectedGoal = Array.isArray(selected)
            ? selected.find((entry) => record(entry).id === context.scopeKey)
            : undefined;
        const goal = selectedGoal ? record(selectedGoal).goal : null;
        const safeGoal = run.controller.spec.roleModeTaskMapping.some((mapping) => mapping.workUnitId === context.scopeKey &&
            mapping.role === role &&
            mapping.taskMode === context.taskMode) &&
            typeof goal === "string" &&
            goal.length > 0 &&
            goal.length <= 240 &&
            !/[\u0000-\u001f\u007f-\u009f]/.test(goal)
            ? goal
            : null;
        run.policy.validateBeforeTask({ sessionID: parent, callID: callId, args });
        run.controller.reserve({
            id: context.delegationTaskId,
            workUnitId: context.scopeKey,
            role,
            taskMode: context.taskMode,
            parentSessionId: parent,
        });
        if (role === "implementer")
            run.accepted.clear();
        try {
            run.policy.beforeTask({ sessionID: parent, callID: callId, args });
        }
        catch (error) {
            run.controller.failLaunch(context.delegationTaskId);
            throw error;
        }
        active = {
            run,
            context,
            goal: safeGoal,
            packet,
            before,
            callId,
            commands: [],
            pendingCommands: new Map(),
            background,
            workerModel,
            acknowledged: false,
            nativeStarted: false,
            pendingLaunches: new Set([callId]),
            acknowledgedCalls: new Set(),
            expectedMessages: 1,
            reconciledMessages: 0,
            revision: 0,
            updateIds: new Set(),
            updateCalls: new Set(),
            controlCalls: new Set(),
        };
        report({
            event: "reserved",
            delegationTaskId: context.delegationTaskId,
            mode: "ephemeral",
            usage: validateUsageTelemetry(undefined),
        });
    }
    function sessionCreated(info) {
        if (!active || info.parentID !== active.run.parent)
            return;
        const childId = identifier(info.id);
        if (active.childId && active.childId !== childId) {
            interrupt("ambiguous child creation");
            throw new Error("multiple children for one managed reservation");
        }
        active.childId = childId;
        knownChildren.add(childId);
        if (stopped && active.background) {
            void cancelBackground(active.run.parent, "child bound after interruption").catch(() => report({ event: "termination-uncertain", mode: "ephemeral", resumable: false }));
            return;
        }
        if (active.background && !active.timer) {
            const task = active;
            const deadline = task.run.controller
                .snapshot()
                .attempts.find((a) => a.id === task.context.delegationTaskId).deadline;
            task.timer = setTimeout(() => {
                void cancelBackground(task.run.parent, "deadline").catch(() => interrupt("background timeout termination uncertain"));
            }, Math.max(1, deadline - (options.now ?? Date.now)()));
            task.timer.unref?.();
        }
    }
    function beforeTool(input, args) {
        if (["harness_recovery_status", "harness_recovery_resolve", "harness_recovery_release"].includes(String(input.tool))) {
            recoveryCaller(input.sessionID);
            if (input.tool !== "harness_recovery_release" && Object.keys(args).length)
                throw new Error("managed recovery status and resolve have no arguments");
            if (input.tool === "harness_recovery_release" &&
                (Object.keys(args).length !== 1 || !Object.hasOwn(args, "expectedTreeHash")))
                throw new Error("managed recovery release requires only expectedTreeHash");
            return args;
        }
        if (stopped &&
            recoveryProofReady &&
            input.sessionID === recoveryOwner &&
            ["read", "grep", "glob", "list"].includes(String(input.tool)))
            return args;
        if (stopped)
            throw new Error("managed run interrupted; tools disabled until a new reviewed workflow process");
        if (!active) {
            if (typeof input.sessionID === "string" && knownChildren.has(input.sessionID))
                throw new Error("terminal managed child cannot execute tools");
            return args;
        }
        if (active.background && input.sessionID === active.run.parent) {
            if (["question", "todowrite", "todoread"].includes(String(input.tool)))
                return args;
            throw new Error("parent workspace tools are blocked while background worker owns the workspace; conversation and Task controls remain available");
        }
        active.run.controller.sweep();
        const state = active.run.controller
            .snapshot()
            .attempts.find((a) => a.id === active.context.delegationTaskId)?.state;
        if (state !== "running")
            throw new Error("managed task is not running; termination must be reconciled");
        if (input.sessionID !== active.childId)
            throw new Error("unbound session cannot execute tools during managed dispatch");
        verifySpec(active.run);
        const unit = active.run.controller.spec.workUnits.find((u) => u.id === active.context.scopeKey);
        const role = active.context.role;
        if (input.tool === "harness_verify" || input.tool === "harness_trace") {
            if (input.tool === "harness_verify" &&
                (role !== "validator" ||
                    !active.packet.commandsToRun.includes(args.command)))
                throw new Error("managed verification requires an assigned validator command");
            return args;
        }
        if (input.tool === "harness_source_edit" || input.tool === "harness_source_replace") {
            if (role !== "implementer" ||
                !active.packet.targetPaths.includes(args.filePath))
                throw new Error("managed source edit requires an assigned implementer target");
            return args;
        }
        const commands = role === "validator"
            ? active.run.controller.spec.acceptanceGates
                .filter((g) => unit.acceptanceGateIds.includes(g.id))
                .map((g) => g.evidenceCommand)
            : role === "implementer"
                ? active.packet.verificationCommands
                : [];
        const traceRelative = path
            .relative(options.workspaceRoot, options.traceRoot)
            .split(path.sep)
            .join("/");
        const traceScope = !traceRelative.startsWith("..") && !path.isAbsolute(traceRelative)
            ? `${traceRelative}/orchestrations/${active.context.orchestrationId}/roles/${role}/`
            : null;
        const allowedPaths = [
            ...(role === "implementer" ? unit.allowedPaths : []),
            ...(traceScope ? [traceScope] : []),
        ];
        const tool = String(input.tool);
        let result;
        const requestedFile = typeof args.filePath === "string" ? path.resolve(options.workspaceRoot, args.filePath) : "";
        const tracePrefix = path.join(options.traceRoot, "orchestrations", active.context.orchestrationId, "roles", role) + path.sep;
        if ((tool === "edit" || tool === "write") &&
            requestedFile.startsWith(tracePrefix) &&
            requestedFile.endsWith(".md")) {
            result = enforceManagedTool({
                tool,
                args: { ...args, filePath: requestedFile },
                role: "implementer",
                allowedPaths: [`orchestrations/${active.context.orchestrationId}/roles/${role}/`],
                workspaceRoot: options.traceRoot,
                commands: [],
            });
        }
        else
            result = enforceManagedTool({
                tool,
                args,
                role,
                allowedPaths,
                workspaceRoot: options.workspaceRoot,
                commands,
                hiddenPaths: tool === "bash" ? ignoredWorkspacePaths(options.workspaceRoot) : [],
                validationInputs: active.run.controller.spec.validationInputs,
            });
        if (tool === "bash")
            result.timeout = Math.min(typeof result.timeout === "number" && result.timeout > 0 ? result.timeout : 300000, Math.max(1, active.run.controller
                .snapshot()
                .attempts.find((a) => a.id === active.context.delegationTaskId).deadline -
                (options.now ?? Date.now)()));
        if (tool === "bash")
            active.pendingCommands.set(identifier(input.callID), {
                command: String(args.command),
                treeHash: snapshot(active.context.orchestrationId).treeHash,
                revision: active.revision,
            });
        return result;
    }
    function afterTool(input, output) {
        if (!active || input.tool !== "bash")
            return;
        if (input.sessionID !== active.childId)
            throw new Error("unbound command result");
        const callId = identifier(input.callID);
        const observation = active.pendingCommands.get(callId);
        if (!observation)
            throw new Error("uncorrelated command result");
        active.pendingCommands.delete(callId);
        const metadata = record(output.metadata);
        const exitCode = metadata.exit;
        if (!Number.isInteger(exitCode))
            throw new Error("native command exit status unavailable; cannot accept evidence");
        if (snapshot(active.context.orchestrationId).treeHash !== observation.treeHash)
            throw new Error("command changed the validation tree");
        if (observation.revision !== active.revision)
            return;
        active.commands.push({
            command: observation.command,
            exitCode: exitCode,
            treeHash: observation.treeHash,
            taskId: active.context.delegationTaskId,
        });
    }
    function verifyCommand(sessionID, command) {
        if (!active || active.childId !== sessionID || active.context.role !== "validator")
            throw new Error("managed verification requires the bound validator child");
        const callID = randomUUID();
        const prepared = beforeTool({ sessionID, callID, tool: "bash" }, { command });
        const run = spawnSync("/bin/sh", ["-c", prepared.command], {
            cwd: prepared.workdir,
            timeout: prepared.timeout,
            encoding: "utf8",
            maxBuffer: 1024 * 1024,
        });
        if (run.error || !Number.isInteger(run.status)) {
            active?.pendingCommands.delete(callID);
            throw new Error("isolated verification did not provide a native process exit status");
        }
        afterTool({ sessionID, callID, tool: "bash" }, { metadata: { exit: run.status } });
        return { command, exitCode: run.status, stdout: run.stdout, stderr: run.stderr };
    }
    function writeTrace(sessionID, filePath, content) {
        if (!active || active.childId !== sessionID)
            throw new Error("managed trace creation requires the bound role child");
        const prefix = `orchestrations/${active.context.orchestrationId}/roles/${active.context.role}/`;
        if (typeof filePath !== "string" ||
            !filePath.startsWith(prefix) ||
            !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}\.md$/.test(filePath.slice(prefix.length)))
            throw new Error("managed trace outside assigned role directory");
        if (typeof content !== "string" || !content.trim() || Buffer.byteLength(content) > 65536)
            throw new Error("managed trace content exceeds bound or is empty");
        const absolute = path.join(options.traceRoot, filePath);
        const args = beforeTool({ sessionID, tool: "write" }, { filePath: absolute, content });
        fs.mkdirSync(path.dirname(args.filePath), { recursive: true, mode: 0o700 });
        const checked = beforeTool({ sessionID, tool: "write" }, { filePath: absolute, content });
        fs.writeFileSync(checked.filePath, content, { flag: "wx", mode: 0o600 });
        return path
            .relative(options.traceRoot, checked.filePath)
            .split(path.sep)
            .join("/");
    }
    function editSource(sessionID, filePath, expectedContent, content) {
        if (!active || active.childId !== sessionID || active.context.role !== "implementer")
            throw new Error("managed source edit requires the bound implementer child");
        if (typeof filePath !== "string" || !active.packet.targetPaths.includes(filePath))
            throw new Error("managed source edit outside assigned target paths");
        if (typeof expectedContent !== "string" ||
            typeof content !== "string" ||
            !content.trim() ||
            content.includes("\0") ||
            Buffer.byteLength(expectedContent) > 65536 ||
            Buffer.byteLength(content) > 65536 ||
            expectedContent === content)
            throw new Error("managed source edit requires bounded distinct UTF-8 contents");
        let checked = beforeTool({ sessionID, tool: "write" }, { filePath, content });
        if (expectedContent === "") {
            fs.mkdirSync(path.dirname(checked.filePath), { recursive: true, mode: 0o700 });
            checked = beforeTool({ sessionID, tool: "write" }, { filePath, content });
            fs.writeFileSync(checked.filePath, content, { flag: "wx", mode: 0o644 });
        }
        else {
            const fd = fs.openSync(checked.filePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
            try {
                const stat = fs.fstatSync(fd);
                if (!stat.isFile() ||
                    stat.size > 65536 ||
                    !fs.readFileSync(fd).equals(Buffer.from(expectedContent, "utf8")))
                    throw new Error("managed source edit stale or mismatched prior content");
                const current = fs.lstatSync(checked.filePath);
                if (current.isSymbolicLink() || current.dev !== stat.dev || current.ino !== stat.ino)
                    throw new Error("managed source edit target changed before write");
                fs.writeFileSync(checked.filePath, content);
            }
            finally {
                fs.closeSync(fd);
            }
        }
        return { filePath, sha256: createHash("sha256").update(content).digest("hex") };
    }
    function replaceSource(sessionID, filePath, expectedContent, content) {
        if (!active || active.childId !== sessionID || active.context.role !== "implementer")
            throw new Error("managed source replacement requires the bound implementer child");
        if (typeof filePath !== "string" || !active.packet.targetPaths.includes(filePath))
            throw new Error("managed source replacement outside assigned target paths");
        if (typeof expectedContent !== "string" ||
            typeof content !== "string" ||
            !expectedContent ||
            expectedContent === content ||
            expectedContent.includes("\0") ||
            content.includes("\0") ||
            Buffer.byteLength(expectedContent) > 8192 ||
            Buffer.byteLength(content) > 8192)
            throw new Error("managed source replacement requires bounded distinct UTF-8 fragments");
        const checked = beforeTool({ sessionID, tool: "edit" }, { filePath });
        const filename = checked.filePath;
        const fd = fs.openSync(filename, fs.constants.O_RDWR | fs.constants.O_NOFOLLOW);
        try {
            const before = fs.fstatSync(fd);
            if (!before.isFile() || before.size > 8 * 1024 * 1024)
                throw new Error("managed source replacement requires a bounded regular file");
            const original = fs.readFileSync(fd);
            new TextDecoder("utf-8", { fatal: true }).decode(original);
            const needle = Buffer.from(expectedContent, "utf8");
            const replacement = Buffer.from(content, "utf8");
            const index = original.indexOf(needle);
            if (index < 0 || original.indexOf(needle, index + 1) >= 0)
                throw new Error("managed source replacement requires exactly one current occurrence");
            const next = Buffer.concat([
                original.subarray(0, index),
                replacement,
                original.subarray(index + needle.length),
            ]);
            if (next.length > 8 * 1024 * 1024)
                throw new Error("managed source replacement exceeds file bound");
            const latest = fs.fstatSync(fd);
            const current = fs.lstatSync(filename);
            if (latest.dev !== before.dev ||
                latest.ino !== before.ino ||
                latest.size !== before.size ||
                latest.mtimeMs !== before.mtimeMs ||
                current.isSymbolicLink() ||
                current.dev !== before.dev ||
                current.ino !== before.ino)
                throw new Error("managed source replacement target changed before write");
            let offset = 0;
            while (offset < next.length) {
                const written = fs.writeSync(fd, next, offset, next.length - offset, offset);
                if (written < 1)
                    throw new Error("managed source replacement could not finish writing");
                offset += written;
            }
            fs.ftruncateSync(fd, next.length);
            return { filePath, sha256: createHash("sha256").update(next).digest("hex") };
        }
        finally {
            fs.closeSync(fd);
        }
    }
    function afterTask(input, output) {
        if (active && !active.background && record(output.metadata).background === true) {
            active.background = true;
            active.nativeStarted = true;
            active.startWaiter?.();
            interrupt("native background promotion was not admitted; reservation retained");
            throw new Error("unadmitted native background promotion; worker termination uncertain");
        }
        if (active?.background) {
            const callId = identifier(input.callID);
            const update = active.updateCalls.has(callId);
            if (!update && callId !== active.callId)
                throw new Error("uncorrelated background acknowledgement");
            const metadata = record(output.metadata);
            if (active.childId &&
                metadata.sessionId === active.childId &&
                metadata.jobId === active.childId &&
                metadata.background === true) {
                active.pendingLaunches.delete(callId);
                active.nativeStarted = active.pendingLaunches.size === 0;
                if (active.nativeStarted)
                    active.startWaiter?.();
            }
            const model = metadata.model && typeof metadata.model === "object" && !Array.isArray(metadata.model)
                ? record(metadata.model)
                : {};
            if (`${String(model.providerID)}/${String(model.modelID)}` !== active.workerModel ||
                !active.childId ||
                metadata.sessionId !== active.childId ||
                metadata.jobId !== active.childId ||
                metadata.background !== true ||
                typeof output.output !== "string" ||
                !output.output.startsWith(`<task id="${active.childId}" state="running">`)) {
                interrupt("invalid background acknowledgement; worker termination uncertain");
                throw new Error("invalid background acknowledgement; reservation retained");
            }
            if (stopped) {
                interrupt("background acknowledgement arrived after interruption");
                throw new Error("background worker termination in progress; reservation retained");
            }
            if (active.acknowledgedCalls.has(callId))
                throw new Error("duplicate background acknowledgement");
            active.acknowledgedCalls.add(callId);
            if (metadata.jobStartedAt !== undefined) {
                if (typeof metadata.jobStartedAt !== "number" ||
                    !Number.isSafeInteger(metadata.jobStartedAt) ||
                    metadata.jobStartedAt <= 0) {
                    interrupt("invalid native Job generation");
                    throw new Error("native Job generation unavailable");
                }
                active.nativeJobStartedAt = metadata.jobStartedAt;
            }
            active.acknowledged = true;
            active.updateCalls.delete(callId);
            report({
                event: update ? "context-update-acknowledged" : "background-started",
                delegationTaskId: active.context.delegationTaskId,
            });
            void reconcileBackground().catch(() => { });
            return { outcome: "running" };
        }
        return completeTask(input, output);
    }
    function completeTask(input, output) {
        if (!active || identifier(input.callID) !== active.callId)
            throw new Error("duplicate or uncorrelated managed completion");
        const task = active;
        const metadata = record(output.metadata);
        if (!task.childId || metadata.sessionId !== task.childId) {
            interrupt("unbound task completion");
            throw new Error("child session was not observed; acceptance disabled");
        }
        const result = task.run.policy.afterTask({
            callID: input.callID,
            output: output.output,
            metadata,
        });
        if (!task.background && result.outcome !== "rejected" && result.result) {
            task.foregroundCompleted = true;
            task.pendingLaunches.delete(task.callId);
        }
        if (result.outcome === "clarification") {
            task.run.controller.clarification(task.context.delegationTaskId);
            return result;
        }
        try {
            verifySpec(task.run);
            const after = snapshot(task.context.orchestrationId);
            const unit = task.run.controller.spec.workUnits.find((u) => u.id === task.context.scopeKey);
            assertAllowedTransition(task.before, after, task.context.role === "implementer" ? unit.allowedPaths : []);
            if (result.outcome === "success" && result.result) {
                const paths = result.result.artifacts.map((a) => a.reference);
                const prefix = `orchestrations/${task.context.orchestrationId}/roles/${task.context.role}/`;
                if (paths.some((p) => !p.startsWith(prefix)))
                    throw new Error("artifact outside assigned trace scope");
                const artifacts = captureArtifacts(options.traceRoot, paths);
                if (result.result.artifacts.some((a) => a.sha256 !== undefined && a.sha256 !== artifacts[a.reference]))
                    throw new Error("artifact proof digest mismatched");
                for (const artifact of result.result.artifacts)
                    artifact.sha256 = artifacts[artifact.reference];
                if (task.context.role === "validator") {
                    const gates = task.run.controller.spec.acceptanceGates.filter((g) => unit.acceptanceGateIds.includes(g.id));
                    if (gates.some((g) => !task.commands.some((c) => c.command === g.evidenceCommand && c.exitCode === 0)))
                        throw new Error("acceptance gate lacks trusted command success");
                    verifyAcceptance({
                        before: task.run.baseline,
                        after,
                        current: snapshot(task.context.orchestrationId),
                        allowedPaths: task.run.controller.spec.allowedPaths,
                        artifacts,
                        currentArtifacts: captureArtifacts(options.traceRoot, paths),
                        commands: task.commands,
                        validatorTaskId: task.context.delegationTaskId,
                    });
                    task.run.controller.complete(task.context.delegationTaskId, "success", {
                        gateIds: unit.acceptanceGateIds,
                        treeHash: after.treeHash,
                    });
                    for (const gate of gates)
                        task.run.accepted.set(gate.id, {
                            tree: after,
                            scopes: task.run.controller.spec.workUnits
                                .filter((u) => gate.workUnitIds.includes(u.id))
                                .flatMap((u) => u.allowedPaths),
                            artifacts,
                        });
                }
                else
                    task.run.controller.complete(task.context.delegationTaskId, "success");
            }
            else
                task.run.controller.complete(task.context.delegationTaskId, result.outcome === "blocked" ? "blocked" : "failed");
            report({
                event: "completed",
                delegationTaskId: task.context.delegationTaskId,
                outcome: result.outcome,
                usage: validateUsageTelemetry(metadata.usage),
            });
            active = null;
            return result;
        }
        catch (error) {
            // A rejected proof never becomes acceptance; unknown effects stop this ephemeral run.
            interrupt("result or scope proof rejected");
            throw error;
        }
    }
    function currentTaskView(querySessionId) {
        if (!active ||
            stopped ||
            !active.goal ||
            !active.childId ||
            typeof querySessionId !== "string" ||
            !querySessionId ||
            (querySessionId !== active.run.parent && querySessionId !== active.childId))
            return null;
        const { context, run } = active;
        const state = run.controller.snapshot();
        const attempt = state.attempts.find((entry) => entry.id === context.delegationTaskId);
        if (state.interrupted ||
            !attempt ||
            !["running", "awaiting-guidance"].includes(attempt.state) ||
            (options.now ?? Date.now)() >= attempt.deadline ||
            attempt.parentSessionId !== run.parent ||
            attempt.workUnitId !== context.scopeKey ||
            attempt.role !== context.role ||
            attempt.taskMode !== context.taskMode)
            return null;
        return {
            orchestrationId: context.orchestrationId,
            scopeKey: context.scopeKey,
            delegationTaskId: context.delegationTaskId,
            role: context.role,
            taskMode: context.taskMode,
            goal: active.goal,
        };
    }
    function compactionPointer(querySessionId) {
        if (typeof querySessionId !== "string" ||
            !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/.test(querySessionId) ||
            knownChildren.has(querySessionId))
            return null;
        const latest = [...runs.values()].filter((run) => run.parent === querySessionId).at(-1);
        return latest ? { orchestrationId: latest.controller.spec.orchestrationId } : null;
    }
    return {
        currentTaskView,
        compactionPointer,
        beforeTask,
        beforeTool,
        afterTool,
        verifyCommand,
        writeTrace,
        editSource,
        replaceSource,
        afterTask,
        sessionCreated,
        interrupt,
        interruptIfCurrent,
        recoveryStatus,
        resolveRecovery,
        releaseForFresh,
        reconcileBackground,
        cancelBackground,
        snapshot: () => ({
            mode: "ephemeral",
            resumable: false,
            stopped,
            background: active?.background
                ? { childId: active.childId, acknowledged: active.acknowledged, revision: active.revision }
                : null,
            runs: [...runs.values()].map((r) => r.controller.snapshot()),
        }),
    };
}
