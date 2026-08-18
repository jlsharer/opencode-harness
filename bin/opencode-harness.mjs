#!/usr/bin/env node

import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mergeExternalRoutingDocuments } from '../.opencode/routing/routing-config-loader.mjs';
import { normalizeAndValidateRoutingConfig } from '../.opencode/routing/routing-policy.mjs';

process.umask(0o077);

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(PACKAGE_ROOT, '.opencode/runtime.manifest.json');
const MAX_INPUT_BYTES = 1024 * 1024;
const ROLES = ['implementer', 'planner', 'researcher', 'validator'];
const TRACE_ONLY_ROLES = ['planner', 'researcher', 'validator'];
const COMMANDS = ['delegate-implement', 'delegate-orchestration', 'delegate-plan', 'delegate-research', 'delegate-validate'];
const RESERVED_ENV = [
  'OPENCODE_CONFIG_DIR', 'OPENCODE_CONFIG_CONTENT', 'OPENCODE_CONFIG', 'OPENCODE_DB',
  'OPENCODE_HARNESS_WORKSPACE_ROOT', 'OPENCODE_HARNESS_RUNTIME_ROOT',
  'OPENCODE_HARNESS_TRACE_ROOT', 'OPENCODE_HARNESS_ROUTING_CATALOG',
  'OPENCODE_HARNESS_ROUTING_PROFILE',
  'OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH',
  'OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE',
];
const SEEDS = [
  ['bootstrap/memory/INDEX.md', 'INDEX.md'],
  ['bootstrap/memory/protocols/memory-management.md', 'protocols/memory-management.md'],
  ['bootstrap/memory/templates/orchestration-index.md', 'templates/orchestration-index.md'],
  ['bootstrap/memory/templates/role-trace-artifact.md', 'templates/role-trace-artifact.md'],
];

function fail(message) { throw new Error(`opencode-harness: ${message}`); }
function mode(stat) { return Number(stat.mode & 0o777n); }
function hash(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function sameIdentity(before, after) {
  return before.dev === after.dev && before.ino === after.ino && before.size === after.size && before.mtimeNs === after.mtimeNs;
}

function sameFilesystemIdentity(before, after) {
  return sameIdentity(before, after) && before.uid === after.uid && before.mode === after.mode
    && before.isFile() === after.isFile() && before.isDirectory() === after.isDirectory() && before.isSymbolicLink() === after.isSymbolicLink();
}
function sameDeviceInode(before, after) { return before.dev === after.dev && before.ino === after.ino; }

function readStableFile(filename, label, { exactMode = null, owners = [BigInt(process.getuid())], maxBytes = MAX_INPUT_BYTES } = {}) {
  let fd;
  try { fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0)); }
  catch (error) { fail(`cannot open ${label} without following its leaf: ${error.message}`); }
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || !owners.includes(before.uid)) fail(`${label} must be an allowed-owner regular file`);
    if (exactMode !== null && mode(before) !== exactMode) fail(`${label} must have mode ${exactMode.toString(8)}`);
    if ((mode(before) & 0o022) !== 0) fail(`${label} must not be group/world writable`);
    if (before.size > BigInt(maxBytes)) fail(`${label} exceeds ${maxBytes} bytes`);
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd, { bigint: true });
    if (!sameIdentity(before, after) || BigInt(bytes.length) !== before.size) fail(`${label} changed while being read`);
    return { bytes, stat: before };
  } finally { fs.closeSync(fd); }
}

function hashStableFile(filename, label, { owners = [0n, BigInt(process.getuid())] } = {}) {
  let fd;
  try { fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0)); }
  catch (error) { fail(`cannot open ${label} without following its leaf: ${error.message}`); }
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || !owners.includes(before.uid) || (mode(before) & 0o022) !== 0) fail(`${label} must be a trusted non-writable regular file`);
    const digest = createHash('sha256');
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let total = 0n;
    while (true) {
      const count = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      total += BigInt(count);
    }
    const after = fs.fstatSync(fd, { bigint: true });
    if (!sameIdentity(before, after) || total !== before.size) fail(`${label} changed while being hashed`);
    return digest.digest('hex');
  } finally { fs.closeSync(fd); }
}

function parseJsonBytes(bytes, label) {
  try { return JSON.parse(bytes.toString('utf8')); }
  catch (error) { fail(`malformed JSON in ${label}: ${error.message}`); }
}

function readJson(filename, label = filename) { return parseJsonBytes(readStableFile(filename, label, { owners: [0n, BigInt(process.getuid())] }).bytes, label); }

function assertSafeRelative(value, label) {
  if (typeof value !== 'string' || value === '' || path.isAbsolute(value) || value.includes('\\') || path.posix.normalize(value) !== value || value.split('/').some((part) => !part || part === '.' || part === '..')) fail(`unsafe ${label}: ${value}`);
}

function assertCanonicalAbsolute(input, label) {
  if (typeof input !== 'string' || !path.isAbsolute(input) || input.includes('\0')) fail(`${label} must be an absolute canonical path`);
  if (input !== '/' && (input.endsWith(path.sep) || input.includes(`${path.sep}${path.sep}`))) fail(`${label} contains a trailing or duplicate separator`);
  const parts = input.split(path.sep).slice(1);
  if (parts.some((part) => !part || part === '.' || part === '..') || path.normalize(input) !== input) fail(`${label} contains dot, dot-dot, or normalization ambiguity`);
  return parts;
}

