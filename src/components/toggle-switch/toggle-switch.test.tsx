import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { ToggleSwitch } from './toggle-switch';

describe('ToggleSwitch', () => {
  it('has role switch and toggles on click', async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch aria-label="Notifications" onChange={onChange} />);
    const sw = screen.getByRole('switch', { name: 'Notifications' });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it('toggles with Space', async () => {
    render(<ToggleSwitch aria-label="Notifications" defaultChecked />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('does nothing when disabled', async () => {
    render(<ToggleSwitch aria-label="Notifications" disabled />);
    await userEvent.click(screen.getByRole('switch'));
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <label htmlFor="mail-switch">
          Mail <ToggleSwitch id="mail-switch" />
        </label>
        <ToggleSwitch aria-label="B" defaultChecked />
      </>,
    );
    await expectNoA11yViolations(container);
  });

  it('exposes switch semantics on a native checkbox and reflects the state in data-checked', async () => {
    render(<ToggleSwitch aria-label="Mail" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('type', 'checkbox');
    const root = sw.parentElement!;
    expect(root).toHaveAttribute('data-checked', 'false');
    await userEvent.click(sw);
    expect(root).toHaveAttribute('data-checked', 'true');
    await userEvent.click(sw);
    expect(root).toHaveAttribute('data-checked', 'false');
  });

  it('stays as the parent says while controlled', async () => {
    const onChange = vi.fn();
    render(<ToggleSwitch aria-label="Mail" checked={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true, expect.anything());
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('is named by aria-labelledby and a label for the id, and marks the disabled state', async () => {
    const onChange = vi.fn();
    render(
      <>
        <label id="lbl" htmlFor="sw">
          Email notifications
        </label>
        <ToggleSwitch id="sw" aria-labelledby="lbl" onChange={onChange} />
        <ToggleSwitch aria-label="Off" disabled />
      </>,
    );
    const sw = screen.getByRole('switch', { name: 'Email notifications' });
    await userEvent.click(screen.getByText('Email notifications'));
    expect(sw).toBeChecked();
    const disabled = screen.getByRole('switch', { name: 'Off' });
    expect(disabled).toBeDisabled();
    expect(disabled.parentElement).toHaveAttribute('data-disabled');
  });

  it('takes description and invalid state from a FormField', () => {
    render(
      <FormField label="Mail" hint="Weekly digest" invalid error="Not available">
        {(field) => <ToggleSwitch {...field} />}
      </FormField>,
    );
    const sw = screen.getByRole('switch', { name: 'Mail' });
    expect(sw).toHaveAttribute('aria-invalid', 'true');
    expect(sw).toHaveAccessibleDescription('Not available');
  });
});
