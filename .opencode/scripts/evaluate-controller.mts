import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import {
  expandIndexedReferences,
  validateUsageTelemetry,
} from "../src/plugin-modules/context-budget.ts";
import type { ReferenceIndex } from "../src/plugin-modules/context-budget.ts";

import { createDispatchController } from "../src/plugin-modules/dispatch-controller.ts";

function workflow() {
  return {
    schemaVersion: "1.0.0",
    orchestrationId: "offline-fixture",
    goal: "offline policy evaluation",
    deliverables: ["src/a.ts"],
    nonGoals: ["No providers"],
    allowedPaths: ["src/"],
    workUnits: [
      {
        id: "unit",
        goal: "fixture",
        deliverable: "src/a.ts",
        nonGoals: ["No providers"],
        allowedPaths: ["src/"],
        acceptanceGateIds: ["gate"],
      },
    ],
    acceptanceGates: [
      { id: "gate", criterion: "pass", evidenceCommand: "node --test", workUnitIds: ["unit"] },
    ],
    roleModeTaskMapping: [
      {
        workUnitId: "unit",
        role: "implementer",
        taskMode: "implementation",
        boundedTask: "implement",
      },
      { workUnitId: "unit", role: "validator", taskMode: "validation", boundedTask: "validate" },
    ],
    dag: {
      dependencies: [],
      parallelism: {
        mode: "serial",
        authorization: "not-authorized",
        distinctCapacityEvidence: null,
      },
    },
    budgets: {
      defaultRemediationCyclesPerWorkUnit: 1,
      maxTotalLeafAgents: 8,
      maxLeafAgentsByRole: { researcher: 2, planner: 2, implementer: 2, validator: 2 },
      maxRemediationCyclesPerWorkUnit: 1,
    },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
    routingMetadataStatus: "absent",
  };
}

function runControllerProbe(probe: string): { refinedAccepted: boolean; rejection: string | null } {
  let now = 0;
  const spec = workflow();
  if (probe === "exhausted-budget") spec.budgets.maxTotalLeafAgents = 1;
  const controller = createDispatchController(spec, { now: () => now, timeoutMs: 10 });
  const request = {
    id: "first",
    workUnitId: "unit",
    role: "implementer" as const,
    taskMode: "implementation",
    parentSessionId: "parent",
  };
  controller.reserve(request);
  let action: () => unknown;
  switch (probe) {
    case "valid-completion":
      action = () => controller.complete("first", "success");
      break;
    case "duplicate-dispatch":
      action = () => controller.reserve(request);
      break;
    case "same-scope-dispatch":
      action = () => controller.reserve({ ...request, id: "second" });
      break;
    case "launch-error-retry":
      controller.failLaunch("first");
      action = () => controller.reserve({ ...request, id: "second" });
      break;
    case "cancelled-late-result":
      controller.cancel("first");
      action = () => controller.complete("first", "success");
      break;
    case "timeout-late-result":
      now = 11;
      action = () => controller.complete("first", "success");
      break;
    case "exhausted-budget":
      controller.failLaunch("first");
      action = () => controller.reserve({ ...request, id: "second" });
      break;
    case "missing-validator-proof":
      controller.complete("first", "success");
      controller.reserve({
        ...request,
        id: "validator",
        role: "validator",
        taskMode: "validation",
      });
      action = () => controller.complete("validator", "success");
      break;
    case "duplicate-completion":
      controller.complete("first", "success");
      action = () => controller.complete("first", "success");
      break;
    case "interrupted-resume":
      controller.interrupt();
      action = () => controller.reserve({ ...request, id: "second" });
      break;
    default:
      throw new Error("unknown controller probe");
  }
  let refinedAccepted = true;
  let rejection: string | null = null;
  try {
    action();
  } catch (error) {
    refinedAccepted = false;
    rejection = error instanceof Error ? error.message : String(error);
  }
  assert.equal(refinedAccepted, ["valid-completion", "launch-error-retry"].includes(probe), probe);
  return { refinedAccepted, rejection };
}

type Scenario = { id: string; probe: string };

