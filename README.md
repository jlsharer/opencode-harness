# OpenCode Harness Runtime 0.1.12

`opencode-harness-runtime` launches the repository's four-role delegation
harness without copying `.opencode` into the target project. The active roles
are exactly `researcher`, `planner`, `implementer`, and `validator`. Integration,
review, synthesis, artifact proof, and integration checks are task modes of
those roles, not additional agents.

Package version `0.1.12` requires Linux, Node.js 24, Git, and OpenCode
`1.18.18` through `1.18.25`, inclusive. npm is needed only to build a local
tarball. Global installation and publication are not required. Roll back by
invoking retained version `0.1.11`.

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
opencode-harness prepare [--opencode-bin ABS] [--cache-root ABS]
opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]
opencode-harness capabilities
opencode-harness doctor [--opencode-bin ABS]
opencode-harness run [--opencode-bin ABS] [--workspace ABS] [--trace-root ABS] [--cache-root ABS]
  [--provider-config FILE]
  [--routing-catalog FILE --routing-profile FILE]
  [--allow-project-plugins] [-- OPENCODE_ARGS...]
```

Select the executable per invocation when multiple versions are installed. Selection
order is `--opencode-bin ABS`, then nonempty `OPENCODE_BIN`, then the first
executable `opencode` on inherited PATH. The selected executable must pass all
existing trust and version checks. An unsupported first PATH candidate fails;
the launcher never silently tries a later installation.

```sh
node bin/opencode-harness.mjs doctor --opencode-bin /ABSOLUTE/SUPPORTED/opencode
node bin/opencode-harness.mjs prepare --opencode-bin /ABSOLUTE/SUPPORTED/opencode
node bin/opencode-harness.mjs run --opencode-bin /ABSOLUTE/SUPPORTED/opencode --workspace /ABSOLUTE/GIT/WORKSPACE
```

`doctor` validates the executable and invokes only `--version`; it creates no
runtime/cache and makes no provider call. Its JSON reports the selected path,
selection source, exact version, supported bounds, and ephemeral/non-resumable
session policy. Prepare/run report selection to stderr while preserving stdout.
It is a version/trust check, not proof of plugin activation or provider health.

Offline native routing checks have passed with OpenCode 1.18.18 and 1.18.34.
These checks do not guarantee every native capability.
Recheck with `doctor` after upgrades. No shell startup or global PATH change is
required. For an existing environment-preserving wrapper, use an invocation-local
override, for example `OPENCODE_BIN=/ABSOLUTE/SUPPORTED/opencode opencode-local launch`.
External wrappers may have their own argument grammar: do not assume they accept
the launcher's new flag or edit external infrastructure to add it.

Tokens after `--` are unchanged OpenCode arguments. With none, the TUI opens in
the enclosing trusted Git worktree; an explicit `--workspace` must still be the
exact canonical worktree root. OpenCode and its agents can modify that workspace; use a clean
disposable clone or verified backup for initial testing and inspect Git status
and diff afterward.

To inspect a local package without publishing it:

```sh
npm pack --dry-run --json
install -d -m 700 /OWNER/ONLY/PACKS /OWNER/ONLY/EXTRACT
npm pack --pack-destination /OWNER/ONLY/PACKS
tar -xzf /OWNER/ONLY/PACKS/opencode-harness-runtime-0.1.12.tgz \
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
in its `opencode.json`. The infrastructure wrapper is the normal entry point;
a thin `opencode-local` shell function forwards to it unchanged:

```sh
opencode-local
opencode-local launch --mode mixed
opencode-local launch --mode local-only
opencode-local launch --mode cloud-only
opencode-local launch -- models
opencode-local nodes
opencode-local --help
```

Launch defaults to `mixed`, exports every canonical registry node, creates the
provider, catalog, and routing profile as mode-0600 transient leaves beneath a
mode-0700 root, validates all three, and removes them after exit. It does not
start nodes or tunnels, check reachability, or mutate published projections.

