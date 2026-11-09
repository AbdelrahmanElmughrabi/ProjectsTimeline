# V2 Blueprint Preview — final verification and acceptance

2026-11-06 · **Implemented and automatically verified; user acceptance pending.** Branch `codex/v2-preview-integration`. Final application/test source: **bb2fd95a10148416e8191e5abfb04bf76c9e2aab**. Main and Antigravity's branches were not reset/merged/pushed. V3a is not authorized.

## Delivered behavior and review

Home → Preview blueprint → inspect real single-file/multi-document PTB v0.2 structure, proposed records/stages, typed relationships, exact captured narrative/source and diagnostics → Refresh or Cancel. No project import, accepted work, persisted preview history, migration, release gate transfer or model calls. Schema remains v3; existing projects/actions/checkpoints, Home/Resume, release progress/confirmation and Workflows remain intact.

Reviewed all three Antigravity reports. Integrated fix **fb49a4eca4c4ab3fe0861922369aa7fca8339233** as b5f7875 and report **489c9c7da929dd4430fcecf69d22174cb7adc392** as d8dca59. Resolved the prior review findings:

- **AG-UI-001:** related-source navigation keeps the real diagnostic/document/span, selecting a record only when it owns that span. Integration additionally removed an unrelated same-document fallback. Mandatory live checks jump duplicate IDs across documents, jump PROJECT_OWNER to project.md with no guessed record, then return to the foreign occurrence's own failing project field.
- **AG-UI-002:** live source-heading, outline and busy Cancel focus checks pass. Live testing exposed a disappearing inspector opener: bb2fd95 restores focus after React commits, preferring a surviving opener and falling back to its stable outline entry/header. Inspector metadata→Escape is tested against the rebuilt renderer.
- **AG-UI-003:** both placeholder skips are replaced. Removed the remaining conditional “PENDING REBUILT RUNTIME” bypass. New live assertions require the outline-first layout and clean project-ID summary, so the older renderer cannot satisfy the UI suite. Routine copy/summary readability improvements are integrated.

## Actual final execution

| Command/check | Result |
| --- | --- |
| `npm test` | **78/78 passed**, zero skips; both TypeScript targets/build included |
| `npm run test:e2e` | **21/21 passed**, zero skips: 20 real Electron cases plus one static UI boundary/namespace invariant case; includes the assigned Preview suite **3/3** |
| `npm run package` | **Passed**, Windows x64 ASAR app rebuilt using task-specific TEMP/TMP under ignored artifacts |
| `npm run test:packaged` | **4/4 passed**, zero skips; bundled ESM, temporary-session expiry on full restart, new outline-first packaged UI and existing populated-v1/v2 SQLite/Home/Resume/release/workflow recovery |
| `npm audit --omit=dev --json` | **Exit 0: zero known production vulnerabilities** |
| `npm audit --json` | **Exit 1: 12 moderate dev-tool findings**, zero high/critical; follow-up below |
| ASAR content check | Final JS/CSS bytes match dist exactly; audit-flagged dev package code and tests/docs/artifacts/worktrees absent |
| Protected-source comparison | Migrations 001–003, startup/security policies, pure release-progress/Resume code and ADRs 0001–0006 unchanged from 1cb122d |

**103 passing automated cases**, counted once across Node/Electron/packaged runs. Build/audits and repeated focused reruns are not added to that total. A clean full dependency audit is not claimed. Tests use isolated profiles and real source fixtures; native picker returns are stubbed only in main-process tests, not production.

Changed-file map (complete diff: `git diff main..codex/v2-preview-integration`):

| Area | Files |
| --- | --- |
| Pure parsing/graph and bounded capture/session | `src/main/blueprint/parser.ts`, `graph.ts`, `acquisition.ts`, `session.ts`; three `tests/unit/blueprint-*.test.mjs` files |
| Typed trust boundary | `src/shared/blueprint-preview.ts`, `contracts.ts`, `src/preload/index.ts`, `src/main/ipc.ts` |
| Application navigation/controller | `src/renderer/useBlueprintPreview.ts`, `App.tsx`, `ProjectHome.tsx`, `ProjectSidebar.tsx`, small `styles.css` addition |
| Bounded presentation | Five `src/renderer/blueprint-preview/*.tsx` components and namespaced stylesheet; AG delivery plus Codex integration corrections after AG stopped |
| Runtime/recovery verification | `tests/e2e/blueprint-backend.test.mjs`, `blueprint-navigation.test.mjs`, `blueprint-preview-ui.test.mjs`, exact bridge expectation in `workspace.test.mjs`; `tests/packaged/blueprint-preview.test.mjs` |
| Dependencies/records | `package.json`/lock (two approved parser pins/transitives); ADR 0007, contract/hand-offs/reports/queue, engineering checklist, roadmap/alignment, verification and this report. Short Obsidian note updated separately |