const specification = JSON.parse(
  await readFile(
    fileURLToPath(new URL("../evaluation/offline-benchmark.json", import.meta.url)),
    "utf8",
  ),
) as { proposedRepeats: number; tasks: Scenario[] };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const expectedRejected = new Set([
  "unknown-reference",
  "stale-reference",
  "duplicate-reference",
  "aggregate-budget",
  "oversized-reference",
  "traversal-reference",
  "symlink-reference",
]);
const root = await mkdtemp(path.join(tmpdir(), "harness-offline-evaluation-"));
const rows: Record<string, unknown>[] = [];
const controllerRows: Record<string, unknown>[] = [];
for (const probe of [
  "valid-completion",
  "duplicate-dispatch",
  "same-scope-dispatch",
  "launch-error-retry",
  "cancelled-late-result",
  "timeout-late-result",
  "exhausted-budget",
  "missing-validator-proof",
  "duplicate-completion",
  "interrupted-resume",
]) {
  for (let repeat = 1; repeat <= specification.proposedRepeats; repeat++) {
    controllerRows.push({
      probe,
      repeat,
      thinFixtureAccepted: true,
      ...runControllerProbe(probe),
      nativeModelExecuted: false,
    });
  }
}
try {
  await mkdir(path.join(root, "sources"));
  await writeFile(path.join(root, "sources/small.txt"), "evidence");
  await writeFile(path.join(root, "sources/large.txt"), "x".repeat(40));
  await symlink("sources/small.txt", path.join(root, "link"));
  for (const scenario of specification.tasks) {
    for (let repeat = 1; repeat <= specification.proposedRepeats; repeat++) {
      const index: ReferenceIndex = {
        small: { path: "sources/small.txt", sha256: sha256("evidence") },
        another: { path: "sources/small.txt", sha256: sha256("evidence") },
        large: { path: "sources/large.txt", sha256: sha256("x".repeat(40)) },
        stale: { path: "sources/small.txt", sha256: sha256("old") },
        traversal: { path: "../outside.txt", sha256: sha256("outside") },
        link: { path: "link", sha256: sha256("evidence") },
      };
      const probes: Record<string, string[]> = {
        "valid-reference": ["small"],
        "unknown-reference": ["missing"],
        "stale-reference": ["stale"],
        "duplicate-reference": ["small", "small"],
        "aggregate-budget": ["small", "another"],
        "oversized-reference": ["large"],
        "traversal-reference": ["traversal"],
        "symlink-reference": ["link"],
        "reported-usage": ["small"],
        "unknown-usage": ["small"],
      };
      const requested = probes[scenario.probe];
      assert.ok(requested, "all probes must have a defined runner");
      let refinedAccepted = true;
      let bytes: number | null = null;
      let rejection: string | null = null;
      try {
        bytes = (
          await expandIndexedReferences(root, index, requested, {
            maxEntries: 3,
            maxBytes: 12,
            maxReferenceBytes: 12,
          })
        ).bytes;
      } catch (error) {
        refinedAccepted = false;
        rejection = error instanceof Error ? error.message : String(error);
      }
      assert.equal(refinedAccepted, !expectedRejected.has(scenario.probe), scenario.id);
      const usage = validateUsageTelemetry(
        scenario.probe === "reported-usage"
          ? { inputTokens: 11, outputTokens: 3, costUsd: 0 }
          : undefined,
      );
      rows.push({
        task: scenario.id,
        repeat,
        probe: scenario.probe,
        // The thin arm is a deliberately unguarded fixture transport, not a native OpenCode run.
        thinFixtureAccepted: true,
        refinedContextAccepted: refinedAccepted,
        expectedPolicyDecision: true,
        bytes,
        rejection,
        fixtureUsage: usage,
        nativeModelExecuted: false,
      });
    }
  }
  process.stdout.write(
    JSON.stringify(
      {
        kind: "offline-context-and-controller-policy-fixtures",
        repeats: specification.proposedRepeats,
        cases: rows.length + controllerRows.length,
        passed: rows.length + controllerRows.length,
        limitations: [
          "Thin fixture accepts packets without context checks; this is not measured native OpenCode behavior.",
          "Context/usage and dispatch-controller policy execute here; task prompts do not execute.",
          "Fixture-reported usage is synthetic input to validation, not measured provider usage.",
          "No model quality, token savings, cost superiority or live benchmark result is established.",
        ],
        rows,
        controllerRows,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
