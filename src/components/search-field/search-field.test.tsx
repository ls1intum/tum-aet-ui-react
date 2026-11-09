import { createRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { SearchField, type SearchFieldProps } from './search-field';

function Example({ initial = '', onValueChange, ...props }: Omit<SearchFieldProps, 'value'> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <SearchField
      {...props}
      value={value}
      onValueChange={(next) => {
        onValueChange?.(next);
        setValue(next);
      }}
    />
  );
}

describe('SearchField', () => {
  it('is a labelled search box using the translated placeholder', () => {
    render(<SearchField value="" />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).toHaveAttribute('placeholder', 'Search');
  });

  it('reports each keystroke and shows a clear button that clears and refocuses', async () => {
    const onChange = vi.fn();
    render(<Example onValueChange={onChange} />);
    expect(screen.queryByRole('button')).toBeNull();
    await userEvent.type(screen.getByRole('searchbox'), 'ab');
    expect(onChange).toHaveBeenLastCalledWith('ab');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('searchbox')).toHaveFocus();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('clears with the keyboard', async () => {
    render(<Example initial="abc" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('has no axe violations', async () => {
    const { container } = render(<Example initial="x" />);
    await expectNoA11yViolations(container);
  });

  it('reflects a term set from outside and offers the clear button only with a term', () => {
    const { rerender } = render(<SearchField value="" />);
    expect(screen.queryByRole('button')).toBeNull();
    rerender(<SearchField value="beta" />);
    expect(screen.getByRole('searchbox')).toHaveValue('beta');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('stays controlled when the parent keeps the value', async () => {
    render(<SearchField value="a" />);
    await userEvent.type(screen.getByRole('searchbox'), 'b');
    expect(screen.getByRole('searchbox')).toHaveValue('a');
  });

  it('names the field by its placeholder unless given another label', () => {
    const { rerender } = render(<SearchField value="" placeholder="Find courses" />);
    expect(screen.getByRole('searchbox', { name: 'Find courses' })).toBeInTheDocument();
    rerender(<SearchField value="" placeholder="Find courses" aria-label="Filter options" />);
    expect(screen.getByRole('searchbox', { name: 'Filter options' })).toBeInTheDocument();
  });

  it.each(['disabled', 'readOnly'] as const)('prevents clearing when %s', async (mode) => {
    const change = vi.fn();
    render(
      <SearchField
        value="epsilon"
        disabled={mode === 'disabled'}
        readOnly={mode === 'readOnly'}
        onValueChange={change}
      />,
    );
    expect(screen.getByRole('searchbox')).toHaveAttribute(mode === 'disabled' ? 'disabled' : 'readonly');
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(change).not.toHaveBeenCalled();
  });

  it('supports sizes and the invalid state', () => {
    render(<SearchField value="" size="small" invalid />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('data-size', 'small');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('is named by the visible label of a FormField, not by its placeholder', () => {
    render(<FormField label="Course">{(control) => <SearchField {...control} value="" />}</FormField>);
    expect(screen.getByRole('searchbox', { name: 'Course' })).toBeInTheDocument();
  });

  it('detaches replaced refs and honors callback cleanup on unmount', () => {
    const objectRef = createRef<HTMLInputElement>();
    const callbackRef = vi.fn<(node: HTMLInputElement | null) => void>();
    const cleanup = vi.fn();
    const cleanupRef = vi.fn(() => cleanup);
    const { rerender, unmount } = render(<SearchField value="" ref={objectRef} />);
    const input = screen.getByRole('searchbox');
    expect(objectRef.current).toBe(input);
    rerender(<SearchField value="" ref={callbackRef} />);
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(input);
    rerender(<SearchField value="" ref={cleanupRef} />);
    expect(callbackRef).toHaveBeenLastCalledWith(null);
    rerender(<SearchField value="Updated" ref={cleanupRef} />);
    expect(cleanupRef).toHaveBeenCalledExactlyOnceWith(input);
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
