import { useState } from 'react';
import { Checkbox } from './checkbox';

export default function CheckboxDemo() {
  const [items, setItems] = useState([
    { id: 'a', checked: true },
    { id: 'b', checked: false },
    { id: 'c', checked: false },
  ]);
  const all = items.every((item) => item.checked);
  const some = items.some((item) => item.checked);
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label
        id="checkbox-demo-all-label"
        htmlFor="checkbox-demo-all"
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <Checkbox
          id="checkbox-demo-all"
          aria-labelledby="checkbox-demo-all-label"
          checked={all}
          indeterminate={some ? !all : false}
          onChange={(event) => setItems(items.map((item) => ({ ...item, checked: event.currentTarget.checked })))}
        />{' '}
        All
      </label>
      {items.map(({ id, checked }, i) => (
        <label
          key={id}
          id={`checkbox-demo-${id}-label`}
          htmlFor={`checkbox-demo-${id}`}
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginInlineStart: 24 }}
        >
          <Checkbox
            id={`checkbox-demo-${id}`}
            aria-labelledby={`checkbox-demo-${id}-label`}
            checked={checked}
            onChange={(event) =>
              setItems(items.map((item, j) => (j === i ? { ...item, checked: event.currentTarget.checked } : item)))
            }
          />{' '}
          Item {i + 1}
        </label>
      ))}
      <label
        id="checkbox-demo-disabled-label"
        htmlFor="checkbox-demo-disabled"
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <Checkbox id="checkbox-demo-disabled" aria-labelledby="checkbox-demo-disabled-label" disabled /> Disabled
      </label>
      <label
        id="checkbox-demo-disabled-checked-label"
        htmlFor="checkbox-demo-disabled-checked"
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <Checkbox
          id="checkbox-demo-disabled-checked"
          aria-labelledby="checkbox-demo-disabled-checked-label"
          disabled
          defaultChecked
        />{' '}
        Disabled checked
      </label>
      <label
        id="checkbox-demo-invalid-label"
        htmlFor="checkbox-demo-invalid"
        style={{ display: 'flex', gap: 8, alignItems: 'center' }}
      >
        <Checkbox id="checkbox-demo-invalid" aria-labelledby="checkbox-demo-invalid-label" aria-invalid /> Invalid
      </label>
    </div>
  );
}
