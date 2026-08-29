# Integrated Closure Plan Reproof — FAIL

## Findings (blocking first)

1. **BLOCKER — the inspector receipt does not independently cover the complete control identity tuple or define its exact approval-time use** (`gate-plan-proof`, inspector-authority criterion). The addendum correctly makes the inspector a separately hash-pinned, read-only, parent-challenged one-shot child and makes its branded receipt single-use and short-lived. However, the closed receipt at lines 107–119 omits dynamic fields that the combined plan requires for control: parent process identity, owner/root-owner window identity, title digest, minimized/iconic state, content and extended-frame rectangles, DPI-awareness state, and foreground state. The exact receipt-to-companion match at line 123 consequently covers only its smaller field set, while the original authority tuple and target snapshot require the omitted values (`root-planner-002`, lines 162–179 and 200–206). Those omitted companion observations therefore remain capable of entering control authority without independent observation, contradicting the original trust rule that `companionObserved` is evidence-only. The addendum also gives the receipt a maximum 5-second lifetime but does not normatively place `obtainInspectorReceipt`, operator preview approval, atomic receipt consumption, and capability minting in one exact order or bind an approval/preview digest into the receipt challenge. Implementation would have to invent that security-significant sequence.
2. **BLOCKER — the final pixel-to-`SendInput` coordinate contract still depends on unbound virtual-desktop geometry** (`gate-plan-proof`, recognition/input criteria). The fixed selector encode/decode pair is now exact and exhaustive arithmetic confirmed round-trip identity for every pixel at extents 1–4096. But line 160 then normalizes against `screen-origin` and virtual-desktop `extent` without defining their authoritative source. Neither the inspector receipt fields (lines 107–119), config target fields (line 131), nor the exact control-match list (line 123) contains virtual-desktop left/top/width/height. A companion-selected origin/extent can therefore alter the dispatched absolute point after the approved selector is sealed. “Require it inside the virtual desktop” is not an implementable trust/binding rule without those fields, their bounds, snapshot API/source, receipt comparison, authority digest membership, and drift recheck.
3. **BLOCKER — the historical ledger is not exact by its own gate** (`gate-plan-proof`, historical-reproduction criterion). The addendum requires every row to have a path/function/test/stable code/command (lines 273 and 303), but multiple rows use placeholders rather than exact contracts: `generated validators/session` (line 59), `generated protocol/session` plus “their generated stable codes” (line 61), and `generated decoder` (line 66). These are neither repository paths/functions nor exact expected codes. The ledger preamble maps broad row classes to commands, but “native/final rows use Gate B below” does not identify a single validator command per row, and several prose test descriptions are not named subtests. In addition, locations such as `host/trusted-config.mjs` and `host/evidence-vault.mjs` are not the current or planned paths (`src/nba2k27-myplayer/host/...`). This leaves implementation and later hostile review unable to prove a one-to-one historical reproduction matrix mechanically.
4. **BLOCKER — aggregate inspection/call budgets have no canonical cross-process owner** (`gate-plan-proof`, budget criterion). Lines 164–166 define event costs and charge timing, but inspector snapshots occur in a separate inspector child before control capability minting, companion discovery/revalidation occurs in another child, and Node owns protocol orchestration. The plan does not assign the single authoritative reservation ledger across those three trust/process boundaries, define how the inspector call is reserved before launch and reflected in the later immutable authorization, or define how companion-reported query/inspection consumption is reconciled without trusting self-report. Thus positive/per-type limits are listed, but aggregate `maxInspectionCalls`/`maxProtocolCalls` cannot yet be shown non-bypassable across receipt acquisition, capture, discovery, rechecks, cancellation, and input.

**Gate decision: FAIL.** `gate-plan-proof` requires no missing trust, attack, binding, accounting, or integration decision. Four command/source-backed omissions remain. Implementation is forbidden; partial acceptance is not available.

## Seven-Finding Reproof Matrix

| Final finding | Decision | Combined-plan evidence |
| --- | --- | --- |
| 1. Hello identity | **FAIL** | Parent challenge, strict path/hash verification, observation-only companion claims, and a separate inspector are specified. The inspector schema does not observe/match the complete authority identity, and its approval-time sequence is unresolved. |
| 2. Pixel preview | **FAIL** | BGRA/mask/SAD/threshold/tie/no-match/state/transition/selector derivation is deterministic and caller state/selector is absent. The sealed point is not fully bound through authoritative virtual-desktop geometry to dispatched coordinates. |
| 3. Capture transport | **PASS at plan level** | Start/chunk/end framing, bounds, canonical base64, digests, identity/timing, operation-only freshness claims, and the GDI ownership/failure ledger are mechanically specified. |
| 4. Input authority | **FAIL** | Exact recipes, reservation-before-native, no double decrement, partial-send unknown outcome, and cancellation seams are present. Cross-process aggregate budget ownership and absolute coordinate geometry remain incomplete. |
| 5. Discovery/identity/cancel | **FAIL** | Bounded filtering, one worker/concurrent reader, cancellation outcomes, and full companion snapshots remain mandatory, but receipt-based independent matching covers only a subset of the control snapshot. |
| 6. Semantic parity | **PASS at plan level** | Canonical IR, deterministic generation, independent JS reference, parsed C# evidence, semantic mutation coverage, manifest digests, and honest compiler limits remain coherent and non-circular. |
| 7. Protocol/docs drift | **PASS at plan level** | Generated docs/status/examples and stale checks remain dependency ordered; host/native/live claims remain expressly deferred. |

