import { useId, useRef, useState } from 'react';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Button } from '../../src/components/button';
import {
  Menu,
  MenuTrigger,
  MenuPortal,
  MenuPositioner,
  MenuPopup,
  MenuItem,
  MenuLinkItem,
} from '../../src/components/menu';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
} from '../../src/components/tooltip';

function MenuFixture() {
  const [chosen, setChosen] = useState('None');
  return (
    <div className="tumaet-ui-root">
      <Menu>
        <MenuTrigger render={<Button />}>Actions</MenuTrigger>
        <MenuPortal>
          <MenuPositioner align="start">
            <MenuPopup>
              <MenuItem onClick={() => setChosen('Rename')}>Rename</MenuItem>
              <MenuItem disabled onClick={() => setChosen('Archive')}>
                Archive
              </MenuItem>
              <MenuItem onClick={() => setChosen('Duplicate')}>Duplicate</MenuItem>
              <MenuItem onClick={() => setChosen('Delete')}>Delete</MenuItem>
              <MenuLinkItem href="#docs" closeOnClick>
                Documentation
              </MenuLinkItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </Menu>
      <output aria-label="Chosen action">{chosen}</output>
    </div>
  );
}

test('menu keyboard opening prevents disabled selection, supports typeahead and returns focus', async () => {
  render(<MenuFixture />);
  const trigger = page.getByRole('button', { name: 'Actions' });
  // Establish focus inside the test iframe before sending trusted keyboard input.
  trigger.element().focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('status', { name: 'Chosen action' })).toHaveTextContent('None');
  await expect.element(page.getByRole('menu')).toBeVisible();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('menuitem', { name: 'Duplicate' })).toHaveFocus();
  await userEvent.keyboard('del');
  await expect.element(page.getByRole('menuitem', { name: 'Delete', exact: true })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('status', { name: 'Chosen action' })).toHaveTextContent('Delete');
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(page.getByRole('menuitem', { name: 'Documentation' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('menu pointer selection invokes an action and returns focus', async () => {
  render(<MenuFixture />);
  const trigger = page.getByRole('button', { name: 'Actions' });
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Duplicate' }).click();
  await expect.element(page.getByRole('status', { name: 'Chosen action' })).toHaveTextContent('Duplicate');
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('menu')).not.toBeInTheDocument();
});

function DescribedTooltip() {
  const descriptionId = useId();
  return (
    <>
      <button type="button">Start</button>
      <Tooltip>
        <TooltipTrigger render={<Button />} aria-describedby={descriptionId}>
          Export
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner>
            <TooltipPopup id={descriptionId}>
              Download current results
              <TooltipArrow />
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
      <button type="button">Next</button>
    </>
  );
}

test('tooltip keyboard focus exposes an explicit description and Escape dismisses without moving focus', async () => {
  render(<DescribedTooltip />);
  page.getByRole('button', { name: 'Start' }).element().focus();
  await userEvent.tab();
  const trigger = page.getByRole('button', { name: 'Export' });
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('tooltip')).toBeVisible();
  await expect.element(trigger).toHaveAccessibleDescription('Download current results');
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect.element(trigger).not.toHaveAccessibleDescription();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Next' })).toHaveFocus();
});

test('tooltip honors provider hover delays and stays open while the pointer enters the popup', async () => {
  const observed = { entered: 0, opened: 0, left: 0, closed: 0 };
  render(
    <TooltipProvider delay={200} closeDelay={150}>
      <Tooltip
        onOpenChange={(open) => {
          if (open) {
            observed.opened = performance.now();
          } else {
            observed.closed = performance.now();
          }
        }}
      >
        <TooltipTrigger
          render={<Button />}
          onMouseEnter={() => {
            observed.entered = performance.now();
          }}
        >
          Hover help
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner>
            <TooltipPopup
              onMouseLeave={() => {
                observed.left = performance.now();
              }}
            >
              Helpful hint
              <TooltipArrow />
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
      <button type="button" style={{ marginLeft: 240 }}>
        Outside
      </button>
    </TooltipProvider>,
  );
  await page.getByRole('button', { name: 'Hover help' }).hover();
  await expect.element(page.getByRole('tooltip')).toBeVisible();
  expect(observed.opened - observed.entered).toBeGreaterThanOrEqual(180);
  await page.getByRole('tooltip').hover();
  await expect.element(page.getByRole('tooltip')).toBeVisible();
  await page.getByRole('button', { name: 'Outside' }).hover();
  await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
  expect(observed.closed - observed.left).toBeGreaterThanOrEqual(130);
});

test('a focusable tooltip trigger composes around a native disabled button', async () => {
  render(
    <>
      <button type="button">Start</button>
      <Tooltip>
        <TooltipTrigger
          delay={0}
          render={
            <span
              role="button"
              tabIndex={0}
              aria-disabled="true"
              aria-label="Export unavailable"
              style={{ display: 'inline-flex' }}
            />
          }
        >
          <Button disabled style={{ pointerEvents: 'none' }}>
            Export
          </Button>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipPositioner>
            <TooltipPopup>
              Choose a course first
              <TooltipArrow />
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
      <button type="button">Outside</button>
    </>,
  );
  page.getByRole('button', { name: 'Start' }).element().focus();
  await userEvent.tab();
  const wrapper = page.getByRole('button', { name: 'Export unavailable' });
  await expect.element(wrapper).toHaveFocus();
  await expect.element(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();
  await expect.element(page.getByRole('tooltip')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();
  await page.getByRole('button', { name: 'Outside' }).click();
  await wrapper.hover();
  await expect.element(page.getByRole('tooltip')).toBeVisible();
});

function ScopedOverlays({ theme }: { theme: 'light' | 'dark' }) {
  const portalHost = useRef<HTMLDivElement>(null);
  return (
    <div data-theme={theme} className="tumaet-ui-root" aria-label="Scoped theme" role="region" style={{ padding: 24 }}>
      <button type="button">Start</button>
      <Menu>
        <MenuTrigger render={<Button />}>Themed actions</MenuTrigger>
        <MenuPortal container={portalHost}>
          <MenuPositioner>
            <MenuPopup>
              <MenuItem>Rename</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </Menu>
      <Tooltip>
        <TooltipTrigger render={<Button />}>Themed help</TooltipTrigger>
        <TooltipPortal container={portalHost}>
          <TooltipPositioner>
            <TooltipPopup>
              Themed hint
              <TooltipArrow />
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
      <div ref={portalHost} />
    </div>
  );
}

test.each(['light', 'dark'] as const)(
  'portal containers inherit the scoped %s theme and menu focus outline',
  async (theme) => {
    render(<ScopedOverlays theme={theme} />);
    const trigger = page.getByRole('button', { name: 'Themed actions' });
    page.getByRole('button', { name: 'Start' }).element().focus();
    await userEvent.tab();
    await expect.element(trigger).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const item = page.getByRole('menuitem', { name: 'Rename' });
    await expect.element(item).toHaveFocus();
    const menu = page.getByRole('menu').element();
    const scope = page.getByRole('region', { name: 'Scoped theme' }).element();
    expect(scope.contains(menu)).toBe(true);
    expect(getComputedStyle(menu).backgroundColor).toBe(theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(22, 25, 29)');
    expect(getComputedStyle(item.element()).outlineStyle).toBe('solid');
    expect(getComputedStyle(item.element()).outlineWidth).toBe('2px');
    await userEvent.keyboard('{Escape}');
    await userEvent.tab();
    await expect.element(page.getByRole('tooltip')).toBeVisible();
    expect(scope.contains(page.getByRole('tooltip').element())).toBe(true);
    expect(getComputedStyle(page.getByRole('tooltip').element()).backgroundColor).toBe(
      theme === 'light' ? 'rgb(51, 65, 85)' : 'rgb(52, 58, 66)',
    );
  },
);
