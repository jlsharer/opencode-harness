import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CUSTOM_ROUTING_BASENAME = "harness-model-routing.json";
export const EXAMPLE_ROUTING_BASENAME = "harness-model-routing.example.json";
export const EXTERNAL_CATALOG_ENV = "OPENCODE_HARNESS_ROUTING_CATALOG";
export const EXTERNAL_PROFILE_ENV = "OPENCODE_HARNESS_ROUTING_PROFILE";

const MODULE_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROUTING_DIR =
  path.basename(path.dirname(MODULE_DIRECTORY)) === "src"
    ? path.resolve(MODULE_DIRECTORY, "../../routing")
    : MODULE_DIRECTORY;

type UnknownRecord = Record<string, unknown>;
export type RoutingConfigSource = "custom" | "example" | "explicit" | "external-pair";

interface CandidatePair {
  root: string;
  customPath: string;
  examplePath: string;
}

export interface RoutingConfigSelection {
  path: string;
  source: RoutingConfigSource;
  root: string;
  document: unknown;
  catalogPath?: string;
  profilePath?: string;
}

export interface RoutingSelectionOptions {
  configPath?: string | undefined;
  startPath?: string | undefined;
  fallbackDirectory?: string | undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function candidatePair(directory: string): CandidatePair {
  const root = path.resolve(directory);
  return {
    root,
    customPath: path.join(root, CUSTOM_ROUTING_BASENAME),
    examplePath: path.join(root, EXAMPLE_ROUTING_BASENAME),
  };
}

function hasDirectoryEntry(pathname: string): boolean {
  try {
    fs.lstatSync(pathname);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw new Error(
      `Unable to inspect routing config entry at ${pathname}: ${errorMessage(error)}`,
    );
  }
}

function selectPair(pair: CandidatePair): Omit<RoutingConfigSelection, "document"> | null {
  if (hasDirectoryEntry(pair.customPath))
    return { path: pair.customPath, source: "custom", root: pair.root };
  if (hasDirectoryEntry(pair.examplePath))
    return { path: pair.examplePath, source: "example", root: pair.root };
  return null;
}

function absentPairError(pair: CandidatePair): Error {
  return new Error(
    `No harness model routing config found. Checked custom ${pair.customPath} and example ${pair.examplePath}. ` +
      "Create an operator override with: cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json",
  );
}

export function selectImplicitRoutingConfig({
  startPath,
  fallbackDirectory = MODULE_ROUTING_DIR,
}: Pick<RoutingSelectionOptions, "startPath" | "fallbackDirectory"> = {}): Omit<
  RoutingConfigSelection,
  "document"
> {
  if (startPath !== undefined) {
    let current = path.resolve(startPath);
    try {
      if (fs.statSync(current).isFile()) current = path.dirname(current);
    } catch {
      // A context path need not exist yet; treat it as a directory boundary.
    }
    while (true) {
      const pair = candidatePair(path.join(current, ".opencode/routing"));
      const selected = selectPair(pair);
      if (selected) return selected;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  const fallbackPair = candidatePair(fallbackDirectory);
  const selected = selectPair(fallbackPair);
  if (selected) return selected;
  throw absentPairError(fallbackPair);
}

export function readRoutingConfig(pathname: string): unknown {
  const resolvedPath = path.resolve(pathname);
  let raw: string;
  try {
    raw = fs.readFileSync(resolvedPath, "utf8");
  } catch (error) {
    throw new Error(`Unable to read routing config at ${resolvedPath}: ${errorMessage(error)}`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    throw new Error(`Malformed routing config JSON at ${resolvedPath}: ${errorMessage(error)}`);
  }
}

function exactObject(
  value: unknown,
  allowed: readonly string[],
  required: readonly string[],
  label: string,
): UnknownRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${label} must be an object`);
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) throw new Error(`${label}.${key} is forbidden`);
  for (const key of required)
    if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required`);
  return value as UnknownRecord;
}

export function mergeExternalRoutingDocuments(catalog: unknown, profile: unknown): UnknownRecord {
  const catalogRecord = exactObject(
    catalog,
    ["schemaVersion", "models"],
    ["schemaVersion", "models"],
    "routing catalog",
  );
  if (catalogRecord.schemaVersion !== "1.0.0")
    throw new Error('routing catalog.schemaVersion must equal "1.0.0"');
  if (
    catalogRecord.models === null ||
    typeof catalogRecord.models !== "object" ||
    Array.isArray(catalogRecord.models)
  )
    throw new Error("routing catalog.models must be an object");
  const models = catalogRecord.models as UnknownRecord;
  if (Object.keys(models).length === 0) throw new Error("routing catalog.models must not be empty");
  for (const [name, entryValue] of Object.entries(models)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(name))
      throw new Error(`routing catalog.models.${name} has an invalid key`);
    const entry = exactObject(
      entryValue,
      ["model", "routingServiceUrl", "maxInFlight"],
      ["model", "routingServiceUrl", "maxInFlight"],
      `routing catalog.models.${name}`,
    );
    if (
      typeof entry.model !== "string" ||
      !entry.model.startsWith(`${name}/`) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(entry.model.slice(name.length + 1))
    )
      throw new Error(`routing catalog.models.${name}.model must use its key as provider prefix`);
    if (
      typeof entry.routingServiceUrl !== "string" ||
      !/^http:\/\/127\.0\.0\.1:[0-9]+\/v1$/.test(entry.routingServiceUrl)
    )
      throw new Error(
        `routing catalog.models.${name}.routingServiceUrl must be canonical loopback HTTP /v1`,
      );
    let port;
    try {
      port = Number(new URL(entry.routingServiceUrl).port);
    } catch {
      throw new Error(`routing catalog.models.${name}.routingServiceUrl is invalid`);
    }
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      throw new Error(`routing catalog.models.${name}.routingServiceUrl port is out of range`);
    if (
      typeof entry.maxInFlight !== "number" ||
      !Number.isInteger(entry.maxInFlight) ||
      entry.maxInFlight < 1 ||
      entry.maxInFlight > 2147483647
    )
      throw new Error(`routing catalog.models.${name}.maxInFlight is out of range`);
  }
  const profileKeys = [
    "schemaVersion",
    "providerClassMode",
    "defaultMode",
    "defaultModel",
    "singleModel",
    "localRouting",
    "roleOverrides",
    "commandOverrides",
    "orchestratorCommands",
    "complexityTiers",
  ];
  const profileRecord = exactObject(profile, profileKeys, profileKeys, "routing profile");
  const localRouting = exactObject(
    profileRecord.localRouting,
    ["enabled", "forceLocalForHarnessSubagents", "defaultLocalModel"],
    ["enabled", "forceLocalForHarnessSubagents", "defaultLocalModel"],
    "routing profile.localRouting",
  );
  if (
    typeof profileRecord.providerClassMode !== "string" ||
    !["mixed", "local-only", "cloud-only"].includes(profileRecord.providerClassMode)
  )
    throw new Error("routing profile.providerClassMode is invalid");
  if (
    localRouting.forceLocalForHarnessSubagents !==
    (profileRecord.providerClassMode === "local-only")
  )
    throw new Error("routing profile force-local setting contradicts providerClassMode");
  return {
    ...profileRecord,
    localRouting: { ...localRouting, models },
  };
}

export function loadExternalRoutingPair(
  env: NodeJS.ProcessEnv = process.env,
): RoutingConfigSelection | null {
  const catalogPath = env[EXTERNAL_CATALOG_ENV];
  const profilePath = env[EXTERNAL_PROFILE_ENV];
  if (Boolean(catalogPath) !== Boolean(profilePath))
    throw new Error(`${EXTERNAL_CATALOG_ENV} and ${EXTERNAL_PROFILE_ENV} must be set together`);
  if (!catalogPath || !profilePath) return null;
  const catalogResolved = path.resolve(catalogPath);
  const profileResolved = path.resolve(profilePath);
  return {
    path: profileResolved,
    source: "external-pair",
    root: path.dirname(profileResolved),
    catalogPath: catalogResolved,
    profilePath: profileResolved,
    document: mergeExternalRoutingDocuments(
      readRoutingConfig(catalogResolved),
      readRoutingConfig(profileResolved),
    ),
  };
}

export function loadRoutingConfigSelection({
  configPath,
  startPath,
  fallbackDirectory,
}: RoutingSelectionOptions = {}): RoutingConfigSelection {
  const external = loadExternalRoutingPair();
  if (external) return external;
  const selected: Omit<RoutingConfigSelection, "document"> =
    configPath !== undefined
      ? {
          path: path.resolve(configPath),
          source: "explicit",
          root: path.dirname(path.resolve(configPath)),
        }
      : selectImplicitRoutingConfig({ startPath, fallbackDirectory });
  return { ...selected, document: readRoutingConfig(selected.path) };
}
