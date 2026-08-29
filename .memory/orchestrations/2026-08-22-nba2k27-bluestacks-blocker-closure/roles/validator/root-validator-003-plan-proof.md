# Integrated Closure Plan Proof — FAIL

## Findings (blocking first)

1. **BLOCKER — the plan does not map every exact reproduction from all three prior validator traces** (`gate-plan-proof`; packet criterion 1). The seven-row table maps the seven final findings, but the earlier vault and CLI attacks have no row-level root cause, invariant, exact file/function, positive/negative test, artifact/doc location, and command. In particular, it does not map the cumulative-vault overflow, cloned/forged/stale-handle race, package/workspace containment, absolute retained-path behavior, duplicate-key CLI input, fake-response path leakage, or cleanup-document discrepancy. A read-only count over the plan returned `vault:0`, `E_VAULT:0`, `path-canary:0`, and `leak:0`; a generic requirement to run “every historical attack” at line 275 is not an implementable mapping. This directly fails the supplied acceptance standard even where current source has already repaired an attack.
2. **BLOCKER — the independent-host-receipt gate is a label, not a defined trust mechanism** (`gate-plan-proof`, identity/control eligibility). The plan correctly says companion observations cannot authorize and that control needs `externalHostReceiptDigest`, but it defines no receipt schema, issuer/trust anchor, no-follow input path or injected authority interface, authenticity/ownership/freshness/replay checks, issuance stage, validating function, or exact new/current file. An arbitrary caller-provided digest could therefore satisfy the planned field shape unless implementation invents the missing security design. The optional receipt in the hello challenge (line 79) also conflicts with the unconditional control binding (lines 162–181) without an exact observe-versus-control rule.
3. **BLOCKER — required configuration and package integration files are missing or under-specified** (`gate-plan-proof`, migration/package coherence). The plan adds `windowsDriveMountRoot`, host-receipt policy, extensive target predicates, and calibration-profile inputs, but its replace inventory omits the existing `src/nba2k27-myplayer/schemas/host-companion-config.schema.json` and `src/nba2k27-myplayer/index.mjs`, which currently imports/exports that schema and protocol API. The path mapper is also ambiguous: it accepts `mountRoot`, calls the setting a “drive-root path,” and then says to lowercase and join the drive letter; this does not establish whether `C:\x` plus `/mnt`, or `C:\x` plus `/mnt/c`, is canonical. Package acceptance requires packed `protocol` generator inputs, while the current `package.json.files` contains only `src/`, `docs/`, and `companion/windows/`; the plan says to update `package.json` but does not state the exact new `files` and script contracts. Current `test:host` also explicitly names the file the plan deletes. These are coding-time design decisions, not mechanical edits.
4. **BLOCKER — selector conversion, event-budget accounting, and recognition edge semantics are not exact enough to implement safely** (`gate-plan-proof`, preview/input). The forward point conversion is specified, but the native inverse from fixed `[0,999999]` to inclusive client pixels and then virtual-desktop coordinates is not. “Reverse mapping must be in bounds” does not define rounding or prove that the recognized hotspot is the dispatched pixel. Input guard step 5 says to reserve the exact event count, while step 8 says to decrement each “already-reserved event slot,” leaving double-charge versus reservation-consumption ambiguous. Recognition does not define the second-best score/margin result when a search region has only one legal candidate. These ambiguities affect generated vectors and native authority, so they cannot be deferred to implementation.
5. **BLOCKER — native cleanup/failure semantics are still too abstract for the promised structural proof** (`gate-plan-proof`, capture/native resource safety). The plan lists ordering and says cleanup-only failure is terminal, but it does not define invalid return handling for `CreateCompatibleDC`, `CreateCompatibleBitmap`, `SelectObject` (including `HGDI_ERROR`), restore, `DeleteObject`, `DeleteDC`, and `ReleaseDC`, nor the exact primary-plus-cleanup error precedence/evidence rule. The current source demonstrates why this matters: `Capture.cs` does not reject a failed `SelectObject`, ignores all cleanup return values, and uses `GetDIBits` while selected. A checker cannot prove “complete cleanup” mechanically without the missing closed obligations and outcomes.

**Gate decision: FAIL.** `gate-plan-proof` requires no missing contract, prior attack, cross-language evidence, or integration step. Five command/source-backed omissions remain; partial acceptance is prohibited.

