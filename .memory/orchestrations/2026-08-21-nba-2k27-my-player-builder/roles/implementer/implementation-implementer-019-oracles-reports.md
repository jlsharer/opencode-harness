# Standalone Oracles and Reports Implementation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-019-oracles-reports`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-impl-oracles-reports-021`
- scopeKey: `standalone-oracles-reports`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh implementation packet naming four approved-plan artifacts, six source targets, the replay-fixture and focused-test targets, this trace target, oracle/normalization/report schema requirements, strict preservation boundaries, seven verification commands, focused coverage requirements, and handoff fields.
- Required context present: Yes. `dispatchKind` is `fresh`; selected `taskMode` is `implementation`; the standalone bootstrap contract gate is accepted; edits were limited to the assigned standalone oracle, capture, report, replay fixture, focused test, and this trace.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Implemented dependency-free replay and manual-capture oracle capabilities only; exact candidate/context/version hashing; deterministic replicate replay; deterministic manual worksheets; evidence hashing; append-only correction-by-supersession; pure BuildObservation normalization and schema validation; structurally and semantically validated canonical JSON reports; and Markdown generated only from validated report JSON. Added a synthetic two-replicate replay fixture and five focused tests covering every requested behavior.
- Files read: The four supplied approved-plan/acceptance artifacts; role contract; trace schema/template; memory protocol; standalone package metadata; all shared schemas; schema/provenance/semantic validators; existing contract tests; and relevant synthetic fixtures. Shared contracts remained read-only.
- Files changed:
  - `src/nba2k27-myplayer/oracle/oracle.mjs`
  - `src/nba2k27-myplayer/oracle/replay-oracle.mjs`
  - `src/nba2k27-myplayer/oracle/manual-capture-oracle.mjs`
  - `src/nba2k27-myplayer/capture/normalize-observation.mjs`
  - `src/nba2k27-myplayer/report/render-json.mjs`
  - `src/nba2k27-myplayer/report/render-markdown.mjs`
  - `test/nba2k27-myplayer/fixtures/replay/baseline.json`
  - `test/nba2k27-myplayer/oracles-reports.test.mjs`
  - this trace artifact
- Commands/checks:
  - Ran all six assigned `node --check` commands: exit 0, no output.
  - Ran `node --test test/nba2k27-myplayer/oracles-reports.test.mjs`: exit 0; 5 passed, 0 failed/skipped/cancelled/todo.
  - Ran compatibility check `node --test test/nba2k27-myplayer/contracts.test.mjs test/nba2k27-myplayer/oracles-reports.test.mjs`: exit 0; 30 passed, 0 failed/skipped/cancelled/todo.

## Output Contract

- Outputs: Eight standalone product/test files plus this trace. Exports include `ORACLE_MODES`, `assertCompleteCandidate`, candidate/context/version hash helpers, `oracleCapabilities`, `assertOracle`, `ReplayOracle`, `ManualCaptureOracle`, `normalizeObservation`, evidence identity and observation validation/assertion helpers, report validation/assertion and `renderJson`, and `renderMarkdown`.
- Evidence: Focused tests prove exact replay mismatch rejection, ordered duplicate replicates, deterministic worksheets, immutable supersession history, unknown preservation, content-hashed evidence references, actual BuildObservation schema acceptance, semantic report rejection, stable canonical JSON/Markdown, and near-tie rendering without a fabricated winner. The existing 25 bootstrap contract tests remain passing.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-019-oracles-reports.md`; `test/nba2k27-myplayer/fixtures/replay/baseline.json`; `test/nba2k27-myplayer/oracles-reports.test.mjs`.

## Schema and Boundary Choices

- Oracle capability objects are closed by construction to `replay` and `manual-capture`, with `live`, `hostAccess`, and `networkAccess` fixed false. Oracle modules import no filesystem, process, network, host, or external package surface.
- Replay fixture format is `replay-oracle-fixture-1` with one exact `context`, stored `contextHash` and `versionHash`, and ordered entries `{candidate,candidateHash,replicates}`. Every replicate is validated against the shared BuildObservation schema; same-candidate replicates are retained in fixture order rather than deduplicated.
- A complete candidate requires explicit `position` and nonempty `body` and `attributes` JSON objects. Hash comparison also checks canonical-byte equality, so hash lookup cannot excuse a non-exact candidate object.
- Manual imports bind observations to the planned candidate and exact context/version, derive a canonical evidence ID plus SHA-256 source artifact hash, validate the resulting shared BuildObservation, append records, and select current observations by supersession links without mutating history.
- Missing, null, or explicitly ambiguous critical values normalize to `UnknownValue`; no cap, OVR, cost, Synergy, badge, or other hidden formula is derived. Existing explicit facts retain their raw evidence/context when valid under the shared schema.
- JSON rendering first applies the actual shared Draft 2020-12-subset validator and shared semantic report validator, then emits canonical JSON. Markdown accepts only that validated report object and reads no side-channel candidate data. Confidence fields are lexically ordered to remain stable after canonical JSON round trips.

## Handoff

- Next role: Parent should dispatch a fresh independent `validator` for this scoped work unit before acceptance or integration.
- Limitations: This unit does not implement optimizer scoring, Pareto or near-tie mathematics, report decision construction, UI/live adapters, persistence, file loading, CLI wiring, or host/network behavior. Report renderers validate and present an already constructed shared report; upstream optimizer code remains responsible for producing mathematically correct band, Pareto, confidence, and tie values. Manual evidence is structured in-memory input; storage/retention is outside this scope.
- Risks: The shared schema intentionally permits generic facts for some observation fields, so semantic meaning still depends on upstream typed capture contracts. Supersession is in-memory and append-only only for the lifetime of a `ManualCaptureOracle` instance. Independent validator evidence is still required.
- Integration assumptions: A later integration unit may export these modules from the package public index or wire them to a CLI; this implementation does not edit either path. Callers supply already parsed fixture/evidence JSON and exact context bindings. No timestamp is generated; `observedAt` and every volatile value must be explicitly supplied.

### Required implementer output fields

- changedFiles: Files changed list above.
- rationale: Work Performed summary and Schema and Boundary Choices.
- schemaOrBoundaryChoices: Schema and Boundary Choices section.
- commandsRun: Commands/checks section.
- handoffNotes: Handoff section.
- knownLimitations: Handoff limitations and risks.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-019-oracles-reports.md`.
