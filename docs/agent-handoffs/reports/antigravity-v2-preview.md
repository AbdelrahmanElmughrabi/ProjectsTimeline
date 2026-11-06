# Antigravity → Codex / user — V2 Blueprint Preview Report (Phase A Contract Review)

2026-11-06 · **Phase A read-only contract review complete; awaiting Phase B gates.**
- **Contract version reviewed:** `v2-preview-1` ([docs/v2-preview-contract.md](../../v2-preview-contract.md), [docs/agent-handoffs/contracts/v2-preview.ts](../contracts/v2-preview.ts))
- **Prepared worktree:** `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui`
- **Branch:** `antigravity/v2-preview-ui`
- **Frozen Phase A base ref (`codex/v2-preview-phase-a`):** `92531b96a7aa4338b65264b492096a445835dabe`
- **Source baseline commit (`9d638f2`):** `9d638f2511334c185e96ee10dc63ca287708eb92`
- **Product / source / test files changed in Phase A:** None (`0` files). Only this report and the two attributed read-only reviewer reports under `docs/agent-handoffs/reports/` were added on `antigravity/v2-preview-ui`.

## 1. Linked Read-Only Reviewer Reports

Two bounded, read-only `flash`-class review subagents inspected the Phase A candidate contract and existing renderer tokens/components without editing product files or sub-delegating:

1. **UX, Keyboard Navigation & Compact Layout Review (`flash`):** [antigravity-v2-review-ux-keyboard.md](antigravity-v2-review-ux-keyboard.md)
2. **Contract, Invalid-Source & State Compliance Review (`flash`):** [antigravity-v2-review-contract-compliance.md](antigravity-v2-review-contract-compliance.md)

## 2. Concise Action & Command Log

| Working directory | Command / action | Purpose | Actual outcome |
| --- | --- | --- | --- |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline` | `git -C .agent-worktrees/antigravity-v2-preview-ui rev-parse HEAD`, `branch --show-current`, `rev-parse codex/v2-preview-phase-a`, `status --short` | Verify prepared checkout, branch, frozen Phase A base ref, and clean working tree | Passed: branch `antigravity/v2-preview-ui` at `92531b96a7aa4338b65264b492096a445835dabe` (`codex/v2-preview-phase-a`), clean status |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | Read `v2-preview-contract.md`, `contracts/v2-preview.ts`, `v2-collaboration.md`, `v2-review-queue.md`, `reports/codex-v2-preview.md`, `ptb-v0.2-contract.md`, `ptb-v0.2-examples.md`, `development-domain-contract.md`, `connected-workspace-design.md`, `product-traceability.md`, `product-implementation-roadmap.md`, ADRs `0001–0007`, `verification.md`, `engineering-checklist.md`, `feature-alignment.md`, both `ptb-v0.2` fixtures, `ui-reference.png`, and renderer source (`App.tsx`, `ProjectHome.tsx`, `ProjectSidebar.tsx`, `Panel.tsx`, `tokens.css`, `styles.css`) | Full Phase A read-only contract and boundary inspection | Completed; confirmed preview-only scope and strict file allowlist |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline` | `node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module Node16 --moduleResolution Node16 --types node ".../docs/agent-handoffs/contracts/v2-preview.ts"` | Verify candidate TypeScript DTO contract compiles cleanly with strict flags and no emit | Passed (`EXIT=0`) |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | Run 2 read-only `flash` review subagents; serially write and commit `antigravity-v2-review-ux-keyboard.md`, `antigravity-v2-review-contract-compliance.md`, and `antigravity-v2-preview.md` | Record Phase A contract review findings and questions on `antigravity/v2-preview-ui` | Reports written and committed; zero product/test/parent-checkout edits |

## 3. Contract Assessment & Phase B Design Commitments

`v2-preview-1` (`BlueprintPreviewProps`, `BlueprintPreviewViewState`, `PreviewSelection`, `BlueprintPreviewSnapshot`) is **sound, complete, and sufficient for the Phase B `BlueprintPreview` frontend implementation** without requiring any new shared fields or boundary changes. Specifically:

1. **Pure controlled boundary:** `BlueprintPreview` will render strictly from `BlueprintPreviewProps` (`state`, `selection`, `onChoose`, `onRefresh`, `onCancel`, `onSelect`) and will never invoke `window.workspace` directly, infer domain relationships, recursively traverse cyclic component parents, or display Apply/Import/Accept/Complete controls.
2. **Fixture & invalid-source fidelity:**
   - All 15 records / 29 links in *Desk Notes* and 37 records / 82 links in *FieldLedger* map cleanly to `PreviewRecord`, `PreviewRelationship`, `PreviewWorkflowResolution`, and `PreviewStageAssignment`.
   - Duplicate external IDs are keyed and selected by opaque `PreviewOccurrence.key` (never `record.id`), ambiguous relationships list all `targetKeys` without first-wins picking, and diagnostics with `relatedSources` render individual keyboard-accessible jump buttons for every location.
   - Component/feature hierarchy renders strictly from backend-computed `snapshot.structure.rows` (`{ recordKey, depth }`), followed by `unplacedFeatureKeys` and `invalidStructureKeys`, while `state: 'invalid-record'` occurrences (`PTB_FENCE_UNCLOSED`, `JSON_SYNTAX`, `DUPLICATE_KEY`, schema errors) appear in the dedicated **Invalid records** section.
3. **Inert source & exact UTF-16 span highlighting:**
   - Captured Markdown (`document.text` and `occurrence.narrativeMarkdown`) is rendered as inert plain text nodes—no `dangerouslySetInnerHTML`, HTML parsing, image loading, or URL auto-opening.
   - Range highlighting slices `document.text` exclusively by `span.start.utf16Offset` and `span.end.utf16Offset` without stripping leading BOM or normalizing CRLF, preserving exact offset alignment with backend positions.
   - Unavailable documents (`status: 'unavailable'`, `text: null`) and `projectKey: null` snapshots render explicit unavailable/unresolved states without fabricating lines or titles.
4. **Responsive layout across 800px / 1160px / 1440px (no 4th rail):**
   - At 800px outer width (`~544px` main content canvas), `BlueprintPreview` uses a stacked/single-column master-detail flow with an explicit `← Back to outline` control and `Escape` handler restoring focus to the opener button.
   - At 1160px (`~888px` canvas) and 1440px (`~1168px` canvas), `BlueprintPreview` uses at most a 2-column layout (Left: Document list + Outline sections + Diagnostics list; Right: Selected-Record Inspector + Captured Source View), with `min-width: 0` and `overflow-wrap: anywhere` throughout `.blueprint-preview`.

## 4. Numbered Contract Questions / Clarifications for Codex (`v2-review-queue.md`)

None of these block `v2-preview-1` approval; they confirm exact controller/UI conventions for Phase B:

- **`AG-Q-01` (`PreviewSelection` deselection / document-only selection):**
  Since `BlueprintPreviewProps.onSelect` takes a non-null `PreviewSelection` where `recordKey`, `diagnosticId`, and `source` are `string | null`, we plan to emit `{ snapshotId: snapshot.snapshotId, documentId: currentDocId, recordKey: null, diagnosticId: null, source: null }` when the user closes a transient record/diagnostic detail view (e.g., via `Escape` or `Back to outline`) or switches documents. Please confirm that Codex's `useBlueprintPreview` controller accepts `{ snapshotId, documentId, recordKey: null, diagnosticId: null, source: null }` as a valid document-level selection.
- **`AG-Q-02` (`PreviewSelection.documentId` for package-level diagnostics with `source: null`):**
  When a user selects a diagnostic whose `source` is `null` (e.g., `PROJECT_MISSING` or `LIMIT_EXCEEDED`), should the UI pass `documentId: selection?.documentId ?? snapshot.documents[0]?.id ?? ''` in `onSelect`?
- **`AG-Q-03` (`counts.occurrences` and `counts.unparsed` definitions):**
  Please confirm that `snapshot.counts.occurrences` equals `snapshot.records.length` (all occurrences, both `record` and `invalid-record`) and `snapshot.counts.unparsed` equals `snapshot.records.filter(r => r.state === 'invalid-record').length`, so header count pills label them accurately.

## 5. Tests, Screenshots & Current Limitations

- **Tests executed in Phase A:** Standalone TypeScript check of `docs/agent-handoffs/contracts/v2-preview.ts` (`EXIT=0`).
- **UI E2E tests & screenshots (`tests/e2e/blueprint-preview-ui.test.mjs`, `artifacts/`):** **AWAITING PHASE B AUTHORIZATION AND PHASE C INTEGRATION.** No UI code or E2E test was written or executed in Phase A.
- **Next owner / gate:** User and Codex (`V2-DEP-001`, `V2-CON-001`, `V2-HANDOFF-001`, `V2-READY-001`). Antigravity is stopped at the Phase A boundary and awaits:
  1. Explicit user approval of `v2-preview-1` / dependencies and Codex's `BEGIN Phase B` message with exact refs; and
  2. Codex's contract-only commit landing `src/shared/blueprint-preview.ts` to cherry-pick into `antigravity/v2-preview-ui`.
