# Changelog

All notable changes to `@tumaet/ui-react`. The version numbers are independent of `@tumaet/ui-angular`.

## 0.2.0 (2026-11-09)

- Splitter follows physical pointer/arrow movement in both text directions, restores persisted sizes without hydration mismatches, and keeps caller refs stable during resizing.
- Theme Dialog and Popover backdrops with `--tumaet-ui-backdrop-background`.

- Layer tokens, base rules and components under `tumaet-ui`. Declare application layer order before stylesheet imports; replace references to `tumaet-ui-theme`. Theme aliases and nested scopes follow the [theming contract](docs/theming.mdx).
- Ship modular ESM and validate the packed artifact with fresh consumers. React and React DOM remain peers; Base UI is a runtime dependency.
- Compose Dialog and Popover from flat component parts, including Trigger, Portal and Popup, with Backdrop or Positioner as appropriate. Base UI owns their interaction; trigger handles preserve typed payloads. Dialog refs now target the rendered Base UI part rather than an `HTMLDialogElement`.
- Compose Menu and Tooltip from their root, trigger, portal, positioner and popup parts. Replace Tooltip's `content` and `describesHost` props with popup children and explicit `id`/`aria-describedby` associations when a description adds useful information. Trigger labels remain independent of hints.
- Replace Select's `options`, property-name paths, `filter`, `onChange` and `defaultValue` API with typed keyed `items`, required controlled `value`, and `onValueChange`. Single empty selection is `null`; multiple empty selection is `[]`. Use `itemToStringLabel`, `itemToStringValue` and `isItemEqualToValue` for display, native submission and object equality. The caller owns selection and form-reset policy.
- Rename confirmation `header` to `title`. Confirmation promises settle on decisions, replacement or provider unmount; callback failures reject their request's promise.
- Replace Autocomplete and MultiSelect with a typed, compound Combobox for single or multiple searchable selection. Keep query text separate from controlled selected values; server filtering uses `filter={null}` and `filteredItems` without dropping selected descriptors. List items and chips use stable keys. The legacy listbox interaction helpers are removed.
- DatePicker uses a nonmodal Base UI popup, exposes `portalContainer` and reports `onValueChange`. Tab can leave the calendar; Done and Escape return to its text field. Date/time parsing and calendar navigation remain domain behavior. DatePicker does not expose native form submission or reset. The last custom Floating consumer and engine are removed.
- Tabs delegate selection, focus and measurement to Base UI. Replace `onChange` with `onValueChange`, `activation` with `TabList.activateOnFocus`, and `preserveContent` with `TabPanel.keepMounted`. Tab activation is manual by default; add `TabIndicator` where needed.
- InputNumber requires controlled `number | null` and uses `onValueChange`, `onValueCommitted` and Intl `format`. Native props/ref target its visible textbox; `rootProps` targets the wrapper. Replace the old fraction/grouping/accepted-separator/snap aliases with Base UI number options. Numeric form reset is caller-owned.
- SearchField requires a controlled string and uses `onValueChange`; remove `defaultValue` and the old string-valued `onChange`. Query/reset policy belongs to the caller. Read-only search fields also disable their clear action.
- Panel exposes flat header/title/trigger/content parts and Base UI's `open/defaultOpen/onOpenChange` disclosure API. The default is closed; static panels use `open` and omit a trigger.
- SelectButton uses typed `items` and string-value arrays for both single and multiple selection; empty is `[]`. Replace `options`, property paths, scalar values and `onChange`. Base UI owns toggle and keyboard behavior.
- Add `tumAetUi.inputNumber.increment`, `.decrement` and `.roleDescription` translations. Remove unused MultiSelect selection-count and Select filtering-result messages with their obsolete components.

```tsx
<label id="course-label" htmlFor="course">Course</label>
<Select items={courses} value={course} onValueChange={setCourse}>
  <SelectTrigger id="course" aria-labelledby="course-label">
    <SelectValue placeholder="Choose a course" />
  </SelectTrigger>
  <SelectPortal>
    <SelectPositioner>
      <SelectPopup>
        <SelectList aria-labelledby="course-label" />
      </SelectPopup>
    </SelectPositioner>
  </SelectPortal>
</Select>
```

- Use native inputs for Checkbox, RadioButton and ToggleSwitch. Replace boolean callbacks with native `onChange` events for Checkbox/ToggleSwitch; refs target the actual inputs. `className`/`style` target the visual wrapper; other props/events target the input. Selection, submission and uncontrolled reset follow HTML/React.
- RadioGroup requires an explicit `name`, renders a fieldset and distributes `value/defaultValue`, form and constraints to native radios. `onValueChange(value, event)` receives a scalar and React input change event; option refs target inputs. It stores no uncontrolled selection. Values use strict equality and native string serialization; independently typed JSX children must use values from the intended root union. Controlled selection/reset remain caller-owned; changing uncontrolled defaults updates native reset defaults.

```tsx
<>
  <Checkbox name="terms" checked={accepted} onChange={(event) => setAccepted(event.currentTarget.checked)} />
  <RadioGroup
    name="frequency"
    defaultValue="weekly"
    onValueChange={(value, event) => console.log(value, event.currentTarget.name)}
  >
    <label>
      <RadioButton value="daily" />
      Daily
    </label>
    <label>
      <RadioButton value="weekly" />
      Weekly
    </label>
  </RadioGroup>
</>
```

- Keep Input and Textarea native. Field parts use explicit label, ID and ARIA associations; validation state and errors belong to the caller.
- Replace implicit FormField wiring and `controlId` with one render-function child. Spread its associations onto the intended labelable control:

```tsx
<FormField label="Title" invalid={invalid} error={error}>
  {(control) => <Input {...control} name="title" required />}
</FormField>
```

- Remove the public FormField context hooks. Use flat Field parts for custom IDs or groups, with explicit `htmlFor`, `aria-labelledby`, `aria-describedby` and `aria-invalid` as appropriate.
- Release detached object refs and honor React callback-ref cleanup in composite controls.

## 0.1.0

First release. **The API may change in any 0.x release.**

- React 19 port of the components of `@tumaet/ui-angular`, with the same `--tumaet-ui-*` design tokens, class names and light and dark theme.
- Only `react` and `react-dom` as peer dependencies, plain CSS in `@tumaet/ui-react/styles.css`.
- Not included: charts, the virtual-scroll table and the Angular `DialogService`.
