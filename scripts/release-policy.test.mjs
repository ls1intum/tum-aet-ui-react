import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateRelease, validateVersion } from './release-policy.mjs';

test('accepts canonical stable and prerelease identities', () => {
  assert.deepEqual(validateVersion('0.1.0'), { prerelease: false });
  assert.deepEqual(validateVersion('0.2.0-rc.1'), { prerelease: true });
});

test('rejects invalid versions, normalized identities and npm build metadata loss', () => {
  for (const version of ['1.2', 'v1.2.3', '=1.2.3', ' 1.2.3', '1.2.3\n', '1.2.3-rc.1\n', '1.2.3+build']) {
    assert.throws(() => validateVersion(version));
  }
});

const candidate = {
  name: '@tumaet/ui-react',
  version: '0.2.0-rc.1',
  refType: 'tag',
  ref: '@tumaet/ui-react@0.2.0-rc.1',
  distTag: 'next',
};

test('requires an explicit safe dist tag, keeping prereleases off latest', () => {
  assert.equal(validateRelease(candidate), 'next');
  for (const distTag of [undefined, '', 'latest', '1.2.3', '--tag=latest', 'next;echo', 'NEXT']) {
    assert.throws(() => validateRelease({ ...candidate, distTag }));
  }
  assert.equal(
    validateRelease({ ...candidate, version: '0.2.0', ref: '@tumaet/ui-react@0.2.0', distTag: 'latest' }),
    'latest',
  );
  assert.equal(validateRelease({ ...candidate, refType: 'branch', ref: 'main' }), 'next');
});

test('rejects mismatched release identities', () => {
  assert.throws(() => validateRelease({ ...candidate, ref: '@tumaet/ui-react@0.2.0' }));
  assert.throws(() => validateRelease({ ...candidate, name: '@other/package' }));
  assert.throws(() => validateRelease({ ...candidate, refType: 'unknown' }));
});
