# Local AI Integration Validation Evidence

## Metadata

- orchestrationId: `2026-07-16-harness-design-inspection`
- role: `validator`
- artifactId: `local-validator-015-local-ai-validation`
- createdAt: `2026-07-18T01:28:50Z`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- routingMetadataStatus: absent. Caller-supplied routing metadata labels were absent; no routing metadata values were invented.

## Input Summary

Validate local AI integration support changes reported by implementer, including `.opencode/scripts/validate-harness.mjs`, `.opencode/workflows/validation-workflow.md`, `opencode-harness.design.md`, the llama.cpp guide, memory indexes, and implementer trace evidence. Required checks included running `node .opencode/scripts/validate-harness.mjs`, inspecting artifacts for validator gate/schema/contract references, and confirming committed `opencode.json` has no non-native local routing keys or local endpoint details.

## Work Performed

- Read delegation and validation workflows, role contract catalog, trace schema, `opencode.json`, implementation trace, validation script, llama.cpp guide, design document, and memory indexes.
- Ran the harness validation command independently.
- Searched for local routing keys and endpoint details in `opencode.json` and inspected broader `.opencode` references for safety posture.
- Confirmed lifecycle hooks are documented as guardrails/telemetry only and validation remains command-backed.

## Pass/Fail Matrix

| Check | Result | Evidence |
| --- | --- | --- |
| Harness validation command | PASS | `node .opencode/scripts/validate-harness.mjs` exited 0 and printed `OpenCode harness validation passed`; only warning was existing Node `MODULE_TYPELESS_PACKAGE_JSON` for `.opencode/plugins/index.js`. |
| Validator acceptance gate preserved | PASS | `.opencode/workflows/validation-workflow.md` requires `node .opencode/scripts/validate-harness.mjs`, security/local routing scans, and explicit pass/fail evidence; `opencode-harness.design.md` says lifecycle hooks are not acceptance proof. |
| Contract and schema references | PASS | `.opencode/contracts/role-io-contracts.json` references `.memory/protocols/memory-management.md`, `.opencode/schemas/memory-trace-artifact.schema.json`, and validator required outputs; trace schema defines `routingMetadataStatus` and role enums. |
| Implementer trace existence | PASS | `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/implementer/local-implementer-013-local-ai-integration.md` exists and records changed files, command result, routing metadata absent, limitations, and handoff. |
| Local routing keys absent from committed `opencode.json` | PASS | `opencode.json` contains only `$schema`, `instructions`, and `permission`; targeted search found no `routingServiceUrl`, `localModelEnabled`, `preferLocal`, `localModelFallback`, localhost, or endpoint fields in `opencode.json`. |
| Local endpoint safety posture | PASS | Design and validation workflow keep machine-specific endpoint/credential configuration out of committed defaults. llama.cpp guide contains local endpoint examples explicitly scoped as user/local examples, not committed harness requirements. |
| Routing preservation | PASS | Delegation workflow and commands preserve caller routing labels when supplied and state missing routing metadata must not be invented; this validation recorded routing metadata as absent. |
| Prior-projection runtime dependency guard | PASS | `validate-harness.mjs` includes `.opencode`/`opencode.json` prior-projection reference rejection; inspected references to `.agents`/`.codex` are design/AGENTS reference-material notes, not runtime dependencies. |

## Command Outputs

```text
$ node .opencode/scripts/validate-harness.mjs
OpenCode harness validation passed
(node:21783) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///home/joshl/projects/opencode-harness/.opencode/plugins/index.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /home/joshl/projects/opencode-harness/.opencode/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
```

## Security and Activation Findings

- No non-native local routing keys or local endpoint details were found in committed `opencode.json`.
- Local llama.cpp endpoint examples remain in a reference guide and are marked as local/user configuration examples, not repository defaults.
- No live local endpoint checks were run because no endpoint/model details were supplied and validation is offline by default.
- Lifecycle hooks/plugins were not treated as acceptance evidence.

## Limitations

- This validation did not edit memory indexes. This evidence artifact was created after the successful `validate-harness` run; because the validator was instructed not to edit files beyond creating this artifact, indexes may need a later index refresh if the repository requires every new validation artifact to be indexed before a subsequent full validation run.
- The review was targeted to reported local AI integration paths and required acceptance checks, not a full semantic audit of every repository file.

## Remediation List

- Required for the validated implementer changes: none.
- Follow-up indexing: add this validation artifact to `.memory/INDEX.md` and `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md` in a scoped implementer/index-refresh step before any subsequent full acceptance run that enforces all orchestration Markdown artifacts are indexed.

## Handoff

- Output summary: Local AI integration support changes pass the requested validator checks with the expected Node warning only.
- Artifact path: `.memory/orchestrations/2026-07-16-harness-design-inspection/validation/local-validator-015-local-ai-validation.md`
- Next role: orchestrator or implementer only if index refresh is required.
