#!/usr/bin/env node
import { lstat, readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import type { Stats } from "node:fs";

type JsonObject = Record<string, unknown>;
interface MemorySeed {
  source: string;
  target: string;
}
interface PortableManifest {
  schemaVersion: "2.0.0";
  profile: "portable-core";
  managedFiles: string[];
  memorySeeds: MemorySeed[];
  forbiddenReferences: string[];
  writeCapabilities: typeof EXPECTED_WRITE_CAPABILITIES;
}
interface NativeAgentConfig {
  mode: string;
  model?: string;
}

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

function parseJson(text: string): unknown {
  return JSON.parse(text);
}

function optionalObject(value: unknown): JsonObject | undefined {
  return isObject(value) ? value : undefined;
}

const ROLES = ["researcher", "planner", "implementer", "validator"];
const COMMAND_ROLES = new Map([
  ["delegate-research.md", "researcher"],
  ["delegate-plan.md", "planner"],
  ["delegate-implement.md", "implementer"],
  ["delegate-validate.md", "validator"],
]);
const REQUIRED_TRACE_FIELDS = [
  "orchestrationId",
  "role",
  "artifactId",
  "createdAt",
  "inputContract",
  "workPerformed",
  "outputContract",
  "handoff",
];
const DARWIN_HELPER_PATH = ".opencode/bootstrap/native/darwin-portable-fs.universal";
const DARWIN_HELPER_SHA256 = "931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9";

const EXPECTED_MANAGED_FILES = [
  ...ROLES.map((role) => `.opencode/agents/${role}.md`),
  ".opencode/commands/delegate-implement.md",
  ".opencode/commands/delegate-orchestration.md",
  ".opencode/commands/delegate-plan.md",
  ".opencode/commands/delegate-research.md",
  ".opencode/commands/delegate-validate.md",
  ".opencode/skills/delegation-orchestrator/SKILL.md",
  ".opencode/skills/interactive-refinement/SKILL.md",
  ".opencode/skills/delegation-orchestrator/references/role-routing-matrix.md",
  ".opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md",
  ".opencode/skills/delegation-orchestrator/references/validation-checklist.md",
  ".opencode/contracts/role-io-contracts.json",
  ".opencode/schemas/harness-endpoint-catalog.schema.json",
  ".opencode/schemas/harness-model-routing.schema.json",
  ".opencode/schemas/memory-trace-artifact.schema.json",
  ".opencode/schemas/interactive-refinement-test-plan.schema.json",
  ".opencode/schemas/orchestration-input.schema.json",
  ".opencode/schemas/role-io-contracts.schema.json",
  ".opencode/routing/harness-model-routing.example.json",
  ".opencode/routing/harness-model-routing.local.example.json",
  ".opencode/routing/model-routing-helper.mjs",
  ".opencode/routing/resolve-model-routing.mjs",
  ".opencode/routing/routing-config-loader.mjs",
  ".opencode/routing/routing-policy.mjs",
  ".opencode/routing/routing-policy.test.mjs",
  ".opencode/plugins/index.js",
  ".opencode/plugin-modules/task-contracts.js",
  ".opencode/plugin-modules/dispatch-controller.js",
  ".opencode/plugin-modules/acceptance-proof.js",
  ".opencode/plugin-modules/context-budget.js",
  ".opencode/plugin-modules/compaction-handoff.js",
  ".opencode/plugin-modules/compaction-handoff.test.mjs",
  ".opencode/plugin-modules/managed-execution.js",
  ".opencode/plugin-modules/managed-dispatch.js",
  ".opencode/plugin-modules/task-contracts.test.mjs",
  ".opencode/plugin-modules/dispatch-controller.test.mjs",
  ".opencode/plugin-modules/acceptance-proof.test.mjs",
  ".opencode/plugin-modules/context-budget.test.mjs",
  ".opencode/plugin-modules/managed-execution.test.mjs",
  ".opencode/plugin-modules/managed-dispatch.test.mjs",
  ".opencode/plugin-modules/harness-lifecycle.js",
  ".opencode/plugin-modules/task-thread-policy.js",
  ".opencode/plugin-modules/task-thread-policy.test.mjs",
  ".opencode/plugin-modules/role-model-routing-enforcement.js",
  ".opencode/plugin-modules/trace-root-permissions.js",
  ".opencode/plugin-modules/trace-root-permissions.test.mjs",
  ".opencode/bootstrap/native/darwin-portable-fs.c",
  DARWIN_HELPER_PATH,
  ".opencode/portable.manifest.json",
  ".opencode/scripts/bootstrap-portable-harness.mjs",
  ".opencode/scripts/portable-harness.test.mjs",
  ".opencode/scripts/validate-portable-harness.mjs",
  ".opencode/bootstrap/memory/INDEX.md",
  ".opencode/bootstrap/memory/protocols/memory-management.md",
  ".opencode/bootstrap/memory/templates/orchestration-index.md",
  ".opencode/bootstrap/memory/templates/compaction-handoff.md",
  ".opencode/bootstrap/memory/templates/role-trace-artifact.md",
  ".opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md",
].sort();

const EXPECTED_MEMORY_SEEDS = [
  [".opencode/bootstrap/memory/INDEX.md", ".memory/INDEX.md"],
  [
    ".opencode/bootstrap/memory/protocols/memory-management.md",
    ".memory/protocols/memory-management.md",
  ],
  [
    ".opencode/bootstrap/memory/templates/orchestration-index.md",
    ".memory/templates/orchestration-index.md",
  ],
  [
    ".opencode/bootstrap/memory/templates/compaction-handoff.md",
    ".memory/templates/compaction-handoff.md",
  ],
  [
    ".opencode/bootstrap/memory/templates/role-trace-artifact.md",
    ".memory/templates/role-trace-artifact.md",
  ],
  [
    ".opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md",
    ".memory/templates/interactive-refinement-test-plan.md",
  ],
];
const EXPECTED_WRITE_CAPABILITIES = {
  publication: "descriptor-relative-same-directory-hard-link",
  destinationPreflight: "all-parent-directories-before-publication",
  unavailableBehavior: "fail-before-file-publication",
  parentRelocationLimit:
    "pinned-parent-relocation-is-detected-before-and-after-publication-but-is-not-atomically-confined-beneath-root",
  backends: {
    linux: {
      platform: "linux",
      descriptorDirectoryAliases: ["/proc/self/fd", "/dev/fd"],
      safety: "linux-descriptor-relative-race-detecting",
    },
    darwin: {
      platform: "darwin",
      safety: "darwin-native-race-detecting",
      helper: {
        path: DARWIN_HELPER_PATH,
        sha256: DARWIN_HELPER_SHA256,
        protocol: 1,
        architectures: ["arm64", "x86_64"],
        minimumMacOS: "11.0",
        signing: "adhoc-all-slices-no-team-id-materialized-private-copy",
      },
    },
  },
};

function fail(message: string): never {
  throw new Error(`Portable harness validation failed: ${message}`);
}

function parseArgs(argv: string[]): { root: string } {
  let root = process.cwd();
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--root") fail(`unknown argument: ${argv[index]}`);
    const value = argv[++index];
    if (!value || value.startsWith("--")) fail("--root requires a path");
    root = path.resolve(process.cwd(), value);
  }
  return { root };
}

