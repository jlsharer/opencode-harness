#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import type { BigIntStats } from "node:fs";
import { fileURLToPath } from "node:url";
import { mergeExternalRoutingDocuments } from "../.opencode/src/routing/routing-config-loader.ts";
import { normalizeAndValidateRoutingConfig } from "../.opencode/src/routing/routing-policy.ts";

process.umask(0o077);

const PACKAGE_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST_PATH = path.join(PACKAGE_ROOT, ".opencode/runtime.manifest.json");
const MAX_INPUT_BYTES = 1024 * 1024;
const ROLES = ["implementer", "planner", "researcher", "validator"];
const TRACE_ONLY_ROLES = ["planner", "researcher", "validator"];
const COMMANDS = [
  "delegate-implement",
  "delegate-orchestration",
  "delegate-plan",
  "delegate-research",
  "delegate-validate",
];
const RESERVED_ENV = [
  "OPENCODE_CONFIG_DIR",
  "OPENCODE_CONFIG_CONTENT",
  "OPENCODE_CONFIG",
  "OPENCODE_DB",
  "OPENCODE_HARNESS_WORKSPACE_ROOT",
  "OPENCODE_HARNESS_RUNTIME_ROOT",
  "OPENCODE_HARNESS_TRACE_ROOT",
  "OPENCODE_HARNESS_ROUTING_CATALOG",
  "OPENCODE_HARNESS_ROUTING_PROFILE",
  "OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH",
  "OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE",
];
const SEEDS = [
  ["bootstrap/memory/INDEX.md", "INDEX.md"],
  ["bootstrap/memory/protocols/memory-management.md", "protocols/memory-management.md"],
  ["bootstrap/memory/templates/orchestration-index.md", "templates/orchestration-index.md"],
  ["bootstrap/memory/templates/role-trace-artifact.md", "templates/role-trace-artifact.md"],
];

type JsonObject = Record<string, unknown>;
type FileKind = "file" | "directory";

interface ReadStableFileOptions {
  exactMode?: number | null;
  owners?: readonly bigint[];
  maxBytes?: number;
}

interface StableFile {
  bytes: Buffer;
  stat: BigIntStats;
}

interface RuntimeFileEntry {
  source: string;
  destination: string;
}

interface GeneratedEntry {
  path: string;
  kind: FileKind;
  mode: string;
  recursive: boolean;
  required: boolean;
  content?: "runtime-marker";
}

interface RuntimeManifest {
  schemaVersion: "1.0.0";
  profile: "external-runtime";
  packageVersion: string;
  compatibility: {
    node: string;
    platform: NodeJS.Platform;
  };
  files: RuntimeFileEntry[];
  generatedEntries: GeneratedEntry[];
  fileModes: unknown;
}

function assertRuntimeManifestShape(
  value: JsonObject,
): asserts value is JsonObject & RuntimeManifest {
  if (
    !isJsonObject(value.compatibility) ||
    typeof value.compatibility.node !== "string" ||
    typeof value.compatibility.platform !== "string" ||
    !Array.isArray(value.files) ||
    !value.files.every(
      (entry) =>
        isJsonObject(entry) &&
        typeof entry.source === "string" &&
        typeof entry.destination === "string",
    ) ||
    !Array.isArray(value.generatedEntries) ||
    !value.generatedEntries.every(
      (entry) =>
        isJsonObject(entry) &&
        typeof entry.path === "string" &&
        (entry.kind === "file" || entry.kind === "directory") &&
        typeof entry.mode === "string" &&
        typeof entry.recursive === "boolean" &&
        typeof entry.required === "boolean" &&
        (entry.content === undefined || entry.content === "runtime-marker"),
    )
  )
    fail("unsupported runtime manifest");
}

interface LauncherOptions {
  webPort?: string;
  forward: string[];
  opencodeBin?: string;
  allowProjectPlugins?: boolean;
  workspace?: string;
  traceRoot?: string;
  cacheRoot?: string;
  providerConfig?: string;
  catalog?: string;
  profile?: string;
}

interface ExecutableIdentity {
  dev: bigint;
  ino: bigint;
  size: bigint;
  mtimeNs: bigint;
  digest: string;
}

interface SnapshotInput {
  key: "provider" | "catalog" | "profile";
  name: string;
  bytes: Buffer;
}

interface Snapshot {
  parent: string;
  parentIdentity: BigIntStats;
  directory: string;
  directoryIdentity: BigIntStats;
  paths: Partial<Record<SnapshotInput["key"] | "probeMarker", string>>;
  database: string;
}

function fail(message: string): never {
  throw new Error(`opencode-harness: ${message}`);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorCode(error: unknown): string | undefined {
  return error instanceof Error && "code" in error && typeof error.code === "string"
    ? error.code
    : undefined;
}

function isJsonObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assertJsonObject(value: unknown, label: string): asserts value is JsonObject {
  if (!isJsonObject(value)) fail(`${label} must be an object`);
}

function singleLine(message: string): string {
  return message.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
}

function mode(stat: BigIntStats): number {
  return Number(stat.mode & 0o777n);
}

function hash(bytes: NodeJS.ArrayBufferView): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sameIdentity(before: BigIntStats, after: BigIntStats): boolean {
  return (
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.size === after.size &&
    before.mtimeNs === after.mtimeNs
  );
}

function sameFilesystemIdentity(before: BigIntStats, after: BigIntStats): boolean {
  return (
    sameIdentity(before, after) &&
    before.uid === after.uid &&
    before.mode === after.mode &&
    before.isFile() === after.isFile() &&
    before.isDirectory() === after.isDirectory() &&
    before.isSymbolicLink() === after.isSymbolicLink()
  );
}

function sameDeviceInode(before: BigIntStats, after: BigIntStats): boolean {
  return before.dev === after.dev && before.ino === after.ino;
}

function readStableFile(
  filename: string,
  label: string,
  {
    exactMode = null,
    owners = [BigInt(process.getuid!())],
    maxBytes = MAX_INPUT_BYTES,
  }: ReadStableFileOptions = {},
): StableFile {
  let fd: number;
  try {
    fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    fail(`cannot open ${label} without following its leaf: ${errorMessage(error)}`);
  }
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || !owners.includes(before.uid))
      fail(`${label} must be an allowed-owner regular file`);
    if (exactMode !== null && mode(before) !== exactMode)
      fail(`${label} must have mode ${exactMode.toString(8)}`);
    if ((mode(before) & 0o022) !== 0) fail(`${label} must not be group/world writable`);
    if (before.size > BigInt(maxBytes)) fail(`${label} exceeds ${maxBytes} bytes`);
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd, { bigint: true });
    if (!sameIdentity(before, after) || BigInt(bytes.length) !== before.size)
      fail(`${label} changed while being read`);
    return { bytes, stat: before };
  } finally {
    fs.closeSync(fd);
  }
}

function hashStableFile(
  filename: string,
  label: string,
  { owners = [0n, BigInt(process.getuid!())] }: Pick<ReadStableFileOptions, "owners"> = {},
): string {
  let fd: number;
  try {
    fd = fs.openSync(filename, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  } catch (error) {
    fail(`cannot open ${label} without following its leaf: ${errorMessage(error)}`);
  }
  try {
    const before = fs.fstatSync(fd, { bigint: true });
    if (!before.isFile() || !owners.includes(before.uid) || (mode(before) & 0o022) !== 0)
      fail(`${label} must be a trusted non-writable regular file`);
    const digest = createHash("sha256");
    const buffer = Buffer.allocUnsafe(64 * 1024);
    let total = 0n;
    while (true) {
      const count = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      digest.update(buffer.subarray(0, count));
      total += BigInt(count);
    }
    const after = fs.fstatSync(fd, { bigint: true });
    if (!sameIdentity(before, after) || total !== before.size)
      fail(`${label} changed while being hashed`);
    return digest.digest("hex");
  } finally {
    fs.closeSync(fd);
  }
}

function parseJsonBytes(bytes: Buffer, label: string): unknown {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(`malformed JSON in ${label}: ${errorMessage(error)}`);
  }
}

function readJson(filename: string, label = filename): unknown {
  return parseJsonBytes(
    readStableFile(filename, label, { owners: [0n, BigInt(process.getuid!())] }).bytes,
    label,
  );
}

function assertSafeRelative(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== "string" ||
    value === "" ||
    path.isAbsolute(value) ||
    value.includes("\\") ||
    path.posix.normalize(value) !== value ||
    value.split("/").some((part) => !part || part === "." || part === "..")
  )
    fail(`unsafe ${label}: ${value}`);
}

function assertCanonicalAbsolute(input: string, label: string): string[] {
  if (typeof input !== "string" || !path.isAbsolute(input) || input.includes("\0"))
    fail(`${label} must be an absolute canonical path`);
  if (input !== "/" && (input.endsWith(path.sep) || input.includes(`${path.sep}${path.sep}`)))
    fail(`${label} contains a trailing or duplicate separator`);
  const parts = input.split(path.sep).slice(1);
  if (
    parts.some((part) => !part || part === "." || part === "..") ||
    path.normalize(input) !== input
  )
    fail(`${label} contains dot, dot-dot, or normalization ambiguity`);
  return parts;
}

function trustedDirectoryPath(
  input: string,
  label: string,
  {
    createMissing = false,
    exactFinalMode = null,
  }: {
    createMissing?: boolean;
    exactFinalMode?: number | null;
  } = {},
): string {
  const parts = assertCanonicalAbsolute(input, label);
  let current = path.parse(input).root;
  let parentStat = fs.lstatSync(current, { bigint: true });
  for (let index = 0; index < parts.length; index += 1) {
    const next = path.join(current, parts[index]!);
    let stat: BigIntStats;
    try {
      stat = fs.lstatSync(next, { bigint: true });
    } catch (error) {
      if (errorCode(error) !== "ENOENT" || !createMissing)
        fail(`${label} component is unavailable: ${next}: ${errorMessage(error)}`);
      const stickyParent =
        (mode(parentStat) & 0o022) !== 0 && Number(parentStat.mode & 0o1000n) !== 0;
      if (stickyParent)
        fail(`${label} must use an already-existing private child beneath a sticky directory`);
      if (parentStat.uid !== BigInt(process.getuid!()) || mode(parentStat) !== 0o700)
        fail(`${label} missing suffix requires a current-user mode-0700 parent: ${current}`);
      const before = parentStat;
      try {
        fs.mkdirSync(next, { mode: 0o700 });
      } catch (mkdirError) {
        if (errorCode(mkdirError) !== "EEXIST")
          fail(`${label} cannot create private component ${next}: ${errorMessage(mkdirError)}`);
      }
      const parentAfter = fs.lstatSync(current, { bigint: true });
      if (parentAfter.dev !== before.dev || parentAfter.ino !== before.ino)
        fail(`${label} parent identity changed during creation: ${current}`);
      stat = fs.lstatSync(next, { bigint: true });
    }
    if (!stat.isDirectory() || stat.isSymbolicLink())
      fail(`${label} contains a non-directory or symlink component: ${next}`);
    if (stat.uid !== 0n && stat.uid !== BigInt(process.getuid!()))
      fail(`${label} component has an untrusted owner: ${next}`);
    const bits = mode(stat);
    const sticky = (bits & 0o022) !== 0 && Number(stat.mode & 0o1000n) !== 0 && stat.uid === 0n;
    if ((bits & 0o022) !== 0 && !sticky)
      fail(`${label} component is group/world writable: ${next}`);
    const parentSticky =
      (mode(parentStat) & 0o022) !== 0 && Number(parentStat.mode & 0o1000n) !== 0;
    if (parentSticky && (stat.uid !== BigInt(process.getuid!()) || bits !== 0o700))
      fail(
        `${label} immediate child beneath sticky ancestry must already be current-user mode 0700: ${next}`,
      );
    current = next;
    parentStat = stat;
  }
  if (exactFinalMode !== null && mode(parentStat) !== exactFinalMode)
    fail(
      `${label} has mode ${mode(parentStat).toString(8)}; expected ${exactFinalMode.toString(8)}`,
    );
  return input;
}

function assertTrustedAncestry(input: string, label: string): string {
  return trustedDirectoryPath(input, label);
}

