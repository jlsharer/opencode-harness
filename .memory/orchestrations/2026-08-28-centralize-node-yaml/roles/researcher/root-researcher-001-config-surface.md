# Role Trace Artifact: Centralized Node Configuration Research

## Metadata

- orchestrationId: `2026-08-28-centralize-node-yaml`
- role: `researcher`
- artifactId: `root-researcher-001-config-surface`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research the current `llama-server` working tree's dependencies on `nodes.tsv`, per-node server envs, per-node OpenCode envs, and per-node Compose overlays; recommend a closed owner-private YAML source, compatibility treatment, context-transaction treatment, remote boundary, migration/deletion scope, and executable verification scope.
- Required context present: Yes. The packet supplied the scoped question, current-working-tree freshness requirement, relevant paths, source constraints, downstream needs, `workspaceRoot`, and `traceRoot`.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Read current tracked and untracked source, tests, fixtures, docs, contracts, schema/template, Git status, file modes, and local Python YAML availability. No infrastructure source was changed, no service/provider/network operation was invoked, and no private payload values are reproduced here.
- Files read: `llama-server/scripts/{lib.sh,ai.sh,tunnel.sh,remote.sh,remote-secondary.sh,export-opencode-projection.sh,opencode-harness-integration.sh,context-common.sh,context.sh,context-worker.sh,install-context-worker.sh,validate.sh}`; `llama-server/{compose.yaml,compose.main.yaml,compose.secondary.yaml,.gitignore,README.md}`; safe examples and fixtures under `config/nodes/` and `tests/fixtures/context/config/`; relevant tests, docs, and schema inventory; harness role contract, trace schema, and trace template.
- Files changed: Only this required trace artifact.
- Commands/checks: `git status --short`; `git diff --stat`; `git diff --name-only`; `git ls-files` for the scoped surfaces; structural `stat` of current config leaves/overlays; `python3 -I -c 'import yaml'` and `/usr/bin/python3 -I -c 'import yaml'`; scoped content searches. No acceptance tests were run because this is research, not validation.

## Output Contract

### Cited Findings

1. **The present configuration is split across four independently parsed surfaces.** Direct evidence: `lib.sh` fixes `REGISTRY` to `config/nodes/nodes.tsv`, parses eight tab fields into routing, overlay, env, and tunnel globals, then separately parses a server env allowlist (`scripts/lib.sh:6,28-56,58-117`). The exporter independently reimplements the TSV and both env parsers (`scripts/export-opencode-projection.sh:110-225`). The harness integration independently reimplements registry/env/projection parsing and writes four node-add artifacts (`scripts/opencode-harness-integration.sh:31-54,58-181`). This is parser and invariant duplication, not merely file duplication.

2. **Exact runtime consumers.** Direct consumers are `lib.sh`, `export-opencode-projection.sh`, and `opencode-harness-integration.sh`. Indirect consumers through `lib.sh/load_node` are `ai.sh` (all lifecycle/health/model/GPU/validate commands), `tunnel.sh` and its start/status/stop wrappers, `context.sh`, `context-worker.sh`, and `install-context-worker.sh` (`scripts/ai.sh:5,32-53`; `scripts/tunnel.sh:5,18-20`; `scripts/context.sh:12-15,532-537`; `scripts/context-worker.sh:14-17,889`; `scripts/install-context-worker.sh:7-33`). `remote.sh` and `remote-secondary.sh` forward into `ai.sh` (`scripts/remote.sh:8-9`; `scripts/remote-secondary.sh:8-9`).

3. **Compose requires a generated env compatibility boundary today, but per-node overlays do not carry hardware configuration.** `compose.yaml` interpolates image, publication, model, and llama settings from env values (`compose.yaml:3-31`). `lib.sh` invokes `docker compose --env-file "$ENV_FILE" -f compose.yaml -f "$OVERLAY"` (`scripts/lib.sh:138-147`). Both current overlays contain only the node label (`compose.main.yaml:1-4`; `compose.secondary.yaml:1-4`). Therefore an owner-private temporary env is an unavoidable Compose adapter unless Compose itself is redesigned; the two current overlays can be eliminated by deriving `NODE_SLUG` and interpolating the label in base Compose. Any future free-form overlay capability would weaken a closed YAML contract and should not be preserved without an explicit requirement.

