#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const ROLES = [
  'researcher',
  'planner',
  'implementer',
  'integrator',
  'validator',
  'reviewer',
  'synthesizer',
  'artifact-verifier',
];
const ROLE_COMMANDS = [
  'delegate-research',
  'delegate-plan',
  'delegate-implement',
  'delegate-integrate',
  'delegate-validate',
  'delegate-artifact-verify',
];
const ORCHESTRATOR_COMMANDS = ['delegate-orchestration'];
const COMMANDS = [...ROLE_COMMANDS, ...ORCHESTRATOR_COMMANDS];
const COMMAND_ROLE_MAP = {
  'delegate-research': 'researcher',
  'delegate-plan': 'planner',
  'delegate-implement': 'implementer',
  'delegate-integrate': 'integrator',
  'delegate-validate': 'validator',
  'delegate-artifact-verify': 'artifact-verifier',
};
const STATIC_MANIFEST_PATHS = [
  'opencode.json',
  'AGENTS.md',
  'opencode-harness.design.md',
  '.memory/INDEX.md',
  '.memory/protocols/memory-management.md',
  '.memory/references/opencode-refs.md',
  '.memory/templates/orchestration-index.md',
  '.memory/templates/role-trace-artifact.md',
  '.opencode/skills/delegation-orchestrator/SKILL.md',
  '.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md',
  '.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md',
  '.opencode/skills/delegation-orchestrator/references/validation-checklist.md',
  '.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md',
  '.opencode/skills/opencode-skill-authoring/SKILL.md',
  '.opencode/skills/opencode-workflow-guidance/SKILL.md',
  '.opencode/workflows/delegation-workflow.md',
  '.opencode/workflows/implement-feature-workflow.md',
  '.opencode/workflows/validation-workflow.md',
  '.opencode/deployments/llama-server/compose.yaml',
  '.opencode/deployments/llama-server/instances/research.env.example',
  '.opencode/deployments/llama-server/instances/coder.env.example',
  '.opencode/deployments/llama-server/README.md',
  '.opencode/contracts/role-io-contracts.json',
  '.opencode/schemas/role-io-contracts.schema.json',
  '.opencode/schemas/memory-trace-artifact.schema.json',
  '.opencode/schemas/harness-model-routing.schema.json',
  '.opencode/routing/harness-model-routing.example.json',
  '.opencode/routing/harness-model-routing.local.example.json',
  '.opencode/routing/routing-config-loader.mjs',
  '.opencode/routing/routing-policy.mjs',
  '.opencode/routing/routing-policy.test.mjs',
  '.opencode/routing/resolve-model-routing.mjs',
  '.opencode/routing/model-routing-helper.mjs',
  '.opencode/plugins/index.js',
  '.opencode/plugin-modules/harness-lifecycle.js',
  '.opencode/plugin-modules/role-model-routing-enforcement.js',
  '.opencode/bootstrap/memory/INDEX.md',
  '.opencode/bootstrap/memory/protocols/memory-management.md',
  '.opencode/bootstrap/memory/templates/orchestration-index.md',
  '.opencode/bootstrap/memory/templates/role-trace-artifact.md',
  '.opencode/portable.manifest.json',
  '.opencode/scripts/bootstrap-portable-harness.mjs',
  '.opencode/scripts/portable-harness.test.mjs',
  '.opencode/scripts/validate-portable-harness.mjs',
  '.opencode/scripts/validate-harness.mjs',
  '.opencode/harness.manifest.json',
];
const STATIC_MEMORY_PATHS = [
  '.memory/INDEX.md',
  '.memory/protocols/memory-management.md',
  '.memory/references/opencode-refs.md',
  '.memory/templates/orchestration-index.md',
  '.memory/templates/role-trace-artifact.md',
];
const SCHEMA_PATHS = [
  '.opencode/schemas/role-io-contracts.schema.json',
  '.opencode/schemas/memory-trace-artifact.schema.json',
  '.opencode/schemas/harness-model-routing.schema.json',
];
const ROLE_CONTRACT_PATH = '.opencode/contracts/role-io-contracts.json';
const TRACE_SCHEMA_PATH = '.opencode/schemas/memory-trace-artifact.schema.json';
const TRACE_FIELDS = ['orchestrationId', 'role', 'artifactId', 'createdAt', 'inputContract', 'workPerformed', 'outputContract', 'handoff'];
const SOURCE_INVENTORY_EXCLUSIONS = new Set([
  '.opencode/.gitignore',
  '.opencode/package.json',
  '.opencode/package-lock.json',
  '.opencode/routing/harness-model-routing.json',
]);
const HARNESS_ROUTING_KEYS = [
  'harnessModelRouting',
  'roleOverrides',
  'commandOverrides',
  'complexityTiers',
  'localRouting',
  'routingServiceUrl',
  'localModelEnabled',
  'preferLocal',
  'localModelFallback',
];

