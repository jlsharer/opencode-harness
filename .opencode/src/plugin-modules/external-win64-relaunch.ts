/** Optional, operator-pinned action outside managed verification. Never a managed gate. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";

export interface Win64RelaunchPolicy {
  snapshot: string;
  scriptSha256: string;
}

type Run = (
  file: string,
  args: string[],
  limits?: { timeoutMs: number; maxOutputBytes: number },
) => {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

const nativeRun: Run = (file, args, limits) => {
  const result = spawnSync(file, args, {
    encoding: "utf8",
    timeout: limits?.timeoutMs ?? 120000,
    maxBuffer: limits?.maxOutputBytes ?? 16384,
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...(result.error ? { error: result.error } : {}),
  };
};

const SNAPSHOT = /^OpenCourtPlayProbe-[A-Za-z0-9_-]+$/;
const SHA256 = /^[a-f0-9]{64}$/;
const WINDOWS_PATH = /^[A-Za-z]:\\[^\r\n<>:"|?*]+$/;

function scriptIdentity(workspaceRoot: string): { script: string; sha256: string } {
  const script = path.join(workspaceRoot, "scripts", "launch_local_play.ps1");
  const stat = lstatSync(script);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
    throw new Error("external Win64 launch script is not a regular bounded file");
  return { script, sha256: createHash("sha256").update(readFileSync(script)).digest("hex") };
}

function windowsScriptPath(script: string, run: Run): string {
  const converted = run("/usr/bin/wslpath", ["-w", script]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Windows script path conversion failed");
  const windowsScript = converted.stdout.trim();
  if (
    !/^\\\\wsl(?:\.localhost|\$)\\[^\r\n]+\\scripts\\launch_local_play\.ps1$/i.test(windowsScript)
  )
    throw new Error("Windows script path is not a WSL project script");
  return windowsScript;
}

function sourceTreeSha256(workspaceRoot: string): string {
  const records: string[] = [];
  let count = 0;
  let total = 0;
  const visit = (relative: string): void => {
    const filename = path.join(workspaceRoot, relative);
    const before = lstatSync(filename);
    if (before.isSymbolicLink() || (before.mode & 0o022) !== 0)
      throw new Error(`unsafe Win64 source input: ${relative}`);
    if (before.isDirectory()) {
      for (const name of readdirSync(filename).sort()) visit(`${relative}/${name}`);
      return;
    }
    if (!before.isFile() || ++count > 1024 || (total += before.size) > 512 * 1024 * 1024)
      throw new Error("Win64 source inventory exceeds file or byte limit");
    const sha = createHash("sha256").update(readFileSync(filename)).digest("hex");
    const after = lstatSync(filename);
    if (
      before.dev !== after.dev ||
      before.ino !== after.ino ||
      before.size !== after.size ||
      before.mtimeMs !== after.mtimeMs
    )
      throw new Error(`Win64 source input changed during hash: ${relative}`);
    records.push(`${relative}\0${sha}`);
  };
  for (const relative of [
    "OpenCourt.uproject",
    "Config",
    "Content",
    "Source",
    "scripts/launch_local_play.ps1",
  ])
    visit(relative);
  return createHash("sha256").update(records.sort().join("\n")).digest("hex");
}

function parseManifest(bytes: Buffer): Record<string, unknown> {
  if (bytes.length < 2 || bytes.length > 1024 * 1024)
    throw new Error("Win64 snapshot manifest size is invalid");
  const text = bytes.toString("utf8").replace(/^\uFEFF/, "");
  const value: unknown = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Win64 snapshot manifest is invalid");
  return value as Record<string, unknown>;
}

function manifestFile(base: string, relative: string): string {
  const parts = relative.replaceAll("\\", "/").split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || /[:\0]/.test(part)))
    throw new Error("unsafe Win64 snapshot manifest path");
  let current = base;
  for (const part of parts) {
    current = path.join(current, part);
    if (lstatSync(current).isSymbolicLink())
      throw new Error("symlink in Win64 snapshot manifest path");
  }
  if (!lstatSync(current).isFile()) throw new Error("non-file Win64 snapshot manifest entry");
  return current;
}

function verifyManifestFiles(workspaceRoot: string, destination: string, snapshot: string) {
  const manifestPath = manifestFile(destination, "local-play-build.json");
  const bytes = readFileSync(manifestPath);
  const manifest = parseManifest(bytes);
  if (
    manifest.snapshot !== snapshot ||
    manifest.engineVersion !== "5.8.3" ||
    !Array.isArray(manifest.source) ||
    !Array.isArray(manifest.modules) ||
    manifest.source.length < 5 ||
    manifest.source.length > 1024 ||
    manifest.modules.length !== 3
  )
    throw new Error("Win64 snapshot manifest is incomplete");
  const expectedModules = new Set([
    "Binaries/Win64/UnrealEditor-OpenCourt.dll",
    "Binaries/Win64/UnrealEditor-OpenCourtSimCore.dll",
    "Binaries/Win64/UnrealEditor-OpenCourtSimTests.dll",
  ]);
  const seen = new Set<string>();
  let verifiedBytes = 0;
  const verifyEntry = (raw: unknown, group: "source" | "modules") => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      throw new Error("Win64 snapshot manifest entry is invalid");
    const entry = raw as Record<string, unknown>;
    if (
      typeof entry.path !== "string" ||
      typeof entry.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/i.test(entry.sha256)
    )
      throw new Error("Win64 snapshot manifest hash is invalid");
    const relative = entry.path.replaceAll("\\", "/");
    const key = relative.toLowerCase();
    if (seen.has(key)) throw new Error("duplicate Win64 snapshot manifest path");
    seen.add(key);
    if (
      group === "source" &&
      relative !== "OpenCourt.uproject" &&
      !/^(Config|Content|Source)\//.test(relative)
    )
      throw new Error("Win64 snapshot source path is out of scope");
    if (group === "modules" && !expectedModules.has(relative))
      throw new Error("Win64 snapshot module path is out of scope");
    for (const base of group === "source" ? [workspaceRoot, destination] : [destination]) {
      const file = manifestFile(base, relative);
      const content = readFileSync(file);
      verifiedBytes += content.length;
      if (verifiedBytes > 1024 * 1024 * 1024)
        throw new Error("Win64 snapshot verification byte limit exceeded");
      if (createHash("sha256").update(content).digest("hex") !== entry.sha256.toLowerCase())
        throw new Error(`Win64 snapshot hash mismatch: ${relative}`);
    }
  };
  for (const entry of manifest.source) verifyEntry(entry, "source");
  for (const entry of manifest.modules) verifyEntry(entry, "modules");
  if ([...expectedModules].some((item) => !seen.has(item.toLowerCase())))
    throw new Error("Win64 snapshot module inventory is incomplete");
  return {
    manifestSha256: createHash("sha256").update(bytes).digest("hex"),
    inputCount: manifest.source.length,
    moduleCount: manifest.modules.length,
  };
}

export interface Win64BuildPlan {
  snapshot: string;
  destination: string;
  scriptSha256: string;
  sourceSha256: string;
  scriptPolicy: "allow-exact-script";
  permittedWrites: "new-snapshot-only";
}

export function planWin64Build(
  workspaceRoot: string,
  snapshot: string,
  run: Run = nativeRun,
): Win64BuildPlan {
  if (!SNAPSHOT.test(snapshot)) throw new Error("invalid new Win64 snapshot name");
  if (process.platform !== "linux") throw new Error("Win64 build requires WSL Linux");
  const { script, sha256 } = scriptIdentity(workspaceRoot);
  const windowsScript = windowsScriptPath(script, run);
  const result = run(
    "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      windowsScript,
      "-Snapshot",
      snapshot,
      "-Plan",
    ],
    { timeoutMs: 30000, maxOutputBytes: 16384 },
  );
  if (result.error || result.status !== 0) throw new Error("Win64 build plan failed");
  let value: unknown;
  try {
    value = JSON.parse(result.stdout.trim());
  } catch {
    throw new Error("Win64 build plan is not JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Win64 build plan is invalid");
  const plan = value as Record<string, unknown>;
  if (
    plan.snapshot !== snapshot ||
    plan.engineVersion !== "5.8.3" ||
    plan.exists !== false ||
    typeof plan.destination !== "string" ||
    !WINDOWS_PATH.test(plan.destination) ||
    plan.destination.split("\\").some((part) => part === "." || part === "..")
  )
    throw new Error("Win64 snapshot destination is occupied or invalid");
  return {
    snapshot,
    destination: plan.destination,
    scriptSha256: sha256,
    sourceSha256: sourceTreeSha256(workspaceRoot),
    scriptPolicy: "allow-exact-script",
    permittedWrites: "new-snapshot-only",
  };
}

export interface Win64BuildRequest extends Win64BuildPlan {
  timeoutMs: number;
  maxOutputBytes: number;
}

export function buildWin64Snapshot(
  workspaceRoot: string,
  request: Win64BuildRequest,
  run: Run = nativeRun,
) {
  if (
    !Number.isSafeInteger(request.timeoutMs) ||
    request.timeoutMs < 1 ||
    request.timeoutMs > 7200000 ||
    !Number.isSafeInteger(request.maxOutputBytes) ||
    request.maxOutputBytes < 1 ||
    request.maxOutputBytes > 16777216 ||
    !SHA256.test(request.scriptSha256) ||
    !SHA256.test(request.sourceSha256)
  )
    throw new Error("Win64 build limits or hashes are invalid");
  const current = planWin64Build(workspaceRoot, request.snapshot, run);
  for (const key of [
    "destination",
    "scriptSha256",
    "sourceSha256",
    "scriptPolicy",
    "permittedWrites",
  ] as const)
    if (request[key] !== current[key]) throw new Error(`Win64 build plan changed: ${key}`);
  const windowsScript = windowsScriptPath(scriptIdentity(workspaceRoot).script, run);
  const result = run(
    "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      windowsScript,
      "-Snapshot",
      request.snapshot,
      "-Prepare",
      "-NoLaunch",
      "-ExpectedDestination",
      request.destination,
    ],
    { timeoutMs: request.timeoutMs, maxOutputBytes: request.maxOutputBytes },
  );
  const after = sourceTreeSha256(workspaceRoot);
  if (after !== request.sourceSha256)
    throw new Error("Win64 source changed during build; retain snapshot for inspection");
  if (result.error || result.status !== 0)
    return {
      status: "failed" as const,
      managedGate: false as const,
      snapshot: request.snapshot,
      destination: request.destination,
      exitCode: result.status,
      error: result.error?.message ?? null,
      output: `${result.stdout}\n${result.stderr}`.slice(-4096),
    };
  const converted = run("/usr/bin/wslpath", ["-u", request.destination]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("built snapshot path conversion failed");
  const destination = converted.stdout.trim();
  const proof = verifyManifestFiles(workspaceRoot, destination, request.snapshot);
  return {
    status: "built" as const,
    managedGate: false as const,
    snapshot: request.snapshot,
    destination: request.destination,
    exitCode: 0 as const,
    manifestSha256: proof.manifestSha256,
    sourceSha256: request.sourceSha256,
    inputCount: proof.inputCount,
    moduleCount: proof.moduleCount,
  };
}

const NATIVE_CASES = [
  "AxisAndPawn",
  "BallContact",
  "BallContactNoContact",
  "CameraFacingPlayer",
  "CameraFollowProxy",
  "FreeHandPhysicalHit",
  "JumpLanding",
  "PlayScene",
  "UnsupportedAndNonFloor",
] as const;

export interface Win64CasesPlan {
  snapshot: string;
  destination: string;
  scriptSha256: string;
  sourceSha256: string;
  manifestSha256: string;
  caseLog: string;
  scriptPolicy: "allow-exact-script";
  permittedWrites: "new-case-log-and-snapshot-generated-only";
}

export function verifyWin64Snapshot(workspaceRoot: string, snapshot: string, run: Run = nativeRun) {
  if (!SNAPSHOT.test(snapshot)) throw new Error("invalid Win64 snapshot name");
  if (process.platform !== "linux") throw new Error("Win64 verification requires WSL Linux");
  const { script, sha256 } = scriptIdentity(workspaceRoot);
  const windowsScript = windowsScriptPath(script, run);
  const result = run(
    "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      windowsScript,
      "-Snapshot",
      snapshot,
      "-Plan",
    ],
    { timeoutMs: 30000, maxOutputBytes: 16384 },
  );
  if (result.error || result.status !== 0) throw new Error("Win64 snapshot plan failed");
  let value: unknown;
  try {
    value = JSON.parse(result.stdout.trim());
  } catch {
    throw new Error("Win64 snapshot plan is not JSON");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Win64 snapshot plan is invalid");
  const planned = value as Record<string, unknown>;
  if (
    planned.snapshot !== snapshot ||
    planned.engineVersion !== "5.8.3" ||
    planned.exists !== true ||
    typeof planned.destination !== "string" ||
    !WINDOWS_PATH.test(planned.destination) ||
    planned.destination.split("\\").some((part) => part === "." || part === "..")
  )
    throw new Error("Win64 snapshot destination is absent or invalid");
  const converted = run("/usr/bin/wslpath", ["-u", planned.destination]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Win64 snapshot path conversion failed");
  const destination = converted.stdout.trim();
  const proof = verifyManifestFiles(workspaceRoot, destination, snapshot);
  return {
    status: "verified" as const,
    managedGate: false as const,
    buildExitCode: "not-observed" as const,
    snapshot,
    destination: planned.destination,
    scriptSha256: sha256,
    sourceSha256: sourceTreeSha256(workspaceRoot),
    ...proof,
  };
}

export function planWin64Cases(
  workspaceRoot: string,
  snapshot: string,
  run: Run = nativeRun,
): Win64CasesPlan {
  const verified = verifyWin64Snapshot(workspaceRoot, snapshot, run);
  const converted = run("/usr/bin/wslpath", ["-u", verified.destination]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Win64 cases path conversion failed");
  const destination = converted.stdout.trim();
  const caseLog = `${verified.destination}\\OpenCourtAutomation-${snapshot}.log`;
  if (existsSync(path.join(destination, `OpenCourtAutomation-${snapshot}.log`)))
    throw new Error("Win64 cases log already exists");
  return {
    snapshot,
    destination: verified.destination,
    scriptSha256: verified.scriptSha256,
    sourceSha256: verified.sourceSha256,
    manifestSha256: verified.manifestSha256,
    caseLog,
    scriptPolicy: "allow-exact-script",
    permittedWrites: "new-case-log-and-snapshot-generated-only",
  };
}

export interface Win64CasesRequest extends Win64CasesPlan {
  timeoutMs: number;
  maxOutputBytes: number;
}

export function runWin64Cases(
  workspaceRoot: string,
  request: Win64CasesRequest,
  run: Run = nativeRun,
) {
  if (
    !Number.isSafeInteger(request.timeoutMs) ||
    request.timeoutMs < 1 ||
    request.timeoutMs > 3600000 ||
    !Number.isSafeInteger(request.maxOutputBytes) ||
    request.maxOutputBytes < 1 ||
    request.maxOutputBytes > 16777216
  )
    throw new Error("Win64 cases limits are invalid");
  const planned = planWin64Cases(workspaceRoot, request.snapshot, run);
  for (const key of [
    "destination",
    "scriptSha256",
    "sourceSha256",
    "manifestSha256",
    "caseLog",
    "scriptPolicy",
    "permittedWrites",
  ] as const)
    if (request[key] !== planned[key]) throw new Error(`Win64 cases plan changed: ${key}`);
  const windowsScript = windowsScriptPath(scriptIdentity(workspaceRoot).script, run);
  const result = run(
    "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      windowsScript,
      "-Snapshot",
      request.snapshot,
      "-Cases",
      "-ExpectedDestination",
      request.destination,
    ],
    { timeoutMs: request.timeoutMs, maxOutputBytes: request.maxOutputBytes },
  );
  if (sourceTreeSha256(workspaceRoot) !== request.sourceSha256)
    throw new Error("Win64 source changed during cases; retain log for inspection");
  const converted = run("/usr/bin/wslpath", ["-u", request.destination]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Win64 cases path conversion failed after execution");
  const destination = converted.stdout.trim();
  const proof = verifyManifestFiles(workspaceRoot, destination, request.snapshot);
  if (proof.manifestSha256 !== request.manifestSha256)
    throw new Error("Win64 snapshot manifest changed during cases");
  const observed = verifyWin64CaseLog(workspaceRoot, request.snapshot, run);
  return {
    status:
      observed.status === "pending"
        ? ("pending" as const)
        : observed.status === "failed"
          ? ("failed" as const)
          : result.status === 0 && !result.error
            ? ("passed" as const)
            : ("unconfirmed" as const),
    managedGate: false as const,
    snapshot: request.snapshot,
    destination: request.destination,
    exitCode: result.status,
    error: result.error?.message ?? null,
    cases: observed.cases,
    caseLog: request.caseLog,
    logSha256: observed.logSha256,
    output: `${result.stdout}\n${result.stderr}`.slice(-4096),
  };
}

/** Read-only recovery for a native process that outlived its PowerShell caller. */
export function verifyWin64CaseLog(workspaceRoot: string, snapshot: string, run: Run = nativeRun) {
  const verified = verifyWin64Snapshot(workspaceRoot, snapshot, run);
  const converted = run("/usr/bin/wslpath", ["-u", verified.destination]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Win64 cases path conversion failed");
  const logPath = path.join(converted.stdout.trim(), `OpenCourtAutomation-${snapshot}.log`);
  const logBytes = existsSync(logPath) ? readFileSync(logPath) : null;
  const log = logBytes?.toString("utf8") ?? "";
  const results = [
    ...log.matchAll(
      /Result=\{([^}]+)\} Name=\{([^}]+)\} Path=\{OpenCourt\.Player\.ExperimentalMovement\.([^}]+)\}/g,
    ),
  ].map((match) => ({ outcome: match[1], name: match[2], pathName: match[3] }));
  const cases = NATIVE_CASES.map((name) => ({
    name,
    passed:
      results.filter(
        (item) => item.name === name && item.pathName === name && item.outcome === "Success",
      ).length === 1 &&
      results.filter((item) => item.name === name || item.pathName === name).length === 1,
  }));
  const complete =
    /9 tests performed/i.test(log) && /TestExit: Automation Test Queue Empty/i.test(log);
  return {
    status: !complete
      ? ("pending" as const)
      : results.length === NATIVE_CASES.length && cases.every((item) => item.passed)
        ? ("observed-pass" as const)
        : ("failed" as const),
    managedGate: false as const,
    snapshot,
    buildExitCode: "not-observed" as const,
    caseProcessExitCode: "not-observed" as const,
    manifestSha256: verified.manifestSha256,
    cases,
    caseLog: `${verified.destination}\\OpenCourtAutomation-${snapshot}.log`,
    logSha256: logBytes ? createHash("sha256").update(logBytes).digest("hex") : null,
  };
}

