/** Public native-session transport. Bounds apply after native context allocation; there is no child lock. */
import { randomUUID } from "node:crypto";
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
  schedule?: (ms: number, callback: () => void) => () => void;
  limits?: {
    maxContextMessages?: number;
    maxContextBytes?: number;
    maxTerminalCharacters?: number;
    maxOwnedAttempts?: number;
  };
  onUncertain: (reason: string) => void;
  onChild: (child: Readonly<SessionInfo>, admission: DirectAdmission) => void | Promise<void>;
}
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
  type Record = {
    admission: DirectAdmission;
    caller: DirectToolCaller;
    pending: Set<Promise<unknown>>;
    stopped: boolean;
    wake: () => void;
    dispose: () => void;
    interrupt: () => void;
    reconcile: () => Promise<void>;
    consumed: boolean;
  };

  const records: Record[] = [];
  const used = new Set<string>();
  const candidates = new WeakMap<object, { record: Record; evidence: DirectEvidence }>();
  let stopped = false;
  let reported = false;
  const fail = (reason: string) => {
    stopped = true;
    for (const record of records) {
      record.stopped = true;
      record.wake();
      record.interrupt();
      record.dispose();
      void record.reconcile();
    }
    if (!reported) {
      reported = true;
      try {
        onUncertain(reason);
      } catch {
        /* Local stopped state remains authoritative if reporting fails. */
      }
    }
  };

  function check(record: Record) {
    if (
      stopped ||
      record.stopped ||
      record.caller.signal.aborted ||
      now() >= record.admission.deadline
    )
      throw new Error("direct attempt stopped or expired");
  }

  return {
    stop(reason: string) {
      fail(reason);
    },
    async execute(
      admission: DirectAdmission,
      suppliedCaller: DirectToolCaller,
    ): Promise<DirectCandidate> {
      if (
        stopped ||
        !admissions.has(admission) ||
        !sameCall(admission.caller, suppliedCaller) ||
        !suppliedCaller.signal ||
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
      const caller = Object.freeze({ ...admission.caller, signal: suppliedCaller.signal });
      let wake!: () => void;
      const cancelled = new Promise<never>((_resolve, reject) => {
        wake = () => reject(new Error("direct attempt stopped"));
      });
      // A stopped completed candidate may have no stage awaiting this signal.
      void cancelled.catch(() => {});
      const record: Record = {
        admission,
        caller,
        pending: new Set(),
        stopped: false,
        wake,
        dispose: () => {},
        interrupt: () => {},
        reconcile: async () => {},
        consumed: false,
      };
      records.push(record);
      const track = <T>(operation: Promise<T>) => {
        record.pending.add(operation);
        void operation.then(
          () => record.pending.delete(operation),
          () => record.pending.delete(operation),
        );
        return operation;
      };
      let launched = false;
      record.interrupt = () => {
        if (!launched) return;
        try {
          void track(api.interrupt({ sessionID: admission.childID, resume: false })).catch(
            () => {},
          );
        } catch {
          /* retained uncertainty */
        }
      };
      const abort = () => {
        fail("direct cancellation or deadline");
      };
      const cancelTimer = schedule(remaining, abort);
      caller.signal.addEventListener("abort", abort, { once: true });
      record.dispose = () => {
        cancelTimer();
        caller.signal.removeEventListener("abort", abort);
      };
      let reconciliation: Promise<void> | undefined;
      record.reconcile = () =>
        (reconciliation ??= new Promise<void>((resolve) => {
          const clear = schedule(2000, resolve);
          void Promise.allSettled([...record.pending]).then(() => {
            clear();
            resolve();
          });
        }));
      const stage = async <T>(invoke: () => Promise<T>) => {
        check(record);
        const value = await Promise.race([track(invoke()), cancelled]);
        check(record);
        return value;
      };
      try {
        launched = true;
        const creation = track(
          api.create({
            id: admission.childID,
            parentID: caller.sessionID,
            agent: "implementer",
            model: admission.model,
            ...(admission.title !== undefined ? { title: admission.title } : {}),
          }),
        );
        void creation.then(
          () => {
            if (record.stopped) record.interrupt();
          },
          () => {},
        );
        const child = await stage(() => creation);
        if (
          child.id !== admission.childID ||
          child.parentID !== caller.sessionID ||
          child.agent !== "implementer"
        )
          throw new Error("direct child identity");
        await stage(() =>
          Promise.resolve(
            onChild(Object.freeze({ ...child, time: Object.freeze({ ...child.time }) }), admission),
          ),
        );
        const ack = await stage(() =>
          api.prompt({
            sessionID: admission.childID,
            id: admission.promptID,
            text: admission.prompt,
            delivery: "queue",
          }),
        );
        if (
          ack.id !== admission.promptID ||
          ack.sessionID !== admission.childID ||
          ack.type !== "user" ||
          ack.delivery !== "queue" ||
          ack.payload.text !== admission.prompt
        )
          throw new Error("direct prompt identity");
        await stage(() => api.wait({ sessionID: admission.childID }));
        const final = await stage(() => api.get({ sessionID: admission.childID }));
        const messages = await stage(() => api.context({ sessionID: admission.childID }));
        if (
          record.pending.size ||
          final.id !== admission.childID ||
          final.parentID !== caller.sessionID ||
          final.agent !== "implementer" ||
          final.time.idle === undefined ||
          final.outcome !== "succeeded"
        )
          throw new Error("direct native final outcome");
        if (!Array.isArray(messages as unknown)) throw new Error("direct invalid context");
        if (
          messages.length > limits.maxContextMessages ||
          Buffer.byteLength(JSON.stringify(messages)) > limits.maxContextBytes
        )
          throw new Error("direct local context limit");
        const ids = new Set<string>();
        for (const message of messages) {
          if (!string(message.id) || ids.has(message.id))
            throw new Error("direct message identity");
          ids.add(message.id);
        }
        const users = messages.filter((m) => m.type === "user");
        const own = messages.findIndex((m) => m.type === "user" && m.id === admission.promptID);
        const idle = messages.at(-1);
        if (
          users.length !== 1 ||
          own < 0 ||
          users[0]!.text !== admission.prompt ||
          idle?.type !== "idle" ||
          idle.outcome !== "succeeded" ||
          idle.error !== undefined
        )
          throw new Error("direct ambiguous turn");
        if (
          messages
            .slice(0, own)
            .some(
              (m) => !["agent-switched", "model-switched", "location-switched"].includes(m.type),
            )
        )
          throw new Error("direct child not fresh");
        const turn = messages.slice(own + 1, -1);
        if (!turn.length || turn.some((m) => m.type !== "assistant"))
          throw new Error("direct unexpected turn activity");
        const assistant = turn.at(-1)!;
        if (
          assistant.agent !== "implementer" ||
          assistant.error !== undefined ||
          assistant.time?.completed === undefined ||
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
      } catch {
        fail("direct native attempt uncertain");
        record.dispose();
        await record.reconcile();
        // Pending operations stay in the ledger; interrupt acknowledgment is not idle proof.
        throw new Error("direct native attempt uncertain");
      }
    },
    consumeCandidate(
      candidate: DirectCandidate,
      admission: DirectAdmission,
      caller: DirectToolCaller,
    ): DirectEvidence {
      const receipt = candidates.get(candidate);
      candidates.delete(candidate);
      try {
        if (
          !receipt ||
          receipt.record.consumed ||
          receipt.record.admission !== admission ||
          !sameCall(admission.caller, caller) ||
          receipt.record.caller.signal !== caller.signal
        )
          throw new Error("invalid direct candidate");
        receipt.record.consumed = true;
        check(receipt.record);
        if (receipt.record.pending.size) throw new Error("pending direct candidate operation");
        receipt.record.dispose();
        return receipt.evidence;
      } catch {
        fail("invalid direct candidate");
        throw new Error("invalid direct candidate");
      }
    },
  };
}
