import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject } from '../electron-flow.mjs';

async function choose(application, file) {
  await application.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, file);
}

test('Home preview connects actual records/source, preserves project drafts and supports compact keyboard navigation', { timeout: 120000 }, async t => {
  let application;
  const dir = temporaryDirectory(t, () => application?.close());
  const sourceFile = join(dir, 'project.md');
  const source = '\uFEFF' + readFileSync('docs/design/examples/ptb-v0.2/small/project.md', 'utf8').replaceAll('\n', '\r\n');
  writeFileSync(sourceFile, source);
  application = await launchWorkspace(join(dir, 'profile'));
  const page = await application.firstWindow();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
  await createProject(page, 'Continuity'); await openProject(page, 'Continuity');
  await page.getByLabel('Action title', { exact: true }).fill('Retain unsaved project draft');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await choose(application, sourceFile);
  const open = page.getByRole('button', { name: 'Preview blueprint', exact: true });
  await open.focus(); await page.keyboard.press('Enter');
  const preview = page.getByRole('region', { name: 'Blueprint Preview', exact: true });
  await preview.getByRole('heading', { name: 'Desk Notes', exact: true }).waitFor();
  await preview.getByText('15 total · 0 unparsed / invalid', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Create project', exact: true }).isDisabled(), true);
  const record = preview.locator('.bp-record-button').filter({ hasText: '(act.check-note-restart)' });
  await record.focus(); await page.keyboard.press('Enter');
  const inspector = preview.getByRole('region', { name: 'Verify saved Unicode text after a complete restart', exact: true });
  await inspector.getByText('Verify saved Unicode text after a complete restart', { exact: true }).waitFor();
  const exactSource = preview.getByLabel('Exact captured Markdown text for project.md', { exact: true });
  assert.equal(await exactSource.textContent(), source);
  const highlight = await exactSource.locator('mark').textContent();
  assert.ok(highlight.includes('act.check-note-restart'));
  await page.keyboard.press('Escape');
  assert.equal(await record.evaluate(el => el === document.activeElement), true);
  mkdirSync(resolve('artifacts'), { recursive: true });
  for (const width of [800, 1160, 1440]) {
    await application.evaluate(({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0].setSize(width, 900), width);
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Preview overflow at ${width}`);
    await preview.locator('.bp-header').scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(`artifacts/blueprint-preview-${width}.png`), animations: 'disabled' });
  }
  await preview.getByRole('button', { name: 'Cancel preview', exact: true }).click();
  await page.getByRole('region', { name: 'Home', exact: true }).waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'blueprint-select');
  assert.equal(await page.getByRole('button', { name: 'Preview blueprint', exact: true }).evaluate(el => el === document.activeElement), true);
  await page.getByRole('button', { name: 'Open project Continuity', exact: true }).click();
  assert.equal(await page.getByLabel('Action title', { exact: true }).inputValue(), 'Retain unsaved project draft');
  assert.deepEqual(errors, []);
});

test('preview package diagnostics, refresh failures/retry, native chooser cancellation and navigation remain non-mutating', { timeout: 90000 }, async t => {
  let application;
  const dir = temporaryDirectory(t, () => application?.close()); const entry = join(dir, 'project.md');
  writeFileSync(entry, '# Narrative only\nNo project is inferred.');
  application = await launchWorkspace(join(dir, 'profile'));
  const page = await application.firstWindow(); await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
  await choose(application, entry); await page.getByRole('button', { name: 'Preview blueprint', exact: true }).click();
  const preview = page.locator('.blueprint-preview');
  const diagnostic = preview.locator('.bp-diag-card').filter({ hasText: 'PROJECT_MISSING' });
  await diagnostic.getByRole('button', { name: 'Select package diagnostic (PROJECT_MISSING)', exact: true }).click();
  await preview.getByText('Package-level diagnostic selected. Choose a document or a diagnostic with a captured document span to inspect source text.', { exact: true }).waitFor();
  assert.equal(await preview.locator('pre').count(), 0, 'No guessed document for a package diagnostic');
  await application.evaluate(({ ipcMain }) => {
    ipcMain.removeHandler('workspace:refreshBlueprintPreview');
    ipcMain.handle('workspace:refreshBlueprintPreview', () => ({ ok: false, error: { code: 'STORAGE', message: 'Controlled read failure' } }));
  });
  await preview.getByRole('button', { name: 'Refresh preview', exact: true }).click();
  await preview.getByText('Controlled read failure', { exact: true }).waitFor();
  await preview.getByText('Retired / Stale', { exact: true }).waitFor();
  await preview.locator('.bp-header').getByRole('button', { name: 'Select another blueprint', exact: true }).click();
  await preview.getByRole('button', { name: 'Refresh preview', exact: true }).waitFor();
  assert.equal(await preview.getByText('Controlled read failure', { exact: true }).count(), 0);
  await preview.locator('.bp-header').getByRole('button', { name: 'Cancel preview', exact: true }).click();
  await page.getByRole('region', { name: 'Home', exact: true }).waitFor();
  await application.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
  await page.getByRole('button', { name: 'Preview blueprint', exact: true }).click();
  await page.getByRole('region', { name: 'Home', exact: true }).waitFor();
  assert.equal((await page.evaluate(() => window.workspace.listProjects())).value.length, 0);
});
