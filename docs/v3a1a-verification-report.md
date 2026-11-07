# V3a1a — Production verification and acceptance

2026-11-07 · **Implemented and automatically verified. User acceptance pending.** Production commit `e4eadb96d3cbf7fa437260d8ea30bbcc95137e33`, based on the approved design `1b3be9255f8f344fbd8897389b732462212e7004`. [ADR 0008](adr/0008-durable-knowledge-formation.md).

## What shipped

- **Reviewed formation.** Home → Preview blueprint → Review project formation → Create knowledge project. Main owns the review and commits the new project, typed revision-1 knowledge, source and one formation event together. Review is read-only. Receipt replay returns the committed project after a lost acknowledgement or restart.
- **Durable context.** The graphite/violet Overview and Map show actual definitions and directed native relationships. Explore by dragging, expanding, searching the outline or following a record's connections. The inspector opens stored metadata, narrative and relationship source at their original spans. Development readiness remains **Not assessed**.
- **Boundaries.** Formation creates no operational actions, release memberships or verification results. Requirements and scopes remain Draft, actions and decisions Proposed, and checks Not run. Existing journals and Resume remain available through Project tools. There are no new dependencies or changes to migrations 001–003 or the Electron security policy.

Changed areas include [formation and validation](../src/main/blueprint/formation.ts), [persistence](../src/main/data/knowledge.ts), [migration 004](../src/main/data/migrations/004_durable_knowledge.sql), [typed contract](../src/shared/knowledge.ts), the named IPC/preload routes, [review UI](../src/renderer/BlueprintFormation.tsx), [workspace](../src/renderer/knowledge/ProjectKnowledgeWorkspace.tsx), [map projection](../src/shared/knowledge-map.ts) and focused [Node](../tests/unit/knowledge.test.mjs), [Electron](../tests/e2e/knowledge.test.mjs) and [packaged](../tests/packaged/knowledge-recovery.test.mjs) tests.

## Actual runs

| Command or runtime | Outcome |
| --- | --- |
| Pre-change baseline | 78/78 Node, 21/21 Electron, 4/4 existing packaged recovery. The baseline Node rerun used normal Windows filesystem permissions after three sandbox `EPERM` errors in temporary symlink/root replacement tests. |
| `npm test` | **92/92**. Build and both TypeScript targets passed. Includes the production migration, formation, capture/source and map projection checks. |
| `npm run test:e2e` | **25/25** in real Electron 45.2.3, including four knowledge journeys and the existing Home, Preview, Resume, release, workflow and renderer-boundary suites. |
| `npm run package` | **Passed**. Forge rebuilt the Windows x64 executable and app.asar. The packaged test checks renderer HTML, built JS/CSS and migration 004 hashes against the final build. |
| `npm run test:packaged` | **5/5** from the rebuilt executable. FieldLedger survives full restart and a moved source directory; legacy populated migration, verified release/workflow recovery, V2 ESM and preview-only behavior also pass. |
| `node --test tests/e2e/knowledge.test.mjs` with `PROJECTS_TIMELINE_EXECUTABLE` set | **4/4** on the rebuilt executable. Vivarium capture, formed Map, exact source and restart; empty/read error and focus fallback; lost acknowledgement and read-only retry; forced interruption and recapture. |

Zero skips in final runs. The Electron suite had one earlier intermittent failure in the existing reduced-motion check. It passed in isolation and on two subsequent full runs. The first packaged run passed the four legacy tests and stopped the new FieldLedger test on a missing `node:test` import. Fixing the harness yielded 5/5 on the same executable. The build reports the approximately 2.03 MB minified renderer chunk and module-directive warnings. The packaged renderer loaded and completed the tested journeys.

### What the checks established

