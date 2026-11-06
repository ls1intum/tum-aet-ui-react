import { useState } from 'react';
import { SearchField } from './search-field';

export default function SearchFieldDemo() {
  const [term, setTerm] = useState('');
  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <SearchField value={term} onValueChange={setTerm} />
      <SearchField value={term} onValueChange={setTerm} size="small" placeholder="Small" />
      <SearchField value={term} onValueChange={setTerm} size="large" placeholder="Large" />
      <SearchField disabled value="Disabled" />
      <span>Term: {term}</span>
    </div>
  );
}
