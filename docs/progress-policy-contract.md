# Progress policy — contract for user review

Updated: 2026-11-06. **Contract proposal, not implementation.** The user writes the calculation function. Integration starts after the user approves their calculation design and supplies the core implementation. No source, bridge, migration or executable tests are changed in this review step.

## Direction selected by the user

Release-scoped stages; committed, applicable checklist actions; equal weight across included stages; protected final release confirmation; existing actions retained as visible Unassigned backlog without fabricated commitments/history. The original seven defaults remain in [the design brief](stages-progress-design.md).

**Empty-stage decision confirmed:** an included stage with no applicable committed actions needs explicit scope review. Withhold the overall percentage until scope is resolved; do not silently omit that stage or count it as complete. Its own percentage is null, while populated stages can still show their individual results. A reasoned explicit stage exclusion or real committed work can resolve the empty scope; unnecessary work must not be invented to fill it.

## Proposed input/output contract

Types below are review material only, not added to application contracts. No function body or pseudocode is supplied.

```ts
type ProgressInput = Readonly<{
  releaseId: number;
  // Persisted display order; IDs remain stable during renames/reordering.
  stages: readonly Readonly<{
    id: number;
    included: boolean;
  }>[];
  actions: readonly Readonly<{
    id: number;
    stageId: number | null;
    committed: boolean;
    applicable: boolean;
    completed: boolean;
    kind: 'work' | 'release-confirmation';
  }>[];
}>;

type ReleaseProgress = Readonly<{
  releaseId: number;
  state: 'needs-scope-review' | 'in-progress' | 'confirmed';
  percent: number | null;
  currentStageId: number | null;
  stages: readonly Readonly<{
    stageId: number;
    completedActions: number;
    totalActions: number;
    percent: number | null;
  }>[];
  emptyStageIds: readonly number[];
  unassignedActionIds: readonly number[];
}>;
```

One input snapshot produces one result. All percentages use **0–100**, without rounding or formatting; counts are nonnegative integers. Result stages contain included stages in input order. Excluded stage labels/reasons remain in the workspace data, not erased by this result.

- **needs-scope-review:** an included stage is empty or applicable committed work is unassigned. Overall percent is null; the two ID lists identify the unresolved scope. Other populated stage percentages remain available.
- **in-progress:** scope is assessed, but applicable committed work/final confirmation remains unfinished. Overall percent is numeric and below 100.
- **confirmed:** all applicable committed work, including genuine final confirmation, is complete; percent is exactly 100. Confirmation provenance is supplied by the validated domain snapshot, not proved by arithmetic.
- **No selected release:** the workspace has no progress assessment (null) and does not call this function. Do not pass a fabricated release ID or reinterpret backlog as a release.

`currentStageId` is the earliest included stage with unfinished applicable committed work, or null if there is none. An empty stage contains no unfinished action, so it is reported in emptyStageIds rather than made current. A null current stage does not imply confirmed or complete. A pending confirmation action can make the closing stage current while an earlier empty stage still requires scope review.

## Boundary responsibilities — proposed minimal mapping

The main-side caller supplies a validated, consistent snapshot for one release. Positive numeric IDs match the existing app; no new ID framework or generic workflow engine is needed.

- Main validates ownership, unique IDs, stage ordering and existing references. Actions are selected-release actions plus optional project backlog, never actions from another release. A committed, applicable action with a non-null stage must reference an included stage; excluding its container cannot silently discard that obligation. Reassign or explicitly exclude the work first. Inapplicable records can retain their original stage link for history.
- **Minimal commitment proposal:** explicitly assigning an action to a release is its commitment; suggestions remain project backlog. The input's committed flag is derived from that membership, not an additional mutable SQLite boolean. This leaves release-specific uncommitted suggestions for a later need. Legacy backlog may already be completed, but remains uncommitted until the user explicitly assigns it. Release membership with a null stage remains visible as committed Unassigned work and withholds overall progress.
- Applicable/excluded state comes from persisted decisions. Domain commands require nonblank exclusion reasons and preserve history. The calculation receives normalized flags, not text/evidence to parse. Uncommitted or inapplicable actions do not become unassigned-scope blockers.
- Every selected release must have at least one included stage and exactly one protected final-confirmation action, committed/applicable and assigned to its included closing stage. Missing/duplicate/excluded gates or zero included stages are invalid configuration, rejected by the domain; no numeric assessment is returned. They are different from having no selected release.
- For the protected action, completed is derived only from the genuine confirmation record. An ordinary action-completion command must reject that action. The confirmation command requires all other applicable committed work and scope review to be resolved, records the user's real confirmation/reference atomically and freezes that release context. Its exact schema/command is reviewed before integration.
- Full engineering requirements, automated verification-run/freshness systems and publishing integrations are not built here. A minimal manual confirmation records the user's actual check of the released version; a progress number is not proof of independent verification. Later required evidence gates belong in the confirmation domain operation, not a fabricated testing statistic or an always-true policy input.
- Renderer formats the result and uses state/scope warnings to describe it. It never computes a second percentage. If an incomplete value would round to 100.00%, display <100% with an incomplete state. No percentage cache, localStorage mirror, clock access, event writing or React/SQLite dependency belongs in the pure policy.