function lstatOwned(
  filename: string,
  label: string,
  expectedType: FileKind,
  expectedMode: number | null = null,
): BigIntStats {
  let stat: BigIntStats;
  try {
    stat = fs.lstatSync(filename, { bigint: true });
  } catch (error) {
    fail(`${label} is unavailable: ${errorMessage(error)}`);
  }
  if (stat.isSymbolicLink()) fail(`${label} must not be a symlink`);
  if (stat.uid !== BigInt(process.getuid!())) fail(`${label} must be owned by the current user`);
  if (expectedType === "directory" && !stat.isDirectory()) fail(`${label} must be a directory`);
  if (expectedType === "file" && !stat.isFile()) fail(`${label} must be a regular file`);
  if (expectedMode !== null && mode(stat) !== expectedMode)
    fail(`${label} has mode ${mode(stat).toString(8)}; expected ${expectedMode.toString(8)}`);
  return stat;
}

function ensurePrivateDirectory(directory: string): string {
  const canonical = trustedDirectoryPath(directory, directory, {
    createMissing: true,
    exactFinalMode: 0o700,
  });
  lstatOwned(canonical, canonical, "directory", 0o700);
  return canonical;
}

function manifest(): RuntimeManifest {
  const value = readJson(MANIFEST_PATH, "runtime manifest");
  assertJsonObject(value, "runtime manifest");
  const expected = [
    "compatibility",
    "fileModes",
    "files",
    "generatedEntries",
    "packageVersion",
    "profile",
    "schemaVersion",
  ];
  if (
    Object.keys(value).sort().join(",") !== expected.sort().join(",") ||
    value.schemaVersion !== "1.0.0" ||
    value.profile !== "external-runtime" ||
    value.packageVersion !== "0.1.12" ||
    !Array.isArray(value.files) ||
    !Array.isArray(value.generatedEntries)
  )
    fail("unsupported runtime manifest");
  if (
    !isJsonObject(value.compatibility) ||
    Object.keys(value.compatibility).sort().join(",") !== "node,platform"
  )
    fail("unsupported runtime compatibility policy");
  const seenGenerated = new Set<string>();
  for (const entry of value.generatedEntries) {
    assertJsonObject(entry, "generated-entry rule");
    const allowed =
      entry.path === ".harness-runtime.json"
        ? ["path", "kind", "mode", "recursive", "required", "content"]
        : ["path", "kind", "mode", "recursive", "required"];
    if (Object.keys(entry).sort().join(",") !== allowed.sort().join(","))
      fail(`generated-entry rule is not closed: ${entry.path}`);
    assertSafeRelative(entry.path, "generated path");
    if (
      seenGenerated.has(entry.path) ||
      typeof entry.kind !== "string" ||
      !["file", "directory"].includes(entry.kind) ||
      typeof entry.mode !== "string" ||
      !/^0[67][0-7][0-7]$/.test(entry.mode) ||
      typeof entry.recursive !== "boolean" ||
      typeof entry.required !== "boolean"
    )
      fail(`invalid generated-entry rule: ${entry.path}`);
    if (entry.recursive !== (entry.path === "node_modules"))
      fail(`only node_modules may be recursive: ${entry.path}`);
    seenGenerated.add(entry.path);
  }
  assertRuntimeManifestShape(value);
  return value;
}

function assertNodeCompatibility(value: RuntimeManifest): void {
  if (process.platform !== value.compatibility.platform)
    fail(`requires ${value.compatibility.platform}`);
  if (Number(process.versions.node.split(".")[0]) !== 24)
    fail(`requires Node ${value.compatibility.node}; found ${process.version}`);
}

function diagnosticVersion(value: string): string {
  // A diagnostic/cache identity, never a release allowlist or semantic-version gate.
  if (!value || value.length > 128 || /[\x00-\x1f\x7f]/.test(value))
    fail(
      "OpenCode --version must return a nonempty single-line diagnostic (at most 128 characters)",
    );
  return value;
}

type ManagedSource = RuntimeFileEntry & { bytes: Buffer };

function loadManagedSources(value: RuntimeManifest): Map<string, ManagedSource> {
  assertTrustedAncestry(PACKAGE_ROOT, "package root");
  const sources = new Map<string, ManagedSource>();
  for (const entry of value.files) {
    if (Object.keys(entry).sort().join(",") !== "destination,source")
      fail("runtime manifest file entries must be closed");
    assertSafeRelative(entry.source, "manifest source");
    assertSafeRelative(entry.destination, "manifest destination");
    if (sources.has(entry.destination)) fail(`duplicate runtime destination: ${entry.destination}`);
    const source = path.join(PACKAGE_ROOT, entry.source);
    const opened = readStableFile(source, `managed source ${entry.source}`, {
      owners: [0n, BigInt(process.getuid!())],
    });
    sources.set(entry.destination, { ...entry, bytes: opened.bytes });
  }
  return sources;
}

function expectedDirectories(sources: ReadonlyMap<string, ManagedSource>): Set<string> {
  const result = new Set<string>();
  for (const destination of sources.keys()) {
    let current = path.posix.dirname(destination);
    while (current !== ".") {
      result.add(current);
      current = path.posix.dirname(current);
    }
  }
  return result;
}

function strictDescendant(root: string, candidate: string): boolean {
  return candidate.startsWith(`${root}${path.sep}`);
}

function assertNoSymlinkComponents(root: string, candidate: string, label: string): void {
  if (!strictDescendant(root, candidate)) fail(`${label} escapes node_modules`);
  let current = root;
  for (const component of path.relative(root, candidate).split(path.sep)) {
    current = path.join(current, component);
    let stat: BigIntStats;
    try {
      stat = fs.lstatSync(current, { bigint: true });
    } catch (error) {
      fail(`${label} is unavailable: ${errorMessage(error)}`);
    }
    if (stat.isSymbolicLink()) fail(`${label} contains a symlinked target component`);
  }
}

interface StableGeneratedJson extends StableFile {
  document: unknown;
  filename: string;
  label: string;
}

interface BinDeclaration {
  linkText: string;
  targetRelative: string;
}

interface GeneratedPackageMetadata {
  binLinks: Map<string, BinDeclaration>;
  nodeModules: string;
  recheck: () => void;
}

function stableGeneratedJson(
  filename: string,
  nodeModules: string,
  label: string,
  exactMode: number | null = null,
): StableGeneratedJson {
  assertNoSymlinkComponents(path.dirname(nodeModules), filename, label);
  const opened = readStableFile(filename, label, { exactMode });
  return {
    document: parseJsonBytes(opened.bytes, label),
    filename,
    label,
    bytes: opened.bytes,
    stat: opened.stat,
  };
}

function recheckStableGeneratedFile(opened: StableGeneratedJson): void {
  let after: BigIntStats;
  try {
    after = fs.lstatSync(opened.filename, { bigint: true });
  } catch (error) {
    fail(`${opened.label} disappeared after validation: ${errorMessage(error)}`);
  }
  if (!sameFilesystemIdentity(opened.stat, after)) fail(`${opened.label} changed after validation`);
}

function safeBinName(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value);
}

function generatedPackageMetadata(root: string): GeneratedPackageMetadata | null {
  const packageFilename = path.join(root, "package.json");
  const lockFilename = path.join(root, "package-lock.json");
  const nodeModules = path.join(root, "node_modules");
  let nodeModulesStat = null;
  try {
    nodeModulesStat = fs.lstatSync(nodeModules, { bigint: true });
  } catch (error) {
    if (errorCode(error) !== "ENOENT")
      fail(`generated runtime directory node_modules is unavailable: ${errorMessage(error)}`);
  }
  if (nodeModulesStat) {
    if (nodeModulesStat.isSymbolicLink())
      fail("generated runtime directory node_modules must not be a symlink");
    if (
      !nodeModulesStat.isDirectory() ||
      nodeModulesStat.uid !== BigInt(process.getuid!()) ||
      mode(nodeModulesStat) !== 0o700
    )
      fail(
        "generated runtime directory node_modules must be a current-user-owned mode-0700 directory",
      );
  }
  const present = [
    fs.existsSync(packageFilename),
    fs.existsSync(lockFilename),
    Boolean(nodeModulesStat),
  ];
  if (!present.some(Boolean)) return null;
  if (!present.every(Boolean))
    fail("generated package.json, package-lock.json, and node_modules must be present together");

  const stableFiles: StableGeneratedJson[] = [];
  const packageOpened = stableGeneratedJson(
    packageFilename,
    nodeModules,
    "generated package.json",
    0o600,
  );
  stableFiles.push(packageOpened);
  const lockOpened = stableGeneratedJson(
    lockFilename,
    nodeModules,
    "generated package-lock.json",
    0o600,
  );
  stableFiles.push(lockOpened);
  const packageDocument = packageOpened.document;
  const lockDocument = lockOpened.document;
  assertJsonObject(packageDocument, "generated package.json");
  assertJsonObject(lockDocument, "generated package-lock.json");
  const dependencies = packageDocument.dependencies;
  if (
    !isJsonObject(dependencies) ||
    Object.keys(dependencies).join(",") !== "@opencode-ai/plugin" ||
    typeof dependencies["@opencode-ai/plugin"] !== "string"
  )
    fail("generated package.json must have the sole exact @opencode-ai/plugin dependency");
  const pluginVersion = dependencies["@opencode-ai/plugin"];
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(pluginVersion))
    fail("generated plugin dependency must be an exact package version");
  const exactDependency = { "@opencode-ai/plugin": pluginVersion };
  if (JSON.stringify(packageDocument.dependencies) !== JSON.stringify(exactDependency))
    fail(
      `generated package.json must have the sole exact @opencode-ai/plugin ${pluginVersion} dependency`,
    );
  for (const key of [
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
    "bundledDependencies",
    "bundleDependencies",
  ]) {
    if (Object.hasOwn(packageDocument, key))
      fail(`generated package.json alternate direct dependency section is forbidden: ${key}`);
  }
  if (lockDocument.lockfileVersion !== 3 || !isJsonObject(lockDocument.packages))
    fail("generated package-lock.json must be a lockfileVersion 3 packages object");
  const lockPackages = lockDocument.packages;
  const lockRoot = lockPackages[""];
  if (
    !isJsonObject(lockRoot) ||
    JSON.stringify(lockRoot.dependencies) !== JSON.stringify(exactDependency)
  )
    fail("generated package-lock root dependency does not match package.json");
  const pluginLock = lockPackages["node_modules/@opencode-ai/plugin"];
  if (!isJsonObject(pluginLock) || pluginLock.version !== pluginVersion)
    fail(`generated package-lock must contain @opencode-ai/plugin ${pluginVersion}`);
  for (const [location, entry] of Object.entries(lockPackages)) {
    if (location.startsWith("node_modules/") && isJsonObject(entry) && entry.link === true)
      fail(`generated package-lock link entry is forbidden: ${location}`);
  }

  const binLinks = new Map<string, BinDeclaration>();

  function inspectInstalledPackage(packageRelative: string): void {
    const packageDirectory = path.join(nodeModules, ...packageRelative.split("/"));
    assertNoSymlinkComponents(
      nodeModules,
      packageDirectory,
      `installed package ${packageRelative}`,
    );
    const stat = fs.lstatSync(packageDirectory, { bigint: true });
    if (!stat.isDirectory() || stat.uid !== BigInt(process.getuid!()) || mode(stat) !== 0o700)
      fail(`installed package directory is unsafe: ${packageRelative}`);
    const manifestFilename = path.join(packageDirectory, "package.json");
    const opened = stableGeneratedJson(
      manifestFilename,
      nodeModules,
      `installed package manifest ${packageRelative}`,
    );
    stableFiles.push(opened);
    const document = opened.document;
    const lockEntry = lockPackages[`node_modules/${packageRelative}`];
    assertJsonObject(document, `installed package manifest ${packageRelative}`);
    if (
      document.name !== packageRelative ||
      typeof document.version !== "string" ||
      !isJsonObject(lockEntry) ||
      lockEntry.link === true ||
      lockEntry.version !== document.version
    )
      fail(`installed package metadata/lock mismatch: ${packageRelative}`);
    let declarations: [string, unknown][] = [];
    if (typeof document.bin === "string")
      declarations = [[packageRelative.split("/").at(-1) ?? "", document.bin]];
    else if (document.bin !== undefined) {
      if (!document.bin || typeof document.bin !== "object" || Array.isArray(document.bin))
        fail(`installed package bin metadata is malformed: ${packageRelative}`);
      declarations = Object.entries(document.bin);
    }
    for (const [name, rawTarget] of declarations) {
      if (!safeBinName(name) || typeof rawTarget !== "string")
        fail(`installed package bin declaration is unsafe: ${packageRelative}`);
      const target = rawTarget.startsWith("./") ? rawTarget.slice(2) : rawTarget;
      assertSafeRelative(target, `installed package bin target for ${packageRelative}`);
      const targetRelative = path.posix.join(packageRelative, target);
      const linkText = path.posix.relative(".bin", targetRelative);
      if (binLinks.has(name)) fail(`conflicting installed package bin provider: ${name}`);
      binLinks.set(name, { linkText, targetRelative });
    }
  }

  for (const name of fs.readdirSync(nodeModules).sort()) {
    if (name === ".bin" || name.startsWith(".")) continue;
    const candidate = path.join(nodeModules, name);
    const stat = fs.lstatSync(candidate, { bigint: true });
    if (!stat.isDirectory() || stat.isSymbolicLink()) continue;
    if (name.startsWith("@")) {
      if (!/^@[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name))
        fail(`unsafe installed package scope: ${name}`);
      for (const child of fs.readdirSync(candidate).sort())
        inspectInstalledPackage(`${name}/${child}`);
    } else inspectInstalledPackage(name);
  }
  return {
    binLinks,
    nodeModules,
    recheck: () => {
      const nodeModulesAfter = fs.lstatSync(nodeModules, { bigint: true });
      if (!nodeModulesStat || !sameFilesystemIdentity(nodeModulesStat, nodeModulesAfter))
        fail("generated runtime directory node_modules changed after validation");
      stableFiles.forEach(recheckStableGeneratedFile);
    },
  };
}

