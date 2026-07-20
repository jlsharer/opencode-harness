# Final Playwright Dynamic UI Automation Framework Design

- orchestrationId: `2026-07-16-playwright-dynamic-ui-automation-framework`
- role: `synthesizer`
- routingMetadataStatus: absent; no routing values were invented.
- traceArtifactPath: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/synthesizer/root-synthesizer-004-final-design.md`

## Contract Outputs

### resolvedConclusions

- A robust framework is feasible when it is governance-first, evidence-driven, confidence-scored, and explicit about uncertainty.
- Playwright's semantic locators, auto-wait/actionability, web-first assertions, traces, contexts/fixtures/projects, storageState, network/API support, emulation, and frame/ARIA inspection are the right foundation.
- Source-assisted mode should be the primary path for stable automation because it can add test IDs, accessibility fixes, deterministic data, API setup/teardown, and source metadata.
- No-source/black-box mode must be bounded, authorized, rate-limited, human-reviewed, and labeled probabilistic; it cannot guarantee correctness for arbitrary websites.
- Reviewer medium issue 1 is resolved by adding a generated-source/model-prompt leakage gate covering generated TypeScript, comments, assertions, approval packets, UI-model excerpts, and model prompts/responses.
- Reviewer medium issue 2 is resolved by defining conservative default parameters for missing target-profile values while requiring target/risk tuning before production use.

### tradeoffs

- Source-assisted mode yields higher reliability and maintainability but requires repository or app-team cooperation.
- Black-box mode increases reach but reduces selector confidence, data control, and correctness guarantees.
- Semantic locators improve resilience but may reduce coverage on poorly accessible sites; CSS/XPath fallbacks remain provisional only.
- Rich observability improves diagnosis but increases privacy and artifact-size risk; redaction and budgets must be enforced.
- Parallelism/sharding improves runtime but must yield to target rate limits, data isolation, and anti-abuse boundaries.
- Model-assisted generation can improve speed but creates leakage risk; default to minimization, redaction, no prompt retention, and explicit opt-in for remote providers.
- Self-healing can reduce maintenance but must propose changes rather than silently promote them.

### assumptions

- Every target has explicit authorization, allowed domains, owner contacts, data policy, and terms/consent review before discovery.
- Sensitive or state-changing flows run in non-production or sandbox environments unless explicitly approved.
- Generated tests are TypeScript Playwright tests reviewed by humans before stable promotion.
- Credentials, storageState, traces, screenshots, HARs, UI models, logs, reports, generated source, and prompts are treated as potentially sensitive.
- Captcha, 2FA, payment, anti-bot, destructive, consent, and unauthorized boundaries are not bypassed.
- Validator evidence is still required for orchestration acceptance.

### recommendedDecision

Adopt the planner's layered architecture with the two synthesis additions: (1) an explicit generated-source/model-prompt leakage control plane, and (2) conservative default acceptance parameters that target profiles may override only with documented risk approval. Start implementation with a source-assisted pilot on an owned app, then expand to authorized black-box sandboxes after governance, redaction, confidence scoring, and reliability gates pass.

### remainingQuestions

- Which websites, domains, environments, and owners are in scope for each future target profile?
- Which flows, if any, may run against production or third-party environments?
- Which auth model, data classes, retention controls, and redaction rules apply per target?
- If model-assisted generation is used, which local or remote provider boundaries, retention settings, and approval requirements are allowed?
- Which default values below should be raised or tightened for high-risk, regulated, or high-traffic targets?

## Final Design

### 1. Core thesis and boundaries

Build a controlled Playwright automation-generation framework, not an unrestricted bot. It should discover, model, generate, dry-run, and promote UI tests only inside an approved scope. It must refuse or pause on authorization ambiguity, captcha, 2FA, anti-bot controls, payment, destructive actions, consent/terms uncertainty, rate-limit pressure, or sensitive data exposure. Black-box mode can infer user journeys from rendered behavior but cannot prove business correctness without human/source validation.

### 2. Layered architecture

1. **Policy/Governance Engine:** authorization manifest, allowlists, deny-lists, rate limits, data policy, retention, approvals, audit logs, refusal rules.
2. **Target Profile Manager:** mode, base URLs, environments, browser/device matrix, crawl limits, auth/data strategy, redaction, reporting, owner contacts.
3. **Source Adapter Layer:** optional route/component/test-id metadata, fixture/API hooks, source-derived domain hints, accessibility/testability recommendations.
4. **Session/Auth/Data Layer:** Playwright projects, contexts, fixtures, storageState lifecycle, credentials, seeded synthetic data, cleanup.
5. **Discovery Engine:** bounded crawl of pages, forms, frames, ARIA/DOM snapshots, screenshots, navigation, console/network metadata.
6. **UI Model Builder:** normalized site graph with pages, components, actions, assertions, data sensitivity, risk labels, selector candidates, evidence links.
7. **Selector Scoring Engine:** semantic locator ranking, uniqueness/stability checks, cross-run drift detection, ambiguity penalties.
8. **Action/Assertion Planner:** candidate journeys, setup/teardown, assertions, approvals, negative paths where safe.
9. **Code Generation Layer:** human-reviewable Playwright TypeScript using fixtures/projects and confidence annotations.
10. **Reliability/Self-Healing Layer:** dry-runs, traces, flake detection, quarantine/demotion, proposal-only healing.
11. **Security/Redaction Layer:** sanitizes all persisted or shared artifacts and generated outputs.
12. **Observability/Performance Layer:** reports, metrics, manifests, caching, sharding, budgets.
13. **Extension API:** adapters, heuristics, redactors, data/auth providers, reporters, codegen templates.

### 3. Runtime pipeline

Load target profile and authorization manifest -> enforce governance -> choose source-assisted, black-box, or hybrid mode -> initialize Playwright projects/contexts -> authenticate through approved means -> run bounded discovery -> capture redacted evidence -> build UI model -> score selectors -> plan journeys/assertions -> request approvals for sensitive or low-confidence flows -> generate TypeScript tests and manifests -> dry-run in isolated contexts -> promote only if confidence, security, reliability, governance, and observability gates pass.

### 4. Source-assisted mode

Use source adapters to prefer explicit test IDs, accessible names, route metadata, feature flags, fixture factories, API setup/teardown, and deterministic test data. Recommend app-side fixes for missing labels, unstable selectors, hydration races, and poor test seams. Source metadata increases confidence but never replaces runtime Playwright validation.

### 5. No-source/black-box mode

Operate as a conservative black-box explorer over authorized rendered pages only. Prefer role/name, labels, placeholders, visible text, URL transitions, and ARIA structure. Use stricter crawl depth, rate limits, human approval, and promotion thresholds. Avoid destructive, account-impacting, payment, security, or consent flows unless explicitly approved in a controlled test environment.

### 6. Locator confidence policy

Default rank: test IDs/source contracts -> role/name -> labels -> stable placeholders -> stable visible text -> alt/title -> filtered semantic locators -> CSS stable-attribute fallback -> XPath last-resort diagnostic. Confidence bands: `>=80` eligible after dry-run/review; `60-79` provisional and human/source improvement required; `40-59` discovery evidence only; `<40` reject. Penalize duplicates, dynamic IDs/classes, hashed classes, deep DOM paths, position-only selectors, hidden/non-actionable elements, unstable text, frame/shadow ambiguity, locale drift, third-party widgets, and cross-run changes.

### 7. Reliability/self-healing

Rely on Playwright locators, auto-wait/actionability, web-first assertions, isolated contexts, deterministic data, traces on failure/retry, and repeated dry-runs. Avoid arbitrary sleeps except documented last resort. Retries collect evidence and do not hide instability. Self-healing may propose a replacement only when semantic intent, region, action type, uniqueness, and assertion meaning are preserved; promotion requires evidence and, for non-trivial changes, human approval.

### 8. Auth/data/security/redaction

Use non-production accounts and synthetic data where possible. Store credentials in a vault or CI secret store; never commit credentials, tokens, raw storageState, traces, screenshots, HARs, logs, or reports containing secrets/PII. Encrypt or make storageState ephemeral and scoped by target, role, and expiry. Redact DOM text, screenshots, network bodies/headers, cookies, local/session storage, console logs, traces, UI models, reports, and generated manifests.

Generated output is also sensitive: scan and redact generated TypeScript, test names, comments, assertions, approval packets, UI-model excerpts, and selector rationales before persistence or review. Comments and assertions should reference sanitized evidence IDs and non-sensitive expected behavior, not private raw text. If model-assisted generation is used, prompts/responses are artifacts: send only minimized redacted UI-model snippets, disable prompt retention by default, require explicit target-profile opt-in for remote providers, and block secrets, credentials, cookies, storageState, raw source, private DOM text, customer data, screenshots, and network payloads from prompts.

### 9. Observability/performance

Produce trace links, selector-confidence reports, discovered-flow coverage, refused/skipped flows, approval logs, redaction events, flake metrics, runtime metrics, and generated-suite manifests. Cache UI models by target URL, environment, source/build hash, and profile hash. Reuse browsers with isolated contexts, parallelize only independent flows, shard large suites, prefer API setup over UI setup, cap crawl breadth/depth, and collect expensive artifacts primarily on failure/retry or high-risk flows.

### 10. Extension points

Expose stable APIs for source adapters, discovery strategies, sitemap/journey seeds, selector heuristics, accessibility validators, auth providers, data providers, redactors, assertion generators, policy packs, codegen templates, reporters, and CI artifact exporters.

### 11. Adoption roadmap

1. Threat model, governance policy, target-profile schema, and approval workflow.
2. Source-assisted pilot on an owned app with deterministic fixtures and redaction.
3. Selector scoring, UI model, generated manifest, and TypeScript codegen prototype.
4. Reliability gates: repeated dry-runs, flake budget, trace/report inspection.
5. Authorized black-box sandbox pilot with stricter limits and human approvals.
6. CI integration, sharding, dashboards, extension APIs, and controlled rollout.
7. Continuous improvement from drift reports, flake trends, and maintainer feedback.

### 12. Acceptance gates and default parameter recommendations

Acceptance gates: governance manifest present; refusal behavior verified; redaction/security tests pass; generated-source/model-prompt leakage scan passes; selector scoring thresholds tested; source-assisted pilot passes; black-box sandbox pilot passes; auth/data isolation confirmed; observability reports complete; performance/artifact budgets respected; generated tests remain readable, diffable, annotated, and human-reviewed; validator evidence exists before acceptance.

Conservative defaults when the target profile omits values:

- **Browser/device smoke matrix:** promotion runs desktop Chromium, Firefox, and WebKit at `1280x720`; add one mobile emulation project for mobile/responsive targets. Discovery may start Chromium-only, but stable promotion uses the required matrix.
- **Repeat dry-run count:** `5` consecutive dry-runs per required project for stable promotion; `3` may be used only for provisional sandbox feedback.
- **Pass threshold:** `100%` pass across required repeat dry-runs for promotion; retry-only passes do not count as stable. After promotion, quarantine below `95%` pass rate over the latest `20` scheduled runs.
- **Crawl depth:** maximum `2` link hops from approved seeds, `25` pages, or `100` candidate actions per discovery run, whichever comes first; no side-effecting POST/state-change actions unless allowlisted.
- **Rate limit:** one discovery worker by default, at most `6` navigations/minute and `30` generated user actions/minute per target, with a minimum `2s` delay between actions; stop or back off on `429`, anti-bot, or abnormal error signals.
- **Artifact retention:** raw sensitive artifacts are not persisted; encrypted storageState expires within `8h`; redacted failure/run artifacts retain for `14 days`; generated manifests and summary reports retain for `90 days` unless target policy is stricter.
- **Artifact size budgets:** cap retained redacted artifacts at `250 MB` per target run and `50 MB` per individual artifact; collect video/HAR only on failure or explicit high-risk approval; trim or refuse promotion if budgets are exceeded.

These values are conservative starting points, not universal truths. Exact values must be tuned per target, traffic tolerance, environment, data sensitivity, regulatory risk, CI capacity, and business criticality; high-risk targets should tighten rather than loosen them.
