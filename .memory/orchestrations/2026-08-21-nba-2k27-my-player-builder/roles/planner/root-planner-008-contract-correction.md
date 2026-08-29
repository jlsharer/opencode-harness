# NBA 2K27 Agentic Workflow Contract Correction

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `planner`
- artifactId: `root-planner-008-contract-correction`
- createdAt: `2026-08-21`
- taskMode: `plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh packet `dt-remediate-plan-010` for scope `nba-2k27-agentic-workflow-contract-correction`, limited to the five blocking contract categories in `root-validator-007-plan-recheck`, with the combined planner chain, exact deliverable, decisions, assumptions, dependencies, and acceptance criteria.
- Required context present: Yes. `dispatchKind` is `fresh`; selected `taskMode` is `plan`; this is the user-authorized final planning remediation cycle, 2 of 2. Implementation and architecture expansion are prohibited.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Read the two prior planner artifacts and final failed recheck plus the planner contract, trace schema, memory protocol, and trace template. Issued only the minimum normative corrections needed for closed evidence/resource shapes, static Synergy predicates, exact diagnostics, disjoint hard-result precedence, and vector near ties.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `root-planner-003-agentic-workflow.md`; `root-planner-006-plan-remediation.md`; `root-validator-007-plan-recheck.md` at their supplied orchestration paths.
- Files changed: This assigned correction trace only.
- Commands/checks: No shell, Git, product, test, network, ADB, emulator, app, configuration, package, manifest, or implementation command was run. This is a plan-only contract correction.

## Output Contract

- Outputs: Ordered normative corrections; exact supersession and retained decisions; affected future file contracts; dependencies; focused executable verification gates; assumptions; tradeoffs; and handoff notes.
- Evidence: Each correction maps directly to a blocking finding in `root-validator-007-plan-recheck` and otherwise preserves the architecture, safety posture, staging, file placement blocker, and accepted F1/F2 decisions in the prior planner chain.
- Artifact links: This artifact; `root-planner-003-agentic-workflow.md`; `root-planner-006-plan-remediation.md`; `root-validator-007-plan-recheck.md`.

## Normative Scope and Supersession

This correction is normative only for the clauses expressly replaced below. On conflict, it supersedes both prior planner artifacts. It does not authorize implementation.

1. In `root-planner-006-plan-remediation.md`, replace the `EvidenceBinding` sentence at line 55 and the affected `KnownValue<T>` dependency at line 56 with Correction 1 below.
2. Replace the exact `BadgeTokenBalanceFact` and `SlotPoolFact` shapes and their conditional prose at lines 87 and 89 with Correction 2.
3. Replace `SynergyPairFact.activation` and every `synergy-pair-availability require:active` clause at lines 91, 106, 136, and assertion 288 with Correction 3. No current gameplay activation state is introduced.
4. Replace the normative diagnostic shape at line 129 and the claimed exact output at lines 182–189 with Correction 4.
5. Replace hard-set membership and every dependent disposition/report/stop clause at lines 218–232 and assertions 294–299 with Correction 5.
6. Supersede in full the original plan's scalar request fields `nearTieAbsolute` and `nearTieRelative` at lines 148 and 210, its normalized-aggregate near-tie test and confidence-interval-overlap alternative at line 210, and the addendum's incomplete tie clauses at lines 195–203 and assertions 292–293/299. Correction 6 is the sole near-tie contract.
7. Retain all other decisions from both planner artifacts, including black-box evidence, no hidden formulas, priority direction, within-band weighting, Pareto preservation, split unknown policies, safety/approval boundaries, repository placement blocker, work-unit order, and conditional future paths.

## Ordered Corrective Decisions

### Correction 1 — closed discriminated evidence union

Define `FieldId` as a stable canonical field identifier matching the existing `CanonicalId` syntax. `EvidenceBinding` is exactly this two-member discriminated union; both variants are closed and admit no other property:

```text
NonDerivedEvidenceBinding {
  source: "screen"|"hierarchy"|"ocr"|"manual"|"public-source"|"user-declared";
  evidenceRefs: CanonicalId[1..];
  confidence: finite number in [0,1];
  disputed: boolean;
  contextRef: CanonicalId;
}
DerivedEvidenceBinding {
  source: "derived";
  evidenceRefs: CanonicalId[1..];
  confidence: finite number in [0,1];
  disputed: boolean;
  contextRef: CanonicalId;
  inputFieldIds: unique FieldId[1..];
  algorithmVersion: nonempty string;
}
EvidenceBinding = NonDerivedEvidenceBinding | DerivedEvidenceBinding
```

`inputFieldIds` and `algorithmVersion` are required only in the `source:"derived"` variant and are forbidden in every non-derived variant. `KnownValue<T>` remains exact `{status:"known",value:T,evidence:EvidenceBinding}`.

### Correction 2 — declared conditional discipline fields

Replace the two fact shapes with these closed shapes. The `allowedDisciplines` property is now admitted explicitly and is a unique, canonical-order array when present.

```text
BadgeTokenBalanceFact {
  kind: "badge-token-balance";
  discipline: DisciplineId;
  provenanceClass: Fact<"default"|"event-locked"|"bonus-flexible"|"other">;
  allowedDisciplines?: unique DisciplineId[1..];
  balance: Fact<{unit:"badge-token",value:integer>=0}>;
}
SlotPoolFact {
  kind: "slot-pool";
  slotPoolId: CanonicalId;
  disciplineLock: Fact<DisciplineId|"flexible">;
  allowedDisciplines?: unique DisciplineId[1..];
  source: Fact<"default"|"bonus"|"event"|"other">;
  capacity: Fact<{unit:"slot",value:integer>=0}>;
  occupied: Fact<{unit:"slot",value:integer>=0}>;
  expiry: ExpiryFact;
}
```

For `BadgeTokenBalanceFact`, `allowedDisciplines` is required iff `provenanceClass` is known `bonus-flexible`; it is forbidden when provenance is known `default`, `event-locked`, or `other`, or is unknown. The `discipline` is the observed accounting discipline and does not itself grant cross-discipline spend.

For `SlotPoolFact`, `allowedDisciplines` is required iff `disciplineLock` is known `flexible`; it is forbidden when the lock is a known `DisciplineId` or is unknown. A known discipline lock permits only that discipline. An unknown provenance/lock never acquires flexibility from another field.

### Correction 3 — static Synergy threshold semantics

The exact `SynergyPairFact` field formerly named `activation` is renamed `activationThreshold` with the same declared type:

```text
activationThreshold: Fact<{
  kind:"observed-threshold";
  metricId:CanonicalId;
  operator:"gte"|"gt"|"eq"|"lte"|"lt";
  value:finite number;
  unit:CanonicalId;
}>
```

The closed `synergy-pair-availability` predicate is now exactly `{id,kind:"synergy-pair-availability",pairId,require:"available"|"legal"|"activation-threshold-known"}`. Delete `require:"active"` everywhere.

- `available` evaluates the evidence-bound availability fact.
- `legal` evaluates the evidence-bound legality fact.
- `activation-threshold-known` is `true` only for a known, structurally valid `activationThreshold`; an unknown threshold yields `unknown`.

No predicate evaluates whether a threshold is currently met, and no current-state metric is inferred. Expiry and placement remain separate predicates. Reports say “activation threshold known/unknown,” never “active,” unless separately observed gameplay scope is approved by a later plan.

### Correction 4 — one exact diagnostic contract and fixture

`Diagnostic` is the closed exact shape `{code,path,message,relatedPaths,minimalContradictorySet}`; every field is required. `message` is deterministic ASCII text produced from normalized values and units, not source/UI free text. The invalid substituted request in the addendum must return exactly:

```json
[
  {
    "code":"E_CAP_BREAKER_OVERALLOCATED",
    "path":"/userState/capBreakers/0/allocations",
    "message":"Known Cap Breaker allocations (3 cap-breakers) exceed known balance (2 cap-breakers).",
    "relatedPaths":["/userState/capBreakers/0/balance"],
    "minimalContradictorySet":["/userState/capBreakers/0/balance","/userState/capBreakers/0/allocations"]
  },
  {
    "code":"E_SLOT_OCCUPANCY_EXCEEDS_CAPACITY",
    "path":"/userState/slotPools/0/occupied",
    "message":"Known occupied slots (3 slots) exceed known capacity (2 slots).",
    "relatedPaths":["/userState/slotPools/0/capacity"],
    "minimalContradictorySet":["/userState/slotPools/0/capacity","/userState/slotPools/0/occupied"]
  }
]
```

Ordering remains code then path; array and pointer order shown above is normative.

### Correction 5 — exhaustive, disjoint hard-result precedence

Evaluate every compiled hard predicate for candidate `c` to a finite vector `H(c)` whose members are `true|false|unknown`, then classify once in this precedence order:

1. If any member is `false`, `c` belongs only to `hardRejectedSet`.
2. Else if any member is `unknown`, `c` belongs only to `hardUnknownSet`.
3. Else all members are `true`, and `c` belongs only to `hardFeasibleSet`.

The empty vector is vacuously all true and therefore feasible. For every admitted vector, the three cases are exhaustive because either a false exists, or no false exists and an unknown exists, or neither exists and every member is true (including the empty vector). They are disjoint because each later case explicitly negates all earlier cases. Thus `[false,unknown]` is rejected, not unknown.

Only `hardUnknownSet` invokes `hardUnknownDisposition`; false-plus-unknown evidence gaps may still be reported but cannot alter rejected membership. Score, Pareto, near-tie, finalist, and winner logic consume only `hardFeasibleSet`.

- `no-feasible`: at least one candidate was evaluated, `hardFeasibleSet` and `hardUnknownSet` are empty, and `hardRejectedSet` is nonempty.
- `insufficient-evidence`: no conclusive permitted result exists because `hardUnknownSet` is material under the selected disposition, observation is unavailable/declined/unsafe/exhausted, or no candidate was evaluable.
- `reject-candidate` continues after excluding hard-unknown candidates; if no feasible candidate remains, choose `insufficient-evidence` when `hardUnknownSet` is nonempty, otherwise `no-feasible` under the rule above.
- `pause-for-observation` and terminal `insufficient-evidence` apply only to hard-unknown candidates. Reclassification after evidence restarts the precedence rule from step 1.
- A stop/report lists exactly one hard-set membership per candidate and derives decision eligibility from these same rules. Budget, cancellation, and safety stops cannot relabel membership.

### Correction 6 — unrounded vector near ties with per-band tolerances

Delete scalar `optimization.nearTieAbsolute` and `optimization.nearTieRelative`. The closed replacement field is required:

```text
nearTieTolerances: Array<{
  priority: integer >= 1;
  absoluteTolerance: finite number in [0,1];
  relativeTolerance: finite number in [0,1];
  relativeScaleFloor: finite number in (0,1];
}>
```

There must be exactly one tolerance entry for every request priority band and no entry for an undeclared band. Entries are unique and serialized in ascending priority order. All candidates in one request use that same band set.

For confirmed hard-feasible Pareto candidate `c`, let `V(c)` be its unrounded `bandScore` vector in ascending priority order. Let `B` be every Pareto candidate with the lexicographically maximal exact vector; content-hash display ordering does not reduce `B`. Candidate `c` is a score near tie iff there exists `b` in `B` such that, for every band `p`:

```text
delta(c,b,p) = abs(V(c)[p] - V(b)[p])
scale(c,b,p) = max(abs(V(c)[p]), abs(V(b)[p]), relativeScaleFloor[p])
delta(c,b,p) <= absoluteTolerance[p]
delta(c,b,p) / scale(c,b,p) <= relativeTolerance[p]
```

Both inequalities must hold in every band. The positive floor makes the relative denominator nonzero when both scores are zero. A zero relative tolerance permits only zero delta in that band; a zero absolute tolerance does the same. Exact vector ties always qualify. Classification precedes display rounding.

Confidence is separate from `V` and never changes band values, tolerance math, Pareto membership, or score-near-tie membership. Delete the prior confidence-interval-overlap alternative. The exact `confidenceVector` is `{hardCoverage,softObservedCoverage,repeatability,versionMatch,assumptionReliability}`, with each finite in `[0,1]` and higher always better; `assumptionReliability` is the declared normalized inverse of disputed-assumption burden. Candidate `a` confidence-dominates `b` iff every component of `a` is `>=` the corresponding component of `b` and at least one is `>`. Missing/unknown confidence components establish no dominance. A `winner` is allowed only when `B` has one member, the score-near-tie set has only that member, finalist confirmation passes, and that member confidence-dominates every other confirmed hard-feasible Pareto alternative. Multiple exact leaders or multiple score near ties produce `near-tie`. If the score leader is unique but required confidence dominance/confirmation cannot be established, return `insufficient-evidence` with the full Pareto alternatives; do not manufacture a winner or relabel a non-near candidate as a score near tie.

## Affected Future File Contracts

All paths remain conditional on original work unit 0 placement and later implementation approval.

| Future path | Required correction |
| --- | --- |
| `src/nba2k27-myplayer/schemas/desired-build-request.schema.json` | Encode the two evidence variants, both declared conditional discipline fields, static Synergy predicate, hard precedence policy, and closed per-band tolerance array; reject both legacy scalar tie fields. |
| `src/nba2k27-myplayer/schemas/build-observation.schema.json` | Use the same evidence union and `activationThreshold`; admit no undeclared derived or discipline field. |
| `src/nba2k27-myplayer/schemas/optimization-report.schema.json` | Require one hard-set membership, vector/tolerance inputs, score-near-tie basis, confidence outcome, and exact diagnostics where surfaced. |
| `src/nba2k27-myplayer/domain/validation.mjs` | Enforce conditional require/forbid rules and exact deterministic diagnostic messages/order. |
| `src/nba2k27-myplayer/domain/requirements.mjs` | Evaluate static Synergy predicates and preserve tri-state predicate vectors. |
| `src/nba2k27-myplayer/optimizer/objectives.mjs` | Apply false-over-unknown hard classification before any score. |
| `src/nba2k27-myplayer/optimizer/pareto.mjs` | Compute unrounded vector near ties without removing non-dominated alternatives. |
| `src/nba2k27-myplayer/optimizer/run.mjs` | Align dispositions and stops with the one-set partition and confidence outcome. |
| `src/nba2k27-myplayer/report/render-json.mjs` and `render-markdown.mjs` | Report static threshold semantics, exact set membership, every-band tie comparison, confidence, and no fabricated winner. |
| `test/nba2k27-myplayer/fixtures/synthetic/` and `test/nba2k27-myplayer/*.test.mjs` | Add focused valid/invalid fixtures and assertions listed below. |
| `docs/nba2k27-myplayer/data-contract.md` and `optimization.md` | Document only these corrected contracts and mark all superseded fields/semantics invalid. |

## Ordered Future Work and Verification Gates

No step may begin before a final fresh independent review passes this combined plan; implementation additionally requires later user placement/capability approval.

1. Encode the corrected closed schemas and full fixtures in original work unit 1.
2. Encode deterministic semantic diagnostics and static Synergy evaluation.
3. In original work unit 2, classify hard vectors once, then score only feasible candidates and compute vector near ties.
4. Align report/stopping outcomes and update only affected tests/docs.
5. Preserve every original later work-unit and live approval gate.

Future offline command gate remains:

```sh
node --test test/nba2k27-myplayer/*.test.mjs
node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-user-state-valid.json
node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-user-state-invalid.json --expect-invalid
```

Focused executable assertions:

1. Non-derived evidence containing either derived-only field is rejected; derived evidence missing either field is rejected; complete members accept no extra property.
2. Flexible token provenance/pool lock without `allowedDisciplines` is rejected; locked or unknown provenance/lock with it is rejected; correctly paired forms pass.
3. `require:"active"` is schema-invalid; known/unknown `activationThreshold` produces true/unknown for `activation-threshold-known` without reading a gameplay metric.
4. The invalid fixture deep-equals the two diagnostics above, including messages and order.
5. Hard vectors `[false,unknown]`, `[false,true]`, `[unknown,true]`, and `[true,true]` map only to rejected, rejected, unknown, and feasible respectively; no candidate appears in two sets.
6. Every disposition, report decision, and stop fixture derives from that same partition; only feasible candidates reach Pareto/near-tie/finalist/winner logic.
7. Legacy scalar tie fields fail. Missing, duplicate, or extra band tolerances fail.
8. Every-band boundary, just-inside, and just-outside cases use unrounded scores; zero-score and zero-tolerance cases obey the positive floor and exact-delta rules.
9. Exact vector ties remain multiple semantic leaders; Pareto alternatives are preserved; confidence cannot change score-near-tie membership.
10. A sole score leader without required confirmation/confidence dominance yields `insufficient-evidence`, while a confirmed confidence-dominant sole leader may yield `winner`.

## Dependencies, Assumptions, and Tradeoffs

### Dependencies

1. Original plan `root-planner-003-agentic-workflow.md`, retained except for explicit supersession.
2. First addendum `root-planner-006-plan-remediation.md`, retained except for explicit supersession.
3. Blocking findings in `root-validator-007-plan-recheck.md`.
4. One final fresh independent validator review must PASS `gate-actionable-plan` while preserving `gate-phase-boundary`.
5. Original repository placement, host, capability, retention, and user approval decisions remain blocking before implementation.

### Assumptions

- Static build optimization needs threshold availability, legality, and availability facts, not current in-game Synergy activation.
- False-over-unknown is the conservative candidate-level hard precedence.
- All candidates share request priority bands, and near-tie tolerance must hold in every band.

### Tradeoffs

- Closed conditional schemas are more verbose but remove implementation invention.
- False precedence can stop further unknown resolution for an already rejected candidate, while still reporting its evidence gaps.
- Every-band near ties are stricter than scalar aggregation but preserve declared lexicographic intent and all Pareto alternatives.

### Open questions

- None within this correction. Current mechanic values, host capability, and repository placement remain later evidence/approval inputs rather than contract gaps.

## Handoff

- Next role: One final fresh independent `validator` in `review` mode, limited to the combined planner chain, the five blocking categories, exact supersession, executable assertions, and phase boundary.
- Limitations: No implementation schema, fixture, code, or documentation was created or executed. No source/config/package/manifest/Git/live-system change occurred. This correction establishes no mechanic value, host capability, or repository placement.
- Risks: Future schema expansion can still violate these closed unions unless independently tested. Mutable game evidence and host capabilities remain unknown. This final remediation is not acceptance evidence.
- Implementation prohibition: No implementation may follow unless the fresh independent review returns PASS and the user later grants repository placement and capability approval.

### Required planner output fields

- orderedPlanOrResolvedConclusions: Ordered Corrective Decisions and Ordered Future Work and Verification Gates.
- fileContractsOrDecisions: Normative Scope and Supersession; Affected Future File Contracts.
- dependencies: Dependencies subsection.
- verificationGates: Ordered Future Work and Verification Gates, including ten focused assertions.
- handoffNotes: Handoff section.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-008-contract-correction.md`
