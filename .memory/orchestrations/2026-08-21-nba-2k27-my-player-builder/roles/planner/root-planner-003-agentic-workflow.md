# NBA 2K27 MyPLAYER Builder Agentic Workflow Plan

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `planner`
- artifactId: `root-planner-003-agentic-workflow`
- createdAt: `2026-08-21`
- taskMode: `plan`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Contract-complete fresh planning packet `dt-plan-workflow-006` for scope `nba-2k27-agentic-workflow-plan`, with an approved goal, scope boundaries, four research/validation artifacts, one deliverable path, acceptance criteria, dependencies, assumptions, and three controlling decisions.
- Required context present: Yes. `dispatchKind` is `fresh`; the selected mode is `plan`; `gate-current-research` passed in `root-validator-004-research-recheck`; implementation and live BlueStacks work remain prohibited.
- Routing metadata status: `absent`; no routing labels or values were invented.

## Work Performed

- Summary: Read the accepted research chain, planner contract, trace schema/template, orchestration index, root package metadata, source manifest, README, and repository layout. Converted the evidence into a staged, approval-gated black-box tracing and optimization design. Compared UI, network, and hybrid approaches; specified state, provenance, desire, optimization, reporting, test, observability, recovery, and security contracts; and bounded exact future paths without implementing them.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`; `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/INDEX.md`; the four supplied research/validation artifacts; `package.json`; `.opencode/harness.manifest.json`; `README.md`; repository root and `bin/` directory listings.
- Files changed: This planning trace artifact only. Its missing assigned parent directory was created; no source, configuration, emulator, account, Git, or index content was changed.
- Commands/checks: Ran only `mkdir` for the missing assigned planner artifact directory after verifying its parent. No product, test, network, ADB, emulator, app, or Git command was run. Read-only filesystem inspection established that this repository has no current `src/` or test application subtree and is a closed-inventory OpenCode harness package.

## Output Contract

- Outputs: Ordered implementation plan; exact future file contracts and decisions; dependencies; executable verification gates; assumptions, tradeoffs, open questions, and handoff notes.
- Evidence: The plan is constrained by the accepted research chain. In particular, it preserves mutable/versioned evidence, treats unknown cap/budget/OVR/token/Synergy behavior as oracle-learned, uses canonical Badge Tokens/Fuse Badges/Reaction Badges, and separates badge qualification, occupancy, token economics, and Synergy placement.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-003-agentic-workflow.md`; research `[R1]` and correction `[R2]`; independent research proof `[V1]` and passing recheck `[V2]` listed under Evidence Basis.

## Planning Decisions

### 1. Selected architecture and safety posture

Build a **versioned black-box oracle client**, not a reverse-engineered formula library. The pure core proposes a complete candidate, sends it through an approved oracle adapter, normalizes the observed result, and learns only from recorded observations. Static public tables may seed hypotheses but cannot silently override an observation from the same app/game version and context.

The default operating modes, in increasing authority, are:

1. `replay`: consumes committed synthetic/sanitized fixtures only; always available and the default for tests.
2. `manual-capture`: prints a deterministic action worksheet and imports user-supplied screenshots/transcriptions; no emulator control.
3. `ui-observe`: captures approved screenshots/UI hierarchy without input; read-only live observation.
4. `ui-control`: sends bounded Builder-only input after a separate per-run approval and preflight.
5. `network-observe`: optional metadata or app-cooperative traffic observation only after separate legal/ToS and user approval. It is never required for correctness.

All commands must default to `replay` or `manual-capture` and `--dry-run`. A live adapter must reject execution unless its explicit capability and current-run approval are present. Credentials, account linking, uploading/sharing builds, purchases, gameplay, and save deletion are permanently outside the proposed adapter contract.

### 2. Current-state assumptions and capability preflight

Current assumptions, to be verified rather than embedded:

- BlueStacks and NBA 2K HQ exist on a separate supported host; this Linux/Node-24 harness checkout cannot establish that host's OS, BlueStacks version, instance, Android version, app version, region, display geometry, or connectivity.
- The app may require existing user-managed authentication and persistent connectivity. The workflow must not collect, enter, export, log, or refresh credentials.
- Builder state and UI structure can change at any update. OCR, UI hierarchy, and image-template availability are capabilities, not guarantees.
- The Builder may expose only partial metrics on a given screen. Unknown is a first-class value and never becomes zero, false, or “not qualified” by default.
- No full feasibility, token-cost, attribute-budget, cap, OVR, or Synergy-trigger formula is known.

Before any future live observation or control, the adapter must execute a non-mutating preflight and emit a signed-by-content JSON report (hash, not a credential-bearing signature) containing:

1. host OS/version and local clock; Node/tool versions; BlueStacks product/version and selected instance identifier;
2. Android API level, app package identifier supplied by the operator, installed app version/build, locale/region, screen size/density/orientation, and network connectivity status;
3. whether a local, user-enabled control channel is available; whether screenshot capture and UI hierarchy inspection work; and whether the app marks either unavailable;
4. foreground package/activity and a screenshot hash, while storing no account identifier or notification content;
5. confidence that the visible screen is a Builder landing/checkpoint state, with every unmatched cue listed;
6. requested capability versus authorized capability, dry-run status, legal/ToS decision ID if network observation was requested, and a redacted command preview;
7. storage-root ownership/permissions, available space, retention policy, and confirmation that logs redact free text and host/user paths;
8. fail-closed checks: exactly one selected emulator instance, supported geometry/profile, no credential/login screen, no modal requiring acceptance, no build upload/share prompt, and no unresolved version mismatch.

