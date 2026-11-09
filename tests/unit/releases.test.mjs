import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openStore } from '../../dist/main/data/database.js';
import { temporaryDirectory } from '../helpers.mjs';

async function makeRelease(t, name = 'Release A') {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const project = store.createProject({ name: 'Releases' });
  const release = store.createRelease({ projectId: project.id, name });
  return { store, filename, project, release };
}

function closeToReleaseReady(store, project, release) {
  const detail = store.openProject({ projectId: project.id });
  const workspace = detail.releases.find((item) => item.release.id === release.id);
  const gate = detail.actions.find((action) => action.releaseId === release.id && action.kind === 'release-confirmation');
  assert.ok(workspace);
  assert.ok(gate);
  const workActions = [];
  for (const stage of workspace.stages.slice(0, 6)) {
    const action = store.addAction({ projectId: project.id, title: `Finish ${stage.name}` });
    workActions.push(store.assignAction({ projectId: project.id, actionId: action.id, releaseId: release.id, stageId: stage.id }));
    store.completeAction({ projectId: project.id, actionId: action.id });
  }
  return { workspace, gate, workActions };
}

function passedVerification(store, project, release) {
  return store.recordReleaseVerification({
    projectId: project.id, releaseId: release.id,
    artifactIdentity: 'build-42', evidenceReference: 'CI run 42',
    summary: 'Reviewed the release candidate', outcome: 'passed',
  });
}

test('v1 migration preserves legacy identities and rows, backs up before v4, and restarts cleanly', async (t) => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  const rawV1 = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  rawV1.exec(readFileSync(resolve('src/main/data/migrations/001_initial.sql'), 'utf8'));
  rawV1.prepare('INSERT INTO projects(id, name, created_at) VALUES (?, ?, ?)').run(41, 'Existing', '2026-01-02T03:04:05.000Z');
  rawV1.prepare('INSERT INTO actions(id, project_id, title, created_at, completed_at) VALUES (?, ?, ?, ?, ?)')
    .run(73, 41, 'Legacy completed action', '2026-02-03T04:05:06.000Z', '2026-02-04T05:06:07.000Z');
  rawV1.prepare('INSERT INTO checkpoints(id, project_id, accomplished, next_steps, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(89, 41, 'Persisted', 'Continue', '2026-02-05T06:07:08.000Z');
  rawV1.exec('PRAGMA user_version = 1');
  rawV1.close();

  store = await openStore(filename);
  const migrated = store.openProject({ projectId: 41 });
  assert.deepEqual({ ...migrated.project }, { id: 41, name: 'Existing', createdAt: '2026-01-02T03:04:05.000Z' });
  assert.deepEqual(migrated.actions.map(({ id, projectId, title, createdAt, completedAt, releaseId, stageId, exclusionReason, kind }) =>
    ({ id, projectId, title, createdAt, completedAt, releaseId, stageId, exclusionReason, kind })),
  [{ id: 73, projectId: 41, title: 'Legacy completed action', createdAt: '2026-02-03T04:05:06.000Z', completedAt: '2026-02-04T05:06:07.000Z', releaseId: null, stageId: null, exclusionReason: null, kind: 'work' }]);
  assert.deepEqual(migrated.checkpoints.map(row => ({ ...row })), [{ id: 89, projectId: 41, accomplished: 'Persisted', nextSteps: 'Continue', createdAt: '2026-02-05T06:07:08.000Z' }]);
  assert.deepEqual(migrated.releases, []);
  assert.deepEqual(migrated.actionEvents, []);
  const raw = new DatabaseSync(filename);
  try {
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 4);
    assert.equal(raw.prepare('PRAGMA foreign_key_check').all().length, 0);
    assert.deepEqual({ ...raw.prepare('SELECT id, project_id, title, created_at, completed_at FROM actions').get() }, {
      id: 73, project_id: 41, title: 'Legacy completed action', created_at: '2026-02-03T04:05:06.000Z', completed_at: '2026-02-04T05:06:07.000Z',
    });
  } finally { raw.close(); }
  const backups = readdirSync(directory).filter((file) => file.includes('.before-v4.') && file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  const backup = new DatabaseSync(join(directory, backups[0]));
  try {
    assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 1);
    assert.equal(backup.prepare('SELECT id FROM actions').get().id, 73);
    assert.equal(backup.prepare('SELECT id FROM checkpoints').get().id, 89);
  } finally { backup.close(); }
  store.close();
  store = await openStore(filename);
  assert.deepEqual(store.openProject({ projectId: 41 }).checkpoints, migrated.checkpoints);
});

