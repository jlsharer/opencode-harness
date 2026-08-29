# Role Trace Artifact: Centralized Node YAML Implementation Plan

## Metadata

- orchestrationId: `2026-08-28-centralize-node-yaml`
- role: `planner`
- artifactId: `root-planner-001-yaml-contract`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `taskMode: plan`; approved centralization goal; bounded infrastructure and trace paths; cited research; exact deliverable path groups; acceptance criteria; dependencies, assumptions, and supplied decisions.
- Required context present: Yes. The packet is contract-complete and the cited research artifact was available.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Converted the approved goal and current-tree research into an ordered migration plan. Resolved the remote boundary, generated-artifact boundary, YAML/update semantics, context durable-state gate, parser ownership, overlay removal, and verification sequence. No implementation file was edited and no acceptance validation was performed.
- Files read: Supplied researcher artifact; planner role contract and trace schema/template; orchestration index; current `llama-server` root/config/schema inventory; `.gitignore`; `README.md`; `compose.yaml`; `scripts/{lib.sh,ai.sh,export-opencode-projection.sh,opencode-harness-integration.sh,context-common.sh,context.sh,context-worker.sh,install-context-worker.sh}`; scoped references in tests and docs.
- Files changed: This trace artifact only.
- Commands/checks: Read-only `git status --short`, `git diff --stat`, and `git diff --name-only` in `llama-server`; scoped file/content inventory. Existing modified and untracked work was observed. No tests, SSH, network, Docker/service, OpenCode, publication, or Git mutation was run.

## Output Contract

### Ordered Plan

1. **Protect the migration boundary before changing consumers.** Record the current dirty/untracked inventory and do not reset, clean, stage, or overwrite unrelated work. Refuse conversion while any context or worker-deployment transaction is nonterminal. Make an owner-only verified backup of the existing private node env/OpenCode leaves and authoritative tracked inputs without printing payloads. Build the private `config/nodes.yaml` only after the parser in step 2 exists; compare old and new typed node semantics and rendered server env bytes before removing old private leaves. The conversion helper may be temporary and uncommitted; normal runtime and committed documentation must not retain TSV compatibility.

2. **Create the closed contract and sole parser.** Add `config/nodes.example.yaml`, `config/nodes.schema.json`, and `scripts/node_config.py`. The Python module is both an importable API and a narrow CLI; every shell/Python consumer must call or import it rather than parse YAML, env, or registry data independently. It must use a custom PyYAML safe loader and reject duplicate keys, aliases, merge keys, custom tags, multiple documents, non-string keys, implicit YAML-1.1 boolean/timestamp/coercion traps, NaN/Infinity, NUL, invalid UTF-8, oversized input, unknown keys, and wrong scalar types. Private-config reads are descriptor-based/no-follow, identity-stable, current-UID regular-file checks requiring exact mode `0600`.

3. **Fix the version-1 YAML shape and invariants.** Use exactly the root keys `schemaVersion`, `opencodeDefault`, and `nodes`; all mappings are closed. Each slug-keyed node contains `execution`, `server`, and `opencode`. `execution` contains `mode`, `sshAlias`, `remoteRoot`, and `tunnel` (`null` locally; closed `localPort`/`remotePort` remotely). `server` contains `projectName`, `image`, `hostPort`, closed `model` (`directory`, `file`, `alias`), and closed `llama` with explicit `contextSize`, `parallel`, cache K/V, flash attention, GPU layers, split mode, tensor split, main GPU, endpoint metrics, and nullable threads/batch/ubatch. `opencode` contains required `outputLimit` and `enableThinking`. Require one existing default; slug/pattern/range/image/path constraints; local/remote conditional fields; remote `hostPort == tunnel.remotePort`; globally unique model aliases and effective client ports; and `outputLimit < contextSize`. Keep all operational values explicit so Compose defaults do not become another source of truth. Keep `tensorSplit` and enum-like llama controls constrained strings where current accepted values are not uniformly numeric.

4. **Define deterministic parser outputs and atomic updates.** The module must expose validated typed document/node selection, canonical whole-document and selected-server semantic bytes/digests, selected OpenCode projection data, deterministic server-env rendering, and atomic context/node-add candidate generation. Server env rendering has an exact allowlisted key order, one terminal newline, no comments, and no shell syntax. YAML updates take an owner-only sibling lock, revalidate the current descriptor identity and digest, write a fully validated mode-0600 sibling temporary file, fsync file, atomically replace, and fsync parent. No-write plans report node/field paths and digests only, never sensitive values.

