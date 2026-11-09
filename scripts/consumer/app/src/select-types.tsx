import { Select } from '@tumaet/ui-react';

type Course = { id: number; title: string };
const items = [{ key: 1, value: { id: 1, title: 'One' }, label: 'One' }];

export function TypedSelects() {
  const single = (
    <Select
      items={items}
      value={null}
      onValueChange={(value, details) => {
        const course: Course | null = value;
        // @ts-expect-error Inferred callback values are not arbitrary strings or any.
        const wrong: string = value;
        void course;
        void wrong;
        details.cancel();
      }}
      itemToStringLabel={(item) => item.title}
      itemToStringValue={(item) => String(item.id)}
      renderItem={(item) => item.value.title}
    />
  );
  const multiple = (
    <Select
      multiple
      items={items}
      value={[]}
      onValueChange={(value) => {
        const courses: Course[] = value;
        // @ts-expect-error Multiple callback values are arrays, not null or any.
        const wrong: null = value;
        void courses;
        void wrong;
      }}
    />
  );
  // @ts-expect-error Values must come from the typed items.
  const wrongValue = <Select items={items} value="one" />;
  // @ts-expect-error Multiple empties are [], never null.
  const wrongEmpty = <Select multiple items={items} value={null} />;
  // @ts-expect-error Single selection cannot receive an array.
  const wrongSingle = <Select items={items} value={[items[0].value]} />;
  // @ts-expect-error Every item needs stable identity, including primitive items.
  const missingKey = <Select value={null} items={[{ value: 'one', label: 'One' }]} />;
  const wrongCallback = (
    <Select
      items={items}
      value={null}
      // @ts-expect-error Callback values cannot introduce a different item type.
      onValueChange={(_value: string | null) => {}}
    />
  );
  // @ts-expect-error Selection is controlled; there is no implicit uncontrolled contract.
  const missingValue = <Select items={items} />;
  // @ts-expect-error Initial selection and reset belong to the caller.
  const legacyDefault = <Select items={items} value={null} defaultValue={items[0].value} />;
  return (
    <>
      {[missingValue, legacyDefault, single, multiple, wrongValue, wrongEmpty, wrongSingle, missingKey, wrongCallback]}
    </>
  );
}
