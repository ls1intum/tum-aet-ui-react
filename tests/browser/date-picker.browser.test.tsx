import { createRef, useRef, useState } from 'react';
import { act, render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { DatePicker, type DatePickerProps } from '../../src/components/date-picker';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogPopup,
  DialogTitle,
  DialogClose,
} from '../../src/components/dialog';

const initial = new Date(2026, 5, 13, 8, 30);
const input = () => page.getByRole('combobox', { name: 'Deadline' });
const day = (name: string) => page.getByRole('button', { name, exact: true });
const selectedDay = () => day('Saturday, June 13, 2026');
const popup = () => page.getByRole('dialog', { name: 'Choose date and time' });

function Field(props: DatePickerProps) {
  const [value, setValue] = useState<Date | null>(initial);
  return <DatePicker id="deadline" value={value} onValueChange={setValue} {...props} />;
}

test('input opening preserves labels and refs, bounded day navigation and typed time commits', async () => {
  const rootRef = createRef<HTMLDivElement>();
  const inputRef = createRef<HTMLInputElement>();
  render(
    <div className="tumaet-ui-root">
      <label htmlFor="deadline">Deadline</label>
      <p id="hint">Local time</p>
      <Field
        ref={rootRef}
        inputRef={inputRef}
        aria-describedby="hint"
        min={new Date(2026, 5, 13)}
        max={new Date(2026, 5, 20)}
      />
    </div>,
  );
  expect(rootRef.current).toHaveClass('tumaet-ui-date-picker');
  expect(inputRef.current).toBe(input().element());
  await expect.element(input()).toHaveAccessibleDescription('Local time');
  inputRef.current?.focus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(selectedDay()).toHaveFocus();
  await expect.element(popup()).not.toHaveAttribute('aria-modal', 'true');
  await userEvent.keyboard('{ArrowLeft}{Enter}');
  await expect.element(day('Friday, June 12, 2026')).toHaveAttribute('aria-disabled', 'true');
  await expect.element(input()).toHaveValue('13.06.2026 08:30');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(input()).toHaveValue('19.06.2026 08:30');
  await userEvent.keyboard('{PageDown}');
  await expect.element(page.getByRole('grid', { name: 'July 2026' })).toBeVisible();
  await expect.element(day('Sunday, July 19, 2026')).toHaveFocus();
  const hour = page.getByRole('textbox', { name: 'Hour' });
  await hour.fill('10');
  await userEvent.keyboard('{Enter}');
  await expect.element(input()).toHaveValue('19.06.2026 10:30');
  const minute = page.getByRole('textbox', { name: 'Minute' });
  await minute.fill('45');
  await userEvent.tab();
  await expect.element(input()).toHaveValue('19.06.2026 10:45');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect.element(popup()).not.toBeInTheDocument();
  await expect.element(input()).toHaveFocus();
  await input().fill('31.02.2026 10:45');
  await userEvent.tab();
  await expect.element(input()).toHaveValue('31.02.2026 10:45');
  await expect.element(input()).toHaveAttribute('aria-invalid', 'true');
});

test('button opening is keyboard accessible and nonmodal Tab can leave in either direction', async () => {
  render(
    <div className="tumaet-ui-root">
      <Field aria-label="Deadline" />
      <button type="button">Next field</button>
    </div>,
  );
  const trigger = page.getByRole('button', { name: 'Open calendar' });
  trigger.element().focus();
  await userEvent.keyboard('{Enter}');
  await expect.element(selectedDay()).toHaveFocus();
  page
    .getByRole('button', { name: /^Previous month/ })
    .element()
    .focus();
  await userEvent.tab({ shift: true });
  await expect.element(trigger).toHaveFocus();
  await userEvent.keyboard('{Escape}');
  await expect.element(input()).toHaveFocus();
  await trigger.click();
  await expect.element(selectedDay()).toHaveFocus();
  page.getByRole('button', { name: 'Done', exact: true }).element().focus();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Next field' })).toHaveFocus();
  await expect.element(popup()).not.toBeInTheDocument();
});

test('openOnClick and outside pointer dismissal preserve destination focus and activation', async () => {
  let clicks = 0;
  render(
    <>
      <Field aria-label="Deadline" openOnClick />
      <div style={{ position: 'fixed', right: 8, top: 8 }}>
        <input aria-label="Outside field" />
        <button type="button" onClick={() => clicks++}>
          Outside action
        </button>
      </div>
    </>,
  );
  await input().click();
  await expect.element(selectedDay()).toHaveFocus();
  await page.getByRole('textbox', { name: 'Outside field' }).click();
  await expect.element(popup()).not.toBeInTheDocument();
  await expect.element(page.getByRole('textbox', { name: 'Outside field' })).toHaveFocus();
  await input().click();
  await expect.element(popup()).toBeVisible();
  await page.getByRole('button', { name: 'Outside action' }).click();
  await expect.element(popup()).not.toBeInTheDocument();
  expect(clicks).toBe(1);
});

