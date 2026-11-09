import { createRef, memo, useRef, useState } from 'react';
import { act, render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Checkbox, RadioButton, RadioGroup, ToggleSwitch } from '@tumaet/ui-react';

function requireForm(container: HTMLElement, id?: string): HTMLFormElement {
  const form = container.querySelector<HTMLFormElement>(id === undefined ? 'form' : `#${id}`);
  if (form === null) throw new Error('Missing native form');
  return form;
}

function appearance(input: Element): Element {
  const visible = input.nextElementSibling;
  if (!visible) throw new Error('Missing visible control');
  return visible;
}

function Defaults({
  selected,
  cancelReset = false,
  revision = 0,
  change,
}: {
  selected: boolean;
  cancelReset?: boolean;
  revision?: number;
  change: () => void;
}) {
  return (
    <form
      data-revision={revision}
      onReset={(event) => {
        if (cancelReset) event.preventDefault();
      }}
    >
      <Checkbox aria-label="Agreement" name="agree" defaultChecked={selected} onChange={change} />
      <ToggleSwitch aria-label="Notifications" name="mail" value="yes" defaultChecked={selected} onChange={change} />
      <RadioGroup aria-label="Count" name="count" defaultValue={selected ? 1 : null} onValueChange={change}>
        <RadioButton aria-label="One" value={1} />
        <RadioButton aria-label="Two" value={2} />
      </RadioGroup>
      <button type="reset">Reset</button>
    </form>
  );
}

for (const selected of [false, true]) {
  test(`native reset restores ${selected ? 'selected' : 'empty'} defaults through rerender without change callbacks`, async () => {
    const change = vi.fn();
    const { container, rerender } = render(<Defaults selected={selected} change={change} />);
    const form = requireForm(container);
    const agreement = page.getByRole('checkbox', { name: 'Agreement' });
    const mail = page.getByRole('switch', { name: 'Notifications' });
    const one = page.getByRole('radio', { name: 'One' });
    const two = page.getByRole('radio', { name: 'Two' });
    await agreement.click();
    await mail.click();
    await two.click();
    expect(Object.fromEntries(new FormData(form))).toEqual(
      selected ? { count: '2' } : { agree: 'on', mail: 'yes', count: '2' },
    );
    change.mockClear();
    // Native reset remains observable through an immediate React render.
    form.reset();
    rerender(<Defaults selected={selected} revision={1} change={change} />);
    expect((agreement.element() as HTMLInputElement).checked).toBe(selected);
    expect((mail.element() as HTMLInputElement).checked).toBe(selected);
    expect((one.element() as HTMLInputElement).checked).toBe(selected);
    await expect.element(two).not.toBeChecked();
    expect(Object.fromEntries(new FormData(form))).toEqual(selected ? { agree: 'on', mail: 'yes', count: '1' } : {});
    expect(change).not.toHaveBeenCalled();
    rerender(<Defaults selected={selected} cancelReset revision={2} change={change} />);
    await agreement.click();
    await mail.click();
    await two.click();
    const beforeReset = Object.fromEntries(new FormData(form));
    change.mockClear();
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    rerender(<Defaults selected={selected} cancelReset revision={3} change={change} />);
    expect((agreement.element() as HTMLInputElement).checked).toBe(!selected);
    expect((mail.element() as HTMLInputElement).checked).toBe(!selected);
    expect(two.element()).toBeChecked();
    expect(Object.fromEntries(new FormData(form))).toEqual(beforeReset);
    expect(change).not.toHaveBeenCalled();
  });
}

test('changing defaults follows bare React/native inputs, including radio exclusivity', async () => {
  const view = (selected: boolean) => (
    <form>
      <Checkbox aria-label="AET check" defaultChecked={selected} />
      <input type="checkbox" aria-label="Native check" defaultChecked={selected} />
      <ToggleSwitch aria-label="AET switch" defaultChecked={selected} />
      <input type="checkbox" aria-label="Native switch" defaultChecked={selected} />
      <RadioGroup name="aet" aria-label="AET" defaultValue={selected ? 'a' : null}>
        <RadioButton value="a" aria-label="AET A" />
        <RadioButton value="b" aria-label="AET B" />
      </RadioGroup>
      <input type="radio" name="native" value="a" aria-label="Native A" defaultChecked={selected} />
      <input type="radio" name="native" value="b" aria-label="Native B" defaultChecked={false} />
    </form>
  );
  const { container, rerender } = render(view(false));
  for (const [role, name] of [
    ['checkbox', 'AET check'],
    ['checkbox', 'Native check'],
    ['switch', 'AET switch'],
    ['checkbox', 'Native switch'],
    ['radio', 'AET B'],
    ['radio', 'Native B'],
  ] as const)
    await page.getByRole(role, { name, exact: true }).click();
  rerender(view(true));
  const checked = (name: string) => (page.getByLabelText(name, { exact: true }).element() as HTMLInputElement).checked;
  for (const part of ['check', 'switch', 'A', 'B']) expect(checked(`AET ${part}`)).toBe(checked(`Native ${part}`));
  requireForm(container).reset();
  for (const part of ['check', 'switch', 'A']) expect(checked(`AET ${part}`)).toBe(true);
  expect(checked('AET B')).toBe(false);
});

