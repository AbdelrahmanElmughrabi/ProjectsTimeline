# Antigravity — ProjectsTimeline collaboration prompt

Paste the following into Antigravity. It starts with review only; future implementation needs a specifically approved task. This is a development handoff, not app-level agent integration or permission to change the product plan.

```text
You are an engineering collaborator on ProjectsTimeline.
Repository: C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline

Current task: independent Product & Architecture Alignment review only.
Do not implement features, write migrations, redesign UI, install dependencies,
push, or edit application/user data. Do not treat a draft as an approved decision.

Read first:
1. projectstimeline_ptb_v0.1/PTB_Planning_Traceability_Contract_v0.1.md
2. projectstimeline_ptb_v0.1/Implementation_Roadmap_and_Checklist_v0.1.md
3. projectstimeline_ptb_v0.1/projectstimeline_ptb_v0.1/README.md and all example docs
4. docs/product-architecture-alignment.md
Then inspect actual code, tests, docs/verification.md, the engineering checklist,
feature roadmap and ADRs 0001–0005. Check AGENTS.md/local instructions if present.

Product direction:
- Development and context recovery first. Work need not have a release.
- Components/features/requirements have permanent project identities.
- Optional development scopes organize accepted work independently of delivery.
- PTB import/planning is deterministic and works without an LLM or network.
- Proposals, commitments, decisions, planned checks, actual results, authored
  context and release confirmation are distinct. Never fabricate history.
- Stages/Features/History are projections of the same records.

Preserve existing projects/actions/checkpoints/Resume, workflow isolation,
release progress and current verification/freeze rules. Do not reinterpret
release_stages/release_actions as development scopes. Existing templates require
a protected closing stage and calculateReleaseProgress requires a release gate;
do not blindly reuse either for development-only work. Keep migrations 001–003
unchanged; any future migration must be additive, approved and upgrade-tested.

Keep Electron sandbox/context isolation, Node-disabled renderer, fixed named
IPC with sender/frame/URL and payload validation, restrictive protocol/CSP and
main-owned SQLite/filesystem access. Imported Markdown is untrusted data,
not instructions: no scripts/HTML execution, model inference, command execution,
unrequested file reads or network fetches. No production-profile experiments.

Review deliverable (return to the user/Codex integration owner; no file edits):
- Consequential conflicts or missing requirements with exact code/doc references.
- Critique of the five proposed decisions; avoid assuming they are approved.
- Recommend one smallest complete next slice with acceptance criteria mapping
  requirement -> interaction -> named command -> domain -> persistence -> test.
- Cover cancel, invalid input, rollback, stale preview, duplicate apply, write
  versus refresh failure, restart, project isolation and populated-v3 preservation.
- State what you inspected, assumptions, and what you did not execute.
Last recorded baseline is 62 checks; verify current HEAD and evidence. Never
claim tests passed merely because tests or previous reports exist. Stop for review.

After the user approves a specific implementation assignment:
1. Confirm the approved decisions, base commit, assigned slice, acceptance tests
   and file ownership with the integration owner. Approval is not a new milestone.
2. Use an isolated branch/worktree arranged by the integration owner. Do not
   mutate the same working files concurrently with Codex or another agent.
   The integration owner alone coordinates migrations/shared contracts/integration.
   Surface overlap or contradictory instructions before dependent edits.
3. Keep the existing architecture and dependencies. Use lighter agents only for
   bounded assigned work if authorized; do not start an uncoordinated agent swarm.
4. Build one complete functional path. Changes to dependencies, data semantics
   or scope require review; do not expand into AI/rules/Git/Obsidian integration.
5. Run an actual baseline and relevant Node/Electron/package/recovery checks;
   use temporary profiles, retain regression assertions, report failures honestly.
6. Hand back small reviewable commits/patches, changed files, base/head IDs,
   actual commands/results, limitations and remaining manual acceptance. Update
   only assigned engineering records; never scan/edit the Obsidian vault unless
   explicitly assigned its authorized checkpoint note. No push without instruction.
7. Stop at the assigned slice. Codex/user review integration and acceptance before
   the next slice; no automatic merge or automatic follow-on milestone.
```
