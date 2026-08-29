# remediate-external-integration-implementer-015

- orchestrationId: `2026-08-18-easier-local-node-opencode-harness-implementation`
- delegationTaskId: `remediate-external-integration-implementer-015`
- scopeKey: `implement-llama-setup`
- role/mode: `implementer/implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Remediation loop: 1 of 1.
- Findings: `plan` accepts a closed-schema-invalid profile; `bind` idempotently reuses an existing mode-0644 binding without full trust revalidation.
- Scope: Minimal changes to the plan-designated integration script/tests and directly required documentation, plus trace artifact.
- Gates: Strict pinned `validate-inputs` at plan time; full owner/mode/symlink/ancestry/content checks before existing-binding reuse; full original regression matrix.