5. **Migrate serving and Compose to YAML with ephemeral local compatibility env.** Update `scripts/lib.sh` so `load_node` obtains one validated selected node from `node_config.py`; remove `REGISTRY`, `OVERLAY`, handwritten env parsing, and per-node env assumptions. For each local Compose invocation, create an owner-mode-0700 temporary directory and mode-0600 rendered env, unset all supported ambient keys, use only base `compose.yaml`, and clean up on success, failure, and handled signals. Update `compose.yaml` to set `ai.infrastructure.node: ${NODE_SLUG:?...}` directly. Preserve model readiness, effective Compose, loopback publication, optional tuning, ambient-env, and command-specific preflight behavior. Delete `compose.main.yaml` and `compose.secondary.yaml` after tests prove they were label-only and no retained extension consumer exists.

6. **Establish the remote generated-snapshot contract.** Do not copy `config/nodes.yaml`, controller topology for other nodes, SSH data, defaults, or any `opencode` object to workers. Extend the worker installation/deployment path to generate and atomically install only a canonical selected-node server snapshot (recommended state path: `$XDG_STATE_HOME/ai-infrastructure/node-config/<slug>/server.json`, parent `0700`, leaf `0600`) plus `scripts/node_config.py`. The snapshot is generated state, never manually edited; its closed envelope carries only schema version, slug, server object, and source/semantic/render digests. Keep its digest separate from the public script bundle digest. Inventory/install/rollback evidence must bind both digests and exact prior bytes. Remote `ai.sh --local` and context-worker operation consume that snapshot and generate ephemeral Compose env; controller remote dispatch passes an expected digest and refuses stale/missing remote state. Update installer early-exit logic so a changed selected snapshot cannot be hidden by an unchanged script bundle. Direct on-target operation remains possible only against this deployed derivative, not a private controller YAML copy.

7. **Migrate context transactions without weakening compensation.** Add `node_config.py` to the context worker bundle and bump all affected plan/request/facts/receipt/chain/deployment schema versions. Fail closed when old-version durable plans, transactions, chains, deployment records, or stage files are present; require explicit completion/archive rather than guessing a migration. Replace registry/overlay/env source facts with base-Compose/code digests, controller YAML byte digest, selected-server semantic digest, rendered-env digest, and projection facts. Worker facts contain only selected-server/render digests, never the full-YAML digest or OpenCode metadata. For local apply, back up exact YAML bytes, generate a candidate changing only `nodes.<slug>.server.llama.contextSize`, atomically commit YAML, recreate from an ephemeral env, and compensate by restoring exact YAML bytes. For remote apply, retain remote-first ordering: the worker backs up and atomically commits the selected server snapshot, recreates and verifies; the controller then atomically commits the matching YAML candidate; controller failure requests exact remote compensation. Rollback restores the authoritative YAML locally and the generated snapshot remotely. Preserve lock ordering, one-crossing request authorization, failpoints, exit `13` verified rollback, exit `14` indeterminate handling, runtime identity/resource/readiness gates, immutable evidence, and projection-stale handoff.

8. **Replace exporter and harness integration parsing.** Refactor `scripts/export-opencode-projection.sh` to import/call `node_config.py` for selection, C-locale ordering, aliases, effective ports, parallelism, context/output limits, thinking, and default node. Preserve destination hardening, no-write/print behavior, generated JSON schemas, generation publication, and restart guidance. Refactor `scripts/opencode-harness-integration.sh nodes`, launch, and default selection to the same API. Change `node add` to build one YAML candidate only: retain required CLI fields, add options for all explicit server/tuning fields or documented safe defaults in the command layer, validate global collisions, default to no-write, and on `--yes` perform the single atomic YAML transaction. It must create no overlay, server env, example env, or OpenCode env.

9. **Migrate fixtures and tests before deleting legacy sources.** Add a focused `tests/node-config-validation.sh` (or equivalent under `tests/`) for valid example/schema agreement, malformed YAML, duplicate keys, alias/merge/tag/multidoc rejection, coercion traps, unknown/type/range/pattern/cross-field failures, size/NUL/UTF-8, owner/mode/symlink/identity checks, deterministic canonicalization/rendering, atomic update/collision/no-write behavior, env temp lifecycle, and diagnostics that omit values. Convert all six existing offline suites and `tests/fixtures/context/config/*` to private mode-0600 YAML or selected-server-snapshot fixtures. Preserve existing tunnel, Compose, projection, node-add, context failpoint/compensation, worker-install, and harness-integration adversarial coverage. Add proof that remote deployment and evidence contain no other-node topology, SSH/default data, full YAML, or OpenCode metadata.

