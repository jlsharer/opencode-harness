# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-18-linear-playwright-ir-skill
- role: researcher
- artifactId: root-researcher-001-skill-contract
- createdAt: 2026-07-18T00:00:00Z
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Scoped research question: what constraints and guidance should inform `.opencode/skills/linear-playwright-ir/SKILL.md`; relevant local paths; source constraints limiting research to local project files and stable general knowledge; downstream planner needs; routing metadata status absent; routing resolver metadata described as unresolved for `/delegate-researcher` with no network calls and local fallback metadata present.
- Required context present: Required researcher inputs are present: `orchestrationId`, `scopedQuestion`, `sourceConstraints`, `freshnessRequirements`, `downstreamNeeds`, and `routingMetadataStatus` per `.opencode/contracts/role-io-contracts.json` lines 8-16. The assigned trace path follows the researcher path template in `.opencode/contracts/role-io-contracts.json` lines 17-20 and the memory protocol trace convention in `.memory/protocols/memory-management.md` lines 47-53.
- Routing metadata status: absent; no caller-supplied routing labels were present, and no routing values were invented.

## Work Performed

- Summary: Reviewed harness instructions, memory protocol, role contract/schema, skill-authoring guidance, workflow/validation guidance, existing skill examples, and a prior local Playwright research artifact. Distinguished direct project evidence from implementation inference and stable general knowledge. No implementation files were edited.
- Files read:
  - `AGENTS.md`
  - `.memory/protocols/memory-management.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.opencode/skills/opencode-skill-authoring/SKILL.md`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/skills/opencode-workflow-guidance/SKILL.md`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/templates/orchestration-index.md`
  - `.opencode/scripts/validate-harness.mjs` excerpts
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/INDEX.md`
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md`
- Files changed:
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`
- Commands/checks:
  - Loaded `opencode-skill-authoring` skill instructions.
  - Read and searched local files with tool-backed file reads/globs/grep.
  - Used `ls`/`mkdir`/file write only to create the required trace artifact path.

## Output Contract

- Outputs: Provided `citedFindings`, `sourceList`, `implementationImplications`, `risks`, `recommendedNextRole`, and `traceArtifactPath` for planner handoff.
- Evidence:

### citedFindings

1. **Target surface and path are direct requirements.** Project skill assets belong under `.opencode/skills/<name>/SKILL.md`, with the exact filename `SKILL.md` inside a directory named after the skill. Required YAML frontmatter fields are `name` and `description`; `name` must be lowercase hyphen-separated, up to 64 characters, and match the directory basename; `description` must be specific third-person trigger guidance. Direct evidence: `.opencode/skills/opencode-skill-authoring/SKILL.md` lines 12-20 and 22-28. Implementation inference: the planned file should be `.opencode/skills/linear-playwright-ir/SKILL.md` with `name: linear-playwright-ir` and a description narrowly triggered by Linear tickets, Playwright scripts, manual UI checks, and reusable automation IR.

2. **Skill content should be concise, deterministic, local-resource-oriented, and avoid hidden dependencies.** The skill-authoring checklist says to add concise Markdown instructions, examples, references, or checklists the model can follow deterministically, and to keep referenced resources local or documented while avoiding secrets/hidden runtime dependencies. Direct evidence: `.opencode/skills/opencode-skill-authoring/SKILL.md` lines 22-28. Implementation inference: sections should define inputs, workflow, output script format, IR annotation conventions, conversion targets, safety/privacy boundaries, and self-checks without requiring new Playwright config, MCP services, or external Linear API calls.

3. **The skill should be a native OpenCode skill, not a command or workflow doc.** Local workflow guidance distinguishes `.opencode/skills/<name>/SKILL.md` as triggerable guidance, while `.opencode/commands/*.md` are slash commands and `.opencode/workflows/*.md` are project-local process docs. Direct evidence: `.opencode/skills/opencode-workflow-guidance/SKILL.md` lines 19-23 and 27-33. Implementation inference: planner should not add workflow frontmatter, command files, or `opencode.json` keys for this request.

4. **Harness validation is required after OpenCode asset edits.** Project instructions require `node .opencode/scripts/validate-harness.mjs` before accepting changes and task-specific checks as needed. Direct evidence: `AGENTS.md` lines 26-28; `.opencode/skills/opencode-skill-authoring/SKILL.md` lines 38-45; `.opencode/workflows/validation-workflow.md` lines 5-18. Implementation implication: validator should run `node .opencode/scripts/validate-harness.mjs` after the implementer creates the skill, plus skill-specific inspections for frontmatter/path/body constraints.

5. **Validation evidence cannot be replaced by hooks or lifecycle telemetry.** Direct evidence: `AGENTS.md` lines 17-18 and `.opencode/workflows/delegation-workflow.md` lines 38-40. Implementation implication: final acceptance of the new skill needs validator evidence, not just plugin/hook output.

6. **Delegation/memory artifacts must preserve absent routing metadata.** The memory protocol says not to invent routing metadata when absent and to record `routingMetadataStatus: absent`; it also requires preserving supplied routing labels only when present. Direct evidence: `.memory/protocols/memory-management.md` lines 18-20 and 55-60; `AGENTS.md` lines 20-24; `.opencode/workflows/delegation-workflow.md` lines 20-23. Implementation implication: subsequent role artifacts should keep routing metadata status absent and may mention the supplied resolver fact (`source unresolved`, `agent null`, `model null`, `networkCalls false`) without inventing resolved labels.

7. **Role trace and handoff fields are contract-bound.** Researcher output requires `citedFindings`, `sourceList`, `implementationImplications`, `risks`, `recommendedNextRole`, and `traceArtifactPath`; trace artifacts require metadata, input contract, work performed, output contract/evidence, and handoff. Direct evidence: `.opencode/contracts/role-io-contracts.json` lines 8-22 and `.opencode/schemas/memory-trace-artifact.schema.json` lines 6-58. Implementation implication: planner should consume this artifact and create its own trace rather than embedding final implementation.

8. **Existing skills use minimal frontmatter and clear sections.** Current project skills show YAML frontmatter with only `name` and `description`, followed by a title and scoped sections such as use cases, boundaries, checklists, validation, and restart notes. Direct evidence: `.opencode/skills/delegation-orchestrator/SKILL.md` lines 1-24 and `.opencode/skills/opencode-workflow-guidance/SKILL.md` lines 1-17, 43-53. Implementation inference: `linear-playwright-ir` should follow this style and include a restart note because OpenCode loads skills at startup (`.opencode/skills/opencode-skill-authoring/SKILL.md` lines 47-49).

9. **The orchestration index already defines requested scope and non-goals.** Direct evidence: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/INDEX.md` lines 3-7 state the request, allowed edit scope, and non-goals: do not add runtime dependencies, Playwright config, MCP config, application test files, or modify `.agents/`/`.codex/`. Implementation implication: planner should limit implementation to `.opencode/skills/linear-playwright-ir/SKILL.md` and required memory artifacts.

10. **Acceptance criteria already name expected skill substance.** Direct evidence: `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/INDEX.md` lines 63-70 require the skill file, valid frontmatter, inputs, script structure, IR annotations, conversion guidance, safety boundaries, validation checklist, and harness validation or justified skips. Implementation implication: planner can convert these into file contracts and validator checks.

11. **Stable Playwright/general automation guidance should shape the skill body but remains inference without fresh external docs in this role.** Stable general knowledge: Playwright scripts are easier to maintain when they prefer user-facing locators/roles/text over brittle CSS/XPath, use explicit assertions and deterministic waits rather than sleeps, isolate test data/session state, and redact credentials/PII from traces/screenshots/storage. Local prior research also recorded direct Playwright evidence from official docs for resilient locators, codegen, auto-wait/actionability, web-first assertions, traces, storage-state auth, browser contexts, fixtures/projects, network/API mocking, emulation, frames/pages, aria snapshots, and POM patterns. Direct local evidence of that prior research summary: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md` lines 18-40. Implementation inference: the new skill should guide generated scripts to look like runnable Playwright manual-test scripts but include structured IR comments/metadata for intent, selectors, assertions, data setup, cleanup, risk notes, and mapping to component/integration/E2E automation.

12. **IR convertibility should be explicit.** Inference from the user goal and stable automation practice: the skill should require the generated script to separate ticket intent, preconditions, navigation, actions, assertions, data dependencies, cleanup, and abstraction seams. It should label steps with stable IDs and automation-level hints such as `componentCandidate`, `integrationCandidate`, and `e2eCandidate`, so downstream teams can convert the manual Playwright script into long-term tests at the appropriate level.

### sourceList

- `AGENTS.md` lines 3-5, 7-18, 20-28.
- `.memory/protocols/memory-management.md` lines 3-20, 22-39, 41-62, 64-76.
- `.opencode/contracts/role-io-contracts.json` lines 8-22.
- `.opencode/schemas/memory-trace-artifact.schema.json` lines 6-58.
- `.opencode/skills/opencode-skill-authoring/SKILL.md` lines 1-49.
- `.opencode/skills/delegation-orchestrator/SKILL.md` lines 1-24, 25-35, 36-52.
- `.opencode/skills/opencode-workflow-guidance/SKILL.md` lines 1-17, 19-33, 43-53.
- `.opencode/workflows/delegation-workflow.md` lines 1-23, 24-40.
- `.opencode/workflows/validation-workflow.md` lines 1-22.
- `.memory/templates/role-trace-artifact.md` lines 1-35.
- `.memory/templates/orchestration-index.md` lines 1-72.
- `.opencode/scripts/validate-harness.mjs` lines 36-62, 371-391, 393-428.
- `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/INDEX.md` lines 3-13, 63-70, 72-107.
- `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md` lines 18-40, used as prior local evidence only.
- Stable general knowledge about Linear tickets, Playwright script maintainability, and UI automation layering; no external web retrieval was performed for this role.

### implementationImplications

- Create exactly `.opencode/skills/linear-playwright-ir/SKILL.md`; frontmatter should be only the required fields unless planner intentionally justifies optional fields:
  - `name: linear-playwright-ir`
  - `description: Use when turning a Linear ticket or issue acceptance criteria into a Playwright manual-test script that doubles as IR for future component, integration, or E2E automation.`
- Likely sections: `Use When`, `Do Not Use When` or `Boundaries`, `Required Inputs`, `Output Contract`, `Script/IR Structure`, `IR Annotation Conventions`, `Playwright Authoring Guidance`, `Conversion Guidance`, `Safety and Privacy`, `Checklist`, and `Restart Note`.
- The skill should not fetch Linear data itself; it should operate on ticket details supplied by the user/session and ask for missing acceptance criteria, target URL/env, credentials policy, test data, and risk constraints.
- Generated script guidance should favor runnable Playwright TypeScript/JavaScript, but require comments/metadata that preserve intent and future automation mapping. Suggested IR fields: ticket id/title, assumptions, preconditions, persona, environment, data setup, step id, user intent, locator strategy, action, expected assertion, evidence capture, cleanup, flake/risk notes, and automation-level candidates.
- Conversion guidance should explain how each step maps to component tests (mock dependencies and assert isolated UI state), integration tests (real app modules/API mocks), or E2E tests (full browser workflow with stable test data), without actually generating those long-term tests unless asked.
- Acceptance checks for validator: path exists; frontmatter parses and `name` matches directory; description is specific and not overly broad; body includes inputs, script structure, IR annotations, conversion guidance, safety/privacy boundaries, and checklist; no new config/dependencies/runtime references; no `.agents/`/`.codex/` runtime dependency; `node .opencode/scripts/validate-harness.mjs` run after edits.

### risks

- Over-broad description may trigger the skill for unrelated Playwright or Linear work.
- Skill could imply it can access Linear, auth, browsers, or network resources; it should instead require user-supplied ticket details and local project context.
- Generated scripts may capture secrets/PII in screenshots, traces, storage state, or ticket content unless the skill explicitly requires redaction.
- IR comments can drift from executable script behavior; require assertions and comments to stay step-aligned.
- Long-term conversion targets differ by app architecture; the skill should provide decision criteria rather than prescribing one level for every scenario.
- Brittle selectors, sleeps, shared mutable state, uncontrolled third-party dependencies, and missing cleanup would reduce conversion value.
- If the new memory artifact is not indexed in `.memory/INDEX.md`, full harness validation may report an indexing failure; this researcher did not update indexes because the requested deliverable was the trace artifact only.

### recommendedNextRole

- planner

### traceArtifactPath

- `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`

- Artifact links:
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`

## Handoff

- Next role: planner
- Limitations: Research only. No `.opencode/skills/linear-playwright-ir/SKILL.md` file was created or edited. No external documentation was fetched. Playwright and Linear-specific implementation details beyond local evidence are stable general knowledge/inference and should be treated as such by planner. No validation command was run.
- Risks: See `risks` above; main planning risks are overbroad skill activation, accidental hidden dependency on Linear/Playwright runtime access, privacy leakage in generated scripts/traces, brittle selectors, and missing validation/indexing steps.