function safeRelative(value: unknown, label: string, prefix?: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    path.posix.normalize(value) !== value ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  )
    fail(`${label} is not a safe normalized relative POSIX path`);
  if (prefix && !value.startsWith(prefix)) fail(`${label} must be under ${prefix}`);
  return value;
}

async function statOrNull(file: string): Promise<Stats | null> {
  try {
    return await lstat(file);
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return null;
    throw error;
  }
}

async function regularFile(root: string, relative: string): Promise<string> {
  let current = root;
  for (const part of relative.split("/")) {
    current = path.join(current, part);
    const stat = await statOrNull(current);
    if (!stat) fail(`missing file: ${relative}`);
    if (stat?.isSymbolicLink()) fail(`symlink is not allowed in portable paths: ${relative}`);
  }
  const stat = await lstat(current);
  if (!stat.isFile()) fail(`not a regular file: ${relative}`);
  return current;
}

function validateManifest(manifest: unknown): PortableManifest {
  if (!isObject(manifest)) fail("manifest must be an object");
  const keys = Object.keys(manifest).sort();
  const expected = [
    "forbiddenReferences",
    "managedFiles",
    "memorySeeds",
    "profile",
    "schemaVersion",
    "writeCapabilities",
  ].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]))
    fail("manifest shape is not closed");
  if (manifest.schemaVersion !== "2.0.0" || manifest.profile !== "portable-core")
    fail("unsupported manifest version/profile");
  if (
    !Array.isArray(manifest.managedFiles) ||
    !Array.isArray(manifest.memorySeeds) ||
    !Array.isArray(manifest.forbiddenReferences)
  )
    fail("manifest inventories must be arrays");
  const managed = manifest.managedFiles.map((item, index) =>
    safeRelative(item, `managedFiles[${index}]`, ".opencode/"),
  );
  if (managed.length !== 61)
    fail(`managed inventory must contain exactly 61 files; got ${managed.length}`);
  if (
    new Set(managed).size !== managed.length ||
    !managed.includes(".opencode/portable.manifest.json")
  )
    fail("managed inventory must be unique and self-containing");
  if (JSON.stringify([...managed].sort()) !== JSON.stringify(EXPECTED_MANAGED_FILES))
    fail("managed inventory differs from the installed validator exact portable-core contract");
  for (const candidate of managed)
    if (managed.some((other) => other !== candidate && candidate.startsWith(`${other}/`)))
      fail(`managed file paths overlap: ${candidate}`);
  const targets: string[] = [];
  const memorySeeds: MemorySeed[] = [];
  for (const [index, seed] of manifest.memorySeeds.entries()) {
    if (!isObject(seed) || Object.keys(seed).sort().join(",") !== "source,target")
      fail(`memorySeeds[${index}] has an invalid shape`);
    const source = safeRelative(
      seed.source,
      `memorySeeds[${index}].source`,
      ".opencode/bootstrap/memory/",
    );
    const target = safeRelative(seed.target, `memorySeeds[${index}].target`, ".memory/");
    if (!managed.includes(source)) fail(`memory seed source is not managed: ${source}`);
    targets.push(target);
    memorySeeds.push({ source, target });
  }
  if (new Set(targets).size !== targets.length) fail("memory seed targets are not unique");
  const actualSeeds = memorySeeds
    .map((seed) => [seed.source, seed.target])
    .sort((left, right) => left.join("\0").localeCompare(right.join("\0")));
  const expectedSeeds = [...EXPECTED_MEMORY_SEEDS].sort((left, right) =>
    left.join("\0").localeCompare(right.join("\0")),
  );
  if (JSON.stringify(actualSeeds) !== JSON.stringify(expectedSeeds))
    fail("memory seeds differ from the installed validator exact portable-core contract");
  if (JSON.stringify(manifest.writeCapabilities) !== JSON.stringify(EXPECTED_WRITE_CAPABILITIES))
    fail("write capability contract is missing or unsupported");
  if (manifest.forbiddenReferences.some((item) => typeof item !== "string" || !item))
    fail("forbidden reference tokens must be unique nonempty strings");
  const forbiddenReferences = manifest.forbiddenReferences.map((item) => {
    if (typeof item !== "string")
      fail("forbidden reference tokens must be unique nonempty strings");
    return item;
  });
  if (
    forbiddenReferences.length === 0 ||
    new Set(forbiddenReferences).size !== forbiddenReferences.length
  )
    fail("forbidden reference tokens must be unique nonempty strings");
  return {
    schemaVersion: "2.0.0",
    profile: "portable-core",
    managedFiles: managed,
    memorySeeds,
    forbiddenReferences,
    writeCapabilities: EXPECTED_WRITE_CAPABILITIES,
  };
}

