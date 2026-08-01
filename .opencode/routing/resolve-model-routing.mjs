#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { resolveRoutingDecision } from './routing-policy.mjs';
import { loadRoutingConfigSelection } from './routing-config-loader.mjs';

const __filename = fileURLToPath(import.meta.url);

function isDirectEntry() {
  if (typeof import.meta.main === 'boolean') return import.meta.main;
  const entry = process.argv[1];
  if (typeof entry !== 'string') return false;
  try {
    return fs.realpathSync.native(entry) === fs.realpathSync.native(__filename);
  } catch {
    return false;
  }
}

export function loadRoutingConfig(configPath) {
  return loadRoutingConfigSelection({ configPath }).document;
}

export function resolveModelRouting({ config, request = {} } = {}) {
  return resolveRoutingDecision({ config, request });
}

export function parseArgs(argv) {
  let configPath;
  let request = {};
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--config', '--metadata-json'].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) throw new Error(`Missing value for ${flag}`);
    const value = argv[++index];
    if (flag === '--config') configPath = path.resolve(value);
    else {
      try { request = JSON.parse(value); } catch (error) { throw new Error(`Malformed --metadata-json: ${error.message}`); }
      if (request === null || typeof request !== 'object' || Array.isArray(request)) throw new Error('--metadata-json must decode to an object');
    }
  }
  return { configPath, request };
}

async function main() {
  const { configPath, request } = parseArgs(process.argv.slice(2));
  process.stdout.write(`${JSON.stringify(resolveRoutingDecision({ config: loadRoutingConfig(configPath), request }), null, 2)}\n`);
}

if (isDirectEntry()) {
  try { await main(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
