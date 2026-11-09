import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Field, FieldError } from '../form-field/form-field';
import { RadioButton, RadioGroup, type RadioGroupProps } from './radio-button';

function Example(props: Omit<RadioGroupProps, 'name'>) {
  return (
    <RadioGroup name="size" aria-label="Size" {...props}>
      <RadioButton value="s" aria-label="Small" />
      <RadioButton value="m" aria-label="Medium" disabled />
      <RadioButton value="l" aria-label="Large" />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('has one tab stop and navigates with native arrows, skipping disabled options', async () => {
    render(<Example defaultValue="s" />);
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Small' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Large' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
  });

  it('reports numeric values and native events without claiming parent/child generic safety', async () => {
    const change = vi.fn<NonNullable<RadioGroupProps<number>['onValueChange']>>((value, event) => {
      expect(value).toBe(2);
      expect(event.currentTarget).toBe(screen.getByRole('radio', { name: 'Two' }));
      expect(event.currentTarget.value).toBe('2');
    });
    const view = (value?: number | null) => (
      <RadioGroup
        name="count"
        aria-label="Count"
        defaultValue={value === undefined ? 1 : undefined}
        value={value}
        onValueChange={change}
      >
        <RadioButton value={1} aria-label="One" />
        <RadioButton value={2} aria-label="Two" />
      </RadioGroup>
    );
    const { rerender } = render(view());
    await userEvent.click(screen.getByRole('radio', { name: 'Two' }));
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
    // Remount when switching from uncontrolled to controlled, as with a native input.
    rerender(<div key="controlled">{view(null)}</div>);
    expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Two' })).not.toBeChecked();
  });

  it('labels and describes the group through Field and cleans up rendered root and input refs', async () => {
    const group = createRef<HTMLFieldSetElement>();
    const option = createRef<HTMLInputElement>();
    const { container, unmount } = render(
      <Field data-invalid>
        <span id="plan-label" className="tumaet-ui-form-field-label">
          Plan
        </span>
        <RadioGroup
          name="plan"
          ref={group}
          defaultValue="a"
          aria-labelledby="plan-label"
          aria-describedby="plan-error"
          aria-invalid
        >
          <label id="plan-a-label" htmlFor="plan-a">
            A
          </label>
          <RadioButton id="plan-a" aria-labelledby="plan-a-label" value="a" ref={option} />
          <label id="plan-b-label" htmlFor="plan-b">
            B
          </label>
          <RadioButton id="plan-b" aria-labelledby="plan-b-label" value="b" />
        </RadioGroup>
        <FieldError id="plan-error">Choose a plan</FieldError>
      </Field>,
    );
    expect(group.current).toBe(screen.getByRole('radiogroup', { name: 'Plan' }));
    expect(group.current).toHaveAttribute('aria-invalid', 'true');
    expect(group.current).toHaveAccessibleDescription('Choose a plan');
    expect(option.current).toBe(screen.getByRole('radio', { name: 'A' }));
    expect(option.current).toHaveProperty('checked', true);
    await expectNoA11yViolations(container);
    unmount();
    expect(group.current).toBeNull();
    expect(option.current).toBeNull();
  });

  it('requires a group instead of inventing an implicit native name', () => {
    expect(() => render(<RadioButton value="a" aria-label="A" />)).toThrow('RadioButton must be inside RadioGroup');
  });
});
