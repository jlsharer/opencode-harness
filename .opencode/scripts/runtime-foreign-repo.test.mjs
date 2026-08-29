#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = path.join(ROOT, 'bin/opencode-harness.mjs');
const bundleFlag = process.argv.indexOf('--external-bundle');
const EXTERNAL_BUNDLE = bundleFlag === -1 ? null : path.resolve(process.argv[bundleFlag + 1] ?? '');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-harness-foreign-'));
test.after(() => fs.rmSync(temp, { recursive: true, force: true }));

function git(repo, ...args) { return spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8' }); }
function evaluateSchema(schema, value, location = '$') {
  const supported = new Set(['$schema', '$id', 'title', 'type', 'required', 'additionalProperties', 'properties', 'enum', 'minLength', 'items']);
  for (const key of Object.keys(schema)) if (!supported.has(key)) throw new Error(`unsupported schema assertion keyword ${key} at ${location}`);
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value === 'object' ? 'object' : typeof value;
  if (types.length && !types.includes(actual)) throw new Error(`${location} expected ${types.join('|')}, got ${actual}`);
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) throw new Error(`${location} is not in enum`);
  if (actual === 'string' && schema.minLength !== undefined && value.length < schema.minLength) throw new Error(`${location} is shorter than minLength`);
  if (actual === 'array' && schema.items) value.forEach((item, index) => evaluateSchema(schema.items, item, `${location}[${index}]`));
  if (actual === 'object' && value !== null) {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) throw new Error(`${location}.${key} is required`);
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) evaluateSchema(properties[key], child, `${location}.${key}`);
      else if (schema.additionalProperties === false) throw new Error(`${location}.${key} is not allowed`);
    }
  }
}

