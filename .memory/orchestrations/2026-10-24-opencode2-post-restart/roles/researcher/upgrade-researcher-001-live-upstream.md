# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-opencode2-post-restart
- role: researcher
- artifactId: upgrade-researcher-001-live-upstream
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: upgrade research, upstream live version and V2 migration/API effects; local `bin/`, `.opencode/`, `package.json`, `README.md`.
- Required context present: yes; freshness as of 2026-10-24; public primary upstream only.
- Routing metadata status: absent (no routing labels supplied).

## Work Performed
- Summary: WebFetch returned upstream GitHub API, releases page and official V1/V2 documentation. No native ask or network denial observed; a few guessed V2 URLs returned explicit 404. Inspected local launcher, plugin, config, role and manifest surfaces. No workspace edits.
- Files read: `bin/opencode-harness.mjs`, `.opencode/plugins/index.js`, `.opencode/runtime.manifest.json`, `.opencode/agents/researcher.md`, `.opencode/commands/delegate-research.md`, `.opencode/package.json`, `opencode.json`, `package.json`, researcher contracts/schema/template.
- Files changed: none.
- Commands/checks: WebFetch public upstream URLs and local read/grep only; no shell gates or live installation/activation tests.

## Output Contract
- Outputs: Upstream GitHub releases/latest returns V1 v1.19.4 published 2026-10-22T13:03:41Z, NOT global latest across both lines. Tags API shows V2 v2.1.4 above v2.1.3; tagged commit `release: v2.1.4` has author/committer timestamp 2026-10-23T10:14:51Z (commit timestamp, not publication timestamp). V2 docs advertise @opencode/cli and @opencode/plugin; V1 plugins cannot run in V2 without port. Local V1 plugin default-exports async function returning hook object; local runtime sole production dependency is exact @opencode-ai/plugin version matching CLI cache identity. V2 native agent permissions and command nomenclature differ, with V1 translation documented; API calls, plugin tools/hooks and guard invariants need independent revalidation.
- Evidence: https://api.github.com/repos/anomalyco/opencode/releases/latest (tag v1.19.4, published_at 2026-10-22T13:03:41Z); https://github.com/anomalyco/opencode/releases (V1 release list and V2 explicit upgrade announcement); https://api.github.com/repos/anomalyco/opencode/tags?per_page=20 (v2.1.4 tag); https://api.github.com/repos/anomalyco/opencode/commits/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824 (release commit timestamp, package version bumps and @opencode/cli/plugin); https://opencode.ai/v2/docs/migrate-v1/ (breaking plugin and server APIs, V1 compatibility translation); https://opencode.ai/v2/docs/build/plugins/migrate-v1/ (V2 plugin port); https://opencode.ai/v2/docs/plugins/ (discovery rules); https://opencode.ai/v2/docs/agents/; https://opencode.ai/v2/docs/commands/; https://opencode.ai/docs/plugins/ (historic V1 API); local `.opencode/plugins/index.js:1-19`, `bin/opencode-harness.mjs:449-474,1688-1708`, `.opencode/runtime.manifest.json:14-21,59-63`, `.opencode/agents/researcher.md:1-12`, `opencode.json:1-7`.
- Artifact links: this trace artifact.

## Handoff
- Next role: planner.
- Limitations: GitHub releases/latest is V1 channel, v2.1.4 tag + release commit prove tag/version and commit time but not a V2 release publication time or registry availability; no native OpenCode 2 binary or SDK activation was tested. V2 docs are mutable; pin source versions for change design. No acceptance gates executed.
- Risks: V1 plugin guard will not run on V2; absent guard undermines managed dispatch proof. V1-only @opencode-ai/plugin dependency and provider projection/API assumptions need replacement or explicit dual-version policy. V2 default external_directory permission is allow and background command behavior differs; do not silently assume equivalence.
