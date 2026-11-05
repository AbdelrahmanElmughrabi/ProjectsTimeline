import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject, saveCheckpoint } from '../electron-flow.mjs';

test('Electron flow persists across full restart and enforces renderer boundaries', { timeout: 90000 }, async (t) => {
  let application;
  const directory = join(temporaryDirectory(t, () => application?.close()), 'new-profile');
  application = await launchWorkspace(directory);
  let page = await application.firstWindow();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
  const runtime = await application.evaluate(({ app, BrowserWindow }) => {
    const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { packaged: app.isPackaged, node: process.versions.node, electron: process.versions.electron,
      isolation: preferences.contextIsolation, sandbox: preferences.sandbox, nodeIntegration: preferences.nodeIntegration };
  });
  t.diagnostic(JSON.stringify(runtime));
  assert.equal(runtime.isolation, true);
  assert.equal(runtime.sandbox, true);
  assert.equal(runtime.nodeIntegration, false);
  assert.deepEqual(await page.evaluate(() => [typeof window.require, typeof window.process]), ['undefined', 'undefined']);
  assert.deepEqual(await page.evaluate(() => Object.keys(window.workspace).sort()),
    ['addAction', 'completeAction', 'createProject', 'listProjects', 'openProject', 'saveCheckpoint']);

  await createProject(page, 'Project A');
  await createProject(page, 'Project B');
  await openProject(page, 'Project A');
  for (const title of ['Implement persistence', 'Verify restart']) {
    await page.getByLabel('Action title', { exact: true }).fill(title);
    await page.getByRole('button', { name: 'Add action', exact: true }).click();
    await page.getByRole('button', { name: `Complete ${title}`, exact: true }).waitFor();
  }
  await page.getByRole('button', { name: 'Complete Implement persistence', exact: true }).click();
  await page.getByText('Completed', { exact: true }).waitFor();
  const before = await page.evaluate(async () => {
    const result = await window.workspace.listProjects();
    const project = result.value.find((item) => item.name === 'Project A');
    return (await window.workspace.openProject({ projectId: project.id })).value;
  });
  const action = before.actions[0];
  const repeated = await page.evaluate(async ({ projectId, actionId }) => window.workspace.completeAction({ projectId, actionId }),
    { projectId: before.project.id, actionId: action.id });
  assert.equal(repeated.value.completedAt, action.completedAt);
  const invalid = await page.evaluate(async () => window.workspace.createProject({ name: '  ' }));
  assert.equal(invalid.error.code, 'VALIDATION');
  const crossProject = await page.evaluate(async ({ actionId }) => {
    const result = await window.workspace.listProjects();
    const other = result.value.find((item) => item.name === 'Project B');
    return window.workspace.completeAction({ projectId: other.id, actionId });
  }, { actionId: action.id });
  assert.equal(crossProject.error.code, 'NOT_FOUND');

  const literalMarkup = '<img src=x onerror="window.injected=true">';
  await saveCheckpoint(page, 'SQLite connected', 'Verify recovery');
  await saveCheckpoint(page, literalMarkup, 'Review IPC validation');
  await saveCheckpoint(page, 'Recovery ready', 'Perform a personal review');
  assert.equal(await page.locator('.checkpoint-card').count(), 3);
  assert.equal(await page.locator('.checkpoint-card').first().locator('p').first().innerText(), 'Recovery ready');
  assert.equal(await page.evaluate(() => window.injected), undefined);
  assert.equal(await page.locator('.checkpoint-card img').count(), 0);
  await openProject(page, 'Project B');
  assert.equal(await page.locator('.action-row').count(), 0);
  assert.equal(await page.locator('.checkpoint-card').count(), 0);
  await application.close();
  application = undefined;

  application = await launchWorkspace(directory);
  page = await application.firstWindow();
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await openProject(page, 'Project A');
  assert.equal(await page.locator('.action-row').count(), 2);
  assert.equal(await page.getByText('Completed', { exact: true }).count(), 1);
  assert.equal(await page.locator('.checkpoint-card').count(), 3);
  await page.getByText('Review IPC validation', { exact: true }).waitFor();
  const recovered = await page.evaluate(async ({ projectId }) => (await window.workspace.openProject({ projectId })).value,
    { projectId: before.project.id });
  assert.deepEqual(recovered.actions, before.actions);
  assert.equal(recovered.checkpoints[0].accomplished, 'Recovery ready');
  assert.deepEqual(pageErrors, []);
  await page.evaluate(() => window.open('https://example.com', '_blank'));
  assert.equal(application.windows().length, 1);
  mkdirSync(resolve('artifacts'), { recursive: true });
  await page.screenshot({ path: resolve('artifacts/workspace.png'), fullPage: true });
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(800, 700));
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: resolve('artifacts/workspace-compact.png'), fullPage: true });
});

test('actual failed checkpoint write preserves form input and allows retry', { timeout: 60000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  await createProject(page, 'Failure case');
  await openProject(page, 'Failure case');
  const raw = new DatabaseSync(join(directory, 'data', 'workspace.sqlite'));
  try {
    raw.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT, 'controlled failure'); END");
    await page.getByLabel('What I accomplished', { exact: true }).fill('Keep this accomplishment');
    await page.getByLabel('What to do next', { exact: true }).fill('Retry this save');
    await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('What I accomplished', { exact: true }).inputValue(), 'Keep this accomplishment');
    assert.equal(await page.getByLabel('What to do next', { exact: true }).inputValue(), 'Retry this save');
    assert.equal(await page.locator('.checkpoint-card').count(), 0);
    assert.equal(raw.prepare('SELECT COUNT(*) AS count FROM checkpoints').get().count, 0);
    raw.exec('DROP TRIGGER fail_checkpoint');
    await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Checkpoint saved.' }).waitFor();
    assert.equal(await page.locator('.checkpoint-card').count(), 1);
    assert.equal(await page.getByLabel('What I accomplished', { exact: true }).inputValue(), '');
  } finally { raw.close(); }
});
