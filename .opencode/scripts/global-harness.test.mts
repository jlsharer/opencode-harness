import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { globalOperation, globalManifest } from "../../bin/global-harness.ts";
import { declaredFileEvidence } from "../src/plugin-modules/global-protocol.ts";
import { validateGlobalHarness } from "./validate-global-harness.mts";
import { taskContractShape } from "../src/plugin-modules/task-contracts.ts";
import type { TaskThreadRole } from "../src/plugin-modules/task-thread-policy.ts";

function fixture(t: { after(fn: () => void): void }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "global harness-λ-"));
  fs.chmodSync(root, 0o700);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return {
    root,
    options: {
      packageRoot: process.cwd(),
      configRoot: path.join(root, "native"),
      stateRoot: path.join(root, "state"),
    },
  };
}

test("complete manifest, guard-free import closure and non-Git evidence", async (t) => {
  assert.ok(validateGlobalHarness().assetCount > 45);
  const { root } = fixture(t);
  fs.writeFileSync(path.join(root, "hello world.txt"), "hello");
  const proof = await declaredFileEvidence(root, ["hello world.txt", "missing.txt"]);
  assert.equal(proof.records[0]?.sha256, createHash("sha256").update("hello").digest("hex"));
  assert.equal(proof.records[1]?.missing, true);
  fs.symlinkSync("hello world.txt", path.join(root, "link"));
  await assert.rejects(declaredFileEvidence(root, ["link"]), /symlink/);
  assert.deepEqual(fs.readdirSync(root).sort(), ["hello world.txt", "link"]);
});

