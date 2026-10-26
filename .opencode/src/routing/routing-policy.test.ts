import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile, spawnSync } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  FIXED_HARNESS_ROLES,
  normalizeAndValidateRoutingConfig,
  resolveAllHarnessRoleAssignments,
  resolveRoutingDecision,
  validateNativeProviderCoherence,
} from "./routing-policy.ts";
import type { HarnessRole, LocalCatalogModel, NormalizedRoutingConfig } from "./routing-policy.ts";
import { HarnessPlugin } from "../plugins/index.ts";
import { resolveModelForRole } from "./model-routing-helper.ts";
import {
  loadRoutingConfigSelection,
  mergeExternalRoutingDocuments,
  selectImplicitRoutingConfig,
} from "./routing-config-loader.ts";
import { loadRoutingConfig, parseArgs } from "./resolve-model-routing.ts";
import {
  applyHarnessRoleModelOverrides,
  assertLocalAssignmentsReady,
  selectAvailableRoleAssignments,
  HarnessRoleModelRoutingEnforcementPlugin,
  resolveHarnessRoutingPath,
} from "../plugin-modules/role-model-routing-enforcement.ts";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_DIR =
  path.basename(path.dirname(DIR)) === "src" ? path.resolve(DIR, "../../routing") : DIR;
const EXAMPLE_PATH = path.join(CONFIG_DIR, "harness-model-routing.example.json");
const LOCAL_EXAMPLE_PATH = path.join(CONFIG_DIR, "harness-model-routing.local.example.json");

function parseRoutingDocument(pathname: string): { harnessModelRouting: NormalizedRoutingConfig } {
  const parsed: unknown = JSON.parse(fs.readFileSync(pathname, "utf8"));
  return { harnessModelRouting: normalizeAndValidateRoutingConfig(parsed) };
}

const committed = parseRoutingDocument(EXAMPLE_PATH);
const localCommitted = parseRoutingDocument(LOCAL_EXAMPLE_PATH);

const clone = <Value>(value: Value): Value => JSON.parse(JSON.stringify(value)) as Value;

function required<Value>(value: Value): NonNullable<Value> {
  assert.notEqual(value, undefined);
  assert.notEqual(value, null);
  return value as NonNullable<Value>;
}

function errorIncludes(error: unknown, ...fragments: string[]): boolean {
  return error instanceof Error && fragments.every((fragment) => error.message.includes(fragment));
}

function unknownRecord(value: unknown): Record<string, unknown> {
  assert.ok(value !== null && typeof value === "object" && !Array.isArray(value));
  return value as Record<string, unknown>;
}

