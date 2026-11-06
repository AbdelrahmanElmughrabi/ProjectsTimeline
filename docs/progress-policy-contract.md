# Progress policy — contract for user review

Updated: 2026-11-06. **Implemented under the user's revised ownership agreement.** The user explicitly authorized AI policy, tests, persistence and UI. The personal-coding restriction is superseded by [ADR 0004](adr/0004-release-progress.md). Manual acceptance remains pending; this contract describes the implemented slice.

## Direction selected by the user

Release-scoped stages; committed, applicable checklist actions; equal weight across included stages; protected final release confirmation; existing actions retained as visible Unassigned backlog without fabricated commitments/history. The original seven defaults remain in [the design brief](stages-progress-design.md).

**Empty-stage decision confirmed:** an included stage with no applicable committed actions needs explicit scope review. Withhold the overall percentage until scope is resolved; do not silently omit that stage or count it as complete. Its own percentage is null, while populated stages can still show their individual results. A reasoned explicit stage exclusion or real committed work can resolve the empty scope; unnecessary work must not be invented to fill it.

## Input/output contract

Types below describe [shared contracts](../src/shared/contracts.ts); [calculateReleaseProgress](../src/main/progress.ts) implements the policy. Main validates/normalizes stored provenance; arithmetic does not authenticate a supplied boolean.

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

## Boundary responsibilities

The main-side caller supplies a validated, consistent snapshot for one release. Positive numeric IDs match the existing app; no new ID framework or generic workflow engine is needed.

- Main validates ownership, unique IDs, stage ordering and existing references. Actions are selected-release actions plus optional project backlog, never actions from another release. A committed, applicable action with a non-null stage must reference an included stage; excluding its container cannot silently discard that obligation. Reassign or explicitly exclude the work first. Inapplicable records can retain their original stage link for history.
- Explicit release membership is commitment, not a second SQLite flag. Suggestions remain project backlog until accepted, including already completed legacy work. A null stage on committed work withholds overall progress. Membership cannot move to another release; stage reassignment is allowed until confirmation.
- Applicable/excluded state comes from persisted decisions. Domain commands require nonblank exclusion reasons and preserve history. The calculation receives normalized flags, not text/evidence to parse. Uncommitted or inapplicable actions do not become unassigned-scope blockers.
- Every selected release must have at least one included stage and exactly one protected final-confirmation action, committed/applicable and assigned to its included closing stage. Missing/duplicate/excluded gates or zero included stages are invalid configuration, rejected by the domain; no numeric assessment is returned. They are different from having no selected release.
- Protected completion derives only from the confirmed release record. Ordinary action commands reject the gate. Confirmation requires all other work/scope review resolved plus the latest passed verification at the same scope revision, records confirmation/history atomically and freezes the release. Verification stores artifact identity, evidence reference, summary, outcome, main time and scope revision. Changes stale old evidence; recording evidence does not invalidate itself.
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

## Seven essential policy test groups

These requirements are exercised by eight policy test groups plus store/Electron/packaged checks; see [actual results](verification.md). The table is a behavior specification, not a claim that every broader P01–P21 future-system case is implemented.

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

Integration coverage: protected completion/unsafe stage changes rejected; invalid ownership/FKs and invalid commands fail; audit/confirmation failures roll back state/history/revision; populated-v1 upgrade preserves IDs/timestamps/checkpoints as Unassigned; confirmed A stays unchanged during B; no selection is Not assessed; Resume/security/error/restart regressions pass. These remain separate from pure arithmetic.

## Implemented vertical slice

1. AI implemented the pure policy/tests after the user's ownership amendment and direction approval.
2. Existing store, migration 002 and 13 named bridge methods integrate membership, exclusions, completion/reopening, atomic history, revision-bound manual evidence and protected frozen confirmation.
3. Existing workspace renders persisted release/stage progress, warnings, Unassigned controls, verification/history and confirmation; project Resume/journals/native controls/tokens are preserved.
4. Baseline reran before edits; current Node/Electron/packaged results are recorded. User manual acceptance is next. No template engine, stage CRUD, publishing or unrelated UI rewrite.

Stop after this slice. Prior 25/25 evidence is preserved as baseline history; current verification is recorded separately.
