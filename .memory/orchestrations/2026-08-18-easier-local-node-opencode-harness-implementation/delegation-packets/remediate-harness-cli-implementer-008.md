# remediate-harness-cli-implementer-008

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `remediate-harness-cli-implementer-008`
- scopeKey: `implement-harness-cli`
- role/mode: `implementer/implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Remediation loop: 1 of 1.
- Finding: Caller-controlled CR/LF in option/path text breaks the one-line stderr contract.
- Scope: Minimal launcher sanitization/encoding, hostile CR/LF tests, directly required docs only if behavior clarification is necessary, and trace artifact.
- Verification: Reproduce the finding, prove one-line output for newline and carriage-return inputs, then rerun all original harness gates.
