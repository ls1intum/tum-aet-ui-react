import { useState } from 'react';
import { render } from '@testing-library/react';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FormField,
  Input,
  Textarea,
  InputNumber,
  SearchField,
} from '@tumaet/ui-react';

function NativeForm({ cancelReset = false, revision = 0 }: { cancelReset?: boolean; revision?: number }) {
  const [controlled, setControlled] = useState('Caller');
  const [controlledNotes, setControlledNotes] = useState('Caller notes');
  return (
    <form
      aria-label="Profile"
      data-revision={revision}
      onReset={(event) => {
        if (cancelReset) event.preventDefault();
      }}
    >
      <Field>
        <FieldLabel htmlFor="login">Login</FieldLabel>
        <Input id="login" name="login" aria-describedby="login-hint" defaultValue="Ada" required pattern="[A-Za-z]+" />
        <FieldDescription id="login-hint">Letters only</FieldDescription>
      </Field>
      <FormField label="Notes">
        {(control) => <Textarea {...control} name="notes" defaultValue="Initial notes" required rows={3} />}
      </FormField>
      <FormField label="Controlled">
        {(control) => (
          <Input
            {...control}
            name="controlled"
            value={controlled}
            onChange={(event) => setControlled(event.target.value)}
          />
        )}
      </FormField>
      <FormField label="Controlled notes">
        {(control) => (
          <Textarea
            {...control}
            name="controlledNotes"
            value={controlledNotes}
            onChange={(event) => setControlledNotes(event.target.value)}
          />
        )}
      </FormField>
      <Input aria-label="Read only" name="readonly" defaultValue="Included" readOnly />
      <Textarea aria-label="Disabled" name="disabled" disabled defaultValue="Excluded" />
      <button type="reset">Reset</button>
      <button type="submit">Submit</button>
    </form>
  );
}

test('controlled search clearing, readonly submission and reset follow caller policy', async () => {
  function QueryForm() {
    const [query, setQuery] = useState('Initial');
    const [cancel, setCancel] = useState(true);
    return (
      <form
        onReset={(event) => {
          if (cancel) event.preventDefault();
          else setQuery('Initial');
        }}
      >
        <SearchField aria-label="Query" name="query" value={query} onValueChange={setQuery} />
        <SearchField aria-label="Locked query" name="locked" value="Fixed" readOnly />
        <button type="reset">Reset query</button>
        <button type="button" onClick={() => setCancel(false)}>
          Allow query reset
        </button>
      </form>
    );
  }
  const { container } = render(<QueryForm />);
  const form = container.querySelector('form');
  if (!form) throw new Error('Missing query form');
  const query = page.getByRole('searchbox', { name: 'Query', exact: true });
  await query.fill('Changed');
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect.element(query).toHaveValue('');
  await expect.element(query).toHaveFocus();
  await expect.element(page.getByRole('button', { name: 'Clear search' })).toBeDisabled();
  expect(Object.fromEntries(new FormData(form))).toEqual({ query: '', locked: 'Fixed' });
  await query.fill('Working');
  await page.getByRole('button', { name: 'Reset query', exact: true }).click();
  await expect.element(query).toHaveValue('Working');
  await page.getByRole('button', { name: 'Allow query reset' }).click();
  await page.getByRole('button', { name: 'Reset query', exact: true }).click();
  await expect.element(query).toHaveValue('Initial');
  expect(Object.fromEntries(new FormData(form))).toEqual({ query: 'Initial', locked: 'Fixed' });
});

