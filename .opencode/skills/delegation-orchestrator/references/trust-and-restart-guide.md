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

For external runtime rollback from 0.1.15, invoke retained 0.1.14 and retain the package- and exact-OpenCode-version caches. The launcher refuses managed-byte drift, unsafe ownership/modes, collisions, and pre-set activation variables rather than repairing user state. It rejects ambient `OPENCODE_DB`, starts each child with independently absent DB/WAL/SHM paths, preserves `XDG_DATA_HOME`, and verifies captured parent/launch canonical path, ownership, mode, and device/inode before any post-child inventory. Identity or containment mismatch causes no deletion and reports the absolute retained launch path; post-rename failures report the absolute quarantine path. Success revalidates parent identity and quarantine absence. For an external trace root, four narrow role-specific external-directory rules and three Markdown-only trace edit rules activate only after a separate `agent list` probe produces the exact owner-only marker; workspace `.memory` remains a no-op fallback. The marker is a startup guardrail, not acceptance proof. Same-UID nested path replacement remains outside the claimed boundary. External catalog/profile routing preserves the all-or-none input boundary and uses closed mixed, local-only, or cloud-only provider-class policy.

The packaged `validate-inputs` verb performs the same fail-closed provider/catalog/profile validation as `run` but only reads package compatibility data and explicitly supplied trusted files. It creates no workspace, cache, trace, snapshot, database, or global state; resolves or spawns no OpenCode child; and makes no provider request. A successful compact JSON result is offline compatibility evidence only, not readiness, authentication, activation, model identity, capacity, or restart acceptance.

## V2 direct implementation opt-in

Use `--v2-direct-implementation` only with Linux V2 `run` or `source-tui`, after a full OpenCode restart. It supports fresh foreground `implementer/implementation` child sessions without explicit model overrides; the parent still delegates and independent validator gates remain required. Other calls retain the guarded native route. Verify status reports `directSessionTransport: implementation-v1`; readiness metadata must also prove `directSessionUnresolved: false` before client attachment. Default-off preserves native routing.

Offline acceptance checks the actual before/executor/original-output-schema/after ordering, permission before create, caller/session/event correlation, all outward result channels, callback settlement, scope and real artifact capture. A safe missing artifact or digest mismatch after verified native completion may fail locally. Fresh remediation uses a new call, task, child and prompt through existing controller budgets. Unsafe paths, symlinks, identity/scope drift, malformed results, cancellation, deadlines, event loss and uncertain work stop and retain the lease.

The fixed trace-wide `orchestrations/.direct-session-unresolved.json` marker blocks startup and admission even with opt-in off. Existing Job recovery cannot release direct attempts; the separate private direct path below requires its original live authority. Rollback-off is allowed only with a clear lease.

Only the same live plugin instance and exact bound parent may recover an owned direct attempt stopped by the original `deadline-expired` or `caller-cancelled` cause. All actual native operations, executor/before/after returned Promises, child callback pairs and command observations must settle; native error after must retain the exact wrapped stopped Error, while a correlated completed after retains rejection in every output channel. Resolve requires the acknowledged create, correlated child event and own promoted prompt, then a fresh bounded interrupt/wait/get/context observation. Status retains the original marker/spec identities and bytes, workspace/trace ancestry, owned version-1 lease, scope and at most 32 changed files for review. Release repeats the complete native observation, requires the same terminal context and exact reviewed tree hash, then synchronously removes only the owned lease and retires old identities. It never accepts stopped results or restores gates; use a new orchestration/spec, task, call, child and prompt, with independent validators. Missing after, event loss, unload/reload, an arbitrary version-1 marker, unowned lease and direct-off unresolved lease remain blocked. Generic faults cannot become cancellation or deadline proof. Restart, opt-out, trace-root changes, manual deletion and older packages never prove release. This is not durable recovery: same-UID replacement, post-read context allocation, no exclusive child lock or all-plugin callback fence, and post-unlink crash limits remain. Cleanup errors report the exact marker path and checked present/missing/unknown state; in-memory admission stays stopped even if unlink already succeeded.

The committed native API audit and offline fixtures do not establish live provider compatibility. Terminal text with `stop` is the initial supported completion. Native context allocation precedes local 256-message/1-MiB checks, there is no exclusive child lock, and native child transcripts may remain visible.
