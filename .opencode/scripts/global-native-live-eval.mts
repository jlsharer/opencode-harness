/** Source-only controlled-native observation driver. It never grants LIVE acceptance. */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import {
  createGlobalNativeAdapter,
  decodeGlobalEnvelope,
  replaceGlobalResult,
} from "../src/plugin-modules/global-native-plugin.ts";
import type {
  GlobalNativeContext,
  GlobalControlTool,
  NativeEvent,
} from "../src/plugin-modules/global-native-plugin.ts";
import { object } from "../src/plugin-modules/global-protocol.ts";
import type { TaskContext } from "../src/plugin-modules/task-contracts.ts";

export interface EvalNativeToolContext extends Record<string, unknown> {
  sessionID: string;
  agent: string;
  messageID: string;
  id: string;
  signal: AbortSignal;
  progress(update: Record<string, unknown>): Promise<void>;
}
export interface EvalTool extends Omit<GlobalControlTool, "execute"> {
  execute(
    input: unknown,
    context: EvalNativeToolContext,
  ): Promise<{ output: unknown; content: string }>;
}
interface Registration {
  dispose(): Promise<void>;
}
export interface EvalNativeContext extends GlobalNativeContext {
  location: { directory: string };
  options: Record<string, unknown>;
  plugin: { list(): Promise<unknown[]> };
  event: {
    subscribe(options: { signal: AbortSignal }): AsyncIterable<{ type: string; data: unknown }>;
  };
}
export interface EvalArmRequest {
  mode: "continuation-rendezvous" | "completed-after-hold";
  controlVersion: 1 | 2;
  context: TaskContext;
  childSessionID: string;
  requestNonce: string;
}
export interface EvalSnapshot {
  attemptID: string | null;
  mode: EvalArmRequest["mode"] | null;
  phase: string;
  diagnostic: "PENDING" | "OBSERVED" | "INCONCLUSIVE";
  identities: Record<string, unknown> | null;
  observations: { sequence: number; type: string; data: unknown }[];
  cancellation: unknown;
  callbackBeforeHash: string | null;
  callbackReleaseHash: string | null;
  result: unknown;
  missingSurfaces: string[];
  token: string | null;
  continuationPrompt: string | null;
}
const PREFIX = "<<<HARNESS_TASK_THREAD_POLICY_V1>>>\n",
  SUFFIX = "\n<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>";

function canonical(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string")
    return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (typeof value !== "object" || !value || Object.getPrototypeOf(value) !== Object.prototype)
    throw Error("non-JSON value");
  return (
    "{" +
    Object.keys(value)
      .sort()
      .map((k) => JSON.stringify(k) + ":" + canonical((value as Record<string, unknown>)[k]))
      .join(",") +
    "}"
  );
}

function bounded(value: unknown): unknown {
  const text = canonical(value);
  if (Buffer.byteLength(text) > 65536) throw Error("payload bound exceeded");
  return JSON.parse(text);
}

const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");

const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);

const native = (e: NativeEvent): EvalNativeToolContext => ({
  sessionID: e.sessionID,
  agent: e.agent,
  messageID: e.messageID,
  id: e.id,
  signal: new AbortController().signal,
  progress: async () => {},
});

const exact = (input: Record<string, unknown>, keys: string[]) => {
  if (Object.keys(input).sort().join() !== keys.sort().join())
    throw Error("unexpected evaluation fields");
};

