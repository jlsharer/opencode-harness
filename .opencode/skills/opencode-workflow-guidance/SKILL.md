---
name: opencode-workflow-guidance
description: Use when creating or updating workflow guidance for OpenCode projects, especially distinguishing native commands/skills from project-local .opencode/workflows/*.md documentation.
---

# OpenCode Workflow Guidance

## Use When

Use this skill when creating or updating workflow guidance, workflow-like process documents, or slash-command prompts for an OpenCode project.

## Standards Boundary

- No official native OpenCode workflow schema was found for `.opencode/workflows/*.md`.
- `.opencode/workflows/*.md` would be project-local guidance, not an OpenCode runtime configuration surface. This harness intentionally keeps no redundant workflow documents; `delegation-orchestrator/SKILL.md` is authoritative.
- Official OpenCode-native assets include config, agents, commands, skills, plugins, MCP servers, permissions, and references as documented by OpenCode.
- Do not invent workflow frontmatter or config keys and present them as official OpenCode standards.

## Choose the Right Surface

- Use `.opencode/commands/*.md` for user-invoked slash commands or reusable prompt templates.
- Use `.opencode/skills/<name>/SKILL.md` for triggerable guidance that should be available when relevant user intent appears.
- Use project-local workflow documents only for genuinely distinct nonduplicative process guidance. Do not create delegation, implementation, or validation workflow documents that restate the authoritative delegation skill.
- For command files, the Markdown body is the command template. Frontmatter may include `description`, `agent`, `model`, and `subtask` when relevant.
- Omit `agent` for orchestrator-owned commands that must route dynamically rather than bind to a single role agent.

## Create Checklist

1. Define whether the requested artifact is an invocable command, triggerable skill, or project-local workflow document.
2. For commands, create a command Markdown file under `.opencode/commands/` and keep the executable prompt in the body.
3. For skills, create `.opencode/skills/<name>/SKILL.md` with official skill frontmatter and trigger guidance.
4. For project-local workflow docs, first prove distinct value; state their non-native boundary and avoid duplicating skill-owned protocol.
5. Avoid runtime dependency on reference-only prior projection directories.

## Update Checklist

1. Preserve the distinction between native OpenCode commands/skills and project-local workflow documentation.
2. Keep command frontmatter limited to documented command fields when editing slash-command prompts.
3. Keep workflow guidance synchronized with any commands, skills, or harness conventions it references.
4. For harness delegation guidance, update the authoritative skill rather than a parallel workflow document; preserve research-before-planning and validation-before-acceptance.
5. Remove claims that `.opencode/workflows/*.md` is an official native OpenCode schema unless official documentation later establishes that standard.

## Validation Checklist

- Confirm the chosen surface matches the requested behavior: command for slash command, skill for triggerable guidance, project-local doc for process guidance.
- Confirm workflow docs do not add unknown OpenCode config keys or undocumented frontmatter requirements.
- Confirm command files, when touched, use `.opencode/commands/*.md` with the prompt in the body and only documented frontmatter fields.
- Confirm no runtime dependency on reference-only prior projection directories was introduced.
- For this harness, run `node .opencode/scripts/validate-harness.mts` after OpenCode asset changes.

## Restart Note

If a workflow change creates or updates OpenCode config-time assets such as commands, skills, agents, plugins, or config, quit and restart OpenCode so the update is loaded.
