# Bootstrap Contracts Artifact Proof

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `validator`
- artifactId: `implementation-validator-011-bootstrap-proof`
- createdAt: `2026-08-21`
- taskMode: `artifact-proof`
- delegationTaskId: `dt-validate-bootstrap-013`
- scopeKey: `standalone-bootstrap-contracts-proof`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- acceptance decision: **FAIL — `gate-bootstrap-contracts` is blocked**

## Input Contract

- Inputs received: Contract-complete fresh validator packet covering the standalone package, five JSON schemas, four domain modules, one contract test, and synthetic fixtures under `/tmp/opencode/nba2k27-myplayer`, plus the normative planner correction and explicit commands, criteria, risks, skipped-check policy, and acceptance standard.
- Required context present: Yes. The packet supplied every validator-required field; `dispatchKind` is `fresh` and selected `taskMode` is `artifact-proof`.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Independently parsed and inspected all scoped artifacts; ran Node syntax and contract tests; resolved all local schema references; checked object closure, package side-effect posture, and complete scoped inventory; exercised hard vectors and adversarial cases for context reuse, malformed static Synergy thresholds, tolerance duplicates/order, typed facts, units, and semantic request validation. No target file was modified.
- Files read: `package.json`; all files under `src/nba2k27-myplayer/schemas/`, `src/nba2k27-myplayer/domain/`, and `test/nba2k27-myplayer/`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-008-contract-correction.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`.
- Files changed: This validator trace artifact only.
- Commands: The assigned four `node --check` commands; `node --test test/nba2k27-myplayer/contracts.test.mjs`; dependency/script metadata inspection; recursive schema parse/reference and object-closure checks; scoped inventory/prohibited-component inspection; direct hard-vector checks; and direct adversarial Node probes recorded below.

## Pass/Fail Gate Matrix

| Gate | Result | Command-backed evidence |
| --- | --- | --- |
| Node 24, ESM, dependency-free, private package with inert scripts | PASS | Runtime was `v24.14.1`; package probe reported `type:"module"`, `private:true`, engine `>=24`, zero dependencies, and only `test`. |
| Domain module syntax | PASS | All four assigned `node --check` commands exited 0. |
| Existing contract suite | PASS | `node --test` reported 10 tests, 10 passed, 0 failed. |
| JSON parse, Draft 2020-12, local references | PASS | Independent walker parsed 5 schemas, resolved 249 references, and confirmed the Draft URI for all 5. |
| Object closure/meta-shape | PASS for declared object nodes | Independent walker returned `objectSchemasMissingAdditionalProperties:[]`. Closed evidence members and union wrappers are present. |
| False-before-unknown hard partition | PASS | Independent vectors mapped `[] -> feasible`, `[false,unknown] -> rejected`, `[false,true] -> rejected`, `[unknown,true] -> unknown`, and `[true,true] -> feasible`. |
| Exact deterministic diagnostics | PASS for supplied fixture | Existing test deep-equaled the two normative diagnostics, including messages and ordering. |
| Typed known/unknown progression facts and static Synergy shape | **FAIL** | The schema probe showed `provenanceClass`, `balance`, `disciplineLock`, `capacity`, `occupied`, and `activationThreshold` all reference generic `common#/$defs/fact`; its known `value` constraint is only `not null`. A malformed known threshold lacking `metricId`, `operator`, and `unit` evaluated as `true`, not `unknown`. |
| Context binding and semantic request validation | **FAIL** | A request with known resource evidence bound to `context-other` returned `[]`. A request with `schemaVersion:"wrong"`, an untyped progression value, and `wrong-context` evidence also returned `[]`. |
| Conditional discipline canonicalization and near-tie band contract | **FAIL** | Reversed `allowedDisciplines:["shooting","finishing"]` returned no diagnostic. Duplicate priority-1 tolerance entries returned no diagnostic. Both request and report tolerance arrays have no `uniqueItems`, and semantic coverage reduces priorities to sets. |
| Report candidate-set coherence | **FAIL** | Static report probe found zero `candidateCount` constraints and no cross-set disjoint/exhaustive constraint; only each individual set has `uniqueItems`. There is no report semantic validator in inventory. |
| Adversarial fixture/test proof | **FAIL** | Inventory contains only 2 fixtures. Test-content probe found no executable schema validator, derived-invalid case, duplicate-tolerance case, report-set case, or malformed-threshold case. The tests inspect schema shape but never validate either fixture against the schemas. |
| Prohibited implementation/activation surface | PASS | Recursive inventory listed exactly 14 scoped files and no optimizer/oracle/report implementation, adapter, credential, Git, harness, live command, or publication component. Schema vocabulary such as `oracleMode` and `OptimizationReport` is contractual data only. |

