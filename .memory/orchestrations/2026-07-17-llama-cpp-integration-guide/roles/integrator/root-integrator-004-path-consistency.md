# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-17-llama-cpp-integration-guide
- role: integrator
- artifactId: root-integrator-004-path-consistency
- createdAt: 2026-07-17
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: changed artifacts, expected skill reference path relationship, manifest/workflow expectations, routing metadata preservation requirement, known documentation-only risks, and allowed edit scope.
- Required context present: orchestration ID, artifact ID, target paths, memory protocol, role I/O contract, trace schema, and allowed integration-fix scope were present.
- Routing metadata status: routingMetadataStatus: absent; no caller-supplied routing labels were present.

## Work Performed

- Summary: inspected guide, skill reference, orchestration index, and implementer trace for path consistency, reference-only posture, routing metadata handling, and runtime/config boundary alignment; applied one small wording fix and indexed this integrator artifact.
- Files read: `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`, `.opencode/skills/delegation-orchestrator/SKILL.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/INDEX.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-003-guide-doc.md`, `.memory/templates/role-trace-artifact.md`.
- Files changed: `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/INDEX.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/integrator/root-integrator-004-path-consistency.md`.
- Commands/checks: Glob checks for reference and role artifact paths; Grep checks for guide/runtime/routing references and absent routing metadata; targeted Node existence/content check passed after one quoting-sensitive attempt failed; `node .opencode/scripts/validate-harness.mjs` returned a pre-existing index coverage failure for `2026-07-16-harness-design-inspection/roles/integrator/local-integrator-014-local-ai-consistency.md`; `git diff -- <target paths>` reviewed intended scoped differences.

## Output Contract

- Outputs: path consistency notes, manifest coverage notes, cross-file issue assessment, fixes applied, residual risks, and trace artifact path.
- Evidence: skill bullet points to existing `references/llama-cpp-integration-guide.md`; guide states it is reference guidance and does not change runtime behavior; `INDEX.md` and implementer trace both record `routingMetadataStatus: absent`; validation failure is outside this orchestration's allowed scope.
- Artifact links: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/integrator/root-integrator-004-path-consistency.md`.

## Handoff

- Next role: validator.
- Limitations: did not replace validator acceptance evidence; full harness validation is currently blocked by an unrelated pre-existing memory index coverage issue outside this task scope.
- Risks: final acceptance still requires validator evidence; guide contains local provider examples that must remain user/operator guidance and not be interpreted as committed `opencode.json` policy.