function nestedValue(value: unknown, keys: readonly string[]): unknown {
  let current = value;
  for (const key of keys) {
    if (current === null || typeof current !== "object" || Array.isArray(current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

const neutralRouting = () => clone(committed.harnessModelRouting);

const routing = () => clone(localCommitted.harnessModelRouting);

interface ExternalCatalog {
  schemaVersion: "1.0.0";
  models: Record<string, LocalCatalogModel>;
}

type ExternalProfile = Omit<NormalizedRoutingConfig, "localRouting"> & {
  localRouting: Omit<NormalizedRoutingConfig["localRouting"], "models">;
};

function externalPair() {
  const normalized = neutralRouting();
  const models: Record<string, LocalCatalogModel> = {
    "ai-infra-research": {
      model: "ai-infra-research/research-model",
      routingServiceUrl: "http://127.0.0.1:8080/v1",
      maxInFlight: 1,
    },
    "ai-infra-coder": {
      model: "ai-infra-coder/coder-model",
      routingServiceUrl: "http://127.0.0.1:8081/v1",
      maxInFlight: 2,
    },
  };
  const { models: _models, ...localRouting } = normalized.localRouting;
  const profile: ExternalProfile = { ...normalized, localRouting };
  profile.localRouting.enabled = true;
  profile.localRouting.forceLocalForHarnessSubagents = false;
  profile.localRouting.defaultLocalModel = "ai-infra-coder";
  for (const [role, value] of Object.entries(profile.roleOverrides))
    value.localModel = role === "researcher" ? "ai-infra-research" : "ai-infra-coder";
  const catalog: ExternalCatalog = { schemaVersion: "1.0.0", models };
  return { catalog, profile };
}

const execFileAsync = promisify(execFile);

function deepFreeze<Value>(value: Value): Value {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function forceConfig() {
  const config = routing();
  config.providerClassMode = "local-only";
  config.localRouting.forceLocalForHarnessSubagents = true;
  return config;
}

interface NativeTestAgent {
  mode: string;
  marker?: HarnessRole;
  model?: string;
}

interface NativeTestProvider {
  options: { baseURL: string };
  models: Record<string, { name: string }>;
}

interface NativeTestConfig {
  agent: Record<string, NativeTestAgent>;
  provider: Record<string, NativeTestProvider>;
  enabled_providers?: string[];
  disabled_providers?: string[];
}

function nativeConfig(): NativeTestConfig {
  return {
    agent: Object.fromEntries(
      FIXED_HARNESS_ROLES.map((role) => [role, { mode: "subagent", marker: role }]),
    ),
    provider: {
      "llamacpp-research": {
        options: { baseURL: "http://127.0.0.1:8080/v1/" },
        models: { "qwen2.5-7b-instruct": { name: "illustrative" } },
      },
      "llamacpp-coder": {
        options: { baseURL: "http://127.0.0.1:8081/v1" },
        models: { "qwen2.5-coder-7b": { name: "illustrative" } },
      },
    },
  };
}

function writePair(root: string, { custom, example }: { custom?: string; example?: string } = {}) {
  const routingDir = path.join(root, ".opencode/routing");
  fs.mkdirSync(routingDir, { recursive: true });
  if (custom !== undefined)
    fs.writeFileSync(path.join(routingDir, "harness-model-routing.json"), custom);
  if (example !== undefined)
    fs.writeFileSync(path.join(routingDir, "harness-model-routing.example.json"), example);
  return routingDir;
}

function copyRoutingBundle(routingDir: string) {
  fs.mkdirSync(routingDir, { recursive: true });
  for (const name of [
    "routing-policy.mjs",
    "routing-config-loader.mjs",
    "model-routing-helper.mjs",
    "resolve-model-routing.mjs",
    "harness-model-routing.example.json",
  ]) {
    fs.copyFileSync(path.join(CONFIG_DIR, name), path.join(routingDir, name));
  }
}

function createDirectoryAlias(target: string, alias: string) {
  fs.symlinkSync(target, alias, process.platform === "win32" ? "junction" : "dir");
}

test("committed example config is strict v2, normalized freshly, and deterministic", () => {
  const input = deepFreeze(clone(committed));
  const first = normalizeAndValidateRoutingConfig(input);
  const second = normalizeAndValidateRoutingConfig(input);
  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.equal(first.schemaVersion, "2.0.0");
  assert.equal(first.localRouting.enabled, false);
  assert.equal(first.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(first.localRouting.defaultLocalModel, null);
  assert.deepEqual(first.localRouting.models, {});
  assert.ok(FIXED_HARNESS_ROLES.every((role) => first.roleOverrides[role].localModel === null));
  assert.deepEqual(Object.keys(first.roleOverrides), FIXED_HARNESS_ROLES);
});

test("separate local example is a valid enabled advisory fixture", () => {
  const normalized = normalizeAndValidateRoutingConfig(deepFreeze(clone(localCommitted)));
  assert.equal(normalized.localRouting.enabled, true);
  assert.equal(normalized.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(normalized.localRouting.defaultLocalModel, "qwen-coder");
  assert.equal(Object.keys(normalized.localRouting.models).length, 2);
});

test("external catalog and profile merge deterministically without mutating inputs", () => {
  const fixture = externalPair();
  const catalog = deepFreeze(fixture.catalog);
  const profile = fixture.profile;
  deepFreeze(profile);
  const merged = mergeExternalRoutingDocuments(catalog, profile);
  const normalized = normalizeAndValidateRoutingConfig(merged);
  assert.deepEqual(normalized.localRouting.models, catalog.models);
  assert.equal(normalized.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(Object.hasOwn(profile.localRouting, "models"), false);
});

test("external profile rejects embedded models, force mode, provider fields, and unknown references", () => {
  const { catalog, profile } = externalPair();
  assert.throws(
    () => mergeExternalRoutingDocuments(catalog, { ...profile, provider: {} }),
    /provider is forbidden/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(catalog, {
        ...profile,
        localRouting: { ...profile.localRouting, models: {} },
      }),
    /models is forbidden/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(catalog, {
        ...profile,
        localRouting: { ...profile.localRouting, forceLocalForHarnessSubagents: true },
      }),
    /contradicts providerClassMode/,
  );
  const unknown = clone(profile);
  unknown.localRouting.defaultLocalModel = "missing";
  assert.throws(
    () => normalizeAndValidateRoutingConfig(mergeExternalRoutingDocuments(catalog, unknown)),
    /must reference/,
  );
});

test("external catalog rejects non-ai-infra keys, prefix mismatch, non-loopback URLs, bad ports, and budget overflow", () => {
  const { catalog, profile } = externalPair();
  const mutate = (fn: (value: ExternalCatalog) => void) => {
    const value = clone(catalog);
    fn(value);
    return value;
  };
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(
        mutate((value) => {
          value.models.bad = required(value.models["ai-infra-coder"]);
          delete value.models["ai-infra-coder"];
        }),
        profile,
      ),
    /invalid key/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(
        mutate((value) => {
          required(value.models["ai-infra-coder"]).model = "ai-infra-other/model";
        }),
        profile,
      ),
    /provider prefix/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(
        mutate((value) => {
          required(value.models["ai-infra-coder"]).routingServiceUrl = "http://localhost:8081/v1";
        }),
        profile,
      ),
    /loopback/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(
        mutate((value) => {
          required(value.models["ai-infra-coder"]).routingServiceUrl = "http://127.0.0.1:65536/v1";
        }),
        profile,
      ),
    /invalid|range/,
  );
  assert.throws(
    () =>
      mergeExternalRoutingDocuments(
        mutate((value) => {
          required(value.models["ai-infra-coder"]).maxInFlight = 2147483648;
        }),
        profile,
      ),
    /out of range/,
  );
});

test("neutral routing resolves fixed command and variant without local identity", () => {
  const decision = resolveRoutingDecision({
    config: committed,
    request: { command: "/delegate-implement" },
  });
  assert.equal(decision.agent, "implementer");
  assert.equal(decision.model, null);
  assert.equal(decision.variant, null);
  assert.deepEqual(decision.local, {
    enforced: false,
    catalogName: null,
    routingServiceUrl: null,
    maxInFlight: null,
    networkCalls: false,
  });
});

test("disabled local routing accepts empty state and keeps dormant catalog and selectors inert", () => {
  const empty = normalizeAndValidateRoutingConfig(neutralRouting());
  assert.deepEqual(empty.localRouting.models, {});

  const dormant = routing();
  dormant.localRouting.enabled = false;
  const localModel = required(dormant.localRouting.models["qwen-coder"]).model;
  const roleDecision = resolveRoutingDecision({
    config: dormant,
    request: { role: "implementer" },
  });
  assert.equal(roleDecision.model, null);
  assert.deepEqual(roleDecision.local, {
    enforced: false,
    catalogName: null,
    routingServiceUrl: null,
    maxInFlight: null,
    networkCalls: false,
  });
  const explicitDecision = resolveRoutingDecision({
    config: dormant,
    request: { role: "implementer", model: localModel },
  });
  assert.equal(explicitDecision.model, localModel);
  assert.equal(explicitDecision.local.catalogName, null);
  assert.equal(explicitDecision.local.routingServiceUrl, null);
  assert.equal(explicitDecision.local.maxInFlight, null);
});

test("enabled local routing rejects an empty catalog and schema encodes the same condition", () => {
  const enabledEmpty = neutralRouting();
  enabledEmpty.localRouting.enabled = true;
  assert.throws(
    () => normalizeAndValidateRoutingConfig(enabledEmpty),
    /at least one catalog entry when localRouting.enabled is true/,
  );
  const schema = unknownRecord(
    JSON.parse(
      fs.readFileSync(
        path.join(CONFIG_DIR, "../schemas/harness-model-routing.schema.json"),
        "utf8",
      ),
    ),
  );
  const definitions = unknownRecord(schema.$defs);
  const routingSchema = unknownRecord(definitions.routing);
  const properties = unknownRecord(routingSchema.properties);
  const localRoutingSchema = unknownRecord(properties.localRouting);
  const localProperties = unknownRecord(localRoutingSchema.properties);
  const modelsSchema = unknownRecord(localProperties.models);
  const conditions = localRoutingSchema.allOf;
  assert.ok(Array.isArray(conditions));
  assert.ok(
    conditions.some((condition: unknown) => {
      return (
        nestedValue(condition, ["if", "properties", "enabled", "const"]) === true &&
        nestedValue(condition, ["then", "properties", "models", "minProperties"]) === 1
      );
    }),
  );
  assert.equal(modelsSchema.minProperties, undefined);
});

test("force plan assigns all four by role selector or catalog default", () => {
  const config = forceConfig();
  config.roleOverrides.planner.localModel = null;
  const plan = resolveAllHarnessRoleAssignments(config);
  assert.equal(plan.mode, "local-only");
  assert.deepEqual(Object.keys(plan.assignments), FIXED_HARNESS_ROLES);
  assert.equal(required(plan.assignments.planner).catalogName, "qwen-coder");
  assert.equal(required(plan.assignments.researcher).catalogName, "qwen-research");
  assert.ok(Object.values(plan.assignments).every(Boolean));
});

test("mixed applies local role mappings and preserves an explicit native override", () => {
  const config = routing();
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = "cloud/coder";
  const plan = resolveAllHarnessRoleAssignments(config);
  assert.equal(plan.mode, "mixed");
  assert.deepEqual(plan.assignments.implementer, {
    model: "cloud/coder",
    catalogName: null,
    routingServiceUrl: null,
    maxInFlight: null,
  });
  assert.equal(Object.values(plan.assignments).filter(Boolean).length, 4);
});

test("all fixed commands lock targets and reject every explicit escape shape", () => {
  const config = routing();
  for (const [command, entry] of Object.entries(config.commandOverrides)) {
    for (const request of [
      {},
      { agent: entry.agent },
      { role: entry.agent },
      { agent: entry.agent, role: entry.agent },
    ]) {
      assert.equal(
        resolveRoutingDecision({ config, request: { command, ...request } }).agent,
        entry.agent,
      );
    }
    for (const target of [
      "build",
      "general",
      "custom-agent",
      FIXED_HARNESS_ROLES.find((role) => role !== entry.agent),
    ]) {
      assert.throws(
        () => resolveRoutingDecision({ config, request: { command, agent: target } }),
        /conflicts with fixed command target/,
      );
      assert.throws(
        () => resolveRoutingDecision({ config, request: { command, role: target } }),
        /conflicts with fixed command target/,
      );
    }
  }
  assert.throws(
    () => resolveRoutingDecision({ config, request: { agent: "build", role: "general" } }),
    /agent and role conflict/,
  );
});

test("fixed target conflicts precede model alias conflicts across target forms", () => {
  const config = forceConfig();
  for (const [command, entry] of Object.entries(config.commandOverrides)) {
    const mismatches = [
      "build",
      "general",
      "custom-agent",
      FIXED_HARNESS_ROLES.find((role) => role !== entry.agent),
    ];
    for (const field of ["agent", "role"]) {
      for (const target of mismatches) {
        assert.throws(
          () =>
            resolveRoutingDecision({
              config,
              request: {
                command,
                [field]: target,
                explicitModel: "cloud/a",
                providerModel: "cloud/b",
              },
            }),
          new RegExp(`\\$\\.request\\.${field}.*conflicts with fixed command target`),
        );
      }
      assert.throws(
        () =>
          resolveRoutingDecision({
            config,
            request: {
              command,
              [field]: entry.agent,
              explicitModel: "cloud/a",
              providerModel: "cloud/b",
            },
          }),
        /conflicting explicit model aliases/,
      );
    }
  }
});

test("force model constraints are exact and force is fixed-role scoped", () => {
  const config = forceConfig();
  const selected = required(config.localRouting.models["qwen-coder"]).model;
  assert.equal(
    resolveRoutingDecision({ config, request: { command: "/delegate-implement" } }).local.enforced,
    true,
  );
  assert.equal(
    resolveRoutingDecision({ config, request: { command: "/delegate-implement", model: selected } })
      .model,
    selected,
  );
  for (const value of [
    "cloud/model",
    "unknown/model",
    required(config.localRouting.models["qwen-research"]).model,
  ]) {
    assert.throws(
      () =>
        resolveRoutingDecision({
          config,
          request: { command: "/delegate-implement", model: value },
        }),
      /requires exact model/,
    );
  }
  assert.equal(
    resolveRoutingDecision({ config, request: { agent: "build", model: "cloud/model" } }).local
      .enforced,
    false,
  );
  assert.equal(resolveRoutingDecision({ config, request: { agent: "build" } }).model, null);
});

test("force model aliases ignore absence sentinels and fail closed on ambiguity", () => {
  const config = forceConfig();
  const selected = required(config.localRouting.models["qwen-coder"]).model;
  const exact = resolveRoutingDecision({
    config,
    request: {
      command: "/delegate-implement",
      agent: "implementer",
      explicitModel: "inherited",
      providerModel: selected,
    },
  });
  assert.equal(exact.model, selected);
  assert.equal(exact.sources.model, "userExplicitOverride");
  assert.equal(
    resolveRoutingDecision({
      config,
      request: {
        command: "/delegate-implement",
        role: "implementer",
        explicitModel: "inherited",
        providerModel: "none",
        model: selected,
      },
    }).model,
    selected,
  );
  assert.throws(
    () =>
      resolveRoutingDecision({
        config,
        request: {
          command: "/delegate-implement",
          agent: "implementer",
          explicitModel: "inherited",
          providerModel: "cloud/model",
        },
      }),
    /requires exact model/,
  );
  assert.throws(
    () =>
      resolveRoutingDecision({
        config,
        request: {
          command: "/delegate-implement",
          role: "implementer",
          explicitModel: "inherited",
          providerModel: "none",
          model: "cloud/model",
        },
      }),
    /requires exact model/,
  );
  assert.equal(
    resolveRoutingDecision({
      config,
      request: { command: "/delegate-implement", explicitModel: selected, providerModel: selected },
    }).model,
    selected,
  );
  assert.throws(
    () =>
      resolveRoutingDecision({
        config,
        request: {
          command: "/delegate-implement",
          explicitModel: selected,
          providerModel: "cloud/model",
        },
      }),
    /conflicting explicit model aliases: explicitModel, providerModel/,
  );
});

test("advisory precedence and exact decision shape", () => {
  const config = routing();
  required(config.orchestratorCommands["/delegate-orchestration"]).model = "cloud/orchestrator";
  required(config.commandOverrides["/delegate-implement"]).model = "cloud/command";
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = "cloud/role";
  required(config.complexityTiers.complex).model = "cloud/complex";
  config.singleModel = { enabled: true, model: "cloud/single" };
  config.defaultModel = "cloud/default";
  assert.equal(
    resolveRoutingDecision({
      config,
      request: { model: "cloud/explicit", command: "/delegate-implement" },
    }).sources.model,
    "userExplicitOverride",
  );
  assert.equal(
    resolveRoutingDecision({ config, request: { command: "/delegate-orchestration" } }).model,
    "cloud/orchestrator",
  );
  assert.equal(
    resolveRoutingDecision({ config, request: { command: "/delegate-implement" } }).model,
    "cloud/command",
  );
  delete config.commandOverrides["/delegate-implement"];
  assert.equal(
    resolveRoutingDecision({ config, request: { role: "implementer" } }).model,
    "cloud/role",
  );
  config.roleOverrides.implementer.model = null;
  assert.equal(
    resolveRoutingDecision({ config, request: { role: "implementer", complexity: "complex" } })
      .model,
    "cloud/complex",
  );
  required(config.complexityTiers.complex).model = null;
  assert.equal(resolveRoutingDecision({ config, request: {} }).model, "cloud/single");
  config.singleModel.enabled = false;
  const decision = resolveRoutingDecision({ config, request: {} });
  assert.equal(decision.model, "cloud/default");
  assert.deepEqual(Object.keys(decision), [
    "schemaVersion",
    "agent",
    "model",
    "variant",
    "source",
    "sources",
    "local",
  ]);
  assert.equal(decision.local.networkCalls, false);
  assert.equal(decision.local.enforced, false);
});

test("role local selector is advisory outside force and identifies metadata", () => {
  const decision = resolveRoutingDecision({ config: routing(), request: { role: "implementer" } });
  assert.equal(decision.model, "llamacpp-coder/qwen2.5-coder-7b");
  assert.equal(decision.sources.model, "roleLocalModel");
  assert.deepEqual(decision.local, {
    enforced: false,
    catalogName: "qwen-coder",
    routingServiceUrl: "http://127.0.0.1:8081/v1",
    maxInFlight: 1,
    networkCalls: false,
  });
});

test("overall source preserves fixed command routing while per-field sources remain precise", () => {
  const decision = resolveRoutingDecision({
    config: routing(),
    request: { command: "/delegate-implement" },
  });
  assert.equal(decision.source, "commandOverride");
  assert.equal(decision.sources.agent, "commandOverride");
  assert.equal(decision.sources.model, "roleLocalModel");
});

test("strict structure, roles, references, and types reject defects", () => {
  type RoutingMutation = (config: NormalizedRoutingConfig) => void;

  const cases: Array<readonly [RoutingMutation, RegExp]> = [
    [
      (c: NormalizedRoutingConfig) => {
        Reflect.deleteProperty(c, "schemaVersion");
      },
      /schemaVersion.*required/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        Object.assign(c, { extra: true });
      },
      /extra.*unknown property/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        Object.assign(c.localRouting, { enabled: "true" });
      },
      /must be a boolean/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        required(c.localRouting.models["qwen-coder"]).maxInFlight = 1.5;
      },
      /integer of at least 1/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        Reflect.deleteProperty(c.roleOverrides, "validator");
      },
      /exactly the four harness roles/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        Object.assign(c.roleOverrides, { builder: c.roleOverrides.validator });
      },
      /exactly the four harness roles/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.localRouting.defaultLocalModel = "missing";
      },
      /must reference localRouting.models/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.roleOverrides.implementer.localModel = "missing";
      },
      /must reference localRouting.models/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.roleOverrides.implementer.model = "cloud/model";
      },
      /mutually exclusive/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.localRouting.enabled = false;
        c.localRouting.forceLocalForHarnessSubagents = true;
      },
      /requires enabled:true/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.localRouting.models["Bad_Name"] = required(c.localRouting.models["qwen-coder"]);
        delete c.localRouting.models["qwen-coder"];
      },
      /catalog name must match/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.defaultModel = "missing-prefix";
      },
      /provider-prefixed/,
    ],
    [
      (c: NormalizedRoutingConfig) => {
        c.orchestratorCommands.bad = required(c.orchestratorCommands["/delegate-orchestration"]);
        delete c.orchestratorCommands["/delegate-orchestration"];
      },
      /command keys must start with \/$/,
    ],
  ];
  for (const [mutate, pattern] of cases) {
    const config = routing();
    mutate(config);
    assert.throws(() => normalizeAndValidateRoutingConfig(config), pattern);
  }
  const disabled = routing();
  disabled.localRouting.enabled = false;
  disabled.localRouting.forceLocalForHarnessSubagents = false;
  assert.equal(normalizeAndValidateRoutingConfig(disabled).localRouting.enabled, false);
});

