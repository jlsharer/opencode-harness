import assert from "node:assert/strict";
import test from "node:test";
import { createDirectAdmission, createDirectSessionTransport } from "./direct-session-transport.ts";
import type {
  DirectSessionApi,
  DirectAttemptHandle,
  DirectTransportOptions,
  NativeMessage,
} from "./direct-session-transport.ts";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

function setup(uncertainHook?: DirectTransportOptions["onUncertain"]) {
  let time = 0;
  let observation = 0;
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
  let childAcknowledgment: Promise<void> | undefined;
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
    observationNow: () => observation,
    schedule: (_ms, cb) => {
      scheduled.push(_ms);
      timers.push(cb);
      return () => {};
    },
    onUncertain: (e, detail) => {
      uncertain.push(e);
      uncertainHook?.(e, detail);
    },
    onChild: (child) => {
      assert.equal(child.id, admission.childID);
      assert.equal(child.parentID, caller.sessionID);
      events.push("child");
      return childAcknowledgment;
    },
  });
  return {
    holdChild: (promise: Promise<void>) => {
      childAcknowledgment = promise;
    },
    caller,
    admission,
    api,
    transport,
    uncertain,
    events,
    abort,
    timers,
    scheduled,
    observe: (n: number) => {
      observation += n;
    },
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

const tick = () => new Promise<void>((resolve) => setImmediate(resolve));

test("direct recovery repeated stop never repeats initial interrupt", async () => {
  const f = setup();
  const waiting = deferred<void>();
  f.api.wait = () => waiting.promise;
  const running = f.transport.execute(f.admission, f.caller);
  const rejected = assert.rejects(running);
  await tick();
  f.abort.abort();
  f.transport.stop("independent fault");
  await tick();
  assert.equal(f.events.filter((e) => e === "interrupt").length, 1);
  waiting.resolve();
  await rejected;
});

async function stoppedPrompt() {
  const f = setup();
  const prompt = deferred<Awaited<ReturnType<DirectSessionApi["prompt"]>>>();
  const original = f.api.prompt;
  f.api.prompt = () => prompt.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running, (e) => e === f.transport.stoppedError(handle));
  await tick();
  f.abort.abort();
  await tick();
  return { ...f, handle, rejected, prompt, original };
}

test("direct recovery pending prompt blocks idle proof", async () => {
  const f = await stoppedPrompt();
  assert.equal(f.transport.inspectSettlement(f.handle).pending.prompt, 1);
  await assert.rejects(f.transport.reconcileStopped(f.handle));
  f.timers.at(-1)!();
  await f.rejected;
  f.prompt.resolve(
    await f.original({
      sessionID: f.admission.childID,
      id: f.admission.promptID,
      text: f.admission.prompt,
      delivery: "queue",
    }),
  );
  await tick();
});

test("direct recovery late wake precedes fresh termination", async () => {
  const f = await stoppedPrompt();
  f.prompt.resolve(
    await f.original({
      sessionID: f.admission.childID,
      id: f.admission.promptID,
      text: f.admission.prompt,
      delivery: "queue",
    }),
  );
  await f.rejected;
  await tick();
  const cause = f.transport.stopCause(f.handle)!;
  assert.ok(f.transport.isStopCause(f.handle, cause));
  assert.equal(f.transport.isStopCause(f.handle, { ...cause }), false);
  f.transport.stop(f.handle, cause);
  const receipt = await f.transport.reconcileStopped(f.handle);
  assert.deepEqual(f.events.slice(-4), ["interrupt", "wait-finalizers", "get", "context"]);
  f.transport.assertTermination(receipt, f.handle);
  assert.throws(() => f.transport.assertTermination({ ...receipt }, f.handle));
  const next = await f.transport.reconcileStopped(f.handle);
  assert.throws(() => f.transport.assertTermination(receipt, f.handle));
  f.transport.assertSameTermination(receipt, next, f.handle);
  f.transport.consumeTermination(next, f.handle);
  assert.throws(() => f.transport.consumeTermination(next, f.handle));
});

test("direct recovery deadline is never renewed", async () => {
  const f = await stoppedPrompt();
  assert.equal(f.admission.deadline, 1000);
  assert.equal(f.scheduled.includes(2000), true);
  f.timers.at(-1)!();
  await f.rejected;
});

