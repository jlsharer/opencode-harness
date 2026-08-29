# Bootstrap Contract Remediation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-012-bootstrap-remediation`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-remediate-bootstrap-014`
- scopeKey: `standalone-bootstrap-contracts-remediation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: A contract-complete fresh implementation packet naming the failed bootstrap proof, normative planner correction, exact standalone schema/domain/test/fixture paths, B1-B4 remediation requirements, preservation constraints, and six verification commands.
- Required context present: Yes. The packet selected `implementation`, constrained edits to existing bootstrap paths plus one dependency-free schema validator and this trace, and prohibited delegation and activation surfaces.
- Routing metadata status: `absent`; no routing values or labels were invented.

## Work Performed

- Summary: Replaced affected generic progression facts with closed typed fact definitions, enforced full static activation-threshold structure, added context/version/unit/tolerance/report semantics, implemented an explicit dependency-free JSON Schema subset validator, and expanded executable adversarial fixtures/tests.
- Files read: The two approved-plan artifacts; role contract and trace schema; all five package schemas; four existing domain modules; existing contract test and two fixtures.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/common.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/desired-build-request.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/build-observation.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/optimization-report.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/requirements.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/validation.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/schema-validation.mjs` (new)
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/request-context-invalid.json` (new)
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/report-membership-invalid.json` (new)
  - This trace artifact.
- Commands:
  - `node --check src/nba2k27-myplayer/domain/vocabulary.mjs`
  - `node --check src/nba2k27-myplayer/domain/provenance.mjs`
  - `node --check src/nba2k27-myplayer/domain/requirements.mjs`
  - `node --check src/nba2k27-myplayer/domain/validation.mjs`
  - `node --check src/nba2k27-myplayer/domain/schema-validation.mjs`
  - `node --test test/nba2k27-myplayer/contracts.test.mjs`

## Blocker Mapping

| Validator blocker | Changed boundary | Passing proof |
| --- | --- | --- |
| B1 typed facts and threshold | `common.schema.json`, request/observation schemas, `requirements.mjs` | Typed invalid provenance/unit values and incomplete known thresholds are rejected; complete canonical thresholds alone establish threshold-known. |
| B2 context/version/unit reuse | `requirements.mjs`, `validation.mjs`, context fixture | Missing/incompatible measurement units return unknown; exact request version policy and all recursive `contextRef` values are checked. |
| B3 tolerance/report coherence | request/report schemas, `validation.mjs`, report fixture | Duplicate/missing/extra/nonascending tolerance priorities, noncanonical disciplines, hard-set overlap/count mismatch, and nonfeasible Pareto/winner membership are rejected. |
| B4 executable schema/adversarial proof | `schema-validation.mjs`, fixtures, contract test | Tests execute local-reference schema validation and cover typed facts, closure, conditionals, unsupported-keyword fail-closed behavior, threshold shape, context reuse, tolerance duplicates, units, and report sets. |

## Schema and Boundary Choices

- Typed facts remain exact known/unknown unions. Known values now use explicit booleans, canonical IDs, disciplines/locks, provenance/source enums, exact-unit quantities, requirement trees, Cap Breaker allocations, or the complete observed-threshold object as appropriate.
- Requirement comparisons accept only a known `{unit,value}` measurement whose unit exactly equals the requirement unit; no conversion or default is inferred.
- Request semantic validation supplements JSON Schema where cross-node equality, canonical vocabulary order, and exact priority-set coverage cannot be expressed by the selected subset.
- Report semantic validation treats the union of the three hard sets as the evaluated candidate inventory and requires disjoint membership, `candidateCount` equality, and feasible-only Pareto/winner references.
- The schema validator intentionally supports only the keywords used by these schemas: local `$ref`, core primitive/object/array constraints, bounds/pattern/date-time format, combinators/conditionals, property-name checks, and used closure forms. It preflights every supplied schema document and fails closed on an unsupported keyword; it does not claim general Draft 2020-12 conformance.

## Exported API Contracts

- `validateSchemaInstance(instance, rootSchema, schemas?) -> {valid, errors}` and `assertSchemaInstance(...)` from `domain/schema-validation.mjs`; callers supply the local schema registry and receive deterministically sorted errors.
- `SUPPORTED_SCHEMA_KEYWORDS` documents the intentionally bounded executable subset.
- `validateDesiredBuildRequest(request)` / `assertValidDesiredBuildRequest(request)` now enforce exact version/context, canonical discipline order, and exact tolerance coverage in addition to retained diagnostics.
- `validateOptimizationReport(report)` / `assertValidOptimizationReport(report)` enforce candidate partition and feasible-only downstream membership.
- `evaluateRequirement(expression, resolveFact)` requires exact matching measurement units for threshold/range facts.
- `evaluateSynergyAvailability(pair, "activation-threshold-known")` returns true only for a closed complete canonical observed threshold.

## Output Contract

- Outputs: The changed files above, rationale, schema/boundary choices, command results, exported API handoff, and B1-B4 mapping.
- Evidence: All five assigned syntax checks exited 0. The assigned Node test command completed with 14 tests, 14 passed, 0 failed.
- Artifact links: This artifact; `roles/validator/implementation-validator-011-bootstrap-proof.md`; `roles/planner/root-planner-008-contract-correction.md` within this orchestration.
- changedFiles: Listed under Work Performed.
- rationale: Close the four independently reproduced acceptance gaps without dependencies, activation code, or schema weakening.
- schemaOrBoundaryChoices: Listed above.
- commandsRun: Listed above; final results were exit 0.
- handoffNotes: Downstream branches should consume the exported validators rather than duplicate context, unit, tolerance, or report-partition logic.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-012-bootstrap-remediation.md`.

## Handoff

- Next role: Fresh independent validator for the remediated bootstrap gate.
- Limitations: The JSON Schema engine is deliberately package-specific and bounded, and report cross-set invariants are semantic API checks rather than claims that JSON Schema alone expresses them. No optimizer, renderer, adapter, CLI, network, live command, or activation component was added.
- Risks: New schema keywords must be added deliberately to the preflight allowlist and implementation before use. Downstream callers must run both structural schema validation and the applicable semantic validator.
