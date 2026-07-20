# Role Trace Artifact

## Metadata

- orchestrationId: 2026-07-16-playwright-dynamic-ui-automation-framework
- role: planner
- artifactId: root-planner-002-framework-architecture
- createdAt: 2026-07-16T00:00:00Z
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Approved goal to design, not implement, a robust optimized Playwright framework that dynamically builds UI automation for websites with or without source access; scope boundaries; research evidence from `root-researcher-001-framework-research`; deliverable path expectations; acceptance criteria; allowed edit scope limited to this trace artifact; remediation loop 1 request to persist the full planning output in this artifact.
- Required context present: Orchestration memory root `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/`; role contract catalog `.opencode/contracts/role-io-contracts.json`; trace schema `.opencode/schemas/memory-trace-artifact.schema.json`; role trace template `.memory/templates/role-trace-artifact.md`; researcher artifact `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md`; assigned planner artifact path.
- Routing metadata status: absent; no routing values were invented.

## Work Performed

- Summary: Converted the approved goal and research evidence into a bounded framework architecture plan covering layered modules, runtime generation flow, source-assisted and no-source modes, selector confidence scoring, reliability constraints, data/auth/security policies, observability, performance, extensibility, governance, adoption, and future validation gates. Remediation loop 1 expanded this artifact so synthesis and validation have persisted evidence rather than only a summary.
- Files read:
  - `.opencode/contracts/role-io-contracts.json`
  - `.opencode/schemas/memory-trace-artifact.schema.json`
  - `.memory/templates/role-trace-artifact.md`
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/INDEX.md`
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md`
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`
- Files changed:
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`
- Commands/checks:
  - Read required local contracts/templates/research evidence with file-read tools.
  - Verified parent role directory with `ls` before initially creating planner artifact directory/file.
  - Attempted `python` write command during initial planning; unavailable in shell.
  - Wrote the initial planner trace artifact with `python3` under the allowed orchestration memory path.
  - Remediation loop 1: read the assigned artifact, rewrote only this artifact with the complete planning output using `python3`, and re-read it for inspection.

## Output Contract

- Outputs: Persisted `orderedPlan`, `fileContracts`, `dependencies`, `verificationGates`, `handoffNotes`, `traceArtifactPath`, and `openQuestions` are included in full under **Persisted Planning Output** below.
- Evidence:
  - Direct research inputs: Playwright guidance favors user-facing locators, actionability auto-waiting, web-first assertions, inspected codegen, trace viewer usage, secure `storageState`, browser contexts/fixtures/projects/parallelism/sharding, network/API mocking, emulation, frame/page inspection, aria snapshots, and page evaluation.
  - Planning conclusions: Dynamic automation should be confidence-scored and governed, with explicit source-assisted/no-source modes, selector ranking that prefers stable semantic contracts, conservative self-healing, redacted evidence, and human approval checkpoints for low-confidence or sensitive flows. Arbitrary websites cannot be guaranteed to automate correctly; the framework must record confidence, uncertainty, and refusal/approval boundaries.
