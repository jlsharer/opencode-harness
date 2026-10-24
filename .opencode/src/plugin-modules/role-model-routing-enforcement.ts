import path from "node:path";
import type { HarnessLifecyclePlugin } from "./harness-lifecycle.ts";
import {
  FIXED_HARNESS_ROLES,
  normalizeAndValidateRoutingConfig,
  resolveAllHarnessRoleAssignments,
  validateNativeProviderCoherence,
} from "../routing/routing-policy.ts";
import type { HarnessRole, RoleAssignmentPlan } from "../routing/routing-policy.ts";
import {
  loadRoutingConfigSelection,
  selectImplicitRoutingConfig,
} from "../routing/routing-config-loader.ts";

export { FIXED_HARNESS_ROLES };

type UnknownRecord = Record<string, unknown>;

export interface HarnessRoutingContext {
  project?: { root?: string; path?: string; directory?: string } | undefined;
  directory?: string | undefined;
  routingPath?: string | undefined;
  routingDocument?: unknown;
}

interface MutableAgentConfig extends UnknownRecord {
  model?: string | undefined;
  mode?: string | undefined;
}

interface MutableNativeConfig extends UnknownRecord {
  agent?: Partial<Record<HarnessRole, MutableAgentConfig>> | undefined;
  enabled_providers?: string[] | undefined;
  disabled_providers?: string[] | undefined;
}

interface MutableRoleAssignmentPlan extends RoleAssignmentPlan {
  enabledProviders?: string[] | undefined;
  disabledProviders?: string[] | undefined;
}

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function mutableNativeConfig(value: unknown): MutableNativeConfig {
  if (!isRecord(value)) throw new Error("$.nativeConfig must be an object");
  return value as MutableNativeConfig;
}

function mutableAgent(config: MutableNativeConfig, role: HarnessRole): MutableAgentConfig {
  const value = config.agent?.[role];
  if (!isRecord(value)) throw new Error(`$.nativeConfig.agent.${role} must be an object`);
  return value;
}

function projectPathFromContext(options: HarnessRoutingContext): string | undefined {
  return [
    options.project?.root,
    options.project?.path,
    options.project?.directory,
    options.directory,
  ].find((candidate) => typeof candidate === "string" && candidate.trim() !== "");
}

function runtimeRoot() {
  const value = process.env.OPENCODE_HARNESS_RUNTIME_ROOT;
  return typeof value === "string" && value.trim() !== "" ? path.resolve(value) : null;
}

export function resolveHarnessRoutingPath(options: HarnessRoutingContext = {}): string {
  if (options.routingPath !== undefined) return path.resolve(options.routingPath);
  const runtime = runtimeRoot();
  return selectImplicitRoutingConfig(
    runtime
      ? { fallbackDirectory: path.join(runtime, "routing") }
      : { startPath: projectPathFromContext(options) },
  ).path;
}

