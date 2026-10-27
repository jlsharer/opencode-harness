#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function processOutput(error) {
    if (!isRecord(error))
        return "";
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    return `${stdout}${stderr}`;
}
function errorCode(error) {
    return isRecord(error) && typeof error.code === "string" ? error.code : undefined;
}
function parsePortableManifest(text) {
    const value = JSON.parse(text);
    assert.ok(isRecord(value));
    assert.ok(Array.isArray(value.managedFiles));
    assert.ok(value.managedFiles.every((item) => typeof item === "string"));
    assert.ok(Array.isArray(value.forbiddenReferences));
    assert.ok(value.forbiddenReferences.every((item) => typeof item === "string"));
    function assertManifest(manifest) {
        assert.ok(isRecord(manifest));
        assert.ok(Array.isArray(manifest.managedFiles));
        assert.ok(manifest.managedFiles.every((item) => typeof item === "string"));
        assert.ok(Array.isArray(manifest.forbiddenReferences));
        assert.ok(manifest.forbiddenReferences.every((item) => typeof item === "string"));
    }
    assertManifest(value);
    return value;
}
const execFileAsync = promisify(execFile);
const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BOOTSTRAP = path.join(SOURCE_ROOT, ".opencode/scripts/bootstrap-portable-harness.mjs");
const DARWIN_ACTIVATION_PARENT = "/private/var/tmp";
async function runNode(args, options = {}) {
    return execFileAsync(process.execPath, args, {
        cwd: options.cwd ?? SOURCE_ROOT,
        env: { ...process.env, NO_COLOR: "1", ...options.env },
    });
}
async function expectFailure(args, options = {}) {
    try {
        await runNode(args, options);
    }
    catch (error) {
        return processOutput(error);
    }
    assert.fail(`expected command to fail: node ${args.join(" ")}`);
}
async function makeRepo(parent, name) {
    const repo = path.join(parent, name);
    await mkdir(repo);
    return repo;
}
async function walk(relativeRoot, base = relativeRoot) {
    const entries = [];
    for (const item of await readdir(relativeRoot, { withFileTypes: true })) {
        const absolute = path.join(relativeRoot, item.name);
        const relative = path.relative(base, absolute).split(path.sep).join("/");
        if (item.isDirectory())
            entries.push(...(await walk(absolute, base)));
        else
            entries.push(relative);
    }
    return entries.sort();
}
async function activationDirectories(invocationId) {
    if (process.platform !== "darwin")
        return [];
    const prefix = `opencode-portable-helper-${invocationId}-`;
    return (await readdir(DARWIN_ACTIVATION_PARENT)).filter((name) => name.startsWith(prefix)).sort();
}
async function waitFor(predicate, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        if (await predicate())
            return;
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.fail(`condition was not reached within ${timeoutMs}ms`);
}
const tempParent = await mkdtemp(path.join(os.tmpdir(), "portable-harness-e2e-"));
test.after(async () => rm(tempParent, { recursive: true, force: true }));
test("fresh foreign repository installs and validates without source-owned roots or history", async () => {
    const repo = await makeRepo(tempParent, "fresh");
    const installed = await runNode([BOOTSTRAP, "--target", repo]);
    assert.match(installed.stdout, /created\/updated=65, memory-created=6, unchanged=0, collisions=0/);
    assert.match(installed.stdout, process.platform === "darwin"
        ? /write-safety=darwin-native-race-detecting/
        : /write-safety=linux-descriptor-relative-race-detecting:\/proc\/self\/fd/);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const validated = await runNode([validator, "--root", "."], { cwd: repo });
    assert.equal(validated.stdout.trim(), "Portable OpenCode harness validation passed");
    const rootFiles = await readdir(repo);
    assert.deepEqual(rootFiles.sort(), [".memory", ".opencode"]);
    assert.deepEqual(await walk(path.join(repo, ".memory")), [
        "INDEX.md",
        "protocols/memory-management.md",
        "templates/compaction-handoff.md",
        "templates/interactive-refinement-test-plan.md",
        "templates/orchestration-index.md",
        "templates/role-trace-artifact.md",
    ]);
    for (const relative of [
        "task-thread-policy.js",
        "task-thread-policy.test.mjs",
        "trace-root-permissions.js",
        "trace-root-permissions.test.mjs",
    ])
        await readFile(path.join(repo, ".opencode/plugin-modules", relative), "utf8");
    await runNode(["--test", path.join(repo, ".opencode/plugin-modules/task-thread-policy.test.mjs")], { cwd: repo });
    await runNode(["--test", path.join(repo, ".opencode/plugin-modules/trace-root-permissions.test.mjs")], { cwd: repo });
});
test("bootstrap is idempotent and dry-run performs no writes", async () => {
    const repo = path.join(tempParent, "fresh");
    const second = await runNode([BOOTSTRAP, "--target", repo]);
    assert.match(second.stdout, /created\/updated=0, memory-created=0, unchanged=71, collisions=0/);
    const dryRepo = await makeRepo(tempParent, "dry-run");
    const dry = await runNode([BOOTSTRAP, "--target", dryRepo, "--dry-run"]);
    assert.match(dry.stdout, /dry-run complete: created\/updated=65, memory-created=6/);
    assert.deepEqual(await readdir(dryRepo), []);
});
test("installed validator accepts an explicit root from nested cwd", async () => {
    const repo = path.join(tempParent, "fresh");
    const nested = path.join(repo, "work/nested");
    await mkdir(nested, { recursive: true });
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const result = await runNode([validator, "--root", "../.."], { cwd: nested });
    assert.equal(result.stdout.trim(), "Portable OpenCode harness validation passed");
});
test("partial memory is filled without overwrite and history is never copied or removed", async () => {
    const repo = await makeRepo(tempParent, "partial-memory");
    const index = path.join(repo, ".memory/INDEX.md");
    const history = path.join(repo, ".memory/orchestrations/existing/marker.txt");
    await mkdir(path.dirname(history), { recursive: true });
    await writeFile(index, "# Destination-owned memory\n");
    await writeFile(history, "keep\n");
    const result = await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    assert.match(result.stdout, /memory-created=5/);
    assert.equal(await readFile(index, "utf8"), "# Destination-owned memory\n");
    assert.equal(await readFile(history, "utf8"), "keep\n");
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    assert.equal((await runNode([validator, "--root", repo])).stdout.trim(), "Portable OpenCode harness validation passed");
});
test("managed collision aborts preflight and explicit overwrite changes only managed files", async () => {
    const repo = await makeRepo(tempParent, "collision");
    const collision = path.join(repo, ".opencode/agents/researcher.md");
    await mkdir(path.dirname(collision), { recursive: true });
    await writeFile(collision, "destination content\n");
    const failure = await expectFailure([BOOTSTRAP, "--target", repo]);
    assert.match(failure, /managed collisions \(1\)/);
    assert.deepEqual(await walk(repo), [".opencode/agents/researcher.md"]);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    assert.notEqual(await readFile(collision, "utf8"), "destination content\n");
    const memory = path.join(repo, ".memory/INDEX.md");
    await writeFile(memory, "private memory\n");
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    assert.equal(await readFile(memory, "utf8"), "private memory\n");
});
test("atomic no-clobber publication preserves concurrently created managed and memory files", async () => {
    for (const [name, relative] of [
        ["managed-race", ".opencode/agents/validator.md"],
        ["memory-race", ".memory/INDEX.md"],
    ]) {
        const repo = await makeRepo(tempParent, name);
        const race = JSON.stringify({ action: "create-destination", relative });
        const failure = await expectFailure([BOOTSTRAP, "--target", repo], {
            env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: race },
        });
        assert.match(failure, /destination appeared after preflight/);
        assert.equal(await readFile(path.join(repo, relative), "utf8"), "concurrent destination\n");
    }
});
test("write-time ancestor symlink insertion cannot escape the target", async () => {
    const repo = await makeRepo(tempParent, "symlink-race");
    const outside = await makeRepo(tempParent, "symlink-race-outside");
    const race = JSON.stringify({ action: "insert-symlink", relative: ".opencode", target: outside });
    await expectFailure([BOOTSTRAP, "--target", repo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: race },
    });
    assert.deepEqual(await readdir(outside), []);
});
test("target root and intermediate replacement fail identity binding before writes", async () => {
    const rootRepo = await makeRepo(tempParent, "root-replacement");
    const movedRoot = path.join(tempParent, "root-replacement-original");
    const rootRace = JSON.stringify({ action: "replace-root", replacement: movedRoot });
    assert.match(await expectFailure([BOOTSTRAP, "--target", rootRepo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: rootRace },
    }), /(?:opened target differs from the preflight-inspected target|target root identity mismatch)/);
    assert.deepEqual(await readdir(rootRepo), []);
    assert.deepEqual(await readdir(movedRoot), []);
    const container = path.join(tempParent, "intermediate-container");
    await mkdir(container);
    const nestedRepo = await makeRepo(container, "repo");
    const movedContainer = path.join(tempParent, "intermediate-container-original");
    const intermediateRace = JSON.stringify({
        action: "replace-intermediate",
        replacement: movedContainer,
    });
    assert.match(await expectFailure([BOOTSTRAP, "--target", nestedRepo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: intermediateRace },
    }), /(?:opened target differs from the preflight-inspected target|target root identity mismatch)/);
    assert.deepEqual(await readdir(path.join(tempParent, "intermediate-container/repo")), []);
    assert.deepEqual(await readdir(path.join(movedContainer, "repo")), []);
    const openedRepo = await makeRepo(tempParent, "opened-root-replacement");
    const movedOpenedRoot = path.join(tempParent, "opened-root-replacement-original");
    const openedRace = JSON.stringify({
        action: "replace-root-after-open",
        replacement: movedOpenedRoot,
    });
    assert.match(await expectFailure([BOOTSTRAP, "--target", openedRepo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: openedRace },
    }), /(?:opened target differs from the preflight-inspected target|target root identity mismatch)/);
    assert.deepEqual(await readdir(openedRepo), []);
    assert.deepEqual(await readdir(movedOpenedRoot), []);
    const splitRepo = await makeRepo(tempParent, "split-snapshot-replacement");
    const movedSplitRoot = path.join(tempParent, "split-snapshot-replacement-original");
    const splitRace = JSON.stringify({
        action: "replace-root-between-snapshots",
        replacement: movedSplitRoot,
    });
    assert.match(await expectFailure([BOOTSTRAP, "--target", splitRepo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: splitRace },
    }), /canonical target differs from the exact preflight identity snapshot/);
    assert.deepEqual(await readdir(splitRepo), []);
    assert.deepEqual(await readdir(movedSplitRoot), []);
});
test("platform publication capability unavailability fails before files or directories are published", async () => {
    const repo = await makeRepo(tempParent, "descriptor-unavailable");
    const env = process.platform === "darwin"
        ? { NODE_ENV: "test", OPENCODE_PORTABLE_FORCE_NATIVE_UNAVAILABLE: "1" }
        : { NODE_ENV: "test", OPENCODE_PORTABLE_FORCE_DESCRIPTOR_UNAVAILABLE: "1" };
    const failure = await expectFailure([BOOTSTRAP, "--target", repo], { env });
    assert.match(failure, process.platform === "darwin"
        ? /activation was test-forced unavailable/
        : /no usable descriptor-directory alias/);
    assert.deepEqual(await readdir(repo), []);
});
test("probe-interval parent replacement produces no file publication", {
    skip: process.platform === "darwin" &&
        "native pinned-parent relocation is covered by the documented race-detecting limitation",
}, async () => {
    const repo = await makeRepo(tempParent, "probe-replacement");
    const moved = path.join(tempParent, "probe-replacement-opencode-original");
    const race = JSON.stringify({
        action: "replace-parent-before-probe",
        relative: ".opencode",
        replacement: moved,
    });
    assert.match(await expectFailure([BOOTSTRAP, "--target", repo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: race },
    }), /destination parent changed during write/);
    assert.deepEqual(await walk(repo), []);
    assert.deepEqual(await walk(moved), []);
});
test("all destination parents are capability-probed before first file publication", async () => {
    const repo = await makeRepo(tempParent, "multi-destination-probe");
    const race = JSON.stringify({ action: "fail-probe", relative: ".memory" });
    const failure = await expectFailure([BOOTSTRAP, "--target", repo], {
        env: { NODE_ENV: "test", OPENCODE_PORTABLE_TEST_RACE: race },
    });
    assert.match(failure, /(?:capability probe failed for \.memory before publication|last parent probe failure)/);
    assert.deepEqual(await readdir(repo), []);
});
test("Darwin helper timeout and output overflow terminate before publication and clean activation state", { skip: process.platform !== "darwin" && "requires Darwin" }, async () => {
    for (const [name, action, pattern] of [
        ["native-timeout", "helper-timeout", /exceeded 200ms timeout/],
        [
            "native-output-overflow",
            "helper-output-overflow",
            /output exceeded the bounded protocol limit/,
        ],
    ]) {
        const repo = await makeRepo(tempParent, name);
        const invocationId = `${process.pid}-${name}`;
        const race = JSON.stringify({ action });
        assert.match(await expectFailure([BOOTSTRAP, "--target", repo], {
            env: {
                NODE_ENV: "test",
                OPENCODE_PORTABLE_TEST_RACE: race,
                OPENCODE_PORTABLE_TEST_INVOCATION_ID: invocationId,
            },
        }), pattern);
        assert.deepEqual(await readdir(repo), []);
        assert.deepEqual(await activationDirectories(invocationId), []);
    }
});
test("Darwin helper launch ignores caller TMPDIR and DYLD loader variables", { skip: process.platform !== "darwin" && "requires Darwin" }, async () => {
    const repo = await makeRepo(tempParent, "sanitized-helper-environment");
    const attackerTemp = await makeRepo(tempParent, "attacker-tmpdir");
    const race = JSON.stringify({ action: "helper-environment-check" });
    const invocationId = `${process.pid}-sanitized-environment`;
    const result = await runNode([BOOTSTRAP, "--target", repo], {
        env: {
            NODE_ENV: "test",
            OPENCODE_PORTABLE_TEST_RACE: race,
            OPENCODE_PORTABLE_TEST_INVOCATION_ID: invocationId,
            TMPDIR: attackerTemp,
            DYLD_LIBRARY_PATH: attackerTemp,
            DYLD_FRAMEWORK_PATH: attackerTemp,
            DYLD_PRINT_LIBRARIES: "1",
        },
    });
    assert.match(result.stdout, /write-safety=darwin-native-race-detecting/);
    assert.deepEqual(await readdir(attackerTemp), []);
});
test("SIGTERM to Darwin bootstrap terminates and reaps helper before cleanup and publication", { skip: process.platform !== "darwin" && "requires Darwin" }, async () => {
    const repo = await makeRepo(tempParent, "parent-signal");
    const invocationId = `${process.pid}-parent-signal`;
    const race = JSON.stringify({ action: "parent-signal" });
    const child = spawn(process.execPath, [BOOTSTRAP, "--target", repo], {
        cwd: SOURCE_ROOT,
        env: {
            ...process.env,
            NODE_ENV: "test",
            OPENCODE_PORTABLE_TEST_RACE: race,
            OPENCODE_PORTABLE_TEST_INVOCATION_ID: invocationId,
        },
        stdio: ["ignore", "pipe", "pipe"],
    });
    const stderr = [];
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    await waitFor(async () => (await activationDirectories(invocationId)).length === 1);
    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill("SIGTERM");
    const outcome = await new Promise((resolve, reject) => {
        child.on("error", reject);
        child.on("close", (code, signal) => resolve({ code, signal }));
    });
    assert.equal(outcome.signal, "SIGTERM", Buffer.concat(stderr).toString("utf8"));
    assert.deepEqual(await readdir(repo), []);
    await waitFor(async () => (await activationDirectories(invocationId)).length === 0);
});
test("catchable signals clean every Darwin activation lifecycle gap with original signal semantics", { skip: process.platform !== "darwin" && "requires Darwin" }, async (t) => {
    for (const [index, action] of [
        "signal-after-activation-directory",
        "signal-between-helper-runs",
        "signal-during-final-cleanup",
    ].entries())
        await t.test(action, async () => {
            const repo = await makeRepo(tempParent, `lifecycle-signal-${index}`);
            const invocationId = `${process.pid}-lifecycle-${index}`;
            const marker = path.join(tempParent, `lifecycle-signal-${index}.marker`);
            const race = JSON.stringify({ action });
            const child = spawn(process.execPath, [BOOTSTRAP, "--target", repo], {
                cwd: SOURCE_ROOT,
                env: {
                    ...process.env,
                    NODE_ENV: "test",
                    OPENCODE_PORTABLE_TEST_RACE: race,
                    OPENCODE_PORTABLE_TEST_INVOCATION_ID: invocationId,
                    OPENCODE_PORTABLE_TEST_SIGNAL_MARKER: marker,
                },
                stdio: ["ignore", "pipe", "pipe"],
            });
            const stdout = [];
            const stderr = [];
            child.stdout.on("data", (chunk) => stdout.push(chunk));
            child.stderr.on("data", (chunk) => stderr.push(chunk));
            const closePromise = new Promise((resolve, reject) => {
                child.on("error", reject);
                child.on("close", (code, signal) => resolve({ code, signal }));
            });
            await waitFor(async () => {
                try {
                    return (await readFile(marker, "utf8")).trim() === action;
                }
                catch (error) {
                    if (errorCode(error) === "ENOENT")
                        return false;
                    throw error;
                }
            });
            assert.equal((await activationDirectories(invocationId)).length, 1);
            child.kill("SIGTERM");
            const outcome = await closePromise;
            assert.equal(outcome.signal, "SIGTERM", `${JSON.stringify(outcome)} stdout=${Buffer.concat(stdout).toString("utf8")} stderr=${Buffer.concat(stderr).toString("utf8")}`);
            assert.deepEqual((await readdir(repo)).sort(), action === "signal-during-final-cleanup" ? [".memory", ".opencode"] : []);
            await waitFor(async () => (await activationDirectories(invocationId)).length === 0);
        });
});
test("installed validator rejects unsafe manifest paths and forbidden references", async () => {
    const repo = await makeRepo(tempParent, "negative");
    await runNode([BOOTSTRAP, "--target", repo]);
    const manifestPath = path.join(repo, ".opencode/portable.manifest.json");
    const manifest = parsePortableManifest(await readFile(manifestPath, "utf8"));
    manifest.managedFiles.push("../escape");
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    assert.match(await expectFailure([validator, "--root", repo]), /safe normalized relative POSIX path/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const agent = path.join(repo, ".opencode/agents/researcher.md");
    const restoredManifest = parsePortableManifest(await readFile(manifestPath, "utf8"));
    await writeFile(agent, `${await readFile(agent, "utf8")}\n${restoredManifest.forbiddenReferences[0]}\n`);
    assert.match(await expectFailure([validator, "--root", repo]), /forbidden portable references found/);
});
test("installed validator rejects corrupted enabled-local routing and machine-local manifest paths", async () => {
    const repo = await makeRepo(tempParent, "routing-corruption");
    await runNode([BOOTSTRAP, "--target", repo]);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const local = path.join(repo, ".opencode/routing/harness-model-routing.local.example.json");
    await writeFile(local, "{}\n");
    assert.match(await expectFailure([validator, "--root", repo]), /Invalid harness model routing v2/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const manifestPath = path.join(repo, ".opencode/portable.manifest.json");
    const manifest = parsePortableManifest(await readFile(manifestPath, "utf8"));
    manifest.forbiddenReferences.push(["", "home", "example", "opencode-harness"].join("/"));
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    assert.match(await expectFailure([validator, "--root", repo]), /machine-local absolute path/);
});
test("installed validator independently rejects removed inventory entries", async () => {
    const repo = await makeRepo(tempParent, "inventory-removal");
    await runNode([BOOTSTRAP, "--target", repo]);
    const manifestPath = path.join(repo, ".opencode/portable.manifest.json");
    const manifest = parsePortableManifest(await readFile(manifestPath, "utf8"));
    const removed = ".opencode/routing/routing-policy.test.mjs";
    manifest.managedFiles = manifest.managedFiles.filter((item) => item !== removed);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await rm(path.join(repo, removed));
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    assert.match(await expectFailure([validator, "--root", repo]), /exact portable-core contract|exactly 65 files/);
});
test("installed validator rejects missing task-thread policy assets and stale policy wording", async () => {
    const repo = await makeRepo(tempParent, "thread-policy-corruption");
    await runNode([BOOTSTRAP, "--target", repo]);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const modulePath = path.join(repo, ".opencode/plugin-modules/task-thread-policy.js");
    await rm(modulePath);
    assert.match(await expectFailure([validator, "--root", repo]), /missing file: \.opencode\/plugin-modules\/task-thread-policy\.js/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const testPath = path.join(repo, ".opencode/plugin-modules/task-thread-policy.test.mjs");
    await rm(testPath);
    assert.match(await expectFailure([validator, "--root", repo]), /missing file: \.opencode\/plugin-modules\/task-thread-policy\.test\.mjs/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const protocol = path.join(repo, ".memory/protocols/memory-management.md");
    const staleProtocol = (await readFile(protocol, "utf8")).replace("strict 1:1 boundary", "legacy boundary");
    await writeFile(protocol, staleProtocol);
    await writeFile(path.join(repo, ".opencode/bootstrap/memory/protocols/memory-management.md"), staleProtocol);
    assert.match(await expectFailure([validator, "--root", repo]), /task-thread policy wording/);
});
test("installed validator rejects missing or corrupted trace-permission assets", async () => {
    const repo = await makeRepo(tempParent, "trace-permission-corruption");
    await runNode([BOOTSTRAP, "--target", repo]);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const modulePath = path.join(repo, ".opencode/plugin-modules/trace-root-permissions.js");
    await rm(modulePath);
    assert.match(await expectFailure([validator, "--root", repo]), /missing file: \.opencode\/plugin-modules\/trace-root-permissions\.js/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const testPath = path.join(repo, ".opencode/plugin-modules/trace-root-permissions.test.mjs");
    await writeFile(testPath, 'throw new Error("corrupt trace test")\n');
    assert.match(await expectFailure([validator, "--root", repo]), /trace-root permission tests failed/);
});
test("installed validator independently rejects a corrupted Darwin helper binary", async () => {
    const repo = await makeRepo(tempParent, "native-corruption");
    await runNode([BOOTSTRAP, "--target", repo]);
    const helper = path.join(repo, ".opencode/bootstrap/native/darwin-portable-fs.universal");
    const bytes = await readFile(helper);
    const finalByte = bytes.length - 1;
    assert.ok(finalByte >= 0);
    bytes[finalByte] = bytes[finalByte] ^ 1;
    await writeFile(helper, bytes);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    assert.match(await expectFailure([validator, "--root", repo]), /Darwin helper SHA-256 mismatch/);
});
test("installed validator rejects generic Windows drive and UNC absolute paths", async () => {
    const repo = await makeRepo(tempParent, "windows-paths");
    await runNode([BOOTSTRAP, "--target", repo]);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    const agent = path.join(repo, ".opencode/agents/researcher.md");
    const drivePath = ["C:", "src", "opencode-harness", "secret"].join("\\");
    await writeFile(agent, `${await readFile(agent, "utf8")}\n${drivePath}\n`);
    assert.match(await expectFailure([validator, "--root", repo]), /machine-local absolute path/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const uncPath = ["", "", "server", "share", "opencode-harness", "secret"].join("\\");
    const manifestPath = path.join(repo, ".opencode/portable.manifest.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.forbiddenReferences.push(uncPath);
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    assert.match(await expectFailure([validator, "--root", repo]), /machine-local absolute path/);
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    const forwardUncPath = ["", "", "server", "share", "opencode-harness", "secret"].join("/");
    await writeFile(agent, `${await readFile(agent, "utf8")}\n${forwardUncPath}\n`);
    assert.match(await expectFailure([validator, "--root", repo]), /machine-local absolute path/);
});
test("consumer install, repeat and reviewed upgrade preserve config without design documents", async () => {
    const repo = await makeRepo(tempParent, "consumer-upgrade");
    const preserved = {
        "opencode.json": '{"model":"fixture/remote"}\n',
        [["AGENTS", "md"].join(".")]: "Consumer-owned guidance\n",
        ".gitignore": "consumer-private/\n",
        ".opencode/routing/harness-model-routing.json": "consumer-owned routing bytes\n",
        ".memory/INDEX.md": "Readable consumer memory\n",
    };
    for (const [name, content] of Object.entries(preserved)) {
        await mkdir(path.dirname(path.join(repo, name)), { recursive: true });
        await writeFile(path.join(repo, name), content);
    }
    await runNode([BOOTSTRAP, "--target", repo]);
    await runNode([BOOTSTRAP, "--target", repo]);
    for (const name of [
        ["opencode-harness", "design", "md"].join("."),
        ["opencode-harness", "design.md"].join("-"),
    ])
        assert.equal((await walk(repo)).includes(name), false);
    const managed = path.join(repo, ".opencode/agents/implementer.md");
    await writeFile(managed, "previous-version fixture\n");
    assert.match(await expectFailure([BOOTSTRAP, "--target", repo]), /managed collisions/);
    assert.equal(await readFile(managed, "utf8"), "previous-version fixture\n");
    await runNode([BOOTSTRAP, "--target", repo, "--overwrite-managed"]);
    assert.equal(await readFile(managed, "utf8"), await readFile(path.join(SOURCE_ROOT, ".opencode/agents/implementer.md"), "utf8"));
    for (const [name, content] of Object.entries(preserved))
        assert.equal(await readFile(path.join(repo, name), "utf8"), content);
    const validator = path.join(repo, ".opencode/scripts/validate-portable-harness.mjs");
    assert.match((await runNode([validator, "--root", repo])).stdout, /validation passed/);
    for (const name of [
        ["opencode-harness", "design", "md"].join("."),
        ["opencode-harness", "design.md"].join("-"),
    ]) {
        await writeFile(managed, `${await readFile(path.join(SOURCE_ROOT, ".opencode/agents/implementer.md"), "utf8")}\nRead ${name} before working.\n`);
        assert.match(await expectFailure([validator, "--root", repo]), /forbidden portable references/);
    }
});