function trustedDirectoryPath(input, label, { createMissing = false, exactFinalMode = null } = {}) {
  const parts = assertCanonicalAbsolute(input, label);
  let current = path.parse(input).root;
  let parentStat = fs.lstatSync(current, { bigint: true });
  for (let index = 0; index < parts.length; index += 1) {
    const next = path.join(current, parts[index]);
    let stat;
    try { stat = fs.lstatSync(next, { bigint: true }); }
    catch (error) {
      if (error.code !== 'ENOENT' || !createMissing) fail(`${label} component is unavailable: ${next}: ${error.message}`);
      const stickyParent = (mode(parentStat) & 0o022) !== 0 && Number(parentStat.mode & 0o1000n) !== 0;
      if (stickyParent) fail(`${label} must use an already-existing private child beneath a sticky directory`);
      if (parentStat.uid !== BigInt(process.getuid()) || mode(parentStat) !== 0o700) fail(`${label} missing suffix requires a current-user mode-0700 parent: ${current}`);
      const before = parentStat;
      try { fs.mkdirSync(next, { mode: 0o700 }); }
      catch (mkdirError) { if (mkdirError.code !== 'EEXIST') fail(`${label} cannot create private component ${next}: ${mkdirError.message}`); }
      const parentAfter = fs.lstatSync(current, { bigint: true });
      if (parentAfter.dev !== before.dev || parentAfter.ino !== before.ino) fail(`${label} parent identity changed during creation: ${current}`);
      stat = fs.lstatSync(next, { bigint: true });
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail(`${label} contains a non-directory or symlink component: ${next}`);
    if (stat.uid !== 0n && stat.uid !== BigInt(process.getuid())) fail(`${label} component has an untrusted owner: ${next}`);
    const bits = mode(stat);
    const sticky = (bits & 0o022) !== 0 && Number(stat.mode & 0o1000n) !== 0 && stat.uid === 0n;
    if ((bits & 0o022) !== 0 && !sticky) fail(`${label} component is group/world writable: ${next}`);
    const parentSticky = (mode(parentStat) & 0o022) !== 0 && Number(parentStat.mode & 0o1000n) !== 0;
    if (parentSticky && (stat.uid !== BigInt(process.getuid()) || bits !== 0o700)) fail(`${label} immediate child beneath sticky ancestry must already be current-user mode 0700: ${next}`);
    current = next;
    parentStat = stat;
  }
  if (exactFinalMode !== null && mode(parentStat) !== exactFinalMode) fail(`${label} has mode ${mode(parentStat).toString(8)}; expected ${exactFinalMode.toString(8)}`);
  return input;
}

function assertTrustedAncestry(input, label) { return trustedDirectoryPath(input, label); }

function lstatOwned(filename, label, expectedType, expectedMode = null) {
  let stat;
  try { stat = fs.lstatSync(filename, { bigint: true }); } catch (error) { fail(`${label} is unavailable: ${error.message}`); }
  if (stat.isSymbolicLink()) fail(`${label} must not be a symlink`);
  if (stat.uid !== BigInt(process.getuid())) fail(`${label} must be owned by the current user`);
  if (expectedType === 'directory' && !stat.isDirectory()) fail(`${label} must be a directory`);
  if (expectedType === 'file' && !stat.isFile()) fail(`${label} must be a regular file`);
  if (expectedMode !== null && mode(stat) !== expectedMode) fail(`${label} has mode ${mode(stat).toString(8)}; expected ${expectedMode.toString(8)}`);
  return stat;
}

function ensurePrivateDirectory(directory) {
  const canonical = trustedDirectoryPath(directory, directory, { createMissing: true, exactFinalMode: 0o700 });
  lstatOwned(canonical, canonical, 'directory', 0o700);
  return canonical;
}

function manifest() {
  const value = readJson(MANIFEST_PATH, 'runtime manifest');
  const expected = ['compatibility', 'fileModes', 'files', 'generatedEntries', 'packageVersion', 'profile', 'schemaVersion'];
  if (Object.keys(value).sort().join(',') !== expected.sort().join(',') || value.schemaVersion !== '1.0.0' || value.profile !== 'external-runtime' || value.packageVersion !== '0.1.9' || !Array.isArray(value.files) || !Array.isArray(value.generatedEntries)) fail('unsupported runtime manifest');
  const seenGenerated = new Set();
  for (const entry of value.generatedEntries) {
    const allowed = entry.path === '.harness-runtime.json' ? ['path', 'kind', 'mode', 'recursive', 'required', 'content'] : ['path', 'kind', 'mode', 'recursive', 'required'];
    if (Object.keys(entry).sort().join(',') !== allowed.sort().join(',')) fail(`generated-entry rule is not closed: ${entry.path}`);
    assertSafeRelative(entry.path, 'generated path');
    if (seenGenerated.has(entry.path) || !['file', 'directory'].includes(entry.kind) || !/^0[67][0-7][0-7]$/.test(entry.mode) || typeof entry.recursive !== 'boolean' || typeof entry.required !== 'boolean') fail(`invalid generated-entry rule: ${entry.path}`);
    if (entry.recursive !== (entry.path === 'node_modules')) fail(`only node_modules may be recursive: ${entry.path}`);
    seenGenerated.add(entry.path);
  }
  return value;
}

function assertNodeCompatibility(value) {
  if (process.platform !== value.compatibility.platform) fail(`requires ${value.compatibility.platform}`);
  if (Number(process.versions.node.split('.')[0]) !== 24) fail(`requires Node ${value.compatibility.node}; found ${process.version}`);
}

function loadManagedSources(value) {
  assertTrustedAncestry(PACKAGE_ROOT, 'package root');
  const sources = new Map();
  for (const entry of value.files) {
    if (Object.keys(entry).sort().join(',') !== 'destination,source') fail('runtime manifest file entries must be closed');
    assertSafeRelative(entry.source, 'manifest source');
    assertSafeRelative(entry.destination, 'manifest destination');
    if (sources.has(entry.destination)) fail(`duplicate runtime destination: ${entry.destination}`);
    const source = path.join(PACKAGE_ROOT, entry.source);
    const opened = readStableFile(source, `managed source ${entry.source}`, { owners: [0n, BigInt(process.getuid())] });
    sources.set(entry.destination, { ...entry, bytes: opened.bytes });
  }
  return sources;
}

function expectedDirectories(sources) {
  const result = new Set();
  for (const destination of sources.keys()) {
    let current = path.posix.dirname(destination);
    while (current !== '.') { result.add(current); current = path.posix.dirname(current); }
  }
  return result;
}

function strictDescendant(root, candidate) { return candidate.startsWith(`${root}${path.sep}`); }

function assertNoSymlinkComponents(root, candidate, label) {
  if (!strictDescendant(root, candidate)) fail(`${label} escapes node_modules`);
  let current = root;
  for (const component of path.relative(root, candidate).split(path.sep)) {
    current = path.join(current, component);
    let stat;
    try { stat = fs.lstatSync(current, { bigint: true }); }
    catch (error) { fail(`${label} is unavailable: ${error.message}`); }
    if (stat.isSymbolicLink()) fail(`${label} contains a symlinked target component`);
  }
}

function stableGeneratedJson(filename, nodeModules, label, exactMode = null) {
  assertNoSymlinkComponents(path.dirname(nodeModules), filename, label);
  const opened = readStableFile(filename, label, { exactMode });
  return { document: parseJsonBytes(opened.bytes, label), filename, label, stat: opened.stat };
}

function recheckStableGeneratedFile(opened) {
  let after;
  try { after = fs.lstatSync(opened.filename, { bigint: true }); }
  catch (error) { fail(`${opened.label} disappeared after validation: ${error.message}`); }
  if (!sameFilesystemIdentity(opened.stat, after)) fail(`${opened.label} changed after validation`);
}

function safeBinName(value) { return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value); }

