import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Field, FieldDescription } from '../form-field/form-field';
import { RadioButton, RadioGroup } from './radio-button';

const OPTIONS = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Never', value: 'never' },
] as const;

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div
      style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}
    >
      <Story />
    </div>
  );
}

const optionStyle = { display: 'flex', alignItems: 'center', gap: 'calc(var(--tumaet-ui-spacing) * 2)' } as const;

const meta = {
  title: 'Forms/Radio Button',
  component: RadioGroup,
  subcomponents: { RadioButton },
  parameters: {
    docs: {
      description: {
        component:
          'Native fieldset and radio inputs with AET appearance. A required name enables native exclusivity, keyboard navigation and submission. ' +
          'value/defaultValue use strings or numbers (strict equality); null clears controlled selection. onValueChange receives the selected value and native React change event. ' +
          'JSX children are independently typed. Use distinct serialized values. Group ref targets the fieldset; option ref targets its input. ' +
          'Option className/style target the visual wrapper. Uncontrolled reset follows native defaults; controlled state/reset belong to the caller.',
      },
    },
  },
  args: {
    name: 'email-summary',
    value: 'weekly',
    disabled: false,
    onValueChange: fn(),
  },
  argTypes: {
    value: { control: 'inline-radio', options: OPTIONS.map((option) => option.value) },
    onValueChange: { control: false },
  },
  decorators: [FormLayout],
  render: function Render({ value, onValueChange, ...args }) {
    const [selected, setSelected] = useState(value);
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
      // The Controls panel changed the arg: follow it.
      setSeen(value);
      setSelected(value);
    }
    return (
      <form>
        <RadioGroup
          aria-label="Email summary"
          {...args}
          value={selected}
          onValueChange={(next, event) => {
            onValueChange?.(next, event);
            setSelected(next);
          }}
        >
          <legend style={{ fontWeight: 600, marginBlockEnd: 'calc(var(--tumaet-ui-spacing) * 2)' }}>
            Email summary
          </legend>
          {OPTIONS.map((option) => (
            <label key={option.value} style={optionStyle}>
              <RadioButton value={option.value} />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </form>
    );
  },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selection: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await userEvent.click(canvas.getByRole('radio', { name: 'Daily' }));
    await expect(canvas.getByRole('radio', { name: 'Daily' })).toBeChecked();
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).not.toBeChecked();
    await expect(args.onValueChange).toHaveBeenCalledWith('daily', expect.anything());
  },
};

export const KeyboardNavigation: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('radio', { name: 'Weekly' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Never' })).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    await expect(canvas.getByRole('radio', { name: 'Daily' })).toBeChecked();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const InField: Story = {
  render: () => (
    <Field>
      <span id="format-label" className="tumaet-ui-form-field-label">
        Format
      </span>
      <RadioGroup name="format" defaultValue="pdf" aria-labelledby="format-label" aria-describedby="format-hint">
        <label id="format-pdf-label" htmlFor="format-pdf">
          PDF
        </label>
        <RadioButton id="format-pdf" aria-labelledby="format-pdf-label" value="pdf" />
      </RadioGroup>
      <FieldDescription id="format-hint">Applies to all courses</FieldDescription>
    </Field>
  ),
};

export const Invalid: Story = {
  render: () => (
    <RadioGroup name="invalid-summary" aria-label="Email summary" defaultValue={null} aria-invalid>
      {OPTIONS.map((option) => (
        <label key={option.value} style={optionStyle}>
          <RadioButton value={option.value} aria-label={option.label} aria-invalid />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  ),
};

export const Uncontrolled: Story = {
  render: () => (
    <form>
      <RadioGroup aria-label="Summary frequency" name="frequency" defaultValue="weekly">
        {OPTIONS.map((option) => (
          <label key={option.value} style={optionStyle}>
            <RadioButton value={option.value} />
            {option.label}
          </label>
        ))}
      </RadioGroup>
      <button type="reset">Restore weekly</button>
    </form>
  ),
};

export const WrappingLabel: Story = {
  render: () => (
    <RadioGroup
      name="wrapping"
      aria-label="Wrapping option"
      defaultValue="yes"
      style={{ flexDirection: 'row', gap: 8, width: 120 }}
    >
      <RadioButton id="wrapping-radio" value="yes" />
      <label htmlFor="wrapping-radio">A long option label that wraps beside the control</label>
    </RadioGroup>
  ),
};
