# OpenCode Harness Validation Workflow

Use this workflow before accepting generated OpenCode harness assets.

## Required Checks

1. Confirm required root files and `.opencode/` files exist.
2. Parse JSON files: `opencode.json`, `.opencode/routing/harness-model-routing.json`, and `.opencode/harness.manifest.json`.
3. Parse `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, and `.opencode/schemas/memory-trace-artifact.schema.json`.
4. Confirm static `.memory` files exist: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`.
5. Check agent frontmatter for `description`, `mode: subagent`, and `permission`.
6. Check each agent references the memory protocol, role contract catalog, trace schema, and trace artifact path convention.
7. Check command frontmatter for `description` and `agent`, and verify `model` is absent.
8. Run the routing resolver for representative command, role, complexity, explicit model, and local metadata inputs.
9. Confirm `.opencode/plugins/index.js` is the only auto-loaded plugin file, is a pure adapter with a default export that imports `.opencode/plugin-modules/harness-lifecycle.js`, and that `opencode.json` does not list local plugin paths.
10. Run `node .opencode/scripts/validate-harness.mjs`.
11. Scan for secrets, provider tokens, user auth paths, and unintended prior-projection runtime references.
12. Report pass/fail evidence, trace artifact paths, and remediation needs.

## Acceptance Rule

Validator evidence must be explicit and command-backed where possible. Generated artifact proof should include a temp directory, copied artifact tree or listing, parse/render/check results, and cleanup decision when artifact validation is in scope.
