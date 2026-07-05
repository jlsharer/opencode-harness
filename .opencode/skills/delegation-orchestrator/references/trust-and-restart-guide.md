# OpenCode Trust and Restart Guide

OpenCode project files may require session reload or restart before newly added agents, commands, skills, plugins, or instructions are rediscovered by a running client.

## Project Scope

- Keep OpenCode harness assets in `.opencode/` and root OpenCode project files.
- Keep project-owned memory protocols, references, templates, and orchestration trace artifacts under `.memory/`.
- Keep provider credentials and user auth material in user-level configuration or environment variables.
- Do not rely on generated files alone as proof of runtime activation.

## Plugin Guardrails

- Lifecycle plugins can provide warnings, telemetry, and reminders.
- Plugin output is not acceptance evidence.
- Acceptance requires validator or artifact-verifier checks.
- `.opencode/plugins/index.js` is the only auto-loaded local plugin file and is a pure adapter for segmented plugin logic in `.opencode/plugin-modules/harness-lifecycle.js`; do not list local plugin file paths in `opencode.json`.

## Recommended User-Facing Note

After installing or updating harness assets, restart or reload OpenCode so project agents, commands, skills, workflows, plugins, memory instructions, and instructions are rediscovered. Run `.opencode/scripts/validate-harness.mjs` before accepting the harness.
