# ProjectsTimeline — Product & Architecture Alignment

2026-11-09 · **V3a1a implemented and verified, with UX stabilization accepted.** Reviewed PTB capture forms a durable knowledge project with Overview, interactive Map and exact stored source. [Stabilization acceptance and open checks](v3a1a-stabilization-verification.md#manual-acceptance) · [ADR 0008](adr/0008-durable-knowledge-formation.md) · [Current roadmap](design/product-implementation-roadmap.md).

## Product direction and decision handoff

ProjectsTimeline helps a developer understand a complex project and return to it without reconstructing the context from memory. Decisions and their reasoning, unresolved problems, actual work and the next step should be easy to find. The workspace should make disciplined engineering approachable for developers who are still learning it.

The direction is a visual engineering workspace. Explore source-backed components, features, requirements and relationships, see what needs attention, then record meaningful activity and resume from it. Multiple reviewed sources, ordinary Markdown and Obsidian notes, and optional external engineering tools could extend this journey through individually reviewed integrations. [Experience contract](design/v3-product-experience-contract.md) · [Source ingestion design](design/multi-format-ingestion-design.md).

Established decisions guide each slice:

- Preserve provenance and authored relationship semantics. Keep proposals, commitments, actual work and verified outcomes distinct. Any AI-assisted interpretation stays optional and reviewable.
- Keep diagram position and layout as presentation state. Make the UI responsive and approachable while preserving traceability to exact captured source.
- Deliver complete vertical slices that preserve compatibility and existing records. Revisit decisions when new evidence warrants it and retain the rationale and history. [Engineering workflow](engineering-workflow.md) · [Formation ADR](adr/0008-durable-knowledge-formation.md).

V5a linked continuity is next for design approval. The planned order then moves to selective action adoption, optional development scopes and development-purpose workflows. Focus Canvas, live source navigation, a unified workspace, multi-source attachment, a date-free roadmap, conditional Gantt, richer diagram semantics, optional AI assistance and MCP remain proposals in the [visual engineering backlog](design/visual-engineering-backlog.md). [Delivery sequence](design/product-implementation-roadmap.md#smaller-complete-vertical-slices).

## Review package

| Requested deliverable | Evidence / canonical document |
| --- | --- |
| V3a1a implementation and acceptance | [Five named operations and map design](design/v3a1a-implementation-proposal.md), [approved 004 SQL and guards](design/v3a1a-schema-proposal.md), [packaged evidence](v3a1a-verification-report.md) |
| Consolidated decisions / independent code and design review | [A/B/C comparison, adopt/modify/reject and production reuse findings](design/v3-consolidated-review.md) |
| UI-to-backend capability audit | [Real data, parser/IPC/persistence, simulation, validation and smallest steps](design/v3-capability-audit.md) |
| Diagnosis and recommended product direction | [V3 experience contract](design/v3-product-experience-contract.md): actual V2/paused-V3 gaps and VD1–VD5 for approval |
| Two distinct visual concepts and connected interaction system | [UX blueprint](design/connected-workspace-design.md): Component Atlas versus Focus Workbench, screens/states/semantics |
| Interactive Vivarium prototype and actual wide/narrow screenshots | [Run/inspect instructions and images](design/v3-visual-prototype/README.md) |
| UI component/tooling inventory | [Installed versus adopted/runtime-tested](design/v3-ui-component-inventory.md) |
| Multi-format ingestion boundary | [Adapters, source, identities, suggestion/review/evidence layers](design/multi-format-ingestion-design.md) |
| Domain-to-view requirements and adoption policy | [PA-01–25 map](design/product-traceability.md), [adoption/merge](design/blueprint-adoption-merge-policy.md), [ownership/lifecycle](design/development-domain-contract.md) |
| Revised scope/staged plan | [Dependency roadmap](design/product-implementation-roadmap.md), concrete next-slice/SQL gates |
| Future UI and engineering possibilities | [Dedicated backlog](design/visual-engineering-backlog.md), purpose/value/prerequisites/horizon |
| Independent external design collaboration | [Original Antigravity assignment/status](agent-handoffs/antigravity-v3-workspace-design.md); delivery received at 92a7129, no new assignment/production BEGIN |

## Grounded current state and reuse

V1 Home, V2 deterministic Preview and V3a1a formation are implemented. Migration 004 is additive. Existing Home, Resume, releases, workflows and the renderer security policy remain in place. The latest execution covered the full Node, Electron and rebuilt packaged recovery suites. [Verification record](verification.md).

V3a1a reuses main-owned PTB acquisition and validation, narrow typed IPC, SQLite transactions and existing UI tokens. Formed projects persist goals, engineering definitions, links, bindings, exact captures and receipts. Linked engineering checkpoints are the next independent design gate.

The original reference guides hierarchy/coherence; neither it nor an existing prototype fixes the new composition. Recommend **refined C**: a spoke-free component/capability index and deliberate source-backed relationship neighborhoods, one inspector and readable compact alternative. Secondary Development/History and intentional linked context follow their actual data/command slices. Resume is conditional; map position/path distance/source assertion is not dependency, priority or verification.

| Existing material | Disposition and reason |
| --- | --- |
| V2 parser/capture/diagnostics and source UI logic | Reuse; not a backend failure. Human summary/map is a projection over the same validated input. |
| Stable Home/actions/checkpoints/release/workflow architecture | Preserve and incrementally extend after approval, not a library-driven rewrite. |
| Domain ownership/lifecycle, source/receipt/merge research and small/multi-scope fixtures | Reuse; foundational integrity outlives a layout. New work-state/blocker commands remain proposed, not silently approved. |
| Paused stage-board-first prototype, repeated feature cards, inspector below long lists, empty Resume rail | Replace as the target composition; retain historical research at 47f73c6 and original HTML, which is superseded by the new study. |
| AG Concept C at 92a7129 | Keep isolated research, improve its visual model; do not copy its replacement-set adoption, source fallbacks, layout/state/controller or fixtures wholesale. Existing explicit edges do not become inferred because they are two hops away. |
| Existing release-owned stages/progress/confirmation | Preserve exclusively in delivery subsystem. Never rename/repurpose them as development scopes. |
| Tailwind/shadcn/Base UI/React Flow/ELK setup | Verify/use where useful in isolation; no generated shadcn app components yet. Do not overwrite setup or broaden security to adopt libraries. |
| Date Gantt, dependency editing, AI/Markdown/Obsidian/OpenSpec/Spec Kit adapters, learning/personalization | Record prerequisites, defer implementation. No synthetic engineering data or format initialization. |

## Data/source and migration risks

Real Vivarium was read without editing/executing its application: 47 definitions/86 typed links, seven features, **one** four-stage scope; nine scoped actions plus one unscoped. Single/multi metadata/links match, four narrative bodies do not; exact source/hash differences remain. Desk Notes/FieldLedger remain the small and multi-scope supplements. Human questions (clean-room versus Three.js, performance/reproducibility environment) are not app-detected conflicts.

Evolution stays React → typed preload/IPC → main validation/domain → SQLite. Future additive source/binding/receipt and typed project definitions/revisions/links must separate external adapter identities from internal IDs and operational state. Source assertions, AI proposals, user review and actual evidence are independent. Ordinary Markdown captures documents/headings/links; arbitrary prose never creates engineering entities.

No concrete SQL approved here. Before any numbered migration: same-project/typed/revision guards, legacy action-command protection, atomic receipts/failure/retry, consistent backup/rollback, FK/newer-schema refusal and populated-v3 exact preservation/rebuilt packaged restart. Migrations 001–003/ADRs unchanged. Confirmed releases are immutable; future development-to-release snapshot policy/schema remains deferred.

## Stop and review

Already approved foundations stay approved: deterministic PTB, independent project-owned development records/optional scopes, audited lifecycle, reviewed commitment/source separation, counts/Not assessed, no required AI, protected delivery history. New **VD1–VD5** concern the visual direction, map semantics/editing limit, multi-source authority, navigation/conditional recovery and staged delivery gate. Concrete schema/commands remain later approval boundaries.

Codex owns canonical design/integration; Antigravity's original reports/prototype remain on its isolated branch. All three reports were read directly; a redirected copy of its actual harness passes, and additional probes independently reproduce adoption/provenance/layout/focus gaps. Two lighter read-only Codex reviews supplement those checks. No new external assignment/automatic merge follows.

The user approved refined C and the smaller delivery sequence: durable knowledge formation, **immediate linked recovery**, unscoped adoption, then optional inline scope activation. V3a1a shipped under ADR 0008. The [V5a proposal](design/v5a-linked-development-continuity.md) awaits implementation approval. Extra graph digests, v0.1 support, generic format tiers, MCP and later operational/evidence/snapshot schemas retain separate design gates. Antigravity's prototype remains research.
