# Context bounds and paired evaluation

The context module accepts only explicitly requested IDs from an index containing canonical relative paths and exact SHA-256 hashes. It reads regular UTF-8 files, rejects symlink components, traversal, unknown IDs, stale hashes and duplicates, and enforces entry, per-reference and aggregate byte limits. Limits are hard bounded to 128 entries and 1 MiB aggregate. File reads allocate and read at most the configured remaining limit plus one byte, so concurrent growth cannot produce unbounded reads.

Call `expandIndexedReferences(root, index, ids, budget)` during packet construction. Returned entries include content, byte counts and hashes. This helper does not automatically crawl files or retrieve semantic matches. Integration must supply a trusted root and explicitly authorized index; an index is not authority to expose secrets. It is not a sandbox against hostile same-UID ancestor replacement.

`validateUsageTelemetry(value)` preserves reported native token counts and USD cost independently. Missing values remain null; all absent values produce status unknown. It rejects negative, fractional, unsafe token counts, nonfinite costs and unsupported fields. Zero is a valid measurement. It does not infer tokens from characters or bytes. Synthetic test usage must never be presented as measured native usage.

## Reproducible offline checks

Run with the repository's installed Node 24:

```sh
node --test .opencode/src/plugin-modules/context-budget.test.ts
node .opencode/scripts/evaluate-controller.mts
```

The evaluator consumes `.opencode/evaluation/offline-benchmark.json` and performs 10 context/usage policy probes plus 10 actual dispatch-controller probes three times (60 checks total). The thin comparator is an unguarded fixture transport accepting supplied inputs. It is **not** an executed OpenCode baseline. The refined comparator invokes the real context helper and dispatch controller. Controller probes cover valid completion, duplicate dispatch/completion, simultaneous same-scope dispatch, launch-error retry, cancellation/timeout late results, exhausted budget, missing validator proof and interruption. These establish deterministic policy behavior; comprehensive controller state, concurrency and recovery tests remain in the separate unit/integration suite.

All files created by the evaluator are temporary local fixtures, removed afterward. There are no provider requests or source-tree writes. The evaluator emits JSON to stdout and fails on an unexpected decision. Token and cost fields in the reported-usage probe are explicitly synthetic inputs.

## Paired model benchmark awaiting authorization

The same JSON defines ten representative future tasks: a small fix, multi-file change, research/plan, clarification, integration, launch failure, cancellation, stale validation, scope violation and unknown-cost completion. Each task has an acceptance criterion, with three repeats proposed in each arm. These are a benchmark specification; task-specific fixture repositories and independent acceptance commands must be finalized before model execution. This is an explicit remaining preparation step, not a completed live benchmark.

Compare thin OpenCode with the refined controller using the same worker/version/model, starting tree, prompt, permissions and independent acceptance checks. Randomize paired arm order. Record exact tree/artifact hashes, acceptance, regressions, human interventions, elapsed time, reported input/output tokens and cost (null when unavailable), repeated side effects and recovery correctness. Save per-run raw outcomes, rather than only averages.

Provider-backed trials have not been run. No superiority in quality, cost or token use is claimed. OpenCode V2 and alternative worker/runtime trials remain separate so version changes do not confound this comparison.


The runnable paired screening set is `.opencode/evaluation/paired-tasks.json`. Materialize 10 tasks × 2 arms × 3 repeats with `node .opencode/scripts/prepare-paired-benchmark.mts --output /absolute/new/directory`. The destination parent must already exist; existing destinations are refused. Each starter has a real Node acceptance test designed to fail until its requested change is implemented. Preparation records identical start hashes and unknown outcome/usage fields, and never invokes a model. Run `node --test .opencode/scripts/paired-benchmark.test.mts` to verify all 60 starter fixtures fail for assertion reasons rather than syntax/import problems. These synthetic screening tasks do not establish real-work quality or native recovery.
