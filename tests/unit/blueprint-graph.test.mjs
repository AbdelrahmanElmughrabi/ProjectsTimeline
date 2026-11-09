import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { parsePreviewDocument } from '../../dist/main/blueprint/parser.js';
import { buildPreviewSnapshot } from '../../dist/main/blueprint/graph.js';

const context = { sessionId: 'session', snapshotId: 'snapshot', capturedAt: '2026-11-06T00:00:00Z', releaseWorkflowKeys: [] };
function document(id, text, order = 0) {
  return { id, relativePath: `${id}.md`, order, status: 'captured', text, sha256: null, byteLength: Buffer.byteLength(text), headings: [] };
}
async function parseText(text, id = 'doc') { return parsePreviewDocument(document(id, text)); }
async function snapshot(text, ctx = context) { const p = await parseText(text); return buildPreviewSnapshot([p], [], ctx); }
function ptb(...records) { const fence = String.fromCharCode(96).repeat(3); return records.map(r => `${fence}ptb\n${JSON.stringify(r)}\n${fence}\nNarrative\n`).join('\n'); }
const project = (extra = {}) => ({ ptb: '0.2', kind: 'project', id: 'proj.test', title: 'Test project', ...extra });
const feature = (id, extra = {}) => ({ ptb: '0.2', kind: 'feature', id, title: id, project: 'proj.test', ...extra });
const component = (id, extra = {}) => ({ ptb: '0.2', kind: 'component', id, title: id, project: 'proj.test', ...extra });
const requirement = (id, extra = {}) => ({ ptb: '0.2', kind: 'requirement', id, title: id, project: 'proj.test', type: 'functional', ...extra });
const scope = (id, workflow = null, extra = {}) => ({ ptb: '0.2', kind: 'scope', id, title: id, project: 'proj.test', ...(workflow ? { workflow } : {}), ...extra });
const action = (id, extra = {}) => ({ ptb: '0.2', kind: 'action', id, title: id, project: 'proj.test', ...extra });

test('real PTB fixtures resolve their declared relationship graphs', async () => {
  const root = new URL('../../docs/design/examples/ptb-v0.2/', import.meta.url);
  const examples = [
    { folder: 'small', files: ['project.md'], links: 29, records: 15 },
    { folder: 'complex', files: ['project.md', 'domain.md', 'work.md', 'assurance.md'], links: 82, records: 37 },
  ];
  for (const fixture of examples) {
    const parsed = [];
    for (let i = 0; i < fixture.files.length; i++) {
      const text = await readFile(new URL(`${fixture.folder}/${fixture.files[i]}`, root), 'utf8');
      parsed.push(await parsePreviewDocument(document(`${fixture.folder}-${i}`, text, i)));
    }
    const result = buildPreviewSnapshot(parsed, [], context);
    assert.equal(result.counts.occurrences, fixture.records);
    assert.equal(result.relationships.length, fixture.links);
    assert.ok(result.relationships.every(link => link.status === 'resolved'));
    assert.equal(result.validation, 'valid');
    assert.equal(result.counts.errors, 0);
    assert.equal(result.projectKey, result.records.find(o => o.state === 'record' && o.record.kind === 'project').key);
  }
});

test('duplicate IDs keep every occurrence and make matching links ambiguous', async () => {
  const result = await snapshot(ptb(project(), feature('feat.same'), feature('feat.same'), requirement('req.one', { features: ['feat.same'] })));
  const duplicate = result.diagnostics.find(d => d.code === 'DUPLICATE_ID');
  assert.equal(duplicate.recordKeys.length, 2);
  assert.equal(duplicate.relatedSources.length, 2);
  assert.equal(result.relationships.find(e => e.targetId === 'feat.same').status, 'ambiguous');
  assert.equal(result.relationships.find(e => e.targetId === 'feat.same').targetKeys.length, 2);
  assert.equal(result.semanticSha256, null);
  assert.equal(result.records.filter(r => r.state === 'record' && r.record.id === 'feat.same').length, 2);
});

test('typed links report wrong-kind, wrong-project and missing targets', async () => {
  const result = await snapshot(ptb(project(), feature('feat.other', { project: 'proj.somewhere' }), requirement('req.one', { features: ['req.one', 'feat.missing'] })));
  assert.deepEqual(result.relationships.map(e => e.status), ['wrong-kind', 'missing']);
  assert.ok(result.diagnostics.some(d => d.code === 'PROJECT_OWNER'));
  assert.ok(result.diagnostics.some(d => d.code === 'LINK_TARGET'));
});

test('repeated typed links and stages without a scope workflow block the snapshot', async () => {
  const result = await snapshot(ptb(project(), feature('feat.a'), requirement('req.a', { features: ['feat.a', 'feat.a'] }),
    scope('scope.none'), action('act.a', { scope: 'scope.none', stage: 'build' })));
  assert.ok(result.diagnostics.some(d => d.code === 'DUPLICATE_LINK' && d.relatedSources.length === 2));
  assert.equal(result.diagnostics.filter(d => d.code === 'STAGE_TARGET').length, 1);
  assert.equal(result.assignments[0].status, 'invalid');
  assert.equal(result.semanticSha256, null);
});

test('decision feature references use the affects-feature relationship', async () => {
  const result = await snapshot(ptb(project(), feature('feat.a'), { ptb: '0.2', kind: 'decision', id: 'dec.a', title: 'Decision', project: 'proj.test', features: ['feat.a'], requirements: [] }));
  assert.equal(result.relationships[0].relation, 'affects-feature');
});

