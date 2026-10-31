/** Explicit opt-in utilities. These never intercept native tools or require a stopped run. */
export {
  acquireArtifact,
  httpsFetcher,
} from "../../scripts/operator-approved-artifact-install.mts";
export { installArchive, verifyInstall } from "../../scripts/operator-approved-archive-install.mts";
export {
  planWin64Build,
  buildWin64Snapshot,
  planWin64Cases,
  runWin64Cases,
  planVerifiedWin64Relaunch,
  launchVerifiedWin64Snapshot,
  relaunchExistingWin64Snapshot,
} from "./external-win64-relaunch.ts";
export {
  loadRoutingConfigSelection,
  loadExternalRoutingPair,
  mergeExternalRoutingDocuments,
} from "../routing/routing-config-loader.ts";
export {
  normalizeAndValidateRoutingConfig,
  resolveRoutingDecision,
} from "../routing/routing-policy.ts";
export { expandIndexedReferences, validateUsageTelemetry } from "./context-budget.ts";
export { readCompactionHandoff, formatCompactionHandoff } from "./compaction-handoff.ts";

import { spawnSync } from "node:child_process";
import { lstatSync } from "node:fs";
import path from "node:path";

export interface GlobalBuildRequest {
  command: string;
  cwd: string;
  timeoutMs: number;
  maxOutputBytes: number;
  scriptPolicy: "allow-exact-command";
}
interface BuildObservation {
  status: number | null;
  signal?: string | null;
  error?: { message: string };
  stdout?: string;
  stderr?: string;
}

/** Explicit native-policy equivalent of recovery build. Offline input intent is not a network sandbox. */
export async function runGlobalBuild(
  request: GlobalBuildRequest,
  approve: (challenge: string) => Promise<string>,
  execute: (
    command: string,
    options: { cwd: string; timeout: number; maxBuffer: number },
  ) => BuildObservation = (command, options) =>
    spawnSync("/bin/sh", ["-c", command], {
      ...options,
      encoding: "utf8",
      env: { ...process.env, npm_config_offline: "true" },
    }),
) {
  if (
    Object.keys(request).sort().join() !== "command,cwd,maxOutputBytes,scriptPolicy,timeoutMs" ||
    typeof request.command !== "string" ||
    !request.command.trim() ||
    request.command.length > 16384 ||
    request.command.includes("\0") ||
    !path.isAbsolute(request.cwd) ||
    path.resolve(request.cwd) !== request.cwd ||
    !Number.isSafeInteger(request.timeoutMs) ||
    request.timeoutMs < 1 ||
    request.timeoutMs > 300000 ||
    !Number.isSafeInteger(request.maxOutputBytes) ||
    request.maxOutputBytes < 1 ||
    request.maxOutputBytes > 1048576 ||
    request.scriptPolicy !== "allow-exact-command"
  )
    throw new Error("invalid exact offline build request");
  const check = () => {
    let current = path.parse(request.cwd).root;
    for (const component of request.cwd.slice(current.length).split(path.sep)) {
      current = path.join(current, component);
      const stat = lstatSync(current);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("unsafe build directory");
    }
  };
  check();
  const challenge = "APPROVE BUILD " + JSON.stringify(request);
  if ((await approve(challenge)) !== challenge) throw new Error("exact build approval required");
  check();
  const result = execute(request.command, {
    cwd: request.cwd,
    timeout: request.timeoutMs,
    maxBuffer: request.maxOutputBytes,
  });
  return {
    exitCode: result.status,
    signal: result.signal ?? null,
    error: result.error?.message ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    cwd: request.cwd,
    networkIsolation: "native-policy",
    accepted: false,
  };
}
