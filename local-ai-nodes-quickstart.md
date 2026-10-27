# Local AI nodes quickstart

This runbook starts a main node on the control host, a secondary node on
`josh-ai`, exposes the secondary only through the managed loopback tunnel, and
adds both discovered models to this harness project.

| Role | Host and checkout | Client endpoint |
| --- | --- | --- |
| Control/main | control host, `/home/joshl/ai-infrastructure/llama-server` | `http://127.0.0.1:8080/v1` |
| Secondary | `josh-ai`, `~/ai/llama-server` | remote `127.0.0.1:8080`; tunneled to control `127.0.0.1:8081` |
| Harness | control host, `/home/joshl/projects/opencode-harness` | project `opencode.json` |

Run each block on the named host and in the named directory. Keep one control
host shell open so its discovery and startup-ledger variables remain set.
`ai.sh` combines `compose.yaml`, the registry-selected node overlay, and that
node's private environment. Registry defaults make `main` local and execute
`secondary` in the declared `josh-ai:~/ai/llama-server` checkout. `tunnel.sh`
is the supported implementation of only `127.0.0.1:8081` to secondary
`127.0.0.1:8080`; do not substitute ad hoc Compose, SSH, or port-forwarding
commands.

Do not run plain `docker compose up`. Compose does not automatically load
`config/nodes/main.env` or `config/nodes/secondary.env`, so that command fails
with a missing `LLAMA_IMAGE` (and would also omit the node overlay). Use the
documented `./scripts/ai.sh --node <node> ...` commands; the wrapper selects the
private env file, Compose project, and node overlay together.

## Prerequisites and values

Before continuing, verify:

- Docker Engine, Docker Compose v2, NVIDIA drivers/runtime, and the approved
  model file are ready on each serving host.
- The `josh-ai` base SSH alias works, has no configured forwarding or
  `ClearAllForwardings=yes`, and the control host has a working user systemd
  manager.
- Both checkouts are at the paths in the topology table and contain the current
  node registry and wrappers.
- An operator has approved, for each node, the image digest, absolute model
  directory, model filename, context, parallelism, and any GPU settings.
- For each exact model, an independently validated output limit is a positive
  integer smaller than its context, and `enable_thinking` is explicitly either
  `true` or `false`.

Public examples are templates. Placeholders, example aliases and filenames,
display names, and configured values do not prove a live model ID. Do not put
credentials or private absolute model paths in this document or tracked files.

Initialize a three-resource ledger in the control-host shell. Later steps set
an entry to `yes` only after this procedure starts that resource.

| Resource | Pre-state (record only after its status gate) | Started by this procedure |
| --- | --- | --- |
| Main service | healthy/running or clearly stopped | `STARTED_MAIN` |
| Secondary service | healthy/running or clearly stopped | `STARTED_SECONDARY` |
| Secondary tunnel | healthy/running or clearly stopped | `STARTED_TUNNEL` |

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
STARTED_MAIN=no
STARTED_SECONDARY=no
STARTED_TUNNEL=no
```

## Private environment files

Create files without replacing an existing private file. On the control host,
the secondary copies provide registry validation and projection inputs; keep
their serving values consistent with the files in the remote checkout.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
for node in main secondary; do
  node_env="config/nodes/$node.env"
  projection_env="config/nodes/$node.opencode.env"
  if [[ ! -e $node_env ]]; then
    install -m 600 "config/nodes/$node.env.example" "$node_env"
  else
    chmod 600 "$node_env"
  fi
  if [[ ! -e $projection_env ]]; then
    install -m 600 config/nodes/opencode-projection.env.example "$projection_env"
  else
    chmod 600 "$projection_env"
  fi
  stat -c '%a %n' "$node_env" "$projection_env"
done
```

**Secondary host, `~/ai/llama-server`:**

