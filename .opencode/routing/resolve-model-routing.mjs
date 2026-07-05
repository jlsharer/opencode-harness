#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONFIG_PATH = path.join(__dirname, 'harness-model-routing.json');
const ABSENT_VALUES = new Set(['', 'inherited', 'not provided', 'none', 'null', 'undefined']);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeConfig(config) {
  return config.harnessModelRouting ?? config;
}

function normalizeCommand(command) {
  if (!command) return undefined;
  return command.startsWith('/') ? command : `/${command}`;
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function present(value) {
  if (value === undefined || value === null) return false;
  if (typeof value !== 'string') return true;
  return !ABSENT_VALUES.has(value.trim().toLowerCase());
}

function firstPresent(...values) {
  return values.find((value) => present(value));
}

function asBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim().toLowerCase() === 'true';
  return Boolean(value);
}

function entryWithSource(entry, source) {
  if (!entry) return undefined;
  return {
    model: cleanString(entry.model),
    variant: cleanString(entry.variant),
    agent: cleanString(entry.agent),
    source,
  };
}

export function loadRoutingConfig(configPath = DEFAULT_CONFIG_PATH) {
  return normalizeConfig(readJson(configPath));
}

export function resolveModelRouting({ config, request = {} } = {}) {
  if (!config) {
    throw new Error('resolveModelRouting requires a routing config object');
  }

  const routing = normalizeConfig(config);
  const command = normalizeCommand(cleanString(request.command));
  const requestedRole = cleanString(firstPresent(request.role, request.agent));
  const commandEntry = entryWithSource(routing.commandOverrides?.[command], 'commandOverride');
  const orchestratorEntry = entryWithSource(routing.orchestratorCommands?.[command], 'orchestratorCommand');
  const agent = cleanString(firstPresent(request.agent, commandEntry?.agent, requestedRole));
  const roleKey = cleanString(firstPresent(request.role, agent));
  const roleEntry = entryWithSource(routing.roleOverrides?.[roleKey], 'roleOverride');
  const complexity = cleanString(request.complexity);
  const complexityEntry = entryWithSource(
    present(complexity) ? routing.complexityTiers?.[complexity] : undefined,
    'complexityTier',
  );
  const singleEntry =
    routing.singleModel?.enabled && present(routing.singleModel.model)
      ? entryWithSource(routing.singleModel, 'singleModel')
      : undefined;
  const defaultEntry = entryWithSource({ model: routing.defaultModel }, 'defaultModel');
  const explicitModel = cleanString(
    firstPresent(request.explicitModel, request.providerModel, request.model),
  );
  const explicitVariant = cleanString(request.variant);

  const candidates = [orchestratorEntry, commandEntry, roleEntry, complexityEntry, singleEntry, defaultEntry];
  const modelEntry = present(explicitModel)
    ? { model: explicitModel, source: 'userExplicitOverride' }
    : candidates.find((entry) => present(entry?.model));
  const variantEntry = present(explicitVariant)
    ? { variant: explicitVariant, source: 'userExplicitOverride' }
    : candidates.find((entry) => present(entry?.variant));
  const sourceEntry =
    present(explicitModel) || present(explicitVariant)
      ? { source: 'userExplicitOverride' }
      : candidates.find((entry) => present(entry?.agent) || present(entry?.model) || present(entry?.variant));
  const agentSource = present(request.agent)
    ? 'request'
    : candidates.find((entry) => present(entry?.agent))?.source;

  const localModel = routing.localModel ?? {};
  const localModelEnabled = present(request.localModelEnabled)
    ? asBoolean(request.localModelEnabled)
    : Boolean(localModel.localModelEnabled);
  const preferLocal = present(request.preferLocal)
    ? asBoolean(request.preferLocal)
    : Boolean(localModel.preferLocal);
  const localModelFallback = cleanString(
    firstPresent(request.localModelFallback, localModel.localModelFallback),
  );
  const routingServiceUrl = cleanString(
    firstPresent(request.routingServiceUrl, localModel.routingServiceUrl),
  );

  return {
    agent: agent ?? null,
    model: modelEntry?.model,
    variant: variantEntry?.variant,
    source: sourceEntry?.source ?? modelEntry?.source ?? variantEntry?.source ?? 'unresolved',
    sources: {
      agent: agentSource ?? null,
      model: modelEntry?.source ?? null,
      variant: variantEntry?.source ?? null,
    },
    localModel: {
      routingServiceUrl: routingServiceUrl ?? null,
      localModelEnabled,
      preferLocal,
      localModelFallback: localModelFallback ?? null,
      effectiveFallbackModel: localModelEnabled && preferLocal ? localModelFallback ?? null : null,
      networkCalls: false,
    },
  };
}

function parseArgs(argv) {
  const request = {};
  let configPath = DEFAULT_CONFIG_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === '--config') {
      configPath = path.resolve(next);
      index += 1;
    } else if (arg === '--metadata-json') {
      Object.assign(request, JSON.parse(next));
      index += 1;
    } else if (arg.startsWith('--')) {
      request[arg.slice(2)] = next;
      index += 1;
    }
  }

  return { configPath, request };
}

if (process.argv[1] === __filename) {
  const { configPath, request } = parseArgs(process.argv.slice(2));
  const config = loadRoutingConfig(configPath);
  process.stdout.write(`${JSON.stringify(resolveModelRouting({ config, request }), null, 2)}\n`);
}
