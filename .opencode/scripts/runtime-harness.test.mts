#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

interface PreparedRuntime {
  cache: string;
  runtime: string;
}

interface FakeOpenCode {
  executable: string;
  capture: string;
}

interface MutableJson extends Record<string, unknown> {
  bin?: string | Record<string, string>;
  dependencies?: Record<string, string>;
  packages?: Record<string, MutableJson>;
  version?: string;
  link?: boolean;
}

interface PackageMetadata {
  version: string;
  bin?: string | Record<string, string>;
}

interface GeneratedFixture extends PreparedRuntime {
  env: NodeJS.ProcessEnv;
  nodeModules: string;
  packages: Record<string, PackageMetadata>;
  links: Record<string, GeneratedLink> & { uuid: GeneratedLink };
}

interface GeneratedLink {
  packageName: string;
  target: string;
  targetFile: string;
  linkText: string;
}

interface ProviderLimit extends Record<string, unknown> {
  context: number | boolean;
  output: number | boolean;
}

interface ProviderModelOptions extends Record<string, unknown> {
  chat_template_kwargs: Record<string, unknown> & {
    enable_thinking: boolean | string | null;
  };
}

interface ProviderModel extends Record<string, unknown> {
  name: string;
  limit: ProviderLimit;
  options: ProviderModelOptions;
}

interface ProviderEntry extends Record<string, unknown> {
  options: Record<string, unknown> & { baseURL: string };
  models: Record<string, ProviderModel> & { model: ProviderModel };
}

interface ProviderDocument extends Record<string, unknown> {
  provider: Record<string, ProviderEntry> & { "ai-infra-test": ProviderEntry };
}

interface CatalogDocument {
  schemaVersion: string;
  models: Record<string, { model: string; routingServiceUrl: string; maxInFlight: number }> & {
    "ai-infra-test": { model: string; routingServiceUrl: string; maxInFlight: number };
  };
}

interface RoutingProfile extends Record<string, unknown> {
  localRouting: Record<string, unknown> & {
    models?: Record<string, unknown>;
    forceLocalForHarnessSubagents: boolean;
    defaultLocalModel: string | null;
  };
}

interface ValidationFixture {
  directory: string;
  provider: string;
  catalog: string;
  profile: string;
}

type ProviderMutationCase = [string, (value: ProviderDocument) => void, RegExp];
type CrossMutationCase = [
  string,
  (provider: ProviderDocument, catalog: CatalogDocument) => void,
  RegExp,
];

interface CapturedFixture {
  env: Record<string, string> & { OPENCODE_DB: string };
  argv: string[];
  cwd: string;
  modes: Record<string, number>;
  snapshots: Record<string, string>;
  documents: Record<string, unknown> & { OPENCODE_CONFIG?: ProviderDocument };
  databaseAbsentAtEntry: Record<string, boolean>;
  databaseModes: Record<string, number>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseMutableJson(filename: string): MutableJson {
  const value: unknown = JSON.parse(fs.readFileSync(filename, "utf8"));
  assert.ok(isRecord(value));
  return value;
}

function assertCaptured(value: unknown): asserts value is CapturedFixture {
  assert.ok(isRecord(value));
  assert.ok(isRecord(value.env));
  assert.equal(typeof value.env.OPENCODE_DB, "string");
  assert.ok(Array.isArray(value.argv));
  assert.equal(typeof value.cwd, "string");
  assert.ok(isRecord(value.modes));
  assert.ok(isRecord(value.snapshots));
  assert.ok(isRecord(value.documents));
  if (value.documents.OPENCODE_CONFIG !== undefined) {
    assert.ok(
      isRecord(value.documents.OPENCODE_CONFIG) &&
        isRecord(value.documents.OPENCODE_CONFIG.provider),
    );
  }
  assert.ok(isRecord(value.databaseAbsentAtEntry));
  assert.ok(isRecord(value.databaseModes));
}

function parseCaptured(filename: string): CapturedFixture {
  const value: unknown = JSON.parse(fs.readFileSync(filename, "utf8"));
  assertCaptured(value);
  return value;
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const CLI = path.join(
  ROOT,
  process.env.HARNESS_TEST_SOURCE_CLI === "1"
    ? "bin/opencode-harness.ts"
    : "bin/opencode-harness.mjs",
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "opencode-harness-runtime-"));
const defaultOpenCode = path.join(temp, "default-opencode");
fs.writeFileSync(
  defaultOpenCode,
  '#!/bin/sh\nif [ "$1" = "--version" ]; then printf "1.18.18\\n"; fi\nexit 0\n',
  { mode: 0o700 },
);
const mkfifoAvailable = spawnSync("mkfifo", ["--version"], { stdio: "ignore" }).error === undefined;
test.after(() => fs.rmSync(temp, { recursive: true, force: true }));

function run(args: string[], env: NodeJS.ProcessEnv = {}, cwd = temp): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, OPENCODE_BIN: defaultOpenCode, ...env },
  });
}

function prepare(name: string): PreparedRuntime {
  const cache = path.join(temp, name);
  const result = run(["prepare", "--cache-root", cache]);
  assert.equal(result.status, 0, result.stderr);
  return { cache, runtime: result.stdout.trim() };
}

function fake(name: string, version = "1.18.18"): FakeOpenCode {
  const capture = path.join(temp, `${name}-capture.json`);
  const executable = path.join(temp, `${name}-opencode.mjs`);
  const script = [
    "#!/usr/bin/env node",
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "import { createHash } from 'node:crypto';",
    "import { spawnSync } from 'node:child_process';",
    `if (process.argv[2] === '--version') process.stdout.write(${JSON.stringify(`${version}\n`)});`,
    "else {",
    " const argv=process.argv.slice(2); const commands=new Set(['models','agent','run','serve']);",
    " if(argv.length && !commands.has(argv[0])) { process.stderr.write('fake OpenCode top-level grammar rejected project-before-subcommand argv\\n'); process.exitCode=64; }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_NONZERO){ process.stderr.write('injected probe failure\\n'); process.exitCode=22; }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_MISSING){ }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH&&process.env.HARNESS_TEST_PROBE_WRONG){ fs.writeFileSync(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH,'{}\\n',{flag:'wx',mode:0o600}); }",
    " else if(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH){ const roles=['implementer','planner','researcher','validator']; const traceOnly=new Set(['planner','researcher','validator']); const workspace=process.env.OPENCODE_HARNESS_WORKSPACE_ROOT; const trace=process.env.OPENCODE_HARNESS_TRACE_ROOT; const relative=path.relative(workspace,trace).split(path.sep).join('/'); const permissions=roles.map((role)=>({role,externalDirectory:trace+'/orchestrations/*/roles/'+role+'/*',edit:traceOnly.has(role)?relative+'/orchestrations/*/roles/'+role+'/*.md':null})); const plan={schemaVersion:'1.0.0',workspaceRoot:workspace,traceRoot:trace,roles,permissions}; const marker={...plan,nonce:process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE,permissionPlanDigest:createHash('sha256').update(JSON.stringify(plan)).digest('hex')}; fs.writeFileSync(process.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH,JSON.stringify(marker)+'\\n',{flag:'wx',mode:0o600}); }",
    ` else { const keys=['OPENCODE_CONFIG','OPENCODE_HARNESS_ROUTING_CATALOG','OPENCODE_HARNESS_ROUTING_PROFILE']; const launch=new URL('.', 'file://'+process.env.OPENCODE_DB).pathname; const databaseAbsentAtEntry=Object.fromEntries([['db',''],['wal','-wal'],['shm','-shm']].map(([name,suffix])=>[name,!fs.existsSync(process.env.OPENCODE_DB+suffix)])); if(Object.values(databaseAbsentAtEntry).some((absent)=>!absent)) throw new Error('database companion existed before fake child entry'); if(process.env.HARNESS_TEST_SWAP) fs.writeFileSync(process.env.HARNESS_TEST_SWAP,'{"swapped":true}\\n'); if(process.env.HARNESS_TEST_DB_FILES){ for(const suffix of ['', '-wal', '-shm']) fs.writeFileSync(process.env.OPENCODE_DB+suffix,suffix||'db'); } if(process.env.HARNESS_TEST_DB_SYMLINK){ const suffix=process.env.HARNESS_TEST_DB_SYMLINK_SUFFIX==='main'?'':(process.env.HARNESS_TEST_DB_SYMLINK_SUFFIX||'-wal'); fs.symlinkSync(process.env.HARNESS_TEST_DB_SYMLINK,process.env.OPENCODE_DB+suffix); } if(process.env.HARNESS_TEST_DB_WRONG_MODE){ const suffix=process.env.HARNESS_TEST_DB_WRONG_MODE==='main'?'':process.env.HARNESS_TEST_DB_WRONG_MODE; fs.writeFileSync(process.env.OPENCODE_DB+suffix,'wrong-mode'); fs.chmodSync(process.env.OPENCODE_DB+suffix,0o644); } if(process.env.HARNESS_TEST_DB_UNEXPECTED) fs.writeFileSync(new URL('unexpected','file://'+process.env.OPENCODE_DB).pathname,'unexpected'); if(process.env.HARNESS_TEST_DB_UNEXPECTED_DIR){ fs.mkdirSync(launch+'unexpected-dir/nested',{recursive:true}); fs.writeFileSync(launch+'unexpected-dir/nested/file','nested'); } if(process.env.HARNESS_TEST_DB_UNEXPECTED_SYMLINK) fs.symlinkSync(process.env.HARNESS_TEST_DB_UNEXPECTED_SYMLINK,launch+'unexpected-link'); if(process.env.HARNESS_TEST_DB_CONFUSION){ fs.mkdirSync(process.env.OPENCODE_DB+'-wal'); fs.symlinkSync(process.env.HARNESS_TEST_DB_CONFUSION,process.env.OPENCODE_DB+'-wal/outside-link'); } if(process.env.HARNESS_TEST_DB_SPECIAL) spawnSync('mkfifo',[launch+'unexpected-fifo']); const modes=Object.fromEntries(keys.filter((key)=>process.env[key]).map((key)=>[key,fs.lstatSync(process.env[key]).mode&0o777])); const snapshots=Object.fromEntries(keys.filter((key)=>process.env[key]).map((key)=>[key,fs.readFileSync(process.env[key],'utf8')])); const documents=Object.fromEntries(Object.entries(snapshots).map(([key,value])=>[key,JSON.parse(value)]));`,
    ` fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({env: process.env, argv, cwd: process.cwd(), modes, snapshots, documents, databaseAbsentAtEntry, databaseModes:Object.fromEntries(['','-wal','-shm'].filter((suffix)=>fs.existsSync(process.env.OPENCODE_DB+suffix)).map((suffix)=>[suffix||'db',fs.lstatSync(process.env.OPENCODE_DB+suffix).mode&0o777]))})); if(process.env.HARNESS_TEST_CHILD_FAIL) process.exitCode=23; }`,
    "}",
    "",
  ].join("\n");
  fs.writeFileSync(executable, script, { mode: 0o700 });
  return { executable, capture };
}

function repo(name: string): string {
  const root = path.join(temp, name);
  fs.mkdirSync(root);
  spawnSync("git", ["init", "-q", root]);
  return root;
}

function writePrivate(filename: string, document: unknown): string {
  fs.writeFileSync(filename, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600 });
  return filename;
}

