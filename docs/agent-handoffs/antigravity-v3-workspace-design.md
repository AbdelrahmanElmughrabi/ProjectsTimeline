# Antigravity — ProjectsTimeline V3 independent workspace design review

Copy-ready assignment. **DESIGN ONLY. Do not begin V3 implementation.** The user will deliver this prompt manually. Codex is architecture/integration owner; you are an independent product/UX collaborator, not a rubber stamp for Codex's layout.

## Checkout and communication

- Repository: `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline`.
- Frozen design handoff ref: **`codex/v3-design-handoff`**. Resolve and report its full SHA with `git rev-parse codex/v3-design-handoff`; this ref is created after the design package commit. V2 baseline records: `b16f2127b02c623d55a2e9f2a112242c14d61d37`; application/test source: `bb2fd95a10148416e8191e5abfb04bf76c9e2aab`.
- Your NEW branch: **`antigravity/v3-workspace-design`**. Isolated checkout: `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v3-workspace-design`.
- Verify `git status`, branch, current SHA and base ancestry first. If the checkout already contains your later commits, preserve them; do not reset/cherry-pick over reports. If missing, create the new worktree from the frozen ref; never reuse/reset `antigravity/v2-preview-ui` or its worktree. Stop and report any ownership/ancestry conflict.
- Codex will read committed reports using your branch/ref after the user notifies it. There is **no assumed live agent-to-agent channel**. Do not message others, push, merge or change Codex's branch. Report exact source/report SHAs and changed paths.

## Why we are doing this

ProjectsTimeline is a local-first engineering-context workspace: understand a product, organize real work, preserve reasoning and resume it. Releases are protected delivery records, not the organizing unit of ordinary development.

V1/V2 added useful Home, project/actions/checkpoints, release/workflow systems and deterministic blueprint preview. Actual testing exposed a UX gap: the preview is a technical viewer of IDs, hashes, validation and eight long entity groups. A valid blueprint does not yet become a useful workspace. The goal is to avoid rebuilding dozens of records manually while keeping approval and engineering truth explicit.

Design the connected journey: **Home → select PTB → human summary → destination + explicit bulk review → organized Project → Stages / Features / History → act → save problem/next step → leave → Continue into the same engineering context.** New-project and safe existing-project flows must both be designed, though not shipped in one slice.

## Read first

At the frozen ref:

1. `docs/design/v3-product-experience-contract.md` (D1–D5 are proposals, challenge them).
2. `docs/design/connected-workspace-design.md` and standalone `docs/design/v3-workspace-prototype.html`.
3. `docs/design/blueprint-adoption-merge-policy.md`.
4. `docs/design/product-traceability.md` and `docs/design/product-implementation-roadmap.md`.
5. `docs/design/development-domain-contract.md`, `docs/design/ptb-v0.2-contract.md`.
6. `docs/product-architecture-alignment.md`, `docs/v2-preview-contract.md`, `docs/v2-verification-report.md`, relevant ADRs 0001–0007 and engineering/verification records.
7. **Original visual reference** `docs/design/ui-reference.png`; existing `src/renderer/ProjectHome.tsx`, `App.tsx`, `ResumePanel.tsx`, `ReleaseWorkspace.tsx`, `WorkflowLibrary.tsx`, `blueprint-preview/*`, styles/tokens, shared contracts and main preview/session/store boundaries. Read-only inspection, not edits.

Exact real Vivarium package (read only): `C:/Users/fireball/OneDrive/Desktop/3d pet generator/projects-timeline-test`. Read README, `single/project.md`, `multi/project.md`, `multi/domain.md`, `multi/work.md`; invalid package if useful. Do not run/edit/install anything in the Vivarium project. If unavailable on your machine, say so and use the embedded prototype metadata plus repository fixtures; do not pretend real-file review.

Facts already checked by Codex's existing parser, not assumptions: Vivarium has **47 records / 86 typed links**, seven features, **one** scope with Design/Foundation/Implementation/Verification, nine scoped actions + one unscoped. Single/multi normalized metadata and links agree but four narrative bodies differ, so semantic hashes differ correctly. Four proposed decisions/five planned checks are not accepted decisions/passed results. Clean-room wording versus Three.js is a human review question, not a parser-detected conflict. Desk Notes is 15 records/29 links with useful unscoped work; FieldLedger is 37/82 with two scopes and shared features. Do not invent more Vivarium scopes.

## Your independent brief

Challenge first-use cognitive effort and actual developer behavior. Compare at least two consequential alternatives before recommending a model:

- Feature/component map versus stage workmap versus flat inventory; whether a timeline conveys anything without dates/dependencies.
- Separate Resume rail versus a focused detail surface, especially at 800px. Avoid four columns or scrolling past every action to reach a selected inspector.
- Default-none grouped approval versus excessive individual configuration; separate requirement acceptance, action commitment and scope activation without turning review into a wizard marathon.
- What “start work” means, how a developer finds a useful task without invented priority, and how local correction/changed intent/interruptions work.
- Summary-first progressive disclosure while preserving exact source/diagnostic accessibility.

Required worked journeys:

1. **Desk Notes:** choose one unscoped action, leave optional scope unused, save a real authored next step and return directly to it; no release.
2. **Vivarium:** understand seven capabilities without studying 47 entries; explicitly review/commit groups and activate its inline plan; navigate one action by stage, feature and history; save a problem/question; return to the same target. Show human review ambiguities without inventing an automatic semantic analyzer.
3. Brief FieldLedger supplement: two scopes sharing features/actions; filtering must not duplicate work or invent a project-wide current stage.
4. Existing-project attachment/update: explicit destination/binding, local/source conflict and omission protection; distinguish later implementation from the first new-project path.

For each significant surface (Home, blueprint summary, destination/effects review, Overview, Stages, Features, History, inspector, Resume), state the user's goal, essential information, actions/connections, loading/empty/error/large-project states, keyboard/focus and backend/data dependencies. Explain what happens after acknowledged save + failed refresh, cancellation, wrong project, missing saved target and unsaved input.

Identify missing requirements rather than merely drawing the requested screens. PTB v0.2 has no approved priority/dependency/blocker/schedule/start-hint semantics. Typed references and source order are not prerequisites/priority; later extensions need explicit versioned contracts. Counts/Not assessed are approved; development percentages/release readiness are not. Keep speculative recommendations clearly separate from saved intentions.

## Exclusive file ownership

You may create/edit **only**:

- `docs/agent-handoffs/reports/antigravity-v3-workspace-design.md` — primary report.
- Optional supporting reports named `docs/agent-handoffs/reports/antigravity-v3-review-*.md`.
- `docs/design/antigravity-v3/` — self-contained wireframes, HTML/CSS/JS design simulations, screenshots/assets and their README.

Codex owns all canonical design docs, this handoff, source/shared types/main/preload, tests, scripts/config, package/lockfiles, SQL/migrations and Obsidian. Do not modify them. Do not create an app route or import your prototype into production. No dependencies, application/database writes, model calls, executable blueprint content or automatic command runner. Do not edit original PTB input/reference/history. Read-only runtime inspection is permitted using an isolated profile; do not use the regular user's database. Do not rerun/mutate unrelated tests or broaden ownership without an explicit assignment.

Standalone prototypes must say **design simulation**, use actual definitions or explicitly labelled synthetic layout-only examples, and never present imaginary completion/test runs as engineering history. No storage/network required. All linked/selected work shares identities; a clicked inspector is not a recorded start. Respect graphite/violet tokens, native keyboard controls, readable long content/reduced motion and responsive layout. Keep working V1/V2/Releases/Workflows visually coherent; do not broadly redesign the whole app.

You may delegate at most two narrowly scoped **read-only design reviews** to lighter agents if helpful. Use capable small models, not another large high-effort implementation agent. Record their model/task/findings and your disposition; no implementation swarm or overlapping writers. The user wants to review your actions later.

## Deliverables and stopping point

In the primary report provide:

1. Base SHA, examined files, concise action/delegation log and actual checks (distinguish static, simulation, real app and untested claims).
2. Ranked independent UX findings; cite source/design paths. Explicitly agree/disagree with D1–D5 and explain practical tradeoffs.
3. Connected screen flow/wireframes or standalone reviewable prototype; two worked journeys plus supplements, compact/wide behavior and screen-state matrix.
4. Domain/backend assumptions and any requirement/ownership conflicts; proposal-versus-accepted/work/evidence distinctions.
5. Suggested smallest usable delivery sequence, acceptance scenarios and **at most five material user decisions**; do not create a competing list of routine approvals.
6. Screenshots, exact changed paths/commit SHAs, limitations and remaining user/manual checks.

Commit only your owned design/report artifacts on your branch; do not push/merge. Tell the user the final report path and exact commits so Codex can review with `git show antigravity/v3-workspace-design:<path>`. **Stop after design.** No BEGIN implementation is issued by this handoff, a positive review, or the old V2 Phase B approval. User approval of the connected V3 design and a concrete next slice/schema gate comes first.