function fail(message) {
  throw new Error(message);
}

function file(pathname) {
  const full = path.join(ROOT, pathname);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    fail(`Missing required file: ${pathname}`);
  }
  return full;
}

function read(pathname) {
  return fs.readFileSync(file(pathname), 'utf8');
}

function json(pathname) {
  return JSON.parse(read(pathname));
}

function sameSet(actual, expected, label) {
  const actualSorted = [...actual].sort();
  const expectedSorted = [...expected].sort();
  if (
    actualSorted.length !== expectedSorted.length ||
    actualSorted.some((value, index) => value !== expectedSorted[index])
  ) {
    fail(`${label} mismatch: expected ${expectedSorted.join(', ')}, got ${actualSorted.join(', ')}`);
  }
}

function frontmatter(markdown, pathname) {
  if (!markdown.startsWith('---\n')) {
    fail(`Missing YAML frontmatter: ${pathname}`);
  }
  const end = markdown.indexOf('\n---', 4);
  if (end === -1) {
    fail(`Unclosed YAML frontmatter: ${pathname}`);
  }
  const body = markdown.slice(4, end).trim();
  const lines = body.split(/\r?\n/);
  const fields = {};
  let current = null;
  for (const line of lines) {
    const match = /^([A-Za-z0-9_-]+):(?:\s*(.*))?$/.exec(line);
    if (match) {
      current = match[1];
      fields[current] = match[2] ?? '';
    } else if (/^\s+\S/.test(line) && current) {
      fields[current] = `${fields[current]}\n${line}`;
    }
  }
  return fields;
}

function assertNoHarnessRoutingInOpenCodeConfig(config) {
  const serialized = JSON.stringify(config);
  if (HARNESS_ROUTING_KEYS.some((key) => serialized.includes(key))) {
    fail('opencode.json contains harness-owned routing policy');
  }
}

function assertNoLocalPluginPathInOpenCodeConfig(config) {
  const plugins = config.plugin ?? config.plugins ?? [];
  if (!Array.isArray(plugins)) return;
  for (const entry of plugins) {
    const value = typeof entry === 'string' ? entry : JSON.stringify(entry);
    if (/^\.{1,2}\//.test(value) || value.includes('.opencode/plugins/')) {
      fail('opencode.json must not list local plugin file paths');
    }
  }
}

function assertLabelsPresent() {
  const haystack = [
    read('.opencode/skills/delegation-orchestrator/SKILL.md'),
    read('.opencode/workflows/delegation-workflow.md'),
    ...COMMANDS.map((command) => read(`.opencode/commands/${command}.md`)),
  ].join('\n');
  for (const label of [
    '### Delegation Parameters',
    '**Provider Model**',
    '**Routing Config**',
    'routingServiceUrl',
    'localModelEnabled',
    'preferLocal',
    'localModelFallback',
  ]) {
    if (!haystack.includes(label)) {
      fail(`Missing routing preservation label: ${label}`);
    }
  }
  if (!/do not invent/i.test(haystack)) {
    fail('Delegation surfaces must state that absent routing metadata values are not invented');
  }
}

function assertPriorProjectionReferences() {
  const files = walk('.opencode')
    .filter((pathname) => pathname !== '.opencode/portable.manifest.json')
    .concat(['opencode.json']);
  const priorProjectionTokens = ['.' + 'agents', '.' + 'codex'];
  for (const pathname of files) {
    const text = fs.readFileSync(path.join(ROOT, pathname), 'utf8');
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
    '.opencode/commands/implement-feature.md',
  ];
}

