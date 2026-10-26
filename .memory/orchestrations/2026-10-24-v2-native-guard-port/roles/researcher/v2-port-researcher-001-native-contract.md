# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-v2-native-guard-port
- role: researcher
- artifactId: v2-port-researcher-001-native-contract
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: pinned v2.1.4 native plugin/subagent/config/CLI versus current V1 harness; bounded research only.
- Required context present: scoped question, source constraints, freshness and downstream needs.
- Routing metadata status: absent; caller supplied no routing labels.

## Work Performed
- Summary: Read commit-pinned upstream interfaces and native subagent implementation, local lifecycle, dispatch, permission planner, launcher, manifest and tests. No source edits, binary execution, shell, provider calls or validator gates.
- Files changed: none.
- Commands/checks: webfetch/read/grep only; no command exit evidence.

## Output Contract
- Outputs: V2's native delegation is `subagent`, not V1 `task`; V1 admission and completion shapes do not carry over. Fail closed until separately proven V2 interception, parent/result correlation and permission activation.
- Evidence: source links [U1-U10] and local line references [L1-L8] below. Earlier researcher trace is context, not independent runtime proof.
- Artifact links: `orchestrations/2026-10-24-v2-native-guard-port/roles/researcher/v2-port-researcher-001-native-contract.md`.

### Cited findings (D = direct source evidence; I = inference)
1. D [U1] `packages/plugin/src/promise/plugin.ts`: Promise plugin exports `{id,setup(context)}`, context domains include `tool`, `agent`, `session`, `permission`; V1 returned hook map is not this contract. [U2] `packages/plugin/src/promise/adapter.ts`: `fromPromise` bridges registered transforms/hooks; only `execute.before` rejection fails a tool call, `execute.after` runs as a nonfailing promise. [U3] `packages/plugin/src/promise/tool.ts`: before event `{tool,sessionID,agent,messageID,id,input}` mutable `input`; after event `{tool,sessionID,agent,messageID,id,input,status,result|error}`, not V1 `callID`, mutable `output.args`, `output.output`. `transform(editor=>editor.add({name,description,input,execute}))` registers tools. I: a returned V1 map neither safely registers nor preserves V1 post-result blocking; reject before launch when not configured.
2. D [U4] `packages/core/src/tool/plugin/subagent.ts`: actual tool `name='subagent'` input requires `agent,description,prompt`, optional `model,sessionID,background`; continuation uses `sessionID` (not `task_id`), creates child with `parentID: context.sessionID`, runs `sessions.prompt` then `subagents.start`, blocking returns `{sessionID,status:'completed',output}`, wrapped content `<subagent sessionID="..." state="completed">...`; running background has `status:'running'`, metadata `{sessionID,status}`, and progress can announce child before job start. Its built-in before hook normalizes empty model/sessionID. [U2,U3,U5] `packages/core/src/plugin/hooks.ts` triggers registered hooks serially; `packages/plugin/src/effect/tool.ts` restricts failure channel to execute.before. I: before-subagent rejection is supported by source if V2 plugin actually loads and hook order holds; version/help alone cannot prove installed plugin activation, interception or end-to-end child result correlation. Before-hook cannot assume source has a V1 Task wrapper or `jobId`; after-hook can observe a completed result but cannot veto it, so keep acceptance internal/closed on mismatch.
3. D [U6] `packages/plugin/src/promise/session.ts` exposes `get`, `wait`, `interrupt`, hooks `prompt/context/compaction`, not `messages/status/abort`; [U7] `packages/core/src/session/subagent-completion.ts` uses parent synthetic message metadata `{source:'subagent',childID,agent,state}` for background result. I: V1 background cancellation, completion and recovery need separate V2 proofs; do not infer parent binding from a text wrapper alone. Check `session.get` parentID against bound parent, completion status/output schema and correlated native id; disable background/clarification until proved.
4. D [U8] `packages/plugin/src/promise/permission.ts` evaluates `{sessionID,agent?,action,resources,metadata?,source?,effect,message?}` and offers `assert`; [U9] `packages/schema/src/permission.ts` rules are ordered array `{action,resource,effect}` and effect `allow|deny|ask`; [U4] native subagent checks permission action `subagent`, resource agent ID. [L4] `trace-root-permissions.ts:134-155,199-278` mutates V1 `cfg.agent[role].permission.external_directory/edit` object patterns and writes nonce marker after config mutation. I: marker cannot demonstrate V2 permission application; translate through verified agent transform and effective rule evaluation, not V1 object keys; test denied outside trace and allowed exact role trace before relying on activation probe.
5. D [U10] `packages/core/src/config/plugin/source.ts` reads document `info.plugins` and directory discovery from both `plugin` and `plugins`; `packages/core/src/plugin/source-directory.ts` recognizes `.ts/.js` immediate files. [L1] `.opencode/src/plugins/index.ts:9-24` exports V1 default function returning map. [L5] `role-model-routing-enforcement.ts:85-174,357-429` uses mutable V1 cfg, enabled/disabled provider lists and V1 config-ready guard; [L6] `bin/opencode-harness.ts:1180-1187` checks `plugin`, not `plugins`. I: migrate loading/guard/routing atomically and deny before dispatch if transforms fail; source names alone do not certify V2 transformed agent permissions or provider restriction precedence.
6. D [U11] `packages/cli/src/commands/commands.ts` has `debug agents`, `plugin list`, `run`, no `agent list`; [L7] `bin/opencode-harness.ts:2043-2091` calls `agent list` and demands trace marker/exit zero, while `:2160-2188` version probe is diagnostic fallback. [L8] `bin/opencode-harness.ts:637-672,2428-2490` enforces exact `@opencode-ai/plugin` dependency metadata; `.opencode/runtime.manifest.json:59-63` includes one plugin entry and modules. I: `debug agents` is candidate replacement, but first verify it triggers plugin setup and marker on the exact isolated selected binary; maintain canonical/inventory checks and pin installed V2 dependency metadata. Supplied SHA-256/registry-integrity CLI artifact and help are caller evidence only, not verified here and not native guard evidence.
7. D [L2] `harness-lifecycle.ts:137-171,314-509` imports V1 SDK, returns V1 hooks/tools, intercepts `input.tool==='task'` using `output.args`, depends on `client.session.messages/status/abort`; [L3] `managed-dispatch.ts:612-742,930-960,1292-1447` requires V1 `callID`, `task_id`, session-created parent event and `<task ...>`/`metadata.jobId` for success. I: leave managed dispatch disabled for V2 until exact event identity and before/after proof; translating strings without reworking adapter is unsafe.

