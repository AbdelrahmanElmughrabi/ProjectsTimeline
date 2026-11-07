# Connected Workspace UX Blueprint — visual engineering redirection

2026-11-07 · **Refined C/corrections and first delivery sequence approved; no production changes.** [Concrete V3a1a slice](v3a1a-implementation-proposal.md) is summary/review → durable Overview/Map/inspector/exact source, not all four future purposes at once. Schema/commands await approval. Supersedes the paused stage-board composition preserved at 47f73c6. [A/B/C review](v3-consolidated-review.md) · [capability audit](v3-capability-audit.md) · [Contract/VD1–VD5](v3-product-experience-contract.md) · [run the study](v3-visual-prototype/README.md) · [component inventory](v3-ui-component-inventory.md) · [mapping](product-traceability.md).

## One workspace, four purposes

New preview → Overview summary; Home → formed project **Map** (Overview remains available) ↔ **Development** (organize work) ↔ **History** (explain actual changes). One shared selected-record inspector and source disclosure, with a conditional saved-context strip. Features are a Map lens, not another competing record store/tab. Existing Releases/Workflows remain independent in the real app; the isolated study does not put fake links to them in its navigation.

Graph-first does not mean graph-only. The Overview introduces goal/capabilities, and a synchronized outline/search reaches the same records without pan/zoom. Tasks, decisions and check results are contextual; they do not become a 47-node default canvas.

## Three reviewed concepts; refined C recommended

| Concept | Information hierarchy / interaction | Benefits and costs |
| --- | --- | --- |
| A · Component Atlas (research) | Project navigation → stable structural canvas → optional selected inspector. Components expose their actual feature associations; children collapse/expand. Explicit Explore connected shows a selected neighborhood. | Useful stable-map intent; redundant hub spokes compete with the product concepts. Overview ownership spokes explain containment, not runtime dependencies. Need zoom/list and better production grouping for dense projects. |
| B · Focus Workbench | Project navigation → capability index → relationship canvas above a reading/inspection surface. Select a capability deliberately to explore its requirement neighborhood. | Good guided reading, fewer simultaneous relations. Takes more vertical space and can lose global orientation when exploring; preserve back-to-atlas/context. Do not ship a second full mode merely because the study includes it. |

**C — Spoke-Free Atlas:** retain its wide canvas/right inspector, component index, outside-lens recovery and return breadcrumb. Its default grid has no typed links; related neighborhoods are the actual relationship map. A clear source-backed path must be easier than reading source records, not merely a draggable card collection. Keep useful capability navigation from A/B; do not ship their comparison switcher.

**Required refinements:** one controls set; controlled React Flow changes; stable coordinates/viewport on ordinary selection; separate neighborhood anchor and browsing selection; Fit versus Arrange/reset. Narrow layouts use fewer readable columns or list, not seven scaled-down cards. Source assertions retain native styles/edge IDs regardless of distance; a derived shortcut/route shows its constituents and via record. Sparse coverage is neutral absence, not an automatically inferred issue. The original AG code does not consistently implement these rules.

AG research remains on branch antigravity/v3-visual-workspace-design at 92a7129, under docs/design/antigravity-v3-visual/screenshots. Use git show for immutable artifacts or its existing isolated checkout. Root Codex screenshots already modified at review start are not overwritten. [Independent findings/evidence](v3-consolidated-review.md).

Actual screenshots: [Atlas wide](v3-visual-prototype/screenshots/atlas-inspector-wide.png), [Atlas narrow](v3-visual-prototype/screenshots/atlas-narrow.png), [narrow detail](v3-visual-prototype/screenshots/atlas-detail-800.png), [Workbench wide](v3-visual-prototype/screenshots/workbench-focused-wide.png), [Workbench narrow](v3-visual-prototype/screenshots/workbench-narrow.png), [development](v3-visual-prototype/screenshots/development-wide.png). These show real source definitions with clearly simulated interaction state, not the implemented app.

Reference comparison: retain dark chrome, quiet borders, controlled violet focus, typography hierarchy and coherent project navigation. Replace its assumed dated timeline with source-backed structure and an ordinal development roadmap. The studies avoid fabricated schedules/progress and large empty Resume rails; source/validation badges still need clearer wording and progressive disclosure. Inspector and map are complementary; compact detail replaces the canvas instead of becoming a fourth column.

## Component behavior and view contracts

