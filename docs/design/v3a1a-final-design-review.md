# V3a1a — final identity, source and schema review

2026-11-07 · **Revised recommendation for approval; production remains paused.** This supersedes the immediate operational-action recommendation in documentation checkpoint 28bac82. Refined C, durable exact source, atomic formation, Overview/Map quality and packaged acceptance remain unchanged. [Revised implementation contract](v3a1a-implementation-proposal.md) · [exact revised 004 SQL](v3a1a-schema-proposal.md).

## 1. Keep knowledge identity; materialize work on commitment

**Recommend delayed operational rows.** A Proposed action is already a durable engineering definition with a permanent `knowledge_entities.id`; it does not need to be an ordinary backlog/release action yet. Formation creates **zero `actions`, `action_details` or `release_actions` rows**, and no entity-to-operational-action mapping. Do not add an unused nullable `action_id` column or commitment table now.

| Concern | Immediate `actions` rows (previous proposal) | Knowledge-only proposals (recommended) |
| --- | --- | --- |
| Stable identity | Two IDs from import; all graph/checkpoint code must still distinguish them | Permanent entity ID from import; same ID after adoption. Later operational ID is an internal mapping, not replacement identity |
| Existing queries | Must filter new rows from `projectActions()` and release progress; duplicate title/details authority | No query/filter change: old queries read only actual operational work. Definition exists once in knowledge payload |
| Lifecycle | Existing completion/reopen/assign/edit APIs see the rows; new guards must intercept every path | No proposal completion field/membership/operational row to mutate; no new legacy completion policy in V3a1a |
| V5a checkpoints | Ordinary action ID preallocation offers no benefit if checkpoints already target all knowledge kinds | Target entity ID + same-project check, optionally a definition revision if V5a approves that behavior. Later commitment leaves target unchanged. Old project journals remain unlinked |
| V3a1b adoption | Must remove/relax blanket guards, add actual commitment state/history and reconcile projection | Add one explicit entity↔operational-action mapping in that slice; transaction creates work/details, mapping, commitment/audit/receipt. Unique entity and action keys make retries one commitment, not duplicate work |
| Transactions | Formation writes 2 additional legacy rows per source action, projection data and guards | Smaller formation transaction; commitment transaction is deferred until an actual commitment operation exists |
| Future migration | Add commitment/lifecycle anyway; permanently populated compatibility rows exist before work is accepted | Later additive mapping/commitment migration, backfilled with **no** work; do not infer commitment from imported definitions. All entity/checkpoint/source IDs survive |

