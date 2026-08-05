# Darwin Universal Native Helper Artifact Verification

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `artifact-verifier`
- artifactId: `root-artifact-verifier-007-universal-binary`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Independently verify the generated Darwin helper's existence, universal format/slices, deployment targets, linkage, modes/profile inventory, cross-contract SHA-256, reproducibility, signing, private-copy execution, and quarantine/notarization implications without editing implementation.
- Required context present: Yes. `orchestrationId`, artifact root/path, expected two-slice universal tree/profile, parse and execution checks, private temporary-copy requirement, cleanup criteria, reporting requirements, and routing status were supplied or directly established from the closed manifest/build contracts.
- routingMetadataStatus: `absent`. Caller supplied resolved routing context `agent=null, model=null, variant=null, source=unresolved`; routing labels were absent and no values were invented.
- artifactPaths: `.opencode/bootstrap/native/darwin-portable-fs.universal`, adjacent C source, portable manifest, bootstrap, build script, installed/source validators, native tests, and source inventory.
- expectedGeneratedTree: Portable profile contains adjacent source + universal payload; source-only profile contains build/native-test tooling; runtime uses a private mode-0700 materialized executable.
- parseOrRenderChecks: Mach-O/FAT parsing, per-architecture load commands/dependencies/signatures, hashes, modes/inventory, validators, self-tests, bootstrap integration, and Gatekeeper/quarantine probes.
- tempDirectoryRequirements: Private directory and executable copies at mode `0700`, integration targets beneath the approved temp root, no deliverable mutation.
- cleanupDecisionCriteria: Remove on complete PASS; preserve non-secret temp evidence temporarily when a reproducible failure requires remediation handoff.

## Work Performed

- Summary: Independently inspected both Mach-O slices and all repeated contracts, rebuilt for byte equality, ran both architecture self-tests and two-generation bootstrap integration from private copies, ran native and harness validators, and probed per-architecture signatures, Gatekeeper, stapling, xattrs, and synthetic quarantine behavior. Verification found an unsigned x86_64 slice hidden by a host-architecture-only build check.
- Files read: Role contract, trace schema/template, orchestration index and implementer trace; native build/test/bootstrap scripts; portable/source manifests and validators; helper C source and universal binary.
- Files changed: This trace artifact only. No implementation or deliverable was edited. Attempts to write separate validation evidence and update `INDEX.md` were denied by role edit permissions, so all evidence is retained here and the index remains pending caller/orchestrator update.
- Commands/checks: `stat`, `file`, `lipo`, `vtool`, `otool`, `nm`, `shasum`, per-arch and all-arch `codesign`, `spctl`, `stapler`, `xattr`, both architecture self-tests, private bootstrap/install/rerun validation, native tests, reproducible build `--check`, portable validator, source validator, inventory/hash extraction, and private file listings.

## PASS/FAIL Matrix

| Check | Result | Independent evidence |
| --- | --- | --- |
| Artifact exists and is regular | PASS | `stat`: `0644`, 84440 bytes. |
| Universal Mach-O | PASS | `file`: universal with two Mach-O 64-bit executable slices. |
| arm64 and x86_64 slices | PASS | `lipo`: `x86_64 arm64`; both executed (arm64 native, x86_64 through Rosetta). |
| Deployment targets | PASS | `vtool`: both slices use `LC_BUILD_VERSION`, macOS `minos 11.0`, SDK 26.1. |
| libc/system-only linkage | PASS | `otool -L`: exactly `/usr/lib/libSystem.B.dylib` for each slice; no other dylib. |
| Modes and profile inventory | PASS | Source/installed payload `0644`; explicit private copies and temp roots `0700`. Portable profile includes C+binary, excludes source-only build/test tools, and has 45 managed files + 4 memory seeds. |
| SHA-256 agreement | PASS | Binary, manifest, bootstrap, and installed validator all equal `8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50`; build `--check` emitted the same hash. Source validator derives/checks the manifest hash rather than pinning another literal. |
| Reproducible build `--check` | PASS | Rebuilt bytes matched exactly; output reported both architectures, min macOS 11.0, and the agreed hash. |
| Ad-hoc signing across both slices | **FAIL** | arm64 is linker ad-hoc signed with no Team ID. x86_64 is unsigned. `codesign --verify --all-architectures` fails. The build script checks only the host-selected architecture and reports a false universal signing success. |
| Private-copy self-tests | PASS | Mode-0700 copy returned protocol 1/Darwin/arm64; `arch -x86_64` returned protocol 1/Darwin/x86_64; both status 0. |
| Private-copy integration | PASS | Source bootstrap installed private `install-a`; its installed bootstrap installed private `install-b`; installed validator passed; focused native suite passed 3/3. |
| Quarantine/notarization inspection | PASS (inspection only) | Source has provenance but no quarantine xattr. `spctl` rejects it (`no usable signature`); it is not Developer ID signed/notarized. A synthetic quarantined private copy was rejected and both architecture launches exited 137. |
| Portable/source validators | PASS with blind spot | Both passed, but neither detects the unsigned x86_64 slice and neither overrides direct signing evidence. |

