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


---

# Phase B Update — Bounded `BlueprintPreview` UI Implementation & Verification (2026-11-06)

- **Authorization & BEGIN ref:** User-confirmed Phase B authorization + Codex handoff at `codex/v2-preview-phase-b` (`b3db26b39d8227c7082e066295ce5f4a39db07ac`, [docs/agent-handoffs/antigravity-v2-begin.md](../antigravity-v2-begin.md)).
- **Original finalized contract ref (`codex/v2-preview-contract`):** `1cb122d0946b1131268e07154198899657c1d769`
- **Preserved Phase A review commit on `antigravity/v2-preview-ui`:** `07f89d830ae196cb74e3cde978faead4e3e2920f`
- **Cherry-picked canonical shared-type commits (in order):**
  1. `601a350bc44356a7886d650867b5ec7dcfe772a7` → `a37ba5055f233f4a199493f56e80647a93944185` (`chore: publish type-only V2 blueprint preview contract`)
  2. `838a8eb0223b94c6fca265efdfe57c7b48a164d5` → `cb78d112d846121cf50a2a47a5e8f87f7e0d6172` (`fix: allow package-level blueprint selection without a document`)
- **Phase B UI & test implementation commit on `antigravity/v2-preview-ui`:** `0018f48cf87941a45b1c9975397dec9fa5ad9d66` (`feat: implement bounded V2 Blueprint Preview presentation UI`)

## 6. Phase B Files Added (Strict Allowlist Compliance)

Only files in the authorized Phase B allowlist were created; zero existing application, shared, preload, main, database, style, or package files were edited:

1. `src/renderer/blueprint-preview/BlueprintPreview.tsx` — Named export `BlueprintPreview` accepting `BlueprintPreviewProps` from `../../shared/blueprint-preview`; renders top header, phase banners (`idle`, `loading`, `ready`, `stale`, `error`, `expired`, `cancelling`), snapshot summary strip, document list + heading anchors, and 2-column / compact 1-column workspace with `Escape` focus restoration.
2. `src/renderer/blueprint-preview/BlueprintRecordList.tsx` — Renders the 8 ordered outline sections (`Project`, `Components & features` via `snapshot.structure.rows` + `unplacedFeatureKeys` + `invalidStructureKeys`, `Requirements`, `Scopes` with inline stage order or `Needs review` workflow status, `Proposed actions`, `Proposed decisions`, `Planned checks`, and `Unparsed / invalid records`).
3. `src/renderer/blueprint-preview/BlueprintRecordInspector.tsx` — Single connected selected-record inspector displaying normalized metadata, `Proposal (uncommitted)` / `Planned check (not executed)` / `Proposed decision (not accepted)` / `Needs review` badges, outbound and inbound relationships (including all `targetKeys` for `ambiguous` links), inert captured `narrativeMarkdown`, and occurrence diagnostics.
4. `src/renderer/blueprint-preview/BlueprintSourceView.tsx` — Displays exact captured `document.text` as inert text nodes with exact `span.start.utf16Offset`..`span.end.utf16Offset` `<mark>` highlighting (preserving leading BOM and CRLF), heading chips, and explicit unavailable/package-level empty states.
5. `src/renderer/blueprint-preview/BlueprintDiagnostics.tsx` — Renders severity-ordered diagnostics (`error` → `resolution` (`Needs review`) → `warning`) with `code`, `field`, `line:column` span, occurrence jump buttons, and individually focusable `relatedSources` buttons. Package-level diagnostics (`source: null`) emit `{ snapshotId, documentId: null, recordKey: null, diagnosticId: diag.id, source: null }` per `AG-Q-02`.
6. `src/renderer/blueprint-preview/blueprint-preview.css` — All style rules strictly scoped under `.blueprint-preview`, reusing `tokens.css` variables and collapsing cleanly to a single column below `1060px` (covering `800px` outer window widths) while providing a 2-column master-detail layout at `1160px` and `1440px`.
7. `tests/e2e/blueprint-preview-ui.test.mjs` — Focused Phase B contract, inert UTF-16 slicing, and CSS namespace invariant check (`PASS`), plus 2 Electron integration-dependent E2E / screenshot suites explicitly marked `AWAITING INTEGRATION`.

## 7. Phase B Action & Command Log

