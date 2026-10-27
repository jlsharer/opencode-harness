# OpenCode Harness Runtime 0.1.13

`opencode-harness-runtime` launches the repository's four-role delegation
harness without copying `.opencode` into the target project. The active roles
are exactly `researcher`, `planner`, `implementer`, and `validator`. Integration,
review, synthesis, artifact proof, and integration checks are task modes of
those roles, not additional agents.

Package version `0.1.13` requires Linux, Node.js 24, Git, and OpenCode. There is
no OpenCode version allowlist. npm is needed only to build a local
tarball. Global installation and publication are not required. Roll back by
invoking retained version `0.1.12`.

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
  [--native-session-db ABS]
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

By default, `run` uses a private database that is removed after exit. An owner
who explicitly authorizes the harness to use an existing V2 OpenCode session
database can pass `--native-session-db /absolute/path/to/opencode.db`. The
launcher checks its canonical path, current-user ownership, mode 0600, single
link and WAL/SHM companions, then binds the guarded server and client to that
database. Existing sessions and authentication remain available. The harness
does not delete this database. Managed workflow state remains in memory and
cannot resume after interruption; a visible native session is not a managed
Task checkpoint. Do not combine this option with `--v2-auth-data-home`.

Offline native routing checks have passed with OpenCode 1.18.18 and 1.18.34.
OpenCode v2.1.4 has a separate native plugin path and guarded loopback server
for blocking managed subagents. Disposable provider-backed runs observed
pre-subagent refusal and an implementer/validator workflow with independent
validator gates. Those runs do not establish general V2 acceptance or apply to
a changed tree. Use fresh orchestration IDs for every new attempt. Explicit
background delegation requires a native Job-capable V2 build: released v2.1.4
does not expose subagent Job get/wait/cancel to plugins, so explicit background
is refused for that binary. A pinned-source native patch and an observed custom
build supply those operations; the adapter binds child, Job generation, model,
terminal result, and cancellation before releasing capacity. V2 adapts validated credential-free provider
projections into native `providers` config and checks the active provider, model
and limits before launching the requested client. Validated routing selections
bind only to active native models; optional local selections inherit when their
model, exact catalog endpoint or credential-free loopback health/model probe is
unavailable. V2 web profiles expose the activated
native server through an authenticated loopback proxy; direct V2 server forwarding
remains refused. V2 automatic background selection falls back to blocking when
the native background inspection/abort transport is unavailable. V2
`source-tui` starts only after its source profile and native guard activate,
using an owner-only external trace root. Offline source tests and `doctor` do
not substitute for native guard activation; V1 launch behavior remains separate.

Operator-authorized V2 validation can use the source-only explicit
`--v2-auth-data-home /ABSOLUTE/OWNER-ONLY/V2-DATA-HOME` option on `run` after
an isolated V2 ChatGPT subscription login. The launcher snapshots that native
auth database read-only, selects only the active OpenAI OAuth connection, and
imports it into its unique per-launch database after the V2 guard activates;
the source database is not modified and the temporary copy is removed before
the requested client starts. Neither credential bytes nor the source path are
recorded in the runtime or traces. Live model execution, explicit background
recovery, and full managed acceptance remain separate gates.
Recheck with `doctor` after upgrades. No shell startup or global PATH change is
required. For an existing environment-preserving wrapper, use an invocation-local
override, for example `OPENCODE_BIN=/ABSOLUTE/TRUSTED/opencode opencode-local launch`.
External wrappers may have their own argument grammar: do not assume they accept
the launcher's new flag or edit external infrastructure to add it.

### Optional `opencode` command in one project

Installing or preparing this harness **does not** replace the global `opencode`
command, change shell startup files, or alter PATH. Launching `opencode`
directly in a consumer worktree therefore does not activate the harness. Use
`opencode-harness run --workspace ABS` (or the `node bin/opencode-harness.mjs`
form above) by default. If an operator explicitly wants the bare command in an
interactive zsh session, they can add a scoped function to their own `~/.zshrc`
after installing the runtime and selecting a trusted native executable:

```zsh
opencode() {
  case "$PWD" in
    /ABSOLUTE/GIT/WORKSPACE|/ABSOLUTE/GIT/WORKSPACE/*)
      node /ABSOLUTE/HARNESS/bin/opencode-harness.mjs run \
        --workspace /ABSOLUTE/GIT/WORKSPACE \
        --opencode-bin /ABSOLUTE/TRUSTED/V2/opencode \
        --cache-root /ABSOLUTE/OWNER-ONLY/CACHE \
        --trace-root /ABSOLUTE/OWNER-ONLY/TRACES -- "$@"
      ;;
    *) command opencode "$@" ;;
  esac
}
```

