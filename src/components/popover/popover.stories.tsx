import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';
import { Button } from '../button';
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverBackdrop,
  PopoverPositioner,
  PopoverPopup,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
} from './popover';
import PopoverDemo from './popover.demo';

function Example(props: React.ComponentProps<typeof Popover>) {
  return (
    <Popover {...props}>
      <PopoverTrigger render={<Button />}>More actions</PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner sideOffset={8}>
          <PopoverPopup>
            <PopoverTitle>Exercise actions</PopoverTitle>
            <PopoverDescription>Choose an action for this exercise.</PopoverDescription>
            <Button>Edit</Button>
            <PopoverClose render={<Button />}>Done</PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}
const meta = {
  title: 'Overlays/Popover',
  component: Popover,
  render: (args) => <Example {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'Nonmodal by default: Tab can leave the popover. Base UI owns focus, Escape/outside dismissal and nested portal layering. Use PopoverTitle/Description or aria-label to name the popup. Positioner exposes side, alignment, collision and scrolling options. Portal accepts container for scoped theme/direction inheritance. Call details.cancel() in onOpenChange to veto a request.',
      },
    },
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NoPadding: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>No padding</PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner>
          <PopoverPopup padding="none" aria-label="No-padding popover">
            <div style={{ padding: 8 }}>Content without panel padding</div>
            <PopoverClose>Done</PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  ),
};
export const Placements: Story = { render: () => <PopoverDemo /> };
export const InitiallyOpen: Story = { args: { defaultOpen: true } };
export const ClosesOnEscape: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'More actions' });
    await userEvent.click(trigger);
    const popup = await screen.findByRole('dialog', { name: 'Exercise actions' });
    await waitFor(async () => expect(popup).toBeVisible());
    await userEvent.keyboard('{Escape}');
    await waitFor(async () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Opt into modal interaction on the root and render a close control for touch screen readers. The backdrop is optional presentation.',
      },
    },
  },
  render: () => (
    <Popover modal>
      <PopoverTrigger render={<Button />}>Open modal popover</PopoverTrigger>
      <PopoverPortal>
        <PopoverBackdrop />
        <PopoverPositioner sideOffset={8}>
          <PopoverPopup>
            <PopoverTitle>Modal details</PopoverTitle>
            <PopoverDescription>Close to continue.</PopoverDescription>
            <PopoverClose render={<Button />}>Done</PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  ),
};