4. **OpenCode projection is controller-local metadata with strict non-copy semantics.** The exporter combines server alias/host/context/parallel with client output/thinking and maps remote nodes to tunnel-local ports (`scripts/export-opencode-projection.sh:162-225,327-359`). Context projection observation reads the per-node OpenCode env only on the controller (`scripts/context.sh:372-412`). Documentation expressly says it must not be copied to a remote worker and does not affect server recreation (`docs/opencode-projection.md:40-44`). A centralized controller YAML may contain this section, but a remote compatibility artifact must omit it.

5. **Remote operation currently assumes separately present remote configuration.** `run_remote_ai` SSHes to the remote checkout and executes its local `ai.sh`, which consequently loads the remote checkout's registry/env/overlay (`scripts/lib.sh:315-329`; `scripts/ai.sh:32-40`). The worker installer copies only four public scripts and explicitly does not read/copy private env data (`scripts/install-context-worker.sh:78-89`; `docs/context-worker-deployment.md:10,20`). Tests likewise construct separate local and remote registries/envs and assert that projection metadata is absent remotely (`tests/context-validation.sh:18-44,220-228`; `tests/context-worker-install-validation.sh:18-30`). Thus “one source of truth” needs an explicit controller-authoritative deployment protocol; simply replacing each checkout's files with an independent `nodes.yaml` would retain two mutable truths.

6. **Context changes are tightly coupled to mutating env bytes and their hashes.** The worker fingerprints full and non-context env bytes, builds a candidate that changes exactly `LLAMA_ARG_CTX_SIZE`, verifies the Compose delta, atomically installs it, and preserves exact `env.before` (`scripts/context-worker.sh:151-176,417-449,663-722`). For remote apply the worker commits first, after which the controller constructs and atomically installs a matching local env mirror; failure requests compensation (`scripts/context.sh:577-617`). Plans, source facts, receipts, chains, rollback classification, and parity all bind registry-row, overlay, env, and non-context hashes (`scripts/context.sh:414-457,481-505`; `docs/context-management.md:23-30,44-56`). A YAML migration must version these evidence schemas and cannot safely leave compatibility envs as independently editable inputs.

7. **The committed and generated file classification is clear.** Current committed/manual source: `nodes.tsv`, `compose.main.yaml`, `compose.secondary.yaml`, `main.env.example`, `secondary.env.example`, base Compose, docs, and the older two tests (confirmed with `git ls-files`). Current ignored private/manual source: per-node `.env` and `.opencode.env`, all structurally owner mode 0600; `.gitignore` encodes those patterns (`.gitignore:1-6`). Current generated runtime state: OpenCode projection generations and external context/deployment state (`docs/opencode-projection.md:20-24`; `docs/context-management.md:48-50`). Remote worker copies are independently deployed scripts plus a separately maintained private server env; projection metadata is deliberately local only.

8. **All six offline suites and three committed context fixture leaves depend on the old shape.** `safety-validation.sh` constructs TSV/env/overlay and mutates env/overlay invariants; `tunnel-validation.sh` constructs remote TSV/overlay; `context-validation.sh` creates local/remote registries, envs, overlays, and projection envs; `context-worker-install-validation.sh` creates local/remote TSV/env/overlays; `opencode-projection-validation.sh` adversarially tests TSV and both env types; `opencode-harness-integration-validation.sh` tests node-add publication/collision semantics over all four artifacts. The context fixtures are `tests/fixtures/context/config/{nodes.tsv,node.env,node.opencode.env}`. Evidence: scoped test references summarized at `tests/safety-validation.sh:12-14,445-457`, `tests/tunnel-validation.sh:12-14`, `tests/context-validation.sh:18-44,220-228`, `tests/context-worker-install-validation.sh:18-30,314`, `tests/opencode-projection-validation.sh:25-67,281-425`, and `tests/opencode-harness-integration-validation.sh:16-35,105-138`.

