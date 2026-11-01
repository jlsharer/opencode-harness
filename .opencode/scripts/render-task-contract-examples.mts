import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  TASK_MODES,
  taskContractShape,
  validateTaskPacket,
  validateTaskResult,
} from "../src/plugin-modules/task-contracts.ts";
import type { TaskContext, TaskResult } from "../src/plugin-modules/task-contracts.ts";
import { validateWorkflow } from "../src/plugin-modules/dispatch-controller.ts";
import type { TaskThreadRole } from "../src/plugin-modules/task-thread-policy.ts";

export interface ContractExample {
  context: TaskContext;
  packet: Record<string, unknown>;
  result: TaskResult;
}

const RESOURCE = ".opencode/skills/delegation-orchestrator/references/task-contract-examples.md";
// These are bounded prose samples, not a second list of required contract fields.
// Unknown fields deliberately require an author to supply a truthful illustration.
const PROSE: Readonly<Record<string, string>> = {
  scopedQuestion: "Locate the existing input parser and its empty-input behavior.",
  sourceConstraints: "Read src/example-parser.mjs and test/example-parser.test.mjs only.",
  freshnessRequirements: "Use the current workspace tree; identify the exact references read.",
  downstreamNeeds: "Give the planner cited behavior and unresolved scope questions.",
  relevantPaths: "src/example-parser.mjs",
  documentationTargets: "docs/example-parser.md",
  approvedGoal: "Return a clear error for empty input while preserving valid-input behavior.",
  scopeBoundaries: "Limit changes to the example parser and its focused tests.",
  researchEvidence: "docs/example-findings.md: current empty input returns an unhelpful error.",
  deliverablePaths: "docs/example-plan.md",
  acceptanceCriteria: "A focused test proves the empty-input error and preserves valid input.",
  dependencies: "Use the current parser findings before deciding the patch boundary.",
  assumptions: "The public parse function signature stays unchanged.",
  conflictsOrDecisions: "Keep error handling inside the existing parser boundary.",
  roleOutputs: "docs/example-findings.md",
  approvedPlan: "Add the empty-input regression test, then the smallest parser correction.",
  targetPaths: "src/example-parser.mjs",
  allowedEditScope: "src/example-parser.mjs and test/example-parser.test.mjs only.",
  schemaRequirements: "Preserve the existing valid-input result shape.",
  preservationRequirements: "Preserve unrelated edits and the existing parse signature.",
  verificationCommands: "node --test test/example-parser.test.mjs",
  styleConstraints: "Follow the parser's existing naming and formatting.",
  handoffRequirements: "Report changed paths, observed commands, and any skipped checks.",
  pathRelationships: "test/example-parser.test.mjs imports src/example-parser.mjs.",
  manifestExpectations: "No package or distribution manifest change is in this example scope.",
  changedFiles: "src/example-parser.mjs and test/example-parser.test.mjs",
  verificationCriteria: "Independently inspect the patch and run the focused behavior check.",
  commandsToRun: "node --test test/example-parser.test.mjs",
  schemaContracts: "Valid inputs retain their existing result fields and types.",
  acceptanceStandard:
    "Require observed passing checks on the final writer tree and no open blockers.",
  expectedWarnings: "No warning is expected; report any warning actually observed.",
  skippedCheckPolicy: "Report an unavailable check as blocked; do not claim its gate passed.",
  riskAreas: "Empty-input handling must not change valid-input parsing.",
  artifactExpectations: "Write the role trace and reference the observed command output.",
  citedFindings: "src/example-parser.mjs: the empty-input branch needs a clearer error.",
  sourceList: "src/example-parser.mjs and test/example-parser.test.mjs",
  implementationImplications: "Keep the patch inside the empty-input branch.",
  risks: "A broad parser rewrite could change valid-input behavior.",
  recommendedNextRole: "planner/plan: use the cited findings to bound the patch.",
  unresolvedQuestions: "Confirm the intended empty-input error wording before changing it.",
  orderedPlanOrResolvedConclusions:
    "Add a failing empty-input check, correct the branch, then validate independently.",
  fileContractsOrDecisions: "Preserve the parse function signature and valid-input result shape.",
  verificationGates:
    "Independent validator runs node --test test/example-parser.test.mjs on the final tree.",
  handoffNotes: "Use a fresh task identity for the next separately scoped assignment.",
  openQuestions: "No unresolved scope question remains in this illustrative success result.",
  tradeoffs: "A small branch correction avoids changing unrelated parsing behavior.",
  rationale: "The focused correction provides an explicit empty-input error.",
  schemaOrBoundaryChoices: "Keep the existing parser API and valid-input result schema.",
  commandsRun:
    "node --test test/example-parser.test.mjs: illustrative exit 0; replace with observed output.",
  skippedChecks: "No skipped check in this illustration; record actual omissions explicitly.",
  knownLimitations: "This illustration makes no claim about untested parser inputs.",
  passFailMatrixOrFindings:
    "Illustrative pass: empty-input behavior and valid-input regression checks.",
  commandOutputs:
    "Illustrative exit 0 for the focused check; replace with the actual observed output.",
  schemaResults: "Illustrative check preserves the existing valid-input result shape.",
  securityAndActivationFindings:
    "No activation was performed; the example patch stays inside the parser boundary.",
  remediationList: "No open remediation in this illustrative success result.",
  residualRisk: "Only the assigned checks are represented; other behavior has no proof here.",
  artifactProof:
    "Replace this prose with the profile-required artifact proof from the exact final tree.",
};

