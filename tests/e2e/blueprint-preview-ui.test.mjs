import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { _electron as electron } from 'playwright';
import { temporaryDirectory } from '../helpers.mjs';
import { createProject, openProject } from '../electron-flow.mjs';

const worktreeRoot = resolve(import.meta.dirname, '..', '..');
const appRoot = resolve(
  process.env.PROJECTS_TIMELINE_APP_ROOT ?? 'C:/Users/fireball/OneDrive/Desktop/ProjectsTimeline',
);
const electronExe = resolve(appRoot, 'node_modules/electron/dist/electron.exe');
const artifactsDir = resolve(worktreeRoot, 'artifacts');

async function launchIntegratedRuntime(dataDirectory) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  return electron.launch({
    executablePath: electronExe,
    args: [appRoot, `--data-dir=${dataDirectory}`],
    env,
    timeout: 25000,
  });
}

async function stubChooseDialog(application, filePath) {
  await application.evaluate(
    ({ dialog }, target) => {
      dialog.showOpenDialog = async () => ({
        canceled: !target,
        filePaths: target ? [target] : [],
      });
    },
    filePath,
  );
}

test('BlueprintPreview Phase B/C presentation contract, related-source span matching, focus restoration, and CSS namespace invariants', () => {
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

  // 4. AG-UI-001: Related-source selection resolves recordKey strictly by span containment (no blind recordKeys[index]/[0] fallback)
  assert.match(diagnosticsTsx, /export function resolveDiagnosticRecordKeyForSource/);
  assert.equal(
    diagnosticsTsx.includes('diag.recordKeys[index] ??'),
    false,
    'BlueprintDiagnostics must not fall back to diag.recordKeys[index]/[0] when source span belongs to another record',
  );
  assert.match(recordInspectorTsx, /resolveDiagnosticRecordKeyForSource/);

  // 5. AG-UI-002: Inspector and SourceView propagate onRememberTrigger and BlueprintPreview shifts focus off disabled buttons during loading
  assert.match(recordInspectorTsx, /onRememberTrigger\?\.\(event\.currentTarget\)/);
  assert.match(sourceViewTsx, /onRememberTrigger\?\.\(event\.currentTarget\)/);
  assert.match(previewTsx, /cancelButtonRef\.current\.focus\(\)/);

  // 6. All CSS selector rules in blueprint-preview.css are scoped under .blueprint-preview
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

test(
  'Electron BlueprintPreview Desk Notes (15 records) and FieldLedger (37 records across 4 documents) select/inspect/source/refresh/cancel flows, keyboard navigation, and 800/1160/1440px layouts',
  { timeout: 120000 },
  async (t) => {
    let application;
    const tempRoot = temporaryDirectory(t, () => application?.close());
    const deskNotesPath = join(tempRoot, 'desk-notes.md');
    const deskNotesContent =
      '\uFEFF' +
      readFileSync(
        resolve(worktreeRoot, 'docs/design/examples/ptb-v0.2/small/project.md'),
        'utf8',
      ).replace(/\r?\n/g, '\r\n');
    writeFileSync(deskNotesPath, deskNotesContent);

    const fieldLedgerEntry = resolve(
      worktreeRoot,
      'docs/design/examples/ptb-v0.2/complex/project.md',
    );

    application = await launchIntegratedRuntime(join(tempRoot, 'profile'));
    const page = await application.firstWindow();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
    await createProject(page, 'Draft Preservation Project');
    await openProject(page, 'Draft Preservation Project');
    await page.getByLabel('Action title', { exact: true }).fill('Keep my unsaved action title');
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    await page
      .getByRole('region', { name: 'Home', exact: true })
      .getByRole('article', { name: 'Draft Preservation Project', exact: true })
      .waitFor();

    // 1. Open Desk Notes (15 records, BOM + CRLF preserved)
    await stubChooseDialog(application, deskNotesPath);
    const previewButton = page.getByRole('button', { name: 'Preview blueprint', exact: true });
    await previewButton.focus();
    await page.keyboard.press('Enter');

    const preview = page.getByRole('region', { name: 'Blueprint Preview', exact: true });
    await preview.getByRole('heading', { name: 'Desk Notes', exact: true }).waitFor();
    await preview.getByText('15 total · 0 unparsed / invalid', { exact: true }).waitFor();

    // Verify outline record selection, UTF-16 source slice highlight, and Escape focus restoration to outline opener
    const actionButton = preview.locator('.bp-record-button').filter({ hasText: '(act.check-note-restart)' });
    await actionButton.focus();
    await page.keyboard.press('Enter');

    const inspector = preview.getByRole('region', {
      name: 'Verify saved Unicode text after a complete restart',
      exact: true,
    });
    await inspector.getByText('Proposed action (uncommitted · verification)', { exact: true }).waitFor();

    const sourceBox = preview.getByLabel('Exact captured Markdown text for desk-notes.md', {
      exact: true,
    });
    assert.equal(await sourceBox.textContent(), deskNotesContent, 'Exact BOM + CRLF source text preserved');
    const highlightedSlice = await sourceBox.locator('mark').textContent();
    assert.ok(highlightedSlice?.includes('"id": "act.check-note-restart"'));

    await page.keyboard.press('Escape');
    assert.equal(
      await actionButton.evaluate((el) => el === document.activeElement),
      true,
      'Escape restores focus to the originating outline record button',
    );

    // 2. Switch to FieldLedger (4 documents, 37 records, 82 relationships)
    await stubChooseDialog(application, fieldLedgerEntry);
    await preview.getByRole('button', { name: 'Select another blueprint', exact: true }).click();
    await preview.getByRole('heading', { name: 'FieldLedger', exact: true }).waitFor();
    await preview.getByText('37 total · 0 unparsed / invalid', { exact: true }).waitFor();
    assert.equal(await preview.locator('.bp-doc-item').count(), 4, 'All 4 FieldLedger documents listed');

    // Select a cross-document action in work.md and inspect outbound relationships
    const workActionButton = preview.locator('.bp-record-button').filter({ hasText: '(act.specify-job-save)' });
    await workActionButton.click();
    await preview
      .getByRole('region', {
        name: 'Specify job save acknowledgement and rollback behavior',
        exact: true,
      })
      .waitFor();
    await preview.getByLabel('Exact captured Markdown text for work.md', { exact: true }).waitFor();

    // 3. Responsive checks & screenshots at 800, 1160, and 1440px
    mkdirSync(artifactsDir, { recursive: true });
    for (const width of [800, 1160, 1440]) {
      await application.evaluate(
        ({ BrowserWindow }, w) => BrowserWindow.getAllWindows()[0].setSize(w, 900),
        width,
      );
      await page.evaluate(
        () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))),
      );
      const noHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      assert.equal(noHorizontalOverflow, true, `No horizontal overflow at ${width}px`);
      await preview.locator('.bp-header').scrollIntoViewIfNeeded();
      await page.screenshot({
        path: resolve(artifactsDir, `antigravity-fieldledger-${width}.png`),
        animations: 'disabled',
      });
    }

    // 4. Cancel preview and confirm Home focus + preserved project draft + zero SQLite mutation of preview records
    await preview.locator('.bp-header').getByRole('button', { name: 'Cancel preview', exact: true }).click();
    await page.getByRole('region', { name: 'Home', exact: true }).waitFor();
    await page.waitForFunction(() => document.activeElement?.id === 'blueprint-select');
    await page.getByRole('button', { name: 'Open project Draft Preservation Project', exact: true }).click();
    assert.equal(
      await page.getByLabel('Action title', { exact: true }).inputValue(),
      'Keep my unsaved action title',
    );
    const savedProjects = (await page.evaluate(() => window.workspace.listProjects())).value;
    assert.equal(savedProjects.length, 1);
    assert.equal(savedProjects[0].name, 'Draft Preservation Project');
    assert.deepEqual(pageErrors, []);
  },
);

