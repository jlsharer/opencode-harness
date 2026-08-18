#!/usr/bin/env node

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CLI = path.join(ROOT, 'bin/opencode-harness.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-harness-runtime-'));
const mkfifoAvailable = spawnSync('mkfifo', ['--version'], { stdio: 'ignore' }).error === undefined;
test.after(() => fs.rmSync(temp, { recursive: true, force: true }));

function run(args, env = {}, cwd = temp) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
}

function prepare(name) {
  const cache = path.join(temp, name);
  const result = run(['prepare', '--cache-root', cache]);
  assert.equal(result.status, 0, result.stderr);
  return { cache, runtime: result.stdout.trim() };
}

function fake(name, version = '1.18.18') {
  const capture = path.join(temp, `${name}-capture.json`);
  const executable = path.join(temp, `${name}-opencode.mjs`);
  const script = [
    '#!/usr/bin/env node',
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "import { createHash } from 'node:crypto';",
    "import { spawnSync } from 'node:child_process';",
    `if (process.argv[2] === '--version') process.stdout.write(${JSON.stringify(`${version}\n`)});`,
    'else {',
    " const argv=process.argv.slice(2); const commands=new Set(['models','agent','run']);",
    " if(argv.length && !commands.has(argv[0])) { process.stderr.write('fake OpenCode top-level grammar rejected project-before-subcommand argv\\n'); process.exitCode=64; }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_NONZERO){ process.stderr.write('injected probe failure\\n'); process.exitCode=22; }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_MISSING){ }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_WRONG){ fs.writeFileSync(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH,'{}\\n',{flag:'wx',mode:0o600}); }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH){ const roles=['artifact-verifier','implementer','integrator','planner','researcher','reviewer','synthesizer','validator']; const traceOnly=new Set(['artifact-verifier','planner','researcher','reviewer','synthesizer','validator']); const workspace=process.env.OPENCODE_HARNESS_WORKSPACE_ROOT; const trace=process.env.OPENCODE_HARNESS_TRACE_ROOT; const relative=path.relative(workspace,trace).split(path.sep).join('/'); const permissions=roles.map((role)=>({role,externalDirectory:trace+'/orchestrations/*/roles/'+role+'/*',edit:traceOnly.has(role)?relative+'/orchestrations/*/roles/'+role+'/*.md':null})); const plan={schemaVersion:'1.0.0',workspaceRoot:workspace,traceRoot:trace,roles,permissions}; const marker={...plan,nonce:process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE,permissionPlanDigest:createHash('sha256').update(JSON.stringify(plan)).digest('hex')}; fs.writeFileSync(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH,JSON.stringify(marker)+'\\n',{flag:'wx',mode:0o600}); }",
    ` else { const keys=['OPENCODE_CONFIG','OPENCODE_HARNESS_ROUTING_CATALOG','OPENCODE_HARNESS_ROUTING_PROFILE']; const launch=new URL('.', 'file://'+process.env.OPENCODE_DB).pathname; const databaseAbsentAtEntry=Object.fromEntries([['db',''],['wal','-wal'],['shm','-shm']].map(([name,suffix])=>[name,!fs.existsSync(process.env.OPENCODE_DB+suffix)])); if(Object.values(databaseAbsentAtEntry).some((absent)=>!absent)) throw new Error('database companion existed before fake child entry'); if(process.env.HARNESS_TEST_SWAP) fs.writeFileSync(process.env.HARNESS_TEST_SWAP,'{"swapped":true}\\n'); if(process.env.HARNESS_TEST_DB_FILES){ for(const suffix of ['', '-wal', '-shm']) fs.writeFileSync(process.env.OPENCODE_DB+suffix,suffix||'db'); } if(process.env.HARNESS_TEST_DB_SYMLINK){ const suffix=process.env.HARNESS_TEST_DB_SYMLINK_SUFFIX==='main'?'':(process.env.HARNESS_TEST_DB_SYMLINK_SUFFIX||'-wal'); fs.symlinkSync(process.env.HARNESS_TEST_DB_SYMLINK,process.env.OPENCODE_DB+suffix); } if(process.env.HARNESS_TEST_DB_WRONG_MODE){ const suffix=process.env.HARNESS_TEST_DB_WRONG_MODE==='main'?'':process.env.HARNESS_TEST_DB_WRONG_MODE; fs.writeFileSync(process.env.OPENCODE_DB+suffix,'wrong-mode'); fs.chmodSync(process.env.OPENCODE_DB+suffix,0o644); } if(process.env.HARNESS_TEST_DB_UNEXPECTED) fs.writeFileSync(new URL('unexpected','file://'+process.env.OPENCODE_DB).pathname,'unexpected'); if(process.env.HARNESS_TEST_DB_UNEXPECTED_DIR){ fs.mkdirSync(launch+'unexpected-dir/nested',{recursive:true}); fs.writeFileSync(launch+'unexpected-dir/nested/file','nested'); } if(process.env.HARNESS_TEST_DB_UNEXPECTED_SYMLINK) fs.symlinkSync(process.env.HARNESS_TEST_DB_UNEXPECTED_SYMLINK,launch+'unexpected-link'); if(process.env.HARNESS_TEST_DB_CONFUSION){ fs.mkdirSync(process.env.OPENCODE_DB+'-wal'); fs.symlinkSync(process.env.HARNESS_TEST_DB_CONFUSION,process.env.OPENCODE_DB+'-wal/outside-link'); } if(process.env.HARNESS_TEST_DB_SPECIAL) spawnSync('mkfifo',[launch+'unexpected-fifo']); const modes=Object.fromEntries(keys.filter((key)=>process.env[key]).map((key)=>[key,fs.lstatSync(process.env[key]).mode&0o777])); const snapshots=Object.fromEntries(keys.filter((key)=>process.env[key]).map((key)=>[key,fs.readFileSync(process.env[key],'utf8')])); const documents=Object.fromEntries(Object.entries(snapshots).map(([key,value])=>[key,JSON.parse(value)]));`,
    ` fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({env: process.env, argv, cwd: process.cwd(), modes, snapshots, documents, databaseAbsentAtEntry, databaseModes:Object.fromEntries(['','-wal','-shm'].filter((suffix)=>fs.existsSync(process.env.OPENCODE_DB+suffix)).map((suffix)=>[suffix||'db',fs.lstatSync(process.env.OPENCODE_DB+suffix).mode&0o777]))})); if(process.env.HARNESS_TEST_CHILD_FAIL) process.exitCode=23; }`,
    '}',
    '',
  ].join('\n');
  fs.writeFileSync(executable, script, { mode: 0o700 });
  return { executable, capture };
}

function repo(name) {
  const root = path.join(temp, name);
  fs.mkdirSync(root);
  spawnSync('git', ['init', '-q', root]);
  return root;
}

function writePrivate(filename, document) {
  fs.writeFileSync(filename, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600 });
  return filename;
}

