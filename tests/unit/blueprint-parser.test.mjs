import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { parsePreviewDocument } from '../../dist/main/blueprint/parser.js';

function doc(text, id = 'fixture') {
  return { id, relativePath: 'project.md', order: 0, status: 'captured', text, sha256: null, byteLength: Buffer.byteLength(text), headings: [] };
}
const block = (json, fence = '```') => `${fence}ptb\n${json}\n${fence}`;

test('parses the small real PTB fixture with normalized records and narrative spans', async () => {
  const text = await readFile('docs/design/examples/ptb-v0.2/small/project.md', 'utf8');
  const parsed = await parsePreviewDocument(doc(text, 'small'));
  assert.equal(parsed.records.length, 15);
  assert.equal(parsed.records[0].record.kind, 'project');
  assert.equal(parsed.records.find((r) => r.state === 'record' && r.record.id === 'req.notes-restart').record.kind, 'requirement');
  assert.ok(parsed.records.some((r) => r.narrativeMarkdown.includes('A solo developer needs a small desktop scratchpad')));
  assert.ok(parsed.fields.get('small:b0').has('/title'));
});

test('parses all four complex fixture documents without losing records', async () => {
  const paths = ['project.md', 'domain.md', 'work.md', 'assurance.md'];
  let count = 0;
  for (const path of paths) {
    const text = await readFile(`docs/design/examples/ptb-v0.2/complex/${path}`, 'utf8');
    const result = await parsePreviewDocument(doc(text, path));
    count += result.records.length;
  }
  assert.equal(count, 37);
});

test('strict JSON rejects escaped duplicate keys, comments, trailing commas, and excess depth', async () => {
  for (const json of [
    '{"ptb":"0.2","kind":"project","id":"proj.x","title":"x","title":"y"}',
    '{"ptb":"0.2","kind":"project","id":"proj.x","title":"x","ti\\u0074le":"y"}',
    '{/*comment*/"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}',
    '{"ptb":"0.2","kind":"project","id":"proj.x","title":"x",}',
  ]) {
    const out = await parsePreviewDocument(doc(block(json)));
    assert.equal(out.records[0].state, 'invalid-record');
    assert.ok(['DUPLICATE_KEY', 'JSON_SYNTAX'].includes(out.diagnostics[0].code));
  }
  const deep = '{"ptb":"0.2","kind":"project","id":"proj.x","title":"x","x":' + '['.repeat(17) + '0' + ']'.repeat(17) + '}';
  assert.equal((await parsePreviewDocument(doc(block(deep)))).diagnostics[0].code, 'JSON_SYNTAX');
  const duplicate = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"project","id":"proj.x","title":"x","nested":{"n":1,"\\u006e":2}}')));
  const duplicateDiagnostic = duplicate.diagnostics.find((d) => d.code === 'DUPLICATE_KEY');
  assert.equal(duplicateDiagnostic.relatedSources.length, 1);
  assert.equal(duplicateDiagnostic.source.span.start.utf16Offset > duplicateDiagnostic.relatedSources[0].span.start.utf16Offset, true);
});

test('only root literal PTB fences parse; unclosed PTB fence stays invalid', async () => {
  const outer = '````md\n```ptb\n{"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}\n```\n````';
  assert.equal((await parsePreviewDocument(doc(outer))).records.length, 0);
  const quoted = '> ```ptb\n> {"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}\n> ```';
  assert.equal((await parsePreviewDocument(doc(quoted))).records.length, 0);
  const extraInfo = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}', '```ptb json')));
  assert.equal(extraInfo.records.length, 0);
  assert.ok(extraInfo.diagnostics.some((d) => d.code === 'PTB_FENCE_INFO'));
  const unclosed = '```ptb\n{"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}';
  const result = await parsePreviewDocument(doc(unclosed));
  assert.equal(result.records[0].state, 'invalid-record');
  assert.ok(result.diagnostics.some((d) => d.code === 'PTB_FENCE_UNCLOSED'));
});

test('schema-invalid metadata is retained as an invalid occurrence', async () => {
  const result = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"project","id":"feat.wrong","title":"x"}')));
  assert.equal(result.records[0].state, 'invalid-record');
  assert.ok(result.diagnostics.some((d) => d.code === 'ID_KIND'));
});

test('BOM, CRLF, Unicode source points, and field refs use captured offsets', async () => {
  const text = '\uFEFF# 🧭 Start\r\n\r\n' + block('{"ptb":"0.2","kind":"project","id":"proj.x","title":"café"}') + '\r\nNarrative';
  const result = await parsePreviewDocument(doc(text, 'unicode'));
  const title = result.fields.get('unicode:b0').get('/title');
  assert.equal(title.span.start.line, 4);
  assert.ok(title.span.start.byteOffset > title.span.start.utf16Offset - 2);
  assert.equal(title.headingPath[0], '🧭 Start');
  assert.equal(result.document.headings[0].source.span.start.byteOffset, 3);
  assert.equal(text.slice(title.span.start.utf16Offset, title.span.end.utf16Offset), '"café"');
});

test('manifest documents allow ordinary nested relative paths for acquisition validation', async () => {
  const result = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"project","id":"proj.x","title":"x","documents":["sub/notes.md"]}')));
  assert.equal(result.records[0].state, 'record');
  assert.deepEqual(result.records[0].record.documents, ['sub/notes.md']);
});

test('schema defaults, warning state, and pointer paths are exposed', async () => {
  const result = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"action","id":"act.x","project":"proj.x","title":"Build","features":["feat.a"],"unexpected":true}')));
  assert.equal(result.records[0].state, 'record');
  assert.equal(result.records[0].record.action_type, 'implementation');
  assert.equal(result.records[0].validation, 'needs-review');
  assert.ok(result.diagnostics.some((d) => d.code === 'UNKNOWN_FIELD'));
  assert.ok(result.fields.get('fixture:b0').has('/features/0'));
});

test('bounded 1 MiB source with 2,001 blocks stops at the record cap promptly', async () => {
  const record = block('{"ptb":"0.2","kind":"project","id":"proj.x","title":"x"}');
  const authored = `${Array.from({ length: 2001 }, () => record).join('\n')}\n`;
  const text = authored + 'x'.repeat(1_000_000 - authored.length);
  assert.ok(Buffer.byteLength(text) <= 1_000_000);
  const start = performance.now();
  const result = await parsePreviewDocument(doc(text, 'bounded'));
  const elapsedMs = performance.now() - start;
  assert.equal(result.records.length, 2000);
  assert.ok(result.diagnostics.some((d) => d.code === 'LIMIT_EXCEEDED'));
  assert.ok(elapsedMs < 10_000, `parsing took ${elapsedMs.toFixed(0)}ms`);
});

test('explicit null action type is a schema error instead of the default', async () => {
  const result = await parsePreviewDocument(doc(block('{"ptb":"0.2","kind":"action","id":"act.x","project":"proj.x","title":"x","action_type":null}')));
  assert.equal(result.records[0].state, 'invalid-record');
  assert.ok(result.diagnostics.some((d) => d.field === '/action_type'));
});
