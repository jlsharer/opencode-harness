# Role Trace Artifact

## Metadata
- orchestrationId: 2026-10-24-v2-artifact-provenance
- role: researcher
- artifactId: artifact-researcher-001-provenance
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Research v2.1.4 Linux x64 official artifact/provenance and CLI/native integration sources at pinned commit 68bc26b7da1990ce10ffecfbc1e09eb13aa5d824; downstream isolated offline verification handoff.
- Required context present: yes; taskMode research; scoped documentation targets, source constraints and freshness requirement supplied.
- Routing metadata status: absent; caller routing labels absent, no values inferred.

## Work Performed
- Summary: WebFetch read-only queries of GitHub tag/commit/release API, commit-pinned official installer and CLI source, npm registry metadata for official installer-named packages. No binary retrieval or execution.
- Files read: `bin/opencode-harness.ts` (especially 470-484, 909-950); `.opencode/scripts/runtime-harness.test.mts` (151-205); `.opencode/src/plugins/index.ts` (1-24); role contract, trace schema, memory template.
- Files changed: none (only this immutable trace).
- Commands/checks: WebFetch only; no shell commands, binary downloads, gate runs or artifact integrity verification.

## Output Contract
- Outputs: Cited findings, source URLs, implications, risks and next role below.
- Evidence: Git tag ref is commit 68bc26b7da1990ce10ffecfbc1e09eb13aa5d824 [S1], commit verification reports unsigned [S2]. GitHub releases/tags/v2.1.4 API returned HTTP 404 [S3]; HTML tag/release shell shows commit but assets failed to load [S4], so NO GitHub release-asset integrity claim. Pinned installer selects @opencode/cli-linux-x64 or baseline for Linux x64 and downloads npm tarballs [S5]. Registry @opencode/cli-linux-x64@2.1.4 responds with SHA-512 integrity, SHA-1 shasum, npm signatures, and GitHub Actions trustedPublisher metadata [S6]; baseline has distinct metadata [S7]. Binary archive bytes, standalone binary hash and commit-to-tarball correspondence remain unverified.
- Artifact links: `orchestrations/2026-10-24-v2-artifact-provenance/roles/researcher/artifact-researcher-001-provenance.md`.

### Cited findings (direct unless marked inference)
1. [S1] `refs/tags/v2.1.4` has object type commit and SHA `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824`. [S2] commit message `release: v2.1.4`, author date 2026-10-23T10:14:51Z, verification `verified:false`, `reason:unsigned`. Tag identity does not authenticate distributed binary.
2. [S3] GitHub releases API GET exact `v2.1.4` returned 404; GET `2.1.4` also returned 404. [S4] GitHub HTML tag/release shows commit and `Assets 2` followed by loading error, NOT a verified list of downloadable CLI assets; cannot quote any GitHub release checksum/signature or conclude no release exists.
3. [S5] Commit-pinned `install` derives Linux x64 from uname and selects `@opencode/cli-linux-x64` for AVX2 glibc, `-baseline` for no AVX2, adds `-musl` for musl; checks registry version; constructs `https://registry.npmjs.org/$package_name/-/cli-$target-$specific_version.tgz`; extracts `package/bin/opencode`. Installer itself writes home config/PATH, so MUST NOT execute it in managed reader.
4. [S6] Registry metadata for `@opencode/cli-linux-x64@2.1.4`: tarball `https://registry.npmjs.org/@opencode/cli-linux-x64/-/cli-linux-x64-2.1.4.tgz`; `dist.integrity` `sha512-o8EJ0ZsT4dzDKN+0mpG2EKbNGzJyp+F1++Av28UReRVfiEv+N34eZEnN/unkiMoerKHad6W6Ii7k4ukTnPNmNQ==`; `dist.shasum` `bab7f51f381aa0c6b31415fbb1b17c365cd8cf23` (SHA-1). Registry `dist.signatures` has two npm signatures under key id `SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`; `_npmUser.trustedPublisher` identifies github/GitHub Actions and OIDC config id `8e7d7d00-f6ca-422c-8229-7dbcbbeea0e6`. These are registry assertions, not independently checked attestations or binary SHA-256.
5. [S7] Registry `@opencode/cli-linux-x64-baseline@2.1.4` has separate tarball `https://registry.npmjs.org/@opencode/cli-linux-x64-baseline/-/cli-linux-x64-baseline-2.1.4.tgz` and `sha512-0/H4wRDAW4hA5IWN440XwDrRATbvT3cno+UUsqFynTu0TeGXNADjK2AZfvhNTfyJaVyCa+v7VhB+r7ghuMa5EQ==`. Do not mix checksums between variants.
6. [S8] Pinned `packages/cli/package.json` claims version 2.1.4 and `bin` launcher `./bin/opencode.cjs`; [S9] launcher locates platform package executable under `node_modules/@opencode/cli-linux-x64/bin/opencode` and directly spawns it; executable is not the Node wrapper. [S10] pinned CLI `src/index.ts` starts through Bun shebang and Effect runtime. [S11] `src/config/config.ts` reads CLI config from `cli.json` with `OPENCODE_CLI_CONFIG_CONTENT`; [S12] `src/database-path.ts` supports `OPENCODE_DB`. Inference: v2 config/Task host architecture differs from this harness's currently targeted OpenCode, so compatibility is unproven, not solved by version string alone.
7. [L1] Harness launcher accepts nonempty bounded version diagnostics without allowlist and probes selected executable; caches by reported version. [L2] tests use fake binary with `--version`, `models/agent/run/serve` grammar, not native v2 binary. [L3] plugin composition (`lifecycle`, `routing`, `tracePermissions`) is local source and does not prove v2 native Task hook/lifecycle behavior. No native Task-lifecycle source implementation was established in this research scope.

