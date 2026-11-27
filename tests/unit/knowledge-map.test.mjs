import assert from 'node:assert/strict';
import test from 'node:test';
import { projectKnowledgeMap } from '../../dist/shared/knowledge-map.js';

const node = (entityId, kind, title = `Node ${entityId}`) => ({ entityId, kind, title, externalId: `external-${entityId}`, revision: 1, presentationOrder: entityId, origin: { sourceBindingId: 1, importId: 'import', occurrenceKey: `occ-${entityId}` } });
const link = (relationshipId, fromEntityId, toEntityId, relation) => ({ relationshipId, fromEntityId, fromRevision: 1, toEntityId, relation });
function workspace(nodes, links) {
  return { project: { id: 1, name: 'Test', createdAt: '' }, rootEntityId: 1, goal: '', counts: {}, receipt: { importId: 'import' }, documents: [], review: { importId: 'import', diagnostics: [], needsReviewScopeEntityIds: [] }, nodes, links };
}

test('initial atlas uses top level components and actual primary component edges only', () => {
  const data = workspace([
    node(1, 'project'), node(2, 'component'), node(3, 'component'), node(4, 'feature'), node(5, 'requirement'), node(6, 'feature'),
  ], [link(1, 3, 2, 'parent-component'), link(2, 4, 2, 'primary-component'), link(3, 5, 4, 'applies-to-feature'), link(4, 5, 6, 'applies-to-feature')]);
  const map = projectKnowledgeMap(data);
  assert.deepEqual(map.nodes.map((item) => item.entityId), [2, 4, 6]);
  assert.deepEqual(map.links.map((item) => item.relationshipId), [2]);
  const expanded = projectKnowledgeMap(data, new Set([4]));
  assert.deepEqual(new Set(expanded.nodes.map((item) => item.entityId)), new Set([2, 4, 5, 6]));
  assert.equal(expanded.links.find((item) => item.relationshipId === 3)?.relation, 'applies-to-feature');
  const requirementNeighborhood = projectKnowledgeMap(data, new Set([5]));
  assert.deepEqual(new Set(requirementNeighborhood.nodes.map((item) => item.entityId)), new Set([2, 4, 5, 6]));
});

test('projection is bounded and keeps an explicitly revealed record visible', () => {
  const nodes = Array.from({ length: 55 }, (_, i) => node(i + 1, 'component'));
  const links = Array.from({ length: 90 }, (_, i) => link(i + 1, i + 1, i + 2, 'parent-component'));
  const map = projectKnowledgeMap(workspace(nodes, links), new Set(nodes.map((item) => item.entityId)), 55);
  assert.equal(map.nodes.length, 40);
  assert.equal(map.links.length <= 80, true);
  assert.equal(map.nodes.some((item) => item.entityId === 55), true);
  assert.equal(map.hiddenCount, 15);
});

test('deliberate neighborhood excludes unrelated atlas nodes and preserves native relation identity', () => {
  const data=workspace([node(1,'project'),node(2,'component'),node(3,'component'),node(4,'feature'),node(5,'requirement')],
    [link(1,4,2,'primary-component'),link(2,5,4,'applies-to-feature')]);
  const context=projectKnowledgeMap(data,new Set([4]),null,4);
  assert.deepEqual(context.nodes.map(n=>n.entityId),[2,4,5]);assert.deepEqual(context.links,data.links);
  assert.equal(context.nodes.some(n=>n.entityId===3),false);
  assert.deepEqual(projectKnowledgeMap(data).nodes.map(n=>n.entityId),[2,3,4]);
});

test('unplaced features are visible without a fabricated component or relationship',()=>{
  const map=projectKnowledgeMap(workspace([node(1,'project'),node(2,'feature')],[]));
  assert.deepEqual(map.nodes.map(n=>n.entityId),[2]);assert.deepEqual(map.links,[]);
});

test('expansion at the 40-card cap protects selected, anchor and explicit neighbor plus authored link', () => {
  const nodes = [node(1, 'component'), node(46, 'feature'),
    ...Array.from({ length: 44 }, (_, i) => node(i + 2, 'component')), node(47, 'requirement')];
  const links = [link(1, 46, 1, 'primary-component'), link(900, 47, 46, 'applies-to-feature')];
  const data = workspace(nodes, links);
  const atlas = projectKnowledgeMap(data);
  assert.equal(atlas.nodes.length, 40);
  assert.equal(atlas.nodes.some(n => n.entityId === 47), false);
  const previousVisibleIds = new Set(atlas.nodes.map(n => n.entityId));
  const priorities = { selectedEntityId: 2, expandedEntityId: 46, newNeighborEntityId: 47, previousVisibleIds };
  const expanded = projectKnowledgeMap(data, new Set([46]), null, null, priorities);
  assert.deepEqual([expanded.nodes.length, expanded.hiddenCount], [40, 7]);
  for (const id of [2, 46, 47]) assert.equal(expanded.nodes.some(n => n.entityId === id), true, `missing protected ID ${id}`);
  assert.equal(expanded.links.find(l => l.relationshipId === 900), links[1], 'original authored edge identity and direction');
  assert.equal(atlas.nodes.filter(n => expanded.nodes.some(m => m.entityId === n.entityId)).length, 39, 'evict only one old card');
  assert.deepEqual(projectKnowledgeMap(data, new Set([46]), null, null, priorities), expanded);
  const beforeNeighborhood = projectKnowledgeMap(data, new Set(nodes.filter(n => n.kind === 'component').map(n => n.entityId)), null, 3);
  const neighborhood = projectKnowledgeMap(data,
    new Set([...nodes.filter(n => n.kind === 'component').map(n => n.entityId), 46]), null, 3,
    { ...priorities, previousVisibleIds: new Set(beforeNeighborhood.nodes.map(n => n.entityId)) });
  for (const id of [2, 3, 46, 47]) assert.equal(neighborhood.nodes.some(n => n.entityId === id), true, `missing anchored ID ${id}`);
  assert.equal(neighborhood.links.some(l => l.relationshipId === 900), true);
  assert.deepEqual(projectKnowledgeMap(data), atlas, 'collapse restores the original atlas');
});

