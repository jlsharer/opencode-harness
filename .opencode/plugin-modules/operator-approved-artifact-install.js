#!/usr/bin/env node
// Operator-only artifact acquisition: never executes or installs the downloaded bytes.
import { createHash } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { open, lstat } from "node:fs/promises";
import { constants } from "node:fs";
import { request } from "node:https";
import { dirname, basename, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
const MAX_BYTES = 64 * 1024 * 1024;
const MAX_MS = 60_000;
export const httpsFetcher = (url, signal) => new Promise((ok, fail) => {
    const req = request(url, { method: "GET", signal, timeout: MAX_MS }, (res) => {
        ok({ statusCode: res.statusCode ?? 0, headers: res.headers, body: res });
    });
    req.on("error", fail);
    req.end();
});
function pinnedUrl(value) {
    const url = new URL(value);
    if (url.protocol !== "https:" ||
        !url.hostname ||
        url.username ||
        url.password ||
        url.hash ||
        (url.port && url.port !== "443") ||
        url.href !== value)
        throw new Error("exact HTTPS URL on port 443 required");
    return url;
}
async function checkedDestination(destination) {
    if (!destination.startsWith(sep) ||
        resolve(destination) !== destination ||
        basename(destination) === "." ||
        basename(destination) === ".." ||
        destination.includes("//"))
        throw new Error("destination must be canonical absolute path");
    let parent = dirname(destination);
    while (true) {
        const stat = await lstat(parent);
        if (!stat.isDirectory() || stat.isSymbolicLink())
            throw new Error("symlink or non-directory ancestor");
        if (parent === dirname(destination) &&
            (stat.uid !== process.getuid?.() || (stat.mode & 0o777) !== 0o700))
            throw new Error("destination parent must be current-user mode 0700 directory");
        if (parent === sep)
            break;
        parent = dirname(parent);
    }
    try {
        await lstat(destination);
        throw new Error("destination already exists");
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
    }
}
export async function acquireArtifact(options, approve, fetcher = httpsFetcher) {
    const url = pinnedUrl(options.url);
    if (!/^[a-f0-9]{64}$/.test(options.sha256))
        throw new Error("lowercase SHA-256 required");
    if (!Number.isSafeInteger(options.maxBytes) ||
        options.maxBytes < 1 ||
        options.maxBytes > MAX_BYTES ||
        !Number.isSafeInteger(options.timeoutMs) ||
        options.timeoutMs < 1 ||
        options.timeoutMs > MAX_MS)
        throw new Error("invalid byte or time bound");
    await checkedDestination(options.destination);
    const challenge = `APPROVE DOWNLOAD ${JSON.stringify(options)}`;
    if ((await approve(challenge)) !== challenge)
        throw new Error("exact interactive approval required");
    await checkedDestination(options.destination);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    let file;
    let identity;
    try {
        file = await open(options.destination, constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | constants.O_NOFOLLOW, 0o600);
        const stat = await file.stat();
        identity = { dev: stat.dev, ino: stat.ino };
        const response = await fetcher(url, controller.signal);
        if (response.statusCode !== 200 ||
            response.headers.location !== undefined ||
            response.headers["content-encoding"] !== undefined)
            throw new Error("HTTP 200 without redirect or encoding required");
        const length = response.headers["content-length"];
        if (length !== undefined &&
            (typeof length !== "string" ||
                !/^(0|[1-9][0-9]*)$/.test(length) ||
                Number(length) > options.maxBytes))
            throw new Error("invalid or excessive Content-Length");
        let count = 0;
        const hash = createHash("sha256");
        for await (const chunk of response.body) {
            if (controller.signal.aborted)
                throw new Error("download timed out");
            if (!(chunk instanceof Uint8Array) || chunk.length > options.maxBytes - count)
                throw new Error("artifact exceeds byte limit");
            count += chunk.length;
            hash.update(chunk);
            await file.writeFile(chunk);
        }
        if (controller.signal.aborted ||
            (length !== undefined && count !== Number(length)) ||
            hash.digest("hex") !== options.sha256)
            throw new Error("timeout, length, or SHA-256 mismatch");
        await file.sync();
        return count;
    }
    catch (error) {
        if (identity) {
            try {
                const current = await lstat(options.destination);
                if (current.dev === identity.dev && current.ino === identity.ino && current.isFile()) {
                    // Unlink only the file this invocation created; never follow a substituted symlink.
                    const { unlink } = await import("node:fs/promises");
                    await unlink(options.destination);
                }
            }
            catch (cleanupError) {
                if (cleanupError.code !== "ENOENT")
                    throw new AggregateError([error, cleanupError], "artifact cleanup failed");
            }
        }
        throw error;
    }
    finally {
        clearTimeout(timer);
        await file?.close();
    }
}
function parseArgs(args) {
    const names = ["--url", "--sha256", "--destination", "--max-bytes", "--timeout-ms"];
    if (args.length !== names.length * 2)
        throw new Error(`required: ${names.join(" ")}`);
    const values = new Map();
    for (let i = 0; i < args.length; i += 2) {
        if (!names.includes(args[i]) || values.has(args[i]) || !args[i + 1])
            throw new Error("invalid arguments");
        values.set(args[i], args[i + 1]);
    }
    return {
        url: values.get("--url"),
        sha256: values.get("--sha256"),
        destination: values.get("--destination"),
        maxBytes: Number(values.get("--max-bytes")),
        timeoutMs: Number(values.get("--timeout-ms")),
    };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
    try {
        if (!stdin.isTTY || !stdout.isTTY)
            throw new Error("operator interactive terminal required");
        const args = parseArgs(process.argv.slice(2));
        const rl = createInterface({ input: stdin, output: stdout });
        try {
            const bytes = await acquireArtifact(args, (challenge) => rl.question(`Type exactly ${challenge}\n> `));
            console.log(`Verified ${bytes} bytes at ${args.destination}; not installed or executed.`);
        }
        finally {
            rl.close();
        }
    }
    catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