Preflight is allowed to identify capabilities only. It must not tap, type, navigate, launch/restart the app, enable debugging, alter BlueStacks settings, install certificates, attach proxies, or accept prompts. Those actions require distinct later approval. A failed or ambiguous item yields `blocked`, not automatic repair.

### 3. Tracing approach comparison

| Approach | Observability | Update robustness | Auth/pinning exposure | Legal/ToS risk | Decision |
| --- | --- | --- | --- | --- | --- |
| UI black-box (screenshots, optional supported UI hierarchy, bounded input) | Sees exactly what the user sees, including labels and calculated results; may miss hidden values | Moderate when semantic anchors, checkpoint hashes, and human fallback are used; brittle if coordinates are primary | Does not require credential access or TLS changes | Lowest of the three, but automation may still be restricted and needs operator review | **Default live approach** after approval |
| Network observation | Potentially structured and efficient if an app openly exposes useful traffic | Endpoints and payloads can change without UI notice | Authentication headers, personal data, encryption, and certificate pinning create unacceptable default exposure | Highest; interception/decryption may violate terms or law | **Not a dependency**; metadata/app-cooperative observation only after separate review; no TLS bypass |
| Hybrid UI plus network | Can correlate user-visible state with request timing and reduce transcription | Inherits both surfaces' volatility | Inherits network risks even if UI works | Requires the broadest approval and audit boundary | Optional diagnostic escalation only, never default optimization path |

Selected default: semantic UI tracing with screenshot evidence and, where the platform exposes it without circumvention, read-only UI hierarchy. Coordinates are calibrated per version/geometry and used only behind image/checkpoint guards. Selected fallback: human-in-the-loop manual capture using the same action and observation schemas. A failure of automation therefore degrades throughput, not data-model correctness.

Optional network scope is limited to destination/timing/status/size metadata or an explicitly documented app-provided export that contains no credentials or personal data. Capturing authorization material, decrypting TLS, installing a CA, bypassing pinning, patching the app, or replaying private endpoints is excluded from this plan.

### 4. Deterministic navigation and recovery contract

Represent navigation as a versioned finite-state machine. States are semantic and must be recognized by two independent cues where possible (for example, stable text plus image anchor), never by elapsed time alone:

`unknown -> app_foreground -> builder_home -> creation_path -> body -> attributes -> badge_summary -> loadout -> synergy -> animations -> takeovers -> cap_breaker_preview -> build_summary`.

Each transition record contains `transitionId`, allowed source states, intended target state, semantic action, bounded retry count, pre/post recognizers, timeout, evidence capture points, mutation class, and recovery target. Actions identify UI meaning (`selectPosition`, `setAttribute`) rather than raw coordinates; the host profile maps meaning to versioned selectors/templates.

Determinism and recovery rules:

- Capture a checkpoint before and after every transition: monotonic sequence, screen/state ID, app/game/host-profile versions, screenshot content hash, hierarchy hash when available, recognized fields, confidence, and action outcome.
- Wait on target-state recognition with bounded polling and jitter-free configured intervals. Never “sleep and assume.”
- Retry an idempotent action at most once only if the source checkpoint is unchanged. Never retry an ambiguous drag, increment, finalization, upload, or save action automatically.
- On mismatch, take no further input, capture evidence, classify `transient`, `selector_drift`, `unexpected_modal`, `auth_boundary`, `connectivity`, `version_drift`, or `unknown`, then return to the nearest proven checkpoint only through approved non-destructive transitions.
- Recovery order: re-recognize current screen; dismiss only allowlisted non-account informational overlays; navigate to the Builder home through bounded Back actions if each intermediate screen is recognized; otherwise stop for operator recovery. App restart and emulator restart are separate approvals and cannot occur in the default run.
- Before applying a candidate, reset all adjustable body/attribute fields to a recorded baseline through the UI and read them back. Do not infer reset success from action count.
- Never finalize/upload/share a build. Stop at the read-only summary/preview boundary. If the app requires saving to reveal a metric, mark that metric unavailable until the user separately authorizes a disposable-save protocol.
- A replay manifest records seed, proposal order, action plan, oracle observation IDs, software/schema versions, and hashes. Replaying the same manifest must reproduce proposal/ranking outputs from the same observations; it need not claim the mutable live app will return the same result later.

### 5. Normalized, versioned observation model

Use JSON Schema Draft 2020-12. All records have `schemaVersion`, immutable `observationId`, `observedAt`, `oracleMode`, `runId`, `appVersion`, `gameVersion` (nullable with an explicit unknown reason), `platform`, `region`, `hostProfileVersion`, source artifact hashes, parser versions, and field-level provenance. Every measurable field is a `KnownValue` or `UnknownValue`; `null` alone is forbidden.

`KnownValue<T>` includes `value`, `source` (`screen`, `hierarchy`, `ocr`, `manual`, `public-source`, `derived`), `evidenceRefs`, `confidence` in `[0,1]`, and `disputed`. `UnknownValue` includes `status: "unknown"`, a reason enum (`not-visible`, `not-observed`, `not-applicable`, `parse-failed`, `version-conflict`, `requires-mutation`, `unsupported`), and evidence references. Derived values additionally list exact input field IDs and algorithm version.

