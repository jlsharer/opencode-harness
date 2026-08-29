# Role Trace Artifact: Final Centralized Node YAML Integration Check

## Metadata

- orchestrationId: `2026-08-28-centralize-node-yaml`
- role: `validator`
- artifactId: `root-validator-002-yaml-final`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete `integration-check` packet with changed paths, B1-B4 closure criteria, eleven required offline commands, schema/security/privacy requirements, skipped-check policy, acceptance standard, and supplied path relationships.
- Required context present: Yes. The prior validator and final-remediation artifacts, role contract/schema/template, infrastructure worktree, ignored private YAML, tests, and owner-only migration archive were available.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Independently ran all assigned offline gates; inspected parser/schema/context/install boundaries; checked private configuration and migration archive structurally without following links; scanned public surfaces against selected private node metadata without emitting values; measured executable remote/failpoint/old-schema coverage; and reviewed value-silent parity failure behavior. No implementation, Git, service, remote, provider, or global state was intentionally changed.
- Files read: Supplied infrastructure paths; focused context/install/parser tests and scripts; prior validator and implementer artifacts; role contract, trace schema/template, and planner contract.
- Files changed: This trace artifact only.
- Commands/checks: All packet commands; read-only Git status/diff/log; private no-follow/mode/owner checks; archive recursive `lstat` inventory; runtime parser scan; retired-source scan; value-silent private/public equality scan; context/install matrix counts; parity diagnostic scan.

## Output Contract

