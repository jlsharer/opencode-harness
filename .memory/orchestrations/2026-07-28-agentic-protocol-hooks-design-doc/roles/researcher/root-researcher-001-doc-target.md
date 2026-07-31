# Researcher Trace Artifact: Agentic Protocol Hooks Design Doc Target

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks-design-doc`
- role: `researcher`
- artifactId: `root-researcher-001-doc-target`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research where and how to add a design-document section for the accepted agentic protocol hook design, including the requested modification for a hierarchical protocol registry with deterministic load/injection order within each hook.
- Required context present: orchestration id, scoped research questions, relevant paths, source constraints, downstream planner needs, role contract catalog, trace schema, current orchestration index, prior accepted orchestration artifacts, allowed trace artifact path, and resolved routing decision were supplied.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Read the current design document structure, current orchestration index, role contract/schema, and prior accepted agentic-protocol hook artifacts. No runtime implementation files were edited.
- Files read:
  - `opencode-harness.design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/reviewer/root-reviewer-003-risk.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/validator/root-validator-005-evidence.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`
- Commands/checks:
  - `ls ".memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc" && mkdir -p .../roles/researcher && python3 - <<'PY' ... PY`

## Output Contract

- Outputs: citedFindings, sourceList, implementationImplications, risks, unresolvedQuestions, recommendedNextRole, and traceArtifactPath are provided below.
- Evidence: Findings distinguish direct evidence from inference and cite file/line references from the existing design document, current orchestration index, prior accepted artifacts, role contract, and trace schema.
- Artifact links:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`

### Cited Findings

1. **Design document structure and insertion point.** Direct evidence: `opencode-harness.design.md` currently flows from scope/surface/reference material to role agents, delegation, commands/skills/workflows, model routing, local llama-server deployment, lifecycle guardrails, manifest, validation gates, non-goals, and open questions (`opencode-harness.design.md:1-199`). The lifecycle section already defines `.opencode/plugins/index.js` as the only auto-loaded plugin entry point, segmented plugin logic under `.opencode/plugin-modules/`, hooks as telemetry/guardrails only, no local plugin paths in `opencode.json`, and validator/artifact-verifier evidence as the acceptance boundary (`opencode-harness.design.md:142-152`). Inference: add a new top-level section immediately after `## Lifecycle Guardrails` and before `## Manifest` so the accepted hook design extends the plugin/guardrail architecture before manifest and validation constraints are described.

2. **Current orchestration scope for the doc change.** Direct evidence: the design-doc orchestration request allows edits to `opencode-harness.design.md`, `.memory/INDEX.md`, and current orchestration artifacts only, and explicitly forbids runtime hook/plugin implementation, provider transport changes, or runtime dependencies on `.agents/`, `.codex/`, or `.claude` paths (`.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md:3-8`). Acceptance criteria require the design doc to include hook architecture, OpenCode/Claude boundary, pre/post timing, telemetry, Playwright examples, hierarchical registry load/injection ordering, and validation passes (`INDEX.md:54-60`).

3. **Accepted architecture to carry forward.** Direct evidence: the prior synthesizer accepted a host-neutral core plus OpenCode delivery module under `.opencode/plugin-modules/`, kept `.opencode/plugins/index.js` as a thin import/merge adapter, and limited Claude support to adapter/spec/export helpers and documentation rather than committed `.claude` runtime configuration (`root-synthesizer-004-final.md:43-52`). It recommended implementing in order: confirm OpenCode hook semantics, add the pure core, add a deterministic registry/schema, test core/noise/redaction behavior, add OpenCode hook module, update thin adapter, add Claude adapter/docs, then update manifest/design/validation and run validation/smoke checks (`root-synthesizer-004-final.md:69-80`).

