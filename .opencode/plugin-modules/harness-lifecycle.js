import { createTaskThreadPolicy } from "./task-thread-policy.js";
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
export const HarnessLifecyclePlugin = async ({ client } = {}) => {
    function logDiagnostic(message, extra) {
        try {
            Promise.resolve(client.app.log({ body: { service: "opencode-harness", level: "debug", message, extra } })).catch(() => { });
        }
        catch { }
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
    function isDelegateCommand(command) {
        return /^\s*(\/delegate-|node\s+.*resolve-model-routing|node\s+.*model-routing-helper)/.test(command);
    }
    const blockedRoleCommands = new Set([
        "delegate-research",
        "delegate-plan",
        "delegate-implement",
        "delegate-validate",
    ]);
    return {
        event: async ({ event }) => {
            const eventRecord = isRecord(event) ? event : {};
            const type = eventRecord.type ?? eventRecord.name ?? "unknown";
            if (type === "session.created") {
                logDiagnostic("OpenCode harness loaded.", { event: "session-created" });
            }
        },
        "command.execute.before": async (input) => {
            const command = String(input?.command ?? "").replace(/^\//, "");
            if (blockedRoleCommands.has(command)) {
                throw new Error("Harness guardrail: direct role commands are not a managed dispatch surface; use /delegate-orchestration so Task policy enforcement applies.");
            }
        },
        "tool.execute.before": async (input, output) => {
            const args = isRecord(output?.args) ? output.args : undefined;
            if (input?.tool === "task")
                taskThreadPolicy.beforeTask({
                    sessionID: input.sessionID,
                    callID: input.callID,
                    args,
                });
            const command = input?.tool === "bash" ? String(args?.command ?? "") : "";
            if (/rm\s+-rf\s+(\.opencode|\.memory)(\/?)(\s|$)/.test(command)) {
                throw new Error("Harness guardrail: destructive deletion of harness-managed directories requires explicit cleanup approval.");
            }
            if (isDelegateCommand(command)) {
                logDiagnostic("Delegation command observed.", { event: "delegation-command-observed" });
            }
        },
        "tool.execute.after": async (input, output) => {
            if (input?.tool === "task")
                taskThreadPolicy.afterTask({
                    callID: input.callID,
                    output: output?.output,
                    metadata: output?.metadata,
                });
        },
    };
};
