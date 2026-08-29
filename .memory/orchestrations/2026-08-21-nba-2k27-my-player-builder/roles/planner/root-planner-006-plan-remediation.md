# NBA 2K27 Agentic Workflow Plan Remediation Addendum

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `planner`
- artifactId: `root-planner-006-plan-remediation`
- createdAt: `2026-08-21`
- taskMode: `plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh remediation packet `dt-remediate-plan-008` for scope `nba-2k27-agentic-workflow-remediation`, limited to validator findings F1 and F2, with the original plan, blocking review, accepted research recheck, exact deliverable path, dependencies, assumptions, decisions, and executable acceptance criteria.
- Required context present: Yes. `dispatchKind` is `fresh`; selected `taskMode` is `plan`; this is remediation cycle 1 of 1. Implementation, live-system work, architecture expansion, and edits to the original plan are prohibited.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Read the supplied original plan and validator artifacts plus the planner contract, trace schema, memory protocol, and trace template. Produced a bounded normative addendum that closes the desired-request user-state grammar, fixes priority direction and comparison, and separates hard-unknown disposition from soft-unknown penalties. All non-F1/F2 architecture and phase decisions remain unchanged by reference.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-003-agentic-workflow.md`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/root-validator-005-plan-review.md`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/root-validator-004-research-recheck.md`.
- Files changed: This assigned remediation trace only.
- Commands/checks: No shell, Git, product, test, network, ADB, emulator, app, or implementation command was run. This was schema-oriented planning from supplied evidence.

## Output Contract