Evidence: [`projectActions` / `findAction`](../../src/main/data/database.ts#L457) select directly from ordinary actions; [`changeCompletion`](../../src/main/data/database.ts#L158) checks/updates ordinary completion; [`assignAction`](../../src/main/data/database.ts#L321) treats an unbound ordinary row as eligible for release commitment. [`updateReleaseAction`](../../src/main/data/database.ts#L226) updates title/details, and [`reorderReleaseActions`](../../src/main/data/database.ts#L245) writes details/order. [`DevelopmentAction` and current API inputs](../../src/shared/contracts.ts#L15) use numeric operational IDs. There is no generic SQL, graph mutation or action-delete IPC endpoint in the [actual registration](../../src/main/ipc.ts#L15).

**ID collision rule:** entity ID 6 and legacy action ID 6 are unrelated namespaces. Knowledge DTOs/controls use `entityId`; the Proposed action DTO has **no `actionId`**. Sending the number 6 to a legacy method may legitimately edit legacy action 6; it cannot complete knowledge entity 6. Do not claim every numerically equal request is rejected, reuse IDs across tables or block legitimate legacy work by comparing unrelated integer values. Tests must cover both no-row and colliding-ID cases and show the proposal unchanged. Renderer call sites must never cast/pass an entity ID as a legacy action ID.

### V3a1b safety gate, not V3a1a implementation

The adoption slice must design a unique same-project entity/action mapping, exact committed definition revision and commitment/audit record. One reviewed transaction with expected revision and idempotent receipt creates the ordinary row/details and mapping, or rolls everything back to Proposed. No legacy attachment by matching title/number. Existing IDs need no rewrite.

**Before enabling that mapping**, add explicit development command guards and query exclusions: legacy release assignment/edit/reorder/exclude cannot treat committed development work as release work; completion/reopen must follow approved development semantics. SQL must protect owner/mapping and reject development membership on both `INSERT` and relevant `UPDATE` of `release_actions`, while permitting ordinary legacy stage/exclusion edits. No permanent blanket “knowledge action cannot complete” trigger. Release snapshots/transfer remain separately designed. These later guards cannot be skipped simply because V3a1a did not need them.

## 2. Separate source identity from project identity now

The former `knowledge_workspaces(project_id, source_namespace='ptb', external_project_id)` conflated the formed workspace with its initial source. Project-scoped `external_id` also left future native ID collisions unresolved. Leaving those constraints and calling the schema multi-source-ready would be misleading.

**Minimal revision, still 13 tables:** replace that table with `knowledge_source_bindings(id, project_id, adapter_key, native_root_key, initial_import_id)`; remove external IDs from `knowledge_entities`; retain a captured `source_native_id` in each definition. Imports reference a source binding and the same project; document/definition ownership is unchanged. No adapter registry/dispatch abstraction is added.

- `projects.id` owns the project; `knowledge_entities.id` owns its records. Neither derives from a PTB ID, file path or hash. A source binding has its own app-owned ID and is attached to a project. The schema has **no UNIQUE(project_id)** limiting the project to one source forever.
- Current main operations accept **only existing PTB v0.2** and create one source binding for a new project. Main fixes `adapter_key='ptb'`, native root ID, `parser_contract='v2-preview-1'`, `format_version='0.2'`, `formation_policy='v3a1a-1'`; none can be supplied by the renderer. Reject unknown keys/policies, including extra adapter input. The source table stores bounded metadata keys, not executable adapter names. Do not dynamically load code from them.
- Replace PTB-literal SQL CHECKs with scalar/type/length/key-shape checks. Format eligibility/known enums stay enforced in the named main PTB boundary and checked when loading supported captures. This avoids rebuilding capture/identity tables merely to add an approved format; it does not implement or enable that format.
- `(adapter_key, native_root_key)` is unique when a native root ID exists. Same PTB ID still offers Open existing / Cancel, irrespective of packaging or paths. `native_root_key` / `source_native_id` may be null in the storage model where a future format has no authored ID; current PTB commands require valid non-null PTB IDs. An app-owned binding/entity ID must never be displayed as an authored Markdown ID.
- This is an **intentional profile-level PTB duplicate-binding rule**, not a claim that PTB's package-local ID validation guarantees worldwide uniqueness. Two unrelated packages reusing the same `proj.*` root will both lead to Open existing; V3a1a cannot import the second as a separate project without distinct authored project identity. Fork/clone-source review is deferred. State that limitation in the formation review. Before another adapter, define its authority/vault/account scope: a native key from one authority must not collide with an unrelated authority. Add a scoped-key/constraint migration if required; do not assume the current PTB comparison applies universally.
- The captured interpreted semantic hash may be absent for a future source-only format; every document still has its exact-byte hash. Current PTB formation requires the actual non-null V2 semantic hash. Do not substitute a byte hash and claim it is a PTB semantic graph.
- Native entity ID uniqueness is capture-local, **not project-global**. V3a1a has one capture and blocks updates. Its PTB crosswalk is the captured definition's `(import → source binding, source_native_id) → entity_id`; source occurrence/path is provenance, not permanent identity. Repackaging a repeated PTB root opens the original project; it does not create more entities.

### Safe later evolution, explicitly deferred

1. Approve each adapter's native identity, version/process, acquisition grant, interpretation and update policy. Ordinary Markdown headings/wikilinks do not automatically become engineering records. OpenSpec proposals/current specifications and Spec Kit processes need pinned native contracts; no compatibility is claimed here.
2. Before a second source/attachment/reimport command, add a **source-to-entity binding/crosswalk** table keyed by source-binding ID + native record ID, pointing to permanent entity IDs. Seed it deterministically from current imports/definitions. Assert there is no ambiguous mapping; abort rather than choose a winner. No original ID/source bytes/checkpoint target changes.
3. Reviewed attachment chooses an existing project; new native IDs create records, or explicit reviewed crosswalks relate them to an existing entity. Same-looking IDs/titles/paths across sources never auto-merge. Multiple aliases can preserve their distinct origin assertions; app-edited working definitions stay separate from immutable incoming captures. Source-specific baselines/conflict/provenance policy must be finalized before updates.
4. Non-PTB captures use truthful adapter/parser/version metadata and their own grants; they do not insert fabricated PTB source rows. The existing capture/document tables can retain exact bytes, with typed relationship/source validation extended only under the new contract. Add assertion/local-link/target-version records only when their operations are authorized. No source-ingestion engine or other adapter code in 004.

The metadata shape supports safe extension, **not complete multi-source merge semantics**. A future adapter may need additional typed relationship kinds or a different source/assertion-anchor shape, with a reviewed constraint/table extension and preservation tests; 004 does not predeclare those meanings. Crosswalks and new commands still need migration/review. The one-source restriction is a V3a1a command restriction, not the identity of the project.

## 3. Schema cost and guard coverage

Remove four action-specific triggers and the `action_id` projection/binding from the previous design. Remove the mutable workspace counter and entity `current_revision` pointer/deferred reference; there is no V3a1a operation that advances either. The remaining single deferred cycle ties a source binding to its **own** initial committed import/receipt.

Definitions/payloads/links keep `(entity, revision)` keys because requirement acceptance and V5a can refer to exact saved definitions without replacing permanent IDs. Initial revision is 1, and no API edits or appends revisions. Reads join the greatest fully committed definition revision (1 here), not a mutable pointer/cache. Later revision-producing commands must append header/payload/links atomically with expected-version/audit checks. Revision numbers alone are not historical graph/evidence snapshots; target-version/local-link policy remains a gate before editing/reimport. A whole-workspace counter can be added when graph-changing commands actually need it. Session layout/cache uses project ID + import ID now.

| Table(s), 13 total | V3a1a justification |
| --- | --- |
| `knowledge_source_bindings` | Actual PTB root binding/repeat-open guard, independent of project identity; initial receipt pointer |
| `knowledge_imports` | Actual apply receipt, immutable review digest/policy/capture facts/diagnostics; uncertain-ack recovery |
| `knowledge_documents` | Exact original bytes/hash/source headings, restart inspection without live files |
| `knowledge_entities` | Permanent typed same-project identity, including Proposed actions and the project graph root |
| `knowledge_definitions` | Exact initial title/narrative/native provenance/spans, revision anchor for later acceptance/context |
| `knowledge_project_details` | Real goal, authored manifest and capabilities, separate from ordinary project name |
| `knowledge_requirement_details` | Requirement type/observable acceptance criteria, not an approval/result |
| `knowledge_scope_plans` | Preserve authored Draft workflow/ref; no active scope or execution |
| `knowledge_stage_definitions` | Preserve inline order/keys per Draft scope plan; no release stage |
| `knowledge_action_details` | Single copy of full Proposed engineering instructions/DoD/applicability/evidence/type/proposed placement |
| `knowledge_decision_details` | Proposed rationale/alternatives, no accepted-decision event |
| `knowledge_check_details` | Planned method/instructions/expected observations, no fabricated run |
| `knowledge_relationships` | Same-project kind-checked native edges with exact field sources; required for map/source navigation |

Do not merge these into an all-purpose JSON payload table: that would lose typed FK/check coverage rather than remove a product concept. Components/features use the common definition and links; no empty subtype tables. Literal arrays/diagnostics/source coordinates are the bounded JSON exceptions. No operational-action, scope-membership, assessment, layout or future adapter table is added.

| New trigger group, 29 total | Exact purpose / limitation |
| --- | --- |
| 22 `*_no_update` / `*_no_delete` on 11 capture/definition/payload/link tables | DB backup for append-only saved assertions/source; current main exposes no edit/delete. Do not claim protection against an administrator editing schema/turning off constraints. Bound inserts, not REPLACE/upsert, are the write contract |
| 2 source-binding update/delete guards | Canonical source attachment/initial receipt cannot be silently rebound/removed |
| 2 entity update/delete guards | Permanent ID/kind/project/creation facts cannot be rewritten; local edits append definitions instead |
| 1 `knowledge_project_identity` | Initial project definition's native root must match its actual source binding; project identity remains internal |
| 1 `knowledge_inline_stage_only` | No authored stage rows for absent/unresolved/reference plans |
| 1 `knowledge_action_stage_target` | Proposed stage must match its scoped inline plan; unresolved reference strings remain unvalidated proposals |

All 29 protect values saved in this slice. All owner/type/uniqueness FKs/checks also remain. Completeness, exact coordinate/hash validation, graph bounds/cycles, strict PTB fields and all-or-nothing audited receipt are main transaction checks; SQL does not replace them. No new trigger touches legacy operational tables in revised 004.

### Legacy mutation audit

| Path | Actual behavior and required test |
| --- | --- |
| Complete / reopen | `findAction` + ordinary `actions.completed_at`; missing operational row → NOT_FOUND. A colliding legacy ID changes only the legacy row, not the Proposed entity/definition |
| Assign / exclude / edit release details | Ordinary action lookup, release-owner checks and release membership; cannot turn a knowledge definition into a work row. Missing IDs reject with no event/revision/partial change |
| Reorder release actions | Exact existing ordinary stage membership validated before details writes; proposal IDs cannot extend that set. Collision is just an existing operational ID, never a knowledge mapping |
| Create release / template copy / confirmation | Creates independent ordinary actions/gate, never reads knowledge proposals. Existing confirmations/frozen releases remain protected |
| Raw INSERT `release_actions` | FK requires an ordinary action row; no-row entity ID rejects. No FK targets `knowledge_entities` |
| Raw UPDATE `release_actions.action_id` / `.release_id` | Existing **002 `release_action_update`** rejects identity/release changes. Preserve it. This closes the update route omitted from the former disposable coverage; do not imply the old insert-only new trigger covered it |
| Raw UPDATE membership stage/exclusion | Existing 002 permits valid edits for legacy work and blocks gate/frozen/invalid-stage cases. Such edits cannot create an operational mapping for a Proposed entity |
| Raw action title/details/project mutation | Addresses ordinary tables only; no shared authoritative proposal projection exists. No generic SQL path exposed by Electron. Proposed definitions remain immutable under their own guards |

The prior proposal's insertion guard plus unchanged 002 already blocked release-identity rewrites; **no new reachable update bypass was demonstrated**. Its test coverage was incomplete, and duplicated title/details would still require guarding. The revised model removes that entire pre-commit legacy projection surface rather than claiming a blanket update ban is safe.

## Exact authorized scope if approved

The production plan remains one PTB-only new-project formation slice: five named typed methods, main cached reviewed plan, revised additive 004/knowledge store, human summary/frozen effects review, real Overview/connected refined-C Map/lazy inspector/exact stored source, truthful Home formation event, existing unlinked project journals/Resume, migration/retry/security/source/map tests and rebuilt Windows Electron/ASAR restart evidence. **No changes to legacy action queries/mutators or migrations 001–003 are needed for proposal isolation.** No feature beyond those in the implementation proposal is added.

Preserve first-open native component–feature edges, expandable requirements, one identity for cross-cutting nodes, readable 800/1160/1540 layouts, stable selection/viewport/drag, real keyboard/source/focus behavior, source files absent after restart and all legacy/frozen-release tests. Prototype-only tests or overflow checks are insufficient. No workflow execution, adoption, scope activation, Obsidian/other adapters, AI/MCP, source merge or next milestone.

Reproduce from repository root: `node docs/design/checks/v3a1a-schema-check.mjs`. The [versioned disposable check](checks/v3a1a-schema-check.mjs) extracts the SQL from Markdown, compiles **unchanged** Node/main source into ignored artifacts, and uses in-memory databases. It is not a production migration, new feature implementation, normal test-suite registration or package input. Final run: **61 checks pass**, including all 29 trigger groups, missing/colliding ID behavior and actual legacy mutation paths. Synthetic non-PTB rows are SQL expressibility probes rolled back inside the test, not adapter acceptance.

Evidence and actual limitations are in [verification](../verification.md). The changes above remain proposals; approval of the visual/product direction did not authorize 004 or production code.
