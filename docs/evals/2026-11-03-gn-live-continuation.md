# Isolated native continuation evaluation — November 3, 2026

Status: **PASS for the four approved isolated researcher/research mode × control combinations, after independent review.** This record supplements the [regression runbook](../global-native-regression-evals.md) and [approved design](../superpowers/specs/2026-11-03-global-native-live-gap-design.md). It records genuine isolated native/provider execution collected by Codex under the owner's explicit fresh-login and provider/network authorization. It is neither a modeled callback fixture nor a T3Code UI test. The owner confirmed the active T3Code selection as `OpenCode → openai/gpt-6.1-sol`.

A [durable selected-evidence record](evidence/2026-11-03-gn-live-continuation.json) retains nonsecret observed child results, actual parent/CLI rejection, event order, refusal/accounting and input/artifact comparisons. It is a review artifact, not an executable runner, schema or acceptance authority. The full hashed native surfaces remain in private temporary storage. Independent review matched all five selected case records and their raw-file hashes against the actual native files; durable JSON SHA-256: `a4a7f995276f41ee11b3a2f9d1b823e07e4d9c25612eda28c24aa30caae27b4e`.

## Provenance and isolation

| Item                          | Recorded value                                                                                                                    |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Source baseline               | Clean `87e9d6f76bf80c215837873974adc553f402ed4c`; source-only startup/audit fixes `60d3c94`, `0509c6d`                            |
| Native executable             | `/home/joshl/.opencode/bin/opencode`, version `2.1.4`, SHA-256 `ca9b3ee262e33bb4e7aa0e1230dc61086a474c8c8016b980081d0719712fd2e7` |
| Native API audit pin          | Git commit `68bc26b7da1990ce10ffecfbc1e09eb13aa5d824`; audit reads committed blobs                                                |
| Actual parent/child model     | `openai/gpt-6.1-sol`, default variant in the saved native session records                                                         |
| Source evaluator SHA-256      | `78dde153a13a20bbd0e59ac9f092d0238821406940b31d948dff35c71a0fdc6d`                                                                |
| Source evaluator test SHA-256 | `8b30e18c43510769307ae6e1e8f4c2d2aa0cef6d60bb4ee28f6ff1565e8a0844`                                                                |
| Compiled evaluator SHA-256    | `c8647c6254819b7e004bf96bd5f9628e231396cd897a7f70ae910087bdc66ab7`                                                                |
| Prepared resources            | 56 assets matched the isolated prepared release `0.1.20-6f1e61508946ab2c3711`; never installed globally                           |
| Attempt timeout               | Explicit approved creator override `60000` ms, bounded by original task deadline; same default isolation checks                   |
| Evidence base                 | `/tmp/opencode-live-validation-4Bt9atiR/cases/`; temporary evidence paths are not durable repository assets                       |

Each attempt has a fresh owner-only root, HOME/XDG configuration/data/state/cache, workspace, database, plugin instance/generation and task identities. Native provider login happened only in a fresh isolated seed. Official native auth-only export/import transferred exactly one active fresh OpenAI OAuth connection to each independently fresh case database in short-lived process memory. Existing operator auth/session stores were not opened or copied. Credential bytes, authentication URLs, private server credentials and encrypted reasoning are excluded from this record. No global installation, production adapter or user configuration was changed.

The local plugin wrapper imports the compiled source evaluator, registers its single actual adapter plus evaluation controls, and uses the 60-second creator timeout. Native preflight waits for location activation, then verifies one active owning evaluator and the four subagent roles. Initial native calls prove the actual orchestration and evaluation tools are exposed. The source evaluator remains excluded from installed/package closures.

## Preserved attempts before the current coverage

