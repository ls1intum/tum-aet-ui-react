import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Splitter } from './splitter';

const meta = {
  title: 'Layout/Splitter',
  component: Splitter,
  args: {
    layout: 'horizontal',
    panelSizes: [60, 40],
    minSizes: [20, 20],
    separatorLabel: 'Resize workspace panels',
    collapsedSecondSize: undefined,
    gutterSize: undefined,
    onSizesChange: fn(),
    onResizeEnd: fn(),
    children: [
      <section key="a" style={{ padding: '1rem' }}>
        <h2>Workspace</h2>
        <p>Drag or focus the divider to resize the panels.</p>
        <button type="button">Edit submission</button>
      </section>,
      <section key="b" style={{ padding: '1rem' }}>
        <h2>Instructions</h2>
        <p>Both panels retain their contents while resizing.</p>
      </section>,
    ],
  },
  argTypes: {
    layout: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '24rem', width: '48rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Two persistent panels separated by a keyboard and pointer operated separator (`role="separator"`). Sizes and minimums are percentages of the available space without the gutter. Arrow keys along the layout axis adjust by two percentage points (ten with Shift), Home and End jump to the limits. Both panels stay mounted when the second one is collapsed.',
      },
    },
  },
} satisfies Meta<typeof Splitter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const separator = within(canvasElement).getByRole('separator', { name: 'Resize workspace panels' });
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(separator).toHaveAttribute('aria-valuenow', '62');
    await expect(args.onResizeEnd).toHaveBeenLastCalledWith([62, 38]);
  },
};

export const Vertical: Story = {
  args: { layout: 'vertical' },
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator');
    separator.focus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(separator).toHaveAttribute('aria-valuenow', '62');
  },
};

export const CollapsedSecondPanel: Story = { args: { collapsedSecondSize: '3rem' } };

export const CustomGutter: Story = { args: { gutterSize: 16 } };

export const RightToLeft: Story = {
  decorators: [
    (Story) => (
      <div dir="rtl" style={{ height: '100%' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const separator = within(canvasElement).getByRole('separator');
    separator.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(separator).toHaveAttribute('aria-valuenow', '62');
  },
};

export const PersistedSize: Story = {
  args: { stateKey: 'storybook-splitter' },
};
