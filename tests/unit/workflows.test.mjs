import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openStore } from '../../dist/main/data/database.js';
import { temporaryDirectory } from '../helpers.mjs';

const definition = (title, overrides = {}) => ({
  title,
  instructions: `${title} instructions`,
  applicability: `${title} applicability`,
  definitionOfDone: `${title} done criteria`,
  evidenceGuidance: `${title} evidence guidance`,
  actionType: 'implementation',
  ...overrides,
});

function workflow(store, templateId) {
  return store.getWorkflowLibrary().find((item) => item.template.id === templateId);
}

function projectRelease(store, projectId, releaseId) {
  return store.openProject({ projectId }).releases.find((item) => item.release.id === releaseId);
}

function releaseActions(store, projectId, releaseId) {
  return store.openProject({ projectId }).actions.filter((item) => item.releaseId === releaseId);
}

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
  try { assert.equal(db.prepare('PRAGMA user_version').get().user_version, 4); }
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
  const completedAt = store.openProject({ projectId: project.id }).actions.find((item) => item.id === chosen.id).completedAt;
  assert.ok(completedAt);
  const projectC = store.createProject({ name: 'Independent project C' });
  const c = store.createRelease({ projectId: projectC.id, name: 'Release C', templateId: source.template.id, templateVersion: source.template.version });
  const detailC = store.openProject({ projectId: projectC.id });
  const workspaceC = detailC.releases.find((item) => item.release.id === c.id);
  const actionsC = detailC.actions.filter((item) => item.releaseId === c.id && item.kind === 'work');
  assert.equal(actionsC.length, 8);
  assert.equal(new Set([...actionsA, ...actionsB, ...actionsC].map(({ id }) => id)).size, 24);
  assert.equal(workspaceC.progress.state, 'in-progress');
  assert.equal(workspaceC.progress.percent, 0);
  assert.equal(actionsC.every(({ completedAt }) => completedAt === null), true);
  assert.equal(store.openProject({ projectId: project.id }).actions.find((item) => item.id === chosen.id).completedAt, completedAt);
  assert.equal(store.openProject({ projectId: project.id }).actions.filter((item) => item.releaseId === b.id && item.kind === 'work').every(({ completedAt }) => completedAt === null), true);
  store.reopenAction({ projectId: project.id, actionId: chosen.id });
  const after = store.openProject({ projectId: project.id });
  assert.equal(after.actions.find((item) => item.id === chosen.id).completedAt, null);
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

test('user template CRUD preserves seven stages, inserts before closing, and versions only effective changes', async (t) => {
  const { store } = await fixture(t, false);
  const created = store.createWorkflowTemplate({ name: 'My workflow', description: 'First description' });
  let detail = workflow(store, created.id);
  assert.equal(detail.template.version, 1);
  assert.equal(detail.stages.length, 7);
  assert.equal(detail.actions.length, 0);
  assert.equal(detail.stages.filter(({ protectedClosing }) => protectedClosing).length, 1);
  assert.deepEqual(detail.stages.map(({ position }) => position), [0, 1, 2, 3, 4, 5, 6]);

  const noop = store.updateWorkflowTemplate({ templateId: created.id, expectedVersion: 1, name: created.name, description: created.description });
  assert.equal(noop.version, 1);
  const renamed = store.updateWorkflowTemplate({ templateId: created.id, expectedVersion: 1, name: 'Renamed workflow', description: 'Updated description' });
  assert.equal(renamed.version, 2);
  const extra = store.addWorkflowStage({ templateId: created.id, expectedVersion: 2, name: 'Threat review' });
  detail = workflow(store, created.id);
  assert.equal(detail.template.version, 3);
  assert.equal(detail.stages.length, 8);
  assert.equal(detail.stages.at(-1).protectedClosing, true);
  assert.equal(detail.stages.find(({ id }) => id === extra.id).position, 6);
  assert.equal(extra.position, 6);

  const renamedStage = store.updateWorkflowStage({ templateId: created.id, expectedVersion: 3, stageId: extra.id, name: 'Threat analysis' });
  assert.equal(renamedStage.name, 'Threat analysis');
  const v4 = workflow(store, created.id);
  const desiredOrder = [v4.stages[6].id, ...v4.stages.slice(0, 6).map(({ id }) => id), v4.stages.at(-1).id];
  store.reorderWorkflowStages({ templateId: created.id, expectedVersion: 4, stageIds: desiredOrder });
  detail = workflow(store, created.id);
  assert.deepEqual(detail.stages.map(({ id }) => id), desiredOrder);
  assert.equal(detail.stages.at(-1).protectedClosing, true);
  assert.deepEqual(detail.stages.map(({ position }) => position), detail.stages.map((_, index) => index));

  const beforeStale = detail;
  assert.throws(() => store.updateWorkflowTemplate({ templateId: created.id, expectedVersion: 4, name: 'Stale write', description: 'stale' }), { code: 'VALIDATION' });
  assert.deepEqual(workflow(store, created.id), beforeStale);
  const removed = store.removeWorkflowStage({ templateId: created.id, expectedVersion: 5, stageId: extra.id });
  assert.equal(removed.version, 6);
  assert.equal(workflow(store, created.id).stages.length, 7);
});