The normalized `BuildObservation` contains:

- **Identity/context:** creation path, optional blueprint reference, appearance sex/save-lock fact where visible, position, build labels, comparisons, and state/checkpoint IDs.
- **Body:** height, weight, wingspan, units as observed plus canonical integer units, and observed min/max/step constraints.
- **Attributes:** canonical attribute ID, displayed value, proposed value, observed cap/min, Cap Breaker Preview gain/limit, and whether the displayed value is base, post-break preview, or unknown.
- **Feasibility/summary:** accepted/rejected proposal, displayed OVR, constraint messages, remaining/over-budget indicators, and labels. These are observations, not inferred budget equations.
- **Badge qualification:** badge ID, discipline, tier (`bronze|silver|gold|hall-of-fame|legend`), qualification status, requirement expression if displayed, and evidence. Qualification is separate from equip state.
- **Slots:** default and bonus slot counts by discipline and source, occupied slot records, remaining count, cross-discipline flexibility, and unknown availability.
- **Badge Tokens:** balances by discipline and provenance class (`default`, `event-locked`, `bonus-flexible`, `other`, `unknown`); per-badge/tier/context equip cost observations; spend allocation and remaining balance. Do not infer a general cost table from example screenshots.
- **Loadouts:** loadout identifier/index, availability/unlock state, active status, equipped badge placements, slot/token arithmetic, and unlock-source provenance.
- **Synergy:** each placement pair with pair/slot index, boost magnitude, Fuse badge/tier, Reaction badge/tier, legality observation, discipline lock, source/permanence/season expiry, activation threshold as known/unknown, and cost-waiver effect. Preserve pair cardinality as observed/inferred with confidence; do not flatten into a badge score.
- **Animations:** animation ID/name/category, availability, observed requirements represented as `AND`/`OR` expressions, body gates, equipped/selected status if visible, and provenance.
- **Takeovers:** five discipline slots, ability ID/name, default/unlock state, observed requirements, specialist/default classification, selected state, progression reward/perk metadata, and unknowns.
- **Cap Breakers:** preview per attribute, quantity/source assumptions, body-cap interaction status, pre/post values, badge/animation/Takeover effects only when observed, and disputed assumptions.
- **Evidence quality:** field confidence, extraction warnings, source conflicts, public-source alternatives, disputed assumptions, and redaction notes.

Canonical IDs are stable lowercase identifiers; display text and aliases remain versioned data. Requirement expressions use typed `all`, `any`, `threshold`, `range`, and `bodyGate` nodes. Units are explicit. Schema migrations are pure, one-way, fixture-tested functions and retain the original evidence record.

### 6. Desired-build input contract

`DesiredBuildRequest` is versioned and validated before oracle work. It contains:

```json
{
  "schemaVersion": "1.0.0",
  "requestId": "example-two-way-wing",
  "gameVersionPolicy": { "mode": "exact", "value": "observed-app-build" },
  "unknownDataPolicy": "reject-hard-and-penalize-soft",
  "hardConstraints": [
    { "kind": "position", "allow": ["small-forward"] },
    { "kind": "bodyRange", "field": "heightInches", "min": 78, "max": 80 },
    { "kind": "badgeTier", "badge": "challenger", "minTier": "gold" },
    { "kind": "exclusion", "target": "animation", "values": ["example-unwanted-package"] }
  ],
  "softPreferences": [
    { "id": "shooting", "kind": "attributeTarget", "field": "threePointShot", "target": 88, "range": { "acceptableMin": 85, "idealMin": 88 }, "weight": 4, "priority": 1 },
    { "id": "defense", "kind": "badgeTier", "badge": "challenger", "targetTier": "hall-of-fame", "weight": 5, "priority": 1 },
    { "id": "handling", "kind": "attributeRange", "field": "ballHandle", "min": 80, "max": 86, "weight": 2, "priority": 2 }
  ],
  "aliases": { "react": "reaction-badge", "badge points": "badge-tokens", "3pt": "threePointShot" },
  "optimization": { "nearTieAbsolute": 0.02, "nearTieRelative": 0.01, "maxOracleQueries": 250, "maxWallClockMinutes": 120 },
  "assumptions": [{ "id": "cap-breakers", "statement": "No Cap Breakers available", "value": 0, "disputed": false }]
}
```

Contract rules:

- Hard constraints are Boolean feasibility predicates. A hard constraint with unknown required data follows `unknownDataPolicy`; it is never silently passed.
- Soft preferences are normalized monotonic/piecewise utility functions with user-visible weights and integer priorities. Priorities are lexicographic bands; weights compare preferences within a band. This prevents many low-priority points from defeating one declared higher-priority desire.
- Accepted range semantics are inclusive and units are explicit. `target`, `acceptable`, and `ideal` ranges produce named score segments so the report can explain partial credit.
- Exclusions can target body values, badges, animations, Takeovers, labels, or assumptions. They cannot target hidden implementation selectors.
- Alias resolution is case/spacing normalized but closed against the versioned canonical vocabulary. Ambiguous or unknown aliases fail with candidate suggestions; user aliases never change stored canonical terminology.
- Duplicate or contradictory constraints, impossible ranges, non-finite/negative weights, unknown preference kinds, and hard/soft conflicts fail before optimization.
- `unknownDataPolicy` is one of: `reject-any`, `reject-hard-and-penalize-soft` (default), `allow-with-explicit-penalty`, or `pause-for-observation`. The penalty must be declared and shown; “assume satisfied” is not allowed.

