import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { FIXTURE_ID, FIXTURE_SOURCE, parseArgs, preflight } from "./native-v2-plugin-fixture.mts";

const fake = Buffer.from("offline fake; never executed\n");
const digest = createHash("sha256").update(fake).digest("hex");

// These tests never invoke an OpenCode binary or plugin; their fake file is data.
test("closed arguments and static V2 setup template", () => {
  assert.throws(() => parseArgs(["--binary", "/bin/false"]));
  assert.throws(() =>
    parseArgs(["--binary", "/bin/false", "--sha256", "oops", "--scratch-parent", "/tmp"]),
  );
  assert.match(FIXTURE_SOURCE, /Plugin\.define\(/);
  assert.match(FIXTURE_SOURCE, /context\.tool\.hook\("execute\.before"/);
  assert.match(FIXTURE_SOURCE, /event\.tool === "subagent"/);
  assert.match(FIXTURE_SOURCE, /HARNESS_V2_FIXTURE_REFUSAL/);
  assert.match(FIXTURE_SOURCE, new RegExp(FIXTURE_ID));
  assert.doesNotMatch(FIXTURE_SOURCE, /tool\.execute|writeFile|fetch\(|@opencode-ai\/plugin/);
});

test("offline preflight refuses unsafe identity, state and scratch", () => {
  const parent = mkdtempSync(join(tmpdir(), "v2-offline-fixture-"));
  const binary = join(parent, "fake-opencode");
  try {
    writeFileSync(binary, fake, { mode: 0o700 });
    const args = ["--binary", binary, "--sha256", digest, "--scratch-parent", parent];
    assert.throws(() => preflight(args, { OPENCODE_DB: "stale" }), /ambient/);
    assert.throws(() => preflight(args, { OPENAI_API_KEY: "private" }), /ambient/);
    assert.throws(() => preflight(args, { HTTP_PROXY: "http:\/\/localhost" }), /ambient/);
    assert.throws(
      () => preflight([...args.slice(0, 3), "0".repeat(64), ...args.slice(4)], {}),
      /digest mismatch/,
    );
    assert.throws(() => preflight(["--binary", "relative", ...args.slice(2)], {}), /noncanonical/);
    chmodSync(parent, 0o755);
    assert.throws(() => preflight(args, {}), /mode-0700/);
    chmodSync(parent, 0o700);
    chmodSync(binary, 0o666);
    assert.throws(() => preflight(args, {}), /untrusted/);
    chmodSync(binary, 0o700);
    const result = preflight(args, {});
    assert.equal(result.stage, "inventory-only/inconclusive");
    assert.equal(result.acceptanceProof, false);
    assert.equal(result.nativeSpawn, false);
    assert.equal(result.setupActivation, false);
    assert.equal(result.hookFiring, false);
    assert.equal(result.scratchCleanup, "not created");
    assert.equal(result.selectedBinarySha256, digest);
    assert.doesNotMatch(JSON.stringify(result), new RegExp(parent));
    assert.doesNotMatch(JSON.stringify(result), /private|stale/);
  } finally {
    chmodSync(parent, 0o700);
    rmSync(parent, { recursive: true, force: true });
  }
});