function sampleFields(
  fields: Record<string, string>,
  context: TaskContext,
  trace: string,
): Record<string, string | string[]> {
  const specific: Record<string, string> = {
    orchestrationId: context.orchestrationId,
    delegationTaskId: context.delegationTaskId,
    scopeKey: context.scopeKey,
    taskMode: context.taskMode,
    dispatchKind: "fresh",
    routingMetadataStatus: "absent",
    workspaceRoot: "/example/workspace",
    runtimeRoot: "/example/runtime",
    traceRoot: "/example/traces",
    traceArtifactPath: trace,
  };
  return Object.fromEntries(
    Object.entries(fields).map(([field, type]) => {
      if (!["string", "string[]", "string | string[]"].includes(type))
        throw new Error(`Unsupported task-contract example type for ${field}: ${type}`);
      const prose = Object.hasOwn(specific, field)
        ? specific[field]
        : Object.hasOwn(PROSE, field)
          ? PROSE[field]
          : undefined;
      if (!prose) throw new Error(`Unknown task-contract example field: ${field}`);
      return [field, type === "string" ? prose : [prose]];
    }),
  );
}

function buildExample(
  role: TaskThreadRole,
  taskMode: string,
  outcome: TaskResult["outcome"],
): ContractExample {
  const context: TaskContext = {
    orchestrationId: "example-workflow",
    delegationTaskId: `example-${role}-${taskMode}-${outcome}`,
    scopeKey: `example-parser-${role}-${taskMode}-${outcome}`,
    role,
    taskMode,
  };
  const trace = `.memory/orchestrations/${context.orchestrationId}/roles/${role}/${taskMode}-${outcome}.md`;
  const shape = taskContractShape(role);
  const optionalPacket = sampleFields(shape.optionalPacket, context, trace);
  const packet = {
    ...sampleFields(shape.requiredPacket, context, trace),
    ...Object.fromEntries(
      Object.entries(optionalPacket).filter(([field]) =>
        ["workspaceRoot", "runtimeRoot", "traceRoot"].includes(field),
      ),
    ),
  };
  const outputContract = sampleFields(shape.requiredSuccessOutput, context, trace);
  // Check optional fields too: an executable shape expansion must be reviewed.
  sampleFields(shape.optionalSuccessOutput, context, trace);
  const result: TaskResult = {
    version: 1,
    ...context,
    outcome,
    summary: `Illustrative ${role}/${taskMode} ${outcome} result; replace with actual findings.`,
    evidence:
      outcome === "success"
        ? [
            {
              reference: `evidence/${role}-${taskMode}.txt`,
              sha256: "a".repeat(64),
              ...(["implementer", "validator"].includes(role)
                ? {
                    command: "node --test test/example-parser.test.mjs",
                    exitCode: 0,
                  }
                : {}),
            },
          ]
        : [],
    // The legacy adapter seals artifact bytes after the leaf returns.
    artifacts: outcome === "success" ? [{ reference: trace }] : [],
    ...(outcome === "success"
      ? { outputContract }
      : outcome === "clarification"
        ? {
            requestNonce: "example-validator-clarification-1",
            question: "Which owner-approved empty-input error wording should the check require?",
          }
        : {
            reason:
              outcome === "blocked"
                ? "The required test runtime is unavailable; the assigned gate has no observation."
                : "The focused command failed; inspect its actual output before requesting a fresh correction task.",
          }),
  };
  validateTaskPacket(role, packet);
  validateTaskResult(result, context);
  return { context, packet, result };
}

