#!/usr/bin/env node
import { resolveRoutingDecision } from "./routing-policy.ts";
import type { RoutingRequest } from "./routing-policy.ts";
import { loadRoutingConfigSelection } from "./routing-config-loader.ts";

export interface ResolveModelForRoleOptions {
  role?: unknown;
  agent?: unknown;
  command?: unknown;
  explicitModel?: unknown;
  explicitVariant?: unknown;
  complexity?: unknown;
  config?: unknown;
  configPath?: string;
}

export async function resolveModelForRole({
  role,
  agent,
  command,
  explicitModel,
  explicitVariant,
  complexity,
  config,
  configPath,
}: ResolveModelForRoleOptions = {}) {
  const request: RoutingRequest = {
    ...(role !== undefined ? { role } : {}),
    ...(agent !== undefined ? { agent } : {}),
    ...(command !== undefined ? { command } : {}),
    ...(explicitModel !== undefined ? { explicitModel } : {}),
    ...(explicitVariant !== undefined ? { variant: explicitVariant } : {}),
    ...(complexity !== undefined ? { complexity } : {}),
  };
  const document =
    config !== undefined ? config : loadRoutingConfigSelection({ configPath }).document;
  return resolveRoutingDecision({ config: document, request });
}
