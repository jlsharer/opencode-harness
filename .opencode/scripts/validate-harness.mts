#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

type Role = "researcher" | "planner" | "implementer" | "validator";
type RoleCommand =
  | "delegate-research"
  | "delegate-plan"
  | "delegate-implement"
  | "delegate-validate";

interface ManifestArtifact {
  path: string;
  owner: string;
  kind: string;
}

interface SourceManifest {
  artifacts: ManifestArtifact[];
}

interface RuntimeGeneratedEntry {
  path: string;
  kind: string;
  recursive: boolean;
  required: boolean;
  mode: string;
}

interface RuntimeFile {
  source: string;
  destination: string;
}

interface RuntimeManifest extends Record<string, unknown> {
  packageVersion: string;
  compatibility?: { node?: string; platform?: string; opencode?: unknown };
  generatedEntries: RuntimeGeneratedEntry[];
  files: RuntimeFile[];
}

interface SchemaNode extends Record<string, unknown> {
  $schema?: string;
  $ref?: string;
  const?: unknown;
  type?: string;
  required?: string[];
  additionalProperties?: boolean;
  properties?: Record<string, SchemaNode>;
  patternProperties?: Record<string, SchemaNode>;
  propertyNames?: SchemaNode;
  oneOf?: SchemaNode[];
  allOf?: SchemaNode[];
  if?: SchemaNode;
  then?: SchemaNode;
  $defs?: Record<string, SchemaNode>;
}

interface RoutingEntry {
  agent: Role;
  model: string | null;
}

interface RoutingDocument extends Record<string, unknown> {
  harnessModelRouting: {
    providerClassMode: string;
    roleOverrides: Record<Role, RoutingEntry>;
    localRouting: {
      enabled: boolean;
      forceLocalForHarnessSubagents: boolean;
      defaultLocalModel: string | null;
    };
    orchestratorCommands: Record<string, { owner: string; agent: Role | null }>;
  };
}

interface NormalizedRouting {
  schemaVersion: string;
  defaultModel: string | null;
  singleModel: { enabled: boolean; model: string | null };
  localRouting: {
    enabled: boolean;
    forceLocalForHarnessSubagents: boolean;
    defaultLocalModel: string | null;
    models: Record<string, unknown>;
  };
  roleOverrides: Record<Role, RoutingEntry>;
  commandOverrides: Record<string, { agent: Role }>;
  orchestratorCommands: Record<string, { owner: string; agent: Role | null }>;
}

interface PackFile {
  path: string;
  mode: number;
}

interface PackReport {
  name: string;
  version: string;
  files: PackFile[];
}

function assertPackReports(value: unknown): asserts value is PackReport[] {
  if (!Array.isArray(value)) fail("npm pack dry-run report must be an array");
  for (const report of value) {
    if (typeof report !== "object" || report === null)
      fail("npm pack dry-run report entry must be an object");
    if (!Array.isArray(Reflect.get(report, "files")))
      fail("npm pack dry-run report files must be an array");
  }
}

interface ContractRole {
  taskModes: string[];
  inputContract: { required: string[]; optional?: string[] };
  outputContract: { required: string[] };
  traceArtifact: { pathTemplate: string; requiredFields: string[] };
  verificationExpectations: string[];
}

interface RoleContract {
  memoryProtocol: string;
  traceArtifactSchema: string;
  roles: Record<Role, ContractRole>;
}