## Seven-Finding Proof Matrix

| Final finding | Plan proof | Evidence and remaining issue |
| --- | --- | --- |
| 1. Hello identity | **FAIL** | Static challenge equality, parent byte hashing, observation-only dynamic fields, and session derivation are specified. Control eligibility depends on an undefined external receipt authority, and the Windows/WSL mapper has no unambiguous mount example/algorithm. |
| 2. Pixel preview | **FAIL** | Transported pixels, closed operator profile, deterministic matching, caller-field rejection, registered transition, and post-capture are planned. One-candidate second-best behavior and exact selector inversion remain undefined. |
| 3. Capture transport | **FAIL** | Start/chunk/end, preallocation arithmetic, canonical base64, ordered chunks, byte/pixel/metadata/provenance digests, nonce/sequence, identity/geometry/DPI/times, and replay/staleness tests are present. Native return/cleanup obligations are incomplete. |
| 4. Input authority | **FAIL** | The authority tuple and guard order cover the required bindings, budget-before-native authority, one `SendInput`, and unknown partial outcomes. Fixed-point inversion and reserve-versus-decrement semantics are ambiguous. |
| 5. Discovery/identity/cancel | **PASS at plan level** | Exact bounded filters, stable/dynamic snapshots, parent/owner relationships where configured, revalidation seams, async reader/one worker, EOF/cancel/AbortSignal/deadline/kill schedules, and post-dispatch unknown outcomes are specified; host guarantees remain expressly deferred. |
| 6. Semantic parity | **PASS at plan level** | IR-generated Node/C#/fake/vectors/errors/docs, byte-stale checks, independent JS interpreter, parsed C# structures, and per-rule semantic mutation obligations are explicit and stop short of compiler/runtime claims. |
| 7. Protocol/docs drift | **PASS at plan level** | Generated blocks, executable examples, status matrix, contradiction lint, stale checks, and deletion of handwritten fixtures/token tests are dependency ordered. Package/config integration omissions elsewhere still block the whole plan. |

## Prior-Reproduction Coverage Matrix

| Prior trace/reproduction group | Mapping result | Required closure |
| --- | --- | --- |
| `root-validator-004`: state bypass, malformed handshake/EOF, invalid canary fixture | **Mapped** | Rows 4–6, protocol replacement, generated vectors, and Gate B cover these attacks. |
| `root-validator-004`: arbitrary/incomplete capability and unmanaged launcher lifecycle | **Mapped with identity caveat** | Rows 1, 4, and 5 cover closed capability/lifecycle behavior; the receipt authority remains undefined. |
| `root-validator-004`: cumulative vault quota, containment, retained-path reporting | **MISSING** | No exact root-cause/file/function/test/doc/command row exists for `evidence-vault.mjs`, `trusted-config.mjs`, vault tests, or preflight docs. |
| `root-validator-004`: duplicate config and fake-output path leakage | **MISSING** | Generic CLI preservation is not an exact attack mapping to `cli.mjs`, `host-cli.test.mjs`, positive/negative cases, and a command. |
| `root-validator-004`: C# protocol drift | **Mapped** | Rows 3–6 and generator/structural/mutation gates cover it. |
| `root-validator-006`: unpreviewed selector/states and incomplete capability | **Mapped** | Rows 2 and 4 require recognition-derived fields and complete immutable authority. |
| `root-validator-006`: unsolicited close output | **Mapped** | Row 5 and launcher lifecycle tests require strict outstanding correlation. |
| `root-validator-006`: cloned-run quota bypass | **MISSING** | The plan neither preserves nor explicitly re-runs the branded-handle reproduction. |
| `root-validator-006`: native operations absent and cleanup docs stale | **PARTIAL** | Native capture/input and generated status are mapped; exact cleanup-doc historical reproduction is not independently mapped. |
| `root-validator-008`: seven final attacks | **Mapped, with failures above** | All seven have rows, but identity receipt, selector/budget, and native cleanup details are incomplete. |
| Closed migration/package/no-live reproductions | **PARTIAL** | Gate C preserves broad checks, but exact package `files`/scripts after adding `protocol/` and deleting `windows-contract.test.mjs` are unspecified. |

## File and Dependency Proof

