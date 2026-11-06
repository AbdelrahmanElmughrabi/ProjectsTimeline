# ADR 0002 — Resume selection and workspace refresh

Status: Accepted by user, 2026-11-05, through the Continue Implementation brief; implementation record updated 2026-11-06. Scope: Resume slice only. See [feature alignment](../feature-alignment.md) and [verification](../verification.md).

ProjectsTimeline preserves project memory, reusable engineering workflows, evidence and verified release progress. Resume surfaces saved context rather than inferring development state from a task list.

Extend ProjectDetail with `resume: Checkpoint | null`. Main selects the newest project-owned checkpoint by UTC createdAt string, then highest ID on ties. The pure selector returns actual stored text/timestamps without mutation. No checkpoint means null. No new table, schema version, migration, IPC channel or dependency is needed.

One `useProjectWorkspace` hook owns selected-project snapshots, list reads, command state and refresh/retry handling. Form drafts remain in App. Resume and history render the same SQLite-derived query result; React does not independently select the latest checkpoint or infer a next action.

After acknowledgement of a command, query the selected project again; refresh the project list after creation. This adds a small local read in exchange for consistent panels without a cache library. Block conflicting writes during a command/refresh. Allow a newer project selection to supersede an outstanding open read; project ID and request tokens guard both successful and failed old responses, including cleanup.

Failure semantics:

- Failed/unacknowledged write: keep the entered draft and previously confirmed snapshot; never claim a save succeeded.
- Acknowledged write: clear only the submitted draft after the operation settles, including when its refresh fails. Other unsent form drafts remain.
- Acknowledged write plus failed refresh: display Saved, but could not refresh; mark the snapshot stale, hide stale Resume context and block further writes until reload/navigation. Retry loading performs reads only.
- Failed initial/open read: show an error and a read-only retry path. Never substitute context from another project.

The panel's first-checkpoint action focuses the existing checkpoint form; Continue with actions focuses the existing action form. Neither launches an editor nor restores an external development session. Current explicit-save and complete-only rules stay unchanged.

Ownership: the user will personally design and implement the future **stage-progress calculation and policy**. AI may help specify invariants/edge cases, review that design and code, and draft surrounding integration/tests. Do not generate that algorithm. Sensitive persistence/security/state/error code continues to require user review.

Automated results are recorded separately from user manual acceptance. No broad UI rewrite, stage implementation or release subsystem is authorized by this slice.
