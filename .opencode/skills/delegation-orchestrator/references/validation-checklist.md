# Four-Role Harness Validation Checklist

- [ ] Exactly four agent files exist: researcher, planner, implementer, validator.
- [ ] Every leaf denies Task delegation and `delegation-orchestrator`, accepts packet-only work, and requires an explicit allowed `taskMode`.
- [ ] `.opencode/schemas/orchestration-input.schema.json` is a closed normalized internal contract with an `x-intake` provenance entry for every top-level field.
- [ ] `/delegate-orchestration` is a thin `$ARGUMENTS` wrapper around the authoritative skill, accepts ordinary-language requests, and never requires users to author schema-shaped JSON.
- [ ] Only four direct role commands remain; each is fail-closed and points to the complete packet schemas.
- [ ] Contracts, task policy, trace schema, routing schema/fixtures/policy, launcher, manifests, and validators expose only the four active roles.
- [ ] Historical traces remain unchanged and cannot authorize new legacy-role dispatch.
- [ ] Research precedes dependent planning and independent validator evidence precedes acceptance.
- [ ] Local-model execution is serial unless explicit authorization or distinct-capacity evidence permits parallelism.
- [ ] New workflows default to unbounded agent/remediation budgets; requested bounded numeric budgets are enforced. Both modes preserve task deadlines, cancellation, scope and independent proof.
- [ ] IDs and coordination structure are generated, conservative scope/gates are derived, and privileged actions default to denied unless explicitly authorized.
- [ ] Validator modes cover `validation`, `review`, `artifact-proof`, and `integration-check`; validator never implements fixes.
- [ ] Blocking findings have command-backed evidence tied to the goal, an acceptance gate, or changed behavior; progress artifacts never independently block.
- [ ] Routing labels are preserved exactly when present and absent values are not invented.
- [ ] Live providers, user-global state, and Git mutations occur only with explicit matching authorization.
- [ ] Hooks remain guardrails/telemetry, not acceptance proof.
- [ ] Focused tests, portable/source validators, runtime tests, package dry-run, and `git diff --check` pass or have honest scoped skip rationale.

## V2 direct implementation opt-in

Use `--v2-direct-implementation` only with Linux V2 `run` or `source-tui`, after a full OpenCode restart. It supports fresh foreground `implementer/implementation` child sessions without explicit model overrides; the parent still delegates and independent validator gates remain required. Other calls retain the guarded native route. Verify status reports `directSessionTransport: implementation-v1`; readiness metadata must also prove `directSessionUnresolved: false` before client attachment. Default-off preserves native routing.

Offline acceptance checks the actual before/executor/original-output-schema/after ordering, permission before create, caller/session/event correlation, all outward result channels, callback settlement, scope and real artifact capture. A safe missing artifact or digest mismatch after verified native completion may fail locally. Fresh remediation uses a new call, task, child and prompt through existing controller budgets. Unsafe paths, symlinks, identity/scope drift, malformed results, cancellation, deadlines, event loss and uncertain work stop and retain the lease.

The fixed trace-wide `orchestrations/.direct-session-unresolved.json` marker blocks startup and admission even with opt-in off. Existing Job recovery cannot release direct attempts; the separate private direct path below requires its original live authority. Rollback-off is allowed only with a clear lease.

Only the same live plugin instance and exact bound parent may recover an owned direct attempt stopped by the original `deadline-expired` or `caller-cancelled` cause. All actual native operations, executor/before/after returned Promises, child callback pairs and command observations must settle; native error after must retain the exact wrapped stopped Error, while a correlated completed after retains rejection in every output channel. Resolve requires the acknowledged create, correlated child event and own promoted prompt, then a fresh bounded interrupt/wait/get/context observation. Status retains the original marker/spec identities and bytes, workspace/trace ancestry, owned version-1 lease, scope and at most 32 changed files for review. Release repeats the complete native observation, requires the same terminal context and exact reviewed tree hash, then synchronously removes only the owned lease and retires old identities. It never accepts stopped results or restores gates; use a new orchestration/spec, task, call, child and prompt, with independent validators. Missing after, event loss, unload/reload, an arbitrary version-1 marker, unowned lease and direct-off unresolved lease remain blocked. Generic faults cannot become cancellation or deadline proof. Restart, opt-out, trace-root changes, manual deletion and older packages never prove release. This is not durable recovery: same-UID replacement, post-read context allocation, no exclusive child lock or all-plugin callback fence, and post-unlink crash limits remain. Cleanup errors report the exact marker path and checked present/missing/unknown state; in-memory admission stays stopped even if unlink already succeeded.

The committed native API audit and offline fixtures do not establish live provider compatibility. Terminal text with `stop` is the initial supported completion. Native context allocation precedes local 256-message/1-MiB checks, there is no exclusive child lock, and native child transcripts may remain visible.
