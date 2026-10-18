#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { resolveRoutingDecision } from "./routing-policy.ts";
import type { RoutingRequest } from "./routing-policy.ts";
import { loadRoutingConfigSelection } from "./routing-config-loader.ts";

const __filename = fileURLToPath(import.meta.url);

function isDirectEntry() {
  if (typeof import.meta.main === "boolean") return import.meta.main;
  const entry = process.argv[1];
  if (typeof entry !== "string") return false;
  try {
    return fs.realpathSync.native(entry) === fs.realpathSync.native(__filename);
  } catch {
    return false;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function loadRoutingConfig(configPath?: string): unknown {
  return loadRoutingConfigSelection({ configPath }).document;
}

export function resolveModelRouting({
  config,
  request = {},
}: {
  config?: unknown;
  request?: RoutingRequest;
} = {}) {
  return resolveRoutingDecision({ config, request });
}

export interface ParsedRoutingArguments {
  configPath: string | undefined;
  request: RoutingRequest;
}

export function parseArgs(argv: readonly string[]): ParsedRoutingArguments {
  let configPath: string | undefined;
  let request: RoutingRequest = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === undefined || !["--config", "--metadata-json"].includes(flag))
      throw new Error(`Unknown argument: ${flag}`);
    if (index + 1 >= argv.length || argv[index + 1]?.startsWith("--"))
      throw new Error(`Missing value for ${flag}`);
    const value = argv[++index];
    if (value === undefined) throw new Error(`Missing value for ${flag}`);
    if (flag === "--config") configPath = path.resolve(value);
    else {
      try {
        const parsed: unknown = JSON.parse(value);
        if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed))
          throw new Error("--metadata-json must decode to an object");
        request = parsed;
      } catch (error) {
        if (error instanceof Error && error.message === "--metadata-json must decode to an object")
          throw error;
        throw new Error(`Malformed --metadata-json: ${errorMessage(error)}`);
      }
    }
  }
  return { configPath, request };
}

async function main() {
  const { configPath, request } = parseArgs(process.argv.slice(2));
  process.stdout.write(
    `${JSON.stringify(resolveRoutingDecision({ config: loadRoutingConfig(configPath), request }), null, 2)}\n`,
  );
}

if (isDirectEntry()) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${errorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
