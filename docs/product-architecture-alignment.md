# ProjectsTimeline — Product & Architecture Alignment

2026-11-06 · **Analysis/proposal only; implementation and migration approval pending.** Product intent is development/context recovery first; releases are separate delivery records. Existing approved behavior remains valid. This document proposes extensions, not retroactive changes to ADRs 0001–0005.

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
4. **One-file and relationships:** current syntax is one entity/document; a minimal `project.md` contains project narrative, not heading-inferred feature/actions. Add that fixture plus real small/complex packages. Project goal/summary also needs an explicit field or authored narrative presentation, never extraction by guesswork. Define typed edges (`action.requirements → addresses`, `check.requirements → verifies`, decision links → affects), target kinds and duplicate/multiple links. Missing acceptance warns; malformed/dangling/cyclic ownership blocks; unknown metadata warns and stays inert. Example paths/IDs/links look consistent by inspection, not parser execution.
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

PTB's suggested first slice combines too many new systems for one review. Split it into usable paths; gate every migration on an approved concrete schema. Each row includes typed commands, ownership validation, persistence where needed, UI and tests—not isolated backend scaffolding.

| Order | Deliverable | Essential acceptance |
| --- | --- | --- |
| 0 | Approve this alignment/intake profile using minimal, supplied and real-project examples | Resolve the five decisions below; freeze only that slice's requirements. Existing manual acceptance gates remain open. |
| 1 | Home → existing project → Resume | Actual saved activity/empty/error states; no fake metrics; keyboard/compact layouts and current project/checkpoint behavior preserved. No new schema required for the first factual summary. |
| 2 | Local PTB → deterministic preview → cancel | Exact narrative/headings, actionable locations, identical semantic results for repeated input; reject invalid types/IDs/references/cycles and unsafe/oversize paths/YAML. Unknown fields warn. Cancel/preview writes zero rows; no network/model. |
| 3 | Preview → approved new project → feature/requirement → adopt/complete one action → checkpoint → restart | Optional scope, no release; permanent links and all imported source/proposed definitions recover. Unselected actions remain proposals, decisions/checks unapproved/unrun. Double submit/restart retry cannot duplicate import; injected apply/event failure rolls back everything. Populated v3 data remains exactly intact. |
| 4 | Select a development workflow → scoped actions → Stages/Features/History | No release gate; independent copies; one action ID through all views; unscoped/Unspecified and empty scope honest. Approve development progress before showing percentages; out-of-order/reopen/exclusion/revision tests plus existing release policy unchanged. |
| 5 | Rich checkpoint → linked context → decision/requirement/check inspection and actual evidence | Deliver as separate small context, decision and evidence paths. Authored intention stays authored; proposed decision is not accepted; check definition is not result. Revision changes stale relevant assessments without deleting prior evidence. |
| 6 | Reviewed reimport diff; then a separate deterministic suggestion/adoption path | Omission never deletes/history-resets; local/source conflicts resolved explicitly. Suggestions expose rule/version/targets/reason and remain outside commitment; exact binding-based deduplication. |
| 7 | Development output → independent delivery snapshot → verification/confirmation | Later development/master/source edits cannot mutate delivery history; old v3 confirmation/provenance and packaged recovery still pass. Approve the snapshot policy first. |

Before each code slice rerun relevant baseline; after changes run focused Node and actual Electron checks, then build/package and packaged migration/restart checks for persistence slices. Retain failure injection, read-after-acknowledgement failures, cross-project/race and security tests. Report actual outcomes and manual checks. Git/Obsidian integration, local models, personalization and pattern recognition remain later product proposals.

## Five decisions for review

1. **Work ownership/lifecycle:** approve additive project-owned entities, explicit proposals versus committed unscoped/scoped work, one current scope per action and no automatic legacy-release conversion? Define scope close/reopen and reassignment history before its migration.
2. **Development workflow/progress:** approve purpose-separated templates and a separately chosen development lifecycle with no release gate? Candidate policy is equal included-stage weights with empty/unassigned scope review, but 100% means accepted work complete, never “release verified.” Recommend counts/Not assessed until this policy is approved; no project/feature-wide percentage by assumption.
3. **PTB intake profile:** approve one entity per UTF-8 Markdown file (minimal file = project only), directory/`project.md` input first, strict versioned schema/IDs/enums/limits, explicit typed relation mapping and reviewed workflow/stage-key resolution? Archive input and parser dependency choice remain separately reviewable before implementation.
4. **Approval/source authority:** approve project creation distinct from action adoption, proposed decisions/planned checks, immutable source provenance, reviewed main-owned preview and idempotent import receipt? Recommend new-project-only import initially; an existing PTB project identity opens/reports the existing import rather than silently cloning or overwriting. Edits create new domain revisions; reimport updates wait for conflict review.
5. **Development versus delivery truth:** approve future revisioned snapshot selection rather than live shared action completion, and requirement/check assessments separate from both action completion and release confirmation? Exact capture/freshness rules are deferred; no integration migration before their approval.

## Antigravity collaboration

Use the [copy-ready handoff prompt](antigravity-collaboration-prompt.md) for an independent review now and bounded assigned implementation after approval. Antigravity is an external development collaborator, not an application feature. One integration owner controls each slice, migrations and shared contracts; use separate checkouts/file ownership for parallel edits. This pass used lighter read-only agents for PTB, data-model and journey/test reviews; no Antigravity session has been launched or connected.

**Stop:** review this proposal before implementation; no migration, feature, UI redesign or dependency change is authorized by this document.
