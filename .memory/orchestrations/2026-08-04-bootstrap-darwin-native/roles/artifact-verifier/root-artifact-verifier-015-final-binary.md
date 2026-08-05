# Final Darwin Universal Helper Artifact Verification

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `artifact-verifier`
- artifactId: `root-artifact-verifier-015-final-binary`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation artifact verification loop 2 for the regenerated universal helper, exact current hash `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`, all repeated contracts, format/slices/deployment/linkage/signatures/reproducibility/private execution/integration/profile inventory, and honest Gatekeeper/quarantine documentation; implementation edits prohibited.
- Required context present: Yes. Orchestration ID, loop-2 implementer trace, expected binary/hash/contracts, verification scope, private-temp requirement, cleanup criteria, artifact path, and routing status were available.
- routingMetadataStatus: `absent`. Caller routing labels were absent and no values were invented; existing resolved context remains `agent=null, model=null, variant=null, source=unresolved`.
- artifactPaths: `.opencode/bootstrap/native/darwin-portable-fs.universal`, adjacent source, build/native-test scripts, portable manifest, bootstrap, installed/source validators, design documentation, and private installed copies.
- expectedGeneratedTree: Portable profile contains C source and universal helper, excludes source-only build/native-test tooling, installs payload mode `0644`, and materializes private executable copies mode `0700`.
- parseOrRenderChecks: FAT/Mach-O parsing, architecture/load/dependency/signature records, all-architecture verification, cross-contract hashes, reproducible rebuild, native/Rosetta self-tests, two-generation integration, profile/modes, validators/tests, documentation, xattrs, Gatekeeper, stapling, and synthetic quarantine.
- tempDirectoryRequirements: Independent private mode-0700 verifier tree and executable; retain listings and command proof, then remove on PASS.
- cleanupDecisionCriteria: Remove verifier-owned temp copies after a complete PASS and trace parse; never remove ambient activation paths not created by this verification.

## Work Performed

- Summary: Independently inspected and rebuilt the loop-2 universal helper, verified both architecture signatures and all repeated hashes, executed both slices from a private copy, bootstrapped two private installations, validated the installed profile, ran the 31-case native suite and source QA, inspected modes/inventory/documentation, and reprobed Gatekeeper and synthetic quarantine behavior.
- Files read: Loop-2 implementer trace, orchestration index, memory/role contracts and schema, native binary/source/build/test files, bootstrap, manifest, validators, source inventory, and design documentation.
- Files changed: This trace artifact only. No implementation or deliverable was edited. INDEX update is outside the artifact-verifier role's permitted edit path and remains an orchestrator handoff.
- Commands/checks: `stat`, `shasum`, `file`, `lipo`, `vtool`, per-slice `otool`, per-slice and strict all-architecture `codesign`, build `--check`, Node contract/hash extraction, private arm64/Rosetta self-tests, two private bootstrap generations, installed validator, profile/mode listings, native tests, source validator, activation count observations, `xattr`, `spctl`, `stapler`, and separate synthetic-quarantine executions.

## Final PASS/FAIL Matrix

| Check | Result | Independent evidence |
| --- | --- | --- |
| Artifact existence and mode | PASS | Regular 119104-byte source payload, mode `0644`. |
| Universal Mach-O format | PASS | `file` identifies a two-architecture Mach-O universal executable. |
| arm64 and x86_64 slices | PASS | `lipo -archs` reports exactly `x86_64 arm64`; each slice executed successfully (x86_64 via Rosetta). |
| Deployment target | PASS | Both `vtool` records: platform macOS, `minos 11.0`, SDK 26.1. |
| libc/system-only linkage | PASS | Per-slice `otool -L` reports only `/usr/lib/libSystem.B.dylib`. |
| Current SHA-256 across contracts | PASS | Binary, portable manifest, bootstrap, installed validator, private installed copies, and reproducible build output all equal `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`. |
| arm64 ad-hoc/no-Team-ID signature | PASS | `flags=0x2(adhoc)`, `Signature=adhoc`, `TeamIdentifier=not set`, display status 0. |
| x86_64 ad-hoc/no-Team-ID signature | PASS | `flags=0x2(adhoc)`, `Signature=adhoc`, `TeamIdentifier=not set`, display status 0. |
| Strict all-architecture verification | PASS | `codesign --verify --strict --all-architectures --verbose=4`: valid on disk, satisfies designated requirement, status 0. |
| Reproducible build | PASS | `--check` produced byte-identical hash, both architectures, min macOS 11.0, and all-slice ad-hoc/no-Team-ID result. |
| Private-copy self-tests | PASS | Private mode-0700 copy returned protocol 1/Darwin/arm64 and protocol 1/Darwin/x86_64 under Rosetta. |
| Private-copy integration | PASS | Repository bootstrap created install-a; install-a's private installed bootstrap created install-b; each reported 45 managed + 4 memory files and Darwin-native write safety; install-b validator passed. |
| Profile inventory and modes | PASS | C source + binary are portable managed; build/native-test scripts are source-only; inventory is 45 managed files + 4 seeds; installed helpers are `0644`, explicit verifier executable is `0700`. |
| Native and harness checks | PASS | Native suite passed 31/31 with no skips/failures; portable validator and source validator passed. |
| Gatekeeper/quarantine documentation | PASS | `opencode-harness.design.md` explicitly says ad-hoc is not Developer ID, hash is not publisher authentication, and notarization/quarantine/downloaded-release testing remain release-channel responsibilities; it records synthetic evidence that the payload is not Gatekeeper-ready. |
| Gatekeeper/quarantine probe | PASS (limitation confirmed) | Source has provenance but no quarantine xattr; `spctl` rejects it (status 3), raw helper is not staple-capable (status 66), and separate synthetic-quarantined arm64/x86_64 copies each exited 137. No notarized/downloaded-release claim is accepted. |

