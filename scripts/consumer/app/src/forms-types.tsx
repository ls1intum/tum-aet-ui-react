import { createRef } from 'react';
import { Field, FieldLabel, FormField, Input, Textarea } from '@tumaet/ui-react';

export function NativeFields() {
  const input = createRef<HTMLInputElement>();
  const textarea = createRef<HTMLTextAreaElement>();
  const label = createRef<HTMLLabelElement>();
  // @ts-expect-error Validation metadata is not part of the native Field contract.
  const validation = <Field validationMode="onChange" />;
  // @ts-expect-error FormField requires its associations to be applied explicitly.
  const implicit = <FormField label="Title" children={<Input />} />;
  return (
    <>
      <FieldLabel ref={label} htmlFor="summary">
        Summary
      </FieldLabel>
      <Textarea id="summary" ref={textarea} />
      <FormField label="Title">
        {(control) => (
          <Input
            {...control}
            ref={input}
            onChange={(event) => {
              const element: HTMLInputElement = event.currentTarget;
              void element;
            }}
          />
        )}
      </FormField>
      {validation}
      {implicit}
    </>
  );
}
