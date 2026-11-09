# Component API and migration policy

The library owns the AET appearance, composition, translations and domain logic. Native form controls use HTML/React state, events and form behaviour. Migrated complex widgets use Base UI for generic interaction, dismissal and positioning. React and React DOM are peers; Base UI is a normal runtime dependency.

## New and migrated components

- Export compound parts as flat names, such as `Select`, `SelectTrigger` and `SelectPopup`. Simple presentation components and common composed patterns can remain props-driven.
- Native `Input`, `Textarea`, `Checkbox` and `ToggleSwitch` use DOM events. Checkbox/switch selection uses `checked/defaultChecked/onChange`; refs target the input. `RadioGroup` distributes `value/defaultValue` to native radio inputs and reports `onValueChange(value, event)` with a React input change event. It requires an explicit name and holds no uncontrolled selection state. Other migrated widgets use their documented state callbacks and supported Base UI event details, including cancellation.
- Type collection items, values and callbacks together. Prefer label and serialization functions to property-name strings. Specify equality and empty/multiple-value semantics. A generic root does not typecheck arbitrary JSX descendants: verify the actual supported typed path rather than claiming otherwise.
- `Select` and `Combobox` require a controlled value and a root-owned collection with stable item keys. Their callers own selection and reset policy; Base UI owns opening, focus, keyboard interaction and form serialization. Single empty selection is `null`; multiple empty selection is `[]`. Use distinct, nonempty submission strings for real items. Combobox query text is separate from selection; retain selected items in its collection when server results change.
- `InputNumber` requires `number | null` and reports Base UI value-change details. Its native props and ref target the visible input; `rootProps` configures its wrapper. Use Intl `format` for numeric parsing/formatting and `prefix`/`suffix` only for decorative affixes. `SelectButton` uses string-value arrays in both modes, with `[]` as empty; it does not serialize form data.
- `SearchField` requires a string value and reports typing/clearing through `onValueChange`. Its caller owns query and reset policy; it keeps no text-state mirror. Native props and ref target the search input.
- Forward element props and React 19 refs on the rendered part, and merge its class with `cx`. Keep appearance in tokens and the documented variant props; use native pseudo-classes for native inputs and upstream state attributes for Base UI widgets.
- Native form controls support submission, disabled/read-only semantics and reset. Verify `FormData`, reset followed by rerender, and canceled reset. Uncontrolled native inputs follow React/HTML `defaultChecked` semantics: changing defaults updates reset defaults; native radio exclusivity can also affect current selection when another option’s default changes. Controlled state and its reset policy remain caller-owned; native reset is not a change event. Do not mirror native uncontrolled selection in React state or reset adapters. Domain editors such as DatePicker expose their documented value contract without implying native form serialization.
- Preserve `tumAetUi.*` translations, accessible names and focus return. Portal inheritance follows the destination DOM: expose the upstream container option and demonstrate a host within the intended theme/direction boundary, outside clipping containers. See [theming](theming.mdx).

## API changes

Backward compatibility with the original port is not required. Replace old props and aliases rather than add deprecation layers, dual callbacks or compatibility adapters. Update affected patterns, examples and tests in the same change. Remove superseded behaviour and shared helpers after their consumers migrate.

Breaking changes during 0.x require a minor version, a changelog entry and concrete usage examples. Use prereleases for application validation before a new minor release.

## Distribution

`package.json` defines supported peers, the tested Base UI dependency range and public exports. Internal output paths are not supported imports. Package checks inspect the packed artifact; fresh consumer checks verify exported types, CSS, server rendering and tree shaking. Browser interaction checks are separate. Extend export and artifact coverage when adding a public path; keep release validation tied to the tested tarball.