## Blocking Findings

### B1 — generic `Fact` references erase required resource and threshold types

The accepted correction requires exact known values such as provenance enums, quantities, discipline locks, and the complete `observed-threshold` object. The request schema instead points every affected property to the same generic fact whose known value admits any non-null JSON value. Consequently downstream implementations cannot rely on schema validation for the agreed types and would have to invent checks. This directly blocks the typed-resource and static-Synergy acceptance criteria.

Evidence:

```text
refs: provenanceClass/balance/disciplineLock/capacity/occupied/activationThreshold
      -> common.schema.json#/$defs/fact
knownValueSchema: {"not":{"type":"null"}}
malformed activationThreshold result:
{"state":"true","evidenceRefs":["e"],"missingFieldIds":[]}
```

### B2 — context mismatches and unit mismatches are accepted by minimal APIs

`validateDesiredBuildRequest` does not traverse known/unknown facts to enforce their `contextRef` against the request context, and does not enforce the exact game-version policy. The direct mismatched-evidence request returned no diagnostic. Separately, `evaluateRequirement` ignores `expression.unit`; a known numeric fact with an unrepresented incompatible unit returned `true`. These behaviors defeat deterministic context reuse and typed tri-state evaluation.

Evidence:

```text
context-other resource request diagnostics: []
wrong schemaVersion + untyped value + wrong-context diagnostics: []
unit probe: {"factUnit":"centimeter (not represented)","requirementUnit":"inch","result":{"state":"true",...}}
```

### B3 — near-tie and report set invariants are not enforceable from the supplied contracts

The planner requires exactly one tolerance per declared priority, no undeclared priority, ascending serialization, and exhaustive/disjoint hard-set membership. The request validator accepts duplicate tolerance priorities and non-canonical discipline order. The schemas do not encode tolerance uniqueness/order, while the report schema neither relates `candidateCount` to its sets nor prevents one candidate ID from appearing in multiple hard sets. No report validator exists in scope. Downstream optimizer/report implementers therefore lack a deterministic shared acceptance boundary.

Evidence:

```text
duplicate priority tolerance diagnostics: []
reversed allowedDisciplines diagnostics: []
requestToleranceUnique: null
reportToleranceUnique: null
candidateCountConstraints: 0
```

### B4 — fixtures and tests do not adversarially prove the schema contracts

The two fixtures exercise only a sparse valid request and two semantic over-allocation diagnostics. The suite does not invoke a JSON Schema validator at all. It therefore cannot demonstrate rejection of derived/non-derived leakage, invalid known values, legacy tie fields, conditional schema branches, duplicate/extra tolerances, report overlap, malformed thresholds, or context reuse. Passing 10 tests is not reproducible proof of the requested contract boundary.

## Schema Results

- PASS: all five JSON files parse and declare Draft 2020-12.
- PASS: all 249 local/internal `$ref` targets resolve.
- PASS: every node explicitly declaring `type:"object"` supplies `additionalProperties` (false or an intentional schema-valued map).
- PASS: non-derived and derived evidence members are closed and derived-only fields are declared only on the derived member.
- FAIL: exact `Fact<T>` value types are not encoded for the progression-resource and threshold contracts.
- FAIL: tolerance uniqueness/order/coverage and report set disjointness/exhaustiveness are not fully represented or semantically checked.
- Limitation: no external JSON Schema implementation was installed because the package is intentionally dependency-free and the packet forbids external installation. This does not excuse the failures: direct schema inspection and API probes reproduce them without external tooling.

## Security and Activation Findings

- PASS: no dependency, lifecycle script, publish script, network call, process execution, credential access, Git mutation, harness mutation, or live-operation entry point exists.
- PASS: `private:true` and the sole inert `test` script avoid publication/live side effects.
- PASS: no optimizer, oracle implementation, UI/network adapter, report renderer, CLI, or activation path exists in the scoped inventory.
- No real activation, provider, auth, network, package install, publication, or live game operation was attempted or required.

## Command Outputs

