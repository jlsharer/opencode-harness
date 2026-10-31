/** Managed worker boundaries. Ordinary edits are scoped; shell is OS-isolated, never regex-filtered. */
import { execFileSync } from "node:child_process";
import {
  constants,
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

export interface ManagedToolInput {
  tool: string;
  args: Record<string, unknown>;
  role: string;
  allowedPaths: string[];
  workspaceRoot: string;
  commands: string[];
  hiddenPaths?: string[];
  validationInputs?: string[];
  reaStaticInspection?: { path: string; sha256: string; tools: string[] } | undefined;
}
const BWRAP = "/usr/bin/bwrap";
let sandboxChecked = false;

const quote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

function canonicalWorkspace(root: string): void {
  if (
    !path.isAbsolute(root) ||
    root !== path.resolve(root) ||
    root === path.parse(root).root ||
    realpathSync(root) !== root
  )
    throw new Error("managed workspace must be a canonical non-root directory");
  let current = path.parse(root).root;
  for (const component of root.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, component);
    if (lstatSync(current).isSymbolicLink()) throw new Error("symlink ancestry is unsupported");
  }
}

function relativeScope(value: string): { value: string; directory: boolean } {
  const directory = value.endsWith("/");
  const normalized = directory ? value.slice(0, -1) : value;
  if (
    !normalized ||
    path.isAbsolute(normalized) ||
    normalized.includes("\\") ||
    normalized.includes("\0") ||
    normalized.split("/").some((p) => !p || p === "." || p === "..") ||
    normalized === ".git" ||
    normalized.startsWith(".git/")
  )
    throw new Error("invalid managed edit scope");
  return { value: normalized, directory };
}

function scopedFile(root: string, value: unknown, allowedPaths: string[]): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\0") ||
    value.includes("\\") ||
    value.split("/").some((p) => p === "." || p === "..")
  )
    throw new Error("managed edit requires a canonical filePath");
  const absolute = path.isAbsolute(value) ? value : path.join(root, value);
  const relative = path.relative(root, absolute);
  if (
    !relative ||
    relative.startsWith("../") ||
    path.isAbsolute(relative) ||
    relative === ".git" ||
    relative.startsWith(".git/")
  )
    throw new Error("managed edit escapes workspace");
  const scopes = allowedPaths.map(relativeScope);
  if (
    !scopes.some((s) => relative === s.value || (s.directory && relative.startsWith(`${s.value}/`)))
  )
    throw new Error("managed edit outside allowed scope");
  let current = root;
  const pieces = relative.split(path.sep);
  for (const [index, component] of pieces.entries()) {
    current = path.join(current, component);
    try {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink()) throw new Error("symlink edit paths are unsupported");
      if (index === pieces.length - 1 ? !stat.isFile() : !stat.isDirectory())
        throw new Error("managed edit requires regular file ancestry");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      // The tool may create missing directories, but no existing ancestry may be a symlink.
      break;
    }
  }
  return absolute;
}

function assertSandboxAvailable(): void {
  if (sandboxChecked) return;
  try {
    const stat = lstatSync(BWRAP);
    if (
      !stat.isFile() ||
      stat.uid !== 0 ||
      (stat.mode & 0o022) !== 0 ||
      realpathSync(BWRAP) !== BWRAP
    )
      throw new Error("untrusted bubblewrap executable");
    execFileSync(
      BWRAP,
      [
        "--unshare-all",
        "--ro-bind",
        "/",
        "/",
        "--dev",
        "/dev",
        "--proc",
        "/proc",
        "--tmpfs",
        "/tmp",
        "--chdir",
        "/",
        "/bin/sh",
        "-c",
        "true",
      ],
      { stdio: "pipe", timeout: 5000 },
    );
    sandboxChecked = true;
  } catch {
    throw new Error(
      "managed shell unavailable: trusted /usr/bin/bwrap with working user namespaces is required; no unrestricted fallback; use separately authorized external verification",
    );
  }
}

/** A stopped parent can keep working in a private writable directory. The old
 * workspace, trace and host remain read-only in this shell, even if its child is live.
 */
export function enforceRecoveryShell(
  args: Record<string, unknown>,
  recoveryRoot: string,
): Record<string, unknown> {
  canonicalWorkspace(recoveryRoot);
  const stat = lstatSync(recoveryRoot);
  if (!stat.isDirectory() || stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700)
    throw new Error("recovery shell root must be current-user mode 0700");
  if (typeof args.command !== "string" || !args.command.trim() || args.command.length > 16384)
    throw new Error("recovery shell requires a bounded command");
  assertSandboxAvailable();
  const command = [
    BWRAP,
    "--unshare-all",
    "--ro-bind",
    "/",
    "/",
    "--dev",
    "/dev",
    "--proc",
    "/proc",
    ...(recoveryRoot.startsWith("/tmp/") ? [] : ["--tmpfs", "/tmp"]),
    "--bind",
    recoveryRoot,
    recoveryRoot,
    "--clearenv",
    "--setenv",
    "PATH",
    "/usr/bin:/bin",
    "--setenv",
    "HOME",
    recoveryRoot,
    "--setenv",
    "TMPDIR",
    recoveryRoot,
    "--chdir",
    recoveryRoot,
    "/bin/sh",
    "-c",
    args.command,
  ];
  return {
    ...args,
    command: command.map(quote).join(" "),
    workdir: recoveryRoot,
    timeout: Math.min(
      typeof args.timeout === "number" && Number.isSafeInteger(args.timeout) && args.timeout > 0
        ? args.timeout
        : 300000,
      300000,
    ),
  };
}

