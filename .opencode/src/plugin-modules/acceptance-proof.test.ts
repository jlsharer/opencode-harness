import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertAllowedTransition,
  captureArtifacts,
  captureWorkspace,
  verifyAcceptance,
} from "./acceptance-proof.ts";

function fixture(run: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "acceptance-proof-"));
  const git = (...args: string[]): void => {
    execFileSync("git", ["-C", root, ...args], { stdio: "ignore" });
  };
  try {
    git("init");
    writeFileSync(path.join(root, "source.txt"), "before");
    git("add", "source.txt");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "-m",
      "fixture",
    );
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("exact tree and trusted independent command evidence accepts a scoped change", () =>
  fixture((root) => {
    const before = captureWorkspace(root);
    writeFileSync(path.join(root, "source.txt"), "after");
    const after = captureWorkspace(root);
    const artifacts = captureArtifacts(root, ["source.txt"]);
    const input = {
      before,
      after,
      current: captureWorkspace(root),
      allowedPaths: ["source.txt"],
      artifacts,
      currentArtifacts: artifacts,
      commands: [
        { command: "check", exitCode: 0, treeHash: after.treeHash, taskId: "validator-1" },
      ],
      validatorTaskId: "validator-1",
    };
    assert.deepEqual(verifyAcceptance(input), ["source.txt"]);
    assert.throws(() => verifyAcceptance({ ...input, commands: [] }), /commands/);
    assert.throws(
      () => verifyAcceptance({ ...input, commands: [{ ...input.commands[0]!, exitCode: 1 }] }),
      /commands/,
    );
    assert.throws(() => verifyAcceptance({ ...input, validatorTaskId: "implementer" }), /commands/);
    writeFileSync(path.join(root, "source.txt"), "newer");
    assert.throws(
      () => verifyAcceptance({ ...input, current: captureWorkspace(root) }),
      /stale validation tree/,
    );
    assert.throws(
      () =>
        verifyAcceptance({ ...input, currentArtifacts: captureArtifacts(root, ["source.txt"]) }),
      /artifacts/,
    );
  }));
test("out-of-scope untracked changes and scope-prefix confusion fail", () =>
  fixture((root) => {
    const before = captureWorkspace(root);
    writeFileSync(path.join(root, "source.txt.evil"), "unexpected");
    assert.throws(
      () => assertAllowedTransition(before, captureWorkspace(root), ["source.txt"]),
      /out-of-scope/,
    );
  }));
test("deletions are scoped and index changes cannot bypass proof", () =>
  fixture((root) => {
    const before = captureWorkspace(root);
    rmSync(path.join(root, "source.txt"));
    assert.deepEqual(assertAllowedTransition(before, captureWorkspace(root), ["source.txt"]), [
      "source.txt",
    ]);
    execFileSync("git", ["-C", root, "add", "-u"]);
    assert.throws(
      () => assertAllowedTransition(before, captureWorkspace(root), ["source.txt"]),
      /index/,
    );
  }));
test("symlinks, traversal, missing artifacts and secret candidates fail closed", () =>
  fixture((root) => {
    assert.throws(() => captureArtifacts(root, ["../outside"]), /unsafe/);
    assert.throws(() => captureArtifacts(root, ["missing"]), /ENOENT/);
    symlinkSync("source.txt", path.join(root, "link"));
    assert.throws(() => captureWorkspace(root), /symlink/);
    rmSync(path.join(root, "link"));
    writeFileSync(path.join(root, ".env"), "fixture-only");
    assert.throws(() => captureWorkspace(root), /secret candidate/);
  }));
test("only exact explicit trace roots can be excluded; artifacts remain bound", () =>
  fixture((root) => {
    const trace = ".memory/orchestrations/test";
    mkdirSync(path.join(root, trace), { recursive: true });
    writeFileSync(path.join(root, trace, "proof.md"), "first");
    const before = captureWorkspace(root, { excludePaths: [trace] });
    const artifacts = captureArtifacts(root, [`${trace}/proof.md`]);
    writeFileSync(path.join(root, trace, "proof.md"), "second");
    assert.equal(before.treeHash, captureWorkspace(root, { excludePaths: [trace] }).treeHash);
    assert.notDeepEqual(artifacts, captureArtifacts(root, [`${trace}/proof.md`]));
    assert.throws(() => captureWorkspace(root, { excludePaths: [".memory"] }), /trace roots/);
    assert.throws(() => captureWorkspace(root, { excludePaths: ["."] }), /unsafe/);
  }));

test("ignored inputs are opt-in bounded files and cannot include secret or dependency trees", () =>
  fixture((root) => {
    writeFileSync(path.join(root, ".gitignore"), "hidden.txt\n.env\nnode_modules/\n");
    writeFileSync(path.join(root, "hidden.txt"), "before");
    assert.equal(captureWorkspace(root).files["hidden.txt"], undefined);
    const before = captureWorkspace(root, { validationInputs: ["hidden.txt"] });
    writeFileSync(path.join(root, "hidden.txt"), "after");
    assert.notEqual(
      captureWorkspace(root, { validationInputs: ["hidden.txt"] }).treeHash,
      before.treeHash,
    );
    writeFileSync(path.join(root, ".env"), "fixture-only");
    assert.throws(
      () => captureWorkspace(root, { validationInputs: ["hidden.txt", ".env"] }),
      /secret candidate/,
    );
    assert.throws(
      () => captureWorkspace(root, { validationInputs: ["node_modules/package.json"] }),
      /non-dependency/,
    );
  }));