test('preserves native FormData, validity and reset through rerenders; the caller owns controlled values', async () => {
  const { container, rerender } = render(<NativeForm />);
  const form = container.querySelector('form');
  if (form === null) throw new Error('Profile form is missing');
  const login = page.getByRole('textbox', { name: 'Login', exact: true });
  const notes = page.getByRole('textbox', { name: 'Notes', exact: true });
  const controlled = page.getByRole('textbox', { name: 'Controlled', exact: true });
  await login.fill('123');
  await notes.fill('');
  expect(form.checkValidity()).toBe(false);
  expect((login.element() as HTMLInputElement).validity.patternMismatch).toBe(true);
  expect((notes.element() as HTMLTextAreaElement).validity.valueMissing).toBe(true);
  await login.fill('Grace');
  await notes.fill('Edited notes');
  await controlled.fill('Kept by caller');
  await page.getByRole('textbox', { name: 'Controlled notes', exact: true }).fill('Notes kept by caller');
  expect(form.checkValidity()).toBe(true);
  expect(Object.fromEntries(new FormData(form))).toEqual({
    login: 'Grace',
    notes: 'Edited notes',
    controlled: 'Kept by caller',
    controlledNotes: 'Notes kept by caller',
    readonly: 'Included',
  });
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  rerender(<NativeForm revision={1} />);
  await expect.element(login).toHaveValue('Ada');
  await expect.element(notes).toHaveValue('Initial notes');
  await expect.element(controlled).toHaveValue('Kept by caller');
  await expect
    .element(page.getByRole('textbox', { name: 'Controlled notes', exact: true }))
    .toHaveValue('Notes kept by caller');
  expect(Object.fromEntries(new FormData(form))).toEqual({
    login: 'Ada',
    notes: 'Initial notes',
    controlled: 'Kept by caller',
    controlledNotes: 'Notes kept by caller',
    readonly: 'Included',
  });

  rerender(<NativeForm cancelReset revision={2} />);
  await login.fill('Canceled');
  await notes.click();
  await expect.element(notes).toHaveFocus();
  await notes.fill('Keep these notes');
  await expect.element(notes).toHaveValue('Keep these notes');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  rerender(<NativeForm cancelReset revision={3} />);
  await expect.element(login).toHaveValue('Canceled');
  await expect.element(notes).toHaveValue('Keep these notes');
  expect(new FormData(form).get('login')).toBe('Canceled');
});

test('native required validity follows pristine reset and same-value reentry without library validation state', async () => {
  const { container, rerender } = render(
    <form aria-label="Required">
      <FormField label="Title">{(control) => <Input {...control} required defaultValue="" />}</FormField>
      <FormField label="Summary">{(control) => <Textarea {...control} required defaultValue="" />}</FormField>
      <button type="reset">Reset</button>
    </form>,
  );
  const form = container.querySelector('form');
  if (form === null) throw new Error('Required form is missing');
  const title = page.getByRole('textbox', { name: 'Title' });
  const summary = page.getByRole('textbox', { name: 'Summary' });
  await page.getByRole('button', { name: 'Reset' }).click();
  expect(form.checkValidity()).toBe(false);
  await expect.element(title).not.toHaveAttribute('aria-invalid');
  await expect.element(summary).not.toHaveAttribute('aria-invalid');
  await title.fill('Draft');
  await summary.fill('Notes');
  expect(form.checkValidity()).toBe(true);
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect.element(title).toHaveValue('');
  await expect.element(summary).toHaveValue('');
  expect(form.checkValidity()).toBe(false);
  // React may suppress onChange for same-value reentry after native reset.
  // No library metadata depends on that event: value and native validity are authoritative.
  await title.fill('Draft');
  await summary.fill('Notes');
  await expect.element(title).toHaveValue('Draft');
  await expect.element(summary).toHaveValue('Notes');
  expect(form.checkValidity()).toBe(true);
  // An ordinary rerender must not introduce reset synchronization or inferred errors.
  rerender(
    <form aria-label="Required">
      <FormField label="Title">{(control) => <Input {...control} required defaultValue="" />}</FormField>
      <FormField label="Summary">{(control) => <Textarea {...control} required defaultValue="" />}</FormField>
      <button type="reset">Reset</button>
    </form>,
  );
  await expect.element(title).toHaveValue('Draft');
  expect(form.checkValidity()).toBe(true);
});

