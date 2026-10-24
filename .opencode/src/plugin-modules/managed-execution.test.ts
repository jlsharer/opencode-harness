import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { enforceManagedTool } from "./managed-execution.ts";
import type { ManagedToolInput } from "./managed-execution.ts";

function fixture(run: (base: ManagedToolInput) => void): void {
  const root = mkdtempSync("/var/tmp/managed-execution-");
  try {
    writeFileSync(path.join(root, "source.txt"), "original");
    run({
      tool: "edit",
      args: { filePath: "source.txt" },
      role: "implementer",
      allowedPaths: ["source.txt", "new/"],
      workspaceRoot: root,
      commands: [],
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("edits are exact scoped canonical file paths for implementers only", () =>
  fixture((base) => {
    assert.equal(enforceManagedTool(base).filePath, path.join(base.workspaceRoot, "source.txt"));
    assert.equal(
      enforceManagedTool({ ...base, tool: "write", args: { filePath: "new/file" } }).filePath,
      path.join(base.workspaceRoot, "new/file"),
    );
    for (const filePath of [
      "source.txt.extra",
      "../outside",
      "/etc/passwd",
      ".git/config",
      "new/../source.txt",
    ]) {
      assert.throws(() => enforceManagedTool({ ...base, args: { filePath } }));
    }
    assert.throws(() => enforceManagedTool({ ...base, role: "validator" }), /cannot edit/);
    symlinkSync("source.txt", path.join(base.workspaceRoot, "link"));
    assert.throws(
      () => enforceManagedTool({ ...base, allowedPaths: ["link"], args: { filePath: "link" } }),
      /symlink/,
    );
  }));
test("unknown mutation and delegation tools fail closed while read surfaces remain", () =>
  fixture((base) => {
    for (const tool of ["apply_patch", "patch", "task", "unknown", "webfetch", "multiedit"])
      assert.throws(() => enforceManagedTool({ ...base, tool }), /unsupported/);
    for (const tool of ["read", "grep", "glob", "list"])
      assert.deepEqual(enforceManagedTool({ ...base, tool, role: "researcher" }), base.args);
  }));
test("shell requires an exact command and authorized role", () =>
  fixture((base) => {
    assert.throws(
      () => enforceManagedTool({ ...base, tool: "bash", args: { command: "true" } }),
      /exact/,
    );
    assert.throws(
      () =>
        enforceManagedTool({
          ...base,
          tool: "bash",
          args: { command: "true " },
          commands: ["true"],
        }),
      /exact/,
    );
    assert.throws(
      () =>
        enforceManagedTool({
          ...base,
          tool: "bash",
          args: { command: "true" },
          commands: ["true"],
          role: "planner",
        }),
      /no shell/,
    );
  }));
test("existing bubblewrap executes quoted exact commands and prevents workspace writes", () =>
  fixture((base) => {
    const command = `printf '%s' "literal ' quote"`;
    const wrapped = enforceManagedTool({
      ...base,
      tool: "bash",
      role: "validator",
      commands: [command],
      args: { command },
    });
    assert.equal(
      execFileSync("/bin/sh", ["-c", String(wrapped.command)], { encoding: "utf8" }),
      "literal ' quote",
    );
    const mutation = "printf changed > source.txt";
    const guarded = enforceManagedTool({
      ...base,
      tool: "bash",
      commands: [mutation],
      args: { command: mutation },
    });
    assert.throws(() =>
      execFileSync("/bin/sh", ["-c", String(guarded.command)], { stdio: "pipe" }),
    );
    assert.equal(readFileSync(path.join(base.workspaceRoot, "source.txt"), "utf8"), "original");
  }));
test("focused syntax check succeeds under the read-only managed shell", () =>
  fixture((base) => {
    writeFileSync(path.join(base.workspaceRoot, "source.js"), "const value = 1;\n");
    const command = "node --check source.js";
    const guarded = enforceManagedTool({
      ...base,
      tool: "bash",
      role: "validator",
      commands: [command],
      args: { command },
    });
    assert.equal(
      execFileSync("/bin/sh", ["-c", String(guarded.command)], { encoding: "utf8" }),
      "",
    );
  }));
