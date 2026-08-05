# Harness Portability Dependency Audit

## Metadata

- orchestrationId: `2026-08-04-harness-portability`
- role: `researcher`
- artifactId: `portability-researcher-001-dependencies`
- createdAt: `2026-08-04`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Audit all distributable `.opencode/` components and `opencode.json`, emphasizing root guidance, validator assumptions, and `.memory` bootstrap; classify repository-only versus portable; report the supplied routing preflight failure.
- Required context present: Orchestration ID, scoped question, repository paths, source constraints, current-repository freshness, downstream boundary needs, and requested artifact path were present. No external freshness date was required.
- routingMetadataStatus: absent. No enriched routing labels or values were supplied or invented.

## Work Performed

- Summary: Inventoried tracked files and every `.opencode/` category, searched cross-file path/runtime assumptions, compared tracked assets to the manifest and validator's closed set, and ran non-mutating routing/validator checks. Direct evidence is labeled separately from inference.
- Files read: `opencode.json`; `AGENTS.md`; `opencode-harness.design.md`; `.gitignore`; `.opencode/harness.manifest.json`; `.opencode/scripts/validate-harness.mjs`; all `.opencode/` directory inventories; agents, commands, workflows, contracts, schemas, routing, plugins, skills/references, deployment assets; `.memory/INDEX.md`, protocol, reference inventory, and templates.
- Files changed: This trace artifact only. Index writes were attempted as requested but denied by the researcher agent's edit permission.
- Commands/checks:
  - `git status --short && git ls-files` — clean before memory output; established tracked inventory.
  - `node --test .opencode/routing/routing-policy.test.mjs` — 30/30 passed; emitted a module-type warning because `.opencode/package.json` is ignored/generated.
  - Implicit `node .opencode/routing/resolve-model-routing.mjs ...` — failed with the caller-reported dangling `defaultLocalModel` error.
  - Same resolver with explicit committed example — succeeded and returned advisory `researcher`/`qwen-research` routing.
  - `node .opencode/scripts/validate-harness.mjs` — passed before adding this artifact; emitted the same module-type warning. This is research evidence, not acceptance validation.

## Output Contract

### Cited Findings

1. **The repository does not define one complete distributable set (direct evidence).** `AGENTS.md` calls `.opencode/` plus three root files the deliverable (`AGENTS.md:3`), while the design adds static `.memory` (`opencode-harness.design.md:22-43`). The manifest owns a closed list (`.opencode/harness.manifest.json:5-54`), and the validator requires exact equality with its own list (`.opencode/scripts/validate-harness.mjs:37-79,206-247`). Yet tracked `.opencode/commands/implement-feature.md`, `.opencode/workflows/implement-feature-workflow.md`, and the two meta skills are absent from both manifest and validator lists; the command/workflow are substantive (`implement-feature.md:1-95`; `implement-feature-workflow.md:1-75`). **Inference:** copying “all `.opencode/`” and copying the manifest-defined projection produce different products.

2. **Root files are integration inputs, not safe byte-for-byte portable artifacts (direct evidence).** `opencode.json` hardcodes project instruction paths (`opencode.json:2-5`); `AGENTS.md` describes this repository, its prior-projection directories, exact routing ownership, and acceptance command (`AGENTS.md:3-5,9-18,26-30`). The design is repository architecture/history, including future unimplemented hook design and open questions (`opencode-harness.design.md:154-220,222-267`). **Inference:** installation should merge native config and a harness policy section into destination-owned root files, not overwrite existing `opencode.json` or `AGENTS.md`; the design should remain source-repository documentation unless developer docs are explicitly shipped.

3. **`validate-harness.mjs` is repository-baseline QA, not a portable destination validator (direct evidence).** It anchors `ROOT` to `process.cwd()` (`validate-harness.mjs:8,102-116`), requires the design doc, full deployment/docs set, and static memory (`37-85,647-680`), enforces exact manifest membership (`206-247`), requires an exact root `.gitignore` rule even though `.gitignore` is outside the declared root deliverable (`249-265`; `AGENTS.md:3`), and requires every historical orchestration Markdown file in the global memory index (`381-399`). It embeds illustrative providers/models/URLs in synthetic tests (`442-523`). **Inference:** retain it for source/release QA or create a profile-aware destination validator rooted by script/config discovery.

