# Global OpenCode harness for T3Code on WSL2: refactor plan

## Status and scope

Proposed design, researched on 2026-10-28. This is a planning deliverable for review; the global profile and new adapter described below are not implemented. The document preserves current capabilities through explicit component dispositions and proposes removing the recurring execution guards from the new global path. It does not authorize runtime activation, host permission changes, provider or credential changes, installation, or publication.

The goal is to make all harness skills, protocols, hooks, workflows, four subagent roles and runtime capabilities available through T3Code's native OpenCode provider inside WSL2 regardless of session working directory. Existing source, portable and external-runtime profiles remain distinct during migration.

## Research and source anchors

Official documentation establishes the supported topology and discovery surfaces. Exact selected-version integration, hook timing and end-to-end tool behavior still require the compatibility spike in work unit 1.

- [T3Code OpenCode provider](https://github.com/pingdotgg/t3code/blob/main/docs/user/providers-opencode.md): native provider, local launch or Server URL, documented version requirements, plan-agent mapping and catalog refresh.
- [T3Code installation](https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md): Windows desktop WSL environment selection, provider CLI installation inside the selected distro, and directory-based thread launch.
- [T3Code permission modes](https://github.com/pingdotgg/t3code/blob/main/docs/user/permission-modes.md): Full access and provider-specific effective permission behavior.
- [OpenCode V2 configuration](https://opencode.ai/v2/docs/config/), [agents](https://opencode.ai/v2/docs/agents/), [skills](https://opencode.ai/v2/docs/skills/) and [plugins](https://opencode.ai/v2/docs/plugins/): user-wide discovery, project precedence, skill-relative resources and plugin directory configuration.
- [OpenCode server](https://opencode.ai/docs/server/): general headless server/API architecture. [V1 configuration](https://opencode.ai/docs/config/) documents `OPENCODE_CONFIG_DIR`; its use is not assumed to prove V2 compatibility.

Repository evidence informing this design:

- [Current runtime CLI](../bin/opencode-harness.ts), [package metadata](../package.json) and [project instructions](../AGENTS.md) establish the Linux/Node-24 runtime, Git-root launcher, native database options and profile boundaries.
- [Source manifest](../.opencode/harness.manifest.json), [external runtime manifest](../.opencode/runtime.manifest.json) and [portable manifest](../.opencode/portable.manifest.json) establish the different asset inventories.
- [Task contracts](../.opencode/src/plugin-modules/task-contracts.ts), [thread policy](../.opencode/src/plugin-modules/task-thread-policy.ts), [dispatch controller](../.opencode/src/plugin-modules/dispatch-controller.ts) and [role I/O contracts](../.opencode/contracts/role-io-contracts.json) contain validation to retain.
- [Managed execution](../.opencode/src/plugin-modules/managed-execution.ts), [managed dispatch](../.opencode/src/plugin-modules/managed-dispatch.ts), [V2 adapter](../.opencode/src/plugin-modules/v2-native-plugin.ts) and [V2 bridge](../.opencode/src/plugin-modules/v2-dispatch-bridge.ts) contain execution and lifecycle coupling to split from protocol validation.
- [Acceptance proof](../.opencode/src/plugin-modules/acceptance-proof.ts), [context bounds](../.opencode/src/plugin-modules/context-budget.ts), [compaction handoff](../.opencode/src/plugin-modules/compaction-handoff.ts) and [memory protocol](../.memory/protocols/memory-management.md) identify evidence and context capabilities to preserve.
- [Existing design](../opencode-harness.design.md), [source validator](../.opencode/scripts/validate-harness.mts) and [portable validator](../.opencode/scripts/validate-portable-harness.mjs) remain current-profile references until a later implementation updates them coherently.

The selected outcome is one complete versioned global harness installation inside the selected WSL distro. T3Code uses its native OpenCode provider. Native OpenCode handles sessions, authentication, ordinary tools and permissions. A small version-specific plugin adapter checks orchestration admission, child task inputs and outputs, and protocol transitions. Invalid managed work loses acceptance or receives a task-local rejection; it does not lock unrelated work or ordinary tool access.

## 1. Capability boundary and decision gates

| Capability | Established by research | Required implementation/proof |
|---|---|---|
| Windows T3Code → WSL backend → Linux provider CLI | Official T3Code installation docs support selecting a WSL distro and installing CLIs there | Record exact T3Code build/distro/backend and selected Linux OpenCode executable; demonstrate the topology on the eventual target host |
| Native OpenCode provider | Official guide documents local launch/existing Server URL, minimum 1.14.19 and separately 2.0.18+ | Select an exact supported V2 release after API inspection; do not interpret two documented version lines as a tested compatibility range |
| Global roles, skills and plugins | OpenCode V2 docs describe global discovery and plugin directories | Prove commands, role invocation, plugin hook timing, global resources and effective configuration in the selected release |
| T3Code command/skill catalog refresh | Provider guide documents refresh/reconnect and possible external server restart | Verify all five commands/four skills are visible and semantically usable, not merely listed |
| Child dispatch/result enforcement | Existing repository contract modules implement checks in its current integration | Prove selected V2 hooks expose identity and results before acceptance; implement adapter or identify upstream API gap |
| Full tool access | T3Code documents Full access; native/provider permissions still apply | Remove repository-imposed execution restrictions and test effective tools through T3Code; no claim to bypass host policies |
| Workflow support | Source workflow directory is empty; native workflow discovery was not established | Preserve workflow documentation/conventions and make future workflows callable via skills/commands; upstream UI work only if dedicated workflow UX is required |

“Any directory” has two distinct acceptance surfaces: the harness must accept any native session cwd (including non-Git directories), while T3Code may constrain which directories its project/thread UI can select. Phase 1 must test that UI separately. If the installed UI cannot open a directory that native OpenCode supports, record a T3Code limitation and upstream request or supported explicit-path/server alternative; do not claim harness cwd support proves UI support.

Default integration: configure T3Code's WSL environment to use native Linux `opencode`, with global harness discovery in that distro. Do not put the current `opencode-harness run` in T3Code's Binary path: research identifies serve/web forwarding restrictions, Git-root assumptions and launch-root activation checks. Avoid a new proxy/server wrapper unless the compatibility spike proves it necessary. If required, it must transparently implement version/probe/serve/shutdown/cwd/env semantics and have protocol fixtures before adoption. Existing-server attachment is a supported fallback, but its per-session directory semantics must also be proved. No custom Windows-to-WSL transport or exposed listener is assumed.

If hooks cannot reliably identify fresh children and intercept malformed output before managed acceptance, stop the enforcement implementation at a documented capability gap. Prefer an OpenCode adapter/upstream extension for dispatch/result hooks. T3Code changes are needed only for missing catalog/session/tool interactions in its provider integration. Do not present prompt-only compliance, catalog presence or an unverified guessed source path as enforcement proof.

## 2. Architecture and path contracts

Proposed logical layout (physical XDG paths resolve from the WSL environment, not Windows or repository cwd):

- Versioned immutable assets: `$XDG_DATA_HOME/opencode-harness/releases/<package-version>/` (default `~/.local/share/...`), containing roles, commands, all skills and references, plugin/module closure, schemas/contracts, routing defaults, memory protocols/templates and runtime helpers.
- Native discovery surface: `$XDG_CONFIG_HOME/opencode/` (default `~/.config/opencode/`). A manifest-owned projection exposes four agents, five commands, four skills and exactly one plugin entry to the active release. Use supported native discovery/configuration for the selected V2 release; choose copy versus configured directory only after testing native relative-resource semantics. Never rely on an undocumented symlink/config variable behavior.
- Operator settings: separate user-owned routing/optional workflow settings under an explicit global harness config directory, with native provider/auth configuration left in native ownership. The neutral routing example remains default; no private override is packaged.
- Generated traces: `$XDG_STATE_HOME/opencode-harness/workspaces/<workspace-key>/sessions/<session-id>/orchestrations/<orchestration-id>/` (default `~/.local/state/...`). `workspace-key` hashes canonical actual directory identity; metadata records the readable path. This prevents same-name directory collisions. Store no credentials or raw auth databases.
- Working directory: actual T3Code-selected session cwd, including nested and non-Git directories. Optional Git root is metadata, not admission or cwd replacement. Every task carries its originating cwd; no process-global mutable workspace root.
- Native session/auth state remains native. No default temporary `OPENCODE_DB`, auth export/import or hidden native-db rebinding in this path. Legacy database flags remain explicitly documented legacy features until the older profile is retired under a separate migration decision.

Provide an asset resolver separating `assetRoot`, `workspaceDirectory`, `traceRoot` and `operatorConfigRoot`. Replace workspace-relative `.opencode/...` references in commands, skill references, contracts, schema links and prompt templates with installation-root resolution or explicit resolved task context. Preserve project `.memory` and existing optional skills; global traces are the default and project-memory export is explicit. Assets must load from an empty directory without repository `AGENTS.md`, design documents, Git metadata, reference projections, source inventory or historical traces.

Activation has one active adapter per native provider instance, with per-session state. Handle old project/global duplicate plugins deterministically and report provenance/version; do not load both and hope discovery order wins. Existing project configuration can override native global entries, so the installer/doctor reports exact collisions and offers a reviewable migration of harness-owned entries. It does not remove unrelated project plugins, skill content or settings. Collision handling can reject harness activation/managed admission; it must not become a general tool lockout. Global assets remain available independently of selected cwd; conflicting project overrides are an explicit diagnosed exception until migrated.

## 3. Complete component disposition

A new global-profile manifest is the authoritative runtime asset closure. Reconcile every source/runtime/portable entry and npm packed file against a disposition ledger before implementation acceptance. Preservation means every useful capability has a named destination or equivalent; source QA and history remain source-only. Old guard machinery is deliberately retired from the new active path rather than shipped as an undocumented requirement.

| Existing surface | Disposition / exact responsibility |
|---|---|
| `bin/opencode-harness.ts` and generated `.mjs` | Refactor shared asset/install/version helpers; add explicit global prepare/install/doctor/uninstall commands as an implementation design, preserving legacy `prepare/run` compatibility initially. Native CLI remains provider entry. Do not silently replace user's `opencode` command |
| `.opencode/{harness,runtime,portable}.manifest.json`, package files | Keep source and portable boundaries; add `.opencode/global.manifest.json` and schema/validator. Package every global runtime asset and closure, not just today's external subset |
| Four `.opencode/agents/*.md` | Preserve exactly researcher/planner/implementer/validator and task modes. Convert references for global resolution. Keep role instructions and delegation boundaries; remove ordinary-tool allowlists from frontmatter/plugin policy while retaining leaf delegation/orchestrator denial required by protocol |
| Five `.opencode/commands/delegate-*.md` | Preserve global commands and thin orchestration intake. Direct role command with an incomplete packet returns actionable contract error for that invocation, not a stopped session; a valid bounded packet can proceed through managed admission |
| Four `.opencode/skills/*` | Package delegation-orchestrator, interactive-refinement, opencode-skill-authoring, opencode-workflow-guidance, including **all** supporting files: notably `references/llama-cpp-integration-guide.md` absent from today's external manifest |
| `.opencode/workflows/` | Empty in inspected checkout. Preserve convention/global workflow location and adapt workflow guidance to actual native skill/command entry points; audit operator/project optional workflows without overwriting them |
| Contracts and eight schemas | Preserve exact roles/modes, structured I/O, orchestration, trace, refinement and routing/projection schemas. Version path-resolution changes, maintain a legacy decoder only at an explicit boundary; malformed/ambiguous versions reject managed admission |
| `task-contracts`, `task-thread-policy`, `dispatch-controller` | Extract portable protocol core: semantic normalized-spec checks, fresh IDs/threads, correlation, bounded clarification/context-update exceptions, DAG dependencies, budgets and state transitions |
| `acceptance-proof` | Keep independent validator evidence and command-backed acceptance tied to changed behavior; hook progress remains coordination evidence |
| `context-budget`, `compaction-handoff` | Preserve bounded context and resumable context summaries; compaction cannot revive completed/cancelled child authorization. Budget failures affect managed dispatch/acceptance only |
| `harness-lifecycle`, plugin entry | Replace broad tool interception with event wiring, scoped protocol admission/result handlers and observational telemetry. Exactly one global plugin entry and complete generated module closure |
| `v2-native-plugin`, `v2-dispatch-bridge` | Rewrite as a version-specific native API adapter; remove fixed launch-root/guard-marker prerequisites. Translate native thread/task identity and lifecycle into portable protocol events |
| `managed-dispatch` | Split retained protocol dispatch/result semantics from retired process-wide stop/release/recovery machinery. New adapter must not import the old lockout module transitively |
| `managed-execution` | Retire command rewriting, role-specific tool allowlists and Bubblewrap requirements from the new global path. Native tools/permissions carry out work; declared task scope remains a contract and validator concern |
| `trace-root-permissions` | Replace permission mutation and workspace admission with trace storage helper; private state creation and safe writes apply to harness-owned paths only. Trace failure yields explicit task evidence/persistence error, not a native tool ban |
| `role-model-routing-enforcement`, `.opencode/src/routing/*` | Retain validated optional routing and selectors, neutral defaults, no invented metadata, no provider transport mutation. Validate routing configuration at requested routing admission; avoid rewriting native permissions/global role settings behind the operator's back |
| Endpoint catalog/profile snapshots and model metadata | Keep credential-free validation, all-or-none input semantics, context/output limits and one-launch snapshots when explicitly using this feature. Errors stay within requested configuration/launch operation |
| `external-win64-relaunch` | Preserve intentional relaunch convenience as explicit utility; T3Code native WSL path replaces automatic Windows relaunch coupling. Never let legacy relaunch checks gate ordinary work |
| Operator-approved artifact/archive installers and recovery-build capabilities | Preserve downloadable-artifact integrity, bounded extraction and offline-build functionality as ordinary explicit utilities/native operations, respecting native approvals. Remove stopped-run/isolated-recovery-shell prerequisites from new workflow; cancellation recovery becomes evidence inspection + fresh task. Document exact equivalents and fixture their successful/failed paths before removing legacy helpers |
| Auth/session bridge, guarded server ownership/cleanup, activation probe | Keep legacy-only initially; new global path uses native auth/session lifecycle. Retain safe cleanup of harness-owned temporary snapshots and immutable package verification in install utilities, without scanning/gating arbitrary workspaces |
| `.memory/protocols`, templates, references, bootstrap seeds | Package reusable protocol/templates/reference assets globally; update template path semantics; preserve project-owned memory and historical records in place. Histories are not runtime dependencies |
| Build/source scripts, tests/evaluation, deployments, native patch | Keep source QA/release tooling; add global-specific fixtures. Background-job patch and legacy activation fixtures remain compatibility evidence, not prerequisite for basic global execution. Benchmark/deployment docs must label selected profile/version |
| `.agents/`, `.codex/`, design/history docs | Reference-only/source-only; never runtime dependencies. Update README, root AGENTS, design and deployment guidance to separate legacy/portable/global profiles |

Do not introduce empty `lib/` or root `scripts/` merely because they appear in scope. Existing TypeScript under `bin/` and `.opencode/src/` remains the normal source authority; generated JS/MJS is built, not hand-edited.

## 4. Retain/remove/replace guard matrix

| Current guard | New policy | Observable acceptance |
|---|---|---|
| Role/mode/required-field and output-schema validation | RETAIN at child admission/result boundary | Valid packets pass; missing/mismatched/extra forbidden fields fail with correlated error |
| Normalized orchestration validation | RETAIN schema **and semantic** checks | Cycles, unavailable dependencies, role mismatch, invalid scope/budget/gates reject before child dispatch |
| Fresh child IDs, parent/child correlation, retry/remediation budgets, leaf nondelegation, parent delegation-only during orchestration | RETAIN as orchestration protocol | Reuse/forged result/retry bypass/leaf delegation rejected for managed task; ordinary tools outside that operation remain usable |
| Independent validator and evidence gates | RETAIN | Implementer self-report, progress hook or stale evidence cannot satisfy acceptance |
| Exact predeclared shell commands; researcher-only web; implementer-only edits; unknown-tool/patch denial | REMOVE from global harness | Shell/edit/patch/web tools available according to native provider policy; no harness command rewrite |
| Bubblewrap/user-namespace requirement and readonly host bind | REMOVE from ordinary execution path | Global runtime works without bwrap; no harness sandbox interception/import |
| Canonical Git root, strict workspace owner/mode scanner, recursive project fingerprints as launch prerequisites | REMOVE as global-work admission gates | Nested/non-Git/space paths work; installation writes still validate only their own destination |
| Guard marker/native cancellation proof/exact tree hash before release; session-wide stopped mode | REPLACE with task-local terminal state and native cancellation | Invalid/cancelled work remains unaccepted; user can keep working; fresh task cannot claim prior task's acceptance |
| Trace permission replacement and destructive managed-directory interception | REPLACE with harness storage APIs/native permissions | Trace helper handles safe creation/errors; ordinary tools receive no new general denies |
| Native role/model mutation and exact guard activation | REPLACE with explicit requested routing + adapter capability diagnostics | Default tools/session run independently; managed enforcement must prove hooks before declaring active |
| Duplicate plugin and schema/version conflict | RETAIN scoped activation/admission error | Error identifies conflicting harness entry/version; unrelated native work stays available |
| Credential mutation, unsafe archive extraction, package/owned-temp cleanup checks | KEEP bounded utility correctness | Utilities cannot write outside their owned destination; they do not gate general session tools |
| T3Code/native/provider/host permission policy | NATIVE responsibility | Harness adds no extra tool restrictions; Full access setup is explicit operator configuration during later authorized activation |

Scope promises are validated by independent evidence rather than a replacement filesystem sandbox. Removing execution guards changes the protection model: the harness enforces task authorization/acceptance, not arbitrary code containment. This is a deliberate design consequence of the requested guard removal; native permissions and operator trust govern tool effects.

Cancellation cannot guarantee a native child stopped immediately. Mark `cancel_requested`/`cancelled` (with native confirmation status recorded), reject late results, request native cancellation and surface any uncertainty. Never delete traces or label effects validated merely because cancellation was requested. An unresolved native writer is visible to the parent and future same-scope scheduling; managed scheduling must not silently create conflicting work. It must not trigger an unrelated session/workspace-wide tool embargo or resurrection of old release gates.

## 5. Protocol adapter contract

Keep one versioned internal event model: `orchestration.admit`, `task.admit`, `task.started`, `task.result`, `task.cancel`, `orchestration.accept`. Resolve session cwd/parent/task identity from trusted native API context rather than user text alone. Validate caller input before dispatch; bind native child ID after launch; accept only a correlated result once. Store state by native session plus orchestration/task IDs, never one global workspace flag.

States are admitted → running → returned → independently validated → accepted, with failed/rejected/cancelled terminal outcomes. Output validation can reject a result even after tools ran; rejection does not undo edits. Remediation uses a fresh task/child with bounded budget. Only the exact existing clarification/context-update exceptions in the protocol permit bounded reuse. Preserve serial local-model scheduling unless explicitly authorized capacity permits concurrency. Validate permission to schedule a managed child, not every ordinary tool call.

Task and result contracts must expose resolved asset/workspace/trace roots without requiring callers to fabricate routing fields. Preserve caller routing labels exactly when present and record absence when absent. Trace evidence includes command/result provenance, task identity and artifact paths. Document which guarantees are machine-enforced and which require role instruction plus independent review; do not claim to enforce parent behavior on an invisible native dispatch surface. Any native dispatch path capable of bypassing managed child validation must either be adapted for these four managed roles or be excluded from claims of managed enforcement with a clear scoped admission error.

## 6. Ordered work units and dependencies

1. **Compatibility spike and baseline, researcher → planner → validator.** Record exact T3Code/OpenCode V2/Node/WSL versions and inspect current provider/plugin APIs. Freeze baseline source/runtime/portable manifests and map every global asset/reference. Produce native-hook fixture traces for cwd, identities, dispatch/results, catalog visibility and cancellation. Exit: written capability table with working native path or exact upstream gap. No implementation unit assumes missing hooks.
2. **Pure protocol extraction, implementer.** Refactor contract/thread/controller/acceptance/budget/handoff modules into API-independent core. Add task-local state/events and schema/path version migration; preserve strict four-role modes and semantic checks. Ownership: `.opencode/src/plugin-modules/`, contracts/schemas and corresponding tests. Exit: protocol fixtures prove correctness without native server, bwrap or workspace guard.
3. **Complete global projection, implementer.** Add `.opencode/global.manifest.json`, global installer/doctor/validator, asset resolver and package closure. Include all four skills and supporting references, commands, roles, templates and utilities. Separate source/portable/external/global inventories. Ownership: manifests, `bin/`, source script helpers, package metadata and prompts. Exit: install in fake XDG roots from npm tarball, run in empty/nested/non-Git directories, uninstall only owned files; no project copies.
4. **Native V2 adapter and guard replacement, implementer.** Depends on units 1–3. Compose protocol events into one plugin; migrate routing/trace utilities; remove legacy interception imports from global closure. Keep native auth/db/tool behavior. Fixture native server lifecycle and T3Code-facing probe/serve semantics. Exit: valid/invalid managed work plus subsequent ordinary tools in the same and another session; no stopped-run lockout.
5. **Feature parity and migration, implementer integration.** Depends on units 2–4. Rework explicit download/archive/build/relaunch helpers, workflow entry points and compaction/refinement functionality. Write collision plan and profile migration tooling; update guidance/AGENTS/design/README and inventory ledger. Exit: every inventoried component has destination, equivalent or explicit legacy-only lifecycle, and no useful feature is silently dropped. Reconcile all final writes before independent review.
6. **Independent validation, validator.** Fresh child after last write; execute updated source/portable/global/package checks and adversarial fixtures. Inspect complete packed artifact rather than source presence alone. Findings block only with command-backed evidence tied to acceptance. Any remediation is one bounded fresh implementer task followed by fresh validator; no inherited old acceptance.
7. **Optional real-host activation, separately authorized later.** Review install/config delta and rollback first. Select WSL environment in T3Code, install global projection, quit/restart OpenCode/provider and refresh T3Code catalogs. Run end-to-end acceptance through actual provider path. This planning task authorizes none of these live changes. Release only after real path evidence or explicitly label integration unverified.

Review boundary: each unit ends with its listed exit evidence and an isolated diff/artifact report before its dependent unit starts. Pure protocol, projection and adapter changes should be separately reviewable; no phase may use a later real-host demonstration to excuse a failing offline gate.

Dependencies: units 2 and 3 may be independent technically, but default execution remains serial under project policy. Unit 4 waits for native hook proof, protocol core and assets. Unit 5 cannot declare parity before utilities and path migration. Unit 6 follows the last implementation write. Unit 7 requires reviewed installation permissions and capability proof; no installation/publication is hidden inside tests.

## 7. Migration and rollback

Build the new global profile side by side with the current external/portable profiles for one migration window. Record new profile/protocol versions and compatibility matrix; old launchers remain explicitly legacy, not an automatic fallback for missing adapter hooks. Do not resume historical managed tasks, old gates or stopped markers under the new protocol. Historical traces remain readable as historical evidence.

Installer defaults to a dry-run manifest diff and capability report in a later implementation. On explicit apply, preserve existing config/comments and unrelated entries; refuse destructive overwrite of colliding user-owned names. Back up exact owned entries and record installation ownership/hash/version. Activation points to a complete verified release only after staging; restart provider/OpenCode because loaded plugin/config cannot be switched safely in a running session.

For this source repository, its project-local plugin will otherwise collide with the global profile. Migration must explicitly disable/relocate only the harness-owned duplicate entry after review, or provide a tested profile selector that ensures one active adapter. For installed portable projects, provide the same exact owned-entry migration; do not delete optional skills or `.memory`. For unknown project overrides report provenance and do not claim universal active enforcement until reconciled.

Rollback restores the prior manifest-owned native discovery/config entries and active release, then restarts provider and refreshes T3Code. Keep native auth/session DBs and user project files untouched. Preserve traces and release caches; uninstall removes only recorded owned global files, never native config directories or database trees wholesale. A protocol downgrade cannot resurrect unfinished newer tasks: start a fresh orchestration. Test interrupted install, partial activation, failed rollback and uninstall in disposable roots.

## 8. Verification and release acceptance

All checks below are future required implementation evidence. This document does not report their execution or success. Existing checks must be updated coherently where they encode removed guard expectations, while keeping legacy-profile assertions for retained compatibility.

Baseline command gates for later implementation:

```sh
npm run check:format
npm run typecheck
npm run check:generated
npm run check:source-policy
node .opencode/scripts/validate-harness.mts
node .opencode/scripts/validate-portable-harness.mjs --root .
node --test .opencode/scripts/runtime-harness.test.mts
node --test .opencode/scripts/runtime-foreign-repo.test.mts
npm pack --dry-run --json
npm test
```

Use fake exact-version OpenCode binaries and private temporary XDG roots for offline fixtures. New paths proposed for implementation are `.opencode/scripts/validate-global-harness.mjs`, `.opencode/scripts/global-harness.test.mts`, `.opencode/scripts/t3code-provider-contract.test.mts`, plus contract/native-adapter unit tests under the existing source-module test tree. Validate command names and outputs when implemented; these proposed paths are not claimed to exist today. A tarball extraction fixture should resolve every relative import/resource and compare npm packing to the global manifest. No network/auth credentials are needed for fixture acceptance.

| Gate | Required command-backed evidence |
|---|---|
| Complete global presence | Exactly four roles, five commands, four skills, all skill references, every schema/protocol/template, plugin closure, routing and utility capabilities inventoried; no hidden repository dependencies |
| Directory independence | Root/nested/non-Git/space/unicode paths and two concurrent sessions retain exact selected cwd and separate trace identity; no `.opencode` copied into projects |
| Protocol correctness | Valid task/results pass; role/mode/identity mismatch, stale result, cycle, invalid dependency, exhausted budget, illegal reuse and nonindependent validator fail at scoped boundaries |
| Guard removal | Fixtures prove ordinary shell/read/edit/patch/web work after invalid result, cancellation and storage error; global closure cannot import legacy execution/stop hooks; missing bwrap does not prevent use |
| Native tool behavior | Through the real T3Code path, exercise tools required by the work and confirm no repository allowlist/command rewrite. Native deny/approval remains accurately reported, never relabeled as harness success |
| Feature parity | Routing neutral/opt-in behavior; compaction, memory, refinement, explicit download/archive/build/relaunch equivalents; safe utility failure paths; no credential bytes in traces/assets |
| Effective discovery | Native API/catalog and T3Code refresh show expected assets, then real invocation proves them; plan mode/native agent mapping does not silently bypass intended orchestration entry |
| Lifecycle | Cancellation/late result, restart, two directories, fresh IDs after failure, provider disconnect/reconnect and no global lockout |
| Collision/migration | Global-only, source checkout, portable project and unrelated project plugins; no duplicate adapter; config/skill/memory preservation and reversible install |
| Package/source regression | Source, portable, legacy runtime where retained, generated-source policy and npm contents pass; test reports label profile/version |
| Rollback | Disposable install/upgrade/rollback/uninstall restore exact owned config and leave native auth/session/project files unchanged |

Final real integration report must identify T3Code version, Linux OpenCode version/absolute executable, WSL distro, effective native config/permissions and actual provider path. Do not use a direct CLI-only run as a substitute for T3Code end-to-end evidence. No live provider, auth, global install or publication checks belong to this planning deliverable.

## 9. Risks, tradeoffs and handoff

- Native API gaps are the largest dependency. A missing reliable dispatch/result hook requires upstream work or an explicit adapter design; it cannot be concealed with broad legacy guards or claims of prompt enforcement.
- Tool freedom removes sandbox guarantees. Protocol acceptance prevents unsupported success claims but cannot undo arbitrary tool side effects. Keep this guarantee boundary explicit in guidance.
- Global precedence is directory-dependent in native configuration. Complete installation is achievable; universal active behavior with conflicting projects requires a reviewable collision migration, not a promise that native precedence does not exist.
- Global state must not confuse two concurrent directories or users. Separate per-session identity and traces; safe writes/cleanup remain bounded to harness-owned assets and state.
- Native cancellation may leave a writer active temporarily. Report it and prevent false acceptance; make any same-scope managed scheduling decision visible without blocking unrelated work.
- Existing tests and docs extensively encode strict-launch behavior. Split profiles rather than deleting tests until they pass, and ensure old guards cannot leak through generated imports.
- More packaged skills/references enlarge maintenance scope. A manifest-based closure and tarball fixture makes completeness auditable.

