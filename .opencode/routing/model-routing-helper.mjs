#!/usr/bin/env node
import { resolveRoutingDecision } from './routing-policy.mjs';
import { loadRoutingConfigSelection } from './routing-config-loader.mjs';

export async function resolveModelForRole({
  role,
  agent,
  command,
  explicitModel,
  explicitVariant,
  complexity,
  config,
  configPath,
} = {}) {
  const request = {
    ...(role !== undefined ? { role } : {}),
    ...(agent !== undefined ? { agent } : {}),
    ...(command !== undefined ? { command } : {}),
    ...(explicitModel !== undefined ? { explicitModel } : {}),
    ...(explicitVariant !== undefined ? { variant: explicitVariant } : {}),
    ...(complexity !== undefined ? { complexity } : {}),
  };
  const document = config !== undefined ? config : loadRoutingConfigSelection({ configPath }).document;
  return resolveRoutingDecision({ config: document, request });
}
