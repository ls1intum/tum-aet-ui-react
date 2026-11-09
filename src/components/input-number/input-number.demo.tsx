import { useState } from 'react';
import { InputNumber } from './input-number';
export default function InputNumberDemo() {
  const [value, setValue] = useState<number | null>(12.5);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <InputNumber
        aria-label="Price"
        value={value}
        onValueChange={setValue}
        showButtons
        min={0}
        max={100}
        step={0.25}
        format={{ style: 'currency', currency: 'EUR' }}
      />
      <InputNumber aria-label="Weight" value={value} onValueChange={setValue} locale="de-DE" suffix="kg" />
      <InputNumber aria-label="Invalid" value={value} invalid />
      <InputNumber aria-label="Disabled" value={value} disabled />
    </div>
  );
}
