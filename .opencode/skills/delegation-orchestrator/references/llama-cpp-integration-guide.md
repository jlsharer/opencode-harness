# llama.cpp Integration Guide for the OpenCode Harness

This document is reference guidance for operators who want to experiment with
llama.cpp as a local OpenAI-compatible model endpoint for OpenCode. It does not
change harness runtime behavior by itself. Any local provider, routing, model,
or server choice remains a user or operator configuration decision unless a
separate approved implementation changes harness runtime files.

## Scope

- Describe how llama.cpp `llama-server` can expose an OpenAI-compatible `/v1`
  endpoint for local OpenCode usage.
- Show local/user configuration examples that are not committed harness
  requirements.
- Summarize model download, quantization, multi-GPU, multi-process,
  multi-node, security, validation, and troubleshooting considerations.
- Cross-reference harness surfaces that should be checked before changing any
  runtime behavior.

## Non-goals

- Do not modify `opencode.json`, `.opencode/routing/harness-model-routing.example.json`,
  `.opencode/routing/resolve-model-routing.mjs`, commands, agents, plugins,
  schemas, or runtime behavior from this guide alone.
- Do not prescribe one official model, quant, context size, API key, port, or
  GPU layout for all harness users.
- Do not treat llama.cpp RPC as a production-safe distributed inference system.
- Do not store secrets, provider tokens, or private Hugging Face tokens in this
  repository.

## Harness surfaces to review before runtime changes

- `AGENTS.md`: project rules, delegated orchestration constraints, role names,
  and validation expectations.
- `opencode.json`: native OpenCode project configuration. This guide does not
  add providers to it.
- `.opencode/routing/harness-model-routing.example.json`: committed harness-owned
  model routing default, separate from native OpenCode config. The sibling
  `.opencode/routing/harness-model-routing.json` is an optional ignored override.
- `.opencode/routing/resolve-model-routing.mjs`: routing resolution helper.
- `.opencode/deployments/llama-server/`: localized, reusable Compose template,
  private env-copy instructions, and illustrative two-instance identity map.
- `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`:
  checklist for harness validation evidence.
- `.opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md`:
  restart and trust notes for changed OpenCode configuration.

## Harness routing and transport boundary

The committed v2 routing document contains an enabled illustrative local model
catalog but keeps `forceLocalForHarnessSubagents` false. Outside force mode,
resolver local selections are advisory: they can inform orchestration but do not
write local models into native agent configuration. The lifecycle module is
telemetry/guardrail logic only and does not activate routing or prove acceptance.

Validation reads the example explicitly and is deterministic regardless of an
operator override. To customize, copy the example to the ignored custom path,
edit it, validate that exact path with the resolver `--config` flag, then fully
quit and restart OpenCode. Implicit loads prefer custom over example and never
merge. A present unreadable, malformed, or semantically invalid custom file
fails closed without falling back; an explicit path never inspects siblings. If
both implicit files are absent, restore the example or run
`cp .opencode/routing/harness-model-routing.example.json .opencode/routing/harness-model-routing.json`.
The force-false example does not configure provider transport or mutate agents.

Native provider transport remains external merged OpenCode configuration. The
harness does not create providers, `baseURL` values, credentials, or model maps.
For a catalog-backed selection, the native provider prefix, declared model
suffix, and canonical `baseURL` must match the selected catalog identity.
Provider and model names in this guide and the deployment examples are
illustrative; they do not claim installed models or available infrastructure.

`OPENCODE_CONFIG` loads an additional config before project config, so it is not
a final override over conflicting project values. `OPENCODE_CONFIG_CONTENT` is
merged later, but inline content and shell history are unsuitable for secrets.
Use approved external configuration and secret handling. Quit and restart
OpenCode after changing config or plugins because existing sessions retain their
loaded configuration.

