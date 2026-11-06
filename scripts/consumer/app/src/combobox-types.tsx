import { createRef } from 'react';
import {
  Combobox,
  ComboboxInput,
  ComboboxInputGroup,
  ComboboxTrigger,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxList,
  ComboboxChips,
  ComboboxChipRemove,
  ComboboxClear,
  ComboboxValue,
  type ComboboxOption,
} from '@tumaet/ui-react';

type Course = { id: number; title: string };
const items: ComboboxOption<Course>[] = [{ key: 1, value: { id: 1, title: 'One' }, label: 'One' }];
export function TypedComboboxes() {
  const input = createRef<HTMLInputElement>();
  const trigger = createRef<HTMLButtonElement>();
  const popup = createRef<HTMLDivElement>();
  const single = (
    <Combobox
      items={items}
      value={null}
      onValueChange={(value, details) => {
        const course: Course | null = value;
        // @ts-expect-error Item callbacks must not leak any.
        const wrong: string = value;
        void course;
        void wrong;
        details.cancel();
      }}
      isItemEqualToValue={(item, value) => item.id === value.id}
      itemToStringLabel={(item) => item.title}
      itemToStringValue={(item) => String(item.id)}
      filter={(item, query) => item.title.includes(query)}
      onItemHighlighted={(item) => {
        const course: Course | undefined = item;
        void course;
      }}
      renderItem={(item) => item.value.title}
    >
      <ComboboxInputGroup size="small">
        <ComboboxInput ref={input} aria-label="Course" />
        <ComboboxTrigger ref={trigger} />
        <ComboboxClear />
      </ComboboxInputGroup>
      <ComboboxPortal container={document.body}>
        <ComboboxPositioner>
          <ComboboxPopup ref={popup}>
            <ComboboxList />
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
      <ComboboxValue placeholder="None" />
    </Combobox>
  );
  const multiple = (
    <Combobox
      multiple
      items={items}
      value={[]}
      filteredItems={[items[0].value]}
      filter={null}
      inputValue="query"
      onInputValueChange={(query, details) => {
        const text: string = query;
        void text;
        details.cancel();
      }}
      onValueChange={(value) => {
        const courses: Course[] = value;
        // @ts-expect-error Multiple callbacks cannot be null or any.
        const wrong: null = value;
        void courses;
        void wrong;
      }}
      renderChip={(item) => (
        <>
          {item.value.title}
          <ComboboxChipRemove aria-label={`Remove ${item.label}`} />
        </>
      )}
    >
      <ComboboxInputGroup>
        <ComboboxChips>
          <ComboboxInput aria-label="Courses" />
        </ComboboxChips>
      </ComboboxInputGroup>
    </Combobox>
  );
  // @ts-expect-error Selection requires caller-owned value.
  const missingValue = <Combobox items={items} />;
  // @ts-expect-error No uncontrolled selection/reset adapter.
  const legacyDefault = <Combobox items={items} value={null} defaultValue={items[0].value} />;
  // @ts-expect-error Single mode accepts null, not an empty array.
  const singleArray = <Combobox items={items} value={[]} />;
  // @ts-expect-error Multiple mode accepts [], not null.
  const multipleNull = <Combobox multiple items={items} value={null} />;
  // @ts-expect-error Values are inferred from items, not other props.
  const wrongValue = <Combobox items={items} value="one" />;
  // @ts-expect-error Items require stable keys.
  const missingKey = <Combobox items={[{ value: 1, label: 'One' }]} value={null} />;
  // @ts-expect-error Filtered results must use the collection's value type.
  const wrongResults = <Combobox items={items} filteredItems={['one']} value={null} />;
  const wrongCallback = (
    <Combobox
      items={items}
      value={null}
      // @ts-expect-error The callback cannot widen the item type.
      onValueChange={(_value: string | null) => {}}
    />
  );
  const wrongItem = (
    <Combobox
      items={items}
      value={null}
      // @ts-expect-error Rendered item values retain their types.
      renderItem={(item) => item.value.missing}
    />
  );
  // @ts-expect-error Value children are display nodes; typed custom callbacks live on the root.
  const untypedDescendant = <ComboboxValue>{(value) => value.title}</ComboboxValue>;
  // @ts-expect-error Input refs target native inputs.
  const wrongRef = <ComboboxInput ref={trigger} />;
  return (
    <>
      {[
        single,
        multiple,
        missingValue,
        legacyDefault,
        singleArray,
        multipleNull,
        wrongValue,
        missingKey,
        wrongResults,
        wrongCallback,
        wrongItem,
        untypedDescendant,
        wrongRef,
      ]}
    </>
  );
}
