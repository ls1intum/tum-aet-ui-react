import { RadioButton, RadioGroup } from './radio-button';

export default function RadioButtonDemo() {
  return (
    <RadioGroup name="demo-size" aria-label="Size" defaultValue="m">
      {['s', 'm', 'l'].map((v) => (
        <label
          key={v}
          id={`radio-demo-${v}-label`}
          htmlFor={`radio-demo-${v}`}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <RadioButton id={`radio-demo-${v}`} aria-labelledby={`radio-demo-${v}-label`} value={v} /> Size{' '}
          {v.toUpperCase()}
        </label>
      ))}
      <label id="radio-demo-xl-label" htmlFor="radio-demo-xl" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <RadioButton id="radio-demo-xl" aria-labelledby="radio-demo-xl-label" value="xl" disabled /> Disabled
      </label>
    </RadioGroup>
  );
}
