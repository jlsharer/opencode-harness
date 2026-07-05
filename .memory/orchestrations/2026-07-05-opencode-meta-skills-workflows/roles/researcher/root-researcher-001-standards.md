# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-05-opencode-meta-skills-workflows
- role: researcher
- artifactId: root-researcher-001-standards
- createdAt: 2026-07-05
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research officially documented OpenCode standards for skills and workflows/commands/config relevant to creating meta skills, plus existing harness conventions to preserve.
- Required context present: Inspected requested repository paths and official OpenCode config, skills, commands, and config docs. Official workflows docs target returned 404.
- Routing metadata status: absent

## Work Performed

- Summary: Gathered direct evidence from repository files and official OpenCode documentation; distinguished official OpenCode standards from project-local workflow conventions.
- Files read:
  - `opencode.json`
  - `.opencode/skills/delegation-orchestrator/SKILL.md`
  - `.opencode/workflows/delegation-workflow.md`
  - `.opencode/workflows/validation-workflow.md`
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/orchestration-index.md`
  - `.memory/templates/role-trace-artifact.md`
  - `AGENTS.md`
- Files changed:
  - `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/researcher/root-researcher-001-standards.md`
- Commands/checks:
  - `ls .memory/orchestrations`
  - `mkdir -p .memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/researcher`
  - Fetched `https://opencode.ai/config.json`, `https://opencode.ai/docs/skills/`, `https://opencode.ai/docs/commands`, `https://opencode.ai/docs/config/`, and attempted `https://opencode.ai/docs/workflows` (404).

## Output Contract

- Outputs: Cited findings, source list, implementation implications, risks, and recommended next role for meta skill/workflow creation.
- Evidence:
  - Official skills: `SKILL.md` lives under `.opencode/skills/<name>/SKILL.md`; OpenCode also discovers global and Claude/agent-compatible locations. Each skill requires YAML frontmatter with recognized fields `name`, `description`, optional `license`, `compatibility`, `metadata`; unknown fields are ignored. Name must be 1-64 chars, lowercase alphanumeric with single hyphen separators, match containing directory, and satisfy `^[a-z0-9]+(-[a-z0-9]+)*$`. Description must be 1-1024 chars. Skills load on demand via native `skill` tool and can be controlled with `permission.skill` patterns. Source: OpenCode Agent Skills docs fetched 2026-07-05.
  - Official config/schema: Project `opencode.json` declares `$schema: https://opencode.ai/config.json` and uses valid top-level `instructions` and `permission` fields. Official schema allows top-level `skills` object with only `paths` and `urls` and `command` object entries requiring `template`; schema has `additionalProperties: false` at config and many nested levels. Source: `opencode.json` lines 1-8; `https://opencode.ai/config.json` fetched 2026-07-05.
  - Official commands: Commands can be Markdown files in `.opencode/commands/`; filename becomes command name; frontmatter may include `description`, `agent`, `model`, `subtask`; body is the template. `$ARGUMENTS` and `$1`, `$2` positional placeholders are supported; `!` shell injection and `@file` references are supported. Source: OpenCode Commands docs fetched 2026-07-05.
  - Official workflows uncertainty: `https://opencode.ai/docs/workflows` returned 404 and the official config schema has no top-level `workflow(s)` key. Therefore `.opencode/workflows/*.md` appears to be a project-local harness convention, not an official OpenCode config primitive, based on inspected evidence.
  - Harness conventions: Runtime deliverable surface is `.opencode/` plus root `opencode.json`, `AGENTS.md`, and design doc. `.agents/` and `.codex/` are reference-only and must not become runtime dependencies. Preserve fixed role names; use delegation-only orchestration with research before planning and validation before acceptance; role outputs must follow contract/schema and trace path. Source: `AGENTS.md` lines 3-18, 20-28; `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json` lines 8-22.
  - Existing harness skills/workflows: Existing skill `delegation-orchestrator` uses official skill shape with `name` and `description` frontmatter. Existing workflows are Markdown guidance files without official schema/frontmatter observed. Source: `.opencode/skills/delegation-orchestrator/SKILL.md` lines 1-4; `.opencode/workflows/delegation-workflow.md`; `.opencode/workflows/validation-workflow.md`.
- Artifact links:
  - `.memory/orchestrations/2026-07-05-opencode-meta-skills-workflows/roles/researcher/root-researcher-001-standards.md`

## Handoff

- Next role: planner
- Limitations: No official OpenCode workflow documentation was found at `/docs/workflows`; conclusions about `.opencode/workflows` are inferential from 404, schema absence, and repository-local usage. Did not validate future proposed files.
- Risks: Adding workflow configuration to `opencode.json` would likely fail because unknown top-level keys are rejected by the official schema. Meta skills must avoid depending on `.agents/` or `.codex/` despite OpenCode discovering compatible skill locations globally/project-locally. Skill descriptions need precise trigger wording to avoid over-activation.

## Implementation Implications

- Create meta skills as `.opencode/skills/<lowercase-hyphen-name>/SKILL.md` with matching `name`, a specific 1-1024 character `description`, and no unrecognized fields unless intentionally ignored.
- Prefer project-local `.opencode/skills/` for harness runtime assets; do not rely on `.agents/skills/` or `.codex/`.
- If commands are needed for workflows, create `.opencode/commands/*.md` rather than adding non-schema workflow config to `opencode.json`; keep harness command convention of no `model` in command frontmatter except official docs allow it generally.
- Treat `.opencode/workflows/*.md` as documentation/guidance unless later official docs are found; do not assume OpenCode natively loads it.
- Preserve delegation/memory contracts in generated meta skill instructions.
