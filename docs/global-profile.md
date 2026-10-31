# Global native OpenCode profile for T3Code on WSL2

The `global-native` profile keeps native OpenCode responsible for tools, sessions, authentication and permissions. Its separate Promise plugin admits managed orchestration and validates role inputs, native child identity and structured outputs. A managed rejection affects that invocation and its acceptance state. It does not rewrite shell commands, impose tool allowlists, require Bubblewrap, install stop markers or transform native permissions.

The version-1 protocol is implemented and covered by offline fixtures against source shapes pinned to OpenCode commit `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824`. This is compatibility evidence, not proof that an arbitrary native binary implements that commit. Exact source URLs and hashes are in `.opencode/global/native-contract.json`. Real T3Code/native activation has not been performed.

## Lifecycle

Use Node 24 on Linux. T3Code's Windows WSL environment must select the distro containing the native Linux `opencode` executable and this installation. Configure T3Code's native OpenCode provider to use that executable, rather than `opencode-harness run`. No wrapper replaces the operator's command. Project/native permissions remain authoritative.

Every operation defaults to read-only planning. Review its JSON paths and changes before adding `--apply`:

```sh
node bin/opencode-harness.mjs global prepare
node bin/opencode-harness.mjs global install
node bin/opencode-harness.mjs global install --apply
node bin/opencode-harness.mjs global doctor
node bin/opencode-harness.mjs global rollback --apply
node bin/opencode-harness.mjs global uninstall --apply
```

`prepare --apply` stages a complete content-addressed versioned release without enabling discovery. Install copies owned agents/commands/skills and one tiny `plugins/opencode-harness-global.js` entry into the native config discovery tree. It uses no symlinks or OPENCODE_CONFIG_DIR override. Native JSON/JSONC configuration, provider/auth/session databases and project files are untouched by these five operations. Release hashes are verified before reuse. Modified owned discovery files and unowned path collisions fail without overwrite. Prior release records allow rollback. Uninstall removes owned discovery leaves and the active installation record, retaining releases, traces and unrelated files.

The default discovery root is `$XDG_CONFIG_HOME/opencode` (fallback `~/.config/opencode`). Harness release/record state is `$XDG_STATE_HOME/opencode-harness/global` (fallback `~/.local/state/opencode-harness/global`). `--config-root ABS --state-root ABS` select explicit fixture/operator roots. Dry runs create no directories. Interrupted activation retains `activation.json`; a dry run reports it, and an explicit `--apply` first restores its exact prior owned bytes. If a user edited either side after interruption, recovery retains the journal and fails for review.

Fully quit/restart the native provider/server after discovery changes, then refresh/reconnect T3Code's catalog. Doctor distinguishes installed assets from unverified native managed capability. It does not activate providers, inspect credentials or claim live health. The selected T3Code build, distro, Linux executable path/version/hash, effective permissions, catalog refresh, reconnect and actual managed workflow still need separately authorized host acceptance. Nested and non-Git cwd behavior is covered by the adapter's explicit session location/evidence strategy; T3Code's UI selection of such directories remains a host check.

## Project precedence and migration

Consumer projects should use the global harness for shared roles, commands, plugins, contracts, schemas, templates and generic skills. Keep only domain-specific guidance locally, under distinct skill names that supplement the global protocol. Archive redundant discovery assets with rollback records, preserve project history and native preferences, and update active instruction/launch paths when retiring a portable installation. Generic fixes belong in this repository and its global release rather than copied project prompts. Separate host-specific tooling, such as Codex configuration, requires its own migration scope.

A source/portable legacy plugin and the global plugin must not enforce the same managed session. The adapter checks recognized project harness entries at the actual session cwd and ancestors. OpenCode owns plugin ID uniqueness within each native location; the harness does not count plugin instances across the process. Multiple locations and overlapping reload generations must not block each other's admission. Teardown invalidates only that adapter's managed actions and late results, leaving other locations and ordinary tools usable. A legacy project plugin can itself retain legacy restrictions until explicitly migrated; the global adapter cannot undo a separately loaded plugin's behavior.

