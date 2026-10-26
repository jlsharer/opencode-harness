# OpenCode Harness Design

## Purpose and Scope

This source-only document defines a standalone OpenCode projection of the Universal Agentic Harness and its release process. `.opencode/harness.manifest.json` inventories the complete source/release surface, including source roots and optional assets. The narrower installable surface is the `portable-core` profile in `.opencode/portable.manifest.json`; portable files do not depend on this document or other source-only roots.

The harness preserves exactly four active role names:

- `researcher`
- `planner`
- `implementer`
- `validator`

Specialized behavior is expressed by explicit bounded packet modes: researcher `research`; planner `plan|synthesis`; implementer `implementation|integration`; validator `validation|review|artifact-proof|integration-check`.

The baseline projection covers role agents, command prompts, the authoritative `delegation-orchestrator` skill, explicit validator task modes, a harness-owned model routing resolver, lifecycle guardrails, and validation tooling. It does not define provider credentials, durable task state, external routing services, or canonical durable orchestration ledgers. Its task-thread guard retains only process-local, non-durable authorization state and fails closed after restart.

## Packaged External Runtime

The root package (`opencode-harness-runtime` 0.1.12) adds a no-copy launch mode for Linux, Node `>=24 <25`, and a trusted OpenCode executable without a version allowlist. `prepare` resolves and probes the selected trusted executable, then copies only `.opencode/runtime.manifest.json` mappings from the immutable package into `${XDG_CACHE_HOME:-$HOME/.cache}/opencode-harness/0.1.12/opencode-<reported-version>/runtime`. The concrete runtime is owner-only, managed files are byte-verified, and only OpenCode's declared package support files may be added. Existing collisions, symlinks, unsafe modes/ownership, and managed drift fail rather than being repaired. Prior version directories, including 0.1.11, are retained unchanged for rollback and are never repaired or selected as 0.1.12.

`run` requires an absolute canonical Git worktree root. It sets `OPENCODE_CONFIG_DIR` and `OPENCODE_HARNESS_RUNTIME_ROOT` to the prepared mutable runtime, `OPENCODE_HARNESS_WORKSPACE_ROOT` to the foreign worktree, `OPENCODE_DB` to a unique absolute path in an owner-only per-launch snapshot, and passes `XDG_DATA_HOME` through unchanged. The database, WAL, and SHM paths are independently absent when the child starts. `OPENCODE_HARNESS_TRACE_ROOT` points to either an explicit safe root, an already-ignored workspace `.memory`, or owner-only XDG state keyed by the canonical workspace. It never creates a workspace `.opencode`, edits `.gitignore`, reads auth data, installs globally, or changes user config. Pre-set activation variables, including ambient `OPENCODE_DB`, project harness-name collisions, routing shadows, unsafe roots, and unacknowledged project plugins fail before OpenCode spawn. The launcher records canonical path plus device/inode identities for the snapshots parent and launch directory at creation and accepts only owner-mode-0600 database, WAL, and SHM companions at its exact launch paths. Before any post-child inventory or `readdir`, and again before destructive cleanup, it revalidates parent and launch identities, owner/mode, immediate-child containment, canonical paths, and root exclusions. It then atomically renames the launch directory to a random quarantine name in the same verified parent, requires unchanged parent identity and matching launch/quarantine device/inode, and only then recursively unlinks entries using `lstat` without following symlinks. Successful cleanup explicitly revalidates parent identity and quarantine-path absence. Any guard, rename, post-check, or unlink failure preserves the original child/inventory rejection as the primary message and appends cleanup failure detail; pre-rename mismatch reports an exact absolute retained launch path, while renamed retained quarantine is reported by exact absolute path. Identity or containment mismatch causes no deletion attempt. Node lacks descriptor-relative recursive unlink primitives, so same-UID replacement between nested path operations remains a documented race limit. `OPENCODE_CONFIG` provider fragments still precede project config, so project provider declarations are refused rather than described as overridden.

Endpoint catalogs and routing profiles are separate owner-only mode-0600 inputs. Both must be supplied together. The closed catalog contributes only `ai-infra-*` provider-prefixed model IDs, canonical loopback HTTP `/v1` URLs, and bounded positive `maxInFlight`; the closed profile can select those entries but cannot contain a catalog, provider options, credentials, or force-local policy. The merge is in memory and advisory. Force-local/cloud-deny is unsupported because an OpenCode plugin config-hook error is not a proven startup boundary.

`validate-inputs` reuses `run`'s external provider/catalog/profile validation and accepts provider alone, catalog plus profile, or all three. It performs only package compatibility and explicit owner-mode-0600 input reads. It does not select or inspect a workspace, prepare cache/runtime/trace state, create snapshots or databases, resolve an executable, spawn OpenCode or another child, contact a provider, or inspect or mutate global OpenCode/auth state. Its compact success record proves offline structural and semantic compatibility only; activation, health, model identity, authentication, capacity, and restart acceptance remain separate gates.

The runtime tree is recursively closed. Every manifest-managed file and intermediate directory has an exact owner/type/mode contract; generated support state uses a typed allowlist, and only owner-private `node_modules` may recurse. Symlinks are rejected everywhere except immediate, safely named children of the top-level `node_modules/.bin`. Each exception must be current-user-owned, relative, stable across repeated identity/text checks, lexically and physically contained by the same `node_modules`, free of symlinked target components, and resolved to a current-user-owned non-group/world-writable regular file. Its name and exact relative text must be uniquely authorized by the declaring installed package's string or object `bin` metadata; that package's name, location, and version must agree with a non-link outer `package-lock.json` entry. Installed scoped and unscoped top-level package manifests are handled without npm libraries.