test("direct recovery synchronous reentry sees invoking operation and thrown rejection", async () => {
  const f = setup();
  const handle = f.transport.prepare(f.admission, f.caller);
  f.api.create = () => {
    assert.equal(f.transport.inspectSettlement(handle).pending.create, 1);
    throw new Error("native failure");
  };
  await assert.rejects(f.transport.execute(handle));
  assert.equal(f.transport.inspectSettlement(handle).pending.create, 0);
  assert.ok(f.transport.inspectSettlement(handle).disqualifiers.length);
  await assert.rejects(f.transport.reconcileStopped(handle));
});

test("direct recovery observation timeout retains operation until actual settlement", async () => {
  const f = await stoppedPrompt();
  f.prompt.resolve(
    await f.original({
      sessionID: f.admission.childID,
      id: f.admission.promptID,
      text: f.admission.prompt,
      delivery: "queue",
    }),
  );
  await f.rejected;
  await tick();
  const pending = deferred<void>();
  f.api.wait = () => pending.promise;
  const observing = f.transport.reconcileStopped(f.handle);
  const rejected = assert.rejects(observing);
  await tick();
  f.observe(2000);
  f.timers.at(-1)!();
  await rejected;
  assert.equal(f.transport.inspectSettlement(f.handle).pending.wait, 1);
  await assert.rejects(f.transport.reconcileStopped(f.handle));
  pending.resolve();
  await tick();
  assert.equal(f.events.includes("get"), false);
  f.api.wait = async () => {};
  const receipt = await f.transport.reconcileStopped(f.handle);
  f.transport.assertTermination(receipt, f.handle);
});

async function drainPrompt(f: Awaited<ReturnType<typeof stoppedPrompt>>) {
  f.prompt.resolve(
    await f.original({
      sessionID: f.admission.childID,
      id: f.admission.promptID,
      text: f.admission.prompt,
      delivery: "queue",
    }),
  );
  await f.rejected;
  await tick();
}

for (const stage of ["create", "wait", "get", "context", "child-acknowledgment"] as const)
  test("direct recovery pending original " + stage + " blocks despite idle", async () => {
    const f = setup();
    const done = deferred<unknown>();
    const original = stage === "child-acknowledgment" ? undefined : f.api[stage];
    if (stage === "child-acknowledgment") f.holdChild(done.promise as Promise<void>);
    else (f.api[stage] as unknown) = () => done.promise;
    const handle = f.transport.prepare(f.admission, f.caller);
    const running = f.transport.execute(handle);
    const rejected = assert.rejects(running);
    await tick();
    f.abort.abort();
    await tick();
    f.timers.at(-1)!();
    await rejected;
    assert.equal(f.transport.inspectSettlement(handle).pending[stage], 1);
    await assert.rejects(f.transport.reconcileStopped(handle));
    done.resolve(
      stage === "create"
        ? { id: f.admission.childID, parentID: "parent", agent: "implementer", time: {} }
        : original
          ? await (original as (input: { sessionID: string }) => Promise<unknown>)({
              sessionID: f.admission.childID,
            })
          : undefined,
    );
    await tick();
    assert.equal(f.transport.inspectSettlement(handle).pending[stage], 0);
  });

test("direct recovery late create validates identity and retains its late interrupt", async () => {
  const f = setup();
  const child = deferred<Awaited<ReturnType<DirectSessionApi["create"]>>>();
  const interrupts = [deferred<{ interrupted: boolean }>(), deferred<{ interrupted: boolean }>()];
  let count = 0;
  f.api.create = () => child.promise;
  f.api.interrupt = () => interrupts[count++]!.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running);
  f.abort.abort();
  await tick();
  f.timers.at(-1)!();
  await rejected;
  child.resolve({ id: f.admission.childID, parentID: "parent", agent: "implementer", time: {} });
  await tick();
  assert.equal(count, 2);
  assert.equal(f.transport.inspectSettlement(handle).pending.create, 1);
  assert.equal(f.transport.inspectSettlement(handle).pending.interrupt, 2);
  f.transport.stop(handle, f.transport.stopCause(handle)!);
  assert.equal(count, 2);
  interrupts[0]!.resolve({ interrupted: false });
  interrupts[1]!.resolve({ interrupted: true });
  await tick();
  assert.equal(f.transport.inspectSettlement(handle).pending.create, 0);
  assert.equal(f.transport.inspectSettlement(handle).pending.interrupt, 0);
  assert.equal(f.events.includes("prompt"), false);
  await assert.rejects(f.transport.reconcileStopped(handle));
});