Replace every example path with a canonical absolute path. Start a new zsh
after editing; verify `opencode --version` from the consumer root through the
guarded launcher, and check that outside the project it still invokes the
global binary. On V2, unsupported forwarded commands fail closed: bare
`opencode`, `opencode --version`, `opencode run ...` and `opencode models ...`
have verified mappings. The wrapper is an **operator opt-in**, not a package
install step: automatically replacing a user's shell command would affect
unrelated projects and could disguise an unguarded launch. Updating the global
OpenCode executable does not update a separately pinned `--opencode-bin`;
recheck the latter with `doctor` and the guarded startup before changing pins.

For repeatable credential-free V2 iteration, keep the exact v2.1.4 Linux x64
native archive and extracted executable in an existing owner-only cache outside
the checkout instead of a disposable `/tmp` tree. The npm package
`@opencode/cli-linux-x64@2.1.4` has archive integrity
`sha512-o8EJ0ZsT4dzDKN+0mpG2EKbNGzJyp+F1++Av28UReRVfiEv+N34eZEnN/unkiMoerKHad6W6Ii7k4ukTnPNmNQ==`;
verify the downloaded archive against that exact value **before** inspecting
or extracting its two regular members. The extracted `package/bin/opencode`
must have SHA-256
`ca9b3ee262e33bb4e7aa0e1230dc61086a474c8c8016b980081d0719712fd2e7`.
Use `doctor --opencode-bin /ABSOLUTE/OWNER-ONLY/CACHE/package/bin/opencode`
to confirm selection. This pins fixture bytes, not source-to-release provenance;
credentials are optional for offline guard and pre-spawn refusal checks.

To reproduce the **separate custom V2 background build**, check out upstream
commit `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824` into an owner-controlled
checkout outside this repository, apply
`.opencode/patches/v2.1.4-background-job.patch` with `git apply --check` then
`git apply`, and use pinned Bun 1.4.4 (`@oven/bun-linux-x64@1.4.4` archive
integrity `sha512-CHbbkmHVM28T1GFq+6GL4Ao4ujwwYwj1CxFFwEFzLanPfNsId9AhbIP0Q4reWuWBkGimUkoQygrK7Rgjtj3vog==`).
After an explicit owner-local `bun install --frozen-lockfile --ignore-scripts`,
run `OPENCODE_VERSION=2.1.4-harness-job.2 bun packages/cli/script/build.ts --single --skip-install --outdir=/OWNER/PRIVATE/CACHE/native-v2-job`.
Choose the resulting `cli-linux-x64/bin/opencode` explicitly with
`--opencode-bin`. Native dependency installation and the custom build are
external operator steps, not runtime installation or a published OpenCode
release. The isolated custom build tested here reported SHA-256
`82e8dc45e8d1e97aa6d5e83e57d76283e2597d62803d5becf3455c804a364712`;
rebuilds must be re-identified rather than assumed byte-identical. Explicit
background additionally requires the launch-time native flag
`OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true` and a complete
`OPENCODE_HARNESS_DELEGATION` physical-capacity policy. Stock v2.1.4 and
unknown V2 builds without the bound Job capability continue to refuse explicit
background before a user client starts.
Disposable native checks with the identified custom build observed a background
researcher task reach controller state `success` after a structured result and
role artifact, plus a separate worker interrupted during an asynchronous local
fetch with reconciled cancellation and an interrupted child session. Those
checks do not replace an independent validator gate for a real workflow.

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
tar -xzf /OWNER/ONLY/PACKS/opencode-harness-runtime-0.1.13.tgz \
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

### Source-only V2 setup fixture (offline refusal)

For an operator outside managed execution on Linux/Node 24, the source-only
`.opencode/scripts/native-v2-plugin-fixture.mts` accepts exactly
`--binary /ABSOLUTE/TRUSTED/opencode --sha256 LOWERCASE_64_HEX --scratch-parent /OWNER/ONLY/DIR`.
The digest must be supplied at execution time; do not embed local paths or a
machine's executable digest in the repository. The scratch parent must already
be owner-only mode 0700. This preflight currently creates no disposable
workspace/state or receipt file, invokes no binary, provider, server, or
subagent, and always exits nonzero with `inventory-only/inconclusive` when
preflight succeeds. It refuses ambient native state, endpoint, or credential
variables; unknown environment exposures and missing isolation proof must not
be treated as safe. Its fixed V2 Promise `Plugin.define({id,setup})` template
would register an `execute.before` hook for `subagent` only inside a future
verified disposable `.opencode/plugins/index.js` root, never this checkout's
production V1 plugin. The template is not loaded or activated by preflight.

