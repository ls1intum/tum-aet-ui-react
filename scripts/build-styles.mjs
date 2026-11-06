// Inline the layered CSS entry used by Storybook and the playground. No CSS
// compiler or framework is needed; this entry only contains local layered imports.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const entryUrl = new URL('src/styles/index.css', root);
const entry = await readFile(entryUrl, 'utf8');
const importPattern = /@import url\('([^']+)'\) layer\((tumaet-ui\.(?:tokens|base|components))\);/gu;
const imports = [...entry.matchAll(importPattern)];
const remainder = entry
  .replace(importPattern, '')
  .replace(/\/\*[\s\S]*?\*\//gu, '')
  .replace('@layer tumaet-ui.tokens, tumaet-ui.base, tumaet-ui.components;', '')
  .trim();
if (remainder !== '') {
  throw new Error('src/styles/index.css must contain only the layer order and local layered imports.');
}

// Fail rather than silently omit a new component from development or the package.
const componentsUrl = new URL('src/components/', root);
const components = (await readdir(componentsUrl, { withFileTypes: true }))
  .filter((directory) => directory.isDirectory())
  .map((directory) => directory.name)
  .sort();
const expected = ['./themes.css', './base.css'];
for (const name of components) {
  const files = (await readdir(new URL(`${name}/`, componentsUrl))).filter((file) => file.endsWith('.css')).sort();
  expected.push(...files.map((file) => `../components/${name}/${file}`));
}
if (JSON.stringify(imports.map((match) => match[1])) !== JSON.stringify(expected)) {
  throw new Error('Update src/styles/index.css to import every component stylesheet once, in alphabetical order.');
}
const layers = ['tokens', 'base', ...expected.slice(2).map(() => 'components')];
if (imports.some((match, index) => match[2] !== `tumaet-ui.${layers[index]}`)) {
  throw new Error('Use the tokens, base and components layers for the corresponding stylesheets.');
}

let styles = entry;
for (const [statement, path, layer] of imports) {
  const contents = await readFile(new URL(path, entryUrl), 'utf8');
  if (/@(?:import|charset)\b/u.test(contents)) {
    throw new Error(`Move imports/charset declarations out of ${path}; they cannot be nested in a layer.`);
  }
  styles = styles.replace(statement, () => `@layer ${layer} {\n/* ${path} */\n${contents}\n}`);
}
await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/styles.css', root), styles);
process.stdout.write(`Built ${fileURLToPath(new URL('dist/styles.css', root))}\n`);
