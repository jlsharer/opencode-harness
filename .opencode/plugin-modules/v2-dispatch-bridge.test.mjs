import assert from "node:assert/strict";
import test from "node:test";
import { admitV2Subagent, completedV2Subagent, runningV2Subagent, v2JsonResult, } from "./v2-dispatch-bridge.js";
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
    await assert.rejects(admitV2Subagent({ ...input, input: { ...input.input, agent: "general" } }, async () => {
        calls++;
    }), /contract/);
    assert.equal(calls, 2);
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
    await assert.rejects(admitV2Subagent({ ...input, input: { ...input.input, background: undefined } }, async () => { }), /execution mode/);
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
            content: [{ type: "text", text }],
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
    assert.throws(() => runningV2Subagent(event, { ...child, parentID: "foreign" }, 123), /identity/);
    assert.throws(() => runningV2Subagent(event, child, 0), /identity/);
    assert.throws(() => runningV2Subagent({ ...event, result: { ...event.result, content: [{ type: "text", text: "forged" }] } }, child, 123), /identity/);
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
            content: [
                {
                    type: "text",
                    text: `<subagent sessionID="child" state="completed">\n${text}\n</subagent>`,
                },
            ],
        },
    };
    const checked = completedV2Subagent(event, { id: "child", parentID: "parent" });
    assert.deepEqual(checked.input, { sessionID: "parent", callID: "call-1" });
    assert.match(checked.output.output, /<task id="child" state="completed">/);
    assert.throws(() => completedV2Subagent(event, { id: "child", parentID: "other" }), /identity/);
    assert.throws(() => completedV2Subagent({
        ...event,
        result: { ...event.result, metadata: { sessionID: "other", status: "completed" } },
    }, { id: "child", parentID: "parent" }), /identity/);
    assert.throws(() => completedV2Subagent({ ...event, result: { ...event.result, content: [{ type: "text", text: "forged" }] } }, { id: "child", parentID: "parent" }), /wrapper/);
    assert.throws(() => completedV2Subagent({ ...event, status: "running" }, { id: "child", parentID: "parent" }), /did not complete/);
});
test("V2 accepts only an exact sole JSON display fence before typed parsing", () => {
    const json = '{"version":1,"outcome":"success"}';
    assert.equal(v2JsonResult(json), json);
    assert.equal(v2JsonResult(`\`\`\`json\n${json}\n\`\`\``), json);
    assert.equal(v2JsonResult(`prefix\n\`\`\`json\n${json}\n\`\`\``), `prefix\n\`\`\`json\n${json}\n\`\`\``);
    assert.equal(v2JsonResult(`\`\`\`json\n${json}\n\`\`\`\nmore`), `\`\`\`json\n${json}\n\`\`\`\nmore`);
    assert.throws(() => v2JsonResult("\`\`\`json\n{bad}\n\`\`\`"), SyntaxError);
    assert.throws(() => v2JsonResult("x".repeat(32769)), /exceeds bound/);
});
