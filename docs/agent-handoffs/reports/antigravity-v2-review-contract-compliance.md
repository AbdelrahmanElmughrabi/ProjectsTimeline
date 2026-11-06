# Antigravity Reviewer 2 — V2 Blueprint Preview Contract, Invalid-Source & State Compliance Review

2026-11-06 · **Phase A read-only review.**
- **Reviewer role:** Contract, invalid-source & state compliance reviewer (`research` subagent)
- **Model class:** `flash` (Gemini Flash lighter read-only review agent)
- **Evaluated checkout:** `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui`
- **Branch / Base ref:** `antigravity/v2-preview-ui` at `codex/v2-preview-phase-a` (`92531b96a7aa4338b65264b492096a445835dabe`), source base `9d638f2511334c185e96ee10dc63ca287708eb92`
- **Product/source edits by reviewer:** None (strictly read-only; serialized and committed by Antigravity on the branch per `v2-collaboration.md`).

## 1. Scope and Files Inspected

1. `docs/v2-preview-contract.md` (Candidate v1 implementation contract)
2. `docs/agent-handoffs/contracts/v2-preview.ts` (Normative typed candidate DTOs)
3. `docs/design/ptb-v0.2-contract.md` and `docs/design/ptb-v0.2-examples.md`
4. `docs/design/examples/ptb-v0.2/small/project.md` (Desk Notes: 1 file, 15 records, 29 domain links)
5. `docs/design/examples/ptb-v0.2/complex/project.md`, `domain.md`, `work.md`, `assurance.md` (FieldLedger: 4 files, 37 records, 82 domain links)
6. `src/shared/contracts.ts` (`ActionType`, `Result`)

## 2. Findings

1. **CON-01 — Complete Representation of Desk Notes (15 records) and FieldLedger (37 records) (`docs/agent-handoffs/contracts/v2-preview.ts#L46-L91`):**
   - Every record kind (`project`, `component`, `feature`, `requirement`, `scope`, `action`, `decision`, `check`), requirement classification (`functional`, `quality`, `constraint`), action classification (`ActionType`), and check method (`manual`, `automated`, `null`) in both fixtures maps 1-to-1 to `PreviewRecord`.
   - All 9 typed domain relationships (`parent-component`, `primary-component`, `applies-to-feature`, `concerns-feature`, `concerns-scope`, `addresses-requirement`, `affects-feature`, `affects-requirement`, `plans-to-verify`) are explicitly modeled in `PreviewRelationship`, while scope-local stage bindings are cleanly separated into `PreviewStageAssignment` (`status: 'unscoped' | 'unassigned' | 'resolved' | 'unresolved-workflow' | 'invalid'`).
   - Project-wide requirements (`req.recorded-origin` with `features: []`) and unscoped actions (`act.document-note-recovery`, `act.research-recovery-note` with `scope: null, stage: null`) require no synthetic links.

2. **CON-02 — Duplicate External IDs & Ambiguous Links (`docs/agent-handoffs/contracts/v2-preview.ts#L56-L78`, `docs/v2-preview-contract.md#L27`):**
   - Each occurrence has a unique opaque `PreviewOccurrence.key` distinct from its declared external PTB `record.id`.
   - Colliding IDs produce `PreviewRelationship.status === 'ambiguous'` with all matching occurrence keys in `targetKeys` (never first-wins) and `DUPLICATE_ID` diagnostics carrying `relatedSources`.
   - **Phase B safeguard:** Key every React list item and selection callback by `occurrence.key` (never by `record.id`), and render all `targetKeys` on ambiguous relationships as distinct selectable occurrence links.

