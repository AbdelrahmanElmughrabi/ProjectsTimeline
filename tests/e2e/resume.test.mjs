import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject, saveCheckpoint } from '../electron-flow.mjs';

test('Resume displays real saved context, functional empty state and project-specific restart recovery', { timeout: 90000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  let page = await application.firstWindow();
  await createProject(page, 'Resume project');
  await createProject(page, 'Empty project');
  await openProject(page, 'Resume project');
  let panel = page.getByRole('region', { name: 'Resume Development', exact: true });
  await panel.getByText(/No checkpoint yet/).waitFor();
  assert.equal(await panel.locator('time').count(), 0);
  await panel.getByRole('button', { name: 'Save your first checkpoint' }).click();
  assert.equal(await page.getByLabel('What I accomplished', { exact: true }).evaluate((element) => element === document.activeElement), true);
  await saveCheckpoint(page, 'Connected SQLite\nReviewed boundary', 'Inspect one failed write');
  await panel.getByText('Inspect one failed write', { exact: true }).waitFor();
  const savedTime = await panel.locator('time').getAttribute('dateTime');
  const stored = await page.evaluate(async () => {
    const projects = (await window.workspace.listProjects()).value;
    return (await window.workspace.openProject({ projectId: projects.find((project) => project.name === 'Resume project').id })).value.resume;
  });
  assert.equal(savedTime, stored.createdAt);
  assert.equal(await panel.locator('h3').first().locator('..').locator('p').innerText(), stored.accomplished);
  await panel.getByRole('button', { name: 'Continue with actions' }).click();
  assert.equal(await page.getByLabel('Action title', { exact: true }).evaluate((element) => element === document.activeElement), true);
  await openProject(page, 'Empty project');
  await panel.getByText(/No checkpoint yet/).waitFor();
  assert.equal(await panel.getByText('Inspect one failed write', { exact: true }).count(), 0);
  await application.close();
  application = undefined;
  application = await launchWorkspace(directory);
  page = await application.firstWindow();
  await openProject(page, 'Resume project');
  panel = page.getByRole('region', { name: 'Resume Development', exact: true });
  await panel.getByText('Inspect one failed write', { exact: true }).waitFor();
  assert.equal(await panel.locator('time').getAttribute('dateTime'), savedTime);
  mkdirSync(resolve('artifacts'), { recursive: true });
  await page.screenshot({ path: resolve('artifacts/resume-workspace.png'), fullPage: true });
  await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(800, 700));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.screenshot({ path: resolve('artifacts/resume-compact.png'), fullPage: true });
});

test('committed save with failed refresh clears only its draft; Retry loading never repeats the write', { timeout: 60000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  await createProject(page, 'Refresh failure');
  await openProject(page, 'Refresh failure');
  await saveCheckpoint(page, 'Previously saved', 'Old saved next step');
  await page.getByLabel('Action title', { exact: true }).fill('Unsubmitted action draft');

  // Fault injection stays in this isolated test process; the next retry uses the real query again.
  await application.evaluate(({ app }) => {
    const load = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json');
    const { WorkspaceStore } = load('./dist/main/data/database.js');
    const original = WorkspaceStore.prototype.openProject;
    let failures = 2;
    WorkspaceStore.prototype.openProject = function (input) {
      if (failures-- > 0) throw new Error('controlled refresh failure');
      WorkspaceStore.prototype.openProject = original;
      return original.call(this, input);
    };
  });
  await page.getByLabel('What I accomplished', { exact: true }).fill('Committed once');
  await page.getByLabel('What to do next', { exact: true }).fill('Retry the read only');
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Saved, but could not refresh.' }).waitFor();
  assert.equal(await page.getByLabel('What I accomplished', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('What to do next', { exact: true }).inputValue(), '');
  assert.equal(await page.getByLabel('Action title', { exact: true }).inputValue(), 'Unsubmitted action draft');
  const panel = page.getByRole('region', { name: 'Resume Development', exact: true });
  await panel.getByText(/needs a fresh load/).waitFor();
  assert.equal(await panel.getByText('Old saved next step', { exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Save checkpoint', exact: true }).isDisabled(), true);
  mkdirSync(resolve('artifacts'), { recursive: true });
  await page.screenshot({ path: resolve('artifacts/visual-refresh-warning.png'), fullPage: true, animations: 'disabled' });
  await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Saved data could not be reloaded. No save was repeated;' }).waitFor();
  assert.equal(await page.getByLabel('What I accomplished', { exact: true }).inputValue(), '');
  await panel.getByText(/needs a fresh load/).waitFor();
  await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Workspace refreshed.' }).waitFor();
  await panel.getByText('Retry the read only', { exact: true }).waitFor();
  assert.equal(await page.locator('.checkpoint-card').count(), 2);
  assert.equal(await page.getByLabel('Action title', { exact: true }).inputValue(), 'Unsubmitted action draft');
  const checkpoints = await page.evaluate(async () => {
    const projects = (await window.workspace.listProjects()).value;
    return (await window.workspace.openProject({ projectId: projects[0].id })).value.checkpoints;
  });
  assert.equal(checkpoints.filter((checkpoint) => checkpoint.accomplished === 'Committed once').length, 1);
});

test('late successful and failed reads cannot replace a newer selected workspace', { timeout: 60000 }, async (t) => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  await createProject(page, 'Slow project');
  await createProject(page, 'Current project');
  await openProject(page, 'Current project');
  await saveCheckpoint(page, 'Current context', 'Keep this selection');

  for (const rejectOldRead of [false, true]) {
    await application.evaluate(({ app }, reject) => {
      const load = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json');
      const { WorkspaceStore } = load('./dist/main/data/database.js');
      const original = WorkspaceStore.prototype.openProject;
      let signal;
      globalThis.resumeReadStarted = new Promise((resolveStarted) => { signal = resolveStarted; });
      WorkspaceStore.prototype.openProject = function (input) {
        WorkspaceStore.prototype.openProject = original;
        const snapshot = original.call(this, input);
        return new Promise((resolveRead, rejectRead) => {
          globalThis.releaseResumeRead = () => reject ? rejectRead(new Error('late controlled read failure')) : resolveRead(snapshot);
          signal();
        });
      };
    }, rejectOldRead);
    await page.getByRole('button', { name: 'Open Slow project', exact: true }).click();
    await application.evaluate(() => globalThis.resumeReadStarted);
    await page.getByRole('button', { name: 'Open Current project', exact: true }).click();
    await page.getByRole('heading', { name: 'Current project', exact: true }).waitFor();
    await application.evaluate(() => globalThis.releaseResumeRead());
    // Give the deliberately released IPC response a render turn; this is not a timing-based request ordering test.
    await page.waitForTimeout(100);
    assert.equal(await page.getByRole('heading', { name: 'Current project', exact: true }).count(), 1);
    assert.equal(await page.getByRole('heading', { name: 'Slow project', exact: true }).count(), 0);
    assert.equal(await page.getByRole('alert').count(), 0);
    await page.getByRole('region', { name: 'Resume Development', exact: true }).getByText('Keep this selection', { exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Add action', exact: true }).isEnabled(), true);
  }
});
