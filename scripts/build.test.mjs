import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import { build } from 'vite';

test('the production build externalizes React and Base UI roots and subpaths', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'tumaet-ui-build-'));
  const imports = new Map([
    ['react', 'createElement'],
    ['react/jsx-runtime', 'jsx'],
    ['react-dom', 'createPortal'],
    ['react-dom/client', 'createRoot'],
    ['react-dom/server', 'renderToString'],
    ['@base-ui/react', 'Button'],
    ['@base-ui/react/dialog', 'Dialog'],
  ]);
  try {
    const entry = join(dir, 'external.tsx');
    await writeFile(
      entry,
      [...imports].map(([specifier, name]) => `export { ${name} } from '${specifier}';`).join('\n'),
    );
    const results = await build({
      configFile: resolve('vite.config.ts'),
      logLevel: 'silent',
      build: { write: false, lib: { entry, formats: ['es'] } },
    });
    const [result] = Array.isArray(results) ? results : [results];
    assert.ok('output' in result);
    assert.equal(result.output.length, 1, 'No external package code should be bundled');
    const [chunk] = result.output;
    assert.equal(chunk.type, 'chunk');
    assert.deepEqual(chunk.imports.toSorted(), [...imports.keys()].toSorted());
    assert.match(chunk.code, /^['"]use client['"];?/u);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