Doctor reports the selected workspace's direct project entry provenance. For an exact packaged legacy harness entry, review and apply the explicit reversible selector:

```sh
node bin/opencode-harness.mjs global migrate-project --workspace /absolute/project
node bin/opencode-harness.mjs global migrate-project --workspace /absolute/project --apply
node bin/opencode-harness.mjs global restore-project --workspace /absolute/project --apply
```

Migration changes only the exact matching `.opencode/plugins/index.js` to an inert legacy-disabled entry, storing its exact prior bytes in harness state. It refuses differing project entries. Restore requires the exact unchanged disabled entry. Other project plugins, config, skills and memory are preserved. Restart the provider after either operation. Manually review project-defined role/command/skill overrides; discovery precedence can intentionally replace global prompts, and prompt text never establishes managed authority.

## Managed use and evidence

Load the installed `delegation-orchestrator` skill only for explicitly requested managed work. Natural-language intake stays in the primary conversation; the parent assembles a normalized specification, then supplies a version-1 JSON `orchestration.admit` action to the model-callable `harness_orchestration` tool. Its result returns actual workspaceRoot, immutable runtimeRoot and external traceRoot. The parent dispatches role envelopes through the native `subagent` tool and uses `harness_orchestration` for acceptance and cancellation. These operations share the exact validators and native parent identity used by the command executors; the tool grants no bypass. It is registered as a direct tool (`codemode: false`), so it does not depend on a Code Mode namespace.

Slash commands are user-facing entry points, not model-callable tools. `/delegate-orchestration` still accepts complete JSON from users, and the four role commands accept complete exact native task envelopes through the same admission as `subagent`. Typing natural language after a slash command does not itself admit an orchestration. If the parent reports that `harness_orchestration` is missing, reinstall the updated global release, fully restart the native OpenCode provider/service, refresh T3Code provider status and start a fresh thread. Merely refreshing the command catalog does not add the tool to an already loaded plugin instance. Start the smoke test with a normal message asking the parent to load the global skill and check that `harness_orchestration` and `subagent` are in its actual tool catalog before admission. No prompt or shell-imported adapter substitutes for the live tool.

Exactly four roles and five commands remain. V2 role frontmatter uses plural `permissions` and denies only subagent delegation and the orchestrator skill. Native host permissions decide ordinary tools. Legacy singular `permission` role files are preserved for their legacy profiles.

Installation derives packet and success-output field types from the task validator and includes them in the parent skill and each role prompt. The installed guidance also explains reference-item shapes and command/exit-code pairing. Contract rejections identify the offending item and allowed keys; they do not silently coerce malformed results into accepted evidence.

Native session agent metadata is optional: a primary session can use the selected default without storing an explicit agent. Dispatch uses the native tool hook's effective caller and checks a session agent only when it is explicitly present. A missing caller, an explicit mismatch, a managed leaf caller or a non-primary parent still rejects managed dispatch. Direct role commands resolve an unset caller from the native agent list's selected default rather than guessing `build`. Task-admission traces record both the effective caller and optional session agent. Child identity and role checks remain mandatory.

The protocol preserves semantic workflow/DAG checks, declared budgets and remediation limits, fresh task and child identities, role/mode/output contracts, independent command-backed validator gates and task-local cancellation. Foreground output must match native output/content/metadata, fetched child ID/parent/agent and result correlation. After-hook errors replace all success surfaces without throwing. Failed invocation reservations become terminal and a permitted retry uses a fresh ID. A child-originated clarification grants a bounded exact-child nonce response, with at most eight answers per task; replay and terminal reuse fail. Answers retain the existing child reservation and do not consume another leaf-agent slot. Fresh tasks and retries still consume the declared total and per-role budgets. Admitted native subagent packets need no separate legacy command-route token, and absent routing metadata is valid. Background dispatch, Job transport and background context updates remain legacy-only until their exact global completion/cancellation proof is implemented.

