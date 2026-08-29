# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-28-simplify-opencode-local`
- role: `validator`
- artifactId: `root-validator-002-final`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `taskMode: integration-check`; changed-file inventory across the harness, infrastructure repository, and shell adapter; executable verification criteria and commands; schema, warning, skip, risk, path, and final acceptance contracts.
- Required context present: Yes. The packet was contract-complete, and the prior failed validator and remediation traces were available. Implementer claims were not used as acceptance evidence.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Independently reran the complete authorized offline suite, directly reproduced closure of both prior blockers, inspected schema/manifest/wrapper/help/README/shell path coherence, and added an unrelated-process sentinel around the failure/signal cleanup fixture. Acceptance is **PASS**.
- Files read: role/memory contracts, schema, and template; prior validator and remediation traces; package/runtime manifests; routing schemas and enforcement; launcher and tests; infrastructure wrapper, integration fixture, registry, README, and shell adapter.
- Files changed: this validator trace artifact only.
- Commands/checks:
  - All packet commands were run in their specified roots.
  - Temporary malformed-remote node-add reproduction with registry digest and target-absence checks.
  - Direct README/help contract assertion.
  - Integration cleanup fixture rerun with an unrelated live-process sentinel.
  - Read-only status/diff inspection in both repositories.

## Output Contract

