import { createRef, useState, type SyntheticEvent } from 'react';
import { render } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { Tabs, TabList, Tab, TabIndicator, TabPanels, TabPanel } from '../../src/components/tabs';
import { InputNumber } from '../../src/components/input-number';
import { Panel, PanelHeader, PanelTitle, PanelTrigger, PanelContent } from '../../src/components/panel';
import { SelectButton } from '../../src/components/select-button';
import { FormField } from '../../src/components/form-field';
import { InputGroup, InputGroupAddon } from '../../src/components/input-group';

function requireForm(container: HTMLElement) {
  const form = container.querySelector('form');
  if (!form) throw new Error('Missing form fixture');
  return form;
}

test.each(['ltr', 'rtl'] as const)('numeric InputGroup rounds only visible outer edges in %s', (direction) => {
  const { container } = render(
    <DirectionProvider direction={direction}>
      <div dir={direction}>
        {[false, true].flatMap((buttons) =>
          [false, true].map((trailing) => (
            <InputGroup key={`${buttons}-${trailing}`} data-trailing={trailing}>
              <InputGroupAddon>#</InputGroupAddon>
              <InputNumber value={2} showButtons={buttons} aria-label={`${buttons}-${trailing}`} />
              {trailing ? <InputGroupAddon>places</InputGroupAddon> : null}
            </InputGroup>
          )),
        )}
      </div>
    </DirectionProvider>,
  );
  for (const group of container.querySelectorAll('.tumaet-ui-input-group')) {
    const input = group.querySelector('.tumaet-ui-input-number-input');
    if (!input) throw new Error('Missing numeric field');
    expect(getComputedStyle(input).borderStartStartRadius).toBe('0px');
    const controls = [input, ...group.querySelectorAll('.tumaet-ui-input-number-button')];
    for (const control of controls) {
      const style = getComputedStyle(control);
      const radius = control.classList.contains('tumaet-ui-input-number-decrement')
        ? style.borderEndEndRadius
        : style.borderStartEndRadius;
      expect(Number.parseFloat(radius) > 0).toBe(group.getAttribute('data-trailing') !== 'true');
    }
  }
});

for (const direction of ['ltr', 'rtl'] as const) {
  test(`Tabs manual activation follows ${direction} direction and preserves drafts`, async () => {
    const { unmount } = render(
      <DirectionProvider direction={direction}>
        <div dir={direction}>
          <Tabs defaultValue={1}>
            <TabList aria-label="Workspace">
              <Tab value={1}>Number</Tab>
              <Tab value="1">String</Tab>
              <Tab value="disabled" disabled>
                Unavailable
              </Tab>
              <TabIndicator />
            </TabList>
            <TabPanels>
              <TabPanel value={1} keepMounted>
                <input aria-label="Draft" defaultValue="unsaved" />
              </TabPanel>
              <TabPanel value="1">String content</TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </DirectionProvider>,
    );
    const number = page.getByRole('tab', { name: 'Number', exact: true });
    const string = page.getByRole('tab', { name: 'String', exact: true });
    await number.click();
    await userEvent.keyboard(direction === 'ltr' ? '{ArrowRight}' : '{ArrowLeft}');
    await expect.element(string).toHaveFocus();
    await expect.element(number).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Enter}');
    await expect.element(page.getByRole('tabpanel')).toHaveTextContent('String content');
    await userEvent.keyboard('{End}');
    await expect.element(page.getByRole('tab', { name: 'Unavailable' })).toHaveFocus();
    await expect.element(string).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{Home} ');
    await expect.element(page.getByRole('textbox', { name: 'Draft' })).toHaveValue('unsaved');
    const panel = page.getByRole('tabpanel').element();
    expect(number.element()).toHaveAttribute('aria-controls', panel.id);
    unmount();
  });
}

