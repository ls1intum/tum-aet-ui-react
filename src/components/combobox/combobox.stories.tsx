import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Combobox, type ComboboxProps } from './combobox';
import { ComboboxDemoParts, AsyncComboboxExample, languages } from './combobox.demo';

const meta = {
  title: 'Forms/Combobox',
  component: Combobox<string>,
  args: { items: languages, value: null },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<ComboboxProps<string>>();
    return (
      <Combobox
        {...args}
        value={value}
        onValueChange={(next, details) => {
          args.onValueChange?.(next, details);
          if (!details.isCanceled) updateArgs({ value: next });
        }}
      >
        <ComboboxDemoParts />
      </Combobox>
    );
  },
  argTypes: {
    items: {
      description:
        'Root-owned descriptors: unique stable key, typed value, string label, optional disabled. Retain selected descriptors during async searches.',
    },
    value: {
      description:
        'Required caller-owned selection: null for an empty single control, [] for multiple. Query text uses inputValue independently.',
    },
    renderItem: {
      description: 'Typed custom row content. Equality, filtering labels and serialized values are independent.',
    },
    renderChip: { description: 'Typed chip content. Include ComboboxChipRemove when removal is wanted.' },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Searchable selection using Base UI Combobox. No free-text values. Root-owned descriptors type callbacks and rendered items; arbitrary JSX descendants do not infer types from the root. Use isItemEqualToValue for object equality, itemToStringLabel for display/filtering and itemToStringValue for unique, nonempty submission strings. ComboboxChips renders selected descriptors with stable keys in selection order. Native required, disabled, readOnly, name and form are forwarded to Base UI. Selection is controlled: onReset may update caller state; respect defaultPrevented and use React DOM flushSync when synchronous FormData must see the reset. No reset policy leaves selection unchanged. Query/open state follows the public upstream API, including cancellation. Async search uses onInputValueChange and filter={null}; filteredItems contains server results while items retains selected descriptors. Portal accepts container: place its host inside the intended theme/direction boundary and outside clipping containers. Input, trigger and popup forward native refs and Base UI render/handler props.',
      },
    },
  },
} satisfies Meta<typeof Combobox<string>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: 'Course language' });
    await userEvent.type(input, 'ger');
    await userEvent.click(await screen.findByRole('option', { name: 'German' }));
    await expect(input).toHaveValue('German');
  },
};
export const Disabled: Story = { args: { disabled: true, value: 'German' } };
export const ReadOnly: Story = { args: { readOnly: true, value: 'German' } };
export const Empty: Story = { args: { items: [] } };
export const Multiple: Story = {
  render: function MultipleExample() {
    const [value, setValue] = useState<string[]>(['German']);
    return (
      <Combobox multiple items={languages} value={value} onValueChange={setValue}>
        <ComboboxDemoParts multiple />
      </Combobox>
    );
  },
};
export const ObjectValues: Story = {
  render: function ObjectExample() {
    const [value, setValue] = useState<{ code: string; title: string } | null>(null);
    return (
      <Combobox
        items={languages.map((item) => ({ ...item, value: { code: item.value.slice(0, 2), title: item.label } }))}
        value={value}
        onValueChange={setValue}
        isItemEqualToValue={(a, b) => a.code === b.code}
        itemToStringLabel={(item) => item.title}
        itemToStringValue={(item) => item.code}
        renderItem={(item) => <strong>{item.value.title}</strong>}
        name="language"
      >
        <ComboboxDemoParts />
      </Combobox>
    );
  },
};
async function searchLanguages(query: string, signal: AbortSignal) {
  // This fixture resolves asynchronously; an application can pass fetch(url, { signal }) instead.
  await Promise.resolve();
  signal.throwIfAborted();
  return languages.filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase()));
}
export const AsyncSearch: Story = { render: () => <AsyncComboboxExample search={searchLanguages} /> };
