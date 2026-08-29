import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  FIXED_HARNESS_ROLES,
  normalizeAndValidateRoutingConfig,
  resolveAllHarnessRoleAssignments,
  resolveRoutingDecision,
  validateNativeProviderCoherence,
} from './routing-policy.mjs';
import { resolveModelForRole } from './model-routing-helper.mjs';
import { loadRoutingConfigSelection, mergeExternalRoutingDocuments, selectImplicitRoutingConfig } from './routing-config-loader.mjs';
import { loadRoutingConfig, parseArgs } from './resolve-model-routing.mjs';
import { applyHarnessRoleModelOverrides, resolveHarnessRoutingPath } from '../plugin-modules/role-model-routing-enforcement.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAMPLE_PATH = path.join(DIR, 'harness-model-routing.example.json');
const LOCAL_EXAMPLE_PATH = path.join(DIR, 'harness-model-routing.local.example.json');
const committed = JSON.parse(fs.readFileSync(EXAMPLE_PATH, 'utf8'));
const localCommitted = JSON.parse(fs.readFileSync(LOCAL_EXAMPLE_PATH, 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const neutralRouting = () => clone(committed.harnessModelRouting);
const routing = () => clone(localCommitted.harnessModelRouting);
function externalPair() {
  const profile = neutralRouting();
  const models = {
    'ai-infra-research': { model: 'ai-infra-research/research-model', routingServiceUrl: 'http://127.0.0.1:8080/v1', maxInFlight: 1 },
    'ai-infra-coder': { model: 'ai-infra-coder/coder-model', routingServiceUrl: 'http://127.0.0.1:8081/v1', maxInFlight: 2 },
  };
  delete profile.localRouting.models;
  profile.localRouting.enabled = true;
  profile.localRouting.forceLocalForHarnessSubagents = false;
  profile.localRouting.defaultLocalModel = 'ai-infra-coder';
  for (const [role, value] of Object.entries(profile.roleOverrides)) value.localModel = role === 'researcher' ? 'ai-infra-research' : 'ai-infra-coder';
  return { catalog: { schemaVersion: '1.0.0', models }, profile };
}
const execFileAsync = promisify(execFile);

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

function forceConfig() {
  const config = routing();
  config.providerClassMode = 'local-only';
  config.localRouting.forceLocalForHarnessSubagents = true;
  return config;
}

function nativeConfig() {
  return {
    agent: Object.fromEntries(FIXED_HARNESS_ROLES.map((role) => [role, { mode: 'subagent', marker: role }])),
    provider: {
      'llamacpp-research': {
        options: { baseURL: 'http://127.0.0.1:8080/v1/' },
        models: { 'qwen2.5-7b-instruct': { name: 'illustrative' } },
      },
      'llamacpp-coder': {
        options: { baseURL: 'http://127.0.0.1:8081/v1' },
        models: { 'qwen2.5-coder-7b': { name: 'illustrative' } },
      },
    },
  };
}

function writePair(root, { custom, example } = {}) {
  const routingDir = path.join(root, '.opencode/routing');
  fs.mkdirSync(routingDir, { recursive: true });
  if (custom !== undefined) fs.writeFileSync(path.join(routingDir, 'harness-model-routing.json'), custom);
  if (example !== undefined) fs.writeFileSync(path.join(routingDir, 'harness-model-routing.example.json'), example);
  return routingDir;
}

function copyRoutingBundle(routingDir) {
  fs.mkdirSync(routingDir, { recursive: true });
  for (const name of ['routing-policy.mjs', 'routing-config-loader.mjs', 'model-routing-helper.mjs', 'resolve-model-routing.mjs', 'harness-model-routing.example.json']) {
    fs.copyFileSync(path.join(DIR, name), path.join(routingDir, name));
  }
}

function createDirectoryAlias(target, alias) {
  fs.symlinkSync(target, alias, process.platform === 'win32' ? 'junction' : 'dir');
}

test('committed example config is strict v2, normalized freshly, and deterministic', () => {
  const input = deepFreeze(clone(committed));
  const first = normalizeAndValidateRoutingConfig(input);
  const second = normalizeAndValidateRoutingConfig(input);
  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.equal(first.schemaVersion, '2.0.0');
  assert.equal(first.localRouting.enabled, false);
  assert.equal(first.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(first.localRouting.defaultLocalModel, null);
  assert.deepEqual(first.localRouting.models, {});
  assert.ok(FIXED_HARNESS_ROLES.every((role) => first.roleOverrides[role].localModel === null));
  assert.deepEqual(Object.keys(first.roleOverrides), FIXED_HARNESS_ROLES);
});

test('separate local example is a valid enabled advisory fixture', () => {
  const normalized = normalizeAndValidateRoutingConfig(deepFreeze(clone(localCommitted)));
  assert.equal(normalized.localRouting.enabled, true);
  assert.equal(normalized.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(normalized.localRouting.defaultLocalModel, 'qwen-coder');
  assert.equal(Object.keys(normalized.localRouting.models).length, 2);
});

test('external catalog and profile merge deterministically without mutating inputs', () => {
  const fixture = externalPair();
  const catalog = deepFreeze(fixture.catalog);
  const profile = fixture.profile;
  deepFreeze(profile);
  const merged = mergeExternalRoutingDocuments(catalog, profile);
  const normalized = normalizeAndValidateRoutingConfig(merged);
  assert.deepEqual(normalized.localRouting.models, catalog.models);
  assert.equal(normalized.localRouting.forceLocalForHarnessSubagents, false);
  assert.equal(Object.hasOwn(profile.localRouting, 'models'), false);
});

test('external profile rejects embedded models, force mode, provider fields, and unknown references', () => {
  const { catalog, profile } = externalPair();
  assert.throws(() => mergeExternalRoutingDocuments(catalog, { ...profile, provider: {} }), /provider is forbidden/);
  assert.throws(() => mergeExternalRoutingDocuments(catalog, { ...profile, localRouting: { ...profile.localRouting, models: {} } }), /models is forbidden/);
  assert.throws(() => mergeExternalRoutingDocuments(catalog, { ...profile, localRouting: { ...profile.localRouting, forceLocalForHarnessSubagents: true } }), /contradicts providerClassMode/);
  const unknown = clone(profile);
  unknown.localRouting.defaultLocalModel = 'missing';
  assert.throws(() => normalizeAndValidateRoutingConfig(mergeExternalRoutingDocuments(catalog, unknown)), /must reference/);
});

test('external catalog rejects non-ai-infra keys, prefix mismatch, non-loopback URLs, bad ports, and budget overflow', () => {
  const { catalog, profile } = externalPair();
  const mutate = (fn) => { const value = clone(catalog); fn(value); return value; };
  assert.throws(() => mergeExternalRoutingDocuments(mutate((value) => { value.models.bad = value.models['ai-infra-coder']; delete value.models['ai-infra-coder']; }), profile), /invalid key/);
  assert.throws(() => mergeExternalRoutingDocuments(mutate((value) => { value.models['ai-infra-coder'].model = 'ai-infra-other/model'; }), profile), /provider prefix/);
  assert.throws(() => mergeExternalRoutingDocuments(mutate((value) => { value.models['ai-infra-coder'].routingServiceUrl = 'http://localhost:8081/v1'; }), profile), /loopback/);
  assert.throws(() => mergeExternalRoutingDocuments(mutate((value) => { value.models['ai-infra-coder'].routingServiceUrl = 'http://127.0.0.1:65536/v1'; }), profile), /invalid|range/);
  assert.throws(() => mergeExternalRoutingDocuments(mutate((value) => { value.models['ai-infra-coder'].maxInFlight = 2147483648; }), profile), /out of range/);
});

test('neutral routing resolves fixed command and variant without local identity', () => {
  const decision = resolveRoutingDecision({ config: committed, request: { command: '/delegate-implement' } });
  assert.equal(decision.agent, 'implementer');
  assert.equal(decision.model, null);
  assert.equal(decision.variant, null);
  assert.deepEqual(decision.local, { enforced: false, catalogName: null, routingServiceUrl: null, maxInFlight: null, networkCalls: false });
});

test('disabled local routing accepts empty state and keeps dormant catalog and selectors inert', () => {
  const empty = normalizeAndValidateRoutingConfig(neutralRouting());
  assert.deepEqual(empty.localRouting.models, {});

  const dormant = routing();
  dormant.localRouting.enabled = false;
  const localModel = dormant.localRouting.models['qwen-coder'].model;
  const roleDecision = resolveRoutingDecision({ config: dormant, request: { role: 'implementer' } });
  assert.equal(roleDecision.model, null);
  assert.deepEqual(roleDecision.local, { enforced: false, catalogName: null, routingServiceUrl: null, maxInFlight: null, networkCalls: false });
  const explicitDecision = resolveRoutingDecision({ config: dormant, request: { role: 'implementer', model: localModel } });
  assert.equal(explicitDecision.model, localModel);
  assert.equal(explicitDecision.local.catalogName, null);
  assert.equal(explicitDecision.local.routingServiceUrl, null);
  assert.equal(explicitDecision.local.maxInFlight, null);
});

test('enabled local routing rejects an empty catalog and schema encodes the same condition', () => {
  const enabledEmpty = neutralRouting();
  enabledEmpty.localRouting.enabled = true;
  assert.throws(() => normalizeAndValidateRoutingConfig(enabledEmpty), /at least one catalog entry when localRouting.enabled is true/);
  const schema = JSON.parse(fs.readFileSync(path.join(DIR, '../schemas/harness-model-routing.schema.json'), 'utf8'));
  const conditions = schema.$defs.routing.properties.localRouting.allOf;
  assert.ok(conditions.some((condition) => condition.if?.properties?.enabled?.const === true && condition.then?.properties?.models?.minProperties === 1));
  assert.equal(schema.$defs.routing.properties.localRouting.properties.models.minProperties, undefined);
});

test('force plan assigns all four by role selector or catalog default', () => {
  const config = forceConfig();
  config.roleOverrides.planner.localModel = null;
  const plan = resolveAllHarnessRoleAssignments(config);
  assert.equal(plan.mode, 'local-only');
  assert.deepEqual(Object.keys(plan.assignments), FIXED_HARNESS_ROLES);
  assert.equal(plan.assignments.planner.catalogName, 'qwen-coder');
  assert.equal(plan.assignments.researcher.catalogName, 'qwen-research');
  assert.ok(Object.values(plan.assignments).every(Boolean));
});

test('mixed applies local role mappings and preserves an explicit native override', () => {
  const config = routing();
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = 'cloud/coder';
  const plan = resolveAllHarnessRoleAssignments(config);
  assert.equal(plan.mode, 'mixed');
  assert.deepEqual(plan.assignments.implementer, { model: 'cloud/coder', catalogName: null, routingServiceUrl: null, maxInFlight: null });
  assert.equal(Object.values(plan.assignments).filter(Boolean).length, 4);
});

test('all fixed commands lock targets and reject every explicit escape shape', () => {
  const config = routing();
  for (const [command, entry] of Object.entries(config.commandOverrides)) {
    for (const request of [{}, { agent: entry.agent }, { role: entry.agent }, { agent: entry.agent, role: entry.agent }]) {
      assert.equal(resolveRoutingDecision({ config, request: { command, ...request } }).agent, entry.agent);
    }
    for (const target of ['build', 'general', 'custom-agent', FIXED_HARNESS_ROLES.find((role) => role !== entry.agent)]) {
      assert.throws(() => resolveRoutingDecision({ config, request: { command, agent: target } }), /conflicts with fixed command target/);
      assert.throws(() => resolveRoutingDecision({ config, request: { command, role: target } }), /conflicts with fixed command target/);
    }
  }
  assert.throws(() => resolveRoutingDecision({ config, request: { agent: 'build', role: 'general' } }), /agent and role conflict/);
});

test('fixed target conflicts precede model alias conflicts across target forms', () => {
  const config = forceConfig();
  for (const [command, entry] of Object.entries(config.commandOverrides)) {
    const mismatches = ['build', 'general', 'custom-agent', FIXED_HARNESS_ROLES.find((role) => role !== entry.agent)];
    for (const field of ['agent', 'role']) {
      for (const target of mismatches) {
        assert.throws(
          () => resolveRoutingDecision({
            config,
            request: { command, [field]: target, explicitModel: 'cloud/a', providerModel: 'cloud/b' },
          }),
          new RegExp(`\\$\\.request\\.${field}.*conflicts with fixed command target`),
        );
      }
      assert.throws(
        () => resolveRoutingDecision({
          config,
          request: { command, [field]: entry.agent, explicitModel: 'cloud/a', providerModel: 'cloud/b' },
        }),
        /conflicting explicit model aliases/,
      );
    }
  }
});

test('force model constraints are exact and force is fixed-role scoped', () => {
  const config = forceConfig();
  const selected = config.localRouting.models['qwen-coder'].model;
  assert.equal(resolveRoutingDecision({ config, request: { command: '/delegate-implement' } }).local.enforced, true);
  assert.equal(resolveRoutingDecision({ config, request: { command: '/delegate-implement', model: selected } }).model, selected);
  for (const value of ['cloud/model', 'unknown/model', config.localRouting.models['qwen-research'].model]) {
    assert.throws(() => resolveRoutingDecision({ config, request: { command: '/delegate-implement', model: value } }), /requires exact model/);
  }
  assert.equal(resolveRoutingDecision({ config, request: { agent: 'build', model: 'cloud/model' } }).local.enforced, false);
  assert.equal(resolveRoutingDecision({ config, request: { agent: 'build' } }).model, null);
});

test('force model aliases ignore absence sentinels and fail closed on ambiguity', () => {
  const config = forceConfig();
  const selected = config.localRouting.models['qwen-coder'].model;
  const exact = resolveRoutingDecision({
    config,
    request: { command: '/delegate-implement', agent: 'implementer', explicitModel: 'inherited', providerModel: selected },
  });
  assert.equal(exact.model, selected);
  assert.equal(exact.sources.model, 'userExplicitOverride');
  assert.equal(
    resolveRoutingDecision({
      config,
      request: { command: '/delegate-implement', role: 'implementer', explicitModel: 'inherited', providerModel: 'none', model: selected },
    }).model,
    selected,
  );
  assert.throws(
    () => resolveRoutingDecision({
      config,
      request: { command: '/delegate-implement', agent: 'implementer', explicitModel: 'inherited', providerModel: 'cloud/model' },
    }),
    /requires exact model/,
  );
  assert.throws(
    () => resolveRoutingDecision({
      config,
      request: { command: '/delegate-implement', role: 'implementer', explicitModel: 'inherited', providerModel: 'none', model: 'cloud/model' },
    }),
    /requires exact model/,
  );
  assert.equal(
    resolveRoutingDecision({
      config,
      request: { command: '/delegate-implement', explicitModel: selected, providerModel: selected },
    }).model,
    selected,
  );
  assert.throws(
    () => resolveRoutingDecision({
      config,
      request: { command: '/delegate-implement', explicitModel: selected, providerModel: 'cloud/model' },
    }),
    /conflicting explicit model aliases: explicitModel, providerModel/,
  );
});

test('advisory precedence and exact decision shape', () => {
  const config = routing();
  config.orchestratorCommands['/delegate-orchestration'].model = 'cloud/orchestrator';
  config.commandOverrides['/delegate-implement'].model = 'cloud/command';
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = 'cloud/role';
  config.complexityTiers.complex.model = 'cloud/complex';
  config.singleModel = { enabled: true, model: 'cloud/single' };
  config.defaultModel = 'cloud/default';
  assert.equal(resolveRoutingDecision({ config, request: { model: 'cloud/explicit', command: '/delegate-implement' } }).sources.model, 'userExplicitOverride');
  assert.equal(resolveRoutingDecision({ config, request: { command: '/delegate-orchestration' } }).model, 'cloud/orchestrator');
  assert.equal(resolveRoutingDecision({ config, request: { command: '/delegate-implement' } }).model, 'cloud/command');
  delete config.commandOverrides['/delegate-implement'];
  assert.equal(resolveRoutingDecision({ config, request: { role: 'implementer' } }).model, 'cloud/role');
  config.roleOverrides.implementer.model = null;
  assert.equal(resolveRoutingDecision({ config, request: { role: 'implementer', complexity: 'complex' } }).model, 'cloud/complex');
  config.complexityTiers.complex.model = null;
  assert.equal(resolveRoutingDecision({ config, request: {} }).model, 'cloud/single');
  config.singleModel.enabled = false;
  const decision = resolveRoutingDecision({ config, request: {} });
  assert.equal(decision.model, 'cloud/default');
  assert.deepEqual(Object.keys(decision), ['schemaVersion', 'agent', 'model', 'variant', 'source', 'sources', 'local']);
  assert.equal(decision.local.networkCalls, false);
  assert.equal(decision.local.enforced, false);
});

test('role local selector is advisory outside force and identifies metadata', () => {
  const decision = resolveRoutingDecision({ config: routing(), request: { role: 'implementer' } });
  assert.equal(decision.model, 'llamacpp-coder/qwen2.5-coder-7b');
  assert.equal(decision.sources.model, 'roleLocalModel');
  assert.deepEqual(decision.local, { enforced: false, catalogName: 'qwen-coder', routingServiceUrl: 'http://127.0.0.1:8081/v1', maxInFlight: 1, networkCalls: false });
});

test('overall source preserves fixed command routing while per-field sources remain precise', () => {
  const decision = resolveRoutingDecision({ config: routing(), request: { command: '/delegate-implement' } });
  assert.equal(decision.source, 'commandOverride');
  assert.equal(decision.sources.agent, 'commandOverride');
  assert.equal(decision.sources.model, 'roleLocalModel');
});

test('strict structure, roles, references, and types reject defects', () => {
  const cases = [
    [(c) => { delete c.schemaVersion; }, /schemaVersion.*required/],
    [(c) => { c.extra = true; }, /extra.*unknown property/],
    [(c) => { c.localRouting.enabled = 'true'; }, /must be a boolean/],
    [(c) => { c.localRouting.models['qwen-coder'].maxInFlight = 1.5; }, /integer of at least 1/],
    [(c) => { delete c.roleOverrides.validator; }, /exactly the four harness roles/],
    [(c) => { c.roleOverrides.builder = c.roleOverrides.validator; }, /exactly the four harness roles/],
    [(c) => { c.localRouting.defaultLocalModel = 'missing'; }, /must reference localRouting.models/],
    [(c) => { c.roleOverrides.implementer.localModel = 'missing'; }, /must reference localRouting.models/],
    [(c) => { c.roleOverrides.implementer.model = 'cloud/model'; }, /mutually exclusive/],
    [(c) => { c.localRouting.enabled = false; c.localRouting.forceLocalForHarnessSubagents = true; }, /requires enabled:true/],
    [(c) => { c.localRouting.models['Bad_Name'] = c.localRouting.models['qwen-coder']; delete c.localRouting.models['qwen-coder']; }, /catalog name must match/],
    [(c) => { c.defaultModel = 'missing-prefix'; }, /provider-prefixed/],
    [(c) => { c.orchestratorCommands.bad = c.orchestratorCommands['/delegate-orchestration']; delete c.orchestratorCommands['/delegate-orchestration']; }, /command keys must start with \/$/],
  ];
  for (const [mutate, pattern] of cases) {
    const config = routing(); mutate(config);
    assert.throws(() => normalizeAndValidateRoutingConfig(config), pattern);
  }
  const disabled = routing();
  disabled.localRouting.enabled = false;
  disabled.localRouting.forceLocalForHarnessSubagents = false;
  assert.equal(normalizeAndValidateRoutingConfig(disabled).localRouting.enabled, false);
});

test('URL, uniqueness, provider, and shared endpoint invariants', () => {
  for (const url of ['ftp://host/v1', 'http://user:pass@host/v1', 'http://host/v1?q=1', 'http://host/v1#x', 'relative/v1']) {
    const config = routing(); config.localRouting.models['qwen-coder'].routingServiceUrl = url;
    assert.throws(() => normalizeAndValidateRoutingConfig(config), /URL|HTTP|credentials/);
  }
  const trailing = routing();
  trailing.localRouting.models['qwen-coder'].routingServiceUrl += '///';
  assert.equal(normalizeAndValidateRoutingConfig(trailing).localRouting.models['qwen-coder'].routingServiceUrl, 'http://127.0.0.1:8081/v1');
  const duplicate = routing();
  duplicate.localRouting.models['qwen-coder'].model = duplicate.localRouting.models['qwen-research'].model;
  assert.throws(() => normalizeAndValidateRoutingConfig(duplicate), /models must be unique/);
  const providerTwoUrls = routing();
  providerTwoUrls.localRouting.models['qwen-coder'].model = 'llamacpp-research/other';
  assert.throws(() => normalizeAndValidateRoutingConfig(providerTwoUrls), /more than one canonical URL/);
  const shared = routing();
  shared.localRouting.models['qwen-coder'].routingServiceUrl = 'http://127.0.0.1:8080/v1/';
  shared.localRouting.models['qwen-coder'].maxInFlight = 2;
  assert.doesNotThrow(() => normalizeAndValidateRoutingConfig(shared));
  shared.localRouting.models['qwen-coder'].maxInFlight = 1;
  assert.throws(() => normalizeAndValidateRoutingConfig(shared), /equal maxInFlight/);
});

test('legacy keys fail with actionable hard-migration guidance', () => {
  for (const key of ['localModel', 'routingServiceUrl', 'localModelEnabled', 'preferLocal', 'localModelFallback']) {
    const config = routing(); config[key] = {};
    assert.throws(() => normalizeAndValidateRoutingConfig(config), /localRouting\.models.*defaultLocalModel.*enabled.*forceLocalForHarnessSubagents.*native providers.*restart/);
  }
  assert.doesNotThrow(() => normalizeAndValidateRoutingConfig(routing()));
});

test('resolution does not mutate frozen inputs and repeats identically', () => {
  const config = deepFreeze(routing());
  const request = deepFreeze({ command: '/delegate-implement', agent: 'implementer' });
  assert.deepEqual(resolveRoutingDecision({ config, request }), resolveRoutingDecision({ config, request }));
});

test('helper, CLI, and core decisions are identical', async () => {
  const request = { command: '/delegate-implement' };
  const core = resolveRoutingDecision({ config: committed, request });
  const helper = await resolveModelForRole({ config: committed, command: request.command });
  const { stdout } = await execFileAsync(process.execPath, [path.join(DIR, 'resolve-model-routing.mjs'), '--config', EXAMPLE_PATH, '--metadata-json', JSON.stringify(request)]);
  assert.deepEqual(helper, core);
  assert.deepEqual(JSON.parse(stdout), core);
});

test('helper and CLI match explicit advisory local fixture', async () => {
  const request = { command: '/delegate-implement' };
  const core = resolveRoutingDecision({ config: localCommitted, request });
  const helper = await resolveModelForRole({ config: localCommitted, command: request.command });
  const { stdout } = await execFileAsync(process.execPath, [path.join(DIR, 'resolve-model-routing.mjs'), '--config', LOCAL_EXAMPLE_PATH, '--metadata-json', JSON.stringify(request)]);
  assert.equal(core.model, 'llamacpp-coder/qwen2.5-coder-7b');
  assert.equal(core.local.enforced, false);
  assert.deepEqual(helper, core);
  assert.deepEqual(JSON.parse(stdout), core);
});

test('shared loader selects custom first and example only when custom is absent', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-loader-'));
  try {
    const exampleOnly = writePair(path.join(temp, 'example-only'), { example: JSON.stringify(committed) });
    const selectedExample = loadRoutingConfigSelection({ fallbackDirectory: exampleOnly });
    assert.equal(selectedExample.source, 'example');
    assert.deepEqual(selectedExample.document, committed);

    const customFirst = writePair(path.join(temp, 'custom-first'), {
      custom: JSON.stringify({ marker: 'custom' }),
      example: JSON.stringify({ marker: 'example' }),
    });
    const selectedCustom = loadRoutingConfigSelection({ fallbackDirectory: customFirst });
    assert.equal(selectedCustom.source, 'custom');
    assert.equal(selectedCustom.document.marker, 'custom');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('present malformed or semantically invalid custom never falls back to valid example', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-loader-bad-custom-'));
  try {
    const malformed = writePair(path.join(temp, 'malformed'), { custom: '{', example: JSON.stringify(committed) });
    assert.throws(() => loadRoutingConfigSelection({ fallbackDirectory: malformed }), /Malformed routing config JSON/);

    const invalid = clone(committed);
    invalid.harnessModelRouting.schemaVersion = 'invalid';
    const invalidDir = writePair(path.join(temp, 'invalid'), { custom: JSON.stringify(invalid), example: JSON.stringify(committed) });
    const selected = loadRoutingConfigSelection({ fallbackDirectory: invalidDir });
    assert.equal(selected.source, 'custom');
    assert.throws(() => normalizeAndValidateRoutingConfig(selected.document), /schemaVersion/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('dangling symlink and directory custom entries are selected and fail closed', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-loader-entry-'));
  try {
    const danglingDir = writePair(path.join(temp, 'dangling'), { example: JSON.stringify(committed) });
    const danglingCustom = path.join(danglingDir, 'harness-model-routing.json');
    fs.symlinkSync(path.join(danglingDir, 'missing-target.json'), danglingCustom);
    assert.equal(selectImplicitRoutingConfig({ fallbackDirectory: danglingDir }).source, 'custom');
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: danglingDir }),
      (error) => error.message.includes('Unable to read routing config') && error.message.includes(danglingCustom),
    );

    const directoryDir = writePair(path.join(temp, 'directory'), { example: JSON.stringify(committed) });
    const directoryCustom = path.join(directoryDir, 'harness-model-routing.json');
    fs.mkdirSync(directoryCustom);
    assert.equal(selectImplicitRoutingConfig({ fallbackDirectory: directoryDir }).source, 'custom');
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: directoryDir }),
      (error) => error.message.includes('Unable to read routing config') && error.message.includes(directoryCustom),
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('absent pair is actionable and explicit paths are exact despite siblings', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-loader-exact-'));
  try {
    assert.throws(
      () => loadRoutingConfigSelection({ fallbackDirectory: temp }),
      (error) => error.message.includes(path.join(temp, 'harness-model-routing.json')) &&
        error.message.includes(path.join(temp, 'harness-model-routing.example.json')) &&
        error.message.includes('cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json'),
    );
    const sibling = path.join(temp, 'harness-model-routing.example.json');
    fs.writeFileSync(sibling, JSON.stringify(committed));
    const missing = path.join(temp, 'missing.json');
    assert.throws(() => loadRoutingConfigSelection({ configPath: missing }), /Unable to read routing config/);
    const malformed = path.join(temp, 'malformed.json');
    fs.writeFileSync(malformed, '{');
    assert.throws(() => loadRoutingConfigSelection({ configPath: malformed }), /Malformed routing config JSON/);
    const exact = loadRoutingConfigSelection({ configPath: sibling });
    assert.equal(exact.source, 'explicit');
    assert.equal(exact.path, sibling);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('helper and CLI preserve omitted versus explicit config intent', async () => {
  assert.equal(parseArgs([]).configPath, undefined);
  assert.equal(parseArgs(['--config', EXAMPLE_PATH]).configPath, EXAMPLE_PATH);
  assert.deepEqual(loadRoutingConfig(EXAMPLE_PATH), committed);
  assert.deepEqual(await resolveModelForRole({ configPath: EXAMPLE_PATH, command: '/delegate-implement' }), resolveRoutingDecision({ config: committed, request: { command: '/delegate-implement' } }));
  await assert.rejects(resolveModelForRole({ config: null, configPath: path.join(DIR, 'missing.json') }), /must be an object/);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-entrypoints-'));
  try {
    const routingDir = path.join(temp, '.opencode/routing');
    fs.mkdirSync(routingDir, { recursive: true });
    for (const name of ['routing-policy.mjs', 'routing-config-loader.mjs', 'model-routing-helper.mjs', 'resolve-model-routing.mjs', 'harness-model-routing.example.json']) {
      fs.copyFileSync(path.join(DIR, name), path.join(routingDir, name));
    }
    const isolatedHelper = await import(`${pathToFileURL(path.join(routingDir, 'model-routing-helper.mjs')).href}?isolated=1`);
    assert.deepEqual(await isolatedHelper.resolveModelForRole({ command: '/delegate-implement' }), resolveRoutingDecision({ config: committed, request: { command: '/delegate-implement' } }));
    const { stdout } = await execFileAsync(process.execPath, [path.join(routingDir, 'resolve-model-routing.mjs'), '--metadata-json', '{"command":"/delegate-implement"}']);
    assert.deepEqual(JSON.parse(stdout), resolveRoutingDecision({ config: committed, request: { command: '/delegate-implement' } }));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('routing CLI executes through aliased copied entry and preserves decision parity', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-cli-alias-'));
  try {
    const routingDir = path.join(temp, 'routing-bundle');
    const aliasDir = path.join(temp, 'routing-alias');
    copyRoutingBundle(routingDir);
    createDirectoryAlias(routingDir, aliasDir);

    const request = { command: '/delegate-implement' };
    const expected = resolveRoutingDecision({ config: committed, request });
    const args = ['--metadata-json', JSON.stringify(request)];
    const aliasResult = spawnSync(process.execPath, [path.join(aliasDir, 'resolve-model-routing.mjs'), ...args], { encoding: 'utf8' });
    const canonicalResult = spawnSync(process.execPath, [path.join(routingDir, 'resolve-model-routing.mjs'), ...args], { encoding: 'utf8' });

    for (const result of [aliasResult, canonicalResult]) {
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0);
      assert.equal(result.signal, null);
      assert.notEqual(result.stdout, '');
      assert.equal(result.stderr, '');
      assert.deepEqual(JSON.parse(result.stdout), expected);
    }
    assert.deepEqual(JSON.parse(aliasResult.stdout), JSON.parse(canonicalResult.stdout));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('routing CLI import is inert', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-cli-import-'));
  try {
    const routingDir = path.join(temp, 'routing-bundle');
    copyRoutingBundle(routingDir);
    const cliUrl = pathToFileURL(path.join(routingDir, 'resolve-model-routing.mjs')).href;
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `await import(${JSON.stringify(cliUrl)})`], { encoding: 'utf8' });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0);
    assert.equal(result.signal, null);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('routing CLI native-realpath fallback is alias-safe and fail-closed', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-cli-fallback-'));
  try {
    const routingDir = path.join(temp, 'routing-bundle');
    const aliasDir = path.join(temp, 'routing-alias');
    copyRoutingBundle(routingDir);
    createDirectoryAlias(routingDir, aliasDir);

    const cli = path.join(routingDir, 'resolve-model-routing.mjs');
    const featureTest = "typeof import.meta.main === 'boolean'";
    const source = fs.readFileSync(cli, 'utf8');
    assert.equal(source.split(featureTest).length - 1, 1);
    fs.writeFileSync(cli, source.replace(featureTest, 'false'));

    const request = { command: '/delegate-implement' };
    const expected = resolveRoutingDecision({ config: committed, request });
    const aliasResult = spawnSync(
      process.execPath,
      [path.join(aliasDir, 'resolve-model-routing.mjs'), '--metadata-json', JSON.stringify(request)],
      { encoding: 'utf8' },
    );
    assert.equal(aliasResult.error, undefined);
    assert.equal(aliasResult.status, 0);
    assert.equal(aliasResult.signal, null);
    assert.notEqual(aliasResult.stdout, '');
    assert.equal(aliasResult.stderr, '');
    assert.deepEqual(JSON.parse(aliasResult.stdout), expected);

    const cliUrl = pathToFileURL(cli).href;
    const missingEntry = path.join(temp, 'missing-entry.mjs');
    const importScripts = [
      `delete process.argv[1]; await import(${JSON.stringify(`${cliUrl}?absent-entry`)});`,
      `process.argv[1] = ${JSON.stringify(missingEntry)}; await import(${JSON.stringify(`${cliUrl}?missing-entry`)});`,
    ];
    for (const script of importScripts) {
      const result = spawnSync(process.execPath, ['--input-type=module', '--eval', script], { encoding: 'utf8' });
      assert.equal(result.error, undefined);
      assert.equal(result.status, 0);
      assert.equal(result.signal, null);
      assert.equal(result.stdout, '');
      assert.equal(result.stderr, '');
    }
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('plugin discovers nested project pairs, prefers custom, and keeps explicit/document boundaries exact', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-plugin-discovery-'));
  try {
    const root = path.join(temp, 'project');
    const routingDir = writePair(root, { example: JSON.stringify(committed) });
    const nested = path.join(root, 'a/b');
    fs.mkdirSync(nested, { recursive: true });
    assert.equal(resolveHarnessRoutingPath({ directory: nested }), path.join(routingDir, 'harness-model-routing.example.json'));
    fs.writeFileSync(path.join(routingDir, 'harness-model-routing.json'), JSON.stringify(committed));
    assert.equal(resolveHarnessRoutingPath({ directory: nested }), path.join(routingDir, 'harness-model-routing.json'));
    assert.throws(() => applyHarnessRoleModelOverrides(nativeConfig(), { routingPath: path.join(routingDir, 'missing.json') }), /Unable to read routing config/);
    assert.doesNotThrow(() => applyHarnessRoleModelOverrides(nativeConfig(), { routingDocument: committed, routingPath: path.join(routingDir, 'missing.json') }));
    assert.throws(() => applyHarnessRoleModelOverrides(nativeConfig(), { routingDocument: null, routingPath: path.join(routingDir, 'missing.json') }), /must be an object/);
    const moduleFallback = selectImplicitRoutingConfig({ startPath: path.join(temp, 'no-project') });
    assert.equal(moduleFallback.root, DIR);
    assert.ok(['custom', 'example'].includes(moduleFallback.source));
    const noMutation = nativeConfig();
    applyHarnessRoleModelOverrides(noMutation, { routingPath: EXAMPLE_PATH });
    assert.ok(FIXED_HARNESS_ROLES.every((role) => !Object.hasOwn(noMutation.agent[role], 'model')));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('CLI rejects malformed arguments and metadata', async () => {
  const cli = path.join(DIR, 'resolve-model-routing.mjs');
  for (const args of [['--unknown', 'x'], ['--config'], ['--metadata-json', '{'], ['--metadata-json', '[]']]) {
    await assert.rejects(execFileAsync(process.execPath, [cli, ...args]));
  }
});

test('native coherence returns evidence and rejects missing provider relationships', () => {
  const plan = resolveAllHarnessRoleAssignments(forceConfig());
  const cfg = nativeConfig();
  const evidence = validateNativeProviderCoherence(cfg, plan);
  assert.equal(evidence.providers.implementer.provider, 'llamacpp-coder');
  const defects = [
    (c) => { delete c.agent.researcher; },
    (c) => { c.agent.researcher.mode = 'primary'; },
    (c) => { delete c.provider['llamacpp-research']; },
    (c) => { c.provider['llamacpp-research'].options.baseURL = 'http://127.0.0.1:9999/v1'; },
    (c) => { delete c.provider['llamacpp-research'].models['qwen2.5-7b-instruct']; },
  ];
  for (const mutate of defects) {
    const bad = nativeConfig(); mutate(bad);
    assert.throws(() => validateNativeProviderCoherence(bad, plan));
  }
});

test('force enforcement mutates all four agents only after complete preflight', () => {
  const cfg = nativeConfig();
  const providersBefore = clone(cfg.provider);
  const plan = applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() });
  assert.equal(plan.mode, 'local-only');
  assert.ok(FIXED_HARNESS_ROLES.every((role) => typeof cfg.agent[role].model === 'string' && cfg.agent[role].mode === 'subagent'));
  assert.deepEqual(cfg.provider, providersBefore);
});

test('non-force enforcement preserves config-derived null/no-own-property behavior', () => {
  const cfg = nativeConfig();
  applyHarnessRoleModelOverrides(cfg, { routingDocument: committed });
  assert.ok(FIXED_HARNESS_ROLES.every((role) => !Object.hasOwn(cfg.agent[role], 'model')));
  const config = routing();
  config.roleOverrides.implementer.localModel = null;
  config.roleOverrides.implementer.model = 'llamacpp-coder/qwen2.5-coder-7b';
  applyHarnessRoleModelOverrides(cfg, { routingDocument: config });
  assert.equal(cfg.agent.implementer.model, 'llamacpp-coder/qwen2.5-coder-7b');
  assert.equal(FIXED_HARNESS_ROLES.filter((role) => Object.hasOwn(cfg.agent[role], 'model')).length, 4);
});

test('neutral config is inert while mixed local config applies validated mappings', () => {
  const neutral = { agent: Object.fromEntries(FIXED_HARNESS_ROLES.map((role) => [role, { mode: 'subagent' }])) };
  const before = clone(neutral);
  const neutralPlan = applyHarnessRoleModelOverrides(neutral, { routingDocument: committed });
  assert.equal(neutralPlan.mode, 'mixed');
  assert.ok(Object.values(neutralPlan.assignments).every((assignment) => assignment === null));
  assert.deepEqual(neutral, before);
  const local = nativeConfig();
  const localPlan = applyHarnessRoleModelOverrides(local, { routingDocument: localCommitted });
  assert.equal(localPlan.mode, 'mixed');
  assert.ok(FIXED_HARNESS_ROLES.every((role) => typeof local.agent[role].model === 'string'));
});

test('strict provider modes mutate native filters only after full preflight', () => {
  const localCfg = nativeConfig();
  localCfg.enabled_providers = ['cloud', 'llamacpp-research'];
  localCfg.disabled_providers = ['llamacpp-coder', 'other'];
  applyHarnessRoleModelOverrides(localCfg, { routingDocument: forceConfig() });
  assert.deepEqual(localCfg.enabled_providers, ['llamacpp-coder', 'llamacpp-research']);
  assert.deepEqual(localCfg.disabled_providers, ['other']);

  const cloud = routing();
  cloud.providerClassMode = 'cloud-only';
  cloud.localRouting.defaultLocalModel = null;
  for (const role of FIXED_HARNESS_ROLES) cloud.roleOverrides[role].localModel = null;
  const cloudCfg = nativeConfig();
  cloudCfg.enabled_providers = ['cloud', 'llamacpp-coder'];
  cloudCfg.disabled_providers = ['other'];
  const plan = applyHarnessRoleModelOverrides(cloudCfg, { routingDocument: cloud });
  assert.ok(Object.values(plan.assignments).every((assignment) => assignment === null));
  assert.deepEqual(cloudCfg.enabled_providers, ['cloud']);
  assert.deepEqual(cloudCfg.disabled_providers, ['llamacpp-coder', 'llamacpp-research', 'other']);
});

test('every force failure position including fourth is atomic and providers never mutate', () => {
  for (const failedRole of FIXED_HARNESS_ROLES) {
    const cfg = nativeConfig();
    delete cfg.agent[failedRole];
    const before = clone(cfg);
    assert.throws(() => applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() }), /enforcement failed/);
    assert.deepEqual(cfg, before);
  }
  const cfg = nativeConfig();
  delete cfg.provider['llamacpp-coder'].models['qwen2.5-coder-7b'];
  const before = clone(cfg);
  assert.throws(() => applyHarnessRoleModelOverrides(cfg, { routingDocument: forceConfig() }));
  assert.deepEqual(cfg, before);
});

test('file enforcement reports read and parse diagnostics', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'routing-policy-'));
  assert.throws(() => applyHarnessRoleModelOverrides(nativeConfig(), { routingPath: path.join(temp, 'missing.json') }), /Unable to read routing config/);
  const malformed = path.join(temp, 'bad.json');
  fs.writeFileSync(malformed, '{');
  assert.throws(() => applyHarnessRoleModelOverrides(nativeConfig(), { routingPath: malformed }), /Malformed routing config JSON/);
  fs.rmSync(temp, { recursive: true, force: true });
});
