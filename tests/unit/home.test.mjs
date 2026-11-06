import assert from 'node:assert/strict';
import test from 'node:test';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openStore } from '../../dist/main/data/database.js';
import { temporaryDirectory } from '../helpers.mjs';

test('Home derives isolated checkpoint/activity summaries with deterministic ties and honest legacy emptiness', async t => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  assert.deepEqual(store.getHomeSummary(), []);
  const legacy = store.createProject({ name: 'Legacy work' });
  const empty = store.createProject({ name: 'Empty project' });
  const active = store.createProject({ name: 'Active project' });
  const other = store.createProject({ name: 'Other project' });
  store.saveCheckpoint({ projectId: active.id, accomplished: 'Older at the same timestamp', nextSteps: 'Old next step' });
  const latest = store.saveCheckpoint({ projectId: active.id, accomplished: 'Saved context', nextSteps: 'Keep this authored next step' });
  store.saveCheckpoint({ projectId: other.id, accomplished: 'Other context', nextSteps: 'Never leak into Active' });
  const raw = new DatabaseSync(filename);
  try {
    // Deliberate isolated timestamps exercise deterministic order, not production activity.
    const at = '2035-01-02T03:04:05.000Z';
    raw.prepare('UPDATE checkpoints SET created_at = ?').run(at);
    raw.prepare('UPDATE projects SET created_at = ?').run('2035-01-01T00:00:00.000Z');
    raw.prepare('INSERT INTO actions(project_id, title, created_at, completed_at) VALUES (?, ?, ?, ?)').run(legacy.id, 'Old completed work without invented audit', at, at);
    raw.prepare('INSERT INTO action_events(project_id, description, created_at) VALUES (?, ?, ?)').run(active.id, 'Event tied with saved checkpoint', at);
    let summaries = store.getHomeSummary();
    assert.deepEqual(summaries.map(row => row.project.id), [other.id, active.id, empty.id, legacy.id]);
    const row = summaries.find(row => row.project.id === active.id);
    assert.equal(row.checkpoint.id, latest.id);
    assert.deepEqual(row.checkpoint, { ...store.openProject({ projectId: active.id }).resume });
    assert.equal(row.activity.source, 'checkpoint');
    assert.equal(row.activity.id, latest.id);
    for (const id of [legacy.id, empty.id]) {
      assert.equal(summaries.find(row => row.project.id === id).checkpoint, null);
      assert.equal(summaries.find(row => row.project.id === id).activity, null);
    }
    raw.prepare('INSERT INTO action_events(project_id, description, created_at) VALUES (?, ?, ?)').run(active.id, 'Later actual event', '2035-01-02T03:04:06.000Z');
    const lastEvent = Number(raw.prepare('INSERT INTO action_events(project_id, description, created_at) VALUES (?, ?, ?)').run(active.id, 'Newest ID at the same event time', '2035-01-02T03:04:06.000Z').lastInsertRowid);
    summaries = store.getHomeSummary();
    assert.equal(summaries[0].project.id, active.id);
    assert.deepEqual(summaries[0].activity, { id: lastEvent, source: 'action-event', description: 'Newest ID at the same event time', createdAt: '2035-01-02T03:04:06.000Z' });
    assert.equal(summaries[0].checkpoint.nextSteps, 'Keep this authored next step');
  } finally { raw.close(); }
});

test('Home is read-only, avoids complete workspace loading and recovers exact summaries after reopen', async t => {
  let store;
  const filename = join(temporaryDirectory(t, () => store?.close()), 'workspace.sqlite');
  store = await openStore(filename);
  const project = store.createProject({ name: 'Persisted Home' });
  store.addAction({ projectId: project.id, title: 'A real saved action' });
  store.saveCheckpoint({ projectId: project.id, accomplished: '<img src=x onerror=alert(1)>', nextSteps: 'Authored\nnext steps' });
  store.createRelease({ projectId: project.id, name: 'Existing delivery' });
  const raw = new DatabaseSync(filename);
  const snapshot = () => {
    const tables = raw.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return JSON.stringify({ version: raw.prepare('PRAGMA user_version').get().user_version,
      rows: tables.map(({ name }) => [name, raw.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]) });
  };
  let summary;
  try {
    const before = snapshot();
    store.openProject = () => { throw new Error('Home must not load complete project histories'); };
    summary = store.getHomeSummary();
    assert.equal(summary[0].checkpoint.nextSteps, 'Authored\nnext steps');
    assert.equal(summary[0].project.id, project.id);
    assert.deepEqual(store.getHomeSummary(), summary);
    assert.equal(snapshot(), before);
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 3);
  } finally { raw.close(); }
  store.close();
  store = await openStore(filename);
  assert.deepEqual(store.getHomeSummary(), summary);
});
