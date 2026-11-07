# V3a1a — Durable Knowledge Formation: implementation proposal

2026-11-07 · **Accepted design at 1b3be92.** The design below records the pre-implementation baseline and requirements. For the implemented behavior, verification and remaining review, see [ADR 0008](../adr/0008-durable-knowledge-formation.md) and the [production report](../v3a1a-verification-report.md).

[Final identity/source/guard review](v3a1a-final-design-review.md) · [exact revised schema](v3a1a-schema-proposal.md) · [approved domain direction](development-domain-contract.md) · [source/adoption policy](blueprint-adoption-merge-policy.md) · [review corrections](v3-consolidated-review.md) · [roadmap](product-implementation-roadmap.md).

## One useful, complete path

**Home → choose an actual PTB v0.2 file → inspect summary/map/source → review New project → Create knowledge project → persistent interactive Map → inspect related definition and its exact stored source → quit/restart → reopen the same project/map.** No release is needed.

Save every validated definition and explicit relationship, not just the visible map subset. Components/features become project structure; requirements remain Draft, actions Proposed/incomplete, scopes Draft plans, decisions Proposed and checks Planned/Not run. All development readiness is **Not assessed**, with factual definition counts. Source narrative is neither activity nor verification.

Keep the scope narrow: no requirement acceptance, action commitment/completion, scope activation, workflow execution, local definition editing, existing-project attachment/update, full History screen, linked checkpoints, Obsidian ingestion, AI/model calls, MCP, scheduling or development percentages. Existing project creation, backlog/release actions, checkpoints, Resume and Workflow Library remain functional. V5a adds linked recovery next; this slice preserves the existing project journals without pretending they already link to graph records.

## Repository facts and integration boundaries

Application baseline remains unchanged; first proposal checkpoint **28bac82e3fa5c411e9e96f09091469701e9ee309** on `codex/v3-product-experience-design`, schema v3. The preview session retains a filesystem grant but **not** its authoritative snapshot. `projectActions()` returns every ordinary action, so the revised design keeps uncommitted proposals out of that table instead of adding filters/blanket guards. Source persistence and a main-owned reviewed snapshot are real missing capabilities.

Reuse `BlueprintPreviewSession`, strict PTB parser/acquisition/graph validator, `WorkspaceStore` transaction/error patterns, `WorkspaceApi`/preload/IPC allowlist, `useProjectWorkspace`, `useBlueprintPreview`, Home/Sidebar/Panel/tokens and exact-source view. Keep native main-owned file picking and Windows containment/alias/race checks. Preserve CSP, app:// asset allowlist, trusted sender/frame/URL checks, sandbox/context isolation, bound SQL and Result envelopes. No new dependency or generic graph engine.

Installed React Flow/ELK/Base UI are candidates for this production composition, not proof of packaged compatibility. Exercise them under the real app:// CSP and rebuilt ASAR early in the authorized slice. Use `Dialog.Popup`'s installed `finalFocus` API. Do not copy the prototype's dialog, simulated state sets, graph adapters or selection-driven auto-layout.

## Additive persistence and identity

Propose **004_durable_knowledge.sql**, preserving every byte of 001–003. The [revised schema](v3a1a-schema-proposal.md) specifies **13 tables, 5 explicit indexes and 29 triggers**. The final review removes four operational-action triggers, action/details projection, mutable workspace counter and entity current pointer. The source-binding table replaces the PTB-bound workspace table. Keep three capture/binding tables, a small identity spine, common definition revisions, six typed payload tables, ordered inline stages and typed source-backed links. Components/features need no empty payload tables. JSON is limited to ordered literal arrays, captured diagnostics/headings and exact coordinates; it is not the authoritative entity/relationship model.

