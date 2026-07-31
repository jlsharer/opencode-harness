# Reviewer Trace Artifact: Agentic Protocol Hook Risk Review

## Metadata

- orchestrationId: `2026-07-28-agentic-protocol-hooks`
- role: `reviewer`
- artifactId: `root-reviewer-003-risk`
- createdAt: `2026-07-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Defect-focused review of proposed agentic harness hook design using researcher artifact, planner artifact, orchestration index, intended behavior, risk areas, and test expectations.
- Required context present: orchestration id, changed/design artifact paths, intended behavior, risk focus areas, test expectations, allowed artifact path, role contract, trace schema, and resolved `/delegate-reviewer` routing decision were supplied.
- routingMetadataStatus: absent. Caller routing metadata labels were absent; no routing values invented.
- Resolved routing decision supplied: `{ "schemaVersion":"2.0.0", "agent":null, "model":null, "variant":null, "source":"unresolved", "sources":{"agent":null,"model":null,"variant":null}, "local":{"enforced":false,"catalogName":null,"routingServiceUrl":null,"maxInFlight":null,"networkCalls":false} }`.

## Work Performed

- Summary: Reviewed the research and planner trace artifacts from a defect-first stance, with emphasis on prompt-injection risk, privacy, tool mutation safety, false positives/noise, cross-client mismatches, and validation gaps. No runtime implementation files were edited.
- Files read:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/INDEX.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.gitignore`
- Files changed:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/reviewer/root-reviewer-003-risk.md`
- Commands/checks:
  - `ls ".memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles"`
  - `mkdir -p .../roles/reviewer && python3 - <<'PY' ... PY`

## Output Contract

- Outputs: findings, openQuestions, residualRisk, changeSummary, and next-role handoff are specified below.
- Evidence: Findings are grounded in the supplied research/planner artifacts and repository evidence read during review. Hooks are treated only as guardrails/telemetry, not proof of acceptance.
- Artifact links:
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/reviewer/root-reviewer-003-risk.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/planner/root-planner-002-design.md`
  - `.memory/orchestrations/2026-07-28-agentic-protocol-hooks/roles/researcher/root-researcher-001-hooks.md`

### Findings

1. **High — Planned telemetry ledger is commit-prone and underspecified for privacy.**
   - Evidence: The planner proposes default runtime ledger locations under `.memory/agentic-protocol-ledger.jsonl` or `.memory/orchestrations/<active-orchestration-id>/validation/agentic-protocol-ledger.jsonl` and includes path/tool/session/call/protocol fields in the JSONL contract (`root-planner-002-design.md:76-79`, `128-131`). The repository `.gitignore` only ignores `.agents/*`, `.codex/*`, one deployment env pattern, and the private routing override (`.gitignore:1-4`); it does not ignore `.memory/agentic-protocol-ledger.jsonl` or orchestration validation JSONL ledgers.
   - Defect risk: Even with “no secrets or full prompts,” relative paths, tool names, session/call ids, protocol ids, and suppression reasons can expose private project structure or user behavior and may be accidentally committed as generated telemetry. The design also lacks retention, rotation, file-permission, atomic append, and explicit redaction tests for Bash command arguments.
   - Requested remediation: Before implementation, define whether ledgers are committed artifacts or ignored runtime telemetry, add explicit ignore/retention/redaction policy, and require tests that prove command strings and absolute/private paths are not written.

2. **High — Pre-tool “injection” delivery is not host-contract-safe enough to prevent tool-argument corruption or no-op reminders.**
   - Evidence: The planner makes pre-tool injection the primary mechanism (`root-planner-002-design.md:101-108`, `171-172`) and says the OpenCode adapter may use “safe pre-tool mutation or visible stderr/notification depending on supported hook semantics” (`root-planner-002-design.md:97-99`). Research notes OpenCode docs show `tool.execute.before` can mutate `output.args`, but OpenCode hook input/output schemas remain less detailed and may require runtime/type inspection (`root-researcher-001-hooks.md:54`, `77-78`).
   - Defect risk: Without a precise allowed mutation target and adapter contract, a future implementation could alter tool arguments, inject reminder text into file content or shell commands, or silently emit notices that the model never sees before the tool call. Either failure mode breaks the intended behavior: reminders influencing imminent edits without mutating user code.
   - Requested remediation: Gate implementation on concrete runtime evidence for each delivery path, forbid mutation of user-supplied file content/commands unless explicitly proven safe, and test that edit/write arguments are byte-for-byte unchanged except for the documented host-supported reminder channel.

3. **High — Prompt-injection boundary for classifier inputs and rendered reminders is incomplete.**
   - Evidence: The design normalizes events including `filePath` and `command`, classifies from tool args/path/extension/content hints, renders visible notices, and can optionally map decisions to Claude hook behavior (`root-planner-002-design.md:48-58`, `94-99`, `110-115`, `126-131`). It does not specify escaping, trusted-source separation, or a prohibition on including file contents, import text, command text, or untrusted path segments in reminder messages.
   - Defect risk: Tool inputs, file paths, code imports, branch names, or command strings are attacker-controlled in many repositories. If any are interpolated into model-visible notices or hook outputs, malicious strings could become prompt instructions. This is especially risky because the hook explicitly aims to inject context before tool use.
   - Requested remediation: Define a trust model: protocol messages must be static registry text or sanitized identifiers only; untrusted fields must be hashed, bucketed, or escaped; file contents and full commands must never be injected into model-visible notices or persisted to ledgers.