## Former-Gap Closure Matrix

| Failed-proof gap | Reproof | Evidence |
| --- | --- | --- |
| Exhaustive historical attacks | **FAIL** | The ledger is broad, but placeholder paths/functions/codes and command grouping violate its own exact-row contract. |
| Non-circular receipt trust | **FAIL** | Binary/challenge/provenance/single-use/TTL design is materially improved, but complete identity matching and approval-time sequencing are missing. |
| Config/export/package/path contracts | **PASS** | Config v2 keys/bounds, canonical effective digest, drive-specific mapping example, no-follow file checks, exact public names/exports, CLI commands, files/scripts, generated/stale outputs, and deletions are specified. Same-UID/cross-OS races are honestly retained. |
| Recognition/selector/event edges | **FAIL** | Recognition and fixed selector arithmetic are closed; virtual-desktop authority and aggregate cross-process budget ownership are not. |
| Native GDI cleanup | **PASS at plan level** | Acquisition sentinels, ownership flags, restore-before-`GetDIBits`, reverse cleanup, primary-error precedence, diagnostics, and injected failure combinations are explicit. Static evidence remains correctly weaker than runtime proof. |

## Historical-Reproduction Proof Matrix

| Group from validators 004/006/008 | Decision | Proof result |
| --- | --- | --- |
| Vault containment, lexical roots, links/modes/identity, cloned handles, byte/file quotas, TTL, quarantine, retained path, post-delete proof | **PASS in coverage; FAIL in exact ledger form** | All attack classes appear, with implementation behavior and focused vault command. Several locations omit the actual `src/nba2k27-myplayer/` prefix and not every prose case is a named subtest. |
| CLI duplicate/bounds/trailing/unknown/live-route/path-canary/fake leakage | **PASS in coverage** | Exact stable codes, CLI functions, tests, and focused command are substantially specified. |
| Protocol state/hello/EOF/replay/correlation/canary | **FAIL in exact ledger form** | Attack classes appear, but lines 59–61 use generated placeholders and non-enumerated “generated stable codes.” |
| Capability and launcher lifecycle | **PASS in coverage; FAIL through receipt identity** | Closed capability/lifecycle/output bounds are mapped; complete control eligibility still depends on the incomplete receipt match. |
| Seven final native findings | **FAIL** | Capture/GDI/recognition/parity/docs are mapped; trust, coordinate binding, and aggregate budgets remain incomplete as above. |
| Package/public/no-live/preservation | **PASS at plan level** | Exact exports, 13 commands, package files/scripts/denylist, offline package commands, and no-live reachability checks are given. |

## Command-Backed Evidence

Commands were read-only and run from `/home/joshl/projects/nba2k27-myplayer` unless noted.

1. `node --version; command -v node; command -v npm; command -v dotnet; command -v csc`
   - Node `v24.14.1`; Node and npm resolve under the installed Node 24 toolchain; `dotnet=UNAVAILABLE`, `csc=UNAVAILABLE`.
   - Gates A–C are offline-feasible once implemented. Gate D remains an honest prohibited-toolchain skip.
2. `npm ls --all --json`
   - Exit 0; root package only (`nba2k27-myplayer@0.0.0`), confirming the current dependency-free baseline that the exact package contract must preserve.
3. `npm pack --dry-run --json`
   - Exit 0; current package has 56 reviewed entries, 71,225 packed bytes, 301,626 unpacked bytes, and no bundles. Current inventory contains only the existing source/docs/Windows companion; planned protocol/scripts/inspector additions are therefore genuine inventory changes.
4. Exhaustive selector arithmetic probe:
   - Executed the addendum's encode/decode formulas for every `p` in every extent `1..4096`.
   - Output: `selector-roundtrip=PASS extents=1..4096`.
   - This accepts the fixed-point pair itself but does not supply the absent authoritative virtual-desktop rectangle.
5. Independent text/path probes over the addendum:
   - Found placeholders at lines 59, 61, and 66 and the row-level exactness requirements at lines 273 and 303.
   - Found `clientLeft/clientTop/clientWidth/clientHeight` and `monitorSha256` in the receipt, but the only virtual-desktop contract is the formula at line 160; no virtual-desktop origin/extent field exists in receipt or config.
   - Found receipt TTL/challenge at lines 101, 121, and 133, with no normative receipt/preview-approval acquisition sequence.
   - Found event/call costs at lines 164–166, with no canonical ledger owner across parent, inspector, and companion.

Future generator/test commands were not run because their files intentionally do not exist before implementation. No required document, source, inventory, or command-feasibility inspection was skipped.

