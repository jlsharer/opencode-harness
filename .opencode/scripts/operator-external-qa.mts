// Source-only, explicit operator convenience; never a managed validator gate.
import { createHash } from "node:crypto";
import {
  constants as fsConstants,
  lstatSync,
  mkdtempSync,
  openSync,
  closeSync,
  readSync,
  realpathSync,
  rmSync,
  fstatSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const QA_COMMANDS = Object.freeze([
  Object.freeze(["node", "--test", ".opencode/scripts/operator-external-qa.test.mts"]),
  Object.freeze(["node", ".opencode/scripts/validate-harness.mts"]),
  Object.freeze(["node", ".opencode/scripts/validate-portable-harness.mjs", "--root", "."]),
  Object.freeze(["node", "--test", ".opencode/scripts/runtime-harness.test.mts"]),
  Object.freeze(["node", "--test", ".opencode/scripts/runtime-foreign-repo.test.mts"]),
  Object.freeze(["npm", "pack", "--dry-run", "--json"]),
]);
const MAX_OUTPUT = 8 * 1024 * 1024;
const TIMEOUT = 120_000;

const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

const inside = (parent: string, child: string) =>
  child === parent || child.startsWith(parent + sep);

function canonical(path: string) {
  if (
    !isAbsolute(path) ||
    path !== resolve(path) ||
    path.includes("\0") ||
    path.includes("//") ||
    (path !== "/" && path.endsWith("/"))
  )
    throw Error("noncanonical absolute path");
  let current = "/";
  for (const component of path.split("/").filter(Boolean)) {
    current = join(current, component);
    if (lstatSync(current).isSymbolicLink()) throw Error("symlink path component");
  }
  if (realpathSync(path) !== path) throw Error("noncanonical real path");
  return path;
}

function privateDirectory(path: string) {
  const stat = lstatSync(canonical(path));
  if (!stat.isDirectory() || stat.uid !== process.getuid?.() || (stat.mode & 0o077) !== 0)
    throw Error("scratch/receipt parent must be owner-only");
}

function command(
  program: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeout = TIMEOUT,
) {
  const result = spawnSync(program, args, {
    cwd,
    env,
    encoding: "buffer",
    maxBuffer: MAX_OUTPUT,
    timeout,
    shell: false,
    windowsHide: true,
  });
  const stdout = result.stdout ?? Buffer.alloc(0);
  const stderr = result.stderr ?? Buffer.alloc(0);
  const errorCode = (result.error as NodeJS.ErrnoException | undefined)?.code;
  return {
    argv: [program, ...args],
    exitCode: result.status,
    signal: result.signal,
    timeout: errorCode === "ETIMEDOUT",
    error: result.error ? (errorCode ?? "spawn-error") : null,
    stdoutSha256: hash(stdout),
    stderrSha256: hash(stderr),
    stdoutBytes: stdout.length,
    stderrBytes: stderr.length,
    outputTruncated: errorCode === "ENOBUFS",
  };
}

function git(root: string, ...args: string[]) {
  const raw = spawnSync("git", args, {
    cwd: root,
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_OPTIONAL_LOCKS: "0",
      GIT_TERMINAL_PROMPT: "0",
    },
    maxBuffer: MAX_OUTPUT,
    encoding: "buffer",
    timeout: TIMEOUT,
  });
  if (raw.status !== 0 || raw.error || raw.signal) throw Error("git inventory command failed");
  return raw.stdout as Buffer;
}

function safeName(name: string) {
  if (
    !name ||
    name.startsWith("/") ||
    name.split("/").some((part) => part === "." || part === ".." || !part)
  )
    throw Error("unsafe inventory path");
  return name;
}

function digestFile(path: string) {
  const before = lstatSync(path, { bigint: true });
  if (!before.isFile() || before.nlink !== 1n) throw Error("nonregular or linked inventory file");
  const fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (opened.dev !== before.dev || opened.ino !== before.ino || opened.mode !== before.mode)
      throw Error("inventory identity changed");
    const digest = createHash("sha256");
    const buffer = Buffer.alloc(64 * 1024);
    let length: number;
    while ((length = readSync(fd, buffer, 0, buffer.length, null)) !== 0)
      digest.update(buffer.subarray(0, length));
    const after = lstatSync(path, { bigint: true });
    if (
      after.dev !== before.dev ||
      after.ino !== before.ino ||
      after.size !== before.size ||
      after.mtimeNs !== before.mtimeNs ||
      after.mode !== before.mode
    )
      throw Error("inventory file changed while reading");
    return `${before.mode.toString(10)}:${digest.digest("hex")}`;
  } finally {
    closeSync(fd);
  }
}

export function snapshot(root: string, ignored: string[] = []) {
  const head = git(root, "rev-parse", "--verify", "HEAD").toString("utf8").trim();
  if (!/^[0-9a-f]{40,64}$/.test(head)) throw Error("invalid HEAD");
  const top = git(root, "rev-parse", "--show-toplevel").toString("utf8").trim();
  if (top !== root) throw Error("not exact worktree root");
  const indexPath = git(root, "rev-parse", "--path-format=absolute", "--git-path", "index")
    .toString("utf8")
    .trim();
  canonical(indexPath);
  const index = digestFile(indexPath);
  const names = git(root, "ls-files", "-z", "--cached", "--others", "--exclude-standard")
    .toString("utf8")
    .split("\0");
  if (names.pop() !== "") throw Error("invalid inventory framing");
  const entries = new Map<string, string>();
  for (const name of [...names, ...ignored]) {
    safeName(name);
    if (entries.has(name)) continue;
    const path = join(root, name);
    canonical(path);
    entries.set(name, digestFile(path));
  }
  const inventory = createHash("sha256");
  for (const [name, value] of [...entries].sort(([a], [b]) =>
    Buffer.compare(Buffer.from(a), Buffer.from(b)),
  ))
    inventory.update(`${name}\0${value}\0`);
  return { head, index, treeSha256: inventory.digest("hex"), fileCount: entries.size };
}

