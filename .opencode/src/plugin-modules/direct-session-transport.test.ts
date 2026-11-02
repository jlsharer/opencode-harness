import assert from "node:assert/strict";
import test from "node:test";
import { createDirectAdmission, createDirectSessionTransport } from "./direct-session-transport.ts";
import type { DirectSessionApi, NativeMessage } from "./direct-session-transport.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function setup() {
  let time = 0;
  const abort = new AbortController();
  const caller = {
    sessionID: "parent",
    agent: "primary",
    messageID: "message",
    id: "call",
    signal: abort.signal,
  };
  const admission = createDirectAdmission({
    context: {
      orchestrationId: "run",
      delegationTaskId: "task",
      scopeKey: "unit",
      role: "implementer",
      taskMode: "implementation",
    },
    caller,
    model: { providerID: "fixture", id: "model" },
    prompt: "exact admitted prompt",
    deadline: 1000,
  });
  const events: string[] = [];
  const timers: (() => void)[] = [];
  const scheduled: number[] = [];
  const uncertain: unknown[] = [];
  let messages: NativeMessage[] = [
    { id: admission.promptID, type: "user", text: admission.prompt, time: { created: 1 } },
    {
      id: "assistant",
      type: "assistant",
      agent: "implementer",
      content: [{ type: "text", text: "terminal text" }],
      finish: "stop",
      time: { created: 1, completed: 2 },
    },
    { id: "idle", type: "idle", outcome: "succeeded", time: { created: 2 } },
  ];
  const info = {
    id: admission.childID,
    parentID: caller.sessionID,
    agent: "implementer",
    outcome: "succeeded",
    time: { idle: 2 },
  };
  const api: DirectSessionApi = {
    async create(input) {
      assert.deepEqual(input, {
        id: admission.childID,
        parentID: "parent",
        agent: "implementer",
        model: { providerID: "fixture", id: "model" },
      });
      events.push("create");
      return { ...info, time: {} };
    },
    async prompt(input) {
      assert.deepEqual(input, {
        sessionID: admission.childID,
        id: admission.promptID,
        text: admission.prompt,
        delivery: "queue",
      });
      events.push("prompt");
      return {
        id: input.id!,
        sessionID: input.sessionID,
        type: "user",
        payload: { text: input.text },
        delivery: "queue",
        time: { created: 1 },
      };
    },
    async wait(input) {
      assert.deepEqual(input, { sessionID: admission.childID });
      events.push("wait-finalizers");
    },
    async get(input) {
      assert.deepEqual(input, { sessionID: admission.childID });
      events.push("get");
      return info;
    },
    async context(input) {
      assert.deepEqual(input, { sessionID: admission.childID });
      events.push("context");
      return messages;
    },
    async interrupt(input) {
      assert.deepEqual(input, { sessionID: admission.childID, resume: false });
      events.push("interrupt");
      return { interrupted: true };
    },
  };
  const transport = createDirectSessionTransport({
    api,
    now: () => time,
    schedule: (_ms, cb) => {
      scheduled.push(_ms);
      timers.push(cb);
      return () => {};
    },
    onUncertain: (e) => {
      uncertain.push(e);
    },
    onChild: (child) => {
      assert.equal(child.id, admission.childID);
      assert.equal(child.parentID, caller.sessionID);
      events.push("child");
    },
  });
  return {
    caller,
    admission,
    api,
    transport,
    uncertain,
    events,
    abort,
    timers,
    scheduled,
    elapse: (n: number) => {
      time += n;
    },
    mutate: (f: (m: NativeMessage[]) => NativeMessage[]) => {
      messages = f(messages);
    },
  };
}

test("sealed fresh IDs, exact public calls and private one-use candidate", async () => {
  const f = setup();
  assert.match(f.admission.childID, /^ses_[0-9a-f-]{36}$/);
  assert.match(f.admission.promptID, /^msg_[0-9a-f-]{36}$/);
  assert.ok(Object.isFrozen(f.admission.context));
  const candidate = await f.transport.execute(f.admission, f.caller);
  assert.deepEqual(Object.keys(candidate), []);
  assert.deepEqual(f.events, ["create", "child", "prompt", "wait-finalizers", "get", "context"]);
  const evidence = f.transport.consumeCandidate(candidate, f.admission, f.caller);
  assert.equal(evidence.text, "terminal text");
  assert.ok(Object.isFrozen(evidence));
  assert.throws(() => f.transport.consumeCandidate(candidate, f.admission, f.caller), /candidate/);
  await assert.rejects(f.transport.execute(f.admission, f.caller));
});

