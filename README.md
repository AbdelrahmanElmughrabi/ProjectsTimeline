# ProjectsTimeline

A Windows-first desktop workspace for project actions and development checkpoints. Milestone 1 supports creating/opening projects, adding/completing actions, explicit checkpoint saves, and recovering committed state after a full restart.

Resume Development now displays the latest saved accomplishment, next steps and timestamp, with no inferred action/stage context. The product direction is project memory, reusable engineering workflows, evidence and verified releases; see the [full roadmap](docs/feature-alignment.md), including future release preparation/publication/final verification.

The approved Visual Foundation adds graphite/violet surfaces, reusable color/type/spacing/layout tokens and presentational sidebar/header/panels. Resume is beside the working column on wide windows and first above Actions on compact windows. Existing data/state/security boundaries are preserved; future views and stage-progress logic are not implemented. See [visual verification and screenshots](docs/verification.md) and [ADR 0003](docs/adr/0003-visual-foundation.md).

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

For this slice, start with [ADR 0002](docs/adr/0002-resume-workspace.md), `src/main/resume.ts`, `src/renderer/useProjectWorkspace.ts` and `src/renderer/ResumePanel.tsx`. The stage-progress algorithm remains reserved for your personal implementation in its later milestone.

Line-by-line review priorities:

1. `src/main/data/database.ts` and `data/migrations/001_initial.sql`: constraints, migrations/backup/rollback, completion, and commit results.
2. `src/main/domain.ts`: runtime validation and safe error results.
3. `src/main/ipc.ts`, `security.ts`, and `index.ts`: trusted IPC sender, allowed assets, sandbox and data location.
4. `src/renderer/App.tsx`: acknowledged state changes and failure/input retention.

Your manual acceptance check: create a project and two actions, complete one, save a checkpoint, fully close the app, reopen it, select the project, and compare the saved state. Record your result in the checklist; automated checks do not stand in for your review or understanding.

Also check Resume: confirm both saved fields and its timestamp, switch to an empty project and see an honest empty state, then restart and verify the first project's context. The panel's controls focus the existing action/checkpoint forms; they do not restore an external editor/session.

No installer/signing/updates, cloud, Obsidian sync, editing/deletion/reopening, workflow engine, or AI features are included. SQLite calls are synchronous and kept small; move them off main if measured UI blocking warrants it. `node:sqlite` remains an RC API in Node 24, and Playwright's Electron support is experimental.
