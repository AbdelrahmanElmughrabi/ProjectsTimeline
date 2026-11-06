import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openStore } from '../../dist/main/data/database.js';
import { temporaryDirectory } from '../helpers.mjs';

async function fixture(t, seed = true) {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  store = await openStore(filename);
  const project = seed ? store.createProject({ name: 'Workflow tests' }) : null;
  return { store, filename, directory, project, reopen: async () => {
    store.close();
    store = await openStore(filename);
    return store;
  } };
}

function rawCounts(filename, projectId) {
  const db = new DatabaseSync(filename);
  try {
    const count = (table) => db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count;
    return {
      releases: count('releases'), stages: count('release_stages'), actions: count('actions'),
      details: count('action_details'), memberships: count('release_actions'), events: count('action_events'),
      projectEvents: db.prepare('SELECT COUNT(*) AS count FROM action_events WHERE project_id = ?').get(projectId).count,
    };
  } finally { db.close(); }
}

test('migration seeds the built-in once; restart preserves it and duplicate gets fresh independent identities', async (t) => {
  const { store, filename, reopen } = await fixture(t, false);
  const original = store.getWorkflowLibrary();
  assert.equal(original.length, 1);
  const builtin = original[0];
  assert.equal(typeof builtin.template.builtInKey, 'string');
  assert.ok(builtin.template.builtInKey.length > 0);
  assert.equal(builtin.template.version, 1);
  assert.equal(builtin.stages.length, 7);
  assert.equal(builtin.actions.length, 8);
  assert.deepEqual(builtin.stages.map(({ position }) => position), [0, 1, 2, 3, 4, 5, 6]);
  for (const stage of builtin.stages) {
    const positions = builtin.actions.filter((action) => action.stageId === stage.id).map(({ position }) => position);
    assert.deepEqual(positions, positions.map((_, index) => index));
  }
  assert.equal(builtin.stages.filter((stage) => stage.protectedClosing).length, 1);
  assert.equal(builtin.actions.some((action) => action.actionType === 'verification'), true);
  const committed = store.duplicateWorkflowTemplate({ templateId: builtin.template.id, expectedVersion: 1, name: 'My workflow' });
  const copy = store.getWorkflowLibrary().find((item) => item.template.id === committed.id);
  assert.equal(committed.version, 1);
  assert.equal(committed.builtInKey, null);
  assert.equal(copy.actions.length, 8);
  assert.equal(new Set(copy.stages.map(({ id }) => id)).size, 7);
  assert.equal(copy.stages.some((stage) => builtin.stages.some((source) => source.id === stage.id)), false);
  assert.equal(copy.actions.some((action) => builtin.actions.some((source) => source.id === action.id)), false);
  assert.deepEqual(copy.actions.map(({ title, position, actionType, instructions, applicability, definitionOfDone, evidenceGuidance }) =>
    ({ title, position, actionType, instructions, applicability, definitionOfDone, evidenceGuidance })),
  builtin.actions.map(({ title, position, actionType, instructions, applicability, definitionOfDone, evidenceGuidance }) =>
    ({ title, position, actionType, instructions, applicability, definitionOfDone, evidenceGuidance })));
  const reopenedStore = await reopen();
  const afterRestart = reopenedStore.getWorkflowLibrary();
  assert.equal(afterRestart.length, 2);
  assert.deepEqual(afterRestart.find((item) => item.template.id === builtin.template.id), builtin);
  assert.deepEqual(afterRestart.find((item) => item.template.id === committed.id), copy);
  const db = new DatabaseSync(filename);
  try { assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3); }
  finally { db.close(); }
});