| Case directory                       | Actual result and limitation                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v1-continuation-rendezvous-RQ74Qc`  | **FAIL, startup.** Four roles loaded, but source evaluator setup assumed `plugin.list()` was an array. Actual Promise catalog was `{location,data}`, causing `.some is not a function`. The real parent stopped without tools, workflow admission or child. Metadata presence was insufficient; plugin state was failed.                                                                                                                   |
| `v1-continuation-rendezvous-LXmyGz`  | **FAIL, operator preflight expectation.** Admission succeeded, but the prompt compared returned session/orchestration traceRoot with its configured base directory. The parent correctly stopped. No child or cancellation.                                                                                                                                                                                                                |
| `v1-continuation-rendezvous-NsDHZq`  | **INCONCLUSIVE for required success-bearing callback.** Authentic clarification/continuation, pending rendezvous, registered cancellation and natural late rejection occurred. The child requested permission for a Markdown artifact instead of returning structured success, because the fixture prohibited writes without supplying an artifact. The evaluator retained an inconclusive diagnostic; this does not become a GN-011 PASS. |
| Same `NsDHZq`, native CLI collection | **FAIL, provider request.** CLI returned `provider.invalid-request`, status 400. Its cause was not established; earlier HTTP success had different history and does not prove the CLI caused it. Subsequent same-parent HTTP collection actually observed refusal/status/read. Preserve both outcomes.                                                                                                                                     |

Source-only fix `60d3c94` validates exact located plugin/agent catalog shapes and location identity; it does not unwrap raw Promise `session.get()` or change the production adapter. Follow-up `0509c6d` keeps audit expressions within source policy and adds a mutation negative requiring the actual host result encoder call. Both passed independent review.

Affected offline checks passed: **112 evaluator tests**, including **33 pinned-source mutation negatives**; **203 global tests**, zero failures/skips; formatting/lint, typecheck, generated agreement, source policy, global validation and compilation. Required source validation first failed two existing isolated-shell tests because `/tmp` fixtures were masked by the shell's temporary mount; the same check passed using a private mode-0700 `/var/tmp` root. `OPENCODE_CONFIG_CONTENT` was absent and explicitly omitted only in the QA child. These checks are not represented as another full runtime/package-suite rerun; production/package assets were unchanged.

## Assertion matrix

Each PASS below is scoped to controlled source-driver execution with this native binary/API and researcher/research continuation. Original native CLI output/content/metadata was independently reviewed, in addition to adapter/parent/model rejection and actual refusal/status/read.

| Assertion / mode                                                             | Control 1                                                       | Control 2              |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------- |
| GN-010-CONTINUATION, pending child invocation before cancellation            | **PASS**, `L0GzfV`; earlier `TOGS6b` also passed this assertion | **PASS**, `6bCLuT`     |
| GN-011, natural success after rendezvous cancellation, all required surfaces | **PASS**, `L0GzfV`                                              | **PASS**, `6bCLuT`     |
| GN-011, separate completed-after-hold, all required surfaces                 | **PASS**, `1cixV1`                                              | **PASS**, `04mjGc`     |
| Later same-parent CLI refusal/status/ordinary read                           | **PASS**                                                        | **PASS**               |
| T3Code reload/catalog, owner Stop, child/rejection display                   | NOT_EXERCISED                                                   | NOT_EXERCISED          |
| GN-010-FRESH and other role/mode cancellation                                | Outside this evaluator                                          | Outside this evaluator |

The earlier `TOGS6b` natural-completion attempt retains its narrower original-turn terminal coverage; a later same-parent semantic collection did not render that original turn. The fresh `L0GzfV` attempt closes the terminal gap without rewriting the earlier record. Each of the four complete required combinations passed nine independent review assertion groups; the earlier narrower case passed seven.

`OBSERVED` is the evaluator's diagnostic, not a PASS judgment. Its `missingSurfaces` remains populated because the driver cannot infer independent native context/model/terminal collection. Those surfaces are assessed from the saved actual native records. All cancelled runs remain unaccepted with null digest; no retirement or native termination proof is claimed.

### Control 1 — natural completion (`TOGS6b`)

- Parent: `ses_e5af96463ffeEXAk1hu8Am70Yg`; child: `ses_e5af8b7e3ffeBW0Xz7P7chtlzn`.
- Run/task: `gn-live-v1-continuation-rendezvous-80a0f60ab0` / `research-80a0f60ab0`; generation `bb5a4021-928a-4f02-97a9-9b845a3883bd`.
- Genuine clarification nonce: `confirm-a-only-5e82c912b04749c6aeb39d71`.
- Fresh continuation call/message: `call_n8FLgWM4FRya2PN4Pvf8ao8T` / `msg_1a507d414001y8JV3tdLd83zlr`; exact returned continuationPrompt and exact prior child.
- Ordered observations: continuation admitted 10 → child progress 11 → execution start 13 → actual rendezvous pending 20 → cancel invoked 21 → cancel returned 22 → rendezvous released 23 → genuine completed callback held 113 → adapter after returned 118.
- Callback before/release SHA-256 agrees: `017727c608c7fad1ef348c388e80173518afde3cfedad3a0a02f61e0f162dcd2`.
- Child structured success completed at `1793770155155`, before evaluator deadline `1793770175992`, before original deadline `1793770380278`. Cancellation raw output and parsed text agree on the exact child and `termination: "unconfirmed"`.
- Adapter output/content/metadata and the actual native parent's continued-subagent content reject the bound result: `duplicate, cancelled or late result`. Parent assistant text recognizes rejection. The cancelled child's success is not returned as successful managed parent output.
- Later native CLI collection exited 0, 14 JSONL records, no error record. Actual acceptance rejected with `independent acceptance incomplete or stale`; ordinary read succeeded. Generation remained unchanged; accepted false, digest null, retirement refusal `cancelled task: termination uncertain`; one resident run, two calls, five replay identities/1055 canonical bytes, zero reserved records and 563 reserved/summary bytes.

Independent review executed seven assertion groups against the saved native records and passed these scoped claims. The CLI ran the later collection turn, so original cancelled-subagent terminal rendering remains unexercised in this attempt. Native parent/model evidence and semantic terminal collection are not relabeled as that missing rendering.

The child used only reads and rendezvous; no replacement child or write/edit appeared. Post-run workspace inventory contains only unchanged `a.txt`, SHA-256 `2fa7da75f19d29590276a0c5edabbc8554cbeeb88951767d7f7ee5cf61041565`. The mode-0400 supplied Markdown artifact matches setup bytes, SHA-256 `4d9cf615fdea235c6c80f967396568e3331b34bc1e885ca3d427c9b3314fd760`. This compares current bytes with deterministic setup, not a captured before/after whole-host inventory. The supplied artifact is input, not proof that the child created a trace or validated acceptance.

Staging wrapper/config SHA-256: `f9be1f234624a5b298b628f990da74352d599adac52dd1eff2bec47b9544fe76` / `99590c0d2c58990cb3f63bfda10b30e64580cb3f3b4d354f0e7c47c60e5fb7a7`.

### Control 2 — natural completion (`6bCLuT`)

- Parent: `ses_e5af53356ffeo2KPpo5I7Lr2Uv`; child: `ses_e5af4870effetJzVZeuAYHAb1S`.
- Run/task: `gn-live-v2-continuation-rendezvous-22c2f023cc` / `research-22c2f023cc`; generation `67a18530-37b8-4732-821e-cd4eca2d5547`.
- Genuine clarification nonce: `confirm-7a6906dc-883d-42ee-bb92-ef520faa9367`.
- Fresh continuation: `call_IpXQXBi5TZImetQwAh0cDmHh`; native CLI captured its original rejected tool result, not only a later semantic report.
- Driver order: continuation admitted 10 → rendezvous pending 20 → cancel invoked 21 → cancel returned 22 → rendezvous released 23 → genuine completed callback held 114 → adapter after returned 119.
- Before/release SHA-256 agrees: `3896597569e0014473d7ace4aac440c9216d3993b251d5c6500bc22b370d2596`.
- Driver diagnostic is `OBSERVED` / `rejection-observed`; exact cancellation reports known child and termination unconfirmed. Independent review passes genuine child structured success, native parent/model rejection, original CLI tool output/content/metadata and later CLI refusal/status/read. The saved review compares native records rather than relying on the driver diagnostic.

Staging wrapper/config SHA-256: `e782d18ed451a42bf7fc64ea98138f020a4908a43ae2b170665da632c6184151` / `1f0793b269e0dfc74dd10fea7a286fc23b209577af0b21874ac11f80cc3802b8`.

### Control 1 — completed-after-hold (`1cixV1`)

Status: **PASS**, independently reviewed actual callback and original native CLI/parent/model rejection, refusal/accounting/read and scoped inventory. Parent `ses_e5af1e1e4ffev02jHLDCCP301D`, child `ses_e5af13a0bffeC2gZ1XQpEnELl3`, run `gn-live-v1-completed-after-hold-6608dc6e4e`, task `research-6608dc6e4e`, generation `cc929848-c8ed-4be7-ba38-245705370be8`. Genuine clarification nonce `confirm-78674cb3-bfc4-46bd-9ea5-38eafbb4d622`.

The actual native completed callback was held at observation 119, then registered cancel ran at 124/125 and the same adapter after returned at 126. Before/release hash agrees: `d1c50fbac147d8041499fd66a9bc273172c50a0707fdb8e6dedcd12246dff8a0`. Independent review checked the genuine structured child success, exact continuation/callback binding and unchanged payload, actual adapter/parent/model rejection, original native CLI tool-result output/content/metadata and later CLI collection. This mode tests late callback delivery after already-completed execution, never running-child overlap. Original/evaluator deadlines are `1793770871247` / `1793770661956`.

Collection retained one run, two calls, five replay identities/1043 canonical bytes, zero reserved records and 557 reserved/summary bytes. Acceptance actually refused; accepted false and null digest, with retirement refusal `cancelled task: termination uncertain`. Ordinary read succeeded. Independent review checked nine assertion groups.

Staging wrapper/config SHA-256: `8935cc44801e6cc3179fa1aa96d0f5cfceae8c434922bba939d22b7fe387391d` / `40006112c0f10ad6767ccd6b2430f577964f8c57aaf2f35bcae47d8ec900e37c`.

### Control 2 — completed-after-hold (`04mjGc`)

Status: **PASS**, independently reviewed actual callback and original native CLI/parent/model rejection, refusal/accounting/read and scoped inventory. Parent `ses_e5aed9724ffeOLWQYaWjoS3sBR`, child `ses_e5aecefbfffeZL5jIfK9yllUAW`, run `gn-live-v2-completed-after-hold-06b1348ad4`, task `research-06b1348ad4`, generation `b435f303-7a85-4f77-bf65-399914e7cf78`. Genuine clarification nonce `confirm-a-91bcd472-f081-4c59-a276-08c6934e251d`.

The genuine completed callback was held at observation 109, registered cancellation ran at 114/115, and the same adapter after returned at 116. Before/release hash agrees: `7d0d6bf9671391030c49b11e5bc412573756e988b6c6f2869b4743fff69e9796`. Independent review checked the genuine child success, exact native binding, original CLI rejection output/content/metadata and adapter/parent/model rejection. Later CLI collection exited 0; acceptance actually refused, ordinary read succeeded, accepted remained false with null digest, and retirement refusal remained `cancelled task: termination uncertain`. Accounting retained one run, two calls, five replay identities/1043 canonical bytes, zero reserved records and 557 reserved/summary bytes. All nine review assertion groups passed. This is completed-operation delivery testing, not GN-010 overlap. Original/evaluator deadlines are `1793771152412` / `1793770942996`.

Staging wrapper/config SHA-256: `24761b9088e1174f6cb4dd42f651f768403975fa08a579bb37ec85b4974f8a5b` / `f04a5241195522c68a6ac24d211618bdd22b2c2f405ba201148349ef0ee193b1`.

### Control 1 — natural completion with original CLI rendering (`L0GzfV`)

Status: **PASS**, independently reviewed across all required native surfaces. This fresh attempt covers the original-turn CLI surface missing in `TOGS6b`; it does not change that historical attempt's narrower evidence.

Parent `ses_e5aea9e4effeZcPT5kxrvtDV1o`, child `ses_e5ae9e710ffeGx7eZS9vxkqEYF`, run `gn-live-v1-continuation-rendezvous-9152613560`, task `research-9152613560`, generation `6b3bcbd3-f8d1-4d16-84ef-45ae25a9519f`. Genuine clarification nonce `confirm-a-7d3e6498-b271-4f05-a8c6-1930fe42bd57`.

Actual sequence: rendezvous pending 21 → cancel invoked/returned 22/23 → release 24 → genuine completed callback held 123 → adapter after returned 128. Before/release hash agrees: `6e1a63a14d649b2ef40a76f23cf4c900113546289650a778b228227567221a46`. Independent review checked the genuine native child structured success and original continued-subagent CLI rejection on output/content/metadata, alongside actual adapter/parent/model rejection. Later CLI collection exited 0; acceptance actually refused, ordinary read succeeded, accepted remained false and digest null with retirement refusal `cancelled task: termination uncertain`. Accounting retained one run, two calls, five replay identities/1055 canonical bytes, zero reserved records and 563 reserved/summary bytes. All nine assertion groups passed. Original/evaluator deadlines are `1793771351239` / `1793771170751`.

Staging wrapper/config SHA-256: `214065b0d71633752abe603a045f30632d8406f72c40e52a5ea1ad3ae7c1f93f` / `6f3143a8c5e03bd20c102b94c99c2e9ac97791571c34652f37e1ad304631110b`.

## Frozen nonsecret evidence hashes

Paths are relative to the private case evidence directory; hashes identify the full saved native surfaces without copying raw contexts into the repository. These temporary files may expire; the linked durable record retains selected nonsecret observations for future review.

| Case     | File                         | SHA-256                                                            |
| -------- | ---------------------------- | ------------------------------------------------------------------ |
| `TOGS6b` | `eval-status-extracted.json` | `d940816b473891155da55446013a445949ff9f7dd299713f7fe325a354ed44f7` |
| `TOGS6b` | `terminal-collect.jsonl`     | `c9c77ea2e1451e91c288a9a875c020591159e9d1a346ff16f0d94fe8dd290d8a` |
| `6bCLuT` | `eval-status-extracted.json` | `9c355fc883c9f5059bf14c477844bd65b153334bc4c5530c3a1d7a02614726ff` |
| `6bCLuT` | `terminal-continue.jsonl`    | `7b350f88ca840c3310d42d63063ecc5f9350c3f885e402626e2fdafc51549fcd` |
| `6bCLuT` | `terminal-collect.jsonl`     | `a83ff24e64e77e722f646f7f81cef6626bc9c2dfdeff532e4e312dbb1ea92680` |
| `1cixV1` | `eval-status-extracted.json` | `c0c10b5c31e777f074ff9d808d11558b37e08f590a1521ce3f22a346949c6c61` |
| `1cixV1` | `terminal-continue.jsonl`    | `0c19387ee0c032ae0b37c27f283d74c7ac285589e0bfc2aa334401b2c1ab84f6` |
| `1cixV1` | `terminal-collect.jsonl`     | `115ebc360c86e9f9f117be1af3d232be878f7a76bd083b640395fd8adb261e83` |
| `04mjGc` | `eval-status-extracted.json` | `6494f7629af2efd216284a778bef7a3fc94b902e746f43598599b4cb21a8c254` |
| `04mjGc` | `terminal-continue.jsonl`    | `2efa68d99ed2f9c84ac309c199f6dec586c257a59ab72a73abfd80637310da30` |
| `04mjGc` | `terminal-collect.jsonl`     | `061bf1df0b10da994a4d818a97ce84aceb943880cb5ab9919758e75f9641b861` |
| `L0GzfV` | `eval-status-extracted.json` | `b34013109996f00f4ff44417c0b02d63b64d70ed8a954ba3eae99e023bb23b26` |
| `L0GzfV` | `terminal-continue.jsonl`    | `2a00be79b9985075d34790f3ec8f4224e7def9a2c79f75e55d8f9a9d401dddfa` |
| `L0GzfV` | `terminal-collect.jsonl`     | `6a0b480b0dc88fcb9f9ffd001b5dd28319acacebc685767080fd7c3433fd6844` |

## Repeatable operational refinements

1. Compile the reviewed helper and pin source/compiled/native bytes. Stage exactly the prepared 56 assets beneath the copied adapter's inferred resource root. Keep each attempt's code/config immutable.
2. Wait for native location/plugin activation before checking discovery. Require evaluator `state.status: "active"`, exactly one owner, the actual evaluation/orchestration tools and the four subagent roles. A visible plugin descriptor is insufficient.
3. Create the native parent, then use the exact returned session/orchestration trace root in its role packet. Before the read-only child is dispatched, supply a mode-0400 Markdown fixture beneath `roles/researcher/`; instruct the child to read/reference it and cite the actual `a.txt` read separately. Do not imply supplied content proves work that has not occurred.
4. Obtain a genuine typed clarification, then arm once and dispatch the exact continuationPrompt to the same unresolved child with fresh native message/call. No replacement child, manual cancellation or fabricated callback. Use native CLI for the continuation when original-turn terminal coverage is required.
5. Collect saved native context/model/tool/terminal/events, driver raw/text/hashes, real acceptance refusal, current status/accounting and ordinary read. Resolve native truncation only through a referenced output file inside that exact isolated case. Keep credential databases/private server material and encrypted reasoning outside report artifacts.
6. Preserve cancelled records and uncertainty. Each retry, control version and mode gets a fresh root/instance/identities; stopping the owned test server is process cleanup, not protocol release or native child-termination proof.

## Remaining LIVE validation

1. Manually validate actual T3Code provider reload/catalog, owner Stop, visible child, parent rejection and ordinary read/status. These cases used driver-owned protocol cancellation and a native CLI; they do not prove T3Code UI actions.
2. GN-010-FRESH and planner/implementer/validator cancellation remain outside this researcher-only evaluator. Implement and validate a separately reviewed extension before claiming those cases.

Native termination remains **unconfirmed under the existing contract**. This is not a failure of these protocol-cancellation tests: none promises to interrupt or prove child termination. Cancelled runs remain unaccepted/non-retirable, with uncertainty retained. Owned isolated servers were stopped after collection; that process cleanup does not release old protocol records or prove native child termination.

No unconditional all-clear, managed acceptance, uncertain-run retirement/release, global installation update or general native-version compatibility is established by this record.
