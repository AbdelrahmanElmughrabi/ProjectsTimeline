# V3 visual prototype — inspect, run and verify

2026-11-07 · **Isolated design simulation, not ProjectsTimeline V3 implementation.** Both concepts use the real Vivarium single-file PTB: 47 definitions / 86 typed links, exact captured source and source anchors. No production imports/route, SQLite, IPC, AI call or external network access. All work/checkpoint/history state is memory-only and clears on reload/reset. The two concepts are alternatives for review, not two promised production modes.

## Run from the repository root

The dependencies already installed in the repository are used; do not install a second dependency tree.

```powershell
node node_modules/vite/bin/vite.js build --config docs/design/v3-visual-prototype/vite.config.mjs
node node_modules/electron/cli.js docs/design/v3-visual-prototype/preview.cjs
```

The viewer opens a separate Electron window. Output/profile is under ignored artifacts/v3-visual-prototype, never the regular application profile. No preload/bridge/database is loaded. Close the window to exit. If your terminal explicitly defines ELECTRON_RUN_AS_NODE, remove that variable for this viewer invocation; the check script handles its own environment automatically.

## Five-minute walkthrough

1. Open Vivarium. Overview introduces the seven actual capabilities and source goal; no checkpoint panel is shown initially.
2. Explore engineering map. Concept **A · Component Atlas** starts with project + seven top-level components; select Procedural anatomy generation. Its inspector shows real child/feature/requirement/work links. Expand children, change to Features, drag a node or zoom/fit. Position changes never alter a relationship.
3. Open source section. Read exact captured text and location; Escape returns to the source opener. Explore connected deliberately, rather than recentering after every ordinary click. Use search/accessible outline for non-canvas navigation.
4. Switch the top Compare concepts control to **B · Focus Workbench**. Select Pet DNA schema in the capability index: related requirements/component form a focused map, with detail below. Compare global orientation, canvas space and reading effort with A.
5. Switch Development. The four stages are an authored roadmap with no dates. Review & commit plan shows explicit simulation effects; acknowledge Draft requirements before applying. Choose PRNG → Start work. It changes only simulated work state, not evidence or a release.
6. Save your own accomplishment/next step and optional problem/questions. Go Home → Continue saved context. It returns to the same target/view. Read checkpoint reveals the exact saved accomplishment, problem and questions. History contains only your simulated interactions; no source narrative is presented as past work.
7. Resize to an 800px desktop window. Detail replaces the canvas and Back restores it; no permanent empty Resume rail. Check source, search, focus visibility and long text. Reset simulation removes the chosen focus/checkpoints/events without changing bundled source.

## Automated design check and screenshots

```powershell
node docs/design/v3-visual-prototype/check.mjs
```

Runs a small pure projection check and real Playwright/Electron walkthrough in the isolated viewer. Checks exact IDs/links/source immutability, both concepts/ELK layout/drag, source and keyboard focus return, explicit simulation effects, linked continuation, history, 800/1160/1540 window widths, page overflow, CSP/runtime errors and absence of network/app bridge. It writes actual rendered screenshots into this tracked screenshots folder; result/log output is in ignored artifacts/v3-visual-prototype. It is **not** the application's Electron suite, packaged recovery or a production V3 acceptance test.

| Compare | Rendered artifact |
| --- | --- |
| Home / Overview | [Home](screenshots/home-wide.png), [Overview](screenshots/overview-wide.png) |
| A · Atlas | [Wide](screenshots/atlas-wide.png), [inspector](screenshots/atlas-inspector-wide.png), [narrow](screenshots/atlas-narrow.png), [narrow detail](screenshots/atlas-detail-800.png) |
| B · Workbench | [Wide overview](screenshots/workbench-wide.png), [focused wide](screenshots/workbench-focused-wide.png), [narrow](screenshots/workbench-narrow.png) |
| Connected flow | [Source](screenshots/source-section.png), [Development](screenshots/development-wide.png), [History](screenshots/history-wide.png), [saved context](screenshots/saved-context.png) |

At 800/1160/1540 outer Windows sizes the measured renderer viewports are 784/1144/1524 × 975. Screenshots include clearly labelled simulated context created by the check; no genuine Vivarium work was completed. They are actual rendering, not generated mockup images. Visual inspection, not test totals, informs the [concept comparison](../connected-workspace-design.md).

## Data and limits

vivarium.json includes the actual captured single/project.md, metadata/narrative anchors and normalized definitions; it contains no filesystem grant or absolute source path. Reproduce only if the source intentionally changes and the existing parser has been built:

```powershell
node docs/design/v3-visual-prototype/capture-data.mjs 'C:\Users\fireball\OneDrive\Desktop\3d pet generator\projects-timeline-test\single\project.md'
```

Never edit or execute Vivarium to refresh this study. The multi-file version has four narrative differences; it is not substituted as byte/semantic-equivalent input.

Known limits: map labels require zoom at small fitted scales; Workbench trades map height for reading space. No saved canvas positions, actual adoption/merge/editor, persistent restart, actual assessments, Gantt/dependency engine, large-model benchmark or accessibility certification. Semantic edges cannot be added/deleted in the map. The deliberately bounded graph keeps most actions/checks out of the canvas. Build emits use-client directive and ~2.08MB single-chunk warnings; actual production bundle/performance/CSP/packaging must be reviewed before integration. No such integration is authorized now.
