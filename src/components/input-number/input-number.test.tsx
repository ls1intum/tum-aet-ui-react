import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { TumAetUiI18nProvider } from '../../internal/i18n';
import { FormField } from '../form-field/form-field';
import { InputNumber, type InputNumberProps } from './input-number';

function Controlled({
  value: initial = null,
  onValueChange,
  ...props
}: Omit<InputNumberProps, 'value'> & { value?: number | null }) {
  const [value, setValue] = useState(initial);
  return (
    <InputNumber
      {...props}
      value={value}
      onValueChange={(next, details) => {
        onValueChange?.(next, details);
        if (!details.isCanceled) setValue(next);
      }}
    />
  );
}

describe('InputNumber', () => {
  it('delegates locale parsing, formatting and empty semantics to Base UI', async () => {
    const change = vi.fn();
    render(
      <Controlled aria-label="Weight" locale="de-DE" format={{ maximumFractionDigits: 2 }} onValueChange={change} />,
    );
    const input = screen.getByRole('textbox', { name: 'Weight' });
    await userEvent.type(input, '1234,5');
    await userEvent.tab();
    expect(input).toHaveValue('1.234,5');
    expect(change).toHaveBeenLastCalledWith(1234.5, expect.objectContaining({ reason: 'input-change' }));
    await userEvent.clear(input);
    expect(change).toHaveBeenLastCalledWith(null, expect.objectContaining({ reason: 'input-clear' }));
  });
  it('steps within bounds using keyboard and pointer buttons', async () => {
    render(<Controlled aria-label="Capacity" value={9} min={0} max={10} showButtons />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveValue('10');
    expect(screen.getByRole('button', { name: 'Increase value' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Decrease value' }));
    expect(input).toHaveValue('9');
  });
  it('preserves cancellation and native key handlers', async () => {
    const change = vi.fn<NonNullable<InputNumberProps['onValueChange']>>((_, details) => details.cancel());
    const { rerender } = render(<Controlled aria-label="Points" value={2} onValueChange={change} />);
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    expect(change).toHaveBeenCalledOnce();
    expect(input).toHaveValue('2');
    rerender(
      <Controlled aria-label="Points" value={2} onValueChange={change} onKeyDown={(event) => event.preventDefault()} />,
    );
    await userEvent.keyboard('{ArrowUp}');
    expect(change).toHaveBeenCalledOnce();
  });
  it('targets the visible labelable input for FormField props, refs, render and events', async () => {
    const ref = createRef<HTMLInputElement>();
    const root = createRef<HTMLDivElement>();
    const focus = vi.fn();
    render(
      <FormField label="Capacity" hint="Maximum size" invalid error="Too large">
        {(control) => (
          <InputNumber
            {...control}
            value={4}
            ref={ref}
            rootProps={{ ref: root }}
            onFocus={focus}
            render={(props, state) => <input {...props} data-numeric-value={state.value} />}
          />
        )}
      </FormField>,
    );
    const input = screen.getByLabelText('Capacity');
    expect(ref.current).toBe(input);
    expect(input).toHaveAccessibleDescription('Too large');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-numeric-value', '4');
    expect(root.current).not.toHaveAttribute('id');
    await userEvent.click(screen.getByText('Capacity'));
    expect(input).toHaveFocus();
    expect(focus).toHaveBeenCalled();
  });
  it('serializes the raw number and supports caller-owned and canceled reset', async () => {
    function Form() {
      const [value, setValue] = useState<number | null>(2);
      const [cancel, setCancel] = useState(true);
      return (
        <form
          onReset={(event) => {
            if (cancel) event.preventDefault();
            else setValue(2);
          }}
        >
          <InputNumber aria-label="Count" name="count" value={value} onValueChange={setValue} required />
          <button type="reset">Reset</button>
          <button type="button" onClick={() => setCancel(false)}>
            Allow reset
          </button>
        </form>
      );
    }
    const { container } = render(<Form />);
    const form = container.querySelector('form')!;
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    expect(form.checkValidity()).toBe(false);
    await userEvent.type(input, '5');
    expect(Object.fromEntries(new FormData(form))).toEqual({ count: '5' });
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('5');
    await userEvent.click(screen.getByRole('button', { name: 'Allow reset' }));
    await userEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('2');
    expect(Object.fromEntries(new FormData(form))).toEqual({ count: '2' });
  });
  it('honors disabled and readonly behavior and decorative affixes', async () => {
    const change = vi.fn();
    render(
      <>
        <InputNumber aria-label="Disabled" value={3} disabled onValueChange={change} showButtons />
        <InputNumber aria-label="Read only" value={4} readOnly onValueChange={change} prefix="every" suffix="weeks" />
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Disabled' })).toBeDisabled();
    await userEvent.click(screen.getByRole('textbox', { name: 'Read only' }));
    await userEvent.keyboard('{ArrowUp}5');
    expect(change).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: 'Read only' })).toHaveValue('4');
    expect(screen.getByText('weeks')).toHaveAttribute('aria-hidden', 'true');
  });
  it('localizes generated stepper names and number-field semantics through the library provider', () => {
    const translations: Record<string, string> = {
      'tumAetUi.inputNumber.increment': 'Mehr',
      'tumAetUi.inputNumber.decrement': 'Weniger',
      'tumAetUi.inputNumber.roleDescription': 'Zahlenfeld',
    };
    render(
      <TumAetUiI18nProvider translate={(key) => translations[key] ?? key}>
        <InputNumber aria-label="Anzahl" value={3} showButtons />
      </TumAetUiI18nProvider>,
    );
    expect(screen.getByRole('textbox', { name: 'Anzahl' })).toHaveAttribute('aria-roledescription', 'Zahlenfeld');
    expect(screen.getByRole('button', { name: 'Mehr' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Weniger' })).toBeEnabled();
  });

  it('has no axe violations', async () => {
    const { container } = render(<InputNumber aria-label="Count" value={3} showButtons />);
    await expectNoA11yViolations(container);
  });
});