test("URL, uniqueness, provider, and shared endpoint invariants", () => {
  for (const url of [
    "ftp://host/v1",
    "http://user:pass@host/v1",
    "http://host/v1?q=1",
    "http://host/v1#x",
    "relative/v1",
  ]) {
    const config = routing();
    required(config.localRouting.models["qwen-coder"]).routingServiceUrl = url;
    assert.throws(() => normalizeAndValidateRoutingConfig(config), /URL|HTTP|credentials/);
  }
  const trailing = routing();
  required(trailing.localRouting.models["qwen-coder"]).routingServiceUrl += "///";
  assert.equal(
    required(normalizeAndValidateRoutingConfig(trailing).localRouting.models["qwen-coder"])
      .routingServiceUrl,
    "http://127.0.0.1:8081/v1",
  );
  const duplicate = routing();
  required(duplicate.localRouting.models["qwen-coder"]).model = required(
    duplicate.localRouting.models["qwen-research"],
  ).model;
  assert.throws(() => normalizeAndValidateRoutingConfig(duplicate), /models must be unique/);
  const providerTwoUrls = routing();
  required(providerTwoUrls.localRouting.models["qwen-coder"]).model = "llamacpp-research/other";
  assert.throws(
    () => normalizeAndValidateRoutingConfig(providerTwoUrls),
    /more than one canonical URL/,
  );
  const shared = routing();
  required(shared.localRouting.models["qwen-coder"]).routingServiceUrl =
    "http://127.0.0.1:8080/v1/";
  required(shared.localRouting.models["qwen-coder"]).maxInFlight = 2;
  assert.doesNotThrow(() => normalizeAndValidateRoutingConfig(shared));
  required(shared.localRouting.models["qwen-coder"]).maxInFlight = 1;
  assert.throws(() => normalizeAndValidateRoutingConfig(shared), /equal maxInFlight/);
});

