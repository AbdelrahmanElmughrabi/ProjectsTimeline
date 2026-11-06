import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace, openProject } from '../electron-flow.mjs';

test('packaged app upgrades populated v1 and recovers confirmed release provenance across restart', { timeout: 90000 }, async t => {
  let application;
  const directory = temporaryDirectory(t, () => application?.close());
  mkdirSync(join(directory, 'data'));
  const filename = join(directory, 'data', 'workspace.sqlite');
  const legacy = new DatabaseSync(filename);
  legacy.exec(readFileSync(resolve('src/main/data/migrations/001_initial.sql'), 'utf8'));
  legacy.exec("INSERT INTO projects VALUES (1, 'Legacy packaged project', '2026-01-01T00:00:00.000Z'); INSERT INTO actions VALUES (1, 1, 'Preserved backlog', '2026-01-02T00:00:00.000Z', '2026-01-03T00:00:00.000Z'); INSERT INTO checkpoints VALUES (1, 1, 'Existing memory', 'Continue from this checkpoint', '2026-01-04T00:00:00.000Z'); PRAGMA user_version = 1");
  legacy.close();
  const executable = resolve(process.env.PROJECTS_TIMELINE_EXECUTABLE ?? 'out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe');
  application = await launchWorkspace(directory, executable);
  let page = await application.firstWindow();
  await openProject(page, 'Legacy packaged project');
  const before = await page.evaluate(async () => (await window.workspace.openProject({ projectId: 1 })).value);
  assert.equal(before.actions[0].completedAt, '2026-01-03T00:00:00.000Z');
  assert.equal(before.actions[0].releaseId, null);
  assert.deepEqual(before.releases, []);
  assert.deepEqual(before.actionEvents, []);
  assert.equal(readdirSync(join(directory, 'data')).filter(file => file.includes('.before-v3.') && file.endsWith('.bak')).length, 1);
  const confirmed = await page.evaluate(async () => {
    const api = window.workspace;
    const unwrap = result => { if (!result.ok) throw new Error(result.error.message); return result.value; };
    const release = unwrap(await api.createRelease({ projectId: 1, name: 'Packaged A' }));
    const stages = unwrap(await api.openProject({ projectId: 1 })).releases[0].stages;
    for (const stage of stages.slice(0, 6)) {
      const action = unwrap(await api.addAction({ projectId: 1, title: `Packaged stage ${stage.position + 1}` }));
      unwrap(await api.assignAction({ projectId: 1, actionId: action.id, releaseId: release.id, stageId: stage.id }));
      unwrap(await api.completeAction({ projectId: 1, actionId: action.id }));
    }
    const verification = unwrap(await api.recordReleaseVerification({ projectId: 1, releaseId: release.id,
      artifactIdentity: 'packaged integration fixture A', evidenceReference: 'isolated packaged recovery fixture',
      summary: 'Explicit verification record used to exercise provenance persistence.', outcome: 'passed' }));
    unwrap(await api.confirmRelease({ projectId: 1, releaseId: release.id, verificationId: verification.id }));
    return unwrap(await api.openProject({ projectId: 1 }));
  });
  assert.equal(confirmed.releases[0].progress.percent, 100);
  assert.ok(confirmed.releases[0].release.confirmedVerificationId);
  await application.close();
  application = await launchWorkspace(directory, executable);
  page = await application.firstWindow();
  await openProject(page, 'Legacy packaged project');
  const recovered = await page.evaluate(async () => (await window.workspace.openProject({ projectId: 1 })).value);
  assert.deepEqual(recovered, confirmed);
  assert.equal(recovered.resume.nextSteps, 'Continue from this checkpoint');
  const raw = new DatabaseSync(filename);
  try {
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 3);
    assert.deepEqual(raw.prepare('PRAGMA foreign_key_check').all(), []);
  } finally { raw.close(); }
});
