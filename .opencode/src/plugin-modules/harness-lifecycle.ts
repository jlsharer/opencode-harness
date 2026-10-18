import path from "node:path";
import { createManagedDispatch } from "./managed-dispatch.ts";

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
  const managedSessions = new Set<string>();
  const dispatch = dispatchFactory({
    workspaceRoot,
    traceRoot,
    telemetry: (event) => logDiagnostic("Harness task state changed.", event),
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
