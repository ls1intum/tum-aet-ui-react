import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { TumAetUiI18nProvider } from '../../internal/i18n';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
  type DialogProps,
} from './dialog';

function Example(props: DialogProps) {
  return (
    <Dialog {...props}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup size="small">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Update your settings.</DialogDescription>
          <DialogClose />
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

describe('Dialog', () => {
  it('names and describes the popup, dismisses with Escape and restores trigger focus', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toHaveAccessibleDescription('Update your settings.');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it('preserves upstream details and cancellation for uncontrolled and controlled roots', async () => {
    const change = vi.fn<NonNullable<DialogProps['onOpenChange']>>((_open, details) => {
      details.cancel();
    });
    const { rerender } = render(<Example defaultOpen onOpenChange={change} />);
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(change).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press', isCanceled: true }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<Example open onOpenChange={change} />);
    await userEvent.keyboard('{Escape}');
    expect(change).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'escape-key', isCanceled: true }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('forwards the popup ref, classes and container, and translates the default close label', () => {
    const ref = createRef<HTMLDivElement>();
    const host = document.createElement('div');
    document.body.append(host);
    const { unmount } = render(
      <TumAetUiI18nProvider translate={(key) => (key === 'tumAetUi.dialog.close' ? 'Schließen' : key)}>
        <Dialog defaultOpen>
          <DialogPortal container={host}>
            <DialogBackdrop />
            <DialogPopup ref={ref} className={(state) => (state.open ? 'custom' : '')} aria-label="Named">
              <DialogClose />
            </DialogPopup>
          </DialogPortal>
        </Dialog>
      </TumAetUiI18nProvider>,
    );
    expect(ref.current).toBe(screen.getByRole('dialog', { name: 'Named' }));
    expect(ref.current).toHaveClass('tumaet-ui-dialog', 'custom');
    expect(host).toContainElement(ref.current);
    expect(screen.getByRole('button', { name: 'Schließen' })).toBeInTheDocument();
    unmount();
    host.remove();
  });

  it('has no axe violations', async () => {
    render(<Example defaultOpen />);
    await expectNoA11yViolations();
  });
});
