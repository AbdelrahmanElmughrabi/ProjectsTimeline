// Design fixture only: reuse the shipped parser; never execute the source project.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createBlueprintGrant, captureBlueprint } from '../../../dist/main/blueprint/acquisition.js';

assert.ok(process.argv[2], 'Pass the absolute Vivarium single/project.md path.');
const snapshot = await captureBlueprint(await createBlueprintGrant(process.argv[2]), {
  sessionId: 'isolated-design-capture', snapshotId: 'vivarium-design',
  capturedAt: new Date().toISOString(), releaseWorkflowKeys: [],
});
assert.equal(snapshot.validation, 'valid');
assert.equal(snapshot.records.length, 47);
assert.equal(snapshot.relationships.length, 86);
const records = snapshot.records.map(occ => {
  assert.equal(occ.state, 'record');
  return { ...occ.record, occurrenceKey: occ.key, narrative: occ.narrativeMarkdown, source: occ.metadataSource,
    narrativeSource: occ.narrativeSource };
});
// No absolute grant paths, live session authority or application state is embedded.
await writeFile(new URL('./vivarium.json', import.meta.url), JSON.stringify({
  description: 'Real Vivarium PTB definitions. Operational state is simulated separately.',
  semanticSha256: snapshot.semanticSha256, documents: snapshot.documents,
  records, relationships: snapshot.relationships,
}, null, 2) + '\n');
console.log('Captured 47 definitions / 86 explicit typed links, exact source and anchors; no DB writes.');
