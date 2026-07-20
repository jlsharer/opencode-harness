# Role Trace Artifact

## Metadata
- orchestrationId: `2026-07-19-config-validation-compose-routing`
- role: `planner`
- artifactId: `compose-planner-004-dynamic-routing`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Approved goal, boundaries, research/prior-plan evidence, proposed paths, constraints, acceptance criteria, and routing status.
- Required context present: Yes; planner contract inputs are complete.
- Routing metadata status: absent. No values invented. Resolved context: agent `planner`, model unresolved/inherited, variant `planning`, source `commandOverride`.

## Work Performed
- Summary: Designed a read-only external Compose change, selected separate named projects as baseline, compared explicit services/router mode, and specified handoff gates.
- Files read: External `compose.yaml`; supplied researcher trace; prior multi-local planner trace; routing config; memory protocol, role contract, trace schema.
- Files changed: This trace only; no external or harness implementation file.
- Commands/checks: None; commands below are future gates, not validation evidence.

## Output Contract
- Outputs: Ordered plan, file contracts, dependencies, exact examples, alternatives, gates, assumptions, questions, and handoff.
- Evidence: Supplied research established current/image/Compose/llama semantics; prior plan established named provider/baseURL and URL-budget semantics.
- Artifact links: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/planner/compose-planner-004-dynamic-routing.md`

## Recommended Design
Baseline: reuse one static service template as independently named Compose projects with private env files and unique loopback ports. Remove `container_name`: it collides across projects and prevents scaling. Project plus service becomes operational identity.

Model, alias, image, context, slots, cache types, and GPU flags are **restart/recreate-time** settings (`up -d --force-recreate` when needed). A static server does not change resident weights from request `model`; that value must match its alias. Request-time selection requires router mode.

### Future `compose.yaml`
```yaml
services:
  llama-server:
    image: "${LLAMA_IMAGE:-ghcr.io/ggml-org/llama.cpp:server-cuda}"
    restart: unless-stopped
    ports: ["127.0.0.1:${HOST_PORT:?set unique HOST_PORT}:8080"]
    volumes:
      - type: bind
        source: "${MODEL_DIR:?set existing absolute MODEL_DIR}"
        target: /models
        read_only: true
        bind: { create_host_path: false }
    environment:
      LLAMA_ARG_MODEL: "/models/${MODEL_FILE:?set MODEL_FILE}"
      LLAMA_ARG_ALIAS: "${MODEL_ALIAS:?set provider model suffix}"
      LLAMA_ARG_HOST: "0.0.0.0"
      LLAMA_ARG_PORT: "8080"
      LLAMA_ARG_CTX_SIZE: "${CTX_SIZE:-8192}"
      LLAMA_ARG_N_PARALLEL: "${PARALLEL:-1}"
      LLAMA_ARG_CACHE_TYPE_K: "${CACHE_TYPE_K:-f16}"
      LLAMA_ARG_CACHE_TYPE_V: "${CACHE_TYPE_V:-f16}"
      LLAMA_ARG_FLASH_ATTN: "${FLASH_ATTN:-auto}"
      LLAMA_ARG_N_GPU_LAYERS: "${GPU_LAYERS:-all}"
      LLAMA_ARG_SPLIT_MODE: "${SPLIT_MODE:-layer}"
      LLAMA_ARG_TENSOR_SPLIT: "${TENSOR_SPLIT:-1}"
      LLAMA_ARG_MAIN_GPU: "${MAIN_GPU:-0}"
      LLAMA_ARG_ENDPOINT_METRICS: "${METRICS:-true}"
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```
Remove current `command`; CLI values override `LLAMA_ARG_*` and would create conflicting precedence. `:?` requires identity/path/port; `:-` supplies defaults. Pin approved deployments with `LLAMA_IMAGE=ghcr.io/ggml-org/llama.cpp@sha256:<approved-digest>` and record build/commit. Container `0.0.0.0` remains bridge-reachable while host publication is loopback-only.

`count: all` is the spanning baseline. `count` and `device_ids` are exclusive, and an env scalar cannot safely create a YAML list. Use explicit YAML overrides/services for isolation. Docker visibility and llama split/main-GPU settings are separate; verify in-container order.

### Env examples and invocation
Checked-in sanitized `instances/*.env.example`; real `instances/*.env` are ignored/operator-private.
```dotenv
# research.env.example
LLAMA_IMAGE=ghcr.io/ggml-org/llama.cpp@sha256:<approved-digest>
HOST_PORT=8080
MODEL_DIR=/absolute/existing/research/path
MODEL_FILE=research.gguf
MODEL_ALIAS=qwen2.5-7b-instruct
CTX_SIZE=32768
PARALLEL=2
CACHE_TYPE_K=q4_0
CACHE_TYPE_V=q4_0
FLASH_ATTN=on
GPU_LAYERS=all
SPLIT_MODE=layer
TENSOR_SPLIT=0.60,0.40
MAIN_GPU=0
```
```dotenv
# coder.env.example
LLAMA_IMAGE=ghcr.io/ggml-org/llama.cpp@sha256:<approved-digest>
HOST_PORT=8081
MODEL_DIR=/absolute/existing/coder/path
MODEL_FILE=coder.gguf
MODEL_ALIAS=qwen2.5-coder-7b
CTX_SIZE=32768
PARALLEL=1
CACHE_TYPE_K=q8_0
CACHE_TYPE_V=q8_0
FLASH_ATTN=on
GPU_LAYERS=all
SPLIT_MODE=layer
TENSOR_SPLIT=0.60,0.40
MAIN_GPU=0
```
Names/files are illustrative pending approval; aliases intentionally equal native model suffixes.
```sh
docker compose -p llama-research --env-file ./instances/research.env config -q
docker compose -p llama-research --env-file ./instances/research.env up -d
docker compose -p llama-coder --env-file ./instances/coder.env config -q
docker compose -p llama-coder --env-file ./instances/coder.env up -d
```
`-p` supplies project identity and outranks `COMPOSE_PROJECT_NAME`; shell variables outrank env files. Ports remain unique.

### Identity mapping
| Layer | Research | Coder |
|---|---|---|
| catalog | `qwen-research` | `qwen-coder` |
| provider | `llamacpp-research` | `llamacpp-coder` |
| alias/suffix | `qwen2.5-7b-instruct` | `qwen2.5-coder-7b` |
| OpenCode model | `llamacpp-research/qwen2.5-7b-instruct` | `llamacpp-coder/qwen2.5-coder-7b` |
| provider baseURL / expected URL | `http://127.0.0.1:8080/v1` | `http://127.0.0.1:8081/v1` |
| Compose project | `llama-research` | `llama-coder` |

Provider prefix selects native transport; llama sees suffix. Native provider config owns baseURL; harness routing compares expected URL and must not create transport. Catalog/provider/alias/project/process/device/slot are distinct. Start with `maxInFlight <= PARALLEL`, then benchmark lower.

## Alternatives

### Explicit multi-service/generated override
For fixed heterogeneous targets, use complete `compose.models.yaml` or deterministic `generated/compose.models.yaml` with explicit `research`/`coder` services, unique ports/aliases, and proper lists:
```yaml
services:
  research:
    image: "${LLAMA_IMAGE:-ghcr.io/ggml-org/llama.cpp:server-cuda}"
    ports: ["127.0.0.1:8080:8080"]
    environment: { LLAMA_ARG_MODEL: /models/research.gguf, LLAMA_ARG_ALIAS: qwen2.5-7b-instruct }
    deploy: { resources: { reservations: { devices: [{driver: nvidia, device_ids: ["0"], capabilities: [gpu]}] } } }
  coder:
    image: "${LLAMA_IMAGE:-ghcr.io/ggml-org/llama.cpp:server-cuda}"
    ports: ["127.0.0.1:8081:8080"]
    environment: { LLAMA_ARG_MODEL: /models/coder.gguf, LLAMA_ARG_ALIAS: qwen2.5-coder-7b }
    deploy: { resources: { reservations: { devices: [{driver: nvidia, device_ids: ["1"], capabilities: [gpu]}] } } }
```
The production file must include baseline mounts and all approved llama fields. Run `docker compose -f compose.models.yaml -p llama-models config -q`. Complete generated files are safer than merges: files interpolate separately, paths resolve from the first file, and port lists can append. Validate unique service/alias/port/provider-model/URL/device and no secrets.

`--scale` makes homogeneous replicas, not different models/env/ports/GPUs; fixed ports collide. Profiles only activate predefined services, not parameter matrices.

### Router mode
Use a separate file that omits `LLAMA_ARG_MODEL`:
```yaml
services:
  llama-router:
    image: "${LLAMA_IMAGE:-ghcr.io/ggml-org/llama.cpp:server-cuda}"
    ports: ["127.0.0.1:${HOST_PORT:-8080}:8080"]
    volumes:
      - {type: bind, source: "${MODELS_DIR:?set trusted MODELS_DIR}", target: /models, read_only: true, bind: {create_host_path: false}}
    environment:
      LLAMA_ARG_MODELS_DIR: /models
      LLAMA_ARG_MODELS_MAX: "${MODELS_MAX:-1}"
      LLAMA_ARG_HOST: 0.0.0.0
      LLAMA_ARG_PORT: "8080"
```
Router routes by request JSON `model`, spawns children, cold-loads, and LRU-evicts; it is not instant in-process switching. Freeze pinned-image discovery/preset names and per-child args. One URL reduces endpoint count but shares admission/failure domains and adds latency/GPU complexity. Shared-URL catalog entries require coherent provider/baseURL and equal endpoint budget. Prove provider model propagation/loading timeouts. Separate instances remain baseline.

## Ordered Plan
1. Freeze GGUFs, aliases, providers, URLs, ports, projects, image digest/build, GPU ownership, and private-file policy.
2. Implement baseline interpolation, remove `container_name`/`command`, add loopback and non-auto-created read-only mount.
3. Add sanitized templates and ignored private copies.
4. Resolve both projects; inspect image/port/model/alias/context/slots/cache/GPU/mount/exposure/secrets.
5. If isolating GPUs, add explicit complete services/override with `device_ids`; verify container order.
6. Start/prove each endpoint separately, then dual residency.
7. Prove provider/model/baseURL/expected-URL coherence and one real delegated tool-use task per target.
8. Benchmark cache types/concurrency; set `PARALLEL` and lower-or-equal `maxInFlight` with headroom.
9. Evaluate explicit aggregate/router only after baseline; router needs cold/warm/LRU mixed-model proof.
10. Integrator, reviewer, then validator provide acceptance evidence.

## File Contracts
- `compose.yaml`: exact baseline; one service, no fixed name/command/secrets.
- `instances/research.env.example`, `coder.env.example`: sanitized placeholders; aliases equal suffixes.
- `instances/*.env`: private, uncommitted.
- Optional `compose.models.yaml`/`generated/compose.models.yaml`: complete deterministic services and real YAML device lists.
- Optional `compose.router.yaml`: router-only, trusted directory/preset, bounded residency, pinned image.

## Dependencies and Assumptions
Identity/GPU/image/private-file approval precedes implementation; static resolution precedes startup; single endpoints precede dual residency; benchmarks precede admission; baseline precedes router. Assumes pinned image retains researched env names/cache values. Host-local use is assumed; remote use needs approved auth/TLS/firewall. `PARALLEL` is slots and `maxInFlight` cooperative admission, not capacity proof. Existing Qwen3.6 is not silently equated to illustrative Qwen2.5 IDs.

## Verification Gates
1. **Static/security**:
```sh
docker compose version
docker compose -p llama-research --env-file ./instances/research.env config -q
docker compose -p llama-research --env-file ./instances/research.env config > /tmp/research.yaml
docker compose -p llama-coder --env-file ./instances/coder.env config -q
docker compose -p llama-coder --env-file ./instances/coder.env config > /tmp/coder.yaml
```
Inspect for unique loopback ports, approved digest, exact values, narrow read-only existing binds, no fixed name/all-interface port/secret; delete outputs. Avoid archiving `config --environment`.

2. **Image/device**: record digest/version; verify `--help`; in exact reservation run `nvidia-smi` and `/app/llama-server --list-devices`. Fail unknown env/cache/GPU/order.

3. **Identity/readiness**:
```sh
curl --fail --silent http://127.0.0.1:8080/v1/health
curl --fail --silent http://127.0.0.1:8080/v1/models
curl --fail --silent http://127.0.0.1:8080/props
curl --fail --silent http://127.0.0.1:8080/slots
```
Repeat 8081; inspect Compose logs. Require approved alias/observations/no OOM; exact-alias chat plus real OpenCode tool-use task. Health alone is insufficient.

4. **Benchmark**: compare `f16`, `q8_0`, candidate `q4_0`; concurrency 1..N; short/long/common/divergent prompts; record cold/warm TTFT, latency, throughput, errors, slots/queue, context high-water, RAM/VRAM, quality, OOM. Repeat dual target. Accept only measured caps with headroom.

5. **Router-only**: verify trusted discovery/models, exact request names, cold/warm, same/different concurrency, LRU, child recovery, timeout/retry, memory, shared URL/provider/budget. Reject if unproved.

6. **Acceptance**: later validator supplies command-backed evidence. Defer benchmark/router only if production concurrency/router is also deferred. Run harness validator if this orchestration changes harness files; this plan is not harness validation.

## Security Cautions
Loopback only unless authenticated TLS proxy is approved. Env files are not secret stores; no API/HF keys in templates, output, history, logs, or memory. Require existing absolute paths and narrow read-only mounts. Pin digest. Benchmark cache quality/VRAM. Verify container GPU identity. Bound timeout/cancellation; no unsafe cross-endpoint retries for write tools.

## Open Questions
1. Final GGUFs/aliases and relation to current Qwen3.6?
2. Approved digest/build?
3. Shared or isolated GPUs and verified device names?
4. Approved context/cache/slots after quality/capacity tests?
5. Template/private-env or generator ownership?
6. Loopback only or API key/TLS?
7. Does provider propagate router model and tolerate loading?
8. Separate projects permanently or aggregate project?

## Handoff
- Next role: External `implementer` after owner approval/identity freeze; otherwise `synthesizer` for topology/GPU decisions; then integrator, reviewer, validator.
- Limitations: No implementation, resolution, startup, load, request, routing proof, benchmark, or final validation. Placeholders must not be deployed verbatim.
- Risks: Identity/precedence mismatch, mutable image, path/secret leakage, exposure, GPU mismatch, KV quality loss, OOM, duplicate residency, port/merge collision, router cold-load/LRU/shared failure.