When an operator deliberately enables force-local mode, startup statically
assigns exactly the eight fixed harness subagents. The asynchronous config hook
preflights all selected agents, providers, models, and baseURLs before changing
any agent. A missing or mismatched relationship deliberately fails startup
without partial mutation or cloud fallback. Recover by correcting configuration
(using `OPENCODE_DISABLE_PROJECT_CONFIG=1` only as a temporary startup escape
hatch when necessary), then restart normally.

Catalog `maxInFlight` values are cooperative orchestration budgets, not runtime
semaphores or capacity guarantees. They are grouped by canonical endpoint URL;
entries sharing an endpoint must use the same budget. Keep budgets at or below
measured backend slots with operational headroom.

## Localized Compose baseline

`.opencode/deployments/llama-server/compose.yaml` defines one reusable static
`llama-server` service. Copy its two `instances/*.env.example` files to ignored
private `instances/*.env` files, replace the required image digest and absolute
private model paths, and run separate `llama-research` and `llama-coder` Compose
projects. The template uses unique loopback publications, a read-only model bind
with automatic host-path creation disabled, no fixed `container_name`, and no
overriding `command`. See its README for exact render/start/stop commands.

The NVIDIA capability reservation does not prove device isolation. Use a
reviewed explicit override with concrete device ids when isolation is required,
and verify in-container ordering before setting tensor split or main GPU values.
All checked-in aliases, ports, topology, image placeholders, and capacities must
be replaced or approved and measured by the operator.

This Compose baseline is static: image/model/alias/context/slot/cache/GPU changes
require recreation, and request `model` must match the resident server alias.
Request-time model loading is a different router-mode design with cold starts,
eviction, timeout, shared failure-domain, and provider-propagation risks; it must
be validated separately rather than inferred from this baseline.

## llama.cpp server basics

The official llama.cpp server (`llama-server`) provides an OpenAI-compatible
HTTP API. OpenCode can use that style of endpoint through an OpenAI-compatible
provider configuration when a user chooses to configure it locally.

Common server options from the official llama.cpp server documentation include:

- `-m <path>`: load a local GGUF model file.
- `-hf <repo[:quant]>`: download and load a model from a Hugging Face repo,
  optionally selecting a quant.
- `-hff <file>`: select an exact Hugging Face file from a repo.
- `-hft <token>` or `HF_TOKEN`: access gated or private Hugging Face models.
- `--offline`: prevent network access and use only locally available files.
- `-c <tokens>`: context size.
- `-n <tokens>`: generation limit.
- `-np <count>`: number of parallel slots.
- `--host <host>`: bind host. Prefer loopback for local-only use.
- `--port <port>`: listen port.
- `-a <alias>`: model alias exposed by the server.
- `--api-key <key>`: require an API key for requests.
- SSL flags: configure TLS certificate and key when exposing HTTPS directly.
- `--metrics`: expose metrics when operationally appropriate.

Example local-only server command:

```sh
llama-server \
  -hf ggml-org/gemma-3-4b-it-GGUF:Q4_K_M \
  -a local-llama \
  -c 8192 \
  -n 1024 \
  -np 2 \
  --host 127.0.0.1 \
  --port 8080 \
  --api-key "$LLAMA_CPP_API_KEY" \
  --metrics
```

For local-only development, bind to `127.0.0.1` rather than `0.0.0.0` unless
there is an explicit operational reason to expose the service.

## Local OpenCode provider example

The following is a local/user configuration example only. It is not a committed
harness requirement and should not be added to this repository without a
separate approved plan.

OpenCode documents OpenAI-compatible providers with the
`@ai-sdk/openai-compatible` package pattern. A user-level or local experimental
configuration can point at the llama.cpp server's `/v1` endpoint:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "llamacpp": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "llama.cpp local",
      "options": {
        "baseURL": "http://127.0.0.1:8080/v1"
      },
      "models": {
        "local-llama": {}
      }
    }
  },
  "model": "llamacpp/local-llama"
}
```

Confirm the exact OpenCode config shape against `https://opencode.ai/config.json`
before committing any project config. If only a personal experiment is needed,
prefer user-local config outside this repository. If `llama-server` uses
`--api-key`, the user-local provider `options.apiKey` must match that server
key; use an environment-backed secret workflow or another local-only mechanism
and do not commit secrets.

