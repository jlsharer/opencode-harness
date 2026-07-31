# Synthesizer Trace Artifact: Agentic Protocol Hooks Final Design

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks`
- role: `synthesizer`
- artifactId: `root-synthesizer-004-final`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research artifact `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`, planner artifact `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`, orchestration index, stated boundary constraints, and requested final design recommendations for an agentic protocol-injection hook system.
- Required context present: orchestration id, role outputs, conflicts/decisions to resolve, assumptions, routing metadata status, expected artifact path, and resolved routing decision were supplied.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Consolidated supplied research and planning evidence into a final design recommendation. No runtime implementation files were edited and no validation acceptance evidence was produced or replaced.
- Files read:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.opencode/contracts/role-io-contracts.json`
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
- Commands/checks:
  - `ls ".memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles"`
  - `mkdir -p ".memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer" && python3 - <<'PY' ... PY`

## Output Contract

- Outputs: resolvedConclusions, tradeoffs, assumptions, recommendedDecision, remainingQuestions, and implementation-ready design summary are provided below.
- Evidence: Conclusions are grounded only in the cited researcher and planner artifacts. The researcher found the existing OpenCode plugin adapter/module boundary, documented OpenCode and Claude hook capabilities, and repo constraints forbidding `.claude`, `.agents`, or `.codex` runtime dependencies. The planner translated those findings into a segmented core/OpenCode/Claude adapter architecture, timing rules, registry, ledger, tests, validation gates, and open risks.
- Artifact links:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`

### Resolved Conclusions

1. **Adopt the planner architecture with one boundary clarification:** implement a host-neutral core plus OpenCode delivery module under `.opencode/plugin-modules/`; keep `.opencode/plugins/index.js` as a thin import/merge adapter only; represent Claude support as adapter/spec/export helpers and documentation, not as committed `.claude` runtime configuration.
2. **Use pre-tool edit/write delivery as v1's primary behavior.** Research supports OpenCode `tool.execute.before` and Claude `PreToolUse`; planner correctly identifies this timing as the only point likely to influence the immediate mutation before it occurs.
3. **Keep post-tool behavior optional and non-blocking in v1.** Ship only if straightforward after pre-tool support; otherwise defer. If present, it should emit verification reminders/ledger entries only and must not claim validation or acceptance.
4. **Do not rely on chat/system transform hooks for v1.** Research noted OpenCode shape uncertainty for chat/system transforms. Use them later only after runtime/API confirmation and only for low-frequency, non-acceptance reminders.
5. **Use a declarative protocol registry and pure classifier/policy tests before hook wiring.** This minimizes host drift and makes Playwright page-object/spec/fixture protocol selection testable without depending on live OpenCode or Claude sessions.
6. **Make noise controls and telemetry mandatory, not optional.** Dedupe, per-call/session caps, opt-out, dry-run, and redacted JSONL ledger entries are required to prevent reminder fatigue and privacy leaks.
7. **Validation remains external to hooks.** Hook ledger entries and notices are telemetry/guardrails only; final acceptance still requires validator evidence such as `node .opencode/scripts/validate-harness.mjs` and future node tests.

### Design Tradeoffs

- **Common core vs host-specific implementations:** A shared core reduces duplicated logic and keeps Claude/OpenCode behavior aligned, but adapters must still handle different hook semantics and available fields.
- **Pre-tool injection vs post-tool reminders:** Pre-tool reminders best influence edits before mutation, but depend on reliable tool argument inspection/mutation behavior. Post-tool reminders are safer but less preventive and should not block.
- **Visible reminders vs noise:** Visible notices help users follow protocols, but too many become counterproductive. Strict default caps, dedupe windows, dry-run, and opt-out should ship in the initial design.
- **Relative path logging vs hashing:** Relative paths improve diagnosability; hashing improves privacy. The final contract should permit either but forbid secrets, full prompts, and raw tool payload capture.
- **Claude compatibility vs repo runtime purity:** Claude settings are naturally `.claude/*`, but this harness must not depend on `.claude`. Export/spec documentation preserves compatibility without violating repo boundaries.
- **Blocking behavior vs guardrail posture:** Blocking could enforce critical safety rules, but no supplied evidence justifies it for v1. Initial decisions should be `inject`, `notice-only`, `suppress`, and `dry-run`; reserve `block` for a later explicitly approved guardrail.

### Assumptions

- Future implementation is allowed to add new harness-owned files under `.opencode/plugin-modules/`, `.opencode/protocols/`, `.opencode/schemas/`, and docs/tests if manifest and validation are updated.
- OpenCode `tool.execute.before` and `tool.execute.after` expose enough tool name/argument data for classification; exact mutation/notice semantics still need runtime confirmation.
- Ledger writes under `.memory/` are acceptable if redacted, append-only, deterministic enough for tests, and not treated as validation evidence.
- Playwright file classification can begin with path/import/export heuristics and tests, while accepting known false-positive/false-negative risk.

### Recommended Decision

Proceed with a **v1 design based on host-neutral decision logic and OpenCode pre-tool delivery**, with Claude support limited to adapter/spec/export documentation. Implement in this order when runtime edits are later approved:

1. Confirm installed OpenCode hook names and input/output semantics for `tool.execute.before` and `tool.execute.after`.
2. Add `.opencode/plugin-modules/agentic-protocol-core.js` with pure normalization, classification, registry selection, noise policy, reminder rendering, ledger entry shaping, and summary helpers.
3. Add `.opencode/protocols/agentic-micro-protocols.json` and, if implemented, `.opencode/schemas/agentic-micro-protocols.schema.json` with closed deterministic contracts.
4. Add tests for core behavior, Playwright classification, dedupe/session caps, dry-run/opt-out, and ledger redaction.
5. Add `.opencode/plugin-modules/agentic-protocol-hooks.js` for OpenCode `tool.execute.before` primary delivery and optional non-blocking `tool.execute.after`.
6. Update `.opencode/plugins/index.js` only to import and merge the new plugin module.
7. Add `.opencode/plugin-modules/claude-protocol-adapter.js` plus harness-owned docs for generating/using Claude hook config outside repo runtime dependencies.
8. Update manifest, design docs, validation workflow, and validation script. Run `node .opencode/scripts/validate-harness.mjs`, node tests, and a manual smoke test after restarting OpenCode.

### Remaining Questions

1. What exact object shape and return/mutation semantics does the installed OpenCode runtime provide for `tool.execute.before` and `tool.execute.after`?
2. Should v1 include `tool.execute.after` verification reminders, or defer them until pre-tool behavior is proven useful and low-noise?
3. Should ledger `filePathHashOrRelativePath` default to relative paths, hashes, or a configurable mode?
4. Where should the active orchestration id be discovered from at runtime, if at all, and what fallback ledger path should be used when it is unknown?
5. Which opt-out interface is acceptable for operators: environment variables only, registry/config flags, or both?
6. What minimum Claude export surface is desired: documented JSON snippets, generated hook handler scripts, or pure conversion helpers only?

### Implementation-Ready Design Summary

Build an agentic micro-protocol hook system as a segmented OpenCode harness feature. The core should be host-neutral and pure: normalize tool events, classify action/file kind/language/risk, select declarative protocols from a closed registry, apply dedupe/session/noise/opt-out/dry-run policies, render one concise reminder, and shape redacted ledger entries. The OpenCode adapter should live under `.opencode/plugin-modules/agentic-protocol-hooks.js`, use `tool.execute.before` for edit/write reminders, optionally use `tool.execute.after` for non-blocking verification notes, and expose summaries/ledger metrics as telemetry only. `.opencode/plugins/index.js` remains the sole auto-loaded local plugin and only imports/merges modules. Claude support should reuse the same core through a pure adapter/export spec and harness-owned docs, without committing or requiring `.claude/*`. Include Playwright page-object/spec/fixture protocols, strict default noise controls, redacted append-only JSONL telemetry, tests for pure logic and adapters, manifest/docs/validation updates, and validator command evidence before acceptance.

## Handoff

- Next role: `reviewer` or `validator` per orchestration DAG; validator evidence is required before acceptance.
- Limitations: Synthesis used only supplied research and planner artifacts plus contract/index/schema files. No reviewer artifact was supplied in this packet, no runtime files were edited, and no validation commands beyond artifact-writing setup were run.
- Risks: OpenCode hook API shape remains unconfirmed; Claude/OpenCode semantic drift may require adapter adjustments; classifier heuristics may misclassify unconventional Playwright layouts; reminders can become noisy without strict defaults; ledger privacy requirements need enforcement in tests and validation.
