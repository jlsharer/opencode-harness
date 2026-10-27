/** Optional, operator-pinned action outside managed verification. Never a managed gate. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

export interface Win64RelaunchPolicy {
  snapshot: string;
  scriptSha256: string;
}

type Run = (
  file: string,
  args: string[],
) => {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

const nativeRun: Run = (file, args) => {
  const result = spawnSync(file, args, {
    encoding: "utf8",
    timeout: 120000,
    maxBuffer: 16384,
    windowsHide: true,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    ...(result.error ? { error: result.error } : {}),
  };
};

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
