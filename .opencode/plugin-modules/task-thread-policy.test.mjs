import assert from 'node:assert/strict';
import test from 'node:test';
import { HarnessLifecyclePlugin } from './harness-lifecycle.js';
import { TASK_THREAD_ROLE_PACKET_FIELDS, createTaskThreadPolicy, formatTaskResultWrapper, formatTaskThreadEnvelope } from './task-thread-policy.js';

const roleValues = {
  researcher: ['question', ['sources'], 'current', 'plan'],
  planner: ['goal', ['scope'], ['research'], ['paths'], ['criteria']],
  implementer: ['plan', ['paths'], ['scope'], ['schema'], ['preserve'], ['test']],
  validator: [['files'], ['criteria'], ['commands'], ['schemas'], 'pass'],
};

const taskModes = { researcher: 'research', planner: 'plan', implementer: 'implementation', validator: 'validation' };

function packet(role = 'implementer', overrides = {}) {
  const common = { orchestrationId: '2026-08-04-test', delegationTaskId: 'task-1', scopeKey: 'root', dispatchKind: 'fresh', taskMode: taskModes[role], routingMetadataStatus: 'absent' };
  const fields = TASK_THREAD_ROLE_PACKET_FIELDS[role].required.filter((field) => !Object.hasOwn(common, field));
  return { ...common, ...Object.fromEntries(fields.map((field, index) => [field, roleValues[role][index]])), ...overrides };
}
const fresh = (role = 'implementer', overrides = {}) => formatTaskThreadEnvelope({ kind: 'fresh', version: 1, role, packet: packet(role, overrides) });
const request = (overrides = {}) => formatTaskThreadEnvelope({ kind: 'clarification-request', version: 1, delegationTaskId: 'task-1', requestNonce: 'nonce-1', question: 'Which documented choice applies?', ...overrides });
const response = (overrides = {}) => formatTaskThreadEnvelope({ kind: 'clarification-response', version: 1, delegationTaskId: 'task-1', requestNonce: 'nonce-1', answer: 'Use the approved first choice.', ...overrides });
const wrapped = (text, child = 'child-1') => formatTaskResultWrapper(text, child);
const freshArgs = (overrides = {}) => ({ description: 'one scope', subagent_type: 'implementer', prompt: fresh(), ...overrides });

function authorize(policy, { parent = 'parent-1', child = 'child-1', call = 'call-1' } = {}) {
  policy.beforeTask({ sessionID: parent, callID: call, args: freshArgs() });
  policy.afterTask({ callID: call, output: wrapped(request(), child), metadata: { sessionId: child } });
}

test('fresh packets exactly carry every role input contract', () => {
  for (const role of Object.keys(TASK_THREAD_ROLE_PACKET_FIELDS)) {
    const policy = createTaskThreadPolicy();
    policy.beforeTask({ sessionID: 'parent', callID: role, args: { subagent_type: role, prompt: fresh(role) } });
  }
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'missing', args: freshArgs({ prompt: fresh('implementer', { orchestrationId: undefined }) }) }), /role packet|invalid orchestrationId/);
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'extra', args: freshArgs({ prompt: fresh('implementer', { ambiguousExtra: 'no' }) }) }), /role packet/);
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'routing', args: freshArgs({ prompt: fresh('implementer', { routingMetadataStatus: 'invented' }) }) }), /routingMetadataStatus/);
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'mode', args: freshArgs({ prompt: fresh('implementer', { taskMode: 'review' }) }) }), /taskMode/);
  createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'external-roots', args: freshArgs({ prompt: fresh('implementer', { workspaceRoot: '/workspace', runtimeRoot: '/runtime', traceRoot: '/trace' }) }) });
});

test('fresh dispatch requires a valid envelope and omission of task_id', () => {
  const policy = createTaskThreadPolicy();
  policy.beforeTask({ sessionID: 'parent-1', callID: 'call-1', args: freshArgs() });
  assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: 'call-2', args: freshArgs({ task_id: null }) }), /invalid task_id/);
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'p', callID: 'c', args: freshArgs({ prompt: 'plain prompt' }) }), /malformed policy envelope/);
});