test("legacy keys fail with actionable hard-migration guidance", () => {
  for (const key of [
    "localModel",
    "routingServiceUrl",
    "localModelEnabled",
    "preferLocal",
    "localModelFallback",
  ]) {
    const config = routing();
    Object.assign(config, { [key]: {} });
    assert.throws(
      () => normalizeAndValidateRoutingConfig(config),
      /localRouting\.models.*defaultLocalModel.*enabled.*forceLocalForHarnessSubagents.*native providers.*restart/,
    );
  }
  assert.doesNotThrow(() => normalizeAndValidateRoutingConfig(routing()));
});

test("resolution does not mutate frozen inputs and repeats identically", () => {
  const config = deepFreeze(routing());
  const request = deepFreeze({ command: "/delegate-implement", agent: "implementer" });
  assert.deepEqual(
    resolveRoutingDecision({ config, request }),
    resolveRoutingDecision({ config, request }),
  );
});

test("helper, CLI, and core decisions are identical", async () => {
  const request = { command: "/delegate-implement" };
  const core = resolveRoutingDecision({ config: committed, request });
  const helper = await resolveModelForRole({ config: committed, command: request.command });
  const { stdout } = await execFileAsync(process.execPath, [
    path.join(CONFIG_DIR, "resolve-model-routing.mjs"),
    "--config",
    EXAMPLE_PATH,
    "--metadata-json",
    JSON.stringify(request),
  ]);
  assert.deepEqual(helper, core);
  assert.deepEqual(JSON.parse(stdout), core);
});

test("helper and CLI match explicit advisory local fixture", async () => {
  const request = { command: "/delegate-implement" };
  const core = resolveRoutingDecision({ config: localCommitted, request });
  const helper = await resolveModelForRole({ config: localCommitted, command: request.command });
  const { stdout } = await execFileAsync(process.execPath, [
    path.join(CONFIG_DIR, "resolve-model-routing.mjs"),
    "--config",
    LOCAL_EXAMPLE_PATH,
    "--metadata-json",
    JSON.stringify(request),
  ]);
  assert.equal(core.model, "llamacpp-coder/qwen2.5-coder-7b");
  assert.equal(core.local.enforced, false);
  assert.deepEqual(helper, core);
  assert.deepEqual(JSON.parse(stdout), core);
});

