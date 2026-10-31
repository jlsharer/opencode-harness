# Global profile component disposition

This ledger reconciles the source manifest, external-runtime manifest, portable manifest and global manifest. Package acceptance is the exact union of legacy runtime files, global source assets and the two CLI/validator entry points, checked by source validation and an extracted-tarball fixture. Private routing overrides and source history are never global dependencies. The package retains legacy modules for legacy profiles; import-closure validation prevents the global entry from loading their execution guards.

| Capability | Global destination/equivalent | Boundary |
| --- | --- | --- |
| Four roles, five commands, four complete skill trees and four delegation references | Manifest-owned native discovery; profile-specific delegation authority uses the original skill name | Legacy conservative role/command assets preserved |
| Input/output contracts, modes, DAG, budgets, fresh children, remediation and independent acceptance | global-protocol + global-native-plugin + pure contracts/controller | Task-local; no general tool restrictions |
| Foreground clarification | Exact child-originated nonce response, max eight turns, declared agent budget | Terminal/replayed/changed work uses fresh tasks |
| Background Job transport/context updates | Existing legacy adapter only | Global background is explicitly unavailable; running text never accepted |
| Cancellation | Task-local invalidation with termination uncertainty | Native termination remains under host policy |
| Non-Git and nested cwd | Native session.get location plus declared-file evidence | No implicit Git-root replacement or workspace scan |
| Context budgets/telemetry/refinement/compaction | Global utility exports, four skills, schemas, handoff/refinement templates | Explicit context resources; no broad restored stop hooks or authorization resurrection |
| Routing and optional endpoint inputs | Neutral examples and strict advisory utility loader/policy | No native provider transport/credential mutation |
| HTTPS download and inert archive install | Standalone exact-approved helper exports, full original bounded/hash/extraction checks | Explicit host-policy operation, no recovery-shell prerequisite |
| Offline build/cases and intentional Win64 relaunch | Existing standalone Win64 plan/build/verify/relaunch exports | Explicit native-policy equivalent; no automatic Windows process |
| Memory protocols/templates/seeds/reference | Complete immutable global assets; external keyed traces | Project memory remains opt-in |
| Legacy broad guards/activation/stopped-run shell | Legacy source/portable/external modules retained | Deliberately excluded from global import closure |
| Prepare/install/doctor/rollback/uninstall | Dedicated CLI and content-hashed releases, owned projection and activation journal | Dry-run default; exact ownership conflicts fail |
| Project migration | Explicit exact-byte legacy entry disable/restore | Other project plugin/config/skill/memory bytes untouched |
| Source QA, deployment examples, history, .agents/.codex, design and steam source | Source-only | No new global runtime dependency |
| Real T3Code/native/provider activation | Pending separate authorized target-host verification | Offline mocks/package tests do not establish it |

