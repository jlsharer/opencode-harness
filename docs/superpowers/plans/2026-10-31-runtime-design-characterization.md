# Runtime Design Characterization Implementation Plan

> **For agentic workers:** Use the already authorized bounded implementation and independent review arrangement. The Superpowers writing-plans structure guides these tasks; no additional approval round or execution-method selection is needed for this design-and-test phase. Checkboxes record verification evidence, not runtime acceptance.

**Goal:** Preserve twelve meaningful current runtime boundaries as passing tests while delivering proposed designs for later runtime implementation.

**Architecture:** Extend three existing offline fixture suites. Use existing controller/protocol/adapter methods, fake clocks and native fixtures; do not implement any proposed runtime API. Keep future acceptance cases in the linked design until their production changes are separately in scope.

**Tech Stack:** Linux, Node 24, TypeScript native test runner, existing build/projection and source/global/runtime validators.

**Spec:** [Runtime acceptance and lifecycle follow-up](../specs/2026-10-31-runtime-acceptance-and-lifecycle-design.md).

**Status:** Complete for the design-and-test phase. Twelve current-behavior tests are implemented; all 151 tests across the three affected suites pass. The parent verified the complete `npm test` pipeline and package dry run successfully. Independent review found no important issues. Proposed numerical and version defaults in the design are author recommendations, not implemented contracts.

## Global constraints

- Change only `.opencode/src/plugin-modules/dispatch-controller.test.ts`, `.opencode/src/plugin-modules/managed-dispatch.test.ts`, `.opencode/scripts/t3code-provider-contract.test.mts` and their existing generated compatibility test outputs, plus this phase's design documents. Do not change production behavior, package metadata, manifests or inventories merely to accommodate tests.
- Use existing `validWorkflow`, `mapping`, `request`, `fixture`, `workflow`, `packet` and `structured` helpers locally. Small reusable test-only helpers are allowed; no separate framework or new source inventory files.
- Tests characterize v1 behavior. No `test.todo`, skipped future case, simulated future API or intentional default-CI failure. Assert rejections as successful tests; do not “fix” the known gate asymmetry in this phase.
- No real provider calls, installation, global mutation or runtime activation. Existing matching owner authorization controls commit/push; individual workers must respect their delegated file and Git ownership. Git setup inside existing disposable test fixtures is unchanged fixture behavior.
- Use a private mode-0700 directory immediately under `/var/tmp` as `TMPDIR`, outside Git and outside the Bubblewrap `/tmp` mask. Use existing managed fixture roots under `/var/tmp`. Clean up only owned test roots.
- No sleeps for timing. Use the controller's injected clock and existing managed fixture clock; global deadline selection has no current public clock option and is not added here.
- Builders are not alone: preserve other work. Test sources, design documents and independent review have separate owners. Apply production fixes only in a later authorized phase.

## Review focus

1. Gate asymmetry must demonstrate both global command-evidence rejection and final inability to close the extra gate, without implying normalization already rejects it (C3).
2. Default timeout boundary and detached returned data must test authority, not merely return-value formatting; capacity must remain reserved on expiry (C4–C5).
3. Malformed result parsing is distinct from native termination proof; local rejection tests must not claim recovery proof exists, and proof-error tests must include another registered controller (C6–C8).
4. Accepted global history still occupies shared instance resources and rejects reused children, including across parent/run boundaries where applicable (C9–C11).
5. Evidence reuse limitation must run an actual inert command whose result changes after an undeclared input edit while declared evidence stays equal (C12).

## Task 1: Controller review and deadline boundaries

**Files:** Modify/test `.opencode/src/plugin-modules/dispatch-controller.test.ts`; regenerate its existing compatibility output through the build.

**Interfaces:** Consume `validWorkflow()`, `mapping(spec, unit, role, taskMode)`, `request(id, unit, role, taskMode)`, `validateWorkflow(input)` and `createDispatchController(spec, options)` with `reserve`, `complete`, `snapshot`. Produce four independent tests C1, C2, C4, C5; no production exports.

