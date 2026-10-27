/** Optional, operator-pinned action outside managed verification. Never a managed gate. */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { lstatSync, readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
const nativeRun = (file, args, limits) => {
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
function scriptIdentity(workspaceRoot) {
    const script = path.join(workspaceRoot, "scripts", "launch_local_play.ps1");
    const stat = lstatSync(script);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
        throw new Error("external Win64 launch script is not a regular bounded file");
    return { script, sha256: createHash("sha256").update(readFileSync(script)).digest("hex") };
}
function windowsScriptPath(script, run) {
    const converted = run("/usr/bin/wslpath", ["-w", script]);
    if (converted.error || converted.status !== 0 || !converted.stdout.trim())
        throw new Error("Windows script path conversion failed");
    const windowsScript = converted.stdout.trim();
    if (!/^\\\\wsl(?:\.localhost|\$)\\[^\r\n]+\\scripts\\launch_local_play\.ps1$/i.test(windowsScript))
        throw new Error("Windows script path is not a WSL project script");
    return windowsScript;
}
function sourceTreeSha256(workspaceRoot) {
    const records = [];
    let count = 0;
    let total = 0;
    const visit = (relative) => {
        const filename = path.join(workspaceRoot, relative);
        const before = lstatSync(filename);
        if (before.isSymbolicLink() || (before.mode & 0o022) !== 0)
            throw new Error(`unsafe Win64 source input: ${relative}`);
        if (before.isDirectory()) {
            for (const name of readdirSync(filename).sort())
                visit(`${relative}/${name}`);
            return;
        }
        if (!before.isFile() || ++count > 1024 || (total += before.size) > 512 * 1024 * 1024)
            throw new Error("Win64 source inventory exceeds file or byte limit");
        const sha = createHash("sha256").update(readFileSync(filename)).digest("hex");
        const after = lstatSync(filename);
        if (before.dev !== after.dev ||
            before.ino !== after.ino ||
            before.size !== after.size ||
            before.mtimeMs !== after.mtimeMs)
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
export function planWin64Build(workspaceRoot, snapshot, run = nativeRun) {
    if (!SNAPSHOT.test(snapshot))
        throw new Error("invalid new Win64 snapshot name");
    if (process.platform !== "linux")
        throw new Error("Win64 build requires WSL Linux");
    const { script, sha256 } = scriptIdentity(workspaceRoot);
    const windowsScript = windowsScriptPath(script, run);
    const result = run("/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        windowsScript,
        "-Snapshot",
        snapshot,
        "-Plan",
    ], { timeoutMs: 30000, maxOutputBytes: 16384 });
    if (result.error || result.status !== 0)
        throw new Error("Win64 build plan failed");
    let value;
    try {
        value = JSON.parse(result.stdout.trim());
    }
    catch {
        throw new Error("Win64 build plan is not JSON");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Win64 build plan is invalid");
    const plan = value;
    if (plan.snapshot !== snapshot ||
        plan.engineVersion !== "5.8.3" ||
        plan.exists !== false ||
        typeof plan.destination !== "string" ||
        !WINDOWS_PATH.test(plan.destination) ||
        plan.destination.split("\\").some((part) => part === "." || part === ".."))
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
export function buildWin64Snapshot(workspaceRoot, request, run = nativeRun) {
    if (!Number.isSafeInteger(request.timeoutMs) ||
        request.timeoutMs < 1 ||
        request.timeoutMs > 7200000 ||
        !Number.isSafeInteger(request.maxOutputBytes) ||
        request.maxOutputBytes < 1 ||
        request.maxOutputBytes > 16777216 ||
        !SHA256.test(request.scriptSha256) ||
        !SHA256.test(request.sourceSha256))
        throw new Error("Win64 build limits or hashes are invalid");
    const current = planWin64Build(workspaceRoot, request.snapshot, run);
    for (const key of [
        "destination",
        "scriptSha256",
        "sourceSha256",
        "scriptPolicy",
        "permittedWrites",
    ])
        if (request[key] !== current[key])
            throw new Error(`Win64 build plan changed: ${key}`);
    const windowsScript = windowsScriptPath(scriptIdentity(workspaceRoot).script, run);
    const result = run("/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe", [
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
    ], { timeoutMs: request.timeoutMs, maxOutputBytes: request.maxOutputBytes });
    const after = sourceTreeSha256(workspaceRoot);
    if (after !== request.sourceSha256)
        throw new Error("Win64 source changed during build; retain snapshot for inspection");
    if (result.error || result.status !== 0)
        return {
            status: "failed",
            managedGate: false,
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
    const manifest = path.join(destination, "local-play-build.json");
    if (!existsSync(manifest))
        throw new Error("Win64 build returned success without snapshot manifest");
    const bytes = readFileSync(manifest);
    const data = JSON.parse(bytes.toString("utf8"));
    if (data.snapshot !== request.snapshot ||
        data.engineVersion !== "5.8.3" ||
        !Array.isArray(data.source) ||
        !Array.isArray(data.modules) ||
        data.modules.length !== 3)
        throw new Error("Win64 build manifest is incomplete");
    return {
        status: "built",
        managedGate: false,
        snapshot: request.snapshot,
        destination: request.destination,
        exitCode: 0,
        manifestSha256: createHash("sha256").update(bytes).digest("hex"),
        sourceSha256: request.sourceSha256,
        inputCount: data.source.length,
        moduleCount: data.modules.length,
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
];
export function planWin64Cases(workspaceRoot, snapshot, run = nativeRun) {
    if (!SNAPSHOT.test(snapshot))
        throw new Error("invalid Win64 snapshot name");
    if (process.platform !== "linux")
        throw new Error("Win64 cases require WSL Linux");
    const { script, sha256 } = scriptIdentity(workspaceRoot);
    const windowsScript = windowsScriptPath(script, run);
    const result = run("/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe", [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        windowsScript,
        "-Snapshot",
        snapshot,
        "-Plan",
    ], { timeoutMs: 30000, maxOutputBytes: 16384 });
    if (result.error || result.status !== 0)
        throw new Error("Win64 cases plan failed");
    let value;
    try {
        value = JSON.parse(result.stdout.trim());
    }
    catch {
        throw new Error("Win64 cases plan is not JSON");
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw new Error("Win64 cases plan is invalid");
    const planned = value;
    if (planned.snapshot !== snapshot ||
        planned.engineVersion !== "5.8.3" ||
        planned.exists !== true ||
        typeof planned.destination !== "string" ||
        !WINDOWS_PATH.test(planned.destination) ||
        planned.destination.split("\\").some((part) => part === "." || part === ".."))
        throw new Error("Win64 cases destination is absent or invalid");
    const converted = run("/usr/bin/wslpath", ["-u", planned.destination]);
    if (converted.error || converted.status !== 0 || !converted.stdout.trim())
        throw new Error("Win64 cases path conversion failed");
    const destination = converted.stdout.trim();
    const manifestPath = path.join(destination, "local-play-build.json");
    const bytes = readFileSync(manifestPath);
    const manifest = JSON.parse(bytes.toString("utf8"));
    if (manifest.snapshot !== snapshot ||
        manifest.engineVersion !== "5.8.3" ||
        !Array.isArray(manifest.source) ||
        !Array.isArray(manifest.modules) ||
        manifest.modules.length !== 3)
        throw new Error("Win64 cases snapshot manifest is incomplete");
    const caseLog = `${planned.destination}\\OpenCourtAutomation-${snapshot}.log`;
    if (existsSync(path.join(destination, `OpenCourtAutomation-${snapshot}.log`)))
        throw new Error("Win64 cases log already exists");
    return {
        snapshot,
        destination: planned.destination,
        scriptSha256: sha256,
        sourceSha256: sourceTreeSha256(workspaceRoot),
        manifestSha256: createHash("sha256").update(bytes).digest("hex"),
        caseLog,
        scriptPolicy: "allow-exact-script",
        permittedWrites: "new-case-log-and-snapshot-generated-only",
    };
}
export function runWin64Cases(workspaceRoot, request, run = nativeRun) {
    if (!Number.isSafeInteger(request.timeoutMs) ||
        request.timeoutMs < 1 ||
        request.timeoutMs > 3600000 ||
        !Number.isSafeInteger(request.maxOutputBytes) ||
        request.maxOutputBytes < 1 ||
        request.maxOutputBytes > 16777216)
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
    ])
        if (request[key] !== planned[key])
            throw new Error(`Win64 cases plan changed: ${key}`);
    const windowsScript = windowsScriptPath(scriptIdentity(workspaceRoot).script, run);
    const result = run("/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe", [
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
    ], { timeoutMs: request.timeoutMs, maxOutputBytes: request.maxOutputBytes });
    if (sourceTreeSha256(workspaceRoot) !== request.sourceSha256)
        throw new Error("Win64 source changed during cases; retain log for inspection");
    const converted = run("/usr/bin/wslpath", ["-u", request.destination]);
    if (converted.error || converted.status !== 0 || !converted.stdout.trim())
        throw new Error("Win64 cases path conversion failed after execution");
    const destination = converted.stdout.trim();
    const manifestBytes = readFileSync(path.join(destination, "local-play-build.json"));
    if (createHash("sha256").update(manifestBytes).digest("hex") !== request.manifestSha256)
        throw new Error("Win64 snapshot manifest changed during cases");
    const logPath = path.join(destination, `OpenCourtAutomation-${request.snapshot}.log`);
    const logBytes = existsSync(logPath) ? readFileSync(logPath) : null;
    const log = logBytes?.toString("utf8") ?? "";
    const results = [
        ...log.matchAll(/Result=\{([^}]+)\} Name=\{OpenCourt\.Player\.ExperimentalMovement\.([^}]+)\}/g),
    ].map((match) => ({ outcome: match[1], name: match[2] }));
    const cases = NATIVE_CASES.map((name) => ({
        name,
        passed: results.filter((item) => item.name === name && item.outcome === "Success").length === 1 &&
            results.filter((item) => item.name === name).length === 1,
    }));
    const passed = result.status === 0 &&
        !result.error &&
        logBytes !== null &&
        results.length === NATIVE_CASES.length &&
        cases.every((item) => item.passed) &&
        /9 tests performed/i.test(log);
    return {
        status: passed ? "passed" : "failed",
        managedGate: false,
        snapshot: request.snapshot,
        destination: request.destination,
        exitCode: result.status,
        error: result.error?.message ?? null,
        cases,
        caseLog: request.caseLog,
        logSha256: logBytes ? createHash("sha256").update(logBytes).digest("hex") : null,
        output: `${result.stdout}\n${result.stderr}`.slice(-4096),
    };
}
export function parseWin64RelaunchPolicy(value) {
    if (value === undefined)
        return null;
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch {
        throw new Error("invalid external Win64 relaunch policy");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("invalid external Win64 relaunch policy");
    const policy = parsed;
    if (Object.keys(policy).sort().join(",") !== "scriptSha256,snapshot" ||
        typeof policy.snapshot !== "string" ||
        !/^OpenCourtPlayProbe-[A-Za-z0-9_-]+$/.test(policy.snapshot) ||
        typeof policy.scriptSha256 !== "string" ||
        !/^[a-f0-9]{64}$/.test(policy.scriptSha256))
        throw new Error("invalid external Win64 relaunch policy");
    return { snapshot: policy.snapshot, scriptSha256: policy.scriptSha256 };
}
export function relaunchExistingWin64Snapshot(workspaceRoot, policy, requestedSnapshot, run = nativeRun) {
    if (requestedSnapshot !== policy.snapshot)
        throw new Error("snapshot is not operator-authorized");
    if (process.platform !== "linux")
        throw new Error("Win64 relaunch requires WSL Linux");
    const script = path.join(workspaceRoot, "scripts", "launch_local_play.ps1");
    const stat = lstatSync(script);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024)
        throw new Error("external Win64 launch script is not a regular bounded file");
    const digest = createHash("sha256").update(readFileSync(script)).digest("hex");
    if (digest !== policy.scriptSha256)
        throw new Error("external Win64 launch script hash changed");
    const converted = run("/usr/bin/wslpath", ["-w", script]);
    if (converted.error || converted.status !== 0 || !converted.stdout.trim())
        throw new Error("Windows script path conversion failed");
    const windowsScript = converted.stdout.trim();
    if (!/^\\\\wsl(?:\.localhost|\$)\\[^\r\n]+\\scripts\\launch_local_play\.ps1$/i.test(windowsScript))
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
    if (!result.stdout.includes(`Started ${requestedSnapshot} (PID `) &&
        !result.stdout.includes(`Already running ${requestedSnapshot} (PID `))
        throw new Error("Windows relaunch did not report the selected snapshot PID");
    return {
        status: "launched",
        managedGate: false,
        snapshot: requestedSnapshot,
        nativeExitCode: 0,
        output: result.stdout.trim().slice(0, 1024),
    };
}
