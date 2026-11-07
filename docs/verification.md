# ProjectsTimeline — Verification record

## Post-V3a1a UX review, 2026-11-07

One disposable probe and **4/4** existing knowledge journeys ran against the shipped Windows executable, with zero skips. The probe reproduced Fit clipping, label/card intersection and navigation focus loss. It also verified resolved SVG markers, working pan/zoom and preservation of viewport when switching between Map and Overview. See the [design review and evidence](design/post-v3a1a-ux-review.md) for widths, reproduction and limits. Independent Antigravity feedback is pending.

## V3a1a production verification, 2026-11-07

Source `e4eadb96d3cbf7fa437260d8ea30bbcc95137e33`. **92/92 Node, 25/25 Electron, 5/5 packaged recovery and 4/4 repeated knowledge journeys on the rebuilt Windows executable.** Zero skips in these runs. Both TypeScript targets, Vite build and Forge packaging passed. The [V3a1a verification report](v3a1a-verification-report.md) records the actual fixture, migration, failure/retry, security and viewport evidence, reruns and manual acceptance checklist. Earlier design gates below are historical.

## V3a1a final concerns — revised design evidence, 2026-11-07

Production remains paused. Overall visual/product direction is approved, **004/implementation are not**. [Final comparison/inventory](design/v3a1a-final-design-review.md), [revised contract](design/v3a1a-implementation-proposal.md), [exact SQL](design/v3a1a-schema-proposal.md). Prior 28bac82 recommendation/23-check result below stays historical; current recommendation supersedes its immediate ordinary-action rows.

| Actual check | Outcome / limits |
| --- | --- |
| Source and mutation audit | Re-read all ordinary action/detail/membership SQL and actual IPC methods plus 002/003. Existing 002 already rejects membership action/release identity UPDATE; previous disposable coverage omitted that route. Recommend structural isolation: no operational proposal row/mapping in V3a1a, no legacy query/mutator changes. Separate knowledge/operational numeric namespaces explicitly tested. |
| Schema reduction/evolution | Draft now 13 tables / 5 explicit indexes / **29 triggers**. Remove four action guards, action/details duplicate projection, workspace counter and current-definition pointer. Separate source binding from project; capture-native IDs scoped to origin. Main PTB-only validation remains; bounded generic storage is not an adapter implementation. Full table/trigger/revision rationale in final review. |
| Disposable executable checks | `node docs/design/checks/v3a1a-schema-check.mjs`: **61/61 pass**, exit 0. Versioned design check extracts Markdown SQL, compiles unchanged current Node/main source into ignored artifacts, uses `:memory:` and actual `WorkspaceStore` methods. Nine fault phases roll back; zero operational rows created by the synthetic formation; original legacy rows unchanged; real complete/reopen/assign/exclude/edit/reorder reject missing IDs without audit/revision changes; membership INSERT/FK and identity/release UPDATE rejection; allowed legacy stage/exclusion and numeric collisions affect only legacy work; gate protected; all 29 trigger groups exercised; typed FK/CHECK/source-root/deferred-receipt guard negatives; exact BOM/CRLF/Unicode bytes retained. Log: `artifacts/v3a1a-proposal-checks/final-schema-check.log`. Not a new formation command or actual migration-runner test. |
| Future-source probes | Synthetic unsupported-format SQL metadata + null native root/semantic hash and same native alias across two source captures are representable, without another project/PTB identity; probes rolled back. **Not compatibility, adapter execution, update merge, crosswalk or runtime allowlist verification.** Those are explicit later gates. |
| DTO/compilation | Extracted revised fenced DTO types compile strictly against actual shared contracts, exit 0; existing tsconfig.node compilation to disposable output also passes. No production types/commands added. |
| Independent final review | Lighter reviewer found no material revised SQL/formation contradiction. Its remaining native-root uniqueness observation is now explicit: profile-level PTB duplicate binding, not a global PTB guarantee; fork/clone and each future adapter's authority/vault/account scope need their own gate. |
| Preservation | Production source/config/tests/dependencies/old ADRs/001–003 unchanged; all nine pre-existing screenshot hashes match, still 3 migration files; AG worktree clean at 92a7129. **189 local links across 11 changed Markdown documents resolve** and diff whitespace check passes. The added `.mjs` is a docs-only disposable check; no application or test-suite registration. No app profile or real database opened. |
| Remaining evidence | No full Node suite, Electron/renderer, real new import, migration backup/restart, responsive map or rebuilt-package test rerun. Before approved code, rerun actual baseline; then run every migration/security/real UI/packaged recovery criterion retained in the proposal. Historic 103 V2 tests are not V3a1a evidence. |

Next: final user authorization for the revised schema and exact production scope, then implement only V3a1a and stop for acceptance. V5a/adoption/other-source commands remain separate; no Antigravity production BEGIN.

## V3a1a concrete proposal — specification checks only, 2026-11-07

User approved refined Concept C/corrections and V3a1a → V5a → V3a1b → V3b1. [Concrete proposal](design/v3a1a-implementation-proposal.md) / [exact proposed 004 DDL](design/v3a1a-schema-proposal.md) now await approval. No migration file, production module, dependency or prototype merge. Baseline inspected at **9171004238ea10a216c169ff1b5da002d771c731**; schema remains v3.