function generatedPackageMetadata(root) {
  const packageFilename = path.join(root, 'package.json');
  const lockFilename = path.join(root, 'package-lock.json');
  const nodeModules = path.join(root, 'node_modules');
  let nodeModulesStat = null;
  try { nodeModulesStat = fs.lstatSync(nodeModules, { bigint: true }); }
  catch (error) { if (error.code !== 'ENOENT') fail(`generated runtime directory node_modules is unavailable: ${error.message}`); }
  if (nodeModulesStat) {
    if (nodeModulesStat.isSymbolicLink()) fail('generated runtime directory node_modules must not be a symlink');
    if (!nodeModulesStat.isDirectory() || nodeModulesStat.uid !== BigInt(process.getuid()) || mode(nodeModulesStat) !== 0o700) fail('generated runtime directory node_modules must be a current-user-owned mode-0700 directory');
  }
  const present = [fs.existsSync(packageFilename), fs.existsSync(lockFilename), Boolean(nodeModulesStat)];
  if (!present.some(Boolean)) return null;
  if (!present.every(Boolean)) fail('generated package.json, package-lock.json, and node_modules must be present together');

  const stableFiles = [];
  const packageOpened = stableGeneratedJson(packageFilename, nodeModules, 'generated package.json', 0o600); stableFiles.push(packageOpened);
  const lockOpened = stableGeneratedJson(lockFilename, nodeModules, 'generated package-lock.json', 0o600); stableFiles.push(lockOpened);
  const packageDocument = packageOpened.document;
  const lockDocument = lockOpened.document;
  const exactDependency = { '@opencode-ai/plugin': '1.18.18' };
  if (!packageDocument || typeof packageDocument !== 'object' || Array.isArray(packageDocument)
      || JSON.stringify(packageDocument.dependencies) !== JSON.stringify(exactDependency)) fail('generated package.json must have the sole exact @opencode-ai/plugin 1.18.18 dependency');
  for (const key of ['devDependencies', 'optionalDependencies', 'peerDependencies', 'bundledDependencies', 'bundleDependencies']) {
    if (Object.hasOwn(packageDocument, key)) fail(`generated package.json alternate direct dependency section is forbidden: ${key}`);
  }
  if (!lockDocument || typeof lockDocument !== 'object' || Array.isArray(lockDocument) || lockDocument.lockfileVersion !== 3
      || !lockDocument.packages || typeof lockDocument.packages !== 'object' || Array.isArray(lockDocument.packages)) fail('generated package-lock.json must be a lockfileVersion 3 packages object');
  if (JSON.stringify(lockDocument.packages['']?.dependencies) !== JSON.stringify(exactDependency)) fail('generated package-lock root dependency does not match package.json');
  if (lockDocument.packages['node_modules/@opencode-ai/plugin']?.version !== '1.18.18') fail('generated package-lock must contain @opencode-ai/plugin 1.18.18');
  for (const [location, entry] of Object.entries(lockDocument.packages)) {
    if (location.startsWith('node_modules/') && entry?.link === true) fail(`generated package-lock link entry is forbidden: ${location}`);
  }

  const binLinks = new Map();
  function inspectInstalledPackage(packageRelative) {
    const packageDirectory = path.join(nodeModules, ...packageRelative.split('/'));
    assertNoSymlinkComponents(nodeModules, packageDirectory, `installed package ${packageRelative}`);
    const stat = fs.lstatSync(packageDirectory, { bigint: true });
    if (!stat.isDirectory() || stat.uid !== BigInt(process.getuid()) || mode(stat) !== 0o700) fail(`installed package directory is unsafe: ${packageRelative}`);
    const manifestFilename = path.join(packageDirectory, 'package.json');
    const opened = stableGeneratedJson(manifestFilename, nodeModules, `installed package manifest ${packageRelative}`); stableFiles.push(opened);
    const document = opened.document;
    const lockEntry = lockDocument.packages[`node_modules/${packageRelative}`];
    if (!document || typeof document !== 'object' || Array.isArray(document) || document.name !== packageRelative || typeof document.version !== 'string'
        || !lockEntry || lockEntry.link === true || lockEntry.version !== document.version) fail(`installed package metadata/lock mismatch: ${packageRelative}`);
    let declarations = [];
    if (typeof document.bin === 'string') declarations = [[packageRelative.split('/').at(-1), document.bin]];
    else if (document.bin !== undefined) {
      if (!document.bin || typeof document.bin !== 'object' || Array.isArray(document.bin)) fail(`installed package bin metadata is malformed: ${packageRelative}`);
      declarations = Object.entries(document.bin);
    }
    for (const [name, rawTarget] of declarations) {
      if (!safeBinName(name) || typeof rawTarget !== 'string') fail(`installed package bin declaration is unsafe: ${packageRelative}`);
      const target = rawTarget.startsWith('./') ? rawTarget.slice(2) : rawTarget;
      assertSafeRelative(target, `installed package bin target for ${packageRelative}`);
      const targetRelative = path.posix.join(packageRelative, target);
      const linkText = path.posix.relative('.bin', targetRelative);
      if (binLinks.has(name)) fail(`conflicting installed package bin provider: ${name}`);
      binLinks.set(name, { linkText, targetRelative });
    }
  }

  for (const name of fs.readdirSync(nodeModules).sort()) {
    if (name === '.bin' || name.startsWith('.')) continue;
    const candidate = path.join(nodeModules, name);
    const stat = fs.lstatSync(candidate, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
    if (name.startsWith('@')) {
      if (!/^@[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) fail(`unsafe installed package scope: ${name}`);
      for (const child of fs.readdirSync(candidate).sort()) inspectInstalledPackage(`${name}/${child}`);
    } else inspectInstalledPackage(name);
  }
  return { binLinks, nodeModules, recheck: () => {
    const nodeModulesAfter = fs.lstatSync(nodeModules, { bigint: true });
    if (!sameFilesystemIdentity(nodeModulesStat, nodeModulesAfter)) fail('generated runtime directory node_modules changed after validation');
    stableFiles.forEach(recheckStableGeneratedFile);
  } };
}

function verifyGeneratedBinLink(root, relative, child, stat, metadata) {
  const expectedPrefix = 'node_modules/.bin/';
  const name = relative.startsWith(expectedPrefix) ? relative.slice(expectedPrefix.length) : '';
  if (!metadata || !safeBinName(name) || name.includes('/')) fail(`unsafe recursive generated symlink: ${relative}`);
  if (stat.uid !== BigInt(process.getuid())) fail(`generated bin link must be owned by the current user: ${relative}`);
  const linkText = fs.readlinkSync(child);
  if (!linkText || path.isAbsolute(linkText) || linkText.includes('\\') || linkText.includes('\0')) fail(`generated bin link must have a nonempty relative target: ${relative}`);
  const lexicalTarget = path.resolve(path.dirname(child), linkText);
  if (!strictDescendant(metadata.nodeModules, lexicalTarget)) fail(`generated bin link target escapes node_modules: ${relative}`);
  assertNoSymlinkComponents(metadata.nodeModules, lexicalTarget, `generated bin link target ${relative}`);
  let resolvedTarget;
  try { resolvedTarget = fs.realpathSync(lexicalTarget); }
  catch (error) { fail(`generated bin link target is unavailable: ${relative}: ${error.message}`); }
  if (!strictDescendant(metadata.nodeModules, resolvedTarget) || resolvedTarget !== lexicalTarget) fail(`generated bin link resolved target is unsafe: ${relative}`);
  const targetBefore = fs.lstatSync(lexicalTarget, { bigint: true });
  if (!targetBefore.isFile() || targetBefore.isSymbolicLink() || targetBefore.uid !== BigInt(process.getuid()) || (mode(targetBefore) & 0o022) !== 0) fail(`generated bin link target must be an owner-controlled non-writable regular file: ${relative}`);
  const expected = metadata.binLinks.get(name);
  const targetRelative = path.relative(metadata.nodeModules, lexicalTarget).split(path.sep).join('/');
  if (!expected || linkText !== expected.linkText || targetRelative !== expected.targetRelative) fail(`generated bin link does not match installed package metadata: ${relative}`);
  const targetAfter = fs.lstatSync(lexicalTarget, { bigint: true });
  const linkAfter = fs.lstatSync(child, { bigint: true });
  if (!sameFilesystemIdentity(targetBefore, targetAfter) || !sameFilesystemIdentity(stat, linkAfter) || fs.readlinkSync(child) !== linkText
      || fs.realpathSync(lexicalTarget) !== resolvedTarget) fail(`generated bin link or target changed during validation: ${relative}`);
}

function verifyRecursiveGenerated(root, relative, metadata) {
  const directory = path.join(root, relative);
  lstatOwned(directory, `generated runtime directory ${relative}`, 'directory', 0o700);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(root, childRelative);
    const stat = fs.lstatSync(child, { bigint: true });
    if (stat.isSymbolicLink()) { verifyGeneratedBinLink(root, childRelative, child, stat, metadata); continue; }
    if (stat.uid !== BigInt(process.getuid()) || (mode(stat) & 0o077) !== 0) fail(`unsafe recursive generated entry: ${childRelative}`);
    if (stat.isDirectory()) verifyRecursiveGenerated(root, childRelative, metadata);
    else if (!stat.isFile()) fail(`unsupported recursive generated entry type: ${childRelative}`);
  }
}

function verifyRuntime(runtimeRoot, value, sources = loadManagedSources(value)) {
  lstatOwned(runtimeRoot, 'runtime root', 'directory', 0o700);
  const root = runtimeRoot;
  const directories = expectedDirectories(sources);
  const generated = new Map(value.generatedEntries.map((entry) => {
    assertSafeRelative(entry.path, 'generated path');
    return [entry.path, entry];
  }));
  const packageMetadata = generatedPackageMetadata(root);
  function walk(relative = '') {
    const directory = relative ? path.join(root, relative) : root;
    if (relative) lstatOwned(directory, `runtime directory ${relative}`, 'directory', 0o700);
    for (const name of fs.readdirSync(directory)) {
      const childRelative = relative ? path.posix.join(relative, name) : name;
      const child = path.join(root, childRelative);
      if (sources.has(childRelative)) {
        lstatOwned(child, `managed runtime file ${childRelative}`, 'file', 0o644);
        const bytes = readStableFile(child, `managed runtime file ${childRelative}`, { exactMode: 0o644 }).bytes;
        if (hash(bytes) !== hash(sources.get(childRelative).bytes)) fail(`managed runtime drift: ${childRelative}`);
      } else if (directories.has(childRelative)) {
        walk(childRelative);
      } else if (generated.has(childRelative)) {
        const rule = generated.get(childRelative);
        if (rule.kind === 'directory' && rule.recursive === true) verifyRecursiveGenerated(root, childRelative, packageMetadata);
        else {
          lstatOwned(child, `generated runtime file ${childRelative}`, 'file', Number.parseInt(rule.mode, 8));
          if (rule.content === 'runtime-marker') {
            const marker = parseJsonBytes(readStableFile(child, 'runtime marker', { exactMode: Number.parseInt(rule.mode, 8) }).bytes, 'runtime marker');
            if (Object.keys(marker).sort().join(',') !== 'opencodeVersion,packageVersion' || marker.packageVersion !== value.packageVersion || marker.opencodeVersion !== value.compatibility.opencode) fail('runtime marker content mismatch');
          }
        }
      } else fail(`undeclared runtime entry: ${childRelative}`);
    }
  }
  walk();
  for (const destination of sources.keys()) if (!fs.existsSync(path.join(root, destination))) fail(`missing managed runtime file: ${destination}`);
  for (const directory of directories) if (!fs.existsSync(path.join(root, directory))) fail(`missing runtime directory: ${directory}`);
  for (const rule of value.generatedEntries.filter((entry) => entry.required)) if (!fs.existsSync(path.join(root, rule.path))) fail(`missing required generated entry: ${rule.path}`);
  packageMetadata?.recheck();
  return root;
}

function cacheRootFrom(options) {
  if (options.cacheRoot) {
    if (!path.isAbsolute(options.cacheRoot)) fail('--cache-root must be absolute');
    assertCanonicalAbsolute(options.cacheRoot, '--cache-root');
    return options.cacheRoot;
  }
  const base = process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), '.cache');
  assertCanonicalAbsolute(base, 'cache base');
  return path.join(base, 'opencode-harness');
}
function runtimePath(value, options) { return path.join(cacheRootFrom(options), value.packageVersion, `opencode-${value.compatibility.opencode}`, 'runtime'); }

