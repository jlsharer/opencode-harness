# Planner Trace Artifact: Agentic Protocol Hooks Design Doc Plan

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks-design-doc`
- role: `planner`
- artifactId: `root-planner-002-doc-plan`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to plan a design-only edit adding the accepted agentic protocol hook design to `opencode-harness.design.md`, including a hierarchical protocol registry with deterministic loading and injection order. Inputs included the researcher artifact, existing design document, prior accepted design artifacts, current orchestration index, absent caller routing metadata status, and resolved `/delegate-planner` routing decision.
- Required context present: orchestration id, approved goal, scope boundaries, research evidence, exact deliverable paths, constraints, acceptance criteria, role contract catalog, trace schema, memory protocol, current orchestration index, and allowed planner trace artifact path were available.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Converted the research evidence and prior accepted hook-design artifacts into a bounded document-edit plan with exact insertion point, section headings, registry order semantics, file contracts, implementation handoff, dependencies, and verification gates. No runtime implementation files were edited.
- Files read:
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/protocols/memory-management.md`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/INDEX.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
  - `opencode-harness.design.md`
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/planner/root-planner-002-doc-plan.md`
- Commands/checks:
  - `ls ".memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles"`
  - `mkdir -p ".memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/planner" && python3 - <<'PY' ... PY`

## Output Contract

- Outputs: orderedPlan, fileContracts, dependencies, verificationGates, assumptions, handoffNotes, and traceArtifactPath are provided below.
- Evidence: The plan cites the current design doc location of `## Lifecycle Guardrails` before `## Manifest`, the researcher recommendation to insert the new top-level section there, and prior accepted artifacts requiring host-neutral core, OpenCode segmented plugin boundary, Claude docs/export boundary, pre-tool primary timing, optional non-blocking post-tool timing, Playwright examples, noise controls, redacted telemetry, and validator evidence as the acceptance boundary.
- Artifact links:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/planner/root-planner-002-doc-plan.md`

### Ordered Plan

1. **Edit only the design document section first.**
   - Target path: `opencode-harness.design.md`.
   - Exact insertion point: insert a new top-level section after the existing `## Lifecycle Guardrails` section, immediately after the paragraph ending `node .opencode/scripts/validate-harness.mjs.` and before the existing `## Manifest` heading.
   - New top-level heading: `## Agentic Protocol Hooks`.
   - Keep wording design-oriented: describe an accepted/future design, not an already implemented runtime feature.

2. **Add these subsection headings in this order under `## Agentic Protocol Hooks`.**
   1. `### Architecture and Boundaries`
   2. `### Event Timing and Classification`
   3. `### Hierarchical Protocol Registry`
   4. `### Deterministic Selection and Injection Order`
   5. `### Playwright Protocol Examples`
   6. `### Telemetry, Privacy, and Noise Controls`
   7. `### OpenCode and Claude Boundary`
   8. `### Future Implementation and Validation Gates`
   9. `### Residual Risks`

3. **Add concise architecture content.**
   - State that the design uses a host-neutral core for event normalization, file/action classification, registry selection, noise policy, reminder rendering, ledger-entry shaping, and summaries.
   - State that future OpenCode delivery belongs in segmented modules under `.opencode/plugin-modules/`, with `.opencode/plugins/index.js` remaining the only auto-loaded local plugin and a thin import/merge adapter.
   - State that hooks are guardrails and telemetry only; validator/artifact-verifier evidence remains the acceptance boundary.
   - State that runtime implementation files are not being added by this doc edit.

4. **Add event timing and classification content.**
   - Pre-tool edit/write hooks are the v1 primary delivery point for actionable reminders before mutation.
   - Post-tool behavior is optional and non-blocking, limited to verification notes or summaries, and never acceptance proof.
   - Read-only tools do not inject reminders by default.
   - Bash/command tools may classify tests, codegen, destructive operations, and delegation/validation commands for notices/metrics, but must not interfere with validation commands.
   - Chat/system transforms are not a v1 dependency and require later API confirmation before use.
   - Classification should normalize host, phase, tool/action kind, relative path/path bucket, language, file kind, risk tags, session/call ids, and raw shape version without logging full prompts or raw command payloads.

