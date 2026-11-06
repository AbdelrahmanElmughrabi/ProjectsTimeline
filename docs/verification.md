# ProjectsTimeline — Verification record

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
