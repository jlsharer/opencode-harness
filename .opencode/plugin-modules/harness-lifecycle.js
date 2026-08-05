export const HarnessLifecyclePlugin = async ({ client, $ }) => {
  function isDelegateCommand(command) {
    return /^\s*(\/delegate-|node\s+.*resolve-model-routing|node\s+.*model-routing-helper)/.test(command);
  }

  return {
    event: async ({ event }) => {
      const type = event?.type ?? event?.name ?? 'unknown';
      if (type === 'session.start') {
        console.error('[harness] OpenCode harness loaded. Use delegated role evidence before acceptance.');
      }
    },
    'tool.execute.before': async (input) => {
      const command = input?.tool === 'bash' ? String(input?.args?.command ?? '') : '';
      if (/rm\s+-rf\s+(\.opencode|\.memory)(\/?)(\s|$)/.test(command)) {
        throw new Error('Harness guardrail: destructive deletion of harness-managed directories requires explicit cleanup approval.');
      }
      if (isDelegateCommand(command)) {
        console.error('[harness] Delegation command observed. Model routing is enforced by the native config hook.');
      }
    },
    'message.after': async () => {
      if (client || $) {
        return;
      }
    },
  };
};
