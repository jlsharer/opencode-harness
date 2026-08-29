# Bootstrap Derived-Evidence Extra-Property Regression

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-016-bootstrap-extra-test`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-remediate-bootstrap-extra-018`
- scopeKey: `standalone-bootstrap-derived-extra-test`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved validator finding, exact contract-test and trace targets, one derived-evidence closure regression requirement, preservation constraints, and the assigned Node test command.
- Required context present: Yes; the fresh packet was contract-complete for implementer `implementation` mode.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Added exactly one named test with one assertion. It constructs otherwise complete derived evidence through the existing evidence/context helper, adds `undeclaredEvidenceField`, resolves the actual package evidence definition through `schemaRegistry` and `schemaRef`, and calls the package's exported `validateSchemaInstance` validator. The assertion requires an `E_SCHEMA_UNEVALUATED_PROPERTY` error at `/undeclaredEvidenceField`.
- Files read: Approved validator artifact; contract test; package schema validator; actual `common.schema.json`; role I/O contract; trace schema; trace template.
- Files changed: `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`; this trace artifact.
- Commands/checks: `node --test test/nba2k27-myplayer/contracts.test.mjs` from `/tmp/opencode/nba2k27-myplayer`.

## Output Contract

- Outputs: Added test `schema rejects arbitrary extra properties on complete derived evidence`; all production, schema, fixture, package, dependency, downstream, live/network, Git, and harness files were preserved.
- Evidence: The assigned suite passed with 25 tests, 25 passed, 0 failed, 0 skipped. The previous 24 tests remain passing.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-015-bootstrap-final.md`; this artifact.
- changedFiles: `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-016-bootstrap-extra-test.md`.
- rationale: Durably covers the sole validator-identified B4 omission without changing production behavior.
- schemaOrBoundaryChoices: The package has no `validateSchemaDocument` export; its actual schema-document validation path is the exported `validateSchemaInstance` function used by the existing tests and named by the approved validator remediation. The test uses that function with the actual schema registry and `common.schema.json#/$defs/evidence`, and checks the specific closed-union error path rather than inspecting schema source text.
- commandsRun: `node --test test/nba2k27-myplayer/contracts.test.mjs` — PASS, 25/25.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-016-bootstrap-extra-test.md`.

## Handoff

- Next role: Independent validator for the final contract-suite and B4 artifact proof.
- Limitations: Self-check evidence is not independent acceptance evidence. No focused name-pattern command was assigned or run.
- Risks: The supplied phrase `validateSchemaDocument` does not correspond to an export in the read-only package implementation; the regression therefore uses the actual exported validator required by the approved validator finding.
- Handoff notes: Re-run the full suite and confirm the exact new test name, 25 total passes, and the `/undeclaredEvidenceField` closure error through the actual schema registry.