| Identity / revision | Concrete rule |
| --- | --- |
| Project / source binding | `projects.id` is canonical. Separate `knowledge_source_bindings.id` attaches native source identity to that project, with no project-wide one-source uniqueness. Current command creates one `ptb` binding/new project; same native PTB root offers Open existing / Cancel. No attachment/merge now. A title/path/hash is never an identity. |
| Entity | Permanent integer `knowledge_entities.id`, fixed project/kind, no native/operational ID stored as its identity. Source-native ID belongs to the captured definition. All Map/inspector and future linked checkpoint targets use entity ID; operational rows/mapping are deferred to explicit commitment. |
| Definition | Append-only `(entity_id, revision)`; initial revision 1. Current reads select the greatest complete committed definition revision (1 here); no mutable current pointer. No local editing/reimport API. Later commands must append header/payload/links atomically with expected-revision/audit checks; accepted references stay pinned to their own revision. |
| Capture/source | **`knowledge_imports.id === operationId === importId`**, one main-generated UUID, identifies an applied capture and its receipt; its primary key is the durable retry key. Document key is capture-local; `(import_id, document_key)` is durable. Exact UTF-8 bytes, BOM/CRLF, hashes, headings, metadata/narrative/field spans survive restart. No absolute file path or grant is persisted. |
| Relation | Stable row ID, typed source entity/revision and target entity identity; source field/array-item location retained. Current graph uses current source revisions. Exact source inspection shows captured text/revision. V3a1a creates revision 1 only; arbitrary historical graph snapshots after future edits are **not** claimed. Target-version resolution/local-link provenance must be reviewed before editing/reimport; verified delivery snapshots remain separately deferred. |
| Workspace / view | No mutable workspace revision counter. Immutable import ID + project ID keys the first graph/cache/layout session. Add a graph counter only with a later command that needs it. Viewport, selection and node geometry remain presentation; no graph-layout table now. |

Authored inline-stage order and source presentation order are separate. Manifest/block order breaks browsing ties only; it never determines priority or graph identity. Stage keys are unique **within a scope-plan revision**, not release-stage IDs or activated development stages. Preserve unresolved/incompatible template references as Needs review with their key/version; do not copy release gates or invent stages.

### Proposed action identity and later operational work

**Revised recommendation: no ordinary action/details rows during formation.** The stable knowledge entity and typed action definition are the Proposed record. Existing backlog/release queries and action mutators need no proposal filters or new guards; there is no operational completion/membership/projection to change. A numeric entity ID must never be used as a legacy `actionId`, even if the numbers happen to coincide. The Proposed DTO exposes only `entityId` and its definition, with no `actionId`.

V5a can deliberately target that same-project entity without operational preallocation. V3a1b must approve/add the unique entity↔action commitment mapping and create ordinary rows/details + actual commitment/audit/receipt atomically. Retry/reassignment never replaces the entity or checkpoint target. That later slice must guard mapped development work from legacy release insertion **and update**, and apply its approved development completion/lifecycle policy before exposing work. No mapping/commitment table is precreated now. [Comparison and exact mutation audit](v3a1a-final-design-review.md).

Source binding/capture metadata uses bounded scalar fields instead of PTB-literal SQL CHECKs; the current main path fixes/validates only PTB v0.2. Future native IDs are scoped by source/import, not project identity. Before another adapter or source update, add a reviewed source-to-entity crosswalk from current captured IDs, preserving all internal IDs/bytes. No adapter registry, arbitrary Markdown entity inference or automatic cross-format merge is included.

## Typed application boundary

Add `src/shared/knowledge.ts` after approval; extend the existing `WorkspaceApi` with exactly **five named operations**. Preserve all 34 existing names/payloads. Inputs reject extra keys, nonpositive IDs, malformed UUID/digest and cross-project targets. Main owns IDs, timestamps and source lookup. Keep existing `VALIDATION / NOT_FOUND / STORAGE / FORBIDDEN` Result codes; no new generic dispatcher.

