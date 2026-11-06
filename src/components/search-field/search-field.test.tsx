import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { FormField } from '../form-field/form-field';
import { SearchField } from './search-field';

describe('SearchField', () => {
  it('is a labelled search box using the translated placeholder', () => {
    render(<SearchField />);
    const input = screen.getByRole('searchbox', { name: 'Search' });
    expect(input).toHaveAttribute('placeholder', 'Search');
  });

  it('reports each keystroke and shows a clear button that clears and refocuses', async () => {
    const onChange = vi.fn();
    render(<SearchField onChange={onChange} />);
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
    render(<SearchField defaultValue="abc" />);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Clear search' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SearchField defaultValue="x" />);
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
    const { rerender } = render(<SearchField placeholder="Find courses" />);
    expect(screen.getByRole('searchbox', { name: 'Find courses' })).toBeInTheDocument();
    rerender(<SearchField placeholder="Find courses" aria-label="Filter options" />);
    expect(screen.getByRole('searchbox', { name: 'Filter options' })).toBeInTheDocument();
  });

  it('disables both the field and the clear button', () => {
    render(<SearchField defaultValue="epsilon" disabled />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeDisabled();
  });

  it('supports sizes and the invalid state', () => {
    render(<SearchField size="small" invalid />);
    const input = screen.getByRole('searchbox');
    expect(input).toHaveAttribute('data-size', 'small');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('is named by the visible label of a FormField, not by its placeholder', () => {
    render(<FormField label="Course">{(control) => <SearchField {...control} />}</FormField>);
    expect(screen.getByRole('searchbox', { name: 'Course' })).toBeInTheDocument();
  });

  it('detaches replaced refs and honors callback cleanup on unmount', () => {
    const objectRef = createRef<HTMLInputElement>();
    const callbackRef = vi.fn<(node: HTMLInputElement | null) => void>();
    const cleanup = vi.fn();
    const cleanupRef = vi.fn(() => cleanup);
    const { rerender, unmount } = render(<SearchField ref={objectRef} />);
    const input = screen.getByRole('searchbox');
    expect(objectRef.current).toBe(input);
    rerender(<SearchField ref={callbackRef} />);
    expect(objectRef.current).toBeNull();
    expect(callbackRef).toHaveBeenLastCalledWith(input);
    rerender(<SearchField ref={cleanupRef} />);
    expect(callbackRef).toHaveBeenLastCalledWith(null);
    expect(cleanupRef).toHaveBeenCalledWith(input);
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
