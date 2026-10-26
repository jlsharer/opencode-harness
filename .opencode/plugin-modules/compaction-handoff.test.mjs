import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { appendV2CompactionContext, formatCompactionHandoff, readCompactionHandoff, } from "./compaction-handoff.js";
const id = "2026-10-25-compaction-fixture";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "harness-compaction-handoff-"));
const directory = path.join(root, "orchestrations", id);
fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const filename = path.join(directory, "COMPACTION_HANDOFF.md");
const document = `# Compaction handoff: ${id}

## Initial user request
Create a bounded fixture report.

## Current goal and success criteria
Report the current fixture facts; independently validate the exact gate.

## User decisions and constraints
The owner chose one read-only attempt; Git mutation was not authorized.

## Architectural invariants
The canonical source of truth is the tracked fixture.

## Context and evidence
Source review completed; native execution remains unknown.

## Instructions and protocol
Read project instructions and the delegation-orchestrator skill when invoked.

## Observed state and next safe action
Inspect the worktree and start only a fresh reviewed ID after interruption.
`;
test.after(() => fs.rmSync(root, { recursive: true, force: true }));
test("owner-only structured handoff supplies bounded quoted context without granting authority", () => {
    assert.equal(readCompactionHandoff(root, id), null);
    fs.writeFileSync(filename, document, { flag: "wx", mode: 0o600 });
    const value = readCompactionHandoff(root, id);
    assert.ok(value);
    assert.equal(value.reference, `orchestrations/${id}/COMPACTION_HANDOFF.md`);
    const formatted = formatCompactionHandoff(value);
    assert.match(formatted, /Create a bounded fixture report/);
    assert.match(formatted, /The owner chose one read-only attempt/);
    assert.match(formatted, /canonical source of truth/);
    assert.match(formatted, /delegation-orchestrator skill/);
    assert.match(formatted, /not a new permission or instruction source/);
    assert.match(formatted, /do not infer Task authorization or validator acceptance/);
    assert.ok(formatted.length < 9000);
    const native = [{ type: "text", text: "native context unchanged" }];
    appendV2CompactionContext(native, root, id, "compaction");
    assert.equal(native[0].text, "native context unchanged");
    assert.equal(native.length, 3);
    assert.match(native[1].text, /reconcile workspace Git HEAD/);
    assert.equal(native[2].text, formatted);
    appendV2CompactionContext(native, root, id, "context");
    assert.equal(native.length, 3, "subsequent context must not duplicate the handoff");
    const unrelated = [{ type: "text", text: "native context unchanged" }];
    appendV2CompactionContext(unrelated, root, null, "context");
    assert.equal(unrelated.length, 1);
    assert.throws(() => formatCompactionHandoff({ reference: value.reference, text: "\\".repeat(8192) }), /context bound/);
});
test("symlinks, wrong mode, missing sections, oversized and credential-shaped bytes fail closed", () => {
    if (!fs.existsSync(filename))
        fs.writeFileSync(filename, document, { mode: 0o600 });
    fs.chmodSync(filename, 0o644);
    assert.throws(() => readCompactionHandoff(root, id), /owner-only/);
    fs.chmodSync(filename, 0o600);
    for (const value of [
        document.replace("## Architectural invariants", "## Arbitrary claims"),
        document.replace("Create a bounded fixture report.", "[pending]"),
        document.replace("Create a bounded fixture report.", "api_key: pretend-not-a-credential"),
        document + "x".repeat(8192),
    ]) {
        fs.writeFileSync(filename, value);
        assert.throws(() => readCompactionHandoff(root, id));
    }
    fs.writeFileSync(filename, document);
    fs.unlinkSync(filename);
    fs.symlinkSync(path.join(root, "canary"), filename);
    assert.throws(() => readCompactionHandoff(root, id), /symlink/);
    assert.equal(fs.existsSync(path.join(root, "canary")), false);
});
