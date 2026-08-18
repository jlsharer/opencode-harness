# Four-Role Consolidation Plan

```json
{
  "orchestrationId": "2026-08-18-core-role-consolidation",
  "role": "planner",
  "artifactId": "planner-001-four-role-plan",
  "createdAt": "2026-08-18",
  "contract": ".opencode/contracts/role-io-contracts.json#roles.planner",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Approved four-role consolidation objective, required role-mode decisions, protocol and orchestration-input schema requirements, workflow consolidation direction, compatibility boundary, acceptance requirements, researcher evidence, exact workspace, orchestration ID, artifact ID, and absent routing status.",
    "requiredContextPresent": "Goal, boundaries, research evidence, deliverable classes, constraints, and acceptance criteria were supplied. delegationTaskId, scopeKey, and dispatchKind required by the current planner contract were not supplied and were not invented.",
    "routingMetadataStatus": "absent",
    "workspaceRoot": "/home/joshl/projects/opencode-harness",
    "traceRoot": "/home/joshl/projects/opencode-harness/.memory"
  },
  "workPerformed": {
    "summary": "Inspected current contracts, trace schema, researcher trace, agents, commands, skills/references, workflows, memory protocol/seeds/templates, manifests, routing policy/schema/config/tests, task and trace-permission plugins/tests, validators/runtime tests, launcher/package/docs, and worktree status. Produced a plan only.",
    "filesRead": [
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/researcher/researcher-001-role-overlap.md",
      ".opencode/agents/*.md",
      ".opencode/commands/*.md",
      ".opencode/skills/**",
      ".opencode/workflows/*.md",
      ".memory/protocols/memory-management.md",
      ".opencode/bootstrap/memory/**",
      ".opencode/{harness,portable,runtime}.manifest.json",
      ".opencode/routing/**",
      ".opencode/plugin-modules/**",
      ".opencode/scripts/*.mjs",
      "AGENTS.md",
      "README.md",
      "opencode-harness.design.md",
      "package.json",
      "bin/opencode-harness.mjs"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/planner/planner-001-four-role-plan.md"
    ],
    "commands": [
      "git status --short",
      "git diff --stat and implementation-excluding git diff inspection"
    ]
  },
  "outputContract": {
    "outputs": "Ordered plan: (1) add a strict orchestration-input schema and reduce active role/trace/routing contracts to researcher, planner, implementer, validator with taskMode; update canonical/bootstrap memory protocol and templates; (2) update four leaf agents with task deny, delegation-orchestrator skill deny, packet-only context, and modes researcher:research, planner:plan|synthesis, implementer:implementation|integration, validator:validation|review|artifact-proof|integration-check; (3) make delegation-orchestrator the sole full protocol and /delegate-orchestration a required-$ARGUMENTS wrapper; retain only four fail-closed core role-command stubs; delete duplicate implement-feature and all workflow docs; update meta-skills/references/docs; (4) reduce routing, task policy, trace permissions, launcher and focused tests to four roles without provider changes; (5) run a final implementer integration task for deletions, manifests, release bump, count/test reconciliation and bounded consistency fixes; (6) run exactly one independent final validator pass, then let the parent synthesize.",
    "evidence": "Research maps reviewer and artifact proof to validator modes, editing integration to implementer and independent integration checks to validator, and conflict analysis to planner synthesis. Repository inspection confirms eight-role closed sets across active agents, contracts, routing, plugins, launcher/manifests/validators; duplicate orchestration workflows; exact inventory counts; and an ignored private routing override that must not be edited.",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/researcher/researcher-001-role-overlap.md",
      ".memory/orchestrations/2026-08-18-core-role-consolidation/roles/planner/planner-001-four-role-plan.md"
    ],
    "orderedPlan": [
      "Protocol/schema",
      "Four core leaf agents",
      "Single skill authority and redundant-surface deletion",
      "Routing/plugin/launcher cardinality",
      "Final implementer integration",
      "One final validator pass"
    ],
    "fileContracts": "Delete agents artifact-verifier/integrator/reviewer/synthesizer; commands delegate-artifact-verify/delegate-integrate/implement-feature; workflows delegation/implement-feature/validation. Add .opencode/schemas/orchestration-input.schema.json. Update four agents; delegate-orchestration and four fail-closed core role commands; delegation skill and four references; two meta-skills; AGENTS/README/design/deployment guide; role/routing/trace schemas and contract; routing fixtures/policy/tests; task/lifecycle/trace-permission plugins/tests; canonical/bootstrap memory protocol/index template/index prose; launcher; source/portable/runtime manifests; package; source/portable/runtime validators and tests.",
    "dependencies": "Protocol/schema precedes agents, authority docs, and routing guards. Those work units execute serially by default for local models. Final implementer integration depends on all edits; the sole validator depends on integration self-check success.",
    "verificationGates": [
      "node --check bin/opencode-harness.mjs",
      "node --test .opencode/plugin-modules/task-thread-policy.test.mjs",
      "node --test .opencode/plugin-modules/trace-root-permissions.test.mjs",
      "node .opencode/routing/routing-policy.test.mjs",
      "node .opencode/scripts/portable-harness.test.mjs",
      "node --test .opencode/scripts/runtime-harness.test.mjs",
      "node --test .opencode/scripts/runtime-foreign-repo.test.mjs",
      "node .opencode/scripts/validate-portable-harness.mjs --root .",
      "node .opencode/scripts/validate-harness.mjs",
      "npm pack --dry-run --json",
      "git diff --check",
      "git status --short"
    ],
    "handoffNotes": "Use fresh implementer packets with explicit taskMode and allowed paths. Default serial local dispatch and one remediation cycle per scoped work unit. Final integration must preserve the pre-existing executable-bit-only bootstrap-portable-harness.mjs change unless separately authorized. Final validator findings block only when tied to goal, acceptance, or changed behavior with command-backed evidence; traces alone never block."
  },
  "handoff": {
    "nextRole": "implementer",
    "limitations": "No implementation files were edited and no final validation was run. Expected counts, to recompute from the resulting tree: source manifest 70, portable managed files 43, runtime files 36, package selectors 27, npm payload paths 40.",
    "risks": "Use package version 0.1.9 so changed runtime bytes do not reuse 0.1.8 cache identity. The ignored eight-role routing override will intentionally fail closed until its operator migrates/removes it; do not edit it. Preserve historical trace bytes, but narrow active schemas/dispatch to four roles. Unrelated untracked orchestrations and a pre-existing mode-only change are outside implementation ownership."
  }
}
```
