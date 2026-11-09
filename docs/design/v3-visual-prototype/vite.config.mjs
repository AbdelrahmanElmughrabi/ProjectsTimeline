import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  plugins: [tailwindcss()],
  build: {
    outDir: fileURLToPath(new URL('../../../artifacts/v3-visual-prototype/build', import.meta.url)),
    emptyOutDir: true,
  },
});
