# ProjectsTimeline — Product & Architecture Alignment

2026-11-07 · **Current phase: V3 Visual Engineering Workspace redirection — design, assessment and isolated prototypes only.** No production V3 features, migrations, importers or dependencies are implemented here. Preservation checkpoint **47f73c6** includes the UI tooling setup and paused research; prior V2 implementation/history is retained.

## Review package

| Requested deliverable | Evidence / canonical document |
| --- | --- |
| Diagnosis and recommended product direction | [V3 experience contract](design/v3-product-experience-contract.md): actual V2/paused-V3 gaps and VD1–VD5 for approval |
| Two distinct visual concepts and connected interaction system | [UX blueprint](design/connected-workspace-design.md): Component Atlas versus Focus Workbench, screens/states/semantics |
| Interactive Vivarium prototype and actual wide/narrow screenshots | [Run/inspect instructions and images](design/v3-visual-prototype/README.md) |
| UI component/tooling inventory | [Installed versus adopted/runtime-tested](design/v3-ui-component-inventory.md) |
| Multi-format ingestion boundary | [Adapters, source, identities, suggestion/review/evidence layers](design/multi-format-ingestion-design.md) |
| Domain-to-view requirements and adoption policy | [PA-01–25 map](design/product-traceability.md), [adoption/merge](design/blueprint-adoption-merge-policy.md), [ownership/lifecycle](design/development-domain-contract.md) |
| Revised scope/staged plan | [Dependency roadmap](design/product-implementation-roadmap.md), concrete next-slice/SQL gates |
| Future UI and engineering possibilities | [Dedicated backlog](design/visual-engineering-backlog.md), purpose/value/prerequisites/horizon |
| Independent external design collaboration | [Copy-ready Antigravity prompt](agent-handoffs/antigravity-v3-workspace-design.md); user manually delivers; no launch/live-channel assumption |

## Grounded current state and reuse

V1 Home and V2 deterministic Preview are implemented. Existing shared contract/preload/main/store/security, renderer Home/Resume/ReleaseWorkspace/WorkflowLibrary/Preview, schemas 001–003, tests/ADRs and source fixture contracts were inspected. Last V2 full verification: 78 Node + 21 Electron/UI + 4 packaged = 103 passes, separate manual acceptance. Fresh design-phase execution is recorded in verification.md, not substituted for a full V3 runtime claim.

Keep the validated main-owned PTB acquisition/parser/session, strict JSON/relationship validation, exact source, narrow typed IPC/Result/controller patterns, SQLite transactions/backups, release gates/history, Resume selector and graphite/violet tokens. Current projects do not yet persist product goals/permanent development graphs, source bindings/receipts or linked engineering checkpoints; no design DTO makes them implemented.

The original reference guides hierarchy/coherence; neither it nor the paused board/card composition determines the new workspace. A **primary semantic map**, secondary date-free Development roadmap, actual History and one contextual inspector replace the raw-record-first experience. Resume is conditional on saved context, not a permanent empty rail. Source-defined structure is not a runtime dependency graph; plans/approvals/completion are not verification.

| Existing material | Disposition and reason |
| --- | --- |
| V2 parser/capture/diagnostics and source UI logic | Reuse; not a backend failure. Human summary/map is a projection over the same validated input. |
| Stable Home/actions/checkpoints/release/workflow architecture | Preserve and incrementally extend after approval, not a library-driven rewrite. |
| Domain ownership/lifecycle, source/receipt/merge research and small/multi-scope fixtures | Reuse; foundational integrity outlives a layout. New work-state/blocker commands remain proposed, not silently approved. |
| Paused stage-board-first prototype, repeated feature cards, inspector below long lists, empty Resume rail | Replace as the target composition; retain historical research at 47f73c6 and original HTML, which is superseded by the new study. |
| Existing release-owned stages/progress/confirmation | Preserve exclusively in delivery subsystem. Never rename/repurpose them as development scopes. |
| Tailwind/shadcn/Base UI/React Flow/ELK setup | Verify/use where useful in isolation; no generated shadcn app components yet. Do not overwrite setup or broaden security to adopt libraries. |
| Date Gantt, dependency editing, AI/Markdown/Obsidian/OpenSpec/Spec Kit adapters, learning/personalization | Record prerequisites, defer implementation. No synthetic engineering data or format initialization. |

## Data/source and migration risks

Real Vivarium was read without editing/executing its application: 47 definitions/86 typed links, seven features, **one** four-stage scope; nine scoped actions plus one unscoped. Single/multi metadata/links match, four narrative bodies do not; exact source/hash differences remain. Desk Notes/FieldLedger remain the small and multi-scope supplements. Human questions (clean-room versus Three.js, performance/reproducibility environment) are not app-detected conflicts.

Evolution stays React → typed preload/IPC → main validation/domain → SQLite. Future additive source/binding/receipt and typed project definitions/revisions/links must separate external adapter identities from internal IDs and operational state. Source assertions, AI proposals, user review and actual evidence are independent. Ordinary Markdown captures documents/headings/links; arbitrary prose never creates engineering entities.

No concrete SQL approved here. Before any numbered migration: same-project/typed/revision guards, legacy action-command protection, atomic receipts/failure/retry, consistent backup/rollback, FK/newer-schema refusal and populated-v3 exact preservation/rebuilt packaged restart. Migrations 001–003/ADRs unchanged. Confirmed releases are immutable; future development-to-release snapshot policy/schema remains deferred.

## Stop and review

Already approved foundations stay approved: deterministic PTB, independent project-owned development records/optional scopes, audited lifecycle, reviewed commitment/source separation, counts/Not assessed, no required AI, protected delivery history. New **VD1–VD5** concern the visual direction, map semantics/editing limit, multi-source authority, navigation/conditional recovery and staged delivery gate. Concrete schema/commands remain later approval boundaries.

Codex owns canonical design/integration; Antigravity owns only isolated review/prototype/report paths. Two lighter read-only Codex reviewers informed the redirection. The external prompt is ready for manual delivery; no Antigravity launch or production implementation is implied. Inspect both rendered concepts, review limitations and involve Antigravity before selecting a production slice.