```ts
type KnowledgeKind = PreviewRecordKind;
type KnowledgeCounts = Readonly<Record<KnowledgeKind, number>>;
type KnowledgeSourceAnchor = {
  importId: string; documentKey: string; source: PreviewSourceRef;
}; // source.documentId must equal documentKey; end-exclusive offsets unchanged.
type KnowledgeNode = {
  entityId: number; externalId: string; kind: KnowledgeKind;
  revision: number; title: string; presentationOrder: number;
  origin: { sourceBindingId: number; importId: string; occurrenceKey: string };
  // externalId is the non-null captured PTB native ID, not canonical app identity.
};
type KnowledgeLink = {
  relationshipId: number; fromEntityId: number; fromRevision: number;
  toEntityId: number; relation: PreviewRelation;
}; // Explicit source links only, not paths or ownership spokes.
type FormationReceipt = {
  operationId: string; importId: string; sourceBindingId: number; reviewDigest: string;
  project: Project; rootEntityId: number; appliedAt: string;
  counts: KnowledgeCounts; relationshipCount: number;
};
type PreparedFormation = {
  kind: 'prepared'; operationId: string; reviewDigest: string;
  policyVersion: 'v3a1a-1'; snapshotId: string; capturedAt: string;
  projectName: string; externalProjectId: string;
  documents: readonly { documentKey: string; relativePath: string;
    sha256: string; byteLength: number }[];
  counts: KnowledgeCounts; relationshipCount: number;
  diagnostics: readonly PreviewDiagnostic[];
  // UI states the fixed effects: Draft / Proposed / Planned, zero commitments/releases.
};
type FormationPreparation = PreparedFormation | {
  kind: 'existing'; project: Project; receipt: FormationReceipt;
  captureComparison: 'same' | 'different'; // Exact document tuples, not counts alone.
};
type KnowledgeWorkspace = {
  project: Project; rootEntityId: number;
  goal: string; counts: KnowledgeCounts; receipt: FormationReceipt;
  documents: readonly { importId: string; documentKey: string;
    relativePath: string; sha256: string; byteLength: number }[];
  review: { importId: string; diagnostics: readonly PreviewDiagnostic[];
    needsReviewScopeEntityIds: readonly number[] };
  nodes: readonly KnowledgeNode[]; links: readonly KnowledgeLink[];
};
type KnowledgeRecordBase = KnowledgeNode & {
  projectId: number; narrativeMarkdown: string;
  metadata: KnowledgeSourceAnchor; narrative: KnowledgeSourceAnchor;
  relationships: readonly KnowledgeLink[];
};
type KnowledgeRecord = KnowledgeRecordBase & (
  | { kind: 'project'; goal: string; documents: readonly string[];
      capabilities: readonly string[] }
  | { kind: 'component' | 'feature' }
  | { kind: 'requirement'; state: 'draft'; requirementType:
      'functional' | 'quality' | 'constraint'; acceptance: readonly string[] }
  | { kind: 'scope'; state: 'draft'; workflow: PreviewWorkflowRequest | null;
      workflowStatus: 'none' | 'inline' | 'unresolved' | 'incompatible' }
  | { kind: 'action'; state: 'proposed';
      details: ActionDefinitionInput; proposedStageKey: string | null;
      coversRuleIds: readonly string[] }
  | { kind: 'decision'; state: 'proposed'; rationale: string;
      alternatives: readonly string[] }
  | { kind: 'check'; state: 'not-run'; method: 'manual' | 'automated' | null;
      instructions: string; expected: readonly string[] }
);
type KnowledgeSourceTarget =
  | { kind: 'record'; entityId: number; revision: number;
      part: 'metadata' | 'narrative' }
  | { kind: 'relationship'; relationshipId: number }
  | { kind: 'diagnostic'; importId: string; diagnosticId: string;
      relatedIndex?: number }
  | { kind: 'document'; importId: string; documentKey: string };
type KnowledgeSource = {
  importId: string; document: PreviewDocument & { status: 'captured'; text: string;
    sha256: string; byteLength: number };
  selection: PreviewSourceRef | null;
};

interface KnowledgeApi {
prepareKnowledgeFormation(input: {
  sessionId: string; snapshotId: string; name: string;
}): Promise<Result<FormationPreparation>>;
applyKnowledgeFormation(input: {
  operationId: string; reviewDigest: string;
}): Promise<Result<{ receipt: FormationReceipt; replayed: boolean }>>;
openKnowledgeWorkspace(input: {
  projectId: number;
}): Promise<Result<KnowledgeWorkspace | null>>; // null = existing legacy project
getKnowledgeRecord(input: {
  projectId: number; entityId: number; revision?: number;
}): Promise<Result<KnowledgeRecord>>;
getKnowledgeSource(input: {
  projectId: number; target: KnowledgeSourceTarget;
}): Promise<Result<KnowledgeSource>>;
}
```