The final Node suite exercises strict JSON/comments/trailing commas/escaped duplicate keys, malformed occurrence visibility, Markdown fence context, exact BOM/CRLF/Unicode positions, typed links/cycles/ownership, stage/workflow resolution, package-independent semantic identity, Windows safe paths/junctions/physical aliases/observed races, bounded capture/cancellation/expiry and complete table equality. Existing release freezes/verification invalidation/Resume/security regressions pass.

Evidence logs (ignored local artifacts): `v2-final-node.log`, `v2-final-electron.log`, `v2-final-build.log`, `v2-final-package.log`, `v2-final-packaged.log`, `v2-final-application-audit.json`, `v2-final-all-dependency-audit.json`. An initial live-focus assertion failed and led to the post-render fix; no force-click or conditional bypass replaced it. One new test expectation was corrected from a whole-record ID to the exact diagnostic field text. Earlier Windows ASAR extraction used the wrong path separator; native-path byte comparison passed. The scope directory alone was not mistaken for bundled Forge code in the final package check.

## Final build and screenshots

- JS: `index-D-yPq0yx.js`, SHA-256 `ac2308c03f47f6875776e771def0f68b4e34dda050874f494b85c8fd26b8a42d`.
- CSS: `index-LlugB3VP.css`, SHA-256 `feb734498bac528046e88e9e49915c25914f88a23a9119f69fa9d194716bb581`.
- Executable: `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe`.
- Updated and visually inspected actual-runtime screenshots: [800px](../artifacts/antigravity-fieldledger-800.png), [1160px](../artifacts/antigravity-fieldledger-1160.png), [1440px](../artifacts/antigravity-fieldledger-1440.png), [invalid package](../artifacts/antigravity-hostile-invalid-800.png), [packaged UI](../artifacts/blueprint-packaged.png). Fixtures are explicit test inputs, not hardcoded production records. Zero horizontal page overflow at all three widths; compact layout is stacked, wide layout has two columns.

## Security follow-up and limits

Full audit's 12 findings are the existing Forge chain (CLI/core/core-utils/maker-base/plugin-base/publisher-base/shared-types, packager/asar/universal) plus **glob 13.0.6** and **minimatch 10.2.6**. All flagged versions match the pre-V2 lock at 1cb122d; V2 did not upgrade/introduce them. Two underlying advisories concern [glob cancellation traversal](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) and [minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249); other entries are dependency-chain effects, not 12 independent vulnerabilities. Local packaging uses controlled patterns; untrusted PTB parsing does not use this toolchain. The vulnerable package code is absent from the ASAR (an empty @electron-forge scope directory is harmless metadata). This narrows runtime exposure; it is not a complete security audit or guarantee. Review compatible build-tool updates separately; do not run `npm audit fix --force` or silently replace the approved Forge major version (audit proposes a major-version change).

Preview is captured/read-only, not live-synced; Refresh explicitly recaptures. Cancel prevents late publication but does not promise instant interruption of synchronous parsing. File checks reject observed identity/content changes, not authenticate or writer-lock source. Missing/incompatible development workflow editions remain Needs review; the release library is not migrated. No current V2 functional review issue is left open; native-widget/manual UX and build-tool maintenance remain.

## Manual acceptance

1. Launch the rebuilt executable; use the real Windows picker to select a single-file blueprint and a linked package. Check familiar project/context readability and keyboard use at your preferred window sizes.
2. Inspect an action, relationship, diagnostic and related location. Try source-heading/inspector navigation and Escape. Edit a copy externally, Refresh, then Cancel; check that source stays honest and no blueprint project/work was created.
3. Open existing Home/Resume, Workflows and a confirmed release; check your own saved context after a full restart. Accept V2's compact/wide layout and record the separate build-tool maintenance decision.

Stop for acceptance. No V3a implementation or migration follows automatically.