### Sources
- [U1] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/plugin.ts
- [U2] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/adapter.ts
- [U3] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/tool.ts
- [U4] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/tool/plugin/subagent.ts
- [U5] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/plugin/hooks.ts ; https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/effect/tool.ts
- [U6] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/session.ts
- [U7] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/session/subagent-completion.ts
- [U8] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/plugin/src/promise/permission.ts
- [U9] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/schema/src/permission.ts
- [U10] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/config/plugin/source.ts ; https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/core/src/plugin/source-directory.ts
- [U11] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/commands/commands.ts
- [L1-L8] current workspace relative paths and line ranges above; prior trace `.memory/orchestrations/2026-10-24-opencode2-pinned-contract/roles/researcher/pinned-contract-researcher-001-upstream.md`.

### Implementation implications and open risks
- Smallest safe bounded targets for planner: `.opencode/src/plugins/index.ts`, `.opencode/src/plugin-modules/harness-lifecycle.ts`, `.opencode/src/plugin-modules/managed-dispatch.ts`, `.opencode/src/plugin-modules/trace-root-permissions.ts`, `.opencode/src/plugin-modules/role-model-routing-enforcement.ts`, `bin/opencode-harness.ts`; matching compiled runtime module inventory, source/runtime manifests and fixture tests only when interfaces established. Stage V2 adapter fail closed first; no V1 compatibility claim.
- Unknown: exact V2 effective config/agent permission loader precedence; native event API exposing child-created correlation; lifecycle timing/after-hook error status in selected executable; V2 SDK package installed dependency tree; whether `debug agents` executes configured plugin setup under isolated launcher DB. Require credential-free independent fixture of rejected before-subagent (no child side effects), accepted/blocked child correlation, denial outside trace and marker; do not claim provider activation or acceptance from CLI help.

## Handoff
- Next role: planner.
- Limitations: no native binary run, provider activation, shell validation or observed command exit; V2 native behavior remains a source-derived hypothesis.
- Risks: tool is named `subagent` and result shape differs; V1 hook/map silently misses it; after hook is not a rejection gate; permission probe marker is not authorization proof.
