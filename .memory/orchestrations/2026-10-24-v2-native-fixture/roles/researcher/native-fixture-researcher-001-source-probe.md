# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-v2-native-fixture
- role: researcher
- artifactId: native-fixture-researcher-001-source-probe
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: research-only question on pinned v2.1.4 native source, source-only disposable plugin, no-credential setup and before-subagent proof.
- Required context present: scoped question, constraints, freshness, downstream needs, source and prior trace targets.
- Routing metadata status: absent; no routing labels supplied.

## Work Performed
- Summary: inspected pinned source URLs and local inventory and prior trace; no native binary run, provider call, source edit or validation.
- Files read: `.opencode/harness.manifest.json`, `.opencode/src/plugins/index.ts`, `.opencode/scripts/validate-harness.mts`, `.opencode/scripts/operator-external-qa.mts`, prior researcher trace, contract/schema/template and upstream sources [U1-U9].
- Files changed: none (this trace only).
- Commands/checks: read/webfetch only; no executable command or observed exit.

## Output Contract
- Outputs: source-derived two-stage fixture boundary: plugin-list setup activation first; before-subagent rejection requires a real runtime tool call and remains unproved without an independently authorized invocation path. Do not equate plugin activation, custom direct tool execution, or a synthetic callback with a native pre-spawn gate.
- Evidence: [U1-U9] and [L1-L4]; D means direct source evidence, I means inference.
- Artifact links: `orchestrations/2026-10-24-v2-native-fixture/roles/researcher/native-fixture-researcher-001-source-probe.md`.

### Findings
1. D [U1,U2]: `ConfigPluginSource.scan` enumerates directory config entries; `PluginSourceDirectory.names = ['plugin','plugins']`, discovers immediate `.js`/`.ts` files or directories in each config root. Document `info.plugins` is separate; explicitly configured absolute file paths are warned as invalid (directory expected). I: use only a disposable, trusted fixture root's `.opencode/plugins/index.js` (or `plugin/index.js`) as the sole local entry, with no `opencode.json` local-plugin entry and no copy into the source repo or production runtime. Whether fixture root is included in a given launch's config roots must be observed, not assumed.
2. D [U3,U4]: Promise plugin exports `define({id, async setup(context) {...}})`; `setup` returns optional cleanup, not a V1 hook map. Within setup `await context.tool.hook('execute.before', event => { if (event.tool !== 'subagent') return; throw new Error('...') })` registers the before hook; event carries `tool,sessionID,agent,messageID,id,input`. The Promise adapter converts a rejection from `execute.before` to a failed tool call; after-hook cannot reject. D [U5,U6]: `subagent` creates child only inside `execute`, after depth/agent/permission/model checks; hook trigger is serial. I: with actual runtime event trigger proved before `execute`, fixture sentinel rejection is expected before child creation; source ordering alone does not prove actual installed version, hook activation or child absence.
3. D [U7,U8]: pinned CLI declares `plugin list`, `debug agents`, `run`; `plugin list` handler calls native `client.plugin.list` for current directory and formats server rows as `ID VERSION SOURCE`; [U9] plugin inventory labels a successfully loaded registration `state.status='active'`, or failure `failed`. I: safest candidate no-provider probe is invoking the verified native CLI `plugin list` in an operator-controlled fresh isolated disposable root/session, then checking a unique fixture ID and its exact fixture SOURCE; request the underlying plugin-list API state=active as an additional activation check, since table alone hides state. Setup can return `void`, register the hook, and emit a unique marker via ID plus active state; no workspace marker/write is needed. Neither this command nor `debug agents` drives a tool execution. `plugin list` handler calls `ServerConnection.resolve()` with no forwarded `standalone` argument: do not claim `--standalone plugin list` enforces isolation. Verify endpoint ownership/fresh server and exact selected binary independently, and treat connection to a stale server as inconclusive.
4. D [U5]: tool input is `agent,description,prompt` (optional `model,sessionID,background`); actual `subagent` call is inside tool execution. D [U7]: `run` accepts a message but drives model-run flow, not a CLI direct-tool-call command. I: no source-supported no-provider CLI path was found to cause a genuine `subagent` tool invocation. Calling a retrieved `tool.execute` directly from plugin setup is not an equivalent test (bypasses the tool hook pipeline), and simply constructing/throwing inside the hook is synthetic evidence. Therefore no provider-free claim of native before-hook firing, pre-spawn denial or child absence is justified from stage 1.
5. I bounded stages for planner: (A) source-only fixture ` .opencode/scripts/native-v2-plugin-fixture.mts` (candidate single driver for operator-authorized external execution) constructs disposable isolated git root with `.opencode/plugins/index.js`, unique plugin ID `harness.native.fixture.before-deny.v1`, registers before hook with fixed refusal sentinel `HARNESS_NATIVE_FIXTURE_BEFORE_SUBAGENT_DENIED_V1`, executes verified exact binary `plugin list` without credentials, captures exit/status, ID/SOURCE and native active-state/endpoint proof, asserts unchanged source workspace hash; avoid any persistent fixture entry in actual `.opencode/plugins/` or production package/runtime manifests. (B) separate isolated unit simulation asserts before-hook callback only for `subagent` and refusal sentinel, clearly labelled not native proof; separately authorized genuine tool invocation, real parent ID and child inventory would be required to claim native pre-spawn denial. If stage A is only deliverable, stop at activation and report stage B unproven. New tracked source-only script requires updating [L1,L2] static manifest inventories; alternately keep fixture entirely external without touching source inventory.
6. D [L3,L4]: existing source plugin entry is a V1 default returning hook map; operator-external-QA is source-only with explicit command receipts. I: never import existing V1 fixture into V2 isolated test and never invoke launcher `run` against a workspace with production V1 plugin. No tool command, native exit, binary verification, endpoint proof or tree snapshot observed in this research.

### Sources
- [U1] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/config/plugin/source.ts
- [U2] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/plugin/source-directory.ts
- [U3] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/plugin.ts
- [U4] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/tool.ts ; https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/adapter.ts
- [U5] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/tool/plugin/subagent.ts
- [U6] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/plugin/hooks.ts
- [U7] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/commands/commands.ts
- [U8] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/commands/handlers/plugin/list.ts ; https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/commands/handlers/debug/agents.ts ; https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/commands/handlers/run.ts
- [U9] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/plugin.ts
- [L1] `.opencode/harness.manifest.json:95-107,131-134`; [L2] `.opencode/scripts/validate-harness.mts:154-275,442-459`; [L3] `.opencode/src/plugins/index.ts:1-24`; [L4] `.opencode/scripts/operator-external-qa.mts:1-26,59-89,148-170`. Previous trace `.memory/orchestrations/2026-10-24-v2-native-guard-port/roles/researcher/v2-port-researcher-001-native-contract.md:25-55` is context, not fresh activation proof.

## Handoff
- Next role: planner.
- Limitations: no native execution; cannot prove from pinned sources that a credential-free real subagent invocation exists. Exact isolated CLI endpoint routing and native API plugin-list state retrieval require a separate authorized fixture.
- Risks: stale server falsely attributes activation; plugin table does not show active status; direct `execute` bypasses hook; provider-driven invocation outside scope; local `.opencode` fixture may clash with source inventory or release plugin.