test('only one exact completed Task wrapper authorizes clarification', () => {
  for (const output of [
    request(),
    `incidental ${wrapped(request())}`,
    `${wrapped(request())}\n${wrapped(request())}`,
    `<task id="child-1" state="completed"><task_result>${request()}</task_result></task>`,
    formatTaskResultWrapper(request(), 'wrong-child'),
    formatTaskResultWrapper(request(), 'child-1', 'running'),
  ]) {
    const policy = createTaskThreadPolicy();
    policy.beforeTask({ sessionID: 'parent-1', callID: 'call-1', args: freshArgs() });
    policy.afterTask({ callID: 'call-1', output, metadata: { sessionId: 'child-1' } });
    assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: 'next', args: { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' } }), /not authorized/);
  }
  const policy = createTaskThreadPolicy();
  authorize(policy);
  policy.beforeTask({ sessionID: 'parent-1', callID: 'next', args: { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' } });
});

test('ordinary results, restart, and unauthorized reuse fail closed', () => {
  const policy = createTaskThreadPolicy();
  policy.beforeTask({ sessionID: 'parent-1', callID: 'call-1', args: freshArgs() });
  policy.afterTask({ callID: 'call-1', output: wrapped('completed'), metadata: { sessionId: 'child-1' } });
  assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: 'call-2', args: { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' } }), /not authorized/);
  assert.throws(() => createTaskThreadPolicy().beforeTask({ sessionID: 'parent-1', callID: 'call-3', args: { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' } }), /not authorized/);
});

test('one matching response is atomic and old nonces cannot return in later turns', () => {
  const policy = createTaskThreadPolicy();
  authorize(policy);
  const args = { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' };
  policy.beforeTask({ sessionID: 'parent-1', callID: 'call-2', args });
  assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: 'call-3', args }), /not authorized/);
  policy.afterTask({ callID: 'call-2', output: wrapped(request({ requestNonce: 'nonce-2' })), metadata: { sessionId: 'child-1' } });
  policy.beforeTask({ sessionID: 'parent-1', callID: 'call-4', args: { ...args, prompt: response({ requestNonce: 'nonce-2' }) } });
  policy.afterTask({ callID: 'call-4', output: wrapped(request({ requestNonce: 'nonce-1' })), metadata: { sessionId: 'child-1' } });
  assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: 'replay', args }), /not authorized/);
});

test('wrong parent, child, role, task, and nonce cannot use authorization', () => {
  for (const mutate of [
    (entry) => { entry.sessionID = 'wrong-parent'; },
    (entry) => { entry.args.task_id = 'wrong-child'; },
    (entry) => { entry.args.subagent_type = 'validator'; },
    (entry) => { entry.args.prompt = response({ delegationTaskId: 'wrong-task' }); },
    (entry) => { entry.args.prompt = response({ requestNonce: 'wrong-nonce' }); },
  ]) {
    const policy = createTaskThreadPolicy();
    authorize(policy);
    const entry = { sessionID: 'parent-1', callID: 'next', args: { subagent_type: 'implementer', prompt: response(), task_id: 'child-1' } };
    mutate(entry);
    assert.throws(() => policy.beforeTask(entry));
  }
});

test('changed task contract fields are never continuation envelopes', () => {
  const policy = createTaskThreadPolicy();
  authorize(policy);
  for (const extra of ['scopeKey', 'role', 'targetPaths', 'approvedPlan', 'remediation', 'retry', 'followUp']) {
    const parsed = { kind: 'clarification-response', version: 1, delegationTaskId: 'task-1', requestNonce: 'nonce-1', answer: 'answer', [extra]: 'changed' };
    assert.throws(() => policy.beforeTask({ sessionID: 'parent-1', callID: `call-${extra}`, args: { subagent_type: 'implementer', task_id: 'child-1', prompt: formatTaskThreadEnvelope(parsed) } }), /unexpected/);
  }
});

test('state is bounded, terminal tasks are evicted, and missing after hooks fail closed at the cap', () => {
  const policy = createTaskThreadPolicy({ limits: { calls: 2, tasks: 2, delegationIds: 3, noncesPerTask: 2 } });
  policy.beforeTask({ sessionID: 'p', callID: 'one', args: freshArgs() });
  policy.afterTask({ callID: 'one', output: wrapped('done'), metadata: { sessionId: 'child-1' } });
  assert.deepEqual(policy.stateSnapshot(), { calls: 0, tasks: 0, delegationIds: 1 });
  policy.beforeTask({ sessionID: 'p', callID: 'two', args: freshArgs({ prompt: fresh('implementer', { delegationTaskId: 'task-2' }) }) });
  policy.beforeTask({ sessionID: 'p', callID: 'three', args: freshArgs({ prompt: fresh('implementer', { delegationTaskId: 'task-3' }) }) });
  assert.throws(() => policy.beforeTask({ sessionID: 'p', callID: 'four', args: freshArgs({ prompt: fresh('implementer', { delegationTaskId: 'task-4' }) }) }), /in-flight Task limit/);
  assert.deepEqual(policy.stateSnapshot(), { calls: 2, tasks: 0, delegationIds: 3 });
});

test('malformed, extra-field, deeply nested, and oversized envelopes reject without raw telemetry', () => {
  const events = [];
  const policy = createTaskThreadPolicy({ telemetry: (event) => events.push(JSON.stringify(event)) });
  assert.throws(() => policy.beforeTask({ sessionID: 'p', callID: 'bad', args: freshArgs({ prompt: fresh('implementer', { secret: 'raw-secret' }) }) }), /role packet/);
  assert.throws(() => policy.beforeTask({ sessionID: 'p', callID: 'large', args: freshArgs({ prompt: 'x'.repeat(17000) }) }), /oversized/);
  let nested = 'value';
  for (let index = 0; index < 10; index++) nested = { nested };
  assert.throws(() => policy.beforeTask({ sessionID: 'p', callID: 'deep', args: freshArgs({ prompt: fresh('implementer', { approvedPlan: nested }) }) }), /oversized/);
  policy.beforeTask({ sessionID: 'parent', callID: 'ok', args: freshArgs({ prompt: fresh('implementer', { approvedPlan: 'raw-goal', targetPaths: ['private/raw-path'] }) }) });
  policy.afterTask({ callID: 'ok', output: wrapped('raw-output', 'child'), metadata: { sessionId: 'child' } });
  assert.doesNotMatch(events.join('\n'), /raw-goal|raw-path|raw-output|raw-secret/);
});

test('lifecycle adapter guards Task and blocks direct role commands', async () => {
  const originals = Object.fromEntries(['error', 'log', 'warn', 'info'].map((method) => [method, console[method]]));
  const consoleCalls = [];
  for (const method of Object.keys(originals)) console[method] = (...parts) => consoleCalls.push([method, ...parts]);
  const records = [];
  const tuiCalls = [];
  try {
    const hooks = await HarnessLifecyclePlugin({
      client: {
        app: { log: (record) => { records.push(record); return Promise.resolve(); } },
        tui: {
          appendPrompt: () => { tuiCalls.push('appendPrompt'); throw new Error('TUI must not be called'); },
          showToast: () => { tuiCalls.push('showToast'); throw new Error('TUI must not be called'); },
        },
      },
    });
    await hooks.event({ event: { type: 'session.created' } });
    await hooks['tool.execute.before']({ tool: 'task', sessionID: 'parent', callID: 'call' }, { args: freshArgs() });
    await hooks['tool.execute.after']({ tool: 'task', sessionID: 'parent', callID: 'call' }, { output: wrapped('raw-output-secret', 'child'), metadata: { sessionId: 'child' } });
    await hooks['tool.execute.before']({ tool: 'bash' }, { args: { command: '/delegate-orchestration raw-command-secret' } });
    await assert.rejects(() => hooks['command.execute.before']({ command: 'delegate-implement' }), /not a managed dispatch surface/);
    await assert.rejects(() => hooks['tool.execute.before']({ tool: 'bash', args: { command: 'safe' } }, { args: { command: 'rm -rf .memory' } }), /destructive deletion/);
    assert.deepEqual(consoleCalls, []);
    assert.deepEqual(tuiCalls, []);
    assert.deepEqual(records, [
      { body: { service: 'opencode-harness', level: 'debug', message: 'OpenCode harness loaded.', extra: { event: 'session-created' } } },
      { body: { service: 'opencode-harness', level: 'debug', message: 'Harness task state changed.', extra: { event: 'fresh-in-flight', delegationTaskId: 'task-1', scopeKey: 'root' } } },
      { body: { service: 'opencode-harness', level: 'debug', message: 'Harness task state changed.', extra: { event: 'terminal', delegationTaskId: 'task-1', scopeKey: 'root', reason: 'ordinary-or-invalid-result' } } },
      { body: { service: 'opencode-harness', level: 'debug', message: 'Delegation command observed.', extra: { event: 'delegation-command-observed' } } },
    ]);
    assert.doesNotMatch(JSON.stringify(records), /raw-output-secret|raw-command-secret|HARNESS_TASK_THREAD_POLICY/);
  } finally {
    for (const [method, original] of Object.entries(originals)) console[method] = original;
  }
});

test('lifecycle diagnostics contain logger failures without fallback or policy changes', async () => {
  const originals = Object.fromEntries(['error', 'log', 'warn', 'info'].map((method) => [method, console[method]]));
  const consoleCalls = [];
  for (const method of Object.keys(originals)) console[method] = (...parts) => consoleCalls.push([method, ...parts]);
  const tuiCalls = [];
  let logCalls = 0;
  try {
    const hooks = await HarnessLifecyclePlugin({
      client: {
        app: { log: () => { if (++logCalls === 1) throw new Error('logger threw'); return Promise.reject(new Error('logger rejected')); } },
        tui: {
          appendPrompt: () => { tuiCalls.push('appendPrompt'); throw new Error('TUI must not be called'); },
          showToast: () => { tuiCalls.push('showToast'); throw new Error('TUI must not be called'); },
        },
      },
    });
    await hooks.event({ event: { type: 'session.created' } });
    await hooks['tool.execute.before']({ tool: 'task', sessionID: 'parent', callID: 'call' }, { args: freshArgs() });
    await hooks['tool.execute.after']({ tool: 'task', callID: 'call' }, { output: wrapped('done', 'child'), metadata: { sessionId: 'child' } });
    await hooks['tool.execute.before']({ tool: 'bash' }, { args: { command: '/delegate-orchestration safe' } });
    await new Promise((resolve) => setImmediate(resolve));
    await assert.rejects(
      () => hooks['tool.execute.before']({ tool: 'task', sessionID: 'parent', callID: 'invalid' }, { args: freshArgs({ task_id: null }) }),
      /invalid task_id/,
    );
    assert.equal(logCalls, 4);
    assert.deepEqual(consoleCalls, []);
    assert.deepEqual(tuiCalls, []);
  } finally {
    for (const [method, original] of Object.entries(originals)) console[method] = original;
  }
});