function writeGeneratedJson(filename: string, document: unknown): void {
  fs.writeFileSync(filename, `${JSON.stringify(document, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(filename, 0o600);
}

function canonicalInventory(root: string): string {
  const records: string[] = [];

  function walk(relative = "") {
    const directory = relative ? path.join(root, relative) : root;
    for (const name of fs.readdirSync(directory).sort()) {
      const childRelative = relative ? `${relative}/${name}` : name;
      const child = path.join(root, childRelative);
      const stat = fs.lstatSync(child);
      if (stat.isSymbolicLink())
        records.push(
          `link:${childRelative}:${stat.uid}:${stat.mode & 0o777}:${fs.readlinkSync(child)}`,
        );
      else if (stat.isDirectory()) {
        records.push(`dir:${childRelative}:${stat.uid}:${stat.mode & 0o777}`);
        walk(childRelative);
      } else
        records.push(
          `file:${childRelative}:${stat.uid}:${stat.mode & 0o777}:${createHash("sha256").update(fs.readFileSync(child)).digest("hex")}`,
        );
    }
  }

  walk();
  return records.join("\n");
}

function generatedNodeModulesFixture(name: string, version = "1.18.18"): GeneratedFixture {
  const cache = path.join(temp, name);
  const opencode = fake(`${name}-version`, version);
  const result = run(["prepare", "--cache-root", cache], { OPENCODE_BIN: opencode.executable });
  assert.equal(result.status, 0, result.stderr);
  const prepared = {
    cache,
    runtime: result.stdout.trim(),
    env: { OPENCODE_BIN: opencode.executable },
  };
  const nodeModules = path.join(prepared.runtime, "node_modules");
  fs.mkdirSync(path.join(nodeModules, ".bin"), { recursive: true, mode: 0o700 });
  const packages: Record<string, PackageMetadata> = {
    "@opencode-ai/plugin": { version },
    "msgpackr-extract": {
      version: "3.0.3",
      bin: { "download-msgpackr-prebuilds": "./bin/download.js" },
    },
    "node-gyp-build-optional-packages": {
      version: "5.2.2",
      bin: {
        "node-gyp-build-optional-packages": "bin.js",
        "node-gyp-build-optional-packages-optional": "./optional.js",
        "node-gyp-build-optional-packages-test": "build-test.js",
      },
    },
    which: { version: "5.0.0", bin: { "node-which": "./bin/node-which.js" } },
    uuid: { version: "14.0.1", bin: "./dist-node/bin/uuid" },
    yaml: { version: "2.8.1", bin: "bin.mjs" },
  };
  const lockPackages: Record<string, MutableJson> = {
    "": { dependencies: { "@opencode-ai/plugin": version } },
  };
  const links: Record<string, GeneratedLink> = {};
  for (const [packageName, metadata] of Object.entries(packages)) {
    const directory = path.join(nodeModules, ...packageName.split("/"));
    fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeGeneratedJson(path.join(directory, "package.json"), { name: packageName, ...metadata });
    lockPackages[`node_modules/${packageName}`] = { version: metadata.version };
    const declarations: [string, string][] =
      typeof metadata.bin === "string"
        ? [[packageName.split("/").at(-1) ?? packageName, metadata.bin]]
        : Object.entries(metadata.bin ?? {});
    for (const [binName, rawTarget] of declarations) {
      const target = rawTarget.startsWith("./") ? rawTarget.slice(2) : rawTarget;
      const targetFile = path.join(directory, ...target.split("/"));
      fs.mkdirSync(path.dirname(targetFile), { recursive: true, mode: 0o700 });
      fs.writeFileSync(targetFile, "#!/usr/bin/env node\n", { mode: 0o700 });
      const linkText = path.posix.relative(".bin", path.posix.join(packageName, target));
      fs.symlinkSync(linkText, path.join(nodeModules, ".bin", binName));
      links[binName] = { packageName, target, targetFile, linkText };
    }
  }
  writeGeneratedJson(path.join(prepared.runtime, "package.json"), {
    dependencies: { "@opencode-ai/plugin": version },
  });
  writeGeneratedJson(path.join(prepared.runtime, "package-lock.json"), {
    name: "fixture",
    lockfileVersion: 3,
    packages: lockPackages,
  });
  writeGeneratedJson(path.join(nodeModules, ".package-lock.json"), {
    lockfileVersion: 3,
    packages: Object.fromEntries(Object.entries(lockPackages).filter(([key]) => key)),
  });
  assert.ok(links.uuid);
  return { ...prepared, nodeModules, packages, links: { ...links, uuid: links.uuid } };
}

function updateJson(filename: string, mutate: (document: MutableJson) => void): void {
  const document = parseMutableJson(filename);
  mutate(document);
  writeGeneratedJson(filename, document);
}

function validProvider(enableThinking = false): ProviderDocument {
  return {
    $schema: "https://opencode.ai/config.json",
    provider: {
      "ai-infra-test": {
        npm: "@ai-sdk/openai-compatible",
        name: "test",
        options: { baseURL: "http://127.0.0.1:8080/v1" },
        models: {
          model: {
            name: "model",
            limit: { context: 8192, output: 384 },
            options: { chat_template_kwargs: { enable_thinking: enableThinking } },
          },
        },
      },
    },
  };
}

function validCatalog(port = 8080): CatalogDocument {
  return {
    schemaVersion: "1.0.0",
    models: {
      "ai-infra-test": {
        model: "ai-infra-test/model",
        routingServiceUrl: `http://127.0.0.1:${port}/v1`,
        maxInFlight: 1,
      },
    },
  };
}

function validProfile(): RoutingProfile {
  const document: unknown = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, ".opencode/routing/harness-model-routing.example.json"),
      "utf8",
    ),
  );
  assert.ok(isRecord(document));
  assert.ok(isRecord(document.harnessModelRouting));
  const profile = document.harnessModelRouting;
  assert.ok(isRecord(profile.localRouting));
  assert.equal(typeof profile.localRouting.forceLocalForHarnessSubagents, "boolean");
  assert.ok(
    profile.localRouting.defaultLocalModel === null ||
      typeof profile.localRouting.defaultLocalModel === "string",
  );

  function assertProfile(value: unknown): asserts value is RoutingProfile {
    assert.ok(isRecord(value));
    assert.ok(isRecord(value.localRouting));
  }

  assertProfile(profile);
  delete profile.localRouting.models;
  return profile;
}

function validationFixture(
  name: string,
  {
    provider = validProvider(),
    catalog = validCatalog(),
    profile = validProfile(),
  }: { provider?: unknown; catalog?: unknown; profile?: unknown } = {},
): ValidationFixture {
  const directory = path.join(temp, name);
  fs.mkdirSync(directory, { mode: 0o700 });
  return {
    directory,
    provider: writePrivate(path.join(directory, "provider.json"), provider),
    catalog: writePrivate(path.join(directory, "catalog.json"), catalog),
    profile: writePrivate(path.join(directory, "profile.json"), profile),
  };
}

test("prepare creates a deterministic owner-only runtime and reuses it", () => {
  const cache = path.join(temp, "cache");
  const first = run(["prepare", "--cache-root", cache]);
  assert.equal(first.status, 0, first.stderr);
  const runtime = first.stdout.trim();
  assert.equal(fs.lstatSync(runtime).mode & 0o777, 0o700);
  assert.equal(fs.lstatSync(path.join(runtime, "agents/researcher.md")).mode & 0o777, 0o644);
  const second = run(["prepare", "--cache-root", cache], {}, "/");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout.trim(), runtime);
});

test("prepare accepts arbitrary releases and separates diagnostic-version caches", () => {
  const cache = path.join(temp, "version-policy-cache");
  const maximum = fake("version-maximum", "1.18.25");
  const accepted = run(["prepare", "--cache-root", cache], { OPENCODE_BIN: maximum.executable });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.match(accepted.stdout.trim(), /\/0\.1\.14\/opencode-1\.18\.25\/runtime$/);
  const marker = JSON.parse(
    fs.readFileSync(path.join(accepted.stdout.trim(), ".harness-runtime.json"), "utf8"),
  );
  assert.deepEqual(marker, { packageVersion: "0.1.14", opencodeVersion: "1.18.25" });

  for (const version of [
    "1.18.17",
    "1.18.26",
    "1.18.25-beta.1",
    "01.18.25",
    "2.0.0",
    // A fake tagged V2 version only exercises diagnostic cache isolation, not managed Task safety.
    "2.1.4",
    "development-build",
  ]) {
    const unsupported = fake(`version-unsupported-${version.replaceAll(".", "-")}`, version);
    const result = run(["prepare", "--cache-root", cache], {
      OPENCODE_BIN: unsupported.executable,
    });
    assert.equal(result.status, 0, result.stderr);
    assert.notEqual(result.stdout.trim(), accepted.stdout.trim());
  }
});

test("V2 subscription auth import requires an explicit trusted source before native launch", () => {
  const workspace = repo("v2-auth-source-repo");
  fs.chmodSync(workspace, 0o700);
  fs.writeFileSync(path.join(workspace, ".gitignore"), ".memory/\n");
  const home = path.join(temp, "v2-auth-empty-home");
  fs.mkdirSync(home, { mode: 0o700 });
  const cache = path.join(temp, "v2-auth-source-cache");
  const args = [
    "run",
    "--workspace",
    workspace,
    "--cache-root",
    cache,
    "--v2-auth-data-home",
    home,
    "--",
    "--version",
  ];
  const v1 = fake("v2-auth-source-v1");
  const deniedV1 = run(args, { OPENCODE_BIN: v1.executable });
  assert.notEqual(deniedV1.status, 0);
  assert.match(deniedV1.stderr, /requires a verified V2 native CLI contract/);
  assert.equal(fs.existsSync(v1.capture), false);
  const v2 = fake("v2-auth-source-v2", "opencode v2.1.4");
  const deniedV2 = run(args, { OPENCODE_BIN: v2.executable });
  assert.notEqual(deniedV2.status, 0);
  assert.match(deniedV2.stderr, /V2 auth directory component is unavailable/);
  assert.equal(fs.existsSync(v2.capture), false);
});

test("prepared runtime plugin imports its complete production graph", async () => {
  const prepared = prepare("prepared-plugin-import");
  const plugin = await import(
    `${pathToFileURL(path.join(prepared.runtime, "plugins/index.js")).href}?prepared=${Date.now()}`
  );
  assert.equal(typeof plugin.default, "function");
  const hooks = await plugin.default({});
  for (const name of [
    "config",
    "tool.execute.before",
    "tool.execute.after",
    "command.execute.before",
  ])
    assert.equal(typeof hooks[name], "function", name);
});

test("prepare refuses managed drift and symlink collisions without repairing them", () => {
  const cache = path.join(temp, "drift-cache");
  const prepared = run(["prepare", "--cache-root", cache]);
  assert.equal(prepared.status, 0, prepared.stderr);
  const target = path.join(prepared.stdout.trim(), "agents/researcher.md");
  fs.appendFileSync(target, "\ndrift\n");
  const drift = run(["prepare", "--cache-root", cache]);
  assert.notEqual(drift.status, 0);
  assert.match(drift.stderr, /managed runtime drift/);
  const collisionCache = path.join(temp, "symlink-cache");
  const runtime = path.join(collisionCache, "0.1.14/opencode-1.18.18/runtime");
  fs.mkdirSync(path.dirname(runtime), { recursive: true, mode: 0o700 });
  fs.symlinkSync(temp, runtime);
  const collision = run(["prepare", "--cache-root", collisionCache]);
  assert.notEqual(collision.status, 0);
  assert.match(collision.stderr, /must not be a symlink|non-symlink directory/);
});

test("run rejects activation environment poisoning and partial routing pairs before spawn", () => {
  const repo = path.join(temp, "poison-repo");
  fs.mkdirSync(repo);
  spawnSync("git", ["init", "-q", repo]);
  const poisoned = run(["run", "--workspace", repo], { OPENCODE_CONFIG_DIR: "/tmp/poison" });
  assert.notEqual(poisoned.status, 0);
  assert.match(poisoned.stderr, /refusing pre-set OPENCODE_CONFIG_DIR/);
  const partial = run(["run", "--workspace", repo, "--routing-catalog", "/tmp/catalog"]);
  assert.notEqual(partial.status, 0);
  assert.match(partial.stderr, /all-or-none pair/);
});

test("help is available from arbitrary working directories", () => {
  const result = run(["help"], {}, "/");
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /prepare/);
  assert.match(
    result.stdout,
    /validate-inputs \[--provider-config FILE\] \[--routing-catalog FILE --routing-profile FILE\]/,
  );
  assert.match(result.stdout, /run \[--opencode-bin ABS\] \[--workspace ABS\]/);
});

test("capabilities is deterministic, closed, offline, and no-write", () => {
  const cwd = path.join(temp, "capabilities-cwd");
  fs.mkdirSync(cwd, { mode: 0o700 });
  const before = canonicalInventory(cwd);
  const first = run(
    ["capabilities"],
    { PATH: path.join(temp, "missing-path"), HOME: path.join(temp, "missing-home") },
    cwd,
  );
  const second = run(
    ["capabilities"],
    { PATH: path.join(temp, "missing-path"), HOME: path.join(temp, "missing-home") },
    cwd,
  );
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.stderr, "");
  assert.deepEqual(JSON.parse(first.stdout), {
    packageVersion: "0.1.14",
    launchContractVersion: "1.0.0",
    routingProfileVersion: "2.0.0",
    supportedModes: ["cloud-only", "local-only", "mixed"],
    opencodeVersionGate: false,
  });
  const extra = run(["capabilities", "--cache-root", path.join(temp, "forbidden-cache")], {}, cwd);
  assert.equal(extra.status, 1);
  assert.match(extra.stderr, /accepts no arguments/);
  assert.equal(canonicalInventory(cwd), before);
});

test("validate-inputs accepts exactly the three supported combinations with deterministic compact output", () => {
  const fixture = validationFixture("validate-success");
  const cases: [
    string[],
    { providerConfig: boolean; routingCatalog: boolean; routingProfile: boolean },
  ][] = [
    [
      ["--provider-config", fixture.provider],
      { providerConfig: true, routingCatalog: false, routingProfile: false },
    ],
    [
      ["--routing-catalog", fixture.catalog, "--routing-profile", fixture.profile],
      { providerConfig: false, routingCatalog: true, routingProfile: true },
    ],
    [
      [
        "--provider-config",
        fixture.provider,
        "--routing-catalog",
        fixture.catalog,
        "--routing-profile",
        fixture.profile,
      ],
      { providerConfig: true, routingCatalog: true, routingProfile: true },
    ],
  ];
  for (const [args, inputs] of cases) {
    const expected = `${JSON.stringify({ schemaVersion: "1.0.0", valid: true, packageVersion: "0.1.14", inputs })}\n`;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = run(["validate-inputs", ...args], {}, "/");
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, expected);
      assert.equal(result.stderr, "");
    }
  }
});

test("validate-inputs grammar is closed and failures use stderr only", () => {
  const fixture = validationFixture("validate-grammar");
  const cases: string[][] = [
    [],
    ["--routing-catalog", fixture.catalog],
    ["--routing-profile", fixture.profile],
    ["--provider-config", fixture.provider, "--provider-config", fixture.provider],
    ["--allow-project-plugins"],
    ["--workspace", fixture.directory],
    ["--trace-root", fixture.directory],
    ["--cache-root", fixture.directory],
    ["--"],
    ["--", "models"],
    ["positional.json"],
    ["--provider-config"],
  ];
  for (const args of cases) {
    const result = run(["validate-inputs", ...args]);
    assert.equal(result.status, 1, args.join(" "));
    assert.equal(result.stdout, "", args.join(" "));
    assert.match(result.stderr, /^opencode-harness: .+\n$/);
  }
});

