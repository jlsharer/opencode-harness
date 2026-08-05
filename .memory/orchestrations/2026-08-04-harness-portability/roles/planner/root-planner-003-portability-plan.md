# Harness Portability Implementation Plan

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `planner`
- artifactId: `root-planner-003-portability-plan`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved portability goals, source/portable scope boundaries, two research artifacts, required deliverable path, routing constraints, acceptance requirements, and requested DAG, file contracts, migrations, risks, checks, and handoffs.
- Required context present: `orchestrationId`, approved goal, scope boundaries, research evidence, deliverable path, acceptance criteria, and routing metadata status are present. Routing resolution is unavailable because the current ignored custom override is invalid; no resolved provider/model data is assumed.
- routingMetadataStatus: `absent`. The caller supplied no enriched routing metadata, so no routing labels or values are invented.

## Work Performed

- Summary: Converted the approved goals and cited research into a bounded, dependency-ordered implementation plan. Defined a manifest-driven, dependency-free bootstrap; separated source QA from installed portable validation; selected neutral disabled-local semantics; bounded the trace-contract reconciliation to fresh-memory needs; assigned non-overlapping implementation paths; and specified command-backed foreign-repository acceptance cases.
- Files read: Both supplied researcher artifacts; role I/O contracts; trace and routing schemas; source manifest/validator; routing loader, policy, test, and examples; plugin modules; memory protocol/index/templates; root config/ignore; and relevant skill/workflow references.
- Files changed: This planner trace artifact only. Creation of the requested orchestration `INDEX.md` was attempted but denied by planner edit permissions.
- Commands/checks: No implementation or final validation commands were run. Planning used read-only file inspection and repository searches.

## Approved Decisions and Boundaries

1. **Distribution strategy:** add one authoritative `portable-core` inventory at `.opencode/portable.manifest.json` and one dependency-free Node bootstrap at `.opencode/scripts/bootstrap-portable-harness.mjs`. Do not introduce npm packaging, generated `.opencode/package.json`, lockfiles, or `node_modules`.
2. **Destination ownership:** bootstrap does not copy, create, require, or modify destination `AGENTS.md`, `opencode-harness.design.md`, `opencode.json`, or root `.gitignore`. OpenCode discovers standard `.opencode` assets; role prompts directly reference bootstrapped memory.
3. **Memory bootstrap:** canonical portable seeds live under `.opencode/bootstrap/memory/`. Bootstrap creates a fresh minimal `.memory` when absent and fills missing base files when partial. It never copies `.memory/orchestrations/**`, overwrites existing memory, or deletes destination memory.
4. **Validation boundary:** retain `.opencode/scripts/validate-harness.mjs` as source/release QA requiring this repository's roots/history. Add `.opencode/scripts/validate-portable-harness.mjs`; it must not read or require source `AGENTS.md`, design, source manifest, root config/ignore, reference inventory, or orchestration history.
5. **Routing default:** make `harness-model-routing.example.json` neutral: local disabled, force false, null default, empty catalog, and null local selectors. Keep variants and fixed ownership. Add `harness-model-routing.local.example.json` as an explicit valid enabled-local example/test fixture; implicit loading still recognizes only custom then neutral example.
6. **Disabled-local semantics:** disabled means local entries are not selected. Permit an empty catalog only while disabled. Retain validity for a disabled configuration with a coherent dormant catalog/selectors, but return no local model or metadata. Enabled routing still requires a nonempty catalog and valid references.
7. **Routing safety:** preserve custom-first, no merge, no fallback from any present unreadable/malformed/invalid custom, exact explicit paths, force-local all-eight coherence, atomic preflight, and no fallback. Do not edit/package/repair the current ignored custom override.
8. **Trace mismatch:** reconcile only `.opencode/contracts/role-io-contracts.json` `traceArtifact.requiredFields` to schema/template vocabulary: `orchestrationId`, `role`, `artifactId`, `createdAt`, `inputContract`, `workPerformed`, `outputContract`, `handoff`. Keep evidence nested in `outputContract`; do not change the trace schema or historical artifacts.
9. **Portable-reference rule:** every portable-manifest text file must be free of dependencies/references to `AGENTS.md`, `opencode-harness.design.md`, `.opencode/scripts/validate-harness.mjs`, `.opencode/harness.manifest.json`, `.agents/`, `.codex/`, the source absolute path, or historical `.memory/orchestrations/`. Generic harness naming/schema IDs are allowed.

## File Contracts

### New files

