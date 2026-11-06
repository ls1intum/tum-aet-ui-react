import '@tumaet/ui-react/styles.css';
import { renderToString } from 'react-dom/server';
import { Button, Card, FormField, Input, Tag } from '@tumaet/ui-react';

export function render(): string {
  return renderToString(
    <Card>
      <FormField label="Name">{(control) => <Input {...control} />}</FormField>
      <Tag>Active</Tag>
      <Button variant="solid">Save</Button>
    </Card>,
  );
}
