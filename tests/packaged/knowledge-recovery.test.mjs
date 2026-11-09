import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { temporaryDirectory } from '../helpers.mjs';
import { launchWorkspace } from '../electron-flow.mjs';

test('packaged FieldLedger formation survives source removal, full restart and receipt replay', { timeout: 120000 }, async t => {
  const executable = resolve(process.env.PROJECTS_TIMELINE_EXECUTABLE ?? 'out/ProjectsTimeline-win32-x64/ProjectsTimeline.exe');
  assert.ok(existsSync(executable), 'Build the Windows package first or set PROJECTS_TIMELINE_EXECUTABLE.');
  let application;
  const directory = join(temporaryDirectory(t, () => application?.close()), 'profile');
  const fixture = join(directory, 'FieldLedger source');
  const movedFixture = join(directory, 'moved FieldLedger source');
  mkdirSync(directory, { recursive: true });
  cpSync(resolve('docs/design/examples/ptb-v0.2/complex'), fixture, { recursive: true });
  const sourceFiles = Object.fromEntries(['project.md', 'domain.md', 'work.md', 'assurance.md'].map(name => [name, readFileSync(join(fixture, name), 'utf8')]));
  application = await launchWorkspace(directory, executable);
  let page = await application.firstWindow();
  const runtime = await application.evaluate(({ app, BrowserWindow }) => {
    const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();
    return { packaged: app.isPackaged, appPath: app.getAppPath(), sandbox: preferences.sandbox, contextIsolation: preferences.contextIsolation, nodeIntegration: preferences.nodeIntegration };
  });
  assert.equal(runtime.packaged, true);
  assert.match(runtime.appPath, /\.asar$/);
  const compiledPaths = ['dist/renderer/index.html', 'dist/main/data/migrations/004_durable_knowledge.sql',
    ...readdirSync(resolve('dist/renderer/assets')).sort().map(name => `dist/renderer/assets/${name}`)];
  const bundledHashes = await application.evaluate(({ app }, files) => {
    const { readFileSync } = process.getBuiltinModule('fs');
    const { join } = process.getBuiltinModule('path');
    const { createHash } = process.getBuiltinModule('crypto');
    return files.map(file => createHash('sha256').update(readFileSync(join(app.getAppPath(), file))).digest('hex'));
  }, compiledPaths);
  assert.deepEqual(bundledHashes, compiledPaths.map(file => createHash('sha256').update(readFileSync(resolve(file))).digest('hex')));
  assert.deepEqual({ sandbox: runtime.sandbox, contextIsolation: runtime.contextIsolation, nodeIntegration: runtime.nodeIntegration }, { sandbox: true, contextIsolation: true, nodeIntegration: false });
  assert.deepEqual(await page.evaluate(() => [typeof window.require, typeof window.process]), ['undefined', 'undefined']);

  await application.evaluate(({ dialog }, entry) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [entry] });
  }, join(fixture, 'project.md'));
  await page.getByRole('button', { name: 'Preview blueprint', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Blueprint Preview', exact: true });
  await preview.getByRole('heading', { name: 'FieldLedger', exact: true }).waitFor();
  await page.getByLabel('New knowledge project', { exact: true }).fill('FieldLedger');
  await page.getByRole('button', { name: /Review project formation/ }).click();
  await page.getByRole('heading', { name: 'Review new knowledge project', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Create knowledge project', exact: true }).click();
  const map = page.getByRole('region', { name: 'Connected knowledge map', exact: true });
  await map.waitFor();
  await page.getByRole('heading', { name: 'FieldLedger', exact: true }).waitFor();

  const initial = await page.evaluate(async () => {
    const value = result => { if (!result.ok) throw new Error(result.error.message); return result.value; };
    const list = value(await window.workspace.listProjects());
    const project = list.find(item => item.name === 'FieldLedger');
    const graph = value(await window.workspace.openKnowledgeWorkspace({ projectId: project.id }));
    const legacy = value(await window.workspace.openProject({ projectId: project.id }));
    const root = value(await window.workspace.getKnowledgeRecord({ projectId: project.id, entityId: graph.rootEntityId }));
    const primary = graph.links.find(link => link.relation === 'primary-component');
    const targets = [
      { kind: 'record', entityId: root.entityId, revision: root.revision, part: 'metadata' },
      { kind: 'record', entityId: root.entityId, revision: root.revision, part: 'narrative' },
      { kind: 'relationship', relationshipId: primary.relationshipId },
    ];
    const sources = [];
    for (const target of targets) sources.push(value(await window.workspace.getKnowledgeSource({ projectId: project.id, target })));
    return { graph, legacy, sources };
  });
  assert.equal(initial.graph.nodes.length, 37);
  assert.equal(initial.graph.links.length, 82);
  assert.ok(initial.graph.nodes.some(node => node.kind === 'component' && node.externalId === 'cmp.desktop'));
  assert.equal(initial.legacy.actions.length, 0);
  assert.equal(initial.legacy.releases.length, 0);
  for (const source of initial.sources) {
    const expected = sourceFiles[source.document.relativePath];
    assert.ok(expected, `Unexpected source file ${source.document.relativePath}`);
    assert.equal(source.document.text, expected);
    assert.equal(source.document.byteLength, Buffer.byteLength(expected));
    assert.equal(source.document.sha256, createHash('sha256').update(Buffer.from(expected, 'utf8')).digest('hex'));
    assert.ok(source.selection);
    assert.equal(source.document.text.slice(source.selection.span.start.utf16Offset, source.selection.span.end.utf16Offset),
      expected.slice(source.selection.span.start.utf16Offset, source.selection.span.end.utf16Offset));
  }

  const database = join(directory, 'data', 'workspace.sqlite');
  const beforeClose = new DatabaseSync(database);
  const durable = beforeClose.prepare('SELECT id, review_digest, project_id FROM knowledge_imports').get();
  assert.equal(beforeClose.prepare('PRAGMA user_version').get().user_version, 4);
  assert.equal(beforeClose.prepare('SELECT COUNT(*) AS n FROM actions WHERE project_id=?').get(durable.project_id).n, 0);
  assert.equal(beforeClose.prepare('SELECT COUNT(*) AS n FROM action_events WHERE project_id=? AND description=?').get(durable.project_id, 'Created knowledge project from reviewed blueprint').n, 1);
  beforeClose.close();

  await application.close();
  application = undefined;
  renameSync(fixture, movedFixture);
  application = await launchWorkspace(directory, executable);
  page = await application.firstWindow();
  await page.getByRole('region', { name: 'Home', exact: true }).getByRole('button', { name: 'Open project FieldLedger', exact: true }).click();
  await page.getByRole('region', { name: 'Connected knowledge map', exact: true }).waitFor();
  const recovered = await page.evaluate(async projectId => {
    const value = result => { if (!result.ok) throw new Error(result.error.message); return result.value; };
    const graph = value(await window.workspace.openKnowledgeWorkspace({ projectId }));
    const root = value(await window.workspace.getKnowledgeRecord({ projectId, entityId: graph.rootEntityId }));
    const primary = graph.links.find(link => link.relation === 'primary-component');
    const targets = [
      { kind: 'record', entityId: root.entityId, revision: root.revision, part: 'metadata' },
      { kind: 'record', entityId: root.entityId, revision: root.revision, part: 'narrative' },
      { kind: 'relationship', relationshipId: primary.relationshipId },
    ];
    const sources = [];
    for (const target of targets) sources.push(value(await window.workspace.getKnowledgeSource({ projectId, target })));
    const legacy = value(await window.workspace.openProject({ projectId }));
    return { graph, legacy, sources };
  }, durable.project_id);
  const keyDb = new DatabaseSync(database);
  const key = keyDb.prepare('SELECT id, review_digest FROM knowledge_imports WHERE project_id=?').get(durable.project_id);
  keyDb.close();
  const replay = await page.evaluate(async ({ operationId, reviewDigest }) => window.workspace.applyKnowledgeFormation({ operationId, reviewDigest }), {
    operationId: key.id, reviewDigest: key.review_digest,
  });
  assert.ok(replay.ok, replay.error?.message);
  assert.equal(replay.value.replayed, true);
  assert.deepEqual(replay.value.receipt, initial.graph.receipt);
  assert.deepEqual(recovered.graph.nodes, initial.graph.nodes);
  assert.deepEqual(recovered.graph.links, initial.graph.links);
  assert.deepEqual(recovered.graph.receipt, initial.graph.receipt);
  assert.deepEqual(recovered.sources, initial.sources);
  assert.equal(recovered.legacy.actions.length, 0);
  assert.equal(recovered.legacy.releases.length, 0);
  assert.equal(existsSync(fixture), false);
  assert.equal(existsSync(movedFixture), true);
  assert.equal(new URL(page.url()).protocol, 'app:');
  const rendererPreferences = await application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences());
  assert.equal(rendererPreferences.nodeIntegration, false);

  const artifact = resolve('artifacts/v3a1a/packaged-recovery.png');
  mkdirSync(resolve('artifacts/v3a1a'), { recursive: true });
  await page.screenshot({ path: artifact, fullPage: true, animations: 'disabled' });
});
