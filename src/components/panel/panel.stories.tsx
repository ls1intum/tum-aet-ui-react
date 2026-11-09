import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Panel, PanelHeader, PanelTitle, PanelTrigger, PanelContent } from './panel';
const meta = {
  title: 'Data Display/Panel',
  component: Panel,
  subcomponents: { PanelHeader, PanelTitle, PanelTrigger, PanelContent },
  args: { defaultOpen: true },
  parameters: {
    docs: {
      description: {
        component:
          'Flat Collapsible parts with AET appearance. Base UI owns disclosure state, IDs, focusability and transitions. Compose additional header controls beside PanelTrigger. open/onOpenChange supports cancellation; defaultOpen is uncontrolled.',
      },
    },
  },
  render: (args) => (
    <Panel {...args}>
      <PanelHeader>
        <PanelTitle>Exercise details</PanelTitle>
        <PanelTrigger />
      </PanelHeader>
      <PanelContent>
        <p>Review the problem statement, due date and grading criteria.</p>
        <footer>Exercise footer</footer>
      </PanelContent>
    </Panel>
  ),
} satisfies Meta<typeof Panel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Collapsed: Story = {
  args: { defaultOpen: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Expand' }));
    await expect(canvas.getByRole('button', { name: 'Collapse' })).toHaveAttribute('aria-expanded', 'true');
  },
};
export const Controlled: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <Panel {...args} open={open} onOpenChange={setOpen}>
        <PanelHeader>
          <PanelTitle>Quiz exercises (2)</PanelTitle>
          <button type="button">Edit quiz</button>
          <PanelTrigger aria-label="Toggle quiz exercises" />
        </PanelHeader>
        <PanelContent>Quiz details</PanelContent>
      </Panel>
    );
  },
};
export const Static: Story = {
  render: () => (
    <Panel open>
      <PanelHeader>
        <PanelTitle>Static panel</PanelTitle>
      </PanelHeader>
      <PanelContent>Always visible.</PanelContent>
    </Panel>
  ),
};
