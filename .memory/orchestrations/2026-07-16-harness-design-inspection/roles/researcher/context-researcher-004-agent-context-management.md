# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-16-harness-design-inspection
- role: researcher
- artifactId: context-researcher-004-agent-context-management
- createdAt: 2026-07-16
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research current and potential context-management behavior for OpenCode harness agents/subagents; inspect design, workflows, commands, agents, skills, plugins/modules, `opencode.json`, and `.memory` protocols/templates; use local docs/schema and web documentation where useful; write this trace artifact only.
- Required context present: orchestration ID, memory root, role contract catalog, trace schema, delegation skill, workflow references, allowed edit scope, source scope, downstream research needs, and routingMetadataStatus were supplied.
- Routing metadata status: absent; caller-supplied routing metadata was absent and no routing values were invented.

## Work Performed

- Summary: Inspected the harness design and current OpenCode/memory surfaces for context segmentation, summaries, DAG boundaries, restart/resume guidance, compaction, and plugin telemetry. Fetched current OpenCode docs/schema for native compaction, subagent, command, plugin, and session capabilities.
- Files read:
  - `opencode-harness.design.md`
  - `opencode.json`
  - `AGENTS.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.opencode/schemas/role-io-contracts.schema.json`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/commands/delegate-orchestration.md`
  - `.opencode/commands/delegate-research.md`
  - `.opencode/commands/delegate-plan.md`
  - `.opencode/commands/delegate-implement.md`
  - `.opencode/commands/delegate-integrate.md`
  - `.opencode/commands/delegate-validate.md`
  - `.opencode/commands/delegate-artifact-verify.md`
  - `.opencode/agents/researcher.md`
  - `.opencode/agents/planner.md`
  - `.opencode/agents/implementer.md`
  - `.opencode/agents/integrator.md`
  - `.opencode/agents/validator.md`
  - `.opencode/agents/reviewer.md`
  - `.opencode/agents/synthesizer.md`
  - `.opencode/agents/artifact-verifier.md`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
  - `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md`
  - `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
  - `.opencode/skills/opencode-skill-authoring/SKILL.md`
  - `.opencode/skills/opencode-workflow-guidance/SKILL.md`
  - `.opencode/plugins/index.js`
  - `.opencode/plugin-modules/harness-lifecycle.js`
  - `.opencode/routing/harness-model-routing.json`
  - `.opencode/routing/resolve-model-routing.mjs`
  - `.opencode/harness.manifest.json`
  - `.memory/protocols/memory-management.md`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/templates/orchestration-index.md`
  - `.memory/INDEX.md`
  - `.memory/references/opencode-refs.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md`
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/implementer/root-implementer-001-memory-index.md`
- Files changed:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/context-researcher-004-agent-context-management.md`
- Commands/checks:
  - Loaded `delegation-orchestrator` skill.
  - Used file read/glob/grep tooling to inspect scoped repository files and search for context, compaction, summary, budget, restart/resume, and stale-context terms.
  - Webfetched OpenCode documentation/schema listed below.
  - Ran `mkdir -p ".memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher" && python - <<'PY' ...` which failed because `python` was unavailable after creating the directory.
  - Ran `python3 - <<'PY' ...` to write this trace artifact.
  - Read back this trace artifact to verify it was written.

## Output Contract

- Outputs: Cited findings, source list, implementation implications, risks, unresolved questions, and recommended next role for context-management improvements.
- Evidence: Direct repository evidence is cited with path and line numbers. Native OpenCode capability evidence is cited to fetched documentation/schema URLs and section names; exact runtime behavior was not validated in a live OpenCode session.
- Artifact links:
  - `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/researcher/context-researcher-004-agent-context-management.md`

## Cited Findings

### Current context-management mechanisms in the repo

1. **Project-owned memory exists and is exposed to agents through instructions.** Direct evidence: `.memory` is defined as the project-owned surface for reusable references, orchestration indexes, delegation packets, role traces, validation evidence, synthesis outputs, and decisions, explicitly not as an official OpenCode native protocol (`.memory/protocols/memory-management.md:3-6`). The protocol defines memory levels for project, orchestration, delegation, role, validation, and decision memory (`.memory/protocols/memory-management.md:7-16`). `opencode.json` includes `AGENTS.md` and the memory protocol as native instruction files (`opencode.json:1-3`).

2. **Trace artifacts and summaries are required for every role, creating durable handoff context.** Direct evidence: the memory protocol requires each orchestration index to link retained role traces and requires every role output to include or reference a trace artifact (`.memory/protocols/memory-management.md:41-45`). It also requires each role to report input summary, output summary, artifact path, checks, limitations, and handoff notes (`.memory/protocols/memory-management.md:64-76`). The role trace template has `Input Contract`, `Work Performed`, `Output Contract`, and `Handoff` sections (`.memory/templates/role-trace-artifact.md:12-35`). The trace schema requires `inputContract`, `workPerformed`, `outputContract`, and `handoff`, including `routingMetadataStatus` and artifact links (`.opencode/schemas/memory-trace-artifact.schema.json:6-58`).

3. **DAG boundaries and repeatable scoped role instances limit context by task decomposition.** Direct evidence: the design says parent orchestration delegates, reviews evidence, asks for remediation, and accepts only after validator/artifact-verifier evidence (`opencode-harness.design.md:71-83`). `/delegate-orchestration` decomposes workflows into a DAG, parallelizes independent role instances, requires research before planning and validation before acceptance, and gives each role a scoped artifact ID/path (`.opencode/commands/delegate-orchestration.md:31-50`). The workflow repeats the same phase gates and scoped artifact-ID requirement (`.opencode/workflows/delegation-workflow.md:24-36`).

4. **Role output contracts enforce summaries and evidence but not budgets.** Direct evidence: the researcher input contract requires `sourceConstraints`, `freshnessRequirements`, `downstreamNeeds`, and `routingMetadataStatus`, and its output contract requires cited findings, source list, implications, risks, next role, and trace path (`.opencode/contracts/role-io-contracts.json:8-21`). Similar contracts exist for all roles, but the required fields do not include token budgets, source-count limits, artifact-first manifests, or stale-source checks (`.opencode/contracts/role-io-contracts.json:23-127`).

5. **Current prompts encourage complete context transfer, which is useful for correctness but risky for context-window load.** Direct evidence: the design requires delegated prompts to pass "complete task context" plus paths, contracts, schemas, trace artifact requirements, and routing metadata (`opencode-harness.design.md:77-80`). The delegation skill likewise tells the orchestrator to pass "full context, constraints, allowed paths, artifact expectations" and other metadata (`.opencode/skills/delegation-orchestrator/SKILL.md:25-33`). This is direct wording; the inference is that without a context envelope, large workflows may overfill subagent windows.

6. **Agents are isolated as subagents with conservative permissions, but they do not define native per-agent step limits or task delegation gates.** Direct evidence: each role agent uses `mode: subagent` and permission frontmatter, for example researcher has edit denied and bash/webfetch ask (`.opencode/agents/researcher.md:1-8`), and implementer has scoped edit/bash/webfetch asks (`.opencode/agents/implementer.md:1-8`). Role prompts require memory/contract/trace behavior (`.opencode/agents/researcher.md:20-26`). No inspected agent frontmatter includes `steps`, `permission.task`, `hidden`, `model`, `variant`, `temperature`, or context-related fields.

7. **Commands route most role work to subagents and keep the parent orchestration command out of subtask mode.** Direct evidence: role-specific command files set `agent` frontmatter, e.g. `/delegate-research` routes to `researcher` (`.opencode/commands/delegate-research.md:1-4`). The central command intentionally omits `agent` and sets `subtask: false` (`.opencode/commands/delegate-orchestration.md:1-8`). OpenCode docs state that a command with a subagent `agent` triggers subagent invocation by default, and `subtask` can force subagent behavior to avoid polluting primary context (OpenCode Commands docs, `Agent` and `Subtask` sections, fetched 2026-07-16).

8. **Lifecycle plugin telemetry is minimal and not context-aware.** Direct evidence: the local plugin adapter only imports and returns `HarnessLifecyclePlugin` (`.opencode/plugins/index.js:1-5`). The module logs one `session.start` reminder, blocks destructive `rm -rf` patterns against harness files, and has a no-op `message.after` hook (`.opencode/plugin-modules/harness-lifecycle.js:1-21`). There is no current hook for compaction, `session.compacted`, session resume/checkpoint telemetry, large tool-output warnings, or stale artifact detection.

9. **Restart guidance exists, but resume/checkpoint behavior is not formalized.** Direct evidence: the trust guide says OpenCode project files may require session reload or restart before newly added agents, commands, skills, plugins, or instructions are rediscovered (`.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md:1-4`) and recommends restart/reload after installing/updating harness assets (`.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md:19-21`). The current orchestration index records DAG nodes and statuses (`.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md:22-73`), but it does not include a dedicated resume checkpoint, session ID, latest accepted artifact, stale-source criteria, or "read this first" restart packet.

10. **The current memory index already demonstrates stale-index risk.** Direct evidence: the current orchestration index records a validation finding that top-level `.memory/INDEX.md` does not index this orchestration (`.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md:108-112`). The top-level memory index lists only earlier orchestrations under "Current orchestrations" (`.memory/INDEX.md:22-26`). This is not a runtime failure by itself, but it is evidence that artifact discovery can become stale without explicit index-maintenance gates.

### Native OpenCode capabilities relevant to improvements

11. **Native compaction can be configured.** Direct evidence from OpenCode docs: `opencode.json` supports `compaction.auto`, `compaction.prune`, and `compaction.reserved` to control automatic session compaction (OpenCode Config docs, `Compaction` section, fetched 2026-07-16). The fetched `https://opencode.ai/config.json` schema additionally exposes `compaction.tail_turns` and `compaction.preserve_recent_tokens`, plus `tool_output.max_lines` and `tool_output.max_bytes`. Current `opencode.json` has only schema, instructions, and permissions, with no `compaction`, `tool_output`, `subagent_depth`, or agent-level configuration (`opencode.json:1-9`).

