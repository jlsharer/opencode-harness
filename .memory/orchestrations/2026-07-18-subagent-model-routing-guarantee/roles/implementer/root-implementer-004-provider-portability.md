# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-18-subagent-model-routing-guarantee
- role: implementer
- artifactId: root-implementer-004-provider-portability
- createdAt: 2026-07-18
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Implement minimal remediation for provider/model portability and fail-closed semantics in role model routing enforcement.
- Required context present: orchestration id, target paths, required behavior, preservation constraints, and verification commands were supplied.
- Routing metadata status: absent

## Work Performed

- Summary: Added native provider availability checks before applying non-null role model overrides, extended deterministic validation coverage for success and provider absent/disabled/excluded failures, and documented fail-closed provider requirements.
- Files read: `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/scripts/validate-harness.mjs`, `.opencode/routing/harness-model-routing.json`, `opencode-harness.design.md`, `.memory/protocols/memory-management.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`
- Files changed: `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/scripts/validate-harness.mjs`, `opencode-harness.design.md`, `.memory/INDEX.md`, `.memory/orchestrations/2026-07-18-subagent-model-routing-guarantee/INDEX.md`, `.memory/orchestrations/2026-07-18-subagent-model-routing-guarantee/roles/implementer/root-implementer-004-provider-portability.md`
- Commands/checks: `node .opencode/scripts/validate-harness.mjs`; `node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-implement"}'`; `git diff --check`

## Output Contract

- Outputs: Non-null routed role models now require matching, allowed native provider configuration before mutation; validation uses mock `llamacpp` provider for expected success and explicit fail-closed cases for unavailable providers.
- Evidence: The enforcement module throws explicit provider absent, `disabled_providers`, and `enabled_providers` exclusion errors that state fallback is refused; validation exercises all cases offline.
- Artifact links: `.opencode/plugin-modules/role-model-routing-enforcement.js`; `.opencode/scripts/validate-harness.mjs`; `opencode-harness.design.md`

## Handoff

- Next role: integrator/validator
- Limitations: This is implementer self-check evidence only; final acceptance still requires validator evidence.
- Risks: Existing non-null routed models will intentionally fail startup unless the corresponding native provider is configured in merged OpenCode config; running sessions must restart to load plugin changes.