test("validate-inputs escapes line breaks in caller-controlled option and path failures", () => {
  const fixture = validationFixture("validate-line-breaks");
  const cases: [string, string[], RegExp][] = [
    ["unknown option newline", [`--bad\ninjected`], /--bad\\ninjected/],
    ["unknown option carriage return", [`--bad\rinjected`], /--bad\\rinjected/],
    [
      "missing path newline",
      ["--provider-config", path.join(fixture.directory, "missing\nprovider.json")],
      /missing\\nprovider\.json/,
    ],
    [
      "missing path carriage return",
      ["--provider-config", path.join(fixture.directory, "missing\rprovider.json")],
      /missing\\rprovider\.json/,
    ],
  ];
  for (const [name, args, expected] of cases) {
    const result = run(["validate-inputs", ...args]);
    assert.equal(result.status, 1, name);
    assert.equal(result.stdout, "", name);
    assert.match(result.stderr, /^opencode-harness: [^\r\n]+\n$/, name);
    assert.match(result.stderr, expected, name);
  }
});

test("validate-inputs rejects malformed, oversized, unsafe-mode, and symlinked leaves", () => {
  const fixture = validationFixture("validate-files");
  const malformed = path.join(fixture.directory, "malformed.json");
  fs.writeFileSync(malformed, "{", { mode: 0o600 });
  const oversized = path.join(fixture.directory, "oversized.json");
  fs.writeFileSync(oversized, Buffer.alloc(1024 * 1024 + 1), { mode: 0o600 });
  const wrongMode = writePrivate(path.join(fixture.directory, "wrong-mode.json"), validProvider());
  fs.chmodSync(wrongMode, 0o644);
  const symlink = path.join(fixture.directory, "provider-link.json");
  fs.symlinkSync(fixture.provider, symlink);
  for (const [filename, expected] of [
    [malformed, /malformed JSON/],
    [oversized, /exceeds/],
    [wrongMode, /mode 600/],
    [symlink, /must not be a symlink/],
  ] as [string, RegExp][]) {
    const result = run(["validate-inputs", "--provider-config", filename]);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, expected);
  }
});

test("validate-inputs applies provider metadata, profile policy, and cross-document checks without repair", () => {
  const providerMutations: ProviderMutationCase[] = [
    [
      "missing-context",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"]!.models.model!.limit, "context");
      },
      /context is required/,
    ],
    [
      "zero-context",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = 0;
      },
      /context limit/,
    ],
    [
      "boolean-context",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = true;
      },
      /context limit/,
    ],
    [
      "overflow-context",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = 2147483648;
      },
      /context limit/,
    ],
    [
      "missing-output",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"]!.models.model!.limit, "output");
      },
      /output is required/,
    ],
    [
      "zero-output",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 0;
      },
      /output limit/,
    ],
    [
      "boolean-output",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = false;
      },
      /output limit/,
    ],
    [
      "overflow-output",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 2147483648;
      },
      /output limit/,
    ],
    [
      "equal-output",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 8192;
      },
      /less than context/,
    ],
    [
      "greater-output",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 8193;
      },
      /less than context/,
    ],
  ];
  for (const [name, mutate, expected] of providerMutations) {
    const provider = validProvider();
    mutate(provider);
    const fixture = validationFixture(`validate-provider-${name}`, { provider });
    const result = run(["validate-inputs", "--provider-config", fixture.provider]);
    assert.equal(result.status, 1, name);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, expected, name);
  }

  const profileCases: [string, unknown, RegExp][] = [
    ["wrapped", { harnessModelRouting: validProfile() }, /routing profile/],
    [
      "embedded-models",
      (() => {
        const value = validProfile();
        value.localRouting.models = {};
        return value;
      })(),
      /models/,
    ],
    [
      "force-local",
      (() => {
        const value = validProfile();
        value.localRouting.forceLocalForHarnessSubagents = true;
        return value;
      })(),
      /force-local setting|forceLocalForHarnessSubagents/,
    ],
    [
      "missing-reference",
      (() => {
        const value = validProfile();
        value.localRouting.defaultLocalModel = "ai-infra-missing";
        return value;
      })(),
      /must reference localRouting.models|unknown catalog model/,
    ],
  ];
  for (const [name, profile, expected] of profileCases) {
    const fixture = validationFixture(`validate-profile-${name}`, { profile });
    const result = run([
      "validate-inputs",
      "--routing-catalog",
      fixture.catalog,
      "--routing-profile",
      fixture.profile,
    ]);
    assert.equal(result.status, 1, name);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, expected, name);
  }

  const crossCases: CrossMutationCase[] = [
    [
      "missing-provider",
      (provider, catalog) => {
        catalog.models["ai-infra-other"] = {
          model: "ai-infra-other/model",
          routingServiceUrl: "http://127.0.0.1:8081/v1",
          maxInFlight: 1,
        };
      },
      /mismatch/,
    ],
    [
      "extra-provider",
      (provider) => {
        provider.provider["ai-infra-other"] = structuredClone(provider.provider["ai-infra-test"]);
      },
      /provider sets differ/,
    ],
    [
      "model",
      (provider, catalog) => {
        catalog.models["ai-infra-test"].model = "ai-infra-test/other";
      },
      /mismatch/,
    ],
    [
      "url",
      (provider, catalog) => {
        catalog.models["ai-infra-test"].routingServiceUrl = "http://127.0.0.1:8081/v1";
      },
      /mismatch/,
    ],
  ];
  for (const [name, mutate, expected] of crossCases) {
    const provider = validProvider();
    const catalog = validCatalog();
    mutate(provider, catalog);
    const fixture = validationFixture(`validate-cross-${name}`, { provider, catalog });
    const result = run([
      "validate-inputs",
      "--provider-config",
      fixture.provider,
      "--routing-catalog",
      fixture.catalog,
      "--routing-profile",
      fixture.profile,
    ]);
    assert.equal(result.status, 1, name);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, expected, name);
  }
});

test("validate-inputs performs no workspace, state, network, or child activity", () => {
  const portFile = path.join(temp, "validate-listener-port");
  const requestMarker = path.join(temp, "validate-listener-request");
  const listener = spawn(
    process.execPath,
    [
      "-e",
      `const fs=require('node:fs');const http=require('node:http');const server=http.createServer(()=>fs.writeFileSync(${JSON.stringify(requestMarker)},'request'));server.listen(0,'127.0.0.1',()=>fs.writeFileSync(${JSON.stringify(portFile)},String(server.address().port),{mode:0o600}));`,
    ],
    { stdio: "ignore" },
  );
  try {
    for (let count = 0; count < 100 && !fs.existsSync(portFile); count += 1)
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
    assert.equal(fs.existsSync(portFile), true, "request-counting listener did not start");
    const port = Number(fs.readFileSync(portFile, "utf8"));
    const provider = validProvider();
    provider.provider["ai-infra-test"].options.baseURL = `http://127.0.0.1:${port}/v1`;
    const fixture = validationFixture("validate-no-effects", {
      provider,
      catalog: validCatalog(port),
    });
    const marker = path.join(temp, "validate-opencode-marker");
    const absent = [
      "home",
      "xdg-cache",
      "xdg-state",
      "xdg-data",
      "workspace",
      "cache",
      "trace",
    ].map((name) => path.join(temp, `validate-absent-${name}`));
    const before = canonicalInventory(fixture.directory);
    const env = {
      PATH: path.join(temp, "validate-nonexistent-path"),
      OPENCODE_BIN: marker,
      OPENCODE_DB: path.join(temp, "validate.db"),
      OPENCODE_CONFIG: path.join(temp, "poison-config"),
      OPENCODE_CONFIG_CONTENT: "{poison",
      OPENCODE_CONFIG_DIR: path.join(temp, "poison-dir"),
      OPENCODE_HARNESS_WORKSPACE_ROOT: absent[4]!,
      OPENCODE_HARNESS_RUNTIME_ROOT: path.join(temp, "poison-runtime"),
      OPENCODE_HARNESS_TRACE_ROOT: absent[6]!,
      HOME: absent[0]!,
      XDG_CACHE_HOME: absent[1]!,
      XDG_STATE_HOME: absent[2]!,
      XDG_DATA_HOME: absent[3]!,
    };
    const args = [
      "validate-inputs",
      "--provider-config",
      fixture.provider,
      "--routing-catalog",
      fixture.catalog,
      "--routing-profile",
      fixture.profile,
    ];
    const result = run(args, env, fixture.directory);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    assert.equal(canonicalInventory(fixture.directory), before);
    assert.equal(fs.existsSync(marker), false);
    for (const pathname of absent) assert.equal(fs.existsSync(pathname), false, pathname);
    assert.equal(fs.existsSync(requestMarker), false);

    fs.writeFileSync(fixture.provider, "{", { mode: 0o600 });
    const invalidBefore = canonicalInventory(fixture.directory);
    const invalid = run(args, env, fixture.directory);
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stdout, "");
    assert.equal(canonicalInventory(fixture.directory), invalidBefore);
    assert.equal(fs.existsSync(marker), false);
    for (const pathname of absent) assert.equal(fs.existsSync(pathname), false, pathname);
    assert.equal(fs.existsSync(requestMarker), false);
  } finally {
    listener.kill();
  }
});

test("run keeps workspace in cwd and forwards TUI, models, and run grammar unchanged", () => {
  const workspace = repo("forwarding-repo");
  const cases: [string, string[], string[]][] = [
    ["tui", [], []],
    ["models", ["--", "models", "ai-infra-secondary"], ["models", "ai-infra-secondary"]],
    [
      "run",
      ["--", "run", "--model", "provider/model", "hello"],
      ["run", "--model", "provider/model", "hello"],
    ],
  ];
  for (const [name, forwarded, expected] of cases) {
    const opencode = fake(`forwarding-${name}`);
    const result = run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, `forwarding-${name}-cache`),
        ...forwarded,
      ],
      { OPENCODE_BIN: opencode.executable },
    );
    assert.equal(result.status, 0, result.stderr);
    const captured = parseCaptured(opencode.capture);
    assert.deepEqual(captured.argv, expected);
    assert.equal(captured.cwd, workspace);
  }
  const grammar = fake("workspace-prepend-regression");
  const rejected = spawnSync(grammar.executable, [workspace, "models", "ai-infra-secondary"], {
    cwd: workspace,
    encoding: "utf8",
  });
  assert.equal(rejected.status, 64);
  assert.match(rejected.stderr, /project-before-subcommand/);
});

test("omitted workspace resolves a nested Git directory while explicit nested workspace stays strict", () => {
  const workspace = repo("nested-workspace-repo");
  const nested = path.join(workspace, "one/two");
  fs.mkdirSync(nested, { recursive: true });
  const opencode = fake("nested-workspace");
  const accepted = run(
    ["run", "--cache-root", path.join(temp, "nested-workspace-cache")],
    { OPENCODE_BIN: opencode.executable },
    nested,
  );
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(parseCaptured(opencode.capture).cwd, workspace);
  const explicit = run(
    ["run", "--workspace", nested],
    { OPENCODE_BIN: opencode.executable },
    nested,
  );
  assert.equal(explicit.status, 1);
  assert.match(explicit.stderr, /canonical Git worktree root/);
  const nonGit = path.join(temp, "nested-workspace-non-git");
  fs.mkdirSync(nonGit, { mode: 0o700 });
  const rejected = run(["run"], { OPENCODE_BIN: opencode.executable }, nonGit);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /Git preflight failed/);
});

test("recursive runtime inventory rejects undeclared leaves, symlinked intermediates, unsafe modes, and generated abuse", () => {
  const cases: [string, (runtime: string) => void, RegExp][] = [
    [
      "extra-agent",
      (runtime) =>
        fs.writeFileSync(path.join(runtime, "agents/extra.md"), "extra", { mode: 0o644 }),
      /undeclared runtime entry/,
    ],
    [
      "wrong-directory-mode",
      (runtime) => fs.chmodSync(path.join(runtime, "agents"), 0o755),
      /expected 700/,
    ],
    [
      "generated-mode",
      (runtime) => {
        fs.writeFileSync(path.join(runtime, ".gitignore"), "node_modules\n", { mode: 0o644 });
        fs.chmodSync(path.join(runtime, ".gitignore"), 0o644);
      },
      /expected 600/,
    ],
    [
      "generated-type",
      (runtime) => fs.mkdirSync(path.join(runtime, ".gitignore"), { mode: 0o700 }),
      /regular file/,
    ],
    [
      "node-modules-symlink",
      (runtime) => {
        fs.mkdirSync(path.join(runtime, "node_modules"), { mode: 0o700 });
        fs.symlinkSync(temp, path.join(runtime, "node_modules/escape"));
      },
      /generated package.json.*present together|unsafe recursive generated symlink/,
    ],
    [
      "symlinked-intermediate",
      (runtime) => {
        fs.renameSync(path.join(runtime, "plugins"), path.join(runtime, "plugins-real"));
        fs.symlinkSync(path.join(runtime, "plugins-real"), path.join(runtime, "plugins"));
      },
      /must not be a symlink|undeclared runtime entry/,
    ],
  ];
  for (const [name, mutate, expected] of cases) {
    const prepared = prepare(`recursive-${name}`);
    mutate(prepared.runtime);
    const result = run(["prepare", "--cache-root", prepared.cache]);
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
  }
});

