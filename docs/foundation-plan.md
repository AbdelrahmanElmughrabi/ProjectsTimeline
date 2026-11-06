# ProjectsTimeline — Foundation proposal

Status: **Approved for implementation, including `node:sqlite`.** Updated: 2026-11-05.
The user approved stack/scope, behavior and AI implementation with user review, then accepted the `node:sqlite` recommendation and instructed implementation to proceed. This proposal is retained as design context; accepted decisions are recorded in [ADR 0001](adr/0001-foundation.md).

## Starting point and scope

The workspace was empty and was not a Git repository. Node v24.21.0, npm 11.19.0, and Git 2.55.0.windows.5 are available. No existing application, dependencies, tests, or repository guidance were found.

Milestone 1: create a project → add an action → complete it → save accomplished/next-step text → fully quit → restart → select the project and recover committed data.

Exclude AI, cloud/authentication, Knowledge Atlas integration, automatic Obsidian parsing/sync, workflow generation, full releases/testing dashboards, and complete template/stage/decision systems. Keep the seven-stage default workflow for a later milestone; this slice has no stage engine. Future features can add tables through migrations without adding placeholder systems now.

## Proposed decisions and tradeoffs

- **Windows first; Electron + React + TypeScript + Vite.** Electron fits the proposed web technology approach and desktop storage access, at the cost of a bundled browser/runtime and multiple process boundaries. React is reasonable for the expected growing UI, though it adds tooling to this small form-based slice. TypeScript documents contracts; runtime validation is still required. Vite builds the renderer; main and preload remain separate build targets. Confirm supported package versions before installation.
- **SQLite with direct SQL; prefer built-in `node:sqlite`, conditionally.** SQLite provides relational constraints and transactions without a separate database service. Node 24 documents its SQLite API as release candidate (Stability 1.2), and `DatabaseSync` is synchronous. Accept this only after proving availability in the selected Electron runtime and packaged app. Keep operations short; move database work off main if measured blocking warrants it. [Node 24 documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)
- **Alternative: `better-sqlite3`.** Choose this if you prefer its established binding over the built-in API's RC status. It adds a native dependency and packaging compatibility checks; Electron documents native rebuild requirements and Forge's rebuild support. Do not silently substitute it if the built-in option fails. [Electron native modules](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules)
- **Electron Forge for packaging.** Its package step produces an executable bundle in a folder; its make step produces distributables. Test the executable folder early, without requiring a Vite development server or a system Node installation at runtime. Installer, signing, and updates are separate later decisions. Forge is a proposed additional development dependency for packaging. [Forge CLI](https://www.electronforge.io/cli)
- **Node test runner plus Playwright.** Use the former for rules and real temporary-file database tests; use Playwright for the restart/reopen flow. Electron support in Playwright is experimental, so retain the user's manual packaged-app check. [Playwright Electron](https://playwright.dev/docs/api/class-electron)

No ORM, UI framework, global state library, generic repository layer, or dependency injection framework is proposed. Explain any additional dependency before installing it.

## Boundaries and one write's data flow

`renderer/` (React forms and view state) → `preload/` (named, typed bridge functions) → `main/` (IPC handlers and application operations) → `main/data/` (SQLite and migrations).

Shared contracts contain data types and operation names only. Expose project create/list/open, action add/complete, and checkpoint save operations. Do not expose arbitrary IPC channels, SQL, or filesystem paths. Main validates payloads, project relationships, and the requesting window/frame before changing state; database constraints provide a second check. Return explicit success/data or a safe error code/message. The UI shows saved state only after commit; failed writes retain the entered text for retry.

Proposed security settings: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`; a minimal context bridge; restrictive CSP; packaged local content through an app protocol; blocked unexpected navigation/new windows. Render stored text as text. These are design proposals, not verified settings. [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), [IPC guide](https://www.electronjs.org/docs/latest/tutorial/ipc)

One application instance owns one database connection. A second launch focuses the first window. Test runs use separate temporary data directories.

## Minimum data model and rules — for user review

| Entity | Minimum fields | Relationship |
| --- | --- | --- |
| Project | integer ID, name, created-at | Has many actions and checkpoints |
| Development action | integer ID, project ID, title, created-at, nullable completed-at | Belongs to one project |
| Checkpoint | integer ID, project ID, accomplished text, next-steps text, created-at | Belongs to one project |

Main generates timestamps in UTC. Use primary keys, non-null required fields, foreign keys, and prepared statements with bound values. Explicitly enable and verify foreign key enforcement on the connection. [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html)

Proposed rules:

- Trim required text and reject blank values. Caps: project name 120, action title 300, each checkpoint field 10,000 JavaScript string code units. Duplicate project names are allowed; identity uses IDs.
- An action is pending when completed-at is null. Completion sets it once; repeating completion succeeds without changing its timestamp. Reopening, editing, and deletion are deferred.
- Checkpoints are append-only journal entries with both text fields required. They do not restore earlier project/action state. Display the latest by created-at, then ID as a tie-breaker.
- Saves are explicit. Submitted data is acknowledged only after commit; unsaved text is outside restart recovery. No promise of automatic retry or duplicate suppression across an app crash in this slice.

## Storage, migrations, and failure behavior

- Use a fixed database filename under an app-owned `data/` subfolder of Electron `userData`, separate from source, executable files, and the Obsidian vault. Keep application identity/path stable between development sessions; test data stays separate. This is a local, unencrypted database using the user's OS account permissions. [Electron paths](https://www.electronjs.org/docs/latest/api/app#appgetpathname)
- Use ordered, immutable SQL migrations and `PRAGMA user_version` as the application's schema counter. SQLite does not apply migrations for us. Apply pending changes and the version increment in one startup transaction before enabling writes; reject newer-than-supported schemas. No automatic downgrade. [SQLite user_version](https://www.sqlite.org/pragma.html#pragma_user_version)
- Before upgrading an existing schema, create a consistent SQLite backup; backup failure stops migration. A migration failure rolls back and stops normal startup without deleting/recreating the database. First creation needs no backup.
- On invalid input, missing IDs, locked/unwritable database, or failed commit: show a useful error, do not claim success, and preserve the form. Do not retry state-changing requests automatically. On an unreadable database, preserve the file and report its path; never silently reset it.
- Test rollback, version handling, repeat startup, FK rejection, and real file reopen. Ordinary restart recovery is the acceptance target; power-loss durability and a complete backup/restore interface need separate verification and scope.

## Approved acceptance criteria

The user approved these criteria on 2026-11-05. Personal verification of important behavior is still required.

1. Create projects A and B; add two actions to A, complete one, and save both checkpoint fields. A and B's contents stay separate.
2. After every successful save indicator, fully quit and relaunch using the same data directory. Select A from the project list: names, actions, completion state, and checkpoint text match. No automatic last-project reopening is required.
3. Complete the same action twice: one completed action and the original completion timestamp remain. Save two checkpoints: both remain and the latest is shown consistently.
4. Blank/oversized inputs, nonexistent project/action IDs, and cross-project action IDs are rejected without partial writes. Stored markup remains inert text.
5. A controlled database-write failure reports failure and retains input. A failed migration leaves the earlier schema/data intact; a newer schema is refused safely.
6. Run the packaged app without the Vite server; repeat the recovery flow. Record actual test results and the user's manual outcome before marking anything Verified.

## First milestone and ownership

| Increment, after approval | Output and review |
| --- | --- |
| 1. Foundation proof | Initialize Git if desired; explain/pin dependencies; build main/preload/renderer; validate SQLite in actual Electron; package and launch the minimal shell. Stop to review runtime/package problems before expanding. |
| 2. Persistence | Review schema and initial migration; verify temporary-file reopen and rollback; inspect IPC validation and errors line by line. |
| 3. Vertical slice | AI implements the accepted project/action/checkpoint flow; user reviews the changes. |
| 4. Verification and handoff | Run rule, persistence, and restart tests; user performs packaged restart check and explains one save's path; record evidence and unresolved issues. |

**ME — user decides:** architecture, relationships, migration/security policies, state transitions, tradeoffs, acceptance criteria. This document is AI advice for those decisions.

**AI drafts, user reviews:** scaffolding, configuration, basic forms, repetitive CRUD, integration glue, concise documentation.

**AI drafts, user reviews line by line:** all persistence/migration code, state changes, algorithms, error handling, concurrency and security logic. Label these review points as each increment is delivered.

**Current ownership amendment, 2026-11-06:** the user explicitly removed the later stage-progress personal-coding requirement and authorized AI core logic, tests, database/bridge and UI implementation. See [ADR 0004](adr/0004-release-progress.md). Significant choices stay explained/reviewable; manual acceptance and understanding remain user-owned.

**Earlier ownership amendment, 2026-11-05:** the user requested that AI implement the components and the user check them. This replaced the original requirement to personally implement a core component. Preserve line-by-line review of persistence, state, errors, concurrency and security; implementation alone does not demonstrate understanding.

Later amendment, same date: the new feature-alignment brief restores personal design/implementation of an important domain component for future work. Selection and next-slice approval are pending in [feature-alignment.md](feature-alignment.md); the prior M1 implementation is retained.

Continuation update, 2026-11-06: Resume selection/refresh was approved and implemented; the user's chosen personal component is stage-progress calculation and policy. [ADR 0002](adr/0002-resume-workspace.md) and [verification](verification.md) record that slice. Stop for user review before the next visual or feature milestone.

## Decision checkpoint

1. Approved: Windows-first scope, Electron/React/TypeScript/Vite, Node tests, Playwright and Forge packaging.
2. Approved: conditional `node:sqlite`, after the user requested and received the binding comparison.
3. Approved: proposed rules and acceptance criteria, including explicit saves, complete-only actions and append-only checkpoints.
4. Amended: AI implements; user reviews, including sensitive code line by line.

Implementation is authorized. Keep changes within the accepted first slice; user review and personal verification remain part of completion.

Progress is tracked only in [engineering-checklist.md](engineering-checklist.md). See [ADR 0001](adr/0001-foundation.md) for accepted decisions and [verification](verification.md) for measured results.