export async function createGlobalNativeLiveEval(
  ctx: EvalNativeContext,
  options: { timeoutMs?: number; traceRoot: string; now?: () => number },
) {
  const timeoutMs = options.timeoutMs ?? 15000,
    now = options.now ?? Date.now;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000)
    throw Error("invalid finite evaluation timeout");
  if (
    !ctx.event?.subscribe ||
    !ctx.plugin?.list ||
    !ctx.location?.directory ||
    !ctx.tool?.list ||
    !ctx.tool?.hook ||
    !ctx.tool?.transform ||
    !ctx.session?.get ||
    !ctx.session?.hook ||
    !ctx.command?.transform
  )
    throw Error("missing native evaluation capability");
  const inventory = await ctx.tool.list();
  if (
    inventory.some((t) =>
      ["harness_orchestration", "harness_eval_control", "harness_eval_rendezvous"].includes(t.id),
    )
  )
    throw Error("duplicate adapter/control ownership");
  const plugins = await ctx.plugin.list();
  if (
    plugins.some((p) => {
      const s = canonical(p);
      return s.includes('"opencode-harness.global.v1"');
    })
  )
    throw Error("duplicate adapter plugin ownership");
  let disposed = false,
    disposePromise: Promise<void> | undefined,
    streamClosed = false,
    sequence = 0;
  const registrations: Registration[] = [];
  const abort = new AbortController();
  let control: GlobalControlTool | undefined;
  const observed = new Map<
    string,
    {
      event: NativeEvent;
      context: TaskContext;
      cwd: string;
      parentAgent: string | undefined;
      deadline: number;
      generation: string;
      child: string;
      nonce: string;
    }
  >();
  const admitted = new Map<
    string,
    {
      event: NativeEvent;
      context: TaskContext;
      cwd: string;
      parentAgent: string | undefined;
      deadline: number;
      generation: string;
    }
  >();
  let snapshot: EvalSnapshot = {
    attemptID: null,
    mode: null,
    phase: "idle",
    diagnostic: "PENDING",
    identities: null,
    observations: [],
    cancellation: null,
    callbackBeforeHash: null,
    callbackReleaseHash: null,
    result: null,
    missingSurfaces: [
      "native parent-visible content",
      "native model content",
      "native terminal content",
    ],
    token: null,
    continuationPrompt: null,
  };
  let attempt:
    | {
        request: EvalArmRequest;
        original: NonNullable<ReturnType<typeof observed.get>>;
        deadline: number;
        continuation: NativeEvent | null;
        progress: boolean;
        used: boolean;
        afterSeen: boolean;
        cancelled: boolean;
        stop: Promise<never>;
        stopReject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
      }
    | undefined;
  const fail = (reason: string) => {
    snapshot.diagnostic = "INCONCLUSIVE";
    snapshot.phase = reason;
    attempt?.stopReject(Error(reason));
  };

  function record(type: string, data: unknown) {
    try {
      if (snapshot.observations.length >= 256) throw Error("observation bound exceeded");
      snapshot.observations.push({ sequence: ++sequence, type, data: bounded(data) });
    } catch (error) {
      fail(error instanceof Error ? error.message : "invalid observation");
      throw error;
    }
  }

  async function finite<T>(operation: Promise<T>, milliseconds: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(Error(label)), Math.max(1, milliseconds));
        }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  const pendingNative = new Set<Promise<unknown>>();

  function trackNative<T>(operation: Promise<T>): Promise<T> {
    pendingNative.add(operation);
    void operation.finally(() => pendingNative.delete(operation)).catch(() => {});
    return operation;
  }

  type ObservationScope = { deadline: number; signal?: AbortSignal };

  function checkScope(scope: ObservationScope) {
    if (disposed) throw Error("evaluation disposed");
    if (scope.signal?.aborted) throw Error("native observation aborted");
    if (now() >= scope.deadline) throw Error("native observation deadline expired");
  }

  async function wait<T>(operation: Promise<T>, scope?: ObservationScope): Promise<T> {
    trackNative(operation);
    if (scope) {
      let onAbort!: () => void;
      try {
        checkScope(scope);
        const interrupted = new Promise<never>((_, reject) => {
          onAbort = () => reject(Error("native observation aborted/disposed"));
          scope.signal?.addEventListener("abort", onAbort, { once: true });
          abort.signal.addEventListener("abort", onAbort, { once: true });
        });
        const value = await finite(
          Promise.race([operation, interrupted, ...(attempt ? [attempt.stop] : [])]),
          scope.deadline - now(),
          "native observation deadline expired",
        );
        checkScope(scope);
        return value;
      } finally {
        if (onAbort) {
          scope.signal?.removeEventListener("abort", onAbort);
          abort.signal.removeEventListener("abort", onAbort);
        }
      }
    }
    if (!attempt) return finite(operation, timeoutMs, "native observation timeout");
    return Promise.race([operation, attempt.stop]);
  }

  const pendingCallbacks = new Set<Promise<void>>();

  async function authoritativeBefore(
    callback: (event: NativeEvent) => Promise<void>,
    event: NativeEvent,
  ) {
    const scope = { deadline: attempt?.deadline ?? now() + timeoutMs };
    checkScope(scope);
    const operation = callback(event);
    pendingCallbacks.add(operation);
    void operation.finally(() => pendingCallbacks.delete(operation)).catch(() => {});
    try {
      await wait(operation, scope);
      // The real callback remains the admission authority, but late settlement
      // must never return launch permission through this registered wrapper.
      if (snapshot.diagnostic === "INCONCLUSIVE") throw Error("evaluation before inconclusive");
    } catch (error) {
      fail(String(error));
      throw error;
    }
  }

  async function authoritativeAfter(
    callback: (event: NativeEvent) => Promise<void>,
    event: NativeEvent,
  ) {
    let timedOut = false;
    const operation = callback(event).finally(() => {
      if (timedOut)
        replaceGlobalResult(
          event,
          "source evaluation native callback unresolved; observation inconclusive",
        );
    });
    pendingCallbacks.add(operation);
    void operation.finally(() => pendingCallbacks.delete(operation)).catch(() => {});
    try {
      await finite(
        operation,
        attempt ? Math.min(timeoutMs, attempt.deadline - now()) : timeoutMs,
        "authoritative native after unresolved",
      );
    } catch (error) {
      timedOut = true;
      replaceGlobalResult(
        event,
        "source evaluation native callback unresolved; observation inconclusive",
      );
      fail(String(error));
      throw error;
    }
  }

  async function registration(value: unknown) {
    const r = value as Registration;
    if (!r || typeof r.dispose !== "function")
      throw Error("native registration disposal unavailable");
    registrations.push(r);
    return r;
  }

  async function identity(
    original: NonNullable<ReturnType<typeof observed.get>>,
    scope?: ObservationScope,
  ) {
    const p = await wait(ctx.session.get({ sessionID: original.event.sessionID }), scope);
    const c = await wait(ctx.session.get({ sessionID: original.child }), scope);
    const p2 = await wait(ctx.session.get({ sessionID: original.event.sessionID }), scope);
    const c2 = await wait(ctx.session.get({ sessionID: original.child }), scope);
    if (
      disposed ||
      !same(p, p2) ||
      !same(c, c2) ||
      p.id !== original.event.sessionID ||
      p.parentID ||
      p.agent !== original.parentAgent ||
      p.location.directory !== original.cwd ||
      c.id !== original.child ||
      c.parentID !== p.id ||
      c.agent !== original.context.role ||
      c.location.directory !== original.cwd ||
      adapter.protocol.status(p.id, original.cwd).generation !== original.generation
    )
      throw Error("native identity/cwd/generation moved");
  }

  const proxy: GlobalNativeContext = {
    ...ctx,
    session: {
      ...ctx.session,
      get: (input) => trackNative(ctx.session.get(input)),
      hook: async (name, fn) => registration(await ctx.session.hook!(name, fn)),
    },
    command: { transform: async (fn) => registration(await ctx.command.transform(fn)) },
    tool: {
      list: ctx.tool.list.bind(ctx.tool),
      transform: async (fn) =>
        registration(
          await ctx.tool.transform((editor) =>
            fn({
              add(definition) {
                if (definition.name === "harness_orchestration") control = definition;
                editor.add(definition);
              },
            }),
          ),
        ),
      hook: async (name, callback) =>
        registration(
          await ctx.tool.hook(name, async (event) => {
            if (name === "execute.before") {
              const managedRoles = ["researcher", "planner", "implementer", "validator"];
              if (
                event.tool === "subagent" &&
                (managedRoles.includes(event.agent) ||
                  managedRoles.includes(String(object(event.input).agent))) &&
                (!attempt ||
                  (event.sessionID === attempt.original.event.sessionID &&
                    object(event.input).sessionID === attempt.original.child))
              )
                await authoritativeBefore(callback, event);
              else await callback(event);
              if (event.tool !== "subagent") return;
              const input = object(event.input);
              if (typeof input.prompt !== "string") return;
              if (Object.hasOwn(input, "sessionID")) {
                if (
                  !attempt ||
                  input.sessionID !== attempt.request.childSessionID ||
                  event.sessionID !== attempt.original.event.sessionID
                )
                  return;
                try {
                  if (
                    snapshot.diagnostic === "INCONCLUSIVE" ||
                    attempt.continuation ||
                    event.id === attempt.original.event.id ||
                    event.messageID === attempt.original.event.messageID ||
                    event.agent !== attempt.original.event.agent ||
                    input.prompt !== snapshot.continuationPrompt
                  )
                    throw Error("continuation identity mismatch or duplicate");
                  await identity(attempt.original);
                  attempt.continuation = structuredClone(event);
                  record("continuation-admitted", event);
                  snapshot.phase = "awaiting-progress";
                } catch (error) {
                  fail(String(error));
                  throw error;
                }
                return;
              }
              try {
                const decoded = decodeGlobalEnvelope(input.prompt);
                const context = {
                  orchestrationId: decoded.packet.orchestrationId,
                  delegationTaskId: decoded.packet.delegationTaskId,
                  scopeKey: decoded.packet.scopeKey,
                  role: decoded.role,
                  taskMode: decoded.packet.taskMode,
                } as TaskContext;
                const p = await wait(ctx.session.get({ sessionID: event.sessionID }));
                const diagnostics = adapter.protocol.diagnostics(
                  event.sessionID,
                  context.orchestrationId,
                );
                const task = diagnostics.attempts.find((a) => a.id === context.delegationTaskId);
                if (!task) throw Error("missing admitted task deadline");
                admitted.set(JSON.stringify([event.sessionID, event.id]), {
                  event: structuredClone(event),
                  context,
                  cwd: p.location.directory,
                  parentAgent: p.agent,
                  deadline: task.deadline,
                  generation: adapter.protocol.status(event.sessionID, p.location.directory)
                    .generation,
                });
              } catch {
                /* unmanaged native subagents stay ordinary */
              }
              return;
            }
            const selected = attempt?.continuation;
            const matches =
              selected &&
              event.tool === selected.tool &&
              event.sessionID === selected.sessionID &&
              event.id === selected.id;
            if (matches && attempt) {
              try {
                if (attempt.afterSeen) throw Error("duplicate completed callback");
                attempt.afterSeen = true;
                if (
                  event.messageID !== selected.messageID ||
                  event.agent !== selected.agent ||
                  !same(event.input, selected.input) ||
                  event.status !== "completed"
                )
                  throw Error("malformed selected native callback");
                const result = object(event.result),
                  output = object(result.output),
                  metadata = object(result.metadata);
                if (
                  output.sessionID !== attempt.original.child ||
                  metadata.sessionID !== attempt.original.child
                )
                  throw Error("callback child mismatch");
                bounded(event.result);
                snapshot.callbackBeforeHash = hash({ input: event.input, result: event.result });
                record("native-completed-held", {
                  callID: event.id,
                  hash: snapshot.callbackBeforeHash,
                });
                if (attempt.request.mode === "completed-after-hold") await cancel();
                else if (!attempt.cancelled) throw Error("native completion preceded cancellation");
                await identity(attempt.original);
                snapshot.callbackReleaseHash = hash({ input: event.input, result: event.result });
                if (snapshot.callbackBeforeHash !== snapshot.callbackReleaseHash)
                  throw Error("held callback payload changed");
              } catch (error) {
                fail(String(error));
              }
              // Always pass the same event to the real callback before disposal. Never replace native results here.
              await authoritativeAfter(callback, event);
              try {
                snapshot.result = bounded(event.result);
                record("adapter-after-returned", snapshot.result);
                if (
                  attempt.cancelled &&
                  snapshot.diagnostic !== "INCONCLUSIVE" &&
                  object(object(event.result).metadata).harness === "rejected"
                ) {
                  snapshot.diagnostic = "OBSERVED";
                  snapshot.phase = "rejection-observed";
                  clearTimeout(attempt.timer);
                }
              } catch (error) {
                fail(String(error));
              }
              return;
            }
            await callback(event);
            const original = admitted.get(JSON.stringify([event.sessionID, event.id]));
            if (!original || event.status !== "completed") return;
            try {
              const r = object(event.result);
              if (object(r.metadata).harness === "rejected") return;
              const output = object(r.output);
              const decoded = object(
                JSON.parse(String(output.output).replace(/^```json\n|\n```$/g, "")),
              );
              if (
                decoded.outcome !== "clarification" ||
                typeof decoded.requestNonce !== "string" ||
                typeof output.sessionID !== "string"
              )
                return;
              const verified = {
                ...original,
                child: output.sessionID,
                nonce: decoded.requestNonce,
              };
              await identity(verified);
              observed.set(
                JSON.stringify([event.sessionID, canonical(original.context)]),
                verified,
              );
            } catch {
              /* a rejected or unverifiable result is never an arm prerequisite */
            }
          }),
        ),
    },
  };
  const adapter = createGlobalNativeAdapter(proxy, { traceRoot: options.traceRoot, now });

  async function cancel() {
    if (!attempt || !control || attempt.cancelled || snapshot.diagnostic === "INCONCLUSIVE")
      throw Error("evaluation cancellation unavailable");
    await identity(attempt.original);
    const tools = await wait(ctx.tool.list());
    if (
      tools.filter((t) => t.id === "harness_orchestration").length !== 1 ||
      !tools.some((t) => t.id === "harness_eval_rendezvous")
    )
      throw Error("native registration ownership lost");
    await identity(attempt.original);
    record("cancel-invoked", {
      version: attempt.request.controlVersion,
      context: attempt.original.context,
    });
    const response = await wait(
      control.execute(
        {
          version: attempt.request.controlVersion,
          action: "task.cancel",
          context: attempt.original.context,
        },
        native(attempt.continuation ?? attempt.original.event),
      ),
    );
    snapshot.cancellation = bounded(response);
    if (
      !same(response.output, JSON.parse(response.content)) ||
      !same(response.output, { childID: attempt.original.child, termination: "unconfirmed" })
    )
      throw Error("cancellation raw/text/known-child mismatch");
    await identity(attempt.original);
    attempt.cancelled = true;
    record("cancel-returned", response);
    snapshot.phase = "awaiting-native-after";
  }

  let arming = false;

  async function arm(
    request: EvalArmRequest,
    parentSessionID: string,
    scope?: ObservationScope,
  ): Promise<EvalSnapshot> {
    if (arming) throw Error("active evaluation arm");
    arming = true;
    try {
      exact(object(request), [
        "mode",
        "controlVersion",
        "context",
        "childSessionID",
        "requestNonce",
      ]);
      if (disposed || streamClosed || attempt)
        throw Error("active or unavailable evaluation attempt");
      if (
        !["continuation-rendezvous", "completed-after-hold"].includes(request.mode) ||
        ![1, 2].includes(request.controlVersion)
      )
        throw Error("invalid evaluation mode/version");
      const original = observed.get(JSON.stringify([parentSessionID, canonical(request.context)]));
      if (
        !original ||
        original.child !== request.childSessionID ||
        original.nonce !== request.requestNonce
      )
        throw Error("verified unresolved clarification prerequisite missing");
      const observationScope = scope ?? { deadline: now() + timeoutMs };
      observationScope.deadline = Math.min(observationScope.deadline, original.deadline);
      checkScope(observationScope);
      await identity(original, observationScope);
      checkScope(observationScope);
      const task = adapter.protocol
        .diagnostics(parentSessionID, original.context.orchestrationId)
        .attempts.find((a) => a.id === original.context.delegationTaskId);
      if (!task || task.state !== "awaiting-guidance")
        throw Error("task is terminal or clarification unavailable");
      const deadline = observationScope.deadline;
      if (deadline <= now()) throw Error("original task deadline expired");
      const token = randomBytes(32).toString("hex"),
        attemptID = randomUUID();
      let stopReject!: (error: Error) => void;
      const stop = new Promise<never>((_, reject) => {
        stopReject = reject;
      });
      void stop.catch(() => {});
      attempt = {
        request: structuredClone(request),
        original,
        deadline,
        continuation: null,
        progress: false,
        used: false,
        afterSeen: false,
        cancelled: false,
        stop,
        stopReject,
        timer: setTimeout(
          () => fail("evaluation deadline expired; native operations unresolved"),
          deadline - now(),
        ),
      };
      snapshot = {
        ...snapshot,
        attemptID,
        mode: request.mode,
        phase: "armed",
        token,
        identities: {
          parentSessionID,
          cwd: original.cwd,
          parentAgent: original.parentAgent ?? null,
          agent: original.event.agent,
          context: original.context,
          childSessionID: original.child,
          requestNonce: original.nonce,
          generation: original.generation,
          originalDeadline: original.deadline,
          deadline,
          clarificationCallID: original.event.id,
          clarificationMessageID: original.event.messageID,
        },
        continuationPrompt:
          PREFIX +
          JSON.stringify({
            version: 1,
            kind: "clarification-response",
            delegationTaskId: original.context.delegationTaskId,
            requestNonce: original.nonce,
            answer:
              request.mode === "continuation-rendezvous"
                ? `Invoke harness_eval_rendezvous exactly once with ${JSON.stringify({ attemptID, token })}, then finish the original finite read-only task.`
                : "Finish the original finite read-only task and return its required structured result.",
          }) +
          SUFFIX,
      };
      record("armed", snapshot.identities);
      return structuredClone(snapshot);
    } finally {
      arming = false;
    }
  }

  const output = (value: unknown) => ({
    output: JSON.parse(canonical(value)),
    content: JSON.stringify(value),
  });
  const tool = (
    name: string,
    input: Record<string, unknown>,
    execute: EvalTool["execute"],
  ): EvalTool => ({
    name,
    description: "Source-only isolated evaluation observation; no acceptance authority",
    options: { codemode: false },
    input,
    output: { type: "object", additionalProperties: true },
    execute,
  });
  const contextSchema = {
    type: "object",
    properties: Object.fromEntries(
      ["orchestrationId", "delegationTaskId", "scopeKey", "role", "taskMode"].map((k) => [
        k,
        { type: "string" },
      ]),
    ),
    required: ["orchestrationId", "delegationTaskId", "scopeKey", "role", "taskMode"],
    additionalProperties: false,
  };
  const controlDefinition = tool(
    "harness_eval_control",
    {
      type: "object",
      oneOf: [
        {
          properties: { action: { const: "status" } },
          required: ["action"],
          additionalProperties: false,
        },
        {
          properties: {
            action: { const: "arm" },
            mode: { enum: ["continuation-rendezvous", "completed-after-hold"] },
            controlVersion: { enum: [1, 2] },
            context: contextSchema,
            childSessionID: { type: "string" },
            requestNonce: { type: "string" },
          },
          required: [
            "action",
            "mode",
            "controlVersion",
            "context",
            "childSessionID",
            "requestNonce",
          ],
          additionalProperties: false,
        },
      ],
    },
    async (input, context) => {
      const r = object(input);
      const original =
        r.action === "arm"
          ? observed.get(JSON.stringify([context.sessionID, canonical(r.context)]))
          : undefined;
      const scope = {
        deadline: Math.min(
          now() + timeoutMs,
          attempt?.deadline ?? Infinity,
          original?.deadline ?? Infinity,
        ),
        signal: context.signal,
      };
      checkScope(scope);
      const p = await wait(ctx.session.get({ sessionID: context.sessionID }), scope);
      if (
        disposed ||
        context.signal.aborted ||
        p.id !== context.sessionID ||
        p.parentID ||
        (p.agent !== undefined && p.agent !== context.agent)
      )
        throw Error("evaluation control requires native primary identity");
      if (r.action === "status") {
        exact(r, ["action"]);
        if (attempt && context.sessionID !== attempt.original.event.sessionID)
          throw Error("wrong evaluation parent");
        return output(snapshot);
      }
      exact(r, ["action", "mode", "controlVersion", "context", "childSessionID", "requestNonce"]);
      const { action, ...request } = r;
      if (action !== "arm") throw Error("unsupported evaluation action");
      return output(await arm(request as unknown as EvalArmRequest, context.sessionID, scope));
    },
  );
  const rendezvous = tool(
    "harness_eval_rendezvous",
    {
      type: "object",
      properties: { attemptID: { type: "string" }, token: { type: "string" } },
      required: ["attemptID", "token"],
      additionalProperties: false,
    },
    async (input, context) => {
      const r = object(input);
      exact(r, ["attemptID", "token"]);
      if (
        !attempt ||
        disposed ||
        snapshot.diagnostic === "INCONCLUSIVE" ||
        attempt.request.mode !== "continuation-rendezvous" ||
        !attempt.continuation ||
        !attempt.progress ||
        attempt.used ||
        r.attemptID !== snapshot.attemptID ||
        r.token !== snapshot.token ||
        context.sessionID !== attempt.original.child ||
        context.agent !== attempt.original.context.role ||
        !context.id ||
        !context.messageID ||
        context.signal.aborted
      )
        throw Error("wrong, stale, duplicate or missing progress/boundary rendezvous");
      attempt.used = true;
      const onAbort = () => fail("native rendezvous aborted");
      context.signal.addEventListener("abort", onAbort, { once: true });
      try {
        await identity(attempt.original);
        record("rendezvous-pending", {
          sessionID: context.sessionID,
          agent: context.agent,
          messageID: context.messageID,
          id: context.id,
        });
        await cancel();
        if (context.signal.aborted || disposed)
          throw Error("rendezvous aborted/disposed before release");
        record("rendezvous-released", { id: context.id });
        return output({ released: true, attemptID: snapshot.attemptID });
      } catch (error) {
        fail(String(error));
        throw error;
      } finally {
        context.signal.removeEventListener("abort", onAbort);
      }
    },
  );
  const stream = ctx.event.subscribe({ signal: abort.signal });
  void (async () => {
    try {
      for await (const event of stream) {
        if (disposed) break;
        if (!attempt) continue;
        record(event.type, event.data);
        if (event.type !== "session.tool.progress" || !attempt.continuation) continue;
        const d = object(event.data),
          e = attempt.continuation;
        if (d.sessionID !== e.sessionID || d.assistantMessageID !== e.messageID || d.id !== e.id)
          continue;
        const metadata = object(d.metadata);
        if (
          metadata.sessionID !== attempt.original.child ||
          metadata.status !== "running" ||
          attempt.progress
        ) {
          fail("conflicting or duplicate exact progress");
          continue;
        }
        attempt.progress = true;
        snapshot.phase = "awaiting-rendezvous";
      }
    } catch (error) {
      if (!disposed) fail("subscription failed: " + String(error));
    } finally {
      streamClosed = true;
      if (!disposed && attempt) fail("native subscription lost");
    }
  })();

  async function dispose(): Promise<void> {
    if (disposePromise) return disposePromise;
    disposePromise = (async () => {
      if (attempt && snapshot.diagnostic !== "OBSERVED")
        fail("driver disposed; native callback evidence incomplete");
      disposed = true;
      if (attempt) clearTimeout(attempt.timer);
      abort.abort();
      const cleanup = async () => {
        adapter.dispose();
        for (const r of registrations.splice(0).reverse()) {
          try {
            await finite(r.dispose(), timeoutMs, "registration disposal timeout");
          } catch {
            snapshot.diagnostic = "INCONCLUSIVE";
            snapshot.phase = "registration disposal failed";
          }
        }
      };
      if (pendingCallbacks.size || pendingNative.size) {
        const settled = Promise.allSettled([...pendingCallbacks, ...pendingNative]);
        try {
          await finite(settled, Math.min(timeoutMs, 100), "native callbacks remain unresolved");
        } catch {
          snapshot.diagnostic = "INCONCLUSIVE";
          snapshot.phase = "native operations unresolved; registration ownership retained";
          void settled.then(cleanup).catch(() => {
            snapshot.diagnostic = "INCONCLUSIVE";
          });
          return;
        }
      }
      await cleanup();
    })();
    return disposePromise;
  }

  try {
    await adapter.register();
    if (!control) throw Error("actual registered harness control missing");
    await registration(
      await ctx.tool.transform((editor) => {
        editor.add(controlDefinition as GlobalControlTool);
        editor.add(rendezvous as GlobalControlTool);
      }),
    );
  } catch (error) {
    await dispose();
    throw error;
  }
  return {
    arm: (request: EvalArmRequest, parentSessionID: string) => arm(request, parentSessionID),
    snapshot: () => structuredClone(snapshot),
    dispose,
  };
}