test('same template creates independent release snapshots; completion and reopening stay local', async (t) => {
  const { store, project } = await fixture(t);
  const source = store.getWorkflowLibrary()[0];
  const a = store.createRelease({ projectId: project.id, name: 'Release A', templateId: source.template.id, templateVersion: source.template.version });
  const b = store.createRelease({ projectId: project.id, name: 'Release B', templateId: source.template.id, templateVersion: source.template.version });
  assert.deepEqual([a.sourceTemplateId, a.sourceTemplateVersion, a.sourceTemplateName], [source.template.id, 1, source.template.name]);
  const detailA = store.openProject({ projectId: project.id });
  const detailB = detailA.releases.find((item) => item.release.id === b.id);
  const workspaceA = detailA.releases.find((item) => item.release.id === a.id);
  assert.equal(workspaceA.stages.length, 7);
  assert.deepEqual(workspaceA.stages.map(({ name, position }) => ({ name, position })), source.stages.map(({ name, position }) => ({ name, position })));
  const actionsA = detailA.actions.filter((item) => item.releaseId === a.id && item.kind === 'work');
  const actionsB = detailA.actions.filter((item) => item.releaseId === b.id && item.kind === 'work');
  assert.equal(actionsA.length, 8);
  assert.equal(actionsB.length, 8);
  assert.notDeepEqual(actionsA.map(({ id }) => id), actionsB.map(({ id }) => id));
  const expected = source.actions.map(({ title, position, instructions, applicability, definitionOfDone, evidenceGuidance, actionType }) =>
    ({ title, position, instructions, applicability, definitionOfDone, evidenceGuidance, actionType }));
  const snapshot = (rows) => rows.map(({ title, details }) => ({ title, ...details }));
  assert.deepEqual(snapshot(actionsA), expected);
  assert.deepEqual(snapshot(actionsB), expected);
  assert.equal(actionsA.every(({ completedAt, exclusionReason }) => completedAt === null && exclusionReason === null), true);
  assert.equal(detailA.actions.filter((item) => item.releaseId === a.id && item.kind === 'release-confirmation').length, 1);
  assert.equal(detailA.actions.filter((item) => item.releaseId === b.id && item.kind === 'release-confirmation').length, 1);
  const chosen = actionsA[0];
  store.completeAction({ projectId: project.id, actionId: chosen.id });
  store.reopenAction({ projectId: project.id, actionId: chosen.id });
  const after = store.openProject({ projectId: project.id });
  assert.equal(after.actions.find((item) => item.id === chosen.id).completedAt, null);
  assert.equal(after.actions.filter((item) => item.releaseId === b.id && item.kind === 'work').every(({ completedAt }) => completedAt === null), true);
  assert.deepEqual(store.getWorkflowLibrary()[0], source);
  assert.equal(detailB.release.sourceTemplateName, source.template.name);
});

test('stages-only release keeps seven defaults, null origin, and six initially empty stages', async (t) => {
  const { store, project } = await fixture(t);
  const release = store.createRelease({ projectId: project.id, name: 'Stages only' });
  assert.deepEqual([release.sourceTemplateId, release.sourceTemplateVersion, release.sourceTemplateName], [null, null, null]);
  const detail = store.openProject({ projectId: project.id });
  const workspace = detail.releases.find((item) => item.release.id === release.id);
  assert.equal(workspace.stages.length, 7);
  assert.equal(workspace.progress.percent, null);
  assert.equal(workspace.progress.emptyStageIds.length, 6);
  const actions = detail.actions.filter((item) => item.releaseId === release.id);
  assert.equal(actions.length, 1);
  assert.equal(actions[0].kind, 'release-confirmation');
  assert.equal(actions[0].details, null);
});