function writeGeneratedJson(filename, document) {
  fs.writeFileSync(filename, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(filename, 0o600);
}

function canonicalInventory(root) {
  const records = [];
  function walk(relative = '') {
    const directory = relative ? path.join(root, relative) : root;
    for (const name of fs.readdirSync(directory).sort()) {
      const childRelative = relative ? `${relative}/${name}` : name;
      const child = path.join(root, childRelative);
      const stat = fs.lstatSync(child);
      if (stat.isSymbolicLink()) records.push(`link:${childRelative}:${stat.uid}:${stat.mode & 0o777}:${fs.readlinkSync(child)}`);
      else if (stat.isDirectory()) { records.push(`dir:${childRelative}:${stat.uid}:${stat.mode & 0o777}`); walk(childRelative); }
      else records.push(`file:${childRelative}:${stat.uid}:${stat.mode & 0o777}:${createHash('sha256').update(fs.readFileSync(child)).digest('hex')}`);
    }
  }
  walk();
  return records.join('\n');
}

function generatedNodeModulesFixture(name) {
  const prepared = prepare(name);
  const nodeModules = path.join(prepared.runtime, 'node_modules');
  fs.mkdirSync(path.join(nodeModules, '.bin'), { recursive: true, mode: 0o700 });
  const packages = {
    '@opencode-ai/plugin': { version: '1.18.18' },
    'msgpackr-extract': { version: '3.0.3', bin: { 'download-msgpackr-prebuilds': './bin/download.js' } },
    'node-gyp-build-optional-packages': { version: '5.2.2', bin: {
      'node-gyp-build-optional-packages': 'bin.js',
      'node-gyp-build-optional-packages-optional': './optional.js',
      'node-gyp-build-optional-packages-test': 'build-test.js',
    } },
    which: { version: '5.0.0', bin: { 'node-which': './bin/node-which.js' } },
    uuid: { version: '14.0.1', bin: './dist-node/bin/uuid' },
    yaml: { version: '2.8.1', bin: 'bin.mjs' },
  };
  const lockPackages = { '': { dependencies: { '@opencode-ai/plugin': '1.18.18' } } };
  const links = {};
  for (const [packageName, metadata] of Object.entries(packages)) {
    const directory = path.join(nodeModules, ...packageName.split('/'));
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeGeneratedJson(path.join(directory, 'package.json'), { name: packageName, ...metadata });
    lockPackages[`node_modules/${packageName}`] = { version: metadata.version };
    const declarations = typeof metadata.bin === 'string' ? [[packageName.split('/').at(-1), metadata.bin]] : Object.entries(metadata.bin ?? {});
    for (const [binName, rawTarget] of declarations) {
      const target = rawTarget.startsWith('./') ? rawTarget.slice(2) : rawTarget;
      const targetFile = path.join(directory, ...target.split('/'));
      fs.mkdirSync(path.dirname(targetFile), { recursive: true, mode: 0o700 });
      fs.writeFileSync(targetFile, '#!/usr/bin/env node\n', { mode: 0o700 });
      const linkText = path.posix.relative('.bin', path.posix.join(packageName, target));
      fs.symlinkSync(linkText, path.join(nodeModules, '.bin', binName));
      links[binName] = { packageName, target, targetFile, linkText };
    }
  }
  writeGeneratedJson(path.join(prepared.runtime, 'package.json'), { dependencies: { '@opencode-ai/plugin': '1.18.18' } });
  writeGeneratedJson(path.join(prepared.runtime, 'package-lock.json'), { name: 'fixture', lockfileVersion: 3, packages: lockPackages });
  writeGeneratedJson(path.join(nodeModules, '.package-lock.json'), { lockfileVersion: 3, packages: Object.fromEntries(Object.entries(lockPackages).filter(([key]) => key)) });
  return { ...prepared, nodeModules, packages, links };
}

function updateJson(filename, mutate) {
  const document = JSON.parse(fs.readFileSync(filename, 'utf8'));
  mutate(document);
  writeGeneratedJson(filename, document);
}

function validProvider(enableThinking = false) {
  return { $schema: 'https://opencode.ai/config.json', provider: { 'ai-infra-test': { npm: '@ai-sdk/openai-compatible', name: 'test', options: { baseURL: 'http://127.0.0.1:8080/v1' }, models: { model: { name: 'model', limit: { context: 8192, output: 384 }, options: { chat_template_kwargs: { enable_thinking: enableThinking } } } } } } };
}

test('prepare creates a deterministic owner-only runtime and reuses it', () => {
  const cache = path.join(temp, 'cache');
  const first = run(['prepare', '--cache-root', cache]);
  assert.equal(first.status, 0, first.stderr);
  const runtime = first.stdout.trim();
  assert.equal(fs.lstatSync(runtime).mode & 0o777, 0o700);
  assert.equal(fs.lstatSync(path.join(runtime, 'agents/researcher.md')).mode & 0o777, 0o644);
  const second = run(['prepare', '--cache-root', cache], {}, '/');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout.trim(), runtime);
});

test('prepared runtime plugin imports its complete production graph', async () => {
  const prepared = prepare('prepared-plugin-import');
  const plugin = await import(`${pathToFileURL(path.join(prepared.runtime, 'plugins/index.js')).href}?prepared=${Date.now()}`);
  assert.equal(typeof plugin.default, 'function');
  const hooks = await plugin.default({});
  for (const name of ['config', 'tool.execute.before', 'tool.execute.after', 'command.execute.before']) assert.equal(typeof hooks[name], 'function', name);
});

test('prepare refuses managed drift and symlink collisions without repairing them', () => {
  const cache = path.join(temp, 'drift-cache');
  const prepared = run(['prepare', '--cache-root', cache]);
  assert.equal(prepared.status, 0, prepared.stderr);
  const target = path.join(prepared.stdout.trim(), 'agents/researcher.md');
  fs.appendFileSync(target, '\ndrift\n');
  const drift = run(['prepare', '--cache-root', cache]);
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /managed runtime drift/);
  const collisionCache = path.join(temp, 'symlink-cache');
  const runtime = path.join(collisionCache, '0.1.8/opencode-1.18.18/runtime');
  fs.mkdirSync(path.dirname(runtime), { recursive: true, mode: 0o700 });
  fs.symlinkSync(temp, runtime);
  const collision = run(['prepare', '--cache-root', collisionCache]);
  assert.notEqual(collision.status, 0);
  assert.match(collision.stderr, /must not be a symlink|non-symlink directory/);
});

