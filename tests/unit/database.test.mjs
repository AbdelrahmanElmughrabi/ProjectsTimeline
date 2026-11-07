import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { openStore, migrate } from '../../dist/main/data/database.js';
import { temporaryDirectory } from '../helpers.mjs';

test('real file survives close/reopen with isolated projects, completion and checkpoint history', async (t) => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const project = store.createProject({ name: ' A ' });
  const other = store.createProject({ name: 'B' });
  const action = store.addAction({ projectId: project.id, title: 'Implement persistence' });
  store.addAction({ projectId: project.id, title: 'Verify restart' });
  const completed = store.completeAction({ projectId: project.id, actionId: action.id });
  await new Promise((resolve) => setTimeout(resolve, 5));
  const repeated = store.completeAction({ projectId: project.id, actionId: action.id });
  assert.equal(repeated.completedAt, completed.completedAt);
  assert.throws(() => store.completeAction({ projectId: other.id, actionId: action.id }), { code: 'NOT_FOUND' });
  store.saveCheckpoint({ projectId: project.id, accomplished: 'First', nextSteps: 'Second' });
  store.saveCheckpoint({ projectId: project.id, accomplished: 'Second', nextSteps: 'Third' });
  const before = JSON.stringify(store.openProject({ projectId: project.id }));
  assert.equal(store.openProject({ projectId: other.id }).actions.length, 0);
  store.close();
  store = await openStore(filename);
  assert.equal(JSON.stringify(store.openProject({ projectId: project.id })), before);
  assert.equal(store.listProjects()[1].name, 'A');
  assert.equal(store.openProject({ projectId: project.id }).checkpoints.length, 2);
});

test('workspace query derives project-scoped Resume with timestamp tie-breaking and file recovery', async (t) => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const { id: projectId } = store.createProject({ name: 'Resume' });
  const other = store.createProject({ name: 'Other' });
  assert.equal(store.openProject({ projectId }).resume, null);
  store.saveCheckpoint({ projectId, accomplished: 'First accomplishment', nextSteps: 'First next step' });
  const latest = store.saveCheckpoint({ projectId, accomplished: 'Second accomplishment', nextSteps: 'Saved free text, not an inferred action' });
  store.saveCheckpoint({ projectId: other.id, accomplished: 'Different project', nextSteps: 'Never show in Resume' });
  const raw = new DatabaseSync(filename);
  raw.prepare('UPDATE checkpoints SET created_at = ? WHERE project_id = ?').run('2026-11-05T10:00:00.000Z', projectId);
  assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 4);
  raw.close();
  const detail = store.openProject({ projectId });
  assert.equal(detail.resume.id, latest.id);
  assert.deepEqual(detail.resume, detail.checkpoints[0]);
  assert.equal(detail.resume.nextSteps, 'Saved free text, not an inferred action');
  store.close();
  store = await openStore(filename);
  assert.deepEqual(store.openProject({ projectId }).resume, detail.resume);
});

test('SQL-like text is stored literally; invalid input and missing relationships do not change rows', async (t) => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const project = store.createProject({ name: "A'); DROP TABLE projects; --" });
  assert.equal(store.listProjects()[0].name, project.name);
  for (const name of ['', '  ', 'x'.repeat(121)]) assert.throws(() => store.createProject({ name }), { code: 'VALIDATION' });
  assert.throws(() => store.addAction({ projectId: 999, title: 'Test' }), { code: 'NOT_FOUND' });
  assert.throws(() => store.addAction({ projectId: project.id, title: 'x'.repeat(301) }), { code: 'VALIDATION' });
  assert.throws(() => store.completeAction({ projectId: project.id, actionId: 999 }), { code: 'NOT_FOUND' });
  assert.throws(() => store.openProject({ projectId: '1' }), { code: 'VALIDATION' });
  assert.throws(() => store.saveCheckpoint({ projectId: project.id, accomplished: 'valid', nextSteps: ' ' }), { code: 'VALIDATION' });
  assert.throws(() => store.saveCheckpoint({ projectId: project.id, accomplished: 'x'.repeat(10001), nextSteps: 'valid' }), { code: 'VALIDATION' });
  assert.deepEqual(store.openProject({ projectId: project.id }).actions, []);
  assert.deepEqual(store.openProject({ projectId: project.id }).checkpoints, []);
  assert.equal(store.listProjects().length, 1);
  const raw = new DatabaseSync(filename, { enableForeignKeyConstraints: true });
  try {
    assert.throws(() => raw.prepare('INSERT INTO actions(project_id,title,created_at) VALUES (999,?,?)').run('Orphan', 'now'), /FOREIGN KEY/);
    assert.throws(() => raw.prepare('INSERT INTO projects(name,created_at) VALUES (?,?)').run('', 'now'), /CHECK/);
  } finally { raw.close(); }
});

