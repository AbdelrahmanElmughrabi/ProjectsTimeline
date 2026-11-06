# ProjectsTimeline — Product & Architecture Alignment

Current authorization amendment: **V2 implementation authorized; Phase C integration underway.** See [contract](v2-preview-contract.md), [ADR 0007](adr/0007-blueprint-preview.md), [BEGIN](agent-handoffs/antigravity-v2-begin.md) and [live queue](agent-handoffs/v2-review-queue.md). Confirmed handoff/review led to types fix 838a8eb and bounded backend/UI work. Actual parser/preview bridge/Home navigation are implemented without migration/import. Final UI review fixes and combined verification remain; V1 manual history below is preserved. No V3a authorization.

2026-11-06 · **Design package approved with refinements; V1 only authorized.** Adopt explicit JSON-in-Markdown PTB, independent project-owned work/scopes, one current scope per action, audited lifecycle/moves, truthful development counts/Not Assessed and reviewed proposal/acceptance/source separation. Revisioned delivery capture is approved direction with its actual policy/schema deferred. [V1 plan](v1-home-plan.md) and [ADR 0006](adr/0006-home-project-continuity.md) describe the current implementation; V2/new migrations are not authorized. Existing ADRs/data remain intact.

## Current design package

| Deliverable | Review document |
| --- | --- |
| Revised PTB and validation | [PTB v0.2 contract](design/ptb-v0.2-contract.md): explicit entity blocks, single/multi-file equivalence, source/approval rules |
| Development ownership/lifecycle | [Domain contract](design/development-domain-contract.md): scope states, commitment, guarded moves/reopening and separate progress |
| Connected UX / information architecture | [Home/Project/Stages/Features/History/Resume](design/connected-workspace-design.md): reference-inspired visual continuity, selection and failures |
| Requirements through implementation | [Traceability map](design/product-traceability.md): PA-01–18 → screens → commands/domain → persistence → acceptance |
| Dependency roadmap | [Implementation slices](design/product-implementation-roadmap.md): usable paths and schema/policy gates |
| Worked specification review | [Two examples and release-free journeys](design/ptb-v0.2-examples.md): 15-record single-file Desk Notes and 37-record/four-file FieldLedger |

The original v0.1 package stays unchanged as design history. v0.2 syntax is adopted, but not an installed format/parser; stable PTB presentation/order and concrete parser tooling must be finalized before V2. Rich linked continuation is prioritized immediately after V3a. No implementation agents have been started. Earlier inspection findings below remain useful; the current contracts supersede the rejected file-per-entity recommendation.

## Evidence and current implementation versus intended product

Read the [PTB contract](../projectstimeline_ptb_v0.1/PTB_Planning_Traceability_Contract_v0.1.md), [roadmap](../projectstimeline_ptb_v0.1/Implementation_Roadmap_and_Checklist_v0.1.md), nested [README](../projectstimeline_ptb_v0.1/projectstimeline_ptb_v0.1/README.md) and all eight [example documents](../projectstimeline_ptb_v0.1/projectstimeline_ptb_v0.1/example/project.md) first. Root/nested contract and roadmap copies are byte-identical; README/example are nested only. The supplied, currently untracked package stays unchanged. PTB remains draft.

Inspected source at `f1c8b76`, schemas 001–003, contracts/IPC/security, renderer/hooks, test cases, existing roadmap and ADRs. Last **recorded**, not freshly rerun here: **47 Node + 12 Electron + 3 packaged = 62 checks** ([evidence](verification.md)). Manual acceptance remains separate. This pass changes documentation only.

