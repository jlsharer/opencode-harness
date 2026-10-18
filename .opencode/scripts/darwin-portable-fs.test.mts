#!/usr/bin/env node

import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { chmod, copyFile, lstat, mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import type { BigIntStats } from "node:fs";

interface Operation {
  overwrite?: boolean;
  path: string | Buffer;
  content?: string | Buffer;
  reserved?: number[];
}

interface FrameOptions {
  magic?: string;
  version?: number;
  flags?: number;
  dev?: bigint;
  ino?: bigint;
  targetLength?: number;
  operationCount?: number;
  totalLength?: number;
}

interface HelperResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: Buffer;
  stderr: Buffer;
}

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const COMMITTED_HELPER = path.join(ROOT, ".opencode/bootstrap/native/darwin-portable-fs.universal");
const BOOTSTRAP = path.join(ROOT, ".opencode/scripts/bootstrap-portable-harness.mjs");
const activation = await mkdtemp(path.join(os.tmpdir(), "darwin-portable-fs-activation-"));
const HELPER = path.join(activation, "darwin-portable-fs");
await copyFile(COMMITTED_HELPER, HELPER);
await chmod(HELPER, 0o700);
test.after(() => rm(activation, { recursive: true, force: true }));

function requestFrame(
  target: string,
  identity: BigIntStats,
  operations: Operation[] = [],
  options: FrameOptions = {},
): Buffer {
  const targetBytes = Buffer.from(target);
  const encoded = operations.map((operation) => ({
    overwrite: operation.overwrite ?? false,
    path: Buffer.isBuffer(operation.path) ? operation.path : Buffer.from(operation.path),
    content: Buffer.isBuffer(operation.content)
      ? operation.content
      : Buffer.from(operation.content ?? ""),
    reserved: operation.reserved ?? [0, 0, 0],
  }));
  const size =
    48 +
    targetBytes.length +
    encoded.reduce(
      (sum, operation) => sum + 16 + operation.path.length + operation.content.length,
      0,
    );
  const frame = Buffer.alloc(size);
  frame.write(options.magic ?? "OPDFREQ1", 0, "ascii");
  frame.writeUInt32LE(options.version ?? 1, 8);
  frame.writeUInt32LE(options.flags ?? 0, 12);
  frame.writeBigUInt64LE(options.dev ?? identity.dev, 16);
  frame.writeBigUInt64LE(options.ino ?? identity.ino, 24);
  frame.writeUInt32LE(options.targetLength ?? targetBytes.length, 32);
  frame.writeUInt32LE(options.operationCount ?? encoded.length, 36);
  frame.writeBigUInt64LE(BigInt(options.totalLength ?? size), 40);
  targetBytes.copy(frame, 48);
  let offset = 48 + targetBytes.length;
  for (const operation of encoded) {
    frame[offset] = operation.overwrite ? 1 : 0;
    frame.set(operation.reserved, offset + 1);
    frame.writeUInt32LE(operation.path.length, offset + 4);
    frame.writeBigUInt64LE(BigInt(operation.content.length), offset + 8);
    offset += 16;
    operation.path.copy(frame, offset);
    offset += operation.path.length;
    operation.content.copy(frame, offset);
    offset += operation.content.length;
  }
  return frame;
}

function runHelper(input: Uint8Array, { killAfter = null }: { killAfter?: number | null } = {}) {
  return new Promise<HelperResult>((resolve, reject) => {
    const child = spawn(HELPER, [], { stdio: ["pipe", "pipe", "pipe"], env: {} });
    const stdout: Uint8Array[] = [];
    const stderr: Uint8Array[] = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code, signal) =>
      resolve({ code, signal, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr) }),
    );
    child.stdin.end(input);
    if (killAfter !== null) setTimeout(() => child.kill("SIGTERM"), killAfter);
  });
}

function responseStatus(result: HelperResult): number {
  assert.equal(result.stdout.subarray(0, 8).toString("ascii"), "OPDFRES1");
  assert.equal(result.stdout.readUInt32LE(8), 1);
  return result.stdout.readUInt32LE(12);
}

