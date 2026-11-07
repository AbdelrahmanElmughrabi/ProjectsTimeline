import assert from 'node:assert/strict';
import test from 'node:test';
import { writeFileSync, mkdirSync, linkSync, symlinkSync, renameSync, readFileSync, appendFileSync } from 'node:fs';
import fsPromises from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { temporaryDirectory } from '../helpers.mjs';
import { captureBlueprint, createBlueprintGrant, validDocumentPath } from '../../dist/main/blueprint/acquisition.js';
import { BlueprintPreviewSession } from '../../dist/main/blueprint/session.js';
import { openStore } from '../../dist/main/data/database.js';

const block = obj => '```ptb\n' + JSON.stringify(obj) + '\n```\n';
const project = (documents = []) => block({ ptb: '0.2', kind: 'project', id: 'proj.capture', title: 'Capture', documents });
const context = { sessionId: 'test-session', snapshotId: 'test-snapshot', capturedAt: '2026-11-06T00:00:00.000Z', releaseWorkflowKeys: [] };
const codes = snapshot => snapshot.diagnostics.map(d => d.code);

test('safe acquisition reads real single and multi-document fixtures with exact source and zero input writes', async t => {
  for (const size of ['small', 'complex']) {
    const path = resolve(`docs/design/examples/ptb-v0.2/${size}/project.md`);
    const before = readFileSync(path);
    const snapshot = await captureBlueprint(await createBlueprintGrant(path), context);
    assert.notEqual(snapshot.validation, 'invalid', JSON.stringify(snapshot.diagnostics));
    assert.equal(snapshot.documents.length, size === 'small' ? 1 : 4);
    assert.equal(snapshot.records.length, size === 'small' ? 15 : 37);
    assert.equal(snapshot.relationships.length, size === 'small' ? 29 : 82);
    assert.equal(snapshot.documents[0].text, new TextDecoder('utf-8', { ignoreBOM: true }).decode(before));
    assert.deepEqual(readFileSync(path), before);
  }
});

test('manifest rejects Windows special/escaping paths, normalized aliases and missing source without reading it', async t => {
  const dir = temporaryDirectory(t);
  for (const path of ['../x.md', 'a/../x.md', '/abs.md', 'C:/x.md', '//server/x.md', 'x\\a.md', 'nul.md', 'COM1.foo.md', 'name./a.md', 'x.md:ads', 'https://x.md', 'x//a.md', 'x\0.md']) assert.equal(validDocumentPath(path), false, path);
  const entry = join(dir, 'project.md');
  writeFileSync(entry, project(['../outside.md', 'missing.md', 'project.md', 'other.md', 'OTHER.md']));
  writeFileSync(join(dir, 'other.md'), '# Ordinary prose grants no extra read.');
  const result = await captureBlueprint(await createBlueprintGrant(entry), context);
  assert.equal(result.validation, 'invalid');
  for (const code of ['PATH_UNSAFE', 'PATH_ALIAS', 'FILE_UNAVAILABLE']) assert.ok(codes(result).includes(code), code);
  assert.equal(result.diagnostics.find(d => d.code === 'PATH_UNSAFE').field, '/documents/0');
  const missing = result.documents.find(d => d.relativePath === 'missing.md');
  assert.equal(missing.text, null);
  assert.deepEqual(missing.headings, []);
  assert.ok(!result.documents.some(d => d.relativePath.includes('..')));
});

