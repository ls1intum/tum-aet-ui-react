import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
  PopoverTitle,
  PopoverDescription,
  PopoverClose,
  type PopoverProps,
} from './popover';

function Example(props: PopoverProps) {
  return (
    <>
      <Popover {...props}>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverPortal>
          <PopoverPositioner sideOffset={8}>
            <PopoverPopup>
              <PopoverTitle>Details</PopoverTitle>
              <PopoverDescription>More information.</PopoverDescription>
              <input aria-label="Nickname" />
              <PopoverClose>Done</PopoverClose>
            </PopoverPopup>
          </PopoverPositioner>
        </PopoverPortal>
      </Popover>
      <button type="button">After</button>
    </>
  );
}

describe('Popover', () => {
  it('enters a named nonmodal popup, allows Tab to leave and restores focus on Escape', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Details' })).toHaveAccessibleDescription('More information.');
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole('textbox')).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('lets the consumer cancel dismissal using upstream details', async () => {
    const change = vi.fn<NonNullable<PopoverProps['onOpenChange']>>((_open, details) => {
      details.cancel();
    });
    render(<Example defaultOpen onOpenChange={change} />);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(change).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: 'close-press', isCanceled: true }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    render(<Example defaultOpen />);
    await expectNoA11yViolations();
  });
});
