import path from "node:path";
import { FIXED_HARNESS_ROLES, resolveAllHarnessRoleAssignments, validateNativeProviderCoherence, } from "../routing/routing-policy.mjs";
import { loadRoutingConfigSelection, selectImplicitRoutingConfig, } from "../routing/routing-config-loader.mjs";
export { FIXED_HARNESS_ROLES };
function isRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function mutableNativeConfig(value) {
    if (!isRecord(value))
        throw new Error("$.nativeConfig must be an object");
    return value;
}
function mutableAgent(config, role) {
    const value = config.agent?.[role];
    if (!isRecord(value))
        throw new Error(`$.nativeConfig.agent.${role} must be an object`);
    return value;
}
function projectPathFromContext(options) {
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
export function resolveHarnessRoutingPath(options = {}) {
    if (options.routingPath !== undefined)
        return path.resolve(options.routingPath);
    const runtime = runtimeRoot();
    return selectImplicitRoutingConfig(runtime
        ? { fallbackDirectory: path.join(runtime, "routing") }
        : { startPath: projectPathFromContext(options) }).path;
}
export function applyHarnessRoleModelOverrides(cfg, options = {}) {
    let plan;
    let native;
    try {
        const document = options.routingDocument !== undefined
            ? options.routingDocument
            : loadRoutingConfigSelection(runtimeRoot()
                ? {
                    configPath: options.routingPath,
                    fallbackDirectory: path.join(runtimeRoot() ?? "", "routing"),
                }
                : { configPath: options.routingPath, startPath: projectPathFromContext(options) }).document;
        plan = resolveAllHarnessRoleAssignments(document);
        // The shared plan resolves all role assignments and provider-class filters
        // before any native config mutation.
        validateNativeProviderCoherence(cfg, plan);
        native = mutableNativeConfig(cfg);
        for (const key of ["enabled_providers", "disabled_providers"]) {
            const value = native[key];
            if (value !== undefined &&
                (!Array.isArray(value) ||
                    value.some((value) => typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value))))
                throw new Error(`$.nativeConfig.${key} must be an array of provider IDs`);
        }
        const enabled = native.enabled_providers === undefined ? undefined : [...new Set(native.enabled_providers)];
        const disabled = [...new Set(native.disabled_providers ?? [])];
        if (plan.mode === "local-only") {
            plan.enabledProviders =
                enabled === undefined
                    ? plan.localProviders
                    : enabled.filter((provider) => plan.localProviders.includes(provider));
            plan.disabledProviders = disabled;
        }
        else if (plan.mode === "cloud-only") {
            plan.enabledProviders = enabled?.filter((provider) => !plan.localProviders.includes(provider));
            plan.disabledProviders = [...new Set([...disabled, ...plan.localProviders])].sort();
        }
        // Validate the effective filters after provider-class restrictions are added,
        // before any agent or native filter mutation.
        const effectiveEnabled = plan.enabledProviders ?? enabled;
        const effectiveDisabled = plan.disabledProviders ?? disabled;
        for (const [role, assignment] of Object.entries(plan.assignments)) {
            if (assignment === null)
                continue;
            const provider = assignment.model.split("/")[0];
            if (effectiveDisabled.includes(provider) ||
                (effectiveEnabled !== undefined && !effectiveEnabled.includes(provider)))
                throw new Error(`configured role ${role} selects provider ${provider} blocked by native provider restrictions (${plan.mode} effective filters)`);
        }
        if (plan.enabledProviders?.some((provider) => plan.disabledProviders?.includes(provider)))
            throw new Error("native provider filters would be contradictory");
    }
    catch (error) {
        const message = errorMessage(error);
        if (message.startsWith("Harness role model routing enforcement failed:"))
            throw error;
        throw new Error(`Harness role model routing enforcement failed: ${message}`);
    }
    // Preflight above covers every selected agent/provider/model/baseURL before
    // this atomic mutation phase. Provider objects are never written.
    for (const role of FIXED_HARNESS_ROLES) {
        const assignment = plan.assignments[role];
        if (assignment === null)
            continue;
        const agent = mutableAgent(native, role);
        agent.model = assignment.model;
        agent.mode = "subagent";
    }
    if (plan.mode === "local-only") {
        native.enabled_providers = plan.enabledProviders;
        native.disabled_providers = plan.disabledProviders;
    }
    else if (plan.mode === "cloud-only") {
        if (plan.enabledProviders !== undefined)
            native.enabled_providers = plan.enabledProviders;
        native.disabled_providers = plan.disabledProviders;
    }
    return plan;
}
export const HarnessRoleModelRoutingEnforcementPlugin = async (context = {}) => ({
    config: async (cfg) => {
        applyHarnessRoleModelOverrides(cfg, context);
    },
});
export function guardConfiguredDispatch(lifecycle, configure) {
    let configurationError = new Error("Harness configuration hook has not completed; native plugin config capability is required");
    return {
        "tool.execute.before": async (input, output) => {
            // Native OpenCode can log config-hook errors and continue. Do not silently
            // delegate using inherited routing after failed or absent configuration.
            if (String(input.tool).toLowerCase() === "task" && configurationError)
                throw new Error(`Harness dispatch blocked: ${configurationError.message}`);
            await lifecycle["tool.execute.before"](input, output);
        },
        config: async (cfg) => {
            try {
                await configure(cfg);
                configurationError = null;
            }
            catch (error) {
                configurationError = error instanceof Error ? error : new Error(String(error));
                throw configurationError;
            }
        },
    };
}
