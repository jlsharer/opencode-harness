import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { QA_COMMANDS, parseArgs } from "./operator-external-qa.mts";

const script = fileURLToPath(new URL("./operator-external-qa.mts", import.meta.url));

test("entry point is explicit and command list is closed", () => {
  assert.deepEqual(QA_COMMANDS, [
    ["node", "--test", ".opencode/scripts/operator-external-qa.test.mts"],
    ["node", ".opencode/scripts/validate-harness.mts"],
    ["node", ".opencode/scripts/validate-portable-harness.mjs", "--root", "."],
    ["node", "--test", ".opencode/scripts/runtime-harness.test.mts"],
    ["node", "--test", ".opencode/scripts/runtime-foreign-repo.test.mts"],
    ["npm", "pack", "--dry-run", "--json"],
  ]);
  assert.throws(() => parseArgs(["--command", "sh"]));
  const result = spawnSync(process.execPath, [script], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /operator QA refused/);
});

test("rejects receipts in worktree and unsafe or preexisting paths without QA execution", () => {
  const base = mkdtempSync(join(tmpdir(), "operator-qa-test-"));
  try {
    const root = join(base, "repo");
    mkdirSync(root, { mode: 0o700 });
    const receipt = join(root, "receipt.json");
    const run = (path: string) =>
      spawnSync(process.execPath, [script, "--root", root, "--receipt", path], {
        encoding: "utf8",
      });
    assert.equal(run(receipt).status, 1);
    assert.equal(run(join(base, "receipt.json")).status, 1); // no repository, before scratch or commands
    assert.equal(run("relative.json").status, 1);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("requires the ignored source gitignore in the recorded input tree", () => {
  const base = mkdtempSync(join(tmpdir(), "operator-qa-test-"));
  try {
    const root = join(base, "repo");
    mkdirSync(join(root, ".opencode"), { recursive: true, mode: 0o700 });
    assert.equal(spawnSync("git", ["init", "-q", root]).status, 0);
    writeFileSync(join(root, "fixture"), "original");
    writeFileSync(join(root, ".opencode/.gitignore"), ".gitignore\n");
    assert.equal(spawnSync("git", ["-C", root, "add", "fixture"]).status, 0);
    assert.equal(
      spawnSync("git", [
        "-C",
        root,
        "-c",
        "user.name=Fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "-qm",
        "fixture",
      ]).status,
      0,
    );
    const receipt = join(base, "unbound.json");
    const args = [script, "--root", root, "--receipt", receipt];
    const refused = spawnSync(process.execPath, args, { encoding: "utf8" });
    assert.equal(refused.status, 1);
    assert.match(refused.stderr, /declare \.opencode\/\.gitignore/);
    assert.equal(existsSync(receipt), false);
    assert.equal(
      spawnSync(process.execPath, [...args, "--validation-input", ".opencode/.gitignore"]).status,
      1,
    ); // the QA command is absent in this fixture
    assert.equal(JSON.parse(readFileSync(receipt, "utf8")).ignoredInputCount, 1);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("nonzero and mutation are external failures with unchanged user data", () => {
  const base = mkdtempSync(join(tmpdir(), "operator-qa-test-"));
  try {
    const root = join(base, "repo");
    const scriptDir = join(root, ".opencode", "scripts");
    mkdirSync(scriptDir, { recursive: true, mode: 0o700 });
    const git = (...args: string[]) => {
      const result = spawnSync("git", args, { cwd: root });
      assert.equal(result.status, 0);
    };
    git("init", "-q");
    writeFileSync(join(root, "fixture"), "original");
    git("add", "fixture");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-qm",
      "fixture",
    );
    writeFileSync(join(scriptDir, "operator-external-qa.test.mts"), "// inert fixture\n");
    const qa = join(scriptDir, "validate-harness.mts");
    writeFileSync(qa, "process.exitCode = 7;\n");
    const receipt1 = join(base, "failed.json");
    assert.equal(
      spawnSync(process.execPath, [script, "--root", root, "--receipt", receipt1]).status,
      1,
    );
    const failure = JSON.parse(readFileSync(receipt1, "utf8"));
    assert.equal(failure.provenance, "external-operator-unmanaged");
    assert.equal(failure.acceptanceProof, false);
    assert.equal(failure.commands[0].exitCode, 0);
    assert.equal(failure.commands[1].exitCode, 7);
    assert.equal(failure.outcome, "fail");
    writeFileSync(
      qa,
      "import { writeFileSync } from 'node:fs'; writeFileSync('fixture', 'changed');\n",
    );
    const receipt2 = join(base, "mutated.json");
    assert.equal(
      spawnSync(process.execPath, [script, "--root", root, "--receipt", receipt2]).status,
      1,
    );
    const mutated = JSON.parse(readFileSync(receipt2, "utf8"));
    assert.equal(mutated.outcome, "fail");
    assert.notEqual(mutated.baseline.treeSha256, mutated.final.treeSha256);
    assert.equal(readFileSync(join(root, "fixture"), "utf8"), "changed"); // never rolls back user files
    assert.equal(
      spawnSync(process.execPath, [script, "--root", root, "--receipt", receipt2]).status,
      1,
    );
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});