test('quick-added template actions accept full definitions, movement, within-stage ordering, and removal', async (t) => {
  const { store } = await fixture(t, false);
  const template = store.createWorkflowTemplate({ name: 'Action editor', description: '' });
  let detail = workflow(store, template.id);
  const first = store.addWorkflowAction({ templateId: template.id, expectedVersion: 1, stageId: detail.stages[0].id, title: 'Quick add one' });
  assert.equal(first.instructions, '');
  assert.equal(first.applicability, '');
  assert.equal(first.position, 0);
  const second = store.addWorkflowAction({ templateId: template.id, expectedVersion: 2, stageId: detail.stages[0].id, title: 'Quick add two' });
  const third = store.addWorkflowAction({ templateId: template.id, expectedVersion: 3, stageId: detail.stages[0].id, title: 'Quick add three' });
  detail = workflow(store, template.id);
  const rich = definition('Rich first', { actionType: 'verification' });
  const updated = store.updateWorkflowAction({ templateId: template.id, expectedVersion: 4, actionId: first.id, stageId: detail.stages[1].id, ...rich });
  assert.deepEqual({ title: updated.title, instructions: updated.instructions, applicability: updated.applicability,
    definitionOfDone: updated.definitionOfDone, evidenceGuidance: updated.evidenceGuidance, actionType: updated.actionType }, rich);
  const reordered = store.reorderWorkflowActions({ templateId: template.id, expectedVersion: 5, stageId: detail.stages[0].id, actionIds: [third.id, second.id] });
  assert.equal(reordered.version, 6);
  detail = workflow(store, template.id);
  assert.deepEqual(detail.actions.filter(({ stageId }) => stageId === detail.stages[0].id).map(({ id, position }) => [id, position]), [[third.id, 0], [second.id, 1]]);
  assert.deepEqual(detail.actions.filter(({ stageId }) => stageId === detail.stages[1].id).map(({ id, position }) => [id, position]), [[first.id, 0]]);
  const removed = store.removeWorkflowAction({ templateId: template.id, expectedVersion: 6, actionId: third.id });
  assert.equal(removed.version, 7);
  detail = workflow(store, template.id);
  assert.equal(detail.actions.some(({ id }) => id === third.id), false);
  assert.deepEqual(detail.actions.filter(({ stageId }) => stageId === detail.stages[0].id).map(({ position }) => position), [0]);
});

