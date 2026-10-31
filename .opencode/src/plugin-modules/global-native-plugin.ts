import { randomUUID } from "node:crypto";
import { mkdir, lstat, open, readFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { fileURLToPath } from "node:url";
import os from "node:os";
import {
  createGlobalProtocol,
  declaredFileEvidence,
  identifier,
  object,
  NATIVE_SOURCE_COMMIT,
} from "./global-protocol.ts";
import type { TaskContext } from "./task-contracts.ts";

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
    traceRoot?: string;
    persist?: (record: Record<string, unknown>) => Promise<void>;
    collision?: () => Promise<string | null>;
  } = {},
) {
  const protocol = createGlobalProtocol();
  let disposed = false;
  const calls = new Map<
    string,
    {
      parentID: string;
      context: TaskContext;
      cwd: string;
      consumed: boolean;
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
    if (collision) throw new Error("managed profile collision: " + collision);
    return session;
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

  async function before(event: NativeEvent) {
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
        throw new Error("duplicate or exhausted native call ledger");
      await persist({
        event: "task.admit",
        sessionID: event.sessionID,
        callID: event.id,
        callerAgent: event.agent,
        sessionAgent: nativeParent.agent ?? null,
        ...admitted.context,
        cwd: admitted.cwd,
      });
      calls.set(callKey(event), { parentID: event.sessionID, ...admitted, consumed: false });
    } catch (error) {
      protocol.reject(event.sessionID, admitted.context);
      throw error;
    }
  }

  async function after(event: NativeEvent) {
    const call = calls.get(callKey(event));
    if (!call) return;
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
      protocol.result(call.parentID, call.context, decoded, {
        treeHash: evidence.sha256,
        gateIds: spec.workUnits.find((u) => u.id === call.context.scopeKey)!.acceptanceGateIds,
      });
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

  async function action(sessionID: string, input: unknown) {
    const session = await parent(sessionID);
    const request = object(input);
    if (request.version !== 1) throw new Error("protocol action version must be 1");
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
      return protocol.accept(sessionID, id, evidence.sha256);
    }
    if (request.action === "task.cancel") {
      if (Object.keys(request).sort().join() !== "action,context,version")
        throw new Error("unexpected cancellation fields");
      return protocol.cancel(sessionID, object(request.context) as unknown as TaskContext);
    }
    throw new Error("unsupported global protocol action");
  }

  async function register() {
    if (disposed) throw new Error("cannot register a disposed global harness instance");
    // Commands are user-facing entry points, not tools the parent model can invoke.
    // Register the control plane as a direct native tool so natural-language intake
    // can actually admit/accept work without asking the user to relay JSON commands.
    await ctx.tool.transform((editor) => {
      editor.add({
        name: "harness_orchestration",
        description: [
          "Control the global four-role harness after loading the delegation-orchestrator skill:",
          "admit its normalized specification, accept independently validated work, or cancel a task.",
          "Call with a version-1 action object. Native session identity comes from the host, never the request.",
          "Dispatch admitted role tasks through the native subagent tool.",
        ].join(" "),
        options: { codemode: false },
        input: {
          type: "object",
          properties: {
            version: { type: "integer", const: 1 },
            action: {
              type: "string",
              enum: ["orchestration.admit", "orchestration.accept", "task.cancel"],
            },
            spec: { type: "object", additionalProperties: true },
            evidenceFiles: { type: "array", items: { type: "string" } },
            orchestrationId: { type: "string" },
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
        description: "Admit or accept a version-1 managed protocol action",
        execute: async (input) => {
          let request: unknown;
          try {
            request = JSON.parse(input.prompt.text);
          } catch {
            throw new Error(
              "delegate-orchestration requires a version-1 JSON action; use the global delegation-orchestrator skill for intake and specification assembly",
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
