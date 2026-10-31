# Imported independent validator review

## Metadata

- orchestrationId: global-implementation-20261028
- role: validator
- artifactId: root-validator-001-independent-review
- createdAt: 2026-10-28
- Provenance: verbatim validator task memo retained externally as validation.md; imported by implementer for durable history. This is the prior review, not final acceptance of remediation.

# Independent validation — global-implementation-20261028 / validation

Packet version 1 accepted: validator / validation; goal, scope, constraints, acceptance and context consistent. Implementation dependency memo read. No delegation, orchestrator invocation, project-file edits, credential/provider changes, live native activation, actual user-global install or publication performed. All mutation fixtures confined to temporary directories. Normal sandbox command failed before shell with exec-server rejected request / missing process; prescribed escalated /usr/bin/zsh -lc pwd exited 0. Subsequent smallest necessary commands individually reviewed.

## Acceptance decision: remediation required

### F1 — P1: all four installed roles receive nonexistent contract/schema paths

Location: bin/global-harness.ts:168 and :180-182 (generated bin/global-harness.mjs equivalent).

`project()` inserts `${release}/.opencode/contracts/...` and `${release}/.opencode/schemas/` into generated role text, then replaceAll('.opencode/', release+'/.opencode/') prefixes those already-absolute references again.

Command-backed reproduction (exit 0): imported generated `globalOperation` from ./bin/global-harness.mjs; made /tmp/validator-global-YA33tA; installed using explicit configRoot=/tmp/validator-global-YA33tA/config, stateRoot=/tmp/validator-global-YA33tA/state, workspaceRoot=/tmp/validator-global-YA33tA, apply=true. This is a temporary fixture only. Reading config/agents/validator.md printed:

`Read immutable role input/output fields from /tmp/validator-global-YA33tA/state/releases/0.1.20-78654a646234123ca2dd//tmp/validator-global-YA33tA/state/releases/0.1.20-78654a646234123ca2dd/.opencode/contracts/role-io-contracts.json ...`

The correct single-release-root contract exists. Shared generator affects all four roles. This breaks global contract/resource usability independent of native host activation. Ensure projection resolves each reference exactly once and assert actual target existence for every role, including roots with spaces/Unicode.

### F2 — P2: admission runtimeRoot is one level too deep

Location: .opencode/src/plugin-modules/global-native-plugin.ts:397 (generated global-native-plugin.js equivalent).

Loaded the actual installed adapter from the temporary release and admitted the existing offline fixture workflow through action(). Command exited 0. Returned runtimeRoot:

`/tmp/validator-global-YA33tA/state/releases/0.1.20-78654a646234123ca2dd/.opencode`

Both fs.existsSync(runtimeRoot+'/.opencode/contracts/role-io-contracts.json') and fs.existsSync(runtimeRoot+'/.opencode/plugin-modules/global-utilities.js') were false. Global skill/docs define runtimeRoot as immutable installation root with `.opencode/...` resources beneath it. The adapter uses dirname twice on a module file under <release>/.opencode/plugin-modules, yielding <release>/.opencode. Return <release> and test admission against actual prepared/installed resources. This separately breaks parent-to-child root propagation even after F1 is corrected.

## Review observations

Inspected actual global adapter, protocol, lifecycle projection and installer, manifest, utilities, approved plan, operator guide, task-contracts/thread-policy and dispatch-controller. Compared adapter with retained pinned native Promise plugin/tool/command/adapter sources and core subagent implementation at 68bc26b7da1990ce10ffecfbc1e09eb13aa5d824. Hooks use the expected event shapes; wrapper/output/metadata correlation agrees with pinned subagent source. Default export plugin setup/cleanup shape and Promise command transform executor signatures agree. Ordinary non-subagent tool calls bypass adapter mutation. Semantic DAG, parent ownership, budgets, role-mode sequencing and independent validator result gates use retained controller/contracts; artifact-byte and command-execution authenticity limitations remain explicit.

Additional executable temporary fixture exercised all five registered command pathways: delegate-orchestration admission followed by delegate-research, delegate-plan, delegate-implement, delegate-validate, then orchestration.accept. Exit 0, four native-shaped mock executions, accepted:true, treeHash c4cb91676878a1268daa58a3e3d620b38e8a620c36fa3c7ff4b143ea8639646e. This proves shared command route behavior with mocks, not actual native tool/provider activation.

Observed global controller still rejects evidenceCommand='npm test' with legacy read-only managed gate restriction. Reproduction exited 0 after catching exact admission rejection: 'managed acceptance gate needs read-only inputs and no host writes; run package/source QA separately outside managed verification'. Operator skill acknowledges restricted acceptance activity; ordinary native tools remain unaffected. Record this as retained managed-gate capability limit rather than an additional undocumented blocking defect.

## Checks and evidence

- npm test: exit 1 at check:format; Prettier flags .opencode/src/plugin-modules/managed-execution.test.ts. Log validator-npm-test.log. Parent confirms another chat/process is editing this checkout; these managed-execution changes are outside global remediation scope. No formatter run.
- npm run typecheck && npm run check:generated && npm run check:source-policy && npm run test:v2-bridge: exit 0. Typecheck passed, 42 generated artifacts checked, 61 authored source files policy passed, V2 bridge 11/11 passed. Final subcommand log validator-quality.log; preceding command output recorded in tool transcript.
- npm run validate:global && npm run test:global: exit 0. 54 global assets and 14-module import closure validated; 27/27 tests passed, zero skips. Includes actual temporary npm pack/extract/lifecycle/module closure fixture. Global test log validator-global.log; validator JSON recorded in tool transcript.
- npm pack --dry-run --json: exit 0; validator-pack.log. No publication.
- git diff --check: exit 0.
- npm run test:harness: running at initial memo write; append final observed result below before terminal result.

