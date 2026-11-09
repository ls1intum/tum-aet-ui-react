import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Menu, MenuTrigger, MenuPortal, MenuPositioner, MenuPopup, MenuItem, MenuLinkItem } from './menu';

it('preserves rendered refs, state classes and a scoped portal container', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const trigger = createRef<HTMLButtonElement>();
  const renderedTrigger = createRef<HTMLButtonElement>();
  const popup = createRef<HTMLDivElement>();
  const item = createRef<HTMLButtonElement>();
  const link = createRef<HTMLAnchorElement>();
  const view = render(
    <Menu defaultOpen>
      <MenuTrigger ref={trigger} render={<button type="button" ref={renderedTrigger} />}>
        Actions
      </MenuTrigger>
      <MenuPortal container={host}>
        <MenuPositioner>
          <MenuPopup ref={popup} className={({ open }) => (open ? 'custom-open' : undefined)}>
            <MenuItem ref={item} nativeButton render={<button type="button" />} className="custom-item">
              Rename
            </MenuItem>
            <MenuLinkItem ref={link} href="/docs">
              Docs
            </MenuLinkItem>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </Menu>,
  );
  expect(trigger.current).toBe(screen.getByRole('button', { name: 'Actions' }));
  expect(renderedTrigger.current).toBe(trigger.current);
  expect(popup.current).toBe(screen.getByRole('menu'));
  expect(host).toContainElement(popup.current);
  expect(popup.current).toHaveClass('tumaet-ui-menu', 'custom-open');
  expect(item.current).toBe(screen.getByRole('menuitem', { name: 'Rename' }));
  expect(item.current).toHaveClass('tumaet-ui-menu-item', 'custom-item');
  expect(link.current).toHaveAttribute('href', '/docs');
  await expectNoA11yViolations(host);
  view.unmount();
  expect(trigger.current).toBeNull();
  expect(renderedTrigger.current).toBeNull();
  host.remove();
});

it('passes upstream handler cancellation and cancelable open details through', async () => {
  const changed = vi.fn<NonNullable<Parameters<typeof Menu>[0]['onOpenChange']>>((_, details) => details.cancel());
  const { rerender } = render(
    <Menu onOpenChange={changed}>
      <MenuTrigger onMouseDown={(event) => event.preventBaseUIHandler()}>Actions</MenuTrigger>
    </Menu>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
  expect(changed).not.toHaveBeenCalled();
  rerender(
    <Menu onOpenChange={changed}>
      <MenuTrigger>Actions</MenuTrigger>
    </Menu>,
  );
  await userEvent.click(screen.getByRole('button', { name: 'Actions' }));
  await waitFor(() =>
    expect(changed).toHaveBeenCalledWith(true, expect.objectContaining({ reason: 'trigger-press', isCanceled: true })),
  );
  expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute('aria-expanded', 'false');
});