12. **Native agents support bounded iteration and subagent routing controls.** Direct evidence from OpenCode Agents docs: agent config supports `steps`, which limits agentic iterations and forces a text summarization when reached; `permission.task`, which controls which subagents an agent can invoke; `subagent_depth`, which controls nested subagent depth; and `mode: subagent` agents. The same docs say subagents inherit the invoking primary model when no model is specified (OpenCode Agents docs, `Max steps`, `Task permissions`, `Subagent depth`, and `Model` sections, fetched 2026-07-16). Current role agents do not use these options.

13. **Native sessions can be compacted and resumed, but the harness does not bind those actions to `.memory`.** Direct evidence from OpenCode TUI docs: `/compact` compacts the current session, `/sessions` (`/resume`, `/continue`) switches sessions, and child sessions from subagents can be navigated from parent/child views (OpenCode TUI docs, `Commands` and `Usage` sections, fetched 2026-07-16). CLI docs expose `--continue`, `--session`, and `--fork` for TUI/run/attach, plus `opencode session list/delete`, export/import, and stats (OpenCode CLI docs, `tui`, `run`, and `session` sections, fetched 2026-07-16). No repo file currently records OpenCode session IDs or ties resume actions to orchestration memory.

14. **Plugins can customize compaction and observe session/message events.** Direct evidence from OpenCode Plugins docs: `experimental.session.compacting` can inject context into or replace the compaction prompt, and the event list includes `session.compacted`, `session.updated`, `message.part.updated`, and `message.part.removed` (OpenCode Plugins docs, `Compaction hooks` and `Events` sections, fetched 2026-07-16). Current plugin code does not use these hooks (`.opencode/plugin-modules/harness-lifecycle.js:1-21`).

