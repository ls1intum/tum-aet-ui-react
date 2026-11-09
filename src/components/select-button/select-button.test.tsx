import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { SelectButton, type SelectButtonProps } from './select-button';
const items = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table', props: { disabled: true } },
] as const;
describe('SelectButton', () => {
  it('selects and clears using array values and upstream details', async () => {
    const change = vi.fn();
    render(<SelectButton aria-label="View" items={items} onValueChange={change} />);
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(change).toHaveBeenLastCalledWith(['grid'], expect.objectContaining({ reason: 'none' }));
    expect(screen.getByRole('button', { name: 'Grid' })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(change).toHaveBeenLastCalledWith([], expect.anything());
  });
  it('supports multiple selection while skipping disabled items', async () => {
    const change = vi.fn();
    render(<SelectButton aria-label="View" items={items} multiple defaultValue={['list']} onValueChange={change} />);
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(change).toHaveBeenLastCalledWith(['list', 'grid'], expect.anything());
    expect(screen.getByRole('button', { name: 'Table' })).toBeDisabled();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: 'List' })).toHaveFocus();
  });
  it('preserves root cancellation and item cancellation', async () => {
    const change = vi.fn<NonNullable<SelectButtonProps<'list' | 'grid' | 'table'>['onValueChange']>>((_, details) =>
      details.cancel(),
    );
    const { rerender } = render(
      <SelectButton aria-label="View" items={items} defaultValue={['list']} onValueChange={change} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    rerender(
      <SelectButton
        aria-label="View"
        items={[{ value: 'list', label: 'List', props: { onPressedChange: (_, details) => details.cancel() } }]}
        defaultValue={['list']}
        onValueChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(change).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('forwards item ref/render state and native handler cancellation', async () => {
    const ref = createRef<HTMLButtonElement>();
    const change = vi.fn();
    render(
      <SelectButton
        aria-label="View"
        items={[
          {
            value: 'list',
            label: 'List',
            props: {
              ref,
              onClick: (event) => event.preventBaseUIHandler(),
              render: (props, state) => <button type="button" {...props} data-pressed-state={state.pressed} />,
            },
          },
        ]}
        onValueChange={change}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(change).not.toHaveBeenCalled();
    expect(ref.current).toHaveAttribute('data-pressed-state', 'false');
  });
  it('does not invent form serialization for toggles', async () => {
    const { container } = render(
      <form>
        <SelectButton aria-label="View" items={items} defaultValue={['list']} />
      </form>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect([...new FormData(container.querySelector('form')!)]).toEqual([]);
  });
  it.each([
    [{ value: '', label: 'Empty' }],
    [
      { value: 'same', label: 'First' },
      { value: 'same', label: 'Second' },
    ],
  ])('rejects item keys that Base UI cannot associate reliably: %j', (...invalidItems) => {
    expect(() => render(<SelectButton aria-label="Invalid" items={invalidItems} />)).toThrow('unique, nonempty');
  });
  it('has no axe violations', async () => {
    const { container } = render(<SelectButton aria-label="View" items={items} size="small" />);
    expect(screen.getByRole('group')).toHaveAttribute('data-size', 'small');
    await expectNoA11yViolations(container);
  });
});
