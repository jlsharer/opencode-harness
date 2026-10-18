#!/usr/bin/env node
import { constants } from "node:fs";
import { access, link, lstat, mkdir, mkdtemp, open, readFile, realpath, rename, rm, rmdir, symlink, unlink, writeFile, } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const SOURCE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MANIFEST_PATH = ".opencode/portable.manifest.json";
const DARWIN_HELPER_PATH = ".opencode/bootstrap/native/darwin-portable-fs.universal";
const DARWIN_PROTOCOL = 1;
const DARWIN_ACTIVATION_PARENT = "/private/var/tmp";
let descriptorAlias = null;
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNodeError(error) {
    return error instanceof Error;
}
function isRaceAction(value) {
    return (typeof value === "string" &&
        [
            "create-destination",
            "insert-symlink",
            "replace-root",
            "replace-intermediate",
            "replace-root-after-open",
            "replace-root-between-snapshots",
            "replace-parent-before-probe",
            "fail-probe",
            "helper-timeout",
            "helper-output-overflow",
            "helper-environment-check",
            "parent-signal",
            "signal-after-activation-directory",
            "signal-between-helper-runs",
            "signal-during-final-cleanup",
        ].includes(value));
}
function fail(message) {
    throw new Error(`Portable harness bootstrap failed: ${message}`);
}
function safeRelative(value, label, prefix) {
    if (typeof value !== "string" ||
        value.length === 0 ||
        value.includes("\\") ||
        value.includes("\0"))
        fail(`${label} must be a safe relative POSIX path`);
    if (path.posix.isAbsolute(value) ||
        path.posix.normalize(value) !== value ||
        value.split("/").some((part) => part === "" || part === "." || part === ".."))
        fail(`${label} must be a normalized relative POSIX path`);
    if (prefix && !value.startsWith(prefix))
        fail(`${label} must be under ${prefix}`);
    return value;
}
function validateManifest(value) {
    if (!isObject(value))
        fail("manifest must be an object");
    const keys = Object.keys(value).sort();
    const expected = [
        "forbiddenReferences",
        "managedFiles",
        "memorySeeds",
        "profile",
        "schemaVersion",
        "writeCapabilities",
    ].sort();
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index]))
        fail("manifest has an unexpected shape");
    if (value.schemaVersion !== "2.0.0" || value.profile !== "portable-core")
        fail("manifest version/profile is unsupported");
    if (!Array.isArray(value.managedFiles) ||
        !Array.isArray(value.memorySeeds) ||
        !Array.isArray(value.forbiddenReferences))
        fail("manifest inventories must be arrays");
    const managed = value.managedFiles.map((item, index) => safeRelative(item, `managedFiles[${index}]`, ".opencode/"));
    if (new Set(managed).size !== managed.length || !managed.includes(MANIFEST_PATH))
        fail("managedFiles must be unique and include the portable manifest");
    for (const candidate of managed)
        if (managed.some((other) => other !== candidate && candidate.startsWith(`${other}/`)))
            fail(`managed file paths overlap: ${candidate}`);
    const targets = [];
    const memorySeeds = [];
    for (const [index, seed] of value.memorySeeds.entries()) {
        if (!isObject(seed) || Object.keys(seed).sort().join(",") !== "source,target")
            fail(`memorySeeds[${index}] must contain only source and target`);
        const source = safeRelative(seed.source, `memorySeeds[${index}].source`, ".opencode/bootstrap/memory/");
        const target = safeRelative(seed.target, `memorySeeds[${index}].target`, ".memory/");
        if (!managed.includes(source))
            fail(`memory seed source is not managed: ${source}`);
        targets.push(target);
        memorySeeds.push({ source, target });
    }
    if (new Set(targets).size !== targets.length)
        fail("memory seed targets must be unique");
    if (value.forbiddenReferences.some((token) => typeof token !== "string" || token.length === 0))
        fail("forbiddenReferences must contain unique nonempty strings");
    const forbiddenReferences = value.forbiddenReferences.map((token) => {
        if (typeof token !== "string")
            fail("forbiddenReferences must contain unique nonempty strings");
        return token;
    });
    if (new Set(forbiddenReferences).size !== forbiddenReferences.length)
        fail("forbiddenReferences must contain unique nonempty strings");
    const capabilities = value.writeCapabilities;
    const expectedCapabilities = {
        publication: "descriptor-relative-same-directory-hard-link",
        destinationPreflight: "all-parent-directories-before-publication",
        unavailableBehavior: "fail-before-file-publication",
        parentRelocationLimit: "pinned-parent-relocation-is-detected-before-and-after-publication-but-is-not-atomically-confined-beneath-root",
        backends: {
            linux: {
                platform: "linux",
                descriptorDirectoryAliases: ["/proc/self/fd", "/dev/fd"],
                safety: "linux-descriptor-relative-race-detecting",
            },
            darwin: {
                platform: "darwin",
                safety: "darwin-native-race-detecting",
                helper: {
                    path: DARWIN_HELPER_PATH,
                    sha256: "931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9",
                    protocol: DARWIN_PROTOCOL,
                    architectures: ["arm64", "x86_64"],
                    minimumMacOS: "11.0",
                    signing: "adhoc-all-slices-no-team-id-materialized-private-copy",
                },
            },
        },
    };
    if (!capabilities || JSON.stringify(capabilities) !== JSON.stringify(expectedCapabilities))
        fail("manifest write capability contract is unsupported");
    if (!managed.includes(DARWIN_HELPER_PATH) ||
        !managed.includes(".opencode/bootstrap/native/darwin-portable-fs.c"))
        fail("Darwin helper source and binary must be portable managed files");
    return {
        schemaVersion: "2.0.0",
        profile: "portable-core",
        managedFiles: managed,
        memorySeeds,
        forbiddenReferences,
        writeCapabilities: {
            ...expectedCapabilities,
            backends: {
                linux: { ...expectedCapabilities.backends.linux, platform: "linux" },
                darwin: { ...expectedCapabilities.backends.darwin, platform: "darwin" },
            },
        },
    };
}
function sha256(bytes) {
    return createHash("sha256").update(bytes).digest("hex");
}
function parentSignalError(signal) {
    const error = new Error(`parent received ${signal}; native helper was terminated and reaped and activation cleanup completed where possible`);
    const signalError = Object.assign(error, { parentSignal: signal });
    return signalError;
}
function createDarwinSignalCoordinator() {
    let activeChild = null;
    let escalationTimer = null;
    let receivedSignal = null;
    let notifySignal = () => { };
    const signalPromise = new Promise((resolve) => {
        notifySignal = resolve;
    });
    const lifecycleKeepAlive = setInterval(() => { }, 60000);
    const handlers = new Map();
    const terminateActiveChild = () => {
        if (!activeChild || activeChild.exitCode !== null || activeChild.signalCode !== null)
            return;
        activeChild.kill("SIGTERM");
        if (!escalationTimer) {
            escalationTimer = setTimeout(() => activeChild?.kill("SIGKILL"), 2000);
            escalationTimer.unref();
        }
    };
    for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        const handler = () => {
            if (receivedSignal)
                return;
            receivedSignal = signal;
            notifySignal(signal);
            terminateActiveChild();
        };
        handlers.set(signal, handler);
        process.on(signal, handler);
    }
    const exitHandler = () => activeChild?.kill("SIGKILL");
    process.on("exit", exitHandler);
    return {
        attachChild(child) {
            if (activeChild)
                throw new Error("Darwin signal coordinator already has an active child");
            activeChild = child;
            if (receivedSignal)
                terminateActiveChild();
        },
        detachChild(child) {
            if (activeChild === child)
                activeChild = null;
            if (escalationTimer)
                clearTimeout(escalationTimer);
            escalationTimer = null;
        },
        throwIfSignaled() {
            if (receivedSignal)
                throw parentSignalError(receivedSignal);
        },
        signalError() {
            return receivedSignal ? parentSignalError(receivedSignal) : null;
        },
        waitForSignal() {
            return signalPromise;
        },
        dispose() {
            if (activeChild)
                throw new Error("cannot dispose Darwin signal coordinator with an active child");
            if (escalationTimer)
                clearTimeout(escalationTimer);
            clearInterval(lifecycleKeepAlive);
            for (const [signal, handler] of handlers)
                process.removeListener(signal, handler);
            process.removeListener("exit", exitHandler);
        },
    };
}
function runChild(executable, args, input, maxOutput, timeoutMs, coordination) {
    return new Promise((resolve, reject) => {
        const child = spawn(executable, args, {
            stdio: ["pipe", "pipe", "pipe"],
            windowsHide: true,
            env: Object.create(null),
        });
        const stdout = [];
        const stderr = [];
        let stdoutLength = 0;
        let stderrLength = 0;
        let outputError = null;
        let timer = null;
        const cleanupChild = () => {
            if (timer)
                clearTimeout(timer);
            coordination.detachChild(child);
        };
        coordination.attachChild(child);
        timer = setTimeout(() => {
            outputError = new Error(`native helper exceeded ${timeoutMs}ms timeout`);
            child.kill("SIGKILL");
        }, timeoutMs);
        const collect = (chunks, key) => (chunk) => {
            if (key === "stdout")
                stdoutLength += chunk.length;
            else
                stderrLength += chunk.length;
            if (stdoutLength > maxOutput || stderrLength > maxOutput) {
                outputError = new Error("native helper output exceeded the bounded protocol limit");
                child.kill("SIGKILL");
            }
            else
                chunks.push(chunk);
        };
        child.stdout.on("data", collect(stdout, "stdout"));
        child.stderr.on("data", collect(stderr, "stderr"));
        child.stdin.on("error", (error) => {
            if (isNodeError(error) && error.code === "EPIPE")
                return;
            child.kill("SIGKILL");
            cleanupChild();
            reject(error);
        });
        child.on("error", (error) => {
            cleanupChild();
            reject(error);
        });
        child.on("close", (code, signal) => {
            cleanupChild();
            const signalError = coordination.signalError();
            if (signalError) {
                reject(signalError);
                return;
            }
            resolve({
                code,
                signal,
                stdout: Buffer.concat(stdout),
                stderr: Buffer.concat(stderr),
                outputError,
            });
        });
        if (input)
            child.stdin.end(input);
        else
            child.stdin.end();
    });
}
function encodeDarwinRequest(targetReal, identity, operations, race) {
    const target = Buffer.from(targetReal, "utf8");
    const encoded = operations.map((operation) => ({
        ...operation,
        pathBytes: Buffer.from(operation.relative, "utf8"),
    }));
    const total = 48 +
        target.length +
        encoded.reduce((sum, operation) => sum + 16 + operation.pathBytes.length + operation.bytes.length, 0);
    if (total >= 256 * 1024 * 1024)
        fail("native helper request must be smaller than the exclusive 256 MiB protocol limit");
    const frame = Buffer.allocUnsafe(total);
    frame.write("OPDFREQ1", 0, "ascii");
    frame.writeUInt32LE(DARWIN_PROTOCOL, 8);
    let flags = 0;
    if (race?.action === "fail-probe")
        flags |= 1;
    if (race?.action === "create-destination")
        flags |= 2;
    if (race?.action === "helper-timeout" || race?.action === "parent-signal")
        flags |= 4;
    if (race?.action === "helper-output-overflow")
        flags |= 8;
    if (race?.action === "helper-environment-check")
        flags |= 16;
    frame.writeUInt32LE(flags, 12);
    frame.writeBigUInt64LE(BigInt(identity.dev), 16);
    frame.writeBigUInt64LE(BigInt(identity.ino), 24);
    frame.writeUInt32LE(target.length, 32);
    frame.writeUInt32LE(encoded.length, 36);
    frame.writeBigUInt64LE(BigInt(total), 40);
    target.copy(frame, 48);
    let offset = 48 + target.length;
    for (const operation of encoded) {
        frame.fill(0, offset, offset + 16);
        frame[offset] = operation.allowOverwrite ? 1 : 0;
        frame.writeUInt32LE(operation.pathBytes.length, offset + 4);
        frame.writeBigUInt64LE(BigInt(operation.bytes.length), offset + 8);
        offset += 16;
        operation.pathBytes.copy(frame, offset);
        offset += operation.pathBytes.length;
        operation.bytes.copy(frame, offset);
        offset += operation.bytes.length;
    }
    return frame;
}
function parseDarwinResponse(result, operations) {
    if (result.outputError)
        throw result.outputError;
    if (result.signal)
        fail(`Darwin native helper terminated by signal ${result.signal} before completing publication`);
    if (result.stdout.length !== 32 ||
        result.stdout.subarray(0, 8).toString("ascii") !== "OPDFRES1" ||
        result.stdout.readUInt32LE(8) !== DARWIN_PROTOCOL) {
        fail("Darwin native helper returned a malformed protocol response");
    }
    const status = result.stdout.readUInt32LE(12);
    if (status !== 0 || result.code !== 0) {
        const phases = [
            "unknown",
            "activation",
            "root-open",
            "parent-preflight",
            "publication",
            "cleanup",
        ];
        const phase = phases[result.stdout.readUInt32LE(16)] ?? "unknown";
        const index = result.stdout.readUInt32LE(20);
        const operation = operations[index];
        const relative = operation ? ` for ${operation.relative}` : "";
        const diagnostic = result.stderr
            .toString("utf8")
            .trim()
            .replace(/[\r\n]+/g, " ")
            .slice(0, 300);
        fail(`Darwin native helper failed during ${phase}${relative}${diagnostic ? ` (${diagnostic})` : ""}`);
    }
}
async function pauseForTestSignal(coordination, race, action) {
    if (race?.action !== action)
        return;
    const marker = process.env.OPENCODE_PORTABLE_TEST_SIGNAL_MARKER;
    if (process.env.NODE_ENV !== "test" || typeof marker !== "string" || !path.isAbsolute(marker))
        fail("test signal marker must be an absolute path");
    await writeFile(marker, `${action}\n`, { flag: "wx", mode: 0o600 });
    await coordination.waitForSignal();
}
function activationPrefix() {
    if (process.env.NODE_ENV !== "test" || !process.env.OPENCODE_PORTABLE_TEST_INVOCATION_ID)
        return "opencode-portable-helper-";
    const id = process.env.OPENCODE_PORTABLE_TEST_INVOCATION_ID;
    if (!/^[a-z0-9-]{1,64}$/.test(id))
        fail("test invocation id must contain only lowercase ASCII letters, digits, and hyphens");
    return `opencode-portable-helper-${id}-`;
}
async function activateDarwinHelper(manifest, helperBytes, coordination, race) {
    const contract = manifest.writeCapabilities.backends.darwin.helper;
    if (process.env.NODE_ENV === "test" &&
        process.env.OPENCODE_PORTABLE_FORCE_NATIVE_UNAVAILABLE === "1")
        fail("Darwin native helper activation was test-forced unavailable");
    if (sha256(helperBytes) !== contract.sha256)
        fail("Darwin native helper SHA-256 does not match the portable manifest");
    const activationParentReal = await realpath(DARWIN_ACTIVATION_PARENT);
    if (activationParentReal !== DARWIN_ACTIVATION_PARENT)
        fail("trusted Darwin activation parent resolved unexpectedly");
    const activationParentStat = await lstat(activationParentReal);
    if (!activationParentStat.isDirectory() ||
        activationParentStat.isSymbolicLink() ||
        activationParentStat.uid !== 0 ||
        (activationParentStat.mode & 0o1000) === 0)
        fail("trusted Darwin activation parent must be a root-owned sticky directory");
    const directory = await mkdtemp(path.join(activationParentReal, activationPrefix()));
    const executable = path.join(directory, "darwin-portable-fs");
    try {
        await pauseForTestSignal(coordination, race, "signal-after-activation-directory");
        coordination.throwIfSignaled();
        await writeFile(executable, helperBytes, { flag: "wx", mode: 0o700 });
        coordination.throwIfSignaled();
        if (sha256(await readFile(executable)) !== contract.sha256)
            fail("materialized Darwin native helper failed integrity verification");
        coordination.throwIfSignaled();
        const selfTest = await runChild(executable, ["--self-test"], null, 65536, 5000, coordination);
        const expected = new RegExp(`^OPDFSELF1 protocol=${DARWIN_PROTOCOL} platform=darwin arch=${process.arch === "x64" ? "x86_64" : process.arch}\\n$`);
        if (selfTest.code !== 0 ||
            selfTest.signal ||
            !expected.test(selfTest.stdout.toString("utf8")) ||
            selfTest.stderr.length)
            fail("Darwin native helper self-test/protocol/architecture check failed");
        await pauseForTestSignal(coordination, race, "signal-between-helper-runs");
        coordination.throwIfSignaled();
        return { directory, executable };
    }
    catch (error) {
        let cleanupError = null;
        try {
            await rm(directory, { recursive: true, force: true });
        }
        catch (candidate) {
            cleanupError = candidate;
        }
        coordination.throwIfSignaled();
        throw cleanupError ?? error;
    }
}
function parseArgs(argv) {
    const options = { target: process.cwd(), dryRun: false, overwriteManaged: false };
    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === "--target") {
            const value = argv[++index];
            if (!value || value.startsWith("--"))
                fail("--target requires a path");
            options.target = path.resolve(process.cwd(), value);
        }
        else if (arg === "--dry-run")
            options.dryRun = true;
        else if (arg === "--overwrite-managed")
            options.overwriteManaged = true;
        else
            fail(`unknown argument: ${arg}`);
    }
    return options;
}
async function statOrNull(file) {
    try {
        return await lstat(file);
    }
    catch (error) {
        if (isNodeError(error) && error.code === "ENOENT")
            return null;
        throw error;
    }
}
async function rejectSymlinkPath(root, relative, includeLeaf = true) {
    let current = root;
    const parts = relative.split("/");
    const end = includeLeaf ? parts.length : parts.length - 1;
    for (let index = 0; index < end; index += 1) {
        const part = parts[index];
        if (part === undefined)
            return;
        current = path.join(current, part);
        const stat = await statOrNull(current);
        if (!stat)
            return;
        if (stat.isSymbolicLink())
            fail(`symlink path component is not allowed: ${relative}`);
        if (index < parts.length - 1 && !stat.isDirectory())
            fail(`non-directory path component blocks: ${relative}`);
    }
}
async function sourceBytes(relative, sourceReal) {
    await rejectSymlinkPath(SOURCE_ROOT, relative);
    const absolute = path.join(SOURCE_ROOT, ...relative.split("/"));
    const stat = await statOrNull(absolute);
    if (!stat?.isFile())
        fail(`managed source is not a regular file: ${relative}`);
    const resolved = await realpath(absolute);
    if (resolved !== path.join(sourceReal, ...relative.split("/")))
        fail(`managed source escapes source root: ${relative}`);
    return readFile(absolute);
}
function descriptorPath(handle, name = "") {
    if (!descriptorAlias)
        fail("descriptor-directory alias is unavailable");
    return `${descriptorAlias}/${handle.fd}${name ? `/${name}` : ""}`;
}
async function openDirectoryAt(parent, name, create) {
    const anchored = descriptorPath(parent, name);
    try {
        return {
            handle: await open(anchored, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW),
            created: false,
        };
    }
    catch (error) {
        if (!create || !isNodeError(error) || error.code !== "ENOENT")
            throw error;
        let created = false;
        try {
            await mkdir(anchored, { mode: 0o755 });
            created = true;
        }
        catch (mkdirError) {
            if (!isNodeError(mkdirError) || mkdirError.code !== "EEXIST")
                throw mkdirError;
        }
        return {
            handle: await open(anchored, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW),
            created,
        };
    }
}
async function openPinnedParent(rootHandle, relative, create, createdDirectories = []) {
    let current = rootHandle;
    let owned = false;
    let prefix = "";
    try {
        for (const part of path.posix
            .dirname(relative)
            .split("/")
            .filter((item) => item !== ".")) {
            const next = await openDirectoryAt(current, part, create);
            if (owned)
                await current.close();
            current = next.handle;
            owned = true;
            prefix = prefix ? `${prefix}/${part}` : part;
            if (next.created)
                createdDirectories.push(prefix);
        }
        return { handle: current, owned };
    }
    catch (error) {
        if (owned)
            await current.close();
        throw error;
    }
}
async function assertParentStillReachable(rootHandle, relative, pinned) {
    let current;
    try {
        try {
            current = await openPinnedParent(rootHandle, relative, false);
        }
        catch {
            fail(`destination parent changed during write: ${relative}`);
        }
        if (!current)
            fail(`destination parent changed during write: ${relative}`);
        const [expected, actual] = await Promise.all([pinned.stat(), current.handle.stat()]);
        if (expected.dev !== actual.dev || expected.ino !== actual.ino)
            fail(`destination parent changed during write: ${relative}`);
    }
    finally {
        if (current?.owned)
            await current.handle.close();
    }
}
async function atomicWrite(rootHandle, parentHandle, operation, race) {
    const basename = path.posix.basename(operation.relative);
    const destination = descriptorPath(parentHandle, basename);
    const temporaryName = `.${basename}.portable-tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
    const temporary = descriptorPath(parentHandle, temporaryName);
    try {
        await assertParentStillReachable(rootHandle, operation.relative, parentHandle);
        await writeFile(temporary, operation.bytes, { flag: "wx", mode: 0o644 });
        if (race?.action === "create-destination" && race.relative === operation.relative)
            await writeFile(destination, "concurrent destination\n", { flag: "wx" });
        if (operation.allowOverwrite)
            await rename(temporary, destination);
        else {
            try {
                await link(temporary, destination);
            }
            catch (error) {
                if (isNodeError(error) && error.code === "EEXIST")
                    fail(`destination appeared after preflight: ${operation.relative}`);
                throw error;
            }
            await unlink(temporary);
        }
        await assertParentStillReachable(rootHandle, operation.relative, parentHandle);
    }
    finally {
        await rm(temporary, { force: true });
    }
}
function sameIdentity(left, right) {
    return left.dev === right.dev && left.ino === right.ino;
}
async function discoverDescriptorAlias(rootHandle, targetIdentity, aliases) {
    if (process.env.NODE_ENV === "test" &&
        process.env.OPENCODE_PORTABLE_FORCE_DESCRIPTOR_UNAVAILABLE === "1")
        return null;
    if (!Number.isInteger(constants.O_DIRECTORY) || !Number.isInteger(constants.O_NOFOLLOW))
        return null;
    for (const alias of aliases) {
        let candidate;
        let child;
        const probeName = `.portable-descriptor-probe-${process.pid}-${Math.random().toString(16).slice(2)}`;
        const probePath = `${alias}/${rootHandle.fd}/${probeName}`;
        try {
            candidate = await open(`${alias}/${rootHandle.fd}`, constants.O_RDONLY | constants.O_DIRECTORY);
            if (!sameIdentity(await candidate.stat(), targetIdentity))
                continue;
            await mkdir(probePath, { mode: 0o700 });
            child = await open(probePath, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
            if (!(await child.stat()).isDirectory())
                continue;
            return alias;
        }
        catch {
            // Try the next declared alias.
        }
        finally {
            await child?.close();
            try {
                await rmdir(probePath);
            }
            catch (error) {
                if (!isNodeError(error) || error.code !== "ENOENT")
                    throw error;
            }
            await candidate?.close();
        }
    }
    return null;
}
async function probeHardLinks(parentHandle, relative) {
    const suffix = `${process.pid}-${Math.random().toString(16).slice(2)}`;
    const source = descriptorPath(parentHandle, `.portable-link-probe-${suffix}`);
    const destination = descriptorPath(parentHandle, `.portable-link-probe-${suffix}-linked`);
    try {
        await writeFile(source, "probe\n", { flag: "wx", mode: 0o600 });
        await link(source, destination);
    }
    catch (error) {
        fail(`descriptor-relative same-directory hard-link publication is required but unavailable for ${relative} (${isNodeError(error) ? (error.code ?? error.message) : String(error)})`);
    }
    finally {
        await Promise.all([rm(source, { force: true }), rm(destination, { force: true })]);
    }
}
async function cleanupCreatedDirectories(rootHandle, createdDirectories) {
    for (const relative of [...new Set(createdDirectories)].sort((left, right) => right.split("/").length - left.split("/").length)) {
        try {
            await rmdir(descriptorPath(rootHandle, relative));
        }
        catch (error) {
            if (!isNodeError(error) || !["ENOENT", "ENOTEMPTY", "EEXIST"].includes(error.code ?? ""))
                throw error;
        }
    }
}
async function prepareDestinationParents(rootHandle, operations, race, targetReal) {
    const parents = new Map();
    const createdDirectories = [];
    try {
        for (const operation of operations) {
            const key = path.posix.dirname(operation.relative);
            if (!parents.has(key))
                parents.set(key, await openPinnedParent(rootHandle, operation.relative, true, createdDirectories));
        }
        if (race?.action === "replace-parent-before-probe") {
            if (typeof race.replacement !== "string" || !path.isAbsolute(race.replacement))
                fail("test replacement path must be absolute");
            const selected = race.relative;
            safeRelative(selected, "test probe parent relative");
            if (typeof selected !== "string")
                fail("test probe parent relative must be a string");
            await rename(path.join(targetReal, ...selected.split("/")), race.replacement);
            await mkdir(path.join(targetReal, ...selected.split("/")));
        }
        for (const [relative, parent] of parents) {
            const representative = operations.find((operation) => path.posix.dirname(operation.relative) === relative)?.relative;
            if (!representative)
                fail(`destination parent has no representative operation: ${relative}`);
            await assertParentStillReachable(rootHandle, representative, parent.handle);
            if (race?.action === "fail-probe" && race.relative === relative)
                fail(`descriptor-relative hard-link capability probe failed for ${relative} before publication`);
            await probeHardLinks(parent.handle, relative);
            await assertParentStillReachable(rootHandle, representative, parent.handle);
        }
        return { parents, createdDirectories };
    }
    catch (error) {
        for (const parent of parents.values())
            if (parent.owned)
                await parent.handle.close();
        await cleanupCreatedDirectories(rootHandle, createdDirectories);
        throw error;
    }
}
function testRaceOptions() {
    if (process.env.NODE_ENV !== "test" || !process.env.OPENCODE_PORTABLE_TEST_RACE)
        return null;
    const value = JSON.parse(process.env.OPENCODE_PORTABLE_TEST_RACE);
    if (!isObject(value) || !isRaceAction(value.action))
        fail("invalid test race action");
    if (["create-destination", "insert-symlink", "replace-parent-before-probe", "fail-probe"].includes(value.action))
        safeRelative(value.relative, "test race relative");
    return {
        action: value.action,
        ...(typeof value.relative === "string" ? { relative: value.relative } : {}),
        ...(typeof value.replacement === "string" ? { replacement: value.replacement } : {}),
        ...(typeof value.target === "string" ? { target: value.target } : {}),
    };
}
async function applyAfterOpenRootRace(race, targetReal) {
    if (race?.action !== "replace-root-after-open")
        return;
    if (typeof race.replacement !== "string" || !path.isAbsolute(race.replacement))
        fail("test replacement path must be absolute");
    await rename(targetReal, race.replacement);
    await mkdir(targetReal);
}
async function assertRootPathIdentity(targetReal, targetIdentity) {
    const current = await lstat(targetReal);
    if (current.isSymbolicLink() || !sameIdentity(targetIdentity, current))
        fail("opened target differs from the preflight-inspected target");
}
async function applyRootRace(race, targetReal) {
    if (!race || !["replace-root", "replace-intermediate"].includes(race.action))
        return;
    if (typeof race.replacement !== "string" || !path.isAbsolute(race.replacement))
        fail("test replacement path must be absolute");
    if (race.action === "replace-root") {
        await rename(targetReal, race.replacement);
        await mkdir(targetReal);
    }
    else {
        const parent = path.dirname(targetReal);
        await rename(parent, race.replacement);
        await mkdir(parent);
        await mkdir(targetReal);
    }
}
async function main() {
    const options = parseArgs(process.argv.slice(2));
    const race = testRaceOptions();
    const targetStat = await statOrNull(options.target);
    if (!targetStat?.isDirectory() || targetStat.isSymbolicLink())
        fail(`target must be an existing real directory: ${options.target}`);
    const targetPreflightIdentity = await lstat(options.target, { bigint: true });
    if (race?.action === "replace-root-between-snapshots") {
        if (typeof race.replacement !== "string" || !path.isAbsolute(race.replacement))
            fail("test replacement path must be absolute");
        await rename(options.target, race.replacement);
        await mkdir(options.target);
    }
    await access(options.target, constants.R_OK | constants.W_OK);
    const sourceReal = await realpath(SOURCE_ROOT);
    const targetReal = await realpath(options.target);
    const canonicalTargetIdentity = await lstat(targetReal, { bigint: true });
    if (!sameIdentity(targetPreflightIdentity, canonicalTargetIdentity))
        fail("canonical target differs from the exact preflight identity snapshot");
    const targetIdentity = await lstat(targetReal);
    if (!sameIdentity(targetStat, targetIdentity))
        fail("canonical target differs from the preflight-inspected target");
    const manifest = validateManifest(JSON.parse(await readFile(path.join(SOURCE_ROOT, MANIFEST_PATH), "utf8")));
    const operations = [];
    const collisions = [];
    let unchanged = 0;
    for (const relative of manifest.managedFiles) {
        const bytes = await sourceBytes(relative, sourceReal);
        await rejectSymlinkPath(targetReal, relative);
        const destination = path.join(targetReal, ...relative.split("/"));
        const stat = await statOrNull(destination);
        if (stat && !stat.isFile())
            fail(`managed destination is not a regular file: ${relative}`);
        if (!stat)
            operations.push({ kind: "managed", relative, destination, bytes, allowOverwrite: false });
        else if ((await readFile(destination)).equals(bytes))
            unchanged += 1;
        else if (options.overwriteManaged)
            operations.push({ kind: "managed", relative, destination, bytes, allowOverwrite: true });
        else
            collisions.push(relative);
    }
    for (const seed of manifest.memorySeeds) {
        const bytes = await sourceBytes(seed.source, sourceReal);
        await rejectSymlinkPath(targetReal, seed.target);
        const destination = path.join(targetReal, ...seed.target.split("/"));
        const stat = await statOrNull(destination);
        if (!stat)
            operations.push({
                kind: "memory",
                relative: seed.target,
                destination,
                bytes,
                allowOverwrite: false,
            });
        else if (stat.isFile())
            unchanged += 1;
        else
            fail(`memory seed destination is not a regular file: ${seed.target}`);
    }
    if (collisions.length)
        fail(`managed collisions (${collisions.length}): ${collisions.join(", ")}; rerun with --overwrite-managed only after review`);
    let writeSafety = "not-exercised";
    if (!options.dryRun) {
        if (process.platform === "darwin") {
            const helperBytes = await sourceBytes(DARWIN_HELPER_PATH, sourceReal);
            const coordination = createDarwinSignalCoordinator();
            let activation = null;
            let operationError = null;
            try {
                activation = await activateDarwinHelper(manifest, helperBytes, coordination, race);
                coordination.throwIfSignaled();
                await applyRootRace(race, targetReal);
                if (race?.action === "replace-root-after-open")
                    await applyAfterOpenRootRace(race, targetReal);
                if (race?.action === "insert-symlink") {
                    if (typeof race.target !== "string" || !path.isAbsolute(race.target))
                        fail("test symlink target must be absolute");
                    if (typeof race.relative !== "string")
                        fail("test race relative must be a string");
                    await symlink(race.target, path.join(targetReal, ...race.relative.split("/")), "dir");
                }
                const nativeOperations = race?.action === "create-destination"
                    ? [...operations].sort((left, right) => Number(right.relative === race.relative) -
                        Number(left.relative === race.relative))
                    : operations;
                const request = encodeDarwinRequest(targetReal, targetPreflightIdentity, nativeOperations, race);
                const helperTimeout = race?.action === "helper-timeout" ? 200 : 30000;
                coordination.throwIfSignaled();
                const result = await runChild(activation.executable, [], request, 65536, helperTimeout, coordination);
                parseDarwinResponse(result, nativeOperations);
                writeSafety = manifest.writeCapabilities.backends.darwin.safety;
            }
            catch (error) {
                operationError = error;
            }
            if (activation) {
                try {
                    await pauseForTestSignal(coordination, race, "signal-during-final-cleanup");
                    await rm(activation.directory, { recursive: true, force: true });
                }
                catch (error) {
                    operationError ??= error;
                }
            }
            const signalError = coordination.signalError();
            coordination.dispose();
            if (signalError)
                throw signalError;
            if (operationError)
                throw operationError;
        }
        else if (process.platform === "linux") {
            await applyRootRace(race, targetReal);
            if (race?.action === "insert-symlink") {
                if (typeof race.target !== "string" || !path.isAbsolute(race.target))
                    fail("test symlink target must be absolute");
                if (typeof race.relative !== "string")
                    fail("test race relative must be a string");
                await symlink(race.target, path.join(targetReal, ...race.relative.split("/")), "dir");
            }
            await assertRootPathIdentity(targetReal, targetIdentity);
            const rootHandle = await open(targetReal, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
            let prepared;
            try {
                const handleIdentity = await rootHandle.stat();
                if (!sameIdentity(targetIdentity, handleIdentity))
                    fail("opened target differs from the preflight-inspected target");
                const aliases = manifest.writeCapabilities.backends.linux.descriptorDirectoryAliases;
                descriptorAlias = await discoverDescriptorAlias(rootHandle, targetIdentity, aliases);
                if (!descriptorAlias)
                    fail(`no usable descriptor-directory alias; tried ${aliases.join(", ")}; capability contract requires fail-before-file-publication`);
                await applyAfterOpenRootRace(race, targetReal);
                await assertRootPathIdentity(targetReal, targetIdentity);
                prepared = await prepareDestinationParents(rootHandle, operations, race, targetReal);
                for (const operation of operations) {
                    const parent = prepared.parents.get(path.posix.dirname(operation.relative));
                    if (!parent)
                        fail(`destination parent is unavailable: ${operation.relative}`);
                    await atomicWrite(rootHandle, parent.handle, operation, race);
                }
                writeSafety = `${manifest.writeCapabilities.backends.linux.safety}:${descriptorAlias}`;
            }
            finally {
                if (prepared)
                    for (const parent of prepared.parents.values())
                        if (parent.owned)
                            await parent.handle.close();
                await rootHandle.close();
                descriptorAlias = null;
            }
        }
        else
            fail(`unsupported platform ${process.platform}; portable publication is available only on linux and darwin`);
    }
    const managedCount = operations.filter((item) => item.kind === "managed").length;
    const memoryCount = operations.filter((item) => item.kind === "memory").length;
    console.log(`Portable harness bootstrap ${options.dryRun ? "dry-run " : ""}complete: created/updated=${managedCount}, memory-created=${memoryCount}, unchanged=${unchanged}, collisions=0, write-safety=${writeSafety}, target=${targetReal}`);
}
main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    if (isObject(error) && typeof error.parentSignal === "string") {
        process.removeAllListeners(error.parentSignal);
        setTimeout(() => process.exit(1), 1000);
        process.kill(process.pid, error.parentSignal);
        return;
    }
    process.exitCode = 1;
});
