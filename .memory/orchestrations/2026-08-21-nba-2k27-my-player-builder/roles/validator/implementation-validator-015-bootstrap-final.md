# Standalone Bootstrap Final Artifact Proof

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-015-bootstrap-final`
- createdAt: `2026-08-21`
- taskMode: `artifact-proof`
- delegationTaskId: `dt-revalidate-bootstrap-tests-017`
- scopeKey: `standalone-bootstrap-final-proof`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- acceptance decision: **FAIL — gate-bootstrap-contracts remains blocked by one incomplete committed B4 regression**

## Input Contract

- Inputs received: Contract-complete fresh validator packet naming the changed contract test, actual schema/validator contracts, prior bootstrap recheck, five verification criteria, commands, risks, skipped-check policy, and terminal acceptance standard.
- Required context present: Yes. All validator-required fields were supplied; `dispatchKind` is `fresh` and `taskMode` is `artifact-proof`.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Independently ran the complete and focused suites, inspected all ten new named tests, executed actual-schema acceptance/rejection probes, reran representative B1-B3 behavior probes, resolved the schema graph, and checked the complete standalone inventory for prohibited behavior. No target or production file was modified.
- Files read: Changed contract test; all five schemas; schema, request/report, requirement, and provenance validators; package metadata; synthetic fixtures; prior validator artifact `implementation-validator-013-bootstrap-recheck.md`; implementer artifact `implementation-implementer-014-bootstrap-tests.md`; role I/O contract; trace schema.
- Files changed: This validator trace artifact only.
- Commands: Full 24-test suite; focused ten-test name-pattern suite; actual-schema evidence probe; corrected source-coverage probe; B1-B3 direct probe; schema graph walker; prohibited inventory/package probe; and a terminal evidence-regression completeness probe.

## Pass/Fail Gate Matrix

| Gate | Result | Command-backed evidence |
| --- | --- | --- |
| Full suite and prior regressions | PASS | `node --test test/nba2k27-myplayer/contracts.test.mjs` reported 24 tests, 24 passed, 0 failed/skipped/todo. The prior 14 named tests and ten additions all executed successfully. |
| Focused remediated tests | PASS | Exact name-pattern execution reported 10 tests, 10 passed, 0 failed. |
| Actual schema/validator path | PASS | Independent probe loaded five committed schema documents, confirmed common/request `$id` values, and called `validateSchemaInstance` through real `common.schema.json#/$defs/evidence` references. Valid non-derived and derived values passed; non-derived derived-only fields, missing derived fields, and an independently probed derived extra field failed. |
| `allowedDisciplines` branches | PASS | Named tests cover flexible, locked, unknown, duplicate, and noncanonical cases for both token and slot resources. Flexible/locked/unknown/duplicate shape checks use `validateSchemaInstance`; canonical ordering uses the package semantic validator, matching the production split. |
| Per-band tolerances and legacy fields | PASS | A complete two-band canonical tolerance request passes both schema and semantic validation. Both `nearTieAbsolute` and `nearTieRelative` are rejected through the actual request schema. |
| B1 typed facts/static threshold | PASS | Direct probe rejected malformed token provenance/unit facts and returned `false` for malformed known activation-threshold shape. |
| B2 context/version/units | PASS | Direct probe returned `unknown` for a unit mismatch and produced `E_CONTEXT_REF_MISMATCH`, `E_GAME_VERSION_POLICY`, and `E_SCHEMA_VERSION` on representative mutations. |
| B3 ordering/tolerances/report partition | PASS | Direct probe produced `E_ALLOWED_DISCIPLINES_ORDER` and `E_NEAR_TIE_BAND_COVERAGE`, all four normative report-membership codes, and the expected outcomes for all five hard-result vectors. |
| Schema graph | PASS | Walker parsed 5 schemas and resolved 305 references with `failures:[]`; every document declared Draft 2020-12. |
| Security/scope/activation | PASS | Recursive no-follow inventory found 16 files, zero symlinks, no dependency sections, and no network/process/environment/dependency-tree behavior matches. Package remains private ESM. |
| B4 complete committed evidence regression | **FAIL** | Terminal source probe exited 1: the actual evidence-test block has four validator calls and covers non-derived extras plus both missing-derived-field variants, but `derivedArbitraryExtraCase:false`. Current production rejects that probe, yet no committed named test preserves the required derived-member extra-property rejection from the supplied prior remediation contract. |

## Exact Added Test Proof

The focused command executed these ten names, all passing:

1. `schema accepts complete non-derived evidence`
2. `schema accepts complete derived evidence`
3. `schema rejects derived-only fields on non-derived evidence`
4. `schema rejects derived evidence missing required derived fields`
5. `schema requires canonical nonempty allowedDisciplines for flexible resources`
6. `schema forbids allowedDisciplines for locked resources`
7. `schema forbids allowedDisciplines for unknown resources`
8. `allowedDisciplines rejects duplicate values and noncanonical order`
9. `request schema accepts complete canonical per-band nearTieTolerances`
10. `request schema rejects legacy nearTieAbsolute and nearTieRelative properties`

The corrected source probe reported `namedTests:10`, `validatorCalls:19`, `derivedPayloads:3`, `inputFieldIds:5`, both legacy names present twice, and both token/slot definition references present. This demonstrates executable validator use rather than text-only schema inspection, but does not cure the missing derived-extra committed case.