15. **Native instructions can support lazy artifact retrieval.** Direct evidence from OpenCode Rules docs: instructions can reference additional files through `opencode.json`, and manual `AGENTS.md` guidance can tell agents to read referenced files on a need-to-know basis instead of preemptively loading all references (OpenCode Rules docs, `Custom Instructions` and `Manual Instructions in AGENTS.md` sections, fetched 2026-07-16). Current `opencode.json` loads only `AGENTS.md` and the memory protocol (`opencode.json:1-3`), while the harness protocol tells agents where memory lives but does not prescribe lazy retrieval beyond concise artifacts.

## Concrete Gaps and Opportunities

1. **No explicit per-agent/subagent context budget.** Evidence: role contracts and templates require summaries/evidence/handoffs, but not token budgets, max tool-output sizes, source-count limits, or "read only these artifacts first" fields (`.opencode/contracts/role-io-contracts.json:8-127`; `.memory/templates/role-trace-artifact.md:12-35`). Opportunity: add a role/context envelope to delegation packets and trace artifacts with `contextBudget`, `sourceBudget`, `toolOutputBudget`, and `handoffBudget` fields.

2. **"Complete/full context" language can defeat artifact-first delegation.** Evidence: design and skill require complete/full context transfer (`opencode-harness.design.md:77-80`; `.opencode/skills/delegation-orchestrator/SKILL.md:25-33`). Opportunity: redefine "complete context" as a compact context envelope plus artifact links, not pasted transcripts; require roles to read the orchestration index and only the artifacts/sources named by the packet.