test('run rejects activation environment poisoning and partial routing pairs before spawn', () => {
  const repo = path.join(temp, 'poison-repo');
  fs.mkdirSync(repo);
  spawnSync('git', ['init', '-q', repo]);
  const poisoned = run(['run', '--workspace', repo], { OPENCODE_CONFIG_DIR: '/tmp/poison' });
  assert.notEqual(poisoned.status, 0);
  assert.match(poisoned.stderr, /refusing pre-set OPENCODE_CONFIG_DIR/);
  const partial = run(['run', '--workspace', repo, '--routing-catalog', '/tmp/catalog']);
  assert.notEqual(partial.status, 0);
  assert.match(partial.stderr, /all-or-none pair/);
});

test('help is available from arbitrary working directories', () => {
  const result = run(['help'], {}, '/');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /prepare/);
  assert.match(result.stdout, /run --workspace ABS/);
});

test('run keeps workspace in cwd and forwards TUI, models, and run grammar unchanged', () => {
  const workspace = repo('forwarding-repo');
  const cases = [
    ['tui', [], []],
    ['models', ['--', 'models', 'ai-infra-secondary'], ['models', 'ai-infra-secondary']],
    ['run', ['--', 'run', '--model', 'provider/model', 'hello'], ['run', '--model', 'provider/model', 'hello']],
  ];
  for (const [name, forwarded, expected] of cases) {
    const opencode = fake(`forwarding-${name}`);
    const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, `forwarding-${name}-cache`), ...forwarded], { OPENCODE_BIN: opencode.executable });
    assert.equal(result.status, 0, result.stderr);
    const captured = JSON.parse(fs.readFileSync(opencode.capture));
    assert.deepEqual(captured.argv, expected);
    assert.equal(captured.cwd, workspace);
  }
  const grammar = fake('workspace-prepend-regression');
  const rejected = spawnSync(grammar.executable, [workspace, 'models', 'ai-infra-secondary'], { cwd: workspace, encoding: 'utf8' });
  assert.equal(rejected.status, 64);
  assert.match(rejected.stderr, /project-before-subcommand/);
});

test('recursive runtime inventory rejects undeclared leaves, symlinked intermediates, unsafe modes, and generated abuse', () => {
  const cases = [
    ['extra-agent', (runtime) => fs.writeFileSync(path.join(runtime, 'agents/extra.md'), 'extra', { mode: 0o644 }), /undeclared runtime entry/],
    ['wrong-directory-mode', (runtime) => fs.chmodSync(path.join(runtime, 'agents'), 0o755), /expected 700/],
    ['generated-mode', (runtime) => fs.writeFileSync(path.join(runtime, '.gitignore'), 'node_modules\n', { mode: 0o644 }), /expected 600/],
    ['generated-type', (runtime) => fs.mkdirSync(path.join(runtime, '.gitignore'), { mode: 0o700 }), /regular file/],
    ['node-modules-symlink', (runtime) => { fs.mkdirSync(path.join(runtime, 'node_modules'), { mode: 0o700 }); fs.symlinkSync(temp, path.join(runtime, 'node_modules/escape')); }, /generated package.json.*present together|unsafe recursive generated symlink/],
    ['symlinked-intermediate', (runtime) => { fs.renameSync(path.join(runtime, 'plugins'), path.join(runtime, 'plugins-real')); fs.symlinkSync(path.join(runtime, 'plugins-real'), path.join(runtime, 'plugins')); }, /must not be a symlink|undeclared runtime entry/],
  ];
  for (const [name, mutate, expected] of cases) {
    const prepared = prepare(`recursive-${name}`);
    mutate(prepared.runtime);
    const result = run(['prepare', '--cache-root', prepared.cache]);
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
  }
});

test('generated package metadata accepts seven stock-style node_modules bin links twice without mutation', () => {
  const fixture = generatedNodeModulesFixture('generated-bin-positive');
  const before = canonicalInventory(fixture.runtime);
  const first = run(['prepare', '--cache-root', fixture.cache]);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(canonicalInventory(fixture.runtime), before);
  const second = run(['prepare', '--cache-root', fixture.cache], {}, '/');
  assert.equal(second.status, 0, second.stderr);
  assert.equal(canonicalInventory(fixture.runtime), before);
  assert.deepEqual(Object.keys(fixture.links).sort(), [
    'download-msgpackr-prebuilds', 'node-gyp-build-optional-packages', 'node-gyp-build-optional-packages-optional',
    'node-gyp-build-optional-packages-test', 'node-which', 'uuid', 'yaml',
  ]);
});

test('symlinked node_modules root rejects before package, lock, or external canary metadata is read', () => {
  const prepared = prepare('generated-bin-root-symlink');
  const external = path.join(temp, 'generated-bin-root-external');
  const externalPackage = path.join(external, 'probe/package.json');
  fs.mkdirSync(path.dirname(externalPackage), { recursive: true, mode: 0o700 });
  fs.writeFileSync(externalPackage, '{external-canary', { mode: 0o600 });
  const packageFilename = path.join(prepared.runtime, 'package.json');
  const lockFilename = path.join(prepared.runtime, 'package-lock.json');
  writeGeneratedJson(packageFilename, { dependencies: { '@opencode-ai/plugin': '1.18.18' } });
  writeGeneratedJson(lockFilename, { lockfileVersion: 3, packages: {
    '': { dependencies: { '@opencode-ai/plugin': '1.18.18' } },
    'node_modules/@opencode-ai/plugin': { version: '1.18.18' },
    'node_modules/probe': { version: '1.0.0' },
  } });
  fs.symlinkSync(external, path.join(prepared.runtime, 'node_modules'));
  const old = new Date('2000-01-01T00:00:00.000Z');
  for (const filename of [packageFilename, lockFilename, externalPackage]) fs.utimesSync(filename, old, old);
  const before = [packageFilename, lockFilename, externalPackage].map((filename) => fs.lstatSync(filename, { bigint: true }).atimeNs);
  const result = run(['prepare', '--cache-root', prepared.cache]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /generated runtime directory node_modules must not be a symlink/);
  const after = [packageFilename, lockFilename, externalPackage].map((filename) => fs.lstatSync(filename, { bigint: true }).atimeNs);
  assert.deepEqual(after, before, 'root package, lock, and external canary metadata must remain unread');
  assert.equal(fs.readFileSync(externalPackage, 'utf8'), '{external-canary');
});

