```json
{
  "orchestrationId": "2026-08-19-live-output-and-value-sources",
  "role": "researcher",
  "artifactId": "research-output-values-researcher-001",
  "createdAt": "2026-08-21T21:49:38Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh research packet asking for the expected stdout, stderr, silence, and exit status of every command in the previously described real-node sequence, plus an authoritative-source/operator-decision map for all server, projection, profile, path, and live-run values. Sources were restricted to current ai-infrastructure implementation bytes and committed harness c1c16cc55ca2c4787f000d01ff05ffe05734a3d3; private files and live services were excluded.",
    "requiredContextPresent": "yes; taskMode research, scoped question, source constraints, freshness requirements, downstream needs, relevant paths, documentation target, and routing metadata status were supplied",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Read current wrapper, ai.sh/lib/tunnel/exporter, Compose, registry, examples, schemas, tests, docs, the prior real-node sequence and its review, and the exact pinned harness launcher/schema/docs. Ran only non-live identity and help commands. No ignored private input, credential, node, SSH target, Docker service, tunnel, provider, OpenCode child, cache preparation, projection publication, binding creation, or acceptance validation was accessed.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/lib.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-status.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example",
      "/home/joshl/ai-infrastructure/llama-server/compose.yaml",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/tests/safety-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/tests/tunnel-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/README.md",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-projection.md",
      "/home/joshl/ai-infrastructure/llama-server/docs/operations.md",
      "/home/joshl/ai-infrastructure/llama-server/docs/adding-a-node.md",
      "/home/joshl/ai-infrastructure/llama-server/schemas/opencode-harness-binding.schema.json",
      "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs",
      "/home/joshl/projects/opencode-harness/README.md",
      "/home/joshl/projects/opencode-harness/package.json",
      "/home/joshl/projects/opencode-harness/.opencode/schemas/harness-routing-profile.schema.json",
      "/home/joshl/projects/opencode-harness/.memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      "/home/joshl/projects/opencode-harness/.memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/research-output-values-researcher-001.md"
    ],
    "commands": [
      "git rev-parse HEAD; node -p package version; sha256sum bin/opencode-harness.mjs; node bin/opencode-harness.mjs --help (harness checkout)",
      "./scripts/opencode-harness-integration.sh --help; ./scripts/ai.sh --help (ai-infrastructure checkout)",
      "git status --short and git rev-parse HEAD in both checkouts",
      "Python fenced-JSON parse, Draft 2020-12 memory-trace schema, researcher required-output, and trace-path self-check: PASS"
    ]
  },
  "outputContract": {
    "outputs": "Cited command-output/channel matrix, silent-success and exit-status guidance, field-by-field value provenance, implementation implications, risks, uncertainty, and validator handoff.",
    "evidence": "Direct source fixes wrapper-authored literals and channels. Docker Compose, curl response bodies, nvidia-smi, SSH, and OpenCode are inherited native output, so their exact live bytes cannot be specified without forbidden live contact. Current offline identity commands independently returned the pinned commit, package 0.1.10, launcher digest, and documented help grammar.",
    "citedFindings": [
      {
        "finding": "The identity is exact and current: harness commit c1c16cc55ca2c4787f000d01ff05ffe05734a3d3, package 0.1.10, launcher SHA-256 c46dcdaddb601fff22a0fb0b8c99d0ca08d76dee856df31c4ee8514b7b234156. The three equality tests in the prior sequence are intentionally silent on success; git/node/sha256 command substitutions can emit diagnostics only if they themselves fail. The two help commands print their Usage blocks to stdout and exit 0. The workspace-root equality test is also silent on success.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:8-10,106-125", "opencode-harness/bin/opencode-harness.mjs:1019-1020,1065-1074", "opencode-harness/package.json:1-4", "prior planner artifact 004:99-123", "non-live commands recorded in workPerformed.commands"]
      },
      {
        "finding": "Shell builtins test, cmp -s, assignments, export, chmod, install, and successful redirections normally print nothing. Silence is not proof unless the exit status is checked. In an errexit shell, inspect a possibly failing command inside if: `if COMMAND; then printf 'PASS\\n'; else rc=$?; printf 'FAIL rc=%s\\n' \"$rc\" >&2; fi`; capture `$?` immediately in the else branch. For an expected nonzero such as inactive tunnel status, use an if/else and require the expected text/state; do not append an unconditional echo/printf and then mistake its zero status for the tested command's status.",
        "evidenceType": "direct shell semantics plus implementation implication",
        "citations": ["prior planner artifact 004:116-134,243-246,263-265,272-284", "prior validator artifact 005:66-76,94-96"]
      },
      {
        "finding": "For a two-node plan, stderr contains exactly `projection valid for 2 selected node(s); no files written` and `projection destination: <PROJECTION_ROOT>`. Stdout then contains the tab-separated header and rows: checkpoint/status/detail; nodes satisfied `2 registry node(s)`; workspace satisfied `<WORKSPACE>`; profile satisfied `owner-only schema-2 policy; force-local false`; harness satisfied with the exact commit/package/digest; projection satisfied `<PROJECTION_ROOT> (dry-run; no publication)`; and `next approval-required prepare-harness --yes, then bind --yes`. Exit is 0. A private-input, trust, pin, schema, or workspace failure instead emits an `error: ...` line to stderr and exits nonzero, generally 1 (argument grammar failures explicitly use 2).",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/export-opencode-projection.sh:341-345", "llama-server/scripts/opencode-harness-integration.sh:12,274-290"]
      },
      {
        "finding": "prepare-harness emits no wrapper status. On success the exec'd launcher prints exactly one runtime-directory path to stdout and exits 0: `<CACHE_ROOT>/0.1.10/opencode-1.18.18/runtime`, where the default cache root is `${XDG_CACHE_HOME:-$HOME/.cache}/opencode-harness`; rerunning against a valid cache prints the same path. Stderr is empty on ordinary success. Drift/trust/collision errors are one launcher error line on stderr and exit 1. The wrapper preserves the launcher status because it uses exec.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:267-273", "opencode-harness/bin/opencode-harness.mjs:395-432,1065-1074", "opencode-harness/README.md:154-158"]
      },
      {
        "finding": "For two-node bind, the same two exporter dry-run lines appear on stderr first. Stdout prints the same satisfied table as plan but no `next` row. Successful publication's three exporter path lines are captured internally and are not replayed. Success then prints exactly `validation JSON: {\"inputs\":{\"providerConfig\":true,\"routingCatalog\":true,\"routingProfile\":true},\"packageVersion\":\"0.1.10\",\"schemaVersion\":\"1.0.0\",\"valid\":true}` and `binding: <ABSOLUTE_BINDING_PATH>`, then exits 0. The binding line—not `current`—is the value to retain.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:274-296,301-374", "llama-server/tests/opencode-harness-integration-validation.sh:171-177"]
      },
      {
        "finding": "`ai.sh validate` prints exactly `configuration preflight valid` to stderr and no stdout on success, then exits 0. `status` directly inherits `docker compose ps` stdout/stderr and status; formatting, container rows, and whether an absent service is shown are Docker Compose-version/runtime dependent. `start` directly inherits `docker compose up -d` progress/output and status; there is no custom success line. Remote mode execs SSH and preserves the remote command's output/status.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/ai.sh:32-54", "llama-server/scripts/lib.sh:22-24,297-329", "llama-server/tests/safety-validation.sh:253-285", "llama-server/docs/operations.md:9-17"]
      },
      {
        "finding": "`ai.sh health` writes the endpoint's native `/health` response body to stdout because curl output is not redirected; `ai.sh models` likewise writes native `/v1/models` JSON to stdout. Neither response body is fixed by repository code, so even `health` must not be documented as a promised literal. Curl diagnostics go to stderr and failure is nonzero. `ai.sh gpu` directly inherits `nvidia-smi` output/status, which is hardware/driver dependent. For remote mode all three outputs originate on the selected SSH target.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/ai.sh:45-47", "llama-server/scripts/lib.sh:323-329", "llama-server/README.md:178-189"]
      },
      {
        "finding": "`tunnel-status.sh --node secondary` has three relevant outcomes. Healthy: stdout exactly `running: secondary (127.0.0.1:8081)` and exit 0. Inactive: stdout exactly `stopped: secondary` and exit 1; this nonzero is intentionally expected by the normal pre-state/cleanup checks. Failed or active-unhealthy: an `inspect: journalctl --user -u ai-infrastructure-tunnel-secondary.service` hint and `error: ...` appear on stderr with exit 1. Therefore exit 1 alone cannot distinguish cleanly stopped from failed/unhealthy; require the clean stopped text plus separately reviewed systemd state where ownership matters.",
        "evidenceType": "direct",
        "citations": ["llama-server/config/nodes/nodes.tsv:1-3", "llama-server/scripts/tunnel.sh:71-78,173-183", "llama-server/tests/tunnel-validation.sh:193-205", "prior planner artifact 004:235-246"]
      },
      {
        "finding": "A successful two-node activate has no generic wrapper success line. Main health is silent because its curl body is redirected. Secondary tunnel start writes either `tunnel started: 127.0.0.1:8081 -> secondary:8080` or `tunnel already running for secondary` to stderr, then tunnel status writes `running: secondary (127.0.0.1:8081)` to stdout; secondary health is also silent. Thus silence after only the tunnel lines is normal. On health failure, curl writes its native error and the wrapper writes `service unavailable; separately authorize: <AI_ROOT>/scripts/ai.sh --node <slug> --local|--remote start` to stderr, then exits 1. Partial tunnel activation can remain.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:394-405", "llama-server/scripts/tunnel.sh:134-159", "llama-server/tests/opencode-harness-integration-validation.sh:213-216"]
      },
      {
        "finding": "Every integration `run` first prints healthy remote tunnel status (`running: secondary (127.0.0.1:8081)`) and performs a silent remote health curl. It then prints `workspace pre-state:` followed by native `git status --short` rows (no rows when clean), inherits all native OpenCode stdout/stderr, then prints `workspace post-state:`, post-status rows, and native `git diff --` output. Post-state/diff are printed even when the OpenCode child exits nonzero, and the wrapper returns that child status. A pre-launch validation/tunnel/health failure produces no pre/post block because execution stops earlier.",
        "evidenceType": "direct",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:375-392", "llama-server/tests/opencode-harness-integration-validation.sh:220-231", "opencode-harness/bin/opencode-harness.mjs:1030-1062"]
      },
      {
        "finding": "For `models ai-infra-main` or `models ai-infra-secondary`, the middle section is native OpenCode model-discovery output; no exact formatting is specified. For direct `run --format json --model ai-infra-<slug>/<MODEL_ALIAS> --agent <AGENT> <PROMPT>`, the middle section is native OpenCode JSON-format output plus possible stderr; response bytes are model-dependent. For optional `run --agent build --command delegate-orchestration <PROMPT>`, the middle section and generated traces are orchestration/model-dependent. Success evidence is exit 0 plus observed intended provider/model or role assignments and reviewed workspace state—not a promised phrase. Because force-local is false, delegation cannot be called local-only without observed routing evidence.",
        "evidenceType": "direct for forwarding and boundaries; inference for practical success evidence",
        "citations": ["llama-server/README.md:326-405", "opencode-harness/README.md:42-55", "llama-server/scripts/opencode-harness-integration.sh:380-392"]
      },
      {
        "finding": "Normal owned deactivate for secondary emits `tunnel stopped for secondary` (or `tunnel already stopped for secondary`) to stderr, then expected `stopped: secondary` to stdout, then `managed tunnel inactive: secondary (unmanaged listeners not inspected)` to stdout, and exits 0. A binding with local nodes only can deactivate successfully with no output. A preserved pre-existing tunnel must skip deactivate. The implementation treats any nonzero status as inactive, so failed/unhealthy status can still be followed by the managed-inactive claim; operators must not treat that line as proof against failed units or unmanaged listeners.",
        "evidenceType": "direct plus identified limitation",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:394-413", "llama-server/scripts/tunnel.sh:160-183", "llama-server/docs/opencode-harness-integration.md:115-122", "prior planner artifact 004:310-325"]
      },
      {
        "finding": "The previously described corrected real-node sequence is not an accepted final runbook: its independent recheck found fail-open local backup/restore functions and service-start ownership markers. This does not change the output contracts above, but downstream documentation must not reproduce those exact unsafe compounds as runnable recovery logic.",
        "evidenceType": "direct historical validator evidence",
        "citations": ["prior validator artifact 005:66-76,104-118,139-142"]
      }
    ],
    "valueSourceMap": [
      {
        "surface": "Registry identity, modes, host routing, and ports",
        "values": "`main` is local; `secondary` is remote. Secondary's script-facing SSH alias is `josh-ai`, deployed root is `~/ai/llama-server`, client tunnel port is 8081, and server/remote tunnel port is 8080. Provider IDs are mechanically `ai-infra-main` and `ai-infra-secondary`. Overlays and env paths also come only from the selected registry row. No raw hostname is required in an env, profile, binding, or run command; the actual HostName is external user SSH configuration and `ssh -G -- josh-ai` is the tunnel code's non-connection configuration report.",
        "authorityOrDecision": "authoritative committed registry plus deterministic exporter",
        "citations": ["llama-server/config/nodes/nodes.tsv:1-3", "llama-server/scripts/lib.sh:28-56", "llama-server/scripts/export-opencode-projection.sh:114-141,312-330"]
      },
      {
        "surface": "main.env and secondary.env required identity fields",
        "values": "`COMPOSE_PROJECT_NAME` is an operator-chosen per-deployment project name matching `[a-z0-9][a-z0-9_-]{0,62}`. `LLAMA_IMAGE` must be the independently approved exact tag plus `@sha256:<64 lowercase hex>` from Docker/image provenance inventory; `docker image inspect` can report installed RepoDigests but does not itself approve one. `MODEL_DIR` is the actual existing absolute canonical host model directory; `realpath -e -- <candidate>` reports its live canonical path. `MODEL_FILE` is the exact safe readable `.gguf` basename inside that directory. `MODEL_ALIAS` is the operator-approved served ID; after service start, `/v1/models` is the live cross-check. `HOST_PORT` is an operator deployment choice from 1..65535 bound on loopback; secondary must equal registry remote port 8080, while the projection uses client port 8081. Selected client ports must be unique. Public examples are starting points/placeholders, never proof of private values.",
        "authorityOrDecision": "explicit reviewed operator decisions constrained by live inventory and registry; stored in owner-only mode-0600 node envs",
        "citations": ["llama-server/scripts/lib.sh:75-117,126-136", "llama-server/scripts/export-opencode-projection.sh:143-205", "llama-server/config/nodes/main.env.example:1-10", "llama-server/config/nodes/secondary.env.example:1-10", "llama-server/README.md:127-155"]
      },
      {
        "surface": "Server context, parallelism, cache, GPU, and optional tuning",
        "values": "`LLAMA_ARG_CTX_SIZE` is a required projection input and operator-selected positive integer no greater than 2147483647, bounded by the exact model's trained maximum and tested hardware capacity; it is not safely inferred from filename. `LLAMA_ARG_N_PARALLEL` defaults to 1 when absent but should be explicitly 1 for the documented context workflow; exporter maxInFlight comes from it. Cache K/V types, flash attention, GPU layers, split mode, tensor split, main GPU, and endpoint metrics are operator tuning decisions supported by the pinned llama.cpp image and observed GPU topology; Compose defaults are respectively f16, f16, auto, all, layer, 1, 0, true, but defaults are implementation behavior, not validated hardware recommendations. `nvidia-smi` reports host GPU/driver state but not Docker GPU ordinal mapping; the main example explicitly says Docker device order is unverified. `THREADS`, `BATCH_SIZE`, and `UBATCH_SIZE` are optional positive integers <=2147483647 transformed to llama arguments. Validate is the non-endpoint merged-Compose consistency check; health/models/gpu and a bounded request are separate live evidence.",
        "authorityOrDecision": "operator tuning decision informed by model metadata, image support, nvidia-smi, and bounded live tests; Compose defaults only when deliberately accepted",
        "citations": ["llama-server/compose.yaml:14-38", "llama-server/scripts/lib.sh:75-104,149-302", "llama-server/scripts/export-opencode-projection.sh:164-205", "llama-server/config/nodes/main.env.example:9-18", "llama-server/docs/model-tuning.md:9-11", "llama-server/docs/operations.md:11-15"]
      },
      {
        "surface": "main.opencode.env and secondary.opencode.env",
        "values": "Each local client-only owner-mode-0600 file contains exactly once `OPENCODE_MODEL_OUTPUT_LIMIT=<positive integer>` and `OPENCODE_MODEL_ENABLE_THINKING=true|false`. Output must be <=2147483647 and strictly less than that node's `LLAMA_ARG_CTX_SIZE`; there is no default. Thinking is an explicit lowercase unquoted operator choice and only requests template thinking when supported. These files never go to a server. `export-opencode-projection.sh --node main --node secondary --print bundle` is the exact non-live rendered-value report (stdout JSON, no write); dry-run validates without revealing the rendered values.",
        "authorityOrDecision": "explicit operator decisions stored in local client metadata and verified by exporter",
        "citations": ["llama-server/config/nodes/opencode-projection.env.example:1-3", "llama-server/scripts/export-opencode-projection.sh:169-205,303-345", "llama-server/docs/opencode-projection.md:1-18,26,42-44"]
      },
      {
        "surface": "Unwrapped routing profile",
        "values": "The file itself must be an absolute canonical current-user-owned mode-0600 regular JSON file. Required literals/shape: unwrapped top-level object, `schemaVersion: \"2.0.0\"`, all nine top-level keys, and `localRouting.forceLocalForHarnessSubagents: false`. For the described local advisory profile, `defaultMode: \"single-model\"`, `defaultModel: null`, `singleModel: {enabled:false,model:null}`, and `localRouting.enabled:true` are deliberate policy choices, not discovered facts. `localRouting.defaultLocalModel` and each role's `localModel` are operator selections limited to `ai-infra-main` or `ai-infra-secondary`; every researcher/planner/implementer/validator object must contain `model`, `localModel`, and `variant`. A non-null `model` is a native `provider/model` choice; variant is a nonempty string or null and must be supported by the selected model/consumer. Empty `commandOverrides`, `orchestratorCommands`, and `complexityTiers` are the conservative described choices, not required to be empty. Do not include `localRouting.models`: the separate catalog owns those entries. The exact offline reporter/validator is plan or the pinned `validate-inputs` command against one concrete generated provider/catalog pair.",
        "authorityOrDecision": "schema literals plus explicit operator routing policy; catalog IDs derive from selected registry nodes",
        "citations": ["opencode-harness/.opencode/schemas/harness-routing-profile.schema.json:5-55", "llama-server/scripts/opencode-harness-integration.sh:161-175,278-283", "llama-server/docs/opencode-harness-integration.md:37-50", "opencode-harness/README.md:96-152"]
      },
      {
        "surface": "Workspace, roots, harness, executable, binding, and aliases",
        "values": "`WORKSPACE` is an operator-selected absolute canonical current-user-owned Git worktree root, preferably clean/disposable/exclusive; `git -C <path> rev-parse --show-toplevel` reports the root and status/diff report state. `HARNESS_ROOT` is the trusted exact c1c16cc checkout. `PROJECTION_ROOT`, optional `CACHE_ROOT`, profile path, and optional `BINDINGS_DIR` are operator-selected absolute canonical trusted paths; default projection is `${XDG_CONFIG_HOME:-$HOME/.config}/opencode/ai-infrastructure`, default cache base is `${XDG_CACHE_HOME:-$HOME/.cache}/opencode-harness`, and default bindings directory is `${XDG_STATE_HOME:-$HOME/.local/state}/ai-infrastructure/opencode-harness/bindings`. The bindings parent must already be trusted. `BINDING` comes only from bind's printed line. Actual model aliases come from the reviewed private env and should match live `/v1/models`, not the GGUF filename. The harness resolves one trusted OpenCode executable from explicit `OPENCODE_BIN` or PATH and requires exact `opencode --version` 1.18.18.",
        "authorityOrDecision": "operator path decisions checked by wrapper/launcher; binding and generated paths are command outputs; harness identity is pinned",
        "citations": ["llama-server/scripts/opencode-harness-integration.sh:53-125,152-159,267-301,372-373", "llama-server/docs/opencode-harness-integration.md:124-147", "opencode-harness/bin/opencode-harness.mjs:395-405,440-446,971-987,1046-1055"]
      },
      {
        "surface": "Live run model, agent, prompt, and auth values",
        "values": "Discovery provider is deterministic `ai-infra-<slug>`. Direct model is `ai-infra-<slug>/<exact MODEL_ALIAS>`. The direct `AGENT` is an explicit native OpenCode agent choice supported by the activated configuration; the optional managed delegation command intentionally uses observed primary agent `build` and command `delegate-orchestration`. Both prompts are operator-authored bounded non-secret requests with predeclared success criteria and data-handling approval; no source supplies a safe fake prompt or expected response. Authentication is native external OpenCode state, never an env/projection/profile/binding value. The authorized sources provide no exact credential-free auth-status command or claim that these local adapters require credentials; sufficient auth remains an unresolved environment fact tested only at the separately authorized live call.",
        "authorityOrDecision": "derived provider/model prefix plus explicit operator selections and external native auth state",
        "citations": ["llama-server/README.md:355-405", "opencode-harness/README.md:42-55,121-131", "llama-server/docs/opencode-harness-integration.md:3-8,48-50"]
      }
    ],
    "sourceList": [
      "Current ai-infrastructure executable sources: integration wrapper, exporter, ai.sh/lib.sh, tunnel.sh, Compose and registry",
      "Current ai-infrastructure public examples, schemas, tests, README, and OpenCode integration/projection/operations docs",
      "Committed opencode-harness c1c16cc55ca2c4787f000d01ff05ffe05734a3d3 launcher, package, README, and routing-profile schema",
      "Prior real-node planner artifact 004 for the exact sequence and validator artifact 005 for its unresolved safety blockers"
    ],
    "implementationImplications": [
      "A user-facing table should have separate stdout, stderr, success-status, and variable-output columns. Mark inherited Docker/curl/nvidia-smi/OpenCode bytes as variable rather than supplying invented examples.",
      "Document silent success explicitly for equality tests, cmp -s, assignments/exports, redirected health checks, and local-only activate/deactivate. Pair every silent command with an immediate fail-closed status pattern.",
      "Show plan and bind literals with `<WORKSPACE>`, `<PROJECTION_ROOT>`, and `<BINDING_PATH>` clearly marked as variable values; preserve the bind validation JSON's actual sorted key order.",
      "Separate authoritative committed values, generated values, live observations, and operator policy/tuning decisions. Public env examples must never be presented as current private inventory.",
      "Do not promote prior planner artifact 004 as runnable final recovery logic until its independently reported backup/restore/service-marker blockers are corrected and revalidated.",
      "Treat inactive tunnel exit 1 as expected only when clean stopped output/state is established; neither deactivate's final line nor a generic nonzero proves absence of failed units or unmanaged listeners."
    ],
    "risks": [
      "Current ai-infrastructure integration bytes are uncommitted worktree content; only the harness side is at the exact committed pin.",
      "No private values or live outputs were read. Actual image/model paths, aliases, contexts, GPU mapping, endpoint bodies, OpenCode formatting, auth, response quality, and role routing remain unknown.",
      "Native tool output can change with Docker Compose, driver, llama.cpp, and OpenCode runtime versions even when wrapper-authored lines stay fixed.",
      "The wrapper's deactivate logic accepts any tunnel-status nonzero as inactivity, which can obscure a failed unit unless the operator inspects the status class.",
      "Real OpenCode runs can mutate workspace/Git state. Advisory force-local false cannot guarantee delegated local-only execution.",
      "The prior sequence's local backup/restore and service-start marker commands were independently rejected as fail-open and must not be copied unchanged."
    ],
    "unresolvedQuestions": [
      "What exact approved private image digest, model directory/file/alias, context/output, GPU tuning, and role selections will the operator use?",
      "What native agent and bounded prompts are approved, and what response assertions establish useful success without assuming exact text?",
      "Does the activated OpenCode/provider environment require native authentication, and what approved local diagnostic establishes it without exposing secrets?",
      "Will the operator use an initially inactive test-owned tunnel or preserve a healthy pre-existing tunnel and skip activate/deactivate?",
      "What corrected, independently validated backup/restore/service-ownership procedure replaces the unsafe compounds in prior planner artifact 004?"
    ],
    "recommendedNextRole": "validator",
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/research-output-values-researcher-001.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-live-output-and-value-sources/roles/researcher/research-output-values-researcher-001.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/correct-operator-runbook-planner-004.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/recheck-operator-runbook-validator-005.md"
    ]
  },
  "handoff": {
    "nextRole": "validator",
    "limitations": "Research only. No final plan, implementation edit, live action, private-input read, provider/OpenCode request, or acceptance validation was performed. Exact live native output is intentionally left variable where the authorized source does not specify bytes.",
    "risks": "Downstream review must verify every quoted literal/channel and must retain the warning that prior artifact 004 is not a safe accepted runbook. Live readiness, auth, model identity, output quality, GPU mapping, and recovery remain unresolved."
  }
}
```