function assertCompleteSourceInventory() {
  const discovered = walk('.opencode').filter((pathname) =>
    !pathname.startsWith('.opencode/node_modules/') && !SOURCE_INVENTORY_EXCLUSIONS.has(pathname)
  );
  sameSet(discovered, expectedManifestPaths().filter((pathname) => pathname.startsWith('.opencode/')), 'source .opencode inventory');
}

function assertManifest(manifest) {
  const rootOwned = new Set(['opencode.json', 'AGENTS.md', 'opencode-harness.design.md']);
  const staticMemoryOwned = new Set(STATIC_MEMORY_PATHS);
  const paths = manifest.artifacts.map((artifact) => artifact.path);
  sameSet(paths, expectedManifestPaths(), 'manifest artifact paths');

  const seen = new Set();
  const priorProjectionRoots = ['.' + 'agents/', '.' + 'codex/'];
  for (const artifact of manifest.artifacts) {
    if (!artifact.path || typeof artifact.path !== 'string') {
      fail('.opencode/harness.manifest.json contains an artifact without a string path');
    }
    if (seen.has(artifact.path)) {
      fail(`Duplicate manifest artifact path: ${artifact.path}`);
    }
    seen.add(artifact.path);
    if (priorProjectionRoots.some((root) => artifact.path.startsWith(root))) {
      fail(`Manifest must not list prior projection path: ${artifact.path}`);
    }
    if (!artifact.path.startsWith('.opencode/') && !rootOwned.has(artifact.path) && !staticMemoryOwned.has(artifact.path)) {
      fail(`Manifest lists non-OpenCode project artifact: ${artifact.path}`);
    }
    if (artifact.owner !== 'harness-owned') {
      fail(`Manifest artifact must be harness-owned: ${artifact.path}`);
    }
    file(artifact.path);
  }
  if (seen.has('.opencode/routing/harness-model-routing.json')) {
    fail('Manifest must not own the operator routing override');
  }
  const example = manifest.artifacts.find((artifact) => artifact.path === '.opencode/routing/harness-model-routing.example.json');
  if (example?.kind !== 'harness-routing-config') fail('Manifest must classify the routing example as harness-routing-config');
  if (!seen.has('.opencode/routing/routing-config-loader.mjs')) fail('Manifest must own the shared routing config loader');
  if (!seen.has('.opencode/portable.manifest.json')) fail('Source manifest must own the portable profile manifest without conflating profiles');
}

function assertRoutingConfigSplit() {
  const ignoreLines = read('.gitignore').split(/\r?\n/).filter(Boolean);
  const exactRule = '/.opencode/routing/harness-model-routing.json';
  if (ignoreLines.filter((line) => line === exactRule).length !== 1) {
    fail(`.gitignore must contain exactly one rooted operator routing rule: ${exactRule}`);
  }
  for (const pathname of [
    '.opencode/routing/resolve-model-routing.mjs',
    '.opencode/routing/model-routing-helper.mjs',
    '.opencode/plugin-modules/role-model-routing-enforcement.js',
  ]) {
    const source = read(pathname);
    if (source.includes('harness-model-routing.json') || source.includes('harness-model-routing.example.json')) {
      fail(`${pathname} must delegate routing filename precedence to routing-config-loader.mjs`);
    }
  }
}

function assertRoutingSchema(schema) {
  if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
    fail('Harness routing schema must declare JSON Schema draft 2020-12');
  }
  if (!Array.isArray(schema.oneOf) || schema.$defs?.routing?.additionalProperties !== false) {
    fail('Harness routing schema must cover wrapped/unwrapped documents with a closed routing object');
  }
  for (const boundary of ['roleOverride', 'commandOverride', 'modelVariant', 'catalogEntry']) {
    if (schema.$defs?.[boundary]?.additionalProperties !== false) {
      fail(`Harness routing schema boundary must reject unknown keys: ${boundary}`);
    }
  }
  const localRouting = schema.$defs?.routing?.properties?.localRouting;
  const forceDependency = localRouting?.allOf?.some((constraint) =>
    constraint?.if?.properties?.forceLocalForHarnessSubagents?.const === true &&
    constraint?.then?.properties?.enabled?.const === true
  );
  if (!forceDependency) {
    fail('Harness routing schema must require enabled:true when forceLocalForHarnessSubagents is true');
  }
  for (const collection of ['commandOverrides', 'orchestratorCommands']) {
    if (schema.$defs?.routing?.properties?.[collection]?.propertyNames?.pattern !== '^/') {
      fail(`Harness routing schema must require slash-prefixed ${collection} keys`);
    }
  }
  const policySource = read('.opencode/routing/routing-policy.mjs');
  if (/\bajv\b|from\s+['"][^'"]+['"]/.test(policySource)) {
    fail('Routing policy must remain dependency-free and must not import Ajv or other modules');
  }
}