DTO relations use internal IDs; proposed scope/features/requirements are obtained from the same typed links, not duplicate embedded lists. The inline plan's authored stages remain in `workflow`. `ActionDefinitionInput.title` matches the common title. `KnowledgeSource.document` is reconstructed from stored bytes/heading metadata, never the live filesystem. Diagnostic record keys map through node provenance, not guessed IDs. Diagnostic source targets resolve only persisted non-null source/related-source entries; a source-null package diagnostic has no Open source control (and direct requests return VALIDATION). Whole-document selection is null; package diagnostics retain a null source. Do not fabricate anchors.

Add optional `knowledge?: { rootEntityId: number; goal: string; counts: KnowledgeCounts } | null` to `HomeProjectSummary`; main returns it, old test/fake implementations may omit it. Keep `Project` and legacy `ProjectDetail` unchanged. `openProject` still loads legacy detail; the controller additionally reads `openKnowledgeWorkspace` to choose the formed workspace. Home does not load every source/record, or manufacture a work-session count.

## Main-owned review, transaction and recovery

1. **Capture:** retain the immutable current snapshot in `BlueprintPreviewSession` alongside its grant. No database writes on choose, refresh, inspection, prepare or cancel. Keep one current snapshot and one prepared plan per window, within existing capture limits. Reprepare (including a submitted changed name), refresh, choose/cancel, window close and process restart retire an uncommitted plan. The final prepared review displays its frozen name; Edit returns to preparation rather than mutating the reviewed form silently. No artificial timer is needed.
2. **Prepare:** validate current session/snapshot, name, exactly one project, all required files captured, no malformed/duplicate records or blocking graph errors and every explicit entity link resolved. Unresolved/incompatible workflow references and quality warnings are retained, not guessed away. Invalid source remains inspectable in Preview; formation is all-or-nothing, not a partial import. Recheck strings can round-trip losslessly through SQLite UTF-8 and labels contain no NUL; escaped lone surrogates cannot be silently replaced. This is a formation-storage diagnostic, not a loosening of PTB validation.
3. **Freeze review:** issue a random operation UUID and SHA-256 review digest over a versioned fixed-key encoding of operation ID, policy version, snapshot ID, semantic hash, ordered captured document key/path/hash/length tuples, project binding, chosen name, expected absence of binding and fixed all-proposal effects. Keep that exact plan/snapshot in main. No second structural digest, accepted-ID set, active-scope flag or renderer-submitted graph.
4. **Apply:** validate payload/sender, then look up a committed receipt **before** checking session expiry. Identical UUID/digest returns its receipt. Same UUID/different digest is rejected. Otherwise require the current prepared plan and generation; recheck binding and schema inside `BEGIN IMMEDIATE`.
5. **One transaction:** insert ordinary project, independent source binding, applied import/receipt, exact documents, stable entities, common definitions, project/requirement/scope payloads and authored stages, then typed relationships, then action/decision/check payloads and one actual formation audit event. Scope/stage/link insertion must precede the action payload's placement guard. Check payload completeness, owner/type pairs, source spans/cycles/stage links, exact counts, supported PTB contract and non-null native IDs before COMMIT; deferred FK must pass. No operational action/details/membership is written. Nothing is published before COMMIT. Any error rolls back project/binding/graph/source/event/receipt together; never accept a renderer graph/action ID or existing-project target.
6. **Receipt/history:** the import row plus immutable graph reconstructs the result. One `action_events` entry has null action/release and says “Created knowledge project from reviewed blueprint”, with import ID/counts as after-value. This is a real event at command time, not fabricated history for each source action. It gives Home a truthful activity item while leaving old history intact.
7. **Navigate:** acknowledge receipt separately from loading Home/project/map. Failed refresh says Created; retry loading. It repeats reads, not formation. An uncertain transport outcome retries the **same** operation ID/digest. A committed receipt remains recoverable after session consumption/restart; if renderer lost its token, Home and same-binding Open existing return the project and its initial receipt. Reconstruct the receipt from that import's revision-1 rows and frozen name/time, not future current pointers or edited names. A different operation is not deduplicated by semantic hash alone.