4. **Static `.memory` is a hard runtime contract; orchestration history is repository-only (direct evidence).** `opencode.json` loads the protocol (`opencode.json:3`); every agent references the protocol/contracts/schema and trace path (for example `.opencode/agents/researcher.md:21-27`); contracts hardcode `.memory` paths (`role-io-contracts.json:4-6,18-20`); the protocol requires indexes and role artifacts (`.memory/protocols/memory-management.md:18-42`); the design distinguishes static base from generated memory (`opencode-harness.design.md:37-43`) and excludes generated history from the static manifest (`:261`). **Inference:** bootstrap a fresh `.memory/INDEX.md`, protocol, and templates before delegation and create orchestration indexes/directories on demand; never copy this repository's `.memory/orchestrations/**`. `opencode-refs.md` is documentation support, though the current validator makes it mandatory (`validate-harness.mjs:73-79,402-422`).

5. **Memory contracts contain an unresolved mismatch (direct evidence).** The catalog says trace `requiredFields` include `inputSummary`, `outputSummary`, and top-level `evidence` (`role-io-contracts.json:17-19`, repeated for all roles), while the trace schema requires `inputContract` and `outputContract` and rejects unknown top-level properties (`memory-trace-artifact.schema.json:6-7,18-57`). The template follows schema-style sections (`.memory/templates/role-trace-artifact.md:12-35`), but the validator only checks nonempty arrays and paths; it does not validate trace instances (`validate-harness.mjs:356-379,666-669`). **Inference:** portable interchange is unreliable until catalog/schema vocabulary is reconciled.

6. **Routing code is portable, but routing state is installation-specific and currently blocks implicit operation (direct evidence).** The loader selects a present custom override first and never falls back (`routing-config-loader.mjs:29-39,42-85`); `.gitignore` marks it private (`.gitignore:4`); deterministic acceptance excludes it (`opencode-harness.design.md:122-134`). The present override names `qwen-coder` as default but defines only `qwen-research` (`harness-model-routing.json:10-20`), causing the reproduced failure; the example defines both (`harness-model-routing.example.json:10-25`) and explicit resolution succeeds. **Inference:** never distribute the custom override. Preserve and explicitly preflight any destination override; only the example/policy/loader/tests are portable.

7. **Local model identities and deployment are optional examples, not universal dependencies (direct evidence).** The routing example hardcodes illustrative llama.cpp providers, aliases, ports, and budgets (`harness-model-routing.example.json:15-35`). Deployment requires Compose, NVIDIA capability, a digest, and existing private model paths (`deployments/llama-server/compose.yaml:1-35`; `instances/*.env.example:1-16`); its README calls values illustrative and operator-owned (`README.md:1-21,47-76`). Native provider transport remains external (`delegation-orchestrator/SKILL.md:36-43`). **Inference:** ship routing/deployment as opt-in profiles or examples.

8. **Plugin/routing runtime is largely self-contained, but activation assumptions remain (direct evidence).** The plugin adapter imports two local modules (`plugins/index.js:1-8`); routing/plugin modules use Node built-ins and sibling modules (`routing-config-loader.mjs:1-8`; `role-model-routing-enforcement.js:1-7`). The lifecycle guardrail specifically protects `.opencode`, `opencode.json`, and `AGENTS.md` (`harness-lifecycle.js:13-20`). Tests pass offline. `.opencode/package.json`, lockfile, and `node_modules` are ignored by `.opencode/.gitignore`; tracked code does not import `@opencode-ai/plugin`. Direct Node execution warns that module type depends on ignored/generated package metadata. **Inference:** exclude generated package state/node_modules; document or remove that ESM validation dependency.

9. **Core orchestration assets are reusable only as a coordinated layout (direct evidence).** Agents, commands, contracts, schema, skill, and workflows consistently assume the fixed eight roles and repository-relative `.opencode`/`.memory` layout (`delegate-orchestration.md:10-25,31-50`; `delegation-orchestrator/SKILL.md:10-34`; `delegation-workflow.md:20-33`). Workflows are project-local guidance, not native OpenCode schema (`implement-feature-workflow.md:5-10`; `opencode-workflow-guidance/SKILL.md:12-25`). **Inference:** selective copying without contracts/schema/static memory breaks references.

### Recommended Boundaries