- Outputs: **FAIL**. B1 is closed and all required offline commands pass. B2 remains open because one selected private node value equals text in a public test. B3 remains open because the executable remote/failpoint/schema matrix still omits controller-commit compensation, remote context failpoints, status-loss-after-rollback, and some installer durable-schema mutations. B4's success-path semantic/render comparison is reproducible, but its mismatch diagnostics interpolate private node slugs and therefore are not strictly value-silent.
- Evidence: Independent command-backed matrix and findings below.
- Artifact links: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/validator/root-validator-001-yaml-contract.md`; `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-005-final-remediation.md`; this artifact.

### Acceptance Decision

**FAIL — do not activate.** Green suites do not override the packet's explicit zero-equality, complete-matrix, and value-silent acceptance gates.

### Final Gate Matrix

| Gate | Result | Independent evidence |
| --- | --- | --- |
| B1: sole runtime YAML parser | **PASS / CLOSED** | Runtime scan found exactly one YAML parser file under `scripts`, `scripts/node_config.py`; `node-config-validation.sh` also enforces this boundary and passed. `lib.sh` now calls `inspect-compose`. |
| B2: zero private/public equality | **FAIL / OPEN** | Value-silent scan of 62 public/scoped files found one equality: the private remote-root field for one node appears in `tests/context-validation.sh`. Public example/schema and documentation no longer produced hits. No matched value is reproduced here. |
| B3: complete executable remote/context/install/old-schema matrix | **FAIL / OPEN** | Context suite passes and has 11 `--remote` tokens plus four old-schema mutations, but has zero remote context failpoint assignments, zero controller-commit-failure cases, and zero status-loss-after-rollback cases. Installer has one install failpoint, one rollback failpoint, and two old-schema mutations, but mutates only status/manifest while additional durable preflight/failed-receipt schemas exist. |
| B4: reproducible value-silent semantic/render parity | **FAIL / OPEN** | `tests/migration-parity-validation.py` runs successfully and compares legacy topology, server/OpenCode fields, defaults, optional fields, and rendered-env SHA-256 parity. However, source inspection counted 11 mismatch labels interpolating private node slugs (`nodes.{slug}...`), so failure output can disclose a private scalar. |
| Private YAML security | **PASS** | `lstat`/parser checks prove current-UID regular non-symlink mode `0600`; a temporary symlink validation returned nonzero (`rc=1`). |
| Public example/schema safety and closure | **PASS** | Public example validates under the designated parser. Schema declares Draft 2020-12 and closes the root and every declared nested object with `additionalProperties: false`. The scoped equality scan found no example/schema hit. |
| Retired-source/fallback removal | **PASS** | Excluding the migration-only parity helper, active/normal-workflow scans returned zero hits for TSV, per-node OpenCode env, deleted overlays, and label-overlay fallback. |
| Generated env and node-add lifecycle | **PASS (offline)** | Safety and integration suites passed generated owner-only temporary-env cleanup/ambient isolation and YAML-only node-add no-write/write/collision paths. |
| Projection and strict harness modes | **PASS (offline)** | Projection and harness integration suites passed all-node generation and strict local/cloud/mixed fixtures. No live OpenCode activation occurred. |
| Selected-server privacy/digest binding | **PASS (fixture/static)** | Snapshot tests enforce closed selected-server-only keys, omit topology/default/SSH/OpenCode data, validate distinct bundle/snapshot digests, bind `sourceSha256` to candidate bytes, and reject stale digests. |
| Exact-byte compensation and current durable schemas | **PASS behavior / incomplete corpus** | Exact source restore and local exits 13/14 pass; current closed schema checks are present. Acceptance remains blocked by the omitted remote compensation/failure and durable-schema cases under B3. |
| Full required offline gate | **PASS** | Every supplied command exited `0`. |

### Command Outputs

| Command/check | Exit/result |
| --- | --- |
| `python3 -m py_compile scripts/node_config.py` | `0`; no diagnostic |
| Public example validation | `0`; no diagnostic |
| `bash tests/node-config-validation.sh` | `0`; parity success message and `node config validation passed` |
| `bash tests/safety-validation.sh` | `0`; fixtures passed |
| `bash tests/tunnel-validation.sh` | `0`; fixtures passed |
| `bash tests/context-worker-install-validation.sh` | `0`; selected-snapshot installation fixtures passed |
| `bash tests/context-validation.sh` | `0`; YAML/selected-snapshot fixtures passed |
| `bash tests/opencode-projection-validation.sh` | `0`; two-node dry-run/generation fixture passed |
| Harness integration validation with supplied harness root | `0`; simplified integration fixtures passed |
| Assigned `bash -n` command | `0`; no diagnostic |
| `git diff --check` | `0`; no diagnostic |
| Private configuration structure | Regular, non-symlink, current UID, exact `0600` |
| Temporary private-config symlink attempt | Rejected, `rc=1` |
| Migration archive structure | 1 directory and 8 files; directories `0700`, files `0600`, current UID, zero symlinks/unsafe modes |
| Runtime parser scan | `runtime-yaml-parser-files 1`; designated parser true |
| Retired-source scan | Four categories, zero active/normal-workflow hits |
| Private/public selected-value scan | 62 files; one hit, limited to field/path metadata in command output |
| Context matrix count | 11 remote tokens; 1 local failpoint assignment; 0 remote failpoint, controller-commit-failure, and status-loss cases; 4 old-schema mutations |
| Installer matrix count | 1 install failpoint; 1 rollback failpoint; 2 old-schema mutations |
| Parity diagnostic scan | 11 private-slug interpolation sites |

### Schema Results

- `config/nodes.schema.json`: **PASS structurally** for Draft 2020-12 declaration, required root/node fields, schema-version constant, and recursive object closure.
- `scripts/node_config.py`: **PASS** as the sole hardened runtime parser with closed mappings, strict scalar/range/cross-field checks, no-follow owner/mode reads, selected-snapshot validation, digest checks, deterministic rendering, and atomic update/restore paths.
- Private `nodes.yaml`: **PASS structurally**; current parser validation and explicit no-follow rejection passed.
- Selected-server snapshot version 2: **PASS** by fixture mutation and closed-key validation.
- Context plan/facts/request/snapshot/receipt/chain schemas: **current paths coherent; rejection corpus partial**. The suite executes old plan, nested facts, request, snapshot, receipt, and worker/controller chain cases, but does not execute the required remote failure/compensation matrix.
- Installer durable schemas: **partial/blocking**. Status and manifest old versions are mutated; other validated durable shapes (including preflight and failed-before-mutation receipt paths) lack old/mixed executable cases.
- Migration parity: **semantic/render success**, but the strict value-silent output contract fails on mismatch diagnostics.

### Security, Privacy, and Activation Findings

- **B2 blocking privacy finding:** one private selected-node scalar remains equal to a literal in a public test fixture. This directly violates the packet's zero-equality acceptance standard.
- **B3 blocking coverage finding:** remote success/explicit rollback/replay and several schema mutations now execute, but no fixture forces controller commit failure after remote mutation and proves exact remote compensation. Remote context failpoints and status-loss-after-rollback are also absent. Green static/local checks cannot replace this explicit executable gate.
- **B4 blocking privacy finding:** parity mismatch labels embed the private node slug. Hashing actual/expected values does not make the full failure message value-silent.
- B1 is independently closed; no second runtime YAML parser was found.
- Private configuration and backup/archive ownership, type, mode, and no-symlink checks passed. Foreign-owner behavior was not exercised, as permitted by the expected warning.
- Generated local env controls, selected-server privacy, projection strictness, and digest binding passed offline fixtures/static checks.
- No lifecycle hook or implementer claim was used as acceptance evidence.
- Runtime/config activation was not performed. A full OpenCode quit/restart remains required after eventual activation-relevant changes.

### Remediation List

1. Replace the remaining private-equal remote-root literal in `tests/context-validation.sh` with a synthetic fixture value and extend the value-silent equality regression to all changed public tests/docs/scripts/config surfaces, not only the example and rollback document.
2. Add executable remote context cases for controller commit failure after worker commit with exact prior-snapshot compensation, remote failpoint/rollback-failure handling, and status-loss-after-rollback. Assert resulting bytes/digests and expected exit/state outcomes.
3. Extend old/mixed installer schema mutations to every accepted durable shape involved in install/rollback/recovery, including preflight and failed-before-mutation receipt paths, while restoring fixture bytes between cases.
4. Make parity diagnostics identify nodes with non-reversible indexes or digests rather than private slugs; ensure every success and failure path emits only fixed labels, counts, and digests. Expand its privacy scan to the complete scoped public surface.
5. Rerun all supplied commands and focused scans in a fresh independent validator task. Do not activate until all three open findings close.

### Skipped Checks and Residual Risk

- Intentionally skipped per packet: network, real SSH, Docker/service lifecycle, GPU/model behavior, provider health/auth, OpenCode launch, publication, Git mutation, and global mutation.
- Residual live risk includes actual SSH ordering/loss behavior, host service compensation, model readiness, provider activation, and same-UID races; offline fixture success does not pass these concerns.
- The infrastructure worktree remains broadly dirty/untracked from pre-existing implementation work. Read-only Git evidence was collected; no reset, clean, stage, commit, or rollback was performed.

## Handoff

- Next role: Parent orchestration for a fresh bounded remediation decision, followed by fresh independent validation.
- Limitations: Offline integration check only. No implementation fixes were made. Private values and archive contents are not reproduced in this artifact.
- Risks: Activation now can preserve a public/private metadata equality, leave critical remote compensation paths without regression proof, and disclose a private node identifier when migration parity fails.
