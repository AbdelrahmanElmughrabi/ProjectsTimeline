# Development domain, ownership and lifecycle proposal

2026-11-06 · **Behavioral design approved with counts-first refinement; not SQL or implemented development commands.** Independent project records/scopes, one current scope/action, explicit lifecycle and audited moves are approved. Only V1 Home is authorized now; concrete schema/DTOs need their separate review. [PTB](ptb-v0.2-contract.md) · [UX](connected-workspace-design.md).

## Ownership and boundaries

| Record | Ownership / invariants |
| --- | --- |
| Project | Permanent boundary for every development record/link; scopes/releases are optional. |
| Component / feature | Project-owned; component parents acyclic. Feature has zero/one primary component and participates in many scopes over time. Moving a feature does not recreate it. |
| Requirement | Project-owned, draft/accepted/retired revisions. Cross-cutting and multi-feature relations allowed. Editing statement, acceptance or applicability creates a new revision, not a changed historical assertion. |
| Development action | One project, stable identity across proposal/adoption/views; many explicit feature/requirement links. Zero/one **current** scope, with preserved membership history. Completion/applicability/commitment are separate. |
| Development scope | Optional focused effort over zero/many features, with optional independent workflow instance. No release-confirmation obligation. |
| Decision / check | Proposed/accepted/rejected/superseded decision history; check definition separate from actual assessment/run. Import cannot accept a decision or create an outcome. |
| Checkpoint / event | Project-owned actual save/transition with linked context; preserve user-authored reasoning separately from system transition facts. |
| Release | Existing v3 ownership, gates, revisions, provenance and frozen confirmations remain intact. Future development capture uses revisioned snapshots, not a live completion join. |

Reuse ordinary `actions`/`action_details` through additive development context, explicit links and main-side guards. Existing release-bound rows stay in the release subsystem. New development commitments must not flow through `assignAction(releaseId, ...)`. Legacy unbound work keeps its real completion/history and existing interactions; show Legacy work until explicitly classified/adopted, never invent an import/commit event in the past. Legacy releases are not development scopes.

PTB identities are project-bound external IDs, distinct from internal IDs. All views share the same actual action ID after import/adoption; no duplicate action per feature or tab. Imported proposals may use existing base action rows plus new context, but old generic completion APIs must reject new uncommitted/rejected proposals. Exact additive tables/DTOs and migration guards are the next schema review, not implicit approval here.

## Scope lifecycle

| State / transition | Guard and meaning |
| --- | --- |
| New/imported → Draft | Plan and proposals only; edit features/workflow, no committed membership until activation. |
| Draft → Active | Explicit user activation, reviewed stage plan; may batch chosen action commitments in the same transaction. Empty scope allowed, readiness Not assessed. |
| Active ↔ Paused | Explicit intent flag; reason on pause recommended. Pausing is not a permission lock or elapsed-time tracker. Actual work/completion may still be recorded while paused, without automatic resumption. |
| Active/Paused → Closed | All current applicable committed actions complete; remaining work explicitly reassigned or excluded with reasons. Proposals do not count or imply completion. Record immutable closure summary/revision. This means effort closed, not software verified/delivered. |
| Draft/Active/Paused → Cancelled | Reason required; first resolve every committed membership through explicit reassignment or reasoned exclusion. Persist disposition/history; no destructive cascade. |
| Closed/Cancelled → Active | Explicit reopen with reason, new revision/event; previous closure/cancellation records remain immutable. New/edit/reopen/move work in a terminal scope requires this transition first. |

Terminal scopes are protected from ordinary edits; reopening is an explicit audited operation, unlike permanently frozen confirmed releases. Feature/requirement identity remains editable through new revisions, but closing evidence retains its recorded versions. Deleting tracked scopes/actions or silently marking incomplete work complete is not supported. No separate archive/visibility lifecycle in this slice.

## Action commitment, completion and reassignment

- New/imported/suggested work is Proposed and incomplete. Explicit adoption makes it Committed; reject makes it Rejected with a recorded reason. Rejected → Proposed is an explicit reconsideration. Commitments are never undone by deleting history; reasoned exclusion removes applicable work from the current denominator without asserting completion. Draft requirements may be linked, with visible unresolved status.
- Only committed ordinary development actions can be completed/reopened or excluded/restored. Completion is idempotent; reopening clears current completion while events retain the old outcome/time. Re-completion records a new actual time. Exclusion and completion stay distinct. Source text, check plans or accepted decisions cannot complete an action.
- Proposed scope/stage links express intended placement; commitment validates an Active/Paused target. A committed unscoped action is valid lightweight work. An in-scope action with no stage is explicitly Unassigned. A scope with no workflow is valid; it does not acquire a default stage or gate.
- Reassignment is same-project, explicit, one transaction: validate action/source/target revisions, target lifecycle, stage ownership and applicability; preserve action ID, links, actual completion and source provenance; append before/after membership event and advance both affected scope revisions once. Moving to unscoped work clears the stage; switching scopes requires selecting a target stage or explicitly Unassigned. Existing excluded work remains excluded unless explicitly restored. No cross-project or release-bound transfer.
- A completed action may move only with explicit acknowledgement that already-done work follows it; no new completion time is invented. If the activity's meaning changes, create a follow-up action instead. Terminal source/target scope requires explicit reopen first. Failure/stale revision rolls back membership, counters/revisions and history together.
- Changing an instantiated workflow requires an explicit stage mapping/review; never drop accepted work when replacing a stage/template. Template edits never synchronize into existing scopes. For the first slice, workflow replacement can remain unavailable rather than approximate this mapping.

## Progress and evidence are different policies

**Initial presentation approved: truthful counts and Not Assessed; percentages remain unapproved.** No project/feature/scope percentage is implemented or implied. Candidate later formula: equal included-stage mean of completed applicable committed actions; empty included stages or in-scope Unassigned actions withhold percentage; unscoped work remains outside any scope denominator. Stage-less scopes show counts without stage-weight percentage. Scope closure is guarded independently of arithmetic. If separately approved, 100% means accepted work complete, not requirement verified or release ready. Out-of-order work is allowed. No mandatory “confirmation” action is added.

Assessments must reference exact requirement/check-definition revisions and actual observation/provenance. Missing, failed and stale are distinct from passed. A changed relevant revision must not retain a current verified label; keep old results historically readable. Scope/work-definition changes conservatively stale scope assessments until a finer dependency policy is approved. Action completion alone is not evidence freshness. Planned automated checks never run merely because PTB says `automated`. Actual-run recording, freshness and release capture need separate policy approval before their implementation.

## Context, concurrency and compatibility

Checkpoint additions are optional problem/intention/unresolved questions plus links; existing accomplishment/nextSteps and UTC time/ID ordering survive unchanged. Continue follows an explicitly linked saved target; otherwise retains current form-focus behavior. Never infer intention from completed actions or overwrite an older authored checkpoint when a requirement changes.

Mutations take expected record/scope revisions; stale writes ask for refresh/review and retain input. Effective changes increment affected revisions and audit once, no-ops do neither. Main owns timestamps and validates same-project typed links; database constraints back those boundaries. Events keep immutable before/after values and actors/origin, not made-up past dates. Acknowledged save plus failed refresh retries reads, not the command.

Before any migration, review concrete tables/constraints and a populated-v3 preservation fixture: all original IDs, text, timestamps, completion, templates/origins, release revisions/provenance/confirmation, events and checkpoints must match before/after and after packaged restart. Keep 001–003 immutable, existing policy function/security unchanged and backup/rollback/newer-schema refusal. This document approves no migration number or schema by itself.
