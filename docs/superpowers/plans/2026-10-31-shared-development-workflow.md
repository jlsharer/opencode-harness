# Shared Development Workflow First Increment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The owner has already authorized the Codex direct bootstrap exception and implementation; preserve that authorization rather than requesting it again.

**Goal:** Ship one shared, profile-aware development guide and executable-contract-derived task/result examples across source, portable, external runtime, and global-native distributions without changing execution authority.

**Architecture:** Keep canonical resources inside `.opencode/skills/delegation-orchestrator/references/`, referenced by the existing legacy and global authority skills. A source-only TypeScript renderer derives examples from the existing executable contract tables, validates every example, and publishes deterministic Markdown. Existing manifests and projection mechanisms distribute those resources; source QA checks generation drift while installed profiles need no renderer or source checkout.

**Tech Stack:** Node >=24 <25, TypeScript with native type stripping, node:test, existing TypeScript compatibility generation, JSON manifests, Markdown.

**Spec:** `docs/superpowers/specs/2026-10-31-orchestration-workflow-refactor-design.md` (first guidance/examples increment only).

## Global Constraints

- Exactly four role names: `researcher`, `planner`, `implementer`, `validator`; preserve all existing modes and contracts.
- Default workflow budgets remain `{"mode":"unbounded"}`; existing numeric specifications remain bounded. Finite owner-test rounds are a separate agreement.
- Preserve fresh task/child identities, independent acceptance, current validator gate obligations, writer invalidation, deadlines, scope, cancellation and capacity controls.
- No executable authority, registry, activation, transport, provider, credential, cancellation, deadline or acceptance-gate semantics change. No new contract fields or runtime imports.
- Preserve global ordinary native permissions and its guard-free module closure; never project legacy stop/recovery enforcement into the global adapter.
- Installed profiles must not depend on source docs/history, `.agents/`, `.codex/`, workstation plugin caches, or the new source-only renderer/tests.
- Edit TypeScript sources and regenerate compatibility JavaScript through `npm run build`; do not hand-edit generated outputs.
- This is owner-approved Codex bootstrap work, outside OpenCode managed acceptance. No installation, activation, provider run or publication is authorized by this plan.
- Begin implementation only after the existing-work checkpoint is pushed and a new `codex/` branch is created in the same checkout, as already authorized. Preserve concurrent files; do not reset others' work.

## Review Focus

- Contract tables change: generation must either adapt with validated examples or fail explicitly; stale Markdown must fail `--check` (Task 1).
- A useful result uses invalid evidence keys, empty prose, wrong field types, unmatched trace paths or unpaired command/exit: executable validators must reject it (Task 1).
- A guide is shipped without its linked example resource: installed portable/runtime/global fixtures must fail or expose the missing managed resource, without relying on source docs (Task 2).
- Global projection rewrites resource/example paths: installed links must resolve exactly once, and examples remain explicitly illustrative contract shapes rather than observed gate proof (Task 2).
- Workflow advice invents a fifth role, terminal reuse, finite workflow cap, advisory-only gated review, unsupported background transport, or external-QA acceptance: decision matrix and existing controller/protocol tests must reject that interpretation (Task 2).

---

## File and interface decisions

- Create canonical `references/development-workflow.md` and generated `references/task-contract-examples.md` beneath the existing delegation skill.
- Do **not** create `.opencode/workflows/development.md`: the approved design permits this implementation choice, and existing workflow-authoring guidance intentionally rejects a parallel delegation protocol. Record the choice in the guide's opening boundary and the final change description.
- Legacy `SKILL.md` links `references/development-workflow.md` and `references/task-contract-examples.md`. Global source `SKILL.md` names canonical `.opencode/skills/delegation-orchestrator/references/<file>.md` paths: existing projection rewrites these to immutable release paths. Its manifest also publishes both resources beside the installed skill. Test the actual installed links and rewritten targets.
- Keep shared guide content profile-aware: it describes development practice; the active profile skill remains the sole delegation authority. Leaves receive bounded relevant practices in their task packet, never instructions to load the parent skill.
- No role-agent file changes are needed: relevant planning/debugging/review practice is carried through current packet fields, avoiding new blanket leaf triggers.

