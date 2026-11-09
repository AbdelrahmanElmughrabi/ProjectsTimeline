# V3 UI components and tooling inventory

2026-11-07 · Installed availability retained; consolidated AG review at **92a7129**, against frozen app/design **63c18e9**. No dependency or production component changed. [Code/reuse findings](v3-consolidated-review.md) · [real capability matrix](v3-capability-audit.md). The original study results below are historical evidence, not verification of all AG behavior.

## Actual availability versus adoption

| Tool | Declared / locked / installed | Actual use / limit |
| --- | --- | --- |
| React / React DOM | 19.3.1 / 19.3.1 / 19.3.1 | Existing app and isolated study. |
| Tailwind CSS + Vite plugin | ^4.3.5 / 4.3.5 / 4.3.5 | Already wired into root setup. Prototype's own Vite config compiles its utilities; no production stylesheet changes. |
| Base UI | ^1.9.0 / 1.9.0 / 1.9.0 | Prototype source/review/checkpoint dialogs actually render and exercise focus. Not proof all primitives work. |
| shadcn CLI / Nova | ^4.23.0 / 4.23.0 / 4.23.0; components.json style base-nova | Configuration and helper exist, **no generated/adopted app components**. Prototype uses styled native controls and Base UI, not a falsely claimed shadcn component collection. Do not run init/add over the app to make the inventory true. |
| React Flow | ^12.12.1 / 12.12.1 / 12.12.1 | Actual selectable/draggable nodes, edges, zoom/pan/fit, controls and shared projection. Default map 8 nodes, not a scale benchmark. Attribution retained. |
| ELK.js | ^0.12.1 / 0.12.1 / 0.12.1 | Actual stress layout (atlas) and layered layout (focused context). Bounded synchronous-engine work through its async API; no worker/CSP relaxation. Large graph/cancellation/worker policy needs production review. |
| lucide-react | ^1.70.0 / 1.70.0 / 1.70.0 | Consistent prototype icons from installed package. |
| Playwright library | 1.64.1 / 1.64.1 / 1.64.1 | Existing Electron interaction API runs this study. |
| @playwright/test | ^1.65.0 / 1.65.0 / 1.65.0 | Installed setup; distinct version from library. Study does not claim this runner/all configured browser binaries were executed. |
| Vite | 8.3.6 / 8.3.6 / 8.3.6 | Separate prototype build output under ignored artifacts; root app build/config untouched. |

Existing setup evidence: [shadcn setup record](../shadcn-setup.md). Browser binaries were not installed for this phase; Electron's Chromium provides actual rendering. No dependency audit/upgrade is newly claimed. Existing V2 audit evidence remains historical; a production library-adoption slice must review the actual lock, notices and runtime surface.

## Component inventory