Native tool execution normalizes a string into a one-element text-content array before the return hook. The adapter accepts that exact normalized form and the raw string returned by direct command executors; each must exactly match the subagent wrapper and structured output. It rejects extra content blocks, file/rich content, extra block fields and differing text. Rejection output names `parentSessionID` explicitly; `verifiedChildSessionID` appears only after native child/parent/role correlation succeeds. A `task.rejected` trace records the reason and any verified child identity without retaining raw rejected payloads. A verified child identity does not accept its result, release a dependency gate or authorize resuming a failed task.

Acceptance uses an explicit declared-file strategy in both Git and non-Git directories. `evidenceFiles` lists individual reviewed files within allowedPaths/validationInputs, including anticipated missing files. Hashes are streamed without symlinks; missing records are explicit. The validator supplies exact declared gate commands, exitCode 0 and the canonical record-array SHA-256 from the exported `declaredFileEvidence` helper. Acceptance rehashes the same list. Global gates admit bounded nonempty exact commands, including `npm test`, builds and source validators, under native host permissions; the legacy read-only command blacklist applies only to legacy profiles. This does not grant command permissions or prove execution. This proves declared file state and reported independent command evidence; it does not discover undeclared writes or independently execute commands. Scope is evidence, not an execution sandbox. Additional Git evidence remains available under native policy.

State is ephemeral and keyed by native parent session/orchestration/task; no trace or compaction reload restores authorization. Traces default outside the project, keyed by session and orchestration under the harness XDG state tree. Project memory export is explicit. Cancellation records native termination uncertainty and rejects late results; it never claims that a running native worker has stopped or blocks ordinary tools.

## Retained assets and utilities

`.opencode/global.manifest.json` names every release and discovery asset. It includes all four skill trees and four delegation references, schemas/contracts, routing examples/helpers, memory protocol/templates/seeds/reference, pure protocol/adapter modules, context/handoff helpers and explicit utilities. Global delegation guidance is a separate profile projection at the same skill discovery name; there is no fifth skill. Source/portable/runtime profiles and their tests remain intact. The full disposition ledger is [global-profile-disposition.md](global-profile-disposition.md).

Import `global-utilities.js` from the immutable release to explicitly use exact-approved HTTPS acquisition, inert bounded archive installation, offline Win64 build/case verification and verified intentional relaunch. These are the existing standalone helpers with their exact input/confirmation, hash, safe extraction, cleanup and destination checks. They have no stopped-run prerequisite and do not intercept arbitrary tools. Their existing offline/fake-executor tests remain part of `test:harness`. They remain native-policy actions, never managed acceptance gates. No download, Windows process, real build or provider is activated by the global test suite.

Routing helpers preserve neutral defaults, explicit local opt-in, malformed-present override rejection, strict model limits and all-or-none external endpoint inputs. Call them with explicit operator paths when selecting advisory routing. The adapter does not mutate native provider transport or silently apply a route. Refinement resources, bounded reference expansion, reported usage telemetry and explicit compaction handoff helpers remain available as immutable assets/utilities; the global adapter does not restore a broad context or stop hook.

## Verification

```sh
npm run build
npm run validate:global
npm run test:global
npm test
npm pack --dry-run --json
```

Global tests create private temporary roots, build/extract an actual npm tarball, execute the packaged validator and lifecycle CLI in an empty non-Git directory, and import adapter/utility closure without checkout/dependency installation. Contract fixtures test pinned native shapes and inner-call admission behavior; they are not live native Code Mode/provider execution. Legacy runtime tests use fake OpenCode binaries only. No global installation, credentials, provider activation, auth mutation, publication or real T3Code session is part of this verification.

The generic `runGlobalBuild` utility retains the exact command/cwd/script-policy/time/output request and exact confirmation before a bounded native shell invocation, with no stopped-run prerequisite. It sets npm offline input intent and reports `networkIsolation: native-policy`; it does not promise a network sandbox. The operator must select an offline command/input set and native permissions. It returns exit/signal/error/output and `accepted: false`; fake-executor fixtures cover success, failure and denied confirmation. This is the explicit native-policy equivalent of legacy isolated recovery build, whose Bubblewrap isolation remains legacy-only.