test(
  "universal helper self-test reports protocol and native architecture",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async () => {
    const { stdout } = await execFileAsync(HELPER, ["--self-test"]);
    assert.match(stdout.trim(), /^OPDFSELF1 protocol=1 platform=darwin arch=(arm64|x86_64)$/);
  },
);

test(
  "Darwin bootstrap helper performs no-clobber, overwrite, and installed rerun",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-portable-fs-test-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const repo = path.join(temp, "repo");
    await mkdir(repo);
    const run = (args: string[], env: NodeJS.ProcessEnv = {}) =>
      execFileAsync(process.execPath, [BOOTSTRAP, "--target", repo, ...args], {
        env: { ...process.env, ...env },
      });
    const first = await run([]);
    assert.match(first.stdout, /write-safety=darwin-native-race-detecting/);
    const installedBootstrap = path.join(repo, ".opencode/scripts/bootstrap-portable-harness.mjs");
    const rerun = await execFileAsync(process.execPath, [installedBootstrap, "--target", repo]);
    assert.match(rerun.stdout, /unchanged=51/);
    const managed = path.join(repo, ".opencode/agents/researcher.md");
    const original = await readFile(managed);
    await rm(managed);
    await run([], {
      NODE_ENV: "test",
      OPENCODE_PORTABLE_TEST_RACE: JSON.stringify({
        action: "create-destination",
        relative: ".opencode/agents/researcher.md",
      }),
    }).then(
      () => assert.fail("expected no-clobber failure"),
      (error) => assert.match(`${error.stderr}`, /destination appeared after preflight/),
    );
    assert.equal(await readFile(managed, "utf8"), "concurrent destination\n");
    await run(["--overwrite-managed"]);
    assert.deepEqual(await readFile(managed), original);
  },
);

test(
  "Darwin helper rejects malformed protocol before target effects",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async () => {
    const result = await runHelper(Buffer.from("bad"));
    assert.equal(result.code, 1);
    assert.equal(result.signal, null);
    assert.equal(responseStatus(result), 1);
    assert.match(result.stderr.toString("utf8"), /malformed request/);
  },
);

test(
  "protocol parser rejects header, bounds, reserved-byte, trailing, and identity violations",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-parser-header-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(target);
    const identity = await lstat(target, { bigint: true });
    const valid = () => requestFrame(target, identity, [{ path: "file", content: "bytes" }]);
    const declaredContentOverflow = valid();
    declaredContentOverflow.writeBigUInt64LE(
      BigInt(256 * 1024 * 1024) + 1n,
      48 + Buffer.byteLength(target) + 8,
    );
    const invalidOverwrite = valid();
    invalidOverwrite[48 + Buffer.byteLength(target)] = 2;
    const cases: [string, Buffer][] = [
      ["wrong magic", requestFrame(target, identity, [], { magic: "BADMAGIC" })],
      ["wrong version", requestFrame(target, identity, [], { version: 2 })],
      ["unknown flags", requestFrame(target, identity, [], { flags: 0x80000000 })],
      ["oversized count", requestFrame(target, identity, [], { operationCount: 4097 })],
      ["wrong total", requestFrame(target, identity, [], { totalLength: 49 })],
      ["wrong target length", requestFrame(target, identity, [], { targetLength: 4097 })],
      [
        "exact exclusive 256 MiB frame limit",
        requestFrame(target, identity, [], { totalLength: 256 * 1024 * 1024 }),
      ],
      [
        "reserved operation byte",
        requestFrame(target, identity, [{ path: "file", reserved: [1, 0, 0] }]),
      ],
      ["invalid overwrite policy", invalidOverwrite],
      ["declared content overflow", declaredContentOverflow],
      ["identity mismatch", requestFrame(target, identity, [], { ino: identity.ino + 1n })],
      ["truncated", valid().subarray(0, valid().length - 1)],
      ["trailing", Buffer.concat([valid(), Buffer.from([0])])],
    ];
    for (const [name, frame] of cases)
      await t.test(name, async () => {
        const result = await runHelper(frame);
        assert.equal(result.code, 1);
        assert.equal(responseStatus(result), 1);
        assert.deepEqual(await readdir(target), []);
      });
  },
);