export function parseArgs(args: string[]) {
  if (
    args.length < 4 ||
    args[0] !== "--root" ||
    args[2] !== "--receipt" ||
    (args.length - 4) % 2 !== 0
  )
    throw Error("usage: --root ABS --receipt ABS [--validation-input REL]...");
  const ignored: string[] = [];
  for (let i = 4; i < args.length; i += 2) {
    const name = args[i + 1];
    if (args[i] !== "--validation-input" || ignored.length >= 64)
      throw Error("invalid validation input");
    if (name === undefined) throw Error("missing validation input");
    ignored.push(safeName(name));
  }
  if (new Set(ignored).size !== ignored.length) throw Error("duplicate validation input");
  const root = args[1];
  const receipt = args[3];
  if (root === undefined || receipt === undefined) throw Error("missing root or receipt");
  return { root, receipt, ignored };
}

export function run(args: string[]) {
  if (
    process.platform !== "linux" ||
    Number(process.versions.node.split(".")[0]) !== 24 ||
    process.env.OPENCODE_HARNESS_RUNTIME_ROOT ||
    process.env.OPENCODE_HARNESS_WORKSPACE_ROOT ||
    process.env.OPENCODE_HARNESS_TRACE_ROOT
  )
    throw Error("external Linux/Node 24 operator invocation only");
  const { root, receipt, ignored } = parseArgs(args);
  canonical(root);
  canonical(dirname(receipt));
  if (
    !isAbsolute(receipt) ||
    receipt !== resolve(receipt) ||
    receipt.includes("\0") ||
    receipt.includes("//") ||
    !basename(receipt).endsWith(".json")
  )
    throw Error("invalid receipt path");
  if (inside(root, receipt) || inside(receipt, root))
    throw Error("receipt must be outside worktree");
  privateDirectory(dirname(receipt));
  try {
    lstatSync(receipt);
    throw Error("receipt already exists");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  const startedAt = new Date().toISOString();
  try {
    lstatSync(join(root, ".opencode/.gitignore"));
    if (!ignored.includes(".opencode/.gitignore"))
      throw Error("declare .opencode/.gitignore with --validation-input for source QA");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  for (const name of ignored) {
    if (
      /(?:^|\/)(?:\.env|\.ssh|\.aws|\.npmrc|credentials?|secrets?|tokens?|node_modules)(?:[./-]|$)/i.test(
        name,
      )
    )
      throw Error("secret or dependency validation input");
    git(root, "check-ignore", "-q", "--", name);
  }
  const baseline = snapshot(root, ignored);
  const scratch = mkdtempSync(join(dirname(receipt), ".operator-qa-"));
  let cleanup = "removed";
  const results: ReturnType<typeof command>[] = [];
  let failure: string | null = null;
  let final: ReturnType<typeof snapshot> | null = null;
  try {
    privateDirectory(scratch);
    const env: NodeJS.ProcessEnv = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      LANG: "C",
      LC_ALL: "C",
      TMPDIR: scratch,
      TMP: scratch,
      TEMP: scratch,
      npm_config_cache: join(scratch, "npm-cache"),
      npm_config_ignore_scripts: "true",
      npm_config_offline: "true",
      GIT_TERMINAL_PROMPT: "0",
      GIT_OPTIONAL_LOCKS: "0",
    };
    for (const [program, ...argv] of QA_COMMANDS) {
      if (program === undefined) throw Error("missing QA program");
      const result = command(program === "node" ? process.execPath : program, argv, root, env);
      results.push({ ...result, argv: [program, ...argv] });
      if (result.exitCode !== 0 || result.signal || result.error || result.outputTruncated) {
        failure = "QA command failed";
        break;
      }
      if (JSON.stringify(snapshot(root, ignored)) !== JSON.stringify(baseline)) {
        failure = "workspace mutated during QA";
        break;
      }
    }
  } catch {
    failure = "QA execution or inventory failed";
  }
  try {
    final = snapshot(root, ignored);
  } catch {
    failure = "final inventory failed";
  }
  if (!final || JSON.stringify(final) !== JSON.stringify(baseline))
    failure = "workspace identity changed or unavailable";
  try {
    privateDirectory(scratch);
    rmSync(scratch, { recursive: true, force: false });
  } catch {
    cleanup = `retained at ${scratch}; inspect before manual cleanup`;
    failure = "scratch cleanup failed";
  }
  const complete =
    results.length === QA_COMMANDS.length &&
    results.every((r) => r.exitCode === 0 && !r.signal && !r.error && !r.outputTruncated);
  const record = {
    provenance: "external-operator-unmanaged",
    acceptanceProof: false,
    startedAt,
    finishedAt: new Date().toISOString(),
    baseline,
    final,
    ignoredInputCount: ignored.length,
    commands: results,
    toolVersions: {
      node: process.version,
      npm: "not probed; executable selected by operator PATH",
    },
    cleanup,
    outcome: !failure && complete ? "pass" : "fail",
    reason: failure ?? (complete ? null : "missing command results"),
  };
  const fd = openSync(
    receipt,
    fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | fsConstants.O_NOFOLLOW,
    0o600,
  );
  try {
    writeFileSync(fd, JSON.stringify(record, null, 2) + "\n");
  } finally {
    closeSync(fd);
  }
  return record;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = run(process.argv.slice(2));
    process.stdout.write(
      JSON.stringify({ outcome: result.outcome, provenance: result.provenance }) + "\n",
    );
    if (result.outcome !== "pass") process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`operator QA refused: ${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