3. **CON-03 — Invalid Occurrences, Unclosed Fences & Cyclic Structure Isolation (`docs/agent-handoffs/contracts/v2-preview.ts#L64-L66`, `docs/agent-handoffs/contracts/v2-preview.ts#L115-L119`, `docs/v2-preview-contract.md#L24-L28`, `docs/v2-preview-contract.md#L43`):**
   - Unclosed root `ptb` fences (`PTB_FENCE_UNCLOSED`), malformed JSON (`JSON_SYNTAX`), duplicate keys (`DUPLICATE_KEY`), or schema-invalid blocks remain inspectable as `state: 'invalid-record'` occurrences with optional `declaredId` / `declaredKind`, `metadataSource`, `narrativeSource`, `narrativeMarkdown`, and `diagnosticIds`.
   - Schema-valid components/features involved in parent cycles (`COMPONENT_CYCLE`) or broken parent links are excluded from `structure.rows` and listed in `structure.invalidStructureKeys`.
   - **Phase B safeguard:** Render the Components/Features tree strictly by iterating `snapshot.structure.rows` (`{ recordKey, depth }`), followed by `unplacedFeatureKeys` and `invalidStructureKeys`, and render `state: 'invalid-record'` occurrences in the dedicated **Invalid records** section. Never recursively traverse `component.parent` in the renderer.

4. **CON-04 — UTF-16 Code-Unit Slicing vs. UTF-8 Byte Offsets (`docs/agent-handoffs/contracts/v2-preview.ts#L11-L22`, `docs/v2-preview-contract.md#L25`, `docs/v2-preview-contract.md#L69`):**
   - `PreviewPoint` supplies both `byteOffset` (UTF-8 byte offset including any leading BOM) and `utf16Offset` (index into the exact captured `document.text` string, which retains CRLF and any leading BOM), plus 1-based `line` and Unicode-code-point `column`.
   - **Phase B safeguard:** When slicing `document.text` in JavaScript to highlight a selected `PreviewSourceRef.span` (metadata block, narrative slice, heading, or diagnostic range), the renderer **must** slice by `span.start.utf16Offset` and `span.end.utf16Offset` without stripping `\uFEFF` or normalizing `\r\n` to `\n`. Display `line`, `column`, and `byteOffset` as metadata labels only.

5. **CON-05 — Unavailable Documents & Null Project Key (`docs/agent-handoffs/contracts/v2-preview.ts#L23-L32`, `docs/agent-handoffs/contracts/v2-preview.ts#L99`, `docs/agent-handoffs/contracts/v2-preview.ts#L108`, `docs/v2-preview-contract.md#L28`):**
   - When a manifest-declared file is missing, outside the root, aliased, or over size limits, `PreviewDocument` has `status: 'unavailable'` and `text: null`, `sha256: null`, `byteLength: null`, `headings: []`. Diagnostics on unread files have `source: null`.
   - When no unique schema-valid project record exists (`PROJECT_MISSING` or `PROJECT_COUNT`), `snapshot.projectKey` is `null` and `semanticSha256` is `null`.
   - **Phase B safeguard:** Guard all `document.text` accesses on `document.status === 'captured' && document.text !== null`; render an explicit "Source unavailable (not read)" state with the associated diagnostic when `text === null`, and render "Project identity unresolved / invalid" when `projectKey === null`.

6. **CON-06 — Workflow Resolution Honesty (`docs/agent-handoffs/contracts/v2-preview.ts#L79-L91`, `docs/v2-preview-contract.md#L53`):**
   - Because existing v3 workflow templates are release-purpose only, any `template_key` reference in V2 resolves to either `status: 'incompatible'` (`WORKFLOW_PURPOSE` error) or `status: 'unresolved'` (`WORKFLOW_UNRESOLVED` resolution diagnostic) with `stages: []`, and actions in an `'unresolved'` scope have `PreviewStageAssignment.status === 'unresolved-workflow'`.
   - **Phase B safeguard:** Display explicit "Proposal (uncommitted)", "Planned check (not run)", "Proposed decision (not accepted)", and workflow resolution badges (`Inline stages`, `No workflow`, `Unresolved library workflow`, `Incompatible release workflow`) without offering any mutation, fallback, or approval controls.

