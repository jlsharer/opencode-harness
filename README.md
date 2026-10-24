# OpenCode Harness Runtime 0.1.12

`opencode-harness-runtime` launches the repository's four-role delegation
harness without copying `.opencode` into the target project. The active roles
are exactly `researcher`, `planner`, `implementer`, and `validator`. Integration,
review, synthesis, artifact proof, and integration checks are task modes of
those roles, not additional agents.

Package version `0.1.12` requires Linux, Node.js 24, Git, and OpenCode. There is
no OpenCode version allowlist. npm is needed only to build a local
tarball. Global installation and publication are not required. Roll back by
invoking retained version `0.1.11`.

## Prepare and run

From this checkout:

```sh
node bin/opencode-harness.mjs --help
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- models
node bin/opencode-harness.mjs run --workspace /ABSOLUTE/GIT/WORKSPACE -- \
  run --model PROVIDER/MODEL "Use /delegate-orchestration for this task"
```

`run` already prepares and verifies its versioned runtime. A separate `prepare`
step is optional prewarming, not an installation prerequisite. Consumer repositories
need neither spelling of the maintainer design document (`opencode-harness.design.md`
or `opencode-harness-design.md`). Keep source QA in this checkout; use the portable
validator only for portable consumers.

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
existing executable trust checks. An unsafe first PATH candidate fails;
the launcher never silently tries a later installation.

```sh
node bin/opencode-harness.mjs doctor --opencode-bin /ABSOLUTE/TRUSTED/opencode
node bin/opencode-harness.mjs prepare --opencode-bin /ABSOLUTE/TRUSTED/opencode
node bin/opencode-harness.mjs run --opencode-bin /ABSOLUTE/TRUSTED/opencode --workspace /ABSOLUTE/GIT/WORKSPACE
```

`doctor` validates the executable and invokes only `--version`; it creates no
runtime/cache and makes no provider call. Its JSON reports the selected path,
selection source, reported version, runtime capability verification, and ephemeral/non-resumable
session policy. Prepare/run report selection to stderr while preserving stdout.
It checks executable trust and reports version diagnostics; it does not prove plugin activation or provider health.

Offline native routing checks have passed with OpenCode 1.18.18 and 1.18.34.
These checks do not guarantee every native capability.
Recheck with `doctor` after upgrades. No shell startup or global PATH change is
required. For an existing environment-preserving wrapper, use an invocation-local
override, for example `OPENCODE_BIN=/ABSOLUTE/TRUSTED/opencode opencode-local launch`.
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

The launcher resolves one trusted OpenCode executable. Its reported version is
used only for diagnostics and cache isolation; unavailable version reporting uses
the executable digest instead. Future and prerelease versions
are accepted. Generated plugin dependencies must still agree with their lockfile
and installed bytes, but need not match the CLI version. The plugin requires the
native config and tool hooks and session/Task APIs it actually uses; missing or
incompatible APIs fail at that operation. `doctor` checks executable selection
and version reporting, not end-to-end API compatibility. Future compatibility is
not guaranteed; run the offline native integration check after changing OpenCode. Ambient `OPENCODE_DB` is rejected, and each child gets an isolated
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

When the managed guard stops, the bound orchestrator can call `harness_recovery_status` for a bounded diagnosis and current workspace proof. For uncertain termination of an acknowledged background child, `harness_recovery_resolve` retries native abort and verifies the child is idle under the exact parent; status can then be retried. A pending native launch must yield its correlated callback before termination can be proven; an idle session alone does not settle it. If native termination, the original marker/spec and in-scope effects are verified, review the reported effects and call `harness_recovery_release` with the exact reviewed tree hash. Release permits only a NEW orchestration ID with fresh tasks and independent revalidation in the same OpenCode process; no previous child, approval or gate resumes. Missing launch/idle/abort identity, unsafe effects or a changing tree leave the guard closed until proof is available; if native proof never arrives, reconcile effects and restart OpenCode. A completed old child's late error/deletion event does not stop an unrelated current worker.

Read-only shell verification uses an already installed `/usr/bin/bwrap` with working user namespaces. It never falls back to an unrestricted shell or installs dependencies. Write-producing verification, parallel writers, workspaces beneath `/tmp`, and missing native child/exit metadata are explicit unsupported cases. Scope checks are not a general sandbox. See `.memory/protocols/memory-management.md` for the structured result protocol.

Offline evaluation: `node .opencode/scripts/evaluate-controller.mts`. The deterministic thin fixture transport is not a live OpenCode baseline. Live paired model runs and V2 migration remain unexecuted and separate.


### Portable consumer installation and upgrade

Prefer the no-copy `run --workspace` path above unless the consumer deliberately needs a checked-in portable projection. For that profile, run `node .opencode/scripts/bootstrap-portable-harness.mjs --target /ABSOLUTE/CONSUMER` from this checkout, then run the installed `.opencode/scripts/validate-portable-harness.mjs --root /ABSOLUTE/CONSUMER`. Repeating bootstrap is idempotent. To upgrade, inspect `--dry-run`, review managed-file collisions, then explicitly use `--overwrite-managed`. This replaces managed assets; it is not a merge of edits to those assets. Consumer configuration, private routing overrides and existing memory seeds are preserved. No maintainer design document, source validator or orchestration history is required in the consumer.

Existing trace seed files are user-owned after first creation. Upgrades, repeat
launches and rollbacks preserve them and report differing bundled templates;
review the runtime's bootstrap templates to adopt protocol changes deliberately.

