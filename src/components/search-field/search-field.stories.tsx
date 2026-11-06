import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { FormField } from '../form-field/form-field';
import { SearchField } from './search-field';

const meta = {
  title: 'Forms/Search Field',
  component: SearchField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Text field (`type="search"`) for filtering a view: a leading magnifier and a clear button that appears once there is a term. ' +
          '`onChange` fires on every keystroke, so debounce in the consumer if the term drives a request. The clear button empties the field and returns focus to it. ' +
          'The placeholder defaults to the translated "Search" and is also the accessible name, unless `aria-label`, `aria-labelledby` or an explicit `id` for a visible label is supplied. Spread the render-function props when using `FormField`.',
      },
    },
  },
  args: {
    value: '',
    disabled: false,
    invalid: false,
    size: 'default',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
  },
  render: function Render({ value, onChange, ...args }) {
    const [term, setTerm] = useState(value ?? '');
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
      // The Controls panel changed the arg: follow it.
      setSeen(value);
      setTerm(value ?? '');
    }
    return (
      <SearchField
        {...args}
        value={term}
        onChange={(next) => {
          setTerm(next);
          onChange?.(next);
        }}
      />
    );
  },
} satisfies Meta<typeof SearchField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('searchbox', { name: 'Search' });
    await expect(canvas.queryByRole('button')).toBeNull();
    await userEvent.type(input, 'Garching');
    await userEvent.click(canvas.getByRole('button', { name: 'Clear search' }));
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
  },
};

export const WithTerm: Story = {
  args: { value: 'Tue-1-Mu-1' },
};

/** Matches the height of `size="small"` buttons, as in a page's title bar. */
export const Small: Story = {
  args: { size: 'small', value: 'Garching' },
};

export const Large: Story = {
  args: { size: 'large', value: 'Garching' },
};

export const Disabled: Story = {
  args: { value: 'Munich', disabled: true },
};

export const Invalid: Story = {
  args: { value: 'Munich', invalid: true },
};

export const CustomPlaceholder: Story = {
  args: { placeholder: 'Find a tutorial group' },
};

export const InFormField: Story = {
  render: () => (
    <FormField label="Tutorial group" hint="Search by name or room" style={{ width: 'min(24rem, 100%)' }}>
      {(control) => <SearchField {...control} />}
    </FormField>
  ),
};

export const RightToLeft: Story = {
  render: (args) => (
    <div dir="rtl">
      <SearchField {...args} defaultValue="Garching" value={undefined} />
    </div>
  ),
};
