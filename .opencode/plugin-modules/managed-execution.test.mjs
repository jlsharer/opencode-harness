import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { enforceManagedTool, enforceRecoveryShell } from "./managed-execution.js";
function fixture(run) {
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
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
}
test("edits are exact scoped canonical file paths for implementers only", () => fixture((base) => {
    assert.equal(enforceManagedTool(base).filePath, path.join(base.workspaceRoot, "source.txt"));
    assert.equal(enforceManagedTool({ ...base, tool: "write", args: { filePath: "new/file" } }).filePath, path.join(base.workspaceRoot, "new/file"));
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
    assert.throws(() => enforceManagedTool({ ...base, allowedPaths: ["link"], args: { filePath: "link" } }), /symlink/);
}));
test("researcher webfetch passes through copied args without invoking the network", () => fixture((base) => {
    const args = { url: "https://example.org/reference?q=one", format: "markdown" };
    const result = enforceManagedTool({ ...base, tool: "webfetch", role: "researcher", args });
    assert.deepEqual(result, args);
    assert.notStrictEqual(result, args);
    assert.deepEqual(args, { url: "https://example.org/reference?q=one", format: "markdown" });
    for (const role of ["planner", "implementer", "validator"])
        assert.throws(() => enforceManagedTool({ ...base, tool: "webfetch", role, args }), /cannot use webfetch/);
}));
test("unknown mutation and delegation tools fail closed while read surfaces remain", () => fixture((base) => {
    for (const tool of ["apply_patch", "patch", "task", "unknown", "multiedit"])
        assert.throws(() => enforceManagedTool({ ...base, tool }), /unsupported/);
    for (const tool of ["read", "grep", "glob", "list"])
        assert.deepEqual(enforceManagedTool({ ...base, tool, role: "researcher" }), base.args);
}));
test("managed REA admits only the exact hashed standalone PE import target", () => fixture((base) => {
    const target = path.join(base.workspaceRoot, "source.txt");
    const policy = {
        path: target,
        sha256: createHash("sha256").update("original").digest("hex"),
        tools: ["rea_inspect_pe_imports"],
    };
    const input = {
        ...base,
        tool: "rea_inspect_pe_imports",
        role: "researcher",
        args: { path: target },
        reaStaticInspection: policy,
    };
    assert.deepEqual(enforceManagedTool(input), { path: target });
    assert.deepEqual(enforceManagedTool({ ...input, role: "validator" }), { path: target });
    assert.throws(() => enforceManagedTool({ ...input, reaStaticInspection: undefined }), /unsupported/);
    assert.throws(() => enforceManagedTool({ ...input, role: "planner" }), /unsupported/);
    assert.throws(() => enforceManagedTool({ ...input, role: "implementer" }), /unsupported/);
    assert.throws(() => enforceManagedTool({ ...input, args: { path: "/etc/passwd" } }), /exact authorized/);
    assert.throws(() => enforceManagedTool({ ...input, args: { path: target, max_file_bytes: 512 * 1024 * 1024 } }), /bounded integer max_file_bytes/);
    for (const tool of [
        "rea_open_binary",
        "rea_close_binary",
        "rea_binary_session",
        "rea_binary_overview",
        "rea_procedure_pseudo_code",
        "rea_decompile_all",
        "rea_gdb_console",
        "rea_set_comment",
        "rea_inspect_plist",
    ])
        assert.throws(() => enforceManagedTool({ ...input, tool }), /unsupported/);
    assert.throws(() => enforceManagedTool({ ...input, tool: "other_mcp_tool" }), /unsupported/);
    writeFileSync(target, "changed");
    assert.throws(() => enforceManagedTool(input), /hash mismatched/);
    writeFileSync(target, "original");
    assert.throws(() => enforceManagedTool({
        ...input,
        reaStaticInspection: { ...policy, sha256: "0".repeat(64) },
    }), /hash mismatched/);
}));
test("shell requires an exact command and authorized role", () => fixture((base) => {
    assert.throws(() => enforceManagedTool({ ...base, tool: "bash", args: { command: "true" } }), /exact/);
    assert.throws(() => enforceManagedTool({
        ...base,
        tool: "bash",
        args: { command: "true " },
        commands: ["true"],
    }), /exact/);
    assert.throws(() => enforceManagedTool({
        ...base,
        tool: "bash",
        args: { command: "true" },
        commands: ["true"],
        role: "planner",
    }), /no shell/);
}));
test("existing bubblewrap executes quoted exact commands and prevents workspace writes", () => fixture((base) => {
    const command = `printf '%s' "literal ' quote"`;
    const wrapped = enforceManagedTool({
        ...base,
        tool: "bash",
        role: "validator",
        commands: [command],
        args: { command },
    });
    assert.equal(execFileSync("/bin/sh", ["-c", String(wrapped.command)], { encoding: "utf8" }), "literal ' quote");
    const mutation = "printf changed > source.txt";
    const guarded = enforceManagedTool({
        ...base,
        tool: "bash",
        commands: [mutation],
        args: { command: mutation },
    });
    assert.throws(() => execFileSync("/bin/sh", ["-c", String(guarded.command)], { stdio: "pipe" }));
    assert.equal(readFileSync(path.join(base.workspaceRoot, "source.txt"), "utf8"), "original");
}));
test("focused syntax check succeeds under the read-only managed shell", () => fixture((base) => {
    writeFileSync(path.join(base.workspaceRoot, "source.js"), "const value = 1;\n");
    const command = "node --check source.js";
    const guarded = enforceManagedTool({
        ...base,
        tool: "bash",
        role: "validator",
        commands: [command],
        args: { command },
    });
    assert.equal(execFileSync("/bin/sh", ["-c", String(guarded.command)], { encoding: "utf8" }), "");
}));
test("same-session recovery shell writes when its private root is under /tmp", () => {
    const root = mkdtempSync("/tmp/managed-recovery-");
    try {
        const wrapped = enforceRecoveryShell({ command: "printf recovered > result.txt" }, root);
        assert.equal(wrapped.workdir, root);
        execFileSync("/bin/sh", ["-c", String(wrapped.command)], { stdio: "pipe" });
        assert.equal(readFileSync(path.join(root, "result.txt"), "utf8"), "recovered");
    }
    finally {
        rmSync(root, { recursive: true, force: true });
    }
});
