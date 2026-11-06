import { useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, waitFor } from 'storybook/test';
import { FormField } from '../form-field/form-field';
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

/** Narrows an element a play function expects to find. */
function required<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('Expected the element to be present');
  return value;
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
          '`RadioGroup` (`role="radiogroup"`) around `RadioButton`s. The radios are native inputs sharing a `name`, so the browser provides ' +
          'the WAI-ARIA keyboard model: one tab stop, arrow keys move and select, wrapping, skipping disabled radios. ' +
          'Give the group an accessible name with `aria-label` or `aria-labelledby`. A `RadioButton` also works on its own: ' +
          'controlled with `checked`, or uncontrolled, where the browser keeps radios with the same `name` exclusive.',
      },
    },
  },
  args: {
    value: 'weekly',
    disabled: false,
    onChange: fn(),
  },
  argTypes: {
    value: { control: 'inline-radio', options: OPTIONS.map((option) => option.value) },
    onChange: { control: false },
  },
  decorators: [FormLayout],
  render: function Render({ value, onChange, ...args }) {
    const [selected, setSelected] = useState(value);
    const [seen, setSeen] = useState(value);
    if (seen !== value) {
      // The Controls panel changed the arg: follow it.
      setSeen(value);
      setSelected(value);
    }
    return (
      <form>
        <fieldset
          style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', margin: 0, padding: 0, border: 0 }}
        >
          <legend style={{ fontWeight: 600, marginBlockEnd: 'calc(var(--tumaet-ui-spacing) * 2)' }}>
            Email summary
          </legend>
          <RadioGroup
            aria-label="Email summary"
            name="email-summary"
            {...args}
            value={selected}
            onChange={(next) => {
              setSelected(next);
              onChange?.(next);
            }}
          >
            {OPTIONS.map((option) => (
              <label key={option.value} style={optionStyle}>
                <RadioButton value={option.value} />
                {option.label}
              </label>
            ))}
          </RadioGroup>
        </fieldset>
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
    await waitFor(async () => expect(canvas.getByRole('radio', { name: 'Daily' })).toBeChecked());
    await waitFor(async () => expect(canvas.getByRole('radio', { name: 'Weekly' })).not.toBeChecked());

    await userEvent.click(canvas.getByRole('radio', { name: 'Never' }));
    await waitFor(async () => expect(canvas.getByRole('radio', { name: 'Never' })).toBeChecked());
    await waitFor(async () => expect(canvas.getByRole('radio', { name: 'Daily' })).not.toBeChecked());
    const radios = ['Daily', 'Weekly', 'Never'].map((name) => canvas.getByRole('radio', { name }));
    await waitFor(async () => {
      const backgrounds = radios.map((radio) => getComputedStyle(required(radio.nextElementSibling)).backgroundColor);
      await expect(backgrounds[0]).toBe(backgrounds[1]);
      await expect(backgrounds[2]).not.toBe(backgrounds[0]);
    });
    await expect(args.onChange).toHaveBeenCalledWith('daily');
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

export const InFormField: Story = {
  render: () => (
    <FormField label="Format" hint="Applies to all courses">
      {(field) => <RadioButton {...field} name="format" value="pdf" defaultChecked />}
    </FormField>
  ),
};

export const Invalid: Story = {
  render: () => (
    <RadioGroup aria-label="Email summary" defaultValue={null}>
      {OPTIONS.map((option) => (
        <label key={option.value} style={optionStyle}>
          <RadioButton value={option.value} invalid />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  ),
};

export const StandaloneUncontrolled: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {OPTIONS.map((option) => (
        <label key={option.value} style={optionStyle}>
          <RadioButton name="standalone" value={option.value} defaultChecked={option.value === 'weekly'} />
          {option.label}
        </label>
      ))}
    </div>
  ),
};

/**
 * A radio button keeps its round shape when the row around it runs out of room.
 *
 * Flex items shrink by default, and the control has a fixed height but no shrink floor, so a long label in a narrow row
 * would squeeze it into an oval. Zooming the page reproduces it the same way. The row below is deliberately too narrow for its label.
 */
export const StaysRoundInATightRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
      <RadioButton id="tight" name="tight" value="tight" />
      <label htmlFor="tight">A label far too long to fit beside the control in this row</label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const { width, height } = required(
      required(canvasElement.querySelector('#tight')).parentElement,
    ).getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(width).toBeCloseTo(height, 1);
  },
};

/**
 * A selected radio button still shows its dot where the spacing token does not reach.
 *
 * The indicator has no content of its own, so an invalid `calc()` would leave both dimensions at auto, which is zero:
 * the ring would render and the control would look unselected while being selected.
 */
export const ShowsTheSelectedDotWithoutTheSpacingToken: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ ['--tumaet-ui-spacing' as string]: 'initial', display: 'flex', alignItems: 'center', gap: 8 }}>
      <RadioButton id="untokened" name="untokened" value="picked" defaultChecked />
      <label htmlFor="untokened">Selected in a context that carries no spacing token</label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const wrapper = required(required(canvasElement.querySelector('#untokened')).parentElement);
    const host = wrapper.getBoundingClientRect();
    const indicator = required(wrapper.querySelector('.tumaet-ui-radio-button-icon')).getBoundingClientRect();
    await expect(host.width, 'the ring is round').toBeCloseTo(host.height, 1);
    await expect(indicator.width, 'the dot has a size').toBeGreaterThan(0);
    await expect(indicator.width, 'the dot is round').toBeCloseTo(indicator.height, 1);
    await expect(indicator.width, 'the dot fits inside the ring').toBeLessThan(host.width);
  },
};
