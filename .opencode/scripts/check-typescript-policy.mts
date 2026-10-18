#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { GENERATED_TYPESCRIPT_ARTIFACTS } from "./generated-typescript-artifacts.mts";

const root = process.cwd();
const excludedDirectories = new Set([
  ".git",
  ".build",
  "node_modules",
  "dist",
  "coverage",
  "test-results",
  "playwright-report",
  "dashboard",
]);

const generated = new Set(GENERATED_TYPESCRIPT_ARTIFACTS.map(({ output }) => output));

const authored: string[] = [];
const suppressionDirective = /@ts-(?:nocheck|ignore|expect-error)\b/u;

function isCompilerAndFormatterInput(relative: string): boolean {
  return (
    (relative.startsWith("bin/") && relative.endsWith(".ts")) ||
    (relative.startsWith(".opencode/src/") && relative.endsWith(".ts")) ||
    (path.posix.dirname(relative) === ".opencode/scripts" && relative.endsWith(".mts")) ||
    (relative.startsWith("dashboard/") && relative.endsWith(".ts"))
  );
}

async function walk(relativeDirectory: string): Promise<void> {
  const entries = await readdir(path.join(root, relativeDirectory), { withFileTypes: true });
  for (const entry of entries) {
    const relative = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) await walk(relative);
    } else if (entry.isFile()) {
      const scoped =
        relative === "bin/opencode-harness.ts" ||
        relative.startsWith(".opencode/") ||
        relative.startsWith("dashboard/");
      if (!scoped) continue;
      if (/\.(?:map|d\.ts|tsbuildinfo)$/u.test(relative))
        throw new Error(`Forbidden generated file: ${relative}`);
      if (/\.(?:js|mjs|cjs)$/u.test(relative) && !generated.has(relative))
        throw new Error(`Unexpected JavaScript: ${relative}`);
      if (/\.(?:ts|mts)$/u.test(relative) && !relative.endsWith(".d.ts")) authored.push(relative);
    }
  }
}

await walk("");
for (const relative of authored.sort()) {
  const text = await readFile(path.join(root, relative), "utf8");
  if (!isCompilerAndFormatterInput(relative))
    throw new Error(`Authored TypeScript is omitted from typecheck/format inputs: ${relative}`);
  if (suppressionDirective.test(text))
    throw new Error(`TypeScript suppression directive is forbidden: ${relative}`);
  if (text.includes("\r")) throw new Error(`CRLF is forbidden: ${relative}`);
  if (text.includes("\t")) throw new Error(`Tabs are forbidden: ${relative}`);
  for (const [index, line] of text.split("\n").entries()) {
    const trimmed = line.trimStart();
    const exempt =
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#!");
    const fixtureData =
      relative.endsWith("runtime-harness.test.mts") ||
      relative.endsWith("runtime-foreign-repo.test.mts");
    const embeddedProgram =
      fixtureData &&
      (trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.startsWith("`"));
    if (!exempt && !embeddedProgram && line.length > 240)
      throw new Error(`Line exceeds 240 characters: ${relative}:${index + 1}`);
  }
}

process.stdout.write(`TypeScript source policy passed for ${authored.length} authored files.\n`);