interface FrontmatterFields extends Record<string, string> {}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const ROOT = process.cwd();
const ROLES: Role[] = ["researcher", "planner", "implementer", "validator"];
const ROLE_COMMANDS: RoleCommand[] = [
  "delegate-research",
  "delegate-plan",
  "delegate-implement",
  "delegate-validate",
];
const ORCHESTRATOR_COMMANDS = ["delegate-orchestration"];
const COMMANDS = [...ROLE_COMMANDS, ...ORCHESTRATOR_COMMANDS];
const COMMAND_ROLE_MAP: Record<RoleCommand, Role> = {
  "delegate-research": "researcher",
  "delegate-plan": "planner",
  "delegate-implement": "implementer",
  "delegate-validate": "validator",
};
const STATIC_MANIFEST_PATHS = [
  "package-lock.json",
  "eslint.config.mjs",
  "tsconfig.json",
  "opencode.json",
  "AGENTS.md",
  "README.md",
  "opencode-harness.design.md",
  ".memory/INDEX.md",
  ".memory/protocols/memory-management.md",
  ".memory/references/opencode-refs.md",
  ".memory/templates/orchestration-index.md",
  ".memory/templates/compaction-handoff.md",
  ".memory/templates/role-trace-artifact.md",
  ".memory/templates/interactive-refinement-test-plan.md",
  ".opencode/skills/delegation-orchestrator/SKILL.md",
  ".opencode/skills/interactive-refinement/SKILL.md",
  ".opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md",
  ".opencode/skills/delegation-orchestrator/references/role-routing-matrix.md",
  ".opencode/skills/delegation-orchestrator/references/validation-checklist.md",
  ".opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md",
  ".opencode/skills/opencode-skill-authoring/SKILL.md",
  ".opencode/skills/opencode-workflow-guidance/SKILL.md",
  ".opencode/deployments/llama-server/compose.yaml",
  ".opencode/deployments/llama-server/instances/research.env.example",
  ".opencode/deployments/llama-server/instances/coder.env.example",
  ".opencode/deployments/llama-server/README.md",
  ".opencode/contracts/role-io-contracts.json",
  ".opencode/schemas/role-io-contracts.schema.json",
  ".opencode/schemas/memory-trace-artifact.schema.json",
  ".opencode/schemas/interactive-refinement-test-plan.schema.json",
  ".opencode/schemas/orchestration-input.schema.json",
  ".opencode/schemas/harness-endpoint-catalog.schema.json",
  ".opencode/schemas/harness-model-routing.schema.json",
  ".opencode/schemas/harness-routing-profile.schema.json",
  ".opencode/schemas/opencode-provider-projection.schema.json",
  ".opencode/routing/harness-model-routing.example.json",
  ".opencode/routing/harness-model-routing.local.example.json",
  ".opencode/src/package.json",
  ".opencode/routing/routing-config-loader.mjs",
  ".opencode/routing/routing-policy.mjs",
  ".opencode/routing/routing-policy.test.mjs",
  ".opencode/routing/resolve-model-routing.mjs",
  ".opencode/routing/model-routing-helper.mjs",
  ".opencode/src/routing/routing-config-loader.ts",
  ".opencode/src/routing/routing-policy.ts",
  ".opencode/src/routing/routing-policy.test.ts",
  ".opencode/src/routing/resolve-model-routing.ts",
  ".opencode/src/routing/model-routing-helper.ts",
  ".opencode/plugins/index.js",
  ".opencode/plugin-modules/task-contracts.js",
  ".opencode/plugin-modules/dispatch-controller.js",
  ".opencode/plugin-modules/acceptance-proof.js",
  ".opencode/plugin-modules/context-budget.js",
  ".opencode/plugin-modules/compaction-handoff.js",
  ".opencode/plugin-modules/compaction-handoff.test.mjs",
  ".opencode/plugin-modules/managed-execution.js",
  ".opencode/plugin-modules/external-win64-relaunch.js",
  ".opencode/plugin-modules/external-win64-relaunch.test.mjs",
  ".opencode/plugin-modules/managed-dispatch.js",
  ".opencode/plugin-modules/task-contracts.test.mjs",
  ".opencode/plugin-modules/dispatch-controller.test.mjs",
  ".opencode/plugin-modules/acceptance-proof.test.mjs",
  ".opencode/plugin-modules/context-budget.test.mjs",
  ".opencode/plugin-modules/managed-execution.test.mjs",
  ".opencode/plugin-modules/managed-dispatch.test.mjs",
  ".opencode/plugin-modules/v2-dispatch-bridge.js",
  ".opencode/plugin-modules/v2-dispatch-bridge.test.mjs",
  ".opencode/plugin-modules/v2-native-plugin.js",
  ".opencode/patches/v2.1.4-background-job.patch",
  ".opencode/src/plugin-modules/task-contracts.ts",
  ".opencode/src/plugin-modules/dispatch-controller.ts",
  ".opencode/src/plugin-modules/acceptance-proof.ts",
  ".opencode/src/plugin-modules/context-budget.ts",
  ".opencode/src/plugin-modules/compaction-handoff.ts",
  ".opencode/src/plugin-modules/compaction-handoff.test.ts",
  ".opencode/src/plugin-modules/managed-execution.ts",
  ".opencode/src/plugin-modules/external-win64-relaunch.ts",
  ".opencode/src/plugin-modules/external-win64-relaunch.test.ts",
  ".opencode/src/plugin-modules/managed-dispatch.ts",
  ".opencode/src/plugin-modules/task-contracts.test.ts",
  ".opencode/src/plugin-modules/dispatch-controller.test.ts",
  ".opencode/src/plugin-modules/acceptance-proof.test.ts",
  ".opencode/src/plugin-modules/context-budget.test.ts",
  ".opencode/src/plugin-modules/managed-execution.test.ts",
  ".opencode/src/plugin-modules/managed-dispatch.test.ts",
  ".opencode/src/plugin-modules/v2-dispatch-bridge.ts",
  ".opencode/src/plugin-modules/v2-dispatch-bridge.test.ts",
  ".opencode/src/plugin-modules/v2-native-plugin.ts",
  ".opencode/scripts/evaluate-controller.mts",
  ".opencode/evaluation/paired-tasks.json",
  ".opencode/scripts/prepare-paired-benchmark.mts",
  ".opencode/scripts/paired-benchmark.test.mts",
  ".opencode/evaluation/offline-benchmark.json",
  "docs/refinement-evaluation.md",
  ".opencode/plugin-modules/harness-lifecycle.js",
  ".opencode/plugin-modules/task-thread-policy.js",
  ".opencode/plugin-modules/task-thread-policy.test.mjs",
  ".opencode/plugin-modules/role-model-routing-enforcement.js",
  ".opencode/plugin-modules/trace-root-permissions.js",
  ".opencode/plugin-modules/trace-root-permissions.test.mjs",
  ".opencode/src/plugins/index.ts",
  ".opencode/src/plugin-modules/harness-lifecycle.ts",
  ".opencode/src/plugin-modules/task-thread-policy.ts",
  ".opencode/src/plugin-modules/task-thread-policy.test.ts",
  ".opencode/src/plugin-modules/role-model-routing-enforcement.ts",
  ".opencode/src/plugin-modules/trace-root-permissions.ts",
  ".opencode/src/plugin-modules/trace-root-permissions.test.ts",
  ".opencode/bootstrap/memory/INDEX.md",
  ".opencode/bootstrap/memory/protocols/memory-management.md",
  ".opencode/bootstrap/memory/templates/orchestration-index.md",
  ".opencode/bootstrap/memory/templates/compaction-handoff.md",
  ".opencode/bootstrap/memory/templates/role-trace-artifact.md",
  ".opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md",
  ".opencode/bootstrap/native/darwin-portable-fs.c",
  ".opencode/bootstrap/native/darwin-portable-fs.universal",
  ".opencode/portable.manifest.json",
  ".opencode/scripts/bootstrap-portable-harness.mjs",
  ".opencode/src/scripts/bootstrap-portable-harness.ts",
  ".opencode/scripts/build-darwin-portable-fs.mts",
  ".opencode/scripts/build-typescript.mts",
  ".opencode/scripts/check-typescript-policy.mts",
  ".opencode/scripts/generated-typescript-artifacts.mts",
  ".opencode/scripts/darwin-portable-fs.test.mts",
  ".opencode/scripts/portable-harness.test.mjs",
  ".opencode/src/scripts/portable-harness.test.ts",
  ".opencode/scripts/validate-portable-harness.mjs",
  ".opencode/src/scripts/validate-portable-harness.ts",
  ".opencode/scripts/validate-harness.mts",
  ".opencode/scripts/operator-external-qa.mts",
  ".opencode/scripts/operator-external-qa.test.mts",
  ".opencode/scripts/operator-approved-artifact-install.mts",
  ".opencode/plugin-modules/operator-approved-artifact-install.js",
  ".opencode/scripts/operator-approved-artifact-install.test.mts",
  ".opencode/scripts/operator-approved-archive-install.mts",
  ".opencode/plugin-modules/operator-approved-archive-install.js",
  ".opencode/scripts/operator-approved-archive-install.test.mts",
  ".opencode/scripts/native-v2-plugin-fixture.mts",
  ".opencode/scripts/native-v2-plugin-fixture.test.mts",
  ".opencode/scripts/runtime-harness.test.mts",
  ".opencode/scripts/runtime-foreign-repo.test.mts",
  ".opencode/runtime.manifest.json",
  "bin/opencode-harness.mjs",
  "bin/opencode-harness.ts",
  "package.json",
  ".opencode/harness.manifest.json",
];
const STATIC_MEMORY_PATHS = [
  ".memory/INDEX.md",
  ".memory/protocols/memory-management.md",
  ".memory/references/opencode-refs.md",
  ".memory/templates/orchestration-index.md",
  ".memory/templates/compaction-handoff.md",
  ".memory/templates/role-trace-artifact.md",
  ".memory/templates/interactive-refinement-test-plan.md",
];
const SCHEMA_PATHS = [
  ".opencode/schemas/role-io-contracts.schema.json",
  ".opencode/schemas/memory-trace-artifact.schema.json",
  ".opencode/schemas/orchestration-input.schema.json",
  ".opencode/schemas/harness-endpoint-catalog.schema.json",
  ".opencode/schemas/harness-model-routing.schema.json",
  ".opencode/schemas/harness-routing-profile.schema.json",
  ".opencode/schemas/opencode-provider-projection.schema.json",
  ".opencode/schemas/interactive-refinement-test-plan.schema.json",
];
const ROLE_CONTRACT_PATH = ".opencode/contracts/role-io-contracts.json";
const TRACE_SCHEMA_PATH = ".opencode/schemas/memory-trace-artifact.schema.json";
const TRACE_FIELDS = [
  "orchestrationId",
  "role",
  "artifactId",
  "createdAt",
  "inputContract",
  "workPerformed",
  "outputContract",
  "handoff",
];
const SOURCE_INVENTORY_EXCLUSIONS = new Set([
  ".opencode/.gitignore",
  ".opencode/package.json",
  ".opencode/package-lock.json",
  ".opencode/routing/harness-model-routing.json",
]);
const HARNESS_ROUTING_KEYS = [
  "harnessModelRouting",
  "roleOverrides",
  "commandOverrides",
  "complexityTiers",
  "localRouting",
  "routingServiceUrl",
  "localModelEnabled",
  "preferLocal",
  "localModelFallback",
];

function fail(message: string): never {
  throw new Error(message);
}

function file(pathname: string): string {
  const full = path.join(ROOT, pathname);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    fail(`Missing required file: ${pathname}`);
  }
  return full;
}

function read(pathname: string): string {
  return fs.readFileSync(file(pathname), "utf8");
}

function json(pathname: string) {
  return JSON.parse(read(pathname));
}

function sameSet(actual: Iterable<unknown>, expected: Iterable<unknown>, label: string): void {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((value, index) => value !== expectedSorted[index])
  ) {
    fail(
      `${label} mismatch: expected ${expectedSorted.join(", ")}, got ${actualSorted.join(", ")}`,
    );
  }
}

function frontmatter(markdown: string, pathname: string): FrontmatterFields {
  if (!markdown.startsWith("---\n")) {
    fail(`Missing YAML frontmatter: ${pathname}`);
  }
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    fail(`Unclosed YAML frontmatter: ${pathname}`);
  }
  const body = markdown.slice(4, end).trim();
  const lines = body.split(/\r?\n/);
  const fields: FrontmatterFields = {};
  let current: string | null = null;
  for (const line of lines) {
    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (match) {
      current = match[1] ?? null;
      if (current === null) continue;
      fields[current] = match[2] ?? "";
    } else if (/^\s+\S/.test(line) && current) {
      fields[current] = `${fields[current]}\n${line}`;
    }
  }
  return fields;
}

function assertNoHarnessRoutingInOpenCodeConfig(config: Record<string, unknown>): void {
  const serialized = JSON.stringify(config);
  if (HARNESS_ROUTING_KEYS.some((key) => serialized.includes(key))) {
    fail("opencode.json contains harness-owned routing policy");
  }
}

function assertNoLocalPluginPathInOpenCodeConfig(config: Record<string, unknown>): void {
  const plugins = config.plugin ?? config.plugins ?? [];
  if (!Array.isArray(plugins)) return;
  for (const entry of plugins) {
    const value = typeof entry === "string" ? entry : JSON.stringify(entry);
    if (/^\.{1,2}\//.test(value) || value.includes(".opencode/plugins/")) {
      fail("opencode.json must not list local plugin file paths");
    }
  }
}

function assertLabelsPresent() {
  const haystack = [
    read(".opencode/skills/delegation-orchestrator/SKILL.md"),
    ...COMMANDS.map((command) => read(`.opencode/commands/${command}.md`)),
  ].join("\n");
  for (const label of [
    "### Delegation Parameters",
    "**Provider Model**",
    "**Routing Config**",
    "routingServiceUrl",
    "localModelEnabled",
    "preferLocal",
    "localModelFallback",
  ]) {
    if (!haystack.includes(label)) {
      fail(`Missing routing preservation label: ${label}`);
    }
  }
  if (!/do not invent/i.test(haystack)) {
    fail("Delegation surfaces must state that absent routing metadata values are not invented");
  }
}