1. `node --check` for all four domain modules: exit 0, no output.
2. `node --test test/nba2k27-myplayer/contracts.test.mjs`: 10 pass, 0 fail, duration approximately 71 ms.
3. Package probe: Node `v24.14.1`; zero dependency keys; only `test` script.
4. Schema walker: `{"schemas":5,"refs":249,"status":"all local references resolve and drafts match"}`.
5. Closure walker: `{"objectSchemasMissingAdditionalProperties":[]}`.
6. Inventory probe: 14 files, `prohibited:[]`.
7. Hard-vector probe: every required vector matched false-before-unknown precedence.
8. Malformed threshold probe: exited 1 because actual state was `true`, where the gate requires structurally invalid known threshold not to establish threshold-known.
9. Context mismatch probe: exited 1 with `[]` diagnostics.
10. Duplicate tolerance probe: exited 1 with `[]` diagnostics.
11. Typed-fact probe: exited 1 after exposing six generic fact references and the non-null-only value schema.
12. Canonical discipline-order probe: exited 1 with `[]` diagnostics.
13. Report coherence probe: exited 1 with missing tolerance uniqueness and zero candidate-count constraints.
14. Schema/semantic boundary probe: exited 1 because wrong schema version, untyped progression value, and wrong context produced `[]`.
15. Requirement-unit probe: exited 1 because an incompatible/unrepresented unit produced `true`.
16. Test-coverage probe: exited 1; only 2 fixtures and no executable schema validation or required adversarial categories.
17. One initial reference-walker command had a JavaScript syntax error and was superseded by the corrected successful walker in item 4; it provides no acceptance evidence.

## Remediation List

1. Encode closed typed known-value definitions (or equivalent typed fact wrappers) for every contracted progression/resource field and for the full activation-threshold object; apply them consistently in request and observation schemas.
2. Make `activation-threshold-known` return true only for the complete structurally valid threshold shape.
3. Add deterministic semantic validation for every evidence/unknown `contextRef`, exact request game-version binding, and any field-unit comparison required by requirement evaluation.
4. Enforce canonical `allowedDisciplines` order and exact tolerance priority coverage, including duplicate, extra, missing, and non-ascending entries.
5. Add a report semantic boundary that proves each evaluated candidate has exactly one hard-set membership, sets are disjoint/exhaustive relative to `candidateCount`, and only feasible candidates appear in Pareto/near-tie/finalist/winner structures.
6. Add valid and invalid fixtures plus executable assertions for all corrected evidence variants, conditional fields, malformed/static Synergy facts, legacy tie fields, tolerance boundaries, context mismatch, typed values, report overlap, and diagnostic closure/order. The tests must actually validate fixtures against the JSON schemas, using an approved dependency-free mechanism or an explicitly approved test-only validator strategy.
7. Re-run this gate independently after remediation; existing passing tests alone are insufficient.

## Skipped Checks and Residual Risk

- Skipped as out of scope: network, external package installation, live application/game access, provider/auth checks, publication, Git operations, optimizer execution, report rendering, and UI/network activation.
- No accepted warnings were supplied.
- Residual risk after this failed gate remains high for downstream parallel implementation because multiple exact invariants currently exist only in planner prose, not in enforceable schemas/APIs/tests.

## Output Contract

- Outputs: FAIL matrix, four command-backed blocking findings, schema results, security/activation findings, command evidence, remediation list, skipped checks, and downstream handoff.
- Evidence: Independent exit-0 checks establish syntax, package posture, schema parse/reference/closure, hard precedence, diagnostics, and inventory. Independent exit-1 adversarial probes reproduce contract acceptance defects in typed values, threshold structure, context binding, tolerance uniqueness/order, report coherence, units, and test coverage.
- Artifact links: This artifact; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-008-contract-correction.md`.
- passFailMatrixOrFindings: Pass/Fail Gate Matrix and Blocking Findings above.
- commandOutputs: Command Outputs above.
- schemaResults: Schema Results above.
- securityAndActivationFindings: Security and Activation Findings above.
- remediationList: Remediation List above.
- artifactProof: The scoped generated output is reproducible from the listed commands, including negative probes that intentionally exit 1 on observed contract violations.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/implementation-validator-011-bootstrap-proof.md`.

## Handoff

- Next role: Parent orchestrator for a fresh, bounded remediation decision; any remediation must use a fresh child task and remain within its declared loop budget.
- Limitations: No target implementation was changed. Full standards-compliant instance validation was unavailable without adding a package, so schema execution coverage itself remains a required remediation item. Hooks/progress artifacts were not treated as acceptance evidence.
- Risks: Downstream implementers would currently have to invent typed fact validation, context/unit policy, tolerance normalization, and report partition checks. `gate-bootstrap-contracts` must remain closed until independent revalidation passes.
