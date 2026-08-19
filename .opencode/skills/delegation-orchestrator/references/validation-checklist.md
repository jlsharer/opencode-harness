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
- [ ] Default remediation is one cycle per work unit and declared loop/agent budgets are enforced.
- [ ] IDs and coordination structure are generated, conservative scope/gates are derived, and privileged actions default to denied unless explicitly authorized.
- [ ] Validator modes cover `validation`, `review`, `artifact-proof`, and `integration-check`; validator never implements fixes.
- [ ] Blocking findings have command-backed evidence tied to the goal, an acceptance gate, or changed behavior; progress artifacts never independently block.
- [ ] Routing labels are preserved exactly when present and absent values are not invented.
- [ ] Live providers, user-global state, and Git mutations occur only with explicit matching authorization.
- [ ] Hooks remain guardrails/telemetry, not acceptance proof.
- [ ] Focused tests, portable/source validators, runtime tests, package dry-run, and `git diff --check` pass or have honest scoped skip rationale.
