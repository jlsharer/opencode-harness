# Role Trace Artifact

## Metadata
- orchestrationId: `2026-07-19-config-validation-compose-routing`
- role: `researcher`
- artifactId: `compose-researcher-002-runtime-parameters`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: Scoped read-only research request covering the external llama-server Compose topology, parameterization and multi-instance options, current Compose and llama.cpp semantics, router mode, harness endpoint/provider identity, examples, checks, risks, and uncertainty.
- Required context present: Yes. The scoped question, source constraints, freshness requirement, downstream needs, relevant paths, orchestration/artifact IDs, and required trace path were supplied.
- Routing metadata status: absent. No routing values were invented. Supplied resolved harness context (`agent=researcher`, unresolved/inherited model, `variant=research`, `source=commandOverride`) is context only.

## Work Performed
- Summary: Read the external Compose file and its only sibling listing, resolved the current Compose model, inspected the locally cached image identity/help, compared it with pinned authoritative llama.cpp source/docs and current Docker Compose docs, and tied the resulting topology choices to the named local-model design. No external project file was changed.
- Files read:
  - `/home/joshl/docker/llama-server/compose.yaml`
  - `/home/joshl/models/qwen/Qwen3.6-35B-A3B/` directory listing
  - `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md`
  - `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`
  - memory protocol, researcher role contract, trace schema, and role trace template
- Files changed: Only this required trace artifact. External project remained read-only.
- Commands/checks:
  - `docker compose version`; Docker client version
  - `docker compose config`, `config --environment`, `config --images`, and `config --services`
  - `docker image inspect ghcr.io/ggml-org/llama.cpp:server-cuda ...`
  - image and host `llama-server --version`
  - image `llama-server --help`
  - `docker compose ps --all`
  - `nvidia-smi --query-gpu=...`
  - Read-only URL retrieval and line localization against pinned llama.cpp source/docs

## Output Contract
- Outputs: Cited findings, source list, minimal and scalable topology patterns, exact example invocations, implementation implications, validation commands, security/path caveats, risks, tradeoffs, and unresolved questions.
- Evidence: Local topology evidence is line-cited. Runtime semantics are tied to the locally cached image's reported commit `12127defda4f41b7679cb2477a4b0d65ee6a0c8f` (build 10015), current upstream commit `571d0d540df04f25298d0e159e520d9fc62ed121` as of 2026-07-19, and current authoritative Docker documentation.
- Artifact links: `.memory/orchestrations/2026-07-19-config-validation-compose-routing/roles/researcher/compose-researcher-002-runtime-parameters.md`

## Cited Findings

### 1. Current external topology is one hard-coded, mutable-image, all-GPU server

**Direct evidence.** `/home/joshl/docker/llama-server/compose.yaml` has one service key and fixed container name (`llama-server`) at lines 1-5, publishes host port 8080 to container port 8080 at lines 7-8, bind-mounts one host model directory read-only at lines 10-11, requests every NVIDIA GPU at lines 13-20, and supplies one fixed model and fixed runtime arguments at lines 22-44. The configured values are:

- model: `/models/Qwen3.6-35B-A3B-UD-Q4_K_S.gguf` (lines 23-24)
- GPU layers: `999` (25-26)
- multi-GPU split: `layer`, `0.60,0.40`, main GPU `0` (27-32)
- context: `128000` (33-34)
- Flash Attention: `on` (35-36)
- K/V cache types: `q4_0` and `q4_0` (37-40)
- bind/listen: `0.0.0.0:8080` (41-44)

The only sibling is `compose.yaml`; there is no adjacent README, env file, or script. The mounted directory currently contains the named GGUF. `docker compose config` resolves the source to the absolute host path and reports `bind.create_host_path: true`. `docker compose ps --all` found no current Compose container, so no live endpoint behavior was validated.

