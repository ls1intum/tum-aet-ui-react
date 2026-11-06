import { useId, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Field, FieldDescription, FieldLabel } from '../form-field/form-field';
import { Checkbox } from './checkbox';

function InlineControl(Story: Parameters<Decorator>[0]) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--tumaet-ui-spacing) * 2)' }}>
      <Story />
    </div>
  );
}

const meta = {
  title: 'Forms/Checkbox',
  component: Checkbox,
  parameters: {
    docs: {
      description: {
        component:
          'Native input with AET appearance. Use checked/defaultChecked and native onChange events. ' +
          'ref targets the input; className/style target the visual wrapper. Other native props target the input. ' +
          'Uncontrolled selection and reset follow HTML/React defaults; controlled state and reset belong to the caller.',
      },
    },
  },
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    onChange: fn(),
  },
  argTypes: { onChange: { control: false } },
  decorators: [InlineControl],
  render: function Render({ checked, onChange, ...args }) {
    const generatedId = useId();
    const id = args.id ?? generatedId;
    const [value, setValue] = useState(checked ?? false);
    const [seen, setSeen] = useState(checked);
    if (seen !== checked) {
      // The Controls panel changed the arg: follow it.
      setSeen(checked);
      setValue(checked ?? false);
    }
    return (
      <label
        id={`${id}-label`}
        htmlFor={id}
        style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--tumaet-ui-spacing) * 2)' }}
      >
        <Checkbox
          name="terms"
          {...args}
          id={id}
          aria-labelledby={`${id}-label`}
          checked={value}
          onChange={(event) => {
            onChange?.(event);
            setValue(event.currentTarget.checked);
          }}
        />
        Accept the terms and conditions
      </label>
    );
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const box = canvas.getByRole('checkbox', { name: 'Accept the terms and conditions' });
    await userEvent.tab();
    await expect(box).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(box).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'change' }));
  },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Indeterminate: Story = {
  args: { indeterminate: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

export const DisabledUnchecked: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true },
};

export const InField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="checkbox-field">Terms</FieldLabel>
      <Checkbox id="checkbox-field" aria-describedby="checkbox-field-hint" />
      <FieldDescription id="checkbox-field-hint">You need to accept before continuing</FieldDescription>
    </Field>
  ),
};

const WRAPPING_LABEL =
  'Alle Passkeys löschen. Du musst deine Geräte erneut registrieren, bevor du dich das nächste Mal mit einem Passkey anmeldest.';

export const WrappingLabel: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, width: 120 }}>
      <Checkbox id="wrapping-checkbox" />
      <label htmlFor="wrapping-checkbox">{WRAPPING_LABEL}</label>
    </div>
  ),
};