Validation examples:

- Valid: height 6'6"–6'8", Gold-or-better Challenger as hard, 88 three-point as weighted soft, no named animation package, and zero Cap Breakers assumed.
- Invalid: `min: 80, max: 78`; reject before queries.
- Invalid: hard `height >= 81` and hard `height <= 78`; report the minimal contradictory set.
- Invalid: alias `react` used as a third badge class; normalize only to `reaction-badge` when the constraint kind supports it, otherwise reject.
- Unknown case: Hall-of-Fame Challenger is requested against conflicting public tables and not observed in the selected app version. Under the default policy it cannot pass a hard constraint and incurs the declared uncertainty treatment if soft.

### 7. Black-box experiment and multi-objective optimization strategy

Use a staged constrained optimizer; do not enumerate the full Cartesian attribute space.

1. **Canonicalize and validate.** Resolve aliases, compile hard constraints and soft utility functions, pin schema/app/game/host-profile policy, and calculate a request hash.
2. **Reuse evidence.** Query the observation cache by exact context and candidate hash. A candidate hash includes all body/position/path/attribute inputs and assumption set; a result hash includes oracle/app/game/region/schema versions. Never reuse across an incompatible version. Same-input duplicate observations are retained as replicates but deduplicated for proposal scoring.
3. **Seed safely.** Start from user baselines, observed Signature Blueprint/community candidates when provenance allows, and boundary points implied by accepted observed thresholds. Public disputed thresholds create experiments, not facts.
4. **Learn feasibility.** Fit an interpretable feasibility surrogate over accepted/rejected complete candidates and rejection reason classes. Begin with stratified body/position samples, then active-learn near uncertain boundaries. The surrogate may prioritize queries but never declare a candidate feasible without an oracle observation.
5. **Generate candidates.** Use constraint-aware mutation from feasible seeds: one body variable or small related attribute group at a time; reject locally provable hard violations; preserve complete vectors. Use deterministic seeded proposal ordering.
6. **Sensitivity sweeps.** Around each promising candidate, sweep each adjustable attribute down/up to the next observed UI step and around threshold neighborhoods. Record label, OVR, cap, qualification, cost, animation, Takeover, and Cap Breaker discontinuities. Perform pairwise sweeps only where one-at-a-time effects show coupling or rejection.
7. **Allocate queries.** Alternate exploitation of predicted Pareto improvement with exploration of high feasibility/utility uncertainty. Reserve a fixed portion (for example 20%, request-configurable) for boundary learning, and stop spending on repeatedly infeasible regions.
8. **Evaluate objectives.** First filter oracle-confirmed hard feasibility. Then compute a vector of per-preference utilities and uncertainty/cost components. Costs remain separate dimensions: attribute opportunity cost proxy only if observed, Badge Token use by discipline, occupied slots, Synergy placements, Cap Breakers, and number/severity of disputed assumptions.
9. **Pareto rank.** Non-dominated sorting uses unrounded objective vectors, then confidence dominance. Aggregate weighted score is an explanation/tie organizer, not the sole selector. Preserve alternatives that trade one desire for another.
10. **Confirm finalists.** Re-query each finalist at least once from a reset baseline. Require exact observed inputs and critical outputs; disagreement lowers confidence and triggers one bounded diagnostic replicate, not majority-vote truth.

Caching and replay requirements:

- Content-address raw evidence, normalized observations, proposal manifests, and reports. Writes are append-only per run; corrections create superseding records.
- Detect duplicate candidate inputs before any live query. Cache hits must state exact context match and evidence IDs.
- Persist PRNG seed and proposal sequence. Offline replay must regenerate normalization, scoring, Pareto fronts, and report bytes after volatile timestamps are excluded.
- Cache invalidation is context-based, not deletion-based. A new app/game/schema/parser/host-profile version forms a new partition.

Confidence:

- Report field extraction confidence separately from candidate confidence.
- Candidate confidence combines coverage of hard constraints, proportion of soft objectives observed rather than inferred, repeatability, version match, and disputed-assumption burden. It is a transparent component vector, not an unexplained probability.
- OCR-only critical values require manual or second-cue confirmation. Public-source-only values cannot establish live feasibility.

Stopping rules, evaluated in order:

1. explicit cancellation or safety/state mismatch;
2. query, wall-clock, or failure budget exhausted;
3. no new feasible candidate and no Pareto improvement above configured epsilon over a configured patience window;
4. feasibility surrogate uncertainty below a declared threshold in the hard-constraint neighborhood and all current finalists confirmed;
5. a user-defined aspiration target is met and confirmed;
6. no approved action can reveal the remaining hard unknown.

Always return the reason, unused budget, unexplored regions, and whether stopping supports `winner`, `near-tie set`, `no feasible candidate`, or `insufficient evidence`.

Near ties: a candidate joins the near-tie set when it is Pareto non-dominated and either its normalized aggregate differs from the best by at most both configured absolute/relative thresholds, or their confidence intervals overlap while neither confidence-dominates. Thresholds come from the request and are displayed. Rounding occurs only after tie classification.

### 8. Result and comparison contract

Emit machine-readable `OptimizationReport` JSON plus a concise Markdown rendering. The JSON contains:

- request/context/schema versions, run/observation IDs, stop reason, budgets, and candidate count;
- `decision: winner|near-tie|no-feasible|insufficient-evidence`;
- one selected candidate only when it confidence-dominates under the declared rules; otherwise an ordered near-tie/Pareto list;
- complete body/attribute inputs and observed build labels;
- each hard desire as `satisfied|missed|unknown` with evidence;
- each soft desire's raw observed value, utility function segment, weight, priority, normalized contribution, and reason;
- separate resource costs: slots, Badge Tokens/balances, loadout placements, Synergy pairs, Cap Breakers, and unknown opportunity costs;
- disputed assumptions and version/source conflicts; field and candidate confidence components;
- comparison deltas against the top option for every body/attribute, desire score, cost, badge tier/qualification, animation, Takeover, and unknown;
- replay manifest/hash and raw evidence references, with no credential, account, or machine-private path.

Markdown rendering is bounded to: outcome and confidence; compact candidate table; satisfied desires; missed/unknown desires; cost table; disputed assumptions; why the winner leads or why options tie; and the three most material deltas per alternative. It must say “unknown,” not omit adverse evidence. A near-tie report must not manufacture a single winner.

## Ordered Implementation Plan

### Work unit 0 — repository placement approval (blocking)

1. Decide whether this unrelated, closed-inventory harness repository is intentionally becoming the implementation host. It currently has no `src/` subtree and its package/manifest describe only the OpenCode harness runtime.
2. Preferred decision: implement in a separate application repository. If the user explicitly selects this repository, approve creation of the isolated paths below and corresponding manifest/package changes as a separate scope; do not mix Builder logic into `bin/opencode-harness.mjs` or `.opencode/`.
3. Pin target BlueStacks host OS, permitted local transport, retention policy, and whether only manual/replay modes or later UI modes are in scope.

Exit gate: written placement and capability decision. Until then, no implementation file may be created.

### Work unit 1 — pure contracts, fixtures, and replay

1. Add closed JSON schemas for observations, desired requests, experiments, and reports.
2. Add canonical vocabulary/alias resolution and schema validators.
3. Implement content hashing, append-only evidence references, deterministic migrations, and replay oracle.
4. Add synthetic fixtures covering known, unknown, disputed, malformed, and version-mismatch cases.

Exit gate: all schema fixtures and deterministic replay tests pass offline without BlueStacks, network, credentials, or mutable global state.

### Work unit 2 — scoring and optimizer core

1. Compile hard predicates and lexicographic soft utilities.
2. Implement exact-context cache, candidate deduplication, deterministic proposal manifests, feasibility learner interface, sensitivity sweeps, Pareto sorting, confidence components, near-tie logic, and stopping rules.
3. Implement JSON and Markdown reports with auditable score/delta breakdowns.

Exit gate: property/fixture tests prove hard constraints cannot be outweighed, unknowns follow policy, dominated candidates cannot win, near ties are retained before rounding, and replay is byte-stable modulo declared volatile fields.

### Work unit 3 — manual capture workflow

1. Generate deterministic operator worksheets from proposed candidates.
2. Import manually transcribed values and user-provided screenshots with hashes and provenance.
3. Require two-cue/manual confirmation for critical values and provide correction-by-supersession.

Exit gate: an end-to-end synthetic/manual fixture produces a report without any live adapter and every output field traces to evidence.

### Work unit 4 — read-only BlueStacks host adapter (separate approval)

1. Implement preflight and host profile calibration for the specifically approved OS/instance/channel.
2. Add screenshot and optional supported UI-hierarchy capture; redact and classify auth/account/modal boundaries.
3. Implement state recognition only; no input actions.

Exit gate: approved-host dry run proves no input/mutation, uniquely identifies the instance/version/context, recognizes fixtures/live checkpoints with declared confidence, and fails closed on ambiguity. Independent validator evidence is required.

### Work unit 5 — bounded Builder UI control (separate per-run approval)

1. Implement semantic transitions, versioned selector/template mappings, baseline reset/readback, action journaling, and stop/recovery behavior.
2. Restrict allowlisted actions to Builder navigation and value adjustment; prohibit finalize/upload/share/account actions at the adapter boundary.
3. Run a tiny approved canary (one baseline plus one reversible attribute change) before any optimization budget.

Exit gate: independent review demonstrates bounded actions, checkpoint guards, one-retry policy, no unexpected action after mismatch, restoration to an observed baseline, and retained evidence. User approval is required again before a larger query budget.

### Work unit 6 — active optimization and version refresh

1. Enable bounded oracle querying only after work units 1–5 pass and budgets are approved.
2. Learn feasibility, run sensitivity sweeps, confirm finalists, and emit Pareto/near-tie reports.
3. On version drift, quarantine the old partition for replay, rerun calibration/canary, and never auto-migrate observations as current truth.

Exit gate: report passes independent artifact proof and sampled live replay; no recommendation relies on unresolved hard unknowns or incompatible-version cache entries.

### Work unit 7 — optional network diagnostic (not required; separate legal approval)

1. Document a specific question UI evidence cannot answer and why metadata/app-provided exports are proportionate.
2. Obtain legal/ToS and user approval defining allowed fields, retention, redaction, and stop conditions.
3. Implement only the approved metadata/export adapter. If useful data requires credentials, TLS decryption, certificate installation, pinning bypass, patching, or private endpoint replay, stop and reject this path.

