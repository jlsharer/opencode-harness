export const FIXED_HARNESS_ROLES = Object.freeze([
    "researcher",
    "planner",
    "implementer",
    "validator",
]);
const ROLE_SET = new Set(FIXED_HARNESS_ROLES);
const ABSENT = new Set(["", "inherited", "not provided", "none", "null", "undefined"]);
const CATALOG_NAME = /^[a-z0-9][a-z0-9-]*$/;
function fail(path, message) {
    throw new Error(`Invalid harness model routing v2 at ${path}: ${message}`);
}
function object(value, path) {
    if (value === null || typeof value !== "object" || Array.isArray(value))
        fail(path, "must be an object");
    return value;
}
function exactKeys(value, allowed, required, path) {
    const keys = Object.keys(value);
    for (const key of keys)
        if (!allowed.includes(key))
            fail(`${path}.${key}`, "unknown property");
    for (const key of required)
        if (!Object.hasOwn(value, key))
            fail(`${path}.${key}`, "is required");
}
function nullableString(value, path) {
    if (value === null)
        return null;
    if (typeof value !== "string" || value.trim() === "")
        fail(path, "must be null or a nonblank string");
    return value.trim();
}
function boolean(value, path) {
    if (typeof value !== "boolean")
        fail(path, "must be a boolean");
    return value;
}
function model(value, path, nullable = true) {
    const normalized = nullableString(value, path);
    if (normalized === null && nullable)
        return null;
    if (normalized === null || !/^[^/\s]+\/[^\s]+$/.test(normalized)) {
        fail(path, "must be provider-prefixed as provider/model");
    }
    return normalized;
}
function canonicalUrl(value, path) {
    if (typeof value !== "string" || value.trim() === "")
        fail(path, "must be a nonblank absolute HTTP(S) URL");
    let parsed;
    try {
        parsed = new URL(value);
    }
    catch {
        fail(path, "must be an absolute HTTP(S) URL");
    }
    if (!["http:", "https:"].includes(parsed.protocol))
        fail(path, "must use HTTP or HTTPS");
    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
        fail(path, "must not contain credentials, query, or fragment");
    }
    return value.trim().replace(/\/+$/, "");
}
function normalizeEntry(value, path, keys) {
    const entry = object(value, path);
    exactKeys(entry, keys, keys, path);
    const out = {};
    for (const key of keys) {
        out[key] =
            key === "model"
                ? model(entry[key], `${path}.model`)
                : nullableString(entry[key], `${path}.${key}`);
    }
    return { model: out.model ?? null, variant: out.variant ?? null };
}
function legacyError(path) {
    fail(path, "legacy local routing is not supported; migrate to v2 localRouting.models and " +
        "defaultLocalModel, choose enabled and forceLocalForHarnessSubagents explicitly, " +
        "configure native providers externally, remove legacy keys, validate, then quit and " +
        "restart OpenCode");
}
export function normalizeAndValidateRoutingConfig(document) {
    const root = object(document, "$");
    const wrapped = Object.hasOwn(root, "harnessModelRouting");
    if (wrapped) {
        exactKeys(root, ["harnessModelRouting"], ["harnessModelRouting"], "$");
    }
    const value = object(wrapped ? root.harnessModelRouting : root, "$.harnessModelRouting");
    for (const key of [
        "localModel",
        "routingServiceUrl",
        "localModelEnabled",
        "preferLocal",
        "localModelFallback",
    ]) {
        if (Object.hasOwn(value, key))
            legacyError(`$.harnessModelRouting.${key}`);
    }
    const rootKeys = [
        "schemaVersion",
        "providerClassMode",
        "defaultMode",
        "defaultModel",
        "singleModel",
        "localRouting",
        "roleOverrides",
        "commandOverrides",
        "orchestratorCommands",
        "complexityTiers",
    ];
    exactKeys(value, rootKeys, rootKeys, "$.harnessModelRouting");
    if (value.schemaVersion !== "2.0.0")
        fail("$.harnessModelRouting.schemaVersion", 'must equal "2.0.0"');
    if (typeof value.providerClassMode !== "string" ||
        !["mixed", "local-only", "cloud-only"].includes(value.providerClassMode))
        fail("$.harnessModelRouting.providerClassMode", "must be mixed, local-only, or cloud-only");
    if (typeof value.defaultMode !== "string" || value.defaultMode.trim() === "")
        fail("$.harnessModelRouting.defaultMode", "must be a nonblank string");
    const single = object(value.singleModel, "$.harnessModelRouting.singleModel");
    exactKeys(single, ["enabled", "model"], ["enabled", "model"], "$.harnessModelRouting.singleModel");
    const normalizedSingle = {
        enabled: boolean(single.enabled, "$.harnessModelRouting.singleModel.enabled"),
        model: model(single.model, "$.harnessModelRouting.singleModel.model"),
    };
    if (normalizedSingle.enabled && normalizedSingle.model === null)
        fail("$.harnessModelRouting.singleModel.model", "must be non-null when singleModel.enabled is true");
    const local = object(value.localRouting, "$.harnessModelRouting.localRouting");
    exactKeys(local, ["enabled", "forceLocalForHarnessSubagents", "defaultLocalModel", "models"], ["enabled", "forceLocalForHarnessSubagents", "defaultLocalModel", "models"], "$.harnessModelRouting.localRouting");
    const localEnabled = boolean(local.enabled, "$.harnessModelRouting.localRouting.enabled");
    const forceLocal = boolean(local.forceLocalForHarnessSubagents, "$.harnessModelRouting.localRouting.forceLocalForHarnessSubagents");
    if (forceLocal && !localEnabled)
        fail("$.harnessModelRouting.localRouting", "forceLocalForHarnessSubagents:true requires enabled:true");
    if (forceLocal !== (value.providerClassMode === "local-only"))
        fail("$.harnessModelRouting.localRouting.forceLocalForHarnessSubagents", "must be true exactly when providerClassMode is local-only");
    if (value.providerClassMode !== "mixed" && !localEnabled)
        fail("$.harnessModelRouting.localRouting.enabled", "strict provider class modes require enabled:true and a catalog");
    const models = object(local.models, "$.harnessModelRouting.localRouting.models");
    if (localEnabled && Object.keys(models).length === 0)
        fail("$.harnessModelRouting.localRouting.models", "must contain at least one catalog entry when localRouting.enabled is true");
    const normalizedModels = {};
    const seenModels = new Set();
    const providerUrls = new Map();
    const urlBudgets = new Map();
    for (const name of Object.keys(models).sort()) {
        if (!CATALOG_NAME.test(name))
            fail(`$.harnessModelRouting.localRouting.models.${name}`, "catalog name must match ^[a-z0-9][a-z0-9-]*$");
        const entry = object(models[name], `$.harnessModelRouting.localRouting.models.${name}`);
        exactKeys(entry, ["model", "routingServiceUrl", "maxInFlight"], ["model", "routingServiceUrl", "maxInFlight"], `$.harnessModelRouting.localRouting.models.${name}`);
        const normalizedModel = model(entry.model, `$.harnessModelRouting.localRouting.models.${name}.model`, false);
        if (seenModels.has(normalizedModel))
            fail(`$.harnessModelRouting.localRouting.models.${name}.model`, "catalog models must be unique");
        seenModels.add(normalizedModel);
        const url = canonicalUrl(entry.routingServiceUrl, `$.harnessModelRouting.localRouting.models.${name}.routingServiceUrl`);
        if (typeof entry.maxInFlight !== "number" ||
            !Number.isInteger(entry.maxInFlight) ||
            entry.maxInFlight < 1)
            fail(`$.harnessModelRouting.localRouting.models.${name}.maxInFlight`, "must be an integer of at least 1");
        const provider = normalizedModel.slice(0, normalizedModel.indexOf("/"));
        if (providerUrls.has(provider) && providerUrls.get(provider) !== url)
            fail(`$.harnessModelRouting.localRouting.models.${name}`, `provider "${provider}" maps to more than one canonical URL`);
        providerUrls.set(provider, url);
        if (urlBudgets.has(url) && urlBudgets.get(url) !== entry.maxInFlight)
            fail(`$.harnessModelRouting.localRouting.models.${name}`, "catalog entries sharing a canonical URL must have equal maxInFlight");
        urlBudgets.set(url, entry.maxInFlight);
        normalizedModels[name] = {
            model: normalizedModel,
            routingServiceUrl: url,
            maxInFlight: entry.maxInFlight,
        };
    }
    const defaultLocalModel = nullableString(local.defaultLocalModel, "$.harnessModelRouting.localRouting.defaultLocalModel");
    if (defaultLocalModel !== null && !Object.hasOwn(normalizedModels, defaultLocalModel))
        fail("$.harnessModelRouting.localRouting.defaultLocalModel", "must reference localRouting.models");
    const roles = object(value.roleOverrides, "$.harnessModelRouting.roleOverrides");
    const actualRoles = Object.keys(roles).sort();
    const expectedRoles = [...FIXED_HARNESS_ROLES].sort();
    if (actualRoles.length !== expectedRoles.length ||
        actualRoles.some((role, index) => role !== expectedRoles[index])) {
        fail("$.harnessModelRouting.roleOverrides", `must contain exactly the four harness roles: ${FIXED_HARNESS_ROLES.join(", ")}`);
    }
    const normalizedRoles = {};
    for (const role of FIXED_HARNESS_ROLES) {
        const entry = object(roles[role], `$.harnessModelRouting.roleOverrides.${role}`);
        exactKeys(entry, ["model", "localModel", "variant"], ["model", "localModel", "variant"], `$.harnessModelRouting.roleOverrides.${role}`);
        const nativeModel = model(entry.model, `$.harnessModelRouting.roleOverrides.${role}.model`);
        const localModel = nullableString(entry.localModel, `$.harnessModelRouting.roleOverrides.${role}.localModel`);
        if (localModel !== null && !Object.hasOwn(normalizedModels, localModel))
            fail(`$.harnessModelRouting.roleOverrides.${role}.localModel`, "must reference localRouting.models");
        if (nativeModel !== null && localModel !== null)
            fail(`$.harnessModelRouting.roleOverrides.${role}`, "model and localModel are mutually exclusive when non-null");
        normalizedRoles[role] = {
            model: nativeModel,
            localModel,
            variant: nullableString(entry.variant, `$.harnessModelRouting.roleOverrides.${role}.variant`),
        };
    }
    if (value.providerClassMode === "cloud-only") {
        if (defaultLocalModel !== null ||
            Object.values(normalizedRoles).some((entry) => entry.localModel !== null)) {
            fail("$.harnessModelRouting", "cloud-only must not contain local role assignments");
        }
    }
    const commands = object(value.commandOverrides, "$.harnessModelRouting.commandOverrides");
    const normalizedCommands = {};
    for (const command of Object.keys(commands).sort()) {
        if (!command.startsWith("/"))
            fail(`$.harnessModelRouting.commandOverrides.${command}`, "command keys must start with /");
        const entry = object(commands[command], `$.harnessModelRouting.commandOverrides.${command}`);
        exactKeys(entry, ["agent", "model", "variant"], ["agent", "model", "variant"], `$.harnessModelRouting.commandOverrides.${command}`);
        if (typeof entry.agent !== "string" || !ROLE_SET.has(entry.agent))
            fail(`$.harnessModelRouting.commandOverrides.${command}.agent`, "must name a fixed harness role");
        normalizedCommands[command] = {
            agent: entry.agent,
            model: model(entry.model, `$.harnessModelRouting.commandOverrides.${command}.model`),
            variant: nullableString(entry.variant, `$.harnessModelRouting.commandOverrides.${command}.variant`),
        };
    }
    const orchestrators = object(value.orchestratorCommands, "$.harnessModelRouting.orchestratorCommands");
    const normalizedOrchestrators = {};
    for (const command of Object.keys(orchestrators).sort()) {
        if (!command.startsWith("/"))
            fail(`$.harnessModelRouting.orchestratorCommands.${command}`, "command keys must start with /");
        const entry = object(orchestrators[command], `$.harnessModelRouting.orchestratorCommands.${command}`);
        exactKeys(entry, ["owner", "agent", "model", "variant"], ["owner", "agent", "model", "variant"], `$.harnessModelRouting.orchestratorCommands.${command}`);
        if (entry.owner !== "orchestrator" || entry.agent !== null)
            fail(`$.harnessModelRouting.orchestratorCommands.${command}`, 'must have owner "orchestrator" and agent null');
        normalizedOrchestrators[command] = {
            owner: "orchestrator",
            agent: null,
            model: model(entry.model, `$.harnessModelRouting.orchestratorCommands.${command}.model`),
            variant: nullableString(entry.variant, `$.harnessModelRouting.orchestratorCommands.${command}.variant`),
        };
    }
    const tiers = object(value.complexityTiers, "$.harnessModelRouting.complexityTiers");
    const normalizedTiers = {};
    for (const name of Object.keys(tiers).sort())
        normalizedTiers[name] = normalizeEntry(tiers[name], `$.harnessModelRouting.complexityTiers.${name}`, ["model", "variant"]);
    return {
        schemaVersion: "2.0.0",
        providerClassMode: value.providerClassMode,
        defaultMode: value.defaultMode.trim(),
        defaultModel: model(value.defaultModel, "$.harnessModelRouting.defaultModel"),
        singleModel: normalizedSingle,
        localRouting: {
            enabled: localEnabled,
            forceLocalForHarnessSubagents: forceLocal,
            defaultLocalModel,
            models: normalizedModels,
        },
        roleOverrides: normalizedRoles,
        commandOverrides: normalizedCommands,
        orchestratorCommands: normalizedOrchestrators,
        complexityTiers: normalizedTiers,
    };
}
function present(value) {
    return (value !== undefined &&
        value !== null &&
        (typeof value !== "string" || !ABSENT.has(value.trim().toLowerCase())));
}
function requestString(value, path) {
    if (!present(value))
        return null;
    if (typeof value !== "string" || value.trim() === "")
        fail(path, "must be a nonblank string when present");
    return value.trim();
}
function requestModelAlias(request) {
    const aliases = [
        ["explicitModel", request.explicitModel],
        ["providerModel", request.providerModel],
        ["model", request.model],
    ];
    const presentAliases = [];
    for (const [name, value] of aliases) {
        const normalized = requestString(value, `$.request.${name}`);
        if (normalized !== null)
            presentAliases.push([name, normalized]);
    }
    const distinct = new Set(presentAliases.map(([, value]) => value));
    if (distinct.size > 1) {
        fail("$.request", `conflicting explicit model aliases: ${presentAliases.map(([name]) => name).join(", ")}`);
    }
    return presentAliases[0]?.[1] ?? null;
}
function sourceValue(candidates, property) {
    for (const candidate of candidates) {
        const value = candidate.entry?.[property];
        if (present(value))
            return { value: value ?? null, source: candidate.source };
    }
    return { value: null, source: null };
}
export function resolveRoutingDecision({ config, request = {}, } = {}) {
    const routing = normalizeAndValidateRoutingConfig(config);
    object(request, "$.request");
    const commandRaw = requestString(request.command, "$.request.command");
    const command = commandRaw === null ? null : commandRaw.startsWith("/") ? commandRaw : `/${commandRaw}`;
    const explicitAgent = requestString(request.agent, "$.request.agent");
    const explicitRole = requestString(request.role, "$.request.role");
    const commandEntry = command === null ? null : (routing.commandOverrides[command] ?? null);
    const orchestratorEntry = command === null ? null : (routing.orchestratorCommands[command] ?? null);
    const locked = commandEntry?.agent ?? null;
    if (locked !== null) {
        for (const [label, target] of [
            ["agent", explicitAgent],
            ["role", explicitRole],
        ]) {
            if (target !== null && target !== locked)
                fail(`$.request.${label}`, `conflicts with fixed command target "${locked}"`);
        }
    }
    else if (explicitAgent !== null && explicitRole !== null && explicitAgent !== explicitRole) {
        fail("$.request", "agent and role conflict");
    }
    // Fixed-command target conflicts are resolved before any model evaluation.
    // Model aliases are then checked in precedence order after absence sentinels
    // are removed. Equal present aliases are accepted; distinct present aliases
    // fail closed rather than being silently discarded.
    const explicitModel = requestModelAlias(request);
    const explicitVariant = requestString(request.variant, "$.request.variant");
    const complexity = requestString(request.complexity, "$.request.complexity");
    const agent = locked ?? explicitAgent ?? explicitRole;
    const agentSource = locked !== null
        ? "commandOverride"
        : explicitAgent !== null
            ? "request"
            : explicitRole !== null
                ? "requestRole"
                : null;
    const fixedRole = agent !== null && ROLE_SET.has(agent) ? agent : null;
    const roleEntry = fixedRole === null ? null : routing.roleOverrides[fixedRole];
    const tierEntry = complexity === null ? null : routing.complexityTiers[complexity];
    const candidates = [
        { entry: orchestratorEntry, source: "orchestratorCommand" },
        { entry: commandEntry, source: "commandOverride" },
        { entry: roleEntry, source: "roleOverride" },
        { entry: tierEntry, source: "complexityTier" },
    ];
    const variant = explicitVariant !== null
        ? { value: explicitVariant, source: "userExplicitOverride" }
        : sourceValue(candidates, "variant");
    const force = routing.localRouting.enabled &&
        routing.localRouting.forceLocalForHarnessSubagents &&
        agent !== null &&
        ROLE_SET.has(agent);
    let resolvedModel = null;
    let modelSource = null;
    let catalogName = null;
    if (force) {
        catalogName = roleEntry?.localModel ?? routing.localRouting.defaultLocalModel;
        if (catalogName === null || !routing.localRouting.models[catalogName])
            fail("$.harnessModelRouting.localRouting", `force-local target "${agent}" has no valid local catalog selection`);
        resolvedModel = routing.localRouting.models[catalogName]?.model ?? null;
        modelSource = roleEntry?.localModel !== null ? "roleLocalModel" : "defaultLocalModel";
        if (explicitModel !== null && explicitModel !== resolvedModel)
            fail("$.request.model", `force-local target requires exact model "${resolvedModel}"`);
        if (explicitModel !== null)
            modelSource = "userExplicitOverride";
    }
    else if (explicitModel !== null) {
        resolvedModel = explicitModel;
        modelSource = "userExplicitOverride";
    }
    else {
        const normalCandidates = [
            { entry: orchestratorEntry, source: "orchestratorCommand" },
            { entry: commandEntry, source: "commandOverride" },
        ];
        const beforeRole = sourceValue(normalCandidates, "model");
        if (beforeRole.value !== null)
            ({ value: resolvedModel, source: modelSource } = beforeRole);
        else if (routing.localRouting.enabled &&
            roleEntry?.localModel !== null &&
            roleEntry?.localModel !== undefined) {
            catalogName = roleEntry.localModel;
            resolvedModel = routing.localRouting.models[catalogName]?.model ?? null;
            modelSource = "roleLocalModel";
        }
        else if (roleEntry?.model !== null && roleEntry?.model !== undefined) {
            resolvedModel = roleEntry.model;
            modelSource = "roleOverride";
        }
        else {
            const afterRole = sourceValue([{ entry: tierEntry, source: "complexityTier" }], "model");
            if (afterRole.value !== null)
                ({ value: resolvedModel, source: modelSource } = afterRole);
            else if (routing.singleModel.enabled) {
                resolvedModel = routing.singleModel.model;
                modelSource = "singleModel";
            }
            else if (routing.defaultModel !== null) {
                resolvedModel = routing.defaultModel;
                modelSource = "defaultModel";
            }
        }
    }
    if (routing.localRouting.enabled && catalogName === null && resolvedModel !== null) {
        catalogName =
            Object.keys(routing.localRouting.models).find((name) => routing.localRouting.models[name]?.model === resolvedModel) ?? null;
    }
    const catalog = catalogName === null ? null : routing.localRouting.models[catalogName];
    const overallSource = explicitModel !== null || explicitVariant !== null
        ? "userExplicitOverride"
        : orchestratorEntry !== null
            ? "orchestratorCommand"
            : commandEntry !== null
                ? "commandOverride"
                : (modelSource ?? variant.source ?? agentSource ?? "unresolved");
    return {
        schemaVersion: "2.0.0",
        agent: agent ?? null,
        model: resolvedModel,
        variant: variant.value,
        source: overallSource,
        sources: { agent: agentSource, model: modelSource, variant: variant.source },
        local: {
            enforced: force,
            catalogName,
            routingServiceUrl: catalog?.routingServiceUrl ?? null,
            maxInFlight: catalog?.maxInFlight ?? null,
            networkCalls: false,
        },
    };
}
export function resolveAllHarnessRoleAssignments(config) {
    const routing = normalizeAndValidateRoutingConfig(config);
    const assignments = {};
    for (const role of FIXED_HARNESS_ROLES) {
        const override = routing.roleOverrides[role];
        if (routing.providerClassMode === "mixed" && override.model !== null) {
            assignments[role] = {
                model: override.model,
                catalogName: null,
                routingServiceUrl: null,
                maxInFlight: null,
            };
        }
        else if (routing.providerClassMode !== "cloud-only" &&
            routing.localRouting.enabled &&
            (override.localModel !== null || routing.localRouting.defaultLocalModel !== null)) {
            const catalogName = override.localModel ?? routing.localRouting.defaultLocalModel;
            const catalog = catalogName === null ? null : routing.localRouting.models[catalogName];
            if (!catalog)
                fail(`$.harnessModelRouting.roleOverrides.${role}`, "local role mapping requires a catalog-backed role or default selection");
            assignments[role] = {
                model: catalog.model,
                catalogName,
                routingServiceUrl: catalog.routingServiceUrl,
                maxInFlight: catalog.maxInFlight,
            };
        }
        else if (routing.providerClassMode !== "cloud-only" && override.model !== null) {
            assignments[role] = {
                model: override.model,
                catalogName: null,
                routingServiceUrl: null,
                maxInFlight: null,
            };
        }
        else
            assignments[role] = null;
    }
    const localProviders = [
        ...new Set(Object.values(routing.localRouting.models).map((entry) => entry.model.split("/")[0] ?? "")),
    ].sort();
    if (routing.providerClassMode === "local-only" &&
        (localProviders.length === 0 ||
            Object.values(assignments).some((entry) => entry === null || entry.catalogName === null))) {
        fail("$.harnessModelRouting", "local-only requires a nonempty catalog and four catalog-backed role assignments");
    }
    return { schemaVersion: "2.0.0", mode: routing.providerClassMode, localProviders, assignments };
}
export function validateNativeProviderCoherence(nativeConfig, assignmentPlan) {
    const native = object(nativeConfig, "$.nativeConfig");
    object(assignmentPlan, "$.assignmentPlan");
    const evidence = {};
    for (const role of FIXED_HARNESS_ROLES) {
        const assignment = assignmentPlan.assignments?.[role];
        if (assignment == null) {
            evidence[role] = null;
            continue;
        }
        const agents = native.agent === undefined ? undefined : object(native.agent, "$.nativeConfig.agent");
        const agent = agents?.[role];
        const agentRecord = agent === undefined ? undefined : object(agent, `$.nativeConfig.agent.${role}`);
        if (!agentRecord || !["subagent", "all"].includes(String(agentRecord.mode)))
            fail(`$.nativeConfig.agent.${role}`, "must exist with subagent-compatible mode");
        const slash = assignment.model.indexOf("/");
        const providerName = assignment.model.slice(0, slash);
        const modelName = assignment.model.slice(slash + 1);
        const providers = native.provider === undefined
            ? undefined
            : object(native.provider, "$.nativeConfig.provider");
        const providerValue = providers?.[providerName];
        const provider = providerValue === undefined
            ? undefined
            : object(providerValue, `$.nativeConfig.provider.${providerName}`);
        if (!provider)
            fail(`$.nativeConfig.provider.${providerName}`, `is required by role "${role}"`);
        if (provider.models !== undefined) {
            const models = object(provider.models, `$.nativeConfig.provider.${providerName}.models`);
            if (!Object.hasOwn(models, modelName))
                fail(`$.nativeConfig.provider.${providerName}.models.${modelName}`, `is required by role "${role}"`);
        }
        let baseURL = null;
        if (assignment.catalogName !== null) {
            baseURL = canonicalUrl(provider.options === undefined
                ? undefined
                : object(provider.options, `$.nativeConfig.provider.${providerName}.options`).baseURL, `$.nativeConfig.provider.${providerName}.options.baseURL`);
            if (baseURL !== assignment.routingServiceUrl)
                fail(`$.nativeConfig.provider.${providerName}.options.baseURL`, `must equal catalog URL "${assignment.routingServiceUrl}"`);
        }
        evidence[role] = {
            provider: providerName,
            model: modelName,
            baseURL,
            catalogName: assignment.catalogName,
        };
    }
    return { schemaVersion: "2.0.0", providers: evidence };
}
