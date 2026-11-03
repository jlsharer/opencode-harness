/** Source-only feasibility spike. No registration, transport, persistence or managed-guard authority.
 * Native context is an unbounded read: these limits apply only AFTER the host allocates its result.
 * Observed extra prompts are denied; the public API supplies no exclusive child lock against UI/plugins.
 */
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
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
  type: string;
  text?: string;
  agent?: string;
  content?: { type: string; text?: string }[];
  finish?: string;
  error?: unknown;
  time?: { created?: unknown; completed?: unknown };
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
          // Context provenance is the checked child and this exact request; native messages have no sessionID.
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
            if (!message.id || ids.has(message.id)) throw new Error("message identity");
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

const definedType = (type: ts.TypeNode): ts.TypeNode => {
  if (!ts.isUnionTypeNode(type)) return type;
  const defined = type.types.filter((part) => part.kind !== ts.SyntaxKind.UndefinedKeyword);
  return defined.length === 1 ? defined[0]! : ts.factory.createUnionTypeNode(defined);
};

function projectedLiterals(type: ts.TypeNode): string[] | undefined {
  const parts = ts.isUnionTypeNode(type) ? type.types : [type];
  if (!parts.every((part) => ts.isLiteralTypeNode(part) && ts.isStringLiteral(part.literal)))
    return undefined;
  return parts
    .map((part) => (part as ts.LiteralTypeNode).literal as ts.StringLiteral)
    .map((literal) => literal.text)
    .sort();
}

/** Bounded Struct/Base/fields resolver shared by message and production projection checks. */
function nativeSchema(
  source: string,
  label: string,
  importedFields: Record<string, Map<string, ts.Expression>> = {},
) {
  const ast = ts.createSourceFile("native.ts", source, ts.ScriptTarget.Latest, true);
  const declarations = new Map<string, ts.Expression>();
  for (const statement of ast.statements)
    if (ts.isVariableStatement(statement))
      for (const declaration of statement.declarationList.declarations)
        if (ts.isIdentifier(declaration.name) && declaration.initializer)
          declarations.set(declaration.name.text, declaration.initializer);
  const mismatch = () => new Error(label + " field mismatch");
  const unwrap = (input: string | ts.Expression, seen = new Set<string>()): ts.Expression => {
    const expression = typeof input === "string" ? declarations.get(input) : input;
    if (!expression) throw mismatch();
    if (typeof input === "string") {
      if (seen.has(input)) throw mismatch();
      seen.add(input);
    }
    if (ts.isIdentifier(expression)) return unwrap(expression.text, seen);
    if (
      ts.isCallExpression(expression) &&
      ts.isPropertyAccessExpression(expression.expression) &&
      ["annotate", "pipe"].includes(expression.expression.name.text)
    )
      return unwrap(expression.expression.expression, seen);
    return expression;
  };
  const fields = (
    input: string | ts.Expression,
    seen = new Set<ts.Expression>(),
  ): Map<string, ts.Expression> => {
    let expression = unwrap(input);
    if (ts.isPropertyAccessExpression(expression) && expression.name.text === "fields") {
      const target = expression.expression;
      if (ts.isIdentifier(target) && importedFields[target.text])
        return importedFields[target.text]!;
      expression = unwrap(target);
    }
    if (seen.has(expression)) throw mismatch();
    seen.add(expression);
    if (
      ts.isCallExpression(expression) &&
      ts.isPropertyAccessExpression(expression.expression) &&
      expression.expression.expression.getText(ast) === "Schema" &&
      expression.expression.name.text === "Struct" &&
      expression.arguments.length === 1
    )
      expression = expression.arguments[0]!;
    if (!ts.isObjectLiteralExpression(expression)) throw mismatch();
    const result = new Map<string, ts.Expression>();
    for (const property of expression.properties) {
      if (ts.isSpreadAssignment(property)) {
        for (const [key, value] of fields(property.expression, new Set(seen)))
          result.set(key, value);
      } else if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
        result.set(property.name.text, property.initializer);
      } else throw mismatch();
    }
    return result;
  };
  const optional = (expression: ts.Expression): boolean => {
    if (!ts.isCallExpression(expression) || !ts.isPropertyAccessExpression(expression.expression))
      return false;
    const method = expression.expression;
    return (
      (method.name.text === "pipe" &&
        expression.arguments.some((arg) => ts.isIdentifier(arg) && arg.text === "optional")) ||
      (["pipe", "annotate"].includes(method.name.text) && optional(method.expression))
    );
  };
  const literals = (input: string | ts.Expression): string[] => {
    const expression = unwrap(input);
    if (!ts.isCallExpression(expression) || !ts.isPropertyAccessExpression(expression.expression))
      throw mismatch();
    const method = expression.expression;
    if (method.expression.getText(ast) !== "Schema") throw mismatch();
    const first = expression.arguments[0];
    const values =
      method.name.text === "Literals" && first && ts.isArrayLiteralExpression(first)
        ? first.elements
        : ["tag", "Literal"].includes(method.name.text) && first
          ? [first]
          : [];
    if (!values.length || !values.every(ts.isStringLiteral)) throw mismatch();
    return values.map((value) => (value as ts.StringLiteral).text).sort();
  };
  return { fields, optional, literals };
}