- [x] **C1 — Review has current unit gate duties.** Give a unit two gates and validator/review mapping. Reserve review; completion with empty then partial `gateIds` rejects, leaves the attempt active and closes no gates. Exact gate set with a 64-character tree hash succeeds. Existing validation-mode tests do not cover this review-specific behavior.
- [x] **C2 — Gate-free review unit is currently invalid.** A review unit with `acceptanceGateIds: []` rejects `validateWorkflow`; no controller or reservation is created. This pins the present boundary, not v2 semantics.
- [x] **C4 — Real default deadline is five minutes.** Use unbounded budgets, `now: () => clock`, no `timeoutMs` override. Reserve at T; stored deadline equals `T + 300000`. At `T + 299999` task is running; at `T + 300000` sweep/snapshot shows `cancel-requested`, capacity is retained, and late completion rejects. Never wait on real time.
- [x] **C5 — Construction duration and returned timestamps cannot mutate authority.** Construct with mutable options and a known timeout. Mutate options afterward and mutate returned reservation/snapshot deadlines. Internal first deadline is unchanged. Complete a failed attempt, reserve a fresh retry at a later fake time, and assert it uses the original captured timeout. Existing mutable snapshot tests remain unchanged.
- [x] Run `node --test .opencode/src/plugin-modules/dispatch-controller.test.ts`; all tests must pass with unchanged production source. Review assertions against existing timeout/clarification and dependency fixtures.

## Task 2: Managed local rejection versus process interruption

**Files:** Modify/test `.opencode/src/plugin-modules/managed-dispatch.test.ts`; regenerate its existing compatibility output through the build.

**Interfaces:** Consume `fixture(role, timeoutMs)` and its `spec`, `specFile`, `managed`, `packet`, `args`, `start`, `success`, `finish`, fake clock and existing observed-child hooks. Use existing `managed` snapshots/recovery status and packet/result wrappers; do not add a termination-classification API. Produce C6–C8.

- [x] **C6 — Declared failure allows fresh retry in one orchestration.** Return a correlated researcher `failed` result with unchanged spec/workspace. Assert stopped=false and terminal failed attempt. Reusing its task ID rejects; a fresh task and observed fresh child under the same run can start within existing budgets. Do not substitute a different orchestration.
- [x] **C7 — Malformed typed result can already fail locally.** Start/observe the normal child and native wrapper, but provide invalid typed task-result content. Assert policy rejection, failed attempt, no closed gate and stopped=false. Reuse rejects and fresh task identity is required. Explicitly avoid claiming that this branch proves termination for future artifact/command failure handling.
- [x] **C8 — Trusted-proof failure interrupts all registered controllers.** Register and complete a first run, then start a validator in a separate second run on the same managed instance. Return valid success without observed exact gate-command exit proof. Assert the original trusted-command error, stopped=true, both controllers interrupted, and refusal of fresh dispatch. Retain the original failure as primary diagnostic.
- [x] Run `node --test .opencode/src/plugin-modules/managed-dispatch.test.ts`; all tests pass. Check existing missing-callback, pending-launch, scope and recovery tests still exercise conservative behavior.

## Task 3: Global association, history and input-evidence boundaries

**Files:** Modify/test `.opencode/scripts/t3code-provider-contract.test.mts`; use its existing global protocol/native fixture helpers.

**Interfaces:** Consume `workflow()`, `packet(role, id)`, `structured(role, id, sha256)`, `createGlobalProtocol()`, `declaredFileEvidence(cwd, files)`, and existing native fixture/helper methods. Use current `admitOrchestration`, `admitTask`, `started`, `result`, `accept`; no retirement/status v2 API. Produce C3 and C9–C12. A local helper for completing/accepting a normal run may be shared by C9–C11.

- [x] **C3 — Asymmetric gate association remains observable.** Add a gate that lists the unit while leaving it out of the unit's gate IDs. Current normalization/admission succeeds. Validator evidence with only unit-declared commands rejects global proof. Supplying the extra command allows result completion under its current rules, but final acceptance rejects because controller closure never closed that extra gate. Use fresh fixtures if a rejected adapter callback has consumed its one result; avoid testing impossible callback reuse.
- [x] **C9 — Accepted run still consumes one of 128 slots.** Fully execute and independently accept the first run, admit 127 further distinct runs, then assert the 129th refuses with ledger exhaustion. Acceptance alone performs no retirement.
- [x] **C10 — Run capacity is shared across parents.** Verify duplicate `(parent,id)` rejects and same ID under a different parent is initially distinct. Fill 64 slots for each of two parents; a third parent's fresh run refuses. Use a separate protocol instance if the preliminary key test would disturb exact counts.
- [x] **C11 — Accepted child history forbids reuse.** Accept a run, admit a new run with fresh task/call identity, and attempt `started` with the earlier child. It rejects; a never-used child starts. This extends current duplicate-child tests across accepted history.
- [x] **C12 — Actual command input can change without declared evidence changing.** In a private fixture, declare only `a.txt`; create undeclared `b.txt` containing `pass`. Execute an inert local Node command that reads `b.txt` and exits zero only when its contents are `pass`. Assert initial exit=0 and capture declared evidence. Change only `b.txt` to `fail`; assert command exit=1 while `declaredFileEvidence(root, ["a.txt"]).sha256` is unchanged. Finally edit `a.txt` and assert its declared evidence changes. Execute via argument array and fixed inline code, no shell interpolation, provider or network. This is a counterexample to complete-input coverage, not a test of future reuse.
- [x] Run `node --test .opencode/scripts/t3code-provider-contract.test.mts`; all tests pass. Existing collision, all-surface rejection and teardown cases supply baseline coverage for the feasibility decisions; do not add fake ownership capability.