async function validateDarwinHelper(root: string, manifest: PortableManifest): Promise<void> {
  const helper = manifest.writeCapabilities.backends.darwin.helper;
  if (helper.path !== DARWIN_HELPER_PATH || helper.sha256 !== DARWIN_HELPER_SHA256)
    fail("Darwin helper manifest linkage differs from the installed contract");
  const bytes = await readFile(await regularFile(root, DARWIN_HELPER_PATH));
  if (createHash("sha256").update(bytes).digest("hex") !== helper.sha256)
    fail("Darwin helper SHA-256 mismatch");
  if (bytes.length < 48 || ![0xcafebabe, 0xcafebabf].includes(bytes.readUInt32BE(0)))
    fail("Darwin helper is not a supported universal Mach-O");
  const is64 = bytes.readUInt32BE(0) === 0xcafebabf;
  const count = bytes.readUInt32BE(4);
  if (count !== 2) fail("Darwin helper must contain exactly two slices");
  const entrySize = is64 ? 32 : 20;
  const names = new Map([
    [0x01000007, "x86_64"],
    [0x0100000c, "arm64"],
  ]);
  const slices = [];
  for (let index = 0; index < count; index += 1) {
    const entry = 8 + index * entrySize;
    if (entry + entrySize > bytes.length) fail("Darwin helper has a truncated FAT table");
    const cpu = bytes.readUInt32BE(entry);
    const name = names.get(cpu);
    if (!name) fail(`Darwin helper has unexpected CPU type 0x${cpu.toString(16)}`);
    const offset = is64 ? Number(bytes.readBigUInt64BE(entry + 8)) : bytes.readUInt32BE(entry + 8);
    const size = is64 ? Number(bytes.readBigUInt64BE(entry + 16)) : bytes.readUInt32BE(entry + 12);
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(size) ||
      size <= 0 ||
      offset < 8 + count * entrySize ||
      offset + size > bytes.length
    )
      fail("Darwin helper has invalid slice bounds");
    slices.push({ name, offset, size });
  }
  const first = slices[0];
  const second = slices[1];
  if (!first || !second) fail("Darwin helper must contain exactly two slices");
  if (first.offset + first.size > second.offset && second.offset + second.size > first.offset)
    fail("Darwin helper slices overlap");
  if (
    JSON.stringify(slices.map(({ name }) => name).sort()) !==
    JSON.stringify([...helper.architectures].sort())
  )
    fail("Darwin helper architectures differ from manifest");
}

