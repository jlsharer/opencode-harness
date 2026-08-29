```json
{
  "orchestrationId": "2026-08-19-test-local-ai-nodes",
  "role": "planner",
  "artifactId": "synthesize-operator-runbook-planner-002",
  "createdAt": "2026-08-19T15:32:26Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh planner packet in synthesis mode, with approved goal, boundaries, researcher trace, pinned harness identity, node/provider facts, required checkpoint order, deliverable path, acceptance criteria, dependencies, assumptions, and three explicit conflicts/decisions.",
    "requiredContextPresent": "yes; every required planner input and the cited researcher evidence were present",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Resolved the supplied profile, activation, server-ownership, workspace-mutation, authentication, and advisory-routing decisions into one bounded operator runbook. Read only the supplied researcher trace, its cited implementation/documentation surfaces, and planner contracts. No implementation/configuration file, node, tunnel, service, provider, credential, OpenCode process, projection, cache, binding, or workspace was changed or contacted.",
    "filesRead": [
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".memory/templates/role-trace-artifact.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/INDEX.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/README.md",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example",
      "README.md",
      ".opencode/routing/harness-model-routing.local.example.json"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md"
    ],
    "commands": [
      "date -u +%Y-%m-%dT%H:%M:%SZ",
      "node JSON.parse self-check for the fenced planner trace"
    ]
  },
  "outputContract": {
    "outputs": "Resolved synthesis conclusions plus a concrete, checkpointed, novice-executable runbook for main and secondary, with machine-specific values collected before use, exact approval flags, observable gates, workspace checks, cleanup, and partial-failure recovery.",
    "evidence": "Commands and boundaries are grounded in research-operator-commands-researcher-001 and its direct citations to the current integration wrapper, registry, examples, integration runbook, harness README, and completed offline validator trace. No live claim is promoted from offline evidence.",
    "orderedPlanOrResolvedConclusions": [
      "Use both selected registry nodes without changing the set between plan and bind: main is local; secondary is remote through registry SSH alias josh-ai and client tunnel port 8081. Their catalog provider IDs are ai-infra-main and ai-infra-secondary.",
      "Create/review ignored mode-0600 server metadata and client projection metadata first. The secondary server copy at its deployed remote root is a separate deployment prerequisite; the local secondary files remain required projection inputs.",
      "Generate a separate unwrapped schema-2 profile. Never pass either committed wrapped harness-model-routing example to the wrapper. All four roles must select an emitted provider ID, and forceLocalForHarnessSubagents remains false.",
      "Run checkpoints in this order: identity/private-input preparation; plan; prepare-harness --yes; bind --yes; separately establish both llama-server services; activate --yes to establish/check the managed remote tunnel and health; fully quit OpenCode; acknowledged models and run checks; deactivate --yes.",
      "The wrapper's activate checkpoint may start the managed secondary tunnel and checks loopback health, but it never starts either llama-server. Server starts therefore remain separate ai.sh actions with separate authorization.",
      "Treat every wrapper run as potentially workspace-mutating. Inspect Git status and diff immediately before and after each live OpenCode invocation; use --ack-dirty-workspace only after deliberate inspection and approval.",
      "Treat routing as advisory, not a hard local-only guarantee. Direct --model selection is observable evidence for a direct request; delegated role assignments must be checked in output/traces because force-local is false.",
      "Keep authentication external to projections, profile, and binding. The supplied evidence does not establish whether the actual native OpenCode adapter requires credential/config state, so resolve that environment-specific prerequisite before the first run without inventing or embedding credentials here.",
      "After any activation attempt, use the immutable binding for deactivate. This stops only managed remote tunnels; it does not stop servers or inspect unmanaged listeners."
    ],
    "fileContractsOrDecisions": [
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env",
        "contract": "Ignored current-client/current-local-server metadata, current-user-owned mode 0600. Review and set COMPOSE_PROJECT_NAME, approved digest-pinned LLAMA_IMAGE, absolute MODEL_DIR, exact MODEL_FILE, live MODEL_ALIAS, HOST_PORT, LLAMA_ARG_CTX_SIZE, LLAMA_ARG_N_PARALLEL, and reviewed GPU/cache settings. Example values are not live inventory."
      },
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env",
        "contract": "Ignored local projection-side copy, current-user-owned mode 0600, containing the reviewed secondary server values needed by export. A corresponding separately provisioned mode-0600 server env must exist under ~/ai/llama-server on josh-ai; do not copy the .opencode.env file to that server."
      },
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.opencode.env",
        "contract": "Client-only mode-0600 file with exactly a positive OPENCODE_MODEL_OUTPUT_LIMIT below main's context and an unquoted lowercase true/false OPENCODE_MODEL_ENABLE_THINKING."
      },
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.opencode.env",
        "contract": "Client-only mode-0600 file with exactly a positive OPENCODE_MODEL_OUTPUT_LIMIT below secondary's context and an unquoted lowercase true/false OPENCODE_MODEL_ENABLE_THINKING."
      },
      {
        "path": "$PRIVATE_DIR/advisory-profile.json",
        "contract": "Absolute canonical current-user-owned unwrapped schema-2 JSON, mode 0600, no credentials/auth paths/provider options/catalog payload. It contains all four role overrides, references only ai-infra-main or ai-infra-secondary, and sets localRouting.forceLocalForHarnessSubagents to false."
      },
      {
        "path": "$PROJECTION_ROOT/generation-*/provider.json and catalog.json",
        "contract": "Generated coherent projection leaves. Bind publishes and selects them; never edit leaves, use current, or mix generations."
      },
      {
        "path": "$BINDING",
        "contract": "Exact absolute immutable mode-0600 binding path printed by successful bind. Record it once and pass only this file to activate, run, and deactivate; never edit it."
      },
      {
        "path": "$WORKSPACE",
        "contract": "Absolute canonical owner-owned Git worktree root selected by the operator, preferably clean and disposable. The operator must choose its path, backup/restore procedure, test prompt/data approval, and acceptable diff before live execution."
      }
    ],
    "dependencies": [
      "Completed researcher artifact research-operator-commands-researcher-001.",
      "Linux, Git, Node >=24 <25, exact OpenCode 1.18.18, and the pinned trusted harness checkout.",
      "Operator access to the main machine and registry SSH alias josh-ai, with the approved remote checkout at ~/ai/llama-server.",
      "Reviewed private model/image/context/output values and an approved clean disposable Git workspace.",
      "Any native OpenCode provider authentication/configuration required by the actual environment, resolved outside credential-free projection/profile/binding files.",
      "Separate live authorization for service observations/starts, SSH/tunnel activation, provider traffic, workspace mutation risk, and cleanup."
    ],
    "operatorRunbook": {
      "rules": [
        "Run Bash commands from /home/joshl/ai-infrastructure/llama-server unless a step explicitly says otherwise.",
        "Do not paste documentation metavariables. This runbook obtains machine-specific values through shell variables or an editor before they can be used.",
        "Stop at every numbered gate. A successful prior gate does not authorize the next one.",
        "Do not print private env/profile contents into logs. Permission/ownership checks below print metadata only."
      ],
      "phase0_collect_paths_and_offline_identity": {
        "safety": "offline/read-only except creation of owner-only private/state directories",
        "commands": [
          "cd /home/joshl/ai-infrastructure/llama-server",
          "export AI_ROOT=/home/joshl/ai-infrastructure/llama-server",
          "export HARNESS_ROOT=/home/joshl/projects/opencode-harness",
          "export INTEGRATION=$AI_ROOT/scripts/opencode-harness-integration.sh",
          "read -r -p 'Absolute path of the clean disposable Git workspace: ' WORKSPACE_INPUT",
          "export WORKSPACE=$(realpath -- \"$WORKSPACE_INPUT\")",
          "export PRIVATE_DIR=$HOME/.config/ai-infrastructure/opencode-harness-live-test",
          "export ROUTING_PROFILE=$PRIVATE_DIR/advisory-profile.json",
          "export PROJECTION_ROOT=$HOME/.config/opencode/ai-infrastructure",
          "export BINDINGS_DIR=$HOME/.local/state/ai-infrastructure/opencode-harness/bindings",
          "umask 077",
          "install -d -m 700 -- \"$PRIVATE_DIR\" \"$BINDINGS_DIR\"",
          "test \"$(git -C \"$HARNESS_ROOT\" rev-parse HEAD)\" = c1c16cc55ca2c4787f000d01ff05ffe05734a3d3",
          "test \"$(node -p \"require('$HARNESS_ROOT/package.json').version\")\" = 0.1.10",
          "test \"$(sha256sum \"$HARNESS_ROOT/bin/opencode-harness.mjs\" | cut -d' ' -f1)\" = c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156",
          "\"$INTEGRATION\" --help",
          "node \"$HARNESS_ROOT/bin/opencode-harness.mjs\" --help",
          "git -C \"$WORKSPACE\" status --short",
          "git -C \"$WORKSPACE\" diff --check",
          "git -C \"$WORKSPACE\" diff"
        ],
        "successEvidence": "All three test commands exit 0; help exposes plan, prepare-harness, bind, activate, run, and deactivate; WORKSPACE resolves to the intended Git root; status/diff is clean or explicitly reviewed before any acknowledgment.",
        "failureAction": "Stop on any identity mismatch, non-Git workspace, unexpected diff, unsafe path, or help mismatch. Do not bypass the pin checks."
      },
      "phase1_create_and_review_private_inputs": {
        "safety": "local state-writing; no endpoint contact",
        "commands": [
          "cd \"$AI_ROOT\"",
          "for node in main secondary; do test -e \"config/nodes/$node.env\" || cp -- \"config/nodes/$node.env.example\" \"config/nodes/$node.env\"; test -e \"config/nodes/$node.opencode.env\" || cp -- config/nodes/opencode-projection.env.example \"config/nodes/$node.opencode.env\"; chmod 600 -- \"config/nodes/$node.env\" \"config/nodes/$node.opencode.env\"; done",
          ": \"${EDITOR:?Set EDITOR to your trusted text editor before continuing}\"",
          "\"$EDITOR\" config/nodes/main.env config/nodes/main.opencode.env config/nodes/secondary.env config/nodes/secondary.opencode.env",
          "stat -c '%U %a %n' config/nodes/main.env config/nodes/main.opencode.env config/nodes/secondary.env config/nodes/secondary.opencode.env"
        ],
        "valuesToReview": [
          "For each node: approved digest-pinned LLAMA_IMAGE, absolute MODEL_DIR, exact MODEL_FILE, live MODEL_ALIAS, HOST_PORT, LLAMA_ARG_CTX_SIZE, LLAMA_ARG_N_PARALLEL, and model/GPU/cache settings.",
          "For each client-only .opencode.env: positive integer output limit below that node's context and lowercase unquoted thinking boolean.",
          "For secondary: the local file must describe the reviewed remote deployment, but the remote server env is provisioned separately at the remote checkout."
        ],
        "successEvidence": "All four local files report the current user and mode 600. The later plan checkpoint is the fail-closed content check; metadata alone is not content acceptance.",
        "failureAction": "Stop and correct ownership/mode or unresolved placeholder/inventory values without printing private payloads."
      },
      "phase2_create_unwrapped_profile": {
        "safety": "local state-writing; no endpoint contact",
        "instructions": "Choose each requested value by typing exactly ai-infra-main or ai-infra-secondary. The generator refuses every other value and refuses to overwrite an existing profile. Delete or move an old profile only after separate review.",
        "profileGenerator": [
          "read -r -p 'Default local provider ID (ai-infra-main or ai-infra-secondary): ' DEFAULT_PROVIDER_ID",
          "read -r -p 'Researcher provider ID: ' RESEARCHER_PROVIDER_ID",
          "read -r -p 'Planner provider ID: ' PLANNER_PROVIDER_ID",
          "read -r -p 'Implementer provider ID: ' IMPLEMENTER_PROVIDER_ID",
          "read -r -p 'Validator provider ID: ' VALIDATOR_PROVIDER_ID",
          "for name in DEFAULT_PROVIDER_ID RESEARCHER_PROVIDER_ID PLANNER_PROVIDER_ID IMPLEMENTER_PROVIDER_ID VALIDATOR_PROVIDER_ID; do value=${!name}; case $value in ai-infra-main|ai-infra-secondary) ;; *) printf 'Invalid provider ID in %s\\n' \"$name\" >&2; false; break ;; esac; done",
          "export DEFAULT_PROVIDER_ID RESEARCHER_PROVIDER_ID PLANNER_PROVIDER_ID IMPLEMENTER_PROVIDER_ID VALIDATOR_PROVIDER_ID ROUTING_PROFILE",
          "node - <<'NODE'",
          "const fs = require('node:fs');",
          "const e = process.env;",
          "const allowed = new Set(['ai-infra-main', 'ai-infra-secondary']); for (const name of ['DEFAULT_PROVIDER_ID','RESEARCHER_PROVIDER_ID','PLANNER_PROVIDER_ID','IMPLEMENTER_PROVIDER_ID','VALIDATOR_PROVIDER_ID']) { if (!allowed.has(e[name])) throw new Error(`invalid provider ID in ${name}`); }",
          "const profile = {schemaVersion:'2.0.0',defaultMode:'single-model',defaultModel:null,singleModel:{enabled:false,model:null},localRouting:{enabled:true,forceLocalForHarnessSubagents:false,defaultLocalModel:e.DEFAULT_PROVIDER_ID},roleOverrides:{researcher:{model:null,localModel:e.RESEARCHER_PROVIDER_ID,variant:'research'},planner:{model:null,localModel:e.PLANNER_PROVIDER_ID,variant:'planning'},implementer:{model:null,localModel:e.IMPLEMENTER_PROVIDER_ID,variant:null},validator:{model:null,localModel:e.VALIDATOR_PROVIDER_ID,variant:'audit'}},commandOverrides:{},orchestratorCommands:{},complexityTiers:{}};",
          "const fd = fs.openSync(e.ROUTING_PROFILE, 'wx', 0o600);",
          "try { fs.writeFileSync(fd, JSON.stringify(profile, null, 2) + '\\n'); } finally { fs.closeSync(fd); }",
          "NODE",
          "chmod 600 -- \"$ROUTING_PROFILE\"",
          "stat -c '%U %a %n' \"$ROUTING_PROFILE\""
        ],
        "successEvidence": "Generator exits 0 and stat reports the current user, mode 600, and the intended absolute path. Plan later proves cross-document references after projection dry-run.",
        "failureAction": "Stop. Do not substitute a wrapped committed routing example or add credentials. Review/move an existing profile rather than overwriting it blindly."
      },
      "phase3_plan_offline_gate": {
        "safety": "offline/non-live/read-only publication-wise; private inputs are read and ephemeral temporary files are used",
        "commands": [
          "cd \"$AI_ROOT\"",
          "\"$INTEGRATION\" plan --node main --node secondary --workspace \"$WORKSPACE\" --routing-profile \"$ROUTING_PROFILE\" --harness-root \"$HARNESS_ROOT\" --projection-root \"$PROJECTION_ROOT\""
        ],
        "successEvidence": "Exit 0; exporter reports a valid two-node projection with no files written; wrapper reports nodes, workspace, profile, harness, and projection satisfied and ends with the next approvals for prepare-harness --yes then bind --yes.",
        "failureAction": "Stop and correct the named private input, workspace, profile, pin, or trust failure. If and only if a dirty workspace is inspected and intentionally approved, add --ack-dirty-workspace to this command and later bind/run commands; that flag is not a backup."
      },
      "phase4_prepare_harness_gate": {
        "safety": "local cache state-writing; no node/provider contact",
        "commands": [
          "\"$INTEGRATION\" prepare-harness --harness-root \"$HARNESS_ROOT\" --yes"
        ],
        "successEvidence": "Exit 0 and the launcher prints the concrete prepared runtime/cache path.",
        "failureAction": "Stop on drift, collision, ownership, or mode failure. Do not repair or replace managed cache leaves by hand. An explicit alternate cache is allowed only as --cache-root followed by a reviewed canonical absolute owner path."
      },
      "phase5_bind_gate": {
        "safety": "local client state-writing; publishes a projection generation and immutable binding, but does not contact nodes",
        "commands": [
          "export BIND_LOG=$PRIVATE_DIR/bind-output.txt",
          "rm -f -- \"$BIND_LOG\"",
          "set -o pipefail",
          "\"$INTEGRATION\" bind --node main --node secondary --workspace \"$WORKSPACE\" --routing-profile \"$ROUTING_PROFILE\" --harness-root \"$HARNESS_ROOT\" --projection-root \"$PROJECTION_ROOT\" --bindings-dir \"$BINDINGS_DIR\" --yes | tee \"$BIND_LOG\"",
          "export BINDING=",
          "while IFS= read -r line; do case $line in 'binding: '*) BINDING=${line#binding: } ;; esac; done < \"$BIND_LOG\"",
          ": \"${BINDING:?Bind did not print a binding path; stop}\"",
          "test -f \"$BINDING\"",
          "stat -c '%U %a %n' \"$BINDING\""
        ],
        "successEvidence": "The pipeline exits 0, output contains compact validation JSON with valid true and packageVersion 0.1.10, then one binding line. BINDING is absolute and stat reports current user/mode 600.",
        "failureAction": "Stop. A failure after publication may retain a generation but creates no usable binding. Rerun plan, then publish a coherent new generation with bind; never edit a binding, use current, or mix leaves."
      },
      "phase6_separately_establish_servers": {
        "safety": "live observation and live server mutation; every start requires separate authorization",
        "mainCommands": [
          "cd \"$AI_ROOT\"",
          "./scripts/ai.sh --node main --local validate",
          "./scripts/ai.sh --node main --local status",
          "./scripts/ai.sh --node main --local start",
          "./scripts/ai.sh --node main --local health",
          "./scripts/ai.sh --node main --local models",
          "./scripts/ai.sh --node main --local gpu"
        ],
        "secondaryPreparationAndCommands": [
          "ssh josh-ai",
          "cd ~/ai/llama-server",
          "test -e config/nodes/secondary.env || cp -- config/nodes/secondary.env.example config/nodes/secondary.env",
          "chmod 600 -- config/nodes/secondary.env",
          ": \"${EDITOR:?Set EDITOR on the remote host before continuing}\"",
          "\"$EDITOR\" config/nodes/secondary.env",
          "stat -c '%U %a %n' config/nodes/secondary.env",
          "exit",
          "cd \"$AI_ROOT\"",
          "./scripts/ai.sh --node secondary --remote validate",
          "./scripts/ai.sh --node secondary --remote status",
          "./scripts/ai.sh --node secondary --remote start",
          "./scripts/ai.sh --node secondary --remote health",
          "./scripts/ai.sh --node secondary --remote models",
          "./scripts/ai.sh --node secondary --remote gpu"
        ],
        "operatorPause": "Run each start only if status shows the service absent and the specific mutation is separately approved. The direct SSH preparation is also a separately authorized remote state change. Do not copy secondary.opencode.env to the server.",
        "successEvidence": "validate/status/health/models/gpu exit successfully with the reviewed model/service/GPU observations for each node. No exact response text is guaranteed.",
        "failureAction": "Stop at the failed node. Use its separately approved ai.sh diagnostics/recovery; do not continue to activation. The integration wrapper has not started and does not own either server."
      },
      "phase7_activate_managed_tunnel_and_health": {
        "safety": "live managed-tunnel mutation for secondary and live loopback health for both nodes",
        "commands": [
          "\"$INTEGRATION\" activate --binding \"$BINDING\" --yes",
          "cd \"$AI_ROOT\"",
          "./scripts/tunnel-status.sh --node secondary"
        ],
        "successEvidence": "Activate exits 0; the managed secondary tunnel start/status succeeds; tunnel-status exits 0; both loopback health checks succeed silently. The secondary catalog endpoint is through local port 8081.",
        "failureAction": "Stop before OpenCode. Preserve output. If health is absent, separately review the exact ai.sh start command printed by activate; do not claim activate starts a server. Because partial activation can leave the secondary tunnel active, run the phase11 deactivate command with this binding when abandoning/retrying."
      },
      "phase8_restart_boundary_and_workspace_precheck": {
        "safety": "manual process boundary plus read-only workspace inspection",
        "commands": [
          "printf '%s\\n' 'Fully quit every OpenCode process now; do not continue until that is true.'",
          "git -C \"$WORKSPACE\" status --short",
          "git -C \"$WORKSPACE\" diff --check",
          "git -C \"$WORKSPACE\" diff"
        ],
        "successEvidence": "The operator confirms every OpenCode process was fully quit and the workspace is clean or its exact pre-existing state is explicitly understood.",
        "failureAction": "Stop. Do not pass --ack-opencode-restarted without the manual quit boundary. Do not pass --ack-dirty-workspace for an unreviewed workspace. Resolve any environment-specific native OpenCode auth/config requirement without adding credentials to generated integration files."
      },
      "phase9_provider_discovery": {
        "safety": "live OpenCode/provider traffic; potentially workspace/Git-mutating",
        "commands": [
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- models ai-infra-main; export MAIN_MODELS_STATUS=$?",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- models ai-infra-secondary; export SECONDARY_MODELS_STATUS=$?",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff"
        ],
        "successEvidence": "Both recorded statuses are 0, each native listing visibly includes the intended provider/model, and wrapper plus explicit post-checks show only an understood acceptable workspace state. Native formatting is unspecified.",
        "failureAction": "Preserve the nonzero status, wrapper pre/post state, diff, and any retained launcher cleanup path. Stop; diagnose authentication, provider activation, tunnel, endpoint, or model inventory before retrying."
      },
      "phase10_direct_and_optional_delegated_requests": {
        "safety": "live provider traffic and potentially workspace/Git-mutating",
        "valueCollection": [
          "read -r -p 'Exact main MODEL_ALIAS from reviewed private inventory: ' MAIN_MODEL_ALIAS",
          "read -r -p 'Exact secondary MODEL_ALIAS from reviewed private inventory: ' SECONDARY_MODEL_ALIAS",
          "read -r -p 'Native OpenCode agent name approved for the direct test: ' TEST_AGENT",
          "read -r -p 'Bounded non-secret direct test prompt: ' TEST_PROMPT"
        ],
        "directCommands": [
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --format json --model \"ai-infra-main/$MAIN_MODEL_ALIAS\" --agent \"$TEST_AGENT\" \"$TEST_PROMPT\"; export MAIN_RUN_STATUS=$?",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --format json --model \"ai-infra-secondary/$SECONDARY_MODEL_ALIAS\" --agent \"$TEST_AGENT\" \"$TEST_PROMPT\"; export SECONDARY_RUN_STATUS=$?",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff"
        ],
        "directSuccessEvidence": "Each recorded status is 0, each request returns an appropriate response attributable to the explicitly selected provider/model, and every observed workspace change is absent or pre-approved and understood. No exact answer text is promised.",
        "optionalDelegatedCommands": [
          "read -r -p 'Bounded non-secret delegated test request: ' DELEGATED_PROMPT",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --agent build --command delegate-orchestration \"$DELEGATED_PROMPT\"; export DELEGATED_RUN_STATUS=$?",
          "git -C \"$WORKSPACE\" status --short; git -C \"$WORKSPACE\" diff --check; git -C \"$WORKSPACE\" diff"
        ],
        "delegatedSuccessEvidence": "Status 0, expected orchestration traces exist, and output/traces show the actual role assignments selected. Because forceLocalForHarnessSubagents is false, do not report hard local-only routing merely because the profile prefers local catalog IDs.",
        "failureAction": "On any nonzero status or unexpected diff, stop; preserve output, status, traces, wrapper pre/post evidence, and cleanup path. Restore the workspace only through the operator's pre-approved procedure; status/diff is not a backup."
      },
      "phase11_deactivate_and_final_state": {
        "safety": "live managed-tunnel stop for secondary; does not stop either server",
        "commands": [
          "\"$INTEGRATION\" deactivate --binding \"$BINDING\" --yes",
          "git -C \"$WORKSPACE\" status --short",
          "git -C \"$WORKSPACE\" diff --check",
          "git -C \"$WORKSPACE\" diff"
        ],
        "successEvidence": "Exit 0 and a line states managed tunnel inactive for secondary with the warning that unmanaged listeners were not inspected. Final Git state is clean or exactly the accepted test result.",
        "failureAction": "Preserve diagnostics. The wrapper only owns registry-managed tunnels; use separately authorized tunnel status/user-journal diagnostics. Servers remain running unless separately stopped through approved ai.sh operations."
      },
      "partialFailureRecovery": [
        "Before bind succeeds: there is no binding to activate/deactivate. Correct inputs, rerun plan, then rerun prepare only if needed and bind with the unchanged reviewed node set.",
        "Bind failure after publication: retain the concrete generation for diagnosis, but do not use it manually. Rerun plan/bind to create a coherent new binding.",
        "Any activate failure after BINDING exists: do not run OpenCode. Attempt deactivate --binding \"$BINDING\" --yes to stop a possibly started managed secondary tunnel.",
        "Any run failure: do not immediately rerun. Preserve exit status, wrapper status/diff, traces, endpoint/tunnel observations, and any absolute retained launcher cleanup path; resolve auth/provider/workspace state first.",
        "Profile/projection change: create/review new source/profile content, rerun plan and bind, use only one new coherent generation, and fully quit/restart OpenCode before reuse.",
        "Workspace recovery: use only the pre-approved backup/restore method. Git output is observation, not rollback.",
        "Server recovery/rollback: outside this wrapper. Use separately approved exact ai.sh and verified backup procedures on the appropriate node.",
        "Harness rollback: no wrapper verb exists. The current integration remains pinned to 0.1.10/c1c16cc; a retained independently paired harness/integration and separate version cache are required."
      ]
    },
    "verificationGates": [
      "Gate 1 identity: exact commit, package, and launcher hash tests exit 0 before private or live work.",
      "Gate 2 private files: metadata stat shows current owner/mode 600 for all four local private files and the unwrapped profile; private values are reviewed without logging them.",
      "Gate 3 plan: exit 0, no projection written, two selected nodes validated, and all satisfied rows reported.",
      "Gate 4 prepare: explicit --yes, exit 0, and a concrete cache/runtime path printed.",
      "Gate 5 bind: explicit --yes, valid compact JSON for package 0.1.10, absolute immutable BINDING printed, and mode 600 verified.",
      "Gate 6 services: separately authorized main local and secondary remote validate/status/health/models/gpu checks succeed; starts occur only if needed and approved.",
      "Gate 7 activation: explicit --yes, secondary managed tunnel status succeeds, and both health checks pass; no server-start claim is made.",
      "Gate 8 restart/workspace: every OpenCode process is fully quit; --ack-opencode-restarted is truthful; status/diff is inspected before traffic.",
      "Gate 9 discovery/direct requests: each recorded status is 0, intended provider/model is observed, no exact native text is assumed, and status/diff is inspected after every run.",
      "Gate 10 delegated request if chosen: status 0 plus trace/output evidence of actual routing; advisory force-local is not overclaimed.",
      "Gate 11 cleanup: explicit --yes, managed secondary tunnel inactive evidence, servers explicitly understood to be unchanged, and final workspace status/diff reviewed."
    ],
    "handoffNotes": "Send this artifact to an independent validator in review mode. The validator should parse the fenced JSON against the trace schema, compare every wrapper/ai.sh command and expected line against cited current implementation, verify the unwrapped profile shape and acknowledgment flags, check that no placeholder is silently runnable, and confirm the live/offline and server/tunnel ownership boundaries. No operator should execute live phases until machine-specific values, native auth state, authorization, success assertions, and rollback ownership are resolved.",
    "openQuestions": [
      "What are the reviewed current MODEL_ALIAS, image/model/context/output values for main and secondary?",
      "Which provider ID should be assigned to each of the four roles and as the advisory default?",
      "Which native OpenCode agent is approved for the direct test, and what response/content assertions define success?",
      "Does the selected native OpenCode local adapter require environment-specific authentication/configuration, and is it already present?",
      "What exact workspace backup/restore procedure and server rollback owners are approved before live work?"
    ],
    "tradeoffs": [
      "The runbook selects both nodes to exercise local and tunneled paths in one immutable binding; this increases live scope compared with one-node testing but directly covers the approved two-node goal facts.",
      "Interactive variable collection and a fail-if-existing profile generator reduce accidental execution of documentation placeholders, at the cost of requiring deliberate operator input.",
      "Explicit workspace checks around every run are repetitive but preserve evidence when the wrapper/OpenCode can mutate Git state.",
      "Leaving force-local false preserves the accepted safety contract but means delegated local routing must be observed rather than guaranteed."
    ],
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md"
    ]
  },
  "handoff": {
    "nextRole": "validator",
    "limitations": "Synthesis only. No live endpoint, SSH, tunnel, service, provider, credential, OpenCode, private-input, generated projection/binding, workspace mutation, or acceptance validation was performed. Actual aliases, role assignments, agent, prompts, native auth/config, rollback, and live success remain operator decisions.",
    "risks": "A real run can mutate the workspace; activation can leave a partial tunnel; deactivate does not stop servers or unmanaged listeners; native auth requirements are unresolved; and advisory routing with force-local false cannot guarantee delegated local-only execution."
  }
}
```
