# Darwin Native Bootstrap Remediation Loop 2

## Metadata

- orchestrationId: `2026-08-04-bootstrap-darwin-native`
- role: `implementer`
- artifactId: `root-implementer-012-remediation-loop2`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Remediation loop 2 for every actionable finding in `root-reviewer-010-remediation-review.md`: lifecycle-wide catchable-signal coordination and gap coverage, concurrency-isolated deterministic activation cleanup tests, and one exact low-cost 256 MiB frame-bound contract; regenerate binary/hash only because C changed; rerun repeated full checks; update index and this exact trace.
- Required context present: `orchestrationId`, reviewer findings, exact remediation outcomes, allowed implementation/documentation/memory scope, binary/hash propagation requirement, verification commands, preservation requirements, routing status, and handoff requirements were supplied.
- routingMetadataStatus: `absent`. Caller routing labels remain absent and no values were invented. Resolved routing context remains `agent=null, model=null, variant=null, source=unresolved`.

## Work Performed

- Summary: Replaced per-child signal handlers with one Darwin activation-lifecycle coordinator installed before private activation creation and retained through final cleanup. It tracks at most one child, terminates/reaps active children, keeps catchable signals pending through cleanup, uses a lifecycle keepalive so async cleanup completes, removes handlers once, and restores termination semantics. Added deterministic signal pauses for all prior gaps. Scoped activation tests to unique per-invocation prefixes rather than system-wide directory snapshots. Made 256 MiB an exclusive JS/C frame limit with early declared-length rejection and a small exact-boundary test.
- Files read: Full loop-1 remediation review; current bootstrap, C helper, native/portable tests, design documentation, manifests/validator hash contracts, prior role traces, and orchestration index.
- Files changed: `.opencode/bootstrap/native/darwin-portable-fs.c`; `.opencode/bootstrap/native/darwin-portable-fs.universal`; `.opencode/scripts/bootstrap-portable-harness.mjs`; `.opencode/scripts/darwin-portable-fs.test.mjs`; `.opencode/scripts/portable-harness.test.mjs`; `.opencode/portable.manifest.json`; `.opencode/scripts/validate-portable-harness.mjs`; `opencode-harness.design.md`; `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/INDEX.md`; this trace artifact.
- Commands/checks: Six syntax checks passed. Focused native tests passed 31/31, including exact 256 MiB exclusive-bound rejection without allocating 256 MiB. The full portable suite was run three consecutive times under normal concurrency; each run passed 22 with 1 accepted pinned-parent skip and no failures. Reproducible build check passed with final SHA-256 `931f981849fdd209fc8fa066dd194eb33075ff9c88dc936dd0792695896918a9`, `arm64`/`x86_64`, macOS 11.0, and all-slice ad-hoc/no-Team-ID state. `codesign --verify --strict --all-architectures`, portable validator, source validator, SHA-256, `lipo`, and diff checks passed.

## Output Contract

- Outputs: Lifecycle-wide signal cleanup implementation and deterministic phase tests; isolated activation-directory assertions safe under concurrent test/process activity; aligned exclusive frame bound and low-cost boundary test; regenerated universal helper and propagated hash; updated design/index/trace.
- Evidence: Signal tests deterministically stop after private directory creation, between self-test and real execution, during active helper execution, and during final cleanup; each exits with original SIGTERM semantics and removes only its own activation directory. Three complete portable runs passed without shared-namespace interference. JS and C now both reject totals greater than or equal to 256 MiB, and C rejects the declared exact boundary after only the header-sized input.
- Artifact links: `.memory/orchestrations/2026-08-04-bootstrap-darwin-native/roles/implementer/root-implementer-012-remediation-loop2.md`; `roles/reviewer/root-reviewer-010-remediation-review.md`; updated orchestration `INDEX.md`.
- changedFiles: The 10 paths listed under Work Performed.
- rationale: Close ordinary-signal cleanup windows and test flakiness without weakening child reaping, restored signal behavior, activation isolation, or protocol resource bounds.
- schemaOrBoundaryChoices: Portable schema and protocol version remain unchanged. Frame length uses an explicit exclusive 256 MiB ceiling, so maximum valid length is 268,435,455 bytes. Test-only invocation IDs and phase markers remain gated by `NODE_ENV=test`; production activation naming remains random `mkdtemp` behavior.
- commandsRun: All assigned syntax, focused, repeated full-suite, validator, build, signature, hash, architecture, and diff checks passed.
- handoffNotes: Reviewer should inspect coordinator attach/detach/dispose and pending-signal precedence. Validator should rerun normal-concurrency portable tests and Linux behavior. Artifact-verifier must verify the regenerated hash and all-slice signatures before acceptance.
- knownLimitations: No real Intel hardware, Linux host, oldest supported macOS, non-APFS filesystem, or downloaded/quarantined release was exercised. Catchable signals are covered; `SIGKILL`, kernel failure, and power loss remain uncatchable and can leave residue. The accepted pinned-parent relocation limitation remains unchanged.

## Handoff

- Next role: Independent `reviewer`, `validator`, and `artifact-verifier` loop-2 reruns.
- Limitations: Implementer evidence is not final acceptance. Cross-host and uncatchable-failure gates remain outstanding.
- Risks: Post-publication failure can remain partial; ad-hoc signing does not authenticate the publisher or establish Gatekeeper readiness; filesystem-specific behavior still requires matrix validation.