test("shared loader selects custom first and example only when custom is absent", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-loader-"));
  try {
    const exampleOnly = writePair(path.join(temp, "example-only"), {
      example: JSON.stringify(committed),
    });
    const selectedExample = loadRoutingConfigSelection({ fallbackDirectory: exampleOnly });
    assert.equal(selectedExample.source, "example");
    assert.deepEqual(selectedExample.document, committed);

    const customFirst = writePair(path.join(temp, "custom-first"), {
      custom: JSON.stringify({ marker: "custom" }),
      example: JSON.stringify({ marker: "example" }),
    });
    const selectedCustom = loadRoutingConfigSelection({ fallbackDirectory: customFirst });
    assert.equal(selectedCustom.source, "custom");
    assert.equal(unknownRecord(selectedCustom.document).marker, "custom");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("present malformed or semantically invalid custom never falls back to valid example", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-loader-bad-custom-"));
  try {
    const malformed = writePair(path.join(temp, "malformed"), {
      custom: "{",
      example: JSON.stringify(committed),
    });
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: malformed }),
      /Malformed routing config JSON/,
    );

    const invalid = clone(committed);
    Object.assign(invalid.harnessModelRouting, { schemaVersion: "invalid" });
    const invalidDir = writePair(path.join(temp, "invalid"), {
      custom: JSON.stringify(invalid),
      example: JSON.stringify(committed),
    });
    const selected = loadRoutingConfigSelection({ fallbackDirectory: invalidDir });
    assert.equal(selected.source, "custom");
    assert.throws(() => normalizeAndValidateRoutingConfig(selected.document), /schemaVersion/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("dangling symlink and directory custom entries are selected and fail closed", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-loader-entry-"));
  try {
    const danglingDir = writePair(path.join(temp, "dangling"), {
      example: JSON.stringify(committed),
    });
    const danglingCustom = path.join(danglingDir, "harness-model-routing.json");
    fs.symlinkSync(path.join(danglingDir, "missing-target.json"), danglingCustom);
    assert.equal(selectImplicitRoutingConfig({ fallbackDirectory: danglingDir }).source, "custom");
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: danglingDir }),
      (error) => errorIncludes(error, "Unable to read routing config", danglingCustom),
    );

    const directoryDir = writePair(path.join(temp, "directory"), {
      example: JSON.stringify(committed),
    });
    const directoryCustom = path.join(directoryDir, "harness-model-routing.json");
    fs.mkdirSync(directoryCustom);
    assert.equal(selectImplicitRoutingConfig({ fallbackDirectory: directoryDir }).source, "custom");
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: directoryDir }),
      (error) => errorIncludes(error, "Unable to read routing config", directoryCustom),
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("absent pair is actionable and explicit paths are exact despite siblings", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-loader-exact-"));
  try {
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: temp }),
      (error) =>
        errorIncludes(
          error,
          path.join(temp, "harness-model-routing.json"),
          path.join(temp, "harness-model-routing.example.json"),
          "cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json",
        ),
    );
    const sibling = path.join(temp, "harness-model-routing.example.json");
    fs.writeFileSync(sibling, JSON.stringify(committed));
    const missing = path.join(temp, "missing.json");
    assert.throws(
      () => loadRoutingConfigSelection({ configPath: missing }),
      /Unable to read routing config/,
    );
    const malformed = path.join(temp, "malformed.json");
    fs.writeFileSync(malformed, "{");
    assert.throws(
      () => loadRoutingConfigSelection({ configPath: malformed }),
      /Malformed routing config JSON/,
    );
    const exact = loadRoutingConfigSelection({ configPath: sibling });
    assert.equal(exact.source, "explicit");
    assert.equal(exact.path, sibling);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("helper and CLI preserve omitted versus explicit config intent", async () => {
  assert.equal(parseArgs([]).configPath, undefined);
  assert.equal(parseArgs(["--config", EXAMPLE_PATH]).configPath, EXAMPLE_PATH);
  assert.deepEqual(loadRoutingConfig(EXAMPLE_PATH), committed);
  assert.deepEqual(
    await resolveModelForRole({ configPath: EXAMPLE_PATH, command: "/delegate-implement" }),
    resolveRoutingDecision({ config: committed, request: { command: "/delegate-implement" } }),
  );
  await assert.rejects(
    resolveModelForRole({ config: null, configPath: path.join(DIR, "missing.json") }),
    /must be an object/,
  );
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-entrypoints-"));
  try {
    const routingDir = path.join(temp, ".opencode/routing");
    fs.mkdirSync(routingDir, { recursive: true });
    for (const name of [
      "routing-policy.mjs",
      "routing-config-loader.mjs",
      "model-routing-helper.mjs",
      "resolve-model-routing.mjs",
      "harness-model-routing.example.json",
    ]) {
      fs.copyFileSync(path.join(CONFIG_DIR, name), path.join(routingDir, name));
    }
    const isolatedHelper = await import(
      `${pathToFileURL(path.join(routingDir, "model-routing-helper.mjs")).href}?isolated=1`
    );
    assert.deepEqual(
      await isolatedHelper.resolveModelForRole({ command: "/delegate-implement" }),
      resolveRoutingDecision({ config: committed, request: { command: "/delegate-implement" } }),
    );
    const { stdout } = await execFileAsync(process.execPath, [
      path.join(routingDir, "resolve-model-routing.mjs"),
      "--metadata-json",
      '{"command":"/delegate-implement"}',
    ]);
    assert.deepEqual(
      JSON.parse(stdout),
      resolveRoutingDecision({ config: committed, request: { command: "/delegate-implement" } }),
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("routing CLI executes through aliased copied entry and preserves decision parity", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-cli-alias-"));
  try {
    const routingDir = path.join(temp, "routing-bundle");
    const aliasDir = path.join(temp, "routing-alias");
    copyRoutingBundle(routingDir);
    createDirectoryAlias(routingDir, aliasDir);

    const request = { command: "/delegate-implement" };
    const expected = resolveRoutingDecision({ config: committed, request });
    const args = ["--metadata-json", JSON.stringify(request)];
    const aliasResult = spawnSync(
      process.execPath,
      [path.join(aliasDir, "resolve-model-routing.mjs"), ...args],
      { encoding: "utf8" },
    );
    const canonicalResult = spawnSync(
      process.execPath,
      [path.join(routingDir, "resolve-model-routing.mjs"), ...args],
      { encoding: "utf8" },
    );

    for (const result of [aliasResult, canonicalResult]) {
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0);
      assert.equal(result.signal, null);
      assert.notEqual(result.stdout, "");
      assert.equal(result.stderr, "");
      assert.deepEqual(JSON.parse(result.stdout), expected);
    }
    assert.deepEqual(JSON.parse(aliasResult.stdout), JSON.parse(canonicalResult.stdout));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("routing CLI import is inert", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-cli-import-"));
  try {
    const routingDir = path.join(temp, "routing-bundle");
    copyRoutingBundle(routingDir);
    const cliUrl = pathToFileURL(path.join(routingDir, "resolve-model-routing.mjs")).href;
    const result = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", `await import(${JSON.stringify(cliUrl)})`],
      { encoding: "utf8" },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.signal, null);
    assert.equal(result.stdout, "");
    assert.equal(result.stderr, "");
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("routing CLI native-realpath fallback is alias-safe and fail-closed", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-cli-fallback-"));
  try {
    const routingDir = path.join(temp, "routing-bundle");
    const aliasDir = path.join(temp, "routing-alias");
    copyRoutingBundle(routingDir);
    createDirectoryAlias(routingDir, aliasDir);

    const cli = path.join(routingDir, "resolve-model-routing.mjs");
    const featureTest = 'typeof import.meta.main === "boolean"';
    const source = fs.readFileSync(cli, "utf8");
    assert.equal(source.split(featureTest).length - 1, 1);
    fs.writeFileSync(cli, source.replace(featureTest, "false"));

    const request = { command: "/delegate-implement" };
    const expected = resolveRoutingDecision({ config: committed, request });
    const aliasResult = spawnSync(
      process.execPath,
      [
        path.join(aliasDir, "resolve-model-routing.mjs"),
        "--metadata-json",
        JSON.stringify(request),
      ],
      { encoding: "utf8" },
    );
    assert.equal(aliasResult.error, undefined);
    assert.equal(aliasResult.status, 0);
    assert.equal(aliasResult.signal, null);
    assert.notEqual(aliasResult.stdout, "");
    assert.equal(aliasResult.stderr, "");
    assert.deepEqual(JSON.parse(aliasResult.stdout), expected);

    const cliUrl = pathToFileURL(cli).href;
    const missingEntry = path.join(temp, "missing-entry.mjs");
    const importScripts = [
      `delete process.argv[1]; await import(${JSON.stringify(`${cliUrl}?absent-entry`)});`,
      `process.argv[1] = ${JSON.stringify(missingEntry)}; await import(${JSON.stringify(`${cliUrl}?missing-entry`)});`,
    ];
    for (const script of importScripts) {
      const result = spawnSync(process.execPath, ["--input-type=module", "--eval", script], {
        encoding: "utf8",
      });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0);
      assert.equal(result.signal, null);
      assert.equal(result.stdout, "");
      assert.equal(result.stderr, "");
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("plugin discovers nested project pairs, prefers custom, and keeps explicit/document boundaries exact", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-plugin-discovery-"));
  try {
    const root = path.join(temp, "project");
    const routingDir = writePair(root, { example: JSON.stringify(committed) });
    const nested = path.join(root, "a/b");
    fs.mkdirSync(nested, { recursive: true });
    assert.equal(
      resolveHarnessRoutingPath({ directory: nested }),
      path.join(routingDir, "harness-model-routing.example.json"),
    );
    fs.writeFileSync(
      path.join(routingDir, "harness-model-routing.json"),
      JSON.stringify(committed),
    );
    assert.equal(
      resolveHarnessRoutingPath({ directory: nested }),
      path.join(routingDir, "harness-model-routing.json"),
    );
    assert.throws(
      () =>
        applyHarnessRoleModelOverrides(nativeConfig(), {
          routingPath: path.join(routingDir, "missing.json"),
        }),
      /Unable to read routing config/,
    );
    assert.doesNotThrow(() =>
      applyHarnessRoleModelOverrides(nativeConfig(), {
        routingDocument: committed,
        routingPath: path.join(routingDir, "missing.json"),
      }),
    );
    assert.throws(
      () =>
        applyHarnessRoleModelOverrides(nativeConfig(), {
          routingDocument: null,
          routingPath: path.join(routingDir, "missing.json"),
        }),
      /must be an object/,
    );
    const moduleFallback = selectImplicitRoutingConfig({
      startPath: path.join(temp, "no-project"),
    });
    assert.equal(moduleFallback.root, CONFIG_DIR);
    assert.ok(["custom", "example"].includes(moduleFallback.source));
    const noMutation = nativeConfig();
    applyHarnessRoleModelOverrides(noMutation, { routingPath: EXAMPLE_PATH });
    assert.ok(
      FIXED_HARNESS_ROLES.every(
        (role) => !Object.hasOwn(required(noMutation.agent[role]), "model"),
      ),
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("CLI rejects malformed arguments and metadata", async () => {
  const cli = path.join(CONFIG_DIR, "resolve-model-routing.mjs");
  for (const args of [
    ["--unknown", "x"],
    ["--config"],
    ["--metadata-json", "{"],
    ["--metadata-json", "[]"],
  ]) {
    await assert.rejects(execFileAsync(process.execPath, [cli, ...args]));
  }
});

test("native coherence returns evidence and rejects missing provider relationships", () => {
  const plan = resolveAllHarnessRoleAssignments(forceConfig());
  const cfg = nativeConfig();
  const evidence = validateNativeProviderCoherence(cfg, plan);
  assert.equal(required(evidence.providers.implementer).provider, "llamacpp-coder");
  const defects: Array<(config: NativeTestConfig) => void> = [
    (c: NativeTestConfig) => {
      delete c.agent.researcher;
    },
    (c: NativeTestConfig) => {
      required(c.agent.researcher).mode = "primary";
    },
    (c: NativeTestConfig) => {
      delete c.provider["llamacpp-research"];
    },
    (c: NativeTestConfig) => {
      required(c.provider["llamacpp-research"]).options.baseURL = "http://127.0.0.1:9999/v1";
    },
    (c: NativeTestConfig) => {
      delete required(c.provider["llamacpp-research"]).models["qwen2.5-7b-instruct"];
    },
  ];
  for (const mutate of defects) {
    const bad = nativeConfig();
    mutate(bad);
    assert.throws(() => validateNativeProviderCoherence(bad, plan));
  }
});

test("force enforcement mutates all four agents only after complete preflight", () => {
  const cfg = nativeConfig();
  const providersBefore = clone(cfg.provider);
  const plan = applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() });
  assert.equal(plan.mode, "local-only");
  assert.ok(
    FIXED_HARNESS_ROLES.every(
      (role) =>
        typeof required(cfg.agent[role]).model === "string" &&
        required(cfg.agent[role]).mode === "subagent",
    ),
  );
  assert.deepEqual(cfg.provider, providersBefore);
});

test("non-force enforcement preserves config-derived null/no-own-property behavior", () => {
  const cfg = nativeConfig();
  applyHarnessRoleModelOverrides(cfg, { routingDocument: committed });
  assert.ok(
    FIXED_HARNESS_ROLES.every((role) => !Object.hasOwn(required(cfg.agent[role]), "model")),
  );
  const config = routing();
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = "llamacpp-coder/qwen2.5-coder-7b";
  applyHarnessRoleModelOverrides(cfg, { routingDocument: config });
  assert.equal(required(cfg.agent.implementer).model, "llamacpp-coder/qwen2.5-coder-7b");
  assert.equal(
    FIXED_HARNESS_ROLES.filter((role) => Object.hasOwn(required(cfg.agent[role]), "model")).length,
    4,
  );
});

test("neutral config is inert while mixed local config applies validated mappings", () => {
  const neutral = {
    agent: Object.fromEntries(FIXED_HARNESS_ROLES.map((role) => [role, { mode: "subagent" }])),
  };
  const before = clone(neutral);
  const neutralPlan = applyHarnessRoleModelOverrides(neutral, { routingDocument: committed });
  assert.equal(neutralPlan.mode, "mixed");
  assert.ok(Object.values(neutralPlan.assignments).every((assignment) => assignment === null));
  assert.deepEqual(neutral, before);
  const local = nativeConfig();
  const localPlan = applyHarnessRoleModelOverrides(local, { routingDocument: localCommitted });
  assert.equal(localPlan.mode, "mixed");
  assert.ok(
    FIXED_HARNESS_ROLES.every((role) => typeof required(local.agent[role]).model === "string"),
  );
});

test("strict provider modes mutate native filters only after full preflight", () => {
  const localCfg = nativeConfig();
  localCfg.enabled_providers = ["cloud", "llamacpp-research", "llamacpp-coder"];
  localCfg.disabled_providers = ["other"];
  applyHarnessRoleModelOverrides(localCfg, { routingDocument: forceConfig() });
  assert.deepEqual(localCfg.enabled_providers, ["llamacpp-research", "llamacpp-coder"]);
  assert.deepEqual(localCfg.disabled_providers, ["other"]);

  const cloud = routing();
  cloud.providerClassMode = "cloud-only";
  cloud.localRouting.defaultLocalModel = null;
  for (const role of FIXED_HARNESS_ROLES) cloud.roleOverrides[role].localModel = null;
  const cloudCfg = nativeConfig();
  cloudCfg.enabled_providers = ["cloud", "llamacpp-coder"];
  cloudCfg.disabled_providers = ["other"];
  const plan = applyHarnessRoleModelOverrides(cloudCfg, { routingDocument: cloud });
  assert.ok(Object.values(plan.assignments).every((assignment) => assignment === null));
  assert.deepEqual(cloudCfg.enabled_providers, ["cloud"]);
  assert.deepEqual(cloudCfg.disabled_providers, ["llamacpp-coder", "llamacpp-research", "other"]);
});

test("every force failure position including fourth is atomic and providers never mutate", () => {
  for (const failedRole of FIXED_HARNESS_ROLES) {
    const cfg = nativeConfig();
    delete cfg.agent[failedRole];
    const before = clone(cfg);
    assert.throws(
      () => applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() }),
      /enforcement failed/,
    );
    assert.deepEqual(cfg, before);
  }
  const cfg = nativeConfig();
  delete required(cfg.provider["llamacpp-coder"]).models["qwen2.5-coder-7b"];
  const before = clone(cfg);
  assert.throws(() => applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() }));
  assert.deepEqual(cfg, before);
});

test("file enforcement reports read and parse diagnostics", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "routing-policy-"));
  assert.throws(
    () =>
      applyHarnessRoleModelOverrides(nativeConfig(), {
        routingPath: path.join(temp, "missing.json"),
      }),
    /Unable to read routing config/,
  );
  const malformed = path.join(temp, "bad.json");
  fs.writeFileSync(malformed, "{");
  assert.throws(
    () => applyHarnessRoleModelOverrides(nativeConfig(), { routingPath: malformed }),
    /Malformed routing config JSON/,
  );
  fs.rmSync(temp, { recursive: true, force: true });
});

test("native role assignments share helper default, single and role precedence", () => {
  for (const selection of ["none", "default", "single", "role"] as const) {
    const config = neutralRouting();
    if (selection !== "none") config.defaultModel = "fixture/default";
    if (selection === "single" || selection === "role")
      config.singleModel = { enabled: true, model: "fixture/single" };
    if (selection === "role") config.roleOverrides.researcher.model = "fixture/role";
    const cfg = {
      model: "fixture/native",
      provider: { fixture: { models: { default: {}, single: {}, role: {}, native: {} } } },
      agent: Object.fromEntries(
        FIXED_HARNESS_ROLES.map((role) => [role, { mode: "subagent", model: "fixture/native" }]),
      ),
    };
    const plan = applyHarnessRoleModelOverrides(cfg, { routingDocument: config });
    for (const role of FIXED_HARNESS_ROLES) {
      const advisory = resolveRoutingDecision({ config, request: { role } });
      assert.equal(plan.assignments[role]?.model ?? null, advisory.model);
      assert.equal(cfg.agent[role]!.model, advisory.model ?? "fixture/native");
    }
  }
});

test("explicit model aliases reject malformed IDs but do not invent service availability", () => {
  for (const alias of ["explicitModel", "providerModel", "model"]) {
    for (const bad of ["not-a-provider-model", "/model", "provider/", "provider/bad model"])
      assert.throws(
        () => resolveRoutingDecision({ config: committed, request: { [alias]: bad } }),
        /provider\/model/,
      );
    assert.equal(
      resolveRoutingDecision({ config: committed, request: { [alias]: "unavailable/valid" } })
        .model,
      "unavailable/valid",
    );
  }
});

test("selected provider restrictions fail atomically instead of being widened", () => {
  for (const mode of ["mixed", "local-only"] as const) {
    for (const filter of ["enabled_providers", "disabled_providers"] as const) {
      const cfg = nativeConfig();
      cfg[filter] = filter === "enabled_providers" ? ["other"] : ["llamacpp-coder"];
      const before = clone(cfg);
      assert.throws(
        () =>
          applyHarnessRoleModelOverrides(cfg, {
            routingDocument: mode === "mixed" ? localCommitted : forceConfig(),
          }),
        /blocked by native provider restrictions/,
      );
      assert.deepEqual(cfg, before);
    }
  }
});

test("persisted local routing without native transport reports policy source and fails atomically", () => {
  const cfg = nativeConfig();
  cfg.provider = {};
  const before = clone(cfg);
  assert.throws(
    () => applyHarnessRoleModelOverrides(cfg, { routingDocument: localCommitted }),
    /Omitting a prompt model does not clear configured routing/,
  );
  assert.deepEqual(cfg, before);
});

test("combined plugin blocks Task after missing or failed config hooks", async () => {
  const hooks = await HarnessPlugin({ routingDocument: committed });
  const input = { tool: "task", sessionID: "parent", callID: "call" };
  await assert.rejects(
    () => hooks["tool.execute.before"](input, { args: {} }),
    /configuration hook has not completed/,
  );
  const invalid = await HarnessPlugin({ routingDocument: { bad: true } });
  await assert.rejects(() => invalid.config({}), /routing enforcement failed/);
  await assert.rejects(
    () => invalid["tool.execute.before"](input, { args: {} }),
    /Harness dispatch blocked/,
  );
  await hooks.config({});
  await assert.rejects(
    () => hooks["tool.execute.before"](input, { args: {} }),
    /absolute workspace root/,
  );
});

test("cloud-only rejects catalogued assignments against final filters atomically and blocks Task", async () => {
  for (const selection of ["default", "single", "role"] as const) {
    for (const withAllowlist of [false, true]) {
      const config = routing();
      config.providerClassMode = "cloud-only";
      config.localRouting.defaultLocalModel = null;
      config.defaultModel = null;
      config.singleModel = { enabled: false, model: null };
      for (const role of FIXED_HARNESS_ROLES) {
        config.roleOverrides[role].localModel = null;
        config.roleOverrides[role].model = null;
      }
      const selected = "llamacpp-research/qwen2.5-7b-instruct";
      if (selection === "default") config.defaultModel = selected;
      if (selection === "single") config.singleModel = { enabled: true, model: selected };
      if (selection === "role") config.roleOverrides.researcher.model = selected;
      const cfg = nativeConfig();
      if (withAllowlist) cfg.enabled_providers = ["cloud", "llamacpp-research", "llamacpp-coder"];
      const before = clone(cfg);
      assert.throws(
        () => applyHarnessRoleModelOverrides(cfg, { routingDocument: config }),
        /cloud-only effective filters/,
      );
      assert.deepEqual(cfg, before);
      const hooks = await HarnessPlugin({ routingDocument: config });
      await assert.rejects(() => hooks.config(cfg), /cloud-only effective filters/);
      assert.deepEqual(cfg, before);
      await assert.rejects(
        () =>
          hooks["tool.execute.before"](
            { tool: "task", sessionID: "parent", callID: "call" },
            { args: {} },
          ),
        /Harness dispatch blocked.*cloud-only effective filters/,
      );
      assert.deepEqual(cfg, before);
    }
  }
});

test("combined plugin retains workspace mismatch rejection after native catches config error", async () => {
  const originalWorkspace = process.env.OPENCODE_HARNESS_WORKSPACE_ROOT;
  const originalTrace = process.env.OPENCODE_HARNESS_TRACE_ROOT;
  process.env.OPENCODE_HARNESS_WORKSPACE_ROOT = "/fixture/expected";
  delete process.env.OPENCODE_HARNESS_TRACE_ROOT;
  try {
    const hooks = await HarnessPlugin({ directory: "/fixture/other", routingDocument: committed });
    let caught: unknown;
    try {
      await hooks.config({});
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof Error);
    assert.match(caught.message, /managed workspace mismatch/);
    // Native config loading can catch/log the exception and continue invoking hooks.
    await assert.rejects(
      () =>
        hooks["tool.execute.before"](
          { tool: "task", sessionID: "parent", callID: "call" },
          { args: {} },
        ),
      /Harness dispatch blocked.*managed workspace mismatch/,
    );
    const output = { args: { filePath: "input.txt" } };
    await hooks["tool.execute.before"](
      { tool: "read", sessionID: "ordinary", callID: "read" },
      output,
    );
    assert.equal(output.args.filePath, "input.txt");
  } finally {
    if (originalWorkspace === undefined) delete process.env.OPENCODE_HARNESS_WORKSPACE_ROOT;
    else process.env.OPENCODE_HARNESS_WORKSPACE_ROOT = originalWorkspace;
    if (originalTrace === undefined) delete process.env.OPENCODE_HARNESS_TRACE_ROOT;
    else process.env.OPENCODE_HARNESS_TRACE_ROOT = originalTrace;
  }
});

test("explicit local readiness requires healthy exact models without credentials or redirects", async () => {
  const calls: string[] = [];
  const mock: typeof fetch = async (input, options) => {
    calls.push(String(input));
    assert.deepEqual(options?.headers, { Accept: "application/json" });
    assert.equal(options?.credentials, "omit");
    assert.equal(options?.redirect, "error");
    assert.equal(options?.method, "GET");
    return Response.json(
      String(input).endsWith("/health")
        ? { status: "ok" }
        : { data: [{ id: "qwen2.5-7b-instruct" }, { id: "qwen2.5-coder-7b" }] },
    );
  };
  const cfg = nativeConfig();
  const before = clone(cfg);
  await assertLocalAssignmentsReady(forceConfig(), cfg, mock);
  assert.equal(calls.length, 4);
  assert.deepEqual(cfg, before);
});

test("local readiness fails closed for unhealthy missing-model timeout and oversized responses", async () => {
  const scenarios: Array<typeof fetch> = [
    async () => new Response("unhealthy", { status: 503 }),
    async () => Response.json({ status: "loading" }),
    async (input) =>
      Response.json(
        String(input).endsWith("/health")
          ? { status: "ok" }
          : { data: [{ id: "different-model" }] },
      ),
    async () => new Response("x".repeat(65537)),
    async (_input, options) =>
      new Promise((_resolve, reject) => {
        const keepAlive = setTimeout(() => reject(new Error("fixture failed to abort")), 1000);
        options?.signal?.addEventListener(
          "abort",
          () => {
            clearTimeout(keepAlive);
            reject(new Error("aborted"));
          },
          { once: true },
        );
      }),
  ];
  for (const mock of scenarios) {
    const cfg = nativeConfig();
    const before = clone(cfg);
    await assert.rejects(
      assertLocalAssignmentsReady(forceConfig(), cfg, mock, 10),
      /blocked without remote fallback/,
    );
    assert.deepEqual(cfg, before);
  }
});

test("local readiness freezes success and failure for the plugin instance without route oscillation", async () => {
  const old = process.env.OPENCODE_HARNESS_LOCAL_READINESS;
  const originalFetch = globalThis.fetch;
  process.env.OPENCODE_HARNESS_LOCAL_READINESS = "required";
  let calls = 0;
  try {
    globalThis.fetch = async (input) => {
      calls++;
      return Response.json(
        String(input).endsWith("/health")
          ? { status: "ok" }
          : { data: [{ id: "qwen2.5-7b-instruct" }, { id: "qwen2.5-coder-7b" }] },
      );
    };
    const document = forceConfig();
    const plugin = await HarnessRoleModelRoutingEnforcementPlugin({ routingDocument: document });
    const cfg = nativeConfig();
    await plugin.config(cfg);
    const first = clone(cfg);
    const probed = calls;
    globalThis.fetch = async () => {
      calls++;
      throw new Error("offline");
    };
    await plugin.config(nativeConfig());
    assert.equal(calls, probed);
    assert.deepEqual(cfg, first);
    const failed = await HarnessPlugin({ routingDocument: forceConfig() });
    const untouched = nativeConfig();
    const before = clone(untouched);
    await assert.rejects(failed.config(untouched), /blocked without remote fallback/);
    const failedCount = calls;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ status: "ok" });
    };
    await assert.rejects(failed.config(untouched), /blocked without remote fallback/);
    assert.equal(calls, failedCount);
    assert.deepEqual(untouched, before);
    await assert.rejects(
      () =>
        failed["tool.execute.before"](
          { tool: "task", sessionID: "parent", callID: "blocked" },
          { args: {} },
        ),
      /Harness dispatch blocked.*without remote fallback/,
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (old === undefined) delete process.env.OPENCODE_HARNESS_LOCAL_READINESS;
    else process.env.OPENCODE_HARNESS_LOCAL_READINESS = old;
  }
});