| Area | Actual code | Intended evolution / reuse |
| --- | --- | --- |
| Project formation/Home | Projects store only name/time; sidebar selection and welcome screen ([App](../src/renderer/App.tsx), [001](../src/main/data/migrations/001_initial.sql)) | Recognizable Home, goal/overview and factual activity; PTB preview/formation. Reuse project creation/navigation, shell, Panel and design tokens. |
| Development work | Project actions can already be completed without releases; rich definitions exist. Commitment, stages, exclusions and revisions belong to releases ([store](../src/main/data/database.ts), [contracts](../src/shared/contracts.ts)). | Permanent components/features/requirements, explicit proposals/commitments and optional development scopes. Preserve lightweight unscoped work. |
| Workflows/progress | Independent copied definitions, version checks, full editor; every loaded template requires one protected final stage. Release progress requires its confirmation action ([workflow data](../src/main/data/workflows.ts), [policy](../src/main/progress.ts)). | Reuse authoring/copy/isolation patterns; add explicitly development-oriented workflows and a separately approved development policy. No automatic release gate. |
| Context/history | Project-level accomplishment/next-step checkpoint, deterministic latest selector, action audit; no problem/intention/questions or feature/scope links ([Resume](../src/renderer/ResumePanel.tsx), [selector](../src/main/resume.ts)) | Preserve journals; add optional authored context/links and connected History/inspector. No inferred intent, sessions or elapsed time. |
| Traceability/views | No component, feature, requirement, decision, check-plan, source-document or import entities. No Stages/Features/History switcher. | Three projections of shared identities; exact readable Markdown and explicit relationships. A planned check is not a run; completion is not verification. |
| Reliability/security | Main-owned SQLite, transactional writes, backup/version/FK migration checks; 30 named APIs; sandbox, sender/frame/exact-URL validation and restrictive CSP | Retain these boundaries and acknowledged-write/read-only-retry semantics. Add bounded named import commands, not renderer filesystem access or generic IPC. |

## Conflicts, contract gaps and migration risks

1. **Release ownership:** `release_actions.action_id` is a primary key; membership cannot move/delete, and confirmed actions/details/stages freeze ([002](../src/main/data/migrations/002_release_progress.sql), [003](../src/main/data/migrations/003_workflow_templates.sql)). Renaming releases to scopes, hiding confirmation or sharing their action rows with mutable development work breaks invariants. Preserve active and confirmed v3 releases without automatic conversion.
2. **Workflow semantics:** release verification/preparation/distribution content remains release-specific even after removing the gate. User templates/stages have no portable author-facing keys. Resolve PTB `workflow_key`/`stage_hint` explicitly, never by title or silent default.
3. **Executable syntax:** finalize ID grammar/prefixes, types/enums/defaults/bounds, capability/rule registries and draft-version compatibility. Specify YAML duplicate keys/aliases/tags, UTF-8/BOM/newlines, directory/archive input, path case/junction/symlink behavior and limits. YAML/Markdown parsers are absent; approve maintained parser dependencies before implementation, not handwritten YAML.
4. **One-file and relationships:** the v0.1 one-entity/document restriction was rejected. The revised v0.2 uses multiple explicit record blocks per file, typed links and goal metadata; arbitrary headings still create nothing. New single/multi-file examples and review results are linked above. Missing acceptance warns; malformed/dangling/cyclic ownership blocks; unknown metadata stays inert. Production parsing/security and actual application journeys remain unimplemented.
5. **Approval/change authority:** project creation cannot approve decisions, commit all actions or produce verification. Define per-action adoption, workflow selection and preserved proposal origins. File renames change provenance, not identity. Preview changes, repeat imports, local/source conflicts, requirement revisions and evidence freshness need policies. Later rule deduplication needs rule/version/target bindings; `covers_rule_ids` alone can hide distinct obligations.

Migration tests must compare populated v3 IDs/text/times/completion, journals/events, release scope/policy/origin, verification/confirmation and templates. Keep release-bound actions bound; offer explicit legacy-backlog adoption without invented approvals/imports. Append numbered migrations (004 next if unchanged), preserve 001–003, backup/rollback/newer-schema refusal. Use isolated profiles.

## Proposed architecture evolution

Keep React → typed preload/IPC → main validation/domain → SQLite. Add focused parser/planning code and store methods as their slices need them; no new execution engine, ORM, parallel durable UI store or architecture rewrite.

- **Permanent records:** acyclic components, persistent features, revisioned requirements/acceptance and explicit same-project links, including many-to-many requirement relationships. Workflows do not own requirements; action type `requirement` does not create a requirement.
- **Independent work:** reuse ordinary `actions`/`action_details` with explicit proposal/commitment context and optional scope/stage membership. Recommend one current scope/action; features span scopes. Unscoped commitments remain valid. Keep v3 release-bound rows outside this mutable path; preserve reassignment history. Concrete tables/lifecycle require approval.
- **Organization:** future development/release template purpose; existing editions remain release-purpose. Explicit new development editions have no protected release gate. Reuse editor/copy/isolation with purpose-specific validation; stage list/progress need approval.
- **Source:** immutable bytes/text/hash, path, source locations, PTB identity and import receipts, separate from accepted state/events. Use `(workspace project, PTB ID)` and package-wide uniqueness, never filename/title/SQLite import identity. Preserve proposed decisions/planned checks and their links without approvals/runs. Add only slice-needed tables.
- **Delivery later:** retain v3 releases; capture selected development revisions/definitions/source links in independent snapshots. Mutable development completion must not drive historical readiness. Approve capture/evidence rules separately.

