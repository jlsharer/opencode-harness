# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-18-subagent-model-routing-guarantee
- role: implementer
- artifactId: root-implementer-006-native-provider-allowlist
- createdAt: 2026-07-18
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Fix provider availability logic so known native OpenCode providers are not falsely rejected while custom `llamacpp` still requires merged native `cfg.provider` config.
- Required context present: orchestration id, target paths, allowed edit scope, behavior requirements, preservation requirements, and verification commands were supplied.
- Routing metadata status: absent

## Work Performed

- Summary: Added a small documented native provider allowlist, preserved disabled/enabled provider checks for all providers, kept custom providers fail-closed without `cfg.provider`, and extended validation cases for built-in and `llamacpp` behavior.
- Files read: `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/scripts/validate-harness.mjs`, `opencode-harness.design.md`, `.memory/protocols/memory-management.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.memory/templates/role-trace-artifact.md`, `.memory/orchestrations/2026-07-18-subagent-model-routing-guarantee/INDEX.md`, `.memory/INDEX.md`
- Files changed: `.opencode/plugin-modules/role-model-routing-enforcement.js`, `.opencode/scripts/validate-harness.mjs`, `opencode-harness.design.md`, `.memory/INDEX.md`, `.memory/orchestrations/2026-07-18-subagent-model-routing-guarantee/INDEX.md`, `.memory/orchestrations/2026-07-18-subagent-model-routing-guarantee/roles/implementer/root-implementer-006-native-provider-allowlist.md`
- Commands/checks: `node .opencode/scripts/validate-harness.mjs`; `node .opencode/routing/resolve-model-routing.mjs --metadata-json '{"command":"/delegate-implement"}'`; `git diff --check`

## Output Contract

- Outputs: Built-in allowlisted providers can be routed without committed `cfg.provider` entries when not disabled or excluded; custom `llamacpp` still fails without merged provider config and succeeds with it.
- Evidence: Validation exercises built-in success without `cfg.provider`, built-in disabled/excluded failures, and custom `llamacpp` absent/success cases offline.
- Artifact links: `.opencode/plugin-modules/role-model-routing-enforcement.js`; `.opencode/scripts/validate-harness.mjs`; `opencode-harness.design.md`

## Handoff

- Next role: integrator/validator
- Limitations: This is implementer self-check evidence only; final acceptance still requires validator evidence.
- Risks: The native provider allowlist is intentionally conservative; running OpenCode sessions must restart to load config-time plugin changes.
