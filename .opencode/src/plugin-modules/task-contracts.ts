import { TASK_THREAD_ROLE_PACKET_FIELDS } from "./task-thread-policy.ts";
import type { TaskThreadRole } from "./task-thread-policy.ts";

export interface TaskContext {
  orchestrationId: string;
  delegationTaskId: string;
  scopeKey: string;
  role: TaskThreadRole;
  taskMode: string;
}
export interface TaskEvidence {
  reference: string;
  sha256?: string;
  command?: string;
  exitCode?: number;
}
export interface TaskResult extends TaskContext {
  version: 1;
  outcome: "success" | "blocked" | "failed" | "clarification";
  summary: string;
  evidence: TaskEvidence[];
  artifacts: TaskEvidence[];
  outputContract?: Record<string, string | string[]>;
  reason?: string;
  requestNonce?: string;
  question?: string;
}
export const TASK_MODES: Readonly<Record<TaskThreadRole, readonly string[]>> = {
  researcher: ["research"],
  planner: ["plan", "synthesis"],
  implementer: ["implementation", "integration"],
  validator: ["validation", "review", "artifact-proof", "integration-check"],
};
const textFields = new Set([
  "orchestrationId",
  "delegationTaskId",
  "scopeKey",
  "dispatchKind",
  "taskMode",
  "routingMetadataStatus",
  "scopedQuestion",
  "freshnessRequirements",
  "downstreamNeeds",
  "approvedGoal",
  "approvedPlan",
  "acceptanceStandard",
  "workspaceRoot",
  "runtimeRoot",
  "traceRoot",
]);
const outputFields: Record<TaskThreadRole, readonly string[]> = {
  researcher: [
    "citedFindings",
    "sourceList",
    "implementationImplications",
    "risks",
    "recommendedNextRole",
    "traceArtifactPath",
  ],
  planner: [
    "orderedPlanOrResolvedConclusions",
    "fileContractsOrDecisions",
    "dependencies",
    "verificationGates",
    "handoffNotes",
    "traceArtifactPath",
  ],
  implementer: [
    "changedFiles",
    "rationale",
    "schemaOrBoundaryChoices",
    "commandsRun",
    "handoffNotes",
    "traceArtifactPath",
  ],
  validator: [
    "passFailMatrixOrFindings",
    "commandOutputs",
    "schemaResults",
    "securityAndActivationFindings",
    "remediationList",
    "traceArtifactPath",
  ],
};
const optionalOutputFields: Record<TaskThreadRole, readonly string[]> = {
  researcher: ["unresolvedQuestions"],
  planner: ["openQuestions", "tradeoffs"],
  implementer: ["skippedChecks", "knownLimitations"],
  validator: ["skippedChecks", "residualRisk", "artifactProof"],
};

export const TASK_REFERENCE_FIELDS = ["reference", "sha256", "command", "exitCode"] as const;

/** Rendered into global parent/leaf prompts from the same tables used below. */
export function taskContractShape(role: TaskThreadRole) {
  const shape = TASK_THREAD_ROLE_PACKET_FIELDS[role];
  const packetTypes = (fields: readonly string[]) =>
    Object.fromEntries(
      fields.map((field) => [field, textFields.has(field) ? "string" : "string[]"]),
    );
  const outputTypes = (fields: readonly string[]) =>
    Object.fromEntries(
      fields.map((field) => [
        field,
        field === "traceArtifactPath" ? "string" : "string | string[]",
      ]),
    );
  return {
    requiredPacket: packetTypes(shape.required),
    optionalPacket: packetTypes(shape.optional),
    requiredSuccessOutput: outputTypes(outputFields[role]),
    optionalSuccessOutput: outputTypes(optionalOutputFields[role]),
  };
}

function fail(label: string): never {
  throw new Error("Harness task contract: invalid " + label);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(label);
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = 4096): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || value.includes("\0"))
    fail(label + " (expected nonempty string within " + max + " characters)");
  return value;
}

function texts(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || !value.length || value.length > 32) fail(label);
  return value.map((v, i) => text(v, label + "[" + i + "]", 2048));
}

/** Packet fields are prose or bounded lists of prose/references, never arbitrary JSON. */
export function validateTaskPacket(role: TaskThreadRole, input: unknown): Record<string, unknown> {
  const shape = TASK_THREAD_ROLE_PACKET_FIELDS[role];
  if (!shape) fail("role");
  const packet = record(input, "role packet");
  const allowed = new Set([...shape.required, ...shape.optional]);
  if (
    shape.required.some((k) => !Object.hasOwn(packet, k)) ||
    Object.keys(packet).some((k) => !allowed.has(k))
  )
    fail("role packet fields");
  if (JSON.stringify(packet).length > 16384) fail("oversized role packet");
  for (const [key, value] of Object.entries(packet)) {
    if (textFields.has(key))
      text(
        value,
        key,
        ["orchestrationId", "delegationTaskId", "scopeKey"].includes(key) ? 160 : 4096,
      );
    else texts(value, key);
  }
  if (packet.dispatchKind !== "fresh") fail("dispatchKind");
  if (!TASK_MODES[role].includes(String(packet.taskMode))) fail("taskMode");
  if (!["present", "absent"].includes(String(packet.routingMetadataStatus)))
    fail("routingMetadataStatus");
  return packet;
}

