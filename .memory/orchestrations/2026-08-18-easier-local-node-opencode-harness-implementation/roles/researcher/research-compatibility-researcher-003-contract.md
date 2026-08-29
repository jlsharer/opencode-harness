```json
{
  "orchestrationId": "2026-08-18-easier-local-node-opencode-harness-implementation",
  "role": "researcher",
  "artifactId": "research-compatibility-researcher-003-contract",
  "createdAt": "2026-08-19T03:49:40Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh researcher packet for scope research-compatibility and taskMode research. The scoped question requests the approved plan's phase-0 paired harness revision and exact CLI compatibility contract before edits in /home/joshl/ai-infrastructure/llama-server/.",
    "requiredContextPresent": "yes; the approved plan, both local checkouts, harness source/package/manifest/tests/history, infrastructure projection source/tests, freshness requirements, source constraints, and downstream needs were available",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Inspected current checked-out bytes and local Git history in both repositories; traced prepare/run parsing, cache, workspace, external-input, environment, executable, child-status, cleanup, and restart contracts; compared the infrastructure projection and profile formats; observed CLI error/help behavior; and ran the harness's offline runtime, foreign-repository, and routing-policy suites. No provider, network, real OpenCode, SSH, Docker, global-configuration, implementation-file, or Git mutation was performed. Only this required trace artifact was written.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md",
      "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs",
      "/home/joshl/projects/opencode-harness/package.json",
      "/home/joshl/projects/opencode-harness/.opencode/runtime.manifest.json",
      "/home/joshl/projects/opencode-harness/README.md",
      "/home/joshl/projects/opencode-harness/.opencode/scripts/runtime-harness.test.mjs",
      "/home/joshl/projects/opencode-harness/.opencode/scripts/runtime-foreign-repo.test.mjs",
      "/home/joshl/projects/opencode-harness/.opencode/routing/routing-config-loader.mjs",
      "/home/joshl/projects/opencode-harness/.opencode/routing/routing-policy.mjs",
      "/home/joshl/projects/opencode-harness/.opencode/schemas/harness-routing-profile.schema.json",
      "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-projection-validation.sh",
      "/home/joshl/ai-infrastructure/.opencode/routing/harness-model-routing.example.json",
      "/home/joshl/ai-infrastructure/.opencode/schemas/harness-model-routing.schema.json",
      "/home/joshl/projects/opencode-harness/.opencode/contracts/role-io-contracts.json",
      "/home/joshl/projects/opencode-harness/.opencode/schemas/memory-trace-artifact.schema.json",
      "/home/joshl/projects/opencode-harness/.memory/templates/role-trace-artifact.md"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/researcher/research-compatibility-researcher-003-contract.md"
    ],
    "commands": [
      "git status --short; git rev-parse HEAD; git log --oneline -10 (both checkouts)",
      "git show/log/diff inspection for current harness revision and the 0.1.8-to-0.1.9 transition",
      "sha256sum bin/opencode-harness.mjs package.json .opencode/runtime.manifest.json",
      "node --version; node bin/opencode-harness.mjs --help and bounded invalid-argument probes",
      "temporary owner-only cache prepare twice with output/path equality check and cleanup",
      "node --test .opencode/scripts/runtime-harness.test.mjs (28/28 PASS)",
      "node --test .opencode/scripts/runtime-foreign-repo.test.mjs (8 PASS, 1 optional external fixture SKIP)",
      "node .opencode/routing/routing-policy.test.mjs (39/39 PASS; MODULE_TYPELESS_PACKAGE_JSON warning)",
      "git diff --check (both checkouts)"
    ]
  },
  "outputContract": {
    "outputs": "Cited findings, exact paired identity recommendation, CLI/environment/path/error contract, implementation implications, risks, unresolved blocker, source list, and next-role recommendation follow.",
    "evidence": "All compatibility claims below are direct evidence unless explicitly labeled inference. Current harness tracked bytes are clean at HEAD apart from the orchestration's untracked memory directory; the infrastructure checkout contains extensive pre-existing modified/untracked llama-server work that an implementer must preserve.",
    "citedFindings": [
      {
        "id": "F1",
        "classification": "direct evidence",
        "finding": "Pair the integration to exact harness commit 7844244131674cd763d994453c1888f50ae3d688 (2026-08-18T22:35:57-05:00), package opencode-harness-runtime 0.1.9, Linux, Node >=24 <25, and exact OpenCode 1.18.18. Record all of commit plus package version plus entrypoint SHA-256 6e2d6b195544f2f3fc1b3c8f60a3aad716a923ede3b2491633003cf099d78a97; package and manifest hashes are f7d3cb41bd8e8c7271ba80deb421e3eb93c532fb94e20bf4aedb71f5535b0004 and 68e5bef13dbd5b796bf9ffcc25b8b3edd82375fd62aa4ce0e806fb5816b9ef78. There is no tag at HEAD and the CLI has no --version command, so package version alone is not a source-revision identity.",
        "sources": ["package.json:1-9,39-44", ".opencode/runtime.manifest.json:2-9", "bin/opencode-harness.mjs:159-178,1023-1031", "local git show/rev-parse/tag/hash command evidence"]
      },
      {
        "id": "F2",
        "classification": "direct evidence",
        "finding": "The only public verbs are help, prepare, and run. Exact source-checkout forms are: node <HARNESS_ROOT>/bin/opencode-harness.mjs prepare [--cache-root ABS]; and node <HARNESS_ROOT>/bin/opencode-harness.mjs run --workspace ABS [--trace-root ABS] [--cache-root ABS] [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE] [--allow-project-plugins] -- <unchanged OpenCode argv>. No forwarded argv opens the TUI; use -- models ... or -- run ... with the OpenCode subcommand first. The wrapper's --ack-opencode-restarted and --yes are wrapper-only flags and must never be forwarded to this CLI.",
        "sources": ["bin/opencode-harness.mjs:948-969,1023-1028", "README.md:30-50", ".opencode/scripts/runtime-harness.test.mjs:189-215", ".opencode/scripts/runtime-foreign-repo.test.mjs:140-153"]
      },
      {
        "id": "F3",
        "classification": "direct evidence",
        "finding": "prepare is both create and verify. It prints exactly the concrete runtime path plus newline and is idempotent for valid bytes. Default cache root is ${XDG_CACHE_HOME:-$HOME/.cache}/opencode-harness; explicit --cache-root must be a canonical absolute trusted path. The concrete leaf is <cache-root>/0.1.9/opencode-1.18.18/runtime. It creates missing suffixes only below verified current-user mode-0700 ancestry, refuses creation directly below sticky /tmp without an existing private child, writes via a private temporary directory and rename, verifies the closed inventory on every call, fails rather than repairing drift, and retains prior version caches. There is no cache-status or rollback verb, so deterministic skip requires wrapper-side inspection or simply rerunning idempotent prepare.",
        "sources": ["bin/opencode-harness.mjs:98-157,394-432,1026", "README.md:132-146", ".opencode/scripts/runtime-harness.test.mjs:139-175", "temporary double-prepare command evidence"]
      },
      {
        "id": "F4",
        "classification": "direct evidence",
        "finding": "run always calls prepareRuntime, even if prepare was a separate checkpoint. --workspace is mandatory in practice and must be an absolute canonical, current-user-owned, trusted, non-group/world-writable Git worktree root exactly equal to git rev-parse --show-toplevel; nested paths are rejected. The workspace is child cwd and is not prepended to argv. The launcher itself does not copy .opencode or edit Git, but the launched OpenCode/project plugins can. A dirty workspace is not rejected by the harness; any dirty/unsafe-real-workspace acknowledgment in the approved plan must be implemented by the integration wrapper.",
        "sources": ["bin/opencode-harness.mjs:434-445,966-975,1008-1013", "README.md:136,148-154", ".opencode/scripts/runtime-foreign-repo.test.mjs:86-137"]
      },
      {
        "id": "F5",
        "classification": "direct evidence",
        "finding": "The four run inputs required by the plan are accepted as workspace, provider projection, endpoint catalog, and routing profile. Provider is independently optional; catalog and profile are an all-or-none pair. Every supplied external file must resolve from an absolute path to a current-user-owned mode-0600 regular file with trusted ancestry, no followed leaf symlink, <=1 MiB, stable while read, and valid JSON. Validated bytes are copied unchanged to owner-only per-launch snapshots; only snapshot paths are exported, and they are removed after exit. When both provider and catalog are supplied, provider IDs, model membership, and baseURL/catalog URL must match exactly and provider/catalog sets must be equal.",
        "sources": ["bin/opencode-harness.mjs:48-62,676-681,699-741,969,977-999", "README.md:52-130", ".opencode/scripts/runtime-harness.test.mjs:380-445"]
      },
      {
        "id": "F6",
        "classification": "direct evidence",
        "finding": "The infrastructure exporter emits exactly the harness-compatible provider and catalog shapes and publishes mode-0600 files under one mode-0700 concrete generation; stderr prints the concrete generation, provider, and catalog paths. The provider requires ai-infra-* IDs, @ai-sdk/openai-compatible, canonical http://127.0.0.1:<1..65535>/v1, exactly one name-matching model per provider, positive bounded context/output with output<context, and exact boolean enable_thinking. Catalog schemaVersion is 1.0.0 with matching provider-prefixed model, same loopback URL, and positive bounded maxInFlight. Bind must pass concrete generation leaves, never current.",
        "sources": ["llama-server/scripts/export-opencode-projection.sh:303-345,360-420,487-582", "llama-server/tests/opencode-projection-validation.sh:210-228,475-645", "bin/opencode-harness.mjs:699-741,992-999"]
      },
      {
        "id": "F7",
        "classification": "direct evidence",
        "finding": "The harness external routing profile is not the tracked wrapped example verbatim. It must be an unwrapped schema-2 object with exactly schemaVersion, defaultMode, defaultModel, singleModel, localRouting, roleOverrides, commandOverrides, orchestratorCommands, and complexityTiers. external localRouting must contain exactly enabled, forceLocalForHarnessSubagents, and defaultLocalModel: embedded models are forbidden because the separate catalog is merged in; forceLocalForHarnessSubagents must be false. Every selected localModel/defaultLocalModel must reference a catalog key, and the fixed roles are exactly researcher/planner/implementer/validator. The ai-infrastructure tracked example is wrapped in harnessModelRouting and embeds localRouting.models, so documentation must instruct creation of a separate owner-only unwrapped profile rather than passing that file directly.",
        "sources": [".opencode/routing/routing-config-loader.mjs:83-112", ".opencode/routing/routing-policy.mjs:72-137", ".opencode/schemas/harness-routing-profile.schema.json:1-57", "/home/joshl/ai-infrastructure/.opencode/routing/harness-model-routing.example.json:1-42", "README.md:95-127"]
      },
      {
        "id": "F8",
        "classification": "direct evidence",
        "finding": "There is no standalone, non-mutating CLI command for profile/provider/catalog validation. Validation occurs inside run only after project preflight, runtime prepare, and trace-root selection and before the requested child, but a successful run then resolves/probes/spawns exact OpenCode. The public CLI exports prepareRuntime only; routing merge/normalization modules are internal source APIs, not a documented CLI compatibility surface. Therefore the approved plan's phase-0 requirement for a non-mutating profile-validation surface is not met by revision 7844244.",
        "sources": ["bin/opencode-harness.mjs:406,948-1028", "README.md:30-39,156-173", "approved plan simplified-setup-plan.md:62-66,195-206"]
      },
      {
        "id": "F9",
        "classification": "direct evidence",
        "finding": "run rejects pre-set OPENCODE_CONFIG_DIR, OPENCODE_CONFIG_CONTENT, OPENCODE_CONFIG, OPENCODE_DB, all OPENCODE_HARNESS_* activation/routing/probe roots, and forbidden forwarded --pure, --dir/--dir=, --project*, and --config* tokens. It sets OPENCODE_CONFIG_DIR, OPENCODE_HARNESS_RUNTIME_ROOT, OPENCODE_HARNESS_WORKSPACE_ROOT, OPENCODE_HARNESS_TRACE_ROOT, unique OPENCODE_DB, and snapshot OPENCODE_CONFIG/catalog/profile variables. XDG_DATA_HOME passes through unchanged. OPENCODE_BIN may select an absolute canonical trusted executable; otherwise the first executable opencode in absolute PATH order is selected. The resolved executable must report stdout exactly 1.18.18 for --version and remain byte-identical through probes.",
        "sources": ["bin/opencode-harness.mjs:20-27,886-945,966-968,1004-1013", "README.md:134-154", ".opencode/scripts/runtime-harness.test.mjs:447-460,595-604"]
      },
      {
        "id": "F10",
        "classification": "direct evidence",
        "finding": "Trace selection is explicit canonical absolute --trace-root, else a safe Git-ignored workspace .memory, else owner-only XDG state keyed by workspace. Runtime/workspace/trace roots may not overlap except workspace/.memory. External trace roots trigger an OpenCode agent-list activation probe before requested execution. The integration binding must not assume run is side-effect-free: run can verify/create cache, seed trace memory, create temporary launch/database snapshots, and probe OpenCode even before requested argv.",
        "sources": ["bin/opencode-harness.mjs:636-674,899-919,972-975,1010-1013", "README.md:138-146"]
      },
      {
        "id": "F11",
        "classification": "direct evidence",
        "finding": "Normal launcher/preflight errors are written to stderr and exit 1; prepare success writes the runtime path to stdout. Requested OpenCode stdio is inherited. A normal child nonzero status is propagated exactly after snapshot cleanup (fixture status 23 remained 23). Cleanup/inventory failure can replace that status with launcher exit 1 while preserving the original child failure text and reporting an exact retained launch/quarantine path. Help exits 0. There is no machine-readable summary output contract.",
        "sources": ["bin/opencode-harness.mjs:770-864,1013-1031", ".opencode/scripts/runtime-harness.test.mjs:558-592", "observed help/invalid-option command evidence"]
      },
      {
        "id": "F12",
        "classification": "direct evidence",
        "finding": "The harness parser is not itself a closed per-verb parser: recognized options are accepted independent of verb, repeated value options overwrite earlier values, -- ends parsing even for prepare, and --allow-project-plugins can repeat. Unknown/incomplete options fail. The approved wrapper must enforce its own unknown/repeated/conflicting/per-verb argument closure and must not infer that harness acceptance means wrapper syntax is valid.",
        "sources": ["bin/opencode-harness.mjs:948-959", "bounded observed duplicate/irrelevant-option probes"]
      },
      {
        "id": "F13",
        "classification": "direct evidence",
        "finding": "Restart is an operator boundary, not a harness operation: fully quit and restart OpenCode after package/provider/routing/plugin/agent/command/skill/config changes. The CLI has no restart or acknowledgment flag. The integration run verb may require and consume --ack-opencode-restarted before invoking the harness, but cannot verify that the quit actually happened.",
        "sources": ["README.md:148-154", "approved plan simplified-setup-plan.md:45-53,79-80"]
      },
      {
        "id": "F14",
        "classification": "direct evidence",
        "finding": "Current offline compatibility evidence passed: runtime-harness 28/28; runtime-foreign-repo 8/8 runnable with one optional external fixture skipped; routing policy 39/39. These tests use fake exact-version OpenCode and establish syntax, forwarding, validation, cache, trace, environment, cleanup, and Git boundaries—not live provider health, authentication, model identity, network, restart, or capacity.",
        "sources": ["local test command outputs", "README.md:154-173"]
      }
    ],
    "sourceList": [
      {"source": "approved simplified setup plan", "path": "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md", "use": "authoritative intended checkpoints, phase-0 gate, files, and acceptance"},
      {"source": "harness CLI", "path": "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs", "use": "primary direct implementation contract"},
      {"source": "package/manifest/README", "paths": ["package.json", ".opencode/runtime.manifest.json", "README.md"], "use": "version, platform, exact OpenCode, published grammar, restart/trust contract"},
      {"source": "harness offline tests", "paths": [".opencode/scripts/runtime-harness.test.mjs", ".opencode/scripts/runtime-foreign-repo.test.mjs", ".opencode/routing/routing-policy.test.mjs"], "use": "observed forwarding, cache, profile, snapshot, status, environment, and Git behavior"},
      {"source": "routing implementation/schema", "paths": [".opencode/routing/routing-config-loader.mjs", ".opencode/routing/routing-policy.mjs", ".opencode/schemas/harness-routing-profile.schema.json"], "use": "exact external profile and catalog merge semantics"},
      {"source": "infrastructure projection", "paths": ["llama-server/scripts/export-opencode-projection.sh", "llama-server/tests/opencode-projection-validation.sh", ".opencode/routing/harness-model-routing.example.json", ".opencode/schemas/harness-model-routing.schema.json"], "use": "provider/catalog generation and profile-format compatibility"},
      {"source": "local Git/history and command observations", "use": "exact revisions, hashes, working-tree state, CLI output, and current offline test results"}
    ],
    "implementationImplications": [
      "Minimum supported harness identity should be the conjunction commit=7844244131674cd763d994453c1888f50ae3d688, packageVersion=0.1.9, entrypointSha256=6e2d6b195544f2f3fc1b3c8f60a3aad716a923ede3b2491633003cf099d78a97, platform=linux, nodeMajor=24, opencodeVersion=1.18.18. Do not accept package version alone and do not call a nonexistent harness --version.",
      "prepare-harness --yes should exec node <bound-harness-root>/bin/opencode-harness.mjs prepare with the bound optional --cache-root, preserve stdout/stderr/status, and treat successful rerun as the supported status check. It must not pass workspace/profile/projection flags.",
      "run should exec node <bound-harness-root>/bin/opencode-harness.mjs run --workspace <bound absolute Git root> --provider-config <concrete generation/opencode.providers.json> --routing-catalog <same concrete generation/harness-endpoints.json> --routing-profile <reviewed owner-only unwrapped profile> [bound cache/trace options] -- <only models or run argv>. Consume wrapper acknowledgments before exec; preserve argv boundaries and status.",
      "plan can inspect package.json, runtime.manifest.json, entrypoint hash, paths, schemas, exporter --dry-run, and workspace Git state offline, but cannot truthfully claim harness profile validation through the existing CLI. bind likewise cannot satisfy the approved plan's required harness-native non-mutating profile-validation gate without the blocker below being resolved.",
      "Binding schema should store the exact identity tuple above and concrete generation leaves/hashes. Runtime should recompute identity and hashes, reject current links/mixed generations, and recheck before exec. Harness root is a source checkout root; the executable path is <root>/bin/opencode-harness.mjs and Node is part of the contract.",
      "The reviewed profile authoring instructions must explicitly unwrap harnessModelRouting and remove localRouting.models. Profile/catalog semantic checks must include references and force-local=false, not merely JSON Schema. The provider/catalog coherence check is separately required.",
      "The wrapper must implement strict per-verb parser closure, duplicate rejection, absolute/canonical path checks, dirty-workspace policy, redacted categorized output, and before/after Git observation itself; these are not guaranteed by the harness parser.",
      "Validator fixtures should pin the real checkout identity and run the two harness suites plus routing policy, test double-prepare equality, use fake OpenCode for exact prepare/run forwarding and status propagation, assert profile rejection before requested spawn, and distinguish static/fake compatibility from live acceptance. The plan's proposed test --harness-root option belongs to the future infrastructure fixture, not the harness CLI."
    ],
    "risks": [
      "BLOCKER: revision 7844244 has no standalone non-mutating external profile-validation CLI. Under the approved phase-0 wording, implementation must stop or obtain a separately approved harness change/revised acceptance decision; importing internal modules or invoking run with fake OpenCode would invent an unsupported production CLI contract.",
      "The infrastructure tracked routing example is incompatible as a direct external profile because it is wrapped and embeds models. Passing it unchanged fails closed.",
      "No Git tag identifies 0.1.9/HEAD, and the CLI lacks --version; a moved checkout or same-version different commit can evade version-only pairing unless commit and hash are checked.",
      "run performs cache/trace/snapshot/probe side effects and may invoke live OpenCode/provider operations; never use it as plan's read-only validation step.",
      "Cleanup failure changes the externally observed exit to launcher failure even when a child status exists; wrapper diagnostics must preserve full stderr and retained-path guidance rather than reporting only the numeric code.",
      "The ai-infrastructure worktree already has unrelated modified/untracked llama-server files. Implementation must preserve them and cannot use baseline cleanliness as an assumption.",
      "Offline PASS does not establish real OpenCode restart, provider/tunnel/model health, authentication, capacity, or live request behavior."
    ],
    "unresolvedQuestions": [
      "Will the parent authorize a separately scoped opencode-harness change that adds a stable non-mutating validation verb, or explicitly revise the approved phase-0 acceptance to permit a repository-owned validator against pinned schema/policy code? Until one occurs, phase 0 is blocked.",
      "If a harness validation verb is authorized, its exact machine-readable output, no-write proof, exit codes, and whether it validates provider+catalog+profile coherence together remain unspecified and require a new scoped contract.",
      "A real workspace backup mechanism remains outside harness behavior and was not established locally."
    ],
    "recommendedNextRole": "planner",
    "traceArtifactPath": ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/researcher/research-compatibility-researcher-003-contract.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/researcher/research-compatibility-researcher-003-contract.md",
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md"
    ]
  },
  "handoff": {
    "nextRole": "planner",
    "limitations": "Research only. No implementation or acceptance validation was performed. Real OpenCode/provider/network/SSH/Docker/restart behavior was not exercised. The current source checkout, local history, fake-child tests, and offline routing tests are the evidence boundary.",
    "risks": "The approved implementation is blocked at phase 0 because the pinned harness lacks the required non-mutating profile-validation CLI. A planner should resolve that explicit contract conflict and scope either a separate harness change or an approved acceptance revision before any implementer edits llama-server."
  }
}
```
