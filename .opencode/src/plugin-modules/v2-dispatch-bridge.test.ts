import assert from "node:assert/strict";
import test from "node:test";
import {
  admitV2Subagent,
  completedV2Subagent,
  runningV2Subagent,
  v2JsonResult,
} from "./v2-dispatch-bridge.ts";
import {
  boundedApproval,
  primaryExternalApprovalRules,
  v2DispatchStatus,
  v2HarnessToolCodeMode,
  v2PermissionSource,
} from "./v2-native-plugin.ts";

test("V2 bounded actions offer project-scoped saved patterns and bind the native tool call source", () => {
  assert.deepEqual(
    v2PermissionSource({
      sessionID: "primary",
      agent: "build",
      messageID: "message",
      id: "call",
    }),
    { type: "tool", messageID: "message", id: "call" },
  );
  assert.throws(() => v2PermissionSource({ sessionID: "primary", agent: "build" }));
  const action = "harness.external-win64-build";
  const policy = {
    scriptSha256: "a".repeat(64),
    sourceSha256: "b".repeat(64),
    destinationParent: "C:\\Private",
    timeoutMs: 3600000,
  };
  const one = boundedApproval(action, "{exact first snapshot}", policy);
  const two = boundedApproval(action, "{exact second snapshot}", policy);
  assert.deepEqual(one.save, two.save);
  assert.notDeepEqual(one.resources, two.resources);
  for (const changed of [
    { ...policy, scriptSha256: "c".repeat(64) },
    { ...policy, sourceSha256: "c".repeat(64) },
    { ...policy, destinationParent: "D:\\Other" },
    { ...policy, timeoutMs: 7200000 },
  ])
    assert.notDeepEqual(boundedApproval(action, "{exact first snapshot}", changed).save, one.save);
  assert.notDeepEqual(
    boundedApproval("harness.external-win64-cases", "same", policy).save,
    one.save,
  );
  const rules = primaryExternalApprovalRules([
    { action: "*", resource: "*", effect: "allow" },
    { action, resource: "C:\\Protected\\*", effect: "deny" },
  ]);
  assert.deepEqual(rules.at(-1), { action, resource: "C:\\Protected\\*", effect: "deny" });
  assert.ok(rules.some((item) => item.action === action && item.effect === "ask"));
});

test("only the read-only status alias enters Code Mode; direct status remains available", () => {
  assert.equal(v2HarnessToolCodeMode("harness_dispatch_status_code"), true);
  for (const name of [
    "harness_dispatch_status",
    "subagent",
    "harness_verify",
    "harness_trace",
    "harness_source_edit",
    "harness_source_replace",
    "harness_recovery_status",
    "harness_recovery_resolve",
    "harness_recovery_release",
    "harness_external_win64_relaunch",
    "harness_external_artifact_download",
    "harness_external_archive_install",
    "harness_external_recovery_build",
  ]) {
    assert.equal(v2HarnessToolCodeMode(name), false, name);
  }
});

test("V2 dispatch diagnostic reports readiness only with live four-role verification", async () => {
  const checked = async () => {};
  assert.deepEqual(await v2DispatchStatus(false, false, false, null), {
    status: "activating",
    managedSubagent: false,
  });
  assert.deepEqual(await v2DispatchStatus(false, true, false, null), {
    status: "unavailable",
    managedSubagent: false,
  });
  assert.deepEqual(await v2DispatchStatus(true, false, true, checked), {
    status: "stopped",
    managedSubagent: false,
  });
  assert.deepEqual(
    await v2DispatchStatus(true, false, false, async () => {
      throw new Error("role missing");
    }),
    { status: "unavailable", managedSubagent: false },
  );
  assert.deepEqual(await v2DispatchStatus(true, false, false, checked), {
    status: "ready",
    managedSubagent: true,
    nativeTool: "subagent",
    roles: ["implementer", "planner", "researcher", "validator"],
  });
});

test("V2 admission binds the controller-selected foreground or background mode and denies foreign roles", async () => {
  const input = {
    tool: "subagent",
    sessionID: "parent",
    id: "call-1",
    input: { agent: "researcher", description: "Inspect source", prompt: "typed packet" },
  };
  let calls = 0;
  await admitV2Subagent(input, async (context, args) => {
    calls++;
    assert.deepEqual(context, { sessionID: "parent", callID: "call-1" });
    assert.equal(args.subagent_type, "researcher");
    assert.equal(Object.hasOwn(args, "task_id"), false);
    args.background = false;
    args.prompt = "bounded expanded packet";
  });
  assert.equal(input.input.prompt, "bounded expanded packet");
  assert.equal(calls, 1);
  const background = { ...input, input: { ...input.input, background: true } };
  await admitV2Subagent(background, async (_context, args) => {
    calls++;
    assert.equal(args.background, true);
  });
  assert.equal(background.input.background, true);
  await assert.rejects(
    admitV2Subagent({ ...input, input: { ...input.input, agent: "general" } }, async () => {
      calls++;
    }),
    /contract/,
  );
  assert.equal(calls, 2);
});

