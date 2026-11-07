# V3a1a — Durable Knowledge Formation: implementation proposal

2026-11-07 · **For approval. No production code or migration written.** Refined Concept C and the sequence **V3a1a → V5a → V3a1b → V3b1 are approved**. This document proposes the concrete first slice, not authorization for the later slices. Antigravity 92a7129 remains research, not a merge source.

[Exact schema](v3a1a-schema-proposal.md) · [approved domain direction](development-domain-contract.md) · [source/adoption policy](blueprint-adoption-merge-policy.md) · [review corrections](v3-consolidated-review.md) · [roadmap](product-implementation-roadmap.md).

## One useful, complete path

**Home → choose an actual PTB v0.2 file → inspect summary/map/source → review New project → Create knowledge project → persistent interactive Map → inspect related definition and its exact stored source → quit/restart → reopen the same project/map.** No release is needed.

Save every validated definition and explicit relationship, not just the visible map subset. Components/features become project structure; requirements remain Draft, actions Proposed/incomplete, scopes Draft plans, decisions Proposed and checks Planned/Not run. All development readiness is **Not assessed**, with factual definition counts. Source narrative is neither activity nor verification.

Keep the scope narrow: no requirement acceptance, action commitment/completion, scope activation, workflow execution, local definition editing, existing-project attachment/update, full History screen, linked checkpoints, Obsidian ingestion, AI/model calls, MCP, scheduling or development percentages. Existing project creation, backlog/release actions, checkpoints, Resume and Workflow Library remain functional. V5a adds linked recovery next; this slice preserves the existing project journals without pretending they already link to graph records.

## Repository facts and integration boundaries

Baseline: root `codex/v3-product-experience-design` at **9171004238ea10a216c169ff1b5da002d771c731**, schema v3. The current preview session retains a filesystem grant but **not** its authoritative snapshot. Existing `actions` have no proposal guard; `projectActions()` returns every ordinary action. These are real gaps, not presentation changes.

Reuse `BlueprintPreviewSession`, strict PTB parser/acquisition/graph validator, `WorkspaceStore` transaction/error patterns, `WorkspaceApi`/preload/IPC allowlist, `useProjectWorkspace`, `useBlueprintPreview`, Home/Sidebar/Panel/tokens and exact-source view. Keep native main-owned file picking and Windows containment/alias/race checks. Preserve CSP, app:// asset allowlist, trusted sender/frame/URL checks, sandbox/context isolation, bound SQL and Result envelopes. No new dependency or generic graph engine.

Installed React Flow/ELK/Base UI are candidates for this production composition, not proof of packaged compatibility. Exercise them under the real app:// CSP and rebuilt ASAR early in the authorized slice. Use `Dialog.Popup`'s installed `finalFocus` API. Do not copy the prototype's dialog, simulated state sets, graph adapters or selection-driven auto-layout.

## Additive persistence and identity

Propose **004_durable_knowledge.sql**, preserving every byte of 001–003. The [schema proposal](v3a1a-schema-proposal.md) specifies 13 tables, constraints, indexes and guards. They comprise three capture/binding tables, a small identity spine, revisioned common definitions, six typed payload tables, ordered inline-stage definitions and typed source-backed links. Components/features need no empty payload tables. JSON is limited to ordered literal arrays, captured diagnostics/headings and exact source coordinates; it is not the authoritative entity/relationship model.

