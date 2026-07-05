export const HarnessLifecyclePlugin = async ({ client, $ }) => {
  return {
    event: async ({ event }) => {
      const type = event?.type ?? event?.name ?? 'unknown';
      if (type === 'session.start') {
        console.error('[harness] OpenCode harness loaded. Use delegated role evidence before acceptance.');
      }
    },
    'tool.execute.before': async (input) => {
      const command = input?.tool === 'bash' ? String(input?.args?.command ?? '') : '';
      if (/rm\s+-rf\s+(\.opencode|opencode\.json|AGENTS\.md)(\s|$)/.test(command)) {
        throw new Error('Harness guardrail: destructive deletion of OpenCode harness files requires explicit cleanup approval.');
      }
    },
    'message.after': async () => {
      if (client || $) {
        return;
      }
    },
  };
};
