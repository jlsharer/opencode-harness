# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-28-simplify-opencode-local`
- role: `planner`
- artifactId: `root-planner-001-simple-contract`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `taskMode: plan`; the approved one-command launch goal; bounded harness, llama-server, and user-shell paths; current-friction research; strict provider-class decision; acceptance criteria; dependencies; assumptions; and activation constraints.
- Required context present: Yes. The supplied packet was contract-complete and the required research dependency was available.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Converted the approved goal and supplied research into a bounded implementation plan. Selected a transient launch pipeline, one registry-driven node expansion, and native OpenCode provider allow/deny controls for strict class exclusion. No implementation or final validation was performed.
- Files read:
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/protocols/memory-management.md`
  - `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/researcher/root-researcher-002-current-friction.md`
  - `bin/opencode-harness.mjs`
  - `.opencode/routing/routing-config-loader.mjs`
  - `.opencode/routing/routing-policy.mjs`
  - `.opencode/routing/routing-policy.test.mjs`
  - `.opencode/plugin-modules/role-model-routing-enforcement.js`
  - `.opencode/schemas/harness-model-routing.schema.json`
  - `.opencode/schemas/harness-routing-profile.schema.json`
  - `.opencode/runtime.manifest.json`
  - `.opencode/portable.manifest.json`
  - `README.md`
  - `/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh`
  - `/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh`
  - `/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv`
  - `/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh`
  - `/home/joshl/ai-infrastructure/llama-server/tests/opencode-projection-validation.sh`
  - `/home/joshl/ai-infrastructure/llama-server/README.md`
  - `/home/joshl/.zshrc`
- Files changed: This planner trace artifact only; no implementation file was edited.
- Commands/checks: None. Planning used supplied evidence and read-only file inspection.

## Output Contract

- Outputs: Ordered implementation plan, exact user CLI, file contracts, dependencies, executable verification gates, assumptions, tradeoffs, activation/rollback steps, and implementer handoff.
- Evidence: Current launcher behavior and safety boundaries, current routing schemas/policy/plugin, current integration/export scripts, registry, tests, manifests, README surfaces, and the supplied researcher artifact.
- Artifact links: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/planner/root-planner-001-simple-contract.md`

### Selected task mode and user contract

- Selected mode: `plan`.
- The user-facing command is exactly:

  ```text
  opencode-local [--mode mixed|local-only|cloud-only] [-- OPENCODE_ARGS...]
  opencode-local node add SLUG --execution local|remote [NODE OPTIONS...] [--yes]
  opencode-local nodes
  opencode-local --help
  ```

- `opencode-local` and `opencode-local --mode mixed` open the TUI in the enclosing trusted Git worktree. No forwarded OpenCode arguments are required.
- `opencode-local --mode local-only` opens the same TUI with only registry-derived local providers selectable.
- `opencode-local --mode cloud-only` opens the same TUI with every registry-derived local provider disabled.
- Tokens after `--` are forwarded unchanged to OpenCode, subject to the launcher's existing forbidden-argument checks. The wrapper may also preserve the convenient unambiguous form `opencode-local models`; mode and node-management options must never be forwarded accidentally.
- Default mode is `mixed`. Mixed exposes both classes and assigns the registry-designated default local model to the four harness roles while permitting an explicit cloud choice. Local-only uses that same local assignment and prohibits every non-catalog provider. Cloud-only leaves harness role models inherited and prohibits every catalog provider.
- “Local provider” means a provider ID present in the validated generated endpoint catalog. “Cloud provider” means every other OpenCode provider. This closed classification makes both strict modes testable without copying cloud credentials or enumerating cloud vendors.

### Ordered plan

1. **Make the canonical launcher accept a nested worktree directory without weakening explicit automation.** In `bin/opencode-harness.mjs`, allow `run` with omitted `--workspace` to start from `process.cwd()`, verify that directory through the existing trusted-ancestry boundary, obtain `git rev-parse --show-toplevel`, and then pass the resulting absolute root through the unchanged canonical-workspace ownership/mode/Git-root check. Keep an explicitly supplied `--workspace` strict: it must still name the exact canonical root. Add fixture coverage in the existing runtime test surfaces for nested success, non-Git failure, unsafe ancestry failure, and explicit nested `--workspace` rejection.

2. **Add a small launcher capability handshake instead of cross-repository source pins.** Add a read-only `capabilities` subcommand to `bin/opencode-harness.mjs` that emits closed, deterministic JSON describing only the package version, launch-contract version, accepted routing-profile version, supported modes, and compatible OpenCode range. It must not prepare a runtime, contact providers, or mutate state. The infrastructure wrapper must validate this exact shape/version before generating inputs. Retain the launcher's runtime-manifest byte, ownership, mode, executable, and exact OpenCode compatibility checks; remove only the integration wrapper's duplicated commit and launcher-hash constants.

