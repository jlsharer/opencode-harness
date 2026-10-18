#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import type { ExecFileSyncOptionsWithStringEncoding } from "node:child_process";
import { createHash } from "node:crypto";
import { chmod, copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = path.join(ROOT, ".opencode/bootstrap/native/darwin-portable-fs.c");
const OUTPUT = path.join(ROOT, ".opencode/bootstrap/native/darwin-portable-fs.universal");
const requestedMode = process.argv[2];
if ((requestedMode !== "--check" && requestedMode !== "--update") || process.argv.length !== 3)
  throw new Error("usage: build-darwin-portable-fs.ts --check|--update");
const mode: "--check" | "--update" = requestedMode;
if (process.platform !== "darwin")
  throw new Error("Darwin helper builds require macOS and Apple Command Line Tools");

const run = (
  command: string,
  args: readonly string[],
  options: Omit<ExecFileSyncOptionsWithStringEncoding, "encoding"> = {},
): string => execFileSync(command, args, { encoding: "utf8", ...options }).trim();

const xcrun = (...args: string[]): string => run("/usr/bin/xcrun", args);

const clang = xcrun("--find", "clang");
const lipo = xcrun("--find", "lipo");
const sdk = xcrun("--sdk", "macosx", "--show-sdk-path");
const temp = await mkdtemp(path.join(os.tmpdir(), "darwin-portable-fs-build-"));

try {
  const slices: string[] = [];
  for (const arch of ["arm64", "x86_64"]) {
    const output = path.join(temp, `darwin-portable-fs.${arch}`);
    run(clang, [
      "-isysroot",
      sdk,
      "-arch",
      arch,
      "-std=c11",
      "-Os",
      "-Wall",
      "-Wextra",
      "-Werror",
      "-mmacosx-version-min=11.0",
      "-Wl,-no_uuid",
      SOURCE,
      "-o",
      output,
    ]);
    run("/usr/bin/codesign", ["--force", "--sign", "-", "--timestamp=none", output]);
    slices.push(output);
  }
  const universal = path.join(temp, "darwin-portable-fs.universal");
  run(lipo, ["-create", ...slices, "-output", universal]);
  const architectures = run(lipo, ["-archs", universal]).split(/\s+/).sort();
  if (architectures.join(",") !== "arm64,x86_64")
    throw new Error(`unexpected architectures: ${architectures.join(", ")}`);
  const loadCommands = xcrun("otool", "-l", universal);
  if ((loadCommands.match(/\bminos 11\.0\b/g) ?? []).length !== 2)
    throw new Error("both helper slices must declare macOS 11.0 minimum");
  const dependencies = xcrun("otool", "-L", universal)
    .split("\n")
    .filter((line) => /^\s+\/.* \(compatibility version /.test(line))
    .map((line) => line.trim());
  if (
    dependencies.length !== 2 ||
    dependencies.some((line) => !line.startsWith("/usr/lib/libSystem.B.dylib "))
  ) {
    throw new Error(
      `helper must link only libSystem in both slices; found: ${dependencies.join(", ")}`,
    );
  }
  const allArchitectureVerification = spawnSync(
    "/usr/bin/codesign",
    ["--verify", "--strict", "--all-architectures", universal],
    { encoding: "utf8" },
  );
  if (allArchitectureVerification.status !== 0)
    throw new Error(
      `all-architecture signature verification failed: ${(allArchitectureVerification.stderr || allArchitectureVerification.stdout).trim()}`,
    );
  for (const arch of architectures) {
    const signature = spawnSync("/usr/bin/codesign", ["-dvvv", "--arch", arch, universal], {
      encoding: "utf8",
    });
    const signatureText = `${signature.stdout ?? ""}${signature.stderr ?? ""}`;
    if (
      signature.status !== 0 ||
      !/flags=.*\badhoc\b/.test(signatureText) ||
      !/TeamIdentifier=not set/.test(signatureText)
    )
      throw new Error(`${arch} helper slice must have only an ad-hoc signature and no Team ID`);
  }
  await chmod(universal, 0o700);
  const selfTest = run(universal, ["--self-test"]);
  if (!/^OPDFSELF1 protocol=1 platform=darwin arch=(arm64|x86_64)$/.test(selfTest))
    throw new Error(`unexpected self-test: ${selfTest}`);
  const bytes = await readFile(universal);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (mode === "--update") {
    await copyFile(universal, OUTPUT);
    await chmod(OUTPUT, 0o644);
    console.log(
      `updated ${path.relative(ROOT, OUTPUT)} sha256=${sha256} architectures=${architectures.join(",")}`,
    );
  } else {
    const committed = await readFile(OUTPUT);
    const committedHash = createHash("sha256").update(committed).digest("hex");
    if (!committed.equals(bytes))
      throw new Error(
        `committed helper differs from reproducible build (built=${sha256}, committed=${committedHash})`,
      );
    console.log(
      `Darwin helper build check passed: sha256=${sha256}, architectures=${architectures.join(",")}, min-macos=11.0, signing=adhoc-all-slices-no-team-id`,
    );
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
