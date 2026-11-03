/** Public native-session transport. Bounds apply after native context allocation; there is no child lock. */
import { createHash, randomUUID } from "node:crypto";
const admissions = new WeakSet();
const string = (value) => typeof value === "string" && value.length > 0;
function sameCall(a, b) {
    return ["sessionID", "agent", "messageID", "id"].every((key) => a[key] === b[key]);
}
/** Trusted adapter only: model is resolved from verified native agent/parent selection, never packet JSON. */
export function createDirectAdmission(input) {
    if (input.context.role !== "implementer" ||
        input.context.taskMode !== "implementation" ||
        !Object.values(input.context).every(string) ||
        ![
            input.caller.sessionID,
            input.caller.agent,
            input.caller.messageID,
            input.caller.id,
            input.model.id,
            input.model.providerID,
            input.prompt,
        ].every(string) ||
        !Number.isFinite(input.deadline) ||
        (input.model.variant !== undefined && !string(input.model.variant)))
        throw new Error("invalid direct admission");
    const context = Object.freeze({
        orchestrationId: input.context.orchestrationId,
        delegationTaskId: input.context.delegationTaskId,
        scopeKey: input.context.scopeKey,
        role: input.context.role,
        taskMode: input.context.taskMode,
    });
    const caller = Object.freeze({
        sessionID: input.caller.sessionID,
        agent: input.caller.agent,
        messageID: input.caller.messageID,
        id: input.caller.id,
    });
    const model = Object.freeze({
        id: input.model.id,
        providerID: input.model.providerID,
        ...(input.model.variant !== undefined ? { variant: input.model.variant } : {}),
    });
    const admission = Object.freeze({
        context,
        caller,
        model,
        ...(input.title !== undefined ? { title: input.title } : {}),
        prompt: input.prompt,
        deadline: input.deadline,
        childID: `ses_${randomUUID()}`,
        promptID: `msg_${randomUUID()}`,
    });
    admissions.add(admission);
    return admission;
}
export function createDirectSessionTransport(options) {
    const { api, onChild, onUncertain } = options;
    const now = options.now ?? Date.now;
    const schedule = options.schedule ??
        ((ms, callback) => {
            const timer = setTimeout(callback, ms);
            return () => clearTimeout(timer);
        });
    const limits = {
        maxContextMessages: 256,
        maxContextBytes: 1048576,
        maxTerminalCharacters: 32768,
        maxOwnedAttempts: 4096,
    };
    for (const key of Object.keys(limits)) {
        const configured = options.limits?.[key];
        if (configured !== undefined) {
            if (!Number.isSafeInteger(configured) || configured < 1 || configured > limits[key])
                throw new Error("invalid direct limit");
            limits[key] = configured;
        }
    }
    const observationNow = options.observationNow ?? (() => performance.now());
    const records = [];
    const handles = new WeakMap();
    const causes = new WeakMap();
    const receipts = new WeakMap();
    const currentReceipts = new WeakMap();
    const used = new Set();
    const candidates = new WeakMap();
    let stopped = false;
    let reported = false;
    function owned(handle) {
        const record = handles.get(handle);
        if (!record)
            throw new Error("invalid direct handle");
        return record;
    }
    function disqualify(record, reason) {
        record.generation++;
        if (record.disqualifiers.length < 16 && !record.disqualifiers.includes(reason))
            record.disqualifiers.push(reason);
    }
    // Invocation is registered before entering any native/user thunk, including synchronous reentry.
    function invokeOperation(record, name, invoke) {
        const entry = {};
        let resolve;
        let reject;
        const promise = new Promise((yes, no) => {
            resolve = yes;
            reject = no;
        });
        record.pending.set(entry, { name, promise });
        record.generation++;
        const completion = promise.then((value) => {
            record.pending.delete(entry);
            record.generation++;
            return value;
        }, (error) => {
            record.pending.delete(entry);
            disqualify(record, "native-operation-rejected");
            throw error;
        });
        // Observers and errors remain accounted even when cancellation wins the awaiting stage.
        void completion.catch(() => { });
        try {
            resolve(invoke());
        }
        catch (error) {
            reject(error);
        }
        return completion;
    }
    function interrupt(record, late = false) {
        if (!record.started || (late ? record.lateInterrupt : record.initialInterrupt))
            return Promise.resolve();
        if (late)
            record.lateInterrupt = true;
        else
            record.initialInterrupt = true;
        return invokeOperation(record, "interrupt", async () => {
            const ack = await api.interrupt({ sessionID: record.admission.childID, resume: false });
            if (!ack || typeof ack.interrupted !== "boolean")
                throw new Error("invalid interrupt acknowledgment");
        });
    }
    function publishStop(record, cause) {
        if (record.stopped)
            return;
        stopped = true;
        record.stopped = true;
        record.phase = "stopped";
        record.generation++;
        record.cause = cause;
        record.error = Object.freeze(new Error("Harness direct implementation stopped; unresolved evidence retained."));
        record.dispose();
        record.wake();
        void interrupt(record).catch(() => { });
        // Stop is visible before reporting; callbacks cannot erase its provenance or its ledger.
        if (!reported) {
            reported = true;
            try {
                onUncertain("direct native attempt uncertain", Object.freeze({ handle: record.handle, ...(cause ? { cause } : {}) }));
            }
            catch {
                disqualify(record, "stop-reporting-failed");
            }
        }
    }
    function fail(reason) {
        stopped = true;
        for (const record of records) {
            disqualify(record, reason);
            publishStop(record);
        }
    }
    function allowedStop(record, code) {
        if (record.stopped)
            return;
        const cause = Object.freeze({ code });
        causes.set(cause, record);
        publishStop(record, cause);
        for (const other of records)
            if (other !== record) {
                disqualify(other, "another-attempt-stopped");
                publishStop(other);
            }
    }
    function observeStop(record) {
        if (!record.stopped && record.caller.signal.aborted)
            allowedStop(record, "caller-cancelled");
        if (!record.stopped && now() >= record.admission.deadline)
            allowedStop(record, "deadline-expired");
    }
    function check(record) {
        observeStop(record);
        if (stopped || record.stopped)
            throw record.error ?? new Error("direct transport stopped");
    }
    function assertBinding(handle, admission, caller) {
        const record = owned(handle);
        if (record.admission !== admission ||
            !admissions.has(admission) ||
            !sameCall(record.caller, caller) ||
            record.caller.signal !== caller.signal)
            throw new Error("invalid direct binding");
    }
    function prepare(admission, suppliedCaller) {
        if (stopped ||
            !admissions.has(admission) ||
            !sameCall(admission.caller, suppliedCaller) ||
            !(suppliedCaller.signal instanceof AbortSignal) ||
            suppliedCaller.signal.aborted)
            throw new Error("invalid direct admission/caller");
        const remaining = admission.deadline - now();
        if (remaining <= 0 || remaining > 3600000)
            throw new Error("invalid direct deadline");
        const keys = [
            JSON.stringify([
                "call",
                suppliedCaller.sessionID,
                suppliedCaller.messageID,
                suppliedCaller.id,
            ]),
            JSON.stringify([
                "task",
                admission.context.orchestrationId,
                admission.context.delegationTaskId,
            ]),
            `child:${admission.childID}`,
            `prompt:${admission.promptID}`,
        ];
        if (records.length >= limits.maxOwnedAttempts || keys.some((key) => used.has(key)))
            throw new Error("direct identity already used or ledger full");
        keys.forEach((key) => used.add(key));
        const handle = Object.freeze({});
        let wake;
        const cancelled = new Promise((_resolve, reject) => {
            wake = () => reject(record.error);
        });
        void cancelled.catch(() => { });
        const record = {
            handle,
            admission,
            caller: Object.freeze({ ...admission.caller, signal: suppliedCaller.signal }),
            pending: new Map(),
            generation: 0,
            phase: "prepared",
            disqualifiers: [],
            stopped: false,
            started: false,
            createAcknowledged: false,
            promptAcknowledged: false,
            executionSettled: false,
            initialInterrupt: false,
            lateInterrupt: false,
            consumed: false,
            reservation: false,
            wake,
            cancelled,
            dispose: () => { },
        };
        records.push(record);
        handles.set(handle, record);
        const abort = () => allowedStop(record, "caller-cancelled");
        const cancel = schedule(remaining, () => allowedStop(record, "deadline-expired"));
        record.caller.signal.addEventListener("abort", abort, { once: true });
        record.dispose = () => {
            cancel();
            record.caller.signal.removeEventListener("abort", abort);
        };
        return handle;
    }
    async function boundedDrain(record) {
        let clear = () => { };
        const timeout = new Promise((resolve) => {
            clear = schedule(2000, resolve);
        });
        const drain = async () => {
            while (record.pending.size)
                await Promise.allSettled([...record.pending.values()].map((entry) => entry.promise));
        };
        await Promise.race([drain(), timeout]);
        clear();
    }
    function validateChild(record, child) {
        if (!child ||
            child.id !== record.admission.childID ||
            child.parentID !== record.caller.sessionID ||
            child.agent !== "implementer")
            throw new Error("direct child identity");
    }
    function validateFinal(record, final) {
        validateChild(record, final);
        if (final.time?.idle === undefined ||
            !["succeeded", "failed", "interrupted"].includes(final.outcome ?? ""))
            throw new Error("direct native final outcome");
    }
    function validateContext(record, final, messages, recovery) {
        validateChild(record, final);
        const outcome = final.outcome;
        if (final.time?.idle === undefined ||
            !["succeeded", ...(recovery ? ["failed", "interrupted"] : [])].includes(outcome ?? ""))
            throw new Error("direct native final outcome");
        if (!Array.isArray(messages) ||
            messages.length > limits.maxContextMessages ||
            Buffer.byteLength(JSON.stringify(messages)) > limits.maxContextBytes)
            throw new Error("direct local context limit");
        const ids = new Set();
        for (const message of messages) {
            if (!message || !string(message.id) || ids.has(message.id))
                throw new Error("direct message identity");
            ids.add(message.id);
        }
        const users = messages.filter((m) => m.type === "user");
        const own = messages.findIndex((m) => m.type === "user" && m.id === record.admission.promptID);
        const idle = messages.at(-1);
        if (users.length !== 1 ||
            own < 0 ||
            users[0].text !== record.admission.prompt ||
            idle?.type !== "idle" ||
            idle.outcome !== outcome ||
            (!recovery && idle.error !== undefined))
            throw new Error("direct ambiguous turn");
        if (messages
            .slice(0, own)
            .some((m) => !["agent-switched", "model-switched", "location-switched"].includes(m.type)))
            throw new Error("direct child not fresh");
        const turn = messages.slice(own + 1, -1);
        if ((!recovery && !turn.length) ||
            turn.some((m) => m.type !== "assistant" || m.agent !== "implementer" || m.time?.completed === undefined))
            throw new Error("direct unexpected turn activity");
        return turn;
    }
    async function body(record) {
        const { admission, caller } = record;
        const stage = async (name, invoke) => {
            check(record);
            const value = await Promise.race([invokeOperation(record, name, invoke), record.cancelled]);
            check(record);
            return value;
        };
        try {
            check(record);
            await stage("create", async () => {
                const child = await api.create({
                    id: admission.childID,
                    parentID: caller.sessionID,
                    agent: "implementer",
                    model: admission.model,
                    ...(admission.title !== undefined ? { title: admission.title } : {}),
                });
                validateChild(record, child);
                record.createAcknowledged = true;
                if (record.stopped) {
                    await interrupt(record, true);
                    return;
                }
                await invokeOperation(record, "child-acknowledgment", () => onChild(Object.freeze({ ...child, time: Object.freeze({ ...child.time }) }), admission));
            });
            await stage("prompt", async () => {
                const ack = await api.prompt({
                    sessionID: admission.childID,
                    id: admission.promptID,
                    text: admission.prompt,
                    delivery: "queue",
                });
                if (!ack ||
                    ack.id !== admission.promptID ||
                    ack.sessionID !== admission.childID ||
                    ack.type !== "user" ||
                    ack.delivery !== "queue" ||
                    ack.payload?.text !== admission.prompt)
                    throw new Error("direct prompt identity");
                record.promptAcknowledged = true;
            });
            await stage("wait", () => api.wait({ sessionID: admission.childID }));
            const final = await stage("get", async () => {
                const value = await api.get({ sessionID: admission.childID });
                validateFinal(record, value);
                return value;
            });
            const messages = await stage("context", async () => {
                const value = await api.context({ sessionID: admission.childID });
                validateContext(record, final, value, true);
                return value;
            });
            const turn = validateContext(record, final, messages, false);
            const assistant = turn.at(-1);
            if (assistant.error !== undefined ||
                assistant.finish !== "stop" ||
                !assistant.content?.length ||
                assistant.content.some((c) => c.type !== "text" || typeof c.text !== "string"))
                throw new Error("direct invalid terminal assistant");
            const text = assistant.content.map((c) => c.text).join("");
            if (!text || text.length > limits.maxTerminalCharacters)
                throw new Error("direct terminal result limit");
            check(record);
            const candidate = Object.freeze({});
            candidates.set(candidate, {
                record,
                evidence: Object.freeze({
                    text,
                    childID: admission.childID,
                    promptID: admission.promptID,
                    assistantID: assistant.id,
                    context: admission.context,
                    deadline: admission.deadline,
                }),
            });
            return candidate;
        }
        catch (error) {
            if (!record.stopped || error !== record.error)
                fail("direct-attempt-failed");
            record.dispose();
            await boundedDrain(record);
            throw record.error;
        }
    }
    function execute(input, caller) {
        let record;
        try {
            record = owned(caller ? prepare(input, caller) : input);
            if (record.started)
                throw new Error("direct execution already started");
            record.started = true;
            record.phase = record.stopped ? "stopped" : "executing";
        }
        catch (error) {
            return Promise.reject(error);
        }
        let resolve;
        let reject;
        const exposed = new Promise((yes, no) => {
            resolve = yes;
            reject = no;
        });
        // This observer is on the actual exposed promise, registered before callers can attach reactions.
        void exposed.then(() => {
            record.executionSettled = true;
            record.generation++;
        }, () => {
            record.executionSettled = true;
            record.generation++;
        });
        void body(record).then(resolve, reject);
        return exposed;
    }
    function assertTermination(receipt, handle) {
        const record = owned(handle);
        const fact = receipts.get(receipt);
        if (!fact ||
            fact.record !== record ||
            fact.consumed ||
            currentReceipts.get(record) !== receipt ||
            fact.generation !== record.generation ||
            record.disqualifiers.length ||
            record.pending.size ||
            record.reservation ||
            record.phase !== "termination-proved")
            throw new Error("invalid direct termination receipt");
    }
    async function reconcileStopped(handle, assertCurrent = () => { }) {
        const record = owned(handle);
        if (!record.stopped ||
            !record.cause ||
            causes.get(record.cause) !== record ||
            record.disqualifiers.length ||
            !record.executionSettled ||
            record.pending.size ||
            record.reservation ||
            !record.createAcknowledged ||
            !record.promptAcknowledged ||
            record.phase === "retired")
            throw new Error("direct settlement is not eligible");
        // Reserve and invalidate the preceding receipt before invoking any trusted or native callback.
        record.reservation = true;
        record.phase = "reconciling";
        record.generation++;
        let generation = record.generation;
        const deadline = observationNow() + 2000;
        let clear = () => { };
        let expired = false;
        const timeoutError = new Error("direct observation timeout");
        const timeout = new Promise((_resolve, reject) => {
            clear = schedule(2000, () => {
                expired = true;
                reject(timeoutError);
            });
        });
        void timeout.catch(() => { });
        const current = () => {
            if (expired || observationNow() >= deadline)
                throw timeoutError;
            if (record.generation !== generation ||
                record.disqualifiers.length ||
                record.phase !== "reconciling")
                throw new Error("direct observation changed");
            assertCurrent();
            if (expired || observationNow() >= deadline)
                throw timeoutError;
            if (record.generation !== generation || record.disqualifiers.length)
                throw new Error("direct observation changed");
        };
        const step = async (name, invoke) => {
            current();
            const operation = invokeOperation(record, name, async () => {
                const value = await invoke();
                assertCurrent();
                if (record.generation !== generation - 1 || record.disqualifiers.length)
                    throw new Error("direct observation changed");
                return value;
            });
            // Invocation and its single settlement are the only permitted generation changes.
            generation += 2;
            const value = await Promise.race([operation, timeout]);
            current();
            return value;
        };
        try {
            current();
            await step("interrupt", async () => {
                const ack = await api.interrupt({ sessionID: record.admission.childID, resume: false });
                if (!ack || typeof ack.interrupted !== "boolean")
                    throw new Error("direct interrupt acknowledgment");
            });
            await step("wait", () => api.wait({ sessionID: record.admission.childID }));
            const final = await step("get", async () => {
                const value = await api.get({ sessionID: record.admission.childID });
                validateFinal(record, value);
                return value;
            });
            const messages = await step("context", async () => {
                const value = await api.context({ sessionID: record.admission.childID });
                validateContext(record, final, value, true);
                return value;
            });
            validateContext(record, final, messages, true);
            current();
            const receipt = Object.freeze({});
            receipts.set(receipt, {
                record,
                generation: record.generation,
                digest: createHash("sha256").update(JSON.stringify(messages)).digest("hex"),
                outcome: final.outcome,
                consumed: false,
            });
            currentReceipts.set(record, receipt);
            record.phase = "termination-proved";
            return receipt;
        }
        catch (error) {
            if (error !== timeoutError)
                disqualify(record, "termination-observation-failed");
            record.phase = "stopped";
            throw error;
        }
        finally {
            clear();
            if (record.pending.size) {
                void Promise.allSettled([...record.pending.values()].map((entry) => entry.promise)).then(() => {
                    record.reservation = false;
                });
            }
            else
                record.reservation = false;
        }
    }
    function stop(reasonOrHandle, cause) {
        if (typeof reasonOrHandle === "string") {
            fail("generic-stop");
            return;
        }
        const record = owned(reasonOrHandle);
        if (!cause || causes.get(cause) !== record || record.cause !== cause) {
            fail("invalid-stop-cause");
            throw new Error("invalid direct stop cause");
        }
        // Repropagation of the exact private cause is intentionally inert.
    }
    return {
        prepare,
        assertBinding,
        execute,
        reconcileStopped,
        assertTermination,
        stop,
        // Trusted callers may observe a real admitted deadline before our timer reaction runs.
        // No caller-supplied reason participates in minting this capability.
        observeStopCause(handle) {
            const record = owned(handle);
            observeStop(record);
            return record.cause;
        },
        stopCause(handle) {
            return owned(handle).cause;
        },
        isStopCause(handle, cause) {
            const record = owned(handle);
            return (typeof cause === "object" &&
                cause !== null &&
                causes.get(cause) === record &&
                record.cause === cause);
        },
        stoppedError(handle) {
            return owned(handle).error;
        },
        inspectSettlement(handle) {
            const record = owned(handle);
            const pending = {
                create: 0,
                prompt: 0,
                wait: 0,
                get: 0,
                context: 0,
                interrupt: 0,
                "child-acknowledgment": 0,
            };
            for (const entry of record.pending.values())
                pending[entry.name]++;
            return Object.freeze({
                phase: record.phase,
                generation: record.generation,
                pending: Object.freeze(pending),
                createAcknowledged: record.createAcknowledged,
                promptAcknowledged: record.promptAcknowledged,
                executionSettled: record.executionSettled,
                disqualifiers: Object.freeze([...record.disqualifiers]),
            });
        },
        consumeTermination(receipt, handle) {
            assertTermination(receipt, handle);
            const record = owned(handle);
            receipts.get(receipt).consumed = true;
            record.phase = "retired";
            record.generation++;
        },
        assertSameTermination(previous, current, handle) {
            assertTermination(current, handle);
            const before = receipts.get(previous), after = receipts.get(current);
            if (previous === current ||
                !before ||
                before.record !== owned(handle) ||
                before.consumed ||
                before.digest !== after.digest ||
                before.outcome !== after.outcome)
                throw new Error("direct termination changed");
        },
        consumeCandidate(candidate, admission, caller) {
            const receipt = candidates.get(candidate);
            candidates.delete(candidate);
            try {
                if (!receipt || receipt.record.consumed)
                    throw new Error("invalid direct candidate");
                assertBinding(receipt.record.handle, admission, caller);
                receipt.record.consumed = true;
                check(receipt.record);
                if (receipt.record.pending.size)
                    throw new Error("pending direct candidate operation");
                receipt.record.dispose();
                return receipt.evidence;
            }
            catch {
                fail("invalid-candidate");
                throw new Error("invalid direct candidate");
            }
        },
    };
}
