import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CUSTOM_ROUTING_BASENAME = 'harness-model-routing.json';
export const EXAMPLE_ROUTING_BASENAME = 'harness-model-routing.example.json';
export const EXTERNAL_CATALOG_ENV = 'OPENCODE_HARNESS_ROUTING_CATALOG';
export const EXTERNAL_PROFILE_ENV = 'OPENCODE_HARNESS_ROUTING_PROFILE';

const MODULE_ROUTING_DIR = path.dirname(fileURLToPath(import.meta.url));

function candidatePair(directory) {
  const root = path.resolve(directory);
  return {
    root,
    customPath: path.join(root, CUSTOM_ROUTING_BASENAME),
    examplePath: path.join(root, EXAMPLE_ROUTING_BASENAME),
  };
}

function hasDirectoryEntry(pathname) {
  try {
    fs.lstatSync(pathname);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new Error(`Unable to inspect routing config entry at ${pathname}: ${error.message}`);
  }
}

function selectPair(pair) {
  if (hasDirectoryEntry(pair.customPath)) return { path: pair.customPath, source: 'custom', root: pair.root };
  if (hasDirectoryEntry(pair.examplePath)) return { path: pair.examplePath, source: 'example', root: pair.root };
  return null;
}

function absentPairError(pair) {
  return new Error(
    `No harness model routing config found. Checked custom ${pair.customPath} and example ${pair.examplePath}. ` +
    'Create an operator override with: cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json',
  );
}

export function selectImplicitRoutingConfig({ startPath, fallbackDirectory = MODULE_ROUTING_DIR } = {}) {
  if (startPath !== undefined) {
    let current = path.resolve(startPath);
    try {
      if (fs.statSync(current).isFile()) current = path.dirname(current);
    } catch {
      // A context path need not exist yet; treat it as a directory boundary.
    }
    while (true) {
      const pair = candidatePair(path.join(current, '.opencode/routing'));
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

export function readRoutingConfig(pathname) {
  const resolvedPath = path.resolve(pathname);
  let raw;
  try {
    raw = fs.readFileSync(resolvedPath, 'utf8');
  } catch (error) {
    throw new Error(`Unable to read routing config at ${resolvedPath}: ${error.message}`);
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Malformed routing config JSON at ${resolvedPath}: ${error.message}`);
  }
}

function exactObject(value, allowed, required, label) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`${label}.${key} is forbidden`);
  for (const key of required) if (!Object.hasOwn(value, key)) throw new Error(`${label}.${key} is required`);
}

export function mergeExternalRoutingDocuments(catalog, profile) {
  exactObject(catalog, ['schemaVersion', 'models'], ['schemaVersion', 'models'], 'routing catalog');
  if (catalog.schemaVersion !== '1.0.0') throw new Error('routing catalog.schemaVersion must equal "1.0.0"');
  if (catalog.models === null || typeof catalog.models !== 'object' || Array.isArray(catalog.models)) throw new Error('routing catalog.models must be an object');
  if (Object.keys(catalog.models).length === 0) throw new Error('routing catalog.models must not be empty');
  for (const [name, entry] of Object.entries(catalog.models)) {
    if (!/^ai-infra-[a-z][a-z0-9-]{0,31}$/.test(name)) throw new Error(`routing catalog.models.${name} has an invalid key`);
    exactObject(entry, ['model', 'routingServiceUrl', 'maxInFlight'], ['model', 'routingServiceUrl', 'maxInFlight'], `routing catalog.models.${name}`);
    if (typeof entry.model !== 'string' || !entry.model.startsWith(`${name}/`) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/.test(entry.model.slice(name.length + 1))) throw new Error(`routing catalog.models.${name}.model must use its key as provider prefix`);
    if (typeof entry.routingServiceUrl !== 'string' || !/^http:\/\/127\.0\.0\.1:[0-9]+\/v1$/.test(entry.routingServiceUrl)) throw new Error(`routing catalog.models.${name}.routingServiceUrl must be canonical loopback HTTP /v1`);
    let port;
    try { port = Number(new URL(entry.routingServiceUrl).port); } catch { throw new Error(`routing catalog.models.${name}.routingServiceUrl is invalid`); }
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`routing catalog.models.${name}.routingServiceUrl port is out of range`);
    if (!Number.isInteger(entry.maxInFlight) || entry.maxInFlight < 1 || entry.maxInFlight > 2147483647) throw new Error(`routing catalog.models.${name}.maxInFlight is out of range`);
  }
  const profileKeys = ['schemaVersion', 'defaultMode', 'defaultModel', 'singleModel', 'localRouting', 'roleOverrides', 'commandOverrides', 'orchestratorCommands', 'complexityTiers'];
  exactObject(profile, profileKeys, profileKeys, 'routing profile');
  exactObject(profile.localRouting, ['enabled', 'forceLocalForHarnessSubagents', 'defaultLocalModel'], ['enabled', 'forceLocalForHarnessSubagents', 'defaultLocalModel'], 'routing profile.localRouting');
  if (profile.localRouting.forceLocalForHarnessSubagents !== false) throw new Error('routing profile.localRouting.forceLocalForHarnessSubagents must be false');
  return {
    ...profile,
    localRouting: { ...profile.localRouting, models: catalog.models },
  };
}

export function loadExternalRoutingPair(env = process.env) {
  const catalogPath = env[EXTERNAL_CATALOG_ENV];
  const profilePath = env[EXTERNAL_PROFILE_ENV];
  if (Boolean(catalogPath) !== Boolean(profilePath)) throw new Error(`${EXTERNAL_CATALOG_ENV} and ${EXTERNAL_PROFILE_ENV} must be set together`);
  if (!catalogPath) return null;
  const catalogResolved = path.resolve(catalogPath);
  const profileResolved = path.resolve(profilePath);
  return {
    path: profileResolved,
    source: 'external-pair',
    root: path.dirname(profileResolved),
    catalogPath: catalogResolved,
    profilePath: profileResolved,
    document: mergeExternalRoutingDocuments(readRoutingConfig(catalogResolved), readRoutingConfig(profileResolved)),
  };
}

export function loadRoutingConfigSelection({ configPath, startPath, fallbackDirectory } = {}) {
  const external = loadExternalRoutingPair();
  if (external) return external;
  const selected = configPath !== undefined
    ? { path: path.resolve(configPath), source: 'explicit', root: path.dirname(path.resolve(configPath)) }
    : selectImplicitRoutingConfig({ startPath, fallbackDirectory });
  return { ...selected, document: readRoutingConfig(selected.path) };
}
