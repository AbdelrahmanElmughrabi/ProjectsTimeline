# Development Stages & Progress Tracking — design alternatives

Status: **Planning only; data model and policy approval pending.** Updated: 2026-11-06. No application, migration, contract or test implementation changes. The user personally designs/writes the core progress policy; this is a decision brief and proposed black-box acceptance specification, not an algorithm or pseudocode.

Current baseline: projects, project-owned actions and append-only project checkpoints in schema v1. No releases, stages, applicability, commitment or transition history exist yet. Resume, Visual Foundation, SQLite and Electron boundaries stay intact. Existing verified work is saved in Git checkpoint **78a7758**; last recorded application result is 25/25 passing, with remaining user manual checks still pending.

## Original intent confirmed by the user

| Order | Original default stage | Purpose |
| --- | --- | --- |
| 1 | Requirements and Planning | Goals, scope, features and acceptance criteria |
| 2 | UX, Architecture, and Technical Design | Interactions, architecture, data flow and decisions |
| 3 | Development Environment and Project Setup | Tooling, dependencies, configuration and environment |
| 4 | Implementation | Build features and verify individual functionality |
| 5 | Integrated Release Verification | Test the complete candidate, including relevant security, reliability and integration checks |
| 6 | Release Preparation | Documentation, versioning, release configuration and recovery procedures |
| 7 | Deployment/Distribution and Release Confirmation | Publish/distribute and verify the released version works |

For seven stages with applicable committed work, the original mathematical rule is:

**StageProgress = completed applicable committed actions / total applicable committed actions.**

**OverallProgress = 100 × (sum of the seven StageProgress fractions) / 7.**

Three complete stages and four zero-progress stages produce **42.857142…%, displayed approximately 42.86%**. Every stage has equal weight, regardless of item count. This measures checklist readiness, not time spent, time remaining or a guarantee of defect-free software.

Confirmed rules: later stages may progress early; current stage is the earliest ordered stage containing unfinished applicable committed work; scope additions/reopening recalculate progress; irrelevant items require recorded exclusion reasons; suggestions do not count until committed to a release; MVP reduces feature scope rather than necessary verification; 100% requires all applicable committed work and final release confirmation. Ideas have no percentage until promoted and given an assessed work scope.

**Terminology still requiring confirmation:** the formula names actions, while some requirements use “requirements.” Recommendation: count committed checklist actions using the existing action model; future product/engineering requirement records link to them rather than becoming a second denominator. Counting distinct requirements instead is a valid different model, but requires requirement records and a satisfaction policy before this milestone. The examples below use the action-based interpretation without declaring that ambiguity settled.

## Scope alternatives and database implications

| Model | Meaning and benefit | Database/migration cost | Main limitation |
| --- | --- | --- | --- |
| A. Project-owned stages | One mutable workflow for the project's lifetime; smallest addition today | project_stages plus action stage/applicability/history fields; no release container initially | New work changes the same number. Preserving a confirmed release later requires snapshots or copying data into a new release model; it cannot be solved by relabelling the existing percentage |
| B. Release-owned stage instances — recommended | A long-lived project contains separate planned releases, each with its own scope, stage instances and item states | Add a minimal release container, release_stages and explicit action membership/assignment; enforce same-project/release relationships | More initial modelling and migration work; release selection must be explicit, and confirmation needs a real record rather than an unchecked boolean |
| C. Mutable project workflow + release snapshots | Keep one live project workflow, snapshot it when confirming a release | Project stages plus immutable release snapshots and snapshot item/configuration membership | Supports historical records but creates two progress contexts and makes overlapping releases awkward; new development still needs a defined draft scope, not a snapshot of unrelated global state |

**Recommendation B:** release-owned instances, with reusable project/template defaults copied into them later. This matches the user's original intention that a confirmed release stays at 100% while a new release begins. A planned-release container is not a complete publishing platform. Templates are configuration sources, not live stage references whose edits rewrite older releases. Do not add a generic polymorphic workflow-owner abstraction now.

Display the selected release's checklist readiness, not an average of all releases as “project completion.” With no selected/defined release, show **Not assessed** and the existing project actions/Resume. Future work on release B never mutates release A's stage/item scope or evidence. Automatic inheritance of completed items into B is inappropriate; any reused work/evidence needs explicit review for B.

## Candidate data boundaries — not approved SQL

