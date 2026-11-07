import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openStore } from '../../dist/main/data/database.js';
import { BlueprintPreviewSession } from '../../dist/main/blueprint/session.js';
import { temporaryDirectory } from '../helpers.mjs';

const v3Migrations = ['001_initial.sql', '002_release_progress.sql', '003_workflow_templates.sql'];
const count = (db, table) => db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
const allLegacyRows = (db, names) => (names ?? db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row => row.name))
  .map(name => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all()]);

async function seedV3(filename, migrationsDirectory) {
  const db = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  for (const file of v3Migrations) db.exec(readFileSync(resolve('src/main/data/migrations', file), 'utf8'));
  db.exec('PRAGMA user_version = 3');
  db.close();
  let store = await openStore(filename, migrationsDirectory);
  const project = store.createProject({ name: 'Frozen v3 project' });
  const release = store.createRelease({ projectId: project.id, name: 'Frozen release' });
  for (const stage of store.openProject({ projectId: project.id }).releases[0].stages.slice(0, 6)) {
    const action = store.addAction({ projectId: project.id, title: `Completed ${stage.name}` });
    store.assignAction({ projectId: project.id, actionId: action.id, releaseId: release.id, stageId: stage.id });
    store.completeAction({ projectId: project.id, actionId: action.id });
  }
  store.saveCheckpoint({ projectId: project.id, accomplished: 'Saved accomplishment', nextSteps: 'Continue from the exact checkpoint' });
  const verification = store.recordReleaseVerification({ projectId: project.id, releaseId: release.id, artifactIdentity: 'legacy-build', evidenceReference: 'CI 41', summary: 'Existing passed verification', outcome: 'passed' });
  store.confirmRelease({ projectId: project.id, releaseId: release.id, verificationId: verification.id });
  store.close();
  const snapshotDb = new DatabaseSync(filename);
  const snapshot = allLegacyRows(snapshotDb);
  snapshotDb.close();
  return snapshot;
}

function sessionFor(entry, keys = []) {
  return new BlueprintPreviewSession(async () => entry, () => keys);
}

test('v3 migration preserves frozen release, workflow, checkpoint and all legacy rows; rollback and backup stay consistent', async t => {
  const directory = temporaryDirectory(t);
  const filename = join(directory, 'v3.sqlite');
  const custom = join(directory, 'migrations'); mkdirSync(custom);
  for (const file of v3Migrations) copyFileSync(resolve('src/main/data/migrations', file), join(custom, file));
  const before = await seedV3(filename, custom);
  writeFileSync(join(custom, '004_broken.sql'), 'CREATE TABLE rolled_back (id INTEGER); INSERT INTO missing_table VALUES (1);');
  await assert.rejects(openStore(filename, custom), /missing_table/);
  let db = new DatabaseSync(filename);
  try {
    assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3);
    assert.deepEqual(allLegacyRows(db, before.map(([name]) => name)), before);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name = 'rolled_back'").get(), undefined);
  } finally { db.close(); }
  const backups = readdirSync(directory).filter(file => file.includes('.before-v4.') && file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  db = new DatabaseSync(join(directory, backups[0]));
  try { assert.equal(db.prepare('PRAGMA user_version').get().user_version, 3); assert.deepEqual(allLegacyRows(db), before); }
  finally { db.close(); }

  const store = await openStore(filename);
  const after = new DatabaseSync(filename);
  try {
    assert.equal(after.prepare('PRAGMA user_version').get().user_version, 4);
    assert.deepEqual(after.prepare('PRAGMA foreign_key_check').all(), []);
    assert.deepEqual(allLegacyRows(after, before.map(([name]) => name)), before);
    assert.equal(store.openProject({ projectId: 1 }).releases[0].progress.state, 'confirmed');
    assert.equal(store.getWorkflowLibrary()[0].template.name, 'Seven-stage Engineering Workflow');
    assert.equal(store.openProject({ projectId: 1 }).resume.nextSteps, 'Continue from the exact checkpoint');
  } finally { after.close(); store.close(); }
  const newer = new DatabaseSync(filename); newer.exec('PRAGMA user_version = 5'); newer.close();
  await assert.rejects(openStore(filename), /newer/);
});