export function prepareRuntime(options = {}) {
  const value = manifest();
  assertNodeCompatibility(value);
  const sources = loadManagedSources(value);
  const parent = ensurePrivateDirectory(path.dirname(runtimePath(value, options)));
  const runtime = path.join(parent, 'runtime');
  if (fs.existsSync(runtime)) return verifyRuntime(runtime, value, sources);
  const temporary = path.join(parent, `.prepare-${process.pid}-${randomBytes(8).toString('hex')}`);
  fs.mkdirSync(temporary, { mode: 0o700 });
  try {
    for (const source of sources.values()) {
      const target = path.join(temporary, source.destination);
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      fs.writeFileSync(target, source.bytes, { flag: 'wx', mode: 0o644 });
      fs.chmodSync(target, 0o644);
    }
    fs.writeFileSync(path.join(temporary, '.harness-runtime.json'), `${JSON.stringify({ packageVersion: value.packageVersion, opencodeVersion: value.compatibility.opencode })}\n`, { flag: 'wx', mode: 0o644 });
    fs.chmodSync(path.join(temporary, '.harness-runtime.json'), 0o644);
    for (const relative of fs.readdirSync(temporary, { recursive: true })) {
      const candidate = path.join(temporary, relative);
      if (fs.lstatSync(candidate).isFile()) { const fd = fs.openSync(candidate, 'r'); fs.fsyncSync(fd); fs.closeSync(fd); }
    }
    const fd = fs.openSync(temporary, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY); fs.fsyncSync(fd); fs.closeSync(fd);
    try { fs.renameSync(temporary, runtime); } catch (error) { if (error.code !== 'EEXIST' && error.code !== 'ENOTEMPTY') throw error; }
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
  return verifyRuntime(runtime, value, sources);
}

function git(workspace, args, allowFailure = false) {
  const result = spawnSync('git', ['-C', workspace, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (!allowFailure && result.status !== 0) fail(`Git preflight failed: ${(result.stderr || result.stdout).trim()}`);
  return result;
}
function canonicalWorkspace(input) {
  if (!input || !path.isAbsolute(input)) fail('--workspace must be an absolute path');
  const workspace = trustedDirectoryPath(input, 'workspace');
  lstatOwned(workspace, 'workspace', 'directory');
  const top = git(workspace, ['rev-parse', '--show-toplevel']).stdout.trim();
  if (top !== workspace) fail('--workspace must name the canonical Git worktree root (not a nested directory)');
  return workspace;
}

function stripJsonComments(input, label) {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') { inString = true; output += char; }
    else if (char === '/' && next === '/') {
      output += '  '; index += 1;
      while (index + 1 < input.length && input[index + 1] !== '\n') { output += ' '; index += 1; }
    } else if (char === '/' && next === '*') {
      output += '  '; index += 1;
      let closed = false;
      while (index + 1 < input.length) {
        index += 1;
        if (input[index] === '*' && input[index + 1] === '/') { output += '  '; index += 1; closed = true; break; }
        output += input[index] === '\n' ? '\n' : ' ';
      }
      if (!closed) fail(`unterminated block comment in ${label}`);
    } else output += char;
  }
  if (inString) fail(`unterminated string in ${label}`);
  return output;
}

function stripTrailingCommas(input) {
  let output = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') { inString = true; output += char; continue; }
    if (char === ',') {
      let lookahead = index + 1;
      while (/\s/.test(input[lookahead] ?? '')) lookahead += 1;
      if (input[lookahead] === '}' || input[lookahead] === ']') continue;
    }
    output += char;
  }
  return output;
}

function readProjectConfig(filename, label) {
  const opened = readStableFile(filename, label, { maxBytes: MAX_INPUT_BYTES });
  const text = opened.bytes.toString('utf8');
  try { return JSON.parse(filename.endsWith('.jsonc') ? stripTrailingCommas(stripJsonComments(text, label)) : text); }
  catch (error) { fail(`cannot safely parse ${label}: ${error.message}`); }
}

function containsHarnessPlugin(value) {
  const spec = Array.isArray(value) ? value[0] : value;
  return typeof spec === 'string' && /(opencode-harness|harness-lifecycle|role-model-routing-enforcement)/i.test(spec);
}

function inspectTrustedTree(root, label, { rejectDelegationSkill = false } = {}) {
  const canonical = trustedDirectoryPath(root, label);
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const candidate = path.join(directory, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (stat.isSymbolicLink() || (stat.uid !== 0n && stat.uid !== BigInt(process.getuid())) || (mode(stat) & 0o022) !== 0) fail(`${label} contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) walk(candidate);
      else if (!stat.isFile()) fail(`${label} contains an unsupported entry: ${candidate}`);
    }
  }
  walk(canonical);
  if (rejectDelegationSkill) {
    const pending = [canonical];
    while (pending.length) {
      const directory = pending.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) pending.push(candidate);
        if (entry.isFile() && entry.name === 'SKILL.md' && path.basename(path.dirname(candidate)) === 'delegation-orchestrator') fail(`${label} contains delegation-orchestrator/SKILL.md`);
      }
    }
  }
  return canonical;
}

function inspectConfigDocument(document, label, allowProjectPlugins, providerSupplied, customSkillRoots) {
  if (!document || typeof document !== 'object' || Array.isArray(document)) fail(`${label} must contain an object`);
  for (const role of ROLES) if (Object.hasOwn(document.agent ?? {}, role)) fail(`${label} has colliding agent key: ${role}`);
  for (const command of COMMANDS) if (Object.hasOwn(document.command ?? {}, command) || Object.hasOwn(document.command ?? {}, `/${command}`)) fail(`${label} has colliding command key: ${command}`);
  const skillPaths = document.skills?.paths ?? [];
  if (!Array.isArray(skillPaths)) fail(`${label}.skills.paths must be an array`);
  for (const skillPath of skillPaths) {
    if (typeof skillPath !== 'string' || !path.isAbsolute(skillPath)) fail(`${label} custom skill paths must be absolute`);
    const root = inspectTrustedTree(skillPath, `${label} custom skill root`, { rejectDelegationSkill: true });
    customSkillRoots.push(root);
  }
  if (Object.hasOwn(document, 'plugin')) {
    if (!Array.isArray(document.plugin)) fail(`${label}.plugin must be an array`);
    if (document.plugin.some(containsHarnessPlugin)) fail(`${label} declares a harness plugin collision`);
    if (document.plugin.length > 0 && !allowProjectPlugins) fail(`${label} plugin declarations require --allow-project-plugins (same-user code execution risk)`);
  }
  if (providerSupplied && Object.hasOwn(document, 'provider')) fail(`${label} declares provider and collides with --provider-config`);
}

function recursivePluginFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  const root = trustedDirectoryPath(directory, 'project plugin directory');
  const found = [];
  function walk(current) {
    for (const name of fs.readdirSync(current)) {
      const candidate = path.join(current, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (stat.isSymbolicLink() || (stat.uid !== 0n && stat.uid !== BigInt(process.getuid())) || (mode(stat) & 0o022) !== 0) fail(`project plugin path contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) walk(candidate);
      else if (stat.isFile() && /\.[cm]?[jt]s$/.test(name)) found.push(candidate);
    }
  }
  walk(root);
  return found;
}