test('generated node_modules bin link and package metadata attacks are all rejected without repair', (context) => {
  const cases = [
    ['absolute-link', (f) => { const link = path.join(f.nodeModules, '.bin/uuid'); fs.unlinkSync(link); fs.symlinkSync(f.links.uuid.targetFile, link); }],
    ['dangling-target', (f) => fs.unlinkSync(f.links.uuid.targetFile)],
    ['lexical-dot-dot-escape', (f) => { const link = path.join(f.nodeModules, '.bin/uuid'); fs.unlinkSync(link); fs.symlinkSync('../../../outside', link); }],
    ['resolved-escape', (f) => { const outside = path.join(temp, 'resolved-outside'); fs.writeFileSync(outside, 'x', { mode: 0o600 }); fs.unlinkSync(f.links.uuid.targetFile); fs.symlinkSync(outside, f.links.uuid.targetFile); }],
    ['directory-target', (f) => { fs.unlinkSync(f.links.uuid.targetFile); fs.mkdirSync(f.links.uuid.targetFile, { mode: 0o700 }); }],
    ['chained-target', (f) => { fs.unlinkSync(f.links.uuid.targetFile); fs.symlinkSync('../../../yaml/bin.mjs', f.links.uuid.targetFile); }],
    ['looped-target', (f) => { fs.unlinkSync(f.links.uuid.targetFile); fs.symlinkSync('uuid', f.links.uuid.targetFile); }],
    ['symlinked-intermediate', (f) => { const bin = path.dirname(f.links.uuid.targetFile); const real = `${bin}-real`; fs.renameSync(bin, real); fs.symlinkSync(real, bin); }],
    ['outside-bin-location', (f) => fs.symlinkSync(f.links.uuid.linkText, path.join(f.nodeModules, 'uuid-link'))],
    ['nested-bin-location', (f) => { const nested = path.join(f.nodeModules, 'uuid/.bin'); fs.mkdirSync(nested, { mode: 0o700 }); fs.symlinkSync('../dist-node/bin/uuid', path.join(nested, 'uuid')); }],
    ['writable-target', (f) => fs.chmodSync(f.links.uuid.targetFile, 0o722)],
    ['wrong-link-name', (f) => fs.renameSync(path.join(f.nodeModules, '.bin/uuid'), path.join(f.nodeModules, '.bin/not-uuid'))],
    ['wrong-link-text', (f) => { const link = path.join(f.nodeModules, '.bin/uuid'); fs.unlinkSync(link); fs.symlinkSync('../yaml/bin.mjs', link); }],
    ['missing-bin-metadata', (f) => updateJson(path.join(f.nodeModules, 'uuid/package.json'), (value) => { delete value.bin; })],
    ['conflicting-bin-metadata', (f) => updateJson(path.join(f.nodeModules, 'which/package.json'), (value) => { value.bin.uuid = './bin/node-which.js'; })],
    ['malformed-lock', (f) => fs.writeFileSync(path.join(f.runtime, 'package-lock.json'), '{', { mode: 0o600 })],
    ['partial-package-lock', (f) => fs.unlinkSync(path.join(f.runtime, 'package-lock.json'))],
    ['lock-version-mismatch', (f) => updateJson(path.join(f.runtime, 'package-lock.json'), (value) => { value.packages['node_modules/uuid'].version = '0.0.0'; })],
    ['lock-link-entry', (f) => updateJson(path.join(f.runtime, 'package-lock.json'), (value) => { value.packages['node_modules/uuid'].link = true; })],
    ['root-dependency-mismatch', (f) => updateJson(path.join(f.runtime, 'package.json'), (value) => { value.dependencies['@opencode-ai/plugin'] = '^1.18.18'; })],
  ];
  for (const [name, mutate] of cases) {
    const fixture = generatedNodeModulesFixture(`generated-bin-attack-${name}`);
    mutate(fixture);
    const before = canonicalInventory(fixture.runtime);
    const result = run(['prepare', '--cache-root', fixture.cache]);
    assert.notEqual(result.status, 0, name);
    assert.equal(canonicalInventory(fixture.runtime), before, `${name} must not be repaired`);
  }

  const owner = generatedNodeModulesFixture('generated-bin-attack-owner');
  try { fs.chownSync(owner.links.uuid.targetFile, 65534, 65534); }
  catch { context.diagnostic('different-UID generated bin target fixture skipped: unprivileged chown'); return; }
  const ownerBefore = canonicalInventory(owner.runtime);
  assert.notEqual(run(['prepare', '--cache-root', owner.cache]).status, 0);
  assert.equal(canonicalInventory(owner.runtime), ownerBefore);
});

test('trace roots receive immutable seeds, are idempotent, and reject explicit collisions or unsafe modes', () => {
  const workspace = repo('trace-repo');
  const trace = path.join(temp, 'explicit-trace');
  const opencode = fake('trace');
  const args = ['run', '--workspace', workspace, '--cache-root', path.join(temp, 'trace-cache'), '--trace-root', trace];
  const first = run(args, { OPENCODE_BIN: opencode.executable });
  assert.equal(first.status, 0, first.stderr);
  for (const relative of ['INDEX.md', 'protocols/memory-management.md', 'templates/orchestration-index.md', 'templates/role-trace-artifact.md']) {
    const target = path.join(trace, relative);
    assert.equal(fs.lstatSync(target).mode & 0o777, 0o600);
  }
  assert.equal(run(args, { OPENCODE_BIN: opencode.executable }).status, 0);
  fs.writeFileSync(path.join(trace, 'INDEX.md'), 'collision\n', { mode: 0o600 });
  assert.match(run(args, { OPENCODE_BIN: opencode.executable }).stderr, /trace seed collision/);
  const unsafe = path.join(temp, 'unsafe-trace');
  fs.mkdirSync(unsafe, { mode: 0o755 });
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'unsafe-cache'), '--trace-root', unsafe], { OPENCODE_BIN: opencode.executable }).stderr, /expected 700/);
});

test('external trace activation probe fails closed before requested spawn and workspace fallback skips it', () => {
  const workspace = repo('trace-probe-repo');
  for (const [name, fixture, expected] of [
    ['missing', { HARNESS_TEST_PROBE_MISSING: '1' }, /activation marker is unavailable/],
    ['wrong', { HARNESS_TEST_PROBE_WRONG: '1' }, /activation marker mismatch/],
    ['nonzero', { HARNESS_TEST_PROBE_NONZERO: '1' }, /activation probe failed with status 22/],
  ]) {
    const opencode = fake(`trace-probe-${name}`);
    const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, `trace-probe-${name}-cache`), '--trace-root', privateTrace(name)], { OPENCODE_BIN: opencode.executable, ...fixture });
    assert.notEqual(result.status, 0, name); assert.match(result.stderr, expected, name); assert.equal(fs.existsSync(opencode.capture), false, `${name} requested child must not start`);
  }
  function privateTrace(name) { const root = path.join(temp, `trace-probe-${name}`); fs.mkdirSync(root, { mode: 0o700 }); return root; }
  fs.chmodSync(workspace, 0o700);
  fs.writeFileSync(path.join(workspace, '.gitignore'), '.memory/\n');
  const fallback = fake('trace-probe-fallback');
  const accepted = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'trace-probe-fallback-cache')], { OPENCODE_BIN: fallback.executable, HARNESS_TEST_PROBE_NONZERO: '1' });
  assert.equal(accepted.status, 0, accepted.stderr);
  const captured = JSON.parse(fs.readFileSync(fallback.capture));
  assert.equal(captured.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH, undefined);
  assert.equal(captured.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE, undefined);
});