test('Tabs automatic vertical navigation, indicator geometry and bounded content use built CSS', async () => {
  const { container, unmount } = render(
    <>
      <button type="button">Before tabs</button>
      <div data-testid="tab-bounds" style={{ height: 250 }}>
        <Tabs defaultValue="chat" style={{ height: '100%' }}>
          <TabList aria-label="Automatic" activateOnFocus>
            <Tab value="chat">Chat</Tab>
            <Tab value="notes">Notes</Tab>
            <TabIndicator />
          </TabList>
          <TabPanels style={{ flex: 1, minHeight: 0, padding: 0 }}>
            <TabPanel value="chat" keepMounted fill>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  {Array.from({ length: 30 }, (_, index) => (
                    <p key={index}>Message {index}</p>
                  ))}
                </div>
                <input aria-label="Composer" />
              </div>
            </TabPanel>
            <TabPanel value="notes">Notes content</TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </>,
  );
  const composer = page.getByRole('textbox', { name: 'Composer' }).element();
  expect(composer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    page.getByTestId('tab-bounds').element().getBoundingClientRect().bottom + 1,
  );
  await page.getByRole('button', { name: 'Before tabs' }).click();
  await userEvent.tab();
  await expect.element(page.getByRole('tab', { name: 'Chat', exact: true })).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  const notes = page.getByRole('tab', { name: 'Notes', exact: true });
  await expect.element(notes).toHaveFocus();
  await expect.element(notes).toHaveAttribute('aria-selected', 'true');
  const indicator = container.querySelector('.tumaet-ui-tab-indicator');
  if (!indicator) throw new Error('Missing tab indicator');
  await expect
    .poll(() => indicator.getBoundingClientRect().width)
    .toBeCloseTo(notes.element().getBoundingClientRect().width, 0);
  await expect
    .poll(() => indicator.getBoundingClientRect().left)
    .toBeCloseTo(notes.element().getBoundingClientRect().left, 0);
  expect(getComputedStyle(notes.element()).outlineWidth).toBe('2px');
  unmount();
  const vertical = render(
    <Tabs orientation="vertical" defaultValue="a">
      <TabList aria-label="Vertical" activateOnFocus>
        <Tab value="a">A</Tab>
        <Tab value="b">B</Tab>
        <TabIndicator />
      </TabList>
      <TabPanel value="a">A panel</TabPanel>
      <TabPanel value="b">B panel</TabPanel>
    </Tabs>,
  );
  await page.getByRole('tab', { name: 'A', exact: true }).click();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(page.getByRole('tab', { name: 'B', exact: true })).toHaveAttribute('aria-selected', 'true');
  const first = page.getByRole('tab', { name: 'A', exact: true }).element().getBoundingClientRect();
  const second = page.getByRole('tab', { name: 'B', exact: true }).element().getBoundingClientRect();
  expect(second.top).toBeGreaterThan(first.top);
  const verticalIndicator = vertical.container.querySelector('.tumaet-ui-tab-indicator');
  if (!verticalIndicator) throw new Error('Missing vertical indicator');
  await expect.poll(() => verticalIndicator.getBoundingClientRect().height).toBeCloseTo(second.height, 0);
  await expect.poll(() => verticalIndicator.getBoundingClientRect().top).toBeCloseTo(second.top, 0);
  vertical.unmount();
});

