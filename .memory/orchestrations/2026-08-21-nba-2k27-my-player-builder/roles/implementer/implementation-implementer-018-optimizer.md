# Standalone Optimizer Core Implementation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-018-optimizer`
- createdAt: `2026-08-21`
- taskMode: `implementation`
- delegationTaskId: `dt-impl-optimizer-020`
- scopeKey: `standalone-optimizer-core`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh implementation packet naming the accepted planner chain and bootstrap proof; optimizer directory, focused test, and this trace as the only writable paths; exact cache, proposal, feasibility, scoring, Pareto, confidence, stopping, confirmation, and preservation requirements; and five required verification commands.
- Required context present: Yes. `dispatchKind` is `fresh`, `taskMode` is `implementation`, all target paths and boundaries are explicit, and the accepted shared domain/contracts package exists under the standalone workspace.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Implemented a dependency-free pure optimizer core over the accepted shared provenance, requirement, vocabulary, request-validation, and report-validation boundaries. Added exact-context content addressing, immutable append-only cache helpers, deterministic deduplication and seeded proposal order, interpretable non-certifying feasibility hints, one-field threshold and coupling-gated pairwise sensitivity helpers, false-first hard partitioning and dispositions, normalized ascending-priority band scoring, full-preference Pareto sorting, per-band near ties, five-component confidence dominance, deterministic stopping, injected-oracle querying and finalist confirmation, and side-effect-free replay manifests. Added focused offline tests for all packet-required behaviors.
- Files read: The four supplied plan/acceptance artifacts; shared `domain/provenance.mjs`, `requirements.mjs`, `validation.mjs`, `vocabulary.mjs`, and `schema-validation.mjs`; all shared schema paths relevant to the optimizer contract; package metadata; existing contract tests; role I/O contract; trace schema; memory protocol; trace template.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/cache.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/feasibility.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/propose.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/sensitivity.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/objectives.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/pareto.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/optimizer/run.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/optimizer.test.mjs`
  - `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-018-optimizer.md`
- Commands/checks:
  - Required syntax checks for `cache.mjs`, `objectives.mjs`, `pareto.mjs`, and `run.mjs`: exit 0, no output.
  - Additional syntax checks for `feasibility.mjs`, `propose.mjs`, and `sensitivity.mjs`: exit 0, no output.
  - `node --test test/nba2k27-myplayer/optimizer.test.mjs`: exit 0; 11 tests passed, 0 failed/skipped.
  - Shared regression plus optimizer suite: exit 0; 36 tests passed, 0 failed/skipped.

## Output Contract

- Outputs: Seven optimizer modules, one focused test suite, and this implementation trace.
- Evidence: All assigned checks pass. Tests prove exact-context version isolation, duplicate query suppression, deterministic input-order-independent seeded proposals, non-certifying unobserved feasibility hints, bounded sensitivity generation, all hard memberships/dispositions including false-over-unknown, ascending lexicographic priority behavior, denominator-preserving soft unknown penalties, full-vector Pareto preservation, unrounded zero/positive-floor near-tie behavior, complete confidence dominance, deterministic stopping, injected finalist confirmation, and stable side-effect-free manifests. The accepted 25-test contract suite also remains green.
- Artifact links: This trace; `root-planner-003-agentic-workflow.md`; `root-planner-006-plan-remediation.md`; `root-planner-008-contract-correction.md`; `implementation-validator-017-bootstrap-acceptance.md`.
- changedFiles: The nine files listed under Work Performed; no shared domain/schema/package/fixture or other branch path was edited.
- rationale: Keep optimizer mechanics decomposed into acyclic pure modules so later integration can import cache/proposal/objective/Pareto helpers independently and inject an oracle without giving the core filesystem, network, environment, or global-state capabilities.
- schemaOrBoundaryChoices: Cache contexts require all nine version/platform/parser/vocabulary/progression partition fields and hash the complete supplied context plus candidate. Candidate feasibility is certified only by exact observed classification. Hard results reuse shared tri-state constants and false-first classifier. Run orchestration defaults to shared semantic request validation and always applies shared report membership validation; structural schema validation remains the upstream contract boundary. Pareto dimensions are individual unrounded preference utilities plus optional minimize-cost dimensions, never weighted aggregate bands. Confidence remains separate from score and tie membership.
- commandsRun: Required four-module syntax chain passed; three additional module syntax checks passed; focused optimizer tests passed 11/11; combined shared and optimizer tests passed 36/36.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-018-optimizer.md`.

## Export Surface

- `cache.mjs`: `assertExactContext`, `contextContentId`, `candidateContentId`, `exactCacheKey`/`createCacheKey`, `deduplicateCandidates`, `createCacheRecord`, `appendCacheRecord`, `lookupExactObservations`, `lookupExactObservation`, `cacheManifest`.
- `feasibility.mjs`: `createFeasibilityHint`, `hintFeasibility`.
- `propose.mjs`: `createSeededRandom`, `seededProposalOrder`, `proposalManifest`.
- `sensitivity.mjs`: `boundaryProposals`, `sensitivityProposals`, `pairwiseSensitivityProposals`.
- `objectives.mjs`: `HARD_DISPOSITIONS`, `partitionHardCandidates`, `applyHardUnknownDisposition`, `scoreFeasibleCandidate`, `compareBandVectors`.
- `pareto.mjs`: `CONFIDENCE_COMPONENTS`, `paretoDominates`, `paretoFront`, `nonDominatedSort`, `confidenceDominates`, `vectorsAreNearTie`, `classifyNearTies`.
- `run.mjs`: `evaluateStopping`, `confirmFinalists`, `runOptimization`.

## Handoff

- Next role: Fresh independent `validator` in `validation` or `artifact-proof` mode for optimizer acceptance; later public-index/report/oracle wiring requires a separately scoped integration task.
- Limitations: No oracle implementation, renderer, CLI, public index, filesystem persistence adapter, schema/domain edit, or live capability was added. `runOptimization` assumes upstream structural schema validation; its default shared validator enforces existing semantic request diagnostics, and `validateContracts:false` exists only for focused low-level tests. Winner eligibility requires exact input and critical-output hashes from the injected confirmation callback; absent confirmation remains `insufficient-evidence`.
- Risks: Consumer adapters must supply complete exact contexts and must not weaken cache partition fields. They must map optimizer internals into the closed full report schema in the later report scope rather than treating this core result as rendered report JSON. Observation-pause actions remain an explicit returned request and require an approved outer adapter; the optimizer never performs them itself.
- handoffNotes: Preserve the shared 25-test bootstrap suite. Integration should export these modules without introducing import cycles, pass schema-validated requests, provide deterministic `now` and oracle callbacks where replay stability matters, persist returned manifests outside the core, and count outer confirmation calls against approved budgets. Independent validator evidence is still required before acceptance.
