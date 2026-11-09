# V3a1a UX stabilization verification

2026-11-09 · **UX stabilization accepted by the product owner.** Approved design `f417ef5`. Implementation and focused tests `e0d16fe134cc1fc7b7edd5a522382860a7da3caf`. The prior V3a1a evidence and Antigravity's isolated review remain available. [Approved scope](design/post-v3a1a-ux-review.md) · [Original V3a1a verification](v3a1a-verification-report.md).

## Delivered

- **Camera and layout.** Fit uses measured card bounds and canvas padding. The map opens at 82%, with a readable-zoom reset that centers the selected or nearest card. Expansion places and reveals new cards while preserving existing positions. Following a relationship reveals its target. Arrange changes positions and preserves the camera. The medium-width outline moves into a drawer when details are open. Compact navigation and full-width details reclaim space for the graph.
- **Relationships and navigation.** Authored paths retain their native IDs and directions. Separated arrow tips show convergence and a stable caption shows the focused or hovered path's full label and endpoints outside the canvas. New inspector records begin at the top. Neighborhood Back restores camera, positions, selection, scroll and focus one frame at a time. Tabs support arrow and Home/End keys. The source dialog preserves stored text and restores focus.
- **Project entry points.** Captured sources is a working view of immutable files. Journal opens the existing checkpoint tools and Project tools still opens actions and releases. Formed projects show Resume only with a saved checkpoint. Switching back or reselecting the same knowledge project preserves the map while reselecting still refreshes data.

Only the renderer and focused Electron tests changed. The typed API, main process, preload, SQLite migrations, source fixtures, dependencies and Electron security configuration match the approved baseline. [Renderer](../src/renderer/knowledge/ProjectKnowledgeWorkspace.tsx) · [Regression journeys](../tests/e2e/knowledge-stabilization.test.mjs).

## Executed checks

| Command | Result |
| --- | --- |
| `npm test` | **92/92**. Both TypeScript targets and Vite build passed. |
| `npm run test:e2e` | **28/28** on Electron, including the three new stabilization journeys. |
| `npm run package` | **Passed**. Rebuilt the Windows executable and ASAR from the stabilized renderer. |
| `npm run test:packaged` | **5/5** recovery cases. Includes packaged renderer/migration byte checks, Preview ESM, formation/source recovery, legacy upgrades, release and workflow history. |
| Original and stabilization knowledge suites with `PROJECTS_TIMELINE_EXECUTABLE` set | **7/7** against the rebuilt executable. Covers the original formation/retry/restart journeys and the new graph, project tools and scale checks. |

Zero skips in final runs. The first full Electron run caught a same-project reselect regression that left release progress stale. Restoring the reread while retaining the mounted knowledge view fixed it. Early focused runs also caught two harness locator assumptions, corrected before the passing runs. Screenshot inspection exposed extra document scroll from absolutely positioned screen-reader labels in the inspector. The final packaged screenshots use the corrected containment. The existing renderer chunk-size and module-directive build warnings remain.

### Packaged interaction and scale evidence

- **Vivarium, 47 definitions and 86 authored relationships.** Expanded **Procedural anatomy generation** by keyboard and pointer and checked the child appeared inside the usable canvas without moving existing cards. At 1160 px with the inspector open, all 15 projected cards fit, compared with zero fully visible in the shipped baseline probe. Verified the full DNA edge caption and distinct incoming arrow tips at the tested widths. Checked two-step Back at 1540 and 800 px, source opener focus, inspector reading width and scroll, stable selection and layout across view changes, and exact relationship source bytes and highlighted span before and after the journey.
- **FieldLedger, 37 definitions and 82 authored relationships.** Exercised pointer pan, grip drag, Arrange, Fit, zoom controls and the readable reset at 800 × 820, 1160 × 820 and 1540 × 1000 outer window sizes. The graph and receipt remained equal. In the same isolated project, the existing built-in workflow created a real release and a committed action was completed before the geometry checks. The full legacy snapshot and displayed release percentage remained equal afterward. Keyboard tabs, stored file return, project reselect, Journal, saved Resume and Project tools were exercised.
- **Small and larger fixtures.** Desk Notes has 15 definitions and 29 relationships. Its reviewed formation through Fit took 1,098 ms in the packaged run. A generated PTB fixture with 171 definitions and 85 relationships reached ready in 1,063 ms, and Fit took 58 ms. It showed 40 canvas cards at 28% with all 171 definitions searchable. The outline revealed Feature 85 and its two-card neighborhood. These are single-run interaction timings on this machine. The empty-map and failed-read recovery cases also passed.

