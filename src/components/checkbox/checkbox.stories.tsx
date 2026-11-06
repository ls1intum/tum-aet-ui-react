import { useId, useState } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { FormField } from '../form-field/form-field';
import { Checkbox } from './checkbox';

/** The element for `selector`, failing the story when it is missing. */
function requireElement(root: Element, selector: string): Element {
  const element = root.querySelector(selector);
  if (element === null) throw new Error(`No element matches ${selector}`);
  return element;
}

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
          'Native checkbox with the TUM AET UI look. Native props (`id`, `name`, `value`, `aria-*`) go to the `<input>`; `className` and `style` go to the wrapper. ' +
          'Label it with a `<label htmlFor>` or `aria-label`. `indeterminate` shows the partial-selection dash for a select-all control and never changes `checked`. ' +
          'The box keeps its square shape in tight rows and next to labels that wrap.',
      },
    },
  },
  args: {
    checked: false,
    disabled: false,
    indeterminate: false,
    invalid: false,
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
      <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--tumaet-ui-spacing) * 2)' }}>
        <Checkbox
          name="terms"
          {...args}
          id={id}
          checked={value}
          onChange={(next, event) => {
            setValue(next);
            onChange?.(next, event);
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
    await expect(args.onChange).toHaveBeenCalledWith(true, expect.anything());
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
  args: { invalid: true },
};

export const InFormField: Story = {
  render: () => (
    <FormField label="Terms" hint="You need to accept before continuing">
      {(field) => <Checkbox {...field} />}
    </FormField>
  ),
};

const WRAPPING_LABEL =
  'Alle Passkeys löschen. Du musst deine Geräte erneut registrieren, bevor du dich das nächste Mal mit einem Passkey anmeldest.';

/**
 * A checkbox stays square beside a label that wraps onto several lines.
 *
 * The box is sized from `--tumaet-ui-spacing` with a fallback and measured with a border-box, so neither a context that
 * does not carry the token nor a missing global reset deforms it. The box is measured rather than the wrapper, because
 * the box is what a reader actually sees.
 */
export const StaysSquareBesideAWrappingLabel: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ width: 420 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Checkbox id="wrap-centered" />
        <label htmlFor="wrap-centered">{WRAPPING_LABEL}</label>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Checkbox id="wrap-stretched" />
        <label htmlFor="wrap-stretched">{WRAPPING_LABEL}</label>
      </div>
      <div style={{ ['--tumaet-ui-spacing' as string]: 'initial', display: 'flex', gap: 8 }}>
        <Checkbox id="wrap-untokened" />
        <label htmlFor="wrap-untokened">{WRAPPING_LABEL}</label>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const id of ['wrap-centered', 'wrap-stretched', 'wrap-untokened']) {
      const box = requireElement(canvasElement, `#${id}`).nextElementSibling?.getBoundingClientRect();
      if (box === undefined) throw new Error(`${id} has no box`);
      await expect(box.width, `${id} width`).toBeGreaterThan(0);
      await expect(box.width, `${id} is square`).toBeCloseTo(box.height, 1);
    }
  },
};

export const StaysSquareInATightRow: Story = {
  tags: ['!dev', '!autodocs'],
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
      <Checkbox id="tight" />
      <label htmlFor="tight">A label far too long to fit beside the box in this row</label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const parent = requireElement(canvasElement, '#tight').parentElement;
    if (parent === null) throw new Error('#tight has no parent');
    const { width, height } = parent.getBoundingClientRect();
    await expect(width).toBeGreaterThan(0);
    await expect(width).toBeCloseTo(height, 1);
  },
};
