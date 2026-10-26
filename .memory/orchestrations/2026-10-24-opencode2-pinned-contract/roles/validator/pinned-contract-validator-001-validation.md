# Validator trace — pinned contract

## Metadata
- orchestrationId: 2026-10-24-opencode2-pinned-contract
- delegationTaskId: pinned-validate-001
- scopeKey: pinned-contract
- role: validator
- taskMode: validation
- artifactId: pinned-contract-validator-001-validation
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Three listed changed files; two exact managed gates; static pinned-V2 provenance, scope, and WebFetch preservation criteria; risk areas and acceptance standard.
- Required context present: yes; no baseline diff, Git status, or provenance source was supplied as an authorized gate.
- Routing metadata status: absent.

## Work Performed
- Summary: Independently ran both authorized read-only gates and reviewed the supplied file contents and current WebFetch guard/test.
- Files read: README.md; opencode-harness.design.md; .opencode/scripts/runtime-harness.test.mts; .opencode/plugins/index.js; .opencode/plugin-modules/managed-execution.js; .opencode/plugin-modules/managed-execution.test.mjs; role IO contract, trace schema, orchestration input schema, trace template.
- Files changed: none (except this role trace).
- Commands/checks: `git diff --check` via harness_verify => exitCode 0, empty stdout/stderr; `node --check .opencode/plugins/index.js` via harness_verify => exitCode 0, empty stdout/stderr.

## Output Contract
- Outputs: Both assigned managed gates PASS. README.md:63-74 and opencode-harness.design.md:317-330 identify tagged v2.1.4 source commit 68bc26b7da1990ce10ffecfbc1e09eb13aa5d824, distinguish tag/source from installed native proof, and explicitly reject managed-V2 compatibility/activation. Runtime fixture:429-445 adds fake 2.1.4 to diagnostic version cache test and explicitly disclaims Task safety. Current WebFetch guard: managed-execution.js:110-114 permits researcher only; test:40-48 tests copied args and denial for other roles. index.js:1-19 remains V1 hook-map shaped on inspection. No live plugin/runtime activation claimed.
- Evidence: The two exit statuses above are independent command observations on the managed tree, not stdout inference. Static file reads establish current contents only: no authorized git status/diff against baseline or pinned upstream source retrieval, so complete changed-file inventory, preservation *relative to baseline*, and upstream commit authenticity are not independently provable in this packet. Schema contracts examined for output shape; no schema-validation command assigned or run.
- Artifact links: this trace.
- Acceptance: BLOCKED for complete scope/preservation assurance, despite passing the two exact gates; the supplied changedFiles list and present WebFetch code alone do not establish absence of other changes or baseline preservation. This is a proof limitation, not a discovered code defect.

## Handoff
- Next role: parent for evidence review; authorize a fresh scoped validator gate for diff/status and provenance if complete scope/preservation proof is required.
- Limitations: Full source/runtime/package tests, fake fixture execution, trusted V2 binary behavior, release publication, native Task guard effectiveness, provider health/network activation remain unverified; no new commands may be inferred as passed.
- Risks: A version-neutral launcher or fake tagged-version cache test must not be treated as a V2 managed-dispatch gate. No production launcher/plugin edits were in the supplied changedFiles list, but repository-wide absence of such edits was not independently established.