The digest's exact initial encoding is UTF-8 `JSON.stringify` of this array (no whitespace or Unicode normalization): `["v3a1a-1", "v2-preview-1", operationId, snapshotId, semanticSha256, documentsInPresentationOrder.map(d => [d.id, d.relativePath, d.sha256, d.byteLength]), ["ptb", externalProjectId], chosenName, ["new-project", 4, "binding-absent"], ["all-definitions-proposed", "no-commitments", "no-activation", "no-release"]]`. Preparation validates/normalizes the chosen name using the existing name rules before freezing it. This is an operation-review digest, not a source identity or new PTB semantic hash.

Capture is the reviewed authority: files may move/change/disappear after capture; Apply knowingly saves the displayed captured copy. Show captured time and “Stored copy, not live file” in review/source. Refresh obtains a new snapshot and requires new review. After COMMIT there is no destructive Undo/delete in this slice; preview cancellation before Apply is non-mutating, and an in-flight commit cannot be advertised as cancellable. Review clearly names the new project/binding and fixed effects before Create.

| Renderer formation state | Allowed effect / focus |
| --- | --- |
| Captured → Preparing → Prepared review | Prepare is read-only. Stale replies ignored by capture/request generation. Final summary displays the returned frozen name/effects; Edit/Refresh returns to preparation and invalidates the prior review. |
| Prepared → Applying | Freeze input/navigation that would discard the operation key. Show Saving; do not offer misleading Cancel. A transport failure preserves the same key/digest for Check saved result / Retry, not a new Create. |
| Acknowledged → Loading saved project | The write is finished. Consume the preview plan and clear its grant; refresh Home/project/knowledge. Further retries are reads only. |
| Saved / Saved, reload needed | On successful read, route to Map, focus its labelled heading and announce project creation. On read failure retain receipt/project ID and focus the saved-but-unavailable message with Retry loading. No replay of acknowledged creation. |
| Cancelled / Expired / Existing binding | Before Apply, Cancel writes nothing and returns focus to Home's chooser. Expired review requires recapture/reprepare. Existing binding offers Open existing or Cancel, never a new duplicate or silent update. |

Migration uses the existing SQLite backup + pending-batch transaction + foreign-key check + version runner. Version 3 gets only 004; earlier supported versions receive the unchanged pending migrations. Empty additive tables do not classify any legacy records or create history. Failed backup/migration leaves the original database/version intact. A v3 binary refuses the newer v4 database; restoration is an explicit closed-app backup operation, not an automatic downgrade. Exact source/history retention increases profile size; no source purge or cascade-delete policy is introduced here.

## Production React composition and interaction