test("generated package metadata accepts seven stock-style node_modules bin links twice without mutation", () => {
  const fixture = generatedNodeModulesFixture("generated-bin-positive");
  const before = canonicalInventory(fixture.runtime);
  const first = run(["prepare", "--cache-root", fixture.cache], fixture.env);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(canonicalInventory(fixture.runtime), before);
  const second = run(["prepare", "--cache-root", fixture.cache], fixture.env, "/");
  assert.equal(second.status, 0, second.stderr);
  assert.equal(canonicalInventory(fixture.runtime), before);
  assert.deepEqual(Object.keys(fixture.links).sort(), [
    "download-msgpackr-prebuilds",
    "node-gyp-build-optional-packages",
    "node-gyp-build-optional-packages-optional",
    "node-gyp-build-optional-packages-test",
    "node-which",
    "uuid",
    "yaml",
  ]);
});

test("generated plugin metadata must agree internally without matching the CLI version", () => {
  const fixture = generatedNodeModulesFixture("generated-plugin-version", "1.18.25");
  const accepted = run(["prepare", "--cache-root", fixture.cache], fixture.env);
  assert.equal(accepted.status, 0, accepted.stderr);
  updateJson(path.join(fixture.runtime, "package.json"), (value) => {
    assert.ok(value.dependencies);
    value.dependencies["@opencode-ai/plugin"] = "1.18.18";
  });
  const mismatch = run(["prepare", "--cache-root", fixture.cache], fixture.env);
  assert.notEqual(mismatch.status, 0);
  assert.match(mismatch.stderr, /root dependency does not match/);
  updateJson(path.join(fixture.runtime, "package-lock.json"), (value) => {
    assert.ok(value.packages);
    value.packages[""]!.dependencies!["@opencode-ai/plugin"] = "1.18.18";
    value.packages["node_modules/@opencode-ai/plugin"]!.version = "1.18.18";
  });
  updateJson(
    path.join(fixture.runtime, "node_modules/@opencode-ai/plugin/package.json"),
    (value) => {
      value.version = "1.18.18";
    },
  );
  const coherent = run(["prepare", "--cache-root", fixture.cache], fixture.env);
  assert.equal(coherent.status, 0, coherent.stderr);
});

test("symlinked node_modules root rejects before package, lock, or external canary metadata is read", () => {
  const prepared = prepare("generated-bin-root-symlink");
  const external = path.join(temp, "generated-bin-root-external");
  const externalPackage = path.join(external, "probe/package.json");
  fs.mkdirSync(path.dirname(externalPackage), { recursive: true, mode: 0o700 });
  fs.writeFileSync(externalPackage, "{external-canary", { mode: 0o600 });
  const packageFilename = path.join(prepared.runtime, "package.json");
  const lockFilename = path.join(prepared.runtime, "package-lock.json");
  writeGeneratedJson(packageFilename, { dependencies: { "@opencode-ai/plugin": "1.18.18" } });
  writeGeneratedJson(lockFilename, {
    lockfileVersion: 3,
    packages: {
      "": { dependencies: { "@opencode-ai/plugin": "1.18.18" } },
      "node_modules/@opencode-ai/plugin": { version: "1.18.18" },
      "node_modules/probe": { version: "1.0.0" },
    },
  });
  fs.symlinkSync(external, path.join(prepared.runtime, "node_modules"));
  const old = new Date("2000-01-01T00:00:00.000Z");
  for (const filename of [packageFilename, lockFilename, externalPackage])
    fs.utimesSync(filename, old, old);
  const before = [packageFilename, lockFilename, externalPackage].map(
    (filename) => fs.lstatSync(filename, { bigint: true }).atimeNs,
  );
  const result = run(["prepare", "--cache-root", prepared.cache]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /generated runtime directory node_modules must not be a symlink/);
  const after = [packageFilename, lockFilename, externalPackage].map(
    (filename) => fs.lstatSync(filename, { bigint: true }).atimeNs,
  );
  assert.deepEqual(
    after,
    before,
    "root package, lock, and external canary metadata must remain unread",
  );
  assert.equal(fs.readFileSync(externalPackage, "utf8"), "{external-canary");
});

test("generated node_modules bin link and package metadata attacks are all rejected without repair", (context) => {
  const cases: [string, (fixture: GeneratedFixture) => void][] = [
    [
      "absolute-link",
      (f) => {
        const link = path.join(f.nodeModules, ".bin/uuid");
        fs.unlinkSync(link);
        fs.symlinkSync(f.links.uuid.targetFile, link);
      },
    ],
    ["dangling-target", (f) => fs.unlinkSync(f.links.uuid.targetFile)],
    [
      "lexical-dot-dot-escape",
      (f) => {
        const link = path.join(f.nodeModules, ".bin/uuid");
        fs.unlinkSync(link);
        fs.symlinkSync("../../../outside", link);
      },
    ],
    [
      "resolved-escape",
      (f) => {
        const outside = path.join(temp, "resolved-outside");
        fs.writeFileSync(outside, "x", { mode: 0o600 });
        fs.unlinkSync(f.links.uuid.targetFile);
        fs.symlinkSync(outside, f.links.uuid.targetFile);
      },
    ],
    [
      "directory-target",
      (f) => {
        fs.unlinkSync(f.links.uuid.targetFile);
        fs.mkdirSync(f.links.uuid.targetFile, { mode: 0o700 });
      },
    ],
    [
      "chained-target",
      (f) => {
        fs.unlinkSync(f.links.uuid.targetFile);
        fs.symlinkSync("../../../yaml/bin.mjs", f.links.uuid.targetFile);
      },
    ],
    [
      "looped-target",
      (f) => {
        fs.unlinkSync(f.links.uuid.targetFile);
        fs.symlinkSync("uuid", f.links.uuid.targetFile);
      },
    ],
    [
      "symlinked-intermediate",
      (f) => {
        const bin = path.dirname(f.links.uuid.targetFile);
        const real = `${bin}-real`;
        fs.renameSync(bin, real);
        fs.symlinkSync(real, bin);
      },
    ],
    [
      "outside-bin-location",
      (f) => fs.symlinkSync(f.links.uuid.linkText, path.join(f.nodeModules, "uuid-link")),
    ],
    [
      "nested-bin-location",
      (f) => {
        const nested = path.join(f.nodeModules, "uuid/.bin");
        fs.mkdirSync(nested, { mode: 0o700 });
        fs.symlinkSync("../dist-node/bin/uuid", path.join(nested, "uuid"));
      },
    ],
    ["writable-target", (f) => fs.chmodSync(f.links.uuid.targetFile, 0o722)],
    [
      "wrong-link-name",
      (f) =>
        fs.renameSync(
          path.join(f.nodeModules, ".bin/uuid"),
          path.join(f.nodeModules, ".bin/not-uuid"),
        ),
    ],
    [
      "wrong-link-text",
      (f) => {
        const link = path.join(f.nodeModules, ".bin/uuid");
        fs.unlinkSync(link);
        fs.symlinkSync("../yaml/bin.mjs", link);
      },
    ],
    [
      "missing-bin-metadata",
      (f) =>
        updateJson(path.join(f.nodeModules, "uuid/package.json"), (value) => {
          delete value.bin;
        }),
    ],
    [
      "conflicting-bin-metadata",
      (f) =>
        updateJson(path.join(f.nodeModules, "which/package.json"), (value) => {
          assert.ok(value.bin && typeof value.bin !== "string");
          value.bin.uuid = "./bin/node-which.js";
        }),
    ],
    [
      "malformed-lock",
      (f) => fs.writeFileSync(path.join(f.runtime, "package-lock.json"), "{", { mode: 0o600 }),
    ],
    ["partial-package-lock", (f) => fs.unlinkSync(path.join(f.runtime, "package-lock.json"))],
    [
      "lock-version-mismatch",
      (f) =>
        updateJson(path.join(f.runtime, "package-lock.json"), (value) => {
          assert.ok(value.packages?.["node_modules/uuid"]);
          value.packages["node_modules/uuid"].version = "0.0.0";
        }),
    ],
    [
      "lock-link-entry",
      (f) =>
        updateJson(path.join(f.runtime, "package-lock.json"), (value) => {
          assert.ok(value.packages?.["node_modules/uuid"]);
          value.packages["node_modules/uuid"].link = true;
        }),
    ],
    [
      "root-dependency-mismatch",
      (f) =>
        updateJson(path.join(f.runtime, "package.json"), (value) => {
          assert.ok(value.dependencies);
          value.dependencies["@opencode-ai/plugin"] = "^1.18.18";
        }),
    ],
  ];
  for (const [name, mutate] of cases) {
    const fixture = generatedNodeModulesFixture(`generated-bin-attack-${name}`);
    mutate(fixture);
    const before = canonicalInventory(fixture.runtime);
    const result = run(["prepare", "--cache-root", fixture.cache], fixture.env);
    assert.notEqual(result.status, 0, name);
    assert.equal(canonicalInventory(fixture.runtime), before, `${name} must not be repaired`);
  }

  const owner = generatedNodeModulesFixture("generated-bin-attack-owner");
  try {
    fs.chownSync(owner.links.uuid.targetFile, 65534, 65534);
  } catch {
    context.diagnostic("different-UID generated bin target fixture skipped: unprivileged chown");
    return;
  }
  const ownerBefore = canonicalInventory(owner.runtime);
  assert.notEqual(run(["prepare", "--cache-root", owner.cache], owner.env).status, 0);
  assert.equal(canonicalInventory(owner.runtime), ownerBefore);
});

test("trace roots seed once, preserve edits on repeat, and reject unsafe modes", () => {
  const workspace = repo("trace-repo");
  const trace = path.join(temp, "explicit-trace");
  const opencode = fake("trace");
  const args = [
    "run",
    "--workspace",
    workspace,
    "--cache-root",
    path.join(temp, "trace-cache"),
    "--trace-root",
    trace,
  ];
  const first = run(args, { OPENCODE_BIN: opencode.executable });
  assert.equal(first.status, 0, first.stderr);
  for (const relative of [
    "INDEX.md",
    "protocols/memory-management.md",
    "templates/orchestration-index.md",
    "templates/compaction-handoff.md",
    "templates/role-trace-artifact.md",
  ]) {
    const target = path.join(trace, relative);
    assert.equal(fs.lstatSync(target).mode & 0o777, 0o600);
  }
  assert.equal(run(args, { OPENCODE_BIN: opencode.executable }).status, 0);
  fs.writeFileSync(path.join(trace, "INDEX.md"), "collision\n", { mode: 0o600 });
  const repeated = run(args, { OPENCODE_BIN: opencode.executable });
  assert.equal(repeated.status, 0, repeated.stderr);
  assert.match(repeated.stderr, /preserving existing trace seed/);
  assert.equal(fs.readFileSync(path.join(trace, "INDEX.md"), "utf8"), "collision\n");
  const unsafe = path.join(temp, "unsafe-trace");
  fs.mkdirSync(unsafe, { mode: 0o755 });
  fs.chmodSync(unsafe, 0o755);
  assert.match(
    run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, "unsafe-cache"),
        "--trace-root",
        unsafe,
      ],
      { OPENCODE_BIN: opencode.executable },
    ).stderr,
    /expected 700/,
  );
});

test("external trace activation probe fails closed before requested spawn and workspace fallback skips it", () => {
  const workspace = repo("trace-probe-repo");
  for (const [name, fixture, expected] of [
    ["missing", { HARNESS_TEST_PROBE_MISSING: "1" }, /activation marker is unavailable/],
    ["wrong", { HARNESS_TEST_PROBE_WRONG: "1" }, /activation marker mismatch/],
    ["nonzero", { HARNESS_TEST_PROBE_NONZERO: "1" }, /activation probe failed with status 22/],
  ] as [string, NodeJS.ProcessEnv, RegExp][]) {
    const opencode = fake(`trace-probe-${name}`);
    const result = run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, `trace-probe-${name}-cache`),
        "--trace-root",
        privateTrace(name),
      ],
      { OPENCODE_BIN: opencode.executable, ...fixture },
    );
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    assert.equal(fs.existsSync(opencode.capture), false, `${name} requested child must not start`);
  }

  function privateTrace(name: string): string {
    const root = path.join(temp, `trace-probe-${name}`);
    fs.mkdirSync(root, { mode: 0o700 });
    return root;
  }

  fs.chmodSync(workspace, 0o700);
  fs.writeFileSync(path.join(workspace, ".gitignore"), ".memory/\n");
  const fallback = fake("trace-probe-fallback");
  const accepted = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "trace-probe-fallback-cache"),
    ],
    { OPENCODE_BIN: fallback.executable, HARNESS_TEST_PROBE_NONZERO: "1" },
  );
  assert.equal(accepted.status, 0, accepted.stderr);
  const captured = parseCaptured(fallback.capture);
  assert.equal(captured.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_PATH, undefined);
  assert.equal(captured.env.OPENCODE_HARNESS_TRACE_PERMISSION_PROBE_NONCE, undefined);
  const v2 = fake("trace-probe-v2-unverified", "opencode v2.1.4");
  const rejected = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "trace-probe-v2-unverified-cache"),
    ],
    { OPENCODE_BIN: v2.executable, HARNESS_TEST_PROBE_MISSING: "1" },
  );
  assert.notEqual(rejected.status, 0);
  assert.match(rejected.stderr, /V2 activation server did not report a bounded live endpoint/);
  assert.equal(fs.existsSync(v2.capture), false, "unverified V2 child must not start");
});