function frontmatter(text: string, relative: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) fail(`missing frontmatter: ${relative}`);
  const top: Record<string, string> = {};
  const body = match?.[1];
  if (body === undefined) fail(`missing frontmatter: ${relative}`);
  for (const line of body.split("\n")) {
    if (/^\s/.test(line) || !line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator < 1) fail(`invalid frontmatter line in ${relative}`);
    top[line.slice(0, separator)] = line.slice(separator + 1).trim();
  }
  return top;
}

async function validateRolesAndCommands(root: string): Promise<void> {
  for (const role of ROLES) {
    const relative = `.opencode/agents/${role}.md`;
    const text = await readFile(await regularFile(root, relative), "utf8");
    const metadata = frontmatter(text, relative);
    if (
      !metadata.description ||
      metadata.mode !== "subagent" ||
      !Object.hasOwn(metadata, "permission")
    )
      fail(`agent frontmatter contract failed: ${relative}`);
    for (const snippet of [
      "contract-complete Task packet",
      "/delegate-orchestration",
      `@${role}`,
      "refuse",
      "delegation-orchestrator: deny",
      "task: deny",
      "taskMode",
    ])
      if (!text.includes(snippet))
        fail(`agent packet/delegation boundary is missing from ${relative}: ${snippet}`);
  }
  for (const [file, role] of COMMAND_ROLES) {
    const relative = `.opencode/commands/${file}`;
    const metadata = frontmatter(
      await readFile(await regularFile(root, relative), "utf8"),
      relative,
    );
    if (
      Object.keys(metadata).sort().join(",") !== "agent,description" ||
      metadata.agent !== role ||
      !metadata.description
    )
      fail(`command frontmatter contract failed: ${relative}`);
  }
  const orchestration = ".opencode/commands/delegate-orchestration.md";
  const metadata = frontmatter(
    await readFile(await regularFile(root, orchestration), "utf8"),
    orchestration,
  );
  if (
    Object.keys(metadata).sort().join(",") !== "description,subtask" ||
    metadata.subtask !== "false" ||
    !metadata.description
  )
    fail("orchestrator command must omit agent and set subtask false");
  const orchestrationText = await readFile(await regularFile(root, orchestration), "utf8");
  for (const snippet of [
    "$ARGUMENTS",
    "delegation-orchestrator/SKILL.md",
    "orchestration-input.schema.json",
    "<<<ORCHESTRATION_REQUEST>>>",
    "<<<END_ORCHESTRATION_REQUEST>>>",
    "Never require the user to write JSON",
  ])
    if (!orchestrationText.includes(snippet))
      fail(`orchestrator command is not a thin progressive-intake wrapper: ${snippet}`);
  if (/```json\s*\n\$ARGUMENTS\s*\n```/.test(orchestrationText))
    fail("orchestrator command must not wrap caller input in a JSON fence");
  const skillText = await readFile(
    await regularFile(root, ".opencode/skills/delegation-orchestrator/SKILL.md"),
    "utf8",
  );
  for (const snippet of [
    "not a required user prompt format",
    "ordinary language",
    "date-prefixed slug",
    "Default privileged or expansive behavior safely",
    "Ask one concise grouped follow-up",
    "Repair generated or derived structural failures internally",
  ])
    if (!skillText.includes(snippet))
      fail(`orchestrator progressive intake rule is missing: ${snippet}`);
}

