import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { InputNumber } from './input-number';

describe('InputNumber', () => {
  it('formats typed integers with grouping and reports numbers', async () => {
    const onChange = vi.fn();
    render(<InputNumber aria-label="Points" locale="en-US" onChange={onChange} />);
    const input = screen.getByRole('spinbutton', { name: 'Points' });
    await userEvent.type(input, '1234');
    expect(input).toHaveValue('1,234');
    expect(onChange).toHaveBeenLastCalledWith(1234);
    expect(input).toHaveAttribute('aria-valuenow', '1234');
  });

  it('steps with the arrow keys and clamps to min and max', async () => {
    render(<InputNumber aria-label="Points" defaultValue={9} min={0} max={10} step={2} />);
    const input = screen.getByRole('spinbutton');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveValue('10');
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    expect(input).toHaveValue('6');
  });

  it('keeps a fraction while typing and truncates extra digits', async () => {
    const onChange = vi.fn();
    render(<InputNumber aria-label="Price" locale="en-US" maxFractionDigits={2} onChange={onChange} />);
    const input = screen.getByRole('spinbutton');
    await userEvent.type(input, '12.50');
    expect(input).toHaveValue('12.50');
    await userEvent.type(input, '9');
    await userEvent.tab();
    expect(input).toHaveValue('12.5');
    expect(onChange).toHaveBeenLastCalledWith(12.5);
  });

  it('supports prefix, suffix and controlled values', async () => {
    function Host() {
      const [v, setV] = useState<number | null>(5);
      return <InputNumber aria-label="Cost" locale="en-US" prefix="$" suffix=" EUR" value={v} onChange={setV} />;
    }
    render(<Host />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue('$5 EUR');
    input.focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(input).toHaveValue('$6 EUR');
  });

  it('steps with buttons, which stay out of the accessibility tree', async () => {
    render(<InputNumber aria-label="Points" showButtons defaultValue={1} />);
    const [up, down] = document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button');
    await userEvent.click(up!);
    expect(screen.getByRole('spinbutton')).toHaveValue('2');
    await userEvent.click(down!);
    await userEvent.click(down!);
    expect(screen.getByRole('spinbutton')).toHaveValue('0');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('has no axe violations', async () => {
    const { container } = render(<InputNumber aria-label="Points" showButtons defaultValue={3} min={0} max={9} />);
    await expectNoA11yViolations(container);
  });

  describe('behaviour from the Angular spec', () => {
    const typeInto = async (input: HTMLElement, text: string) => userEvent.type(input, text);

    it('forwards native and accessibility attributes to the inner input', () => {
      render(
        <>
          <span id="lbl">Capacity</span>
          <InputNumber
            id="capacity"
            name="cap"
            placeholder="Capacity"
            aria-labelledby="lbl"
            aria-describedby="help"
            min={1}
            max={50}
          />
        </>,
      );
      const input = screen.getByRole('spinbutton', { name: 'Capacity' });
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('inputmode', 'numeric');
      expect(input).toHaveAttribute('id', 'capacity');
      expect(input).toHaveAttribute('name', 'cap');
      expect(input).toHaveAttribute('placeholder', 'Capacity');
      expect(input).toHaveAttribute('aria-describedby', 'help');
      expect(input).toHaveAttribute('aria-valuemin', '1');
      expect(input).toHaveAttribute('aria-valuemax', '50');
      expect(input).not.toHaveAttribute('aria-valuenow');
    });

    it('renders the stepper only with showButtons', () => {
      const { rerender } = render(<InputNumber aria-label="n" />);
      expect(document.querySelectorAll('.tumaet-ui-input-number-button')).toHaveLength(0);
      rerender(<InputNumber aria-label="n" showButtons />);
      expect(document.querySelectorAll('.tumaet-ui-input-number-button')).toHaveLength(2);
    });

    it('formats with grouping, a locale, and without grouping', () => {
      const { rerender } = render(<InputNumber aria-label="n" locale="en" value={5000} />);
      expect(screen.getByRole('spinbutton')).toHaveValue('5,000');
      rerender(<InputNumber aria-label="n" locale="de" value={5000} />);
      expect(screen.getByRole('spinbutton')).toHaveValue('5.000');
      rerender(<InputNumber aria-label="n" locale="en" useGrouping={false} value={5000} />);
      expect(screen.getByRole('spinbutton')).toHaveValue('5000');
    });

    it('parses typed digits, ignoring separators, and reports null when emptied', async () => {
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" locale="en" onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      await typeInto(input, '1234');
      expect(onChange).toHaveBeenLastCalledWith(1234);
      await userEvent.clear(input);
      expect(onChange).toHaveBeenLastCalledWith(null);
      expect(input).not.toHaveAttribute('aria-valuenow');
    });

    it('keeps prefix and suffix around typed numbers', async () => {
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" prefix="every " suffix=" week(s)" defaultValue={2} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveValue('every 2 week(s)');
      await userEvent.clear(input);
      await typeInto(input, 'every 3 week(s)');
      expect(onChange).toHaveBeenLastCalledWith(3);
      expect(input).toHaveValue('every 3 week(s)');
      expect(input).toHaveAttribute('aria-valuetext', 'every 3 week(s)');
    });

    it('clamps to min and max on blur', async () => {
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" locale="en" min={1} max={5000} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      await typeInto(input, '99999');
      expect(onChange).toHaveBeenLastCalledWith(99999);
      await userEvent.tab();
      expect(onChange).toHaveBeenLastCalledWith(5000);
      expect(input).toHaveValue('5,000');
    });

    it('steps with the buttons and keys, clamps, and starts from the lower bound when empty', async () => {
      render(<InputNumber aria-label="n" showButtons min={1} max={5} />);
      const input = screen.getByRole('spinbutton');
      const [up, down] = document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button');
      await userEvent.click(up!);
      expect(input).toHaveValue('1');
      await userEvent.click(up!);
      await userEvent.click(up!);
      expect(input).toHaveValue('3');
      for (let i = 0; i < 4; i++) await userEvent.click(down!);
      expect(input).toHaveValue('1');
      expect(input).toHaveFocus();
      await userEvent.keyboard('{ArrowUp}');
      expect(input).toHaveValue('2');
      await userEvent.keyboard('{ArrowDown}');
      expect(input).toHaveValue('1');
    });

    it('does not step or accept input while disabled or read-only', async () => {
      const onChange = vi.fn();
      const { unmount } = render(<InputNumber aria-label="n" showButtons disabled onChange={onChange} />);
      const [up] = document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button');
      expect(screen.getByRole('spinbutton')).toBeDisabled();
      expect(up).toBeDisabled();
      await userEvent.click(up!);
      expect(onChange).not.toHaveBeenCalled();
      unmount();

      render(<InputNumber aria-label="n" showButtons readOnly defaultValue={3} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      input.focus();
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.click(document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button')[0]!);
      expect(onChange).not.toHaveBeenCalled();
      expect(input).toHaveValue('3');
    });

    it('lets a negative number be typed digit by digit without erasing the minus', async () => {
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" locale="en" min={-100} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      await typeInto(input, '-');
      expect(input).toHaveValue('-');
      expect(onChange).toHaveBeenLastCalledWith(null);
      await typeInto(input, '5');
      expect(input).toHaveValue('-5');
      expect(onChange).toHaveBeenLastCalledWith(-5);
    });

    it('parses the digits, grouping and minus sign of the configured locale', async () => {
      const locale = 'fa-IR-u-nu-arabext';
      const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(-1234);
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" locale={locale} min={-5000} onChange={onChange} />);
      const input = screen.getByRole('spinbutton');
      await typeInto(input, formatted);
      expect(onChange).toHaveBeenLastCalledWith(-1234);
      expect(input).toHaveValue(formatted);
    });

    it('keeps the caret in place while formatting a mid-string edit', async () => {
      const onChange = vi.fn();
      render(<InputNumber aria-label="n" locale="en" onChange={onChange} />);
      const input = screen.getByRole<HTMLInputElement>('spinbutton');
      await typeInto(input, '1234');
      expect(input).toHaveValue('1,234');
      await userEvent.type(input, '5', { initialSelectionStart: 3, initialSelectionEnd: 3 });
      expect(onChange).toHaveBeenLastCalledWith(12534);
      expect(input).toHaveValue('12,534');
      expect(input.selectionStart).toBe(4);
    });

    it('keeps the caret in place with localized digits', async () => {
      render(<InputNumber aria-label="n" locale="ar-EG-u-nu-arab" />);
      const input = screen.getByRole<HTMLInputElement>('spinbutton');
      await typeInto(input, '١٢٣٤');
      expect(input).toHaveValue('١٬٢٣٤');
      await userEvent.type(input, '٥', { initialSelectionStart: 3, initialSelectionEnd: 3 });
      expect(input).toHaveValue('١٢٬٥٣٤');
      expect(input.selectionStart).toBe(4);
    });

    it('reflects a value changed from outside while the field is focused', () => {
      const { rerender } = render(<InputNumber aria-label="n" locale="en" value={1234} />);
      const input = screen.getByRole('spinbutton');
      input.focus();
      rerender(<InputNumber aria-label="n" locale="en" value={42} />);
      expect(input).toHaveValue('42');
      rerender(<InputNumber aria-label="n" locale="en" value={null} />);
      expect(input).toHaveValue('');
    });

    it('marks the field invalid', () => {
      render(<InputNumber aria-label="n" invalid />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('spinbutton')).toHaveAttribute('data-invalid');
    });

    describe('decimals', () => {
      it('switches the inputmode and formats fractions', () => {
        const { rerender } = render(<InputNumber aria-label="n" locale="en" maxFractionDigits={1} value={12.5} />);
        const input = screen.getByRole('spinbutton');
        expect(input).toHaveAttribute('inputmode', 'decimal');
        expect(input).toHaveValue('12.5');
        rerender(<InputNumber aria-label="n" locale="en" maxFractionDigits={0} value={12.5} />);
        expect(input).toHaveAttribute('inputmode', 'numeric');
      });

      it('keeps a trailing decimal separator while it is typed', async () => {
        const onChange = vi.fn();
        render(<InputNumber aria-label="n" locale="en" maxFractionDigits={1} onChange={onChange} />);
        const input = screen.getByRole('spinbutton');
        await typeInto(input, '12.');
        expect(input).toHaveValue('12.');
        expect(onChange).toHaveBeenLastCalledWith(12);
        await typeInto(input, '5');
        expect(onChange).toHaveBeenLastCalledWith(12.5);
      });

      it('truncates the fraction and formats on blur', async () => {
        const onChange = vi.fn();
        render(<InputNumber aria-label="n" locale="en" maxFractionDigits={1} onChange={onChange} />);
        const input = screen.getByRole('spinbutton');
        await typeInto(input, '12.55');
        expect(onChange).toHaveBeenLastCalledWith(12.5);
        await userEvent.tab();
        expect(input).toHaveValue('12.5');
      });

      it('uses the locale decimal separator and ignores its grouping separator', async () => {
        const onChange = vi.fn();
        render(<InputNumber aria-label="n" locale="de" maxFractionDigits={1} onChange={onChange} />);
        const input = screen.getByRole('spinbutton');
        await typeInto(input, '1.234,5');
        expect(onChange).toHaveBeenLastCalledWith(1234.5);
        await userEvent.tab();
        expect(input).toHaveValue('1.234,5');
      });

      it('accepts extra decimal separators when asked to', async () => {
        const onChange = vi.fn();
        render(
          <InputNumber
            aria-label="n"
            locale="de"
            maxFractionDigits={1}
            useGrouping={false}
            acceptedDecimalSeparators={['.']}
            onChange={onChange}
          />,
        );
        await typeInto(screen.getByRole('spinbutton'), '1.5');
        expect(onChange).toHaveBeenLastCalledWith(1.5);
      });

      it('steps a fractional step without float error', async () => {
        render(
          <InputNumber aria-label="n" locale="en" maxFractionDigits={1} step={0.1} showButtons defaultValue={0.2} />,
        );
        await userEvent.click(document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button')[0]!);
        expect(screen.getByRole('spinbutton')).toHaveAttribute('aria-valuenow', '0.3');
      });

      it('adds the step as it is by default, and snaps to the grid with snapToStep', async () => {
        const { rerender } = render(
          <InputNumber aria-label="n" locale="en" maxFractionDigits={1} step={0.5} defaultValue={1.3} showButtons />,
        );
        const input = screen.getByRole('spinbutton');
        const [up, down] = document.querySelectorAll<HTMLButtonElement>('.tumaet-ui-input-number-button');
        await userEvent.click(up!);
        expect(input).toHaveAttribute('aria-valuenow', '1.8');

        const onChange = vi.fn();
        rerender(
          <InputNumber
            aria-label="n"
            locale="en"
            maxFractionDigits={1}
            step={0.5}
            snapToStep
            showButtons
            value={1.3}
            onChange={onChange}
          />,
        );
        await userEvent.click(up!);
        expect(onChange).toHaveBeenLastCalledWith(1.5);
        await userEvent.click(down!);
        expect(onChange).toHaveBeenLastCalledWith(1);
        input.focus();
        await userEvent.keyboard('{ArrowUp}');
        expect(onChange).toHaveBeenLastCalledWith(1.5);
      });

      it('groups the integer part and clamps on blur', async () => {
        const onChange = vi.fn();
        render(<InputNumber aria-label="n" locale="en" maxFractionDigits={1} min={0} max={9999} onChange={onChange} />);
        const input = screen.getByRole('spinbutton');
        await typeInto(input, '1234.5');
        await userEvent.tab();
        expect(input).toHaveValue('1,234.5');
        await userEvent.clear(input);
        await typeInto(input, '99999.9');
        await userEvent.tab();
        expect(onChange).toHaveBeenLastCalledWith(9999);
      });
    });

    it('is described and named by an enclosing FormField', () => {
      render(
        <FormField label="Capacity" hint="Maximum group size">
          {(control) => <InputNumber {...control} />}
        </FormField>,
      );
      const input = screen.getByRole('spinbutton', { name: 'Capacity' });
      expect(input).toHaveAccessibleDescription('Maximum group size');
    });
  });
});
