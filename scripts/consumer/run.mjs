// Installs the packed tarball into a fresh app and checks it as a consumer would:
// typecheck, bundle (with the stylesheet import), and render a few components on the server.
// Usage: node scripts/consumer/run.mjs [latest|minimum]   (peer versions of react and react-dom)
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const peers = process.argv[2] ?? 'latest';
assert.ok(['latest', 'minimum'].includes(peers), 'Usage: run.mjs [latest|minimum]');
const here = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(here, '../../build/package');
const { filename, integrity } = JSON.parse(await readFile(join(pkgDir, 'manifest.json'), 'utf8'));
const tarball = join(pkgDir, filename);
assert.equal(
  `sha512-${createHash('sha512')
    .update(await readFile(tarball))
    .digest('base64')}`,
  integrity,
  'Test only the validated tarball bytes',
);

const dir = await mkdtemp(join(tmpdir(), 'tumaet-ui-react-consumer-'));
await cp(join(here, 'app'), dir, { recursive: true });
// "latest" means the latest supported React 19, not a future unsupported major.
const react = peers === 'minimum' ? '19.0.0' : '^19.0.0';
const pkg = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8'));
pkg.dependencies = { '@tumaet/ui-react': `file:${tarball}`, react, 'react-dom': react };
pkg.devDependencies = {
  '@types/react': peers === 'minimum' ? '19.0.0' : 'latest',
  '@types/react-dom': peers === 'minimum' ? '19.0.0' : 'latest',
  typescript: '^7.0.2',
  vite: '^8.3.5',
};
await writeFile(join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

const run = (cmd, args) => execFileSync(cmd, args, { cwd: dir, stdio: 'inherit' });
process.stdout.write(`Consumer app (react ${react}) in ${dir}\n`);
run('npm', ['install', '--no-audit', '--no-fund', '--ignore-scripts']);
run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']);
run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.json', '--module', 'NodeNext', '--moduleResolution', 'NodeNext']);
run('npx', ['vite', 'build', '--ssr', 'src/render.tsx', '--outDir', 'out']);

const { render } = await import(join(dir, 'out/render.js'));
const html = render();
for (const expected of ['Name', 'Active', 'Save']) {
  assert.ok(html.includes(expected), `Rendered HTML is missing "${expected}"`);
}
// Bundle a single root-barrel import for the browser. SSR externalizes the package,
// so SSR alone cannot prove consumer tree shaking or browser dependency handling.
await writeFile(
  join(dir, 'src/button.tsx'),
  "import '@tumaet/ui-react/styles.css';\nexport { Button } from '@tumaet/ui-react';\n",
);
const requireFromConsumer = createRequire(join(dir, 'package.json'));
const { build } = await import(pathToFileURL(requireFromConsumer.resolve('vite')).href);
const results = await build({
  root: dir,
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    lib: { entry: join(dir, 'src/button.tsx'), formats: ['es'] },
    rolldownOptions: { external: /^(?:react|react-dom)(?:\/|$)/u },
  },
});
const [result] = Array.isArray(results) ? results : [results];
assert.ok('output' in result);
const chunks = result.output.filter((output) => output.type === 'chunk');
const code = chunks.map((chunk) => chunk.code).join('\n');
assert.ok(code.includes('tumaet-ui-btn'), 'Button must be present in the browser bundle');
for (const unused of ['tumaet-ui-select', 'tumaet-ui-dialog', 'tumaet-ui-data-table', 'tumAetUi.datePicker']) {
  assert.ok(!code.includes(unused), `Unused component code survived tree shaking: ${unused}`);
}
const styles = result.output.find((output) => output.type === 'asset' && output.fileName.endsWith('.css'));
assert.ok(styles, 'The consumer browser bundle must emit the imported stylesheet');
const css = typeof styles.source === 'string' ? styles.source : Buffer.from(styles.source).toString('utf8');
assert.match(css, /@layer tumaet-ui\.tokens\s*\{/u, 'Emit the token layer');
assert.match(css, /--tumaet-ui-primary-color\s*:/u, 'Emit theme token declarations');
assert.match(css, /\.tumaet-ui-btn\b[^{}]*\{/u, 'Emit component styling rules');
const installedReact = JSON.parse(await readFile(join(dir, 'node_modules/react/package.json'), 'utf8')).version;
const installedBase = JSON.parse(await readFile(join(dir, 'node_modules/@base-ui/react/package.json'), 'utf8')).version;
process.stdout.write(
  `OK: bundler + NodeNext typechecks, SSR, emitted theme/component CSS and Button tree shaking with React ${installedReact}, Base UI ${installedBase}\n`,
);

await rm(dir, { recursive: true, force: true });