test('review is cached and read-only; apply replays its receipt after the preview session expires', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  store = await openStore(filename);
  const legacy = store.createProject({ name: 'Legacy backlog remains ordinary work' });
  const legacyAction = store.addAction({ projectId: legacy.id, title: 'Legacy ID collides with the first knowledge entity' });
  const source = resolve('docs/design/examples/ptb-v0.2/small/project.md');
  const session = sessionFor(source);
  const { snapshot } = await session.choose();
  const before = JSON.stringify(store.getHomeSummary());
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Desk Notes reviewed' }, store);
  assert.equal(prepared.kind, 'prepared');
  assert.equal(prepared.counts.project, 1);
  assert.equal(prepared.counts.action, 4);
  assert.equal(prepared.relationshipCount, 29);
  assert.equal(JSON.stringify(store.getHomeSummary()), before);
  assert.equal(store.listProjects().length, 1);
  const preparedRows = new DatabaseSync(filename);
  try { assert.equal(count(preparedRows, 'knowledge_imports'), 0); }
  finally { preparedRows.close(); }
  await assert.rejects(session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Changed', extra: true }, store), { code: 'VALIDATION' });

  const beforeApply = new DatabaseSync(filename);
  const legacyEventCount = count(beforeApply, 'action_events');
  beforeApply.close();
  const applied = session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store);
  assert.equal(applied.replayed, false);
  assert.equal(applied.receipt.rootEntityId, legacyAction.id);
  assert.equal(applied.receipt.counts.action, 4);
  assert.equal(applied.receipt.relationshipCount, 29);
  const projectId = applied.receipt.project.id;
  assert.equal(store.openProject({ projectId }).actions.length, 0);
  assert.throws(() => store.completeAction({ projectId, actionId: applied.receipt.rootEntityId }), { code: 'NOT_FOUND' });
  const raw = new DatabaseSync(filename);
  try {
    assert.equal(count(raw, 'actions'), 1);
    assert.equal(count(raw, 'action_details'), 0);
    assert.equal(count(raw, 'release_actions'), 0);
    assert.equal(count(raw, 'knowledge_entities'), 15);
    assert.equal(count(raw, 'action_events'), legacyEventCount + 1);
    assert.equal(raw.prepare("SELECT COUNT(*) AS n FROM action_events WHERE description = 'Created knowledge project from reviewed blueprint'").get().n, 1);
  } finally { raw.close(); }
  session.cancel();
  assert.deepEqual(session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store), { receipt: applied.receipt, replayed: true });
  assert.throws(() => session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: '0'.repeat(64) }, store), { code: 'VALIDATION' });
  const savedWorkspace = store.openKnowledgeWorkspace({ projectId });
  assert.equal(savedWorkspace.links.length, 29);
  assert.equal(savedWorkspace.nodes.length, 15);
  const repeated = sessionFor(source);
  const repeatedSnapshot = (await repeated.choose()).snapshot;
  const existing = await repeated.prepareKnowledgeFormation({ sessionId: repeatedSnapshot.sessionId, snapshotId: repeatedSnapshot.snapshotId, name: 'A different requested name' }, store);
  assert.equal(existing.kind, 'existing');
  assert.equal(existing.receipt.project.id, projectId);
  assert.equal(existing.captureComparison, 'same');
  const edge = savedWorkspace.links[0];
  const edgeSource = store.getKnowledgeSource({ projectId, target: { kind: 'relationship', relationshipId: edge.relationshipId } });
  assert.ok(edgeSource.selection);
  assert.ok(edgeSource.document.text.slice(edgeSource.selection.span.start.utf16Offset, edgeSource.selection.span.end.utf16Offset).length > 0);
  const unrelated = store.createProject({ name: 'Not the formed project' });
  assert.throws(() => store.getKnowledgeRecord({ projectId: unrelated.id, entityId: applied.receipt.rootEntityId }), { code: 'NOT_FOUND' });
  assert.throws(() => store.getKnowledgeSource({ projectId: unrelated.id, target: { kind: 'record', entityId: applied.receipt.rootEntityId, revision: 1, part: 'metadata' } }), { code: 'NOT_FOUND' });
});