| Source/global asset | Legacy runtime | Portable | Disposition | Destination |
| --- | --- | --- | --- | --- |
| `.memory/INDEX.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.memory/protocols/memory-management.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.memory/references/opencode-refs.md` | — | — | Global resource/module | `.memory/references/opencode-refs.md` |
| `.memory/templates/compaction-handoff.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.memory/templates/interactive-refinement-test-plan.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.memory/templates/orchestration-index.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.memory/templates/role-trace-artifact.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/agents/implementer.md` | yes | yes | Global discovery projection | `agents/implementer.md` |
| `.opencode/agents/planner.md` | yes | yes | Global discovery projection | `agents/planner.md` |
| `.opencode/agents/researcher.md` | yes | yes | Global discovery projection | `agents/researcher.md` |
| `.opencode/agents/validator.md` | yes | yes | Global discovery projection | `agents/validator.md` |
| `.opencode/bootstrap/memory/INDEX.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/INDEX.md` |
| `.opencode/bootstrap/memory/protocols/memory-management.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/protocols/memory-management.md` |
| `.opencode/bootstrap/memory/templates/compaction-handoff.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/templates/compaction-handoff.md` |
| `.opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/templates/interactive-refinement-test-plan.md` |
| `.opencode/bootstrap/memory/templates/orchestration-index.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/templates/orchestration-index.md` |
| `.opencode/bootstrap/memory/templates/role-trace-artifact.md` | yes | yes | Global resource/module | `.opencode/bootstrap/memory/templates/role-trace-artifact.md` |
| `.opencode/bootstrap/native/darwin-portable-fs.c` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/bootstrap/native/darwin-portable-fs.universal` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/commands/delegate-implement.md` | yes | yes | Global discovery projection | `commands/delegate-implement.md` |
| `.opencode/commands/delegate-orchestration.md` | yes | yes | Global discovery projection | `commands/delegate-orchestration.md` |
| `.opencode/commands/delegate-plan.md` | yes | yes | Global discovery projection | `commands/delegate-plan.md` |
| `.opencode/commands/delegate-research.md` | yes | yes | Global discovery projection | `commands/delegate-research.md` |
| `.opencode/commands/delegate-validate.md` | yes | yes | Global discovery projection | `commands/delegate-validate.md` |
| `.opencode/contracts/role-io-contracts.json` | yes | yes | Global resource/module | `.opencode/contracts/role-io-contracts.json` |
| `.opencode/deployments/llama-server/README.md` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/deployments/llama-server/compose.yaml` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/deployments/llama-server/instances/coder.env.example` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/deployments/llama-server/instances/research.env.example` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/evaluation/offline-benchmark.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/evaluation/paired-tasks.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/global.manifest.json` | — | — | Global resource/module | `.opencode/global.manifest.json` |
| `.opencode/global/native-contract.json` | — | — | Global resource/module | `.opencode/global/native-contract.json` |
| `.opencode/global/skills/delegation-orchestrator/SKILL.md` | — | — | Global discovery projection | `skills/delegation-orchestrator/SKILL.md` |
| `.opencode/harness.manifest.json` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/patches/v2.1.4-background-job.patch` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/acceptance-proof.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/acceptance-proof.test.mjs` | — | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/compaction-handoff.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/compaction-handoff.js` |
| `.opencode/plugin-modules/compaction-handoff.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/context-budget.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/context-budget.js` |
| `.opencode/plugin-modules/context-budget.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/dispatch-controller.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/dispatch-controller.js` |
| `.opencode/plugin-modules/dispatch-controller.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/external-win64-relaunch.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/external-win64-relaunch.js` |
| `.opencode/plugin-modules/external-win64-relaunch.test.mjs` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/global-native-plugin.js` | — | — | Global resource/module | `.opencode/plugin-modules/global-native-plugin.js` |
| `.opencode/plugin-modules/global-protocol.js` | — | — | Global resource/module | `.opencode/plugin-modules/global-protocol.js` |
| `.opencode/plugin-modules/global-utilities.js` | — | — | Global resource/module | `.opencode/plugin-modules/global-utilities.js` |
| `.opencode/plugin-modules/harness-lifecycle.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/managed-dispatch.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/managed-dispatch.test.mjs` | — | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/managed-execution.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/managed-execution.test.mjs` | — | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/operator-approved-archive-install.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/operator-approved-archive-install.js` |
| `.opencode/plugin-modules/operator-approved-artifact-install.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/operator-approved-artifact-install.js` |
| `.opencode/plugin-modules/role-model-routing-enforcement.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/task-contracts.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/task-contracts.js` |
| `.opencode/plugin-modules/task-contracts.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/task-thread-policy.js` | yes | yes | Global resource/module | `.opencode/plugin-modules/task-thread-policy.js` |
| `.opencode/plugin-modules/task-thread-policy.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/trace-root-permissions.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/trace-root-permissions.test.mjs` | — | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/v2-dispatch-bridge.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugin-modules/v2-dispatch-bridge.test.mjs` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/plugin-modules/v2-native-plugin.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/plugins/index.js` | yes | yes | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/portable.manifest.json` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/routing/harness-model-routing.example.json` | yes | yes | Global resource/module | `.opencode/routing/harness-model-routing.example.json` |
| `.opencode/routing/harness-model-routing.local.example.json` | yes | yes | Global resource/module | `.opencode/routing/harness-model-routing.local.example.json` |
| `.opencode/routing/model-routing-helper.mjs` | yes | yes | Global resource/module | `.opencode/routing/model-routing-helper.mjs` |
| `.opencode/routing/resolve-model-routing.mjs` | yes | yes | Global resource/module | `.opencode/routing/resolve-model-routing.mjs` |
| `.opencode/routing/routing-config-loader.mjs` | yes | yes | Global resource/module | `.opencode/routing/routing-config-loader.mjs` |
| `.opencode/routing/routing-policy.mjs` | yes | yes | Global resource/module | `.opencode/routing/routing-policy.mjs` |
| `.opencode/routing/routing-policy.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/runtime.manifest.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/schemas/global.manifest.schema.json` | — | — | Global resource/module | `.opencode/schemas/global.manifest.schema.json` |
| `.opencode/schemas/harness-endpoint-catalog.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/harness-endpoint-catalog.schema.json` |
| `.opencode/schemas/harness-model-routing.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/harness-model-routing.schema.json` |
| `.opencode/schemas/harness-routing-profile.schema.json` | yes | — | Global resource/module | `.opencode/schemas/harness-routing-profile.schema.json` |
| `.opencode/schemas/interactive-refinement-test-plan.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/interactive-refinement-test-plan.schema.json` |
| `.opencode/schemas/memory-trace-artifact.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/memory-trace-artifact.schema.json` |
| `.opencode/schemas/opencode-provider-projection.schema.json` | yes | — | Global resource/module | `.opencode/schemas/opencode-provider-projection.schema.json` |
| `.opencode/schemas/orchestration-input.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/orchestration-input.schema.json` |
| `.opencode/schemas/role-io-contracts.schema.json` | yes | yes | Global resource/module | `.opencode/schemas/role-io-contracts.schema.json` |
| `.opencode/scripts/bootstrap-portable-harness.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/build-darwin-portable-fs.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/build-typescript.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/check-typescript-policy.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/darwin-portable-fs.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/evaluate-controller.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/generated-typescript-artifacts.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/global-harness.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/native-v2-plugin-fixture.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/native-v2-plugin-fixture.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-approved-archive-install.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-approved-archive-install.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-approved-artifact-install.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-approved-artifact-install.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-external-qa.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/operator-external-qa.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/paired-benchmark.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/portable-harness.test.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/prepare-paired-benchmark.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/runtime-foreign-repo.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/runtime-harness.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/t3code-provider-contract.test.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/validate-global-harness.mjs` | — | — | Packaged standalone global validator | `.opencode/scripts/validate-global-harness.mjs` |
| `.opencode/scripts/validate-global-harness.mts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/validate-harness.mts` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/scripts/validate-portable-harness.mjs` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/skills/delegation-orchestrator/SKILL.md` | yes | yes | Profile-specific equivalent at .opencode/global/skills/delegation-orchestrator/SKILL.md | `skills/delegation-orchestrator/SKILL.md` |
| `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md` | — | — | Global discovery projection | `skills/delegation-orchestrator/references/llama-cpp-integration-guide.md` |
| `.opencode/skills/delegation-orchestrator/references/role-routing-matrix.md` | yes | yes | Global discovery projection | `skills/delegation-orchestrator/references/role-routing-matrix.md` |
| `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md` | yes | yes | Global discovery projection | `skills/delegation-orchestrator/references/trust-and-restart-guide.md` |
| `.opencode/skills/delegation-orchestrator/references/validation-checklist.md` | yes | yes | Global discovery projection | `skills/delegation-orchestrator/references/validation-checklist.md` |
| `.opencode/skills/interactive-refinement/SKILL.md` | yes | — | Global discovery projection | `skills/interactive-refinement/SKILL.md` |
| `.opencode/skills/opencode-skill-authoring/SKILL.md` | — | — | Global discovery projection | `skills/opencode-skill-authoring/SKILL.md` |
| `.opencode/skills/opencode-workflow-guidance/SKILL.md` | — | — | Global discovery projection | `skills/opencode-workflow-guidance/SKILL.md` |
| `.opencode/src/package.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/acceptance-proof.test.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/acceptance-proof.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/compaction-handoff.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/compaction-handoff.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/context-budget.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/context-budget.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/dispatch-controller.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/dispatch-controller.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/external-win64-relaunch.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/external-win64-relaunch.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/global-native-plugin.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/global-protocol.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/global-utilities.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/harness-lifecycle.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/managed-dispatch.test.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/managed-dispatch.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/managed-execution.test.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/managed-execution.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/role-model-routing-enforcement.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/task-contracts.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/task-contracts.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/task-thread-policy.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/task-thread-policy.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/trace-root-permissions.test.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/trace-root-permissions.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugin-modules/v2-dispatch-bridge.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/v2-dispatch-bridge.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/plugin-modules/v2-native-plugin.ts` | — | — | Legacy-only lifecycle/guard or Git proof; excluded from global closure | `Legacy source/portable/external profile` |
| `.opencode/src/plugins/index.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/routing/model-routing-helper.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/routing/resolve-model-routing.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/routing/routing-config-loader.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/routing/routing-policy.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/routing/routing-policy.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/scripts/bootstrap-portable-harness.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/scripts/portable-harness.test.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/scripts/validate-global-harness.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `.opencode/src/scripts/validate-portable-harness.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `AGENTS.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `README.md` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `bin/global-harness.mjs` | — | — | Packaged global lifecycle CLI | `bin/global-harness.mjs` |
| `bin/global-harness.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `bin/opencode-harness.mjs` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `bin/opencode-harness.ts` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `docs/refinement-evaluation.md` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `eslint.config.mjs` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `opencode-harness.design.md` | — | yes | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `opencode.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `package-lock.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |
| `package.json` | — | — | Global resource/module | `package.json` |
| `tsconfig.json` | — | — | Source-only; global runtime does not depend on it | `Source QA/documentation/history` |

The generic `runGlobalBuild` utility retains the exact command/cwd/script-policy/time/output request and exact confirmation before a bounded native shell invocation, with no stopped-run prerequisite. It sets npm offline input intent and reports `networkIsolation: native-policy`; it does not promise a network sandbox. The operator must select an offline command/input set and native permissions. It returns exit/signal/error/output and `accepted: false`; fake-executor fixtures cover success, failure and denied confirmation. This is the explicit native-policy equivalent of legacy isolated recovery build, whose Bubblewrap isolation remains legacy-only.
