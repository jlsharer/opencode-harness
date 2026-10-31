---
name: delegation-orchestrator
description: Coordinates the four-role global OpenCode harness when the user explicitly requests managed delegation or delegate-orchestration; validates task packets and independent evidence while native host policy controls ordinary tools.
---

# Global native delegation protocol, version 1

This file is the global profile's protocol authority. Apply it only to explicitly requested managed orchestration. The parent extracts intent, assembles and validates a specification, dispatches bounded tasks, reviews role evidence and synthesizes. The parent does not replace leaf research, planning, implementation or independent validation. Leaves cannot delegate or load this skill. Native host permissions govern shell, read, edit, patch and web throughout; a rejected managed action never requires releasing a broad guard.

## Intake and admission

Natural-language intake happens in the primary conversation with this skill. Resolve goal, deliverables, non-goals, scope, acceptance and authorization before admission. Then invoke the **model-callable `harness_orchestration` tool** with one JSON object:

`{"version":1,"action":"orchestration.admit","spec":NORMALIZED_SPEC,"evidenceFiles":["relative/file"]}`

Slash commands are user-facing entry points, not model tools. Do not ask the user to relay admission JSON or try to invoke a slash-command executor through an unavailable tool. `/delegate-orchestration` remains an alternative for users submitting complete JSON. If `harness_orchestration` is absent from the native tool catalog, report that the global plugin tool is unavailable and stop managed dispatch; do not substitute a shell import, a second adapter instance, prompt text, or a claim of admission. Reinstall the current global release and restart the native provider/service before retesting.

`NORMALIZED_SPEC` conforms to `.opencode/schemas/orchestration-input.schema.json` and the semantic dispatch controller: schemaVersion `1.0.0`; fresh orchestrationId; goal/deliverables/nonGoals; allowedPaths; workUnits with id/goal/deliverable/nonGoals/allowedPaths/acceptanceGateIds; acceptanceGates with id/criterion/evidenceCommand/workUnitIds; roleModeTaskMapping with workUnitId/role/taskMode/boundedTask; DAG dependencies and parallelism; role/agent/remediation budgets; scopeExpansion; authorization; routingMetadataStatus and optional caller routing metadata. Absent routing is recorded as absent, never invented. Existing controller authorization rejects live provider/global/Git mutation as managed acceptance activities; explicit utilities and ordinary native actions remain separate under host policy.

Evidence files are an explicit declared-file acceptance strategy usable in Git and non-Git directories. List every reviewed file needed by the goal and gates, including relevant anticipated missing files. Directory scope entries require individual evidenceFiles; no workspace scanning or write sandbox is implied. File records include missing state and SHA-256. Validator evidence uses the SHA-256 of the canonical sorted record array (the same `declaredFileEvidence` utility exported by the immutable global protocol module). A directory declaration alone cannot prove unlisted files. Git inspection may supplement this evidence under native policy.

Admission returns actual native workspaceRoot, immutable runtimeRoot and external traceRoot. Pass those roots through documented optional role packet fields. Do not use plugin startup location, T3Code UI title, process cwd, or an inferred Git root as the native session directory. After a native cwd move, admit a fresh orchestration.

## Role tasks and results

Only these role/mode pairs are valid:

- researcher: research
- planner: plan or synthesis
- implementer: implementation or integration
- validator: validation, review, artifact-proof or integration-check

Follow `.opencode/contracts/role-io-contracts.json` and use exactly the required packet fields. Every separately scoped task, retry, remediation, changed role or follow-up gets a fresh delegationTaskId and child. scopeKey is the declared work-unit ID. Native roles receive the entire exact task envelope:

```text
<<<HARNESS_TASK_THREAD_POLICY_V1>>>
{"kind":"fresh","version":1,"role":"researcher","packet":{...}}
<<<END_HARNESS_TASK_THREAD_POLICY_V1>>>
```

The parent dispatches that envelope through the native **`subagent` tool** with the matching agent and a description. Omit sessionID; background is omitted or false. Users may alternatively submit complete envelopes to `/delegate-research`, `/delegate-plan`, `/delegate-implement` or `/delegate-validate`. The command executor and native tool hooks share admission. A command without the complete envelope fails locally. Direct primary use of a role agent and prose instructions confer no managed authorization.