- Outputs: final pass/fail matrix, prior-blocker reproductions, command outputs, schema results, security and activation findings, remediation list, skipped checks, and residual risk.
- Evidence: independent command results and adversarial reproductions below.
- Artifact links: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/validator/root-validator-002-final.md`

### Acceptance decision

**PASS.** Both previous blocking findings are closed with direct command-backed evidence, every authorized acceptance command passed, and no new goal- or gate-linked defect was found.

### Pass/fail matrix

| Gate | Result | Evidence |
|---|---|---|
| Prior blocker: malformed remote node add fails before writes | PASS | Direct isolated reproduction returned 1 with `error: invalid remote node registry fields`; registry digest stayed identical and all four proposed targets remained absent. The integration fixture also rejected bad SSH alias/root/ports/tunnel agreement/scalars, duplicate aliases/ports/defaults while checking unchanged registry bytes. |
| Prior blocker: README/help/normal-path coherence | PASS | Direct assertion found all six required README examples, zero removed verbs, exactly the three modes, and launch/nodes/node-add/help in wrapper help. The offline integration fixture executed nested launch in all three modes, `nodes`, local/remote plan/apply, and help. |
| Failure and handled-signal transient cleanup | PASS | Integration fake launcher rejects unless the transient root is 0700 and every input leaf is 0600; failure status 23 and handled TERM paths each assert the recorded root is absent. The rerun reached PASS while an unrelated sentinel remained alive. |
| Nested trusted-worktree launch and strict workspace behavior | PASS | Runtime suite passed 38/38, including nested omitted-workspace discovery and strict explicit nested-workspace behavior; foreign repository suite passed 8 with one optional skip. Integration fixture launched from a nested Git directory. |
| Exact three routing modes and strict provider filters | PASS (offline) | Routing policy passed 40/40, including exact mixed/local-only/cloud-only schema behavior, strict native provider mutations, and atomic fourth-role preflight. Integration fixture observed the expected mode/force/default-local combinations. |
| External provider/catalog/profile contract | PASS | Runtime tests passed all-or-none rejection, exactly three supported input combinations, closed grammar, structured validation, owner-only snapshots, and cleanup. |
| Canonical deterministic all-node projection and node registry | PASS | Projection fixture passed sorted all-node generation and malformed/collision controls; integration fixture consumed `--all`; repository registry has one default and canonical local/remote rows. |
| Offline capabilities and package/runtime identity | PASS | Capabilities test passed as deterministic, closed, offline, and no-write. Package and runtime manifest both identify 0.1.12; dry-run pack reported `opencode-harness-runtime@0.1.12` with 40 entries. |
| Source/portable boundaries | PASS | Source validator, portable validator, portable test suite, both runtime suites, and package dry-run passed. Darwin-only and privilege-dependent skips matched policy. |
| Shell activation adapter | PASS | `.zshrc` parsed; interactive `type` resolved `opencode-local` to the two-line forwarding function; interactive help displayed the reviewed command contract. |
| No prohibited live or Git mutation | PASS | Only fake/offline fixtures and read-only Git inspection were used. No TUI, provider/model endpoint, credential, SSH, tunnel, service, network, publication, commit, staging, or repository write command was run. |

### Prior-blocker reproductions

Malformed remote transaction:

```text
malformed_remote_rc=1
stderr=error: invalid remote node registry fields
registry_unchanged=true
created_targets=none
```

README/help contract:

```text
readme_required_examples=6/6
readme_removed_verbs=0
help_modes=mixed,local-only,cloud-only
help_commands=launch,nodes,node-add,help
```

Cleanup/process sentinel:

```text
OpenCode harness simplified integration fixtures: PASS
unrelated_sentinel_alive_after_signal_fixture=true
```

The fixture's fake `validate-inputs` exits unless its transient parent is mode 0700 and each structured leaf is mode 0600. It records each accepted root; both child-failure and handled-TERM branches require one new record and require that path to be absent after exit.

### Command outputs

| Command | Result |
|---|---|
| `node --check bin/opencode-harness.mjs` | PASS, no output. |
| `node .opencode/routing/routing-policy.test.mjs` | PASS, 40/40; expected typeless-package ESM warning. |
| `node --test .opencode/scripts/runtime-harness.test.mjs` | PASS, 38/38; two expected unprivileged ownership skips. |
| `node --test .opencode/scripts/runtime-foreign-repo.test.mjs` | PASS, 8 pass/1 optional skip. |
| `node .opencode/scripts/portable-harness.test.mjs` | PASS, 18 pass/4 expected Darwin skips. |
| `node .opencode/scripts/validate-harness.mjs` | PASS; Darwin native checks were not run on Linux; expected ESM warning. |
| `node .opencode/scripts/validate-portable-harness.mjs --root .` | PASS; expected ESM warning. |
| `npm pack --dry-run --json` | PASS; version 0.1.12, 40 entries, no publication. |
| Harness `git diff --check` | PASS, no output. |
| Both infrastructure `bash -n` commands | PASS, no output. |
| `bash tests/opencode-projection-validation.sh` | PASS; two expected unprivileged ownership skips. |
| `bash tests/opencode-harness-integration-validation.sh --harness-root ...` | PASS; rerun with unrelated-process sentinel also passed. |
| Infrastructure `git diff --check` | PASS, no output. |
| `zsh -n /home/joshl/.zshrc` | PASS, no output. |
| `zsh -ic 'type opencode-local'` | PASS; function resolved from `.zshrc`. |
| `zsh -ic 'opencode-local --help'` | PASS; exact launch/nodes/node-add/help surface and three modes displayed. |

### Schema results

- `.opencode/schemas/harness-model-routing.schema.json` and `.opencode/schemas/harness-routing-profile.schema.json`: PASS through routing tests and both validators. `providerClassMode` is closed to `mixed`, `local-only`, and `cloud-only`; local-only requires enabled/forced local routing, while non-local-only forbids force.
- `.opencode/runtime.manifest.json`, `.opencode/portable.manifest.json`, and `.opencode/harness.manifest.json`: PASS through recursive source/portable validation and package inventory checks.
- Package/runtime identity: PASS; both are 0.1.12.
- Registry grammar: PASS; node-add preflight validates the complete proposed row and all existing rows/projection inputs before its apply branch, and projection/integration fixtures independently consume that grammar.
- README/help contract: PASS through direct content/help assertion plus executed offline fixture commands.

### Security and activation findings

- Malformed node-add inputs now fail before the apply branch, preserving canonical registry bytes and all proposed targets.
- The transient wrapper boundary uses a mode-0700 root and mode-0600 provider/catalog/profile leaves, validates all three before launch, and cleans them after success, child failure, and handled TERM. The unrelated sentinel survived.
- Strict provider filter changes are atomically preflighted in offline policy/plugin tests. Live native provider behavior remains outside authorization.
- The shell adapter is a two-line absolute-path forwarder and introduces no mode, provider, credential, node, or workspace policy of its own.
- Nested workspace resolution, project collision checks, owner/mode checks, all-or-none external inputs, and owner-only snapshots remain fail-closed in the runtime suites.
- Activation note: fully quit and restart OpenCode before any separately authorized use because package, routing, and plugin surfaces changed.

### Remediation list

None. No blocking defect remains within this work unit, and the remediation budget is exhausted in any event.

### Skipped checks and residual risk

- Skipped as required: live OpenCode TUI, native provider/model/endpoint behavior, credentials, SSH/tunnels/services, network, global installation, publication, and real infrastructure activation.
- Expected skips: Darwin-only portable checks on Linux and foreign-owner fixtures requiring privilege.
- Residual risk: native provider filters and endpoint projection are proven only through offline fixture/config/plugin behavior across the declared OpenCode range; real activation needs separate authorization.
- Residual risk: both repositories contained substantial pre-existing dirty and untracked surfaces. Read-only status/diff checks preserved them, but no supplied baseline can establish historical provenance.

## Handoff

- Next role: parent orchestration for final synthesis/decision.
- Limitations: Offline integration-check only; no live activation, service, endpoint, credential, network, SSH, publication, or Git mutation was authorized or performed.
- Risks: Real native provider behavior remains untested by policy, and existing dirty/untracked worktree provenance remains unknown. Neither blocks the supplied offline acceptance standard.
