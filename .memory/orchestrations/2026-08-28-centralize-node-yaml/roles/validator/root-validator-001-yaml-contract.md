# Role Trace Artifact: Centralized Node YAML Integration Check

## Metadata

- orchestrationId: `2026-08-28-centralize-node-yaml`
- role: `validator`
- artifactId: `root-validator-001-yaml-contract`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete `integration-check` packet with changed paths, eleven offline commands, verification criteria, schema contracts, warnings, skipped-check policy, risk areas, acceptance standard, and supplied path relationships.
- Required context present: Yes. The role contract, trace schema/template, memory protocol, planner artifact, final implementer artifact, infrastructure worktree, ignored private YAML, and owner-only migration backup were available.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Independently ran every assigned offline command, inspected the node contract/parser and context phase/source-digest paths, checked private/generated-state modes structurally, scanned public surfaces for private-value equality without printing values, searched for retired sources and secondary YAML parsers, and measured retained context/install matrix coverage. No implementation file, Git state, service, remote host, provider, model, or global configuration was changed.
- Files read: Supplied changed files and focused sections under `config`, `scripts`, `tests`, `docs`, `README.md`, `.gitignore`, `compose.yaml`; planner and implementer trace artifacts; role contract/schema/template; structural metadata for ignored private configuration and backup state.
- Files changed: This trace artifact only.
- Commands/checks: All packet commands; read-only `git status --short`, `git diff --stat`, `git diff --name-status`, `git diff --check`, and `git log --oneline -5`; `stat` owner/type/mode checks; structural backup inventory; retired-source/parser scans; private-value equality scan; test-matrix token counts.

## Output Contract

