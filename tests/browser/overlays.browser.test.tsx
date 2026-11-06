import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Popover } from '../../src/components/popover/popover';
import { Select } from '../../src/components/select/select';
import { DialogFixture, OverflowFixture, ViewportEdgeFixture } from './fixtures';

async function openSettings() {
  // Establish focus inside Vitest's test iframe before sending native keys.
  // This is setup only: focus entry, navigation and return remain assertions.
  const opener = page.getByRole('button', { name: 'Open settings' }).element();
  if (!(opener instanceof HTMLButtonElement)) throw new Error('Missing opener button');
  opener.focus();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
}

test('enters the native dialog, navigates with Tab and returns focus after closing', async () => {
  render(<DialogFixture />);
  const background = page.getByRole('button', { name: 'Outside action' }).element();
  await openSettings();
  const input = page.getByRole('textbox', { name: 'Display name' });
  await expect.element(input).toHaveFocus();
  background.focus();
  await expect.element(input).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('combobox', { name: 'Course', exact: true })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'More settings' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Save settings' })).toHaveFocus();
  await userEvent.tab({ shift: true });
  await userEvent.tab({ shift: true });
  await userEvent.tab({ shift: true });
  await expect.element(input).toHaveFocus();
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('supports focusing the dialog itself and returning focus on Escape', async () => {
  render(<DialogFixture initialFocus="dialog" />);
  await openSettings();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('respects closeOnEscape after repeated native Escape requests', async () => {
  render(<DialogFixture closeOnEscape={false} />);
  await openSettings();
  await userEvent.keyboard('{Escape}{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await expect.element(page.getByRole('textbox', { name: 'Display name' })).toHaveFocus();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('filters and selects with the keyboard in a native modal dialog', async () => {
  render(<DialogFixture />);
  await openSettings();
  await userEvent.tab();
  const trigger = page.getByRole('combobox', { name: 'Course', exact: true });
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  const search = page.getByRole('textbox', { name: 'Search courses' });
  await expect.element(search).toHaveFocus();
  await search.fill('bet');
  await expect.element(page.getByRole('option', { name: 'Beta' })).toBeVisible();
  await expect.element(page.getByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
  await expect.element(page.getByRole('option', { name: 'Gamma' })).not.toBeInTheDocument();
  await userEvent.keyboard('{Enter}');
  await expect.element(trigger).toHaveTextContent('Beta');
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await userEvent.keyboard('{ArrowDown}{Escape}');
  await expect.element(trigger).toHaveFocus();
  await expect.element(trigger).toHaveTextContent('Beta');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('allows pointer selection in the dialog top layer', async () => {
  render(<DialogFixture />);
  await openSettings();
  const trigger = page.getByRole('combobox', { name: 'Course', exact: true });
  await trigger.click();
  // A body portal behind a modal can look visible in DOM assertions but cannot
  // receive a real pointer click. Never force this interaction.
  await page.getByRole('option', { name: 'Gamma' }).click();
  await expect.element(trigger).toHaveTextContent('Gamma');
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
});

test('focuses a popup in a native dialog and dismisses one layer per Escape', async () => {
  render(<DialogFixture />);
  await openSettings();
  const trigger = page.getByRole('button', { name: 'More settings' });
  await trigger.click();
  await expect.element(page.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
  await userEvent.tab({ shift: true });
  await expect.element(page.getByRole('button', { name: 'Last popup action' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Advanced settings' })).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('dismisses only the selector when a popup and native dialog are also open', async () => {
  render(<DialogFixture />);
  await openSettings();
  await page.getByRole('button', { name: 'More settings' }).click();
  await userEvent.tab();
  const trigger = page.getByRole('combobox', { name: 'Advanced course' });
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}{End}{Enter}');
  await expect.element(trigger).toHaveTextContent('Gamma');
  await userEvent.keyboard('{ArrowDown}{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Advanced settings' })).toBeVisible();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('button', { name: 'More settings' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('escapes overflow clipping and follows the anchor when its container scrolls', async () => {
  render(<OverflowFixture />);
  const trigger = page.getByRole('combobox', { name: 'Overflow course' });
  await trigger.click();
  const list = page.getByRole('listbox');
  const scrollport = page.getByRole('region', { name: 'Scrollable content' });
  const anchorTop = trigger.element().getBoundingClientRect().top;
  await expect
    .poll(() => list.element().getBoundingClientRect().bottom)
    .toBeGreaterThan(scrollport.element().getBoundingClientRect().bottom);
  // Scroll the actual container; the browser dispatches its native scroll event.
  scrollport.element().scrollTop += 40;
  await expect.poll(() => trigger.element().getBoundingClientRect().top).toBeLessThan(anchorTop - 30);
  await expect
    .poll(() => {
      const anchor = trigger.element().getBoundingClientRect();
      const popup = list.element().getBoundingClientRect();
      return Math.abs(popup.top - anchor.bottom - 4);
    })
    .toBeLessThan(2);
  // The last option extends beyond the clipping ancestor and must remain usable.
  await page.getByRole('option', { name: 'Gamma' }).click();
  await expect.element(trigger).toHaveTextContent('Gamma');
});

test('flips the selector above its anchor at the bottom viewport edge', async () => {
  render(<ViewportEdgeFixture />);
  const trigger = page.getByRole('combobox', { name: 'Edge course' });
  await trigger.click();
  const list = page.getByRole('listbox');
  await expect
    .poll(() => {
      const anchor = trigger.element().getBoundingClientRect();
      const popup = list.element().getBoundingClientRect();
      return Math.abs(anchor.top - popup.bottom - 4);
    })
    .toBeLessThan(2);
  const popup = list.element().getBoundingClientRect();
  expect(popup.top).toBeGreaterThanOrEqual(0);
  expect(popup.left).toBeGreaterThanOrEqual(0);
  expect(popup.right).toBeLessThanOrEqual(window.innerWidth);
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(trigger).toHaveTextContent('Beta');
});

test('initially open nested popovers give Escape to the child', async () => {
  render(
    <Popover defaultOpen trigger={<button type="button">Outer opener</button>} aria-label="Outer">
      <Popover defaultOpen trigger={<button type="button">Inner opener</button>} aria-label="Inner">
        <input aria-label="Inner input" />
      </Popover>
    </Popover>,
  );
  await expect.element(page.getByRole('dialog', { name: 'Inner', exact: true })).toBeVisible();
  page.getByRole('textbox', { name: 'Inner input' }).element().focus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Inner', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('dialog', { name: 'Outer', exact: true })).toBeVisible();
  await expect.element(page.getByRole('button', { name: 'Inner opener' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Outer', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Outer opener' })).toHaveFocus();
});

function PlacementFixture({ placement, disabled = false }: { placement: 'top' | 'bottom'; disabled?: boolean }) {
  return (
    <Popover defaultOpen placement={placement} trigger={<button type="button">Outer opener</button>} aria-label="Outer">
      <Select disabled={disabled} aria-label="Inner select" options={['Alpha', 'Beta', 'Gamma']} />
    </Popover>
  );
}

test('parent placement changes preserve the nested selector Escape priority', async () => {
  const { rerender } = render(<PlacementFixture placement="bottom" />);
  const trigger = page.getByRole('combobox', { name: 'Inner select' });
  await trigger.click();
  await expect.element(page.getByRole('listbox')).toBeVisible();
  rerender(<PlacementFixture placement="top" />);
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(page.getByRole('dialog', { name: 'Outer', exact: true })).toBeVisible();
  await expect.element(trigger).toHaveFocus();
});

test('disabling an open selector releases Escape ownership to its parent', async () => {
  const { rerender } = render(<PlacementFixture placement="bottom" />);
  await page.getByRole('combobox', { name: 'Inner select' }).click();
  rerender(<PlacementFixture placement="bottom" disabled />);
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  page.getByRole('dialog', { name: 'Outer', exact: true }).element().focus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Outer', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Outer opener' })).toHaveFocus();
});