test('stale versions and invalid template relationships fail without creating any rows', async (t) => {
  const { store, filename, project } = await fixture(t);
  const template = store.getWorkflowLibrary()[0];
  const before = rawCounts(filename, project.id);
  assert.throws(() => store.duplicateWorkflowTemplate({ templateId: template.template.id, expectedVersion: 99, name: 'Stale copy' }), { code: 'VALIDATION' });
  assert.throws(() => store.duplicateWorkflowTemplate({ templateId: 99999, expectedVersion: 1, name: 'Missing source' }));
  assert.throws(() => store.duplicateWorkflowTemplate({ templateId: template.template.id, expectedVersion: 1, name: '   ' }), { code: 'VALIDATION' });
  assert.throws(() => store.createRelease({ projectId: project.id, name: 'Stale release', templateId: template.template.id, templateVersion: 2 }), { code: 'VALIDATION' });
  assert.throws(() => store.createRelease({ projectId: project.id, name: 'Incomplete origin', templateId: template.template.id }), { code: 'VALIDATION' });
  assert.deepEqual(rawCounts(filename, project.id), before);
});

for (const failedTable of ['action_details', 'action_events']) {
  test(`template-copy failure at ${failedTable} rolls back the complete release`, async (t) => {
    const { store, filename, project } = await fixture(t);
    const template = store.getWorkflowLibrary()[0];
    const before = rawCounts(filename, project.id);
    const raw = new DatabaseSync(filename);
    try {
      raw.exec(`CREATE TRIGGER fail_workflow_copy BEFORE INSERT ON ${failedTable} BEGIN SELECT RAISE(ABORT, 'controlled ${failedTable} failure'); END`);
    } finally { raw.close(); }
    assert.throws(() => store.createRelease({ projectId: project.id, name: 'Must roll back', templateId: template.template.id, templateVersion: template.template.version }), new RegExp(`controlled ${failedTable} failure`));
    assert.deepEqual(rawCounts(filename, project.id), before);
    const view = store.openProject({ projectId: project.id });
    assert.equal(view.releases.length, 0);
    assert.equal(view.actions.length, 0);
    const removeTrigger = new DatabaseSync(filename);
    try { removeTrigger.exec(`DROP TRIGGER fail_workflow_copy`); }
    finally { removeTrigger.close(); }
    const recovered = store.createRelease({ projectId: project.id, name: 'Retry once', templateId: template.template.id, templateVersion: template.template.version });
    assert.equal(store.openProject({ projectId: project.id }).releases.filter((item) => item.release.id === recovered.id).length, 1);
  });
}