test('InputNumber labels, locale input, bounds and cancellation reach the documented parts', async () => {
  const input = createRef<HTMLInputElement>();
  const change = vi.fn();
  const commit = vi.fn();
  function NumberExample() {
    const [value, setValue] = useState<number | null>(null);
    return (
      <FormField label="Weight" hint="Kilograms">
        {(control) => (
          <InputNumber
            {...control}
            ref={input}
            value={value}
            onValueChange={(next, details) => {
              change(next, details.reason);
              if (next === 2000) details.cancel();
              else setValue(next);
            }}
            onValueCommitted={(next, details) => {
              commit(next, details.reason);
            }}
            locale="de-DE"
            format={{ maximumFractionDigits: 1 }}
            min={0}
            max={2000}
            step={0.5}
            prefix="about"
            suffix="kg"
            showButtons
          />
        )}
      </FormField>
    );
  }
  const { unmount } = render(<NumberExample />);
  const field = page.getByRole('textbox', { name: 'Weight' });
  await page.getByText('Weight', { exact: true }).click();
  await expect.element(field).toHaveFocus();
  expect(input.current).toBe(field.element());
  expect(input.current).toHaveAccessibleDescription('Kilograms');
  const suffix = page.getByText('kg', { exact: true }).element();
  const suffixText = document.createRange();
  suffixText.selectNodeContents(suffix);
  expect(suffixText.getBoundingClientRect().right).toBeLessThanOrEqual(
    page.getByRole('button', { name: 'Increase value' }).element().getBoundingClientRect().left,
  );

  await field.fill('1.234,5');
  await userEvent.tab();
  await expect.element(field).toHaveValue('1.234,5');
  expect(change).toHaveBeenLastCalledWith(1234.5, 'input-change');
  await field.click();
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(field).toHaveValue('1.235');
  await userEvent.keyboard('{End}');
  await expect.element(field).toHaveValue('1.235');
  expect(change).toHaveBeenLastCalledWith(2000, 'keyboard');
  expect(commit).toHaveBeenLastCalledWith(1235, 'keyboard');
  await field.clear();
  expect(change).toHaveBeenLastCalledWith(null, 'input-clear');
  unmount();
  expect(input.current).toBeNull();
});

test('InputNumber pointer hold repeats upstream steps and stops on release', async () => {
  function NumberExample() {
    const [value, setValue] = useState<number | null>(0);
    return <InputNumber aria-label="Count" value={value} onValueChange={setValue} min={0} max={10} showButtons />;
  }
  const { unmount } = render(<NumberExample />);
  await page.getByRole('button', { name: 'Increase value' }).click({ delay: 1000 });
  const input = page.getByRole('textbox', { name: 'Count' });
  expect(Number((input.element() as HTMLInputElement).value)).toBeGreaterThan(1);
  const held = (input.element() as HTMLInputElement).value;
  await page.getByRole('button', { name: 'Decrease value' }).click();
  await expect.element(input).toHaveValue(String(Number(held) - 1));
  unmount();
});

function LateOwner({ onReset }: { onReset: (event: SyntheticEvent<HTMLFormElement>) => void }) {
  const [mounted, setMounted] = useState(false);
  const [cancel, setCancel] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setMounted(true)}>
        Mount form
      </button>
      {mounted ? (
        <form
          id="late-number"
          onReset={(event) => {
            if (cancel) event.preventDefault();
            else onReset(event);
          }}
        >
          <button type="reset">Reset number</button>
          <button type="button" onClick={() => setCancel(false)}>
            Allow reset
          </button>
        </form>
      ) : null}
    </>
  );
}

test('InputNumber native serialization and validity follow late form ownership and caller reset policy', async () => {
  function Associated() {
    const [value, setValue] = useState<number | null>(null);
    return (
      <>
        <InputNumber
          aria-label="External amount"
          form="late-number"
          name="amount"
          value={value}
          onValueChange={setValue}
          required
          min={0}
          max={10}
          step={2}
          allowOutOfRange
        />
        <InputNumber aria-label="Disabled amount" form="late-number" name="disabled" value={2} disabled />
        <InputNumber aria-label="Readonly amount" form="late-number" name="readonly" value={4} readOnly />
        <LateOwner onReset={() => setValue(2)} />
      </>
    );
  }
  const { container, unmount } = render(<Associated />);
  await page.getByRole('button', { name: 'Mount form' }).click();
  const form = container.querySelector('form');
  if (!form) throw new Error('Missing late form');
  expect(form.checkValidity()).toBe(false);
  const input = page.getByRole('textbox', { name: 'External amount' });
  await input.fill('11');
  expect(form.checkValidity()).toBe(false);
  await input.fill('3');
  expect(form.checkValidity()).toBe(false);
  await input.fill('6');
  expect(form.checkValidity()).toBe(true);
  expect(Object.fromEntries(new FormData(form))).toEqual({ amount: '6', readonly: '4' });
  await page.getByRole('button', { name: 'Reset number' }).click();
  await expect.element(input).toHaveValue('6');
  expect(Object.fromEntries(new FormData(form))).toEqual({ amount: '6', readonly: '4' });
  await page.getByRole('button', { name: 'Allow reset' }).click();
  await page.getByRole('button', { name: 'Reset number' }).click();
  await expect.element(input).toHaveValue('2');
  expect(Object.fromEntries(new FormData(form))).toEqual({ amount: '2', readonly: '4' });
  unmount();
});

