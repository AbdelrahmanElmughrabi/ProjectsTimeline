# Antigravity Reviewer 1 — V2 Blueprint Preview UX, Keyboard & Compact Layout Review

2026-11-06 · **Phase A read-only review.**
- **Reviewer role:** UX, keyboard navigation & compact layout reviewer (`research` subagent)
- **Model class:** `flash` (Gemini Flash lighter read-only review agent)
- **Evaluated checkout:** `C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline/.agent-worktrees/antigravity-v2-preview-ui`
- **Branch / Base ref:** `antigravity/v2-preview-ui` at `codex/v2-preview-phase-a` (`92531b96a7aa4338b65264b492096a445835dabe`), source base `9d638f2511334c185e96ee10dc63ca287708eb92`
- **Product/source edits by reviewer:** None (strictly read-only; serialized and committed by Antigravity on the branch per `v2-collaboration.md`).

## 1. Scope and Files Inspected

1. `docs/v2-preview-contract.md` (Candidate `v2-preview-1` commands, ordering, view states, diagnostics catalog)
2. `docs/agent-handoffs/contracts/v2-preview.ts` (Normative typed candidate DTOs)
3. `docs/design/connected-workspace-design.md` (Information architecture, 800/1160/1440px window sizes, keyboard/focus rules)
4. `src/renderer/tokens.css`, `src/renderer/styles.css`, `src/renderer/Panel.tsx`, `src/renderer/ProjectHome.tsx`, `src/renderer/App.tsx`

## 2. Findings

1. **UX-01 — Window Canvas Geometry & Four-Rail Collapse Hazard (`src/renderer/tokens.css#L50-L51`, `src/renderer/styles.css#L17`, `src/renderer/styles.css#L54`, `src/renderer/styles.css#L201-L210`, `docs/design/connected-workspace-design.md#L48`):**
   - The app shell reserves `208px` for the sidebar at `681px–1119px` and `224px` at `>=1120px`, plus `48px` horizontal `.main-content` padding (`var(--space-6)` each side).
   - Available inner canvas widths are approximately **544px** (at 800px outer width), **888px** (at 1160px), and **1168px** (at 1440px).
   - `BlueprintPreview` must present four logical surfaces: **Engineering Outline/Structure**, **Selected-Record Inspector**, **Captured Source View**, and **Diagnostics**. Rendering more than two columns simultaneously would crush preformatted Markdown lines, SHA-256 digests, and JSON pointer paths (`diagnostic.field`) and violate `connected-workspace-design.md#L48` ("rather than adding a fourth cramped column").
   - **Phase B recommendation:** Use a single-column stacked/detail flow at compact widths (`<= 960px` outer / `~544px` canvas at 800px) with an explicit `← Back to outline` control when inspecting a record/source anchor, and a two-column master-detail layout at `1160px` and `1440px` (Left: Document list + Outline sections + Diagnostics summary/list; Right: Selected-Record Inspector + Captured Source View with `min-width: 0` everywhere).

2. **UX-02 — Monospace Font Stack & Preformatted Source Wrapping (`src/renderer/tokens.css#L40`, `docs/v2-preview-contract.md#L25`, `docs/v2-preview-contract.md#L69`):**
   - `tokens.css` defines `--font-ui` only; since `tokens.css` is outside the Phase B allowlist, `.blueprint-preview` in `blueprint-preview.css` should define a local `--preview-font-mono: 'Cascadia Code', Consolas, 'Segoe UI Mono', ui-monospace, monospace;` token and enforce `min-width: 0` and `overflow-wrap: anywhere; white-space: pre-wrap;` on source lines so 800px windows never incur horizontal page overflow (`document.documentElement.scrollWidth <= document.documentElement.clientWidth`).

3. **UX-03 — `PreviewSelection` Deselection & Document-Only Selection (`docs/agent-handoffs/contracts/v2-preview.ts#L133-L139`, `docs/agent-handoffs/contracts/v2-preview.ts#L148-L155`):**
   - `BlueprintPreviewProps.selection` is `PreviewSelection | null`, whereas `onSelect` takes `(selection: PreviewSelection) => void` (non-null), and `PreviewSelection` has nullable `recordKey: string | null`, `diagnosticId: string | null`, and `source: PreviewSourceRef | null` alongside required `snapshotId: string` and `documentId: string`.
   - Consequently, closing a transient record/diagnostic detail view (e.g. via `Escape` or a `Back to outline` / `Clear selection` control) while keeping the current document open can and should emit `onSelect({ snapshotId: snapshot.snapshotId, documentId: currentDocumentId, recordKey: null, diagnosticId: null, source: null })`.
   - See Question `AG-Q-01` in the main report to confirm that Codex's `useBlueprintPreview` controller treats `{ snapshotId, documentId, recordKey: null, diagnosticId: null, source: null }` as a valid document-level selection.

