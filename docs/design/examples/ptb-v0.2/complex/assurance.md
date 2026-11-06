```ptb
{
  "ptb": "0.2",
  "kind": "decision",
  "id": "dec.job-transaction",
  "project": "proj.field-ledger",
  "title": "Keep job state and required history in one local transaction",
  "features": [
    "feat.jobs",
    "feat.change-history"
  ],
  "requirements": [
    "req.job-atomicity"
  ],
  "rationale": "A partial history/state save would misrepresent what happened and complicate recovery.",
  "alternatives": [
    "Write state and history together in SQLite.",
    "Use a durable journal and reconcile explicitly after restart."
  ]
}
```
# Proposed transaction boundary

Import is not acceptance. The developer reviews complexity and failure guarantees before recording an accepted decision.

```ptb
{
  "ptb": "0.2",
  "kind": "decision",
  "id": "dec.invoice-representation",
  "project": "proj.field-ledger",
  "title": "Use bounded integer minor units for the initial currency policy",
  "features": [
    "feat.invoice-totals"
  ],
  "requirements": [
    "req.invoice-money"
  ],
  "rationale": "Explicit integer boundaries make the supported rounding and overflow examples reproducible.",
  "alternatives": [
    "Integer minor units under a limited precision policy.",
    "A reviewed decimal arithmetic dependency if future currency requirements justify it."
  ]
}
```
## Proposed money representation

No dependency is authorized by the alternatives list, and no policy is treated as approved automatically.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.job-rollback",
  "project": "proj.field-ledger",
  "title": "Reject invalid input and inspect failed history-write rollback",
  "requirements": [
    "req.job-validation",
    "req.job-atomicity",
    "req.recovery-feedback"
  ],
  "method": "automated",
  "expected": [
    "Invalid job input stores nothing and keeps entered fields.",
    "Job and history rows equal their pre-operation state after injected failure.",
    "The UI keeps the edited draft and a later retry saves once."
  ],
  "instructions": "Use an isolated profile, invalid customer input and controlled history-write failure; compare UI, state and event rows."
}
```
## Planned failure assessment

The check is Not run until an actual execution/observation is recorded with its tested revisions.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.job-restart",
  "project": "proj.field-ledger",
  "title": "Restore two jobs after full process restart",
  "requirements": [
    "req.job-restart",
    "req.recovery-feedback"
  ],
  "method": "manual",
  "expected": [
    "Each job restores its exact last saved fields offline.",
    "Switching jobs shows no stale draft from another record."
  ],
  "instructions": "Save distinct Unicode/multiline values in a named build, quit fully, restart and compare."
}
```
## Planned restart assessment

Keep this independent from any product release container.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.invoice-boundaries",
  "project": "proj.field-ledger",
  "title": "Evaluate approved invoice and overflow examples",
  "requirements": [
    "req.invoice-money"
  ],
  "method": "automated",
  "expected": [
    "Approved examples yield exact expected minor-unit totals.",
    "Unsupported precision/overflow is rejected through the specified error outcome."
  ],
  "instructions": "Use policy-versioned supported and invalid fixtures."
}
```
## Planned arithmetic assessment

The acceptance examples must exist and be reviewed before this check can produce a meaningful result.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.csv-boundaries",
  "project": "proj.field-ledger",
  "title": "Inspect cell encoding, cancellation and export destination",
  "requirements": [
    "req.csv-cells",
    "req.export-destination"
  ],
  "method": "manual",
  "expected": [
    "Supported readers interpret intended cell boundaries and formula-safe text according to the reviewed policy.",
    "Cancel writes nothing and failed writes produce no successful export claim."
  ],
  "instructions": "Use reviewed edge-case text and compare actual output/result at the selected destination."
}
```
## Planned file-boundary assessment

A plain test-plan document cannot establish successful spreadsheet-reader behavior.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.origin-labels",
  "project": "proj.field-ledger",
  "title": "Compare factual event origin with authored explanation",
  "requirements": [
    "req.recorded-origin"
  ],
  "method": "manual",
  "expected": [
    "Record identity and actual operation time remain linked to the event.",
    "Authored reason is distinguishable and no inferred duration appears."
  ],
  "instructions": "Perform one real edit and one real export in an isolated build, then inspect History and stored records."
}
```
## Planned history assessment

All definitions here are plans/proposals. There are no completed actions, passed runs, accepted decisions or release records in this package.
