# ProjectsTimeline — Product-first roadmap and engineering checklist v0.1

**Status:** Proposed order based on the current `main` branch and product discovery. Passing automated regression tests demonstrate implemented foundations, not product acceptance.

## Preserve and verify the baseline

- [x] Electron + SQLite local-first foundation; typed IPC, security boundaries, migrations.
- [x] Project create/open; action backlog; checkpoints and basic Resume.
- [x] Release-scoped stages, progress, audit and confirmation provenance.
- [x] Persistent Workflow Library and independent release copies.
- [ ] **User manual acceptance** of current stage/workflow UX, progress behavior and release isolation; push verified commits if needed.

## Design gate — before another feature migration

- [x] Product intent: minimize mental effort to resume complex development.
- [x] Development work can exist **without** a release.
- [x] Permanent project-level features; flexible small feature / larger scope organization.
- [x] Alternate Stages / Features / History projections, same underlying records.
- [x] External LLM may author PTB; app import and planning is **AI-free and deterministic**.
- [x] Hybrid planning: explicit plan plus optional explainable recommendations, user approval.
- [ ] Approve PTB 0.1 syntax, IDs, relationship meanings, provenance and validation categories.
- [ ] Validate with a real small and real complex project package; revise any confusing structure.
- [ ] Approve development-scope lifecycle and progress policy **separate from release gate**.
- [ ] Map journeys/screens to requirements and testable acceptance criteria.
- [ ] Approve additive SQLite migration/typed-command/UX plan with legacy compatibility tests.

## Implementation roadmap — testable vertical slices

### A. Deterministic PTB import and project formation
- [ ] Parser/schema validator with strict IDs, safe paths and source preservation.
- [ ] Import preview and warnings; user approves; atomic new-project creation.
- [ ] Project components/features/requirements, optional development scope and action commitments.
- [ ] Test no-network/no-model, duplicate IDs, malicious packages, rollback, restart and existing DB upgrade.

### B. Connected development workspace
- [ ] Home project gallery/list with recognizable project identity and factual activity metrics.
- [ ] Project overview and Resume focus; no release prerequisite.
- [ ] Switchable Stages / Features / History with selection persistence and detail inspector.
- [ ] Compact/lightweight feature work and larger-scoped feature/component work.
- [ ] Test that one record is not duplicated across projections and is navigable in both directions.

### C. Engineering depth and traceability
- [ ] Requirement revisions and acceptance criteria; actions linked to requirements/features/scopes.
- [ ] Decision rationale/alternatives/status-history; actual test runs/evidence linked to requirements.
- [ ] Rich, quick checkpoints: current problem, intention, unresolved question, next action; factual activity links.
- [ ] Deterministic suggestion catalog with explainable rule IDs, review and safe commitment.
- [ ] Reimport diff and conflict resolution; historical source retention.

### D. Release integration
- [ ] Select a release's deliverable from development outputs with a revision/snapshot policy.
- [ ] Preserve existing confirmed v3 releases and current verification/freeze invariants.
- [ ] Distinguish development completion from verification and distribution readiness.

### E. Product refinement, then extensions
- [ ] UI density, timeline interactions, navigation, shortcuts, accessibility and theme customization.
- [ ] GitHub/Git commit and issue references (explicit links before optional auto discovery).
- [ ] Optional Markdown/Obsidian link collections and indexing; Knowledge Atlas stays separate.
- [ ] Local-model authoring helpers, personal development styles and pattern recognition only after reliable structured data and privacy/consent design.

## Definition of done for every milestone

Each delivered slice must trace **requirement -> interaction -> domain rule -> persistence -> regression/acceptance test**. Test unhappy paths, recovery and migration preservation; inspect actual compact/wide UI; record manual usability results. Demonstrate the end-to-end user journey, not merely a table or component.

## Highest-risk compatibility issues

1. Existing reusable seven-stage template is built around a release-only protected closing gate. It cannot be applied unchanged to development-only scopes.
2. The existing `actions` record can be project backlog or bound to one release. A new relation model must not move or reinterpret frozen historical release actions.
3. Imported source text, accepted requirements, and live progress have different change authorities. Prevent reimport from modifying the latter without explicit approval.
4. History contains recorded events and human-entered reasons; it must not infer intent or elapsed work from timestamps.