test('at a full canvas, expansion with no hidden direct neighbors does not evict context', () => {
  const nodes = [node(1, 'component'), node(46, 'feature'),
    ...Array.from({ length: 44 }, (_, i) => node(i + 2, 'component')), node(47, 'requirement')];
  const data = workspace(nodes, [link(1, 46, 1, 'primary-component'), link(900, 47, 46, 'applies-to-feature')]);
  const before = projectKnowledgeMap(data);
  assert.equal(before.nodes.length, 40);
  assert.equal(before.nodes.some(n => n.entityId === 46), true, 'the only direct neighbor of component 1 is visible');
  const after = projectKnowledgeMap(data, new Set([1]), null, null,
    { expandedEntityId: 1, previousVisibleIds: new Set(before.nodes.map(n => n.entityId)) });
  assert.deepEqual(after, before, 'do not evict unrelated cards just to simulate an expansion');
});

test('the 80-edge cap really truncates eligible authored links and prioritizes the focused late relationship', () => {
  const nodes = [...Array.from({ length: 10 }, (_, i) => node(i + 1, 'component')),
    ...Array.from({ length: 10 }, (_, i) => node(i + 11, 'feature')),
    ...Array.from({ length: 30 }, (_, i) => node(i + 21, 'requirement'))];
  const links = Array.from({ length: 10 }, (_, i) => link(i + 1, i + 11, i + 1, 'primary-component'));
  for (let req = 21; req <= 50; req++) for (let feature = 11; feature <= 20; feature++)
    links.push(link(links.length + 1, req, feature, 'applies-to-feature'));
  const data = workspace(nodes, links);
  const expanded = new Set(nodes.filter(n => n.kind !== 'component').map(n => n.entityId));
  const priorities = { selectedEntityId: 50, expandedEntityId: 49, focusedRelationshipId: 310 };
  const projected = projectKnowledgeMap(data, expanded, null, 3, priorities);
  const visible = new Set(projected.nodes.map(n => n.entityId));
  const eligible = links.filter(l => visible.has(l.fromEntityId) && visible.has(l.toEntityId));
  assert.equal(nodes.length > 40, true);
  assert.equal(eligible.length > 80, true, `actually eligible: ${eligible.length}`);
  assert.deepEqual([projected.nodes.length, projected.links.length], [40, 80]);
  assert.equal(visible.has(50) && visible.has(3) && visible.has(49), true);
  assert.equal(projected.links.find(l => l.relationshipId === 310), links[309], 'original late authored edge survives');
  assert.equal(projected.links.every(l => visible.has(l.fromEntityId) && visible.has(l.toEntityId)), true);
  assert.deepEqual(projectKnowledgeMap(data, expanded, null, 3, priorities), projected);
});

test('stale or unexpanded expansion priority neither forces hidden nodes nor reduces the 80-edge budget', () => {
  const nodes = [
    ...Array.from({ length: 10 }, (_, i) => node(i + 1, 'component')),
    ...Array.from({ length: 10 }, (_, i) => node(i + 11, 'feature')),
    ...Array.from({ length: 30 }, (_, i) => node(i + 21, 'requirement')),
    node(51, 'requirement'),
    node(52, 'requirement'),
  ];
  const links = Array.from({ length: 10 }, (_, i) => link(i + 1, i + 11, i + 1, 'primary-component'));
  for (let req = 21; req <= 50; req++) for (let feature = 11; feature <= 20; feature++)
    links.push(link(links.length + 1, req, feature, 'applies-to-feature'));
  links.push(link(999, 51, 52, 'addresses-requirement'));
  const data = workspace(nodes, links);
  const expanded = new Set(nodes.filter(n => n.kind !== 'component' && n.entityId <= 50).map(n => n.entityId));
  const projected = projectKnowledgeMap(data, expanded, null, 3, { expandedEntityId: 51, newNeighborEntityId: 52 });
  const visible = new Set(projected.nodes.map(n => n.entityId));
  assert.equal(projected.nodes.length, 40);
  assert.equal(visible.has(51) || visible.has(52), false);
  assert.equal(projected.links.some(l => l.relationshipId === 999), false);
  assert.equal(projected.links.length, 80);
});