function assertPriorProjectionReferences() {
  const files = walk(".opencode")
    .filter(
      (pathname: string) =>
        ![
          ".opencode/portable.manifest.json",
          ".opencode/bootstrap/native/darwin-portable-fs.universal",
        ].includes(pathname),
    )
    .concat(["opencode.json"]);
  const priorProjectionTokens = ["." + "agents", "." + "codex"];
  for (const pathname of files) {
    const text = fs.readFileSync(path.join(ROOT, pathname), "utf8");
    if (priorProjectionTokens.some((token) => text.includes(token))) {
      fail(`Runtime OpenCode artifact references prior projection path: ${pathname}`);
    }
  }
}

function expectedManifestPaths() {
  return [
    ...STATIC_MANIFEST_PATHS,
    ...ROLES.map((role) => `.opencode/agents/${role}.md`),
    ...COMMANDS.map((command) => `.opencode/commands/${command}.md`),
  ];
}

function assertCompleteSourceInventory() {
  const discovered = walk(".opencode").filter(
    (pathname: string) =>
      !pathname.startsWith(".opencode/node_modules/") && !SOURCE_INVENTORY_EXCLUSIONS.has(pathname),
  );
  sameSet(
    discovered,
    expectedManifestPaths().filter((pathname) => pathname.startsWith(".opencode/")),
    "source .opencode inventory",
  );
}

function assertManifest(manifest: SourceManifest): void {
  const rootOwned = new Set([
    "docs/refinement-evaluation.md",
    "opencode.json",
    "AGENTS.md",
    "README.md",
    "opencode-harness.design.md",
    "package.json",
    "package-lock.json",
    "eslint.config.mjs",
    "tsconfig.json",
    "bin/opencode-harness.mjs",
    "bin/opencode-harness.ts",
  ]);
  const staticMemoryOwned = new Set(STATIC_MEMORY_PATHS);
  const paths = manifest.artifacts.map((artifact) => artifact.path);
  if (paths.length !== expectedManifestPaths().length)
    fail(
      `Source manifest must contain exactly ${expectedManifestPaths().length} artifacts; got ${paths.length}`,
    );
  sameSet(paths, expectedManifestPaths(), "manifest artifact paths");

  const seen = new Set();
  const priorProjectionRoots = ["." + "agents/", "." + "codex/"];
  for (const artifact of manifest.artifacts) {
    if (!artifact.path || typeof artifact.path !== "string") {
      fail(".opencode/harness.manifest.json contains an artifact without a string path");
    }
    if (seen.has(artifact.path)) {
      fail(`Duplicate manifest artifact path: ${artifact.path}`);
    }
    seen.add(artifact.path);
    if (priorProjectionRoots.some((root) => artifact.path.startsWith(root))) {
      fail(`Manifest must not list prior projection path: ${artifact.path}`);
    }
    if (
      !artifact.path.startsWith(".opencode/") &&
      !rootOwned.has(artifact.path) &&
      !staticMemoryOwned.has(artifact.path)
    ) {
      fail(`Manifest lists non-OpenCode project artifact: ${artifact.path}`);
    }
    if (artifact.owner !== "harness-owned") {
      fail(`Manifest artifact must be harness-owned: ${artifact.path}`);
    }
    file(artifact.path);
  }
  if (seen.has(".opencode/routing/harness-model-routing.json")) {
    fail("Manifest must not own the operator routing override");
  }
  const example = manifest.artifacts.find(
    (artifact) => artifact.path === ".opencode/routing/harness-model-routing.example.json",
  );
  if (example?.kind !== "harness-routing-config")
    fail("Manifest must classify the routing example as harness-routing-config");
  for (const [pathname, kind] of [
    [".opencode/bootstrap/native/darwin-portable-fs.c", "portable-native-source"],
    [".opencode/bootstrap/native/darwin-portable-fs.universal", "portable-native-binary"],
    [".opencode/scripts/build-darwin-portable-fs.mts", "native-release-build-source"],
    [".opencode/scripts/darwin-portable-fs.test.mts", "native-release-test-source"],
  ])
    if (manifest.artifacts.find((artifact) => artifact.path === pathname)?.kind !== kind)
      fail(`Manifest native artifact classification differs for ${pathname}`);
  if (!seen.has(".opencode/routing/routing-config-loader.mjs"))
    fail("Manifest must own the shared routing config loader");
  if (!seen.has(".opencode/portable.manifest.json"))
    fail("Source manifest must own the portable profile manifest without conflating profiles");
}

function assertRoutingConfigSplit() {
  const ignoreLines = read(".gitignore").split(/\r?\n/).filter(Boolean);
  const exactRule = "/.opencode/routing/harness-model-routing.json";
  if (ignoreLines.filter((line) => line === exactRule).length !== 1) {
    fail(`.gitignore must contain exactly one rooted operator routing rule: ${exactRule}`);
  }
  for (const pathname of [
    ".opencode/routing/resolve-model-routing.mjs",
    ".opencode/routing/model-routing-helper.mjs",
    ".opencode/plugin-modules/role-model-routing-enforcement.js",
  ]) {
    const source = read(pathname);
    if (
      source.includes("harness-model-routing.json") ||
      source.includes("harness-model-routing.example.json")
    ) {
      fail(`${pathname} must delegate routing filename precedence to routing-config-loader.mjs`);
    }
  }
}

function assertRoutingSchema(schema: SchemaNode): void {
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") {
    fail("Harness routing schema must declare JSON Schema draft 2020-12");
  }
  if (!Array.isArray(schema.oneOf) || schema.$defs?.routing?.additionalProperties !== false) {
    fail(
      "Harness routing schema must cover wrapped/unwrapped documents with a closed routing object",
    );
  }
  for (const boundary of ["roleOverride", "commandOverride", "modelVariant"]) {
    if (schema.$defs?.[boundary]?.additionalProperties !== false) {
      fail(`Harness routing schema boundary must reject unknown keys: ${boundary}`);
    }
  }
  if (
    schema.$defs?.catalogEntry?.$ref !== "harness-endpoint-catalog.schema.json#/$defs/catalogEntry"
  ) {
    fail("Harness routing schema must reference the canonical endpoint catalog entry");
  }
  const localRouting = schema.$defs?.routing?.properties?.localRouting;
  const forceDependency = localRouting?.allOf?.some(
    (constraint) =>
      constraint?.if?.properties?.forceLocalForHarnessSubagents?.const === true &&
      constraint?.then?.properties?.enabled?.const === true,
  );
  if (!forceDependency) {
    fail(
      "Harness routing schema must require enabled:true when forceLocalForHarnessSubagents is true",
    );
  }
  for (const collection of ["commandOverrides", "orchestratorCommands"]) {
    if (schema.$defs?.routing?.properties?.[collection]?.propertyNames?.pattern !== "^/") {
      fail(`Harness routing schema must require slash-prefixed ${collection} keys`);
    }
  }
  const policySource = read(".opencode/routing/routing-policy.mjs");
  if (/\bajv\b|from\s+['"][^'"]+['"]/.test(policySource)) {
    fail("Routing policy must remain dependency-free and must not import Ajv or other modules");
  }
}

