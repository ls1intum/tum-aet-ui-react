import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { FormField } from '../form-field/form-field';
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
          'On/off switch built on `<input type="checkbox" role="switch">`, so Space toggles it and the state reaches assistive technology natively. ' +
          'It needs an accessible name: a `<label htmlFor>`, `aria-label` or `aria-labelledby`. The handle respects `prefers-reduced-motion`, ' +
          'and the native control is shown in forced-colors mode.',
      },
    },
  },
  args: {
    checked: false,
    disabled: false,
    invalid: false,
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
          onChange={(next, event) => {
            setValue(next);
            onChange?.(next, event);
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
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything());
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
  args: { invalid: true },
};

export const InFormField: Story = {
  render: () => (
    <FormField label="Notifications" hint="Sent once a week">
      {(field) => <ToggleSwitch {...field} />}
    </FormField>
  ),
};
