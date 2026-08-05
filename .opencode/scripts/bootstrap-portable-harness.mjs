#!/usr/bin/env node

import { constants } from 'node:fs';
import { access, link, lstat, mkdir, open, readFile, realpath, rename, rm, rmdir, symlink, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MANIFEST_PATH = '.opencode/portable.manifest.json';
let descriptorAlias = null;

function fail(message) {
  throw new Error(`Portable harness bootstrap failed: ${message}`);
}

function safeRelative(value, label, prefix) {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\\') || value.includes('\0')) fail(`${label} must be a safe relative POSIX path`);
  if (path.posix.isAbsolute(value) || path.posix.normalize(value) !== value || value.split('/').some((part) => part === '' || part === '.' || part === '..')) fail(`${label} must be a normalized relative POSIX path`);
  if (prefix && !value.startsWith(prefix)) fail(`${label} must be under ${prefix}`);
  return value;
}

function validateManifest(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('manifest must be an object');
  const keys = Object.keys(value).sort();
  const expected = ['forbiddenReferences', 'managedFiles', 'memorySeeds', 'profile', 'schemaVersion', 'writeCapabilities'].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) fail('manifest has an unexpected shape');
  if (value.schemaVersion !== '1.0.0' || value.profile !== 'portable-core') fail('manifest version/profile is unsupported');
  if (!Array.isArray(value.managedFiles) || !Array.isArray(value.memorySeeds) || !Array.isArray(value.forbiddenReferences)) fail('manifest inventories must be arrays');
  const managed = value.managedFiles.map((item, index) => safeRelative(item, `managedFiles[${index}]`, '.opencode/'));
  if (new Set(managed).size !== managed.length || !managed.includes(MANIFEST_PATH)) fail('managedFiles must be unique and include the portable manifest');
  for (const candidate of managed) if (managed.some((other) => other !== candidate && candidate.startsWith(`${other}/`))) fail(`managed file paths overlap: ${candidate}`);
  const targets = [];
  for (const [index, seed] of value.memorySeeds.entries()) {
    if (!seed || typeof seed !== 'object' || Array.isArray(seed) || Object.keys(seed).sort().join(',') !== 'source,target') fail(`memorySeeds[${index}] must contain only source and target`);
    safeRelative(seed.source, `memorySeeds[${index}].source`, '.opencode/bootstrap/memory/');
    safeRelative(seed.target, `memorySeeds[${index}].target`, '.memory/');
    if (!managed.includes(seed.source)) fail(`memory seed source is not managed: ${seed.source}`);
    targets.push(seed.target);
  }
  if (new Set(targets).size !== targets.length) fail('memory seed targets must be unique');
  if (new Set(value.forbiddenReferences).size !== value.forbiddenReferences.length || value.forbiddenReferences.some((token) => typeof token !== 'string' || token.length === 0)) fail('forbiddenReferences must contain unique nonempty strings');
  const capabilities = value.writeCapabilities;
  if (!capabilities || JSON.stringify(capabilities) !== JSON.stringify({ publication: 'descriptor-relative-same-directory-hard-link', descriptorDirectoryAliases: ['/proc/self/fd', '/dev/fd'], destinationPreflight: 'all-parent-directories-before-publication', unavailableBehavior: 'fail-before-file-publication' })) fail('manifest write capability contract is unsupported');
  return value;
}

function parseArgs(argv) {
  const options = { target: process.cwd(), dryRun: false, overwriteManaged: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--target') {
      const value = argv[++index];
      if (!value || value.startsWith('--')) fail('--target requires a path');
      options.target = path.resolve(process.cwd(), value);
    } else if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--overwrite-managed') options.overwriteManaged = true;
    else fail(`unknown argument: ${arg}`);
  }
  return options;
}

