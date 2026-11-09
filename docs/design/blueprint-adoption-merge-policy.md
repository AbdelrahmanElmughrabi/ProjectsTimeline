# Blueprint Adoption & Merge Policy — V3 review draft

2026-11-07 · **Proposed behavior, not SQL/commands already implemented.** Preserves [PTB v0.2](ptb-v0.2-contract.md), source capture and approved development/release separation. Reviewed after AG 92a7129. Visual improvements do not authorize its replacement-Set adoption behavior; these integrity rules remain authoritative. [Experience/VD3–VD5](v3-product-experience-contract.md) · [multi-format boundary](multi-format-ingestion-design.md). No migration is authorized here.

## Identities and authority

- Internal project/entity identity is permanent. External PTB ID is a bound source identity, never a filename/title or V2 occurrence key. Repackaging changes locations, not entity identity.
- V3a1a creates one initial PTB **source binding attached to** a new project; it is not the project's canonical identity. Repeated native PTB root ID opens that bound project. A legacy project can remain unbound indefinitely. Later attachment needs explicit target/crosswalk review, not title/path matching. See [final source-identity review](v3a1a-final-design-review.md): separate source/native IDs, multiple sources only through later approved commands, no automatic merge.
- Future adapters namespace their native bindings and require explicit reviewed crosswalks; extra source documents do not automatically replace the canonical PTB binding. Ordinary Markdown headings/links do not become engineering entities or dependencies. See the multi-format boundary before authorizing another adapter.
- Source captures are immutable exact documents/hashes/narratives/locations. Local working definitions and revisions are separate; editing in-app does not rewrite Markdown or pretend the source originally said something else.
- Definition approval, action commitment/placement, operational work state, accepted decisions and actual evidence are separate dimensions. Structural creation never implies those transitions.

| Truth | Initial application / later transition |
| --- | --- |
| Components/features | Persist project structure with stable IDs/source links; user may revise local definitions later |
| Requirements | Draft by default; explicitly selected definition revisions Accepted; never Verified by acceptance |
| Actions | Proposed/incomplete; explicitly selected actions Committed, with reviewed placement; no source completion imported |
| Scopes/stages | Draft plan by default; explicit activation and own stage instance; no release gate |
| Decisions | Proposed until a separate reviewed decision command; never silently approved by a batch of tasks |
| Checks | Planned/Not run; imported method/instructions are not results |
| History | Actual apply/adopt/edit/start/checkpoint events at actual command time; narrative is not past activity |

## New-project formation without rebuilding the plan

1. Reuse V2's captured graph/session and strict diagnostics. A human summary/map is a projection, not a second parser or AI summary. Blocking syntax/ownership/link errors prevent apply. Unresolved/incompatible workflow references can remain Draft/Needs review, but cannot activate or receive scoped commitments until explicitly resolved to a valid independent development plan. No silent release-template substitute, discarded source or fabricated stage.
2. Choose New project and a name; bind its external project identity. If that ID already exists, offer Open existing / Review update, never another automatic project. Title collision alone is informational.
3. Preserve **all validated definitions, source and relationships** as the proposed engineering plan. This is not acceptance of all work. Default requirement/action/activation selections are empty.
4. Multi-select a named group or exact subset, preview its concrete IDs/titles/count and effects, then final Apply reviewed choices. “Select all matching” means the entire declared filtered set, not only rendered rows; user must see the selection scope and exclusions. Grouping/order never infer priority.
5. For selected scoped actions, either explicitly activate the valid inline scope, leave them Proposed, or explicitly choose unscoped placement. Preserve original proposal placement as provenance. Never auto-activate or silently strip stages. Activating a scope does not commit all its other actions.
6. Linked requirements may remain Draft for research/uncertain work; display them and require explicit acknowledgement of that unresolved definition set. Committing an action never accepts them implicitly. A requirement linked from a check remains Not assessed regardless of action completion.
7. Final summary: target project, structural additions, accepted definition revisions, committed action IDs/placements, activated plan versions and unresolved acknowledgements. Decisions/checks left Proposed/Planned are stated separately. One atomic command/receipt performs the selected effects.

Choices are transient until Apply. Cancel discards the review, source/durable state unchanged. In-flight Apply says Saving; it cannot promise cancellation after commit. If it succeeds, leaving the screen is navigation, not “cancel import.” Mistakes are corrected explicitly with history: reopen work, exclude selected commitments with a shared recorded reason, or revise/retire definitions. No generic destructive Undo/graph deletion in the first slice. This limitation must be visible before broad adoption; wrong-project attachment needs strong target confirmation.

## Reviewed plans, transaction and uncertain acknowledgement

Candidate boundary, to finalize with the SQL/DTO review:

| Phase | Named main-owned responsibility | Writes |
| --- | --- | --- |
| Capture/review | Existing choose/refresh/cancel; render source/structure; transient selections | None |
| Prepare application | Validate target binding/current revisions, selection closure/placement/acknowledgements; return immutable reviewed plan token/digest/effect summary | None, including no persistent “draft import” |
| Apply reviewed batch | Match main-owned plan + exact digest/nonce; check or recover receipt; validate expected revisions; persist graph/choices/source/history/result atomically | One transaction |
| Recover result/read project | Read receipt/project; distinguish success-with-failed-refresh from failed command | Read only |