4. **UX-04 — Co-populated `recordKey`, `diagnosticId`, and `relatedSources` Navigation (`docs/agent-handoffs/contracts/v2-preview.ts#L92-L101`, `docs/agent-handoffs/contracts/v2-preview.ts#L133-L139`):**
   - A `PreviewDiagnostic` carries `recordKeys: readonly string[]`, `source: PreviewSourceRef | null`, and `relatedSources: readonly PreviewSourceRef[]` (used for `DUPLICATE_ID` and `DUPLICATE_KEY` collisions).
   - When the user clicks a diagnostic or one of its `relatedSources` chips, the UI should emit `onSelect` with `documentId: targetSource.documentId`, `diagnosticId: diag.id`, `recordKey: diag.recordKeys[0] ?? null` (or the matching occurrence key when clicking a specific duplicate location), and `source: targetSource`.
   - Each entry in `relatedSources` must be rendered as an individually keyboard-focusable `<button type="button">` naming its document, line, and column so keyboard users can jump between every colliding location.

5. **UX-05 — Focus Preservation Across `loading`, `stale`, `error`, `expired`, and `cancelling` (`docs/agent-handoffs/contracts/v2-preview.ts#L140-L147`, `docs/design/connected-workspace-design.md#L50`):**
   - When `state.phase === 'loading'` (`operation: 'choose' | 'refresh'`), conflicting Choose/Refresh buttons are disabled while `Cancel preview` remains enabled. Because disabling a focused button in Chromium drops focus to `document.body`, the preview header/status region should remain focusable (`tabIndex={-1}`) and preserve keyboard reachability to `Cancel preview`.
   - In `phase: 'error'` and `phase: 'expired'`, no active snapshot or session grant exists to refresh; the primary recovery actions are `Select blueprint` (`onChoose`) and `Cancel preview` (`onCancel`), with `onRefresh` either omitted or disabled and the message announced via `role="alert"`.
   - In `phase: 'stale'`, `state.snapshot` is rendered with an explicit retired/stale warning banner (`role="status"`), keeping `Refresh preview` (`onRefresh`), `Select another blueprint` (`onChoose`), and `Cancel preview` (`onCancel`) available.
   - Pressing `Escape` inside the transient inspector / source anchor view should clear the active record/diagnostic selection and restore focus to the originating outline or diagnostic button via a stored DOM `ref`.

## 3. Verification Limits

- Read-only static inspection of candidate TypeScript DTOs, Markdown contracts, and existing renderer CSS/components in `.agent-worktrees/antigravity-v2-preview-ui`.
- No UI component was rendered and no Electron/Playwright viewport or keyboard checks were executed in Phase A.


---

## 4. Phase B Implementation Follow-Up Review (2026-11-06)

- **Reviewed UI commit:** `0018f48cf87941a45b1c9975397dec9fa5ad9d66` on `antigravity/v2-preview-ui` (incorporating Codex shared-type commits `601a350bc44356a7886d650867b5ec7dcfe772a7` -> `a37ba50` and `838a8eb0223b94c6fca265efdfe57c7b48a164d5` -> `cb78d11`)
- **Files inspected (read-only):** `BlueprintPreview.tsx`, `BlueprintRecordList.tsx`, `BlueprintRecordInspector.tsx`, `BlueprintSourceView.tsx`, `BlueprintDiagnostics.tsx`, `blueprint-preview.css`
- **Disposition of UX-01..UX-05:**
  - **UX-01 (Verified):** `.bp-workspace` uses a 2-column grid (`minmax(0, 1.05fr) minmax(0, 0.95fr)`) above `1060px` (covering 1160px and 1440px outer window widths) and collapses to a single stacked column (`minmax(0, 1fr)`) via `@media (max-width: 1060px)` for 800px outer window widths. No 3rd or 4th column exists, and `min-width: 0` is applied across all grid/flex containers.
  - **UX-02 (Verified):** `--preview-font-mono` is scoped to `.blueprint-preview` in `blueprint-preview.css`, and both `.bp-narrative-box` and `.bp-source-box` enforce `white-space: pre-wrap`, `overflow-wrap: anywhere`, `word-break: break-word`, `overflow-x: hidden`, and `tabIndex={0}`.
  - **UX-03 (Verified):** `clearDetailSelection()` in `BlueprintPreview.tsx` emits `{ snapshotId: snapshot.snapshotId, documentId: preserveDocId, recordKey: null, diagnosticId: null, source: null }`, matching Codex's `AG-Q-01` resolution.
  - **UX-04 (Verified):** `BlueprintDiagnostics.tsx` renders each entry in `relatedSources` as an individually keyboard-focusable `<button type="button">`, and package-level diagnostics (`diag.source === null`) emit `documentId: null, recordKey: null, diagnosticId: diag.id, source: null` per `AG-Q-02`.
  - **UX-05 (Verified):** Pressing `Escape` when a record, diagnostic, or source range is selected clears the detail selection and restores focus to `lastTriggerRef.current`. Async phase banners use appropriate `role="status"` (`idle`, `loading`, `stale`, `cancelling`) and `role="alert"` (`error`, `expired`).
- **Verification limits:** Static inspection of the implemented Phase B TSX/CSS files plus `npm run typecheck` (`EXIT=0`) and `node --test tests/e2e/blueprint-preview-ui.test.mjs` (`1 pass, 2 skipped AWAITING INTEGRATION`). Live Electron window rendering and 800/1160/1440px screenshots await Codex's Phase C integration ref.
