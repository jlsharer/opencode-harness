# NBA 2K27 MyPLAYER Builder Evidence

## Metadata

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- role: `researcher`
- artifactId: `root-researcher-001-builder-evidence`
- createdAt: `2026-08-21`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: A contract-complete `research` packet asking what public evidence discoverable through 2026-08-21 establishes NBA 2K27 MyPLAYER Builder mechanics, badge requirements, and the new Fuse, React, and badge-points system, with implications for a later optimizer.
- Required context present: Yes. The scoped question, source and freshness constraints, downstream needs, relevant paths, and documentation target were supplied. `delegationTaskId` is `dt-research-builder-002`; `scopeKey` is `nba-2k27-builder-evidence`; `dispatchKind` is `fresh`; `taskMode` is `research`.
- Routing metadata status: `absent`; no routing values were invented.

## Work Performed

- Summary: Read the role contract, trace schema, and memory template; retrieved official 2K feature, newsroom, companion-app, store, and image sources; cross-checked the newly published badge thresholds against three specialist publications; and separated official mechanics, corroborated pre-release data, discrepancies, and inference. Research is a point-in-time sample, not a claim of literal web exhaustiveness.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; `.memory/templates/role-trace-artifact.md`.
- Files changed: This trace artifact only.
- Commands/checks: No shell commands. Direct URL retrievals were performed on 2026-08-21. Google returned no usable results, Bing was noisy, and DuckDuckGo later presented a bot challenge; direct source pages rather than snippets support the findings below.

## Output Contract