### Task 1: Generate truthful task-contract examples and enforce source drift detection

**Files:**
- Create `.opencode/scripts/render-task-contract-examples.mts`.
- Create `.opencode/scripts/render-task-contract-examples.test.mts`.
- Create `.opencode/skills/delegation-orchestrator/references/task-contract-examples.md` (generated).
- Modify `.opencode/scripts/validate-harness.mts`, `.opencode/harness.manifest.json`, `package.json`.

**Interfaces:**
- Consume unchanged `TASK_MODES`, `taskContractShape(role)`, `validateTaskPacket(role, input)`, `validateTaskResult(input, expected)`, `TaskContext`, and `TaskResult` from `.opencode/src/plugin-modules/task-contracts.ts`; `TaskThreadRole` from `task-thread-policy.ts`.
- Export `buildTaskContractExamples(): ContractExample[]`, where `ContractExample = { context: TaskContext; packet: Record<string, unknown>; result: TaskResult }`.
- Export `renderTaskContractExamples(): string` for deterministic Markdown. It validates every example before rendering and includes executable `taskContractShape` JSON for each role.
- CLI `node .opencode/scripts/render-task-contract-examples.mts [--check] [--root ABS]`: default root is cwd; output is the one canonical Markdown path beneath root. Normal mode writes it; `--check` only compares and returns nonzero for absent/different output. Unknown options and nonabsolute explicit roots reject. Importing the module has no write/CLI side effects.

- [ ] **Step 1: Add failing node:test cases** in the new test script. Assert exact role set; packet/success coverage for every `(role, mode)` in `TASK_MODES`; all examples pass real validators; rendered JSON fences decode to their exact objects. Add blocked, failed, and clarification examples for `validator/validation`, demonstrating outcome-specific fields without success output. Assert `traceArtifactPath === artifacts[0].reference`, valid 64-character lowercase SHA where used, and command/observed integer exit pairing.
- [ ] **Step 2: Run** `node --test .opencode/scripts/render-task-contract-examples.test.mts`; expect failure because renderer exports do not exist.
- [ ] **Step 3: Implement the renderer** from executable `taskContractShape`: derive all required field names and types, use meaningful bounded sample prose keyed by field, explicit fresh sample IDs, `dispatchKind: "fresh"`, `routingMetadataStatus: "absent"`, and role/mode values from executable tables. Add optional roots using illustrative lexical-canonical absolute paths. Derive output field names/types from the same shape; use arrays for prose union examples and a string for `traceArtifactPath`. Never copy required-field arrays into a second schema. Validate before returning/rendering; unknown future field types fail rather than defaulting silently.
- [ ] **Step 4: Add mutation assertions**: extra `path`/`summary` evidence keys, `command` without `exitCode`, exit without command, empty required prose/list, wrong packet type, and trace/artifact mismatch fail through actual validators. Explain examples are contract-valid illustrations, not admitted work, actual command observations, profile proof, or acceptance; paths/hashes are placeholders to replace with real references and observations. Do not synthesize caller routing labels.
- [ ] **Step 5: Add CLI fixture tests** using a private temporary root: render, compare exact expected bytes, run `--check` successfully, alter one output byte, then require nonzero drift detection without any rewrite. Missing file fails check. Repeat generation produces identical bytes; no timestamps or host-dependent paths are emitted.
- [ ] **Step 6: Wire source-only inventory and QA**: add both `.mts` files and generated reference to source manifest and `STATIC_MANIFEST_PATHS` in source validator; source-only script kinds follow existing renderer/build/evaluation script conventions and Markdown uses `opencode-skill-reference`. Add the new test invocation to `test:harness`. Invoke renderer `--check` from source `validate-harness.mts` using `process.execPath`, exact script path and `cwd: ROOT`; propagate failure. These `.mts` files run natively and require no generated-artifact entry or installed manifest inclusion.
- [ ] **Step 7: Generate and verify** with `node .opencode/scripts/render-task-contract-examples.mts`, `node --test .opencode/scripts/render-task-contract-examples.test.mts`, `node .opencode/scripts/render-task-contract-examples.mts --check`, and `npm run typecheck`. Expect all pass. Source-only inventory recognizes all new files; package payload remains unchanged until Task 2 intentionally adds the Markdown.
- [ ] **Step 8: Review this deliverable** against executable shapes and inspect diff for accidental runtime edits. Commit only if matching existing owner Git authorization permits commits; otherwise retain the reviewable diff.