test("optional local selection inherits when transport metadata or exact served model is absent", async () => {
  for (const missing of ["provider", "model", "offline", "wrong-model"]) {
    const document = clone(localCommitted);
    const cfg = nativeConfig();
    const before = clone(cfg);
    let calls = 0;
    if (missing === "provider") cfg.provider = {};
    if (missing === "model")
      for (const provider of Object.values(cfg.provider)) provider.models = {};
    const selected = await selectAvailableRoleAssignments(document, cfg, false, async (input) => {
      calls++;
      if (missing === "offline") throw new Error("fixture offline");
      return Response.json(
        String(input).endsWith("/health") ? { status: "ok" } : { data: [{ id: "wrong" }] },
      );
    });
    assert.ok(Object.values(selected.plan.assignments).every((value) => value === null));
    assert.equal(selected.inheritRoles.length, 4);
    if (["provider", "model"].includes(missing)) assert.equal(calls, 0);
    else assert.deepEqual(cfg, before);
  }
});

test("optional healthy local route overrides while explicit cloud and neutral inheritance remain unchanged", async () => {
  let calls = 0;
  const healthy: typeof fetch = async (input) => {
    calls++;
    return Response.json(
      String(input).endsWith("/health")
        ? { status: "ok" }
        : { data: [{ id: "qwen2.5-7b-instruct" }, { id: "qwen2.5-coder-7b" }] },
    );
  };
  const local = await selectAvailableRoleAssignments(
    localCommitted,
    nativeConfig(),
    false,
    healthy,
  );
  assert.equal(local.inheritRoles.length, 0);
  assert.deepEqual(local.plan, resolveAllHarnessRoleAssignments(localCommitted));
  const priorCalls = calls;
  const neutral = await selectAvailableRoleAssignments(committed, {}, false, healthy);
  assert.ok(Object.values(neutral.plan.assignments).every((v) => v === null));
  assert.equal(calls, priorCalls);
});

