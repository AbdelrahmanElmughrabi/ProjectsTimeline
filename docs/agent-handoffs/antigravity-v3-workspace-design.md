# Antigravity — V3 Visual Engineering Workspace design handoff

**Status, 2026-11-07:** User-delivered assignment completed at `92a712908223756d984abf675bc542dad65f77eb`; Codex reviewed it against frozen `63c18e9`. See [consolidated review](../design/v3-consolidated-review.md) and [capability audit](../design/v3-capability-audit.md). No new assignment, merge or production BEGIN is issued. The original prompt below remains historical; its frozen Git ref is unchanged.

**BEGIN DESIGN REVIEW / ISOLATED PROTOTYPING ONLY when the user delivers this prompt. No production implementation is authorized.** Codex owns architecture/integration. Challenge Codex's proposals independently; do not merely polish the paused stage boards or agree with the new map by default.

## Checkout, ownership and communication

- Repo: C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline.
- Frozen handoff ref: **codex/v3-visual-workspace-handoff**. Resolve/report its full SHA before work; it contains this prompt, two concepts, prototype/source capture and verification. Preservation baseline **47f73c6** contains the tooling setup and paused drafts; previous V2 source bb2fd95 / records b16f212 remains historical.
- NEW branch **antigravity/v3-visual-workspace-design**, isolated checkout **C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v3-visual-workspace-design**. Verify status/ancestry first. If missing, create from frozen ref. Preserve any existing later commits; never reset/reuse V2's branch/worktree or overwrite reports.
- You own ONLY **docs/agent-handoffs/reports/antigravity-v3-visual-workspace.md**, optional supporting **antigravity-v3-visual-review-*.md** reports in that reports folder, and **docs/design/antigravity-v3-visual/** for self-contained prototypes/wireframes/screenshots/README.
- Codex owns all canonical design docs, its prototype, this handoff, production src/main/preload/renderer/shared, tests/scripts/config/package/lockfiles/SQL/ADRs and Obsidian. No overlapping edits. Read them freely; do not modify them.
- Commit only owned design/report artifacts on your branch, do not push/merge. Return exact commits/paths to the user. Codex reads committed refs after the user's notification; **no assumed live agent channel**, automatic merge or production BEGIN.

The worktree has no private node_modules install. If needed, invoke the existing root binaries by absolute path while your working directory stays in the worktree: `node C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/node_modules/vite/bin/vite.js build --config docs/design/v3-visual-prototype/vite.config.mjs`, then `node C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/node_modules/electron/cli.js docs/design/v3-visual-prototype/preview.cjs`. The nested checkout resolves installed modules through the repository ancestor. Build/view only writes ignored worktree artifacts. **Do not run Codex's capture/check scripts unmodified**: they overwrite its owned fixture/screenshots. Put your checks/screenshots/prototype changes in your assigned folder, or redirect outputs there explicitly. Do not install dependencies to make a review work.

## Mission and boundaries

ProjectsTimeline turns engineering knowledge into a navigable visual software model, reusable development organization and useful resumption context. Approachable for vibe coders, technically meaningful for engineers. Releases remain protected delivery records, not the container for all development.

V2 is a working deterministic PTB preview, but its IDs/hashes/eight lists are a technical viewer. Paused V3's cards/boards/permanent empty Resume rail are research, **not the target**. Explore a primary interactive engineering map, a separate secondary development roadmap, actual History, one contextual inspector and exact source navigation. Do not show every task/document as a graph node or infer dependencies from prose. No fake progress/priority/dates/sessions/evidence.

Current task is UX critique/design and isolated prototypes only. No database/migration, parser replacement, new dependency installation, importer implementations, model/runtime AI calls, source-project execution, broad app redesign or production route. Do not initialize OpenSpec/Spec Kit. Preserve established security, source traceability and working Home/Resume/Releases/Workflows/schema v3.

## Read and inspect

1. docs/design/v3-product-experience-contract.md (VD1–VD5 need review).
2. docs/design/connected-workspace-design.md, docs/design/v3-visual-prototype/README.md, main.jsx/model.mjs/style.css and actual screenshots. Run the isolated study if useful; no second install is required. Report environment problems instead of installing.
3. docs/design/multi-format-ingestion-design.md and docs/design/v3-ui-component-inventory.md.
4. docs/design/blueprint-adoption-merge-policy.md, development-domain-contract.md, product-traceability.md, product-implementation-roadmap.md and visual-engineering-backlog.md.
5. docs/design/ui-reference.png (original cockpit), docs/product-architecture-alignment.md, V2 contract/final report, relevant ADRs and engineering/verification records.
6. Actual renderer Home/App/Resume/ReleaseWorkspace/WorkflowLibrary/blueprint-preview and tokens, shared contracts, main parser/acquisition/session/store/security boundaries, package/config/lock. Read-only.

Exact Vivarium files (read only): C:/Users/fireball/OneDrive/Desktop/3d pet generator/projects-timeline-test — README, single/project.md, multi/project.md/domain.md/work.md. Never run/edit/install that project. If unavailable, state that limitation and use the captured source in Codex's prototype; don't claim original-file review.

Real data: **47 definitions / 86 typed links**, nine components/seven features/ten requirements, **one** four-stage scope (Design/Foundation/Implementation/Verification), ten actions (nine scoped, one unscoped), four proposed decisions/five planned checks. Single/multi metadata/links agree, four narrative bodies differ: hashes correctly differ. Do not invent several Vivarium scopes. Desk Notes (15/29) supplies lightweight unscoped work; FieldLedger (37/82) supplies two scopes/shared concepts. Clean-room versus Three.js is a human review question, not a detected parser conflict.

Installed/locked tools are inspected: Tailwind 4.3.5, Base UI 1.9.0, shadcn CLI 4.23.0/Nova configuration (no generated app components), React Flow 12.12.1, ELK 0.12.1, React 19.3.1, Vite 8.3.6, Playwright library 1.64.1 and separate runner 1.65.0. Do not assume all components/browser binaries/production CSP paths are verified. Codex actually exercised map/ELK/Tailwind/Base UI dialogs under the existing strict CSP in an isolated Electron viewer; production app://, ASAR, persistence and large models remain later gates.

## Independent questions and expected visual work

Compare Codex's **A Component Atlas** (stable canvas/right inspector, explicit neighborhood) and **B Focus Workbench** (capability index/focused map/reading pane) against the reference and real tasks. Improve either or propose a substantially better alternative in your owned folder. Do not preserve composition out of sunk cost.

- Can a first-time developer identify Vivarium's major capabilities and source-backed component structure without reading 47 entries? Does the map earn its space?
- Which relationships belong on the default map, what collapses, and how do shared requirements remain navigable without a hairball? Map position is presentation, not dependency/ownership. Explain edge label/direction and origin/review/evidence separately.
- Are graph controls, zoom/pan/find/lenses, grouping, outline and inspector discoverable and keyboard-usable? What happens to a selection outside a filter? Source section → close must restore useful focus.
- Can one choose meaningful work without a fabricated recommendation, then switch to an authored, date-free roadmap? No task priority/dependency/schedule exists in current PTB. Gantt requires real future scheduling semantics, not decorative dates.
- No checkpoint → **no large empty Resume panel**. Saved context → concise visible next step and direct return to the same problem/target. Selection is not Start or an inferred session.
- Can new/existing-project formation and explicit bulk review minimize setup without silently accepting decisions, committing proposals or passing tests? Local source/working edits and later safe merge must remain understandable.
- Does the multi-format boundary preserve deterministic structured input, document-only Markdown, optional AI suggestions, user approvals and actual evidence distinctly? Don't draw hypothetical suggestions/results as facts.

Demonstrate: open project → overview → explore map → select component → inspect related information → exact source → Development roadmap → planned/current work distinction → authored checkpoint/History/Continue → narrower desktop. Use the real definitions; simulated state must be visibly labelled. Capture actual wide and narrow rendering; visual review is required in addition to any checks.

For each surface define goal, essential information, meaningful actions/connections, data/backend dependencies and loading/empty/error/large-project behavior. Include responsive detail replacement, no fourth column, reduced motion, readable labels/contrast and list/search alternatives to dragging. Identify small-component reuse (shadcn/Base UI) versus React Flow versus custom domain composition. No fake buttons or placeholders masquerading as working features.

## Deliver, report and stop

1. Ranked independent UX findings, agreed/disagreed VD1–VD5 recommendations, consequential alternatives and rationale.
2. Connected visuals/prototype and real wide/narrow screenshots with an explicit visual critique. Use your own paths only.
3. Worked Vivarium journey plus small unscoped Desk Notes and brief FieldLedger multi-scope assumptions. Separate actual source, simulated interaction and future backend behavior.
4. Reuse/defer/replace suggestions, component/data/security assumptions, smallest complete delivery path and at most five material decisions. Update proposals in your report; don't rewrite canonical contracts.
5. Concise action log: files inspected/changed, commands, actual checks/failures, environment limits, evidence paths and exact base/result commit SHAs. Do not repeat historical app test totals as your own run.

You may use at most two capable **lighter read-only review agents**, with explicit task/model/action records and no overlapping writers/implementation swarm. The user wants to review your actions later. No external messages or automatic model calls by the application are authorized.

Commit owned artifacts, report exact refs and stop. User manually returns your report to Codex. A positive design review is **not** permission for a migration, implementation or broad library adoption. No production BEGIN until the user accepts the redirected design and a concrete slice/schema is separately approved.