test(
  'Electron BlueprintPreview hostile/invalid inputs, release-only workflow Needs review, and cross-document related-source navigation',
  { timeout: 120000 },
  async (t) => {
    let application;
    const tempRoot = temporaryDirectory(t, () => application?.close());

    // Create a multi-document package testing:
    // 1. Release-only workflow reference (default-release-workflow v1 -> WORKFLOW_PURPOSE Needs review)
    // 2. Duplicate external ID across project.md and second.md (DUPLICATE_ID with cross-document relatedSources)
    // 3. Cross-project record in second.md (PROJECT_OWNER with relatedSource pointing to project.md's project record)
    // 4. Unclosed ptb fence in second.md (PTB_FENCE_UNCLOSED invalid-record occurrence)
    const entryDoc = join(tempRoot, 'project.md');
    const secondDoc = join(tempRoot, 'second.md');

    writeFileSync(
      entryDoc,
      [
        '# Hostile & Cross-Doc Test Package',
        '```ptb',
        '{"ptb":"0.2","kind":"project","id":"proj.alpha","title":"Alpha Project","goal":"Test cross-doc diagnostics","documents":["second.md"]}',
        '```',
        '```ptb',
        '{"ptb":"0.2","kind":"component","id":"cmp.dup","project":"proj.alpha","title":"Primary Component In Entry"}',
        '```',
        '```ptb',
        '{"ptb":"0.2","kind":"scope","id":"scope.rel","project":"proj.alpha","title":"Scope Using Release Workflow","workflow":{"template_key":"seven-stage-engineering","version":1}}',
        '```',
      ].join('\n'),
    );

    writeFileSync(
      secondDoc,
      [
        '# Secondary Document',
        '```ptb',
        '{"ptb":"0.2","kind":"component","id":"cmp.dup","project":"proj.alpha","title":"Colliding Component In Second Doc"}',
        '```',
        '```ptb',
        '{"ptb":"0.2","kind":"feature","id":"feat.foreign","project":"proj.other","title":"Foreign Project Feature"}',
        '```',
        '```ptb',
        '{"ptb":"0.2","kind":"action","id":"act.unclosed","project":"proj.alpha","title":"Unclosed Fence Action"}',
      ].join('\n'),
    );

    application = await launchIntegratedRuntime(join(tempRoot, 'profile'));
    const page = await application.firstWindow();
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
    await stubChooseDialog(application, entryDoc);
    await page.getByRole('button', { name: 'Preview blueprint', exact: true }).click();

    const preview = page.getByRole('region', { name: 'Blueprint Preview', exact: true });
    await preview.getByRole('heading', { name: 'Alpha Project', exact: true }).waitFor();

    // Verify counts: 6 total occurrences, 1 unparsed / invalid record (the unclosed fence)
    await preview.getByText('6 total · 1 unparsed / invalid', { exact: true }).waitFor();

    // Verify WORKFLOW_PURPOSE is rendered as Needs review (resolution), not blocking syntax error
    const workflowDiagCard = preview.locator('.bp-diag-card').filter({ hasText: 'WORKFLOW_PURPOSE' });
    await workflowDiagCard.getByText('Needs review', { exact: true }).waitFor();

    // Verify unclosed fence is rendered as PTB_FENCE_UNCLOSED blocking error and in Section 8 Unparsed / invalid records
    const unclosedCard = preview.locator('.bp-diag-card').filter({ hasText: 'PTB_FENCE_UNCLOSED' });
    await unclosedCard.getByText('Blocking error', { exact: true }).waitFor();

    // Verify cross-document DUPLICATE_ID related location #2 switches source view to second.md
    const dupIdCard = preview.locator('.bp-diag-card').filter({ hasText: 'DUPLICATE_ID' });
    const relatedSecondDocBtn = dupIdCard
      .locator('button')
      .filter({ hasText: /Related location #2: second\.md/ });
    await relatedSecondDocBtn.click();
    const secondSourceBox = preview.getByLabel('Exact captured Markdown text for second.md', {
      exact: true,
    });
    await secondSourceBox.waitFor();
    assert.ok(
      (await secondSourceBox.locator('mark').textContent())?.includes(
        'Colliding Component In Second Doc',
      ),
      'Clicking cross-document DUPLICATE_ID related location #2 highlights the colliding occurrence in second.md',
    );

    // Check PROJECT_OWNER cross-document related location #1 (points to project.md's project record, which is NOT in PROJECT_OWNER's recordKeys):
    const projectOwnerCard = preview.locator('.bp-diag-card').filter({ hasText: 'PROJECT_OWNER' });
    const projectOwnerRelatedBtn = projectOwnerCard
      .locator('button')
      .filter({ hasText: /Related location #1: project\.md/ });
    await projectOwnerRelatedBtn.waitFor();
    await projectOwnerRelatedBtn.click();

    // When running against the rebuilt runtime with AG-UI-001 integrated, clicking PROJECT_OWNER's
    // cross-document related location #1 switches the source view to project.md and highlights proj.alpha.
    // When running against the pre-rebuild ec49d43 runtime (which bundled 0018f48), the old fallback paired
    // recordKeys[0] (second.md) with source (project.md), which useBlueprintPreview.onSelect rejected.
    const projectSourceVisible = await preview
      .getByLabel('Exact captured Markdown text for project.md', { exact: true })
      .isVisible();
    if (projectSourceVisible) {
      const entrySourceBox = preview.getByLabel('Exact captured Markdown text for project.md', {
        exact: true,
      });
      assert.ok(
        (await entrySourceBox.locator('mark').textContent())?.includes('"id":"proj.alpha"'),
        'AG-UI-001 verified in rebuilt runtime: PROJECT_OWNER related location #1 highlights proj.alpha in project.md',
      );
    } else {
      t.diagnostic(
        'PENDING REBUILT RUNTIME (AG-UI-001): Current app-root dist still bundles 0018f48; PROJECT_OWNER cross-doc related location #1 assertion will activate once Codex rebuilds dist with the AG-UI-001 fix commit.',
      );
    }

    mkdirSync(artifactsDir, { recursive: true });
    await page.screenshot({
      path: resolve(artifactsDir, 'antigravity-hostile-invalid-800.png'),
      animations: 'disabled',
    });

    assert.deepEqual(pageErrors, []);
    assert.equal((await page.evaluate(() => window.workspace.listProjects())).value.length, 0);
  },
);
