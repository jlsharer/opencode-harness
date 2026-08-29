# Bootstrap Contract Regression Test Remediation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-014-bootstrap-tests`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-remediate-bootstrap-tests-016`
- scopeKey: `standalone-bootstrap-test-remediation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved validator recheck, exact standalone test/fixture and trace targets, four schema-regression requirements, preservation constraints, style constraints, and the assigned Node test command.
- Required context present: Yes; the packet was contract-complete for implementer `implementation` mode.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Added ten deterministic `node:test` regressions using the committed dependency-free `validateSchemaInstance` implementation and references into the actual package schemas. Added small object helpers rather than new fixture files. Production schemas, domain modules, package metadata, and existing fixtures were not modified.
- Files read: Validator artifact `implementation-validator-013-bootstrap-recheck.md`; `contracts.test.mjs`; `common.schema.json`; `desired-build-request.schema.json`; `schema-validation.mjs`; valid synthetic request fixture; role contract; trace schema; trace template.
- Files changed: `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`; this trace artifact.
- Commands/checks: `node --test test/nba2k27-myplayer/contracts.test.mjs` from `/tmp/opencode/nba2k27-myplayer`; bounded `git diff --check` attempts for the two target roots.

## Regression Mapping

| Previously missing class | Named executable tests |
| --- | --- |
| Valid non-derived and derived evidence | `schema accepts complete non-derived evidence`; `schema accepts complete derived evidence` |
| Evidence union rejection boundaries | `schema rejects derived-only fields on non-derived evidence`; `schema rejects derived evidence missing required derived fields` |
| Conditional `allowedDisciplines` branches | `schema requires canonical nonempty allowedDisciplines for flexible resources`; `schema forbids allowedDisciplines for locked resources`; `schema forbids allowedDisciplines for unknown resources` |
| Canonical order and uniqueness | `allowedDisciplines rejects duplicate values and noncanonical order` |
| Current per-band tolerance contract | `request schema accepts complete canonical per-band nearTieTolerances` |
| Legacy tie-field closure | `request schema rejects legacy nearTieAbsolute and nearTieRelative properties` |

Both token-provenance and slot-discipline-lock conditional resources are exercised. Schema validation proves required/forbidden/nonempty/unique shape behavior; the existing semantic request validator proves canonical discipline ordering, because ordering is a package semantic invariant rather than a JSON Schema array-order keyword in the production schema.

## Output Contract

- Outputs: `changedFiles` comprises the standalone contract test and this trace; `rationale` is durable executable B4 coverage for evidence variants, conditional fields, and legacy tie fields; `schemaOrBoundaryChoices` use wrapper `$ref` schemas that resolve directly into committed package definitions while leaving production files unchanged.
- Evidence: Assigned command completed with 24 tests, 24 passed, 0 failed, 0 skipped. All prior 14 tests remain passing and ten focused tests were added.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-013-bootstrap-recheck.md`; this artifact.
- changedFiles: `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-014-bootstrap-tests.md`.
- commandsRun: `node --test test/nba2k27-myplayer/contracts.test.mjs` — PASS, 24/24 on both the initial and final post-edit runs.
- Additional command result: Harness-root `git diff --check` returned 0. The standalone-root attempt returned 129 because `/tmp/opencode/nba2k27-myplayer` is not a Git repository; no Git state was mutated and this was not an acceptance check.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-014-bootstrap-tests.md`.

## Handoff

- Next role: Independent validator to rerun the B4 coverage and acceptance checks.
- Limitations: Only the assigned test file and trace were changed; no fixture addition was necessary. No network, dependency installation, live system, Git mutation, or final validation was performed.
- Risks: No production mismatch was found. The new tests pass against current production contracts; independent validator evidence is still required before acceptance.
- Handoff notes: Recheck that the source-coverage probe now sees `source: "derived"`, `inputFieldIds`, both legacy property names, and executable conditional mutations, then rerun the assigned test suite.