test('controlled rejection, normalization and reset retain caller ownership and FormData', async () => {
  const changes = vi.fn();
  function Controlled({ revision = 0 }: { revision?: number }) {
    const [checked, setChecked] = useState(false);
    const [value, setValue] = useState<string | number | null>('a');
    return (
      <form data-revision={revision}>
        <Checkbox aria-label="Rejected" name="rejected" checked={false} onChange={changes} />
        <ToggleSwitch
          aria-label="Accepted"
          name="accepted"
          checked={checked}
          onChange={(event) => {
            changes(event);
            setChecked(event.currentTarget.checked);
          }}
        />
        <RadioGroup
          aria-label="Normalized"
          name="normalized"
          value={value}
          onValueChange={(next, event) => {
            changes(next, event);
            setValue(next === 'b' ? 'c' : next);
          }}
        >
          <RadioButton value="a" aria-label="A" />
          <RadioButton value="b" aria-label="B" />
          <RadioButton value="c" aria-label="C" />
        </RadioGroup>
        <button type="reset">Reset</button>
      </form>
    );
  }
  const { container, rerender } = render(<Controlled />);
  const form = requireForm(container);
  await page.getByRole('checkbox', { name: 'Rejected' }).click();
  await page.getByRole('switch', { name: 'Accepted' }).click();
  await page.getByRole('radio', { name: 'B', exact: true }).click();
  await expect.element(page.getByRole('checkbox', { name: 'Rejected' })).not.toBeChecked();
  await expect.element(page.getByRole('radio', { name: 'C', exact: true })).toBeChecked();
  expect(Object.fromEntries(new FormData(form))).toEqual({ accepted: 'on', normalized: 'c' });
  changes.mockClear();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  rerender(<Controlled revision={1} />);
  await expect.element(page.getByRole('switch', { name: 'Accepted' })).toBeChecked();
  await expect.element(page.getByRole('radio', { name: 'C', exact: true })).toBeChecked();
  expect(Object.fromEntries(new FormData(form))).toEqual({ accepted: 'on', normalized: 'c' });
  expect(changes).not.toHaveBeenCalled();
});