## Output Contract

- Outputs: **Final artifact-verifier PASS.** The regenerated binary and all closed hash/signing/profile contracts agree. Both Mach-O slices are present, macOS-11-compatible by load command, libSystem-only, independently ad-hoc signed without Team IDs, and valid under strict all-architecture verification. Rebuild, private execution, integration, tests, and validators passed. Gatekeeper/non-notarization limitations remain explicit and experimentally consistent.
- Evidence: Matrix and command transcript below. Verification host: macOS 15.6 (`24G84`) arm64, Apple SDK 26.1, Node `v26.4.0`.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/artifact-verifier/root-artifact-verifier-015-final-binary.md`; input `roles/implementer/root-implementer-012-remediation-loop2.md`; `INDEX.md` pending a role with permission.
- tempPath: `/var/folders/j4/pcc6nny91plf3575fn97hcz40000gn/T/opencode/artifact-verifier-loop2.mqQ7QZ`.
- fileListing: Private root and source executable used mode `0700`; install-a/install-b each contained a 20061-byte C source and 119104-byte helper at `0644`; captured verifier tree size was approximately 1.3 MiB.
- commandOutputsOrRenderEvidence: Hash `931f9818...6918a9` matched all contracts and generated copies; both signatures showed ad-hoc/no Team ID; all-architecture verify status 0; both architecture self-tests, two private integrations, 31 native tests, and validators passed; Gatekeeper probes retained the documented rejection posture.
- cleanupDecision: The verifier-owned private tree was removed after a 14-field trace parse passed; explicit existence check returned `cleanup=PASS temp-removed`. Ambient `/private/var/tmp/opencode-portable-helper-*` entries predated/concurrently overlapped this run (count 18 before and after integration, later 17) and were deliberately not modified; equal integration counts provide no evidence that this run added residue, but the ambient namespace prevents a clean system-wide zero assertion.
- limitations: x86_64 used Rosetta rather than Intel hardware. No macOS 11 host, real downloaded browser/archive artifact, Developer ID identity, notarization-service submission, alternate filesystem, or complete Gatekeeper online/offline matrix was available. Ambient activation directories prevented a global-cleanliness claim and were outside this artifact verification's ownership.
- artifactHashes: SHA-256 `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9` for source payload, manifest/bootstrap/validator contracts, both private installations, and reproducible output.

### Command Evidence

```text
file/lipo: Mach-O universal binary; x86_64 arm64
vtool arm64/x86_64: platform MACOS; minos 11.0; sdk 26.1
otool -L arm64/x86_64: /usr/lib/libSystem.B.dylib only
codesign --verify --strict --all-architectures: valid on disk; status 0
codesign arm64: Signature=adhoc; TeamIdentifier=not set; status 0
codesign x86_64: Signature=adhoc; TeamIdentifier=not set; status 0
build --check: sha256=931f9818...6918a9; arm64,x86_64; min-macos=11.0; signing=adhoc-all-slices-no-team-id
private self-tests: OPDFSELF1 ... arch=arm64; OPDFSELF1 ... arch=x86_64
private install-a/install-b: created/updated=45; memory-created=4; write-safety=darwin-native-race-detecting
installed validator: Portable OpenCode harness validation passed
native tests: 31 pass; 0 fail; 0 skipped
source validator: OpenCode harness validation passed
activation count during integration: before=18; after=18 (ambient concurrent entries not owned or removed)
source xattrs: provenance present; quarantine absent
spctl: rejected, status 3; stapler: raw executable not staple-capable, status 66
separate synthetic-quarantined arm64/x86_64 launches: status 137 each
```

## Handoff

- Next role: Parent orchestrator or validator/reviewer for final synthesis and permitted INDEX update.
- Limitations: Artifact PASS does not establish publisher authenticity, Developer ID/notarized distribution, real Intel compatibility, oldest-host execution, or global activation-directory cleanliness in a concurrently active environment.
- Risks: Ad-hoc artifacts remain Gatekeeper-insufficient when quarantined; the accepted pinned-parent relocation window, post-publication partial state, and uncatchable failure residue remain outside this binary-contract verification.
