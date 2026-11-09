# ProjectsTimeline engineering workflow

Use this process for meaningful changes. A small documentation correction can use a short scope and verification note. A migration, trust-boundary change or new milestone needs explicit approval and failure/recovery criteria.

## From issue to close

1. **Issue → Plan.** Record the user problem, expected behavior, constraints, acceptance and checks using the [issue template](../.github/ISSUE_TEMPLATE/engineering-change.md). A local draft is enough before publication approval. Use an existing real issue when available. Suggested labels are `feature`, `bug`, `ux-accessibility`, `tech-debt` and `testing`.
2. **Branch → Implementation.** Record the intended base and its exact commit, inspect the branch, status and worktrees, and preserve unrelated changes. Use a descriptive name such as `codex/v5a-linked-continuity` when a new branch is authorized. Commit complete, reviewable pieces with the existing `feat:`, `fix:`, `test:` or `docs:` style. Review migrations, contracts and security boundaries before changing them.
3. **Tests → Pull request.** Run checks matched to the change. Link exact evidence, distinguish reruns from prior results, and record open manual checks. Prepare the [PR template](../.github/pull_request_template.md) locally until the owner authorizes publication. Link a real issue where applicable. Use a closing keyword only when a PR targeting the default branch resolves that issue. [GitHub issue-linking rules](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue).
4. **CI → Review.** Once approved and enabled, Actions independently verifies the PR revision. Until then record actual local results. The owner reviews acceptance, tradeoffs and remaining manual checks. Rerun relevant checks after meaningful changes. [CI proposal](github-ci-proposal.md).
5. **Approved merge → Close issue.** Merge only on explicit owner authorization after review and applicable checks. Confirm the intended change landed before closing a real issue. Leave partially addressed issues open. Never reset, push, force-push, merge, publish or change remote settings without explicit authorization.

## Roles and isolated review

| Role | Responsibility |
| --- | --- |
| Product owner | Prioritize, approve decisions and scope, review and accept, authorize publishing and merge. |
| Main planner | Define scope, acceptance and architecture. The same person can fill this role. |
| Codex | Implement the approved scope, verify it, keep records current and prepare reviewable local commits. |
| Antigravity | Optional independent UX review with owner authorization in an isolated worktree. |
| GitHub Actions | Independent automated verification once approved. |

One integration owner reviews delivered work. If an independent reviewer is useful, record a frozen base SHA, task, branch/worktree, exclusive write paths, approval gate and expected evidence. Have the reviewer return exact refs, checks and open findings. Keep research/prototype commits isolated unless explicitly reviewed for integration. Existing [V2 collaboration](agent-handoffs/v2-collaboration.md) is a worked example. Routine changes stay in one checkout.

## Verification and owner review

- Docs or process changes need link and diff checks. Code changes use the smallest relevant tests and normal build. Changes to IPC, migration, Electron navigation or recovery exercise the actual boundary and a populated isolated profile where relevant. Follow milestone acceptance criteria and use rebuilt packaging when the shipped path matters.
- For a meaningful milestone, name the important files and one architectural tradeoff. Trace one user action from UI → named preload/IPC → main validation/domain → SQLite → acknowledgement and refreshed read. Show one failure or recovery test and give the owner a small exercise, such as tracing a retry to confirm it performs only reads after a successful write.
- Record milestone status in the [roadmap](design/product-implementation-roadmap.md) and [checklist](engineering-checklist.md). Keep evidence in the [verification record](verification.md), consequential approved decisions in ADRs, and deferred ideas in the [visual backlog](design/visual-engineering-backlog.md). The Obsidian log is a short checkpoint with decisions, evidence, blockers, next step and a useful technical note when applicable.