## Schema and Integration Results

- Validator packet is contract-complete for `taskMode: artifact-proof`; routing metadata was absent and no routing values were invented.
- Original/addendum precedence is explicit and removes the obsolete optional external-receipt contract.
- Config v2, calibration profile, canonical effective digest, package files/scripts, exports, CLI inventory, and drive mapping are closed at plan level.
- Inspector receipt schema is syntactically closed but semantically incomplete relative to the complete control authority tuple.
- Generated dependency direction remains non-circular: IR/templates/generator are inputs; Node/C#/fake/docs/vectors/manifest are outputs; independent reference/parser/mutation checks consume outputs.
- Historical ledger does not satisfy its required exact path/function/test/code/command schema.

## Security and Activation Findings

- **Activation remains blocked.** Companion-observed dynamic identity fields not independently covered by the receipt must not mint control authority.
- **Input remains blocked.** The approved pixel cannot be converted to absolute input using unbound virtual-desktop geometry.
- **Budget safety remains blocked.** A single non-bypassable aggregate reservation ledger across parent/inspector/companion is not defined.
- **No-live evidence:** only Linux read-only inspection, Node arithmetic, npm metadata, and dry-run package inventory were used. No Windows executable, native process, BlueStacks, capture, input, ADB, network, install, Git, global mutation, build, or publication occurred.
- **Static-evidence ceiling:** no compilation, ABI, marshaling, Win32 runtime, frame-freshness, BlueStacks, focus/UIPI, or termination claim is supported.

## Remediation Required Before Implementation

1. Extend the inspector challenge/receipt and exact match to every dynamic identity field admitted to control authority, or remove unmatched companion-observed fields from authority. Specify the exact sequence joining preview approval, fresh receipt acquisition, atomic single-use consumption, and capability minting within TTL.
2. Add authoritative virtual-desktop origin/extent fields, bounds, observation source, receipt/config/control bindings, and immediate drift checks; then bind them into selector/preview/action digests and vectors.
3. Replace every historical-ledger placeholder with an exact repository path and function, named subtest, explicit stable success/error result, and one exact command. Correct abbreviated nonexistent `host/...` paths.
4. Assign one canonical budget-ledger owner and exact reservation/reconciliation protocol across parent, inspector, and companion, including inspector acquisition before capability mint, all protocol exchanges, capture attempts, discovery/revalidation snapshots, cancellation, and permanent no-refund outcomes.

## Input Contract

- orchestrationId: `2026-08-22-nba2k27-bluestacks-blocker-closure`
- delegationTaskId: `dt-reprove-plan-005`
- scopeKey: `plan-proof`
- role: `validator`
- artifactId: `root-validator-005-plan-reproof`
- createdAt: `2026-08-22`
- taskMode: `artifact-proof`
- Inputs received: Contract-complete fresh packet; normalized spec; research; original plan; failed proof; remediation addendum; three historical validator traces; current package/source/schema/test inventory; verification criteria, commands, risks, skip policy, and acceptance standard.
- Required context present: Yes.
- Routing metadata status: `absent`.
- Workspace root: `/home/joshl/projects/opencode-harness`; candidate package remained read-only at `/home/joshl/projects/nba2k27-myplayer`.

## Work Performed

- Summary: Rebuilt the seven-finding, former-gap, and complete historical-reproduction matrices; attacked inspector trust/control matching, coordinate binding, budget ownership, generated dependencies, GDI cleanup, package inventory, and command authority.
- Files read: Normalized spec; research; both planner artifacts; failed proof; historical validators 004/006/008; role contract/schema/protocol; current package, config schema, index, host/C# inventory, vault, and tests.
- Files changed: Only this required validator trace artifact; no implementation or planner file was edited.
- Commands: Node/npm/tool availability, `npm ls --all --json`, `npm pack --dry-run --json`, exhaustive selector arithmetic, and read-only text/path probes described above.

## Output Contract

- passFailMatrixOrFindings: Four blocking findings and three proof matrices above.
- commandOutputs: Command-Backed Evidence above.
- schemaResults: Schema and Integration Results above.
- securityAndActivationFindings: Security and Activation Findings above.
- remediationList: Four bounded plan remediations above.
- artifactProof: Direct line-level combined-plan comparisons, current package inventory, tool availability, and exhaustive arithmetic evidence.
- traceArtifactPath: `.memory/orchestrations/2026-08-22-nba2k27-bluestacks-blocker-closure/roles/validator/root-validator-005-plan-reproof.md`
- Evidence: Independent read-only command/source evidence; lifecycle/progress artifacts were not acceptance evidence.

## Handoff

- Next role: Parent orchestration for failed-gate synthesis. Do not dispatch implementation from this plan proof.
- Limitations: Plan proof only; future generated files/tests were not run. Native compilation/runtime/live checks were prohibited and unavailable.
- Risks: Incomplete independent identity, receipt/approval timing ambiguity, unbound virtual-desktop geometry, cross-process budget bypass, non-reproducible historical ledger rows, and all expressly deferred host/runtime risks.
