import { act, render } from '@testing-library/react';
import { useEffect, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogClose,
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
} from '@tumaet/ui-react';

const items = ['Alpha', 'Beta', 'Gamma'].map((value) => ({
  key: value,
  value,
  label: value,
  disabled: value === 'Beta',
}));
function Parts({
  label = 'Course',
  multiple = false,
  container,
  invalid,
}: {
  label?: string;
  multiple?: boolean;
  container?: HTMLElement | null;
  invalid?: boolean;
}) {
  const controls = (
    <>
      <ComboboxInput aria-label={label} aria-invalid={invalid ?? undefined} />
      <ComboboxClear />
      <ComboboxTrigger />
    </>
  );
  return (
    <>
      <ComboboxInputGroup>{multiple ? <ComboboxChips>{controls}</ComboboxChips> : controls}</ComboboxInputGroup>
      <ComboboxPortal container={container}>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList aria-label={label} />
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </>
  );
}
function Single(props: Partial<ComboboxProps<string>>) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Combobox items={items} value={value} onValueChange={setValue} {...props}>
      <Parts />
    </Combobox>
  );
}
function formElement(name: string) {
  const element = page.getByRole('form', { name }).element();
  if (!(element instanceof HTMLFormElement)) throw new Error(`Missing form ${name}`);
  return element;
}
function reset(form: HTMLFormElement) {
  let data: FormData | undefined;
  act(() => {
    form.reset();
    data = new FormData(form);
  });
  if (!data) throw new Error('Missing reset data');
  return data;
}

test('shows one focus outline for the text input and identifies the trigger separately', async () => {
  render(
    <>
      <button type="button">Before</button>
      <Single />
    </>,
  );
  const input = page.getByRole('combobox', { name: 'Course' });
  const trigger = page.getByRole('button', { name: 'Filter options' });
  const group = input.element().closest('.tumaet-ui-autocomplete-container');
  if (!group) throw new Error('Missing input group');
  page.getByRole('button', { name: 'Before' }).element().focus();
  await userEvent.keyboard('{Tab}');
  await expect.element(input).toHaveFocus();
  expect(getComputedStyle(group).outlineStyle).toBe('solid');
  expect(getComputedStyle(group).outlineWidth).toBe('2px');
  expect(getComputedStyle(input.element()).outlineStyle).toBe('none');
  act(() => trigger.element().focus());
  await expect.element(trigger).toHaveFocus();
  expect(getComputedStyle(trigger.element()).outlineStyle).toBe('solid');
  expect(getComputedStyle(trigger.element()).outlineWidth).toBe('2px');
  expect(getComputedStyle(group).outlineStyle).toBe('none');
});

