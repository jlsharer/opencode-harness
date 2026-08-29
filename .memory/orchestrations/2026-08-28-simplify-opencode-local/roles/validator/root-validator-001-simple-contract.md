# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-28-simplify-opencode-local`
- role: `validator`
- artifactId: `root-validator-001-simple-contract`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: `taskMode: integration-check`; 29 changed paths spanning the harness, infrastructure repository, and shell adapter; 10 verification criteria; 18 required commands; schema, warning, skip, risk, path, and acceptance contracts.
- Required context present: Yes. The packet was contract-complete and the implementer evidence was available.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Independently ran every authorized command, inspected the schema/manifest/routing/launcher/wrapper/registry/shell path relationships, validated the ignored operator-local routing document directly, and ran two adversarial offline reproductions. Acceptance is **FAIL** because bounded node addition can publish an invalid canonical registry row and the primary harness README still directs operators to removed wrapper verbs.
- Files read: role/memory contracts and template; implementer and planner traces; orchestration index; package/runtime manifest; routing examples and operator override; routing loader/policy/plugin; launcher workspace/capability/run paths; infrastructure wrapper/exporter/tests/registry; harness and infrastructure README surfaces; `.zshrc`.
- Files changed: this validator trace artifact only.
- Commands/checks:
  - All 18 packet commands were run exactly in their specified roots.
  - Direct operator-routing normalization/assignment check.
  - Temporary-fixture malformed remote node-add reproduction.
  - Obsolete documented `create-profile` invocation reproduction.
  - Read-only `git status --short`, `git diff --stat`, targeted reads, and searches in both repositories.

## Output Contract

- Outputs: pass/fail matrix, command outputs, schema results, security/activation findings, remediation list, skipped checks, and residual risk.
- Evidence: independent command results and adversarial reproductions below.
- Artifact links: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/validator/root-validator-001-simple-contract.md`

### Acceptance decision

**FAIL — remediation required.** The two blocking findings are tied directly to changed behavior and acceptance gates; passing broad suites do not override them.

### Pass/fail matrix

| Gate | Result | Evidence |
|---|---|---|
| Nested trusted-worktree launch; explicit nested workspace and unsafe/non-Git rejection | PASS | Runtime suite passed 38/38, including `omitted workspace resolves a nested Git directory while explicit nested workspace stays strict`; foreign-repository suite passed 8 with 1 optional skip. |
| Exact mixed/local-only/cloud-only policy and default mixed | PASS | Routing policy passed 40/40; integration fixtures passed all three rendered modes. |
| Native strict provider filters and four/no local assignments | PASS (offline) | Routing tests proved exact local allowlist, cloud disable filtering, four local-only assignments, no cloud-only assignments, and atomic preflight failures. Live native behavior remains skipped by authorization. |
| Provider/catalog/profile input coherence | PASS | Runtime suite covered partial-pair rejection and exact supported input combinations; wrapper passes all three transient inputs in each mode and `validate-inputs` precedes `run`. |
| Canonical registry and deterministic `--all` | PASS | Projection fixture suite passed sorted all-node, malformed/duplicate/unavailable-node failures; registry has exactly one `# opencode-default=main`. |
| Bounded node add | **FAIL** | Adversarial fixture below: `node add --yes` accepted malformed remote connection fields, returned 0, published the row, then made `--all` fail. This violates full proposed-row validation and canonical registry coherence. |
| Transient modes and cleanup | PASS with residual signal risk | Integration fixtures verified mode-0600 leaves and success cleanup; wrapper creates/chmods a 0700 root and traps normal/error/signals. Runtime suite independently covered child failure and snapshot cleanup. Signal-path outer-wrapper behavior was not exercised. |
| Exact offline/no-write capabilities and no duplicate pins | PASS | Runtime test `capabilities is deterministic, closed, offline, and no-write` passed; wrapper validates the closed capability shape and contains no commit/hash pin constants. |
| Shell activation | PASS | `zsh -n`, interactive `type opencode-local`, and interactive help passed. Function is two lines and forwards only to the reviewed wrapper. |
| Package/manifests/schemas/source/portable acceptance | PASS | Package and runtime manifest both report `0.1.12`; source and portable validators passed; package dry run produced 40 entries for `opencode-harness-runtime@0.1.12`. |
| User-facing documentation coherence | **FAIL** | Harness `README.md:75-127` still presents create-profile/plan/prepare/bind/activate/run/deactivate as the normal path, but the changed wrapper supports only launch/nodes/node/help. Direct `create-profile` returned status 2. |
| No source Git/provider/network/service mutation by validation | PASS | Validation performed offline fixture work only. `git diff --check` passed in both repositories; no Git write, provider, endpoint, credential, SSH, tunnel, service, or network command was run. Existing dirty/untracked state prevents proving historical provenance. |

### Command outputs