For the illustrative two-instance deployment, use distinct providers such as
`llamacpp-research` and `llamacpp-coder`, with model suffixes matching server
aliases and baseURLs matching `http://127.0.0.1:8080/v1` and
`http://127.0.0.1:8081/v1`. Treat those identities as examples and customize
the routing catalog and external providers together when actual models differ.

## Downloading specific models

- Hugging Face repo quant selection: use `-hf repo:quant`, for example
  `-hf ggml-org/gemma-3-4b-it-GGUF:Q4_K_M`.
- Exact file selection: use `-hff <file>` with the desired repo/file, for
  example when multiple GGUF files exist in one repo.
- Gated or private models: pass `-hft <token>` or set `HF_TOKEN` in the process
  environment. Do not commit tokens.
- Offline or predownloaded models: use `--offline` and ensure the file is
  already present in the local cache, or use a local GGUF path with `-m`.
- Local GGUF file: use `-m /path/to/model.gguf`.

## Quantization considerations

- The usual path for Hugging Face safetensors or PyTorch models is to convert
  the source model to GGUF, then quantize the GGUF.
- Prefer quantizing from a 16-bit or 32-bit source. Avoid requantizing an
  already quantized model because quality can degrade.
- `Q4_K_M` is a common example quant for memory-constrained local inference,
  but it is not universally best.
- Importance matrix (imatrix) quantization can reduce quality loss for some
  models and workloads when representative calibration data is used.
- Smaller quants reduce disk and memory use but can reduce quality. Larger
  quants improve quality at higher disk, RAM, and VRAM cost.
- Validate target quality with task-relevant prompts before relying on a quant
  for harness work.

## Multi-GPU guidance

For one model spread across multiple GPUs, inspect devices and tune split
options documented by llama.cpp:

```sh
llama-server --list-devices
llama-server \
  -m /models/model.gguf \
  --device CUDA0,CUDA1 \
  --n-gpu-layers 99 \
  --split-mode layer \
  --tensor-split 1,1 \
  --main-gpu 0 \
  --host 127.0.0.1 \
  --port 8080
```

Useful options include `--device`, `--list-devices`, `--n-gpu-layers`,
`--split-mode`, `--tensor-split`, and `--main-gpu`. Exact behavior depends on
the build backend, devices, memory, and model architecture.

For two separate models on the same machine, run two `llama-server` processes
on different ports. Isolate GPUs with `CUDA_VISIBLE_DEVICES` or `--device`:

```sh
CUDA_VISIBLE_DEVICES=0 llama-server -m /models/a.gguf --host 127.0.0.1 --port 8080
CUDA_VISIBLE_DEVICES=1 llama-server -m /models/b.gguf --host 127.0.0.1 --port 8081
```

Each OpenCode provider/model entry can then target the appropriate local port
in user config.

## Multi-node guidance

llama.cpp includes `ggml-rpc-server` and client-side `--rpc` support. The
official RPC documentation describes this as proof-of-concept, fragile, and
insecure. Treat it as experimental only, avoid exposing it to untrusted
networks, and do not use it as a harness requirement without separate risk
review.

Operationally, if OpenCode runs on a different host from `llama-server`, prefer
one of these approaches:

- Run `llama-server` bound to loopback on the model host and reach it through an
  SSH tunnel, for example forwarding local port 8080 to remote `127.0.0.1:8080`.
- Bind to a private interface only when required by the deployment environment,
  protect it with firewall rules, and use `--api-key` and TLS where appropriate.
- Keep remote localhost or SSH tunnel guidance as operational deployment
  guidance, not an official llama.cpp recipe.