test('Panel controls keep header actions independent and collapse content out of keyboard navigation', async () => {
  const edit = vi.fn();
  const { unmount } = render(
    <Panel defaultOpen>
      <PanelHeader>
        <PanelTitle id="panel-title">Exercise</PanelTitle>
        <button type="button" onClick={edit}>
          Edit exercise
        </button>
        <PanelTrigger />
      </PanelHeader>
      <PanelContent keepMounted role="region" aria-labelledby="panel-title">
        <input aria-label="Panel draft" defaultValue="saved" />
      </PanelContent>
      <button type="button">After panel</button>
    </Panel>,
  );
  await page.getByRole('button', { name: 'Edit exercise' }).click();
  expect(edit).toHaveBeenCalledOnce();
  const collapse = page.getByRole('button', { name: 'Collapse', exact: true });
  const region = page.getByRole('region', { name: 'Exercise' }).element();
  expect(collapse.element()).toHaveAttribute('aria-controls', region.id);
  await collapse.click();
  await expect.poll(() => getComputedStyle(region).display).toBe('none');
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'After panel' })).toHaveFocus();
  await page.getByRole('button', { name: 'Expand', exact: true }).click();
  await expect.element(page.getByRole('textbox', { name: 'Panel draft' })).toHaveValue('saved');
  unmount();
});

test('SelectButton owns typed item selection through ToggleGroup with RTL focus and no form entries', async () => {
  const change = vi.fn();
  const { container, unmount } = render(
    <DirectionProvider direction="rtl">
      <form dir="rtl">
        <SelectButton
          aria-label="Tools"
          multiple
          defaultValue={['bold']}
          onValueChange={change}
          items={[
            { value: 'bold', label: 'Bold' },
            { value: 'italic', label: 'Italic', props: { disabled: true } },
            { value: 'underline', label: 'Underline' },
          ]}
        />
      </form>
    </DirectionProvider>,
  );
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  const underline = page.getByRole('button', { name: 'Underline', exact: true });
  await bold.click();
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(underline).toHaveFocus();
  await userEvent.keyboard(' ');
  await expect.element(underline).toHaveAttribute('aria-pressed', 'true');
  expect(change).toHaveBeenLastCalledWith(['underline'], expect.objectContaining({ reason: 'none' }));
  await userEvent.keyboard('{Home}{Enter}');
  await expect.element(bold).toHaveAttribute('aria-pressed', 'true');
  expect(Object.fromEntries(new FormData(requireForm(container)))).toEqual({});
  unmount();
  const vertical = render(
    <SelectButton
      aria-label="Vertical tools"
      orientation="vertical"
      items={[
        { value: 'first', label: 'First tool' },
        { value: 'disabled', label: 'Unavailable tool', props: { disabled: true } },
        { value: 'last', label: 'Last tool' },
      ]}
    />,
  );
  const first = page.getByRole('button', { name: 'First tool' });
  const last = page.getByRole('button', { name: 'Last tool' });
  await first.click();
  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(last).toHaveFocus();
  await expect.element(last).toHaveAttribute('aria-pressed', 'true');
  await expect.element(first).toHaveAttribute('aria-pressed', 'false');
  expect(last.element().getBoundingClientRect().top).toBeGreaterThan(first.element().getBoundingClientRect().top);
  vertical.unmount();
});