- Current inventory confirms all named replacement host modules and C# seams exist. Planned `protocol/`, `scripts/`, generated outputs, and new tests are legitimately new paths rather than stale dependencies.
- Deleting `test/nba2k27-myplayer/windows-contract.test.mjs` and the hand-authored transcript fixtures is correctly ordered after generated replacements.
- **Missing current integration surface:** `src/nba2k27-myplayer/schemas/host-companion-config.schema.json` must change if runtime config shape changes; it is absent from the plan inventory.
- **Missing current export surface:** `src/nba2k27-myplayer/index.mjs` currently publicly exports protocol-v1 symbols and the config schema; the plan does not decide its protocol-2 compatibility/export contract.
- **Package incoherence:** current `package.json.files` excludes `protocol/` and `scripts/`, although Gate C requires packed protocol generator inputs. Current `test:host` names the deleted token test. “Update package scripts” is not an exact file contract.
- **Undefined dependency:** no receipt-verifier/receipt-loader file or external authority interface appears in Add/Replace lists, despite control depending on it.
- No circular generated-output dependency was found in the stated order: the IR, generator, and fixed templates are inputs; generated outputs and manifest are checked afterward. The independent reference interpreter and stale-side mutation requirement are materially stronger than token tests.

## Command Feasibility and Evidence

Read-only commands were run from `/home/joshl/projects/nba2k27-myplayer`; no Windows/native/BlueStacks/network/ADB operation was executed.

1. Plan inventory/term probe:
   - Output: `vault=0`, `E_VAULT=0`, `path-canary=0`, `leak=0`; current `protocol/host-protocol.ir.json=false`, `scripts=false`, `protocol-v1.mjs=true`, `windows-contract.test.mjs=true`.
   - Meaning: new paths are expected, but prior vault/leak attacks lack explicit plan mapping.
2. Package contract probe:
   - Node `v24.14.1`; `files=["src/","docs/","companion/windows/"]`; `test:host` names `windows-contract.test.mjs`; exports are only `.` and `./cli`; package is private and dependency-free.
   - Meaning: offline runtime is available, but exact planned package migration is missing.
3. Tool availability probe:
   - `node` and `npm` resolved under the installed Node 24 toolchain; `dotnet=UNAVAILABLE`, `csc=UNAVAILABLE`.
   - Meaning: Gates A–C are offline-feasible after their planned files exist. Gate D is correctly conditional and must remain a recorded skip, not compile evidence.
4. Command extraction probe:
   - Found all seven traceability rows and 14 planned commands: generator/checker, focused Node tests, npm preservation/package/no-live checks, and the two compiler-presence probes.
   - No planned acceptance command inherently invokes Windows, BlueStacks, ADB, network, or native authority. `npm pack --dry-run` is local; source checks must continue to prevent lifecycle/network additions.

The future test commands were not executed because their inputs are intentionally not implemented yet. Dry evaluation found their executables available except the expressly conditional compilers; command names and working directory are otherwise coherent. The exact npm script bodies remain a remediation requirement.

## Schema Results

- Validator packet: contract-complete for `taskMode: artifact-proof`; routing metadata status is `absent` and no labels were invented.
- Trace path/role/artifact ID conform to the supplied role contract and memory protocol.
- Planner trace has the required seven rows and output/handoff sections.
- Planned IR top-level closure, duplicate-key parsing, generated schema/vector/docs contracts, and semantic-rule coverage are internally coherent.
- Planned configuration schema migration is **not** coherent with current inventory because the JSON Schema file and public schema export are omitted.
- External receipt and package-manifest contracts are **not schema-complete**.

## Security and Activation Findings

- **No-live:** only read-only Linux file inspection and Node/shell availability probes occurred. No candidate file was edited; no native process, Windows executable, BlueStacks, ADB, capture, input, network, Git, install, or global mutation occurred.
- **Activation remains blocked:** companion observations are correctly non-authoritative, but the independent receipt source is not yet trustworthy by construction. No implementation may mint control from a supplied digest alone.
- **Capture/input safety:** bounded framing and unknown-outcome policy are strong, but exact pixel-to-event mapping, accounting, and cleanup failures must be closed before native authority exists.
- **Generated evidence:** proposed static evidence may prove intended source semantics only. It cannot claim compilation, ABI/marshaling, Win32 behavior, frame freshness, BlueStacks compatibility, focus/UIPI behavior, or WSL termination.
- **Public/package boundary:** the plan preserves no default launcher/mint route, but exact exports, packaged generator inputs, and scripts must be settled before implementation.