```bash
cd ~/ai/llama-server
if [[ ! -e config/nodes/secondary.env ]]; then
  install -m 600 config/nodes/secondary.env.example config/nodes/secondary.env
else
  chmod 600 config/nodes/secondary.env
fi
if [[ ! -e config/nodes/secondary.opencode.env ]]; then
  install -m 600 config/nodes/opencode-projection.env.example config/nodes/secondary.opencode.env
else
  chmod 600 config/nodes/secondary.opencode.env
fi
stat -c '%a %n' config/nodes/secondary.env config/nodes/secondary.opencode.env
```

Use a local editor on each host to replace every example placeholder with its
operator-approved private value. Do not print these files. Before discovery,
`MODEL_ALIAS` is provisional; do not use a filename or example alias as an
OpenCode model ID. Projection output and thinking values must satisfy the
prerequisite gate. Keep all four control-host files and both remote files mode
`0600` and uncommitted.

In each server env, `MODEL_DIR` is the existing absolute directory containing
the model. `MODEL_FILE` is the exact case-sensitive basename, not a path and
not a quoted value. It must start with an ASCII letter or digit, contain only
ASCII letters, digits, `.`, `_`, `+`, or `-`, and end in lowercase `.gguf`.

## Start main

First validate and inspect state. A failed or ambiguous result is a stop: fix
the private inventory or runtime instead of assuming the service is stopped.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
./scripts/ai.sh --node main validate
./scripts/ai.sh --node main status
```

Success evidence is `configuration preflight valid` and an unambiguous Compose
status. If the main service is clearly stopped, start it and update the ledger;
otherwise leave a healthy pre-existing service running. Do not use `restart`.

**Control host, same directory; run only when main was clearly stopped:**

```bash
./scripts/ai.sh --node main start
STARTED_MAIN=yes
./scripts/ai.sh --node main health
```

The health command must exit zero. If it does not, stop here and troubleshoot.

## Start secondary

These control-host wrapper calls follow the node registry to `josh-ai` and its
declared remote checkout. As above, a failed or ambiguous result is not proof
of a stopped service.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
./scripts/ai.sh --node secondary validate
./scripts/ai.sh --node secondary status
```

Success evidence is remote preflight success and an unambiguous Compose status.
If clearly stopped, start it and update the ledger; otherwise preserve it.

**Control host, same directory; run only when secondary was clearly stopped:**

```bash
./scripts/ai.sh --node secondary start
STARTED_SECONDARY=yes
./scripts/ai.sh --node secondary health
```

Stop if the wrapper health check does not exit zero.

## Start tunnel

Inspect the managed tunnel before changing it. Status exit `0` with `running:`
means pre-existing and healthy. Exit `1` with exactly `stopped: secondary`
means absent. Any other failure, an unmanaged tunnel, an occupied port 8081,
or an SSH forwarding-policy rejection is an abort.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
set +e
TUNNEL_STATUS=$(./scripts/tunnel.sh --node secondary status 2>&1)
TUNNEL_STATUS_RC=$?
set -e
printf '%s\n' "$TUNNEL_STATUS"
if [[ $TUNNEL_STATUS_RC -eq 0 ]]; then
  [[ $TUNNEL_STATUS == running:* ]] || exit 1
elif [[ $TUNNEL_STATUS_RC -eq 1 && $TUNNEL_STATUS == 'stopped: secondary' ]]; then
  ./scripts/tunnel.sh --node secondary start
  STARTED_TUNNEL=yes
else
  exit "$TUNNEL_STATUS_RC"
