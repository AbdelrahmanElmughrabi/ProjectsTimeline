# ProjectsTimeline — Product & Architecture Alignment

2026-11-06 · **V3 Product Experience design/review only.** V1 Home and V2 Deterministic Preview are implemented and automatically verified; user acceptance remains separate. No V3 app feature, migration or dependency installation is authorized by this package. [V2 final report](v2-verification-report.md) preserves exact runtime evidence; the earlier alignment/design history remains in Git at b16f212 and prior checkpoints.

## Current review package

| Deliverable | Canonical document |
| --- | --- |
| V3 Product Experience Contract | [Outcomes, real examples and five decisions](design/v3-product-experience-contract.md) |
| Connected Workspace UX Blueprint | [Hierarchy, alternatives, screens/states and context recovery](design/connected-workspace-design.md) |
| Blueprint Adoption & Merge Policy | [New formation, explicit attachment, source authority and three-way review](design/blueprint-adoption-merge-policy.md) |
| Domain-to-View Mapping | [PA-01–24 → screens → candidate operations → persistence → acceptance](design/product-traceability.md) |
| V3 Implementation Roadmap | [Small complete paths, dependencies and schema/verification gates](design/product-implementation-roadmap.md) |
| Antigravity V3 design handoff | [Standalone copy-ready prompt](agent-handoffs/antigravity-v3-workspace-design.md); manually delivered by the user, no launch |
| Reviewable visual study | [Standalone interactive simulation](design/v3-workspace-prototype.html); no app integration, storage or model |

Approved foundation contracts remain [PTB v0.2](design/ptb-v0.2-contract.md), [development ownership/lifecycle](design/development-domain-contract.md), [V2 preview-1](v2-preview-contract.md) and [ADRs 0001–0007](adr/0007-blueprint-preview.md). New V3 refinements are explicitly drafts, not retroactive changes to those approvals. The original supplied v0.1 folder stays untouched/untracked.

## Actual implementation versus intended product

Inspection is grounded in src/shared/contracts.ts; renderer App, ProjectHome, ResumePanel, ReleaseWorkspace, WorkflowLibrary and blueprint-preview; main acquisition/parser/graph/session, IPC/store; migrations 001–003; existing tests and ADRs. Baseline source bb2fd95 / records b16f212. Last executed full suite: **78 Node + 21 Electron/UI + 4 packaged = 103 passing cases, zero skips**. This design phase does not rerun those app tests or claim V3 runtime verification.

| Current code | Intended evolution / reuse |
| --- | --- |
| Home reads actual project/checkpoint/activity summaries; Project stores name/time, not an authored product goal | Reuse Home/shell/Panel/tokens; add recognizable goal, explicit focus and linked next step only when those records exist. No inferred sessions/stats. |
| Deterministic V2 capture/parse/strict validation, exact source and useful diagnostics; renderer emphasizes eight technical entity groups | Reuse the parser/acquisition and technical source tools. Lead future review with goal/features/organization/effects and progressive disclosure, not another raw inventory. |
| Existing ordinary actions can be completed without releases; rich checklist details and project checkpoints work | Add project graph, definition revisions and guarded proposal/commitment context. Preserve legacy action IDs/completion/history and old journals without fabricated adoption events. |
| Releases own stages, progress, protected confirmation, evidence revisions and frozen historical releases | Keep delivery separate. Independent development scopes must never repurpose release rows or transfer their gates/percentages. |
| Workflow copying/versioning/isolation and editor exist; templates are release-purpose | Reuse architecture later for explicit development-purpose editions. Valid inline PTB stage plans can organize early work without a new library prerequisite. |
| Resume returns to a generic action input; checkpoints hold accomplishment/nextSteps, no durable engineering target/problem/questions | Linked optional context, current/historical record navigation and exact saved-intention recovery, prioritized immediately after formation. |
| Main SQLite transactions, backup/version checks; fixed 34-method typed bridge; sandbox, context isolation, trusted sender/frame/URL and restrictive CSP | Preserve trust boundaries and acknowledged-write/read-only-retry behavior. Add named validated commands per slice, not a filesystem/SQL/graph execution channel. |

