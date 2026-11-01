import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  TASK_MODES,
  taskContractShape,
  validateTaskPacket,
  validateTaskResult,
} from "../src/plugin-modules/task-contracts.ts";
import {
  createDispatchController,
  gateObligationsFor,
} from "../src/plugin-modules/dispatch-controller.ts";
import type { TaskThreadRole } from "../src/plugin-modules/task-thread-policy.ts";
import {
  buildTaskContractExamples,
  renderTaskContractExamples,
} from "./render-task-contract-examples.mts";

const script = fileURLToPath(new URL("./render-task-contract-examples.mts", import.meta.url));
const resource = ".opencode/skills/delegation-orchestrator/references/task-contract-examples.md";

test("examples cover every executable role/mode and validate with correlated evidence", () => {
  const examples = buildTaskContractExamples();
  assert.deepEqual(Object.keys(TASK_MODES).sort(), [
    "implementer",
    "planner",
    "researcher",
    "validator",
  ]);
  assert.equal(
    new Set(examples.map(({ context }) => context.delegationTaskId)).size,
    examples.length,
  );
  const expected = Object.entries(TASK_MODES).flatMap(([role, modes]) =>
    modes.map((mode) => `${role}/${mode}`),
  );
  assert.deepEqual(
    examples
      .filter(({ result }) => result.outcome === "success")
      .map(({ context }) => `${context.role}/${context.taskMode}`),
    expected,
  );
  for (const { context, packet, result } of examples) {
    assert.deepEqual(validateTaskPacket(context.role, packet), packet);
    assert.deepEqual(validateTaskResult(result, context), result);
    for (const key of ["orchestrationId", "delegationTaskId", "scopeKey", "taskMode"] as const)
      assert.equal(packet[key], context[key]);
    assert.equal(packet.dispatchKind, "fresh");
    assert.equal(packet.routingMetadataStatus, "absent");
    for (const root of ["workspaceRoot", "runtimeRoot", "traceRoot"])
      assert.match(String(packet[root]), /^\/(?:[a-z0-9-]+\/)*[a-z0-9-]+$/);
    for (const entry of [...result.evidence, ...result.artifacts]) {
      if (entry.sha256 !== undefined) assert.match(entry.sha256, /^[a-f0-9]{64}$/);
      assert.equal(entry.command !== undefined, entry.exitCode !== undefined);
      if (entry.exitCode !== undefined) assert.ok(Number.isSafeInteger(entry.exitCode));
    }
    // Legacy adapters seal artifact hashes after the leaf returns.
    assert.ok(result.artifacts.every((artifact) => artifact.sha256 === undefined));
    if (result.outcome === "success") {
      assert.equal(result.outputContract?.traceArtifactPath, result.artifacts[0]?.reference);
      assert.deepEqual(
        Object.keys(result.outputContract ?? {}),
        Object.keys(taskContractShape(context.role).requiredSuccessOutput),
      );
    } else {
      assert.equal(context.role, "validator");
      assert.equal(context.taskMode, "validation");
      assert.equal(result.outputContract, undefined);
      if (result.outcome === "clarification") {
        assert.ok(result.requestNonce);
        assert.ok(result.question);
        assert.equal(result.reason, undefined);
      } else {
        assert.ok(result.reason);
        assert.equal(result.question, undefined);
      }
    }
  }
  assert.deepEqual(
    examples.slice(-3).map(({ result }) => result.outcome),
    ["blocked", "failed", "clarification"],
  );
});

test("Markdown JSON fences contain exactly the executable shapes and examples", () => {
  const markdown = renderTaskContractExamples();
  assert.equal(markdown, renderTaskContractExamples());
  const objects = [...markdown.matchAll(/```json\n([\s\S]*?)\n```/g)].map((match) =>
    JSON.parse(match[1]!),
  );
  const workflows = objects.filter((object) => object.schemaVersion);
  assert.deepEqual(
    workflows.map((object) => object.schemaVersion),
    ["1.0.0", "2.0.0"],
  );
  const expected: unknown[] = [...workflows];
  for (const role of Object.keys(TASK_MODES) as TaskThreadRole[]) {
    expected.push(taskContractShape(role));
    for (const example of buildTaskContractExamples().filter(
      ({ context }) => context.role === role,
    ))
      expected.push(example.packet, example.result);
  }
  assert.deepEqual(objects, expected);
  for (const phrase of ["illustrative", "not admitted", "global-native", "adapter", "placeholder"])
    assert.ok(markdown.includes(phrase), phrase);
  assert.ok(!markdown.includes("### Delegation Parameters"));
  for (const { context } of buildTaskContractExamples())
    assert.ok(markdown.includes(`id="${context.role}-${context.taskMode}-`));
});