export function buildTaskContractExamples(): ContractExample[] {
  const examples = (Object.keys(TASK_MODES) as TaskThreadRole[]).flatMap((role) =>
    TASK_MODES[role].map((mode) => buildExample(role, mode, "success")),
  );
  for (const outcome of ["blocked", "failed", "clarification"] as const)
    examples.push(buildExample("validator", "validation", outcome));
  return examples;
}

export function buildWorkflowExamples() {
  const base = {
    schemaVersion: "1.0.0",
    orchestrationId: "example-workflow",
    goal: "Independently verify the parser correction",
    deliverables: ["src/example-parser.mjs"],
    nonGoals: ["Unrelated behavior"],
    allowedPaths: ["src/example-parser.mjs"],
    validationInputs: ["test/example-parser.test.mjs"],
    workUnits: [
      {
        id: "parser",
        goal: "Correct parser",
        deliverable: "src/example-parser.mjs",
        nonGoals: ["Unrelated behavior"],
        allowedPaths: ["src/example-parser.mjs"],
        acceptanceGateIds: ["parser-tests"],
      },
    ],
    acceptanceGates: [
      {
        id: "parser-tests",
        criterion: "Parser regression checks pass",
        evidenceCommand: "node --test test/example-parser.test.mjs",
        workUnitIds: ["parser"],
      },
    ],
    roleModeTaskMapping: [
      {
        workUnitId: "parser",
        role: "implementer",
        taskMode: "implementation",
        boundedTask: "Correct parser under the approved plan",
      },
      {
        workUnitId: "parser",
        role: "validator",
        taskMode: "validation",
        boundedTask: "Independently review and prove parser checks",
      },
    ],
    dag: {
      dependencies: [],
      parallelism: {
        mode: "serial",
        authorization: "not-authorized",
        distinctCapacityEvidence: null,
      },
    },
    budgets: { mode: "unbounded" },
    scopeExpansion: { policy: "deny", requiresUserApproval: true },
    authorization: {
      liveProviders: false,
      userGlobalMutation: false,
      git: { commit: false, amend: false, push: false, otherMutation: false },
    },
    routingMetadataStatus: "absent",
  };
  const v2 = {
    ...structuredClone(base),
    schemaVersion: "2.0.0",
    roleModeTaskMapping: [
      { ...base.roleModeTaskMapping[0]!, gateObligations: [] },
      {
        workUnitId: "parser",
        role: "validator",
        taskMode: "review",
        boundedTask: "Advisory requirements and quality review",
        gateObligations: [],
      },
      { ...base.roleModeTaskMapping[1]!, gateObligations: ["parser-tests"], taskTimeoutMs: 600000 },
    ],
  };
  for (const example of [base, v2]) validateWorkflow(example);
  return [base, v2];
}

function jsonFence(value: unknown): string {
  return "```json\n" + JSON.stringify(value, null, 2) + "\n```";
}

