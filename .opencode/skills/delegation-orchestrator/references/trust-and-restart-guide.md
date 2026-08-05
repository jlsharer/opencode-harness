# OpenCode Trust and Restart Guide

OpenCode project files may require session reload or restart before newly added agents, commands, skills, plugins, or instructions are rediscovered by a running client.

## Project Scope

- Keep portable OpenCode harness assets in `.opencode/`.
- Keep project-owned memory protocols, templates, and orchestration trace artifacts under `.memory/`.
- Keep provider credentials and user auth material in user-level configuration or environment variables.
- Do not rely on generated files alone as proof of runtime activation.

## Plugin Guardrails

- Lifecycle plugins can provide warnings, telemetry, and reminders.
- Plugin output is not acceptance evidence.
- Acceptance requires validator or artifact-verifier checks.
- `.opencode/plugins/index.js` is the only auto-loaded local plugin file and is a pure adapter for segmented plugin logic in `.opencode/plugin-modules/harness-lifecycle.js`; do not list local plugin file paths in `opencode.json`.

## Recommended User-Facing Note

After installing or updating harness assets, fully quit and restart OpenCode so project agents, commands, skills, workflows, plugins, and memory instructions are rediscovered. Run `node .opencode/scripts/validate-portable-harness.mjs --root .` before accepting the installed harness. A present custom routing file that is unreadable, malformed, or invalid must be repaired or removed deliberately; it never falls back to the neutral example.
