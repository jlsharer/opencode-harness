```json
{
  "orchestrationId": "2026-08-19-test-local-ai-nodes",
  "role": "validator",
  "artifactId": "review-operator-runbook-validator-003",
  "createdAt": "2026-08-19T15:39:09Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh validator packet in review mode identifying the planner runbook as the changed file and requiring static command, schema, safety, activation, rollback, and trace-contract review without live operations.",
    "requiredContextPresent": "yes; changed file, verification criteria, commands, schemas, acceptance standard, expected warnings, skipped-check policy, risks, artifact expectations, path relationships, workspace root, and trace root were supplied",
    "routingMetadataStatus": "absent",
    "workspaceRoot": "/home/joshl/ai-infrastructure",
    "traceRoot": "/home/joshl/projects/opencode-harness/.memory"
  },
  "workPerformed": {
    "summary": "Independently reviewed the planner runbook against current external integration, tunnel, ai.sh, registry, schemas, fixture, canonical infrastructure documentation, and committed harness CLI/documentation. Ran only static syntax/help, fixture, profile-shape, Git-state, JSON Schema, and direct role-output checks. No node, provider, SSH, tunnel, service, credential, OpenCode process, projection publication, binding creation, cache preparation, or workspace test mutation was invoked. Acceptance is rejected because cleanup can stop a managed tunnel that predated this run, and server-input mutation/start lacks the required concrete backup and owned-start rollback gates.",
    "filesRead": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      "bin/opencode-harness.mjs",
      "README.md",
      "/home/joshl/ai-infrastructure/llama-server/scripts/opencode-harness-integration.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/ai.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-start.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-stop.sh",
      "/home/joshl/ai-infrastructure/llama-server/scripts/tunnel-status.sh",
      "/home/joshl/ai-infrastructure/llama-server/tests/opencode-harness-integration-validation.sh",
      "/home/joshl/ai-infrastructure/llama-server/docs/opencode-harness-integration.md",
      "/home/joshl/ai-infrastructure/llama-server/README.md",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/nodes.tsv",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/main.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/secondary.env.example",
      "/home/joshl/ai-infrastructure/llama-server/config/nodes/opencode-projection.env.example",
      "/home/joshl/ai-infrastructure/llama-server/schemas/opencode-harness-binding.schema.json"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md"
    ],
    "commands": [
      "bash -n plus non-live --help for opencode-harness-integration.sh and ai.sh",
      "node --check bin/opencode-harness.mjs plus launcher --help",
      "/bin/bash -p llama-server/tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness",
      "git status --short and git diff --check in both repositories",
      "Python jsonschema validation of the researcher/planner fenced traces plus direct role-output/path checks",
      "Python Draft202012Validator.check_schema for opencode-harness-binding.schema.json",
      "Node in-memory mergeExternalRoutingDocuments plus normalizeAndValidateRoutingConfig check of the runbook-generated unwrapped profile"
    ]
  },
  "outputContract": {
    "outputs": "Adversarial review with an explicit FAIL decision, command-backed pass/fail matrix, two blocking rollback/ownership defects, schema and security results, corrections, skipped live checks, and residual risk.",
    "evidence": "Current parsers and offline fixtures accept the documented command grammar and generated profile. The blocking findings are direct behavior conflicts: tunnel.sh start treats an already-active managed tunnel as success (lines 135-140), while deactivate unconditionally calls tunnel-stop for every bound remote node (integration lines 407-412) and tunnel.sh stop stops an active unit (lines 160-171); the runbook always activates and later deactivates without recording pre-state. Separately, the canonical README requires verified backups before manual env changes (lines 127-158) and says an initial start is reversed with stop (lines 447-456), while the runbook edits both local and remote server envs, may start both services, and supplies neither concrete backup gates nor owned-start stop recovery.",
    "passFailMatrixOrFindings": [
      {
        "criterion": "Every wrapper, ai.sh, native forwarding command, flag, approval, and checkpoint order matches current parsers",
        "result": "PASS",
        "evidence": "Static help/syntax passed; the integration fixture ended 'OpenCode harness integration validation fixtures: PASS'. plan has no --yes; prepare-harness, bind, activate, and deactivate use --yes; run uses --ack-opencode-restarted and forwarded argv begins with models or run. main --local and secondary --remote are valid ai.sh selections."
      },
      {
        "criterion": "Private files, modes, binding capture, known node/provider identities, remote port, and expected outputs are accurate",
        "result": "PASS",
        "evidence": "Registry directly records main/local and secondary/remote via josh-ai, local port 8081 and remote port 8080. Wrapper requires profile/binding mode 0600 and emits the documented validation JSON and binding line. Exact model aliases and private values remain explicit operator inputs."
      },
      {
        "criterion": "Unwrapped advisory profile is structurally valid, uses emitted IDs, and keeps forceLocalForHarnessSubagents false",
        "result": "PASS",
        "evidence": "In-memory use of the committed routing merger and policy validator accepted the exact generated shape with ai-infra-main/ai-infra-secondary and force-local false. The runbook explicitly rejects wrapped examples as direct inputs."
      },
      {
        "criterion": "Server startup, tunnel activation, OpenCode execution, workspace mutation, and cleanup ownership are accurately and safely distinguished",
        "result": "FAIL",
        "severity": "blocking",
        "evidence": "Planner phases 7 and 11 always activate then deactivate. tunnel.sh lines 135-140 return success when the managed unit was already active; integration lines 407-412 and tunnel.sh lines 160-171 later stop that same unit. No pre-activation state/ownership gate prevents cleanup from stopping a pre-existing managed tunnel."
      },
      {
        "criterion": "Rollback covers partial activation and preserves unrelated service/workspace changes",
        "result": "FAIL",
        "severity": "blocking",
        "evidence": "Planner phase 1 edits local server envs and phase 6 edits the remote env and can start both services, but partialFailureRecovery provides only generic separately approved recovery and phase 11 intentionally leaves servers running. Canonical llama-server README lines 127-158 require verified local/remote backup gates before manual env changes, and lines 447-456 define stopping only a service initially started by this procedure. Those concrete gates and ownership records are absent."
      },
      {
        "criterion": "Authentication, provider response text, routing guarantees, and live readiness remain honestly unresolved",
        "result": "PASS",
        "evidence": "The runbook states native auth/config is environment-specific, promises no exact response text, treats delegation routing as observational/advisory, and does not promote offline fixtures to live readiness."
      },
      {
        "criterion": "No credential value, unsafe secret literal, accidental live invocation, or unsupported hard-local guarantee",
        "result": "PASS",
        "evidence": "Static inspection found no credential value or token-bearing example. josh-ai and 8081 are committed registry metadata, not secrets. Commands are prose inside a trace and were not executed live. force-local remains false."
      },
      {
        "criterion": "Researcher and planner traces satisfy trace schema and direct role output contracts",
        "result": "PASS",
        "evidence": "Python jsonschema plus role-contract/path checks passed both fenced JSON artifacts."
      }
    ],
    "commandOutputs": [
      "PASS: integration wrapper and ai.sh Bash syntax; help displayed the exact supported verbs/options.",
      "PASS: launcher node --check; help displayed prepare, validate-inputs, and run grammar.",
      "PASS: OpenCode harness integration validation fixtures; one existing-binding foreign-owner case skipped because chown privilege was unavailable.",
      "PASS: researcher and planner trace schema, required direct output fields, and trace paths.",
      "PASS: binding schema is a valid Draft 2020-12 schema.",
      "PASS: generated unwrapped profile shape with both committed provider IDs and force-local false.",
      "PASS: git diff --check in both repositories; git status confirms the external integration bytes are uncommitted and the orchestration traces are untracked."
    ],
    "schemaResults": [
      "memory-trace-artifact.schema.json: researcher PASS; planner PASS.",
      "role-io-contracts.json direct output fields/path: researcher PASS; planner PASS.",
      "opencode-harness-binding.schema.json meta-schema check: PASS.",
      "Generated routing profile through committed external merge and routing policy: PASS.",
      "Validator trace self-validation: required after write and reported in handoff."
    ],
    "securityAndActivationFindings": [
      "BLOCKING: deactivate has node scope but no per-run ownership receipt. With a pre-existing healthy managed secondary tunnel, activate succeeds as 'already running' and final deactivate stops unrelated pre-run state.",
      "BLOCKING: server env edits and initial starts are live operator-owned mutations without the canonical concrete backup/restore and started-by-this-run records needed for safe rollback.",
      "PASS: the wrapper does not start servers; the runbook distinguishes separate ai.sh authorization from activation.",
      "PASS: profile/projection/binding remain credential-free and native OpenCode authentication remains unresolved external state.",
      "WARNING: all current ai-infrastructure integration bytes reviewed here are uncommitted; results bind to current worktree bytes, not a committed external revision."
    ],
    "remediationList": [
      "Before activate, add a separately authorized tunnel-status pre-state gate. Require secondary's managed tunnel to be inactive before this test, or explicitly record that it pre-existed and skip wrapper deactivate for that node. The safest runnable path is to abort on any active or unhealthy pre-existing managed unit so activate/deactivate ownership is unambiguous.",
      "Before editing main.env or any existing local server input, add the canonical verified owner-only backup command and record an exact restore procedure. Before remote edits, require the deployment owner to complete and record the separately verified remote backup/restore gate described by the canonical README; do not proceed while it is an open question.",
      "Record main/secondary service pre-state and exactly which initial starts this run performed. On abandonment or rollback, stop only services started by this run when the approved rollback conditions hold; never stop pre-existing services. State whether successful final cleanup intentionally retains test-started servers or restores pre-state.",
      "After correction, rerun this bounded static review and trace schema/direct-output checks. Do not use live operations as remediation evidence."
    ],
    "skippedChecks": [
      "Private env/profile contents and actual file modes/ownership",
      "Live node and provider readiness",
      "SSH and native OpenCode authentication/configuration",
      "Docker/llama-server validate, status, start, health, models, and GPU operations",
      "Tunnel start, status, health, stop, and journal behavior on the real host",
      "Projection publication, binding creation, and harness cache preparation",
      "Real OpenCode provider discovery, direct/delegated requests, routing observations, response text, traces, and workspace mutation",
      "Live rollback and cleanup"
    ],
    "residualRisk": "Even after runbook correction, live model identity, capacity, response quality, auth, SSH/systemd behavior, same-UID races, unmanaged listeners, and workspace recovery remain unverified. The fixture chown-only branch was skipped for lack of privilege. Current external integration bytes remain uncommitted.",
    "traceArtifactPath": ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/validator/review-operator-runbook-validator-003.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/planner/synthesize-operator-runbook-planner-002.md",
      ".memory/orchestrations/2026-08-19-test-local-ai-nodes/roles/researcher/research-operator-commands-researcher-001.md"
    ]
  },
  "handoff": {
    "nextRole": "planner",
    "limitations": "Review mode only; no fixes or live operations were performed. Acceptance decision: FAIL until both ownership/rollback defects are corrected and independently revalidated.",
    "risks": "Using the current runbook can stop a managed tunnel that existed before the test and can leave server/config mutations without a concrete pre-state restoration path."
  }
}
```
