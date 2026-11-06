import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Field, FieldError, FieldLabel } from '../form-field/form-field';
import { ToggleSwitch } from './toggle-switch';

describe('ToggleSwitch', () => {
  it('toggles with Space and reports a native input change event', async () => {
    const states: boolean[] = [];
    const change = vi.fn<NonNullable<React.ComponentProps<typeof ToggleSwitch>['onChange']>>((event) => {
      expect(event.currentTarget).toBe(screen.getByRole('switch'));
      states.push(event.currentTarget.checked);
    });
    render(<ToggleSwitch aria-label="Mail" defaultChecked onChange={change} />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(states).toEqual([false]);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('keeps disabled and readonly controls unchanged and controlled state with its caller', async () => {
    const change = vi.fn();
    render(
      <>
        <ToggleSwitch aria-label="Disabled" disabled onChange={change} />
        <ToggleSwitch aria-label="Read only" readOnly onChange={change} />
        <ToggleSwitch aria-label="Controlled" checked={false} onChange={change} />
      </>,
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Disabled' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Read only' }));
    expect(change).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('switch', { name: 'Controlled' }));
    expect(change).toHaveBeenCalledWith(expect.objectContaining({ type: 'change' }));
    expect(screen.getByRole('switch', { name: 'Controlled' })).not.toBeChecked();
  });

  it('uses explicit Field associations and forwards the native input ref with cleanup', async () => {
    const input = createRef<HTMLInputElement>();
    const { container, unmount } = render(
      <Field data-invalid>
        <FieldLabel htmlFor="mail">Mail</FieldLabel>
        <ToggleSwitch ref={input} id="mail" aria-describedby="mail-error" aria-invalid />
        <FieldError id="mail-error">Not available</FieldError>
      </Field>,
    );
    const toggle = screen.getByRole('switch', { name: 'Mail' });
    expect(input.current).toBe(toggle);
    expect(input.current).toBeInstanceOf(HTMLInputElement);
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(toggle).toHaveAccessibleDescription('Not available');
    await userEvent.click(screen.getByText('Mail'));
    expect(toggle).toBeChecked();
    await expectNoA11yViolations(container);
    unmount();
    expect(input.current).toBeNull();
  });
});
