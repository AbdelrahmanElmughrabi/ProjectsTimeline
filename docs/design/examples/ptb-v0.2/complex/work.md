```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.specify-job-save",
  "project": "proj.field-ledger",
  "title": "Specify job save acknowledgement and rollback behavior",
  "features": [
    "feat.jobs",
    "feat.job-recovery"
  ],
  "requirements": [
    "req.job-atomicity",
    "req.recovery-feedback"
  ],
  "scope": "scope.offline-core",
  "stage": "design",
  "action_type": "decision",
  "instructions": "Write expected validation, write-failure and read-after-save outcomes, including which state is acknowledged.",
  "applicability": "The local job save path.",
  "definition_of_done": "A reviewed behavior table distinguishes a rejected save from a committed but stale display.",
  "evidence_guidance": "Authored contract and requirement links, not a test result."
}
```
# Design the save boundary

Do not conflate reviewing this activity with accepting the proposed storage decision.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.persist-job",
  "project": "proj.field-ledger",
  "title": "Save validated job data and required history atomically",
  "features": [
    "feat.jobs",
    "feat.change-history"
  ],
  "requirements": [
    "req.job-validation",
    "req.job-atomicity"
  ],
  "scope": "scope.offline-core",
  "stage": "build",
  "action_type": "implementation",
  "instructions": "Validate job fields and commit job/change rows together; preserve the draft on failure.",
  "applicability": "Offline job creation and editing.",
  "definition_of_done": "Invalid input stores nothing and an injected transaction failure leaves job/history unchanged.",
  "evidence_guidance": "Store transaction assertions and UI draft-retention observations."
}
```
## Implement the transaction

The action may address multiple requirements without making either requirement verified on completion.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.check-job-rollback",
  "project": "proj.field-ledger",
  "title": "Inject a history write failure and compare pre-save state",
  "features": [
    "feat.jobs",
    "feat.change-history"
  ],
  "requirements": [
    "req.job-atomicity",
    "req.recovery-feedback"
  ],
  "scope": "scope.offline-core",
  "stage": "check",
  "action_type": "verification",
  "instructions": "In an isolated profile, abort the required history insert and inspect rows and retained UI draft before retry.",
  "applicability": "Transactional job persistence.",
  "definition_of_done": "Actual results show rollback of all save writes and a recoverable draft, with a subsequent single successful retry.",
  "evidence_guidance": "Named test build, failure trigger and actual assertion output."
}
```
## Exercise rollback

This proposal does not install a trigger or execute a check while importing.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.check-job-restart",
  "project": "proj.field-ledger",
  "title": "Compare saved job and draft isolation after full restart",
  "features": [
    "feat.jobs",
    "feat.job-recovery"
  ],
  "requirements": [
    "req.job-restart",
    "req.recovery-feedback"
  ],
  "scope": "scope.offline-core",
  "stage": "check",
  "action_type": "verification",
  "instructions": "Save two distinct jobs, fully quit, restart offline and compare each record and displayed fields.",
  "applicability": "The first recoverable job-editing implementation.",
  "definition_of_done": "An actual restart observation compares saved values and confirms no cross-job draft leak.",
  "evidence_guidance": "Recorded build/profile identity and exact before/after values."
}
```
## Restart independently of a release

Verification work belongs to development here; it does not imply publication or release confirmation.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.specify-invoice-precision",
  "project": "proj.field-ledger",
  "title": "Review supported currency precision and rounding examples",
  "features": [
    "feat.invoice-totals"
  ],
  "requirements": [
    "req.invoice-money"
  ],
  "scope": "scope.invoice-export",
  "stage": "design",
  "action_type": "research",
  "instructions": "Choose supported precision, rounding point and overflow behavior with representative invoice examples.",
  "applicability": "The initial supported currency policy.",
  "definition_of_done": "Examples and explicit limitations are approved before using them as calculation acceptance criteria.",
  "evidence_guidance": "Authored examples and the actual policy approval record."
}
```
## Define financial boundaries