Exit gate: security review and independent validator show no content/credential capture and no dependency of optimizer correctness on network access.

## Exact Future File Contracts

These paths are proposed only if work unit 0 explicitly approves using this repository. They do not currently exist.

| Path | Contract |
| --- | --- |
| `src/nba2k27-myplayer/index.mjs` | Public library exports only; no side effects or live capability selection. |
| `src/nba2k27-myplayer/cli.mjs` | CLI parser; defaults to replay/manual and dry-run; live modes require explicit approval artifact. |
| `src/nba2k27-myplayer/schemas/build-observation.schema.json` | Closed Draft 2020-12 `BuildObservation`, known/unknown values, provenance, and mechanic separation. |
| `src/nba2k27-myplayer/schemas/desired-build-request.schema.json` | Closed request grammar for constraints, preferences, weights/priorities, ranges, exclusions, aliases, policy, budgets, and assumptions. |
| `src/nba2k27-myplayer/schemas/experiment-manifest.schema.json` | Candidate/proposal order, seed, context, transitions, query budgets, evidence references, and stop reason. |
| `src/nba2k27-myplayer/schemas/optimization-report.schema.json` | Winner/near-tie/no-result structure, score components, costs, confidence, assumptions, deltas, and replay references. |
| `src/nba2k27-myplayer/domain/vocabulary.mjs` | Canonical mechanic/attribute IDs and versioned display aliases; canonical Fuse/Reaction/Badge Token terminology. |
| `src/nba2k27-myplayer/domain/validation.mjs` | Closed schema plus semantic validation and contradiction diagnostics; no oracle calls. |
| `src/nba2k27-myplayer/domain/provenance.mjs` | Content IDs, version-context comparison, field evidence, disputes, and supersession. |
| `src/nba2k27-myplayer/domain/requirements.mjs` | Typed `all`/`any`/threshold/range/body-gate evaluation with tri-state known/unknown results. |
| `src/nba2k27-myplayer/state/builder-state-machine.mjs` | Semantic states/transitions, pre/postconditions, retry and recovery classification; no host commands. |
| `src/nba2k27-myplayer/state/host-profile.mjs` | Versioned selectors/templates/geometry contract and compatibility checks. |
| `src/nba2k27-myplayer/oracle/oracle.mjs` | Interface: `preflight`, `plan`, `observe`, optional approved `execute`, and `recover`; typed capabilities. |
| `src/nba2k27-myplayer/oracle/replay-oracle.mjs` | Fixture/evidence replay; mandatory default and CI oracle. |
| `src/nba2k27-myplayer/oracle/manual-capture-oracle.mjs` | Worksheet/export/import flow; no host access. |
| `src/nba2k27-myplayer/oracle/bluestacks-ui-oracle.mjs` | Approval-gated black-box adapter; delegates host specifics and enforces action allowlist. |
| `src/nba2k27-myplayer/oracle/host-adapter.mjs` | Abstract approved-host transport; command arrays only, no shell interpolation; bounded outputs/timeouts. |
| `src/nba2k27-myplayer/oracle/network-metadata-oracle.mjs` | Optional metadata/app-export interface; compile/runtime disabled unless separately approved; no decrypt/bypass API. |
| `src/nba2k27-myplayer/capture/recognizers.mjs` | Two-cue state/field recognizers with confidence and unknown output. |
| `src/nba2k27-myplayer/capture/normalize-observation.mjs` | Pure raw-to-versioned model normalization; preserves raw evidence hashes. |
| `src/nba2k27-myplayer/optimizer/cache.mjs` | Exact-context content-address cache and deduplication; append-only records. |
| `src/nba2k27-myplayer/optimizer/feasibility.mjs` | Interpretable proposal-prioritization model; cannot certify unobserved feasibility. |
| `src/nba2k27-myplayer/optimizer/propose.mjs` | Deterministic seeded candidate generation and active query allocation. |
| `src/nba2k27-myplayer/optimizer/sensitivity.mjs` | One-at-a-time and justified pairwise boundary sweeps. |
| `src/nba2k27-myplayer/optimizer/objectives.mjs` | Hard filters, lexicographic soft utilities, explicit costs, and score explanations. |
| `src/nba2k27-myplayer/optimizer/pareto.mjs` | Non-dominated sorting, confidence dominance, near-tie classification before rounding. |
| `src/nba2k27-myplayer/optimizer/run.mjs` | Budgeted orchestration, stopping rules, finalist confirmation, and replay manifest. |
| `src/nba2k27-myplayer/report/render-json.mjs` | Schema-valid machine report. |
| `src/nba2k27-myplayer/report/render-markdown.mjs` | Concise human comparison generated only from report JSON. |
| `src/nba2k27-myplayer/security/approval.mjs` | Parses scoped approval artifacts, capability/run binding, expiry, and fail-closed decisions. |
| `src/nba2k27-myplayer/security/redaction.mjs` | Removes account identifiers, credentials, host/user paths, free-text surprises, and notification content. |
| `src/nba2k27-myplayer/observability/events.mjs` | Closed structured event vocabulary, monotonic sequence, reason codes, and evidence IDs. |
| `test/nba2k27-myplayer/*.test.mjs` | Node test suites corresponding to schema/domain/state/oracle/optimizer/report/security boundaries. |
| `test/nba2k27-myplayer/fixtures/synthetic/` | Fully synthetic valid/invalid/version-drift/unknown/dispute observations and requests; safe for source control. |
| `test/nba2k27-myplayer/fixtures/replay/` | Redacted deterministic transition/evidence manifests; no account or machine data. |
| `docs/nba2k27-myplayer/operator-safety.md` | Capability matrix, approvals, dry-run, stop/recovery, retention, and prohibited actions. |
| `docs/nba2k27-myplayer/data-contract.md` | Schemas, canonical vocabulary, unknown/dispute/version semantics, and migration rules. |
| `docs/nba2k27-myplayer/optimization.md` | Objective semantics, Pareto/near-tie/confidence/stopping explanations and limitations. |

