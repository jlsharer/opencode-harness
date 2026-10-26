// Source-only V2.1.4 fixture preflight. No native execution until fresh-server
// isolation and active-state observation are independently established.
import { createHash } from "node:crypto";
import {
  constants,
  closeSync,
  fstatSync,
  lstatSync,
  openSync,
  readSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const FIXTURE_ID = "harness-native-v2-setup-fixture";
export const FIXTURE_SOURCE = `import { Plugin } from "@opencode/plugin";

export default Plugin.define({
  id: "harness-native-v2-setup-fixture",
  async setup(context) {
    await context.tool.hook("execute.before", (event) => {
      if (event.tool === "subagent") throw new Error("HARNESS_V2_FIXTURE_REFUSAL");
    });
  },
});
`;

export function parseArgs(args: string[]) {
  if (
    args.length !== 6 ||
    args[0] !== "--binary" ||
    args[2] !== "--sha256" ||
    args[4] !== "--scratch-parent"
  )
    throw Error("expected --binary ABS --sha256 HEX --scratch-parent ABS");
  const binary = args[1]!;
  const sha256 = args[3]!;
  const scratchParent = args[5]!;
  if (!/^[0-9a-f]{64}$/.test(sha256)) throw Error("expected exact lowercase SHA-256");
  return { binary, sha256, scratchParent };
}

function canonical(value: string) {
  if (
    !isAbsolute(value) ||
    value !== resolve(value) ||
    value.includes("//") ||
    value.includes("\0") ||
    (value !== "/" && value.endsWith("/"))
  )
    throw Error("noncanonical absolute path");
  let part = "/";
  for (const name of value.split("/").filter(Boolean)) {
    part = join(part, name);
    if (lstatSync(part).isSymbolicLink()) throw Error("symlink component");
  }
  if (realpathSync(value) !== value) throw Error("noncanonical target");
  return value;
}

function ownerPrivateDirectory(value: string) {
  const stat = lstatSync(canonical(value));
  if (
    !stat.isDirectory() ||
    stat.uid !== process.getuid?.() ||
    (stat.mode & 0o077) !== 0 ||
    (stat.mode & 0o700) !== 0o700
  )
    throw Error("scratch parent must be current-user mode-0700");
}

function binaryDigest(value: string) {
  const stat = lstatSync(canonical(value), { bigint: true });
  if (
    !stat.isFile() ||
    stat.uid !== BigInt(process.getuid!()) ||
    (stat.mode & 0o022n) !== 0n ||
    (stat.mode & 0o111n) === 0n ||
    stat.nlink !== 1n
  )
    throw Error("untrusted selected executable");
  const fd = openSync(value, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const opened = fstatSync(fd, { bigint: true });
    if (opened.dev !== stat.dev || opened.ino !== stat.ino || opened.mode !== stat.mode)
      throw Error("executable identity changed");
    const digest = createHash("sha256");
    const buffer = Buffer.alloc(65536);
    let count: number;
    while ((count = readSync(fd, buffer, 0, buffer.length, null)) !== 0)
      digest.update(buffer.subarray(0, count));
    const after = lstatSync(value, { bigint: true });
    if (
      after.dev !== stat.dev ||
      after.ino !== stat.ino ||
      after.mode !== stat.mode ||
      after.size !== stat.size ||
      after.mtimeNs !== stat.mtimeNs
    )
      throw Error("executable changed during preflight");
    return digest.digest("hex");
  } finally {
    closeSync(fd);
  }
}

function rejectAmbient(env: NodeJS.ProcessEnv) {
  for (const name of Object.keys(env)) {
    if (
      /^(?:OPENCODE|OPENAI|ANTHROPIC|GOOGLE_API|GEMINI|AZURE_OPENAI|AWS_|GCP_|XDG_|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|npm_config_)/i.test(
        name,
      )
    )
      throw Error("ambient native state, endpoint, or credential variable is unsupported");
  }
}

export function preflight(args: string[], env: NodeJS.ProcessEnv = process.env) {
  if (process.platform !== "linux" || Number(process.versions.node.split(".")[0]) !== 24)
    throw Error("operator-only Linux/Node 24 preflight");
  rejectAmbient(env);
  const { binary, sha256, scratchParent } = parseArgs(args);
  ownerPrivateDirectory(scratchParent);
  const actual = binaryDigest(binary);
  if (actual !== sha256) throw Error("selected executable digest mismatch");
  return Object.freeze({
    provenance: "external-operator-offline-preflight",
    acceptanceProof: false,
    stage: "inventory-only/inconclusive",
    selectedBinarySha256: actual,
    reportedVersion: null,
    fixtureId: FIXTURE_ID,
    fixtureSource: ".opencode/plugins/index.js (disposable root only; not created)",
    nativeSpawn: false,
    pluginInventory: false,
    setupActivation: false,
    hookFiring: false,
    worktreeUnchanged: "not measured",
    scratchCleanup: "not created",
    reason:
      "No source-backed proof of fresh isolated native server or active-state endpoint; native CLI deliberately not launched",
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    process.stdout.write(JSON.stringify(preflight(process.argv.slice(2))) + "\n");
    process.exitCode = 2; // Inconclusive is never a successful native gate.
  } catch {
    process.stderr.write("V2 fixture preflight refused; no native process launched\n");
    process.exitCode = 2;
  }
}
