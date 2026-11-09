# GitHub Actions and branch protection proposal

**Advisory pilot merged.** `main` at `1e18dd7` contains the Windows PR check and the test-only canonical-path correction exposed by the first hosted run. The corrected hosted run passed 92/92 with zero skips. Future coverage and branch-protection proposals remain separate. [Merged CI PR](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/pull/2) · [Successful hosted run](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/actions/runs/42566363806).

## One Windows job to start

- The advisory job runs on `pull_request` targeting `main` using GitHub-hosted `windows-2025` x64. It logs the checkout and tool versions, runs `npm ci`, then `npm test` to build both TypeScript targets and the renderer and run the Node suites. [Workflow](../.github/workflows/windows-checks.yml).
- The job uses read-only contents permission, full SHA pins, a 15-minute timeout, no repository secrets and no npm cache. [GitHub Actions security guidance](https://docs.github.com/en/actions/reference/security/secure-use).
- The successful job took 1m 12s with Node `24.21.0` and npm `11.19.0`. Electron GUI, packaging and native desktop checks remain local or manual. [Hosted run](https://github.com/AbdelrahmanElmughrabi/ProjectsTimeline/actions/runs/42566363806).

## Coverage and rollout

| Layer | Evidence and placement |
| --- | --- |
| TypeScript, Node and SQLite | Hosted CI runs `npm test`. It covers both TS targets, Vite, domain/IPC checks, preview paths, real-file migrations, rollback and backup tests. Windows also exercises junction and path behavior. |
| Electron | `npm run test:e2e` builds and launches the real Electron renderer. Pilot it on the same Windows image with an isolated profile and confirm app launch, focus and pointer reliability across repeat clean runs. It uses bundled Chromium. Keep it local until the runner is dependable. |
| Windows package and recovery | Pilot `npm run package` then `npm run test:packaged` in the same Windows x64 job and checkout. The latter consumes the executable and uses built output for packaged checks. It covers ASAR assets, bundled runtime/SQLite, upgrade and restart. For packaging-impacting milestones also run knowledge journeys against the rebuilt executable via `PROJECTS_TIMELINE_EXECUTABLE`. Keep local package verification required by the milestone while CI reliability is being measured. |
| Native desktop and visual acceptance | Keep owner checks on real Windows for the native chooser, screen-reader reading order/focus, actual display scaling, visual density, and signed installer behavior if an installer is introduced. The automated chooser supplies a path. Inspect meaningful screenshots and interactions rather than relying on file existence. |

If evidence is needed on runner failures, upload only test logs and fixture screenshots. Keep real project sources, databases, profiles and dumps out of CI artifacts. Record local Electron and packaged recovery results in [verification](verification.md).

## Dependency and merge policy

- Review the lockfile and run `npm audit --omit=dev` plus a full `npm audit` when dependencies change. Triage build-chain findings as well as production exposure. A separate advisory `npm audit --omit=dev --audit-level=high` job is an option after agreeing an escalation threshold. Review any proposed fix before updating dependencies. Historical V2 audit numbers describe that run. [npm audit options](https://docs.npmjs.com/cli/v11/commands/npm-audit/).
- After approval and a stable pilot, consider requiring PRs and the single stable check on the actual default branch, with force pushes and deletion blocked. Review administrator bypass behavior first. Keep formal approval count at zero while solo and record the owner's review in the PR. A PR author cannot approve their own PR. Require one eligible independent review if collaboration makes that practical. [Protected-branch rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule) · [Review limitations](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).
- GitHub Free supports protected branches for public repositories. Private repositories need an eligible plan such as Pro, Team or Enterprise. If protection is unavailable, apply the documented review and verification gate manually. [Plan eligibility](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule).