### Task 2: Publish canonical development guidance through every existing profile closure

**Files:**
- Create `.opencode/skills/delegation-orchestrator/references/development-workflow.md`.
- Modify `.opencode/skills/delegation-orchestrator/SKILL.md`, `.opencode/global/skills/delegation-orchestrator/SKILL.md`.
- Modify `.opencode/harness.manifest.json`, `.opencode/portable.manifest.json`, `.opencode/runtime.manifest.json`, `.opencode/global.manifest.json`, `package.json`.
- Modify `.opencode/scripts/validate-harness.mts`, `.opencode/src/scripts/validate-portable-harness.ts`, `.opencode/src/scripts/portable-harness.test.ts`, `.opencode/scripts/runtime-harness.test.mts`, `.opencode/scripts/global-harness.test.mts`.
- Create source-only `.opencode/scripts/development-workflow.test.mts` for the policy/projection decision matrix; inventory it in source manifest and `STATIC_MANIFEST_PATHS`, and add it to `test:harness`.
- Regenerate `.opencode/scripts/validate-portable-harness.mjs` and `.opencode/scripts/portable-harness.test.mjs` through existing build.

**Interfaces:**
- Consume Task 1's canonical Markdown and validated renderer; do not invoke the renderer from installed profiles.
- Produce two skill resources at `skills/delegation-orchestrator/references/{development-workflow,task-contract-examples}.md` in external runtime and native discovery; portable retains their `.opencode/...` paths.
- Preserve all executable protocol interfaces and version `0.1.20`; this increment is source work, not a release bump.

