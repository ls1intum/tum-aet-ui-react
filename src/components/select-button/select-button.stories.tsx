import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { SelectButton } from './select-button';
const items = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const;
const meta = {
  title: 'Forms/Select Button',
  component: SelectButton,
  args: { 'aria-label': 'Reporting interval', items, defaultValue: ['day'] },
  parameters: {
    docs: {
      description: {
        component:
          'A non-form Base UI ToggleGroup with root-owned typed items. Single and multiple modes both use arrays; [] is empty. Values are unique nonempty strings compared by equality. onValueChange preserves Base UI cancellation details. Item props expose native button props, refs and render composition.',
      },
    },
  },
} satisfies Meta<typeof SelectButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Small: Story = { args: { size: 'small' } };
export const Large: Story = { args: { size: 'large' } };
export const Disabled: Story = { args: { disabled: true } };
export const Multiple: Story = {
  args: { multiple: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Week' }));
    await expect(canvas.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true');
    await expect(canvas.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true');
  },
};
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState<Array<'day' | 'week' | 'month'>>(['day']);
    return <SelectButton aria-label="Interval" items={items} value={value} onValueChange={setValue} />;
  },
};
export const CustomItems: Story = {
  args: {
    items: [
      { value: 'd', label: <abbr title="Day">D</abbr>, props: { 'aria-label': 'Day' } },
      { value: 'w', label: <abbr title="Week">W</abbr>, props: { 'aria-label': 'Week', disabled: true } },
    ],
  },
};
export const RightToLeft: Story = {
  render: (args) => (
    <DirectionProvider direction="rtl">
      <div dir="rtl">
        <SelectButton {...args} />
      </div>
    </DirectionProvider>
  ),
};
