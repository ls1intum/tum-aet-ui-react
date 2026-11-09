import { useEffect, useId, useState } from 'react';
import {
  Combobox,
  ComboboxInputGroup,
  ComboboxInput,
  ComboboxTrigger,
  ComboboxClear,
  ComboboxPortal,
  ComboboxPositioner,
  ComboboxPopup,
  ComboboxList,
  ComboboxChips,
  type ComboboxOption,
} from './combobox';

export const languages = ['English', 'German', 'Spanish'].map((value) => ({ key: value, value, label: value }));
export function ComboboxDemoParts({
  multiple = false,
  label = 'Course language',
}: {
  multiple?: boolean;
  label?: string;
}) {
  const id = useId();
  const controls = (
    <>
      <ComboboxInput id={id} placeholder="Choose a language" />
      <ComboboxClear />
      <ComboboxTrigger />
    </>
  );
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <ComboboxInputGroup>{multiple ? <ComboboxChips>{controls}</ComboboxChips> : controls}</ComboboxInputGroup>
      <ComboboxPortal>
        <ComboboxPositioner>
          <ComboboxPopup>
            <ComboboxList />
          </ComboboxPopup>
        </ComboboxPositioner>
      </ComboboxPortal>
    </>
  );
}
export default function ComboboxDemo() {
  const [value, setValue] = useState<string | null>(null);
  return (
    <Combobox items={languages} value={value} onValueChange={setValue}>
      <ComboboxDemoParts />
    </Combobox>
  );
}

/** Supply a real request function; aborted/stale responses cannot overwrite a newer query. */
export function AsyncComboboxExample({
  search,
}: {
  search: (query: string, signal: AbortSignal) => Promise<ReadonlyArray<ComboboxOption<string>>>;
}) {
  const [query, setQuery] = useState('');
  const [value, setValue] = useState<string | null>(null);
  const [results, setResults] = useState<ReadonlyArray<ComboboxOption<string>>>([]);
  const [selectedItem, setSelectedItem] = useState<ComboboxOption<string> | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void search(query, controller.signal).then(
      (next) => {
        if (!controller.signal.aborted) {
          setResults(next);
          setError(false);
        }
      },
      () => {
        if (!controller.signal.aborted) setError(true);
      },
    );
    return () => controller.abort();
  }, [query, search]);
  const items =
    selectedItem && !results.some((item) => item.value === selectedItem.value) ? [...results, selectedItem] : results;
  return (
    <>
      <Combobox
        items={items}
        filteredItems={results.map((item) => item.value)}
        filter={null}
        inputValue={query}
        onInputValueChange={setQuery}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setSelectedItem(items.find((item) => item.value === next) ?? null);
        }}
      >
        <ComboboxDemoParts label="Async language" />
      </Combobox>
      {error ? <p role="status">Unable to load languages.</p> : null}
    </>
  );
}