for (const [label, mutate] of [
  [
    "extra user prompt",
    (m: NativeMessage[]) => [
      ...m.slice(0, 1),
      { id: "extra", type: "user", text: "steer" },
      ...m.slice(1),
    ],
  ],
  ["missing own prompt", (m: NativeMessage[]) => m.slice(1)],
  ["duplicate message", (m: NativeMessage[]) => [m[0]!, ...m]],
  [
    "wrong terminal assistant",
    (m: NativeMessage[]) => [m[0]!, m[1]!, { ...m[1]!, id: "last", finish: "length" }, m[2]!],
  ],
  [
    "switch during turn",
    (m: NativeMessage[]) => [m[0]!, { id: "switch", type: "agent-switched" }, ...m.slice(1)],
  ],
  ["failed idle", (m: NativeMessage[]) => [...m.slice(0, -1), { ...m.at(-1)!, outcome: "failed" }]],
  [
    "oversized bytes",
    (m: NativeMessage[]) => [
      m[0]!,
      { ...m[1]!, content: [{ type: "text", text: "x".repeat(1048576) }] },
      m[2]!,
    ],
  ],
  [
    "oversized count",
    (m: NativeMessage[]) => [
      m[0]!,
      ...Array.from({ length: 256 }, (_, i) => ({ ...m[1]!, id: `a${i}` })),
      m[2]!,
    ],
  ],
  [
    "oversized terminal",
    (m: NativeMessage[]) => [
      m[0]!,
      { ...m[1]!, content: [{ type: "text", text: "x".repeat(32769) }] },
      m[2]!,
    ],
  ],
] as const)
  test(label + " rejects and reports uncertain", async () => {
    const f = setup();
    f.mutate(mutate);
    await assert.rejects(f.transport.execute(f.admission, f.caller));
    assert.equal(f.uncertain.length, 1);
    assert.ok(f.events.includes("interrupt"));
  });

