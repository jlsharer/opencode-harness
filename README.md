# OpenCode Harness Runtime 0.1.11

`opencode-harness-runtime` launches the repository's four-role delegation
harness without copying `.opencode` into the target project. The active roles
are exactly `researcher`, `planner`, `implementer`, and `validator`. Integration,
review, synthesis, artifact proof, and integration checks are task modes of
those roles, not additional agents.

Package version `0.1.11` requires Linux, Node.js 24, Git, and OpenCode
`1.18.18` through `1.18.25`, inclusive. npm is needed only to build a local
tarball. Global installation and publication are not required. Roll back by
invoking retained version `0.1.10`.

## Prepare and run

From this checkout:

```sh
node bin/opencode-harness.mjs --help
node bin/opencode-harness.mjs prepare
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- models
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- \
  run --model PROVIDER/MODEL "Use /delegate-orchestration for this task"
```

Launcher grammar:

```text
opencode-harness prepare [--cache-root ABS]
opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]
opencode-harness run --workspace ABS [--trace-root ABS] [--cache-root ABS]
  [--provider-config FILE]
  [--routing-catalog FILE --routing-profile FILE]
  [--allow-project-plugins] [-- OPENCODE_ARGS...]
```

Tokens after `--` are unchanged OpenCode arguments. With none, the TUI opens in
the workspace. OpenCode and its agents can modify that workspace; use a clean
disposable clone or verified backup for initial testing and inspect Git status
and diff afterward.

To inspect a local package without publishing it:

```sh
npm pack --dry-run --json
install -d -m 700 /OWNER/ONLY/PACKS /OWNER/ONLY/EXTRACT
npm pack --pack-destination /OWNER/ONLY/PACKS
tar -xzf /OWNER/ONLY/PACKS/opencode-harness-runtime-0.1.11.tgz \
  -C /OWNER/ONLY/EXTRACT
node /OWNER/ONLY/EXTRACT/package/bin/opencode-harness.mjs --help
```

An inspected extraction is sufficient. Do not assume this version exists in a
registry. `prepare` uses version-separated caches, so retained package versions
remain independently runnable for rollback.

`/delegate-orchestration` is the managed delegation entry point. The parent
build agent creates bounded fresh tasks and delegates to the four roles. Direct
role commands and direct `@role` dispatch are rejected because they bypass the
fresh-task policy.

## Local nodes and an external project

The preferred topology keeps inference, harness runtime, and work separate:

| Location | Responsibility |
|---|---|
| `ai-infrastructure/llama-server` | llama.cpp nodes, tunnels, context, provider projection |
| This checkout | pinned OpenCode runtime and harness controls |
| `/ABSOLUTE/GIT/WORKSPACE` | unrelated target project |

The target project does not need a copied `.opencode` tree or a provider block
in its `opencode.json`. Follow **Fast path: use local nodes from a separate
project** in the paired `llama-server/README.md`. That path:

1. Creates owner-only node and projection inputs.
2. Validates the server, exact model ID, health, and GPU state.
3. Optionally commits a transactional context increase.
4. Creates a schema-2 routing profile.
5. Publishes provider/catalog files and binds them to the target workspace.
6. Activates remote tunnels and runs this harness against that binding.

The infrastructure wrapper is the normal entry point:

```sh
INTEGRATION=/OWNER/ONLY/SRC/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh
HARNESS_ROOT=/OWNER/ONLY/SRC/opencode-harness
WORKSPACE=/OWNER/ONLY/SRC/target-project
PROJECTION_ROOT=/OWNER/ONLY/CONFIG/opencode/ai-infrastructure
NODES=(--node main --node secondary)
DEFAULT_NODE=main

PROFILE=$("$INTEGRATION" create-profile "${NODES[@]}" \
  --default-node "$DEFAULT_NODE" --yes)

"$INTEGRATION" plan "${NODES[@]}" --workspace "$WORKSPACE" \
  --routing-profile "$PROFILE" --harness-root "$HARNESS_ROOT" \
  --projection-root "$PROJECTION_ROOT"
"$INTEGRATION" prepare-harness --harness-root "$HARNESS_ROOT" --yes
"$INTEGRATION" bind "${NODES[@]}" --workspace "$WORKSPACE" \
  --routing-profile "$PROFILE" --harness-root "$HARNESS_ROOT" \
  --projection-root "$PROJECTION_ROOT" --yes

BINDING=/ABSOLUTE/PATH/PRINTED/BY/BIND
"$INTEGRATION" activate --binding "$BINDING" --yes
# Fully quit OpenCode before acknowledging the restart boundary.
"$INTEGRATION" run --binding "$BINDING" \
  --ack-opencode-restarted -- models "ai-infra-$DEFAULT_NODE"
```