test('native submission honors required, pattern, min, max and step constraints and onInvalid events', async () => {
  let submissions = 0;
  let invalidEvents = 0;
  const { container } = render(
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submissions++;
      }}
    >
      <Input
        aria-label="Code"
        name="code"
        required
        pattern="[A-Z]{2}"
        onInvalid={() => {
          invalidEvents++;
        }}
      />
      <Input aria-label="Count" name="count" type="number" min={2} max={8} step={2} defaultValue={2} />
      <Textarea aria-label="Comment" name="comment" required />
      <button type="submit">Save</button>
    </form>,
  );
  const form = container.querySelector('form');
  if (form === null) throw new Error('Submission form is missing');
  await page.getByRole('button', { name: 'Save' }).click();
  expect(submissions).toBe(0);
  expect(invalidEvents).toBe(1);
  const code = page.getByRole('textbox', { name: 'Code' });
  const count = page.getByRole('spinbutton', { name: 'Count' });
  await code.fill('aa');
  expect((code.element() as HTMLInputElement).validity.patternMismatch).toBe(true);
  await code.fill('AB');
  await page.getByRole('textbox', { name: 'Comment' }).fill('Ready');
  await count.fill('1');
  expect((count.element() as HTMLInputElement).validity.rangeUnderflow).toBe(true);
  await count.fill('9');
  expect((count.element() as HTMLInputElement).validity.rangeOverflow).toBe(true);
  await count.fill('3');
  expect((count.element() as HTMLInputElement).validity.stepMismatch).toBe(true);
  await count.fill('4');
  await page.getByRole('button', { name: 'Save' }).click();
  expect(submissions).toBe(1);
  expect(Object.fromEntries(new FormData(form))).toEqual({ code: 'AB', count: '4', comment: 'Ready' });
});

test('explicit native labels focus controls; caller-owned errors and descriptions update independently of native validity', async () => {
  function Example({ invalid = false }: { invalid?: boolean }) {
    const [points, setPoints] = useState<number | null>(2);
    return (
      <>
        <FormField label="Points" hint="Available points" invalid={invalid} error="Check the points">
          {(control) => <InputNumber {...control} value={points} onValueChange={setPoints} />}
        </FormField>
        <Field data-invalid={invalid || undefined}>
          <FieldLabel htmlFor="summary">Summary</FieldLabel>
          <Textarea
            id="summary"
            defaultValue="Native valid text"
            required
            aria-invalid={invalid || undefined}
            aria-describedby={invalid ? 'summary-hint summary-error' : 'summary-hint'}
          />
          <FieldDescription id="summary-hint">Visible to students</FieldDescription>
          {invalid ? <FieldError id="summary-error">Check the summary</FieldError> : null}
        </Field>
        <button type="button">Done</button>
      </>
    );
  }
  const { rerender } = render(<Example />);
  const points = page.getByRole('textbox', { name: 'Points' });
  await page.getByText('Points', { exact: true }).click();
  await expect.element(points).toHaveFocus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(points).toHaveValue('3');
  await userEvent.tab();
  const summary = page.getByRole('textbox', { name: 'Summary' });
  await expect.element(summary).toHaveFocus();
  expect(getComputedStyle(summary.element()).outlineWidth).toBe('2px');
  await expect.element(summary).toHaveAccessibleDescription('Visible to students');
  rerender(<Example invalid />);
  expect((summary.element() as HTMLTextAreaElement).validity.valid).toBe(true);
  await expect.element(summary).toHaveAttribute('aria-invalid', 'true');
  await expect.element(summary).toHaveAccessibleDescription('Visible to students Check the summary');
  await expect.element(points).toHaveAccessibleDescription('Check the points');
  await summary.fill('Still valid');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect.element(summary).toHaveAttribute('aria-invalid', 'true');
  rerender(<Example />);
  await expect.element(summary).not.toHaveAttribute('aria-invalid');
  await expect.element(summary).toHaveAccessibleDescription('Visible to students');
  await page.getByText('Summary', { exact: true }).click();
  await expect.element(summary).toHaveFocus();
});