test('provider projection validation is closed, credential-free, loopback-only, and semantically coherent', () => {
  const workspace = repo('provider-repo');
  const opencode = fake('provider');
  const base = validProvider();
  const mutations = [
    ['unknown', (value) => { value.extra = true; }, /extra is forbidden/],
    ['credential', (value) => { value.provider['ai-infra-test'].options.apiKey = 'secret'; }, /apiKey is forbidden/],
    ['plugin', (value) => { value.plugin = ['bad']; }, /plugin is forbidden/],
    ['instructions', (value) => { value.instructions = ['bad']; }, /instructions is forbidden/],
    ['host', (value) => { value.provider['ai-infra-test'].options.baseURL = 'http://localhost:8080/v1'; }, /canonical/],
    ['port', (value) => { value.provider['ai-infra-test'].options.baseURL = 'http://127.0.0.1:65536/v1'; }, /invalid port|URL/],
    ['model-mismatch', (value) => { value.provider['ai-infra-test'].models.model.name = 'other'; }, /key\/name mismatch/],
    ['limit-missing', (value) => { delete value.provider['ai-infra-test'].models.model.limit; }, /limit is required/],
    ['limit-extra', (value) => { value.provider['ai-infra-test'].models.model.limit.extra = 1; }, /extra is forbidden/],
    ['context-missing', (value) => { delete value.provider['ai-infra-test'].models.model.limit.context; }, /context is required/],
    ['context-zero', (value) => { value.provider['ai-infra-test'].models.model.limit.context = 0; }, /context limit is out of range/],
    ['context-boolean', (value) => { value.provider['ai-infra-test'].models.model.limit.context = true; }, /context limit is out of range/],
    ['context-overflow', (value) => { value.provider['ai-infra-test'].models.model.limit.context = 2147483648; }, /context limit is out of range/],
    ['output-missing', (value) => { delete value.provider['ai-infra-test'].models.model.limit.output; }, /output is required/],
    ['output-zero', (value) => { value.provider['ai-infra-test'].models.model.limit.output = 0; }, /output limit is out of range/],
    ['output-boolean', (value) => { value.provider['ai-infra-test'].models.model.limit.output = true; }, /output limit is out of range/],
    ['output-overflow', (value) => { value.provider['ai-infra-test'].models.model.limit.output = 2147483648; }, /output limit is out of range/],
    ['output-equal-context', (value) => { value.provider['ai-infra-test'].models.model.limit.output = 8192; }, /less than context/],
    ['output-greater-context', (value) => { value.provider['ai-infra-test'].models.model.limit.output = 8193; }, /less than context/],
    ['model-options-missing', (value) => { delete value.provider['ai-infra-test'].models.model.options; }, /options is required/],
    ['model-options-extra', (value) => { value.provider['ai-infra-test'].models.model.options.extra = true; }, /extra is forbidden/],
    ['chat-template-missing', (value) => { delete value.provider['ai-infra-test'].models.model.options.chat_template_kwargs; }, /chat_template_kwargs is required/],
    ['chat-template-extra', (value) => { value.provider['ai-infra-test'].models.model.options.chat_template_kwargs.unknown = true; }, /unknown is forbidden/],
    ['thinking-missing', (value) => { delete value.provider['ai-infra-test'].models.model.options.chat_template_kwargs.enable_thinking; }, /enable_thinking is required/],
    ['thinking-string', (value) => { value.provider['ai-infra-test'].models.model.options.chat_template_kwargs.enable_thinking = 'false'; }, /must be a boolean/],
    ['thinking-null', (value) => { value.provider['ai-infra-test'].models.model.options.chat_template_kwargs.enable_thinking = null; }, /must be a boolean/],
  ];
  for (const [name, mutate, expected] of mutations) {
    const value = structuredClone(base); mutate(value);
    const filename = writePrivate(path.join(temp, `provider-${name}.json`), value);
    const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, `provider-cache-${name}`), '--provider-config', filename], { OPENCODE_BIN: opencode.executable });
    assert.notEqual(result.status, 0, name); assert.match(result.stderr, expected, name);
    assert.equal(fs.existsSync(opencode.capture), false, `${name} must fail preflight before spawn`);
  }

  const boundary = structuredClone(validProvider(true));
  boundary.provider['ai-infra-test'].models.model.limit = { context: 2147483647, output: 2147483646 };
  const accepted = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'provider-cache-boundary'), '--provider-config', writePrivate(path.join(temp, 'provider-boundary.json'), boundary)], { OPENCODE_BIN: opencode.executable });
  assert.equal(accepted.status, 0, accepted.stderr);
  const capturedBoundary = JSON.parse(fs.readFileSync(opencode.capture));
  assert.equal(capturedBoundary.documents.OPENCODE_CONFIG.provider['ai-infra-test'].models.model.options.chat_template_kwargs.enable_thinking, true);
});

test('provider projection refuses provider declarations in root or project config-directory JSONC', () => {
  const opencode = fake('provider-collision');
  const provider = writePrivate(path.join(temp, 'provider-collision.json'), validProvider());
  for (const [name, relative, content] of [
    ['root', 'opencode.json', JSON.stringify({ provider: { foreign: {} } })],
    ['config-directory', '.opencode/opencode.jsonc', '{ // provider collision\n "provider": { "foreign": {}, },\n}'],
  ]) {
    const workspace = repo(`provider-collision-${name}`);
    fs.mkdirSync(path.dirname(path.join(workspace, relative)), { recursive: true });
    fs.writeFileSync(path.join(workspace, relative), content);
    const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, `provider-collision-cache-${name}`), '--provider-config', provider], { OPENCODE_BIN: opencode.executable });
    assert.match(result.stderr, /declares provider and collides/);
  }
});