- **Formation and recovery.** Vivarium persisted all 47 identities, kinds, titles and source order, plus all 86 directed native relationship tuples compared against a real capture. Desk Notes persisted 15 definitions / 29 links, and the four-document FieldLedger persisted 37 / 82. The typed records, exact-source hashes and offsets, workflow Needs review, read-only preview and proposal isolation are exercised. Vivarium's actual single-file source is 24,844 bytes, SHA-256 `6235b124054a95a03f4a21e3e8e1a2b4f0c7d7bb7cd6f6dcfde2229d7abda7ba`. Automated tests move or remove isolated fixture copies.
- **Data and failure safety.** A populated v3 migration compares legacy rows and the pre-upgrade backup and checks frozen release, workflow and Resume records. A broken migration rolls back and a newer schema is refused. Tests inject faults at nine formation writes and at deferred commit, replay a lost acknowledgement, reject a competing prepared plan for the same source and keep colliding knowledge and operational IDs independent. Killing an isolated Electron process during a native relationship write leaves no partial project. Recapture creates one.
- **Renderer.** Packaged runs use app:// and verify isolation, sandboxing, disabled Node integration and absent renderer Node globals. The exercised Vivarium UI emitted no page errors, CSP violations or external requests. The 800, 1160 and 1540 outer window widths exercise pointer dragging, selection preserving the camera, separate Fit/Arrange behaviors, keyboard outline selection, compact Back, and source Escape/focus return. Inspection of a focused neighborhood restores the prior Map on Back.

## Packaged screenshots

[Wide Map](v3a1a/screenshots/map-1540.png) · [Focused neighborhood](v3a1a/screenshots/neighborhood-1540.png) · [Overview](v3a1a/screenshots/overview-1540.png) · [Mid-width Map and inspector](v3a1a/screenshots/map-1160.png) · [Compact Map](v3a1a/screenshots/map-800.png) · [Compact inspector](v3a1a/screenshots/detail-800.png) · [Exact source](v3a1a/screenshots/exact-source.png) · [FieldLedger after restart](v3a1a/screenshots/fieldledger-restart.png)

## Manual Vivarium acceptance

1. In the repository, start the rebuilt app with a separate acceptance profile. Select a **copy** of the [Vivarium fixture](../tests/fixtures/vivarium/project.md) using the real native picker.

   ```powershell
   $ptAcceptanceProfile = Join-Path $env:LOCALAPPDATA 'ProjectsTimeline-V3a1a-Acceptance'
   & (Resolve-Path 'out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe') "--data-dir=$ptAcceptanceProfile"
   ```

2. From Home, choose **Preview blueprint**, inspect the captured source, then **Review project formation**. Review 47 definitions, 86 native relationships and zero operational work, then choose **Create knowledge project**. In Overview check the definition counts and **Not assessed**. Through **Project tools**, verify actions/releases start empty and the existing journal and Resume remain accessible.
3. In Map, drag a node by its grip, select it, expand a branch and open **Explore connections**. Verify selection leaves positions and zoom stable, **Fit map** moves the camera, **Arrange** changes placement, and **Back to prior map** restores the prior view. At approximately 800, 1160 and 1540 pixels, check label legibility, pan/zoom, and keyboard use of the outline and inspector.
4. Find `act.define-dna-schema` and use **Metadata source**, **Narrative source**, and a relationship's **Source**. Confirm exact highlights, file name and the captured fingerprint. Use Escape and confirm focus returns. At compact width use **← Map** to return from the inspector.
5. Preview the same fixture again and verify **Open existing project**. Fully quit, move the copied source outside its original path and reopen the same acceptance profile. From Home, reopen Vivarium and inspect the same relationship and source. The stored bytes and graph should still be available.

## Limits and next gate

Map geometry resets on restart. The interactive projection limits the canvas to 40 nodes and 80 links, while the outline can find every definition. Narrow canvases preserve a readable zoom floor and may require panning. Formation supports a new project per native PTB root in the profile and opens its existing project on repeat capture. Reimport updates and attachment await their own design gates.

Automation supplies the chosen path to the native dialog. Manual acceptance covers that dialog, map density at your display scaling and assistive technology behavior. Full-scale graph performance and a comprehensive screen-reader audit remain unmeasured. V5a starts only after acceptance and separate authorization.