test("real validators reject malformed example mutations", () => {
  const example = buildTaskContractExamples().find(({ context }) => context.role === "validator")!;
  for (const extra of ["path", "summary"]) {
    const result = structuredClone(example.result);
    Object.assign(result.evidence[0]!, { [extra]: "unsupported" });
    assert.throws(() => validateTaskResult(result, example.context), /fields/);
  }
  for (const patch of [{ command: "node --test test/example.test.mjs" }, { exitCode: 0 }]) {
    const result = structuredClone(example.result);
    result.evidence = [{ reference: "evidence/example.txt", ...patch }];
    assert.throws(() => validateTaskResult(result, example.context), /exitCode/);
  }
  for (const empty of ["", []]) {
    const result = structuredClone(example.result);
    result.outputContract!.commandOutputs = empty;
    assert.throws(() => validateTaskResult(result, example.context), /commandOutputs/);
  }
  for (const [key, type] of Object.entries(taskContractShape("validator").requiredPacket)) {
    const packet = structuredClone(example.packet);
    packet[key] = type === "string" ? [] : "wrong list type";
    assert.throws(() => validateTaskPacket("validator", packet), /invalid/);
    packet[key] = type === "string" ? "" : [];
    assert.throws(() => validateTaskPacket("validator", packet), /invalid/);
  }
  const mismatch = structuredClone(example.result);
  mismatch.outputContract!.traceArtifactPath = "different/trace.md";
  assert.throws(() => validateTaskResult(mismatch, example.context), /artifact reference/);
});

