# Changelog

All notable changes to `@tumaet/ui-react`. The version numbers are independent of `@tumaet/ui-angular`.

## 0.2.0 (unreleased)

- Layer tokens, base rules and components under `tumaet-ui`. Declare application layer order before stylesheet imports; replace references to `tumaet-ui-theme`. Theme aliases and nested scopes follow the [theming contract](docs/theming.mdx).
- Ship modular ESM and validate the packed artifact with fresh consumers. React and React DOM remain peers; Base UI is a runtime dependency.
- Compose Dialog and Popover from flat Root, Trigger, Portal and Popup parts, with Backdrop or Positioner as appropriate. Base UI owns their interaction; trigger handles preserve typed payloads. Dialog refs now target the rendered Base UI part rather than an `HTMLDialogElement`.
- Replace Select's `options`, property-name paths, `filter`, `onChange` and `defaultValue` API with typed keyed `items`, required controlled `value`, and `onValueChange`. Single empty selection is `null`; multiple empty selection is `[]`. Use `itemToStringLabel`, `itemToStringValue` and `isItemEqualToValue` for display, native submission and object equality. The caller owns selection and form-reset policy.
- Rename confirmation `header` to `title`. Confirmation promises settle on decisions, replacement or provider unmount; callback failures reject their request's promise.

```tsx
<Select items={courses} value={course} onValueChange={setCourse}>
  <SelectTrigger>
    <SelectValue placeholder="Choose a course" />
  </SelectTrigger>
  <SelectPortal>
    <SelectPositioner>
      <SelectPopup>
        <SelectList />
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
