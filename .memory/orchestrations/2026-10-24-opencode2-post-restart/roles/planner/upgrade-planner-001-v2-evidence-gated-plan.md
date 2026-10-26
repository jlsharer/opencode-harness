# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-opencode2-post-restart
- role: planner
- artifactId: upgrade-planner-001-v2-evidence-gated-plan
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: `upgrade-plan-001`, taskMode plan, bounded OpenCode 2 upgrade and four-WebFetch-change preservation, supplied upstream research.
- Required context present: sufficient for a gated plan, not safe V2 implementation.
- Routing metadata status: absent; no caller labels supplied.

## Work Performed
- Summary: Compared research with current V1 plugin, dependency inventory, launcher and WebFetch guard; no source edits.
- Files read: researcher trace `upgrade-researcher-001-live-upstream.md`; `.opencode/plugins/index.js`; `.opencode/src/plugins/index.ts`; `.opencode/src/plugin-modules/managed-execution.ts` and `.test.ts`; `.opencode/runtime.manifest.json`; `.opencode/package.json`; `bin/opencode-harness.ts` and `.mjs`; `package.json`; planner contract/schema/template; orchestration INDEX.
- Files changed: none.
- Commands/checks: read/grep only; WebFetch denied for planner by managed role; no shell gates.

## Output Contract
- Outputs: Evidence-gated ordered plan and conditional file contracts below.
- Evidence: Researcher trace lines 17-30 cites V2 v2.1.4 tag and official V2 migration docs indicating V1 plugins cannot run in V2; it records no trusted native V2 runtime. `.opencode/src/plugins/index.ts:9-24` and generated `.opencode/plugins/index.js:4-19` use V1 default-export hook composition. `bin/opencode-harness.ts:639-672,2435-2488` and `.mjs:446-474,1918-1966` enforce exact `@opencode-ai/plugin`; `.opencode/package.json:1-6` pins 1.18.3. `.opencode/src/plugin-modules/managed-execution.ts:134-155` restricts WebFetch to researcher and shell to exact authorized checks; test `:49-58` protects researcher-only behavior.
- Artifact links: `orchestrations/2026-10-24-opencode2-post-restart/roles/planner/upgrade-planner-001-v2-evidence-gated-plan.md`.

### Ordered plan / decisions
1. Stop before implementation. V2 tag/commit date do not prove trusted installable V2 binary, SDK compatibility, or working Task interception; releases/latest identifies V1 v1.19.4, not global latest. Current V1 plugin cannot be claimed to support V2. No implementation edits authorized now.
2. Fresh bounded research: pin V2 CLI/plugin artifact versions, integrity and availability from primary sources; inspect exact `Plugin.define/setup` contract, plugin discovery, config/tool/permission/Task/result/session/status/messages/abort/background/clarification payloads and supported guards. Secure a trusted selected V2 executable for separately authorized native checks; if unavailable remain blocked. Do not invent hook contracts.
3. Fresh planner after evidence: decide independently verified V1 compatibility branch or request owner approval for dropping V1 with migration notice; prescribe exact narrow implementer files. Keep fail-closed dispatch/role/scope/trace/acceptance and researcher-only WebFetch. Inventory four pre-existing WebFetch changes and compare before/after; no broad rewrite.
4. After evidence-backed implementation/regeneration, independent validator on unchanged exact HEAD/index/tree and artifact hashes, plus separately authorized external source/runtime/package QA and trusted native V2 guard exercises. Never claim V2 support or no regressions without native evidence.

### Conditional file contracts (NOT edit authorization)
- `.opencode/src/plugins/index.ts` V2 registration only after pinned API proof; generated `.opencode/plugins/index.js` remains sole autoload entry. Evaluate `.opencode/src/plugin-modules/harness-lifecycle.ts`, `task-thread-policy.ts`, `role-model-routing-enforcement.ts`, `trace-root-permissions.ts`, `managed-dispatch.ts`, `managed-execution.ts`, `dispatch-controller.ts`, `acceptance-proof.ts` individually against exact V2 native contracts; change only evidenced incompatibilities with focused tests and matching generated `.opencode/plugin-modules/*.js`. Unsupported operations fail closed.
- `.opencode/package.json` and conditional `.opencode/package-lock.json`, `bin/opencode-harness.ts` and generated `bin/opencode-harness.mjs`, `.opencode/runtime.manifest.json`: exact matching V2 SDK/CLI lock/installed metadata and projection inventory, never loosen integrity policy. `package.json`, `package-lock.json`, `.opencode/portable.manifest.json`, `.opencode/harness.manifest.json` only where reproducible packaging/tooling or inventory changes require it.
- `README.md`, `AGENTS.md`, `opencode-harness.design.md` only for verified support and limits. New implementer packet needs exact targets, not directories; no out-of-scope edits, global config, Git mutation, untrusted install, live provider or publication.

### Dependencies, gates, assumptions
- Order: pinned upstream SDK/CLI and native V2 contract -> V1 policy decision -> narrow implementation -> independent exact-tree validator -> separately authorized external and native acceptance. Evidence may remain insufficient, in which case stop.
- Managed independent validator gates, not run in this task: `git diff --check`; `node --check .opencode/plugins/index.js`. Neither proves V2 behavior.
- Separately authorized external checks with independent observed exit zero on recorded exact tree (not managed proof): `node .opencode/scripts/validate-harness.mts`; `node .opencode/scripts/validate-portable-harness.mjs --root .`; `node --test .opencode/scripts/runtime-harness.test.mts`; `node --test .opencode/scripts/runtime-foreign-repo.test.mts`; `npm pack --dry-run --json`; `npm run check:source-policy`; `npm run check:generated`; `npm run typecheck`; focused guard/dispatch/WebFetch tests and trusted V2 executable fixture prepare/launch/Task deny/success tests. Restart OpenCode after plugin/config changes. No installation or provider activation without authorization.

## Handoff
- Next role: researcher for exact V2 SDK and native evidence, then fresh planner; no implementer now.
- Limitations: planner WebFetch denied; upstream facts cited from researcher; no acceptance gates or native V2 tests executed.
- Risks: V1 hook not V2 compatible; speculative migration risks bypassing dispatch security and losing four existing WebFetch changes.