test('external form association, reassociation, disabled/readOnly/required and value submission are native', async () => {
  function Associated({ form = 'first' }: { form?: string }) {
    return (
      <>
        <form id="first">
          <button type="reset">Reset first</button>
        </form>
        <form id="second">
          <button type="reset">Reset second</button>
        </form>
        <Checkbox aria-label="External agreement" form={form} name="agree" required />
        <ToggleSwitch aria-label="External mail" form={form} name="mail" required />
        <RadioGroup aria-label="External group" form={form} name="choice" required>
          <RadioButton value="one" aria-label="External one" />
          <RadioButton value="two" aria-label="External two" />
        </RadioGroup>
        <Checkbox aria-label="Disabled agreement" form={form} name="disabled-agree" defaultChecked disabled />
        <ToggleSwitch aria-label="Disabled mail" form={form} name="disabled-mail" defaultChecked disabled />
        <RadioGroup aria-label="Disabled group" form={form} name="disabled-choice" defaultValue="x" disabled>
          <RadioButton value="x" aria-label="Disabled x" />
        </RadioGroup>
        <Checkbox aria-label="Read only agreement" form={form} name="readonly-agree" defaultChecked readOnly />
        <ToggleSwitch aria-label="Read only mail" form={form} name="readonly-mail" defaultChecked readOnly />
        <RadioGroup aria-label="Read only group" form={form} name="readonly-choice" defaultValue="x" readOnly>
          <RadioButton value="x" aria-label="Read only x" />
          <RadioButton value="y" aria-label="Read only y" />
        </RadioGroup>
      </>
    );
  }
  const { container, rerender } = render(<Associated />);
  const first = requireForm(container, 'first');
  const second = requireForm(container, 'second');
  expect(first.checkValidity()).toBe(false);
  await page.getByRole('checkbox', { name: 'External agreement' }).click();
  await page.getByRole('switch', { name: 'External mail' }).click();
  expect(first.checkValidity()).toBe(false);
  await page.getByRole('radio', { name: 'External two' }).click();
  expect(first.checkValidity()).toBe(true);
  await page.getByRole('checkbox', { name: 'Disabled agreement' }).click({ force: true });
  await page.getByRole('switch', { name: 'Disabled mail' }).click({ force: true });
  await page.getByRole('checkbox', { name: 'Read only agreement' }).click();
  await page.getByRole('switch', { name: 'Read only mail' }).click();
  await page.getByRole('radio', { name: 'Read only y' }).click();
  const expected = {
    agree: 'on',
    mail: 'on',
    choice: 'two',
    'readonly-agree': 'on',
    'readonly-mail': 'on',
    'readonly-choice': 'x',
  };
  expect(Object.fromEntries(new FormData(first))).toEqual(expected);
  expect([...new FormData(second)]).toEqual([]);
  rerender(<Associated form="second" />);
  expect([...new FormData(first)]).toEqual([]);
  expect(Object.fromEntries(new FormData(second))).toEqual(expected);
  await page.getByRole('button', { name: 'Reset first', exact: true }).click();
  await expect.element(page.getByRole('radio', { name: 'External two' })).toBeChecked();
  await page.getByRole('button', { name: 'Reset second', exact: true }).click();
  await expect.element(page.getByRole('checkbox', { name: 'External agreement' })).not.toBeChecked();
  await expect.element(page.getByRole('switch', { name: 'External mail' })).not.toBeChecked();
  await expect.element(page.getByRole('radio', { name: 'External two' })).not.toBeChecked();
  expect(Object.fromEntries(new FormData(second))).toEqual({
    'readonly-agree': 'on',
    'readonly-mail': 'on',
    'readonly-choice': 'x',
  });
});

test('explicit labels, keyboard, root refs and built focus styles work without a Field adapter', async () => {
  const input = createRef<HTMLInputElement>();
  const { unmount } = render(
    <>
      <button type="button">Start</button>
      <label id="agree-label" htmlFor="agree-input">
        Agree to terms
      </label>
      <Checkbox id="agree-input" aria-labelledby="agree-label" ref={input} />
      <label id="mail-label" htmlFor="mail-input">
        Weekly mail
      </label>
      <ToggleSwitch id="mail-input" aria-labelledby="mail-label" />
      <RadioGroup name="size" aria-label="Size" defaultValue="s">
        <RadioButton value="s" aria-label="Small" />
        <RadioButton value="m" aria-label="Medium" disabled />
        <RadioButton value="l" aria-label="Large" />
      </RadioGroup>
      <button type="button">Done</button>
    </>,
  );
  const box = page.getByRole('checkbox', { name: 'Agree to terms' });
  await page.getByText('Agree to terms', { exact: true }).click();
  await expect.element(box).toBeChecked();
  expect(input.current).toBe(box.element());
  expect(input.current?.checked).toBe(true);
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await userEvent.tab();
  await expect.element(box).toHaveFocus();
  expect(getComputedStyle(appearance(box.element())).outlineStyle).toBe('solid');
  expect(getComputedStyle(appearance(box.element())).outlineWidth).toBe('2px');
  await userEvent.keyboard(' ');
  await expect.element(box).not.toBeChecked();
  await userEvent.tab();
  await expect.element(page.getByRole('switch', { name: 'Weekly mail' })).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(page.getByRole('switch', { name: 'Weekly mail' })).toBeChecked();
  await userEvent.tab();
  await expect.element(page.getByRole('radio', { name: 'Small' })).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('radio', { name: 'Large' })).toBeChecked();
  await expect.element(page.getByRole('radio', { name: 'Large' })).toHaveFocus();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(page.getByRole('radio', { name: 'Small' })).toBeChecked();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Done', exact: true })).toHaveFocus();
  unmount();
  expect(input.current).toBeNull();
});