test('template graph validation is atomic and built-in edits are rejected by API and SQLite guards', async (t) => {
  const { store, filename } = await fixture(t, false);
  const builtin = store.getWorkflowLibrary()[0];
  const first = store.createWorkflowTemplate({ name: 'Parent one', description: '' });
  const second = store.createWorkflowTemplate({ name: 'Parent two', description: '' });
  const firstDetail = workflow(store, first.id);
  const secondDetail = workflow(store, second.id);
  const foreignAction = store.addWorkflowAction({ templateId: second.id, expectedVersion: 1, stageId: secondDetail.stages[0].id, title: 'Foreign action' });
  const ownAction = store.addWorkflowAction({ templateId: first.id, expectedVersion: 1, stageId: firstDetail.stages[0].id, title: 'Own action' });
  const before = workflow(store, first.id);
  assert.throws(() => store.reorderWorkflowActions({ templateId: first.id, expectedVersion: 2, stageId: firstDetail.stages[0].id, actionIds: [foreignAction.id] }), { code: 'VALIDATION' });
  assert.throws(() => store.updateWorkflowAction({ templateId: first.id, expectedVersion: 2, actionId: ownAction.id, stageId: secondDetail.stages[0].id, ...definition('Cross parent') }), { code: 'NOT_FOUND' });
  assert.throws(() => store.reorderWorkflowStages({ templateId: first.id, expectedVersion: 2, stageIds: [firstDetail.stages[0].id] }), { code: 'VALIDATION' });
  assert.deepEqual(workflow(store, first.id), before);
  assert.throws(() => store.updateWorkflowTemplate({ templateId: builtin.template.id, expectedVersion: 1, name: 'Mutated built-in', description: 'changed' }), { code: 'FORBIDDEN' });
  assert.throws(() => store.addWorkflowStage({ templateId: builtin.template.id, expectedVersion: 1, name: 'Injected' }), { code: 'FORBIDDEN' });
  const raw = new DatabaseSync(filename);
  try {
    assert.throws(() => raw.prepare('UPDATE workflow_templates SET description = ? WHERE id = ?').run('tampered', builtin.template.id), /Built-in workflow editions are read-only/);
    assert.throws(() => raw.prepare('UPDATE workflow_template_actions SET title = ? WHERE id = ?').run('tampered', builtin.actions[0].id), /Protected workflow action cannot be changed/);
    assert.throws(() => raw.prepare('INSERT INTO workflow_template_stages(template_id, name, position, protected_closing) VALUES (?, ?, ?, 0)').run(builtin.template.id, 'Injected', 7), /Built-in workflow editions are read-only/);
  } finally { raw.close(); }
  assert.deepEqual(store.getWorkflowLibrary()[0], builtin);
});

test('editing and removing a master action leaves active and confirmed release snapshots and provenance intact', async (t) => {
  const { store, filename, project } = await fixture(t);
  const builtin = store.getWorkflowLibrary()[0];
  const source = store.duplicateWorkflowTemplate({ templateId: builtin.template.id, expectedVersion: 1, name: 'Snapshot source' });
  const master = workflow(store, source.id);
  const active = store.createRelease({ projectId: project.id, name: 'Active copy', templateId: source.id, templateVersion: 1 });
  const confirmed = store.createRelease({ projectId: project.id, name: 'Confirmed copy', templateId: source.id, templateVersion: 1 });
  for (const action of releaseActions(store, project.id, confirmed.id).filter(({ kind }) => kind === 'work')) {
    store.completeAction({ projectId: project.id, actionId: action.id });
  }
  const proof = store.recordReleaseVerification({ projectId: project.id, releaseId: confirmed.id, artifactIdentity: 'snapshot-build', evidenceReference: 'CI snapshot run', summary: 'All committed checks passed', outcome: 'passed' });
  store.confirmRelease({ projectId: project.id, releaseId: confirmed.id, verificationId: proof.id });
  const beforeActive = projectRelease(store, project.id, active.id);
  const beforeConfirmed = projectRelease(store, project.id, confirmed.id);
  const beforeActiveActions = releaseActions(store, project.id, active.id);
  const beforeConfirmedActions = releaseActions(store, project.id, confirmed.id);

  const changedAction = master.actions[0];
  store.updateWorkflowAction({ templateId: source.id, expectedVersion: 1, actionId: changedAction.id, stageId: changedAction.stageId,
    ...definition('Changed master definition', { actionType: 'documentation', instructions: 'Master only instructions' }) });
  const v3 = store.updateWorkflowTemplate({ templateId: source.id, expectedVersion: workflow(store, source.id).template.version, name: 'Renamed source', description: 'New master description' });
  store.removeWorkflowAction({ templateId: source.id, expectedVersion: v3.version, actionId: master.actions[1].id });

  assert.deepEqual(projectRelease(store, project.id, active.id), beforeActive);
  assert.deepEqual(projectRelease(store, project.id, confirmed.id), beforeConfirmed);
  assert.deepEqual(releaseActions(store, project.id, active.id), beforeActiveActions);
  assert.deepEqual(releaseActions(store, project.id, confirmed.id), beforeConfirmedActions);
  assert.equal(beforeActive.release.sourceTemplateName, 'Snapshot source');
  assert.equal(beforeActive.release.sourceTemplateVersion, 1);
  assert.equal(beforeConfirmed.release.sourceTemplateName, 'Snapshot source');
  assert.equal(beforeConfirmed.release.sourceTemplateVersion, 1);
  assert.equal(projectRelease(store, project.id, confirmed.id).release.confirmedVerificationId, proof.id);
  const originGuard = new DatabaseSync(filename);
  try {
    assert.throws(() => originGuard.prepare('UPDATE releases SET source_template_name = ? WHERE id = ?').run('Tampered origin', active.id), /Release workflow origin is immutable/);
  } finally { originGuard.close(); }
  assert.equal(workflow(store, source.id).actions.length, master.actions.length - 1);
  assert.equal(workflow(store, source.id).template.version, v3.version + 1);
});

