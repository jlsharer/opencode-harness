# 2026-10-24-opencode2-fresh-validation

## Scope and routing

- Goal: independently validate all feasible read-only gates for staged V2 research/docs/fixtures and WebFetch fix; reconcile outstanding external binary and runtime QA.
- [Normalized specification](normalized-spec.json) validated before dispatch. `routingMetadataStatus: absent`.
- No source edits, live providers, Git mutation, global config or publication. Prior explicit authorization for official V2 download, isolated credential-free execution and external QA is retained as context, but this managed workflow cannot execute write-producing checks.

## DAG, evidence and next action

- `staged-validation`: one fresh validator task `staged-validator-001`, no dependencies; six exact read-only commands covering changed-file inventory, whitespace and JS syntax.
- Input: [pinned contract staging](../2026-10-24-opencode2-pinned-contract/INDEX.md), [artifact provenance](../2026-10-24-v2-artifact-provenance/INDEX.md), [WebFetch repair](../2026-10-24-managed-webfetch-repair/INDEX.md).
- Current status: [independent validator](roles/validator/staged-validation-validator-001-readonly-gates.md) completed; all six exact managed commands exited zero and tracked inventory matched the seven expected files. Retain `dispatch-started.json`; do not replay this ID.
- Next safe action: run the previously authorized official V2 archive integrity and credential-free native checks, plus full source/portable/both runtime/package QA in a separately controlled external verifier against the reviewed exact tree. The managed shell disallows artifact download, network and write-producing QA. Return observed digests, exit codes and tree identity for a fresh implementation/acceptance workflow.
- Not established: pre-existing byte preservation, untracked trace inventory, native V2 Task safety, full source/runtime/package QA or overall V2 upgrade acceptance.
