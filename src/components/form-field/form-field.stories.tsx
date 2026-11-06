import { useId } from 'react';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from '../input/input';
import { Field, FieldDescription, FieldError, FieldLabel, FormField } from './form-field';

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div style={{ width: 'min(24rem, calc(100vw - 2rem))' }}>
      <Story />
    </div>
  );
}

const meta = {
  title: 'Forms/Form Field',
  component: FormField,
  parameters: {
    docs: {
      description: {
        component:
          'Native presentation parts with explicit id/htmlFor and ARIA associations. Validation state and error text belong to the caller or form library. ' +
          'FormField offers a render-function child: spread its id, aria-describedby and aria-invalid onto one native labelable control. ' +
          'The hint is replaced by the error while invalid. The required marker is decorative; set required on the control. ' +
          'For custom IDs, groups or nonlabelable widget roots, compose the flat parts with explicit aria-labelledby as appropriate. ' +
          'Field does not register controls, infer native validity, track dirty/touched state or synchronize resets.',
      },
    },
  },
  args: {
    label: 'Login',
    required: false,
    invalid: false,
    error: 'Enter a login',
    children: (control) => <Input {...control} />,
  },
  argTypes: { children: { control: false, description: 'Render function receiving native id and ARIA props.' } },
  decorators: [FormLayout],
  render: (args) => (
    <FormField {...args}>
      {(control) => <Input {...control} required={args.required} placeholder="ab12cde" />}
    </FormField>
  ),
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Required: Story = { args: { required: true } };
export const WithHint: Story = { args: { hint: 'Your TUM identifier, for example ab12cde.' } };
export const Invalid: Story = {
  args: { invalid: true, required: true },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: /Login/ });
    await expect(input).toHaveAttribute('aria-invalid', 'true');
    await expect(input).toHaveAccessibleDescription('Enter a login');
  },
};
export const InvalidReplacesTheHint: Story = {
  args: { invalid: true, hint: 'Your TUM identifier, for example ab12cde.' },
};

function ComposedField() {
  const base = useId();
  return (
    <Field data-invalid>
      <FieldLabel htmlFor={`${base}-title`}>Course title</FieldLabel>
      <Input id={`${base}-title`} name="title" required aria-invalid aria-describedby={`${base}-hint ${base}-error`} />
      <FieldDescription id={`${base}-hint`}>Visible in the course catalogue.</FieldDescription>
      <FieldError id={`${base}-error`}>Enter a course title.</FieldError>
    </Field>
  );
}

export const ComposedParts: Story = {
  render: () => <ComposedField />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText('Course title', { exact: true }));
    const input = canvas.getByRole('textbox', { name: 'Course title' });
    await expect(input).toHaveFocus();
    await expect(input).toHaveAccessibleDescription('Visible in the course catalogue. Enter a course title.');
  },
};