## Limits and concurrent-state qualification

No frozen whole-tree claim: initial observed diff already included managed-execution TS, generated JS and TS/generated test edits absent from producer memo; parent subsequently confirmed concurrent external work. Existing implementation snapshot/head/index/tree supplied by parent cannot describe the entire final tree inspected here. Preserve those external edits. Final acceptance must revalidate remediated global files with a fresh validator and report concurrency.

No live T3Code build/WSL distro/OpenCode executable/provider/auth/catalog/reconnect/effective host permission validation authorized or performed. Pinned source and mocks do not establish a supported native binary/version or full host integration. Global background/context-update dispatch is disabled; cancellation acknowledges termination uncertainty. Routing/utilities/context/handoff are explicit callable utilities rather than automatically integrated provider hooks. Artifact bytes and actual validator command execution are not automatically independently authenticated; evidence hashes bind only declared files and reported commands. Different-UID and Darwin-only paths may skip as reported in suite logs. No defects fixed and no project artifacts written by this validator; required memo/results live under /tmp.

## F3 — P2: inherited legacy gate blacklist blocks ordinary global orchestration QA

Location: .opencode/src/plugin-modules/global-protocol.ts:127 (createDispatchController) and .opencode/src/plugin-modules/dispatch-controller.ts:49-65 / :204 (managedGate).

Parent clarified that retaining this unnecessary execution-era policy blocks the approved goal to eliminate such guards, even though current operator documentation acknowledges it. This is a blocking global behavior finding, superseding the earlier review-observation classification as merely a capability limit.

Reproduce with `node /tmp/harness-global-implementation-20261028/validator-five-commands.mjs` (observed exit 0; output in validator-five-commands.log). The fixture first proves all five command pathways and full independent-validator acceptance using native-shaped mocks. It then changes the acceptance gate to the ordinary exact command `npm test` and attempts fresh global admission. Actual output:

`npm test gate rejected: Harness dispatch controller: managed acceptance gate needs read-only inputs and no host writes; run package/source QA separately outside managed verification`

createGlobalProtocol reuses createDispatchController -> validateWorkflow -> managedGate without profile-specific policy. Its regex categorically blocks npm test/pack/install/ci/build/compile/format/check:generated and source validator commands. This is inherited legacy Bubblewrap/read-only acceptance policy, not a limitation in the pinned native Promise API. Ordinary native tools still run, but the workflow cannot register these commands as validator gates, preventing common project QA from closing global managed acceptance.

Minimal safe change: retain existing legacy controller default and add an explicit global-only validation policy split permitting bounded nonempty exact evidence commands under native host permissions. Preserve semantic DAG/budget validation, correlation, exact reported command/exitCode and declared-file hash requirements; do not delete the legacy guard globally or claim independent command execution. Add regression cases for npm test and arbitrary reviewed commands on global while existing legacy rejects continue passing.

Runnable all-five-path + gate reproduction is preserved in validator-five-commands.mjs; its mock provenance is explicit and does not constitute real native activation.

## Final required-check completion

`npm run test:harness` exited 1. Actual validator-harness.log contains successful authorized preceding suites, both required runtime scripts (runtime-harness 49/49; runtime-foreign-repo 8 pass, 1 optional external-fixture skip), and portable-harness adversarial suite (23 total, 19 pass, 4 Darwin skips). The subsequent exact required `node .opencode/scripts/validate-harness.mts` invocation failed during its nested generated-JS tests: 141 tests, 139 pass, 2 fail. Failures are .opencode/plugin-modules/managed-execution.test.mjs:124 and :144, named 'existing bubblewrap executes quoted exact commands and prevents workspace writes' and 'focused syntax check succeeds under the read-only managed shell'. Both exit-1 child commands report `bwrap: Can't chdir to /tmp/managed-execution-...: No such file or directory`; --tmpfs /tmp masks fixture cwd. These files are part of parent-confirmed concurrent managed-execution changes outside this implementation review's remediation scope. This is observed failing regression evidence, not a claimed global code defect or a waived requirement.

The aggregate short-circuited before its last portable validator, so `node .opencode/scripts/validate-portable-harness.mjs --root .` was launched separately; see validator-portable.log and terminal result for its actual exit. Earlier native-shaped tests, global lifecycle/tarball fixtures and runtime suites passed but cannot turn failing whole-source checks into a pass. Darwin-only Node suites reported 9 skips; portable suite 4 Darwin skips; foreign runtime 1 optional external bundle skip. Two runtime subfixture diagnostics additionally note different-UID generated bin/executable target checks skipped for unprivileged chown (not counted as skipped top-level tests). No live provider/network/auth/global activation checks performed.

Standalone portable validator completed with exit 1, repeating the same generated managed-execution failures (141 tests, 139 pass, 2 fail; validator-portable.log). Final git diff --check exited 0. All authorized checks have terminal observed outcomes. No implementation fixes or project-file edits performed.