test('release-local definitions and order update audit and scope once, stale verification, and freeze after confirmation', async (t) => {
  const { store, filename, project } = await fixture(t);
  const source = store.getWorkflowLibrary()[0];
  const release = store.createRelease({ projectId: project.id, name: 'Local editing', templateId: source.template.id, templateVersion: source.template.version });
  const other = store.createRelease({ projectId: project.id, name: 'Second snapshot', templateId: source.template.id, templateVersion: source.template.version });
  const otherBefore = releaseActions(store, project.id, other.id);
  const before = store.openProject({ projectId: project.id });
  const work = before.actions.filter(({ releaseId, kind }) => releaseId === release.id && kind === 'work');
  const target = work[0];
  const proof = store.recordReleaseVerification({ projectId: project.id, releaseId: release.id, artifactIdentity: 'before-edit', evidenceReference: 'manual run 1', summary: 'Recorded before local edit', outcome: 'passed' });
  const eventCount = store.openProject({ projectId: project.id }).actionEvents.length;
  const beforeRevision = before.releases.find(({ release: row }) => row.id === release.id).release.scopeRevision;
  const updated = store.updateReleaseAction({ projectId: project.id, actionId: target.id, ...definition('Local title', { actionType: 'verification' }) });
  assert.equal(updated.title, 'Local title');
  assert.deepEqual(updated.details, { instructions: 'Local title instructions', applicability: 'Local title applicability', definitionOfDone: 'Local title done criteria', evidenceGuidance: 'Local title evidence guidance', actionType: 'verification', position: 0 });
  let after = store.openProject({ projectId: project.id });
  let workspace = after.releases.find(({ release: row }) => row.id === release.id);
  assert.equal(workspace.release.scopeRevision, beforeRevision + 1);
  assert.equal(workspace.verifications.find(({ id }) => id === proof.id).scopeRevision, beforeRevision);
  assert.equal(after.actionEvents.length, eventCount + 1);

  const integratedStageId = before.releases.find(({ release: row }) => row.id === release.id).stages[4].id;
  const two = work.filter(({ stageId }) => stageId === integratedStageId);
  assert.equal(two.length, 2);
  const expectedReversed = [...two].reverse().map(({ id }) => id);
  store.reorderReleaseActions({ projectId: project.id, releaseId: release.id, stageId: integratedStageId, actionIds: expectedReversed });
  const stage = store.addReleaseStage({ projectId: project.id, releaseId: release.id, name: 'Local review' });
  assert.equal(stage.name, 'Local review');
  store.updateReleaseStage({ projectId: project.id, releaseId: release.id, stageId: stage.id, name: 'Local quality review' });
  after = store.openProject({ projectId: project.id });
  workspace = after.releases.find(({ release: row }) => row.id === release.id);
  const reorderedStages = [workspace.stages.at(-2).id, ...workspace.stages.slice(0, -2).map(({ id }) => id), workspace.stages.at(-1).id];
  store.reorderReleaseStages({ projectId: project.id, releaseId: release.id, stageIds: reorderedStages });
  after = store.openProject({ projectId: project.id });
  workspace = after.releases.find(({ release: row }) => row.id === release.id);
  assert.equal(workspace.stages.at(-1).key, 'release_confirmation');
  assert.equal(workspace.stages[0].name, 'Local quality review');
  assert.deepEqual(workspace.stages.map(({ position }) => position), workspace.stages.map((_, index) => index));
  const positionsByAction = new Map(after.actions.filter(({ releaseId, stageId, kind }) => releaseId === release.id && stageId === integratedStageId && kind === 'work')
    .map(({ id, details }) => [id, details.position]));
  assert.deepEqual(expectedReversed.map((id) => positionsByAction.get(id)), [0, 1]);
  assert.equal(workspace.progress.percent, null);

  // A second snapshot is untouched by these local edits and the master stays read-only.
  assert.deepEqual(releaseActions(store, project.id, other.id), otherBefore);
  assert.deepEqual(store.getWorkflowLibrary()[0], source);

  // Confirm a separate fully scoped snapshot, then prove action and detail guards at both API and SQL levels.
  const frozen = store.createRelease({ projectId: project.id, name: 'Frozen snapshot', templateId: source.template.id, templateVersion: source.template.version });
  for (const action of releaseActions(store, project.id, frozen.id).filter(({ kind }) => kind === 'work')) store.completeAction({ projectId: project.id, actionId: action.id });
  const finalProof = store.recordReleaseVerification({ projectId: project.id, releaseId: frozen.id, artifactIdentity: 'frozen-build', evidenceReference: 'CI run frozen', summary: 'All copied work passed', outcome: 'passed' });
  store.confirmRelease({ projectId: project.id, releaseId: frozen.id, verificationId: finalProof.id });
  const frozenAction = releaseActions(store, project.id, frozen.id).find(({ kind }) => kind === 'work');
  assert.throws(() => store.updateReleaseAction({ projectId: project.id, actionId: frozenAction.id, ...definition('Blocked') }), { code: 'FORBIDDEN' });
  const raw = new DatabaseSync(filename);
  try {
    assert.throws(() => raw.prepare('UPDATE actions SET title = ? WHERE id = ?').run('SQL tamper', frozenAction.id), /Protected release action/);
    assert.throws(() => raw.prepare('UPDATE action_details SET instructions = ? WHERE action_id = ?').run('SQL tamper', frozenAction.id), /Protected release details cannot be changed/);
    assert.throws(() => raw.prepare('DELETE FROM action_details WHERE action_id = ?').run(frozenAction.id), /Protected release details cannot be changed/);
    assert.throws(() => raw.prepare('DELETE FROM release_actions WHERE action_id = ?').run(frozenAction.id), /Release membership history must be preserved/);
  } finally { raw.close(); }
  assert.equal(projectRelease(store, project.id, frozen.id).release.confirmedVerificationId, finalProof.id);
});