3. **Make all-node expansion explicit, deterministic, and fail closed.** Extend `scripts/export-opencode-projection.sh` with mutually exclusive selection forms: repeated `--node SLUG` for advanced/tests and `--all` for the normal launcher. `--all` must parse every non-comment registry row, reject duplicate or malformed rows, sort by slug using `LC_ALL=C`, and validate every selected mode-0600 server/projection leaf. It must not silently skip an unavailable node. Preserve loopback derivation, alias/port uniqueness, model limits, thinking metadata, provider/catalog equality, no-follow reads, and no-write print mode. The normal launcher always uses `--all`; users no longer repeat node arrays.

4. **Put the local default in the registry, not in a profile or shell function.** Add one closed comment directive to `config/nodes/nodes.tsv`, `# opencode-default=SLUG`, and require exactly one directive referencing an existing row whenever `--all` is used to generate a mixed or local-only launch. Parsers that do not need a default may continue treating it as a comment, but the integration front door must validate it. Set the supplied registry's reviewed default to `main`. Do not infer a default from row order. `nodes` reports configured/projectable status from local files only and labels reachability as unchecked; it performs no health call.

5. **Add one explicit provider-class field to routing policy.** Add required root field `providerClassMode` with enum `mixed`, `local-only`, `cloud-only` to both `.opencode/schemas/harness-model-routing.schema.json` and `.opencode/schemas/harness-routing-profile.schema.json`, to the normalizer in `.opencode/routing/routing-policy.mjs`, and to committed routing fixtures. Keep schema version `2.0.0` only if the implementation updates every managed producer/fixture atomically and treats the new field as a required closed-profile contract; otherwise bump the routing/profile schema together and update the capability handshake. There must be one source of truth: reject inconsistent combinations rather than letting `forceLocalForHarnessSubagents` contradict `providerClassMode`.

6. **Enforce provider class through OpenCode's native provider filters and role assignment atomically.** In `.opencode/plugin-modules/role-model-routing-enforcement.js`, derive the local provider set from validated catalog model prefixes before mutation. During the config hook:
   - `mixed`: preserve native provider filters; apply generated local role assignments after complete provider/model/baseURL coherence validation.
   - `local-only`: require a catalog-backed assignment for all four roles, set `cfg.enabled_providers` to exactly the sorted local provider set, remove those IDs from `cfg.disabled_providers`, and assign all four roles locally. This blocks cloud selection globally, including explicit model selection outside delegated roles.
   - `cloud-only`: add all sorted local provider IDs to `cfg.disabled_providers`, remove them from `cfg.enabled_providers` when that allowlist exists, and apply no local role assignment. This blocks local selection globally while preserving the user's existing cloud allowlist/credentials.
   - Validate the complete result first and mutate only afterward. Provider objects and persistent/global OpenCode config are never written. Reject an empty local set for local-only, local references in cloud-only, contradictory allow/deny results, unknown catalog assignments, or a local-only role without a catalog model.

7. **Permit strict external profiles at the loader boundary.** Update `.opencode/routing/routing-config-loader.mjs` so external profiles accept the three closed `providerClassMode` values and permit force-local only for a consistent `local-only` profile. Preserve the exact top-level/nested key checks, external catalog/profile all-or-none rule, and in-memory-only merge. Update `routing-policy.test.mjs` with positive and adversarial cases proving global filter output and atomic no-mutation failures for all three modes. Update neutral/local examples to `mixed`; do not turn the committed neutral fallback into an enabled local configuration.

8. **Replace manual profile/plan/binding choreography with one transient launch path.** Refactor `scripts/opencode-harness-integration.sh` around `launch`, `nodes`, and `node add`; legacy verbs may be removed from normal documentation and retained temporarily only if tests or rollback require them. `launch` must:
   1. derive the enclosing Git root from the caller's current directory;
   2. validate the harness capability handshake and trusted launcher path;
   3. call the exporter with `--all --print bundle`;
   4. derive the default model from the registry directive and generated catalog;
   5. render provider, catalog, and selected-mode profile into a new owner-only temporary directory with mode-0600 leaves;
   6. call `opencode-harness validate-inputs`;
   7. invoke `opencode-harness run` with the concrete temporary leaves and no explicit workspace (or the already-derived canonical root if retaining wrapper dirty-tree reporting);
   8. remove the temporary directory on every normal/error/signal path.
   Cloud-only should omit the provider projection from the launcher invocation while still passing catalog/profile policy; mixed and local-only pass all three. Do not publish `current`, profiles, plans, or bindings in normal launch. Do not start/stop tunnels or services, make health calls, or require restart acknowledgements.

