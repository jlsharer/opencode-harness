```json
{
  "orchestrationId": "2026-08-19-test-local-ai-nodes",
  "role": "planner",
  "artifactId": "correct-operator-runbook-planner-004",
  "createdAt": "2026-08-19T15:42:16Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh planner packet in synthesis mode requiring a complete corrected operator runbook based only on researcher-001, planner-002, and validator-003, with blocking tunnel, server/config rollback, and workspace pre-state defects resolved.",
    "requiredContextPresent": "yes; approved goal, scope boundaries, supplied evidence, exact deliverable, acceptance criteria, dependencies, assumptions, conflicts/decisions, role outputs, and routing metadata status were present",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Resolved validator-003's two blocking ownership defects by making the normal path require an inactive managed tunnel, documenting a separately elected preserve path for a healthy pre-existing tunnel, adding verified timestamped local and remote backups before edits, recording service pre-state and starts, restoring only this run's backups after approval, and requiring a clean exclusively used workspace with before/after evidence and non-broad recovery. Preserved the previously validated command grammar, identity, IDs, profile, checkpoint order, acknowledgment flags, and live/auth caveats. No live operation or implementation/configuration edit was performed.",
    "filesRead": [
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".memory/templates/role-trace-artifact.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md"
    ],
    "commands": [
      "date -u +%Y-%m-%dT%H:%M:%SZ",
      "python fenced-JSON/schema self-check attempted but unavailable because python was not installed",
      "python3 fenced-JSON parse, memory-trace schema validation, planner required-output check, and trace-path check: PASS"
    ]
  },
  "outputContract": {
    "outputs": "Complete corrected pre-state-aware operator runbook plus resolved decisions, file contracts, dependencies, executable verification gates, tradeoffs, open questions, and validator handoff.",
    "evidence": "Researcher-001 establishes the exact integration commands, identity, node/provider IDs, profile constraints, checkpoint sequence, approval flags, live boundaries, and auth caveat. Planner-002 supplies the previously reviewed complete runbook. Validator-003 independently passed those surfaces and supplied command-backed blocking evidence that deactivate can stop a pre-existing managed tunnel and that env/service mutations lacked concrete backup and ownership rollback gates.",
    "orderedPlanOrResolvedConclusions": [
      "The normal two-node test path requires the managed secondary tunnel to be inactive and healthy-inactive before activation. If it is active, the default is abort. A separately documented preserve election is allowed only when systemd reports active and tunnel-status succeeds; that path skips both wrapper activate and wrapper deactivate, records that the tunnel is pre-existing, and relies on run's own tunnel/health revalidation.",
      "An inactive pre-state plus a successful activate proves this run owns the managed tunnel for cleanup, provided the operator also guarantees exclusive control during the test. A failed activation is followed by state inspection; deactivate is allowed only if the previously inactive unit became active or failed during this run.",
      "Before any local or remote private env edit, create a unique timestamped owner-only backup directory, record whether each target existed, copy each existing target to mode 0600, verify owner/mode and byte equality, and abort on symlinks or unsafe metadata. Restoration uses only that run's recorded backup or absent marker and requires explicit approval.",
      "Capture main and secondary service status before edits and record each as running or stopped only after reviewing ai.sh output. Set a started-by-test marker only after a separately approved successful start. Cleanup stops only marked services; pre-existing running services are never stopped.",
      "Use a clean disposable workspace under exclusive operator control. Capture status, unstaged binary diff, and staged binary diff before the first run and after every run. Abort rather than acknowledge a dirty workspace in this safe runbook. Recovery preserves post-state evidence, restores tracked files only after approval, and never uses git clean; untracked paths are reviewed and removed individually only when proven test-owned.",
      "Retain both nodes from plan through bind: main is local, secondary is remote through josh-ai with client tunnel port 8081; providers are ai-infra-main and ai-infra-secondary. Retain harness commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3, package 0.1.10, and launcher SHA-256 c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156.",
      "Retain the unwrapped schema-2 credential-free profile, all four role overrides, emitted provider IDs only, and localRouting.forceLocalForHarnessSubagents=false. Delegated local routing remains observational, not guaranteed.",
      "Retain checkpoint order and approvals: plan; prepare-harness --yes; bind --yes; service gates; tunnel pre-state; conditional activate --yes; fully quit OpenCode; run with --ack-opencode-restarted; owned cleanup. The --ack-dirty-workspace flag remains accurately documented but is intentionally not used by this clean-workspace procedure.",
      "Native OpenCode authentication/configuration remains unresolved environment-specific external state. No credential belongs in env projection, routing profile, binding, prompt, or trace."
    ],
    "fileContractsOrDecisions": [
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env and secondary.env",
        "decision": "Current-user-owned non-symlink regular files, mode 0600. Existing bytes receive verified run-scoped backups before editing; absent files receive absent markers before creation. They contain reviewed server metadata, not example inventory."
      },
      {
        "path": "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.opencode.env and secondary.opencode.env",
        "decision": "Current-user-owned non-symlink regular files, mode 0600, backed up or marked absent before editing. Each contains a positive output limit below context and lowercase unquoted thinking boolean."
      },
      {
        "path": "josh-ai:~/ai/llama-server/config/nodes/secondary.env",
        "decision": "Remote current-user-owned non-symlink mode-0600 server env. A unique remote backup or absent marker is verified before edit. The client-only secondary.opencode.env is never copied remotely."
      },
      {
        "path": "$RUN_STATE/local-backups and josh-ai:$REMOTE_BACKUP_DIR",
        "decision": "Unique timestamped owner-only run resources. Cleanup may restore only backups whose owner/mode/byte checks passed in this run, and may remove a target only when this run recorded it absent before creating it."
      },
      {
        "path": "$ROUTING_PROFILE",
        "decision": "Absolute canonical current-user-owned non-symlink mode-0600 unwrapped schema-2 JSON, credential-free, with all role IDs limited to ai-infra-main or ai-infra-secondary and force-local false."
      },
      {
        "path": "$BINDING",
        "decision": "Exact absolute immutable mode-0600 path printed by bind. Never edit it or mix generated leaves."
      },
      {
        "path": "$RUN_STATE/workspace-pre-* and workspace-post-*",
        "decision": "Run-owned read-only evidence outside the workspace. The pre-state must be clean for this procedure. Post-state is preserved before any approved recovery; broad untracked cleanup is forbidden."
      }
    ],
    "dependencies": [
      "Supplied researcher-001 evidence, prior planner-002 runbook, and validator-003 blocking findings.",
      "Linux, Git, Node >=24 <25, exact OpenCode 1.18.18, pinned trusted harness checkout, and current integration wrapper bytes.",
      "Operator SSH and user-service access to josh-ai; machine-specific service names are not guessed beyond the evidence-backed ai.sh and managed tunnel unit interfaces.",
      "Reviewed private model/image/context/output values, a clean disposable Git workspace, exclusive control of the service/tunnel/workspace during the test, and explicit mutation/cleanup approvals.",
      "Environment-specific native OpenCode auth/config resolved externally without credentials in integration artifacts."
    ],
    "operatorRunbook": {
      "commandLegend": {
        "exactCommands": "Every command below is exact shell syntax. Shell variables are populated by preceding commands. Run all phases in one trusted Bash session so ownership markers are not lost.",
        "operatorValues": [
          "Values entered by read or editor are operator substitutions: WORKSPACE_INPUT, provider role choices, MODEL_ALIAS values, native agent name, prompts, private env values, and explicit yes/no approvals.",
          "Do not type angle-bracket metavariables; none occur in runnable command lines below.",
          "The editor and service-state classifications require the operator to inspect machine-specific content/output; the runbook aborts if ownership or state cannot be proven."
        ]
      },
      "globalRules": [
        "Run from /home/joshl/ai-infrastructure/llama-server unless a phase says otherwise. Stop at every gate; prior success is not authorization for the next mutation.",
        "Do not print private env/profile contents. Do not proceed if a target is a symlink, has an unexpected owner/mode, or cannot be classified.",
        "Keep this Bash session and RUN_STATE until final comparison and approved cleanup complete. No concurrent operator may change the selected services, managed tunnel, or workspace.",
        "The safest path is inactive tunnel plus stopped services started by this run. Preserve paths are explicit exceptions and never transfer cleanup ownership to this test."
      ],
      "phase0_identity_paths_and_run_state": {
        "safety": "offline/read-only except owner-only run-state/private/state directory creation",
        "commands": [
          "cd /home/joshl/ai-infrastructure/llama-server",
          "export AI_ROOT=/home/joshl/ai-infrastructure/llama-server",
          "export HARNESS_ROOT=/home/joshl/projects/opencode-harness",
          "export INTEGRATION=$AI_ROOT/scripts/opencode-harness-integration.sh",
          "read -r -p 'Absolute clean disposable Git workspace: ' WORKSPACE_INPUT",
          "export WORKSPACE=$(realpath -- \"$WORKSPACE_INPUT\")",
          "export PRIVATE_DIR=$HOME/.config/ai-infrastructure/opencode-harness-live-test",
          "export ROUTING_PROFILE=$PRIVATE_DIR/advisory-profile.json",
          "export PROJECTION_ROOT=$HOME/.config/opencode/ai-infrastructure",
          "export BINDINGS_DIR=$HOME/.local/state/ai-infrastructure/opencode-harness/bindings",
          "export RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)-$$",
          "export RUN_STATE=$HOME/.local/state/ai-infrastructure/opencode-harness/test-runs/$RUN_ID",
          "umask 077",
          "install -d -m 700 -- \"$PRIVATE_DIR\" \"$BINDINGS_DIR\" \"$RUN_STATE\" \"$RUN_STATE/local-backups\"",
          "test \"$(git -C \"$HARNESS_ROOT\" rev-parse HEAD)\" = c1c16cc55ca2c4787f000d01ff05ffe05734a3d3",
          "test \"$(node -p \"require('$HARNESS_ROOT/package.json').version\")\" = 0.1.10",
          "test \"$(sha256sum \"$HARNESS_ROOT/bin/opencode-harness.mjs\" | cut -d' ' -f1)\" = c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156",
          "\"$INTEGRATION\" --help",
          "node \"$HARNESS_ROOT/bin/opencode-harness.mjs\" --help",
          "test \"$(git -C \"$WORKSPACE\" rev-parse --show-toplevel)\" = \"$WORKSPACE\""
        ],
        "gate": "All identity tests exit 0; help contains plan, prepare-harness, bind, activate, run, and deactivate; workspace is exactly the intended worktree root. Otherwise stop."
      },
      "phase1_capture_workspace_baseline": {
        "safety": "read-only workspace evidence",
        "commands": [
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/workspace-pre-status.txt\"",
          "git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/workspace-pre-unstaged.patch\"",
          "git -C \"$WORKSPACE\" diff --cached --no-ext-diff --binary > \"$RUN_STATE/workspace-pre-staged.patch\"",
          "git -C \"$WORKSPACE\" diff --check",
          "test ! -s \"$RUN_STATE/workspace-pre-status.txt\"",
          "test ! -s \"$RUN_STATE/workspace-pre-unstaged.patch\"",
          "test ! -s \"$RUN_STATE/workspace-pre-staged.patch\""
        ],
        "gate": "All three evidence files are empty and diff-check passes. This procedure requires a clean disposable workspace under exclusive use. Abort on dirt; do not add --ack-dirty-workspace. That valid wrapper flag is an acknowledgment, not backup, and needs a separately designed preserve procedure."
      },
      "phase2_capture_service_prestate": {
        "safety": "live read-only service observation; separately authorize SSH/service status",
        "commands": [
          "cd \"$AI_ROOT\"",
          "./scripts/ai.sh --node main --local status; export MAIN_STATUS_RC=$?",
          "./scripts/ai.sh --node secondary --remote status; export SECONDARY_STATUS_RC=$?",
          "read -r -p 'After reviewing main status, enter exactly running or stopped: ' MAIN_SERVICE_PRESTATE",
          "read -r -p 'After reviewing secondary status, enter exactly running or stopped: ' SECONDARY_SERVICE_PRESTATE",
          "case $MAIN_SERVICE_PRESTATE in running|stopped) ;; *) false ;; esac",
          "case $SECONDARY_SERVICE_PRESTATE in running|stopped) ;; *) false ;; esac",
          "printf 'main=%s rc=%s\\nsecondary=%s rc=%s\\n' \"$MAIN_SERVICE_PRESTATE\" \"$MAIN_STATUS_RC\" \"$SECONDARY_SERVICE_PRESTATE\" \"$SECONDARY_STATUS_RC\" > \"$RUN_STATE/service-prestate.txt\"",
          "export MAIN_STARTED_BY_TEST=0 SECONDARY_STARTED_BY_TEST=0"
        ],
        "gate": "The operator can unambiguously classify both service pre-states from current output. Abort rather than guess if status is unhealthy, ambiguous, or access fails. Pre-existing running services are preserve-only and must never be stopped by this test."
      },
      "phase3_verified_local_and_remote_backups_before_edits": {
        "safety": "local and remote owner-only backup state writes; no env content is logged",
        "localCommands": [
          "backup_local() { src=$1; tag=$2; marker=\"$RUN_STATE/local-backups/$tag.state\"; test ! -L \"$src\" || return 1; if test -e \"$src\"; then test -f \"$src\"; test \"$(stat -c %U \"$src\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$src\")\" = 600; install -m 600 -- \"$src\" \"$RUN_STATE/local-backups/$tag\"; test \"$(stat -c %U \"$RUN_STATE/local-backups/$tag\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$RUN_STATE/local-backups/$tag\")\" = 600; cmp -s -- \"$src\" \"$RUN_STATE/local-backups/$tag\"; printf 'existing\\n' > \"$marker\"; else printf 'absent\\n' > \"$marker\"; fi; }",
          "backup_local \"$AI_ROOT/config/nodes/main.env\" main.env",
          "backup_local \"$AI_ROOT/config/nodes/main.opencode.env\" main.opencode.env",
          "backup_local \"$AI_ROOT/config/nodes/secondary.env\" secondary.env",
          "backup_local \"$AI_ROOT/config/nodes/secondary.opencode.env\" secondary.opencode.env",
          "stat -c '%U %a %n' \"$RUN_STATE\" \"$RUN_STATE/local-backups\" \"$RUN_STATE/local-backups\"/*"
        ],
        "remoteCommands": [
          "export REMOTE_BACKUP_DIR=~/.local/state/ai-infrastructure/opencode-harness/test-runs/$RUN_ID",
          "ssh josh-ai \"RUN_ID='$RUN_ID' bash -s\" <<'REMOTE_BACKUP'",
          "set -eu; umask 077; src=$HOME/ai/llama-server/config/nodes/secondary.env; dir=$HOME/.local/state/ai-infrastructure/opencode-harness/test-runs/$RUN_ID; mkdir -m 700 -p -- \"$dir\"; test ! -L \"$src\"; if test -e \"$src\"; then test -f \"$src\"; test \"$(stat -c %U \"$src\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$src\")\" = 600; install -m 600 -- \"$src\" \"$dir/secondary.env\"; test \"$(stat -c %U \"$dir/secondary.env\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$dir/secondary.env\")\" = 600; cmp -s -- \"$src\" \"$dir/secondary.env\"; printf 'existing\\n' > \"$dir/secondary.env.state\"; else printf 'absent\\n' > \"$dir/secondary.env.state\"; fi; stat -c '%U %a %n' \"$dir\" \"$dir\"/*",
          "REMOTE_BACKUP"
        ],
        "gate": "Every existing target has a timestamped run-local backup owned by the applicable user, mode 600, and cmp-identical; every absent target has a marker in a mode-700 unique directory. Abort before editing on any failed check. REMOTE_BACKUP_DIR is only a documented path; remote commands independently derive it from RUN_ID."
      },
      "phase4_edit_and_validate_private_inputs": {
        "safety": "approved local and remote configuration mutation after verified backups",
        "commands": [
          "cd \"$AI_ROOT\"",
          "for node in main secondary; do test -e \"config/nodes/$node.env\" || install -m 600 -- \"config/nodes/$node.env.example\" \"config/nodes/$node.env\"; test -e \"config/nodes/$node.opencode.env\" || install -m 600 -- config/nodes/opencode-projection.env.example \"config/nodes/$node.opencode.env\"; done",
          ": \"${EDITOR:?Set EDITOR to a trusted editor}\"",
          "\"$EDITOR\" config/nodes/main.env config/nodes/main.opencode.env config/nodes/secondary.env config/nodes/secondary.opencode.env",
          "chmod 600 -- config/nodes/main.env config/nodes/main.opencode.env config/nodes/secondary.env config/nodes/secondary.opencode.env",
          "ssh -t josh-ai 'cd ~/ai/llama-server || exit; if ! test -e config/nodes/secondary.env; then install -m 600 -- config/nodes/secondary.env.example config/nodes/secondary.env; fi; : \"${EDITOR:?Set EDITOR remotely}\"; \"$EDITOR\" config/nodes/secondary.env; chmod 600 -- config/nodes/secondary.env; stat -c \"%U %a %n\" config/nodes/secondary.env'",
          "stat -c '%U %a %n' config/nodes/main.env config/nodes/main.opencode.env config/nodes/secondary.env config/nodes/secondary.opencode.env"
        ],
        "reviewRequirements": [
          "Each server env uses approved digest-pinned image, absolute model directory, exact model file, live MODEL_ALIAS, host port, context, parallelism, and reviewed GPU/cache settings. Local secondary.env matches reviewed remote deployment metadata.",
          "Each client .opencode.env has a positive output limit below context and lowercase unquoted thinking boolean. Never copy secondary.opencode.env to the remote host."
        ],
        "gate": "All edited targets are current-user-owned mode-600 regular non-symlink files and private values are reviewed. Later plan is the fail-closed content check."
      },
      "phase5_create_unwrapped_profile": {
        "safety": "local state write; no endpoint contact",
        "commands": [
          "read -r -p 'Default provider ID, ai-infra-main or ai-infra-secondary: ' DEFAULT_PROVIDER_ID",
          "read -r -p 'Researcher provider ID: ' RESEARCHER_PROVIDER_ID",
          "read -r -p 'Planner provider ID: ' PLANNER_PROVIDER_ID",
          "read -r -p 'Implementer provider ID: ' IMPLEMENTER_PROVIDER_ID",
          "read -r -p 'Validator provider ID: ' VALIDATOR_PROVIDER_ID",
          "for name in DEFAULT_PROVIDER_ID RESEARCHER_PROVIDER_ID PLANNER_PROVIDER_ID IMPLEMENTER_PROVIDER_ID VALIDATOR_PROVIDER_ID; do value=${!name}; case $value in ai-infra-main|ai-infra-secondary) ;; *) false; break ;; esac; done",
          "export DEFAULT_PROVIDER_ID RESEARCHER_PROVIDER_ID PLANNER_PROVIDER_ID IMPLEMENTER_PROVIDER_ID VALIDATOR_PROVIDER_ID ROUTING_PROFILE",
          "node -e \"const fs=require('node:fs'),e=process.env,a=new Set(['ai-infra-main','ai-infra-secondary']); for(const n of ['DEFAULT_PROVIDER_ID','RESEARCHER_PROVIDER_ID','PLANNER_PROVIDER_ID','IMPLEMENTER_PROVIDER_ID','VALIDATOR_PROVIDER_ID'])if(!a.has(e[n]))throw Error(n); const p={schemaVersion:'2.0.0',defaultMode:'single-model',defaultModel:null,singleModel:{enabled:false,model:null},localRouting:{enabled:true,forceLocalForHarnessSubagents:false,defaultLocalModel:e.DEFAULT_PROVIDER_ID},roleOverrides:{researcher:{model:null,localModel:e.RESEARCHER_PROVIDER_ID,variant:'research'},planner:{model:null,localModel:e.PLANNER_PROVIDER_ID,variant:'planning'},implementer:{model:null,localModel:e.IMPLEMENTER_PROVIDER_ID,variant:null},validator:{model:null,localModel:e.VALIDATOR_PROVIDER_ID,variant:'audit'}},commandOverrides:{},orchestratorCommands:{},complexityTiers:{}}; const fd=fs.openSync(e.ROUTING_PROFILE,'wx',0o600); try{fs.writeFileSync(fd,JSON.stringify(p,null,2)+'\\n')}finally{fs.closeSync(fd)}\"",
          "stat -c '%U %a %n' \"$ROUTING_PROFILE\""
        ],
        "gate": "Profile creation exits 0 at the intended absolute path, current owner/mode 600. Abort if it already exists; review/move it separately. Never use a committed wrapped example or add credentials."
      },
      "phase6_plan_prepare_bind": {
        "safety": "plan is non-live; prepare and bind are approved local state writes; bind publishes projection/binding but contacts no node",
        "commands": [
          "cd \"$AI_ROOT\"",
          "\"$INTEGRATION\" plan --node main --node secondary --workspace \"$WORKSPACE\" --routing-profile \"$ROUTING_PROFILE\" --harness-root \"$HARNESS_ROOT\" --projection-root \"$PROJECTION_ROOT\"",
          "read -r -p 'Approve prepare-harness local cache write? enter yes: ' APPROVE_PREPARE; test \"$APPROVE_PREPARE\" = yes",
          "\"$INTEGRATION\" prepare-harness --harness-root \"$HARNESS_ROOT\" --yes",
          "read -r -p 'Approve bind projection/binding write? enter yes: ' APPROVE_BIND; test \"$APPROVE_BIND\" = yes",
          "export BIND_LOG=$RUN_STATE/bind-output.txt",
          "set -o pipefail",
          "\"$INTEGRATION\" bind --node main --node secondary --workspace \"$WORKSPACE\" --routing-profile \"$ROUTING_PROFILE\" --harness-root \"$HARNESS_ROOT\" --projection-root \"$PROJECTION_ROOT\" --bindings-dir \"$BINDINGS_DIR\" --yes | tee \"$BIND_LOG\"",
          "export BINDING=",
          "while IFS= read -r line; do case $line in 'binding: '*) BINDING=${line#binding: } ;; esac; done < \"$BIND_LOG\"",
          ": \"${BINDING:?Bind did not print a binding path}\"",
          "test -f \"$BINDING\"; test \"$(stat -c %U \"$BINDING\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$BINDING\")\" = 600"
        ],
        "gate": "Plan reports valid two-node no-files-written projection and all satisfied rows; prepare prints concrete runtime/cache path; bind prints valid compact JSON for package 0.1.10 and one absolute immutable mode-600 binding. Stop on any failure; never edit binding/current/generated leaves."
      },
      "phase7_establish_services_with_owned_start_records": {
        "safety": "live validate/status/health/models/gpu observation; each start is a separate approved mutation",
        "commands": [
          "cd \"$AI_ROOT\"",
          "./scripts/ai.sh --node main --local validate",
          "if test \"$MAIN_SERVICE_PRESTATE\" = stopped; then read -r -p 'Approve starting main for this test? enter yes: ' A; test \"$A\" = yes; ./scripts/ai.sh --node main --local start; export MAIN_STARTED_BY_TEST=1; fi",
          "./scripts/ai.sh --node main --local status && ./scripts/ai.sh --node main --local health && ./scripts/ai.sh --node main --local models && ./scripts/ai.sh --node main --local gpu",
          "./scripts/ai.sh --node secondary --remote validate",
          "if test \"$SECONDARY_SERVICE_PRESTATE\" = stopped; then read -r -p 'Approve starting secondary for this test? enter yes: ' A; test \"$A\" = yes; ./scripts/ai.sh --node secondary --remote start; export SECONDARY_STARTED_BY_TEST=1; fi",
          "./scripts/ai.sh --node secondary --remote status && ./scripts/ai.sh --node secondary --remote health && ./scripts/ai.sh --node secondary --remote models && ./scripts/ai.sh --node secondary --remote gpu",
          "printf 'main_started_by_test=%s\\nsecondary_started_by_test=%s\\n' \"$MAIN_STARTED_BY_TEST\" \"$SECONDARY_STARTED_BY_TEST\" > \"$RUN_STATE/services-started.txt\""
        ],
        "gate": "All observations succeed with reviewed model/service/GPU state. Start markers become 1 only after successful starts. If a start returns nonzero, stop and inspect status; treat a newly running service as test-owned and set its marker only after confirming that fact. Never stop a service whose pre-state was running."
      },
      "phase8_tunnel_prestate_and_exclusive_ownership_decision": {
        "safety": "live read-only managed-unit/tunnel observation",
        "commands": [
          "cd \"$AI_ROOT\"",
          "export TUNNEL_UNIT=ai-infrastructure-tunnel-secondary.service",
          "export TUNNEL_PRESTATE=$(systemctl --user is-active \"$TUNNEL_UNIT\" 2>/dev/null || true)",
          "printf '%s\\n' \"$TUNNEL_PRESTATE\" > \"$RUN_STATE/tunnel-prestate.txt\"",
          "export PRESERVE_PREEXISTING_TUNNEL=0 TUNNEL_STARTED_BY_TEST=0",
          "case $TUNNEL_PRESTATE in inactive) if ./scripts/tunnel-status.sh --node secondary; then printf '%s\\n' 'Contradictory inactive/healthy tunnel state; abort' >&2; false; fi ;; active) ./scripts/tunnel-status.sh --node secondary; read -r -p 'Tunnel pre-exists and is healthy. Default abort. Enter preserve to use without activate/deactivate: ' TUNNEL_DECISION; test \"$TUNNEL_DECISION\" = preserve; export PRESERVE_PREEXISTING_TUNNEL=1 ;; *) printf 'Tunnel state %s is unhealthy/ambiguous; abort\\n' \"$TUNNEL_PRESTATE\" >&2; false ;; esac",
          "printf 'prestate=%s\\npreserve=%s\\n' \"$TUNNEL_PRESTATE\" \"$PRESERVE_PREEXISTING_TUNNEL\" > \"$RUN_STATE/tunnel-decision.txt\""
        ],
        "gate": "Normal path: unit is inactive and tunnel-status fails as expected. Preserve exception: unit is active, tunnel-status succeeds, operator explicitly enters preserve, and this test will skip activate/deactivate. Any failed, activating, deactivating, unknown, contradictory, or unhealthy state aborts."
      },
      "phase9_conditional_activate": {
        "safety": "live managed-tunnel mutation and loopback health; skipped for preserve path",
        "commands": [
          "if test \"$PRESERVE_PREEXISTING_TUNNEL\" = 0; then read -r -p 'Approve this test starting the secondary managed tunnel and health checks? enter yes: ' A; test \"$A\" = yes; if \"$INTEGRATION\" activate --binding \"$BINDING\" --yes; then export TUNNEL_STARTED_BY_TEST=1; ./scripts/tunnel-status.sh --node secondary; else NOW=$(systemctl --user is-active \"$TUNNEL_UNIT\" 2>/dev/null || true); case $NOW in active|failed) export TUNNEL_STARTED_BY_TEST=1 ;; esac; false; fi; fi",
          "printf 'tunnel_started_by_test=%s\\n' \"$TUNNEL_STARTED_BY_TEST\" > \"$RUN_STATE/tunnel-started.txt\""
        ],
        "gate": "Normal path activate exits 0, tunnel-status succeeds, and both wrapper health checks pass; ownership marker is 1. Preserve path performs no tunnel mutation and marker remains 0. If activation fails after changing the previously inactive unit to active/failed, go directly to owned cleanup; do not run OpenCode."
      },
      "phase10_restart_auth_and_immediate_workspace_precheck": {
        "safety": "manual process/auth boundary plus read-only workspace comparison",
        "commands": [
          "printf '%s\\n' 'Fully quit every OpenCode process now.'",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/workspace-before-run-status.txt\"",
          "git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/workspace-before-run-unstaged.patch\"",
          "git -C \"$WORKSPACE\" diff --cached --no-ext-diff --binary > \"$RUN_STATE/workspace-before-run-staged.patch\"",
          "cmp -s \"$RUN_STATE/workspace-pre-status.txt\" \"$RUN_STATE/workspace-before-run-status.txt\"",
          "cmp -s \"$RUN_STATE/workspace-pre-unstaged.patch\" \"$RUN_STATE/workspace-before-run-unstaged.patch\"",
          "cmp -s \"$RUN_STATE/workspace-pre-staged.patch\" \"$RUN_STATE/workspace-before-run-staged.patch\""
        ],
        "gate": "Operator truthfully confirms all OpenCode processes quit; workspace exactly matches clean baseline; required native OpenCode auth/config is resolved externally. Abort without --ack-opencode-restarted if restart is untrue. Never add credentials to integration artifacts."
      },
      "phase11_provider_discovery_and_direct_requests": {
        "safety": "live OpenCode/provider traffic and potentially workspace-mutating",
        "commands": [
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- models ai-infra-main; export MAIN_MODELS_STATUS=$?",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/post-main-models-status.txt\"; git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/post-main-models.patch\"",
          "test \"$MAIN_MODELS_STATUS\" = 0",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- models ai-infra-secondary; export SECONDARY_MODELS_STATUS=$?",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/post-secondary-models-status.txt\"; git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/post-secondary-models.patch\"",
          "test \"$SECONDARY_MODELS_STATUS\" = 0",
          "read -r -p 'Exact main MODEL_ALIAS: ' MAIN_MODEL_ALIAS; read -r -p 'Exact secondary MODEL_ALIAS: ' SECONDARY_MODEL_ALIAS; read -r -p 'Approved native agent: ' TEST_AGENT; read -r -p 'Bounded non-secret prompt: ' TEST_PROMPT",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --format json --model \"ai-infra-main/$MAIN_MODEL_ALIAS\" --agent \"$TEST_AGENT\" \"$TEST_PROMPT\"; export MAIN_RUN_STATUS=$?",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/post-main-run-status.txt\"; git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/post-main-run.patch\"",
          "test \"$MAIN_RUN_STATUS\" = 0",
          "\"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --format json --model \"ai-infra-secondary/$SECONDARY_MODEL_ALIAS\" --agent \"$TEST_AGENT\" \"$TEST_PROMPT\"; export SECONDARY_RUN_STATUS=$?",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/post-secondary-run-status.txt\"; git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/post-secondary-run.patch\"",
          "test \"$SECONDARY_RUN_STATUS\" = 0"
        ],
        "gate": "Each status is 0; intended provider/model is visibly listed or answers; no exact native formatting/response is assumed. Inspect each saved workspace status/patch before continuing. On any failure or unexpected change, preserve evidence and proceed only to owned cleanup."
      },
      "phase12_optional_delegated_request": {
        "safety": "optional live delegated provider traffic and potentially workspace-mutating",
        "commands": [
          "read -r -p 'Run optional delegated test? enter yes or no: ' RUN_DELEGATED",
          "if test \"$RUN_DELEGATED\" = yes; then read -r -p 'Bounded non-secret delegated request: ' DELEGATED_PROMPT; \"$INTEGRATION\" run --binding \"$BINDING\" --ack-opencode-restarted -- run --agent build --command delegate-orchestration \"$DELEGATED_PROMPT\"; export DELEGATED_RUN_STATUS=$?; git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/post-delegated-status.txt\"; git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/post-delegated.patch\"; test \"$DELEGATED_RUN_STATUS\" = 0; else test \"$RUN_DELEGATED\" = no; fi"
        ],
        "gate": "If selected, status is 0, expected traces exist, and output/traces show actual role assignments. force-local remains false, so local-only behavior is not inferred."
      },
      "phase13_final_workspace_comparison_and_safe_recovery_option": {
        "safety": "read-only comparison; tracked restoration only after separate approval",
        "commands": [
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all > \"$RUN_STATE/workspace-post-status.txt\"",
          "git -C \"$WORKSPACE\" diff --no-ext-diff --binary > \"$RUN_STATE/workspace-post-unstaged.patch\"",
          "git -C \"$WORKSPACE\" diff --cached --no-ext-diff --binary > \"$RUN_STATE/workspace-post-staged.patch\"",
          "git -C \"$WORKSPACE\" diff --check",
          "diff -u \"$RUN_STATE/workspace-pre-status.txt\" \"$RUN_STATE/workspace-post-status.txt\" || true",
          "read -r -p 'If changes exist, preserve evidence and restore tracked test changes to the clean baseline? enter restore or keep: ' WORKSPACE_DECISION",
          "if test \"$WORKSPACE_DECISION\" = restore; then read -r -p 'Confirm exclusive workspace use and tracked changes are test-owned; enter yes: ' A; test \"$A\" = yes; git -C \"$WORKSPACE\" restore --staged --worktree -- .; elif test \"$WORKSPACE_DECISION\" != keep; then false; fi",
          "git -C \"$WORKSPACE\" status --porcelain=v1 --untracked-files=all"
        ],
        "gate": "Post status and both patches are retained outside the workspace before recovery. git restore is allowed only because the baseline was clean and exclusive use was required. Never run git clean. Review every untracked path and remove it individually only after proving this test created it; otherwise keep it for the owner."
      },
      "phase14_owned_cleanup_and_backup_restore": {
        "safety": "live mutation; every stop/restore requires explicit approval and applies only to run-owned state",
        "commands": [
          "cd \"$AI_ROOT\"",
          "read -r -p 'Approve cleanup of only resources marked started by this test and restoration from this run backups? enter yes: ' APPROVE_CLEANUP; test \"$APPROVE_CLEANUP\" = yes",
          "if test \"$TUNNEL_STARTED_BY_TEST\" = 1; then NOW=$(systemctl --user is-active \"$TUNNEL_UNIT\" 2>/dev/null || true); case $NOW in active|failed) \"$INTEGRATION\" deactivate --binding \"$BINDING\" --yes ;; inactive) : ;; *) printf 'Ambiguous tunnel cleanup state %s; stop without mutation\\n' \"$NOW\" >&2; false ;; esac; fi",
          "if test \"$SECONDARY_STARTED_BY_TEST\" = 1; then ./scripts/ai.sh --node secondary --remote stop; fi",
          "if test \"$MAIN_STARTED_BY_TEST\" = 1; then ./scripts/ai.sh --node main --local stop; fi",
          "restore_local() { dst=$1; tag=$2; state=$(cat \"$RUN_STATE/local-backups/$tag.state\"); case $state in existing) test -f \"$RUN_STATE/local-backups/$tag\"; test \"$(stat -c %U \"$RUN_STATE/local-backups/$tag\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$RUN_STATE/local-backups/$tag\")\" = 600; install -m 600 -- \"$RUN_STATE/local-backups/$tag\" \"$dst\"; cmp -s -- \"$RUN_STATE/local-backups/$tag\" \"$dst\" ;; absent) test -e \"$dst\" && rm -- \"$dst\" || : ;; *) return 1 ;; esac; }",
          "restore_local \"$AI_ROOT/config/nodes/main.env\" main.env; restore_local \"$AI_ROOT/config/nodes/main.opencode.env\" main.opencode.env; restore_local \"$AI_ROOT/config/nodes/secondary.env\" secondary.env; restore_local \"$AI_ROOT/config/nodes/secondary.opencode.env\" secondary.opencode.env",
          "ssh josh-ai \"RUN_ID='$RUN_ID' bash -s\" <<'REMOTE_RESTORE'",
          "set -eu; src=$HOME/.local/state/ai-infrastructure/opencode-harness/test-runs/$RUN_ID; dst=$HOME/ai/llama-server/config/nodes/secondary.env; state=$(cat \"$src/secondary.env.state\"); case $state in existing) test -f \"$src/secondary.env\"; test \"$(stat -c %U \"$src/secondary.env\")\" = \"$(id -un)\"; test \"$(stat -c %a \"$src/secondary.env\")\" = 600; install -m 600 -- \"$src/secondary.env\" \"$dst\"; cmp -s -- \"$src/secondary.env\" \"$dst\" ;; absent) test -e \"$dst\" && rm -- \"$dst\" || : ;; *) exit 1 ;; esac",
          "REMOTE_RESTORE",
          "printf 'cleanup approved and attempted at %s\\n' \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\" > \"$RUN_STATE/cleanup.txt\""
        ],
        "gate": "A pre-existing preserved tunnel is never deactivated. Only service markers equal to 1 are stopped. Restore reads only this RUN_ID's verified markers/backups and occurs after service stop. If ownership, marker, backup, or current state is ambiguous, abort that mutation and retain RUN_STATE for the owner. Do not delete backup evidence until independent acceptance and operator retention approval."
      },
      "partialFailureRules": [
        "Before bind succeeds, no binding may be used. Correct inputs, rerun plan, and create a coherent new binding; never edit/mix generated leaves.",
        "If activation fails, do not run OpenCode. Because tunnel pre-state was recorded, inspect the unit: deactivate only when it changed from inactive to active/failed during this run. Never deactivate the preserve path.",
        "If a service start fails, inspect status. Mark it started-by-test only if the previously stopped service is now running because of the attempt; cleanup never stops a pre-existing running service.",
        "On any run failure, retain status, wrapper output, workspace evidence, traces, and launcher retained path. Do not rerun until auth/provider/tunnel/workspace state is understood.",
        "On cleanup ambiguity, stop rather than guess. Backups and RUN_STATE remain evidence and a recovery source; no broad deletion is authorized.",
        "Harness rollback has no wrapper verb. A separately paired retained harness/integration and version-separated cache are required."
      ]
    },
    "verificationGates": [
      "Identity gate: exact commit/package/hash and CLI grammar pass before state changes.",
      "Workspace gate: saved pre-status, staged diff, and unstaged diff are empty; exclusive disposable use is approved; --ack-dirty-workspace is not used.",
      "Backup gate: each local/remote edit target has a unique timestamped existing/absent marker; existing backups are owner-only mode 600 and cmp-identical before edits.",
      "Service gate: pre-state is recorded as running/stopped from reviewed output; each successful test start is recorded; only test-started services are eligible for stop.",
      "Plan/prepare/bind gates: no-files-written plan, explicit prepare/bind approvals, valid package 0.1.10 JSON, and immutable absolute mode-600 binding.",
      "Tunnel gate: inactive plus failed tunnel-status for normal ownership, or active plus successful tunnel-status and explicit preserve election. All unhealthy/ambiguous states abort.",
      "Activation gate: normal path explicit --yes and owned marker after success; preserve path skips activate. Partial failure cleanup is conditioned on recorded transition from inactive.",
      "Restart/auth gate: all OpenCode processes fully quit, workspace still equals baseline, --ack-opencode-restarted truthful, external auth resolved without credential-bearing artifacts.",
      "Live test gate: discovery/direct statuses 0 with observed intended IDs/responses; optional delegation has trace-backed observed routing and no hard-local claim.",
      "Workspace close gate: final status and binary patches retained; tracked recovery requires clean baseline, exclusive use, and explicit approval; git clean is forbidden.",
      "Cleanup gate: explicit approval; only run-owned tunnel/services stopped; only RUN_ID backups/absent markers restored; preserve resources untouched; ambiguous state blocks mutation."
    ],
    "handoffNotes": "Send this corrected artifact to a fresh independent validator in review mode. Recheck fenced JSON/schema/direct planner fields; statically inspect every shell command and here-document boundary; compare wrapper/ai.sh/tunnel flags and profile shape to current bytes; verify normal and preserve tunnel branches cannot stop pre-existing state; verify backup markers precede edits; verify only successful test starts are stopped; and verify workspace recovery cannot broadly delete untracked/unrelated work. No live action is validation evidence.",
    "openQuestions": [
      "What exact private model/image/context/output values, role selections, model aliases, native agent, prompts, and response assertions are approved?",
      "Does native OpenCode require environment-specific auth/config, and has it been resolved outside credential-free artifacts?",
      "Will the operator require the safest inactive-tunnel path, or separately accept the documented healthy preserve path?",
      "Are both ai.sh status outputs sufficiently unambiguous on the actual machines to classify running/stopped without machine-specific supplemental checks?"
    ],
    "tradeoffs": [
      "Requiring a clean exclusive disposable workspace rejects the valid --ack-dirty-workspace pathway, but gives a bounded recovery contract that cannot silently overwrite pre-existing work.",
      "The healthy pre-existing tunnel preserve path avoids stopping unrelated state but skips wrapper activate's health checkpoint; wrapper run still revalidates tunnel and health before OpenCode, and prior service health checks remain mandatory.",
      "Timestamped backups and retained run state add operator steps and disk use, but make local/remote config rollback attributable to this run.",
      "Service state is classified from ai.sh output rather than guessed service-unit names; ambiguity therefore blocks rather than automates cleanup."
    ],
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md"
    ]
  },
  "handoff": {
    "nextRole": "validator",
    "limitations": "Synthesis and runbook correction only. No private input, live node, SSH, tunnel, service, provider, credential, OpenCode process, projection, binding, cache, or test workspace was contacted or changed. Exact private values, live state, auth, prompts, response quality, and successful rollback remain operator/validator evidence needs.",
    "risks": "Live behavior remains unverified. Same-UID races, concurrent operators, unmanaged listeners, ambiguous ai.sh output, provider/model quality, native auth, and machine-specific service failures can defeat assumptions; every ambiguity must abort rather than trigger cleanup."
  }
}
```
