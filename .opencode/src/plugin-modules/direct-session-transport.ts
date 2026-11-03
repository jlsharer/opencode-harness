/** Public native-session transport. Bounds apply after native context allocation; there is no child lock. */
import { createHash, randomUUID } from "node:crypto";
import type { TaskContext } from "./task-contracts.ts";

export interface SessionInfo {
  id: string;
  parentID?: string | undefined;
  agent?: string | undefined;
  outcome?: string | undefined;
  time: { idle?: unknown };
}
export interface NativeMessage {
  id: string;
  type: string;
  text?: string;
  agent?: string;
  content?: { type: string; text?: string }[];
  finish?: string;
  error?: unknown;
  time?: { created?: unknown; completed?: unknown };
  outcome?: string;
}
export interface DirectModelRef {
  id: string;
  providerID: string;
  variant?: string | undefined;
}
export interface DirectSessionApi {
  create(input: {
    id?: string | undefined;
    parentID?: string | undefined;
    agent?: string | undefined;
    model?: DirectModelRef | undefined;
    title?: string | undefined;
  }): Promise<SessionInfo>;
  prompt(input: {
    sessionID: string;
    id?: string | undefined;
    text: string;
    delivery?: "queue" | "steer" | undefined;
  }): Promise<{
    id: string;
    sessionID: string;
    type: "user";
    payload: { text: string };
    delivery: "queue" | "steer";
    time: { created: unknown };
  }>;
  wait(input: { sessionID: string }): Promise<void>;
  get(input: { sessionID: string }): Promise<SessionInfo>;
  context(input: { sessionID: string }): Promise<ReadonlyArray<NativeMessage>>;
  interrupt(input: {
    sessionID: string;
    resume?: boolean | undefined;
  }): Promise<{ interrupted: boolean }>;
}
export interface DirectCallIdentity {
  readonly sessionID: string;
  readonly agent: string;
  readonly messageID: string;
  readonly id: string;
}
export interface DirectToolCaller extends DirectCallIdentity {
  readonly signal: AbortSignal;
}
export interface DirectAdmission {
  readonly context: Readonly<TaskContext>;
  readonly caller: Readonly<DirectCallIdentity>;
  readonly model: Readonly<DirectModelRef>;
  readonly title?: string;
  readonly prompt: string;
  readonly deadline: number;
  readonly childID: string;
  readonly promptID: string;
}
declare const candidateBrand: unique symbol;
export type DirectCandidate = Readonly<{ [candidateBrand]: never }>;
export interface DirectEvidence {
  readonly text: string;
  readonly childID: string;
  readonly promptID: string;
  readonly assistantID: string;
  readonly context: Readonly<TaskContext>;
  readonly deadline: number;
}
export interface DirectTransportOptions {
  api: DirectSessionApi;
  now?: () => number;
  observationNow?: () => number;
  schedule?: (ms: number, callback: () => void) => () => void;
  limits?: {
    maxContextMessages?: number;
    maxContextBytes?: number;
    maxTerminalCharacters?: number;
    maxOwnedAttempts?: number;
  };
  onUncertain: (
    reason: string,
    detail?: Readonly<{ handle: DirectAttemptHandle; cause?: DirectStopCause }>,
  ) => void;
  onChild: (child: Readonly<SessionInfo>, admission: DirectAdmission) => void | Promise<void>;
}
declare const handleBrand: unique symbol;
declare const stopBrand: unique symbol;
declare const terminationBrand: unique symbol;
export type DirectAttemptHandle = Readonly<{ [handleBrand]: never }>;
export type DirectStopCause = Readonly<{
  code: "deadline-expired" | "caller-cancelled";
  [stopBrand]: never;
}>;
export type DirectTerminationReceipt = Readonly<{ [terminationBrand]: never }>;
export type DirectOperationName =
  | "create"
  | "prompt"
  | "wait"
  | "get"
  | "context"
  | "interrupt"
  | "child-acknowledgment";
export interface DirectSettlementView {
  readonly phase:
    | "prepared"
    | "executing"
    | "stopped"
    | "reconciling"
    | "termination-proved"
    | "retired";
  readonly generation: number;
  readonly pending: Readonly<Record<DirectOperationName, number>>;
  readonly createAcknowledged: boolean;
  readonly promptAcknowledged: boolean;
  readonly executionSettled: boolean;
  readonly disqualifiers: readonly string[];
}
export type DirectSessionTransport = ReturnType<typeof createDirectSessionTransport>;
const admissions = new WeakSet<object>();

const string = (value: unknown): value is string => typeof value === "string" && value.length > 0;

