#!/usr/bin/env node
// Operator-only, offline installation of one inert, SHA-pinned npm-style tar.gz.
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { pathToFileURL } from "node:url";
import { gunzipSync } from "node:zlib";
const MAX_ARCHIVE = 64 * 1024 * 1024;
const MAX_EXPANDED = 256 * 1024 * 1024;
const MAX_FILES = 4096;
function canonical(value) {
    return (isAbsolute(value) &&
        resolve(value) === value &&
        !value.includes("//") &&
        !value.includes("\0") &&
        value !== sep);
}
async function privateParent(target) {
    if (!canonical(target))
        throw new Error("canonical absolute path required");
    const parent = dirname(target);
    let current = sep;
    for (const component of parent.slice(1).split(sep).filter(Boolean)) {
        current = join(current, component);
        const stat = await lstat(current);
        if (!stat.isDirectory() || stat.isSymbolicLink())
            throw new Error("unsafe path ancestor");
    }
    const stat = await lstat(parent);
    if (stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700)
        throw new Error("parent must be current-user mode 0700");
}
function field(block, start, size) {
    const bytes = block.subarray(start, start + size);
    const end = bytes.indexOf(0);
    return bytes.subarray(0, end < 0 ? size : end).toString("utf8");
}
function octal(text) {
    if (!/^[0-7]+\s*$/.test(text))
        throw new Error("invalid tar size");
    const value = Number.parseInt(text, 8);
    if (!Number.isSafeInteger(value))
        throw new Error("invalid tar size");
    return value;
}
function parseArchive(raw, limit, maxFiles) {
    const tar = gunzipSync(raw, { maxOutputLength: limit + 1024 });
    const entries = [];
    const seen = new Set();
    let offset = 0;
    let total = 0;
    let headers = 0;
    while (offset + 512 <= tar.length) {
        const header = tar.subarray(offset, offset + 512);
        if (header.every((byte) => byte === 0)) {
            if (tar.subarray(offset).some((byte) => byte !== 0))
                throw new Error("invalid tar trailer");
            return entries;
        }
        if (++headers > maxFiles)
            throw new Error("archive entry limit exceeded");
        const stored = octal(field(header, 148, 8));
        const checksum = header.reduce((sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte), 0);
        if (checksum !== stored || field(header, 257, 6) !== "ustar")
            throw new Error("invalid tar header");
        const size = octal(field(header, 124, 12));
        const kind = header[156];
        const name = field(header, 0, 100);
        const prefix = field(header, 345, 155);
        const full = prefix ? `${prefix}/${name}` : name;
        const parts = full.replace(/\/$/, "").split("/");
        if (parts[0] !== "package" ||
            (parts.length < 2 && kind !== 53) ||
            parts.slice(1).some((p) => !p || p === "." || p === ".." || p.includes("\\")) ||
            full.includes("\0") ||
            full.startsWith("/") ||
            full.includes(":"))
            throw new Error("unsafe archive path");
        const relative = parts.slice(1).join("/");
        if (!relative && kind === 53 && size === 0) {
            offset += 512;
            continue;
        }
        if (seen.has(relative))
            throw new Error("duplicate archive path");
        seen.add(relative);
        offset += 512;
        if (size > tar.length - offset)
            throw new Error("truncated archive");
        if (kind === 0 || kind === 48) {
            total += size;
            if (total > limit || entries.length >= maxFiles)
                throw new Error("expanded archive limit exceeded");
            entries.push({ path: relative, bytes: tar.subarray(offset, offset + size) });
        }
        else if (kind !== 53 || size !== 0)
            throw new Error("links, special files, and extensions are forbidden");
        offset += Math.ceil(size / 512) * 512;
    }
    throw new Error("tar trailer missing");
}
/** Independent read-only receipt check; extra or changed files invalidate the result. */
export async function verifyInstall(destination, archive, expectedSha256, expectedVersion) {
    await privateParent(destination);
    await privateParent(archive);
    const source = await open(archive, constants.O_RDONLY | constants.O_NOFOLLOW);
    let sourceBytes;
    try {
        const stat = await source.stat();
        if (!stat.isFile() ||
            stat.uid !== process.getuid?.() ||
            (stat.mode & 0o077) !== 0 ||
            stat.size > MAX_ARCHIVE)
            throw new Error("unsafe archive source");
        sourceBytes = await source.readFile();
        const after = await source.stat();
        if (stat.dev !== after.dev ||
            stat.ino !== after.ino ||
            stat.size !== after.size ||
            stat.mtimeMs !== after.mtimeMs)
            throw new Error("archive source changed during verification");
    }
    finally {
        await source.close();
    }
    if (createHash("sha256").update(sourceBytes).digest("hex") !== expectedSha256)
        throw new Error("archive SHA-256 mismatch");
    const sourceEntries = parseArchive(sourceBytes, MAX_EXPANDED, MAX_FILES);
    const packageManifest = sourceEntries.find((entry) => entry.path === "package.json");
    if (!packageManifest ||
        JSON.parse(packageManifest.bytes.toString("utf8")).version !==
            expectedVersion)
        throw new Error("archive package version mismatch");
    const expectedFiles = Object.fromEntries(sourceEntries.map((entry) => [
        entry.path,
        createHash("sha256").update(entry.bytes).digest("hex"),
    ]));
    const rootStat = await lstat(destination);
    if (!rootStat.isDirectory() ||
        rootStat.isSymbolicLink() ||
        rootStat.uid !== process.getuid?.() ||
        (rootStat.mode & 0o777) !== 0o700)
        throw new Error("unsafe installed root");
    const receiptPath = join(destination, ".harness-install-receipt.json");
    const receiptFile = await open(receiptPath, constants.O_RDONLY | constants.O_NOFOLLOW);
    let receiptBytes;
    try {
        receiptBytes = await receiptFile.readFile({ encoding: "utf8" });
    }
    finally {
        await receiptFile.close();
    }
    const receipt = JSON.parse(receiptBytes);
    if (!receipt ||
        receipt.version !== expectedVersion ||
        receipt.archiveSha256 !== expectedSha256 ||
        receipt.scriptPolicy !== "never" ||
        !receipt.files ||
        typeof receipt.files !== "object" ||
        Array.isArray(receipt.files))
        throw new Error("invalid install receipt");
    if (JSON.stringify(receipt.files) !==
        JSON.stringify(Object.fromEntries(Object.entries(expectedFiles).sort(([a], [b]) => a.localeCompare(b)))))
        throw new Error("receipt differs from pinned archive inventory");
    const found = new Set();
    async function walk(dir, prefix = "") {
        for (const name of await readdir(dir)) {
            const relative = prefix ? `${prefix}/${name}` : name;
            const filename = join(dir, name);
            const stat = await lstat(filename);
            if (stat.isSymbolicLink() || stat.uid !== process.getuid?.())
                throw new Error("unsafe installed entry");
            if (stat.isDirectory()) {
                if ((stat.mode & 0o777) !== 0o700)
                    throw new Error("unsafe installed directory");
                await walk(filename, relative);
            }
            else if (stat.isFile() && (stat.mode & 0o777) === 0o600) {
                if (relative === ".harness-install-receipt.json")
                    continue;
                if (!/^[a-f0-9]{64}$/.test(receipt.files[relative] ?? ""))
                    throw new Error("unlisted installed file");
                const hash = createHash("sha256")
                    .update(await readFile(filename))
                    .digest("hex");
                if (hash !== receipt.files[relative])
                    throw new Error("installed file changed");
                found.add(relative);
            }
            else
                throw new Error("unsafe installed file");
        }
    }
    await walk(destination);
    if (found.size !== Object.keys(receipt.files).length)
        throw new Error("installed file missing");
    return { files: found.size, version: receipt.version };
}
export async function installArchive(request, approve, signal) {
    const checkInterrupted = () => {
        if (signal?.aborted)
            throw new Error("install interrupted");
    };
    const url = new URL(request.sourceUrl);
    if (url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.hash ||
        url.href !== request.sourceUrl)
        throw new Error("exact HTTPS source required");
    if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/.test(request.version) ||
        !/^[a-f0-9]{64}$/.test(request.sha256) ||
        request.scriptPolicy !== "never" ||
        !Number.isSafeInteger(request.maxArchiveBytes) ||
        request.maxArchiveBytes < 1 ||
        request.maxArchiveBytes > MAX_ARCHIVE ||
        !Number.isSafeInteger(request.maxExpandedBytes) ||
        request.maxExpandedBytes < 1 ||
        request.maxExpandedBytes > MAX_EXPANDED ||
        !Number.isSafeInteger(request.maxFiles) ||
        request.maxFiles < 1 ||
        request.maxFiles > MAX_FILES)
        throw new Error("invalid pinned version, integrity, script policy, or limits");
    await privateParent(request.archive);
    await privateParent(request.destination);
    if (request.archive === request.destination ||
        dirname(request.archive) !== dirname(request.destination))
        throw new Error("archive and destination must be siblings under one private parent");
    try {
        await lstat(request.destination);
        throw new Error("destination exists");
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
    }
    const challenge = `INSTALL ${JSON.stringify(request)}`;
    if ((await approve(challenge)) !== challenge)
        throw new Error("exact per-action approval required");
    checkInterrupted();
    const handle = await open(request.archive, constants.O_RDONLY | constants.O_NOFOLLOW);
    let raw;
    try {
        const before = await handle.stat();
        if (!before.isFile() ||
            before.uid !== process.getuid?.() ||
            before.size > request.maxArchiveBytes ||
            (before.mode & 0o077) !== 0)
            throw new Error("unsafe archive file");
        raw = await handle.readFile();
        const after = await handle.stat();
        if (before.dev !== after.dev ||
            before.ino !== after.ino ||
            before.size !== after.size ||
            before.mtimeMs !== after.mtimeMs)
            throw new Error("archive changed during read");
    }
    finally {
        await handle.close();
    }
    if (createHash("sha256").update(raw).digest("hex") !== request.sha256)
        throw new Error("archive SHA-256 mismatch");
    const entries = parseArchive(raw, request.maxExpandedBytes, request.maxFiles);
    if (!entries.some((entry) => entry.path === "package.json"))
        throw new Error("package manifest missing");
    const pkg = JSON.parse(entries.find((entry) => entry.path === "package.json").bytes.toString("utf8"));
    if (pkg.version !== request.version)
        throw new Error("package version mismatch");
    const staging = join(dirname(request.destination), `.${basename(request.destination)}-${process.pid}-${Date.now()}.staging`);
    await mkdir(staging, { mode: 0o700 });
    let published = false;
    try {
        const inventory = {};
        for (const entry of entries) {
            checkInterrupted();
            const target = join(staging, entry.path);
            await mkdir(dirname(target), { recursive: true, mode: 0o700 });
            await writeFile(target, entry.bytes, { flag: "wx", mode: 0o600 });
            checkInterrupted();
            inventory[entry.path] = createHash("sha256").update(entry.bytes).digest("hex");
        }
        const receipt = {
            sourceUrl: request.sourceUrl,
            version: request.version,
            archiveSha256: request.sha256,
            scriptPolicy: "never",
            files: Object.fromEntries(Object.entries(inventory).sort(([a], [b]) => a.localeCompare(b))),
        };
        await writeFile(join(staging, ".harness-install-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { flag: "wx", mode: 0o600 });
        checkInterrupted();
        await privateParent(request.destination);
        try {
            await lstat(request.destination);
            throw new Error("destination appeared during install");
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
        checkInterrupted();
        await rename(staging, request.destination);
        published = true;
        return {
            files: entries.length,
            receipt: join(request.destination, ".harness-install-receipt.json"),
        };
    }
    finally {
        if (!published)
            await rm(staging, { recursive: true, force: true });
    }
}
function args(argv) {
    const keys = [
        "source-url",
        "version",
        "archive",
        "sha256",
        "destination",
        "max-archive-bytes",
        "max-expanded-bytes",
        "max-files",
        "script-policy",
    ];
    if (argv.length !== keys.length * 2)
        throw new Error(`required: ${keys.map((k) => `--${k}`).join(" ")}`);
    const parsed = new Map();
    for (let i = 0; i < argv.length; i += 2) {
        const key = argv[i].replace(/^--/, "");
        if (!keys.includes(key) || parsed.has(key))
            throw new Error("invalid argument");
        parsed.set(key, argv[i + 1]);
    }
    return {
        sourceUrl: parsed.get("source-url"),
        version: parsed.get("version"),
        archive: parsed.get("archive"),
        sha256: parsed.get("sha256"),
        destination: parsed.get("destination"),
        maxArchiveBytes: Number(parsed.get("max-archive-bytes")),
        maxExpandedBytes: Number(parsed.get("max-expanded-bytes")),
        maxFiles: Number(parsed.get("max-files")),
        scriptPolicy: parsed.get("script-policy"),
    };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        if (process.argv[2] === "--verify") {
            if (process.argv.length !== 7)
                throw new Error("verify requires destination, archive, SHA-256, version");
            console.log(await verifyInstall(process.argv[3], process.argv[4], process.argv[5], process.argv[6]));
        }
        else {
            if (!stdin.isTTY || !stdout.isTTY)
                throw new Error("operator interactive terminal required");
            const controller = new AbortController();
            const interrupt = () => controller.abort();
            process.on("SIGINT", interrupt);
            process.on("SIGTERM", interrupt);
            const rl = createInterface({ input: stdin, output: stdout });
            try {
                console.log(await installArchive(args(process.argv.slice(2)), (challenge) => rl.question(`Type exactly ${challenge}\n> `, { signal: controller.signal }), controller.signal));
            }
            finally {
                rl.close();
                process.off("SIGINT", interrupt);
                process.off("SIGTERM", interrupt);
            }
        }
    }
    catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