test('AET colors and geometry survive tight rows and unset spacing tokens', () => {
  const { container } = render(
    <>
      {(['light', 'dark'] as const).map((theme) => (
        <section
          data-theme={theme}
          aria-label={theme}
          key={theme}
          style={{ width: 120, ['--tumaet-ui-spacing' as string]: theme === 'dark' ? 'initial' : undefined }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Checkbox aria-label={`${theme} checkbox`} defaultChecked />
            <span>A long label that wraps over several lines</span>
          </div>
          <RadioGroup
            name={`${theme}-radio`}
            aria-label={`${theme} radio`}
            defaultValue="selected"
            style={{ flexDirection: 'row', gap: 8 }}
          >
            <RadioButton value="selected" aria-label={`${theme} selected`} />
            <span>A long option that wraps over several lines</span>
          </RadioGroup>
          <ToggleSwitch aria-label={`${theme} switch`} defaultChecked />
          <span data-palette style={{ color: 'var(--tumaet-ui-primary-color)' }} />
        </section>
      ))}
    </>,
  );
  for (const section of container.querySelectorAll('section')) {
    const palette = section.querySelector('[data-palette]');
    const checkbox = section.querySelector('input[type="checkbox"]:not([role="switch"])');
    const radio = section.querySelector('input[type="radio"]');
    const toggle = section.querySelector('[role="switch"]');
    const checkBox = checkbox?.nextElementSibling;
    const radioBox = radio?.nextElementSibling;
    if (!palette || !checkbox || !radio || !toggle || !checkBox || !radioBox)
      throw new Error('Missing themed controls');
    for (const control of [checkBox, radioBox]) {
      const rect = control.getBoundingClientRect();
      expect(rect.width).toBeGreaterThan(0);
      expect(rect.width).toBeCloseTo(rect.height, 1);
    }
    for (const box of [checkBox, radioBox, appearance(toggle)])
      expect(getComputedStyle(box).backgroundColor).toBe(getComputedStyle(palette).color);
    expect(getComputedStyle(radioBox).borderRadius).toBe('50%');
    const dot = radioBox.querySelector('.tumaet-ui-radio-button-icon');
    if (!dot) throw new Error('Missing visible radio dot');
    const dotRect = dot.getBoundingClientRect();
    expect(dotRect.width).toBeGreaterThan(0);
    expect(dotRect.width).toBeCloseTo(dotRect.height, 1);
    expect(getComputedStyle(dot).visibility).toBe('visible');
    expect(getComputedStyle(dot).borderRadius).toBe('50%');
  }
});

const AssociatedControls = memo(function NativeAssociatedControls({ form }: { form?: string }) {
  return (
    <>
      <Checkbox name="check" aria-label="Check" form={form} />
      <ToggleSwitch name="switch" aria-label="Switch" form={form} />
      <RadioGroup name="radio" aria-label="Radio" form={form} defaultValue="a">
        <RadioButton value="a" aria-label="A" />
        <RadioButton value="b" aria-label="B" />
      </RadioGroup>
    </>
  );
});

async function chooseAssociatedControls() {
  await page.getByRole('checkbox', { name: 'Check', exact: true }).click();
  await page.getByRole('switch', { name: 'Switch', exact: true }).click();
  await page.getByRole('radio', { name: 'B', exact: true }).click();
}

function expectAssociatedDefaults() {
  expect(page.getByRole('checkbox', { name: 'Check', exact: true }).element()).not.toBeChecked();
  expect(page.getByRole('switch', { name: 'Switch', exact: true }).element()).not.toBeChecked();
  expect(page.getByRole('radio', { name: 'A', exact: true }).element()).toBeChecked();
}

function LateOwner() {
  const [mounted, setMounted] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setMounted(true)}>
        Mount form
      </button>
      {mounted ? (
        <form id="late">
          <button type="reset">Reset late</button>
        </form>
      ) : null}
    </>
  );
}

test('native fieldset disability excludes visible controls from keyboard and programmatic focus', async () => {
  const { container } = render(
    <>
      <button type="button">Before</button>
      <fieldset disabled>
        <AssociatedControls />
      </fieldset>
      <button type="button">After</button>
    </>,
  );
  await page.getByRole('button', { name: 'Before', exact: true }).click();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'After', exact: true })).toHaveFocus();
  for (const control of container.querySelectorAll<HTMLElement>('input')) {
    expect(control).toBeDisabled();
    control.focus();
    expect(control).not.toHaveFocus();
  }
});