function assertRuntimeManifest(runtimeManifest: RuntimeManifest): void {
  if (
    !Array.isArray(runtimeManifest.generatedEntries) ||
    Object.hasOwn(runtimeManifest, "generatedFiles")
  )
    fail("Runtime manifest must use the typed generatedEntries allowlist");
  const expected = [
    ".gitignore",
    ".harness-runtime.json",
    "bun.lock",
    "bun.lockb",
    "node_modules",
    "package-lock.json",
    "package.json",
  ];
  sameSet(
    runtimeManifest.generatedEntries.map((entry) => entry.path),
    expected,
    "runtime generated-entry allowlist",
  );
  for (const entry of runtimeManifest.generatedEntries) {
    if (
      !["file", "directory"].includes(entry.kind) ||
      typeof entry.recursive !== "boolean" ||
      typeof entry.required !== "boolean" ||
      !/^0[67]00$|^0644$/.test(entry.mode)
    )
      fail(`Invalid typed generated-entry rule: ${entry.path}`);
    if (entry.recursive !== (entry.path === "node_modules"))
      fail(`Only node_modules may be recursive in generated entries: ${entry.path}`);
  }
  const destinations = runtimeManifest.files.map((entry) => entry.destination);
  for (const module of [
    "task-contracts.js",
    "dispatch-controller.js",
    "acceptance-proof.js",
    "context-budget.js",
    "compaction-handoff.js",
    "managed-execution.js",
    "operator-approved-artifact-install.js",
    "operator-approved-archive-install.js",
    "external-win64-relaunch.js",
    "managed-dispatch.js",
    "v2-dispatch-bridge.js",
    "v2-native-plugin.js",
  ])
    if (!destinations.includes(`plugin-modules/${module}`))
      fail(`Missing runtime module: ${module}`);
  if (!destinations.includes("schemas/opencode-provider-projection.schema.json"))
    fail("Runtime manifest must include the provider projection schema");
  if (
    runtimeManifest.files.length !== 52 ||
    !destinations.includes("plugin-modules/task-thread-policy.js") ||
    !destinations.includes("plugin-modules/trace-root-permissions.js")
  )
    fail(
      "Runtime manifest must contain the exact 52-file external runtime including compaction handoff and scoped external actions",
    );
  const packageManifest = json("package.json");
  if (
    packageManifest.version !== "0.1.15" ||
    runtimeManifest.packageVersion !== packageManifest.version
  )
    fail("Package and runtime manifest versions must both equal 0.1.15");
  if (runtimeManifest.compatibility?.opencode !== undefined)
    fail("Runtime manifest must not impose an OpenCode version gate");
  if (
    !Array.isArray(packageManifest.files) ||
    packageManifest.files.filter((pathname: string) => pathname === "README.md").length !== 1
  )
    fail("Package files must include README.md exactly once");
  for (const pathname of [".opencode/bootstrap", ".opencode/plugin-modules"]) {
    if (packageManifest.files.includes(pathname))
      fail(`Package files must not include broad source-only directory: ${pathname}`);
  }
  for (const pathname of [
    ".opencode/bootstrap/native/darwin-portable-fs.c",
    ".opencode/bootstrap/native/darwin-portable-fs.universal",
    ".opencode/plugin-modules/task-thread-policy.test.mjs",
  ]) {
    if (packageManifest.files.includes(pathname))
      fail(`Package files must exclude source-only payload: ${pathname}`);
  }
  const launcher = read("bin/opencode-harness.mjs");
  if (!/value\.packageVersion\s*!==\s*["']0\.1\.15["']/.test(launcher))
    fail("Runtime launcher must reject package versions other than 0.1.15");
  for (const snippet of [
    "diagnosticVersion",
    "opencode-${encodeURIComponent(opencodeVersion)}",
    '"@opencode-ai/plugin": pluginVersion',
  ])
    if (!launcher.includes(snippet))
      fail(`Runtime launcher compatibility policy is missing: ${snippet}`);
  if (
    !launcher.includes(
      "opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]",
    )
  )
    fail("Runtime launcher help must expose the exact validate-inputs grammar");
  for (const pathname of [
    "../.opencode/routing/routing-config-loader.mjs",
    "../.opencode/routing/routing-policy.mjs",
  ])
    if (!launcher.includes(pathname))
      fail(`Runtime launcher packaged import is missing: ${pathname}`);
  for (const snippet of [
    '"OPENCODE_DB"',
    "OPENCODE_DB: snapshot.database",
    '"opencode.db-wal"',
    '"opencode.db-shm"',
    "parentIdentity",
    "directoryIdentity",
    ".quarantine-",
    "removeContainedEntry",
    "retained launch:",
    "retained quarantine:",
    "quarantine dev/ino",
    "quarantine path still exists after recursive unlink",
  ]) {
    if (!launcher.includes(snippet))
      fail(`Runtime launcher database isolation is missing: ${snippet}`);
  }
  const design = read("opencode-harness.design.md");
  for (const snippet of [
    "opencode-harness-runtime` 0.1.15",
    "/0.1.15/opencode-<reported-version>/runtime",
    "0.1.14",
    "validate-inputs",
  ]) {
    if (!design.includes(snippet)) fail(`Runtime release documentation is missing: ${snippet}`);
  }
  const readme = read("README.md");
  for (const snippet of [
    "OpenCode Harness Runtime 0.1.15",
    "opencode-harness-runtime-0.1.15.tgz",
    "Package version `0.1.15`",
    "retained version `0.1.14`",
    "no OpenCode version allowlist",
    "opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]",
  ]) {
    if (!readme.includes(snippet))
      fail(`Runtime README release documentation is missing: ${snippet}`);
  }
}

function assertExactPackagePayload(runtimeManifest: RuntimeManifest): void {
  const packageManifest = json("package.json");
  const scripts = packageManifest.scripts;
  const devDependencies = packageManifest.devDependencies;
  if (
    typeof scripts !== "object" ||
    scripts === null ||
    Array.isArray(scripts) ||
    typeof scripts.format !== "string" ||
    !scripts.format.includes("prettier --write") ||
    !scripts.format.includes("eslint --fix") ||
    typeof scripts["check:format"] !== "string" ||
    !scripts["check:format"].includes("prettier --check") ||
    !scripts["check:format"].includes("&& eslint ")
  )
    fail("Package formatting scripts must combine Prettier with ESLint stylistic enforcement");
  if (
    typeof devDependencies !== "object" ||
    devDependencies === null ||
    Array.isArray(devDependencies) ||
    devDependencies.eslint !== "10.9.1" ||
    devDependencies["@stylistic/eslint-plugin"] !== "5.10.0" ||
    devDependencies["typescript-eslint"] !== "8.68.0"
  )
    fail("Package must pin the approved ESLint TypeScript stylistic toolchain");
  if (packageManifest.files.length !== 42 || new Set(packageManifest.files).size !== 42)
    fail("Package files selector allowlist must contain exactly 42 unique entries");
  const selectors = [
    ".opencode/plugin-modules/task-contracts.js",
    ".opencode/plugin-modules/dispatch-controller.js",
    ".opencode/plugin-modules/acceptance-proof.js",
    ".opencode/plugin-modules/context-budget.js",
    ".opencode/plugin-modules/compaction-handoff.js",
    ".opencode/plugin-modules/managed-execution.js",
    ".opencode/plugin-modules/operator-approved-artifact-install.js",
    ".opencode/plugin-modules/operator-approved-archive-install.js",
    ".opencode/plugin-modules/external-win64-relaunch.js",
    ".opencode/plugin-modules/managed-dispatch.js",
    ".opencode/plugin-modules/v2-dispatch-bridge.js",
    ".opencode/plugin-modules/v2-native-plugin.js",
    "README.md",
    "bin/opencode-harness.mjs",
    ".opencode/runtime.manifest.json",
    ".opencode/agents",
    ".opencode/agents/researcher.md",
    ".opencode/commands/delegate-*.md",
    ".opencode/skills/delegation-orchestrator/SKILL.md",
    ".opencode/skills/interactive-refinement/SKILL.md",
    ".opencode/skills/delegation-orchestrator/references/role-routing-matrix.md",
    ".opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md",
    ".opencode/skills/delegation-orchestrator/references/validation-checklist.md",
    ".opencode/contracts",
    ".opencode/schemas",
    ".opencode/routing/harness-model-routing.example.json",
    ".opencode/routing/harness-model-routing.local.example.json",
    ".opencode/routing/model-routing-helper.mjs",
    ".opencode/routing/resolve-model-routing.mjs",
    ".opencode/routing/routing-config-loader.mjs",
    ".opencode/routing/routing-policy.mjs",
    ".opencode/plugins",
    ".opencode/plugin-modules/harness-lifecycle.js",
    ".opencode/plugin-modules/task-thread-policy.js",
    ".opencode/plugin-modules/role-model-routing-enforcement.js",
    ".opencode/plugin-modules/trace-root-permissions.js",
    ".opencode/bootstrap/memory/INDEX.md",
    ".opencode/bootstrap/memory/protocols/memory-management.md",
    ".opencode/bootstrap/memory/templates/orchestration-index.md",
    ".opencode/bootstrap/memory/templates/compaction-handoff.md",
    ".opencode/bootstrap/memory/templates/role-trace-artifact.md",
    ".opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md",
  ];
  sameSet(packageManifest.files, selectors, "exact package selector allowlist");
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], { cwd: ROOT, encoding: "utf8" });
  if (result.status !== 0)
    fail(`npm pack dry-run failed: ${(result.stderr || result.stdout).trim()}`);
  let reports: PackReport[];
  try {
    const parsed: unknown = JSON.parse(result.stdout);
    assertPackReports(parsed);
    reports = parsed;
  } catch (error) {
    fail(`npm pack dry-run returned malformed JSON: ${errorMessage(error)}`);
  }
  if (!Array.isArray(reports) || reports.length !== 1)
    fail("npm pack dry-run must return one package report");
  const report = reports[0];
  if (!report) fail("npm pack dry-run must return one package report");
  if (
    report.name !== "opencode-harness-runtime" ||
    report.version !== "0.1.15" ||
    !Array.isArray(report.files)
  )
    fail("npm pack report identity is invalid");
  const actual = report.files.map((entry) => entry.path);
  if (actual.some((pathname) => pathname === "dashboard" || pathname.startsWith("dashboard/")))
    fail("npm payload must exclude the source-only dashboard");
  const expected = [
    "package.json",
    "README.md",
    "bin/opencode-harness.mjs",
    ".opencode/runtime.manifest.json",
    ...runtimeManifest.files.map((entry) => entry.source),
  ];
  if (actual.length !== 56 || new Set(actual).size !== 56)
    fail(`npm payload must contain exactly 56 unique paths; got ${actual.length}`);
  sameSet(actual, expected, "exact npm payload allowlist");
  const launcher = report.files.find((entry) => entry.path === "bin/opencode-harness.mjs");
  if (!launcher || launcher.mode !== 0o755) fail("npm payload launcher must retain mode 0755");
  for (const forbidden of [
    ".opencode/plugin-modules/trace-root-permissions.test.mjs",
    ".opencode/bootstrap/native/darwin-portable-fs.c",
    ".opencode/bootstrap/native/darwin-portable-fs.universal",
  ])
    if (actual.includes(forbidden))
      fail(`npm payload includes forbidden source-only path: ${forbidden}`);
}