4. **Timing and hook semantics to preserve.** Direct evidence: the accepted conclusion uses pre-tool edit/write delivery as v1 primary behavior, keeps post-tool behavior optional and non-blocking, avoids chat/system transforms for v1, and requires validation to remain external to hooks (`root-synthesizer-004-final.md:45-52`). The planner detail says pre-tool reminders run before edit/write-style mutation tools, post-tool reminders are only verification notes and never acceptance, read-only tools do not inject by default, bash tools classify test/codegen/destructive/delegate commands without interfering with validation, and session/command boundaries may initialize counters and summarize metrics (`root-planner-002-design.md:101-108`).

5. **Protocol registry content to carry forward.** Direct evidence: the prior planner proposed `.opencode/protocols/agentic-micro-protocols.json` with a closed deterministic, secret-free contract containing `schemaVersion`, `protocols[]`, `id`, `title`, `severity`, `match`, `timing`, `message`, `dedupeKeyTemplate`, `maxPerSession`, and `enabledByDefault` (`root-planner-002-design.md:71-75`). It modeled a protocol registry as declarative micro-protocol definitions matched over phase, action, file kind, path globs, and risk tags (`root-planner-002-design.md:92-99`). Inference for the new requested modification: the planner should evolve this flat `protocols[]` concept into an explicit hierarchy while preserving the closed deterministic/secret-free registry requirement.

6. **Playwright examples to preserve.** Direct evidence: prior examples classify page objects with `**/pages/**/*.ts`, `**/*.page.ts`, `**/*.po.ts`, classes ending in `Page`, or locator/action helper exports; specs with `**/*.spec.ts`, `**/*.test.ts`, `tests/e2e/**`, or imports from `@playwright/test`; and fixtures with `**/fixtures/**/*.ts`, `**/*.fixture.ts`, or Playwright `test` extension. The examples also define page-object, spec, fixture, and cross-file duplicate suppression reminders (`root-planner-002-design.md:110-115`).

7. **Noise, notification, and ledger details to preserve with reviewer constraints.** Direct evidence: planner noise controls include dedupe by `{sessionId, protocolId, fileKind, normalizedPathBucket}`, 10-minute default window, severity levels, max one injected reminder per tool call, max three per protocol/session, max eight visible reminders/session, opt-outs, dry-run, and ledgered suppression reasons (`root-planner-002-design.md:117-124`). Notification/ledger text and fields are specified at `root-planner-002-design.md:126-131`. Reviewer risk requires deciding whether ledgers are committed or ignored runtime telemetry, adding retention/redaction policy, and testing command strings/private paths are not written (`root-reviewer-003-risk.md:47-50`).

8. **Security and compatibility constraints to preserve.** Direct evidence: reviewer high-risk constraints require safe pre-tool delivery that does not corrupt tool arguments or inject into file content/shell commands without proven host support (`root-reviewer-003-risk.md:52-56`), a prompt-injection trust model using static registry text or sanitized identifiers only and forbidding file contents/full commands in model-visible notices or ledgers (`root-reviewer-003-risk.md:57-61`), host-specific acceptance split between OpenCode runtime and Claude export/spec behavior (`root-reviewer-003-risk.md:62-66`), more conservative first-rollout noise defaults such as dry-run or summary-only until precision is demonstrated (`root-reviewer-003-risk.md:67-70`), and validation checks for trace artifacts/no `.claude` writes/imports/no hooks-as-acceptance proof (`root-reviewer-003-risk.md:72-75`).

9. **Validated status and remaining implementation-phase risks.** Direct evidence: the prior validator accepted the design-only workflow after `node .opencode/scripts/validate-harness.mjs` passed and artifact/index/routing checks passed (`root-validator-005-evidence.md:48-60`, `62-74`). The validator still lists future implementation risks: ledger privacy/ignore policy, safe pre-tool delivery semantics, prompt-injection boundaries, OpenCode hook API confirmation, and fixture-backed noise/classification tests (`root-validator-005-evidence.md:120-130`). The prior orchestration index records accepted decisions and remaining risks consistent with that validator artifact (`.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md:96-105`).

