# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-multi-local-model-routing`
- role: `validator`
- artifactId: `root-validator-004-proposal-evidence`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Three analysis artifacts, verification criteria, commands, schema contracts, expected warnings, skip policy, and acceptance standard.
- Required context present: Yes. No implementation files were changed; validation was read-only except for this trace/evidence artifact.
- Routing metadata status: absent. Caller values were not invented. Resolved agent/model/variant/source was treated as harness context only.

## Work Performed

- Summary: Validated research-before-planning ordering, config coverage, force/fail-closed semantics, native transport authority, shared architecture, atomic preflight, path/test/docs/manifest coverage, upstream claims, schema/trace conformance, security, and offline-versus-live acceptance.
- Files read: Supplied researcher/planner traces; contract, trace schema, template, orchestration index; current routing config, resolver, helper, enforcer, plugin adapter, manifest, `opencode.json`, package manifest, local guide, and validator script targets.
- Files changed: Only `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/validator/root-validator-004-proposal-evidence.md`.
- Commands: `git status --short`; target JSON parse; two current resolver cases; `node --check` four runtime files; `node .opencode/scripts/validate-harness.mjs`; `git diff --check`; proposal JSON coverage check; trace heading/routing-status check; pinned OpenCode/AI SDK/llama.cpp source and Ollama docs inspection.

## Output Contract

