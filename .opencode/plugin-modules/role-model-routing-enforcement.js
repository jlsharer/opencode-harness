import path from 'node:path';
import {
  FIXED_HARNESS_ROLES,
  resolveAllHarnessRoleAssignments,
  validateNativeProviderCoherence,
} from '../routing/routing-policy.mjs';
import { loadRoutingConfigSelection, selectImplicitRoutingConfig } from '../routing/routing-config-loader.mjs';

export { FIXED_HARNESS_ROLES };

function projectPathFromContext(options) {
  return [options.project?.root, options.project?.path, options.project?.directory, options.directory]
    .find((candidate) => typeof candidate === 'string' && candidate.trim() !== '');
}

function runtimeRoot() {
  const value = process.env.OPENCODE_HARNESS_RUNTIME_ROOT;
  return typeof value === 'string' && value.trim() !== '' ? path.resolve(value) : null;
}

export function resolveHarnessRoutingPath(options = {}) {
  if (options.routingPath !== undefined) return path.resolve(options.routingPath);
  const runtime = runtimeRoot();
  return selectImplicitRoutingConfig(runtime
    ? { fallbackDirectory: path.join(runtime, 'routing') }
    : { startPath: projectPathFromContext(options) }).path;
}

export function applyHarnessRoleModelOverrides(cfg, options = {}) {
  let plan;
  try {
    const document = options.routingDocument !== undefined
      ? options.routingDocument
      : loadRoutingConfigSelection(runtimeRoot()
        ? { configPath: options.routingPath, fallbackDirectory: path.join(runtimeRoot(), 'routing') }
        : { configPath: options.routingPath, startPath: projectPathFromContext(options) }).document;
    plan = resolveAllHarnessRoleAssignments(document);
    // The shared plan resolves all role assignments and provider-class filters
    // before any native config mutation.
    validateNativeProviderCoherence(cfg, plan);
    for (const key of ['enabled_providers', 'disabled_providers']) {
      if (cfg[key] !== undefined && (!Array.isArray(cfg[key]) || cfg[key].some((value) => typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)))) throw new Error(`$.nativeConfig.${key} must be an array of provider IDs`);
    }
    const enabled = cfg.enabled_providers === undefined ? undefined : [...new Set(cfg.enabled_providers)];
    const disabled = [...new Set(cfg.disabled_providers ?? [])];
    if (plan.mode === 'local-only') {
      plan.enabledProviders = plan.localProviders;
      plan.disabledProviders = disabled.filter((provider) => !plan.localProviders.includes(provider));
    } else if (plan.mode === 'cloud-only') {
      plan.enabledProviders = enabled?.filter((provider) => !plan.localProviders.includes(provider));
      plan.disabledProviders = [...new Set([...disabled, ...plan.localProviders])].sort();
    }
    if (plan.enabledProviders?.some((provider) => plan.disabledProviders?.includes(provider))) throw new Error('native provider filters would be contradictory');
  } catch (error) {
    if (error.message.startsWith('Harness role model routing enforcement failed:')) throw error;
    throw new Error(`Harness role model routing enforcement failed: ${error.message}`);
  }

  // Preflight above covers every selected agent/provider/model/baseURL before
  // this atomic mutation phase. Provider objects are never written.
  for (const role of FIXED_HARNESS_ROLES) {
    const assignment = plan.assignments[role];
    if (assignment === null) continue;
    cfg.agent[role].model = assignment.model;
    cfg.agent[role].mode = 'subagent';
  }
  if (plan.mode === 'local-only') {
    cfg.enabled_providers = plan.enabledProviders;
    cfg.disabled_providers = plan.disabledProviders;
  } else if (plan.mode === 'cloud-only') {
    if (plan.enabledProviders !== undefined) cfg.enabled_providers = plan.enabledProviders;
    cfg.disabled_providers = plan.disabledProviders;
  }
  return plan;
}

export const HarnessRoleModelRoutingEnforcementPlugin = async (context = {}) => ({
  config: async (cfg) => {
    applyHarnessRoleModelOverrides(cfg, context);
  },
});
