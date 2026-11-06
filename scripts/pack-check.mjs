// Packs the library into a single tarball and verifies what would be published.
// The release workflow publishes exactly this tarball and nothing else.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { validateVersion } from './release-policy.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'build/package');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// npm pack normally runs prepack, prepare and postpack; validate existing build bytes without lifecycle scripts.
const [packed] = JSON.parse(
  execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', out], {
    cwd: root,
    encoding: 'utf8',
  }),
);
const tarball = resolve(out, packed.filename);
const extracted = await mkdtemp(join(tmpdir(), 'tumaet-ui-packed-'));
try {
  // Validate the same bytes that will be staged, including npm's packed manifest.
  execFileSync('tar', ['-xzf', tarball, '-C', extracted]);
  const packageRoot = resolve(extracted, 'package');
  const manifest = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'));

  assert.equal(manifest.name, '@tumaet/ui-react');
  validateVersion(manifest.version);
  assert.notEqual(manifest.private, true, 'package.json must not be private');
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.publishConfig?.access, 'public');
  assert.deepEqual(Object.keys(manifest.exports).sort(), ['.', './package.json', './styles.css']);
  assert.deepEqual(
    Object.keys(manifest.dependencies).sort(),
    ['@base-ui/react'],
    'Only the reviewed Base UI runtime dependency is allowed',
  );
  for (const field of ['optionalDependencies', 'bundledDependencies', 'bundleDependencies']) {
    assert.equal(manifest[field], undefined, `${field} must not bypass the dependency allowlist`);
  }
  assert.deepEqual(Object.keys(manifest.peerDependencies).sort(), ['react', 'react-dom']);
  assert.deepEqual(manifest.sideEffects, ['**/*.css']);
  assert.equal(manifest.main, './dist/index.js');
  assert.equal(manifest.types, './dist/types/index.d.ts');
  assert.deepEqual(manifest.exports['.'], { types: manifest.types, import: manifest.main });
  assert.equal(manifest.exports['./styles.css'], './dist/styles.css');
  assert.equal(manifest.exports['./package.json'], './package.json');
  for (const range of Object.values(manifest.peerDependencies)) {
    assert.doesNotMatch(range, /^(?:workspace|catalog|file|link):/);
  }

  const files = (await readdir(packageRoot, { recursive: true, withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => relative(packageRoot, join(entry.parentPath, entry.name)));
  for (const required of [
    'package.json',
    'README.md',
    'LICENSE',
    'dist/index.js',
    'dist/styles.css',
    'dist/types/index.d.ts',
  ]) {
    assert.ok(files.includes(required), `Missing published file: ${required}`);
  }
  const fileSet = new Set(files);
  for (const path of files) {
    assert.ok(
      ['package.json', 'README.md', 'LICENSE', 'dist/styles.css'].includes(path) ||
        /^dist\/.+\.(?:js|d\.ts)$/u.test(path),
      `Unexpected published file: ${path}`,
    );
    assert.doesNotMatch(
      path,
      /(?:^|\/)(?:src|tests?|__tests__|demos?|stories|node_modules)(?:\/|$)|\.(?:test|spec|demo|stories)\./u,
      `Development artifact in package: ${path}`,
    );
    if (!/\.(?:js|d\.ts)$/u.test(path)) {
      continue;
    }
    const source = await readFile(resolve(packageRoot, path), 'utf8');
    for (const { fileName: specifier } of ts.preProcessFile(source, true, true).importedFiles) {
      if (specifier.startsWith('.')) {
        assert.match(specifier, /\.(?:js|css|json)$/u, `Extensionless emitted import: ${path} -> ${specifier}`);
        let target = posix.normalize(posix.join(posix.dirname(path), specifier));
        if (path.endsWith('.d.ts') && target.endsWith('.js')) {
          target = target.replace(/\.js$/u, '.d.ts');
        }
        assert.ok(fileSet.has(target), `Unpublished import: ${path} -> ${specifier}`);
      } else {
        assert.match(
          specifier,
          /^(?:react|react-dom|@base-ui\/react)(?:\/|$)/u,
          `Unexpected external import: ${path} -> ${specifier}`,
        );
      }
    }
  }

  // Module resolution and type correctness as a consumer sees them.
  execFileSync('pnpm', ['exec', 'publint', tarball, '--strict'], { cwd: root, stdio: 'inherit' });
  execFileSync('pnpm', ['exec', 'attw', tarball, '--profile', 'esm-only', '--entrypoints', '.'], {
    cwd: root,
    stdio: 'inherit',
  });

  const integrity = `sha512-${createHash('sha512')
    .update(await readFile(tarball))
    .digest('base64')}`;
  await writeFile(
    resolve(out, 'manifest.json'),
    `${JSON.stringify(
      { name: manifest.name, version: manifest.version, filename: packed.filename, integrity },
      null,
      2,
    )}\n`,
  );

  process.stdout.write(
    `\nPacked ${packed.filename} (${files.length} files, ${packed.unpackedSize} bytes unpacked)\n${integrity}\n`,
  );
} finally {
  await rm(extracted, { recursive: true, force: true });
}