function verifyGeneratedBinLink(
  root: string,
  relative: string,
  child: string,
  stat: BigIntStats,
  metadata: GeneratedPackageMetadata | null,
): void {
  const expectedPrefix = "node_modules/.bin/";
  const name = relative.startsWith(expectedPrefix) ? relative.slice(expectedPrefix.length) : "";
  if (!metadata || !safeBinName(name) || name.includes("/"))
    fail(`unsafe recursive generated symlink: ${relative}`);
  if (stat.uid !== BigInt(process.getuid!()))
    fail(`generated bin link must be owned by the current user: ${relative}`);
  const linkText = fs.readlinkSync(child);
  if (!linkText || path.isAbsolute(linkText) || linkText.includes("\\") || linkText.includes("\0"))
    fail(`generated bin link must have a nonempty relative target: ${relative}`);
  const lexicalTarget = path.resolve(path.dirname(child), linkText);
  if (!strictDescendant(metadata.nodeModules, lexicalTarget))
    fail(`generated bin link target escapes node_modules: ${relative}`);
  assertNoSymlinkComponents(
    metadata.nodeModules,
    lexicalTarget,
    `generated bin link target ${relative}`,
  );
  let resolvedTarget;
  try {
    resolvedTarget = fs.realpathSync(lexicalTarget);
  } catch (error) {
    fail(`generated bin link target is unavailable: ${relative}: ${errorMessage(error)}`);
  }
  if (!strictDescendant(metadata.nodeModules, resolvedTarget) || resolvedTarget !== lexicalTarget)
    fail(`generated bin link resolved target is unsafe: ${relative}`);
  const targetBefore = fs.lstatSync(lexicalTarget, { bigint: true });
  if (
    !targetBefore.isFile() ||
    targetBefore.isSymbolicLink() ||
    targetBefore.uid !== BigInt(process.getuid!()) ||
    (mode(targetBefore) & 0o022) !== 0
  )
    fail(
      `generated bin link target must be an owner-controlled non-writable regular file: ${relative}`,
    );
  const expected = metadata.binLinks.get(name);
  const targetRelative = path
    .relative(metadata.nodeModules, lexicalTarget)
    .split(path.sep)
    .join("/");
  if (!expected || linkText !== expected.linkText || targetRelative !== expected.targetRelative)
    fail(`generated bin link does not match installed package metadata: ${relative}`);
  const targetAfter = fs.lstatSync(lexicalTarget, { bigint: true });
  const linkAfter = fs.lstatSync(child, { bigint: true });
  if (
    !sameFilesystemIdentity(targetBefore, targetAfter) ||
    !sameFilesystemIdentity(stat, linkAfter) ||
    fs.readlinkSync(child) !== linkText ||
    fs.realpathSync(lexicalTarget) !== resolvedTarget
  )
    fail(`generated bin link or target changed during validation: ${relative}`);
}

function verifyRecursiveGenerated(
  root: string,
  relative: string,
  metadata: GeneratedPackageMetadata | null,
): void {
  const directory = path.join(root, relative);
  lstatOwned(directory, `generated runtime directory ${relative}`, "directory", 0o700);
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const childRelative = path.posix.join(relative, entry.name);
    const child = path.join(root, childRelative);
    const stat = fs.lstatSync(child, { bigint: true });
    if (stat.isSymbolicLink()) {
      verifyGeneratedBinLink(root, childRelative, child, stat, metadata);
      continue;
    }
    if (stat.uid !== BigInt(process.getuid!()) || (mode(stat) & 0o077) !== 0)
      fail(`unsafe recursive generated entry: ${childRelative}`);
    if (stat.isDirectory()) verifyRecursiveGenerated(root, childRelative, metadata);
    else if (!stat.isFile()) fail(`unsupported recursive generated entry type: ${childRelative}`);
  }
}

function verifyRuntime(
  runtimeRoot: string,
  value: RuntimeManifest,
  opencodeVersion: string,
  sources = loadManagedSources(value),
): string {
  lstatOwned(runtimeRoot, "runtime root", "directory", 0o700);
  const root = runtimeRoot;
  const directories = expectedDirectories(sources);
  const generated = new Map<string, GeneratedEntry>(
    value.generatedEntries.map((entry) => {
      assertSafeRelative(entry.path, "generated path");
      return [entry.path, entry];
    }),
  );
  const packageMetadata = generatedPackageMetadata(root);

  function walk(relative = "") {
    const directory = relative ? path.join(root, relative) : root;
    if (relative) lstatOwned(directory, `runtime directory ${relative}`, "directory", 0o700);
    for (const name of fs.readdirSync(directory)) {
      const childRelative = relative ? path.posix.join(relative, name) : name;
      const child = path.join(root, childRelative);
      if (sources.has(childRelative)) {
        lstatOwned(child, `managed runtime file ${childRelative}`, "file", 0o644);
        const bytes = readStableFile(child, `managed runtime file ${childRelative}`, {
          exactMode: 0o644,
        }).bytes;
        if (hash(bytes) !== hash(sources.get(childRelative)!.bytes))
          fail(`managed runtime drift: ${childRelative}`);
      } else if (directories.has(childRelative)) {
        walk(childRelative);
      } else if (generated.has(childRelative)) {
        const rule = generated.get(childRelative)!;
        if (rule.kind === "directory" && rule.recursive === true)
          verifyRecursiveGenerated(root, childRelative, packageMetadata);
        else {
          lstatOwned(
            child,
            `generated runtime file ${childRelative}`,
            "file",
            Number.parseInt(rule.mode, 8),
          );
          if (rule.content === "runtime-marker") {
            const marker = parseJsonBytes(
              readStableFile(child, "runtime marker", { exactMode: Number.parseInt(rule.mode, 8) })
                .bytes,
              "runtime marker",
            );
            assertJsonObject(marker, "runtime marker");
            if (
              Object.keys(marker).sort().join(",") !== "opencodeVersion,packageVersion" ||
              marker.packageVersion !== value.packageVersion ||
              marker.opencodeVersion !== opencodeVersion
            )
              fail("runtime marker content mismatch");
          }
        }
      } else fail(`undeclared runtime entry: ${childRelative}`);
    }
  }

  walk();
  for (const destination of sources.keys())
    if (!fs.existsSync(path.join(root, destination)))
      fail(`missing managed runtime file: ${destination}`);
  for (const directory of directories)
    if (!fs.existsSync(path.join(root, directory))) fail(`missing runtime directory: ${directory}`);
  for (const rule of value.generatedEntries.filter((entry) => entry.required))
    if (!fs.existsSync(path.join(root, rule.path)))
      fail(`missing required generated entry: ${rule.path}`);
  packageMetadata?.recheck();
  return root;
}

function cacheRootFrom(options: LauncherOptions): string {
  if (options.cacheRoot) {
    if (!path.isAbsolute(options.cacheRoot)) fail("--cache-root must be absolute");
    assertCanonicalAbsolute(options.cacheRoot, "--cache-root");
    return options.cacheRoot;
  }
  const base = process.env.XDG_CACHE_HOME ?? path.join(os.homedir(), ".cache");
  assertCanonicalAbsolute(base, "cache base");
  return path.join(base, "opencode-harness");
}

function runtimePath(
  value: RuntimeManifest,
  options: LauncherOptions,
  opencodeVersion: string,
): string {
  return path.join(
    cacheRootFrom(options),
    value.packageVersion,
    `opencode-${encodeURIComponent(opencodeVersion)}`,
    "runtime",
  );
}

