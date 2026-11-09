# TUM AET UI for React

React implementation of the AET design system, sharing tokens and class names with `@tumaet/ui-angular` in Artemis (`packages/tum-aet-ui`).

## Component conventions

- Keep styles in plain CSS beside the component. Use `--tumaet-ui-*` tokens from `src/styles/themes.css`, spacing as `calc(var(--tumaet-ui-spacing) * n)`, existing Angular class names and `data-severity` / `data-size` / `data-variant` attributes.
- Register component styles in `src/styles/index.css` in alphabetical order. This layered entry supplies the package, playground and Storybook.
- Typography comes from the tokens; form controls use `font: inherit`. Support both themes, reduced motion and visible `:focus-visible` outlines (`2px solid var(--tumaet-ui-focus-color)`, offset 2px).
- Generated UI text comes from `useTranslate()` and the existing `tumAetUi.*` keys in `src/internal/i18n.tsx`. If a required key is absent, expose an English fallback through a prop and report the missing key.
- Use native inputs for simple form controls and public Base UI primitives for complex-widget interaction. Follow [the API policy](docs/migration-policy.md) for state ownership, typed collections, refs and compound parts; merge classes with `cx`.
- Icons are `ReactNode` props. Reuse `src/internal/icons.tsx` where appropriate.
- Base UI is the only approved direct runtime dependency. Other dependencies need maintainer agreement.

## Checks and Storybook

Use the scripts in `package.json` and the existing component patterns. Scope component checks with `pnpm exec vitest run src/components/<name>`; use `src/test-utils.ts` for axe checks. Browser setup and platform prerequisites are in [tests/browser/README.md](tests/browser/README.md). Packaging changes require `pnpm pack:check` and both tarball consumers (`minimum`, `latest`); `pack:check` includes the production build.

Format changed component files with Prettier. ESLint and stylelint configs define the enforced rules; any necessary suppression must explain the non-obvious reason.

Stories use CSF with `satisfies Meta<typeof Component>`. Preserve established categories and story names when editing them, and include relevant interaction examples. For isolated Storybook validation, use `STORYBOOK_DISABLE_TELEMETRY=1 pnpm exec storybook build -o storybook-static-<task>`.
