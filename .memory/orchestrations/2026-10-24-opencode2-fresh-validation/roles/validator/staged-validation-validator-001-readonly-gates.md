# Validator Trace: staged read-only gates

## Metadata
- orchestrationId: 2026-10-24-opencode2-fresh-validation
- delegationTaskId: staged-validator-001
- scopeKey: staged-validation
- role: validator
- taskMode: validation
- artifactId: staged-validation-validator-001-readonly-gates
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Seven supplied tracked changed files, six exact verification commands, three schema contracts, managed read-only acceptance boundary and V2/WebFetch risk areas.
- Required context present: Yes for staged read-only validation; no official V2 executable/archive or external QA command results supplied.
- Routing metadata status: absent; no caller routing labels supplied.

## Work Performed
- Summary: Independently executed six assigned commands through harness_verify and inspected bounded staged docs, offline fake fixture and source/generated WebFetch branches and tests. Did not edit source or activate providers/network.
- Files read: README.md; opencode-harness.design.md; .opencode/scripts/runtime-harness.test.mts; .opencode/src/plugin-modules/managed-execution.ts; .opencode/plugin-modules/managed-execution.js; paired source/generated managed-execution tests; supplied schema contracts and memory protocol.
- Files changed: none in workspace; this immutable trace only.
- Commands: `git diff --name-only` exit 0; `git diff --check` exit 0; `node --check bin/opencode-harness.mjs` exit 0; `node --check .opencode/plugins/index.js` exit 0; `node --check .opencode/plugin-modules/managed-execution.js` exit 0; `node --check .opencode/plugin-modules/managed-execution.test.mjs` exit 0. Exits observed by harness_verify, not inferred from stdout.

## Output Contract
- Outputs: PASS for six assigned gates and bounded staged read-only scope only. The tracked `git diff --name-only` output equals exactly the seven supplied paths: `.opencode/plugin-modules/managed-execution.js`, `.opencode/plugin-modules/managed-execution.test.mjs`, `.opencode/scripts/runtime-harness.test.mts`, `.opencode/src/plugin-modules/managed-execution.test.ts`, `.opencode/src/plugin-modules/managed-execution.ts`, `README.md`, `opencode-harness.design.md`. This does not establish the pre-existing bytes or cover untracked traces/ignored inputs. Schema results: inspected validator output contract, trace artifact shape and normalized-spec routing status; no schema validator command assigned, so schema conformance is not independently executable-gated here.
- Evidence: All six harness_verify calls returned observed exitCode 0; whitespace and four syntax gates printed no output; inventory printed only seven paths. README.md:63-74 and design:317-330 explicitly deny V2 managed support. Runtime fixture:418-446 injects fake `2.1.4` only for version/cache isolation. Source WebFetch branch:138-141 and generated branch:110-114 allow researcher only, copy arguments; paired tests:49-58 and generated:40-48 cover researcher pass-through and other-role denial but were not executed in this task. No live WebFetch/network, native Task interception, official archive or V2 binary attestation was tested.
- Artifact links: `orchestrations/2026-10-24-opencode2-fresh-validation/roles/validator/staged-validation-validator-001-readonly-gates.md`.
- Security and activation: No V2 guard activation claim. Full source validation, portable validation, both runtime test scripts, npm pack dry-run and official v2.1.4 archive verification remain unexecuted by this packet. The source validator/npm pack and build/runtime QA are write-producing or require separately authorized external verification; do not substitute syntax checks for them. No source file was changed, no provider credential or live call used.
- Remediation: Before any V2 managed dispatch, separately obtain and verify official v2.1.4 release bytes; prove pre-spawn refusal, native plugin/Task/session guard semantics and lock/SDK compatibility with trusted-binary offline fixtures; run full source/portable/runtime/package QA externally against the same reviewed tree, then independent validation. If baseline-byte preservation is required, compare against independently captured baseline evidence; this tracked inventory alone cannot do that.

## Handoff
- Next role: Parent for bounded synthesis and separately authorized external QA scheduling.
- Limitations: Tracked diff inventory is not a complete worktree/untracked listing and cannot prove earlier baseline preservation. No paired WebFetch test suite executed in this packet; syntax-only test gate cannot establish assertion outcomes. Exact tree/HEAD/index protection is managed by harness gate observations, not proven by stdout or this Markdown.
- Risks: V2 managed dispatch unsafe without native proof; unexecuted write-producing/full QA and official archive verification block upgrade acceptance, not the six scoped staging gates.