test("stale create and acknowledgment identities never reach terminal read", async () => {
  for (const stage of ["create", "prompt"] as const) {
    const f = setup();
    const original = f.api[stage];
    if (stage === "create")
      f.api.create = async (i) => ({
        ...(await (original as DirectSessionApi["create"])(i)),
        id: "ses_wrong",
      });
    else
      f.api.prompt = async (i) => ({
        ...(await (original as DirectSessionApi["prompt"])(i)),
        sessionID: "other",
      });
    await assert.rejects(f.transport.execute(f.admission, f.caller));
    assert.equal(f.uncertain.length, 1);
    assert.ok(!f.events.includes("context"));
  }
});
test("failed native outcome is uncertain", async () => {
  const f = setup();
  const get = f.api.get;
  f.api.get = async (i) => ({ ...(await get(i)), outcome: "failed" });
  await assert.rejects(f.transport.execute(f.admission, f.caller));
  assert.equal(f.uncertain.length, 1);
});
test("void wait includes delayed finalizers and blocks reads", async () => {
  const f = setup();
  const done = deferred<void>();
  f.api.wait = () => done.promise;
  const running = f.transport.execute(f.admission, f.caller);
  await new Promise((r) => setImmediate(r));
  assert.ok(!f.events.includes("context"));
  done.resolve();
  const candidate = await running;
  assert.equal(
    f.transport.consumeCandidate(candidate, f.admission, f.caller).text,
    "terminal text",
  );
});
test("delayed deadline timer cannot accept expired read or receipt", async () => {
  const f = setup();
  const context = f.api.context;
  f.api.context = async (i) => {
    const value = await context(i);
    f.elapse(1000);
    return value;
  };
  await assert.rejects(f.transport.execute(f.admission, f.caller));
  assert.equal(f.uncertain.length, 1);
  const g = setup();
  const candidate = await g.transport.execute(g.admission, g.caller);
  g.elapse(1000);
  assert.throws(() => g.transport.consumeCandidate(candidate, g.admission, g.caller));
  assert.equal(g.uncertain.length, 1);
});
test("pending create remains uncertain, late create is interrupted and never prompted", async () => {
  const f = setup();
  const done = deferred<Awaited<ReturnType<DirectSessionApi["create"]>>>();
  f.api.create = () => done.promise;
  const running = f.transport.execute(f.admission, f.caller);
  f.abort.abort();
  await new Promise((r) => setImmediate(r));
  f.timers.at(-1)!();
  await assert.rejects(running);
  assert.equal(f.uncertain.length, 1);
  done.resolve({ id: f.admission.childID, parentID: "parent", agent: "implementer", time: {} });
  await new Promise((r) => setImmediate(r));
  assert.ok(f.events.includes("interrupt"));
  assert.ok(!f.events.includes("prompt"));
});
test("pending prompt cancellation does not make interrupt acknowledgment idle", async () => {
  const f = setup();
  const done = deferred<Awaited<ReturnType<DirectSessionApi["prompt"]>>>();
  f.api.prompt = () => done.promise;
  const running = f.transport.execute(f.admission, f.caller);
  await new Promise((r) => setImmediate(r));
  f.abort.abort();
  await new Promise((r) => setImmediate(r));
  f.timers.at(-1)!();
  await assert.rejects(running);
  assert.equal(f.uncertain.length, 1);
  assert.ok(!f.events.includes("context"));
  done.resolve({
    id: f.admission.promptID,
    sessionID: f.admission.childID,
    type: "user",
    payload: { text: f.admission.prompt },
    delivery: "queue",
    time: { created: 1 },
  });
  await new Promise((r) => setImmediate(r));
  assert.ok(!f.events.includes("wait-finalizers"));
});
test("caller mismatch and unsealed admission cannot launch", async () => {
  const f = setup();
  await assert.rejects(f.transport.execute(f.admission, { ...f.caller, id: "different" }));
  assert.deepEqual(f.events, []);
  const g = setup();
  await assert.rejects(g.transport.execute({ ...g.admission }, g.caller));
  assert.deepEqual(g.events, []);
});
test("stop invalidates a candidate and native callback cannot extend deadline", async () => {
  const f = setup();
  const candidate = await f.transport.execute(f.admission, f.caller);
  f.transport.stop("unload");
  assert.throws(() => f.transport.consumeCandidate(candidate, f.admission, f.caller));
  assert.equal(f.uncertain.length, 1);
});
test("forged receipt stops the transport and burns any authentic candidate", async () => {
  const f = setup();
  const candidate = await f.transport.execute(f.admission, f.caller);
  assert.throws(
    () =>
      f.transport.consumeCandidate(Object.freeze({}) as typeof candidate, f.admission, f.caller),
    /candidate/,
  );
  assert.equal(f.uncertain.length, 1);
  assert.throws(() => f.transport.consumeCandidate(candidate, f.admission, f.caller), /candidate/);
});
test("pending onChild acknowledgment is accounted and deadline checked before prompt", async () => {
  const f = setup();
  const done = deferred<void>();
  const transport = createDirectSessionTransport({
    api: f.api,
    now: () => 0,
    schedule: (_ms, cb) => {
      f.timers.push(cb);
      return () => {};
    },
    onChild: () => done.promise,
    onUncertain: (reason) => {
      f.uncertain.push(reason);
    },
  });
  const running = transport.execute(f.admission, f.caller);
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(f.events, ["create"]);
  f.abort.abort();
  await new Promise((r) => setImmediate(r));
  f.timers.at(-1)!();
  await assert.rejects(running);
  done.resolve();
  await new Promise((r) => setImmediate(r));
  assert.ok(!f.events.includes("prompt"));
  assert.equal(f.uncertain.length, 1);
});
test("trusted resolved model is copied and never silently dropped", () => {
  const f = setup();
  assert.deepEqual(f.admission.model, { providerID: "fixture", id: "model" });
  assert.ok(Object.isFrozen(f.admission.model));
});

test("cancellation reconciliation observes at most 2000ms and never renews the admitted deadline", async () => {
  const f = setup();
  const done = deferred<Awaited<ReturnType<DirectSessionApi["create"]>>>();
  f.api.create = () => done.promise;
  const running = f.transport.execute(f.admission, f.caller);
  const rejected = assert.rejects(running);
  f.abort.abort();
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(f.scheduled, [1000, 2000]);
  f.timers.at(-1)!();
  await rejected;
  assert.equal(f.admission.deadline, 1000);
  assert.equal(f.uncertain.length, 1);
});
