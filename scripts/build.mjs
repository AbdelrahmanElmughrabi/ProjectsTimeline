import { cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));
for (const args of [
  ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.node.json'],
  ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.renderer.json'],
  ['node_modules/vite/bin/vite.js', 'build'],
]) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
cpSync('src/main/data/migrations', 'dist/main/data/migrations', { recursive: true });