All new operations below are candidate responsibilities, not implemented WorkspaceApi methods. Existing V2 preview/capture can power a read-only projection without SQL. Durable workspace projections need the separately approved development graph/source/receipt schemas.

| Surface / primary goal | Essential information and actions | Connections / data responsibility |
| --- | --- | --- |
| Home / recognize and continue | Authored project goal/identity; actual latest checkpoint/next step, chosen focus where recorded. Open project; Continue exact saved target. With no checkpoint, no dominant recovery card. | Existing getHomeSummary extended only when fields exist; no N full graphs. Continue is navigation/read, not a new work session. |
| Overview / understand product | Goal, principal capabilities/components, explicit focus, honest counts, authored unresolved questions and actual recorded/verified outcomes with distinct labels. Open map, work or recorded context. | Bounded project summary from permanent records; legacy name-only projects remain valid. Source-validation status is not engineering readiness. |
| Map / explore meaning | Components/features first; authored parent/feature links. Project ownership stays metadata rather than default hub spokes. Select, move visual position, pan/zoom/fit, expand children, choose semantic lens, explicit neighborhood, search/list. | Pure view projection over one graph; no node duplicates per tab. Layout is not data ownership. No edge creation/deletion/reassignment from dragging in first production slice. |
| Development / choose real work | Scope/stage plan, feature associations, proposals versus commitments/current/done work. Ordered roadmap without dates; future date-aware view only with authored schedule. | Independent development scope/stage/action context and guarded commands; no release gate/current-stage percentage transfer. Stage order is not a task dependency or highest-priority recommendation. |
| History / explain changes | Actual command/checkpoint/decision/assessment events, time, authored reason and exact historical target revision. Filter/current-vs-historical navigation. | Existing events plus additive development history, cursor paging. Source narrative/checklist markers are not execution evidence. |
| Inspector / understand selected context | Purpose/instructions, definition of done, linked requirements/features/components/work, proposed decisions/planned checks or actual evidence when present. Explore connected, open exact source; later local revision edits. | Stable internal ID plus source anchors/current/historical revision. Direct versus related-through-feature paths labelled; no inferred dependency edges. |
| Source / inspect supporting wording | Exact captured document/section, source hash and useful location, inert text/Markdown. Close returns to the surviving opener. | Immutable capture, not silently reread live file; missing source explained without fabricated location. No remote content fetch/scripts. |
| Resume / return to engineering problem | Compact conditional saved-next-step strip; open authored accomplishment/problem/questions and linked target. Save optional richer checkpoint with an explicit target, Continue. Default target is chosen focus/project; Use selected record is deliberate. Selection does not overwrite it. | Optional linked checkpoint fields preserve old journals and deterministic ordering. Missing/stale target preserves text/history; never guess replacement intention. |
| Blueprint review / form project | Human goal/features first, validation/source secondary; explicit new/existing destination, grouped approvals, default-none selections, final effects summary. | Existing capture + reviewed main-owned plan, atomic apply/history/receipt later. Requirement acceptance, action commitment and scope activation distinct; no automatic decisions/results. |

## Map semantics, selection and source

- Four dimensions stay separate: relationship meaning/direction, origin, review status and evidence. Solid source assertion, optional dashed suggestion and explicit review badge; a real source edge does not become inferred merely because it is two hops from the anchor; evidence is an actual outcome/freshness record, not a green approval color. The prototype has no suggestion/evidence records; its legend says none.
- Default refined C: seven top-level component groups, no ownership hub; two child components collapsed. The component index exposes actual feature associations; explicit Explore connections reveals the bounded relationship map. Feature associations appear inside components and in their own lens. Requirements are bounded on-demand neighborhoods. Renderer/scene or store nodes without every engineering relationship remain honest sparse concepts, not guessed runtime links.
- Focused neighborhoods include actual directed PTB relationships; component → child and feature → component directions preserve the source meaning. Related feature requirements in the inspector are labelled path-based. An ownership line derived from a project field is explicitly labelled separately from the 86 typed source links.
- Candidate location: (projectId, view, lens/scope filter, neighborhoodAnchorId, selectedRecordId, revision?, source anchor?). External PTB IDs and V2 occurrence keys are distinct from future durable internal IDs. Same selection works across Map/Development/History; multiple appearances reference one action.
- Plain selection never starts work or changes layout/approval. Explicit Explore changes a separate neighborhood anchor; ordinary selection only changes the inspector/highlight. Back/clear recovers the atlas and its prior viewport. Drag changes only local coordinates. Arrange resets geometry, not semantics. Saved layout/pinning/version reconciliation is deferred; prototype coordinates reset on view remount/reload.
- If selection is outside the current lens/filter, retain its inspector and say why; offer Reveal context, never silently reassign it. Project switching cannot carry foreign selection. Saved Resume target is separate from browsing state/focus; filter mismatch/missing target must have an explained fallback.