Import boundary: main-owned picker/root → bounded declared-file reads → pure validated graph → immutable main-owned preview → approved transactional apply/receipt. Never trust renderer-supplied graphs or silently reread changed input. Preview/cancel writes nothing. Source-byte hashes and semantic identity are distinct. Inert source rendering must not execute HTML/scripts, fetch links/images or broaden filesystem serving. Reimport waits for reviewed conflicts.

## Journeys, UX and backend dependencies

Names below are candidate operations, not implemented APIs.

| Journey/screen | Operations / domain / persistence dependencies |
| --- | --- |
| Home → project overview → Resume | Extend project summary query with latest **recorded** checkpoint/event and authored identity/goal where available. Empty activity stays empty. Reuse navigation/Resume; avoid fetching every full project per card. |
| Choose PTB → source/graph preview → review/cancel | Named chooser/preview command; safe acquisition → strict parse → typed validation/diagnostics → deterministic proposals. No SQLite writes or required model/network. |
| Approve project → inspect feature/requirement → adopt action | Named atomic apply/adopt commands; source receipt/IDs, permanent graph, optional scope and explicit commitment. Imported decision stays proposed; check stays planned. |
| Work in optional scope → Stages / Features / History | Scope/stage assignment and completion commands; shared project action IDs and relationship queries. Stage-less work shows Unspecified; tabs retain selection. Feature state is not an inferred percentage. History combines actual events/journals with stable links, not fabricated migration events. |
| Save context → reopen → continue | Extend checkpoint with optional problem/intention/questions/record links while preserving old fields/times. Keep project isolation, deterministic latest choice, draft/error and stale-read behavior. |
| Choose delivery → verify → confirm | Later explicit snapshot/revision commands; existing release provenance, latest passed current-revision requirement and frozen history remain separate from development completion. |

## Prioritized complete slices and acceptance criteria

The [updated dependency roadmap](design/product-implementation-roadmap.md) replaces the initial broad slice list. It separates Home, safe preview, lightweight project formation, optional scoped work, reusable development workflows, rich context, decisions, evidence, reviewed reimport, suggestions and later delivery capture. Each usable path traces to [PA-01–18](design/product-traceability.md), with concrete schema/policy and user-acceptance gates. Existing tests/security/history remain preservation requirements. Git/Obsidian product integration, models, personalization and pattern recognition remain future proposals.

## Approval record and remaining gates

The user approved the five design decisions with refinements. Do not request those approvals again or infer blanket implementation authorization:

1. **Format adopted:** PTB v0.2 explicit JSON/Markdown, single/multiple files, Markdown-aware recognition, duplicate-key rejection, intact narrative and deterministic relationship validation. Stable presentation/order and parser choice are pre-V2 gates; no parser is implemented in V1.
2. **Domain adopted:** independent project records, optional scopes, one current scope/action, explicit lifecycle and audited reassignment. Concrete additive SQL/DTO/constraint design remains a separate pre-migration review; no release conversion.
3. **Progress adopted:** truthful counts and Not Assessed initially. No development percentage or release gate transfer until a separate development percentage policy is approved.
4. **Application adopted:** explicit requirement/action acceptance, proposals uncommitted by default, immutable source provenance, atomic/idempotent reviewed import and no implicit overwrite. No AI runtime/model needed.
5. **Roadmap adopted as direction:** V1 only now; richer linked recovery immediately after V3a, before optional scoped/library depth. Recommendations remain a separate later slice and are absent initially. V2, evidence freshness and delivery snapshot policy/schema require their explicit future gates.

## Antigravity collaboration

Use the [copy-ready handoff prompt](antigravity-collaboration-prompt.md) for an independent review now and bounded assigned implementation after approval. Antigravity is an external development collaborator, not an application feature. One integration owner controls each slice, migrations and shared contracts. The initial inspection used lighter read-only agents; this revised-design phase started no agents or Antigravity session. Parallel implementation remains unapproved.

**Stop:** after V1 verification/manual review. This design approval authorizes no V2 implementation, migration or dependency installation.
