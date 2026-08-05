# Final Independent Acceptance Validation

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `validator`
- artifactId: `root-validator-020-final-acceptance`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Post-remediation-loop-3 worktree and changed-file inventory; planner acceptance matrix A1-A13; routing, bootstrap, manifest, schema, command, memory, security, activation, and diff criteria; reviewer unblock; expected typeless-package warnings; required negative probes; and final acceptance decision standard.
- Required context present: `orchestrationId`, changed files, verification criteria, commands, schema contracts, expected warnings, skipped-check policy, acceptance standard, and routing metadata status were present. The planner additionally requires current independent artifact-verifier listing/cleanup evidence before orchestration acceptance.
- routingMetadataStatus: `absent`. Caller routing metadata was absent; no routing labels or values were invented.

## Work Performed

- Summary: Independently ran the complete planner command matrix, explicit neutral/local resolver checks, source and installed validators, exact manifest/trace comparison, diff hygiene, and focused routing/bootstrap/security negative probes. Verified the expected implicit private-custom failure separately and did not count it as pass evidence. No implementation file was edited.
- Files read: Planner, loop-3 implementer, reviewer-unblock, and final integrator traces; role contract and trace schema; source and portable manifests; bootstrap, portable E2E, portable/source validators; routing fixtures, policy, tests, and resolver; current changed/untracked path inventory.
- Files changed: This validator trace only. Permission denied the requested separate `validation/` evidence artifact and orchestration-index update; all evidence is retained here for an authorized role to index.
- Commands: 20 shell invocations / 28 command clauses or processes, including three post-publication checks. Four syntax checks; full routing and E2E suites; both validators; two explicit resolvers; two focused negative-suite reruns; implicit source limitation probe; exact inventory/trace probe; ignored-state, changed-path, status-count, numstat, and whitespace checks. One validator-authored inline probe used the wrong source-manifest property, failed with `TypeError`, and was immediately corrected; it is excluded from product evidence.

## Output Contract

- Outputs: Pass/fail gate matrix, exact command summaries/counts, schema results, security/activation findings, remediation list, limitations, and acceptance decision.
- Evidence: Command outputs and focused negative-property evidence are recorded below. Product suites reported routing `36/36`, portable E2E `15/15`, focused routing `4/4`, and focused portability/security `8/8`, all with zero failures/skips/cancellations/todos.
- Artifact links: `.memory/orchestrations/2026-08-04-harness-portability/roles/validator/root-validator-020-final-acceptance.md`.

### Pass/Fail Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| A1 Syntax | PASS | Four `node --check` commands exited 0 with no output. |
| A2 Routing | PASS | Full suite `36/36`; focused routing negatives `4/4`; no network. |
| A3 Foreign bootstrap | PASS | E2E `15/15`; focused foreign/safety rerun `8/8`. |
| A4 Portable profile | PASS | Exact portable-validator success line. |
| A5 Neutral resolver | PASS | Implementer, null model/local metadata, unenforced, network false. |
| A6 Local resolver | PASS | Coherent advisory Qwen local decision, unenforced, network false. |
| A7 Memory tree/current independent artifact proof | FAIL | E2E proves the property, but required post-loop-3 artifact-verifier listing/cleanup evidence (`AV2`) is still absent. Historical AV1 is superseded. |
| A8 Destination independence | PASS | Fresh foreign root contains only `.opencode` and minimal `.memory`; no source roots required. |
| A9 Reference scrub | PASS | Portable validator found zero forbidden/source-machine references; focused Windows/UNC probes were rejected. |
| A10 Trace alignment | PASS | Eight schema fields match all eight role catalogs; no mismatches. |
| A11 Source QA | PASS | Exact source-validator success line; committed fixtures explicitly govern acceptance. |
| A12 Diff hygiene | PASS | `git diff --check` clean; approved paths only; no private custom/package/temp state in diff. |
| A13 Restart handoff | PASS | Full quit/restart is explicitly required for activation and is not claimed as validation evidence. |

### Exact Command Outputs and Counts