3. **Handoff summaries are generic rather than restart-ready.** Evidence: memory protocol requires input/output summaries and handoff notes (`.memory/protocols/memory-management.md:64-74`) but not a fixed restart packet with active DAG node, last accepted artifact, next role, blockers, stale-if rules, and validation status. Opportunity: add a `Resume Checkpoint` section to orchestration indexes or a dedicated `resume.md` under each orchestration.

4. **Compaction is available natively but not harness-aware.** Evidence: current `opencode.json` omits compaction/tool-output config (`opencode.json:1-9`); plugin code omits compaction hooks (`.opencode/plugin-modules/harness-lifecycle.js:1-21`); OpenCode docs/schema support compaction and plugin compaction hooks. Opportunity: use native `compaction` settings and an `experimental.session.compacting` plugin hook to inject the active orchestration checkpoint, latest role artifact links, and validation status into compaction summaries.

5. **Stale-context prevention is mostly manual.** Evidence: trace artifacts have `createdAt` and evidence fields but no required source hash, line range, file mtime, git commit, or supersession metadata (`.opencode/schemas/memory-trace-artifact.schema.json:6-58`). Researcher input has `freshnessRequirements` (`.opencode/contracts/role-io-contracts.json:8-15`), but downstream contracts do not require source freshness proof. Opportunity: require source lists to include path/URL, line range or section, retrieval date, and optional content hash or git revision; validators can flag artifacts when cited files changed after artifact creation.

6. **Plugin telemetry does not help agents manage context windows.** Evidence: plugin only logs load reminder and destructive-command guardrail (`.opencode/plugin-modules/harness-lifecycle.js:5-13`). Opportunity: add guardrail-only warnings for missing `orchestration-id`, missing trace path in `/delegate-*` prompts, unusually large tool outputs, compaction events, and stale/missing orchestration index links. Treat these as telemetry, not acceptance proof, consistent with design (`opencode-harness.design.md:139-147`).

7. **Subagent recursion and step bounds are not explicit in project config or role frontmatter.** Evidence: role agents are subagents with permissions but no `steps` or `permission.task` settings (`.opencode/agents/*.md`); `opencode.json` omits `subagent_depth` (`opencode.json:1-9`). Opportunity: set conservative role-specific `steps` values and deny role-to-role `task` invocation in subagents unless a future orchestrator role explicitly requires it; optionally set project `subagent_depth` to preserve parent-owned delegation.