function assertTraceShape(artifact) {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, '.opencode/schemas/memory-trace-artifact.schema.json'), 'utf8'));
  evaluateSchema(schema, artifact);
}
function makeRepo(name) {
  const repo = path.join(temp, name);
  fs.mkdirSync(repo, { mode: 0o700 });
  assert.equal(spawnSync('git', ['init', '-q', repo]).status, 0);
  return repo;
}
function fakeOpenCode(capture) {
  const fake = path.join(temp, `fake-opencode-${path.basename(capture)}.mjs`);
  const script = [
    '#!/usr/bin/env node',
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "import { createHash } from 'node:crypto';",
    "if (process.argv[2] === '--version') { if(process.env.HARNESS_TEST_VERSION_MARKER) fs.writeFileSync(process.env.HARNESS_TEST_VERSION_MARKER,'probed'); if(process.env.HARNESS_TEST_INSERT_CONFIG) fs.writeFileSync(path.join(process.env.HARNESS_TEST_INSERT_CONFIG,'opencode.json'),JSON.stringify({plugin:['inserted-after-preflight']})); if(process.env.HARNESS_TEST_MUTATE_ASSET) fs.appendFileSync(process.env.HARNESS_TEST_MUTATE_ASSET,'changed'); process.stdout.write('1.18.25\\n'); }",
    'else {',
    " const argv=process.argv.slice(2); const commands=new Set(['models','agent','run']);",
    " if(argv.length && !commands.has(argv[0])) { process.stderr.write('fake OpenCode top-level grammar rejected project-before-subcommand argv\\n'); process.exitCode=64; }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH){ const roles=['implementer','planner','researcher','validator']; const traceOnly=new Set(['planner','researcher','validator']); const workspace=process.env.OPENCODE_HARNESS_WORKSPACE_ROOT; const trace=process.env.OPENCODE_HARNESS_TRACE_ROOT; const relative=path.relative(workspace,trace).split(path.sep).join('/'); const permissions=roles.map((role)=>({role,externalDirectory:trace+'/orchestrations/*/roles/'+role+'/*',edit:traceOnly.has(role)?relative+'/orchestrations/*/roles/'+role+'/*.md':null})); const plan={schemaVersion:'1.0.0',workspaceRoot:workspace,traceRoot:trace,roles,permissions}; const marker={...plan,nonce:process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE,permissionPlanDigest:createHash('sha256').update(JSON.stringify(plan)).digest('hex')}; fs.writeFileSync(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH,JSON.stringify(marker)+'\\n',{flag:'wx',mode:0o600}); }",
    ' else {',
    ' const runtime=process.env.OPENCODE_HARNESS_RUNTIME_ROOT; const trace=process.env.OPENCODE_HARNESS_TRACE_ROOT; for(const suffix of [\"\",\"-wal\",\"-shm\"]) fs.writeFileSync(process.env.OPENCODE_DB+suffix,suffix||\"db\");',
    " const protocol=fs.readFileSync(path.join(runtime,'bootstrap/memory/protocols/memory-management.md'),'utf8');",
    " let mergedModels=[]; if(process.env.OPENCODE_HARNESS_ROUTING_CATALOG){ const loader=await import('file://'+path.join(runtime,'routing/routing-config-loader.mjs')); mergedModels=Object.keys(loader.loadExternalRoutingPair().document.localRouting.models); } const providerModels=process.env.OPENCODE_CONFIG?Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(process.env.OPENCODE_CONFIG,'utf8')).provider).map(([providerId,provider])=>[providerId,provider.models])):{};",
    " const traceFile=path.join(trace,'orchestrations/fake/roles/validator/fake-validator.md'); fs.mkdirSync(path.dirname(traceFile),{recursive:true,mode:0o700});",
    " const artifact={orchestrationId:'fake',role:'validator',artifactId:'fake-validator',createdAt:'2026-08-16T00:00:00Z',inputContract:{inputsReceived:'fake',requiredContextPresent:'yes',routingMetadataStatus:'absent',workspaceRoot:process.env.OPENCODE_HARNESS_WORKSPACE_ROOT,runtimeRoot:runtime,traceRoot:trace},workPerformed:{summary:'fake role action'},outputContract:{outputs:'fake',evidence:'fake'},handoff:{limitations:'fake only'}}; const fence=String.fromCharCode(96).repeat(3);",
    " fs.writeFileSync(traceFile,'# Fake trace\\n\\n'+fence+'json\\n'+JSON.stringify(artifact,null,2)+'\\n'+fence+'\\n',{mode:0o600});",
    ` fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ argv, cwd: process.cwd(), env: Object.fromEntries(Object.entries(process.env).filter(([k]) => k.startsWith('OPENCODE_'))), protocolRead:protocol.includes('Harness Memory Management Protocol'), traceFile, artifact, mergedModels, providerModels }, null, 2));`,
    " fs.writeFileSync(process.env.OPENCODE_CONFIG_DIR + '/package.json', '{}\\n',{mode:0o600});",
    ' }',
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(fake, script, { mode: 0o700 });
  return fake;
}
function invoke(repo, extra = [], env = {}) {
  const home = path.join(temp, `home-${path.basename(repo)}-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(home, { mode: 0o700 });
  const capture = path.join(home, 'capture.json');
  const result = spawnSync(process.execPath, [CLI, 'run', '--workspace', repo, '--cache-root', path.join(home, 'cache'), ...extra], {
    cwd: path.join(repo, 'nested'), encoding: 'utf8', env: { ...process.env, HOME: home, XDG_CACHE_HOME: path.join(home, 'cache-xdg'), XDG_STATE_HOME: path.join(home, 'state'), OPENCODE_BIN: fakeOpenCode(capture), ...env },
  });
  return { result, capture, home };
}

test('empty foreign Git repository launches without projection or status changes', () => {
  const repo = makeRepo('empty');
  fs.mkdirSync(path.join(repo, 'nested'));
  const before = git(repo, 'status', '--porcelain', '--untracked-files=all').stdout;
  const { result, capture } = invoke(repo, ['--', 'run', 'hello']);
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(fs.readFileSync(capture));
  assert.deepEqual(observed.argv, ['run', 'hello']);
  assert.equal(observed.cwd, repo);
  assert.equal(observed.env.OPENCODE_HARNESS_WORKSPACE_ROOT, repo);
  assert.ok(path.isAbsolute(observed.env.OPENCODE_DB));
  assert.equal(fs.existsSync(path.dirname(observed.env.OPENCODE_DB)), false);
  assert.equal(observed.protocolRead, true);
  assert.equal(observed.artifact.inputContract.runtimeRoot, observed.env.OPENCODE_HARNESS_RUNTIME_ROOT);
  assertTraceShape(observed.artifact);
  const malformedTraces = [
    (value) => { value.extra = true; },
    (value) => { value.inputContract.extra = true; },
    (value) => { delete value.outputContract.evidence; },
    (value) => { delete value.handoff.limitations; },
    (value) => { value.workPerformed = 'wrong'; },
    (value) => { value.role = 'unknown'; },
    (value) => { value.inputContract.routingMetadataStatus = 'unknown'; },
    (value) => { value.artifactId = ''; },
    (value) => { value.workPerformed.commands = ['ok', 2]; },
  ];
  for (const mutate of malformedTraces) { const value = structuredClone(observed.artifact); mutate(value); assert.throws(() => assertTraceShape(value)); }
  assert.throws(() => evaluateSchema({ type: 'string', pattern: '^x$' }, 'x'), /unsupported schema assertion keyword/);
  assert.equal(fs.lstatSync(observed.traceFile).mode & 0o777, 0o600);
  assert.ok(observed.env.OPENCODE_CONFIG_DIR.includes('/cache/'));
  assert.ok(observed.env.OPENCODE_HARNESS_TRACE_ROOT.includes('/state/'));
  assert.equal(observed.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH, undefined);
  assert.equal(observed.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE, undefined);
  assert.equal(fs.existsSync(path.join(repo, '.opencode')), false);
  assert.equal(git(repo, 'status', '--porcelain', '--untracked-files=all').stdout, before);
});

test('existing AGENTS, dirty files, and ignored project memory are preserved', () => {
  const repo = makeRepo('ignored-memory');
  fs.mkdirSync(path.join(repo, 'nested'));
  fs.writeFileSync(path.join(repo, '.gitignore'), '.memory/\n');
  fs.writeFileSync(path.join(repo, 'AGENTS.md'), 'foreign instructions\n');
  fs.writeFileSync(path.join(repo, 'dirty.txt'), 'dirty\n');
  const before = git(repo, 'status', '--porcelain', '--untracked-files=all').stdout;
  const { result, capture } = invoke(repo);
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(fs.readFileSync(capture));
  assert.deepEqual(observed.argv, []);
  assert.equal(observed.cwd, repo);
  assert.equal(observed.env.OPENCODE_HARNESS_TRACE_ROOT, path.join(repo, '.memory'));
  assert.equal(fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8'), 'foreign instructions\n');
  assert.equal(git(repo, 'status', '--porcelain', '--untracked-files=all').stdout, before);
});

test('foreign launch preserves models-first and run-first OpenCode argv', () => {
  const repo = makeRepo('forwarded-grammar');
  fs.mkdirSync(path.join(repo, 'nested'));
  for (const expected of [
    ['models', 'ai-infra-secondary'],
    ['run', '--model', 'provider/model', 'hello'],
  ]) {
    const { result, capture } = invoke(repo, ['--', ...expected]);
    assert.equal(result.status, 0, result.stderr);
    const observed = JSON.parse(fs.readFileSync(capture));
    assert.deepEqual(observed.argv, expected);
    assert.equal(observed.cwd, repo);
  }
});

test('colliding commands, routing shadows, plugins, symlinks, and preset roots fail before fake spawn', () => {
  const commandRepo = makeRepo('command-collision');
  fs.mkdirSync(path.join(commandRepo, 'nested'), { recursive: true });
  fs.mkdirSync(path.join(commandRepo, '.opencode/commands'), { recursive: true });
  fs.writeFileSync(path.join(commandRepo, '.opencode/commands/delegate-plan.md'), 'collision');
  assert.match(invoke(commandRepo).result.stderr, /project collision/);

  const pluginRepo = makeRepo('plugin-collision');
  fs.mkdirSync(path.join(pluginRepo, 'nested'), { recursive: true });
  fs.mkdirSync(path.join(pluginRepo, '.opencode/plugins'), { recursive: true });
  fs.writeFileSync(path.join(pluginRepo, '.opencode/plugins/foreign.js'), 'export default async () => ({})');
  assert.match(invoke(pluginRepo).result.stderr, /allow-project-plugins/);

  const symlinkRepo = makeRepo('symlink-memory');
  fs.mkdirSync(path.join(symlinkRepo, 'nested'));
  fs.writeFileSync(path.join(symlinkRepo, '.gitignore'), '.memory/\n');
  fs.symlinkSync(temp, path.join(symlinkRepo, '.memory'));
  const symlinkResult = invoke(symlinkRepo);
  assert.equal(symlinkResult.result.status, 0, symlinkResult.result.stderr);
  assert.notEqual(JSON.parse(fs.readFileSync(symlinkResult.capture)).env.OPENCODE_HARNESS_TRACE_ROOT, path.join(symlinkRepo, '.memory'));

  const cleanRepo = makeRepo('preset');
  fs.mkdirSync(path.join(cleanRepo, 'nested'));
  assert.match(invoke(cleanRepo, [], { OPENCODE_HARNESS_TRACE_ROOT: '/tmp/poison' }).result.stderr, /refusing pre-set/);

  const traceCollision = makeRepo('trace-seed-collision');
  fs.mkdirSync(path.join(traceCollision, 'nested')); fs.writeFileSync(path.join(traceCollision, '.gitignore'), '.memory/\n');
  fs.mkdirSync(path.join(traceCollision, '.memory'), { mode: 0o700 }); fs.writeFileSync(path.join(traceCollision, '.memory/INDEX.md'), 'collision\n', { mode: 0o600 });
  assert.match(invoke(traceCollision).result.stderr, /trace seed collision/);
});

test('root and config-directory JSON/JSONC collisions and plugins fail closed with bounded acknowledgment', () => {
  function fixture(name, relative, content) {
    const root = makeRepo(name); fs.mkdirSync(path.join(root, 'nested'), { recursive: true });
    fs.mkdirSync(path.dirname(path.join(root, relative)), { recursive: true }); fs.writeFileSync(path.join(root, relative), content); return root;
  }
  assert.match(invoke(fixture('json-agent', 'opencode.json', JSON.stringify({ agent: { planner: {} } }))).result.stderr, /colliding agent/);
  assert.match(invoke(fixture('jsonc-command', '.opencode/opencode.jsonc', '{ // comment\n "command": { "delegate-plan": {}, },\n}')).result.stderr, /colliding command/);
  assert.match(invoke(fixture('jsonc-malformed', 'opencode.jsonc', '{ /* no close')).result.stderr, /unterminated block comment/);
  const plugin = fixture('jsonc-plugin', 'opencode.jsonc', '{\n "plugin": ["foreign-plugin",],\n}');
  assert.match(invoke(plugin).result.stderr, /require --allow-project-plugins/);
  assert.equal(invoke(plugin, ['--allow-project-plugins']).result.status, 0);
  const harnessPlugin = fixture('harness-plugin', 'opencode.json', JSON.stringify({ plugin: ['role-model-routing-enforcement'] }));
  assert.match(invoke(harnessPlugin, ['--allow-project-plugins']).result.stderr, /harness plugin collision/);
  const skill = makeRepo('skill-collision'); fs.mkdirSync(path.join(skill, 'nested')); fs.mkdirSync(path.join(skill, '.opencode/skills/delegation-orchestrator'), { recursive: true });
  assert.match(invoke(skill).result.stderr, /skill collision/);
  const nestedPlugin = makeRepo('nested-plugin'); fs.mkdirSync(path.join(nestedPlugin, 'nested')); fs.mkdirSync(path.join(nestedPlugin, '.opencode/plugins/nested'), { recursive: true }); fs.writeFileSync(path.join(nestedPlugin, '.opencode/plugins/nested/plugin.js'), 'export default {}');
  assert.match(invoke(nestedPlugin).result.stderr, /allow-project-plugins/);
});

test('writable project surfaces reject before probe and post-preflight config insertion is detected', () => {
  function checkedInvoke(root, mutate, name) {
    fs.mkdirSync(path.join(root, 'nested'), { recursive: true }); mutate();
    const marker = path.join(temp, `${name}-version-marker`);
    const outcome = invoke(root, [], { HARNESS_TEST_VERSION_MARKER: marker });
    assert.notEqual(outcome.result.status, 0, name);
    assert.equal(fs.existsSync(marker), false, `${name} must reject before version probe`);
  }
  const writableWorkspace = makeRepo('writable-workspace');
  checkedInvoke(writableWorkspace, () => fs.chmodSync(writableWorkspace, 0o777), 'writable-workspace');

  const writableOpenCode = makeRepo('writable-opencode');
  checkedInvoke(writableOpenCode, () => { fs.mkdirSync(path.join(writableOpenCode, '.opencode')); fs.chmodSync(path.join(writableOpenCode, '.opencode'), 0o777); }, 'writable-opencode');

  const writableConfig = makeRepo('writable-config');
  checkedInvoke(writableConfig, () => { fs.writeFileSync(path.join(writableConfig, 'opencode.json'), '{}\n'); fs.chmodSync(path.join(writableConfig, 'opencode.json'), 0o666); }, 'writable-config');

  const writablePlugins = makeRepo('writable-plugins');
  checkedInvoke(writablePlugins, () => { fs.mkdirSync(path.join(writablePlugins, '.opencode/plugins'), { recursive: true }); fs.chmodSync(path.join(writablePlugins, '.opencode/plugins'), 0o777); }, 'writable-plugins');

  const inserted = makeRepo('post-preflight-insertion'); fs.mkdirSync(path.join(inserted, 'nested'));
  const outcome = invoke(inserted, [], { HARNESS_TEST_INSERT_CONFIG: inserted });
  assert.notEqual(outcome.result.status, 0);
  assert.match(outcome.result.stderr, /plugin declarations require|changed after preflight/);
  assert.equal(fs.existsSync(outcome.capture), false, 'launch phase must not run after insertion');
});

test('absolute custom skill roots are trusted, recursively inspected, and rechecked', () => {
  const trustedRoot = path.join(temp, 'trusted-custom-skills'); fs.mkdirSync(trustedRoot, { mode: 0o700 });
  fs.mkdirSync(path.join(trustedRoot, 'other-skill'), { mode: 0o700 }); fs.writeFileSync(path.join(trustedRoot, 'other-skill/SKILL.md'), '# Other\n', { mode: 0o600 });
  const trustedRepo = makeRepo('trusted-custom-skill-repo'); fs.mkdirSync(path.join(trustedRepo, 'nested')); fs.writeFileSync(path.join(trustedRepo, 'opencode.json'), JSON.stringify({ skills: { paths: [trustedRoot] } }));
  assert.equal(invoke(trustedRepo).result.status, 0);

  const collisionRoot = path.join(temp, 'collision-custom-skills'); fs.mkdirSync(path.join(collisionRoot, 'nested/delegation-orchestrator'), { recursive: true, mode: 0o700 }); fs.writeFileSync(path.join(collisionRoot, 'nested/delegation-orchestrator/SKILL.md'), '# Collision\n', { mode: 0o600 });
  const collisionRepo = makeRepo('collision-custom-skill-repo'); fs.mkdirSync(path.join(collisionRepo, 'nested')); fs.writeFileSync(path.join(collisionRepo, 'opencode.json'), JSON.stringify({ skills: { paths: [collisionRoot] } }));
  assert.match(invoke(collisionRepo).result.stderr, /contains delegation-orchestrator\/SKILL\.md/);

  const relativeRepo = makeRepo('relative-custom-skill-repo'); fs.mkdirSync(path.join(relativeRepo, 'nested')); fs.writeFileSync(path.join(relativeRepo, 'opencode.json'), JSON.stringify({ skills: { paths: ['./skills'] } }));
  assert.match(invoke(relativeRepo).result.stderr, /custom skill paths must be absolute/);
});

test('large valid custom skill assets use stable streaming fingerprints and post-probe mutation is detected', () => {
  const skillRoot = path.join(temp, 'large-custom-skills'); fs.mkdirSync(path.join(skillRoot, 'large-skill'), { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(skillRoot, 'large-skill/SKILL.md'), '# Large skill\n', { mode: 0o600 });
  const asset = path.join(skillRoot, 'large-skill/reference.bin'); fs.writeFileSync(asset, Buffer.alloc(1024 * 1024 + 1, 0x61), { mode: 0o600 });
  const root = makeRepo('large-custom-skill-repo'); fs.mkdirSync(path.join(root, 'nested')); fs.writeFileSync(path.join(root, 'opencode.json'), JSON.stringify({ skills: { paths: [skillRoot] } }));
  const accepted = invoke(root);
  assert.equal(accepted.result.status, 0, accepted.result.stderr);
  const changed = invoke(root, [], { HARNESS_TEST_MUTATE_ASSET: asset });
  assert.notEqual(changed.result.status, 0);
  assert.match(changed.result.stderr, /changed after preflight/);
  assert.equal(fs.existsSync(changed.capture), false);
});

function jsonFiles(root) {
  const found = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const candidate = path.join(root, entry.name);
    if (entry.isDirectory()) found.push(...jsonFiles(candidate));
    else if (entry.isFile() && entry.name.endsWith('.json')) found.push(candidate);
  }
  return found;
}

test('optional external fixture bundle reaches fake OpenCode through concrete owner-only paths', { skip: EXTERNAL_BUNDLE === null }, () => {
  assert.ok(fs.lstatSync(EXTERNAL_BUNDLE).isDirectory(), 'external bundle must be a directory');
  let provider;
  let catalog;
  for (const filename of jsonFiles(EXTERNAL_BUNDLE)) {
    const document = JSON.parse(fs.readFileSync(filename, 'utf8'));
    if (document.provider && !provider) provider = filename;
    if (document.schemaVersion === '1.0.0' && document.models && !catalog) catalog = filename;
  }
  assert.ok(provider, 'external bundle must contain a provider projection');
  assert.ok(catalog, 'external bundle must contain an endpoint catalog');
  assert.equal(fs.lstatSync(provider).mode & 0o777, 0o600, 'provider projection must already be mode 0600');
  assert.equal(fs.lstatSync(catalog).mode & 0o777, 0o600, 'endpoint catalog must already be mode 0600');
  const catalogDocument = JSON.parse(fs.readFileSync(catalog, 'utf8'));
  const providerDocument = JSON.parse(fs.readFileSync(provider, 'utf8'));
  const first = Object.keys(catalogDocument.models).sort()[0];
  assert.ok(first, 'external catalog must contain a model');
  const profile = JSON.parse(fs.readFileSync(path.join(ROOT, '.opencode/routing/harness-model-routing.example.json'), 'utf8')).harnessModelRouting;
  delete profile.localRouting.models;
  profile.localRouting.enabled = true;
  profile.localRouting.forceLocalForHarnessSubagents = false;
  profile.localRouting.defaultLocalModel = first;
  for (const role of Object.values(profile.roleOverrides)) role.localModel = first;
  const profilePath = path.join(temp, '.runtime-test-profile.json');
  fs.writeFileSync(profilePath, `${JSON.stringify(profile, null, 2)}\n`, { mode: 0o600 });
  const repo = makeRepo('external-bundle');
  fs.mkdirSync(path.join(repo, 'nested'));
  const { result, capture } = invoke(repo, ['--provider-config', provider, '--routing-catalog', catalog, '--routing-profile', profilePath]);
  assert.equal(result.status, 0, result.stderr);
  const observed = JSON.parse(fs.readFileSync(capture));
  assert.notEqual(observed.env.OPENCODE_CONFIG, fs.realpathSync(provider));
  assert.notEqual(observed.env.OPENCODE_HARNESS_ROUTING_CATALOG, fs.realpathSync(catalog));
  assert.notEqual(observed.env.OPENCODE_HARNESS_ROUTING_PROFILE, fs.realpathSync(profilePath));
  assert.equal(fs.existsSync(observed.env.OPENCODE_CONFIG), false);
  assert.equal(fs.existsSync(observed.env.OPENCODE_HARNESS_ROUTING_CATALOG), false);
  assert.deepEqual(observed.mergedModels, Object.keys(catalogDocument.models));
  const expectedModels = Object.fromEntries(Object.entries(providerDocument.provider).map(([providerId, providerEntry]) => [providerId, providerEntry.models]));
  assert.deepEqual(observed.providerModels, expectedModels, 'provider models, including exact thinking booleans, must survive the owner-only snapshot path');
  for (const provider of Object.values(observed.providerModels)) for (const model of Object.values(provider)) {
    assert.equal(typeof model.options.chat_template_kwargs.enable_thinking, 'boolean');
  }
  assert.equal(observed.artifact.inputContract.runtimeRoot, observed.env.OPENCODE_HARNESS_RUNTIME_ROOT);
  fs.rmSync(profilePath);
});
