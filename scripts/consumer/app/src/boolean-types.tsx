import { createRef, useState, type ChangeEvent } from 'react';
import { Checkbox, RadioButton, RadioGroup, ToggleSwitch, type RadioGroupProps } from '@tumaet/ui-react';

export function NarrowRadioValues() {
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | null>(null);
  const [checked, setChecked] = useState(false);
  const input = createRef<HTMLInputElement>();
  const group = createRef<HTMLFieldSetElement>();
  const onChange = (event: ChangeEvent<HTMLInputElement>) => setChecked(event.currentTarget.checked);
  return (
    <>
      <Checkbox ref={input} name="terms" checked={checked} onChange={onChange} />
      <ToggleSwitch ref={input} name="mail" defaultChecked onChange={onChange} />
      <RadioGroup
        name="frequency"
        ref={group}
        value={frequency}
        onValueChange={(value, event) => {
          setFrequency(value);
          const nativeInput: HTMLInputElement = event.currentTarget;
          nativeInput.checkValidity();
        }}
      >
        <RadioButton ref={input} value="daily" />
        <RadioButton value="weekly" />
      </RadioGroup>
    </>
  );
}

const narrow: RadioGroupProps<'daily' | 'weekly'> = {
  name: 'frequency',
  value: 'daily',
  onValueChange(value, event) {
    const selected: 'daily' | 'weekly' = value;
    const input: HTMLInputElement = event.currentTarget;
    console.log(selected, input.name);
  },
};
void narrow;

// @ts-expect-error Native radio groups require an explicit name.
const missingName: RadioGroupProps = { defaultValue: 'daily' };
void missingName;
// @ts-expect-error Unpublished Base UI callback surface is removed.
const removedCallback = <Checkbox onCheckedChange={() => {}} />;
void removedCallback;
// @ts-expect-error Refs expose inputs, not button roots.
const wrongRef = <ToggleSwitch ref={createRef<HTMLButtonElement>()} />;
void wrongRef;