function sameCall(a: DirectCallIdentity, b: DirectCallIdentity) {
  return ["sessionID", "agent", "messageID", "id"].every(
    (key) => a[key as keyof DirectCallIdentity] === b[key as keyof DirectCallIdentity],
  );
}

/** Trusted adapter only: model is resolved from verified native agent/parent selection, never packet JSON. */
export function createDirectAdmission(input: {
  context: TaskContext;
  caller: DirectCallIdentity;
  model: DirectModelRef;
  title?: string;
  prompt: string;
  deadline: number;
}): DirectAdmission {
  if (
    input.context.role !== "implementer" ||
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
    (input.model.variant !== undefined && !string(input.model.variant))
  )
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

export function createDirectSessionTransport(options: DirectTransportOptions) {
  const { api, onChild, onUncertain } = options;
  const now = options.now ?? Date.now;
  const schedule =
    options.schedule ??
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
  for (const key of Object.keys(limits) as (keyof typeof limits)[]) {
    const configured = options.limits?.[key];
    if (configured !== undefined) {
      if (!Number.isSafeInteger(configured) || configured < 1 || configured > limits[key])
        throw new Error("invalid direct limit");
      limits[key] = configured;
    }
  }
  const observationNow = options.observationNow ?? (() => performance.now());

  type Attempt = {
    handle: DirectAttemptHandle;
    admission: DirectAdmission;
    caller: DirectToolCaller;
    pending: Map<object, { name: DirectOperationName; promise: Promise<unknown> }>;
    generation: number;
    phase: DirectSettlementView["phase"];
    disqualifiers: string[];
    cause?: DirectStopCause | undefined;
    error?: Error;
    stopped: boolean;
    started: boolean;
    createAcknowledged: boolean;
    promptAcknowledged: boolean;
    executionSettled: boolean;
    initialInterrupt: boolean;
    lateInterrupt: boolean;
    consumed: boolean;
    reservation: boolean;
    wake: () => void;
    cancelled: Promise<never>;
    dispose: () => void;
  };
  type Observation = {
    record: Attempt;
    generation: number;
    digest: string;
    outcome: string;
    consumed: boolean;
  };

  const records: Attempt[] = [];
  const handles = new WeakMap<object, Attempt>();
  const causes = new WeakMap<object, Attempt>();
  const receipts = new WeakMap<object, Observation>();
  const currentReceipts = new WeakMap<Attempt, DirectTerminationReceipt>();
  const used = new Set<string>();
  const candidates = new WeakMap<object, { record: Attempt; evidence: DirectEvidence }>();
  let stopped = false;
  let reported = false;

  function owned(handle: DirectAttemptHandle): Attempt {
    const record = handles.get(handle);
    if (!record) throw new Error("invalid direct handle");
    return record;
  }

  function disqualify(record: Attempt, reason: string) {
    record.generation++;
    if (record.disqualifiers.length < 16 && !record.disqualifiers.includes(reason))
      record.disqualifiers.push(reason);
  }

  // Invocation is registered before entering any native/user thunk, including synchronous reentry.
  function invokeOperation<T>(
    record: Attempt,
    name: DirectOperationName,
    invoke: () => T | PromiseLike<T>,
  ): Promise<T> {
    const entry = {};
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    record.pending.set(entry, { name, promise });
    record.generation++;
    const completion = promise.then(
      (value) => {
        record.pending.delete(entry);
        record.generation++;
        return value;
      },
      (error) => {
        record.pending.delete(entry);
        disqualify(record, "native-operation-rejected");
        throw error;
      },
    );
    // Observers and errors remain accounted even when cancellation wins the awaiting stage.
    void completion.catch(() => {});
    try {
      resolve(invoke());
    } catch (error) {
      reject(error);
    }
    return completion;
  }

  function interrupt(record: Attempt, late = false) {
    if (!record.started || (late ? record.lateInterrupt : record.initialInterrupt))
      return Promise.resolve();
    if (late) record.lateInterrupt = true;
    else record.initialInterrupt = true;
    return invokeOperation(record, "interrupt", async () => {
      const ack = await api.interrupt({ sessionID: record.admission.childID, resume: false });
      if (!ack || typeof ack.interrupted !== "boolean")
        throw new Error("invalid interrupt acknowledgment");
    });
  }

  function publishStop(record: Attempt, cause?: DirectStopCause) {
    if (record.stopped) return;
    stopped = true;
    record.stopped = true;
    record.phase = "stopped";
    record.generation++;
    record.cause = cause;
    record.error = Object.freeze(
      new Error("Harness direct implementation stopped; unresolved evidence retained."),
    );
    record.dispose();
    record.wake();
    void interrupt(record).catch(() => {});
    // Stop is visible before reporting; callbacks cannot erase its provenance or its ledger.
    if (!reported) {
      reported = true;
      try {
        onUncertain(
          "direct native attempt uncertain",
          Object.freeze({ handle: record.handle, ...(cause ? { cause } : {}) }),
        );
      } catch {
        disqualify(record, "stop-reporting-failed");
      }
    }
  }

  function fail(reason: string) {
    stopped = true;
    for (const record of records) {
      disqualify(record, reason);
      publishStop(record);
    }
  }

  function allowedStop(record: Attempt, code: DirectStopCause["code"]) {
    if (record.stopped) return;
    const cause = Object.freeze({ code }) as DirectStopCause;
    causes.set(cause, record);
    publishStop(record, cause);
    for (const other of records)
      if (other !== record) {
        disqualify(other, "another-attempt-stopped");
        publishStop(other);
      }
  }

  function observeStop(record: Attempt) {
    if (!record.stopped && record.caller.signal.aborted) allowedStop(record, "caller-cancelled");
    if (!record.stopped && now() >= record.admission.deadline)
      allowedStop(record, "deadline-expired");
  }

  function check(record: Attempt) {
    observeStop(record);
    if (stopped || record.stopped) throw record.error ?? new Error("direct transport stopped");
  }

  function assertBinding(
    handle: DirectAttemptHandle,
    admission: DirectAdmission,
    caller: DirectToolCaller,
  ) {
    const record = owned(handle);
    if (
      record.admission !== admission ||
      !admissions.has(admission) ||
      !sameCall(record.caller, caller) ||
      record.caller.signal !== caller.signal
    )
      throw new Error("invalid direct binding");
  }

  function prepare(
    admission: DirectAdmission,
    suppliedCaller: DirectToolCaller,
  ): DirectAttemptHandle {
    if (
      stopped ||
      !admissions.has(admission) ||
      !sameCall(admission.caller, suppliedCaller) ||
      !(suppliedCaller.signal instanceof AbortSignal) ||
      suppliedCaller.signal.aborted
    )
      throw new Error("invalid direct admission/caller");
    const remaining = admission.deadline - now();
    if (remaining <= 0 || remaining > 3600000) throw new Error("invalid direct deadline");
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
    const handle = Object.freeze({}) as DirectAttemptHandle;
    let wake!: () => void;
    const cancelled = new Promise<never>((_resolve, reject) => {
      wake = () => reject(record.error);
    });
    void cancelled.catch(() => {});
    const record: Attempt = {
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
      dispose: () => {},
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

  async function boundedDrain(record: Attempt) {
    let clear = () => {};
    const timeout = new Promise<void>((resolve) => {
      clear = schedule(2000, resolve);
    });
    const drain = async () => {
      while (record.pending.size)
        await Promise.allSettled([...record.pending.values()].map((entry) => entry.promise));
    };
    await Promise.race([drain(), timeout]);
    clear();
  }

  function validateChild(record: Attempt, child: SessionInfo) {
    if (
      !child ||
      child.id !== record.admission.childID ||
      child.parentID !== record.caller.sessionID ||
      child.agent !== "implementer"
    )
      throw new Error("direct child identity");
  }

  function validateFinal(record: Attempt, final: SessionInfo) {
    validateChild(record, final);
    if (
      final.time?.idle === undefined ||
      !["succeeded", "failed", "interrupted"].includes(final.outcome ?? "")
    )
      throw new Error("direct native final outcome");
  }

  function validateContext(
    record: Attempt,
    final: SessionInfo,
    messages: ReadonlyArray<NativeMessage>,
    recovery: boolean,
  ): ReadonlyArray<NativeMessage> {
    validateChild(record, final);
    const outcome = final.outcome;
    if (
      final.time?.idle === undefined ||
      !["succeeded", ...(recovery ? ["failed", "interrupted"] : [])].includes(outcome ?? "")
    )
      throw new Error("direct native final outcome");
    if (
      !Array.isArray(messages) ||
      messages.length > limits.maxContextMessages ||
      Buffer.byteLength(JSON.stringify(messages)) > limits.maxContextBytes
    )
      throw new Error("direct local context limit");
    const ids = new Set<string>();
    for (const message of messages) {
      if (!message || !string(message.id) || ids.has(message.id))
        throw new Error("direct message identity");
      ids.add(message.id);
    }
    const users = messages.filter((m) => m.type === "user");
    const own = messages.findIndex((m) => m.type === "user" && m.id === record.admission.promptID);
    const idle = messages.at(-1);
    if (
      users.length !== 1 ||
      own < 0 ||
      users[0]!.text !== record.admission.prompt ||
      idle?.type !== "idle" ||
      idle.outcome !== outcome ||
      (!recovery && idle.error !== undefined)
    )
      throw new Error("direct ambiguous turn");
    if (
      messages
        .slice(0, own)
        .some((m) => !["agent-switched", "model-switched", "location-switched"].includes(m.type))
    )
      throw new Error("direct child not fresh");
    const turn = messages.slice(own + 1, -1);
    if (
      (!recovery && !turn.length) ||
      turn.some(
        (m) =>
          m.type !== "assistant" || m.agent !== "implementer" || m.time?.completed === undefined,
      )
    )
      throw new Error("direct unexpected turn activity");
    return turn;
  }

  async function body(record: Attempt): Promise<DirectCandidate> {
    const { admission, caller } = record;
    const stage = async <T>(name: DirectOperationName, invoke: () => T | PromiseLike<T>) => {
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
        await invokeOperation(record, "child-acknowledgment", () =>
          onChild(Object.freeze({ ...child, time: Object.freeze({ ...child.time }) }), admission),
        );
      });
      await stage("prompt", async () => {
        const ack = await api.prompt({
          sessionID: admission.childID,
          id: admission.promptID,
          text: admission.prompt,
          delivery: "queue",
        });
        if (
          !ack ||
          ack.id !== admission.promptID ||
          ack.sessionID !== admission.childID ||
          ack.type !== "user" ||
          ack.delivery !== "queue" ||
          ack.payload?.text !== admission.prompt
        )
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
      const assistant = turn.at(-1)!;
      if (
        assistant.error !== undefined ||
        assistant.finish !== "stop" ||
        !assistant.content?.length ||
        assistant.content.some((c) => c.type !== "text" || typeof c.text !== "string")
      )
        throw new Error("direct invalid terminal assistant");
      const text = assistant.content.map((c) => c.text).join("");
      if (!text || text.length > limits.maxTerminalCharacters)
        throw new Error("direct terminal result limit");
      check(record);
      const candidate = Object.freeze({}) as DirectCandidate;
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
    } catch (error) {
      if (!record.stopped || error !== record.error) fail("direct-attempt-failed");
      record.dispose();
      await boundedDrain(record);
      throw record.error;
    }
  }

  function execute(handle: DirectAttemptHandle): Promise<DirectCandidate>;
  function execute(admission: DirectAdmission, caller: DirectToolCaller): Promise<DirectCandidate>;

  function execute(
    input: DirectAttemptHandle | DirectAdmission,
    caller?: DirectToolCaller,
  ): Promise<DirectCandidate> {
    let record: Attempt;
    try {
      record = owned(
        caller ? prepare(input as DirectAdmission, caller) : (input as DirectAttemptHandle),
      );
      if (record.started) throw new Error("direct execution already started");
      record.started = true;
      record.phase = record.stopped ? "stopped" : "executing";
    } catch (error) {
      return Promise.reject(error);
    }
    let resolve!: (candidate: DirectCandidate | PromiseLike<DirectCandidate>) => void;
    let reject!: (error: unknown) => void;
    const exposed = new Promise<DirectCandidate>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    // This observer is on the actual exposed promise, registered before callers can attach reactions.
    void exposed.then(
      () => {
        record.executionSettled = true;
        record.generation++;
      },
      () => {
        record.executionSettled = true;
        record.generation++;
      },
    );
    void body(record).then(resolve, reject);
    return exposed;
  }

  function assertTermination(receipt: DirectTerminationReceipt, handle: DirectAttemptHandle) {
    const record = owned(handle);
    const fact = receipts.get(receipt);
    if (
      !fact ||
      fact.record !== record ||
      fact.consumed ||
      currentReceipts.get(record) !== receipt ||
      fact.generation !== record.generation ||
      record.disqualifiers.length ||
      record.pending.size ||
      record.reservation ||
      record.phase !== "termination-proved"
    )
      throw new Error("invalid direct termination receipt");
  }

  async function reconcileStopped(
    handle: DirectAttemptHandle,
    assertCurrent: () => void = () => {},
  ): Promise<DirectTerminationReceipt> {
    const record = owned(handle);
    if (
      !record.stopped ||
      !record.cause ||
      causes.get(record.cause) !== record ||
      record.disqualifiers.length ||
      !record.executionSettled ||
      record.pending.size ||
      record.reservation ||
      !record.createAcknowledged ||
      !record.promptAcknowledged ||
      record.phase === "retired"
    )
      throw new Error("direct settlement is not eligible");
    // Reserve and invalidate the preceding receipt before invoking any trusted or native callback.
    record.reservation = true;
    record.phase = "reconciling";
    record.generation++;
    let generation = record.generation;
    const deadline = observationNow() + 2000;
    let clear = () => {};
    let expired = false;
    const timeoutError = new Error("direct observation timeout");
    const timeout = new Promise<never>((_resolve, reject) => {
      clear = schedule(2000, () => {
        expired = true;
        reject(timeoutError);
      });
    });
    void timeout.catch(() => {});
    const current = () => {
      if (expired || observationNow() >= deadline) throw timeoutError;
      if (
        record.generation !== generation ||
        record.disqualifiers.length ||
        record.phase !== "reconciling"
      )
        throw new Error("direct observation changed");
      assertCurrent();
      if (expired || observationNow() >= deadline) throw timeoutError;
      if (record.generation !== generation || record.disqualifiers.length)
        throw new Error("direct observation changed");
    };
    const step = async <T>(
      name: DirectOperationName,
      invoke: () => T | PromiseLike<T>,
    ): Promise<T> => {
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
      const receipt = Object.freeze({}) as DirectTerminationReceipt;
      receipts.set(receipt, {
        record,
        generation: record.generation,
        digest: createHash("sha256").update(JSON.stringify(messages)).digest("hex"),
        outcome: final.outcome!,
        consumed: false,
      });
      currentReceipts.set(record, receipt);
      record.phase = "termination-proved";
      return receipt;
    } catch (error) {
      if (error !== timeoutError) disqualify(record, "termination-observation-failed");
      record.phase = "stopped";
      throw error;
    } finally {
      clear();
      if (record.pending.size) {
        void Promise.allSettled([...record.pending.values()].map((entry) => entry.promise)).then(
          () => {
            record.reservation = false;
          },
        );
      } else record.reservation = false;
    }
  }

  function stop(reason: string): void;
  function stop(handle: DirectAttemptHandle, cause: DirectStopCause): void;

  function stop(reasonOrHandle: string | DirectAttemptHandle, cause?: DirectStopCause) {
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
    observeStopCause(handle: DirectAttemptHandle) {
      const record = owned(handle);
      observeStop(record);
      return record.cause;
    },
    stopCause(handle: DirectAttemptHandle) {
      return owned(handle).cause;
    },
    isStopCause(handle: DirectAttemptHandle, cause: unknown) {
      const record = owned(handle);
      return (
        typeof cause === "object" &&
        cause !== null &&
        causes.get(cause) === record &&
        record.cause === cause
      );
    },
    stoppedError(handle: DirectAttemptHandle) {
      return owned(handle).error;
    },
    inspectSettlement(handle: DirectAttemptHandle): DirectSettlementView {
      const record = owned(handle);
      const pending: Record<DirectOperationName, number> = {
        create: 0,
        prompt: 0,
        wait: 0,
        get: 0,
        context: 0,
        interrupt: 0,
        "child-acknowledgment": 0,
      };
      for (const entry of record.pending.values()) pending[entry.name]++;
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
    consumeTermination(receipt: DirectTerminationReceipt, handle: DirectAttemptHandle) {
      assertTermination(receipt, handle);
      const record = owned(handle);
      receipts.get(receipt)!.consumed = true;
      record.phase = "retired";
      record.generation++;
    },
    assertSameTermination(
      previous: DirectTerminationReceipt,
      current: DirectTerminationReceipt,
      handle: DirectAttemptHandle,
    ) {
      assertTermination(current, handle);
      const before = receipts.get(previous),
        after = receipts.get(current)!;
      if (
        previous === current ||
        !before ||
        before.record !== owned(handle) ||
        before.consumed ||
        before.digest !== after.digest ||
        before.outcome !== after.outcome
      )
        throw new Error("direct termination changed");
    },
    consumeCandidate(
      candidate: DirectCandidate,
      admission: DirectAdmission,
      caller: DirectToolCaller,
    ): DirectEvidence {
      const receipt = candidates.get(candidate);
      candidates.delete(candidate);
      try {
        if (!receipt || receipt.record.consumed) throw new Error("invalid direct candidate");
        assertBinding(receipt.record.handle, admission, caller);
        receipt.record.consumed = true;
        check(receipt.record);
        if (receipt.record.pending.size) throw new Error("pending direct candidate operation");
        receipt.record.dispose();
        return receipt.evidence;
      } catch {
        fail("invalid-candidate");
        throw new Error("invalid direct candidate");
      }
    },
  };
}