test(
  "protocol parser rejects unsafe, malformed UTF-8, duplicate, NUL, and oversized paths",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-parser-path-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(target);
    const identity = await lstat(target, { bigint: true });
    const cases: [string, Operation[]][] = [
      ["absolute", [{ path: "/escape" }]],
      ["dot", [{ path: "./escape" }]],
      ["dot-dot", [{ path: "a/../escape" }]],
      ["backslash", [{ path: "a\\escape" }]],
      ["NUL", [{ path: Buffer.from([0x61, 0, 0x62]) }]],
      ["invalid UTF-8", [{ path: Buffer.from([0xc0, 0xaf]) }]],
      ["empty", [{ path: "" }]],
      ["duplicate", [{ path: "same" }, { path: "same" }]],
      ["oversized", [{ path: "a".repeat(4097) }]],
    ];
    for (const [name, operations] of cases)
      await t.test(name, async () => {
        const result = await runHelper(requestFrame(target, identity, operations));
        assert.equal(result.code, 1);
        assert.equal(responseStatus(result), 1);
        assert.deepEqual(await readdir(target), []);
      });
  },
);

test(
  "descriptor-relative publication handles no-clobber, overwrite, and exact temporary cleanup",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-syscalls-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(target);
    const identity = await lstat(target, { bigint: true });
    let result = await runHelper(
      requestFrame(target, identity, [{ path: "nested/file", content: "first" }]),
    );
    assert.equal(responseStatus(result), 0);
    assert.equal(await readFile(path.join(target, "nested/file"), "utf8"), "first");
    result = await runHelper(
      requestFrame(target, identity, [{ path: "nested/file", content: "second" }]),
    );
    assert.equal(responseStatus(result), 1);
    assert.equal(await readFile(path.join(target, "nested/file"), "utf8"), "first");
    result = await runHelper(
      requestFrame(target, identity, [{ path: "nested/file", content: "second", overwrite: true }]),
    );
    assert.equal(responseStatus(result), 0);
    assert.equal(await readFile(path.join(target, "nested/file"), "utf8"), "second");
    assert.deepEqual(
      (await readdir(path.join(target, "nested"))).filter((name) => name.startsWith(".portable-")),
      [],
    );
  },
);

test(
  "last-parent preflight failure removes helper-created directories before publication",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-preflight-cleanup-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(target);
    const identity = await lstat(target, { bigint: true });
    const result = await runHelper(
      requestFrame(target, identity, [{ path: "new/deep/file", content: "never" }], { flags: 1 }),
    );
    assert.equal(responseStatus(result), 1);
    assert.deepEqual(await readdir(target), []);
  },
);

test(
  "forced temporary-write and rename failures remove exact sibling temporaries",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-publication-failure-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(path.join(target, "parent"), { recursive: true });
    const identity = await lstat(target, { bigint: true });
    let result = await runHelper(
      requestFrame(target, identity, [{ path: "parent/write-failure", content: "partial" }], {
        flags: 32,
      }),
    );
    assert.equal(responseStatus(result), 1);
    await mkdir(path.join(target, "parent/directory-destination"));
    result = await runHelper(
      requestFrame(target, identity, [
        { path: "parent/directory-destination", content: "cannot-rename", overwrite: true },
      ]),
    );
    assert.equal(responseStatus(result), 1);
    assert.deepEqual(
      (await readdir(path.join(target, "parent"))).filter((name) => name.startsWith(".portable-")),
      [],
    );
    assert.deepEqual(
      (await lstat(path.join(target, "parent/directory-destination"))).isDirectory(),
      true,
    );
  },
);

test(
  "terminated sleeping helper is reaped without destination publication",
  { skip: process.platform !== "darwin" && "requires Darwin" },
  async (t) => {
    const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-helper-signal-"));
    t.after(() => rm(temp, { recursive: true, force: true }));
    const target = path.join(temp, "target");
    await mkdir(target);
    const identity = await lstat(target, { bigint: true });
    const result = await runHelper(
      requestFrame(target, identity, [{ path: "never", content: "never" }], { flags: 4 }),
      { killAfter: 100 },
    );
    assert.equal(result.code, null);
    assert.equal(result.signal, "SIGTERM");
    assert.deepEqual(await readdir(target), []);
  },
);