### Exact source list
- [S1] https://api.github.com/repos/anomalyco/opencode/git/ref/tags/v2.1.4
- [S2] https://api.github.com/repos/anomalyco/opencode/git/commits/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824
- [S3] https://api.github.com/repos/anomalyco/opencode/releases/tags/v2.1.4 (HTTP 404 on 2026-10-24)
- [S4] https://github.com/anomalyco/opencode/releases/tag/v2.1.4
- [S5] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/install
- [S6] https://registry.npmjs.org/%40opencode%2fcli-linux-x64/2.1.4
- [S7] https://registry.npmjs.org/%40opencode%2fcli-linux-x64-baseline/2.1.4
- [S8] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/package.json
- [S9] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/bin/opencode.cjs
- [S10] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/index.ts
- [S11] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/config/config.ts
- [S12] https://raw.githubusercontent.com/anomalyco/opencode/68bc26b7da1990ce10ffecfbc1e09eb13aa5d824/packages/cli/src/database-path.ts
- [L1] `bin/opencode-harness.ts:470-484,909-950`.
- [L2] `.opencode/scripts/runtime-harness.test.mts:151-205`.
- [L3] `.opencode/src/plugins/index.ts:1-24`.

### Implementation implications (not a plan)
- Separate the tag SHA, registry tarball SHA-512 and extracted executable digest; metadata does not establish that the published tarball derives from the tagged commit. External authorized verifier should check CPU AVX2/libc selection, fetch and freeze JSON metadata, verify downloaded tarball SHA-512 against matching version/variant, validate npm signatures using independently sourced trusted npm signing keys if required, inspect tar member paths/permissions before isolated extraction, record extracted binary SHA-256, then separately observe `--version`/native CLI behavior under bounded credentials-free isolation. These checks have NOT run here.
- If verifying native Task/config compatibility, read v2-pinned server/client/plugin source and observe native process callbacks/API explicitly rather than assume the v1 harness fake tests establish it.

## Handoff
- Next role: validator (`artifact-proof`), only under separately authorized external verification for downloads/execution; otherwise researcher follow-up for pinpointed pinned native Task lifecycle source.
- Limitations: No archive or executable downloaded, installed or executed; no signature verified; no acceptance gates run. GitHub release API failed 404 and HTML asset list failed to load. No proof of binary build origin from tag commit, no binary checksum, and native Task-lifecycle API remains unresolved.
- Risks: Registry metadata may change or be compromised; npm dist signature presence is not signature verification or source-to-binary attestation. Existing local tests target a fake v1-style CLI and cannot attest v2 runtime/config/Task compatibility; enabling live provider transport or changing global configuration is outside scope.