test("direct recovery late malformed create and prompt remain ineligible", async () => {
  for (const stage of ["create", "prompt"] as const) {
    const f = setup();
    const done = deferred<unknown>();
    (f.api[stage] as unknown) = () => done.promise;
    const handle = f.transport.prepare(f.admission, f.caller);
    const running = f.transport.execute(handle);
    const rejected = assert.rejects(running);
    await tick();
    f.abort.abort();
    await tick();
    f.timers.at(-1)!();
    await rejected;
    done.resolve({ id: "wrong", parentID: "parent", agent: "implementer", time: {} });
    await tick();
    assert.ok(f.transport.inspectSettlement(handle).disqualifiers.length);
    await assert.rejects(f.transport.reconcileStopped(handle));
  }
});

for (const outcome of ["succeeded", "failed", "interrupted"] as const)
  test("direct recovery terminal " + outcome + " is termination only", async () => {
    const f = await stoppedPrompt();
    await drainPrompt(f);
    const get = f.api.get;
    f.api.get = async (input) => ({ ...(await get(input)), outcome });
    f.mutate((messages) => [messages[0]!, { ...messages.at(-1)!, outcome }]);
    // Even succeeded is not success acceptance: recovery never parses/consumes a result.
    f.api.interrupt = async () => ({ interrupted: false });
    const receipt = await f.transport.reconcileStopped(f.handle);
    f.transport.assertTermination(receipt, f.handle);
    assert.equal(f.transport.inspectSettlement(f.handle).phase, "termination-proved");
    await assert.rejects(f.transport.execute(f.admission, f.caller));
  });

for (const [label, mutate] of [
  ["absent prompt", (m: NativeMessage[]) => m.slice(1)],
  [
    "foreign user",
    (m: NativeMessage[]) => [m[0]!, { id: "foreign", type: "user", text: "other" }, ...m.slice(1)],
  ],
  ["duplicate id", (m: NativeMessage[]) => [m[0]!, { ...m[1]!, id: m[0]!.id }, m[2]!]],
  ["empty id", (m: NativeMessage[]) => [m[0]!, { ...m[1]!, id: "" }, m[2]!]],
  ["foreign assistant", (m: NativeMessage[]) => [m[0]!, { ...m[1]!, agent: "validator" }, m[2]!]],
  [
    "incomplete assistant",
    (m: NativeMessage[]) => [m[0]!, { ...m[1]!, time: { created: 1 } }, m[2]!],
  ],
  [
    "intervening switch",
    (m: NativeMessage[]) => [m[0]!, { id: "switch", type: "agent-switched" }, ...m.slice(1)],
  ],
  [
    "idle outcome mismatch",
    (m: NativeMessage[]) => [...m.slice(0, -1), { ...m.at(-1)!, outcome: "failed" }],
  ],
  [
    "oversized bytes",
    (m: NativeMessage[]) => [m[0]!, { ...m[1]!, text: "x".repeat(1048576) }, m[2]!],
  ],
  [
    "oversized count",
    (m: NativeMessage[]) => [
      ...m,
      ...Array.from({ length: 256 }, (_, i) => ({ id: "more" + i, type: "idle" })),
    ],
  ],
] as const)
  test("direct recovery refuses " + label, async () => {
    const f = await stoppedPrompt();
    await drainPrompt(f);
    f.mutate(mutate);
    await assert.rejects(f.transport.reconcileStopped(f.handle));
    assert.ok(f.transport.inspectSettlement(f.handle).disqualifiers.length);
  });

for (const field of ["id", "parentID", "agent"] as const)
  test("direct recovery refuses wrong final " + field, async () => {
    const f = await stoppedPrompt();
    await drainPrompt(f);
    const get = f.api.get;
    f.api.get = async (input) => ({ ...(await get(input)), [field]: "wrong" });
    await assert.rejects(f.transport.reconcileStopped(f.handle));
  });

