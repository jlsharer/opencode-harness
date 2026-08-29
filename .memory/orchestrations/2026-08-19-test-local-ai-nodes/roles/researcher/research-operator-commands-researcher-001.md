```json
{
  "orchestrationId": "2026-08-19-test-local-ai-nodes",
  "role": "researcher",
  "artifactId": "research-operator-commands-researcher-001",
  "createdAt": "2026-08-19T15:28:35Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh research packet asking for exact operator steps to test the completed checkpointed integration against actual local AI nodes, constrained to current ai-infrastructure bytes, pinned harness commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3, listed documentation and implementation sources, non-live syntax inspection, and no implementation edits or live contacts.",
    "requiredContextPresent": "yes; taskMode research, scoped question, relevant paths, source constraints, freshness requirements, downstream needs, documentation target, and routing metadata status were supplied",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Read the authorized wrapper, binding schema, fixture, runbooks, pinned launcher/package documentation, registry and public examples, and completed validator evidence. Ran only offline identity, hash, help, Git-status, and diff-check commands. No node, provider, credential, SSH, tunnel, service, Docker, OpenCode process, cache preparation, projection publication, or acceptance validation was invoked.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/schemas/opencode-harness-binding.schema.json",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/README.md",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example",
      "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs",
      "/home/joshl/projects/opencode-harness/README.md",
      "/home/joshl/projects/opencode-harness/package.json",
      "/home/joshl/projects/opencode-harness/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/revalidate-end-to-end-validator-016-evidence.md",
      "/home/joshl/projects/opencode-harness/.opencode/contracts/role-io-contracts.json",
      "/home/joshl/projects/opencode-harness/.opencode/schemas/memory-trace-artifact.schema.json"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md"
    ],
    "commands": [
      "git rev-parse HEAD; git show pinned commit identity/package version; hash pinned launcher bytes",
      "./scripts/opencode-harness-integration.sh --help",
      "node bin/opencode-harness.mjs --help",
      "git status --short and git diff --check in both repositories"
    ]
  },
  "outputContract": {
    "outputs": "Evidence-backed operator command research, placeholder inventory, checkpoint expectations, safety classification, troubleshooting/rollback boundaries, risks, and next-role handoff.",
    "evidence": "Current harness HEAD, pinned commit, package 0.1.10, and launcher SHA-256 all matched. Current wrapper help exactly exposed plan, prepare-harness, bind, activate, run, deactivate, and help. Direct source establishes each approval, trust check, output, failure path, and live/offline boundary; prior validator evidence establishes only offline fixture acceptance, not live readiness.",
    "citedFindings": [
      {
        "finding": "The accepted harness identity is exact: commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3, package 0.1.10, launcher SHA-256 c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156. The wrapper checks owner/trust properties, all three pins, and a mode-0755 launcher plus mode-0644 package metadata before proceeding.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:8-10,106-116", "llama-server/schemas/opencode-harness-binding.schema.json:36-45", "opencode-harness/package.json:1-4", "offline git/hash commands recorded in workPerformed.commands"]
      },
      {
        "finding": "The current registry offers node slug main as local and secondary as remote. Secondary uses registry SSH alias josh-ai, deployed root ~/ai/llama-server, client tunnel port 8081, and remote port 8080. Provider IDs are mechanically ai-infra-main and ai-infra-secondary. The actual model ID is each selected private MODEL_ALIAS, not the filename.",
        "evidenceType": "direct",
        "citations": ["llama-server/config/nodes/nodes.tsv:1-3", "llama-server/scripts/export-opencode-projection.sh:314-329,367-382"]
      },
      {
        "finding": "Before plan, each selected node needs owner-only mode-0600 config/nodes/<slug>.env and config/nodes/<slug>.opencode.env. The server env supplies MODEL_ALIAS, HOST_PORT, LLAMA_ARG_CTX_SIZE, and optionally LLAMA_ARG_N_PARALLEL; the client file supplies exactly a positive OPENCODE_MODEL_OUTPUT_LIMIT below context and lowercase unquoted true/false OPENCODE_MODEL_ENABLE_THINKING. Public examples contain placeholders and are not evidence of actual private values.",
        "evidenceType": "direct",
        "citations": ["llama-server/README.md:33-68", "llama-server/config/nodes/opencode-projection.env.example:1-3", "llama-server/config/nodes/main.env.example:1-11", "llama-server/config/nodes/secondary.env.example:1-11", "llama-server/docs/opencode-harness-integration.md:37-50"]
      },
      {
        "finding": "The routing profile must be a separate unwrapped schema-2 JSON object at an absolute canonical current-user-owned mode-0600 regular path. It must have exactly the required top-level fields, all four role overrides, only catalog IDs such as ai-infra-main/ai-infra-secondary, and localRouting.forceLocalForHarnessSubagents=false. It must contain no credentials. The committed harness-model-routing*.json files are wrapped beneath harnessModelRouting and their sample IDs/ports are illustrative, so they are shape references, not literal integration inputs.",
        "evidenceType": "direct plus explicit comparison",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:87,161-175", "llama-server/docs/opencode-harness-integration.md:37-50", "opencode-harness/README.md:79-121", "opencode-harness/.opencode/routing/harness-model-routing.local.example.json:1-25"]
      },
      {
        "finding": "Platform/runtime prerequisites are Linux, Node >=24 <25, exact OpenCode 1.18.18, Git, a trusted absolute canonical owner-owned harness checkout, and an absolute canonical owner-owned Git-worktree-root workspace. A dirty workspace fails unless --ack-dirty-workspace is explicitly added to plan, bind, and run. Use a disposable clean workspace because any OpenCode run can modify files and Git state.",
        "evidenceType": "direct",
        "citations": ["opencode-harness/README.md:1-5,154-174", "llama-server/scripts/opencode-harness-integration.sh:118-125", "llama-server/README.md:12-21,95-100"]
      },
      {
        "finding": "Authentication is native external OpenCode state. The projection/profile/binding must remain credential-free, and the wrapper does not create credentials or modify global OpenCode configuration. Whether the selected real local provider needs any native credential entry is operator/environment-specific and is not established by these sources.",
        "evidenceType": "direct with unresolved environment dependency",
        "citations": ["opencode-harness/README.md:121-152", "llama-server/docs/opencode-harness-integration.md:3-8,48-50", "llama-server/README.md:399-405"]
      },
      {
        "finding": "Plan is the first non-live checkpoint. It validates registry/private projection inputs, workspace, profile, harness pins, exporter dry-run, in-memory profile/catalog references, and pinned offline validate-inputs; it does not publish a projection. Its deterministic wrapper table reports nodes/workspace/profile/harness/projection satisfied and next approval-required. The exporter also emits 'projection valid for N selected node(s); no files written' and the destination on stderr.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:274-290", "llama-server/scripts/export-opencode-projection.sh:342-343", "llama-server/docs/opencode-harness-integration.md:52-68"]
      },
      {
        "finding": "prepare-harness requires its own --yes and writes/verifies the versioned cache. It forwards an optional canonical absolute --cache-root and execs the launcher, so success output is the concrete cache/runtime path printed by the launcher and its exit status is preserved.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:267-273", "opencode-harness/README.md:154-158", "llama-server/tests/opencode-harness-integration-validation.sh:166-169"]
      },
      {
        "finding": "bind requires a separate --yes. It repeats dry-run checks, publishes one concrete generation, validates all three inputs, and creates/reuses a content-derived owner-only mode-0600 binding under a mode-0700 directory. Success ends with exactly 'validation JSON: <compact object>' and 'binding: <absolute path>'; record that path. The bindings parent must already exist and be trusted. Never use current, mix generation leaves, or edit the binding.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:291-374", "llama-server/docs/opencode-harness-integration.md:77-87,124-147", "llama-server/tests/opencode-harness-integration-validation.sh:171-210"]
      },
      {
        "finding": "activate is live and separately approved with --yes. For remote nodes it starts and checks the registry-managed tunnel; for every node it silently curls the projected loopback /health URL. It never starts a llama.cpp service. On absent health it exits 1 and prints the exact separately-authorized command '<scripts>/ai.sh --node <slug> --local|--remote start'. A partial activation can leave a previously started tunnel active.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:375-405", "llama-server/docs/opencode-harness-integration.md:89-96,152-161", "llama-server/tests/opencode-harness-integration-validation.sh:213-216"]
      },
      {
        "finding": "After activation, the operator must fully quit every OpenCode process and only then supply --ack-opencode-restarted. run accepts forwarded argv beginning with models or run, revalidates binding/pins/files/profile, requires remote tunnel status and health, prints workspace pre-state, launches the pinned harness, then prints post-state and git diff even on nonzero exit and returns the harness/OpenCode status. It does not accept a leading 'opencode'.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:380-392", "llama-server/docs/opencode-harness-integration.md:98-113", "llama-server/tests/opencode-harness-integration-validation.sh:220-231"]
      },
      {
        "finding": "A concrete live progression is provider discovery first, then an explicitly selected direct model request, then optional managed delegation: models ai-infra-<slug>; run --format json --model ai-infra-<slug>/<MODEL_ALIAS> --agent <AGENT> '<PROMPT>'; run --agent build --command delegate-orchestration '<PROMPT>'. Exact provider/model response text is not specified and cannot be promised; operational success requires exit 0 plus the intended provider/model appearing or answering, followed by inspection of wrapper Git status/diff and generated traces.",
        "evidenceType": "direct command grammar plus inference for success criteria",
        "citations": ["llama-server/README.md:326-397", "opencode-harness/README.md:42-51"]
      },
      {
        "finding": "deactivate requires a separate --yes and stops only managed tunnels for remote nodes in the binding. It then expects tunnel-status to fail and prints 'managed tunnel inactive: <slug> (unmanaged listeners not inspected)'. With only local nodes, successful deactivate produces no wrapper status line. It neither stops servers nor proves no unmanaged listener exists.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:394-413", "llama-server/docs/opencode-harness-integration.md:115-122", "llama-server/tests/opencode-harness-integration-validation.sh:217-218"]
      },
      {
        "finding": "Offline fixture acceptance is strong but deliberately limited: prior independent validation passed the integration fixture, harness source/runtime/routing/package suites, schema checks, and hostile binding/profile cases while explicitly leaving real endpoint, SSH/systemd, server, provider, OpenCode, credentials, publication, and rollback untested.",
        "evidenceType": "direct historical evidence",
        "citations": ["opencode-harness/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/revalidate-end-to-end-validator-016-evidence.md:48-99"]
      }
    ],
    "operatorSequence": [
      {
        "phase": "0-offline identity and syntax",
        "safety": "offline/non-live/read-only",
        "commands": [
          "cd /home/joshl/projects/opencode-harness && git rev-parse HEAD",
          "cd /home/joshl/projects/opencode-harness && node -p \"require('./package.json').version\"",
          "sha256sum /home/joshl/projects/opencode-harness/bin/opencode-harness.mjs",
          "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh --help",
          "node /home/joshl/projects/opencode-harness/bin/opencode-harness.mjs --help",
          "/bin/bash -p /home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness"
        ],
        "expected": "The first three values exactly match the pin; both help commands show the documented grammar; the disposable fixture should end 'OpenCode harness integration validation fixtures: PASS'. The fixture is optional confidence evidence, not live readiness. It was not rerun in this research task."
      },
      {
        "phase": "1-substitute and privately prepare",
        "safety": "local file preparation; no service contact, but state-writing",
        "commands": [
          "cd /home/joshl/ai-infrastructure/llama-server",
          "cp config/nodes/opencode-projection.env.example config/nodes/<NODE>.opencode.env",
          "chmod 600 config/nodes/<NODE>.env config/nodes/<NODE>.opencode.env /ABS/OWNER/advisory-profile.json"
        ],
        "expected": "Replace angle-bracket/uppercase placeholders first. Do not print private payloads. The profile must be unwrapped and use the emitted ai-infra-<NODE> IDs."
      },
      {
        "phase": "2-plan",
        "safety": "offline/non-live; reads private files and uses ephemeral temporary files but publishes nothing",
        "commands": [
          "INTEGRATION=/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
          "$INTEGRATION plan --node <NODE> [--node <NODE2>] --workspace /ABS/DISPOSABLE/GIT/WORKSPACE --routing-profile /ABS/OWNER/advisory-profile.json --harness-root /home/joshl/projects/opencode-harness --projection-root /ABS/OWNER/CONFIG/opencode/ai-infrastructure"
        ],
        "expected": "Exporter no-files-written message, then a tabular satisfied report ending 'next approval-required prepare-harness --yes, then bind --yes'. Omit literal brackets. Add --ack-dirty-workspace only after inspecting and intentionally accepting a dirty test workspace."
      },
      {
        "phase": "3-prepare cache",
        "safety": "local state-writing; no provider/node contact",
        "commands": [
          "$INTEGRATION prepare-harness --harness-root /home/joshl/projects/opencode-harness --yes",
          "$INTEGRATION prepare-harness --harness-root /home/joshl/projects/opencode-harness --cache-root /ABS/OWNER/CACHE --yes"
        ],
        "expected": "Choose one command, not both. Success prints the concrete prepared runtime/cache path. Unsafe/colliding/drifted cache state fails rather than being repaired."
      },
      {
        "phase": "4-bind",
        "safety": "local client state-writing; publishes projection and binding but does not contact nodes",
        "commands": [
          "$INTEGRATION bind --node <NODE> [--node <NODE2>] --workspace /ABS/DISPOSABLE/GIT/WORKSPACE --routing-profile /ABS/OWNER/advisory-profile.json --harness-root /home/joshl/projects/opencode-harness --projection-root /ABS/OWNER/CONFIG/opencode/ai-infrastructure [--bindings-dir /ABS/OWNER/STATE/bindings] --yes",
          "BINDING=/EXACT/ABSOLUTE/PATH/PRINTED/AFTER/binding-colon.json"
        ],
        "expected": "A compact validation JSON line with packageVersion 0.1.10, then one absolute binding path. Omit literal brackets. Ensure the chosen bindings parent already exists and is trusted."
      },
      {
        "phase": "5-separately establish real services",
        "safety": "validate may use Docker/SSH; status/health/models/gpu are live observation; start is live mutation and requires separate authorization",
        "commands": [
          "./scripts/ai.sh --node <NODE> --local|--remote validate",
          "./scripts/ai.sh --node <NODE> --local|--remote status",
          "./scripts/ai.sh --node <NODE> --local|--remote start",
          "./scripts/ai.sh --node <NODE> --local|--remote health",
          "./scripts/ai.sh --node <NODE> --local|--remote models",
          "./scripts/ai.sh --node <NODE> --local|--remote gpu"
        ],
        "expected": "Replace --local|--remote with exactly one flag: main is --local; secondary is --remote. Run start only if absent and separately approved. Stop on any failed prerequisite/observation."
      },
      {
        "phase": "6-activate",
        "safety": "live tunnel mutation for remote nodes plus live loopback health",
        "commands": ["$INTEGRATION activate --binding \"$BINDING\" --yes"],
        "expected": "Remote tunnel start/status output may appear; health curl is silent on success. On unavailable service, stop and separately review the exact ai.sh start command printed by the wrapper."
      },
      {
        "phase": "7-provider discovery",
        "safety": "live OpenCode/provider traffic; workspace potentially mutating",
        "commands": [
          "# Fully quit every OpenCode process first.",
          "$INTEGRATION run --binding \"$BINDING\" --ack-opencode-restarted -- models ai-infra-<NODE>"
        ],
        "expected": "Wrapper pre-state, native OpenCode model-discovery output, wrapper post-state, and Git diff. Require exit 0 and inspect that the intended provider/model is present; exact native formatting is unspecified."
      },
      {
        "phase": "8-direct model request",
        "safety": "live provider traffic and potentially workspace/Git-mutating",
        "commands": [
          "$INTEGRATION run --binding \"$BINDING\" --ack-opencode-restarted -- run --format json --model ai-infra-<NODE>/<ACTUAL_MODEL_ALIAS> --agent <AGENT> \"<LOCAL_TEST_PROMPT>\""
        ],
        "expected": "Require exit 0, a response attributable to the requested provider/model, and an understood clean/expected workspace diff. MODEL_ALIAS, AGENT, prompt, and response are operator values; no exact response is specified."
      },
      {
        "phase": "9-optional delegated test",
        "safety": "live delegated provider traffic and potentially workspace/Git-mutating",
        "commands": [
          "$INTEGRATION run --binding \"$BINDING\" --ack-opencode-restarted -- run --agent build --command delegate-orchestration \"<BOUNDED_DELEGATED_TEST_PROMPT>\""
        ],
        "expected": "Managed orchestration output/traces plus wrapper status/diff. Verify each delegated role used the intended local catalog selection from traces/output; force-local remains false, so do not infer local-only behavior without observing assignments."
      },
      {
        "phase": "10-cleanup",
        "safety": "live managed-tunnel stop for remote nodes",
        "commands": ["$INTEGRATION deactivate --binding \"$BINDING\" --yes"],
        "expected": "For each remote node: managed tunnel inactive, unmanaged listeners not inspected. Servers remain unchanged/running unless a separate approved service rollback is performed."
      }
    ],
    "operatorSubstitutions": [
      "Selected exact registry set: main, secondary, or both; repeat --node and keep the set unchanged across plan/bind.",
      "Actual private server values per node: approved image digest, absolute model directory, exact model filename, live MODEL_ALIAS, host port, context, parallelism/GPU settings; examples are not actual inventory.",
      "Client output limit and thinking boolean; output must be positive and below context.",
      "Absolute canonical disposable Git workspace and its backup/restore decision; add --ack-dirty-workspace only after inspection.",
      "Absolute owner-only unwrapped routing profile and role-to-ai-infra-main/ai-infra-secondary selections.",
      "Absolute projection root, optional cache root, and optional binding directory whose trusted parent already exists.",
      "Trusted exact OpenCode 1.18.18 executable selection through PATH or OPENCODE_BIN and any separately owned native authentication needed by the actual adapter/environment.",
      "Actual model path ai-infra-<slug>/<MODEL_ALIAS>, native AGENT name, bounded test prompt, success criteria, data-handling approval, and rollback owner."
    ],
    "troubleshootingAndRollback": [
      "Any pin/hash/version mismatch: stop; use the exact paired checkout. Do not bypass or patch the wrapper.",
      "Dirty workspace: inspect git status/diff; prefer a clean disposable worktree. --ack-dirty-workspace is acknowledgment, not backup.",
      "Profile/projection rejection: correct the private source/profile, rerun plan, then publish a new coherent generation and create a new binding. Never edit a binding or mix leaves.",
      "Activation health failure: preserve output; separately authorize the exact printed ai.sh start command only if the service is absent. A partially started remote tunnel can be cleaned with deactivate using the binding.",
      "Remote tunnel failure: use ./scripts/tunnel-status.sh --node <NODE> and journalctl --user -u ai-infrastructure-tunnel-<NODE>.service under separate live-observation authorization; do not add raw hosts/endpoints.",
      "Run failure: preserve exit status, pre/post status, diff, trace paths, and any retained launcher cleanup path. Do not rerun until workspace and provider/tunnel state are understood.",
      "Projection rollback: choose both leaves from one retained prior concrete generation, create a new valid binding through a compatible integration path, and fully restart OpenCode.",
      "Harness rollback: there is no rollback verb. Invoke an independently paired retained harness version and its separate cache; the current wrapper is hard-pinned to 0.1.10/c1c16cc and cannot bind 0.1.9.",
      "Server rollback is outside this wrapper. Use separately approved exact backup/restore and ai.sh procedures; deactivate does not stop a server.",
      "Workspace rollback is the pre-approved backup/restore procedure. Git status/diff is only observation."
    ],
    "sourceList": [
      "llama-server/scripts/opencode-harness-integration.sh (current bytes; primary executable contract)",
      "llama-server/schemas/opencode-harness-binding.schema.json (binding pins/shape)",
      "llama-server/tests/opencode-harness-integration-validation.sh (offline expected behavior)",
      "llama-server/docs/opencode-harness-integration.md (checkpoint/trust/rollback runbook)",
      "llama-server/README.md (canonical operations/authorization runbook)",
      "llama-server/config/nodes/nodes.tsv and public *.env.example files (current node registry and placeholders)",
      "opencode-harness commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3: bin/opencode-harness.mjs, README.md, package.json",
      "completed validator trace revalidate-end-to-end-validator-016-evidence.md (offline acceptance limits)"
    ],
    "implementationImplications": [
      "A downstream operator guide should present literal current-machine repo/harness roots but retain explicit substitutions for private values, workspace, profile, state roots, alias, agent, and prompts.",
      "It should not tell users to pass the committed wrapped routing examples directly; provide or request a reviewed unwrapped profile.",
      "It should separate non-live plan/identity checks, local state writes, live observations, live tunnel/server mutations, and real OpenCode/provider calls with a pause before every approval.",
      "It should capture BINDING from the exact bind output and use only that immutable file afterward.",
      "It should define observable live success rather than promise native OpenCode output text that the implementation does not specify.",
      "It should put deactivate in the explicit cleanup/recovery path after any activation attempt, while warning that local servers and unmanaged listeners are outside its ownership."
    ],
    "risks": [
      "The ai-infrastructure integration files are current uncommitted worktree bytes; harness identity is committed and exact. Current Git status contains extensive unrelated/pre-existing ai-infrastructure changes.",
      "No private env/profile, node health, SSH, tunnel, service, native credentials, provider discovery, model response, delegation quality, OpenCode restart, or rollback was inspected; all remain unresolved live facts.",
      "forceLocalForHarnessSubagents must remain false, so a delegated test needs observed routing evidence and cannot claim a hard local-only enforcement boundary.",
      "Actual OpenCode model listing/response format and local adapter authentication requirements are not specified by the authorized sources.",
      "Same-UID replacement races and unmanaged listener/socket state remain outside the wrapper's guarantees.",
      "A real run can mutate the workspace and Git even when the intent is observational."
    ],
    "unresolvedQuestions": [
      "Which node set (main, secondary, or both), actual MODEL_ALIAS values, profile role assignments, and native AGENT should the operator approve?",
      "Do the ignored mode-0600 private files and the unwrapped profile currently exist and match live inventory? They were intentionally not read.",
      "Which trusted exact OpenCode 1.18.18 executable and native authentication state will be used?",
      "What exact live success assertions should be required for model identity, response content, delegation role assignments, latency/capacity, and no unexpected workspace mutation?",
      "What verified workspace and server rollback procedures/owners are approved before live execution?"
    ],
    "recommendedNextRole": "planner",
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/validator/revalidate-end-to-end-validator-016-evidence.md"
    ]
  },
  "handoff": {
    "nextRole": "planner",
    "limitations": "Research only. No final plan, implementation edit, live action, private-input read, provider/OpenCode request, or acceptance validation was performed. Commands containing angle brackets, uppercase placeholders, brackets, or --local|--remote require deliberate operator substitution; brackets are documentation notation and must not be typed.",
    "risks": "Live readiness is unknown. Preserve each approval boundary, use a disposable workspace, keep force-local false, record the immutable binding, and do not treat prior offline PASS evidence as node/provider/OpenCode acceptance."
  }
}
```