export default {
  id: "opencode-harness.source-global-live-eval.v1",
  async setup(ctx: EvalNativeContext) {
    const root = ctx.options?.evaluationRoot,
      traceRoot = ctx.options?.traceRoot;
    if (
      typeof root !== "string" ||
      typeof traceRoot !== "string" ||
      !path.isAbsolute(root) ||
      path.resolve(root) !== root ||
      !traceRoot.startsWith(root + path.sep) ||
      (!ctx.location.directory.startsWith(root + path.sep) && ctx.location.directory !== root)
    )
      throw Error("explicit isolated evaluation/trace roots required");
    const info = await lstat(root);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      info.uid !== process.getuid?.() ||
      info.mode & 0o077 ||
      (await realpath(root)) !== root
    )
      throw Error("evaluation root must be canonical private and owned");
    const driver = await createGlobalNativeLiveEval(ctx, { traceRoot });
    return () => driver.dispose();
  },
};

/** Exact pinned source compatibility audit. This is never evidence of host delivery. */
export function auditGlobalLiveEvalNativeContract(source: Record<string, string>): void {
  const require = (file: string, pattern: RegExp) => {
    if (!pattern.test(source[file] ?? ""))
      throw Error("incompatible pinned native contract: " + file + " " + pattern);
  };
  require("packages/plugin/src/promise/plugin.ts", /readonly options: PluginOptions/);
  require("packages/plugin/src/promise/plugin.ts", /readonly plugin: Pick<PluginApi, "list">/);
  require("packages/plugin/src/promise/plugin.ts", /Promise<Cleanup \| void>/);
  require("packages/plugin/src/promise/tool.ts", /readonly signal: AbortSignal/);
  require("packages/plugin/src/promise/tool.ts", /readonly progress: \(update: Tool.Metadata\) => Promise<void>/);
  require("packages/plugin/src/promise/tool.ts", /readonly transform: Transform<ToolEditor>/);
  require("packages/plugin/src/promise/tool.ts", /"execute.after"[\s\S]*readonly status: "completed"[\s\S]*result: Tool.Result/);
  for (const field of ["sessionID", "agent", "messageID", "id"])
    require("packages/schema/src/tool.ts", new RegExp("readonly " + field + ": "));
  require("packages/plugin/src/promise/registration.ts", /readonly dispose: \(\) => Promise<void>/);
  require("packages/plugin/src/promise/event.ts", /Pick<EventApi, "subscribe">/);
  require("packages/plugin/src/promise/adapter.ts", /options: host.options/);
  require("packages/plugin/src/promise/adapter.ts", /subscribe: \(options\) =>[\s\S]*host.event.subscribe\(\)/);
  require("packages/schema/src/event.ts", /data:/);
  require("packages/schema/src/session-event.ts", /assistantMessageID:/);
  require("packages/schema/src/session-event.ts", /type: "session.tool.progress",[\s\S]*\.\.\.ToolBase,[\s\S]*metadata: Schema.Record\(Schema.String, Schema.Json\)/);
  require("packages/core/src/tool/plugin/subagent.ts", /yield\* context.progress\(\{ sessionID: child.id, status: "running" \}\)[\s\S]*\.prompt\(/);
  require("packages/core/src/tool/plugin/subagent.ts", /existing === undefined\s*\? \["You are a subagent spawned by another session\.", input.prompt\]\.join\("\\n"\)\s*: input.prompt/);
  require("packages/core/src/tool.ts", /const execution = yield\* execute\(tool, input, context\)[\s\S]*status: "completed",[\s\S]*yield\* hooks.trigger\("tool", "execute.after", afterEvent\)[\s\S]*afterEvent.result.content/);
  require("packages/core/src/plugin/module.ts", /Host.resolve\(installed \?\? \{ directory: operation.target \}\)/);
  require("packages/plugin/src/host.ts", /server: entry\(\["server", ""\]\)/);
  require("packages/plugin/src/source.ts", /const loaded = prepared.load\(\)/);
  require("packages/core/src/session/runner/publish-llm-event.ts", /bus.publish\(SessionEvent.Tool.Progress, \{\s*sessionID: input.sessionID,\s*assistantMessageID,\s*id,\s*metadata: update,/);
}