- Total execution count: **20 shell invocations containing 28 command clauses/processes**. Before publication there were 17/24; after publication, three shell invocations/four clauses reran source validation, portable validation, whitespace validation, and trace status. Nineteen invocations produced intended evidence; one validator-authored inline diagnostic errored and was corrected as disclosed below.
- Syntax: four checks, exit 0, no stdout/stderr.
- Routing: `tests 36`, `pass 36`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, duration `396.707377ms`.
- Portable E2E: `tests 15`, `pass 15`, `fail 0`, `cancelled 0`, `skipped 0`, `todo 0`, duration `3926.06902ms`.
- Focused routing negatives: `tests 4`, `pass 4`, `fail 0`, duration `50.369034ms`.
- Focused portability/security negatives: `tests 8`, `pass 8`, `fail 0`, duration `2575.354886ms`.
- Portable validator: `Portable OpenCode harness validation passed`.
- Source validator: `OpenCode harness validation passed`.
- Post-publication checks: source and portable validators passed again; `git diff --check` remained silent; status showed only the expected untracked validator trace at its required path.
- Neutral resolver: `agent=implementer`, `model=null`, `variant=null`; local catalog/URL/max-in-flight null; `enforced=false`; `networkCalls=false`.
- Local resolver: `agent=implementer`, `model=llamacpp-coder/qwen2.5-coder-7b`, catalog `qwen-coder`, URL `http://127.0.0.1:8081/v1`, max-in-flight `1`; `enforced=false`; `networkCalls=false`.
- Exactness probe: `managedFiles=43`, `memorySeeds=4`, `sourceManifestMissing=[]`, `traceRoleMismatches=[]`.
- Diff: `git diff --check` emitted no findings. Initial status had 22 porcelain entries because untracked directories are collapsed; explicit path listing showed approved implementation/orchestration files only.
- Expected warnings: `MODULE_TYPELESS_PACKAGE_JSON` appeared for ESM `.js` plugin modules. This is expected because generated package metadata is deliberately excluded; exits and assertions remained successful.
- Diagnostic disclosure: the first inline exactness probe incorrectly addressed source manifest `requiredFiles`, causing `TypeError: Cannot read properties of undefined (reading 'includes')`. The corrected probe used `artifacts[].path` and passed. The erroneous probe is not product pass/fail evidence.

### Focused Negative Probe Results

- PASS: present malformed or semantically invalid custom fails closed and never falls back to the valid example.
- PASS: enabled routing with an empty catalog is invalid; disabled empty routing is valid and inert, including dormant selectors.
- PASS: both implicit routing files absent produce an actionable remedy; explicit paths remain exact despite siblings.
- PASS: fresh and partial foreign installs preserve minimal-tree and non-overwrite properties; source roots/history are absent and unnecessary.
- PASS: managed destination collision aborts preflight; explicit overwrite changes only managed files; memory remains untouched.
- PASS: forced descriptor-capability unavailability and later-parent probe failure occur before file publication and leave the target empty.
- PASS: corrupted enabled-local fixture, unsafe path, forbidden reference, and independently removed manifest inventory entry are rejected.
- PASS: Windows drive, backslash UNC, and forward-slash UNC leaks are rejected.

### Schema Results

- Portable manifest is closed and exact: profile/version, 43 unique managed paths, four exact memory mappings, and the descriptor-relative all-parent fail-before-publication capability object match the independent validator.
- Routing v2 accepts disabled empty/inert state and rejects enabled empty state. Present malformed/semantic-invalid custom state fails without fallback; missing implicit files produce an actionable remedy.
- Trace schema's eight required fields equal all eight role trace catalogs; template headings/metadata pass both validators.

### Security and Activation Findings

- Destination collisions fail before publication by default; overwrite is explicit and limited to managed files; memory is never overwritten.
- Descriptor capability unavailable and later-parent capability failure both fail before file publication; no pathname fallback is available.
- Root/parent replacement, symlink insertion, concurrent destination creation, unsafe manifest path, inventory shrinkage, local-fixture corruption, forbidden references, and drive/UNC leaks are rejected by full-suite evidence.
- Fresh installed validation has no dependency on source `AGENTS.md`, design, root config, source manifest, reference inventory, or orchestration history.
- Plugin/config-time changes require fully quitting and restarting OpenCode. No live provider, routing service, endpoint, network, or model execution was performed; hooks were treated only as guardrails.
- Implicit source resolution exited nonzero with `Invalid harness model routing v2 at $.harnessModelRouting.localRouting.defaultLocalModel: must reference localRouting.models`. This expected ignored-private-custom limitation was not counted as pass evidence.
- Ignored `.opencode/routing/harness-model-routing.json` and `.opencode/package.json` exist as local state but are absent from the diff and deterministic acceptance inputs.

### Remediation List

1. Produce current post-loop-3 `artifact-verifier` evidence (`AV2`) with a temporary installed-tree listing, parse/validator output, hashes if practical, and cleanup decision. Until then, the planner's final acceptance standard is unmet.
2. Have an authorized role link this trace from the orchestration index and, if required, copy the embedded command evidence into `validation/`; validator permissions denied both paths.
3. After all acceptance evidence is complete, fully quit and restart OpenCode before relying on changed routing/plugin configuration.

### Acceptance Decision

- **Implementation validation: PASS.** Every command-backed syntax, routing, portability, validator, resolver, negative-security, reference, trace, manifest, and diff check passed.
- **Final orchestration acceptance: FAIL / NOT ACCEPTED YET.** A7's required current independent artifact-verifier evidence is missing. Partial completion is not accepted, and AV1 predates loop 3.

## Handoff

- Next role: `artifact-verifier` for AV2, then an authorized index update and orchestration acceptance decision.
- Limitations: Linux-only execution; `/dev/fd` was not independently exercised; live OpenCode restart, providers, network, endpoint health, model execution, separate-filesystem behavior, and process-kill cleanup were not tested. Validator permissions prevented writing under `validation/` and updating the orchestration index. One corrected validator-authored inventory probe error is disclosed and is not a product failure.
- Risks: Whole-install transactionality after successful preflight remains outside scope. Process interruption may leave empty directories, hidden temporary/probe files, or a partial install. The ignored private custom remains invalid and blocks implicit source resolution by design.