test("direct recovery private handle and stop bindings cannot be copied", async () => {
  const f = await stoppedPrompt();
  f.transport.assertBinding(f.handle, f.admission, f.caller);
  assert.throws(() =>
    f.transport.assertBinding({ ...f.handle } as DirectAttemptHandle, f.admission, f.caller),
  );
  assert.throws(() => f.transport.assertBinding(f.handle, { ...f.admission }, f.caller));
  assert.throws(() =>
    f.transport.assertBinding(f.handle, f.admission, {
      ...f.caller,
      signal: new AbortController().signal,
    }),
  );
  assert.equal(f.transport.isStopCause(f.handle, new Error("caller-cancelled")), false);
  await drainPrompt(f);
  assert.throws(() => f.transport.stop(f.handle, { ...f.transport.stopCause(f.handle)! }));
  await assert.rejects(f.transport.reconcileStopped(f.handle));
});

test("direct recovery exact deadline token and signal cancellation remain distinct", async () => {
  const f = setup();
  const pending = deferred<void>();
  f.api.wait = () => pending.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running);
  await tick();
  f.elapse(1000);
  f.timers[0]!();
  pending.resolve();
  await rejected;
  assert.equal(f.transport.stopCause(handle)!.code, "deadline-expired");
  const receipt = await f.transport.reconcileStopped(handle);
  f.transport.assertTermination(receipt, handle);
  assert.equal(f.admission.deadline, 1000);
});

test("direct recovery concurrent observation and reentrant authority changes cannot authorize", async () => {
  const f = await stoppedPrompt();
  await drainPrompt(f);
  const waiting = deferred<void>();
  f.api.wait = () => waiting.promise;
  const first = f.transport.reconcileStopped(f.handle);
  await tick();
  await assert.rejects(f.transport.reconcileStopped(f.handle));
  waiting.resolve();
  const receipt = await first;
  f.transport.assertTermination(receipt, f.handle);
  await assert.rejects(
    f.transport.reconcileStopped(f.handle, () => {
      f.transport.stop("authority changed");
    }),
  );
  assert.throws(() => f.transport.assertTermination(receipt, f.handle));
});

test("direct recovery late observation acknowledgment is validated after timeout", async () => {
  const f = await stoppedPrompt();
  await drainPrompt(f);
  const pending = deferred<{ interrupted: boolean }>();
  f.api.interrupt = () => pending.promise;
  const observing = f.transport.reconcileStopped(f.handle);
  const rejected = assert.rejects(observing);
  await tick();
  f.observe(2000);
  f.timers.at(-1)!();
  await rejected;
  pending.resolve({ interrupted: "invalid" } as unknown as { interrupted: boolean });
  await tick();
  assert.ok(f.transport.inspectSettlement(f.handle).disqualifiers.length);
});

for (const stage of ["get", "context"] as const)
  test("direct recovery late observation malformed " + stage + " is sticky", async () => {
    const f = await stoppedPrompt();
    await drainPrompt(f);
    const pending = deferred<unknown>();
    (f.api[stage] as unknown) = () => pending.promise;
    const observing = f.transport.reconcileStopped(f.handle);
    const rejected = assert.rejects(observing);
    await tick();
    f.observe(2000);
    f.timers.at(-1)!();
    await rejected;
    pending.resolve(
      stage === "get"
        ? {
            id: "wrong",
            agent: "implementer",
            parentID: "parent",
            time: { idle: 1 },
            outcome: "succeeded",
          }
        : [],
    );
    await tick();
    assert.ok(f.transport.inspectSettlement(f.handle).disqualifiers.length);
  });

test("direct recovery manager deadline observation uses the immutable admitted clock", async () => {
  const f = setup();
  const pending = deferred<void>();
  f.api.wait = () => pending.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running);
  await tick();
  assert.equal(f.transport.stopCause(handle), undefined);
  f.elapse(1000);
  assert.equal(f.transport.stopCause(handle), undefined);
  const cause = f.transport.observeStopCause(handle);
  assert.equal(cause?.code, "deadline-expired");
  f.transport.stop(handle, cause!);
  pending.resolve();
  await rejected;
  const receipt = await f.transport.reconcileStopped(handle);
  assert.throws(() => f.transport.assertSameTermination(receipt, receipt, handle));
  f.transport.assertTermination(receipt, handle);
});

test("direct recovery independent fault at observation deadline stays disqualifying", async () => {
  const f = await stoppedPrompt();
  await drainPrompt(f);
  await assert.rejects(
    f.transport.reconcileStopped(f.handle, () => {
      f.observe(2000);
      throw new Error("authority fault");
    }),
  );
  assert.ok(f.transport.inspectSettlement(f.handle).disqualifiers.length);
});