test("V2 admission forwards each harness role to the guard and propagates refusal", async () => {
  for (const role of ["researcher", "planner", "implementer", "validator"]) {
    const input = {
      tool: "subagent",
      sessionID: "parent",
      id: `call-${role}`,
      input: { agent: role, description: "Scoped task", prompt: "typed packet" },
    };
    await admitV2Subagent(input, async (context, args) => {
      assert.equal(context.callID, `call-${role}`);
      assert.equal(args.subagent_type, role);
      assert.equal(Object.hasOwn(args, "task_id"), false);
      args.background = false;
    });
    assert.equal((input.input as Record<string, unknown>).background, false);
  }
  const rejected = {
    tool: "subagent",
    sessionID: "parent",
    id: "refused",
    input: { agent: "researcher", description: "Scoped task", prompt: "untyped" },
  };
  await assert.rejects(
    admitV2Subagent(rejected, async () => {
      throw new Error("guard refused packet");
    }),
    /guard refused packet/,
  );
});

test("V2 continuation maps sessionID only under the bound policy and fails without foreground proof", async () => {
  const input = {
    tool: "subagent",
    sessionID: "parent",
    id: "call-2",
    input: {
      agent: "validator",
      description: "Answer question",
      prompt: "clarification",
      sessionID: "child",
    },
  };
  await admitV2Subagent(input, async (_context, args) => {
    assert.equal(args.task_id, "child");
    args.background = false;
  });
  assert.equal(input.input.sessionID, "child");
  await assert.rejects(
    admitV2Subagent({ ...input, input: { ...input.input, background: undefined } }, async () => {}),
    /execution mode/,
  );
});

test("V2 running acknowledgement binds child, native metadata, and Job generation", () => {
  const text = "The subagent is working in the background.";
  const event = {
    tool: "subagent",
    sessionID: "parent",
    id: "call-3",
    input: { agent: "researcher", background: true },
    status: "completed",
    result: {
      output: { sessionID: "child", status: "running", output: text },
      metadata: { sessionID: "child", status: "running" },
      content: text,
    },
  };
  const child = {
    id: "child",
    parentID: "parent",
    model: { providerID: "fixture", id: "worker" },
  };
  const checked = runningV2Subagent(event, child, 123);
  assert.deepEqual(checked.output.metadata, {
    sessionId: "child",
    jobId: "child",
    background: true,
    jobStartedAt: 123,
    model: { providerID: "fixture", modelID: "worker" },
  });
  assert.deepEqual(
    runningV2Subagent(
      { ...event, result: { ...event.result, content: [{ type: "text", text }] } },
      child,
      123,
    ),
    checked,
  );
  assert.throws(() => runningV2Subagent(event, { ...child, parentID: "foreign" }, 123), /identity/);
  assert.throws(() => runningV2Subagent(event, child, 0), /identity/);
  assert.throws(
    () =>
      runningV2Subagent(
        { ...event, result: { ...event.result, content: [{ type: "text", text: "forged" }] } },
        child,
        123,
      ),
    /identity/,
  );
});

test("V2 native completion must bind wrapper, metadata and actual child's parent", () => {
  const text = '{"version":1,"outcome":"success"}';
  const event = {
    tool: "subagent",
    sessionID: "parent",
    id: "call-1",
    input: { agent: "researcher", prompt: "typed packet" },
    status: "completed",
    result: {
      output: { sessionID: "child", status: "completed", output: text },
      metadata: { sessionID: "child", status: "completed" },
      content: `<subagent sessionID="child" state="completed">\n${text}\n</subagent>`,
    },
  };
  const checked = completedV2Subagent(event, { id: "child", parentID: "parent" });
  assert.deepEqual(checked.input, { sessionID: "parent", callID: "call-1" });
  assert.match(checked.output.output, /<task id="child" state="completed">/);
  assert.deepEqual(
    completedV2Subagent(
      {
        ...event,
        result: { ...event.result, content: [{ type: "text", text: event.result.content }] },
      },
      { id: "child", parentID: "parent" },
    ),
    checked,
  );
  assert.throws(
    () =>
      completedV2Subagent(
        { ...event, result: { ...event.result, content: "forged" } },
        { id: "child", parentID: "parent" },
      ),
    /wrapper/,
  );
  assert.throws(() => completedV2Subagent(event, { id: "child", parentID: "other" }), /identity/);
  assert.throws(
    () =>
      completedV2Subagent(
        {
          ...event,
          result: { ...event.result, metadata: { sessionID: "other", status: "completed" } },
        },
        { id: "child", parentID: "parent" },
      ),
    /identity/,
  );
  assert.throws(
    () =>
      completedV2Subagent(
        { ...event, result: { ...event.result, content: [{ type: "text", text: "forged" }] } },
        { id: "child", parentID: "parent" },
      ),
    /wrapper/,
  );
  assert.throws(
    () => completedV2Subagent({ ...event, status: "running" }, { id: "child", parentID: "parent" }),
    /did not complete/,
  );
});

test("V2 accepts only an exact sole JSON display fence before typed parsing", () => {
  const json = '{"version":1,"outcome":"success"}';
  assert.equal(v2JsonResult(json), json);
  assert.equal(v2JsonResult(`\`\`\`json\n${json}\n\`\`\``), json);
  assert.equal(
    v2JsonResult(`prefix\n\`\`\`json\n${json}\n\`\`\``),
    `prefix\n\`\`\`json\n${json}\n\`\`\``,
  );
  assert.equal(
    v2JsonResult(`\`\`\`json\n${json}\n\`\`\`\nmore`),
    `\`\`\`json\n${json}\n\`\`\`\nmore`,
  );
  assert.throws(() => v2JsonResult("\`\`\`json\n{bad}\n\`\`\`"), SyntaxError);
  assert.throws(() => v2JsonResult("x".repeat(32769)), /exceeds bound/);
});