- Outputs: Cited findings, source list, implementation implications, risks, unresolved questions, and recommended next role.
- Evidence: Official 2K sources establish the system-level rules. NBA2KLab, NBA 2KW, and Sports Gamers Online publish substantially matching Community Day/app-derived badge tables, but several conflicting cells prevent treating the pre-release table as immutable ground truth.
- Artifact links: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/researcher/root-researcher-001-builder-evidence.md`

### Cited Findings

#### 1. Terminology correction and evidence status

- **Official:** 2K calls the system **Synergy**, its two components **Fuse Badges** and **Reaction Badges**, and the equip currency **Badge Tokens**. The supplied terms “React” and “badge points” should therefore be normalized only as user aliases, not stored as canonical mechanic names. [S1][S2]
- **Official:** The public system description is now substantive, not merely a leak: 2K published a detailed feature page and press release on August 18, and launched the official NBA 2K HQ app with the full Builder on August 21. [S1][S2][S3][S4]
- **Corroborated but pre-release:** Exact badge thresholds are visible in multiple specialist tables dated/retrieved August 21 and attributed to Community Day, the companion app, or a named compiler. NBA2KLab explicitly warns that 2K can change the data before full release. [S6][S7][S8]

#### 2. Builder inputs and paths

- **Official:** The Builder supports Create Your Own, Community Builds, and the new Signature Blueprints path. Signature Blueprints replace Pro-Tuned and NBA templates; 40 templates are planned at launch, each shaped by three NBA/WNBA comparisons, with more added each Season. [S1][S2]
- **Official:** Appearance sex does not change the mechanical framework: male and female MyPLAYERs use the same height, weight, wingspan, and ratings framework; the save-file selection is locked. [S1][S2]
- **Official:** Size and position affect badge eligibility and token cost, with real-time feedback as attributes change. Taller and shorter players can pay different token amounts for the same badge. [S1]
- **Official/direct image evidence:** The official Badge Tokens asset shows six discipline balances and per-badge token costs in the loadout UI. It demonstrates that token availability and equip cost are separate values, but one screenshot is not a general cost table. [S5]
- **Official:** The full Builder is available in NBA 2K HQ, builds can be uploaded to the home setup and shared by QR/link, and the app allows up to 15 builds. The app requires a persistent connection and iOS 18+ or Android 11+. [S3][S4]
- **Corroborated:** NBA2KLab's 40-blueprint table exposes a useful observed shape for later data collection: position, focus, height, weight, wingspan, starting attribute values, sometimes attribute caps, comparisons, and badges unlocked at those starting values. It labels the data Community Day material and warns of pre-release change. [S9]

#### 3. Badge inventory, qualification, slots, and progression

- **Official:** NBA 2K27 has **53 badges**, including **19 new badges**, across Shooting, Finishing, Playmaking, Defense, Rebounding, and Physicals. The official page names and describes all 53. Its category counts are 9 Shooting, 11 Finishing, 10 Playmaking, 12 Defense, 5 Rebounding, and 6 Physicals. [S1]
- **Official:** Build creation exposes Bronze, Silver, Gold, and Hall of Fame qualification; Legend cannot be obtained at build creation but can be reached through Synergy. [S1]
- **Official:** Every build starts with **20 badge slots** distributed across the six disciplines. Slots are immediately open, but Badge Tokens must be earned and spent to equip qualifying badges. Attribute requirements put a badge into inventory; token spending and slot occupation are separate constraints. [S1][S2]
- **Official:** Badge-token progression is by six discipline meters rather than one meter per badge and comes from relevant play, Team Practice drills, and Gatorade workouts. Tokens can be reassigned; event-earned tokens remain discipline-locked, while Bonus Slots and Bonus Tokens from Build Specialization, Seasons, and Crew rewards can be reassigned among disciplines. [S1]
- **Official:** Loadouts are different saved badge combinations. A build starts with one and can earn three more through REP, Challenges, and Crews; the active loadout can be swapped before tip-off. [S1][S2]
- **Official:** Rebirth returns in four tiers. At 90 OVR it can start a new build at the highest previously reached OVR and unlock a percentage of default Badge Tokens. [S1]
- **Single specialist source:** NBA2KLab reads the in-game Rebirth screen as Tier I (90+ OVR, 25% default tokens), Tier II (95+ OVR, 50%), Tier III (two 95+ builds, 75%), and Tier IV (three 95+ builds, all), with 15% faster badge progression shown for Tiers I-III. These exact tier values are not stated on the official text page and remain pre-release/single-source for this trace. [S10]

#### 4. Fuse and Reaction mechanics

- **Official:** Synergy can push a badge beyond its normal tier, including to Legend. 2K states that the system has **16 total Synergy slots**, 12 conferring +1 and four conferring +2. [S1]
- **Official:** A Fuse Badge receives its +1/+2 for the entire game and costs no Badge Tokens while occupying the Fuse slot; the tokens that would equip it are freed. [S1]
- **Official:** A Reaction Badge is paired to a Fuse Badge. After the Fuse badge activates a set number of times in a game, the Reaction badge automatically receives the same +1/+2 for the rest of that game. [S1]
- **Direct official image evidence plus inference:** The official Synergy UI shows eight vertical Fuse/Reaction pairs—six labeled +1 and two labeled +2—which accounts for 16 badge placements and matches the prose totals of twelve +1 placements and four +2 placements. Treat “eight pairs” as a strong image-based inference until 2K states pair cardinality in text. The image example says frequent activation of Fuse Aerial Wizard boosts paired Reaction Flash from Silver to Gold for the remainder of the game. [S11]
- **Official:** Synergy can be earned through Season rewards, Build Specialization, Crew progression, and REP. Season-derived Synergy expires at season end; Build Specialization, Crew, and REP Synergy is permanent across account save files. All slots are cross-discipline except Build Specialization slots, which are locked to their discipline. [S1]
- **Unestablished:** Public official prose does not provide each Fuse badge's activation count, pairing restrictions, stacking behavior, re-trigger behavior, or a complete mapping of acquisition source to exact slot. Those cannot safely be hard-coded. [S1][S11]

#### 5. Badge requirement table and confidence

- **Corroborated data shape:** The three specialist pages agree that a badge tier requirement is a conjunction or disjunction of one or more attribute thresholds plus an optional minimum/maximum height. A later optimizer therefore needs an expression tree (`AND`/`OR`), not one scalar threshold. [S6][S7][S8]
- **Corroborated examples:** All three sources agree on many high-interest breakpoints, including Gold Posterizer = Driving Dunk 93 **AND** Vertical 80; Gold Limitless Range = Three-Point Shot 93; Gold Ankle Assassin = Ball Handle 93; Gold Handles for Days = Ball Handle 90; Gold Glove = Steal 93; and Gold Boxout Boss = Defensive Rebound 90 **AND** Strength 88. [S6][S7][S8]
- **Corroborated height gates:** Examples agreed across the specialist tables include Mini Marksman max 6'4", Paint Prodigy min 6'3", Rise Up/Post Powerhouse/Paint Patroller/Post Lockdown/Wall Up/Brick Wall min 6'5", and Ankle Braces/Seatbelt max 6'9". [S6][S7][S8]
- **Material conflicts:** The current public tables are not byte-equivalent. NBA2KLab and Sports Gamers Online list Hall-of-Fame Challenger at 98 Perimeter Defense, while NBA 2KW lists 96. NBA2KLab lists Bronze Wall Up at 80 Interior Defense + 75 Strength, Sports Gamers Online also lists 80 + 75, while NBA 2KW lists 60 + 75. NBA2KLab lists Silver Brick Wall at 93 Strength, while NBA 2KW and Sports Gamers Online list 83. NBA2KLab and Sports Gamers Online list Hall-of-Fame Post Powerhouse at 95 Post Control + 95 Strength, while NBA 2KW lists 96 + 95. [S6][S7][S8]
- **Additional source-quality warning:** NBA2KLab's page simultaneously renders a full threshold table while residual page copy says requirements are “not” complete; NBA 2KW's introduction accidentally calls its table “NBA 2K26” information. These are signs of same-day publication/template churn. [S6][S7]
- **Conclusion:** Badge names/descriptions and system semantics are official. Most threshold rows are **corroborated pre-release observations**, not official immutable specifications. Conflicting cells are **unresolved** and should be marked disputed rather than majority-voted into truth.

#### 6. Other optimizer-relevant constraints

- **Official:** Once a build reaches 99 OVR in the Builder, Cap Breaker Preview shows how much each attribute would gain; the Builder Glossary also exposes badge, animation, and Takeover information. [S1]
- **Official:** There are five Takeover discipline slots, 19 unlockable specialist abilities plus five defaults (24 total abilities), and Hydration Hero can occupy any slot. There are 21 progression rewards and one perk per discipline chosen from Accelerator, Longevity, and Overdrive. [S1][S2]
- **Corroborated pre-release:** NBA2KLab publishes observed Takeover and animation requirement tables, demonstrating that a viable build objective cannot be reduced to badges alone: animations and Takeovers also have attribute conjunctions, height ranges, and thresholds. These sources are useful tracing targets but carry the same Community Day change warning. [S12][S13]
- **Inference:** “Best build” is a multi-objective, state-dependent question. Attribute feasibility, body/position caps, badge qualification, token cost, slot count, animations, Takeovers, Cap Breakers, Synergy availability, and user playstyle all affect value. No public evidence establishes a universal numeric objective or badge utility weights.

### Source List

All sources were retrieved 2026-08-21. A missing publication date is reported rather than inferred.

- **[S1] Official.** “MyPLAYER Builder | NBA 2K27,” NBA 2K / 2K, publication date not displayed (content announced 2026-08-18 in S2). https://nba.2k.com/2k27/features/myplayer-builder/
- **[S2] Official.** “NBA® 2K27 MyPLAYER Builder Introduces Female MyPLAYERs, Badge Tokens, and the All-New Synergy System,” 2K Newsroom, 2026-08-18. https://newsroom.2k.com/news/nbar-2k27-myplayer-builder-introduces-female-myplayers-badge-tokens-and-the-all-new-synergy-system
- **[S3] Official.** “NBA 2K HQ | NBA 2K,” NBA 2K / 2K, publication date not displayed; page states availability and 2026-08-21 sunset date for the old app. https://nba.2k.com/nba-2k-hq/
- **[S4] First-party store listing.** “NBA 2K HQ,” Apple App Store, developer 2K, publication date not displayed. https://apps.apple.com/app/id6745190566
- **[S5] Official direct asset.** “NBA 2K27 MyPLAYER New Badge Tokens,” 2K Newsroom media asset, publication date associated with 2026-08-18 newsroom release. https://cdn.prgloo.com/media/96ea8e190f6a4b3fbc9ba0f06e046157.jpg
- **[S6] Specialist/direct observation.** “NBA 2K27 Badge Requirements | Attribute Unlock Levels,” NBA2KLab, publication date not displayed; page labels data “Community Day.” https://www.nba2klab.com/badge-requirements
- **[S7] Specialist.** “NBA 2K27: All Badge Requirements,” NBA 2KW Staff, 2026-08-21. https://nba2kw.com/nba-2k27-all-badge-requirements
- **[S8] Specialist.** SGO Thermal, “NBA 2K27 Badge Requirements: Full MyPLAYER Badge List,” Sports Gamers Online, 2026-08-21; credits @JPForThree for the requirement graphic. https://www.sportsgamersonline.com/games/basketball/nba-2k27-badge-requirements/
- **[S9] Specialist/direct observation.** “NBA 2K27 Signature Blueprints | All 40 Builds,” NBA2KLab, publication date not displayed; page labels data “Community Day.” https://www.nba2klab.com/signature-blueprints
- **[S10] Specialist/direct observation.** “NBA 2K27 Rebirth Rewards | All Four Tiers and Requirements,” NBA2KLab, publication date not displayed; says cards are read from the in-game screen. https://www.nba2klab.com/rebirth-rewards
- **[S11] Official direct asset.** “NBA 2K27 MyPLAYER Badge Synergy,” 2K Newsroom media asset, publication date associated with 2026-08-18 newsroom release. https://cdn.prgloo.com/media/bcf984a58f2b41f5870e48382aea1945.jpg
- **[S12] Specialist/direct observation.** “NBA 2K27 Takeover Requirements | All 24 Takeover Abilities,” NBA2KLab, publication date not displayed; page labels data “Community Day.” https://www.nba2klab.com/takeover-requirements
- **[S13] Specialist/direct observation.** “NBA 2K27 Animation Requirements & Motion Style Requirements,” NBA2KLab, publication date not displayed; page labels data “Community Day.” https://www.nba2klab.com/animation-requirements

### Implementation Implications

1. Use versioned, source-attributed records with `observedAt`, `effectiveGameVersion`, `evidenceClass`, and `disputed` fields. Never overwrite a conflict silently.
2. Model build identity separately from appearance: position, height, weight, wingspan, build path/blueprint, attribute values, observed caps, and save-lock facts.
3. Represent badge qualification as tiered Boolean predicates over attributes and body gates. Preserve `AND` versus `OR`, min/max height, unavailable tiers, and source-specific alternatives.
4. Keep three separate badge concepts: qualification/inventory, slot occupancy, and token cost. Token balances need discipline and provenance (`default`, event-locked, bonus/flexible); cost needs size/position/build context and observation version.
5. Model a loadout as a constrained selection under slot and token budgets. Model Synergy as paired Fuse/Reaction placements with boost magnitude, permanence/source, discipline lock, and unknown activation threshold—not as a static extra badge tier.
6. Treat optimizer output as Pareto/ranked candidates driven by caller-supplied priorities and constraints. Badge utility, animation value, Takeover value, and playstyle value are not established objective constants.
7. Add provenance to every recommendation: which thresholds fired, which constraints excluded alternatives, token and slot arithmetic, Cap Breaker assumptions, and whether any input was disputed or pre-release.
8. Capture exact Builder/app observations after each update: screenshot or structured transcription, platform/region/app version, body inputs, attribute changes, resulting caps/OVR, badges and tiers, token costs, animations, Takeovers, build name/comparisons, and Cap Breaker preview.
9. Make the data refreshable. Full release is 2026-09-04 and Early Access begins 2026-08-26, so same-day Community Day tables should not be frozen into code.

### Risks

- **Pre-release volatility:** Thresholds, caps, token costs, and progression rewards can change before Early Access, launch, or via live updates.
- **Conflicting evidence:** Several exact badge cells disagree across current sources; a single incorrect point can invalidate an optimized build.
- **Incomplete cost surface:** No complete public token-cost matrix by badge tier, size, and position was found. Official evidence explicitly says those costs vary.
- **Unknown Builder budget function:** Public pages do not disclose the complete attribute coupling/cost equations, body-dependent caps, position rules, or OVR calculation needed to generate all feasible builds offline.
- **Unknown utility:** Eligibility does not establish in-game effect size. Pre-launch “best” rankings are inference until controlled gameplay testing exists.
- **Synergy ambiguity:** Official text establishes effects but not every pairing/trigger/stacking rule. Seasonal and account progression also make feasible loadouts user-state dependent.
- **Platform/service dependence:** The HQ app requires connectivity, account linkage, and supported mobile OS; availability/features may change and automated access was not authorized or tested.
- **Terminology drift:** Treating “React” as a distinct mechanic or “badge points” as canonical could create incompatible schemas.

### Unresolved Questions

1. What are the authoritative launch-day values for the disputed badge cells and every threshold/height gate?
2. What is the complete token cost function by badge, tier, height, position, and other body inputs?
3. How are the 20 default slots distributed, and what determines builds with zero slots in a discipline as shown in official imagery?
4. What are the full attribute cap, coupling, point-cost, and 99-OVR feasibility rules for each body/position combination?
5. For every Synergy pair, what Fuse activation count triggers Reaction; are all badge pairings legal; and how do duplicate, Legend, seasonal, and multiple simultaneous effects behave?
6. Which Cap Breakers can be applied to which attributes, how do body caps constrain them, and do post-break values change badge/token costs or only eligibility?
7. Which mechanics differ by platform or post-launch game/app version?

### Recommended Next Role

- `planner` in `plan` mode, bounded to a versioned evidence/data contract and verification strategy. It should not assume the current threshold tables are final, and should require later independent validator evidence against live Builder observations before acceptance.

## Handoff

- Next role: `planner` (`taskMode: plan`).
- Limitations: No BlueStacks/app operation, account access, implementation editing, exhaustive web crawl, controlled gameplay testing, or acceptance validation was performed. Exact threshold tables remain pre-release observations, and this artifact summarizes rather than reproduces all 53 rows.
- Risks: Highest risks are mutable launch data, unresolved table conflicts, absent token-cost/cap equations, and optimization objectives that cannot be inferred from eligibility alone.