| Existing owner / proposed component | Minimal responsibility |
| --- | --- |
| `App` + existing Sidebar/Home | Route ownership; Home → Preview; formed project opens Map, unbound legacy project retains its complete workspace. Formed project tabs: Overview and Map; a secondary Existing project tools entry retains actual backlog/release controls and project journals/Resume. Clearly label journals as project-level/unlinked: saving one does not target the selected graph record, and Continue retains its current generic behavior. Proposed knowledge actions are not the tool's ordinary backlog actions. No nonfunctional Development/History shell tabs. |
| `useBlueprintPreview` + Preview summary / FormationReview | Existing capture/diagnostics/source/error states; summary-first overview of real structure; optional captured map; name + fixed-effects review; main prepare/apply receipts, expired-plan and existing-binding states. |
| `useProjectWorkspace` | One durable mutation/acknowledgement coordinator. Add knowledge graph read alongside legacy project read, request-generation guards, receipt navigation and read-only retry. Lazy record/source reads use project/revision/selection tokens so late replies cannot replace the selected inspector. No second durable store. |
| `ProjectKnowledgeWorkspace` / Overview | Goal, factual definition counts, Draft/Proposed/Not run distinction, Needs review, actual formation receipt/documents, entry to map and existing project continuity. Not a release dashboard. |
| `EngineeringMap` + small pure `projectMap` helper | Shared visual input from captured occurrences or persisted internal entities. Only two explicit conversion functions, not an adapter registry. Controlled nodes/edges, expansion, anchor/lens, selected ID and viewport. Main/domain remains authoritative; dragging only changes session geometry. |
| Custom map nodes / relation legend / searchable outline | Component/feature hierarchy, explicit native relation labels/direction, hidden-neighbor counts, keyboard-accessible native controls. Outline is an equivalent navigation aid, not the primary production presentation. |
| `KnowledgeInspector` + existing exact-source view | Rich typed details, narrative, actual linked records, direct vs route explanation, metadata/narrative/relationship source links. Read-only proposals with meaningful navigation; no fake Adopt/Complete/Run controls. Source panel/dialog restores real opener focus, or a stable map/inspector heading if opener disappeared. |

Use graphite surfaces, restrained violet selection, distinct component/feature hierarchy, concise labels and the established tokens/typography. Refined C's spacious canvas and conditional single inspector remain; rebuild for production using existing primitives. Reuse semantic tokens and reduced-motion handling. No broad style replacement.

### A real engineering map from first open

- Default projection includes top-level components **and actual feature nodes with their declared primary-component edges**. Vivarium therefore opens with 7 top-level components + 7 features and 7 native primary-component links, with 2 child components expandable. No zero-edge component card grid and no project ownership spokes. Parent hierarchy is real when expanded; layout grouping alone is labelled visual organization, not a dependency.
- Expand a component/feature to inspect children and requirements. A cross-cutting requirement has one ID/node connected to its actual features, not copied completion states. Actions/decisions/check plans enter a selected neighborhood on demand; avoid an initial 47-node task cloud. Unplaced features and isolated records stay discoverable with neutral language, not defect badges.
- Native edges keep their relation identity even two hops from the anchor. If a route summary is shown, label it Indirect and retain ordered constituent relationship IDs. Do not create stored derived edges, infer prerequisites or claim a lack of links is a quality failure.
- Plain selection never reanchors, relayouts or refits. A separate explicit neighborhood action changes the anchor; Back restores its prior lens/viewport/selection. Controlled `onNodesChange` supports genuine node dragging. Fit changes viewport only; Arrange explicitly recomputes geometry. Disconnect/connect/delete affordances are disabled.
- Initial visible budget: 40 entities / 80 native edges; deterministic expansion with explicit hidden counts, search/reveal and a full accessible outline. Always keep the requested selected record visible; if its neighborhood exceeds budget, show the bounded subset and counts rather than silently truncating saved data. The persisted graph retains the existing 2,000-record / 20,000-edge bounds. Use bounded layout jobs with stale-generation result rejection; on failure preserve the last layout and offer Arrange retry. No worker or CSP exception by default.
- At **1540×1000**, sidebar + generous map + one inspector. At **1160×820**, fewer layout columns and a readable map/inspector balance. At **800×800**, compact navigation + full-width map, with detail/source replacing the canvas and Back restoring position/focus. Do not shrink all labels to fit: map labels at rendered ≥11px and normal body/source at ≥14px, with pan/zoom or readable subset instead of six-pixel text. Empty, isolated, needs-review, invalid and failed-load states remain usable. Node positions/viewport survive selection/source open-close within the session, keyed by project/import/lens; after restart arrange deterministically. Persistent personalized geometry is deferred.