Bindings pin the workspace, harness identity, provider generation, endpoint
catalog, profile hash, and node set. Create a new binding after changing context,
projection, profile, harness version, or workspace. Deactivate managed tunnels
when finished:

```sh
"$INTEGRATION" deactivate --binding "$BINDING" --yes
```

`create-profile` derives the selected default node's exact provider/model from
the generated catalog, assigns it to all four roles, writes a deterministic
owner-only profile, and prints only its absolute path. Repeating the same command
reuses the same file. Generate a new profile instead of editing one already
recorded by a binding.

## Model routing configuration

Routing policy is project-owned metadata; it does not create provider transport,
start endpoints, authenticate, or make network calls. Native provider config
must independently define every selected `provider/model`.

### Which file is loaded

There are two distinct input paths:

| Path | Use |
|---|---|
| `.opencode/routing/harness-model-routing.example.json` | committed neutral fallback; local routing disabled |
| `.opencode/routing/harness-model-routing.json` | ignored source-local operator override |
| `--routing-catalog` plus `--routing-profile` | preferred external/runtime input pair |

For implicit source loading, the loader searches upward for
`.opencode/routing/`, chooses `harness-model-routing.json` when present, and
otherwise chooses the neutral example. It never merges them. A present but
unreadable, malformed, or invalid custom file fails; it does not fall back.

The packaged runtime does not include the ignored custom file. When the launcher
receives a catalog/profile pair, it passes both to the runtime and that external
pair takes precedence over implicit files. The catalog supplies endpoint/model
entries; the unwrapped profile supplies policy. They are validated and merged
only in memory.

### Configure `harness-model-routing.json`

Start from the neutral shape, then edit the ignored copy:

```sh
cp .opencode/routing/harness-model-routing.example.json \
  .opencode/routing/harness-model-routing.json
```

The source-local file may be wrapped in `harnessModelRouting`; the external
profile must be unwrapped. Important fields:

| Field | Meaning |
|---|---|
| `localRouting.enabled` | Enables catalog-backed advisory selections |
| `localRouting.models` | Catalog keys mapped to exact model, URL, and concurrency |
| `localRouting.defaultLocalModel` | Fallback catalog key for roles |
| `roleOverrides.<role>.model` | Native `provider/model` override |
| `roleOverrides.<role>.localModel` | Key from `localRouting.models` |
| `variant` | Native provider variant; use `null` unless explicitly supported |
| `commandOverrides` | Locks the four `/delegate-*` commands to matching roles |
| `orchestratorCommands` | Reserves `/delegate-orchestration` for the parent |
| `complexityTiers` | Optional model/variant policy selected by request metadata |

A minimal source-local override has this complete shape. Replace the catalog
key, exact provider/model, URL, and concurrency with reviewed values:

```json
{
  "harnessModelRouting": {
    "schemaVersion": "2.0.0",
    "defaultMode": "single-model",
    "defaultModel": null,
    "singleModel": { "enabled": false, "model": null },
    "localRouting": {
      "enabled": true,
      "forceLocalForHarnessSubagents": false,
      "defaultLocalModel": "ai-infra-node",
      "models": {
        "ai-infra-node": {
          "model": "ai-infra-node/exact-model-id",
          "routingServiceUrl": "http://127.0.0.1:18080/v1",
          "maxInFlight": 1
        }
      }
    },
    "roleOverrides": {
      "researcher": { "model": null, "localModel": "ai-infra-node", "variant": null },
      "planner": { "model": null, "localModel": "ai-infra-node", "variant": null },
      "implementer": { "model": null, "localModel": "ai-infra-node", "variant": null },
      "validator": { "model": null, "localModel": "ai-infra-node", "variant": null }
    },
    "commandOverrides": {
      "/delegate-research": { "agent": "researcher", "model": null, "variant": null },
      "/delegate-plan": { "agent": "planner", "model": null, "variant": null },
      "/delegate-implement": { "agent": "implementer", "model": null, "variant": null },
      "/delegate-validate": { "agent": "validator", "model": null, "variant": null }
    },
    "orchestratorCommands": {
      "/delegate-orchestration": {
        "owner": "orchestrator",
        "agent": null,
        "model": null,
        "variant": null
      }
    },
    "complexityTiers": {}
  }
}
```

The URL above is illustrative and does not claim a listening endpoint. Catalog
keys use lowercase letters, digits, and hyphens. Every model is provider-prefixed
as `provider/model`; catalog model IDs and endpoints must also agree with native
provider configuration.

