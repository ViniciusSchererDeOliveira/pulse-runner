import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@engine': path.resolve(__dirname, './src/engine'),
      '@ai': path.resolve(__dirname, './src/engine/ai'),
      '@combat': path.resolve(__dirname, './src/engine/combat'),
      '@app-types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@scripts': path.resolve(__dirname, './scripts'),
    },
  },
});
