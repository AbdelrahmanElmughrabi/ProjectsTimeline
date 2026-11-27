import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject } from '../electron-flow.mjs';

// The wrapped operation performs the real SQLite write, then loses its response.
async function loseAcknowledgement(application, method) {
  await application.evaluate(({ app }, name) => {
    const require = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json');
    const { WorkspaceStore } = require('./dist/main/data/database.js');
    const original = WorkspaceStore.prototype[name];
    WorkspaceStore.prototype[name] = function (...args) {
      WorkspaceStore.prototype[name] = original;
      original.apply(this, args);
      throw new Error('controlled acknowledgement loss after ' + name);
    };
  }, method);
}

async function persisted(page, kind, projectId, label) {
  return page.evaluate(async ({ kind, projectId, label }) => {
    const unwrap = result => {
      if (!result.ok) throw new Error(result.error.message);
      return result.value;
    };
    if (kind === 'create') return unwrap(await window.workspace.listProjects()).filter(p => p.name === label).length;
    const detail = unwrap(await window.workspace.openProject({ projectId }));
    return kind === 'action'
      ? detail.actions.filter(a => a.title === label).length
      : detail.checkpoints.filter(c => c.accomplished === label).length;
  }, { kind, projectId, label });
}

const scenarios = [
  { kind: 'create', method: 'createProject', label: 'Lost acknowledgement project' },
  { kind: 'action', method: 'addAction', label: 'Lost acknowledgement action' },
  { kind: 'checkpoint', method: 'saveCheckpoint', label: 'Lost acknowledgement checkpoint' },
];

for (const { kind, method, label } of scenarios) {
  test('WRITE-01 ' + kind + ': real commit, lost acknowledgement, manual review and restart', { timeout: 120000 }, async t => {
    let application;
    const root = temporaryDirectory(t, () => application?.close());
    const profile = join(root, 'profile');
    application = await launchWorkspace(profile);
    let page = await application.firstWindow();
    await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
    let projectId = null;
    if (kind !== 'create') {
      await createProject(page, 'WRITE-01 existing project');
      await openProject(page, 'WRITE-01 existing project');
      projectId = (await page.evaluate(async () => (await window.workspace.listProjects()).value[0])).id;
    }
    if (kind === 'create') await page.getByLabel('Project name', { exact: true }).fill(label);
    if (kind === 'action') await page.getByLabel('Action title', { exact: true }).fill(label);
    if (kind === 'checkpoint') {
      await page.getByLabel('What I accomplished', { exact: true }).fill(label);
      await page.getByLabel('What to do next', { exact: true }).fill('Check recovered records');
    }
    await loseAcknowledgement(application, method);
    const saveName = kind === 'create' ? 'Create project' : kind === 'action' ? 'Add action' : 'Save checkpoint';
    await page.getByRole('button', { name: saveName, exact: true }).click();
    await page.getByRole('alert').first().waitFor();
    assert.equal(await persisted(page, kind, projectId, label), 1, 'real SQLite insert committed before error');
    await page.getByRole('alert').filter({ hasText: 'Save outcome is uncertain' }).waitFor();
    assert.equal(await page.getByRole('button', { name: saveName, exact: true }).isDisabled(), true, 'blind resubmit blocked');
    const field = kind === 'create' ? 'Project name' : kind === 'action' ? 'Action title' : 'What I accomplished';
    assert.equal(await page.getByLabel(field, { exact: true }).inputValue(), label, 'retain draft');
    if (kind === 'create') {
      assert.equal(await page.getByRole('button', { name: 'Retry loading projects' }).count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Open ' + label, exact: true }).count(), 0);
    }
    await page.getByRole('button', { name: 'Reload saved records', exact: true }).click();
    await page.getByRole('button', { name: 'Allow another save after review', exact: true }).waitFor();
    if (kind === 'create') await page.getByRole('button', { name: 'Open ' + label, exact: true }).waitFor();
    assert.equal(await persisted(page, kind, projectId, label), 1, 'read-only reconciliation');
    await page.getByRole('button', { name: 'Keep saved records; discard draft', exact: true }).click();
    assert.equal(await page.getByLabel(field, { exact: true }).inputValue(), '', 'manual discard of draft');
    await application.close(); application = undefined;
    application = await launchWorkspace(profile);
    page = await application.firstWindow();
    await page.getByRole('button', { name: 'Home', exact: true }).waitFor();
    assert.equal(await persisted(page, kind, projectId, label), 1, 'one persisted row after restart');
  });
}

test('WRITE-01: pre-commit storage rejection cannot be mistaken for a safe blind retry', { timeout: 90000 }, async t => {
  let application;
  const root = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(join(root, 'profile'));
  const page = await application.firstWindow();
  await page.getByRole('heading', { name: 'Start with a project' }).waitFor();
  await createProject(page, 'Rejected save'); await openProject(page, 'Rejected save');
  const projectId = (await page.evaluate(async () => (await window.workspace.listProjects()).value[0])).id;
  await application.evaluate(({ app }) => {
    const require = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json');
    const { WorkspaceStore } = require('./dist/main/data/database.js');
    const original = WorkspaceStore.prototype.saveCheckpoint;
    WorkspaceStore.prototype.saveCheckpoint = function (...args) {
      WorkspaceStore.prototype.saveCheckpoint = original;
      throw new Error('controlled failure before write');
    };
  });
  await page.getByLabel('What I accomplished', { exact: true }).fill('Did not commit');
  await page.getByLabel('What to do next', { exact: true }).fill('Review stored history');
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Save outcome is uncertain' }).waitFor();
  assert.equal(await persisted(page, 'checkpoint', projectId, 'Did not commit'), 0);
  await page.getByRole('button', { name: 'Reload saved records', exact: true }).click();
  await page.getByRole('button', { name: 'Allow another save after review', exact: true }).click();
  assert.equal(await page.getByLabel('What I accomplished', { exact: true }).inputValue(), 'Did not commit');
  await page.getByRole('button', { name: 'Save checkpoint', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Checkpoint saved.' }).waitFor();
  assert.equal(await persisted(page, 'checkpoint', projectId, 'Did not commit'), 1);
});
