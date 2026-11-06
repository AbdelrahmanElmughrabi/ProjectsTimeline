# ProjectsTimeline — Verification record

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
