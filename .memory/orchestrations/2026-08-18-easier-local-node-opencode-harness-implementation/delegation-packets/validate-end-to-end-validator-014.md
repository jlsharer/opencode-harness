# validate-end-to-end-validator-014

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `validate-end-to-end-validator-014`
- scopeKey: `validate-end-to-end`
- role/mode: `validator/validation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Independently validate every approved plan item, exact harness pin, fail-closed boundary, and repository acceptance gate.
- Changed files: Five plan-designated `llama-server` files; harness prerequisite is commit `c1c16cc55ca2c4787f000d01ff05ffe05734a3d3` with launcher hash `c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156`.
- Required evidence: Re-run plan fixtures and hostile cases, inspect all diffs and pin relationships, run applicable checks in both repositories, and validate all traces.
- Skips: Live providers, credentials, real services/tunnels, global installation, publication, and unauthorized mutation must remain skipped with explicit rationale.