test("provider projection validation is closed, credential-free, loopback-only, and semantically coherent", () => {
  const workspace = repo("provider-repo");
  const opencode = fake("provider");
  const base = validProvider();
  const mutations: ProviderMutationCase[] = [
    [
      "unknown",
      (value) => {
        value.extra = true;
      },
      /extra is forbidden/,
    ],
    [
      "credential",
      (value) => {
        value.provider["ai-infra-test"].options.apiKey = "secret";
      },
      /apiKey is forbidden/,
    ],
    [
      "plugin",
      (value) => {
        value.plugin = ["bad"];
      },
      /plugin is forbidden/,
    ],
    [
      "instructions",
      (value) => {
        value.instructions = ["bad"];
      },
      /instructions is forbidden/,
    ],
    [
      "host",
      (value) => {
        value.provider["ai-infra-test"].options.baseURL = "http://localhost:8080/v1";
      },
      /canonical/,
    ],
    [
      "port",
      (value) => {
        value.provider["ai-infra-test"].options.baseURL = "http://127.0.0.1:65536/v1";
      },
      /invalid port|URL/,
    ],
    [
      "model-mismatch",
      (value) => {
        value.provider["ai-infra-test"].models.model.name = "other";
      },
      /key\/name mismatch/,
    ],
    [
      "limit-missing",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"].models.model, "limit");
      },
      /limit is required/,
    ],
    [
      "limit-extra",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.extra = 1;
      },
      /extra is forbidden/,
    ],
    [
      "context-missing",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"].models.model.limit, "context");
      },
      /context is required/,
    ],
    [
      "context-zero",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = 0;
      },
      /context limit is out of range/,
    ],
    [
      "context-boolean",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = true;
      },
      /context limit is out of range/,
    ],
    [
      "context-overflow",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.context = 2147483648;
      },
      /context limit is out of range/,
    ],
    [
      "output-missing",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"].models.model.limit, "output");
      },
      /output is required/,
    ],
    [
      "output-zero",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 0;
      },
      /output limit is out of range/,
    ],
    [
      "output-boolean",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = true;
      },
      /output limit is out of range/,
    ],
    [
      "output-overflow",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 2147483648;
      },
      /output limit is out of range/,
    ],
    [
      "output-equal-context",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 8192;
      },
      /less than context/,
    ],
    [
      "output-greater-context",
      (value) => {
        value.provider["ai-infra-test"].models.model.limit.output = 8193;
      },
      /less than context/,
    ],
    [
      "model-options-missing",
      (value) => {
        Reflect.deleteProperty(value.provider["ai-infra-test"].models.model, "options");
      },
      /options is required/,
    ],
    [
      "model-options-extra",
      (value) => {
        value.provider["ai-infra-test"].models.model.options.extra = true;
      },
      /extra is forbidden/,
    ],
    [
      "chat-template-missing",
      (value) => {
        Reflect.deleteProperty(
          value.provider["ai-infra-test"].models.model.options,
          "chat_template_kwargs",
        );
      },
      /chat_template_kwargs is required/,
    ],
    [
      "chat-template-extra",
      (value) => {
        value.provider["ai-infra-test"].models.model.options.chat_template_kwargs.unknown = true;
      },
      /unknown is forbidden/,
    ],
    [
      "thinking-missing",
      (value) => {
        Reflect.deleteProperty(
          value.provider["ai-infra-test"].models.model.options.chat_template_kwargs,
          "enable_thinking",
        );
      },
      /enable_thinking is required/,
    ],
    [
      "thinking-string",
      (value) => {
        value.provider["ai-infra-test"].models.model.options.chat_template_kwargs.enable_thinking =
          "false";
      },
      /must be a boolean/,
    ],
    [
      "thinking-null",
      (value) => {
        value.provider["ai-infra-test"].models.model.options.chat_template_kwargs.enable_thinking =
          null;
      },
      /must be a boolean/,
    ],
  ];
  for (const [name, mutate, expected] of mutations) {
    const value = structuredClone(base);
    mutate(value);
    const filename = writePrivate(path.join(temp, `provider-${name}.json`), value);
    const result = run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, `provider-cache-${name}`),
        "--provider-config",
        filename,
      ],
      { OPENCODE_BIN: opencode.executable },
    );
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    assert.equal(
      fs.existsSync(opencode.capture),
      false,
      `${name} must fail preflight before spawn`,
    );
  }

  const boundary = structuredClone(validProvider(true));
  boundary.provider["ai-infra-test"].models.model.limit = {
    context: 2147483647,
    output: 2147483646,
  };
  const accepted = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "provider-cache-boundary"),
      "--provider-config",
      writePrivate(path.join(temp, "provider-boundary.json"), boundary),
    ],
    { OPENCODE_BIN: opencode.executable },
  );
  assert.equal(accepted.status, 0, accepted.stderr);
  const capturedBoundary = parseCaptured(opencode.capture);
  const boundaryDocument = capturedBoundary.documents.OPENCODE_CONFIG;
  assert.ok(boundaryDocument);
  assert.equal(
    boundaryDocument.provider["ai-infra-test"].models.model.options.chat_template_kwargs
      .enable_thinking,
    true,
  );
});

test("provider projection refuses provider declarations in root or project config-directory JSONC", () => {
  const opencode = fake("provider-collision");
  const provider = writePrivate(path.join(temp, "provider-collision.json"), validProvider());
  for (const [name, relative, content] of [
    ["root", "opencode.json", JSON.stringify({ provider: { foreign: {} } })],
    ["v2-root", "opencode.json", JSON.stringify({ providers: { foreign: {} } })],
    [
      "config-directory",
      ".opencode/opencode.jsonc",
      '{ // provider collision\n "provider": { "foreign": {}, },\n}',
    ],
  ] as [string, string, string][]) {
    const workspace = repo(`provider-collision-${name}`);
    fs.mkdirSync(path.dirname(path.join(workspace, relative)), { recursive: true });
    fs.writeFileSync(path.join(workspace, relative), content);
    const result = run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, `provider-collision-cache-${name}`),
        "--provider-config",
        provider,
      ],
      { OPENCODE_BIN: opencode.executable },
    );
    assert.match(result.stderr, /declares provider and collides/);
  }
});

test("validated external inputs are passed only as owner-only per-launch snapshots and removed after exit", () => {
  const workspace = repo("snapshot-repo");
  const opencode = fake("snapshot");
  const provider = writePrivate(path.join(temp, "snapshot-provider.json"), validProvider());
  const providerBytes = fs.readFileSync(provider, "utf8");
  const catalogDocument = {
    schemaVersion: "1.0.0",
    models: {
      "ai-infra-test": {
        model: "ai-infra-test/model",
        routingServiceUrl: "http://127.0.0.1:8080/v1",
        maxInFlight: 1,
      },
    },
  };
  const catalog = writePrivate(path.join(temp, "snapshot-catalog.json"), catalogDocument);
  const profileDocument = validProfile();
  delete profileDocument.localRouting.models;
  const profile = writePrivate(path.join(temp, "snapshot-profile.json"), profileDocument);
  const result = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "snapshot-cache"),
      "--provider-config",
      provider,
      "--routing-catalog",
      catalog,
      "--routing-profile",
      profile,
    ],
    { OPENCODE_BIN: opencode.executable, HARNESS_TEST_SWAP: provider },
  );
  assert.equal(result.status, 0, result.stderr);
  const captured = parseCaptured(opencode.capture);
  const env = captured.env;
  for (const [name, original] of [
    ["OPENCODE_CONFIG", provider],
    ["OPENCODE_HARNESS_ROUTING_CATALOG", catalog],
    ["OPENCODE_HARNESS_ROUTING_PROFILE", profile],
  ] as [string, string][]) {
    const snapshotPath = env[name];
    assert.ok(snapshotPath);
    assert.notEqual(env[name], original);
    assert.equal(
      fs.existsSync(snapshotPath),
      false,
      `${name} snapshot should be removed after child exit`,
    );
    assert.ok(snapshotPath.includes("/launches/"));
    assert.equal(captured.modes[name], 0o600);
  }
  const capturedProvider = captured.documents.OPENCODE_CONFIG;
  assert.ok(capturedProvider, "provider snapshot must retain validated bytes after original swap");
  assert.equal(
    captured.snapshots.OPENCODE_CONFIG,
    providerBytes,
    "provider snapshot bytes must exactly preserve the validated input",
  );
  assert.deepEqual(capturedProvider.provider["ai-infra-test"].models.model.limit, {
    context: 8192,
    output: 384,
  });
  assert.equal(
    capturedProvider.provider["ai-infra-test"].models.model.options.chat_template_kwargs
      .enable_thinking,
    false,
  );
  assert.deepEqual(parseMutableJson(provider), { swapped: true });
});

test("each launch isolates owner-only database companions and removes them after exit", () => {
  const workspace = repo("database-repo");
  const opencode = fake("database");
  const dataHome = path.join(temp, "database-xdg-data-home");
  const result = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(temp, "database-cache")],
    { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: "1", XDG_DATA_HOME: dataHome },
  );
  assert.equal(result.status, 0, result.stderr);
  const captured = parseCaptured(opencode.capture);
  assert.ok(path.isAbsolute(captured.env.OPENCODE_DB));
  assert.match(captured.env.OPENCODE_DB, /\/launches\/launch-[^/]+\/opencode\.db$/);
  assert.deepEqual(captured.databaseAbsentAtEntry, { db: true, wal: true, shm: true });
  assert.equal(captured.env.XDG_DATA_HOME, dataHome);
  assert.deepEqual(captured.databaseModes, { db: 0o600, "-wal": 0o600, "-shm": 0o600 });
  for (const suffix of ["", "-wal", "-shm"])
    assert.equal(fs.existsSync(`${captured.env.OPENCODE_DB}${suffix}`), false);
  assert.equal(fs.existsSync(path.dirname(captured.env.OPENCODE_DB)), false);
});

test("concurrent launches receive distinct database paths", async () => {
  const workspace = repo("database-concurrent-repo");
  const cache = path.join(temp, "database-concurrent-cache");
  assert.equal(run(["prepare", "--cache-root", cache]).status, 0);

  function launch(
    name: string,
  ): Promise<{ status: number | null; stderr: string; capture: string }> {
    const opencode = fake(name);
    const trace = path.join(temp, `${name}-trace`);
    fs.mkdirSync(trace, { mode: 0o700 });
    return new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [CLI, "run", "--workspace", workspace, "--cache-root", cache, "--trace-root", trace],
        {
          cwd: temp,
          env: { ...process.env, OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: "1" },
        },
      );
      let stderr = "";
      child.stderr.on("data", (bytes) => {
        stderr += bytes;
      });
      child.on("error", reject);
      child.on("close", (status) => resolve({ status, stderr, capture: opencode.capture }));
    });
  }

  const outcomes = await Promise.all([
    launch("database-concurrent-a"),
    launch("database-concurrent-b"),
  ]);
  for (const outcome of outcomes) assert.equal(outcome.status, 0, outcome.stderr);
  const databases = outcomes.map((outcome) => parseCaptured(outcome.capture).env.OPENCODE_DB);
  assert.equal(new Set(databases).size, 2);
  databases.forEach((database) => assert.equal(fs.existsSync(database), false));
});

test("ambient database state is rejected without changing parent database or auth", () => {
  const workspace = repo("database-ambient-repo");
  const opencode = fake("database-ambient");
  const home = path.join(temp, "database-ambient-home");
  fs.mkdirSync(home, { mode: 0o700 });
  const auth = path.join(home, "auth.json");
  fs.writeFileSync(auth, "auth-canary\n", { mode: 0o600 });
  const database = path.join(home, "parent.db");
  fs.writeFileSync(database, "db-canary\n", { mode: 0o600 });
  const result = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(temp, "database-ambient-cache")],
    { HOME: home, OPENCODE_BIN: opencode.executable, OPENCODE_DB: database },
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /refusing pre-set OPENCODE_DB/);
  assert.equal(fs.readFileSync(database, "utf8"), "db-canary\n");
  assert.equal(fs.readFileSync(auth, "utf8"), "auth-canary\n");
  assert.equal(fs.existsSync(opencode.capture), false);
});

test("explicit V2 native session database is validated without modifying it during failed activation", () => {
  const workspace = repo("native-session-db-repo");
  const directory = path.join(temp, "native-session-db-home", "opencode");
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  const database = path.join(directory, "opencode.db");
  fs.writeFileSync(database, "native-db-canary\n", { mode: 0o600 });
  const cache = path.join(temp, "native-session-db-cache");
  const args = [
    "run",
    "--workspace",
    workspace,
    "--cache-root",
    cache,
    "--native-session-db",
    database,
  ];
  const v1 = fake("native-session-db-v1");
  const deniedV1 = run(args, { OPENCODE_BIN: v1.executable });
  assert.notEqual(deniedV1.status, 0);
  assert.match(deniedV1.stderr, /requires a verified V2 native CLI contract/);
  const v2 = fake("native-session-db-v2", "opencode v2.1.4");
  fs.chmodSync(database, 0o644);
  const deniedMode = run(args, { OPENCODE_BIN: v2.executable });
  assert.notEqual(deniedMode.status, 0);
  assert.match(deniedMode.stderr, /expected 600/);
  fs.chmodSync(database, 0o600);
  const attempted = run(args, { OPENCODE_BIN: v2.executable });
  assert.notEqual(attempted.status, 0);
  assert.match(attempted.stderr, /V2 activation server did not report a bounded live endpoint/);
  assert.equal(fs.readFileSync(database, "utf8"), "native-db-canary\n");
});