Do not store live raw captures in Git. A future ignored runtime root such as `.local/nba2k27-myplayer/` may be selected only after repository placement approval and must contain `runs/`, `evidence/`, and `cache/` with owner-only permissions. The exact ignore rule and retention policy are implementation-scope changes, not authorized by this plan.

Because `.opencode/harness.manifest.json` is a closed source inventory and `package.json` currently packages the harness runtime, adding these files here also requires an explicit product-boundary decision: either update the inventory/package/test scripts intentionally, or keep this application in a separate repository. The Builder workflow must not become an OpenCode plugin, command, agent, or harness runtime dependency.

## Observability and Failure Handling

Structured events include `run.started`, `preflight.checked`, `state.recognized`, `transition.planned`, `transition.executed`, `observation.captured`, `field.unknown`, `candidate.cache_hit`, `candidate.proposed`, `candidate.rejected`, `pareto.updated`, `recovery.blocked`, `budget.exhausted`, and `run.stopped`. Each carries schema/event version, run and sequence IDs, monotonic time, state/candidate/evidence IDs, outcome/reason code, confidence, and redacted details. Never log screenshots inline, OCR free text, command strings containing user paths, UI hierarchy dumps, account identity, tokens, headers, or clipboard content.

Failure policy:

- **Validation/version failure:** no oracle activity; return actionable contract errors.
- **Capability/preflight failure:** block the requested mode and offer replay/manual fallback only.
- **State/selector drift:** stop input immediately, preserve checkpoint, and require host-profile review.
- **Connectivity/auth screen:** stop; do not manipulate account/network state.
- **Parse/OCR ambiguity:** emit unknown and request manual confirmation; never guess a critical metric.
- **Oracle disagreement:** retain replicates, lower confidence, run at most one approved diagnostic replicate, then report dispute.
- **Budget exhaustion:** return best confirmed Pareto set plus coverage gaps, not an unqualified winner.
- **Evidence write failure or unsafe permissions:** stop before further app input because auditability is part of the safety boundary.

## Dependencies

1. Accepted research basis: `[R1]` plus exact F1 correction `[R2]`, independently accepted by `[V2]`.
2. Independent review of this plan must pass before parent acceptance.
3. Work unit 0 placement, host, transport, retention, and capability decisions precede implementation.
4. Pure schemas/replay precede optimizer; optimizer precedes manual end-to-end; manual mode precedes live read-only adapter; read-only recognition precedes any input; canary control precedes optimization queries.
5. Live operation requires a supported BlueStacks host, a user-managed already-authenticated app state, current version/context capture, and explicit scoped approvals. None is established now.
6. Network diagnostic work has an independent legal/ToS/security dependency and is not on the critical path.

## Executable Verification Gates

The following are future commands from the approved implementation repository root; they were not run in this planning task. File-level tests should use Node 24's built-in test runner and avoid live dependencies in default CI.

```sh
node --check src/nba2k27-myplayer/cli.mjs
node --test test/nba2k27-myplayer/*.test.mjs
node src/nba2k27-myplayer/cli.mjs validate-request --input test/nba2k27-myplayer/fixtures/synthetic/request-valid.json
node src/nba2k27-myplayer/cli.mjs validate-observation --input test/nba2k27-myplayer/fixtures/synthetic/observation-valid.json
node src/nba2k27-myplayer/cli.mjs optimize --oracle replay --dry-run --request test/nba2k27-myplayer/fixtures/synthetic/request-valid.json --replay test/nba2k27-myplayer/fixtures/replay/baseline.json
node src/nba2k27-myplayer/cli.mjs replay --manifest test/nba2k27-myplayer/fixtures/replay/baseline.json --assert-deterministic
git diff --check
```

Required test assertions:

- schemas reject extra fields, bare null unknowns, malformed provenance, incompatible versions, contradictory ranges, alias ambiguity, and invalid weights/budgets;
- hard constraints always filter before scoring; unknown-hard policy is honored; lexicographic priorities and piecewise score breakdowns match fixtures;
- badge qualification, slot occupancy, token balance/cost, loadout, and Synergy pair placement cannot be conflated by schema or scoring;
- cache keys include complete candidate and context; duplicates do not query; incompatible app/game/schema versions never hit;
- seeded proposals and replay rankings are deterministic; Pareto and near-tie classification occur before display rounding;
- state transitions reject wrong source/target cues, bounded retry is enforced, and unexpected modal/auth/version drift produces no next input;
- redaction fixtures remove credentials/account/path/free-text content; shell interpolation is impossible at the host-adapter boundary;
- reports enumerate satisfied/missed/unknown desires, explicit costs, assumptions, confidence, and deltas, and do not select a winner for near-tie/insufficient-evidence fixtures.