`roleOverrides` must contain exactly these keys:

```text
researcher planner implementer validator
```

Do not restore retired `integrator`, `reviewer`, `synthesizer`, or
`artifact-verifier` entries. Use task modes instead:

```text
researcher:  research
planner:     plan | synthesis
implementer: implementation | integration
validator:   validation | review | artifact-proof | integration-check
```

Keep `forceLocalForHarnessSubagents` false. With force-local disabled, local
selectors remain advisory; the config plugin enforces only non-null native
`roleOverrides.<role>.model` assignments. External profiles require false.

Normal decision precedence is explicit request, orchestrator command, role
command, role override, complexity tier, single-model fallback, then default
model. An explicit command also fixes its role. The helper reports decisions but
does not call an endpoint:

```sh
node .opencode/routing/resolve-model-routing.mjs \
  --config .opencode/routing/harness-model-routing.json \
  --metadata-json '{"role":"planner"}'
```

Validate every routing change, then fully quit and restart OpenCode:

```sh
node .opencode/routing/routing-policy.test.mjs
node .opencode/scripts/validate-harness.mjs
```

The source validator intentionally checks committed fixtures, not the ignored
private override. The explicit resolver command above validates that override.

## External provider and routing inputs

`--provider-config` is independently optional. Catalog and profile are all-or-
none. All supplied files must be credential-free absolute regular JSON files,
owned by the current user, mode `0600`, no larger than 1 MiB, and beneath trusted
ancestry. Use concrete projection generation leaves, never a mutable `current`
symlink.

```sh
node bin/opencode-harness.mjs validate-inputs \
  --provider-config /OWNER/ONLY/generation-ID/opencode.providers.json \
  --routing-catalog /OWNER/ONLY/generation-ID/harness-endpoints.json \
  --routing-profile /OWNER/ONLY/advisory-profile.json

node bin/opencode-harness.mjs run \
  --workspace /ABSOLUTE/GIT/WORKSPACE \
  --provider-config /OWNER/ONLY/generation-ID/opencode.providers.json \
  --routing-catalog /OWNER/ONLY/generation-ID/harness-endpoints.json \
  --routing-profile /OWNER/ONLY/advisory-profile.json -- models
```

Credentials remain in native external OpenCode state. Never place them in
provider projections, catalogs, profiles, bindings, prompts, or traces.

## Runtime, trust, and traces

`prepare` resolves and probes the selected trusted OpenCode executable, then
creates or verifies an owner-only cache separated by package and exact OpenCode
version. Managed drift, unsafe ownership/modes, symlinks, and collisions fail
closed. Roll back by invoking the retained prior package version, not a rollback
command.

The workspace must be a trusted canonical Git worktree. Project command, agent,
skill, routing, provider, and harness-plugin collisions reject launch. Project
plugins are excluded unless `--allow-project-plugins` explicitly acknowledges
their unsandboxed code.

Trace selection is: explicit `--trace-root`, ignored workspace `.memory`, then
owner-only XDG state keyed by workspace. Runtime, workspace, trace, snapshots,
and per-launch database paths stay separate.

Generated orchestration evidence is written under
`.memory/orchestrations/<orchestration-id>/`; each role writes beneath its own
`roles/<role>/` directory. An external trace root receives narrowly scoped role
permissions after an activation probe. Trace files are coordination evidence,
not proof that an unrecorded command or validation ran.

The launcher resolves one OpenCode executable and requires an exact stable
version from `1.18.18` through `1.18.25`. Each accepted version has a separate
cache, runtime marker, and exact generated `@opencode-ai/plugin` metadata
contract. Ambient `OPENCODE_DB` is rejected, and each child gets an isolated
database/snapshot lifecycle. Credentials and global OpenCode config remain
external; the package does not mutate them.

Fully quit OpenCode after package, provider, routing, profile, plugin, agent,
command, skill, or configuration changes. Running sessions do not reload them.

## Validation and packaging

```sh
node --check bin/opencode-harness.mjs
node .opencode/routing/routing-policy.test.mjs
node --test .opencode/scripts/runtime-harness.test.mjs
node --test .opencode/scripts/runtime-foreign-repo.test.mjs
node .opencode/scripts/portable-harness.test.mjs
node .opencode/scripts/validate-harness.mjs
node .opencode/scripts/validate-portable-harness.mjs --root .
npm pack --dry-run --json
git diff --check
```

Fixture success does not prove live provider activation, endpoint health, model
identity, authentication, capacity, routing quality, or recovery behavior.
