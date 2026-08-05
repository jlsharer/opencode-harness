# Superseding Final Acceptance Validation

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `validator`
- artifactId: `root-validator-022-accepted`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Prior validator trace `root-validator-020-final-acceptance`; current post-loop-3 artifact-verifier trace `portable-artifact-verifier-021-final-temp-install`; planner acceptance matrix A1-A13; current status/diff; source and portable validator commands; artifact trace/path, tree, hash, and cleanup verification requirements; acceptance standard; and no-implementation-edit boundary.
- Required context present: `orchestrationId`, changed files and current worktree state, prior command-backed implementation evidence, current artifact proof, verification criteria, commands, schema/trace contracts, expected warning posture, acceptance standard, and routing metadata status were present.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented.

## Work Performed

- Summary: Verified the new artifact-verifier trace exists at the required path, carries the required trace identity and sections, reports exact 47-file tree/43 managed plus four memory outputs, current hashes, independent negative and installed-profile evidence, and successful cleanup. Rechecked status/diff hygiene, reran both validators, compared current key implementation hashes with the artifact evidence, and independently confirmed the temporary root remains absent. Reused the unchanged implementation gates from validator trace 020 and superseded its provisional non-acceptance now that AV2 passes.
- Files read: `root-validator-020-final-acceptance.md`; `portable-artifact-verifier-021-final-temp-install.md`; orchestration index; current source/portable validation surfaces through executed validators.
- Files changed: This superseding validator trace only. No implementation file was edited.
- Commands: Seven shell invocations containing ten command clauses/processes: combined status/diff checks; portable validator; source validator; three SHA-256 checks; temporary-root absence assertion; one initial trace-content probe with shell backtick-substitution warnings; and a correctly quoted repeat of the trace-content probe. The initial probe's shell warnings are not acceptance evidence; the corrected probe passed every field.

## Output Contract

