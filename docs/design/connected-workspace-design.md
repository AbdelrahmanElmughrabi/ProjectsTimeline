# Connected workspace — information architecture and interaction proposal

2026-11-06 · **Design direction approved; only V1 Home implemented.** Existing project/Resume/Workflows/Releases stay intact; PTB and connected development views remain later authorized slices. [Domain](development-domain-contract.md) · [Traceability](product-traceability.md) · [Roadmap](product-implementation-roadmap.md) · [V1](../v1-home-plan.md).

## Visual continuity and navigation

Reviewed the existing [reference](ui-reference.png), [visual plan](../visual-foundation-plan.md), real App/Resume/Release/Workflow components and [tokens](../../src/renderer/tokens.css). Keep graphite/violet surfaces, Segoe UI/system typography, semantic colors, 4–32px spacing, 40px controls, 8/12px radii, 2px focus rings and reduced-motion-aware 140ms feedback. Reuse ProjectSidebar, WorkspaceHeader, Panel, ResumePanel and native control styles. No new brand assets, ornamental statistics, Gantt dates or broad restyling.

Proposed navigation:

```text
Home: projects and recorded activity
  Project: overview, goal and Resume
    Development workspace
      Filter: All development / Unscoped / selected scope
      Stages | Features | History
      One selected-record inspector / original source
    Releases: existing independent delivery workspace
Workflows: existing library, explicit Development / Release purpose
```

Home is a real destination, not a release list. Projects stay directly reachable from the sidebar; Workflows remains functional. Ideas/Engineering/Settings/Git destinations are added only with functioning domain features. Releases remains accessible with its current functionality; no forced conversion or loss of controls.

## Screens and shared data

| Screen/view | Primary job and actual information | Main interactions / dependencies |
| --- | --- | --- |
| Home | Recognize projects by saved name/goal and a deterministic initial mark; latest recorded checkpoint/event, unresolved authored question if available | Open project, create ordinary project, import blueprint. Summaries are named read queries, not N full-workspace loads or fabricated “hours spent.” No activity → honest empty state. |
| Project overview | Goal/source narrative, explicitly selected scope/focus, latest checkpoint/next step | Continue from saved context, add unscoped work, save checkpoint, open development or releases. Selected focus is user choice, not inferred from recent completion. |
| Import/review | Original Markdown plus component/feature outline, requirements, scope/stage plans, proposals and diagnostics | Choose file, preview, refresh/cancel, explicit requirement acceptance/scope activation/action commitment, atomic create. Blocking diagnostics link to source location; warnings remain visible. Default action selection is none. |
| Stages | Work organization, grouped by scope/workflow; separate Unscoped and in-scope Unassigned areas | Commit proposals, complete/reopen, assign/reassign, reasoned exclude/restore. Different workflow stages are never merged into a fictitious global current stage. No workflow → stage-less scope, no percentage. |
| Features | Component/feature tree with requirements, actions, decisions and planned checks | Expand, filter, select the same action, open source. Project-wide requirements and features with no component have explicit groups. An action linked to two features may appear twice as a reference, but is counted once by identity. |
| History | Actual import/adoption/edit/move/completion/checkpoint/decision/evidence events and their recorded reasons | Filter by record/scope, open linked record/source and historical revision. Narrative describes the plan; importing it records an import now, not events that never happened. |
| Inspector / Resume | Selected record details versus saved continuation context, clearly labeled | Inspector opens source, linked records and current/historical revision. Resume shows authored problem, intention, changes, unresolved questions, next step and links when present. Old checkpoints retain their two original fields. |

Features and History can operate without scopes. Stages can show Unscoped work without creating a scope. Project overview and Resume remain usable for legacy projects with no imported structure. No feature percentage or verified badge is inferred from action counts. A planned check shows Not run; absent evidence shows Not assessed.

## Selection and context rules

Keep one selection tuple `(project ID, scope filter, view, selected record ID)` and one authoritative project snapshot/query owner. View changes retain record identity and inspector. If a filter hides the selection, explain and offer Clear filter; do not silently duplicate/move the record. Switching projects clears incompatible selection. A historical event opens its recorded revision by default, with an explicit current-record link. No new client-side persistence store; startup tab/filter persistence is deferred.

Resume stays separate from the inspector: changing tabs must not replace authored context. Continue navigates to an explicitly saved linked action/feature/scope; with no link it retains current action-form focus behavior. A missing/inaccessible target leaves the checkpoint readable and offers the project overview; never guess a substitute. Quick checkpoint entry keeps accomplishment/next step first, with optional problem/intention/questions and links disclosed as needed. Save appends; it does not edit old history.

Ordinary and imported work use the same quick title entry and optional engineering details. Proposal rows offer Accept/Edit/Reject, not Complete. Adoption retains identity/source and validates placement; closed/cancelled scopes offer explicit Reopen. Multi-feature links do not create multiple tasks. Scope/filter changes with dirty drafts require explicit keep/discard handling before adding that navigation; a failed write always retains input.

## Window sizes, keyboard and failure states

At wide widths, preserve the existing sidebar/work column/Resume rail. The inspector replaces a portion of working content or opens a labeled detail view rather than adding a fourth cramped column. At compact widths Resume is first under the project heading; tabs/tree/inspector become one logical stacked/detail flow with a Back-to-selection control. Verify actual 800/1160/1440px windows and maximum-length text; no decorative reference panels fill unused space.

Use native tab/button semantics, labeled fields and tree disclosure controls, logical headings, visible focus and keyboard access to source diagnostics. Tab changes preserve meaningful focus; Escape closes a transient inspector and restores its opener. History/source content wraps; no compulsory horizontal scrolling for ordinary text. Reduced motion disables nonessential transitions.

| State | Required behavior |
| --- | --- |
| Empty/legacy | Show what is absent and a real next action; no sample records or fake components. |
| Loading/navigation race | Withhold previous project's details; ignore superseded read responses. |
| Invalid blueprint | Remain in preview; exact field/source diagnostic, no graph applied. |
| Cancel/refresh preview | Cancel writes nothing; refresh creates a new reviewed snapshot and invalidates the old token. |
| Failed write/stale revision | Keep draft/choices, explain failure/conflict, offer reload/review. No optimistic completion claim. |
| Saved but refresh failed | Clear only acknowledged submission, mark data stale and retry reads only. Repeated import apply uses receipt, never duplicates the project. |
| Historical/frozen | Clearly label legacy release/confirmed scope data; retain existing release mutation guards and provenance. Development closure is separately reopenable. |

These are acceptance targets, not claims of a rendered or accessibility-tested new UI. Implement and inspect one usable screen path at a time after approval.