Stage A requires a separately reviewed fresh isolated native server (no stale
socket/endpoint or host credential exposure), exact trusted binary version and
identity, unique plugin ID and exact disposable SOURCE inventory, then
source-backed active-state observation tied to that fresh server. A `plugin
list` ID/SOURCE row alone proves inventory, not setup activation or hook
registration. No safe endpoint/state method is established yet; do not run the
native CLI as a workaround. Hook firing and stage B genuine provider-free
`subagent` before-hook refusal and no-child effects remain unknown. This
fixture is not a portable/runtime asset, managed gate, V2 guard or acceptance
proof. Offline tests require separate external authorization; production V1
and the operator external QA runner remain unchanged.

### Operator-only external QA receipt

Outside managed Task execution, an operator with a trusted preinstalled Node 24,
Git, npm, dependencies and an owner-only (0700) receipt parent can run:

```sh
node .opencode/scripts/operator-external-qa.mts --root /ABSOLUTE/TRUSTED/GIT/ROOT --receipt /OWNER/ONLY/receipts/unique-receipt.json --validation-input .opencode/.gitignore
```

The receipt must not exist and must be outside the worktree. This source-only
convenience runs its focused tests, the source and portable validators, both
runtime tests, and `npm pack --dry-run --json`, with scripts disabled, offline npm cache and
owner-only scratch. If the receipt sits beneath a public immediate child of a
root-owned sticky directory such as `/tmp`, scratch is instead created directly
beneath that sticky directory so the fixture roots remain private. Optional
`--validation-input REL` (repeatable, up to
64) binds explicitly identified safe ignored files; never supply credentials or
dependency trees. When `.opencode/.gitignore` exists, declare it as shown; source
QA reads it and the runner refuses to omit its bytes from the receipt. Under
root-owned sticky `/tmp`, the receipt itself still needs an owner-only mode-0700
parent. It records command
exit/signal/timeout, output hashes rather than raw logs, and HEAD/index/byte-mode
inventory hashes before and after. A
failed or mutated run returns nonzero and records an external-only receipt when
preflight succeeds. Review any retained scratch and the receipt independently.
This is not a managed-gate proof, a hermetic sandbox, an authorization to execute
from a managed child, or evidence of V2 compatibility. Native V2 acceptance
still requires a trusted executable and independently observed guard behavior.


## Refined managed execution

Managed delegation requires a trace-root `orchestrations/<id>/normalized-spec.json`; arbitrary Task prompts are rejected. The runtime is ephemeral and cannot resume interrupted work. The adapter serializes tasks, enforces declared attempt budgets, and binds independent validator acceptance to the exact resulting tree and artifact hashes. Use fresh workflows for post-acceptance changes.

The plugin retains an unlimited number of distinct workflow controllers per launch by default (completed and blocked workflows count too). To impose a finite cap, launch the guarded client with a positive safe integer such as `OPENCODE_HARNESS_WORKFLOW_REGISTRY_CAPACITY=32`; invalid values fail closed, and the previously supported `unlimited` value remains accepted. Unlimited retention increases process memory and repeated marker/spec verification work as the session grows. This setting does not remove the one-active-worker rule, per-workflow budgets, immutable `dispatch-started.json` refusal, parent/child identity checks, or stopped-run recovery rules. A running client cannot pick up a plugin change or this setting: build/install the updated runtime separately, fully quit OpenCode, then start a fresh guarded session. Old started IDs/children never become reusable.

When the managed guard stops, the bound orchestrator can call `harness_recovery_status` for a bounded diagnosis and current workspace proof. For uncertain termination of an acknowledged background child, `harness_recovery_resolve` retries native abort and verifies the child is idle under the exact parent; status can then be retried. A pending native launch must yield its correlated callback before termination can be proven; an idle session alone does not settle it. If native termination, the original marker/spec and in-scope effects are verified, review the reported effects and call `harness_recovery_release` with the exact reviewed tree hash. Release permits only a NEW orchestration ID with fresh tasks and independent revalidation in the same OpenCode process; no previous child, approval or gate resumes. Missing launch/idle/abort identity, unsafe effects or a changing tree leave the guard closed until proof is available; if native proof never arrives, reconcile effects and restart OpenCode. A completed old child's late error/deletion event does not stop an unrelated current worker.

Read-only shell verification uses an already installed `/usr/bin/bwrap` with working user namespaces. It never falls back to an unrestricted shell or installs dependencies. Write-producing verification, parallel writers, workspaces beneath `/tmp`, and missing native child/exit metadata are explicit unsupported cases. Scope checks are not a general sandbox. See `.memory/protocols/memory-management.md` for the structured result protocol.

### Compaction continuity

