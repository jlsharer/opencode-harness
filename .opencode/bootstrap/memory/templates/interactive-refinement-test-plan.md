# Interactive Refinement: [goal]

> Human-maintained manual test plan. The optional JSON record schema at `.opencode/schemas/interactive-refinement-test-plan.schema.json` represents these concepts but does not validate this Markdown. Owner observations and verdicts are not independent validator evidence.

## Agreement

- Goal (`goal`): [specific feature or defect]
- Measurable success criteria (`successCriteria`): [observable, testable criteria]
- Owner and agreement date (`owner`, `agreedAt`): [owner], [date]
- Manual environment and setup: [environment, access and prerequisites; no secrets]
- Finite maximum rounds (`maxRounds`): [positive integer, agreed before changes]
- Agent/attempt budget: [bounded budget, subject to orchestration policy]
- Current plan version (`currentVersion`): [version]
- Overall status: [pending / in progress / stopped / complete]
- Next safe action: [specific action or blocker]

## Version history

Retain earlier entries; never rewrite previous round observations to match later instructions.

| Version | Date | Round ID | Revision summary / reason | Task IDs added, changed, retired |
| --- | --- | --- | --- | --- |
| [version] | [date] | [round ID] | [delta from previous version] | [IDs and changes, or none] |

## Round [index] — [round ID]

Copy this section for each round in chronological order; keep all earlier sections. `index` starts at 1 and must not exceed the agreed `maxRounds`. Preserve task IDs for unchanged tasks; when meaning changes, explain the change in version history. A new round must state what prior owner feedback it addresses.

- Round index (`rounds[].index`): [positive integer]
- Round ID (`rounds[].id`): [stable ID]
- Plan version (`rounds[].version`): [version]
- Version-change summary (`rounds[].versionChangeSummary`): [added/changed/retired task IDs and rationale, or initial version]
- Bounded change scope (`rounds[].scope`): [paths/behavior under test]
- Previous feedback and targeted delta (`rounds[].previousFeedbackAndDelta`): [reference and change, or initial round]
- Automation evidence (`rounds[].automation`): pending / available; [command, exit result, evidence references, or reason pending]
- Independent validator evidence (`rounds[].validator`): pending / available; [task/trace and gate references, outcome, or reason pending]. Do not label available evidence as passing unless the validator actually reports it.

### Manual tasks (at least one)

#### Task [stable task ID] — [title]

- Setup (`tasks[].setup`): [prerequisites and starting state]
- Ordered steps (`tasks[].steps`):
  1. [action]
  2. [action]
- Expected observable outcome (`tasks[].expectedOutcome`): [specific observable result]
- Actual result (`tasks[].actual.status`): pending / observed
- Actual observations (`tasks[].actual.observations`): [owner's observations when performed; leave pending otherwise]
- Questions (`tasks[].questions`): [open questions, or none; mark unanswered questions pending]
- Owner task feedback (`tasks[].ownerFeedback`): [owner input if supplied, otherwise pending]

### Decision and handoff

- Owner feedback (`rounds[].ownerFeedback`): pending / provided; [owner statement if provided]
- Owner verdict (`rounds[].ownerVerdict`): pending / needs-work / success / blocked; [owner and date when decided]
- Success criteria assessment: [criterion-by-criterion observations; pending until reviewed]
- Next action (`rounds[].nextAction`): [one bounded next round, new PRD goal if applicable, stop reason, or await owner]
- Handoff: [next role or owner action and references to scoped task/trace artifacts]

Do not claim code acceptance from a manual verdict. Independent validator evidence is required for code acceptance, and owner success is required to close the manual iteration. Stop on a failed gate, missing owner decision, blocker, exhausted budget, or unsafe interruption rather than inventing a pass. The JSON field names in parentheses show correspondence; Markdown is not machine-validated by that schema.