9. **Define one bounded node-add transaction.** `opencode-local node add SLUG ...` is the sole documented addition workflow. It accepts explicit execution/connection fields plus explicit server/projection values; it must never invent model limits, endpoints, hosts, image/model locations, or thinking support. Without `--yes`, print the exact proposed registry row and file paths and perform no writes. With `--yes`, refuse every pre-existing target, validate the full proposed row and scalar values, write private `<slug>.env` and `<slug>.opencode.env` as mode 0600, write the overlay/example skeletons with normal repository modes, fsync/stage them, and publish the registry update last so `--all` never observes a half-added node. Updating `# opencode-default=...` requires a separate explicit option and must still leave exactly one valid default. It must not download a model, contact/start a service, mutate SSH, or perform Git operations.

10. **Install only a thin user-global front door.** Replace the binding-specific function in `/home/joshl/.zshrc` with a marked function that executes the reviewed integration script and forwards `"$@"`; it contains no binding, profile, node list, mode logic, or provider credentials. Keep the concrete machine-local script/harness locations only in this user-owned shell adapter (or derive the sibling harness path inside the integration script); do not bake home paths into portable harness prompts/assets.

11. **Update user documentation and managed inventories.** Replace the profile/plan/bind/activate runbook in both READMEs with the exact three launch examples, `nodes`, and the one node-add workflow. Document that generated JSON is transient, credentials remain OpenCode-owned, reachability is unchecked unless separately authorized, local-only/cloud-only are hard class filters, and OpenCode must be fully quit after plugin/routing/package changes. Because routing schemas/plugin files are runtime and portable managed surfaces, update `.opencode/runtime.manifest.json`, `.opencode/portable.manifest.json`, `.opencode/harness.manifest.json`, package metadata/version as required by repository release conventions, and corresponding validator expectations. These manifest/package paths are dependencies implied by changing managed files even though the user-facing deliverable list named their containing routing/plugin surfaces.

### File contracts and minimal changed paths

| Path | Contract |
|---|---|
| `bin/opencode-harness.mjs` | Omitted-workspace nested-directory resolution; closed offline `capabilities` JSON; all existing security preflight/snapshot/cleanup behavior preserved. |
| `.opencode/schemas/harness-model-routing.schema.json` | Closed `providerClassMode` enum and consistency rules for wrapped/source policy. |
| `.opencode/schemas/harness-routing-profile.schema.json` | Same closed mode field for external transient profiles; no provider or credential fields. |
| `.opencode/routing/routing-config-loader.mjs` | Exact external-profile shape; mode/force consistency; catalog merged only in memory. |
| `.opencode/routing/routing-policy.mjs` | Normalize mode, classify catalog provider prefixes, create complete role/filter plan, reject contradictions. |
| `.opencode/routing/harness-model-routing.example.json` and `.opencode/routing/harness-model-routing.local.example.json` | Explicit `mixed`; neutral fallback remains local-disabled. |
| `.opencode/routing/routing-policy.test.mjs` | Three-mode positive/negative decisions, provider-filter expectations, and atomic failure coverage. |
| `.opencode/plugin-modules/role-model-routing-enforcement.js` | One config-hook preflight and atomic mutation of agent models plus native `enabled_providers`/`disabled_providers`; no provider object or global-file mutation. |
| `scripts/export-opencode-projection.sh` | Deterministic `--all`; no omission; existing advanced `--node`; unchanged restricted output and publication safety. |
| `config/nodes/nodes.tsv` | Canonical rows plus exactly one `# opencode-default=main` directive. |
| `scripts/opencode-harness-integration.sh` | `launch`, `nodes`, and transactional `node add`; transient JSON; capability handshake; no pins, bindings, lifecycle, provider calls, or Git mutation. |
| `tests/opencode-projection-validation.sh` | All-node ordering, malformed/unavailable member failure, directive behavior, and no-write checks. |
| `tests/opencode-harness-integration-validation.sh` | No-argument TUI forwarding, nested Git root, all three exact profiles, strict filter behavior via harness tests, transient cleanup, capability mismatch, node-add transaction/adversarial cases, and no network/lifecycle calls. |
| `README.md` in both repositories | Exact normal commands, guarantees, activation/restart, rollback, and advanced boundaries. |
| `/home/joshl/.zshrc` | Thin marked `opencode-local` function only. |
| Harness package/runtime/portable/source manifests and versioned test expectations | Mechanical inventory/version updates required by the managed-file contracts; no new runtime dependency. |

### Dependencies and sequencing

