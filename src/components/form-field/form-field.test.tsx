import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Input, Textarea } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { Field, FieldDescription, FieldError, FieldLabel, FormField } from './form-field';

describe('FormField', () => {
  it('supplies native label associations and a decorative required marker', async () => {
    render(
      <FormField label="Login" required>
        {(control) => <Input {...control} />}
      </FormField>,
    );
    const input = screen.getByRole('textbox', { name: /Login/ });
    expect(screen.getByText('*')).toHaveAttribute('aria-hidden', 'true');
    expect(input).not.toBeRequired();
    expect(screen.getByText('Login')).toHaveAttribute('for', input.id);
    await userEvent.click(screen.getByText('Login'));
    expect(input).toHaveFocus();
  });

  it('replaces the hint with the caller error and keeps the generated control id stable', () => {
    function Example({ invalid = false }: { invalid?: boolean }) {
      return (
        <FormField label="Login" hint="Your id" error="Required" invalid={invalid}>
          {(control) => <Input {...control} />}
        </FormField>
      );
    }
    const { rerender } = render(<Example />);
    const input = screen.getByRole('textbox', { name: 'Login' });
    const id = input.id;
    expect(input).toHaveAccessibleDescription('Your id');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<Example invalid />);
    expect(input.id).toBe(id);
    expect(input).toHaveAccessibleDescription('Required');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Your id')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-describedby', screen.getByRole('alert').id);
    rerender(<Example />);
    expect(input).toHaveAccessibleDescription('Your id');
    expect(input).not.toHaveAttribute('data-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets the caller compose additional descriptions onto the intended control', () => {
    render(
      <>
        <p id="extra">Extra context</p>
        <FormField label="Points" hint="Available points">
          {(control) => (
            <InputNumber {...control} value={null} aria-describedby={`extra ${control['aria-describedby'] ?? ''}`} />
          )}
        </FormField>
      </>,
    );
    expect(screen.getByRole('textbox', { name: 'Points' })).toHaveAccessibleDescription(
      'Extra context Available points',
    );
  });

  it('omits empty labels and descriptions without dangling IDs', () => {
    const { container, rerender } = render(
      <FormField label="" hint="   ">
        {(control) => <Input {...control} aria-label="Login" />}
      </FormField>,
    );
    expect(container.querySelector('label')).toBeNull();
    expect(container.querySelector('.tumaet-ui-form-field-hint')).toBeNull();
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
    rerender(
      <FormField label="Login" hint="Hidden while invalid" invalid error="  ">
        {(control) => <Input {...control} />}
      </FormField>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden while invalid')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby');
  });

  it('renders native label/id/hint/error associations on the server and preserves them through hydration', async () => {
    function Example() {
      return (
        <>
          <FormField label="Login" hint="Your identifier">
            {(control) => <Input {...control} defaultValue="Ada" />}
          </FormField>
          <FormField label="Notes" hint="Not shown" invalid error="Too short">
            {(control) => <Textarea {...control} defaultValue="Draft" />}
          </FormField>
        </>
      );
    }
    const host = document.createElement('div');
    host.innerHTML = renderToString(<Example />);
    document.body.append(host);
    const server = within(host);
    const login = server.getByRole('textbox', { name: 'Login' });
    const notes = server.getByRole('textbox', { name: 'Notes' });
    const ids = [...host.querySelectorAll('[id]')].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(server.getByText('Login')).toHaveAttribute('for', login.id);
    expect(login).toHaveAccessibleDescription('Your identifier');
    expect(notes).toHaveAccessibleDescription('Too short');
    expect(notes).toHaveAttribute('aria-invalid', 'true');
    const recover = vi.fn();
    const { unmount } = render(<Example />, { container: host, hydrate: true, onRecoverableError: recover });
    expect(screen.getByRole('textbox', { name: 'Login' })).toBe(login);
    expect(screen.getByRole('textbox', { name: 'Notes' })).toBe(notes);
    expect([...host.querySelectorAll('[id]')].map((node) => node.id)).toEqual(ids);
    expect(recover).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('Notes'));
    expect(notes).toHaveFocus();
    await expectNoA11yViolations(host);
    unmount();
    host.remove();
  });
});

describe('Field parts', () => {
  it('uses explicit native associations; the caller updates descriptions and validation state', async () => {
    function Example({ invalid }: { invalid: boolean }) {
      return (
        <Field data-invalid={invalid || undefined}>
          <FieldLabel htmlFor="summary">Summary</FieldLabel>
          <Textarea
            id="summary"
            required
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? 'summary-hint summary-error' : 'summary-hint'}
          />
          <FieldDescription id="summary-hint">Visible to students</FieldDescription>
          {invalid ? <FieldError id="summary-error">Enter a summary</FieldError> : null}
        </Field>
      );
    }
    const { container, rerender } = render(<Example invalid={false} />);
    const area = screen.getByRole('textbox', { name: 'Summary' });
    expect(area).toBeInvalid(); // Native required, without inferred ARIA or an automatic error.
    expect(area).not.toHaveAttribute('aria-invalid');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<Example invalid />);
    expect(area).toHaveAccessibleDescription('Visible to students Enter a summary');
    await userEvent.type(area, 'A valid native value');
    expect(area).toHaveAttribute('aria-invalid', 'true'); // Caller owns validation presentation.
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a summary');
    rerender(<Example invalid={false} />);
    expect(area).not.toHaveAttribute('aria-invalid');
    expect(area).toHaveAccessibleDescription('Visible to students');
    await expectNoA11yViolations(container);
  });

  it('forwards native props, classes and refs to the four semantic elements and clears refs on unmount', () => {
    const field = createRef<HTMLDivElement>();
    const label = createRef<HTMLLabelElement>();
    const description = createRef<HTMLParagraphElement>();
    const error = createRef<HTMLDivElement>();
    const { container, unmount } = render(
      <Field ref={field} className="custom" data-invalid>
        <FieldLabel ref={label} htmlFor="title">
          Title
        </FieldLabel>
        <Input id="title" aria-describedby="title-hint title-error" aria-invalid />
        <FieldDescription ref={description} id="title-hint">
          Public
        </FieldDescription>
        <FieldError ref={error} id="title-error" role="status">
          Unavailable
        </FieldError>
      </Field>,
    );
    expect(field.current).toBe(container.firstChild);
    expect(field.current).toHaveClass('tumaet-ui-form-field', 'custom');
    expect(label.current).toBe(screen.getByText('Title'));
    expect(label.current?.control).toBe(screen.getByRole('textbox'));
    expect(description.current?.tagName).toBe('P');
    expect(error.current).toBe(screen.getByRole('status'));
    unmount();
    expect(field.current).toBeNull();
    expect(label.current).toBeNull();
    expect(description.current).toBeNull();
    expect(error.current).toBeNull();
  });
});