The image tag is mutable: `ghcr.io/ggml-org/llama.cpp:server-cuda` (compose line 3). The locally cached image resolves to digest `sha256:0d6c600a69e8bdaafd7b91ed6db9160906ee8148ee12a609cf4d52b4e17aabe8`, entrypoint `/app/llama-server`, and reports llama.cpp build 10015, commit `12127defd` (full commit dated 2026-07-15). Current upstream `master` was `571d0d540df04f25298d0e159e520d9fc62ed121` dated 2026-07-18. Thus “current docs” and “the binary this Compose will use without pulling” are close but not identical. Pinning a tested digest is recommended rather than relying on the mutable tag.

### 2. Every required llama-server setting has a current CLI and environment-variable surface

**Direct evidence.** The pinned README for the actual image commit documents:

- model path `-m/--model` and `LLAMA_ARG_MODEL`; context `-c/--ctx-size` and `LLAMA_ARG_CTX_SIZE` (README lines 49 and 93 in the pinned file)
- K and V cache types `-ctk/--cache-type-k` and `-ctv/--cache-type-v`; accepted values include `q4_0`; default is `f16` (`tools/server/README.md` at image commit, lines 71-72)
- device selection and discovery (`--device`, `--list-devices`), GPU layers, split mode, tensor split, main GPU, and fit controls (lines 78-89)
- parallel slots `-np/--parallel` / `LLAMA_ARG_N_PARALLEL` and continuous batching enabled by default (lines 175-176)
- API model alias `-a/--alias` / `LLAMA_ARG_ALIAS`, host, and port (lines 184-188)
- router controls `--models-dir`, `--models-preset`, `--models-max`, and autoload (lines 215-218)
- official Compose environment-variable example (lines 297 onward)
- `/health` and `/v1/health`; 503 while loading and 200 when ready (lines 397 onward)

Pinned URL: <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/README.md#L49-L218>. The image's own `--help` reproduced these options, including current K/V cache names and values. The README also states that CLI arguments override corresponding llama environment variables. Therefore choose one configuration surface per option; do not set both and expect env-file values to win over the existing hard-coded `command`.

**Recommendation.** For a parameterized Compose template, use the documented `LLAMA_ARG_*` environment variables and remove the current `command` list. This makes env files naturally per-instance and avoids a second precedence layer. If the command list remains, interpolate each command value explicitly because command arguments override the llama env variables.

**Caveat.** `--ctx-size` is the server/model context allocation control, while `--parallel` is the number of server slots. The current server also has unified-KV, cache-RAM, batch/ubatch, and continuous-batching controls. Documentation does not establish that `N` slots each receive an independently guaranteed 128k context. Treat total/per-sequence usable context and VRAM as measured properties; inspect `/props`, `/slots`, logs, and OOM behavior. Harness `maxInFlight` should be no greater than a measured safe backend concurrency and is not made enforceable merely by setting `--parallel`.

### 3. Compose interpolation is suitable for one-instance templates, but not for dynamic service keys

