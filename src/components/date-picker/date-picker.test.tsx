import { useState } from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { TumAetUiI18nProvider } from '../../internal/i18n';
import { DatePicker } from './date-picker';
import { Calendar } from './calendar';

const JUNE_13 = new Date(2026, 5, 13, 8, 30);
const day = (iso: string) => screen.getByRole('dialog').querySelector<HTMLButtonElement>(`button[data-date="${iso}"]`)!;
const field = () => screen.getByRole('combobox');

function Controlled({
  initial = JUNE_13,
  onValue,
  ...props
}: Partial<React.ComponentProps<typeof DatePicker>> & { initial?: Date | null; onValue?: (v: Date | null) => void }) {
  const [value, setValue] = useState<Date | null>(initial);
  return (
    <>
      <DatePicker
        aria-label="Deadline"
        {...props}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
      />
      <button type="button" onClick={() => setValue(new Date(2026, 5, 13, 8, 30, 45))}>
        same minute
      </button>
      <button type="button" onClick={() => setValue(new Date(2027, 0, 2, 10, 0))}>
        other value
      </button>
    </>
  );
}

describe('DatePicker text field', () => {
  it('shows the value as text and passes id and aria attributes to the field', () => {
    render(
      <DatePicker id="deadline" aria-label="Deadline" aria-describedby="hint" aria-required defaultValue={JUNE_13} />,
    );
    const input = field();
    expect(input).toHaveValue('13.06.2026 08:30');
    expect(input).toHaveAttribute('id', 'deadline');
    expect(input).toHaveAccessibleName('Deadline');
    expect(input).toHaveAttribute('aria-describedby', 'hint');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveClass('tumaet-ui-date-picker-input');
  });

  it('uses aria-labelledby instead of aria-label when both are missing a name', () => {
    render(
      <>
        <span id="lbl">End date</span>
        <DatePicker aria-labelledby="lbl" />
      </>,
    );
    expect(field()).toHaveAccessibleName('End date');
  });

  it('parses typed text into a Date and reports it once complete', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
    await userEvent.type(field(), '13.06.2026 08:3');
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.type(field(), '0');
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0]![0]).toEqual(JUNE_13);
    expect(field()).toHaveValue('13.06.2026 08:30');
  });

  it('flags invalid text without changing the value or wiping the text', async () => {
    const onValueChange = vi.fn();
    const onValidity = vi.fn();
    render(
      <DatePicker
        aria-label="Deadline"
        defaultValue={JUNE_13}
        onValueChange={onValueChange}
        onInputValidityChange={onValidity}
      />,
    );
    await userEvent.type(field(), '9');
    expect(field()).toHaveValue('13.06.2026 08:309');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid date and time.');
    expect(field()).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValidity).toHaveBeenLastCalledWith(false);
    await userEvent.type(field(), '{Backspace}');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(onValidity).toHaveBeenLastCalledWith(true);
  });

  it.each(['31.02.2026 10:00', '29.02.2026 10:00', '13.13.2026 10:00', '13.06.2026 24:00'])(
    'rejects the impossible entry %s',
    async (text) => {
      const onValueChange = vi.fn();
      render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
      await userEvent.type(field(), text);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(field()).toHaveAttribute('aria-invalid', 'true');
    },
  );

  it('accepts 29 February in a leap year', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
    await userEvent.type(field(), '29.02.2028 10:00');
    expect(onValueChange.mock.calls[0]![0]).toEqual(new Date(2028, 1, 29, 10, 0));
  });

  it('defers the error until blur with validateOnBlur but reports validity right away', async () => {
    const onValidity = vi.fn();
    render(<DatePicker aria-label="Deadline" validateOnBlur onInputValidityChange={onValidity} />);
    await userEvent.type(field(), '13.06');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(field()).toHaveAttribute('aria-invalid', 'false');
    expect(onValidity).toHaveBeenLastCalledWith(false);
    await userEvent.tab();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('flags an incomplete entry on blur and calls onBlur', async () => {
    const onBlur = vi.fn();
    render(<DatePicker aria-label="Deadline" onBlur={onBlur} />);
    await userEvent.type(field(), '13.06.2026');
    await userEvent.tab();
    expect(onBlur).toHaveBeenCalledOnce();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('flags trailing garbage', async () => {
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} />);
    await userEvent.type(field(), 'x');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('accepts a non-breaking space and shows the text the way the picker writes it', () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
    fireEvent.change(field(), { target: { value: '13.06.2026 08:30' } });
    expect(onValueChange.mock.calls[0]![0]).toEqual(JUNE_13);
    expect(field()).toHaveValue('13.06.2026 08:30');
  });

  it('reports null when the text is emptied and clears with the clear button', async () => {
    const onValueChange = vi.fn();
    render(<Controlled onValue={onValueChange} />);
    await userEvent.clear(field());
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: 'Clear date' })).toBeNull();
  });

  it('clears the value and the text with the clear button and focuses the field', async () => {
    const onValueChange = vi.fn();
    render(<Controlled onValue={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(field()).toHaveValue('');
    expect(field()).toHaveFocus();
  });

  it('clears invalid text typed into an empty field', async () => {
    render(<DatePicker aria-label="Deadline" />);
    await userEvent.type(field(), 'abc');
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Clear date' }));
    expect(field()).toHaveValue('');
    expect(field()).toHaveAttribute('aria-invalid', 'false');
  });

  it('keeps in-progress invalid text when the value is re-supplied as an equal new Date, and replaces it for a different value', async () => {
    render(<Controlled />);
    await userEvent.type(field(), '9');
    await userEvent.click(screen.getByRole('button', { name: 'same minute' }));
    expect(field()).toHaveValue('13.06.2026 08:309');
    await userEvent.click(screen.getByRole('button', { name: 'other value' }));
    expect(field()).toHaveValue('02.01.2027 10:00');
    expect(field()).toHaveAttribute('aria-invalid', 'false');
  });

  it('marks an external error without a built-in message', () => {
    render(<DatePicker aria-label="Deadline" aria-invalid defaultValue={JUNE_13} />);
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('does not reject text outside min and max, which the consumer judges', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Deadline"
        min={new Date(2026, 5, 10)}
        max={new Date(2026, 5, 20)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.type(field(), '01.01.2030 10:00');
    expect(onValueChange.mock.calls[0]![0]).toEqual(new Date(2030, 0, 1, 10, 0));
    expect(field()).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows the time zone indicator on request', async () => {
    const { rerender } = render(<DatePicker aria-label="Deadline" />);
    expect(screen.queryByRole('img')).toBeNull();
    rerender(<DatePicker aria-label="Deadline" showTimeZoneWarning />);
    const icon = screen.getByRole('img');
    expect(icon).toHaveAttribute('tabindex', '0');
    expect(icon).toHaveAccessibleName(/time zone\./);
    // Like the Angular version the text is also a tooltip, which shows for a keyboard user who focuses the icon.
    expect(screen.queryByRole('tooltip')).toBeNull();
    await userEvent.tab();
    expect(icon).toHaveFocus();
    expect(await screen.findByRole('tooltip')).toHaveTextContent(/time zone\./);
  });

  it('uses the mode specific placeholder, message and dialog name', async () => {
    const { rerender } = render(<DatePicker aria-label="Deadline" dateOnly />);
    expect(field()).toHaveAttribute('placeholder', 'DD.MM.YYYY');
    await userEvent.type(field(), '13.06.2026 08:30');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid date.');
    rerender(<DatePicker aria-label="Deadline" dateOnly={false} timeOnly />);
    expect(field()).toHaveAttribute('placeholder', 'HH:mm');
  });
});

describe('DatePicker dialog', () => {
  it('opens from the trigger with focus on the selected day and closes with Escape, returning focus', async () => {
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} />);
    const trigger = screen.getByRole('button', { name: 'Open calendar' });
    expect(trigger).toHaveAttribute('tabindex', '0');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Choose date and time' });
    expect(dialog).not.toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    await waitFor(() => expect(day('2026-06-13')).toHaveFocus());
    expect(within(dialog).getByRole('gridcell', { selected: true })).toContainElement(day('2026-06-13'));
    expect(field()).toHaveAttribute('aria-expanded', 'true');
    expect(field()).toHaveAttribute('aria-controls', dialog.id);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field()).toHaveFocus();
  });

  it('returns focus to the text field when opened from it with ArrowDown', async () => {
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} />);
    await userEvent.click(field());
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(field()).toHaveFocus();
  });

  it('closes with Done and with a press outside', async () => {
    render(
      <>
        <DatePicker aria-label="Deadline" defaultValue={JUNE_13} />
        <button type="button">outside</button>
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(screen.getByRole('button', { name: 'outside' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('toggles from the trigger', async () => {
    render(<DatePicker aria-label="Deadline" />);
    const trigger = screen.getByRole('button', { name: 'Open calendar' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('does not let the Escape that closes the calendar reach an outer handler', async () => {
    const outer = vi.fn();
    render(
      <div role="presentation" onKeyDown={outer}>
        <DatePicker aria-label="Deadline" defaultValue={JUNE_13} />
      </div>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    outer.mockClear();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(outer).not.toHaveBeenCalled();
  });

  it('opens on a click into the field only with openOnClick', async () => {
    const { rerender } = render(<DatePicker aria-label="Deadline" />);
    await userEvent.click(field());
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<DatePicker aria-label="Deadline" openOnClick />);
    await userEvent.click(field());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not open when disabled and closes when disabled while open', async () => {
    const { rerender } = render(<DatePicker aria-label="Deadline" disabled />);
    expect(screen.getByRole('button', { name: 'Open calendar' })).toBeDisabled();
    await userEvent.type(field(), '{ArrowDown}');
    expect(screen.queryByRole('dialog')).toBeNull();
    rerender(<DatePicker aria-label="Deadline" />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<DatePicker aria-label="Deadline" disabled />);
    expect(screen.queryByRole('dialog')).toBeNull();
    // Enabling it again must not bring the closed calendar back.
    rerender(<DatePicker aria-label="Deadline" />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: 'Open calendar' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps controlled value acceptance and replacement with the caller', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<DatePicker aria-label="Deadline" value={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(day('2026-06-20'));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 20, 8, 30));
    expect(field()).toHaveValue('13.06.2026 08:30');
    rerender(<DatePicker aria-label="Deadline" value={null} onValueChange={onValueChange} />);
    expect(field()).toHaveValue('');
    expect(onValueChange).toHaveBeenCalledOnce();
  });

  it('composes caller capture handlers with textbox opening', async () => {
    const onClick = vi.fn();
    render(
      <DatePicker
        aria-label="Deadline"
        openOnClick
        onClick={onClick}
        onClickCapture={(event) => event.preventDefault()}
        onKeyDownCapture={(event) => event.preventDefault()}
      />,
    );
    await userEvent.click(field());
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).toBeNull();
    field().focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('draws the field like the Angular one, without the shared input look', () => {
    render(<DatePicker aria-label="Deadline" />);
    expect(field()).not.toHaveClass('tumaet-ui-input');
  });

  it('selects a day and keeps the time of the value', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(day('2026-06-20'));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 8, 30));
    expect(field()).toHaveValue('20.06.2026 08:30');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('selects midnight of the day on an empty picker and the start of the day with dateOnly', async () => {
    const onValueChange = vi.fn();
    const { unmount } = render(<DatePicker aria-label="Deadline" startAt={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(day('2026-06-20'));
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 0, 0));
    unmount();
    render(<DatePicker aria-label="Deadline" dateOnly defaultValue={JUNE_13} onValueChange={onValueChange} />);
    expect(field()).toHaveValue('13.06.2026');
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog', { name: 'Choose date' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Time' })).toBeNull();
    await userEvent.click(day('2026-06-20'));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 20, 0, 0));
  });

  it('limits the days of the calendar to min and max and ignores disabled days', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Deadline"
        defaultValue={new Date(2026, 5, 15, 8, 30)}
        min={new Date(2026, 5, 10, 18)}
        max={new Date(2026, 5, 20, 6)}
        onValueChange={onValueChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(day('2026-06-09')).toHaveAttribute('aria-disabled', 'true');
    expect(day('2026-06-10')).not.toHaveAttribute('aria-disabled');
    expect(day('2026-06-20')).not.toHaveAttribute('aria-disabled');
    expect(day('2026-06-21')).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(day('2026-06-21'));
    expect(onValueChange).not.toHaveBeenCalled();
    day('2026-06-20').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(day('2026-06-21')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.keyboard('{ArrowLeft}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 8, 30));
  });

  it('opens an empty picker on startAt, and on the month of min or max when today lies outside them', async () => {
    const { unmount } = render(<DatePicker aria-label="Deadline" startAt={new Date(2031, 2, 5)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('grid', { name: 'March 2031' })).toBeInTheDocument();
    unmount();
    const { unmount: unmountSecond } = render(
      <DatePicker aria-label="Deadline" startAt={new Date(2031, 2, 5)} defaultValue={JUNE_13} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    unmountSecond();
    const { unmount: unmountThird } = render(<DatePicker aria-label="Deadline" min={new Date(2099, 6, 1)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('grid', { name: 'July 2099' })).toBeInTheDocument();
    unmountThird();
    render(<DatePicker aria-label="Deadline" max={new Date(2001, 3, 1)} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('grid', { name: 'April 2001' })).toBeInTheDocument();
  });

  it('follows the locale for month and weekday names', async () => {
    render(
      <TumAetUiI18nProvider
        translate={(key, params) =>
          key === 'tumAetUi.datePicker.nextMonth' ? `Naechster Monat: ${params?.month}` : key
        }
        locale="de-DE"
      >
        <DatePicker aria-label="Frist" defaultValue={JUNE_13} />
      </TumAetUiI18nProvider>,
    );
    await userEvent.click(document.querySelector<HTMLElement>('.tumaet-ui-date-picker-toggle')!);
    expect(screen.getByRole('grid', { name: 'Juni 2026' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Montag' })).toHaveTextContent('Mo');
    expect(screen.getByRole('button', { name: 'Naechster Monat: Juli 2026' })).toBeInTheDocument();
  });
});

describe('Calendar keyboard navigation', () => {
  async function openAt(value: Date) {
    render(<DatePicker aria-label="Deadline" defaultValue={value} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await waitFor(() => expect(screen.getByRole('grid').querySelector('button[tabindex="0"]')).toHaveFocus());
  }

  it('moves with the arrow keys, Home and End', async () => {
    await openAt(new Date(2026, 5, 17, 8, 30)); // Wednesday
    expect(day('2026-06-17')).toHaveFocus();
    expect(day('2026-06-17')).toHaveAttribute('tabindex', '0');
    expect(day('2026-06-18')).toHaveAttribute('tabindex', '-1');
    await userEvent.keyboard('{ArrowRight}');
    expect(day('2026-06-18')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(day('2026-06-25')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(day('2026-06-24')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    expect(day('2026-06-17')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    expect(day('2026-06-15')).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(day('2026-06-21')).toHaveFocus();
  });

  it('selects the focused day with Enter and with Space', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await waitFor(() => expect(day('2026-06-13')).toHaveFocus());
    await userEvent.keyboard('{ArrowRight}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 14, 8, 30));
    await userEvent.keyboard('{ArrowRight}[Space]');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 15, 8, 30));
  });

  it('continues into the next month at the end of the grid and back into the previous one at the start', async () => {
    await openAt(new Date(2026, 5, 30, 8, 30));
    day('2026-07-12').focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('grid', { name: 'July 2026' })).toBeInTheDocument();
    expect(day('2026-07-13')).toHaveFocus();
    day('2026-06-29').focus(); // first cell of the July grid is Monday 29 June
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    expect(day('2026-06-28')).toHaveFocus();
  });

  it('moves a week at a time across the month boundary', async () => {
    await openAt(new Date(2026, 5, 15, 8, 30));
    day('2026-07-08').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('grid', { name: 'August 2026' })).toBeInTheDocument();
    expect(day('2026-08-12')).toHaveFocus();
  });

  it('changes the month with PageUp and PageDown and keeps the focus in the grid', async () => {
    await openAt(new Date(2026, 5, 11, 8, 30));
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'July 2026' })).toBeInTheDocument();
    expect(day('2026-07-11')).toHaveFocus();
    await userEvent.keyboard('{PageUp}{PageUp}');
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeInTheDocument();
    expect(day('2026-05-11')).toHaveFocus();
  });

  it('changes the year with Shift+PageUp and Shift+PageDown', async () => {
    await openAt(new Date(2026, 5, 11, 8, 30));
    await userEvent.keyboard('{Shift>}{PageDown}{/Shift}');
    expect(screen.getByRole('grid', { name: 'June 2027' })).toBeInTheDocument();
    expect(day('2027-06-11')).toHaveFocus();
    await userEvent.keyboard('{Shift>}{PageUp}{PageUp}{/Shift}');
    expect(screen.getByRole('grid', { name: 'June 2025' })).toBeInTheDocument();
  });

  it('clamps the focused day into a shorter month: 31 January to 28 February, and 29 February in a leap year', async () => {
    await openAt(new Date(2026, 0, 31, 8, 30));
    await userEvent.keyboard('{PageDown}');
    expect(screen.getByRole('grid', { name: 'February 2026' })).toBeInTheDocument();
    expect(day('2026-02-28')).toHaveFocus();
    await userEvent.keyboard('{PageUp}');
    expect(day('2026-01-28')).toHaveFocus();
  });

  it('clamps 31 January to 29 February in a leap year', async () => {
    await openAt(new Date(2028, 0, 31, 8, 30));
    await userEvent.keyboard('{PageDown}');
    expect(day('2028-02-29')).toHaveFocus();
  });

  it('shows 29 February only in leap years', async () => {
    await openAt(new Date(2028, 1, 10, 8, 30));
    expect(day('2028-02-29')).not.toHaveAttribute('data-outside');
  });

  it('selects a day of the neighbouring month with Enter, switching to that month and keeping focus', async () => {
    await openAt(new Date(2026, 5, 30, 8, 30));
    day('2026-07-02').focus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('grid', { name: 'July 2026' })).toBeInTheDocument();
    expect(day('2026-07-02')).toHaveFocus();
    expect(within(screen.getByRole('dialog')).getByRole('gridcell', { selected: true })).toContainElement(
      day('2026-07-02'),
    );
  });

  it('changes the month with the buttons, named for the target month', async () => {
    await openAt(JUNE_13);
    await userEvent.click(screen.getByRole('button', { name: 'Next month: July 2026' }));
    expect(screen.getByRole('grid', { name: 'July 2026' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Previous month: June 2026' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous month: May 2026' }));
    expect(screen.getByRole('grid', { name: 'May 2026' })).toBeInTheDocument();
  });

  it('renders seven named weekdays starting on Monday and 42 day cells', async () => {
    render(
      <TumAetUiI18nProvider translate={(key) => key} locale="en-US">
        <DatePicker aria-label="Deadline" defaultValue={JUNE_13} />
      </TumAetUiI18nProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'tumAetUi.datePicker.open' }));
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.getAttribute('aria-label'))).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(day('2026-06-13')).toHaveAccessibleName('Saturday, June 13, 2026');
  });
});

describe('DatePicker time', () => {
  const hour = () => screen.getByRole('textbox', { name: 'Hour' });
  const minute = () => screen.getByRole('textbox', { name: 'Minute' });

  it('steps hours and minutes with wrap-around and without changing the day', async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker aria-label="Deadline" defaultValue={new Date(2026, 5, 13, 23, 59)} onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increment minute' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 23, 0));
    await userEvent.click(screen.getByRole('button', { name: 'Increment hour' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 0, 0));
    await userEvent.click(screen.getByRole('button', { name: 'Decrement hour' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 23, 0));
    await userEvent.click(screen.getByRole('button', { name: 'Decrement minute' }));
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 23, 59));
    expect(field()).toHaveValue('13.06.2026 23:59');
  });

  it('commits typed hours and minutes on blur and on Enter, and restores invalid ones', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.clear(hour());
    await userEvent.type(hour(), '7');
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 7, 30));
    expect(hour()).toHaveValue('07');
    await userEvent.clear(minute());
    await userEvent.type(minute(), '45{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 7, 45));
    await userEvent.clear(hour());
    await userEvent.type(hour(), '25');
    await userEvent.tab();
    expect(hour()).toHaveValue('07');
    await userEvent.clear(minute());
    await userEvent.type(minute(), '9x');
    await userEvent.tab();
    expect(minute()).toHaveValue('45');
  });

  it('steps from an uncommitted field value with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" defaultValue={JUNE_13} onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.clear(hour());
    await userEvent.type(hour(), '11{ArrowUp}');
    expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 12, 30));
    expect(hour()).toHaveValue('12');
    await userEvent.type(hour(), '{ArrowDown}{ArrowDown}');
    expect(hour()).toHaveValue('10');
  });

  it('leaves the fields empty until a time is set, then uses today for the date', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(hour()).toHaveValue('');
    expect(minute()).toHaveValue('');
    await userEvent.click(screen.getByRole('button', { name: 'Increment hour' }));
    const value = onValueChange.mock.calls[0]![0] as Date;
    const today = new Date();
    expect([value.getFullYear(), value.getMonth(), value.getDate(), value.getHours(), value.getMinutes()]).toEqual([
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      1,
      0,
    ]);
    expect(hour()).toHaveValue('01');
  });

  it('can reach midnight on an empty picker by stepping down', async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Deadline" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Increment minute' }));
    await userEvent.click(screen.getByRole('button', { name: 'Decrement minute' }));
    expect((onValueChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(0);
  });

  describe('timeOnly', () => {
    it('shows only the time, keeps the date of the value and opens a dialog without a calendar', () => {
      const onValueChange = vi.fn();
      render(<DatePicker aria-label="Start" timeOnly defaultValue={JUNE_13} onValueChange={onValueChange} />);
      expect(field()).toHaveValue('08:30');
      fireEvent.change(field(), { target: { value: '10:15' } });
      expect(onValueChange).toHaveBeenLastCalledWith(new Date(2026, 5, 13, 10, 15));
      expect(field()).toHaveValue('10:15');
    });

    it('puts a time typed into an empty field on today', async () => {
      const onValueChange = vi.fn();
      render(<DatePicker aria-label="Start" timeOnly onValueChange={onValueChange} />);
      await userEvent.type(field(), '09:05');
      const value = onValueChange.mock.calls[0]![0] as Date;
      expect(value.getDate()).toBe(new Date().getDate());
      expect([value.getHours(), value.getMinutes()]).toEqual([9, 5]);
    });

    it('rejects a full date and time and an incomplete time, with the time message', async () => {
      render(<DatePicker aria-label="Start" timeOnly />);
      await userEvent.type(field(), '13.06.2026 08:30');
      expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid time.');
    });

    it('opens the clock dialog with focus on the hour field and commits back to the field', async () => {
      render(<DatePicker aria-label="Start" timeOnly defaultValue={JUNE_13} />);
      await userEvent.click(screen.getByRole('button', { name: 'Open clock' }));
      expect(screen.getByRole('dialog', { name: 'Choose time' })).toBeInTheDocument();
      expect(screen.queryByRole('grid')).toBeNull();
      await waitFor(() => {
        expect(hour()).toHaveFocus();
      });
      await userEvent.click(screen.getByRole('button', { name: 'Increment hour' }));
      expect(field()).toHaveValue('09:30');
    });
  });

  describe('inline', () => {
    it('renders the controls in place without a field, trigger or popup', async () => {
      const onValueChange = vi.fn();
      render(<DatePicker aria-label="Start" timeOnly inline defaultValue={JUNE_13} onValueChange={onValueChange} />);
      expect(screen.queryByRole('combobox')).toBeNull();
      expect(screen.getByRole('group', { name: 'Start' })).toBeInTheDocument();
      expect(hour()).toHaveValue('08');
      await userEvent.click(screen.getByRole('button', { name: 'Increment hour' }));
      expect(hour()).toHaveValue('09');
      expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 13, 9, 30));
    });

    it('shows a calendar that selects days, and marks the time fields required', async () => {
      const onValueChange = vi.fn();
      const { container } = render(
        <DatePicker aria-label="Start" inline aria-required defaultValue={JUNE_13} onValueChange={onValueChange} />,
      );
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(hour()).toHaveAttribute('aria-required', 'true');
      await userEvent.click(container.querySelector<HTMLElement>('button[data-date="2026-06-20"]')!);
      expect(onValueChange).toHaveBeenCalledWith(new Date(2026, 5, 20, 8, 30));
      expect(screen.getByRole('grid', { name: 'June 2026' })).toBeInTheDocument();
    });

    it('starts with empty steppers and follows a value that is set from outside', () => {
      const { rerender } = render(<DatePicker aria-label="Start" timeOnly inline value={null} />);
      expect(hour()).toHaveValue('');
      rerender(<DatePicker aria-label="Start" timeOnly inline value={JUNE_13} />);
      expect(hour()).toHaveValue('08');
    });

    it('moves the calendar to the month of a value set from outside', () => {
      const { rerender } = render(<DatePicker aria-label="Start" inline value={JUNE_13} />);
      rerender(<DatePicker aria-label="Start" inline value={new Date(2027, 2, 3)} />);
      expect(screen.getByRole('grid', { name: 'March 2027' })).toBeInTheDocument();
    });
  });
});

