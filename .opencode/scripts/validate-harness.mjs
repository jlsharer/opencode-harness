#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
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
  '.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md',
  '.opencode/skills/delegation-orchestrator/references/validation-checklist.md',
  '.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md',
  '.opencode/workflows/delegation-workflow.md',
  '.opencode/workflows/validation-workflow.md',
  '.opencode/contracts/role-io-contracts.json',
  '.opencode/schemas/role-io-contracts.schema.json',
  '.opencode/schemas/memory-trace-artifact.schema.json',
  '.opencode/routing/harness-model-routing.json',
  '.opencode/routing/resolve-model-routing.mjs',
  '.opencode/plugins/index.js',
  '.opencode/plugin-modules/harness-lifecycle.js',
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
];
const ROLE_CONTRACT_PATH = '.opencode/contracts/role-io-contracts.json';

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
  if (/harnessModelRouting|roleOverrides|commandOverrides|complexityTiers/.test(serialized)) {
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
  const files = walk('.opencode').concat(['opencode.json']);
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
  ];
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
}

function assertRouting(routingConfig) {
  const routing = routingConfig.harnessModelRouting ?? routingConfig;
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

function assertMemoryIndex() {
  const index = read('.memory/INDEX.md');
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    const relative = memoryPath.replace(/^\.memory\//, '');
    if (!index.includes(relative)) {
      fail(`.memory/INDEX.md must index static memory path: ${relative}`);
    }
  }

  const orchestrationRoot = path.join(ROOT, '.memory/orchestrations');
  if (!fs.existsSync(orchestrationRoot)) return;
  const orchestrationFiles = walk('.memory/orchestrations')
    .filter((pathname) => pathname.endsWith('.md'))
    .map((pathname) => pathname.replace(/^\.memory\//, ''));
  for (const pathname of orchestrationFiles) {
    if (!index.includes(pathname)) {
      fail(`.memory/INDEX.md must index orchestration memory path: ${pathname}`);
    }
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
  const pluginModule = await import(pathToFileURL(path.join(ROOT, '.opencode/plugins/index.js')).href);
  if (typeof pluginModule.default !== 'function') {
    fail('Plugin adapter dynamic import must expose a default function');
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
  const routing = json('.opencode/routing/harness-model-routing.json');
  assertRouting(routing);
  const roleContracts = json(ROLE_CONTRACT_PATH);
  assertRoleContracts(roleContracts);
  for (const schemaPath of SCHEMA_PATHS) {
    json(schemaPath);
  }
  for (const memoryPath of STATIC_MEMORY_PATHS) {
    file(memoryPath);
  }
  assertMemoryIndex();
  assertOpenCodeReferences();
  const manifest = json('.opencode/harness.manifest.json');
  if (!Array.isArray(manifest.artifacts)) {
    fail('.opencode/harness.manifest.json must contain artifacts array');
  }
  assertManifest(manifest);

  for (const role of ROLES) {
    const pathname = `.opencode/agents/${role}.md`;
    const fm = frontmatter(read(pathname), pathname);
    if (!fm.description) fail(`Missing role description: ${pathname}`);
    if (fm.mode !== 'subagent') fail(`Role must use mode: subagent: ${pathname}`);
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

  process.stdout.write('OpenCode harness validation passed\n');
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
}