- Outputs: Superseding pass/fail matrix, artifact/path/schema findings, unchanged-worktree evidence, limitations, remediation status, explicit acceptance decision, and handoff.
- Evidence: Prior validator implementation evidence at `root-validator-020-final-acceptance.md`; current independent generated-artifact evidence at `portable-artifact-verifier-021-final-temp-install.md`; current validator outputs and hashes recorded below.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/validator/root-validator-022-accepted.md`; `.memory/orchestrations/2026-08-04-harness-portability/roles/validator/root-validator-020-final-acceptance.md`; `.memory/orchestrations/2026-08-04-harness-portability/roles/artifact-verifier/portable-artifact-verifier-021-final-temp-install.md`.

### Superseding Gate Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| A1 Syntax | PASS | Trace 020: four syntax checks exited 0. No implementation change detected. |
| A2 Routing | PASS | Trace 020: 36/36 full and 4/4 focused negatives. AV2 independently reran installed routing 36/36. |
| A3 Foreign bootstrap | PASS | Trace 020: E2E 15/15. AV2 independently proved fresh, partial, idempotent, collision, overwrite, and capability paths. |
| A4 Portable profile | PASS | Portable validator passed again in this reassessment; AV2 passed root, nested, and partial installed validation. |
| A5 Neutral resolver | PASS | Trace 020 and AV2 agree: implementer, null local identity/URL/concurrency, unenforced, no network. |
| A6 Local resolver | PASS | Trace 020 and AV2 agree on advisory Qwen model/catalog/URL/max-in-flight, unenforced, no network. |
| A7 Current independent artifact proof | PASS | AV2 is post-loop-3, exact and current: 47 files = 43 managed + four memory, 43/43 and 4/4 hash matches, stable aggregate digest, cleanup `exists:false`. |
| A8 Destination independence | PASS | AV2 confirms source roots, source manifest, root config/ignore, and orchestration history absent from fresh target. |
| A9 Reference scrub | PASS | Portable validator passed again; trace 020 negative drive/UNC/reference probes remain applicable. |
| A10 Trace alignment | PASS | Both validators pass; AV2 identity/path and required Input, Work, Output, and Handoff sections were directly verified. |
| A11 Source QA | PASS | `OpenCode harness validation passed` in this reassessment. |
| A12 Diff hygiene/no later implementation change | PASS | `git diff --check` silent; tracked diff remains the same 15 implementation/source files and `281 insertions, 99 deletions`; only orchestration evidence was added since trace 020. Current key hashes exactly match AV2. |
| A13 Restart handoff | PASS | Full OpenCode quit/restart remains explicitly required and is not treated as validation evidence. |

### Current Command and Artifact Evidence

- Portable validator: `Portable OpenCode harness validation passed` with the expected `MODULE_TYPELESS_PACKAGE_JSON` warning.
- Source validator: `OpenCode harness validation passed` with the expected typeless-package warning.
- Current hashes exactly match AV2 line 107:
  - manifest: `113ebad3386defb368c2d52c45cc0b3416992cc75caaa65a8ce0b79cdb6207ad`
  - bootstrap: `c1d5430989081e42c2244c61067f9830b8a166be370d78bf6ec22bd62264a5ff`
  - installed validator: `0e2f04ccb96b41518c115cb94e9173b64e57c6b3af7d0122717f14ef3152e3ac`
- AV2 exact aggregate digest and idempotence before/after digest: `95a8deecab9f9d6a8b41b958da01ab37bd608335625ab61ac42df1bce2066bcf`.
- AV2 cleanup path `/tmp/opencode/harness-portability-av-final-iXpV8Y` was independently asserted absent with exit 0.
- Correctly quoted trace probe returned `true` for required path identity, orchestration ID, role, artifact ID, Input/Work/Output/Handoff sections, exact-tree section, digest, and successful-cleanup evidence.
- AV2 reports no implementation edits and records cleanup from 69 descendant directories/143 files to `exists:false`.

### Schema, Security, and Activation Findings

- Trace/path verification: AV2 is located under the exact role/path contract and contains the schema-required conceptual fields through its metadata and four contract sections.
- Exact installed tree, source/destination hashes, memory non-overwrite, managed collision refusal, explicit managed overwrite, capability fail-before-publication, all-parent preflight, no source roots/history, neutral/local plugin behavior, and cleanup all pass independently.
- No new implementation change or diff-hygiene defect was detected after trace 020. Current validators and AV2 key hashes bind acceptance to the inspected implementation.
- Implicit source routing remains unavailable because the ignored private custom override is invalid. This remains an expected fail-closed limitation and is not pass evidence.
- Hooks remain guardrails only. Acceptance rests on validator and artifact-verifier command evidence.
- Activation still requires fully quitting and restarting OpenCode.

### Remediation List

- No implementation remediation remains.
- Administrative follow-up: an authorized role should link validator traces 020/022 and artifact-verifier trace 021 from the orchestration index and mark V1, AV2, and the acceptance decision complete. Validator permissions do not allow that index edit.

### Acceptance Decision

- **PASS — FINAL ACCEPTANCE GRANTED.** All planner gates A1-A13 now pass. The only blocker in trace 020 was missing current AV2 evidence; trace 021 supplies valid post-loop-3 exact tree/hash/cleanup proof, and current diff, validators, key hashes, and cleanup state remain consistent with it.
- This trace supersedes the provisional `FAIL / NOT ACCEPTED YET` decision in `root-validator-020-final-acceptance.md`.

## Handoff

- Next role: Orchestrator or authorized integrator for index/decision bookkeeping, then full OpenCode restart before operational activation.
- Limitations: Validation ran on Linux and selected `/proc/self/fd`; `/dev/fd` was not independently selected. Live OpenCode restart, provider transport, routing-service endpoint, network request, model execution, separate-filesystem behavior, process-kill cleanup, and whole-install transactionality after successful preflight were not exercised. AV2 discloses and corrects one initial nested-root invocation mistake and one shell-wrapper variable mistake; both required probes were rerun successfully. This reassessment's first trace-content probe emitted shell backtick-substitution warnings and was repeated correctly.
- Risks: Process interruption after successful publication begins may leave empty directories, temporary/probe files, or a partial installation. The ignored private custom remains invalid and intentionally blocks implicit source routing until operator repair. These are documented residual operational risks, not acceptance blockers.