function projectPreflight(workspace, allowProjectPlugins, providerSupplied) {
  const project = path.join(workspace, '.opencode');
  const customSkillRoots = [];
  if (fs.existsSync(project)) {
    trustedDirectoryPath(project, 'project .opencode');
    for (const relative of ['routing/harness-model-routing.json', 'routing/harness-model-routing.example.json']) if (fs.existsSync(path.join(project, relative))) fail(`project harness routing shadow is forbidden: .opencode/${relative}`);
    for (const directory of ['skills', 'skill']) if (fs.existsSync(path.join(project, directory, 'delegation-orchestrator'))) fail(`project skill collision: .opencode/${directory}/delegation-orchestrator`);
    for (const [directory, names] of [['agents', ROLES], ['agent', ROLES], ['commands', COMMANDS], ['command', COMMANDS]]) for (const name of names) if (fs.existsSync(path.join(project, directory, `${name}.md`))) fail(`project collision: .opencode/${directory}/${name}.md`);
    const plugins = ['plugins', 'plugin'].flatMap((directory) => recursivePluginFiles(path.join(project, directory)));
    if (plugins.some((filename) => /(harness-lifecycle|role-model-routing-enforcement)/i.test(path.basename(filename)))) fail('project filesystem declares a harness plugin collision');
    if (plugins.length > 0 && !allowProjectPlugins) fail('project local plugins require --allow-project-plugins (same-user code execution risk)');
  }
  for (const filename of [path.join(workspace, 'opencode.json'), path.join(workspace, 'opencode.jsonc'), path.join(project, 'opencode.json'), path.join(project, 'opencode.jsonc')]) {
    if (!fs.existsSync(filename)) continue;
    inspectConfigDocument(readProjectConfig(filename, path.relative(workspace, filename)), path.relative(workspace, filename), allowProjectPlugins, providerSupplied, customSkillRoots);
  }
  return { fingerprint: projectSecurityFingerprint(workspace, customSkillRoots), customSkillRoots };
}

function projectSecurityFingerprint(workspace, customSkillRoots) {
  const roots = [
    path.join(workspace, 'opencode.json'), path.join(workspace, 'opencode.jsonc'),
    path.join(workspace, '.opencode/opencode.json'), path.join(workspace, '.opencode/opencode.jsonc'),
    ...['agents', 'agent', 'commands', 'command', 'skills', 'skill', 'plugins', 'plugin', 'routing'].map((name) => path.join(workspace, '.opencode', name)),
    ...customSkillRoots,
  ];
  const records = [];
  function record(candidate) {
    if (!fs.existsSync(candidate)) { records.push(`missing:${candidate}`); return; }
    const stat = fs.lstatSync(candidate, { bigint: true });
    if (stat.isSymbolicLink() || (stat.uid !== 0n && stat.uid !== BigInt(process.getuid())) || (mode(stat) & 0o022) !== 0) fail(`project security surface is unsafe: ${candidate}`);
    if (stat.isDirectory()) {
      records.push(`dir:${candidate}:${stat.dev}:${stat.ino}:${mode(stat)}`);
      for (const name of fs.readdirSync(candidate).sort()) record(path.join(candidate, name));
    } else if (stat.isFile()) {
      const digest = hashStableFile(candidate, `project security file ${candidate}`);
      records.push(`file:${candidate}:${stat.dev}:${stat.ino}:${mode(stat)}:${digest}`);
    } else fail(`project security surface has unsupported entry: ${candidate}`);
  }
  for (const root of roots) record(root);
  return hash(Buffer.from([...new Set(records)].sort().join('\n')));
}

function inspectPrivateTree(root, label) {
  lstatOwned(root, label, 'directory', 0o700);
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const candidate = path.join(directory, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (stat.isSymbolicLink() || stat.uid !== BigInt(process.getuid())) fail(`${label} contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) { if (mode(stat) !== 0o700) fail(`${label} directory must be mode 0700: ${candidate}`); walk(candidate); }
      else if (stat.isFile()) { if (mode(stat) !== 0o600) fail(`${label} file must be mode 0600: ${candidate}`); }
      else fail(`${label} contains an unsupported entry: ${candidate}`);
    }
  }
  walk(root);
  return root;
}

function seedTraceRoot(traceRoot, runtimeRoot) {
  for (const [sourceRelative, targetRelative] of SEEDS) {
    const source = readStableFile(path.join(runtimeRoot, sourceRelative), `runtime trace seed ${sourceRelative}`, { exactMode: 0o644 }).bytes;
    const target = path.join(traceRoot, targetRelative);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    if (fs.existsSync(target)) {
      const existing = readStableFile(target, `trace seed ${targetRelative}`, { exactMode: 0o600 }).bytes;
      if (hash(existing) !== hash(source)) fail(`trace seed collision: ${targetRelative}`);
    } else fs.writeFileSync(target, source, { flag: 'wx', mode: 0o600 });
  }
  return inspectPrivateTree(traceRoot, 'trace root');
}

function chooseTraceRoot(workspace, explicit, runtimeRoot) {
  if (explicit) {
    if (!path.isAbsolute(explicit)) fail('--trace-root must be absolute');
    const root = ensurePrivateDirectory(explicit);
    inspectPrivateTree(root, 'explicit trace root');
    return seedTraceRoot(root, runtimeRoot);
  }
  const projectMemory = path.join(workspace, '.memory');
  const ignored = git(workspace, ['check-ignore', '-q', '--no-index', '.memory/'], true).status === 0;
  if (ignored) {
    let safeProjectRoot = null;
    try {
      if (!fs.existsSync(projectMemory)) ensurePrivateDirectory(projectMemory);
      assertTrustedAncestry(projectMemory, 'workspace trace root');
      inspectPrivateTree(projectMemory, 'workspace trace root');
      safeProjectRoot = projectMemory;
    } catch { /* Unsafe ignored project memory falls back to XDG state without repair. */ }
    if (safeProjectRoot) return seedTraceRoot(safeProjectRoot, runtimeRoot);
  }
  const state = process.env.XDG_STATE_HOME ?? path.join(os.homedir(), '.local/state');
  assertCanonicalAbsolute(state, 'state base');
  const key = createHash('sha256').update(workspace).digest('hex');
  const root = ensurePrivateDirectory(path.join(state, 'opencode-harness/workspaces', key, '.memory'));
  inspectPrivateTree(root, 'XDG trace root');
  return seedTraceRoot(root, runtimeRoot);
}

function inspectExternalFile(input, label) {
  if (!input || !path.isAbsolute(input)) fail(`${label} must be an absolute path`);
  const resolved = fs.realpathSync(input);
  assertTrustedAncestry(path.dirname(resolved), `${label} parent`);
  const opened = readStableFile(resolved, label, { exactMode: 0o600 });
  return { resolved, bytes: opened.bytes, document: parseJsonBytes(opened.bytes, label) };
}

function exactKeys(value, allowed, required, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail(`${label}.${key} is forbidden`);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required`);
}

function canonicalLoopbackUrl(value, label) {
  if (typeof value !== 'string' || !/^http:\/\/127\.0\.0\.1:[0-9]+\/v1$/.test(value)) fail(`${label} must be canonical http://127.0.0.1:<port>/v1`);
  let parsed;
  try { parsed = new URL(value); } catch { fail(`${label} must be a URL`); }
  const port = Number(parsed.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || parsed.username || parsed.password || parsed.search || parsed.hash) fail(`${label} has an invalid port or credential component`);
  return value;
}

function validateProviderProjection(document) {
  exactKeys(document, ['$schema', 'provider'], ['$schema', 'provider'], 'provider config');
  if (document.$schema !== 'https://opencode.ai/config.json') fail('provider config.$schema is invalid');
  exactKeys(document.provider, Object.keys(document.provider), [], 'provider config.provider');
  if (Object.keys(document.provider).length === 0) fail('provider config.provider must not be empty');
  for (const [providerId, provider] of Object.entries(document.provider)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(providerId)) fail(`provider config provider id is invalid: ${providerId}`);
    exactKeys(provider, ['npm', 'name', 'options', 'models'], ['npm', 'name', 'options', 'models'], `provider config.provider.${providerId}`);
    if (provider.npm !== '@ai-sdk/openai-compatible' || typeof provider.name !== 'string' || provider.name.length < 1 || provider.name.length > 128) fail(`provider config.provider.${providerId} has invalid adapter or name`);
    exactKeys(provider.options, ['baseURL'], ['baseURL'], `provider config.provider.${providerId}.options`);
    canonicalLoopbackUrl(provider.options.baseURL, `provider config.provider.${providerId}.options.baseURL`);
    exactKeys(provider.models, Object.keys(provider.models), [], `provider config.provider.${providerId}.models`);
    const models = Object.entries(provider.models);
    if (models.length !== 1) fail(`provider config.provider.${providerId}.models must contain exactly one model`);
    const [modelId, model] = models[0];
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(modelId)) fail(`provider config model id is invalid: ${modelId}`);
    exactKeys(model, ['name', 'limit', 'options'], ['name', 'limit', 'options'], `provider config.provider.${providerId}.models.${modelId}`);
    if (model.name !== modelId) fail(`provider config model key/name mismatch: ${modelId}`);
    exactKeys(model.limit, ['context', 'output'], ['context', 'output'], `provider config.provider.${providerId}.models.${modelId}.limit`);
    const { context, output } = model.limit;
    if (!Number.isInteger(context) || context < 1 || context > 2147483647) fail(`provider config model context limit is out of range: ${modelId}`);
    if (!Number.isInteger(output) || output < 1 || output > 2147483647) fail(`provider config model output limit is out of range: ${modelId}`);
    if (output >= context) fail(`provider config model output limit must be less than context: ${modelId}`);
    exactKeys(model.options, ['chat_template_kwargs'], ['chat_template_kwargs'], `provider config.provider.${providerId}.models.${modelId}.options`);
    exactKeys(model.options.chat_template_kwargs, ['enable_thinking'], ['enable_thinking'], `provider config.provider.${providerId}.models.${modelId}.options.chat_template_kwargs`);
    if (typeof model.options.chat_template_kwargs.enable_thinking !== 'boolean') fail(`provider config model enable_thinking must be a boolean: ${modelId}`);
  }
  return document;
}