test("database rejection quarantines and removes unexpected files, directories, and symlinks without touching external targets", () => {
  const workspace = repo("database-cleanup-repo");
  const target = path.join(temp, "database-symlink-target");
  fs.writeFileSync(target, "target-canary\n", { mode: 0o600 });
  const cases: [string, NodeJS.ProcessEnv, RegExp][] = [
    [
      "companion-symlink",
      { HARNESS_TEST_DB_SYMLINK: target },
      /not a current-user mode-0600 regular file/,
    ],
    [
      "main-db-symlink",
      { HARNESS_TEST_DB_SYMLINK: target, HARNESS_TEST_DB_SYMLINK_SUFFIX: "main" },
      /not a current-user mode-0600 regular file/,
    ],
    [
      "shm-symlink",
      { HARNESS_TEST_DB_SYMLINK: target, HARNESS_TEST_DB_SYMLINK_SUFFIX: "-shm" },
      /not a current-user mode-0600 regular file/,
    ],
    [
      "main-db-wrong-mode",
      { HARNESS_TEST_DB_WRONG_MODE: "main" },
      /not a current-user mode-0600 regular file/,
    ],
    [
      "wal-wrong-mode",
      { HARNESS_TEST_DB_WRONG_MODE: "-wal" },
      /not a current-user mode-0600 regular file/,
    ],
    [
      "shm-wrong-mode",
      { HARNESS_TEST_DB_WRONG_MODE: "-shm" },
      /not a current-user mode-0600 regular file/,
    ],
    ["unexpected-file", { HARNESS_TEST_DB_UNEXPECTED: "1" }, /unexpected entry/],
    ["unexpected-directory", { HARNESS_TEST_DB_UNEXPECTED_DIR: "1" }, /unexpected entry/],
    ["unexpected-symlink", { HARNESS_TEST_DB_UNEXPECTED_SYMLINK: target }, /unexpected entry/],
    [
      "expected-name-directory-confusion",
      { HARNESS_TEST_DB_CONFUSION: target },
      /not a current-user mode-0600 regular file/,
    ],
  ];
  for (const [name, fixture, expected] of cases) {
    const opencode = fake(`database-${name}`);
    const cache = path.join(temp, `database-${name}-cache`);
    const result = run(["run", "--workspace", workspace, "--cache-root", cache], {
      OPENCODE_BIN: opencode.executable,
      ...fixture,
    });
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    assert.match(result.stderr, /quarantined launch snapshot was safely removed/, name);
    const database = parseCaptured(opencode.capture).env.OPENCODE_DB;
    assert.equal(fs.existsSync(path.dirname(database)), false, name);
    assert.deepEqual(
      fs
        .readdirSync(path.dirname(path.dirname(database)))
        .filter((entry) => entry.startsWith(".quarantine-") || entry.startsWith("launch-")),
      [],
      name,
    );
    assert.equal(fs.readFileSync(target, "utf8"), "target-canary\n", name);
  }
});

test(
  "database rejection removes a special file without opening or following it",
  { skip: !mkfifoAvailable },
  () => {
    const workspace = repo("database-special-repo");
    const opencode = fake("database-special");
    const result = run(
      ["run", "--workspace", workspace, "--cache-root", path.join(temp, "database-special-cache")],
      { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_SPECIAL: "1" },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /unexpected entry.*quarantined launch snapshot was safely removed/);
    const database = parseCaptured(opencode.capture).env.OPENCODE_DB;
    assert.equal(fs.existsSync(path.dirname(database)), false);
  },
);

test("quarantine is retained only when contained cleanup itself fails", () => {
  const workspace = repo("database-quarantine-failure-repo");
  const opencode = fake("database-quarantine-failure");
  const result = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "database-quarantine-failure-cache"),
    ],
    {
      OPENCODE_BIN: opencode.executable,
      HARNESS_TEST_DB_UNEXPECTED_DIR: "1",
      OPENCODE_HARNESS_TESTING: "1",
      OPENCODE_HARNESS_TEST_QUARANTINE_CLEANUP_FAIL: "1",
    },
  );
  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /launch snapshot contains unexpected entry.*cleanup failure: quarantine recursive unlink failed: injected quarantine cleanup failure.*retained quarantine: \/.*\.quarantine-/,
  );
  const database = parseCaptured(opencode.capture).env.OPENCODE_DB;
  const launches = path.dirname(path.dirname(database));
  assert.equal(
    fs.existsSync(path.dirname(database)),
    false,
    "original launch name must be atomically removed",
  );
  assert.equal(
    fs.readdirSync(launches).filter((entry) => entry.startsWith(".quarantine-")).length,
    1,
  );
});

test("cleanup identity and containment injections never delete on parent, path, launch, or post-rename mismatch", () => {
  const workspace = repo("database-identity-guard-repo");
  const cases: [string, string, RegExp][] = [
    [
      "parent-swap",
      "OPENCODE_HARNESS_TEST_PARENT_SWAP",
      /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed: launch snapshots parent identity changed before quarantine; retained launch: \/.*\.swapped\/launch-/,
    ],
    [
      "path-confusion",
      "OPENCODE_HARNESS_TEST_PATH_CONFUSION",
      /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed:.*(?:dot-dot|ambiguity).*retained launch: \/.*\/launch-/,
    ],
    [
      "launch-replacement",
      "OPENCODE_HARNESS_TEST_LAUNCH_REPLACEMENT",
      /OpenCode child exited with status 23; cleanup failure: pre-quarantine guard failed: launch snapshot identity changed before quarantine; retained launch: \/.*\.replaced/,
    ],
    [
      "post-rename-mismatch",
      "OPENCODE_HARNESS_TEST_POST_RENAME_MISMATCH",
      /OpenCode child exited with status 23; launch snapshot contains unexpected entry: unexpected; cleanup failure: post-quarantine identity check failed: quarantine dev\/ino does not match.*retained quarantine: \/.*\.identity-mismatch/,
    ],
  ];
  for (const [name, injection, expected] of cases) {
    const opencode = fake(`database-identity-${name}`);
    const result = run(
      [
        "run",
        "--workspace",
        workspace,
        "--cache-root",
        path.join(temp, `database-identity-${name}-cache`),
      ],
      {
        OPENCODE_BIN: opencode.executable,
        HARNESS_TEST_DB_UNEXPECTED: "1",
        HARNESS_TEST_CHILD_FAIL: "1",
        OPENCODE_HARNESS_TESTING: "1",
        [injection]: "1",
      },
    );
    assert.notEqual(result.status, 0, name);
    assert.match(result.stderr, expected, name);
    const database = parseCaptured(opencode.capture).env.OPENCODE_DB;
    const launch = path.dirname(database);
    const parent = path.dirname(launch);
    if (name === "parent-swap")
      assert.equal(
        fs.readFileSync(
          path.join(`${parent}.swapped`, path.basename(launch), "unexpected"),
          "utf8",
        ),
        "unexpected",
      );
    else if (name === "launch-replacement")
      assert.equal(
        fs.readFileSync(path.join(`${launch}.replaced`, "unexpected"), "utf8"),
        "unexpected",
      );
    else if (name === "post-rename-mismatch") {
      const retained = fs
        .readdirSync(parent)
        .map((entry) => path.join(parent, entry))
        .find((entry) => entry.endsWith(".identity-mismatch"));
      assert.ok(retained);
      assert.equal(fs.readFileSync(path.join(retained, "unexpected"), "utf8"), "unexpected");
    } else assert.equal(fs.readFileSync(path.join(launch, "unexpected"), "utf8"), "unexpected");
  }
});

test("failed child status still removes database companions", () => {
  const workspace = repo("database-failed-child-repo");
  const opencode = fake("database-failed-child");
  const result = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "database-failed-child-cache"),
    ],
    { OPENCODE_BIN: opencode.executable, HARNESS_TEST_DB_FILES: "1", HARNESS_TEST_CHILD_FAIL: "1" },
  );
  assert.equal(result.status, 23, result.stderr);
  const database = parseCaptured(opencode.capture).env.OPENCODE_DB;
  assert.equal(fs.existsSync(path.dirname(database)), false);
});

test("executable selection rejects relative identities but permits older versions", () => {
  const workspace = repo("executable-repo");
  assert.match(
    run(["run", "--workspace", workspace, "--cache-root", path.join(temp, "relative-bin-cache")], {
      OPENCODE_BIN: "./opencode",
    }).stderr,
    /must be absolute/,
  );
  const mismatch = fake("mismatch", "1.0.0");
  const result = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(temp, "mismatch-cache")],
    { OPENCODE_BIN: mismatch.executable },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(mismatch.capture), true);
  const relativeDirectory = path.join(temp, "relative");
  fs.mkdirSync(relativeDirectory);
  fs.writeFileSync(path.join(relativeDirectory, "opencode"), "#!/bin/sh\nexit 0\n", {
    mode: 0o700,
  });
  const pathResult = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(temp, "relative-path-cache")],
    { OPENCODE_BIN: "", PATH: `relative${path.delimiter}/usr/bin${path.delimiter}/bin` },
  );
  assert.match(pathResult.stderr, /selected PATH entry.*absolute/);
});

test("lexical ancestry rejects intermediate symlink escapes for cache, trace, state, and snapshots before writes", () => {
  const workspace = repo("lexical-escape-repo");
  const opencode = fake("lexical-escape");
  const parent = path.join(temp, "lexical-parent");
  fs.mkdirSync(parent, { mode: 0o700 });
  const target = path.join(temp, "lexical-target");
  fs.mkdirSync(target, { mode: 0o700 });

  const cacheParent = path.join(parent, "cache");
  fs.mkdirSync(cacheParent, { mode: 0o700 });
  fs.symlinkSync(target, path.join(cacheParent, "link"));
  const cacheResult = run(["prepare", "--cache-root", `${cacheParent}/link/escaped-cache`]);
  assert.match(cacheResult.stderr, /symlink component/);
  assert.equal(fs.existsSync(path.join(target, "escaped-cache")), false);

  const traceParent = path.join(parent, "trace");
  fs.mkdirSync(traceParent, { mode: 0o700 });
  fs.symlinkSync(target, path.join(traceParent, "link"));
  const traceResult = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      path.join(parent, "safe-cache"),
      "--trace-root",
      `${traceParent}/link/escaped-trace`,
    ],
    { OPENCODE_BIN: opencode.executable },
  );
  assert.match(traceResult.stderr, /symlink component/);
  assert.equal(fs.existsSync(path.join(target, "escaped-trace")), false);

  const stateParent = path.join(parent, "state");
  fs.mkdirSync(stateParent, { mode: 0o700 });
  fs.symlinkSync(target, path.join(stateParent, "link"));
  const stateResult = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(parent, "state-cache")],
    { OPENCODE_BIN: opencode.executable, XDG_STATE_HOME: `${stateParent}/link/escaped-state` },
  );
  assert.match(stateResult.stderr, /symlink component/);
  assert.equal(fs.existsSync(path.join(target, "escaped-state")), false);

  const snapshotPrepared = prepare("snapshot-parent-escape-cache");
  const launches = path.join(path.dirname(snapshotPrepared.runtime), "launches");
  fs.symlinkSync(target, launches);
  const provider = writePrivate(path.join(temp, "snapshot-parent-provider.json"), validProvider());
  const snapshotResult = run(
    [
      "run",
      "--workspace",
      workspace,
      "--cache-root",
      snapshotPrepared.cache,
      "--provider-config",
      provider,
    ],
    { OPENCODE_BIN: opencode.executable },
  );
  assert.match(snapshotResult.stderr, /symlink component/);
  assert.equal(fs.readdirSync(target).length, 0);
});

test("lexical ambiguity and sticky-root creation fail while missing suffix below private child succeeds", () => {
  const variants = [
    `${temp}/../ambiguous`,
    `${temp}/./ambiguous`,
    `${temp}//ambiguous`,
    `${temp}/ambiguous/`,
  ];
  for (const candidate of variants) {
    const result = run(["prepare", "--cache-root", candidate]);
    assert.notEqual(result.status, 0, candidate);
    assert.match(result.stderr, /canonical|dot|separator|ambiguity/);
  }
  const direct = `/tmp/opencode-harness-direct-${process.pid}-${Date.now()}`;
  const directResult = run(["prepare", "--cache-root", direct]);
  assert.match(directResult.stderr, /already-existing private child/);
  assert.equal(fs.existsSync(direct), false);
  const accepted = path.join(temp, "accepted-missing/suffix/cache");
  const acceptedResult = run(["prepare", "--cache-root", accepted]);
  assert.equal(acceptedResult.status, 0, acceptedResult.stderr);
});

