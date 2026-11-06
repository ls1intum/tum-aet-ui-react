import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Tooltip, TooltipTrigger, TooltipPortal, TooltipPositioner, TooltipPopup, TooltipArrow } from './tooltip';

it('preserves rendered refs, popup variants and a scoped portal container', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const trigger = createRef<HTMLButtonElement>();
  const renderedTrigger = createRef<HTMLButtonElement>();
  const popup = createRef<HTMLDivElement>();
  const arrow = createRef<HTMLDivElement>();
  const view = render(
    <Tooltip defaultOpen defaultTriggerId="hint-trigger">
      <TooltipTrigger id="hint-trigger" ref={trigger} render={<button type="button" ref={renderedTrigger} />}>
        Help
      </TooltipTrigger>
      <TooltipPortal container={host}>
        <TooltipPositioner>
          <TooltipPopup ref={popup} variant="list" className={({ open }) => (open ? 'custom-open' : undefined)}>
            <ul>
              <li>Choose a course</li>
              <li>Choose an exercise</li>
            </ul>
            <TooltipArrow ref={arrow} className="custom-arrow" />
          </TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </Tooltip>,
  );
  expect(trigger.current).toBe(screen.getByRole('button', { name: 'Help' }));
  expect(renderedTrigger.current).toBe(trigger.current);
  expect(popup.current).toBe(screen.getByRole('tooltip'));
  expect(host).toContainElement(popup.current);
  expect(popup.current).toHaveClass('tumaet-ui-tooltip-bubble', 'custom-open');
  expect(popup.current).toHaveAttribute('data-variant', 'list');
  expect(arrow.current).toHaveClass('tumaet-ui-tooltip-arrow', 'custom-arrow');
  expect(arrow.current).toHaveAttribute('aria-hidden', 'true');
  await expectNoA11yViolations(document.body);
  view.unmount();
  expect(trigger.current).toBeNull();
  expect(renderedTrigger.current).toBeNull();
  host.remove();
});

it('passes cancelable focus-open details through', async () => {
  const changed = vi.fn<NonNullable<Parameters<typeof Tooltip>[0]['onOpenChange']>>((_, details) => details.cancel());
  render(
    <Tooltip onOpenChange={changed}>
      <TooltipTrigger>Help</TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner>
          <TooltipPopup>Helpful hint</TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </Tooltip>,
  );
  await userEvent.tab();
  expect(changed).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-focus', isCanceled: true }));
  expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
});