- Artifact links:
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`
  - `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/researcher/root-researcher-001-framework-research.md`

## Persisted Planning Output

### orderedPlan

1. **Establish governance intake before any automation work.**
   - Require an authorization manifest for every target that defines allowed domains, environments, consent/terms status, responsible owner, crawl depth, rate limits, data classifications, blocked actions, allowed credentials, retention policy, and human approval contacts.
   - Refuse or pause automation when a flow encounters captcha, 2FA, payment, anti-bot defenses, rate-limit pressure, consent dialogs outside the approved policy, destructive actions, or website terms/authorization ambiguity.
   - Treat the framework as a controlled test-generation assistant, not a guarantee that any arbitrary site can be automated correctly.

2. **Define the layered architecture and module responsibilities.**
   - **Policy/Governance Engine:** validates authorization manifests, enforces domain allowlists, action deny-lists, rate limits, data-retention rules, audit logging, approval checkpoints, and refusal conditions.
   - **Target Profile Manager:** stores target mode (`source-assisted`, `black-box`, or hybrid), base URLs, allowed environments, browser/device matrix, max crawl depth, auth strategy, data policy, source adapter configuration, and reporting preferences.
   - **Source Adapter Layer:** when source is available, extracts or accepts route metadata, component/test-id contracts, app state hints, fixtures, API setup/teardown hooks, accessibility expectations, and stable domain models. It should also propose app-side improvements such as adding `data-testid` attributes, labels, and deterministic test seams.
   - **Browser Session Manager:** owns Playwright projects, browser contexts, fixtures, storageState loading, session isolation, emulation, viewport/device profiles, permissions, proxy/network settings if authorized, parallel workers, and sharding configuration.
   - **Auth and Data Orchestrator:** obtains approved test credentials, supports manual-login checkpoints where required, manages encrypted/ephemeral storage state, creates or seeds non-production data through APIs when authorized, and guarantees teardown or cleanup instructions.
   - **Discovery Engine:** explores allowed pages and flows using bounded crawl rules; captures URLs, DOM snapshots, accessibility/ARIA snapshots, screenshots, frames, visible text, form controls, navigation events, console/network metadata, and state transitions.
   - **UI Model Builder:** normalizes discovery output into a site graph of pages, regions, components, actions, assertions, dependencies, risk labels, sensitivity labels, frame context, and selector candidates.
   - **Selector Scoring Engine:** ranks locators using semantic stability, uniqueness, actionability, cross-run persistence, source metadata, and ambiguity penalties; rejects selectors below threshold or requiring disallowed fallback behavior.
   - **Action and Assertion Planner:** converts UI model nodes into candidate user journeys, setup/teardown steps, assertions, negative-path checks where appropriate, data requirements, and approval gates.
   - **Code Generation Layer:** emits human-inspectable Playwright TypeScript test designs using fixtures, projects, page objects or screenplay-style tasks where useful, comments/annotations for confidence and risk, and review markers for provisional flows.
   - **Execution/Reliability Engine:** dry-runs generated flows in isolated contexts, relies on Playwright actionability and web-first assertions, collects traces on retry/failure, computes flake signals, and creates remediation proposals rather than silently masking failures.
   - **Security/Redaction Layer:** redacts secrets, tokens, PII, request/response bodies, screenshots, traces, DOM snapshots, logs, and storageState before persistence or sharing.
   - **Observability/Reporting Layer:** produces trace links, HTML/JUnit-style summaries, selector confidence reports, discovered-flow coverage, approval/refusal audit logs, flake dashboards, performance metrics, and generated-suite maintainability reports.
   - **Extension API / Plugin Host:** exposes stable interfaces for source adapters, discovery strategies, selector heuristics, auth providers, test data providers, redactors, assertion generators, codegen templates, reporters, and policy packs.

3. **Implement the dynamic automation runtime flow as an explicit pipeline.**
   1. Load the target profile and authorization manifest.
   2. Validate governance: allowed domains, consent/terms status, action deny-list, rate limits, data policy, and retention policy.
   3. Select execution mode: `source-assisted`, `black-box`, or hybrid.
   4. Initialize Playwright projects and isolated browser contexts with approved browser/device matrix and trace settings.
   5. Establish authentication through approved test accounts, API setup, existing encrypted storageState, or a manual login checkpoint; do not bypass 2FA/captcha/security controls.
   6. Run bounded discovery within allowed URLs, crawl depth, rate limits, and action-risk limits.
   7. Capture page/DOM/ARIA/frame/network/console/screenshot evidence and source metadata where available.
   8. Build the normalized UI model and site graph.
   9. Score selectors and annotate each action/assertion with confidence, risk, sensitivity, and required approvals.
   10. Plan candidate journeys and assertions, preferring high-value user-visible behavior over implementation details.
   11. Require human approval for low-confidence, sensitive, destructive, credential, payment, consent, or ambiguous flows.
   12. Generate Playwright tests and supporting design artifacts with confidence annotations and traceability back to discovered evidence.
   13. Dry-run generated flows in an isolated non-production environment when possible.
   14. Promote only flows that pass confidence, security, reliability, governance, and observability gates; otherwise persist trace evidence and remediation notes.

4. **Support source-assisted mode with stronger contracts and deterministic setup.**
   - Prefer adding or using explicit test IDs, accessible names, labels, route metadata, and stable component contracts.
   - Use source knowledge to map routes, components, feature flags, API boundaries, fixture factories, and seeded data.
   - Prefer API setup/teardown over UI setup when authorized and representative.
   - Use stable test accounts, known database state, mocked third-party services where appropriate, and app-side fixes for accessibility, hydration, and testability.
   - Treat source metadata as a confidence booster, not as a substitute for runtime validation in Playwright.

5. **Support no-source/black-box mode conservatively.**
   - Treat exploration as probabilistic and evidence-driven rather than guaranteed.
   - Require explicit authorization and domain allowlisting before crawl or generation.
   - Apply stricter rate limits, max-depth limits, sensitive-action filters, and human review checkpoints.
   - Prefer semantic signals observable from the rendered page: role/name, labels, placeholders, visible text, alt/title, stable URL transitions, and accessible structure.
   - Require stronger trace evidence for generated flows, mark lower confidence where semantics are weak, and avoid destructive or account-impacting actions unless explicitly approved in a test environment.

6. **Apply a locator/selector confidence policy.**
   - Candidate ranking, highest to lowest confidence:
     1. Explicit test IDs or agreed source-assisted contracts.
     2. Role/name locators that reflect accessible user intent.
     3. Labels for form controls.
     4. Placeholders when labels are absent and placeholder text is stable.
     5. Stable visible text tied to a unique user action or assertion.
     6. Alt/title attributes for media or controls where semantically appropriate.
     7. Chained/filtered semantic locators that disambiguate within stable regions.
     8. CSS selectors only as low-confidence fallbacks for stable attributes or structures.
     9. XPath only as a last-resort diagnostic/provisional fallback.
   - Suggested confidence bands:
     - `>= 80`: eligible for generated tests after dry-run and review.
     - `60-79`: provisional; requires human inspection or source/test-id improvement.
     - `40-59`: retain as discovery evidence only; do not promote to stable tests.
     - `< 40`: reject.
   - Penalize duplicate matches, dynamic IDs/classes, hashed class names, deep DOM paths, position-only selectors, hidden or non-actionable elements, unstable text, frame/shadow ambiguity, cross-run drift, locale sensitivity, and reliance on third-party widgets.
   - Require generated tests to preserve selector rationale and confidence metadata so maintainers understand why a locator was chosen.

7. **Define reliability and flakiness controls.**
   - Use Playwright locators, actionability auto-waiting, web-first auto-retrying assertions, isolated browser contexts, fixtures, projects, traces, screenshots/video where approved, and deterministic setup/teardown.
   - Avoid arbitrary sleeps except as an explicitly reviewed last resort with a documented reason.
   - Run repeated dry-runs for promoted flows and calculate stability/flake budgets.
   - Separate test data per worker to avoid shared-state interference.
   - Use retries primarily to gather failure evidence, not to hide instability.
   - Quarantine or demote flows that fail confidence, drift, or flake thresholds.

8. **Constrain self-healing.**
   - Self-healing may only propose replacements; promotion requires evidence and, for non-trivial changes, human approval.
   - Replacement candidates must preserve semantic intent, page region, action type, accessible name/role where possible, target uniqueness, and previous assertion meaning.
   - Never self-heal through captcha, 2FA, payment, anti-bot, consent, destructive, account-security, or authorization boundaries.
   - Record old selector, proposed selector, evidence, confidence delta, and risk labels in the report.

9. **Set data, authentication, and security policy.**
   - Use non-production environments and test accounts whenever possible.
   - Store credentials in a vault or CI secret store; never commit credentials, tokens, raw storageState, screenshots, traces, HAR files, or logs containing secrets/PII.
   - Encrypt or make ephemeral any storageState artifacts; scope them per target, role, and expiration window.
   - Redact sensitive DOM text, screenshots, traces, network payloads, console logs, request headers, cookies, local/session storage, and generated reports before persistence.
   - Classify actions and data fields by sensitivity; require approval for account changes, destructive operations, consent dialogs, purchases, payment, identity, health, financial, or regulated data.
   - Prefer synthetic data and API setup/teardown; document cleanup for any created records.

10. **Plan observability, reporting, and auditability.**
    - Preserve trace viewer evidence for failed/retried runs and selected generation decisions.
    - Report discovered pages, generated flows, selector confidence, skipped/refused flows, approvals, redaction actions, flake metrics, runtime metrics, and source/no-source coverage.
    - Provide maintainers with a diffable generated-suite manifest and rationale for each generated test.
    - Emit structured logs and metrics without secrets.

11. **Optimize performance without weakening safety.**
    - Cache discovered UI models by target URL, environment, source revision/build hash, and configuration hash; invalidate on relevant changes.
    - Reuse browser instances and isolated contexts where safe instead of full browser restarts.
    - Parallelize independent flows with Playwright workers/projects and shard large suites in CI.
    - Prefer API setup over UI setup when authorized.
    - Bound crawl breadth/depth, limit third-party waits, avoid redundant screenshots/traces, and sample expensive evidence collection according to risk.
    - Track discovery time, generation time, test runtime, flake retries, and artifact size budgets.

12. **Define extensibility interfaces.**
    - Source adapter API: route/component/test-id extraction, fixture discovery, app-specific metadata.
    - Discovery plugin API: custom crawlers, sitemap importers, authenticated journey seeds, form fillers, risk classifiers.
    - Selector heuristic API: custom locator rankers, stability scorers, accessibility validators.
    - Auth provider API: vault-backed credentials, manual checkpoint, API login, storageState lifecycle.
    - Data provider API: seeded entities, cleanup hooks, synthetic data generation, environment reset.
    - Redaction API: target-specific PII/secrets masks for DOM, images, traces, logs, and network payloads.
    - Assertion generator API: domain-specific expected states, visual or accessibility assertions where approved.
    - Reporter/codegen API: templates, confidence reports, CI outputs, approval packets.

13. **Adopt incrementally.**
    - Phase 1: design review, threat model, governance policy, and approval workflow.
    - Phase 2: prototype on an owned demo app with source access and deterministic fixtures.
    - Phase 3: prototype no-source mode only on an explicitly authorized test site or sandbox.
    - Phase 4: add source adapters, redaction, reporting, data providers, and CI integration.
    - Phase 5: controlled rollout with flake budgets, performance budgets, audit review, and human approval gates.
    - Phase 6: continuous improvement from failures, selector drift reports, and maintainability metrics.

### fileContracts

- **Current planner trace artifact contract**
  - Path: `.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`.
  - Type: design evidence artifact, not implementation.
  - Required contents: metadata, input contract, work performed, output contract, persisted `orderedPlan`, `fileContracts`, `dependencies`, `verificationGates`, `handoffNotes`, `openQuestions`, and artifact path.
  - Constraints: preserve `routingMetadataStatus: absent`; do not invent routing labels; do not edit implementation/config files.

- **Future framework architecture design document contract**
  - Type: design artifact for downstream implementation planning.
  - Required sections: goals/non-goals, governance boundaries, layered architecture, runtime flow, source-assisted mode, black-box mode, selector scoring, reliability/self-healing, auth/data/security, observability/reporting, performance, extensibility APIs, adoption path, risks, and validation gates.
  - Must explicitly state that arbitrary-site automation is not guaranteed and must not bypass captcha, 2FA, payment, rate limits, anti-bot systems, website terms, or consent boundaries.

- **Future target profile contract**
  - Logical fields: target name, owners, mode, base URLs, allowed domains, environments, browser/device projects, auth strategy, test data policy, max crawl depth, rate limits, blocked actions, artifact retention, redaction policy, and approval contacts.
  - Security requirement: no raw secrets, tokens, or private user data.

- **Future authorization manifest contract**
  - Logical fields: proof of authorization, scope of consent, allowed domains, terms review status, allowed/disallowed flows, sensitive-action policy, rate limits, data classes, retention policy, and escalation contacts.
  - Required behavior: framework must refuse or pause when target activity exceeds this manifest.

- **Future discovery/UI model contract**
  - Logical fields: pages, components, frames, forms, actions, assertions, URL graph, network observations, ARIA/DOM evidence pointers, risk labels, data sensitivity labels, selector candidates, confidence scores, and required approvals.
  - Redaction requirement: evidence pointers must reference redacted artifacts only.

- **Future generated automation manifest contract**
  - Logical fields: generated tests, source evidence links, selector rationale, confidence band, auth/data requirements, setup/teardown, approvals, refused flows, flake history, and promotion status.
  - Maintainability requirement: generated output must be human-reviewable and diffable.

- **Future generated Playwright suite contract**
  - Expected shape: inspected TypeScript tests using Playwright locators, fixtures, contexts/projects, web-first assertions, trace configuration, and clear setup/teardown.
  - Required annotations: selector confidence, source/no-source mode, data/auth assumptions, risk labels, and review markers for provisional flows.

### dependencies

- **Research dependency:** `root-researcher-001-framework-research` provides Playwright evidence and risk framing.
- **Governance dependency:** authorization manifest and target profile must exist before discovery, generation, or execution.
- **Mode dependency:** source-assisted mode depends on repository/source metadata availability; no-source mode depends on explicit authorization and runtime-observable semantics.
- **Auth/data dependency:** approved test credentials, storageState policy, seeded data, and cleanup strategy must be defined before authenticated or state-changing flows.
- **Security dependency:** redaction policy must be active before artifacts are persisted or shared.
- **Pipeline ordering dependency:** governance -> target profile -> browser/session setup -> auth/data setup -> discovery -> UI model -> selector scoring -> action/assertion planning -> code generation -> dry-run execution -> reporting/promotion.
- **Reliability dependency:** stable generated tests depend on deterministic data, semantic selectors, isolated contexts, web-first assertions, and flake budget enforcement.
- **Performance dependency:** parallelism/sharding decisions depend on target rate limits, data isolation, and CI/browser capacity.
- **Review dependency:** low-confidence, sensitive, or provisional flows depend on human approval before promotion.
- **Validation dependency:** final orchestration acceptance requires reviewer, synthesizer, and validator evidence after this planner artifact.

### verificationGates

1. **Design completeness gate:** confirm the design includes layered architecture, runtime flow, source-assisted/no-source behavior, selector confidence, reliability/self-healing, data/auth/security, observability/reporting/performance, extensibility, governance, adoption path, and open questions.
2. **Governance gate:** verify every future target has an authorization manifest with domains, terms/consent status, rate limits, blocked actions, data policy, and escalation contacts.
3. **Safety refusal gate:** verify the framework refuses or pauses instead of bypassing captcha, 2FA, payment, anti-bot systems, rate limits, consent, website terms, destructive actions, or unauthorized areas.
4. **Security/redaction gate:** test that traces, screenshots, DOM snapshots, logs, network payloads, storageState, and reports are redacted before persistence and contain no secrets/PII.
5. **Selector scoring gate:** unit-test selector ranking, confidence bands, ambiguity penalties, CSS/XPath fallback demotion, and rejection of unstable candidates.
6. **Source-assisted prototype gate:** on an owned app, verify test-id contracts, seeded data, API setup/teardown, app-side accessibility/testability fixes, and generated tests passing repeated dry-runs.
7. **No-source prototype gate:** on an explicitly authorized sandbox, verify bounded crawl, rate limits, human approvals, confidence labeling, refusal behavior, and trace evidence.
8. **Reliability/flake gate:** require repeated dry-runs to meet agreed pass-rate and runtime budgets; quarantine or demote unstable flows.
9. **Auth/data isolation gate:** verify per-worker or per-suite data isolation, non-production accounts, cleanup, and no shared-state interference.
10. **Observability gate:** confirm reports include selector confidence, generated-flow coverage, refused/skipped flows, approvals, flake metrics, performance metrics, and redaction/audit events.
11. **Performance gate:** verify crawl depth, page count, artifact volume, parallel workers, sharding, and CI runtime stay within configured budgets without violating rate limits.
12. **Maintainability gate:** generated tests must be readable, diffable, annotated with confidence/risk, and require review before promotion from provisional to stable.
13. **Future implementation command gates:** when code exists, run unit tests for scoring/redaction/policy modules, Playwright dry-runs for generated flows, lint/typecheck for generated TypeScript, and report/artifact inspections.
14. **Orchestration acceptance gate:** reviewer and synthesizer must consume this persisted plan, and validator evidence must confirm artifact completeness before final acceptance.

### handoffNotes

- Routing metadata status: absent; no routing labels or values were invented.
- This is a design-only planner artifact. It does not implement a production framework and does not modify project configuration or implementation files.
- The design intentionally avoids claiming guaranteed correctness for arbitrary websites.
- Future implementation should start with governance, threat modeling, redaction, and an owned/source-assisted pilot before black-box automation.
- Reviewer should focus on missing risk controls, overbroad claims, unsafe flows, incomplete acceptance gates, and whether the plan is actionable for synthesizer.
- Synthesizer should consolidate this plan with research and reviewer findings into the final architecture/design.
- Validator should confirm the persisted artifact contains the complete contract outputs and that no unauthorized files were changed.

### traceArtifactPath

`.memory/orchestrations/2026-07-16-playwright-dynamic-ui-automation-framework/roles/planner/root-planner-002-framework-architecture.md`

### openQuestions

- Which specific websites, domains, and environments are explicitly authorized for future use?
- What proof of terms/consent review is required before no-source discovery?
- What auth model is acceptable per target: test accounts, API login, manual login checkpoint, encrypted storageState, or no auth?
- What data classes may appear in traces/screenshots/logs, and what redaction/retention policy applies?
- What browser/device/project matrix is required?
- What flake budget, performance budget, crawl depth, and rate limits are acceptable?
- Which generated flows require mandatory human review before promotion?
- Will the future implementation prefer page object, screenplay, or direct fixture-based generated test style?
- What CI environment, secret store, and artifact storage controls will host generated tests and reports?

## Handoff

- Next role: reviewer, then synthesizer, then validator before acceptance.
- Limitations: Design-only planning artifact; no production framework was implemented, no final validation was performed, and no guarantee is made that arbitrary sites can be automated correctly. Site-specific authorization, terms, test data availability, authentication constraints, and maintainability budgets must be resolved before any real-world use.
- Risks: Black-box automation may be brittle due to weak semantics, dynamic rendering, third-party content, cross-browser differences, protected controls, rate limits, captchas, 2FA, payments, anti-bot systems, PII/secrets leakage, and generated-suite opacity. The proposed framework must refuse or pause rather than bypass consent, security, payment, or anti-abuse boundaries.
