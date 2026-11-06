import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { Input, Textarea } from './input';

describe('Input', () => {
  it('types text and exposes size and invalid state', async () => {
    const onChange = vi.fn();
    render(<Input aria-label="Name" size="small" invalid onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Name' });
    await userEvent.type(input, 'ab');
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-size', 'small');
    expect(input).toHaveClass('tumaet-ui-input');
  });

  it('omits aria-invalid while valid and keeps an own id', () => {
    render(<Input id="mine" aria-label="x" />);
    const input = screen.getByRole('textbox');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).toHaveAttribute('id', 'mine');
  });

  it('is reachable and typeable by keyboard', async () => {
    render(
      <>
        <button type="button">before</button>
        <Textarea aria-label="Notes" />
      </>,
    );
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('textbox', { name: 'Notes' })).toHaveFocus();
    await userEvent.keyboard('hi');
    expect(screen.getByRole('textbox')).toHaveValue('hi');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <>
        <label htmlFor="name-input">Name</label>
        <Input id="name-input" />
        <Textarea aria-label="Notes" />
      </>,
    );
    await expectNoA11yViolations(container);
  });

  it('defaults to the normal size and supports small and large', () => {
    const { rerender } = render(<Input aria-label="x" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'default');
    rerender(<Input aria-label="x" size="large" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('data-size', 'large');
  });

  it('is disabled and forwards a ref', () => {
    const ref = vi.fn();
    render(<Input aria-label="x" disabled ref={ref} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
    expect(ref).toHaveBeenCalledWith(screen.getByRole('textbox'));
  });

  it('lets the caller combine FormField and additional descriptions', () => {
    render(
      <>
        <span id="extra">Extra context</span>
        <FormField label="Name" hint="Hint">
          {(control) => (
            <Input {...control} aria-describedby={['extra', control['aria-describedby']].filter(Boolean).join(' ')} />
          )}
        </FormField>
      </>,
    );
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Extra context Hint');
    expect(screen.getByLabelText('Name').getAttribute('aria-describedby')).toMatch(/^extra /);
  });

  it('spreads FormField associations onto a sized invalid textarea', () => {
    render(
      <FormField label="Notes" invalid error="Too short">
        {(control) => <Textarea {...control} size="small" rows={4} />}
      </FormField>,
    );
    const area = screen.getByRole('textbox', { name: 'Notes' });
    expect(area.tagName).toBe('TEXTAREA');
    expect(area).toHaveAttribute('aria-invalid', 'true');
    expect(area).toHaveAttribute('data-size', 'small');
    expect(area).toHaveAccessibleDescription('Too short');
  });

  it('lets an explicit aria-invalid="false" win over the invalid prop', () => {
    render(<Input aria-label="x" invalid aria-invalid="false" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
  });
});

it('forwards native props, event targets and textarea refs', async () => {
  const inputRef = { current: null as HTMLInputElement | null };
  const areaRef = { current: null as HTMLTextAreaElement | null };
  const changes: string[] = [];
  const onInput = vi.fn();
  render(
    <>
      <Input
        ref={inputRef}
        aria-label="Title"
        name="title"
        autoComplete="off"
        onChange={(event) => changes.push(`input:${event.currentTarget.value}`)}
        onInput={onInput}
      />
      <Textarea
        ref={areaRef}
        aria-label="Details"
        name="details"
        rows={5}
        maxLength={20}
        onChange={(event) => changes.push(`textarea:${event.currentTarget.value}`)}
        onInput={onInput}
      />
    </>,
  );
  await userEvent.type(screen.getByRole('textbox', { name: 'Title' }), 'A');
  await userEvent.type(screen.getByRole('textbox', { name: 'Details' }), 'B');
  expect(changes).toEqual(['input:A', 'textarea:B']);
  expect(onInput).toHaveBeenCalledTimes(2);
  expect(inputRef.current).toBe(screen.getByLabelText('Title'));
  expect(areaRef.current).toBe(screen.getByLabelText('Details'));
  expect(areaRef.current).toHaveAttribute('rows', '5');
  expect(areaRef.current).toHaveAttribute('maxlength', '20');
});

it('passes React 19 callback cleanup and clears object refs for both native elements', () => {
  const inputCleanup = vi.fn();
  const areaCleanup = vi.fn();
  const inputRef = vi.fn(() => inputCleanup);
  const areaRef = vi.fn(() => areaCleanup);
  const { rerender, unmount } = render(
    <>
      <Input aria-label="Title" ref={inputRef} />
      <Textarea aria-label="Notes" ref={areaRef} />
    </>,
  );
  expect(inputRef).toHaveBeenCalledWith(screen.getByLabelText('Title'));
  expect(areaRef).toHaveBeenCalledWith(screen.getByLabelText('Notes'));
  const inputObject = { current: null as HTMLInputElement | null };
  const areaObject = { current: null as HTMLTextAreaElement | null };
  rerender(
    <>
      <Input aria-label="Title" ref={inputObject} />
      <Textarea aria-label="Notes" ref={areaObject} />
    </>,
  );
  expect(inputCleanup).toHaveBeenCalledOnce();
  expect(areaCleanup).toHaveBeenCalledOnce();
  expect(inputObject.current).toBe(screen.getByLabelText('Title'));
  expect(areaObject.current).toBe(screen.getByLabelText('Notes'));
  unmount();
  expect(inputObject.current).toBeNull();
  expect(areaObject.current).toBeNull();
});