- **Release:** project owner, stable identity/label, working/confirmed lifecycle, scope revision and eventual candidate/source/artifact identity. Exact lifecycle fields and confirmation method require approval.
- **Release stage:** release owner, stable ID, default semantic key where applicable, editable display name/order and explicit inclusion/exclusion reason. Percentages and derived stage states are not stored.
- **Action:** existing project/title/timestamps retained; proposed nullable release/stage membership, commitment/applicability information and protected-item kind where needed. One counted action belongs to one release and at most one stage; splitting work creates separately identified items, not duplicate counting through multiple assignments.
- **Action/scope events:** append-only commit, complete, reopen, exclude/reinclude, reassign and configuration-change history, with actual previous/new relevant values, reason where required and main-generated time. Mutation and its event commit atomically. Repeating an idempotent completion creates no fake extra transition or new completion timestamp.
- **Confirmation record:** release/candidate identity, timestamp and evidence/reference; tied to a protected final-confirmation obligation. No publication or verification claim is invented from an ordinary action tick.

Same-project/release ownership needs database constraints as well as validated commands. Composite foreign keys need matching unique parent keys, and nullable keys need explicit protection against a non-null stage with no release. Adding stronger constraints can require rebuilding actions, not just appending a column. The existing runner begins a transaction before migration SQL, while SQLite ignores foreign_keys changes inside a transaction: review any reconstruction/runner change first. Preserve backup, rollback and foreign-key checks. [SQLite foreign-key guidance](https://www.sqlite.org/foreignkeys.html), [schema-change guidance](https://www.sqlite.org/lang_altertable.html).

Migration principles: keep shipped 001 unchanged; preserve all IDs/titles/completion times/checkpoints; do not fabricate a historical release, commitment decision or action history. Leave legacy actions visibly unassigned/project backlog until the user explicitly commits them to a real release/stage. A populated-v1 fixture must survive upgrade, failure rollback and restart. No new tables or migration files are created during this planning pass.

Resume stays project-owned and continues selecting the latest real project checkpoint. A future release selector must not relabel that as a release-specific checkpoint. Release-linked checkpoints/Resume filtering need a separate explicit design; do not silently narrow the existing memory stream.

## Proposed configuration and policy decisions

| Topic | Recommended initial rule / alternative needing approval |
| --- | --- |
| Stage configuration | Instantiate the original seven defaults per release. Stable IDs retain assignments during rename/reorder. Review additions/exclusions/removals explicitly; do not delete populated history or silently move its work. Keep the final-confirmation obligation in the closing stage in the initial model |
| Equal weight with custom workflows | For an explicitly selected set of m included stages, generalize the average to m; original seven-stage formula is the m=7 case. Adding/excluding a stage changes weights and must be visible as a scope change. Alternative: retain exactly seven fixed weighted buckets and defer arbitrary counted stages; do not divide by seven after changing the stage count |
| Included stage with no counted actions | Recommended: 0% plus **Needs scope review**. Alternative: withhold overall numeric progress until empties are resolved. Automatic omission/100% is not recommended because deleting or excluding the last unfinished action could silently inflate progress |
| Explicitly excluded stage | Omit from the averaging set only with a recorded non-applicability reason and preserved history. Necessary engineering obligations must remain represented in included stages; excluding a container must not erase required verification or confirmation |
| All stages excluded / no defined workflow | Not assessed, no division by zero or automatic 100%. Invalid mandatory-obligation configuration cannot be confirmed |
| Action commitment | A suggestion/backlog action contributes nothing until explicitly committed to this release. A simple model may treat release membership as commitment; if membership and commitment are independent, store an explicit state. Choose before implementing either |
| Applicability | Excluded items leave both numerator and denominator; retain their record, prior completion and reason. Excluding completed work may lower a stage percentage. Reinstatement recalculates; no hidden deletion as a substitute for exclusion |
| Unassigned committed actions | Treat as incomplete scope definition, show the unassigned count and withhold a complete overall assessment until assigned or explicitly excluded. Per-stage results can remain visible. Do not give these items a hidden eighth-stage weight or silently ignore them at 100% |
| Out-of-order work | Allow ordinary later-stage work to complete early. Current stage is earliest included stage with unfinished applicable committed items; do not gate every stage on the previous one. Final confirmation is an explicit exception with prerequisites |
| Empty versus current stage | An empty stage contains no unfinished item, so it is not current under the original rule. Show scope-attention separately; a null current stage does not by itself mean complete/ready |
| Reopening/scope changes | Recalculate active release progress; decreases are legitimate. Before confirmation, record the change/reason/history. Confirmed release scope is read-only; further development belongs to a new release. Correction/withdrawal of a mistaken confirmation needs a separately approved historical policy |
| Rounding | Keep raw calculations separate from display formatting. If an incomplete value rounds to 100.00%, show **<100%** or equivalent incomplete wording. Completion must be determined by real counts/confirmation, not rounded equality or an epsilon |

The minimum necessary engineering obligations require the user's review. Candidate protections are integrated release verification and final release confirmation; applicable security/reliability checks depend on the software. MVP must not make those obligations disappear. A genuinely irrelevant individual check can have an approved reasoned exclusion; no blanket “MVP” exemption.

## Connecting requirements, verification and final release readiness

Keep counting and evidence relationships explicit. Under the action-based interpretation, one product requirement may link to multiple implementation/verification actions; it is not also counted as an extra action. Creating more child tasks does not automatically establish requirement satisfaction. Future requirement acceptance criteria, mandatory evidence and linked work form separate readiness gates.

Action granularity is a limitation of action-count readiness: splitting one action into several changes the within-stage denominator even when the intended product outcome stays the same. Approve a clear definition of a counted action; do not count both a container and its children for the same obligation. Requirement-based counting avoids some task-splitting effects but needs an explicit rule for when a requirement is satisfied. Neither interpretation estimates engineering effort.

Verification actions in stage 5 must eventually link to real check/run results and the candidate/item revision they assessed. An ordinary completion checkbox is not proof that a test passed. Missing, failed, blocked or stale required checks prevent confirmation. Adding scope or reopening relevant work invalidates affected evidence according to an approved freshness policy; recording a result must not itself change the revision it was testing.

**Preserve the original 100% rule through a protected final-confirmation item**, rather than displaying 100% without confirmation or arbitrarily capping a computed number at 99%. Its completion must come from a validated confirmation operation/evidence record, not the generic action checkbox, and requires all other applicable committed obligations and scope attention to be resolved. Candidate stages with different item counts need not have the same “maximum before confirmation.” A missing/bypassed mandatory gate is invalid input, not a route to 100%.

When confirmation is accepted, freeze the release's stage configuration, committed membership, applicability, completion/evidence context and policy version. New releases copy definitions into new instances, not completed state. Full automated publishing remains future milestone E. A minimal manual-confirmation record is a separate proposed sub-slice needed to test the original 100% contract honestly; until it exists, do not claim a verified/confirmed release or offer a nonfunctional confirmation button.

## Invariants for the user's policy review

1. Scope identity is explicit. No cross-project/release assignment, duplicate counted IDs or double counting. Invalid relationships are rejected without writes.
2. For every assessed stage, 0 ≤ completed counted items ≤ total counted items. Assessed ratios stay within [0,1]; overall displayed percentage stays within [0,100]. Undefined/unassessed cases are explicit, never NaN or implicit 100%.
3. Only applicable committed items count. Optional suggestions, excluded records and other releases do not contribute. Stage weights are equal for the approved included set.
4. Rename does not change counts; reorder affects current-stage selection but not the equal-weight average. Every membership/inclusion/scope change is explainable in history.
5. With fixed valid scope, completing an item cannot lower progress; repeating completion changes nothing. Scope additions, exclusions, reassignments and reopening may increase or decrease it as defined—progress is not globally monotonic.
6. Current stage follows the earliest unfinished applicable committed item, independently of which later stages have progressed. Empty/configuration attention and a null current stage are distinct from successful release confirmation.
7. No displayed 100% without complete applicable committed scope, valid required evidence and actual final confirmation. A confirmed release remains reproducible and unaffected by new-release work or later template edits.
8. Pure policy evaluation has no writes, clock access, mutation or dependence on React/SQLite. The user determines its input/output contract and writes its core; main supplies one validated snapshot and the UI renders the result without a competing formula.

## Proposed black-box acceptance cases — approve before executable tests

Unless stated otherwise: seven included stages, at least one counted item in each; untouched stages have zero completed items. Values below are illustrative fixtures, not application data. Empty/custom/confirmation cases depend on the proposed choices above.

| Case | Input or change | Expected behavior for review |
| --- | --- | --- |
| P01 | Three stages complete; four at zero | 42.857142…%, displayed about 42.86%; not confirmed |
| P02 | Stage 1 has 1/1 complete; stage 2 has 0/100; other five at zero | 14.285714…%; item-heavy stages do not outweigh other stages |
| P03 | Stage 1 at 1/2; stage 2 at 1/4; other five at zero | 10.714285…% |
| P04 | Implementation completes while Requirements and Planning still has unfinished work | Later work allowed; current stage remains Requirements and Planning |
| P05 | An uncommitted suggestion is added or completed | No progress/current-stage change |
| P06 | Stage 1 at 1/2; exclude its pending item with a reason | Stage 1 becomes 1/1; overall 7.142857…% → 14.285714…%; history preserved |
| P07 | Exclude with blank reason or exclude a protected required obligation | Reject atomically; previous state/progress unchanged |
| P08 | Exclude all counted items in an included stage, or stage has only suggestions | Empty-stage policy applies; never automatic 100%. Scope attention is separate from current stage |
| P09 | Add an eighth counted stage with pending work when three original stages are complete | Under m-stage generalization: 37.5%; explicitly exclude it with approved reason → 42.857142…% |
| P10 | No included stages, or only project backlog with no release/workflow | Not assessed; no fabricated percentage |
| P11 | A committed applicable item has no stage | Show coverage/scope attention; cannot obtain a complete overall assessment by ignoring it |
| P12 | Six stages complete, closing stage has publication done but final confirmation pending (1/2) | 92.857142…%, not confirmed. Generic completion of the protected confirmation item is rejected |
| P13 | All other scope/evidence complete and a valid final confirmation is recorded | Exactly 100%, no unfinished current stage, immutable confirmed context |
| P14 | An incomplete ratio would round to 100.00% | Display <100%/explicitly incomplete; no complete/confirmed result |
| P15 | Reopen or add committed work in an active release | Recalculate and preserve history; decrease is allowed. Same change to a confirmed release is rejected under the freeze proposal |
| P16 | Begin release B or edit a template after A was confirmed | A remains at its recorded 100% and original stage/configuration/evidence context; B gets independent state |
| P17 | Rename stages, then reorder ordinary stages | Rename leaves percentages unchanged; reordering changes only the applicable earliest-current-stage result |
| P18 | Cross-release stage, duplicate item ID, invalid counts or missing mandatory confirmation gate | Reject invalid model/command; never emit a plausible success/100% |
| P19 | State update succeeds but audit-event write fails | Entire mutation rolls back; no phantom completion/history; submitted input retained |
| P20 | Repeat completion, restart, navigate between releases/projects | No duplicate transition; timestamp preserved; authoritative progress/history consistent after read/restart; existing Resume remains project-correct |
| P21 | Relevant required verification is failed/missing/stale despite action checkboxes being complete | Confirmation blocked and reason shown; no verified-release claim |

The user may revise/add cases and expected outputs before coding. These are specification examples, not executable tests or verified behavior.

## Reviewable implementation sequence — only after design approval

1. User settles scope/counting/empty/customization/confirmation rules, designs the pure policy and its result states, then writes the core. AI reviews the design/code and helps test approved cases without supplying the algorithm.
2. Review the minimal release/stage/action/history schema and safe migration separately. Preserve project backlog/checkpoints; add release/stage creation and explicit assignment/commit commands with ownership/rollback/restart checks. No full publishing/template engine.
3. Integrate the user's policy into one main query and the existing workspace state/refresh pattern. Add real release selection, stage configuration/assignment and ordered progress/current-stage UI only when backed by working commands. Preserve all existing operations and 25 regression checks.
4. Add the separately approved protected manual-confirmation/frozen-context path and tests so 100% has its intended meaning. Keep automated publishing and broader release management in E. Rebuild/retest the packaged application and obtain user manual acceptance before calling the milestone complete.

The existing UI/state/IPC/SQLite boundaries are retained. A release-aware query must carry its release identity; newer project/release selections must supersede older asynchronous responses. No Gantt dates, durations, progress estimates, placeholder statistics or automatic workflow suggestions are introduced.

## Two different histories

The user requested both: **Git checkpoints per reviewable engineering increment**, and **in-app history per action/scope change**. Git checkpoint 78a7758 preserves the already tested Resume/Visual Foundation work. This planning pass will have its own documentation commit; no retroactive per-action commits are fabricated.

In-app history is planned, not implemented: validated action/scope mutations append events in the same SQLite transaction. Existing checkpoints already preserve append-only journal entries, but have no per-action association. Proposed action/checkpoint links make that association explicit; any unified activity feed references the real saved checkpoint rather than inventing a transition. Checkpoint text remains user-written, with no auto-authored accomplishments or inferred next steps. Source Git history and application history remain separate responsibilities.

## Decisions still requiring approval

- A/B/C ownership model (recommend B) and confirmed-release freezing versus an explicit later correction/withdrawal policy.
- Counting unit: committed checklist actions versus distinct requirement records; the asynchronous clarification remains open.
- Seven fixed weights versus equal weight over explicitly included custom stages; empty-stage, unassigned-work and exclusion/mandatory-obligation treatment.
- Minimal confirmation/evidence boundary needed for 100%, legacy action opt-in migration, and the proposed acceptance cases.

No stage/progress data model, algorithm, migration, UI or executable tests are implemented/approved by this document. Visual manual checks remain pending as the user stated; positive appearance feedback does not mark them complete.
