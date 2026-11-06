import { useId, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { Select, SelectTrigger, SelectValue, SelectPortal, SelectPositioner, SelectPopup, SelectList } from './select';
import { Field, FieldLabel, FieldDescription } from '../form-field';

const languages = ['English', 'German', 'Spanish'].map((value) => ({ key: value, value, label: value }));
function Example(props: React.ComponentProps<typeof Select<string>>) {
  const id = useId();
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        Course language
      </FieldLabel>
      <Select {...props}>
        <SelectTrigger id={id} aria-labelledby={`${id}-label`} aria-describedby={`${id}-description`}>
          <SelectValue placeholder="Choose a language" />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>
      <FieldDescription id={`${id}-description`}>Choose the language used in the course.</FieldDescription>
    </Field>
  );
}
const meta = {
  title: 'Forms/Select',
  component: Select<string>,
  args: { items: languages, value: null },
  render: function Render(args) {
    const [{ value }, updateArgs] = useArgs<React.ComponentProps<typeof Select<string>>>();
    return (
      <Example
        {...args}
        value={value}
        onValueChange={(next, details) => {
          args.onValueChange?.(next, details);
          if (!details.isCanceled) updateArgs({ value: next });
        }}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Typed root-owned items are rendered by SelectList. Single selection uses null for empty; multiple selection uses []. Selection is controlled: provide value and update it in onValueChange. Changes can be canceled using details.cancel(). Object values support isItemEqualToValue, itemToStringLabel (display/typeahead) and itemToStringValue (submission); serialized values must be unique and nonempty. Field is presentation: connect native labels and descriptions using explicit IDs, and supply aria-invalid on the trigger when validation fails. Native required participates in form validity. Each item needs a unique stable key, independent of equality, display and serialized submission values. Native form reset leaves the controlled selection unchanged. To reset it, update caller state in the form onReset handler; use React DOM flushSync there when subsequent synchronous FormData must observe that update. Respect event.defaultPrevented before applying that policy. Use Autocomplete for searchable suggestions. Arbitrary SelectItem or SelectValue render-function descendants are independently typed; their types cannot be inferred from the root.',
      },
    },
  },
} satisfies Meta<typeof Select<string>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: 'Course language' });
    await userEvent.click(trigger);
    await userEvent.click(await screen.findByRole('option', { name: 'German' }));
    await expect(trigger).toHaveTextContent('German');
  },
};
export const Empty: Story = { args: { items: [] } };
export const Disabled: Story = { args: { disabled: true } };
export const WithValue: Story = { args: { value: 'German' } };
export const Multiple: Story = {
  render: function MultipleExample() {
    const id = useId();
    const [value, setValue] = useState<string[]>([]);
    return (
      <Field>
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          Languages
        </FieldLabel>
        <Select multiple items={languages} value={value} onValueChange={setValue} name="languages">
          <SelectTrigger id={id} aria-labelledby={`${id}-label`}>
            <SelectValue placeholder="Choose languages" />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
      </Field>
    );
  },
};
export const ObjectValues: Story = {
  render: function ObjectExample() {
    const id = useId();
    const [value, setValue] = useState<{ code: string; name: string } | null>({ code: 'de', name: 'German' });
    const items = [
      { key: 'en', value: { code: 'en', name: 'English' }, label: 'English' },
      { key: 'de', value: { code: 'de', name: 'German' }, label: 'German' },
    ];
    return (
      <Field>
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          Language object
        </FieldLabel>
        <Select
          items={items}
          value={value}
          onValueChange={setValue}
          isItemEqualToValue={(a, b) => a.code === b.code}
          itemToStringLabel={(item) => item.name}
          itemToStringValue={(item) => item.code}
          name="language"
        >
          <SelectTrigger id={id} aria-labelledby={`${id}-label`}>
            <SelectValue />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
      </Field>
    );
  },
};
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8 }}>
      {(['small', 'default', 'large'] as const).map((size) => (
        <SizeExample key={size} size={size} />
      ))}
    </div>
  ),
};

function SizeExample({ size }: { size: 'small' | 'default' | 'large' }) {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Select items={languages} value={value} onValueChange={setValue}>
      <SelectTrigger size={size} aria-label={`${size} select`}>
        <SelectValue placeholder={size} />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectList />
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </Select>
  );
}