function validateCatalog(document) {
  exactKeys(document, ['schemaVersion', 'models'], ['schemaVersion', 'models'], 'routing catalog');
  if (document.schemaVersion !== '1.0.0') fail('routing catalog.schemaVersion must equal "1.0.0"');
  exactKeys(document.models, Object.keys(document.models), [], 'routing catalog.models');
  if (Object.keys(document.models).length === 0) fail('routing catalog.models must not be empty');
  for (const [name, entry] of Object.entries(document.models)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(name)) fail(`routing catalog model key is invalid: ${name}`);
    exactKeys(entry, ['model', 'routingServiceUrl', 'maxInFlight'], ['model', 'routingServiceUrl', 'maxInFlight'], `routing catalog.models.${name}`);
    if (typeof entry.model !== 'string' || !entry.model.startsWith(`${name}/`) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(entry.model.slice(name.length + 1))) fail(`routing catalog.models.${name}.model must use its catalog key as provider prefix`);
    canonicalLoopbackUrl(entry.routingServiceUrl, `routing catalog.models.${name}.routingServiceUrl`);
    if (!Number.isInteger(entry.maxInFlight) || entry.maxInFlight < 1 || entry.maxInFlight > 2147483647) fail(`routing catalog.models.${name}.maxInFlight is out of range`);
  }
  return document;
}

function createSnapshots(runtimeRoot, inputs) {
  const parent = ensurePrivateDirectory(path.join(path.dirname(runtimeRoot), 'launches'));
  if (fs.realpathSync(parent) !== parent || parent === path.parse(parent).root) fail('launch snapshots parent must be canonical and must not be a filesystem root');
  const parentIdentity = lstatOwned(parent, 'launch snapshots parent', 'directory', 0o700);
  const directory = path.join(parent, `launch-${process.pid}-${randomBytes(8).toString('hex')}`);
  fs.mkdirSync(directory, { mode: 0o700 });
  if (fs.realpathSync(directory) !== directory) fail('launch snapshot directory must be canonical');
  const directoryIdentity = lstatOwned(directory, 'launch snapshot directory', 'directory', 0o700);
  const paths = {};
  try {
    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index];
      const target = path.join(directory, input.name);
      fs.writeFileSync(target, input.bytes, { flag: 'wx', mode: 0o600 });
      if (process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_SNAPSHOT_FAIL_AFTER === String(index + 1)) throw new Error('injected snapshot construction failure');
      const fd = fs.openSync(target, 'r'); fs.fsyncSync(fd); fs.closeSync(fd);
      paths[input.key] = target;
    }
    return { parent, parentIdentity, directory, directoryIdentity, paths, database: path.join(directory, 'opencode.db') };
  } catch (error) {
    for (const name of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, name));
    fs.rmdirSync(directory);
    throw error;
  }
}