## Reviewable implementation order and files reached

1. **Baseline and smallest live path:** rerun existing tests, then implement shared types, main prepared snapshot, revised 004/knowledge transaction/invariants, five IPC/preload methods and focused Node tests. Capture → review → create → read saved graph/source works before expanding map controls. Verify installed map/dialog layout under real app:// CSP early; no policy relaxation. Legacy action queries/mutators and release calculator remain unchanged.
2. **Polished persisted map:** compose summary/review, Overview/Map, interactive native relationships, lazy inspector/source, Home routing and existing Resume access. Keep the pure projection reusable for Preview. No activation/editor expansion.
3. **End-to-end and records:** rebuild actual app/package, exercise failure/retry/source/keyboard/compact/restart cases, capture new screenshots into a new V3a1a evidence folder, update records/ADR and stop for acceptance.

Expected production reach after approval: `src/shared/{knowledge,contracts}.ts`; `src/main/blueprint/session.ts`; `src/main/data/{database,knowledge}.ts` (one focused store module, existing transaction owner); new migration 004; existing main IPC/preload registration; `App`, Home and both controllers; focused `src/renderer/knowledge/` components/projection/styles and existing Preview/source composition; relevant unit/Electron/packaged fixtures/assertions; docs/ADR/checklist/roadmap/verification/short Obsidian checkpoint. Exact filenames may follow existing neighboring names; this is not license for a service framework or architecture rewrite. No package/lock changes expected.

## Acceptance gates and evidence