| Identity / revision | Concrete rule |
| --- | --- |
| Project binding | One `(source_namespace='ptb', external_project_id)` maps to one ordinary `projects.id` in this profile. An unbound legacy project stays unbound. A title/path/hash is never an identity. Different existing binding or same-ID reimport offers Open existing / Cancel, not merge or a second project. |
| Entity | Permanent integer `knowledge_entities.id`, unique `(project_id, external_id)`, fixed kind. Action entities also bind one ordinary `actions.id` immediately. External IDs are preserved for display/crosswalk; React selection uses internal IDs after formation. |
| Definition | Append-only `(entity_id, revision)`; initial revision 1. Current pointer is explicit. No local editing/reimport API in V3a1a. Later changes append revisions and audited pointer changes under separately approved commands, never rewrite captured assertions. |
| Capture/source | **`knowledge_imports.id === operationId === importId`**, one main-generated UUID, identifies an applied capture and its receipt; its primary key is the durable retry key. Document key is capture-local; `(import_id, document_key)` is durable. Exact UTF-8 bytes, BOM/CRLF, hashes, headings, metadata/narrative/field spans survive restart. No absolute file path or grant is persisted. |
| Relation | Stable row ID, typed source entity/revision and target entity identity; source field/array-item location retained. Current graph uses current source revisions. Exact source inspection shows captured text/revision. V3a1a creates revision 1 only; arbitrary historical graph snapshots after future edits are **not** claimed. Target-version resolution/local-link provenance must be reviewed before editing/reimport; verified delivery snapshots remain separately deferred. |
| Workspace | Revision 1 for initial graph; later graph-changing commands advance it. Viewport, selection and node geometry are not domain revisions. No graph-layout table now. |

Authored inline-stage order and source presentation order are separate. Manifest/block order breaks browsing ties only; it never determines priority or graph identity. Stage keys are unique **within a scope-plan revision**, not release-stage IDs or activated development stages. Preserve unresolved/incompatible template references as Needs review with their key/version; do not copy release gates or invent stages.

### Ordinary action reuse without accidental work

Allocate ordinary action IDs during formation, with matching `action_details`, so later adoption does not replace the identity seen by any view or checkpoint. The linked knowledge entity is the explicit **Proposed** marker in V3a1a; no future commitment states or unused transition table are introduced yet.

Main guards reject knowledge-context actions through legacy complete/reopen/assign/exclude/edit commands. SQL also rejects completion, release membership and registration of an already completed/release-bound action. Filter these rows from the legacy backlog/release action read model; retain `findAction` for validation, with the guard before mutation. All legacy actions without knowledge context behave exactly as before. The authoritative imported definition is its revisioned payload; ordinary action/details are an initially matching compatibility projection, not another editable authority. Source order is not copied into operational action rank.