test("direct recovery final authority callback cannot extend observation budget", async () => {
  const f = await stoppedPrompt();
  await drainPrompt(f);
  let calls = 0;
  await assert.rejects(
    f.transport.reconcileStopped(f.handle, () => {
      if (++calls === 14) f.observe(2000);
    }),
  );
  assert.equal(calls, 14);
});

test("direct recovery stop publication precedes callback reentry and reporting failure sticks", async () => {
  let f!: ReturnType<typeof setup>;
  let reentrant: Promise<unknown> | undefined;
  f = setup((_reason, detail) => {
    assert.ok(detail);
    assert.equal(f.transport.inspectSettlement(detail.handle).phase, "stopped");
    assert.equal(f.transport.inspectSettlement(detail.handle).executionSettled, false);
    reentrant = assert.rejects(f.transport.reconcileStopped(detail.handle));
    throw new Error("reporting failure");
  });
  const pending = deferred<void>();
  f.api.wait = () => pending.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running);
  await tick();
  f.abort.abort();
  pending.resolve();
  await rejected;
  await reentrant;
  assert.ok(f.transport.inspectSettlement(handle).disqualifiers.includes("stop-reporting-failed"));
  await assert.rejects(f.transport.reconcileStopped(handle));
});

test("direct recovery native promise reactions cannot substitute for exposed execution settlement", async () => {
  const f = setup();
  const done = deferred<NativeMessage[]>();
  const context = f.api.context;
  let reentrant: Promise<unknown> | undefined;
  const handle = f.transport.prepare(f.admission, f.caller);
  void done.promise.then(() => {
    f.abort.abort();
    assert.equal(f.transport.inspectSettlement(handle).executionSettled, false);
    reentrant = assert.rejects(f.transport.reconcileStopped(handle));
  });
  f.api.context = () => done.promise;
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running, (e) => e === f.transport.stoppedError(handle));
  await tick();
  done.resolve([...(await context({ sessionID: f.admission.childID }))]);
  await rejected;
  await reentrant;
  assert.equal(f.transport.inspectSettlement(handle).executionSettled, true);
  const receipt = await f.transport.reconcileStopped(handle);
  f.transport.assertTermination(receipt, handle);
});

test("direct recovery staged candidates cannot be consumed after an exact typed stop", async () => {
  const f = setup();
  const handle = f.transport.prepare(f.admission, f.caller);
  const candidate = await f.transport.execute(handle);
  f.abort.abort();
  assert.equal(f.transport.stopCause(handle)!.code, "caller-cancelled");
  assert.throws(() => f.transport.consumeCandidate(candidate, f.admission, f.caller));
  assert.ok(f.transport.inspectSettlement(handle).disqualifiers.length);
});

test("direct recovery later native rejection is sticky after allowed stop", async () => {
  const f = await stoppedPrompt();
  await drainPrompt(f);
  f.api.wait = () => Promise.reject(new Error("native later fault"));
  await assert.rejects(f.transport.reconcileStopped(f.handle));
  assert.ok(
    f.transport.inspectSettlement(f.handle).disqualifiers.includes("native-operation-rejected"),
  );
  f.api.wait = async () => {};
  await assert.rejects(f.transport.reconcileStopped(f.handle));
});

test("direct recovery explicit stop observer reentry is idempotent and never upgrades faults", async () => {
  let f!: ReturnType<typeof setup>;
  let count = 0;
  f = setup((_reason, detail) => {
    assert.ok(detail?.cause);
    count++;
    f.transport.assertBinding(detail.handle, f.admission, f.caller);
    assert.equal(f.transport.observeStopCause(detail.handle), detail.cause);
    f.transport.stop(detail.handle, detail.cause);
  });
  const done = deferred<void>();
  f.api.wait = () => done.promise;
  const handle = f.transport.prepare(f.admission, f.caller);
  const running = f.transport.execute(handle);
  const rejected = assert.rejects(running);
  await tick();
  f.elapse(1000);
  const cause = f.transport.observeStopCause(handle);
  assert.equal(cause?.code, "deadline-expired");
  assert.equal(count, 1);
  assert.equal(f.events.filter((e) => e === "interrupt").length, 1);
  done.resolve();
  await rejected;
  const g = setup();
  const other = g.transport.prepare(g.admission, g.caller);
  g.transport.stop("unclassified");
  g.elapse(1000);
  g.abort.abort();
  assert.equal(g.transport.observeStopCause(other), undefined);
});