9. **Documentation dependencies extend beyond the five named targets.** Primary rewrites are required in `README.md:45-79,131-159`, `docs/architecture.md:3-7`, `docs/adding-a-node.md:13-25`, `docs/opencode-projection.md:3-44`, `docs/context-management.md:3-56`, and `docs/opencode-harness-integration.md:19-52`. Secondary terminology/operational rewrites are required in `docs/operations.md:9-19,37-62`, `docs/model-tuning.md:3-11`, `docs/troubleshooting.md:9,14-16,27`, `docs/context-worker-deployment.md:10-20`, and context portions of `docs/rollback.md:25-29`. The legacy rollback `.env` procedure at `docs/rollback.md:35-55` appears to describe a retained legacy deployment, so deletion versus explicit historical labeling is unresolved.

10. **PyYAML is already an explicit serving-host prerequisite, but not yet a universal command prerequisite.** Only effective Compose source validation currently imports YAML (`scripts/lib.sh:149-164`); docs require Python/PyYAML for validation and adding a node (`docs/operations.md:15`; `docs/adding-a-node.md:24`). Both current `python3 -I` and `/usr/bin/python3 -I` successfully imported PyYAML 6.0.1 in this environment. Context commands already resolve one root-owned Python and run it isolated (`scripts/context-common.sh:5-7,15-40,86`). Inference: one shared Python parser is safer than preserving shell and embedded-Python parsers, but it makes PyYAML mandatory for every config-consuming command and must be included in the deployed worker bundle or invoked as a fixed public parser file.

### Recommended Closed YAML Shape

The following is a structural recommendation only; placeholders intentionally carry no private values:

```yaml
schemaVersion: 1
opencodeDefault: node-slug
nodes:
  node-slug:
    execution:
      mode: local                 # local | remote
      sshAlias: null              # required string only for remote
      remoteRoot: null            # required absolute-or-~/ path only for remote
    tunnel: null                  # remote requires {localPort, remotePort}
    server:
      projectName: replace
      image: replace-tag-at-sha256
      model:
        directory: /absolute/path
        file: replace.gguf
        alias: replace
      hostPort: 1
      llama:
        contextSize: 256
        parallel: 1
        cacheTypeK: f16
        cacheTypeV: f16
        flashAttention: auto
        gpuLayers: all
        splitMode: layer
        tensorSplit: "1"
        mainGpu: 0
        endpointMetrics: true
        threads: null
        batchSize: null
        ubatchSize: null
    opencode:
      outputLimit: 1
      enableThinking: false
```

Schema/parser requirements: root and every object closed; one document; no duplicate keys, aliases, merge keys, custom tags, non-string mapping keys, NaN/Infinity, timestamps, or implicit YAML 1.1 booleans; node-key slug regex; integer bounds `1..2147483647`; ports `1..65535`; exact image/model/path/alias patterns carried forward; local requires null SSH/tunnel fields, remote requires all; remote server `hostPort == tunnel.remotePort`; unique model aliases and effective client ports; `outputLimit < contextSize`; exact one default naming an existing node. Prefer typed booleans/integers but retain `tensorSplit` and enum-like llama values as constrained strings because current accepted values are not uniformly numeric.

Implement one shared, importable Python parser/validator/renderer, used by every shell entry point. PyYAML `safe_load` alone is insufficient because duplicate mappings are not rejected by default; use a custom safe loader/composer plus explicit closed structural validation. A committed JSON Schema (`schemas/nodes.schema.json`) and secret-free `config/nodes.example.yaml` document the contract, while the shared parser remains the dependency-light runtime authority unless the project deliberately adds and verifies `jsonschema`.