| Actual check | Outcome / limits |
| --- | --- |
| Repository/code review | Read migration runner/001–003, store queries/mutators, preview types/session/acquisition/parser, App/controllers, shared API, build/security/test boundaries. Actual gaps: main retained grant but not snapshot; no proposal guard or durable source graph. Proposed additive changes target those gaps. No application data opened/changed. |
| Lighter domain/UX review | Two read-only reviewers examined exact proposal/DDL. Corrected operation/import receipt-key ambiguity, old PTB “before apply” wording, historical target-version claim, action-registration “new” claim, insertion order, renderer save/retry/focus and unlinked legacy-journal distinction. No implementation agent or Antigravity BEGIN. |
| Disposable SQLite design check | `node artifacts/v3a1a-proposal-checks/schema-check.mjs`: **23/23 smoke checks pass**, exit 0. SQL extracted from Markdown into `:memory:` after unchanged 001–003. Creates 13 tables / 5 explicit indexes / 33 triggers; sampled legacy rows unchanged; deferred FK cycle commits; BOM/CRLF/astral source bytes retain hash; 7 injected insertion phases fully roll back; owner/kind/identity/immutability/completion/release/stage guards reject; appended revision retains source anchor; missing current definition prevents commit. Log: `artifacts/v3a1a-proposal-checks/schema-check.log`. This is a disposable schema design check, not implemented formation/migration/store/IPC verification. |
| Proposed DTO syntax/types | Extracted fenced type contract with imports from actual shared contracts; installed TypeScript `--ignoreConfig --noEmit --strict --skipLibCheck --target es2023 --module preserve --moduleResolution bundler` passes, exit 0. Does not implement or test five commands. |
| Preservation/docs | `git diff --check` passes (only Git's existing LF/CRLF notices). All **192 local links in 11 changed Markdown files resolve**, 9 pre-existing screenshot SHA-256 values match, still exactly 3 migration files. AG worktree is clean at 92a7129; source/package/config/tests/old ADRs/migrations unchanged. |
| Full application verification | **Not rerun in this proposal-only phase.** Previous 103 V2 checks remain historical. Before approved implementation, rerun Node/Electron/build baseline; after changes run all rebuilt-package recovery/security/UI tests, exact-source/retry/migration tests and 800/1160/1540 screenshots. No V3a1a application, packaged, performance or manual acceptance claim. |

Next: approve the four consequential choices in the proposal before writing 004/production code. New ADR 0008 follows that approval. Future editing/reimport must finalize historical target-revision/local-link provenance; evidence/snapshot schema and later slices remain gated.

## Consolidated Antigravity C review — actual design-only checks, 2026-11-07

Input: AG **92a712908223756d984abf675bc542dad65f77eb**, frozen base **63c18e90f6a3ff26cc724c3a6fe2c8d65ee66aca**. All 27 changed paths match assigned reports/prototype/screenshots; clean AG worktree, no cherry-pick/merge. Nine existing root Codex screenshot modifications were present before review and are hash-preserved. [Detailed findings](design/v3-consolidated-review.md), [real capability matrix](design/v3-capability-audit.md).

| Actual check | Outcome / scope |
| --- | --- |
| Build exact AG source using existing root Vite/config with output override | **Pass** into artifacts/v3-c-review/build. Known use-client/large-chunk warnings remain; no dependency install or production configuration change. |
| Copied AG check.mjs with only imports/output/profile redirected and finite wait timeout | **Pass**, pure model + real isolated Electron/Playwright walkthrough; all 16 screenshots go to review artifacts, not either committed image folder. Outside-lens reveal, source-return, simulated adoption/start/checkpoint/Continue and widths 800/1160/1540 exercised; zero runtime/console/CSP errors/external requests, no Node/app bridge in tested paths. This is not full application integration. |
| Additional runtime-probe.mjs, including settled layout frames | **Reproduced:** selection refits zoom; drag displacement x=0/y=0; Close inspector focus BODY; bulk helper auto-checks Draft acknowledgement; clearing commitments after completion yields **0 committed / 1 done / 10 proposed**; explicitly unscoped action remains visible yet gets false outside-filter banner. Baseline pass did not cover these behaviors. No DB involved. |
| Temporary TypeScript Base UI prop probe | **Expected TS2322 reproduced:** onCloseAutoFocus is not Dialog.Popup's installed prop; finalFocus is supported. Not an application build failure; source dialog's passing return uses default library behavior. |
| Actual existing parser on real Vivarium single/multi and repository supplements | Both Vivarium packages Valid 47/86, equal normalized known metadata/links, different narrative-inclusive semantic hashes b0fbefb8… / 23245ab6…; four differing narratives, including a real added project paragraph. Desk Notes Valid 15/29 and FieldLedger Valid 37/82. No source application code executed/files edited. |
| Supplementary model/source comparison | Desk metadata matches after missing-empty-default normalization; FieldLedger **15 records differ in non-default fields**. All 15/37 supplemental records lack UTF-16 source offsets; embedded source texts/hashes are abbreviated/placeholders. Counts/canonical digest literals do not prove exact fixture/source fidelity. |
| Derived-edge model probe | Four native resolved primary-component edges in the determinism neighborhood are marked path-2hop/dashed by node distance. They remain explicit source assertions; the reviewed model separates route distance from edge origin. |
| Visual and connected-code review | Compared committed A/B/C wide/narrow; C best initial scanning, narrow grid still needs legibility improvements. Read model/UI/tests/README/config, all three reports, real shared/preload/IPC/session/store/migrations and existing controller/source logic. Two lighter read-only domain/UX reviewers added findings; no implementation agents. |

Logs/scripts/results and independently rendered screenshots remain in ignored artifacts/v3-c-review (build.log, baseline-check.log/check-result.json, model-probe.json, runtime-probe.json, base-ui-type-probe.log, preserved-screenshot-hashes.json). Original AG artifacts are unchanged. Canonical review/documents record outcomes and exact source ref, not a production merge. Prototype findings do not affect existing app data.

**No fresh application Node/Electron/package/recovery run in this review.** No production source/tests/dependency/config/security/SQL/ADR change; previous 78/103 counts remain historical. No production V3 persistence/transaction/restart, screen-reader acceptance, large-graph benchmark or app:// / ASAR compatibility is claimed. Inspect the narrowed plan/VD1–VD5 before authorizing concrete schema/commands; no code/migration or external assignment begins from a positive design recommendation.


## V3 visual redirection — design/prototype verification, 2026-11-07

**No production V3 feature or migration.** Preservation baseline 47f73c6 checkpoints tooling setup + paused drafts; codex/v3-paused-design-checkpoint retains it. Current design package/handoff: codex/v3-visual-workspace-handoff. [Study/run/screenshots](design/v3-visual-prototype/README.md), [concept critique](design/connected-workspace-design.md), [component/runtime inventory](design/v3-ui-component-inventory.md). Prior V2 results below remain historical and manual acceptance separate.

| Actual execution / inspection | Result and practical scope |
| --- | --- |
| Installed manifests versus package/lock/config | React/DOM 19.3.1, React Flow 12.12.1, ELK 0.12.1, Base UI 1.9.0, Tailwind/plugin 4.3.5, shadcn CLI 4.23.0, Vite 8.3.6, Playwright 1.64.1 / runner 1.65.0 match installed versions. Nova configured, no generated app components. No installation/upgrade or new audit. |
| Existing production capture/parser, read only | Real Vivarium single and multi both Valid, 47 definitions/86 typed links; metadata equal, four narrative differences and different narrative-inclusive hashes (b0fbefb8… / 23245ab6…). Deliberate invalid package blocked with duplicate ID/cycle/link/stage/JSON diagnostics; inspectable 13 occurrences. Desk Notes Valid 15/29, FieldLedger Valid 37/82. No Vivarium application code executed or files edited. |
| `node node_modules/vite/bin/vite.js build --config docs/design/v3-visual-prototype/vite.config.mjs` | **Pass**, isolated output only. Actual React Flow + ELK + Tailwind + Base UI dialogs bundled. use-client directive warnings in non-RSC bundling and ~2.085 MB single JS chunk / ~45 KB CSS warning remain; not hidden as warning-free or production-ready. |
| `node docs/design/v3-visual-prototype/check.mjs` | **Pass**, pure identity/projection/source-immutability checks plus actual isolated Electron/Playwright walkthrough. Two concepts, ELK layout, zoom/fit/drag, component/feature context, exact source + Escape/focus return, explicit simulated plan commitment/Start/Complete/Reopen, authored checkpoint/problem/questions → Home → same target, real simulation-event History. No skipped cases or app-database writes. |
| Widths/security in that real study run | Outer windows 800/1160/1540; renderer 784/1144/1524 × 975; no horizontal page overflow. Narrow detail replaces canvas. Same strict CSP as production; no observed CSP/runtime/console errors or external requests; no Node/app bridge. Source and dialogs actually exercised, not only compiled. This is not app:// or ASAR verification. |
| `npm test` against preserved app/tooling | **78/78 Node pass, zero skips**; actual root build and both TypeScript targets pass. Production files and tests unchanged from 47f73c6. Full application Electron/packaging/recovery was **not rerun** for this documentation/prototype phase. Previous 103-case result is not a new run. |
| Source/whitespace scope review | Protected src/tests/scripts/package/lock/config/ADRs have no diff from 47f73c6; migrations 001–003/security/release/Resume untouched. Scoped diff whitespace reviewed. |

Visual review: actually opened Atlas wide/narrow/detail, Workbench wide/focused/narrow, Overview, Development, source and saved-context images. Improved fitted node type and inspector wrapping after first render. Atlas offers stable orientation/canvas; Workbench consumes height/width and requires more zoom. Both retain reference-inspired graphite/violet hierarchy without fake dates/percentages or an empty permanent Resume rail. Screenshots are actual rendering with explicitly simulated interaction state, not real Vivarium progress. [Tracked images](design/v3-visual-prototype/screenshots/atlas-wide.png).

The first harness attempt wrongly assumed dragging opened the inspector; corrected to explicit selection, matching intended semantics. Another search locator ambiguously matched a component and an action; corrected to exact accessible title/kind. Final checks pass without forced clicks/skips. Later walkthrough added exact saved problem/questions and completion/reopening, then reran successfully. No backend/parser rewrite was used to make the design pass.

Two lighter read-only Codex reviewers (v3_domain_design_review, v3_ux_design_review) checked multi-format authority/identity and independent map UX; no edits/tests/production implementation. Their findings informed adapters-as-boundary, explicit origin/review/evidence separation, atlas + deliberate neighborhoods, list fallback and conditional Resume. Antigravity has not been launched/contacted; the user manually delivers its committed design-only prompt and returns report refs. Exclusive files/worktree are specified there.

Logs/results remain in ignored artifacts/v3-visual-prototype (build.log, check.log, check-result.json, source-review.json, app-node-regression.log); screenshots/prototype and summaries are checkpointed in Git. No push. Exact ref resolves to the final design commit.

**Manual review remaining:** compare concept usefulness/legibility against real engineering tasks; inspect zoomed labels/relationship direction and source discoverability; keyboard/outline/dialog return with a screen reader; compact context reading; clarity of source/proposal/current/verified distinctions. Review VD1–VD5 and Antigravity's independent critique before production. No actual V3 persistence/restart, migration/transaction failure, large-model benchmark, full accessibility certification, adapter compatibility, production packaged library adoption or new security-audit claim. Existing V1/V2 user acceptance and inherited build-tool advisory review remain open.


## V2 final integration — rebuilt UI verified, acceptance pending, 2026-11-06

**Final report: [v2-verification-report.md](v2-verification-report.md).** Source **bb2fd95a10148416e8191e5abfb04bf76c9e2aab** on `codex/v2-preview-integration`; integrated AG fixes fb49a4e and report 489c9c7 without altering its branch/history. Tightened the remaining same-document source fallback and removed conditional old-runtime test bypass. A real disappearing-inspector focus failure was fixed after React commit, then tested with source-heading, outline and busy-chooser focus in the new renderer.

Final actual runs: **npm test 78/78**, **npm run test:e2e 21/21** (20 real Electron + one static UI-boundary invariant), **npm run test:packaged 4/4**, all **zero skips**; **103 passing cases** counted once. Both TS targets/build and Windows x64 packaging passed. The package UI itself exercises FieldLedger after restart; bundled ESM/session expiry and all old recovery scenarios pass. JS `index-D-yPq0yx.js` and CSS `index-LlugB3VP.css` match dist byte-for-byte inside ASAR; tests/docs/artifacts/worktrees excluded. Current 800/1160/1440, invalid-package and packaged screenshots captured and visually inspected.

Security distinction: actual production audit **exit 0 / zero known vulnerabilities**; broader audit **exit 1 / 12 moderate existing dev-tool chain findings**, zero high/critical, rooted in glob 13.0.6/minimatch 10.2.6. Flagged versions match the pre-V2 lock; actual flagged package code is absent from ASAR (empty Forge scope folder only). This is documented follow-up, not a clean full-audit claim or silent dependency upgrade. Advisory links, hashes, logs, limitations and manual checklist are in the final report. Protected migrations 001–003, startup/security, pure release-progress/Resume and ADRs 0001–0006 unchanged. Preview remains non-mutating/schema v3; no V3a/model/runtime AI. All AG-UI issues closed by rebuilt-UI evidence; user acceptance/build-tool maintenance remain open.

## V2 Phase C — reviewed implementation candidate, not final acceptance, 2026-11-06

User confirmed manual delivery and AG review commit **07f89d830ae196cb74e3cde978faead4e3e2920f**, then explicitly authorized V2 Phase B. Read all three reports, resolved AG-Q-01/02/03 (nullable package-level selection; no invented source; exact occurrence/invalid counts), verified clean AG ancestry/combined type patch and published BEGIN at **b3db26b**, ref `codex/v2-preview-phase-b`. AG report commits were preserved on its branch; no launch/reset by Codex.

Backend checkpoint **76321b5**; reviewed AG Phase B source **0018f48** / report **87fb73e**, cherry-picked UI/reports into separate **codex/v2-preview-integration**, not main. Runtime wiring **ec49d43**, post-render Home focus fix **1cc199c**. Both lighter Codex implementation agents had exclusive pure parser/graph files; root reviewed/corrected source ranges, bounds, graph presentation/performance and source-location pairing. A later read-only review of AG's six UI files found two concrete navigation issues. AG's “100% compliance” reviewer statements are static claims, not accepted runtime verification.

| Actual execution | Outcome / revision context |
| --- | --- |
| `npm test` after backend fixes | **78/78 Node passed**, build and both TypeScript targets pass; old 49 retained + parser 10 / graph 11 / acquisition-session 8 |
| `npm run test:e2e` before presentation integration | **16/16 real Electron passed**, old 14 + backend bridge 2; exact sandbox/Node isolation/34 named API checks, real PTB graphs and no engineering writes |
| `node --test tests/e2e/blueprint-navigation.test.mjs` after real UI wiring/focus fix | **2/2 passed**; Home→real Desk Notes with exact BOM/CRLF source, record/highlight/Escape, 800/1160/1440 no overflow, return focus and retained project drafts; package-level diagnostics with no guessed document, failed read→stale→reselect, native chooser cancellation |
| `npm run package` integrated candidate | First system-temp rename failed EPERM; retry with task-specific TEMP/TMP under ignored workspace artifacts **passed**, Windows x64 ASAR executable rebuilt |
| `npm run test:packaged` rebuilt candidate | **4/4 passed**: bundled parser ESM and temporary session expiry across process restart, all original SQLite/Home/Resume/release/workflow populated-v1/v2 migration recovery scenarios |
| `npm audit --omit=dev --json` actual installed application lock | **Exit 0, zero known production vulnerabilities**. New packages registry HTTPS/integrity metadata/no install scripts; existing resolved package versions unchanged, 34 added transitives/direct entries. Candidate code installed with `--ignore-scripts`. Audit is not a security guarantee |

Node checks cover strict comments/trailing commas/escaped duplicate keys; source-only malformed occurrences and closed PTB fences; forward/duplicate/wrong-kind/wrong-project links; cycles/over-depth/inline stages and both workflow reference statuses; semantic packaging equivalence/authored stage ordering; non-mutating graph input; Windows reserved/traversal/case/physical aliases, junction containment, invalid UTF8/BOM, file/aggregate bounds, actual changed handle/root identity, session cancellation/expiry and full table/schema equality. Actual bounded checks in combined Node run: 1,000,000 bytes/2,001 blocks ~624ms; 20,000-edge graph/long narrative ~1,365ms; these are this machine's observations, not performance guarantees.

Initial acquisition run under restricted Windows sandbox failed junction/rename/cleanup permissions; normal authorized filesystem execution passed. Initial navigation test used incorrect accessible-name assumptions; corrected to actual named regions/controls. Real return-to-Home focus timing was fixed in App after render and retested; selectors were not force-clicked/skipped. Original security/startup/progress/Resume policies, ADRs 0001–0006 and migrations 001–003 have no diff. Schema remains **v3**; no import/apply/accepted work/release contamination/model calls. Tests use isolated profiles, not regular user data. Supplied untracked v0.1 package untouched.

Screenshots produced and inspected: `artifacts/blueprint-preview-800.png`, `-1160.png`, `-1440.png`. Real captured Desk Notes, not production sample records. Wide layout has at most two columns; compact wraps without page overflow. Native dialog widget interaction itself is still a manual check (tests stub only native selection in main).

**Not final:** AG-UI-001 related-source jumps may retain an unrelated record key; AG-UI-002 inspector/source opener focus is stale; AG-UI-003 its assigned test file still has one static assertion case and two explicitly skipped integration placeholders. Runtime/feedback published in Codex report; user asked for status and has not forwarded Phase C feedback yet. No claim that these fixes are complete, all UI cases pass, the full final combined suite ran, or manual acceptance is done. Preserve AG ownership and await its bounded fixes/tests, then review/integrate and rerun combined Node/Electron/build/package/recovery. Stop before V3a.

## V2 Phase A — finalized policy and type-only source boundary, 2026-11-06

User approved Phase A review and directed final parser/order/strict JSON/partial-invalid/workflow policies. Final `v2-preview-1` maps **both unavailable and incompatible workflow references to Needs review**; syntax/schema/relationship errors still block. Authored stage order is semantic; physical presentation has no implied priority and packaging is excluded from graph identity. Unclosed PTB fences retain source and block. Canonical types committed separately as **601a350bc44356a7886d650867b5ec7dcfe772a7**; docs review entry type-forwards them. Source-only module does not extend WorkspaceApi, register channels, implement parser/controller/UI or install dependencies. Final review ref: `codex/v2-preview-contract`. No BEGIN or Antigravity branch edits/launch.

Actual follow-up execution:

- **npm test: 49/49 Node passed, exit 0**, including build/both TypeScript targets. Existing renderer asset hashes unchanged (index-BZzTd8r3.js/index-X768Ofa9.css). Strict no-emit check of forwarding entry also passed.
- Checked emitted `dist/shared/blueprint-preview.js`: only CommonJS module metadata, no runtime imports/values. Existing main/preload/renderer/contracts/tests/scripts/manifests/config/migrations/ADRs 0001–0006 have no diff from 92531b9. An auxiliary installed compiler-API probe was unavailable; exact emitted-output assertion replaced it and passed.
- Resolved only metadata in ignored `artifacts/v2-preview-dependency-review/`, using `--package-lock-only --ignore-scripts --no-audit --no-fund`. Restricted DNS attempt failed ENOTFOUND and was stopped; authorized retry with zero retries/15s timeout succeeded. **36 non-root packages**, all registry HTTPS/integrity metadata/MIT/no declared install scripts. Scratch node_modules absent; app manifest/lockfile/node_modules unchanged. This did not fetch/execute candidate package code.
- `npm audit --omit=dev --json` on that scratch graph **exit 0, zero known vulnerabilities**. Tagged manifest/upstream advisories reviewed; exact evidence hashes and commands in [Codex report](agent-handoffs/reports/codex-v2-preview.md). Advisory metadata is not code/tarball integrity verification, a complete audit, performance proof or guarantee.
- One lighter read-only reviewer (gpt-6-luna) found no material DTO/policy/gate gaps; stale report wording was corrected. No Antigravity work is claimed. Local document links/whitespace checked before checkpoint.

Previous **66/66** baseline remains in the initial Phase A entry below. **Electron 14/14 and packaged 3/3 were not rerun for this type-only follow-up**, and no new package/V2 runtime/UI verification is claimed. Remaining technical gates: re-audit actual combined lock/integrity on Phase B install, native ESM/package loading, Windows containment/replacement tests and bounded hostile-input responsiveness. No new product-policy decision is outstanding. Handoff receipt is still unconfirmed; explicit implementation gate opening and Codex BEGIN remain required. V1 manual acceptance stays open.

## V2 Phase A — preview contract and collaboration setup, 2026-11-06

Read the attached V2 brief and current PTB/alignment/examples/domain/UX/traceability/roadmap/ADRs, reference image, actual source/security/library schema and build/tests at `9d638f2`. Tracked baseline was clean; the supplied `projectstimeline_ptb_v0.1/` package was already untracked and remains unchanged.

Fresh actual baseline: **npm test 49/49 Node** (build/both TypeScript targets), **npm run test:e2e 14/14**, **npm run test:packaged 3/3** = **66/66**. Packaged tests exercised the existing V1 executable; no new package was produced in Phase A. Isolated profiles and authorized desktop/process access; no production profile changed.

Reviewed primary maintainer Markdown/JSON/dialog/position documentation and tagged dependency manifests; candidate pins/options and tradeoffs are linked in [v2-preview-contract.md](v2-preview-contract.md). Registry “latest” endpoints were unavailable through browsing, so tagged candidates are explicitly not claimed as latest/audited/installed. No candidate dependency or transitive graph was installed or executed; resolved graph/advisory/runtime/packaging checks belong after approval.

Prepared [type-only contract](agent-handoffs/contracts/v2-preview.ts), [standalone Antigravity prompt](agent-handoffs/antigravity-v2-preview.md), [collaboration protocol](agent-handoffs/v2-collaboration.md), single-writer queue and Codex report. Independent no-emit TypeScript check passed: `node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module Node16 --moduleResolution Node16 --types node docs/agent-handoffs/contracts/v2-preview.ts`. It is outside application source, not a live API.

Two lighter read-only reviewers checked acquisition/workflow semantics and UI/state/ownership. Incorporated explicit diagnostic severity/hash rules, unclosed-fence invalid occurrences, source-anchor selection and separately attributed smaller-reviewer reports. Proposed ADR 0007 records decisions pending approval. No Antigravity session or parallel implementation was launched. A separate local review worktree/ref is prepared per coordination record; no dependencies or product changes are made there.

Phase A checks include local links and staged whitespace. Application source, existing tests, migrations 001–003, security/policy files, dependency manifests and original ADRs 0001–0006 remain unchanged. Planned V2 parser/hostile-file/preview/cancel/no-write/UI/packaged tests have **not** executed, and no Antigravity delivery/integration is claimed. Stop for contract/dependency approval, manual handoff confirmation and source-DTO readiness before Phase B.

## V1 — Home and Project Continuity, 2026-11-06

The user approved the design package with refinements and explicitly authorized **V1 only**. Inspected clean tracked source at `1ade173` (supplied PTB package already untracked), reran the baseline and presented [requirement → UI → backend plan](v1-home-plan.md) before feature edits. [ADR 0006](adr/0006-home-project-continuity.md) records actual read ordering, continuity and boundaries. Source/test checkpoint: **0c5197c**; records are separately checkpointed. No push or agents.

| Execution | Actual result |
| --- | --- |
| Pre-edit npm test | **47/47 Node passed**, including build/typechecks |
| Pre-edit npm run test:e2e | **12/12 Electron passed** |
| Pre-edit npm run test:packaged | **3/3 existing executable recovery passed** |
| Final npm test | **49/49 Node passed**, including both TypeScript targets and final build |
| Final npm run test:e2e | **14/14 passed**, including all original scenarios and the superseded-Home-navigation focus assertion |
| Final npm run package | **Passed**, Windows x64 executable rebuilt from final source |
| Final npm run test:packaged | **3/3 passed**, rebuilt executable: Home/Resume restart plus populated-v1/v2 release/workflow recovery |

**Baseline 62/62; final 66 unique checks = 49 Node + 14 Electron + 3 packaged.** Repeated focused/full executions are not counted again. Final renderer `index-BZzTd8r3.js`, styles `index-X768Ofa9.css`; executable `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe`. Tests use isolated profiles, never the regular app database. Desktop/process/runtime-cache access was authorized for Electron/packaging.

Implemented evidence:

- [Home store tests](../tests/unit/home.test.mjs): empty/legacy projects have no invented activity; actual checkpoint/action-event chronology and source/ID ties, project order and isolation; checkpoint equals existing Resume by value; one Home read does not load complete workspace histories, mutate any table/schema or alter reopen results. Schema stays **v3**.
- [Home Electron tests](../tests/e2e/home.test.mjs): default Home, create/open cards, actual saved context/timestamp, empty activity, Home/Workflows/project navigation, retained action/checkpoint/release drafts, unchanged persisted state after navigation, keyboard submission, three widths and full process restart. Controlled main summary failures withhold old cards and retry reads; a late response cannot overwrite a newly committed project's cards. A superseded Home→project read cannot steal focus from a newer workspace.
- [Packaged recovery](../tests/packaged/recovery.test.mjs) now checks Home's recovered checkpoint/time against Resume after opening the card. Both original populated-v1 and populated-v2/frozen-release recovery scenarios remain and pass. The complete existing Node/Electron policy, migrations, verification/freeze, workflow-isolation, failure, draft, navigation-race and security assertions pass.
- One new fixed read method: **31 named bridge methods**. Sender/main-frame/exact-URL checks, main startup/protocol/CSP/sandbox/Node-disabled preferences, all migrations 001–003, pure Resume/release-progress functions and dependencies/lockfile have **no diff from 1ade173**. No V2 parser, development entities, recommendation evaluator or new migration.

Review corrections: Home-versus-Resume equality originally compared SQLite's null-prototype row directly; corrected value comparison. New fixture labels were aligned to existing Workflow library/Releases headings. An early focused run hit Playwright actionability timeouts; isolated render/control inspection and subsequent focused/full runs passed without force-clicking or weakening assertions. Review caught an unconditional focus after an old navigation; returning an applied-read result now guards focus, with an explicit regression assertion. No remaining automated failure.

Visual evidence: [empty](../artifacts/home-empty.png), [800px](../artifacts/home-800.png), [1160px](../artifacts/home-1160.png), [1440px](../artifacts/home-1440.png). All three have automated no-page-overflow checks; compact/wide screenshots were inspected, including a 120-character Unicode/unbroken name. Existing project Resume/contrast/reduced-motion/max-content checks also pass. Screenshots show actual saved isolated test records, not production sample data; local artifacts remain ignored.

Changed-file review map:

| Area | Files |
| --- | --- |
| Read/typed boundary | src/main/data/database.ts; src/shared/contracts.ts; src/main/ipc.ts; src/preload/index.ts |
| Home/continuity UI | src/renderer/ProjectHome.tsx; src/renderer/App.tsx; src/renderer/ProjectSidebar.tsx; src/renderer/useProjectWorkspace.ts; src/renderer/styles.css |
| Tests | tests/unit/home.test.mjs; tests/e2e/home.test.mjs; tests/e2e/workspace.test.mjs; tests/packaged/recovery.test.mjs |
| Current records | README.md; docs/v1-home-plan.md; docs/adr/0006-home-project-continuity.md; docs/verification.md; docs/engineering-checklist.md; docs/feature-alignment.md |
| Approval/priority amendments | docs/product-architecture-alignment.md; docs/design/product-implementation-roadmap.md; docs/design/ptb-v0.2-contract.md; docs/design/development-domain-contract.md; docs/design/connected-workspace-design.md; docs/design/product-traceability.md; docs/antigravity-collaboration-prompt.md |
| External checkpoint | Authorized ProjectsTimeline - Development Log.md only; no vault scan/sync or vault Git commit |

**Manual acceptance:** use real projects to compare card checkpoint/next-step timestamps with Resume/history, including a legacy/no-event project; review card order, long text, density and keyboard focus at your compact/wide sizes; navigate Home/Workflows and back while action/checkpoint/release drafts are unsubmitted; fully restart the rebuilt executable and compare saved context plus existing confirmed releases. Unsaved drafts are session-only and must not be expected after quitting. Older manual/understanding gates remain open.

Limits: Home shows the latest recorded item per project, not a full cross-project timeline or measured work sessions. No saved goal/appearance fields, startup selection preferences or richer linked checkpoint records were added. Saved next steps are authored text; deterministic recommendations stay absent until their separate approved catalog/evaluator slice. Development percentages remain unapproved. Large-history performance, assistive-technology/high-contrast/scaling and a separate clean Windows machine were not assessed here. Rich linked continuation is prioritized immediately after V3a; **stop before V2/new migrations without explicit approval**.

## Revised PTB/domain/UX design — 2026-11-06

User approved architectural direction for further design, required complete single-file multi-entity blueprints and deferred actual delivery snapshot schema/policy. Revisited existing UI reference/tokens/components/contracts and authored [PTB v0.2](design/ptb-v0.2-contract.md), [development ownership/lifecycle](design/development-domain-contract.md), [connected UX](design/connected-workspace-design.md), [traceability](design/product-traceability.md), [dependency roadmap](design/product-implementation-roadmap.md), and [two example reviews/journeys](design/ptb-v0.2-examples.md). Revised the alignment index and Antigravity prompt; original supplied v0.1/ADRs remain unchanged. No agents were started.

Actual documentation-fixture check: inline Node/standard-library assertions completed with exit 0 for **Desk Notes: 1 file, 15 records, 29 typed links** and **FieldLedger: 4 files, 37 records, 82 typed links**. Checked IDs/prefix/common metadata, same-project typed references, component cycles, scoped stage targets, action enums/detail fields, requirement/planned-check coverage, no imported outcome/status flags, and normalized records/narrative equality after combining documents/reordering presentation. Link totals exclude project ownership/stage-key references. Read [limitations and hypothetical journeys](design/ptb-v0.2-examples.md): this known-fixture extractor is not a production Markdown parser, complete schema/security validator, actual import or running UI/restart test. Negative/error cases are specification walkthroughs and future acceptance targets, not executed feature tests.

Source/test/migration/dependency paths have no changes; no SQL, feature helper/parser, app build, installed dependency or production-data operation. Existing 62-check application result is historical and was not rerun. Document link/whitespace checks and a separate documentation checkpoint accompany handoff; no push. Concrete contracts, percentages, parsers, SQL/DTOs and manual usability remain approval gates. Stop before implementation.

## Product & Architecture Alignment — analysis only, 2026-11-06

Read PTB contract/roadmap first, nested README and all eight example documents; root/nested contract and roadmap hashes match. Reviewed actual source at `f1c8b76`, schemas 001–003, store/workflow/progress/Resume behavior, typed bridge/security, UI/hooks, test cases, roadmap and ADRs. Three lighter-model agents independently reviewed data ownership, PTB ambiguities and journeys/test dependencies. Prepared [alignment](product-architecture-alignment.md) with five unresolved decision groups and [Antigravity prompt](antigravity-collaboration-prompt.md); no Antigravity session was launched. Added planning pointers/checkpoint without changing prior accepted decisions or results.

This pass does **not** rerun the 62-check baseline, launch/repackage the app, parse PTB using an implemented validator, or validate real small/complex project packages. Example consistency is a manual source review. Checked new local document links and Git whitespace. No source, tests, migrations, dependencies, supplied PTB files or production profile changed. PTB stays untracked; proposed schema/progress/import rules await approval. Stop for review before implementation.

## Reusable Engineering Workflows — implementation and verification, 2026-11-06

The user approved all five design decisions, migration 003 and the complete implementation, clarifying the built-in's starter scope, single confirmation in the existing seventh stage, committed copies, Stages Only option and independent active-release customization. [ADR 0005](adr/0005-reusable-workflows.md) records the consequential choices. First complete duplicate → select → copy → details → independent-progress path was saved as **7263c75**, after 40 Node and 10 Electron checks passed. Completed editing and regression coverage is saved as **6b6fbed**. Documentation is checkpointed separately; no push was performed.

Fresh pre-feature baseline was **44/44** (33 Node + 9 Electron + 2 packaged), recorded in Phase A below. Final actual execution:

| Command | Actual outcome |
| --- | --- |
| npm test | **47/47 passed**, including build and both TypeScript targets |
| node --test tests/unit/*.test.mjs | **47/47 passed** again after adding cross-project copy assertions to the existing isolation scenario |
| npm run test:e2e | **12/12 passed**, actual Electron; all original scenarios retained |
| npm run package | **Passed**, final Windows x64 executable rebuilt from the completed source |
| npm run test:packaged | **3/3 passed**, executing that rebuilt executable and full restart recovery |
| Focused workflow editor Electron scenario | **1/1 passed** after a screenshot-only test adjustment to collapse the creation disclosure; regenerated final screenshots, no application-source change |

**62 unique automated checks pass: 47 Node + 12 Electron + 3 packaged.** Repeated executions above are not counted twice. Desktop/process and runtime-cache access were authorized for Electron/packaging. All final commands completed successfully; no production profile was modified. Tests use isolated temporary profiles and deliberate fault triggers.

Recorded behavior:

- [Workflow Node tests](../tests/unit/workflows.test.mjs), 14 scenarios: persistent seed/duplicate/reopen; fresh identities and independent progress in two releases plus another project; Stages Only; stale versions and invalid ownership/order; actual detail/audit copy failures with complete transactional rollback; template name/description/stage/action edits, movement/order/removal and no-op versioning; built-in API/SQL guards; master edits/removal leaving active and confirmed snapshots unchanged; local definition/order/stage changes advancing scope and staling verification; failed local writes rolling back metadata/revision/history; title-only legacy assignment preserving completion; populated-v2 migration/backup and exact frozen recovery.
- Existing [database](../tests/unit/database.test.mjs), [release](../tests/unit/releases.test.mjs), pure progress, Resume and security checks remain. Schema assertions advance to v3; later synthetic migration versions advance accordingly. Migrations **001/002**, `progress.ts`, `resume.ts`, main startup/security/protocol, package dependencies and lockfile have **no diff from pre-feature 0354346**. The unchanged progress policy already handles custom included-stage counts.
- [Workflow Electron tests](../tests/e2e/workflows.test.mjs), three scenarios: real library duplication/copy/engineering details and A/B completion isolation with Resume restart; full master and local editor paths, keyboard submission, action movement/order/removal and real aborted local write/draft retention/retry; actual failed copy plus acknowledged-copy/failed-refresh/read-only retries without duplicate releases. Unrelated unsubmitted editor drafts survive failed reads. Stale template selection cannot fall back silently to Stages Only.
- Existing Electron regressions pass, including project/action/checkpoint/Resume/restart, sender/frame/exact-URL trust, sandbox/context isolation and Node-disabled renderer, stale response supersession, protected confirmation/provenance and failure feedback. The fixed bridge whitelist now enumerates **30 named methods**, with no generic SQL/file/channel exposure.
- New [packaged workflow recovery](../tests/packaged/workflow-recovery.test.mjs): final executable upgrades a populated schema-v2 profile with backup, preserves legacy work/checkpoints, edits a duplicated master, copies two independent releases, confirms/freeze-checks A, edits/removes master definitions without altering A/B snapshots, customizes B and verifies exact library/project/provenance recovery after full restart plus FK consistency. Both original packaged recovery scenarios also pass, including populated-v1 upgrade.

Integration checks caught and corrected disabled project navigation during a superseded read, missing return-to-project view selection and stage headings replaced by edit forms. Restored navigation and semantic stage headings with contextual Stage options; preserved functional assertions. UI details now follow persisted within-stage order and metadata limits match main validation. Tests separately prove failed-write draft retention and acknowledged-write read-only recovery. Fixture corrections followed actual schema ownership/position semantics; no failing functional checks were removed.

Responsive evidence: [800px](../artifacts/workflows-800.png), [1160px](../artifacts/workflows-1160.png), [1440px](../artifacts/workflows-1440.png), plus [first release copy/details](../artifacts/workflow-first-copy.png). Actual Electron checks all three sizes without page overflow; final 800/1440 screenshots were visually inspected. Library list/editor stack at compact widths; existing project Resume layout/keyboard/error/long-content/reduced-motion checks pass. Screenshots contain isolated test records, not fabricated production data, and remain ignored local artifacts.

Changed-file review map (this milestone):

| Area | Files |
| --- | --- |
| Persistence/domain | src/main/data/migrations/003_workflow_templates.sql; src/main/data/workflows.ts; src/main/data/database.ts |
| Typed application boundary | src/shared/contracts.ts; src/main/ipc.ts; src/preload/index.ts |
| UI/state | src/renderer/WorkflowLibrary.tsx; src/renderer/useWorkflowLibrary.ts; src/renderer/ReleaseWorkspace.tsx; src/renderer/useProjectWorkspace.ts; src/renderer/App.tsx; src/renderer/ProjectSidebar.tsx; src/renderer/styles.css |
| Node tests | tests/unit/workflows.test.mjs; tests/unit/database.test.mjs; tests/unit/releases.test.mjs |
| Electron tests | tests/e2e/workflows.test.mjs; tests/e2e/workspace.test.mjs; tests/e2e/progress.test.mjs; tests/e2e/visual-foundation.test.mjs |
| Packaged tests | tests/packaged/workflow-recovery.test.mjs; tests/packaged/progress-recovery.test.mjs |
| Engineering records | README.md; docs/workflow-library-plan.md; docs/adr/0005-reusable-workflows.md; docs/engineering-checklist.md; docs/feature-alignment.md; docs/verification.md |
| External checkpoint | Authorized ProjectsTimeline - Development Log.md only; no vault scan/sync or vault Git changes |

**Manual acceptance remaining:** review the eight starter actions for your engineering context; duplicate/edit a real workflow and inspect title-first/detail-editor density at your preferred window sizes; use keyboard navigation through library and project controls; apply to two real releases, compare independent progress and unchanged copies after master edits; edit active scope and observe stale evidence, then record genuine verification, confirm, restart and compare frozen history and Resume. Review migration/copy/versioning/security code as desired. Automated results do not complete earlier manual or understanding gates.

Limits: user template versions are increasing edit counters, not a complete revision archive; captured release definitions/source identity remain independent. Template archive/delete, existing-release apply/merge, import/export, automatic synchronization, AI and conditional rules are outside this slice. Ordinary tracked release work is excluded with a reason rather than deleted. Manual verification is a user-recorded assessment, not independently authenticated artifact provenance. No separate clean Windows installation, screen-reader/high-contrast/scaling audit, power-loss repair or large-library benchmark was performed. No unresolved automated failures. Stop before the next milestone; a possible next proposal after acceptance is Engineering Decisions/Evidence, requiring its own approved scope.

## Reusable Engineering Workflows — Phase A inspection, 2026-11-06

Inspected actual schema 001/002, store creation/mutation/query paths, pure policy, all 13 fixed bridge methods, existing sidebar/project/release UI, current tests/packaging and engineering records. Started with a clean working tree at a8620fa. Local main is three commits ahead of its recorded origin/main reference; no fetch/push or claim of remote synchronization. Current policy already supports variable included-stage counts; current release creation hardcodes seven definitions, and actions have no rich checklist details or template provenance.

Fresh actual baseline, before any feature changes:

| Command | Result |
| --- | --- |
| npm test | **33/33 passed**, including build and both TypeScript targets |
| npm run test:e2e | **9/9 passed**, real Electron with authorized desktop/process access |
| npm run test:packaged | **2/2 passed**, existing packaged executable: recovery plus populated-v1 upgrade/provenance restart |

Total **44/44** rerun successfully. No new package was produced for this design-only pass; existing packaged behavior was executed, not inferred. No workflow behavior has been implemented or verified. Previous user manual acceptance results are not inferred from this baseline.

Prepared [Phase A proposal](workflow-library-plan.md): four tables and nullable release origin fields; master-version values captured without live child links; app-managed protected closing stage; new detail-table freeze guards; atomic copy with actual audit events; reviewed candidate starter content; UI/acceptance plan and five decisions. Reviewed primary [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html) and [foreign-key](https://www.sqlite.org/foreignkeys.html) guidance. No SQL migration, source/bridge/UI/test/dependency changes or production-profile edits. Only planning/checklist/roadmap/ADR-pointer/verification and the authorized concise Obsidian note changed. Stop for the user's requested approval before Phase B.

## Development Stages & Progress implementation — 2026-11-06

The user changed the ownership agreement and authorized AI implementation of the approved policy/integrations. Inspected the contract before coding: superseded its personal-coding gate, distinguished no selected release from invalid configuration, retained included-empty/null behavior, and kept confirmation provenance outside arithmetic. Explained release membership as commitment, one-release action ownership, manual revision-bound evidence and frozen confirmation before implementation. [ADR 0004](adr/0004-release-progress.md) records these choices and future correction/withdrawal/versioning limits. Earlier entries below are historical, including their then-current ownership restrictions.

Fresh pre-edit baseline: **17 Node + 7 Electron + 1 packaged = 25/25 passed**, including build/typechecks. The sandbox prevented Electron launch; rerunning with desktop/process access passed. Final results:

| Command | Actual outcome |
| --- | --- |
| npm test | **33/33 passed**, including build and both TypeScript targets |
| npm run test:e2e | **9/9 passed**, retaining all seven original scenarios plus two release/UI/error/restart scenarios |
| npm run package | **Passed**, final Windows x64 executable rebuilt after the final renderer change |
| npm run test:packaged | **2/2 passed**, original recovery plus populated-v1 upgrade and confirmed-release/provenance recovery after full restart |

**44/44 final automated checks pass.** Initial packaging fetch failed inside the sandbox; the authorized runtime-cache/download rerun succeeded. One fixture comparison initially failed because SQLite rows have null prototypes; corrected value comparisons without changing production serialization. Review caught an impossible 100%-before-confirmation UI gate and generic controls on the protected action. Screenshot inspection then caught a hidden confirmation row despite its counted obligation; restored its explicit read-only row and strengthened the UI assertion to require its presence, then rebuilt/reverified. Lighter-model agents implemented isolated policy/UI/tests and reviewed the backend; the primary agent integrated and checked the final result.

Evidence:

- [Pure policy tests](../tests/unit/progress.test.mjs): equal included-stage weights, custom averaging set/exclusions, eligibility, overlap/current order, empty/unassigned null scope, protected completion, recalculation, frozen-input purity and invalid graphs. No DB/clock/React dependency in policy.
- [Release integration](../tests/unit/releases.test.mjs): original IDs/text/exact timestamps and checkpoint context survive v1→v2 with a readable backup and no fabricated release/history; FK checks; same-project/composite ownership; unique/protected gate; failed/stale/wrong-release/older-pass evidence rejected; null committed-Unassigned scope; confirmed A unchanged during B; invalid commands and actual audit/confirmation-trigger failures roll back state/revision/history. Repeat completion adds no timestamp/event/revision.
- [Original store tests](../tests/unit/database.test.mjs) retain lock/error/newer-schema/refusal/backup/multi-migration rollback assertions with versions extended for 002. Shipped 001, main startup/security/protocol, dependencies and lockfile have no diff.
- [Release Electron scenarios](../tests/e2e/progress.test.mjs): actual UI create/select/commit/complete and manual-record/confirm flow; protected action has no generic buttons; real aborted verification write retains form draft and later succeeds once; committed release save followed by failed read hides progress, clears acknowledged draft and retries read-only; full restart preserves provenance and project Resume.
- Existing Resume, project/action/checkpoint, sender/runtime, stale-response, error, keyboard/contrast/motion/max-content and three-window scenarios still pass. All 13 bridge methods are explicitly enumerated; sandbox/contextIsolation/Node-disabled settings remain asserted.
- [Packaged progress recovery](../tests/packaged/progress-recovery.test.mjs): actual final executable upgrades a populated v1 profile, preserves legacy completion/checkpoints as Unassigned with empty invented-history/release sets, backs up, then persists confirmed stages/provenance and recovers the exact snapshot after restart. Existing packaged recovery is retained.

Inspected new [800px](../artifacts/progress-800.png) and [1440px](../artifacts/progress-1440.png) screenshots; automated layout checks also cover [1160px](../artifacts/progress-1160.png), all without horizontal overflow. Resume stays first when compact and beside the working column when wide. [Full confirmed-stage view](../artifacts/progress-confirmed.png) is a real isolated test profile, not production sample data. Screenshots are ignored local artifacts.

Changed-file review map:

| Area | Files |
| --- | --- |
| Pure policy | src/main/progress.ts |
| Persistence | src/main/data/database.ts; src/main/data/migrations/002_release_progress.sql |
| Typed/security boundary | src/shared/contracts.ts; src/main/ipc.ts; src/preload/index.ts |
| Existing workspace UI/state | src/renderer/App.tsx; src/renderer/ReleaseWorkspace.tsx; src/renderer/useProjectWorkspace.ts; src/renderer/styles.css |
| Tests | tests/unit/progress.test.mjs; tests/unit/releases.test.mjs; tests/unit/database.test.mjs; tests/e2e/progress.test.mjs; tests/e2e/workspace.test.mjs; tests/packaged/progress-recovery.test.mjs |
| Current agreement/records | README.md; docs/foundation-plan.md; docs/engineering-checklist.md; docs/feature-alignment.md; docs/progress-policy-contract.md; docs/stages-progress-design.md; docs/verification.md; docs/adr/0001-foundation.md; docs/adr/0002-resume-workspace.md; docs/adr/0003-visual-foundation.md; docs/adr/0004-release-progress.md |
| External checkpoint | Authorized ProjectsTimeline - Development Log.md in the ProjectsTimeline Notes vault; no vault scan/sync or vault Git changes |

**Manual acceptance pending:** use your actual project/backlog; review stage scope/exclusion reasons and equal weights; complete later-stage work early, reopen/reassign and observe recalculation/null Unassigned state; record an actual artifact/evidence check, change scope and see staleness, reverify/confirm/restart; begin another release and compare the first; review compact density, keyboard and preserved Resume/checkpoints. Review source/security/migration decisions line by line. Earlier Visual/Resume manual gates stay open.

Local source/test checkpoint: **7d2ea2e**. Ownership/roadmap/checklist/evidence documentation is checkpointed separately; no push this turn. A final whitespace-only EOF cleanup does not change the tested renderer behavior. The persisted-stage-order assertion was strengthened to choose a different unfinished stage, and all 33 Node checks reran successfully. Local document links and final staged whitespace checks pass.

Limits: manual provenance is a user-recorded assessment, not authenticated external evidence or automatically executed testing. No full stage CRUD/templates, requirement/check runner, automated publishing, cross-release action sharing, confirmed-release correction/withdrawal or per-action checkpoint links. No separate clean Windows machine, power-loss/corruption-repair, screen-reader/high-contrast/scaling audit or large-history benchmark. Confirmed formula compatibility is versioned for future review; current version is 1. Stop before the next milestone.

## Progress calculation contract review — 2026-11-06

Repository started clean at bac15e9; local main matched its recorded origin/main tracking reference (no network fetch performed). Reviewed current action/project/checkpoint contracts, domain error handling, schema v1 and Resume tests. A lighter-model agent provided an independent read-only review of contract boundaries and essential cases; no agent wrote implementation.

The user selected release scope, applicable committed checklist actions, equal included-stage weights, protected final confirmation and visible legacy Unassigned backlog. The follow-up empty-stage decision is **withhold overall percentage until scope is resolved**. Prepared [contract/invariants and seven essential policy test groups](progress-policy-contract.md), separating main-side ownership/confirmation validation from pure arithmetic. These are proposed specifications, not executable/passing tests. The core remains user-written; integration is pending approval of their calculation design and availability of their implementation.

Documentation/checkpoint changes only; no source, migration, bridge, dependency or executable test changes. Local document links and git diff --check passed; reviewed eligibility under excluded stages and retained inapplicable records' original links. Application tests were not rerun; last actual result remains the recorded 25/25 below. Manual acceptance remains pending unless the user records it separately.

## Development Stages & Progress planning — 2026-11-06

Planning only. Inspected current UI/query ownership, schema v1, migration runner, action/checkpoint contracts and previous records. The [decision brief](stages-progress-design.md) restores the user's seven original stages/equal weights, compares three scope models and proposes invariants plus **21 black-box acceptance scenarios**. Those scenarios are not executable tests or verified application behavior. Data model, counting unit, empty/custom stage rules and confirmation/evidence boundaries remain approval-gated; the user personally designs/writes the core policy.

Reviewed primary [SQLite foreign-key](https://www.sqlite.org/foreignkeys.html) and [schema-change](https://www.sqlite.org/lang_altertable.html) guidance for nullable/composite relationships and reconstruction/transaction implications. No migration was written or run. Legacy IDs/completion times/checkpoints must be preserved, with no fabricated release commitments/history. Existing Resume remains project-scoped.

The user requested Git checkpoints and in-app action/checkpoint history. Local commit **78a7758** preserves the already verified Resume/Visual Foundation source, tests and documentation; no push. App history is a design proposal, not newly implemented functionality. This pass changes documentation only; **application tests were not rerun**. Last actual result remains **25/25 passing** (17 Node + 7 Electron + 1 packaged) below, with user manual acceptance/ownership checks still pending. Reviewed the documentation diff for consistency; git diff --check passed, and no application/test/dependency changes are present. This planning pass is a separate documentation checkpoint.

## Visual Foundation implementation — 2026-11-06

The user approved the graphite/violet palette, layout, typography and incremental scope before application edits. Fresh baseline: **17 Node + 5 Electron + 1 packaged = 23/23 passed**, including build/typechecks, before changes.

| Final command | Actual outcome |
| --- | --- |
| `npm test` | **17/17 passed**; build and both TypeScript targets passed |
| `npm run test:e2e` | **7/7 passed**, retaining the five existing scenarios and adding two visual/keyboard/long-content scenarios |
| `npm run package` | **Passed**, final Windows x64 executable rebuilt |
| `npm run test:packaged` | **1/1 passed**, real saved project/action/Resume recovered after a full packaged restart |

Final automated total: **25/25 passed**. Native Electron/Node versions and dependencies are unchanged. Eleven files covering the state owner, Resume policy, domain/SQLite/migration, contracts, preload/IPC/security and package manifests match SHA-256 hashes captured before visual edits. The only main-process diff is BrowserWindow backgroundColor; security preferences and native controls remain intact.

New evidence in [visual-foundation.test.mjs](../tests/e2e/visual-foundation.test.mjs):

- Actual keyboard skip-to-main, project creation/open, checkpoint entry/save, Resume focus action, action addition and completion. Skip navigation preserves the exact trusted app URL. Focus indication is visible; controls are native and labelled.
- Outer window sizes **800, 1160 and 1440px**, with no horizontal overflow. One Resume region exists: above Actions on compact windows and beside the working column on wide windows. Compact Resume starts in the first viewport. Sizes refer to the outer native window; screenshot content widths exclude native framing/scrollbars.
- Sampled rendered body/metadata/label/selected-project/action colors and primary hover state meet the tested 4.5:1 text-contrast threshold. Reduced-motion mode has no running feedback animations after the render turn. This is not a full accessibility certification.
- Maximum-length 120-character Unicode project name, 300-character action and 10,000-character checkpoint fields persist/render without page overflow. Focus still reaches the existing action form; long text wraps in full and may make the document tall.
- Existing real aborted-write and committed-save/failed-refresh scenarios still pass and now capture their dark error/warning states. Draft retention, stale Resume withholding, read-only retries and late-response protection are unchanged.

Inspected captures from isolated verification profiles, populated through real application operations, not production mock data:

- Layouts: [800px](../artifacts/visual-800.png), [1160px](../artifacts/visual-1160.png), [1440px](../artifacts/visual-1440.png).
- States: [empty workspace](../artifacts/visual-empty-workspace.png), [empty project/Resume](../artifacts/visual-empty-project.png), [keyboard focus](../artifacts/visual-keyboard-focus.png), [failed write](../artifacts/visual-write-error.png), [saved but stale](../artifacts/visual-refresh-warning.png), [long content](../artifacts/visual-long-content.png).
- Final rebuilt [packaged workspace](../artifacts/packaged-workspace.png). Captures are ignored local artifacts, not source fixtures shipped to users.

Review map: [tokens](../src/renderer/tokens.css), [styles](../src/renderer/styles.css), [ProjectSidebar](../src/renderer/ProjectSidebar.tsx), [WorkspaceHeader](../src/renderer/WorkspaceHeader.tsx), [Panel](../src/renderer/Panel.tsx), [App](../src/renderer/App.tsx), [ResumePanel](../src/renderer/ResumePanel.tsx) and the cosmetic [window background](../src/main/index.ts). [ADR 0003](adr/0003-visual-foundation.md) records boundaries and tradeoffs.

Inspection fixes: primary hover was adjusted to retain readable white text; the Resume accent border was protected from a base-style override; selected-row hover keeps selection identity. A transformed offscreen skip link leaked into full-page scrolled captures, so its hidden state now uses clipping while remaining keyboard reachable; captures regenerated and all seven Electron scenarios passed again.

**User acceptance pending:** review spacing/type/density, actual keyboard focus/order and Resume prominence on your display, then exercise create/open/add/complete/save/navigate/restart with your own project data. Prior manual Resume and line-by-line review gates remain open. A screen reader, OS high-contrast mode, alternate display scaling and a separate clean Windows machine were not tested. No stages/progress, unsupported navigation, preference system or release features were implemented. Stop for acceptance before the next milestone.

## Visual Foundation planning — 2026-11-06

Inspected the supplied reference, current renderer/components/state owner/CSS and latest Resume screenshot. Preserved the [reference](design/ui-reference.png) and prepared an [approval-gated design plan](visual-foundation-plan.md) plus a palette/layout study. Application code, tests, dependencies and SQLite were not changed in this planning turn; application tests were not rerun. The prior 23/23 Resume result below remains the recorded baseline, not new visual verification.

Calculated candidate contrast ratios: text/panel 14.20:1, secondary/panel 7.53:1, accent/panel 6.74:1, white/primary action 5.23:1 and control outline/input 3.64:1. These arithmetic checks do not establish rendered accessibility or approve the design. Keyboard, states, widths, long content, reduced motion and actual regression/package checks are planned after user approval.

## Resume Development — 2026-11-05–06

Before implementation, reran the existing baseline and reported actual results: `npm test` **12/12**, `npm run test:e2e` **2/2**, and `npm run test:packaged` **1/1** passed. Build and TypeScript checks passed before application edits.

| Final command | Actual outcome |
| --- | --- |
| `npm test` | **17/17 passed**, including build/typechecks, four selector tests, new real-file Resume integration and all original checks |
| `npm run test:e2e` | **5/5 passed**, retaining original scenarios and adding three Resume/failure/race scenarios |
| `npm run package` | **Passed**, Windows x64 executable rebuilt with this slice |
| `npm run test:packaged` | **1/1 passed**, actual Resume text and stored timestamp recovered after full packaged restart |
| `git -c core.autocrlf=false diff --check` | Passed for tracked changes |

Final automated total: **23/23 passed**. Runtime remains Electron 45.2.3 / embedded Node 24.22.2. Dependencies, schema v1, migration 001 and the six named IPC channels are unchanged.

Evidence added/extended:

- [Selector unit tests](../tests/unit/resume.test.mjs): empty input, unordered timestamps, descending numeric ID tie-break, original text/time and input preservation.
- [Database integration](../tests/unit/database.test.mjs): project-scoped null/latest Resume, tie order, no schema bump, and identical context after real file close/reopen. Existing data/constraints/backup/rollback/failure tests still pass.
- [Resume Electron tests](../tests/e2e/resume.test.mjs): honest empty state and working focus controls; saved multiline text/time; no context leakage on navigation; full process restart; committed write followed by forced query failure and a second failed read-only retry; submitted checkpoint draft cleared while an unrelated action draft stays; stale Resume withheld; eventual read-only recovery produces exactly one new checkpoint; late successful and failed older reads cannot replace the newer project or its state.
- [Original Electron flow](../tests/e2e/workspace.test.mjs) retains project/action/history/security assertions. The real aborted-write case now also checks that the earlier confirmed Resume stays unchanged, both failed draft fields survive, and a later explicit retry updates Resume once.
- [Packaged recovery](../tests/packaged/recovery.test.mjs) retains original saved project/completion/history assertions and verifies Resume accomplishment/next steps plus exact timestamp equality with checkpoint history after restart.
- Inspected [Resume normal](../artifacts/resume-workspace.png) and [compact](../artifacts/resume-compact.png) screenshots; compact window has no horizontal overflow. Only the panel, status/retry feedback and existing screen integration changed visually.

The first two fault-injection checks initially failed because Playwright's main evaluation context has no global require. Corrected the isolated test harness to use Node's builtin module loader; final checks above pass. Fault injection modifies only an isolated test process, not production interfaces or database files used by the user.

Implementation review map: [selector](../src/main/resume.ts), [query integration](../src/main/data/database.ts), [contract](../src/shared/contracts.ts), [state owner](../src/renderer/useProjectWorkspace.ts), [panel](../src/renderer/ResumePanel.tsx), [App integration](../src/renderer/App.tsx), [styles](../src/renderer/styles.css). Test changes are linked above. See [ADR 0002](adr/0002-resume-workspace.md) for the accepted behavior/tradeoff.

**Manual acceptance remains pending:** user performs save → navigate → fully quit → reopen → select → compare Resume, and reviews selector, query/state/error handling. Automated results do not complete that ownership gate. No separate clean-machine run, power-loss test or full accessibility audit was performed. The reference image was unavailable during Resume verification; it was subsequently received/compared in the planning entry above. The stage-progress policy remains reserved for the user and is not implemented.

## Original milestone 1 evidence

Date: 2026-11-05. Windows x64. Development Node 24.21.0 / npm 11.19.0; observed Electron 45.2.3 with bundled Node 24.22.2. Exact packages are pinned in package.json and package-lock.json.

| Command | Observed result |
| --- | --- |
| `npm test` | **12/12 passed.** Includes TypeScript checks and Vite build. |
| `npm run test:e2e` | **2/2 passed**, including a fresh, initially nonexistent profile directory. |
| `npm run package` | **Passed.** Windows x64 executable folder created with ASAR-bundled app. |
| `npm run test:packaged` | **1/1 passed.** Packaged executable launched, saved data, fully closed, relaunched and recovered it. |

These are automated results, not the user's manual acceptance or line-by-line review.

Before the initial application commit, all four commands above were rerun successfully (15 automated checks). The exact committed source snapshot `dcb09a7` was also exported with `git archive` and built in an isolated folder, reusing the existing pinned dependencies and generating fresh build output.

## Evidence covered

- [Database tests](../tests/unit/database.test.mjs): real-file close/reopen; project isolation; immutable completion timestamp on repeat; checkpoint history and timestamp ties; invalid input/missing IDs/cross-project completion rejection; literal SQL-like input; database CHECK/FK constraints.
- Write failures: an actual SQLite lock fails without inserting an action and allows a later retry; an aborting database trigger leaves checkpoint rows unchanged.
- Migrations: schema v1 creation and repeat startup; readable pre-upgrade backup with original data; failed multi-migration batch restores both schema and version; backup failure prevents changes; successful upgrade; refusal of newer schemas, unversioned populated schemas and invalid database files without resetting them.
- [Rule/boundary tests](../tests/unit/domain.test.mjs), [security checks](../tests/unit/security.test.mjs): bounded/required text, valid numeric IDs, payload keys, renderer asset allowlist, sender/frame/document matching, and safe error results.
- [Electron flow](../tests/e2e/workspace.test.mjs): projects A/B, two actions, one completion, three checkpoints, full process restart and exact action recovery; all checkpoint history remains visible and project contents remain separate.
- Runtime preferences observed: context isolation and sandbox enabled, Node integration disabled. Renderer `require` and `process` are unavailable; exactly six named bridge methods are exposed. Stored markup stays text, new windows are denied, and there were no renderer exceptions in the recovery flow.
- UI failure/retry: a real checkpoint INSERT failure shows an error, retains both form values, and inserts nothing; removing the failure and retrying saves exactly one checkpoint and clears the form.
- [Packaged test](../tests/packaged/recovery.test.mjs): `app.isPackaged` is true; bundled `node:sqlite` opens/writes/reopens a real file; project, completion and checkpoint text recover after relaunch; renderer uses `app:` rather than a Vite server.
- Screenshots inspected at 1160px and 800px outer window widths; no horizontal overflow at the compact width. Preview: [packaged app](../artifacts/packaged-workspace.png), [normal](../artifacts/workspace.png), [compact](../artifacts/workspace-compact.png). Screenshots are local ignored artifacts, not committed source.

## Fixes found during verification

TypeScript's side-effect CSS import needed Vite client declarations. Test cleanup initially ran before database connection close; resource cleanup ordering is now explicit. Electron's binary was downloaded separately using its installer. A first-run profile directory is now created before `app.setPath`; Electron documents that requirement in its [path API](https://www.electronjs.org/docs/latest/api/app#appsetpathname-path).

## Remaining user checks and limits

- **Pending:** user reads persistence/migrations, state changes, error handling and security code line by line; user manually performs the restart checklist in README.md and records their result.
- **Pending:** user explains one save's path and traces a controlled failure. Automated testing does not establish the user's understanding.
- Packaged tests ran on this development computer with isolated profiles. No separate clean Windows machine or actual removal of system Node was tested. Tests required desktop/process access outside the command sandbox.
- Power-loss durability, corrupted-file repair, backup restore UI, multiple-platform installers, signing and updates are outside this slice. Automated boundary checks are not a comprehensive security audit.
- `node:sqlite` is an RC API in Node 24; SQLite calls are synchronous on main. Playwright Electron automation is experimental. See the accepted [ADR](adr/0001-foundation.md) for these tradeoffs.

Version control uses local branch `main`, with application and engineering documentation recorded separately. No remote is configured and nothing has been pushed. Ignore rules cover dependencies, generated builds, downloads, screenshots, test reports, local databases/backups, environment files and private signing keys while preserving example environment templates and the dependency lockfile. Candidate files were checked for obvious credential patterns; none were found. User code review and manual acceptance remain pending.