| Boundary | Components | Rationale |
| --- | --- | --- |
| Portable core, copied together | Eight agents; six role commands plus `/delegate-orchestration`; delegation skill/role matrix; contracts/schemas; delegation/validation guidance; fresh memory protocol/templates/index bootstrap | Mutually referenced delegation contract. Preserve relative `.opencode`/`.memory` layout. |
| Destination merge/bootstrap | Harness section for `AGENTS.md`; native `opencode.json` instruction/permission additions; ignore rules; creation of orchestration indexes/directories | Destination projects own root config, instructions, ignore policy, and generated memory. |
| Optional portable profiles | Routing example/loader/policy/resolver/helper/tests and routing plugin; lifecycle plugin; llama deployment; `/implement-feature` workflow; meta skills; reference inventory | Environment-, workflow-, or maintainer-specific. |
| Repository/release only | `opencode-harness.design.md`; current `AGENTS.md` wording as canonical source policy; current validator; manifest unless used as release inventory; existing orchestration history and populated global memory index; `.vscode/`; prior projection context | Encodes source architecture, exact baseline/history, or development tooling. |
| Never distribute as baseline | Custom routing override; private instance env files; `node_modules`; ignored/generated package state | Operator/machine-specific, secret-adjacent, currently invalid, or generated. |

### Implementation Implications

- Define named distribution profiles and one authoritative inventory; reconcile tracked extras with the manifest.
- Make installation idempotent and merge-aware for `AGENTS.md`, `opencode.json`, and `.gitignore`; detect collisions.
- Bootstrap only static memory plus a clean index, then create orchestration memory lazily.
- Separate release-source validation from installed-profile validation.
- Reconcile trace catalog/schema fields and add actual instance validation.
- Preflight selected routing before startup; never overwrite or package a private override.

### Risks and Unresolved Questions

- High: the private override causes implicit resolver/plugin startup failure while explicit-example validation passes.
- High: manifest/validator success omits tracked `implement-feature` and meta-skill assets.
- Medium: installation can clobber application-owned instructions/config without merge/uninstall semantics.
- Medium: agents fail their memory contract if static `.memory` bootstrap is omitted.
- Medium: trace artifacts have no single schema-consistent contract.
- Medium: validator behavior grows with repository history and global index links.
- Low/medium: direct Node checks depend on ignored package metadata for warning-free ESM behavior.
- Unresolved: mandatory versus optional routing/plugins; intended release status of `implement-feature` and meta skills; status of `opencode-refs.md`; collision/version/uninstall strategy.

### Source List

- Root: `AGENTS.md:3-30`; `opencode.json:1-7`; `opencode-harness.design.md:20-43,118-152,222-267`; `.gitignore:1-4`.
- Inventory/validation: `.opencode/harness.manifest.json:5-54`; `.opencode/scripts/validate-harness.mjs:8-96,206-265,356-422,442-523,633-725`; tracked inventory from `git ls-files`.
- Memory/contracts: `.memory/protocols/memory-management.md:18-61`; `.memory/INDEX.md:1-40`; `.memory/templates/*.md`; `.opencode/contracts/role-io-contracts.json:1-22`; both role/trace schemas.
- Delegation: `.opencode/agents/*.md`; `.opencode/commands/*.md`; `.opencode/workflows/*.md`; `.opencode/skills/delegation-orchestrator/**`; both meta skill `SKILL.md` files.
- Runtime: `.opencode/routing/*`; `.opencode/plugins/index.js`; `.opencode/plugin-modules/*.js`; `.opencode/deployments/llama-server/**`; `.opencode/package.json`; `.opencode/.gitignore`.
- Authorized documentation inventory only, not freshly fetched: `.memory/references/opencode-refs.md:1-65` (retrieval date 2026-07-05).

- Outputs: Cited findings, source list, implementation implications, risks, recommended boundaries, and unresolved questions.
- Evidence: Exact path/line citations and command-backed inventory/routing behavior above; direct evidence and inference are distinguished.
- Artifact links: This artifact. Requested orchestration/global index links remain unwritten due role permission denial.

## Handoff

- Next role: `planner` if these boundaries are approved; otherwise `synthesizer` to decide mandatory versus optional profiles first. An orchestrator/authorized role should create the orchestration `INDEX.md` and update `.memory/INDEX.md`.
- Limitations: Research only. No external docs refresh, destination repository, package/install simulation, live OpenCode startup, local provider, or schema-engine instance validation. The passing harness check predates this artifact and is not acceptance evidence. Researcher permission denied index edits despite the caller request.
- Risks: Do not accept portability until a validator checks a selected package profile and clean destination bootstrap; resolve/remove the malformed private override before implicit routing is relied upon.