test('release creation protects its gate; legacy work stays backlog until assigned', async (t) => {
  const { store, project, release } = await makeRelease(t);
  const legacyComplete = store.addAction({ projectId: project.id, title: 'Old done work' });
  store.completeAction({ projectId: project.id, actionId: legacyComplete.id });
  const legacyOpen = store.addAction({ projectId: project.id, title: 'Old open work' });
  const detail = store.openProject({ projectId: project.id });
  const workspace = detail.releases[0];
  assert.equal(workspace.stages.length, 7);
  assert.equal(workspace.release.scopeRevision, 1);
  assert.equal(workspace.progress.state, 'needs-scope-review');
  assert.equal(workspace.progress.percent, null);
  assert.equal(workspace.progress.emptyStageIds.length, 6);
  assert.equal(detail.actions.filter((action) => action.kind === 'release-confirmation').length, 1);
  assert.equal(detail.actions.filter((action) => action.releaseId === release.id && action.kind === 'work').length, 0);
  assert.equal(detail.actions.find((action) => action.id === legacyComplete.id).releaseId, null);
  assert.equal(detail.actions.find((action) => action.id === legacyOpen.id).stageId, null);
  assert.throws(() => store.completeAction({ projectId: project.id, actionId: detail.actions.find((action) => action.kind === 'release-confirmation').id }), { code: 'FORBIDDEN' });
  assert.throws(() => store.setStageExclusion({ projectId: project.id, releaseId: release.id, stageId: workspace.stages[6].id, reason: 'skip gate' }), { code: 'FORBIDDEN' });

  const second = store.createRelease({ projectId: project.id, name: 'Release B' });
  const stage = workspace.stages[0];
  store.assignAction({ projectId: project.id, actionId: legacyComplete.id, releaseId: release.id, stageId: stage.id });
  assert.throws(() => store.assignAction({ projectId: project.id, actionId: legacyComplete.id, releaseId: second.id, stageId: null }), { code: 'VALIDATION' });
  assert.throws(() => store.setStageExclusion({ projectId: project.id, releaseId: release.id, stageId: stage.id, reason: 'not needed' }), { code: 'VALIDATION' });
  store.setActionExclusion({ projectId: project.id, actionId: legacyComplete.id, reason: 'out of scope' });
  store.setStageExclusion({ projectId: project.id, releaseId: release.id, stageId: stage.id, reason: 'not needed' });
  assert.equal(store.openProject({ projectId: project.id }).actions.find((action) => action.id === legacyOpen.id).releaseId, null);
});

test('schema constraints bind actions to same-project releases and stages, with one protected gate', async (t) => {
  const { store, filename, project, release } = await makeRelease(t);
  const otherProject = store.createProject({ name: 'Other project' });
  const otherRelease = store.createRelease({ projectId: otherProject.id, name: 'Other release' });
  const ownAction = store.addAction({ projectId: project.id, title: 'Owned here' });
  const ownStages = store.openProject({ projectId: project.id }).releases[0].stages;
  const otherStage = store.openProject({ projectId: otherProject.id }).releases[0].stages[0];
  const gate = store.openProject({ projectId: project.id }).actions.find((action) => action.kind === 'release-confirmation');
  const raw = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  try {
    assert.throws(() => raw.prepare('INSERT INTO release_actions(action_id, release_id, stage_id) VALUES (?, ?, ?)')
      .run(ownAction.id, otherRelease.id, otherStage.id), /same project/);
    assert.throws(() => raw.prepare('INSERT INTO release_actions(action_id, release_id, stage_id) VALUES (?, ?, ?)')
      .run(ownAction.id, release.id, otherStage.id), /FOREIGN KEY/);
    raw.prepare('INSERT INTO actions(project_id, title, created_at) VALUES (?, ?, ?)').run(project.id, 'Duplicate gate attempt', '2026-01-01T00:00:00.000Z');
    const duplicateActionId = raw.prepare('SELECT last_insert_rowid() AS id').get().id;
    assert.throws(() => raw.prepare("INSERT INTO release_actions(action_id, release_id, stage_id, kind) VALUES (?, ?, ?, 'release-confirmation')")
      .run(duplicateActionId, release.id, ownStages[6].id), /UNIQUE constraint/);
    assert.throws(() => raw.prepare('UPDATE actions SET completed_at = ? WHERE id = ?').run('2026-01-01T00:00:00.000Z', gate.id), /Protected release action/);
  } finally { raw.close(); }
});