## Empty, loading, failure and large-project behavior

| Area | Loading / empty | Error / stale / recovery | Scale |
| --- | --- | --- | --- |
| Home/Overview | Stable summaries; goal absent stays absent; no fake event/session or empty dominant Resume | Superseded project read withheld; retry only reads; legacy work remains reachable | Paged summaries, bounded feature/component summary; no full source per card |
| Map/layout | Bounded loading overlay; no components → feature/doc outline; unlinked concepts stay visible | Layout failure offers list and explicit retry; stale job cancelled/discarded; source/semantic read unaffected | Default semantic aggregation, capped expansion, scoped search; no every-edge force cloud. Large-model/worker performance remains a production gate |
| Inspector/source | Select a concept prompt is small; no relation says none recorded | Missing/retired record/source retains human context; exact captured-vs-live status, close focus fallback | Fetch context/source on demand; capped groups with real counts/Show more, readable long text |
| Development | No scope is valid unscoped work; Draft/empty stage shown explicitly | Stale revision/invalid placement retains choice; acknowledged command + failed refresh says saved/reload, never repeats command | Scope/feature filters and bounded action groups; explicit Unassigned/Unscoped; no globally merged stage |
| History | No events means no recorded history, not an invented imported work session | Failed next page preserves entries; old evidence distinct from current freshness | Cursor paging and record filters |
| Resume/checkpoint | No saved context → small save affordance; no empty rail | Save error retains input; missing target retains exact checkpoint; restart fallback | Next step primary, expand long problem/questions; linked current/historical context |
| Review/search | Zero proposals/results is valid; clear progress/cancel | Blocking errors inspectable; unknown workflow Needs review; changed target/source invalidates plan | Counted all-matching vs visible-page selection, group summaries; no thousands of forms |

Prototype demonstrates selected states, not all production failures/large-model claims. It uses 47 definitions and bounded map projections; error/empty states above require actual app acceptance tests later.

## Responsive and keyboard contract

Wide: project nav + canvas + one inspector. No permanent extra Resume rail; a saved-context strip appears only with real authored data. Narrow (~800 window): navigation rail, wrapped search, canvas OR full-width detail with Back, source modal constrained to viewport. Workbench spends more space on its feature index; compare this cost independently.

Native inputs/buttons, visible focus and real headings; all concepts reachable via search/outline without dragging. React Flow keyboard support is a starting point, not an accessibility certification. Label node/edge meaning and match deletion guidance to the read-only semantic model. Source/dialog Escape returns focus after render; closing compact detail returns to a stable view/selected outline target. Announce filtered selection and loading results. Reduced motion disables animation; ordinary zoom/text reflow and contrast must be reviewed with users. [Official React Flow accessibility guidance](https://reactflow.dev/learn/advanced-use/accessibility).

No general-purpose search service, saved desktop-layout system, ARIA tree invented without full keyboard behavior, dependency editor, or calendar engine is part of this prototype. Antigravity should challenge both concepts and propose improvements in its owned artifacts before production direction is accepted.

## Reviewed landing, target and keyboard behavior

A new captured blueprint opens the human summary. A durably formed knowledge workspace may open Map; Overview remains a named destination. No “active project” lifecycle field is added for navigation. Existing legacy entry remains intact. Continue follows an explicit saved target, not a guessed last task.

Checkpoint target is visible and intentional: chosen focus if valid, otherwise project; a Use selected record action opts into current browsing selection. Saving a target does not change chosen focus. Restore validated view/lens/scope-filter hints or explain why the saved target is outside the current view; missing/retired links retain exact authored context/history. Optional Start/focus semantics are finalized with their command slice, not inferred from map clicks.

Search/outline activation moves focus to a labelled inspector heading or announced region and records a surviving return target. Close/Back returns to the selected outline/node or stable view header after render. The selected entry has a textual/ARIA selected state. Use Base UI 1.9.0 finalFocus, not the unsupported onCloseAutoFocus prop. Keep the synchronized list available when labels need zoom or layout fails. No screen-reader/large-model acceptance is claimed from zero overflow.