Generated `package.json`, `package-lock.json`, and `node_modules` are accepted only as a complete set. The root package's sole production dependency, the lock root, the installed plugin package, and its lock entry must all bind `@opencode-ai/plugin` exactly to the selected OpenCode version, and the outer lock must use lockfile version 3. Alternate direct dependency sections, conflicting bin providers, malformed metadata, lock link entries, wrong link names/text, and package-version mismatches fail without repair. Validation is dependency-free and needs neither network access nor a reference installation. It establishes a narrow structural and metadata relationship only: it does not authenticate installed bytes, registry responses, or package artifacts. The launcher reads managed and metadata leaves with `O_NOFOLLOW` where Linux exposes it and checks identities before/after validation. Node does not provide a complete descriptor-relative `openat` traversal API, so these controls target accidental or other-UID drift and are not advertised as protection against a malicious process with the same UID, a compromised registry, or a compromised package artifact.

Each selected trace root is recursively owner-only and seeded, without overwrite, from immutable `runtimeRoot/bootstrap/memory` protocol/index/template files. External prompts read immutable contracts and protocol from runtimeRoot and write only generated indexes/traces beneath traceRoot; portable mode retains project-relative behavior. Unsafe ignored project memory falls back to XDG state, while an unsafe explicit trace root fails. For an external root, the separate trace-permission config hook independently revalidates canonical owner-only roots and appends four role-specific absolute `external_directory` rules plus three role-specific workspace-relative Markdown-only edit rules. The implementer edit object is unchanged. Workspace `.memory` is an exact no-op fallback. Because OpenCode 1.18.18 swallows config-hook errors, the launcher first runs `agent list` under a distinct owner-only launch database and requires an exclusive mode-0600 marker containing the exact permission-plan digest; mismatch stops before the requested process. This lexical permission boundary does not prevent malicious same-UID replacement, and the marker is an activation guardrail rather than acceptance proof.

Before spawn, root and project `.opencode` JSON/JSONC files are bounded and parsed. JSONC support is deliberately limited to quoted-string-aware line comments, block comments, and trailing commas, followed by `JSON.parse`; malformed or ambiguous input fails closed. Agent, command, delegation skill, routing shadow, and harness plugin collisions are rejected. Config-declared and recursively discovered project plugins require `--allow-project-plugins`, which is acknowledgment of same-user code execution rather than isolation.

Provider input is the closed credential-free `ai-infra-*` projection only: the fixed OpenCode schema and adapter, one name-matching model per provider, exact positive integer `limit.context` and `limit.output` metadata bounded at 2147483647 with `output < context`, required `options.chat_template_kwargs.enable_thinking` as an exact JSON boolean, and canonical loopback HTTP `/v1` ports 1 through 65535. The thinking value is projected into the model's native request-body options; string, null, missing, extra, and unknown option fields are forbidden rather than defaulted. Catalog/profile/provider bytes are validated once before being copied unchanged to mode-0600 files in a mode-0700 per-launch snapshot outside runtimeRoot; only snapshot paths reach OpenCode/plugin, and snapshots are removed after child exit. `OPENCODE_BIN` and PATH resolution must produce one stable absolute executable used for both version diagnostic probe and launch.

Root creation uses one lexical trust algorithm before any mkdir or realpath operation. Inputs must already be absolute and canonical, with no dot/dot-dot, duplicate or trailing separator, NUL, or symlink component. Existing components are walked with `lstat`; missing components may be created one at a time only below a current-user mode-0700 parent with parent identity rechecks. Root-owned sticky `/tmp` remains supported only when its immediate current-user mode-0700 child already exists. This intentionally rejects shared group/world-writable worktrees and unsafe cache/state/trace/snapshot ancestry.

OpenCode rereads live project state, so project configuration is not snapshot-capable in this design. The launcher requires non-group/world-writable workspace, `.opencode`, config, plugin, and custom skill surfaces, fingerprints their presence and bytes, and repeats preflight after the version probe immediately before spawn. Custom `skills.paths` must be absolute trusted directories; their complete trees are checked for `delegation-orchestrator/SKILL.md`. `--allow-project-plugins` acknowledges current-user code only and never permits an other-UID-writable surface.

PATH fallback follows standard ordering until it finds the first executable `opencode` candidate. Only that selected candidate and its resolved ancestry are trust-validated; unrelated later entries, including mixed WSL/Windows tool paths, cannot invalidate an already selected trusted executable. If the first candidate is unsafe, launch fails rather than searching for a later replacement. Explicit `OPENCODE_BIN` is an operator selection with the same canonical target, resolved ancestry, ownership, mode, diagnostic reporting, and before/after byte-identity checks. Symlink spelling may resolve only to such a trusted canonical target. Neither mode claims isolation from malicious same-UID replacement in the final check-to-exec interval.

Repeated project-state fingerprints use descriptor-stable streaming SHA-256 with fixed memory rather than the structured-input parser limit. JSON/JSONC and external projection documents remain size-bounded, while ordinary OpenCode-loadable agent, command, plugin, skill, and custom-skill assets may exceed 1 MiB and remain insertion/change-detectable.

External operation uses `node bin/opencode-harness.mjs run --workspace /absolute/git/root` and optional `--provider-config`, `--routing-catalog` plus `--routing-profile`, and `--trace-root`. Tokens after `--` are passed unchanged as OpenCode argv while the workspace is supplied only as child cwd: no forwarded tokens starts the TUI there, and forwarded forms keep subcommands such as `models` or `run` first. Project-local plugins are same-user executable code and require `--allow-project-plugins`; this is acknowledgment, not sandboxing. Fully quit and restart OpenCode after package, config, routing, or plugin changes. Offline tests use a fake exact-version executable and prove launch environment and Git boundaries, not real model identity, endpoint health, auth, or activation.

## Standalone OpenCode Surface

The OpenCode harness owns these files:

- Root OpenCode project files: `opencode.json`, `AGENTS.md`, and this design document.
- Role agents: `.opencode/agents/*.md`.
- Commands: `.opencode/commands/delegate-*.md`, including the central orchestrator-owned `.opencode/commands/delegate-orchestration.md`.
- Skills and references: `.opencode/skills/delegation-orchestrator/SKILL.md` and `.opencode/skills/delegation-orchestrator/references/*.md`.
- Authoritative delegation protocol: `.opencode/skills/delegation-orchestrator/SKILL.md`; redundant workflow documents are intentionally absent.
- Role contracts and schemas: `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/role-io-contracts.schema.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, `.opencode/schemas/orchestration-input.schema.json`, and `.opencode/schemas/harness-model-routing.schema.json`.
- Harness routing: committed `.opencode/routing/harness-model-routing.example.json`, optional ignored operator override `.opencode/routing/harness-model-routing.json`, shared loader `.opencode/routing/routing-config-loader.mjs`, the pure `.opencode/routing/routing-policy.mjs`, its dependency-free tests, and thin CLI/helper entry points.
- Local deployment examples: `.opencode/deployments/llama-server/`, containing a reusable Compose service, tracked sanitized env templates, and operator guidance. Private `instances/*.env` copies are not harness artifacts.
- Lifecycle plugin adapter and guardrails: `.opencode/plugins/index.js` as the only auto-loaded plugin entry point, with segmented guardrail modules under `.opencode/plugin-modules/`.
- Source validation and inventory: `.opencode/scripts/validate-harness.mts` and `.opencode/harness.manifest.json`.
- Portable distribution: `.opencode/portable.manifest.json`, dependency-free bootstrap and portable validation/E2E scripts under `.opencode/scripts/`, and canonical fresh-memory seeds under `.opencode/bootstrap/memory/`.
- Darwin portable publication: audited `.opencode/bootstrap/native/darwin-portable-fs.c` and its checked-in universal helper are portable-managed runtime assets; the reproducible build and focused native test scripts remain source/release-only.

The source manifest and validator are release-QA mechanisms, not portable dependencies. The source inventory also includes optional/source-only deployment guidance, maintainer meta-skills, root guidance/configuration, static reference memory, and history. None is promoted merely because it is source-owned.

The portable manifest is the closed installation contract. Bootstrap copies only its managed `.opencode` files, seeds only missing minimal `.memory` files, never copies orchestration history, and does not create or merge destination `AGENTS.md`, this design document, `opencode.json`, or root `.gitignore`. Managed-file collisions fail unless overwrite is explicit; destination memory is never overwritten.

### Native Darwin portable bootstrap

Darwin uses a standalone libc-only universal Mach-O helper containing `arm64` and `x86_64` slices with a declared macOS 11.0 deployment target. It has no Node ABI, external npm package, network, shell, or runtime compiler dependency. The adjacent C source and immutable helper bytes are included in `portable-core` so an installed bootstrap can be audited and rerun; `.opencode/scripts/build-darwin-portable-fs.mts` and `.opencode/scripts/darwin-portable-fs.test.mts` are source/release tooling and are deliberately not installed.

Linux retains the pre-existing ordered descriptor-alias candidates `/proc/self/fd` and `/dev/fd`; Darwin dispatch does not alter or narrow that fallback contract.

Release maintainers rebuild with `node .opencode/scripts/build-darwin-portable-fs.mts --update`, review the emitted SHA-256, update the closed manifest/bootstrap/validator hash together, then require `--check` and native tests. The payload is built in stable architecture order with Mach-O UUID generation disabled; each thin slice is explicitly ad-hoc signed without a Team ID before universal assembly, and `codesign --verify --strict --all-architectures` is a build gate. This is not a Developer ID signature. Bootstrap verifies its manifest-declared SHA-256, creates a private mode-0700 copy only beneath root-owned sticky `/private/var/tmp` rather than caller-controlled `TMPDIR`, rehashes it, checks protocol/platform/native-architecture self-test output, and invokes it without a shell or inherited environment. In particular, `DYLD_*` loader variables are not passed to either helper execution. Sticky-parent and private-directory controls prevent substitution by a different unprivileged uid; as with ordinary local process security, an adversary already running as the bootstrap's effective uid or root is outside this activation-path threat model. The manifest hash proves consistency within the bundle, not publisher authenticity. Developer ID signing, notarization, quarantine, downloaded-release testing, and publisher authentication remain release-channel responsibilities; synthetic quarantine has demonstrated that the ad-hoc payload is not Gatekeeper-ready.

The helper implements a bounded little-endian binary protocol and independently rejects malformed frames, unsafe or duplicate relative paths, unsupported flags/version, invalid UTF-8 paths, and target identity mismatch. The 256 MiB frame limit is exclusive: valid frames are at most 256 MiB minus one byte, and both the JS encoder and C reader reject a declared or actual frame of exactly 256 MiB without requiring a full-size boundary allocation. Bootstrap captures one exact BigInt root identity snapshot, verifies that exact snapshot against the canonical path, and passes that same snapshot to the helper; it does not trust an independently sampled protocol identity. The helper traverses components with no-follow `openat`, retains destination-parent descriptors, probes hard-link publication in every parent before operation zero, uses same-parent `linkat` for atomic no-clobber, and uses `renameat` only for explicitly approved managed overwrite. Activation, root-open, parent preparation, or capability failure occurs before managed or memory file publication and attempts to remove helper-created empty directories and exact probe/temp names.

The security claim is intentionally scoped to match Linux: descriptor-relative, symlink-resistant, root/parent identity-bound, and race-detecting, not absolute atomic beneath-root confinement. A concurrent actor can rename an already pinned parent after a reachability check and before publication; mutation follows the directory object and a later check can detect but cannot retract it. From before private activation-directory creation through materialization, self-test, the gap before real execution, active publication, and final activation cleanup, one Node coordinator handles `SIGINT`, `SIGTERM`, and `SIGHUP`. It terminates and reaps whichever child is active, keeps the original signal pending while cleanup completes, removes its handlers exactly once, then restores signal termination semantics. An exit fallback kills a still-running helper where synchronous process-exit handling permits. Once publication starts, ordinary failure can leave a partial install, and abrupt parent `SIGKILL`, helper `SIGKILL`, kernel failure, or power loss can prevent coordination and leave published files, hidden temporary files, empty directories, or the private activation directory. No whole-install rollback or impossible uncatchable-signal cleanup guarantee is claimed.

`opencode.json` must contain only native OpenCode configuration keys. Harness-owned routing settings must not be embedded in `opencode.json`; committed defaults live in `.opencode/routing/harness-model-routing.example.json` and are consumed by the harness resolver.

Project-owned memory lives under `.memory/`:

- Static memory: `.memory/INDEX.md`, `.memory/protocols/memory-management.md`, `.memory/references/opencode-refs.md`, and `.memory/templates/*.md`.
- Generated orchestration memory: `.memory/orchestrations/<orchestration-id>/`.
- Role trace artifacts: `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.

OpenCode does not provide an official native `.memory` protocol in the cited research evidence. This harness treats `.memory` as project-owned memory and exposes the protocol through native `instructions` in `opencode.json`.

## Reference Material and Prior Projection Examples

The directories `.agents/` and `.codex/` are reference material only. They may be used to understand prior role wording, workflow boundaries, and validation expectations, but they must not be treated as OpenCode deliverable paths, command dependencies, manifest artifacts, or runtime requirements.

Do not delete `.agents/` or `.codex/` as part of this projection. They remain available for comparison unless a separate cleanup task explicitly authorizes their removal.

## OpenCode Role Agents

Each role is implemented as a Markdown agent file under `.opencode/agents/` with YAML frontmatter containing:

- `description`: concise trigger guidance.
- `mode: subagent`: the role is a delegated worker, not the primary orchestration surface.
- `permission`: conservative tool permission posture.

Role prompt bodies must preserve boundaries:

- `researcher`: source-backed evidence and citations; no implementation or acceptance decisions.
- `planner`: task sequencing, file contracts, and acceptance gates; no file edits.
- `implementer`: `implementation` for scoped changes or `integration` for assigned stitching; no planning or final validation.
- `validator`: independent `validation`, adversarial `review`, reproducible `artifact-proof`, or `integration-check`; no implementation fixes.

Each role must also follow `.opencode/contracts/role-io-contracts.json`. The catalog defines task modes, required inputs, required outputs, trace artifact path templates, and verification expectations for all four roles. Trace artifacts are shaped by `.opencode/schemas/memory-trace-artifact.schema.json` and indexed from `.memory/orchestrations/<orchestration-id>/INDEX.md`.

## Delegation Protocol

The harness uses delegation-only orchestration. Parent orchestration coordinates, delegates, reviews returned evidence, asks for remediation, and consolidates final results. It does not perform role work directly.

The workflow is:

1. Accept an ordinary-language request, extract explicit intent and constraints, and ask focused follow-ups only for unresolved user decisions.
2. Assemble a normalized internal specification against `.opencode/schemas/orchestration-input.schema.json`: generate mechanical IDs and conservative policy defaults, and derive only the bounded coordination structure supported by the request and workspace instructions.
3. Classify each work unit into one of the four roles and an allowed explicit task mode.
4. Pass complete task context, allowed paths, file contracts, verification gates, `orchestration-id`, memory root, role contract catalog, trace schema, trace artifact requirement, and any caller-supplied routing metadata.
5. Inspect role outputs for required evidence and trace artifact references.
6. When evidence is incomplete, create a fresh remediation role task and child thread linked to the predecessor.
7. Accept only after independent validator evidence covers every acceptance gate.

Delegated prompts that originate from enriched orchestration input must preserve caller-supplied labels exactly:

- `### Delegation Parameters`
- `**Provider Model**`
- `**Routing Config**`
- `routingServiceUrl`
- `localModelEnabled`
- `preferLocal`
- `localModelFallback`

If those labels are absent from the original request, the OpenCode harness does not invent values for them. Command prompts document preservation behavior but do not add synthetic routing metadata.

## Commands, Skills, and Workflows

`/delegate-orchestration` is a thin orchestrator-owned `$ARGUMENTS` wrapper around the sole authoritative protocol in `.opencode/skills/delegation-orchestrator/SKILL.md`. It accepts natural-language intent, gathers unresolved user decisions through focused follow-ups, and validates a parent-assembled internal specification before delegation. When invoked, the parent delegates and synthesizes only. Local-model DAG execution is serial by default; parallelism requires explicit authorization or recorded distinct-capacity evidence.

Role names are fixed, but bounded role instances are repeatable within declared agent budgets. Every instance has an explicit task mode, scoped artifact ID, and trace artifact under `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md`.

Remediation defaults to one cycle per scoped work unit and never exceeds the declared loop budget. Exhaustion stops the unit unless its explicit scope-expansion policy authorizes escalation.

Managed orchestration enforces one separately scoped delegated task per fresh child session/thread. Every new role task has a nonempty `delegationTaskId`, stable `scopeKey`, and `dispatchKind: fresh`; Task calls omit the `task_id` property. The sole reuse is one `clarification-response` to a recorded child-originated request while the exact task remains unresolved. New deliverables, changed scope or role, retries, remediation, corrections, follow-ups, terminal work, replay, and post-restart responses start fresh. `/delegate-orchestration` is the managed surface; direct `@subagent` dispatch is prohibited and the lifecycle guard rejects direct subagent-targeted role commands.

Four direct role commands remain only as fail-closed compatibility entry points. Their frontmatter names the role, but lifecycle policy rejects them and directs operators to the natural-language orchestration surface:

- `/delegate-research` identifies `researcher`.
- `/delegate-plan` identifies `planner`.
- `/delegate-implement` identifies `implementer`.
- `/delegate-validate` identifies `validator`.

Role-specific command frontmatter uses `description` and `agent` only. The central `/delegate-orchestration` command omits `agent` so it belongs to the current parent orchestrator rather than a subagent role. Model selection is omitted from command frontmatter so the harness-owned resolver can decide model routing before dispatch without mixing non-native routing policy into command definitions.

The reusable delegation rules live only in `.opencode/skills/delegation-orchestrator/SKILL.md`. Routing, validation, and trust/restart references are subordinate aids and do not duplicate the protocol. No redundant delegation, implementation, or validation workflow documents are retained.

## Model Routing

Native OpenCode can select models through its own configuration and invocation controls. Harness model routing is a separate policy layer that chooses a model, variant, and role target before native dispatch.

The routing document is a strict v2 contract. It contains named local catalog entries, a catalog default, per-role native or local selectors, fixed command targets, complexity tiers, and explicit `enabled` and `forceLocalForHarnessSubagents` switches. Legacy singular local keys are rejected with migration guidance rather than inferred. A dependency-free pure policy module performs executable normalization and semantic validation; the draft 2020-12 schema is the structural interoperability document.

The committed neutral example is the deterministic default and validation input: local routing is disabled, the catalog is empty, and local selectors/defaults are null. The committed local example is an explicit enabled-local fixture and migration aid; implicit loading never selects it. Operators may optionally create `.opencode/routing/harness-model-routing.json`. Implicit loads select a present custom file and otherwise the neutral example; documents are never merged. A selected custom file that is unreadable, malformed, or semantically invalid fails closed without fallback. Explicit paths read exactly that path. If neither implicit candidate exists, the loader reports both implicit paths and a copy remedy. Plugin project discovery walks ancestors to the first routing pair, then falls back to the module pair.

When local routing is disabled, catalog and selector data is inert and resolution emits no local identity, URL, or budget. A coherent dormant catalog remains valid, while an enabled configuration requires a nonempty coherent catalog. In an enabled advisory configuration, model precedence is explicit request, orchestrator command, command, role local selector, role native override, complexity, enabled single model, then default model. Catalog metadata and local selectors remain resolver-only advisory choices outside force mode and do not mutate native agents. Non-null native role overrides are different: outside force mode the startup config hook applies those selected overrides only after their agent/provider/model relationships pass coherence preflight. The resolver itself makes no network calls and does not prove native enforcement.

Force mode applies only to the exact four fixed harness roles. A role local selector precedes the catalog default, and an explicit request model becomes an exact-match constraint rather than an escape route. At startup, the async config hook computes all four assignments and preflights every existing subagent, native provider prefix, provider model declaration when present, and catalog-backed canonical `baseURL`. Only after the complete plan passes does it set agent models. Any mismatch deliberately rejects startup with no partial agent or provider mutation and no cloud/default fallback.

Actual provider transport remains native OpenCode configuration outside committed project defaults. Approved user/global config or a non-conflicting `OPENCODE_CONFIG` can define native provider options, credentials or environment references, model maps, and `provider/model` identities. `OPENCODE_CONFIG` merges before project config and is not a final override; `OPENCODE_CONFIG_CONTENT` is merged later but must not be used to commit or expose secrets. Harness routing never creates or mutates providers, baseURLs, credentials, or model maps.

Catalog provider ids, model aliases, endpoint URLs, ports, GPU settings, and capacities are illustrative examples, not installed-resource claims. Endpoint `maxInFlight` values are cooperative orchestration budgets grouped by canonical URL, not runtime semaphores or capacity proof. Shared-URL catalog entries require equal budgets.

Config and plugin changes require fully quitting and restarting OpenCode. The force-false example does not configure provider transport or mutate native agents. Local integration validation is offline and explicitly example-based: parse policy/schema/native config, exercise policy/CLI/helper parity, prove force-false advisory behavior and atomic synthetic force behavior, and reject secrets or non-native routing keys in `opencode.json`. Live health, exact model identity, delegated tool use, quality, concurrency, and VRAM benchmarks are separate operator-dependent gates; health alone is insufficient.

## Local llama-server Deployment

`.opencode/deployments/llama-server/compose.yaml` is one static service template run as separately named `llama-research` and `llama-coder` projects with private ignored env files. It requires an approved digest-pinned image, a unique loopback host port, an existing absolute model directory, a model file, and an alias. The model directory is mounted read-only without automatic host-path creation. The service intentionally has no fixed `container_name`, overriding `command`, or secret.

The checked-in env templates align with the illustrative routing identities but require operator replacement of image digest, private paths, aliases where needed, topology, and unmeasured capacities. NVIDIA capability reservation does not prove GPU isolation. Static instance settings change on recreation, and a request model must match the resident alias. Request-time selection requires a separately designed router with cold-load, eviction, timeout, provider-propagation, shared-failure-domain, and endpoint-budget validation.

## Lifecycle Guardrails

`.opencode/plugins/index.js` is the local project plugin entry point. It is the only JavaScript module in the auto-loaded `.opencode/plugins/` directory. It is a pure adapter that imports segmented logic from `.opencode/plugin-modules/` and exports the default plugin function expected by OpenCode local plugin loading.

`.opencode/plugin-modules/harness-lifecycle.js` provides guardrail and telemetry hooks for OpenCode sessions. It warns about dangerous commands, reminds users that delegation evidence is required, and enforces the process-local task-thread policy through the dependency-free `.opencode/plugin-modules/task-thread-policy.js`. The ledger stores immutable task contracts and one-shot clarification authorization only in the running plugin process; it logs sanitized identifiers rather than prompts, answers, output, or paths and denies reuse after restart. Keeping segmented modules outside `.opencode/plugins/` prevents OpenCode from auto-loading them separately from the adapter.

`.opencode/plugin-modules/role-model-routing-enforcement.js` is the startup configuration boundary for the assignment plan described above. It is separate from lifecycle telemetry and is not acceptance evidence. Although its config callback is asynchronous, all selected native relationships are checked before any agent mutation.

Do not list `.opencode/plugins/index.js` or `.opencode/plugin-modules/harness-lifecycle.js` as local paths in `opencode.json`; the documented `plugin` array is for npm packages, while local project plugins live under `.opencode/plugins/`.

Lifecycle hooks are not acceptance proof. Source acceptance uses `node .opencode/scripts/validate-harness.mts`; installed-profile acceptance uses generated compatibility output via `node .opencode/scripts/validate-portable-harness.mjs --root .`. Independent validator evidence remains required.

## Agentic Protocol Hooks

The accepted agentic protocol hook design is a future harness extension for low-noise, deterministic reminders around high-value agent actions. It does not add runtime hook files in this document change. The design keeps hooks as guardrails and telemetry only; independent validator evidence remains the acceptance boundary.

### Architecture and Boundaries

The design uses a host-neutral core for event normalization, file/action classification, registry selection, noise policy, reminder rendering, ledger-entry shaping, and summaries. Future OpenCode delivery belongs in segmented modules under `.opencode/plugin-modules/`, with `.opencode/plugins/index.js` remaining the only auto-loaded local plugin and a thin import/merge adapter.

The core and OpenCode adapter must not store provider tokens, secrets, full prompts, raw file contents, full shell commands, user auth paths, or private absolute paths. Reminder text is static registry text plus sanitized identifiers only, so protocol hooks do not become a prompt-injection or data-exfiltration channel.

### Event Timing and Classification

Pre-tool edit/write hooks are the v1 primary delivery point for actionable reminders before mutation. Optional post-tool behavior is non-blocking and limited to verification notes or summaries; it is never acceptance proof. Read-only tools do not inject reminders by default. Bash or command tools may classify tests, code generation, destructive operations, delegation commands, and validation commands for notices or metrics, but they must not interfere with validation commands.

Chat or system transforms are not a v1 dependency and require later API confirmation before use. Event classification should normalize host, phase, tool/action kind, safe relative path or path bucket, language, file kind, risk tags, session/call ids, and raw shape version without logging full prompts or raw command payloads.

### Hierarchical Protocol Registry

The future registry is closed, deterministic, and secret-free. If implemented as a file, an example location is `.opencode/protocols/agentic-micro-protocols.json`, but that runtime file is not created by this design update. The conceptual hierarchy is:

```text
packs[] -> layers[] -> groups[] -> protocols[]
```

Registry records use explicit configured packs rather than unsorted filesystem discovery:

- `schemaVersion`: registry contract version.
- `packs[]`: ordered protocol packs such as `harness-core` or `playwright`; each pack has `id`, numeric `order`, `enabledByDefault`, and `layers[]`.
- `layers[]`: broad applicability bands such as `global`, `role-or-workflow`, `domain`, `file-kind`, or `phase-or-action`; each layer has `id`, numeric `order`, `scope`, and `groups[]`.
- `groups[]`: related protocol families such as `naming`, `playwright-page-objects`, `playwright-specs`, `playwright-fixtures`, or `validation-commands`; each group has `id`, numeric `order`, `match`, and `protocols[]`.
- `protocols[]`: the smallest rendered reminder candidates; each protocol has `id`, numeric `order`, `title`, `severity`, `timing`, `match`, `message`, `dedupeKeyTemplate`, `maxPerSession`, and `enabledByDefault`.

### Deterministic Selection and Injection Order

Registry loading validates schema before use, fails closed for malformed committed registries, and ignores explicitly disabled packs. Load and evaluation order is deterministic: sort packs by numeric `pack.order` then stable `pack.id`; within each pack sort layers by `layer.order` then `layer.id`; within each layer sort groups by `group.order` then `group.id`; within each group sort protocols by `protocol.order` then stable `protocol.id`.

Each hook normalizes the event, classifies action/file/risk attributes, evaluates `packs[] -> layers[] -> groups[] -> protocols[]` in the loaded stable hierarchy order, filters disabled or nonmatching candidates, applies dedupe and caps in the same order, then renders visible reminders and ledgers evaluated/injected/suppressed decisions in stable order. Candidate precedence is pack order, layer order, group order, protocol order, then stable protocol id tie-breaker. Specificity may be used only as a documented suppression or preference rule inside the same applicable set; it must not create unstable reordering.

Default noise caps are intentionally conservative: `maxVisiblePerToolCall: 1`, `maxVisiblePerSession: 8`, and `maxPerProtocolPerSession: 3`. A future implementation may raise `maxVisiblePerToolCall` to `2` only after fixture-backed precision is proven. Suppressed candidates are ledgered with deterministic reasons such as `tool-limit`, `session-limit`, `protocol-disabled`, `dedupe-window`, `dry-run`, `path-ignore`, `host-unsupported`, or `collapsed-by-more-specific`. Collapse summaries may say, for example, `[harness protocol] 2 additional applicable reminders collapsed; see ledger summary`.

### Playwright Protocol Examples

More than one protocol can apply to the same hook event. General protocols are evaluated first, followed by increasingly specific protocols according to the stable hierarchy: global or file-naming standards before domain or file-kind protocols, and then phase/action-specific protocols.

For a Playwright page object creation event, a general file naming protocol can apply together with page-object locator and method protocols. The naming reminder is evaluated and rendered first because it belongs to a broader earlier layer/group; the page-object locator/method reminder follows if visible caps allow. If only one visible reminder is allowed for that tool call, the deterministic collapse policy may render the more specific page-object reminder while ledgering the generic naming reminder as collapsed with the reason `collapsed-by-more-specific` and a summary notice.

Page object classification includes `**/pages/**/*.ts`, `**/*.page.ts`, `**/*.po.ts`, class names ending in `Page`, or locator/action helper exports. Page-object reminders should prefer stable intent-level methods, private selectors, role/test-id locators, minimal assertions except invariant waits, and updates to affected specs when method contracts change.

Spec classification includes `**/*.spec.ts`, `**/*.test.ts`, `tests/e2e/**`, or imports from `@playwright/test`. Spec reminders should assert user-visible behavior, avoid duplicating page-object selectors, keep setup in fixtures, prefer resilient locators, and run focused Playwright checks for changed flows. Fixture classification includes `**/fixtures/**/*.ts`, `**/*.fixture.ts`, or Playwright `test` extension, with reminders for deterministic isolation, no hidden cross-test state, explicit worker/test scope, and teardown preservation.

### Telemetry, Privacy, and Noise Controls

If implemented, telemetry uses redacted append-only JSONL under project-owned `.memory/` only after a separate validation decision selects the exact path and retention policy. Ledger and metric fields are limited to sanitized identifiers: timestamp, host, session/call ids, phase, tool/action kind, relative path or path hash, file kind, protocol id, severity, decision, suppression reason, dry-run flag, and message id.

Operator controls may include future `OPENCODE_HARNESS_PROTOCOL_DRY_RUN=1` and `OPENCODE_HARNESS_PROTOCOL_HOOKS=0` switches. Dry-run, summary-only, and opt-out modes are guardrails and telemetry controls, not validation evidence.

### OpenCode and Claude Boundary

OpenCode is the implementation target for this harness surface. Claude compatibility, if pursued later, is adapter/spec/export documentation only and must not add committed `.claude` settings or a runtime dependency on `.claude`, `.agents`, or `.codex`. Prior projection directories remain reference material only, never runtime dependencies.

### Future Implementation and Validation Gates

Future runtime implementation must confirm OpenCode hook names and safe mutation/notice semantics; test the pure core before hook wiring; schema-validate any registry; test Playwright classification, deterministic hierarchy ordering, noise caps, collapse behavior, and ledger redaction; confirm `.opencode/plugins/index.js` remains the sole auto-loaded local plugin; and run `node .opencode/scripts/validate-harness.mts`.

### Residual Risks

OpenCode hook API shape and model-visible reminder delivery semantics remain unconfirmed. Classifier false positives or false negatives may create reminder fatigue. Ledger privacy, ignored/committed status, and retention policy remain future decisions. Claude/OpenCode semantic drift remains possible if compatibility exports are later pursued.

## Manifest

`.opencode/harness.manifest.json` is the complete source/release inventory. It includes portable deliverables and source-only roots/optional assets, but excludes private custom routing, generated package state, dependencies, and orchestration history. `.opencode/portable.manifest.json` independently defines the closed installable profile and must not list source-only assets.

The manifest is descriptive baseline evidence. It does not replace file existence checks, schema parsing, or command validation.

## Validation Gates

Required validation includes:

- `opencode.json`, `AGENTS.md`, and `.opencode/harness.manifest.json` exist.
- Static `.memory` protocol, reference, and template files exist.
- Every `.opencode/agents/*.md` role file has YAML frontmatter with `description`, `mode: subagent`, and `permission`.
- Every role references `.memory/protocols/memory-management.md`, `.opencode/contracts/role-io-contracts.json`, `.opencode/schemas/memory-trace-artifact.schema.json`, and the `.memory/orchestrations/<orchestration-id>/roles/<role>/<artifact-id>.md` path convention.
- The four required role files exist exactly.
- Every role-specific `.opencode/commands/*.md` command has frontmatter with `description` and `agent`, and omits `model`.
- `.opencode/commands/delegate-orchestration.md` has frontmatter with `description`, omits `agent`, sets `subtask: false`, and documents recursive DAG orchestration.
- `opencode.json` parses and does not contain harness-owned routing keys.
- `opencode.json` instructions include `AGENTS.md` and `.memory/protocols/memory-management.md`, and it does not list local plugin paths.
- `.opencode/routing/harness-model-routing.example.json` and `.opencode/schemas/harness-model-routing.schema.json` parse; the pure dependency-free normalizer provides executable semantic validation. Validation does not consume the optional ignored custom override.
- `.opencode/contracts/role-io-contracts.json` parses and contains all four roles and their allowed modes.
- `.opencode/schemas/role-io-contracts.schema.json` and `.opencode/schemas/memory-trace-artifact.schema.json` parse.
- Routing policy tests cover strict v2 structure and semantics, deterministic non-mutating decisions, fixed-command conflict rejection, force-false advisory behavior, all-four force assignment, native provider/model/baseURL coherence, and failure without partial or provider mutation.
- CLI and helper outputs match the pure policy without network calls.
- Native local transport remains outside committed project defaults and uses native OpenCode provider/model settings instead of harness metadata in `opencode.json`.
- `.opencode/plugins/index.js` imports segmented modules and exports a default plugin function; segmented plugin logic remains separate and is not auto-loaded independently. Lifecycle behavior is telemetry only.
- Both illustrative Compose instances render from temporary env files with a digest-pinned image, unique loopback ports, exact aliases, read-only non-auto-created binds, and no fixed container name, command, secret, or private committed path.
- Documentation consistently describes restart activation, `OPENCODE_CONFIG` precedence, cooperative endpoint budgets, illustrative identities, static-versus-router behavior, and operator-dependent live/model/tool-use/benchmark proof.
- `.opencode/scripts/validate-harness.mts` passes.
- Source validation proves canonical seed equality, trace contract/schema/template alignment, complete source inventory, explicit neutral/local routing fixture behavior, and an explicit portable-validator pass without reading private custom routing.
- `node .opencode/scripts/validate-portable-harness.mjs --root .` passes using only portable managed files and minimal memory; foreign-repository E2E proves source roots/history are unnecessary.
- References to `.agents` or `.codex` appear only in this design document or `AGENTS.md` as reference-material notes, never as `.opencode` runtime dependencies.
- Routing label preservation text is present in the command, skill, or workflow surfaces.

## Non-Goals

- Do not store provider tokens, OAuth secrets, user auth paths, or machine-local private paths in repo-managed files.
- Do not create or mutate prior host projection files as part of the OpenCode deliverable.
- Do not depend on plugins as the acceptance boundary.
- Do not invent non-native fields in `opencode.json`.
- Do not create first-class OpenCode task-complexity schema; complexity routing is harness-owned policy.
- Do not treat generated `.memory/orchestrations/` trace artifacts as static manifest baseline unless a task explicitly requires that.

## Open Questions

- Which concrete provider/model IDs should be configured for a given installation.
- Whether local model preference is selected by explicit user metadata, orchestrator policy, or future runtime UI.
- Whether release packaging should compute and store content hashes in the manifest as a separate validation step.


## October 2026 local refinement

The tagged OpenCode v2.1.4 source at
`68bc26b7da1990ce10ffecfbc1e09eb13aa5d824` documents `@opencode/plugin`
`Plugin.define(...setup...)`, domain registration, and structured tool results,
not the V1 default-returned hook map and `@opencode-ai/plugin` contract. Its
after-tool hook cannot be relied on to reject a call. This tagged source does
not establish release publication, exact CLI `--version` output, a trusted
installed V2 binary or working native Task interception. The version-neutral
launcher and its V1 `agent list` trace probe are not a V2 compatibility gate;
do not launch V2 for managed delegation on this basis. Before any V2 promotion,
prove a protective pre-spawn discriminator without breaking V1 fallback, pinned
plugin loading/config and Task/session/before-hook semantics, exact child/result
correlation and failure propagation, and installed SDK/lock inventory. Then run
trusted-binary offline fixture tests and independent validation. No provider,
credential or network activation is authorized by this documentation.

The explicit V2-only subscription-auth option binds a current-user owner-only
native OpenCode data home. A stable read-only SQLite backup is made in the
owner-only launch snapshot; an existing trusted Bubblewrap runs an offline
OpenAI-only native auth export against that backup. Exactly one active OAuth
connection is piped into the already-probed guarded server's independently
absent per-launch database. The backup is removed before the requested client;
ordinary database cleanup removes the imported connection after exit. The
operator source remains untouched, and exported credential bytes are neither
logged nor stored in runtime assets or project traces. This opt-in is separate
from credential-free provider/catalog/profile projections and never grants a
managed child access to operator auth files.

The source-only V2 setup fixture (`.opencode/scripts/native-v2-plugin-fixture.mts`
with offline tests) is deliberately a preflight/refusal, not native activation.
Outside managed execution an operator supplies an exact absolute trusted binary
and its SHA-256 plus an already-private mode-0700 scratch parent; no binary or
server is launched, no workspace/state or receipt is created, and the result is
always inconclusive/nonzero. Its fixed, unexecuted disposable-root plugin
source uses V2 `Plugin.define({id,setup})`, registering a `subagent`-selective
`execute.before` sentinel; it is never placed in the production plugin directory.
Stage A still requires proven fresh server/socket isolation and an active-state
observation tied to that server: a native ID/SOURCE row would establish plugin
inventory only, not setup activation or hook firing. With no source-backed safe
active-state route, the fixture refuses before native spawn. Stage B genuine
provider-free subagent refusal, child inventory and no-child effects remain
unknown. This source-only experiment is absent from runtime/portable manifests,
is not a managed gate, and cannot promote V2 dispatch. Production V1 and the
operator external QA runner are unchanged; any native or full QA run requires
separate external authorization and independent evidence.

The implemented refinement retains V1, four roles, and ephemeral operation. `dispatch-controller` validates the normalized workflow and owns atomic serial/capacity, dependency/gate, per-role/total attempt, remediation and deadline enforcement. `managed-dispatch` binds parent/child sessions, typed Task envelopes and results, immutable specs, scoped tool use and tree/artifact acceptance evidence. No persistent store, restart recovery, new roles, V2 adapter or framework is introduced.

The later V2 adapter now gates blocking native `subagent` admission and seals the
same controller evidence after native child correlation. V2 `source-tui` joins
the already-probed server; V2 external/source web modes expose it only through
an owner-password-authenticated loopback proxy opened after the activation
marker. A validated credential-free V1-style provider document is projected to
native V2 `providers` schema inside its per-launch snapshot, then checked against
the active server's provider endpoint and exact model limits before a client
starts. Routing transforms bind selected roles to active native model refs and
catalog URL metadata; absent optional local selections inherit. The pinned
subagent tool cancels both `sessions.interrupt(child.id)` and
`jobs.cancel(child.id)` when interrupted. Stock v2.1.4 exposes only the first
operation to plugins. The source-only custom native patch in
`.opencode/patches/v2.1.4-background-job.patch` adds a subagent-only Job
get/wait/cancel domain and bounded post-notification terminal retention; a
separately built binary must be selected explicitly. The V2 adapter binds
native Job generation and model to the acknowledged child before accepting
terminal structured output or reconciling cancellation. V2 auto mode falls back
to foreground on stock builds; explicit background on a build without Job
capability remains refused. Disposable custom-build native checks separately
observed controller success after a typed background researcher result and
reconciled cancellation of a child waiting on a local asynchronous fetch. These
are transport/role observations; independent validator gates remain required
for goal acceptance. These newer observations
do not retroactively turn the source-only fixture above into acceptance proof.

`acceptance-proof` is a post-diff and evidence guard, not a sandbox. `managed-execution` uses existing trusted bubblewrap for read-only shell verification; unsupported shell paths fail closed. Commands requiring workspace writes are explicitly excluded from this managed surface. Interrupted/uncertain work cannot be replayed. The temporary database lifecycle is unchanged. See the memory protocol for exact inputs, artifact hashes, limits and unsupported cases, and `docs/refinement-evaluation.md` for the distinction between deterministic offline policy tests and unexecuted matched model evaluation.

The source-only `.opencode/scripts/operator-external-qa.mts` is an explicit external
operator convenience, not a managed shell escape, validator gate or launcher
entry point. It requires a canonical Git root, a new receipt outside that tree
under an owner-only parent and trusted preinstalled tools. The fixed QA commands
run without shell interpolation; private scratch and npm cache live beside the
receipt, scripts and network-dependent npm resolution are disabled, and output
is hashed rather than copied into the receipt. The receipt has external-only
provenance, observed exit status and exact HEAD/index/inventory hashes. Any
command failure, missing result or tree drift fails the receipt; it does not
restore mutated user files or certify acceptance. A separately authorized
operator must review and independently verify results on the final tree.
Ignored dependencies and undeclared ignored files are not inventoried, host
inputs are not hermetic and same-UID races are outside this receipt boundary.
V2 release bytes, provenance and native pre-spawn refusal remain separate gates.

### OpenCode version policy refinement

The external launcher no longer enforces minimum/maximum OpenCode versions.
Reported versions identify caches and diagnostics only. Required native hooks,
Task/session capabilities and provider configuration are checked when exercised;
future versions are not presumed compatible. Existing trace seeds are preserved
across upgrades and rollback; updated bootstrap templates require deliberate review.