test('failed, stale, and other-release evidence cannot confirm a release', async (t) => {
  const { store, project, release } = await makeRelease(t);
  const { gate, workActions } = closeToReleaseReady(store, project, release);
  const failed = store.recordReleaseVerification({
    projectId: project.id, releaseId: release.id, artifactIdentity: 'build-bad',
    evidenceReference: 'manual check', summary: 'Found a release issue', outcome: 'failed',
  });
  assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: failed.id }), { code: 'VALIDATION' });

  const olderPass = passedVerification(store, project, release);
  store.recordReleaseVerification({ projectId: project.id, releaseId: release.id, artifactIdentity: 'build-bad', evidenceReference: 'later failure report', summary: 'A later check failed at the same revision', outcome: 'failed' });
  assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: olderPass.id }), { code: 'VALIDATION' });

  const stale = passedVerification(store, project, release);
  store.reopenAction({ projectId: project.id, actionId: workActions[0].id });
  assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: stale.id }), { code: 'VALIDATION' });
  store.completeAction({ projectId: project.id, actionId: workActions[0].id });

  const other = store.createRelease({ projectId: project.id, name: 'Release B' });
  const wrongRelease = passedVerification(store, project, other);
  assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: wrongRelease.id }), { code: 'VALIDATION' });
  assert.equal(store.openProject({ projectId: project.id }).actions.find((action) => action.id === gate.id).completedAt, null);
});

test('current verification confirms and freezes A while B and backlog remain editable', async (t) => {
  const { store, project, release } = await makeRelease(t);
  closeToReleaseReady(store, project, release);
  const verification = passedVerification(store, project, release);
  const confirmed = store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: verification.id });
  assert.equal(confirmed.confirmedVerificationId, verification.id);
  assert.ok(confirmed.confirmedAt);
  const beforeA = store.openProject({ projectId: project.id }).releases.find((item) => item.release.id === release.id);
  assert.equal(beforeA.progress.state, 'confirmed');
  assert.equal(beforeA.progress.percent, 100);
  const frozenWork = store.openProject({ projectId: project.id }).actions.find((action) => action.releaseId === release.id && action.kind === 'work');
  assert.throws(() => store.reopenAction({ projectId: project.id, actionId: frozenWork.id }), { code: 'FORBIDDEN' });

  const second = store.createRelease({ projectId: project.id, name: 'Release B' });
  const backlog = store.addAction({ projectId: project.id, title: 'Next release work' });
  const secondStage = store.openProject({ projectId: project.id }).releases.find((item) => item.release.id === second.id).stages[0];
  store.assignAction({ projectId: project.id, actionId: backlog.id, releaseId: second.id, stageId: secondStage.id });
  const after = store.openProject({ projectId: project.id });
  assert.deepEqual(after.releases.find((item) => item.release.id === release.id), beforeA);
  assert.equal(after.releases.find((item) => item.release.id === release.id).release.confirmedVerificationId, verification.id);
  assert.equal(after.releases.find((item) => item.release.id === second.id).progress.state, 'needs-scope-review');
  assert.equal(after.actions.find((action) => action.id === backlog.id).releaseId, second.id);
});