function assertProviderProjectionSchema(schema: SchemaNode): void {
  const model =
    schema.properties?.provider?.patternProperties?.["^ai-infra-[a-z][a-z0-9-]{0,31}$"]?.properties
      ?.models?.patternProperties?.["^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$"];
  sameSet(
    model?.required ?? [],
    ["name", "limit", "options"],
    "provider projection model required fields",
  );
  if (model?.additionalProperties !== false)
    fail("Provider projection model must reject unknown fields");
  const options = model?.properties?.options;
  sameSet(
    options?.required ?? [],
    ["chat_template_kwargs"],
    "provider projection model options required fields",
  );
  if (options?.additionalProperties !== false)
    fail("Provider projection model options must reject unknown fields");
  const chatTemplate = options?.properties?.chat_template_kwargs;
  sameSet(
    chatTemplate?.required ?? [],
    ["enable_thinking"],
    "provider projection chat template required fields",
  );
  if (
    chatTemplate?.additionalProperties !== false ||
    chatTemplate?.properties?.enable_thinking?.type !== "boolean"
  ) {
    fail(
      "Provider projection enable_thinking must be an exact boolean in a closed chat_template_kwargs object",
    );
  }
}

function assertLoop2TrustDocs() {
  const combined = `${read("AGENTS.md")}\n${read("opencode-harness.design.md")}`;
  for (const phrase of [
    "lexical-canonical",
    "already-existing current-user mode-0700",
    "group/world-writable worktrees",
    "rechecked after the version probe",
    "Custom `skills.paths`",
    "`OPENCODE_BIN` is explicit operator selection",
    "first executable `opencode` candidate",
    "stream file content through fixed-size buffers",
  ]) {
    if (!combined.includes(phrase)) fail(`Runtime trust documentation is missing: ${phrase}`);
  }
}

async function assertRouting(routingConfig: RoutingDocument): Promise<void> {
  const policy = await import(
    pathToFileURL(path.join(ROOT, ".opencode/routing/routing-policy.mjs")).href
  );
  const routing: NormalizedRouting = policy.normalizeAndValidateRoutingConfig(routingConfig);
  if (routing.schemaVersion !== "2.0.0") fail("Routing must use exact schemaVersion 2.0.0");
  if (
    routing.defaultModel !== null ||
    routing.singleModel.enabled ||
    routing.singleModel.model !== null ||
    routing.localRouting.enabled ||
    routing.localRouting.forceLocalForHarnessSubagents ||
    routing.localRouting.defaultLocalModel !== null ||
    Object.keys(routing.localRouting.models).length !== 0
  ) {
    fail("Committed routing example must be neutral and provider-free");
  }
  sameSet(Object.keys(routing.roleOverrides ?? {}), ROLES, "routing roleOverrides");
  sameSet(
    Object.values(routing.commandOverrides ?? {}).map((entry) => entry.agent),
    Object.values(COMMAND_ROLE_MAP),
    "routing commandOverride agents",
  );
  for (const [command, role] of Object.entries(COMMAND_ROLE_MAP)) {
    const pathname = `/${command}`;
    if (routing.commandOverrides?.[pathname]?.agent !== role) {
      fail(`Routing command override ${pathname} must route to ${role}`);
    }
  }
  const orchestrationEntry = routing.orchestratorCommands?.["/delegate-orchestration"];
  if (!orchestrationEntry) {
    fail("Routing must include orchestrator command /delegate-orchestration");
  }
  if (orchestrationEntry.owner !== "orchestrator") {
    fail("/delegate-orchestration must be owned by orchestrator");
  }
  if (orchestrationEntry.agent !== null) {
    fail("/delegate-orchestration must not assign a subagent");
  }
  if (Object.values(routing.roleOverrides).some((entry) => entry.model !== null)) {
    fail("Committed native roleOverrides models must remain null");
  }
  const clone = (value: RoutingDocument): RoutingDocument => structuredClone(value);
  const invalidForce = clone(routingConfig);
  invalidForce.harnessModelRouting.localRouting.enabled = false;
  invalidForce.harnessModelRouting.localRouting.forceLocalForHarnessSubagents = true;
  expectThrows(
    "force dependency parity",
    () => policy.normalizeAndValidateRoutingConfig(invalidForce),
    /requires enabled:true/,
  );
  const invalidOrchestrator = clone(routingConfig);
  const orchestrationCommand =
    invalidOrchestrator.harnessModelRouting.orchestratorCommands["/delegate-orchestration"];
  if (!orchestrationCommand) fail("routing fixture is missing /delegate-orchestration");
  invalidOrchestrator.harnessModelRouting.orchestratorCommands.bad = orchestrationCommand;
  delete invalidOrchestrator.harnessModelRouting.orchestratorCommands["/delegate-orchestration"];
  expectThrows(
    "orchestrator command key parity",
    () => policy.normalizeAndValidateRoutingConfig(invalidOrchestrator),
    /command keys must start with \/$/,
  );
}

async function assertRoutingResolver(
  routingConfig: RoutingDocument,
  expectedCatalogName: string | null,
): Promise<void> {
  const { resolveRoutingDecision } = await import(
    pathToFileURL(path.join(ROOT, ".opencode/routing/routing-policy.mjs")).href
  );
  const decision = resolveRoutingDecision({
    config: routingConfig,
    request: { command: "/delegate-implement" },
  });
  if (decision.agent !== "implementer" || decision.sources.agent !== "commandOverride") {
    fail("Routing resolver must lock /delegate-implement to implementer");
  }
  if (
    decision.local.enforced ||
    decision.local.networkCalls ||
    decision.local.catalogName !== expectedCatalogName
  ) {
    fail(
      `Resolver decision must be network-free with expected catalog identity ${expectedCatalogName}`,
    );
  }
  if (
    Object.hasOwn(decision, "localModel") ||
    Object.hasOwn(decision.local, "effectiveFallbackModel")
  ) {
    fail("Routing resolver must not emit legacy localModel output");
  }
}

function assertRoleContracts(contract: RoleContract): void {
  sameSet(Object.keys(contract.roles ?? {}), ROLES, "role contract roles");
  if (contract.memoryProtocol !== ".memory/protocols/memory-management.md") {
    fail("Role contract catalog must reference the memory management protocol");
  }
  if (contract.traceArtifactSchema !== ".opencode/schemas/memory-trace-artifact.schema.json") {
    fail("Role contract catalog must reference the memory trace artifact schema");
  }
  for (const role of ROLES) {
    const entry = contract.roles[role];
    if (!entry?.inputContract?.required?.length) {
      fail(`Missing input contract required fields for role: ${role}`);
    }
    for (const field of ["delegationTaskId", "scopeKey", "dispatchKind", "taskMode"]) {
      if (!entry.inputContract.required.includes(field))
        fail(`Role ${role} input contract is missing ${field}`);
    }
    if (!entry?.outputContract?.required?.length) {
      fail(`Missing output contract required fields for role: ${role}`);
    }
    if (!entry?.traceArtifact?.pathTemplate?.includes(`roles/${role}/`)) {
      fail(`Missing role-specific trace artifact path for role: ${role}`);
    }
    if (!entry?.verificationExpectations?.length) {
      fail(`Missing verification expectations for role: ${role}`);
    }
  }
  const expectedModes = {
    researcher: ["research"],
    planner: ["plan", "synthesis"],
    implementer: ["implementation", "integration"],
    validator: ["validation", "review", "artifact-proof", "integration-check"],
  };
  for (const role of ROLES)
    sameSet(contract.roles[role].taskModes ?? [], expectedModes[role], `task modes for ${role}`);
}

function assertTraceAlignment(contract: RoleContract): void {
  const schema = json(TRACE_SCHEMA_PATH);
  sameSet(schema.required ?? [], TRACE_FIELDS, "trace schema required fields");
  for (const role of ROLES) {
    sameSet(
      contract.roles[role].traceArtifact.requiredFields ?? [],
      schema.required,
      `trace fields for ${role}`,
    );
  }
  const template = read(".memory/templates/role-trace-artifact.md");
  for (const heading of [
    "## Metadata",
    "## Input Contract",
    "## Work Performed",
    "## Output Contract",
    "## Handoff",
  ]) {
    if (!template.includes(heading))
      fail(`Source trace template is missing schema section: ${heading}`);
  }
  for (const field of TRACE_FIELDS.slice(0, 4)) {
    if (!template.includes(`- ${field}:`)) fail(`Source trace template is missing field: ${field}`);
  }
}

