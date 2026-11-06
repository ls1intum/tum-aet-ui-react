# TUM AET UI for React

React implementation of the AET design system, sharing tokens and class names with `@tumaet/ui-angular` in Artemis (`packages/tum-aet-ui`). React and React DOM are peers; Base UI owns generic interactive behaviour.

## Component conventions

- Keep styles in plain CSS beside the component. Use `--tumaet-ui-*` tokens from `src/styles/themes.css`, spacing as `calc(var(--tumaet-ui-spacing) * n)`, existing Angular class names and `data-severity` / `data-size` / `data-variant` attributes.
- Register new component styles in `src/styles/index.css` in alphabetical order. Vite builds this layered entry for the distribution; the playground and Storybook use the same entry, and browser tests exercise the built stylesheet.
- Typography comes from the tokens; form controls use `font: inherit`. Support both themes, reduced motion and visible `:focus-visible` outlines (`2px solid var(--tumaet-ui-focus-color)`, offset 2px).
- Generated UI text comes from `useTranslate()` and the existing `tumAetUi.*` keys in `src/internal/i18n.tsx`. If a required key is absent, expose an English fallback through a prop and report the missing key.
- Use React 19 refs and merge classes with `cx`. Follow [the API and migration policy](docs/migration-policy.md) for state callbacks, typed values, compound parts and compatibility.
- Use Base UI's public primitives for migrated keyboard, focus, dismissal and positioning behaviour. Keep shared legacy helpers only while they have consumers.
- Icons are `ReactNode` props. Existing SVGs are in `src/internal/icons.tsx`; additional Font Awesome Free solid paths can be copied from `~/Projects/Artemis/node_modules/@fortawesome/free-solid-svg-icons` into the component folder.
- Base UI is the only approved direct runtime dependency. Other dependencies need maintainer agreement.

## Files and ownership

Each component folder contains its implementation, CSS, colocated Vitest tests, demo, stories and public `index.ts`. Demos are discovered automatically. Component tests include an axe check using `src/test-utils.ts`.

Stay within assigned files. Coordinate shared exports, internal helpers, configuration and package changes with the integration owner. Do not overwrite another contributor's work or format unrelated files.

`src/components/button` is the reference for tokens, variants and exports. For Angular ports, consult the supplied snapshot under `src/lib/<name>/`, including its stories and specs, for intended values and behaviour.

## Checks and Storybook

Use the scripts in `package.json`. Component tests can be scoped with `pnpm test -- src/components/<name>`; browser setup and platform prerequisites are in [tests/browser/README.md](tests/browser/README.md). Packaging changes require `pnpm pack:check` and both tarball consumers (`minimum`, `latest`); `pack:check` includes the production build.

Format changed component files with Prettier. ESLint and stylelint configs define the enforced rules; any necessary suppression must explain the non-obvious reason.

Stories use CSF with `satisfies Meta<typeof Component>`, the Angular title category and story names, descriptions for non-obvious props, and relevant interaction examples. Autodocs is enabled globally and `a11y.test` is `error`. For isolated Storybook validation, use `STORYBOOK_DISABLE_TELEMETRY=1 pnpm exec storybook build -o storybook-static-<task>`.