Native role routing uses the same role-only precedence as the routing helper:
force-local policy, role local selection, role model, enabled single model, then
default model. With none selected, OpenCode inherits its native model. Command,
complexity and explicit request overrides are advisory helper inputs: the config
hook cannot inspect a delegation prompt. A persisted private routing selection
remains active when the prompt omits a model. Supply its matching native provider
projection or explicitly change that policy; the neutral external launcher does
not copy the checkout's private override. Provider restrictions always take
precedence; malformed IDs and missing configured models fail without fallback.
A valid configured ID is not proof that the remote service is reachable.


## Background work and phone access

The default remains blocking. Optional background delegation retains one worker and serial writes while the parent can answer conversational followups. See `.opencode/skills/delegation-orchestrator/SKILL.md` for the harness-owned policy, resource headroom, bounded queued updates, cancellation and non-resumable recovery. No global setting is changed automatically.

`opencode-harness web --workspace /absolute/trusted/git/root --port 4096` starts the native OpenCode HTTP/web interface through `serve`, with a fixed `127.0.0.1` listener and mDNS disabled. Set `OPENCODE_SERVER_PASSWORD` through your own secure environment mechanism before launch (at least 16 non-control characters); do not put it in command arguments, repository files or logs. Native authentication uses `OPENCODE_SERVER_USERNAME` if supplied, otherwise `opencode`. The launcher does not generate, save or print credentials. Open `http://127.0.0.1:4096` locally; automatic browser opening is intentionally omitted. Stop the foreground process when finished. Ordinary run options are accepted, but `web` requires an explicit workspace and forbids native forwarded arguments, alternate hostnames, mDNS and CORS flags. The `run` command also rejects literal forwarded `serve` and `web` tokens, including after native options; use this dedicated mode for server launches. Existing native/global CORS configuration may still merge into the server configuration; banning CLI CORS flags does not clear that configuration or establish an empty CORS allowlist.

Phone connectivity still requires a separately approved secure transport to this loopback endpoint. This command does not configure a VPN, tunnel, firewall, service, public listener or LAN listener. HTTP Basic authentication alone is not a reason to expose HTTP remotely. Each project should use its own launch/port. The managed plugin blocks managed Task dispatch when the native directory differs from the launch workspace; open the correct instance when switching projects.

This is a trusted-owner native server, not an OS or project sandbox. Native file/search/terminal/directory APIs are outside managed tool hooks. The workspace mismatch guard protects managed orchestration bookkeeping; it does not confine the entire server. Use only trusted project plugins. Workspaces still must meet existing canonical-path and ownership/mode checks; Windows-mounted world-writable projects are not exempt. Sessions and workflow state remain ephemeral and the per-launch database is removed on exit; keep required trace artifacts and use fresh reviewed runs after interruption.


For this harness source checkout itself, use `node bin/opencode-harness.mjs source-web --opencode-bin /absolute/opencode --port 4096` after supplying the same owner-managed authentication environment. This explicit development profile is restricted to the launcher's own canonical Git package root; it is unavailable from a distribution lacking source and installed build prerequisites. It validates the portable core and generated parity, checks and fingerprints source/loadable surfaces, and requires coherent existing plugin dependencies. It never installs prerequisites. Only the existing `.opencode/plugins/index.js` project autoload entry is permitted: no external runtime/config projection or duplicate plugin entry is injected. Source routing and `.memory` remain project-owned. Pending source routing/provider errors still block managed Task dispatch rather than silently changing models.

`source-web` accepts only the normal executable/cache selection, fixed-loopback port, and an optional workspace equal to its own root; provider/catalog/profile projections, custom trace roots, plugin overrides, native forwarded arguments and arbitrary workspaces are rejected. Native/global configuration outside the source project remains operator-owned; source preflight does not claim to confine native APIs or erase global CORS/plugin policy. Its private per-launch database is cleaned on ordinary child exit. Stop the native child cleanly; abrupt process/host termination may retain private launch state for inspection. The external `web` profile still rejects source-owned asset collisions in other workspaces.

For the source checkout's native terminal UI, use `node bin/opencode-harness.mjs source-tui`. This mode shares the source-profile validation, workspace pinning and private database lifecycle described above, but invokes OpenCode's default TUI without server arguments or a password requirement. It accepts only source-profile launcher options and no forwarded native arguments. It does not create a tmux session or configure mobile transport. External project terminal sessions continue to use `run --workspace ABS`. Assistant-mediated terminal input is separate from a directly interactive phone terminal; existing sessions must be identified before sending input.

Native session model selection is inherited by default. Explicit valid cloud routes override it. Optional catalog-backed local routes override it only when their native provider/model metadata exists and bounded, credential-free loopback probes report `/health` status `ok` and the exact model ID in `/v1/models`. An unavailable optional local route leaves the role model unset so OpenCode inherits the session-selected model; the harness does not choose a replacement provider. Malformed routing, conflicting provider restrictions and mismatched endpoint configuration still fail. Selection and availability are frozen for the plugin instance: restart after changing routing or endpoint availability. A model lost later may fail its native request; no mid-task provider switching occurs.

For required local execution, use explicit `local-only`/force-local routing or set `OPENCODE_HARNESS_LOCAL_READINESS=required`. Missing or unavailable selected local models then block managed Task dispatch without inheritance or remote fallback, even if native OpenCode catches a config-hook error. Ordinary omitted model metadata under neutral routing requires no local catalog/provider. Neither mode starts model servers or sends credentials or inference prompts during readiness checks. These checks govern managed role selection, not the parent model; provider allowlists and parent/auxiliary defaults remain operator-owned. With one local inference slot and reserved parent headroom, use conservative auto/blocking delegation rather than assuming background capacity.