### Migration and Deletion Implications

- Add ignored `config/nodes.yaml` (required regular file, current UID, exact 0600, no-follow/identity-stable bounded read), committed `config/nodes.example.yaml`, committed `schemas/nodes.schema.json`, and one shared Python config module/CLI.
- Delete after one audited conversion: `config/nodes/nodes.tsv`, `config/nodes/main.env.example`, `config/nodes/secondary.env.example`, `config/nodes/opencode-projection.env.example`, `compose.main.yaml`, and `compose.secondary.yaml`; delete private per-node `.env`/`.opencode.env` only after backup and semantic/hash comparison to the YAML conversion. `.env.example` should be removed or rewritten because it directs users to the old examples.
- Change `.gitignore` to ignore exactly `config/nodes.yaml` and generated private compatibility/state locations; do not broadly ignore committed `*.example.yaml` or schema files.
- Base Compose should derive the node label from generated `NODE_SLUG`; remove overlay selection and overlay source hashes. Generate a selected-node env inside an owner-0700 temporary directory at 0600 for each Compose invocation, verify exact keys and bytes, and remove it. Do not persist local generated envs.
- Node-add should become a single atomic rewrite of the YAML: lock, no-follow read, validate current document and collisions, create deterministic candidate, fsync 0600 temp, validate candidate, atomic rename, fsync parent. A no-write plan should report structural paths/fields, never values. It should no longer create four leaves or append a registry row.
- Exporter/integration should consume the shared typed object directly; no TSV/env compatibility should remain there. Projection generation/publication boundaries remain unchanged.
- Remote workers should receive only a selected-node server snapshot or deterministic env derivative, never the all-node YAML and never `opencode`. The controller YAML must be authoritative. A separately authorized, locked remote-config deployment transaction should bind source YAML digest + selected-node semantic digest + rendered-env digest, install the remote 0600 derivative atomically, and record immutable rollback evidence. `install-context-worker.sh` can remain script-only or be explicitly expanded, but silently copying private config would violate its current contract.
- Context plans/evidence should bind canonical YAML bytes, selected-node semantic digest, and rendered server-env digest instead of registry/overlay/local-env hashes. For remote apply, retain the proven remote-first/compensate pattern: derive reviewed YAML candidate and remote env candidate; worker atomically installs/recreates/verifies remote derivative; controller atomically commits YAML; a controller commit failure requests exact remote compensation. For local apply, atomically commit the YAML candidate and regenerate ephemeral env for recreation, with exact YAML backup used for compensation. Rollback restores YAML from transaction evidence, not an editable env mirror. Bump plan/request/receipt/chain/facts schemas and fail closed on old in-progress state.

### Executable Verification Scope

- Parser/schema: valid example; no-follow owner/mode; size/NUL/UTF-8; duplicate/unknown keys; aliases/merge/tags/multiple docs; YAML coercion traps; type/range/pattern/conditional errors; missing/duplicate default; uniqueness; output/context and remote-port relations; deterministic canonical selected-node representation.
- Compatibility rendering: exact env key set/order/newline; shell metacharacter and newline rejection; 0600/0700 lifecycle; ambient env unsetting; no payload in diagnostics; base Compose label; effective Compose invariants; temporary cleanup on success/failure/signal.
- Runtime/tests: migrate and run all six README offline suites plus Bash syntax checks and `git diff --check`. Preserve existing adversarial source/render/context/projection/node-add cases in YAML form rather than dropping them.
- Context: local and remote show/plan/apply/compensate/rollback, crash points on remote derivative install and YAML commit, digest/parity semantics, old durable-state rejection, projection stale/aligned behavior, and proof that remote artifacts omit topology for other nodes and all OpenCode metadata.
- Migration: converter dry-run; old-vs-new typed semantic comparison without printing values; generated old-env byte equivalence where feasible; private file modes; Git-ignore proof; no remaining live references to deleted surfaces. Live SSH/Docker/GPU/service/OpenCode checks remain separately authorized and are not established by offline tests.