| Path | Contract |
| --- | --- |
| `.opencode/portable.manifest.json` | Closed portable-core inventory with version/profile, unique safe relative managed paths, memory seed mappings, and forbidden-reference tokens. Must not list destination-owned/source-only roots or custom routing. Bootstrap and portable validator consume it. |
| `.opencode/scripts/bootstrap-portable-harness.mjs` | Node-built-ins-only CLI. Resolve source root from `import.meta.url`; default target cwd; accept `--target <path>`, `--dry-run`, and explicit `--overwrite-managed`. Preflight before writes. Copy manifest-managed `.opencode` files; identical files no-op; differing files fail unless overwrite was explicitly requested. Seed only missing memory; never overwrite memory. Use temporary sibling plus rename per write. Print created/unchanged/collision summaries; nonzero on defects. |
| `.opencode/scripts/validate-portable-harness.mjs` | Node-built-ins-only installed-profile validator; default root cwd and exact `--root <path>`. Validate manifest safety/uniqueness/targets, role/command frontmatter, plugin entry/import, neutral routing and no-provider hook no-op, minimal memory, contract/schema/template alignment, and forbidden references. Ignore roots/history. Exact success line: `Portable OpenCode harness validation passed`. |
| `.opencode/scripts/portable-harness.test.mjs` | `node:test` E2E suite with temp foreign repos: fresh/partial memory, no source roots, idempotence, collision handling, no history copy, installed validator from root/nested cwd, and cleanup in `finally`. |
| `.opencode/bootstrap/memory/INDEX.md` | Fresh history-free index listing only protocol/templates and generated-memory conventions; no `AGENTS.md` exposure claim or orchestration links. |
| `.opencode/bootstrap/memory/protocols/memory-management.md` | Exact seed of active memory protocol; source validator enforces equality with `.memory/protocols/memory-management.md`. |
| `.opencode/bootstrap/memory/templates/orchestration-index.md` | Exact seed of active orchestration-index template. |
| `.opencode/bootstrap/memory/templates/role-trace-artifact.md` | Exact seed of schema-aligned role trace template. |
| `.opencode/routing/harness-model-routing.local.example.json` | Valid enabled, non-force illustrative configuration moved from the prior example. Coherent references; never implicit; explicit local tests/operator migration only. |

### Updated routing and contracts

| Path | Required change/preservation |
| --- | --- |
| `.opencode/routing/harness-model-routing.example.json` | Neutral disabled/empty/null local state. Preserve schema version, eight roles, commands, orchestrator ownership, null native models, variants. |
| `.opencode/schemas/harness-model-routing.schema.json` | Replace unconditional catalog minimum with conditional `minProperties:1` when enabled; permit `{}` when disabled; preserve closed shapes and force-implies-enabled. |
| `.opencode/routing/routing-policy.mjs` | Require nonempty models only when enabled. Gate role-local selection and reverse catalog metadata lookup on enabled. Preserve all precedence, force, URL, uniqueness, and coherence rules. |
| `.opencode/routing/routing-policy.test.mjs` | Split neutral committed and explicit local fixtures. Add neutral CLI/helper/plugin, disabled-dormant inertness, advisory local, force local, and existing fail-closed/exact/atomic cases. Copied bundles use neutral default. |
| `.opencode/contracts/role-io-contracts.json` | Change only all eight `traceArtifact.requiredFields` arrays to schema vocabulary; preserve I/O contracts, paths, verification expectations. |

### Updated portable docs/runtime

| Path | Required change/preservation |
| --- | --- |
| `.opencode/plugin-modules/harness-lifecycle.js` | Remove `AGENTS.md` and destination roots from harness-owned deletion guardrails; guard `.opencode`/`.memory` only; retain telemetry/guardrail-only behavior. |
| `.opencode/workflows/validation-workflow.md` | Use `node .opencode/scripts/validate-portable-harness.mjs --root .` for installed acceptance; allow separate source/project checks. |
| `.opencode/skills/delegation-orchestrator/references/validation-checklist.md` | Require portable manifest/validator/minimal memory; remove root guidance/config/source-manifest requirements. |
| `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md` | Point installed checks to portable validation; preserve full restart guidance. |
| `.opencode/skills/delegation-orchestrator/SKILL.md` | Remove source-only llama deployment guide from advertised portable references; preserve delegation/routing rules. |

### Updated source-only integration