- Outputs: Normative resolved conclusions for F1/F2; closed type contracts; validation and contradiction rules; valid/invalid fixtures and exact diagnostics; deterministic ranking and hard-unknown behavior; affected future file contracts; executable future assertions; dependencies, verification gates, assumptions, tradeoffs, and handoff notes.
- Evidence: F1 and F2 are exactly the blocking findings in `root-validator-005-plan-review`. The accepted research recheck confirms observed Badge Token balances and contextual numeric costs but not a general cost formula. The original plan supplies the retained versioned black-box architecture, normalized observation model, Pareto design, file paths, phase boundary, and safety posture.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-006-plan-remediation.md`; original plan `root-planner-003-agentic-workflow.md`; review `root-validator-005-plan-review.md`; accepted research proof `root-validator-004-research-recheck.md`.

## Resolved Conclusions and Supersession

This addendum is normative only for F1 and F2. It does not authorize implementation and does not mutate the original artifact.

1. **Superseded in full:** original plan section 6 lines 128–169, including its sample `DesiredBuildRequest`, generic `{id, statement, value, disputed}` assumptions, scalar `unknownDataPolicy`, unstated priority direction, and validation examples. Replace that material with the contracts and examples in this addendum.
2. **Narrow clarification:** original section 7 line 182 means “filter to candidates for which every hard predicate is observed or otherwise evidence-resolved to `true` in the exact bound context.” It never includes `unknown`.
3. **Narrow clarification:** original sections 7–8 lines 208 and 214–227 use the outcome rules in this addendum. `no-feasible` is allowed only when all materially explored candidates are hard-false and none remains hard-unknown; a hard-unknown that prevents a conclusion produces `insufficient-evidence`.
4. **Narrow strengthening:** original work-unit 2 gate at line 254 and work-unit 6 gate at line 286 adopt the fixture assertions below.
5. **Retained:** every non-F1/F2 clause, including architecture, repository placement, UI/manual/network posture, provenance, caching, recovery, safety, staging, exact future paths, approvals, no-hidden-formula boundary, and no-implementation phase boundary, remains unchanged by reference.

## F1 Addendum — Closed Desired Request and User-State Grammar

### 1. Common scalar and evidence contracts

The future request schema is closed (`additionalProperties: false` at every object and `unevaluatedProperties: false` at union boundaries). Union discrimination uses exact `kind` or `status` constants.

- `CanonicalId`: lowercase ASCII kebab-case matching `^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`. It is resolved against the vocabulary pinned by `gameVersion` and `vocabularyVersion`; display names and aliases are never IDs.
- `DisciplineId`: closed enum `finishing|shooting|playmaking|defense|rebounding|physical` unless accepted versioned evidence publishes a different closed vocabulary. Unknown future labels fail vocabulary validation; they are not silently added.
- `BadgeTier`: ordered enum `bronze|silver|gold|hall-of-fame|legend` using the accepted version-specific tier vocabulary.
- `TokenCount`, `SlotCount`, `PairCount`, and `CapBreakerCount`: integers `>= 0`; units are respectively `badge-token`, `slot`, `synergy-pair`, and `cap-breaker` and must be explicit in serialized quantity objects.
- `SeasonId`, `LoadoutId`, `SynergyPairId`, `BadgeId`, `AnimationId`, `TakeoverId`, `AttributeId`, and `SourceId`: `CanonicalId` aliases with separate schema definitions so one ID class cannot be substituted for another.
- `VersionValue`: exact `{status:"known",value:string}|{status:"unknown",reason:not-observed|version-conflict|unsupported}`. It has no recursive evidence member; evidence for the context is referenced by `contextEvidenceRefs`.
- `ContextBinding`: exact `{contextId:CanonicalId, appVersion:string, gameVersion:VersionValue, platform:CanonicalId, region:CanonicalId, vocabularyVersion:string, progressionSnapshotId:CanonicalId, observedAt:ISO-8601 UTC string, contextEvidenceRefs:CanonicalId[1..]}`. A fact may satisfy a request only when this context meets `gameVersionPolicy`; unknown or incompatible version is not a match.
- `EvidenceBinding`: exact `{evidenceRefs: CanonicalId[1..], source: screen|hierarchy|ocr|manual|public-source|derived|user-declared, confidence: number[0,1], disputed: boolean, contextRef:CanonicalId}`. `contextRef` must resolve to the enclosing state's exact `ContextBinding.contextId`. A derived fact also requires `inputFieldIds` and `algorithmVersion`. A user declaration is evidence of the declared state only, not evidence of a hidden mechanic.
- `KnownValue<T>`: exact `{status:"known", value:T, evidence:EvidenceBinding}`.
- `UnknownValue`: exact `{status:"unknown", reason:not-visible|not-observed|parse-failed|version-conflict|requires-mutation|unsupported|user-unsure|not-applicable, evidenceRefs:CanonicalId[], contextRef:CanonicalId}`. Bare `null`, omitted required state, zero substitution, `false` substitution, and “unavailable” substitution are invalid.
- `Fact<T> = KnownValue<T>|UnknownValue`. `AvailabilityValue` uses known values `available|unavailable|locked`; `TriPredicate` evaluates to `true|false|unknown` and is not serialized as a Boolean fact.
- Inclusive numeric bounds use `{unit, min?, max?}` with at least one bound. `min <= max`; omitted bounds are unbounded, not unknown. Exclusions use a nonempty canonical-ID or typed-scalar set and exact equality after unit normalization.

No request value creates a general token-cost, cap, OVR, Synergy-activation, or progression formula. A contextual observation applies only to its complete evidence and context key.

### 2. `UserProgressionState`

The exact request root is `{schemaVersion, requestId, gameVersionPolicy, hardUnknownDisposition, softUnknownPolicy, userState, hardConstraints, softPreferences, assumptions, aliases?, optimization?}`. The optional `aliases` and `optimization` retain the original closed alias, budget, near-tie, and wall-clock contracts; every other root member is required. `DesiredBuildRequest.userState` has the exact shape:

```text
UserProgressionState {
  kind: "user-progression-state";
  stateId: CanonicalId;
  context: ContextBinding;
  progressionContext: ProgressionContextFact;
  badgeTokenBalances: BadgeTokenBalanceFact[];
  observedBadgeTokenCosts: BadgeTokenCostFact[];
  slotPools: SlotPoolFact[];
  loadouts: LoadoutFact[];
  synergyPairs: SynergyPairFact[];
  capBreakers: CapBreakerStateFact[];
  animations: AnimationStateFact[];
  takeovers: TakeoverStateFact[];
}
```

Each array is required. An empty array means only “no facts supplied for this mechanic,” not known absence; any dependent predicate therefore evaluates `unknown`. A scoped `UnknownValue` is used inside a typed fact when the resource identity is known but its value is not. The closed fact union is:

1. `ProgressionContextFact`: `Fact<{seasonId:SeasonId, creationPathId:CanonicalId, progressionLevel:{unit:"level",value:integer>=0}, buildSaveId?:CanonicalId}>`. It scopes all resource facts; omission of `buildSaveId` means request-level state, not cross-save availability.
2. `BadgeTokenBalanceFact`: `{kind:"badge-token-balance", discipline:DisciplineId, provenanceClass:Fact<default|event-locked|bonus-flexible|other>, balance:Fact<{unit:"badge-token",value:integer>=0}>}`. A known `bonus-flexible` value also declares `allowedDisciplines:DisciplineId[1..]`; known discipline-locked classes must not.
3. `BadgeTokenCostFact`: `{kind:"observed-badge-token-cost", badgeId:BadgeId, tier:BadgeTier, discipline:DisciplineId, placementContext:{loadoutId?:LoadoutId, slotPoolId?:CanonicalId, synergyPairId?:SynergyPairId}, cost:Fact<{unit:"badge-token",value:integer>=0}>}`. The entire key `(badgeId,tier,discipline,placementContext,ContextBinding)` is required for reuse. It is an observation, never a cost table or interpolation permission.
4. `SlotPoolFact`: `{kind:"slot-pool", slotPoolId:CanonicalId, disciplineLock:Fact<DisciplineId|"flexible">, source:Fact<default|bonus|event|other>, capacity:Fact<{unit:"slot",value:integer>=0}>, occupied:Fact<{unit:"slot",value:integer>=0}>, expiry:ExpiryFact}`. Known `occupied` must not exceed known `capacity`. A known flexible pool declares `allowedDisciplines`; an unknown lock never permits a placement.
5. `LoadoutFact`: `{kind:"loadout", loadoutId:LoadoutId, availability:Fact<available|unavailable|locked>, active:Fact<boolean>, slotPoolIds:CanonicalId[], placements:Fact<Array<{slotPoolId,slotIndex:integer>=0,badgeId:BadgeId,tier:BadgeTier,discipline:DisciplineId}>>}`. Exactly one known active loadout is permitted per state; placements cannot duplicate `(slotPoolId,slotIndex)`.
6. `SynergyPairFact`: `{kind:"synergy-pair", pairId:SynergyPairId, pairIndex:integer>=0, availability:Fact<available|unavailable|locked>, disciplineLock:Fact<DisciplineId|"flexible">, allowedDisciplines?:DisciplineId[], fuse:Fact<{badgeId:BadgeId,tier:BadgeTier}>, reaction:Fact<{badgeId:BadgeId,tier:BadgeTier}>, source:Fact<default|progression|season|event|other>, permanence:Fact<permanent|seasonal|temporary>, expiry:ExpiryFact, activation:Fact<{kind:"observed-threshold",metricId:CanonicalId,operator:"gte"|"gt"|"eq"|"lte"|"lt",value:number,unit:CanonicalId}>, legality:Fact<legal|illegal>, costWaiver:Fact<{unit:"badge-token",value:integer>=0}>}`. `ExpiryFact` is `Fact<{kind:"never"}|{kind:"instant",value:ISO-8601 UTC string}|{kind:"season-end",seasonId:SeasonId}>`; unknown source, permanence, expiry, or activation uses `UnknownValue`. Missing activation evidence cannot become activated.
7. `CapBreakerStateFact`: `{kind:"cap-breaker-state", sourceId:SourceId, availability:Fact<available|unavailable|locked>, balance:Fact<{unit:"cap-breaker",value:integer>=0}>, allocations:Fact<Array<{attributeId:AttributeId,quantity:{unit:"cap-breaker",value:integer>=0},baseValue:integer>=0,previewValue:integer>=0}>>, bodyCapInteraction:Fact<applies|does-not-apply>}`. Known allocation totals cannot exceed the matching known balance; preview deltas are observations, not a formula.
8. `AnimationStateFact`: `{kind:"animation-state", animationId:AnimationId, categoryId:CanonicalId, availability:Fact<available|unavailable|locked>, selected:Fact<boolean>, observedRequirements:Fact<RequirementExpression>}`. `RequirementExpression` remains the original closed `all|any|threshold|range|bodyGate` union.
9. `TakeoverStateFact`: `{kind:"takeover-state", slotIndex:integer[0,4], takeoverId:TakeoverId, discipline:DisciplineId, classification:default|specialist|progression-reward|other, availability:Fact<available|unavailable|locked>, selected:Fact<boolean>, observedRequirements:Fact<RequirementExpression>, unlockSource:Fact<SourceId>}`. Duplicate known selected entries for one `slotIndex` are invalid.

### 3. Closed hard constraints

`hardConstraints` is an array of the following discriminated union only. Every item has `id:CanonicalId`; resource items may include an exact `stateId` and otherwise bind to the request's sole `userState`.

- Existing build predicates retained as typed kinds: `position-in`, `body-range`, `attribute-range`, `badge-tier-at-least`, `label-in`, and `exclude-id` (target enum `badge|animation|takeover|loadout|synergy-pair|assumption`; nonempty `values`).
- `token-balance-range`: `{discipline, provenanceClass?, range:{unit:"badge-token",min?,max?}}`.
- `token-cost-range`: `{badgeId,tier,discipline,placementContext,range:{unit:"badge-token",min?,max?}}`.
- `discipline-lock-allows`: `{resourceKind:"slot-pool"|"synergy-pair", resourceId, discipline}`.
- `slot-availability-range`: `{slotPoolId, source:default|bonus|event|other, discipline, measure:"capacity"|"remaining", range:{unit:"slot",min?,max?}}`.
- `loadout-availability`: `{loadoutId, require:available|active|unlocked}` and `loadout-placement`: `{loadoutId,badgeId,tier?,require:present|absent}`.
- `synergy-pair-availability`: `{pairId,require:available|legal|active}`; `synergy-source-in`: `{pairId,sources:nonempty source enum[]}`; `synergy-expiry`: `{pairId,require:"permanent"|"unexpired-at", at?:ISO-8601 UTC}`; and `synergy-placement`: `{pairId,fuseBadgeId?,reactionBadgeId?,discipline?}`.
- `cap-breaker-range`: `{sourceId?, measure:"available"|"allocated", attributeId?, range:{unit:"cap-breaker",min?,max?}}`.
- `animation-availability`: `{animationId,require:available|selected|unlocked}`.
- `takeover-availability`: `{takeoverId,slotIndex?,require:available|selected|unlocked}`.
- `progression-context-match`: `{seasonId?,creationPathId?,progressionLevelRange?:{unit:"level",min?,max?}}`.

Every hard evaluator returns `true`, `false`, or `unknown` with evidence references. It must not coerce unknown facts or incompatible contexts.

### 4. Closed soft preferences and assumptions

Each `SoftPreference` is exact `{id, priority, weight, objective, utility}`:

- `priority`: integer `>= 1`; **lower integers are higher priority**, so priority `1` outranks `2`.
- `weight`: finite number `> 0`, used only inside the same priority band.
- `objective`: the closed `SoftObjective` union. It contains the original typed attribute/badge/body targets plus soft versions of every resource predicate listed above. A resource objective uses the same IDs, units, context, range, exclusion, availability, and discipline semantics as its hard counterpart; kinds are prefixed `prefer-`.
- `utility`: closed `maximize|minimize|target|piecewise` declaration normalized to `[0,1]`, with explicit inclusive breakpoints and no extrapolation beyond declared terminal segments.

`assumptions` is no longer generic prose. It is a closed `UserStateAssumption[]`; each exact object is `{id, kind:"user-state-assumption", fact:AssumedFact, evidence, disputed}`. `AssumedFact` is the same nine-member typed fact union as `UserProgressionState`, but every contained value is still `KnownValue` or `UnknownValue`. `evidence.source` must be `user-declared|manual|public-source`; a public-source assumption cannot establish exact-user availability. Prose rationale may appear only in an optional bounded `note`; it cannot be evaluated.

An assumption with `disputed:true`, unknown value, version conflict, or inexact progression context evaluates as unknown whenever a predicate depends on it. Assumptions cannot override a same-context observed fact. A same-key observed/assumed disagreement is a validation error, not a precedence choice.

### 5. Semantic validation and contradiction rules

Validation occurs before oracle work and emits stable diagnostics `{code,path,message,relatedPaths[],minimalContradictorySet[]}`.

1. Duplicate fact keys in the same context are permitted only when their canonical JSON values and evidence IDs are identical; otherwise `E_STATE_DUPLICATE_CONFLICT`.
2. A known token allocation/cost requirement greater than the sum of compatible known balances is `E_TOKEN_OVERCOMMITTED`; unknown costs produce predicate `unknown`, not this diagnostic.
3. Known occupied slots greater than capacity is `E_SLOT_OCCUPANCY_EXCEEDS_CAPACITY`; duplicate placements are `E_SLOT_DUPLICATE_PLACEMENT`.
4. A placement whose discipline violates a known lock is `E_DISCIPLINE_LOCK_CONFLICT`.
5. Multiple known active loadouts are `E_MULTIPLE_ACTIVE_LOADOUTS`; unavailable/locked loadouts cannot be known active or contain known placements (`E_LOADOUT_AVAILABILITY_CONFLICT`).
6. A seasonal/temporary Synergy whose known expiry precedes `ContextBinding.observedAt`, while known available/legal/active is required, is `E_SYNERGY_EXPIRED_CONFLICT`. A pair's same badge cannot be both Fuse and Reaction unless version-bound evidence explicitly permits it; otherwise `E_SYNERGY_ROLE_CONFLICT`.
7. Known Cap Breaker allocations exceeding a known source balance are `E_CAP_BREAKER_OVERALLOCATED`; contradictory base/preview observations are duplicate-key conflicts, not inferred cap math.
8. Duplicate known selected animations in a version-defined exclusive category are `E_ANIMATION_SELECTION_CONFLICT`. Duplicate selected Takeovers in one slot are `E_TAKEOVER_SLOT_CONFLICT`.
9. Two inclusive hard ranges on the same canonical field/context with empty intersection are `E_HARD_RANGE_EMPTY`; a required ID also excluded by hard constraint is `E_HARD_REQUIRED_EXCLUDED`.
10. A hard constraint and soft preference may address the same field, but the soft objective's attainable region is clipped to the hard-feasible region. If its entire positive-utility region is excluded, reject with `E_SOFT_UNATTAINABLE_UNDER_HARD` rather than retain a misleading zero-only objective.
11. Incompatible `ContextBinding` records do not contradict; they are separate versions/snapshots and cannot jointly satisfy one request. A request that mixes them is `E_CONTEXT_MISMATCH`.
12. Diagnostics return the smallest set of JSON Pointers sufficient to prove the conflict; ties use lexical pointer order. No hidden formula may be used to invent a contradiction.

### 6. Request examples and exact diagnostics

Valid resource-state excerpt (all IDs are canonical and the observations are explicitly contextual, not generalized):

```json
{
  "schemaVersion": "1.1.0",
  "requestId": "two-way-wing-state-a",
  "gameVersionPolicy": {"mode":"exact","value":"game-a"},
  "hardUnknownDisposition": "pause-for-observation",
  "softUnknownPolicy": {"mode":"explicit-penalty","utility":0.25},
  "userState": {
    "kind":"user-progression-state",
    "stateId":"state-a",
    "context":{"contextId":"context-a","appVersion":"app-a","gameVersion":{"status":"known","value":"game-a"},"platform":"android","region":"us","vocabularyVersion":"vocab-a","progressionSnapshotId":"snapshot-a","observedAt":"2026-08-21T00:00:00Z","contextEvidenceRefs":["screen-version"]},
    "progressionContext":{"status":"known","value":{"seasonId":"season-one","creationPathId":"custom-builder","progressionLevel":{"unit":"level","value":12}},"evidence":{"evidenceRefs":["manual-state-a"],"source":"manual","confidence":1,"disputed":false,"contextRef":"context-a"}},
    "badgeTokenBalances":[{"kind":"badge-token-balance","discipline":"defense","provenanceClass":{"status":"known","value":"default","evidence":{"evidenceRefs":["screen-token-balance"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"balance":{"status":"known","value":{"unit":"badge-token","value":14},"evidence":{"evidenceRefs":["screen-token-balance"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}}}],
    "observedBadgeTokenCosts":[{"kind":"observed-badge-token-cost","badgeId":"challenger","tier":"gold","discipline":"defense","placementContext":{"loadoutId":"loadout-one"},"cost":{"status":"known","value":{"unit":"badge-token","value":2},"evidence":{"evidenceRefs":["screen-cost-challenger"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}}}],
    "slotPools":[{"kind":"slot-pool","slotPoolId":"defense-default","disciplineLock":{"status":"known","value":"defense","evidence":{"evidenceRefs":["screen-slots"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"source":{"status":"known","value":"default","evidence":{"evidenceRefs":["screen-slots"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"capacity":{"status":"known","value":{"unit":"slot","value":5},"evidence":{"evidenceRefs":["screen-slots"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"occupied":{"status":"known","value":{"unit":"slot","value":2},"evidence":{"evidenceRefs":["screen-slots"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"expiry":{"status":"known","value":{"kind":"never"},"evidence":{"evidenceRefs":["manual-default-slots"],"source":"manual","confidence":0.8,"disputed":false,"contextRef":"context-a"}}}],
    "loadouts":[], "synergyPairs":[], "capBreakers":[], "animations":[], "takeovers":[]
  },
  "hardConstraints":[{"id":"need-defense-tokens","kind":"token-balance-range","discipline":"defense","range":{"unit":"badge-token","min":2}}],
  "softPreferences":[{"id":"prefer-low-cost","priority":1,"weight":3,"objective":{"kind":"prefer-token-cost-range","badgeId":"challenger","tier":"gold","discipline":"defense","placementContext":{"loadoutId":"loadout-one"},"range":{"unit":"badge-token","max":3}},"utility":{"kind":"minimize","best":0,"worst":3}}],
  "assumptions":[]
}
```

This is a valid closed request example for the shown resource facts. Its empty mechanic arrays assert no fact, so any future predicate depending on one evaluates `unknown`; they do not assert that the user's resources are absent.

Invalid resource-state fragment, to be substituted for the corresponding arrays in the otherwise valid request above:

```json
{
  "slotPools":[{"kind":"slot-pool","slotPoolId":"defense-default","disciplineLock":{"status":"known","value":"defense","evidence":{"evidenceRefs":["screen-capacity"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"source":{"status":"known","value":"default","evidence":{"evidenceRefs":["screen-capacity"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"capacity":{"status":"known","value":{"unit":"slot","value":2},"evidence":{"evidenceRefs":["screen-capacity"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"occupied":{"status":"known","value":{"unit":"slot","value":3},"evidence":{"evidenceRefs":["screen-occupied"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"expiry":{"status":"unknown","reason":"not-observed","evidenceRefs":[],"contextRef":"context-a"}}],
  "capBreakers":[{"kind":"cap-breaker-state","sourceId":"season-reward","availability":{"status":"known","value":"available","evidence":{"evidenceRefs":["screen-breaker"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"balance":{"status":"known","value":{"unit":"cap-breaker","value":2},"evidence":{"evidenceRefs":["screen-breaker"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"allocations":{"status":"known","value":[{"attributeId":"three-point-shot","quantity":{"unit":"cap-breaker","value":3},"baseValue":85,"previewValue":88}],"evidence":{"evidenceRefs":["screen-breaker-preview"],"source":"screen","confidence":1,"disputed":false,"contextRef":"context-a"}},"bodyCapInteraction":{"status":"unknown","reason":"not-observed","evidenceRefs":[],"contextRef":"context-a"}}]
}
```

The fragment is structurally valid at those array boundaries but semantically invalid. Validation of the complete substituted request must return exactly these independent diagnostics in code/path order:

```json
[
  {"code":"E_CAP_BREAKER_OVERALLOCATED","path":"/userState/capBreakers/0/allocations","relatedPaths":["/userState/capBreakers/0/balance"],"minimalContradictorySet":["/userState/capBreakers/0/balance","/userState/capBreakers/0/allocations"]},
  {"code":"E_SLOT_OCCUPANCY_EXCEEDS_CAPACITY","path":"/userState/slotPools/0/occupied","relatedPaths":["/userState/slotPools/0/capacity"],"minimalContradictorySet":["/userState/slotPools/0/capacity","/userState/slotPools/0/occupied"]}
]
```

The excerpts deliberately contain no claim about why costs, caps, or availability have those values.

## F2 Addendum — Deterministic Priority and Unknown Outcomes

### 1. Priority, weighted comparison, Pareto, and ties

1. Lower positive integers are higher priority: `1` outranks `2`; zero and negative priorities are invalid.
2. For candidate `c` and priority band `p`, compute `bandScore(c,p) = sum(weight_i * utility_i(c)) / sum(weight_i)` over all declared preferences in `p`. Every utility is in `[0,1]`.
3. Soft unknown handling occurs before this calculation as specified below. The denominator always includes every declared weight, so an unknown objective cannot silently disappear and improve a score.
4. Compare candidates lexicographically by ascending priority integer: at the first band with unequal unrounded `bandScore`, the higher score leads. Lower-priority bands can never compensate for a loss in a higher-priority band.
5. Equal unrounded band vectors remain tied under aggregate comparison. Stable display order uses candidate content hash only and is explicitly non-semantic.
6. Pareto sorting continues to use the complete unrounded per-preference utility and separate resource/cost vectors from the original plan. A candidate is removed only by Pareto dominance or hard filtering, never merely by a weighted or lexicographic score.
7. Weighted band scores and lexicographic comparison organize/explain candidates within the hard-feasible Pareto set. They do not erase non-dominated alternatives. Exact ties and configured near ties remain in the reported set; rounding happens afterward.

### 2. Replacement unknown policies

Delete scalar `unknownDataPolicy`. `DesiredBuildRequest` instead requires two independent fields:

```text
hardUnknownDisposition = "reject-candidate" | "pause-for-observation" | "insufficient-evidence"
softUnknownPolicy =
  {mode:"explicit-penalty", utility:number in [0,1)} |
  {mode:"pause-for-observation"}
```

There is no `allow`, `assume-satisfied`, or shared hard/soft penalty mode.

- A candidate enters `hardFeasibleSet` iff every compiled hard predicate is evidence-resolved to `true` under the exact context. Any `false` predicate enters `hardRejectedSet`. Any `unknown` predicate enters `hardUnknownSet`. These sets are disjoint.
- A member of `hardUnknownSet` can never enter `hardFeasibleSet`, the feasible Pareto front, the near-tie set, finalists, or a winner set. No numeric penalty, confidence score, surrogate prediction, public-source value, or soft utility can change that rule.
- `reject-candidate`: exclude that candidate from optimization and record each unknown predicate/evidence gap. Continue with confirmed feasible candidates. If none exists, return `insufficient-evidence` when `hardUnknownSet` is nonempty; return `no-feasible` only when at least one candidate was evaluated, all are hard-false, and no material candidate remains hard-unknown.
- `pause-for-observation`: suspend proposal/ranking before the candidate could affect the front, emit an observation request containing only missing field IDs and approved evidence actions, and consume no unauthorized action. If approved evidence resolves all predicates, re-evaluate from the beginning. If observation is declined, unavailable, unsafe, version-incompatible, or the observation budget/stopping rule is reached, terminate `insufficient-evidence`.
- `insufficient-evidence`: do not request observation; immediately stop the work unit with decision `insufficient-evidence`, list the unknown hard predicates and affected candidates, and emit no winner/feasible Pareto front.
- `softUnknownPolicy.explicit-penalty`: assign exactly its declared `utility` to each unknown soft objective, retain its weight in the band denominator, mark the contribution `unknown-penalty`, and report the missing evidence. It is allowed only after hard feasibility is established.
- `softUnknownPolicy.pause-for-observation`: pause under the same approved-action boundary; if unresolved, return the confirmed feasible Pareto alternatives with those soft dimensions marked unknown and decision `near-tie` or `insufficient-evidence`, never manufacture a winner. A soft unknown never changes hard feasibility.

### 3. Aligned request, optimizer, report, stopping, and exit behavior

- **Request validation:** compile all predicates to tri-state evaluators; reject any legacy scalar policy or hard penalty mode with `E_UNKNOWN_POLICY_LEGACY`; reject a soft penalty outside `[0,1)` with `E_SOFT_UNKNOWN_PENALTY_RANGE`.
- **Optimization filtering:** evaluate hard predicates first; partition into the three sets above; score and Pareto-rank only `hardFeasibleSet`.
- **Reports:** every candidate hard predicate is `satisfied|missed|unknown`. `winner` requires a nonempty confirmed hard-feasible set, no unresolved hard predicate capable of changing winner eligibility among explored material candidates, and the original confirmation rules. `near-tie` contains confirmed hard-feasible candidates only. `no-feasible` requires hard-false evidence and no material hard unknown. `insufficient-evidence` identifies unknown paths, evidence/context, disposition, attempted/declined observation, and why no conclusive winner/front is emitted.
- **Stopping:** original stopping order remains, but “no approved action can reveal the remaining hard unknown,” observation refusal, unsafe observation, and unknown-at-budget all map to `insufficient-evidence`. Budget exhaustion may return a confirmed feasible Pareto set only if unresolved hard-unknown candidates are explicitly shown not to be material to that set under already proven hard facts; otherwise it returns `insufficient-evidence` without a winner.
- **Work-unit exit:** work unit 2 tests all policy branches offline. Work unit 6 passes only when any recommendation is oracle-confirmed hard-feasible in exact context. A run ending `insufficient-evidence` is a valid safe operational result but does not satisfy an aspiration/winner exit gate and never authorizes presenting an unknown candidate as feasible.

## Affected Future File Contracts

All paths remain conditional on original work unit 0 placement approval.

| Future path | F1/F2 addendum |
| --- | --- |
| `src/nba2k27-myplayer/schemas/desired-build-request.schema.json` | Implement the closed common values, `UserProgressionState`, nine fact members, hard/soft unions, typed assumptions, split unknown policies, and lower-integer priority rule. Reject legacy generic assumptions and scalar policy. |
| `src/nba2k27-myplayer/schemas/build-observation.schema.json` | Expose evidence/context-bound facts compatible with the request state grammar; do not add inferred formulas. |
| `src/nba2k27-myplayer/schemas/optimization-report.schema.json` | Encode disjoint candidate sets, exact decision eligibility, hard/soft unknown details, band vectors, Pareto alternatives, and no winner/front for unresolved hard outcomes. |
| `src/nba2k27-myplayer/domain/vocabulary.mjs` | Provide versioned closed ID classes and discipline/tier/source enums; aliases never create IDs. |
| `src/nba2k27-myplayer/domain/validation.mjs` | Enforce structural/semantic rules, stable diagnostic codes, lexical ordering, and minimal contradictory sets. |
| `src/nba2k27-myplayer/domain/requirements.mjs` | Return tri-state hard results with evidence and context; never coerce unknown. |
| `src/nba2k27-myplayer/optimizer/objectives.mjs` | Partition hard sets first; implement ascending integer priority, normalized within-band weighted score, split soft unknown behavior, and lexicographic vectors. |
| `src/nba2k27-myplayer/optimizer/pareto.mjs` | Accept confirmed hard-feasible candidates only and preserve non-dominated alternatives/ties regardless of aggregate score. |
| `src/nba2k27-myplayer/optimizer/run.mjs` | Implement observation pause, terminal insufficient-evidence behavior, material-hard-unknown stopping, and exit-gate semantics. |
| `src/nba2k27-myplayer/report/render-json.mjs` | Render exact hard dispositions, unknown evidence gaps, priority bands, penalties, candidate-set membership, and eligible decision. |
| `src/nba2k27-myplayer/report/render-markdown.mjs` | Explain priority direction, within-band weights, Pareto alternatives, and why unknown hard data blocked feasibility or a winner. |
| `test/nba2k27-myplayer/fixtures/synthetic/` | Add complete valid state, each invalid contradiction, each mechanic unknown, incompatible-context, priority reversal, Pareto tie, and all hard/soft unknown-policy fixtures. |
| `test/nba2k27-myplayer/*.test.mjs` | Assert the executable gates below without live dependencies. |
| `docs/nba2k27-myplayer/data-contract.md` | Document IDs, units, facts, context/evidence, contradictions, examples, and no-formula boundary. |
| `docs/nba2k27-myplayer/optimization.md` | Document ascending priorities, weighted bands, lexicographic comparison, Pareto preservation, split unknown policies, and decision/stopping tables. |

## Ordered Remediation Implementation Plan

This is a future bounded addendum to original work units 1–2, not implementation authorization.

1. In original work unit 1, encode common values/evidence, the complete user-state fact union, hard/soft unions, typed assumptions, and split policies; add full non-abbreviated fixtures for every mechanic and contradiction.
2. Implement semantic validation independently of oracle access, with exact codes and deterministic minimal contradictory sets.
3. In original work unit 2, implement tri-state hard partitioning before any scoring, then soft unknown treatment, within-band weighted scores, ascending-priority lexicographic comparison, and Pareto-preserving reporting.
4. Align report decisions and stopping/work-unit outcomes with the same partition; prohibit unknown candidates at every feasible/winner/front boundary.
5. Update only the affected docs and test contracts above. Retain all original later work-unit sequencing and approval gates.
6. Obtain fresh independent validator review of this addendum before parent acceptance or implementation dispatch.

## Dependencies

1. Original plan `root-planner-003-agentic-workflow.md`, retained except for the exact supersession above.
2. Blocking F1/F2 findings in `root-validator-005-plan-review.md`.
3. Accepted research chain represented by `root-validator-004-research-recheck.md`; observed token values remain context-bound and non-formulaic.
4. Original work unit 0 repository/host/capability decision remains blocking before implementation.
5. Fresh independent validator review of this remediation is required before `gate-actionable-plan` can pass.

## Executable Verification Gates

These are future offline assertions after placement and implementation approval; they were not run here. They remain under the original Node 24 test command:

```sh
node --test test/nba2k27-myplayer/*.test.mjs
node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-user-state-valid.json
node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-user-state-invalid.json --expect-invalid
node src/nba2k27-myplayer/cli.mjs optimize --oracle replay --dry-run --request test/nba2k27-myplayer/fixtures/synthetic/request-hard-unknown.json --replay test/nba2k27-myplayer/fixtures/replay/hard-unknown.json
```

Required exact test assertions:

1. The valid full fixture accepts canonical IDs, explicit units, complete evidence/context, token balances/contextual costs, discipline locks, default/bonus slots, loadouts, Synergy source/expiry/activation, Cap Breakers, animations, Takeovers, and progression context.
2. Unknown never defaults to zero, false, unavailable, unlocked, active, expired, or satisfied; incompatible versions never satisfy a predicate.
3. The invalid full fixture returns the two specified diagnostics and minimal sets in deterministic order; focused fixtures cover every other diagnostic code above.
4. A contextual observed token cost cannot satisfy another badge/tier/loadout/Synergy/version key, and no general cost function is generated.
5. Priority `1` defeats priority `2` regardless of lower-band weight; within one band, declared weights produce the normalized score; equal vectors remain ties.
6. A non-dominated alternative remains on the Pareto front even when its lexicographic band score is lower; display hash ordering does not change semantic ties.
7. For each hard disposition, any candidate with one unknown hard predicate is absent from hard-feasible, Pareto, near-tie, finalist, and winner sets.
8. `reject-candidate` with no feasible and at least one hard-unknown candidate reports `insufficient-evidence`; all known hard-false with no hard unknown reports `no-feasible`.
9. `pause-for-observation` emits only an approved evidence request and becomes `insufficient-evidence` when unresolved; `insufficient-evidence` disposition performs no observation request.
10. Explicit soft penalty applies only after hard feasibility, remains in the band denominator, appears in report JSON/Markdown, and cannot alter hard-set membership.
11. Legacy `unknownDataPolicy`, generic statement/value assumptions, invalid priorities, and hard penalty/allow modes fail schema or semantic validation with stable codes.
12. Report schema forbids `winner` or a feasible Pareto entry referencing a hard-unknown candidate and preserves ties before rounding.

Gate interpretation: these tests resolve F1/F2 only. The original full offline, repository-placement, independent validation, and later live approval gates remain mandatory.

## Assumptions and Tradeoffs

### Assumptions

- Unknown remains first-class and never defaults to zero, unavailable, expired, unlocked, or satisfied.
- Observed resource values are bound to evidence, version, progression snapshot, and placement context and imply no general formula.
- Lower numeric priority is the explicit highest-priority convention.
- Every actual schema fixture expands the illustrative context/evidence shorthand used above.

### Tradeoffs

- Requiring complete typed user state is more verbose, but prevents implementations from inventing progression/resource semantics.
- Rejecting all hard-unknown candidates may reduce recommendation throughput, but is necessary for hard-feasibility correctness.
- Lexicographic weighted bands communicate declared priority while Pareto preservation avoids collapsing genuine alternatives to one scalar.

### Open questions

- None blocks the F1/F2 contract resolution. Actual user state, host capability, current vocabulary, and observable mechanics remain evidence inputs for later approved work, not values to invent now.

## Handoff

- Next role: Fresh independent `validator` in `review` mode, limited to whether this addendum resolves F1/F2 and preserves the original phase boundary. Implementation remains unauthorized.
- Limitations: No implementation schema was generated or executed; examples contain explicitly identified planning shorthand and require full expansion in future fixtures. No BlueStacks/app/ADB/network/credential/Git/config/source action occurred. This addendum cannot establish current mechanic values or hidden formulas.
- Risks: Mutable game mechanics and actual user progression remain unknown until version-bound observation. Incorrect future schema expansion could still conflate contexts; independent fixture review is required. The original repository-placement blocker remains.

### Required planner output fields

- orderedPlanOrResolvedConclusions: Resolved Conclusions and Supersession; F1 Addendum; F2 Addendum; Ordered Remediation Implementation Plan.
- fileContractsOrDecisions: Affected Future File Contracts plus the normative schema and policy decisions above.
- dependencies: Dependencies section.
- verificationGates: Executable Verification Gates section.
- handoffNotes: Handoff section.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-006-plan-remediation.md`
