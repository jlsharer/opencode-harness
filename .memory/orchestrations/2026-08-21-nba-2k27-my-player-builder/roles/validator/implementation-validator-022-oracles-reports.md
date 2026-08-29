# Validator Trace Artifact: Oracles and Reports

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-022-oracles-reports`
- createdAt: `2026-08-21`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- taskMode: `validation`

## Input Contract

- Inputs received: Contract-complete fresh validator packet `dt-validate-oracles-reports-024`, including changed paths, six verification criteria, required commands/probes, schema contracts, risks, skipped-check policy, and acceptance standard.
- Required context present: Yes. Validation workspace was `/tmp/opencode/nba2k27-myplayer`; runtime/trace environment variables were absent, so project-relative trace rules apply.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Independently checked syntax and tests, inspected all scoped implementation imports and schema/semantic validators, verified dependency inventory, and ran adversarial replay binding, cross-context supersession, provenance injection, invalid-winner, and deterministic rendering probes.
- Files read: Scoped oracle, normalization, report, test, replay fixture, both supplied schemas, both supplied validators, provenance implementation, package manifest, role contract, trace schema, and memory protocol/template.
- Files changed: This trace artifact only; no implementation files were modified.
- Commands/checks:
  - `node --check` on all six assigned oracle/capture/report modules: exit 0, no output.
  - `node --test test/nba2k27-myplayer/oracles-reports.test.mjs`: exit 0; 5 tests passed, 0 failed/skipped.
  - `npm ls --all --json`: exit 0; root package only, no external dependencies.
  - Scoped import/authority inventory: only local modules, JSON schemas, and `node:crypto` through provenance; no filesystem, process, credential, host, network, optimizer, or UI imports in the scoped execution graph.
  - Adversarial replay probe: exit 0 and printed `REPLAY_BINDING_BYPASS reproduced: eu 1`.
  - Adversarial supersession probe: exit 0 and printed `CROSS_CONTEXT_SUPERSESSION reproduced: context-a active count = 0`.
  - Adversarial known-fact provenance probe: exit 0 and printed `PROVENANCE_INJECTION reproduced: evidence-unrelated source hash sha256-6457973f...`.
  - Adversarial report probe: exit 0 and printed `INVALID_WINNER_SEMANTICS accepted and manufactured claim reproduced`; JSON and Markdown byte determinism also held across clone/JSON round-trip.
  - `git status`/`git diff` could not run because the supplied validation workspace is not a Git repository; this was not used as acceptance evidence.

## Output Contract

- Outputs: `FAIL` — do not pass `gate-oracles-reports`.
- Evidence: Four command-backed blocking defects violate replay binding, context-bound immutable correction, evidence provenance, and non-manufactured report conclusions. Positive syntax/tests do not override these acceptance failures.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-022-oracles-reports.md`

### Pass/Fail Matrix

| Acceptance criterion | Result | Command-backed evidence |
| --- | --- | --- |
| Oracle capabilities expose replay/manual only with no live/host/network authority | PASS | `ORACLE_MODES` is exactly replay/manual-capture; capability assertions require all authority flags false; scoped import inventory found no prohibited authority. |
| Replay binds complete candidate/context/version hashes, preserves ordered replicates, rejects mismatch, and is deterministic | FAIL | Positive test preserved order and rejected query mismatch, but the independent mutated-fixture probe was accepted and returned a replicate whose candidate value and context differed from the indexed candidate/fixture context: `REPLAY_BINDING_BYPASS reproduced: eu 1`. |
| Manual worksheets/imports are deterministic, evidence-hashed, context-bound, and corrected only by supersession | FAIL | Positive test proved deterministic worksheet and nonmutation of the original record. Independent probe allowed a context-B record to supersede context-A and globally hid context-A: `context-a active count = 0`. A second probe accepted forged known-fact evidence refs unrelated to the source artifact hash. |
| Normalization emits schema-valid known/unknown provenance, preserves raw refs, and invents no values/formulas | FAIL | Ambiguous critical values became unknown in the positive test, but a supplied `status: known` fact was cloned with `evidence-unrelated`; schema assertion accepted it despite the current source artifact hash being different. Provenance is therefore not reliably bound to raw evidence. |
| JSON reports pass schema and semantic partition validation; Markdown comes from JSON and exposes adverse data without manufacturing winners | FAIL | Overlap rejection and near-tie rendering passed the assigned tests. Independent probe built a schema-valid report with `decision: winner`, two Pareto candidates, tied scores, `scoreNearTie: true`, `finalistConfirmed: false`, and zero confidence. `validateReport` accepted it, then Markdown manufactured “confirmed, confidence-dominant sole leader.” |
| No ambient mutation/credential/host/network/optimizer/UI/external dependency/nondeterministic timestamp behavior | PASS | Static import scan plus `npm ls --all --json` found no such dependencies or authority in scope. Syntax/tests and repeated JSON/Markdown renders were byte-deterministic; no clock/random calls occur in scoped modules. No live/network check was run because those actions are prohibited, not required evidence. |

