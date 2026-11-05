import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export function temporaryDirectory(t, closeResources = () => {}) {
  const directory = mkdtempSync(join(tmpdir(), 'projects-timeline-test-'));
  t.after(async () => {
    await closeResources();
    // Recursive cleanup is restricted to the exact temporary directory created above.
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(directory.startsWith(join(tmpdir(), 'projects-timeline-test-')));
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  });
  return directory;
}