test('validated external inputs are passed only as owner-only per-launch snapshots and removed after exit', () => {
  const workspace = repo('snapshot-repo');
  const opencode = fake('snapshot');
  const provider = writePrivate(path.join(temp, 'snapshot-provider.json'), validProvider());
  const providerBytes = fs.readFileSync(provider, 'utf8');
  const catalogDocument = { schemaVersion: '1.0.0', models: { 'ai-infra-test': { model: 'ai-infra-test/model', routingServiceUrl: 'http://127.0.0.1:8080/v1', maxInFlight: 1 } } };
  const catalog = writePrivate(path.join(temp, 'snapshot-catalog.json'), catalogDocument);
  const profileDocument = JSON.parse(fs.readFileSync(path.join(ROOT, '.opencode/routing/harness-model-routing.example.json'), 'utf8')).harnessModelRouting;
  delete profileDocument.localRouting.models;
  const profile = writePrivate(path.join(temp, 'snapshot-profile.json'), profileDocument);
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'snapshot-cache'), '--provider-config', provider, '--routing-catalog', catalog, '--routing-profile', profile], { OPENCODE_BIN: opencode.executable, HARNESS_TEST_SWAP: provider });
  assert.equal(result.status, 0, result.stderr);
  const captured = JSON.parse(fs.readFileSync(opencode.capture));
  const env = captured.env;
  for (const [name, original] of [['OPENCODE_CONFIG', provider], ['OPENCODE_HARNESS_ROUTING_CATALOG', catalog], ['OPENCODE_HARNESS_ROUTING_PROFILE', profile]]) {
    assert.notEqual(env[name], original);
    assert.equal(fs.existsSync(env[name]), false, `${name} snapshot should be removed after child exit`);
    assert.ok(env[name].includes('/launches/'));
    assert.equal(captured.modes[name], 0o600);
  }
  assert.ok(captured.documents.OPENCODE_CONFIG.provider, 'provider snapshot must retain validated bytes after original swap');
  assert.equal(captured.snapshots.OPENCODE_CONFIG, providerBytes, 'provider snapshot bytes must exactly preserve the validated input');
  assert.deepEqual(captured.documents.OPENCODE_CONFIG.provider['ai-infra-test'].models.model.limit, { context: 8192, output: 384 });
  assert.equal(captured.documents.OPENCODE_CONFIG.provider['ai-infra-test'].models.model.options.chat_template_kwargs.enable_thinking, false);
  assert.deepEqual(JSON.parse(fs.readFileSync(provider)), { swapped: true });
});

test('each launch isolates owner-only database companions and removes them after exit', () => {
  const workspace = repo('database-repo');
  const opencode = fake('database');
  const dataHome = path.join(temp, 'database-xdg-data-home');
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'database-cache')], { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: '1', XDG_DATA_HOME: dataHome });
  assert.equal(result.status, 0, result.stderr);
  const captured = JSON.parse(fs.readFileSync(opencode.capture));
  assert.ok(path.isAbsolute(captured.env.OPENCODE_DB));
  assert.match(captured.env.OPENCODE_DB, /\/launches\/launch-[^/]+\/opencode\.db$/);
  assert.deepEqual(captured.databaseAbsentAtEntry, { db: true, wal: true, shm: true });
  assert.equal(captured.env.XDG_DATA_HOME, dataHome);
  assert.deepEqual(captured.databaseModes, { db: 0o600, '-wal': 0o600, '-shm': 0o600 });
  for (const suffix of ['', '-wal', '-shm']) assert.equal(fs.existsSync(`${captured.env.OPENCODE_DB}${suffix}`), false);
  assert.equal(fs.existsSync(path.dirname(captured.env.OPENCODE_DB)), false);
});

test('concurrent launches receive distinct database paths', async () => {
  const workspace = repo('database-concurrent-repo');
  const cache = path.join(temp, 'database-concurrent-cache');
  assert.equal(run(['prepare', '--cache-root', cache]).status, 0);
  function launch(name) {
    const opencode = fake(name);
    const trace = path.join(temp, `${name}-trace`); fs.mkdirSync(trace, { mode: 0o700 });
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [CLI, 'run', '--workspace', workspace, '--cache-root', cache, '--trace-root', trace], { cwd: temp, env: { ...process.env, OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: '1' } });
      let stderr = '';
      child.stderr.on('data', (bytes) => { stderr += bytes; });
      child.on('error', reject);
      child.on('close', (status) => resolve({ status, stderr, capture: opencode.capture }));
    });
  }
  const outcomes = await Promise.all([launch('database-concurrent-a'), launch('database-concurrent-b')]);
  for (const outcome of outcomes) assert.equal(outcome.status, 0, outcome.stderr);
  const databases = outcomes.map((outcome) => JSON.parse(fs.readFileSync(outcome.capture)).env.OPENCODE_DB);
  assert.equal(new Set(databases).size, 2);
  databases.forEach((database) => assert.equal(fs.existsSync(database), false));
});

test('ambient database state is rejected without changing parent database or auth', () => {
  const workspace = repo('database-ambient-repo');
  const opencode = fake('database-ambient');
  const home = path.join(temp, 'database-ambient-home'); fs.mkdirSync(home, { mode: 0o700 });
  const auth = path.join(home, 'auth.json'); fs.writeFileSync(auth, 'auth-canary\n', { mode: 0o600 });
  const database = path.join(home, 'parent.db'); fs.writeFileSync(database, 'db-canary\n', { mode: 0o600 });
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'database-ambient-cache')], { HOME: home, OPENCODE_BIN: opencode.executable, OPENCODE_DB: database });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing pre-set OPENCODE_DB/);
  assert.equal(fs.readFileSync(database, 'utf8'), 'db-canary\n');
  assert.equal(fs.readFileSync(auth, 'utf8'), 'auth-canary\n');
  assert.equal(fs.existsSync(opencode.capture), false);
});

test('database rejection quarantines and removes unexpected files, directories, and symlinks without touching external targets', () => {
  const workspace = repo('database-cleanup-repo');
  const target = path.join(temp, 'database-symlink-target'); fs.writeFileSync(target, 'target-canary\n', { mode: 0o600 });
  const cases = [
    ['companion-symlink', { HARNESS_TEST_DB_SYMLINK: target }, /not a current-user mode-0600 regular file/],
    ['main-db-symlink', { HARNESS_TEST_DB_SYMLINK: target, HARNESS_TEST_DB_SYMLINK_SUFFIX: 'main' }, /not a current-user mode-0600 regular file/],
    ['shm-symlink', { HARNESS_TEST_DB_SYMLINK: target, HARNESS_TEST_DB_SYMLINK_SUFFIX: '-shm' }, /not a current-user mode-0600 regular file/],
    ['main-db-wrong-mode', { HARNESS_TEST_DB_WRONG_MODE: 'main' }, /not a current-user mode-0600 regular file/],
    ['wal-wrong-mode', { HARNESS_TEST_DB_WRONG_MODE: '-wal' }, /not a current-user mode-0600 regular file/],
    ['shm-wrong-mode', { HARNESS_TEST_DB_WRONG_MODE: '-shm' }, /not a current-user mode-0600 regular file/],
    ['unexpected-file', { HARNESS_TEST_DB_UNEXPECTED: '1' }, /unexpected entry/],
    ['unexpected-directory', { HARNESS_TEST_DB_UNEXPECTED_DIR: '1' }, /unexpected entry/],
    ['unexpected-symlink', { HARNESS_TEST_DB_UNEXPECTED_SYMLINK: target }, /unexpected entry/],
    ['expected-name-directory-confusion', { HARNESS_TEST_DB_CONFUSION: target }, /not a current-user mode-0600 regular file/],
  ];
  for (const [name, fixture, expected] of cases) {
    const opencode = fake(`database-${name}`);
    const cache = path.join(temp, `database-${name}-cache`);
    const result = run(['run', '--workspace', workspace, '--cache-root', cache], { OPENCODE_BIN: opencode.executable, ...fixture });
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    assert.match(result.stderr, /quarantined launch snapshot was safely removed/, name);
    const database = JSON.parse(fs.readFileSync(opencode.capture)).env.OPENCODE_DB;
    assert.equal(fs.existsSync(path.dirname(database)), false, name);
    assert.deepEqual(fs.readdirSync(path.dirname(path.dirname(database))).filter((entry) => entry.startsWith('.quarantine-') || entry.startsWith('launch-')), [], name);
    assert.equal(fs.readFileSync(target, 'utf8'), 'target-canary\n', name);
  }
});