export function renderTaskContractExamples(): string {
  const examples = buildTaskContractExamples();
  const lines = [
    "# Task contract examples",
    "",
    "Generated from executable taskContractShape and TASK_MODES. Do not edit this file directly.",
    "Source maintenance: `node .opencode/scripts/render-task-contract-examples.mts` regenerates it; installed profiles need only this resource.",
    "",
    "These are contract-valid, illustrative shapes: not admitted work, actual command observations, profile proof, or acceptance. " +
      "Every path and hash is a placeholder to replace with real references, byte hashes and observations. " +
      "The displayed command/exit pairs are illustrative, never evidence that a command ran.",
    "",
    "The active profile skill remains the delegation authority. " +
      "Packet validity does not establish scope admission, fresh child identity, tree freshness, deadlines, permissions or a passed gate. " +
      "Do not synthesize caller routing labels when routing metadata is absent.",
    "",
    "Profile-specific hashes: legacy managed adapters seal returned artifact bytes, so leaf artifacts omit sha256 here. " +
      "Evidence hashes are illustrative placeholders. " +
      "For global-native, validator gate evidence requires the exact assigned command, exitCode 0, " +
      "and sha256 equal to the adapter's current declared-file evidence tree hash. " +
      "Supply that profile-specific proof from actual observations; it is not a new required common-validator artifact field. " +
      "These common-validator examples do not satisfy those additional profile requirements.",
    "",
    "## Workflow versions and gate duties",
    "",
    "V1 retains all unit gates for every validator, including review. V1 rejects gateObligations and taskTimeoutMs. Its unit/gate declarations may be historically asymmetric: diagnostics name the mismatch, and legacy unit proof must not be claimed as global acceptance. Reconcile both edge sets before migrating.",
    "",
    "V2 requires explicit gateObligations on every mapping, empty for non-validators. Each gate has exactly one covered validator owner. Advisory review has no duties and closes no gates; it cannot cross blocked dependency gates. Unit final gates remain nonempty and both association declarations must agree. A later writer invalidates every gate and completed validator, including advisory review.",
    "",
    "V2 mapping taskTimeoutMs defaults to 300000 and accepts safe integers 1..3600000. The trusted maxTaskTimeoutMs ceiling defaults to 3600000; exceeding it rejects rather than clamps, including an omitted duration above a lower ceiling. The example owner receives 600000 while advisory review retains 300000. Legacy construction timeoutMs is v1 only. Reservation freezes one deadline; clarification, updates and compaction never renew it. Expiry retains capacity until termination is reconciled.",
    "",
    ...buildWorkflowExamples().flatMap((workflow) => [jsonFence(workflow), ""]),
    "## Select one role and mode",
    "",
    "Use the links below to read only the executable shape and the relevant role/mode example. Non-success examples demonstrate outcome-specific fields without success output; they grant no retry or acceptance authority.",
    "",
  ];
  for (const role of Object.keys(TASK_MODES) as TaskThreadRole[]) {
    const links = examples
      .filter(({ context }) => context.role === role)
      .map(
        ({ context, result }) =>
          `[${context.taskMode}/${result.outcome}](#${role}-${context.taskMode}-${result.outcome})`,
      );
    lines.push(`- **${role}**: [executable shape](#${role}-shape); ${links.join(", ")}`);
  }
  for (const role of Object.keys(TASK_MODES) as TaskThreadRole[]) {
    lines.push(
      "",
      `## ${role}`,
      "",
      `<details id="${role}-shape">`,
      `<summary>${role}: executable field names and types</summary>`,
      "",
      jsonFence(taskContractShape(role)),
      "",
      "</details>",
    );
    for (const { context, packet, result } of examples.filter(
      ({ context }) => context.role === role,
    )) {
      validateTaskPacket(role, packet);
      validateTaskResult(result, context);
      lines.push(
        "",
        `<details id="${role}-${context.taskMode}-${result.outcome}">`,
        `<summary>${role}/${context.taskMode}: ${result.outcome}</summary>`,
        "",
        "### Fresh packet",
        "",
        jsonFence(packet),
        "",
        "### Structured result",
        "",
        jsonFence(result),
        "",
        "</details>",
      );
    }
  }
  return lines.join("\n") + "\n";
}

function main(args: string[]): void {
  let root = process.cwd();
  let check = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--check") check = true;
    else if (arg === "--root") {
      const value = args[++index];
      if (!value || !path.isAbsolute(value)) throw new Error("--root requires an absolute path");
      root = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  const output = path.join(root, RESOURCE);
  const expected = renderTaskContractExamples();
  if (check) {
    if (readFileSync(output, "utf8") !== expected)
      throw new Error(`Task contract examples drift: regenerate ${output}`);
  } else {
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, expected);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
