import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { FormField } from '../form-field/form-field';
import { InputGroup, InputGroupAddon } from '../input-group/input-group';
import { InputNumber } from './input-number';
const meta = {
  title: 'Forms/Input Number',
  component: InputNumber,
  args: { value: 12.5, 'aria-label': 'Capacity', locale: 'en-US', showButtons: true, min: 0, max: 5000 },
  argTypes: { rootProps: { control: false }, onValueChange: { control: false }, onValueCommitted: { control: false } },
  parameters: {
    docs: {
      description: {
        component:
          'Controlled Base UI NumberField. value is a number or null; onValueChange includes cancellation details and onValueCommitted reports commits. Caller owns form reset policy. Native props, id, className, render and ref target the visible input; rootProps targets the wrapper. Base UI owns locale parsing, Intl format, bounds, stepping and holding. prefix/suffix are decorative; format supplies parsed currency and units.',
      },
    },
  },
  render: function Example(args) {
    const [value, setValue] = useState(args.value);
    return (
      <InputNumber
        {...args}
        value={value}
        onValueChange={(next, details) => {
          args.onValueChange?.(next, details);
          if (!details.isCanceled) setValue(next);
        }}
      />
    );
  },
} satisfies Meta<typeof InputNumber>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const KeyboardStepping: Story = {
  args: { value: 4999 },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Capacity' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await expect(input).toHaveValue('5,000');
    await userEvent.keyboard('{ArrowDown}');
    await expect(input).toHaveValue('4,999');
  },
};
export const WithAffixes: Story = { args: { prefix: 'every', suffix: 'weeks', value: 2 } };
export const WithoutButtons: Story = { args: { showButtons: false } };
export const Decimals: Story = { args: { format: { style: 'currency', currency: 'EUR' }, step: 0.25 } };
export const SnapToStep: Story = {
  args: { format: { maximumFractionDigits: 1 }, step: 0.5, snapOnStep: true, value: 1.3 },
};
export const GermanLocale: Story = {
  args: { locale: 'de-DE', value: 1234.5, format: { style: 'unit', unit: 'kilogram' } },
};
export const Invalid: Story = { args: { invalid: true } };
export const Disabled: Story = { args: { disabled: true } };
export const ReadOnly: Story = { args: { readOnly: true } };
export const InFormField: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <FormField label="Capacity" hint="Maximum tutorial group size">
        {(control) => (
          <InputNumber {...args} {...control} aria-label={undefined} value={value} onValueChange={setValue} />
        )}
      </FormField>
    );
  },
};
export const InInputGroup: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <InputGroup>
        <InputGroupAddon>#</InputGroupAddon>
        <InputNumber {...args} value={value} onValueChange={setValue} />
        <InputGroupAddon>places</InputGroupAddon>
      </InputGroup>
    );
  },
};
