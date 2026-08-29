# Optimizer Validation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-021-optimizer`
- createdAt: `2026-08-21`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- taskMode: `validation`
- acceptance decision: **FAIL — gate-optimizer blocked**

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-validate-optimizer-023` for the optimizer directory and optimizer test, including six verification criteria, commands, schema contracts, risks, skip policy, and acceptance standard.
- Required context present: Yes; all validator-required packet fields were supplied. Expected warnings were not supplied.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Independently checked all seven optimizer modules, ran the assigned test, inspected imports and package inventory, and executed adversarial probes for cache isolation, hard-result ordering, priority reversal, Pareto alternatives, near-tie boundaries, surrogate non-certification, duplicate suppression, deterministic proposals/sensitivity, contract validation, and oracle budgets.
- Files read: optimizer modules under `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/`; assigned test; desired-request and optimization-report schemas; `common.schema.json`; package metadata; relevant domain validation, schema-validation, requirements, and provenance modules; validator contract and trace schema.
- Files changed: This trace artifact only; no implementation or test file was modified.
- Commands/checks:
  - `for file in src/nba2k27-myplayer/optimizer/*.mjs; do node --check "$file" || exit 1; done`
  - `node --test test/nba2k27-myplayer/optimizer.test.mjs`
  - Inline Node assertion probe covering context collision, mixed hard vectors, priority reversal, Pareto alternatives, zero/outside near-tie boundaries, surrogate non-certification, and duplicates.
  - Inline Node deterministic proposal and sensitivity probe.
  - Inline Node `runOptimization` budget probe with `maxOracleQueries: 1`.
  - Inline Node schema probes using `validateSchemaInstance` for desired requests and generated optimization results.
  - Static import and forbidden-surface searches plus a global-key import probe.

## Pass/Fail Matrix

| Gate | Result | Independent evidence |
| --- | --- | --- |
| Exact-context cache isolation and duplicate suppression | PASS | Every context field is hashed with the complete candidate; adversarial changed-context lookup missed, nested candidate change altered the key, and duplicate content collapsed. |
| Hard false-first partition and unknown dispositions | PASS | Mixed `[unknown, false]` classified rejected; assigned disposition assertions passed; scoring is restricted to the feasible partition. |
| Ascending priority bands and visible soft-unknown penalties | PASS | Lexicographic high-band probe defeated a perfect lower band; assigned test preserved `unknown-penalty` contributions. |
| Full-vector Pareto and per-band near ties | PASS | Trade-off alternatives remained non-dominated; exact-zero and outside-boundary probes passed across all supplied bands without rounding. |
| Seeded proposal/sensitivity determinism and non-certifying hints | PASS | Reordered proposal input produced the same seeded sequence; repeated sensitivity outputs matched; unobserved nearest-neighbor hint remained uncertified. |
| Stopping and finalist confirmation respect oracle budgets | **FAIL (F2)** | With injected `maxOracleQueries: 1`, one evaluation was followed by one confirmation: output was `{oracleCalls:2, reportedEvaluationQueries:1, configuredMax:1, decision:"winner", confirmations:1}`. Confirmation calls bypass query accounting and the budget gate. |
| Desired-request and optimization-report schema contracts | **FAIL (F1)** | A schema-invalid request was accepted by `assertValidDesiredBuildRequest`; generated output failed the supplied report schema with 42 errors. |
| No forbidden side effects/imports/dependencies | PASS | Imports are local domain/optimizer modules plus `node:crypto`; package has no dependencies; forbidden network/UI/report/filesystem/global search found none; importing all optimizer modules added zero global keys. |

## Command Outputs

- Syntax: PASS, all seven assigned optimizer `.mjs` files; no output.
- Assigned test: PASS, 11/11 tests, 0 failed/skipped/todo.
- Adversarial invariant probe: all seven reported checks PASS.
- Determinism probe: seeded proposals and sensitivity deterministic; pairwise sensitivity required observed coupling.
- Budget probe: FAIL as a gate; two oracle calls occurred under an injected budget of one while only the evaluation was reported.
- Desired-request contract probe: semantic validator accepted the object while JSON Schema rejected it for missing required fields including `assumptions`, `hardConstraints`, optimization budgets, and user-state members.
- Optimization-report contract probe: `valid:false`, 42 errors. Representative errors: missing `budgets`, `context`, `diagnostics`, `evidenceRefs`, `manifestHash`, and `nearTieTolerances`; forbidden `budget`, `contextId`, `confirmations`, and `manifest`; candidate shape also diverged.
- Target Git inspection was unavailable because `/tmp/opencode/nba2k27-myplayer` is not a Git worktree. Scoped inventory and source/import inspection completed independently instead.

## Schema Results

- `desired-build-request.schema.json`: **FAIL activation/coherence**. `runOptimization(validateContracts:true)` calls only the semantic validator, not the supplied JSON Schema validator. The semantic validator accepts instances missing schema-required structure.
- `optimization-report.schema.json`: **FAIL generated-output conformance**. `buildResult` emits an internal result shape rather than the contracted report shape, and `assertValidOptimizationReport` performs only a few semantic set checks.
- Domain hard-result semantics: PASS for exhaustive partition membership in the exercised scope.
- Validator role contract and trace schema: PASS; this artifact contains the required metadata, input, work, output, and handoff sections.

## Security and Activation Findings

- No optimizer import reaches oracle/report/UI/network or filesystem modules; no external dependency is declared.
- No module-import global mutation was observed.
- Oracle authority remains callback-injected, and feasibility hints did not certify unobserved candidates.
- **Activation blocker:** enabling default contract validation does not enforce the supplied JSON Schema contracts.
- **Safety/budget blocker:** finalist confirmation can perform oracle actions after the configured query budget is exhausted and those actions are omitted from reported query usage.
- Live/oracle integration was out of scope and was not used; all evidence came from injected offline callbacks.

## Remediation List

1. Enforce the complete desired-request JSON Schema at the `validateContracts:true` boundary, then retain semantic validation for cross-field rules.
2. Emit an `OptimizationReport` conforming exactly to `optimization-report.schema.json` (or explicitly revise the authoritative schema through the owning contract process); validate the complete generated object, not only set membership.
3. Charge every oracle callback, including confirmation and diagnostic confirmation, against the same query budget; check remaining budget before each call and report total oracle usage consistently.
4. Add committed regression tests reproducing F1 and F2, including diagnostic-confirmation budget exhaustion.

## Output Contract

- Outputs: FAIL matrix with two command-backed blocking findings, schema/security results, and bounded remediation.
- Evidence: Assigned tests pass, but independent schema and budget probes directly violate supplied acceptance gates; partial completion is not accepted.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-021-optimizer.md`
- Skipped checks: None of the required offline checks. Live emulator, app, network, and real-oracle activation were explicitly out of scope.
- Residual risk: Near-tie combination semantics depend on the owning contract's intended relationship between absolute and relative tolerances; no defect was asserted because the packet did not define an OR/AND rule and exercised boundaries passed.

## Handoff

- Next role: Parent orchestrator for a fresh bounded implementer remediation task, followed by independent validator recheck.
- Limitations: Target is not a Git worktree, so no target diff metadata was available; validation was bounded to the supplied changed paths and contracts.
- Risks: Contract-invalid inputs/outputs can cross the optimizer boundary, and configured oracle limits can be exceeded during finalist confirmation.