10. **Cut over and remove dual-source artifacts.** After semantic/render parity and migrated suites pass, set the real ignored `config/nodes.yaml` to exact mode `0600`; update `.gitignore` to ignore that file and generated private state only while allowing the example/schema. Delete tracked `config/nodes/nodes.tsv`, per-node env examples, `config/nodes/opencode-projection.env.example`, `.env.example` guidance that points to them, and label-only overlays. Remove backed-up old private per-node `.env`/`.opencode.env` leaves from active config paths. Run a scoped search proving no runtime or normal documentation references the deleted sources.

11. **Rewrite all operator contracts.** Update `README.md` and `docs/{architecture,adding-a-node,operations,model-tuning,troubleshooting,rollback,opencode-projection,opencode-harness-integration,context-management,context-worker-deployment}.md`. Name `config/nodes.yaml` as the only manually edited node-config touch point; document example/schema, mode/owner requirements, atomic node-add/context behavior, generated local env lifecycle, generated remote selected-node snapshot and sync/install/rollback workflow, projection separation, stale-state refusal, backup/recovery, PyYAML prerequisite on every parser execution host, and full OpenCode quit/restart after regenerated provider configuration. Keep legacy root-`.env` rollback text only if clearly labeled as a separate historical deployment and not a normal node workflow.

### File Contracts and Decisions

- `config/nodes.yaml`: ignored, current-user regular file, exact `0600`, sole manual source. It is never committed, remotely copied, sourced by a shell, or printed.
- `config/nodes.example.yaml`: committed, secret-free, structurally complete local and remote examples using placeholders that satisfy the contract without machine-specific real values.
- `config/nodes.schema.json`: committed Draft 2020-12 closed structural contract at the caller-specified path. Runtime validation remains in the shared module; tests must prove schema/module agreement for the example and a mutation corpus.
- `scripts/node_config.py`: sole YAML loader, structural/cross-field validator, canonicalizer, selected-node reader, projection-data provider, server-env/snapshot renderer, and atomic YAML updater. No second parser is permitted in shell heredocs or exporter/integration code.
- `scripts/lib.sh` and `compose.yaml`: use one selected typed node and generated ephemeral env; base Compose derives the label from `NODE_SLUG`; no overlay path remains.
- `scripts/install-context-worker.sh`: becomes the explicit remote script-plus-selected-server-snapshot deployment/rollback boundary. It never sends the complete YAML or OpenCode/controller metadata.
- `scripts/context*.sh`: local source kind is YAML; remote source kind is the generated selected-server snapshot. Temporary remote-first divergence exists only inside a recorded transaction and must be compensated or reported indeterminate.
- `scripts/export-opencode-projection.sh` and `scripts/opencode-harness-integration.sh`: consume typed module output and preserve existing OpenCode/harness JSON surfaces; no per-node OpenCode env remains.
- Deleted after cutover: `config/nodes/nodes.tsv`, `config/nodes/*.env.example`, `config/nodes/opencode-projection.env.example`, active private `config/nodes/*.env`, active private `config/nodes/*.opencode.env`, `compose.main.yaml`, and `compose.secondary.yaml`.
- Arbitrary per-node Compose overlays are intentionally not retained. The observed overlays are label-only; future differences must be added as explicit closed typed fields and validated Compose mappings.

### Dependencies and Sequencing

- `root-researcher-001-config-surface` is complete and is the evidence dependency for this plan.
- Steps 2-4 precede private conversion and every consumer migration. Serving/Compose migration precedes effective-Compose test conversion. Remote snapshot deployment precedes remote context migration. Context, exporter, and integration migrations all precede legacy deletion and docs cutover.
- Use serial implementation because the same dirty cross-cutting files and durable schemas are shared across work units. If split into implementer tasks, use fresh tasks in this order: contract/parser; serving/remote derivative; context transactions; exporter/integration/tests/docs/deletion. Do not integrate partial cutovers that leave two active sources.
- PyYAML is mandatory on controller/local parser paths and on remote workers only if they parse YAML; the selected JSON snapshot design keeps private YAML parsing controller-local, while the shared module remains deployed for snapshot/env operations.

### Verification Gates