## Task 4: Regenerate, verify and review the authorized phase

**Files:** The three test source files, their existing generated test outputs, new spec/plan, and the surgical link/status paragraph in the running workflow design. Production runtime TypeScript and generated runtime JavaScript must remain unchanged.

**Interfaces:** Consume the passing focused tests and existing package commands. Produce command-backed verification evidence, exact changed-file review, and a summary distinguishing current baselines from future acceptance cases.

- [x] Review the diff and new test names; confirm all twelve add a distinct assertion. If a research candidate duplicates existing coverage or a fixture assumption is wrong, replace it with a current-boundary assertion of equivalent intent and record that adjustment. Do not modify runtime behavior to force a proposed test to pass.
- [x] Apply formatting only to changed test sources with the existing formatter, then run `npm run typecheck` and `npm run check:format`.
- [x] Run `npm run build`, then `npm run check:generated`. Inspect generated diff: only existing compatibility test outputs should change; production generated files must not drift. No new manifest entry is needed for tests appended to inventoried files.
- [x] Run `node .opencode/scripts/validate-harness.mts`, `node .opencode/scripts/validate-portable-harness.mjs --root .`, `npm run validate:global`, and `npm run test:global`.
- [x] If generated/bundled test artifacts change, run `node --test .opencode/scripts/runtime-harness.test.mts .opencode/scripts/runtime-foreign-repo.test.mts` and `npm pack --dry-run --json`; verify unchanged package closure except the intended existing generated test bytes where included.
- [x] Parent runs final `npm test` and `npm pack --dry-run --json` under the private `/var/tmp` `TMPDIR`. The full pipeline includes source/global/runtime checks; completed identical checks need not be repeated absent further changes.
- [x] Independent review checks designs for implementable state transitions, exact version compatibility, honest bounded replay storage, and no weakened uncertainty handling. Review tests for real current behavior rather than mocked future semantics. Record findings and scoped corrections with their actual test evidence.
- [x] Summarize checked commands/results and any limits. Keep future runtime acceptance cases in the design as pending implementation. Do not claim native live-provider behavior, deployed ownership proof, evidence reuse, selectable admitted deadlines, local proof recovery or retirement was implemented by this phase.

These tests intentionally pass on current production code. Future runtime work should add its own behavior-changing tests when the corresponding implementation scope is authorized; this phase does not manufacture a red test by demanding an API that does not exist.

## Implemented baseline names

These exact names map the completed test additions to this plan. The checks establish current behavior and offline release consistency; they do not claim future runtime acceptance or live-host validation.

| ID | Test name |
| --- | --- |
| C1 | current review mode requires every unit gate before completing |
| C2 | current normalization rejects gate-free review units |
| C3 | current global gate associations can demand evidence for a gate that never closes |
| C4 | current default deadline expires at exactly five minutes even with unbounded budgets |
| C5 | current deadline authority captures construction options and detaches returned records |
| C6 | current declared failure permits only a fresh task and child in the same run |
| C7 | current correlated malformed result fails locally after clean scope checks |
| C8 | current missing trusted command proof interrupts previously registered runs too |
| C9 | current accepted global runs retain their orchestration ledger slots |
| C10 | current global ledger keys include parent but its 128 slots are shared |
| C11 | current accepted global history still forbids child reuse in a fresh run |
| C12 | current declared-file proof misses an undeclared input that changes actual command behavior |

## Final verification record

On October 31, 2026, the three affected suites passed all 151 tests, including twelve new characterizations. Formatting, ESLint, typecheck, build and generated-output checks passed. The parent then ran the complete `npm test` pipeline with a private mode-0700 `/var/tmp` fixture root: exit 0, including source/portable validators, both runtime suites and global validation/tests. Platform-specific Darwin cases were skipped on Linux as expected.

`npm pack --dry-run --json` passed with the unchanged 71-file package inventory. Shared references remain included and source-only renderer tooling remains excluded. Independent review found no important issues in the designs or tests; diff review confirmed that production TypeScript and JavaScript were unchanged. Only the three test sources, two existing generated compatibility test outputs and three design documents changed.

Local diagnostic logs: `/tmp/runtime-characterization-tests.log` and `/tmp/opencode-refactor-final-qa.log`. These logs are supporting evidence, not shipped runtime authority. No runtime activation, provider access, installation or publication was performed.