async function statOrNull(file) {
  try { return await lstat(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function rejectSymlinkPath(root, relative, includeLeaf = true) {
  let current = root;
  const parts = relative.split('/');
  const end = includeLeaf ? parts.length : parts.length - 1;
  for (let index = 0; index < end; index += 1) {
    current = path.join(current, parts[index]);
    const stat = await statOrNull(current);
    if (!stat) return;
    if (stat.isSymbolicLink()) fail(`symlink path component is not allowed: ${relative}`);
    if (index < parts.length - 1 && !stat.isDirectory()) fail(`non-directory path component blocks: ${relative}`);
  }
}

async function sourceBytes(relative, sourceReal) {
  await rejectSymlinkPath(SOURCE_ROOT, relative);
  const absolute = path.join(SOURCE_ROOT, ...relative.split('/'));
  const stat = await statOrNull(absolute);
  if (!stat?.isFile()) fail(`managed source is not a regular file: ${relative}`);
  const resolved = await realpath(absolute);
  if (resolved !== path.join(sourceReal, ...relative.split('/'))) fail(`managed source escapes source root: ${relative}`);
  return readFile(absolute);
}

function descriptorPath(handle, name = '') {
  return `${descriptorAlias}/${handle.fd}${name ? `/${name}` : ''}`;
}

async function openDirectoryAt(parent, name, create) {
  const anchored = descriptorPath(parent, name);
  try {
    return { handle: await open(anchored, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW), created: false };
  } catch (error) {
    if (!create || error.code !== 'ENOENT') throw error;
    let created = false;
    try { await mkdir(anchored, { mode: 0o755 }); created = true; } catch (mkdirError) { if (mkdirError.code !== 'EEXIST') throw mkdirError; }
    return { handle: await open(anchored, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW), created };
  }
}

async function openPinnedParent(rootHandle, relative, create, createdDirectories = []) {
  let current = rootHandle;
  let owned = false;
  let prefix = '';
  try {
    for (const part of path.posix.dirname(relative).split('/').filter((item) => item !== '.')) {
      const next = await openDirectoryAt(current, part, create);
      if (owned) await current.close();
      current = next.handle;
      owned = true;
      prefix = prefix ? `${prefix}/${part}` : part;
      if (next.created) createdDirectories.push(prefix);
    }
    return { handle: current, owned };
  } catch (error) {
    if (owned) await current.close();
    throw error;
  }
}

async function assertParentStillReachable(rootHandle, relative, pinned) {
  let current;
  try {
    try { current = await openPinnedParent(rootHandle, relative, false); } catch { fail(`destination parent changed during write: ${relative}`); }
    const [expected, actual] = await Promise.all([pinned.stat(), current.handle.stat()]);
    if (expected.dev !== actual.dev || expected.ino !== actual.ino) fail(`destination parent changed during write: ${relative}`);
  } finally {
    if (current?.owned) await current.handle.close();
  }
}

async function atomicWrite(rootHandle, parentHandle, operation, race) {
  const basename = path.posix.basename(operation.relative);
  const destination = descriptorPath(parentHandle, basename);
  const temporaryName = `.${basename}.portable-tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  const temporary = descriptorPath(parentHandle, temporaryName);
  try {
    await assertParentStillReachable(rootHandle, operation.relative, parentHandle);
    await writeFile(temporary, operation.bytes, { flag: 'wx', mode: 0o644 });
    if (race?.action === 'create-destination' && race.relative === operation.relative) await writeFile(destination, 'concurrent destination\n', { flag: 'wx' });
    if (operation.allowOverwrite) await rename(temporary, destination);
    else {
      try { await link(temporary, destination); } catch (error) { if (error.code === 'EEXIST') fail(`destination appeared after preflight: ${operation.relative}`); throw error; }
      await unlink(temporary);
    }
    await assertParentStillReachable(rootHandle, operation.relative, parentHandle);
  } finally {
    await rm(temporary, { force: true });
  }
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function discoverDescriptorAlias(rootHandle, targetIdentity, aliases) {
  if (process.env.NODE_ENV === 'test' && process.env.OPENCODE_PORTABLE_FORCE_DESCRIPTOR_UNAVAILABLE === '1') return null;
  if (!Number.isInteger(constants.O_DIRECTORY) || !Number.isInteger(constants.O_NOFOLLOW)) return null;
  for (const alias of aliases) {
    let candidate;
    let child;
    const probeName = `.portable-descriptor-probe-${process.pid}-${Math.random().toString(16).slice(2)}`;
    const probePath = `${alias}/${rootHandle.fd}/${probeName}`;
    try {
      candidate = await open(`${alias}/${rootHandle.fd}`, constants.O_RDONLY | constants.O_DIRECTORY);
      if (!sameIdentity(await candidate.stat(), targetIdentity)) continue;
      await mkdir(probePath, { mode: 0o700 });
      child = await open(probePath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
      if (!(await child.stat()).isDirectory()) continue;
      return alias;
    } catch {
      // Try the next declared alias.
    } finally {
      await child?.close();
      try { await rmdir(probePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      await candidate?.close();
    }
  }
  return null;
}

async function probeHardLinks(parentHandle, relative) {
  const suffix = `${process.pid}-${Math.random().toString(16).slice(2)}`;
  const source = descriptorPath(parentHandle, `.portable-link-probe-${suffix}`);
  const destination = descriptorPath(parentHandle, `.portable-link-probe-${suffix}-linked`);
  try {
    await writeFile(source, 'probe\n', { flag: 'wx', mode: 0o600 });
    await link(source, destination);
  } catch (error) {
    fail(`descriptor-relative same-directory hard-link publication is required but unavailable for ${relative} (${error.code ?? error.message})`);
  } finally {
    await Promise.all([rm(source, { force: true }), rm(destination, { force: true })]);
  }
}

async function cleanupCreatedDirectories(rootHandle, createdDirectories) {
  for (const relative of [...new Set(createdDirectories)].sort((left, right) => right.split('/').length - left.split('/').length)) {
    try { await rmdir(descriptorPath(rootHandle, relative)); } catch (error) { if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error; }
  }
}

async function prepareDestinationParents(rootHandle, operations, race, targetReal) {
  const parents = new Map();
  const createdDirectories = [];
  try {
    for (const operation of operations) {
      const key = path.posix.dirname(operation.relative);
      if (!parents.has(key)) parents.set(key, await openPinnedParent(rootHandle, operation.relative, true, createdDirectories));
    }
    if (race?.action === 'replace-parent-before-probe') {
      if (typeof race.replacement !== 'string' || !path.isAbsolute(race.replacement)) fail('test replacement path must be absolute');
      const selected = race.relative;
      safeRelative(selected, 'test probe parent relative');
      await rename(path.join(targetReal, ...selected.split('/')), race.replacement);
      await mkdir(path.join(targetReal, ...selected.split('/')));
    }
    for (const [relative, parent] of parents) {
      const representative = operations.find((operation) => path.posix.dirname(operation.relative) === relative).relative;
      await assertParentStillReachable(rootHandle, representative, parent.handle);
      if (race?.action === 'fail-probe' && race.relative === relative) fail(`descriptor-relative hard-link capability probe failed for ${relative} before publication`);
      await probeHardLinks(parent.handle, relative);
      await assertParentStillReachable(rootHandle, representative, parent.handle);
    }
    return { parents, createdDirectories };
  } catch (error) {
    for (const parent of parents.values()) if (parent.owned) await parent.handle.close();
    await cleanupCreatedDirectories(rootHandle, createdDirectories);
    throw error;
  }
}

function testRaceOptions() {
  if (process.env.NODE_ENV !== 'test' || !process.env.OPENCODE_PORTABLE_TEST_RACE) return null;
  const value = JSON.parse(process.env.OPENCODE_PORTABLE_TEST_RACE);
  if (!value || !['create-destination', 'insert-symlink', 'replace-root', 'replace-intermediate', 'replace-root-after-open', 'replace-parent-before-probe', 'fail-probe'].includes(value.action)) fail('invalid test race action');
  if (['create-destination', 'insert-symlink', 'replace-parent-before-probe', 'fail-probe'].includes(value.action)) safeRelative(value.relative, 'test race relative');
  return value;
}

async function applyAfterOpenRootRace(race, targetReal) {
  if (race?.action !== 'replace-root-after-open') return;
  if (typeof race.replacement !== 'string' || !path.isAbsolute(race.replacement)) fail('test replacement path must be absolute');
  await rename(targetReal, race.replacement);
  await mkdir(targetReal);
}

async function assertRootPathIdentity(targetReal, targetIdentity) {
  const current = await lstat(targetReal);
  if (current.isSymbolicLink() || !sameIdentity(targetIdentity, current)) fail('opened target differs from the preflight-inspected target');
}

async function applyRootRace(race, targetReal) {
  if (!['replace-root', 'replace-intermediate'].includes(race?.action)) return;
  if (typeof race.replacement !== 'string' || !path.isAbsolute(race.replacement)) fail('test replacement path must be absolute');
  if (race.action === 'replace-root') {
    await rename(targetReal, race.replacement);
    await mkdir(targetReal);
  } else {
    const parent = path.dirname(targetReal);
    await rename(parent, race.replacement);
    await mkdir(parent);
    await mkdir(targetReal);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const targetStat = await statOrNull(options.target);
  if (!targetStat?.isDirectory() || targetStat.isSymbolicLink()) fail(`target must be an existing real directory: ${options.target}`);
  await access(options.target, constants.R_OK | constants.W_OK);
  const sourceReal = await realpath(SOURCE_ROOT);
  const targetReal = await realpath(options.target);
  const targetIdentity = await lstat(targetReal);
  if (!sameIdentity(targetStat, targetIdentity)) fail('canonical target differs from the preflight-inspected target');
  const manifest = validateManifest(JSON.parse(await readFile(path.join(SOURCE_ROOT, MANIFEST_PATH), 'utf8')));
  const operations = [];
  const collisions = [];
  let unchanged = 0;

  for (const relative of manifest.managedFiles) {
    const bytes = await sourceBytes(relative, sourceReal);
    await rejectSymlinkPath(targetReal, relative);
    const destination = path.join(targetReal, ...relative.split('/'));
    const stat = await statOrNull(destination);
    if (stat && !stat.isFile()) fail(`managed destination is not a regular file: ${relative}`);
    if (!stat) operations.push({ kind: 'managed', relative, destination, bytes, allowOverwrite: false });
    else if ((await readFile(destination)).equals(bytes)) unchanged += 1;
    else if (options.overwriteManaged) operations.push({ kind: 'managed', relative, destination, bytes, allowOverwrite: true });
    else collisions.push(relative);
  }

  for (const seed of manifest.memorySeeds) {
    const bytes = await sourceBytes(seed.source, sourceReal);
    await rejectSymlinkPath(targetReal, seed.target);
    const destination = path.join(targetReal, ...seed.target.split('/'));
    const stat = await statOrNull(destination);
    if (!stat) operations.push({ kind: 'memory', relative: seed.target, destination, bytes, allowOverwrite: false });
    else if (stat.isFile()) unchanged += 1;
    else fail(`memory seed destination is not a regular file: ${seed.target}`);
  }

  if (collisions.length) fail(`managed collisions (${collisions.length}): ${collisions.join(', ')}; rerun with --overwrite-managed only after review`);
  const race = testRaceOptions();
  let writeSafety = 'not-exercised';
  if (!options.dryRun) {
    await applyRootRace(race, targetReal);
    if (race?.action === 'insert-symlink') {
      if (typeof race.target !== 'string' || !path.isAbsolute(race.target)) fail('test symlink target must be absolute');
      await symlink(race.target, path.join(targetReal, ...race.relative.split('/')), 'dir');
    }
    await assertRootPathIdentity(targetReal, targetIdentity);
    const rootHandle = await open(targetReal, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    let prepared;
    try {
      const handleIdentity = await rootHandle.stat();
      if (!sameIdentity(targetIdentity, handleIdentity)) fail('opened target differs from the preflight-inspected target');
      descriptorAlias = await discoverDescriptorAlias(rootHandle, targetIdentity, manifest.writeCapabilities.descriptorDirectoryAliases);
      if (!descriptorAlias) fail(`no usable descriptor-directory alias; tried ${manifest.writeCapabilities.descriptorDirectoryAliases.join(', ')}; capability contract requires fail-before-file-publication`);
      await applyAfterOpenRootRace(race, targetReal);
      await assertRootPathIdentity(targetReal, targetIdentity);
      prepared = await prepareDestinationParents(rootHandle, operations, race, targetReal);
      for (const operation of operations) {
        const parent = prepared.parents.get(path.posix.dirname(operation.relative));
        await atomicWrite(rootHandle, parent.handle, operation, race);
      }
      writeSafety = `descriptor-anchored-hard-link:${descriptorAlias}`;
    } finally {
      if (prepared) for (const parent of prepared.parents.values()) if (parent.owned) await parent.handle.close();
      await rootHandle.close();
      descriptorAlias = null;
    }
  }
  const managedCount = operations.filter((item) => item.kind === 'managed').length;
  const memoryCount = operations.filter((item) => item.kind === 'memory').length;
  console.log(`Portable harness bootstrap ${options.dryRun ? 'dry-run ' : ''}complete: created/updated=${managedCount}, memory-created=${memoryCount}, unchanged=${unchanged}, collisions=0, write-safety=${writeSafety}, target=${targetReal}`);
}

main().catch((error) => {
  console.error(error?.message ?? String(error));
  process.exitCode = 1;
});
