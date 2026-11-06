import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Field, FieldDescription, FieldLabel } from '../form-field/form-field';
import { ToggleSwitch } from './toggle-switch';

function InlineControl(Story: Parameters<Decorator>[0]) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--tumaet-ui-spacing) * 2)' }}>
      <Story />
    </div>
  );
}

const meta = {
  title: 'Forms/Toggle Switch',
  component: ToggleSwitch,
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
    onChange: fn(),
  },
  argTypes: { onChange: { control: false } },
  decorators: [InlineControl],
  render: function Render({ checked, onChange, ...args }) {
    const [value, setValue] = useState(checked ?? false);
    const [seen, setSeen] = useState(checked);
    if (seen !== checked) {
      // The Controls panel changed the arg: follow it.
      setSeen(checked);
      setValue(checked ?? false);
    }
    return (
      <>
        <span id="notification-label">Email notifications</span>
        <ToggleSwitch
          id="notifications"
          aria-labelledby="notification-label"
          {...args}
          checked={value}
          onChange={(event) => {
            onChange?.(event);
            setValue(event.currentTarget.checked);
          }}
        />
      </>
    );
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole('switch', { name: 'Email notifications' });
    await userEvent.tab();
    await expect(toggle).toHaveFocus();
    await userEvent.keyboard(' ');
    await expect(toggle).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith(expect.objectContaining({ type: 'change' }));
  },
};

export const On: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

export const DisabledOff: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true },
};

export const InField: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="toggle-switch-field">Notifications</FieldLabel>
      <ToggleSwitch id="toggle-switch-field" aria-describedby="toggle-switch-field-hint" />
      <FieldDescription id="toggle-switch-field-hint">Sent once a week</FieldDescription>
    </Field>
  ),
};
