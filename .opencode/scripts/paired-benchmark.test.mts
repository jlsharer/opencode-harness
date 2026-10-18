import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { prepareBenchmark } from "./prepare-paired-benchmark.mts";

test("ten paired tasks have identical initial files across both arms and three repeats", () => {
  const parent = mkdtempSync(path.join(os.tmpdir(), "paired-benchmark-"));
  try {
    const output = path.join(parent, "runs");
    assert.deepEqual(prepareBenchmark(output), { output, runs: 60 });
    const manifest = JSON.parse(readFileSync(path.join(output, "benchmark-manifest.json"), "utf8"));
    const catalog = JSON.parse(
      readFileSync(new URL("../evaluation/paired-tasks.json", import.meta.url), "utf8"),
    );
    assert.equal(manifest.liveRunsAuthorized, false);
    for (const task of catalog.tasks) {
      const runs = manifest.runs.filter((run: { taskId: string }) => run.taskId === task.id);
      assert.equal(runs.length, 6);
      assert.equal(new Set(runs.map((run: { startHash: string }) => run.startHash)).size, 1);
      for (const run of runs) {
        const fileMap: Record<string, string> = {};
        for (const [name, contents] of Object.entries(task.files)) {
          const actual = readFileSync(path.join(output, run.directory, name), "utf8");
          assert.equal(actual, contents);
          fileMap[name] = actual;
        }
        const actualHash = createHash("sha256")
          .update(JSON.stringify(Object.entries(fileMap).sort(([a], [b]) => a.localeCompare(b))))
          .digest("hex");
        assert.equal(actualHash, run.startHash);
        assert.equal(run.status, "unexecuted");
        for (const metric of [
          "inputTokens",
          "outputTokens",
          "cachedTokens",
          "cost",
          "elapsedMs",
          "acceptancePassed",
        ])
          assert.equal(run[metric], null);
        const result = spawnSync(process.execPath, ["--test", "acceptance.test.mjs"], {
          cwd: path.join(output, run.directory),
          encoding: "utf8",
          timeout: 10000,
          env: Object.fromEntries(
            Object.entries(process.env).filter(([key]) => key !== "NODE_TEST_CONTEXT"),
          ),
        });
        assert.equal(result.error, undefined);
        assert.equal(result.status, 1, `${task.id}: starter must fail acceptance`);
        assert.match(result.stdout, /AssertionError|ERR_ASSERTION/);
        assert.doesNotMatch(result.stdout + result.stderr, /SyntaxError|ERR_MODULE_NOT_FOUND/);
      }
    }
    if (process.platform !== "win32") assert.equal(statSync(output).mode & 0o777, 0o700);
    assert.throws(() => prepareBenchmark(output), /already exists/);
    assert.throws(() => prepareBenchmark("relative"), /absolute/);
    if (process.platform !== "win32") {
      symlinkSync(output, path.join(parent, "link"));
      assert.throws(() => prepareBenchmark(path.join(parent, "link", "nested")), /canonical/);
    }
    assert.equal(manifest.runs.length, 60);
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