test("dry-run is inert; install/verify/uninstall preserve native config, auth and project sentinels", (t) => {
  const { root, options } = fixture(t);
  for (const name of ["config", "auth.db", "project"])
    fs.writeFileSync(path.join(root, name), "sentinel");
  const before = fs.readdirSync(root);
  assert.equal(globalOperation("install", options).dryRun, true);
  assert.deepEqual(fs.readdirSync(root), before);
  globalOperation("install", { ...options, apply: true });
  assert.equal(globalOperation("doctor", options).installed, true);
  globalOperation("install", { ...options, apply: true });
  const role = fs.readFileSync(path.join(options.configRoot, "agents/implementer.md"), "utf8");
  assert.match(role, /permissions:/);
  assert.doesNotMatch(role, /^permission:/m);
  assert.doesNotMatch(role, /action: (?:shell|edit|read)/);
  assert.doesNotMatch(
    role,
    /Native managed shell is read-only|exact-command bounded|use `harness_trace`/,
  );
  const release = globalOperation("doctor", options).activeRelease as string;
  for (const name of ["researcher", "planner", "implementer", "validator"]) {
    const projected = fs.readFileSync(path.join(options.configRoot, `agents/${name}.md`), "utf8");
    assert.match(projected, /An admitted native subagent packet is sufficient/);
    assert.match(projected, /routingMetadataStatus absent is valid/);
    const typed = projected.match(
      /## Machine-enforced task field types[\s\S]*?```json\n([\s\S]*?)\n```/,
    );
    assert.ok(typed);
    assert.deepEqual(JSON.parse(typed[1]!), { [name]: taskContractShape(name as TaskThreadRole) });
    assert.match(projected, /path and summary are not item keys/);
    assert.doesNotMatch(
      projected,
      /validated native role-command route|rea_inspect_pe_imports|All other REA tools/,
    );
    for (const relative of [".opencode/contracts/role-io-contracts.json", ".opencode/schemas/"]) {
      const reference = `${release}/${relative}`;
      assert.ok(projected.includes(`from ${reference}`), projected);
      assert.ok(fs.existsSync(reference), reference);
      assert.ok(!projected.includes(`${release}/${release}`), projected);
    }
  }
  const skill = fs.readFileSync(
    path.join(options.configRoot, "skills/delegation-orchestrator/SKILL.md"),
    "utf8",
  );
  assert.match(skill, /harness_orchestration tool and admitted native subagent packets/);
  const typed = skill.match(/## Machine-enforced task field types[\s\S]*?```json\n([\s\S]*?)\n```/);
  assert.ok(typed);
  assert.deepEqual(Object.keys(JSON.parse(typed[1]!)), [
    "researcher",
    "planner",
    "implementer",
    "validator",
  ]);
  assert.doesNotMatch(skill, /charged to the declared role\/agent budget/);
  const refinement = fs.readFileSync(
    path.join(options.configRoot, "skills/interactive-refinement/SKILL.md"),
    "utf8",
  );
  assert.match(refinement, /harness_orchestration.*subagent/);
  assert.match(refinement, /Reuse an existing matching owner agreement/);
  assert.ok(
    refinement.includes(
      `${release}/.opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md`,
    ),
  );
  assert.ok(
    fs.existsSync(
      `${release}/.opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md`,
    ),
  );
  globalOperation("uninstall", { ...options, apply: true });
  assert.equal(globalOperation("doctor", options).installed, false);
  for (const name of ["config", "auth.db", "project"])
    assert.equal(fs.readFileSync(path.join(root, name), "utf8"), "sentinel");
});

test("unowned collisions and modified owned files fail without overwriting bytes", (t) => {
  const { options } = fixture(t);
  fs.mkdirSync(path.join(options.configRoot, "agents"), { recursive: true });
  const target = path.join(options.configRoot, "agents/implementer.md");
  fs.writeFileSync(target, "unrelated");
  assert.throws(() => globalOperation("install", { ...options, apply: true }), /unowned/);
  assert.equal(fs.readFileSync(target, "utf8"), "unrelated");
  fs.unlinkSync(target);
  globalOperation("install", { ...options, apply: true });
  fs.writeFileSync(target, "user edit");
  for (const operation of ["install", "rollback", "uninstall", "doctor"])
    assert.throws(() => globalOperation(operation, { ...options, apply: true }), /modified/);
  assert.equal(fs.readFileSync(target, "utf8"), "user edit");
});

test("upgrade, rollback and interrupted activation recovery preserve exact prior owned projection", (t) => {
  const { root, options } = fixture(t);
  globalOperation("install", { ...options, apply: true });
  const record = JSON.parse(
    fs.readFileSync(path.join(options.stateRoot, "installation.json"), "utf8"),
  ) as { release: string; owned: { path: string; bytes: string }[] };
  const copy = path.join(root, "package");
  fs.mkdirSync(copy);
  for (const asset of globalManifest(process.cwd()).assets) {
    const destination = path.join(copy, asset.source);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(asset.source, destination);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(copy, "package.json"), "utf8")) as {
    version: string;
  };
  pkg.version = "0.1.21";
  fs.writeFileSync(path.join(copy, "package.json"), JSON.stringify(pkg));
  globalOperation("install", { ...options, packageRoot: copy, apply: true });
  assert.notEqual(globalOperation("doctor", options).activeRelease, record.release);
  globalOperation("rollback", { ...options, apply: true });
  assert.equal(globalOperation("doctor", options).activeRelease, record.release);
  const target = record.owned[0]!;
  fs.writeFileSync(
    path.join(options.stateRoot, "activation.json"),
    JSON.stringify({
      before: record,
      after: null,
      writes: [{ path: target.path, before: target.bytes, after: null }],
    }),
  );
  fs.unlinkSync(path.join(options.configRoot, target.path));
  assert.throws(() => globalOperation("doctor", options), /interrupted/);
  assert.equal(globalOperation("doctor", { ...options, apply: true }).installed, true);
  assert.equal(
    fs.readFileSync(path.join(options.configRoot, target.path)).toString("base64"),
    target.bytes,
  );
});