test('native form ownership follows a late sibling form without a control render', async () => {
  const { container } = render(
    <>
      <AssociatedControls form="late" />
      <LateOwner />
    </>,
  );
  await chooseAssociatedControls();
  await page.getByRole('button', { name: 'Mount form', exact: true }).click();
  const form = requireForm(container, 'late');
  expect(Object.fromEntries(new FormData(form))).toEqual({ check: 'on', switch: 'on', radio: 'b' });
  await page.getByRole('button', { name: 'Reset late', exact: true }).click();
  expectAssociatedDefaults();
  expect(Object.fromEntries(new FormData(form))).toEqual({ radio: 'a' });
});

test('a reset keeps its effect through immediate native form reassociation', async () => {
  const fixture = (form: string) => (
    <>
      <form id="first" />
      <form id="second" />
      <AssociatedControls form={form} />
    </>
  );
  const { container, rerender } = render(fixture('first'));
  await chooseAssociatedControls();
  requireForm(container, 'first').reset();
  rerender(fixture('second'));
  expectAssociatedDefaults();
  expect(Object.fromEntries(new FormData(requireForm(container, 'second')))).toEqual({ radio: 'a' });
});

test('native activations after reset update selection directly', () => {
  const { container } = render(
    <form>
      <AssociatedControls />
    </form>,
  );
  const form = requireForm(container);
  act(() => {
    form.reset();
    (page.getByRole('checkbox', { name: 'Check', exact: true }).element() as HTMLElement).click();
    (page.getByRole('switch', { name: 'Switch', exact: true }).element() as HTMLElement).click();
    (page.getByRole('radio', { name: 'B', exact: true }).element() as HTMLElement).click();
  });
  expect(page.getByRole('checkbox', { name: 'Check', exact: true }).element()).toBeChecked();
  expect(page.getByRole('switch', { name: 'Switch', exact: true }).element()).toBeChecked();
  expect(page.getByRole('radio', { name: 'B', exact: true }).element()).toBeChecked();
  expect(Object.fromEntries(new FormData(form))).toEqual({ check: 'on', switch: 'on', radio: 'b' });
});

for (const resetBeforeRemoval of [false, true]) {
  test(`removing the selected option ${resetBeforeRemoval ? 'after' : 'before'} reset preserves group defaults`, async () => {
    const view = (showSelected: boolean) => (
      <form>
        <RadioGroup name="choice" aria-label="Choice" defaultValue="a">
          <RadioButton value="a" aria-label="A" />
          {showSelected ? <RadioButton value="b" aria-label="B" /> : null}
          <RadioButton value="c" aria-label="C" />
        </RadioGroup>
      </form>
    );
    const { container, rerender } = render(view(true));
    const form = requireForm(container);
    const group = page.getByRole('radiogroup', { name: 'Choice' }).element();
    await page.getByRole('radio', { name: 'B', exact: true }).click();
    if (resetBeforeRemoval) form.reset();
    rerender(view(false));
    if (!resetBeforeRemoval) form.reset();
    expect(page.getByRole('radiogroup', { name: 'Choice' }).element()).toBe(group);
    expect(page.getByRole('radio', { name: 'A', exact: true }).element()).toBeChecked();
    expect(Object.fromEntries(new FormData(form))).toEqual({ choice: 'a' });
  });
}

function ResetFromChange({ onChange }: { onChange: () => void }) {
  const form = useRef<HTMLFormElement>(null);
  const reset = () => {
    onChange();
    form.current?.reset();
  };
  return (
    <form ref={form}>
      <Checkbox name="check" aria-label="Check" onChange={reset} />
      <ToggleSwitch name="switch" aria-label="Switch" onChange={reset} />
      <RadioGroup name="radio" aria-label="Radio" defaultValue="a" onValueChange={reset}>
        <RadioButton value="a" aria-label="A" />
        <RadioButton value="b" aria-label="B" onChange={(event) => event.currentTarget.form?.reset()} />
      </RadioGroup>
    </form>
  );
}

test('a native reset inside a change callback follows that activation without another change event', async () => {
  const change = vi.fn();
  const { container } = render(<ResetFromChange onChange={change} />);
  for (const control of [
    page.getByRole('checkbox', { name: 'Check', exact: true }),
    page.getByRole('switch', { name: 'Switch', exact: true }),
    page.getByRole('radio', { name: 'B', exact: true }),
  ]) {
    await control.click();
    expectAssociatedDefaults();
    expect(Object.fromEntries(new FormData(requireForm(container)))).toEqual({ radio: 'a' });
  }
  expect(change).toHaveBeenCalledTimes(3);
});