1. Routing schema/policy/filter-plan contract precedes plugin enforcement and profile generation.
2. Exporter `--all` plus registry default precede integration `launch` and `node add` tests.
3. Launcher nested-workspace/capability changes precede wrapper handshake and launch tests.
4. Harness implementation and self-checks precede infrastructure integration changes because the infrastructure fixtures invoke the real launcher for offline validation.
5. Both repository implementations precede the `.zshrc` switch; the old function remains rollback material until validation passes.
6. Independent validator evidence is required after implementation; implementer self-check output is not acceptance evidence.

### Verification gates

Run without provider calls, health checks, service changes, downloads, publication, or Git mutation.

Harness repository:

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

Required focused harness assertions: `capabilities` is exact/offline/no-write; omitted workspace resolves a nested trusted worktree; explicit nested workspace still fails; mixed leaves both provider classes selectable; local-only produces an exact local allowlist and four catalog assignments; cloud-only disables/removes every catalog provider and creates no local assignment; conflicting filters/profile fields fail before config mutation.

Infrastructure repository:

```sh
bash -n scripts/opencode-harness-integration.sh
bash -n scripts/export-opencode-projection.sh
bash tests/opencode-projection-validation.sh
bash tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness
```

Required focused infrastructure assertions: `--all` output is sorted and includes `main` and `secondary`; one malformed configured node fails the entire launch; no-argument launch reaches a fake TUI invocation from a nested directory; each exact mode renders the expected closed profile; temp files are 0600 under a 0700 root and are removed after success/failure/signal; no profile/plan/binding ID appears in normal output; node add is no-write without approval, refuses collisions, publishes registry last, and never invokes curl/ssh/tunnel/service commands.

User-shell and offline activation checks:

```sh
zsh -n /home/joshl/.zshrc
zsh -lc 'type opencode-local'
zsh -lc 'opencode-local --help'
```

Do not execute a normal launch as part of activation validation because it starts OpenCode and may expose provider-backed models. Fully quit existing OpenCode sessions before the user's first separately authorized launch.

### Activation and rollback

- Activation: after independent validation passes, replace only the marked `.zshrc` function, run the three shell checks above, fully quit OpenCode, and open a new shell (or `source /home/joshl/.zshrc`). The first user launch is then simply `opencode-local`, `opencode-local --mode local-only`, or `opencode-local --mode cloud-only` from any nested directory in a trusted Git worktree.
- Rollback: restore the prior marked `.zshrc` function (the binding-based lines recorded in the pre-change diff) or remove the new function and invoke the retained prior package/integration entrypoint explicitly. Fully quit and restart OpenCode after rollback. Version-separated harness caches and existing content-addressed projections/bindings are not deleted. Rollback performs no provider call, service action, or Git operation.

### Assumptions and tradeoffs

- Assumption: OpenCode's documented `enabled_providers` and `disabled_providers` config fields are the native provider selection boundary. The implementation must test the exact supported OpenCode range; if those versions do not enforce these fields for explicit TUI/CLI model selection, strict modes are blocked rather than downgraded to presets.
- Assumption: “all configured nodes” means every valid row in `nodes.tsv`, including a remote node whose client endpoint is its configured loopback tunnel port. Presence does not claim reachability.
- Tradeoff: transient launch inputs remove user-facing audit IDs and easy replay. Content-derived deterministic bytes plus harness snapshots preserve launch validation, while advanced legacy publication/binding tools may remain temporarily for rollback but are not normal usage.
- Tradeoff: cloud-only may expose no usable provider when the user's own native cloud allowlist/credentials are absent or contradictory. That is an actionable fail/empty state, not permission to enable a local provider.
- Open question for implementation only: whether to keep schema version `2.0.0` for an atomic closed-contract extension or bump it. Resolve mechanically from repository compatibility policy; never accept both shapes ambiguously.

### Handoff notes

- Next role: `implementer` in `implementation` mode, followed by a separate `implementer` integration work unit if the parent keeps repository edits isolated, then an independent `validator` in `integration-check` or `validation` mode.
- Implementer must receive explicit edit permission for the schema and manifest/package paths listed above in addition to the user-facing deliverable paths; strict enforcement cannot be implemented truthfully by changing only the wrapper.
- Preserve every existing trusted-worktree, owner/mode/no-follow, snapshot, endpoint/provider coherence, OpenCode compatibility, project collision, isolated database, and cleanup boundary. Simplify choreography, not safety checks.
- Do not contact providers, probe endpoint health, start/stop tunnels or services, download models, publish a package, or mutate Git.

## Handoff

- Next role: `implementer` with the ordered plan and exact file contracts above.
- Limitations: Planning and read-only inspection only. No implementation, shell/global activation, provider-filter behavior on a live OpenCode process, endpoint reachability, or final acceptance was validated.
- Risks: Strictness depends on native provider filter enforcement throughout the supported OpenCode range; this requires command-backed fixture proof. The llama-server integration surface is currently working-tree material, so implementation must preserve unrelated changes and avoid assuming a released API.
