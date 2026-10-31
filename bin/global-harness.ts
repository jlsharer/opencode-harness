import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  TASK_MODES,
  TASK_REFERENCE_FIELDS,
  taskContractShape,
} from "../.opencode/src/plugin-modules/task-contracts.ts";
import type { TaskThreadRole } from "../.opencode/src/plugin-modules/task-thread-policy.ts";

interface Asset {
  source: string;
  release: string;
  discovery?: string;
  kind: string;
}
interface Manifest {
  version: 1;
  profile: string;
  protocolVersion: string;
  assets: Asset[];
}
interface Owned {
  path: string;
  sha256: string;
  bytes: string;
}
interface Installation {
  version: 1;
  release: string;
  owned: Owned[];
  prior: Installation | null;
}
interface Journal {
  before: Installation | null;
  after: Installation | null;
  writes: { path: string; before: string | null; after: string | null }[];
}
export interface GlobalOptions {
  packageRoot?: string;
  configRoot?: string;
  stateRoot?: string;
  apply?: boolean;
  workspaceRoot?: string;
}

const hash = (bytes: string | Buffer) => createHash("sha256").update(bytes).digest("hex");

function relative(value: string) {
  if (
    !value ||
    path.isAbsolute(value) ||
    value.includes("\\") ||
    value.split("/").some((p) => !p || p === "." || p === "..")
  )
    throw new Error("unsafe manifest path");
  return value;
}

