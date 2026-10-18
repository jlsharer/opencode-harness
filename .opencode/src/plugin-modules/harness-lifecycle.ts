import path from "node:path";
import { createManagedDispatch, parseDelegationPolicy } from "./managed-dispatch.ts";

type UnknownRecord = Record<string, unknown>;

export interface HarnessPluginContext {
  client?: {
    app: { log(record: HarnessLogRecord): unknown };
    [key: string]: unknown;
  };
  directory?: string | undefined;
  project?: { root?: string; path?: string; directory?: string } | undefined;
  [key: string]: unknown;
}

interface HarnessLogRecord {
  body: {
    service: "opencode-harness";
    level: "debug";
    message: string;
    extra: UnknownRecord;
  };
}

interface ToolHookInput {
  tool?: unknown;
  sessionID?: unknown;
  callID?: unknown;
  [key: string]: unknown;
}

interface ToolHookOutput {
  args?: unknown;
  output?: unknown;
  metadata?: unknown;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export type HarnessDispatchFactory = (
  options: Parameters<typeof createManagedDispatch>[0],
) => Pick<
  ReturnType<typeof createManagedDispatch>,
  "beforeTask" | "beforeTool" | "afterTool" | "afterTask" | "sessionCreated" | "interrupt"
> &
  Partial<
    Pick<ReturnType<typeof createManagedDispatch>, "reconcileBackground" | "cancelBackground">
  >;

export const HarnessLifecyclePlugin = async (
  context: HarnessPluginContext = {},
  dispatchFactory: HarnessDispatchFactory = createManagedDispatch,
) => {
  const { client } = context;

  function logDiagnostic(message: string, extra: UnknownRecord) {
    try {
      Promise.resolve(
        client!.app.log({ body: { service: "opencode-harness", level: "debug", message, extra } }),
      ).catch(() => {});
    } catch {}
  }

  const workspaceRoot = process.env.OPENCODE_HARNESS_WORKSPACE_ROOT || context.directory || "";
  const traceRoot =
    process.env.OPENCODE_HARNESS_TRACE_ROOT ||
    (workspaceRoot ? path.join(workspaceRoot, ".memory") : "");

  function assertWorkspaceIdentity() {
    if (process.env.OPENCODE_HARNESS_WORKSPACE_ROOT && context.directory !== workspaceRoot)
      throw new Error("managed workspace mismatch; open the correct project harness instance");
  }

  const managedSessions = new Set<string>();
  let nativeConfig: UnknownRecord = {};
  const delegationValue = context.delegationPolicy ?? process.env.OPENCODE_HARNESS_DELEGATION;
  if (typeof delegationValue === "string" && delegationValue.length > 8192)
    throw new Error("delegation policy exceeds bound");
  const delegation = parseDelegationPolicy(delegationValue);
  const nativeSession = isRecord(client?.session) ? client.session : {};
  const capable = ["messages", "get", "status", "abort"].every(
    (name) => typeof nativeSession[name] === "function",
  );

  async function sessionCall(name: string, child?: string): Promise<unknown> {
    const method = nativeSession[name];
    if (typeof method !== "function")
      throw new Error(`native session.${name} capability unavailable`);
    const response: unknown = await method.call(
      nativeSession,
      child ? { path: { id: child }, query: { limit: 256 } } : {},
    );
    if (!isRecord(response) || response.error || response.data === undefined)
      throw new Error(`native session.${name} failed`);
    return response.data;
  }

  async function messages(child: string): Promise<unknown[]> {
    const data = await sessionCall("messages", child);
    if (!Array.isArray(data) || data.length > 256)
      throw new Error("native message list unavailable or oversized");
    return data;
  }

  const transport = {
    enabled: capable && process.env.OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS === "true",
    models: async (parent: string, role: string) => {
      const list = await messages(parent);
      const assistant = list
        .filter(isRecord)
        .findLast((m) => isRecord(m.info) && m.info.role === "assistant");
      const info = isRecord(assistant?.info) ? assistant.info : {};
      if (typeof info.providerID !== "string" || typeof info.modelID !== "string")
        throw new Error("actual parent model identity unavailable");
      const parentModel = info.providerID + "/" + info.modelID;
      const agents = isRecord(nativeConfig.agent) ? nativeConfig.agent : {};
      const agent = isRecord(agents[role]) ? agents[role] : {};
      return {
        parent: parentModel,
        worker: typeof agent.model === "string" ? agent.model : parentModel,
      };
    },
    inspect: async (child: string) => {
      const session = await sessionCall("get", child);
      const status = await sessionCall("status");
      if (
        !isRecord(session) ||
        session.id !== child ||
        typeof session.parentID !== "string" ||
        !isRecord(status)
      )
        throw new Error("native session identity/status unavailable");
      const current = status[child];
      const idle = current === undefined || (isRecord(current) && current.type === "idle");
      return { parent: session.parentID, idle, messages: await messages(child) };
    },
    abort: async (child: string) => {
      if ((await sessionCall("abort", child)) !== true)
        throw new Error("native abort acknowledgement unavailable");
    },
  };
  const dispatch = dispatchFactory({
    workspaceRoot,
    traceRoot,
    telemetry: (event) => logDiagnostic("Harness task state changed.", event),
    delegation,
    backgroundTransport: transport,
  });

  function isDelegateCommand(command: string): boolean {
    return /^\s*(\/delegate-|node\s+.*resolve-model-routing|node\s+.*model-routing-helper)/.test(
      command,
    );
  }

  const blockedRoleCommands = new Set([
    "delegate-research",
    "delegate-plan",
    "delegate-implement",
    "delegate-validate",
  ]);

  return {
    config: async (cfg: unknown) => {
      assertWorkspaceIdentity();
      if (!isRecord(cfg)) throw new Error("native config unavailable");
      nativeConfig = cfg;
      if (delegation.mode === "background" && !transport.enabled)
        throw new Error(
          "background mode requires native session APIs and OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true",
        );
    },
    "chat.message": async (input: { sessionID?: unknown }) => {
      if (typeof input.sessionID === "string" && managedSessions.has(input.sessionID))
        await dispatch.reconcileBackground?.();
    },
    event: async ({ event }: { event?: unknown }) => {
      const eventRecord = isRecord(event) ? event : {};
      const type = eventRecord.type ?? eventRecord.name ?? "unknown";
      if (type === "session.created") {
        logDiagnostic("OpenCode harness loaded.", { event: "session-created" });
        const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
        if (isRecord(properties.info)) {
          dispatch.sessionCreated(properties.info);
          if (
            typeof properties.info.id === "string" &&
            typeof properties.info.parentID === "string" &&
            managedSessions.has(properties.info.parentID)
          )
            managedSessions.add(properties.info.id);
        }
      }
      if (type === "session.idle" || type === "session.status") {
        const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
        if (
          typeof properties.sessionID === "string" &&
          (type === "session.idle" ||
            (isRecord(properties.status) && properties.status.type === "idle"))
        )
          await dispatch.reconcileBackground?.(properties.sessionID);
      }
      if (type === "session.error" || type === "session.deleted") {
        const properties = isRecord(eventRecord.properties) ? eventRecord.properties : {};
        const info = isRecord(properties.info) ? properties.info : {};
        const sessionId = properties.sessionID ?? info.id;
        if (
          managedSessions.size &&
          (typeof sessionId !== "string" || managedSessions.has(sessionId))
        )
          dispatch.interrupt(
            type === "session.error" ? "managed session error" : "managed session deleted",
          );
      }
    },
    "command.execute.before": async (input: { command?: unknown }) => {
      const command = String(input?.command ?? "").replace(/^\//, "");
      if (blockedRoleCommands.has(command)) {
        throw new Error(
          "Harness guardrail: direct role commands are not a managed dispatch surface; use /delegate-orchestration so Task policy enforcement applies.",
        );
      }
    },
    "tool.execute.before": async (input: ToolHookInput, output: ToolHookOutput) => {
      const args = isRecord(output?.args) ? output.args : undefined;
      if (input?.tool === "task") {
        if (
          dispatchFactory === createManagedDispatch &&
          (!workspaceRoot || !path.isAbsolute(workspaceRoot))
        )
          throw new Error("Harness managed dispatch requires an absolute workspace root");
        await dispatch.beforeTask(input, args ?? {});
        if (typeof input.sessionID === "string") managedSessions.add(input.sessionID);
      } else {
        output.args = dispatch.beforeTool(input, args ?? {});
      }
      const command = input?.tool === "bash" ? String(args?.command ?? "") : "";
      if (/rm\s+-rf\s+(\.opencode|\.memory)(\/?)(\s|$)/.test(command)) {
        throw new Error(
          "Harness guardrail: destructive deletion of harness-managed directories requires explicit cleanup approval.",
        );
      }
      if (isDelegateCommand(command)) {
        logDiagnostic("Delegation command observed.", { event: "delegation-command-observed" });
      }
    },
    "tool.execute.after": async (input: ToolHookInput, output: ToolHookOutput) => {
      if (input?.tool === "task") dispatch.afterTask(input, output);
      else dispatch.afterTool(input, output);
    },
  };
};
