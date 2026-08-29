# prove-trace-integrity-validator-011

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `prove-trace-integrity-validator-011`
- scopeKey: `prove-trace-integrity`
- role/mode: `validator/artifact-proof`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Prove every retained role trace passes schema and role output contracts, and confirm no behavior/release gate regressed after artifact-only correction.
- Required evidence: Parse all traces, check direct role keys, run source validation and diff checks, and verify behavior files are unchanged from the accepted revalidation state.
- Acceptance: Harness prerequisite may unblock only if trace integrity and preserved behavioral acceptance both pass.