export function applyHarnessRoleModelOverrides(
  cfg: unknown,
  options: HarnessRoutingContext = {},
  selectedPlan?: RoleAssignmentPlan,
): MutableRoleAssignmentPlan {
  let plan: MutableRoleAssignmentPlan;
  let native: MutableNativeConfig;
  try {
    const document =
      options.routingDocument !== undefined
        ? options.routingDocument
        : loadRoutingConfigSelection(
            runtimeRoot()
              ? {
                  configPath: options.routingPath,
                  fallbackDirectory: path.join(runtimeRoot() ?? "", "routing"),
                }
              : { configPath: options.routingPath, startPath: projectPathFromContext(options) },
          ).document;
    plan = structuredClone(selectedPlan ?? resolveAllHarnessRoleAssignments(document));
    // The shared plan resolves all role assignments and provider-class filters
    // before any native config mutation.
    validateNativeProviderCoherence(cfg, plan);
    native = mutableNativeConfig(cfg);
    for (const key of ["enabled_providers", "disabled_providers"]) {
      const value = native[key];
      if (
        value !== undefined &&
        (!Array.isArray(value) ||
          value.some(
            (value) => typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value),
          ))
      )
        throw new Error(`$.nativeConfig.${key} must be an array of provider IDs`);
    }
    const enabled =
      native.enabled_providers === undefined ? undefined : [...new Set(native.enabled_providers)];
    const disabled = [...new Set(native.disabled_providers ?? [])];
    if (plan.mode === "local-only") {
      plan.enabledProviders =
        enabled === undefined
          ? plan.localProviders
          : enabled.filter((provider) => plan.localProviders.includes(provider));
      plan.disabledProviders = disabled;
    } else if (plan.mode === "cloud-only") {
      plan.enabledProviders = enabled?.filter(
        (provider) => !plan.localProviders.includes(provider),
      );
      plan.disabledProviders = [...new Set([...disabled, ...plan.localProviders])].sort();
    }
    // Validate the effective filters after provider-class restrictions are added,
    // before any agent or native filter mutation.
    const effectiveEnabled = plan.enabledProviders ?? enabled;
    const effectiveDisabled = plan.disabledProviders ?? disabled;
    for (const [role, assignment] of Object.entries(plan.assignments)) {
      if (assignment === null) continue;
      const provider = assignment.model.split("/")[0]!;
      if (
        effectiveDisabled.includes(provider) ||
        (effectiveEnabled !== undefined && !effectiveEnabled.includes(provider))
      )
        throw new Error(
          `configured role ${role} selects provider ${provider} blocked by native provider restrictions (${plan.mode} effective filters)`,
        );
    }
    if (plan.enabledProviders?.some((provider) => plan.disabledProviders?.includes(provider)))
      throw new Error("native provider filters would be contradictory");
  } catch (error) {
    const message = errorMessage(error);
    if (message.startsWith("Harness role model routing enforcement failed:")) throw error;
    throw new Error(`Harness role model routing enforcement failed: ${message}`);
  }

  // Preflight above covers every selected agent/provider/model/baseURL before
  // this atomic mutation phase. Provider objects are never written.
  for (const role of FIXED_HARNESS_ROLES) {
    const assignment = plan.assignments[role];
    if (assignment === null) continue;
    const agent = mutableAgent(native, role);
    agent.model = assignment.model;
    agent.mode = "subagent";
  }
  if (plan.mode === "local-only") {
    native.enabled_providers = plan.enabledProviders;
    native.disabled_providers = plan.disabledProviders;
  } else if (plan.mode === "cloud-only") {
    if (plan.enabledProviders !== undefined) native.enabled_providers = plan.enabledProviders;
    native.disabled_providers = plan.disabledProviders;
  }
  return plan;
}

/** Explicit session-start readiness gate. Never probes remote hosts or sends credentials. */
export async function assertLocalAssignmentsReady(
  document: unknown,
  cfg: unknown,
  fetcher: typeof fetch = fetch,
  timeoutMs = 1500,
  selectedPlan?: RoleAssignmentPlan,
): Promise<void> {
  const plan = selectedPlan ?? resolveAllHarnessRoleAssignments(document);
  validateNativeProviderCoherence(cfg, plan);
  const selected = new Map<string, string>();
  for (const assignment of Object.values(plan.assignments)) {
    if (!assignment?.catalogName || !assignment.routingServiceUrl) continue;
    const providerId = assignment.model.split("/")[0]!;
    const providers = mutableNativeConfig(cfg).provider as UnknownRecord;
    const provider = providers[providerId];
    const modelId = assignment.model.slice(providerId.length + 1);
    if (
      !isRecord(provider) ||
      !isRecord(provider.models) ||
      !Object.hasOwn(provider.models, modelId)
    )
      throw new Error(
        `Required local model ${assignment.model} needs an explicit native models map and registered model entry; managed delegation is blocked without fallback`,
      );
    selected.set(assignment.model, assignment.routingServiceUrl);
  }
  for (const [model, base] of selected) {
    const url = new URL(base);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("Local readiness requires a credential-free loopback HTTP catalog endpoint");
    const signal = AbortSignal.timeout(timeoutMs);
    const read = async (endpoint: string): Promise<unknown> => {
      const response = await fetcher(endpoint, {
        method: "GET",
        headers: { Accept: "application/json" },
        redirect: "error",
        credentials: "omit",
        signal,
      });
      if (!response.ok || !response.body) throw new Error("local endpoint is not healthy");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const part = await reader.read();
          if (part.done) break;
          size += part.value.byteLength;
          if (size > 65536) throw new Error("local readiness response exceeds 64 KiB");
          chunks.push(part.value);
        }
      } finally {
        await reader.cancel();
      }
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    };
    try {
      const health = await read(new URL("/health", url).href);
      if (!isRecord(health) || health.status !== "ok")
        throw new Error("local health status is not ok");
      const models = await read(base.replace(/\/$/, "") + "/models");
      const wanted = model.slice(model.indexOf("/") + 1);
      if (
        !isRecord(models) ||
        !Array.isArray(models.data) ||
        !models.data.some((entry) => isRecord(entry) && entry.id === wanted)
      )
        throw new Error("configured model is absent");
    } catch {
      throw new Error(
        `Local model ${model} is unavailable, unhealthy, missing, or timed out; managed delegation is blocked without remote fallback. Restart after the configured endpoint is ready.`,
      );
    }
  }
}