test('complex multi-document PTB persists every typed definition and explicit native relationship', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite'); store = await openStore(filename);
  const session = sessionFor(resolve('docs/design/examples/ptb-v0.2/complex/project.md'));
  const { snapshot } = await session.choose();
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'FieldLedger' }, store);
  assert.equal(prepared.kind, 'prepared');
  assert.equal(prepared.documents.length, 4);
  assert.equal(prepared.relationshipCount, 82);
  const { receipt } = session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store);
  const workspace = store.openKnowledgeWorkspace({ projectId: receipt.project.id });
  assert.equal(workspace.nodes.length, 37);
  assert.equal(workspace.links.length, 82);
  assert.deepEqual(workspace.counts, prepared.counts);
  const records = workspace.nodes.map(({ entityId }) => store.getKnowledgeRecord({ projectId: receipt.project.id, entityId }));
  assert.equal(records.filter(record => record.kind === 'requirement' && record.state === 'draft').length, prepared.counts.requirement);
  assert.equal(records.filter(record => record.kind === 'scope' && record.state === 'draft').length, prepared.counts.scope);
  assert.equal(records.filter(record => record.kind === 'action' && record.state === 'proposed').length, prepared.counts.action);
  assert.equal(records.filter(record => record.kind === 'decision' && record.state === 'proposed').length, prepared.counts.decision);
  assert.equal(records.filter(record => record.kind === 'check' && record.state === 'not-run').length, prepared.counts.check);
  assert.ok(records.filter(record => record.kind === 'action').every(record => record.details.title === record.title));
  assert.ok(workspace.links.every(link => records.some(record => record.entityId === link.fromEntityId) && records.some(record => record.entityId === link.toEntityId)));
  assert.equal(store.openProject({ projectId: receipt.project.id }).actions.length, 0);
  assert.equal(store.openProject({ projectId: receipt.project.id }).releases.length, 0);
});

test('stored record/source anchors survive restart and deleted capture files, with UTF-8 bytes and typed links intact', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  const entry = join(directory, 'project.md');
  const text = '\uFEFF# 🧭 Capture\r\n\r\n```ptb\r\n{"ptb":"0.2","kind":"project","id":"proj.capture","title":"Capture","goal":"Saved 🧭","extra":"retained only in source"}\r\n```\r\n\r\nA narrative with 🧭 and exact CRLF.\r\n';
  writeFileSync(entry, text);
  store = await openStore(filename);
  const session = sessionFor(entry);
  const { snapshot } = await session.choose();
  writeFileSync(entry, 'Changed after capture; this must not replace the reviewed bytes.');
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Captured project' }, store);
  assert.equal(prepared.kind, 'prepared');
  assert.ok(prepared.diagnostics.some(d => d.code === 'UNKNOWN_FIELD'));
  const { receipt } = session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store);
  const workspace = store.openKnowledgeWorkspace({ projectId: receipt.project.id });
  const root = store.getKnowledgeRecord({ projectId: receipt.project.id, entityId: receipt.rootEntityId });
  assert.equal(root.goal, 'Saved 🧭');
  assert.equal(root.extra, undefined);
  for (const [part, anchor] of [['metadata', root.metadata], ['narrative', root.narrative]]) {
    const stored = store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'record', entityId: root.entityId, revision: 1, part } });
    assert.equal(stored.document.text.slice(anchor.source.span.start.utf16Offset, anchor.source.span.end.utf16Offset),
      text.slice(anchor.source.span.start.utf16Offset, anchor.source.span.end.utf16Offset));
  }
  assert.ok(workspace.links.every(link => Number.isSafeInteger(link.relationshipId)));
  store.close(); store = await openStore(filename);
  renameSync(entry, join(directory, 'moved-away.md'));
  const restored = store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'document', importId: receipt.importId, documentKey: snapshot.documents[0].id } });
  assert.equal(restored.document.text, text);
  assert.equal(restored.document.byteLength, Buffer.byteLength(text));
  assert.equal(restored.document.sha256, snapshot.documents[0].sha256);
  assert.equal(store.getKnowledgeRecord({ projectId: receipt.project.id, entityId: root.entityId }).narrativeMarkdown, root.narrativeMarkdown);
  assert.throws(() => store.getKnowledgeRecord({ projectId: receipt.project.id, entityId: 999999 }), { code: 'NOT_FOUND' });
  assert.throws(() => store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'document', importId: receipt.importId, documentKey: 'missing.md' } }), { code: 'NOT_FOUND' });
  assert.throws(() => store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'document', importId: receipt.importId, documentKey: snapshot.documents[0].id, nested: { forged: true } } }), { code: 'VALIDATION' });
  assert.throws(() => store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'diagnostic', importId: '00000000-0000-4000-8000-000000000000', diagnosticId: 'missing' } }), { code: 'NOT_FOUND' });
  const corrupt = new DatabaseSync(filename);
  try {
    const forged = structuredClone(root.metadata.source);
    forged.span.end.utf16Offset = text.length + 1;
    corrupt.exec('DROP TRIGGER knowledge_definitions_no_update');
    corrupt.prepare('UPDATE knowledge_definitions SET metadata_ref_json=? WHERE entity_id=? AND revision=1').run(JSON.stringify(forged), root.entityId);
  } finally { corrupt.close(); }
  assert.throws(() => store.getKnowledgeSource({ projectId: receipt.project.id, target: { kind: 'record', entityId: root.entityId, revision: 1, part: 'metadata' } }), { code: 'STORAGE' });
});