## Packaged screenshots

[Vivarium neighborhood 1540](v3a1a/stabilization/vivarium-neighborhood-1540.png) · [1160](v3a1a/stabilization/vivarium-neighborhood-1160.png) · [800](v3a1a/stabilization/vivarium-neighborhood-800.png) · [Expanded Fit at 1160](v3a1a/stabilization/vivarium-expanded-fit-1160.png) · [Compact inspector](v3a1a/stabilization/vivarium-inspector-800.png) · [FieldLedger compact Fit](v3a1a/stabilization/fieldledger-fit-800.png) · [Captured sources](v3a1a/stabilization/fieldledger-captured-sources-800.png) · [Exact relationship source](v3a1a/stabilization/exact-relationship-source.png) · [Larger Fit](v3a1a/stabilization/large-fit-1160.png)

## Manual acceptance

The owner accepted the stabilization and reported substantially better graph navigation, zoom, Arrange and responsiveness. Relationship exploration was useful, the appearance was approaching the intended standard, and captured-source navigation worked. Dense relationships still get tangled. The journey below remains available for targeted follow-up.

Use the rebuilt executable and a separate profile. Select a copy of the [Vivarium fixture](../tests/fixtures/vivarium/project.md) with the native picker.

```powershell
$ptReviewProfile = Join-Path $env:LOCALAPPDATA 'ProjectsTimeline-Stabilization-Acceptance'
& (Resolve-Path 'out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe') "--data-dir=$ptReviewProfile"
```

1. Form or reopen Vivarium. At 1160 px, expand **Procedural anatomy generation**, open its inspector and select **Fit map**. Check the child and the rest of the current graph fit. Click the zoom percentage to recover a readable view, then drag a card and compare Fit with Arrange.
2. Find **Define the PetDNA schema and codec** in the outline and explore its neighborhood. Hover or keyboard-focus a line to read its exact direction and label. Follow a related record, explore again and use Back twice. Check focus and scroll, including the compact detail return. Open the requirement relationship's Source, inspect its exact highlight and press Escape.
3. Open **Captured sources**, **Journal** and **Project tools**. Save a checkpoint in the test profile and confirm **Resume** appears and opens it. Return to the map and check its previous selection and camera. Repeat the compact layout at 800 px and review the wide graph at 1540 px.

## Remaining limits

Fit trades card text size for coverage in dense views. The reset, outline and focused neighborhoods provide readable alternatives. The canvas projects up to 40 cards and 80 relationships. Full labels are shown in the focused caption and inspector. Path segments can still pass behind intermediate cards, and advanced routing is separate work. Geometry and up to 20 Back frames live in the session. At that limit the oldest intermediate neighborhood rolls off while the atlas remains reachable.

- [ ] Check the native picker with real owner-selected paths. The harness supplies chooser results.
- [ ] Check screen-reader reading order, edge captions, dialog focus and return on the owner's setup.
- [ ] Review dense relationships, scaling and performance beyond the tested larger fixture. Focus Canvas, an optional diagram window and live Markdown navigation are separate proposals. [Follow-up backlog](design/visual-engineering-backlog.md).

The recorded acceptance covers the stabilization feedback. A separate owner-run end-to-end Vivarium restart result has not been recorded. [V5a design](design/v5a-linked-development-continuity.md) awaits implementation approval.
