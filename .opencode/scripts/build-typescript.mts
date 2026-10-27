#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { constants } from "node:fs";
import {
  access,
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import {
  GENERATED_TYPESCRIPT_ARTIFACTS,
  type GeneratedArtifact,
} from "./generated-typescript-artifacts.mts";

const root = process.cwd();
const check = process.argv.slice(2).includes("--check");
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "opencode-harness-typescript-"));
const emittedRoot = path.join(temporaryRoot, "typescript");

const generatedBySource = new Map(
  GENERATED_TYPESCRIPT_ARTIFACTS.map((artifact) => [artifact.source, artifact]),
);

function relativeSpecifier(from: string, to: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), to);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function rewriteGeneratedImports(artifact: GeneratedArtifact, source: string): string {
  let rewritten = source;
  for (const target of generatedBySource.values()) {
    const emittedSpecifier = relativeSpecifier(artifact.source, target.source);
    const publishedSpecifier = relativeSpecifier(artifact.output, target.output);
    rewritten = rewritten
      .replaceAll(`"${emittedSpecifier}"`, `"${publishedSpecifier}"`)
      .replaceAll(`'${emittedSpecifier}'`, `'${publishedSpecifier}'`)
      .replaceAll(`"${emittedSpecifier.replace(/\.js$/u, ".ts")}"`, `"${publishedSpecifier}"`)
      .replaceAll(`'${emittedSpecifier.replace(/\.js$/u, ".ts")}'`, `'${publishedSpecifier}'`);
  }
  return rewritten;
}

async function assertGeneratedInventory(): Promise<void> {
  const expectedByDirectory = new Map<string, Set<string>>();
  for (const artifact of GENERATED_TYPESCRIPT_ARTIFACTS) {
    const directory = path.posix.dirname(artifact.output);
    const expected = expectedByDirectory.get(directory) ?? new Set<string>();
    expected.add(path.posix.basename(artifact.output));
    expectedByDirectory.set(directory, expected);
  }
  for (const [directory, expected] of expectedByDirectory) {
    const actual = (await readdir(path.join(root, directory), { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.(?:js|mjs|cjs)$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    const expectedNames = [...expected].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expectedNames)) {
      throw new Error(
        `Generated compatibility inventory mismatch in ${directory}: expected ${expectedNames.join(", ")}, got ${actual.join(", ")}`,
      );
    }
  }
}

try {
  const tsc = path.join(root, "node_modules", "typescript", "bin", "tsc");
  const result = spawnSync(process.execPath, [tsc, "--outDir", emittedRoot], {
    cwd: root,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exitCode = result.status ?? 1;
  } else {
    if (check) await assertGeneratedInventory();
    for (const artifact of GENERATED_TYPESCRIPT_ARTIFACTS) {
      const staged = path.join(emittedRoot, artifact.source);
      const destination = path.join(root, artifact.output);
      const bytes = Buffer.from(rewriteGeneratedImports(artifact, await readFile(staged, "utf8")));
      if (artifact.shebang && bytes.toString("utf8").split("\n", 1)[0] !== artifact.shebang) {
        throw new Error(`Generated shebang mismatch: ${artifact.output}`);
      }
      if (check) {
        await access(destination, constants.R_OK);
        const current = await readFile(destination);
        if (!current.equals(bytes)) throw new Error(`Stale generated artifact: ${artifact.output}`);
        const actualMode = (await stat(destination)).mode & 0o777;
        if (actualMode !== artifact.mode)
          throw new Error(`Generated mode mismatch: ${artifact.output}`);
      } else {
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, bytes);
        await chmod(destination, artifact.mode);
      }
    }
    process.stdout.write(`Checked ${GENERATED_TYPESCRIPT_ARTIFACTS.length} harness artifacts.\n`);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