Adding a node is a bounded plan-first transaction. Supply every value; remote
execution also requires `--ssh-alias`, `--remote-root`, `--local-port`, and
`--remote-port`:

```sh
opencode-local node add SLUG --execution local \
  --image IMAGE --model-dir DIR --model-file FILE --model-alias ALIAS \
  --host-port PORT --context TOKENS --parallel COUNT \
  --output-limit TOKENS --thinking false
# Review the exact no-write plan, then repeat with --yes.
```

The transaction validates the complete canonical row and projection scalars,
refuses collisions, writes private leaves at mode 0600, and publishes the
registry update last. It does not download models or contact services.

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
| `providerClassMode` | Exact `mixed`, `local-only`, or `cloud-only` native provider filter policy |
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
    "providerClassMode": "mixed",
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

`forceLocalForHarnessSubagents` must be true exactly for `local-only` and false
otherwise. Mixed mode preserves native provider filters and applies validated
catalog-backed role mappings. Local-only exposes exactly the catalog provider
set and requires all four roles to be catalog-backed. Cloud-only disables every
catalog provider and permits no local role mapping. Every mutation is fully
preflighted before the plugin changes the in-memory native config; provider
objects and persistent OpenCode configuration are never written.

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
node .opencode/src/routing/routing-policy.test.ts
node .opencode/scripts/validate-harness.mts
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

The root lock owns exact TypeScript, Prettier, ESLint, ESLint Stylistic, and
TypeScript-ESLint development tooling. `npm run format` applies Prettier and then
auto-fixes the narrow readability policy in `eslint.config.mjs`: grouped imports,
blank lines around function-like declarations and classes, separation between
type and runtime declarations, spacing between multi-line class members, and no
duplicate blank lines. Generated compatibility JavaScript is excluded. Install with
`npm ci --ignore-scripts --offline`; a cache miss fails and does not authorize
network access. Authored harness TypeScript is separate from checked-in JavaScript
compatibility outputs. `npm run build` stages compiler output and publishes only
the explicit allowlist, while `check:generated` compares without modifying the
worktree. Neither TypeScript source nor build tooling enters runtime, portable,
or npm payloads.

```sh
npm run check:format
npm run typecheck
npm run build
npm run check:generated
npm run check:source-policy
npm test
node --check bin/opencode-harness.mjs
node .opencode/src/routing/routing-policy.test.ts
node --test .opencode/scripts/runtime-harness.test.mts
node --test .opencode/scripts/runtime-foreign-repo.test.mts
node .opencode/scripts/portable-harness.test.mjs
node .opencode/scripts/validate-harness.mts
node .opencode/scripts/validate-portable-harness.mjs --root .
npm pack --dry-run --json
git diff --check
```

Fixture success does not prove live provider activation, endpoint health, model
identity, authentication, capacity, routing quality, or recovery behavior.


## Refined managed execution

Managed delegation requires a trace-root `orchestrations/<id>/normalized-spec.json`; arbitrary Task prompts are rejected. The runtime is ephemeral and cannot resume interrupted work. The adapter serializes tasks, enforces declared attempt budgets, and binds independent validator acceptance to the exact resulting tree and artifact hashes. Use fresh workflows for post-acceptance changes.

Read-only shell verification uses an already installed `/usr/bin/bwrap` with working user namespaces. It never falls back to an unrestricted shell or installs dependencies. Write-producing verification, parallel writers, workspaces beneath `/tmp`, and missing native child/exit metadata are explicit unsupported cases. Scope checks are not a general sandbox. See `.memory/protocols/memory-management.md` for the structured result protocol.

Offline evaluation: `node .opencode/scripts/evaluate-controller.mts`. The deterministic thin fixture transport is not a live OpenCode baseline. Live paired model runs and V2 migration remain unexecuted and separate.