The app applies **the explicitly reviewed capture**, not whatever is currently on disk. Show capture identity/time; Refresh retires the plan and choices and requires new review. File changes do not silently replace the captured plan. No background watcher or false “live source” claim. If a known change is shown, the user must choose re-review or knowingly retain the displayed capture. Exact policy/DTO remains a pre-implementation gate.

Receipt identity must bind a main-issued submission nonce, reviewed batch digest, source capture/document hashes, target binding (new/existing), selected definition revisions, action placements, scope activations and unresolved acknowledgements. Store actual resulting project/entity IDs and transition outcome. Receipt lookup happens **before** rejecting the already-consumed preview/stale expected revisions: retry of the identical submission returns the existing result; reuse with different choices rejects. Changed choices get a new reviewed plan, never a guessed retry.

Atomicity includes source bindings/captures, all selected records/typed links, proposal/commitment/activation state, actual history, scope revisions and receipt. Any fault rolls back all of them. No partly created project or accepted subset from a failed transaction. Main supplies IDs/time; renderer sends choices, never an authoritative graph/SQL/path. Database constraints back same-project ownership and unique bindings.

Preview state itself is not crash-persistent. After restart, a committed receipt/project is discoverable by actual Home activity/source binding; repeat new-project creation of that bound ID cannot duplicate it. An uncommitted review is lost and must be selected again. Do not add durable pending-review storage merely to hide that boundary.

## Existing project attachment — explicit later complete slice

Design both paths now; implement new-project formation first. Attachment is not the old release-template copy operation.

1. Select the actual target project with name plus identity/context, not title matching. An unbound legacy project requires explicit first binding confirmation; existing source-bound project requires its matching canonical external project ID.
2. Compare current target revision/bindings with incoming definitions. New IDs are additions; known IDs are candidates for comparison, never duplicates. Existing legacy actions without external IDs remain Legacy work until deliberately mapped/adopted. No fuzzy title-based match.
3. Existing v0.2 packages must remain **reference-closed**: include the project and definitions of every referenced target. They are complete definitions, not patch objects. A small addendum referencing an existing DB-only feature currently fails standalone V2 validation; do not silently reinterpret that as valid. Either supply the reference closure or separately design a future explicit external-reference format/contextual validation mode.
4. Group additions/unchanged/local overrides/source changes/conflicts/context-only changes. New proposed definitions can be added in a batch; new actions/requirements still need separate operational approvals. A selected addition must include or resolve all its required links.
5. Resolve conflicts per field/relationship group; apply only a self-consistent reviewed delta against expected local/source revisions. The new-project and attachment commands share validation/source machinery, not an unbounded generic merge engine.

Example: attach a self-contained Vivarium addendum to a legacy project named “Pet tools.” The user deliberately binds proj.vivarium-3d-pet-generator; the name is not evidence. A later package with the same ID may propose req.local-first changes, but cannot reset existing action completion. A package with a different project ID is a binding mismatch requiring a separate reviewed mapping design, not a silent overwrite.

## Three-way update policy

Per externally bound record: **B** = last explicitly reviewed source baseline; **L** = current local working revision; **I** = incoming normalized definition/context. Preserve immutable B/L/I and per-field choices. Display source narrative/context changes separately from actionable definition/link changes; all retain provenance. Record-level omissions differ from omitted fields: v0.2 missing optional fields normalize to defaults, so apparent removals must be shown, not interpreted as patch “leave unchanged.”

| Comparison | Proposed review result |
| --- | --- |
| I = B, L = B | Unchanged; no content/event churn |
| I = B, L differs | Keep local override; do not propose old source as a new change |
| L = B, I differs | Source-only update proposal, explicit group approval required |
| I = L, both differ from B | Same change; acknowledge baseline without recreating work/completion |
| I differs from both B and L | Conflict; keep local default, choose incoming or authored resolution explicitly |
| Record omitted from incoming package | No deletion/retirement/completion change; optional “not supplied” notice |
| New incoming ID | Add definition/proposal after explicit group review; no implicit commitment |
| Known ID changes kind/project | Blocking identity conflict, no type coercion/rebinding |

When the user resolves **Keep local**, advance the *reviewed source baseline* to I and retain a local-override/decision marker. The same unchanged source should not demand the same conflict review forever. **Skip for now** does not advance that record's baseline; it remains unresolved. Changed source later reopens comparison against the new baseline. Receipt captures each choice so acknowledgement does not silently erase history.

Requirement definition changes produce a new Draft revision needing explicit reacceptance; old accepted definition/evidence remains historical. Initially be conservative rather than pretend a text change preserves meaning. Meaningful changes to Done action definitions require explicit Reopen and revise or a follow-up action; do not relabel old completion as satisfaction of new work. Stage reassignment/reordering preserves completion/identity with audited membership changes and terminal-scope guards. No edit to live development changes a confirmed release.

