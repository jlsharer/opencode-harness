# Role Trace Artifact

## Metadata

- orchestrationId: `2026-08-28-simplify-opencode-local`
- role: `researcher`
- artifactId: `root-researcher-002-current-friction`
- createdAt: `2026-08-28`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Research current harness 0.1.11 and the current `llama-server` working tree for the smallest safe any-directory TUI, node discovery/addition, and routing-mode design. Relevant repository paths, source constraints, freshness requirement, downstream planner needs, workspace root, and trace root were supplied.
- Required context present: Yes. `taskMode` was `research`; scoped question, constraints, freshness, downstream needs, and roots were complete.
- Routing metadata status: absent.
- workspaceRoot: `/home/joshl/projects/opencode-harness`
- traceRoot: `/home/joshl/projects/opencode-harness/.memory`

## Work Performed

- Summary: Read the launcher, runtime manifest, routing loader/policy/plugin, package metadata, both main READMEs, the current integration/export scripts, node registry, and focused llama-server contract docs. Classified canonical inputs versus generated projections/bindings and compared their safety responsibilities. No implementation or global configuration was changed.
- Files read:
  - `bin/opencode-harness.mjs`
  - `package.json`
  - `.opencode/runtime.manifest.json`
  - `.opencode/routing/harness-model-routing.json`
  - `.opencode/routing/harness-model-routing.example.json`
  - `.opencode/routing/routing-config-loader.mjs`
  - `.opencode/routing/routing-policy.mjs`
  - `.opencode/plugin-modules/role-model-routing-enforcement.js`
  - `.opencode/plugins/index.js`
  - `README.md`
  - `/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv`
  - `/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh`
  - `/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh`
  - `/home/joshl/ai-infrastructure/llama-server/README.md`
  - `/home/joshl/ai-infrastructure/llama-server/docs/adding-a-node.md`
  - `/home/joshl/ai-infrastructure/llama-server/docs/opencode-projection.md`
  - `/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md`
- Files changed: This required trace artifact only; no implementation file was edited.
- Commands/checks:
  - `git status --short && git rev-parse HEAD` in both repositories.

## Output Contract