These are product gaps, not automatic evidence that the V2 parser/backend failed. The primary acceptance path becomes **understand blueprint → approve explicit work → organized development → saved context → Continue**, without creating a release.

## Real-case review and contract gaps

The exact Vivarium package was read from C:/Users/fireball/OneDrive/Desktop/3d pet generator/projects-timeline-test, without running/editing that application. Existing compiled V2 capture accepts both valid versions: **47 records, 86 links, seven features, one four-stage scope**. Nine actions are scoped, one unscoped. Desk Notes (15/29) proves lightweight unscoped work; FieldLedger (37/82) supplements two-scope behavior. The deliberate invalid Vivarium package remains inspectable/blocked.

Single/multi Vivarium metadata/relationships agree, but four narrative bodies differ, so narrative-inclusive hashes correctly differ. Reviewer questions include the clean-room wording versus proposed Three.js, performance reference hardware and reproducibility environment. They are human questions, not app-detected contradictions or automatically accepted decisions. Full findings/walkthroughs are in the experience contract.

PTB v0.2 does not express task priority/dependencies/blockers/schedule/start hints. Stage order is organization, not readiness or urgency. Recommend ordinal stage and feature workmaps first, explicit local ordering/blockers later; separately approve versioned metadata before supporting dependency/calendar/recommendation behavior. No automatic current stage, development percentage or critical path.

## Architecture evolution and risks

Keep React → typed preload/IPC → main domain validation → SQLite. Existing helpers/controllers/patterns remain; no generic execution engine, ORM or second durable renderer store.

- Permanent components/features/revisioned requirements and same-project typed links; one action identity across Stages/Features/History. Action type requirement does not itself create a requirement entity.
- Immutable source/capture/location plus project-bound external IDs and idempotent reviewed receipts, separate from local revisions and operational history. A name/file path never identifies a merge target.
- Additive development context on ordinary action IDs/details with commitment/work-state guards, optional independent scope/stage instances and membership history. Old generic completion/assign APIs must not bypass those guards. Confirmed release ownership/triggers are protected.
- Capture/source approval is not requirement verification. Preserve proposed decisions/check definitions first; accepted decisions and actual assessment/freshness interactions wait for explicit slices/policies.
- Later revisioned delivery snapshots remain approved direction only; schema/migration stays deferred. No live join from mutable development completion to historical release readiness.

Before any concrete numbered migration, review keys/constraints/revision semantics and populated-v3 preservation tests: IDs/text/times/completion, events/checkpoints, template origins, active/frozen release scope/evidence/confirmation. Keep 001–003 unchanged; consistent backup, pending-batch rollback, FK checks, newer-schema refusal and rebuilt packaged recovery remain mandatory. Do not convert legacy releases into scopes or invent past import/approval events.

## Approval and collaboration boundary

Already approved: explicit JSON-in-Markdown single/multi-file PTB and deterministic source capture; independent project-owned records/optional scopes and audited lifecycle; counts/Not assessed; reviewed acceptance/source/proposal separation; no required AI runtime. Do not reopen those decisions.

Only **five new consequential choices D1–D5** are requested in the experience contract: first useful delivery/bulk effects; workspace visual model; source binding/update authority; explicit work state/focus/blockers; version boundary for missing planning semantics. Concrete SQL/DTO review still precedes implementation. Git/Obsidian product integration, models, personalization, pattern recognition, workflow synchronization and release snapshots are later work.

Codex owns canonical architecture/integration documents. Antigravity independently challenges UX in its isolated V3 design branch/worktree and writes only assigned reports/prototypes; no assumed live communication, production edits or automatic merge. Two lighter Codex read-only reviewers informed this proposal; no parallel implementation agents were launched. Exact frozen handoff ref and report protocol are in the standalone prompt.

**Stop for user/Antigravity design review. Do not implement V3 or install dependencies from this document.**