- [ ] **Step 1: Add failing closure and policy tests**. In existing portable fixture test, bootstrap a clean independent destination with no source docs, AGENTS, source inventory/history, or renderer, then require both resources present/readable and their local links resolved. In runtime fixtures, prepare with the existing fake trusted executable and assert both resources match their manifest mappings; removing either managed leaf rejects runtime verification. In global fixture install (temporary config/state only), assert both resources occur in release inventory and native discovery, installed skill links resolve, `.opencode/` paths inside projected references expand once, and no source file/plugin-cache path is needed. Keep existing sentinel/config/auth preservation and guard-free closure assertions.
- [ ] **Step 2: Run targeted tests** and verify expected missing-resource failures before adding assets. Use `node --test .opencode/scripts/development-workflow.test.mts`, `node --test .opencode/src/scripts/portable-harness.test.ts`, `node --test .opencode/scripts/runtime-harness.test.mts`, and `node --test .opencode/scripts/global-harness.test.mts`; test-name filtering is acceptable for first red/green runs.
- [ ] **Step 3: Write the guide** with these bounded sections: active-profile preflight; minimal meaningful task graph; bounded briefs; grouped writes and independent requirements/quality review plus final gates; cause-first debugging and behavioral checks; separate finite owner rounds; honest diagnostics and evidence/context handoff. Preflight records actual profile/tools, existing approval, scope, packet types/examples, budget mode, actual task deadline, role/mode predecessors, capacity and supported transport, gate ownership, exact commands and command/environment compatibility. Reuse approved design rather than reapprove it. Mention the current five-minute task default as current behavior, not a new control.
- [ ] **Step 4: Pin policy decisions in the guide and decision-matrix test**: small deliverables may use implementer then independent validator without research/integration; one fresh independent validator can cover requirements, quality and exact gates; successful review still owes assigned gates; later writers invalidate old proof; grouped edits cannot reuse proof merely because paths differ. Legacy incompatible write-producing QA is identified before admission and reported as separate external QA, never a managed gate; global host permissions do not imply background or legacy recovery. Unbounded budgets never remove deadlines/capacity/freshness; owner manual verdicts remain distinct. Failure diagnosis distinguishes unsupported environment, runtime rejection, budget/deadline, stale proof and unknown termination with evidence and next safe action; no fabricated measurements, fifth role, terminal retry or parked-finding acceptance.
- [ ] **Step 5: Add small authority-skill entry links** making the shared guide and generated examples required pre-dispatch references for relevant work. The guide links examples locally. Preserve profile-specific authority language and existing scope; do not copy a new procedure into both skills. Include concise original provenance acknowledging adaptation from Superpowers 7.0.1 with locally written wording. If substantial text is copied, retain its MIT notice rather than relying on attribution alone.
- [ ] **Step 6: Extend exact manifests and validators**. Add both references to source static inventory and manifest, portable `managedFiles` and `EXPECTED_MANAGED_FILES`, external runtime `files` with `.opencode/` stripped only from destination, and explicit `package.json.files`. Add two global assets following existing reference entries (`kind: "native-projection"`, canonical source/release paths, `discovery: "skills/delegation-orchestrator/references/<file>"`). Existing projection already handles reference paths; do not change `bin/global-harness.ts`. Update source exact-count checks/messages from runtime 52 to 54 and portable 65 to 67, and source package exact-payload assertions to require both files while excluding renderer/tests/source docs. Do not broaden directory allowlists.
- [ ] **Step 7: Make isolation and omission tests green**. Require exact four agent files and existing roles/modes, retain global import-closure test, and prove an omitted required portable manifest resource fails installed validation. Test generated example JSON with real validators from source rather than inventing a second Markdown schema. Policy text assertions are projection checks, not evidence that prose enforces runtime behavior; run existing controller/protocol tests for that evidence.
- [ ] **Step 8: Regenerate and verify**: `npm run build`, Task 1 tests/check, workflow matrix test, targeted portable/runtime/global fixture tests, and `npm run check:generated`. Inspect generated diffs; only expected validator/test outputs should change. No hand-generated runtime authority modules should differ.
- [ ] **Step 9: Run final QA below**, review the whole changed tree against the approved design, and record evidence limitations. Commit only with matching existing Git authorization.

## Final QA and reporting

- [ ] Run `npm test` (format/lint, typecheck, generated/source-policy checks, V2 bridge, all harness/source/portable/runtime tests, global validation/tests). This contains required `node .opencode/scripts/validate-harness.mts`, `node .opencode/scripts/validate-portable-harness.mjs --root .`, both runtime test scripts, `npm run validate:global`, and `npm run test:global`; do not run duplicates after a complete passing run without a reason.
- [ ] Run `node .opencode/scripts/render-task-contract-examples.mts --check` and the new tests explicitly if not reached in the pipeline; verify they are subsequently wired into source QA.
- [ ] Run `npm pack --dry-run --json`; inspect that both Markdown references ship and renderer/tests/design/history do not newly ship. Source validator also checks exact package payload.
- [ ] Fixture directories must be current-user mode 0700. Reuse the parent's proven private `/var/tmp` fixture parent for this environment: legacy Bubblewrap hides `/tmp`, while project-local TMPDIR changes non-Git fixture semantics. Do not mistake environment incompatibility for an implementation regression. Use normal sandbox calls first; if WSL exec fails before shell startup, follow the prescribed read-only escalation diagnostic and individually reviewed minimal commands.
- [ ] Perform independent whole-diff review under the already selected execution method. Verify runtime authority imports and contract/controller implementations are unchanged. The new source tests prove distribution, drift detection, and example validity; existing negative suites prove preserved protocol behavior. No claim about live model performance, real provider cancellation, activation or managed acceptance follows from offline fixtures.
- [ ] Report canonical paths, why references replace the proposed parallel workflow document, exact QA outcome, any unresolved blocker, and the restart requirement for later operator use. Do not restart OpenCode as part of authoring.

## Deferred by design

Runtime review/gate separation, configurable admitted deadlines, narrowed failure interruption, registry retirement, global background transport, broader parallelism, routing/credential/provider changes, installation, release evaluation and measured performance targets remain separate increments.
