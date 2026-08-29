```json
{
  "orchestrationId": "2026-08-18-easier-local-node-opencode-harness-implementation",
  "role": "planner",
  "artifactId": "plan-harness-cli-planner-005-contract",
  "createdAt": "2026-08-19T03:58:49Z",
  "contract": ".opencode/contracts/role-io-contracts.json",
  "traceSchema": ".opencode/schemas/memory-trace-artifact.schema.json",
  "inputContract": {
    "inputsReceived": "Contract-complete fresh planner packet for scope plan-harness-cli, taskMode plan, with focused user authorization, approved upstream plan, completed compatibility research and blocker synthesis, pinned baseline identity, boundaries, dependencies, assumptions, one exact deliverable, and executable acceptance criteria.",
    "requiredContextPresent": "yes; the packet authorizes only the narrow harness prerequisite and supplies enough source evidence to define its exact public command, output, files, tests, version consequences, and handoff",
    "routingMetadataStatus": "absent"
  },
  "workPerformed": {
    "summary": "Selected one additive validate-inputs verb implemented by extracting the launcher's existing external-input checks into one shared read-only function. Defined closed grammar, accepted combinations, status and stream contracts, exact source/test/documentation/version files, unchanged profile decisions, offline security fixtures, release gates, assumptions, tradeoffs, and implementation handoff. No implementation, Git mutation, package publication, provider call, OpenCode execution, cache/trace/workspace/global-state mutation, or final acceptance validation was performed.",
    "filesRead": [
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md",
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/researcher/research-compatibility-researcher-003-contract.md",
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/planner/resolve-compatibility-gap-planner-004-synthesis.md",
      ".memory/protocols/memory-management.md",
      ".memory/templates/role-trace-artifact.md",
      ".opencode/contracts/role-io-contracts.json",
      ".opencode/schemas/memory-trace-artifact.schema.json",
      "bin/opencode-harness.mjs",
      "package.json",
      "README.md",
      ".opencode/runtime.manifest.json",
      ".opencode/harness.manifest.json",
      ".opencode/portable.manifest.json",
      ".opencode/schemas/opencode-provider-projection.schema.json",
      ".opencode/schemas/harness-endpoint-catalog.schema.json",
      ".opencode/schemas/harness-routing-profile.schema.json",
      ".opencode/scripts/runtime-harness.test.mjs",
      ".opencode/scripts/runtime-foreign-repo.test.mjs",
      ".opencode/scripts/validate-harness.mjs"
    ],
    "filesChanged": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/planner/plan-harness-cli-planner-005-contract.md"
    ],
    "commands": [
      "date -u +%Y-%m-%dT%H:%M:%SZ"
    ]
  },
  "outputContract": {
    "outputs": "Exact bounded implementation plan for a documented, offline validate-inputs command, shared validation contract, package version 0.1.10, fixtures, documentation, source-release assertions, dependency order, and independent verification gates.",
    "evidence": "The supplied research establishes that run already performs the required provider, catalog, profile, cross-document, metadata, and routing-policy checks, but only after cache/workspace/trace setup and before an OpenCode spawn. The smallest compliant change is to reuse those checks before any run-only work and expose them through a command that accepts no workspace/cache/trace/forwarding inputs. Existing source paths show that all required implementation and routing modules are already in the npm payload; no new schema, dependency, runtime payload mapping, portable-core file, or llama-server edit is needed.",
    "orderedPlanOrResolvedConclusions": [
      {
        "order": 1,
        "plan": "Add exactly one public verb with this grammar: opencode-harness validate-inputs [--provider-config FILE] [--routing-catalog FILE --routing-profile FILE]. FILE is an absolute trusted external JSON file under the same owner, mode-0600, size, stable-read, and trusted-ancestry rules used by run. Each option may occur at most once. Reject unknown options, --allow-project-plugins, --workspace, --trace-root, --cache-root, a bare -- or forwarded arguments, missing values, duplicate options, no supplied inputs, and a catalog/profile partial pair. Accepted combinations are provider alone; catalog plus profile; or all three. This preserves provider independence and the endpoint-catalog/profile all-or-none rule. Do not add aliases, positional files, implicit current-directory discovery, format flags, live checks, or backward-compatibility parsing not required by the approved consumer. Existing prepare and run grammar remains behaviorally unchanged except that their external validation calls the shared function in step 2."
      },
      {
        "order": 2,
        "plan": "In bin/opencode-harness.mjs, extract the current run block that opens and validates external inputs into one internal validateExternalInputs(options) function. It must use inspectExternalFile, validateProviderProjection, validateCatalog, mergeExternalRoutingDocuments, and normalizeAndValidateRoutingConfig once as the sole semantics for both run and validate-inputs. Return validated documents and unchanged bytes needed by run snapshots plus a closed presence summary needed by validate-inputs. Preserve provider schema closure; ai-infra provider/model names; @ai-sdk/openai-compatible; canonical loopback /v1 URL and port; exactly one model; matching model name; explicit positive integer context/output bounded at 2147483647 with output < context; explicit boolean enable_thinking; catalog schema/model/maxInFlight rules; unwrapped schema-2 profile closure; catalog-backed local references; fixed four roles; forceLocalForHarnessSubagents=false; provider/catalog provider-set, model, and URL equality. No validation value is defaulted or repaired."
      },
      {
        "order": 3,
        "plan": "Make the external-file helper honor the documented no-follow boundary at the caller-supplied leaf, not merely at a realpath-resolved target: lstat/reject a supplied symbolic-link leaf before resolution/open, retain O_NOFOLLOW on the opened regular file, exact current-user ownership and mode 0600, <=1 MiB, before/after descriptor identity and byte-count stability, and trusted resolved ancestry. Apply the same helper to run and validate-inputs so the new command cannot create a weaker alternate path and run retains the intended contract. Do not broaden this task into root/path security redesign beyond the external structured-input leaf."
      },
      {
        "order": 4,
        "plan": "validate-inputs must execute only package compatibility reads and validateExternalInputs. It must not call canonicalWorkspace, projectPreflight, prepareRuntime, cacheRootFrom, chooseTraceRoot, seedTraceRoot, createSnapshots, resolveExecutable, probeTracePermissions, spawnSync, Git, OpenCode, provider endpoints, or any filesystem write API. It must not inspect or mutate user-global OpenCode configuration, credentials, auth, HOME/XDG cache/state/data, workspace, trace, database, or project state. Ambient OPENCODE_BIN, OPENCODE_DB, OPENCODE_CONFIG*, OPENCODE_HARNESS_*, HOME, XDG_*, and PATH do not activate validation behavior; only the three explicit file arguments select inputs. The process-wide restrictive umask may remain but produces no files."
      },
      {
        "order": 5,
        "plan": "Define exact process and stream behavior. On success, exit 0, write nothing to stderr, and write exactly one compact UTF-8 JSON line to stdout, serialized in this key order: {\"schemaVersion\":\"1.0.0\",\"valid\":true,\"packageVersion\":\"0.1.10\",\"inputs\":{\"providerConfig\":BOOLEAN,\"routingCatalog\":BOOLEAN,\"routingProfile\":BOOLEAN}} followed by one newline. Booleans report supplied-and-validated inputs; no path, payload, endpoint, model, hash, credential, warning, or readiness claim is emitted. On grammar, trust, parse, schema, policy, or cross-document failure, exit 1, emit no stdout, and retain the existing single human-readable error line on stderr. No other normal exit status is defined. Consumers must require status 0, parse the one JSON object, reject extra keys/types/schema versions, require valid=true and the exact booleans for the files they supplied, and separately pin source/package/entrypoint identity. A successful result means offline structural/semantic compatibility only, never service health, model identity, authentication, capacity, OpenCode activation, or restart acceptance."
      },
      {
        "order": 6,
        "plan": "Bump the additive public package release from 0.1.9 to 0.1.10 in package.json, .opencode/runtime.manifest.json, the launcher's closed runtime-manifest assertion, source release assertions, current operator/design documentation, rollback wording, fixture cache paths, and tarball examples. This gives the changed CLI a distinct package and cache identity while retaining exact OpenCode 1.18.18 and Node >=24 <25. Do not add a --version command or claim that package version alone pins source bytes; the downstream phase-0 record must still use the accepted commit and new entrypoint hash."
      },
      {
        "order": 7,
        "plan": "Add focused offline cases to runtime-harness.test.mjs before downstream use. Exercise all three accepted input combinations and assert exact JSON/status/empty-stderr output; no-input, partial pair, duplicates, irrelevant flags, forwarding, malformed/oversized/wrong-mode/symlink inputs; wrapped or model-embedding profile, force-local true, missing catalog references; provider metadata missing/zero/boolean/overflow/equal-or-greater output; provider/catalog missing/extra/model/URL mismatch; and stable deterministic repeated success. Reuse existing valid fixture builders and routing policy rather than introducing another validator."
      },
      {
        "order": 8,
        "plan": "Add an executable no-side-effect fixture in runtime-harness.test.mjs. Run validate-inputs from an arbitrary owner-only cwd with absolute valid inputs, a nonexistent/empty PATH, poisoned OPENCODE_BIN and reserved OpenCode variables, absent canary HOME/XDG/cache/trace/workspace paths, and an executable marker that would record any OpenCode invocation. Snapshot the input/cwd/canary trees and modes before and after; require byte-identical inventories, all absent state paths still absent, input bytes/modes unchanged, no marker, no launch/database/runtime path, and status 0. Also point inputs at a disposable loopback listener or equivalent request-counting fixture and require zero requests, while recognizing this proves only the tested CLI path. Run equivalent invalid-input cases and require the same no-write/no-child condition."
      },
      {
        "order": 9,
        "plan": "Document the new grammar, all accepted and rejected combinations, exact JSON line, failure streams/status, trust/no-follow requirements, no-state/no-child/no-provider boundary, offline-only meaning, restart distinction, and a complete all-three-files example in README.md. Update opencode-harness.design.md and the packaged trust-and-restart guide only for the new 0.1.10 identity, read-only validation boundary, and rollback from 0.1.10 to retained 0.1.9. Keep the existing provider/catalog/profile examples authoritative and do not describe the ai-infrastructure wrapped routing example as directly acceptable."
      },
      {
        "order": 10,
        "plan": "After implementer self-checks, require a fresh independent validator to run the focused command matrix, full source/portable/runtime/package gates, inspect the diff for forbidden writes/spawns and output drift, calculate the accepted new commit and bin/opencode-harness.mjs SHA-256, and record the exact identity plus invocation for llama-server phase 0. Only that validator-backed record unblocks a fresh llama-server planning/implementation task."
      }
    ],
    "fileContractsOrDecisions": [
      {
        "path": "bin/opencode-harness.mjs",
        "action": "update",
        "contract": "Add closed validate-inputs dispatch and compact success JSON; extract one shared external validation function used by run and validate-inputs; enforce supplied-leaf no-follow handling; preserve run snapshot bytes and all existing launcher security/cleanup/exit behavior; update the closed packageVersion assertion to 0.1.10. No exports, dependencies, network code, state write, child probe, or new runtime operation."
      },
      {
        "path": ".opencode/scripts/runtime-harness.test.mjs",
        "action": "update",
        "contract": "Add the complete validate-inputs grammar, success-output, fail-closed semantic/metadata, no-follow, deterministic, no-write, no-network, and no-child fixture matrix. Update literal cache paths from 0.1.9 to 0.1.10. Existing run, prepare, snapshot, database, executable, and cleanup tests remain regression gates."
      },
      {
        "path": "README.md",
        "action": "update",
        "contract": "Document 0.1.10, validate-inputs grammar and exact output/status semantics, combinations, trust/no-follow and no-side-effect boundary, all-three-files example, offline-only limitations, package tarball identity, new cache identity, and rollback to retained 0.1.9. Keep the npm payload count at its verified value only if npm pack confirms it."
      },
      {
        "path": "package.json",
        "action": "update",
        "contract": "Set version to 0.1.10. Do not add dependencies, scripts, files, OS/engine changes, or another executable."
      },
      {
        "path": ".opencode/runtime.manifest.json",
        "action": "update",
        "contract": "Set packageVersion to 0.1.10 only. The validation verb belongs to the package CLI, not the prepared OpenCode runtime, so files, generatedEntries, compatibility, and profile stay unchanged."
      },
      {
        "path": ".opencode/scripts/validate-harness.mjs",
        "action": "update",
        "contract": "Replace active 0.1.9 package/runtime/launcher/README/design/pack assertions with 0.1.10 and retained rollback 0.1.9; assert help exposes the exact validate-inputs grammar and packaged CLI/import paths remain present. Do not make source acceptance depend on private routing overrides, network, providers, a reference installation, or live OpenCode."
      },
      {
        "path": "opencode-harness.design.md",
        "action": "update",
        "contract": "Update the external-runtime identity/cache/rollback description to 0.1.10/0.1.9 and state that validate-inputs reuses run's external document validation without workspace, cache, trace, snapshot, executable, child, provider, or global mutation. No broader architecture redesign."
      },
      {
        "path": ".opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md",
        "action": "update",
        "contract": "Update packaged rollback wording to 0.1.10 -> retained 0.1.9 and add the narrow offline validation/no-readiness boundary. Preserve all launcher trust, cleanup, trace, and force-local guidance."
      },
      {
        "path": ".opencode/harness.manifest.json",
        "action": "reuse unchanged",
        "contract": "All changed source paths are already inventoried and no file is added; source artifact count and ownership do not change."
      },
      {
        "path": ".opencode/portable.manifest.json",
        "action": "reuse unchanged",
        "contract": "portable-core does not include the package CLI, package manifest, runtime manifest, source README/design, or source validator. The shared routing modules and schemas are not changed by this plan, so portable managed files and forbidden source-runtime distinctions remain unchanged."
      },
      {
        "path": ".opencode/scripts/runtime-foreign-repo.test.mjs",
        "action": "reuse unchanged",
        "contract": "Retain as a required regression gate for run/workspace isolation; validate-inputs requires no foreign Git repository fixture because it accepts no workspace."
      },
      {
        "path": "/home/joshl/ai-infrastructure/llama-server",
        "action": "blocked and unchanged",
        "contract": "No downstream implementation begins until a fresh independent harness validator accepts the new identity and exact validate-inputs contract."
      }
    ],
    "dependencies": [
      "Approved upstream plan at /home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md.",
      "Completed compatibility research research-compatibility-researcher-003 and blocker synthesis resolve-compatibility-gap-planner-004.",
      "Current baseline commit 7844244131674cd763d994453c1888f50ae3d688/package 0.1.9 is evidence of the missing verb, not the post-change accepted identity.",
      "Existing validateProviderProjection, validateCatalog, routing-config-loader, routing-policy, inspectExternalFile, and cross-document checks remain the sole validation semantics.",
      "Linux, Node >=24 <25, exact OpenCode 1.18.18 for run, owner-only external inputs, and force-local false remain unchanged.",
      "A fresh implementer may edit only the eight update paths listed above; the manifest/test paths explicitly marked unchanged are verification dependencies, not edit authorization.",
      "A fresh independent validator and recorded post-change commit/package/entrypoint hash are mandatory before the llama-server parent resumes phase 0."
    ],
    "verificationGates": [
      {
        "gate": "Focused syntax, help, and validation contract",
        "commands": [
          "node --check bin/opencode-harness.mjs",
          "node bin/opencode-harness.mjs --help",
          "node --test .opencode/scripts/runtime-harness.test.mjs"
        ],
        "pass": "All exit zero. Help shows exactly prepare, validate-inputs, and run grammar. The runtime suite proves exact success JSON, accepted combinations, closed arguments, fail-closed documents, metadata limits, no-follow files, zero tested writes/requests/child invocation, shared run parity, and all existing launcher regressions."
      },
      {
        "gate": "Explicit disposable CLI proof",
        "commands": [
          "node bin/opencode-harness.mjs validate-inputs --provider-config /DISPOSABLE/provider.json --routing-catalog /DISPOSABLE/catalog.json --routing-profile /DISPOSABLE/profile.json"
        ],
        "pass": "Run only inside the validator-owned mode-0700 fixture created by the test plan, with mode-0600 valid files and isolated absent HOME/XDG/workspace/cache/trace canaries. Exit is 0; stderr is empty; stdout is exactly {\"schemaVersion\":\"1.0.0\",\"valid\":true,\"packageVersion\":\"0.1.10\",\"inputs\":{\"providerConfig\":true,\"routingCatalog\":true,\"routingProfile\":true}} plus newline; before/after inventories and spawn/request markers meet step 8. Placeholders are not literal operator paths."
      },
      {
        "gate": "Routing and foreign-workspace regression",
        "commands": [
          "node .opencode/routing/routing-policy.test.mjs",
          "node --test .opencode/scripts/runtime-foreign-repo.test.mjs"
        ],
        "pass": "All runnable cases pass; only the already-documented optional external bundle case may skip when no bundle is supplied. No real provider/OpenCode operation occurs."
      },
      {
        "gate": "Required package/runtime release checks",
        "commands": [
          "node --test .opencode/scripts/runtime-harness.test.mjs",
          "node --test .opencode/scripts/runtime-foreign-repo.test.mjs",
          "node .opencode/scripts/validate-harness.mjs",
          "node .opencode/scripts/validate-portable-harness.mjs --root .",
          "node .opencode/scripts/portable-harness.test.mjs",
          "npm pack --dry-run --json"
        ],
        "pass": "Every required non-optional command exits zero; package/runtime versions are 0.1.10; exact OpenCode remains 1.18.18; source and portable inventories agree with their distinct profiles; npm payload contains the existing CLI/routing imports and no unplanned file. Run the two runtime scripts even if runtime-harness was already executed by the focused gate."
      },
      {
        "gate": "Diff, identity, and documentation review",
        "commands": [
          "git diff --check",
          "git status --short",
          "git diff -- bin/opencode-harness.mjs .opencode/scripts/runtime-harness.test.mjs README.md package.json .opencode/runtime.manifest.json .opencode/scripts/validate-harness.mjs opencode-harness.design.md .opencode/skills/delegation-orchestrator/references/trust-and-restart-guide.md",
          "sha256sum bin/opencode-harness.mjs package.json .opencode/runtime.manifest.json"
        ],
        "pass": "No whitespace error; only authorized implementation plus orchestration trace files are attributable to this work; review finds no validate-inputs path to writes, Git, workspace/cache/trace setup, snapshots, executable resolution, spawn, provider/network calls, secrets, or private path output. Record hashes with the accepted Git commit after commit creation by an authorized parent/operator; do not reuse the baseline hash."
      },
      {
        "gate": "Downstream phase-0 unblock",
        "commands": [],
        "pass": "A fresh independent validator artifact reports all gates passed and a fresh synthesis records accepted commit, package 0.1.10, entrypoint hash, exact command/JSON/status contract, and no-write/no-child evidence. Until then llama-server remains blocked. Real provider health, authentication, OpenCode launch, restart, and publication stay untested and unauthorized."
      }
    ],
    "tradeoffs": [
      "A dedicated new module or output JSON Schema could isolate code or formalize the tiny result, but would add package/runtime/portable inventory work. One internal shared function and a documented closed four-field result are the smaller contract.",
      "Always emitting structured failure JSON would aid some consumers but requires a stable error-code taxonomy and changes the launcher's established stderr failure behavior. Status 1 plus empty stdout and human stderr is sufficient for fail-closed automation; only success is a parseable capability record.",
      "Requiring all three files would exactly match the downstream call but would narrow the launcher's independently optional provider and catalog/profile pair semantics. Accepting the same three combinations as run maximizes semantic parity without adding behavior; the downstream must require all three booleans.",
      "A 0.1.10 package bump creates a new runtime cache even though prepared runtime payload mappings are unchanged, but it avoids an altered public entrypoint sharing the 0.1.9 package identity and gives downstream pinning a clear release boundary.",
      "Correcting caller-supplied leaf symlink handling affects run as well as the new verb, but it implements the documented no-follow external-input contract rather than creating a validation-only divergence. Broader path-policy changes remain out of scope."
    ],
    "openQuestions": [],
    "handoffNotes": [
      "Dispatch a fresh implementer in implementation mode with exactly the eight update paths above and this artifact as approvedPlan. Do not authorize new files or llama-server edits.",
      "The implementer should preserve unrelated working-tree state, share validation rather than duplicate it, and report any need to alter output keys, accepted combinations, version, or file scope as a blocker requiring fresh planning.",
      "After implementer self-checks, dispatch a fresh independent validator in validation mode with the complete gate matrix. Lifecycle hooks, fixture markers, and this planner trace are coordination evidence, not acceptance by themselves.",
      "After acceptance, the parent must record the new commit and entrypoint hash; package 0.1.10 alone is not sufficient identity. Then start fresh phase-0 synthesis before any llama-server implementer.",
      "Assumptions retained from the packet: the user authorized this narrow prerequisite; the supplied plan/evidence are authoritative; downstream implementation remains blocked pending independent harness validation.",
      "Routing metadata was absent, so no routing metadata values were invented."
    ],
    "traceArtifactPath": ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/planner/plan-harness-cli-planner-005-contract.md",
    "artifactLinks": [
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/planner/plan-harness-cli-planner-005-contract.md",
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/researcher/research-compatibility-researcher-003-contract.md",
      ".memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-implementation/roles/planner/resolve-compatibility-gap-planner-004-synthesis.md",
      "/home/joshl/ai-infrastructure/.memory/orchestrations/2026-08-18-easier-local-node-opencode-harness-integration/roles/planner/simplified-setup-plan.md"
    ]
  },
  "handoff": {
    "nextRole": "implementer",
    "limitations": "Plan mode only. No implementation file, Git state, package, runtime, provider, OpenCode child, network endpoint, workspace, cache, trace, or global configuration was changed or accepted. Commands are future executable gates, not results. Only this required planner trace artifact was written.",
    "risks": "Primary implementation risks are duplicating run validation, accidentally entering run-only mutation/spawn paths, accepting symlinked or unsafe external inputs, output drift that breaks deterministic consumption, weakening force-local/metadata/cross-document checks, stale 0.1.9 identity assertions, or treating offline compatibility as live readiness. Shared code, hostile fixtures, release gates, and independent validation are mandatory controls."
  }
}
```
