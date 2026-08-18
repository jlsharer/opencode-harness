---
name: opencode-skill-authoring
description: Use when creating or updating OpenCode skills under .opencode/skills/<name>/SKILL.md, including skill names, frontmatter, trigger descriptions, and content structure.
---

# OpenCode Skill Authoring

## Use When

Use this skill when creating a new OpenCode skill or updating an existing `SKILL.md` file for project or global OpenCode skill guidance.

## Official Skill Contract

- Place each project skill at `.opencode/skills/<name>/SKILL.md`.
- Name the file exactly `SKILL.md` and keep it inside a directory named after the skill.
- Include required YAML frontmatter fields:
  - `name`: lowercase hyphen-separated skill name, up to 64 characters, matching the directory basename.
  - `description`: specific third-person trigger guidance that explains what the skill does and when to use it.
- Optional frontmatter fields are `license`, `compatibility`, and `metadata` when they are useful and documented.
- Avoid unknown OpenCode config changes. Do not add unrelated keys to `opencode.json` or other config surfaces while authoring a skill.
- In this harness, `delegation-orchestrator/SKILL.md` is the sole delegation protocol authority. Do not duplicate that protocol in another skill, command, or workflow document.

## Create Checklist

1. Choose a skill name that matches the directory name and uses only lowercase letters, numbers, and hyphen separators.
2. Create `.opencode/skills/<name>/SKILL.md` with required `name` and `description` frontmatter.
3. Write a description that front-loads likely trigger words, filenames, or user intents and avoids broad activation.
4. Add concise Markdown instructions, examples, references, or checklists that the model can follow deterministically.
5. Keep referenced resources local to the skill or documented project surfaces; do not introduce secrets or hidden runtime dependencies.

## Update Checklist

1. Preserve valid frontmatter and ensure `name` still matches the skill directory.
2. Update the `description` when triggers, scope, or adjacent-skill boundaries change.
3. Avoid broadening activation unless intentionally requested.
4. Keep body guidance current with official OpenCode standards and remove stale references.
5. If config files are touched, validate them against the official schema before handoff.
6. If delegation guidance is touched, keep the four-role/mode mapping and explicit orchestration-input schema authoritative in `delegation-orchestrator` rather than copying its procedure.

## Validation Checklist

- Confirm the path is `.opencode/skills/<name>/SKILL.md` and the filename casing is exact.
- Confirm required frontmatter exists and the skill name matches the directory basename.
- Confirm the description is non-empty, specific, third-person trigger guidance.
- Confirm optional `license`, `compatibility`, or `metadata` fields are documented and necessary.
- If OpenCode config was changed, validate it against `https://opencode.ai/config.json`.
- For this harness, run `node .opencode/scripts/validate-harness.mjs` after skill edits.

## Restart Note

OpenCode loads skills at startup. After changing a skill or other config-time asset, quit and restart OpenCode so the running session sees the update.
