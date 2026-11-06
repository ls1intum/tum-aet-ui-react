import { useId, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent, waitFor, waitForElementToBeRemoved, within } from 'storybook/test';
import { DatePicker, type DatePickerProps } from './date-picker';

/** A picker with its own state and a visible label, so each story works on its own. */
function Field({ value: initial, onValueChange, ...props }: DatePickerProps) {
  const [value, setValue] = useState<Date | null>(initial ?? null);
  const id = useId();
  const label = props['aria-label'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label !== undefined && label !== '' && props.inline !== true ? (
        <label htmlFor={id} style={{ fontWeight: 600 }}>
          {label}
        </label>
      ) : null}
      <DatePicker
        {...props}
        id={id}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValueChange?.(next);
        }}
      />
    </div>
  );
}

const meta = {
  title: 'Forms/Date Picker',
  component: DatePicker,
  args: {
    'aria-label': 'Deadline',
    value: new Date(2026, 5, 13, 8, 30),
    showTimeZoneWarning: true,
  },
  argTypes: {
    value: { control: false },
    defaultValue: { control: false },
    startAt: { control: false },
    min: { control: false },
    max: { control: false },
  },
  render: (args) => <Field {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'Date-and-time field with typed input (`DD.MM.YYYY HH:mm`) and a nonmodal calendar popup. Done and Escape return focus to the text field; Tab can leave the popup. `portalContainer` places the popup and time-zone tooltip within a scoped theme. The picker does not expose native submission or reset; controlled values and reset policy belong to the caller. `timeOnly` reduces it to a time, `dateOnly` to a date, `inline` shows the calendar and the time steppers in place. The value is a `Date` in the local time zone, `null` when empty. Invalid text stays in the field without changing the value; `onInputValidityChange` reports it. Give the field a name with a `<label htmlFor>` pointing at `id`, or with `aria-label` / `aria-labelledby`.',
      },
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CalendarInteraction: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Open calendar' });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Choose date and time' });
    await expect(within(dialog).getByRole('grid')).toBeVisible();
    const selectedDay = within(dialog).getByRole('gridcell', { selected: true }).querySelector('button');
    // The popup is positioned first, then the focus moves to the selected day.
    await waitFor(async () => expect(selectedDay).toHaveFocus());

    const dialogRemoved = waitForElementToBeRemoved(dialog);
    await userEvent.keyboard('{Escape}');
    await dialogRemoved;
    await expect(canvas.getByRole('combobox', { name: 'Deadline' })).toHaveFocus();

    await userEvent.click(canvas.getByRole('button', { name: 'Clear date' }));
    const input = canvas.getByRole('combobox', { name: 'Deadline' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).outlineWidth).toBe('2px');
  },
};

export const LimitedRange: Story = {
  args: {
    value: new Date(2026, 5, 15, 8, 30),
    min: new Date(2026, 5, 10),
    max: new Date(2026, 5, 20),
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Open calendar' }));

    const dialog = await screen.findByRole('dialog', { name: 'Choose date and time' });
    const before = dialog.querySelector('button[data-date="2026-06-09"]');
    const inside = dialog.querySelector('button[data-date="2026-06-12"]');
    await expect(before).toHaveAttribute('aria-disabled', 'true');
    await expect(inside).not.toHaveAttribute('aria-disabled');
  },
};

export const DateOnly: Story = {
  args: { 'aria-label': 'Access end', dateOnly: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('combobox', { name: 'Access end' })).toHaveValue('13.06.2026');
    await userEvent.click(canvas.getByRole('button', { name: 'Open calendar' }));
    const dialog = await screen.findByRole('dialog', { name: 'Choose date' });
    await expect(within(dialog).queryByRole('group', { name: 'Time' })).toBeNull();
  },
};

export const TimeOnly: Story = {
  args: { 'aria-label': 'Session start', timeOnly: true },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Session start' });
    await expect(field).toHaveValue('08:30');

    const trigger = canvas.getByRole('button', { name: 'Open clock' });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Choose time' });
    await expect(within(dialog).queryByRole('grid')).toBeNull();

    const hour = within(dialog).getByRole('textbox', { name: 'Hour' });
    await userEvent.clear(hour);
    await userEvent.type(hour, '10');
    await userEvent.tab();

    await expect(field).toHaveValue('10:30');
  },
};

export const TimeOnlyInvalid: Story = {
  args: { 'aria-label': 'Session start', timeOnly: true },
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Session start' });
    await userEvent.clear(field);
    await userEvent.type(field, '13.06.2026 08:30');

    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid time.');
  },
};

export const InlineTime: Story = {
  args: { 'aria-label': 'Session start', timeOnly: true, inline: true },
  play: async ({ canvas }) => {
    // No field to open: the steppers are the control, shown in place.
    await expect(canvas.queryByRole('combobox')).toBeNull();
    const hour = canvas.getByRole('textbox', { name: 'Hour' });
    await expect(hour).toHaveValue('08');

    await userEvent.click(canvas.getByRole('button', { name: 'Increment hour' }));
    await expect(hour).toHaveValue('09');
  },
};

export const InlineDateTime: Story = {
  args: { 'aria-label': 'Start', inline: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('group', { name: 'Start' })).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: /^Saturday, June 20, 2026/ }));
    await expect(canvas.getByRole('gridcell', { selected: true })).toHaveTextContent('20');
  },
};

export const InlineRtl: Story = {
  args: { 'aria-label': 'Start', inline: true, dateOnly: true },
  tags: ['!autodocs'],
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvas }) => {
    // The grid runs right to left, so ArrowRight goes to the previous day.
    const selected = canvas.getByRole('button', { name: /^Saturday, June 13, 2026/ });
    selected.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('button', { name: /^Friday, June 12, 2026/ })).toHaveFocus();
  },
};

export const Empty: Story = {
  args: { value: null },
};

export const Invalid: Story = {
  args: { 'aria-invalid': true, value: null },
};

export const InvalidText: Story = {
  args: { value: null },
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Deadline' });
    await userEvent.type(field, '31.02.2026 08:30');
    await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a valid date and time.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const ValidateOnBlur: Story = {
  args: { validateOnBlur: true, value: null },
  tags: ['!autodocs'],
  play: async ({ canvas }) => {
    const field = canvas.getByRole('combobox', { name: 'Deadline' });
    await userEvent.type(field, '13.06.20');
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.tab();
    await expect(canvas.getByRole('alert')).toBeVisible();
  },
};

export const OpenOnClick: Story = {
  args: { openOnClick: true },
};

export const StartAt: Story = {
  args: { value: null, startAt: new Date(2027, 0, 1) },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledEmpty: Story = {
  args: { disabled: true, value: null },
};

function ScopedField(props: DatePickerProps) {
  const host = useRef<HTMLDivElement>(null);
  return (
    <div className="tumaet-ui-root" data-theme="dark" style={{ padding: 24 }}>
      <div style={{ overflow: 'hidden', height: 64 }}>
        <Field {...props} portalContainer={host} />
      </div>
      <div ref={host} />
    </div>
  );
}

export const ScopedTheme: Story = {
  render: (args) => <ScopedField {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'The portal host sits inside the dark theme and outside the clipping container. Both the calendar and time-zone tooltip inherit the destination theme.',
      },
    },
  },
};