test('physical aliases and junction escape are rejected; in-root junction is allowed', async t => {
  const dir = temporaryDirectory(t);
  const root = join(dir, 'root'); const external = join(dir, 'outside');
  mkdirSync(root); mkdirSync(external); mkdirSync(join(root, 'inside'));
  const entry = join(root, 'project.md');
  writeFileSync(join(root, 'inside', 'ok.md'), '# Captured context');
  writeFileSync(join(external, 'secret.md'), '# This must never be captured');
  symlinkSync(external, join(root, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
  symlinkSync(join(root, 'inside'), join(root, 'allowed'), process.platform === 'win32' ? 'junction' : 'dir');
  linkSync(join(root, 'inside', 'ok.md'), join(root, 'alias.md'));
  writeFileSync(entry, project(['allowed/ok.md', 'alias.md', 'escape/secret.md']));
  const result = await captureBlueprint(await createBlueprintGrant(entry), context);
  assert.ok(codes(result).includes('PATH_ALIAS'));
  assert.ok(codes(result).includes('PATH_UNSAFE'));
  assert.equal(result.documents.find(d => d.relativePath === 'allowed/ok.md').text, '# Captured context');
  assert.ok(!JSON.stringify(result).includes('This must never be captured'));
});

test('capture rejects invalid UTF8, oversized files and replaced root identity; captures BOM/CRLF exactly', async t => {
  const dir = temporaryDirectory(t); const root = join(dir, 'root'); mkdirSync(root);
  const entry = join(root, 'project.md');
  writeFileSync(entry, Buffer.from([0xc0, 0xaf]));
  assert.ok(codes(await captureBlueprint(await createBlueprintGrant(entry), context)).includes('UTF8_INVALID'));
  writeFileSync(entry, Buffer.alloc(1024 * 1024 + 1, 32));
  assert.ok(codes(await captureBlueprint(await createBlueprintGrant(entry), context)).includes('LIMIT_EXCEEDED'));
  const text = '\uFEFF' + project().replaceAll('\n', '\r\n'); writeFileSync(entry, text);
  const grant = await createBlueprintGrant(entry);
  const captured = await captureBlueprint(grant, context);
  assert.equal(captured.documents[0].text, text);
  assert.equal(captured.documents[0].byteLength, Buffer.byteLength(text));
  renameSync(root, join(dir, 'original-root')); mkdirSync(root); writeFileSync(entry, project());
  const replaced = await captureBlueprint(grant, context);
  assert.ok(codes(replaced).includes('SOURCE_CHANGED'));
  assert.equal(replaced.documents[0].status, 'unavailable');
});

test('session refresh is explicit, tokens expire, native chooser cancel preserves capture, late picks cannot revive cancel', async t => {
  const dir = temporaryDirectory(t); const entry = join(dir, 'project.md'); writeFileSync(entry, project());
  let choice = entry;
  const service = new BlueprintPreviewSession(async () => choice, () => []);
  const first = await service.choose();
  assert.equal(first.kind, 'snapshot');
  choice = null; assert.equal((await service.choose()).kind, 'cancelled');
  writeFileSync(entry, project() + block({ ptb: '0.2', kind: 'component', id: 'cmp.new', project: 'proj.capture', title: 'New' }));
  assert.equal(first.snapshot.records.length, 1);
  const second = await service.refresh({ sessionId: first.snapshot.sessionId });
  assert.equal(second.snapshot.records.length, 2);
  assert.notEqual(first.snapshot.snapshotId, second.snapshot.snapshotId);
  service.cancel(); service.cancel();
  await assert.rejects(service.refresh({ sessionId: first.snapshot.sessionId }), { code: 'NOT_FOUND' });
  await assert.rejects(service.choose({ path: entry }), { code: 'VALIDATION' });
  await assert.rejects(service.refresh({ sessionId: 'x', path: entry }), { code: 'VALIDATION' });
  let finish;
  const late = new BlueprintPreviewSession(() => new Promise(resolve => { finish = resolve; }), () => []);
  const pending = late.choose();
  late.cancel(); finish(entry);
  assert.deepEqual(await pending, { kind: 'cancelled' });
});

test('preview/select/refresh/cancel leave populated schema-v4 tables and engineering history unchanged', async t => {
  let db, store;
  const dir = temporaryDirectory(t, () => { db?.close(); store?.close(); }); const filename = join(dir, 'workspace.sqlite');
  store = await openStore(filename);
  const p = store.createProject({ name: 'Existing project' });
  store.addAction({ projectId: p.id, title: 'Keep existing work' });
  store.saveCheckpoint({ projectId: p.id, accomplished: 'Saved context', nextSteps: 'Resume later' });
  db = new DatabaseSync(filename);
  const dump = () => db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all().map(({ name }) => [name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`).all()]);
  const before = dump(); const version = db.prepare('PRAGMA user_version').get();
  const service = new BlueprintPreviewSession(async () => resolve('docs/design/examples/ptb-v0.2/small/project.md'), () => []);
  const result = await service.choose(); await service.refresh({ sessionId: result.snapshot.sessionId }); service.cancel();
  assert.deepEqual(dump(), before);
  assert.deepEqual(db.prepare('PRAGMA user_version').get(), version);
  assert.equal(version.user_version, 4);
  assert.equal(store.openProject({ projectId: p.id }).resume.nextSteps, 'Resume later');
});

test('an observed replacement during handle reading cannot publish a valid source graph', async t => {
  const dir = temporaryDirectory(t); const entry = join(dir, 'project.md'); writeFileSync(entry, project());
  const originalOpen = fsPromises.open;
  let changed = false;
  t.mock.method(fsPromises, 'open', async (...args) => {
    const handle = await originalOpen(...args);
    if (args[0] === entry) {
      const originalRead = handle.read.bind(handle);
      handle.read = async (...readArgs) => {
        const result = await originalRead(...readArgs);
        if (!changed) { changed = true; appendFileSync(entry, '\nChanged during capture'); }
        return result;
      };
    }
    return handle;
  });
  const snapshot = await captureBlueprint(await createBlueprintGrant(entry), context);
  assert.equal(changed, true);
  assert.ok(codes(snapshot).includes('SOURCE_CHANGED'));
  assert.equal(snapshot.validation, 'invalid');
  assert.equal(snapshot.semanticSha256, null);
});

test('aggregate source bytes remain bounded and nested documents are captured', async t => {
  const dir = temporaryDirectory(t); mkdirSync(join(dir, 'nested'));
  const names = Array.from({ length: 12 }, (_, i) => `nested/doc-${i}.md`);
  for (const name of names) writeFileSync(join(dir, name), ' '.repeat(900 * 1024));
  const entry = join(dir, 'project.md'); writeFileSync(entry, project(names));
  const snapshot = await captureBlueprint(await createBlueprintGrant(entry), context);
  assert.ok(codes(snapshot).includes('LIMIT_EXCEEDED'));
  assert.ok(snapshot.documents.some(doc => doc.relativePath === names[0] && doc.status === 'captured'));
  assert.ok(snapshot.documents.reduce((sum, doc) => sum + (doc.byteLength ?? 0), 0) <= 10 * 1024 * 1024);
});
