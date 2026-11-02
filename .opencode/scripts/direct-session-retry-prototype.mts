/** Source-only feasibility spike. No registration, transport, persistence or managed-guard authority.
 * Native context is an unbounded read: these limits apply only AFTER the host allocates its result.
 * Observed extra prompts are denied; the public API supplies no exclusive child lock against UI/plugins.
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  assertAllowedTransition,
  captureWorkspace,
  verifyAcceptance,
} from "../src/plugin-modules/acceptance-proof.ts";
import type { WorkspaceSnapshot } from "../src/plugin-modules/acceptance-proof.ts";
import { createDispatchController } from "../src/plugin-modules/dispatch-controller.ts";
import { validateTaskPacket, validateTaskResult } from "../src/plugin-modules/task-contracts.ts";
import type { TaskContext } from "../src/plugin-modules/task-contracts.ts";

/** Structural projections of public native types, not substitute native schemas. */
export interface SessionInfo {
  id: string;
  parentID?: string | undefined;
  agent?: string | undefined;
  outcome?: string | undefined;
  time: { idle?: unknown };
}
export interface NativeMessage {
  id: string;
  sessionID: string;
  type: string;
  text?: string;
  agent?: string;
  content?: { type: string; text?: string }[];
  finish?: string;
  error?: unknown;
  time?: { completed?: unknown };
  outcome?: string;
}
export interface DirectSessionApi {
  create(input: { parentID: string; agent: string }): Promise<SessionInfo>;
  prompt(input: {
    sessionID: string;
    id?: string;
    text: string;
    metadata?: Record<string, unknown>;
    delivery?: "queue" | "steer";
    resume?: boolean;
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
  interrupt(input: { sessionID: string }): Promise<{ interrupted: boolean }>;
}
export interface TrustedToolContext {
  readonly sessionID: string;
  readonly agent: string;
  readonly messageID: string;
  readonly id: string;
  readonly signal: AbortSignal;
}
export interface PrototypeOptions {
  api: DirectSessionApi;
  root: string;
  workflow: unknown;
  parent: { sessionID: string; agent: string };
  limits: {
    timeoutMs: number;
    reconciliationMs: number;
    maxAttempts: number;
    maxContextMessages: number;
    maxContextBytes: number;
  };
  clock?: {
    now(): number;
    schedule(ms: number, callback: () => void): () => void;
  };
  /** Trusted independent evidence, never child-claimed command results. */
  proof(input: {
    before: WorkspaceSnapshot;
    after: WorkspaceSnapshot;
    taskID: string;
  }): Parameters<typeof verifyAcceptance>[0];
}
export type PrototypeResult = {
  status: "accepted" | "rejected" | "stopped" | "denied";
  reason: string;
  attempts: number;
};

const realClock = {
  now: () => Date.now(),
  schedule(ms: number, callback: () => void) {
    const timer = setTimeout(callback, ms);
    return () => clearTimeout(timer);
  },
};

export function createPrototype(options: PrototypeOptions) {
  // Capture authority/configuration before the first await; caller mutations cannot enlarge it.
  const api = options.api;
  const root = options.root;
  const limits = { ...options.limits };
  const parent = { ...options.parent };
  const clock = options.clock ?? realClock;
  const proof = options.proof;
  for (const value of Object.values(limits))
    if (!Number.isSafeInteger(value) || value < 1) throw new Error("invalid prototype limits");
  if (limits.maxAttempts > 2) throw new Error("spike supports at most one fresh retry");
  const controller = createDispatchController(structuredClone(options.workflow), {
    now: () => clock.now(),
    timeoutMs: limits.timeoutMs + limits.reconciliationMs + 1,
  });
  const calls = new Set<string>();
  const children = new Set<string>();
  let serial = 0;
  let busy = false;
  let stopped = false;
  const instance = randomUUID();
  const response = (
    status: PrototypeResult["status"],
    reason: string,
    attempts: number,
  ): PrototypeResult => ({ status, reason, attempts });

  async function run(trusted: TrustedToolContext, input: unknown): Promise<PrototypeResult> {
    if (busy || stopped) return response("denied", "instance busy or retained", 0);
    if (
      trusted.sessionID !== parent.sessionID ||
      trusted.agent !== parent.agent ||
      !trusted.messageID ||
      !trusted.id ||
      !(trusted.signal instanceof AbortSignal) ||
      trusted.signal.aborted ||
      calls.has(trusted.id)
    )
      return response("denied", "untrusted or consumed call", 0);
    const call = {
      sessionID: trusted.sessionID,
      messageID: trusted.messageID,
      id: trusted.id,
      signal: trusted.signal,
    };
    let packet: ReturnType<typeof validateTaskPacket>;
    const role = "implementer";
    try {
      // The spike intentionally supports one bounded implementation mapping, preserving real contracts.
      packet = validateTaskPacket(role, structuredClone(input));
      if (
        packet.taskMode !== "implementation" ||
        packet.orchestrationId !== controller.spec.orchestrationId
      )
        throw new Error("workflow identity mismatch");
    } catch {
      return response("denied", "invalid task packet", 0);
    }
    calls.add(call.id);
    busy = true;
    let attempts = 0;
    try {
      for (; attempts < limits.maxAttempts; ) {
        const taskID = `${controller.spec.orchestrationId}-task-${++serial}`;
        const context: TaskContext = {
          orchestrationId: controller.spec.orchestrationId,
          delegationTaskId: taskID,
          scopeKey: String(packet.scopeKey),
          role,
          taskMode: String(packet.taskMode),
        };
        const ownPacket = validateTaskPacket(role, { ...packet, delegationTaskId: taskID });
        const text = JSON.stringify(ownPacket);
        const promptID = `msg_${instance}_${serial}`;
        let before: WorkspaceSnapshot;
        try {
          before = captureWorkspace(root);
          controller.reserve({
            id: taskID,
            workUnitId: context.scopeKey,
            role,
            taskMode: context.taskMode,
            parentSessionId: call.sessionID,
          });
        } catch {
          return response("denied", "reservation or workspace rejected", attempts);
        }
        attempts++;
        let child: string | undefined;
        let cancelled = false;
        const deadline = clock.now() + limits.timeoutMs;
        const expired = () => cancelled || call.signal.aborted || clock.now() >= deadline;
        let stopWake!: () => void;
        const stop = new Promise<never>((_, reject) => {
          stopWake = () => {
            cancelled = true;
            reject(new Error("stop"));
          };
        });
        // Every started operation has a rejection handler; late callbacks never complete a controller attempt.
        const pending = new Set<Promise<unknown>>();
        const track = <T,>(operation: Promise<T>): Promise<T> => {
          pending.add(operation);
          void operation.then(
            () => pending.delete(operation),
            () => pending.delete(operation),
          );
          return operation;
        };
        const interrupt = () => {
          if (child) {
            try {
              track(api.interrupt({ sessionID: child })).catch(() => {});
            } catch {
              /* retain */
            }
          }
        };
        const abort = () => {
          stopWake();
          interrupt();
        };
        const cancelTimer = clock.schedule(limits.timeoutMs, abort);
        call.signal.addEventListener("abort", abort, { once: true });
        const stage = async <T,>(operation: Promise<T>) => {
          const value = await Promise.race([track(operation), stop]);
          if (expired()) throw new Error("deadline or cancellation");
          return value;
        };
        let safeIdle = false;
        const scope = () => {
          const after = captureWorkspace(root);
          assertAllowedTransition(
            before,
            after,
            controller.spec.workUnits.find((u) => u.id === context.scopeKey)!.allowedPaths,
          );
          return after;
        };
        try {
          if (call.signal.aborted) abort();
          const creation = track(api.create({ parentID: call.sessionID, agent: role }));
          void creation.then(
            (info) => {
              // Still correlate and interrupt a child that appears after the stopped response.
              if (
                !child &&
                info.parentID === call.sessionID &&
                info.agent === role &&
                !children.has(info.id)
              ) {
                child = info.id;
                children.add(info.id);
                if (cancelled) interrupt();
              }
            },
            () => {},
          );
          const info = await stage(creation);
          if (
            !info.id ||
            info.parentID !== call.sessionID ||
            info.agent !== role ||
            child !== info.id
          )
            throw new Error("child identity");
          const ack = await stage(
            api.prompt({ sessionID: child!, id: promptID, text, delivery: "queue" }),
          );
          if (
            ack.id !== promptID ||
            ack.sessionID !== child ||
            ack.type !== "user" ||
            ack.delivery !== "queue" ||
            ack.payload.text !== text
          )
            throw new Error("prompt identity");
          // Prompt acknowledgment can arrive after interrupt. Cancellation always stops here.
          if (expired()) throw new Error("cancelled");
          await stage(api.wait({ sessionID: child! }));
          const final = await stage(api.get({ sessionID: child! }));
          const messages = await stage(api.context({ sessionID: child! }));
          if (
            cancelled ||
            pending.size ||
            final.id !== child ||
            final.parentID !== call.sessionID ||
            final.agent !== role ||
            final.time.idle === undefined ||
            final.outcome !== "succeeded"
          )
            throw new Error("native final outcome");
          // There is deliberately no claim that this bounds the native allocation/read.
          if (
            messages.length > limits.maxContextMessages ||
            Buffer.byteLength(JSON.stringify(messages)) > limits.maxContextBytes
          )
            throw new Error("local context limit");
          const ids = new Set<string>();
          for (const message of messages) {
            if (!message.id || ids.has(message.id) || message.sessionID !== child)
              throw new Error("message identity");
            ids.add(message.id);
          }
          const users = messages.filter((m) => m.type === "user");
          const own = messages.findIndex((m) => m.type === "user" && m.id === promptID);
          const idle = messages.at(-1);
          if (
            users.length !== 1 ||
            own < 0 ||
            users[0]!.text !== text ||
            idle?.type !== "idle" ||
            idle.outcome !== "succeeded" ||
            idle.error !== undefined
          )
            throw new Error("ambiguous turn");
          // Permit initial native selection events only before our prompt; no switches/steering in turn.
          if (
            messages
              .slice(0, own)
              .some(
                (m) => !["agent-switched", "model-switched", "location-switched"].includes(m.type),
              )
          )
            throw new Error("child not fresh");
          const turn = messages.slice(own + 1, -1);
          if (!turn.length || turn.some((m) => m.type !== "assistant"))
            throw new Error("unexpected turn activity");
          const assistant = turn.at(-1)!;
          if (
            assistant.agent !== role ||
            assistant.error !== undefined ||
            assistant.time?.completed === undefined ||
            assistant.finish !== "stop" ||
            !assistant.content?.length ||
            assistant.content.some((c) => c.type !== "text" || typeof c.text !== "string")
          )
            throw new Error("invalid terminal assistant");
          // Never search backwards for a passing envelope; only the terminal assistant is eligible.
          const result = validateTaskResult(assistant.content.map((c) => c.text).join(""), context);
          if (result.outcome !== "success") throw new Error("unsuccessful task result");
          safeIdle = true;
          const after = scope();
          try {
            const supplied = proof({ before, after, taskID });
            // Root/scope/revision bindings belong to the wrapper, regardless of evidence callback fields.
            verifyAcceptance({
              ...supplied,
              before,
              after,
              current: captureWorkspace(root),
              allowedPaths: controller.spec.workUnits.find((u) => u.id === context.scopeKey)!
                .allowedPaths,
            });
          } catch {
            scope();
            if (expired() || pending.size) throw new Error("stop during proof");
            controller.complete(taskID, "failed");
            if (attempts === limits.maxAttempts)
              return response("rejected", "acceptance proof rejected", attempts);
            continue;
          }
          scope();
          if (expired() || pending.size) throw new Error("stop during acceptance");
          controller.complete(taskID, "success");
          return response("accepted", "wrapper proof accepted", attempts);
        } catch {
          stopped = true;
          try {
            controller.cancel(taskID);
          } catch {
            /* deadline may already retain it */
          }
          interrupt();
          // Bound reconciliation without calling pending interrupt a termination acknowledgment.
          await new Promise<void>((resolve) => {
            const clear = clock.schedule(limits.reconciliationMs, resolve);
            void Promise.allSettled([...pending]).then(() => {
              clear();
              resolve();
            });
          });
          try {
            scope();
          } catch {
            return response("stopped", "workspace scope unsafe; reservation retained", attempts);
          }
          return response(
            "stopped",
            safeIdle
              ? "proof or identity uncertain; reservation retained"
              : "native completion uncertain; reservation retained",
            attempts,
          );
        } finally {
          cancelTimer();
          call.signal.removeEventListener("abort", abort);
        }
      }
      return response("rejected", "attempt limit", attempts);
    } finally {
      busy = false;
    }
  }

  return { run, snapshot: () => controller.snapshot() };
}

/** Optional read-only source check: source evidence, never live execution/provider evidence. */
export function auditNativeSource(root: string) {
  let commit: string;
  try {
    commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    throw new Error("native source audit unavailable");
  }
  if (commit !== "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824")
    throw new Error("native source pin mismatch");
  const workingTreeDifferences: string[] = [];
  const read = (file: string) => {
    const bytes = readFileSync(path.join(root, file), "utf8");
    const committed = execFileSync("git", ["-C", root, "show", `${commit}:${file}`], {
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    });
    if (bytes !== committed) workingTreeDifferences.push(file);
    return committed;
  };
  const api = read("packages/client/src/effect/api/api.ts");
  const adapter = read("packages/plugin/src/promise/adapter.ts");
  for (const method of ["create", "prompt", "wait", "get", "context", "interrupt"])
    if (
      !adapter.includes(
        `adaptApiMethod(SessionEndpoints["session.${method}"], host.session.${method})`,
      )
    )
      throw new Error("promise forwarding mismatch");
  for (const signature of [
    "SessionCreateOutput = Session.Info",
    "SessionPromptOutput = SessionInbox.User",
    "SessionWaitOutput = void",
    "SessionGetOutput = Session.Info",
    "SessionContextInput = { readonly sessionID: Session.ID }",
    "SessionContextOutput = ReadonlyArray<SessionMessage.Info>",
    "SessionInterruptOutput = { readonly interrupted: boolean }",
  ])
    if (!api.includes(signature)) throw new Error("public session shape mismatch");
  const tool = read("packages/schema/src/tool.ts") + read("packages/plugin/src/promise/tool.ts");
  for (const field of [
    "readonly sessionID:",
    "readonly agent:",
    "readonly messageID:",
    "readonly id:",
    "signal: AbortSignal",
  ])
    if (!tool.includes(field)) throw new Error("trusted context shape mismatch");
  const message = read("packages/schema/src/session-message.ts");
  for (const shape of [
    'type: Schema.tag("idle")',
    'Schema.Literals(["succeeded", "failed", "interrupted"])',
    "content: AssistantContent.pipe(Schema.Array)",
    "completed: DateTimeUtcFromMillis.pipe(optional)",
    "error: SessionError.Error.pipe(optional)",
  ])
    if (!message.includes(shape)) throw new Error("native message shape mismatch");
  const session = read("packages/schema/src/session.ts");
  if (
    !session.includes("idle: DateTimeUtcFromMillis.pipe(optional)") ||
    !session.includes('outcome: Schema.Literals(["succeeded", "failed", "interrupted"])')
  )
    throw new Error("native session idle shape mismatch");
  const inbox = read("packages/schema/src/session-inbox.ts");
  if (
    !inbox.includes("...Enqueued, ...UserItem.fields") ||
    !inbox.includes("id: SessionMessage.ID") ||
    !inbox.includes("sessionID: SessionID")
  )
    throw new Error("native prompt acknowledgment shape mismatch");
  const nativeSession = read("packages/core/src/session/session.ts");
  const nativeExecution = read("packages/core/src/session/execution.ts");
  if (
    !nativeSession.includes('const wait = Effect.fn("Session.wait")') ||
    !nativeSession.includes("yield* execution.awaitIdle(sessionID)") ||
    !nativeExecution.includes("awaitIdle: coordinator.awaitIdle")
  )
    throw new Error("native wait forwarding mismatch");
  const coordinator = read("packages/core/src/session/run-coordinator.ts");
  const hook = coordinator.indexOf("options.settled?.(key, exit, execution.interruptionReason)");
  const settle = coordinator.indexOf("Effect.sync(() => settle(key, execution, exit))");
  if (
    hook < 0 ||
    settle <= hook ||
    !coordinator.includes(
      "Deferred.await(execution.done).pipe(Effect.ignoreCause, Effect.andThen(awaitIdle(key)))",
    )
  )
    throw new Error("native wait settlement ordering mismatch");
  return {
    commit,
    source: "committed Git blobs at exact pin",
    workingTreeDifferences,
    evidence: "public shapes, promise forwarding and coordinator finalizer ordering",
    limits: "static audit only; no live activation or exclusive session lock",
  };
}