/** Resolve optional catalog routes once; unavailable local routes inherit the native session. */
export async function selectAvailableRoleAssignments(
  document: unknown,
  cfg: unknown,
  required = false,
  fetcher: typeof fetch = fetch,
  timeoutMs = 1500,
): Promise<{ plan: RoleAssignmentPlan; inheritRoles: HarnessRole[] }> {
  const routing = normalizeAndValidateRoutingConfig(document);
  const plan = resolveAllHarnessRoleAssignments(routing);
  const strict =
    required || plan.mode === "local-only" || routing.localRouting.forceLocalForHarnessSubagents;
  if (strict) {
    // Configuration errors remain errors, independently of endpoint availability.
    applyHarnessRoleModelOverrides(structuredClone(cfg), { routingDocument: routing });
    await assertLocalAssignmentsReady(routing, cfg, fetcher, timeoutMs);
    return { plan, inheritRoles: [] };
  }
  const native = mutableNativeConfig(cfg);
  if (native.provider !== undefined && !isRecord(native.provider))
    throw new Error("$.nativeConfig.provider must be an object");
  const inheritRoles: HarnessRole[] = [];
  const available = new Map<string, boolean>();
  for (const role of FIXED_HARNESS_ROLES) {
    const assignment = plan.assignments[role];
    if (!assignment?.catalogName) continue;
    // Reject unsafe URLs before the availability catch (never probe remote hosts).
    const url = new URL(assignment.routingServiceUrl!);
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "[::1]", "localhost"].includes(url.hostname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error("Local readiness requires a credential-free loopback HTTP catalog endpoint");
    const providerId = assignment.model.split("/")[0]!;
    // An explicit provider restriction is a configuration conflict, not an outage.
    if (
      plan.mode === "cloud-only" ||
      (Array.isArray(native.disabled_providers) &&
        native.disabled_providers.includes(providerId)) ||
      (Array.isArray(native.enabled_providers) && !native.enabled_providers.includes(providerId))
    )
      throw new Error(
        `configured role ${role} selects provider ${providerId} blocked by native provider restrictions (${plan.mode} effective filters)`,
      );
    const providers = isRecord(native.provider) ? native.provider : {};
    const provider = providers[providerId];
    const modelId = assignment.model.slice(providerId.length + 1);
    const absent =
      provider === undefined ||
      (isRecord(provider) &&
        (provider.models === undefined ||
          (isRecord(provider.models) && !Object.hasOwn(provider.models, modelId))));
    if (absent) {
      if (isRecord(provider)) {
        // Missing optional model metadata is not permission to ignore a conflicting
        // endpoint or malformed native provider. Validate those independently.
        const metadataOnly = structuredClone(native);
        const copiedProviders = metadataOnly.provider as UnknownRecord;
        delete (copiedProviders[providerId] as UnknownRecord).models;
        const single = structuredClone(plan);
        for (const other of FIXED_HARNESS_ROLES)
          if (other !== role) single.assignments[other] = null;
        validateNativeProviderCoherence(metadataOnly, single);
      }
      plan.assignments[role] = null;
      inheritRoles.push(role);
    }
  }
  // Validate existing provider shapes, endpoint agreement and explicit cloud routes
  // before interpreting network errors as optional-local unavailability.
  applyHarnessRoleModelOverrides(structuredClone(cfg), { routingDocument: routing }, plan);
  for (const role of FIXED_HARNESS_ROLES) {
    const assignment = plan.assignments[role];
    if (!assignment?.catalogName) continue;
    if (!available.has(assignment.model)) {
      const single = structuredClone(plan);
      for (const other of FIXED_HARNESS_ROLES) if (other !== role) single.assignments[other] = null;
      try {
        await assertLocalAssignmentsReady(routing, cfg, fetcher, timeoutMs, single);
        available.set(assignment.model, true);
      } catch {
        available.set(assignment.model, false);
      }
    }
    if (!available.get(assignment.model)) {
      plan.assignments[role] = null;
      inheritRoles.push(role);
    }
  }
  return { plan, inheritRoles };
}

