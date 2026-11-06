# ADR 0001 — First-slice foundation

Status: Accepted by user, 2026-11-05. Source: [foundation plan](../foundation-plan.md) and approval in the project chat.

Use Windows-first Electron + React/TypeScript with Vite building the renderer. Compile main and sandboxed preload separately. Main alone owns a stable app-data SQLite database; expose six named operations through a context-isolated bridge and validate the sender and payload on main.

Use built-in `node:sqlite`, conditional on actual Electron and packaged-runtime verification. This avoids another SQLite binding/native dependency. Accept the Node 24 RC API and synchronous short-query tradeoffs. No ORM or generic repository framework. A different binding or worker is a later decision justified by compatibility or measured blocking.

Model projects, project-owned actions and append-only text checkpoints. Completion is idempotent and preserves its first timestamp. Checkpoints are journal entries, not restore points. Acknowledged writes must survive a normal restart; unsaved drafts are outside persistence.

Use immutable numbered SQL migrations, `user_version`, a consistent backup before an existing-schema upgrade, and one transaction for pending schema changes plus version. Fail safely on unreadable/newer/unversioned existing schemas; never silently recreate data.

Use Node's test runner for rules/integration and Playwright for Electron automation. Verify an executable folder through Forge; defer installer, signing and updates. No external services or Knowledge Atlas integration.

Original M1 ownership: AI implements and user reviews, replacing the initial personal-coding requirement for that slice. Persistence, state changes, security, concurrency and errors remain line-by-line user review points; user understanding and manual verification remain outstanding until demonstrated.

Ownership amendment from the later feature-alignment brief (2026-11-05): the user again requires personal design and implementation of an important domain component in future work. Component choice is pending; do not have AI implement the selected component. This changes future ownership, not the already completed M1 implementation. See the [new proposal](../feature-alignment.md).

Selection confirmed in the Continue Implementation brief: the user owns the future stage-progress calculation and policy; AI is authorized to implement Resume selection. [ADR 0002](0002-resume-workspace.md) records the approved Resume/query-refresh decision. Do not implement the user's stage-progress algorithm.

See [verification](../verification.md) for actual compatibility/test evidence and limits, and [the checklist](../engineering-checklist.md) for current progress.