/** Optional read-only source check: source evidence, never live execution/provider evidence. */
export function auditNativeSource(
  root: string,
  projectionSource = readFileSync(new URL(import.meta.url), "utf8"),
) {
  let commit: string;
  try {
    commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 4 * 1024 * 1024,
    }).trim();
  } catch {
    throw new Error("native source audit unavailable");
  }
  if (commit !== "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824")
    throw new Error("native source pin mismatch");
  // Metadata is bounded too. Never read potentially unbounded dirty working-tree content.
  const auditedPaths = [
    "packages/client/src/effect/api/api.ts",
    "packages/schema/src/tool.ts",
    "packages/schema/src/session-message.ts",
    "packages/schema/src/prompt.ts",
    "packages/schema/src/session-inbox.ts",
    "packages/schema/src/session.ts",
    "packages/schema/src/model.ts",
    "packages/schema/src/session-id.ts",
    ...Object.values(nativeRecoveryPaths),
  ];
  let workingTreeDifferences: string[];
  try {
    workingTreeDifferences = execFileSync(
      "git",
      ["-C", root, "diff", "--name-only", commit, "--", ...auditedPaths],
      {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      },
    )
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    throw new Error("native source bounded metadata unavailable");
  }
  const read = (file: string) => {
    if (!auditedPaths.includes(file)) throw new Error("native source path not allowlisted");
    try {
      return execFileSync("git", ["-C", root, "show", `${commit}:${file}`], {
        encoding: "utf8",
        maxBuffer: 4 * 1024 * 1024,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch {
      throw new Error("native source bounded committed blob unavailable: " + file);
    }
  };
  auditNativeRecoveryContract(
    Object.fromEntries(
      Object.entries(nativeRecoveryPaths).map(([key, file]) => [key, read(file)]),
    ) as unknown as NativeRecoverySource,
  );
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
  // Parse declarations and Schema.Struct fields, including Base spreads. Whole-file tokens
  // cannot prove that a projected property exists on the context variants that we accept.
  const messageSchema = nativeSchema(message, "native message projection");
  const projectionAst = ts.createSourceFile(
    "prototype.mts",
    projectionSource,
    ts.ScriptTarget.Latest,
    true,
  );
  // Production is audited as authored, including optionality of the public input projection.
  const directApi = projectionAst.statements.find(
    (s): s is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(s) && s.name.text === "DirectSessionApi",
  );
  const production = projectionAst.statements.some(
    (s) => ts.isInterfaceDeclaration(s) && s.name.text === "DirectAdmission",
  );
  if (production) {
    const promptSchema = nativeSchema(read("packages/schema/src/prompt.ts"), "prompt projection");
    const inboxSchema = nativeSchema(
      read("packages/schema/src/session-inbox.ts"),
      "prompt result projection",
      { Prompt: promptSchema.fields("Prompt") },
    );
    const sessionSchema = nativeSchema(
      read("packages/schema/src/session.ts"),
      "session projection",
    );
    const modelSchema = nativeSchema(read("packages/schema/src/model.ts"), "model projection");
    const interfaceFields = (name: string) => {
      const node = projectionAst.statements.find(
        (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === name,
      );
      if (!node || node.heritageClauses?.length) throw new Error(name + " projection missing");
      return node.members;
    };
    // This checks the consumed structural subset, not arbitrary TypeScript/native codec equivalence.
    const members = (
      projected: ts.NodeArray<ts.TypeElement>,
      native: Map<string, ts.Expression>,
      schema: ReturnType<typeof nativeSchema>,
      literalFields: readonly string[] = [],
    ) => {
      const seen = new Set<string>();
      for (const member of projected) {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name) || !member.type)
          throw new Error("native projection member mismatch");
        const key = member.name.text;
        const expression = native.get(key);
        if (
          seen.has(key) ||
          !expression ||
          Boolean(member.questionToken) !== schema.optional(expression)
        )
          throw new Error("native projection field/optionality mismatch: " + key);
        seen.add(key);
        const type = definedType(member.type);
        if (ts.isTypeLiteralNode(type)) members(type.members, schema.fields(expression), schema);
        else {
          const literals = projectedLiterals(type);
          if (literals || literalFields.includes(key)) {
            const expected = schema.literals(expression);
            if (literals?.join() !== expected.join())
              throw new Error("native projection literal variants mismatch: " + key);
          }
        }
      }
    };
    members(interfaceFields("SessionInfo"), sessionSchema.fields("Info"), sessionSchema);
    members(interfaceFields("DirectModelRef"), modelSchema.fields("Ref"), modelSchema);
    const apiAst = ts.createSourceFile("api.ts", api, ts.ScriptTarget.Latest, true);
    const names = {
      create: "SessionCreateInput",
      prompt: "SessionPromptInput",
      wait: "SessionWaitInput",
      get: "SessionGetInput",
      context: "SessionContextInput",
      interrupt: "SessionInterruptInput",
    };
    if (!directApi) throw new Error("public API projection missing");
    for (const method of directApi.members) {
      if (
        !ts.isMethodSignature(method) ||
        !ts.isIdentifier(method.name) ||
        !(method.name.text in names)
      )
        throw new Error("public API projection method");
      const key = method.name.text as keyof typeof names;
      const native = apiAst.statements.find(
        (s): s is ts.TypeAliasDeclaration =>
          ts.isTypeAliasDeclaration(s) && s.name.text === names[key],
      );
      const input = method.parameters[0]?.type;
      if (!native || !ts.isTypeLiteralNode(native.type) || !input || !ts.isTypeLiteralNode(input))
        throw new Error("public API projection input");
      for (const member of input.members) {
        if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name))
          throw new Error("public API projection field");
        const sourceField = native.type.members.find(
          (m): m is ts.PropertySignature =>
            ts.isPropertySignature(m) &&
            m.name.getText(apiAst) === member.name.getText(projectionAst),
        );
        if (!sourceField || Boolean(sourceField.questionToken) !== Boolean(member.questionToken))
          throw new Error("public API projection optionality");
        if (!member.type || !sourceField.type) throw new Error("public API projection field type");
        const projected = definedType(member.type);
        const declared = definedType(sourceField.type);
        if (ts.isTypeReferenceNode(declared) && declared.typeName.getText(apiAst) === "Model.Ref") {
          if (
            !ts.isTypeReferenceNode(projected) ||
            projected.typeName.getText(projectionAst) !== "DirectModelRef"
          )
            throw new Error("public API model projection reference");
        } else if (
          ts.isTypeReferenceNode(declared) &&
          declared.typeName.getText(apiAst) === "SessionInbox.Delivery"
        ) {
          if (projectedLiterals(projected)?.join() !== inboxSchema.literals("Delivery").join())
            throw new Error("public API projection delivery variants");
        }
      }
      if (key === "create" || key === "get") {
        if (method.type?.getText(projectionAst).replace(/\s/g, "") !== "Promise<SessionInfo>")
          throw new Error("public API projection session return");
      }
      if (key === "prompt") {
        const result = method.type;
        const value =
          result &&
          ts.isTypeReferenceNode(result) &&
          result.typeName.getText(projectionAst) === "Promise" &&
          result.typeArguments?.[0];
        if (!value || !ts.isTypeLiteralNode(value)) throw new Error("prompt result projection");
        members(value.members, inboxSchema.fields("User"), inboxSchema, ["type", "delivery"]);
      }
      if (
        key === "wait" &&
        method.type?.getText(projectionAst).replace(/\s/g, "") !== "Promise<void>"
      )
        throw new Error("public API projection wait return");
    }
    const identity = projectionAst.statements.find(
      (s): s is ts.InterfaceDeclaration =>
        ts.isInterfaceDeclaration(s) && s.name.text === "DirectCallIdentity",
    );
    const caller = projectionAst.statements.find(
      (s): s is ts.InterfaceDeclaration =>
        ts.isInterfaceDeclaration(s) && s.name.text === "DirectToolCaller",
    );
    if (
      !identity ||
      !caller ||
      identity.members.length !== 4 ||
      caller.members.length !== 1 ||
      caller.heritageClauses?.[0]?.types[0]?.expression.getText(projectionAst) !==
        "DirectCallIdentity"
    )
      throw new Error("caller projection shape");
    for (const [node, expected] of [
      [identity, ["sessionID", "agent", "messageID", "id"]],
      [caller, ["signal"]],
    ] as const) {
      if (
        node.members.some(
          (m) =>
            !ts.isPropertySignature(m) ||
            !ts.isIdentifier(m.name) ||
            !expected.includes(m.name.text as never) ||
            Boolean(m.questionToken),
        )
      )
        throw new Error("caller projection fields");
    }
    auditNativeToolContract({
      tool: read("packages/plugin/src/promise/tool.ts"),
      adapter,
      core: read("packages/core/src/tool.ts"),
      sessionID: read("packages/schema/src/session-id.ts"),
      message,
    });
  }
  const mismatch = () => new Error("native message projection field mismatch");
  const variants = [
    "AgentSelected",
    "ModelSelected",
    "LocationSwitched",
    "User",
    "Assistant",
    "Idle",
  ].map((name) => messageSchema.fields(name));
  const projection = projectionAst.statements.find(
    (statement): statement is ts.InterfaceDeclaration =>
      ts.isInterfaceDeclaration(statement) && statement.name.text === "NativeMessage",
  );
  if (!projection || projection.heritageClauses?.length) throw mismatch();
  const projectedFields = new Set<string>();
  for (const member of projection.members) {
    if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) throw mismatch();
    const key = member.name.text;
    if (projectedFields.has(key) || !variants.some((variant) => variant.has(key))) throw mismatch();
    projectedFields.add(key);
    if (
      !member.questionToken &&
      variants.some((variant) => !variant.has(key) || messageSchema.optional(variant.get(key)!))
    )
      throw mismatch();
  }
  if (!["id", "type"].every((key) => projectedFields.has(key))) throw mismatch();
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
    messageProjectionFields: [...projectedFields].sort(),
    evidence:
      "public shapes, consumed model/session/prompt/context projection fields, requiredness and literal variants, " +
      "promise forwarding, exact executor Error retention/typed after branch, interruption exclusion, " +
      "coordinator finalizers/successors, prompt admission/wake and restart claim retention; exact recovery source AST attestation",
    limits:
      "bounded static projection audit, not full codec/type equivalence; no live activation or exclusive session lock",
  };
}