function assertMemorySeeds() {
  for (const relative of [
    "protocols/memory-management.md",
    "templates/orchestration-index.md",
    "templates/compaction-handoff.md",
    "templates/role-trace-artifact.md",
    "templates/interactive-refinement-test-plan.md",
  ]) {
    const source = `.memory/${relative}`;
    const seed = `.opencode/bootstrap/memory/${relative}`;
    if (read(source) !== read(seed))
      fail(`Portable memory seed differs from source canonical file: ${relative}`);
  }
  const portableManifest = json(".opencode/portable.manifest.json");
  const mappings = portableManifest.memorySeeds ?? [];
  if (portableManifest.managedFiles?.length !== 65 || mappings.length !== 6)
    fail("Portable manifest must contain exactly 65 managed files plus six memory seeds");
  const expectedTargets = [
    ".memory/INDEX.md",
    ".memory/protocols/memory-management.md",
    ".memory/templates/orchestration-index.md",
    ".memory/templates/compaction-handoff.md",
    ".memory/templates/role-trace-artifact.md",
    ".memory/templates/interactive-refinement-test-plan.md",
  ];
  sameSet(
    mappings.map((entry: { target: string }) => entry.target),
    expectedTargets,
    "portable memory seed targets",
  );
}

function assertMemoryIndex() {
  const index = read(".memory/INDEX.md");
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    const relative = memoryPath.replace(/^\.memory\//, "");
    if (!index.includes(relative)) {
      fail(`.memory/INDEX.md must index static memory path: ${relative}`);
    }
  }

  const orchestrationRoot = path.join(ROOT, ".memory/orchestrations");
  if (!fs.existsSync(orchestrationRoot) || !fs.statSync(orchestrationRoot).isDirectory()) {
    fail("Source validation requires .memory/orchestrations history");
  }
  const orchestrationFiles = walk(".memory/orchestrations")
    .filter((pathname) => pathname.endsWith(".md"))
    .map((pathname) => pathname.replace(/^\.memory\//, ""));
  if (orchestrationFiles.length === 0)
    fail("Source validation requires indexed orchestration history");
  const indexedOrchestrations = [...index.matchAll(/`(orchestrations\/[^`]+\/INDEX\.md)`/g)].map(
    (match) => match[1],
  );
  if (indexedOrchestrations.length === 0)
    fail(".memory/INDEX.md must index retained orchestration history");
  for (const pathname of indexedOrchestrations) {
    file(`.memory/${pathname}`);
  }
}

function assertOpenCodeReferences() {
  const references = read(".memory/references/opencode-refs.md");
  if (!/^Retrieval date: \d{4}-\d{2}-\d{2}$/m.test(references)) {
    fail(".memory/references/opencode-refs.md must include a retrieval date");
  }
  for (const url of [
    "https://opencode.ai/docs",
    "https://opencode.ai/docs/config",
    "https://opencode.ai/docs/agents",
    "https://opencode.ai/docs/commands",
    "https://opencode.ai/docs/skills",
    "https://opencode.ai/docs/plugins",
  ]) {
    if (!references.includes(url)) {
      fail(`.memory/references/opencode-refs.md missing official OpenCode URL: ${url}`);
    }
  }
  if (!/short descriptions|Short descriptions/.test(references)) {
    fail(".memory/references/opencode-refs.md must state that URL descriptions are included");
  }
}

function writeTempRouting(dir: string, config: unknown): string {
  const pathname = path.join(dir, `${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(pathname, JSON.stringify(config), "utf8");
  return pathname;
}

function expectThrows(label: string, fn: () => unknown, pattern: RegExp): void {
  try {
    fn();
  } catch (error) {
    const message = errorMessage(error);
    if (!pattern.test(message)) {
      fail(`${label} threw unexpected error: ${message}`);
    }
    return;
  }
  fail(`${label} must throw`);
}

async function assertRoleModelRoutingEnforcement(
  neutralRoutingConfig: RoutingDocument,
  localRoutingConfig: RoutingDocument,
): Promise<void> {
  const modulePath = path.join(ROOT, ".opencode/plugin-modules/role-model-routing-enforcement.js");
  const { applyHarnessRoleModelOverrides, resolveHarnessRoutingPath } = await import(
    pathToFileURL(modulePath).href
  );
  if (typeof applyHarnessRoleModelOverrides !== "function") {
    fail("Role model routing enforcement module must export applyHarnessRoleModelOverrides");
  }
  if (typeof resolveHarnessRoutingPath !== "function") {
    fail("Role model routing enforcement module must export resolveHarnessRoutingPath");
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-harness-routing-"));
  const clone = <T,>(value: T): T => structuredClone(value);
  const cfgWithAgents = () => {
    const agent: Record<string, { mode: string; model?: string }> = {
      researcher: { mode: "subagent" },
      planner: { mode: "subagent" },
      implementer: { mode: "subagent" },
      validator: { mode: "subagent" },
    };
    return {
      agent,
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
  };

  const previousCwd = process.cwd();
  const cwdSubdir = path.join(tempDir, "subdir");
  fs.mkdirSync(cwdSubdir);
  try {
    process.chdir(cwdSubdir);
    const defaultCfg = cfgWithAgents();
    applyHarnessRoleModelOverrides(defaultCfg, { routingDocument: neutralRoutingConfig });
    if (ROLES.some((role) => Object.hasOwn(defaultCfg.agent[role]!, "model"))) {
      fail(
        "Committed non-force config must preserve null roleOverrides without own model mutation",
      );
    }
    const projectSubdirPath = path.join(ROOT, ".opencode/plugin-modules");
    if (
      !path.isAbsolute(
        resolveHarnessRoutingPath({
          routingPath: ".opencode/routing/harness-model-routing.example.json",
        }),
      )
    ) {
      fail("Plugin explicit routing path must resolve exactly to an absolute path");
    }
  } finally {
    process.chdir(previousCwd);
  }

  const forceRouting = clone(localRoutingConfig);
  forceRouting.harnessModelRouting.providerClassMode = "local-only";
  forceRouting.harnessModelRouting.localRouting.forceLocalForHarnessSubagents = true;
  const forceCfg = cfgWithAgents();
  const providerBefore = clone(forceCfg.provider);
  applyHarnessRoleModelOverrides(forceCfg, {
    routingPath: writeTempRouting(tempDir, forceRouting),
  });
  if (ROLES.some((role) => !Object.hasOwn(forceCfg.agent[role]!, "model"))) {
    fail("Force-local enforcement must assign all four agents");
  }
  if (JSON.stringify(forceCfg.provider) !== JSON.stringify(providerBefore)) {
    fail("Force-local enforcement must not mutate providers");
  }

  const failureCfg = cfgWithAgents();
  delete failureCfg.agent.validator;
  const failureBefore = clone(failureCfg);
  expectThrows(
    "fourth-role atomic preflight",
    () =>
      applyHarnessRoleModelOverrides(failureCfg, {
        routingPath: writeTempRouting(tempDir, forceRouting),
      }),
    /validator/,
  );
  if (JSON.stringify(failureCfg) !== JSON.stringify(failureBefore)) {
    fail("Failed fourth-role preflight must not partially mutate agents or providers");
  }

  expectThrows(
    "unreadable routing JSON",
    () =>
      applyHarnessRoleModelOverrides(
        { agent: {} },
        { routingPath: path.join(tempDir, "missing.json") },
      ),
    /Unable to read routing config/,
  );

  const malformedRoutingPath = path.join(tempDir, "malformed-routing.json");
  fs.writeFileSync(malformedRoutingPath, '{"harnessModelRouting":', "utf8");
  expectThrows(
    "malformed routing JSON",
    () => applyHarnessRoleModelOverrides({ agent: {} }, { routingPath: malformedRoutingPath }),
    /Malformed routing config JSON/,
  );
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function assertPortableValidator() {
  const result = spawnSync(
    process.execPath,
    [".opencode/scripts/validate-portable-harness.mjs", "--root", ROOT],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    fail(`Portable validator failed during source QA: ${(result.stderr || result.stdout).trim()}`);
  }
  if (result.stdout.trim() !== "Portable OpenCode harness validation passed") {
    fail(`Portable validator returned unexpected output: ${result.stdout.trim()}`);
  }
}

function assertDarwinNativeAssets() {
  const portable = json(".opencode/portable.manifest.json");
  const helper = portable.writeCapabilities?.backends?.darwin?.helper;
  const binaryPath = ".opencode/bootstrap/native/darwin-portable-fs.universal";
  if (
    helper?.path !== binaryPath ||
    helper.protocol !== 1 ||
    helper.minimumMacOS !== "11.0" ||
    helper.signing !== "adhoc-all-slices-no-team-id-materialized-private-copy"
  ) {
    fail("Portable manifest Darwin native helper contract is incomplete");
  }
  sameSet(helper.architectures ?? [], ["arm64", "x86_64"], "Darwin helper architectures");
  const bytes = fs.readFileSync(file(binaryPath));
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== helper.sha256)
    fail("Source QA Darwin helper SHA-256 differs from portable manifest");
  if (bytes.readUInt32BE(0) !== 0xcafebabe || bytes.readUInt32BE(4) !== 2)
    fail("Source QA expected a two-slice FAT32 Darwin helper");
  const cpuTypes = [bytes.readUInt32BE(8), bytes.readUInt32BE(28)];
  sameSet(cpuTypes, [0x01000007, 0x0100000c], "Darwin helper FAT CPU types");
  const portableManaged = new Set(portable.managedFiles ?? []);
  for (const pathname of [".opencode/bootstrap/native/darwin-portable-fs.c", binaryPath])
    if (!portableManaged.has(pathname))
      fail(`Portable native runtime dependency is not managed: ${pathname}`);
  for (const pathname of [
    ".opencode/scripts/build-darwin-portable-fs.mts",
    ".opencode/scripts/darwin-portable-fs.test.mts",
  ])
    if (portableManaged.has(pathname))
      fail(`Source-only native tooling leaked into portable profile: ${pathname}`);
  if (process.platform === "darwin") {
    const signature = spawnSync(
      "/usr/bin/codesign",
      ["--verify", "--strict", "--all-architectures", binaryPath],
      { cwd: ROOT, encoding: "utf8" },
    );
    if (signature.status !== 0)
      fail(
        `Committed Darwin helper failed all-architecture signature verification: ${(signature.stderr || signature.stdout).trim()}`,
      );
    for (const [script, args] of [
      [".opencode/scripts/build-darwin-portable-fs.mts", ["--check"]],
      [".opencode/scripts/darwin-portable-fs.test.mts", []],
    ] as [string, string[]][]) {
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: ROOT,
        encoding: "utf8",
      });
      if (result.status !== 0)
        fail(`Darwin native QA failed for ${script}: ${(result.stderr || result.stdout).trim()}`);
    }
  } else
    process.stdout.write("Darwin native activation/build checks not run on this non-Darwin host\n");
}

function assertRecursiveOrchestrationDocs() {
  const command = read(".opencode/commands/delegate-orchestration.md");
  for (const snippet of [
    "$ARGUMENTS",
    "delegation-orchestrator/SKILL.md",
    "orchestration-input.schema.json",
    "<<<ORCHESTRATION_REQUEST>>>",
    "<<<END_ORCHESTRATION_REQUEST>>>",
    "Never require the user to write JSON",
  ]) {
    if (!command.includes(snippet)) {
      fail(`delegate-orchestration command missing recursive orchestration detail: ${snippet}`);
    }
  }
  if (/```json\s*\n\$ARGUMENTS\s*\n```/.test(command)) {
    fail("delegate-orchestration must not wrap caller input in a JSON fence");
  }
  const memoryProtocol = read(".memory/protocols/memory-management.md");
  const template = read(".memory/templates/orchestration-index.md");
  const skill = read(".opencode/skills/delegation-orchestrator/SKILL.md");
  for (const snippet of [
    "not a required user prompt format",
    "ordinary language",
    "date-prefixed slug",
    "Default privileged or expansive behavior safely",
    "Ask one concise grouped follow-up",
    "Repair generated or derived structural failures internally",
  ]) {
    if (!skill.includes(snippet))
      fail(`delegation skill missing progressive intake rule: ${snippet}`);
  }
  const inputSchema = json(".opencode/schemas/orchestration-input.schema.json");
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
    inputSchema["x-intake"]?.contract !== "normalized-internal" ||
    inputSchema["x-intake"]?.nestedFieldPolicy !== "inherit-parent-unless-explicit-user-value" ||
    JSON.stringify(inputSchema["x-intake"]?.sourceClasses) !==
      JSON.stringify(["user", "derived", "generated"]) ||
    JSON.stringify(inputSchema["x-intake"]?.fields) !== JSON.stringify(expectedIntakeFields)
  ) {
    fail("orchestration schema must define the exact normalized progressive-intake provenance map");
  }
  sameSet(
    Object.keys(inputSchema.properties ?? {}),
    Object.keys(expectedIntakeFields),
    "orchestration schema intake/property coverage",
  );
  for (const [label, text] of [
    ["memory protocol", memoryProtocol],
    ["orchestration index template", template],
    ["delegation skill", skill],
  ] as [string, string][]) {
    for (const snippet of ["DAG", "research", "planning", "validation"]) {
      if (!text.includes(snippet)) {
        fail(`${label} missing recursive orchestration concept: ${snippet}`);
      }
    }
  }
  if (!template.includes("<scope>-researcher-<sequence>-<slug>")) {
    fail("orchestration index template must show repeatable scoped role instances");
  }
}

function assertAgentContractReferences(role: Role, text: string): void {
  const requiredSnippets = [
    ".memory/protocols/memory-management.md",
    ".opencode/contracts/role-io-contracts.json",
    ".opencode/schemas/memory-trace-artifact.schema.json",
    `.memory/orchestrations/<orchestration-id>/roles/${role}/<artifact-id>.md`,
  ];
  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) {
      fail(`Role ${role} must reference ${snippet}`);
    }
  }
  for (const snippet of [
    "contract-complete Task packet",
    "/delegate-orchestration",
    `@${role}`,
    "refuse",
    "delegation-orchestrator",
    "taskMode",
  ]) {
    if (!text.includes(snippet))
      fail(`Role ${role} direct-dispatch boundary is missing ${snippet}`);
  }
}