test('refresh/cancel/stale review and unknown payloads do not create a proposal', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite'); store = await openStore(filename);
  const entry = resolve('docs/design/examples/ptb-v0.2/small/project.md');
  const session = sessionFor(entry);
  const { snapshot } = await session.choose();
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Desk Notes' }, store);
  const refreshed = await session.refresh({ sessionId: snapshot.sessionId });
  assert.notEqual(refreshed.snapshot.snapshotId, snapshot.snapshotId);
  assert.throws(() => session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store), { code: 'NOT_FOUND' });
  await assert.rejects(session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Desk Notes' }, store), { code: 'NOT_FOUND' });
  session.cancel();
  assert.equal(store.listProjects().length, 0);
  assert.throws(() => session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest, projectId: 50 }, store), { code: 'VALIDATION' });
});

test('invalid captured graphs cannot be prepared or write any rows', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  const entry = join(directory, 'invalid.md');
  writeFileSync(entry, [
    '```ptb',
    JSON.stringify({ ptb: '0.2', kind: 'project', id: 'proj.invalid', title: 'Invalid', goal: 'No formation.' }),
    '```',
    '```ptb',
    JSON.stringify({ ptb: '0.2', kind: 'feature', id: 'feat.wrong-owner', project: 'proj.other', title: 'Wrong owner', component: 'cmp.missing' }),
    '```',
  ].join('\n'));
  store = await openStore(filename);
  const session = sessionFor(entry);
  const { snapshot } = await session.choose();
  assert.equal(snapshot.validation, 'invalid');
  await assert.rejects(session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Reject this graph' }, store), { code: 'VALIDATION' });
  assert.equal(store.listProjects().length, 0);
  const raw = new DatabaseSync(filename);
  try {
    assert.equal(count(raw, 'knowledge_source_bindings'), 0);
    assert.equal(count(raw, 'knowledge_imports'), 0);
    assert.equal(count(raw, 'knowledge_entities'), 0);
    assert.equal(count(raw, 'action_events'), 0);
  } finally { raw.close(); }
});

test('unresolved scope workflow stays a Draft plan marked Needs review without release stages', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite');
  const entry = join(directory, 'review.md');
  writeFileSync(entry, [
    '```ptb',
    JSON.stringify({ ptb: '0.2', kind: 'project', id: 'proj.review', title: 'Review', goal: 'Keep unresolved references visible.' }),
    '```',
    '```ptb',
    JSON.stringify({ ptb: '0.2', kind: 'scope', id: 'scope.draft', project: 'proj.review', title: 'Draft work', workflow: { template_key: 'missing-workflow', version: 7 } }),
    '```',
  ].join('\n'));
  store = await openStore(filename);
  const session = sessionFor(entry);
  const { snapshot } = await session.choose();
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Needs review' }, store);
  assert.equal(prepared.kind, 'prepared');
  assert.equal(prepared.diagnostics.some(d => d.code === 'WORKFLOW_UNRESOLVED'), true);
  const { receipt } = session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store);
  const scope = store.openKnowledgeWorkspace({ projectId: receipt.project.id });
  const node = scope.nodes.find(n => n.kind === 'scope');
  const record = store.getKnowledgeRecord({ projectId: receipt.project.id, entityId: node.entityId });
  assert.equal(record.state, 'draft');
  assert.equal(record.workflowStatus, 'unresolved');
  assert.deepEqual(record.workflow, { template_key: 'missing-workflow', version: 7 });
  assert.deepEqual(scope.review.needsReviewScopeEntityIds, [node.entityId]);
  assert.equal(store.openProject({ projectId: receipt.project.id }).releases.length, 0);
});

