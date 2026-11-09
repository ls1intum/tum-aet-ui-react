import { FormField } from '../form-field/form-field';
import { Input, Textarea } from './input';

export default function InputDemo() {
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <Input aria-label="Small" size="small" placeholder="Small" />
      <Input aria-label="Default" placeholder="Default" />
      <Input aria-label="Large" size="large" placeholder="Large" />
      <Input aria-label="Invalid" invalid defaultValue="Invalid value" />
      <Input aria-label="Disabled" disabled defaultValue="Disabled" />
      <form>
        <FormField label="Notes" hint="Reset restores the initial value.">
          {(control) => <Textarea {...control} name="notes" rows={3} defaultValue="Initial notes" />}
        </FormField>
        <button type="reset">Reset notes</button>
      </form>
    </div>
  );
}
