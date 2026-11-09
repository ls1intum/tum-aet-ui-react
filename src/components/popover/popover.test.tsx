import { render, screen } from '@testing-library/react';
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
    <Popover {...props}>
      <PopoverTrigger>Open</PopoverTrigger>
      <PopoverPortal>
        <PopoverPositioner>
          <PopoverPopup>
            <PopoverTitle>Details</PopoverTitle>
            <PopoverDescription>More information.</PopoverDescription>
            <PopoverClose>Done</PopoverClose>
          </PopoverPopup>
        </PopoverPositioner>
      </PopoverPortal>
    </Popover>
  );
}

describe('Popover', () => {
  it('exposes the popup title and description', () => {
    render(<Example defaultOpen />);
    expect(screen.getByRole('dialog', { name: 'Details' })).toHaveAccessibleDescription('More information.');
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
