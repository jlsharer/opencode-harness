```json
{
  "orchestrationId": "2026-08-19-live-output-and-value-sources",
  "role": "researcher",
  "artifactId": "complete-output-map-researcher-003",
  "createdAt": "2026-08-21T21:58:19Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh research packet remediating validator-002 with a complete user-oriented output map for all 132 command-array entries in corrected runbook planner-004, while preserving the accepted field-by-field value-source map. Current ai-infrastructure source/tests and the exact committed harness were authorized; private files and live systems were excluded.",
    "requiredContextPresent": "yes; taskMode research, scoped question, source constraints, freshness requirements, downstream needs, relevant paths, documentation target, and routing metadata status were supplied",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Read the prior researcher and validator artifacts, mechanically enumerated all 132 runbook command-array entries, and classified each entry's shell-visible stdout, stderr or prompt, redirected/captured destination, effective status, and diagnostic method against current wrapper, ai.sh/lib, tunnel, exporter, fixture, and pinned launcher sources. No private input or live system was accessed. The known fail-open local backup/restore and service-marker commands are described only as rejected historical semantics, not endorsed for execution.",
    "filesRead": [
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".memory/templates/role-trace-artifact.md",
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/research-output-values-researcher-001.md",
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/validator/review-output-values-validator-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md",
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/lib.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-start.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-status.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-stop.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/compose.yaml",
      "bin/opencode-harness.mjs"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/complete-output-map-researcher-003.md"
    ],
    "commands": [
      "Python fenced-JSON parse and enumeration of planner-004 commands, localCommands, and remoteCommands: exactly 132 entries",
      "date -u +%Y-%m-%dT%H:%M:%SZ",
      "Python fenced-JSON, Draft 2020-12 memory-trace schema, researcher required-output, trace-path, 15-row map, and exhaustive 1..132 partition self-check: PASS"
    ]
  },
  "outputContract": {
    "outputs": "Complete 132-entry phase/category output map, concise no-output explanation, preserved accepted value-source map, implementation implications, risks, uncertainties, and validator handoff.",
    "evidence": "The command ID ranges below are a disjoint exhaustive partition of mechanically enumerated planner-004 entries 1 through 132. Wrapper-authored literals and channels come from current source. Git, editor, SSH, Docker Compose, curl response bodies, nvidia-smi, systemd, and OpenCode output are correctly treated as native and variable. Shell-control conclusions follow the exact compounds and redirections; validator-005 independently demonstrated the three rejected fail-open forms.",
    "citedFindings": [
      {
        "finding": "Why the user may see no output: many successful shell builtins and utilities intentionally print nothing; command substitution captures stdout into a variable; `>` sends stdout to a named evidence file; `2>/dev/null` discards diagnostics; curl health bodies are redirected to `/dev/null`; exporter/publication output can be captured internally; and `tee` is the exception that both displays stdout and writes it. Silence alone proves neither success nor completion. Check the immediate status in an `if`/`else`, inspect the named file or variable, and look for stderr or a terminal prompt. Do not use a later `printf`, `export`, `|| true`, or semicolon-list's last command as the status of an earlier command.",
        "evidenceType": "direct shell/source evidence",
        "citations": [
          "planner-004:99-325",
          "opencode-harness-integration.sh:178-196,274-291,375-413",
          "validator-002:69-79,123-128"
        ]
      },
      {
        "finding": "The following output map accounts for every command-array entry. IDs are the mechanical order across phase `commands`, `localCommands`, and `remoteCommands`; heredoc body and delimiter entries are explicitly counted as parts of one shell construct rather than misrepresented as separate invocations.",
        "evidenceType": "direct mechanical extraction plus source classification",
        "citations": [
          "planner-004:99-325",
          "mechanical 132-entry extraction recorded in workPerformed.commands"
        ]
      }
    ],
    "commandOutputMap": [
      {
        "phaseAndIds": "Phase 0, IDs 1-20",
        "categories": "1 `cd`; 2-4,7-10,12 literal exports; 5 prompt; 6,11 command-substitution exports; 13 umask; 14 directory install; 15-17,20 identity/root tests; 18-19 help.",
        "stdout": "`cd`, exports, umask, successful install, and successful tests are silent. ID 5 displays a terminal prompt, not ordinary stdout. `realpath` and `date` stdout is captured into WORKSPACE/RUN_ID and not displayed. Git/node/sha256 stdout in IDs 15-17 and 20 is captured and stripped of trailing newlines. IDs 18-19 print their fixed Usage blocks to stdout.",
        "stderrOrPrompt": "The `read -p` prompt is terminal-facing; tool failures and failed command substitutions may diagnose on stderr. Help success normally has no stderr.",
        "filesOrCapture": "IDs 6 and 11 populate WORKSPACE and RUN_ID; ID 14 creates owner-only directories. No output log is created here.",
        "statusAndDiagnostic": "Ordinary success is 0. Tests return 1 on inequality. Important: `export WORKSPACE=$(realpath ...)` and the RUN_ID export report the export's status, so a substitution failure can be masked; inspect the value before use. Verify silent steps immediately, and verify help text plus status 0.",
        "citations": ["planner-004:99-123", "opencode-harness-integration.sh:13-30", "opencode-harness/bin/opencode-harness.mjs:1019-1020,1065-1074"]
      },
      {
        "phaseAndIds": "Phase 1, IDs 21-27",
        "categories": "21-23 redirected Git status/unstaged/staged evidence; 24 diff-check; 25-27 empty-file tests.",
        "stdout": "IDs 21-23 have no terminal stdout because `>` writes it to the named RUN_STATE files. ID 24 is silent when no whitespace errors exist and prints Git diagnostics to stdout when errors exist. IDs 25-27 are always silent.",
        "stderrOrPrompt": "Git operational errors go to terminal stderr because only stdout is redirected.",
        "filesOrCapture": "`workspace-pre-status.txt`, `workspace-pre-unstaged.patch`, and `workspace-pre-staged.patch`; clean state means valid empty files, not missing files.",
        "statusAndDiagnostic": "Each Git command returns its native status; each `test ! -s` returns 0 only for an existing-or-missing non-nonempty path, so also rely on the preceding successful redirection to prove file creation. Inspect status immediately and use `stat`/file review if uncertain.",
        "citations": ["planner-004:125-136"]
      },
      {
        "phaseAndIds": "Phase 2, IDs 28-36",
        "categories": "28 `cd`; 29-30 local/remote service status with captured return codes; 31-32 prompts; 33-34 input cases; 35 redirected state record; 36 marker exports.",
        "stdout": "ID 29 inherits native `docker compose ps`; ID 30 inherits SSH and remote Compose stdout. Exact rows vary. Other successful support commands are silent; ID 35 writes text only to its file.",
        "stderrOrPrompt": "Compose/SSH diagnostics are native stderr; SSH may present terminal authentication/host-key interaction because this runbook invocation does not itself force BatchMode. IDs 31-32 show terminal prompts.",
        "filesOrCapture": "MAIN_STATUS_RC and SECONDARY_STATUS_RC capture each status immediately; `service-prestate.txt` receives two fixed-key lines. Started markers are variables only.",
        "statusAndDiagnostic": "IDs 29-30 end with successful `export`, so their effective line status is normally 0 even when status failed; diagnose from the captured RC and reviewed native output. Case accepts exactly running/stopped (0), otherwise `false` (1).",
        "citations": ["planner-004:138-151", "ai.sh:32-47", "lib.sh:323-329"]
      },
      {
        "phaseAndIds": "Phase 3, IDs 37-46 — REJECTED for execution where noted",
        "categories": "37 rejected local function definition; 38-41 rejected local backup calls; 42 local stat report; 43 remote-path export; 44-46 one SSH heredoc (opener, body, delimiter).",
        "stdout": "Definition and ordinary local backup calls appear silent because marker writes are redirected and `cmp -s` is silent. ID 42 prints owner/mode/path rows. The SSH heredoc's remote final `stat` prints owner/mode/path rows to local stdout; body ID 45 and delimiter ID 46 are syntax consumed by opener ID 44, not separately executed commands.",
        "stderrOrPrompt": "Install/stat/SSH failures diagnose on stderr; SSH can prompt via terminal. The remote body uses `set -eu`, but the local function does not.",
        "filesOrCapture": "Local backups and `.state` markers under RUN_STATE; remote backup and marker under the RUN_ID directory. REMOTE_BACKUP_DIR is a variable only.",
        "statusAndDiagnostic": "REJECT IDs 37-41: failed local prerequisite tests can be masked by later semicolon commands and the function can return 0 after writing `existing`; validator reproduced this. Do not execute or trust their silence/status. The remote heredoc is fail-closed under `set -eu` and SSH returns the remote status; inspect remote stat rows. IDs 44-46 together have one effective SSH status.",
        "citations": ["planner-004:153-169", "validator-005:66-70,88-96,104-118"]
      },
      {
        "phaseAndIds": "Phase 4, IDs 47-53",
        "categories": "47 `cd`; 48 conditional example-file creation loop; 49 EDITOR requirement; 50 local editor; 51 chmod; 52 interactive remote edit compound; 53 local stat report.",
        "stdout": "Creation, parameter check, and chmod are normally silent. Editors own the terminal and have implementation-dependent UI/output. IDs 52-53 print fixed-format owner/mode/path rows after editing; remote editor output is native terminal output.",
        "stderrOrPrompt": "Editor, install, chmod, stat, and SSH diagnostics use native stderr; `ssh -t` allocates a terminal and may prompt.",
        "filesOrCapture": "May create/edit four local private files and one remote env; no transcript is redirected.",
        "statusAndDiagnostic": "Native status applies. Because the top-level session has no declared errexit and ID 48 is a semicolon loop, earlier failure can be hidden by a later successful iteration/command; review every target with ID 53. ID 52's final stat normally determines the remote compound status but preceding commands include explicit guards only in some positions.",
        "citations": ["planner-004:171-186"]
      },
      {
        "phaseAndIds": "Phase 5, IDs 54-62",
        "categories": "54-58 provider prompts; 59 allowlist loop; 60 exports; 61 Node profile generation; 62 stat.",
        "stdout": "Prompts are terminal-facing; validation/export and successful Node generation are silent. ID 61 writes JSON to the profile file, not stdout. ID 62 prints owner/mode/path.",
        "stderrOrPrompt": "Five read prompts; invalid Node input or existing `wx` destination produces a Node diagnostic/stack on stderr.",
        "filesOrCapture": "ID 61 atomically opens the exact ROUTING_PROFILE leaf with `wx`, mode 0600, and writes pretty JSON plus newline.",
        "statusAndDiagnostic": "Reads and allowlist loop must be 0; invalid selection makes ID 59 nonzero. Node exits 0 only after write/close; existing file is nonzero. Verify ID 62 and later plan, not silence alone.",
        "citations": ["planner-004:188-201", "opencode-harness-integration.sh:161-175"]
      },
      {
        "phaseAndIds": "Phase 6, IDs 63-74",
        "categories": "63 `cd`; 64 plan; 65/67 approval prompt+test; 66 prepare; 68/71 exports; 69 pipefail; 70 bind through tee; 72 log parser; 73 required-value check; 74 binding tests.",
        "stdout": "Plan prints the checkpoint table; its exporter dry-run lines are on stderr. Prepare prints exactly one runtime path. Bind stdout prints checkpoint rows, validation JSON, and `binding: <path>`; tee duplicates all bind stdout into BIND_LOG. IDs 63,65,67-69,71-74 are ordinarily silent.",
        "stderrOrPrompt": "Approval prompts are terminal-facing. Bind/exporter dry-run lines and all diagnostics remain on terminal stderr because only stdout is piped to tee; publication's captured three path lines are not replayed on success.",
        "filesOrCapture": "BIND_LOG=`$RUN_STATE/bind-output.txt`; BINDING is parsed from its one `binding: ` line. Prepare/cache, projection, and immutable binding are state writes.",
        "statusAndDiagnostic": "Plan/prepare success 0. With pipefail, ID 70 fails if bind or tee fails. ID 72 is normally silent and status 0; ID 73 fails if empty. ID 74 is a semicolon list whose effective status is only the final mode test, so earlier file/owner failures can be masked—review all checks separately. Plan exact output and bind exact literals are source-fixed as detailed in researcher-001.",
        "citations": ["planner-004:203-220", "opencode-harness-integration.sh:274-301,372-373", "export-opencode-projection.sh:341-345,580-582", "opencode-harness/bin/opencode-harness.mjs:395-432,1065-1074"]
      },
      {
        "phaseAndIds": "Phase 7, IDs 75-82 — service-marker starts REJECTED",
        "categories": "75 `cd`; 76/79 validate; 77/80 rejected conditional starts/markers; 78/81 status-health-models-GPU chains; 82 redirected marker record.",
        "stdout": "Validate has no stdout and prints exactly `configuration preflight valid` to stderr. Starts and status inherit Docker/SSH output. Health and models print native endpoint bodies to stdout (health is not redirected here); GPU prints native nvidia-smi output. ID 82 writes only to file.",
        "stderrOrPrompt": "Start approval prompts are terminal-facing. Validate literal and Docker/curl/GPU/SSH diagnostics use stderr. Curl is `--silent --show-error`: no progress meter, response body on stdout, errors on stderr.",
        "filesOrCapture": "`services-started.txt` receives two marker lines.",
        "statusAndDiagnostic": "The `&&` chains stop at first failure and return that status. REJECT IDs 77/80: a failed start is followed by `export ...=1`, so the compound can return 0 and falsely claim ownership; validator reproduced it. Do not execute or trust these markers. Exact native output is environment-dependent.",
        "citations": ["planner-004:221-233", "ai.sh:39-54", "lib.sh:297-329", "validator-005:72-75,94-96,106-118"]
      },
      {
        "phaseAndIds": "Phase 8, IDs 83-89",
        "categories": "83 `cd`; 84/87 exports; 85 captured systemd pre-state; 86/89 redirected records; 88 tunnel-state case with optional prompt.",
        "stdout": "ID 85 captures systemctl stdout, so terminal is silent; stderr is discarded and `|| true` forces substitution success. In inactive path, tunnel-status prints exactly `stopped: secondary` to stdout and returns 1, which the `if` treats as expected. Active healthy path prints exactly `running: secondary (127.0.0.1:8081)` then prompts. Record writes are not displayed.",
        "stderrOrPrompt": "Systemctl diagnostics are discarded by `2>/dev/null`. Failed/unhealthy tunnel status prints inspect/error diagnostics to stderr. Contradictory/ambiguous branches print explicit abort messages to stderr. Preserve decision is a terminal prompt.",
        "filesOrCapture": "TUNNEL_PRESTATE variable, `tunnel-prestate.txt`, and `tunnel-decision.txt`.",
        "statusAndDiagnostic": "ID 85's line status is normally 0 regardless of systemctl failure; diagnose from the captured value. Inactive expected status is 1 plus exact stopped text, not arbitrary nonzero. Active preserve requires tunnel status 0 and exact input. Other states return nonzero through `false`.",
        "citations": ["planner-004:235-246", "tunnel.sh:71-78,173-183"]
      },
      {
        "phaseAndIds": "Phase 9, IDs 90-91",
        "categories": "90 conditional approval/activate/status/ownership; 91 redirected marker record.",
        "stdout": "Preserve path is silent. Normal successful activate prints tunnel status once inside the wrapper and ID 90 calls tunnel-status again, so `running: secondary (127.0.0.1:8081)` appears twice; health checks are silent due to `/dev/null`. ID 91 writes only to file.",
        "stderrOrPrompt": "Approval prompt is terminal-facing. Tunnel start prints `tunnel started: ...` or `tunnel already running ...` to stderr. Health failure emits curl diagnostic plus `service unavailable; separately authorize: ...` to stderr.",
        "filesOrCapture": "TUNNEL_STARTED_BY_TEST variable and `tunnel-started.txt`.",
        "statusAndDiagnostic": "Success 0 with marker 1 and two healthy status lines. Activate failure enters state capture; systemctl stderr is discarded, active/failed may set marker, and explicit `false` makes the compound nonzero. Preserve path returns 0 without activation. Inspect state because partial tunnel activation can remain.",
        "citations": ["planner-004:248-254", "opencode-harness-integration.sh:394-405", "tunnel.sh:134-159"]
      },
      {
        "phaseAndIds": "Phase 10, IDs 92-98",
        "categories": "92 manual notice; 93-95 redirected immediate workspace evidence; 96-98 silent comparisons.",
        "stdout": "ID 92 prints exactly `Fully quit every OpenCode process now.`. Git stdout goes only to three RUN_STATE files. Successful `cmp -s` is silent.",
        "stderrOrPrompt": "Git/cmp operational diagnostics may use stderr; there is no machine-verifiable restart prompt or auth output.",
        "filesOrCapture": "`workspace-before-run-status.txt`, `workspace-before-run-unstaged.patch`, and `workspace-before-run-staged.patch`.",
        "statusAndDiagnostic": "Git and equal comparisons return 0; differing cmp returns 1, operational error >1. Silence requires immediate status review. The printed notice is not proof that restart/auth happened.",
        "citations": ["planner-004:256-267"]
      },
      {
        "phaseAndIds": "Phase 11, IDs 99-111",
        "categories": "99/102 discovery runs with captured statuses; 100/103/107/110 redirected evidence pairs; 101/104/108/111 status tests; 105 four prompts; 106/109 direct JSON runs with captured statuses.",
        "stdout": "Each wrapper run first prints remote tunnel status, then `workspace pre-state:`, native Git rows, native OpenCode discovery/JSON output, `workspace post-state:`, post rows, and native Git diff. Exact OpenCode/model bytes are not fixed. Evidence-pair stdout is redirected to named files. Prompts are terminal-facing.",
        "stderrOrPrompt": "OpenCode/provider/SSH/curl/harness diagnostics are inherited stderr; curl health success is silent. Four operator prompts collect aliases, agent, and prompt.",
        "filesOrCapture": "MAIN/SECONDARY_MODELS_STATUS and MAIN/SECONDARY_RUN_STATUS variables; four status files and four binary patch files under RUN_STATE.",
        "statusAndDiagnostic": "The wrapper returns the OpenCode child status after post-state output. IDs 99/102/106/109 then run `export`, making each line effectively 0 while preserving the child RC in its variable; following tests are the real checks. Each evidence pair's effective status is only its second Git diff. Validate status 0, observed intended IDs, and saved workspace evidence; no phrase proves response quality or local-only routing.",
        "citations": ["planner-004:269-286", "opencode-harness-integration.sh:375-392", "opencode-harness/bin/opencode-harness.mjs:1030-1062"]
      },
      {
        "phaseAndIds": "Phase 12, IDs 112-113",
        "categories": "112 yes/no prompt; 113 optional compound containing prompt, delegated run, captured status, redirected evidence, and final status/input test.",
        "stdout": "No branch prints wrapper output when `no`. The `yes` branch has the same wrapper framing as Phase 11 plus variable native OpenCode/orchestration output; Git evidence stdout goes to `post-delegated-status.txt` and `post-delegated.patch`.",
        "stderrOrPrompt": "One selection prompt and, on yes, one delegated-request prompt; native diagnostics inherited.",
        "filesOrCapture": "DELEGATED_RUN_STATUS and two RUN_STATE evidence files; successful managed delegation may create trace artifacts elsewhere.",
        "statusAndDiagnostic": "Yes branch's final test returns 0 only if captured child status was 0; no branch returns 0 only for exact `no`; other input is nonzero. force-local is false, so inspect traces/output for actual role/model routing rather than infer it.",
        "citations": ["planner-004:288-294", "opencode-harness-integration.sh:375-392"]
      },
      {
        "phaseAndIds": "Phase 13, IDs 114-121",
        "categories": "114-116 redirected final evidence; 117 diff-check; 118 displayed diff forced successful; 119 decision prompt; 120 conditional tracked restore; 121 final displayed status.",
        "stdout": "Final Git evidence goes to three files. Diff-check is silent when clean. `diff -u` writes differences to stdout, nothing when equal; `|| true` forces effective status 0. Restore success is ordinarily silent. ID 121 prints current porcelain rows, or nothing when clean.",
        "stderrOrPrompt": "Git/diff errors use native stderr. Restore/keep and confirmation prompts are terminal-facing.",
        "filesOrCapture": "`workspace-post-status.txt`, `workspace-post-unstaged.patch`, and `workspace-post-staged.patch` are retained before recovery.",
        "statusAndDiagnostic": "IDs 114-117 native status. Never use ID 118 status to infer equality because `|| true` always yields 0; inspect displayed diff/files. ID 120 is 0 for approved successful restore or exact keep, nonzero otherwise. ID 121 status/output is final observed state, not proof untracked paths are test-owned.",
        "citations": ["planner-004:296-308"]
      },
      {
        "phaseAndIds": "Phase 14, IDs 122-132 — local restore REJECTED",
        "categories": "122 `cd`; 123 cleanup prompt+test; 124 conditional tunnel cleanup; 125-126 conditional service stops; 127 rejected restore function; 128 rejected restore calls; 129-131 one remote restore heredoc; 132 redirected timestamp marker.",
        "stdout": "Prompt is terminal-facing. Deactivate normally prints `stopped: secondary`, then `managed tunnel inactive: secondary (unmanaged listeners not inspected)` to stdout, with tunnel stop note on stderr; already-inactive branch is silent. Service stop inherits Docker/SSH output. Local and remote restore success is generally silent because marker reads are captured, install/rm are silent, and cmp uses `-s`. Heredoc body/delimiter are syntax, not separate commands. ID 132 writes only to cleanup.txt.",
        "stderrOrPrompt": "Ambiguous tunnel branch prints its fixed abort line to stderr. Tunnel, Docker, SSH, install/rm/stat/cat errors use stderr; SSH may prompt.",
        "filesOrCapture": "Restored/removed env targets; remote state variable from captured `cat`; `cleanup.txt` contains `cleanup approved and attempted at <UTC timestamp>`.",
        "statusAndDiagnostic": "REJECT IDs 127-128: local prerequisite failures can be masked and four calls separated by semicolons expose only the last call's status; validator proved unsafe backup restoration can return 0. Do not execute or trust. IDs 129-131 form one SSH command; remote `set -eu` is fail-closed and SSH returns its status. ID 132 says only attempted, and if the operator continued after prior top-level failures its 0 status can mask no earlier result. Deactivate itself treats any tunnel-status nonzero as inactive, so inspect failed units separately.",
        "citations": ["planner-004:310-325", "validator-005:66-70,88-96,104-118", "opencode-harness-integration.sh:406-413", "tunnel.sh:160-183"]
      }
    ],
    "coverageProof": {
      "entryCount": 132,
      "partition": "1-20, 21-27, 28-36, 37-46, 47-53, 54-62, 63-74, 75-82, 83-89, 90-91, 92-98, 99-111, 112-113, 114-121, 122-132",
      "heredocAccounting": "44 opener + 45 body + 46 delimiter are one remote backup construct; 129 opener + 130 body + 131 delimiter are one remote restore construct.",
      "rejectedEntries": "37-41 local backup definition/calls, 77/80 service-start marker compounds, and 127-128 local restore definition/calls are described but explicitly rejected for execution. Their observed effective-status behavior is retained because it explains misleading silence/success."
    },
    "valueSourceMap": [
      {
        "surface": "Registry identity, execution, SSH routing, tunnel ports, and provider IDs",
        "valuesAndSource": "Committed nodes.tsv authoritatively makes `main` local and `secondary` remote through SSH alias `josh-ai`, deployed root `~/ai/llama-server`, client port 8081, and remote/server port 8080. Provider IDs derive mechanically as `ai-infra-main` and `ai-infra-secondary`; overlays/env paths come from the selected registry row. No raw hostname belongs in profile/binding/run values; actual HostName remains external SSH configuration.",
        "classification": "authoritative committed registry plus deterministic derivation",
        "citations": ["nodes.tsv:1-3", "lib.sh:28-56", "export-opencode-projection.sh:114-141,312-330"]
      },
      {
        "surface": "Private server env identity fields",
        "valuesAndSource": "COMPOSE_PROJECT_NAME is an operator deployment choice constrained by the validator. LLAMA_IMAGE is an independently approved exact tag plus sha256 digest. MODEL_DIR is the actual existing canonical host directory; MODEL_FILE is the exact readable safe GGUF basename; MODEL_ALIAS is the operator-approved served ID cross-checked with live `/v1/models`; HOST_PORT is an operator choice, with secondary required to equal registry remote port 8080 while clients use 8081. Public examples are placeholders, not inventory.",
        "classification": "reviewed operator decisions constrained by private/live inventory and registry",
        "citations": ["lib.sh:75-117,126-136", "export-opencode-projection.sh:143-205"]
      },
      {
        "surface": "Context, parallelism, cache, GPU, and optional tuning",
        "valuesAndSource": "LLAMA_ARG_CTX_SIZE is a required positive operator choice bounded by exact model metadata and tested hardware; it is not inferred from filename. LLAMA_ARG_N_PARALLEL defaults to 1 but should be explicit for this workflow and becomes maxInFlight. Cache K/V, flash attention, GPU layers/split/tensor/main GPU, endpoint metrics, THREADS, BATCH_SIZE, and UBATCH_SIZE are operator tuning decisions supported by the pinned image and observed topology. Compose defaults are implementation behavior, not hardware recommendations; nvidia-smi does not establish Docker GPU ordinal mapping.",
        "classification": "operator tuning informed by model/image/hardware evidence; deliberate defaults only",
        "citations": ["compose.yaml:14-38", "lib.sh:75-104,149-302", "export-opencode-projection.sh:164-205"]
      },
      {
        "surface": "Client-only main.opencode.env and secondary.opencode.env",
        "valuesAndSource": "Each owner-mode-0600 file contains exactly one positive OPENCODE_MODEL_OUTPUT_LIMIT strictly below that node's context and one lowercase true/false OPENCODE_MODEL_ENABLE_THINKING. There is no output default. These are operator decisions, never server files. Exporter `--print bundle` is the exact non-live rendered-value report; dry-run validates but does not reveal the rendered values.",
        "classification": "explicit operator decisions verified by exporter",
        "citations": ["export-opencode-projection.sh:169-205,303-345"]
      },
      {
        "surface": "Unwrapped routing profile",
        "valuesAndSource": "Schema/source fixes an absolute canonical owner-mode-0600 unwrapped object, schemaVersion 2.0.0, all nine top-level keys, all four role overrides, and forceLocalForHarnessSubagents false. The described defaultMode/singleModel/localRouting choices and each default/role local model (`ai-infra-main` or `ai-infra-secondary`) are operator policy. Native model/variant values are explicit supported selections. Empty override maps are conservative choices, not universal requirements; catalog models stay in the separate catalog.",
        "classification": "schema literals plus explicit operator routing policy",
        "citations": ["opencode-harness-integration.sh:161-175,278-283", "opencode-harness/bin/opencode-harness.mjs:734-783"]
      },
      {
        "surface": "Workspace, roots, harness, executable, binding, and aliases",
        "valuesAndSource": "WORKSPACE is an operator-selected absolute canonical current-user Git root, preferably clean/disposable/exclusive. HARNESS_ROOT is the trusted exact c1c16cc55ca2c4787f000d01ff05ffe05734a3d3 checkout; package 0.1.10 and launcher digest c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156 are fixed. Projection/cache/profile/bindings roots are operator paths subject to source defaults and trust checks. BINDING comes only from bind's printed line. Actual aliases come from reviewed private env/live models. The launcher selects one trusted OpenCode executable and requires exact 1.18.18.",
        "classification": "operator path decisions plus pinned identity and generated command outputs",
        "citations": ["opencode-harness-integration.sh:53-125,152-159,267-301,372-373", "opencode-harness/bin/opencode-harness.mjs:395-405,440-446,963-987,1046-1055"]
      },
      {
        "surface": "Live model, agent, prompts, routing observation, and auth",
        "valuesAndSource": "Discovery uses deterministic `ai-infra-<slug>`; direct model is `ai-infra-<slug>/<exact MODEL_ALIAS>`. Native agent and bounded non-secret prompts are explicit operator choices with predeclared success criteria. Optional managed delegation intentionally uses observed primary agent `build` and command `delegate-orchestration`. Authentication is external native OpenCode state and never an env/profile/binding/prompt value. No authorized source supplies an exact credential-free auth-status command. force-local is false, so delegated local-only behavior requires observed trace/routing evidence and cannot be assumed.",
        "classification": "derived provider prefix plus operator choices and unresolved external native state",
        "citations": ["planner-004:269-294", "opencode-harness-integration.sh:380-392", "opencode-harness/bin/opencode-harness.mjs:1030-1062"]
      }
    ],
    "sourceList": [
      "Planner-004 exact 132-entry command arrays and validator-005's independently reproduced unsafe shell semantics",
      "Prior researcher-001 accepted primary output/value map and validator-002 remediation requirements",
      "Current ai-infrastructure integration wrapper, ai.sh/lib, tunnel wrappers/core, exporter, registry, Compose, and offline integration fixture",
      "Committed harness launcher pinned by the wrapper to c1c16cc55ca2c4787f000d01ff05ffe05734a3d3 / package 0.1.10 / OpenCode 1.18.18"
    ],
    "implementationImplications": [
      "Use the phase/ID matrix as the operator-facing expectation table; retain separate terminal stdout, stderr/prompt, output destination, status, and diagnostic columns.",
      "Lead with the concise no-output explanation and name every RUN_STATE destination, captured status variable, `/dev/null` redirection, command substitution, and tee behavior.",
      "Preserve exact literals only for source-authored lines. Label Docker, curl response body, GPU, SSH, editor, Git content, OpenCode, and model output as native/variable.",
      "Do not convert the rejected backup/restore/service-marker entries into runnable guidance. A planner must replace them with independently validated fail-closed commands before any runbook can be accepted.",
      "When showing status diagnostics, prefer `if COMMAND; then ...; else rc=$?; ...; fi`; never append an unconditional print/export or use `|| true` when the underlying status is evidence."
    ],
    "risks": [
      "Planner-004 remains unsafe to execute: local backup/restore and service-start ownership commands are independently proven fail-open.",
      "Several additional semicolon compounds expose only their final command's status; this map describes that behavior but does not validate the runbook or repair it.",
      "Current ai-infrastructure integration bytes are uncommitted worktree content. Native tool output can vary by Docker, driver, SSH, systemd, llama.cpp, and OpenCode versions/state.",
      "No private values or live outputs were read; image/model/path/alias/context/tuning, auth, service/tunnel state, model quality, routing, and recovery success remain unknown.",
      "Redirected evidence can be empty on valid clean success, while discarded stderr or a masked compound status can also make failure look quiet. File existence, immediate status, and expected content must be checked together."
    ],
    "unresolvedQuestions": [
      "What corrected fail-closed local backup/restore, service ownership, and unique run-directory commands will replace the rejected historical entries?",
      "What exact approved private image/model/context/output/tuning/alias values, native agent, prompts, and response assertions will be used?",
      "What approved native auth diagnostic and live service/tunnel evidence will be used without exposing secrets?"
    ],
    "recommendedNextRole": "validator",
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/complete-output-map-researcher-003.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/complete-output-map-researcher-003.md",
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/research-output-values-researcher-001.md",
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/validator/review-output-values-validator-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md"
    ]
  },
  "handoff": {
    "nextRole": "validator",
    "limitations": "Research only. No final plan, implementation edit, acceptance validation, private-input read, or live node/SSH/tunnel/service/provider/OpenCode/cache/projection/binding action was performed. The output map is static semantics for current bytes, not authorization to execute planner-004.",
    "risks": "Independent validation must mechanically confirm the 132-entry partition, quoted literals/channels, schema/direct-output contract, and preservation of the accepted value map. The rejected historical commands remain blockers to any executable runbook."
  }
}
```