5. **Define the hierarchical registry model.**
   - Document the future registry as a closed, deterministic, secret-free registry, e.g. `.opencode/protocols/agentic-micro-protocols.json` if later implemented.
   - Required conceptual fields:
     - `schemaVersion`
     - `packs[]`
     - pack: `{ id, order, enabledByDefault, layers[] }`
     - layer: `{ id, order, scope, groups[] }`
     - group: `{ id, order, match, protocols[] }`
     - protocol: `{ id, order, title, severity, timing, match, message, dedupeKeyTemplate, maxPerSession, enabledByDefault }`
   - Hierarchy semantics:
     - **Packs** are explicit configured registry packs, not unsorted filesystem discovery. Example packs: `harness-core`, `playwright`.
     - **Layers** organize broad applicability. Recommended stable layer categories: `global`, `role-or-workflow`, `domain`, `file-kind`, and `phase-or-action`.
     - **Groups** scope related protocols within a layer, such as `naming`, `playwright-page-objects`, `playwright-specs`, `playwright-fixtures`, or `validation-commands`.
     - **Protocols** are the smallest rendered reminder candidates.

6. **Define deterministic load and selection order.**
   - Registry load order:
     1. Load only explicit configured registry paths/packs.
     2. Validate schema before use.
     3. Reject or disable invalid packs without partial nondeterministic ordering; the design should prefer fail-closed for malformed committed registries and ignore-disabled for explicitly disabled packs.
     4. Sort packs by numeric `pack.order`, then stable `pack.id`.
     5. Within each pack, sort layers by numeric `layer.order`, then stable `layer.id`.
     6. Within each layer, sort groups by numeric `group.order`, then stable `group.id`.
     7. Within each group, sort protocols by numeric `protocol.order`, then stable `protocol.id`.
   - Per-hook evaluation order:
     1. Normalize the host event.
     2. Classify action kind, file kind, language, risk tags, and safe relative path/path bucket.
     3. Evaluate packs, layers, groups, and protocols in the loaded stable hierarchy order.
     4. Filter disabled or nonmatching candidates.
     5. Rank/render candidates by hierarchy order first; use specificity only as a documented suppression/preference rule inside the same applicable set, not as an unstable reorder. When two candidates are otherwise equal, use stable protocol id as final tie-breaker.
     6. Apply dedupe, per-tool, per-protocol, and per-session caps in the same stable order.
     7. Render visible reminders up to the configured maximum and ledger evaluated/injected/suppressed decisions in stable order.

7. **Define multiple-protocol behavior for one file/hook.**
   - State that more than one protocol can apply to the same hook event.
   - Stable behavior: apply general protocols first, then increasingly specific protocols by the hierarchy order: global/file naming standards before domain or file-kind protocols, then action/phase-specific protocols.
   - Example to include: creating a Playwright page object can receive both a general file naming protocol and a Playwright page-object locator/method protocol. The naming reminder is evaluated/rendered first because it belongs to a broader earlier layer/group; the page-object locator protocol follows if visible caps allow. If only one visible reminder is allowed for the tool call, the more specific page-object protocol may be rendered while the generic naming protocol is ledgered as collapsed/suppressed with a summary reason, but this rule must be deterministic and documented.

8. **Define precedence, caps, and summary/collapse behavior.**
   - Default visible caps to document:
     - `maxVisiblePerToolCall`: `1` initially for low noise.
     - `maxVisiblePerSession`: `8`.
     - `maxPerProtocolPerSession`: `3`.
   - If the section discusses an expanded cap, state that future implementation may raise `maxVisiblePerToolCall` to `2` only after fixture-backed precision is proven.
   - Candidate precedence:
     1. registry pack order
     2. layer order
     3. group order
     4. protocol order
     5. stable protocol id tie-breaker
   - Specificity/collapse behavior:
     - When visible caps are exceeded, prefer the most specific candidate for the current file/action within a deterministic collapse policy.
     - Ledger suppressed candidates with reasons such as `tool-limit`, `session-limit`, `protocol-disabled`, `dedupe-window`, `dry-run`, `path-ignore`, `host-unsupported`, or `collapsed-by-more-specific`.
     - Use summaries like: `[harness protocol] 2 additional applicable reminders collapsed; see ledger summary`.
     - Summaries and ledgers are telemetry only and not validation evidence.

