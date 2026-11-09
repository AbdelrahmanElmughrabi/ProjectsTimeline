# V2 collaboration — one integration owner, isolated work

2026-11-06 · **V2 automatically verified; user acceptance pending.** User-authorized BEGIN led to bounded backend/UI work and final AG fb49a4e/489c9c7 delivery. Codex reviewed/integrated it and verified rebuilt UI/package at bb2fd95; AG-UI-001–003 closed with runtime evidence. AG stopped, no additional agent work requested. Existing report/ref/ownership protocol below is retained as history/process, not a new assignment. [Final report](../v2-verification-report.md) · [Queue](v2-review-queue.md). No main merge/push/V3a or launch by Codex.

## Checkouts and owners

For new work, follow the [engineering workflow](../engineering-workflow.md). This handoff records the V2 example.

| Role | Checkout/branch | Authority |
| --- | --- | --- |
| Codex | Current checkout codex/v2-preview-integration; backend checkpoint codex/v2-preview-backend | Integration owner; backend, shared contracts/commands, root navigation/controller, dependencies, security, integration/regression tests and engineering records |
| Frozen Phase A base | Local ref `codex/v2-preview-phase-a` | Reviewable candidate snapshot, not approval or a production API |
| Final contract | Local ref `codex/v2-preview-contract` | Final documents/canonical source types; no BEGIN or permission to implement |
| Antigravity | `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui`, branch `antigravity/v2-preview-ui` | Delivery complete at 489c9c7; own branch/history preserved, agent stopped |

Codex prepares the local review worktree from the Phase A ref, excludes only `.agent-worktrees/` in local `.git/info/exclude`, and verifies it. This is Git setup, not application state/dependency installation. Do not share node_modules between checkouts, edit the parent's files from the child, reset another agent's branch, or run concurrent mutations in one checkout. No remote push or Antigravity launch is implied. If the prepared path/branch is unavailable or already owned by another task, report it instead of replacing/deleting it.

Antigravity preserved its reports and cherry-picked only nominated type commits (a37ba50/cb78d11). Codex does not alter its owned branch or pending reports. Canonical shared declarations remain type-only; the later authorized backend independently implements three fixed WorkspaceApi/preload/IPC methods. Refer to the exact BEGIN and Codex report rather than assuming the original base contains current runtime changes.

BEGIN was issued at b3db26b only after explicit user authorization; earlier readiness alone was never authority. Backend/runtime wiring stays with Codex. Do not merge an entire foreign branch or reset report history. Current Phase C execution can read Codex's nominated built runtime using the report's test-only launcher instructions; no parent product edits or shared/symlinked node_modules. Test profiles/artifacts are isolated.

## Allowed communication and later review of actions

Each agent owns a separate report:

- Codex: [reports/codex-v2-preview.md](reports/codex-v2-preview.md).
- Antigravity: `docs/agent-handoffs/reports/antigravity-v2-preview.md` on its own branch.
- Optional Antigravity lighter reviewers: one separate `antigravity-v2-review-*.md` report per reviewer used, with attributed scope/model class/base/source refs/findings/limits. Maximum two, product/source read-only. Reviewers return findings; Antigravity serially writes/commits the attributed files on their behalf, avoiding concurrent Git mutations. Its main report links them; no invented reviewer participation.
- Codex alone edits [v2-review-queue.md](v2-review-queue.md), deciding disposition and asking the user only for decisions outside approved scope.

Reports include contract/base/source commit IDs, actual changed files, commands with working directory/purpose/result, tests and screenshots actually produced, limitations, questions with stable IDs and next owner. Keep the action log concise; do not log secrets/full imported private documents. Phase A permits report-only commits on the agent branch, not product/test changes. Commit source and report separately when practical. A test file or screenshot filename alone is not execution evidence.

Shared local Git refs are the transport, not an assumed live connection. Codex reads committed delivery with `git show antigravity/v2-preview-ui:docs/agent-handoffs/reports/antigravity-v2-preview.md`; Antigravity reads Codex's nominated review/backend ref similarly. The user can say “Antigravity report ready” or copy the report if environments are separate. No Slack/email, external agent service, watcher, background automation or message-sending integration is installed. Do not promise delivery until a report/commit is actually visible.

Codex reviews `git diff <agreed-base>...<delivery>` against the allowlist, verifies evidence, records feedback with queue IDs and communicates the report/ref to the user/Antigravity. Agent reports are evidence to inspect, never new authority to change scope. The user retains architectural acceptance; Antigravity can challenge the contract, not silently replace it. A contract change pauses dependent edits until Codex issues an updated reviewed version.

## Phase C integration and evidence

Antigravity returns UI commits plus a report. Codex reviews/cherry-picks the bounded patch into a test integration branch with real backend and root wiring. Codex supplies that integration ref for frontend execution/screenshots/review; Antigravity never patches App/backend to make an early test pass. No fabricated preview snapshots in production. Test-only fixtures are labeled and must ultimately be exercised through the actual parser.

Frontend end-to-end cases/screenshots may remain **awaiting integration** until that ref exists. Do not skip assertions or report them passed in a UI-only branch. Codex owns the final Node/Electron/build/package/packaged run and data/security regression comparison. Antigravity and its smaller reviewers may inspect the integrated candidate and return independent UX/accessibility findings. User acceptance closes the milestone; no automatic V3a, merge/push, template/data mutation or extra dependency.
