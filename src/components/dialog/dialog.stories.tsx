import type { Meta, StoryObj } from '@storybook/react-vite';
import { useRef } from 'react';
import { expect, screen, waitFor } from 'storybook/test';
import { Button } from '../button';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

function Example(props: React.ComponentProps<typeof Dialog>) {
  return (
    <Dialog {...props}>
      <DialogTrigger render={<Button />}>Open confirmation</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size="medium">
          <div className="tumaet-ui-dialog-header">
            <DialogTitle>Confirm enrollment</DialogTitle>
            <DialogClose />
          </div>
          <div className="tumaet-ui-dialog-content">
            <DialogDescription>Enroll in Advanced Software Engineering?</DialogDescription>
          </div>
          <div className="tumaet-ui-dialog-footer">
            <DialogClose render={<Button severity="secondary" />}>Cancel</DialogClose>
            <DialogClose render={<Button />}>Enroll</DialogClose>
          </div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

const meta = {
  title: 'Overlays/Dialog',
  component: Dialog,
  render: (args) => <Example {...args} />,
  parameters: {
    docs: {
      description: {
        component:
          'Flat compound parts backed by Base UI. Dialog is modal by default. Name the popup with DialogTitle or aria-label; DialogDescription supplies its description. Element props and React 19 refs belong to each rendered part. onOpenChange receives upstream event details: call details.cancel() to veto a request. Portal accepts container; place that host inside the intended theme/direction scope and outside clipping containers.',
      },
    },
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Open: Story = { args: { defaultOpen: true }, tags: ['!autodocs'] };
export const ClosesDialog: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Open confirmation' });
    await userEvent.click(trigger);
    await expect(await screen.findByRole('dialog', { name: 'Confirm enrollment' })).toHaveAccessibleDescription(
      'Enroll in Advanced Software Engineering?',
    );
    await userEvent.keyboard('{Escape}');
    await waitFor(async () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await expect(trigger).toHaveFocus();
  },
};
export const RequiredDecision: Story = {
  args: {
    disablePointerDismissal: true,
    onOpenChange: (open, details) => {
      if (!open && details.reason === 'escape-key') details.cancel();
    },
  },
};
export const DismissableMask: Story = {};
export const Small: Story = { render: () => <DialogDemoSize size="small" /> };
export const Large: Story = { render: () => <DialogDemoSize size="large" /> };
export const Full: Story = { render: () => <DialogDemoSize size="full" /> };
export const ContentSized: Story = { render: () => <DialogDemoSize /> };
function DialogDemoSize({ size }: { size?: 'small' | 'large' | 'full' }) {
  return (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size={size}>
          <div className="tumaet-ui-dialog-header">
            <DialogTitle>Content</DialogTitle>
            <DialogClose />
          </div>
          <div className="tumaet-ui-dialog-content">AET dimensions</div>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
export const WithoutHeader: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup aria-label="Enrollment confirmation">
          <DialogClose />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  ),
};
export const LongContent: Story = {
  render: function LongContentExample() {
    const title = useRef<HTMLHeadingElement>(null);
    return (
      <Dialog>
        <DialogTrigger>Open long content</DialogTrigger>
        <DialogPortal>
          <DialogBackdrop />
          <DialogPopup size="small" initialFocus={title}>
            <div className="tumaet-ui-dialog-header">
              <DialogTitle ref={title} tabIndex={-1}>
                Long content
              </DialogTitle>
              <DialogClose />
            </div>
            <div className="tumaet-ui-dialog-content">
              {Array.from({ length: 30 }, (_, index) => (
                <p key={index}>Paragraph {index + 1}</p>
              ))}
            </div>
          </DialogPopup>
        </DialogPortal>
      </Dialog>
    );
  },
};
