import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import {
  acquireArtifact,
  type Acquisition,
  type Fetcher,
} from "./operator-approved-artifact-install.mts";

const payload = Buffer.from("offline fixture only");
const sha256 = createHash("sha256").update(payload).digest("hex");

const fixture: Fetcher = async (_url, _signal) => ({
  statusCode: 200,
  headers: { "content-length": String(payload.length) },
  body: Readable.from([payload]),
});

async function withDestination(run: (args: Acquisition, dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "approved-artifact-"));
  try {
    await run(
      {
        url: "https://example.invalid/artifact",
        sha256,
        destination: join(dir, "artifact"),
        maxBytes: 1024,
        timeoutMs: 1000,
      },
      dir,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const consent = async (challenge: string) => challenge;

test("offline fixture acquired only after exact approval and digest check", async () =>
  withDestination(async (args) => {
    assert.equal(await acquireArtifact(args, consent, fixture), payload.length);
    assert.deepEqual(await readFile(args.destination), payload);
  }));

test("approval refusal does not call transport or create file", async () =>
  withDestination(async (args, dir) => {
    await assert.rejects(
      acquireArtifact(
        args,
        async () => "no",
        async () => {
          throw new Error("transport must not run");
        },
      ),
      /approval/,
    );
    assert.deepEqual(await readdir(dir), []);
  }));

test("approval binds exact source, integrity, destination, byte and time limits", async () =>
  withDestination(async (args) => {
    await acquireArtifact(
      args,
      async (challenge) => {
        for (const value of [
          args.url,
          args.sha256,
          args.destination,
          String(args.maxBytes),
          String(args.timeoutMs),
        ])
          assert.ok(challenge.includes(value));
        return challenge;
      },
      fixture,
    );
  }));

test("digest mismatch and byte overflow remove partial output", async () =>
  withDestination(async (args, dir) => {
    await assert.rejects(
      acquireArtifact({ ...args, sha256: "0".repeat(64) }, consent, fixture),
      /mismatch/,
    );
    await assert.rejects(
      acquireArtifact({ ...args, maxBytes: payload.length - 1 }, consent, fixture),
      /limit|Content-Length/,
    );
    assert.deepEqual(await readdir(dir), []);
  }));

test("HTTP redirect, incorrect length, and encoded response fail closed", async () =>
  withDestination(async (args, dir) => {
    for (const response of [
      {
        statusCode: 302,
        headers: { location: "https://example.invalid/other" },
        body: Readable.from([]),
      },
      { statusCode: 200, headers: { "content-length": "1" }, body: Readable.from([payload]) },
      { statusCode: 200, headers: { "content-encoding": "gzip" }, body: Readable.from([]) },
    ])
      await assert.rejects(acquireArtifact(args, consent, async () => response));
    assert.deepEqual(await readdir(dir), []);
  }));

test("existing file and symlink are never replaced", async () =>
  withDestination(async (args, dir) => {
    await writeFile(args.destination, "previous");
    await assert.rejects(acquireArtifact(args, consent, fixture), /exists/);
    assert.equal(await readFile(args.destination, "utf8"), "previous");
    await rm(args.destination);
    await symlink(join(dir, "missing"), args.destination);
    await assert.rejects(acquireArtifact(args, consent, fixture));
    assert.deepEqual(await readdir(dir), ["artifact"]);
  }));

test("unsafe URL, wrong digest format, and non-canonical destination reject before transport", async () =>
  withDestination(async (args) => {
    for (const invalid of [
      { ...args, url: "http://example.invalid/artifact" },
      { ...args, url: "https://example.invalid/artifact#fragment" },
      { ...args, sha256: "AAAA" },
      { ...args, destination: args.destination + "/../artifact" },
    ])
      await assert.rejects(acquireArtifact(invalid, consent, fixture));
  }));

test("interrupted download removes partial destination", async () =>
  withDestination(async (args, dir) => {
    const interrupted: Fetcher = async (_url, signal) => ({
      statusCode: 200,
      headers: {},
      body: (async function* () {
        yield Buffer.from("partial");
        await new Promise<void>((resolve) =>
          signal.addEventListener("abort", () => resolve(), { once: true }),
        );
        throw new Error("interrupted transport");
      })(),
    });
    await assert.rejects(acquireArtifact({ ...args, timeoutMs: 10 }, consent, interrupted));
    assert.deepEqual(await readdir(dir), []);
  }));
