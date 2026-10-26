# Planner trace: paired managed-execution fixture path

## Metadata
- orchestrationId: 2026-10-24-webfetch-fixture-repair
- delegationTaskId: fixture-plan-001
- scopeKey: fixture
- role: planner
- taskMode: plan
- artifactId: fixture-planner-001-path-plan
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: approved fixture-only goal; two exact target paths; two assigned `env TMPDIR=/tmp node --test ...` gates; prior independent validator traces reporting EROFS on hardcoded `/var/tmp`.
- Required context present: yes; scope limited to the paired test files, no production edits or live network.
- Routing metadata status: absent; no caller routing labels supplied.

## Work Performed
- Summary: Inspected both paired fixtures, the prior gate traces, the planner contract/schema and the production shell wrapper solely to identify dependencies. No implementation or gate execution.
- Files read: `.opencode/src/plugin-modules/managed-execution.test.ts`, `.opencode/plugin-modules/managed-execution.test.mjs`, `.opencode/src/plugin-modules/managed-execution.ts`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.memory/templates/role-trace-artifact.md`, the two supplied validator traces.
- Files changed: none in workspace.
- Commands/checks: none run.

## Output Contract
- Outputs: (1) Implementer changes only the identical fixture mkdtemp prefix at TS line 10 and MJS line 8 from `/var/tmp/managed-execution-` to `/tmp/managed-execution-`; preserve every assertion, fixture cleanup, remaining lines and any existing work. (2) Independent validator runs both exact assigned TMPDIR gates and inspects diff/tree proof, requiring exit zero and reached assertions before acceptance. (3) If either fails, stop and report the observed blocker rather than expand scope implicitly.
- Evidence: Both supplied prior validator traces observe exit 1/EROFS for `/var/tmp` fixture; tests contain the same hardcoded prefix. Production `.opencode/src/plugin-modules/managed-execution.ts:174-195` wraps shell with `--tmpfs /tmp` then `--chdir` to `workspaceRoot`. Thus moving the fixture workspace into outer private `/tmp` may hide it from the nested shell for the two shell-executing assertions; this is a source-derived risk, not a measured post-change outcome. The authorized path-only change cannot guarantee both zero-exit gates. A gate failure from this interaction needs parent-reviewed scope expansion or separately authorized verification, never a false managed pass.
- Artifact links: `orchestrations/2026-10-24-webfetch-fixture-repair/roles/planner/fixture-planner-001-path-plan.md`.

## Handoff
- Next role: implementer for paired path-only change; independent validator afterward.
- Limitations: No tests executed in this planning task; cannot assert post-change behavior or exact tree acceptance. No production behavior changes authorized.
- Risks: nested Bubblewrap `--tmpfs /tmp` can hide outer fixture path from shell tests; report any observed failure as a blocker without changing tested assertions or production code under this packet.