test("CLI generation is deterministic and check detects drift without rewriting", () => {
  const root = mkdtempSync("/var/tmp/task-contract-examples-");
  const target = path.join(root, resource);
  const run = (...args: string[]) =>
    spawnSync(process.execPath, [script, ...args], {
      cwd: root,
      encoding: "utf8",
    });
  try {
    assert.equal(run("--check").status, 1);
    assert.equal(run().status, 0);
    assert.equal(readFileSync(target, "utf8"), renderTaskContractExamples());
    assert.equal(run("--check").status, 0);
    assert.equal(run("--root", root).status, 0);
    assert.equal(readFileSync(target, "utf8"), renderTaskContractExamples());
    const drift = readFileSync(target, "utf8") + "x";
    writeFileSync(target, drift);
    assert.equal(run("--check", "--root", root).status, 1);
    assert.equal(readFileSync(target, "utf8"), drift);
    assert.equal(run("--unknown").status, 1);
    assert.equal(run("--root", "relative").status, 1);
    assert.equal(run("--root").status, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("import has no CLI or filesystem effects even with unrelated CLI arguments", () => {
  const root = mkdtempSync("/var/tmp/task-contract-import-");
  try {
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `await import(${JSON.stringify(new URL("./render-task-contract-examples.mts", import.meta.url).href)})`,
        "--",
        "--unknown",
      ],
      { cwd: root, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout, "");
    assert.throws(() => readFileSync(path.join(root, resource)), { code: "ENOENT" });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("executable contract additions with unknown fields or types fail explicitly", () => {
  const sourceRoot = fileURLToPath(new URL("../", import.meta.url));
  const cases = [
    {
      file: "src/plugin-modules/task-thread-policy.ts",
      from: '"scopedQuestion",',
      to: '"scopedQuestion", "futurePacketField",',
      error: /Unknown task-contract example field: futurePacketField/,
    },
    {
      file: "src/plugin-modules/task-contracts.ts",
      from: 'textFields.has(field) ? "string" : "string[]"',
      to: 'textFields.has(field) ? "integer" : "string[]"',
      error: /Unsupported task-contract example type for \w+: integer/,
    },
  ];
  for (const mutation of cases) {
    const root = mkdtempSync("/var/tmp/task-contract-shape-");
    try {
      mkdirSync(path.join(root, "scripts"));
      mkdirSync(path.join(root, "src/plugin-modules"), { recursive: true });
      writeFileSync(path.join(root, "package.json"), '{"type":"module"}\n');
      for (const file of [
        "scripts/render-task-contract-examples.mts",
        "src/plugin-modules/task-contracts.ts",
        "src/plugin-modules/task-thread-policy.ts",
        "src/plugin-modules/dispatch-controller.ts",
      ])
        cpSync(path.join(sourceRoot, file), path.join(root, file));
      const sourcePath = path.join(root, mutation.file);
      const before = readFileSync(sourcePath, "utf8");
      const after = before.replace(mutation.from, mutation.to);
      assert.notEqual(after, before, "fixture must mutate the real executable table");
      writeFileSync(sourcePath, after);
      const result = spawnSync(
        process.execPath,
        [path.join(root, "scripts/render-task-contract-examples.mts")],
        { cwd: root, encoding: "utf8" },
      );
      assert.equal(result.status, 1);
      assert.match(result.stderr, mutation.error);
      assert.throws(() => readFileSync(path.join(root, resource)), { code: "ENOENT" });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("rendered workflows admit advisory review and preserve v1 gate duties", () => {
  const workflows = [...renderTaskContractExamples().matchAll(/```json\n([\s\S]*?)\n```/g)]
    .map((m) => JSON.parse(m[1]!))
    .filter((o) => o.schemaVersion);
  assert.equal(workflows.length, 2);
  for (const input of workflows) {
    const controller = createDispatchController(input);
    const validator = controller.spec.roleModeTaskMapping.find((m) => m.role === "validator")!;
    assert.deepEqual(
      gateObligationsFor(controller.spec, validator).map((g) => g.id),
      input.schemaVersion === "2.0.0" ? [] : ["parser-tests"],
    );
    if (input.schemaVersion === "2.0.0") {
      assert.equal(validator.taskTimeoutMs, 300000);
      assert.equal(controller.spec.roleModeTaskMapping.at(-1)!.taskTimeoutMs, 600000);
      assert.deepEqual(controller.spec.acceptanceGates[0]!.owner, {
        workUnitId: "parser",
        role: "validator",
        taskMode: "validation",
      });
    }
  }
});

test("workflow schema selects exact mapping fields independently for v1 and v2", () => {
  const schema = JSON.parse(
    readFileSync(new URL("../schemas/orchestration-input.schema.json", import.meta.url), "utf8"),
  );
  assert.deepEqual(schema.properties.schemaVersion.enum, ["1.0.0", "2.0.0"]);
  const branch = schema.allOf[1];
  assert.equal(branch.if.properties.schemaVersion.const, "2.0.0");
  assert.deepEqual(
    branch.then.properties.roleModeTaskMapping.items.oneOf.map(
      (entry: { $ref: string }) => entry.$ref,
    ),
    [
      "#/$defs/researchMappingV2",
      "#/$defs/plannerMappingV2",
      "#/$defs/implementerMappingV2",
      "#/$defs/validatorMappingV2",
    ],
  );
  assert.deepEqual(
    branch.else.properties.roleModeTaskMapping.items.oneOf.map(
      (entry: { $ref: string }) => entry.$ref,
    ),
    [
      "#/$defs/researchMapping",
      "#/$defs/plannerMapping",
      "#/$defs/implementerMapping",
      "#/$defs/validatorMapping",
    ],
  );
  assert.equal(schema.$defs.mappingBase.additionalProperties, false);
  assert.equal(schema.$defs.mappingBase.properties.gateObligations, undefined);
  assert.equal(schema.$defs.mappingBase.properties.taskTimeoutMs, undefined);
  assert.ok(schema.$defs.mappingBaseV2.required.includes("gateObligations"));
  assert.equal(schema.$defs.mappingBaseV2.additionalProperties, false);
  assert.deepEqual(schema.$defs.mappingBaseV2.properties.taskTimeoutMs, {
    type: "integer",
    minimum: 1,
    maximum: 3600000,
    default: 300000,
  });
});