The global profile currently supports foreground dispatch only. Background notifications and custom Job transport never count as completed evidence. A correlated child-originated structured clarification result grants one exact-child answer with a fresh nonce. Use the exact `clarification-response` envelope (kind, version 1, delegationTaskId, requestNonce, answer) and matching native sessionID; role, scope and goal cannot change. Authorization is consumed before invocation and capped at eight clarification answers per task. The same child retains its original leaf-agent reservation; an answer does not create or charge another leaf agent. Fresh tasks and retries still consume the declared total and per-role leaf-agent budgets. Replay, terminal reuse and restart deny continuation. Background context updates remain legacy-only because global background dispatch is disabled.

Each child returns the strict version-1 structured TaskResult with orchestrationId, delegationTaskId, scopeKey, role, taskMode, outcome, summary, evidence, artifacts and role-specific outputContract for success. Native wrapper, output, metadata, independently fetched child ID/parent/agent and structured result must agree. Exact JSON fences are accepted. Invalid output is replaced on every success-bearing surface before managed acceptance. Storage failure rejects only that task. Do not treat progress hooks, prompt context or this skill as acceptance evidence.

## Independent acceptance and cancellation

Run an independent validator in a fresh child. Each declared gate needs evidence with its exact command, exitCode 0 and the current declared-file evidence SHA-256. Its role output must link findings to the goal, scope and gates. The implementer cannot self-accept. Changes to reviewed files stale the gate hash. Only after all declared role mappings and gates succeed may the bound primary invoke `harness_orchestration` with:

`{"version":1,"action":"orchestration.accept","orchestrationId":"fresh-id"}`

Cancellation is task-local: invoke `harness_orchestration` with `{"version":1,"action":"task.cancel","context":TASK_CONTEXT}`. This invalidates late results and records termination uncertainty; it does not claim the native child stopped. Native interrupt/termination remains under host policy. An uncertain cancelled task prevents acceptance of that orchestration. Use a fresh orchestration and task after reviewing its effects. Compaction, restart and retained traces never restore old authorization.

## Assets, memory, routing and explicit utilities

Assets resolve against the immutable runtimeRoot. External trace state defaults to the harness XDG state tree, keyed by session and orchestration. Project memory is opt-in; preserve project optional skills and existing memory. Use `.opencode/bootstrap/memory/protocols/memory-management.md` and templates as artifact conventions, with global paths supplied by admission. Do not interpret legacy stopped-run/bwrap guard sections as requirements of this profile.

`global-utilities.js` exposes bounded reference expansion, reported usage telemetry, explicit routing selection with neutral defaults and all-or-none external endpoint inputs, handoff reading/formatting, exact-approved HTTPS acquisition, inert SHA-pinned archive installation, offline Win64 build/case verification and intentional verified relaunch. Utilities do not intercept tools, mutate provider transport, change credentials or acquire managed acceptance. They run only when explicitly selected under native permissions. Read the installed helper's exact request and confirmation fields before invoking it.

Role routing and local catalog examples are advisory. Local selection stays off by default. A malformed present override fails; no fallback or merge masks it. Preserve caller-supplied labels exactly when present: `### Delegation Parameters`, `**Provider Model**`, `**Routing Config**`, routingServiceUrl, localModelEnabled, preferLocal, localModelFallback.

Use the local references for routing and historical compatibility context. Restart the native provider/server after discovery changes. A source or portable plugin collision rejects managed activation locally; use the explicit reviewed project-entry migration operation before running both profiles in the same project.

The generic `runGlobalBuild` utility retains the exact command/cwd/script-policy/time/output request and exact confirmation before a bounded native shell invocation, with no stopped-run prerequisite. It sets npm offline input intent and reports `networkIsolation: native-policy`; it does not promise a network sandbox. The operator must select an offline command/input set and native permissions. It returns exit/signal/error/output and `accepted: false`; fake-executor fixtures cover success, failure and denied confirmation. This is the explicit native-policy equivalent of legacy isolated recovery build, whose Bubblewrap isolation remains legacy-only.
