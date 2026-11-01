import { gateObligationsFor } from "./dispatch-controller.ts";
import { randomUUID } from "node:crypto";
import { mkdir, lstat, open, readFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import {
  createGlobalProtocol,
  createGlobalReplayLedger,
  declaredFileEvidence,
  identifier,
  object,
  NATIVE_SOURCE_COMMIT,
} from "./global-protocol.ts";
import type { TaskContext } from "./task-contracts.ts";
import { appendDelegationContext } from "./context-budget.ts";

/** Structural subset of the Promise API at NATIVE_SOURCE_COMMIT, not a provider SDK shim. */
export interface NativeEvent {
  tool: string;
  sessionID: string;
  agent: string;
  messageID: string;
  id: string;
  input: unknown;
  status?: string;
  result?: unknown;
}
interface NativeSession {
  id: string;
  parentID?: string;
  // Native Session.Info leaves this unset when the session uses the selected default.
  agent?: string;
  location: { directory: string };
}
interface NativeTool {
  id: string;
  execute(input: unknown, context: Record<string, unknown>): Promise<unknown>;
}
export interface GlobalControlTool {
  name: string;
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  options: { codemode: false };
  execute(
    input: unknown,
    context: { sessionID: string },
  ): Promise<{ output: unknown; content: string }>;
}
export interface GlobalNativeContext {
  agent?: {
    list(): Promise<{ id: string; mode: "primary" | "subagent" | "all"; hidden: boolean }[]>;
  };
  session: {
    get(input: { sessionID: string }): Promise<NativeSession>;
    hook?(
      name: "context" | "compaction",
      callback: (event: {
        sessionID: string;
        system: { type: "text"; text: string }[];
      }) => Promise<void>,
    ): Promise<unknown>;
    synthetic?(input: { sessionID: string; text: string }): Promise<unknown>;
  };
  tool: {
    transform(
      callback: (editor: { add(definition: GlobalControlTool): void }) => void,
    ): Promise<unknown>;
    hook(name: string, callback: (event: NativeEvent) => Promise<void>): Promise<unknown>;
    list(): Promise<NativeTool[]>;
  };
  command: {
    transform(
      callback: (editor: {
        add(definition: {
          name: string;
          description: string;
          execute(input: { sessionID: string; prompt: { text: string } }): Promise<void>;
        }): void;
      }) => void,
    ): Promise<unknown>;
  };
}

export async function projectHarnessCollision(cwd: string): Promise<string | null> {
  let current = cwd;
  while (true) {
    const entry = path.join(current, ".opencode/plugins/index.js");
    try {
      const text = await readFile(entry, "utf8");
      if (/harness-lifecycle|v2-native-plugin|HarnessPlugin/.test(text)) return entry;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (path.dirname(current) === current) break;
    current = path.dirname(current);
  }
  return null;
}

const ROLES = ["researcher", "planner", "implementer", "validator"] as const;
const COMMANDS = {
  "delegate-research": "researcher",
  "delegate-plan": "planner",
  "delegate-implement": "implementer",
  "delegate-validate": "validator",
} as const;
const PREFIX = "<<<HARNESS_TASK_THREAD_POLICY_V1>>>\n";
const SUFFIX = "\n<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>";

export function decodeGlobalEnvelope(input: unknown) {
  if (
    typeof input !== "string" ||
    input.length > 20000 ||
    !input.startsWith(PREFIX) ||
    !input.endsWith(SUFFIX)
  )
    throw new Error("managed role requires exact version-1 task envelope");
  const envelope = object(JSON.parse(input.slice(PREFIX.length, -SUFFIX.length)));
  if (
    Object.keys(envelope).sort().join() !== "kind,packet,role,version" ||
    envelope.kind !== "fresh" ||
    envelope.version !== 1 ||
    !ROLES.includes(envelope.role as (typeof ROLES)[number])
  )
    throw new Error("unsupported managed task envelope");
  return { role: envelope.role as TaskContext["role"], packet: object(envelope.packet) };
}

/** A rejection replaces every native success surface. It must never throw from execute.after. */
export function replaceGlobalResult(
  event: NativeEvent,
  reason: string,
  verifiedChildSessionID?: string,
) {
  const rejection = {
    version: 1,
    status: "rejected",
    callID: event.id,
    parentSessionID: event.sessionID,
    ...(verifiedChildSessionID === undefined ? {} : { verifiedChildSessionID }),
    reason,
  };
  const text = JSON.stringify(rejection);
  event.result = {
    output: rejection,
    content: text,
    metadata: { harness: "rejected", callID: event.id },
  };
}

function nativeTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  // Tool.runtime.execute normalizes raw strings to a single native text block
  // before execute.after. Do not flatten arbitrary rich/multiple blocks or ignore
  // extra surfaces: their exact agreement with the native output still matters.
  if (!Array.isArray(content) || content.length !== 1)
    throw new Error("native content/output mismatch");
  const block = object(content[0]);
  if (
    Object.keys(block).sort().join() !== "text,type" ||
    block.type !== "text" ||
    typeof block.text !== "string"
  )
    throw new Error("native content/output mismatch");
  return block.text;
}

export function createGlobalNativeAdapter(
  ctx: GlobalNativeContext,
  options: {
    now?: () => number;
    maxTaskTimeoutMs?: number;
    traceRoot?: string;
    persist?: (record: Record<string, unknown>) => Promise<void>;
    collision?: () => Promise<string | null>;
  } = {},
) {
  const replayLedger = createGlobalReplayLedger();
  const generation = randomUUID();
  const protocol = createGlobalProtocol({ ...options, replayLedger, generation });
  // Only managed mutations enter this queue. Ordinary tools keep their native path.
  let tail: Promise<unknown> = Promise.resolve();
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  };
  const pendingCommands = new Set<string>();
  let disposed = false;
  let calls = new Map<
    string,
    {
      parentID: string;
      context: TaskContext;
      cwd: string;
      consumed: boolean;
      terminal?: boolean;
      continuedChild?: string;
    }
  >();
  const traceRoot =
    options.traceRoot ??
    path.join(
      process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local/state"),
      "opencode-harness",
      "traces",
    );
  const callKey = (event: NativeEvent) => JSON.stringify([event.sessionID, event.id]);
  const persist =
    options.persist ??
    (async (record: Record<string, unknown>) => {
      if (!path.isAbsolute(traceRoot) || path.resolve(traceRoot) !== traceRoot)
        throw new Error("invalid external harness trace root");
      const sessionID = identifier(record.sessionID);
      const orchestrationID = identifier(record.orchestrationId);
      const directory = path.join(
        traceRoot,
        "sessions",
        sessionID,
        "orchestrations",
        orchestrationID,
      );
      let current = path.parse(directory).root;
      let previous = await lstat(current);
      for (const component of directory.slice(current.length).split(path.sep)) {
        current = path.join(current, component);
        let info;
        try {
          info = await lstat(current);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          if (previous.uid !== process.getuid?.() || previous.mode & 0o022)
            throw new Error("trace creation requires an owned non-writable parent");
          await mkdir(current, { mode: 0o700 });
          info = await lstat(current);
        }
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error("unsafe trace ancestor");
        if (
          (current === traceRoot || current.startsWith(traceRoot + path.sep)) &&
          (info.uid !== process.getuid?.() || info.mode & 0o077)
        )
          throw new Error("trace root and descendants must be private and owned");
        previous = info;
      }
      const file = await open(
        path.join(directory, "protocol.jsonl"),
        constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW,
        0o600,
      );
      try {
        const info = await file.stat();
        if (
          !info.isFile() ||
          info.uid !== process.getuid?.() ||
          info.mode & 0o077 ||
          info.nlink !== 1
        )
          throw new Error("unsafe harness trace file");
        await file.writeFile(JSON.stringify(record) + "\n");
      } finally {
        await file.close();
      }
    });

  async function parent(sessionID: string) {
    if (disposed) throw new Error("global harness instance disposed; use the current native tools");
    const session = await ctx.session.get({ sessionID });
    if (
      session.id !== sessionID ||
      session.parentID ||
      ROLES.includes(session.agent as (typeof ROLES)[number])
    )
      throw new Error("managed protocol authority requires a primary parent");
    const collision = await (options.collision
      ? options.collision()
      : projectHarnessCollision(session.location.directory));
    if (collision)
      throw new Error(
        "managed profile collision: " +
          collision +
          "; global-native and project source/portable guards cannot own the same managed session. " +
          "Choose one profile: review `opencode-harness global migrate-project --workspace ABS` " +
          "before explicitly applying migration, or use the source/portable launcher without the global plugin. " +
          "File presence is conservative collision evidence, not proof of two active plugins. No files were migrated.",
      );
    if (disposed) throw new Error("global harness instance disposed");
    return { ...session, location: { directory: session.location.directory } };
  }

  async function commandCaller(session: NativeSession) {
    if (session.agent !== undefined) return session.agent;
    // Native Agent.list puts the selected default first. Resolve it rather than
    // inventing "build" or passing an undefined caller to a command's executor.
    const selected = (await ctx.agent?.list())?.find(
      (agent) => agent.mode !== "subagent" && !agent.hidden,
    );
    if (!selected || !selected.id.trim())
      throw new Error("native default agent unavailable for direct role command; use subagent");
    return selected.id;
  }

  async function beforeManaged(event: NativeEvent) {
    // No mutations or lookups for ordinary native tool calls, including Code Mode inner calls.
    if (event.tool !== "subagent") return;
    const input = object(event.input);
    if (typeof event.agent !== "string" || !event.agent.trim())
      throw new Error("native caller agent unavailable");
    const leaf = ROLES.includes(event.agent as (typeof ROLES)[number]);
    if (leaf) throw new Error("managed leaves cannot delegate");
    if (!ROLES.includes(input.agent as (typeof ROLES)[number])) return;
    const nativeParent = await parent(event.sessionID);
    if (nativeParent.agent !== undefined && nativeParent.agent !== event.agent)
      throw new Error("native caller agent mismatch");
    if (
      Object.keys(input).some(
        (k) => !["agent", "description", "prompt", "model", "background", "sessionID"].includes(k),
      ) ||
      typeof input.description !== "string" ||
      !input.description.trim() ||
      (input.background !== undefined && input.background !== false) ||
      (input.model !== undefined && typeof input.model !== "string")
    )
      throw new Error(
        "managed foreground requires fresh native child; background/continuation unavailable",
      );
    if (calls.size >= 4096 || calls.has(callKey(event)) || replayLedger.has("call", callKey(event)))
      throw new Error("duplicate, stale or exhausted native call ledger");
    if (Object.hasOwn(input, "sessionID")) {
      const childID = identifier(input.sessionID);
      if (
        typeof input.prompt !== "string" ||
        !input.prompt.startsWith(PREFIX) ||
        !input.prompt.endsWith(SUFFIX)
      )
        throw new Error("continuation requires exact clarification envelope");
      const response: unknown = JSON.parse(input.prompt.slice(PREFIX.length, -SUFFIX.length));
      const admitted = protocol.continueClarification(event.sessionID, childID, event.id, response);
      try {
        if (
          admitted.context.role !== input.agent ||
          admitted.cwd !== nativeParent.location.directory ||
          calls.has(callKey(event))
        )
          throw new Error("continued task identity mismatch");
        await persist({
          event: "task.clarification-response",
          sessionID: event.sessionID,
          callID: event.id,
          callerAgent: event.agent,
          sessionAgent: nativeParent.agent ?? null,
          ...admitted.context,
        });
        const current = await parent(event.sessionID);
        if (current.location.directory !== admitted.cwd)
          throw new Error("native cwd moved before continuation launch");
        calls.set(callKey(event), {
          parentID: event.sessionID,
          ...admitted,
          consumed: false,
          continuedChild: childID,
        });
      } catch (error) {
        protocol.reject(event.sessionID, admitted.context);
        throw error;
      }
      return;
    }
    const decoded = decodeGlobalEnvelope(input.prompt);
    if (decoded.role !== input.agent) throw new Error("native role differs from task envelope");
    const admitted = protocol.admitTask(event.sessionID, event.id, decoded.role, decoded.packet);
    try {
      if (admitted.cwd !== nativeParent.location.directory)
        throw new Error("native cwd moved; admit a new orchestration");
      if (calls.size >= 4096 || calls.has(callKey(event)))
        throw new Error("duplicate, stale or exhausted native call ledger");
      await persist({
        event: "task.admit",
        sessionID: event.sessionID,
        callID: event.id,
        callerAgent: event.agent,
        sessionAgent: nativeParent.agent ?? null,
        ...admitted.context,
        cwd: admitted.cwd,
      });
      const current = await parent(event.sessionID);
      if (current.location.directory !== admitted.cwd)
        throw new Error("native cwd moved before launch");
      calls.set(callKey(event), { parentID: event.sessionID, ...admitted, consumed: false });
    } catch (error) {
      protocol.reject(event.sessionID, admitted.context);
      throw error;
    }
  }

  async function afterManaged(event: NativeEvent) {
    const call = calls.get(callKey(event));
    if (!call) {
      if (replayLedger.has("call", callKey(event)))
        replaceGlobalResult(event, "retired or rejected native call");
      return;
    }
    let verifiedChildSessionID: string | undefined;
    try {
      if (disposed) throw new Error("global harness instance disposed; late result rejected");
      if (call.consumed) throw new Error("duplicate or late native callback");
      call.consumed = true;
      if (event.status !== "completed") {
        protocol.reject(call.parentID, call.context);
        return;
      }
      const result = object(event.result);
      const output = object(result.output);
      const metadata = object(result.metadata);
      const childID = identifier(output.sessionID);
      if (
        output.status !== "completed" ||
        metadata.status !== "completed" ||
        metadata.sessionID !== childID ||
        typeof output.output !== "string" ||
        Object.keys(output).sort().join() !== "output,sessionID,status"
      )
        throw new Error("native output/metadata correlation mismatch");
      const child = await ctx.session.get({ sessionID: childID });
      if (child.id !== childID) throw new Error("native child lookup identity mismatch");
      if (call.continuedChild) {
        if (
          child.id !== call.continuedChild ||
          child.parentID !== call.parentID ||
          child.agent !== call.context.role
        )
          throw new Error("continued native child identity mismatch");
      } else protocol.started(call.parentID, call.context, child);
      verifiedChildSessionID = childID;
      const wrapper = `<subagent sessionID="${childID}" state="completed">\n${output.output}\n</subagent>`;
      if (nativeTextContent(result.content) !== wrapper)
        throw new Error("native content/output mismatch");
      const spec = protocol.spec(call.parentID, call.context.orchestrationId);
      const files = protocol.evidenceFiles(call.parentID, call.context.orchestrationId);
      const evidence = await declaredFileEvidence(call.cwd, files);
      const text = output.output;
      const fenced = /^```json\n(\{[\s\S]*\})\n```$/.exec(text);
      let decoded: unknown;
      try {
        decoded = JSON.parse(fenced?.[1] ?? text);
      } catch {
        throw new Error("invalid managed result JSON");
      }
      await persist({
        event: "task.result",
        sessionID: call.parentID,
        callID: event.id,
        ...call.context,
        childID,
        evidence,
      });
      if (disposed) throw new Error("global harness instance disposed; late result rejected");
      protocol.result(call.parentID, call.context, decoded, {
        treeHash: evidence.sha256,
        gateIds: gateObligationsFor(spec, {
          workUnitId: call.context.scopeKey,
          role: call.context.role,
          taskMode: call.context.taskMode,
        }).map((g) => g.id),
      });
      call.terminal = true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "managed result rejected";
      try {
        protocol.reject(call.parentID, call.context);
      } catch {
        /* terminal failure stays local */
      }
      try {
        await persist({
          event: "task.rejected",
          sessionID: call.parentID,
          callID: event.id,
          ...call.context,
          ...(verifiedChildSessionID === undefined ? {} : { verifiedChildSessionID }),
          reason,
        });
      } catch {
        // Persistence errors must not escape execute.after or erase the rejection.
      }
      replaceGlobalResult(event, reason, verifiedChildSessionID);
    }
  }

  async function actionManaged(sessionID: string, input: unknown) {
    const session = await parent(sessionID);
    const request = object(input);
    if (request.version !== 1 && request.version !== 2)
      throw new Error("protocol action version must be 1 or 2");
    if (request.version === 2 && request.action === "status") {
      if (Object.keys(request).sort().join() !== "action,version")
        throw new Error("unexpected status fields");
      const status = protocol.status(sessionID, session.location.directory);
      return {
        ...status,
        residentCalls: { used: calls.size, limit: 4096 },
        runs: status.runs.map((run) => {
          const related = [...calls.values()].filter(
            (c) => c.parentID === sessionID && c.context.orchestrationId === run.orchestrationId,
          );
          const pending = [...pendingCommands].some((key) => {
            const c = calls.get(key);
            return c?.parentID === sessionID && c.context.orchestrationId === run.orchestrationId;
          });
          return {
            ...run,
            retirementRefusal:
              run.retirementRefusal ??
              (pending
                ? "pending command"
                : related.some((c) => !c.consumed || !c.terminal)
                  ? "pending callback or uncertain call"
                  : null),
          };
        }),
      };
    }
    if (request.version === 2 && request.action === "retire") {
      if (Object.keys(request).sort().join() !== "acceptanceDigest,action,orchestrationId,version")
        throw new Error("unexpected retirement fields");
      const id = identifier(request.orchestrationId);
      if (
        typeof request.acceptanceDigest !== "string" ||
        !/^[a-f0-9]{64}$/.test(request.acceptanceDigest)
      )
        throw new Error("invalid acceptance digest");
      // Re-fetch native binding after all awaited checks; caller cannot supply proof.
      const current = await parent(sessionID);
      if (current.location.directory !== session.location.directory)
        throw new Error("native cwd moved before retirement");
      const related = [...calls.entries()].filter(
        ([, c]) => c.parentID === sessionID && c.context.orchestrationId === id,
      );
      return protocol.retire(sessionID, current.location.directory, id, request.acceptanceDigest, {
        generation,
        parentID: sessionID,
        cwd: current.location.directory,
        pending: related.some(([key]) => pendingCommands.has(key)),
        callsConsumed: related.every(([, c]) => c.consumed && c.terminal),
        prepare: () => {
          const replacement = new Map(calls);
          for (const [key] of related) {
            if (!replayLedger.has("call", key)) throw new Error("missing exact rejection identity");
            replacement.delete(key);
          }
          return () => {
            calls = replacement;
          };
        },
      });
    }
    if (request.action === "orchestration.admit") {
      if (
        !["action,spec,version", "action,evidenceFiles,spec,version"].includes(
          Object.keys(request).sort().join(),
        )
      )
        throw new Error("unexpected admission fields");
      const id = protocol.admitOrchestration(
        sessionID,
        session.location.directory,
        request.spec,
        request.evidenceFiles as string[] | undefined,
      );
      await persist({
        event: request.action,
        sessionID,
        orchestrationId: id,
        cwd: session.location.directory,
      });
      const current = await parent(sessionID);
      if (current.location.directory !== protocol.cwd(sessionID, id))
        throw new Error("native cwd moved during admission");
      return {
        admitted: id,
        workspaceRoot: session.location.directory,
        runtimeRoot: path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url)))),
        traceRoot: path.join(traceRoot, "sessions", sessionID, "orchestrations", id),
      };
    }
    if (request.action === "orchestration.accept") {
      if (Object.keys(request).sort().join() !== "action,orchestrationId,version")
        throw new Error("unexpected acceptance fields");
      const id = identifier(request.orchestrationId);
      if (session.location.directory !== protocol.cwd(sessionID, id))
        throw new Error("native cwd moved before acceptance");
      const evidence = await declaredFileEvidence(
        session.location.directory,
        protocol.evidenceFiles(sessionID, id),
      );
      await persist({ event: request.action, sessionID, orchestrationId: id, evidence });
      const currentEvidence = await declaredFileEvidence(
        session.location.directory,
        protocol.evidenceFiles(sessionID, id),
      );
      const current = await parent(sessionID);
      if (current.location.directory !== session.location.directory)
        throw new Error("native cwd moved before acceptance");
      return protocol.accept(sessionID, id, currentEvidence.sha256, request.version);
    }
    if (request.action === "task.cancel") {
      if (Object.keys(request).sort().join() !== "action,context,version")
        throw new Error("unexpected cancellation fields");
      return protocol.cancel(sessionID, object(request.context) as unknown as TaskContext);
    }
    throw new Error("unsupported global protocol action");
  }

  function before(event: NativeEvent) {
    if (event.tool !== "subagent") return Promise.resolve();
    // Leaf delegation is managed policy; unrelated primary subagents need no queue.
    const input = object(event.input);
    if (
      !ROLES.includes(event.agent as (typeof ROLES)[number]) &&
      !ROLES.includes(input.agent as (typeof ROLES)[number])
    )
      return Promise.resolve();
    return serial(() => beforeManaged(event));
  }

  function after(event: NativeEvent) {
    if (!calls.has(callKey(event)) && !replayLedger.has("call", callKey(event)))
      return Promise.resolve();
    return serial(() => afterManaged(event));
  }

  function action(sessionID: string, input: unknown) {
    return serial(() => actionManaged(sessionID, input));
  }

  async function register() {
    if (disposed) throw new Error("cannot register a disposed global harness instance");
    if (ctx.session.hook) {
      const context = async (event: {
        sessionID: string;
        system: { type: "text"; text: string }[];
      }) => {
        if (disposed) return;
        const session = await ctx.session.get({ sessionID: event.sessionID });
        if (session.id !== event.sessionID) return;
        // Do not demand admission (or a collision-free workspace) just to explain
        // delegation. The next control action still enforces the full boundary.
        appendDelegationContext(event.system, session, "global-native");
      };
      await ctx.session.hook("context", context);
      await ctx.session.hook("compaction", context);
    }
    // Commands are user-facing entry points, not tools the parent model can invoke.
    // Register the control plane as a direct native tool so natural-language intake
    // can actually admit/accept work without asking the user to relay JSON commands.
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "harness_orchestration",
        description: [
          "Control the global four-role harness after loading the delegation-orchestrator skill:",
          "admit its normalized specification, accept independently validated work, or cancel a task.",
          "Control versions 1 and 2 are supported; version 2 adds status and accepted retirement. Native session identity comes from the host, never the request.",
          "Dispatch admitted role tasks through the native subagent tool.",
        ].join(" "),
        options: { codemode: false },
        input: {
          type: "object",
          properties: {
            version: { type: "integer", enum: [1, 2] },
            action: {
              type: "string",
              enum: [
                "orchestration.admit",
                "orchestration.accept",
                "task.cancel",
                "status",
                "retire",
              ],
            },
            spec: { type: "object", additionalProperties: true },
            evidenceFiles: { type: "array", items: { type: "string" } },
            orchestrationId: { type: "string" },
            acceptanceDigest: { type: "string", pattern: "^[a-f0-9]{64}$" },
            context: { type: "object", additionalProperties: true },
          },
          required: ["version", "action"],
          additionalProperties: false,
        },
        output: { type: "object", additionalProperties: true },
        execute: async (input, context) => {
          const result = await action(context.sessionID, input);
          return { output: result, content: JSON.stringify(result) };
        },
      });
    });
    await ctx.tool.hook("execute.before", before);
    await ctx.tool.hook("execute.after", after);
    await ctx.command.transform((editor) => {
      editor.add({
        name: "delegate-orchestration",
        description: "Control the managed protocol with a version-1 or version-2 action",
        execute: async (input) => {
          let request: unknown;
          try {
            request = JSON.parse(input.prompt.text);
          } catch {
            throw new Error(
              "delegate-orchestration requires a version-1 or version-2 JSON action; use the global delegation-orchestrator skill for intake and specification assembly",
            );
          }
          const result = await action(input.sessionID, request);
          await ctx.session.synthetic?.({
            sessionID: input.sessionID,
            text: JSON.stringify(result),
          });
        },
      });
      for (const [name, role] of Object.entries(COMMANDS))
        editor.add({
          name,
          description: `Dispatch a validated ${role} packet`,
          execute: async (input) => {
            const decoded = decodeGlobalEnvelope(input.prompt.text);
            if (decoded.role !== role) throw new Error("command role mismatch");
            const nativeParent = await parent(input.sessionID);
            const caller = await commandCaller(nativeParent);
            const event: NativeEvent = {
              tool: "subagent",
              sessionID: input.sessionID,
              agent: caller,
              messageID: "harness-command",
              id: randomUUID(),
              input: {
                agent: role,
                description: `Managed ${role} task`,
                prompt: input.prompt.text,
                background: false,
              },
            };
            pendingCommands.add(callKey(event));
            try {
              await before(event);
              try {
                const tool = (await ctx.tool.list()).find((t) => t.id === "subagent");
                if (!tool) throw new Error("native subagent executor unavailable");
                event.result = await tool.execute(event.input, {
                  sessionID: input.sessionID,
                  agent: caller,
                  messageID: event.messageID,
                  id: event.id,
                  signal: new AbortController().signal,
                  progress: async () => {},
                });
                event.status = "completed";
              } catch (error) {
                event.status = "error";
                await after(event);
                throw error;
              }
              await after(event);
              if (object(object(event.result).metadata).harness === "rejected")
                throw new Error(JSON.stringify(event.result));
              await ctx.session.synthetic?.({
                sessionID: input.sessionID,
                text: JSON.stringify(event.result),
              });
            } finally {
              pendingCommands.delete(callKey(event));
            }
          },
        });
    });
  }

  const dispose = () => {
    disposed = true;
  };
  return { before, after, action, register, protocol, dispose };
}

export default {
  id: "opencode-harness.global.v1",
  setup: async (ctx: GlobalNativeContext) => {
    if (!ctx.session?.get || !ctx.tool?.transform || !ctx.tool?.hook || !ctx.command?.transform)
      return;
    // Native plugin activation and IDs are location-scoped. A service may host
    // several legitimate locations or overlap generations during reload. Never
    // count them globally or make admission depend on another location's lifetime.
    const adapter = createGlobalNativeAdapter(ctx);
    try {
      await adapter.register();
    } catch {
      adapter.dispose();
      return;
    }
    return adapter.dispose;
  },
};
