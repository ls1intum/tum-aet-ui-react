# Releasing `@tumaet/ui-react`

Releases are built, tested and staged by the [Release workflow](.github/workflows/release.yml). Nothing is published from a laptop.

1. Update `version` in `package.json` and add a section to `CHANGELOG.md`. Stable versions use `MAJOR.MINOR.PATCH`; prereleases such as `0.2.0-rc.1` are supported. Core numbers and numeric prerelease identifiers cannot have leading zeroes. Build metadata (`+build`) is rejected because npm normalizes it away. Merge to `main` once CI is green.
2. Check locally: `pnpm pack:check && pnpm test:consumer latest && pnpm test:consumer minimum`.
3. Tag the merge commit and push the tag: `git tag "@tumaet/ui-react@<version>" && git push origin "@tumaet/ui-react@<version>"`.
4. Run **Actions → Release** manually, choosing that tag as the ref and an explicit npm **dist_tag**: `next` (the safe default), `alpha`, `beta`, `rc` or `latest`. Prereleases cannot use `latest`. Stable releases may use a non-latest tag for application validation; choose `latest` deliberately for a general release. The workflow checks that the git tag matches `package.json` and that the commit is on `main`, then checks types, lint, unit tests and Storybook examples, packs the artifact, verifies it and installs it into a fresh app with the minimum and the latest supported React 19. A branch dispatch validates only and does not stage.
5. The browser job verifies and extracts that same tarball, then runs the public-API interaction suite in Chromium, Firefox and WebKit without rebuilding. Staging requires this job and both consumer checks to pass.
6. The `stage` job (environment `npm-tum-aet-ui-react`, needs a reviewer) verifies the SHA-512 integrity and stages the exact tested tarball on npm using the validated dist tag. It does not check out or rebuild package code. Review the version, contents and dist tag on npmjs.com and approve it with 2FA. Installing a candidate is explicit, for example `npm install @tumaet/ui-react@next`; a prerelease is never automatically promoted to `latest` by this workflow.
7. Create a GitHub Release for the tag with the changelog section.

Before the first staged release, a package owner must verify this setup. A successful branch validation does not test npm authorization.

- The package belongs to the `@tumaet` npm scope and is public.
- Configure npm trusted publishing for repository `ls1intum/tum-aet-ui-react`, workflow `release.yml` and environment `npm-tum-aet-ui-react`, with the **Allow npm stage publish** permission. Prefer stage-only permission when configuring the publisher. npm keeps this binding private; verify it in the package settings.
- Require reviewers on the GitHub environment `npm-tum-aet-ui-react`.

`prepublishOnly` continues to refuse publishing the working directory. Do not repack, rebuild or run lifecycle scripts in the credentialed staging job. Staging uses npm's [documented `--tag` option](https://docs.npmjs.com/cli/v11/commands/npm-stage/). The local package-policy tests cover valid/invalid versions, release identity and prerelease tag guards without contacting npm or publishing anything.