test('database rejection removes a special file without opening or following it', { skip: !mkfifoAvailable }, () => {
  const workspace = repo('database-special-repo');
  const opencode = fake('database-special');
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'database-special-cache')], { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_SPECIAL: '1' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unexpected entry.*quarantined launch snapshot was safely removed/);
  const database = JSON.parse(fs.readFileSync(opencode.capture)).env.OPENCODE_DB;
  assert.equal(fs.existsSync(path.dirname(database)), false);
});

test('quarantine is retained only when contained cleanup itself fails', () => {
  const workspace = repo('database-quarantine-failure-repo');
  const opencode = fake('database-quarantine-failure');
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'database-quarantine-failure-cache')], {
    OPENCODE_BIN: opencode.executable,
    HARNESS_TEST_DB_UNEXPECTED_DIR: '1',
    OPENCODE_HARNESS_TESTING: '1',
    OPENCODE_HARNESS_TEST_QUARANTINE_CLEANUP_FAIL: '1',
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /launch snapshot contains unexpected entry.*cleanup failure: quarantine recursive unlink failed: injected quarantine cleanup failure.*retained quarantine: \/.*\.quarantine-/);
  const database = JSON.parse(fs.readFileSync(opencode.capture)).env.OPENCODE_DB;
  const launches = path.dirname(path.dirname(database));
  assert.equal(fs.existsSync(path.dirname(database)), false, 'original launch name must be atomically removed');
  assert.equal(fs.readdirSync(launches).filter((entry) => entry.startsWith('.quarantine-')).length, 1);
});

test('cleanup identity and containment injections never delete on parent, path, launch, or post-rename mismatch', () => {
  const workspace = repo('database-identity-guard-repo');
  const cases = [
    ['parent-swap', 'OPENCODE_HARNESS_TEST_PARENT_SWAP', /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed: launch snapshots parent identity changed before quarantine; retained launch: \/.*\.swapped\/launch-/],
    ['path-confusion', 'OPENCODE_HARNESS_TEST_PATH_CONFUSION', /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed:.*(?:dot-dot|ambiguity).*retained launch: \/.*\/launch-/],
    ['launch-replacement', 'OPENCODE_HARNESS_TEST_LAUNCH_REPLACEMENT', /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed: launch snapshot identity changed before quarantine; retained launch: \/.*\.replaced/],
    ['post-rename-mismatch', 'OPENCODE_HARNESS_TEST_POST_RENAME_MISMATCH', /OpenCode child exited with status 23; launch snapshot contains unexpected entry: unexpected; cleanup failure: post-quarantine identity check failed: quarantine dev\/ino does not match.*retained quarantine: \/.*\.identity-mismatch/],
  ];
  for (const [name, injection, expected] of cases) {
    const opencode = fake(`database-identity-${name}`);
    const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, `database-identity-${name}-cache`)], {
      OPENCODE_BIN: opencode.executable,
      HARNESS_TEST_DB_UNEXPECTED: '1',
      HARNESS_TEST_CHILD_FAIL: '1',
      OPENCODE_HARNESS_TESTING: '1',
      [injection]: '1',
    });
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    const database = JSON.parse(fs.readFileSync(opencode.capture)).env.OPENCODE_DB;
    const launch = path.dirname(database);
    const parent = path.dirname(launch);
    if (name === 'parent-swap') assert.equal(fs.readFileSync(path.join(`${parent}.swapped`, path.basename(launch), 'unexpected'), 'utf8'), 'unexpected');
    else if (name === 'launch-replacement') assert.equal(fs.readFileSync(path.join(`${launch}.replaced`, 'unexpected'), 'utf8'), 'unexpected');
    else if (name === 'post-rename-mismatch') {
      const retained = fs.readdirSync(parent).map((entry) => path.join(parent, entry)).find((entry) => entry.endsWith('.identity-mismatch'));
      assert.equal(fs.readFileSync(path.join(retained, 'unexpected'), 'utf8'), 'unexpected');
    } else assert.equal(fs.readFileSync(path.join(launch, 'unexpected'), 'utf8'), 'unexpected');
  }
});

test('failed child status still removes database companions', () => {
  const workspace = repo('database-failed-child-repo');
  const opencode = fake('database-failed-child');
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'database-failed-child-cache')], { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: '1', HARNESS_TEST_CHILD_FAIL: '1' });
  assert.equal(result.status, 23, result.stderr);
  const database = JSON.parse(fs.readFileSync(opencode.capture)).env.OPENCODE_DB;
  assert.equal(fs.existsSync(path.dirname(database)), false);
});

test('executable selection rejects relative identities and version mismatch before launch', () => {
  const workspace = repo('executable-repo');
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'relative-bin-cache')], { OPENCODE_BIN: './opencode' }).stderr, /must be absolute/);
  const mismatch = fake('mismatch', '1.0.0');
  const result = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'mismatch-cache')], { OPENCODE_BIN: mismatch.executable });
  assert.match(result.stderr, /requires OpenCode 1\.18\.18/);
  assert.equal(fs.existsSync(mismatch.capture), false);
  const relativeDirectory = path.join(temp, 'relative'); fs.mkdirSync(relativeDirectory); fs.writeFileSync(path.join(relativeDirectory, 'opencode'), '#!/bin/sh\nexit 0\n', { mode: 0o700 });
  const pathResult = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'relative-path-cache')], { OPENCODE_BIN: '', PATH: `relative${path.delimiter}/usr/bin${path.delimiter}/bin` });
  assert.match(pathResult.stderr, /selected PATH entry.*absolute/);
});