## Precise Planner Remediation Requirements

1. Add an exact prior-attack table for every reproduction in validators 004, 006, and 008, including already-closed vault/CLI/package/docs attacks. Each row must name root cause, invariant, current/new/deleted file and function, positive and adversarial test, artifact/doc location, and command.
2. Define the external-host-receipt contract completely: schema, trusted producer/authority boundary, authenticity and anti-replay validation, no-follow source or injected interface, stable versus dynamic fields, observe/control optionality, exact validation/mint functions and paths, and fake-only test authority. A bare caller-supplied digest must never qualify.
3. Add exact contracts for `host-companion-config.schema.json`, `index.mjs`, `package.json.files`, every changed npm script, and `verify-pack.mjs`. Resolve whether `protocol/` and `scripts/` are packed and ensure the deleted Windows token test is absent from scripts.
4. Specify Windows-path mapping with normative input/output examples and a single meaning for `windowsDriveMountRoot`; add boundary/adversarial vectors.
5. Define exact fixed-point-to-client and client-to-virtual-desktop integer formulas and rounding, including extent 1/endpoints, and prove the recognized hotspot maps to the dispatched in-client pixel. Resolve event reservation/consumption wording and define one-candidate second-best recognition semantics.
6. Enumerate every GDI acquisition/return sentinel, cleanup obligation, cleanup return check, and primary-versus-cleanup terminal outcome so the IR, generated errors/vectors, and structural checker can prove each branch.

## Input Contract

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- delegationTaskId: `dt-prove-plan-003`
- scopeKey: `plan-proof`
- role: `validator`
- artifactId: `root-validator-003-plan-proof`
- createdAt: `2026-08-22`
- taskMode: `artifact-proof`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Inputs received: Contract-complete fresh packet; normalized specification; research and planner traces; three prior validator traces; current package, host, protocol, launcher, evidence, C#, test, schema, and documentation inventory; verification criteria, commands, risks, skip policy, and acceptance standard.
- Required context present: Yes.
- Routing metadata status: `absent`.
- Workspace root: `/home/joshl/projects/opencode-harness`; read-only candidate: `/home/joshl/projects/nba2k27-myplayer`.

## Work Performed

- Summary: Independently built seven-finding and historical-attack matrices, checked every planned path against current inventory, dry-evaluated all commands, and adversarially reviewed trust, framing, recognition, input, cancellation, generation, package, and documentation boundaries.
- Files read: Supplied contracts/schema/template and six orchestration artifacts; candidate package/config schema; all current host modules; C# project/source/manifest/README; host/preflight docs; host/vault tests; CLI/index; no-live and pack verifiers.
- Files changed: Only this validator trace artifact.
- Commands/checks: Four read-only Linux probes listed under Command Feasibility; specialized file reads/globs/searches. No implementation or live/native check.

## Output Contract

- passFailMatrixOrFindings: Five blocking findings, seven-finding matrix, and prior-reproduction coverage matrix above.
- commandOutputs: Command Feasibility section above.
- schemaResults: Schema Results section above.
- securityAndActivationFindings: Security and Activation Findings section above.
- remediationList: Six precise planner remediation requirements above.
- artifactProof: Current-path/package/tool/plan-command evidence and direct line-level contract comparison above.
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/validator/root-validator-003-plan-proof.md`
- Evidence: Independent source inspection and read-only command outputs; lifecycle/progress/self-report artifacts were not acceptance evidence.
- Artifact links: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/validator/root-validator-003-plan-proof.md`

## Handoff

- Next role: Fresh planner remediation within the normalized one-cycle budget, followed by a fresh independent plan-proof validator; implementation must not begin from this failed plan.
- Limitations: Plan proof only. Future generated files/tests do not yet exist and were not run. Compiler/native/live checks were prohibited; `dotnet` and `csc` are unavailable.
- Risks: Self-attested receipt acceptance, wrong executable mapping, incomplete historical regression coverage, selector/event mismatch, budget-accounting divergence, unproved native cleanup, stale package exports/scripts, and all explicitly deferred host/runtime risks.