export const HarnessRoleModelRoutingEnforcementPlugin = async (
  context: HarnessRoutingContext = {},
) => {
  let selectedDocument: unknown;
  let selection: Promise<Awaited<ReturnType<typeof selectAvailableRoleAssignments>>> | undefined;
  return {
    config: async (cfg: unknown) => {
      const policy = process.env.OPENCODE_HARNESS_LOCAL_READINESS;
      if (policy !== undefined && policy !== "required")
        throw new Error("OPENCODE_HARNESS_LOCAL_READINESS must be required when set");
      if (!selection) {
        selection = (async () => {
          selectedDocument = structuredClone(
            context.routingDocument ??
              loadRoutingConfigSelection({ configPath: resolveHarnessRoutingPath(context) })
                .document,
          );
          try {
            return await selectAvailableRoleAssignments(
              selectedDocument,
              cfg,
              policy === "required",
            );
          } catch (error) {
            const message = errorMessage(error);
            if (message.startsWith("Harness role model routing enforcement failed:")) throw error;
            throw new Error(`Harness role model routing enforcement failed: ${message}`);
          }
        })();
      }
      const selected = await selection;
      applyHarnessRoleModelOverrides(
        cfg,
        { ...context, routingDocument: selectedDocument },
        selected.plan,
      );
      for (const role of selected.inheritRoles) {
        const agent = mutableNativeConfig(cfg).agent?.[role];
        if (agent) delete agent.model;
      }
    },
  };
};

export function guardConfiguredDispatch(
  lifecycle: Awaited<ReturnType<typeof HarnessLifecyclePlugin>>,
  configure: (cfg: unknown) => Promise<void>,
) {
  let configurationError: Error | null = new Error(
    "Harness configuration hook has not completed; native plugin config capability is required",
  );
  return {
    "tool.execute.before": async (
      input: Parameters<(typeof lifecycle)["tool.execute.before"]>[0],
      output: Parameters<(typeof lifecycle)["tool.execute.before"]>[1],
    ) => {
      // Native OpenCode can log config-hook errors and continue. Do not silently
      // delegate using inherited routing after failed or absent configuration.
      if (String(input.tool).toLowerCase() === "task" && configurationError)
        throw new Error(`Harness dispatch blocked: ${configurationError.message}`);
      await lifecycle["tool.execute.before"](input, output);
    },
    config: async (cfg: unknown) => {
      try {
        await configure(cfg);
        configurationError = null;
      } catch (error) {
        configurationError = error instanceof Error ? error : new Error(String(error));
        throw configurationError;
      }
    },
  };
}
