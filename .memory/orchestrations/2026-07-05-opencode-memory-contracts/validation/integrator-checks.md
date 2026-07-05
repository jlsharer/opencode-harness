# Integrator Checks

## Metadata

- orchestrationId: `2026-07-05-opencode-memory-contracts`
- role: `integrator`
- artifactId: `integrator-checks`
- createdAt: `2026-07-05`

## Commands

- `node .opencode/scripts/validate-harness.mjs` - passed with `OpenCode harness validation passed`.
- `node --check .opencode/plugins/index.js` - passed with no output.
- `node --check .opencode/plugin-modules/harness-lifecycle.js` - passed with no output.
- JSON parse for `opencode.json`, `.opencode/harness.manifest.json`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, and `.opencode/routing/harness-model-routing.json` - passed.
- Dynamic import check for `.opencode/plugins/index.js` default export - passed with `plugin default export passed`.
- `.agents`/`.codex` scan across `opencode.json`, `.opencode`, `.memory`, `AGENTS.md`, and `opencode-harness.design.md` - matches were reference-material notes in root docs and command records in validation memory; no runtime dependency matches appeared in `opencode.json` or `.opencode`.
- Routing label scan across `.opencode`, `.memory`, `AGENTS.md`, and `opencode-harness.design.md` - required labels were present in delegation, workflow, command, routing, memory, and validation surfaces; current orchestration memory records routing metadata as absent.
- `git diff --check` - passed with no output.

## Integration Evidence

- `.memory/INDEX.md` indexes static memory files and current orchestration trace/evidence artifacts.
- `.memory/references/opencode-refs.md` includes retrieval date `2026-07-05`, official OpenCode documentation URLs, and short descriptions.
- All eight role agents reference the memory protocol, role I/O catalog, trace schema, and role-specific trace path convention.
- `.opencode/contracts/role-io-contracts.json` includes all eight required role names with input, output, trace artifact, and verification expectation sections.
- `.opencode/plugins/index.js` remains the only auto-loaded plugin file and is a pure adapter importing `.opencode/plugin-modules/harness-lifecycle.js`; `opencode.json` has no local plugin path.
- `.opencode/harness.manifest.json` lists static harness-owned artifacts only and does not list dynamic orchestration memory or prior projection paths.

## Limitations

- These are integrator checks, not final validator acceptance.
- Runtime plugin discovery still requires OpenCode restart or reload in a live client.