## Output Contract

- Outputs: **Overall FAIL.** Structural, hash, build, linkage, mode/profile, and execution checks passed, but the closed universal signing declaration does not hold: arm64 is linker ad-hoc signed with no Team ID while x86_64 is unsigned. The artifact is not Gatekeeper-ready or notarized.
- Evidence: The matrix above and command excerpts below provide reproducible evidence. Host was macOS 15.6 (`24G84`) arm64, Apple SDK 26.1, Node `v26.4.0`.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/artifact-verifier/root-artifact-verifier-007-universal-binary.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md` (index update not permitted to this role).
- tempPath: `/var/folders/j4/pcc6nny91plf3575fn97hcz40000gn/T/opencode/artifact-verifier.3ovUVF` (private mode `0700`).
- fileListing: Source-copy helper and explicit installed-helper copy are 84440 bytes/mode `0700`; install-a/install-b payloads are 84440 bytes/mode `0644`, beside 18568-byte C sources; temp tree is approximately 1.0 MiB.
- commandOutputsOrRenderEvidence: `file/lipo/vtool/otool` prove FAT arm64+x86_64, min macOS 11.0, and only libSystem; hashes all equal `8575eae...bd50`; both self-tests and private integration pass; all-architecture signature verification fails because x86_64 is unsigned; synthetic-quarantined launches exit 137.
- cleanupDecision: Preserve the private temp tree temporarily for remediation proof because result is FAIL. Remove after signing remediation is independently captured, or allow OS temp cleanup; it contains no credentials.
- limitations: Arm64 hardware with Rosetta for x86_64; no Intel hardware, macOS 11, alternate filesystem, real browser/archive download provenance, Developer ID identity, or notarization-service submission.
- artifactHashes: Universal SHA-256 `8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50` in source, both private installations, manifest, bootstrap, validator, and reproducible build output.

### Command Evidence

```text
file/lipo: universal Mach-O; x86_64 arm64
vtool (both slices): platform MACOS; minos 11.0; sdk 26.1
otool -L (both slices): /usr/lib/libSystem.B.dylib only
shasum -a 256: 8575eae4c31aa0b2dbd68b770a68a69bdad825cbc8c71adbf4e77ccd63e7bd50
build --check: passed with identical bytes/hash, arm64+x86_64, min-macos=11.0
codesign -dvvv --arch arm64: flags=adhoc,linker-signed; TeamIdentifier=not set
codesign -dvvv --arch x86_64: code object is not signed at all (status 1)
codesign --verify --all-architectures: code object is not signed at all (status 1)
private arm64 self-test: OPDFSELF1 protocol=1 platform=darwin arch=arm64
private Rosetta self-test: OPDFSELF1 protocol=1 platform=darwin arch=x86_64
private installed bootstrap: created/updated=45, memory-created=4, write-safety=darwin-native-race-detecting
installed portable validator: Portable OpenCode harness validation passed
native test suite: tests 3; pass 3; fail 0; skipped 0
source validator: OpenCode harness validation passed
spctl: rejected; source=no usable signature (status 3)
stapler validate: raw executable is not staple-capable (status 66)
synthetic quarantined copy: arm64 and x86_64 launches both status 137
```

## Handoff

- Next role: `implementer` for narrowly scoped signing/build-gate remediation, then independent `validator` and `artifact-verifier` rerun before acceptance.
- Limitations: Existing validators and `build --check` pass despite the unsigned x86_64 slice. Quarantine testing was synthetic and host-specific. Separate validation evidence and INDEX edits were requested but denied by role path permissions.
- Risks: A distributed/quarantined helper is rejected by Gatekeeper on this host; the unsigned x86_64 slice contradicts the declared universal ad-hoc state and may fail differently on Intel or release-channel systems. Do not accept the generated artifact as currently signed.
