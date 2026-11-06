# ProjectsTimeline

A Windows-first desktop workspace for project actions and development checkpoints. Milestone 1 supports creating/opening projects, adding/completing actions, explicit checkpoint saves, and recovering committed state after a full restart.

Resume Development now displays the latest saved accomplishment, next steps and timestamp, with no inferred action/stage context. The product direction is project memory, reusable engineering workflows, evidence and verified releases; see the [full roadmap](docs/feature-alignment.md), including future release preparation/publication/final verification.

The Visual Foundation uses graphite/violet tokens and reusable sidebar/header/panels. Resume stays beside the working column on wide windows and first on compact windows. Development Stages & Progress now adds real release selection, the original seven stages, equal-weight readiness, reasoned exclusions, Unassigned scope review, action audit history and manual verification/protected confirmation. [Verification/screenshots](docs/verification.md) and [ADR 0004](docs/adr/0004-release-progress.md) record decisions and limits.

Reusable Engineering Workflows adds a persisted Workflow Library: duplicate the read-only seven-stage template, or create an empty user template, then edit its name, description, stages and checklist actions. Quick-add needs only a title; optional engineering details cover instructions, applicability, definition of done, evidence guidance and type. The built-in's eight ordinary actions are a starter foundation, not a complete engineering checklist. [ADR 0005](docs/adr/0005-reusable-workflows.md) records the copy/versioning model.

Choose a template when creating a release to commit independent copies of its stages and actions, with the source name/version captured. Later master edits do not change those copies. Active releases support their own action details/order and stage add/rename/order; tracked work uses reasoned exclusions rather than deletion. Exactly one app-managed confirmation stays in the closing stage, the original seventh stage for the default workflow. Stages Only remains available; confirmed releases stay frozen.

## Run and verify

Use Node 24.15+ within the Node 24 release line, and npm. Exact dependencies are recorded in package-lock.json. Electron supplies its own Node runtime when running the desktop app.

```powershell
npm ci
npm start
```

`npm start` typechecks/builds, then launches Electron with the built local renderer. There is no development server dependency or hot reload in this first slice; restart after source changes. The first Electron launch may download its runtime binary.

```powershell
npm test               # Build/typecheck + Node rule, persistence, migration and boundary tests
npm run test:e2e       # Build + real Electron UI/restart/failure tests
npm run package       # Build + Windows executable folder under out/
npm run test:packaged  # Verify the previously packaged executable and restart recovery
```

Playwright uses Electron's bundled Chromium; no separate browser installation is needed. Tests use temporary profiles and do not write to your regular workspace data. Screenshots go to ignored `artifacts/`. Packaging targets the host architecture; the packaged test defaults to `out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe`. For another build location, set `PROJECTS_TIMELINE_EXECUTABLE` to its full executable path.

## How a save works

React calls a named `window.workspace` method. The sandboxed preload forwards it over one fixed IPC channel. Main checks the sender/frame and validates the input, then executes a parameterized SQLite statement. Only a successful database acknowledgement produces a saved UI state. Failure retains the form text for retry.

One workspace hook re-queries SQLite after acknowledged changes. Resume and history share that query's snapshot. If a write succeeds but refresh fails, the submitted draft clears, the UI says Saved, but could not refresh, and stale Resume is withheld. Retry loading performs reads only, including repeated failures; it never repeats the save. Older project responses cannot overwrite a newer selection.

Default database: `%APPDATA%/ProjectsTimeline/data/workspace.sqlite`. Both development and packaged builds intentionally use this stable location. The database is local and unencrypted. Unsaved form text is not recovered after quitting. Switching projects opens the saved state and clears action/checkpoint drafts.

For isolated troubleshooting, launch with an absolute profile directory, for example:

```powershell
.\node_modules\.bin\electron.cmd . --data-dir=C:\Temp\ProjectsTimeline-sandbox
```

Main creates the profile directory if needed. Do not point a test profile at data you want to keep separate. Do not rename/delete your database to recover from an error without first preserving it.

## Review before extending

Read [the approved foundation](docs/foundation-plan.md), [decisions](docs/adr/0001-foundation.md), [verification evidence](docs/verification.md), and the [engineering checklist](docs/engineering-checklist.md).

Start with [ADR 0004](docs/adr/0004-release-progress.md), [ADR 0005](docs/adr/0005-reusable-workflows.md), [policy contract](docs/progress-policy-contract.md), `src/main/progress.ts`, `src/main/data/database.ts`, `src/main/data/workflows.ts` and the release/library screens. The user authorized AI implementation; review/understanding and manual acceptance remain user-owned. Resume behavior is retained under ADR 0002.

Line-by-line review priorities:

1. `src/main/data/database.ts` and `data/migrations/001_initial.sql`: constraints, migrations/backup/rollback, completion, and commit results.
2. `src/main/domain.ts`: runtime validation and safe error results.
3. `src/main/ipc.ts`, `security.ts`, and `index.ts`: trusted IPC sender, allowed assets, sandbox and data location.
4. `src/renderer/App.tsx`: acknowledged state changes and failure/input retention.

Your manual acceptance check: create a project and two actions, complete one, save a checkpoint, fully close the app, reopen it, select the project, and compare the saved state. Record your result in the checklist; automated checks do not stand in for your review or understanding.

Also check Resume: confirm both saved fields and its timestamp, switch to an empty project and see an honest empty state, then restart and verify the first project's context. The panel's controls focus the existing action/checkpoint forms; they do not restore an external editor/session.

Also review the stage flow: add a suggestion to backlog, create/select a release, explicitly commit/assign work, resolve empty or Unassigned scope, complete/reopen/exclude work, record actual manual verification and evidence for the current revision, then confirm and restart. Confirmed scope is frozen; a new release does not change it. Existing data upgrades to schema v3 with a backup; legacy IDs, completion, journals and release history are preserved, with unspecified template origins/details and no invented history. Manual records do not independently authenticate artifacts or execute tests.

For workflow acceptance: duplicate/customize a template, apply it to two releases, complete work in one and compare the other. Edit the master and confirm both existing releases retain their copied definitions and source version. Edit an active release, verify older evidence becomes stale, then fully restart the packaged app and compare library, release and Resume state. Check compact layouts and keyboard use with your real content. Current automated result: **47 Node + 12 Electron + 3 packaged = 62/62 passed**; user acceptance remains pending.

No installer/signing/updates, cloud, Obsidian sync, standalone backlog-title editing, template archive/delete, workflow import/export/sync, automated publishing or AI features are included. Template versions are edit counters with captured release snapshots, not a full master revision archive. Confirmed-release correction/withdrawal is deferred. SQLite calls remain short and synchronous; move them off main if measured UI blocking warrants it. `node:sqlite` remains an RC API in Node 24, and Playwright Electron automation is experimental.
