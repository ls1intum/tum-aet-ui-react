import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { TumAetUiI18nProvider } from '../../internal/i18n';
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxList,
  ComboboxChips,
  type ComboboxProps,
  type ComboboxInputProps,
} from './combobox';

const items = ['Alpha', 'Beta', 'Gamma'].map((value) => ({ key: value, value, label: value }));
function Parts({ multiple = false, ...props }: ComboboxInputProps & { multiple?: boolean }) {
  const controls = (
    <>
      <ComboboxInput aria-label="Course" {...props} />
      <ComboboxClear />
      <ComboboxTrigger />
    </>
  );
  return (
    <>
      <ComboboxInputGroup>{multiple ? <ComboboxChips>{controls}</ComboboxChips> : controls}</ComboboxInputGroup>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList />
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </>
  );
}
function Example({ value, onValueChange, ...props }: Partial<ComboboxProps<string>> = {}) {
  const [selection, setSelection] = useState<string | null>(null);
  return (
    <Combobox
      items={items}
      {...props}
      value={value === undefined ? selection : value}
      onValueChange={(next, details) => {
        onValueChange?.(next, details);
        if (!details.isCanceled) setSelection(next);
      }}
    >
      <Parts />
    </Combobox>
  );
}

describe('Combobox', () => {
  it('filters labels, selects by keyboard, skips disabled items and keeps focus in the input', async () => {
    const change = vi.fn();
    render(<Example items={[items[0]!, { ...items[1]!, disabled: true }, items[2]!]} onValueChange={change} />);
    const input = screen.getByRole('combobox', { name: 'Course' });
    await userEvent.type(input, 'be');
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(change).not.toHaveBeenCalled();
    await userEvent.clear(input);
    await userEvent.type(input, 'ga');
    expect(screen.queryByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(input).toHaveValue('Gamma'));
    expect(change).toHaveBeenCalledWith('Gamma', expect.objectContaining({ reason: 'item-press' }));
    expect(input).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('preserves caller rejection and cancellation of selection and open requests', async () => {
    const change = vi.fn();
    const { rerender } = render(
      <Combobox items={items} value="Alpha" onValueChange={change}>
        <Parts />
      </Combobox>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(change).toHaveBeenCalledWith('Beta', expect.any(Object));
    expect(screen.getByRole('combobox')).toHaveValue('Alpha');
    rerender(
      <Example
        value="Alpha"
        onValueChange={(_value, details) => details.cancel()}
        onOpenChange={(open, details) => {
          if (!open && details.reason === 'escape-key') details.cancel();
        }}
      />,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Gamma' }));
    expect(screen.getByRole('combobox')).toHaveValue('Alpha');
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('separates object equality, display, rendering and submission', async () => {
    interface Course {
      id: number;
      title: string;
    }
    function Objects() {
      const [value, setValue] = useState<Course | null>({ id: 1, title: 'Alpha' });
      return (
        <form aria-label="Courses">
          <Combobox
            name="course"
            items={items.map((item, index) => ({ ...item, value: { id: index + 1, title: item.label } }))}
            value={value}
            onValueChange={setValue}
            isItemEqualToValue={(a, b) => a.id === b.id}
            itemToStringLabel={(item) => item.title}
            itemToStringValue={(item) => String(item.id)}
            renderItem={(item) => <strong>{item.value.title} course</strong>}
          >
            <Parts />
          </Combobox>
        </form>
      );
    }
    render(<Objects />);
    const form = screen.getByRole<HTMLFormElement>('form');
    expect(new FormData(form).get('course')).toBe('1');
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: 'Alpha course' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('option', { name: 'Beta course' }));
    expect(screen.getByRole('combobox')).toHaveValue('Beta');
    expect(new FormData(form).get('course')).toBe('2');
  });

  it('renders chips in selection order, removes the right item and serializes repeated names', async () => {
    function Multiple() {
      const [value, setValue] = useState(['Gamma', 'Alpha']);
      return (
        <form aria-label="Courses">
          <Combobox multiple items={items} name="courses" value={value} onValueChange={setValue}>
            <Parts multiple />
          </Combobox>
        </form>
      );
    }
    render(<Multiple />);
    const form = screen.getByRole<HTMLFormElement>('form');
    expect(new FormData(form).getAll('courses')).toEqual(['Gamma', 'Alpha']);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Gamma' }));
    expect(new FormData(form).getAll('courses')).toEqual(['Alpha']);
    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(new FormData(form).getAll('courses')).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Remove Alpha' })).not.toBeInTheDocument();
  });

  it('preserves item identity and rendered local state through collection reorder and filtering', async () => {
    function Label({ label }: { label: string }) {
      // eslint-disable-next-line react/hook-use-state -- Immutable initial state detects cross-item state reuse after reorder.
      const [original] = useState(label);
      return (
        <span>
          {label} originally {original}
        </span>
      );
    }
    const content = (reversed: boolean) => (
      <Combobox
        items={reversed ? [...items].reverse() : items}
        value={null}
        defaultOpen
        renderItem={(item) => <Label label={item.label} />}
      >
        <Parts />
      </Combobox>
    );
    const { rerender } = render(content(false));
    const alpha = await screen.findByRole('option', { name: 'Alpha originally Alpha' });
    rerender(content(true));
    expect(screen.getByRole('option', { name: 'Alpha originally Alpha' })).toBe(alpha);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Gamma originally Gamma',
      'Beta originally Beta',
      'Alpha originally Alpha',
    ]);
  });

  it('forwards input and button refs, classes, native attributes and Base UI handler cancellation', async () => {
    const actionsRef = createRef<{ close: () => void; unmount: () => void }>();
    const inputRef = createRef<HTMLInputElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    render(
      <Combobox items={items} value={null} actionsRef={actionsRef}>
        <ComboboxInputGroup size="small" variant="outlined">
          <ComboboxInput
            ref={inputRef}
            aria-label="Course"
            aria-invalid
            aria-describedby="hint"
            className={() => 'custom'}
            onKeyDown={(event) => event.preventBaseUIHandler()}
          />
          <ComboboxTrigger ref={triggerRef} />
        </ComboboxInputGroup>
        <span id="hint">Choose an available course</span>
        <ComboboxPortal>
          <ComboboxPositioner>
            <ComboboxPopup>
              <ComboboxList />
            </ComboboxPopup>
          </ComboboxPositioner>
        </ComboboxPortal>
      </Combobox>,
    );
    const input = screen.getByRole('combobox');
    expect(inputRef.current).toBe(input);
    expect(triggerRef.current).toBe(screen.getByRole('button', { name: 'Filter options' }));
    expect(input).toHaveClass('tumaet-ui-autocomplete-input', 'custom');
    expect(input).toHaveAccessibleDescription('Choose an available course');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    act(() => input.focus());
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Filter options' }));
    await screen.findByRole('listbox');
    act(() => actionsRef.current?.close());
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
  });

  it('translates empty results and remove labels and exposes accessible single and multiple controls', async () => {
    const { rerender } = render(
      <TumAetUiI18nProvider
        translate={(key) => (key === 'tumAetUi.autocomplete.remove' ? 'Entfernen' : 'Keine Ergebnisse')}
      >
        <Combobox multiple items={items} value={['Alpha']}>
          <Parts multiple />
        </Combobox>
      </TumAetUiI18nProvider>,
    );
    expect(screen.getByRole('button', { name: 'Entfernen Alpha' })).toBeInTheDocument();
    await userEvent.type(screen.getByRole('combobox'), 'zz');
    expect(screen.getByText('Keine Ergebnisse')).toBeInTheDocument();
    await expectNoA11yViolations();
    rerender(<Example />);
    await expectNoA11yViolations();
  });
});
