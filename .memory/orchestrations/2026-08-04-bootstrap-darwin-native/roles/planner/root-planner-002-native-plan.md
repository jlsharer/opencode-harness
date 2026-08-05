# Darwin-Native Portable Bootstrap Implementation Plan

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `planner`
- artifactId: `root-planner-002-native-plan`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved option 2 goal; strong-security intent; no-code-edit boundary; exact deliverable path; native-options research trace and existing descriptor-alias diagnosis traces; required native helper, build/source, bootstrap, manifest, validator, test, release-boundary, cleanup, acceptance, and caveat decisions.
- Required context present: `orchestrationId`, approved goal, scope boundaries, research evidence, deliverable paths, constraints, acceptance criteria, routing status, and resolved routing context were supplied.
- routingMetadataStatus: `absent`. Caller routing metadata labels were absent and none were invented.
- Resolved routing context supplied by caller: `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Converted the native-options research and prior diagnosis into a bounded, dependency-ordered implementation contract. Assessed the parent-dirfd relocation caveat, separated an absolute beneath-root guarantee from the strongest evidenced Darwin contract, and made implementation conditional on the resulting threat-model clarification.
- Files read: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/researcher/root-researcher-001-native-options.md`; prior descriptor-alias researcher/planner/validator traces; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/scripts/validate-portable-harness.mjs`; `.opencode/scripts/validate-harness.mjs`; `.opencode/portable.manifest.json`; `.opencode/harness.manifest.json`; `.opencode/package.json`; `AGENTS.md`; `opencode-harness.design.md`; role contract, trace schema, memory protocol, and trace/index templates.
- Files changed: This planner trace only. The orchestration `INDEX.md` does not exist and planner permissions allow only `roles/planner/*.md`, so it was not created.
- Commands/checks: None. This role did not compile, execute, or validate an implementation; command evidence comes from the cited researcher and diagnosis artifacts.

## Output Contract

- Outputs: Security decision, conditional ordered plan, exact file contracts, dependencies, executable future verification gates, assumptions/open questions, blockers, and role handoff notes.
- Evidence: The Darwin API conclusion is bounded to supplied syscall/manual/host-probe evidence. No native implementation or absolute-containment proof is claimed.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/planner/root-planner-002-native-plan.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/researcher/root-researcher-001-native-options.md`; `.memory/orchestrations/2026-08-04-bootstrap-descriptor-alias/roles/validator/root-validator-003-diagnosis.md`.

### Decision and Blocker

**Darwin's evidenced APIs cannot enforce absolute beneath-root publication for every required operation against an adversary that can concurrently rename an already opened destination directory.** `openat`/`mkdirat`/`linkat`/`renameat`/`unlinkat` bind a basename operation to the pinned directory object, but they do not bind that object atomically to its ancestry. If another actor moves the pinned parent outside the opened root after an ancestry/identity check and before `linkat` or `renameat`, publication follows the parent object and can occur outside the root. A subsequent check can detect the move but cannot retract an overwrite or honestly claim that no bytes were published outside the root. The researched `*_RESOLVE_BENEATH` flags were not accepted uniformly, and, even where accepted for resolution, no supplied evidence shows that they atomically couple ancestry validation to mutation of an already pinned, relocatable parent. Advisory locks, permissions controlled by the same actor, and before/after identity checks do not close this window. The existing Linux alias design has the same pinned-parent relocation limit.

The strongest honest helper contract is therefore **descriptor-relative, symlink-resistant, identity-bound and race-detecting, but not absolute atomic beneath-root confinement under concurrent directory rename**. It preserves atomic no-clobber, explicit overwrite, all-parent capability preflight, and fail-before-first-publication for activation/preflight failures. Once publication starts, a detected parent move may leave a published file in the moved directory and ordinary runtime failures may leave a partial install.

**User clarification is required before implementation.** Choose one:

1. Accept the scoped contract above and authorize the native helper plan below. Manifest/output/docs/tests must name the limitation and must not say “beneath-root guaranteed.”
2. Require the absolute guarantee. Darwin must remain unsupported and fail before destination directory/file creation; option 2 as researched must not be implemented or advertised as satisfying it. A different kernel-enforced mechanism would require new research/evidence.

The user's statement that the strong guarantee is intended is not silently reinterpreted as choice 1. Until the meaning of “strong” is clarified against this concrete rename case, native Darwin implementation is blocked.

### Exact File Set and Contracts

Conditional on approval of the scoped contract, the implementation edit set is:

| Path | Boundary | Contract |
|---|---|---|
| `.opencode/bootstrap/native/darwin-portable-fs.c` | portable managed + source inventory | Auditable, libc-only C implementation. No Node ABI, shell, network, runtime compiler, environment-controlled production behavior, or absolute destination-child mutation. Independently validates the binary protocol and normalized UTF-8 relative paths; uses component-at-a-time no-follow traversal, retained dirfds, `fstat`, `mkdirat`, `openat`, `write`, `linkat`, `renameat`/proved `renameatx_np`, and `unlinkat`; handles bounds, overflow, `EINTR`, short writes, cleanup, and bounded diagnostics. Documents the parent-relocation limit in source comments. |
| `.opencode/bootstrap/native/darwin-portable-fs.universal` | portable managed + source inventory | Checked-in universal Mach-O containing exactly `arm64` and `x86_64` slices built from the adjacent C source. Treated as immutable bytes, never executed in place. Its exact SHA-256, protocol version, architectures, and selected minimum macOS are declared in the portable manifest. No thin fallback binaries. |
| `.opencode/scripts/build-darwin-portable-fs.mjs` | source/release only | Dependency-free release tool using explicit `xcrun`-resolved Apple tools. `--check` builds both slices in a temporary directory, combines them in stable order, verifies architecture table, deployment target, linkage, signing policy, protocol self-test, and source/binary policy without changing tracked files. `--update` is the only mode allowed to replace the checked-in binary and print the new SHA-256 for manifest review. It always removes temporary outputs. The minimum macOS and signing/notarization policy must be selected from actual release support evidence, not guessed. |
| `.opencode/scripts/darwin-portable-fs.test.mjs` | source/release only | Focused Darwin helper/protocol suite: valid operation batches; truncated, trailing, oversized, duplicate, absolute/dot-dot/NUL path frames; wrong magic/version/identity; short-write/error cleanup; no-clobber/overwrite; parent preflight; signals; universal slice/self-test checks; deterministic synchronization for the parent-move caveat. Skips with an explicit reason off Darwin or without the release toolchain; release acceptance may not skip required Darwin jobs. |
| `.opencode/scripts/bootstrap-portable-harness.mjs` | portable managed | Keeps common parse/source/collision/dry-run planning. Selects Linux `/proc/self/fd` only on Linux, Darwin helper only on Darwin, and fails unsupported platforms before destination mutation. On Darwin, validates manifest capability shape and source helper bytes, creates a private `mkdtemp` activation directory outside the target, writes the exact helper with exclusive mode `0700`, rehashes, invokes by absolute path with no shell/PATH lookup, validates self-test/protocol/platform/native architecture, and only then submits the full operation batch. The helper—not JS pathname APIs—opens and identity-checks the target, prepares/probes every parent, and publishes. Dry-run never materializes or executes the helper. Output reports an honest Darwin safety identifier distinct from Linux and never claims atomic beneath-root confinement. |
| `.opencode/portable.manifest.json` | portable contract | Bump the closed schema (recommended `2.0.0`) and replace the false shared alias declaration with closed backend records: Linux `/proc/self/fd`; Darwin helper path, lowercase 64-hex SHA-256, protocol `1`, exact `arm64`/`x86_64` slices, selected minimum macOS, all-parent preflight, same-parent hard-link no-clobber, fail-before-publication activation behavior, and the exact scoped parent-relocation limitation. Add the C source and universal binary to `managedFiles`; do not add source-only build/test tooling. No placeholder hash or untested OS floor may be committed. |
| `.opencode/scripts/validate-portable-harness.mjs` | portable managed | Updates exact inventory/schema/backend expectations. Treats only the exact declared binary path as binary; verifies regular/no-symlink path, SHA-256, FAT magic/table, exactly two expected CPU types, slice bounds/non-overlap, protocol metadata, and manifest linkage. It skips UTF-8 forbidden-reference scanning only for that binary and continues scanning C source and all text assets. It does not execute native code or claim host activation proof. |
| `.opencode/scripts/portable-harness.test.mjs` | portable managed | Updates managed/unchanged counts from 43/47 to 45/49. Adds platform-specific selection and Darwin activation failures (missing/corrupt hash, malformed FAT/wrong architecture, protocol/self-test/nonzero/signal) with an empty destination; successful Darwin fresh install, idempotence, installed rerun/validator, no-clobber, overwrite, symlink/root/parent races, all-parent preflight, normal helper-temp cleanup, and kill residue behavior; retains Linux `/proc/self/fd` regressions. Test-only override/synchronization inputs must be gated by `NODE_ENV=test`, cannot change production helper selection, and must be documented as non-production seams. |
| `.opencode/harness.manifest.json` | source inventory | Adds C source and universal binary with distinct native-source/native-binary kinds; adds source-only build and helper-test scripts. Continues to distinguish source/release assets from portable managed assets. |
| `.opencode/scripts/validate-harness.mjs` | source QA | Adds all four new source paths to exact inventory; parses/hashes the binary without UTF-8 reading; checks portable-vs-source boundary, build/test script classification, manifest hash agreement, universal slices, and invokes the installed-profile-equivalent validator. On Darwin release jobs, invokes build `--check` and focused native tests; non-Darwin static QA must still parse the checked-in FAT binary and must report—not conceal—unrun activation checks. |
| `opencode-harness.design.md` | source-only documentation | Documents helper provenance/rebuild command, portable inclusion of source+binary, source-only build/test tooling, no runtime compiler/npm/Node ABI, supported architecture/minimum-OS policy, signing/notarization boundary, bundle-hash limits, scoped rename guarantee, partial-publication and SIGKILL residue behavior, and installed rerun behavior. Installed runtime/validation must not depend on this document. |

No `.opencode/package.json`, lockfile, plugin, OpenCode config, root `.gitignore`, deployment, or memory-seed change is required. `AGENTS.md` need not change because its existing source/portable boundary remains correct; change it only if maintainers deliberately make the release policy a repository-wide instruction.

### Binary Protocol and Integrity Contract

1. Protocol v1 uses fixed-width, explicitly endian-defined integer fields. Request header: magic, version, flags, expected root `dev`/`ino` as 64-bit values, target-path byte length, operation count, and total frame length. Each operation carries overwrite policy, normalized relative path length, content length, UTF-8 path bytes, and raw content. Set conservative documented maximum frame/path/content/count values and reject overflow before allocation.
2. The helper rejects unknown flags, malformed/trailing frames, duplicates, empty/absolute/backslash/NUL/dot/dot-dot paths, invalid UTF-8 paths, unsupported version, and mismatched root identity before target side effects. Content remains arbitrary bytes.
3. Final response is bounded and machine-readable: magic/version, success/failure, phase (`activation`, `root-open`, `parent-preflight`, `publication`, `cleanup`), operation index, errno, whether publication had started, and a fixed-size diagnostic. JS maps indexes to already validated relative paths and does not trust helper text as a path.
4. A test-only synchronization flag may emit bounded phase events and wait for acknowledgements so tests can move a parent exactly between reachability check and publication. Production bootstrap never sets it. This test must demonstrate the scoped limit: the helper detects the post-publication move, but a file can exist in the moved parent. If that result is unacceptable, choice 2 above is mandatory.
5. Manifest SHA-256 proves bundle consistency only, not publisher authenticity. Bootstrap hashes source bytes, exclusively materializes mode `0700` bytes in a private directory, rehashes the materialized file, validates self-test response, and then invokes the real request. Release signing/notarization and downloaded/quarantined artifact tests are separate publisher-authenticity gates.

### Ordered Plan and Dependencies

1. **Decision owner/synthesizer — blocker gate:** record choice 1 or 2. If choice 2, stop and implement only explicit Darwin unsupported fail-closed behavior under a separately approved plan. Also record the supported minimum macOS and release signing/notarization policy before binary acceptance.
2. **Security reviewer — contract review:** review this conclusion and the protocol/resource limits before C work. Confirm that capability wording also corrects the inherited Linux parent-relocation overclaim. Dependency: step 1 choice 1.
3. **Native implementer:** add C helper only, with parser/syscall unit behavior and no generated binary yet. Run strict compiler warnings and sanitizer-focused tests. Dependency: steps 1-2.
4. **Build/tooling implementer:** add build script and focused native test; establish reproducibility policy. Prefer byte-for-byte reproducibility (`-Wl,-no_uuid` or equivalent evidenced settings); if signing prevents it, require reproducible unsigned payload/slice comparison plus explicit signing provenance rather than pretending hashes reproduce. Generate the universal artifact only through `--update`. Dependency: step 3 and selected OS/signing policy.
5. **Bootstrap implementer:** add platform dispatch, closed manifest parsing, hash/materialization/self-test, protocol transport, bounded child I/O/timeouts/termination, Linux retention, diagnostics, and `finally` cleanup. Do not add a Darwin pathname fallback. Dependency: stable helper protocol and generated hash.
6. **Manifest/inventory integrator:** update portable manifest, source manifest, exact portable inventory/counts, and source/portable classifications atomically. Dependency: final binary hash and protocol metadata.
7. **Validator integrator:** add binary-safe portable checks and source QA/build checks. Audit every generic UTF-8 scan/walk so the Mach-O is never decoded as text while no other managed file escapes scanning. Dependency: step 6.
8. **Test implementer:** extend portable E2E and focused helper tests, including activation fail-closed cases before any target directory, all existing races, cleanup, and the deterministic parent-move limitation proof. Test source installation and rerun from an installed profile. Dependency: steps 3-7.
9. **Documentation integrator:** update the source-only design/release guidance with exact verified build command, selected OS floor, provenance/signing policy, activation behavior, and honest security/rollback statement. Dependency: tested behavior.
10. **Independent reviewer:** inspect C bounds/errno/fd lifetimes, protocol transport/deadlock/timeouts, hard-link flags/filesystem behavior, overwrite semantics, FAT provenance, manifest truthfulness, test seams, and source/portable boundary. No acceptance on unresolved high-severity findings.
11. **Validator then artifact-verifier:** run all acceptance gates on native arm64 macOS, x86_64 macOS or an approved real equivalent, and Linux. Artifact-verifier captures universal slices/hash/build provenance and confirms all temporary helper/build/test directories are removed. Validation must precede acceptance.

### Preflight, Rollback, and Cleanup Contract

- Order: validate arguments/target/source/closed manifest -> read/hash every source and plan collisions -> dry-run exit if requested -> verify/materialize/rehash/self-test Darwin helper -> helper opens canonical target no-follow and checks requested identity -> create and pin every unique parent -> identity-check and hard-link-probe every parent, cleaning every probe -> only then publish operation 0.
- Any activation, root-open, parent-creation, identity, or capability-probe failure occurs before first file publication. Close fds, remove probe/temp names, remove only helper-created directories deepest-first when empty, terminate/wait for the child, and remove the private activation directory.
- Publication uses sibling exclusive temporaries. No-clobber is `linkat` followed by temp unlink; approved managed overwrite is same-parent rename. Always attempt exact known-temp cleanup. Never delete destination files during error cleanup.
- There is no false whole-install transaction promise. After publication begins, preserve already published files and report phase/index; do not roll them back, especially overwritten files whose prior bytes are gone. Rerun uses normal equality/collision rules.
- `SIGKILL`, kernel crash, or power loss can leave unpredictable subsets of published files, helper-created empty directories, or nonce-marked hidden sibling temporaries. Parent `finally` removes its private activation directory when it survives. A subsequent run may remove only exact, cryptographically strong helper-owned temp names that it can prove from retained invocation state; it must not wildcard-delete stale-looking destination files. Unprovable residue is reported for manual review. A moved-parent residue outside the root is not safely recoverable by a later root-anchored run.

### Verification Gates and Acceptance Cases

Run after implementation; these are future validator commands, not checks performed by this planner:

1. Syntax/static entry points:
   - `node --check .opencode/scripts/bootstrap-portable-harness.mjs`
   - `node --check .opencode/scripts/build-darwin-portable-fs.mjs`
   - `node --check .opencode/scripts/darwin-portable-fs.test.mjs`
   - `node --check .opencode/scripts/portable-harness.test.mjs`
   - `node --check .opencode/scripts/validate-portable-harness.mjs`
2. Darwin build/artifact:
   - `node .opencode/scripts/build-darwin-portable-fs.mjs --check`
   - `node --test .opencode/scripts/darwin-portable-fs.test.mjs`
   - The gate must show exactly `arm64` and `x86_64`, selected deployment target, allowed system-library linkage, expected signing state, protocol v1 self-test, committed SHA-256 agreement, and no retained build temp.
3. Cross-platform E2E/static acceptance:
   - `node --test .opencode/scripts/portable-harness.test.mjs`
   - `node .opencode/scripts/validate-portable-harness.mjs --root .`
   - `node .opencode/scripts/validate-harness.mjs`
4. Real-host matrix: native arm64 macOS; real x86_64 macOS (Rosetta alone does not prove the x86 kernel/host matrix); oldest selected supported macOS; current supported macOS; Linux with `/proc/self/fd`. Downloaded/quarantined release testing is required if releases claim that distribution path. HFS+/network volumes are either tested and supported or fail preflight and are documented unsupported; APFS-only evidence must not be generalized.
5. Required positive cases: fresh install reports 45 managed + 4 memory; idempotent rerun reports 49 unchanged; dry-run writes/executes nothing; installed bootstrap reruns using installed helper/source; explicit managed overwrite only; memory never overwritten; installed validator passes with only `.opencode` and seeded `.memory` roots.
6. Required fail-before-publication cases: missing/corrupt helper, hash mismatch, invalid FAT or current slice, wrong protocol, failed self-test, non-executable materialization, child timeout/signal/nonzero before preflight, target identity mismatch, symlink component, unsupported platform/filesystem, and failure probing the last destination parent. Destination must contain no managed/memory files; helper/probe/activation temps must be absent.
7. Required publication/race cases: concurrent destination creation preserves competitor bytes; overwrite is atomic; root/intermediate replacement before helper open fails empty; parent replacement before probes fails empty; symlink insertion cannot escape; parent move in the final check-to-publication window produces the explicitly documented limitation result and never a falsely passing “beneath guaranteed” label.
8. Cleanup cases: parser and capability failures, write/close/link/rename errors, normal success, parent termination, helper termination, and forced SIGKILL. Assert the bounded cleanup contract rather than impossible cleanup after power loss/SIGKILL.

### Assumptions and Open Questions

- No external npm/runtime compiler/Node addon/experimental FFI is allowed. Stock runtime means the checked-in universal helper is present and compatible.
- The C source and binary are portable-managed so installed bootstrap can be audited and rerun; build/test scripts and design guidance remain source-only.
- The supported minimum macOS and signing/notarization policy were not supplied and must be evidence-backed before generating an accepted binary.
- Absolute whole-install transactionality and authenticated release distribution remain out of scope; these limits must be explicit.
- Open question requiring user answer: does the required strong guarantee exclude an adversary that can concurrently rename the target root or a pinned destination parent? If not excluded, Darwin support is blocked because the selected approach cannot meet acceptance.

## Handoff

- Next role: `synthesizer` or decision owner for the required threat-model choice; if the scoped contract is accepted, a security `reviewer` must approve protocol wording before the first `implementer` work unit.
- Limitations: Plan only. No C source, binary, build, manifest, bootstrap, validator, test, documentation, cross-architecture execution, Gatekeeper test, or final validation was produced. Darwin API conclusions rely on the supplied macOS 15.6/APFS probes and manuals; no new kernel primitive was proven. The orchestration index could not be created under planner permissions.
- Risks: Treating post-operation detection as prevention would overclaim security; a prebuilt binary adds supply-chain/signing obligations; parser or subprocess bugs can create a new attack surface; cross-filesystem and old-macOS behavior is unproven; uncatchable termination and post-publication failure can leave residue or a partial install.
