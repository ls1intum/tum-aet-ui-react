# TUM AET UI for React

React components and styles of the design system of the [Applied Education Technologies (AET)](https://aet.cit.tum.de/) research group at the Technical University of Munich. This is a React port of [`@tumaet/ui-angular`](https://github.com/ls1intum/Artemis/tree/develop/packages/tum-aet-ui) and uses the same design tokens (`--tumaet-ui-*`), class names, light and dark theme.

**Status: first release (0.1.0). The API may change in any 0.x release, see the [changelog](CHANGELOG.md).** The components are ported, reviewed against the Angular source and specs, and tested with Vitest, Testing Library and axe-core. Every story was loaded in a real browser in light and dark with a colour-contrast check. Right-to-left layouts and touch input have only been exercised by a few stories, not verified visually.

## Principles

- No runtime dependencies besides `react` and `react-dom` (React 19, peer dependencies).
- Plain CSS in one file, driven by CSS custom properties. No Tailwind, no CSS-in-JS.
- Native platform features where possible: `<dialog>`, `Intl`, `color-mix`.
- Accessibility is a requirement: roles, names, keyboard behaviour and focus handling follow the WAI-ARIA Authoring Practices.
- Built-in texts are English and can be replaced with `TumAetUiI18nProvider`.

## Install

```sh
npm install @tumaet/ui-react
```

This is the React package. The Angular components are published separately as [`@tumaet/ui-angular`](https://www.npmjs.com/package/@tumaet/ui-angular); the two packages have independent version numbers. Requires React 19 and a bundler that handles CSS imports (for example Vite).

## Use

```tsx
import '@tumaet/ui-react/styles.css';
import { Button, Dialog } from '@tumaet/ui-react';
```

Set `data-theme="dark"` or `.dark` on `<html>` for the dark theme; `.light` or `data-theme="light"` can establish a light subtree. All styles use the `tumaet-ui` cascade layer with `tokens`, `base` and `components` sublayers. Declare application layer order before stylesheet imports, placing resets below the library and overrides above it; see the [theming guide](docs/theming.mdx).

## Components

Button, ButtonGroup, Input, Textarea, FormField, IconField, InputGroup, InputNumber, SearchField, Checkbox, RadioButton, RadioGroup, ToggleSwitch, SelectButton, Select, MultiSelect, Autocomplete, DatePicker, Calendar, Dialog, ConfirmDialog (`useConfirm`), Popover, Tooltip, Menu, DataTable, Table, SortableColumnHeader, Paginator, Tabs, List, Tag, Chip, Message, ProgressBar, ProgressSpinner, EmptyState, Card, Panel, Splitter.

Not ported: charts, the virtual-scroll table and the Angular `DialogService`.

## Develop

```sh
pnpm install
pnpm dev          # playground with a demo of every component
pnpm storybook    # Storybook: stories, props tables and guides, light and dark
pnpm build-storybook
pnpm test         # Vitest
pnpm typecheck
pnpm build        # dist/index.js, dist/types, dist/styles.css
pnpm pack:check   # build, pack the tarball and verify its contents, exports and types
pnpm test:consumer latest   # install the tarball in a fresh app (or `minimum` for React 19.0.0)
```

Releases are described in [RELEASING.md](RELEASING.md). Conventions for contributors and coding agents are in [AGENTS.md](AGENTS.md).

## License

MIT, see [LICENSE](LICENSE).