8. **Reviewer and synthesizer lack command wrappers despite being fixed roles.** Evidence: fixed role names include `reviewer` and `synthesizer` in the design (`opencode-harness.design.md:7-18`) and routing matrix (`.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md:15-18`), but the manifest lists command wrappers only for research, orchestration, plan, implement, integrate, validate, and artifact-verify (`.opencode/harness.manifest.json:22-28`). Opportunity: if future planners decide command parity matters, add thin `/delegate-review` and `/delegate-synthesize` prompts so review/synthesis can stay in child contexts instead of being done inline by the parent.

## Recommended Improvements Beyond Current Design

1. **Introduce a context envelope for every delegation packet.** Suggested fields: `scope`, `contextBudget`, `sourceBudget`, `requiredArtifacts`, `optionalArtifacts`, `doNotLoadUnlessNeeded`, `freshnessRequirement`, `staleIf`, `handoffBudget`, and `expectedTracePath`. This keeps complete context discoverable while avoiding transcript pasting.

2. **Revise role trace/template/contracts to be artifact-first.** Add sections such as `Context Intake`, `Sources Consumed`, `Line Ranges / Retrieval Dates`, `Supersedes`, `Stale If`, and `Minimal Handoff Digest`. Keep full evidence in artifacts; pass links and concise digests downstream.

3. **Make orchestration indexes restart/resume checkpoints.** Add an index section or `.memory/orchestrations/<id>/resume.md` with active DAG node, dependencies satisfied, latest artifact per role, next role, last validator status, blockers, open questions, and stale-source alerts. On resume, agents should read this checkpoint before broader memory.

4. **Use native context controls deliberately after planning.** Consider validated changes to `opencode.json`/agent frontmatter for `compaction`, `tool_output`, `subagent_depth`, role `steps`, and role `permission.task`. Keep these native keys in OpenCode config/agent frontmatter rather than inventing non-native `opencode.json` fields.

5. **Add harness-aware compaction telemetry.** Extend `.opencode/plugin-modules/harness-lifecycle.js` with guardrail-only `experimental.session.compacting` context injection and `session.compacted` logging. Inject only non-secret, concise checkpoint data: orchestration ID, active node, artifact links, next role, and validation status.

6. **Add stale-context validation rules.** Have role artifacts record source paths/URLs, retrieval dates, and optional git revision/hash. Have validator/integrator checks flag artifacts whose cited files changed after artifact creation or whose docs freshness requirement has expired.

7. **Shift prompt wording from "full context" to "full context manifest".** Update command/skill/workflow language in a future implementation so delegated roles receive a manifest and retrieve artifacts on demand. This aligns with OpenCode Rules guidance for lazy external-file loading and avoids loading every memory artifact into every subagent.

8. **Keep plugin output non-authoritative.** Any context warnings, compaction summaries, or stale-source telemetry should remain guardrails. Acceptance should continue to come from validator/artifact-verifier evidence, consistent with the design and memory protocol (`opencode-harness.design.md:139-147`; `.memory/protocols/memory-management.md:55-62`).

## Implementation Implications

- Likely affected files for a future planner: `opencode-harness.design.md`, `.memory/protocols/memory-management.md`, `.memory/templates/role-trace-artifact.md`, `.memory/templates/orchestration-index.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.opencode/commands/delegate-*.md`, `.opencode/skills/delegation-orchestrator/SKILL.md`, `.opencode/skills/delegation-orchestrator/references/*.md`, `.opencode/agents/*.md`, `.opencode/plugin-modules/harness-lifecycle.js`, `opencode.json`, and `.opencode/scripts/validate-harness.mjs`.
- Native config additions must be validated against `https://opencode.ai/config.json` and should avoid harness-owned non-native keys in `opencode.json`.
- Plugin compaction hooks are documented as experimental; implementation should be small, defensive, and covered by validator checks but not treated as acceptance proof.