- Outputs: passFailMatrix, commandOutputs, schemaResults, securityAndActivationFindings, remediationList, skippedChecks, residualRisk, and traceArtifactPath.
- Evidence: Command-backed results and path/line-grounded findings are recorded below. Lifecycle hooks were not treated as acceptance proof.
- Artifact links: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/validator/root-validator-004-proposal-evidence.md`

## Acceptance Decision

- **FAIL** for proposal acceptance. The research and most of the design are actionable and evidence-backed, but two force-mode conflict cases are not fail-closed unambiguously, and the orchestration index does not link/record the completed traces.
- Implementation, activation, live backend proof, and hardware benchmarks remain out of scope and are not claimed complete.

## Pass/Fail Matrix

| Criterion | Result | Evidence |
|---|---|---|
| Research precedes and supports planning | PASS | Index DAG places both researchers before planner; planner line 24 explicitly grounds itself in both traces. |
| Multiple named local models, distinct URLs, all eight roles covered | PASS | Proposal JSON parsed: `qwen-research`/`:8080`; `qwen-coder`/`:8081`. Eight roles resolve through role selector or `defaultLocalModel`. |
| Force cannot be bypassed; invalid/missing references fail closed | FAIL | Explicit cloud/other-catalog models are rejected and bad references throw, but `enabled:false` + `forceLocalForHarnessSubagents:true` is not explicitly rejected; the defined predicate simply disables force. Also, an explicit non-fixed agent can win target resolution for a fixed role command unless “conflicting” is defined as no mismatch at all. |
| Native provider `baseURL` is transport authority; coherence check is viable | PASS | Planner lines 115–119 keep `routingServiceUrl` declarative, preflight merged providers/agents, and compare canonical baseURLs before any mutation. |
| Shared resolver/enforcer and atomic preflight | PASS | Planner lines 120–130 define one pure policy module, adapters, all-role preflight, and deep-snapshot no-mutation tests. |
| Affected paths/tests/docs/manifest complete | PASS | Planner lines 123–151 list 14 edits, 3 new paths, manifest additions, and explicit unchanged surfaces. The trust/restart guide was reviewed by research and restart guidance is assigned to the design doc. |
| Child-session/parallel-request and RAM/VRAM claims | PASS | Pinned OpenCode `task.ts`, `run-state.ts`, `prompt.ts`, and `llm.ts` support child history/model selection and per-session runners; pinned ai SDK source shows non-awaited tool execution; pinned llama.cpp and authoritative Ollama docs support backend ownership. Inferences are labeled and capacity is not overstated. |
| Offline acceptance vs live proof/benchmark | PASS | Planner lines 210–228 require offline parse/unit/integration/static checks and make restart/live child task/benchmark optional only with caller infrastructure. |
| Trace contract/template/routing status | FAIL | The three traces have required headings, semantic input/output/evidence/handoff content, and `absent` status. However, `INDEX.md` still marks research, planner, delegation packets, and validation as pending and does not link the retained traces, contrary to the memory protocol. |

## Command Outputs

- `Target JSON parse`: PASS (`json-ok`).
- `Proposal config coverage`: PASS — 8 roles, 2 named models, 2 distinct URLs, force true.
- `Current resolver /delegate-research`: exit 0, role/variant resolved; model unresolved; legacy local metadata is advisory.
- `Current resolver explicit cloud`: exit 0, cloud model wins. This confirms current legacy behavior, not the future plan.
- `Node syntax checks`: PASS for resolver, helper, enforcer, and plugin adapter.
- `Full harness validator`: FAIL (exit 1) — `Plugin default routing path must work without cfg.provider when process.cwd() is a subdirectory outside the project`. The failure corresponds to the stale `qwen-local` implementer expectation at validator lines 435–463 while committed routing has null at lines 18–20.
- `git diff --check`: PASS (no output).
- `Worktree status`: WARN — pre-existing extensive staged/unstaged/untracked changes; validation did not attribute them to this workflow.
- `Trace structure check`: PASS for headings and `absent` status.
- `Proposal JSON check first attempt`: INFRASTRUCTURE ERROR from shell regex quoting; rerun PASS. No repository file was written.

## Schema Results

- `role-io-contracts.json`: PASS — valid JSON and validator required inputs/outputs are present.
- `memory-trace-artifact.schema.json`: PASS for JSON parse and semantic Markdown-template mapping. The catalog's `requiredFields` names (`inputSummary`/`outputSummary`/`evidence`) differ from the JSON schema's structural names (`inputContract`/`outputContract`), but the template and all checked traces provide the required semantic content.
- Proposed `.opencode/schemas/harness-model-routing.schema.json`: NOT EXPECTED YET; assessed as proper future work with structural and semantic validation split between schema and pure core.

## Security and Activation Findings

- The plan keeps harness policy out of `opencode.json`, does not mutate providers/credentials, rejects URL credentials query/fragments, and requires merged native provider/baseURL coherence.
- Sample endpoints are loopback. The schema policy allows HTTP(S) remote endpoints, so documentation must not equate catalog membership with physical locality or trust.
- Pinned OpenCode `task.ts` shows an agent's static model overrides the parent model for a child task. This supports the config-hook activation design, but neither the hook nor a health check is live dispatch proof.
- Parallel tool calls can overlap under the pinned AI SDK path; distinct session runners and experimental background tasks support concurrency. Backend capacity and model tool-call reliability still control whether it occurs.
- Backend RAM/VRAM ownership claims are appropriately qualified; exact bytes and safe concurrency require live measurement.
- `.agents/` and `.codex/` are not proposed as runtime dependencies.

## Remediation List

**Blocking before proposal acceptance:**
1. Define and test `forceLocalForHarnessSubagents => localRouting.enabled`; reject `force=true` + `enabled=false` during normalization instead of falling into cloud-inclusive non-force precedence.
2. Define command/target conflict broadly: any explicit agent or role that differs from a fixed-role command must fail before force-scope escape is evaluated. Add explicit custom/built-in agent conflict tests.
3. Update the orchestration `INDEX.md` to link the three supplied traces and this-validator trace, record completed statuses/command evidence/decision, and remove stale pending statements. This validator did not edit the index because the caller limited writes to validator trace/evidence.

**Future implementation risks (not current proposal-blocking once semantics are fixed):**
- Reject or explicitly ignore non-null `roleOverrides.<role>.model` when force is active; a silently ignored cloud model is ambiguous.
- Verify merged plugin config always exposes user/global providers in the target OpenCode version; keep this a live-environment gate if not.
- Test URL canonicalization, providers without model maps, tool-call quality, cancellation, retries, and cooperative admission budgets.
- Keep remote endpoints/prompt logs in an explicit trust boundary; never store secrets in routing or memory.

## Skipped Checks

- Live OpenCode provider/model/child-task dispatch: skipped; no caller-supplied native provider configuration or running backend.
- Backend health/model/capability probes: skipped; no caller infrastructure.
- Measured RSS/RAM/VRAM/throughput/TTFT/queue depth: skipped per policy; no model topology, hardware, or backend flags were supplied.
- Full machine-validation of every external source claim: skipped; targeted pinned sources and authoritative Ollama docs were inspected, but not every linked line.

## Residual Risk

- The current repository baseline is red for a stale expectation and the worktree is heavily dirty; future implementation must distinguish pre-existing failures from regressions.
- Static agent models support fixed-eight role coverage, not arbitrary custom/native subagents.
- `maxInFlight` is cooperative prompt/orchestrator policy, not a process-wide semaphore.
- External docs are mutable; pinned commits reduce but do not eliminate freshness risk.

## Handoff

- Next role: `planner` for proposal remediation; orchestrator for index maintenance.
- Limitations: No implementation, live provider proof, or hardware benchmark was performed. External source verification was targeted, not exhaustive.
- Risks: Proposal must not be accepted until the two force-mode ambiguities and memory index compliance are resolved.


## Remediation Re-validation Loop 1

### Final Acceptance Decision

- **PASS** for the analysis and proposed future change set. This decision supersedes the initial FAIL at line 33.
- The two force-mode blockers are now explicit in the configuration contract, schema design, core semantic validation, resolution order, unit/integration tests, and atomic no-mutation expectations. The updated index links all completed traces and accurately records the initial failure, remediation loop count, and pending re-validation state that this section resolves.
- This is proposal acceptance only. Implementation, activation, live backend proof, and hardware benchmarking remain incomplete and are not accepted by this decision.

### Second-pass Matrix

| Re-check | Result | Evidence |
|---|---|---|
| Force true with local routing disabled is invalid | PASS | Planner lines 86–88 define the contract implication and rejection before request resolution; lines 143–146 require a JSON Schema conditional; lines 160–166 require schema and core rejection tests. |
| Every explicit target conflict on fixed-role commands is rejected | PASS | Planner lines 97–105 lock fixed-role command targets and reject any mismatching explicit `agent` or `role`, including other fixed roles, `build`, `general`, and custom values, before force evaluation. Lines 163–177 require exhaustive unit cases and integration snapshot checks proving no agent mutation. |
| Orchestration index links and remediation status | PASS | `INDEX.md` lines 23–46 mark research and planning complete and initial validation/remediation re-validation state; lines 54–62 record remediation loop 1; lines 66–74 link both researcher traces, the amended planner trace, and this validator trace; lines 79–87 record command evidence, initial failure, remediation, and pending acceptance decision. |
| No prior passing criteria regressed | PASS | Proposal JSON re-parsed with 8 covered roles, 2 named models, 2 distinct URLs, enabled force mode. Native transport, shared policy/atomic preflight, affected paths, source qualifications, offline/live separation, and security boundaries remain substantively unchanged. |

### Second-pass Command Outputs

- `Planner remediation assertion check`: PASS — contract, schema, core, target-lock, tests, and atomic checks all found.
- `Index link/existence/status check`: PASS — all four retained trace paths are linked and exist; remediation loop count and re-validation status are present.
- `Proposal JSON coverage check`: PASS — 8 roles, 2 models, 2 distinct URLs, `enabled:true`, force true.
- `node .opencode/scripts/validate-harness.mjs`: expected baseline FAIL remains: `Plugin default routing path must work without cfg.provider when process.cwd() is a subdirectory outside the project`. This remains the previously identified stale `qwen-local` implementer assertion and is not concealed or treated as a proposal regression.
- `git diff --check`: PASS, no output.
- Scoped `git status`: WARN — index, planner trace, and validator trace are untracked within the already dirty worktree.

### Final Remediation List

- Blocking proposal remediation: none.
- Administrative follow-up: after consuming this decision, the orchestrator should change the index re-validation and accepted-decision fields from pending to PASS/accepted. The pre-decision index state was appropriate for this validation input; this validator did not edit it.
- Future implementation risks from the initial validation remain applicable and are not implementation defects yet: define force-mode handling of non-null native role models, verify merged provider visibility, test URL canonicalization and admission behavior, and preserve endpoint trust boundaries.

### Second-pass Skipped Checks

- Live OpenCode provider/model/child-task dispatch, backend probes, and model tool-call proof: skipped because no caller backend or native provider configuration was supplied.
- RAM/VRAM, throughput, TTFT, queue, and capacity benchmarks: skipped per policy because no hardware/model topology was supplied.
- No future v2 implementation tests were run because implementation does not exist and this workflow validates the proposal only.

### Final Residual Risk

- The current harness baseline remains red and the worktree remains dirty; implementation validation must distinguish this known failure from regressions.
- Static enforcement covers the fixed eight harness roles, not arbitrary custom/native subagents.
- `maxInFlight` remains cooperative rather than a process-wide semaphore.
- Live provider visibility, endpoint activation, model capability, and safe hardware capacity remain environment-dependent.

### Final Handoff

- Next role: `implementer` only after an implementation workflow is approved; orchestrator may finalize the index decision status.
- Limitations: Proposal validation only; no implementation, activation, live dispatch, or benchmark proof.
- Risks: Acceptance must not be interpreted as runtime activation or measured backend capacity evidence.
