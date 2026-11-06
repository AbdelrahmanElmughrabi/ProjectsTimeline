```ptb
{
  "ptb": "0.2",
  "kind": "project",
  "id": "proj.desk-notes",
  "title": "Desk Notes",
  "goal": "Keep a small offline engineering scratchpad whose saved notes survive a full application restart."
}
```
# Desk Notes

A solo developer needs a small desktop scratchpad for investigation notes. This is a planned project, not evidence of implemented or tested software. No release is required to begin work. The entire engineering blueprint is this one Markdown file.

```ptb
{
  "ptb": "0.2",
  "kind": "component",
  "id": "cmp.notes",
  "project": "proj.desk-notes",
  "title": "Local notes workspace"
}
```
## Local workspace

Editing and recovery should remain understandable without an account or network connection.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.notes-editor",
  "project": "proj.desk-notes",
  "title": "Edit and save a note",
  "component": "cmp.notes"
}
```
## Note editing

Start with a title and plain-text body. Saving must distinguish a committed write from an error so an unsaved draft is not lost.

```ptb
{
  "ptb": "0.2",
  "kind": "feature",
  "id": "feat.notes-recovery",
  "project": "proj.desk-notes",
  "title": "Recover saved notes after restart",
  "component": "cmp.notes"
}
```
## Recovery

Only saved text is promised after quitting. Do not imply that an unsaved draft was persisted.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.save-local",
  "project": "proj.desk-notes",
  "title": "Acknowledge a durable local save",
  "features": [
    "feat.notes-editor",
    "feat.notes-recovery"
  ],
  "type": "functional",
  "acceptance": [
    "A successful save stores the title and body together before displaying Saved.",
    "A failed write retains the draft and does not display a success acknowledgement."
  ]
}
```
## Save boundary

The UI cannot substitute an optimistic badge for a database acknowledgement.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.notes-restart",
  "project": "proj.desk-notes",
  "title": "Restore exact saved note text",
  "features": [
    "feat.notes-recovery"
  ],
  "type": "quality",
  "acceptance": [
    "After a full process exit and restart, opening the note restores its last successfully saved title and body.",
    "A note containing Unicode and multiple lines round-trips without truncation."
  ]
}
```
## Restart guarantee

Normal restart recovery is the first guarantee. Power-loss durability is outside this small project's initial scope and must not be claimed from this check.

```ptb
{
  "ptb": "0.2",
  "kind": "requirement",
  "id": "req.note-validation",
  "project": "proj.desk-notes",
  "title": "Reject invalid titles without losing text",
  "features": [
    "feat.notes-editor"
  ],
  "type": "constraint",
  "acceptance": [
    "A whitespace-only title is rejected with a field-specific message.",
    "The body remains editable after rejection and no invalid record is stored."
  ]
}
```
## Input quality

Validation failure is recoverable user input, not a reason to reset the form.

```ptb
{
  "ptb": "0.2",
  "kind": "scope",
  "id": "scope.durable-notes",
  "project": "proj.desk-notes",
  "title": "Make saved notes recoverable",
  "features": [
    "feat.notes-editor",
    "feat.notes-recovery"
  ],
  "workflow": {
    "stages": [
      {
        "key": "design",
        "title": "Define save behavior"
      },
      {
        "key": "build",
        "title": "Implement durable notes"
      },
      {
        "key": "check",
        "title": "Check failure and recovery"
      }
    ]
  }
}
```
## Optional development effort

This is an ordinary development scope, not a delivery candidate. It may remain draft while the developer starts with unscoped documentation. The three stages have no release-confirmation action or promised progress percentage.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.define-note-save",
  "project": "proj.desk-notes",
  "title": "Specify the save acknowledgement and failure boundary",
  "features": [
    "feat.notes-editor"
  ],
  "requirements": [
    "req.save-local",
    "req.note-validation"
  ],
  "scope": "scope.durable-notes",
  "stage": "design",
  "action_type": "decision",
  "instructions": "Write the expected success, invalid-title and database-failure responses before implementing save.",
  "applicability": "The first local save path.",
  "definition_of_done": "The three outcomes have observable UI and persistence conditions linked to their requirements.",
  "evidence_guidance": "A reviewed state table; this is design evidence, not a test pass."
}
```
## Save contract task

