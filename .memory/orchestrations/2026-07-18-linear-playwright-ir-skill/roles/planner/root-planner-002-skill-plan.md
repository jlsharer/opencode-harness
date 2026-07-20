# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-18-linear-playwright-ir-skill
- role: planner
- artifactId: root-planner-002-skill-plan
- createdAt: 2026-07-18T00:00:00Z
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to create only `.opencode/skills/linear-playwright-ir/SKILL.md` plus required orchestration trace artifacts; scope boundaries limiting edits to that skill path and `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/`; research evidence at `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`; deliverable paths; acceptance criteria for frontmatter, body guidance, safety, validation, and restart note; routing metadata status absent; resolver metadata reported as unresolved for `/delegate-planner` with agent/model null, no network calls, and local fallback metadata present.
- Required context present: Required planner inputs are present: `orchestrationId`, `approvedGoal`, `scopeBoundaries`, `researchEvidence`, `deliverablePaths`, `acceptanceCriteria`, and `routingMetadataStatus` per `.opencode/contracts/role-io-contracts.json` lines 23-37. Research preceded planning via the referenced researcher artifact. This artifact path follows the planner trace path template.
- Routing metadata status: absent; no caller-supplied routing labels were present, and no routing values were invented. Resolver metadata is noted only as supplied context, not as caller routing labels.

## Work Performed

- Summary: Reviewed the researcher artifact, planner contract, trace schema, role trace template, and loaded skill-authoring guidance. Converted approved scope and evidence into a bounded implementation plan without editing the target skill file.
- Files read:
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.opencode/skills/opencode-skill-authoring/SKILL.md` via loaded skill guidance
- Files changed:
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/planner/root-planner-002-skill-plan.md`
- Commands/checks:
  - Loaded `opencode-skill-authoring` skill instructions.
  - Read local artifacts/contracts with tool-backed file reads.
  - Verified role parent directory with `ls` before creating planner artifact directory/file.

## Output Contract

- Outputs: Provided `orderedPlan`, `fileContracts`, `dependencies`, `verificationGates`, `handoffNotes`, and `traceArtifactPath` for implementer handoff.
- Evidence:

### orderedPlan

1. Confirm implementation scope before editing: only create or update `.opencode/skills/linear-playwright-ir/SKILL.md` and write implementer trace artifacts under `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/implementer/`. Do not touch `opencode.json`, `.opencode/commands/`, `.opencode/workflows/`, Playwright configs, app tests, dependency manifests, MCP config, `.agents/`, or `.codex/`.
2. Create parent directory `.opencode/skills/linear-playwright-ir/` if absent, then create `.opencode/skills/linear-playwright-ir/SKILL.md` with YAML frontmatter only containing required fields unless a documented need for optional fields emerges.
3. Set frontmatter exactly as follows unless the implementer has a strong reason to preserve the same meaning with equivalent wording:
   - `name: linear-playwright-ir`
   - `description: Use when turning a Linear ticket or issue acceptance criteria into a Playwright manual-test script that doubles as IR for future component, integration, or E2E automation.`
4. Structure the skill body as concise deterministic Markdown. Recommended sections:
   - `# Linear Playwright IR`
   - `Use When`
   - `Boundaries`
   - `Required Inputs`
   - `Workflow`
   - `Playwright Script Contract`
   - `IR Annotation Conventions`
   - `Automation Conversion Mapping`
   - `Safety and Privacy`
   - `Validation Checklist`
   - `Restart Note`
5. In `Use When`, scope activation to user requests involving Linear tickets/issues, ticket acceptance criteria, manual UI verification, Playwright scripts, and reusable automation IR. Avoid broad activation for unrelated Linear API work or generic Playwright testing.
6. In `Boundaries`, state that the skill does not fetch Linear data, run browsers, add dependencies, create app tests, create Playwright config, configure MCP/API integrations, or rely on `.agents/`/`.codex/`; it works from user-supplied ticket details and local project context.
7. In `Required Inputs`, instruct the model to collect or ask for: ticket id/title/summary, acceptance criteria, target environment/URL, authentication policy or safe test account constraints, persona/permissions, required test data, setup/cleanup expectations, privacy constraints, and known risk areas. Require explicit assumptions when details are missing.
8. In `Workflow`, guide conversion from ticket intent to a manual test flow: restate objective, identify preconditions, define happy path and edge/risk checks, choose stable locators, create step-aligned actions/assertions, include evidence capture only when safe, and mark cleanup.
9. In `Playwright Script Contract`, require generated output to be a readable TypeScript or JavaScript Playwright script/check suitable for manual execution/adaptation, with imports/test wrapper as appropriate for the user's repo context; prefer user-facing locators (`getByRole`, `getByLabel`, `getByText`, test ids when already established), web-first assertions, deterministic waits, isolated data/session handling, and no hard-coded secrets.
10. In `IR Annotation Conventions`, require stable comments or metadata adjacent to each step. Suggested fields: `ticket`, `stepId`, `intent`, `precondition`, `data`, `selectorStrategy`, `action`, `assertion`, `evidence`, `cleanup`, `risk`, `flakeRisk`, `componentCandidate`, `integrationCandidate`, and `e2eCandidate`. Require comments to stay aligned with executable behavior.
11. In `Automation Conversion Mapping`, explain how to convert the script into durable tests at three levels:
    - Component: isolate UI component, mock dependencies, assert rendered states/interactions from step intent.
    - Integration: exercise app modules and API boundaries with controlled mocks/fixtures, preserve route/state assertions.
    - E2E: keep full user workflow, use stable data setup/cleanup, browser contexts/storage state as appropriate, and minimize third-party flake.
