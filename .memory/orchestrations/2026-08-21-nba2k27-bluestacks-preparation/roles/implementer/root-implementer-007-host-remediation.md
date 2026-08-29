# Final Host-Preparation Remediation Implementation

## Metadata

- orchestrationId: `2026-08-21-nba2k27-bluestacks-preparation`
- delegationTaskId: `dt-remediate-host-preparation-007`
- scopeKey: `durable-host-preparation`
- role: `implementer`
- artifactId: `root-implementer-007-host-remediation`
- createdAt: `2026-08-22`
- taskMode: `implementation`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh implementation packet, approved planner trace, failed revalidation trace, five exact blocker classes, durable destination, preservation rules, and verification commands.
- Required context present: Yes. The supplied traces, role contract/schema, destination runtime/tests/native source, and prior regressions were readable.
- Routing metadata status: `absent`; no routing values were invented.
- Workspace root: `/home/joshl/projects/opencode-harness`; implementation destination: `/home/joshl/projects/nba2k27-myplayer`.

## Work Performed

- Summary: Closed all five reported blocker classes without adding a live route. Preview construction now derives and freezes the only currently recognized reversible key primitive and complete action/state/capture binding; control capabilities require the complete immutable authority set; the launcher itself emits and validates a hello plus exact close exchange; evidence handles are opaque process-branded objects serialized by verified run identity; and the dormant C# source now implements bounded DPI/window/process discovery, client capture, provenance, and preview-gated input operations instead of unconditional unsupported results.
- Files changed:
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/protocol-session.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/run-capability.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/launch-companion.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/src/nba2k27-myplayer/host/evidence-vault.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Program.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Protocol.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Identity.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Capture.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/Input.cs`
  - `/home/joshl/projects/nba2k27-myplayer/companion/windows/README.md`
  - `/home/joshl/projects/nba2k27-myplayer/docs/nba2k27-myplayer/windows-host-preflight.md`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/host-protocol.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/host-authority.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/evidence-vault.test.mjs`
  - `/home/joshl/projects/nba2k27-myplayer/test/nba2k27-myplayer/windows-contract.test.mjs`
- Commands:
  - Node syntax checks for index, CLI, and all changed host modules — exit 0.
  - `node --test test/nba2k27-myplayer/*.test.mjs` — exit 0; 90 pass, 0 fail, 0 skipped.
  - `npm run test:host && npm run check:host` — exit 0; 19 focused tests pass.
  - `npm run verify:no-live && npm run verify:pack` — exit 0; `NO_LIVE_OK files=42`; `PACK_OK entries=56`.
  - `npm ls --all --json` — exit 0; root package only.
  - `npm pack --dry-run --json` — exit 0; 56 entries, no bundles, tests, compiled output, evidence, config, credentials, or traces.
  - Valid config and observe-transcript CLI checks — exit 0; malformed transcript — expected exit 2 with stable `E_DUPLICATE_KEY` and no supplied-path disclosure.

## Schema and Boundary Choices

1. `markPreviewed` accepts only the semantic action `navigateBack`; it derives the exact Escape down/up primitive, capture/provenance/process/window/geometry binding, pre/post evidence IDs, deadlines, budgets, plan digest, action-set digest, and preview digest. Input is accepted only when canonical bytes equal that sealed action. No caller coordinate, key, expected state, digest, or budget can broaden it.
2. Control capability minting is a closed schema over protocol/config/executable/session/run/invocation, process/window/geometry, target/profile, capture/preview/action-set/plan, approval ID/digest, canary ID/digest, and request/session budgets/deadlines. Tokens remain frozen, nonserializable, process-local, one-use, expiry-bounded, and consumed before spawn.
3. The launcher writes a bounded hello using the capability nonce, validates hello correlation and executable identity through `ProtocolSession`, writes one exact close request, and requires its exact correlated successful response before a clean child exit. Unsolicited/early/duplicate/extra/partial output fails.
4. Evidence run objects expose no structural data. A private `WeakMap` brands handles, a private identity key serializes each canonical run, and every write inventories and revalidates parent/run identity and cumulative count/bytes while holding that lock. Clones, forgeries, stale replaced directories, and quota races reject.
5. C# operations remain dormant and unexported from any live CLI. Source initializes Per-Monitor-v2 DPI, enumerates visible non-minimized windows, binds PID/creation/image/class/title/window/geometry/DPI/monitor digests, revalidates identity, captures bounded BGRA client bytes with complete GDI handle cleanup and provenance, and dispatches only closed point or six-key-pair `SendInput` primitives after state, capture, plan, approval, deadline, budget, foreground, identity, geometry, and immediate canary checks. Errors are stable and terminal; no text, clipboard, shell, child, listener, service, network, registry, ADB, or ambient executable selection was added.

## Validator Finding Mapping

- **Immutable preview/action binding:** `protocol-session.mjs`; regression mutates semantic action, selector, and both expected states and requires `E_INPUT_BINDING` before dispatch.
- **Complete activation capability:** `run-capability.mjs`; regression removes every field in turn from the complete control binding and requires `E_CAPABILITY_BINDING`.
- **Launcher transcript lifecycle:** `launch-companion.mjs`; fake-only regressions cover valid hello/close plus unsolicited close, close before completion, duplicate/extra response, malformed/partial line, early clean exit, timeout, abort, child error/nonzero/signal, and bounds.
- **Evidence alias quota:** `evidence-vault.mjs`; concurrent genuine/clone/forged handles permit only the genuine reservation, over-quota writes fail, and stale same-path replacement fails identity.
- **Native operation absence:** the five C# runtime files now contain invoked implementations and static regressions require DPI, discovery/identity, client geometry, capture/provenance/cleanup, focus/geometry/canary/budgets, and `SendInput`; unconditional unsupported native paths are forbidden.
- **Documentation discrepancy:** preflight documentation now requires the exact absolute retained original/quarantine path.

## Output Contract

- Outputs: Exact changed-file inventory, five-finding rationale and regression map, boundary decisions, commands/results, limitations, and fresh-validator handoff.
- Evidence: 90-test full suite, 19-test focused suite, syntax checks, fake transcript attacks, capability matrix, evidence alias/stale/quota attacks, native static contract checks, no-live and pack scans, dependency tree, dry-run pack, and preparation CLI checks.
- Artifact links: `.memory/orchestrations/2026-08-21-nba2k27-bluestacks-preparation/roles/implementer/root-implementer-007-host-remediation.md`

## Handoff

- Next role: fresh independent `validator` in `validation` or `integration-check` mode.
- Fresh-validator commands: rerun every reproduction in `root-validator-006-host-revalidation.md`; run `node --test test/nba2k27-myplayer/*.test.mjs`, `npm run test:host`, `npm run check:host`, `npm run verify:no-live`, `npm run verify:pack`, `npm ls --all --json`, `npm pack --dry-run --json`, the config/valid-transcript/malformed-transcript CLI checks, and direct fake launcher and cloned/forged/stale vault attacks.
- Limitations: C# was not compiled or executed and no Windows/native process, host probe/change, capture/input, BlueStacks/app/account operation, network, listener, ADB, shell, credential, Git, publication, or harness source mutation occurred. The capture source uses documented GDI client capture rather than claiming untested WGC behavior. Native build correctness, API behavior, signer/ACL validation, WSL termination, and host compatibility require separately approved validation.
- Risks: Static source checks cannot prove Windows ABI/build correctness, capture behavior under composition/protection/occlusion, UIPI/focus behavior, or BlueStacks compatibility. Independent validator evidence remains mandatory.
