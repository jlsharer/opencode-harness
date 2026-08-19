# OpenCode Harness Runtime 0.1.10

`opencode-harness-runtime` is a no-copy launcher for the repository's four-role OpenCode delegation harness: `researcher`, `planner`, `implementer`, and `validator`. Planner, implementer, and validator packets carry explicit bounded task modes for synthesis, integration, adversarial review, artifact proof, and integration checks.

The package supports Linux, Node.js `>=24 <25`, and exactly OpenCode `1.18.18`. Git is required in each target workspace. npm is required only to create a local package tarball; global installation and npm publication are not required.

## Source checkout and local package

Run the source-local CLI from the package checkout:

```sh
node bin/opencode-harness.mjs --help
node bin/opencode-harness.mjs prepare
node bin/opencode-harness.mjs prepare --cache-root /OWNER/ONLY/CACHE
```

Audit the package contents without publishing:

```sh
npm pack --dry-run --json
install -d -m 700 /OWNER/ONLY/PACKS
npm pack --pack-destination /OWNER/ONLY/PACKS
mkdir -m 700 /OWNER/ONLY/EXTRACT
tar -xzf /OWNER/ONLY/PACKS/opencode-harness-runtime-0.1.10.tgz -C /OWNER/ONLY/EXTRACT
node /OWNER/ONLY/EXTRACT/package/bin/opencode-harness.mjs --help
```

The placeholders above must be replaced with trusted, owner-only absolute paths. A locally extracted tarball is sufficient; do not infer that this version exists in any registry.

## Prepare and run

The complete launcher grammar is:

```text
opencode-harness prepare [--cache-root ABS]
opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]
opencode-harness run --workspace ABS [--trace-root ABS] [--cache-root ABS]
  [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]
  [--allow-project-plugins] [-- OPENCODE_ARGS...]
```

Examples from a source checkout:

```sh
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- models
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- run --format json --model PROVIDER/MODEL "Use /delegate-orchestration for this scoped workflow"
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- run --command delegate-orchestration "Investigate the setup friction and implement a validated one-command bootstrap"
```

Tokens after `--` are passed unchanged as OpenCode arguments. With no forwarded tokens, OpenCode opens its TUI in the workspace. `/delegate-orchestration` accepts an ordinary-language goal. The parent extracts supplied constraints, asks focused follow-ups only when a required user decision is unresolved, and assembles the internal `.opencode/schemas/orchestration-input.schema.json` object itself; callers do not need to write JSON. Mechanical IDs and bounded coordination fields are generated, while live providers, global mutation, Git mutation, scope expansion, and parallel execution default to denied. The parent then delegates and synthesizes only. Direct role commands and direct `@role` subagent dispatch bypass the required fresh-task policy and are rejected. Every fresh role dispatch uses a contract-complete Task packet containing a nonempty unique `delegationTaskId`, a stable `scopeKey`, an explicit allowed `taskMode`, and `dispatchKind: fresh`, with the `task_id` property omitted entirely. A `task_id` is not a general continuation handle: it may appear only once in a matching `dispatchKind: clarification-response` packet for one recorded, unresolved, child-originated clarification. New work, follow-up, retry, remediation, correction, replay, changed scope, mismatch, terminal work, or post-restart handling starts a fresh task without `task_id` or fails closed. `models` and `run` can contact configured providers; local, delegated, and cloud calls are live, may require external authentication, and are not accepted by this package's fixture tests. Cloud calls may also be billable.

## Optional provider and routing inputs

Provider transport is independently optional. The endpoint catalog and advisory routing profile must be supplied together. All three files must be trusted absolute files, owner-owned, mode `0600`, and credential-free.

