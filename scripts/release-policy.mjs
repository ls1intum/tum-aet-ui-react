import assert from 'node:assert/strict';
import { parse } from 'semver';

export function validateVersion(version) {
  assert.equal(typeof version, 'string');
  const parsed = parse(version);
  assert.ok(parsed, 'Use a valid SemVer version');
  assert.equal(parsed.version, version, 'Versions must use their canonical SemVer identity');
  // npm drops build metadata, so it cannot identify an immutable package version.
  assert.equal(parsed.build.length, 0, 'Build metadata is not supported');
  return { prerelease: parsed.prerelease.length > 0 };
}

export function validateRelease({ name, version, refType, ref, distTag }) {
  assert.equal(name, '@tumaet/ui-react');
  const { prerelease } = validateVersion(version);
  assert.ok(['latest', 'next', 'alpha', 'beta', 'rc'].includes(distTag), 'Choose an explicit supported npm dist tag');
  assert.ok(!prerelease || distTag !== 'latest', 'Prereleases must use a non-latest dist tag');
  assert.ok(['branch', 'tag'].includes(refType), 'Unknown release ref type');
  if (refType === 'tag') {
    assert.equal(ref, `${name}@${version}`, 'The git tag must match the package name and version');
  }
  return distTag;
}