9. **Add Playwright examples.**
   - Page object classification: `**/pages/**/*.ts`, `**/*.page.ts`, `**/*.po.ts`, class names ending in `Page`, or locator/action helper exports.
   - Page object reminder content: stable intent-level methods, private selectors, role/test-id locators, avoid assertions except invariant waits, and update affected specs when method contracts change.
   - Spec classification: `**/*.spec.ts`, `**/*.test.ts`, `tests/e2e/**`, or imports from `@playwright/test`.
   - Spec reminder content: assert user-visible behavior, avoid duplicating page-object selectors, keep setup in fixtures, prefer resilient locators, and run focused Playwright checks for changed flows.
   - Fixture classification: `**/fixtures/**/*.ts`, `**/*.fixture.ts`, or Playwright `test` extension.
   - Fixture reminder content: deterministic isolation, no hidden cross-test state, explicit worker/test scope, and teardown preservation.

10. **Add telemetry/privacy content.**
    - Redacted append-only JSONL ledger is a future implementation detail under project-owned `.memory/` only if implemented; exact default path remains a future validation decision.
    - Ledger/metrics fields should be limited to sanitized identifiers: timestamp, host, session/call ids, phase, tool/action kind, relative path or path hash, file kind, protocol id, severity, decision, suppression reason, dry-run flag, and message id.
    - Forbid provider tokens, secrets, full prompts, raw file contents, full shell commands, private absolute paths, and user auth paths.
    - Include dry-run and opt-out concepts such as `OPENCODE_HARNESS_PROTOCOL_DRY_RUN=1` and `OPENCODE_HARNESS_PROTOCOL_HOOKS=0` as future/operator controls.

11. **Add OpenCode/Claude boundary content.**
    - OpenCode is the implementation target for this harness surface.
    - Claude compatibility, if pursued later, is adapter/spec/export documentation only and must not add committed `.claude` settings or runtime dependency on `.claude`, `.agents`, or `.codex`.
    - Prior projection directories may be reference material only, never runtime dependencies.

12. **Add validation gates and residual risks content.**
    - Future implementation gates: confirm OpenCode hook names and mutation/notice semantics; test pure core before hook wiring; schema-validate registry; test Playwright classification and deterministic hierarchy ordering; test noise caps/collapse; test ledger redaction; confirm `.opencode/plugins/index.js` stays the sole auto-loaded local plugin; run harness validation.
    - Doc-change validation gates: see `### Verification Gates` below.
    - Residual risks: OpenCode hook API shape unconfirmed; pre-tool reminder delivery may not safely mutate model-visible context; classifier false positives/negatives; reminder fatigue; ledger privacy/retention path choice unresolved; Claude/OpenCode semantic drift.

13. **Update memory indexes only as needed.**
    - Target path: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md` may be updated by the implementer to mark planner complete and implementation in progress/complete if the orchestration convention is being maintained during the edit.
    - Target path: `.memory/INDEX.md` should be updated only if the project convention requires listing this new orchestration and retained trace artifacts. If edited, add only relative links for this orchestration and generated role artifacts; do not change static protocol semantics.

### File Contracts

| Path | Contract | Allowed change |
| --- | --- | --- |
| `opencode-harness.design.md` | Root design document. Add one new top-level `## Agentic Protocol Hooks` section after `## Lifecycle Guardrails` and before `## Manifest`. Content must be concise, design-only, and consistent with existing harness boundaries. | Required implementation edit. |
| `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md` | Current orchestration index. Maintains DAG, role artifact links, validation evidence, and decisions. | Optional/expected orchestration-status update only; no scope expansion. |
| `.memory/INDEX.md` | Project memory index. Lists current orchestrations and retained trace artifacts. | Conditional update only if required by repo convention; add relative links for this orchestration/artifacts without altering protocol rules. |
| `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/implementer/root-implementer-003-design-doc.md` | Implementer trace artifact. Must follow role I/O contract and trace schema template. | Required for implementer handoff. |
| `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/validator/root-validator-004-final.md` | Validator trace artifact. Must include command-backed acceptance matrix after implementation. | Created by validator, not implementer unless separately delegated. |
| `.opencode/plugins/index.js`, `.opencode/plugin-modules/*`, `.opencode/protocols/*`, `.opencode/schemas/*`, `.claude/*`, `.agents/*`, `.codex/*` | Runtime/plugin/protocol/schema/prior-host surfaces. | Do not edit for this design-doc task. Mention only as design boundaries/reference material where appropriate. |

### Dependencies

1. Research artifact `root-researcher-001-doc-target` must remain the evidence source for insertion point and constraints.
2. Prior accepted artifacts under `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/` must remain source evidence for accepted architecture, timing, Playwright examples, telemetry/privacy, and risks.
3. Implementer must complete `opencode-harness.design.md` edit before validator runs.
4. Validator evidence is required before orchestration acceptance; lifecycle hooks/telemetry are not acceptance proof.
5. No integration role is required unless implementation changes `.memory/INDEX.md` or the validator finds cross-artifact inconsistencies.

