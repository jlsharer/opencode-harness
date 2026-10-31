import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildTaskContractExamples,
  renderTaskContractExamples,
} from "./render-task-contract-examples.mts";
import {
  TASK_MODES,
  validateTaskPacket,
  validateTaskResult,
} from "../src/plugin-modules/task-contracts.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const references = path.join(root, ".opencode/skills/delegation-orchestrator/references");

test("development policy decision matrix projects the approved boundaries (not runtime enforcement)", () => {
  const guide = readFileSync(path.join(references, "development-workflow.md"), "utf8");
  const rows = new Map(
    [...guide.matchAll(/^\| ([a-z][a-z-]+) \| ([^\n]+) \|$/gm)].map((row) => [row[1], row[2]!]),
  );
  const scenarios: [string, RegExp][] = [
    ["small-deliverable", /implementer\/implementation.*validator\/review/],
    ["combined-review", /requirements.*quality.*exact gates/],
    ["review-success", /assigned gates.*required/],
    ["later-writer", /invalidate.*proof.*different paths/],
    ["legacy-qa", /before admission.*external QA.*never.*managed gate/],
    ["global-permissions", /foreground.*no background.*no legacy recovery/],
    ["unbounded", /deadlines.*capacity.*fresh.*independent/],
    ["owner-round", /finite.*manual verdict.*separate/],
    ["unknown-termination", /Retain.*evidence.*no terminal retry/],
  ];
  assert.equal(rows.size, scenarios.length);
  for (const [scenario, decision] of scenarios)
    assert.match(rows.get(scenario) ?? "", decision, scenario);
  const link = guide.match(/\[task\/result examples\]\(([^)]+)\)/);
  assert.ok(link);
  assert.equal(
    readFileSync(path.resolve(references, link[1]!), "utf8"),
    renderTaskContractExamples(),
  );
});

test("distributed example JSON uses executable validators and the exact existing role/mode surface", () => {
  assert.deepEqual(readdirSync(path.join(root, ".opencode/agents")).sort(), [
    "implementer.md",
    "planner.md",
    "researcher.md",
    "validator.md",
  ]);
  assert.deepEqual(TASK_MODES, {
    researcher: ["research"],
    planner: ["plan", "synthesis"],
    implementer: ["implementation", "integration"],
    validator: ["validation", "review", "artifact-proof", "integration-check"],
  });
  const examples = buildTaskContractExamples();
  for (const example of examples) {
    assert.doesNotThrow(() => validateTaskPacket(example.context.role, example.packet));
    assert.doesNotThrow(() => validateTaskResult(example.result, example.context));
  }
  const markdown = readFileSync(path.join(references, "task-contract-examples.md"), "utf8");
  const objects = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map(
    (match) => JSON.parse(match[1]!) as unknown,
  );
  for (const example of examples) {
    for (const expected of [example.packet, example.result])
      assert.ok(objects.some((value) => JSON.stringify(value) === JSON.stringify(expected)));
  }
});
