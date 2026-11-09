# TUM AET UI for React

The React design system for applications from [Applied Education Technologies (AET)](https://aet.cit.tum.de/) at the Technical University of Munich. It shares design tokens (`--tumaet-ui-*`), class names and light/dark themes with [`@tumaet/ui-angular`](https://github.com/ls1intum/Artemis/tree/develop/packages/tum-aet-ui).

The API may change in 0.x minor releases. See the [changelog](CHANGELOG.md) before upgrading and Storybook for component APIs and examples.

## Principles

- **React composition.** Native controls for simple forms; public Base UI primitives for compound widgets and popups.
- **AET appearance.** Plain CSS, shared tokens and explicit `severity`, `size` and `variant` props. No styling framework is required.
- **Application-owned state.** Native uncontrolled forms follow HTML/React behavior. Controlled values, validation policy and application data belong to the caller.
- **Localisation.** Built-in texts are English and can be replaced with `TumAetUiI18nProvider`.
- **Modular ESM.** Components can be tree-shaken. React and React DOM are peers; Base UI is the only direct runtime dependency.

## Install

```sh
npm install @tumaet/ui-react
```

Requires React 19, React DOM 19 and a bundler that handles CSS imports. The React and Angular packages have independent version numbers.

## Use

```tsx
import '@tumaet/ui-react/styles.css';
import { Button } from '@tumaet/ui-react';

export function App() {
  return <Button severity="primary">Save changes</Button>;
}
```

Set `data-theme="dark"` or `.dark` on `<html>` for the dark theme; `.light` or `data-theme="light"` can establish a light subtree. All styles use the `tumaet-ui` cascade layer with `tokens`, `base` and `components` sublayers. Declare application layer order before stylesheet imports, placing resets below the library and overrides above it; see the [theming guide](docs/theming.mdx).

## Components

- **Actions and overlays:** Button, ButtonGroup, Menu, Dialog, ConfirmDialog (`useConfirm`), Popover and Tooltip.
- **Forms:** Input, Textarea, Field, FormField, IconField, InputGroup, InputNumber, SearchField, Checkbox, RadioButton, RadioGroup, ToggleSwitch, SelectButton, Select, Combobox, DatePicker and Calendar.
- **Data and feedback:** DataTable, Table, SortableColumnHeader, Paginator, List, Tag, Chip, Message, ProgressBar, ProgressSpinner and EmptyState.
- **Layout:** Card, Panel, Splitter and Tabs.

Compound widgets expose flat parts such as `DialogTrigger`, `DialogPortal` and `DialogPopup`. `DirectionProvider` supplies direction context; set the matching HTML `dir` for CSS and portal inheritance.

Charts, virtual scrolling and an Angular-style `DialogService` are outside the package.

## Guides

- [Theming](docs/theming.mdx): layers, tokens, nested themes and portals.
- [Texts and localisation](docs/i18n.mdx): translated component text and locale settings.
- [Conventions](docs/conventions.mdx): props, refs, forms and state ownership.
- [Accessibility](docs/accessibility.mdx): supported behavior and application responsibilities.

## Develop

```sh
pnpm install --frozen-lockfile
pnpm dev          # playground with a demo of every component
pnpm storybook    # Storybook: stories, props tables and guides, light and dark
```

Check scripts are defined in [package.json](package.json). See the [browser-test setup](tests/browser/README.md) for platform prerequisites and [RELEASING.md](RELEASING.md) for artifact validation and publication. Contributor constraints are in [AGENTS.md](AGENTS.md) and the [API policy](docs/migration-policy.md).

The `@typescript/native` alias supplies `tsc` for builds and typechecks. The `typescript` alias supplies the JavaScript compiler API used by ESLint and Storybook, following [Microsoft's side-by-side setup](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0).

Supported imports are `@tumaet/ui-react`, `@tumaet/ui-react/styles.css` and `@tumaet/ui-react/package.json`. Files below `dist` are implementation details, not supported deep imports. Declarations support NodeNext and bundler resolution. The stylesheet contains all component styles even when JavaScript is tree-shaken.

Consumer checks install the validated tarball outside the workspace and verify types, CSS, server rendering and tree shaking. Browser tests separately exercise representative interactions in Chromium, Firefox and WebKit. These automated checks do not establish screen-reader or touch coverage.

## License

MIT, see [LICENSE](LICENSE).
