import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useId, useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Field, FieldLabel, FieldDescription } from '../form-field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectList,
  type SelectProps,
  type SelectTriggerProps,
} from './select';

const items = ['Alpha', 'Beta', 'Gamma'].map((value) => ({ key: value, value, label: value }));
function Parts(props: SelectTriggerProps = {}) {
  return (
    <>
      <SelectTrigger {...props}>
        <SelectValue placeholder="Choose" />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectList aria-label={props['aria-label'] ?? 'Choices'} aria-labelledby={props['aria-labelledby']} />
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </>
  );
}
function Example({
  invalid = false,
  value,
  onValueChange,
  ...props
}: Partial<SelectProps<string>> & { invalid?: boolean } = {}) {
  const id = useId();
  const [selection, setSelection] = useState<string | null>(null);
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        Course
      </FieldLabel>
      <Select
        items={items}
        {...props}
        value={value === undefined ? selection : value}
        onValueChange={(next, details) => {
          onValueChange?.(next, details);
          if (!details.isCanceled) setSelection(next);
        }}
      >
        <Parts
          id={id}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-description`}
          aria-invalid={invalid || undefined}
        />
      </Select>
      <FieldDescription id={`${id}-description`}>{invalid ? 'Invalid course' : 'Pick a course.'}</FieldDescription>
    </Field>
  );
}
function values(form: HTMLFormElement, name = 'course') {
  return new FormData(form).getAll(name);
}
async function openSelect(trigger: HTMLElement) {
  act(() => trigger.focus());
  await userEvent.keyboard('{ArrowDown}');
  await screen.findByRole('listbox');
}

describe('Select', () => {
  it('uses explicit label, description, invalid and disabled props with Field presentation', () => {
    const { rerender } = render(<Example />);
    const trigger = screen.getByRole('combobox', { name: 'Course' });
    expect(trigger).toHaveAccessibleDescription('Pick a course.');
    expect(screen.getByText('Course')).toHaveAttribute('for', trigger.id);
    rerender(<Example invalid />);
    expect(screen.getByRole('combobox', { name: 'Course' })).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('combobox')).toHaveAccessibleDescription('Invalid course');
    rerender(<Example disabled />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('selects with keyboard typeahead, skips disabled items and returns focus', async () => {
    const change = vi.fn();
    render(<Example items={[items[0]!, { ...items[1]!, disabled: true }, items[2]!]} onValueChange={change} />);
    const trigger = screen.getByRole('combobox');
    await openSelect(trigger);
    await userEvent.keyboard('g{Enter}');
    await waitFor(() => expect(trigger).toHaveTextContent('Gamma'));
    expect(change).toHaveBeenCalledWith('Gamma', expect.objectContaining({ reason: 'item-press' }));
    expect(trigger).toHaveFocus();
    await openSelect(trigger);
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(change).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('preserves cancellation of value and controlled open requests', async () => {
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <Example
          open={open}
          onValueChange={(_next, details) => details.cancel()}
          onOpenChange={(next, details) => {
            if (details.reason === 'escape-key') details.cancel();
            if (!details.isCanceled) setOpen(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await openSelect(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(screen.getByRole('combobox')).toHaveTextContent('Choose');
    await openSelect(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('forwards trigger refs, render props, class functions and handler cancellation', async () => {
    const ref = createRef<HTMLButtonElement>();
    const calls: string[] = [];
    const renderClick: SelectTriggerProps['onClick'] = (event) => {
      calls.push(`render-${event.type}`);
      event.preventBaseUIHandler();
    };
    render(
      <Select items={items} value={null}>
        <SelectTrigger
          ref={ref}
          aria-label="Course"
          className={() => 'custom-trigger'}
          render={<button type="button" onMouseDown={renderClick} onClick={renderClick} />}
          onMouseDown={() => calls.push('consumer-mousedown')}
          onClick={() => calls.push('consumer-click')}
        >
          Course
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList aria-label="Object choices" />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Course' });
    expect(ref.current).toBe(trigger);
    expect(trigger).toHaveClass('tumaet-ui-select-trigger', 'custom-trigger');
    await userEvent.click(trigger);
    expect(calls).toEqual(['render-mousedown', 'render-click']);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('supports object equality with separate display and submission functions', async () => {
    function Objects() {
      const [value, setValue] = useState<{ id: number; title: string } | null>({ id: 1, title: 'Alpha' });
      return (
        <form>
          <Select
            name="course"
            items={[
              { key: 1, value: { id: 1, title: 'Alpha' }, label: 'Alpha' },
              { key: 2, value: { id: 2, title: 'Beta' }, label: 'Beta' },
            ]}
            value={value}
            onValueChange={setValue}
            isItemEqualToValue={(a, b) => a.id === b.id}
            itemToStringLabel={(item) => item.title}
            itemToStringValue={(item) => String(item.id)}
          >
            <Parts aria-label="Object course" />
          </Select>
        </form>
      );
    }
    const { container } = render(<Objects />);
    const form = container.querySelector('form')!;
    expect(screen.getByRole('combobox')).toHaveTextContent('Alpha');
    expect(values(form)).toEqual(['1']);
    await openSelect(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(values(form)).toEqual(['2']);
  });

  it('submits null as an empty string and [] as no entries, with repeated names for multiple selections', async () => {
    function Multiple() {
      const [value, setValue] = useState<string[]>([]);
      return (
        <Select multiple name="courses" items={items} value={value} onValueChange={setValue}>
          <Parts aria-label="Multiple" />
        </Select>
      );
    }
    const { container } = render(
      <form>
        <Example name="course" />
        <Multiple />
      </form>,
    );
    const form = container.querySelector('form')!;
    expect(values(form)).toEqual(['']);
    expect(values(form, 'courses')).toEqual([]);
    await openSelect(screen.getByRole('combobox', { name: 'Multiple' }));
    await userEvent.click(screen.getByRole('option', { name: 'Alpha' }));
    await userEvent.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(values(form, 'courses')).toEqual(['Alpha', 'Gamma']);
  });

  it('does not submit disabled controls and keeps readOnly values unchanged', async () => {
    const { container } = render(
      <form>
        <Example name="course" value="Alpha" disabled />
        <Select items={items} name="readonly" value="Beta" readOnly>
          <Parts aria-label="Read only" />
        </Select>
      </form>,
    );
    expect(values(container.querySelector('form')!)).toEqual([]);
    await openSelect(screen.getByRole('combobox', { name: 'Read only' }));
    await userEvent.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(values(container.querySelector('form')!, 'readonly')).toEqual(['Beta']);
  });

  it('runs React 19 input callback ref cleanup on unmount', () => {
    const cleanup = vi.fn();
    const inputRef = vi.fn(() => cleanup);
    const { unmount } = render(<Example inputRef={inputRef} />);
    expect(inputRef).toHaveBeenCalledOnce();
    expect(inputRef).toHaveBeenCalledWith(expect.any(HTMLInputElement));
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
    expect(inputRef).toHaveBeenCalledOnce();
  });

  it('has no axe violations', async () => {
    render(<Example defaultOpen />);
    await expectNoA11yViolations();
  });
});