test("snapshot construction failure removes every partial launch directory", () => {
  const workspace = repo("snapshot-failure-repo");
  const opencode = fake("snapshot-failure");
  const provider = writePrivate(path.join(temp, "snapshot-failure-provider.json"), validProvider());
  const cache = path.join(temp, "snapshot-failure-cache");
  const result = run(
    ["run", "--workspace", workspace, "--cache-root", cache, "--provider-config", provider],
    {
      OPENCODE_BIN: opencode.executable,
      OPENCODE_HARNESS_TESTING: "1",
      OPENCODE_HARNESS_TEST_SNAPSHOT_FAIL_AFTER: "1",
    },
  );
  assert.match(result.stderr, /injected snapshot construction failure/);
  const launches = path.join(cache, "0.1.14/opencode-1.18.18/launches");
  assert.deepEqual(
    fs.readdirSync(launches).filter((name) => name.startsWith("launch-")),
    [],
  );
  assert.equal(fs.existsSync(opencode.capture), false);
});

test("PATH and explicit executable selection enforce trusted ownership, modes, ancestry, and post-probe bytes", (context) => {
  const workspace = repo("executable-trust-repo");
  fs.chmodSync(workspace, 0o700);
  fs.writeFileSync(path.join(workspace, ".gitignore"), ".memory/\n");
  const trusted = path.join(temp, "trusted-path");
  fs.mkdirSync(trusted, { mode: 0o700 });
  const source = fake("trusted-path-source");
  const pathExecutable = path.join(trusted, "opencode");
  fs.writeFileSync(
    pathExecutable,
    '#!/bin/sh\nif [ "$1" = "--version" ]; then printf "1.18.18\\n"; fi\nexit 0\n',
    { mode: 0o700 },
  );
  const unrelatedWritable = path.join(temp, "unrelated-later-path");
  fs.mkdirSync(unrelatedWritable);
  fs.chmodSync(unrelatedWritable, 0o777);
  const success = run(
    ["run", "--workspace", workspace, "--cache-root", path.join(temp, "trusted-path-cache")],
    {
      OPENCODE_BIN: "",
      PATH: `${trusted}${path.delimiter}/usr/bin${path.delimiter}/mnt/c/Windows/System32${path.delimiter}${unrelatedWritable}`,
    },
  );
  assert.equal(success.status, 0, success.stderr);

  const writableDirectory = path.join(temp, "writable-path");
  fs.mkdirSync(writableDirectory);
  fs.copyFileSync(source.executable, path.join(writableDirectory, "opencode"));
  fs.chmodSync(path.join(writableDirectory, "opencode"), 0o700);
  fs.chmodSync(writableDirectory, 0o777);
  assert.match(
    run(["run", "--workspace", workspace, "--cache-root", path.join(temp, "writable-path-cache")], {
      OPENCODE_BIN: "",
      PATH: `${writableDirectory}${path.delimiter}/usr/bin${path.delimiter}/bin`,
    }).stderr,
    /group\/world writable/,
  );

  const explicit = fake("writable-explicit");
  fs.chmodSync(explicit.executable, 0o722);
  assert.match(
    run(
      ["run", "--workspace", workspace, "--cache-root", path.join(temp, "writable-explicit-cache")],
      { OPENCODE_BIN: explicit.executable },
    ).stderr,
    /trusted non-writable/,
  );

  const mutating = path.join(temp, "mutating-opencode.mjs");
  fs.writeFileSync(
    mutating,
    "#!/usr/bin/env node\nimport fs from 'node:fs';\nif(process.argv[2]==='--version'){fs.appendFileSync(process.argv[1],'\\n//mutated');process.stdout.write('1.18.18\\n')}else fs.writeFileSync(process.env.HARNESS_MUTATION_CAPTURE,'launched');\n",
    { mode: 0o700 },
  );
  const mutationCapture = path.join(temp, "mutation-capture");
  assert.match(
    run(["run", "--workspace", workspace, "--cache-root", path.join(temp, "mutating-cache")], {
      OPENCODE_BIN: mutating,
      HARNESS_MUTATION_CAPTURE: mutationCapture,
    }).stderr,
    /identity changed/,
  );
  assert.equal(fs.existsSync(mutationCapture), false);

  const ownerProbe = fake("owner-probe");
  try {
    fs.chownSync(ownerProbe.executable, 65534, 65534);
  } catch {
    context.diagnostic("different-UID executable fixture skipped: unprivileged chown");
    return;
  }
  assert.match(
    run(["run", "--workspace", workspace, "--cache-root", path.join(temp, "owner-probe-cache")], {
      OPENCODE_BIN: ownerProbe.executable,
    }).stderr,
    /trusted non-writable|allowed-owner/,
  );
});

test("explicit executable option wins, reports exact selection, and preserves forwarding", () => {
  const selected = fake("cli-selected", "1.18.18");
  const unsupported = fake("cli-ambient", "1.18.34");
  const diagnosed = run(["doctor", "--opencode-bin", selected.executable], {
    OPENCODE_BIN: unsupported.executable,
  });
  assert.equal(diagnosed.status, 0, diagnosed.stderr);
  assert.deepEqual(JSON.parse(diagnosed.stdout), {
    executable: selected.executable,
    source: "--opencode-bin",
    version: "1.18.18",
    capabilityVerification: "runtime",
    ephemeral: true,
    resumable: false,
  });
  assert.equal(fs.existsSync(selected.capture), false, "doctor only probes version");
  const prepared = run(
    [
      "prepare",
      "--opencode-bin",
      selected.executable,
      "--cache-root",
      path.join(temp, "cli-selection-prepare"),
    ],
    { OPENCODE_BIN: unsupported.executable },
  );
  assert.equal(prepared.status, 0, prepared.stderr);
  assert.ok(fs.existsSync(prepared.stdout.trim()));
  const workspace = repo("cli-selection-workspace");
  const result = run(
    [
      "run",
      "--opencode-bin",
      selected.executable,
      "--workspace",
      workspace,
      "--cache-root",
      path.join(temp, "cli-selection-cache"),
      "--",
      "models",
      "test-provider",
    ],
    { OPENCODE_BIN: unsupported.executable },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(parseCaptured(selected.capture).argv, ["models", "test-provider"]);
  assert.equal(fs.existsSync(unsupported.capture), false);
});

test("doctor reports arbitrary versions and rejects missing or ambiguous executables", () => {
  for (const version of ["1.18.18", "1.18.25", "1.18.17", "1.18.26", "1.18.34"]) {
    const candidate = fake("doctor-" + version, version);
    const result = run(["doctor", "--opencode-bin", candidate.executable]);
    assert.equal(result.status === 0, true, result.stderr);
  }
  for (const args of [
    ["doctor", "--opencode-bin", path.join(temp, "missing-explicit")],
    ["doctor", "--opencode-bin", "./relative"],
    ["doctor", "--opencode-bin", ""],
    ["doctor", "--opencode-bin"],
    ["doctor", "--opencode-bin", "--cache-root"],
    ["doctor", "--opencode-bin", defaultOpenCode, "--opencode-bin", defaultOpenCode],
    ["doctor", "--cache-root", path.join(temp, "doctor-must-not-create")],
  ])
    assert.notEqual(run(args).status, 0, args.join(" "));
  assert.equal(fs.existsSync(path.join(temp, "doctor-must-not-create")), false);
});

test("environment wrapper selection survives forwarding and PATH preserves first executable regardless of version", () => {
  const selected = fake("wrapper-selected");
  const wrapper = path.join(temp, "selection-wrapper.sh");
  fs.writeFileSync(wrapper, '#!/bin/sh\nexec "$HARNESS_TEST_NODE" "$HARNESS_TEST_CLI" "$@"\n', {
    mode: 0o700,
  });
  const result = spawnSync(wrapper, ["doctor"], {
    encoding: "utf8",
    env: {
      ...process.env,
      HARNESS_TEST_NODE: process.execPath,
      HARNESS_TEST_CLI: CLI,
      OPENCODE_BIN: selected.executable,
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).source, "OPENCODE_BIN");
  const first = path.join(temp, "path-first");
  const second = path.join(temp, "path-second");
  for (const directory of [first, second]) fs.mkdirSync(directory, { mode: 0o700 });
  fs.writeFileSync(path.join(first, "opencode"), '#!/bin/sh\nprintf "1.18.34\\n"\n', {
    mode: 0o700,
  });
  fs.writeFileSync(path.join(second, "opencode"), '#!/bin/sh\nprintf "1.18.18\\n"\n', {
    mode: 0o700,
  });
  const rejected = run(["doctor"], { OPENCODE_BIN: "", PATH: first + ":" + second });
  assert.equal(rejected.status, 0, rejected.stderr);
  assert.equal(JSON.parse(rejected.stdout).version, "1.18.34");
  assert.match(rejected.stderr, /via PATH/);
});

test("changed bundled protocol upgrade, repeat and rollback preserve local seeds and evidence", () => {
  const packageRoot = path.join(temp, "upgrade-package");
  fs.mkdirSync(packageRoot, { mode: 0o700 });
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, ".opencode/runtime.manifest.json"), "utf8"),
  );
  for (const relative of [
    "bin/opencode-harness.mjs",
    ".opencode/runtime.manifest.json",
    ...manifest.files.map((entry: { source: string }) => entry.source),
  ]) {
    const target = path.join(packageRoot, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    fs.copyFileSync(path.join(ROOT, relative), target);
  }
  const workspace = repo("upgrade-workspace");
  const trace = path.join(temp, "upgrade-trace");
  const opencode = fake("upgrade-native");
  const launch = (cache: string) =>
    spawnSync(
      process.execPath,
      [
        path.join(packageRoot, "bin/opencode-harness.mjs"),
        "run",
        "--workspace",
        workspace,
        "--trace-root",
        trace,
        "--cache-root",
        path.join(temp, cache),
      ],
      { encoding: "utf8", env: { ...process.env, OPENCODE_BIN: opencode.executable } },
    );
  const first = launch("upgrade-old-cache");
  assert.equal(first.status, 0, first.stderr);
  const protocol = path.join(trace, "protocols/memory-management.md");
  const initial = fs.readFileSync(protocol, "utf8");
  const seed = path.join(packageRoot, ".opencode/bootstrap/memory/protocols/memory-management.md");
  fs.writeFileSync(seed, initial + "\nNew bundled protocol revision\n");
  const evidence = path.join(trace, "evidence.md");
  fs.writeFileSync(evidence, "existing evidence", { mode: 0o600 });
  for (const cache of ["upgrade-new-cache", "upgrade-new-cache"]) {
    const result = launch(cache);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(protocol, "utf8"), initial);
  }
  fs.writeFileSync(protocol, "user-edited protocol\n");
  assert.equal(launch("upgrade-new-cache").status, 0);
  fs.writeFileSync(seed, initial);
  const rollback = launch("upgrade-old-cache");
  assert.equal(rollback.status, 0, rollback.stderr);
  assert.equal(fs.readFileSync(protocol, "utf8"), "user-edited protocol\n");
  assert.equal(fs.readFileSync(evidence, "utf8"), "existing evidence");
});

test("unavailable version reporting is diagnostic, not a launch compatibility gate", () => {
  const executable = path.join(temp, "no-version-report");
  fs.writeFileSync(executable, '#!/bin/sh\nif [ "$1" = "--version" ]; then exit 64; fi\nexit 0\n', {
    mode: 0o700,
  });
  const result = run(["doctor", "--opencode-bin", executable]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(JSON.parse(result.stdout).version, /^unreported-[a-f0-9]{64}$/);
  assert.match(result.stderr, /version reporting unavailable/);
  const prepared = run([
    "prepare",
    "--opencode-bin",
    executable,
    "--cache-root",
    path.join(temp, "no-version-cache"),
  ]);
  assert.equal(prepared.status, 0, prepared.stderr);
});

test("web launch requires authentication and closes native exposure arguments", () => {
  const workspace = repo("web-workspace");
  const native = fake("web");
  const args = [
    "web",
    "--workspace",
    workspace,
    "--cache-root",
    path.join(temp, "web-cache"),
    "--trace-root",
    path.join(temp, "web-trace"),
    "--port",
    "4199",
  ];
  const env = {
    OPENCODE_BIN: native.executable,
    OPENCODE_SERVER_PASSWORD: "offline-fixture-not-a-real-credential",
  };
  const denied = run(args, { ...env, OPENCODE_SERVER_PASSWORD: "" });
  assert.notEqual(denied.status, 0);
  assert.match(denied.stderr, /owner-supplied/);
  for (const extra of [
    ["--", "--hostname", "0.0.0.0"],
    ["--hostname", "0.0.0.0"],
    ["--mdns"],
    ["--port", "4200"],
  ]) {
    assert.notEqual(run([...args, ...extra], env).status, 0);
  }
  const launched = run(args, env);
  assert.equal(launched.status, 0, launched.stderr);
  assert.deepEqual(parseCaptured(native.capture).argv, [
    "serve",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4199",
    "--mdns=false",
  ]);
  assert.equal(
    parseCaptured(native.capture).env.OPENCODE_SERVER_PASSWORD,
    env.OPENCODE_SERVER_PASSWORD,
  );
  assert.ok(!launched.stderr.includes(env.OPENCODE_SERVER_PASSWORD));
  const unguardedV2 = fake("web-v2-without-guard", "opencode v2.1.4");
  const refused = run(args, { ...env, OPENCODE_BIN: unguardedV2.executable });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /V2 activation server did not report a bounded live endpoint/);
  assert.equal(fs.existsSync(unguardedV2.capture), false);
});

