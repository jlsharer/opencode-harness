import { createTaskThreadPolicy } from './task-thread-policy.js';

export const HarnessLifecyclePlugin = async () => {
  const taskThreadPolicy = createTaskThreadPolicy({
    telemetry: ({ event, delegationTaskId, scopeKey, reason }) => {
      console.error(`[harness] task-thread ${event} task=${delegationTaskId ?? 'unknown'} scope=${scopeKey ?? 'unknown'}${reason ? ` reason=${reason}` : ''}`);
    },
  });
  function isDelegateCommand(command) {
    return /^\s*(\/delegate-|node\s+.*resolve-model-routing|node\s+.*model-routing-helper)/.test(command);
  }
  const blockedRoleCommands = new Set(['delegate-research', 'delegate-plan', 'delegate-implement', 'delegate-validate']);

  return {
    event: async ({ event }) => {
      const type = event?.type ?? event?.name ?? 'unknown';
      if (type === 'session.created') {
        console.error('[harness] OpenCode harness loaded. Use delegated role evidence before acceptance.');
      }
    },
    'command.execute.before': async (input) => {
      const command = String(input?.command ?? '').replace(/^\//, '');
      if (blockedRoleCommands.has(command)) {
        throw new Error('Harness guardrail: direct role commands are not a managed dispatch surface; use /delegate-orchestration so Task policy enforcement applies.');
      }
    },
    'tool.execute.before': async (input, output) => {
      if (input?.tool === 'task') taskThreadPolicy.beforeTask({ sessionID: input.sessionID, callID: input.callID, args: output?.args });
      const command = input?.tool === 'bash' ? String(output?.args?.command ?? '') : '';
      if (/rm\s+-rf\s+(\.opencode|\.memory)(\/?)(\s|$)/.test(command)) {
        throw new Error('Harness guardrail: destructive deletion of harness-managed directories requires explicit cleanup approval.');
      }
      if (isDelegateCommand(command)) {
        console.error('[harness] Delegation command observed. Model routing is enforced by the native config hook.');
      }
    },
    'tool.execute.after': async (input, output) => {
      if (input?.tool === 'task') taskThreadPolicy.afterTask({ callID: input.callID, output: output?.output, metadata: output?.metadata });
    },
  };
};