4. **Medium — Cross-client compatibility target is broader than the proven common contract.**
   - Evidence: The plan calls for a host-neutral core and Claude adapter/export surface (`root-planner-002-design.md:48-69`, `133-147`), while research states Claude `PreToolUse`/`PostToolUse` and OpenCode plugin semantics differ, and OpenCode chat/system/command hook shapes require confirmation (`root-researcher-001-hooks.md:54`, `58-60`, `75-80`). The planner also acknowledges semantic mismatch as residual risk (`root-planner-002-design.md:186-190`).
   - Defect risk: A single normalized decision contract may mask host-specific differences in blocking, stdout/stderr visibility, config reload, session identifiers, and mutation semantics. That can produce tests that pass against the pure core but fail in one client, or Claude documentation that implies runtime support this repo intentionally does not ship.
   - Requested remediation: Split acceptance into OpenCode runtime behavior and Claude export/spec behavior. Require host-specific fixtures for event input/output and document unsupported fields per host instead of relying on a single normalizer abstraction.

5. **Medium — Noise controls are specified, but false-positive safety defaults are still too permissive for first rollout.**
   - Evidence: Initial visible limits are max one reminder per tool call, max three per protocol per session, and max eight visible reminders per session (`root-planner-002-design.md:117-124`). Playwright classification includes path patterns, class names, exports, and imports (`root-planner-002-design.md:110-115`), and residual risks note unconventional layouts can produce false positives (`root-planner-002-design.md:188-191`).
   - Defect risk: On a busy edit session, eight unsolicited visible reminders can still be noisy, and path/import heuristics may trigger in non-Playwright or vendored/generated files. Alert fatigue undermines the guardrail and may prompt users to disable it globally.
   - Requested remediation: Start with dry-run or notice-summary-only by default until fixture-backed precision is demonstrated, add generated/vendor/test-fixture ignore defaults, and make per-protocol opt-out discoverable without editing source files.

6. **Medium — Validation gates do not yet prove memory artifact/schema conformance or runtime non-dependency on Claude paths.**
   - Evidence: Planner verification gates include harness validation, new node tests, registry schema validation, manual smoke, and adapter thinness (`root-planner-002-design.md:159-168`). Research and repo constraints prohibit runtime dependencies on `.claude`, `.agents`, and `.codex` (`root-researcher-001-hooks.md:55-59`; `INDEX.md:5-7`).
   - Defect risk: The proposed gates emphasize implementation behavior but do not explicitly require generated memory trace artifacts to match `.opencode/schemas/memory-trace-artifact.schema.json`, nor do they require static checks that Claude support remains documentation/export-only with no `.claude` writes/imports. A future implementation could pass unit tests while violating orchestration memory or runtime path constraints.
   - Requested remediation: Add validator checks for trace artifact schema/contract coverage, no created `.claude` files, no imports from `.claude`/`.agents`/`.codex`, and explicit proof that hooks/ledger are not used as acceptance evidence.

7. **Low — Index statuses appear stale relative to completed research/planning artifacts.**
   - Evidence: The orchestration index still marks `root-research` as `in_progress`, `root-plan` as `pending`, and delegation packets for researcher/planner as `pending` even though corresponding artifacts exist (`INDEX.md:26-38`, `70-83`).
   - Defect risk: Stale orchestration status can confuse downstream validator/synthesizer routing and make completion evidence harder to audit.
   - Requested remediation: Have the owning orchestration/integrator update index statuses after review/synthesis, without changing runtime implementation files.

### Open Questions

- Which exact OpenCode hook return field is safe for model-visible reminders without changing tool arguments or file contents?
- Should runtime ledger files be ignored by default, or should only validator-curated ledger excerpts be committed under orchestration memory?
- Is first release intended to be dry-run/summary-only by default until precision/noise metrics are gathered?
- What minimum Claude artifact is acceptable: pure adapter tests, generated docs, or an executable hook helper outside runtime `.claude` paths?
- Should command classification ever inspect full Bash text, or only coarse allowlisted command categories computed without persistence?

### Residual Risk

Even after remediation, hook APIs can drift, model-visible reminders may be ignored, and heuristic classification will miss unconventional project layouts. Hooks should remain advisory guardrails/telemetry only; validator or artifact-verifier command evidence remains required before any acceptance decision.

### Change / Design Summary

The proposed design adds a host-neutral micro-protocol core, OpenCode hook delivery module, Claude export/spec adapter, protocol registry, noise policy, user-visible reminders, and JSONL telemetry ledger for pre/post tool protocol reminders, with Playwright page-object/spec/fixture examples. The main design risks are unsafe delivery semantics, telemetry privacy, prompt-injection boundaries, cross-client mismatch, and insufficient validation specificity.

## Handoff

- Next role: `synthesizer` to resolve design tradeoffs, then `validator` for command-backed evidence before acceptance.
- Limitations: Review only; no runtime implementation files edited; no final validation or acceptance performed.
- Risks: Privacy and host-semantics risks should be resolved before implementation. Treat hook output and telemetry as non-acceptance evidence.
