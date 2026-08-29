```json
{
  "orchestrationId": "2026-08-23-local-ai-node-quickstart",
  "role": "planner",
  "artifactId": "plan-quickstart-planner-003",
  "createdAt": "2026-08-23T00:00:00Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh planner packet for taskMode plan, with an approved two-file implementation boundary, repaired research evidence, exact deliverable paths, constraints, assumptions, dependencies, and acceptance criteria.",
    "requiredContextPresent": "yes; the approved goal, scope boundaries, repaired research trace, current opencode.json, deliverable paths, acceptance criteria, dependency, and assumptions were present",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Selected taskMode plan. Converted the supplied evidence into a bounded wrapper-first implementation plan. Resolved the pre-discovery configuration decision in favor of leaving opencode.json unchanged until exact live IDs and typed limits have been validated, then performing a deterministic generated-provider-only merge. No implementation file or final acceptance validation was performed.",
    "filesRead": [
      ".memory/protocols/memory-management.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      ".memory/templates/role-trace-artifact.md",
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/researcher/research-current-contracts-researcher-002.md",
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/INDEX.md",
      "opencode.json",
      "package.json"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/planner/plan-quickstart-planner-003.md"
    ],
    "commands": [
      "cwd=/home/joshl/projects/opencode-harness; node -e <parse fenced trace JSON and require trace/planner output fields>; exit=0; stdout={\"validJson\":true,\"requiredTraceFields\":true,\"plannerOutputFields\":true,\"planSteps\":10,\"gates\":8}"
    ]
  },
  "outputContract": {
    "outputs": "Ordered implementation plan, exact file contracts and configuration decision, dependencies, executable verification gates, assumptions/tradeoffs, and implementer handoff notes.",
    "evidence": "The plan is bounded to findings F1-F12 and the implementation implications in the supplied repaired research trace, plus the packet's explicit constraints and acceptance criteria.",
    "orderedPlanOrResolvedConclusions": [
      {
        "order": 1,
        "section": "Document contract and safety convention",
        "action": "Create local-ai-nodes-quickstart.md as a concise linear runbook. Start with a topology box naming the control/main host, the secondary host reached as SSH alias josh-ai, the infrastructure checkout directory on each host, and the harness workspace directory. Every command block must be immediately labeled with the host and working directory. State that ai.sh combines compose.yaml, the selected node overlay, and that node's private env; secondary wrapper calls execute in the registry-declared remote directory. State that tunnel.sh safely implements only 127.0.0.1:8081 to secondary 127.0.0.1:8080. Use wrapper commands as the normal path, not reconstructed docker compose or ssh forwarding commands."
      },
      {
        "order": 2,
        "section": "Prerequisites and value acquisition",
        "action": "Add a required-values table that distinguishes operator-approved inventory from discovered runtime values. Require Docker/Compose and NVIDIA readiness per host, a working josh-ai alias, a user systemd manager for the tunnel, the checkouts in their registry-declared directories, approved image digest/model directory/model filename/context/parallelism values, and independently validated positive integer output limits smaller than context. Explicitly say the public examples are templates and that main placeholders, example aliases, filenames, display names, and configured values do not prove a live model ID. Do not place credentials, private absolute model paths, or concrete private values in the document."
      },
      {
        "order": 3,
        "section": "Private environment creation",
        "action": "On each appropriate host, show non-overwriting owner-only creation from the relevant node env example and from opencode-projection.env.example into config/nodes/<node>.env and config/nodes/<node>.opencode.env. Use a pre-existence test, install -m 600 only when absent, and an explicit chmod/stat verification path when retained files already exist; never overwrite an existing private file. Require replacement of every example placeholder and validation of MODEL_ALIAS/output/thinking only after discovery where applicable. Keep private files unprinted and uncommitted."
      },
      {
        "order": 4,
        "section": "Pre-state, validation, and node starts",
        "action": "From the control/main host infrastructure checkout, run ai.sh --node main validate/status and ai.sh --node secondary validate/status. Treat an ambiguous validation/status failure as an abort, not proof that a service is stopped. Record a three-row startup ledger for main service, secondary service, and secondary tunnel with pre-state and started-by-this-run. Start only clearly stopped nodes with ai.sh --node main start and ai.sh --node secondary start, then require each wrapper health check. Do not use restart. Explain that the main wrapper is local and the secondary wrapper follows the registry to josh-ai and its remote checkout."
      },
      {
        "order": 5,
        "section": "Tunnel",
        "action": "Check tunnel.sh --node secondary status before changing it. If already healthy, record pre-existing and do not start or later stop it. If clearly absent and port 8081 is free, start with tunnel.sh --node secondary start and record started-by-this-run; abort unmanaged/occupied/forwarding-policy failures. Require tunnel status and client-side /health proof at 127.0.0.1:8081. Keep the wrapper's protected SSH command as explanatory behavior only, not a raw-command fallback."
      },
      {
        "order": 6,
        "section": "Discovery gate",
        "action": "After health, run ai.sh --node main models and ai.sh --node secondary models in their execution contexts, then query the tunneled secondary /v1/models from the control host. Require the operator to copy the exact id fields, require the tunneled secondary ID to equal the intended remote response, and abort on empty, duplicate, unexpected, or mismatched results. Do not derive IDs from filenames or aliases. Only now set each private MODEL_ALIAS to its exact discovered ID and set the already validated typed output/thinking metadata; re-run node validation."
      },
      {
        "order": 7,
        "section": "Generated provider and deterministic project merge",
        "action": "From the infrastructure checkout, run export-opencode-projection.sh with repeatable --node main --node secondary, first --dry-run and then --print native into an owner-only temporary file. Validate that file with the harness validate-inputs provider-only form before merge. From the harness workspace, require a clean pre-state for opencode.json and run an inline Node merge that parses both documents, rejects a destination provider key, rejects any generated shape other than $schema plus nonempty provider, preserves every existing destination key/value byte-semantically, adds only generated.provider, writes formatted JSON plus newline to a same-directory exclusive temporary file, sets source-acceptable mode 0644, and atomically renames it. Clean the temporary generated file on success or failure. Never hand-author a provider/model entry."
      },
      {
        "order": 8,
        "section": "Restart and harness checks",
        "action": "Tell the operator to fully quit all OpenCode sessions after the merge and restart through the harness. From the harness workspace, show the exact current launcher forms to list models without --provider-config and then invoke each exact ai-infra-main/<discovered-id> and ai-infra-secondary/<discovered-id>. State that project provider configuration and --provider-config are mutually exclusive. Keep prepare/cache acquisition distinct from offline checks and do not claim endpoint quality from model listing alone."
      },
      {
        "order": 9,
        "section": "Cleanup",
        "action": "Consult the startup ledger in reverse order. Stop the tunnel only if this procedure started it, then stop secondary and main only if this procedure started each service, using tunnel.sh/ai.sh stop. Leave every pre-existing resource running. Remove only procedure-created temporary projection files; preserve private node env files and the intentional project provider merge. Include post-cleanup status checks."
      },
      {
        "order": 10,
        "section": "Troubleshooting and verification",
        "action": "Provide a short symptom/action table for placeholder/preflight rejection, invalid output>=context, model-ID mismatch, occupied 8081/unmanaged tunnel, josh-ai forwarding-policy rejection, stale OpenCode config, project-provider/--provider-config collision, and endpoint health versus model capability. End with the exact offline/source and live-activation gates listed in verificationGates; label conditional or live gates honestly."
      }
    ],
    "fileContractsOrDecisions": [
      {
        "path": "local-ai-nodes-quickstart.md",
        "contract": "New concise runbook with exactly these ordered major sections: Prerequisites and values; Private environment files; Start main; Start secondary; Start tunnel; Discover model IDs; Generate and merge providers; Restart and test; Cleanup; Troubleshooting; Verification. Commands use bash fences, contain no angle-bracket pseudo-values, identify host and cwd, preserve private values, and use current wrappers wherever available. Shell variables may represent values only after an explicit acquisition/validation step and must be guarded with ${VAR:?message} before use."
      },
      {
        "path": "opencode.json",
        "decision": "Do not edit this file in the implementation commit because no exact live IDs or validated output limits were supplied. Its current $schema, two instructions, and permission.webfetch=ask are already the minimal schema-valid pre-discovery configuration and must remain byte-for-byte unchanged. The quickstart later completes the workflow by merging only exporter-generated provider after discovery. This is preferable to committing fake, disabled, empty, or placeholder model entries."
      },
      {
        "path": ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/planner/plan-quickstart-planner-003.md",
        "contract": "Planner trace only; it is not an implementation target for the implementer."
      }
    ],
    "dependencies": [
      "Completed repaired research trace research-current-contracts-researcher-002 is the sole substantive evidence dependency.",
      "The live workflow depends on operator-supplied approved private infrastructure values, working josh-ai, available Docker/GPU/systemd prerequisites, and exact post-start discovery results.",
      "Provider generation depends on exact discovered IDs plus positive integer context/output metadata with output<context; project activation depends on a full OpenCode restart.",
      "Implementation precedes independent validation; no acceptance may rely on this planner trace."
    ],
    "verificationGates": [
      {
        "gate": "Markdown bash syntax",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node -e 'const fs=require(\"fs\"),cp=require(\"child_process\");const s=fs.readFileSync(\"local-ai-nodes-quickstart.md\",\"utf8\");const b=[...s.matchAll(/```bash\\n([\\s\\S]*?)```/g)].map(x=>x[1]);if(!b.length)process.exit(1);b.forEach((x,i)=>{const r=cp.spawnSync(\"bash\",[\"-n\"],{input:x,encoding:\"utf8\"});if(r.status){console.error(`bash block ${i+1}: ${r.stderr}`);process.exit(1)}})'",
        "expectation": "exit 0; every bash fence is real shell syntax rather than pseudo-command syntax"
      },
      {
        "gate": "JSON and required pre-discovery preservation",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node -e 'const c=require(\"./opencode.json\");if(c.$schema!==\"https://opencode.ai/config.json\"||JSON.stringify(c.instructions)!==JSON.stringify([\"AGENTS.md\",\".memory/protocols/memory-management.md\"])||c.permission?.webfetch!==\"ask\"||Object.hasOwn(c,\"provider\"))process.exit(1)'",
        "expectation": "exit 0 before discovery; no fake or premature provider is committed"
      },
      {
        "gate": "Compose rendering from public examples",
        "cwd": "/home/joshl/ai-infrastructure/llama-server",
        "command": "docker compose --env-file config/nodes/main.env.example -f compose.yaml -f compose.main.yaml config --quiet && docker compose --env-file config/nodes/secondary.env.example -f compose.yaml -f compose.secondary.yaml config --quiet",
        "expectation": "exit 0 when Docker Compose is installed; this is rendering only and does not prove private values, image/model availability, or live health"
      },
      {
        "gate": "Generated provider structural validation",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node bin/opencode-harness.mjs validate-inputs --provider-config \"$GENERATED_PROVIDER_FILE\"",
        "expectation": "exit 0 after discovery/export; GENERATED_PROVIDER_FILE must be the absolute owner-only generated/printed provider file; this command is offline and runs before project merge"
      },
      {
        "gate": "OpenCode configuration parse",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- debug config",
        "expectation": "exit 0 using an already prepared exact runtime, without --provider-config; treat this as conditional when the runtime cache is absent and do not acquire it as part of an offline gate"
      },
      {
        "gate": "Harness source validation",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node .opencode/scripts/validate-harness.mjs",
        "expectation": "exit 0"
      },
      {
        "gate": "Diff hygiene",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "git diff --check -- local-ai-nodes-quickstart.md opencode.json && git diff -- local-ai-nodes-quickstart.md opencode.json",
        "expectation": "first command exits 0; reviewed diff contains the new document only and no opencode.json change before discovery; commands are read-only and perform no Git mutation"
      },
      {
        "gate": "Live activation, separate from offline acceptance",
        "cwd": "/home/joshl/projects/opencode-harness",
        "command": "node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- models",
        "expectation": "after full restart and healthy endpoints, output exposes only exporter-generated exact models; independent validator/operator must separately test each exact model ID"
      }
    ],
    "assumptions": [
      "The selected policy is discover-during-setup; exact model IDs and validated limits are intentionally unavailable at implementation time.",
      "The SSH alias josh-ai and registry topology are as supplied, but the runbook must still preflight rather than claim live readiness.",
      "Private env files and services may be absent, so creation/start actions must be non-destructive and pre-state-driven.",
      "Node 24 is available in the harness workspace as required by package.json; Docker Compose availability remains a documented prerequisite."
    ],
    "tradeoffs": [
      "Leaving opencode.json unchanged means the committed tree exposes no local models, but it is the only deterministic no-placeholder state until discovery. The runbook supplies the post-discovery completion step.",
      "Wrapper-first commands are less illustrative than raw Compose/SSH commands but preserve current registry, validation, remote-execution, port, and forwarding safeguards.",
      "A generated-provider-only merge intentionally refuses an existing provider key instead of guessing merge precedence; an existing provider requires a separately reviewed scope decision.",
      "Compose example rendering and source validation are offline structural evidence, not proof of private configuration or live service behavior."
    ],
    "handoffNotes": [
      "Next role: implementer in implementation mode, with edits limited to local-ai-nodes-quickstart.md; inspect but do not change opencode.json.",
      "Verify exact wrapper/exporter/launcher argument order against current help/source while drafting; do not replace supplied evidence with guessed syntax.",
      "Keep all command blocks bash-parseable and ensure prose, not shell pseudo-placeholders, carries unresolved value names.",
      "Do not run Docker, SSH, services, tunnels, model endpoints, OpenCode activation, prepare/network acquisition, or Git mutation during implementation unless separately authorized.",
      "Run only assigned offline self-checks, report conditional/skipped checks honestly, and hand off to a fresh independent validator."
    ],
    "openQuestions": [
      "Live exact IDs, approved main image/model values, and validated output/thinking settings remain intentionally unresolved until operator execution.",
      "If opencode.json already has a provider when the live procedure is run, stop and request a new reviewed merge decision; this plan does not authorize overwriting or deep-merging it.",
      "Advisory endpoint catalog/routing profile activation is out of scope; the quickstart configures project-native providers only."
    ],
    "traceArtifactPath": ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/planner/plan-quickstart-planner-003.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/planner/plan-quickstart-planner-003.md",
      ".memory/orchestrations/2026-08-23-local-ai-node-quickstart/roles/researcher/research-current-contracts-researcher-002.md"
    ]
  },
  "handoff": {
    "nextRole": "implementer",
    "limitations": "Planning only. No implementation files were edited and no final, live, schema-activation, Compose, SSH, endpoint, or acceptance validation was performed. Caller routing metadata was absent and no routing values were invented.",
    "risks": "The implementer must confirm exact current CLI grammar, keep opencode.json unchanged before discovery, and avoid turning unresolved values into executable placeholders. Independent command-backed validator evidence remains mandatory."
  }
}
```
