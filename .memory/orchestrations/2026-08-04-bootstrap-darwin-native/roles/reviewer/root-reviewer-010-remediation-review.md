# Darwin Native Bootstrap Remediation Review Loop 1

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `reviewer`
- artifactId: `root-reviewer-010-remediation-review`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Re-review current uncommitted diffs after `root-implementer-008-remediation-loop1.md`; verify each prior reviewer finding and signing/artifact remediation without editing implementation; focus on identity snapshot flow, activation trust/path reopening, child signal races, parser bounds, signing/build claims, Linux behavior, and hash/manifest drift.
- Required context present: Prior reviewer findings, remediation implementer artifact, current implementation/diffs, intended remediation outcomes, accepted pinned-parent limitation, test expectations, orchestration ID, and routing status were present.
- routingMetadataStatus: `absent`. Resolved routing context remains `agent=null, model=null, variant=null, source=unresolved`; no caller routing labels were invented.

## Work Performed

- Summary: Re-read the remediated bootstrap, C helper, build/signing tooling, native and portable tests, manifests, validators, documentation, prior findings, remediation trace, and orchestration index; traced identity and signal state transitions; checked protocol boundaries and repeated contract values; reran build, signature, focused/full tests, validators, and syntax/diff checks.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/{reviewer/root-reviewer-006-security-review.md,implementer/root-implementer-008-remediation-loop1.md}`; orchestration `INDEX.md`; `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/scripts/{bootstrap-portable-harness.mjs,build-darwin-portable-fs.mjs,darwin-portable-fs.test.mjs,portable-harness.test.mjs,validate-portable-harness.mjs,validate-harness.mjs}`; `.opencode/portable.manifest.json`; `.opencode/harness.manifest.json`; `opencode-harness.design.md`; current Git status/diff.
- Files changed: This reviewer trace only. Reviewer permissions did not permit `INDEX.md`; no implementation was edited.
- Commands:
  - `git status --short`, diff inventory/inspection, `git diff --check`, and six `node --check` commands.
  - `node --test .opencode/scripts/darwin-portable-fs.test.mjs` — 30/30 passed.
  - `node --test .opencode/scripts/portable-harness.test.mjs` — 16 passed, 2 failed, 1 accepted-limitation skip; failures were the global activation-directory assertions at lines 223 and 265.
  - Each failed portable case rerun alone with `--test-name-pattern` — both passed, demonstrating shared/global test interference rather than proving the combined gate reliable.
  - `node .opencode/scripts/build-darwin-portable-fs.mjs --check` — passed with SHA-256 `50b795693a854dc4b5051bd6afe96cc63628aea7ecd5649ce5fe17c9678686dc`, `arm64`/`x86_64`, macOS 11.0, all-slice ad-hoc/no-Team-ID declaration.
  - `codesign --verify --strict --all-architectures` and per-slice `codesign -dvvv` — passed; both slices are ad-hoc and have no Team ID.
  - `shasum -a 256`, activation-parent ownership/mode/realpath probes, portable validator, and source validator — passed. `/private/var/tmp` was real, root-owned, and mode `1777` on this host.

## Output Contract

- Outputs: Severity-ordered remediation findings, prior-finding resolution matrix, open questions, verdict, residual risk, concise change summary, and artifact path.
- Evidence: Current line-level source inspection and independently rerun commands. Isolated passing tests do not erase the failing required combined portable gate.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/reviewer/root-reviewer-010-remediation-review.md`.

### Findings

1. **Medium — Catchable-signal cleanup still has uncoordinated activation windows.** Signal handlers are installed only inside `runChild` (`.opencode/scripts/bootstrap-portable-harness.mjs:79-147`). The activation directory exists from `mkdtemp` at `:209`, including materialization/rehash before the self-test call at `:212-214`, the interval after self-test handlers are removed and before `activateDarwinHelper` returns at `:216-217`, and the interval before the real `runChild` installs new handlers at `:497-510`. A `SIGINT`, `SIGTERM`, or `SIGHUP` delivered in one of those windows uses Node's default termination behavior, so neither the activation catch (`:218-220`) nor outer `finally` (`:513-515`) is guaranteed to execute; a private activation directory can remain. The remediation correctly prevents an active helper from continuing after a handled parent signal, but it does not fully resolve the prior ordinary-signal cleanup finding. The new signal test deliberately waits until the long-running helper is active (`.opencode/scripts/portable-harness.test.mjs:245-265`) and cannot cover these gaps.

2. **Medium — The required portable test command is nondeterministic because cleanup assertions inspect a shared system-wide namespace.** `activationDirectories()` lists every matching directory under `/private/var/tmp` (`.opencode/scripts/portable-harness.test.mjs:47-49`). The timeout/output and parent-signal tests independently snapshot and compare that global list at `:213-224` and `:245-265`. In this review's full-suite run, the timeout test observed the signal test's activation directory and the signal test retained the timeout test's directory in its baseline, producing two failures; each test passed when run alone, and no helper directory remained afterward. Any concurrent bootstrap process can cause the same false result. Thus remediation added useful coverage but introduced a failing/flaky required gate and cannot support the implementer trace's unconditional “portable E2E passed” claim on this rerun.