async function assertRouting(routingConfig) {
  const policy = await import(pathToFileURL(path.join(ROOT, '.opencode/routing/routing-policy.mjs')).href);
  const routing = policy.normalizeAndValidateRoutingConfig(routingConfig);
  if (routing.schemaVersion !== '2.0.0') fail('Routing must use exact schemaVersion 2.0.0');
  if (routing.defaultModel !== null || routing.singleModel.enabled || routing.singleModel.model !== null ||
      routing.localRouting.enabled || routing.localRouting.forceLocalForHarnessSubagents ||
      routing.localRouting.defaultLocalModel !== null || Object.keys(routing.localRouting.models).length !== 0) {
    fail('Committed routing example must be neutral and provider-free');
  }
  sameSet(Object.keys(routing.roleOverrides ?? {}), ROLES, 'routing roleOverrides');
  sameSet(
    Object.values(routing.commandOverrides ?? {}).map((entry) => entry.agent),
    Object.values(COMMAND_ROLE_MAP),
    'routing commandOverride agents',
  );
  for (const [command, role] of Object.entries(COMMAND_ROLE_MAP)) {
    const pathname = `/${command}`;
    if (routing.commandOverrides?.[pathname]?.agent !== role) {
      fail(`Routing command override ${pathname} must route to ${role}`);
    }
  }
  const orchestrationEntry = routing.orchestratorCommands?.['/delegate-orchestration'];
  if (!orchestrationEntry) {
    fail('Routing must include orchestrator command /delegate-orchestration');
  }
  if (orchestrationEntry.owner !== 'orchestrator') {
    fail('/delegate-orchestration must be owned by orchestrator');
  }
  if (orchestrationEntry.agent !== null) {
    fail('/delegate-orchestration must not assign a subagent');
  }
  if (Object.values(routing.roleOverrides).some((entry) => entry.model !== null)) {
    fail('Committed native roleOverrides models must remain null');
  }
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const invalidForce = clone(routingConfig);
  invalidForce.harnessModelRouting.localRouting.enabled = false;
  invalidForce.harnessModelRouting.localRouting.forceLocalForHarnessSubagents = true;
  expectThrows('force dependency parity', () => policy.normalizeAndValidateRoutingConfig(invalidForce), /requires enabled:true/);
  const invalidOrchestrator = clone(routingConfig);
  invalidOrchestrator.harnessModelRouting.orchestratorCommands.bad =
    invalidOrchestrator.harnessModelRouting.orchestratorCommands['/delegate-orchestration'];
  delete invalidOrchestrator.harnessModelRouting.orchestratorCommands['/delegate-orchestration'];
  expectThrows('orchestrator command key parity', () => policy.normalizeAndValidateRoutingConfig(invalidOrchestrator), /command keys must start with \/$/);
}

async function assertRoutingResolver(routingConfig, expectedCatalogName) {
  const { resolveRoutingDecision } = await import(pathToFileURL(path.join(ROOT, '.opencode/routing/routing-policy.mjs')).href);
  const decision = resolveRoutingDecision({ config: routingConfig, request: { command: '/delegate-implement' } });
  if (decision.agent !== 'implementer' || decision.sources.agent !== 'commandOverride') {
    fail('Routing resolver must lock /delegate-implement to implementer');
  }
  if (decision.local.enforced || decision.local.networkCalls || decision.local.catalogName !== expectedCatalogName) {
    fail(`Resolver decision must be network-free with expected catalog identity ${expectedCatalogName}`);
  }
  if (Object.hasOwn(decision, 'localModel') || Object.hasOwn(decision.local, 'effectiveFallbackModel')) {
    fail('Routing resolver must not emit legacy localModel output');
  }
}