test('readOnly vetoes pointer, Space and radio arrow activation while preserving focus and submission', async () => {
  const change = vi.fn();
  const { container } = render(
    <form>
      <Checkbox aria-label="Read only check" name="check" defaultChecked readOnly onChange={change} />
      <ToggleSwitch aria-label="Read only switch" name="switch" defaultChecked readOnly onChange={change} />
      <RadioGroup name="radio" aria-label="Read only radio" defaultValue="a" readOnly onValueChange={change}>
        <RadioButton value="a" aria-label="Read only A" />
        <RadioButton value="b" aria-label="Read only B" />
      </RadioGroup>
    </form>,
  );
  for (const [role, name] of [
    ['checkbox', 'Read only check'],
    ['switch', 'Read only switch'],
    ['radio', 'Read only B'],
  ] as const) {
    const control = page.getByRole(role, { name, exact: true });
    await control.click();
    (control.element() as HTMLInputElement).focus();
    await userEvent.keyboard(' ');
  }
  (page.getByRole('radio', { name: 'Read only A', exact: true }).element() as HTMLInputElement).focus();
  await userEvent.keyboard('{ArrowDown}{ArrowRight}');
  await expect.element(page.getByRole('radio', { name: 'Read only A', exact: true })).toHaveFocus();
  expect(Object.fromEntries(new FormData(requireForm(container)))).toEqual({ check: 'on', switch: 'on', radio: 'a' });
  expect(change).not.toHaveBeenCalled();
});

test('pointer focus follows the same engine behavior as bare native inputs', async () => {
  render(
    <>
      <button type="button">Focus origin</button>
      <Checkbox aria-label="AET check" />
      <input type="checkbox" aria-label="Native check" />
      <ToggleSwitch aria-label="AET switch" />
      <input type="checkbox" role="switch" aria-label="Native switch" />
      <RadioGroup name="aet" aria-label="AET radio">
        <RadioButton value="a" aria-label="AET option" />
      </RadioGroup>
      <input type="radio" name="native" value="a" aria-label="Native option" />
    </>,
  );
  for (const [role, part] of [
    ['checkbox', 'check'],
    ['switch', 'switch'],
    ['radio', 'option'],
  ] as const) {
    const focus: boolean[] = [];
    for (const prefix of ['AET', 'Native']) {
      const origin = page.getByRole('button', { name: 'Focus origin' }).element() as HTMLButtonElement;
      origin.focus();
      const control = page.getByRole(role, { name: `${prefix} ${part}`, exact: true });
      await control.click();
      focus.push(document.activeElement === control.element());
    }
    expect(focus[0]).toBe(focus[1]);
  }
});

test('visible AET parts follow native mixed, invalid and disabled states', async () => {
  const view = (disabled = false, invalid = false) => (
    <>
      <Checkbox aria-label="Mixed" indeterminate defaultChecked disabled={disabled} aria-invalid={invalid} />
      <span data-danger style={{ color: 'var(--tumaet-ui-state-danger)' }} />
      <span data-disabled style={{ color: 'var(--tumaet-ui-disabled-background)' }} />
    </>
  );
  const { container, rerender } = render(view());
  const input = page.getByRole('checkbox', { name: 'Mixed' });
  const box = appearance(input.element());
  const check = box.querySelector('.tumaet-ui-checkbox-check');
  const minus = box.querySelector('.tumaet-ui-checkbox-minus');
  const danger = container.querySelector('[data-danger]');
  const disabled = container.querySelector('[data-disabled]');
  if (!check || !minus || !danger || !disabled) throw new Error('Missing appearance fixture');
  expect(input.element()).toBePartiallyChecked();
  expect(getComputedStyle(minus).display).not.toBe('none');
  expect(getComputedStyle(check).display).toBe('none');
  await input.click();
  expect(input.element()).not.toBePartiallyChecked();
  expect(getComputedStyle(minus).display).toBe('none');
  rerender(view(true, true));
  expect(input.element()).toBePartiallyChecked();
  await expect.poll(() => getComputedStyle(box).backgroundColor).toBe(getComputedStyle(disabled).color);
  rerender(view(false, true));
  await expect.poll(() => getComputedStyle(box).borderColor).toBe(getComputedStyle(danger).color);
});
