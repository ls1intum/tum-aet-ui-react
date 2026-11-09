import { useId, useState } from 'react';
import { Checkbox } from '../checkbox/checkbox';
import { Input, Textarea } from '../input/input';
import { InputNumber } from '../input-number/input-number';
import { Field, FieldDescription, FieldLabel, FormField } from './form-field';

export default function FormFieldDemo() {
  const base = useId();
  const [login, setLogin] = useState('');
  const [points, setPoints] = useState<number | null>(null);
  const invalid = login.length > 0 && login.length < 3;
  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <FormField label="Login" required hint="At least 3 characters" invalid={invalid} error="Too short">
        {(control) => <Input {...control} value={login} onChange={(e) => setLogin(e.target.value)} required />}
      </FormField>
      <Field>
        <FieldLabel htmlFor={`${base}-summary`}>Summary</FieldLabel>
        <Textarea id={`${base}-summary`} aria-describedby={`${base}-summary-hint`} required rows={3} />
        <FieldDescription id={`${base}-summary-hint`}>Visible to students.</FieldDescription>
      </Field>
      <FormField label="Points" hint="Between 0 and 100">
        {(control) => <InputNumber {...control} value={points} onValueChange={setPoints} min={0} max={100} />}
      </FormField>
      <Field>
        <span className="tumaet-ui-form-field-label" id={`${base}-terms-label`}>
          Accept terms
        </span>
        <Checkbox aria-labelledby={`${base}-terms-label`} />
      </Field>
    </div>
  );
}
