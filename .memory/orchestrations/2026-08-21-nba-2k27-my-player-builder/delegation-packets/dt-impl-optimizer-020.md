# Delegation Packet: dt-impl-optimizer-020

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-impl-optimizer-020`
- scopeKey: `standalone-optimizer-core`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Implement deterministic constrained multi-objective optimizer modules and focused tests on the accepted shared contracts.
- Scope: `src/nba2k27-myplayer/optimizer/`, `test/nba2k27-myplayer/optimizer.test.mjs`, and assigned trace only.
- Required behavior: Exact-context cache/deduplication; false/unknown/feasible partition; hard-first filtering; lexicographic weighted priority bands; soft unknown policy; deterministic seeded proposals; interpretable feasibility hints that never certify; sensitivity sweeps; Pareto dominance; per-band near ties; confidence components; stopping/finalist confirmation; deterministic run manifest.
- Verification: `node --test test/nba2k27-myplayer/optimizer.test.mjs` plus syntax checks.
- Non-goals: No oracle, report rendering, UI/live/network, external dependency, Git, or delegation.