test("run cannot bypass web authentication or binding through forwarded server commands", () => {
  const native = fake("web-bypass");
  const cache = path.join(temp, "web-bypass-cache");
  for (const forwarded of [
    ["serve"],
    ["web"],
    ["serve", "--hostname", "0.0.0.0"],
    ["web", "--mdns"],
    ["--print-logs", "serve", "--hostname=0.0.0.0"],
    ["--log-level", "DEBUG", "web", "--mdns=true"],
    ["--", "serve"],
  ]) {
    const result = run(["run", "--cache-root", cache, "--", ...forwarded], {
      OPENCODE_BIN: native.executable,
      OPENCODE_SERVER_PASSWORD: "",
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /run cannot forward server command tokens/);
    assert.equal(fs.existsSync(native.capture), false);
    assert.equal(fs.existsSync(cache), false);
  }
});

test("source-web validates its own source profile without external injection and preserves source configuration", () => {
  const source = repo("source-web-profile");
  const copy = (relative: string) => {
    const from = path.join(ROOT, relative),
      to = path.join(source, relative);
    fs.mkdirSync(path.dirname(to), { recursive: true, mode: 0o700 });
    fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true });
  };
  for (const relative of [
    "bin",
    ".opencode/src",
    ".opencode/scripts",
    ".opencode/plugin-modules",
    ".opencode/plugins",
    ".opencode/agents",
    ".opencode/commands",
    ".opencode/skills",
    ".opencode/contracts",
    ".opencode/schemas",
    ".opencode/bootstrap",
    ".opencode/harness.manifest.json",
    ".opencode/runtime.manifest.json",
    ".opencode/portable.manifest.json",
    "node_modules/typescript",
    "node_modules/@types/node",
    "node_modules/undici-types",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "AGENTS.md",
    "opencode.json",
    ".gitignore",
  ]) {
    if (fs.existsSync(path.join(ROOT, relative))) copy(relative);
  }
  // Source launch acceptance must not depend on ignored operator installation files.
  const dependencies = generatedNodeModulesFixture("source-profile-dependencies");
  for (const relative of ["package.json", "package-lock.json", "node_modules"]) {
    fs.cpSync(path.join(dependencies.runtime, relative), path.join(source, ".opencode", relative), {
      recursive: true,
      verbatimSymlinks: true,
    });
  }
  fs.writeFileSync(
    path.join(source, ".opencode/.gitignore"),
    "node_modules\npackage.json\npackage-lock.json\n",
  );
  const routing = path.join(source, ".opencode/routing");
  fs.mkdirSync(routing, { recursive: true });
  for (const name of fs.readdirSync(path.join(ROOT, ".opencode/routing")))
    if (name !== "harness-model-routing.json") copy(".opencode/routing/" + name);
  const portable = JSON.parse(
    fs.readFileSync(path.join(ROOT, ".opencode/portable.manifest.json"), "utf8"),
  );
  for (const relative of portable.managedFiles as string[])
    if (!fs.existsSync(path.join(source, relative))) copy(relative);
  fs.cpSync(path.join(ROOT, ".opencode/bootstrap/memory"), path.join(source, ".memory"), {
    recursive: true,
  });
  const privateRouting = path.join(routing, "harness-model-routing.json");
  fs.copyFileSync(path.join(routing, "harness-model-routing.example.json"), privateRouting);
  const preserved = [
    privateRouting,
    path.join(source, "opencode.json"),
    path.join(source, ".memory/protocols/memory-management.md"),
    path.join(source, ".opencode/package.json"),
    path.join(source, ".opencode/package-lock.json"),
  ].map((filename) => [filename, fs.readFileSync(filename, "utf8")] as const);
  const unguardedV2 = fake("source-v2-without-guard", "opencode v2.1.4");
  for (const mode of ["source-tui", "source-web"]) {
    const refused = spawnSync(
      process.execPath,
      [
        path.join(source, "bin/opencode-harness.mjs"),
        mode,
        "--cache-root",
        path.join(temp, "source-v2-refusal-cache"),
      ],
      {
        cwd: temp,
        encoding: "utf8",
        env: {
          ...process.env,
          OPENCODE_BIN: unguardedV2.executable,
          OPENCODE_SERVER_PASSWORD: "offline-fixture-not-a-real-credential",
        },
      },
    );
    assert.notEqual(refused.status, 0);
    assert.equal(fs.existsSync(unguardedV2.capture), false);
    assert.match(refused.stderr, /V2 (?:activation server|source web exposure)/);
  }
  const native = fake("source-web");
  const cache = path.join(temp, "source-web-cache");
  const invoke = (extra: string[] = [], env: NodeJS.ProcessEnv = {}) =>
    spawnSync(
      process.execPath,
      [
        path.join(source, "bin/opencode-harness.mjs"),
        "source-web",
        "--cache-root",
        cache,
        ...extra,
      ],
      {
        cwd: temp,
        encoding: "utf8",
        env: {
          ...process.env,
          OPENCODE_BIN: native.executable,
          OPENCODE_SERVER_PASSWORD: "offline-fixture-not-a-real-credential",
          ...env,
        },
      },
    );
  for (const extra of [
    ["--workspace", temp],
    ["--provider-config", "/unused"],
    ["--routing-catalog", "/unused"],
    ["--trace-root", "/unused"],
    ["--", "serve"],
    ["--hostname", "0.0.0.0"],
  ])
    assert.notEqual(invoke(extra).status, 0);
  assert.notEqual(invoke([], { OPENCODE_SERVER_PASSWORD: "" }).status, 0);
  assert.notEqual(invoke([], { OPENCODE_CONFIG_CONTENT: "{}" }).status, 0);
  const duplicate = path.join(source, ".opencode/plugins/duplicate.js");
  fs.writeFileSync(duplicate, "export default async()=>({})");
  assert.match(invoke().stderr, /exactly the source/);
  fs.unlinkSync(duplicate);
  const configPath = path.join(source, "opencode.json");
  const originalConfig = fs.readFileSync(configPath, "utf8");
  const instructionParent = path.join(source, "source-web-instructions");
  fs.mkdirSync(instructionParent, { mode: 0o700 });
  fs.writeFileSync(path.join(instructionParent, "guide.md"), "Fixture instruction.");
  const instructionAlias = path.join(source, "source-web-instruction-alias");
  fs.symlinkSync(instructionParent, instructionAlias, "dir");
  const withInstructions = (relative: string) =>
    fs.writeFileSync(
      configPath,
      JSON.stringify({ ...JSON.parse(originalConfig), instructions: [relative] }),
    );
  withInstructions("source-web-instruction-alias/guide.md");
  assert.match(invoke().stderr, /source instruction parent contains a non-directory or symlink/);
  fs.unlinkSync(instructionAlias);
  withInstructions("source-web-instructions/guide.md");
  for (const mode of [0o770, 0o707]) {
    fs.chmodSync(instructionParent, mode);
    assert.match(invoke().stderr, /source instruction parent component is group\/world writable/);
  }
  fs.chmodSync(instructionParent, 0o700);
  fs.writeFileSync(configPath, originalConfig);
  const protocols = path.join(source, ".memory/protocols");
  const heldProtocols = path.join(source, ".memory/protocols-held");
  const protocolMode = fs.statSync(protocols).mode & 0o777;
  fs.renameSync(protocols, heldProtocols);
  fs.symlinkSync(heldProtocols, protocols, "dir");
  assert.match(
    invoke().stderr,
    /source .*memory-management.md parent contains a non-directory or symlink/,
  );
  fs.unlinkSync(protocols);
  fs.renameSync(heldProtocols, protocols);
  for (const mode of [0o770, 0o707]) {
    fs.chmodSync(protocols, mode);
    assert.match(
      invoke().stderr,
      /source .*memory-management.md parent component is group\/world writable/,
    );
  }
  fs.chmodSync(protocols, protocolMode);
  const generated = path.join(source, ".opencode/plugin-modules/harness-lifecycle.js");
  const bytes = fs.readFileSync(generated);
  fs.appendFileSync(generated, "\n// stale fixture\n");
  assert.match(invoke().stderr, /preflight failed/);
  fs.writeFileSync(generated, bytes);
  const success = invoke([], { HARNESS_TEST_DB_FILES: "1" });
  assert.equal(success.status, 0, success.stderr);
  const captured = parseCaptured(native.capture);
  assert.equal(captured.cwd, source);
  assert.equal(captured.env.OPENCODE_HARNESS_WORKSPACE_ROOT, source);
  assert.equal(captured.env.OPENCODE_HARNESS_TRACE_ROOT, path.join(source, ".memory"));
  for (const key of [
    "OPENCODE_CONFIG_DIR",
    "OPENCODE_HARNESS_RUNTIME_ROOT",
    "OPENCODE_CONFIG",
    "OPENCODE_HARNESS_ROUTING_CATALOG",
    "OPENCODE_HARNESS_ROUTING_PROFILE",
  ])
    assert.equal(captured.env[key], undefined);
  assert.deepEqual(captured.argv, [
    "serve",
    "--hostname",
    "127.0.0.1",
    "--port",
    "4096",
    "--mdns=false",
  ]);
  assert.equal(fs.existsSync(path.dirname(captured.env.OPENCODE_DB)), false);
  for (const [filename, content] of preserved)
    assert.equal(fs.readFileSync(filename, "utf8"), content);
  const invokeTui = (extra: string[] = [], env: NodeJS.ProcessEnv = {}) =>
    spawnSync(
      process.execPath,
      [
        path.join(source, "bin/opencode-harness.mjs"),
        "source-tui",
        "--cache-root",
        cache,
        ...extra,
      ],
      {
        cwd: temp,
        encoding: "utf8",
        env: {
          ...process.env,
          OPENCODE_BIN: native.executable,
          OPENCODE_SERVER_PASSWORD: "",
          ...env,
        },
      },
    );
  for (const args of [
    ["--port", "4096"],
    ["--", "serve"],
    ["--workspace", temp],
    ["--provider-config", "/unused"],
  ])
    assert.notEqual(invokeTui(args).status, 0);
  const tui = invokeTui([], {
    HARNESS_TEST_DB_FILES: "1",
    OPENCODE_HARNESS_LOCAL_READINESS: "required",
  });
  assert.equal(tui.status, 0, tui.stderr);
  const tuiCapture = parseCaptured(native.capture);
  assert.deepEqual(tuiCapture.argv, []);
  assert.equal(tuiCapture.env.OPENCODE_HARNESS_LOCAL_READINESS, "required");
  assert.equal(tuiCapture.cwd, source);
  assert.equal(tuiCapture.env.OPENCODE_HARNESS_WORKSPACE_ROOT, source);
  assert.equal(tuiCapture.env.OPENCODE_HARNESS_TRACE_ROOT, path.join(source, ".memory"));
  assert.equal(tuiCapture.env.OPENCODE_CONFIG_DIR, undefined);
  assert.equal(tuiCapture.env.OPENCODE_HARNESS_RUNTIME_ROOT, undefined);
  assert.equal(fs.existsSync(path.dirname(tuiCapture.env.OPENCODE_DB)), false);
  for (const [filename, content] of preserved)
    assert.equal(fs.readFileSync(filename, "utf8"), content);
  const tuiFailure = invokeTui([], { HARNESS_TEST_CHILD_FAIL: "1", HARNESS_TEST_DB_FILES: "1" });
  assert.equal(tuiFailure.status, 23, tuiFailure.stderr);
  assert.equal(fs.existsSync(path.dirname(parseCaptured(native.capture).env.OPENCODE_DB)), false);
  const unified = spawnSync(
    process.execPath,
    [
      path.join(source, "bin/opencode-harness.mjs"),
      "run",
      "--workspace",
      source,
      "--cache-root",
      cache,
    ],
    { cwd: temp, encoding: "utf8", env: { ...process.env, OPENCODE_BIN: native.executable } },
  );
  assert.equal(unified.status, 0, unified.stderr);
  assert.equal(parseCaptured(native.capture).cwd, source);
  const nativeData = path.join(temp, "source-native-data");
  fs.mkdirSync(nativeData, { mode: 0o700 });
  const nativeDb = path.join(nativeData, "opencode.db");
  fs.writeFileSync(nativeDb, "source-native-db-canary\n", { mode: 0o600 });
  const persistentArgs = [
    path.join(source, "bin/opencode-harness.mjs"),
    "run",
    "--workspace",
    source,
    "--cache-root",
    cache,
    "--native-session-db",
    nativeDb,
  ];
  const rejectedV1 = spawnSync(process.execPath, persistentArgs, {
    cwd: temp,
    encoding: "utf8",
    env: { ...process.env, OPENCODE_BIN: native.executable },
  });
  assert.notEqual(rejectedV1.status, 0);
  assert.match(rejectedV1.stderr, /requires a verified V2 native CLI contract/);
  const rejectedV2 = spawnSync(process.execPath, persistentArgs, {
    cwd: temp,
    encoding: "utf8",
    env: { ...process.env, OPENCODE_BIN: unguardedV2.executable },
  });
  assert.notEqual(rejectedV2.status, 0);
  assert.match(rejectedV2.stderr, /V2 activation server/);
  assert.equal(fs.readFileSync(nativeDb, "utf8"), "source-native-db-canary\n");
  const failure = invoke([], { HARNESS_TEST_CHILD_FAIL: "1", HARNESS_TEST_DB_FILES: "1" });
  assert.equal(failure.status, 23, failure.stderr);
  assert.equal(fs.existsSync(path.dirname(parseCaptured(native.capture).env.OPENCODE_DB)), false);
});