test('outline uses global document order and keeps unplaced features out of rows', async () => {
  const first = await parseText(ptb(project(), component('cmp.root'), component('cmp.first', { parent: 'cmp.root' })), 'first');
  const second = await parseText(ptb(component('cmp.second', { parent: 'cmp.root' }), feature('feat.unplaced'), feature('feat.dangling', { component: 'cmp.missing' })), 'second');
  const result = buildPreviewSnapshot([first, second], [], context);
  assert.deepEqual(result.structure.rows.map(r => r.recordKey), ['first:b1', 'first:b2', 'second:b0']);
  assert.deepEqual(result.structure.unplacedFeatureKeys, ['second:b1']);
  assert.ok(!result.structure.rows.some(r => r.recordKey === 'second:b1'));
  assert.deepEqual(result.structure.invalidStructureKeys, ['second:b2']);
});

test('component cycles and depth overflow are errors and excluded from the outline', async () => {
  const cycle = await snapshot(ptb(project(), component('cmp.a', { parent: 'cmp.b' }), component('cmp.b', { parent: 'cmp.a' }), feature('feat.a', { component: 'cmp.a' })));
  assert.ok(cycle.diagnostics.some(d => d.code === 'COMPONENT_CYCLE'));
  assert.ok(cycle.structure.invalidStructureKeys.includes('doc:b1'));
  assert.equal(cycle.structure.rows.length, 0);
  const chain = [project(), ...Array.from({ length: 17 }, (_, i) => component(`cmp.c${i}`, i ? { parent: `cmp.c${i - 1}` } : {}) )];
  const deep = await snapshot(ptb(...chain));
  assert.ok(deep.diagnostics.some(d => d.code === 'COMPONENT_CYCLE'));
  assert.ok(deep.structure.invalidStructureKeys.length >= 1);
});

test('workflow references resolve as review and inline stage assignments stay scope-local', async () => {
  const text = ptb(project(), scope('scope.known', { template_key: 'release', version: 2 }), scope('scope.unknown', { template_key: 'dev', version: 1 }),
    scope('scope.inline', { stages: [{ key: 'build', title: 'Build' }, { key: 'check', title: 'Check' }] }),
    action('act.a', { scope: 'scope.known', stage: 'x' }), action('act.b', { scope: 'scope.unknown', stage: 'x' }), action('act.c', { scope: 'scope.inline', stage: 'build' }));
  const result = await snapshot(text, { ...context, releaseWorkflowKeys: [{ key: 'release', version: 2 }] });
  assert.deepEqual(result.workflows.map(w => w.status), ['incompatible', 'unresolved', 'inline']);
  assert.deepEqual(result.assignments.map(a => a.status), ['unresolved-workflow', 'unresolved-workflow', 'resolved']);
  assert.deepEqual(result.diagnostics.filter(d => d.severity === 'resolution').map(d => d.code).sort(), ['WORKFLOW_PURPOSE', 'WORKFLOW_UNRESOLVED']);
  assert.equal(result.validation, 'needs-review');
});

test('semantic hash ignores packaging and occurrence order but preserves authored stage order', async () => {
  const one = await snapshot(ptb(project({ documents: ['a.md'] }), feature('feat.a'), requirement('req.a', { features: ['feat.a'], acceptance: ['one', 'two'] }),
    scope('scope.a', { stages: [{ key: 'design', title: 'Design' }, { key: 'build', title: 'Build' }] })));
  const p1 = await parseText(ptb(project({ documents: ['renamed.md'] })), 'renamed-project');
  const p2 = await parseText(ptb(scope('scope.a', { stages: [{ key: 'design', title: 'Design' }, { key: 'build', title: 'Build' }] }),
    requirement('req.a', { features: ['feat.a'], acceptance: ['one', 'two'] }), feature('feat.a')), 'moved-records');
  const repackaged = buildPreviewSnapshot([p1, p2], [], context);
  assert.equal(one.semanticSha256, repackaged.semanticSha256);
  const reordered = await snapshot(ptb(project(), feature('feat.a'), requirement('req.a', { features: ['feat.a'], acceptance: ['one', 'two'] }),
    scope('scope.a', { stages: [{ key: 'build', title: 'Build' }, { key: 'design', title: 'Design' }] })));
  assert.notEqual(one.semanticSha256, reordered.semanticSha256);
});

test('builder does not mutate parser output', async () => {
  const parsed = await parseText(ptb(project(), scope('scope.x'), action('act.x', { scope: 'scope.x' })));
  const before = structuredClone(parsed);
  buildPreviewSnapshot([parsed], [], context);
  assert.deepEqual(parsed, before);
});

test('edge cap bounds hostile unresolved graphs and large blank narrative trims in linear time', async t => {
  const requirements = Array.from({ length: 100 }, (_, i) => `req.missing${i}`);
  const text = ptb(project(), ...Array.from({ length: 201 }, (_, i) => action(`act.a${i}`, { requirements, definition_of_done: 'Observable result' })));
  const start = performance.now();
  const result = await snapshot(text);
  assert.equal(result.relationships.length, 20000);
  assert.ok(result.diagnostics.some(d => d.code === 'LIMIT_EXCEEDED'));
  assert.equal(result.validation, 'invalid');
  assert.equal(result.semanticSha256, null);
  const parsed = await parseText(ptb(project()) + '\n'.repeat(100000));
  assert.ok(buildPreviewSnapshot([parsed], [], context).semanticSha256);
  const elapsed = performance.now() - start;
  t.diagnostic(`Bounded 20,000-edge graph + long narrative: ${Math.round(elapsed)}ms`);
  assert.ok(elapsed < 10000, 'Bounded preview should remain responsive');
});
