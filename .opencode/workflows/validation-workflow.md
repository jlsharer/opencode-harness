# OpenCode Harness Validation Workflow

In external-runtime mode validate the prepared root, workspace root, and trace root independently from their launcher-set environment variables. In portable mode retain project-relative validation. Fixture evidence must not be reported as real provider activation.

Use this workflow before accepting an installed portable OpenCode harness.

## Required Checks

1. Confirm `.opencode/portable.manifest.json` exists, parses, contains only safe unique managed paths and memory seed mappings, and matches the installed portable inventory.
2. Parse the role contracts, trace schemas, routing schema, neutral routing example, and explicit enabled-local example. Use the dependency-free routing normalizer for semantic checks.
3. Confirm minimal memory exists: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/templates/orchestration-index.md`, and `.memory/templates/role-trace-artifact.md`. Do not require generated orchestration history.
4. Check all eight agent files for non-empty `description`, `mode: subagent`, and conservative `permission` frontmatter. Confirm each references the memory protocol, role contract catalog, trace schema, and trace path convention.
5. Check role-specific command frontmatter for `description` and `agent`, verify `model` is absent, and confirm the orchestrator-owned command omits `agent` and sets `subtask: false`.
6. Confirm `.opencode/plugins/index.js` is the only auto-loaded local plugin entry point and imports segmented modules. Treat lifecycle behavior as telemetry and guardrails only.
7. Run the dependency-free task-thread policy tests. Confirm fresh Task calls omit `task_id`, the only reuse is one matching response to a child-originated unresolved clarification, and retry, remediation, follow-up, correction, changed scope/role/deliverable, terminal work, replay, and post-restart reuse fail closed.
8. Run routing policy, resolver, helper, and plugin checks without network calls. Prove neutral disabled behavior, explicit local opt-in, custom-first selection without merging, fail-closed present-invalid custom behavior, exact explicit paths, actionable absent-both errors, and atomic all-eight-role force-mode coherence.
9. Confirm native provider transport and credentials remain operator-owned. Treat catalog identities and endpoint budgets as illustrative, cooperative routing data rather than endpoint-health or capacity proof.
10. Run `node .opencode/scripts/validate-portable-harness.mjs --root .`.
11. Scan portable files for secrets, machine-local private paths, and dependencies outside `.opencode/` and the minimal `.memory/` surface.
12. Report pass/fail evidence, trace artifact paths, skipped-check rationales, and remediation needs.

## Project-Specific Checks

Repositories may run additional project or release checks separately. Those checks do not replace portable validation and are not prerequisites of the installed harness profile.

## Acceptance Rule

Validator evidence must be explicit and command-backed where possible. Generated artifact proof should include a temp directory, copied artifact tree or listing, parse/render/check results, and cleanup decision when artifact validation is in scope.
