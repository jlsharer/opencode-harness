# revalidate-harness-cli-validator-009

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `revalidate-harness-cli-validator-009`
- scopeKey: `validate-harness-cli`
- role/mode: `validator/validation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Independently revalidate the full harness CLI contract after CR/LF stderr remediation.
- Changed files: Original eight-file implementation plus `bin/opencode-harness.mjs` and `.opencode/scripts/runtime-harness.test.mjs` remediation.
- Required evidence: Reproduce the prior attack, run option/path CR/LF probes, and rerun every original acceptance gate using actual repository command paths.
- Acceptance: No remaining command-backed contract failure; downstream remains blocked until pass.
