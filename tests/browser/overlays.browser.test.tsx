import { act, render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  DialogFixture,
  NonmodalPopoverFixture,
  OverflowFixture,
  ViewportEdgeFixture,
  SelectFormFixture,
  SelectResetFixture,
  LateFormSelectFixture,
  SelectReorderFixture,
} from './fixtures';

async function openSettings() {
  const trigger = page.getByRole('button', { name: 'Open settings' });
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await expect.element(page.getByRole('textbox', { name: 'Display name' })).toHaveFocus();
}

async function openAdvanced() {
  await openSettings();
  await page.getByRole('button', { name: 'More settings' }).click();
  await expect.element(page.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
}

test('blocks background pointer activation until the modal closes', async () => {
  render(<DialogFixture />);
  const background = page.getByRole('button', { name: 'Outside action' });
  const rect = background.element().getBoundingClientRect();
  await openSettings();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  const target = document.elementFromPoint(x, y);
  if (target === null) throw new Error('Missing pointer target');
  const targetRect = target.getBoundingClientRect();
  await userEvent.click(target, { position: { x: x - targetRect.x, y: y - targetRect.y } });
  await expect.element(page.getByRole('status', { name: 'Background actions' })).toHaveTextContent('0');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
  await background.click();
  await expect.element(page.getByRole('status', { name: 'Background actions' })).toHaveTextContent('1');
});

test.each([
  { name: 'forward', shift: false },
  { name: 'backward', shift: true },
])('wraps keyboard focus at the $name modal boundary', async ({ shift }) => {
  render(<DialogFixture />);
  await openSettings();
  const close = page.getByRole('button', { name: 'Close', exact: true });
  const save = page.getByRole('button', { name: 'Save settings' });
  const from = shift ? close : save;
  const to = shift ? save : close;
  from.element().focus();
  await expect.element(from).toHaveFocus();
  await userEvent.tab({ shift });
  await expect.element(to).toHaveFocus();
});

test('lets Tab leave a nonmodal popover and restores its trigger after Escape', async () => {
  render(<NonmodalPopoverFixture />);
  const trigger = page.getByRole('button', { name: 'Open details' });
  await trigger.click();
  await expect.element(page.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Details' })).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(page.getByRole('textbox', { name: 'Nickname' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Done' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'After details' })).toHaveFocus();
});

test('navigates Dialog → Popover → Select and dismisses one layer per Escape with focus return', async () => {
  render(<DialogFixture />);
  await openAdvanced();
  await userEvent.tab();
  const trigger = page.getByRole('combobox', { name: 'Advanced course' });
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('listbox')).toBeVisible();
  await expect.element(page.getByRole('option', { name: 'Alpha' })).toHaveFocus();
  await userEvent.keyboard('{End}');
  await expect.element(page.getByRole('option', { name: 'Gamma' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await expect.element(trigger).toHaveTextContent('Gamma');
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('listbox')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Advanced settings' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Advanced settings' })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'More settings' })).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('selects by pointer inside a child portal without dismissing either parent', async () => {
  render(<DialogFixture />);
  await openAdvanced();
  const trigger = page.getByRole('combobox', { name: 'Advanced course' });
  await trigger.click();
  // No force: a visually rendered but inert/obscured child portal must fail this click.
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(trigger).toHaveTextContent('Beta');
  await expect.element(trigger).toHaveFocus();
  await expect.element(page.getByRole('dialog', { name: 'Advanced settings' })).toBeVisible();
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
});

