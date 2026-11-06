import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input, Textarea } from './input';

function FormLayout(Story: Parameters<Decorator>[0]) {
  return (
    <div
      style={{ display: 'grid', gap: 'calc(var(--tumaet-ui-spacing) * 2)', width: 'min(20rem, calc(100vw - 2rem))' }}
    >
      <Story />
    </div>
  );
}

const labelStyle = { fontWeight: 600 } as const;
const errorStyle = { color: 'var(--tumaet-ui-state-danger-foreground)', fontSize: '0.875rem' } as const;

const meta = {
  title: 'Forms/Input',
  component: Input,
  parameters: {
    docs: {
      description: {
        component:
          'Native `<input>` with the TUM AET UI look, in three sizes. `Textarea` has the same look for multi-line text. ' +
          'Both work with the flat `Field` parts or the convenient `FormField`; on their own they set `aria-invalid` ' +
          'only while `invalid` is true. Native props, DOM event callbacks and element refs are preserved. ' +
          'Use `defaultValue` for native reset; controlled values remain owned by the caller. ' +
          'Give them a visible `<label htmlFor>` or an `aria-label`.',
      },
    },
  },
  args: {
    placeholder: 'Introduction to Computer Science',
    size: 'default',
    invalid: false,
    disabled: false,
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['small', 'default', 'large'] },
  },
  decorators: [FormLayout],
  render: (args) => (
    <>
      <label htmlFor="course-title" style={labelStyle}>
        Course title
      </label>
      <Input id="course-title" aria-describedby={args.invalid === true ? 'course-title-error' : undefined} {...args} />
      {args.invalid === true ? (
        <div id="course-title-error" role="alert" style={errorStyle}>
          Enter a course title.
        </div>
      ) : null}
    </>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { invalid: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('textbox', { name: 'Course title' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).outlineWidth).toBe('2px');
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Sizes: Story = {
  render: (args) => (
    <>
      {(['small', 'default', 'large'] as const).map((size) => (
        <Input key={size} {...args} size={size} aria-label={`${size} input`} placeholder={`${size} input`} />
      ))}
    </>
  ),
};

export const WithValue: Story = {
  args: { defaultValue: 'Advanced Software Engineering' },
};

export const Multiline: Story = {
  render: ({ size, invalid, disabled }) => (
    <>
      <label htmlFor="course-description" style={labelStyle}>
        Course description
      </label>
      <Textarea
        id="course-description"
        rows={4}
        placeholder="Describe the course"
        size={size}
        invalid={invalid}
        disabled={disabled}
        aria-describedby={invalid === true ? 'course-description-error' : undefined}
      />
      {invalid === true ? (
        <div id="course-description-error" role="alert" style={errorStyle}>
          Enter a course description.
        </div>
      ) : null}
    </>
  ),
};
