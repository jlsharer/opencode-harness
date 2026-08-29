# Implementer Trace Artifact: Oracle and Report Remediation

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `implementer`
- artifactId: `implementation-implementer-025-oracles-remediation`
- createdAt: `2026-08-21`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- taskMode: `implementation`

## Input Contract

- Inputs received: Fresh implementation packet `dt-remediate-oracles-reports-027`, validator artifact `implementation-validator-022-oracles-reports`, exact oracle/normalization/report/test paths, four remediation requirements, preservation constraints, and executable checks.
- Required context present: Yes. Implementation workspace was `/tmp/opencode/nba2k27-myplayer`; runtime/trace environment variables were absent, so the project-relative trace path was used.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Remediated all four validator findings with construction-time replay binding, immutable binding-local manual supersession, current-capture evidence provenance, and report-local winner semantics. Added regressions for the adversarial reproductions, duplicate IDs, and attempted supersession cycles.
- Files read: Validator trace, assigned modules/tests/fixture, shared schemas and validators (read-only), optimizer Pareto semantics (read-only), role contract, trace schema, and memory protocol.
- Files changed:
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/replay-oracle.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/oracle/manual-capture-oracle.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/capture/normalize-observation.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/report/render-json.mjs`
  - `/tmp/opencode/nba2k27-myplayer/src/nba2k27-myplayer/report/render-markdown.mjs`
  - `/tmp/opencode/nba2k27-myplayer/test/nba2k27-myplayer/oracles-reports.test.mjs`
  - `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-025-oracles-remediation.md`
- Commands:
  - `node --check` for the five changed source modules: exit 0, no output.
  - `node --test test/nba2k27-myplayer/oracles-reports.test.mjs`: exit 0; 9 passed, 0 failed/skipped.
  - `node --test test/nba2k27-myplayer/contracts.test.mjs test/nba2k27-myplayer/oracles-reports.test.mjs`: exit 0; 34 passed, 0 failed/skipped.

## Output Contract

- Outputs: Seven changed files: five implementation modules, one focused test module, and this trace artifact. No fixture bytes or shared contracts were changed.
- Evidence: Assigned oracle/report suite passes 9/9; combined contract and oracle/report suites pass 34/34; changed modules pass syntax checks.
- Artifact links:
  - `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/implementer/implementation-implementer-025-oracles-remediation.md`

### Finding-to-Change Map

1. Replay binding bypass: `replay-oracle.mjs` validates each replicate before assigning fixture state. It recomputes the complete candidate hash, compares canonical candidate value, recomputes complete context/version hashes, compares canonical context, and requires replay mode. Tests independently mutate candidate value, context, version, and mode.
2. Cross-context supersession: `manual-capture-oracle.mjs` requires globally unique observation IDs, an existing same candidate/context/version target, and an acyclic predecessor walk. Active IDs are now computed only from records in the requested binding. Tests cover duplicate IDs, attempted cycle closure, and cross-binding rejection.
3. Provenance injection: `normalize-observation.mjs` derives admissible evidence refs from current source artifact hashes, recursively rejects unrelated supplied refs for known and unknown facts, and reconstructs top-level known-fact provenance from current capture options. Tests cover forged known and unknown refs.
4. Manufactured winner: `render-json.mjs` adds branch-local semantic checks requiring exactly one selected confirmed finalist, no near-tie flags, a unique tolerance-separated band-vector leader, and confidence dominance over every other Pareto candidate. `render-markdown.mjs` uses the validated winner fields for winner language and limits near-tie language to the declared decision and stop reason. Tests reject the validator's invalid winner shape and accept/render a fully proved winner.

### Schema and Boundary Choices

- Shared JSON schemas and shared domain validation were preserved read-only. Stronger winner checks are composed in the report branch after structural and shared semantic validation.
- Evidence ownership uses the existing deterministic `evidence-<sha256 suffix>` identity established by `evidenceIdentity`; no new schema field or dependency was introduced.
- Manual import remains append-only. Unique IDs plus existing-target-only edges make cycles unconstructable, with an explicit predecessor walk retained as a fail-closed invariant.
- Replay validation occurs against a local clone before `this.fixture` or `this.entries` is stored, preserving replicate order and deterministic cloning.

## Handoff

- Next role: Independent validator for the remediated oracle/report gate.
- Limitations: This was bounded implementation self-verification, not independent acceptance validation. No live/network action, optimizer/UI edit, shared-contract edit, fixture rewrite, Git operation, or harness change was performed.
- Risks: Report winner checks deliberately fail closed on incomplete/misaligned band/tolerance vectors and on any confirmed or near-tie ambiguity. A validator should rerun the four adversarial probes in addition to the assigned suites.
