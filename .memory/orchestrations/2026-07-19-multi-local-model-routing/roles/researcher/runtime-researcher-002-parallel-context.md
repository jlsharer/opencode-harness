# Role Trace Artifact

## Metadata

- orchestrationId: `2026-07-19-multi-local-model-routing`
- role: `researcher`
- artifactId: `runtime-researcher-002-parallel-context`
- createdAt: `2026-07-19`
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`
- Freshness: OpenCode `67caf894e0843ee370e72839e8265e483233479b` (2026-07-19; package 1.18.3), llama.cpp `571d0d540df04f25298d0e159e520d9fc62ed121` (2026-07-18), and Ollama live docs inspected 2026-07-19 (FAQ path last changed at `dba1e27fa838e306d7cc6f9131f3a7792095b8d8`, 2026-07-03).

## Input Contract

- Inputs received: Scoped question, source/freshness constraints, relevant path, downstream needs, and exact artifact path.
- Required context present: Yes; contract, trace schema/template, memory protocol, and local guide were read.
- Routing metadata status: absent. Caller also reported resolved harness metadata agent=`researcher`, model unresolved/inherited, variant=`research`, source=`commandOverride`; these are not caller-supplied routing labels.

## Work Performed

- Summary: Inspected pinned upstream OpenCode and llama.cpp source, pinned AI SDK dependency source, authoritative Ollama docs, and the local secondary guide. Direct evidence and inference are labeled separately.
- Files read: Contract/schema/template; `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`; upstream paths cited below.
- Files changed: This trace artifact only.
- Commands/checks: Shallow/sparse clones under `/tmp/opencode`; `git rev-parse HEAD`; `git log -1`; targeted Glob/Grep/Read; WebFetch of authoritative docs and `ai@6.0.168` source; `git status --short`. No backend was launched and no RAM/VRAM benchmark was run.

## Output Contract

- Outputs: `citedFindings`, `sourceList`, `implementationImplications`, `risks`, `recommendedNextRole`, and `unresolvedQuestions` follow.
- Evidence: Commit-pinned source links and mutable authoritative docs are listed below.
- Artifact links: `.memory/orchestrations/2026-07-19-multi-local-model-routing/roles/researcher/runtime-researcher-002-parallel-context.md`

## Cited Findings

### A. OpenCode session/context ownership

**Direct evidence**

1. A fresh `task` creates a child session with `parentID`, agent, and permissions, then prompts that child with the delegation prompt. `task_id` reuses an existing child. The child uses the agent's explicit model, otherwise the parent assistant message's provider/model and variant. [OpenCode `task.ts` L136-L213](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/tool/task.ts#L136-L213)
2. Every turn converts that session's stored messages to model messages and passes the resulting array to the LLM request; `streamText` receives `prepared.messages`. [OpenCode `prompt.ts` L1257-L1286](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/session/prompt.ts#L1257-L1286), [`llm.ts` L280-L353](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/session/llm.ts#L280-L353)
3. Session rows persist parent/model/agent metadata, tokens, and timestamps in OpenCode's database. [OpenCode `session.ts` L57-L158](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/session/session.ts#L57-L158)

**Inference from those paths:** A child does not automatically receive the parent's full chat transcript; it starts with the supplied delegation prompt plus project/system instructions and subsequently owns its own history. OpenCode holds serialized history/request data in host memory while preparing/streaming and persists it to disk. The cited source does **not** show OpenCode loading weights or allocating inference KV cache/VRAM. An OpenCode session ID is not a backend KV-slot binding.

### B. Parallel delegation behavior

**Direct evidence**

1. OpenCode keeps runners keyed by session ID. Concurrent prompts for the same session join the existing run; distinct child session IDs have distinct runners. [OpenCode `run-state.ts` L35-L94](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/session/run-state.ts#L35-L94), [`runner.ts` L115-L138](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/effect/runner.ts#L115-L138)
2. Foreground is default. Experimental background subagents require `OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true`; background jobs fork immediately in a process-local registry. [OpenCode `task.ts` L92-L101, L273-L307](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/tool/task.ts#L92-L101), [core `background-job.ts` L113-L187](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/core/src/background-job.ts#L113-L187)
3. Default runtime delegates tool execution to AI SDK. OpenCode pins `ai@6.0.168`; its streaming transformation deliberately starts each tool execution without awaiting the prior call and waits for outstanding results before closing. [OpenCode `llm.ts` L271-L353](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/session/llm.ts#L271-L353), [`bun.lock` L1125](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/bun.lock#L1125), [pinned AI SDK source](https://unpkg.com/ai@6.0.168/src/generate-text/run-tools-transformation.ts)
4. `subagent_depth` defaults to 1 and limits nesting depth, not breadth. [OpenCode config schema L80-L86](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/core/src/v1/config/config.ts#L80-L86)

**Conclusion:** If a model emits multiple task calls in one streamed turn, they can overlap as independent child-session model requests. Background tasks can additionally overlap the parent. No breadth/in-flight cap was found in the cited task/background-job surface. Parallel capability still depends on the local model producing valid multiple tool calls; it is not guaranteed.

### C. Backend memory and scheduling are separate

**Direct llama.cpp evidence**

- `llama-server` owns model placement and memory controls: model mmap/mlock, GPU layers, KV offload, K/V cache types, device/split settings, context, batch/ubatch, slots (`--parallel`), continuous batching, and prompt caching. [Pinned server README options](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/tools/server/README.md#common-params)
- Current auto parallel mode selects four slots and unified KV. [server.cpp L146-L150](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/tools/server/server.cpp#L146-L150)
- With unified KV, `n_ctx_seq = n_ctx`; without it, per-sequence context is approximately total context divided by `n_seq_max` (alignment applies). The server creates one slot per parallel sequence and reports `n_ctx_slot`. [llama-context.cpp L283-L309](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/src/llama-context.cpp#L283-L309), [server-context.cpp L1242-L1306](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/tools/server/server-context.cpp#L1242-L1306)
- Busy work is deferred. `/slots` reports per-slot state; opt-in `/metrics` reports processing/deferred requests, throughput, context high-water mark, and busy-slot statistics. [README `/slots`](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/tools/server/README.md#get-slots), [README `/metrics`](https://github.com/ggml-org/llama.cpp/blob/571d0d540df04f25298d0e159e520d9fc62ed121/tools/server/README.md#get-metrics)

**Direct Ollama evidence**

- Ollama separates simultaneous loaded models from per-model parallel requests. Insufficient memory causes queuing/model eviction. `OLLAMA_MAX_LOADED_MODELS`, `OLLAMA_NUM_PARALLEL` (documented default 1), and `OLLAMA_MAX_QUEUE` (documented default 512) control these dimensions. Required RAM scales with parallelism times context length. [Ollama FAQ concurrency](https://docs.ollama.com/faq#how-does-ollama-handle-concurrent-requests)
- Models stay loaded five minutes by default; `keep_alive`, `OLLAMA_KEEP_ALIVE`, `ollama stop`, and `ollama ps` control/observe residency. Flash Attention and `OLLAMA_KV_CACHE_TYPE` affect context memory. [Ollama FAQ residency/KV](https://docs.ollama.com/faq#how-do-i-keep-a-model-loaded-in-memory-or-make-it-unload-immediately)
- Ollama's OpenAI-compatible Responses API is non-stateful: no `previous_response_id` or `conversation`. OpenAI compatibility has no request context-size field; configure context in a Modelfile/server defaults. [Ollama OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility)

**Operational model:** Backend RAM/VRAM is roughly model weights/residency + KV/context storage + compute/batch buffers and backend overhead. Exact bytes depend on architecture, quantization, context, parallel slots, cache type/offload, batch/Flash Attention, and device placement. OpenCode creates concurrent HTTP workloads; it does not, on this evidence, allocate model VRAM.

### D. One versus multiple endpoints/models

**Direct evidence:** OpenCode custom providers use `@ai-sdk/openai-compatible` and provider-level `options.baseURL`; agents select provider/model pairs. [OpenCode provider docs L1589-L1623](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/web/src/content/docs/providers.mdx#L1589-L1623), [provider loader L107-L118](https://github.com/anomalyco/opencode/blob/67caf894e0843ee370e72839e8265e483233479b/packages/opencode/src/provider/provider.ts#L107-L118)

**Inference:** Distinct base URLs normally need distinct OpenCode provider IDs. Mapping agents across provider/model pairs spreads HTTP requests, but URL count alone proves neither process nor GPU isolation. One server/model avoids duplicate weight residency but shares slots, queue, throughput, and failure domain. Multiple truly separate processes/devices isolate queues/failures and can run different models, but generally duplicate weight/KV overhead; two processes on one GPU can reduce rather than increase usable capacity. Ollama and current llama.cpp router mode can host multiple models behind one URL, so “URL”, “process”, and “resident model” must be modeled separately.

## Implementation Implications

1. Separate routing from admission control: agent→provider/model chooses destination; explicit per-endpoint/global in-flight limits must match measured backend capacity.
2. Pin and inventory backend version plus context, parallel/unified-KV, K/V type/offload, batch/ubatch, Flash Attention, model quant, GPU split, keepalive, loaded-model and queue limits.
3. For llama.cpp, do not use a simple `context ÷ slots` rule unless unified KV is confirmed off. Capture startup `n_slots`, `n_ctx_slot`, and unified-KV state.
4. Observe end-to-end: OpenCode session/agent/provider/model/request latency/error/token fields; llama.cpp `/health`, `/props`, `/slots`, `/metrics`, RSS/GPU memory; or Ollama `ollama ps`, logs, queue errors, and system/GPU memory.
5. Load-test 1, 2, … N simultaneous child sessions with short/long and common/divergent prefixes. Measure time-to-first-token, throughput, queue depth, cache behavior, peak RAM/VRAM, OOM, and cancellation.
6. Use timeouts, abort propagation, bounded retries, circuit breakers, resource headroom, and idempotency rules. Do not retry write-capable agents across endpoints without an idempotency design.
7. Update the secondary local guide before treating it as operational truth: current llama.cpp auto mode/unified KV and router-mode multi-model support make parts of its `-c`/`-np` and “two models = two processes” guidance incomplete.

## Risks

- Local models may serialize or malform tool calls, so configured capacity may not produce OpenCode task parallelism.
- Excess slots/context can OOM or lower throughput; short active prompts do not necessarily remove preallocated cache cost.
- Two URLs sharing one GPU can duplicate weights and OOM; one multi-model server can thrash residency/queues.
- Session count is not slot count: sessions persist logically; backend slots are ephemeral.
- Prompt caches, logs, slot endpoints, and metrics may expose sensitive prompt information.
- Mutable docs and rapid upstream changes can invalidate defaults.

## Unresolved Questions

- Exact deployed OpenCode/AI SDK/backend versions and runtime flags.
- Target model/tool-template reliability for multiple tool calls under load.
- Exact model/quant/context/parallel/unified-KV/KV-type/Flash-Attention/device configuration and measured bytes.
- Unified-KV contention behavior for the target llama.cpp model/workload; source establishes limits but not a safe universal concurrency formula.
- Whether multiple URLs terminate at distinct processes/devices and whether a load balancer preserves prompt-cache locality.
- Retry idempotency for write-capable delegated roles.

## Source List

1. OpenCode pinned source/docs at `67caf894e0843ee370e72839e8265e483233479b`: links above; package version 1.18.3.
2. Vercel AI SDK pinned `ai@6.0.168`: [tool transformation source](https://unpkg.com/ai@6.0.168/src/generate-text/run-tools-transformation.ts).
3. llama.cpp pinned `571d0d540df04f25298d0e159e520d9fc62ed121`: server README and source links above.
4. Ollama authoritative live docs: [FAQ](https://docs.ollama.com/faq), [OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility), [OpenCode integration](https://docs.ollama.com/integrations/opencode). Live/mutable; inspected 2026-07-19.
5. Secondary project context: `.opencode/skills/delegation-orchestrator/references/llama-cpp-integration-guide.md`.

## Handoff

- Next role: `planner`
- Limitations: Source-only research; no local server was load-tested, no measured RSS/VRAM was collected, and no acceptance validation was performed.
- Risks: Capacity cannot be inferred from session count alone; planning must require backend inventory, measured headroom, and bounded concurrency.