Future approved-host gates must be explicit commands exposed by the same CLI, but exact host invocation flags cannot be finalized until work unit 0 selects the host transport. The required semantic gates are `preflight --observe-only --dry-run`, `calibrate --no-input`, and an independently approved `canary --max-actions <small-bound>`. This plan intentionally does not invent a Windows/macOS command or ADB endpoint before that decision.

If implementation occurs in this harness repository, its existing source acceptance also remains required after intentional manifest/package updates:

```sh
node .opencode/scripts/validate-harness.mjs
npm pack --dry-run --json
```

No live BlueStacks test, provider/network call, credential use, or account action belongs in default CI.

## Explicit Approval Decisions Required

1. **Repository:** separate application repository (recommended) or intentional new application subtree in this closed-inventory harness repository.
2. **Host:** Windows or macOS BlueStacks host, exact version/instance, and whether execution is local to that host or through a narrowly defined operator-managed bridge.
3. **Initial scope:** replay/manual only (recommended first milestone), then separately read-only UI observation, then separately bounded UI control.
4. **Control channel:** whether the user will enable an official/local BlueStacks control channel. The workflow will not enable it automatically.
5. **Retention/privacy:** approved owner-only runtime root, screenshot/UI-tree retention duration, redaction review, and whether any sanitized captures may become fixtures.
6. **Mutation boundary:** whether reversible Builder value changes are allowed; finalization, upload/share, purchase, gameplay, account, and save deletion remain excluded unless a future plan explicitly changes scope.
7. **Budgets:** per-run action/query/time/failure bounds and whether app/emulator restart is allowed. Default is no restart.
8. **Network:** keep disabled (recommended), or commission a separate legal/ToS/security review for metadata/app-provided export only. TLS/pinning bypass and credential capture are not approval options under this plan.
9. **Unknown policy and ranking:** confirm default `reject-hard-and-penalize-soft`, priorities/weights, and near-tie thresholds before live optimization.

## Assumptions, Tradeoffs, and Open Questions

### Assumptions

- Canonical terms are Badge Tokens, Fuse Badges, and Reaction Badges; user terms “badge points” and “React” are aliases only.
- The app's displayed result is authoritative only within its recorded version/context and can itself be incomplete or inconsistently extracted.
- Human-assisted capture is acceptable as the safety fallback, so throughput is subordinate to provenance and recoverability.
- Independent validator evidence, not lifecycle logs or this plan, is required for acceptance of each implementation/live gate.

### Tradeoffs

- UI tracing is slower and can drift, but minimizes credential/legal exposure and observes user-visible truth. Semantic checkpoints plus manual fallback are preferred over a faster, fragile coordinate script.
- An exact black-box cache requires more observations after updates, but prevents stale cross-version conclusions.
- Lexicographic priorities preserve user intent better than one weighted sum, at the cost of more alternatives; Pareto/near-tie reporting makes that tradeoff explicit.
- Confirmation queries reduce optimization breadth but materially improve trust in finalists.

### Open questions

1. Which host/BlueStacks version and non-circumventing local capabilities are actually available?
2. Can all required summary metrics be viewed without saving/uploading a build? If not, which remain unknown?
3. Which exact UI screens expose slot distribution, token costs/balances, loadouts, Synergy legality/triggers, animations, Takeovers, and Cap Breaker effects for the selected user state?
4. What user-owned progression state should be modeled (tokens, bonus slots, loadouts, Synergy, Cap Breakers), and may it be read without account mutation?
5. What are the user's first real hard constraints, soft utilities, budgets, and acceptable uncertainty/near-tie thresholds?
6. Should sanitized observations be private runtime evidence only, or may selected captures/transcriptions become approved fixtures?

## Evidence Basis

- **[R1]** `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/researcher/root-researcher-001-builder-evidence.md`
- **[R2]** `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/researcher/root-researcher-003-builder-evidence-remediation.md`, whose exact replacement supersedes only R1 finding 2.4.
- **[V1]** `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/root-validator-002-research-proof.md`, retained for command-backed source findings and the corrected F1 history.
- **[V2]** `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/root-validator-004-research-recheck.md`, which passes `gate-current-research` and confirms the S5/S11 distinction.

## Handoff

- Next role: `validator` in fresh `review` mode, bounded to this plan, its acceptance criteria, the accepted research chain, and command-checkable artifact structure. Implementation remains prohibited until that review passes and the user resolves work unit 0 approvals.
- Limitations: No BlueStacks/app/process/network/ADB inspection, source implementation, schema execution, optimizer prototype, live capability test, credentials, account action, configuration, or Git operation occurred. The proposed `src/`, `test/`, and `docs/` paths do not exist, and this repository may be the wrong implementation host.
- Risks: UI and mechanics may change at any time; the actual host boundary is unknown; some metrics may require prohibited mutation; OCR/UI hierarchy may be unavailable; user progression changes feasible loadouts; and no optimizer can certify unobserved black-box feasibility. Network tracing remains deliberately nonessential and restricted.

### Required planner output fields

- orderedPlanOrResolvedConclusions: Work units 0–7 and Planning Decisions sections above.
- fileContractsOrDecisions: Exact Future File Contracts and Explicit Approval Decisions Required sections above.
- dependencies: Dependencies section above.
- verificationGates: Executable Verification Gates section above.
- handoffNotes: Handoff section above.
- traceArtifactPath: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/planner/root-planner-003-agentic-workflow.md`