7. **CON-07 — Minor Contract Clarifications (`AG-Q-02`, `AG-Q-03`):**
   - In `BlueprintPreviewSnapshot.counts` (`{ occurrences, unparsed, errors, resolutions, warnings }`), confirm that `occurrences === snapshot.records.length` (all occurrences) and `unparsed === snapshot.records.filter(r => r.state === 'invalid-record').length`.
   - Confirm what `PreviewSelection.documentId` should be when selecting a package-level diagnostic whose `source` is `null` and which is not tied to a specific document (e.g., default to `snapshot.documents[0]?.id ?? ''`).

## 3. Verification Limits

- Read-only static inspection of `docs/v2-preview-contract.md`, `docs/agent-handoffs/contracts/v2-preview.ts`, PTB v0.2 design docs, and the `small` / `complex` fixtures.
- No parser, IPC command, or Electron UI was executed in Phase A.


---

## 4. Phase B Implementation Follow-Up Review (2026-11-06)

- **Reviewed UI commit:** `0018f48cf87941a45b1c9975397dec9fa5ad9d66` on `antigravity/v2-preview-ui` (incorporating Codex shared-type commits `601a350bc44356a7886d650867b5ec7dcfe772a7` -> `a37ba50` and `838a8eb0223b94c6fca265efdfe57c7b48a164d5` -> `cb78d11`)
- **Files inspected (read-only):** `src/shared/blueprint-preview.ts`, `BlueprintPreview.tsx`, `BlueprintRecordList.tsx`, `BlueprintRecordInspector.tsx`, `BlueprintSourceView.tsx`, `BlueprintDiagnostics.tsx`, `tests/e2e/blueprint-preview-ui.test.mjs`
- **Disposition of CON-01..CON-07 & `AG-Q-01..03`:**
  - **CON-01 (Verified):** All 8 outline sections (Project, Components/Features, Requirements, Scopes, Proposed Actions, Proposed Decisions, Planned Checks, Unparsed/Invalid Records) and all 9 domain relationship kinds are rendered in declared order without locale/title re-sorting.
  - **CON-02 (Verified):** Every list item and selection callback keys by opaque `PreviewOccurrence.key`, ambiguous relationships render jump buttons for all `rel.targetKeys` without first-wins selection, and `relatedSources` render individual buttons.
  - **CON-03 (Verified):** Component/feature hierarchy iterates `snapshot.structure.rows` (`{ recordKey, depth }`), followed by `unplacedFeatureKeys` and `invalidStructureKeys` without recursive parent traversal. `state: 'invalid-record'` occurrences render in Section 8.
  - **CON-04 (Verified):** `BlueprintSourceView.tsx` slices `activeDocument.text` strictly by `span.start.utf16Offset` and `span.end.utf16Offset` without stripping BOM or normalizing CRLF.
  - **CON-05 (Verified):** Unavailable documents (`status === 'unavailable'` or `text === null`) and `projectKey === null` snapshots render explicit unavailable/null states without fabricating line numbers or titles.
  - **CON-06 & CON-07 (Verified against `AG-Q-01..03`):** Both `WORKFLOW_PURPOSE` (`status: 'incompatible'`) and `WORKFLOW_UNRESOLVED` (`status: 'unresolved'`) display **Needs review** (`severity: 'resolution'`), never syntax errors or transferred release-confirmation stages. Package-level diagnostics (`source: null`) emit `{ snapshotId, documentId: null, recordKey: null, diagnosticId: diag.id, source: null }`. Counts are labeled `"X total occurrences · Y unparsed / invalid records"`.
  - **Security & boundary invariants (Verified):** Zero `window.workspace` calls, zero `dangerouslySetInnerHTML`, zero `window.open`, and all CSS selectors in `blueprint-preview.css` are scoped under `.blueprint-preview`.
- **Verification limits:** Static inspection of Phase B implementation plus `npm run typecheck` (`EXIT=0`) and `node --test tests/e2e/blueprint-preview-ui.test.mjs` (`1 pass, 2 skipped AWAITING INTEGRATION`). Full parser/IPC Electron execution awaits Codex's Phase C integration ref.