- Outputs: **FAIL**. All assigned suites and syntax/diff commands pass, but acceptance is blocked by a second runtime YAML parser, public files matching private node-specific metadata, and insufficient executable evidence for the required remote/failpoint/old-schema matrix and migration parity.
- Evidence: Command-backed matrix and findings below.
- Artifact links: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/planner/root-planner-001-yaml-contract.md`; `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/implementer/root-implementer-004-context-remediation.md`; this artifact.

### Acceptance Decision

**FAIL — do not activate this migration.** Passing lifecycle/self-check outputs are not the acceptance boundary. Findings B1-B4 are tied directly to supplied acceptance gates.

### Pass/Fail Matrix

| Gate | Result | Independent evidence |
| --- | --- | --- |
| Private YAML and public contract | **FAIL** | Private YAML is current-UID, regular, non-symlink, exact `0600`; example/schema are `0644`; schema is Draft 2020-12 and recursively closes declared objects. However, the privacy scan found three private/public equality hits, including two node-specific values in tracked documentation and one private path equality in the public example (B2). |
| Retired source removal | **PASS** | Scoped scan returned zero references to `nodes.tsv`, per-node `.opencode.env`, or deleted Compose overlays. Snapshot fallback is selected-server generated state, not a retired manual source. |
| Sole parser and hardened node contract | **FAIL** | Focused suite passed and inspection confirmed custom duplicate/alias/merge/tag/multidoc/type/mode/cross-field checks. But `scripts/lib.sh:183-210` contains a separate runtime `yaml.safe_load` parser (B1), contrary to the supplied sole-runtime-parser gate and planner static gate. |
| Metadata migration and render parity | **UNVERIFIED / BLOCK** | Current private YAML validates and migration backup is owner-only, regular, non-symlink state. No test references the migration backup or performs semantic/render parity; four searched parity tokens all had count zero (B4). |
| Generated Compose env lifecycle | **PASS** | Safety suite passed. Inspection shows `0700` temporary root, `0600` env, ambient-key unsetting, EXIT/HUP/INT/TERM cleanup, and generated env use by base Compose. |
| Node add atomic/no-write behavior | **PASS** | Focused suite proves context no-write/write mode behavior; inspection of `node_config.py` shows add validates a complete candidate, prints digest/path-only plan, and calls one atomic YAML write only under `--yes`. |
| Projection and harness integration | **PASS** | Both offline suites passed; inspection shows `projection --all`, YAML default selection, and strict cloud/local/mixed mode fixtures with all-or-none external inputs. |
| Remote worker privacy and snapshot binding | **PASS (static/component)** | Installer suite passed; snapshot assertions exclude topology/default/SSH/OpenCode data, snapshot digest changes independently of bundle digest, and stale snapshot validation is present. Live transport remains skipped. |
| Context exact bytes and phase/source digests | **PASS (static/local fixture)** | Context suite passed. Inspection confirms pre/post snapshot digests, candidate YAML digest, remote post-phase digest switch, snapshot `sourceSha256` binding to candidate bytes, and exact-byte `restore-source` compensation. Remote end-to-end execution is not covered (B3). |
| Durable schema coherence and archive handling | **UNVERIFIED / BLOCK** | Inspection found exact current version checks and closed key sets across plan/request/facts/receipt/chain/deployment records. The supplied suites contain no old/mixed-schema mutation matrix, so required rejection is not independently demonstrated (B3). |
| Prior context/install failpoint matrix | **FAIL** | Both suites pass, but command-backed coverage counts show `0` `--remote` invocations in context tests, only `1` installer failpoint assignment, and `0` installer rollback-failpoint assignments. Required remote-first, rollback-failure, and mixed-schema paths are therefore not preserved as executable acceptance evidence (B3). |
| Full assigned offline gate | **PASS** | All eleven supplied commands exited `0`; no network, real SSH, Docker/service lifecycle, provider/model, publication, Git mutation, or global mutation was used. |

### Command Outputs

| Command | Exit/result |
| --- | --- |
| `python3 -m py_compile scripts/node_config.py` | `0`, no output |
| `python3 -I scripts/node_config.py validate --config config/nodes.example.yaml --allow-public-example` | `0`, no output |
| `bash tests/node-config-validation.sh` | `0`, `node config validation passed` |
| `bash tests/safety-validation.sh` | `0`, `safety validation fixtures: PASS` |
| `bash tests/tunnel-validation.sh` | `0`, `tunnel validation fixtures: PASS` |
| `bash tests/context-worker-install-validation.sh` | `0`, selected-snapshot installation fixtures passed |
| `bash tests/context-validation.sh` | `0`, YAML/selected-snapshot fixtures passed |
| `bash tests/opencode-projection-validation.sh` | `0`, two-node dry-run/generation fixture passed |
| `bash tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness` | `0`, simplified integration fixtures passed |
| Assigned `bash -n` command | `0`, no output |
| `git diff --check` | `0`, no output |
| Private file `stat` assertion | `0`; regular, non-symlink, current UID, mode `0600` |
| Structural backup inventory | Owner UID; backup roots `0700`; leaves `0600`; no symlinks; migration manifest contains seven digest records |
| Retired-source scan | Zero hits for all four retired source/overlay terms |
| Secondary-parser scan | `scripts/lib.sh` reported; direct inspection locates `yaml.safe_load` at lines 183-210 |
| Privacy equality scan | `private-value-public-hit-count 3`: one public-example path match and two tracked-document node-specific matches; values were not emitted in this artifact |
| Matrix coverage count | Context: `remote_invocations 0`; installer: `install_failpoint_assignments 1`, `rollback_failpoint_assignments 0` |
| Migration parity test search | Counts were `0` for migration-backup and semantic/render-parity tokens |

### Schema Results

- `config/nodes.schema.json`: **PASS structurally**. Draft 2020-12 declaration, closed root/node/nested mappings, required properties, and schema version constant are present.
- `scripts/node_config.py`: **PASS for inspected node-data behavior**, including exact key sets, strict Python scalar types, file size/UTF-8/NUL/owner/mode/no-follow checks, global alias/effective-port collision checks, local/remote cross-fields, output/context relation, snapshot closure/digests, and atomic candidate writes.
- Sole parser contract: **FAIL** because runtime Compose validation independently parses YAML in `scripts/lib.sh`.
- Selected-server snapshot schema: **PASS by component test/inspection** at version 2 with closed keys and no controller/OpenCode fields.
- Context/install durable schemas: **current shapes statically coherent, acceptance unverified** because no old/mixed-version execution corpus exists.
- OpenCode provider/catalog/profile contracts: **PASS offline** through projection and harness integration suites; live activation was not attempted.

### Security, Privacy, and Activation Findings

- **B1 — blocking parser-boundary defect:** `scripts/lib.sh:183-210` imports PyYAML and calls `yaml.safe_load` at runtime. This violates the explicit sole-runtime-YAML-parser/static-single-parser acceptance gate, even though it parses base Compose rather than private node YAML.
- **B2 — blocking privacy finding:** A value-equality scan derived from ignored `config/nodes.yaml` found two node-specific private values in tracked `docs/rollback.md` and one private path equal to `config/nodes.example.yaml`. The packet says any privacy leak blocks and specifically identifies tracked YAML/example/docs/tests as a risk. Values were intentionally not copied here.
- **B3 — blocking coverage regression:** Green context/install suites do not execute remote context apply/rollback, installer rollback failpoints, or old/mixed durable-schema rejection. Static inspection cannot substitute for the explicitly required preserved failpoint matrix.
- **B4 — blocking parity evidence gap:** The owner-only migration backup exists, but no executable suite compares every migrated old source/default/server/OpenCode value and exact rendered env against current YAML. The required parity gate therefore lacks reproducible evidence.
- Generated env mode/cleanup controls passed offline inspection and fixtures.
- No evidence of retired TSV/per-node env/overlay runtime fallback was found.
- Expected foreign-owner skip did not arise; no foreign-owner mutation was attempted.
- OpenCode/session restart is required after any eventual runtime/config/plugin activation. No activation was performed.

### Remediation List

1. Remove the independent runtime YAML parsing path from `scripts/lib.sh`, or route the required closed Compose-source inspection through the designated sole parser boundary; add a static regression assertion that no other runtime file loads YAML.
2. Replace node-specific values in tracked documentation/public example with demonstrably synthetic placeholders, then rerun a value-equality scan without emitting private values.
3. Restore executable context/install coverage for remote-first success, stale/tamper/timeout/replay, controller commit failure with exact remote compensation, exits 13/14, explicit rollback and rollback failpoints, installer early exit/reinstall/rollback/compensation, and old/mixed durable-schema rejection.
4. Add a value-silent migration parity test using the owner-only backup: compare every node/default/server/OpenCode field and exact rendered server-env bytes, reporting only field names/digests on mismatch.
5. Rerun the complete supplied command list and focused scans under a fresh independent validator task. Do not activate while B1-B4 remain.

### Skipped Checks and Residual Risk

- Intentionally skipped per packet: network, real SSH, Docker/service lifecycle, GPU/model behavior, provider health/auth, OpenCode launch, publication, Git mutation, and global configuration.
- Residual risks after remediation will include live-host transport/state, service behavior, and same-UID races; these are not passed by offline fixtures.
- The infrastructure worktree was already broadly dirty/untracked. Read-only status/diff inspection established provenance risk, but this validator did not reset, stage, clean, commit, or otherwise mutate it.

## Handoff

- Next role: Parent orchestration for a fresh bounded remediation decision; independent revalidation is required afterward.
- Limitations: Offline integration check only. No implementation fixes were made. Private file contents and private matched values are not reproduced in this artifact.
- Risks: Activation before remediation can retain parser-boundary drift, publish node-specific metadata, and leave critical remote/schema failure paths without regression proof.
