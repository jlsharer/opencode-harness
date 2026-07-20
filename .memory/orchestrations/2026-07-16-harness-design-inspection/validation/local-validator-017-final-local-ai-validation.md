# Final Local AI Validation Evidence

## Metadata

- orchestrationId: `2026-07-16-harness-design-inspection`
- role: `validator`
- artifactId: `local-validator-017-final-local-ai-validation`
- createdAt: `2026-07-18T01:36:24Z`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- routingMetadataStatus: absent. Caller-supplied routing metadata labels were absent; no routing metadata values were invented.

## Input Summary

Independently validate final acceptance for remediated local AI integration changes. Required checks: run `node .opencode/scripts/validate-harness.mjs`; confirm `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md` is covered by both `.opencode/harness.manifest.json` and `STATIC_MANIFEST_PATHS`; confirm `opencode.json` remains free of local routing keys and endpoint details; confirm relevant role/validation artifacts are indexed; confirm no `.agents/` or `.codex/` runtime dependencies exist in `.opencode`; do not edit files except this validation artifact.

## Work Performed

- Read the delegation-orchestrator skill, delegation workflow, validation workflow, validator contract, trace schema, `opencode.json`, harness manifest, validator script static manifest path list, memory indexes, and prior local validation evidence.
- Ran the harness validation command before creating this artifact; it passed with only the known Node module-type warning.
- Created this requested validation artifact, then reran the harness validation command to test final workspace state.
- Checked manifest/static validation coverage for the llama.cpp guide.
- Checked committed `opencode.json` keys and searched for forbidden local routing metadata or endpoint details.
- Searched `.opencode` for runtime references to `.agents/` and `.codex/`.
- Checked top-level and orchestration memory indexes for relevant implementer, integrator, validator, and validation artifacts through remediation 016.

## Pass/Fail Matrix

| Check | Result | Evidence |
| --- | --- | --- |
| Harness validation before creating this artifact | PASS | `node .opencode/scripts/validate-harness.mjs` exited 0 and printed `OpenCode harness validation passed`; only warning was existing Node `MODULE_TYPELESS_PACKAGE_JSON` for `.opencode/plugins/index.js`. |
| Harness validation after creating this artifact | FAIL | Rerun failed because `.memory/INDEX.md` does not index `orchestrations/2026-07-16-harness-design-inspection/validation/local-validator-017-final-local-ai-validation.md`. This is caused by the requested creation of this new validation artifact without an allowed index-refresh edit. |
| llama.cpp guide in harness manifest | PASS | `.opencode/harness.manifest.json` contains `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md` as an `opencode-skill-reference`. |
| llama.cpp guide in `STATIC_MANIFEST_PATHS` | PASS | `.opencode/scripts/validate-harness.mjs` `STATIC_MANIFEST_PATHS` includes `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`. |
| `opencode.json` local routing/endpoint safety | PASS | Parsed `opencode.json` has only `$schema`, `instructions`, and `permission`; targeted check found no `harnessModelRouting`, `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`, `roleOverrides`, `commandOverrides`, or `complexityTiers`. |
| Relevant artifact indexing through remediation 016 | PASS | `.memory/INDEX.md` and the orchestration index reference `local-implementer-013-local-ai-integration`, `local-integrator-014-local-ai-consistency`, `local-validator-015-local-ai-validation`, `local-implementer-016-manifest-index-remediation`, and `root-validator-012-final-acceptance`/validation evidence. |
| Current artifact indexing | FAIL | This newly created artifact is not indexed in `.memory/INDEX.md` or the orchestration index because this validator was not authorized to edit indexes. |
| Prior-projection runtime dependency guard in `.opencode` | PASS | Targeted `.opencode` search for `.agents/` and `.codex/` references returned no matches. |
| Routing metadata preservation | PASS | Caller supplied no enriched routing metadata; this artifact records `routingMetadataStatus: absent` and does not invent routing values. |
| Lifecycle hook boundary | PASS | Validation evidence is command-backed; lifecycle hooks/plugins were not treated as the acceptance boundary. |

## Command Outputs

```text
$ node .opencode/scripts/validate-harness.mjs
OpenCode harness validation passed
(node:28828) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///home/joshl/projects/opencode-harness/.opencode/plugins/index.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /home/joshl/projects/opencode-harness/.opencode/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

```text
$ node -e "...manifest/opencode safety check..."
{
  "manifestHasGuide": true,
  "opencodeKeys": [
    "$schema",
    "instructions",
    "permission"
  ],
  "forbiddenKeysPresent": []
}
```

```text
$ grep-equivalent search under .opencode for `.agents/|.codex/|.agents\b|.codex\b`
No matches found.
```

```text
$ node .opencode/scripts/validate-harness.mjs
.memory/INDEX.md must index orchestration memory path: orchestrations/2026-07-16-harness-design-inspection/validation/local-validator-017-final-local-ai-validation.md
```

## Schema and Contract Results

- Validator output contract requirements satisfied by this evidence: pass/fail matrix, command outputs, schema/contract references, security and activation findings, remediation list, and artifact path.
- Trace schema and role contract paths were read and referenced. This artifact is Markdown validation evidence shaped to the project memory template rather than standalone JSON.

## Security and Activation Findings

- No committed local model endpoint, provider secret, or harness local routing metadata was found in `opencode.json`.
- The llama.cpp guide is manifest-owned reference material; local endpoint examples remain documentation/user-configuration guidance rather than repository defaults.
- No `.opencode` runtime dependency on `.agents/` or `.codex/` was found.
- Node module-type warning is non-blocking and pre-existing; it is not an acceptance failure.

## Limitations

- No live local endpoint/model health check was run because no endpoint/model details were supplied and validation is offline by default.
- This validator did not edit implementation/configuration/index files beyond creating this requested evidence artifact. The final validation command now fails until indexes include this artifact.

## Remediation List

- Required before final acceptance: add `.memory/orchestrations/2026-07-16-harness-design-inspection/validation/local-validator-017-final-local-ai-validation.md` to `.memory/INDEX.md` and `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md`, then rerun `node .opencode/scripts/validate-harness.mjs`.
- No remediation is required for llama.cpp guide manifest/static coverage, `opencode.json` local routing safety, or `.opencode` prior-projection runtime dependency checks.

## Handoff

- Output summary: Remediated local AI integration checks pass, but final workspace acceptance is blocked because this newly requested validation artifact is not yet indexed and `validate-harness` now fails on that index requirement.
- Artifact path: `.memory/orchestrations/2026-07-16-harness-design-inspection/validation/local-validator-017-final-local-ai-validation.md`
- Next role: implementer for scoped index refresh, then validator rerun.