test("actual npm tarball installs outside checkout with no dependency installation", (t) => {
  const { root } = fixture(t);
  const packed = spawnSync("npm", ["pack", "--json", "--pack-destination", root], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(packed.status, 0, packed.stderr);
  const list = JSON.parse(packed.stdout) as { filename: string; files: { path: string }[] }[];
  assert.ok(!list[0]!.files.some((f) => f.path.endsWith("harness-model-routing.json")));
  const extracted = path.join(root, "empty non git");
  fs.mkdirSync(extracted);
  assert.equal(
    spawnSync("tar", ["-xzf", path.join(root, list[0]!.filename), "-C", extracted]).status,
    0,
  );
  const cli = path.join(extracted, "package/bin/opencode-harness.mjs");
  const validation = spawnSync(
    process.execPath,
    [
      path.join(extracted, "package/.opencode/scripts/validate-global-harness.mjs"),
      path.join(extracted, "package"),
    ],
    { cwd: extracted, encoding: "utf8" },
  );
  assert.equal(validation.status, 0, validation.stderr);
  const imports = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "await import(process.argv[1]); await import(process.argv[2]);",
      path.join(extracted, "package/.opencode/plugin-modules/global-native-plugin.js"),
      path.join(extracted, "package/.opencode/plugin-modules/global-utilities.js"),
    ],
    { cwd: extracted, encoding: "utf8" },
  );
  assert.equal(imports.status, 0, imports.stderr);
  const args = [
    "--config-root",
    path.join(root, "discovery"),
    "--state-root",
    path.join(root, "state"),
  ];
  for (const operation of ["prepare", "install", "doctor", "uninstall"]) {
    const result = spawnSync(
      process.execPath,
      [cli, "global", operation, ...args, ...(operation === "doctor" ? [] : ["--apply"])],
      { cwd: extracted, encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
  }
});

test("explicit exact-entry project migration and restoration preserve unrelated project assets", (t) => {
  const { root, options } = fixture(t);
  const workspaceRoot = path.join(root, "project");
  fs.mkdirSync(path.join(workspaceRoot, ".opencode/plugins"), { recursive: true });
  const entry = path.join(workspaceRoot, ".opencode/plugins/index.js");
  fs.copyFileSync(".opencode/plugins/index.js", entry);
  fs.writeFileSync(path.join(workspaceRoot, ".opencode/plugins/unrelated.js"), "untouched");
  const before = fs.readFileSync(entry);
  globalOperation("migrate-project", { ...options, workspaceRoot });
  assert.deepEqual(fs.readFileSync(entry), before);
  globalOperation("migrate-project", { ...options, workspaceRoot, apply: true });
  assert.match(fs.readFileSync(entry, "utf8"), /legacy-disabled/);
  assert.equal(globalOperation("doctor", { ...options, workspaceRoot }).projectCollision, null);
  globalOperation("restore-project", { ...options, workspaceRoot, apply: true });
  assert.deepEqual(fs.readFileSync(entry), before);
  assert.equal(
    fs.readFileSync(path.join(workspaceRoot, ".opencode/plugins/unrelated.js"), "utf8"),
    "untouched",
  );
});

test("generic offline build equivalent preserves exact request approval and reports native failure without managed acceptance", async (t) => {
  const { runGlobalBuild } = await import("../src/plugin-modules/global-utilities.ts");
  const { root } = fixture(t);
  let executions = 0;
  const request = {
    command: "npm run build --offline",
    cwd: root,
    timeoutMs: 1000,
    maxOutputBytes: 4096,
    scriptPolicy: "allow-exact-command" as const,
  };
  const execute = () => {
    executions++;
    return { status: 0, stdout: "built" };
  };
  await assert.rejects(
    runGlobalBuild(request, async () => "wrong", execute),
    /approval/,
  );
  assert.equal(executions, 0);
  const success = await runGlobalBuild(request, async (challenge) => challenge, execute);
  assert.equal(success.exitCode, 0);
  assert.equal(success.accepted, false);
  assert.equal(success.networkIsolation, "native-policy");
  const failure = await runGlobalBuild(
    request,
    async (challenge) => challenge,
    () => ({ status: 1, stderr: "fixture failure" }),
  );
  assert.equal(failure.exitCode, 1);
  assert.equal(failure.accepted, false);
});

test("dangling unowned discovery symlinks are collisions and never replaced", (t) => {
  const { options } = fixture(t);
  fs.mkdirSync(path.join(options.configRoot, "agents"), { recursive: true });
  const link = path.join(options.configRoot, "agents/researcher.md");
  fs.symlinkSync("missing", link);
  assert.throws(() => globalOperation("install", { ...options, apply: true }), /symlink|collision/);
  assert.equal(fs.readlinkSync(link), "missing");
});