function assertRoleContracts(contract) {
  sameSet(Object.keys(contract.roles ?? {}), ROLES, 'role contract roles');
  if (contract.memoryProtocol !== '.memory/protocols/memory-management.md') {
    fail('Role contract catalog must reference the memory management protocol');
  }
  if (contract.traceArtifactSchema !== '.opencode/schemas/memory-trace-artifact.schema.json') {
    fail('Role contract catalog must reference the memory trace artifact schema');
  }
  for (const role of ROLES) {
    const entry = contract.roles[role];
    if (!entry?.inputContract?.required?.length) {
      fail(`Missing input contract required fields for role: ${role}`);
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
}

function assertTraceAlignment(contract) {
  const schema = json(TRACE_SCHEMA_PATH);
  sameSet(schema.required ?? [], TRACE_FIELDS, 'trace schema required fields');
  for (const role of ROLES) {
    sameSet(contract.roles[role].traceArtifact.requiredFields ?? [], schema.required, `trace fields for ${role}`);
  }
  const template = read('.memory/templates/role-trace-artifact.md');
  for (const heading of ['## Metadata', '## Input Contract', '## Work Performed', '## Output Contract', '## Handoff']) {
    if (!template.includes(heading)) fail(`Source trace template is missing schema section: ${heading}`);
  }
  for (const field of TRACE_FIELDS.slice(0, 4)) {
    if (!template.includes(`- ${field}:`)) fail(`Source trace template is missing field: ${field}`);
  }
}

function assertMemorySeeds() {
  for (const relative of [
    'protocols/memory-management.md',
    'templates/orchestration-index.md',
    'templates/role-trace-artifact.md',
  ]) {
    const source = `.memory/${relative}`;
    const seed = `.opencode/bootstrap/memory/${relative}`;
    if (read(source) !== read(seed)) fail(`Portable memory seed differs from source canonical file: ${relative}`);
  }
  const portableManifest = json('.opencode/portable.manifest.json');
  const mappings = portableManifest.memorySeeds ?? [];
  const expectedTargets = [
    '.memory/INDEX.md',
    '.memory/protocols/memory-management.md',
    '.memory/templates/orchestration-index.md',
    '.memory/templates/role-trace-artifact.md',
  ];
  sameSet(mappings.map((entry) => entry.target), expectedTargets, 'portable memory seed targets');
}

function assertMemoryIndex() {
  const index = read('.memory/INDEX.md');
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    const relative = memoryPath.replace(/^\.memory\//, '');
    if (!index.includes(relative)) {
      fail(`.memory/INDEX.md must index static memory path: ${relative}`);
    }
  }

  const orchestrationRoot = path.join(ROOT, '.memory/orchestrations');
  if (!fs.existsSync(orchestrationRoot) || !fs.statSync(orchestrationRoot).isDirectory()) {
    fail('Source validation requires .memory/orchestrations history');
  }
  const orchestrationFiles = walk('.memory/orchestrations')
    .filter((pathname) => pathname.endsWith('.md'))
    .map((pathname) => pathname.replace(/^\.memory\//, ''));
  if (orchestrationFiles.length === 0) fail('Source validation requires indexed orchestration history');
  const indexedOrchestrations = [...index.matchAll(/`(orchestrations\/[^`]+\/INDEX\.md)`/g)].map((match) => match[1]);
  if (indexedOrchestrations.length === 0) fail('.memory/INDEX.md must index retained orchestration history');
  for (const pathname of indexedOrchestrations) {
    file(`.memory/${pathname}`);
  }
}

function assertOpenCodeReferences() {
  const references = read('.memory/references/opencode-refs.md');
  if (!/^Retrieval date: \d{4}-\d{2}-\d{2}$/m.test(references)) {
    fail('.memory/references/opencode-refs.md must include a retrieval date');
  }
  for (const url of [
    'https://opencode.ai/docs',
    'https://opencode.ai/docs/config',
    'https://opencode.ai/docs/agents',
    'https://opencode.ai/docs/commands',
    'https://opencode.ai/docs/skills',
    'https://opencode.ai/docs/plugins',
  ]) {
    if (!references.includes(url)) {
      fail(`.memory/references/opencode-refs.md missing official OpenCode URL: ${url}`);
    }
  }
  if (!/short descriptions|Short descriptions/.test(references)) {
    fail('.memory/references/opencode-refs.md must state that URL descriptions are included');
  }
}

function writeTempRouting(dir, config) {
  const pathname = path.join(dir, `${Math.random().toString(16).slice(2)}.json`);
  fs.writeFileSync(pathname, JSON.stringify(config), 'utf8');
  return pathname;
}

function expectThrows(label, fn, pattern) {
  try {
    fn();
  } catch (error) {
    if (!pattern.test(error.message)) {
      fail(`${label} threw unexpected error: ${error.message}`);
    }
    return;
  }
  fail(`${label} must throw`);
}

async function assertRoleModelRoutingEnforcement(neutralRoutingConfig, localRoutingConfig) {
  const modulePath = path.join(ROOT, '.opencode/plugin-modules/role-model-routing-enforcement.js');
  const { applyHarnessRoleModelOverrides, resolveHarnessRoutingPath } = await import(pathToFileURL(modulePath).href);
  if (typeof applyHarnessRoleModelOverrides !== 'function') {
    fail('Role model routing enforcement module must export applyHarnessRoleModelOverrides');
  }
  if (typeof resolveHarnessRoutingPath !== 'function') {
    fail('Role model routing enforcement module must export resolveHarnessRoutingPath');
  }

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-harness-routing-'));
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const cfgWithAgents = () => ({
    agent: Object.fromEntries(ROLES.map((role) => [role, { mode: 'subagent' }])),
    provider: {
      'llamacpp-research': {
        options: { baseURL: 'http://127.0.0.1:8080/v1' },
        models: { 'qwen2.5-7b-instruct': {} },
      },
      'llamacpp-coder': {
        options: { baseURL: 'http://127.0.0.1:8081/v1' },
        models: { 'qwen2.5-coder-7b': {} },
      },
    },
  });

  const previousCwd = process.cwd();
  const cwdSubdir = path.join(tempDir, 'subdir');
  fs.mkdirSync(cwdSubdir);
  try {
    process.chdir(cwdSubdir);
    const defaultCfg = cfgWithAgents();
    applyHarnessRoleModelOverrides(defaultCfg, { routingDocument: neutralRoutingConfig });
    if (ROLES.some((role) => Object.hasOwn(defaultCfg.agent[role], 'model'))) {
      fail('Committed non-force config must preserve null roleOverrides without own model mutation');
    }
    const projectSubdirPath = path.join(ROOT, '.opencode/plugin-modules');
    if (!path.isAbsolute(resolveHarnessRoutingPath({ routingPath: '.opencode/routing/harness-model-routing.example.json' }))) {
      fail('Plugin explicit routing path must resolve exactly to an absolute path');
    }
  } finally {
    process.chdir(previousCwd);
  }

  const forceRouting = clone(localRoutingConfig);
  forceRouting.harnessModelRouting.localRouting.forceLocalForHarnessSubagents = true;
  const forceCfg = cfgWithAgents();
  const providerBefore = clone(forceCfg.provider);
  applyHarnessRoleModelOverrides(forceCfg, { routingPath: writeTempRouting(tempDir, forceRouting) });
  if (ROLES.some((role) => !Object.hasOwn(forceCfg.agent[role], 'model'))) {
    fail('Force-local enforcement must assign all eight agents');
  }
  if (JSON.stringify(forceCfg.provider) !== JSON.stringify(providerBefore)) {
    fail('Force-local enforcement must not mutate providers');
  }

  const failureCfg = cfgWithAgents();
  delete failureCfg.agent['artifact-verifier'];
  const failureBefore = clone(failureCfg);
  expectThrows(
    'eighth-role atomic preflight',
    () => applyHarnessRoleModelOverrides(failureCfg, { routingPath: writeTempRouting(tempDir, forceRouting) }),
    /artifact-verifier/,
  );
  if (JSON.stringify(failureCfg) !== JSON.stringify(failureBefore)) {
    fail('Failed eighth-role preflight must not partially mutate agents or providers');
  }

  expectThrows(
    'unreadable routing JSON',
    () => applyHarnessRoleModelOverrides({ agent: {} }, { routingPath: path.join(tempDir, 'missing.json') }),
    /Unable to read routing config/,
  );

  const malformedRoutingPath = path.join(tempDir, 'malformed-routing.json');
  fs.writeFileSync(malformedRoutingPath, '{"harnessModelRouting":', 'utf8');
  expectThrows(
    'malformed routing JSON',
    () => applyHarnessRoleModelOverrides({ agent: {} }, { routingPath: malformedRoutingPath }),
    /Malformed routing config JSON/,
  );
  fs.rmSync(tempDir, { recursive: true, force: true });
}

function assertPortableValidator() {
  const result = spawnSync(process.execPath, ['.opencode/scripts/validate-portable-harness.mjs', '--root', ROOT], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    fail(`Portable validator failed during source QA: ${(result.stderr || result.stdout).trim()}`);
  }
  if (result.stdout.trim() !== 'Portable OpenCode harness validation passed') {
    fail(`Portable validator returned unexpected output: ${result.stdout.trim()}`);
  }
}

function assertRecursiveOrchestrationDocs() {
  const command = read('.opencode/commands/delegate-orchestration.md');
  for (const snippet of [
    'orchestrator',
    'omits `agent`',
    'DAG',
    'parallel',
    'research before planning',
    'validation before acceptance',
    '3 remediation loops',
    '.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md',
  ]) {
    if (!command.includes(snippet)) {
      fail(`delegate-orchestration command missing recursive orchestration detail: ${snippet}`);
    }
  }
  const workflow = read('.opencode/workflows/delegation-workflow.md');
  const memoryProtocol = read('.memory/protocols/memory-management.md');
  const template = read('.memory/templates/orchestration-index.md');
  const skill = read('.opencode/skills/delegation-orchestrator/SKILL.md');
  for (const [label, text] of [
    ['delegation workflow', workflow],
    ['memory protocol', memoryProtocol],
    ['orchestration index template', template],
    ['delegation skill', skill],
  ]) {
    for (const snippet of ['DAG', 'research', 'planning', 'validation']) {
      if (!text.includes(snippet)) {
        fail(`${label} missing recursive orchestration concept: ${snippet}`);
      }
    }
  }
  if (!template.includes('<scope>-researcher-<sequence>-<slug>')) {
    fail('orchestration index template must show repeatable scoped role instances');
  }
}

function assertAgentContractReferences(role, text) {
  const requiredSnippets = [
    '.memory/protocols/memory-management.md',
    '.opencode/contracts/role-io-contracts.json',
    '.opencode/schemas/memory-trace-artifact.schema.json',
    `.memory/orchestrations/<orchestration-id>/roles/${role}/<artifact-id>.md`,
  ];
  for (const snippet of requiredSnippets) {
    if (!text.includes(snippet)) {
      fail(`Role ${role} must reference ${snippet}`);
    }
  }
}

async function assertPluginAdapter() {
  const adapter = read('.opencode/plugins/index.js');
  if (!adapter.includes("from '../plugin-modules/harness-lifecycle.js'")) {
    fail('Plugin adapter must import segmented harness lifecycle plugin');
  }
  if (!adapter.includes("from '../plugin-modules/role-model-routing-enforcement.js'")) {
    fail('Plugin adapter must import role model routing enforcement plugin');
  }
  if (!/export\s+default\s+async\s+function|export\s+default\s+function|export\s+default\s+\w+/.test(adapter)) {
    fail('Plugin adapter must have a default export');
  }
  if (/tool\.execute\.before|message\.after|session\.start/.test(adapter)) {
    fail('Plugin adapter must not inline segmented hook logic');
  }
  const autoLoadedPluginFiles = walk('.opencode/plugins').filter((pathname) => /\.(?:js|mjs|cjs|ts)$/.test(pathname));
  sameSet(autoLoadedPluginFiles, ['.opencode/plugins/index.js'], 'auto-loaded plugin files');
  const lifecycle = read('.opencode/plugin-modules/harness-lifecycle.js');
  if (!lifecycle.includes('HarnessLifecyclePlugin')) {
    fail('Segmented lifecycle plugin export must remain separate');
  }
  for (const staleRoutingSnippet of ['resolvedRouting', 'injectModelFlag', 'resolveModelForRole', 'input.args.command =']) {
    if (lifecycle.includes(staleRoutingSnippet)) {
      fail(`Lifecycle plugin must not perform model injection or cached routing: ${staleRoutingSnippet}`);
    }
  }
  const roleRouting = read('.opencode/plugin-modules/role-model-routing-enforcement.js');
  if (!roleRouting.includes('HarnessRoleModelRoutingEnforcementPlugin')) {
    fail('Segmented role model routing enforcement plugin export must remain separate');
  }
  for (const snippet of ['roleOverrides', 'resolver-only advisory routing policy', 'never mutate agents']) {
    if (!roleRouting.includes(snippet)) {
      fail(`Role model routing enforcement module must document roleOverrides-only scope: ${snippet}`);
    }
  }
  const pluginModule = await import(pathToFileURL(path.join(ROOT, '.opencode/plugins/index.js')).href);
  if (typeof pluginModule.default !== 'function') {
    fail('Plugin adapter dynamic import must expose a default function');
  }
  const hooks = await pluginModule.default({});
  if (typeof hooks.config !== 'function') {
    fail('Plugin adapter must expose reachable config hook');
  }
}

function assertGuardrailOnlyDocs() {
  const haystack = [
    read('AGENTS.md'),
    read('opencode-harness.design.md'),
    read('.opencode/workflows/validation-workflow.md'),
    read('.opencode/skills/delegation-orchestrator/SKILL.md'),
  ].join('\n');
  if (!/guardrails? and telemetry/i.test(haystack) || !/not acceptance (proof|evidence)/i.test(haystack)) {
    fail('Hooks/plugins must be documented as guardrails only, not acceptance proof');
  }
}

function walk(dirname) {
  const base = path.join(ROOT, dirname);
  const out = [];
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
  file('.gitignore');
  file('opencode.json');
  file('AGENTS.md');
  file('opencode-harness.design.md');
  file('.opencode/harness.manifest.json');

  const opencode = json('opencode.json');
  assertNoHarnessRoutingInOpenCodeConfig(opencode);
  assertNoLocalPluginPathInOpenCodeConfig(opencode);
  const instructions = opencode.instructions ?? [];
  if (!Array.isArray(instructions) || !instructions.includes('AGENTS.md') || !instructions.includes('.memory/protocols/memory-management.md')) {
    fail('opencode.json instructions must include AGENTS.md and .memory/protocols/memory-management.md');
  }
  const routing = json('.opencode/routing/harness-model-routing.example.json');
  const localRouting = json('.opencode/routing/harness-model-routing.local.example.json');
  await assertRouting(routing);
  await assertRoutingResolver(routing, null);
  await assertRoutingResolver(localRouting, 'qwen-coder');
  await assertRoleModelRoutingEnforcement(routing, localRouting);
  const roleContracts = json(ROLE_CONTRACT_PATH);
  assertRoleContracts(roleContracts);
  assertTraceAlignment(roleContracts);
  for (const schemaPath of SCHEMA_PATHS) {
    json(schemaPath);
  }
  assertRoutingSchema(json('.opencode/schemas/harness-model-routing.schema.json'));
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    file(memoryPath);
  }
  assertMemoryIndex();
  assertMemorySeeds();
  assertOpenCodeReferences();
  const manifest = json('.opencode/harness.manifest.json');
  if (!Array.isArray(manifest.artifacts)) {
    fail('.opencode/harness.manifest.json must contain artifacts array');
  }
  assertManifest(manifest);
  assertCompleteSourceInventory();
  assertRoutingConfigSplit();

  for (const role of ROLES) {
    const pathname = `.opencode/agents/${role}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing role description: ${pathname}`);
    if (fm.mode !== 'subagent') fail(`Role must use mode: subagent: ${pathname}`);
    if (Object.hasOwn(fm, 'model')) fail(`Role must omit model: ${pathname}`);
    if (!Object.hasOwn(fm, 'permission')) fail(`Missing role permission: ${pathname}`);
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
    if (Object.hasOwn(fm, 'model')) fail(`Command must omit model: ${pathname}`);
  }
  for (const command of ORCHESTRATOR_COMMANDS) {
    const pathname = `.opencode/commands/${command}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing command description: ${pathname}`);
    if (Object.hasOwn(fm, 'agent')) fail(`Orchestrator command must omit agent: ${pathname}`);
    if (fm.subtask !== 'false') fail(`Orchestrator command must set subtask: false: ${pathname}`);
    if (Object.hasOwn(fm, 'model')) fail(`Command must omit model: ${pathname}`);
  }

  assertLabelsPresent();
  assertRecursiveOrchestrationDocs();
  assertPriorProjectionReferences();
  await assertPluginAdapter();
  assertGuardrailOnlyDocs();
  assertPortableValidator();

  process.stdout.write('OpenCode harness validation passed\n');
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