| Path | Required change/preservation |
| --- | --- |
| `.opencode/harness.manifest.json` | Remain source/release inventory. Add all new tracked files and reconcile omitted `implement-feature` and meta-skill assets. Keep source roots source-only and custom/generated package state excluded. |
| `.opencode/scripts/validate-harness.mjs` | Remain source-only. Update neutral/local assertions, seed equality and trace alignment checks, complete source-manifest checks, and invoke/equivalently exercise portable validation explicitly. Continue requiring source roots/history and never select private custom. |
| `AGENTS.md` | Clarify it and `validate-harness` govern this source repository; installed profile is defined by portable manifest and does not require this file. Preserve role/delegation/routing safety. |
| `opencode-harness.design.md` | Document portable inventory, destination ownership, bootstrap, neutral routing, validation boundary; mark source-only. |

### Deliberately unchanged/excluded

- `opencode.json` and root `.gitignore`: source/destination-owned; no bootstrap merge.
- `.opencode/routing/routing-config-loader.mjs`: already implements required precedence/exactness.
- `.opencode/plugin-modules/role-model-routing-enforcement.js` and `.opencode/plugins/index.js`: no functional edit unless tests expose a defect.
- Deployment, llama guide, implement-feature command/workflow, and meta skills: source-only/optional, not portable-core.
- `.memory/references/**`, `.memory/orchestrations/**`, populated source `.memory/INDEX.md`: never fresh-memory package content.
- `.opencode/routing/harness-model-routing.json`: ignored operator state; never edit/package.

### Exact portable-core inventory

- Eight files: `.opencode/agents/{researcher,planner,implementer,integrator,validator,reviewer,synthesizer,artifact-verifier}.md`.
- Seven files: `.opencode/commands/{delegate-research,delegate-plan,delegate-implement,delegate-integrate,delegate-validate,delegate-artifact-verify,delegate-orchestration}.md`.
- `.opencode/skills/delegation-orchestrator/SKILL.md` and references `role-routing-matrix.md`, `validation-checklist.md`, `trust-and-restart-guide.md`.
- `.opencode/workflows/delegation-workflow.md`, `.opencode/workflows/validation-workflow.md`.
- `.opencode/contracts/role-io-contracts.json` and schemas `role-io-contracts.schema.json`, `memory-trace-artifact.schema.json`, `harness-model-routing.schema.json`.
- Routing: neutral example, local example, loader, policy, policy test, resolver, helper.
- Runtime: `.opencode/plugins/index.js`, `.opencode/plugin-modules/harness-lifecycle.js`, `.opencode/plugin-modules/role-model-routing-enforcement.js`.
- Portable manifest; bootstrap/portable-validator/E2E scripts; four `.opencode/bootstrap/memory/**` seed files.
- Seed targets (created, not copied as managed source files): `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/templates/orchestration-index.md`, `.memory/templates/role-trace-artifact.md`.

## Ordered Plan and DAG

| Node | Work unit | Depends on | Parallelizable with | Role/status |
| --- | --- | --- | --- | --- |
| R1 | Dependency/bootstrap research | none | R2 | researcher/complete |
| R2 | Routing cases research | none | R1 | researcher/complete |
| P1 | This plan | R1, R2 | none | planner/complete |
| I1 | Trace contract and memory seeds | P1 | I2 | implementer |
| I2 | Neutral/local routing and unit tests | P1 | I1 | implementer |
| I3 | Portable docs/runtime scrub | P1 | I1, I2 | implementer |
| I4 | Manifest/bootstrap/portable validator/E2E | I1; scaffold may parallel I2 | I3 | implementer |
| I5 | Source manifest/validator/guidance | I1-I4 | none | implementer |
| G1 | Cross-profile integration | I1-I5 | none | integrator |
| RV1 | Defect review | G1 | none | reviewer |
| V1 | Acceptance matrix | G1 and blocking review remediation | AV1 where independent | validator |
| AV1 | Temp installed-tree proof | G1 | V1 where independent | artifact-verifier |
| A1 | Acceptance | V1, AV1 | none | orchestrator/synthesizer if needed |

### Implementer allowed paths