Bind to loopback where possible. Do not expose unauthenticated inference APIs on
public networks.

## Security notes

- Keep `HF_TOKEN`, llama.cpp API keys, TLS private keys, and provider secrets out
  of the repository and orchestration memory.
- Prefer `--host 127.0.0.1` for local-only use.
- Use `--api-key` when any process outside the same trust boundary can connect.
- Use SSL flags or a trusted reverse proxy when crossing network boundaries.
- Treat prompts, completions, metrics, and logs as potentially sensitive.
- Do not add local provider config to `opencode.json` unless approved for the
  harness and validated against the OpenCode schema.
- Restart OpenCode after changing OpenCode configuration; running sessions keep
  already-loaded config.
- Do not describe `OPENCODE_CONFIG` as a final override; project config merges
  after it. Keep secrets out of later inline `OPENCODE_CONFIG_CONTENT` too.

## Validation checklist

Before relying on a local llama.cpp endpoint for harness work:

- Confirm `llama-server` starts and logs the expected model alias, context size,
  host, and port.
- Confirm the OpenAI-compatible `/v1` endpoint responds locally.
- Confirm `/v1/models` and an exact-alias request identify the intended model;
  health alone is not model or delegated tool-use proof.
- Confirm authentication behavior when `--api-key` is enabled.
- Confirm OpenCode provider configuration is user-local or otherwise approved.
- Confirm any project config change validates against `https://opencode.ai/config.json`.
- Run `node .opencode/scripts/validate-harness.mjs` before accepting harness
  runtime changes. Documentation-only changes may defer final validation to the
  assigned validator.
- Check `.opencode/skills/delegation-orchestrator/references/validation-checklist.md`
  for harness-specific acceptance evidence.
- Confirm no secrets, tokens, private paths, or runtime dependency on prior
  projection directories were introduced.
- For force-local activation, validate all eight native agent/provider/model/
  baseURL relationships before restart and expect startup to fail closed on any
  mismatch.
- Run an operator-approved delegated tool-using task per selected target and
  benchmark concurrency, quality, RAM, and VRAM before raising cooperative
  endpoint budgets. These live gates are not part of offline harness validation.

## Troubleshooting

- Connection refused: verify `llama-server` is running, `--host` and `--port`
  match the provider `baseURL`, and local firewalls allow the connection.
- 401 or 403: verify `--api-key` and the provider API key match.
- Model not found: verify `-a` alias and the OpenCode model id agree.
- Hugging Face download failure: verify repo name, quant suffix, `-hff` file
  name, network access, `HF_TOKEN`, and whether `--offline` is set.
- Out of memory: reduce context `-c`, reduce parallel slots `-np`, choose a
  smaller quant, reduce GPU layers, or use a smaller model.
- Poor answer quality: test a larger quant, avoid requantized files, use an
  imatrix quant when appropriate, or select a stronger model.
- Multi-GPU imbalance: inspect `--list-devices`, adjust `--tensor-split`,
  `--split-mode`, `--main-gpu`, and `--n-gpu-layers`.
- Remote access fails: prefer SSH tunneling to a loopback-bound server; if
  binding to a network interface, verify firewall, TLS, and API key settings.

## Official references

- llama.cpp server README:
  https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/server/README.md
- llama.cpp CLI README:
  https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/cli/README.md
- llama.cpp quantize README:
  https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/quantize/README.md
- llama.cpp build documentation:
  https://raw.githubusercontent.com/ggml-org/llama.cpp/master/docs/build.md
- llama.cpp RPC README:
  https://raw.githubusercontent.com/ggml-org/llama.cpp/master/tools/rpc/README.md
- OpenCode providers documentation:
  https://opencode.ai/docs/providers/
- OpenCode config documentation:
  https://opencode.ai/docs/config/
- OpenCode config schema:
  https://opencode.ai/config.json
