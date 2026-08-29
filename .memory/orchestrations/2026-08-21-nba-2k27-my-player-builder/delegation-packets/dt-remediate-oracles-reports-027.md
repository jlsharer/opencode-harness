# Delegation Packet: dt-remediate-oracles-reports-027

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-remediate-oracles-reports-027`
- scopeKey: `standalone-oracles-reports-remediation`
- role: `implementer`
- taskMode: `implementation`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Goal: Resolve replay payload/context binding, same-binding immutable supersession, evidence provenance binding, and winner/report truthfulness.
- Scope: Assigned oracle/normalization/report files, fixtures/tests, and trace only; shared schemas/domain are read-only.
- Required regressions: Mutated replicate binding rejection; cross-context supersession rejection; duplicate ID/chain validity; unrelated evidence-ref rejection; unconfirmed/tied/zero-confidence winner rejection and non-manufactured Markdown.
- Non-goals: No optimizer/UI/network/live/dependency/Git/harness changes or delegation.