test('failed template and release edits roll back master version, release details, scope and audit', async (t) => {
  const { store, filename, project } = await fixture(t);
  const builtin = store.getWorkflowLibrary()[0];
  const template = store.duplicateWorkflowTemplate({ templateId: builtin.template.id, expectedVersion: 1, name: 'Atomic source' });
  const source = workflow(store, template.id);
  const action = source.actions[0];
  const beforeTemplate = source;
  const raw = new DatabaseSync(filename);
  try { raw.exec("CREATE TRIGGER fail_template_update BEFORE UPDATE ON workflow_template_actions BEGIN SELECT RAISE(ABORT, 'controlled template update failure'); END"); }
  finally { raw.close(); }
  assert.throws(() => store.updateWorkflowAction({ templateId: template.id, expectedVersion: 1, actionId: action.id, stageId: action.stageId, ...definition('Rejected master edit') }), /controlled template update failure/);
  assert.deepEqual(workflow(store, template.id), beforeTemplate);
  const dropTemplateTrigger = new DatabaseSync(filename);
  try { dropTemplateTrigger.exec('DROP TRIGGER fail_template_update'); }
  finally { dropTemplateTrigger.close(); }

  const release = store.createRelease({ projectId: project.id, name: 'Atomic local', templateId: template.id, templateVersion: 1 });
  const target = releaseActions(store, project.id, release.id).find(({ kind }) => kind === 'work');
  const beforeWorkspace = projectRelease(store, project.id, release.id);
  const beforeActions = releaseActions(store, project.id, release.id);
  const eventCount = store.openProject({ projectId: project.id }).actionEvents.length;
  const rejectAudit = new DatabaseSync(filename);
  try { rejectAudit.exec("CREATE TRIGGER fail_local_edit_event BEFORE INSERT ON action_events BEGIN SELECT RAISE(ABORT, 'controlled local audit failure'); END"); }
  finally { rejectAudit.close(); }
  assert.throws(() => store.updateReleaseAction({ projectId: project.id, actionId: target.id, ...definition('Rejected local edit') }), /controlled local audit failure/);
  assert.deepEqual(projectRelease(store, project.id, release.id), beforeWorkspace);
  assert.deepEqual(releaseActions(store, project.id, release.id), beforeActions);
  assert.equal(store.openProject({ projectId: project.id }).actionEvents.length, eventCount);
  assert.deepEqual(workflow(store, template.id), beforeTemplate);
});