/** Pure source-only check also permits structural negative mutations in tests. */
export function auditNativeToolContract(source: {
  tool: string;
  adapter: string;
  core: string;
  sessionID: string;
  message: string;
}) {
  const compact = (text: string) => text.replace(/\s+/g, " ");
  const tool = compact(source.tool);
  const adapter = compact(source.adapter);
  if (
    !tool.includes("get(id: string): (Info & { readonly id: string }) | undefined") ||
    !tool.includes("update(id: string, update: (tool: Types.Mutable<Info>) => void): void") ||
    !tool.includes("readonly execute:")
  )
    throw new Error("ToolEditor replacement contract mismatch");
  if (
    !adapter.includes("const tool = editor.get(id)") ||
    !adapter.includes("update(value) Object.assign(tool, value,") ||
    !adapter.includes("executePromiseTool(value, input, context)") ||
    !adapter.includes("try: (signal) => tool.execute(input, { ...context, signal,")
  )
    throw new Error("ToolEditor promise signal forwarding mismatch");
  const core = compact(source.core);
  const start = core.indexOf('status: "completed", result:');
  const hook = core.indexOf('yield* hooks.trigger("tool", "execute.after", afterEvent)', start);
  const content = core.indexOf(
    "normalizeContent(afterEvent.result.content, afterEvent.result.output)",
    hook,
  );
  const output = core.indexOf("{ output: afterEvent.result.output }", content);
  const metadata = core.indexOf("{ metadata: afterEvent.result.metadata }", content);
  if (start < 0 || hook < start || content < hook || output < content || metadata < content)
    throw new Error("after-hook return-copy ordering mismatch");
  if (
    !source.sessionID.includes('Schema.String.check(Schema.isStartingWith("ses"))') ||
    !source.sessionID.includes('schema.make("ses_" + descending())') ||
    !source.message.includes('Schema.String.check(Schema.isStartingWith("msg_"))')
  )
    throw new Error("public prefix codec mismatch");
}