async function validateMemory(root: string, manifest: PortableManifest): Promise<void> {
  const required = new Set([
    ".memory/INDEX.md",
    ".memory/protocols/memory-management.md",
    ".memory/templates/orchestration-index.md",
    ".memory/templates/compaction-handoff.md",
    ".memory/templates/role-trace-artifact.md",
    ".memory/templates/interactive-refinement-test-plan.md",
  ]);
  if (
    manifest.memorySeeds.length !== required.size ||
    manifest.memorySeeds.some((seed) => !required.delete(seed.target)) ||
    required.size
  )
    fail("memory seed targets do not define the minimal memory profile");
  for (const seed of manifest.memorySeeds) {
    const sourceText = await readFile(await regularFile(root, seed.source), "utf8");
    const targetText = await readFile(await regularFile(root, seed.target), "utf8");
    if (!targetText.trim()) fail(`memory target is empty: ${seed.target}`);
    if (seed.target !== ".memory/INDEX.md" && sourceText !== targetText)
      fail(`memory seed differs from canonical target: ${seed.target}`);
  }
}

async function validateTraceAlignment(root: string): Promise<void> {
  const contract = parseJson(
    await readFile(await regularFile(root, ".opencode/contracts/role-io-contracts.json"), "utf8"),
  );
  const schema = parseJson(
    await readFile(
      await regularFile(root, ".opencode/schemas/memory-trace-artifact.schema.json"),
      "utf8",
    ),
  );
  const inputSchema = parseJson(
    await readFile(
      await regularFile(root, ".opencode/schemas/orchestration-input.schema.json"),
      "utf8",
    ),
  );
  const contractObject = optionalObject(contract);
  const contractRoles = optionalObject(contractObject?.roles);
  const schemaObject = optionalObject(schema);
  const inputSchemaObject = optionalObject(inputSchema);
  const inputProperties = optionalObject(inputSchemaObject?.properties);
  const budgets = optionalObject(inputProperties?.budgets);
  const budgetProperties = optionalObject(budgets?.properties);
  const remediationCycles = optionalObject(budgetProperties?.defaultRemediationCyclesPerWorkUnit);
  if (inputSchemaObject?.additionalProperties !== false || remediationCycles?.const !== 1)
    fail("orchestration input schema is not closed with one-cycle default");
  const expectedIntakeFields = {
    schemaVersion: "generated",
    orchestrationId: "generated",
    goal: "user",
    deliverables: "derived",
    nonGoals: "derived",
    workUnits: "derived",
    allowedPaths: "derived",
    acceptanceGates: "derived",
    roleModeTaskMapping: "generated",
    dag: "generated",
    budgets: "generated",
    scopeExpansion: "generated",
    authorization: "generated",
    routingMetadataStatus: "generated",
    routingMetadata: "user",
    validationInputs: "user",
  };
  if (
    optionalObject(inputSchemaObject?.["x-intake"])?.contract !== "normalized-internal" ||
    optionalObject(inputSchemaObject?.["x-intake"])?.nestedFieldPolicy !==
      "inherit-parent-unless-explicit-user-value" ||
    JSON.stringify(optionalObject(inputSchemaObject?.["x-intake"])?.sourceClasses) !==
      JSON.stringify(["user", "derived", "generated"]) ||
    JSON.stringify(optionalObject(inputSchemaObject?.["x-intake"])?.fields) !==
      JSON.stringify(expectedIntakeFields) ||
    JSON.stringify(Object.keys(inputProperties ?? {}).sort()) !==
      JSON.stringify(Object.keys(expectedIntakeFields).sort())
  )
    fail("orchestration schema progressive-intake provenance contract differs");
  if (JSON.stringify(schemaObject?.required) !== JSON.stringify(REQUIRED_TRACE_FIELDS))
    fail("trace schema required fields differ from portable contract");
  for (const role of ROLES)
    if (
      JSON.stringify(
        optionalObject(optionalObject(contractRoles?.[role])?.traceArtifact)?.requiredFields,
      ) !== JSON.stringify(REQUIRED_TRACE_FIELDS)
    )
      fail(`trace required fields differ for role: ${role}`);
  for (const role of ROLES)
    for (const field of ["delegationTaskId", "scopeKey", "dispatchKind", "taskMode"]) {
      const required = optionalObject(
        optionalObject(contractRoles?.[role])?.inputContract,
      )?.required;
      if (!Array.isArray(required) || !required.includes(field))
        fail(`role input contract is missing ${field}: ${role}`);
    }
  const template = await readFile(
    await regularFile(root, ".memory/templates/role-trace-artifact.md"),
    "utf8",
  );
  for (const heading of [
    "## Metadata",
    "## Input Contract",
    "## Work Performed",
    "## Output Contract",
    "## Handoff",
  ])
    if (!template.includes(heading)) fail(`trace template is missing ${heading}`);
  for (const field of REQUIRED_TRACE_FIELDS.slice(0, 4))
    if (!template.includes(`- ${field}:`)) fail(`trace template is missing ${field}`);
}

