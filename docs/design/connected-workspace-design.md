# Connected Workspace UX Blueprint — V3 review draft

2026-11-06 · **Design only, not an implemented UI redesign.** Preserves approved graphite/violet tokens, project-owned records, optional scopes and V1/V2 behavior. New interaction recommendations require [D1–D5](v3-product-experience-contract.md). [Prototype](v3-workspace-prototype.html) · [adoption policy](blueprint-adoption-merge-policy.md) · [mapping](product-traceability.md).

## The connected shell

Home → Use blueprint → Understand & review → Choose destination/effects → Apply reviewed plan → Project Overview → Stages / Features / History → Save context → Home Continue.

Existing Workflows and Releases remain reachable as their current independent features. New development-purpose library functionality is a later slice. Do not add dormant Engineering/Ideas/Settings destinations to fill the reference sidebar. No global command/search icon before a real search operation exists.

```text
Wide project workspace
┌ project sidebar ┬ project name, goal, source review status ─────────────┐
│ Home           │ Overview | Stages | Features | History               │
│ Projects       │ Find within project…        All / Unscoped / Scope   │
│   Vivarium     ├──────────────────────────────┬────────────────────────┤
│ Workflows      │ Feature map OR stage workmap │ RESUME DEVELOPMENT     │
│                │ selected feature's work      │ Saved problem / next   │
│                │ and contextual relationships │ Continue saved target  │
│                │                              ├────────────────────────┤
│                │ Inspector expands here or    │ optional quick context │
│                │ replaces detail content      │ entry, not statistics  │
└────────────────┴──────────────────────────────┴────────────────────────┘
Compact: project heading → Resume → view/filter → map/list → selected detail
with explicit Back; no fourth rail and no forced horizontal text scrolling.
```

The prototype deliberately explores a simple stacked inspector within the work column; Antigravity should compare it with replacing the map by a compact detail surface. A right rail is reserved for recovery, not another raw entity list. The original mountain art, notification icons, decorative progress and calendar bars are not requirements.

## Primary screens and contracts

Candidate operation names below are design contracts, **not existing WorkspaceApi methods**. IDs/revisions and source links are secondary to goal, feature titles, work meaning and authored context.

| Surface | Primary goal / emphasized information | Actions and connection | Backend/domain requirement |
| --- | --- | --- | --- |
| Home | Recognize the project and its saved next step. Compact goal/identity, latest authored checkpoint and relevant real event; no repeated full journals on every card | Continue linked work, Open overview, Create ordinary project, Use blueprint. Activity disclosure opens filtered History | Extend getHomeSummary from actual project metadata/checkpoint/focus/events; avoid N full project loads. Legacy goal absent, not generated |
| Blueprint understanding | Understand proposed capabilities and engineering organization before approval. Project goal, feature/component map, scope/stage plans, key review choices | Inspect a feature/requirement/decision, expand technical validation/source, proceed to destination. Invalid syntax links to exact source | Existing immutable capture/graph projected into human groups; no second parser, AI summary or inferred records |
| Destination + effects review | Know where records will go and what user approval changes | New project / explicit existing target; group/subset selection; separate requirement acceptance, commitments and activation; final exact summary; Cancel | PrepareReviewedApplication reads expected target revisions/bindings; ApplyReviewedBatch transaction/receipt; no durable writes before apply |
| Project overview | Understand product shape, explicit current focus, work to review and where to continue | Feature card → same context; Start chosen work; quick action; Review remaining proposals; Resume; separate Releases | Read project goal/features/scope instances/commitments/blockers/checkpoint; no release readiness join or inferred feature progress |
| Stages | See authored organization and work distribution without a schedule fiction | Choose scope, open same task, commit proposal, Start/Done/Reopen, explicit reassign/exclude when those slices exist | Scope-local ordered stage instances, proposed vs actual membership, work-state commands/revision guards. No globally merged stage from equal labels |
| Features | Understand capabilities and engineering support in context | Expand component; choose feature; open requirements/actions/decisions/checks, including labelled indirect “via requirement” links | Stable project records + direct typed relations; one action ID across views; query projection deduplicates global counts |
| History | Explain what actually changed and why | Time-ordered import/approval/edit/start/reopen/move/checkpoint/decision/assessment events; filter by selected record; inspect historic revision/current version | Existing events plus additive development history; actual times and actors; import narrative never becomes historical execution |
| Selected detail | Understand why this work matters and inspect linked context | Title/instructions/definition of done first; source/IDs/hash/revisions under Details. Native links route to same identity; editing target labelled Local working definition | Typed selection, source capture refs, stable record and revision; edit command keeps original source immutable |
| Resume / checkpoint | Return to an explicitly saved engineering problem | Accomplishment/next step fast entry; optional problem/questions and visible target; Save appends; Continue opens target + saved context | Optional checkpoint context and typed links preserve old two-field journals/time ordering; restart and missing-target fallback |

Requirements/decisions/checks are contextual detail groups, not three more mandatory top-level tabs. Project-wide and unassigned records have explicit homes. A feature not linked to a component is “Project-wide / unplaced,” not discarded. Project search spans all supported record kinds and can open the same detail from any view; first use is a bounded main-side title/ID query, not a new search service.

## Map and roadmap alternatives

| Alternative | Value | Cost / decision |
| --- | --- | --- |
| Flat entity list / eight tabs | Exact technical inventory | Repeats V2's reading burden; retain as advanced inspection, not primary experience |
| Component/feature map + selected-context links | Recognizable product shape; a requirement can explain several features without duplicating tasks | Primary Overview/Features pattern. Group labels derive from declared relationships; no guessed priority or capability |
| Ordinal stage workmap | Uses existing inline plan and placement immediately; supports overlap and later-stage work | Recommended Stages view: authored columns/lane order, proposed/committed/doing/done counts and honest Unassigned/Unscoped. No date axis or dependency arrows |
| Date Gantt/calendar | Useful for explicitly scheduled work | Deferred until date/duration/timezone semantics exist; never stretch actions into fabricated bars |
| Full dependency graph | Explains actual prerequisites when recorded | Defer graph editor/critical-path engine; mere requirements/features links are not dependencies. Context mini-map follows explicit links only |

