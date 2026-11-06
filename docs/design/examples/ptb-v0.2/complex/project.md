```ptb
{
  "ptb": "0.2",
  "kind": "project",
  "id": "proj.field-ledger",
  "title": "FieldLedger",
  "goal": "Manage field-service jobs offline and produce reviewable invoice exports without losing saved work.",
  "documents": [
    "domain.md",
    "work.md",
    "assurance.md"
  ]
}
```
# FieldLedger

A small field-service business needs a local desktop workspace for jobs and invoice exports. This blueprint separates offline reliability from billing/export development while retaining shared audit requirements. It defines intended work, not completed engineering or verified releases.

```ptb
{
  "ptb": "0.2",
  "kind": "component",
  "id": "cmp.desktop",
  "project": "proj.field-ledger",
  "title": "Desktop workspace"
}
```
## Workspace

Job entry, saved context and error feedback must work offline.

```ptb
{
  "ptb": "0.2",
  "kind": "component",
  "id": "cmp.storage",
  "project": "proj.field-ledger",
  "title": "Local persistence",
  "parent": "cmp.desktop"
}
```
## Persistence boundary

Store job data and recorded changes atomically. Local storage is not a network synchronization mechanism.

```ptb
{
  "ptb": "0.2",
  "kind": "component",
  "id": "cmp.billing",
  "project": "proj.field-ledger",
  "title": "Invoice calculation"
}
```
## Billing

Define currency rounding explicitly; the blueprint does not substitute for an accountant's policy review.

```ptb
{
  "ptb": "0.2",
  "kind": "component",
  "id": "cmp.exchange",
  "project": "proj.field-ledger",
  "title": "Controlled file export"
}
```
## Export boundary

Exports are user-selected local files. No cloud account, automatic upload or release is required.

```ptb
{
  "ptb": "0.2",
  "kind": "scope",
  "id": "scope.offline-core",
  "project": "proj.field-ledger",
  "title": "Reliable offline job editing",
  "features": [
    "feat.jobs",
    "feat.job-recovery",
    "feat.change-history"
  ],
  "workflow": {
    "stages": [
      {
        "key": "design",
        "title": "Specify offline behavior"
      },
      {
        "key": "build",
        "title": "Build local work paths"
      },
      {
        "key": "check",
        "title": "Exercise failure and restart"
      }
    ]
  }
}
```
## Offline effort

The project can activate this scope while the invoice/export effort stays draft. Cross-cutting change history retains its identity across both efforts.

```ptb
{
  "ptb": "0.2",
  "kind": "scope",
  "id": "scope.invoice-export",
  "project": "proj.field-ledger",
  "title": "Reviewable invoices and safe CSV export",
  "features": [
    "feat.invoice-totals",
    "feat.csv-export",
    "feat.change-history"
  ],
  "workflow": {
    "stages": [
      {
        "key": "design",
        "title": "Specify money and export contracts"
      },
      {
        "key": "build",
        "title": "Implement calculation and export"
      },
      {
        "key": "check",
        "title": "Verify representative boundaries"
      }
    ]
  }
}
```
## Billing/export effort

Stage keys are scoped: this scope's build stage is not the offline scope's build stage. Neither includes a release-confirmation gate.
