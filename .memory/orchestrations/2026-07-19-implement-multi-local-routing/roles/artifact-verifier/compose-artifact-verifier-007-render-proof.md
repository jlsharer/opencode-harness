# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-implement-multi-local-routing`
- role: `artifact-verifier`
- artifactId: `compose-artifact-verifier-007-render-proof`
- createdAt: `2026-07-19T19:58:11-05:00`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract

- Inputs received: Compose artifact paths (`compose.yaml`, both `instances/*.env.example`, deployment `README.md`); expected temporary env/render tree; planner gate lines 201-222; render/assertion requirements; fresh `/tmp/opencode` directory and cleanup rules; external source hash preservation requirement.
- Required context present: Yes. All seven required artifact-verifier inputs were supplied, plus exact memory, contract, schema, trace, and planner references.
- Routing metadata status: absent. Caller-supplied enriched routing metadata labels were absent, so none were invented. Caller-resolved context was preserved separately: role `artifact-verifier`, advisory coder model, `artifact-proof` variant, local enforced false.

## Work Performed

- Summary: Independently rendered the repository-local Compose service as two named projects using fresh synthetic env files, parsed both normalized JSON documents, executed 67 explicit assertions, checked source-only `create_host_path: false`, checked generated and source artifacts for credential assignments and machine-private home paths, verified external and repository Compose hashes, and removed the successful temporary proof tree. No container lifecycle command was run.
- Files read: `.memory/protocols/memory-management.md`; `.opencode/contracts/role-io-contracts.json`; `.opencode/schemas/memory-trace-artifact.schema.json`; planner trace lines 201-222; `.opencode/deployments/llama-server/compose.yaml`; both env examples; deployment README; orchestration index; external `/home/joshl/docker/llama-server/compose.yaml` only through SHA-256.
- Files changed: This trace artifact only. Deliverables were not modified.
- Commands:
  - `docker compose version` -> `Docker Compose version v2.40.3-desktop.1`
  - Fresh directory: `mktemp -d "/tmp/opencode/compose-proof-XXXXXX"` -> `/tmp/opencode/compose-proof-Kdm7RF`
  - Planner's Node generator with digest `sha256:` plus 64 `1` characters, `MODEL_DIR=/tmp`, ports `8080`/`8081`, files `research.gguf`/`coder.gguf`, and aliases `qwen2.5-7b-instruct`/`qwen2.5-coder-7b`.
  - `docker compose -p llama-research --env-file "$TMPDIR/research.env" -f compose.yaml config -q` -> exit 0, no output.
  - `docker compose -p llama-research --env-file "$TMPDIR/research.env" -f compose.yaml config --format json > "$TMPDIR/research.json"` -> exit 0.
  - `docker compose -p llama-coder --env-file "$TMPDIR/coder.env" -f compose.yaml config -q` -> exit 0, no output.
  - `docker compose -p llama-coder --env-file "$TMPDIR/coder.env" -f compose.yaml config --format json > "$TMPDIR/coder.json"` -> exit 0.
  - Inline Node JSON/source assertion program -> exit 0, `ASSERTION_TOTAL=67`.
  - SHA-256 before/after checks; listing; successful cleanup; absence check.

## Output Contract

- Outputs: PASS. Temporary path, complete pre-cleanup listing and hashes, exact normalized render facts, assertion evidence, source hash proof, cleanup decision, limitations, and this trace path are recorded below.
- Evidence: Both Compose validation and render pairs exited zero; both JSON documents parsed; all 67 assertions passed; source YAML retained the non-normalized safety flag; source hashes matched their baselines; the temporary directory was removed after evidence capture.
- Artifact links: `.memory/orchestrations/2026-07-19-implement-multi-local-routing/roles/artifact-verifier/compose-artifact-verifier-007-render-proof.md`

### Temporary path and generated file listing

Temporary path: `/tmp/opencode/compose-proof-Kdm7RF`

Pre-cleanup exact listing:

```text
total 24
drwx------ 2 joshl joshl 4096 Jul 19 19:56 .
drwxr-xr-x 5 joshl joshl 4096 Jul 19 19:56 ..
-rw-r--r-- 1 joshl joshl  338 Jul 19 19:56 coder.env
-rw-r--r-- 1 joshl joshl 1738 Jul 19 19:56 coder.json
-rw-r--r-- 1 joshl joshl  344 Jul 19 19:56 research.env
-rw-r--r-- 1 joshl joshl 1750 Jul 19 19:56 research.json
```

Generated-file SHA-256 values:

```text
020a4d4feabc0e243c46462e67b3af9061f891838ccbb65b4694c53e1e623613  research.env
3d4699e5c4c0a1868eca54633b875c0baa85f0cebda8994d4b81cd0416c80034  coder.env
6b3d98e4b9ce1f51f693cf9dd23ba799865fdc912cbdf10a137bc156c532f85a  research.json
5acae1b29ebaaa3d7ecebd051abcdffbe2d3447523b7939b5db202e45b8ad591  coder.json
```

### Exact render evidence

