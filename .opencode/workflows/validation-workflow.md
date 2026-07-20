# OpenCode Harness Validation Workflow

Use this workflow before accepting generated OpenCode harness assets.

## Required Checks

1. Confirm required root files and `.opencode/` files exist.
2. Parse JSON files: `opencode.json`, the deterministic `.opencode/routing/harness-model-routing.example.json`, and `.opencode/harness.manifest.json`. The optional ignored `.opencode/routing/harness-model-routing.json` is not an acceptance input.
3. Parse `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, and `.opencode/schemas/harness-model-routing.schema.json`. Treat the dependency-free manual routing normalizer—not an absent schema engine—as executable semantic validation.
4. Confirm static `.memory` files exist: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`.
5. Check agent frontmatter for `description`, `mode: subagent`, and `permission`.
6. Check each agent references the memory protocol, role contract catalog, trace schema, and trace artifact path convention.
7. Check command frontmatter for `description` and `agent`, and verify `model` is absent.
8. Run routing policy unit tests and representative resolver/helper/plugin cases without network calls. Prove implicit custom-first/example fallback with no merge, fail-closed present-invalid custom behavior, exact explicit paths, actionable absent-both errors, nested plugin discovery, and clean example-only startup with no mutation. Prove committed force-false decisions remain advisory; prove synthetic force mode covers all eight fixed roles and fails atomically on native agent/provider/model/baseURL incoherence.
9. Confirm native provider transport remains outside committed `opencode.json`, endpoint budgets are cooperative and grouped by canonical URL, and provider/model/catalog identities are explicitly illustrative.
10. Confirm `.opencode/plugins/index.js` is the only auto-loaded plugin file, is a pure adapter with a default export that imports segmented modules, and that `opencode.json` does not list local plugin paths. Lifecycle behavior is telemetry only.
11. Render both named Compose projects from temporary private env copies. Require a digest-pinned image, unique loopback ports, an existing absolute read-only model bind with host-path creation disabled, and no `container_name`, overriding `command`, secret, or generated committed output.
12. Confirm docs describe optional `cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json` customization, explicit-path validation, custom-first/no-merge/fail-closed selection, `OPENCODE_CONFIG` as merging before project config, later `OPENCODE_CONFIG_CONTENT` without secret storage, full quit/restart config/plugin loading, static-versus-router behavior, deliberate asynchronous startup failure, and operator-dependent live/model/tool-use/benchmark gates.
13. Run `node .opencode/scripts/validate-harness.mjs`.
14. Scan for secrets, provider tokens, user auth paths, private model paths, non-native local routing keys in `opencode.json`, and unintended prior-projection runtime references.
15. Report pass/fail evidence, trace artifact paths, and remediation needs.

## Acceptance Rule

Validator evidence must be explicit and command-backed where possible. Generated artifact proof should include a temp directory, copied artifact tree or listing, parse/render/check results, and cleanup decision when artifact validation is in scope.