test("optional unavailable route is frozen and deletes stale role model to inherit selected session", async () => {
  const old = process.env.OPENCODE_HARNESS_LOCAL_READINESS;
  const savedFetch = globalThis.fetch;
  delete process.env.OPENCODE_HARNESS_LOCAL_READINESS;
  let calls = 0;
  try {
    globalThis.fetch = async () => {
      calls++;
      throw new Error("offline fixture");
    };
    const plugin = await HarnessRoleModelRoutingEnforcementPlugin({
      routingDocument: localCommitted,
    });
    const cfg = nativeConfig();
    await plugin.config(cfg);
    for (const role of FIXED_HARNESS_ROLES)
      assert.equal(Object.hasOwn(cfg.agent[role]!, "model"), false);
    const first = calls;
    globalThis.fetch = async () => {
      calls++;
      return Response.json({ status: "ok" });
    };
    await plugin.config(nativeConfig());
    assert.equal(calls, first);
  } finally {
    globalThis.fetch = savedFetch;
    if (old === undefined) delete process.env.OPENCODE_HARNESS_LOCAL_READINESS;
    else process.env.OPENCODE_HARNESS_LOCAL_READINESS = old;
  }
});

test("optional routing never masks malformed configuration and forced local never inherits on outage", async () => {
  const offline: typeof fetch = async () => {
    throw new Error("offline fixture");
  };
  await assert.rejects(
    selectAvailableRoleAssignments({ bad: true }, {}, false, offline),
    /unknown property/,
  );
  const cfg = nativeConfig();
  cfg.provider["llamacpp-research"]!.options.baseURL = "http://127.0.0.1:8999/v1";
  await assert.rejects(
    selectAvailableRoleAssignments(localCommitted, cfg, false, offline),
    /must equal catalog URL/,
  );
  cfg.provider["llamacpp-research"]!.models = {};
  await assert.rejects(
    selectAvailableRoleAssignments(localCommitted, cfg, false, offline),
    /must equal catalog URL/,
  );
  await assert.rejects(
    selectAvailableRoleAssignments(forceConfig(), nativeConfig(), false, offline),
    /blocked without remote fallback/,
  );
  await assert.rejects(
    selectAvailableRoleAssignments(localCommitted, nativeConfig(), true, offline),
    /blocked without remote fallback/,
  );
});