## Risks and Unresolved Uncertainty

- The exact runtime event payloads for compaction/session hooks were researched from docs/schema, not verified in a live OpenCode restart.
- Aggressive `tool_output` truncation or compaction pruning can hide evidence if role artifacts do not capture source links and command summaries before truncation.
- Per-agent `steps` limits can force early summaries before a role completes; budgets need role-specific tuning.
- Explicit `permission.task`/`subagent_depth` restrictions could conflict with future recursive delegation designs if the parent itself is configured as a subagent.
- Source hashing and stale detection add overhead and need privacy-safe handling to avoid storing secrets or machine-local private paths.
- The top-level `.memory/INDEX.md` currently does not index this orchestration, so artifact discovery remains partially stale until a downstream role with write scope updates it.

## Source List

- `opencode-harness.design.md`
- `opencode.json`
- `AGENTS.md`
- `.memory/protocols/memory-management.md`
- `.memory/templates/role-trace-artifact.md`
- `.memory/templates/orchestration-index.md`
- `.memory/INDEX.md`
- `.memory/references/opencode-refs.md`
- `.memory/orchestrations/2026-07-16-harness-design-inspection/INDEX.md`
- `.memory/orchestrations/2026-07-16-harness-design-inspection/roles/implementer/root-implementer-001-memory-index.md`
- `.opencode/contracts/role-io-contracts.json`
- `.opencode/schemas/memory-trace-artifact.schema.json`
- `.opencode/schemas/role-io-contracts.schema.json`
- `.opencode/workflows/delegation-workflow.md`
- `.opencode/workflows/validation-workflow.md`
- `.opencode/commands/delegate-orchestration.md`
- `.opencode/commands/delegate-research.md`
- `.opencode/commands/delegate-plan.md`
- `.opencode/commands/delegate-implement.md`
- `.opencode/commands/delegate-integrate.md`
- `.opencode/commands/delegate-validate.md`
- `.opencode/commands/delegate-artifact-verify.md`
- `.opencode/agents/*.md`
- `.opencode/skills/delegation-orchestrator/SKILL.md`
- `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md`
- `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md`
- `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
- `.opencode/skills/opencode-skill-authoring/SKILL.md`
- `.opencode/skills/opencode-workflow-guidance/SKILL.md`
- `.opencode/plugins/index.js`
- `.opencode/plugin-modules/harness-lifecycle.js`
- `.opencode/routing/harness-model-routing.json`
- `.opencode/routing/resolve-model-routing.mjs`
- `.opencode/harness.manifest.json`
- OpenCode Config docs, fetched 2026-07-16: `https://opencode.ai/docs/config`
- OpenCode config schema, fetched 2026-07-16: `https://opencode.ai/config.json`
- OpenCode Agents docs, fetched 2026-07-16: `https://opencode.ai/docs/agents`
- OpenCode Commands docs, fetched 2026-07-16: `https://opencode.ai/docs/commands`
- OpenCode Plugins docs, fetched 2026-07-16: `https://opencode.ai/docs/plugins`
- OpenCode CLI docs, fetched 2026-07-16: `https://opencode.ai/docs/cli`
- OpenCode TUI docs, fetched 2026-07-16: `https://opencode.ai/docs/tui`
- OpenCode Rules docs, fetched 2026-07-16: `https://opencode.ai/docs/rules`

## Handoff

- Next role: planner.
- Limitations: Research only; no runtime/config/workflow files were changed. Web documentation was fetched but live OpenCode behavior, plugin hook payloads, and restart/resume flows were not executed. This artifact itself is not indexed in the current orchestration index because write scope was limited to the researcher trace artifact.
- Risks: Downstream planning should avoid overfitting to experimental plugin hooks, validate all native config keys against the schema, preserve absent routing metadata, and require validator evidence before accepting any implementation.