export function prepareRuntime(
  options: LauncherOptions = { forward: [] },
  selectedVersion: string | null = null,
): string {
  const value = manifest();
  assertNodeCompatibility(value);
  let selection = null;
  if (selectedVersion === null) {
    selection = resolveCompatibleExecutable(options.opencodeBin);
    selectedVersion = selection.version;
  } else diagnosticVersion(selectedVersion);
  const sources = loadManagedSources(value);
  const parent = ensurePrivateDirectory(path.dirname(runtimePath(value, options, selectedVersion)));
  const runtime = path.join(parent, "runtime");
  if (fs.existsSync(runtime)) {
    const verified = verifyRuntime(runtime, value, selectedVersion, sources);
    if (selection)
      recheckExecutable(selection.executable, selection.identity, "runtime verification");
    return verified;
  }
  const temporary = path.join(parent, `.prepare-${process.pid}-${randomBytes(8).toString("hex")}`);
  fs.mkdirSync(temporary, { mode: 0o700 });
  try {
    for (const source of sources.values()) {
      const target = path.join(temporary, source.destination);
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      fs.writeFileSync(target, source.bytes, { flag: "wx", mode: 0o644 });
      fs.chmodSync(target, 0o644);
    }
    fs.writeFileSync(
      path.join(temporary, ".harness-runtime.json"),
      `${JSON.stringify({ packageVersion: value.packageVersion, opencodeVersion: selectedVersion })}\n`,
      { flag: "wx", mode: 0o644 },
    );
    fs.chmodSync(path.join(temporary, ".harness-runtime.json"), 0o644);
    for (const relative of fs.readdirSync(temporary, { recursive: true, encoding: "utf8" })) {
      const candidate = path.join(temporary, relative);
      if (fs.lstatSync(candidate).isFile()) {
        const fd = fs.openSync(candidate, "r");
        fs.fsyncSync(fd);
        fs.closeSync(fd);
      }
    }
    const fd = fs.openSync(temporary, fs.constants.O_RDONLY | fs.constants.O_DIRECTORY);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    try {
      fs.renameSync(temporary, runtime);
    } catch (error) {
      if (errorCode(error) !== "EEXIST" && errorCode(error) !== "ENOTEMPTY") throw error;
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  const verified = verifyRuntime(runtime, value, selectedVersion, sources);
  if (selection) recheckExecutable(selection.executable, selection.identity, "runtime preparation");
  return verified;
}

function git(workspace: string, args: string[], allowFailure = false): SpawnSyncReturns<string> {
  const result = spawnSync("git", ["-C", workspace, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (!allowFailure && result.status !== 0)
    fail(`Git preflight failed: ${(result.stderr || result.stdout).trim()}`);
  return result;
}

function canonicalWorkspace(input: string): string {
  if (!input || !path.isAbsolute(input)) fail("--workspace must be an absolute path");
  const workspace = trustedDirectoryPath(input, "workspace");
  lstatOwned(workspace, "workspace", "directory");
  const top = git(workspace, ["rev-parse", "--show-toplevel"]).stdout.trim();
  if (top !== workspace)
    fail("--workspace must name the canonical Git worktree root (not a nested directory)");
  return workspace;
}

function workspaceFromRunOption(input: string | undefined): string {
  if (input !== undefined) return canonicalWorkspace(input);
  const start = trustedDirectoryPath(process.cwd(), "current directory");
  lstatOwned(start, "current directory", "directory");
  const top = git(start, ["rev-parse", "--show-toplevel"]).stdout.trim();
  return canonicalWorkspace(top);
}

function stripJsonComments(input: string, label: string): string {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
      output += char;
    } else if (char === "/" && next === "/") {
      output += "  ";
      index += 1;
      while (index + 1 < input.length && input[index + 1] !== "\n") {
        output += " ";
        index += 1;
      }
    } else if (char === "/" && next === "*") {
      output += "  ";
      index += 1;
      let closed = false;
      while (index + 1 < input.length) {
        index += 1;
        if (input[index] === "*" && input[index + 1] === "/") {
          output += "  ";
          index += 1;
          closed = true;
          break;
        }
        output += input[index] === "\n" ? "\n" : " ";
      }
      if (!closed) fail(`unterminated block comment in ${label}`);
    } else output += char;
  }
  if (inString) fail(`unterminated string in ${label}`);
  return output;
}

function stripTrailingCommas(input: string): string {
  let output = "";
  let inString = false;
  let escaped = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (inString) {
      output += char;
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      output += char;
      continue;
    }
    if (char === ",") {
      let lookahead = index + 1;
      while (/\s/.test(input[lookahead] ?? "")) lookahead += 1;
      if (input[lookahead] === "}" || input[lookahead] === "]") continue;
    }
    output += char;
  }
  return output;
}

function readProjectConfig(filename: string, label: string): unknown {
  const opened = readStableFile(filename, label, { maxBytes: MAX_INPUT_BYTES });
  const text = opened.bytes.toString("utf8");
  try {
    return JSON.parse(
      filename.endsWith(".jsonc") ? stripTrailingCommas(stripJsonComments(text, label)) : text,
    );
  } catch (error) {
    fail(`cannot safely parse ${label}: ${errorMessage(error)}`);
  }
}

function containsHarnessPlugin(value: unknown): boolean {
  const spec = Array.isArray(value) ? value[0] : value;
  return (
    typeof spec === "string" &&
    /(opencode-harness|harness-lifecycle|role-model-routing-enforcement)/i.test(spec)
  );
}

function inspectTrustedTree(
  root: string,
  label: string,
  { rejectDelegationSkill = false }: { rejectDelegationSkill?: boolean } = {},
): string {
  const canonical = trustedDirectoryPath(root, label);

  function walk(directory: string): void {
    for (const name of fs.readdirSync(directory)) {
      const candidate = path.join(directory, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (
        stat.isSymbolicLink() ||
        (stat.uid !== 0n && stat.uid !== BigInt(process.getuid!())) ||
        (mode(stat) & 0o022) !== 0
      )
        fail(`${label} contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) walk(candidate);
      else if (!stat.isFile()) fail(`${label} contains an unsupported entry: ${candidate}`);
    }
  }

  walk(canonical);
  if (rejectDelegationSkill) {
    const pending = [canonical];
    while (pending.length) {
      const directory = pending.pop()!;
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory()) pending.push(candidate);
        if (
          entry.isFile() &&
          entry.name === "SKILL.md" &&
          path.basename(path.dirname(candidate)) === "delegation-orchestrator"
        )
          fail(`${label} contains delegation-orchestrator/SKILL.md`);
      }
    }
  }
  return canonical;
}

function inspectConfigDocument(
  document: unknown,
  label: string,
  allowProjectPlugins: boolean,
  providerSupplied: boolean,
  customSkillRoots: string[],
): void {
  if (!isJsonObject(document)) fail(`${label} must contain an object`);
  for (const role of ROLES)
    if (isJsonObject(document.agent) && Object.hasOwn(document.agent, role))
      fail(`${label} has colliding agent key: ${role}`);
  for (const command of COMMANDS)
    if (
      (isJsonObject(document.command) && Object.hasOwn(document.command, command)) ||
      (isJsonObject(document.command) && Object.hasOwn(document.command, `/${command}`))
    )
      fail(`${label} has colliding command key: ${command}`);
  const skillPaths = isJsonObject(document.skills) ? (document.skills.paths ?? []) : [];
  if (!Array.isArray(skillPaths)) fail(`${label}.skills.paths must be an array`);
  for (const skillPath of skillPaths) {
    if (typeof skillPath !== "string" || !path.isAbsolute(skillPath))
      fail(`${label} custom skill paths must be absolute`);
    const root = inspectTrustedTree(skillPath, `${label} custom skill root`, {
      rejectDelegationSkill: true,
    });
    customSkillRoots.push(root);
  }
  if (Object.hasOwn(document, "plugin")) {
    if (!Array.isArray(document.plugin)) fail(`${label}.plugin must be an array`);
    if (document.plugin.some(containsHarnessPlugin))
      fail(`${label} declares a harness plugin collision`);
    if (document.plugin.length > 0 && !allowProjectPlugins)
      fail(
        `${label} plugin declarations require --allow-project-plugins (same-user code execution risk)`,
      );
  }
  if (providerSupplied && Object.hasOwn(document, "provider"))
    fail(`${label} declares provider and collides with --provider-config`);
}

function recursivePluginFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  const root = trustedDirectoryPath(directory, "project plugin directory");
  const found: string[] = [];

  function walk(current: string): void {
    for (const name of fs.readdirSync(current)) {
      const candidate = path.join(current, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (
        stat.isSymbolicLink() ||
        (stat.uid !== 0n && stat.uid !== BigInt(process.getuid!())) ||
        (mode(stat) & 0o022) !== 0
      )
        fail(`project plugin path contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) walk(candidate);
      else if (stat.isFile() && /\.[cm]?[jt]s$/.test(name)) found.push(candidate);
    }
  }

  walk(root);
  return found;
}

interface ProjectState {
  fingerprint: string;
  customSkillRoots: string[];
}

function projectPreflight(
  workspace: string,
  allowProjectPlugins: boolean,
  providerSupplied: boolean,
): ProjectState {
  const project = path.join(workspace, ".opencode");
  const customSkillRoots: string[] = [];
  if (fs.existsSync(project)) {
    trustedDirectoryPath(project, "project .opencode");
    for (const relative of [
      "routing/harness-model-routing.json",
      "routing/harness-model-routing.example.json",
    ])
      if (fs.existsSync(path.join(project, relative)))
        fail(`project harness routing shadow is forbidden: .opencode/${relative}`);
    for (const directory of ["skills", "skill"])
      if (fs.existsSync(path.join(project, directory, "delegation-orchestrator")))
        fail(`project skill collision: .opencode/${directory}/delegation-orchestrator`);
    const collisionGroups: readonly (readonly [string, readonly string[]])[] = [
      ["agents", ROLES],
      ["agent", ROLES],
      ["commands", COMMANDS],
      ["command", COMMANDS],
    ];
    for (const [directory, names] of collisionGroups)
      for (const name of names)
        if (fs.existsSync(path.join(project, directory, `${name}.md`)))
          fail(`project collision: .opencode/${directory}/${name}.md`);
    const plugins = ["plugins", "plugin"].flatMap((directory) =>
      recursivePluginFiles(path.join(project, directory)),
    );
    if (
      plugins.some((filename) =>
        /(harness-lifecycle|role-model-routing-enforcement)/i.test(path.basename(filename)),
      )
    )
      fail("project filesystem declares a harness plugin collision");
    if (plugins.length > 0 && !allowProjectPlugins)
      fail("project local plugins require --allow-project-plugins (same-user code execution risk)");
  }
  for (const filename of [
    path.join(workspace, "opencode.json"),
    path.join(workspace, "opencode.jsonc"),
    path.join(project, "opencode.json"),
    path.join(project, "opencode.jsonc"),
  ]) {
    if (!fs.existsSync(filename)) continue;
    inspectConfigDocument(
      readProjectConfig(filename, path.relative(workspace, filename)),
      path.relative(workspace, filename),
      allowProjectPlugins,
      providerSupplied,
      customSkillRoots,
    );
  }
  return { fingerprint: projectSecurityFingerprint(workspace, customSkillRoots), customSkillRoots };
}

function projectSecurityFingerprint(workspace: string, customSkillRoots: string[]): string {
  const roots = [
    path.join(workspace, "opencode.json"),
    path.join(workspace, "opencode.jsonc"),
    path.join(workspace, ".opencode/opencode.json"),
    path.join(workspace, ".opencode/opencode.jsonc"),
    ...[
      "agents",
      "agent",
      "commands",
      "command",
      "skills",
      "skill",
      "plugins",
      "plugin",
      "routing",
    ].map((name) => path.join(workspace, ".opencode", name)),
    ...customSkillRoots,
  ];
  const records: string[] = [];

  function record(candidate: string): void {
    if (!fs.existsSync(candidate)) {
      records.push(`missing:${candidate}`);
      return;
    }
    const stat = fs.lstatSync(candidate, { bigint: true });
    if (
      stat.isSymbolicLink() ||
      (stat.uid !== 0n && stat.uid !== BigInt(process.getuid!())) ||
      (mode(stat) & 0o022) !== 0
    )
      fail(`project security surface is unsafe: ${candidate}`);
    if (stat.isDirectory()) {
      records.push(`dir:${candidate}:${stat.dev}:${stat.ino}:${mode(stat)}`);
      for (const name of fs.readdirSync(candidate).sort()) record(path.join(candidate, name));
    } else if (stat.isFile()) {
      const digest = hashStableFile(candidate, `project security file ${candidate}`);
      records.push(`file:${candidate}:${stat.dev}:${stat.ino}:${mode(stat)}:${digest}`);
    } else fail(`project security surface has unsupported entry: ${candidate}`);
  }

  for (const root of roots) record(root);
  return hash(Buffer.from([...new Set(records)].sort().join("\n")));
}

function inspectPrivateTree(root: string, label: string): string {
  lstatOwned(root, label, "directory", 0o700);

  function walk(directory: string): void {
    for (const name of fs.readdirSync(directory)) {
      const candidate = path.join(directory, name);
      const stat = fs.lstatSync(candidate, { bigint: true });
      if (stat.isSymbolicLink() || stat.uid !== BigInt(process.getuid!()))
        fail(`${label} contains an unsafe entry: ${candidate}`);
      if (stat.isDirectory()) {
        if (mode(stat) !== 0o700) fail(`${label} directory must be mode 0700: ${candidate}`);
        walk(candidate);
      } else if (stat.isFile()) {
        if (mode(stat) !== 0o600) fail(`${label} file must be mode 0600: ${candidate}`);
      } else fail(`${label} contains an unsupported entry: ${candidate}`);
    }
  }

  walk(root);
  return root;
}

function seedTraceRoot(traceRoot: string, runtimeRoot: string): string {
  for (const [sourceRelative, targetRelative] of SEEDS) {
    if (sourceRelative === undefined || targetRelative === undefined) fail("invalid trace seed");
    const source = readStableFile(
      path.join(runtimeRoot, sourceRelative),
      `runtime trace seed ${sourceRelative}`,
      { exactMode: 0o644 },
    ).bytes;
    const target = path.join(traceRoot, targetRelative);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    if (fs.existsSync(target)) {
      const existing = readStableFile(target, `trace seed ${targetRelative}`, {
        exactMode: 0o600,
      }).bytes;
      // Seeds become user-owned coordination state after creation. Preserve them
      // across upgrades, repeated launches and rollbacks, including local edits.
      if (hash(existing) !== hash(source))
        process.stderr.write(
          `opencode-harness: preserving existing trace seed ${targetRelative}; bundled template differs\n`,
        );
    } else fs.writeFileSync(target, source, { flag: "wx", mode: 0o600 });
  }
  return inspectPrivateTree(traceRoot, "trace root");
}

function chooseTraceRoot(
  workspace: string,
  explicit: string | undefined,
  runtimeRoot: string,
): string {
  if (explicit) {
    if (!path.isAbsolute(explicit)) fail("--trace-root must be absolute");
    const root = ensurePrivateDirectory(explicit);
    inspectPrivateTree(root, "explicit trace root");
    return seedTraceRoot(root, runtimeRoot);
  }
  const projectMemory = path.join(workspace, ".memory");
  const ignored =
    git(workspace, ["check-ignore", "-q", "--no-index", ".memory/"], true).status === 0;
  if (ignored) {
    let safeProjectRoot = null;
    try {
      if (!fs.existsSync(projectMemory)) ensurePrivateDirectory(projectMemory);
      assertTrustedAncestry(projectMemory, "workspace trace root");
      inspectPrivateTree(projectMemory, "workspace trace root");
      safeProjectRoot = projectMemory;
    } catch {
      /* Unsafe ignored project memory falls back to XDG state without repair. */
    }
    if (safeProjectRoot) return seedTraceRoot(safeProjectRoot, runtimeRoot);
  }
  const state = process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local/state");
  assertCanonicalAbsolute(state, "state base");
  const key = createHash("sha256").update(workspace).digest("hex");
  const root = ensurePrivateDirectory(
    path.join(state, "opencode-harness/workspaces", key, ".memory"),
  );
  inspectPrivateTree(root, "XDG trace root");
  return seedTraceRoot(root, runtimeRoot);
}

interface ExternalFile {
  resolved: string;
  bytes: Buffer;
  document: unknown;
}

function inspectExternalFile(input: string, label: string): ExternalFile {
  if (!input || !path.isAbsolute(input)) fail(`${label} must be an absolute path`);
  let supplied: BigIntStats;
  try {
    supplied = fs.lstatSync(input, { bigint: true });
  } catch (error) {
    fail(`${label} is unavailable: ${errorMessage(error)}`);
  }
  if (supplied.isSymbolicLink()) fail(`${label} must not be a symlink`);
  const resolved = fs.realpathSync(input);
  assertTrustedAncestry(path.dirname(resolved), `${label} parent`);
  const opened = readStableFile(resolved, label, { exactMode: 0o600 });
  return { resolved, bytes: opened.bytes, document: parseJsonBytes(opened.bytes, label) };
}

function exactKeys(
  value: unknown,
  allowed: readonly string[],
  required: readonly string[],
  label: string,
): asserts value is JsonObject {
  if (!isJsonObject(value)) fail(`${label} must be an object`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) fail(`${label}.${key} is forbidden`);
  for (const key of required) if (!Object.hasOwn(value, key)) fail(`${label}.${key} is required`);
}

function canonicalLoopbackUrl(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^http:\/\/127\.0\.0\.1:[0-9]+\/v1$/.test(value))
    fail(`${label} must be canonical http://127.0.0.1:<port>/v1`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a URL`);
  }
  const port = Number(parsed.port);
  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  )
    fail(`${label} has an invalid port or credential component`);
  return value;
}

interface ProjectedModel {
  name: string;
  limit: { context: number; output: number };
  options: { chat_template_kwargs: { enable_thinking: boolean } };
}
interface ProjectedProvider {
  npm: string;
  name: string;
  options: { baseURL: string };
  models: Record<string, ProjectedModel>;
}
interface ProviderProjection {
  $schema: string;
  provider: Record<string, ProjectedProvider>;
}
interface CatalogEntry {
  model: string;
  routingServiceUrl: string;
  maxInFlight: number;
}
interface RoutingCatalog {
  schemaVersion: string;
  models: Record<string, CatalogEntry>;
}

function validateProviderProjection(document: unknown): ProviderProjection {
  exactKeys(document, ["$schema", "provider"], ["$schema", "provider"], "provider config");
  if (document.$schema !== "https://opencode.ai/config.json")
    fail("provider config.$schema is invalid");
  assertJsonObject(document.provider, "provider config.provider");
  exactKeys(document.provider, Object.keys(document.provider), [], "provider config.provider");
  if (Object.keys(document.provider).length === 0)
    fail("provider config.provider must not be empty");
  const projectedProviders: Record<string, ProjectedProvider> = {};
  for (const [providerId, provider] of Object.entries(document.provider)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(providerId))
      fail(`provider config provider id is invalid: ${providerId}`);
    exactKeys(
      provider,
      ["npm", "name", "options", "models"],
      ["npm", "name", "options", "models"],
      `provider config.provider.${providerId}`,
    );
    if (
      provider.npm !== "@ai-sdk/openai-compatible" ||
      typeof provider.name !== "string" ||
      provider.name.length < 1 ||
      provider.name.length > 128
    )
      fail(`provider config.provider.${providerId} has invalid adapter or name`);
    exactKeys(
      provider.options,
      ["baseURL"],
      ["baseURL"],
      `provider config.provider.${providerId}.options`,
    );
    const baseURL = canonicalLoopbackUrl(
      provider.options.baseURL,
      `provider config.provider.${providerId}.options.baseURL`,
    );
    assertJsonObject(provider.models, `provider config.provider.${providerId}.models`);
    exactKeys(
      provider.models,
      Object.keys(provider.models),
      [],
      `provider config.provider.${providerId}.models`,
    );
    const models = Object.entries(provider.models);
    if (models.length !== 1)
      fail(`provider config.provider.${providerId}.models must contain exactly one model`);
    const [modelId, model] = models[0]!;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(modelId))
      fail(`provider config model id is invalid: ${modelId}`);
    exactKeys(
      model,
      ["name", "limit", "options"],
      ["name", "limit", "options"],
      `provider config.provider.${providerId}.models.${modelId}`,
    );
    if (model.name !== modelId) fail(`provider config model key/name mismatch: ${modelId}`);
    exactKeys(
      model.limit,
      ["context", "output"],
      ["context", "output"],
      `provider config.provider.${providerId}.models.${modelId}.limit`,
    );
    const { context, output } = model.limit;
    if (
      typeof context !== "number" ||
      !Number.isInteger(context) ||
      context < 1 ||
      context > 2147483647
    )
      fail(`provider config model context limit is out of range: ${modelId}`);
    if (
      typeof output !== "number" ||
      !Number.isInteger(output) ||
      output < 1 ||
      output > 2147483647
    )
      fail(`provider config model output limit is out of range: ${modelId}`);
    if (output >= context)
      fail(`provider config model output limit must be less than context: ${modelId}`);
    exactKeys(
      model.options,
      ["chat_template_kwargs"],
      ["chat_template_kwargs"],
      `provider config.provider.${providerId}.models.${modelId}.options`,
    );
    exactKeys(
      model.options.chat_template_kwargs,
      ["enable_thinking"],
      ["enable_thinking"],
      `provider config.provider.${providerId}.models.${modelId}.options.chat_template_kwargs`,
    );
    if (typeof model.options.chat_template_kwargs.enable_thinking !== "boolean")
      fail(`provider config model enable_thinking must be a boolean: ${modelId}`);
    projectedProviders[providerId] = {
      npm: provider.npm,
      name: provider.name,
      options: { baseURL },
      models: {
        [modelId]: {
          name: modelId,
          limit: { context, output },
          options: {
            chat_template_kwargs: {
              enable_thinking: model.options.chat_template_kwargs.enable_thinking,
            },
          },
        },
      },
    };
  }
  return {
    $schema: document.$schema,
    provider: projectedProviders,
  };
}

function validateCatalog(document: unknown): RoutingCatalog {
  exactKeys(document, ["schemaVersion", "models"], ["schemaVersion", "models"], "routing catalog");
  if (document.schemaVersion !== "1.0.0") fail('routing catalog.schemaVersion must equal "1.0.0"');
  assertJsonObject(document.models, "routing catalog.models");
  exactKeys(document.models, Object.keys(document.models), [], "routing catalog.models");
  if (Object.keys(document.models).length === 0) fail("routing catalog.models must not be empty");
  const catalogModels: Record<string, CatalogEntry> = {};
  for (const [name, entry] of Object.entries(document.models)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(name))
      fail(`routing catalog model key is invalid: ${name}`);
    exactKeys(
      entry,
      ["model", "routingServiceUrl", "maxInFlight"],
      ["model", "routingServiceUrl", "maxInFlight"],
      `routing catalog.models.${name}`,
    );
    if (
      typeof entry.model !== "string" ||
      !entry.model.startsWith(`${name}/`) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(entry.model.slice(name.length + 1))
    )
      fail(`routing catalog.models.${name}.model must use its catalog key as provider prefix`);
    const routingServiceUrl = canonicalLoopbackUrl(
      entry.routingServiceUrl,
      `routing catalog.models.${name}.routingServiceUrl`,
    );
    if (
      typeof entry.maxInFlight !== "number" ||
      !Number.isInteger(entry.maxInFlight) ||
      entry.maxInFlight < 1 ||
      entry.maxInFlight > 2147483647
    )
      fail(`routing catalog.models.${name}.maxInFlight is out of range`);
    catalogModels[name] = {
      model: entry.model,
      routingServiceUrl,
      maxInFlight: entry.maxInFlight,
    };
  }
  return {
    schemaVersion: document.schemaVersion,
    models: catalogModels,
  };
}

interface ValidatedExternalInputs {
  inputs: SnapshotInput[];
  providerDocument: ProviderProjection | null;
  catalogDocument: RoutingCatalog | null;
  presence: {
    providerConfig: boolean;
    routingCatalog: boolean;
    routingProfile: boolean;
  };
}

function validateExternalInputs(options: LauncherOptions): ValidatedExternalInputs {
  if (Boolean(options.catalog) !== Boolean(options.profile))
    fail("--routing-catalog and --routing-profile are an all-or-none pair");
  const inputs: SnapshotInput[] = [];
  let providerDocument: ProviderProjection | null = null;
  let catalogDocument: RoutingCatalog | null = null;
  if (options.providerConfig) {
    const provider = inspectExternalFile(options.providerConfig, "provider config");
    providerDocument = validateProviderProjection(provider.document);
    inputs.push({ key: "provider", name: "provider.json", bytes: provider.bytes });
  }
  if (options.catalog) {
    const catalog = inspectExternalFile(options.catalog, "routing catalog");
    const profile = inspectExternalFile(options.profile!, "routing profile");
    catalogDocument = validateCatalog(catalog.document);
    normalizeAndValidateRoutingConfig(
      mergeExternalRoutingDocuments(catalog.document, profile.document),
    );
    inputs.push(
      { key: "catalog", name: "catalog.json", bytes: catalog.bytes },
      { key: "profile", name: "profile.json", bytes: profile.bytes },
    );
  }
  if (providerDocument && catalogDocument) {
    for (const [name, entry] of Object.entries(catalogDocument.models)) {
      const provider = providerDocument.provider[name];
      const model = entry.model.slice(name.length + 1);
      if (
        !provider ||
        !Object.hasOwn(provider.models, model) ||
        provider.options.baseURL !== entry.routingServiceUrl
      )
        fail(`provider/catalog mismatch for ${name}`);
    }
    if (
      Object.keys(providerDocument.provider).length !== Object.keys(catalogDocument.models).length
    )
      fail("provider/catalog provider sets differ");
  }
  return {
    inputs,
    providerDocument,
    catalogDocument,
    presence: {
      providerConfig: Boolean(options.providerConfig),
      routingCatalog: Boolean(options.catalog),
      routingProfile: Boolean(options.profile),
    },
  };
}

function createSnapshots(runtimeRoot: string, inputs: SnapshotInput[]): Snapshot {
  const parent = ensurePrivateDirectory(path.join(path.dirname(runtimeRoot), "launches"));
  if (fs.realpathSync(parent) !== parent || parent === path.parse(parent).root)
    fail("launch snapshots parent must be canonical and must not be a filesystem root");
  const parentIdentity = lstatOwned(parent, "launch snapshots parent", "directory", 0o700);
  const directory = path.join(parent, `launch-${process.pid}-${randomBytes(8).toString("hex")}`);
  fs.mkdirSync(directory, { mode: 0o700 });
  if (fs.realpathSync(directory) !== directory) fail("launch snapshot directory must be canonical");
  const directoryIdentity = lstatOwned(directory, "launch snapshot directory", "directory", 0o700);
  const paths: Snapshot["paths"] = {};
  try {
    for (let index = 0; index < inputs.length; index += 1) {
      const input = inputs[index]!;
      const target = path.join(directory, input.name);
      fs.writeFileSync(target, input.bytes, { flag: "wx", mode: 0o600 });
      if (
        process.env.OPENCODE_HARNESS_TESTING === "1" &&
        process.env.OPENCODE_HARNESS_TEST_SNAPSHOT_FAIL_AFTER === String(index + 1)
      )
        throw new Error("injected snapshot construction failure");
      const fd = fs.openSync(target, "r");
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      paths[input.key] = target;
    }
    return {
      parent,
      parentIdentity,
      directory,
      directoryIdentity,
      paths,
      database: path.join(directory, "opencode.db"),
    };
  } catch (error) {
    for (const name of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, name));
    fs.rmdirSync(directory);
    throw error;
  }
}

function cleanupSnapshot(
  snapshot: Snapshot,
  originalProblem: string | null = null,
  allowTestInjections = true,
): void {
  const allowed = new Set([
    ...Object.values(snapshot.paths).map((filename) => path.basename(filename)),
    "opencode.db",
    "opencode.db-wal",
    "opencode.db-shm",
  ]);
  let primary = originalProblem || "launch snapshot cleanup";
  let retainedLaunch: string | null = snapshot.directory;
  let retainedQuarantine: string | null = null;

  function cleanupFailure(detail: string): never {
    const retained = retainedQuarantine
      ? `; retained quarantine: ${retainedQuarantine}`
      : retainedLaunch
        ? `; retained launch: ${retainedLaunch}`
        : "";
    fail(`${primary}; cleanup failure: ${detail}${retained}`);
  }

  try {
    if (
      allowTestInjections &&
      process.env.OPENCODE_HARNESS_TESTING === "1" &&
      process.env.OPENCODE_HARNESS_TEST_PATH_CONFUSION === "1"
    )
      snapshot.directory = `${snapshot.directory}${path.sep}..${path.sep}${path.basename(snapshot.directory)}`;
    if (
      allowTestInjections &&
      process.env.OPENCODE_HARNESS_TESTING === "1" &&
      process.env.OPENCODE_HARNESS_TEST_PARENT_SWAP === "1"
    ) {
      const movedParent = `${snapshot.parent}.swapped`;
      fs.renameSync(snapshot.parent, movedParent);
      retainedLaunch = path.join(movedParent, path.basename(retainedLaunch));
      fs.mkdirSync(snapshot.parent, { mode: 0o700 });
    }
    if (
      allowTestInjections &&
      process.env.OPENCODE_HARNESS_TESTING === "1" &&
      process.env.OPENCODE_HARNESS_TEST_LAUNCH_REPLACEMENT === "1"
    ) {
      const movedLaunch = `${snapshot.directory}.replaced`;
      fs.renameSync(snapshot.directory, movedLaunch);
      retainedLaunch = movedLaunch;
      fs.mkdirSync(snapshot.directory, { mode: 0o700 });
    }
    assertCanonicalAbsolute(snapshot.parent, "verified launch snapshots parent");
    assertCanonicalAbsolute(snapshot.directory, "verified launch snapshot directory");
    if (
      snapshot.parent === path.parse(snapshot.parent).root ||
      snapshot.directory === path.parse(snapshot.directory).root ||
      snapshot.directory === snapshot.parent ||
      path.dirname(snapshot.directory) !== snapshot.parent ||
      path.join(snapshot.parent, path.basename(snapshot.directory)) !== snapshot.directory
    )
      throw new Error(
        "launch cleanup paths are not an immediate contained child or name a canonical root exclusion",
      );
    if (fs.realpathSync(snapshot.parent) !== snapshot.parent)
      throw new Error("launch snapshots parent canonical path changed");
    const parentBefore = fs.lstatSync(snapshot.parent, { bigint: true });
    if (
      !parentBefore.isDirectory() ||
      parentBefore.isSymbolicLink() ||
      parentBefore.uid !== BigInt(process.getuid!()) ||
      mode(parentBefore) !== 0o700 ||
      !sameDeviceInode(snapshot.parentIdentity, parentBefore)
    )
      throw new Error("launch snapshots parent identity changed before quarantine");
    if (fs.realpathSync(snapshot.directory) !== snapshot.directory)
      throw new Error("launch snapshot canonical path changed before quarantine");
    const launchBefore = fs.lstatSync(snapshot.directory, { bigint: true });
    if (
      !launchBefore.isDirectory() ||
      launchBefore.isSymbolicLink() ||
      launchBefore.uid !== BigInt(process.getuid!()) ||
      mode(launchBefore) !== 0o700 ||
      !sameDeviceInode(snapshot.directoryIdentity, launchBefore)
    )
      throw new Error("launch snapshot identity changed before quarantine");
  } catch (error) {
    cleanupFailure(
      `pre-quarantine guard failed: ${errorMessage(error).replace(/^opencode-harness: /, "")}`,
    );
  }

  let inventoryProblem = null;
  try {
    for (const name of fs.readdirSync(snapshot.directory).sort()) {
      const filename = path.join(snapshot.directory, name);
      if (!allowed.has(name)) {
        inventoryProblem ??= `launch snapshot contains unexpected entry: ${name}`;
        continue;
      }
      const stat = fs.lstatSync(filename, { bigint: true });
      if (
        stat.isSymbolicLink() ||
        !stat.isFile() ||
        stat.uid !== BigInt(process.getuid!()) ||
        mode(stat) !== 0o600
      )
        inventoryProblem ??= `launch snapshot entry is not a current-user mode-0600 regular file: ${name}`;
    }
  } catch (error) {
    inventoryProblem = `launch snapshot inventory failed: ${errorMessage(error)}`;
  }
  primary =
    [originalProblem, inventoryProblem].filter(Boolean).join("; ") || "launch snapshot cleanup";

  const quarantine = path.join(
    snapshot.parent,
    `.quarantine-${process.pid}-${randomBytes(8).toString("hex")}`,
  );
  try {
    assertCanonicalAbsolute(quarantine, "launch quarantine");
    if (
      path.dirname(quarantine) !== snapshot.parent ||
      quarantine === snapshot.parent ||
      quarantine === path.parse(quarantine).root
    )
      throw new Error("quarantine path is not an immediate contained non-root child");
    fs.renameSync(snapshot.directory, quarantine);
    retainedQuarantine = quarantine;
    retainedLaunch = null;
  } catch (error) {
    cleanupFailure(
      `same-parent quarantine rename failed: ${errorMessage(error).replace(/^opencode-harness: /, "")}`,
    );
  }

  try {
    if (
      allowTestInjections &&
      process.env.OPENCODE_HARNESS_TESTING === "1" &&
      process.env.OPENCODE_HARNESS_TEST_POST_RENAME_MISMATCH === "1"
    ) {
      const moved = `${quarantine}.identity-mismatch`;
      fs.renameSync(quarantine, moved);
      retainedQuarantine = moved;
      fs.mkdirSync(quarantine, { mode: 0o700 });
    }
    const parentAfter = fs.lstatSync(snapshot.parent, { bigint: true });
    if (
      !parentAfter.isDirectory() ||
      parentAfter.isSymbolicLink() ||
      parentAfter.uid !== BigInt(process.getuid!()) ||
      mode(parentAfter) !== 0o700 ||
      !sameDeviceInode(snapshot.parentIdentity, parentAfter)
    )
      throw new Error("launch snapshots parent identity changed after quarantine rename");
    const quarantined = fs.lstatSync(quarantine, { bigint: true });
    if (
      quarantined.dev !== snapshot.directoryIdentity.dev ||
      quarantined.ino !== snapshot.directoryIdentity.ino
    )
      throw new Error("quarantine dev/ino does not match the verified launch directory");
  } catch (error) {
    cleanupFailure(
      `post-quarantine identity check failed: ${errorMessage(error).replace(/^opencode-harness: /, "")}`,
    );
  }

  function removeContainedEntry(filename: string): void {
    const stat = fs.lstatSync(filename, { bigint: true });
    if (stat.isDirectory() && !stat.isSymbolicLink()) {
      for (const name of fs.readdirSync(filename)) removeContainedEntry(path.join(filename, name));
      fs.rmdirSync(filename);
    } else fs.unlinkSync(filename);
  }

  try {
    if (
      allowTestInjections &&
      process.env.OPENCODE_HARNESS_TESTING === "1" &&
      process.env.OPENCODE_HARNESS_TEST_QUARANTINE_CLEANUP_FAIL === "1"
    )
      throw new Error("injected quarantine cleanup failure");
    removeContainedEntry(quarantine);
    const parentFinal = fs.lstatSync(snapshot.parent, { bigint: true });
    if (
      fs.realpathSync(snapshot.parent) !== snapshot.parent ||
      !parentFinal.isDirectory() ||
      parentFinal.isSymbolicLink() ||
      parentFinal.uid !== BigInt(process.getuid!()) ||
      mode(parentFinal) !== 0o700 ||
      !sameDeviceInode(snapshot.parentIdentity, parentFinal)
    )
      throw new Error("launch snapshots parent identity changed after recursive unlink");
    try {
      fs.lstatSync(quarantine);
      throw new Error("quarantine path still exists after recursive unlink");
    } catch (error) {
      if (errorCode(error) !== "ENOENT") throw error;
    }
    retainedQuarantine = null;
  } catch (error) {
    cleanupFailure(`quarantine recursive unlink failed: ${errorMessage(error)}`);
  }
  if (inventoryProblem) fail(`${primary}; quarantined launch snapshot was safely removed`);
}

function expectedTracePermissionMarker(workspace: string, traceRoot: string, nonce: string) {
  const relativeRoot = path.relative(workspace, traceRoot).split(path.sep).join("/");
  const permissions = ROLES.map((role) => ({
    role,
    externalDirectory: `${traceRoot}/orchestrations/*/roles/${role}/*`,
    edit: TRACE_ONLY_ROLES.includes(role)
      ? `${relativeRoot}/orchestrations/*/roles/${role}/*.md`
      : null,
  }));
  const plan = {
    schemaVersion: "1.0.0",
    workspaceRoot: workspace,
    traceRoot,
    roles: ROLES,
    permissions,
  };
  return { ...plan, nonce, permissionPlanDigest: hash(Buffer.from(JSON.stringify(plan))) };
}

function verifyTracePermissionMarker(
  filename: string,
  expected: ReturnType<typeof expectedTracePermissionMarker>,
): void {
  const stat = lstatOwned(filename, "trace permission activation marker", "file", 0o600);
  if (stat.nlink !== 1n) fail("trace permission activation marker must have one link");
  const document = parseJsonBytes(
    readStableFile(filename, "trace permission activation marker", { exactMode: 0o600 }).bytes,
    "trace permission activation marker",
  );
  const keys = [
    "nonce",
    "permissionPlanDigest",
    "permissions",
    "roles",
    "schemaVersion",
    "traceRoot",
    "workspaceRoot",
  ];
  if (!isJsonObject(document) || Object.keys(document).sort().join(",") !== keys.sort().join(","))
    fail("trace permission activation marker mismatch");
  const expectedValues: Record<string, unknown> = Object.fromEntries(Object.entries(expected));
  for (const key of keys)
    if (JSON.stringify(document[key]) !== JSON.stringify(expectedValues[key]))
      fail(`trace permission activation marker mismatch: ${key}`);
}

function recheckExecutable(executable: string, identity: ExecutableIdentity, label: string): void {
  const stat = fs.lstatSync(executable, { bigint: true });
  const opened = readStableFile(executable, label, {
    owners: [0n, BigInt(process.getuid!())],
    maxBytes: Number.MAX_SAFE_INTEGER,
  });
  if (
    stat.dev !== identity.dev ||
    stat.ino !== identity.ino ||
    identity.size !== opened.stat.size ||
    identity.mtimeNs !== opened.stat.mtimeNs ||
    hash(opened.bytes) !== identity.digest
  )
    fail(`OpenCode executable identity changed after ${label}`);
}

function activationEnv(
  base: NodeJS.ProcessEnv,
  runtimeRoot: string,
  workspace: string,
  traceRoot: string,
  snapshot: Snapshot,
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...base,
    OPENCODE_CONFIG_DIR: runtimeRoot,
    OPENCODE_DB: snapshot.database,
    OPENCODE_HARNESS_RUNTIME_ROOT: runtimeRoot,
    OPENCODE_HARNESS_WORKSPACE_ROOT: workspace,
    OPENCODE_HARNESS_TRACE_ROOT: traceRoot,
  };
  if (snapshot.paths.provider) env.OPENCODE_CONFIG = snapshot.paths.provider;
  if (snapshot.paths.catalog) {
    env.OPENCODE_HARNESS_ROUTING_CATALOG = snapshot.paths.catalog;
    env.OPENCODE_HARNESS_ROUTING_PROFILE = snapshot.paths.profile;
  }
  return env;
}

function probeTracePermissions(
  executable: string,
  identity: ExecutableIdentity,
  workspace: string,
  runtimeRoot: string,
  traceRoot: string,
  inputs: SnapshotInput[],
  projectState: ProjectState,
  options: LauncherOptions,
): void {
  const snapshot = createSnapshots(runtimeRoot, inputs);
  const marker = path.join(snapshot.directory, "trace-permission-probe.json");
  snapshot.paths.probeMarker = marker;
  const nonce = randomBytes(32).toString("hex");
  let problem: unknown = null;
  try {
    const env = activationEnv(process.env, runtimeRoot, workspace, traceRoot, snapshot);
    env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH = marker;
    env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE = nonce;
    const result = spawnSync(executable, ["agent", "list"], {
      cwd: workspace,
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (result.error) fail(`cannot start OpenCode activation probe: ${result.error.message}`);
    if (result.status !== 0)
      fail(
        `OpenCode trace permission activation probe failed with status ${result.status}: ${(result.stderr || result.stdout).trim()}`,
      );
    verifyTracePermissionMarker(marker, expectedTracePermissionMarker(workspace, traceRoot, nonce));
  } catch (error) {
    problem = error;
  }
  cleanupSnapshot(
    snapshot,
    problem === null ? null : errorMessage(problem).replace(/^opencode-harness: /, ""),
    false,
  );
  if (problem) throw problem;
  recheckExecutable(executable, identity, "trace permission activation probe");
  const recheckedProject = projectPreflight(
    workspace,
    Boolean(options.allowProjectPlugins),
    Boolean(options.providerConfig),
  );
  if (recheckedProject.fingerprint !== projectState.fingerprint)
    fail("project config/plugin/skill surface changed after trace permission activation probe");
}

function resolveExecutable(explicit?: string): ExecutableSelection {
  const source =
    explicit !== undefined ? "--opencode-bin" : process.env.OPENCODE_BIN ? "OPENCODE_BIN" : "PATH";
  if (explicit === "") fail("--opencode-bin must be a nonempty absolute path");
  let candidate = explicit ?? process.env.OPENCODE_BIN;
  if (candidate) {
    if (!path.isAbsolute(candidate)) fail(`${source} must be absolute`);
    assertCanonicalAbsolute(candidate, source);
  } else {
    const entries = (process.env.PATH ?? "").split(path.delimiter);
    if (entries.length === 0) fail("PATH must contain an executable search path");
    for (const entry of entries) {
      if (!entry) continue;
      const possible = path.join(entry, "opencode");
      try {
        fs.accessSync(possible, fs.constants.X_OK);
      } catch {
        continue;
      }
      if (!path.isAbsolute(entry))
        fail("the selected PATH entry containing opencode must be absolute");
      candidate = possible;
      break;
    }
    if (!candidate) fail("opencode executable not found on absolute PATH");
  }
  let executable: string;
  try {
    executable = fs.realpathSync(candidate);
  } catch {
    fail(
      `selected OpenCode executable from ${source} is missing or inaccessible: ${singleLine(candidate)}`,
    );
  }
  trustedDirectoryPath(path.dirname(executable), "OpenCode executable ancestry");
  const stat = fs.lstatSync(executable, { bigint: true });
  if (
    !stat.isFile() ||
    stat.isSymbolicLink() ||
    (stat.uid !== 0n && stat.uid !== BigInt(process.getuid!())) ||
    (mode(stat) & 0o022) !== 0 ||
    (mode(stat) & 0o111) === 0
  )
    fail("OpenCode executable must resolve to a trusted non-writable executable regular file");
  const opened = readStableFile(executable, "OpenCode executable", {
    owners: [0n, BigInt(process.getuid!())],
    maxBytes: Number.MAX_SAFE_INTEGER,
  });
  return {
    executable,
    source,
    identity: {
      dev: opened.stat.dev,
      ino: opened.stat.ino,
      size: opened.stat.size,
      mtimeNs: opened.stat.mtimeNs,
      digest: hash(opened.bytes),
    },
  };
}

interface ExecutableSelection {
  executable: string;
  source: string;
  identity: ExecutableIdentity;
}

function resolveCompatibleExecutable(explicit?: string): ExecutableSelection & { version: string } {
  const selection = resolveExecutable(explicit);
  const result = spawnSync(selection.executable, ["--version"], {
    encoding: "utf8",
    env: process.env,
    timeout: 5000,
    maxBuffer: 4096,
  });
  let reported = result.stdout?.trim() ?? "";
  if (
    result.error ||
    result.status !== 0 ||
    !reported ||
    reported.length > 128 ||
    /[\x00-\x1f\x7f]/.test(reported)
  ) {
    // Reporting is optional. Executable bytes still bind the fallback cache;
    // actual native operations, not a version command, determine compatibility.
    reported = `unreported-${selection.identity.digest}`;
    process.stderr.write(
      "opencode-harness: OpenCode version reporting unavailable; using executable digest for cache identity\n",
    );
  }
  process.stderr.write(
    `opencode-harness: selected OpenCode ${JSON.stringify(selection.executable)} via ${selection.source}; reported version ${JSON.stringify(singleLine(reported).slice(0, 128))}\n`,
  );
  const version = diagnosticVersion(reported);
  recheckExecutable(selection.executable, selection.identity, "version probe");
  return { ...selection, version };
}

interface ParsedArguments {
  command: string;
  options: LauncherOptions;
}

function parse(argv: string[]): ParsedArguments {
  const command = argv.shift() ?? "help";
  if (command === "capabilities") {
    if (argv.length !== 0) fail("capabilities accepts no arguments");
    return { command, options: { forward: [] } };
  }
  if (command === "validate-inputs") {
    const options: LauncherOptions = { forward: [] };
    const keys = new Map<
      string,
      keyof Pick<LauncherOptions, "providerConfig" | "catalog" | "profile">
    >([
      ["--provider-config", "providerConfig"],
      ["--routing-catalog", "catalog"],
      ["--routing-profile", "profile"],
    ]);
    const seen = new Set();
    while (argv.length) {
      const token = argv.shift()!;
      const key = keys.get(token);
      if (!key || seen.has(key) || argv.length === 0 || argv[0] === "--" || keys.has(argv[0]!))
        fail(`unknown, duplicate, or incomplete option: ${token}`);
      seen.add(key);
      options[key] = argv.shift()!;
    }
    if (!options.providerConfig && !options.catalog && !options.profile)
      fail("validate-inputs requires at least one input");
    if (Boolean(options.catalog) !== Boolean(options.profile))
      fail("--routing-catalog and --routing-profile are an all-or-none pair");
    return { command, options };
  }
  const options: LauncherOptions = { forward: [] };
  while (argv.length) {
    const token = argv.shift()!;
    if (["web", "source-web"].includes(command) && token === "--port") {
      if (options.webPort !== undefined || !/^[0-9]{1,5}$/.test(argv[0] ?? ""))
        fail("web requires one integer --port between 1024 and 65535");
      options.webPort = argv.shift()!;
      if (Number(options.webPort) < 1024 || Number(options.webPort) > 65535)
        fail("web port must be between 1024 and 65535");
      continue;
    }
    if (token === "--") {
      if (["web", "source-web", "source-tui"].includes(command))
        fail("source/web modes do not accept forwarded native arguments");
      options.forward = argv.splice(0);
      break;
    }
    if (token === "--allow-project-plugins") {
      options.allowProjectPlugins = true;
      continue;
    }
    const key = new Map<
      string,
      keyof Pick<
        LauncherOptions,
        | "workspace"
        | "traceRoot"
        | "cacheRoot"
        | "providerConfig"
        | "catalog"
        | "profile"
        | "opencodeBin"
      >
    >([
      ["--opencode-bin", "opencodeBin"],
      ["--workspace", "workspace"],
      ["--trace-root", "traceRoot"],
      ["--cache-root", "cacheRoot"],
      ["--provider-config", "providerConfig"],
      ["--routing-catalog", "catalog"],
      ["--routing-profile", "profile"],
    ]).get(token);
    if (!key || argv.length === 0 || argv[0]!.startsWith("--") || options[key] !== undefined)
      fail(`unknown, duplicate, or incomplete option: ${token}`);
    options[key] = argv.shift()!;
  }
  if (
    command === "doctor" &&
    (options.forward.length ||
      Object.keys(options).some((key) => !["forward", "opencodeBin"].includes(key)))
  )
    fail("doctor accepts only --opencode-bin ABS");
  if (command === "run" && options.forward.some((arg) => arg === "serve" || arg === "web"))
    fail("run cannot forward server command tokens serve/web; use authenticated loopback web mode");
  if (command === "source-web" || command === "source-tui") {
    if (options.workspace !== undefined && options.workspace !== PACKAGE_ROOT)
      fail("source profile can only launch its own canonical package root");
    if (
      options.traceRoot ||
      options.providerConfig ||
      options.catalog ||
      options.profile ||
      options.allowProjectPlugins
    )
      fail("source profile does not accept external projections, trace roots or plugin overrides");
    options.workspace = PACKAGE_ROOT;
  }
  if (["web", "source-web"].includes(command)) {
    if (!options.workspace) fail("web requires --workspace ABS");
    const password = process.env.OPENCODE_SERVER_PASSWORD;
    if (!password || password.trim().length < 16 || /[\x00-\x1f\x7f]/.test(password))
      fail(
        "web requires an owner-supplied OPENCODE_SERVER_PASSWORD of at least 16 non-control characters",
      );
    options.forward = [
      "serve",
      "--hostname",
      "127.0.0.1",
      "--port",
      options.webPort ?? "4096",
      "--mdns=false",
    ];
  }
  return { command, options };
}

function usage(): string {
  return [
    "Usage:",
    "  opencode-harness source-web [--opencode-bin ABS] [--port 4096] [--cache-root ABS]",
    "  opencode-harness source-tui [--opencode-bin ABS] [--cache-root ABS]",
    "  opencode-harness capabilities",
    "  opencode-harness web --workspace ABS [--port 4096] [run options; no forwarded arguments]",
    "  opencode-harness doctor [--opencode-bin ABS]",
    "  opencode-harness prepare [--opencode-bin ABS] [--cache-root ABS]",
    "  opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]",
    "  opencode-harness run [--opencode-bin ABS] [--workspace ABS] [--trace-root ABS] [--cache-root ABS]",
    "    [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]",
    "    [--allow-project-plugins] [-- OPENCODE_ARGS...]",
    "",
  ].join("\n");
}

function capabilities(): string {
  const value = manifest();
  return JSON.stringify({
    packageVersion: value.packageVersion,
    launchContractVersion: "1.0.0",
    routingProfileVersion: "2.0.0",
    supportedModes: ["cloud-only", "local-only", "mixed"],
    opencodeVersionGate: false,
  });
}

function validateInputs(options: LauncherOptions): string {
  const value = manifest();
  assertNodeCompatibility(value);
  const validated = validateExternalInputs(options);
  return JSON.stringify({
    schemaVersion: "1.0.0",
    valid: true,
    packageVersion: value.packageVersion,
    inputs: validated.presence,
  });
}

function sourceProfilePreflight(): string {
  const root = canonicalWorkspace(PACKAGE_ROOT);
  const sourceManifest = readJson(
    path.join(root, ".opencode/harness.manifest.json"),
    "source manifest",
  );
  if (
    !isJsonObject(sourceManifest) ||
    sourceManifest.target !== "opencode" ||
    !Array.isArray(sourceManifest.artifacts)
  )
    fail("source-web requires a complete harness source checkout");
  const extras = [
    "bin",
    ".opencode/src",
    ".opencode/scripts",
    ".opencode/plugin-modules",
    ".opencode/contracts",
    ".opencode/schemas",
    ".opencode/bootstrap",
    "node_modules/typescript",
  ];
  for (const relative of extras)
    inspectTrustedTree(path.join(root, relative), `source ${relative}`);
  for (const relative of [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".opencode/harness.manifest.json",
    ".opencode/portable.manifest.json",
    ".opencode/runtime.manifest.json",
    "AGENTS.md",
    ".memory/protocols/memory-management.md",
  ]) {
    const filename = path.join(root, relative);
    trustedDirectoryPath(path.dirname(filename), `source ${relative} parent`);
    readStableFile(filename, `source ${relative}`);
  }
  const plugins = ["plugins", "plugin"].flatMap((dir) =>
    recursivePluginFiles(path.join(root, ".opencode", dir)),
  );
  if (plugins.length !== 1 || plugins[0] !== path.join(root, ".opencode/plugins/index.js"))
    fail("source-web requires exactly the source .opencode/plugins/index.js autoload entry");
  for (const relative of [
    "opencode.json",
    "opencode.jsonc",
    ".opencode/opencode.json",
    ".opencode/opencode.jsonc",
  ]) {
    const filename = path.join(root, relative);
    if (!fs.existsSync(filename)) continue;
    const cfg = readProjectConfig(filename, `source ${relative}`);
    if (!isJsonObject(cfg) || cfg.$schema !== "https://opencode.ai/config.json")
      fail("source-web config requires the native schema declaration");
    if (Object.hasOwn(cfg, "plugin") && (!Array.isArray(cfg.plugin) || cfg.plugin.length))
      fail("source-web uses source plugin autoload only; explicit plugins are unsupported");
    if (
      isJsonObject(cfg.skills) &&
      (Object.hasOwn(cfg.skills, "paths") || Object.hasOwn(cfg.skills, "urls"))
    )
      fail("source-web custom skill paths/URLs are unsupported");
    if (cfg.instructions !== undefined) {
      if (!Array.isArray(cfg.instructions)) fail("source instructions must be an array");
      for (const relative of cfg.instructions) {
        if (typeof relative !== "string" || /[*?]/.test(relative))
          fail("source-web instructions require explicit local paths");
        assertSafeRelative(relative, "source instruction");
        const filename = path.join(root, relative);
        trustedDirectoryPath(path.dirname(filename), "source instruction parent");
        readStableFile(filename, "source instruction");
        extras.push(relative);
      }
    }
  }
  const dependencyRoot = path.join(root, ".opencode");
  const pkg = readJson(path.join(dependencyRoot, "package.json"), "source plugin package");
  const lock = readJson(path.join(dependencyRoot, "package-lock.json"), "source plugin lock");
  const packages = isJsonObject(lock) && isJsonObject(lock.packages) ? lock.packages : {};
  const lockedRoot = isJsonObject(packages[""]) ? packages[""] : {};
  if (
    !isJsonObject(pkg) ||
    !isJsonObject(pkg.dependencies) ||
    typeof pkg.dependencies["@opencode-ai/plugin"] !== "string"
  )
    fail("source plugin dependencies must already be installed");
  for (const category of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    const declared = isJsonObject(pkg[category]) ? pkg[category] : {};
    const locked = isJsonObject(lockedRoot[category]) ? lockedRoot[category] : {};
    for (const [name, version] of Object.entries(declared))
      if (locked[name] !== version)
        fail("source plugin package/lock mismatch; no dependency installation is performed");
  }
  const modules = trustedDirectoryPath(
    path.join(dependencyRoot, "node_modules"),
    "source plugin dependencies",
  );
  const links: string[] = [];
  for (const entry of fs.readdirSync(modules)) {
    const filename = path.join(modules, entry);
    if (entry === ".bin") {
      const bin = trustedDirectoryPath(filename, "source dependency bin directory");
      for (const name of fs.readdirSync(bin)) {
        const link = path.join(bin, name);
        const stat = fs.lstatSync(link, { bigint: true });
        if (!stat.isSymbolicLink() || stat.uid !== BigInt(process.getuid!()))
          fail("unsafe source dependency bin entry");
        const target = fs.readlinkSync(link);
        const resolved = path.resolve(bin, target);
        if (path.isAbsolute(target) || !resolved.startsWith(modules + path.sep))
          fail("source dependency bin link escapes dependencies");
        trustedDirectoryPath(path.dirname(resolved), "source dependency bin target parent");
        readStableFile(resolved, "source dependency bin target");
        links.push(`${name}:${target}`);
      }
    } else {
      if (fs.lstatSync(filename).isDirectory())
        inspectTrustedTree(filename, "source plugin dependency");
      else readStableFile(filename, "source plugin dependency metadata");
      extras.push(path.relative(root, filename));
    }
  }
  const installed = readJson(
    path.join(modules, "@opencode-ai/plugin/package.json"),
    "installed source plugin metadata",
  );
  const lockedPlugin = packages["node_modules/@opencode-ai/plugin"];
  if (
    !isJsonObject(installed) ||
    !isJsonObject(lockedPlugin) ||
    installed.version !== pkg.dependencies["@opencode-ai/plugin"] ||
    installed.version !== lockedPlugin.version
  )
    fail("source plugin dependency versions disagree");
  extras.push(
    ".opencode/package.json",
    ".opencode/package-lock.json",
    ".opencode/.gitignore",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".opencode/harness.manifest.json",
    ".opencode/portable.manifest.json",
    ".opencode/runtime.manifest.json",
    "AGENTS.md",
    ".memory/protocols/memory-management.md",
  );
  readStableFile(path.join(dependencyRoot, ".gitignore"), "source config gitignore");
  return hash(
    Buffer.from(
      projectSecurityFingerprint(
        root,
        extras.map((name) => path.join(root, name)),
      ) + links.sort().join("\n"),
    ),
  );
}

function runSourceProfile(options: LauncherOptions, mode: "source-web" | "source-tui"): number {
  for (const name of RESERVED_ENV)
    if (Object.hasOwn(process.env, name)) fail(`refusing pre-set ${name}`);
  assertNodeCompatibility(manifest());
  const fingerprint = sourceProfilePreflight();
  for (const [script, args] of [
    [".opencode/scripts/validate-portable-harness.mjs", ["--root", PACKAGE_ROOT]],
    [".opencode/scripts/build-typescript.mts", ["--check"]],
  ] as const) {
    const checked = spawnSync(process.execPath, [path.join(PACKAGE_ROOT, script), ...args], {
      cwd: PACKAGE_ROOT,
      encoding: "utf8",
      // Source QA validates fixtures offline; readiness applies only to the native child.
      env: { ...process.env, OPENCODE_HARNESS_LOCAL_READINESS: undefined },
      timeout: 120000,
      maxBuffer: 1024 * 1024,
    });
    if (checked.error || checked.status !== 0)
      fail(
        `source profile preflight failed: ${script}; run the source validator/build check separately`,
      );
  }
  const selected = resolveCompatibleExecutable(options.opencodeBin);
  if (sourceProfilePreflight() !== fingerprint)
    fail("source profile changed during validation or version probe");
  recheckExecutable(selected.executable, selected.identity, "source profile validation");
  const stateRoot = path.join(cacheRootFrom(options), mode, hash(Buffer.from(PACKAGE_ROOT)));
  if (
    stateRoot === PACKAGE_ROOT ||
    stateRoot.startsWith(PACKAGE_ROOT + path.sep) ||
    PACKAGE_ROOT.startsWith(stateRoot + path.sep)
  )
    fail("source profile state must not overlap the source checkout");
  ensurePrivateDirectory(stateRoot);
  const snapshot = createSnapshots(path.join(stateRoot, "unused-runtime-anchor"), []);
  let resultStatus = 1;
  let originalError: unknown = null;
  try {
    const result = spawnSync(selected.executable, options.forward, {
      cwd: PACKAGE_ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        OPENCODE_DB: snapshot.database,
        OPENCODE_HARNESS_WORKSPACE_ROOT: PACKAGE_ROOT,
        OPENCODE_HARNESS_TRACE_ROOT: path.join(PACKAGE_ROOT, ".memory"),
      },
    });
    if (result.error) fail(`cannot start source OpenCode: ${result.error.message}`);
    resultStatus = result.status ?? 1;
  } catch (error) {
    originalError = error;
  }
  cleanupSnapshot(
    snapshot,
    originalError
      ? errorMessage(originalError)
      : resultStatus
        ? `OpenCode child exited with status ${resultStatus}`
        : null,
  );
  if (originalError) throw originalError;
  return resultStatus;
}

function run(options: LauncherOptions): number {
  process.stderr.write(
    "opencode-harness: ephemeral execution; interrupted runs cannot resume; launch database is removed after exit.\n",
  );
  for (const name of RESERVED_ENV)
    if (Object.hasOwn(process.env, name)) fail(`refusing pre-set ${name}`);
  for (const arg of options.forward)
    if (
      arg === "--pure" ||
      arg === "--dir" ||
      arg.startsWith("--dir=") ||
      arg.startsWith("--project") ||
      arg.startsWith("--config")
    )
      fail(`forbidden forwarded option: ${arg}`);
  if (Boolean(options.catalog) !== Boolean(options.profile))
    fail("--routing-catalog and --routing-profile are an all-or-none pair");
  const workspace = workspaceFromRunOption(options.workspace);
  const projectState = projectPreflight(
    workspace,
    Boolean(options.allowProjectPlugins),
    Boolean(options.providerConfig),
  );
  const { inputs } = validateExternalInputs(options);
  const value = manifest();
  assertNodeCompatibility(value);
  const { executable, identity, version } = resolveCompatibleExecutable(options.opencodeBin);
  const runtimeRoot = prepareRuntime(options, version);
  const traceRoot = chooseTraceRoot(workspace, options.traceRoot, runtimeRoot);
  const rootPairs: readonly (readonly [string, string, string])[] = [
    [workspace, runtimeRoot, "workspace/runtime"],
    [runtimeRoot, traceRoot, "runtime/trace"],
  ];
  for (const [left, right, label] of rootPairs)
    if (
      left === right ||
      left.startsWith(`${right}${path.sep}`) ||
      right.startsWith(`${left}${path.sep}`)
    )
      fail(`${label} roots must not overlap`);
  if (
    traceRoot.startsWith(`${workspace}${path.sep}`) &&
    traceRoot !== path.join(workspace, ".memory")
  )
    fail("workspace/trace roots may overlap only at the ignored workspace .memory directory");

  let snapshots: Snapshot | null = null;
  let resultStatus = 1;
  let originalError: unknown = null;
  try {
    recheckExecutable(executable, identity, "runtime preparation");
    const recheckedProject = projectPreflight(
      workspace,
      Boolean(options.allowProjectPlugins),
      Boolean(options.providerConfig),
    );
    if (recheckedProject.fingerprint !== projectState.fingerprint)
      fail("project config/plugin/skill surface changed after preflight");
    if (traceRoot !== path.join(workspace, ".memory"))
      probeTracePermissions(
        executable,
        identity,
        workspace,
        runtimeRoot,
        traceRoot,
        inputs,
        projectState,
        options,
      );
    snapshots = createSnapshots(runtimeRoot, inputs);
    const env = activationEnv(process.env, runtimeRoot, workspace, traceRoot, snapshots);
    const result = spawnSync(executable, options.forward, {
      cwd: workspace,
      env,
      stdio: "inherit",
    });
    if (result.error) fail(`cannot start OpenCode: ${result.error.message}`);
    resultStatus = result.status ?? 1;
  } catch (error) {
    originalError = error;
  }
  const originalProblem =
    (originalError === null
      ? null
      : errorMessage(originalError).replace(/^opencode-harness: /, "")) ??
    (resultStatus === 0 ? null : `OpenCode child exited with status ${resultStatus}`);
  if (snapshots) cleanupSnapshot(snapshots, originalProblem);
  if (originalError) throw originalError;
  return resultStatus;
}

try {
  const { command, options } = parse(process.argv.slice(2));
  if (command === "help" || command === "--help" || command === "-h") {
    process.stdout.write(usage());
    process.exitCode = 0;
  } else if (command === "capabilities") process.stdout.write(`${capabilities()}\n`);
  else if (command === "doctor") {
    const value = manifest();
    assertNodeCompatibility(value);
    const selected = resolveCompatibleExecutable(options.opencodeBin);
    process.stdout.write(
      `${JSON.stringify({ executable: selected.executable, source: selected.source, version: selected.version, capabilityVerification: "runtime", ephemeral: true, resumable: false })}\n`,
    );
  } else if (command === "prepare") process.stdout.write(`${prepareRuntime(options)}\n`);
  else if (command === "validate-inputs") process.stdout.write(`${validateInputs(options)}\n`);
  else if (command === "source-web" || command === "source-tui")
    process.exitCode = runSourceProfile(options, command);
  else if (command === "run" || command === "web") process.exitCode = run(options);
  else fail(`unknown command: ${command}`);
} catch (error) {
  process.stderr.write(`${singleLine(errorMessage(error))}\n`);
  process.exitCode = 1;
}
