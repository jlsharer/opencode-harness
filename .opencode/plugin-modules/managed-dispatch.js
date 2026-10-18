import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { withinScope, createDispatchController } from "./dispatch-controller.js";
import { createTaskThreadPolicy } from "./task-thread-policy.js";
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
/** Adapter-local memory is deliberately ephemeral. A new plugin instance cannot restore it. */
export function createManagedDispatch(options) {
    const runs = new Map();
    const knownChildren = new Set();
    let active = null;
    let stopped = false;
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
    function interrupt(reason) {
        stopped = true;
        for (const run of runs.values())
            run.controller.interrupt();
        report({ event: "interrupted", mode: "ephemeral", resumable: false, reason });
    }
    async function beforeTask(input, args) {
        if (stopped)
            throw new Error("managed run interrupted; non-resumable");
        const parent = identifier(input.sessionID);
        if (knownChildren.has(parent))
            throw new Error("managed children cannot delegate, including after completion");
        const callId = identifier(input.callID);
        const parsed = envelope(args.prompt);
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
        const orchestrationId = identifier(packet.orchestrationId);
        if (orchestrationId.includes(":"))
            throw new Error("unsafe orchestration path");
        const source = `orchestrations/${orchestrationId}/normalized-spec.json`;
        const doc = readDocument(options.traceRoot, source);
        let run = runs.get(orchestrationId);
        if (!run) {
            if (runs.size >= 16)
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
        active = { run, context, packet, before, callId, commands: [], pendingCommands: new Map() };
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
    }
    function beforeTool(input, args) {
        if (stopped)
            throw new Error("managed run interrupted; tools disabled until a new reviewed workflow process");
        if (!active) {
            if (typeof input.sessionID === "string" && knownChildren.has(input.sessionID))
                throw new Error("terminal managed child cannot execute tools");
            return args;
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
        active.commands.push({
            command: observation.command,
            exitCode: exitCode,
            treeHash: observation.treeHash,
            taskId: active.context.delegationTaskId,
        });
    }
    function afterTask(input, output) {
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
    return {
        beforeTask,
        beforeTool,
        afterTool,
        afterTask,
        sessionCreated,
        interrupt,
        snapshot: () => ({
            mode: "ephemeral",
            resumable: false,
            stopped,
            runs: [...runs.values()].map((r) => r.controller.snapshot()),
        }),
    };
}
