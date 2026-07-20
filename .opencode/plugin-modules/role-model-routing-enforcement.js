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

export function resolveHarnessRoutingPath(options = {}) {
  if (options.routingPath !== undefined) return path.resolve(options.routingPath);
  return selectImplicitRoutingConfig({ startPath: projectPathFromContext(options) }).path;
}

export function applyHarnessRoleModelOverrides(cfg, options = {}) {
  let plan;
  try {
    const document = options.routingDocument !== undefined
      ? options.routingDocument
      : loadRoutingConfigSelection({
        configPath: options.routingPath,
        startPath: projectPathFromContext(options),
      }).document;
    plan = resolveAllHarnessRoleAssignments(document);
    // Outside force mode the shared plan intentionally contains only non-null
    // native roleOverrides models. Local selectors, singleModel, and defaultModel
    // remain resolver-only advisory routing policy and never mutate agents.
    validateNativeProviderCoherence(cfg, plan);
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
  return plan;
}

export const HarnessRoleModelRoutingEnforcementPlugin = async (context = {}) => ({
  config: async (cfg) => {
    applyHarnessRoleModelOverrides(cfg, context);
  },
});