Invalid relationships/configuration produce the existing validated operation error path, not a success-shaped 0%, 100% or repaired snapshot. The policy's documented precondition is valid domain input; it does not authorize writes or verify the provenance of a supplied boolean.

## Invariants for the user's calculation design

1. Each assigned applicable committed action counts exactly once in its included stage; ordinary optional/backlog/excluded items contribute nothing. Committed applicable Unassigned work is surfaced as scope review, never silently dropped.
2. Included stages have equal weight, independent of action count. The original seven-stage formula is the seven-included-stage case; changing the included set changes weights explicitly.
3. Empty included stages/unassigned committed work mean needs-scope-review and null overall percentage. Neither an empty set nor excluded work creates automatic completion.
4. Current stage follows input stage order and unfinished eligible actions; later work can complete early. Empty-stage attention and final confirmation are distinct from current-stage selection.
5. For assessed stages, 0 <= completedActions <= totalActions; all numeric percentages are finite and within 0–100. Only valid confirmed scope reaches 100; rounded display values never decide completion.
6. With fixed scope, completing work cannot lower progress and repeating evaluation changes nothing. Reopening, adding committed scope, exclusions and reassignment may legitimately change/decrease it. Confirmed-release mutation is blocked by the domain, not silently recalculated into a new release.
7. Evaluation is deterministic and does not mutate its input. Titles, timestamps, UI state, database access and Git history have no effect on its arithmetic. Work on another release cannot change the selected release result.

## Seven essential policy test groups — specifications, not executed tests

Unless stated otherwise, every included stage has at least one eligible action. A zero-progress stage means pending work, not an empty stage. The protected confirmation action remains pending except in the valid-confirmed example.

| Test | Fixture/change | Expected result |
| --- | --- | --- |
| T1 Equal weights and included set | Seven stages: first three complete, four pending; repeat with one stage 1/1 and another 0/100, other five pending; then three complete out of eight included stages | About 42.857142%, 14.285714%, and 37.5% respectively; action-heavy stages get no extra weight. Excluding the eighth stage after explicitly excluding/reassigning its obligations restores the seven-stage averaging set |
| T2 Eligibility | Add a completed uncommitted backlog/suggestion or an inapplicable action to a valid fixture; separately exclude and reinstate a pending item from a stage at 1/2 | Ignored items change no counts/current stage; valid exclusion changes that stage to 1/1, reinstatement to 1/2. History/reasons are domain concerns |
| T3 Overlap and current stage | Implementation complete while Requirements and Planning has pending work; reorder two unfinished included stages | Later completion is allowed; current stage follows the earliest unfinished stage in the supplied order |
| T4 Scope review | An included stage has no eligible actions; separately a committed applicable action has no stage | state needs-scope-review, overall percent null, exact empty/unassigned IDs reported; populated stages still assessed. Empty stage itself is not made current |
| T5 Confirmation | Six stages complete; closing stage publication item done and protected confirmation pending (1/2), then valid final confirmation supplied | About 92.857142%, in-progress; then exactly 100%, confirmed and no current stage. An incomplete value close enough to round to 100 remains in-progress and numerically below 100 |
| T6 Recalculation | In an active release with assessed scope, reopen completed work or add a new pending committed action | Counts/current stage and percentage reflect the change; progress may decrease. Fixed-scope ordinary completion never decreases it |
| T7 Purity and stability | Evaluate the same deeply frozen input twice; evaluate another independent release, then the original again | Same result, no input mutation; no cross-release state or time dependence |

Additional mandatory **integration** checks, after approval: generic completion/exclusion of confirmation is rejected; invalid ownership/missing gates/unsafe stage exclusions fail without writes; failed audit/confirmation writes roll back state and history; populated-v1 migration preserves IDs/timestamps/checkpoints and leaves actions Unassigned; confirmed release A stays unchanged when B starts; no selected release shows Not assessed; Resume/project/action/checkpoint/restart/security/error regressions still pass. These are not new obligations inside the pure calculation function.

## One complete vertical slice after approval

1. User reviews/revises this contract and the essential cases, approves their calculation design and writes the core. AI can review the implementation and help add the agreed tests; it will not supply the function body.
2. Integrate through the existing main domain/store, numbered migration and typed bridge: release creation with the original seven instances/protected obligation; explicit backlog commitment/assignment and reasoned exclusion; transactional action/scope history; real manual confirmation with a frozen context. Review concrete constraints and command shapes before changing them. No generic repository/service/state framework or full template/publishing system.
3. Existing workspace gets real release selection, included-stage summaries, scope-review/Unassigned controls and protected confirmation flow. Keep project-level Resume and explicit checkpoint journal behavior, existing native forms and graphite/violet tokens. Add controls only with working persistence/commands.
4. Rerun the existing baseline before application changes, then run approved policy/domain/migration/IPC/Electron/packaged checks and inspect compact/normal/wide, keyboard, empty and error states. Record actual results, update checklist/checkpoint, commit the complete slice and stop for review.

The immediate handoff is contract/design review, not permission to invent the user's calculation implementation. Existing 25/25 evidence remains historical; no application tests were rerun for this documentation-only step.
