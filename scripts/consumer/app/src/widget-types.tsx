import { createRef, useState } from 'react';
import {
  Tabs,
  Tab,
  TabList,
  TabIndicator,
  TabPanels,
  TabPanel,
  InputNumber,
  SearchField,
  FormField,
  Panel,
  PanelHeader,
  PanelTitle,
  PanelTrigger,
  PanelContent,
  SelectButton,
  type TabValue,
  type TabsProps,
  type InputNumberProps,
  type SelectButtonProps,
} from '@tumaet/ui-react';

export function ControlledSearchContract() {
  const [query, setQuery] = useState('');
  const ref = createRef<HTMLInputElement>();
  // @ts-expect-error Search terms have a required caller-owned value.
  const uncontrolled = <SearchField defaultValue="Old" />;
  // @ts-expect-error The old string onChange channel is removed.
  const oldCallback = <SearchField value={query} onChange={setQuery} />;
  void uncontrolled;
  void oldCallback;
  return <SearchField value={query} onValueChange={setQuery} ref={ref} name="query" readOnly />;
}

const items = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
] as const;
type View = (typeof items)[number]['value'];

export function WidgetTypes() {
  const [tab, setTab] = useState<TabValue | null>('first');
  const [value, setValue] = useState<number | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const input = createRef<HTMLInputElement>();
  const root = createRef<HTMLDivElement>();
  const button = createRef<HTMLButtonElement>();
  const indicator = createRef<HTMLSpanElement>();
  const onTabChange: NonNullable<TabsProps['onValueChange']> = (next, details) => {
    const concrete: string | number | null = next;
    if (details.reason === 'none') details.cancel();
    setTab(concrete);
  };
  const onNumberChange: NonNullable<InputNumberProps['onValueChange']> = (next, details) => {
    const numeric: number | null = next;
    if (details.reason === 'keyboard') details.cancel();
    setValue(numeric);
  };
  const onViewsChange: NonNullable<SelectButtonProps<View>['onValueChange']> = (next, details) => {
    const selected: View[] = next;
    details.cancel();
    setViews(selected);
  };
  // @ts-expect-error Root-owned items determine the permitted state; state cannot widen them.
  const invalidSelection = <SelectButton items={items} value={['missing']} />;
  // @ts-expect-error Defaults cannot widen the items either.
  const invalidDefault = <SelectButton items={items} defaultValue={['missing']} />;
  // @ts-expect-error Toggle values are strings.
  const invalidItem = <SelectButton items={[{ value: 1, label: 'One' }]} />;
  // @ts-expect-error A callback must accept exactly the inferred item values, not unrelated values.
  const invalidCallback = <SelectButton items={items} onValueChange={(next: Array<'other'>) => void next} />;
  // @ts-expect-error Legacy option property paths were removed.
  const legacyOptions = <SelectButton options={items} optionValue="value" />;
  // @ts-expect-error Non-form toggle groups do not serialize a name.
  const toggleName = <SelectButton items={items} name="view" />;
  // @ts-expect-error Number state is controlled; omitting value is unsupported.
  const uncontrolledNumber = <InputNumber defaultValue={2} />;
  // @ts-expect-error String values are not numeric state.
  const stringNumber = <InputNumber value="2" />;
  // @ts-expect-error Legacy value callbacks were replaced by onValueChange.
  const legacyNumberCallback = <InputNumber value={2} onChange={() => {}} />;
  // @ts-expect-error The public ref targets the input, not the wrapper.
  const invalidNumberRef = <InputNumber value={2} ref={root} />;
  // @ts-expect-error Tabs values are concretely string, number or null.
  const invalidTabRoot = <Tabs value={{ id: 'first' }} />;
  // @ts-expect-error JSX tab values are checked independently and must be string or number.
  const invalidTab = <Tab value={false} />;
  // @ts-expect-error Legacy collapsed aliases were replaced by upstream open state.
  const legacyPanel = <Panel collapsed onCollapsedChange={() => {}} />;
  return (
    <>
      <Tabs ref={root} value={tab} onValueChange={onTabChange}>
        <TabList activateOnFocus aria-label="Typed tabs">
          <Tab ref={button} value="first" onClick={(event) => event.preventBaseUIHandler()}>
            First
          </Tab>
          <Tab value={2}>Second</Tab>
          <TabIndicator ref={indicator} />
        </TabList>
        <TabPanels>
          <TabPanel value="first" keepMounted>
            First
          </TabPanel>
          <TabPanel value={2}>Second</TabPanel>
        </TabPanels>
      </Tabs>
      <FormField label="Amount" hint="Raw numeric value">
        {(control) => (
          <InputNumber
            {...control}
            value={value}
            onValueChange={onNumberChange}
            ref={input}
            name="amount"
            form="invoice"
            required
            format={{ maximumFractionDigits: 2 }}
            locale="de-DE"
            rootProps={{ ref: root, render: (props, state) => <div {...props} data-value={state.value} /> }}
            render={(props, state) => <input {...props} data-value={state.value} />}
            onFocus={(event) => {
              const target: HTMLInputElement = event.currentTarget;
              void target;
              event.preventBaseUIHandler();
            }}
          />
        )}
      </FormField>
      <Panel
        defaultOpen
        onOpenChange={(open, details) => {
          const next: boolean = open;
          if (next) details.cancel();
        }}
      >
        <PanelHeader>
          <PanelTitle>Details</PanelTitle>
          <PanelTrigger ref={button}>Toggle details</PanelTrigger>
        </PanelHeader>
        <PanelContent ref={root} keepMounted>
          Content
        </PanelContent>
      </Panel>
      <SelectButton items={items} value={views} onValueChange={onViewsChange} />
      <SelectButton
        items={[
          {
            value: 'typed',
            label: 'Typed',
            props: {
              ref: button,
              onPressedChange: (pressed, details) => {
                const selected: boolean = pressed;
                if (selected) details.cancel();
              },
              render: (props, state) => <button {...props} data-selected={state.pressed} />,
            },
          },
        ]}
        onValueChange={(next) => {
          const typed: 'typed'[] = next;
          void typed;
        }}
      />
      {invalidSelection}
      {invalidDefault}
      {invalidItem}
      {invalidCallback}
      {legacyOptions}
      {toggleName}
      {uncontrolledNumber}
      {stringNumber}
      {legacyNumberCallback}
      {invalidNumberRef}
      {invalidTabRoot}
      {invalidTab}
      {legacyPanel}
    </>
  );
}