| Working directory | Command / action | Purpose | Actual outcome |
| --- | --- | --- | --- |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | `git show codex/v2-preview-phase-b:docs/agent-handoffs/antigravity-v2-begin.md`, `v2-review-queue.md`, `v2-preview-contract.md`, `src/shared/blueprint-preview.ts` | Inspect Codex's `BEGIN Phase B` authorization, source-only commits, and resolutions to `AG-Q-01..03` | Confirmed Phase B open; read `601a350` + `838a8eb` and `AG-Q-01..03` resolutions |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | `git cherry-pick 601a350bc44356a7886d650867b5ec7dcfe772a7` then `git cherry-pick 838a8eb0223b94c6fca265efdfe57c7b48a164d5` | Incorporate authorized canonical `src/shared/blueprint-preview.ts` commits onto `antigravity/v2-preview-ui` | Clean cherry-picks (`a37ba50`, `cb78d11`); Phase A commit `07f89d8` preserved |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | Write `BlueprintPreview.tsx`, `BlueprintRecordList.tsx`, `BlueprintRecordInspector.tsx`, `BlueprintSourceView.tsx`, `BlueprintDiagnostics.tsx`, `blueprint-preview.css`, `tests/e2e/blueprint-preview-ui.test.mjs` | Implement bounded V2 Blueprint Preview presentation UI and test file | 7 allowlisted files created; 0 edits outside allowlist |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | `npm ci --ignore-scripts --no-audit --no-fund` | Install locked baseline in isolated worktree for TypeScript verification (after initial offline cache miss) | Passed (`added 152 packages in 23s`); `package.json` and `package-lock.json` untouched |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | `npm run typecheck` (`tsc -p tsconfig.node.json --noEmit && tsc -p tsconfig.renderer.json`) | Verify strict TypeScript compilation of `BlueprintPreview` against `src/shared/blueprint-preview.ts` | Passed (`EXIT=0`) |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | `node --test tests/e2e/blueprint-preview-ui.test.mjs` | Run Phase B UI invariant checks and verify integration-dependent Electron cases are marked `AWAITING INTEGRATION` | Passed (`1 pass, 0 fail, 2 skipped AWAITING INTEGRATION`) |
| `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui` | Re-run both read-only `flash` review subagents on implemented Phase B files; commit UI (`0018f48`) and updated reports | Verify UX/keyboard/compact-layout (`UX-01..05`) and contract/state compliance (`CON-01..07`, `AG-Q-01..03`) | Both reviewers verified 100% compliance; reports updated and committed |

## 8. Resolution Status of Contract Questions (`AG-Q-01`..`AG-Q-03`)

All three Phase A questions were resolved by Codex in `codex/v2-preview-phase-b` (`b3db26b`) and implemented in `0018f48`:
- **`AG-Q-01` (Resolved & implemented):** Document-only selection `{ snapshotId, documentId, recordKey: null, diagnosticId: null, source: null }` is emitted when selecting a document or clearing detail selection (`Escape` / `← Back to outline` / `Clear source range highlight`).
- **`AG-Q-02` (Resolved & implemented):** `PreviewSelection.documentId` is `string | null` (`838a8eb`). Selecting a package-level diagnostic with `source: null` emits `{ snapshotId, documentId: null, recordKey: null, diagnosticId: diag.id, source: null }` without falling back to the first document or inventing a location.
- **`AG-Q-03` (Resolved & implemented):** Header and outline labels display `counts.occurrences` as total occurrences and `counts.unparsed` as `unparsed / invalid records` (covering both malformed JSON and schema-invalid occurrences). Both `WORKFLOW_PURPOSE` and `WORKFLOW_UNRESOLVED` display as `Needs review` (`severity: 'resolution'`).
- **Remaining unresolved contract questions:** **None (`0`).**

## 9. Verification Status, Screenshots & Next Owner

- **Executed & passed in Phase B:**
  - `npm run typecheck`: **PASS** (`tsc -p tsconfig.node.json --noEmit && tsc -p tsconfig.renderer.json`, `0` errors).
  - `node --test tests/e2e/blueprint-preview-ui.test.mjs`: **PASS** (`1` static contract/slicing/CSS-namespace invariant test passed; `2` Electron E2E + screenshot suites skipped with `# AWAITING INTEGRATION`).
- **Awaiting Phase C integration (not claimed as executed in UI-only branch):**
  - End-to-end Electron runs of *Desk Notes* (`15` records) and *FieldLedger* (`37` records), hostile/invalid inputs, and `800px` / `1160px` / `1440px` screenshots under `artifacts/` require Codex's Phase C integration branch wiring `useBlueprintPreview`, `App.tsx` / `ProjectHome.tsx`, and the main-process PTB parser/session commands.
- **Next owner:** **Codex (`V2-INTEGRATE-001`)** to review the bounded diff (`cb78d11..HEAD` on `antigravity/v2-preview-ui`), integrate with the real backend/controller in a Phase C integration branch, and supply the integration ref (or run full Node/Electron/packaged verification).
