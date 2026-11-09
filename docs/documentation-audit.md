# Repository and documentation audit

2026-11-09 · Baseline `21d5091102df938029c42ccac4a648510363daab` on `codex/v3-product-experience-design`. The worktree already had nine modified prototype PNGs and the untracked V5a design draft. The staging area was empty. Preserve the PNG edits and carry the draft forward without revising its technical proposal.

| Area | Finding and disposition |
| --- | --- |
| Entry points and instructions | The README described V1 as current. There was no project `AGENTS.md`. Use the README to orient and run, `AGENTS.md` for agent boundaries, and the [engineering workflow](engineering-workflow.md) for process. |
| Vision, scope and backlog | [Product alignment](product-architecture-alignment.md) and its contracts explain the development-first direction. The [implementation roadmap](design/product-implementation-roadmap.md) owns sequence and current gates. The [visual backlog](design/visual-engineering-backlog.md) holds deferred ideas. Keep the [earlier feature-alignment roadmap](feature-alignment.md) as a dated milestone record. |
| Decisions and technical design | ADRs 0001–0008 retain their accepted decisions. The concrete V3a1a proposals and post-V3a1a UX review preserve design rationale. Mark old pre-implementation statements as historical in overview pages. The [V5a design](design/v5a-linked-development-continuity.md) and [local issue draft](design/v5a-issue-draft.md) are pending approval. |
| Verification and acceptance | The [checklist](engineering-checklist.md) tracks gates. The [verification index and log](verification.md) link dated reports with commands, results and screenshots. Keep those results and sample data intact. Record acceptance separately from outstanding picker, screen-reader and visual checks. |
| Handoffs | [V2 collaboration](agent-handoffs/v2-collaboration.md) records frozen bases, owned paths, an explicit BEGIN, evidence and one integration owner. Keep it as a worked example. Preserve Antigravity's independent V3 design and UX review in their existing branches. |
| Git and worktrees | `git worktree list` showed the current design checkout, three isolated Antigravity checkouts for V2 UI, V3 design and stabilization UX review, and the existing Orca `Project-timeline` checkout. All were left in place. Local `main` was `1cb122d`, three commits ahead of the verified remote default tip. |
| GitHub | `git ls-remote --symref` confirmed default branch `main` at `9d638f2cc2be9ae5f4312bafcc792d85724d99c1` and the design branch at the baseline above. Both exact commit trees lacked `.github` workflows, templates and CODEOWNERS. Anonymous API requests for repository metadata, the default branch and workflow inventory returned 404. Visibility, Issues availability, Actions policy and protection need an owner-account check. [CI proposal](github-ci-proposal.md). |
| Test conventions | `npm test` builds and runs Node suites. `npm run test:e2e` rebuilds for real Electron. Package then test recovery on Windows x64 with isolated temporary profiles. The owner still verifies native interaction and usability. [Latest application evidence](v3a1a-stabilization-verification.md). |
| Obsidian | The development log keeps a compact current-state section and append-only session history. Update the state and append a brief checkpoint. Acceptance and evidence remain traceable to the repository. |

Keep dated plans, handoffs, ADRs and evidence at their original paths. Future summaries can link to those records instead of copying the same feature status and test counts into multiple landing pages.

## Default-branch integration proposal

Read-only comparison on 2026-11-09, before the continuity checkpoint:

| Ref | Relationship to the active branch at `e799c84` |
| --- | --- |
| GitHub `main` at `9d638f2` | Ancestor, 31 commits behind. This is the intended integration PR base. |
| Local `main` at `1cb122d` | Ancestor, 28 commits behind. Its three commits ahead of GitHub `main` are already in the active history. |
| GitHub `codex/v3-product-experience-design` at `21d5091` | Ancestor, two commits behind (`aed6a7e`, `e799c84`), plus the continuity checkpoint once committed. |
| GitHub `codex/v2-preview-integration` at `b16f212` | Ancestor. The active branch already carries the verified V2 work. |
| Historical Antigravity worktrees | Divergent side histories with seven, one and one commits unique to their respective branches. Reviewed material is already incorporated where appropriate. Keep their original refs isolated. The older Orca worktree is at `9d638f2`. |

1. **Review the baseline.** The owner approves integrating verified V2/V3a1a and the documentation. Recheck the live tips and ancestry before publishing. At the observed tips, no manual conflict resolution is needed for the proposed head/base pair.
2. **Publish the existing branch after authorization.** A normal fast-forward push to `origin/codex/v3-product-experience-design` publishes only the committed checkpoints. Leave the nine working-copy prototype PNG edits out. Open one baseline PR with head `codex/v3-product-experience-design` and base `main`. Title it **Integrate verified V2 and V3a1a baseline**. Use the [PR template](../.github/pull_request_template.md) and link recorded acceptance and verification.
3. **Review the full range and merge only after approval.** The PR carries V2 Preview, V3a1a, migration 004, renderer stabilization and their fixtures, tests and evidence. Check the precise head and any base changes, and rerun Node, Electron and rebuilt Windows migration/restart checks against isolated profiles for the PR. Native-picker and screen-reader checks remain open. GitHub currently allows merge commits. Choose **Create a merge commit** to retain the original evidence SHAs in `main` ancestry. [Application verification](v3a1a-stabilization-verification.md) · [GitHub merge methods](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github).
4. **Start subsequent work from updated `main`.** Verify the merged head contains the intended baseline. After V5a design approval, publish the reviewed issue and open its own implementation branch and PR. Author the [CI pilot](github-ci-proposal.md) on a separate branch from the same integrated baseline when separately approved.