function cleanupSnapshot(snapshot, originalProblem = null, allowTestInjections = true) {
  const allowed = new Set([...Object.values(snapshot.paths).map((filename) => path.basename(filename)), 'opencode.db', 'opencode.db-wal', 'opencode.db-shm']);
  let primary = originalProblem || 'launch snapshot cleanup';
  let retainedLaunch = snapshot.directory;
  let retainedQuarantine = null;
  function cleanupFailure(detail) {
    const retained = retainedQuarantine ? `; retained quarantine: ${retainedQuarantine}` : retainedLaunch ? `; retained launch: ${retainedLaunch}` : '';
    fail(`${primary}; cleanup failure: ${detail}${retained}`);
  }

  try {
    if (allowTestInjections && process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_PATH_CONFUSION === '1') snapshot.directory = `${snapshot.directory}${path.sep}..${path.sep}${path.basename(snapshot.directory)}`;
    if (allowTestInjections && process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_PARENT_SWAP === '1') {
      const movedParent = `${snapshot.parent}.swapped`;
      fs.renameSync(snapshot.parent, movedParent);
      retainedLaunch = path.join(movedParent, path.basename(retainedLaunch));
      fs.mkdirSync(snapshot.parent, { mode: 0o700 });
    }
    if (allowTestInjections && process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_LAUNCH_REPLACEMENT === '1') {
      const movedLaunch = `${snapshot.directory}.replaced`;
      fs.renameSync(snapshot.directory, movedLaunch);
      retainedLaunch = movedLaunch;
      fs.mkdirSync(snapshot.directory, { mode: 0o700 });
    }
    assertCanonicalAbsolute(snapshot.parent, 'verified launch snapshots parent');
    assertCanonicalAbsolute(snapshot.directory, 'verified launch snapshot directory');
    if (snapshot.parent === path.parse(snapshot.parent).root || snapshot.directory === path.parse(snapshot.directory).root || snapshot.directory === snapshot.parent
        || path.dirname(snapshot.directory) !== snapshot.parent || path.join(snapshot.parent, path.basename(snapshot.directory)) !== snapshot.directory) throw new Error('launch cleanup paths are not an immediate contained child or name a canonical root exclusion');
    if (fs.realpathSync(snapshot.parent) !== snapshot.parent) throw new Error('launch snapshots parent canonical path changed');
    const parentBefore = fs.lstatSync(snapshot.parent, { bigint: true });
    if (!parentBefore.isDirectory() || parentBefore.isSymbolicLink() || parentBefore.uid !== BigInt(process.getuid()) || mode(parentBefore) !== 0o700 || !sameDeviceInode(snapshot.parentIdentity, parentBefore)) throw new Error('launch snapshots parent identity changed before quarantine');
    if (fs.realpathSync(snapshot.directory) !== snapshot.directory) throw new Error('launch snapshot canonical path changed before quarantine');
    const launchBefore = fs.lstatSync(snapshot.directory, { bigint: true });
    if (!launchBefore.isDirectory() || launchBefore.isSymbolicLink() || launchBefore.uid !== BigInt(process.getuid()) || mode(launchBefore) !== 0o700 || !sameDeviceInode(snapshot.directoryIdentity, launchBefore)) throw new Error('launch snapshot identity changed before quarantine');
  } catch (error) {
    cleanupFailure(`pre-quarantine guard failed: ${error.message.replace(/^opencode-harness: /, '')}`);
  }

  let inventoryProblem = null;
  try {
    for (const name of fs.readdirSync(snapshot.directory).sort()) {
      const filename = path.join(snapshot.directory, name);
      if (!allowed.has(name)) { inventoryProblem ??= `launch snapshot contains unexpected entry: ${name}`; continue; }
      const stat = fs.lstatSync(filename, { bigint: true });
      if (stat.isSymbolicLink() || !stat.isFile() || stat.uid !== BigInt(process.getuid()) || mode(stat) !== 0o600) inventoryProblem ??= `launch snapshot entry is not a current-user mode-0600 regular file: ${name}`;
    }
  } catch (error) { inventoryProblem = `launch snapshot inventory failed: ${error.message}`; }
  primary = [originalProblem, inventoryProblem].filter(Boolean).join('; ') || 'launch snapshot cleanup';

  const quarantine = path.join(snapshot.parent, `.quarantine-${process.pid}-${randomBytes(8).toString('hex')}`);
  try {
    assertCanonicalAbsolute(quarantine, 'launch quarantine');
    if (path.dirname(quarantine) !== snapshot.parent || quarantine === snapshot.parent || quarantine === path.parse(quarantine).root) throw new Error('quarantine path is not an immediate contained non-root child');
    fs.renameSync(snapshot.directory, quarantine);
    retainedQuarantine = quarantine;
    retainedLaunch = null;
  } catch (error) {
    cleanupFailure(`same-parent quarantine rename failed: ${error.message.replace(/^opencode-harness: /, '')}`);
  }

  try {
    if (allowTestInjections && process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_POST_RENAME_MISMATCH === '1') {
      const moved = `${quarantine}.identity-mismatch`;
      fs.renameSync(quarantine, moved);
      retainedQuarantine = moved;
      fs.mkdirSync(quarantine, { mode: 0o700 });
    }
    const parentAfter = fs.lstatSync(snapshot.parent, { bigint: true });
    if (!parentAfter.isDirectory() || parentAfter.isSymbolicLink() || parentAfter.uid !== BigInt(process.getuid()) || mode(parentAfter) !== 0o700 || !sameDeviceInode(snapshot.parentIdentity, parentAfter)) throw new Error('launch snapshots parent identity changed after quarantine rename');
    const quarantined = fs.lstatSync(quarantine, { bigint: true });
    if (quarantined.dev !== snapshot.directoryIdentity.dev || quarantined.ino !== snapshot.directoryIdentity.ino) throw new Error('quarantine dev/ino does not match the verified launch directory');
  } catch (error) {
    cleanupFailure(`post-quarantine identity check failed: ${error.message.replace(/^opencode-harness: /, '')}`);
  }

  function removeContainedEntry(filename) {
    const stat = fs.lstatSync(filename, { bigint: true });
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      for (const name of fs.readdirSync(filename)) removeContainedEntry(path.join(filename, name));
      fs.rmdirSync(filename);
    } else fs.unlinkSync(filename);
  }
  try {
    if (allowTestInjections && process.env.OPENCODE_HARNESS_TESTING === '1' && process.env.OPENCODE_HARNESS_TEST_QUARANTINE_CLEANUP_FAIL === '1') throw new Error('injected quarantine cleanup failure');
    removeContainedEntry(quarantine);
    const parentFinal = fs.lstatSync(snapshot.parent, { bigint: true });
    if (fs.realpathSync(snapshot.parent) !== snapshot.parent || !parentFinal.isDirectory() || parentFinal.isSymbolicLink() || parentFinal.uid !== BigInt(process.getuid())
        || mode(parentFinal) !== 0o700 || !sameDeviceInode(snapshot.parentIdentity, parentFinal)) throw new Error('launch snapshots parent identity changed after recursive unlink');
    try { fs.lstatSync(quarantine); throw new Error('quarantine path still exists after recursive unlink'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    retainedQuarantine = null;
  }
  catch (error) { cleanupFailure(`quarantine recursive unlink failed: ${error.message}`); }
  if (inventoryProblem) fail(`${primary}; quarantined launch snapshot was safely removed`);
}

function expectedTracePermissionMarker(workspace, traceRoot, nonce) {
  const relativeRoot = path.relative(workspace, traceRoot).split(path.sep).join('/');
  const permissions = ROLES.map((role) => ({
    role,
    externalDirectory: `${traceRoot}/orchestrations/*/roles/${role}/*`,
    edit: TRACE_ONLY_ROLES.includes(role) ? `${relativeRoot}/orchestrations/*/roles/${role}/*.md` : null,
  }));
  const plan = { schemaVersion: '1.0.0', workspaceRoot: workspace, traceRoot, roles: ROLES, permissions };
  return { ...plan, nonce, permissionPlanDigest: hash(Buffer.from(JSON.stringify(plan))) };
}

function verifyTracePermissionMarker(filename, expected) {
  const stat = lstatOwned(filename, 'trace permission activation marker', 'file', 0o600);
  if (stat.nlink !== 1n) fail('trace permission activation marker must have one link');
  const document = parseJsonBytes(readStableFile(filename, 'trace permission activation marker', { exactMode: 0o600 }).bytes, 'trace permission activation marker');
  const keys = ['nonce', 'permissionPlanDigest', 'permissions', 'roles', 'schemaVersion', 'traceRoot', 'workspaceRoot'];
  if (!document || typeof document !== 'object' || Array.isArray(document) || Object.keys(document).sort().join(',') !== keys.sort().join(',')) fail('trace permission activation marker mismatch');
  for (const key of keys) if (JSON.stringify(document[key]) !== JSON.stringify(expected[key])) fail(`trace permission activation marker mismatch: ${key}`);
}

function recheckExecutable(executable, identity, label) {
  const stat = fs.lstatSync(executable, { bigint: true });
  const opened = readStableFile(executable, label, { owners: [0n, BigInt(process.getuid())], maxBytes: Number.MAX_SAFE_INTEGER });
  if (stat.dev !== identity.dev || stat.ino !== identity.ino || !sameIdentity(identity, opened.stat) || hash(opened.bytes) !== identity.digest) fail(`OpenCode executable identity changed after ${label}`);
}

function activationEnv(base, runtimeRoot, workspace, traceRoot, snapshot) {
  const env = { ...base, OPENCODE_CONFIG_DIR: runtimeRoot, OPENCODE_DB: snapshot.database, OPENCODE_HARNESS_RUNTIME_ROOT: runtimeRoot, OPENCODE_HARNESS_WORKSPACE_ROOT: workspace, OPENCODE_HARNESS_TRACE_ROOT: traceRoot };
  if (snapshot.paths.provider) env.OPENCODE_CONFIG = snapshot.paths.provider;
  if (snapshot.paths.catalog) { env.OPENCODE_HARNESS_ROUTING_CATALOG = snapshot.paths.catalog; env.OPENCODE_HARNESS_ROUTING_PROFILE = snapshot.paths.profile; }
  return env;
}

function probeTracePermissions(executable, identity, workspace, runtimeRoot, traceRoot, inputs, projectState, options) {
  const snapshot = createSnapshots(runtimeRoot, inputs);
  const marker = path.join(snapshot.directory, 'trace-permission-probe.json');
  snapshot.paths.probeMarker = marker;
  const nonce = randomBytes(32).toString('hex');
  let problem = null;
  try {
    const env = activationEnv(process.env, runtimeRoot, workspace, traceRoot, snapshot);
    env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH = marker;
    env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE = nonce;
    const result = spawnSync(executable, ['agent', 'list'], { cwd: workspace, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (result.error) fail(`cannot start OpenCode activation probe: ${result.error.message}`);
    if (result.status !== 0) fail(`OpenCode trace permission activation probe failed with status ${result.status}: ${(result.stderr || result.stdout).trim()}`);
    verifyTracePermissionMarker(marker, expectedTracePermissionMarker(workspace, traceRoot, nonce));
  } catch (error) { problem = error; }
  cleanupSnapshot(snapshot, problem?.message.replace(/^opencode-harness: /, '') ?? null, false);
  if (problem) throw problem;
  recheckExecutable(executable, identity, 'trace permission activation probe');
  const recheckedProject = projectPreflight(workspace, Boolean(options.allowProjectPlugins), Boolean(options.providerConfig));
  if (recheckedProject.fingerprint !== projectState.fingerprint) fail('project config/plugin/skill surface changed after trace permission activation probe');
}

function resolveExecutable() {
  let candidate = process.env.OPENCODE_BIN;
  if (candidate) {
    if (!path.isAbsolute(candidate)) fail('OPENCODE_BIN must be absolute');
    assertCanonicalAbsolute(candidate, 'OPENCODE_BIN');
  } else {
    const entries = (process.env.PATH ?? '').split(path.delimiter);
    if (entries.length === 0) fail('PATH must contain an executable search path');
    for (const entry of entries) {
      if (!entry) continue;
      const possible = path.join(entry, 'opencode');
      try { fs.accessSync(possible, fs.constants.X_OK); }
      catch { continue; }
      if (!path.isAbsolute(entry)) fail('the selected PATH entry containing opencode must be absolute');
      candidate = possible;
      break;
    }
    if (!candidate) fail('opencode executable not found on absolute PATH');
  }
  const executable = fs.realpathSync(candidate);
  trustedDirectoryPath(path.dirname(executable), 'OpenCode executable ancestry');
  const stat = fs.lstatSync(executable, { bigint: true });
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.uid !== 0n && stat.uid !== BigInt(process.getuid())) || (mode(stat) & 0o022) !== 0 || (mode(stat) & 0o111) === 0) fail('OpenCode executable must resolve to a trusted non-writable executable regular file');
  const opened = readStableFile(executable, 'OpenCode executable', { owners: [0n, BigInt(process.getuid())], maxBytes: Number.MAX_SAFE_INTEGER });
  return { executable, identity: { dev: opened.stat.dev, ino: opened.stat.ino, size: opened.stat.size, mtimeNs: opened.stat.mtimeNs, digest: hash(opened.bytes) } };
}

function parse(argv) {
  const command = argv.shift() ?? 'help';
  const options = { forward: [] };
  while (argv.length) {
    const token = argv.shift();
    if (token === '--') { options.forward = argv.splice(0); break; }
    if (token === '--allow-project-plugins') { options.allowProjectPlugins = true; continue; }
    const key = new Map([['--workspace', 'workspace'], ['--trace-root', 'traceRoot'], ['--cache-root', 'cacheRoot'], ['--provider-config', 'providerConfig'], ['--routing-catalog', 'catalog'], ['--routing-profile', 'profile']]).get(token);
    if (!key || argv.length === 0) fail(`unknown or incomplete option: ${token}`);
    options[key] = argv.shift();
  }
  return { command, options };
}

function usage() {
  return `Usage:\n  opencode-harness prepare [--cache-root ABS]\n  opencode-harness run --workspace ABS [--trace-root ABS] [--cache-root ABS]\n    [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]\n    [--allow-project-plugins] [-- OPENCODE_ARGS...]\n`;
}

function run(options) {
  for (const name of RESERVED_ENV) if (Object.hasOwn(process.env, name)) fail(`refusing pre-set ${name}`);
  for (const arg of options.forward) if (arg === '--pure' || arg === '--dir' || arg.startsWith('--dir=') || arg.startsWith('--project') || arg.startsWith('--config')) fail(`forbidden forwarded option: ${arg}`);
  if (Boolean(options.catalog) !== Boolean(options.profile)) fail('--routing-catalog and --routing-profile are an all-or-none pair');
  const workspace = canonicalWorkspace(options.workspace);
  const projectState = projectPreflight(workspace, Boolean(options.allowProjectPlugins), Boolean(options.providerConfig));
  const runtimeRoot = prepareRuntime(options);
  const traceRoot = chooseTraceRoot(workspace, options.traceRoot, runtimeRoot);
  for (const [left, right, label] of [[workspace, runtimeRoot, 'workspace/runtime'], [runtimeRoot, traceRoot, 'runtime/trace']]) if (left === right || left.startsWith(`${right}${path.sep}`) || right.startsWith(`${left}${path.sep}`)) fail(`${label} roots must not overlap`);
  if (traceRoot.startsWith(`${workspace}${path.sep}`) && traceRoot !== path.join(workspace, '.memory')) fail('workspace/trace roots may overlap only at the ignored workspace .memory directory');

  const inputs = [];
  let providerDocument = null;
  let catalogDocument = null;
  if (options.providerConfig) {
    const provider = inspectExternalFile(options.providerConfig, 'provider config');
    providerDocument = validateProviderProjection(provider.document);
    inputs.push({ key: 'provider', name: 'provider.json', bytes: provider.bytes });
  }
  if (options.catalog) {
    const catalog = inspectExternalFile(options.catalog, 'routing catalog');
    const profile = inspectExternalFile(options.profile, 'routing profile');
    catalogDocument = validateCatalog(catalog.document);
    normalizeAndValidateRoutingConfig(mergeExternalRoutingDocuments(catalog.document, profile.document));
    inputs.push({ key: 'catalog', name: 'catalog.json', bytes: catalog.bytes }, { key: 'profile', name: 'profile.json', bytes: profile.bytes });
  }
  if (providerDocument && catalogDocument) {
    for (const [name, entry] of Object.entries(catalogDocument.models)) {
      const provider = providerDocument.provider[name];
      const model = entry.model.slice(name.length + 1);
      if (!provider || !Object.hasOwn(provider.models, model) || provider.options.baseURL !== entry.routingServiceUrl) fail(`provider/catalog mismatch for ${name}`);
    }
    if (Object.keys(providerDocument.provider).length !== Object.keys(catalogDocument.models).length) fail('provider/catalog provider sets differ');
  }
  let snapshots = null;
  let resultStatus = 1;
  let originalError = null;
  try {
    const { executable, identity } = resolveExecutable();
    const version = spawnSync(executable, ['--version'], { encoding: 'utf8', env: process.env });
    if (version.status !== 0 || version.stdout.trim() !== manifest().compatibility.opencode) fail(`requires OpenCode ${manifest().compatibility.opencode}`);
    recheckExecutable(executable, identity, 'version probe');
    const recheckedProject = projectPreflight(workspace, Boolean(options.allowProjectPlugins), Boolean(options.providerConfig));
    if (recheckedProject.fingerprint !== projectState.fingerprint) fail('project config/plugin/skill surface changed after preflight');
    if (traceRoot !== path.join(workspace, '.memory')) probeTracePermissions(executable, identity, workspace, runtimeRoot, traceRoot, inputs, projectState, options);
    snapshots = createSnapshots(runtimeRoot, inputs);
    const env = activationEnv(process.env, runtimeRoot, workspace, traceRoot, snapshots);
    const result = spawnSync(executable, options.forward, { cwd: workspace, env, stdio: 'inherit' });
    if (result.error) fail(`cannot start OpenCode: ${result.error.message}`);
    resultStatus = result.status ?? 1;
  } catch (error) { originalError = error; }
  const originalProblem = originalError?.message.replace(/^opencode-harness: /, '') ?? (resultStatus === 0 ? null : `OpenCode child exited with status ${resultStatus}`);
  if (snapshots) cleanupSnapshot(snapshots, originalProblem);
  if (originalError) throw originalError;
  return resultStatus;
}

try {
  const { command, options } = parse(process.argv.slice(2));
  if (command === 'help' || command === '--help' || command === '-h') { process.stdout.write(usage()); process.exitCode = 0; }
  else if (command === 'prepare') process.stdout.write(`${prepareRuntime(options)}\n`);
  else if (command === 'run') process.exitCode = run(options);
  else fail(`unknown command: ${command}`);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
