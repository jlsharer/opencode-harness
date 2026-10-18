import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface TaskFixture {
  id: string;
  category: string;
  prompt: string;
  files: Record<string, string>;
}
interface FixtureCatalog {
  version: number;
  tasks: TaskFixture[];
}

const defaultCatalog = new URL("../evaluation/paired-tasks.json", import.meta.url);

export function prepareBenchmark(
  output: string,
  catalogPath: string | URL = defaultCatalog,
): { output: string; runs: number } {
  if (
    !path.isAbsolute(output) ||
    path.resolve(output) !== output ||
    output === path.parse(output).root
  )
    throw new Error("--output must be a canonical absolute new directory");
  const parent = path.dirname(output);
  if (realpathSync(parent) !== parent || !lstatSync(parent).isDirectory())
    throw new Error("output parent must exist and be canonical");
  let ancestor = path.parse(parent).root;
  for (const piece of parent.slice(ancestor.length).split(path.sep).filter(Boolean)) {
    ancestor = path.join(ancestor, piece);
    if (lstatSync(ancestor).isSymbolicLink())
      throw new Error("symlink output ancestry is unsupported");
  }
  if (existsSync(output)) throw new Error("output already exists; refusing overwrite");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as FixtureCatalog;
  if (catalog.version !== 1 || !Array.isArray(catalog.tasks) || catalog.tasks.length !== 10)
    throw new Error("expected version 1 catalog with ten tasks");
  const ids = new Set<string>();
  for (const task of catalog.tasks) {
    if (
      !/^[a-z0-9-]+$/.test(task.id) ||
      ids.has(task.id) ||
      typeof task.prompt !== "string" ||
      !task.prompt.trim() ||
      !task.files["acceptance.test.mjs"]
    )
      throw new Error("invalid task fixture");
    ids.add(task.id);
    for (const [name, contents] of Object.entries(task.files)) {
      if (
        typeof contents !== "string" ||
        path.isAbsolute(name) ||
        name.includes("\\") ||
        name.includes("\0") ||
        name.split("/").some((p) => !p || p === "." || p === ".." || p === ".git")
      )
        throw new Error("unsafe task fixture file");
    }
  }
  mkdirSync(output, { mode: 0o700 });
  const runs: Record<string, unknown>[] = [];
  for (const task of catalog.tasks) {
    const startHash = createHash("sha256")
      .update(JSON.stringify(Object.entries(task.files).sort(([a], [b]) => a.localeCompare(b))))
      .digest("hex");
    for (const arm of ["thin", "refined"] as const)
      for (let repeat = 1; repeat <= 3; repeat++) {
        const relative = `${task.id}/${arm}/${repeat}`;
        const dir = path.join(output, relative);
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        for (const [name, contents] of Object.entries(task.files)) {
          const destination = path.join(dir, name);
          mkdirSync(path.dirname(destination), { recursive: true, mode: 0o700 });
          writeFileSync(destination, contents, { flag: "wx", mode: 0o600 });
        }
        writeFileSync(path.join(dir, "TASK.txt"), task.prompt, { flag: "wx", mode: 0o600 });
        runs.push({
          taskId: task.id,
          category: task.category,
          arm,
          repeat,
          directory: relative,
          startHash,
          acceptanceCommand: ["node", "--test", "acceptance.test.mjs"],
          prompt: task.prompt,
          status: "unexecuted",
          model: null,
          modelVersion: null,
          elapsedMs: null,
          inputTokens: null,
          outputTokens: null,
          cachedTokens: null,
          cost: null,
          acceptancePassed: null,
          humanInterventions: null,
          duplicateSideEffects: null,
        });
      }
  }
  writeFileSync(
    path.join(output, "benchmark-manifest.json"),
    JSON.stringify(
      {
        version: 1,
        liveRunsAuthorized: false,
        note: [
          "Offline synthetic fixtures; no quality or token-cost superiority established.",
          "Use matched models and permissions, preserve acceptance tests, and record actual provider usage only.",
          "Recovery tasks simulate policy and do not prove native recovery.",
        ].join(" "),
        runs,
      },
      null,
      2,
    ) + "\n",
    { flag: "wx", mode: 0o600 },
  );
  return { output, runs: runs.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4 || process.argv[2] !== "--output")
    throw new Error("usage: node prepare-paired-benchmark.mts --output /absolute/new/directory");
  console.log(JSON.stringify(prepareBenchmark(process.argv[3]!)));
}
