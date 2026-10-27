import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import {
  installArchive,
  verifyInstall,
  type InstallRequest,
} from "./operator-approved-archive-install.mts";

function tarFile(name: string, bytes: Buffer, kind = 48): Buffer {
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "utf8");
  header.write("0000600\0", 100);
  header.write("0000000\0", 108);
  header.write("0000000\0", 116);
  header.write(bytes.length.toString(8).padStart(11, "0") + "\0", 124);
  header.write("00000000000\0", 136);
  header.fill(32, 148, 156);
  header[156] = kind;
  header.write("ustar\0", 257);
  header.write("00", 263);
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148);
  return Buffer.concat([header, bytes, Buffer.alloc((512 - (bytes.length % 512)) % 512)]);
}

function archive(entries: [string, Buffer, number?][]): Buffer {
  return gzipSync(
    Buffer.concat([
      ...entries.map(([name, bytes, kind]) => tarFile(name, bytes, kind)),
      Buffer.alloc(1024),
    ]),
  );
}

const pkg = Buffer.from(
  JSON.stringify({ name: "fixture", version: "1.2.3", scripts: { postinstall: "exit 99" } }),
);
const code = Buffer.from("export const value = 1;\n");

async function fixture(
  run: (request: InstallRequest, dir: string) => Promise<void>,
  bytes = archive([
    ["package/package.json", pkg],
    ["package/index.js", code],
  ]),
) {
  const dir = await mkdtemp(join(tmpdir(), "archive-install-"));
  const archivePath = join(dir, "fixture.tgz");
  await writeFile(archivePath, bytes, { mode: 0o600 });
  try {
    await run(
      {
        sourceUrl: "https://example.invalid/fixture-1.2.3.tgz",
        version: "1.2.3",
        archive: archivePath,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        destination: join(dir, "installed"),
        maxArchiveBytes: 4096,
        maxExpandedBytes: 4096,
        maxFiles: 4,
        scriptPolicy: "never",
      },
      dir,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test("pinned offline archive installs inert files and independently verifies receipt", async () =>
  fixture(async (request) => {
    const result = await installArchive(request, async (challenge) => challenge);
    assert.equal(result.files, 2);
    assert.deepEqual(
      await verifyInstall(request.destination, request.archive, request.sha256, request.version),
      {
        files: 2,
        version: "1.2.3",
      },
    );
    assert.deepEqual(await readFile(join(request.destination, "index.js")), code);
    assert.match(await readFile(result.receipt, "utf8"), /"scriptPolicy": "never"/);
    await writeFile(join(request.destination, "index.js"), "changed");
    await assert.rejects(
      verifyInstall(request.destination, request.archive, request.sha256, request.version),
      /changed/,
    );
    const forged = JSON.parse(await readFile(result.receipt, "utf8")) as {
      version: string;
      files: Record<string, string>;
    };
    forged.files["index.js"] = createHash("sha256").update("changed").digest("hex");
    await writeFile(result.receipt, JSON.stringify(forged));
    await assert.rejects(
      verifyInstall(request.destination, request.archive, request.sha256, request.version),
      /pinned archive inventory/,
    );
    forged.version = "9.9.9";
    await writeFile(result.receipt, JSON.stringify(forged));
    await assert.rejects(
      verifyInstall(request.destination, request.archive, request.sha256, "9.9.9"),
      /archive package version mismatch/,
    );
  }));

test("denied approval leaves only source archive", async () =>
  fixture(async (request, dir) => {
    await assert.rejects(
      installArchive(request, async () => "DENY"),
      /approval/,
    );
    assert.deepEqual(await readdir(dir), ["fixture.tgz"]);
  }));

test("interrupted install publishes no destination", async () =>
  fixture(async (request, dir) => {
    const controller = new AbortController();
    await assert.rejects(
      installArchive(
        request,
        async (challenge) => {
          controller.abort();
          return challenge;
        },
        controller.signal,
      ),
      /interrupted/,
    );
    assert.deepEqual(await readdir(dir), ["fixture.tgz"]);
  }));

test("bad digest, version, traversal, links, and size limits leave no installation", async () => {
  await fixture(async (request) => {
    await assert.rejects(
      installArchive({ ...request, sha256: "0".repeat(64) }, async (challenge) => challenge),
      /SHA-256/,
    );
    await assert.rejects(
      installArchive({ ...request, version: "9.9.9" }, async (challenge) => challenge),
      /version mismatch/,
    );
    await assert.rejects(
      installArchive({ ...request, maxExpandedBytes: 1 }, async (challenge) => challenge),
    );
  });
  for (const bytes of [
    archive([
      ["package/package.json", pkg],
      ["package/../escape", code],
    ]),
    archive([
      ["package/package.json", pkg],
      ["package/link", Buffer.alloc(0), 50],
    ]),
  ])
    await fixture(async (request, dir) => {
      await assert.rejects(installArchive(request, async (challenge) => challenge));
      assert.deepEqual(await readdir(dir), ["fixture.tgz"]);
    }, bytes);
});

test("write failure after one installed file removes unpublished staging", async () => {
  const bytes = archive([
    ["package/package.json", pkg],
    ["package/conflict", code],
    ["package/conflict/child", code],
  ]);
  await fixture(async (request, dir) => {
    await assert.rejects(installArchive(request, async (challenge) => challenge));
    assert.deepEqual(await readdir(dir), ["fixture.tgz"]);
  }, bytes);
});

test("receipt verifier rejects a symlink substituted for the installed root", async () =>
  fixture(async (request, dir) => {
    await installArchive(request, async (challenge) => challenge);
    const moved = join(dir, "moved");
    await rename(request.destination, moved);
    await symlink(moved, request.destination);
    await assert.rejects(
      verifyInstall(request.destination, request.archive, request.sha256, request.version),
      /unsafe installed root/,
    );
  }));

test("directory headers consume the declared archive entry limit", async () => {
  const bytes = archive([
    ["package/", Buffer.alloc(0), 53],
    ["package/empty/", Buffer.alloc(0), 53],
    ["package/package.json", pkg],
  ]);
  await fixture(async (request) => {
    await assert.rejects(
      installArchive({ ...request, maxFiles: 2 }, async (challenge) => challenge),
      /entry limit/,
    );
  }, bytes);
});