| Fact | research render | coder render |
| --- | --- | --- |
| project | `llama-research` | `llama-coder` |
| services | exactly `llama-server` | exactly `llama-server` |
| image | `ghcr.io/ggml-org/llama.cpp@sha256:1111111111111111111111111111111111111111111111111111111111111111` | same |
| command | normalized `null` (no effective override) | normalized `null` (no effective override) |
| container_name | absent | absent |
| host IP | `127.0.0.1` | `127.0.0.1` |
| published -> target | `8080` -> `8080` | `8081` -> `8080` |
| bind | `/tmp` -> `/models`, `read_only:true`, normalized `bind:{}` | same |
| model | `/models/research.gguf` | `/models/coder.gguf` |
| alias | `qwen2.5-7b-instruct` | `qwen2.5-coder-7b` |
| internal host/port | `0.0.0.0` / `8080` | same |
| context / parallel | `8192` / `1` | same |
| cache K / V | `f16` / `f16` | same |
| flash / GPU layers | `auto` / `all` | same |
| split / tensor split / main GPU | `layer` / `1` / `0` | same |
| metrics | `true` | `true` |

Compose v2.40.3 normalized the explicit false-valued bind option to `bind:{}`. Independent source inspection returned exactly:

```text
.opencode/deployments/llama-server/compose.yaml:13:          create_host_path: false
```

### Exact assertion evidence

The assertion process exited 0 and printed `ASSERTION_TOTAL=67`. PASS sequence:

```text
1 source YAML explicitly sets create_host_path:false
2-18 research JSON parses; exact project; one service; null command; absent container_name; exact digest image; one port; loopback; published 8080; target 8080; one bind; /tmp source; /models target; read-only; no normalized create_host_path:true; exact model; exact alias
19-30 research exact environment: CTX_SIZE=8192, N_PARALLEL=1, CACHE_TYPE_K=f16, CACHE_TYPE_V=f16, FLASH_ATTN=auto, N_GPU_LAYERS=all, SPLIT_MODE=layer, TENSOR_SPLIT=1, MAIN_GPU=0, ENDPOINT_METRICS=true, HOST=0.0.0.0, PORT=8080
31-32 research generated env/render contain no credential assignment and no machine-private home path
33-49 coder JSON parses; exact project; one service; null command; absent container_name; exact digest image; one port; loopback; published 8081; target 8080; one bind; /tmp source; /models target; read-only; no normalized create_host_path:true; exact model; exact alias
50-61 coder exact environment: CTX_SIZE=8192, N_PARALLEL=1, CACHE_TYPE_K=f16, CACHE_TYPE_V=f16, FLASH_ATTN=auto, N_GPU_LAYERS=all, SPLIT_MODE=layer, TENSOR_SPLIT=1, MAIN_GPU=0, ENDPOINT_METRICS=true, HOST=0.0.0.0, PORT=8080
62-63 coder generated env/render contain no credential assignment and no machine-private home path
64 published ports are distinct
65 deliverables contain no credential assignments
66 deliverables contain no machine-private home paths
67 env-example model paths are the explicit non-real placeholders documented for replacement
ASSERTION_TOTAL=67
```

The security scan intentionally tests credential *assignments*, rather than rejecting README safety prose containing words such as “tokens” or “secrets.” The env examples contain documented placeholder paths, not real host paths; generated proof uses only `/tmp`.

### Source preservation hashes

External source Compose baseline and post-proof SHA-256 were identical:

```text
05d664779c2b0f6574335638d3f07eca84217b69d40017956f9bf828eebf1b6e  /home/joshl/docker/llama-server/compose.yaml
```

Repository-local Compose baseline and post-proof SHA-256 were identical:

```text
d2b0a09adf24a495833ceb46ff1ea5efb07d92b83ebd915dd322d5255a07ed70  .opencode/deployments/llama-server/compose.yaml
```

Repository-local Compose Git object hash remained `3efaa12408dd961f17859f43a12760a9bb2bc9bd`.

## Cleanup Decision

- Decision: Remove. Every render and assertion succeeded, so retention was not needed for diagnosis.
- Action: Removed `/tmp/opencode/compose-proof-Kdm7RF` recursively after this evidence was captured. Post-removal output: `CLEANUP_PASS path absent: /tmp/opencode/compose-proof-Kdm7RF`.
- Retained outside repository: None.
- Retained in repository: This trace/evidence file only.

## Handoff

- Next role: `validator` / parent orchestrator for acceptance; this artifact proof does not replace the separate validator gate.
- Limitations: This was offline structural proof only. No image pull, container start, network request, model load, OpenCode provider call, GPU check, model-quality check, tool-use proof, or capacity benchmark was performed. Compose normalization omits explicit false `create_host_path`, so that requirement is proved from source while read-only/type/target/source are proved from rendered JSON. The assertion block was run from the deployment directory; one subsequent combined hash display used a repository-relative path from that subdirectory and therefore emitted a harmless “No such file” for only the second display operand after all 67 assertions had already passed. The hash was immediately rerun from repository root and matched the baseline shown above.
- Risks: Runtime image compatibility, approved real digest/model availability, external provider coherence, GPU topology, and safe concurrency remain operator-dependent and outside this offline artifact gate.
