# Delegation Packet: dt-validate-research-003

- orchestrationId: `2026-08-21-nba-2k27-my-player-builder`
- delegationTaskId: `dt-validate-research-003`
- scopeKey: `nba-2k27-research-proof`
- role: `validator`
- taskMode: `artifact-proof`
- dispatchKind: `fresh`
- routingMetadataStatus: `absent`
- Changed artifact: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/researcher/root-researcher-001-builder-evidence.md`
- Verification: Independently test source reachability and correspondence for material claims; publication/retrieval dates; official versus specialist classifications; cross-source conflicts; NBA 2K27 versus older context; terminology corrections; downstream implementation implications; unresolved facts; and role trace/output-contract completeness.
- Commands: Confirm the artifact exists and is nonempty; extract its URLs and use command-backed HTTP retrieval checks where access permits; record exact commands and outputs; inspect the declared trace contracts.
- Acceptance: Pass only if the dossier is current enough for 2026-08-21 planning, material claims are evidence-linked and correctly qualified, conflicts and unknowns are not collapsed into facts, and failures/skips are explicit. Findings block only when tied to `gate-current-research`.
- Deliverable: `.memory/orchestrations/2026-08-21-nba-2k27-my-player-builder/roles/validator/root-validator-002-research-proof.md`
- Non-goals: Do not implement, plan the workflow, operate BlueStacks, mutate the research artifact, or delegate.
