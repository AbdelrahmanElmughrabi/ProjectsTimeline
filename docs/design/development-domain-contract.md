# Development domain, ownership and lifecycle proposal

2026-11-06 · **Core behavioral design approved with counts-first refinement; not SQL or implemented development commands.** V1/V2 are implemented; V3 is design-only. Independent project records/scopes, one current scope/action, explicit lifecycle and audited moves remain approved. The V3 refinements below await D1–D5 review and concrete schema/DTO approval. [PTB](ptb-v0.2-contract.md) · [UX](connected-workspace-design.md) · [experience](v3-product-experience-contract.md) · [adoption/merge](blueprint-adoption-merge-policy.md).

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

## V3 refinements proposed for review

These supplement, rather than replace, the approved ownership/lifecycle above. No production state machine is changed in this phase.

| Concern | Recommended invariant / observable behavior |
| --- | --- |
| Definition acceptance versus action commitment | Accept a particular requirement revision separately from committing actions. Linked Draft requirements remain visibly unresolved; batch review shows and acknowledges them rather than silently accepting them. Accepting a requirement neither completes work nor creates evidence. |
| Scope activation | Draft plans have proposed placement only. A reviewed Apply may explicitly activate a chosen inline plan and commit chosen actions in one transaction; otherwise defer scoped commitment or explicitly choose unscoped placement. Preserve original proposed placement in provenance. No implicit activation from a selected action. |
| Work state (D4) | Committed applicable actions are Not started / In progress / Done. Explicit Start records state and chosen focus; it is not a timer. Complete and Reopen record real transitions; recommended Reopen → Not started until explicitly started again. Selecting, importing or opening a record never changes work state. Excluded/proposed work cannot start. |
| Focus | At most one chosen focus per project; selecting a new focus does not erase other In progress states. Saved Resume target is independent of current focus and remains the user's earlier intention. Neither focus nor number of In progress actions estimates elapsed time. |
| Blockers (D4) | Explicit authored reason linked to a record, with open/resolved lifecycle and actual resolution reason/time. Blocked is an independent attention marker, not another mutually exclusive work state or inferred dependency. An unresolved blocker prevents ordinary completion until explicitly resolved or dismissed with reason in the reviewed completion transaction. Preserve that disposition/history. |
| Local revision | Editing title/details/relationships creates an explicit local revision; source snapshot remains immutable. A meaningful change to Done work requires Reopen or a follow-up, not a rewrite of what was completed. Rename/reorganization preserves internal identities and historical references. Changes to requirements require explicit reacceptance of their new revision. |
| Local stage edits | Active development stage edits/reorder preserve stage identity and existing membership. Removing a populated stage requires explicit mapping/Unassigned disposition; terminal scope reopens first. No editor may silently discard committed work or synchronize a source template. |
| Definition versus truth | Draft/accepted requirement, proposed/accepted decision, planned check, completed action and actual requirement assessment are independent. Rich decision/evidence operations wait for their own slices; show Not assessed rather than treating a stored plan as verification. |
| Context | Saved target uses durable internal IDs and exact authored text; saved view/filter are optional return hints. If the hint hides the target, explain and offer Show target. If retired/missing, show the historical context plus current/history fallback; never silently select a replacement. |

The [adoption policy](blueprint-adoption-merge-policy.md) defines captured-versus-live source authority, idempotent receipts, explicit legacy binding and later three-way updates. “Keep local” advances the reviewed source baseline with an override marker; “Skip” does not. Omission never deletes local records. An imported source may not update completion, accepted decisions or actual observations.

### PTB's missing planning semantics (D5)

PTB v0.2 gives typed relationships and authored inline-stage order. It has **no approved priority, action dependency, blocker, schedule, action rank or start-hint fields**. Relationship/narrative order cannot supply these meanings. Current parser compatibility and deterministic source presentation stay unchanged.

| Need | Minimal proposed first behavior | Future extension gate |
| --- | --- | --- |
| Useful roadmap | Ordinal authored stages and feature organization, explicit local action ordering later | Persist order explicitly; file position never becomes priority. Reimport cannot override a local order silently. |
| Blocked work | Local authored blocker records, never source-as-outcome | Versioned source may propose constraints later; it cannot import resolved/actual blockers as historical events. |
| Dependencies / next work | No automatic prerequisite or recommendation engine; saved next step and chosen focus first | Separately specify same-project typed dependency targets, cycles, direction, optional/excluded prerequisites, freshness and override behavior before adding fields/ready queues. |
| Priority / starting point | Explicit user choice; neutral stable browse order | Versioned priority/rank/start-hint vocabulary and conflict rules. A hint stays a proposal, not a committed intention. |
| Calendar timeline | No bars/dates without actual authored scheduling | Specify date granularity/time zone, dependency on scope/action revisions, and unscheduled work display. No inferred duration from counts or stages. |

Do not silently operationalize unknown v0.2 metadata, rewrite the existing parser, or require a richer PTB version for basic adoption. Any extension needs deterministic validation, version negotiation, cross-file identity tests and an explicit contract change before implementation.