export interface NativeRecoverySource {
  adapter: string;
  tool: string;
  coreTool: string;
  sessionDomain: string;
  pluginContext: string;
  session: string;
  execution: string;
  coordinator: string;
  restart: string;
}

const nativeRecoveryPaths: Record<keyof NativeRecoverySource, string> = {
  adapter: "packages/plugin/src/promise/adapter.ts",
  tool: "packages/plugin/src/promise/tool.ts",
  coreTool: "packages/core/src/tool.ts",
  sessionDomain: "packages/plugin/src/promise/session.ts",
  pluginContext: "packages/plugin/src/promise/plugin.ts",
  session: "packages/core/src/session/session.ts",
  execution: "packages/core/src/session/execution.ts",
  coordinator: "packages/core/src/session/run-coordinator.ts",
  restart: "packages/core/src/session/execution/restart.ts",
};

/** Source attestation is deliberately stricter than semantic equivalence. The named-node
 * assertions identify the assumptions, while the full comment-free AST pins their surrounding
 * control flow (including interruption, conditional wake, finalizer and successor ordering).
 * Neither establishes a live-host callback fence or guarantees after on native interruption.
 */
export function auditNativeRecoveryContract(source: NativeRecoverySource): void {
  const expected: Record<keyof NativeRecoverySource, string> = {
    adapter: "986365eff0fad41853ac22ff27c0aa9dbcf41d9647a34c9e02759b0731c48165",
    tool: "f6a0142d2d53927c2cb720c2841ef924484322021701eebe035557d130b23002",
    coreTool: "8e2b4a926e335e7b2226f2bb74c2273b9aa56ace03a2d44391c7e4bc53a65215",
    sessionDomain: "eed7d27982225e86592939858c495e95082380237e1d1772a6f0ac47b713afc2",
    pluginContext: "bc8789e77fc6f2293a1f554f4a41058d9006afaecaae362f035bc8a6a74c5c96",
    session: "98d51cbce9cc32696fd74a23aba24afc0ab41bd906f3f9e282943391f94c90e4",
    execution: "2374646e5f4885af8291c41bd1eb2a2b714eade4103e347a054cf53e12d434a7",
    coordinator: "afdd13037bdb58c1d488e8e3b2575c55d43b4bcdf95eea5d6f0104371df54bd4",
    restart: "5d687db45b2ce2387b8dbe64fe6a367d11d8704255042c03e397fb358282f85f",
  };
  // Check every field's type/byte bound before allocating any parser tree.
  for (const key of Object.keys(expected) as (keyof NativeRecoverySource)[]) {
    if (
      !source ||
      typeof source[key] !== "string" ||
      Buffer.byteLength(source[key]) > 4 * 1024 * 1024
    )
      throw new Error("native recovery source missing or exceeds bounded input: " + key);
  }
  const printer = ts.createPrinter({ removeComments: true });
  const trees = {} as Record<keyof NativeRecoverySource, ts.SourceFile>;
  for (const key of Object.keys(expected) as (keyof NativeRecoverySource)[]) {
    const ast = ts.createSourceFile("native.ts", source[key], ts.ScriptTarget.Latest, true);
    trees[key] = ast;
    const canonical = printer.printFile(ast);
    if (createHash("sha256").update(canonical).digest("hex") !== expected[key])
      throw new Error("native recovery source structural attestation mismatch: " + key);
  }
  const node = (key: keyof NativeRecoverySource, name: string) => {
    const found: ts.Node[] = [];
    const visit = (value: ts.Node) => {
      if (
        (ts.isVariableDeclaration(value) ||
          ts.isInterfaceDeclaration(value) ||
          ts.isTypeAliasDeclaration(value)) &&
        ts.isIdentifier(value.name) &&
        value.name.text === name
      )
        found.push(value);
      ts.forEachChild(value, visit);
    };
    visit(trees[key]);
    const selected =
      found.length > 1
        ? found.filter(
            (value) =>
              ts.isVariableDeclaration(value) &&
              value.initializer?.getText(trees[key]).startsWith(`Effect.fn("Session.${name}")`),
          )
        : found;
    if (selected.length !== 1)
      throw new Error("native recovery source named node mismatch: " + name);
    return printer
      .printNode(ts.EmitHint.Unspecified, selected[0]!, trees[key])
      .replace(/\s+/g, " ");
  };
  const requireParts = (text: string, parts: string[]) => {
    let position = -1;
    for (const part of parts) {
      const next = text.indexOf(part, position + 1);
      if (next < 0) throw new Error("native recovery source contract ordering mismatch");
      position = next;
    }
  };
  // Exact original object reaches Tool.Error.error; the executor's failure channel uses it.
  requireParts(node("adapter", "toolError"), [
    "error instanceof Tool.Error ? error : new Tool.Error",
    "String(error), error }",
  ]);
  requireParts(node("adapter", "executePromiseTool"), [
    "Effect.tryPromise",
    "tool.execute(input,",
    "...context,",
    "signal,",
    "catch: toolError",
  ]);
  // Only the typed failure channel enters error-after. An interrupted Effect is outside catchTag.
  requireParts(node("coreTool", "executeTool"), [
    'Effect.catchTag("Tool.Error",',
    'if ("failure" in execution)',
    'status: "error"',
    "error: execution.failure",
    'yield* hooks.trigger("tool", "execute.after", afterEvent)',
    "return yield* afterEvent.error",
  ]);
  requireParts(node("session", "wait"), [
    'Effect.fn("Session.wait")',
    "yield* execution.awaitIdle(sessionID)",
  ]);
  requireParts(node("coordinator", "awaitIdle"), [
    "Deferred.await(execution.done)",
    "Effect.andThen(awaitIdle(key))",
  ]);
  requireParts(node("coordinator", "start"), [
    "options.settled?.(key, exit, execution.interruptionReason)",
    "Effect.sync(() => settle(key, execution, exit))",
  ]);
  requireParts(node("coordinator", "settle"), [
    "if (execution.pendingWake)",
    "start(key, false, execution.pendingWake)",
    "Deferred.doneUnsafe(execution.done, exit)",
  ]);
  requireParts(node("session", "prompt"), [
    "const admitted =",
    "yield* execution.wake(sessionID)",
    "return admitted",
  ]);
  requireParts(node("execution", "layer"), [
    'outcome.reason === "shutdown" ? undefined : releaseOnCommit(sessionID)',
    "awaitIdle: coordinator.awaitIdle",
  ]);
  requireParts(node("restart", "layer"), ["store.listSuspended()", ".resume(sessionID)"]);
  // The exact Context/SessionDomain AST attestation above also excludes any client/inbox/epoch
  // capability. A public session interrupt/wait pair is not an all-operation admission fence.
  if (
    /readonly (?:client|inbox|epoch)\s*:/.test(node("pluginContext", "Context")) ||
    /["'](?:inbox|epoch)["']/.test(node("sessionDomain", "SessionDomain"))
  )
    throw new Error("native recovery source unexpected public fence");
}
