import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Field, FieldDescription, FieldError, FieldLabel } from '../form-field/form-field';
import { RadioButton, RadioGroup } from '../radio-button/radio-button';
import { ToggleSwitch } from '../toggle-switch/toggle-switch';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('reports native input change events and lets React own controlled selection', async () => {
    const states: boolean[] = [];
    const change = vi.fn<NonNullable<React.ComponentProps<typeof Checkbox>['onChange']>>((event) => {
      expect(event.currentTarget).toBe(screen.getByRole('checkbox'));
      expect(event.nativeEvent).toBeInstanceOf(Event);
      states.push(event.currentTarget.checked);
    });
    const { rerender } = render(<Checkbox aria-label="Agree" onChange={change} />);
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(states).toEqual([true]);
    expect(screen.getByRole('checkbox')).toBeChecked();
    rerender(<Checkbox key="controlled" aria-label="Agree" checked={false} onChange={change} />);
    await userEvent.click(screen.getByRole('checkbox'));
    expect(states).toEqual([true, true]);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('keeps mixed state and native submission independent', () => {
    const input = createRef<HTMLInputElement>();
    const { container } = render(
      <form>
        <Checkbox name="all" aria-label="All" indeterminate defaultChecked ref={input} />
      </form>,
    );
    expect(screen.getByRole('checkbox')).toBePartiallyChecked();
    expect(input.current?.indeterminate).toBe(true);
    expect(new FormData(container.querySelector('form')!).get('all')).toBe('on');
  });

  it('uses explicit Field labeling, descriptions and caller-owned invalid state', async () => {
    const { container } = render(
      <>
        <Field data-invalid>
          <FieldLabel htmlFor="agree">Agree</FieldLabel>
          <Checkbox id="agree" aria-describedby="agree-error" aria-invalid />
          <FieldError id="agree-error">Acceptance required</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="updates">Updates</FieldLabel>
          <Checkbox id="updates" aria-describedby="updates-hint" />
          <FieldDescription id="updates-hint">Weekly digest</FieldDescription>
        </Field>
      </>,
    );
    const box = screen.getByRole('checkbox', { name: 'Agree' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('Acceptance required');
    expect(screen.getByRole('checkbox', { name: 'Updates' })).toHaveAccessibleDescription('Weekly digest');
    await userEvent.click(screen.getByText('Agree'));
    expect(box).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('forwards native props and React 19 callback-ref cleanup to the actual input', async () => {
    const cleanup = vi.fn();
    const ref = vi.fn<(node: HTMLInputElement | null) => () => void>(() => cleanup);
    const click = vi.fn();
    const { unmount, rerender } = render(
      <Checkbox
        ref={ref}
        aria-label="Agree"
        onClick={click}
        className="custom"
        style={{ margin: 3 }}
        data-test="input"
      />,
    );
    const box = screen.getByRole('checkbox');
    expect(box.tagName).toBe('INPUT');
    expect(box).toHaveAttribute('data-test', 'input');
    expect(box.parentElement).toHaveClass('custom');
    expect(box.parentElement).toHaveStyle({ margin: '3px' });
    rerender(<Checkbox ref={ref} aria-label="Agree" onClick={click} indeterminate />);
    expect(ref).toHaveBeenCalledExactlyOnceWith(box);
    expect(cleanup).not.toHaveBeenCalled();
    expect(box).toBePartiallyChecked();
    await userEvent.click(box);
    expect(click).toHaveBeenCalledOnce();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it('server-renders explicitly labeled roots and native label targets before effects run', () => {
    const view = renderToString(
      <form>
        <label id="ssr-agree-label" htmlFor="ssr-agree">
          Agree
        </label>
        <Checkbox id="ssr-agree" aria-labelledby="ssr-agree-label" defaultChecked />
        <label id="ssr-mail-label" htmlFor="ssr-mail">
          Mail
        </label>
        <ToggleSwitch id="ssr-mail" aria-labelledby="ssr-mail-label" />
        <RadioGroup name="size" aria-label="Size" defaultValue={1}>
          <label id="ssr-small-label" htmlFor="ssr-small">
            Small
          </label>
          <RadioButton id="ssr-small" aria-labelledby="ssr-small-label" value={1} />
        </RadioGroup>
      </form>,
    );
    const { container } = render(<div dangerouslySetInnerHTML={{ __html: view }} />);
    const server = within(container);
    expect(server.getByRole('checkbox', { name: 'Agree' })).toBeChecked();
    expect(server.getByRole('switch', { name: 'Mail' })).not.toBeChecked();
    expect(server.getByRole('radio', { name: 'Small' })).toBeChecked();
    for (const label of container.querySelectorAll('label')) expect(label.control).toBeInstanceOf(HTMLInputElement);
    const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
