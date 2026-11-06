import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  root: (process.env.VITEST ?? '') !== '' ? undefined : 'playground',
  build: {
    outDir: resolve(import.meta.dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        styles: resolve(import.meta.dirname, 'src/styles/index.css'),
      },
      formats: ['es'],
      cssFileName: 'styles',
    },
    rolldownOptions: {
      // Include every subpath (jsx-runtime, client, server, Base UI parts, ...).
      external: /^(?:react|react-dom|@base-ui\/react)(?:\/|$)/,
      output: {
        preserveModules: true,
        preserveModulesRoot: resolve(import.meta.dirname, 'src'),
        entryFileNames: '[name].js',
        // Existing TSX modules use hooks/context even before the behaviour migration.
        // Keep barrels and pure TS utilities free of a blanket client boundary.
        banner: (chunk) => (chunk.facadeModuleId?.endsWith('.tsx') === true ? "'use client';" : ''),
      },
    },
    cssCodeSplit: true,
  },
  test: {
    root: import.meta.dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
