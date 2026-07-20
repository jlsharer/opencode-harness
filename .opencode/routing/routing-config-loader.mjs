import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CUSTOM_ROUTING_BASENAME = 'harness-model-routing.json';
export const EXAMPLE_ROUTING_BASENAME = 'harness-model-routing.example.json';

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

export function loadRoutingConfigSelection({ configPath, startPath, fallbackDirectory } = {}) {
  const selected = configPath !== undefined
    ? { path: path.resolve(configPath), source: 'explicit', root: path.dirname(path.resolve(configPath)) }
    : selectImplicitRoutingConfig({ startPath, fallbackDirectory });
  return { ...selected, document: readRoutingConfig(selected.path) };
}
