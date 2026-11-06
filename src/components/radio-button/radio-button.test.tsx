import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { RadioButton, RadioGroup } from './radio-button';

const group = (props = {}) => (
  <RadioGroup aria-label="Size" {...props}>
    <RadioButton value="s" aria-label="Small" />
    <RadioButton value="m" aria-label="Medium" />
    <RadioButton value="l" aria-label="Large" />
  </RadioGroup>
);

/** Stands in for a handler on a controlled radio whose state stays with the parent. */
const noop = () => {
  // intentionally empty
};

describe('RadioGroup', () => {
  it('selects on click and reports the value', async () => {
    const onChange = vi.fn();
    render(group({ onChange }));
    await userEvent.click(screen.getByRole('radio', { name: 'Medium' }));
    expect(screen.getByRole('radio', { name: 'Medium' })).toBeChecked();
    expect(onChange).toHaveBeenCalledWith('m');
  });

  it('has one tab stop and moves with the arrow keys, wrapping', async () => {
    render(group({ defaultValue: 'm' }));
    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Medium' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Large' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
  });

  it('is controlled and can be disabled', async () => {
    const { rerender } = render(group({ value: 's' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Large' }));
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    rerender(group({ value: 's', disabled: true }));
    screen.getAllByRole('radio').forEach((r) => expect(r).toBeDisabled());
  });

  it('works standalone', async () => {
    render(<RadioButton aria-label="Solo" />);
    await userEvent.click(screen.getByRole('radio'));
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('has no axe violations', async () => {
    const { container } = render(group({ defaultValue: 's' }));
    await expectNoA11yViolations(container);
  });

  it('keeps uncontrolled standalone radios with a shared name mutually exclusive', async () => {
    render(
      <>
        <RadioButton name="solo" aria-label="A" defaultChecked />
        <RadioButton name="solo" aria-label="B" />
      </>,
    );
    expect(screen.getByRole('radio', { name: 'A' })).toBeChecked();
    await userEvent.click(screen.getByRole('radio', { name: 'B' }));
    expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
  });

  it('forwards id, name and aria-label and reports the value on selection', async () => {
    const onChange = vi.fn();
    render(<RadioButton id="opt-a" name="g" value="a" aria-label="Option A" onChange={onChange} />);
    const radio = screen.getByRole('radio', { name: 'Option A' });
    expect(radio).toHaveAttribute('id', 'opt-a');
    expect(radio).toHaveAttribute('name', 'g');
    expect(radio).toHaveAttribute('value', 'a');
    await userEvent.click(radio);
    expect(onChange).toHaveBeenCalledWith('a', expect.anything());
  });

  it('does not select when disabled, alone or through the group', async () => {
    const onChange = vi.fn();
    render(
      <>
        <RadioButton aria-label="Solo" disabled onChange={onChange} />
        {group({ disabled: true, onChange })}
      </>,
    );
    await userEvent.click(screen.getByRole('radio', { name: 'Solo' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Small' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');
  });

  it('shares one generated name inside a group and supports numeric values', async () => {
    const onChange = vi.fn();
    render(
      <RadioGroup aria-label="Count" onChange={onChange}>
        <RadioButton value={1} aria-label="One" />
        <RadioButton value={2} aria-label="Two" />
      </RadioGroup>,
    );
    const [one, two] = screen.getAllByRole('radio');
    expect(one!.getAttribute('name')).toBeTruthy();
    expect(one!.getAttribute('name')).toBe(two!.getAttribute('name'));
    await userEvent.click(two!);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('reflects a changed group value', () => {
    const { rerender } = render(group({ value: 's' }));
    expect(screen.getByRole('radio', { name: 'Small' })).toBeChecked();
    rerender(group({ value: 'l' }));
    expect(screen.getByRole('radio', { name: 'Large' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Small' })).not.toBeChecked();
  });

  it('lets a controlled standalone radio stay as the parent says', async () => {
    render(<RadioButton aria-label="Solo" checked={false} onChange={noop} />);
    await userEvent.click(screen.getByRole('radio'));
    expect(screen.getByRole('radio')).not.toBeChecked();
  });
});
