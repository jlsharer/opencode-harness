# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-v2-native-guard-port
- role: planner
- artifactId: v2-port-planner-001-gated-plan
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: taskMode `plan`; conditional OpenCode V2.1.4 upgrade goal; restricted paths, research trace, operator QA receipt, preservation and acceptance gates.
- Required context present: yes; supplied V2 source findings and previous operator-only QA distinguish facts from unproved runtime behavior.
- Routing metadata status: absent; caller supplied no routing labels.

## Work Performed
- Summary: reviewed role contract, schema, research trace, QA receipt and local V1 plugin/launcher/package source. Produced a gated plan; no implementation or final validation.
- Files read: `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.memory/protocols/memory-management.md`, researcher trace, operator QA receipt, `.opencode/src/plugins/index.ts`, `.opencode/src/plugin-modules/{harness-lifecycle,managed-dispatch,trace-root-permissions,role-model-routing-enforcement}.ts`, `bin/opencode-harness.ts`, `package.json`.
- Files changed: none.
- Commands/checks: none; read/grep/glob only. The specialized configuration skill was unavailable under managed-tool permissions; no substitute tool or validation was used.

## Output Contract
- Outputs: **Stop before a V2 implementation assignment.** A bounded evidence-and-port sequence follows; conditional target inventory is not authorization to edit. No safe V2 managed launch can be specified from version/CLI evidence or the pinned source alone.
- Evidence: researcher trace `orchestrations/2026-10-24-v2-native-guard-port/roles/researcher/v2-port-researcher-001-native-contract.md` findings 1–7 ([U1–U11], [L1–L8]); operator QA `orchestrations/2026-10-24-qa-execution-boundary/validation/operator-external-qa-20261024.md` lines 3–8; local `.opencode/src/plugins/index.ts:9-23`, `.opencode/src/plugin-modules/harness-lifecycle.ts:137-185`, `.opencode/src/plugin-modules/managed-dispatch.ts:111-126`, `bin/opencode-harness.ts` trace-activation sites (research [L7]). External QA is pre-port, not managed or V2 guard acceptance.
- Artifact links: `orchestrations/2026-10-24-v2-native-guard-port/roles/planner/v2-port-planner-001-gated-plan.md`.

### Ordered plan and dependencies
1. **Block implementation until credential-free native fixture proof is supplied.** Confirm the pinned V2.1.4 artifact and exact selected binary in an owner-controlled isolated fixture (operator provenance already recorded but not plugin proof). Prove V2 plugin setup executes for that selected binary, before-`subagent` hook rejects invalid/ambiguous dispatch *before any child/session side effect*, before hook receives stable parent identity and proposed input, and native completion carries reliably correlated child/session/parent/result evidence. Prove V2 agent-transform permissions actually deny out-of-trace writes for reader roles while allowing only the assigned trace and explicit implementer source paths. Establish behavior for background/continuation or explicitly disable them; after hook is observational and cannot veto. Credential-free offline integration checks must observe exit status and child/no-child state, not only help text or a marker. If the native APIs cannot establish any required pre-spawn/identity/completion guarantee, stop and retain V1 behavior with V2 managed dispatch refused; do not advertise V2 support.
2. Only after those contracts are evidenced, issue a *new* scoped implementer packet with exact assigned targets and preservation rules. Conditional cohesive targets: `.opencode/src/plugins/index.ts`, `.opencode/src/plugin-modules/harness-lifecycle.ts`, `.opencode/src/plugin-modules/managed-dispatch.ts`, `.opencode/src/plugin-modules/task-thread-policy.ts`, `.opencode/src/plugin-modules/trace-root-permissions.ts`, `.opencode/src/plugin-modules/role-model-routing-enforcement.ts`, `bin/opencode-harness.ts`; narrowly relevant `.opencode/src/plugin-modules/{managed-dispatch,task-thread-policy,trace-root-permissions}.test.ts`, `.opencode/scripts/{runtime-harness,runtime-foreign-repo}.test.mts`, plus new exact fixture test paths only after approved inventory. Preserve V1 contract via explicit version/capability split or separately proven compatibility, not silent V1 hook reuse; intercept the *actual* `subagent` input/sessionID, bind native child parent ID and completed result, refuse ambiguity or missing proof, keep unsupported background/continuation closed, make effective V2 permissions/routing fail closed, and replace `agent list` probe only after proven setup+permission activation. Do not add a version allowlist; a capability preflight requires independent behavioral evidence. Preserve unrelated V1 and WebFetch worktree edits.
3. Co-update the generated `.opencode/plugins/index.js`, corresponding `.opencode/plugin-modules/*.js`, `bin/opencode-harness.mjs`, `.opencode/runtime.manifest.json`, relevant `.opencode/harness.manifest.json` and `.opencode/portable.manifest.json` if inventory changes, and `package.json`/`package-lock.json` only for proven dependency changes; `README.md`/`opencode-harness.design.md` only for verified support/limitations. All remain conditional within supplied broad scope. Generated files must agree with sources; do not manually paper over source mismatches or weaken installation/runtime integrity.
4. Require independent validator on final unchanged tree: assigned read-only `git diff --check`, `node --check bin/opencode-harness.mjs`, `node --check .opencode/plugins/index.js` with observed exit zero, plus independently observed offline native fixture proving refusal, no child for refusal, correlated completed child, trace permission enforcement and regression of V1 preservation. Separately authorized external verification (not managed gate credit): `node .opencode/scripts/validate-harness.mts`, `node .opencode/scripts/validate-portable-harness.mjs --root .`, `node --test .opencode/scripts/runtime-harness.test.mts`, `node --test .opencode/scripts/runtime-foreign-repo.test.mts`, `npm pack --dry-run --json`, and relevant tests/build on final tree; record exits and tree identity. Restart OpenCode after plugin/config changes. No live provider activation, installation, publication or credential use.

### Decisions, assumptions and blocker
- Source [U1–U5] proves a *candidate* V2 before-tool rejection channel, not that the shipped selected binary loads this plugin at the right time or exposes a sufficient identity/cleanup lifecycle. Source [U6–U9] does not supply V1 session APIs or V1 permission object semantics. CLI `debug agents` help and official archive integrity cannot fill these gaps.
- Do not change launcher to `debug agents`, mutate SDK dependency, migrate hooks, or claim guard parity until the exact plugin setup, permission enforcement, child identity, completed-result and cleanup properties are observed in a credential-free V2 fixture. If isolation/fixture capability is unavailable, report blocked rather than assign speculative source edits. Keep conservative V1 launch/guard expectations and any unrelated pending WebFetch edits intact.
- Assumption: the provided researcher trace and QA receipt are supplied evidence, not independent validator acceptance for a post-port tree. No routing labels were provided.

## Handoff
- Next role: researcher or operator to supply missing native fixture/API observations; only then new implementer packet and independent validator.
- Limitations: no native V2 plugin/subagent execution, V2 permissions test, command exits or final tree validation in this planning task. This plan does not authorize implementation.
- Risks: V1 `task` hook could silently miss V2 `subagent`; after hook cannot refuse; unproven session cleanup or effective agent permissions would undermine managed containment.
