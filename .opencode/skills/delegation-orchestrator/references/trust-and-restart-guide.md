# OpenCode Trust and Restart Guide

OpenCode project files may require session reload or restart before newly added agents, commands, skills, plugins, or instructions are rediscovered by a running client.

## Project Scope

- Keep portable OpenCode harness assets in `.opencode/`.
- Keep project-owned memory protocols, templates, and orchestration trace artifacts under `.memory/`.
- For the packaged external runtime, keep the immutable package separate from the owner-only mutable version cache. Runtime assets, workspace work, and traces use the three launcher-set roots; no harness `.opencode` tree is copied into the workspace.
- Keep provider credentials and user auth material in user-level configuration or environment variables.
- Do not rely on generated files alone as proof of runtime activation.

## Plugin Guardrails

- Lifecycle plugins can provide warnings, telemetry, and reminders.
- Plugin output is not acceptance evidence.
- Acceptance requires independent validator checks in the appropriate task mode.
- `.opencode/plugins/index.js` is the only auto-loaded local plugin file and is a pure adapter for segmented plugin logic in `.opencode/plugin-modules/harness-lifecycle.js`; do not list local plugin file paths in `opencode.json`.

## Recommended User-Facing Note

After installing or updating harness assets, fully quit and restart OpenCode so project agents, commands, skills, plugins, and memory instructions are rediscovered. Run `node .opencode/scripts/validate-portable-harness.mjs --root .` before accepting the installed harness. A present custom routing file that is unreadable, malformed, or invalid must be repaired or removed deliberately; it never falls back to the neutral example.

For external runtime rollback from 0.1.14, invoke retained 0.1.13 and retain the package- and exact-OpenCode-version caches. The launcher refuses managed-byte drift, unsafe ownership/modes, collisions, and pre-set activation variables rather than repairing user state. It rejects ambient `OPENCODE_DB`, starts each child with independently absent DB/WAL/SHM paths, preserves `XDG_DATA_HOME`, and verifies captured parent/launch canonical path, ownership, mode, and device/inode before any post-child inventory. Identity or containment mismatch causes no deletion and reports the absolute retained launch path; post-rename failures report the absolute quarantine path. Success revalidates parent identity and quarantine absence. For an external trace root, four narrow role-specific external-directory rules and three Markdown-only trace edit rules activate only after a separate `agent list` probe produces the exact owner-only marker; workspace `.memory` remains a no-op fallback. The marker is a startup guardrail, not acceptance proof. Same-UID nested path replacement remains outside the claimed boundary. External catalog/profile routing preserves the all-or-none input boundary and uses closed mixed, local-only, or cloud-only provider-class policy.

The packaged `validate-inputs` verb performs the same fail-closed provider/catalog/profile validation as `run` but only reads package compatibility data and explicitly supplied trusted files. It creates no workspace, cache, trace, snapshot, database, or global state; resolves or spawns no OpenCode child; and makes no provider request. A successful compact JSON result is offline compatibility evidence only, not readiness, authentication, activation, model identity, capacity, or restart acceptance.
