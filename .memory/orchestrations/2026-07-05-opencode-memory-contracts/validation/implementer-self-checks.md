# Implementer Self-Checks

## Metadata

- orchestrationId: `2026-07-05-opencode-memory-contracts`
- role: `implementer`
- artifactId: `implementer-self-checks`
- createdAt: `2026-07-05`

## Commands

- `node .opencode/scripts/validate-harness.mjs` - passed.
- `node --check .opencode/plugins/index.js` - passed.
- `node --check .opencode/plugin-modules/harness-lifecycle.js` - passed.
- JSON parse for `opencode.json`, `.opencode/harness.manifest.json`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, and `.opencode/schemas/memory-trace-artifact.schema.json` - passed.
- Dynamic import check for `.opencode/plugins/index.js` default export - passed.
- `rg -n "\.agents|\.codex" opencode.json .opencode .memory AGENTS.md opencode-harness.design.md` - matches root reference-material notes in `AGENTS.md` and `opencode-harness.design.md`, plus this self-check command record; no runtime dependency matches were found in `opencode.json` or `.opencode`.
- `rg -n "### Delegation Parameters|\*\*Provider Model\*\*|\*\*Routing Config\*\*|routingServiceUrl|localModelEnabled|preferLocal|localModelFallback" .opencode .memory` - labels found in delegation surfaces and routing implementation; current orchestration memory records caller metadata as absent.
- `git diff --check` - passed with no output.

## Limitations

- Runtime OpenCode plugin activation was not checked by restarting OpenCode; module syntax and default export were checked locally.
- Final acceptance still belongs to the validator role.
