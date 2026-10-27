import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, unlinkSync, readFileSync, copyFileSync, } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseWin64RelaunchPolicy, relaunchExistingWin64Snapshot, planWin64Build, buildWin64Snapshot, planWin64Cases, runWin64Cases, verifyWin64Snapshot, verifyWin64CaseLog, } from "./external-win64-relaunch.js";
const snapshot = "OpenCourtPlayProbe-DirectionalMannyR1-20261026";
const bytes = "# pinned local play script\n";
const hash = createHash("sha256").update(bytes).digest("hex");
const sourceFiles = [
    "OpenCourt.uproject",
    "Config/DefaultEngine.ini",
    "Config/DefaultInput.ini",
    "Content/README.md",
    "Source/Pawn.cpp",
];
const modules = ["OpenCourt", "OpenCourtSimCore", "OpenCourtSimTests"];
function fixtureSnapshot(workspace, destination, named) {
    mkdirSync(destination);
    for (const directory of ["Config", "Content", "Source", "Binaries", "Binaries/Win64"])
        mkdirSync(path.join(destination, directory), { recursive: true });
    const source = sourceFiles.map((relative) => {
        const from = path.join(workspace, relative);
        const to = path.join(destination, relative);
        copyFileSync(from, to);
        return {
            path: relative.replaceAll("/", "\\"),
            sha256: createHash("sha256").update(readFileSync(from)).digest("hex").toUpperCase(),
        };
    });
    const moduleEntries = modules.map((name) => {
        const relative = `Binaries/Win64/UnrealEditor-${name}.dll`;
        const file = path.join(destination, relative);
        writeFileSync(file, name);
        return {
            path: relative.replaceAll("/", "\\"),
            sha256: createHash("sha256").update(readFileSync(file)).digest("hex").toUpperCase(),
        };
    });
    writeFileSync(path.join(destination, "local-play-build.json"), `\uFEFF${JSON.stringify({ snapshot: named, engineVersion: "5.8.3", source, modules: moduleEntries })}`);
}
test("opt-in policy is exact, not arbitrary shell input", () => {
    assert.equal(parseWin64RelaunchPolicy(undefined), null);
    assert.deepEqual(parseWin64RelaunchPolicy(JSON.stringify({ snapshot, scriptSha256: hash })), {
        snapshot,
        scriptSha256: hash,
    });
    for (const bad of [
        "{}",
        JSON.stringify({ snapshot, scriptSha256: hash, command: "bash" }),
        JSON.stringify({ snapshot: `${snapshot};rm`, scriptSha256: hash }),
        JSON.stringify({ snapshot, scriptSha256: hash.toUpperCase() }),
    ])
        assert.throws(() => parseWin64RelaunchPolicy(bad), /invalid external Win64 relaunch policy/);
});
test("new Win64 build is pinned to exact source, script and nonoverwriting destination", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-build-"));
    const destination = path.join(workspace, "snapshot");
    const windowsDestination = "C:\\Private\\OpenCourtPlayProbe-NewR1";
    const named = "OpenCourtPlayProbe-NewR1";
    try {
        for (const relative of ["scripts", "Config", "Content", "Source"])
            mkdirSync(path.join(workspace, relative));
        for (const relative of ["scripts/launch_local_play.ps1", ...sourceFiles])
            writeFileSync(path.join(workspace, relative), `${relative}\n`);
        const calls = [];
        let occupied = false;
        const run = (file, args) => {
            calls.push([file, ...args]);
            if (file === "/usr/bin/wslpath")
                return {
                    status: 0,
                    stdout: args[0] === "-u"
                        ? `${destination}\n`
                        : "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
                    stderr: "",
                };
            if (args.includes("-Plan"))
                return {
                    status: 0,
                    stdout: JSON.stringify({
                        snapshot: named,
                        destination: windowsDestination,
                        exists: occupied,
                        engineVersion: "5.8.3",
                    }),
                    stderr: "",
                };
            assert.ok(args.includes("-Prepare") && args.includes("-NoLaunch"));
            assert.deepEqual(args.slice(-2), ["-ExpectedDestination", windowsDestination]);
            fixtureSnapshot(workspace, destination, named);
            occupied = true;
            return { status: 0, stdout: "Build complete", stderr: "" };
        };
        assert.throws(() => planWin64Build(workspace, `${named};shell`, run), /invalid new/);
        const plan = planWin64Build(workspace, named, run);
        const request = { ...plan, timeoutMs: 3600000, maxOutputBytes: 1048576 };
        assert.throws(() => buildWin64Snapshot(workspace, { ...request, sourceSha256: "0".repeat(64) }, run), /plan changed/);
        assert.equal(calls.filter((call) => call.includes("-Prepare")).length, 0);
        const result = buildWin64Snapshot(workspace, request, run);
        assert.equal(result.status, "built");
        assert.equal(result.managedGate, false);
        assert.equal(result.destination, windowsDestination);
        assert.equal(calls.filter((call) => call.includes("-Prepare")).length, 1);
        assert.throws(() => planWin64Build(workspace, named, run), /occupied or invalid/);
    }
    finally {
        rmSync(workspace, { recursive: true, force: true });
    }
});
test("native case action requires a fresh log and all nine individual successes", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-cases-"));
    const destination = path.join(workspace, "snapshot");
    const named = "OpenCourtPlayProbe-CaseR1";
    const windowsDestination = "C:\\Private\\OpenCourtPlayProbe-CaseR1";
    try {
        for (const relative of ["scripts", "Config", "Content", "Source"])
            mkdirSync(path.join(workspace, relative));
        for (const relative of ["scripts/launch_local_play.ps1", ...sourceFiles])
            writeFileSync(path.join(workspace, relative), `${relative}\n`);
        fixtureSnapshot(workspace, destination, named);
        let runCount = 0;
        let omit = "";
        let early = false;
        const names = [
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
        const run = (file, args) => {
            if (file === "/usr/bin/wslpath")
                return {
                    status: 0,
                    stdout: args[0] === "-u"
                        ? `${destination}\n`
                        : "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
                    stderr: "",
                };
            if (args.includes("-Plan"))
                return {
                    status: 0,
                    stdout: JSON.stringify({
                        snapshot: named,
                        destination: windowsDestination,
                        exists: true,
                        engineVersion: "5.8.3",
                    }),
                    stderr: "",
                };
            assert.ok(args.includes("-Cases") && !args.includes("-Prepare"));
            assert.deepEqual(args.slice(-2), ["-ExpectedDestination", windowsDestination]);
            runCount++;
            if (early)
                return { status: 1, stdout: "", stderr: "native process still running" };
            writeFileSync(path.join(destination, `OpenCourtAutomation-${named}.log`), names
                .filter((name) => name !== omit)
                .map((name) => `Result={Success} Name={${name}} Path={OpenCourt.Player.ExperimentalMovement.${name}}`)
                .join("\n") + "\n9 tests performed\nTestExit: Automation Test Queue Empty\n");
            return { status: 0, stdout: "queue empty", stderr: "" };
        };
        const plan = planWin64Cases(workspace, named, run);
        const verified = verifyWin64Snapshot(workspace, named, run);
        assert.equal(verified.status, "verified");
        assert.equal(verified.buildExitCode, "not-observed");
        assert.equal(verified.inputCount, 5);
        assert.equal(verified.moduleCount, 3);
        writeFileSync(path.join(destination, "Source/Pawn.cpp"), "changed");
        assert.throws(() => verifyWin64Snapshot(workspace, named, run), /hash mismatch/);
        copyFileSync(path.join(workspace, "Source/Pawn.cpp"), path.join(destination, "Source/Pawn.cpp"));
        assert.throws(() => runWin64Cases(workspace, { ...plan, manifestSha256: "0".repeat(64), timeoutMs: 1000, maxOutputBytes: 1000 }, run), /plan changed/);
        assert.equal(runCount, 0);
        early = true;
        const pending = runWin64Cases(workspace, { ...plan, timeoutMs: 1000, maxOutputBytes: 1000 }, run);
        assert.equal(pending.status, "pending");
        assert.equal(verifyWin64CaseLog(workspace, named, run).status, "pending");
        early = false;
        omit = "CameraFollowProxy";
        const result = runWin64Cases(workspace, { ...plan, timeoutMs: 1000, maxOutputBytes: 1000 }, run);
        assert.equal(result.status, "failed");
        assert.equal(result.cases.find((item) => item.name === omit)?.passed, false);
        assert.equal(runCount, 2);
        assert.throws(() => planWin64Cases(workspace, named, run), /log already exists/);
        unlinkSync(path.join(destination, `OpenCourtAutomation-${named}.log`));
        omit = "";
        const freshPlan = planWin64Cases(workspace, named, run);
        const success = runWin64Cases(workspace, { ...freshPlan, timeoutMs: 1000, maxOutputBytes: 1000 }, run);
        assert.equal(success.status, "passed");
        assert.equal(success.cases.filter((item) => item.passed).length, 9);
        assert.match(success.logSha256 ?? "", /^[a-f0-9]{64}$/);
        assert.equal(verifyWin64CaseLog(workspace, named, run).status, "observed-pass");
    }
    finally {
        rmSync(workspace, { recursive: true, force: true });
    }
});
test("one pinned snapshot launches through fixed executable without Prepare or a managed gate", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-relaunch-"));
    try {
        mkdirSync(path.join(workspace, "scripts"));
        const script = path.join(workspace, "scripts", "launch_local_play.ps1");
        writeFileSync(script, bytes);
        const calls = [];
        const run = (file, args) => {
            calls.push([file, args]);
            return file === "/usr/bin/wslpath"
                ? {
                    status: 0,
                    stdout: "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
                    stderr: "",
                }
                : { status: 0, stdout: `Started ${snapshot} (PID 42)\n`, stderr: "" };
        };
        assert.throws(() => relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, "Other", run), /not operator-authorized/);
        assert.equal(calls.length, 0);
        assert.deepEqual(relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, run), {
            status: "launched",
            managedGate: false,
            snapshot,
            nativeExitCode: 0,
            output: `Started ${snapshot} (PID 42)`,
        });
        assert.equal(calls.length, 2);
        assert.equal(calls[1][0], "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe");
        assert.deepEqual(calls[1][1].slice(-2), ["-Snapshot", snapshot]);
        assert.ok(!calls[1][1].includes("-Prepare"));
        writeFileSync(script, "modified");
        assert.throws(() => relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, run), /hash changed/);
        assert.equal(calls.length, 2);
    }
    finally {
        rmSync(workspace, { recursive: true, force: true });
    }
});
test("a failed manifest check or untrusted converted path cannot report a launch", () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-relaunch-"));
    try {
        mkdirSync(path.join(workspace, "scripts"));
        writeFileSync(path.join(workspace, "scripts", "launch_local_play.ps1"), bytes);
        assert.throws(() => relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, (file) => file === "/usr/bin/wslpath"
            ? { status: 0, stdout: "C:\\wrong\\script.ps1\n", stderr: "" }
            : { status: 0, stdout: "Started incorrectly", stderr: "" }), /not a WSL project script/);
        assert.throws(() => relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, (file) => file === "/usr/bin/wslpath"
            ? {
                status: 0,
                stdout: "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
                stderr: "",
            }
            : { status: 1, stdout: "", stderr: "No verified build manifest" }), /relaunch failed \(exit 1\)/);
    }
    finally {
        rmSync(workspace, { recursive: true, force: true });
    }
});
