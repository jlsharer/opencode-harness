import { createTaskThreadPolicy } from "./task-thread-policy.ts";

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

export const HarnessLifecyclePlugin = async ({ client }: HarnessPluginContext = {}) => {
  function logDiagnostic(message: string, extra: UnknownRecord) {
    try {
      Promise.resolve(
        client!.app.log({ body: { service: "opencode-harness", level: "debug", message, extra } }),
      ).catch(() => {});
    } catch {}
  }

  const taskThreadPolicy = createTaskThreadPolicy({
    telemetry: ({ event, delegationTaskId, scopeKey, reason }) => {
      logDiagnostic("Harness task state changed.", {
        event,
        delegationTaskId,
        scopeKey,
        ...(reason ? { reason } : {}),
      });
    },
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
      if (input?.tool === "task")
        taskThreadPolicy.beforeTask({
          sessionID: input.sessionID,
          callID: input.callID,
          args,
        });
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
      if (input?.tool === "task")
        taskThreadPolicy.afterTask({
          callID: input.callID,
          output: output?.output,
          metadata: output?.metadata,
        });
    },
  };
};
