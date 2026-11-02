# Direct Session Retry Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this bounded plan. The owner has already authorized the spike and its necessary validation on the current branch; this document introduces no new approval gate.

**Goal:** Test whether a wrapper using native public session primitives can validate its own child result, safely retain uncertain attempts, and retry a rejected proof with a fresh child without a SubagentJob or synthetic parent notification.

**Architecture:** One source-only adapter owns an attempt ledger and calls an injected, public-shaped native session interface. Deterministic offline fixtures exercise the adapter against the real harness controller, role contracts, workspace snapshots, and acceptance proof functions. A separate pinned-source contract check verifies the native assumptions; no production plugin imports or registers the prototype.

**Tech Stack:** Node 24, TypeScript `.mts`, built-in `node:test`, existing repository validation modules; no dependency installation.

**Spec:** Owner-authorized direct-session wrapper spike; this plan records its bounded acceptance. Native reference: `/home/joshl/.cache/opencode-harness/v2-native-api-src`, commit `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824` (read-only).

## Global Constraints

- Preserve exactly `researcher`, `planner`, `implementer`, and `validator`; this is outside current managed-guard acceptance.
- No native activation, provider/auth/config/global-install/network changes, core patches, production guard changes, or runtime/package projection.
- Use trusted tool context `sessionID`, `agent`, `messageID`, `id`, and `signal`; caller JSON cannot substitute any of them.
- No Job API, SubagentJob path, invented session `messages`/`resume` method, or synthetic notification. Raw child transcripts may remain visible in native UI.
- Cancellation/timeout never proves native termination. Pending create/prompt, unknown child identity, plugin unload, interrupted process, or uncertain idle keeps the reservation stopped; recovery/restart is deferred and cannot blindly release it.
- Every failed attempt rechecks the actual workspace. Any scope violation stops further retries. Proof rejection permits a fresh retry only after native idle, pending operations settled, and scope safety proved.

## Review Focus

1. A late create/prompt after cancellation must remain correlated and must not release capacity early.
2. Earlier successful assistant text cannot override a failed/interrupted final idle marker or failed final assistant.
3. Concurrent steer/user prompts, cross-parent identities, stale IDs, duplicate completions, and unrelated attempts cannot borrow authorization.
4. A finalizer's last write must precede the accepted wait/idle observation and workspace proof.
5. Public `context({sessionID})` has no native pagination/limit argument: post-read count/byte bounds are local checks, not a bounded native read. Document this capability gap.

## Files and Placement

- Create `.opencode/scripts/direct-session-retry-prototype.mts`: standalone adapter, minimal public-shaped types, explicit limits, optional exported tool-registration demonstration only if it adds evidence.
- Create `.opencode/scripts/direct-session-retry-prototype.test.mts`: deterministic adversarial fixture, real validation calls, pinned native contract audit.
- Modify `.opencode/harness.manifest.json`: both files as `source-only-evaluation`.
- Modify `.opencode/scripts/validate-harness.mts`: both exact paths in `STATIC_MANIFEST_PATHS`; its closed `.opencode` inventory otherwise rejects new files.
- Modify `package.json`: standalone `test:prototype` script only. Preserve `files`, runtime/portable/global manifests, auto-loaded plugin entries, and generated artifacts.

`.opencode/scripts/*.mts` already receives compiler, formatter, lint, and source-policy checks. A docs prototype folder would need additional policy/compiler inputs, so use the existing source-only script convention.

### Task 1: Public-shaped adapter and adversarial lifecycle suite

**Interfaces:** Export a minimal `DirectSessionApi` containing only `create`, `prompt`, `wait`, `get`, `context`, and `interrupt`, a trusted tool-context type, and a wrapper factory/run entrypoint. Name remaining options locally; inputs must include validated workflow/task context, proof inputs, fixed timeout/reconciliation limits, and injected clock/scheduler for deterministic tests. Returns contain only wrapper-produced acceptance/rejection status and bounded diagnostics; reject unvalidated child output/content/metadata at every parent-facing result channel.

- [ ] Write failing tests for success and proof-reject then fresh retry. Require distinct child session and delegation task IDs, trusted parent/call correlation, real `validateTaskPacket`/`validateTaskResult`, real controller reservation/completion, and `captureWorkspace`/`assertAllowedTransition`/`verifyAcceptance` where applicable.
- [ ] Add tests for duplicate/stale/cross-identity results, failed native outcome despite earlier success, malformed/missing final assistant, any out-of-scope change, unrelated attempt isolation, concurrent steering denial, pending launch cancellation, prompt acknowledgment after interrupt, timeout, and finalizer-last-write before wait. Assertions must check reservation state and rejected parent-facing content/metadata, not only promise rejection.
- [ ] Implement exact public calls from `packages/client/src/effect/api/api.ts` and the promise plugin adapter: `create` returns `Session.Info`; `prompt` accepts `{sessionID,id?,text,metadata?,delivery?,resume?}` and returns `SessionInbox.User`; `wait({sessionID})` returns `void`; `get` returns `Session.Info`; `context` returns `ReadonlyArray<SessionMessage.Info>`; `interrupt` returns `{interrupted:boolean}`. Use fresh explicit prompt ID and one own prompt per fresh child; no fabricated acknowledgment shape.
- [ ] From native context select the final assistant in the exact own-prompt turn, then require final idle outcome `succeeded`, no assistant error, completed terminal assistant, matching role/agent, and no unexpected prompt/steer. Assistant text is in `content` entries with `type: "text"`; `Info` has no invented `parts` field. Reject ambiguity rather than searching backwards for a passing envelope.
- [ ] Await prompt settlement and native wait/finalizer completion before idle/proof/retry. An early interrupt or idle observation while prompt is still pending is insufficient. Bound reconciliation; retain uncertain stopped reservations. Retry only an ordinary proof rejection with safe workspace and proven settled idle; cancellation/timeout/failed native outcome do not become success.
- [ ] Run `node --test .opencode/scripts/direct-session-retry-prototype.test.mts`; the suite must pass without native startup, network, or native dependencies.

### Task 2: Native source audit and source-only acceptance

- [ ] Add an explicit optional pinned-source audit mode/path. Verify exact reference commit and public session signatures, promise adapter forwarding, trusted tool fields, assistant/idle schema, and native wait finalizer ordering from source. Default offline tests use committed public-shaped fixtures and do not require the cache. If source is missing, report audit unavailable rather than treating fixtures as source proof.
- [ ] Record native guarantees separately from fixture assumptions. Report remaining gaps: unbounded native context read, raw transcript visibility, no live provider run, no persistence/restart/unload proof, and no equivalence to the currently active managed guard. Unknown or concurrent activity is denied.
- [ ] Update only the source inventory and standalone test script described above. Check the production plugin import closure does not reference the prototype.
- [ ] Run the new suite, `npm run typecheck`, `npm run check:format`, `npm run check:source-policy`, `npm run check:generated`, and `node .opencode/scripts/validate-harness.mts`.
- [ ] Run `npm pack --dry-run --json` and assert both prototype paths are excluded. Existing source validation may invoke package/portable checks itself. Full runtime/global suites are required only if scope expands into their production code; do not expand scope merely to run this spike.

## Handoff and Result

The implementer owns the two prototype files and the three exact inventory/script edits. Independent validation must report what fixtures prove, what pinned native source proves, and what remains unproved. A passing spike supports a later production design decision only; it does not activate direct-session delegation or authorize use through the current managed guard.
