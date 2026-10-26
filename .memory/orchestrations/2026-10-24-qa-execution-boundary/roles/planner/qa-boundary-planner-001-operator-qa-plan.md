# Planner trace: operator QA boundary

## Metadata
- orchestrationId: 2026-10-24-qa-execution-boundary
- delegationTaskId: qa-plan-001
- scopeKey: qa-boundary
- role: planner
- taskMode: plan
- artifactId: qa-boundary-planner-001-operator-qa-plan
- createdAt: 2026-10-24
- contract: `.opencode/contracts/role-io-contracts.json`
- traceSchema: `.opencode/schemas/memory-trace-artifact.schema.json`

## Input Contract
- Inputs received: approved QA-boundary goal, scope, cited researcher and validator traces, deliverable paths and acceptance criteria.
- Required context present: yes for bounded planning; no external runner, official V2 release asset URL/digest, binary bytes, or current exact tree supplied.
- Routing metadata status: absent; caller routing labels absent.

## Work Performed
- Summary: selected an operator-only source QA receipt entry point, without changing implementation or accepting results.
- Files read: supplied researcher and validator traces; role contract, trace schema/template; `package.json`, `.opencode/harness.manifest.json`, `.opencode/portable.manifest.json`, `.opencode/scripts/validate-harness.mts`, `README.md`.
- Files changed: none in workspace; this immutable trace only.
- Commands/checks: none executed; inspection is not validation.

## Output Contract
- Outputs: A narrow operator-invoked runner can be implemented now as an auditable convenience, but cannot unlock the managed read-only sandbox or itself run full QA in this session. No managed escape, parent shell, plugin registration, package bin, npm lifecycle hook or implicit execution.
- Ordered plan:
  1. Add `.opencode/scripts/operator-external-qa.mts`: exact operator CLI `node .opencode/scripts/operator-external-qa.mts --root /ABSOLUTE/TRUSTED/GIT/ROOT --receipt /ABSOLUTE/OWNER-ONLY/OUTSIDE-ROOT/receipt.json`. Require explicit outside-managed invocation, Linux/Node 24, canonical worktree root, preinstalled trusted tools/dependencies and owner-only external writable scratch; reject in-worktree/preexisting receipt and ambiguous root/parent. Do not accept arbitrary commands, URLs, secrets or executable paths; no download or install. Keep child temp and npm cache owner-only outside tree and sanitize provider/DB environment; do not claim full hermeticity.
  2. Run fixed argv without shell interpolation and with timeout: `node .opencode/scripts/validate-harness.mts`; `node .opencode/scripts/validate-portable-harness.mjs --root .`; `node --test .opencode/scripts/runtime-harness.test.mts`; `node --test .opencode/scripts/runtime-foreign-repo.test.mts`; `npm pack --dry-run --json`. Record actual process exit status/signal/timeout, argv, tool versions, bounded stdout/stderr (or digest plus truncation flag); fail overall on any failure/unknown. Never label these managed gate results.
  3. Before/after capture HEAD, index identity and byte/mode inventory of tracked and nonignored/untracked files plus explicitly declared safe ignored validation inputs; reject symlinks/ambiguous changes and record baseline/final hashes. Create an immutable atomic JSON receipt outside the worktree with `provenance: external-operator-unmanaged`, timestamps, exact inventory, command results, cleanup/retained-failure status. Fail closed on tree/index differences or missing results; receipt does not prove acceptance.
  4. Add `.opencode/scripts/operator-external-qa.test.mts` for no implicit execution, exact command allowlist, invalid paths/receipts, nonzero/timeout, mutation rejection and receipt provenance. Add both source-only paths to `.opencode/harness.manifest.json` (otherwise source validation inventory fails). Document operator command, limits, independent review and separate V2 requirement in `README.md` and `opencode-harness.design.md`. No package.json, runtime/portable manifest, plugin, controller or launcher change. If complete inventory or constrained env cannot be implemented safely, stop and return blocked rather than weaken claims.
  5. Independently inspect/test on final exact tree; run full suite using a *separately authorized real external operator process*, review receipt and recheck tree. Official V2 download and independent archive provenance/digest, safe extraction, credential-free trusted-binary native Task/guard fixtures and pre-spawn refusal are distinct external evidence tasks. Do not activate V2 managed dispatch based on this runner.
- File contracts/decisions: exact implementer targets `.opencode/scripts/operator-external-qa.mts`, `.opencode/scripts/operator-external-qa.test.mts`, `.opencode/harness.manifest.json`, `README.md`, `opencode-harness.design.md`; optional `AGENTS.md` only by separate explicit parent assignment. Do not edit `.opencode/src/`, `bin/`, `package.json`, managed controller, plugin, portable or runtime manifests. Source-only script is not shipped as portable/runtime asset.
- Dependencies: separate authorized external process, preinstalled dependencies, writable owner-only external scratch, exact Git tree; official V2 asset URL and independent pin/signature and trusted binary are unknown, so no official execution or native proof is claimed. Research trace identifies refusal preflight, sandbox, npm pack writes and test fixture EROFS; earlier six read-only passes are not full QA.
- Verification gates (planned, not run): managed independent validator may use exact `git diff --check`, `git diff --name-only`, `node --check .opencode/scripts/operator-external-qa.mts`, `node --check .opencode/scripts/operator-external-qa.test.mts` with tree/artifact hash proof; inspect manifest paths and refusal boundary. Write-producing `node --test .opencode/scripts/operator-external-qa.test.mts`, full source/portable validation, both runtime test scripts and `npm pack --dry-run --json` require separately authorized external execution, not managed gate IDs. Independent validator must review receipts and observe exit results on same reviewed tree; external output is never managed acceptance proof.
- Evidence: `orchestrations/2026-10-24-qa-execution-boundary/roles/researcher/qa-boundary-researcher-001-execution-map.md` lines 23-35; `orchestrations/2026-10-24-opencode2-fresh-validation/roles/validator/staged-validation-validator-001-readonly-gates.md` lines 19-35; `package.json` QA scripts/package files; `.opencode/harness.manifest.json` inventory; `.opencode/portable.manifest.json` managed files; `.opencode/scripts/validate-harness.mts` lines 795-805. Design implications are inferences, not test results.
- Artifact links: `orchestrations/2026-10-24-qa-execution-boundary/roles/planner/qa-boundary-planner-001-operator-qa-plan.md`.

## Handoff
- Next role: implementer on five exact targets, independent validator, then separately authorized external operator and V2 artifact verifier.
- Limitations: no external process is supplied; this code alone is ineffective at executing blocked gates in the present managed session. No commands run and no V2 bytes supplied.
- Risks: npm cache/lifecycle and host inputs may not be hermetic; sanitize receipt content, reject unsafe paths and ambiguous inventory; preserve managed gate refusal. No provider/network/global install or publication.