test('preserves cancellation of controlled Dialog dismissal and Select value requests', async () => {
  render(<DialogFixture cancelEscape cancelValue />);
  await openAdvanced();
  const trigger = page.getByRole('combobox', { name: 'Advanced course' });
  await trigger.click();
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(trigger).toHaveTextContent('Choose');
  await page.getByRole('button', { name: 'Done with advanced settings' }).click();
  await userEvent.keyboard('{Escape}{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect.element(page.getByRole('button', { name: 'Open settings' })).toHaveFocus();
});

test('inherits scoped theme and direction through an explicitly placed portal container', async () => {
  render(<DialogFixture scoped />);
  await openAdvanced();
  await page.getByRole('combobox', { name: 'Advanced course' }).click();
  const host = page.getByTestId('overlay-host').element();
  for (const popup of [
    page.getByRole('dialog', { name: 'Settings', exact: true }),
    page.getByRole('dialog', { name: 'Advanced settings' }),
    page.getByRole('listbox'),
  ]) {
    expect(host.contains(popup.element())).toBe(true);
    await expect.element(popup).toHaveStyle({ direction: 'rtl', colorScheme: 'dark' });
  }
  const option = page.getByRole('option', { name: 'Gamma' });
  await option.click();
  await expect.element(page.getByRole('combobox', { name: 'Advanced course' })).toHaveTextContent('Gamma');
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
  scrollport.element().scrollTop += 40;
  await expect.poll(() => trigger.element().getBoundingClientRect().top).toBeLessThan(anchorTop - 30);
  await expect
    .poll(() => {
      const anchor = trigger.element().getBoundingClientRect();
      const popup = list.element().getBoundingClientRect();
      return Math.abs(popup.top - anchor.bottom - 4);
    })
    .toBeLessThan(2);
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
  expect(popup.right).toBeLessThanOrEqual(window.innerWidth);
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(trigger).toHaveTextContent('Beta');
});

test('submits required selections and restores caller-owned reset values through rerender', async () => {
  render(<SelectFormFixture />);
  const form = page.getByRole('form', { name: 'Courses' }).element();
  if (!(form instanceof HTMLFormElement)) throw new Error('Missing form');
  expect(form.checkValidity()).toBe(false);
  await page.getByRole('button', { name: 'Submit courses' }).click();
  await expect.element(page.getByRole('combobox', { name: 'Required courses' })).toHaveFocus();
  await expect.element(page.getByRole('alert')).toHaveTextContent('A course is required.');
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('option', { name: 'Alpha' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard('{Escape}');
  await page.getByRole('combobox', { name: 'Single course' }).click();
  await page.getByRole('option', { name: 'Beta' }).click();
  expect(form.checkValidity()).toBe(true);
  await page.getByRole('button', { name: 'Submit courses' }).click();
  await expect
    .element(page.getByRole('status', { name: 'Submitted entries' }))
    .toHaveTextContent('[["course","Beta"],["courses","Alpha"],["readonly","Alpha"]]');
  const resetData = resetForm(form);
  expect(resetData.getAll('course')).toEqual(['Alpha']);
  expect(resetData.getAll('courses')).toEqual([]);
  await expect.element(page.getByRole('combobox', { name: 'Single course' })).toHaveTextContent('Alpha');
  await page.getByRole('button', { name: 'Rerender 0' }).click();
  await expect.element(page.getByRole('combobox', { name: 'Required courses' })).toHaveTextContent('Choose');
  expect(new FormData(form).getAll('course')).toEqual(['Alpha']);
  expect(new FormData(form).getAll('courses')).toEqual([]);
});

test('honors canceled resets and preserves selection when the caller supplies no reset policy', async () => {
  const { rerender } = render(<SelectFormFixture cancelReset />);
  await page.getByRole('combobox', { name: 'Single course' }).click();
  await page.getByRole('option', { name: 'Beta' }).click();
  await expect.element(page.getByRole('combobox', { name: 'Single course' })).toHaveTextContent('Beta');
  const canceledForm = page.getByRole('form', { name: 'Courses' }).element() as HTMLFormElement;
  expect(resetForm(canceledForm).get('course')).toBe('Beta');
  await expect.element(page.getByRole('combobox', { name: 'Single course' })).toHaveTextContent('Beta');
  rerender(<SelectFormFixture key="preserved" preserveOnReset />);
  await page.getByRole('combobox', { name: 'Single course' }).click();
  await page.getByRole('option', { name: 'Gamma' }).click();
  resetForm(page.getByRole('form', { name: 'Courses' }).element() as HTMLFormElement);
  await expect.element(page.getByRole('combobox', { name: 'Single course' })).toHaveTextContent('Gamma');
  const form = page.getByRole('form', { name: 'Courses' }).element() as HTMLFormElement;
  expect(new FormData(form).getAll('course')).toEqual(['Gamma']);
});

function resetForm(form: HTMLFormElement) {
  let data!: FormData;
  act(() => {
    form.reset();
    data = new FormData(form);
  });
  return data;
}

test('preserves trigger identity, focus, IDs and child state on caller-owned reset', async () => {
  render(<SelectResetFixture />);
  await page.getByRole('button', { name: 'Counter 0' }).click();
  const trigger = page.getByRole('combobox', { name: 'Reset course' });
  const original = trigger.element();
  const id = original.id;
  await trigger.click();
  await page.getByRole('option', { name: 'Gamma' }).click();
  original.focus();
  const form = page.getByRole('form', { name: 'Reset form' }).element() as HTMLFormElement;
  expect(resetForm(form).get('course')).toBe('Alpha');
  expect(trigger.element()).toBe(original);
  expect(original.id).toBe(id);
  await expect.element(trigger).toHaveFocus();
  await expect.element(trigger).toHaveTextContent('Alpha');
  await expect.element(page.getByRole('button', { name: 'Counter 1' })).toBeVisible();
});

test('preserves current open state through reset without replaying defaultOpen', async () => {
  render(<SelectResetFixture defaultOpen />);
  const form = page.getByRole('form', { name: 'Reset form' }).element() as HTMLFormElement;
  await expect.element(page.getByRole('option', { name: 'Alpha' })).toHaveFocus();
  const option = page.getByRole('option', { name: 'Alpha' }).element();
  resetForm(form);
  await expect.element(page.getByRole('option', { name: 'Alpha' })).toHaveFocus();
  expect(page.getByRole('option', { name: 'Alpha' }).element()).toBe(option);
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  resetForm(form);
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(page.getByRole('combobox')).toHaveFocus();
});

test('resets through a late mounted external form and follows changes to the native form owner', async () => {
  const { rerender } = render(<LateFormSelectFixture />);
  rerender(<LateFormSelectFixture mounted />);
  const trigger = page.getByRole('combobox', { name: 'External course' });
  await trigger.click();
  await page.getByRole('option', { name: 'Beta' }).click();
  const late = page.getByRole('form', { name: 'Late form' }).element() as HTMLFormElement;
  const other = page.getByRole('form', { name: 'Other form' }).element() as HTMLFormElement;
  expect(new FormData(late).get('course')).toBe('Beta');
  expect(resetForm(late).get('course')).toBe('Alpha');
  await expect.element(trigger).toHaveTextContent('Alpha');
  expect(new FormData(late).get('course')).toBe('Alpha');
  await trigger.click();
  await page.getByRole('option', { name: 'Gamma' }).click();
  rerender(<LateFormSelectFixture mounted form="other" />);
  expect(new FormData(other).get('course')).toBe('Gamma');
  resetForm(late);
  await expect.element(trigger).toHaveTextContent('Gamma');
  expect(resetForm(other).get('course')).toBe('Alpha');
  await expect.element(trigger).toHaveTextContent('Alpha');
  expect(new FormData(other).get('course')).toBe('Alpha');
});

test('keeps renderItem local state with its stable item key through reorder', async () => {
  const { rerender } = render(<SelectReorderFixture />);
  await expect.element(page.getByRole('option', { name: 'Alpha originally Alpha' })).toBeVisible();
  const alpha = page.getByRole('option', { name: 'Alpha originally Alpha' }).element();
  rerender(<SelectReorderFixture reversed />);
  for (const name of ['Gamma', 'Beta', 'Alpha']) {
    await expect.element(page.getByRole('option', { name: `${name} originally ${name}` })).toBeVisible();
  }
  expect(page.getByRole('option', { name: 'Alpha originally Alpha' }).element()).toBe(alpha);
  expect(
    Array.from(page.getByRole('listbox').element().querySelectorAll('[role="option"]'), (item) => item.textContent),
  ).toEqual(['Gamma originally Gamma', 'Beta originally Beta', 'Alpha originally Alpha']);
});