test('committed unassigned work blocks confirmation and invalid scope commands make no changes', async t => {
  const { store, project, release } = await makeRelease(t);
  closeToReleaseReady(store, project, release);
  const action = store.addAction({ projectId: project.id, title: 'Committed but not assigned' });
  store.assignAction({ projectId: project.id, actionId: action.id, releaseId: release.id, stageId: null });
  store.completeAction({ projectId: project.id, actionId: action.id });
  const detail = store.openProject({ projectId: project.id });
  assert.equal(detail.releases[0].progress.percent, null);
  assert.deepEqual(detail.releases[0].progress.unassignedActionIds, [action.id]);
  const proof = passedVerification(store, project, release);
  assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: proof.id }), { code: 'VALIDATION' });
  const before = store.openProject({ projectId: project.id });
  assert.throws(() => store.setActionExclusion({ projectId: project.id, actionId: action.id, reason: '   ' }), { code: 'VALIDATION' });
  assert.throws(() => store.assignAction({ projectId: project.id, actionId: action.id, releaseId: release.id, stageId: '1' }), { code: 'VALIDATION' });
  assert.throws(() => store.recordReleaseVerification({ projectId: project.id, releaseId: release.id, artifactIdentity: 'artifact', evidenceReference: '', summary: 'No reference', outcome: 'passed' }), { code: 'VALIDATION' });
  assert.deepEqual(store.openProject({ projectId: project.id }), before);
});

test('audit-trigger failure rolls back action state and revision; repeating completion adds no event', async (t) => {
  const { store, filename, project, release } = await makeRelease(t);
  const stage = store.openProject({ projectId: project.id }).releases[0].stages[0];
  const action = store.addAction({ projectId: project.id, title: 'Transactional work' });
  store.assignAction({ projectId: project.id, actionId: action.id, releaseId: release.id, stageId: stage.id });
  const initial = store.openProject({ projectId: project.id });
  const revision = initial.releases[0].release.scopeRevision;
  const eventCount = initial.actionEvents.length;
  const raw = new DatabaseSync(filename);
  try {
    raw.exec("CREATE TRIGGER reject_action_event BEFORE INSERT ON action_events BEGIN SELECT RAISE(ABORT, 'controlled audit failure'); END");
    assert.throws(() => store.setActionExclusion({ projectId: project.id, actionId: action.id, reason: 'skip' }), /controlled audit failure/);
  } finally { raw.close(); }
  const unchanged = store.openProject({ projectId: project.id });
  assert.equal(unchanged.actions.find((item) => item.id === action.id).exclusionReason, null);
  assert.equal(unchanged.releases[0].release.scopeRevision, revision);
  assert.equal(unchanged.actionEvents.length, eventCount);

  // Remove the trigger and verify completion's idempotent retry behavior.
  const raw2 = new DatabaseSync(filename);
  raw2.exec('DROP TRIGGER reject_action_event');
  raw2.close();
  const first = store.completeAction({ projectId: project.id, actionId: action.id });
  const afterFirst = store.openProject({ projectId: project.id });
  const repeated = store.completeAction({ projectId: project.id, actionId: action.id });
  const afterRepeat = store.openProject({ projectId: project.id });
  assert.equal(repeated.completedAt, first.completedAt);
  assert.equal(afterRepeat.releases[0].release.scopeRevision, afterFirst.releases[0].release.scopeRevision);
  assert.equal(afterRepeat.actionEvents.length, afterFirst.actionEvents.length);
});

test('confirmation event failure leaves release and protected action unconfirmed', async (t) => {
  const { store, filename, project, release } = await makeRelease(t);
  const { gate } = closeToReleaseReady(store, project, release);
  const verification = passedVerification(store, project, release);
  const raw = new DatabaseSync(filename);
  try {
    raw.exec("CREATE TRIGGER reject_confirmation_event BEFORE INSERT ON action_events BEGIN SELECT RAISE(ABORT, 'controlled confirmation failure'); END");
    assert.throws(() => store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: verification.id }), /controlled confirmation failure/);
  } finally { raw.close(); }
  const detail = store.openProject({ projectId: project.id });
  const current = detail.releases.find((item) => item.release.id === release.id);
  assert.equal(current.release.confirmedAt, null);
  assert.equal(current.release.confirmedVerificationId, null);
  assert.equal(current.progress.state, 'in-progress');
  assert.equal(detail.actions.find((action) => action.id === gate.id).completedAt, null);
  assert.ok(detail.releases[0].verifications.some((item) => item.id === verification.id));
});
