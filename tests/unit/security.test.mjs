import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve, join } from 'node:path';
import { rendererAsset, trustedSender, appUrl } from '../../dist/main/security.js';
import { AppError, operationResult } from '../../dist/main/domain.js';

test('protocol only exposes the renderer document and build assets', () => {
  const root = resolve('dist/renderer');
  assert.equal(rendererAsset(appUrl, root), join(root, 'index.html'));
  assert.equal(rendererAsset('app://workspace/assets/index-A_b.js', root), join(root, 'assets/index-A_b.js'));
  for (const url of [
    'file:///C:/secret.txt', 'app://other/index.html', 'app://workspace/package.json',
    'app://workspace/../../package.json', 'app://workspace/assets/%2e%2e%2fsecret.css',
    'app://workspace/assets/nested/secret.js', 'app://workspace/assets/index.js.map',
    'app://user:pass@workspace/index.html',
  ]) assert.equal(rendererAsset(url, root), undefined, url);
});

test('IPC trust requires matching sender, main frame identity and exact document URL', () => {
  const main = {};
  assert.equal(trustedSender(1, main, 1, main, appUrl), true);
  assert.equal(trustedSender(2, main, 1, main, appUrl), false);
  assert.equal(trustedSender(1, {}, 1, main, appUrl), false);
  assert.equal(trustedSender(1, main, 1, main, 'https://example.com'), false);
});

test('known errors cross IPC safely; unexpected storage failures hide technical details', async (t) => {
  t.mock.method(console, 'error', () => {});
  assert.deepEqual(await operationResult(() => 42), { ok: true, value: 42 });
  assert.deepEqual(await operationResult(() => { throw new AppError('NOT_FOUND', 'Missing project.'); }),
    { ok: false, error: { code: 'NOT_FOUND', message: 'Missing project.' } });
  const failure = await operationResult(() => { throw new Error('sensitive database path'); });
  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, 'STORAGE');
  assert.ok(!failure.error.message.includes('sensitive database path'));
});
