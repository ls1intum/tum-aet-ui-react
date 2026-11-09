import { useId, useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectPortal, SelectPositioner, SelectPopup, SelectList } from './select';
import { Field, FieldLabel, FieldDescription } from '../form-field';

export default function SelectDemo() {
  const id = useId();
  const [value, setValue] = useState<string | null>(null);
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        Language
      </FieldLabel>
      <Select
        items={['English', 'German', 'Spanish'].map((language) => ({
          key: language,
          value: language,
          label: language,
        }))}
        value={value}
        onValueChange={setValue}
      >
        <SelectTrigger id={id} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`}>
          <SelectValue placeholder="Choose a language" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList aria-labelledby={`${id}-label`} />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>
      <FieldDescription id={`${id}-description`}>Selected: {value ?? 'none'}</FieldDescription>
    </Field>
  );
}
