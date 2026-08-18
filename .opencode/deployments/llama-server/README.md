# Local llama-server Compose Template

This directory contains one reusable `llama-server` service. Run it as two separately named Compose projects to keep project, port, model, and process identity distinct. The checked-in names, aliases, ports, GPU settings, and capacities are illustrative; they do not claim that any model, image, or provider is installed.

## Prepare private instance files

From this directory:

```sh
cp instances/research.env.example instances/research.env
cp instances/coder.env.example instances/coder.env
```

The private `instances/*.env` copies are ignored; the `.env.example` templates remain tracked. In each private file:

- replace `LLAMA_IMAGE` with an operator-approved digest such as `registry/image@sha256:<64-hex-digest>`; do not use a mutable tag for an approved deployment;
- replace `MODEL_DIR` with an existing absolute private directory and `MODEL_FILE` with an approved GGUF filename;
- replace aliases, ports, topology, context, cache settings, and unmeasured capacities as required;
- keep `MODEL_ALIAS` equal to the suffix of the corresponding native OpenCode `provider/model` identity.

Do not put credentials, tokens, or other secrets in these files. The template publishes only to host loopback and mounts the model directory at `/models` read-only with automatic host-path creation disabled. The container listens on `0.0.0.0:8080` inside its bridge so loopback publication can reach it; this does not expose the host port on all interfaces.

## Render and operate two projects

Render before starting:

```sh
docker compose -p llama-research --env-file ./instances/research.env -f compose.yaml config -q
docker compose -p llama-coder --env-file ./instances/coder.env -f compose.yaml config -q
```

Start, recreate after restart-time setting changes, and stop each project independently:

```sh
docker compose -p llama-research --env-file ./instances/research.env -f compose.yaml up -d
docker compose -p llama-coder --env-file ./instances/coder.env -f compose.yaml up -d

docker compose -p llama-research --env-file ./instances/research.env -f compose.yaml up -d --force-recreate
docker compose -p llama-coder --env-file ./instances/coder.env -f compose.yaml up -d --force-recreate

docker compose -p llama-research --env-file ./instances/research.env -f compose.yaml down
docker compose -p llama-coder --env-file ./instances/coder.env -f compose.yaml down
```

The service intentionally has no `container_name` and no overriding `command`. Named projects provide operational identity, while image-supported `LLAMA_ARG_*` variables provide one configuration path. Image, model, alias, context, slot, cache, and GPU changes take effect on restart/recreation, not by changing a request's `model` value.

## Illustrative identity mapping

| Layer | Research example | Coder example |
| --- | --- | --- |
| routing catalog name | `qwen-research` | `qwen-coder` |
| native provider id | `llamacpp-research` | `llamacpp-coder` |
| server alias / model suffix | `qwen2.5-7b-instruct` | `qwen2.5-coder-7b` |
| native OpenCode model | `llamacpp-research/qwen2.5-7b-instruct` | `llamacpp-coder/qwen2.5-coder-7b` |
| provider baseURL / catalog URL | `http://127.0.0.1:8080/v1` | `http://127.0.0.1:8081/v1` |
| Compose project | `llama-research` | `llama-coder` |

Native provider transport belongs in approved external merged OpenCode config, not repository `opencode.json` and not this Compose file. Provider ids and model suffixes must match the routing catalog, and provider `baseURL` must match its catalog URL (apart from trailing-slash canonicalization).

The tracked routing catalog is `.opencode/routing/harness-model-routing.example.json`. To customize it privately, copy that file to `.opencode/routing/harness-model-routing.json`, edit the ignored copy, validate either path explicitly with `node .opencode/routing/resolve-model-routing.mjs --config <path> --metadata-json '{"command":"/delegate-implement"}'`, then fully quit and restart OpenCode. Implicit loading chooses custom before example without merging and does not fall back when a present custom file is unreadable, malformed, or invalid. If neither file exists, restore the example or use the documented copy command. The force-false example does not configure provider transport or mutate native agents.

`OPENCODE_CONFIG` loads an additional config before the project config; it is not a final override over project settings. Avoid conflicting project keys. `OPENCODE_CONFIG_CONTENT` is merged later, but inline config and shell history are poor places for secrets. Use an approved secret mechanism.

## Capacity and GPU cautions

`PARALLEL` configures backend slots. Routing `maxInFlight` is only a cooperative dispatch budget, not an enforced semaphore or capacity proof. Budgets are grouped by canonical endpoint URL; catalog entries sharing one URL must use the same budget. Benchmark real workloads with headroom before increasing either value.

The illustrative committed research budget is `2`, while this deliberately conservative env template starts at `PARALLEL=1`; that is not a capacity claim or an activation-ready pairing. Before force activation, operators must reconcile routing budgets with measured slots (normally keeping `maxInFlight <= PARALLEL` with headroom) or lower the catalog budget. The coder examples both start at `1`, but still require measurement.

The NVIDIA reservation requests GPU capability and `count: all`; it does not prove per-project GPU isolation or a safe split. For isolation, use an operator-owned, explicitly reviewed Compose override with concrete `device_ids` (which cannot be combined with `count`) and verify device order inside the container. Keep llama tensor-split and main-GPU settings aligned with that verified topology.

This baseline is static: each project keeps one resident model and the request model must match its alias. Request-time model loading requires a separately designed router deployment, with cold-load, eviction, timeout, shared-failure-domain, provider propagation, and equal shared-endpoint budget validation.

## Activation and proof

The committed routing policy keeps force-local activation false. Outside force mode, resolver local choices are advisory and do not configure native agents. Enabling force mode statically configures exactly the four harness subagents during startup, after atomic agent/provider/model/baseURL preflight. A mismatch deliberately fails startup rather than falling back; correct the external provider or policy configuration and quit/restart OpenCode. Config and plugin changes are loaded only on restart.

Health output alone does not prove the expected model identity, tool use, quality, or capacity. Operator-dependent live acceptance should verify `/v1/models`, exact-alias inference, one delegated tool-using task per selected target, and measured concurrency/VRAM behavior. Offline harness validation does not start these servers.