### Implementation Implications

- This is a cross-cutting migration, not a local parser swap: source hashing, context durable schemas, deployment contracts, node-add atomicity, projection, docs, tests, and fixtures all change together.
- A compatibility env should be a transient or remote deployed derivative with recorded source digest, never an operator-edited source. Keeping long-lived local per-node envs would reintroduce split-brain configuration.
- Eliminating overlays is safe for the present tree because both only label the node; if unobserved deployment-specific overlays exist outside this checkout, they require explicit inventory before deletion.
- The shared parser should be shipped with the context worker bundle and included in its bundle digest if workers parse YAML or render config. Alternatively, keep remote workers consuming only a closed generated env snapshot and keep YAML parsing controller-only; this minimizes disclosure and remote dependencies.

### Risks and Unresolved Questions

- **Remote authority decision:** Direct evidence proves remote checkout config is currently independently present, but the packet does not specify whether direct on-target `ai.sh --local` operation must remain available without the controller. If yes, a deployed selected-node derivative and explicit drift/sync workflow are unavoidable.
- **Current durable transactions:** No state directories were inspected. Migration must detect/block or complete existing context/deployment transactions before changing digest schemas or file locations.
- **Out-of-tree consumers:** Current working-tree searches cannot prove that user shell functions, cron/systemd units, backup scripts, or remote checkouts do not directly reference old paths. Inventory them before deletion.
- **Private conversion correctness:** Private values were intentionally not reported. An implementer must use a no-output converter and semantic/hash checks; manual re-entry is higher risk.
- **Overlay generality:** Present overlays are label-only, but docs claim hardware-specific additions are allowed (`docs/adding-a-node.md:20`). Decide whether that capability is obsolete or needs a closed typed hardware section; do not accept arbitrary embedded Compose YAML by default.
- **YAML schema enforcement:** A committed JSON Schema is useful documentation and test input, but runtime reliance on `jsonschema` would add a new dependency not currently documented. Explicit shared validation avoids that dependency at the cost of keeping schema and code synchronized.
- **PyYAML availability:** Verified only on the current client. Existing docs require it on serving hosts, but every remote target must be checked before making all commands depend on it.
- **Legacy rollback doc:** `docs/rollback.md:35-55` references a legacy root `.env`; confirm whether it remains historical recovery guidance rather than part of the node-config migration.

### Source List

- Runtime/config: `scripts/lib.sh`, `scripts/ai.sh`, `scripts/tunnel.sh`, `scripts/export-opencode-projection.sh`, `scripts/opencode-harness-integration.sh`, `scripts/context-common.sh`, `scripts/context.sh`, `scripts/context-worker.sh`, `scripts/install-context-worker.sh`, `compose.yaml`, current per-node overlays, `.gitignore`, safe config examples.
- Tests/fixtures: all six suites listed in `README.md:163-173`; `tests/fixtures/context/config/*`.
- Documentation: `README.md`; `docs/{architecture,adding-a-node,operations,model-tuning,troubleshooting,rollback,opencode-projection,opencode-harness-integration,context-management,context-worker-deployment}.md`.
- Repository evidence: current `git status`, `git diff` inventory, tracked-file inventory, structural modes, and isolated Python/PyYAML import checks.

### Recommended Next Role

`planner` in `plan` mode, to resolve the remote-authority and overlay-capability decisions and produce an ordered, atomic migration plan with explicit durable-state/version gates. Independent `validator` work remains required after implementation.

## Handoff

- Next role: `planner` (`taskMode: plan`).
- Limitations: Research only; no infrastructure files were edited, no private values were recorded, no acceptance was validated, no live remote/runtime state was contacted, and out-of-tree/remote consumers remain unknown.
- Risks: Split-brain controller/remote configuration, unsafe context durable-state migration, accidental disclosure in generated artifacts/diagnostics, parser/schema divergence, and deleting overlay capability without an explicit decision.