### Schema Results

- `BuildObservation`: baseline replay observations and ordinary manual observations validate. **Fail at provenance semantics**: structural schema validation permits a known fact whose evidence refs do not correspond to `sourceArtifactHashes`, and normalization preserves that injected provenance.
- `OptimizationReport`: structural validation and current hard-set overlap/count/Pareto membership checks operate. **Fail at decision semantics**: winner validity does not require a sole leader, non-near-tie status, finalist confirmation, or confidence dominance, although Markdown asserts all four.
- Hard-set overlap rejection: PASS in assigned test (`E_REPORT_HARD_SET_OVERLAP`).
- Ambiguous body/feasibility normalization: PASS in assigned test (both become `unknown`; no formula emitted).

### Security and Activation Findings

- Offline/ambient authority: PASS for scoped implementation. No process spawning, filesystem access, credentials, network, UI, optimizer, wall clock, or random source is imported or invoked.
- Dependencies: PASS; package declares none and `npm ls` reports only the root package.
- Activation: No activation was performed or needed. Live/network activation is prohibited by the packet.
- Security-impacting integrity findings: replay fixture payloads are not cross-bound to the fixture candidate/context; manual supersession is not constrained to the same candidate/context/version; known-fact evidence may be injected independently of hashed capture evidence.

### Remediation List

1. Bind every replay replicate to the indexed candidate and fixture context/version during fixture construction; reject any candidate value/hash, context hash, version hash, or oracle mode mismatch before storing the fixture.
2. Permit manual supersession only when the target record exists in the same candidate, context, and version binding (and define/enforce duplicate-ID and supersession-chain rules). Compute active supersession per binding rather than from a global observation-ID set.
3. For manual raw imports, construct known/unknown provenance from the current evidence identity or explicitly verify supplied fact evidence refs against current source artifact hashes; reject injected unrelated provenance.
4. Extend report semantics so `winner` is accepted only when the selected candidate is confirmed, not near-tied, uniquely leading under declared tolerances, and satisfies the claimed confidence rule. Render only conclusions established by validated JSON fields; otherwise render a non-winner decision.
5. Add regression tests for all four reproduced failures.

### Skipped Checks and Residual Risk

- Required offline checks skipped: none.
- Prohibited live/network checks: intentionally not run.
- Workspace Git diff/status: unavailable because `/tmp/opencode/nba2k27-myplayer` has no `.git`; changed-file provenance could not be independently reconstructed.
- Residual risk after current failure: fixture/manual provenance can misattribute evidence and report output can overstate an unsupported winner.

## Handoff

- Next role: Parent orchestration for fresh implementer remediation, followed by a fresh independent validator task.
- Limitations: Validation was bounded to the supplied changed files, contracts, fixtures, and requested offline behavior. No implementation fixes were made and no live activation was attempted.
- Risks: Acceptance remains blocked by replay payload binding, cross-context supersession, forged evidence provenance, and manufactured winner semantics.
