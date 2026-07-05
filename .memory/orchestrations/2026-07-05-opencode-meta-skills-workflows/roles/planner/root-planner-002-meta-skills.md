# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-05-opencode-meta-skills-workflows
- role: planner
- artifactId: root-planner-002-meta-skills
- createdAt: 2026-07-05
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to plan minimal meta skills for creating/updating OpenCode skills and workflows; research evidence from `root-researcher-001-standards`; allowed paths `.opencode/skills/**`, `.opencode/workflows/**` if needed, and orchestration memory; acceptance need for exact files, frontmatter, content sections, and validation gates.
- Required context present: Yes. Research established official skill path/frontmatter/name/description rules and found no official native workflow schema; project workflows are local guidance only.
- Routing metadata status: absent

## Work Performed

- Summary: Chose two meta skills, not four, because create/update can be safely covered as modes within each domain-specific skill while keeping trigger descriptions precise. Planned no workflow file additions because the requested deliverable is meta skills and OpenCode workflows are not a documented native configuration surface.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `.opencode/skills/delegation-orchestrator/SKILL.md`; `.opencode/harness.manifest.json`; `.opencode/scripts/validate-harness.mjs`.
- Files changed: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/planner/root-planner-002-meta-skills.md`.
- Commands/checks: Read/glob inspection only; no implementation validation run.

## Output Contract

- Outputs: Ordered plan, file contracts, dependency ordering, verification gates, assumptions, and handoff notes for implementing two meta skills.
- Evidence: Based on supplied research summary and inspected harness conventions/validation script. Existing default project skill example is `.opencode/skills/delegation-orchestrator/SKILL.md` with required `name` and `description` frontmatter.
- Artifact links: `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/planner/root-planner-002-meta-skills.md`

## Ordered Plan / DAG Work Units

1. `root-implementer-003-meta-skills` depends on `root-planner-002-meta-skills`.
   - Create exactly two new OpenCode skill files:
     - `.opencode/skills/opencode-skill-authoring/SKILL.md`
     - `.opencode/skills/opencode-workflow-guidance/SKILL.md`
   - Do not edit `opencode.json`, commands, agents, plugins, routing, or prior projection paths.
   - Do not add `.opencode/workflows/*.md` files unless implementation discovers a concrete project-local workflow gap; current plan expects none.
2. `root-integrator-004-meta-skills` depends on implementer.
   - Confirm directory names match skill frontmatter `name` values.
   - Confirm the workflow skill does not claim a native OpenCode workflow schema and does not introduce runtime dependency on `.agents/` or `.codex/`.
   - Confirm the two skills are complementary and trigger descriptions do not overlap excessively.
3. `root-validator-005-meta-skills` depends on integrator.
   - Run command-backed gates below and record evidence before acceptance.

## File Contracts

### `.opencode/skills/opencode-skill-authoring/SKILL.md`

- Frontmatter required exactly:
  - `name: opencode-skill-authoring`
  - `description: Use when creating or updating OpenCode skills under .opencode/skills/<name>/SKILL.md, including skill names, frontmatter, trigger descriptions, and content structure.`
- Frontmatter constraints:
  - Directory basename must equal `name`.
  - Name must be lowercase alphanumeric with single hyphen separators, 1-64 chars.
  - Description must be 1-1024 chars, precise trigger guidance, third-person/use-when phrasing.
  - No `model`, `agent`, command-only keys, or undocumented runtime config keys.
- Required body sections:
  1. `# OpenCode Skill Authoring`
  2. `## Use When` — explicitly covers creating and updating skills.
  3. `## Official Skill Contract` — path `.opencode/skills/<name>/SKILL.md`, required `name`/`description`, optional `license`/`compatibility`/`metadata`, exact `SKILL.md` casing, directory/name match.
  4. `## Create Checklist` — choose valid name, create directory/file, write frontmatter, write concise instructions/examples/references, avoid secrets/runtime dependencies.
  5. `## Update Checklist` — preserve valid frontmatter, keep trigger description current, avoid broadening activation unintentionally, keep references local to the skill or documented project surfaces.
  6. `## Validation` — inspect frontmatter/path, run harness validation, restart OpenCode after skill changes.

### `.opencode/skills/opencode-workflow-guidance/SKILL.md`

- Frontmatter required exactly:
  - `name: opencode-workflow-guidance`
  - `description: Use when creating or updating workflow guidance for OpenCode projects, especially distinguishing native commands/skills from project-local .opencode/workflows/*.md documentation.`
- Frontmatter constraints:
  - Directory basename must equal `name`.
  - Name must be lowercase alphanumeric with single hyphen separators, 1-64 chars.
  - Description must be 1-1024 chars, precise trigger guidance, third-person/use-when phrasing.
  - No claim that `.opencode/workflows` is an official native OpenCode config schema.
- Required body sections:
  1. `# OpenCode Workflow Guidance`
  2. `## Use When` — explicitly covers creating and updating workflow guidance.
  3. `## Standards Boundary` — state official native assets are skills, commands, agents, config, plugins, etc.; no official workflow schema was found; in this harness `.opencode/workflows/*.md` is project-local guidance.
  4. `## Choose the Right Surface` — use commands for invocable prompts, skills for reusable triggerable guidance, `.opencode/workflows/*.md` only for harness/project-local process docs.
  5. `## Create Checklist` — define purpose, document DAG/steps/roles where applicable, avoid inventing OpenCode-native workflow frontmatter, avoid runtime dependency on `.agents/` or `.codex/`.
  6. `## Update Checklist` — preserve documented boundaries, synchronize with commands/skills if referenced, keep validation-before-acceptance and research-before-planning language for harness delegation workflows.
  7. `## Validation` — run harness validation and inspect for prior-projection runtime references.

## Dependencies

- Research dependency satisfied by `root-researcher-001-standards`.
- Implementation must precede integration; integration must precede validation.
- No `opencode.json` registration is needed because project skills under `.opencode/skills/<name>/SKILL.md` are on the documented skill surface.
- No manifest update is planned because the current harness validation script uses a static manifest path set and does not require all skill files to be listed.

## Verification Gates / Acceptance Gates

1. File existence:
   - `test -f .opencode/skills/opencode-skill-authoring/SKILL.md`
   - `test -f .opencode/skills/opencode-workflow-guidance/SKILL.md`
2. Frontmatter/path inspection:
   - Each file starts with YAML frontmatter.
   - Each `name` matches its directory basename.
   - Each `description` is non-empty, precise, and within documented length limits.
3. Content inspection:
   - Skill-authoring skill covers both create and update workflows for official skills.
   - Workflow-guidance skill clearly states `.opencode/workflows/*.md` is project-local guidance and no native workflow schema was found.
   - Neither skill references `.agents/` or `.codex/` as runtime dependencies.
4. Harness validation:
   - Run `node .opencode/scripts/validate-harness.mjs` from repository root.
5. Acceptance evidence:
   - Validator must provide pass/fail matrix, command output, schema/path findings, and remediation list before final acceptance.

## Assumptions

- Two skills are minimal and sufficient: one domain-specific skill for OpenCode skill creation/update and one for workflow guidance creation/update.
- `.opencode/workflows/**` is allowed only if needed, but not needed for the minimal correct change.
- Routing metadata was absent and must not be invented.

## Handoff

- Next role: implementer
- Limitations: This planner did not edit implementation/config files and did not run final validation. The orchestration `INDEX.md` is absent in the current tree and should be created or updated by the orchestrator/memory-maintenance step if required by the broader workflow.
- Risks: OpenCode workflow standards are not a native documented schema; the workflow meta skill must avoid presenting project-local `.opencode/workflows/*.md` as official OpenCode configuration. Skill changes may require restarting OpenCode to take effect.