function exists(filename: string): boolean {
  try {
    fs.lstatSync(filename);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function absolute(value: string) {
  if (
    !path.isAbsolute(value) ||
    path.resolve(value) !== value ||
    value === "/" ||
    value.includes("\0") ||
    value.includes("//")
  )
    throw new Error("canonical absolute root required");
  let current = path.parse(value).root;
  for (const part of value.slice(current.length).split(path.sep)) {
    current = path.join(current, part);
    if (!exists(current)) continue;
    if (fs.lstatSync(current).isSymbolicLink())
      throw new Error("symlink root component: " + current);
  }
  return value;
}

function read(filename: string): Buffer {
  absolute(filename);
  const fd = fs.openSync(filename, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const stat = fs.fstatSync(fd);
    if (!stat.isFile()) throw new Error("regular asset required");
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    if (stat.ino !== after.ino || stat.size !== after.size || stat.mtimeMs !== after.mtimeMs)
      throw new Error("asset changed during read");
    return bytes;
  } finally {
    fs.closeSync(fd);
  }
}

function atomic(filename: string, bytes: string | Buffer) {
  absolute(filename);
  fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const temp = filename + ".harness-" + randomUUID();
  fs.writeFileSync(temp, bytes, { mode: 0o600, flag: "wx" });
  fs.renameSync(temp, filename);
}

function ownedState(root: string) {
  absolute(root);
  if (!exists(root)) fs.mkdirSync(root, { recursive: true, mode: 0o700 });
  const stat = fs.lstatSync(root);
  if (!stat.isDirectory() || stat.uid !== process.getuid?.() || stat.mode & 0o077)
    throw new Error("harness state must be private and current-user-owned");
}

export function globalManifest(root: string): Manifest {
  const value = JSON.parse(
    read(path.join(root, ".opencode/global.manifest.json")).toString(),
  ) as Manifest;
  if (
    value.version !== 1 ||
    value.profile !== "global-native" ||
    value.protocolVersion !== "1.0.0" ||
    !Array.isArray(value.assets) ||
    !value.assets.length
  )
    throw new Error("invalid global manifest");
  const sources = new Set<string>();
  const releases = new Set<string>();
  const discoveries = new Set<string>();
  for (const asset of value.assets) {
    relative(asset.source);
    relative(asset.release);
    if (
      sources.has(asset.source) ||
      releases.has(asset.release) ||
      !asset.kind ||
      /harness-model-routing\.json$/.test(asset.source)
    )
      throw new Error("duplicate/private global asset");
    sources.add(asset.source);
    releases.add(asset.release);
    if (asset.discovery) {
      relative(asset.discovery);
      if (
        !/^(agents|commands|skills|plugins)\//.test(asset.discovery) ||
        discoveries.has(asset.discovery)
      )
        throw new Error("invalid discovery asset");
      discoveries.add(asset.discovery);
    }
  }
  return value;
}

function contractGuide(role?: TaskThreadRole): string {
  const shapes = role
    ? { [role]: taskContractShape(role) }
    : Object.fromEntries(
        (Object.keys(TASK_MODES) as TaskThreadRole[]).map((name) => [
          name,
          taskContractShape(name),
        ]),
      );
  return `\n\n## Machine-enforced task field types\n\nThese types are generated from the validator. Strings and list entries must be nonempty. Lists contain 1–32 strings; do not wrap a string field such as downstreamNeeds in a list. Optional fields must have the declared type when present. For success, outputContract contains the requiredSuccessOutput fields below and only the listed optionalSuccessOutput fields.\n\n\`\`\`json\n${JSON.stringify(shapes, null, 2)}\n\`\`\`\n\nBoth evidence and artifacts are arrays of objects. Each item requires a nonempty string reference. The only allowed keys are ${TASK_REFERENCE_FIELDS.join(", ")}. Use {"reference":"/absolute/path/to/source-or-artifact"} for a read or artifact; path and summary are not item keys. Put explanatory prose in the result summary or role outputContract. Optional sha256 is 64 lowercase hexadecimal characters. command and observed integer exitCode must appear together; omit both for non-command evidence. Do not claim commands ran when they did not. Success requires at least one evidence item and one artifact item; outputContract.traceArtifactPath must equal an artifacts[].reference exactly. Example: {"evidence":[{"reference":"research.md"}],"artifacts":[{"reference":"plan.md"}],"outputContract":{"traceArtifactPath":"plan.md"}} shows the reference shape only; include every other required TaskResult and role output field.\n`;
}

function project(asset: Asset, bytes: Buffer, release: string): Buffer {
  if (!asset.discovery) return bytes;
  let text = bytes.toString();
  if (asset.discovery.startsWith("agents/")) {
    const sourceBody = text.replace(/^---\n[\s\S]*?\n---\n/, "");
    const body = sourceBody
      .split(
        /\n(?:Use `rea_inspect_pe_imports`|For an explicitly authorized static PE inspection|Dispatch boundary:|## Memory and Contract Requirements)/,
      )[0]!
      .trim();
    const role = path.basename(asset.discovery, ".md") as TaskThreadRole;
    text = `---\ndescription: Global harness ${role}\nmode: subagent\npermissions:\n  - action: subagent\n    resource: '*'\n    effect: deny\n  - action: skill\n    resource: delegation-orchestrator\n    effect: deny\n---\n${body}\n\nGlobal native profile: ordinary tools use native host policy. Role scope is a task contract, not a shell sandbox. Do not delegate or invoke the orchestrator skill. Accept only the correlated version-1 role packet supplied by the admitted parent, dispatched through the native subagent tool or a validated role command. An admitted native subagent packet is sufficient; routingMetadataStatus absent is valid and does not require routing metadata or a separate command-route token. A direct primary role session or incomplete packet confers no managed authorization.\n\nRead immutable role input/output fields from .opencode/contracts/role-io-contracts.json and schemas from .opencode/schemas/. Use workspaceRoot and external traceRoot supplied by the admitted parent; do not create project memory implicitly. Write or reference your Markdown role artifact beneath the supplied traceRoot in roles/${role}/<artifact-id>.md, following the installed memory templates. Native read/edit/write/shell remain available under host policy; there is no harness_trace requirement.\n\nReturn one flat JSON TaskResult with version 1, exact orchestrationId/delegationTaskId/scopeKey/role/taskMode, outcome, summary, evidence, artifacts and the role-specific outputContract for success. Each evidence reference may include command/exitCode and SHA-256; report only commands actually run. outputContract.traceArtifactPath exactly matches an artifacts reference. Success requires the complete contract and evidence. Clarification uses outcome clarification, requestNonce and question with empty evidence/artifacts when unavailable; a parent may answer once per correlated nonce. Never claim acceptance from progress, traces or your own implementation report. No legacy activation, stopped-run, Bubblewrap, exact-shell allowlist or automatic artifact-hash verification is implied by this profile.\n`;
    text += contractGuide(role);
  } else if (asset.discovery.startsWith("commands/")) {
    const name = path.basename(asset.discovery, ".md");
    text = `---\ndescription: Global ${name} protocol command\n---\nThe global plugin registers this command's native executor. Supply an exact version-1 protocol action (${name === "delegate-orchestration" ? "orchestration.admit, orchestration.accept or task.cancel" : "fresh role envelope"}). Ordinary conversation does not confer managed authorization.\n`;
  } else if (asset.discovery.endsWith("SKILL.md")) {
    text = text.replace(
      /^(---\n[\s\S]*?\n---\n)/,
      "$1\nGlobal native profile: assets live at " +
        release +
        ". Native host policy controls ordinary tools. Legacy launcher, broad stop and recovery guard requirements in historical references apply only to legacy profiles. Managed authorization uses the harness_orchestration tool and admitted native subagent packets; validated role command executors are an alternative.\n",
    );
  }
  if (asset.discovery === "skills/delegation-orchestrator/SKILL.md") text += contractGuide();
  text = text
    .replaceAll(".opencode/", path.join(release, ".opencode/"))
    .replaceAll(".memory/", path.join(release, ".memory/"));
  return Buffer.from(text);
}

export function globalOperation(command: string, options: GlobalOptions = {}) {
  if (
    ![
      "prepare",
      "install",
      "doctor",
      "rollback",
      "uninstall",
      "migrate-project",
      "restore-project",
    ].includes(command)
  )
    throw new Error("unknown global command");
  const packageRoot = absolute(
    options.packageRoot ?? path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  );
  const configRoot = absolute(
    options.configRoot ??
      path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"), "opencode"),
  );
  const stateRoot = absolute(
    options.stateRoot ??
      path.join(
        process.env.XDG_STATE_HOME ?? path.join(os.homedir(), ".local/state"),
        "opencode-harness/global",
      ),
  );
  const workspace = absolute(options.workspaceRoot ?? process.cwd());
  const projectEntry = path.join(workspace, ".opencode/plugins/index.js");
  const disabledEntry =
    '// Harness legacy entry disabled by explicit global profile migration.\nexport default { id: "opencode-harness.legacy-disabled", setup() {} };\n';
  const migrationRecord = path.join(stateRoot, "project-" + hash(workspace).slice(0, 20) + ".json");
  if (command === "migrate-project" || command === "restore-project") {
    const restoring = command === "restore-project";
    if (!options.workspaceRoot) throw new Error("project migration requires explicit --workspace");
    const current = read(projectEntry);
    if (restoring) {
      const saved = JSON.parse(read(migrationRecord).toString()) as {
        workspace: string;
        bytes: string;
        sha256: string;
      };
      if (
        saved.workspace !== workspace ||
        hash(Buffer.from(saved.bytes, "base64")) !== saved.sha256 ||
        current.toString() !== disabledEntry
      )
        throw new Error("project migration record or disabled entry was modified");
      if (options.apply) {
        atomic(projectEntry, Buffer.from(saved.bytes, "base64"));
        fs.unlinkSync(migrationRecord);
      }
    } else {
      const exact = read(path.join(packageRoot, ".opencode/plugins/index.js"));
      if (!current.equals(exact))
        throw new Error(
          "project entry differs from the exact packaged legacy harness; review it manually",
        );
      if (exists(migrationRecord)) throw new Error("project migration already recorded");
      if (options.apply) {
        ownedState(stateRoot);
        atomic(
          migrationRecord,
          JSON.stringify({ workspace, bytes: current.toString("base64"), sha256: hash(current) }),
        );
        atomic(projectEntry, disabledEntry);
      }
    }
    return {
      operation: command,
      dryRun: !options.apply,
      projectEntry,
      preservesOtherProjectAssets: true,
    };
  }
  const recordPath = path.join(stateRoot, "installation.json");
  const journalPath = path.join(stateRoot, "activation.json");
  const loadRecord = (): Installation | null =>
    exists(recordPath) ? (JSON.parse(read(recordPath).toString()) as Installation) : null;

  function verifyOwned(record: Installation | null) {
    if (!record) return;
    if (record.version !== 1 || !record.release.startsWith(stateRoot + "/releases/"))
      throw new Error("invalid installation record");
    for (const item of record.owned) {
      relative(item.path);
      if (hash(Buffer.from(item.bytes, "base64")) !== item.sha256)
        throw new Error("corrupt owned record");
      const target = path.join(configRoot, item.path);
      if (!exists(target) || hash(read(target)) !== item.sha256)
        throw new Error("modified or missing owned discovery file: " + target);
    }
  }

  function applyJournal(journal: Journal) {
    ownedState(stateRoot);
    atomic(journalPath, JSON.stringify(journal));
    for (const entry of journal.writes) {
      const target = path.join(configRoot, relative(entry.path));
      if (entry.after === null) fs.unlinkSync(target);
      else atomic(target, Buffer.from(entry.after, "base64"));
    }
    if (journal.after) atomic(recordPath, JSON.stringify(journal.after));
    else if (exists(recordPath)) fs.unlinkSync(recordPath);
    fs.unlinkSync(journalPath);
  }

  // Recovery is explicit through --apply. Dry runs are read-only even after interruption.
  if (exists(journalPath)) {
    if (!options.apply)
      throw new Error(
        "interrupted activation retained; repeat with --apply to recover before retry",
      );
    const journal = JSON.parse(read(journalPath).toString()) as Journal;
    for (const entry of journal.writes) {
      const target = path.join(configRoot, relative(entry.path));
      const current = exists(target) ? read(target).toString("base64") : null;
      if (current !== entry.before && current !== entry.after)
        throw new Error("interrupted activation conflicts with user edits: " + target);
    }
    for (const entry of journal.writes) {
      const target = path.join(configRoot, entry.path);
      if (entry.before === null) {
        if (exists(target)) fs.unlinkSync(target);
      } else atomic(target, Buffer.from(entry.before, "base64"));
    }
    if (journal.before) atomic(recordPath, JSON.stringify(journal.before));
    else if (exists(recordPath)) fs.unlinkSync(recordPath);
    fs.unlinkSync(journalPath);
  }
  const previous = loadRecord();
  verifyOwned(previous);
  const manifest = globalManifest(packageRoot);
  const assets = manifest.assets.map((asset) => ({
    asset,
    bytes: read(path.join(packageRoot, asset.source)),
  }));
  const identity = hash(
    JSON.stringify(assets.map(({ asset, bytes }) => [asset.release, hash(bytes)])),
  ).slice(0, 20);
  const version = (
    JSON.parse(read(path.join(packageRoot, "package.json")).toString()) as { version: string }
  ).version;
  const release = path.join(stateRoot, "releases", version + "-" + identity);

  function verifyRelease(target: string) {
    const inventory = JSON.parse(read(path.join(target, "release.json")).toString()) as {
      path: string;
      sha256: string;
    }[];
    const expected = new Set(inventory.map((item) => relative(item.path)));
    const walk = (root: string, prefix = "") => {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        const name = prefix + entry.name;
        const full = path.join(root, entry.name);
        if (entry.isDirectory()) walk(full, name + "/");
        else if (!entry.isFile() || (name !== "release.json" && !expected.has(name)))
          throw new Error("unexpected release leaf: " + name);
      }
    };
    walk(target);
    for (const item of inventory)
      if (hash(read(path.join(target, item.path))) !== item.sha256)
        throw new Error("modified release asset: " + item.path);
  }

  if (command === "doctor") {
    if (previous) verifyRelease(previous.release);
    return {
      profile: "global-native",
      installed: !!previous,
      activeRelease: previous?.release ?? null,
      protocolVersion: manifest.protocolVersion,
      nativeSourceCommit: "68bc26b7da1990ce10ffecfbc1e09eb13aa5d824",
      managedCapability: "requires pinned-compatible Promise API and native fixture verification",
      foreground: true,
      background: false,
      configRoot,
      stateRoot,
      modifiesNativeConfig: false,
      projectEntry,
      projectCollision:
        exists(projectEntry) &&
        /harness-lifecycle|v2-native-plugin|HarnessPlugin/.test(read(projectEntry).toString())
          ? projectEntry
          : null,
    };
  }
  if (["prepare", "install"].includes(command) && options.apply) {
    ownedState(stateRoot);
    if (exists(release)) verifyRelease(release);
    else {
      const staging = path.join(stateRoot, "staging-" + randomUUID());
      fs.mkdirSync(staging, { mode: 0o700 });
      const inventory: { path: string; sha256: string }[] = [];
      try {
        for (const { asset, bytes } of assets) {
          const projected = project(asset, bytes, release);
          const target = path.join(staging, asset.release);
          fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
          fs.writeFileSync(target, projected, { mode: 0o400, flag: "wx" });
          inventory.push({ path: asset.release, sha256: hash(projected) });
        }
        fs.writeFileSync(path.join(staging, "release.json"), JSON.stringify(inventory), {
          mode: 0o400,
          flag: "wx",
        });
        verifyRelease(staging);
        fs.mkdirSync(path.dirname(release), { recursive: true, mode: 0o700 });
        fs.renameSync(staging, release);
      } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
      }
    }
  }
  if (command === "prepare")
    return { profile: "global-native", dryRun: !options.apply, release, assetCount: assets.length };
  let next: Installation | null;
  if (command === "uninstall") next = null;
  else if (command === "rollback") {
    if (!previous?.prior) throw new Error("no prior harness release");
    verifyRelease(previous.prior.release);
    next = { ...previous.prior, prior: { ...previous, prior: null } };
  } else {
    const owned: Owned[] = assets
      .filter(({ asset }) => asset.discovery)
      .map(({ asset, bytes }) => {
        const projected = project(asset, bytes, release);
        return {
          path: asset.discovery!,
          sha256: hash(projected),
          bytes: projected.toString("base64"),
        };
      });
    const entry = `export { default } from ${JSON.stringify(pathToFileURL(path.join(release, ".opencode/plugin-modules/global-native-plugin.js")).href)};\n`;
    owned.push({
      path: "plugins/opencode-harness-global.js",
      sha256: hash(entry),
      bytes: Buffer.from(entry).toString("base64"),
    });
    next = {
      version: 1,
      release,
      owned,
      prior: previous?.release === release ? previous.prior : previous,
    };
  }
  const paths = new Set([
    ...(previous?.owned.map((v) => v.path) ?? []),
    ...(next?.owned.map((v) => v.path) ?? []),
  ]);
  const writes = [...paths]
    .map((name) => {
      const before = previous?.owned.find((v) => v.path === name)?.bytes ?? null;
      const after = next?.owned.find((v) => v.path === name)?.bytes ?? null;
      if (before === null && exists(path.join(configRoot, name)))
        throw new Error("unowned discovery collision: " + path.join(configRoot, name));
      return { path: name, before, after };
    })
    .filter((v) => v.before !== v.after);
  if (options.apply) applyJournal({ before: previous, after: next, writes });
  return {
    profile: "global-native",
    dryRun: !options.apply,
    operation: command,
    release: next?.release ?? null,
    changes: writes.map(({ path: name, before, after }) => ({
      path: path.join(configRoot, name),
      action: after === null ? "remove" : before === null ? "create" : "replace",
    })),
  };
}

export function globalMain(args: string[]) {
  const [command, ...rest] = args;
  const options: GlobalOptions = {};
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    if (arg === "--apply") {
      if (options.apply) throw new Error("duplicate --apply");
      options.apply = true;
    } else if (["--config-root", "--state-root", "--workspace"].includes(arg ?? "")) {
      const value = rest[++i];
      if (!value) throw new Error("missing global option value");
      const name =
        arg === "--config-root"
          ? "configRoot"
          : arg === "--workspace"
            ? "workspaceRoot"
            : "stateRoot";
      if (options[name]) throw new Error("duplicate global root");
      options[name] = value;
    } else throw new Error("unsupported global option: " + arg);
  }
  return globalOperation(command ?? "doctor", options);
}