Example provider projection:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "ai-infra-node": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "LOCAL NODE PLACEHOLDER",
      "options": { "baseURL": "http://127.0.0.1:18080/v1" },
      "models": {
        "node-model": {
          "name": "node-model",
          "limit": { "context": 32768, "output": 4096 },
          "options": { "chat_template_kwargs": { "enable_thinking": false } }
        }
      }
    }
  }
}
```

Port `18080` is illustrative and does not claim a listening service; replace it with the approved integer from 1 through 65535. The closed schema accepts only canonical loopback HTTP `/v1` URLs. Context and output limits are positive integers, and output must be less than context.

Matching endpoint catalog:

```json
{
  "schemaVersion": "1.0.0",
  "models": {
    "ai-infra-node": {
      "model": "ai-infra-node/node-model",
      "routingServiceUrl": "http://127.0.0.1:18080/v1",
      "maxInFlight": 1
    }
  }
}
```

Matching unwrapped schema-2 advisory profile:

```json
{
  "schemaVersion": "2.0.0",
  "defaultMode": "single-model",
  "defaultModel": null,
  "singleModel": { "enabled": false, "model": null },
  "localRouting": {
    "enabled": true,
    "forceLocalForHarnessSubagents": false,
    "defaultLocalModel": "ai-infra-node"
  },
  "roleOverrides": {
    "researcher": { "model": null, "localModel": "ai-infra-node", "variant": "research" },
    "planner": { "model": null, "localModel": "ai-infra-node", "variant": "planning" },
    "implementer": { "model": null, "localModel": "ai-infra-node", "variant": null },
    "validator": { "model": null, "localModel": "ai-infra-node", "variant": "audit" }
  },
  "commandOverrides": {},
  "orchestratorCommands": {},
  "complexityTiers": {}
}
```

The profile cannot contain catalog models, provider options, or credentials, and its required `forceLocalForHarnessSubagents` policy must remain `false`. Catalog/profile routing is advisory: it does not create native provider transport or prove model identity, endpoint health, capacity, or delegation quality. Supply the inputs as follows:

```sh
node bin/opencode-harness.mjs run \
  --workspace /ABSOLUTE/GIT/WORKSPACE \
  --provider-config /OWNER/ONLY/provider.json \
  --routing-catalog /OWNER/ONLY/catalog.json \
  --routing-profile /OWNER/ONLY/profile.json
```

Authentication remains native external OpenCode state. Do not place tokens, credentials, auth paths, global configuration, provider secrets, or `OPENCODE_CONFIG_CONTENT` secrets in these files or command examples.

### Offline input validation

`validate-inputs` applies the same closed provider, catalog, profile, metadata, force-local, and cross-document checks used by `run`, without preparing a runtime or selecting a workspace:

```sh
node bin/opencode-harness.mjs validate-inputs \
  --provider-config /OWNER/ONLY/provider.json \
  --routing-catalog /OWNER/ONLY/catalog.json \
  --routing-profile /OWNER/ONLY/profile.json
```

The accepted combinations are provider alone, catalog plus profile, or all three. No inputs, a partial catalog/profile pair, duplicate or unknown options, workspace/cache/trace/plugin options, positional files, and `--` forwarding are rejected. Each file must be an absolute current-user-owned mode-`0600` regular JSON file of at most 1 MiB beneath trusted resolved ancestry. A caller-supplied symbolic-link leaf is rejected, and reads retain no-follow and before/after stability checks.

Success exits `0`, writes nothing to stderr, and writes exactly one compact JSON line to stdout (shown here for all three inputs):

```json
{"schemaVersion":"1.0.0","valid":true,"packageVersion":"0.1.10","inputs":{"providerConfig":true,"routingCatalog":true,"routingProfile":true}}
```

A grammar, trust, parse, schema, policy, or cross-document failure exits `1`, writes no stdout, and writes one human-readable error line to stderr. This command performs package compatibility reads and explicit input reads only: it does not inspect a workspace, create cache/trace/snapshot/database state, resolve or run OpenCode, spawn a child, contact a provider, or inspect or mutate global OpenCode/auth state. Ambient OpenCode, harness, HOME, XDG, database, executable, and PATH variables do not select validation inputs. Success proves offline structural and semantic compatibility only, not endpoint health, model identity, authentication, capacity, OpenCode activation, or restart acceptance. Consumers must strictly parse the result and separately pin package/source/entrypoint identity.

## Runtime, traces, and rollback

`prepare` creates or verifies an owner-only cache under the default versioned cache root, or under an optional canonical absolute `--cache-root`. Package version `0.1.10` and harness adapter version `0.1.0` describe different contracts and intentionally differ. Managed drift, unsafe ownership or modes, symlinks, and collisions fail closed; the launcher does not repair them. Prior package-version caches remain separate and retained. Roll back by invoking retained version `0.1.9`, not by using a rollback subcommand.

Launcher setup does not copy or create workspace `.opencode` and does not itself edit workspace files or Git state. After spawn, OpenCode commands and project plugins explicitly allowed with `--allow-project-plugins` run in the workspace and can modify files or Git state; review their actions and resulting diffs. Runtime, workspace, trace, launch-snapshot, and database roots remain separate. Ambient `OPENCODE_DB` is rejected; each launch receives unique initially absent database, WAL, and SHM paths. `XDG_DATA_HOME` passes through unchanged. Cleanup failures and identity mismatches fail closed and report an absolute retained launch or quarantine path for owner action.

Trace selection is, in order:

1. an explicit safe canonical absolute `--trace-root`;
2. a safe workspace `.memory` that Git already ignores; or
3. owner-only XDG state keyed by the canonical workspace.

Generated coordination evidence lives under `.memory/orchestrations/<orchestration-id>/` and role evidence under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`. Traces are handoff evidence, not package authority or proof of unrun checks.