### Verification Gates

The validator should run or inspect the following after implementation:

1. `node .opencode/scripts/validate-harness.mjs`
2. Markdown/content checks on `opencode-harness.design.md` confirming:
   - `## Agentic Protocol Hooks` exists after `## Lifecycle Guardrails` and before `## Manifest`.
   - All planned subsection headings exist.
   - Hierarchical registry terms `packs`, `layers`, `groups`, and `protocols` are present.
   - Deterministic order includes pack order, layer order, group order, protocol order, and stable id tie-breaker.
   - Multiple-protocol behavior includes the Playwright page-object example with general naming plus page-object locator/method protocol in stable order.
   - Visible reminder caps, collapse/summary behavior, and ledger suppression reasons are documented.
   - Hooks are described as guardrails/telemetry only, not acceptance proof.
   - Claude support is docs/export/spec-only and no runtime dependency on `.claude`, `.agents`, or `.codex` is introduced.
3. File-scope checks confirming no runtime implementation files were edited for this task, especially no changes under `.opencode/plugin-modules/`, `.opencode/plugins/`, `.opencode/protocols/`, `.opencode/schemas/`, `.claude/`, `.agents/`, or `.codex/` unless separately authorized.
4. If `.memory/INDEX.md` or the current orchestration `INDEX.md` is edited, verify links are relative, artifact paths exist, and routing metadata status remains `absent` without invented caller labels.
5. `git diff -- opencode-harness.design.md .memory/INDEX.md .memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc` should show only the intended doc/memory changes.

### Assumptions

- The accepted design can be documented in the root design doc before runtime implementation exists.
- A future implementation may add registry/plugin/schema files only through a separate implementation plan and validation cycle.
- The exact OpenCode hook mutation/notice semantics remain unconfirmed and must be retained as a future validation gate.
- Caller routing metadata was absent; preserve that status and do not invent enriched routing labels.

### Handoff Notes

#### Exact handoff instructions for implementer

You are the `implementer` for orchestration `2026-07-28-agentic-protocol-hooks-design-doc`.

- Use this plan and the researcher artifact as your approved implementation scope.
- Edit `opencode-harness.design.md` only by inserting `## Agentic Protocol Hooks` after `## Lifecycle Guardrails` and before `## Manifest`, using the subsection order and content requirements in this artifact.
- Keep the section concise and design-only. Do not claim runtime hooks, registry files, or Claude artifacts already exist.
- Preserve `.opencode/plugins/index.js` as the only auto-loaded local plugin boundary in the wording.
- Preserve hooks as guardrails/telemetry only; validator or artifact-verifier evidence remains required for acceptance.
- Do not edit runtime implementation files: `.opencode/plugins/index.js`, `.opencode/plugin-modules/*`, `.opencode/protocols/*`, `.opencode/schemas/*`, `.claude/*`, `.agents/*`, or `.codex/*`.
- Do not add a runtime dependency on `.claude`, `.agents`, or `.codex`; mention `.agents/` and `.codex/` only as reference material if needed, and `.claude` only as a non-dependency/export boundary.
- If you update `.memory/INDEX.md`, add only the current orchestration/artifact relative links required by project memory convention.
- Write your trace artifact at `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/implementer/root-implementer-003-design-doc.md` and include changed files, rationale, commands/checks run, limitations, and handoff notes.
- Self-check before handoff: run `node .opencode/scripts/validate-harness.mjs` if feasible and inspect the diff for the planned insertion order and forbidden path changes.

#### Next role

- Next role: `implementer`.
- After implementation: delegate `validator` for `root-validator-004-final` with the verification gates above.
- Limitations: This planner artifact does not perform implementation or final validation.
- Risks: Overlong design-doc text, implying unimplemented runtime behavior, unsafe ledger defaults, or treating hooks as acceptance proof would violate the accepted design boundaries.

## Handoff

- Next role: `implementer`
- Limitations: Planning only. No runtime implementation files or root design document were edited by this role. No final validation was performed.
- Risks: Future implementation still depends on unconfirmed OpenCode hook semantics, low-noise defaults, safe reminder delivery, and ledger privacy/retention decisions.
- Trace artifact path: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/planner/root-planner-002-doc-plan.md`