async function validateRoutingAndPlugin(root: string): Promise<void> {
  const neutralPath = await regularFile(
    root,
    ".opencode/routing/harness-model-routing.example.json",
  );
  const neutral = parseJson(await readFile(neutralPath, "utf8"));
  const localPath = await regularFile(
    root,
    ".opencode/routing/harness-model-routing.local.example.json",
  );
  const local = parseJson(await readFile(localPath, "utf8"));
  const policyUrl = pathToFileURL(
    await regularFile(root, ".opencode/routing/routing-policy.mjs"),
  ).href;
  const policy = await import(`${policyUrl}?portable-validation=${Date.now()}`);
  const normalized = policy.normalizeAndValidateRoutingConfig(neutral);
  if (
    normalized.defaultModel !== null ||
    normalized.singleModel.enabled ||
    normalized.singleModel.model !== null ||
    normalized.localRouting.enabled ||
    normalized.localRouting.forceLocalForHarnessSubagents ||
    normalized.localRouting.defaultLocalModel !== null ||
    Object.keys(normalized.localRouting.models).length
  )
    fail("committed routing example is not neutral");
  const decision = policy.resolveRoutingDecision({
    config: neutral,
    request: { command: "/delegate-implement" },
  });
  if (
    decision.agent !== "implementer" ||
    decision.model !== null ||
    decision.local.enforced ||
    decision.local.catalogName !== null ||
    decision.local.routingServiceUrl !== null ||
    decision.local.maxInFlight !== null ||
    decision.local.networkCalls
  )
    fail("neutral routing decision is not provider-free");
  const normalizedLocal = policy.normalizeAndValidateRoutingConfig(local);
  if (
    !normalizedLocal.localRouting.enabled ||
    normalizedLocal.localRouting.forceLocalForHarnessSubagents ||
    normalizedLocal.localRouting.defaultLocalModel === null ||
    Object.keys(normalizedLocal.localRouting.models).length === 0
  )
    fail("local routing example is not enabled advisory routing");
  const localDecision = policy.resolveRoutingDecision({
    config: local,
    request: { command: "/delegate-implement" },
  });
  if (
    localDecision.agent !== "implementer" ||
    localDecision.model === null ||
    localDecision.local.enforced ||
    localDecision.local.catalogName === null ||
    localDecision.local.routingServiceUrl === null ||
    !Number.isInteger(localDecision.local.maxInFlight) ||
    localDecision.local.networkCalls
  )
    fail("enabled-local routing decision is not coherent advisory routing");

  const pluginRelative = ".opencode/plugins/index.js";
  const pluginText = await readFile(await regularFile(root, pluginRelative), "utf8");
  for (const imported of [
    "../plugin-modules/harness-lifecycle.js",
    "../plugin-modules/role-model-routing-enforcement.js",
    "../plugin-modules/trace-root-permissions.js",
  ])
    if (!pluginText.includes(imported)) fail(`plugin entry is missing import: ${imported}`);
  const plugin = await import(
    `${pathToFileURL(path.join(root, pluginRelative)).href}?portable-validation=${Date.now()}`
  );
  if (typeof plugin.default !== "function") fail("plugin entry has no default function export");
  const hooks = await plugin.default({ routingPath: neutralPath, project: { root } });
  for (const hook of [
    "config",
    "tool.execute.before",
    "tool.execute.after",
    "command.execute.before",
  ])
    if (typeof hooks[hook] !== "function") fail(`plugin has no ${hook} hook`);
  const nativeConfig = {};
  await hooks.config(nativeConfig);
  if (JSON.stringify(nativeConfig) !== "{}")
    fail("neutral no-provider config hook must be a no-op");
  const localHooks = await plugin.default({ routingPath: localPath, project: { root } });
  const localNativeConfig: {
    agent: Record<string, NativeAgentConfig>;
    provider: Record<string, unknown>;
  } = {
    agent: Object.fromEntries(
      ["researcher", "planner", "implementer", "validator"].map((role) => [
        role,
        { mode: "subagent" },
      ]),
    ),
    provider: {
      "llamacpp-research": {
        options: { baseURL: "http://127.0.0.1:8080/v1" },
        models: { "qwen2.5-7b-instruct": {} },
      },
      "llamacpp-coder": {
        options: { baseURL: "http://127.0.0.1:8081/v1" },
        models: { "qwen2.5-coder-7b": {} },
      },
    },
  };
  // Source/portable QA must never contact an operator's localhost model service.
  const savedFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input) =>
      Response.json(
        String(input).endsWith("/health")
          ? { status: "ok" }
          : { data: [{ id: "qwen2.5-7b-instruct" }, { id: "qwen2.5-coder-7b" }] },
      );
    await localHooks.config(localNativeConfig);
  } finally {
    globalThis.fetch = savedFetch;
  }
  if (
    ["researcher", "planner", "implementer", "validator"].some(
      (role) => typeof localNativeConfig.agent[role]?.model !== "string",
    )
  )
    fail("mixed local config hook must assign all four roles");
  const traceTest = await regularFile(
    root,
    ".opencode/plugin-modules/trace-root-permissions.test.mjs",
  );
  const traceTestSource = await readFile(traceTest, "utf8");
  for (const snippet of [
    'from "./trace-root-permissions.js"',
    "absent and exact workspace memory are no-ops",
    "four external allows and only three trailing md edit allows are role-isolated",
    "probe pair is closed, exclusive, owner-only and exact",
  ]) {
    if (!traceTestSource.includes(snippet))
      fail(`trace-root permission tests failed: missing contract fixture ${snippet}`);
  }
  const traceResult = spawnSync(process.execPath, ["--test", traceTest], {
    cwd: root,
    encoding: "utf8",
  });
  if (traceResult.status !== 0)
    fail(
      `trace-root permission tests failed: ${(traceResult.stderr || traceResult.stdout).trim()}`,
    );
}