Before a managed run, the parent may create an owner-only (0600)
`orchestrations/<id>/COMPACTION_HANDOFF.md` under the selected trace root from
`templates/compaction-handoff.md` and link it in the run `INDEX.md`. Fill its
seven sections with the safe/redacted initial user request, current goal and
success criteria, explicit owner decisions/constraints, critical architectural
invariants, context with evidence versus unknowns, authoritative project and
delegation instructions, and observed status/next safe action. Refresh it at
work-unit decisions and before handoff; do not save credentials or raw unbounded
transcripts. This file is project-owned coordination context, never acceptance
evidence or a resumable Task checkpoint.

V1's native compaction hook adds a generic recovery reminder and, for a bound
parent, a checked bounded quote of that file. V2 registers compaction and
subsequent context hooks: a bound parent receives the same checked quote on
compaction and later model requests during that launch. If the file is absent,
malformed or unsafe, only generic instructions remain. Neither native summary
generation nor this advisory hook guarantees that its prose survives verbatim;
after compaction or restart reread the project's `AGENTS.md`, current progress
and handoff documents, the immutable protocol/spec/marker, and actual Git and
validator evidence. A restart cannot recover ephemeral Task authorization.

Offline evaluation: `node .opencode/scripts/evaluate-controller.mts`. The deterministic thin fixture transport is not a live OpenCode baseline. Live paired model runs and general V2 acceptance remain separate; blocking V2 smoke evidence is limited to disposable workflows.


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


For this harness source checkout itself, use `node bin/opencode-harness.mjs source-web --opencode-bin /absolute/opencode --port 4096` after supplying the same owner-managed authentication environment. V2 opens its authenticated loopback proxy only after the source native guard activates. This explicit development profile is restricted to the launcher's own canonical Git package root; it is unavailable from a distribution lacking source and installed build prerequisites. It validates the portable core and generated parity, checks and fingerprints source/loadable surfaces, and requires coherent existing plugin dependencies. It never installs prerequisites. Only the existing `.opencode/plugins/index.js` project autoload entry is permitted: no external runtime/config projection or duplicate plugin entry is injected. Source routing remains project-owned; V1 uses source `.memory` and V2 source profiles use an owner-only external trace root. Pending source routing/provider errors still block managed Task dispatch rather than silently changing models.

`source-web` accepts only the normal executable/cache selection, fixed-loopback port, and an optional workspace equal to its own root; provider/catalog/profile projections, custom trace roots, plugin overrides, native forwarded arguments and arbitrary workspaces are rejected. Native/global configuration outside the source project remains operator-owned; source preflight does not claim to confine native APIs or erase global CORS/plugin policy. Its private per-launch database is cleaned on ordinary child exit. Stop the native child cleanly; abrupt process/host termination may retain private launch state for inspection. The external `web` profile still rejects source-owned asset collisions in other workspaces.

For the source checkout's native terminal UI, use `node bin/opencode-harness.mjs source-tui`. This mode shares the source-profile validation, workspace pinning and private database lifecycle described above. V1 invokes OpenCode's default TUI; V2 activates the guarded loopback server first, then attaches a TUI to that same server with an ephemeral password and external owner-only trace root. Neither requires an owner-supplied web password. It accepts only source-profile launcher options and no forwarded native arguments. It does not create a tmux session or configure mobile transport. External project terminal sessions continue to use `run --workspace ABS`. Assistant-mediated terminal input is separate from a directly interactive phone terminal; existing sessions must be identified before sending input.

Native session model selection is inherited by default. Explicit valid cloud routes override it. Optional catalog-backed local routes override it only when their native provider/model metadata exists and bounded, credential-free loopback probes report `/health` status `ok` and the exact model ID in `/v1/models`. An unavailable optional local route leaves the role model unset so OpenCode inherits the session-selected model; the harness does not choose a replacement provider. Malformed routing, conflicting provider restrictions and mismatched endpoint configuration still fail. Selection and availability are frozen for the plugin instance: restart after changing routing or endpoint availability. A model lost later may fail its native request; no mid-task provider switching occurs.

For required local execution, use explicit `local-only`/force-local routing or set `OPENCODE_HARNESS_LOCAL_READINESS=required`. Missing or unavailable selected local models then block managed Task dispatch without inheritance or remote fallback, even if native OpenCode catches a config-hook error. Ordinary omitted model metadata under neutral routing requires no local catalog/provider. Neither mode starts model servers or sends credentials or inference prompts during readiness checks. These checks govern managed role selection, not the parent model; provider allowlists and parent/auxiliary defaults remain operator-owned. With one local inference slot and reserved parent headroom, use conservative auto/blocking delegation rather than assuming background capacity.
