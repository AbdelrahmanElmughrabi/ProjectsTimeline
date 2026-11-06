import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, createProject, openProject, saveCheckpoint } from '../electron-flow.mjs';

async function snapshot(page) {
  return page.evaluate(async () => {
    const project = (await window.workspace.listProjects()).value[0];
    return (await window.workspace.openProject({ projectId: project.id })).value;
  });
}

test('real release UI commits scope, preserves failed verification drafts, confirms and recovers', { timeout: 120000 }, async t => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  let page = await application.firstWindow();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await createProject(page, 'Stage workspace');
  await openProject(page, 'Stage workspace');
  await saveCheckpoint(page, 'Resume remains project-owned', 'Review the actual release');
  await page.getByLabel('Action title', { exact: true }).fill('Existing backlog');
  await page.getByRole('button', { name: 'Add action', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Action added.' }).waitFor();
  await page.getByLabel('New release name').fill('Release A');
  await page.getByRole('button', { name: 'Create release', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('status').filter({ hasText: 'Release created.' }).waitFor();
  let detail = await snapshot(page);
  const { release, stages } = detail.releases[0];
  await page.getByLabel('Selected release', { exact: true }).selectOption(String(release.id));
  await page.locator('.scope-review').filter({ hasText: 'Needs scope review:' }).waitFor();
  assert.equal(await page.locator('.stage-card').count(), 7);
  assert.equal(await page.locator('.release-summary').getByText('—', { exact: true }).count(), 1);
  const gateRow = page.locator('.stage-actions .action-row').filter({ hasText: 'Confirm the released version works' });
  assert.equal(await gateRow.count(), 1, 'The counted confirmation obligation must be visible');
  assert.equal(await gateRow.getByRole('button').count(), 0, 'The protected gate must not expose ordinary action commands');

  await page.getByLabel('Stage for Existing backlog', { exact: true }).selectOption(String(stages[0].id));
  await page.locator('.backlog-row').filter({ hasText: 'Existing backlog' }).getByRole('button', { name: 'Commit', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Action scope saved.' }).waitFor();
  await page.locator('.stage-card').filter({ has: page.getByRole('heading', { name: stages[0].name, exact: true }) }).getByRole('button', { name: 'Mark complete', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Action completed.' }).waitFor();
  // Populate the remaining stage fixtures through real validated IPC, then load their saved snapshot.
  await page.evaluate(async ({ projectId, releaseId, stageIds }) => {
    for (const stageId of stageIds) {
      const action = (await window.workspace.addAction({ projectId, title: `Verified work for stage ${stageId}` })).value;
      const assigned = await window.workspace.assignAction({ projectId, actionId: action.id, releaseId, stageId });
      if (!assigned.ok) throw new Error(assigned.error.message);
      const done = await window.workspace.completeAction({ projectId, actionId: action.id });
      if (!done.ok) throw new Error(done.error.message);
    }
  }, { projectId: detail.project.id, releaseId: release.id, stageIds: stages.slice(1, 6).map(stage => stage.id) });
  await openProject(page, 'Stage workspace');
  await page.getByLabel('Selected release', { exact: true }).selectOption(String(release.id));
  await page.locator('.release-summary').getByText('85.71%', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Confirm using selected passed verification', exact: true }).isDisabled(), true);

  const raw = new DatabaseSync(join(directory, 'data', 'workspace.sqlite'));
  try {
    raw.exec("CREATE TRIGGER fail_manual_verification BEFORE INSERT ON release_verifications BEGIN SELECT RAISE(ABORT, 'controlled verification failure'); END");
    await page.getByLabel('Artifact/version identity', { exact: true }).fill('release-A/artifact-sha256:actual-test-fixture');
    await page.getByLabel('Evidence reference', { exact: true }).fill('Manual run fixture / report-42');
    await page.getByLabel('Verification summary', { exact: true }).fill('Installed this isolated test artifact and verified the expected flow.');
    await page.getByRole('button', { name: 'Record verification', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.getByLabel('Artifact/version identity').inputValue(), 'release-A/artifact-sha256:actual-test-fixture');
    assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM release_verifications').get().n, 0);
    raw.exec('DROP TRIGGER fail_manual_verification');
    await page.getByRole('button', { name: 'Record verification', exact: true }).click();
    await page.getByRole('status').filter({ hasText: 'Manual verification recorded.' }).waitFor();
    assert.equal(await page.getByLabel('Artifact/version identity').inputValue(), '');
  } finally { raw.close(); }
  detail = await snapshot(page);
  const verification = detail.releases[0].verifications[0];
  await page.getByLabel('Passed verification for this scope revision', { exact: true }).selectOption(String(verification.id));
  const confirm = page.getByRole('button', { name: 'Confirm using selected passed verification', exact: true });
  assert.equal(await confirm.isEnabled(), true);
  await confirm.click();
  await page.getByRole('status').filter({ hasText: 'Release confirmed.' }).waitFor();
  await page.locator('.release-summary').getByText('100.00%', { exact: true }).waitFor();
  const before = await snapshot(page);
  assert.equal(before.releases[0].release.confirmedVerificationId, verification.id);
  assert.equal(before.releases[0].progress.state, 'confirmed');
  mkdirSync(resolve('artifacts'), { recursive: true });
  for (const width of [800, 1160, 1440]) {
    await application.evaluate(({ BrowserWindow }, value) => BrowserWindow.getAllWindows()[0].setSize(value, 900), width);
    await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow at ${width}`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(`artifacts/progress-${width}.png`), fullPage: false });
  }
  await page.locator('.release-panel').screenshot({ path: resolve('artifacts/progress-confirmed.png') });
  await application.close();
  application = await launchWorkspace(directory);
  page = await application.firstWindow();
  await openProject(page, 'Stage workspace');
  assert.deepEqual((await snapshot(page)).releases, before.releases);
  await page.getByRole('region', { name: 'Resume Development', exact: true }).getByText('Review the actual release', { exact: true }).waitFor();
  assert.deepEqual(errors, []);
});

test('committed release write followed by failed read hides progress and retries without another save', { timeout: 60000 }, async t => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  application = await launchWorkspace(directory);
  const page = await application.firstWindow();
  await createProject(page, 'Release refresh');
  await openProject(page, 'Release refresh');
  await page.getByLabel('New release name').fill('Existing release');
  await page.getByRole('button', { name: 'Create release', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Release created.' }).waitFor();
  const releaseId = (await snapshot(page)).releases[0].release.id;
  await page.getByLabel('Selected release', { exact: true }).selectOption(String(releaseId));
  await application.evaluate(({ app }) => {
    const load = process.getBuiltinModule('module').createRequire(app.getAppPath() + '/package.json');
    const { WorkspaceStore } = load('./dist/main/data/database.js');
    const original = WorkspaceStore.prototype.openProject;
    let failures = 1;
    WorkspaceStore.prototype.openProject = function(input) {
      if (failures-- > 0) throw new Error('controlled release refresh failure');
      WorkspaceStore.prototype.openProject = original;
      return original.call(this, input);
    };
  });
  await page.getByLabel('New release name').fill('Committed once');
  await page.getByRole('button', { name: 'Create release', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Saved, but could not refresh.' }).waitFor();
  assert.equal(await page.getByLabel('New release name').inputValue(), '');
  assert.equal(await page.locator('.release-summary').count(), 0);
  await page.getByRole('button', { name: 'Retry loading', exact: true }).click();
  await page.getByRole('status').filter({ hasText: 'Workspace refreshed.' }).waitFor();
  const recovered = await snapshot(page);
  assert.equal(recovered.releases.filter(item => item.release.name === 'Committed once').length, 1);
  assert.equal(recovered.actionEvents.filter(event => event.description.includes('Created release “Committed once”')).length, 1);
});
