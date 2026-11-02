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

The fixed trace-wide `orchestrations/.direct-session-unresolved.json` marker blocks startup and admission even with opt-in off. Reload/unload cannot release it; existing Job recovery cannot release direct attempts. No durable recovery is provided in this tranche, and rollback-off is allowed only with a clear lease. A process restart, trace-root change or older package is not termination evidence.

The committed native API audit and offline fixtures do not establish live provider compatibility. Terminal text with `stop` is the initial supported completion. Native context allocation precedes local 256-message/1-MiB checks, there is no exclusive child lock, and native child transcripts may remain visible.