fi
./scripts/tunnel.sh --node secondary status
curl --fail --silent --show-error http://127.0.0.1:8081/health
```

Success requires healthy wrapper status and a successful client-side health
request. The wrapper enforces the protected SSH command; there is no raw SSH
fallback in this procedure.

## Discover model IDs

Discover IDs from live responses only after both health checks. The following
requires exactly one nonempty, unique string `id` from each response. Stop on
empty, duplicate, multiple, malformed, or unexpected inventory.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
MAIN_RESPONSE=$(./scripts/ai.sh --node main models)
SECONDARY_RESPONSE=$(./scripts/ai.sh --node secondary models)
TUNNELED_SECONDARY_RESPONSE=$(curl --fail --silent --show-error http://127.0.0.1:8081/v1/models)
extract_one_id='const fs=require("fs");const v=JSON.parse(fs.readFileSync(0,"utf8"));const ids=v?.data?.map(x=>x?.id);if(!Array.isArray(ids)||ids.length!==1||typeof ids[0]!=="string"||!ids[0]||new Set(ids).size!==ids.length)process.exit(1);process.stdout.write(ids[0])'
MAIN_ID=$(node -e "$extract_one_id" <<<"$MAIN_RESPONSE")
SECONDARY_ID=$(node -e "$extract_one_id" <<<"$SECONDARY_RESPONSE")
TUNNELED_SECONDARY_ID=$(node -e "$extract_one_id" <<<"$TUNNELED_SECONDARY_RESPONSE")
[[ -n ${MAIN_ID:?main model ID missing} ]]
[[ -n ${SECONDARY_ID:?secondary model ID missing} ]]
[[ $TUNNELED_SECONDARY_ID == "$SECONDARY_ID" ]]
printf 'main ID: %s\nsecondary ID: %s\n' "$MAIN_ID" "$SECONDARY_ID"
```

Confirm the two IDs are the intended operator-approved models. Then set
`MODEL_ALIAS` to the exact discovered ID in `main.env` and both copies of
`secondary.env`. Set each `.opencode.env` to the already validated positive
integer output limit and literal boolean thinking value. Do this in editors
without printing the files, keep mode `0600`, and re-run validation.

**Control host, same directory:**

```bash
./scripts/ai.sh --node main validate
./scripts/ai.sh --node secondary validate
```

## Generate and merge providers

The exporter, not a hand-authored example, creates provider IDs
`ai-infra-main` and `ai-infra-secondary`, loopback base URLs on ports 8080 and
8081, exact discovered model keys, integer limits, and boolean thinking
metadata. Generate an owner-only temporary file and validate it before merge.

