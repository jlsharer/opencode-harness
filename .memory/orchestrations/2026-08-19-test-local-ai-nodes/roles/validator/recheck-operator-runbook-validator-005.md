```json
{
  "orchestrationId": "2026-08-19-test-local-ai-nodes",
  "role": "validator",
  "artifactId": "recheck-operator-runbook-validator-005",
  "createdAt": "2026-08-19T15:49:03Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh validator packet in review mode requiring a bounded static recheck of corrected planner artifact 004 against researcher evidence, validator-003 findings, current integration/harness command contracts, safety gates, and five trace contracts; no live checks authorized.",
    "requiredContextPresent": "yes; changed file, verification criteria, commands, schemas, acceptance standard, expected warnings, skipped-check policy, risk areas, artifact expectations, path relationships, workspace root, trace root, and absent routing metadata status were supplied",
    "routingMetadataStatus": "absent",
    "workspaceRoot": "/home/joshl/ai-infrastructure",
    "traceRoot": "/home/joshl/projects/opencode-harness/.memory"
  },
  "workPerformed": {
    "summary": "Independently reviewed corrected planner artifact 004 against the supplied earlier traces and current wrapper, ai.sh, tunnel, registry, documentation, launcher, schema, and fixture contracts. Ran only non-live syntax/help, fixture, Git, schema/direct-output, and disposable-shell semantic checks. The corrected tunnel preserve/ownership design and documented backup/service/workspace intent resolve validator-003 conceptually, but the exact local backup, local restore, and service-start command forms do not fail closed in the instructed Bash session. Acceptance is therefore FAIL. No implementation fix or live operation was performed.",
    "filesRead": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      "bin/opencode-harness.mjs",
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md"
    ],
    "commands": [
      "bash -n and non-live --help for opencode-harness-integration.sh and ai.sh",
      "node --check bin/opencode-harness.mjs and committed launcher --help",
      "/bin/bash -p tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness",
      "git status --short and git diff --check in harness and ai-infrastructure repositories",
      "Python jsonschema plus direct role-output/path checks for traces 001 through 004, followed by all-five self-check after writing 005",
      "Disposable-shell reproduction of corrected backup_local with an unsafe mode-0644 source",
      "Disposable-shell reproduction of corrected restore_local with an unsafe mode-0644 backup",
      "Disposable-shell reproduction of the corrected service-start compound command with a failing start"
    ]
  },
  "outputContract": {
    "outputs": "Adversarial review with FAIL decision, command-backed matrix, schema results, three blocking fail-closed defects, skipped live checks, remediation, and residual risk.",
    "evidence": "Current help, syntax, launcher, and fixture checks accept the wrapper command grammar and pins. Source inspection confirms main/local, secondary/remote, josh-ai, port 8081, wrapper acknowledgments, and managed-tunnel behavior. Disposable exact-shell reproductions prove that artifact 004's backup_local returns success and writes an existing marker after its required source-mode check fails, restore_local returns success and overwrites the destination from a backup whose required mode check fails, and the service-start compound command returns success with started-by-test=1 after a failed start. These defects directly violate the backup verification, cleanup ownership, and fail-safe acceptance gates.",
    "passFailMatrixOrFindings": [
      {
        "criterion": "Exact integration, ai.sh, native forwarding, launcher commands, flags, acknowledgment flags, and checkpoint grammar remain supported",
        "result": "PASS",
        "evidence": "bash -n, wrapper/ai.sh help, node --check, launcher help, and the offline integration fixture passed. The runbook correctly uses no --yes for plan; --yes for prepare-harness, bind, activate, and deactivate; --ack-opencode-restarted for run; and forwards only models or run."
      },
      {
        "criterion": "Identity, profile, nodes/providers, port, auth caveat, warnings, and response verification remain accurate",
        "result": "PASS",
        "evidence": "Current wrapper pins commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3, package 0.1.10, and launcher SHA-256 c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156. Registry has main/local and secondary/remote via josh-ai with local port 8081. The generated profile is unwrapped schema 2, contains all roles, uses only ai-infra-main/ai-infra-secondary, and keeps forceLocalForHarnessSubagents false. Native auth and live response quality remain explicitly unresolved."
      },
      {
        "criterion": "Tunnel pre-state is checked and cleanup cannot stop a pre-existing managed tunnel",
        "result": "PASS",
        "evidence": "Artifact 004 records systemd pre-state, defaults active state to abort, permits only an explicit healthy preserve election, skips activate/deactivate on preserve, and calls deactivate only when TUNNEL_STARTED_BY_TEST=1. This removes validator-003's unconditional stop path under the stated exclusive-control condition."
      },
      {
        "criterion": "Local and remote server-env backups are created and verified before edits and restoration is fail-closed",
        "result": "FAIL",
        "severity": "blocking",
        "evidence": "Artifact 004 lines 156-161 and 318-319 use semicolon-separated local test/install/cmp commands but never enable errexit for the operator session. Disposable reproduction returned 'backup_rc=0 source_mode=644 marker=existing' and 'restore_rc=0 bad_backup_mode=644 restored_bytes=backup'. Thus a failed mode/owner/file/cmp check can be ignored, an unsafe backup can be accepted, and restoration can overwrite a destination from that rejected backup. The remote here-docs use set -eu and do fail closed; the local functions do not."
      },
      {
        "criterion": "Service pre-state and test-start ownership are recorded and cleanup stops only test-started services",
        "result": "FAIL",
        "severity": "blocking",
        "evidence": "Artifact 004 lines 226 and 229 execute start and then export the ownership marker as semicolon-separated commands without errexit or an explicit success conditional. Disposable reproduction with false in place of start returned 'compound_rc=0 marker_after_failed_start=1'. The exact command can therefore record a successful owned start when start returned nonzero, contradicting its gate and making cleanup eligibility inaccurate."
      },
      {
        "criterion": "Workspace pre/post evidence preserves unrelated changes and placeholders are not runnable literals",
        "result": "PASS",
        "evidence": "The procedure requires a clean disposable exact worktree root under exclusive control, retains pre/final status plus staged and unstaged binary diffs outside the workspace, forbids git clean, and gates tracked restore on explicit ownership approval. Runnable lines contain no angle-bracket metavariables; private values are collected through read/editor steps. Per-run snapshots omit staged binary patches, but final staged evidence is retained; this is a documentation weakness rather than a separate acceptance blocker under the clean exclusive-workspace gate."
      },
      {
        "criterion": "All five role traces satisfy memory trace schema, direct role output requirements, and trace paths",
        "result": "PASS",
        "evidence": "Python Draft 2020-12 validation and direct contract/path assertions passed traces researcher-001, planner-002, validator-003, planner-004, and validator-005."
      }
    ],
    "commandOutputs": [
      "PASS: integration wrapper and ai.sh Bash syntax and help.",
      "PASS: committed launcher node --check and help; help exposes prepare, validate-inputs, and run.",
      "PASS: OpenCode harness integration validation fixtures; foreign-owner existing-binding case was skipped because chown privilege was unavailable.",
      "PASS: git diff --check in both repositories; status confirms external integration bytes and orchestration traces are uncommitted/untracked.",
      "PASS: traces 001-005 memory schema, direct role output fields, and path assertions.",
      "FAIL evidence: backup_rc=0 source_mode=644 marker=existing.",
      "FAIL evidence: restore_rc=0 bad_backup_mode=644 restored_bytes=backup.",
      "FAIL evidence: compound_rc=0 marker_after_failed_start=1."
    ],
    "schemaResults": [
      "memory-trace-artifact.schema.json: traces 001-005 PASS.",
      "role-io-contracts.json direct output fields and trace-path contract: traces 001-005 PASS.",
      "Implemented wrapper validate-inputs/profile contract: statically consistent with the previously fixture-validated unwrapped profile and current source; no live files were supplied.",
      "Integration command contract: syntax/help/fixture PASS."
    ],
    "securityAndActivationFindings": [
      "PASS: pre-existing healthy managed tunnel can only be preserved by explicit election and is not deactivated; normal flow requires inactive pre-state.",
      "BLOCKING: local backup metadata/content checks are advisory in actual shell semantics, so edits can proceed after an unsafe source or failed verification.",
      "BLOCKING: local restoration can overwrite current server config from a backup that failed required safety checks.",
      "BLOCKING: failed service starts can still be recorded as test-started, making stop ownership evidence false.",
      "PASS: no credentials or auth paths are embedded; force-local remains false and routing is not overclaimed.",
      "WARNING: RUN_STATE and remote backup directories are created with reusable mkdir/install semantics rather than an explicit nonexistence assertion; the timestamp-plus-PID name lowers collision likelihood but does not itself prove uniqueness.",
      "WARNING: external integration bytes remain uncommitted and live readiness is unverified."
    ],
    "remediationList": [
      "Make every local backup prerequisite and equality check fail closed before writing an existing marker or permitting edits; independently revalidate with negative owner/mode/type/cmp fixtures.",
      "Make local restore refuse mutation unless the selected run marker and backup pass all required file, owner, mode, and content checks; independently prove the destination remains unchanged on each failed prerequisite.",
      "Set each service started-by-test marker only in the successful branch of the corresponding start command, and define the failed-start state inspection/partial-start ownership branch as executable shell rather than prose.",
      "Assert run-state and remote backup directories are newly created or otherwise refuse collisions before any backup copy can overwrite retained evidence.",
      "After correction, use a fresh independent validator review. No live check is needed to prove these shell-control-flow repairs."
    ],
    "skippedChecks": [
      "Private env/profile bytes and actual owner/mode state",
      "Live node and provider readiness",
      "SSH access and remote backup/restore execution",
      "Tunnel systemd state, start, status, health, stop, and journals",
      "llama-server validate, status, start, stop, health, models, and GPU operations",
      "Native OpenCode auth/configuration and process restart",
      "Projection publication, binding creation, and harness cache preparation",
      "Real provider discovery, direct/delegated requests, routing observations, response verification, traces, and workspace mutation/recovery"
    ],
    "residualRisk": "Live SSH/systemd/provider/model/auth behavior, model quality/capacity, unmanaged listeners, same-UID races, actual private values, and workspace recovery remain unverified. Even after the three blockers are corrected, operator-supplied service classifications, exclusive-control assertions, prompts, aliases, and native auth require live approval. External integration bytes remain uncommitted.",
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md"
    ]
  },
  "handoff": {
    "nextRole": "planner",
    "limitations": "Review mode only. No fix, private-input read, node/SSH/tunnel/service/provider/OpenCode action, projection/binding/cache write, or target-workspace mutation was performed. Acceptance decision: FAIL because exact local backup/restore and service marker commands do not implement their stated gates.",
    "risks": "Executing artifact 004 as written can proceed after failed local backup verification, restore from an unsafe local backup, and falsely mark a failed service start as cleanup-owned. Live behavior remains unverified."
  }
}
```
