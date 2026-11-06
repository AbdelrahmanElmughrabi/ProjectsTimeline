```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.jobs",
  "project": "proj.field-ledger",
  "title": "Edit a field-service job",
  "component": "cmp.desktop"
}
```
# Job records

Capture customer label, work description and line items. Reject invalid input without erasing a draft.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.job-recovery",
  "project": "proj.field-ledger",
  "title": "Restore saved jobs offline",
  "component": "cmp.storage"
}
```
## Restart recovery

Saved jobs must be restored when the application is fully reopened without a network connection.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.invoice-totals",
  "project": "proj.field-ledger",
  "title": "Calculate reproducible invoice totals",
  "component": "cmp.billing"
}
```
## Invoice calculation

Use an explicit supported currency/rounding policy. Do not claim arbitrary currency/tax support from a minimal calculator.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.csv-export",
  "project": "proj.field-ledger",
  "title": "Export invoice rows to a chosen CSV file",
  "component": "cmp.exchange"
}
```
## Export

The user must see the destination and result. Failure must not be presented as successful delivery.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.change-history",
  "project": "proj.field-ledger",
  "title": "Explain recorded edits and exports",
  "component": "cmp.storage"
}
```
## Shared engineering context

This feature belongs to the project, not either development scope. A recorded edit/export is factual; timestamps do not establish how long the developer worked.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.job-validation",
  "project": "proj.field-ledger",
  "title": "Reject malformed job input without data loss",
  "features": [
    "feat.jobs"
  ],
  "type": "functional",
  "acceptance": [
    "A missing customer label produces a specific validation message and no saved job.",
    "The entered description and valid line items remain available for correction."
  ]
}
```
## Recoverable validation

Validation errors must be tested separately from database failures.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.job-atomicity",
  "project": "proj.field-ledger",
  "title": "Commit a job and its change record together",
  "features": [
    "feat.jobs",
    "feat.change-history"
  ],
  "type": "constraint",
  "acceptance": [
    "Job data and its recorded change are committed in one transaction.",
    "A failure while writing either part leaves neither partial update visible."
  ]
}
```
## Transactional intent

A history entry without its corresponding state, or state without its required history, is not a successful save.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.job-restart",
  "project": "proj.field-ledger",
  "title": "Recover exact saved job data after restart",
  "features": [
    "feat.jobs",
    "feat.job-recovery"
  ],
  "type": "quality",
  "acceptance": [
    "Full process restart restores saved customer, description and line items.",
    "Opening a different job does not show a previous job's unsaved fields."
  ]
}
```
## Persistence check

The normal restart guarantee is separate from disaster recovery or corrupt-database repair.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.invoice-money",
  "project": "proj.field-ledger",
  "title": "Apply the reviewed minor-unit rounding policy",
  "features": [
    "feat.invoice-totals"
  ],
  "type": "functional",
  "acceptance": [
    "Supported invoice examples produce the reviewed integer-minor-unit totals.",
    "Unsupported numeric precision or overflow is rejected explicitly instead of silently rounded by floating-point behavior."
  ]
}
```
## Money boundaries

The proposed representation decision requires acceptance before its behavior is treated as approved scope.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.csv-cells",
  "project": "proj.field-ledger",
  "title": "Preserve CSV cells and neutralize formula-leading text",
  "features": [
    "feat.csv-export"
  ],
  "type": "constraint",
  "acceptance": [
    "Commas, quotes and multiline text round-trip as intended cells.",
    "A documented reviewed policy prevents untrusted cell text from being interpreted as a spreadsheet formula in supported readers."
  ]
}
```
## CSV meaning

Escaping field separators alone does not settle spreadsheet formula handling; review and document the policy explicitly.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.export-destination",
  "project": "proj.field-ledger",
  "title": "Write only to the explicitly selected export destination",
  "features": [
    "feat.csv-export"
  ],
  "type": "constraint",
  "acceptance": [
    "The displayed destination is the file the user selected.",
    "Cancelling the chooser creates no file; a failed write reports failure and does not record a successful export."
  ]
}
```
## User-owned export

No automatic overwrite, remote destination or background transfer is implied.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.recorded-origin",
  "project": "proj.field-ledger",
  "title": "Distinguish actual changes from authored explanations",
  "features": [],
  "type": "quality",
  "acceptance": [
    "Saved edits and exports carry actual record identity, operation and observation time.",
    "Human-authored reasons remain labeled as authored and no duration or prior session is inferred."
  ]
}
```
## Project-wide requirement

This assertion is intentionally cross-cutting, with no forced feature assignment.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.recovery-feedback",
  "project": "proj.field-ledger",
  "title": "Keep a failed save recoverable in the UI",
  "features": [
    "feat.jobs",
    "feat.job-recovery"
  ],
  "type": "functional",
  "acceptance": [
    "A failed save retains the edited draft and offers an explicit retry.",
    "A committed write followed by failed refresh is labeled as saved but stale and retries reading rather than saving twice."
  ]
}
```
## Failure after acknowledgement

Separate commit acknowledgement from screen refresh so retry cannot duplicate work.