test("repaired legacy Open Court optional catalog cannot block native inheritance before Task", async () => {
  const doc = clone(committed);
  const routing = doc.harnessModelRouting;
  routing.localRouting.enabled = true;
  routing.localRouting.models = {
    "qwen-research": {
      model: "llamacpp-research/qwen2.5-7b-instruct",
      routingServiceUrl: "http://127.0.0.1:8080/v1",
      maxInFlight: 2,
    },
  };
  // Undefined qwen-coder references and retired role/command keys were removed
  // by the backed-up consumer migration, not silently accepted by the schema.
  for (const role of ["researcher", "planner", "validator"] as const)
    routing.roleOverrides[role].localModel = "qwen-research";
  const saved = process.env.OPENCODE_HARNESS_LOCAL_READINESS;
  delete process.env.OPENCODE_HARNESS_LOCAL_READINESS;
  try {
    const hooks = await HarnessPlugin({ routingDocument: doc });
    const cfg = nativeConfig();
    cfg.provider = {};
    await hooks.config(cfg);
    for (const role of FIXED_HARNESS_ROLES) assert.equal(cfg.agent[role]!.model, undefined);
    await assert.rejects(
      hooks["tool.execute.before"](
        { tool: "task", sessionID: "parent", callID: "fixture" },
        { args: {} },
      ),
      /absolute workspace root/,
    );
  } finally {
    if (saved === undefined) delete process.env.OPENCODE_HARNESS_LOCAL_READINESS;
    else process.env.OPENCODE_HARNESS_LOCAL_READINESS = saved;
  }
});

test("explicit cloud route survives optional local outage without choosing a substitute", async () => {
  const routing = clone(localCommitted);
  routing.harnessModelRouting.roleOverrides.researcher = {
    model: "cloud/chosen",
    localModel: null,
    variant: null,
  };
  const cfg = nativeConfig();
  cfg.provider.cloud = {
    options: { baseURL: "https://example.invalid/v1" },
    models: { chosen: { name: "chosen" } },
  };
  const selected = await selectAvailableRoleAssignments(routing, cfg, false, async () => {
    throw new Error("offline");
  });
  assert.equal(selected.plan.assignments.researcher?.model, "cloud/chosen");
  assert.equal(selected.inheritRoles.includes("researcher"), false);
  assert.ok(selected.inheritRoles.length > 0);
});

test("missing native models map inherits only for optional local routing without probing", async () => {
  const cfg = nativeConfig();
  for (const provider of Object.values(cfg.provider)) Reflect.deleteProperty(provider, "models");
  let calls = 0;
  const healthy: typeof fetch = async (input) => {
    calls++;
    return Response.json(
      String(input).endsWith("/health")
        ? { status: "ok" }
        : { data: [{ id: "qwen2.5-7b-instruct" }, { id: "qwen2.5-coder-7b" }] },
    );
  };
  const selected = await selectAvailableRoleAssignments(localCommitted, cfg, false, healthy);
  assert.equal(selected.inheritRoles.length, 4);
  assert.ok(Object.values(selected.plan.assignments).every((assignment) => assignment === null));
  assert.equal(calls, 0);
  for (const [document, required] of [
    [localCommitted, true],
    [forceConfig(), false],
  ] as const)
    await assert.rejects(
      selectAvailableRoleAssignments(document, cfg, required, healthy),
      /explicit native models map/,
    );
  assert.equal(calls, 0);
});

test("missing model map never masks malformed maps or conflicting endpoints", async () => {
  const cfg = nativeConfig();
  for (const value of [null, [], "invalid"]) {
    Reflect.set(cfg.provider["llamacpp-research"]!, "models", value);
    await assert.rejects(
      selectAvailableRoleAssignments(localCommitted, cfg),
      /models.*must be an object/,
    );
  }
  Reflect.deleteProperty(cfg.provider["llamacpp-research"]!, "models");
  cfg.provider["llamacpp-research"]!.options.baseURL = "http://127.0.0.1:8999/v1";
  await assert.rejects(
    selectAvailableRoleAssignments(localCommitted, cfg),
    /must equal catalog URL/,
  );
});