async function validateTaskThreadPolicy(root: string): Promise<void> {
  const policyPath = ".opencode/plugin-modules/task-thread-policy.js";
  const testPath = ".opencode/plugin-modules/task-thread-policy.test.mjs";
  const policySource = await readFile(await regularFile(root, policyPath), "utf8");
  const policyImports = [...policySource.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  if (
    policyImports.length !== 1 ||
    policyImports[0] !== "./task-contracts.js" ||
    /\brequire\s*\(|\bimport\s*\(/.test(policySource)
  )
    fail("Task-thread policy must import only the local typed task contract");
  const policyModule = await import(
    `${pathToFileURL(path.join(root, policyPath)).href}?contract-check=${Date.now()}`
  );
  const contract = parseJson(
    await readFile(await regularFile(root, ".opencode/contracts/role-io-contracts.json"), "utf8"),
  );
  const contractRoles = optionalObject(optionalObject(contract)?.roles);
  for (const role of ROLES) {
    const policyFields = policyModule.TASK_THREAD_ROLE_PACKET_FIELDS?.[role];
    if (!policyFields) fail(`task-thread policy has no role packet contract: ${role}`);
    for (const kind of ["required", "optional"]) {
      const actual = [...(policyFields[kind] ?? [])].sort();
      const expectedValue = optionalObject(optionalObject(contractRoles?.[role])?.inputContract)?.[
        kind
      ];
      const expected = Array.isArray(expectedValue) ? [...expectedValue].sort() : [];
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        fail(`task envelope ${kind} packet fields differ from role contract: ${role}`);
    }
  }
  const lifecycle = await readFile(
    await regularFile(root, ".opencode/plugin-modules/harness-lifecycle.js"),
    "utf8",
  );
  for (const snippet of [
    'from "./managed-dispatch.js"',
    "await dispatch.beforeTask(input, args ?? {})",
    "output.args = dispatch.beforeTool(input, args ?? {})",
    "dispatch.afterTask(input, output)",
    "dispatch.afterTool(input, output)",
    "dispatch.sessionCreated(properties.info)",
    "dispatch.interrupt",
    "output?.args",
    '"tool.execute.after"',
    '"command.execute.before"',
    "blockedRoleCommands",
    '"session.created"',
  ])
    if (!lifecycle.includes(snippet)) fail(`lifecycle task-thread adapter is missing: ${snippet}`);
  for (const stale of ["input?.args", "session.start", "message.after"])
    if (lifecycle.includes(stale)) fail(`lifecycle uses stale hook shape: ${stale}`);

  const protocol = await readFile(
    await regularFile(root, ".memory/protocols/memory-management.md"),
    "utf8",
  );
  const policyPhrases = [
    "strict 1:1 boundary",
    "clarification-response",
    "Start a fresh child task and omit `task_id`.",
    "process restart loses authorization and denies reuse",
    "exact completed foreground",
    "bounded process-local ledgers",
  ];
  for (const phrase of policyPhrases)
    if (!protocol.includes(phrase)) fail(`task-thread policy wording is missing: ${phrase}`);
  for (const relative of [".opencode/skills/delegation-orchestrator/SKILL.md"]) {
    const text = await readFile(await regularFile(root, relative), "utf8");
    for (const phrase of ["delegationTaskId", "scopeKey", "task_id", "clarification"])
      if (!text.includes(phrase))
        fail(`task-thread policy wording missing from ${relative}: ${phrase}`);
  }
  for (const file of COMMAND_ROLES.keys()) {
    const text = await readFile(await regularFile(root, `.opencode/commands/${file}`), "utf8");
    for (const phrase of [
      "fail-closed",
      "/delegate-orchestration",
      "delegationTaskId",
      "scopeKey",
      "dispatchKind: fresh",
      "taskMode",
      "without any `task_id` property",
    ])
      if (!text.includes(phrase))
        fail(`role command task-thread wording missing from ${file}: ${phrase}`);
  }

  await regularFile(root, testPath);
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      testPath,
      ".opencode/plugin-modules/task-contracts.test.mjs",
      ".opencode/plugin-modules/dispatch-controller.test.mjs",
      ".opencode/plugin-modules/acceptance-proof.test.mjs",
      ".opencode/plugin-modules/context-budget.test.mjs",
      ".opencode/plugin-modules/managed-execution.test.mjs",
      ".opencode/plugin-modules/managed-dispatch.test.mjs",
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (result.status !== 0)
    fail(`task-thread policy tests failed: ${(result.stderr || result.stdout).trim()}`);
}

async function validateForbiddenReferences(
  root: string,
  manifest: PortableManifest,
): Promise<void> {
  const findings: string[] = [];
  for (const relative of manifest.managedFiles) {
    if (relative === DARWIN_HELPER_PATH) continue;
    const text = await readFile(await regularFile(root, relative), "utf8");
    if (relative !== ".opencode/portable.manifest.json")
      for (const token of manifest.forbiddenReferences)
        if (text.includes(token)) findings.push(`${relative}: ${JSON.stringify(token)}`);
    const scanInputs: string[] = [text];
    if (relative.endsWith(".json")) {
      const collectStrings = (value: unknown): void => {
        if (typeof value === "string") scanInputs.push(value);
        else if (Array.isArray(value)) value.forEach(collectStrings);
        else if (isObject(value))
          for (const [key, item] of Object.entries(value)) {
            scanInputs.push(key);
            collectStrings(item);
          }
      };
      collectStrings(parseJson(text));
    }
    const machineLocalPatterns = [
      /(?:^|[\s"'`(])(?:file:\/\/)?\/(?:home|Users)\/[^\s"'`)]+/gm,
      /(?:^|[\s"'`(])[A-Za-z]:[\\/][^\s"'`)]+/gm,
      /(?:^|[\s"'`(])\\\\[^\\/\s"'`)]+[\\/][^\\/\s"'`)]+(?:[\\/][^\s"'`)]+)?/gm,
      /(?:^|[\s"'`(])\/\/[^/\s"'`)]+\/[^/\s"'`)]+(?:\/[^\s"'`)]+)?/gm,
      /(?:^|[\s"'`(])\/(?:[A-Za-z0-9._-]+\/)+opencode-harness(?:\/[^\s"'`)]+)?/gm,
    ];
    for (const input of scanInputs)
      for (const expression of machineLocalPatterns)
        for (const match of input.matchAll(expression))
          findings.push(
            `${relative}: machine-local absolute path ${JSON.stringify(match[0].trim())}`,
          );
  }
  if (findings.length)
    fail(`forbidden portable references found (${findings.length}): ${findings.join("; ")}`);
}

async function main(): Promise<void> {
  const { root } = parseArgs(process.argv.slice(2));
  const stat = await statOrNull(root);
  if (!stat?.isDirectory() || stat.isSymbolicLink())
    fail(`root must be an existing real directory: ${root}`);
  const rootReal = await realpath(root);
  const manifest = validateManifest(
    parseJson(
      await readFile(await regularFile(rootReal, ".opencode/portable.manifest.json"), "utf8"),
    ),
  );
  for (const relative of manifest.managedFiles) await regularFile(rootReal, relative);
  await validateDarwinHelper(rootReal, manifest);
  await validateRolesAndCommands(rootReal);
  await validateMemory(rootReal, manifest);
  await validateTraceAlignment(rootReal);
  await validateTaskThreadPolicy(rootReal);
  await validateRoutingAndPlugin(rootReal);
  await validateForbiddenReferences(rootReal, manifest);
  console.log("Portable OpenCode harness validation passed");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