12. In `Safety and Privacy`, require redaction of credentials, tokens, customer data, screenshots/traces/storage state, Linear ticket sensitive details, and logs; prohibit embedding secrets; call out permission boundaries and safe test data.
13. In `Validation Checklist`, include self-checks for path/frontmatter, narrow description, required sections, executable Playwright shape, IR annotations, conversion mapping, safety/privacy, no new dependencies/config/runtime references, and harness validation after edits.
14. Add `Restart Note`: OpenCode loads skills at startup; restart OpenCode after changing this skill.
15. Write implementer trace artifact under `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/implementer/` summarizing changed files, rationale, self-checks, skipped checks if any, and handoff to validator.

### fileContracts

- `.opencode/skills/linear-playwright-ir/SKILL.md`
  - Type: OpenCode project skill Markdown file.
  - Frontmatter: YAML at top of file with required `name` and `description`; `name` must equal directory basename `linear-playwright-ir`; description must be third-person trigger guidance and specific to Linear-ticket-to-Playwright-IR use.
  - Body: Markdown instructions only; no executable dependency declarations, config snippets that imply installation, or runtime links to prior projections. Must include guidance for input collection, manual test flow creation, Playwright script conventions, IR annotations, component/integration/E2E conversion mapping, safety/privacy, validation checklist, and restart note.
  - Style: Concise, deterministic, imperative guidance for the model; avoid overstating capabilities such as direct Linear access or browser execution.
- `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/implementer/<artifact-id>.md`
  - Type: implementer role trace artifact following `.memory/templates/role-trace-artifact.md` and `.opencode/schemas/memory-trace-artifact.schema.json` shape.
  - Required content: orchestration id, role, artifact id, input summary, work performed, changed files, commands/checks run, output summary, limitations, risks, and next-role handoff.
- `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/planner/root-planner-002-skill-plan.md`
  - Type: planner role trace artifact; this file records the plan and should not be modified by implementer except if explicitly remediating trace/index consistency.

### dependencies

- Research dependency satisfied by `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`.
- Implementation must happen before validator acceptance.
- Validator evidence must happen before final orchestration acceptance; hooks/plugin telemetry are guardrails only.
- No package, Playwright, Linear API, MCP, or application-code dependency is allowed for this scope.

### verificationGates

1. Implementer self-check before handoff:
   - Confirm only allowed paths changed: `.opencode/skills/linear-playwright-ir/SKILL.md` and implementer memory artifact(s) under this orchestration.
   - Inspect skill frontmatter for exact `name: linear-playwright-ir` and a specific third-person description.
   - Inspect body for all required content areas: input collection, manual test flow, Playwright script conventions, IR annotations, conversion mapping for component/integration/E2E, safety/privacy, validation checklist, restart note.
   - Confirm no dependencies/config/app tests/Linear API/MCP/runtime `.agents/` or `.codex/` references were added.
2. Validator gate after implementation:
   - Run `node .opencode/scripts/validate-harness.mjs` from repository root.
   - Run task-specific file inspection checks equivalent to:
     - path exists exactly at `.opencode/skills/linear-playwright-ir/SKILL.md`;
     - frontmatter parses and name matches directory;
     - required section keywords are present;
     - forbidden runtime dependency surfaces were not edited.
   - If any check is skipped, validator must provide an explicit justification and residual risk.
3. Acceptance gate:
   - Accept only with validator pass/fail matrix and command output evidence. Do not treat lifecycle hooks as acceptance evidence.

### handoffNotes

- Next role: implementer.
- Implementer should edit only `.opencode/skills/linear-playwright-ir/SKILL.md` plus its role trace artifact. Do not implement the long-term automation, add tests, add Playwright config, install dependencies, or connect to Linear.
- Keep routing metadata status as absent in the implementer artifact; do not invent provider/model/routing labels. The supplied resolver metadata may be mentioned as unresolved context only.
- Recommended implementer artifact id: `root-implementer-003-skill-file`.
- Handoff to validator should include changed file list, self-check results, any skipped checks, and request to run `node .opencode/scripts/validate-harness.mjs` plus skill-specific inspections.

### traceArtifactPath

- `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/planner/root-planner-002-skill-plan.md`

- Artifact links:
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/researcher/root-researcher-001-skill-contract.md`
  - `.memory/orchestrations/2026-07-18-linear-playwright-ir-skill/roles/planner/root-planner-002-skill-plan.md`

## Handoff

- Next role: implementer
- Limitations: Planning only. The target skill file was not created or edited by this role. No final validation was run because implementation has not occurred.
- Risks: Over-broad skill activation, implied Linear/browser/runtime capabilities, privacy leakage in generated scripts/traces, brittle selectors, IR comments drifting from executable behavior, and validation/indexing failures if downstream artifacts are omitted.