| Command | Result |
|---|---|
| `node --check bin/opencode-harness.mjs` | PASS, no output. |
| `node .opencode/routing/routing-policy.test.mjs` | PASS, 40/40. Node emitted the nonblocking typeless-package ESM warning. |
| `node --test .opencode/scripts/runtime-harness.test.mjs` | PASS, 38/38; two unprivileged ownership fixtures reported expected skips. |
| `node --test .opencode/scripts/runtime-foreign-repo.test.mjs` | PASS, 8 pass/1 optional fixture skip. |
| `node .opencode/scripts/portable-harness.test.mjs` | PASS, 18 pass/4 expected Darwin skips. |
| `node .opencode/scripts/validate-harness.mjs` | PASS; reported Darwin activation/build checks not run on Linux. |
| `node .opencode/scripts/validate-portable-harness.mjs --root .` | PASS; nonblocking typeless-package ESM warning. |
| `npm pack --dry-run --json` | PASS; version `0.1.12`, 40 entries, no publication. |
| Harness `git diff --check` | PASS, no output. |
| Both infrastructure `bash -n` commands | PASS, no output. |
| `bash tests/opencode-projection-validation.sh` | PASS; two expected unprivileged ownership skips. |
| `bash tests/opencode-harness-integration-validation.sh --harness-root ...` | PASS. |
| Infrastructure `git diff --check` | PASS, no output. |
| `zsh -n /home/joshl/.zshrc` | PASS, no output. |
| `zsh -ic 'type opencode-local'` | PASS; function resolved from `.zshrc`. |
| `zsh -ic 'opencode-local --help'` | PASS; displayed only launch, nodes, node add, and help contract. |

Adversarial node-add evidence:

```text
node_add_rc=0
registry=# opencode-default=bad<NL>bad<TAB>remote<TAB>bad alias<TAB>not-absolute<TAB>compose.bad.yaml<TAB>config/nodes/bad.env<TAB>not-a-port<TAB>also-bad<NL>
export_all_rc=1
export_stderr=error: invalid remote node registry fields
```

Documentation/CLI mismatch evidence:

```text
$ scripts/opencode-harness-integration.sh create-profile
rc=2
stderr=error: unknown launch argument (use -- before OpenCode arguments)
```

### Schema results

- `.opencode/schemas/harness-model-routing.schema.json` and `.opencode/schemas/harness-routing-profile.schema.json`: PASS through routing tests plus source/portable validators; both close `providerClassMode` to `mixed`, `local-only`, and `cloud-only` and enforce mode/force consistency.
- `.opencode/runtime.manifest.json`, `.opencode/portable.manifest.json`, and `.opencode/harness.manifest.json`: PASS through recursive source/portable validation.
- Package identity: PASS; `package.json` version and runtime `packageVersion` are both `0.1.12`.
- Operator-local routing override: PASS direct normalization; mode `mixed`, providers `ai-infra-main` and `ai-infra-secondary`, and all four roles resolve to `ai-infra-main/QWEN3.6-35B-A3B`.
- Native provider boundary: PASS offline fixture evidence for `enabled_providers`/`disabled_providers`; live OpenCode enforcement was not authorized.

### Security and activation findings

- Trusted workspace discovery remains fail-closed and explicit `--workspace` remains root-only.
- External structured inputs retain catalog/profile all-or-none enforcement, owner/mode validation, loopback/provider/model coherence, snapshot isolation, and cleanup.
- Strict provider mutations are preflighted before role/filter mutation in offline tests.
- The shell adapter contains only an absolute reviewed wrapper invocation and `"$@"`; it contains no binding, profile, node, mode, or provider data.
- **Blocking security/coherence defect:** node add validates only presence of remote connection fields before publication. It does not validate SSH alias, remote-root shape, or local/remote ports against the registry grammar, so a successful approved transaction can poison the canonical registry.
- Restart required: fully quit and restart OpenCode after plugin/routing/package changes before separately authorized use.

### Remediation list

1. Before any `node add --yes` write, validate the complete proposed row with the same closed grammar used by `--all`: execution-specific placeholders, SSH alias, remote root, local/remote ports, overlay/env mapping, duplicate/default invariants, and every scalar. Add adversarial tests proving malformed values cause no file or registry mutation.
2. Replace the obsolete normal-path section in the harness README with the reviewed `opencode-local`, three modes, `nodes`, and bounded `node add` contract. Remove or clearly segregate unsupported create-profile/plan/bind/activate/deactivate commands. Add a documentation/CLI coherence assertion.
3. Add explicit outer-wrapper cleanup fixtures for launcher failure and signals, including 0700 root/0600 leaf checks and absence after exit.

### Skipped checks and residual risk

- Skipped as required: live TUI, provider/model/endpoint/credential, SSH/tunnel/service, network, global installation, publication, and real native provider-filter behavior.
- Expected Linux skips: Darwin-only checks and foreign-owner fixtures requiring privilege.
- Residual risk: native provider filters are proven only through fixture/config-hook behavior across the declared OpenCode range; real activation needs separate authorization.
- Residual risk: both repositories had substantial pre-existing dirty/untracked surfaces. Validation did not revert or mutate them, but no supplied pre-task baseline can prove their provenance.

## Handoff

- Next role: parent orchestration for one bounded remediation cycle, followed by a fresh independent validator task.
- Limitations: Offline integration-check only; no live activation or network/service action. Historical ownership of dirty/untracked repository content cannot be reconstructed from the packet.
- Risks: Publishing a malformed remote node currently breaks deterministic all-node launch for every mode; stale primary documentation directs operators to commands the reviewed wrapper rejects.
