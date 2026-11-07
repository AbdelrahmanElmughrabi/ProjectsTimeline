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
