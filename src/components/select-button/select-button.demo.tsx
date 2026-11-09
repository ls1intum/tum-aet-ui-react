import { SelectButton } from './select-button';
const items = [
  { value: 'list', label: 'List' },
  { value: 'grid', label: 'Grid' },
  { value: 'table', label: 'Table' },
] as const;
export default function SelectButtonDemo() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SelectButton aria-label="View" items={items} defaultValue={['list']} />
      <SelectButton aria-label="Views" items={items} multiple defaultValue={['list', 'grid']} size="small" />
      <SelectButton aria-label="Disabled" items={items} disabled size="large" />
    </div>
  );
}