Vivarium Overview shows seven capability cards, not 47 entity rows. Stages uses its one four-stage plan with nine scoped actions plus the unscoped documentation task. FieldLedger has two scope workmaps; their three same-named stages do not become one project stage. Small Desk Notes can ignore its draft plan and work normally through its unscoped task.

A count is labelled exactly: “3 committed actions; 1 marked done,” “5 requirements without a linked planned check,” or “2 saved questions in this checkpoint.” No feature completion percentage, automatic next-stage claim or “all tests passed” label is derived. Requirements and checks begin Not assessed/Not run, distinct from accepted definitions and completed work.

## Efficient review and starting work

- Default approval selections are empty. “Select all named actions in this plan” is an explicit reversible review choice; it is not an automatic acceptance rule. A final batch summary exposes effects and retained proposals, with scope activation separate.
- Filter/selection controls show all-matching versus visible-page scope. Selection survives expanding a group; clearing a filter never changes commitment. A batch may be corrected before apply without editing dozens of fields.
- Proposed scope/stage placement is preserved from source. Committing scoped actions needs explicit activation, deferral or deliberate unscoped placement. That choice is not a mandatory setup wizard for small work.
- Starting point hierarchy: explicit saved checkpoint target; then user-chosen focus; then an explicit future ordered list if supported; otherwise choose work by feature/stage/search. Show “Priority/prerequisites not recorded” rather than a speculative recommendation. No source order priority.
- A selected inspector does not mark work In progress. Start work is a deliberate command if D4 approved; completion, reopening and authored blockers have their own actual history. Start is not a timer or session detector.
- Local edits disclose their target and preserve source. A Done action offers Reopen and revise / follow-up, rather than silently changing what its old completion satisfied. Bulk mistaken commitments use explicit reasoned exclusion, not a destructive generic Undo.

## Shared selection, drafts and context

Candidate location: `(projectId, view, scopeFilter, selectedRecordId, revision?, anchor?)`. Internal record identity is separate from PTB ID and V2 occurrence key. Switch Stages/Features/History with one selection; multi-feature appearances are references, not cloned tasks. Historical events open their recorded revision first, with an explicit current-record link.

If filtering hides selection, keep the detail with “Outside this filter” and Clear filter; do not move/reassign it. Project switching clears foreign selection but retains project-owned unsaved drafts according to an explicit keep/discard policy. Reopening a saved checkpoint uses its saved target/view/filter; if that filter no longer fits, show the target with an explanation. A removed/retired target leaves the authored checkpoint visible and offers history/overview. No substitute intention is inferred.

Resume and inspector are separate: browsing a record does not overwrite saved context. Source Details do not silently switch the current work target. The minimal persistent continuation is the explicit checkpoint; restoring arbitrary last tabs/windows is optional future personalization, not required to get back to a saved problem. No extra durable UI store.

## Loading, empty, failure and scale behavior

| Surface | Loading / empty | Error / stale / correction | Large project |
| --- | --- | --- | --- |
| Home | Stable card skeletons; no fabricated activity; legacy name-only card | Withhold failed/superseded summaries; retry reads only | Paged summaries + find; no full graph per project |
| Blueprint review | Capturing label; no previous plan shown as current; zero proposed work is valid | Blocking source diagnostics accessible; target/conflict/unknown workflow review before apply; cancel writes nothing | Group summaries, search and counted all-matching selection; progressive detail, not 2,000 expanded forms |
| Overview | Goal absent → ask author; all-proposed plan → Review work; no checkpoint → save one | Retain user's draft, label stale read; confirmed apply plus failed refresh shows “Saved, reload view,” never resubmits | Feature summaries + explicit counts; load details on selection |
| Stages | No active scope → normal unscoped work + preserved draft plans; empty stage says no work assigned | Invalid/retired placement shown; no invented stage, lifecycle guards/revision conflict retain choices | Filter by scope; bounded stage/card groups; no global stage merge |
| Features/detail | Unlinked/project-wide groups remain reachable | Missing/retired link gets readable fallback; local edit conflict retains draft | Collapsed component groups, list alternative to map, bounded results with stable selection |
| History | No events → honest empty state, not a synthetic imported session | Historical/current distinction; failed next-page load preserves known entries | Time/ID cursor paging and selected-record filter, not every event loaded at once |
| Resume/context | No checkpoint/focus → explicit chooser, not fake session | Save failure retains input; missing target preserves exact text; acknowledged save retry reads only | Short next step primary; expand long problem/questions, readable at 800px |

Native controls, logical headings and visible focus are mandatory. View switches announce the view/retained selection; filtering announces hidden selection. Escape closes transient detail, returning to the surviving opener or stable selected list entry/header after render. Search results/disclosures have keyboard paths; do not introduce a custom ARIA tree/grid unless its full keyboard model is implemented. Focused disabled loading controls transfer focus to a usable cancel/status target. Reduced motion respects the existing tokens. At 800/1160/1440px, normal text wraps and detail is reachable without a fourth column.

The [prototype](v3-workspace-prototype.html) simulates review, work selection, shared-view navigation and checkpoint resumption with real definitions only. It is not a production architecture/accessibility/restart test, an attachment editor, an evidence recorder, or a promise every illustrated interaction is approved for the first migration. Compare its tradeoffs independently in Antigravity's design review.
