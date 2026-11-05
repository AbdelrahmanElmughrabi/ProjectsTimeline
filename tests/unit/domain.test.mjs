import assert from 'node:assert/strict';
import test from 'node:test';
import { positiveId, requiredText, payload } from '../../dist/main/domain.js';

test('required text is trimmed, bounded and rejects invalid types/whitespace', () => {
  assert.equal(requiredText('  name  ', 'Name', 20), 'name');
  assert.equal(requiredText('x'.repeat(120), 'Name', 120).length, 120);
  for (const value of ['', ' \n\t ', null, 3, {}, 'x'.repeat(121), '😀'.repeat(61)]) {
    assert.throws(() => requiredText(value, 'Name', 120), { code: 'VALIDATION' });
  }
});

test('IDs reject coercion, fractions, infinities and unsafe integers', () => {
  assert.equal(positiveId(1), 1);
  for (const value of ['1', null, 0, -1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => positiveId(value), { code: 'VALIDATION' });
  }
});

test('payload rejects arrays, null and unknown keys', () => {
  assert.deepEqual(payload({ name: 'A' }, ['name']), { name: 'A' });
  for (const value of [null, [], 'x', 1, { name: 'A', sql: 'DROP TABLE projects' }]) {
    assert.throws(() => payload(value, ['name']), { code: 'VALIDATION' });
  }
});
