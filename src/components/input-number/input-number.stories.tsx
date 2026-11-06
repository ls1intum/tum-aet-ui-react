import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { FormField } from '../form-field/form-field';
import { InputGroup, InputGroupAddon } from '../input-group/input-group';
import { InputNumber } from './input-number';

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div
      style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}
    >
      <Story />
    </div>
  );
}

const meta = {
  title: 'Forms/Input Number',
  component: InputNumber,
  parameters: {
    docs: {
      description: {
        component:
          'Numeric text field (`role="spinbutton"`) with locale grouping, optional prefix and suffix, optional decimals and ' +
          'step controls. The user types the locale digits, separators and minus sign; the field reformats while keeping the caret in place, ' +
          'and clamps to `min` and `max` on blur. ArrowUp and ArrowDown step by `step`; the optional buttons are for pointer users and ' +
          'stay out of the accessibility tree. `onChange` receives a number, or `null` when the field is empty.',
      },
    },
  },
  args: {
    'aria-label': 'Capacity',
    fluid: true,
    locale: 'en-US',
    max: 5000,
    min: 1,
    placeholder: 'Capacity',
    showButtons: true,
    step: 1,
    useGrouping: true,
  },
  decorators: [FormLayout],
} satisfies Meta<typeof InputNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FormatsTypedValue: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('spinbutton', { name: 'Capacity' });
    await userEvent.type(input, '1234');
    await expect(input).toHaveValue('1,234');
  },
};

export const KeyboardStepping: Story = {
  tags: ['!dev', '!autodocs'],
  args: { defaultValue: 4999 },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('spinbutton', { name: 'Capacity' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(input).toHaveValue('5,000');
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveValue('4,999');
  },
};

export const WithAffixes: Story = {
  args: {
    'aria-label': 'Repetition frequency',
    max: 48,
    placeholder: undefined,
    prefix: 'every ',
    suffix: ' week(s)',
    defaultValue: 2,
  },
};

export const WithoutButtons: Story = {
  args: { showButtons: false },
};

export const Decimals: Story = {
  args: {
    'aria-label': 'Price',
    maxFractionDigits: 2,
    prefix: '€ ',
    min: 0,
    step: 0.25,
    defaultValue: 12.5,
  },
};

export const SnapToStep: Story = {
  args: {
    'aria-label': 'Weight',
    maxFractionDigits: 1,
    min: 0,
    step: 0.5,
    snapToStep: true,
    defaultValue: 1.3,
  },
};

export const GermanLocale: Story = {
  args: {
    'aria-label': 'Gewicht',
    locale: 'de-DE',
    maxFractionDigits: 1,
    suffix: ' kg',
    defaultValue: 1234.5,
  },
};

export const Invalid: Story = {
  args: { invalid: true, defaultValue: 0 },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 25 },
};

export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: 25 },
};

export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = useState<number | null>(120);
    return (
      <>
        <InputNumber {...args} value={value} onChange={setValue} />
        <output aria-live="polite">Value: {value ?? 'empty'}</output>
      </>
    );
  },
};

export const InFormField: Story = {
  render: (args) => (
    <FormField label="Capacity" hint="Maximum tutorial group size">
      {(control) => <InputNumber {...args} {...control} aria-label={undefined} />}
    </FormField>
  ),
};

export const InInputGroup: Story = {
  args: { 'aria-label': undefined, 'aria-describedby': 'capacity-help', id: 'grouped-capacity', min: 0 },
  render: (args) => (
    <>
      <label htmlFor="grouped-capacity" style={{ fontWeight: 600 }}>
        Capacity
      </label>
      <InputGroup>
        <InputGroupAddon>#</InputGroupAddon>
        <InputNumber {...args} />
        <InputGroupAddon>places</InputGroupAddon>
      </InputGroup>
      <small id="capacity-help">Maximum tutorial group size</small>
    </>
  ),
};