## Source/definition/operation revision consistency

Conceptual groups, **not a proposed numbered migration or ORM schema**:

- Project external identity binding; per-kind stable record bindings.
- Immutable source capture/documents/record locations and reviewed import receipts.
- Project-owned components/features/revisioned requirements and typed links.
- Development action context (commitment/work state/revision), proposed versus actual placement, scope/stage instances and membership history.
- Actual development events and optional checkpoint problem/intention/questions/typed links.
- Proposed decision/check definitions preserved now; accepted decision and actual assessment/provenance policies gate their later interaction schemas.

Use existing ordinary action IDs/details where safe, with main/DB guards so old complete/assign commands cannot complete proposals or route development actions into releases. Preserve legacy unbound work's original timestamps/completion; no fabricated “migrated approval.” Source capture applies do not invent prior history. Revisioned development-to-release snapshots remain deferred under the original decision.

## Essential acceptance scenarios before implementation approval

- Desk Notes: batch-select one unscoped action/requirement, persist all remaining definitions as proposals, checkpoint/restart with zero releases.
- Vivarium: one explicit scope activation organizes nine scoped commitments; the tenth stays unscoped; user does not configure 47 records individually. No accepted decisions/passed checks appear from applying.
- Cancel, prepare failure and changed source never mutate existing work. Fault each transaction phase; retry uncertain acknowledgement creates one project/receipt and exact selected effects.
- Existing project name match alone does nothing; first binding confirmed, wrong external project rejected; same IDs stay unique across reimports and file moves.
- Local-only/source-only/divergent/omitted/optional-field-removal changes follow the table; Keep local followed by same-source reimport does not repeat the conflict. Done/revised work and old evidence remain truthful.
- Populated schema-v3 projects/actions/events/checkpoints/templates/confirmed releases match before/after and after packaged restart. Migrations 001–003 immutable; backup/rollback/FK/newer-schema refusal retained.

Not claimed: implemented apply/merge, crash-recovery receipts, migration safety or usability testing of production V3. These require the separately approved vertical slices and tests.

## Reviewed adoption combinations and transition safety

The three independent groups remain requirement acceptance, scope activation and action commitment. **Default none means no new transitions selected.** Existing accepted/active/committed state is displayed read-only in this form, not copied into reversible checkboxes. Apply contains explicit deltas and expected revisions. Clear affects transient new choices only. Reject/exclude/revise/reassign/pause/close/reopen are dedicated reasoned commands; adoption never silently revokes them or rewrites completion/history.

| Selected effect | Validity / guard |
| --- | --- |
| Requirement acceptance only | Valid for the exact current Draft revision; no action/scope/evidence implication. |
| Scope activation only | Valid reviewed independent plan; no automatic action commitment. Empty plan/work shows counts/Not assessed, not completion. |
| Unscoped action only | Valid with explicit placement and accepted linked definitions or a deliberate acknowledgement of exact remaining Draft revisions. No scope required. |
| Source-scoped action + target activation | Valid in one transaction after same-project/stage/plan checks. Existing Active/Paused scope is eligible; terminal or unresolved plan is not silently opened/resolved. |
| Source-scoped action without eligible target | Reject unless user defers commitment or explicitly chooses unscoped placement. Preserve source proposal. |
| Mixed scoped/unscoped choices | Plan carries per-action placement; group helpers may set defaults but disclose each effect. First UI can require two reviewed batches if simpler; global mode must never reinterpret existing commitments. |
| Linked Draft requirement without acknowledgement | Reject; selecting all actions or scopes **cannot auto-check** acknowledgement. Changing selected definitions/revisions invalidates the acknowledged set. |
| Reopened review of committed/Done work | Existing status/membership/completion stays unchanged. Adopting another requirement cannot move or uncommit it. |
| No effective changes / duplicate submission | No new transitions/history. Identical completed submission returns the stored receipt; failed refresh retries reads only. |

Main validates binding/capture/expected revisions, all same-project typed links, eligibility/placement/acknowledgements and supported PTB 0.2. Validate the complete effect set first, then write definitions/acceptances/activations/memberships/history/receipt atomically. No separate createProject followed by graph writes. Receipt lookup for an identical completed retry precedes expired/consumed capture rejection. Cancellation before Apply is non-mutating; after commit use explicit corrective transitions, not deletion/Undo.

The current main preview session keeps a file grant, not a cached authoritative graph. Its next implementation must retain the exact reviewed main-owned snapshot/plan; never accept a renderer graph or silently recapture changed disk source during Apply. No persistent preview draft is required.

Exact document hash, narrative-inclusive semantic SHA and a possible future structural signature have distinct roles. Do not require a second stored graph digest in the first schema without a versioned normalization contract; never auto-merge/approve on graph equality. Existing semantic hash behavior/parser remains unchanged. Generated JSON is a labelled definition view, never an exact-source fallback.