test('v2 confirmed release migrates with history intact, nullable legacy details and a consistent v3 backup', async (t) => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'populated-v2.sqlite');
  const db = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  const time = '2026-02-03T04:05:06.000Z';
  try {
    db.exec(readFileSync(resolve('src/main/data/migrations/001_initial.sql'), 'utf8'));
    db.exec(readFileSync(resolve('src/main/data/migrations/002_release_progress.sql'), 'utf8'));
    db.prepare('INSERT INTO projects(id, name, created_at) VALUES (41, ?, ?)').run('Existing v2', time);
    db.prepare('INSERT INTO releases(id, project_id, name, created_at, scope_revision, policy_version) VALUES (51, 41, ?, ?, 1, 1)')
      .run('Confirmed legacy release', time);
    const stageInsert = db.prepare('INSERT INTO release_stages(id, release_id, stage_key, name, position) VALUES (?, 51, ?, ?, ?)');
    const stageNames = ['Requirements and Planning', 'UX, Architecture, and Technical Design', 'Development Environment and Project Setup', 'Implementation', 'Integrated Release Verification', 'Release Preparation', 'Deployment/Distribution and Release Confirmation'];
    stageNames.forEach((name, position) => stageInsert.run(70 + position, ['requirements', 'design', 'setup', 'implementation', 'verification', 'preparation', 'release_confirmation'][position], name, position));
    const actionInsert = db.prepare('INSERT INTO actions(id, project_id, title, created_at, completed_at) VALUES (?, 41, ?, ?, ?)');
    const membershipInsert = db.prepare('INSERT INTO release_actions(action_id, release_id, stage_id, kind) VALUES (?, 51, ?, ?)');
    for (let i = 0; i < 6; i++) {
      actionInsert.run(80 + i, `Legacy finished ${i}`, time, '2026-02-04T05:06:07.000Z');
      membershipInsert.run(80 + i, 70 + i, 'work');
    }
    actionInsert.run(90, 'Confirm the released version works', time, null);
    membershipInsert.run(90, 76, 'release-confirmation');
    db.prepare(`INSERT INTO release_verifications(id, release_id, scope_revision, artifact_identity, evidence_reference, summary, outcome, created_at)
      VALUES (61, 51, 1, 'legacy-build', 'CI run 41', 'Legacy confirmation evidence', 'passed', ?)`)
      .run('2026-02-04T05:00:00.000Z');
    db.prepare('UPDATE releases SET confirmed_at = ?, confirmed_verification_id = 61 WHERE id = 51')
      .run('2026-02-04T05:06:07.000Z');
    db.prepare(`INSERT INTO action_events(id, project_id, release_id, action_id, description, before_value, after_value, created_at)
      VALUES (101, 41, 51, 80, 'Legacy historical event', NULL, '{"completedAt":"2026-02-04T05:06:07.000Z"}', ?)`)
      .run('2026-02-04T05:06:08.000Z');
    db.exec('PRAGMA user_version = 2');
  } finally { db.close(); }

  const before = new DatabaseSync(filename);
  let sourceSnapshot;
  try {
    sourceSnapshot = Object.fromEntries(Object.entries({
      projects: 'id', releases: 'id', release_stages: 'id', actions: 'id',
      release_actions: 'action_id', release_verifications: 'id', action_events: 'id',
    }).map(([table, key]) => [table, { key, rows: before.prepare(`SELECT * FROM ${table} ORDER BY ${key}`).all() }]));
  } finally { before.close(); }
  store = await openStore(filename);
  const project = store.openProject({ projectId: 41 });
  const release = project.releases[0];
  assert.equal(release.progress.state, 'confirmed');
  assert.equal(release.release.scopeRevision, 1);
  assert.deepEqual([release.release.sourceTemplateId, release.release.sourceTemplateVersion, release.release.sourceTemplateName], [null, null, null]);
  assert.equal(project.actions.find((action) => action.id === 80).completedAt, '2026-02-04T05:06:07.000Z');
  assert.equal(project.actions.find((action) => action.id === 80).details, null);
  assert.deepEqual(project.actionEvents.map(({ id, description, createdAt }) => ({ id, description, createdAt })), [{ id: 101, description: 'Legacy historical event', createdAt: '2026-02-04T05:06:08.000Z' }]);
  const current = new DatabaseSync(filename);
  try {
    assert.equal(current.prepare('PRAGMA user_version').get().user_version, 3);
    assert.equal(current.prepare('PRAGMA foreign_key_check').all().length, 0);
    for (const [table, { key, rows }] of Object.entries(sourceSnapshot)) {
      const columns = Object.keys(rows[0]);
      assert.deepEqual(current.prepare(`SELECT ${columns.join(', ')} FROM ${table} ORDER BY ${key}`).all(), rows, `${table} rows changed during migration`);
    }
    assert.equal(current.prepare('SELECT source_template_id FROM releases WHERE id = 51').get().source_template_id, null);
  } finally { current.close(); }
  const backups = readdirSync(directory).filter((file) => file.includes('.before-v3.') && file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  const backup = new DatabaseSync(join(directory, backups[0]));
  try {
    assert.equal(backup.prepare('PRAGMA user_version').get().user_version, 2);
    assert.equal(backup.prepare('SELECT id FROM releases WHERE id = 51').get().id, 51);
  } finally { backup.close(); }
  store.close();
  store = await openStore(filename);
  const restarted = store.openProject({ projectId: 41 });
  assert.equal(restarted.releases[0].progress.state, 'confirmed');
  assert.equal(restarted.actions.find((action) => action.id === 80).details, null);
});