function references(value: unknown, label: string): TaskEvidence[] {
  if (!Array.isArray(value) || value.length > 32) fail(label);
  return value.map((v, i) => {
    const item = record(v, label + "[" + i + "]");
    const at = label + "[" + i + "]";
    const unknown = Object.keys(item).filter(
      (k) => !(TASK_REFERENCE_FIELDS as readonly string[]).includes(k),
    );
    if (unknown.length)
      fail(at + " fields " + unknown.join(", ") + "; allowed: " + TASK_REFERENCE_FIELDS.join(", "));
    text(item.reference, at + ".reference", 2048);
    if (
      item.sha256 !== undefined &&
      (typeof item.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256))
    )
      fail(at + ".sha256");
    if (item.command !== undefined) text(item.command, at + ".command", 2048);
    if (
      item.exitCode !== undefined &&
      (!Number.isSafeInteger(item.exitCode) || item.command === undefined)
    )
      fail(at + ".exitCode (integer exitCode requires command)");
    if (item.command !== undefined && item.exitCode === undefined)
      fail(at + ".exitCode (command requires observed integer exitCode)");
    return item as unknown as TaskEvidence;
  });
}

/** Parses structured JSON only. Native Task wrappers must be stripped and correlated by the adapter. */
export function validateTaskResult(input: unknown, expected: TaskContext): TaskResult {
  let value = input;
  if (typeof value === "string") {
    if (value.length > 32768) fail("oversized result");
    try {
      value = JSON.parse(value);
    } catch {
      fail("result JSON");
    }
  }
  const result = record(value, "result");
  if (JSON.stringify(result).length > 32768) fail("oversized result");
  const allowed = new Set([
    "version",
    "orchestrationId",
    "delegationTaskId",
    "scopeKey",
    "role",
    "taskMode",
    "outcome",
    "summary",
    "evidence",
    "artifacts",
    "outputContract",
    "reason",
    "requestNonce",
    "question",
  ]);
  if (Object.keys(result).some((k) => !allowed.has(k)) || result.version !== 1)
    fail("result fields/version");
  for (const key of [
    "orchestrationId",
    "delegationTaskId",
    "scopeKey",
    "role",
    "taskMode",
  ] as const) {
    text(result[key], key, 160);
    if (result[key] !== expected[key]) fail("mismatched " + key);
  }
  if (!TASK_MODES[expected.role]?.includes(expected.taskMode)) fail("taskMode");
  text(result.summary, "summary");
  if (!["success", "blocked", "failed", "clarification"].includes(String(result.outcome)))
    fail("outcome");
  const evidence = references(result.evidence, "evidence");
  const artifacts = references(result.artifacts, "artifacts");
  if (result.outcome === "success") {
    if (!evidence.length || !artifacts.length) fail("missing evidence/artifacts");
    const output = record(result.outputContract, "outputContract");
    const allowedOutput = new Set([
      ...outputFields[expected.role],
      ...optionalOutputFields[expected.role],
    ]);
    if (Object.keys(output).some((k) => !allowedOutput.has(k))) fail("outputContract fields");
    for (const field of outputFields[expected.role]) {
      if (field === "traceArtifactPath") text(output[field], field, 2048);
      else if (typeof output[field] === "string") text(output[field], field);
      else texts(output[field], field);
    }
    for (const [key, entry] of Object.entries(output)) {
      text(key, "output field", 160);
      if (typeof entry === "string") text(entry, key);
      else texts(entry, key);
    }
    if (!artifacts.some((a) => a.reference === output.traceArtifactPath))
      fail("traceArtifactPath artifact reference");
    if (
      result.reason !== undefined ||
      result.question !== undefined ||
      result.requestNonce !== undefined
    )
      fail("success fields");
  } else if (result.outcome === "clarification") {
    text(result.requestNonce, "requestNonce", 160);
    text(result.question, "question");
    if (result.reason !== undefined || result.outputContract !== undefined)
      fail("clarification fields");
  } else {
    text(result.reason, "reason");
    if (
      result.question !== undefined ||
      result.requestNonce !== undefined ||
      result.outputContract !== undefined
    )
      fail("failure fields");
  }
  return result as unknown as TaskResult;
}