**Control host, `/home/joshl/ai-infrastructure/llama-server`, then harness:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
umask 077
./scripts/export-opencode-projection.sh --node main --node secondary --dry-run
GENERATED_PROVIDER_FILE=$(mktemp "$PWD/.opencode.providers.XXXXXXXX.json")
trap 'rm -f -- "${GENERATED_PROVIDER_FILE:-}"' EXIT
./scripts/export-opencode-projection.sh --node main --node secondary --print native >"$GENERATED_PROVIDER_FILE"
chmod 600 "$GENERATED_PROVIDER_FILE"
GENERATED_PROVIDER_FILE=$(realpath "$GENERATED_PROVIDER_FILE")
cd /home/joshl/projects/opencode-harness
node bin/opencode-harness.mjs validate-inputs --provider-config "$GENERATED_PROVIDER_FILE"
```

Success is a zero exit from dry-run and provider-only validation. This is the
only use of `--provider-config`: it validates the temporary fragment before the
project merge. Never pass that option after `opencode.json` contains provider
configuration.

Require a clean destination, then merge only the generated `provider` object.
The script refuses an existing provider, any unexpected generated top-level
shape, wrong provider IDs or URLs, and any discovered-ID mismatch. It preserves
all existing project keys and values, writes a same-directory exclusive
temporary file, sets mode `0644`, and atomically renames it.

**Control host, `/home/joshl/projects/opencode-harness`:**

```bash
cd /home/joshl/projects/opencode-harness
git diff --quiet -- opencode.json
git diff --cached --quiet -- opencode.json
[[ -n ${MAIN_ID:?main model ID missing} ]]
[[ -n ${SECONDARY_ID:?secondary model ID missing} ]]
node - "$GENERATED_PROVIDER_FILE" "$MAIN_ID" "$SECONDARY_ID" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const [source, mainId, secondaryId] = process.argv.slice(2);
const destination = path.resolve('opencode.json');
const before = JSON.parse(fs.readFileSync(destination, 'utf8'));
const generated = JSON.parse(fs.readFileSync(source, 'utf8'));
if (Object.hasOwn(before, 'provider')) throw new Error('destination already has provider');
if (JSON.stringify(Object.keys(generated).sort()) !== JSON.stringify(['$schema', 'provider'])) throw new Error('unexpected generated shape');
if (generated.$schema !== before.$schema || !generated.provider || typeof generated.provider !== 'object' || Array.isArray(generated.provider)) throw new Error('invalid generated provider');
const expected = {
  'ai-infra-main': { id: mainId, url: 'http://127.0.0.1:8080/v1' },
  'ai-infra-secondary': { id: secondaryId, url: 'http://127.0.0.1:8081/v1' },
};
if (JSON.stringify(Object.keys(generated.provider).sort()) !== JSON.stringify(Object.keys(expected).sort())) throw new Error('wrong provider IDs');
for (const [providerId, wanted] of Object.entries(expected)) {
  const provider = generated.provider[providerId];
  if (provider?.options?.baseURL !== wanted.url) throw new Error(`wrong URL for ${providerId}`);
  if (JSON.stringify(Object.keys(provider.models ?? {})) !== JSON.stringify([wanted.id])) throw new Error(`wrong model ID for ${providerId}`);
}
const after = { ...before, provider: generated.provider };
for (const key of Object.keys(before)) {
  if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) throw new Error(`changed existing key ${key}`);
}
const temporary = `${destination}.tmp.${process.pid}`;
let fd;
try {
  fd = fs.openSync(temporary, 'wx', 0o600);
  fs.writeFileSync(fd, `${JSON.stringify(after, null, 2)}\n`);
  fs.fchmodSync(fd, 0o644);
  fs.fsyncSync(fd);
  fs.closeSync(fd);
  fd = undefined;
  fs.renameSync(temporary, destination);
} finally {
  if (fd !== undefined) fs.closeSync(fd);
  try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
NODE
rm -f -- "$GENERATED_PROVIDER_FILE"
trap - EXIT
```

## Restart and test

After modifying `opencode.json`, fully quit every running OpenCode process and
session. Configuration is loaded only at startup. Restart through the harness;
do not merely open another session in an already running process.

First prepare the exact runtime. This requires Linux, Node.js major version 24,
a trusted OpenCode version from `1.18.18` through `1.18.25`, the installed
harness package bytes, and a writable owner-only default cache ancestry.
`prepare` probes OpenCode and creates or verifies its exact-version local cache;
it does not contact a provider, authenticate, or download a model. On success it
exits zero and prints exactly one absolute path ending in
`/0.1.13/opencode-<exact-version>/runtime`. Stop on any failure or different
output.

**Control host, `/home/joshl/projects/opencode-harness`:**

```bash
cd /home/joshl/projects/opencode-harness
[[ $(node -p 'process.versions.node.split(".")[0]') == 24 ]]
PREPARED_RUNTIME=$(node bin/opencode-harness.mjs prepare)
OPENCODE_VERSION=$(opencode --version)
[[ $OPENCODE_VERSION == 1.18.18 || $OPENCODE_VERSION == 1.18.19 || \
   $OPENCODE_VERSION == 1.18.20 || $OPENCODE_VERSION == 1.18.21 || \
   $OPENCODE_VERSION == 1.18.22 || $OPENCODE_VERSION == 1.18.23 || \
   $OPENCODE_VERSION == 1.18.24 || $OPENCODE_VERSION == 1.18.25 ]]
[[ $PREPARED_RUNTIME == /*/0.1.13/opencode-$OPENCODE_VERSION/runtime ]]
[[ $PREPARED_RUNTIME != *$'\n'* && -d $PREPARED_RUNTIME ]]
printf 'prepared runtime: %s\n' "$PREPARED_RUNTIME"
```

The launcher itself does not edit the workspace, but spawned OpenCode commands
run in it and can modify workspace files or Git state. Before spawning OpenCode,
review and retain this baseline; after the tests, run the same status and diffs
and review every change against it. Do not continue if the baseline contains an
unrecognized change.

```bash
git status --short
git diff -- .
git diff --cached -- .
```

The following commands do not authenticate or prove model quality. Do not add
`--provider-config`.

**Control host, `/home/joshl/projects/opencode-harness`:**

```bash
cd /home/joshl/projects/opencode-harness
MAIN_MODEL="ai-infra-main/${MAIN_ID:?main model ID missing}"
SECONDARY_MODEL="ai-infra-secondary/${SECONDARY_ID:?secondary model ID missing}"
node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- models
MAIN_INVOCATION_OUTPUT=$(node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- run --model "$MAIN_MODEL" 'Reply with exactly: main-invocation-ok')
[[ $MAIN_INVOCATION_OUTPUT == main-invocation-ok ]]
SECONDARY_INVOCATION_OUTPUT=$(node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- run --model "$SECONDARY_MODEL" 'Reply with exactly: secondary-invocation-ok')
[[ $SECONDARY_INVOCATION_OUTPUT == secondary-invocation-ok ]]
printf '%s\n%s\n' "$MAIN_INVOCATION_OUTPUT" "$SECONDARY_INVOCATION_OUTPUT"
git status --short
git diff -- .
git diff --cached -- .
```

Model listing proves only loaded configuration. Each explicit invocation must
exit zero and its captured stdout must equal its requested `*-invocation-ok`
string exactly. This is basic activation evidence, not readiness, capacity,
tool-use quality, or production acceptance.

## Cleanup

Use the startup ledger in reverse order. Stop only resources marked `yes` by
this procedure; leave every pre-existing resource running. Preserve private
environment files and the intentional project provider merge.

**Control host, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
if [[ ${STARTED_TUNNEL:?startup ledger missing} == yes ]]; then
  ./scripts/tunnel.sh --node secondary stop
fi
if [[ ${STARTED_SECONDARY:?startup ledger missing} == yes ]]; then
  ./scripts/ai.sh --node secondary stop
fi
if [[ ${STARTED_MAIN:?startup ledger missing} == yes ]]; then
  ./scripts/ai.sh --node main stop
fi
./scripts/ai.sh --node main status
./scripts/ai.sh --node secondary status
set +e
./scripts/tunnel.sh --node secondary status
TUNNEL_POST_STATUS_RC=$?
set -e
[[ $TUNNEL_POST_STATUS_RC -eq 0 || $TUNNEL_POST_STATUS_RC -eq 1 ]]
```

Review post-cleanup state against the ledger. A status error other than the
documented stopped tunnel exit is a cleanup failure, not success.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Plain `docker compose up` reports missing `LLAMA_IMAGE` | This is the expected fail-closed result because plain Compose does not load the node env file. Do not export private values into the shell or create a repository `.env`; run `./scripts/ai.sh --node main validate` followed by `./scripts/ai.sh --node main start` (or use `secondary`) as documented. |
| `MODEL_FILE must be a safe GGUF basename` | Remove quotes and directory components from `MODEL_FILE`. Use only ASCII letters, digits, `.`, `_`, `+`, and `-`, begin with a letter or digit, and end in lowercase `.gguf`. If the actual filename violates this rule, rename it to a safe basename before continuing. |
| `model file is not ready` | On the serving host, edit that node's private env file. `MODEL_DIR` must be the existing absolute directory containing the model, and `MODEL_FILE` must be the exact case-sensitive `.gguf` basename, not a path. The combined entry must resolve to a readable regular file. Do not proceed until the private verification block below passes. |
| Placeholder or preflight rejection | Stop; replace every example placeholder from approved inventory, restore mode `0600`, and re-run `ai.sh validate`. |
| Output is not positive or is greater than or equal to context | Stop; independently validate a smaller positive integer output limit. |
| Served ID differs from filename, alias, or tunnel response | Trust neither guess; reconcile `/v1/models`, then repeat discovery and projection. |
| Port 8081 occupied or tunnel reported unmanaged | Do not kill or replace it; identify the owner and resolve outside this run. |
| `josh-ai` forwarding policy rejected | Use a dedicated base alias with no configured forwards and without `ClearAllForwardings=yes`. |
| OpenCode shows stale models | Fully quit all OpenCode processes, then restart through the harness. |
| Project provider plus `--provider-config` collision | Choose one path. This runbook uses project provider configuration after merge. |
| Health passes but generation is poor | Treat health as transport evidence only; test model capability separately. |

For a private, non-printing model-file check, run this on the serving host from
its checkout. Use `NODE=secondary` on the secondary host.

```bash
NODE=main
ENV_FILE="config/nodes/$NODE.env"
MODEL_DIR=$(node -e 'const fs=require("fs");const k=process.argv[2];for(const l of fs.readFileSync(process.argv[1],"utf8").split(/\r?\n/)){if(l.startsWith(k+"=")){process.stdout.write(l.slice(k.length+1));process.exit(0)}}process.exit(1)' "$ENV_FILE" MODEL_DIR)
MODEL_FILE=$(node -e 'const fs=require("fs");const k=process.argv[2];for(const l of fs.readFileSync(process.argv[1],"utf8").split(/\r?\n/)){if(l.startsWith(k+"=")){process.stdout.write(l.slice(k.length+1));process.exit(0)}}process.exit(1)' "$ENV_FILE" MODEL_FILE)
[[ $MODEL_DIR == /* && -d $MODEL_DIR ]]
[[ $MODEL_FILE =~ ^[A-Za-z0-9][A-Za-z0-9._+-]*\.gguf$ ]]
[[ -f $MODEL_DIR/$MODEL_FILE && -r $MODEL_DIR/$MODEL_FILE ]]
realpath -e -- "$MODEL_DIR/$MODEL_FILE" >/dev/null
printf 'model file ready\n'
```

If this stops before printing `model file ready`, correct the two entries in
the private env file, then rerun
`./scripts/ai.sh --node "$NODE" --local validate` on that serving host.

## Verification

The first group is offline/source validation and may be run without live nodes.
It does not prove private values or endpoint readiness.

**Infrastructure checkout, `/home/joshl/ai-infrastructure/llama-server`:**

```bash
cd /home/joshl/ai-infrastructure/llama-server
./tests/safety-validation.sh
./tests/tunnel-validation.sh
./tests/opencode-projection-validation.sh
./tests/opencode-harness-integration-validation.sh --harness-root /home/joshl/projects/opencode-harness
docker compose --env-file config/nodes/main.env.example -f compose.yaml -f compose.main.yaml config --quiet
docker compose --env-file config/nodes/secondary.env.example -f compose.yaml -f compose.secondary.yaml config --quiet
```

**Harness checkout, `/home/joshl/projects/opencode-harness`:**

```bash
cd /home/joshl/projects/opencode-harness
node .opencode/scripts/validate-harness.mts
git diff --check -- local-ai-nodes-quickstart.md opencode.json
```

After discovery/export, also run provider-only `validate-inputs` as shown before
merge. After merge and a full restart, `debug config`, model listing, and both
explicit model invocations are conditional live activation gates:

**Harness checkout, `/home/joshl/projects/opencode-harness`; live/conditional:**

```bash
cd /home/joshl/projects/opencode-harness
node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- debug config
node bin/opencode-harness.mjs run --workspace /home/joshl/projects/opencode-harness -- models
```

Stop at any failed gate. None of these checks alone establishes live readiness.