3. **Low — The protocol's exact maximum frame is accepted by the JS encoder but rejected by the C reader.** JS rejects only totals greater than 256 MiB (`.opencode/scripts/bootstrap-portable-harness.mjs:150-155`), and the C parser later nominally rejects only `frame_length > MAX_FRAME` (`.opencode/bootstrap/native/darwin-portable-fs.c:341-348`). However, when `read_request` has consumed exactly `MAX_FRAME`, its next loop sees `used == capacity` and returns `EFBIG` before attempting the EOF read (`:281-300`). A valid request whose total is exactly 256 MiB therefore fails despite both protocol-side bounds claiming equality is allowed. The expanded parser tests cover over-limit declared content but not an exact-size frame (`.opencode/scripts/darwin-portable-fs.test.mjs:110-141`). This is a boundary correctness defect, not an observed memory-safety exploit.

### Prior Finding Resolution Matrix

| Prior finding | Result | Evidence |
|---|---|---|
| High split identity snapshot | **Resolved** | One BigInt snapshot is captured at `bootstrap:452`, compared exactly with canonical identity at `:461-462`, and the same object is encoded at `:508`; deterministic replacement test is at `portable-harness.test.mjs:178-183`. Later Number checks do not replace the BigInt protocol binding. |
| Medium activation environment/path trust | **Resolved within the declared different-uid threat model** | Empty helper environment at `bootstrap:81-85`; fixed, real, root-owned sticky activation parent checks at `:201-209`; private exclusive mode-0700 materialization and hash verification at `:210-216`; poisoned environment test at `portable-harness.test.mjs:227-243`. Same-effective-uid/root substitution remains explicitly out of scope. |
| Medium parent/helper signal coordination | **Partially resolved** | Active-child termination, reaping, cleanup, and restored signal semantics are implemented at `bootstrap:91-147,551-555` and pass in isolation, but finding 1 remains for catchable signals outside `runChild`. |
| Medium native parser/syscall test gap | **Substantially resolved** | Native suite expanded from 3 to 30 passing tests across malformed frames/paths, identity, publication, preflight, failure cleanup, and helper termination (`darwin-portable-fs.test.mjs:102-222`). Exact maximum-frame coverage remains missing as finding 3; deterministic accepted parent-relocation proof remains intentionally absent/skipped. |
| Low Linux `/dev/fd` regression | **Code contract resolved; host validation pending** | `/proc/self/fd` and `/dev/fd` are restored in the manifest (`portable.manifest.json:10-16`), bootstrap closed contract (`bootstrap:49-70`), and validator expectations. No Linux-host command was available in this Darwin review. |
| Artifact all-slice signing failure | **Resolved on current artifact** | Build signs each thin slice before `lipo` (`build-darwin-portable-fs.mjs:25-33`), verifies all architectures and each slice (`:42-48`), exact rebuild passed, and independent direct probes showed both slices ad-hoc/no Team ID. The signing label and new hash agree across current manifest/bootstrap/validators/docs. |

### Open Questions

- Is cleanup after catchable signals required throughout the whole activation lifetime, or only while a helper child is active? The prior finding and planner cleanup language imply the former, while current documentation narrows the statement to “during helper execution.”
- Should the protocol maximum be inclusive at 256 MiB as the JS/C validation currently states, or should every producer and test enforce a strictly smaller maximum?
- How will activation cleanup tests identify only their own invocation without relying on all system-wide `opencode-portable-helper-*` directories remaining unchanged?

### Verdict

**Changes requested.** The prior root-identity, environment trust, Linux alias, and universal-signing defects are resolved, and parser/syscall coverage is materially improved. Ordinary-signal activation cleanup remains incomplete, the required portable suite failed because new tests share a global namespace, and the exact protocol maximum is inconsistent.

### Residual Risk

- Accepted concurrent pinned-parent relocation, post-publication partial state, and uncatchable `SIGKILL`/power-loss residue remain.
- Real x86_64 hardware, Linux host, oldest supported macOS, non-APFS filesystems, and downloaded/quarantined distribution remain unverified.
- Ad-hoc signing and SHA-256 consistency do not authenticate the publisher or establish Gatekeeper/notarization readiness.
- No current hash/manifest/backend/signing drift was found: active contracts use `50b795693a854dc4b5051bd6afe96cc63628aea7ecd5649ce5fe17c9678686dc`; old hashes occur only in superseded historical traces.

### Change Summary

- Remediation consolidates Darwin identity binding, fixes activation parent/environment trust under an explicit threat model, coordinates active-child signals, expands native/launcher tests, restores Linux aliases, signs/verifies both Mach-O slices, and propagates the regenerated helper hash and signing label.

## Handoff

- Next role: `implementer` remediation loop 2 for findings 1-3, then independent `reviewer` and `validator`; artifact verification should rerun after any binary/build change.
- Limitations: Darwin arm64/APFS review only; no implementation edits, Linux/x86_64/old-macOS/non-APFS host runs, full-size 256 MiB frame execution, or privilege-boundary/quarantine test. `INDEX.md` was not updated because reviewer permissions did not allow it.
- Risks: Catchable-signal activation residue, flaky shared activation assertions, and maximum-frame contract mismatch remain open.