function Nested({ cancel, onDismissRequest }: { cancel: boolean; onDismissRequest: () => void }) {
  return (
    <Dialog
      onOpenChange={(open, details) => {
        if (!open) onDismissRequest();
        if (cancel && details.reason === 'escape-key') details.cancel();
      }}
    >
      <DialogTrigger>Schedule</DialogTrigger>
      <DialogPortal>
        <DialogPopup>
          <DialogTitle>Schedule settings</DialogTitle>
          <Field aria-label="Deadline" />
          <DialogClose>Close settings</DialogClose>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}

test('caller cancellation and Escape compose with a parent Dialog one popup at a time', async () => {
  let dismissRequests = 0;
  const onDismissRequest = () => {
    dismissRequests++;
  };
  const view = render(<Nested cancel onDismissRequest={onDismissRequest} />);
  await page.getByRole('button', { name: 'Schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await expect.element(selectedDay()).toHaveFocus();
  await day('Saturday, June 20, 2026').click();
  await expect.element(input()).toHaveValue('20.06.2026 08:30');
  await userEvent.keyboard('{Escape}');
  await expect.element(popup()).not.toBeInTheDocument();
  await expect.element(input()).toHaveFocus();
  expect(dismissRequests).toBe(0);
  await expect.element(page.getByRole('dialog', { name: 'Schedule settings' })).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Schedule settings' })).toBeVisible();
  expect(dismissRequests).toBe(1);
  act(() => view.rerender(<Nested cancel={false} onDismissRequest={onDismissRequest} />));
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('dialog', { name: 'Schedule settings' })).not.toBeInTheDocument();
  await expect.element(page.getByRole('button', { name: 'Schedule', exact: true })).toHaveFocus();
});

test('disabling an open picker closes it without reopening on enable', async () => {
  const view = render(<Field aria-label="Deadline" />);
  await page.getByRole('button', { name: 'Open calendar' }).click();
  await expect.element(selectedDay()).toHaveFocus();
  act(() => view.rerender(<Field aria-label="Deadline" disabled />));
  await expect.element(popup()).not.toBeInTheDocument();
  await expect.element(input()).toBeDisabled();
  act(() => view.rerender(<Field aria-label="Deadline" />));
  await expect.element(popup()).not.toBeInTheDocument();
  await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
});

test('time-only initial focus and native time editing use Base UI focus return', async () => {
  render(<Field aria-label="Deadline" timeOnly />);
  await page.getByRole('button', { name: 'Open clock' }).click();
  const hour = page.getByRole('textbox', { name: 'Hour' });
  await expect.element(hour).toHaveFocus();
  await expect.element(page.getByRole('grid')).not.toBeInTheDocument();
  await hour.fill('23');
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(input()).toHaveValue('00:30');
  await userEvent.keyboard('{Escape}');
  await expect.element(input()).toHaveFocus();
});

function Scoped({ theme }: { theme: 'light' | 'dark' }) {
  const host = useRef<HTMLDivElement>(null);
  return (
    <div
      data-theme={theme}
      className="tumaet-ui-root"
      role="region"
      aria-label="Theme scope"
      style={{ paddingTop: 480, paddingLeft: 16 }}
    >
      <div data-testid="clip" style={{ height: 120, overflow: 'auto', width: 360 }}>
        <div style={{ height: 400, paddingTop: 40 }}>
          <Field aria-label="Deadline" dateOnly portalContainer={host} />
        </div>
      </div>
      <div ref={host} />
    </div>
  );
}

test.each(['light', 'dark'] as const)(
  'scoped %s popup escapes clipping, flips and follows a scrolling whole-field anchor',
  async (theme) => {
    render(<Scoped theme={theme} />);
    await page.getByRole('button', { name: 'Open calendar' }).click();
    await expect.element(selectedDay()).toHaveFocus();
    const panel = page.getByRole('dialog', { name: 'Choose date', exact: true });
    const scope = page.getByRole('region', { name: 'Theme scope' }).element();
    const clip = page.getByTestId('clip').element();
    expect(scope.contains(panel.element())).toBe(true);
    expect(clip.contains(panel.element())).toBe(false);
    expect(getComputedStyle(panel.element()).backgroundColor).toBe(
      theme === 'light' ? 'rgb(255, 255, 255)' : 'rgb(22, 25, 29)',
    );
    await expect.element(panel).toHaveAttribute('data-side', 'top');
    const field = input().element();
    await expect
      .poll(() => Math.abs(panel.element().getBoundingClientRect().left - field.getBoundingClientRect().left))
      .toBeLessThan(2);
    const originalTop = panel.element().getBoundingClientRect().top;
    clip.scrollTop = 24;
    await expect.poll(() => panel.element().getBoundingClientRect().top).toBeLessThan(originalTop - 20);
    await expect
      .poll(() => Math.abs(panel.element().getBoundingClientRect().bottom - field.getBoundingClientRect().top + 4))
      .toBeLessThan(2);
    const rect = selectedDay().element().getBoundingClientRect();
    expect(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)).toBe(selectedDay().element());
    await userEvent.keyboard('{Escape}');
    await expect.element(input()).toHaveFocus();
  },
);