test('native fieldset disability excludes widgets from focus, pointer activation and submission', async () => {
  const change = vi.fn();
  const pointer = vi.fn();
  function Example() {
    const [value, setValue] = useState<number | null>(2);
    const [disabled, setDisabled] = useState(true);
    return (
      <form>
        <button type="button">Before widgets</button>
        <fieldset disabled={disabled}>
          <Tabs defaultValue="a">
            <TabList aria-label="Disabled tabs">
              <Tab value="a">A</Tab>
              <Tab value="b">B</Tab>
            </TabList>
          </Tabs>
          <InputNumber
            aria-label="Disabled count"
            name="count"
            value={value}
            showButtons
            onValueChange={(next, details) => {
              change(next, details.reason);
              setValue(next);
            }}
            rootProps={{
              onPointerDown: (event) => {
                pointer(event.nativeEvent.isTrusted);
              },
            }}
          />
          <Panel defaultOpen>
            <PanelTrigger>Details</PanelTrigger>
            <PanelContent>Content</PanelContent>
          </Panel>
          <SelectButton aria-label="Disabled tools" items={[{ value: 'a', label: 'Tool A' }]} />
        </fieldset>
        <button type="button" onClick={() => setDisabled(false)}>
          Enable widgets
        </button>
      </form>
    );
  }
  const { container, unmount } = render(<Example />);
  await page.getByRole('button', { name: 'Before widgets' }).click();
  await userEvent.tab();
  await expect.element(page.getByRole('button', { name: 'Enable widgets' })).toHaveFocus();
  for (const control of container.querySelectorAll<HTMLElement>('fieldset button, fieldset input')) {
    expect(control).toBeDisabled();
    control.focus();
    expect(control).not.toHaveFocus();
  }
  // Force bypasses Playwright's actionability check; pointer events remain native and trusted.
  await page.getByRole('button', { name: 'Increase value' }).click({ force: true });
  await page.getByRole('button', { name: 'Decrease value' }).click({ force: true });
  expect(pointer).toHaveBeenCalledWith(true);
  expect(change).not.toHaveBeenCalled();
  expect([...new FormData(requireForm(container))]).toEqual([]);
  await page.getByRole('button', { name: 'Enable widgets' }).click();
  expect(Object.fromEntries(new FormData(requireForm(container)))).toEqual({ count: '2' });
  await page.getByRole('button', { name: 'Increase value' }).click();
  expect(change).toHaveBeenCalledOnce();
  expect(Object.fromEntries(new FormData(requireForm(container)))).toEqual({ count: '3' });
  unmount();
});

test('Panel trigger native types preserve reset and submit with icons or text', async () => {
  for (const children of [undefined, 'Toggle panel']) {
    const reset = vi.fn();
    const submit = vi.fn((event: SyntheticEvent<HTMLFormElement>) => event.preventDefault());
    const { unmount } = render(
      <form onReset={reset} onSubmit={submit}>
        <input aria-label="Draft" defaultValue="saved" />
        <Panel>
          <PanelTrigger aria-label="Default trigger">{children}</PanelTrigger>
          <PanelTrigger type="reset" aria-label="Reset panel">
            {children}
          </PanelTrigger>
          <PanelTrigger type="submit" aria-label="Submit panel">
            {children}
          </PanelTrigger>
        </Panel>
      </form>,
    );
    const input = page.getByRole('textbox', { name: 'Draft' });
    await input.fill('changed');
    await page.getByRole('button', { name: 'Default trigger' }).click();
    expect(submit).not.toHaveBeenCalled();
    await expect.element(input).toHaveValue('changed');
    await page.getByRole('button', { name: 'Reset panel' }).click();
    expect(reset).toHaveBeenCalledOnce();
    await expect.element(input).toHaveValue('saved');
    await page.getByRole('button', { name: 'Submit panel' }).click();
    expect(submit).toHaveBeenCalledOnce();
    unmount();
  }
});