**Direct evidence.** Docker Compose supports `${VAR}`, defaults (`:-`), required values (`:?`), and alternatives; interpolation is applied to YAML values, not keys. Source: [Compose Specification — Interpolation](https://docs.docker.com/reference/compose-file/interpolation/), especially “Interpolation applies only to YAML values, not to keys.” A service key therefore cannot be `${SERVICE_NAME}`. Container name, project name, image, host port, volume source, environment values, profile values, and command values can be interpolated because they are values.

Compose interpolation source precedence is shell, then explicit `--env-file`, then the default project `.env` when no `--env-file` is supplied. Multiple `--env-file` options are read in order and later files override earlier files. `docker compose config --environment` shows interpolation inputs. Source: [Docker — variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/). This interpolation source behavior is distinct from environment-variable precedence *inside* a container; see [Docker — environment precedence](https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/).

**Implication.** A per-instance env file can configure one static service key, but the logical identity should be the Compose project plus service, not a dynamically named service key. Use `-p llama-research` / `COMPOSE_PROJECT_NAME=llama-research` and `-p llama-coder` to isolate independently invoked copies. The project-name precedence is `-p`, `COMPOSE_PROJECT_NAME`, top-level `name`, then directory/file-derived defaults. Source: [Docker — project names](https://docs.docker.com/compose/how-tos/project-name/).

### 4. Fixed `container_name` blocks scaling and causes cross-project collisions

**Direct evidence.** Docker states: “Compose does not scale a service beyond one container if the Compose file specifies a `container_name`.” Source: [Compose services — `container_name`](https://docs.docker.com/reference/compose-file/services/#container_name). The current file sets `container_name: llama-server` (line 4). A second project using the same file also attempts the same daemon-global container name.

Even after removing `container_name`, `docker compose up --scale llama-server=N` creates identically configured replicas. Source: [`docker compose up`](https://docs.docker.com/reference/cli/docker/compose/up/) (`--scale`). Fixed host publication `8080:8080` also cannot be reused by every replica, and replicas cannot receive different model paths/aliases/contexts from one service definition. Thus Compose scaling is not the mechanism for heterogeneous named-model instances. It is only potentially useful for homogeneous replicas with dynamic/unpublished host ports and an explicit load balancer/service-discovery layer.

**Recommendation.** Omit `container_name`. Let Compose generate `<project>-<service>-1`; use project name and labels for operations. If an operator insists on a fixed name for a one-instance deployment, parameterize `container_name: ${CONTAINER_NAME:?set CONTAINER_NAME}`, but explicitly give up `--scale` and ensure global uniqueness.

### 5. Profiles select predefined services; they do not instantiate parameter matrices

**Direct evidence.** Profiles activate or suppress services already declared in the Compose model. Unprofiled services are always enabled; profiled services start when their profile is enabled, and explicitly targeting a service starts it even without profile activation. Source: [Docker — profiles](https://docs.docker.com/compose/how-tos/profiles/).

**Implication.** Profiles are useful for a small checked-in set such as `research`, `coder`, or `router`, but each service still needs an explicit key and explicit configuration. Profiles are not a scalable substitute for generated services or separate project invocations. They also increase drift if each service duplicates the full llama argument list.

### 6. GPU reservation and llama device selection are separate controls

**Direct evidence.** The current Compose grants all GPUs to the container (lines 13-20), then llama.cpp spreads work using split-mode/tensor-split/main-gpu (lines 27-32). Docker permits either `count` or `device_ids`, not both, and requires `capabilities: [gpu]`. Source: [Docker — GPU support](https://docs.docker.com/compose/gpu-support/). The actual image docs separately define llama `--device`, `--n-gpu-layers`, `--split-mode`, `--tensor-split`, and `--main-gpu` (pinned README lines 78-89).

The read-only host inventory observed two GPUs (approximately 16 GiB and 24 GiB). Device indices shown by host `nvidia-smi` differed from the CUDA order printed when the container image initialized CUDA. Therefore do not assume host index, container-visible index, and llama device name are interchangeable. Validate with `nvidia-smi` inside each container and `/app/llama-server --list-devices` under that same reservation.

**Recommendation.** For isolation, reserve explicit host `device_ids` per service and let only those devices be visible, then discover llama-visible names. For one model intentionally spanning both devices, retain `count: all` (or explicit two IDs) and parameterize tensor split. A comma-separated variable cannot become a YAML sequence; generate the device-reservation fragment or maintain explicit service definitions when the number of devices varies.

### 7. Current llama.cpp router mode is real process routing, not in-process weight switching

**Direct evidence.** The actual-image README exposes router controls (lines 215-218). In pinned source:

- model presets are loaded from cache, `--models-dir`, and `--models-preset` (`server-models.cpp` lines 337-352)
- per-model child arguments force a loopback child host, allocate a child port, and set the child alias to the model name (lines 196-204)
- POST routing parses JSON body field `model`, validates/autoloads it, and proxies to that named child (lines 1608-1624)
- unloaded models are loaded on demand (`ensure_model_ready`, lines 1179-1193)
- the router enforces `models-max` by unloading least-recently-used running models (`unload_lru`, lines 742-770)
- requests are proxied to a running child process/port (`proxy_request`, lines 1213-1228)
- router startup explicitly reports on-demand model loading (`server.cpp` lines 378-387)

Pinned source URLs:
- <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server-models.cpp#L196-L204>
- <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server-models.cpp#L742-L770>
- <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server-models.cpp#L1179-L1228>
- <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server-models.cpp#L1608-L1624>

**Conclusion.** Static single-model `llama-server` cannot switch its resident model by changing the request's `model` string; alias only names the already loaded model. Runtime model selection needs either (a) separate long-lived server processes/services and routing to different URLs, or (b) llama.cpp router mode, which itself spawns separate child server processes and may cold-load/evict models. Router mode is not “one process instantly swaps a model with no residency or latency cost.”

### 8. Separate endpoints fit the proposed harness named-local-model contract most directly

**Direct evidence.** The prior planner maps `qwen-research` to native model `llamacpp-research/qwen2.5-7b-instruct` at `http://127.0.0.1:8080/v1` and `qwen-coder` to `llamacpp-coder/qwen2.5-coder-7b` at `http://127.0.0.1:8081/v1` (planner artifact lines 65-80). It explicitly distinguishes catalog URL, provider ID, process, device, resident model, and slot (lines 187-196), and requires native provider baseURL coherence rather than letting harness policy create transport (lines 117-123).

**Recommendation.** Preserve these identity layers:

| Layer | Research instance example | Coder instance example |
|---|---|---|
| Harness catalog name | `qwen-research` | `qwen-coder` |
| Native provider ID | `llamacpp-research` | `llamacpp-coder` |
| llama API alias/model ID | `qwen-research` (or exact planned suffix) | `qwen-coder` |
| OpenCode model | `llamacpp-research/qwen-research` | `llamacpp-coder/qwen-coder` |
| Endpoint | `http://127.0.0.1:8080/v1` | `http://127.0.0.1:8081/v1` |
| Compose project | `llama-research` | `llama-coder` |

The alias must equal the model suffix OpenCode sends. The provider prefix selects transport/baseURL; llama.cpp sees the request body model/alias, not the OpenCode provider prefix.

**Router alternative.** One router URL can expose several llama model names. Under the planner's proposed rules, entries sharing one canonical URL must share an endpoint-level `maxInFlight`, and provider IDs must remain coherent with one URL. This can reduce endpoint count and permit request-body model selection, but it combines admission/failure domains and introduces cold-load/LRU latency. It also needs a live proof that the chosen OpenCode OpenAI-compatible provider sends the exact model suffix in the body and handles router loading responses/timeouts. Separate endpoints remain the lower-risk initial fit for static role assignments and per-model GPU isolation.

## Topology and Parameterization Options

### Option A — minimal reusable one-instance Compose template (recommended baseline)

This pattern deliberately keeps a static service key, omits `container_name`, binds the published host port to loopback, mounts a model directory read-only without auto-creating a typo path, and uses llama's documented environment interface:

```yaml
name: "${COMPOSE_PROJECT_NAME:-llama-local}"
services:
  llama-server:
    image: "${LLAMA_IMAGE:-ghcr.io/ggml-org/llama.cpp:server-cuda}"
    restart: unless-stopped
    ports:
      - "127.0.0.1:${HOST_PORT:?set HOST_PORT}:8080"
    volumes:
      - type: bind
        source: "${MODEL_DIR:?set MODEL_DIR}"
        target: /models
        read_only: true
        bind:
          create_host_path: false
    environment:
      LLAMA_ARG_MODEL: "/models/${MODEL_FILE:?set MODEL_FILE}"
      LLAMA_ARG_ALIAS: "${MODEL_ALIAS:?set MODEL_ALIAS}"
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

Example instance files (operator-local, not committed with secrets):

```dotenv
# instances/research.env
COMPOSE_PROJECT_NAME=llama-research
HOST_PORT=8080
MODEL_DIR=/absolute/path/to/research-model
MODEL_FILE=research.gguf
MODEL_ALIAS=qwen-research
CTX_SIZE=32768
PARALLEL=2
CACHE_TYPE_K=q4_0
CACHE_TYPE_V=q4_0
FLASH_ATTN=on
GPU_LAYERS=all
TENSOR_SPLIT=0.60,0.40
```

```dotenv
# instances/coder.env
COMPOSE_PROJECT_NAME=llama-coder
HOST_PORT=8081
MODEL_DIR=/absolute/path/to/coder-model
MODEL_FILE=coder.gguf
MODEL_ALIAS=qwen-coder
CTX_SIZE=32768
PARALLEL=1
CACHE_TYPE_K=q8_0
CACHE_TYPE_V=q8_0
FLASH_ATTN=on
GPU_LAYERS=all
TENSOR_SPLIT=1
```

Exact invocations:

```sh
docker compose --env-file ./instances/research.env config -q
docker compose --env-file ./instances/research.env up -d --wait

docker compose --env-file ./instances/coder.env config -q
docker compose --env-file ./instances/coder.env up -d --wait
```

Because `COMPOSE_PROJECT_NAME` differs, these are independent projects using the same static service key. Host ports still must be unique. For stronger GPU isolation, replace `count: all` with explicit `device_ids` in a per-instance override; verify container-visible device numbering before setting llama `LLAMA_ARG_DEVICE`.

### Option B — generated explicit multi-service override (recommended scalable heterogeneous alternative)

Generate a deterministic Compose file from the harness/operator model catalog, with one explicit service key per normalized catalog name (`llama-research`, `llama-coder`, etc.). Each generated service gets an explicit host port, model bind, alias, context/slot/cache values, and device reservation. Then compose it with a small base holding image/restart/common labels:

```sh
docker compose -f compose.base.yaml -f generated/compose.models.yaml config -q
docker compose -f compose.base.yaml -f generated/compose.models.yaml up -d --wait
```

Docker merges files in command order; later files override scalar `command` and merge mappings, while ports are multi-value and can be concatenated. All relative paths resolve relative to the first/base Compose file. Source: [Docker — merge Compose files](https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/). Therefore a generator should emit complete service definitions or use `!reset`/`!override` only after confirming target Compose support; it must not accidentally append a second port mapping. Prefer absolute model paths or paths deliberately relative to the base.

Advantages: heterogeneous models are visible in one `docker compose ps`, profiles can select predefined groups, health checks can be per service, and device IDs are proper YAML sequences. Costs: a generator/schema becomes an owned artifact; port, alias, provider, and catalog uniqueness must be validated; generated files must not contain secrets or private paths if retained in harness memory.

### Option C — llama.cpp router mode (dynamic request-body model routing)

Run one externally published router with `/models` mounted and either `LLAMA_ARG_MODELS_DIR` or a trusted `LLAMA_ARG_MODELS_PRESET`, set `LLAMA_ARG_MODELS_MAX` according to measured simultaneous residency, and omit `LLAMA_ARG_MODEL`. The router discovers presets/models, spawns child servers on loopback ports, routes by request JSON `model`, autoloads, and LRU-evicts at the limit.

This is appropriate only if one URL and shared lifecycle are desired. It does not remove per-model child processes or memory accounting. Validate preset trust, cold-load timeout, concurrent load races, LRU effects, per-model arguments, GPU sharing, and whether one endpoint-level harness budget is acceptable. For stable always-resident role models on separately assigned GPUs, explicit services are simpler and more failure-isolated.

## Implementation Implications for the Planner

1. **Parameter contract.** At minimum require: image digest/tag, absolute `MODEL_DIR`, `MODEL_FILE`, API alias, unique loopback host port, context, parallel slots, K/V cache type, Flash Attention policy, GPU layers, Compose GPU reservation, and llama device/split controls. Optional but operationally important: batch/ubatch, unified KV, cache RAM, metrics/slots, API key file, timeout, and healthcheck.
2. **Identity validation.** Enforce unique catalog name, native `provider/model`, alias, host port, and Compose project/service identity. Check that model suffix equals the llama alias and provider baseURL equals `http://127.0.0.1:<host-port>/v1` for separate endpoints.
3. **No transport mutation by harness routing.** Compose is operator/deployment configuration. The named catalog's URL remains expected-endpoint evidence; native OpenCode provider configuration owns actual baseURL, consistent with planner lines 117-123.
4. **Admission mapping.** `PARALLEL` is backend slots; catalog `maxInFlight` is cooperative orchestration admission. Start with `maxInFlight <= PARALLEL`, then lower it based on benchmark evidence. Shared router URL means a shared endpoint budget under the proposed planner contract.
5. **Restart/recreate semantics.** Changing model path, alias, context, slots, cache type, or GPU arguments requires container recreation; `docker compose up` recreates changed service configuration. A static server does not adopt another model from a request alias.
6. **Image reproducibility.** Record both digest and llama commit/build in generated metadata. Re-run `--help` and live checks before adopting new cache values or router behavior.
7. **Generation safety.** If generating overrides, make output deterministic, validate with `docker compose config`, avoid embedding API/HF keys, and do not retain private absolute model paths in public artifacts.

## Validation Commands for a Later Validator/Operator

Static/resolution checks (safe before starting):

```sh
docker compose version
docker compose --env-file ./instances/research.env config -q
docker compose --env-file ./instances/research.env config --services
docker compose --env-file ./instances/research.env config --images
docker compose --env-file ./instances/research.env config > /tmp/llama-research.resolved.yaml
```

Inspect the resolved file locally for loopback host publication, read-only bind, expected alias/model, no fixed `container_name`, expected GPU request, and absence of secrets. `config --environment` is useful for diagnosis but can disclose environment values; do not archive it when secrets are present.

Runtime checks after approved start:

```sh
docker compose --env-file ./instances/research.env up -d --wait
docker compose --env-file ./instances/research.env ps
docker compose --env-file ./instances/research.env logs --no-log-prefix llama-server
curl --fail --silent http://127.0.0.1:8080/v1/health
curl --fail --silent http://127.0.0.1:8080/v1/models
curl --fail --silent http://127.0.0.1:8080/props
curl --fail --silent http://127.0.0.1:8080/slots
docker compose --env-file ./instances/research.env exec llama-server nvidia-smi
docker compose --env-file ./instances/research.env exec llama-server /app/llama-server --list-devices
```

Then send a minimal OpenAI-compatible chat request whose JSON `model` is exactly `qwen-research`, followed by one real OpenCode child task that proves provider/model selection and required tool calling. When API auth is enabled, source the key from a protected local mechanism and do not place it in Compose interpolation output, shell history, logs, or memory. Health alone is insufficient; benchmark concurrent 1..N requests and record TTFT, throughput, errors, queue/slot state, context high-water, and peak RAM/VRAM before setting `maxInFlight`.

## Risks and Caveats

- **Network exposure:** current `"8080:8080"` publishes on all host interfaces by default, while the server binds `0.0.0.0`. For host-local OpenCode, publish `127.0.0.1:<port>:8080`. The container must generally bind `0.0.0.0` to be reachable through bridge publishing; this does not require all-interface host publication. Add an API key/TLS/reverse proxy when crossing trust boundaries.
- **Secrets:** `.env` and `--env-file` are not secret stores. Compose interpolation and `docker inspect` can expose values. Prefer an API-key file mounted read-only or an approved secret mechanism; never commit HF/API keys.
- **Path correctness:** require an existing absolute directory and `create_host_path: false`; otherwise a typo can become an empty host directory. Mount the narrowest directory read-only. Do not retain private machine paths in shared traces.
- **Mutable image:** a future pull of `server-cuda` can change flags, defaults, model behavior, CUDA compatibility, or router semantics. Pin and record digest/commit.
- **Cache quantization:** `q4_0` remains accepted for both K and V in the actual image, but acceptance is not proof of quality, model/backend compatibility, or sufficient precision. Keep Flash Attention explicit where tested and compare quality/performance against `f16`/`q8_0`.
- **Context/slots/VRAM:** 128k context plus multiple slots can dominate KV memory. Two independent services can duplicate weights and buffers. One router can also hold several child processes simultaneously. Neither URL count nor session count predicts safe VRAM.
- **GPU identity:** host IDs, NVIDIA visibility order, and llama `CUDA0`/`CUDA1` can differ. Validate in-container ordering before applying tensor splits or main-GPU indices.
- **Compose scaling:** fixed name and fixed host port prevent scaling; homogeneous scale still cannot assign per-replica model identity. Do not use `--scale` as heterogeneous routing.
- **Profiles:** profiles are activation switches, not dynamic service generation.
- **Router cold starts and eviction:** request-selected models can block while loading and can evict the LRU model at `models-max`; this can violate harness latency and concurrency assumptions. Shared router is also one external failure domain.
- **OpenCode compatibility:** router mode depends on the provider sending the intended request body `model` and tolerating loading behavior. This was not live-validated.

## Source List

### Local/direct
1. `/home/joshl/docker/llama-server/compose.yaml`, lines 1-44.
2. `/home/joshl/models/qwen/Qwen3.6-35B-A3B/` directory listing.
3. `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/planner/root-planner-003-multi-local-design.md`, especially lines 65-93, 117-123, and 187-196.
4. `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`, especially lines 45-85, 150-181, and 204-250.
5. Local Docker Compose `v2.40.3-desktop.1`, Docker client `29.0.1`; cached llama image digest/build evidence reported above.

### Authoritative external
6. llama.cpp actual-image commit: <https://github.com/ggml-org/llama.cpp/commit/12127defda4f41b7679cb2477a4b0d65ee6a0c8f>.
7. llama.cpp pinned server README: <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/README.md>.
8. llama.cpp pinned router source: <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server-models.cpp> and <https://github.com/ggml-org/llama.cpp/blob/12127defda4f41b7679cb2477a4b0d65ee6a0c8f/tools/server/server.cpp>.
9. llama.cpp current upstream commit as of research: <https://github.com/ggml-org/llama.cpp/commit/571d0d540df04f25298d0e159e520d9fc62ed121> and current README at that commit.
10. Docker Compose interpolation: <https://docs.docker.com/reference/compose-file/interpolation/> and <https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/>.
11. Docker environment precedence: <https://docs.docker.com/compose/how-tos/environment-variables/envvars-precedence/>.
12. Docker service/container/scaling semantics: <https://docs.docker.com/reference/compose-file/services/#container_name> and <https://docs.docker.com/reference/cli/docker/compose/up/>.
13. Docker profiles, project names, merges, and GPU support: <https://docs.docker.com/compose/how-tos/profiles/>, <https://docs.docker.com/compose/how-tos/project-name/>, <https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/>, and <https://docs.docker.com/compose/gpu-support/>.

## Unresolved Questions

1. Which exact GGUFs, aliases, contexts, cache types, and measured slot counts will be approved for `qwen-research` and `qwen-coder`? The planner examples use model names different from the current external Qwen3.6 file.
2. Should production optimize for separately isolated always-resident endpoints or one router with cold-load/LRU behavior?
3. Which host GPUs should each model reserve, and what are the verified in-container llama device names/order?
4. Does the target OpenCode provider send the exact model suffix to llama.cpp router mode and handle model-loading latency/status correctly?
5. Are model directories and generated env/override files private operator assets, or is any sanitized deployment configuration intended for version control?
6. Is an API key required even for loopback, and what approved secret-delivery mechanism should be used?
7. What benchmarked endpoint-level `maxInFlight` is safe? No capacity value was established by this research.

## Recommended Next Role

`planner` should choose the baseline topology, freeze the parameter/identity schema, decide ownership of env/generated override files, and define executable validation gates. A later `validator` must perform Compose resolution and live endpoint/model/tool-use checks before acceptance; this research is not acceptance evidence.

## Handoff
- Next role: `planner`
- Limitations: No external edits, no container start, no model load, no API request, no OpenCode live routing proof, and no throughput/VRAM benchmark. Current Docker docs are rolling documentation without a page version; llama semantics were therefore pinned to both the actual cached image commit and the current upstream commit.
- Risks: Mutable image drift, accidental network exposure, secret leakage through env/config inspection, path typo auto-creation, provider/alias mismatch, GPU index mismatch, KV/context OOM or quality regression, false assumptions about slots, duplicate residency, and router cold-load/LRU behavior.