test('uses native typing and keyboard selection, skips disabled results, dismisses with Escape and returns focus', async () => {
  const { rerender } = render(<Single />);
  const input = page.getByRole('combobox', { name: 'Course' });
  input.element().focus();
  await userEvent.keyboard('be{ArrowDown}{Enter}');
  await expect.element(page.getByRole('option', { name: 'Beta' })).toHaveAttribute('aria-disabled', 'true');
  await input.fill('ga');
  await expect.element(page.getByRole('option', { name: 'Gamma' })).toBeVisible();
  await expect.element(page.getByRole('option', { name: 'Alpha' })).not.toBeInTheDocument();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(input).toHaveValue('Gamma');
  await expect.element(input).toHaveFocus();
  await input.click();
  await expect.element(page.getByRole('listbox')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(input).toHaveFocus();
  await input.click();
  await expect.element(page.getByRole('listbox')).toBeVisible();
  rerender(<Single disabled />);
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(input).toBeDisabled();
  await expect.element(page.getByRole('button', { name: 'Filter options' })).toBeDisabled();
});

test('selects multiple values and removes chips with native keyboard and pointer interaction', async () => {
  function Multiple() {
    const [value, setValue] = useState<string[]>([]);
    return (
      <form aria-label="Multiple">
        <Combobox multiple required items={items} value={value} onValueChange={setValue} name="courses">
          <Parts multiple />
        </Combobox>
      </form>
    );
  }
  render(<Multiple />);
  const input = page.getByRole('combobox');
  const form = formElement('Multiple');
  expect(form.checkValidity()).toBe(false);
  await input.click();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(page.getByRole('option', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
  expect(form.checkValidity()).toBe(true);
  await input.fill('ga');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await input.click();
  await userEvent.keyboard('{Escape}');
  expect(new FormData(form).getAll('courses')).toEqual(['Alpha', 'Gamma']);
  await expect.element(page.getByRole('button', { name: 'Remove Gamma' })).toBeVisible();
  await input.fill('');
  await userEvent.keyboard('{ArrowLeft}{Backspace}');
  await expect.poll(() => new FormData(form).getAll('courses')).toEqual(['Alpha']);
  await page.getByRole('button', { name: 'Remove Alpha' }).click();
  expect(new FormData(form).getAll('courses')).toEqual([]);
  expect(form.checkValidity()).toBe(false);
  await expect.element(input).toHaveFocus();
});

interface SearchRequest {
  query: string;
  signal: AbortSignal;
  resolve: (values: string[]) => void;
}
function AsyncFixture({ search }: { search: (query: string, signal: AbortSignal) => Promise<string[]> }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [value, setValue] = useState<string | null>('Gamma');
  useEffect(() => {
    const controller = new AbortController();
    void search(query, controller.signal).then((next) => {
      if (!controller.signal.aborted) setResults(next);
    });
    return () => controller.abort();
  }, [query, search]);
  const collection = [...new Set([...results, ...(value === null ? [] : [value])])].map((entry) => ({
    key: entry,
    value: entry,
    label: entry,
  }));
  return (
    <form aria-label="Async">
      <Combobox
        items={collection}
        filteredItems={results}
        filter={null}
        value={value}
        onValueChange={setValue}
        inputValue={query}
        onInputValueChange={setQuery}
        name="course"
      >
        <Parts />
      </Combobox>
    </form>
  );
}

test('keeps async query separate from selection, uses server filtering and ignores stale responses', async () => {
  const pending: SearchRequest[] = [];
  const search = async (query: string, signal: AbortSignal) =>
    new Promise<string[]>((resolve) => {
      pending.push({ query, signal, resolve });
    });
  render(<AsyncFixture search={search} />);
  const input = page.getByRole('combobox');
  await input.fill('first');
  await expect.poll(() => pending.some((request) => request.query === 'first')).toBe(true);
  await input.fill('server-token');
  await expect.poll(() => pending.some((request) => request.query === 'server-token')).toBe(true);
  const first = pending.find((request) => request.query === 'first');
  const latest = pending.find((request) => request.query === 'server-token');
  if (!first || !latest) throw new Error('Missing requests');
  expect(first.signal.aborted).toBe(true);
  await act(async () => {
    latest.resolve(['Alpha']);
    await Promise.resolve();
  });
  const visibleResults = () =>
    Array.from(page.getByRole('listbox').element().querySelectorAll('[role="option"]'), (option) => option.textContent);
  await expect.poll(visibleResults).toEqual(['Alpha']);
  expect(new FormData(formElement('Async')).get('course')).toBe('Gamma');
  await act(async () => {
    first.resolve(['Beta']);
    await Promise.resolve();
  });
  expect(visibleResults()).toEqual(['Alpha']);
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(new FormData(formElement('Async')).get('course')).toBe('Alpha');
  await expect.element(input).toHaveValue('Alpha');
});

function FormFixture({
  cancelReset = false,
  preserve = false,
  cancelValue = false,
  rejectValue = false,
}: {
  cancelReset?: boolean;
  preserve?: boolean;
  cancelValue?: boolean;
  rejectValue?: boolean;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  return (
    <form
      aria-label="Courses"
      onReset={(event) => {
        if (cancelReset) event.preventDefault();
        if (!event.defaultPrevented && !preserve) flushSync(() => setValue(null));
      }}
      onSubmit={(event) => event.preventDefault()}
    >
      <Combobox
        items={items}
        required
        name="course"
        value={value}
        onValueChange={(next, details) => {
          if (cancelValue) details.cancel();
          if (!details.isCanceled && !rejectValue) setValue(next);
        }}
      >
        <Parts label="Required course" />
      </Combobox>
      <Combobox items={items} name="readonly" value="Alpha" readOnly>
        <Parts label="Read only course" />
      </Combobox>
      <Combobox items={items} name="disabled" value="Gamma" disabled>
        <Parts label="Disabled course" />
      </Combobox>
      <button type="submit">Submit</button>
      <button type="button" onClick={() => setVersion(version + 1)}>
        Rerender {version}
      </button>
    </form>
  );
}

test('enforces native required, disabled and readOnly, and leaves reset and rejected selection with the caller', async () => {
  const { rerender } = render(<FormFixture />);
  const form = formElement('Courses');
  expect(form.checkValidity()).toBe(false);
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  const input = page.getByRole('combobox', { name: 'Required course' });
  await expect.element(input).toHaveFocus();
  await input.fill('ga');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(form.checkValidity()).toBe(true);
  expect(Array.from(new FormData(form))).toEqual([
    ['course', 'Gamma'],
    ['readonly', 'Alpha'],
  ]);
  const readonly = page.getByRole('combobox', { name: 'Read only course' });
  await readonly.click();
  await userEvent.keyboard('ga{ArrowDown}{Enter}');
  await expect.element(readonly).toHaveValue('Alpha');
  await expect.element(page.getByRole('listbox')).toHaveAttribute('aria-readonly', 'true');
  await page.getByRole('option', { name: 'Gamma' }).click();
  expect(new FormData(form).get('readonly')).toBe('Alpha');
  await userEvent.keyboard('{Escape}');
  const original = input.element();
  const id = original.id;
  original.focus();
  expect(reset(form).get('course')).toBe('');
  await page.getByRole('button', { name: 'Rerender 0' }).click();
  expect(input.element()).toBe(original);
  expect(original.id).toBe(id);
  expect(new FormData(form).get('course')).toBe('');
  await input.fill('ga');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  rerender(<FormFixture cancelReset />);
  expect(reset(form).get('course')).toBe('Gamma');
  rerender(<FormFixture preserve />);
  expect(reset(form).get('course')).toBe('Gamma');
  rerender(<FormFixture cancelValue />);
  await input.fill('al');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(new FormData(form).get('course')).toBe('Gamma');
  await expect.element(input).toHaveValue('al');
  await expect.element(page.getByRole('listbox')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(input).toHaveValue('Gamma');
  rerender(<FormFixture rejectValue />);
  await input.fill('al');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  expect(new FormData(form).get('course')).toBe('Gamma');
  await expect.element(input).toHaveValue('Gamma');
});

function ExternalFixture({ mounted = false, owner = 'late' }: { mounted?: boolean; owner?: string }) {
  const [value, setValue] = useState<string | null>('Alpha');
  const policy = (event: React.SyntheticEvent<HTMLFormElement>) => {
    if (!event.defaultPrevented && event.currentTarget.id === owner) flushSync(() => setValue('Alpha'));
  };
  return (
    <>
      <Combobox items={items} value={value} onValueChange={setValue} name="course" form={owner}>
        <Parts />
      </Combobox>
      {mounted ? <form id="late" aria-label="Late form" onReset={policy} /> : null}
      <form id="other" aria-label="Other form" onReset={policy} />
    </>
  );
}

test('follows late native external form ownership without a reset subscription or remount', async () => {
  const { rerender } = render(<ExternalFixture />);
  const input = page.getByRole('combobox');
  const original = input.element();
  rerender(<ExternalFixture mounted />);
  await input.fill('ga');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  const late = formElement('Late form');
  const other = formElement('Other form');
  expect(new FormData(late).get('course')).toBe('Gamma');
  expect(reset(late).get('course')).toBe('Alpha');
  await input.fill('ga');
  await userEvent.keyboard('{ArrowDown}{Enter}');
  rerender(<ExternalFixture mounted owner="other" />);
  expect(new FormData(late).has('course')).toBe(false);
  expect(new FormData(other).get('course')).toBe('Gamma');
  reset(late);
  expect(new FormData(other).get('course')).toBe('Gamma');
  expect(reset(other).get('course')).toBe('Alpha');
  expect(input.element()).toBe(original);
});

function ScopedFixture({ children }: { children?: ReactNode }) {
  const [value, setValue] = useState<string | null>(null);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  return (
    <div data-theme="dark" dir="rtl">
      <div role="region" aria-label="Clipping container" style={{ height: 70, overflow: 'hidden', width: 260 }}>
        <Combobox items={items} value={value} onValueChange={setValue}>
          <Parts container={host} invalid />
        </Combobox>
      </div>
      <div ref={setHost} data-testid="combobox-host" />
      {children}
    </div>
  );
}

test('positions the built styled popup outside clipping while inheriting a scoped portal theme and direction', async () => {
  render(<ScopedFixture />);
  const input = page.getByRole('combobox');
  await input.click();
  const list = page.getByRole('listbox');
  await expect.element(list).toBeVisible();
  expect(page.getByTestId('combobox-host').element().contains(list.element())).toBe(true);
  await expect.element(list).toHaveStyle({ direction: 'rtl', colorScheme: 'dark' });
  const clipping = page.getByRole('region', { name: 'Clipping container' }).element();
  await expect
    .poll(() => list.element().getBoundingClientRect().bottom)
    .toBeGreaterThan(clipping.getBoundingClientRect().bottom);
  await page.getByRole('option', { name: 'Gamma' }).click();
  await expect.element(input).toHaveValue('Gamma');
  await expect.element(input).toHaveFocus();
});

test('Escape closes results, clears selection and then dismisses the parent dialog', async () => {
  render(
    <Dialog>
      <DialogTrigger>Open course picker</DialogTrigger>
      <DialogPortal>
        <DialogBackdrop />
        <DialogPopup>
          <DialogTitle>Course picker</DialogTitle>
          <form aria-label="Dialog course">
            <Single name="course" />
            <DialogClose>Close course picker</DialogClose>
          </form>
        </DialogPopup>
      </DialogPortal>
    </Dialog>,
  );
  const trigger = page.getByRole('button', { name: 'Open course picker' });
  const dialog = page.getByRole('dialog', { name: 'Course picker' });
  const input = page.getByRole('combobox', { name: 'Course' });
  await trigger.click();
  await expect.element(input).toHaveFocus();
  await userEvent.keyboard('ga{ArrowDown}{Enter}');
  await expect.element(input).toHaveValue('Gamma');
  await expect.element(dialog).toBeVisible();
  await input.click();
  await expect.element(page.getByRole('listbox')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(page.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(input).toHaveFocus();
  await expect.element(dialog).toBeVisible();
  expect(new FormData(formElement('Dialog course')).get('course')).toBe('Gamma');
  await userEvent.keyboard('{Escape}');
  await expect.element(input).toHaveValue('');
  await expect.poll(() => new FormData(formElement('Dialog course')).get('course')).toBe('');
  await expect.element(dialog).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await expect.element(dialog).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});
