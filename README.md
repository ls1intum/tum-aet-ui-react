# TUM AET UI for React

React components and styles of the design system of the [Applied Education Technologies (AET)](https://aet.cit.tum.de/) research group at the Technical University of Munich. This is a React port of [`@tumaet/ui-angular`](https://github.com/ls1intum/Artemis/tree/develop/packages/tum-aet-ui) and uses the same design tokens (`--tumaet-ui-*`), class names, light and dark theme.

The API may change in 0.x minor releases; see the [changelog](CHANGELOG.md) and [migration policy](docs/migration-policy.md). Existing component props remain documented in Storybook while behaviour migrates to Base UI.

## Principles

- React 19 and React DOM as peers; `@base-ui/react` as the normal runtime dependency for the phased behaviour migration. No other direct runtime dependencies.
- Plain CSS in one file, driven by CSS custom properties. No Tailwind, no CSS-in-JS.
- Base UI for generic interactive behaviour; platform APIs such as `Intl` and CSS custom properties for owned logic.
- Accessibility is a requirement: roles, names, keyboard behaviour and focus handling follow the WAI-ARIA Authoring Practices.
- Built-in texts are English and can be replaced with `TumAetUiI18nProvider`.
- Modular ESM with tree shaking. React, React DOM and Base UI (including their subpaths) stay external to the library build. TSX modules carry client directives; the public barrel stays a re-export entry.

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

Button, ButtonGroup, Input, Textarea, Field, FormField, IconField, InputGroup, InputNumber, SearchField, Checkbox, RadioButton, RadioGroup, ToggleSwitch, SelectButton, Select, Combobox, DatePicker, Calendar, Dialog, ConfirmDialog (`useConfirm`), Popover, Tooltip, Menu, DataTable, Table, SortableColumnHeader, Paginator, Tabs, List, Tag, Chip, Message, ProgressBar, ProgressSpinner, EmptyState, Card, Panel, Splitter. Interactive compositions expose flat parts; `DirectionProvider` supplies Base UI's direction context.

Not ported: charts, the virtual-scroll table and the Angular `DialogService`.

## Develop

```sh
pnpm install
pnpm dev          # playground with a demo of every component
pnpm storybook    # Storybook: stories, props tables and guides, light and dark
pnpm build-storybook
pnpm test         # Vitest with jsdom
pnpm test:browser # build, then native Chromium, Firefox and WebKit interactions
pnpm typecheck
pnpm build        # modular dist/index.js + components/internal, dist/types, dist/styles.css
pnpm pack:check   # build, pack the tarball and verify its contents, exports and types
pnpm test:consumer latest   # install the tarball in a fresh app (or `minimum` for React 19.0.0)
```

Releases are described in [RELEASING.md](RELEASING.md). Conventions for contributors and coding agents are in [AGENTS.md](AGENTS.md).

The public paths remain `@tumaet/ui-react`, `@tumaet/ui-react/styles.css` and `@tumaet/ui-react/package.json`. Files below `dist/components` and `dist/internal` are implementation details, not supported deep imports. The declarations include explicit relative `.js` specifiers for NodeNext as well as bundler resolution. The stylesheet is explicitly side-effectful; importing one component does not split its CSS out of the full stylesheet.

Consumer checks install the validated tarball outside the workspace and verify types, CSS, server rendering and tree shaking. Browser tests separately exercise representative interactions in Chromium, Firefox and WebKit. These automated checks do not establish screen-reader or touch coverage.

## License

MIT, see [LICENSE](LICENSE).
