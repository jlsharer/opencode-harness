# NBA 2K27 Standalone Bootstrap Contracts Implementation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-010-bootstrap-contracts`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Fresh contract-complete implementation packet `dt-impl-bootstrap-012` for scope `standalone-bootstrap-contracts`, with four approved plan/review artifacts, exact standalone and trace targets, bounded edit scope, schema requirements, preservation rules, verification commands, style constraints, and handoff requirements.
- Required context present: Yes. The final plan review passed, the packet explicitly selected standalone placement at `/tmp/opencode/nba2k27-myplayer`, `dispatchKind` is `fresh`, and `taskMode` is `implementation`.
- Routing metadata status: `absent`; no routing values or labels were invented.

## Work Performed

- Summary: Created the standalone dependency-free Node 24 ESM package. Added four public Draft 2020-12 contracts plus a shared definitions schema, canonical vocabulary/provenance/tri-state requirement/semantic validation modules, two synthetic request fixtures, and an offline contract test suite. The implementation contains no optimizer, oracle, renderer, adapter, network, credentials, live command, or hidden game formula.
- Files read: The four supplied approved plan/review artifacts; `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `/tmp/opencode` and the orchestration role directory.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/package.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/common.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/build-observation.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/desired-build-request.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/experiment-manifest.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/schemas/optimization-report.schema.json`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/vocabulary.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/provenance.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/requirements.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/domain/validation.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/request-user-state-valid.json`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/fixtures/synthetic/request-user-state-invalid.json`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/contracts.test.mjs`
  - This trace artifact.
- Commands/checks:
  - Created only the assigned standalone and implementer trace directories after checking their parents.
  - `node --check` for each of `vocabulary.mjs`, `provenance.mjs`, `requirements.mjs`, and `validation.mjs`: PASS, no output.
  - `node --test test/nba2k27-myplayer/contracts.test.mjs`: PASS, 10 tests, 0 failures.
  - `node --version && npm test`: Node `v24.14.1`; PASS, 10 tests, 0 failures.
  - Python `jsonschema` Draft 2020-12 schema meta-check plus valid request fixture validation: PASS.
  - Python `jsonschema` validation that the semantic-invalid fixture remains structurally valid: PASS.

## Output Contract

- Outputs: Standalone package and closed schema/domain bootstrap suitable for downstream optimizer, replay/manual capture, and report work units without coupling those work units to the harness repository.
- Evidence: Node syntax checks pass; all JSON parses; Draft 2020-12 meta-checks pass; the complete valid fixture passes the request schema; the invalid fixture passes structure but returns the two normative semantic diagnostics in exact order and shape; tri-state, false-first partition, static Synergy, context hashing/comparison, vocabulary, conditional discipline, and tolerance-band tests pass.
- Artifact links: This artifact; the four approved plan/review artifacts supplied in the packet.

### Rationale and Schema/Boundary Choices

- `common.schema.json` centralizes canonical IDs, exact known/unknown values, the closed derived/non-derived evidence union, context binding, explicit units, recursive requirement expressions, and exact diagnostics. The four named root schemas remain independently identified public contracts and reference this shared vocabulary.
- Every record root and discriminated union member is closed. Dynamic canonical-key maps are the only deliberate map boundaries. Known facts reject `null`; unknown facts require a reason, context, and explicit evidence-reference array.
- Request progression arrays are all required; empty means no supplied facts, not known absence. Typed token, slot, loadout, Synergy, Cap Breaker, animation, and Takeover records remain context/evidence bound.
- `allowedDisciplines` is declared and conditionally required only for known flexible token provenance or slot locks; semantic validation mirrors the schema condition deterministically.
- Synergy exposes availability, legality, and `activationThreshold`; its predicate contract supports only `available`, `legal`, and `activation-threshold-known`, never inferred current activation.
- Hard results use exhaustive false-before-unknown classification. Split hard and soft unknown policy fields and lower-integer priority bands are encoded in the request; per-band near-tie tolerances replace legacy scalar tolerances.
- Report Pareto entries are schema-limited to hard-feasible candidates, decisions are closed, `no-feasible` forbids feasible/unknown/Pareto entries, and non-winner decisions forbid a selected candidate.
- No static value claims a mutable token cost, badge threshold, cap, OVR, Synergy trigger, or progression formula.

### Exact Downstream Exports

- `domain/vocabulary.mjs`: `DISCIPLINES`, `BADGE_TIERS`, `MECHANIC_TERMS`, `DEFAULT_ALIASES`, `CANONICAL_ID_PATTERN`, `normalizeDisplayTerm`, `isCanonicalId`, `resolveCanonicalTerm`, `compareBadgeTiers`.
- `domain/provenance.mjs`: `canonicalJson`, `contentId`, `known`, `unknown`, `isKnown`, `compareContextBindings`, `contextSatisfiesPolicy`, `evidenceIsUsable`.
- `domain/requirements.mjs`: `TRI_TRUE`, `TRI_FALSE`, `TRI_UNKNOWN`, `evaluateRequirement`, `classifyHardResults`, `evaluateSynergyAvailability`.
- `domain/validation.mjs`: `validateDesiredBuildRequest`, `assertValidDesiredBuildRequest`.
- Schema entry points: `build-observation.schema.json`, `desired-build-request.schema.json`, `experiment-manifest.schema.json`, and `optimization-report.schema.json`; shared references resolve through `common.schema.json` in the same directory.

## Handoff

- Next role: Parent orchestrator, then fresh independent validator work. Three downstream implementation units may consume the exact exports above without modifying these contracts except through an explicitly scoped remediation/integration packet.
- Limitations: This bootstrap intentionally provides semantic checks only for the currently executable deterministic diagnostics and boundaries; it is not a general-purpose JSON Schema runtime and does not implement every future cross-record contradiction from the complete plan. Python `jsonschema` was used only as an environment self-check and is not a package dependency. No optimizer, oracle, report renderer, UI/live adapter, CLI, network component, or migration is present.
- Risks: Downstream work must preserve exact context keys and cannot generalize observed costs or thresholds. Additional semantic contradictions, report cross-array identity checks, and optimizer outcome proofs remain downstream responsibilities and require independent validation.

### Required implementer output fields

- changedFiles: Listed under Work Performed.
- rationale: Rationale and Schema/Boundary Choices above.
- schemaOrBoundaryChoices: Rationale and Schema/Boundary Choices above.
- commandsRun: Commands/checks above.
- handoffNotes: Handoff above.
- knownLimitations: Handoff limitations above.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-010-bootstrap-contracts.md`