const REA_DEFAULT_MAX_FILE_BYTES = 64 * 1024 * 1024;
const REA_MAX_FILE_BYTES = 768 * 1024 * 1024;

function assertReaTarget(target: { path: string; sha256: string }, maxFileBytes: number): void {
  const filename = target.path;
  if (
    !path.isAbsolute(filename) ||
    path.resolve(filename) !== filename ||
    filename === "/" ||
    filename.includes("\\") ||
    filename.includes("\0") ||
    !/^[a-f0-9]{64}$/.test(target.sha256)
  )
    throw new Error("managed REA target identity invalid");
  let current = "/";
  for (const component of filename.slice(1).split("/")) {
    current = path.join(current, component);
    if (lstatSync(current).isSymbolicLink())
      throw new Error("managed REA target symlink ancestry unsupported");
  }
  const fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = fstatSync(fd);
    if (!before.isFile() || before.size > maxFileBytes)
      throw new Error("managed REA target must be a regular file within the authorized byte limit");
    const digest = createHash("sha256");
    const chunk = Buffer.allocUnsafe(64 * 1024);
    let bytes = 0;
    for (;;) {
      const count = readSync(fd, chunk, 0, chunk.length, null);
      if (count === 0) break;
      bytes += count;
      if (bytes > maxFileBytes) throw new Error("managed REA target exceeds byte limit");
      digest.update(chunk.subarray(0, count));
    }
    const after = fstatSync(fd);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs ||
      bytes !== after.size ||
      digest.digest("hex") !== target.sha256
    )
      throw new Error("managed REA target identity changed or hash mismatched");
  } finally {
    closeSync(fd);
  }
}

export function enforceManagedTool(input: ManagedToolInput): Record<string, unknown> {
  canonicalWorkspace(input.workspaceRoot);
  const args = { ...input.args };
  // A work-unit capability binds one standalone static tool to one verified file.
  // Session-open and target-affine tools are excluded because their provider
  // process, selected target and side effects are not proved by this boundary.
  if (input.tool.startsWith("rea_")) {
    const policy = input.reaStaticInspection;
    if (
      !["researcher", "validator"].includes(input.role) ||
      !policy ||
      !policy.tools.includes(input.tool) ||
      input.tool !== "rea_inspect_pe_imports"
    )
      throw new Error("unsupported managed REA operation or scope");
    const keys = Object.keys(args);
    if (
      !keys.includes("path") ||
      keys.some((key) => key !== "path" && key !== "max_file_bytes") ||
      args.path !== policy.path
    )
      throw new Error("managed REA inspection requires the exact authorized target path");
    const maxFileBytes = keys.includes("max_file_bytes")
      ? args.max_file_bytes
      : REA_DEFAULT_MAX_FILE_BYTES;
    if (
      typeof maxFileBytes !== "number" ||
      !Number.isSafeInteger(maxFileBytes) ||
      maxFileBytes < 1 ||
      maxFileBytes > REA_MAX_FILE_BYTES
    )
      throw new Error("managed REA inspection requires a bounded integer max_file_bytes");
    assertReaTarget(policy, maxFileBytes);
    return args;
  }
  if (["read", "grep", "glob", "list"].includes(input.tool)) return args;
  if (input.tool === "webfetch") {
    if (input.role !== "researcher") throw new Error("managed role cannot use webfetch");
    return args;
  }
  if (input.tool === "edit" || input.tool === "write") {
    if (input.role !== "implementer") throw new Error("managed role cannot edit workspace");
    args.filePath = scopedFile(input.workspaceRoot, args.filePath, input.allowedPaths);
    return args;
  }
  if (input.tool === "bash") {
    if (!["implementer", "validator"].includes(input.role))
      throw new Error("managed role has no shell authorization");
    if (
      typeof args.command !== "string" ||
      !args.command.trim() ||
      !input.commands.includes(args.command)
    )
      throw new Error("managed shell command requires exact verification authorization");
    assertSandboxAvailable();
    const masks: string[] = [];
    const declared = input.validationInputs ?? [];
    for (const hidden of input.hiddenPaths ?? []) {
      const scope = relativeScope(hidden);
      const absolute = path.join(input.workspaceRoot, scope.value);
      if (declared.includes(hidden)) continue;
      masks.push(
        ...(scope.directory ? ["--tmpfs", absolute] : ["--ro-bind", "/dev/null", absolute]),
      );
      if (scope.directory)
        for (const name of declared.filter((p) => p.startsWith(hidden))) {
          const filename = scopedFile(input.workspaceRoot, name, [name]);
          const parent = path.dirname(filename);
          if (parent !== absolute) masks.push("--dir", parent);
          masks.push("--ro-bind", filename, filename);
        }
    }
    args.command = [
      BWRAP,
      "--unshare-all",
      "--ro-bind",
      "/",
      "/",
      "--dev",
      "/dev",
      "--proc",
      "/proc",
      "--tmpfs",
      "/tmp",
      ...masks,
      "--chdir",
      input.workspaceRoot,
      "/bin/sh",
      "-c",
      args.command,
    ]
      .map(quote)
      .join(" ");
    args.workdir = input.workspaceRoot;
    return args;
  }
  throw new Error(
    `unsupported managed tool: ${input.tool}; patch, delegation, and unknown mutation surfaces are disabled`,
  );
}