Decide what the acknowledgement means; do not mark the proposed storage decision accepted merely by importing this activity.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.persist-note",
  "project": "proj.desk-notes",
  "title": "Persist a validated note in one acknowledged write",
  "features": [
    "feat.notes-editor",
    "feat.notes-recovery"
  ],
  "requirements": [
    "req.save-local",
    "req.note-validation"
  ],
  "scope": "scope.durable-notes",
  "stage": "build",
  "action_type": "implementation",
  "instructions": "Validate the title, save title/body together and update the UI only after acknowledgement.",
  "applicability": "Notes stored on the local machine.",
  "definition_of_done": "Valid notes save atomically; rejected or failed writes preserve the draft without a success claim.",
  "evidence_guidance": "Focused store and UI success/failure results."
}
```
## Build the save path

A source-code change is not itself a passed recovery observation.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.check-note-restart",
  "project": "proj.desk-notes",
  "title": "Verify saved Unicode text after a complete restart",
  "features": [
    "feat.notes-recovery"
  ],
  "requirements": [
    "req.notes-restart"
  ],
  "scope": "scope.durable-notes",
  "stage": "check",
  "action_type": "verification",
  "instructions": "Save a multiline Unicode note, close the entire process, restart and compare the restored text.",
  "applicability": "The first persistent notes implementation.",
  "definition_of_done": "An actual restart observation records whether the saved text matches exactly.",
  "evidence_guidance": "Record the tested build identity, input and observed result; an imported plan is not this result."
}
```
## Exercise recovery

The check plan below defines the observation; no result has been recorded in this blueprint.

```ptb
{
  "ptb": "0.2",
  "kind": "action",
  "id": "act.document-note-recovery",
  "project": "proj.desk-notes",
  "title": "Document saved versus unsaved note recovery",
  "features": [
    "feat.notes-recovery"
  ],
  "requirements": [
    "req.notes-restart"
  ],
  "action_type": "documentation",
  "instructions": "Explain which text survives a normal restart and how a user recognizes an unsuccessful save.",
  "applicability": "Any version that promises local note recovery.",
  "definition_of_done": "A reader can distinguish saved recovery guarantees from unsaved draft behavior.",
  "evidence_guidance": "The authored recovery note reviewed against the actual behavior."
}
```
## Lightweight work without a scope

This proposal intentionally has no scope or stage. It can be adopted and completed from Features without creating a release or activating the optional development scope.

```ptb
{
  "ptb": "0.2",
  "kind": "decision",
  "id": "dec.notes-local-store",
  "project": "proj.desk-notes",
  "title": "Use a local transactional store for notes",
  "features": [
    "feat.notes-editor",
    "feat.notes-recovery"
  ],
  "requirements": [
    "req.save-local"
  ],
  "rationale": "A local transaction gives title/body a single save boundary while supporting offline use.",
  "alternatives": [
    "One plain-text file per note with an explicit atomic-replace policy.",
    "A local SQLite database with transactions."
  ]
}
```
## Proposed storage choice

The developer must still review the tradeoff. This record is neither an accepted ADR nor evidence that a database has been installed.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.notes-restart",
  "project": "proj.desk-notes",
  "title": "Compare saved text after process restart",
  "requirements": [
    "req.save-local",
    "req.notes-restart"
  ],
  "method": "manual",
  "expected": [
    "The last successfully saved title/body match exactly after full restart.",
    "Unicode and line breaks are preserved."
  ],
  "instructions": "Use a named test build, save a distinctive multiline note, quit, reopen and compare values."
}
```
## Planned restart observation

Record an actual outcome later with build/version identity. Import keeps this check Not run.

```ptb
{
  "ptb": "0.2",
  "kind": "check",
  "id": "check.notes-write-failure",
  "project": "proj.desk-notes",
  "title": "Inspect rejected and failed save behavior",
  "requirements": [
    "req.save-local",
    "req.note-validation"
  ],
  "method": "automated",
  "expected": [
    "An invalid title stores no row and keeps body text.",
    "An injected storage failure produces no success acknowledgement and preserves the draft."
  ],
  "instructions": "Use an isolated test profile and a controlled failed write; inspect both UI and persisted state."
}
```
## Planned error checks

Automated is the intended assessment method, not permission to execute a command or an assertion that it has passed.
