#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BOOTSTRAP = path.join(SOURCE_ROOT, '.opencode/scripts/bootstrap-portable-harness.mjs');

async function runNode(args, options = {}) {
  return execFileAsync(process.execPath, args, { cwd: options.cwd ?? SOURCE_ROOT, env: { ...process.env, NO_COLOR: '1', ...options.env } });
}

async function expectFailure(args, options = {}) {
  try {
    await runNode(args, options);
  } catch (error) {
    return `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }
  assert.fail(`expected command to fail: node ${args.join(' ')}`);
}

async function makeRepo(parent, name) {
  const repo = path.join(parent, name);
  await mkdir(repo);
  return repo;
}

async function walk(relativeRoot, base = relativeRoot) {
  const entries = [];
  for (const item of await readdir(relativeRoot, { withFileTypes: true })) {
    const absolute = path.join(relativeRoot, item.name);
    const relative = path.relative(base, absolute).split(path.sep).join('/');
    if (item.isDirectory()) entries.push(...await walk(absolute, base));
    else entries.push(relative);
  }
  return entries.sort();
}

const tempParent = await mkdtemp(path.join(os.tmpdir(), 'portable-harness-e2e-'));
test.after(async () => rm(tempParent, { recursive: true, force: true }));

test('fresh foreign repository installs and validates without source-owned roots or history', async () => {
  const repo = await makeRepo(tempParent, 'fresh');
  const installed = await runNode([BOOTSTRAP, '--target', repo]);
  assert.match(installed.stdout, /created\/updated=43, memory-created=4, unchanged=0, collisions=0/);
  assert.match(installed.stdout, /write-safety=descriptor-anchored-hard-link:/);
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  const validated = await runNode([validator, '--root', '.'], { cwd: repo });
  assert.equal(validated.stdout.trim(), 'Portable OpenCode harness validation passed');
  const rootFiles = await readdir(repo);
  assert.deepEqual(rootFiles.sort(), ['.memory', '.opencode']);
  assert.deepEqual(await walk(path.join(repo, '.memory')), [
    'INDEX.md',
    'protocols/memory-management.md',
    'templates/orchestration-index.md',
    'templates/role-trace-artifact.md',
  ]);
});

test('bootstrap is idempotent and dry-run performs no writes', async () => {
  const repo = path.join(tempParent, 'fresh');
  const second = await runNode([BOOTSTRAP, '--target', repo]);
  assert.match(second.stdout, /created\/updated=0, memory-created=0, unchanged=47, collisions=0/);
  const dryRepo = await makeRepo(tempParent, 'dry-run');
  const dry = await runNode([BOOTSTRAP, '--target', dryRepo, '--dry-run']);
  assert.match(dry.stdout, /dry-run complete: created\/updated=43, memory-created=4/);
  assert.deepEqual(await readdir(dryRepo), []);
});

test('installed validator accepts an explicit root from nested cwd', async () => {
  const repo = path.join(tempParent, 'fresh');
  const nested = path.join(repo, 'work/nested');
  await mkdir(nested, { recursive: true });
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  const result = await runNode([validator, '--root', '../..'], { cwd: nested });
  assert.equal(result.stdout.trim(), 'Portable OpenCode harness validation passed');
});

test('partial memory is filled without overwrite and history is never copied or removed', async () => {
  const repo = await makeRepo(tempParent, 'partial-memory');
  const index = path.join(repo, '.memory/INDEX.md');
  const history = path.join(repo, '.memory/orchestrations/existing/marker.txt');
  await mkdir(path.dirname(history), { recursive: true });
  await writeFile(index, '# Destination-owned memory\n');
  await writeFile(history, 'keep\n');
  const result = await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  assert.match(result.stdout, /memory-created=3/);
  assert.equal(await readFile(index, 'utf8'), '# Destination-owned memory\n');
  assert.equal(await readFile(history, 'utf8'), 'keep\n');
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  assert.equal((await runNode([validator, '--root', repo])).stdout.trim(), 'Portable OpenCode harness validation passed');
});

test('managed collision aborts preflight and explicit overwrite changes only managed files', async () => {
  const repo = await makeRepo(tempParent, 'collision');
  const collision = path.join(repo, '.opencode/agents/researcher.md');
  await mkdir(path.dirname(collision), { recursive: true });
  await writeFile(collision, 'destination content\n');
  const failure = await expectFailure([BOOTSTRAP, '--target', repo]);
  assert.match(failure, /managed collisions \(1\)/);
  assert.deepEqual(await walk(repo), ['.opencode/agents/researcher.md']);
  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  assert.notEqual(await readFile(collision, 'utf8'), 'destination content\n');

  const memory = path.join(repo, '.memory/INDEX.md');
  await writeFile(memory, 'private memory\n');
  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  assert.equal(await readFile(memory, 'utf8'), 'private memory\n');
});

test('atomic no-clobber publication preserves concurrently created managed and memory files', async () => {
  for (const [name, relative] of [
    ['managed-race', '.opencode/agents/artifact-verifier.md'],
    ['memory-race', '.memory/INDEX.md'],
  ]) {
    const repo = await makeRepo(tempParent, name);
    const race = JSON.stringify({ action: 'create-destination', relative });
    const failure = await expectFailure([BOOTSTRAP, '--target', repo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: race } });
    assert.match(failure, /destination appeared after preflight/);
    assert.equal(await readFile(path.join(repo, relative), 'utf8'), 'concurrent destination\n');
  }
});

test('write-time ancestor symlink insertion cannot escape the target', async () => {
  const repo = await makeRepo(tempParent, 'symlink-race');
  const outside = await makeRepo(tempParent, 'symlink-race-outside');
  const race = JSON.stringify({ action: 'insert-symlink', relative: '.opencode', target: outside });
  await expectFailure([BOOTSTRAP, '--target', repo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: race } });
  assert.deepEqual(await readdir(outside), []);
});

test('target root and intermediate replacement fail identity binding before writes', async () => {
  const rootRepo = await makeRepo(tempParent, 'root-replacement');
  const movedRoot = path.join(tempParent, 'root-replacement-original');
  const rootRace = JSON.stringify({ action: 'replace-root', replacement: movedRoot });
  assert.match(await expectFailure([BOOTSTRAP, '--target', rootRepo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: rootRace } }), /opened target differs from the preflight-inspected target/);
  assert.deepEqual(await readdir(rootRepo), []);
  assert.deepEqual(await readdir(movedRoot), []);

  const container = path.join(tempParent, 'intermediate-container');
  await mkdir(container);
  const nestedRepo = await makeRepo(container, 'repo');
  const movedContainer = path.join(tempParent, 'intermediate-container-original');
  const intermediateRace = JSON.stringify({ action: 'replace-intermediate', replacement: movedContainer });
  assert.match(await expectFailure([BOOTSTRAP, '--target', nestedRepo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: intermediateRace } }), /opened target differs from the preflight-inspected target/);
  assert.deepEqual(await readdir(path.join(tempParent, 'intermediate-container/repo')), []);
  assert.deepEqual(await readdir(path.join(movedContainer, 'repo')), []);

  const openedRepo = await makeRepo(tempParent, 'opened-root-replacement');
  const movedOpenedRoot = path.join(tempParent, 'opened-root-replacement-original');
  const openedRace = JSON.stringify({ action: 'replace-root-after-open', replacement: movedOpenedRoot });
  assert.match(await expectFailure([BOOTSTRAP, '--target', openedRepo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: openedRace } }), /opened target differs from the preflight-inspected target/);
  assert.deepEqual(await readdir(openedRepo), []);
  assert.deepEqual(await readdir(movedOpenedRoot), []);
});

test('descriptor capability unavailability fails before files or directories are published', async () => {
  const repo = await makeRepo(tempParent, 'descriptor-unavailable');
  const failure = await expectFailure([BOOTSTRAP, '--target', repo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_FORCE_DESCRIPTOR_UNAVAILABLE: '1' } });
  assert.match(failure, /no usable descriptor-directory alias/);
  assert.deepEqual(await readdir(repo), []);
});

test('probe-interval parent replacement produces no file publication', async () => {
  const repo = await makeRepo(tempParent, 'probe-replacement');
  const moved = path.join(tempParent, 'probe-replacement-opencode-original');
  const race = JSON.stringify({ action: 'replace-parent-before-probe', relative: '.opencode', replacement: moved });
  assert.match(await expectFailure([BOOTSTRAP, '--target', repo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: race } }), /destination parent changed during write/);
  assert.deepEqual(await walk(repo), []);
  assert.deepEqual(await walk(moved), []);
});

test('all destination parents are capability-probed before first file publication', async () => {
  const repo = await makeRepo(tempParent, 'multi-destination-probe');
  const race = JSON.stringify({ action: 'fail-probe', relative: '.memory' });
  const failure = await expectFailure([BOOTSTRAP, '--target', repo], { env: { NODE_ENV: 'test', OPENCODE_PORTABLE_TEST_RACE: race } });
  assert.match(failure, /capability probe failed for \.memory before publication/);
  assert.deepEqual(await readdir(repo), []);
});

test('installed validator rejects unsafe manifest paths and forbidden references', async () => {
  const repo = await makeRepo(tempParent, 'negative');
  await runNode([BOOTSTRAP, '--target', repo]);
  const manifestPath = path.join(repo, '.opencode/portable.manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.managedFiles.push('../escape');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  assert.match(await expectFailure([validator, '--root', repo]), /safe normalized relative POSIX path/);

  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  const agent = path.join(repo, '.opencode/agents/researcher.md');
  const restoredManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  await writeFile(agent, `${await readFile(agent, 'utf8')}\n${restoredManifest.forbiddenReferences[0]}\n`);
  assert.match(await expectFailure([validator, '--root', repo]), /forbidden portable references found/);
});

test('installed validator rejects corrupted enabled-local routing and machine-local manifest paths', async () => {
  const repo = await makeRepo(tempParent, 'routing-corruption');
  await runNode([BOOTSTRAP, '--target', repo]);
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  const local = path.join(repo, '.opencode/routing/harness-model-routing.local.example.json');
  await writeFile(local, '{}\n');
  assert.match(await expectFailure([validator, '--root', repo]), /Invalid harness model routing v2/);

  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  const manifestPath = path.join(repo, '.opencode/portable.manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.forbiddenReferences.push(['', 'home', 'example', 'opencode-harness'].join('/'));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.match(await expectFailure([validator, '--root', repo]), /machine-local absolute path/);
});

test('installed validator independently rejects removed inventory entries', async () => {
  const repo = await makeRepo(tempParent, 'inventory-removal');
  await runNode([BOOTSTRAP, '--target', repo]);
  const manifestPath = path.join(repo, '.opencode/portable.manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const removed = '.opencode/routing/routing-policy.test.mjs';
  manifest.managedFiles = manifest.managedFiles.filter((item) => item !== removed);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await rm(path.join(repo, removed));
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  assert.match(await expectFailure([validator, '--root', repo]), /exact portable-core contract/);
});

test('installed validator rejects generic Windows drive and UNC absolute paths', async () => {
  const repo = await makeRepo(tempParent, 'windows-paths');
  await runNode([BOOTSTRAP, '--target', repo]);
  const validator = path.join(repo, '.opencode/scripts/validate-portable-harness.mjs');
  const agent = path.join(repo, '.opencode/agents/researcher.md');
  const drivePath = ['C:', 'src', 'opencode-harness', 'secret'].join('\\');
  await writeFile(agent, `${await readFile(agent, 'utf8')}\n${drivePath}\n`);
  assert.match(await expectFailure([validator, '--root', repo]), /machine-local absolute path/);

  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  const uncPath = ['', '', 'server', 'share', 'opencode-harness', 'secret'].join('\\');
  const manifestPath = path.join(repo, '.opencode/portable.manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.forbiddenReferences.push(uncPath);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  assert.match(await expectFailure([validator, '--root', repo]), /machine-local absolute path/);

  await runNode([BOOTSTRAP, '--target', repo, '--overwrite-managed']);
  const forwardUncPath = ['', '', 'server', 'share', 'opencode-harness', 'secret'].join('/');
  await writeFile(agent, `${await readFile(agent, 'utf8')}\n${forwardUncPath}\n`);
  assert.match(await expectFailure([validator, '--root', repo]), /machine-local absolute path/);
});