- Outputs: Cited findings, source list, minimal architecture recommendation, implementation implications, risks, uncertainty, and recommended next role.
- Evidence:
  1. **Direct — launch friction:** Harness `run` requires explicit `--workspace ABS`; the workspace must already be the exact canonical Git root, not a nested directory (`bin/opencode-harness.mjs:479-485,1039-1069`). With no forwarded args it already opens the TUI in that root (`bin/opencode-harness.mjs:1103-1105`; `README.md:38-40`). The package already declares an `opencode-harness` executable (`package.json:7-9`).
  2. **Direct — runtime safety can survive a convenience entrypoint:** After workspace resolution, launch still performs project collision/plugin checks, validates external files, verifies the selected OpenCode executable/runtime, snapshots external inputs, isolates DB state, and spawns in the workspace (`bin/opencode-harness.mjs:617-657,788-823,973-999,1079-1111`). Therefore a front door may derive the Git root from the current directory and then call the unchanged canonical checks; bypassing those checks is not required.
  3. **Direct — canonical node inputs:** `nodes.tsv` is the registry; selected rows point to per-node server env files. The exporter additionally reads per-node client projection metadata and derives provider/catalog JSON from those scalar inputs (`scripts/export-opencode-projection.sh:104-205,298-340`). Node additions are configuration-only but currently require a registry row, overlay, example/private server env, and private projection env (`docs/adding-a-node.md:3-12`).
  4. **Direct — projections are generated, not canonical:** Provider and endpoint documents are deterministically rendered and content-addressed into owner-only generations (`scripts/export-opencode-projection.sh:303-345,360-420,454-582`; `docs/opencode-projection.md:18-28`). The catalog has no policy selectors (`docs/opencode-projection.md:36`). These files should remain generated views.
  5. **Direct — repeated selection/policy is current friction:** Export requires at least one repeated `--node` and intentionally has no all-node default (`docs/opencode-projection.md:18`). The runbook requires the same node array for profile, plan, and bind (`README.md:131-181`). `create-profile` then duplicates one selected catalog model into all four role overrides (`scripts/opencode-harness-integration.sh:291-315`).
  6. **Direct — bindings are generated audit/pinning artifacts:** A binding repeats workspace, harness identity, concrete projection hashes, profile hash, and remote nodes (`docs/opencode-harness-integration.md:139-156`). The launcher independently validates and snapshots provider/catalog/profile inputs at each run (`bin/opencode-harness.mjs:788-843,1079-1105`). **Inference:** persisted bindings add rollback/audit and wrapper continuity, but users need not manually create or name them if a single front door recomputes equivalent checks and uses one concrete generation.
  7. **Direct — hard-coded pairing is mirrored maintenance:** The integration script repeats harness commit, package version, and launcher hash (`scripts/opencode-harness-integration.sh:8-10,110-120`), while the launcher already validates its runtime manifest package version, managed bytes, exact compatible OpenCode version, ownership, and modes (`bin/opencode-harness.mjs:160-179,381-471`). **Inference:** replace cross-repository source hash constants with a versioned capability/schema handshake plus normal launcher trust checks; retaining content-addressed package/runtime identity preserves the relevant launch boundary without editing the wrapper on every harness commit.
  8. **Direct — all nodes can be visible independently of role assignment:** Provider projection and routing catalog can contain multiple selected providers (`scripts/export-opencode-projection.sh:310-334`). External catalog/profile are merged only in memory and the provider/catalog sets must match (`bin/opencode-harness.mjs:788-812`; `.opencode/routing/routing-config-loader.mjs:89-128`). Thus one all-ready-nodes catalog can expose every registry node while a small generated profile chooses role defaults.
  9. **Direct — current routing is not three enforced modes:** Resolution supports explicit model, command, role, tier, single-model, and default precedence (`.opencode/routing/routing-policy.mjs:209-295`). Outside force mode, the plugin enforces only non-null native role model overrides; local selectors are advisory (`.opencode/plugin-modules/role-model-routing-enforcement.js:29-55`). External profiles currently reject force-local true (`.opencode/routing/routing-config-loader.mjs:104-111`), and `create-profile` keeps it false while assigning a local native model to every role (`scripts/opencode-harness-integration.sh:303-315`). Therefore present behavior can express local-assigned, inherited-cloud, and per-role mixed defaults, but not truthful hard “local-only”/“cloud-only” prohibitions.
  10. **Direct — source override is not the runtime authority:** The ignored source-local routing file currently mirrors two nodes and defaults all role local selectors to main (`.opencode/routing/harness-model-routing.json:10-31`). Packaged runtime selection prefers the external catalog/profile pair; otherwise it loads its packaged routing fallback (`.opencode/routing/routing-config-loader.mjs:114-137`; `README.md:143-152`). The manually mirrored source override can be removed from the normal external-user workflow.
  11. **Direct — freshness caveat:** Harness HEAD is `37e7f234be7651fc33f78c07c6c533c8f8b0200c`, matching the integration pin. The llama-server HEAD is `4a7d881bc8f5ebc33baa8f6722d9ccfeffd0c454`, but the integration/export scripts and focused integration docs are untracked and its README is modified. Findings about those surfaces describe the current working tree, not committed llama-server behavior.
- Artifact links: `.memory/orchestrations/2026-08-28-simplify-opencode-local/roles/researcher/root-researcher-002-current-friction.md`

### Minimal architecture recommendation

Use **one installed front-door command backed by one canonical node registry**, while preserving the existing exporter and launcher as internal boundaries:

1. `opencode-harness` (or a thin installed companion) accepts no subcommand as “launch here”: derive `git rev-parse --show-toplevel` from the current directory, then feed that absolute root into the existing `canonicalWorkspace`/preflight path. Keep explicit `--workspace` for automation.
2. Add a read-only `nodes` view and deterministic `--nodes all`/default-all-ready expansion in llama-server. Parse `nodes.tsv`; validate every selected private env/projection leaf. Do not silently omit a malformed configured node: show unavailable status and fail launch unless the user explicitly excludes it.
3. Add one transactional `node add` scaffold that plans first, refuses replacement, writes private leaves at `0600`, and creates/reviews the registry row plus overlay/example skeleton. It should not download models, start services, choose SSH hosts, or invent model limits.
4. On launch, generate/reuse one content-addressed provider/catalog generation from all selected ready nodes and generate a profile from a simple mode selection. Pass concrete generation leaves directly to the existing launcher. Profiles, projections, and any session/binding record remain generated artifacts, never user-maintained configuration.
5. Define modes explicitly as either **assignment presets** or **hard policy**. The smallest compatible choice is presets: `mixed` maps selected roles to chosen local models and leaves others inherited; `local-assigned` maps all four roles to a selected local model; `cloud-inherited` leaves all role models null while still loading local providers for TUI visibility. If product language must say “local-only” or “cloud-only,” extend schema/policy/plugin enforcement first; current force-false profiles cannot honestly guarantee either.
6. Collapse `create-profile → plan → prepare-harness → bind → activate → run` into one interactive `launch` workflow, but retain its validations and explicit approval before cache/publication/tunnel mutations. Generate a session record automatically when audit/rollback is desired. Remove manual binding-path handling, repeated node arrays, source-local routing JSON edits, and cross-repository commit/hash constants from the normal workflow—not the underlying input validation, owner/mode/no-follow checks, concrete-generation use, health/tunnel checks, restart notice, workspace preflight, snapshots, or isolated DB cleanup.

### Implementation implications

- Primary harness paths: `bin/opencode-harness.mjs` (current-directory workspace resolution and launch UX), `README.md`, and tests for nested-directory/root derivation and unchanged security preflight.
- Primary llama-server paths: `scripts/opencode-harness-integration.sh` (single `nodes|node add|launch` front door), `scripts/export-opencode-projection.sh` (all-node expansion or a reusable registry enumeration interface), `config/nodes/nodes.tsv`, `docs/adding-a-node.md`, and both README/runbook surfaces.
- Routing paths only if hard exclusivity is required: `.opencode/schemas/harness-routing-profile.schema.json`, `.opencode/routing/routing-config-loader.mjs`, `.opencode/routing/routing-policy.mjs`, `.opencode/plugin-modules/role-model-routing-enforcement.js`, fixtures/tests, runtime/portable manifests, and restart guidance.
- Preserve provider/catalog coherence, loopback-only URLs, explicit context/output/thinking metadata, concrete generation leaves, owner-only external inputs, project collision checks, external trace separation, and remote tunnel/service authorization boundaries.

### Risks and unresolved questions

- “From any directory” is ambiguous: nested directories inside a trusted Git worktree can be supported safely; launching an editable TUI against a non-Git directory conflicts with the current trusted-worktree boundary and should not be inferred.
- “Local-only/cloud-only” is ambiguous between defaults and hard prohibitions. Current code supports defaults, not strict provider allow/deny policy. This decision is required before planning routing schema changes.
- Showing a remote node in `models` does not prove its tunnel or endpoint is live. Node listing must distinguish configured/projectable/reachable without claiming unperformed health evidence.
- Removing persisted bindings from the manual workflow loses an obvious stable audit pointer. Automatic session records or retained content-addressed generation/profile paths are recommended if rollback/audit remains a product requirement.
- The current llama integration is largely uncommitted working-tree work. A planner must not assume it is a stable released API.

## Handoff

- Next role: `planner` in `plan` mode.
- Limitations: Repository/document evidence only. No provider contact, service/tunnel action, live OpenCode run, global configuration inspection, implementation edit, acceptance validation, or historical-artifact reliance was performed.
- Risks: Planner must resolve preset-versus-hard mode semantics and nested-Git-versus-non-Git launch scope before assigning implementation. Preserve all named safety checks while simplifying user-visible choreography.