1. **Contract/parser gate:** `python3 -I scripts/node_config.py validate --config config/nodes.example.yaml --allow-public-example`; focused node-config suite passes all malformed/type/alias/duplicate/mode/symlink/owner/identity/cross-field cases and proves schema/module mutation-corpus agreement.
2. **Private cutover gate:** structural `stat` proves `config/nodes.yaml` is current-UID regular `0600`; no-output semantic comparison proves every old node/default/server/OpenCode value is represented; deterministic rendered env comparison passes before old private leaves are removed.
3. **Static single-source gate:** a scoped search over `scripts`, `compose.yaml`, `README.md`, `docs`, and `tests` returns no live/normal-workflow reference to `nodes.tsv`, per-node `.opencode.env`, per-node server env as source, or `compose.main.yaml`/`compose.secondary.yaml`; no handwritten `yaml.safe_load`/TSV/env parser exists outside `scripts/node_config.py` and test-only adversarial helpers.
4. **Serving/remote gate:** tests prove exact generated env keys/order/modes/cleanup and ambient unsetting; effective Compose contains the derived node label and prior loopback/model/GPU invariants; remote payload inspection proves one selected server snapshot only and stale-digest refusal.
5. **Context gate:** migrated local and remote show/plan/apply/rollback/compensation suites pass all existing and new failpoints; old durable schemas are rejected; source/semantic/render digests are bound correctly; remote-first controller-commit failure restores the exact prior snapshot; OpenCode metadata never enters worker artifacts.
6. **Projection/integration gate:** generated native provider/catalog documents pass committed schemas and harness input validation fixtures; limits/thinking/default/effective ports remain exact; node-add dry-run writes nothing, collision paths refuse, and `--yes` changes only `config/nodes.yaml` atomically.
7. **Full offline gate:** run `bash tests/safety-validation.sh`, `bash tests/tunnel-validation.sh`, `bash tests/context-worker-install-validation.sh`, `bash tests/context-validation.sh`, `bash tests/opencode-projection-validation.sh`, `bash tests/opencode-harness-integration-validation.sh --harness-root "$HARNESS_ROOT"`, the new node-config suite, `bash -n` over changed shell scripts, Python compile/import checks for `scripts/node_config.py`, and `git diff --check`.
8. **Independent validation gate:** a validator, not implementation self-checks or lifecycle hooks, must review changed/deleted files, execute the offline gates, inspect private/generated file modes without exposing values, and report live SSH/Docker/GPU/service/OpenCode/publication checks as intentionally skipped rather than passed.

### Assumptions and Tradeoffs

- Assumption retained: PyYAML is accepted and can be documented/provisioned on parser execution hosts.
- Assumption retained: image digests and machine-local model paths remain private YAML data.
- Decision: controller YAML is authoritative; a persistent remote selected-server snapshot is a generated compatibility/state boundary, not a second manual source. This preserves direct worker operation and context rollback while minimizing disclosure.
- Decision: JSON Schema documents structural closure; explicit shared code owns cross-node uniqueness and hardened YAML semantics to avoid adding a `jsonschema` runtime dependency.
- Tradeoff: atomic YAML rewrites may normalize formatting/comments. Deterministic serialization and exact transaction backups are preferred over preserving presentation that could make semantic updates ambiguous.
- Tradeoff: changing any non-context remote server setting requires explicit snapshot redeployment before remote operation. Digest refusal is preferred to implicit SSH mutation or silent drift.

### Handoff Notes

- Recommended next role: `implementer`, `taskMode: implementation`, with this artifact as the approved plan and the serial sequencing above.
- The implementer must first re-check the dirty/untracked inventory. Many scoped context/projection/integration files are currently untracked and several docs/config files are modified; treat their bytes as work to preserve and migrate, not disposable baseline.
- Before deleting active old private inputs, retain a verified owner-only backup and record comparison success without payloads. Do not contact remotes or services during implementation; remote behavior must be fixture-driven.
- Open questions requiring operator evidence rather than implementation guesswork: whether out-of-tree automation references old paths, whether any unobserved overlay contains non-label behavior, and whether live durable context/deployment state exists. If any is found, stop the cutover and report the blocker; do not add dual-source fallback.

- Outputs: Ordered implementation plan, exact file contracts/decisions, dependency sequence, executable verification gates, assumptions/tradeoffs, and implementer handoff.
- Evidence: Supplied current-tree research plus direct read-only inspection of the identified parser, serving, projection, integration, context, deployment, documentation, test, and dirty-worktree surfaces.
- Artifact links: `.memory/orchestrations/2026-08-28-centralize-node-yaml/roles/researcher/root-researcher-001-config-surface.md`; this artifact.

## Handoff

- Next role: `implementer` (`taskMode: implementation`), followed by an independent `validator`.
- Limitations: Planning only. No implementation files, private config, remote state, services, or OpenCode configuration were changed; no test result or live-state absence is claimed.
- Risks: Existing nonterminal durable state, out-of-tree consumers, unobserved overlay behavior, parser/schema drift, private-value leakage, remote generated-snapshot drift, and unsafe partial cutover. The gates above fail closed on each in-scope risk; out-of-tree/live evidence remains an operator prerequisite.