test('equal checkpoint timestamps use descending ID and repeated startup keeps schema/data', async (t) => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const { id: projectId } = store.createProject({ name: 'Ties' });
  const first = store.saveCheckpoint({ projectId, accomplished: 'One', nextSteps: 'Two' });
  const second = store.saveCheckpoint({ projectId, accomplished: 'Two', nextSteps: 'Three' });
  const raw = new DatabaseSync(filename);
  raw.prepare('UPDATE checkpoints SET created_at = ?').run('2026-11-05T00:00:00.000Z');
  raw.close();
  assert.deepEqual(store.openProject({ projectId }).checkpoints.map((row) => row.id), [second.id, first.id]);
});

test('failed writes leave committed records unchanged; a locked database can recover', async (t) => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const { id: projectId } = store.createProject({ name: 'Failure' });
  const raw = new DatabaseSync(filename);
  try {
    raw.exec('BEGIN IMMEDIATE');
    assert.throws(() => store.addAction({ projectId, title: 'Locked' }), /locked/);
    raw.exec('ROLLBACK');
    assert.equal(store.openProject({ projectId }).actions.length, 0);
    store.addAction({ projectId, title: 'Recovered' });
    raw.exec("CREATE TRIGGER fail_checkpoint BEFORE INSERT ON checkpoints BEGIN SELECT RAISE(ABORT, 'controlled failure'); END");
    assert.throws(() => store.saveCheckpoint({ projectId, accomplished: 'Keep', nextSteps: 'Retry' }), /controlled failure/);
    assert.equal(store.openProject({ projectId }).checkpoints.length, 0);
  } finally { raw.close(); }
});

test('migration batch backs up existing data and rolls schema/version back on failure', async (t) => {
  const directory = temporaryDirectory(t);
  const filename = join(directory, 'workspace.sqlite');
  const store = await openStore(filename);
  store.createProject({ name: 'Preserve me' });
  store.close();
  const migrations = join(directory, 'migrations');
  mkdirSync(migrations);
  copyFileSync(resolve('src/main/data/migrations/001_initial.sql'), join(migrations, '001_initial.sql'));
  copyFileSync(resolve('src/main/data/migrations/002_release_progress.sql'), join(migrations, '002_release_progress.sql'));
  copyFileSync(resolve('src/main/data/migrations/003_workflow_templates.sql'), join(migrations, '003_workflow_templates.sql'));
  copyFileSync(resolve('src/main/data/migrations/004_durable_knowledge.sql'), join(migrations, '004_durable_knowledge.sql'));
  writeFileSync(join(migrations, '005_extra.sql'), 'CREATE TABLE extra (id INTEGER PRIMARY KEY);');
  writeFileSync(join(migrations, '006_broken.sql'), 'INSERT INTO missing_table VALUES (1);');
  await assert.rejects(openStore(filename, migrations), /missing_table/);
  const raw = new DatabaseSync(filename);
  try {
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 4);
    assert.equal(raw.prepare("SELECT name FROM sqlite_master WHERE name='extra'").get(), undefined);
    assert.equal(raw.prepare('SELECT name FROM projects').get().name, 'Preserve me');
    await assert.rejects(migrate(raw, join(filename, 'nonexistent', 'db'), migrations));
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 4);
  } finally { raw.close(); }
  const backups = readdirSync(directory).filter((file) => file.includes('.before-v6.') && file.endsWith('.bak'));
  assert.equal(backups.length, 1);
  const backupDb = new DatabaseSync(join(directory, backups[0]));
  assert.equal(backupDb.prepare('SELECT name FROM projects').get().name, 'Preserve me');
  backupDb.close();
  writeFileSync(join(migrations, '006_broken.sql'), 'CREATE TABLE extra_two (id INTEGER PRIMARY KEY);');
  const upgraded = await openStore(filename, migrations);
  const upgradedDb = new DatabaseSync(filename);
  assert.equal(upgradedDb.prepare('PRAGMA user_version').get().user_version, 6);
  assert.equal(upgradedDb.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name IN ('extra','extra_two')").get().n, 2);
  upgradedDb.close();
  upgraded.close();
  await assert.rejects(openStore(filename), /newer/);
});

test('unversioned and unreadable existing files are preserved rather than reset', async (t) => {
  const directory = temporaryDirectory(t);
  const unknown = join(directory, 'unknown.sqlite');
  const raw = new DatabaseSync(unknown);
  raw.exec('CREATE TABLE unknown (data TEXT);');
  raw.close();
  await assert.rejects(openStore(unknown), /Unversioned/);
  const invalid = join(directory, 'invalid.sqlite');
  writeFileSync(invalid, 'This is not a database.');
  await assert.rejects(openStore(invalid));
  assert.equal(readFileSync(invalid, 'utf8'), 'This is not a database.');
});