async function assertPluginAdapter() {
  const adapter = read(".opencode/plugins/index.js");
  if (!/from ["']\.\.\/plugin-modules\/harness-lifecycle\.js["']/.test(adapter)) {
    fail("Plugin adapter must import segmented harness lifecycle plugin");
  }
  if (!/from ["']\.\.\/plugin-modules\/role-model-routing-enforcement\.js["']/.test(adapter)) {
    fail("Plugin adapter must import role model routing enforcement plugin");
  }
  if (!/from ["']\.\.\/plugin-modules\/trace-root-permissions\.js["']/.test(adapter))
    fail("Plugin adapter must import trace-root permissions");
  if (
    !/export\s+default\s+async\s+function|export\s+default\s+function|export\s+default\s+\w+/.test(
      adapter,
    )
  ) {
    fail("Plugin adapter must have a default export");
  }
  if (/tool\.execute\.before|message\.after|session\.start/.test(adapter)) {
    fail("Plugin adapter must not inline segmented hook logic");
  }
  const autoLoadedPluginFiles = walk(".opencode/plugins").filter((pathname: string) =>
    /\.(?:js|mjs|cjs|ts)$/.test(pathname),
  );
  sameSet(autoLoadedPluginFiles, [".opencode/plugins/index.js"], "auto-loaded plugin files");
  const lifecycle = read(".opencode/plugin-modules/harness-lifecycle.js");
  if (!lifecycle.includes("HarnessLifecyclePlugin")) {
    fail("Segmented lifecycle plugin export must remain separate");
  }
  for (const snippet of [
    'from "./managed-dispatch.js"',
    "await dispatch.beforeTask(input, args ?? {})",
    "output.args = dispatch.beforeTool(input, args ?? {})",
    "dispatch.afterTask(input, output)",
    "dispatch.afterTool(input, output)",
    "dispatch.sessionCreated(properties.info)",
    "dispatch.interrupt",
    "output?.args",
    '"tool.execute.before"',
    '"tool.execute.after"',
    '"session.created"',
  ]) {
    if (!lifecycle.includes(snippet))
      fail(`Lifecycle task-thread adapter is missing current hook detail: ${snippet}`);
  }
  for (const stale of ["input?.args", "session.start", "message.after"])
    if (lifecycle.includes(stale)) fail(`Lifecycle plugin uses stale hook detail: ${stale}`);
  for (const staleRoutingSnippet of [
    "resolvedRouting",
    "injectModelFlag",
    "resolveModelForRole",
    "input.args.command =",
  ]) {
    if (lifecycle.includes(staleRoutingSnippet)) {
      fail(
        `Lifecycle plugin must not perform model injection or cached routing: ${staleRoutingSnippet}`,
      );
    }
  }
  const roleRouting = read(".opencode/plugin-modules/role-model-routing-enforcement.js");
  if (!roleRouting.includes("HarnessRoleModelRoutingEnforcementPlugin")) {
    fail("Segmented role model routing enforcement plugin export must remain separate");
  }
  for (const snippet of [
    "provider-class filters",
    "before any native config mutation",
    "Provider objects are never written",
  ]) {
    if (!roleRouting.includes(snippet)) {
      fail(
        `Role model routing enforcement module must document atomic provider-class scope: ${snippet}`,
      );
    }
  }
  const pluginModule = await import(
    pathToFileURL(path.join(ROOT, ".opencode/plugins/index.js")).href
  );
  if (typeof pluginModule.default !== "function") {
    fail("Plugin adapter dynamic import must expose a default function");
  }
  const hooks = await pluginModule.default({});
  for (const hook of [
    "config",
    "tool.execute.before",
    "tool.execute.after",
    "command.execute.before",
  ])
    if (typeof hooks[hook] !== "function")
      fail(`Plugin adapter must expose reachable ${hook} hook`);
  const traceTestSource = read(".opencode/plugin-modules/trace-root-permissions.test.mjs");
  for (const snippet of [
    'from "./trace-root-permissions.js"',
    "absent and exact workspace memory are no-ops",
    "four external allows and only three trailing md edit allows are role-isolated",
    "probe pair is closed, exclusive, owner-only and exact",
  ]) {
    if (!traceTestSource.includes(snippet))
      fail(`Trace-root permission tests failed: missing contract fixture ${snippet}`);
  }
  const traceResult = spawnSync(
    process.execPath,
    ["--test", ".opencode/plugin-modules/trace-root-permissions.test.mjs"],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (traceResult.status !== 0)
    fail(
      `Trace-root permission tests failed: ${(traceResult.stderr || traceResult.stdout).trim()}`,
    );
}

async function assertTaskThreadPolicy() {
  const policy = read(".opencode/plugin-modules/task-thread-policy.js");
  const policyImports = [...policy.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((match) => match[1]);
  if (
    policyImports.length !== 1 ||
    policyImports[0] !== "./task-contracts.js" ||
    /\brequire\s*\(|\bimport\s*\(/.test(policy)
  )
    fail("Task-thread policy must import only the local typed task contract");
  const policyModule = await import(
    `${pathToFileURL(path.join(ROOT, ".opencode/plugin-modules/task-thread-policy.js")).href}?contract-check=${Date.now()}`
  );
  const contract = json(".opencode/contracts/role-io-contracts.json");
  for (const role of ROLES) {
    const policyFields = policyModule.TASK_THREAD_ROLE_PACKET_FIELDS?.[role];
    if (!policyFields) fail(`Task-thread policy has no role packet contract: ${role}`);
    sameSet(
      policyFields.required,
      contract.roles[role].inputContract.required,
      `task envelope required packet fields for ${role}`,
    );
    sameSet(
      policyFields.optional,
      contract.roles[role].inputContract.optional,
      `task envelope optional packet fields for ${role}`,
    );
  }
  const protocol = read(".memory/protocols/memory-management.md");
  for (const phrase of [
    "strict 1:1 boundary",
    "clarification-response",
    "Start a fresh child task and omit `task_id`.",
    "process restart loses authorization and denies reuse",
    "exact completed foreground",
    "bounded process-local ledgers",
  ])
    if (!protocol.includes(phrase))
      fail(`Canonical task-thread policy wording is missing: ${phrase}`);
  for (const pathname of [
    ".opencode/skills/delegation-orchestrator/SKILL.md",
    "AGENTS.md",
    "opencode-harness.design.md",
  ]) {
    const text = read(pathname);
    for (const phrase of ["task_id", "clarification", "fresh"])
      if (!text.includes(phrase))
        fail(`Task-thread policy wording missing from ${pathname}: ${phrase}`);
  }
  for (const command of ROLE_COMMANDS) {
    const text = read(`.opencode/commands/${command}.md`);
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
        fail(`Role command task-thread wording missing from ${command}: ${phrase}`);
  }
  const lifecycle = read(".opencode/plugin-modules/harness-lifecycle.js");
  for (const phrase of [
    '"command.execute.before"',
    "blockedRoleCommands",
    "not a managed dispatch surface",
  ])
    if (!lifecycle.includes(phrase)) fail(`Lifecycle direct-command guard is missing: ${phrase}`);
  const result = spawnSync(
    process.execPath,
    [
      "--test",
      ".opencode/plugin-modules/task-thread-policy.test.mjs",
      ".opencode/plugin-modules/task-contracts.test.mjs",
      ".opencode/plugin-modules/dispatch-controller.test.mjs",
      ".opencode/plugin-modules/acceptance-proof.test.mjs",
      ".opencode/plugin-modules/context-budget.test.mjs",
      ".opencode/plugin-modules/managed-execution.test.mjs",
      ".opencode/plugin-modules/managed-dispatch.test.mjs",
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  if (result.status !== 0)
    fail(`Task-thread policy tests failed: ${(result.stderr || result.stdout).trim()}`);
}

function assertGuardrailOnlyDocs() {
  const haystack = [
    read("AGENTS.md"),
    read("opencode-harness.design.md"),
    read(".opencode/skills/delegation-orchestrator/SKILL.md"),
  ].join("\n");
  if (
    !/guardrails? and telemetry/i.test(haystack) ||
    !/not acceptance (proof|evidence)/i.test(haystack)
  ) {
    fail("Hooks/plugins must be documented as guardrails only, not acceptance proof");
  }
}

function walk(dirname: string): string[] {
  const base = path.join(ROOT, dirname);
  const out: string[] = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const rel = path.join(dirname, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(rel));
    } else if (entry.isFile()) {
      out.push(rel);
    }
  }
  return out.sort();
}

async function main() {
  file(".gitignore");
  file("opencode.json");
  file("AGENTS.md");
  file("opencode-harness.design.md");
  file(".opencode/harness.manifest.json");

  const opencode = json("opencode.json");
  assertNoHarnessRoutingInOpenCodeConfig(opencode);
  assertNoLocalPluginPathInOpenCodeConfig(opencode);
  const instructions = opencode.instructions ?? [];
  if (
    !Array.isArray(instructions) ||
    !instructions.includes("AGENTS.md") ||
    !instructions.includes(".memory/protocols/memory-management.md")
  ) {
    fail(
      "opencode.json instructions must include AGENTS.md and .memory/protocols/memory-management.md",
    );
  }
  const routing = json(".opencode/routing/harness-model-routing.example.json");
  const localRouting = json(".opencode/routing/harness-model-routing.local.example.json");
  await assertRouting(routing);
  await assertRoutingResolver(routing, null);
  await assertRoutingResolver(localRouting, "qwen-coder");
  await assertRoleModelRoutingEnforcement(routing, localRouting);
  const roleContracts = json(ROLE_CONTRACT_PATH);
  assertRoleContracts(roleContracts);
  assertTraceAlignment(roleContracts);
  for (const schemaPath of SCHEMA_PATHS) {
    json(schemaPath);
  }
  assertRoutingSchema(json(".opencode/schemas/harness-model-routing.schema.json"));
  assertProviderProjectionSchema(
    json(".opencode/schemas/opencode-provider-projection.schema.json"),
  );
  const runtimeManifest = json(".opencode/runtime.manifest.json");
  assertRuntimeManifest(runtimeManifest);
  assertExactPackagePayload(runtimeManifest);
  assertLoop2TrustDocs();
  const traceSchema = json(".opencode/schemas/memory-trace-artifact.schema.json");
  for (const rootField of ["workspaceRoot", "runtimeRoot", "traceRoot"])
    if (!traceSchema.properties?.inputContract?.properties?.[rootField])
      fail(`Trace schema must allow external root context: ${rootField}`);
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    file(memoryPath);
  }
  file("README.md");
  assertMemoryIndex();
  assertMemorySeeds();
  assertOpenCodeReferences();
  const manifest = json(".opencode/harness.manifest.json");
  if (!Array.isArray(manifest.artifacts)) {
    fail(".opencode/harness.manifest.json must contain artifacts array");
  }
  assertManifest(manifest);
  assertCompleteSourceInventory();
  assertRoutingConfigSplit();

  for (const role of ROLES) {
    const pathname = `.opencode/agents/${role}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing role description: ${pathname}`);
    if (fm.mode !== "subagent") fail(`Role must use mode: subagent: ${pathname}`);
    if (Object.hasOwn(fm, "model")) fail(`Role must omit model: ${pathname}`);
    if (!Object.hasOwn(fm, "permission")) fail(`Missing role permission: ${pathname}`);
    assertAgentContractReferences(role, read(pathname));
  }

  for (const command of ROLE_COMMANDS) {
    const pathname = `.opencode/commands/${command}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing command description: ${pathname}`);
    if (!fm.agent) fail(`Missing command agent: ${pathname}`);
    if (fm.agent !== COMMAND_ROLE_MAP[command]) {
      fail(`Command ${pathname} must route to ${COMMAND_ROLE_MAP[command]}`);
    }
    if (Object.hasOwn(fm, "model")) fail(`Command must omit model: ${pathname}`);
  }
  for (const command of ORCHESTRATOR_COMMANDS) {
    const pathname = `.opencode/commands/${command}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing command description: ${pathname}`);
    if (Object.hasOwn(fm, "agent")) fail(`Orchestrator command must omit agent: ${pathname}`);
    if (fm.subtask !== "false") fail(`Orchestrator command must set subtask: false: ${pathname}`);
    if (Object.hasOwn(fm, "model")) fail(`Command must omit model: ${pathname}`);
  }

  assertLabelsPresent();
  assertRecursiveOrchestrationDocs();
  await assertTaskThreadPolicy();
  assertPriorProjectionReferences();
  await assertPluginAdapter();
  assertGuardrailOnlyDocs();
  assertDarwinNativeAssets();
  assertPortableValidator();

  process.stdout.write("OpenCode harness validation passed\n");
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${errorMessage(error)}\n`);
  process.exit(1);
}
