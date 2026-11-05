# ADR 0001 — First-slice foundation

Status: Accepted by user, 2026-11-05. Source: [foundation plan](../foundation-plan.md) and approval in the project chat.

Use Windows-first Electron + React/TypeScript with Vite building the renderer. Compile main and sandboxed preload separately. Main alone owns a stable app-data SQLite database; expose six named operations through a context-isolated bridge and validate the sender and payload on main.

Use built-in `node:sqlite`, conditional on actual Electron and packaged-runtime verification. This avoids another SQLite binding/native dependency. Accept the Node 24 RC API and synchronous short-query tradeoffs. No ORM or generic repository framework. A different binding or worker is a later decision justified by compatibility or measured blocking.

Model projects, project-owned actions and append-only text checkpoints. Completion is idempotent and preserves its first timestamp. Checkpoints are journal entries, not restore points. Acknowledged writes must survive a normal restart; unsaved drafts are outside persistence.

Use immutable numbered SQL migrations, `user_version`, a consistent backup before an existing-schema upgrade, and one transaction for pending schema changes plus version. Fail safely on unreadable/newer/unversioned existing schemas; never silently recreate data.

Use Node's test runner for rules/integration and Playwright for Electron automation. Verify an executable folder through Forge; defer installer, signing and updates. No external services or Knowledge Atlas integration.

AI implements and user reviews. This explicitly replaces the earlier personal-coding requirement. Persistence, state changes, security, concurrency and errors remain line-by-line user review points; user understanding and manual verification remain outstanding until demonstrated.

See [verification](../verification.md) for actual compatibility/test evidence and limits, and [the checklist](../engineering-checklist.md) for current progress.