1. **I1:** `.opencode/contracts/role-io-contracts.json`; four `.opencode/bootstrap/memory/**` files listed above. Do not edit trace schema.
2. **I2:** `.opencode/routing/harness-model-routing.example.json`; `.opencode/routing/harness-model-routing.local.example.json`; `.opencode/routing/routing-policy.mjs`; `.opencode/routing/routing-policy.test.mjs`; `.opencode/schemas/harness-model-routing.schema.json`. Do not touch custom or loader.
3. **I3:** `.opencode/plugin-modules/harness-lifecycle.js`; `.opencode/workflows/validation-workflow.md`; delegation skill `SKILL.md`, `validation-checklist.md`, and `trust-and-restart-guide.md`.
4. **I4:** `.opencode/portable.manifest.json`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`.
5. **I5:** `.opencode/harness.manifest.json`; `.opencode/scripts/validate-harness.mjs`; `AGENTS.md`; `opencode-harness.design.md`.
6. Each implementer may additionally write only its required trace under this orchestration's `roles/implementer/`. Index updates belong to integrator/orchestrator to avoid conflicts.

## Dependencies and Integration Gates

1. I1 fixes seed/contract vocabulary before I4 encodes mappings/checks.
2. I2 fixes fixture contracts before I4 installed assertions and I5 source assertions.
3. I3 finalizes portable contents before I4 freezes manifest/reference scan.
4. I4 completes before I5 adds all assets to source inventory/QA.
5. G1 confirms portable manifest equals this plan's exact set, source manifest covers source deliverables, and no source-only file is promoted.
6. Blocking review findings return only to the owning unit, maximum three remediation loops. Validator is acceptance authority; hooks are not evidence.

## Exact Routing Behavior Matrix

| ID | State | Resolver | Config hook | Test |
| --- | --- | --- | --- | --- |
| R-N0 | No custom; neutral example; no provider | Fixed target/variant; `model:null`; local identity/URL/budget null; not enforced/network-free | Clean startup, no provider check failure/model writes | Foreign and explicit-source PASS |
| R-N1 | Disabled, empty, null selectors/default | Same as R-N0 | No-op | Schema/policy/helper/CLI/plugin PASS |
| R-N2 | Disabled with valid dormant catalog/selectors | Ignore local data; null local decision | No-op | Regression PASS |
| R-A1 | Enabled valid custom/local example, force false, no provider | Advisory model/URL/budget, not enforced | No selector mutation/provider requirement | Explicit and temp implicit PASS |
| R-F1 | Enabled force true with coherent all-eight native config | Exact catalog-backed models, enforced | Preflight then assign all eight; providers unchanged | PASS |
| R-F2 | Force true with missing selection/agent/mode/provider/model/baseURL | Fail, no fallback | Fail before mutation | Atomic negatives PASS |
| R-C1 | Valid custom beside example | Custom only | Custom only | PASS |
| R-C2 | Present unreadable/malformed/directory/dangling/semantic-invalid custom | Fail on custom, no fallback | Fail, no mutation | PASS |
| R-E1 | Custom absent/example present | Neutral example | No-op | PASS |
| R-E2 | Both absent | Actionable error naming both/copy remedy | Same | PASS; bootstrap prevents normal install state |
| R-X1 | Explicit path | Exact path; siblings irrelevant | Exact path | Positive/missing/malformed PASS |
| R-S1 | Current source private custom | Known dangling-default failure | Not acceptance input | Limitation only; no invented model data |

## Acceptance Matrix and Verification Gates

| Gate | Command/evidence | Expected |
| --- | --- | --- |
| A1 Syntax | `node --check .opencode/scripts/bootstrap-portable-harness.mjs && node --check .opencode/scripts/validate-portable-harness.mjs && node --check .opencode/scripts/portable-harness.test.mjs && node --check .opencode/routing/routing-policy.mjs` | exit 0 |
| A2 Routing | `node --test .opencode/routing/routing-policy.test.mjs` | all neutral/advisory/force/fail-closed tests pass; no network |
| A3 Foreign bootstrap | `node --test .opencode/scripts/portable-harness.test.mjs` | fresh/partial memory, no roots/history, idempotence/collision/nested checks pass; cleanup |
| A4 Portable profile | `node .opencode/scripts/validate-portable-harness.mjs --root .` | exact portable success and exit 0 |
| A5 Neutral resolver | `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.example.json --metadata-json '{"command":"/delegate-implement"}'` | implementer; null model/local metadata; not enforced; network false |
| A6 Local resolver | `node .opencode/routing/resolve-model-routing.mjs --config .opencode/routing/harness-model-routing.local.example.json --metadata-json '{"command":"/delegate-implement"}'` | coherent advisory local example; not enforced/network-free |
| A7 Memory tree | E2E plus artifact-verifier temp listing | only INDEX, protocol, two templates; no orchestration history created |
| A8 Destination independence | Same listing/validator | no created/required `AGENTS.md`, design, or `opencode.json` |
| A9 Reference scrub | Portable validator forbidden-reference phase | zero findings |
| A10 Trace alignment | Portable/source validators | catalog required fields equal schema required; template maps to schema |
| A11 Source QA | `node .opencode/scripts/validate-harness.mjs` | source success; private custom never loaded |
| A12 Diff hygiene | `git diff --check && git status --short` plus changed-path inspection | only approved files/traces/indexes; no custom/package state/secrets/temp |
| A13 Restart | Validator handoff | full OpenCode quit/restart explicitly required, not validation proof |

Acceptance requires A1-A13 with validator pass/fail outputs and independent artifact-verifier listing/cleanup evidence. Do not use source implicit resolver as a success gate while private custom is invalid.

## Migration and Compatibility

1. Fresh foreign install: `node <bundle>/.opencode/scripts/bootstrap-portable-harness.mjs --target <foreign-repo>`, then installed portable validator. No root merge.
2. Missing/partial memory: run installed bootstrap against `.`; only missing seeds created, generated/modified memory preserved.
3. Upgrade: first `--dry-run`; identical no-op, differing managed files fail. Use `--overwrite-managed` only after review/backup; memory remains protected.
4. Enabled valid v2 custom remains valid. Disabled dormant configs remain structurally valid but local resolution becomes inert. Disabled empty becomes valid; enabled empty remains invalid.
5. Local opt-in: adapt local example to ignored custom basename and configure native providers separately for force mode. Bootstrap never creates custom.
6. Invalid custom remains fail-closed. Operator manually repairs/removes and fully restarts; no silent fallback/deletion.
7. No historical trace rewrite; future generated artifacts receive aligned required fields.

## Risks, Rollback, and Assumptions

- Managed clobbering: dry-run/default collision abort; overwrite only explicit managed `.opencode` paths.
- Partial I/O: semantic preflight and temp-file rename per output; destination VCS/backup is rollback. Do not claim whole-install transactionality.
- Seed drift: source validator compares protocol/templates; fresh index intentionally differs.
- Neutral output regression: require CLI/helper/core/plugin parity.
- Disabled behavior: explicit dormant-selector inertness test.
- Manifest confusion: portable manifest defines install; source manifest defines source QA; validators reject cross-boundary entries.
- Keep `.mjs`; do not add generated package metadata to suppress warnings.
- Private override remains a separate operator blocker and is excluded from deterministic acceptance.
- Roll back routing example/schema/policy/tests together, never one layer alone. Remove foreign managed files only after checking installed manifest and edits; never auto-remove memory/custom/root files.
- Assumptions: Node built-ins/`node:test` are available; acceptance needs no network/provider; standard OpenCode `.opencode` auto-discovery removes need for config merge; optional deployment/workflows/meta skills are outside portable-core.

## Handoff Notes

- Start I1/I2 in parallel, then I3. I4 may scaffold after I1 but freezes after I2/I3; I5/integration last.
- Integrator compares actual inventories, paths, fixed roles, and routing status; do not invent routing values.
- Reviewer focuses on clobber/path traversal/symlinks, neutral leaks, disabled semantics, custom fail-closed, and source-root validator coupling.
- Validator records `routingMetadataStatus: absent`, uses explicit fixtures/temp installs, and states implicit source routing unavailable due invalid custom.
- Artifact-verifier retains temp tree/output evidence then cleans it after evidence capture.
- Fully quit/restart OpenCode after config-time/plugin changes.

## Output Contract

- Outputs: Ordered plan, exact file contracts/inventory, source/portable boundary, routing matrix, implementer scopes, DAG/dependencies, migrations, executable gates, risks/rollback, assumptions, and handoffs.
- Evidence: The supplied research established source-root/history validator coupling, absent memory bootstrap, routing neutral-state/disabled defects, and mandatory custom-first fail-closed behavior. Current repository contracts/runtime were inspected to bound paths and dependencies.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/planner/root-planner-003-portability-plan.md`. The requested orchestration index remains unwritten due permission denial.

## Handoff

- Next role: I1 and I2 scoped implementers, then I3-I5, integrator, reviewer, validator, and artifact-verifier per DAG.
- Limitations: Planning only; no harness implementation files, tests, installs, final validation, live OpenCode, providers, or network were exercised. Current ignored custom remains invalid, so no implicit resolved model evidence is claimed. Planner permission denied `.memory/orchestrations/2026-08-04-harness-portability/INDEX.md`; an authorized role must create it and link both researcher artifacts and this plan without overwriting concurrent entries.
- Risks: Acceptance remains blocked pending validator/artifact-verifier evidence. Operator-owned invalid custom routing remains separate and must continue to fail closed.
