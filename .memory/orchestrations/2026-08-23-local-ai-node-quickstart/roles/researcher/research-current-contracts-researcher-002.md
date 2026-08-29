```json
{
  "orchestrationId": "2026-08-23-local-ai-node-quickstart",
  "role": "researcher",
  "artifactId": "research-current-contracts-researcher-002",
  "createdAt": "2026-08-24T00:44:03Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh remediation packet repair-research-trace-researcher-002 for scope research-current-contracts, taskMode research, requesting current Compose, node-env, SSH-tunnel, endpoint/model-discovery, OpenCode-provider, and harness-command evidence for the local AI node quickstart.",
    "requiredContextPresent": "yes; all authorized current files and documentation targets were available, including the prior delegation-packet summary, current public OpenCode schema, and provider documentation",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Read only the authorized public/example infrastructure files, harness files, contracts, schemas, template, and published OpenCode documentation. Ran four help-only commands that do not contact Docker, SSH, OpenCode providers, or live endpoints. No private environment/projection files, credentials, SSH configuration, live systems, or implementation/configuration files were accessed or changed. Only this required trace artifact was created.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/llama-server/compose.yaml",
      "/home/joshl/ai-infrastructure/llama-server/compose.main.yaml",
      "/home/joshl/ai-infrastructure/llama-server/compose.secondary.yaml",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example",
      "/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh",
      "/home/joshl/projects/opencode-harness/opencode.json",
      "/home/joshl/projects/opencode-harness/README.md",
      "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs",
      "/home/joshl/projects/opencode-harness/.opencode/contracts/role-io-contracts.json",
      "/home/joshl/projects/opencode-harness/.opencode/schemas/memory-trace-artifact.schema.json",
      "/home/joshl/projects/opencode-harness/.memory/templates/role-trace-artifact.md",
      "/home/joshl/projects/opencode-harness/.memory/orchestrations/2026-08-23-local-ai-node-quickstart/delegation-packets/research-current-contracts-researcher-001.md",
      "https://opencode.ai/config.json",
      "https://opencode.ai/docs/providers/"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/researcher/research-current-contracts-researcher-002.md"
    ],
    "commands": [
      "cwd=/home/joshl/ai-infrastructure/llama-server; ./scripts/ai.sh --help; exit=0; stdout=Usage: ai.sh --node SLUG [--local|--remote] COMMAND, followed by Commands: start stop restart status logs health models gpu update validate, execution-default and logs notes; stderr empty",
      "cwd=/home/joshl/ai-infrastructure/llama-server; ./scripts/tunnel.sh --help; exit=0; stdout=Usage: tunnel.sh [--node SLUG] start|stop|status; stderr empty",
      "cwd=/home/joshl/ai-infrastructure/llama-server; ./scripts/export-opencode-projection.sh --help; exit=0; stdout lists required repeatable --node plus --output-dir ABS, --dry-run, --print native|routing|bundle, and --help; stderr empty",
      "cwd=/home/joshl/projects/opencode-harness; node bin/opencode-harness.mjs --help; exit=0; stdout lists prepare, validate-inputs, and run grammars including provider/config/catalog/profile options; stderr empty",
      "cwd=/home/joshl/projects/opencode-harness; date -u +%Y-%m-%dT%H:%M:%SZ; exit=0; stdout=2026-08-24T00:44:03Z; stderr empty",
      "cwd=/home/joshl/projects/opencode-harness; node -e <read artifact, verify JSON fence, JSON.parse, required trace fields, and required researcher output fields>; exit=0; stdout={\"validJson\":true,\"requiredTraceFields\":true,\"researcherOutputFields\":true,\"findings\":12,\"sources\":7}; stderr empty"
    ]
  },
  "outputContract": {
    "outputs": "Cited findings, source list, implementation implications, risks, unresolved questions, exact offline command observations, and planner handoff for an assumption-free local AI node quickstart.",
    "evidence": "All claims are direct evidence from current authorized source bytes or current published documentation unless explicitly marked inference. No live-state result is claimed.",
    "citedFindings": [
      {
        "id": "F1",
        "classification": "direct evidence",
        "finding": "The base Compose contract has one llama-server service whose required LLAMA_IMAGE is a tag-plus-digest, whose required existing absolute MODEL_DIR is mounted read-only at /models without host-path creation, and whose required MODEL_FILE and MODEL_ALIAS become LLAMA_ARG_MODEL and LLAMA_ARG_ALIAS. The server listens on container 0.0.0.0:8080, but publication is loopback-only as 127.0.0.1:${HOST_PORT}:8080. Context defaults to 8192, parallelism to 1, metrics to true, and all NVIDIA GPUs are reserved. Node overlays add only ai.infrastructure.node=main or secondary.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/compose.yaml:1-38", "/home/joshl/ai-infrastructure/llama-server/compose.main.yaml:1-4", "/home/joshl/ai-infrastructure/llama-server/compose.secondary.yaml:1-4"]
      },
      {
        "id": "F2",
        "classification": "direct evidence",
        "finding": "The public registry fixes main as local with compose.main.yaml and config/nodes/main.env, and secondary as remote through SSH alias josh-ai at ~/ai/llama-server with compose.secondary.yaml and config/nodes/secondary.env. Main has no tunnel. Secondary maps local loopback port 8081 to remote loopback port 8080. Thus the approved client endpoints are main http://127.0.0.1:8080/v1 and tunneled secondary http://127.0.0.1:8081/v1, contingent on live services and tunnel health.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv:1-3", "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh:18-20,150-158"]
      },
      {
        "id": "F3",
        "classification": "direct evidence",
        "finding": "The main example is intentionally incomplete: its image digest, model directory, model filename, and live alias are placeholders; HOST_PORT is 8080; context is 131072 and parallelism 1; and its 0.60,0.40 tensor split is only an inventory-derived starting point because Docker GPU device order is unverified. The secondary example contains a pinned image digest, placeholder absolute model directory, Qwen3.5-4B-Q4_K_M.gguf, alias secondary-node-model, HOST_PORT 8080, context 8192, and parallelism 1. Example values are templates, not proof of private deployed bytes or live model identity.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example:1-18", "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example:1-18"]
      },
      {
        "id": "F4",
        "classification": "direct evidence",
        "finding": "scripts/ai.sh is the node-aware operational wrapper and supports start, stop, restart, status, logs, health, models, gpu, update, and validate. Registry execution is the default, so --node main executes locally and --node secondary executes remotely unless explicitly overridden. validate performs configuration preflight plus quiet Compose validation; start/restart run preflight first. health requests http://127.0.0.1:${HOST_PORT}/health and models requests http://127.0.0.1:${HOST_PORT}/v1/models in the selected execution context. Prefer these wrappers over reconstructing Compose/SSH commands in documentation.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh:7-14,17-37,39-54", "observed help-only command: cwd=/home/joshl/ai-infrastructure/llama-server ./scripts/ai.sh --help, exit 0"]
      },
      {
        "id": "F5",
        "classification": "direct evidence",
        "finding": "scripts/tunnel.sh defaults to secondary and supports start/stop/status. It requires a user systemd manager and creates an owner-only control-socket directory. Before start it rejects SSH aliases with ClearAllForwardings=yes or any configured local/remote/dynamic forwarding, refuses an unmanaged tunnel, and refuses an occupied local port. Its managed command uses BatchMode, ExitOnForwardFailure, ControlMaster, no persistent control master, keepalives, and exactly -L 127.0.0.1:${TUNNEL_LOCAL_PORT}:127.0.0.1:${TUNNEL_REMOTE_PORT} -- ${SSH_ALIAS}; success requires the unit, control channel, and loopback listener all healthy.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh:7-35,36-69,71-97,134-183", "observed help-only command: cwd=/home/joshl/ai-infrastructure/llama-server ./scripts/tunnel.sh --help, exit 0"]
      },
      {
        "id": "F6",
        "classification": "direct evidence",
        "finding": "Exact model IDs must be discovered before provider configuration. The node wrapper exposes GET /v1/models, and current OpenCode provider documentation says a custom local model key must match the id returned by GET /v1/models. Therefore run ./scripts/ai.sh --node main models and ./scripts/ai.sh --node secondary models after the respective health checks; for client-path proof after tunnel startup, GET http://127.0.0.1:8081/v1/models separately and require the same intended secondary ID. Do not treat MODEL_FILE, a display name, or an example MODEL_ALIAS as a discovered ID.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh:45-46", "https://opencode.ai/docs/providers/#atomic-chat (fetched 2026-08-24; model IDs must match GET /v1/models)"]
      },
      {
        "id": "F7",
        "classification": "direct evidence",
        "finding": "Projection metadata is client-only and requires an explicitly validated positive output limit less than context plus a boolean thinking value. The exporter then reads private mode-0600 node env and node.opencode.env files, requires valid MODEL_ALIAS, HOST_PORT, context, parallelism, output, and thinking, enforces output<context, maps a remote node to its tunnel-local client port, and rejects duplicate aliases or client ports. It emits ai-infra-${node} providers using @ai-sdk/openai-compatible, baseURL http://127.0.0.1:${clientPort}/v1, one alias-keyed/name-matching model with context/output/thinking metadata, and a matching harness endpoint catalog.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example:1-3", "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh:104-205,298-345,360-420"]
      },
      {
        "id": "F8",
        "classification": "direct evidence",
        "finding": "The current exporter supports repeatable --node, --dry-run, and --print native|routing|bundle. Its writable mode publishes owner-only immutable generation files named opencode.providers.json and harness-endpoints.json and atomically advances current; stderr reports concrete generation leaves. No-write print mode renders from validated private scalar inputs without creating an output root or temporary render directory. Discovery must precede setting each private MODEL_ALIAS to the exact live ID and generating output; only then may the provider object from generated native output be merged into project opencode.json while preserving existing $schema, instructions, and permission fields.",
        "sources": ["/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh:9-22,141-205,303-345,348-420,422-583", "/home/joshl/projects/opencode-harness/opencode.json:1-7", "observed help-only exporter command, exit 0"]
      },
      {
        "id": "F9",
        "classification": "direct evidence",
        "finding": "Published OpenCode configuration accepts a provider map; a provider accepts npm, name, options.baseURL, and models, while model entries accept name, limit with required context/output, and options. The current llama.cpp documentation specifically uses @ai-sdk/openai-compatible, a loopback /v1 baseURL, and explicit model limits. OpenCode's provider guide says project opencode.json is the place to configure a custom provider and /models then exposes it. Fully quit and restart OpenCode after changing configuration because the harness README states running sessions retain loaded configuration.",
        "sources": ["https://opencode.ai/config.json#/$defs/ProviderConfig (fetched 2026-08-24)", "https://opencode.ai/docs/providers/#llamacpp", "https://opencode.ai/docs/providers/#custom-provider", "/home/joshl/projects/opencode-harness/README.md:176"]
      },
      {
        "id": "F10",
        "classification": "direct evidence",
        "finding": "The harness provider projection is deliberately stricter than the general OpenCode schema: exactly $schema and nonempty provider; ai-infra-* provider IDs; @ai-sdk/openai-compatible; canonical loopback HTTP /v1 URL; exactly one model per provider; model key=name; positive integer context/output with output<context; and exact boolean enable_thinking. External files must be absolute, current-user-owned mode-0600 regular JSON with trusted ancestry, no symlink leaf, stable reads, and at most 1 MiB. validate-inputs can check provider alone offline; run can accept provider alone or catalog+profile together or all three.",
        "sources": ["/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs:49-63,677-686,695-783,990-1028", "/home/joshl/projects/opencode-harness/README.md:53-152"]
      },
      {
        "id": "F11",
        "classification": "direct evidence",
        "finding": "Do not combine a project provider section with --provider-config. Harness project preflight explicitly rejects any project config containing provider when --provider-config is supplied. For this scoped quickstart, after merging the discovered/generated provider object into /home/joshl/projects/opencode-harness/opencode.json, invoke the harness without --provider-config: node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- models, then select or run the exact ai-infra-main/<DISCOVERED_MAIN_ID> or ai-infra-secondary/<DISCOVERED_SECONDARY_ID>. If instead an operator chooses the external provider-file workflow, leave project provider absent and pass the concrete generated provider leaf; these are alternatives, not additive configuration paths.",
        "sources": ["/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs:542-559,578-595,990-1071", "/home/joshl/projects/opencode-harness/README.md:32-51,123-152", "observed harness help-only command: cwd=/home/joshl/projects/opencode-harness node bin/opencode-harness.mjs --help, exit 0"]
      },
      {
        "id": "F12",
        "classification": "inference constrained by direct evidence",
        "finding": "An assumption-free operator sequence should be: create private node/projection files from examples and replace every placeholder from approved inventory; ./scripts/ai.sh --node main validate, start, health, models; ./scripts/ai.sh --node secondary validate, start, health, models; ./scripts/tunnel.sh --node secondary start, status; verify the tunneled /health and /v1/models on 127.0.0.1:8081; set MODEL_ALIAS values to exactly discovered IDs and validated output limits; run exporter --dry-run/--print or publish; merge only the generated provider object into project config; fully quit/restart OpenCode; then use the harness models/run forms without --provider-config. The ordering is inferred; each individual command/constraint is directly supported by F1-F11.",
        "sources": ["F1-F11 in this artifact"]
      }
    ],
    "sourceList": [
      {"source": "Compose base and node overlays", "paths": ["/home/joshl/ai-infrastructure/llama-server/compose.yaml", "/home/joshl/ai-infrastructure/llama-server/compose.main.yaml", "/home/joshl/ai-infrastructure/llama-server/compose.secondary.yaml"], "use": "service, bind, loopback port, server arguments, GPU reservation, node labels"},
      {"source": "Public node registry and env examples", "paths": ["/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv", "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example", "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example", "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example"], "use": "execution topology, josh-ai, ports 8080/8081, placeholders, example values, client metadata"},
      {"source": "Infrastructure wrappers/exporter", "paths": ["/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh", "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh", "/home/joshl/ai-infrastructure/llama-server/scripts/export-opencode-projection.sh"], "use": "preferred operational commands, endpoint paths, SSH safeguards, generation and validation contracts"},
      {"source": "Harness project config and runtime contract", "paths": ["/home/joshl/projects/opencode-harness/opencode.json", "/home/joshl/projects/opencode-harness/README.md", "/home/joshl/projects/opencode-harness/bin/opencode-harness.mjs"], "use": "merge preservation, strict provider schema, collision rule, command grammar, restart boundary"},
      {"source": "Published OpenCode schema", "url": "https://opencode.ai/config.json", "fetched": "2026-08-24", "use": "current provider/model field shapes"},
      {"source": "Published OpenCode provider documentation", "url": "https://opencode.ai/docs/providers/", "fetched": "2026-08-24", "pageLastUpdated": "2026-08-23", "use": "llama.cpp/custom-provider pattern and exact GET /v1/models ID discovery guidance"},
      {"source": "Observed help-only command output", "use": "current public CLI grammar without live or private access"}
    ],
    "implementationImplications": [
      "Document commands from /home/joshl/ai-infrastructure/llama-server and prefer ./scripts/ai.sh and ./scripts/tunnel.sh; do not duplicate raw Compose or SSH invocation internals as the normal path.",
      "Keep main on 127.0.0.1:8080 and secondary remote 127.0.0.1:8080 exposed to the client only through josh-ai at 127.0.0.1:8081.",
      "Make discovery a hard gate: capture the exact id field from each /v1/models response, prove the tunnel returns the intended secondary identity, and only then set aliases/render config. Use placeholders such as <DISCOVERED_MAIN_ID> until that gate is completed; never publish guessed IDs.",
      "Populate private mode-0600 node env and node.opencode.env values outside documentation. Context comes from LLAMA_ARG_CTX_SIZE; output comes from independently validated OPENCODE_MODEL_OUTPUT_LIMIT and must be smaller; maxInFlight comes from LLAMA_ARG_N_PARALLEL; thinking comes from the client-only projection metadata.",
      "Merge only the generated native provider object after discovery into the existing project opencode.json, preserving $schema, instructions, and permission. Then fully quit and restart OpenCode.",
      "Use either project provider configuration or harness --provider-config, never both. With the requested project merge, exact verification commands are node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- models and a later -- run --model ai-infra-<node>/<DISCOVERED_ID> form; live invocation remains an operator/validator action.",
      "If routing is also desired, the generated endpoint catalog still requires a separately reviewed all-or-none routing profile; provider transport and advisory routing are distinct. Do not imply the catalog proves health, identity, or capacity."
    ],
    "risks": [
      "Main image digest, model directory, model file, and live ID remain unknown from authorized public files; the main example explicitly marks them for replacement.",
      "The secondary example's filename and alias do not prove the currently served live model; discovery is still mandatory.",
      "Configured context, output, parallelism, and GPU split are declarations, not demonstrated safe capacity. The main GPU ordering is explicitly unverified.",
      "The tunnel depends on a dedicated base SSH alias with no configured forwards and an available user systemd manager/port. This research did not inspect private SSH configuration or exercise it.",
      "Merging provider config and also passing --provider-config causes harness preflight failure. Editing provider config without a full OpenCode restart can leave stale loaded configuration.",
      "Offline source/help evidence does not establish Docker/image/model availability, endpoint health, tunnel reachability, exact live IDs, OpenCode activation, tool-call quality, or recovery behavior."
    ],
    "unresolvedQuestions": [
      "What exact ids do the two live /v1/models responses return after validated startup, and does the tunneled secondary endpoint return the intended same ID?",
      "What approved main image digest, absolute model directory, exact model file, and validated client output limits should replace placeholders?",
      "What output limits and thinking settings have been validated for each exact served model rather than merely selected for configuration?",
      "Will this quickstart use only project provider configuration, as scoped, or choose the alternative external --provider-config workflow? It must not use both.",
      "Is advisory harness routing in scope? If yes, a reviewed routing profile is still required alongside the generated catalog."
    ],
    "recommendedNextRole": "planner",
    "traceArtifactPath": ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/researcher/research-current-contracts-researcher-002.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/researcher/research-current-contracts-researcher-002.md",
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/delegation-packets/research-current-contracts-researcher-001.md"
    ]
  },
  "handoff": {
    "nextRole": "planner",
    "limitations": "Research only. No implementation plan was finalized, no implementation/configuration file was edited, and no acceptance validation was performed. Live Docker, SSH, endpoint, model, OpenCode, and provider behavior were intentionally not exercised. Caller routing metadata was absent and no values were invented.",
    "risks": "Planner must preserve hard discovery-before-config ordering, wrapper-first operations, exact 8080/8081 topology, project-provider versus --provider-config exclusivity, restart requirements, and explicit placeholders for every unresolved live value. Independent validator evidence remains required."
  }
}
```
