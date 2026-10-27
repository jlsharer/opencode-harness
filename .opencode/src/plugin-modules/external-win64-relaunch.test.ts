import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  parseWin64RelaunchPolicy,
  relaunchExistingWin64Snapshot,
} from "./external-win64-relaunch.ts";

const snapshot = "OpenCourtPlayProbe-DirectionalMannyR1-20261026";
const bytes = "# pinned local play script\n";
const hash = createHash("sha256").update(bytes).digest("hex");

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

test("one pinned snapshot launches through fixed executable without Prepare or a managed gate", () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-relaunch-"));
  try {
    mkdirSync(path.join(workspace, "scripts"));
    const script = path.join(workspace, "scripts", "launch_local_play.ps1");
    writeFileSync(script, bytes);
    const calls: [string, string[]][] = [];
    const run = (file: string, args: string[]) => {
      calls.push([file, args]);
      return file === "/usr/bin/wslpath"
        ? {
            status: 0,
            stdout: "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
            stderr: "",
          }
        : { status: 0, stdout: `Started ${snapshot} (PID 42)\n`, stderr: "" };
    };
    assert.throws(
      () =>
        relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, "Other", run),
      /not operator-authorized/,
    );
    assert.equal(calls.length, 0);
    assert.deepEqual(
      relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, run),
      {
        status: "launched",
        managedGate: false,
        snapshot,
        nativeExitCode: 0,
        output: `Started ${snapshot} (PID 42)`,
      },
    );
    assert.equal(calls.length, 2);
    assert.equal(calls[1]![0], "/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe");
    assert.deepEqual(calls[1]![1].slice(-2), ["-Snapshot", snapshot]);
    assert.ok(!calls[1]![1].includes("-Prepare"));
    writeFileSync(script, "modified");
    assert.throws(
      () =>
        relaunchExistingWin64Snapshot(workspace, { snapshot, scriptSha256: hash }, snapshot, run),
      /hash changed/,
    );
    assert.equal(calls.length, 2);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("a failed manifest check or untrusted converted path cannot report a launch", () => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "harness-win64-relaunch-"));
  try {
    mkdirSync(path.join(workspace, "scripts"));
    writeFileSync(path.join(workspace, "scripts", "launch_local_play.ps1"), bytes);
    assert.throws(
      () =>
        relaunchExistingWin64Snapshot(
          workspace,
          { snapshot, scriptSha256: hash },
          snapshot,
          (file) =>
            file === "/usr/bin/wslpath"
              ? { status: 0, stdout: "C:\\wrong\\script.ps1\n", stderr: "" }
              : { status: 0, stdout: "Started incorrectly", stderr: "" },
        ),
      /not a WSL project script/,
    );
    assert.throws(
      () =>
        relaunchExistingWin64Snapshot(
          workspace,
          { snapshot, scriptSha256: hash },
          snapshot,
          (file) =>
            file === "/usr/bin/wslpath"
              ? {
                  status: 0,
                  stdout: "\\\\wsl.localhost\\Ubuntu\\home\\test\\scripts\\launch_local_play.ps1\n",
                  stderr: "",
                }
              : { status: 1, stdout: "", stderr: "No verified build manifest" },
        ),
      /relaunch failed \(exit 1\)/,
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