## B1-B4 Status

- **B1 PASS:** typed known facts and static activation-threshold behavior remain command-proved.
- **B2 PASS:** recursive context binding, version policy, schema version, and typed-unit behavior remain command-proved.
- **B3 PASS:** canonical discipline ordering, exact tolerance coverage, report membership, and hard partition remain command-proved.
- **B4 FAIL:** all ten added tests pass and cover the main requested classes, but the supplied prior remediation contract also required extra-property rejection for either evidence member. Only the non-derived member has committed extra-field coverage. The derived member's additional-property rejection succeeds only in the independent one-off probe.

## Command Outputs

1. Full suite: exit 0; 24/24 pass, 0 fail, 0 skipped.
2. Focused exact-name suite: exit 0; 10/10 selected tests pass; 14 nonmatching tests were not selected by the command.
3. Actual-schema evidence probe: exit 0; canonical common/request schema IDs confirmed; all five expected acceptance/rejection outcomes were `true`, including current derived-extra rejection.
4. Corrected source proof: exit 0; ten names present and executable validator/reference markers present (`validatorCalls:19`).
5. B1-B3 direct probe: exit 0; all representative assertions passed and emitted the expected B1-B3 codes/states.
6. Prohibited inventory: exit 0; `fileCount:16`, `symlinks:0`, `prohibitedBehaviorMatches:[]`, private ESM, no dependency sections.
7. Schema walker: exit 0; `schemas:5`, `refs:305`, `failures:[]`.
8. Terminal committed-coverage probe: exit 1 with `actualValidatorCalls:4`, `nonDerivedExtraCase:true`, `derivedMissingBothCases:true`, `derivedArbitraryExtraCase:false`. This is the blocking acceptance evidence.
9. One preliminary count assertion used incorrect hard-coded occurrence totals and exited 1. It was superseded by the corrected bounded source probe in item 4 and is not acceptance evidence.

## Schema Results

- PASS: actual package schema IDs and local `$ref` resolution are exercised, not mocked schema copies.
- PASS: valid complete non-derived and derived evidence variants are accepted.
- PASS: non-derived evidence with derived-only fields and derived evidence missing either required field are rejected by committed tests.
- PASS behavior only: derived evidence with an arbitrary extra property is rejected by current production schema/validator.
- **FAIL durability:** that derived-extra rejection has no committed named regression despite being required by the supplied prior B4 remediation list.
- PASS: flexible, locked, unknown, duplicate, and ordering cases cover both token and slot facts across schema and semantic boundaries.
- PASS: complete canonical per-band tolerances are accepted and both legacy scalar tie fields are schema-rejected.

## Security and Activation Findings

- PASS: no production, downstream, dependency, network/live, Git, or harness file was changed by this validator; only this required trace artifact was written.
- PASS: scoped package inventory remains 16 regular files with no symlinks, generated dependency tree, dependency declarations, or prohibited network/process/environment behavior.
- PASS: no optimizer, oracle, CLI, UI, adapter, provider, auth, publication, or live-game activation surface is present.
- No Git mutation command, network call, external install, live operation, publication, or activation was performed.
- Restart/activation is not applicable to this standalone offline contract package.

## Remediation List

The declared remediation budget is exhausted, so no fix was made. The sole unmet item is:

1. Add a committed `validateSchemaInstance` assertion that a complete derived evidence object with an arbitrary additional property is invalid, then rerun the full and focused suites.

No production/schema/domain remediation is indicated: current production already rejects this mutation.

## Skipped Checks and Residual Risk

- No required offline check was skipped.
- Live/network/provider/auth/external-install/publication checks remained out of scope as directed.
- No expected warnings were supplied.
- Residual behavior risk is low because the independent probe confirms current rejection. Acceptance risk remains blocking because the exact derived-member closure behavior is not durably committed and can regress without failing the suite.

## Output Contract

- Outputs: Final FAIL matrix; exact test names/counts; B1-B4 status; command outputs; schema results; security/activation findings; exhausted-budget remediation list; skipped-check statement; and downstream handoff.
- Evidence: Every passing behavior gate and the sole blocking B4 finding are command-backed. The blocker is tied to the supplied prior remediation contract and final requirement that all committed regressions be present.
- Artifact links: This artifact; `implementation-validator-013-bootstrap-recheck.md`; `implementation-implementer-014-bootstrap-tests.md`.
- passFailMatrixOrFindings: Pass/Fail Gate Matrix and B1-B4 Status above.
- commandOutputs: Command Outputs above.
- schemaResults: Schema Results above.
- securityAndActivationFindings: Security and Activation Findings above.
- remediationList: Remediation List above.
- artifactProof: Full and focused suite outputs reproduce the implemented coverage; the exit-1 terminal source probe reproduces the remaining committed-regression omission while the direct actual-schema probe proves production behavior is not being hidden.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-015-bootstrap-final.md`.

## Handoff

- Next role: Parent orchestrator for terminal synthesis. Do not accept `gate-bootstrap-contracts` or begin downstream implementation on this result.
- Limitations: The standalone root has no independent version-control baseline in this scoped proof, so production non-drift is supported by the caller-supplied changed-file boundary, closed 16-file inventory, and direct production behavior checks rather than a repository diff. The custom validator was assessed only against its declared subset.
- Risks: One required evidence-union closure regression remains absent after remediation cycle 2 of 2; no further leaf remediation is authorized.