When the selected trace root is external to the workspace, the separate trace-permission plugin appends one role-specific absolute `external_directory` allow for each of the four roles. It also appends a workspace-relative, role-specific `*.md` edit allow for exactly the three trace-only roles; implementer retains its existing edit policy unchanged. Sibling-role paths, non-Markdown trace edits, and whole-root grants remain unauthorized. Before the requested OpenCode process starts, the launcher uses a distinct private database/snapshot to run `agent list` and requires an exclusive owner-only marker proving the resolved config contains that exact plan. Missing, malformed, or mismatched activation fails before provider-backed requested work. If the selected root is exactly workspace `.memory`, the plugin performs no mutation and the launcher performs no activation probe.

## Trust and activation boundaries

The workspace must be a trusted canonical absolute Git worktree. Project command, agent, skill, routing, provider, and harness-plugin collisions reject launch. Custom skill roots must be trusted canonical absolute paths. The launcher resolves one OpenCode executable, requires exact version `1.18.18`, and uses that same executable for probing and launch.

Project plugins are unsandboxed same-user code. `--allow-project-plugins` is explicit acknowledgment, not isolation. The package targets accidental and other-UID drift; malicious same-UID replacement, registry compromise, and a compromised package artifact remain outside its boundary.

Fully quit and restart OpenCode after package, provider, routing, plugin, agent, command, skill, or configuration changes. Fixture tests do not establish real provider activation, authentication, network reachability, model identity, endpoint capacity, or recovery behavior.

## Offline source and package checks

Run from the source checkout:

```sh
node --check bin/opencode-harness.mjs
node bin/opencode-harness.mjs --help
node .opencode/routing/routing-policy.test.mjs
node --test .opencode/scripts/runtime-harness.test.mjs
node --test .opencode/scripts/runtime-foreign-repo.test.mjs
node .opencode/scripts/portable-harness.test.mjs
node .opencode/scripts/validate-harness.mjs
node .opencode/scripts/validate-portable-harness.mjs --root .
npm pack --dry-run --json
git diff --check
```

These checks cover source inventory, routing policy, no-copy runtime behavior, foreign-workspace Git isolation, the portable profile, and the exact 40-entry Linux npm payload with fake children and fixtures. The npm package excludes Darwin bootstrap source/binaries, dedicated trace-permission tests, source-only policy tests, private/generated trace state, and custom routing. Inspect any concrete local tarball separately for `package/README.md`, package version `0.1.10`, executable `package/bin/opencode-harness.mjs`, and the same exact allowlist. The activation marker and plugin hooks are startup guardrails, not validator acceptance evidence or proof of provider/model behavior.