test('committing and moving title-only backlog actions appends their current stage order without changing old completion', async t => {
  const { store, project } = await fixture(t);
  const release = store.createRelease({ projectId: project.id, name: 'Assignment order' });
  const stages = store.openProject({ projectId: project.id }).releases[0].stages;
  const a = store.addAction({ projectId: project.id, title: 'Earlier ID, later commitment' });
  const b = store.addAction({ projectId: project.id, title: 'Later ID, earlier commitment' });
  const completed = store.completeAction({ projectId: project.id, actionId: a.id });
  store.assignAction({ projectId: project.id, actionId: b.id, releaseId: release.id, stageId: stages[0].id });
  const assigned = store.assignAction({ projectId: project.id, actionId: a.id, releaseId: release.id, stageId: stages[0].id });
  assert.equal(assigned.completedAt, completed.completedAt);
  assert.equal(assigned.details.position, 1);
  assert.equal(assigned.details.instructions, '');
  store.assignAction({ projectId: project.id, actionId: b.id, releaseId: release.id, stageId: stages[1].id });
  const movedBack = store.assignAction({ projectId: project.id, actionId: b.id, releaseId: release.id, stageId: stages[0].id });
  assert.equal(movedBack.details.position, 2);
  const order = store.openProject({ projectId: project.id }).actions.filter(action => action.stageId === stages[0].id)
    .sort((left, right) => left.details.position - right.details.position).map(action => action.id);
  assert.deepEqual(order, [a.id, b.id]);
});

test('v2 confirmed release migrates with history intact, nullable legacy details and a consistent v4 backup', async (t) => {
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
    assert.equal(current.prepare('PRAGMA user_version').get().user_version, 4);
    assert.equal(current.prepare('PRAGMA foreign_key_check').all().length, 0);
    for (const [table, { key, rows }] of Object.entries(sourceSnapshot)) {
      const columns = Object.keys(rows[0]);
      assert.deepEqual(current.prepare(`SELECT ${columns.join(', ')} FROM ${table} ORDER BY ${key}`).all(), rows, `${table} rows changed during migration`);
    }
    assert.equal(current.prepare('SELECT source_template_id FROM releases WHERE id = 51').get().source_template_id, null);
  } finally { current.close(); }
  const backups = readdirSync(directory).filter((file) => file.includes('.before-v4.') && file.endsWith('.bak'));
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