| Gate | Essential automated / observed acceptance |
| --- | --- |
| Baseline preservation | Actual Node, Electron, build/typechecks and all existing rebuilt-packaged suites. Preserve legacy project/action IDs/text/times/completion/details; checkpoints/events; workflow templates/origins; active/frozen releases, revisions, verification and confirmation. Compare populated-v3 database snapshots before/after migration and after restart, excluding only new schema/version/additive empty tables. Old APIs and UI regressions retained. |
| Formation | Real picker/acquisition/parser → prepared review → apply. Desk Notes saves 15 definitions / 29 links; FieldLedger 37 / 82; Vivarium 47 / 86. All typed metadata, narrative, literals, scopes/stages and links round-trip, no commitments/activation/check results/releases. Single/multi-file equivalent identities agree; different narrative is preserved, not declared identical by counts. Tests use fixtures, not fabricated production records. |
| Validation/security | Invalid/missing/duplicate/wrong-kind/cross-project/cyclic graph blocks formation but stays inspectable. Needs-review workflow reference persists as Draft with exact key/version and no stage/gate substitution. Strict JSON/Windows acquisition regressions, maximum bounds, unknown fields, Unicode/BOM/CRLF, escaped surrogate/NUL storage boundaries, unsafe markup, forged spans/IDs/extra payload keys, untrusted IPC and absent renderer Node/file access. New total allowlist 39. |
| Source fidelity | Metadata, narrative and native edge → exact stored bytes/span/heading path, before and after restart, even with original files renamed/removed. Test astral Unicode, duplicate-looking titles and same relative names across captures; package-level diagnostics stay source-null. Compare SHA-256 and selected byte/UTF-16 slices, not approximate headings or reconstructed source. |
| Transaction/retry | Inject faults after project/binding, before import/receipt, after documents, definitions, links, audit and before commit: no partial project/binding/source/history/receipt; legacy actions/details/membership unchanged. Invalid DB owner/kind/duplicate constraints fail. Double Apply/receipt replay yields one project/event; digest mismatch/stale plan/refresh/cancel rejected; source-binding race cannot duplicate. Lost acknowledgement replays same operation; acknowledged-write/failed-read retries reads only. Backup failure, mid-migration rollback, FK check and newer-schema refusal. |
| Proposal isolation | Assert formation adds zero operational actions/details/memberships. Exercise actual legacy complete/reopen/assign/exclude/edit/reorder with missing operational IDs and numeric collisions: no Proposed entity/definition changes or accidental mapping. Raw membership INSERT/FK and identity/release UPDATE guards, legitimate legacy stage/exclusion edits and frozen/gate protection all exercised. No renderer proposal call sends an entity ID as actionId. Existing progress/history unchanged; no invented action event. Counts/Not assessed never imply readiness. |
| Map usefulness | Native component-feature links visible on first open; expand/collapse/reveal and direct/indirect labels correct; cross-cutting identity unique; isolated records reachable. Selection preserves viewport/geometry; drag changes positions; Fit vs Arrange distinct; stale layouts/reads cannot replace current view. Bounded high-degree data remains navigable without dropping persisted links. Inspect all three widths with actual labels/data/screenshots, not overflow alone. |
| Keyboard/errors | Tab/Enter through map outline/node/inspector/source; labelled controls; Escape and Close restore opener/fallback; removed-opener case; narrow Back restores map context. Loading/empty/invalid/needs-review/locked-write/read-failure/expired-plan states have accurate messages and safe retries. Source renders inertly; reduced-motion honored. |
| Packaged recovery | Rebuild Windows executable/ASAR from final renderer. Real app://+locked installed libraries, no CSP/network/runtime errors. Create knowledge project from actual fixture, inspect graph/source, fully terminate, move source fixture copy, restart same profile, recover identical identities/revisions/bytes/proposals/event and existing Resume/release/workflow data. V2 cancel/preview-only test still leaves DB unchanged. Screenshots from this executable, not the prototype or an older build. |

Record actual commands, counts, skips/failures and evidence paths when executed. Prior 103 V2 checks are historical, **not new V3a1a results**. User manually reviews native picker, map clarity/density, labels, source selection/focus, real project formation and full restart before acceptance. Passing a standalone layout/projection test is insufficient.

## Approval requested: four consequential choices

Contract contradictions resolved: stable proposal identity is its entity ID, not an ordinary action preallocation; source binding/native identity is separate from project identity; unused mutable revision pointers/counters are removed. PTB draft-only unresolved references, receipt-first retry and historical snapshot limitations remain as previously clarified. These revisions change no production behavior.

1. **Revised 004:** 13 typed tables / 29 triggers, immutable exact capture/receipt and stable project/entity identities. Separate source binding, no PTB-literal storage lock-in; PTB-only main allowlist. Keep the explicit profile-level same-PTB-root → Open existing rule; fork/clone and future adapter authority/crosswalk semantics remain deferred.
2. **Knowledge-only proposals:** no ordinary action/details/mapping until explicit future commitment. V5a targets entity identity; V3a1b adds atomic mapping/work plus development/release isolation guards. Legacy queries/mutators need no V3a1a changes.
3. **Formation authority and retry:** all-valid definitions as proposals, main-owned captured plan, atomic new-project-only application, receipt-first identical retry, same binding → Open existing, no destructive Undo or source-update merge in this slice.
4. **First visual scope:** summary/review → Overview and genuinely connected refined-C Map → rich read-only inspector/exact stored source, with existing project Resume/legacy workspace accessible. Bounded interactive graph and session-only geometry; V5a linked recovery next, no inactive future controls.

On approval, record the accepted consequential design in new ADR 0008 and implement/verify this slice only. Until then this is documentation plus disposable schema checks; no migration, production module or prototype merge is authorized.
