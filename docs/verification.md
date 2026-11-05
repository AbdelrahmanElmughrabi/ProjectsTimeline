# Milestone 1 — Verification record

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