it('preserves native callback ref lifetimes while values and calendar months change', () => {
  const inputCleanup = vi.fn();
  const calendarCleanup = vi.fn();
  const inputRef = vi.fn<(node: HTMLInputElement | null) => () => void>(() => inputCleanup);
  const calendarRef = vi.fn<(node: HTMLDivElement | null) => () => void>(() => calendarCleanup);
  const view = (value: Date) => (
    <>
      <DatePicker aria-label="Deadline" value={value} inputRef={inputRef} />
      <Calendar activeMonth={value} selected={value} ref={calendarRef} />
    </>
  );
  const { container, rerender, unmount } = render(view(JUNE_13));
  const calendar = container.querySelector('.tumaet-ui-calendar');
  rerender(view(new Date(2026, 6, 13)));
  expect(field()).toHaveValue('13.07.2026 00:00');
  expect(inputRef).toHaveBeenCalledExactlyOnceWith(field());
  expect(calendarRef).toHaveBeenCalledExactlyOnceWith(calendar);
  expect(inputCleanup).not.toHaveBeenCalled();
  expect(calendarCleanup).not.toHaveBeenCalled();
  unmount();
  expect(inputCleanup).toHaveBeenCalledOnce();
  expect(calendarCleanup).toHaveBeenCalledOnce();
});

describe('accessibility', () => {
  it('has no axe violations closed and with the dialog open', async () => {
    render(
      <main>
        <DatePicker aria-label="Deadline" defaultValue={JUNE_13} showTimeZoneWarning />
      </main>,
    );
    await expectNoA11yViolations(document.body);
    await userEvent.click(screen.getByRole('button', { name: 'Open calendar' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await expectNoA11yViolations(screen.getByRole('dialog'));
    await expectNoA11yViolations(document.querySelector('main')!);
  });
});
