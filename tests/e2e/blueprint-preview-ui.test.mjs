import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const worktreeRoot = resolve(import.meta.dirname, '..', '..');

test('BlueprintPreview Phase B presentation contract, inert source slicing, and CSS namespace invariants', () => {
  const previewTsx = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/BlueprintPreview.tsx'),
    'utf8',
  );
  const recordListTsx = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/BlueprintRecordList.tsx'),
    'utf8',
  );
  const recordInspectorTsx = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/BlueprintRecordInspector.tsx'),
    'utf8',
  );
  const sourceViewTsx = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/BlueprintSourceView.tsx'),
    'utf8',
  );
  const diagnosticsTsx = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/BlueprintDiagnostics.tsx'),
    'utf8',
  );
  const previewCss = readFileSync(
    resolve(worktreeRoot, 'src/renderer/blueprint-preview/blueprint-preview.css'),
    'utf8',
  );

  const allSource = [
    previewTsx,
    recordListTsx,
    recordInspectorTsx,
    sourceViewTsx,
    diagnosticsTsx,
  ].join('\n');

  // 1. Named export BlueprintPreview accepting BlueprintPreviewProps from canonical shared module
  assert.match(previewTsx, /export function BlueprintPreview\(\s*\{[\s\S]*\}:\s*BlueprintPreviewProps\)/);
  assert.match(previewTsx, /from '\.\.\/\.\.\/shared\/blueprint-preview'/);
  assert.match(previewTsx, /import '\.\/blueprint-preview\.css'/);

  // 2. Pure controlled props: no direct window.workspace calls, no HTML injection, no external URL opening
  assert.equal(allSource.includes('window.workspace'), false, 'BlueprintPreview must not call window.workspace directly');
  assert.equal(allSource.includes('dangerouslySetInnerHTML'), false, 'BlueprintPreview must never use dangerouslySetInnerHTML');
  assert.equal(allSource.includes('window.open'), false, 'BlueprintPreview must never automatically open URLs');

  // 3. Exact UTF-16 offset slicing on captured document.text
  assert.match(sourceViewTsx, /activeSource\.span\.start\.utf16Offset/);
  assert.match(sourceViewTsx, /activeSource\.span\.end\.utf16Offset/);
  assert.match(sourceViewTsx, /text\.slice\(startOffset,\s*endOffset\)/);

  // 4. AG-Q-01..03 compliance: package-level diagnostic selection uses documentId: null, source: null, recordKey: null
  assert.match(
    diagnosticsTsx,
    /documentId:\s*null,\s*recordKey:\s*null,\s*diagnosticId:\s*diag\.id,\s*source:\s*null/,
  );

  // 5. All CSS selector rules in blueprint-preview.css are scoped under .blueprint-preview
  const strippedCss = previewCss.replace(/\/\*[\s\S]*?\*\//g, '');
  const ruleHeaders = [...strippedCss.matchAll(/([^{}]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((header) => header.length > 0 && !header.startsWith('@'));

  assert.ok(ruleHeaders.length > 0, 'blueprint-preview.css must contain style rules');
  for (const header of ruleHeaders) {
    const selectors = header.split(',').map((s) => s.trim()).filter(Boolean);
    for (const sel of selectors) {
      assert.equal(
        sel.startsWith('.blueprint-preview'),
        true,
        `Selector "${sel}" must be namespaced under .blueprint-preview`,
      );
    }
  }
});

// Phase C integration-dependent Electron E2E and screenshot cases:
// Marked as AWAITING INTEGRATION per the V2 Phase B contract until Codex supplies the integrated runtime ref.
test(
  'AWAITING INTEGRATION: Electron BlueprintPreview Desk Notes (15 records) and FieldLedger (37 records) select/inspect/diagnostic/refresh/cancel flows at 800/1160/1440px',
  {
    skip: 'AWAITING INTEGRATION: Requires Codex Phase C integration branch wiring useBlueprintPreview, main-process PTB parser/session commands, and App/Home navigation.',
  },
  async () => {
    // Will execute real chooseBlueprintPreview, refreshBlueprintPreview, cancelBlueprintPreview,
    // record/source/diagnostic selection, keyboard Escape focus restoration, and 800/1160/1440px
    // screenshot capture once Codex supplies the Phase C integration ref.
  },
);

test(
  'AWAITING INTEGRATION: Electron BlueprintPreview hostile/invalid inputs (unclosed ptb fence, duplicate decoded JSON keys, duplicate external IDs, cyclic components, unavailable manifest docs, release-only workflow Needs review)',
  {
    skip: 'AWAITING INTEGRATION: Requires Codex Phase C integration branch with real main-process parser and IPC handlers.',
  },
  async () => {
    // Will verify partial invalid snapshots, relatedSources duplicate location jumps,
    // WORKFLOW_PURPOSE / WORKFLOW_UNRESOLVED Needs review badges, and zero durable SQLite writes.
  },
);