10. **Role contract and artifact requirements.** Direct evidence: the researcher output contract requires cited findings, source list, implementation implications, risks, recommended next role, and trace artifact path (`.opencode/contracts/role-io-contracts.json:8-21`). The trace schema requires `orchestrationId`, `role`, `artifactId`, `createdAt`, `inputContract`, `workPerformed`, `outputContract`, and `handoff`, with routing metadata status constrained to `present` or `absent` (`.opencode/schemas/memory-trace-artifact.schema.json:1-60`).

### Source List

- `opencode-harness.design.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/INDEX.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/reviewer/root-reviewer-003-risk.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/synthesizer/root-synthesizer-004-final.md`
- `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/validator/root-validator-005-evidence.md`
- `.opencode/contracts/role-io-contracts.json`
- `.opencode/schemas/memory-trace-artifact.schema.json`

### Implementation Implications

- Insert a new `## Agentic Protocol Hooks` section in `opencode-harness.design.md` after `## Lifecycle Guardrails` and before `## Manifest`.
- The section should be design-only and should not imply runtime files already exist. Use future-tense/accepted-design wording unless describing existing plugin boundaries.
- The section should carry forward: host-neutral core, OpenCode segmented hook module, thin adapter boundary, Claude docs/export-only boundary, pre-tool primary timing, optional non-blocking post-tool timing, no chat/system transform v1 reliance, Playwright examples, noise controls, redacted telemetry, and validator evidence as acceptance boundary.
- The planner should specify exact hierarchical registry language. Recommended hierarchy concept: `registry` contains ordered `layers` or `groups` such as `harness-global`, `role/workflow`, `domain:playwright`, `file-kind:page-object|spec|fixture`, and `phase/action-specific`. Each layer should have explicit stable `id`, numeric `priority` or `order`, optional parent, and `protocols[]` sorted by explicit order then `id`.
- Deterministic load order should be documented as fixed configured registry paths first, no unsorted filesystem discovery, schema validation before use, stable sort by `(layer.order, layer.id, protocol.order, protocol.id)`, and fail-closed or ignore-invalid behavior as chosen by the planner.
- Deterministic per-hook injection order should be documented as: normalize event; identify host/phase/action/file-kind/risk tags; evaluate layers in stable hierarchy; filter disabled/nonmatching protocols; rank candidates by explicit order, specificity, severity, and id; apply dedupe/session/tool caps; render at most the allowed number of static/sanitized reminders; ledger evaluated/injected/suppressed results in that same stable order.

### Risks / Unresolved Questions

- OpenCode hook input/output mutation semantics for safe model-visible reminders remain unconfirmed and must be framed as a future implementation validation gate, not as a design-doc certainty.
- Ledger default location and committed-vs-ignored policy remain unresolved; the design doc should preserve the privacy risk rather than silently choosing an unsafe default.
- The exact registry hierarchy names are not already accepted in prior artifacts; they are inferred from the user's requested modification and need planner approval.
- First-rollout default remains unsettled: prior plan allowed visible reminders, while reviewer suggested dry-run or summary-only until precision is proven.
- Claude support should stay documentation/export/spec-only unless a separate future scope authorizes `.claude` artifacts.

## Handoff

- Next role: `planner`
- Limitations: Research only; no final plan, implementation, integration, or validation acceptance performed. No runtime implementation files edited.
- Risks: Planner should explicitly preserve reviewer/validator constraints and avoid presenting unimplemented registry/hooks as current runtime behavior.
- Recommended next role input focus: Plan the exact `opencode-harness.design.md` insertion after `## Lifecycle Guardrails`, define the hierarchical registry/order wording, and include validation expectations for doc-only changes plus future runtime implementation gates.
- Trace artifact path: `.memory/orchestrations/2026-07-28-agentic-protocol-hooks-design-doc/roles/researcher/root-researcher-001-doc-target.md`