No jurisdiction-specific tax or accounting compliance is claimed by this blueprint.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.compute-invoice",
  "project": "proj.field-ledger",
  "title": "Implement integer-minor-unit totals for approved examples",
  "features": [
    "feat.invoice-totals"
  ],
  "requirements": [
    "req.invoice-money"
  ],
  "scope": "scope.invoice-export",
  "stage": "build",
  "action_type": "implementation",
  "instructions": "Implement the reviewed arithmetic and explicit invalid/overflow outcomes.",
  "applicability": "Invoice totals under the accepted precision policy.",
  "definition_of_done": "The named supported examples and invalid boundaries produce the reviewed outcomes.",
  "evidence_guidance": "Focused calculation results against the approved examples."
}
```
## Build reproducible arithmetic

The precision decision remains a separate proposed record until explicitly accepted.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.encode-csv",
  "project": "proj.field-ledger",
  "title": "Encode CSV boundaries and reviewed formula-safe text",
  "features": [
    "feat.csv-export"
  ],
  "requirements": [
    "req.csv-cells",
    "req.export-destination"
  ],
  "scope": "scope.invoice-export",
  "stage": "build",
  "action_type": "implementation",
  "instructions": "Implement the chosen cell policy and write only through the explicit selected-file operation.",
  "applicability": "Local invoice CSV export.",
  "definition_of_done": "Quoted/multiline/formula-leading text has documented supported-reader behavior and chooser cancellation writes nothing.",
  "evidence_guidance": "Golden cell fixtures, destination assertions and actual supported-reader observations."
}
```
## Encode deliberately

Do not select a destination or launch a spreadsheet merely from imported instructions.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.check-export",
  "project": "proj.field-ledger",
  "title": "Verify export values, destination and failed-write feedback",
  "features": [
    "feat.invoice-totals",
    "feat.csv-export",
    "feat.change-history"
  ],
  "requirements": [
    "req.invoice-money",
    "req.csv-cells",
    "req.export-destination",
    "req.recorded-origin"
  ],
  "scope": "scope.invoice-export",
  "stage": "check",
  "action_type": "verification",
  "instructions": "Exercise representative output, chooser cancel and failed write; compare actual file/result/history.",
  "applicability": "The first reviewable invoice export.",
  "definition_of_done": "Recorded observations cover exact chosen destination, expected cells, no file on cancel and no successful-export event on failure.",
  "evidence_guidance": "Named artifact, file fixture comparison and actual failure/cancel results."
}
```
## Check the complete boundary

Several requirements can share a check without sharing a fictitious verification result.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.record-change-origin",
  "project": "proj.field-ledger",
  "title": "Record edit/export origins separately from authored reasons",
  "features": [
    "feat.jobs",
    "feat.csv-export",
    "feat.change-history"
  ],
  "requirements": [
    "req.job-atomicity",
    "req.recorded-origin"
  ],
  "scope": "scope.offline-core",
  "stage": "build",
  "action_type": "implementation",
  "instructions": "Store actual operation/time/record linkage and label optional human-entered reason distinctly.",
  "applicability": "Recorded job edits and invoice exports.",
  "definition_of_done": "History identifies real operations and authored rationale without inventing sessions or durations.",
  "evidence_guidance": "Stored event samples from isolated actual operations and rollback checks."
}
```
## Shared action, one identity

This cross-cutting action may be reviewed in either scope's feature context. Moving it later requires explicit reassignment, not a second task per tab or feature.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.research-recovery-note",
  "project": "proj.field-ledger",
  "title": "Write the supported local recovery and backup limitations",
  "features": [
    "feat.job-recovery"
  ],
  "requirements": [
    "req.job-restart"
  ],
  "action_type": "documentation",
  "instructions": "Describe the normal restart guarantee and separate it from untested corruption or power-loss recovery.",
  "applicability": "Any version exposing saved local job data.",
  "definition_of_done": "The note states supported recovery steps and honest untested limits.",
  "evidence_guidance": "Authored guidance checked against actual restart observations."
}
```
## Unscoped supporting work

This action can be adopted independently of both scope activations and every release.
