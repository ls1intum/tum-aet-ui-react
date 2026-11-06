import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { Checkbox } from './checkbox';

const noop = (): void => {
  // Intentionally does nothing.
};

describe('Checkbox', () => {
  it('toggles on click and calls onChange with the new state', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Agree" onChange={onChange} />);
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    await userEvent.click(box);
    expect(box).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with Space and stays controlled', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="Agree" checked={false} onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('exposes the indeterminate state without changing checked', () => {
    render(<Checkbox aria-label="All" indeterminate />);
    const box = screen.getByRole<HTMLInputElement>('checkbox');
    expect(box.indeterminate).toBe(true);
    expect(box).not.toBeChecked();
  });

  it('cannot be toggled when disabled', async () => {
    render(<Checkbox aria-label="Agree" disabled />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <Checkbox aria-label="A" defaultChecked />
        <Checkbox aria-label="B" indeterminate />
        <Checkbox aria-label="C" disabled />
      </>,
    );
    await expectNoA11yViolations(container);
  });

  it('keeps the native indeterminate state after a click, as the parent owns it', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="All" indeterminate checked={false} onChange={onChange} />);
    const box = screen.getByRole<HTMLInputElement>('checkbox');
    await userEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(box.indeterminate).toBe(true);
  });

  it('forwards id, name and aria attributes, and keeps the description while disabled', () => {
    render(<Checkbox id="accept" name="terms" aria-label="Accept terms" aria-describedby="hint" disabled />);
    const box = screen.getByRole('checkbox', { name: 'Accept terms' });
    expect(box).toHaveAttribute('id', 'accept');
    expect(box).toHaveAttribute('name', 'terms');
    expect(box).toHaveAttribute('aria-describedby', 'hint');
    expect(box).toBeDisabled();
  });

  it('shows the tick when checked and the dash when indeterminate, the dash winning', () => {
    const { container, rerender } = render(<Checkbox aria-label="x" />);
    expect(container.querySelector('.tumaet-ui-checkbox-icon')).toBeNull();
    rerender(<Checkbox aria-label="x" checked onChange={noop} />);
    expect(container.querySelectorAll('.tumaet-ui-checkbox-icon')).toHaveLength(1);
    const tick = container.querySelector('.tumaet-ui-checkbox-icon')!.innerHTML;
    rerender(<Checkbox aria-label="x" checked indeterminate onChange={noop} />);
    expect(container.querySelectorAll('.tumaet-ui-checkbox-icon')).toHaveLength(1);
    expect(container.querySelector('.tumaet-ui-checkbox-icon')!.innerHTML).not.toBe(tick);
  });

  it('does not call onChange for a disabled toggle attempt', async () => {
    const onChange = vi.fn();
    render(<Checkbox aria-label="x" checked disabled onChange={onChange} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('takes id, description and invalid state from a FormField', () => {
    render(
      <FormField label="Agree" hint="Required to continue" invalid error="Accept the terms">
        {(field) => <Checkbox {...field} />}
      </FormField>,
    );
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('Accept the terms');
  });
});