test('formation write failure rolls back project, import, graph and event, then the same review can retry', async t => {
  let store;
  const directory = temporaryDirectory(t, () => store?.close());
  const filename = join(directory, 'workspace.sqlite'); store = await openStore(filename);
  const session = sessionFor(resolve('docs/design/examples/ptb-v0.2/small/project.md'));
  const { snapshot } = await session.choose();
  const prepared = await session.prepareKnowledgeFormation({ sessionId: snapshot.sessionId, snapshotId: snapshot.snapshotId, name: 'Atomic retry' }, store);
  const raw = new DatabaseSync(filename);
  try {
    raw.exec("CREATE TRIGGER reject_formation_link BEFORE INSERT ON knowledge_relationships BEGIN SELECT RAISE(ABORT, 'controlled formation failure'); END");
    assert.throws(() => session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store), /controlled formation failure/);
    assert.equal(count(raw, 'projects'), 0);
    assert.equal(count(raw, 'knowledge_source_bindings'), 0);
    assert.equal(count(raw, 'knowledge_imports'), 0);
    assert.equal(count(raw, 'knowledge_entities'), 0);
    assert.equal(count(raw, 'knowledge_documents'), 0);
    assert.equal(count(raw, 'action_events'), 0);
    raw.exec('DROP TRIGGER reject_formation_link');
    raw.exec("CREATE TRIGGER reject_formation_event BEFORE INSERT ON action_events WHEN NEW.description = 'Created knowledge project from reviewed blueprint' BEGIN SELECT RAISE(ABORT, 'controlled audit failure'); END");
    assert.throws(() => session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store), /controlled audit failure/);
    assert.equal(count(raw, 'projects'), 0);
    assert.equal(count(raw, 'knowledge_imports'), 0);
    assert.equal(count(raw, 'knowledge_entities'), 0);
    assert.equal(count(raw, 'action_events'), 0);
    raw.exec('DROP TRIGGER reject_formation_event');
  } finally { raw.close(); }
  assert.equal(session.applyKnowledgeFormation({ operationId: prepared.operationId, reviewDigest: prepared.reviewDigest }, store).replayed, false);
  assert.equal(store.listProjects().length, 1);
});

test('latest preparation owns the plan; renderer copies and colliding operational IDs cannot mutate knowledge', async t => {
  let store; const directory=temporaryDirectory(t,()=>store?.close());
  store=await openStore(join(directory,'workspace.sqlite'));
  const session=sessionFor(resolve('docs/design/examples/ptb-v0.2/small/project.md'));
  const {snapshot}=await session.choose();
  const first=session.prepareKnowledgeFormation({sessionId:snapshot.sessionId,snapshotId:snapshot.snapshotId,name:'Superseded name'},store);
  const second=session.prepareKnowledgeFormation({sessionId:snapshot.sessionId,snapshotId:snapshot.snapshotId,name:'Reviewed name'},store);
  const outcomes=await Promise.allSettled([first,second]);
  assert.equal(outcomes[0].status,'rejected');assert.equal(outcomes[1].status,'fulfilled');
  const prepared=outcomes[1].value;
  const key={operationId:prepared.operationId,reviewDigest:prepared.reviewDigest};
  prepared.projectName='Renderer tampering';prepared.documents[0].sha256='0'.repeat(64);
  const {receipt}=session.applyKnowledgeFormation(key,store);
  assert.equal(receipt.project.name,'Reviewed name');
  const before=store.openKnowledgeWorkspace({projectId:receipt.project.id});
  const raw=new DatabaseSync(join(directory,'workspace.sqlite'));
  const action=before.nodes.find(n=>n.kind==='action');
  raw.prepare('INSERT INTO actions(id,project_id,title,created_at) VALUES (?,?,?,?)').run(action.entityId,receipt.project.id,'Separate legacy action',new Date().toISOString());raw.close();
  store.completeAction({projectId:receipt.project.id,actionId:action.entityId});
  assert.deepEqual(store.openKnowledgeWorkspace({projectId:receipt.project.id}),before);
  assert.equal(store.getKnowledgeRecord({projectId:receipt.project.id,entityId:action.entityId}).state,'proposed');
});

test('lossy decoded Unicode or NUL labels block formation while exact source remains inspectable', async t => {
  let store;const directory=temporaryDirectory(t,()=>store?.close());store=await openStore(join(directory,'workspace.sqlite'));
  const entry=join(directory,'project.md');
  for(const escaped of ['\\ud800','bad\\u0000label']){
    const source='```ptb\n{"ptb":"0.2","kind":"project","id":"proj.storage","title":"'+escaped+'"}\n```';
    writeFileSync(entry,source);const session=sessionFor(entry);const{snapshot}=await session.choose();
    assert.equal(snapshot.documents[0].text,source);
    await assert.rejects(session.prepareKnowledgeFormation({sessionId:snapshot.sessionId,snapshotId:snapshot.snapshotId,name:'Safe name'},store),{code:'VALIDATION'});
    assert.equal(store.listProjects().length,0);session.cancel();
  }
});
