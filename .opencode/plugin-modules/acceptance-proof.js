/** Offline acceptance evidence. This is a diff guard, never a shell sandbox. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync, } from "node:fs";
import path from "node:path";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const SECRET = /(^|\/)(?:\.env(?:\..*)?|\.aws|\.ssh|credentials?(?:\..*)?|auth\.json|.*\.(?:pem|key|p12|pfx))$/i;
function relative(value) {
    if (!value ||
        value.includes("\\") ||
        value.includes("\0") ||
        path.posix.isAbsolute(value) ||
        value.split("/").some((p) => !p || p === "." || p === "..") ||
        value === ".git" ||
        value.startsWith(".git/"))
        throw new Error("unsafe proof path");
    return value;
}
function canonicalRoot(root) {
    if (!path.isAbsolute(root) || path.resolve(root) !== root || realpathSync(root) !== root)
        throw new Error("proof root must be canonical and symlink-free");
    let current = path.parse(root).root;
    for (const part of root.slice(current.length).split(path.sep).filter(Boolean)) {
        current = path.join(current, part);
        if (lstatSync(current).isSymbolicLink())
            throw new Error("symlink in proof root");
    }
    return root;
}
function fileHash(root, name) {
    relative(name);
    if (SECRET.test(name) || name.split("/").some((p) => p === ".aws" || p === ".ssh"))
        throw new Error("secret candidate prevents acceptance proof");
    let current = root;
    for (const part of name.split("/")) {
        current = path.join(current, part);
        if (lstatSync(current).isSymbolicLink())
            throw new Error("symlink prevents acceptance proof");
    }
    const fd = openSync(current, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const before = fstatSync(fd);
        if (!before.isFile() || before.size > 16 * 1024 * 1024)
            throw new Error("proof requires bounded regular files");
        const bytes = readFileSync(fd);
        const after = fstatSync(fd);
        const final = lstatSync(current);
        if (before.dev !== final.dev ||
            before.ino !== final.ino ||
            before.size !== after.size ||
            before.mtimeMs !== after.mtimeMs ||
            before.ctimeMs !== after.ctimeMs ||
            final.isSymbolicLink())
            throw new Error("file changed during proof capture");
        return hash(`${name}\0${before.mode}\0${hash(bytes)}`);
    }
    finally {
        closeSync(fd);
    }
}
function git(root, args) {
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("GIT_")));
    return execFileSync("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "-C", root, ...args], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: { ...env, GIT_OPTIONAL_LOCKS: "0" } });
}
/** Names only: ignored directory contents and secret bytes are never read. */
export function ignoredWorkspacePaths(root) {
    canonicalRoot(root);
    const names = git(root, [
        "ls-files",
        "-z",
        "--others",
        "--ignored",
        "--exclude-standard",
        "--directory",
        "--no-empty-directory",
    ])
        .split("\0")
        .filter(Boolean)
        .sort();
    if (names.length > 10000 || names.join("\0").length > 131072)
        throw new Error("ignored path inventory exceeds sandbox bound");
    for (const name of names)
        relative(name.replace(/\/$/, ""));
    return names;
}
/** Only an explicit orchestration trace directory may be excluded. */
export function captureWorkspace(root, options = {}) {
    canonicalRoot(root);
    if (git(root, ["rev-parse", "--show-toplevel"]).trim() !== root)
        throw new Error("proof root must be the git worktree root");
    const excludePaths = (options.excludePaths ?? []).map(relative).sort();
    if (excludePaths.some((p) => !p.startsWith(".memory/orchestrations/") || p.split("/").length < 3))
        throw new Error("only explicit orchestration trace roots may be excluded");
    const validationInputs = (options.validationInputs ?? []).map(relative).sort();
    if (validationInputs.length > 64 ||
        new Set(validationInputs).size !== validationInputs.length ||
        validationInputs.some((name) => name.split("/").some((part) => ["node_modules", ".venv", "venv"].includes(part)) ||
            excludePaths.some((p) => name === p || name.startsWith(`${p}/`))))
        throw new Error("validation inputs require bounded individual non-dependency files");
    for (const name of validationInputs)
        fileHash(root, name);
    const inventory = () => git(root, ["ls-files", "-z", "--cached", "--others", "--exclude-standard"]);
    const head = git(root, ["rev-parse", "HEAD"]).trim();
    const index = git(root, ["ls-files", "--stage", "-z"]);
    const listing = inventory();
    const names = [...new Set([...listing.split("\0").filter(Boolean), ...validationInputs])].sort();
    if (names.length > 10000)
        throw new Error("workspace exceeds proof file limit");
    const files = Object.create(null);
    let totalBytes = 0;
    for (const name of names) {
        relative(name);
        if (excludePaths.some((p) => name === p || name.startsWith(`${p}/`)))
            continue;
        try {
            totalBytes += lstatSync(path.join(root, name)).size;
            if (totalBytes > 128 * 1024 * 1024)
                throw new Error("workspace exceeds proof byte limit");
            files[name] = fileHash(root, name);
        }
        catch (error) {
            if (error.code === "ENOENT")
                files[name] = "deleted";
            else
                throw error;
        }
    }
    if (inventory() !== listing ||
        git(root, ["ls-files", "--stage", "-z"]) !== index ||
        git(root, ["rev-parse", "HEAD"]).trim() !== head)
        throw new Error("workspace changed during proof capture");
    const indexHash = hash(index);
    return {
        root,
        head,
        indexHash,
        files,
        excludePaths,
        validationInputs,
        treeHash: hash(JSON.stringify({ head, indexHash, files, excludePaths, validationInputs })),
    };
}
export function assertAllowedTransition(before, after, allowedPaths) {
    if (before.root !== after.root ||
        before.head !== after.head ||
        before.indexHash !== after.indexHash ||
        JSON.stringify(before.excludePaths) !== JSON.stringify(after.excludePaths) ||
        JSON.stringify(before.validationInputs) !== JSON.stringify(after.validationInputs))
        throw new Error("workspace identity, HEAD, index, or exclusions changed");
    const scopes = allowedPaths.map((p) => ({
        directory: p.endsWith("/"),
        value: relative(p.endsWith("/") ? p.slice(0, -1) : p),
    }));
    const changed = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])]
        .filter((p) => before.files[p] !== after.files[p])
        .sort();
    if (changed.some((p) => !scopes.some((s) => p === s.value || (s.directory && p.startsWith(`${s.value}/`)))))
        throw new Error("out-of-scope workspace change");
    return changed;
}
export function captureArtifacts(root, paths) {
    canonicalRoot(root);
    if (!paths.length || paths.length > 64 || new Set(paths).size !== paths.length)
        throw new Error("proof requires 1–64 distinct artifacts");
    return Object.fromEntries([...paths].sort().map((p) => [relative(p), fileHash(root, p)]));
}
/** Commands MUST come from the trusted tool collector, never parsed worker output. */
export function verifyAcceptance(input) {
    const changed = assertAllowedTransition(input.before, input.after, input.allowedPaths);
    if (input.after.root !== input.current.root || input.after.treeHash !== input.current.treeHash)
        throw new Error("stale validation tree");
    const artifactNames = Object.keys(input.artifacts).sort();
    if (!artifactNames.length ||
        JSON.stringify(artifactNames) !== JSON.stringify(Object.keys(input.currentArtifacts).sort()) ||
        artifactNames.some((p) => input.artifacts[p] !== input.currentArtifacts[p]))
        throw new Error("stale or missing validation artifacts");
    if (!input.validatorTaskId.trim() ||
        !input.commands.length ||
        input.commands.some((c) => !c.command.trim() ||
            c.exitCode !== 0 ||
            c.treeHash !== input.after.treeHash ||
            c.taskId !== input.validatorTaskId))
        throw new Error("missing, failed, or stale trusted validation commands");
    return changed;
}
