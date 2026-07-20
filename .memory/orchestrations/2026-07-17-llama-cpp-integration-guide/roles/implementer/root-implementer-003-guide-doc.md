# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-17-llama-cpp-integration-guide
- role: implementer
- artifactId: root-implementer-003-guide-doc
- createdAt: 2026-07-17
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: approved documentation-only task, exact allowed paths, guide requirements, research URLs to cite, preservation requirements, and self-check expectations.
- Required context present: orchestration ID, artifact ID, allowed edit scope, non-goals, memory protocol, role contract, trace template, and routing metadata instruction.
- Routing metadata status: routingMetadataStatus: absent; no caller-supplied routing labels were present.

## Work Performed

- Summary: added the llama.cpp integration guide as a delegation-orchestrator reference, added one reference bullet to the skill, and created the orchestration index and implementer trace artifact.
- Files read: `.opencode/skills/delegation-orchestrator/SKILL.md`, `.memory/templates/role-trace-artifact.md`, `.memory/templates/orchestration-index.md`, `.opencode/contracts/role-io-contracts.json`.
- Files changed: `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`, `.opencode/skills/delegation-orchestrator/SKILL.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/INDEX.md`, `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-003-guide-doc.md`.
- Commands/checks: attempted `python`/`rg` self-checks but those commands were unavailable in this shell; used Grep tool searches for required strings; ran `node` self-check for required guide strings and ASCII-only content with result `missing: []`, `nonAsciiCount: 0`, `guideLines: 270`; ran `git status --short` and observed unrelated pre-existing workspace changes plus the intended guide changes; full validation deferred to validator.

## Output Contract

- Outputs: documentation-only guide, single skill reference bullet, orchestration memory index, and implementer trace artifact.
- Evidence: Grep tool searches and the passing Node self-check verified required strings and ASCII-only guide content.
- Artifact links: `.memory/orchestrations/2026-07-17-llama-cpp-integration-guide/roles/implementer/root-implementer-003-guide-doc.md`.

## Handoff

- Next role: validator.
- Limitations: did not run full harness validation by instruction; guide content is based on supplied research URLs and requirements, not fresh web fetches.
- Risks: final acceptance depends on validator confirming coverage, allowed scope, and no runtime behavior changes.