export function parseWin64RelaunchPolicy(value: string | undefined): Win64RelaunchPolicy | null {
  if (value === undefined) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("invalid external Win64 relaunch policy");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("invalid external Win64 relaunch policy");
  const policy = parsed as Record<string, unknown>;
  if (
    Object.keys(policy).sort().join(",") !== "scriptSha256,snapshot" ||
    typeof policy.snapshot !== "string" ||
    !/^OpenCourtPlayProbe-[A-Za-z0-9_-]+$/.test(policy.snapshot) ||
    typeof policy.scriptSha256 !== "string" ||
    !/^[a-f0-9]{64}$/.test(policy.scriptSha256)
  )
    throw new Error("invalid external Win64 relaunch policy");
  return { snapshot: policy.snapshot, scriptSha256: policy.scriptSha256 };
}

export function relaunchExistingWin64Snapshot(
  workspaceRoot: string,
  policy: Win64RelaunchPolicy,
  requestedSnapshot: string,
  run: Run = nativeRun,
): { status: "launched"; managedGate: false; snapshot: string; nativeExitCode: 0; output: string } {
  if (requestedSnapshot !== policy.snapshot) throw new Error("snapshot is not operator-authorized");
  if (process.platform !== "linux") throw new Error("Win64 relaunch requires WSL Linux");
  const script = path.join(workspaceRoot, "scripts", "launch_local_play.ps1");
  const stat = lstatSync(script);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
    throw new Error("external Win64 launch script is not a regular bounded file");
  const digest = createHash("sha256").update(readFileSync(script)).digest("hex");
  if (digest !== policy.scriptSha256) throw new Error("external Win64 launch script hash changed");
  const converted = run("/usr/bin/wslpath", ["-w", script]);
  if (converted.error || converted.status !== 0 || !converted.stdout.trim())
    throw new Error("Windows script path conversion failed");
  const windowsScript = converted.stdout.trim();
  if (
    !/^\\\\wsl(?:\.localhost|\$)\\[^\r\n]+\\scripts\\launch_local_play\.ps1$/i.test(windowsScript)
  )
    throw new Error("Windows script path is not a WSL project script");
  // The per-process policy is needed for UNC scripts; it does not change global PowerShell settings.
  const result = run("/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    windowsScript,
    "-Snapshot",
    requestedSnapshot,
  ]);
  if (result.error || result.status !== 0)
    throw new Error(`existing Win64 snapshot relaunch failed (exit ${String(result.status)})`);
  if (
    !result.stdout.includes(`Started ${requestedSnapshot} (PID `) &&
    !result.stdout.includes(`Already running ${requestedSnapshot} (PID `)
  )
    throw new Error("Windows relaunch did not report the selected snapshot PID");
  return {
    status: "launched",
    managedGate: false,
    snapshot: requestedSnapshot,
    nativeExitCode: 0,
    output: result.stdout.trim().slice(0, 1024),
  };
}