test('lexical ancestry rejects intermediate symlink escapes for cache, trace, state, and snapshots before writes', () => {
  const workspace = repo('lexical-escape-repo');
  const opencode = fake('lexical-escape');
  const parent = path.join(temp, 'lexical-parent'); fs.mkdirSync(parent, { mode: 0o700 });
  const target = path.join(temp, 'lexical-target'); fs.mkdirSync(target, { mode: 0o700 });

  const cacheParent = path.join(parent, 'cache'); fs.mkdirSync(cacheParent, { mode: 0o700 }); fs.symlinkSync(target, path.join(cacheParent, 'link'));
  const cacheResult = run(['prepare', '--cache-root', `${cacheParent}/link/escaped-cache`]);
  assert.match(cacheResult.stderr, /symlink component/); assert.equal(fs.existsSync(path.join(target, 'escaped-cache')), false);

  const traceParent = path.join(parent, 'trace'); fs.mkdirSync(traceParent, { mode: 0o700 }); fs.symlinkSync(target, path.join(traceParent, 'link'));
  const traceResult = run(['run', '--workspace', workspace, '--cache-root', path.join(parent, 'safe-cache'), '--trace-root', `${traceParent}/link/escaped-trace`], { OPENCODE_BIN: opencode.executable });
  assert.match(traceResult.stderr, /symlink component/); assert.equal(fs.existsSync(path.join(target, 'escaped-trace')), false);

  const stateParent = path.join(parent, 'state'); fs.mkdirSync(stateParent, { mode: 0o700 }); fs.symlinkSync(target, path.join(stateParent, 'link'));
  const stateResult = run(['run', '--workspace', workspace, '--cache-root', path.join(parent, 'state-cache')], { OPENCODE_BIN: opencode.executable, XDG_STATE_HOME: `${stateParent}/link/escaped-state` });
  assert.match(stateResult.stderr, /symlink component/); assert.equal(fs.existsSync(path.join(target, 'escaped-state')), false);

  const snapshotPrepared = prepare('snapshot-parent-escape-cache');
  const launches = path.join(path.dirname(snapshotPrepared.runtime), 'launches'); fs.symlinkSync(target, launches);
  const provider = writePrivate(path.join(temp, 'snapshot-parent-provider.json'), validProvider());
  const snapshotResult = run(['run', '--workspace', workspace, '--cache-root', snapshotPrepared.cache, '--provider-config', provider], { OPENCODE_BIN: opencode.executable });
  assert.match(snapshotResult.stderr, /symlink component/); assert.equal(fs.readdirSync(target).length, 0);
});

test('lexical ambiguity and sticky-root creation fail while missing suffix below private child succeeds', () => {
  const variants = [`${temp}/../ambiguous`, `${temp}/./ambiguous`, `${temp}//ambiguous`, `${temp}/ambiguous/`];
  for (const candidate of variants) {
    const result = run(['prepare', '--cache-root', candidate]);
    assert.notEqual(result.status, 0, candidate); assert.match(result.stderr, /canonical|dot|separator|ambiguity/);
  }
  const direct = `/tmp/opencode-harness-direct-${process.pid}-${Date.now()}`;
  const directResult = run(['prepare', '--cache-root', direct]);
  assert.match(directResult.stderr, /already-existing private child/); assert.equal(fs.existsSync(direct), false);
  const accepted = path.join(temp, 'accepted-missing/suffix/cache');
  const acceptedResult = run(['prepare', '--cache-root', accepted]);
  assert.equal(acceptedResult.status, 0, acceptedResult.stderr);
});

test('snapshot construction failure removes every partial launch directory', () => {
  const workspace = repo('snapshot-failure-repo');
  const opencode = fake('snapshot-failure');
  const provider = writePrivate(path.join(temp, 'snapshot-failure-provider.json'), validProvider());
  const cache = path.join(temp, 'snapshot-failure-cache');
  const result = run(['run', '--workspace', workspace, '--cache-root', cache, '--provider-config', provider], { OPENCODE_BIN: opencode.executable, OPENCODE_HARNESS_TESTING: '1', OPENCODE_HARNESS_TEST_SNAPSHOT_FAIL_AFTER: '1' });
  assert.match(result.stderr, /injected snapshot construction failure/);
  const launches = path.join(cache, '0.1.8/opencode-1.18.18/launches');
  assert.deepEqual(fs.readdirSync(launches).filter((name) => name.startsWith('launch-')), []);
  assert.equal(fs.existsSync(opencode.capture), false);
});

test('PATH and explicit executable selection enforce trusted ownership, modes, ancestry, and post-probe bytes', (context) => {
  const workspace = repo('executable-trust-repo');
  fs.chmodSync(workspace, 0o700);
  fs.writeFileSync(path.join(workspace, '.gitignore'), '.memory/\n');
  const trusted = path.join(temp, 'trusted-path'); fs.mkdirSync(trusted, { mode: 0o700 });
  const source = fake('trusted-path-source'); const pathExecutable = path.join(trusted, 'opencode'); fs.writeFileSync(pathExecutable, '#!/bin/sh\nif [ "$1" = "--version" ]; then printf "1.18.18\\n"; fi\nexit 0\n', { mode: 0o700 });
  const unrelatedWritable = path.join(temp, 'unrelated-later-path'); fs.mkdirSync(unrelatedWritable); fs.chmodSync(unrelatedWritable, 0o777);
  const success = run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'trusted-path-cache')], { OPENCODE_BIN: '', PATH: `${trusted}${path.delimiter}/usr/bin${path.delimiter}/mnt/c/Windows/System32${path.delimiter}${unrelatedWritable}` });
  assert.equal(success.status, 0, success.stderr);

  const writableDirectory = path.join(temp, 'writable-path'); fs.mkdirSync(writableDirectory); fs.copyFileSync(source.executable, path.join(writableDirectory, 'opencode')); fs.chmodSync(path.join(writableDirectory, 'opencode'), 0o700); fs.chmodSync(writableDirectory, 0o777);
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'writable-path-cache')], { OPENCODE_BIN: '', PATH: `${writableDirectory}${path.delimiter}/usr/bin${path.delimiter}/bin` }).stderr, /group\/world writable/);

  const explicit = fake('writable-explicit'); fs.chmodSync(explicit.executable, 0o722);
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'writable-explicit-cache')], { OPENCODE_BIN: explicit.executable }).stderr, /trusted non-writable/);

  const mutating = path.join(temp, 'mutating-opencode.mjs');
  fs.writeFileSync(mutating, "#!/usr/bin/env node\nimport fs from 'node:fs';\nif(process.argv[2]==='--version'){fs.appendFileSync(process.argv[1],'\\n//mutated');process.stdout.write('1.18.18\\n')}else fs.writeFileSync(process.env.HARNESS_MUTATION_CAPTURE,'launched');\n", { mode: 0o700 });
  const mutationCapture = path.join(temp, 'mutation-capture');
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'mutating-cache')], { OPENCODE_BIN: mutating, HARNESS_MUTATION_CAPTURE: mutationCapture }).stderr, /identity changed/);
  assert.equal(fs.existsSync(mutationCapture), false);

  const ownerProbe = fake('owner-probe');
  try { fs.chownSync(ownerProbe.executable, 65534, 65534); }
  catch { context.diagnostic('different-UID executable fixture skipped: unprivileged chown'); return; }
  assert.match(run(['run', '--workspace', workspace, '--cache-root', path.join(temp, 'owner-probe-cache')], { OPENCODE_BIN: ownerProbe.executable }).stderr, /trusted non-writable|allowed-owner/);
});