| Component | Appropriate foundation | Custom responsibility / future integration |
| --- | --- | --- |
| App shell, project navigation, view switch | Existing shell/tokens; future shadcn sidebar/tabs/button patterns if useful | Preserve Home/Workflows/Releases/routes/drafts, shared selection and compact rail. Avoid a visual library rewrite. |
| Buttons, badges, inputs, select, tooltip | Native controls now; shadcn/Base UI + Nova for approved production adoption | Project semantic tokens, meaningful labels/status and contrast. Review reset-free CSS/aliases; Nova selected does not equal ready-made components. |
| Source/checkpoint/review modal or drawer | Base UI Dialog actual prototype; shadcn dialog/sheet candidate | Exact inert source, focus return, unsaved/error handling, actual effect preview and no fake success. |
| Engineering canvas / viewport / edges | React Flow actual prototype | Typed semantic projection, relationship provenance labels, bounded expansion, node content and same IDs across views. No domain edits from canvas geometry. |
| Graph layout | ELK actual prototype | Stable ordering/reset/pinning strategy, measured node bounds, stale-job ownership/cancellation, performance and CSP compatibility before production. [Official integration example](https://reactflow.dev/examples/layout/elkjs). |
| Component grouping / feature neighborhood | React Flow nodes/handles, collapsible native controls | Explicit relations only; hidden-child counts, no duplicate work; user-directed expansion rather than automatic recenter on selection. |
| Search / semantic filters / outline | Native controls now; future shadcn combobox/command pattern if needed | Bounded project queries, no arbitrary text inference; same selection and accessible list alternative. No new search service. |
| Inspector / source traceability | Existing Panel + dialog/scroll primitives | One contextual surface, current/historical/source distinction, direct/path labels, real action details/evidence. |
| Development roadmap / timeline | Custom ordered composition; existing action controls | Scope/stage membership and honest work-state projections. Gantt only after actual schedule semantics; no scheduling library now. |
| History and Resume/current focus | Existing Resume/selectors/history patterns plus optional primitives | Actual events and authored links; conditional strip, full context on demand, exact return target. No empty rail/session inference. |
| Legend / authority / evidence | Simple custom semantic indicators | Origin + meaning + review + freshness; color plus text/glyph, no approval-as-verification. |
| Error/loading/large-project handling | Existing Result/controller retry patterns; native status | Cancellation/stale layout, bounded queries, known state retained, acknowledged-write read retry. Production failure/scale tests not supplied by component libraries. |

## Compatibility evidence and remaining gates

The isolated study bundles and runs React 19.3.1 + React Flow + ELK + Base UI dialogs + Tailwind under the application's **same strict CSP text** (no unsafe-eval, unsafe-inline, network or worker exceptions). Its viewer uses nodeIntegration=false, contextIsolation=true, sandbox=true, no preload/IPC/SQLite and blocks external requests/navigation. This proves only the exercised prototype path; actual app:// serving, ASAR and production layout volume need a later authorized integration test.

Prototype build emits expected use-client directive warnings in a non-RSC Vite bundle and a ~2.08 MB single JavaScript chunk warning, largely including ELK. These were not hidden as a clean warning-free build. Bundle splitting/layout worker/performance review is required before shipping, not justification for changing production security now.

## Production composition recommended after Concept C review

| Responsibility | Reuse / implementation boundary | Essential check |
| --- | --- | --- |
| Workspace shell/controller | Existing App navigation, Panel/tokens and useProjectWorkspace acknowledged-write/read-retry pattern; purpose-specific new typed reads/commands only | Legacy Home/Resume/Workflows/Releases/drafts unchanged; no second durable React-state authority |
| Pure map projection | Small typed function over canonical records/explicit edges, outside-lens predicate and bounded path projection | Native edges retain IDs/origin; route carries constituents; no hardcoded fixtures, graph-meaning inference or catch-all graph engine |
| MapCanvas / nodes / controls | React Flow controlled changes, one control set, stable viewport and independent neighborhood anchor; ELK only for nontrivial connected layout | Real drag/keyboard movement, Fit versus Arrange, selection stability, layout cancellation/error fallback and measured long-label bounds |
| Inspector / source | Shared typed record detail + existing validated source-selection concepts; current/historical/captured distinction | Exact source/null source/generated definition labelled distinctly; no fake hash/span; bounded related groups, readable narrow detail |
| Outline/search/status | Native or selectively adopted Base UI/shadcn primitives | Selected-state/announcements, surviving focus on open/close, outside-filter recovery; no custom tree without complete keyboard behavior |
| Adoption review/controller | Three presentation groups + main-owned reviewed transition deltas/receipt | Existing accepted/active/committed state read-only here; no implicit acknowledgement/removal/move; expected revisions and per-item placement |
| Linked checkpoint | Existing journal selector/append semantics + optional intentional target/context hints | Browse selection does not redefine focus; exact text and missing-target fallback; restored target/view/lens/filter after restart |

Do not copy AG's 2,253-line App or hand-maintained datasets into src. Its 1,811 CSS lines are largely formatting rather than evidence of 1,811 unnecessary rules; reuse established semantic tokens/native controls instead of a wholesale stylesheet migration. No arbitrary line-reduction target or new state-management framework is justified.

The installed Base UI 1.9.0 Dialog.Popup uses **finalFocus**. AG's onCloseAutoFocus prop fails TypeScript (TS2322); its passing source-return case comes from the library default, not that callback. Only Dialog is actually exercised; Tabs/Select/Popover/Tooltip listed by AG are possible primitives, not verified adoption. Tailwind plugin/CSS and installed React Flow/ELK run in the isolated study; production app:// / ASAR / large layout still need real verification. Lucide is **1.70.0**, not the report's 1.16.0.