The future adoption slice must add explicit commitment/audit policy before relaxing the new guards. No proposal appears in release progress, even through direct IPC. Confirmed releases, verification invalidation and protected confirmation remain untouched.

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
  origin: { importId: string; occurrenceKey: string }; // Provenance, never node identity.
};
type KnowledgeLink = {
  relationshipId: number; fromEntityId: number; fromRevision: number;
  toEntityId: number; relation: PreviewRelation;
}; // Explicit source links only, not paths or ownership spokes.
type FormationReceipt = {
  operationId: string; importId: string; reviewDigest: string;
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
  project: Project; workspaceRevision: number; rootEntityId: number;
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
  | { kind: 'action'; state: 'proposed'; actionId: number; completedAt: null;
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
5. **One transaction:** insert ordinary project, workspace binding, applied import/receipt, exact documents, freshly created ordinary action/details rows, stable entities, common definitions, project/requirement/scope payloads and authored stages, then typed relationships, then action/decision/check payloads and one actual formation audit event. Scope/stage/link insertion must precede the action payload's placement guard. Check all payloads, owner/type pairs, source spans, cycles, stage links and expected counts before COMMIT; deferred FKs must pass. Nothing is published to renderer before COMMIT. Any error rolls back project/actions/graph/source/event/receipt together. Avoid nested calls to existing transaction-owning create/add methods; never accept a renderer-supplied action ID.
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
- Initial visible budget: 40 entities / 80 native edges; deterministic expansion with explicit hidden counts, search/reveal and a full accessible outline. Always keep the requested selected record visible; if its neighborhood exceeds budget, show the bounded subset and counts rather than silently truncating saved data. The persisted graph retains the existing 2,000-record / 20,000-edge bounds. Use bounded layout jobs with generation cancellation; on failure preserve the last layout and offer Arrange retry. No worker or CSP exception by default.
- At **1540×1000**, sidebar + generous map + one inspector. At **1160×820**, fewer layout columns and a readable map/inspector balance. At **800×800**, compact navigation + full-width map, with detail/source replacing the canvas and Back restoring position/focus. Do not shrink all labels to fit: map labels at rendered ≥11px and normal body/source at ≥14px, with pan/zoom or readable subset instead of six-pixel text. Empty, isolated, needs-review, invalid and failed-load states remain usable. Node positions/viewport survive selection/source open-close within the session; after restart arrange deterministically. Persistent personalized geometry is deferred.

## Reviewable implementation order and files reached

1. **Baseline and smallest live path:** rerun existing tests, then implement shared types, main prepared snapshot, 004/store transaction/guards, five IPC/preload methods and focused Node tests. Capture → review → create → read saved graph/source works before expanding map controls. Verify installed map/dialog layout under real app:// CSP early; no policy relaxation.
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
| Transaction/retry | Inject faults before import/receipt, after documents, action projection, definitions, links, audit and before commit: no partial project/action/source/history/receipt; original baseline unchanged. Invalid DB owner/kind/duplicate constraints fail. Double Apply/receipt replay yields one project/event; digest mismatch/stale plan/refresh/cancel rejected; source-binding race cannot duplicate. Lost acknowledgement replays same operation; acknowledged-write/failed-read retries reads only. Backup failure, mid-migration rollback, FK check and newer-schema refusal. |
| Proposal isolation | Legacy complete/reopen/assign/exclude/edit reject new knowledge actions by real API, not just hidden UI; DB blocks completion/release membership. Existing release progress and frozen histories unchanged. No action creation event is backdated to source. Counts/Not assessed never imply verified readiness. |
| Map usefulness | Native component-feature links visible on first open; expand/collapse/reveal and direct/indirect labels correct; cross-cutting identity unique; isolated records reachable. Selection preserves viewport/geometry; drag changes positions; Fit vs Arrange distinct; stale layouts/reads cannot replace current view. Bounded high-degree data remains navigable without dropping persisted links. Inspect all three widths with actual labels/data/screenshots, not overflow alone. |
| Keyboard/errors | Tab/Enter through map outline/node/inspector/source; labelled controls; Escape and Close restore opener/fallback; removed-opener case; narrow Back restores map context. Loading/empty/invalid/needs-review/locked-write/read-failure/expired-plan states have accurate messages and safe retries. Source renders inertly; reduced-motion honored. |
| Packaged recovery | Rebuild Windows executable/ASAR from final renderer. Real app://+locked installed libraries, no CSP/network/runtime errors. Create knowledge project from actual fixture, inspect graph/source, fully terminate, move source fixture copy, restart same profile, recover identical identities/revisions/bytes/proposals/event and existing Resume/release/workflow data. V2 cancel/preview-only test still leaves DB unchanged. Screenshots from this executable, not the prototype or an older build. |

Record actual commands, counts, skips/failures and evidence paths when executed. Prior 103 V2 checks are historical, **not new V3a1a results**. User manually reviews native picker, map clarity/density, labels, source selection/focus, real project formation and full restart before acceptance. Passing a standalone layout/projection test is insufficient.

## Approval requested: four consequential choices

Contract contradictions resolved in this proposal: PTB's older “resolve before apply” wording now distinguishes permitted draft-only formation from blocked activation/scoped commitment; receipt ID explicitly equals operation/import ID; relationships do not pretend to be complete historical target-version snapshots. These clarifications change no V2 parser syntax or production behavior.

1. **004 and the concrete typed schema:** source/project binding + immutable exact capture/receipt + revisioned typed definitions/links, no operational scope/evidence/release-snapshot tables. Byte retention and one canonical PTB project ID/profile are intentional.
2. **Stable proposed action IDs now:** allocate ordinary action/details rows, mark by knowledge context, hide from legacy backlog and block legacy completion/release APIs until separately approved adoption. No legacy reclassification or fabricated history.
3. **Formation authority and retry:** all-valid definitions as proposals, main-owned captured plan, atomic new-project-only application, receipt-first identical retry, same binding → Open existing, no destructive Undo or source-update merge in this slice.
4. **First visual scope:** summary/review → Overview and genuinely connected refined-C Map → rich read-only inspector/exact stored source, with existing project Resume/legacy workspace accessible. Bounded interactive graph and session-only geometry; V5a linked recovery next, no inactive future controls.

On approval, record the accepted consequential design in new ADR 0008 and implement/verify this slice only. Until then this is documentation plus disposable schema checks; no migration, production module or prototype merge is authorized.
