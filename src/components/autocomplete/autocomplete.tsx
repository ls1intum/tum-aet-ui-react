import {
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { Floating } from '../../internal/floating';
import { useTranslate } from '../../internal/i18n';
import { XIcon } from '../../internal/icons';
import { useControllable } from '../../internal/use-controllable';
import { Listbox, optionId, type ListboxItem } from '../select/listbox';
import { optionLabelOf, valuesMatch } from '../select/use-listbox';

export interface AutocompleteSearchEvent {
  query: string;
  originalEvent?: Event;
}

export interface AutocompleteOptionEvent {
  value: unknown;
  originalEvent?: Event;
}

export interface AutocompleteProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'placeholder'
> {
  /** Suggestions supplied in response to a search request. */
  suggestions?: readonly unknown[];
  /** Property used as the visible label of object values. */
  optionLabel?: string;
  /** Property marking suggestions that remain visible but cannot be selected. */
  optionDisabled?: string;
  /** Replaces the content of a suggestion row. Selection and accessibility stay with the control. */
  renderOption?: (option: unknown) => ReactNode;
  /** Chooses several values, shown as chips. The value is then an array. */
  multiple?: boolean;
  /**
   * Single mode: the selected suggestion, or the typed text while nothing was selected (`null` when empty).
   * Multiple mode: the array of selected suggestions.
   */
  value?: unknown;
  /** Initial value when the control is uncontrolled. */
  defaultValue?: unknown;
  /** Called with the new value: a suggestion or the typed text (single mode), or the array of suggestions (`multiple`). */
  onChange?: (value: unknown) => void;
  /** Placeholder of the text input; hidden once a chip is chosen. */
  placeholder?: string;
  /** Disables the input and removes the chips' remove buttons. */
  disabled?: boolean;
  /** Reports the field as required to assistive technology. */
  required?: boolean;
  /** Minimum query length before a search request is made. */
  minLength?: number;
  /** Delay between the latest input and a search request. */
  debounceMs?: number;
  /** Requests suggestions when the empty input receives focus. */
  completeOnFocus?: boolean;
  /** Called to request suggestions for the current query. */
  onSearch?: (event: AutocompleteSearchEvent) => void;
  /** Called when a suggestion is chosen. */
  onOptionSelect?: (event: AutocompleteOptionEvent) => void;
  /** Called when a chip is removed. */
  onOptionRemove?: (event: AutocompleteOptionEvent) => void;
  /** Accessible name of the chips' remove buttons; defaults to "Remove" plus the chip label. */
  removeAriaLabel?: string;
  /** Message shown when a completed search returns no suggestions. */
  emptyMessage?: string;
  /** Id of the text input, so an external `<label for>` associates. */
  id?: string;
  /** Name of the text input. */
  name?: string;
  /** Accessible name of the input and the list. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Marks the field as invalid and draws the danger border. */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Ref of the root element. */
  ref?: Ref<HTMLDivElement>;
}

const NO_VALUES: readonly unknown[] = [];

function toValues(current: unknown): readonly unknown[] {
  if (Array.isArray(current)) return current;
  if (current === null || current === undefined) return NO_VALUES;
  return [current];
}

/** Keys that stay unique for repeated labels without depending on the position in the list. */
function labelKeys(labels: readonly string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((text) => {
    const count = seen.get(text) ?? 0;
    seen.set(text, count + 1);
    return `${text}\u0000${count}`;
  });
}

/** Text input with consumer-supplied suggestions, single- or multi-valued (chips). */
export function Autocomplete({
  suggestions = NO_VALUES,
  optionLabel,
  optionDisabled,
  renderOption,
  multiple = false,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  minLength = 1,
  debounceMs = 300,
  completeOnFocus = false,
  onSearch,
  onOptionSelect,
  onOptionRemove,
  removeAriaLabel,
  emptyMessage,
  id: ownId,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ownDescribedBy,
  'aria-invalid': ownInvalid,
  className,
  ref,
  ...rest
}: AutocompleteProps) {
  const t = useTranslate();
  const generatedId = useId();
  const inputId = ownId ?? generatedId;
  const listboxId = `${generatedId}-listbox`;
  const root = useRef<HTMLDivElement | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // A stable ref: Floating measures the anchor in a layout effect that runs before an inline callback ref is re-attached.
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => root.current, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  const [current, setCurrent] = useControllable<unknown>(
    value,
    defaultValue ?? (multiple ? NO_VALUES : null),
    onChange,
  );
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [searched, setSearched] = useState(false);
  const [active, setActive] = useState(-1);

  const selected: readonly unknown[] = multiple ? toValues(current) : NO_VALUES;
  const label = (v: unknown) => optionLabelOf(v, optionLabel);
  const isDisabledOption = (option: unknown) =>
    Boolean(
      optionDisabled !== undefined &&
      optionDisabled !== '' &&
      option !== null &&
      typeof option === 'object' &&
      (option as Record<string, unknown>)[optionDisabled],
    );
  const isSelected = (option: unknown) => selected.some((v) => valuesMatch(v, option));

  const visible = focused && searched && !disabled && (query.length >= minLength || completeOnFocus);
  const activeIndex = Math.min(active, suggestions.length - 1);
  const singleText = current === null || current === undefined ? '' : label(current);
  const inputText = multiple ? query : singleText;

  const hide = () => {
    clearTimeout(timer.current);
    setSearched(false);
    setActive(-1);
  };
  const search = (text: string, originalEvent?: Event) => {
    onSearch?.({ query: text, originalEvent });
    setSearched(true);
  };
  const focusInput = () => {
    if (!disabled) input.current?.focus();
  };

  const select = (option: unknown, originalEvent?: Event) => {
    if (disabled || isDisabledOption(option)) return;
    if (multiple) {
      // A value that is already chosen is not added twice, but the query is still dismissed.
      if (!isSelected(option)) {
        setCurrent([...selected, option]);
        onOptionSelect?.({ value: option, originalEvent });
      }
    } else {
      setCurrent(option);
      onOptionSelect?.({ value: option, originalEvent });
    }
    setQuery('');
    hide();
    focusInput();
  };

  const removeAt = (index: number, originalEvent?: Event) => {
    if (index < 0 || index >= selected.length) return;
    setCurrent(selected.filter((_, i) => i !== index));
    onOptionRemove?.({ value: selected[index], originalEvent });
    focusInput();
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const text = event.target.value;
    setQuery(text);
    setActive(-1);
    if (!multiple) setCurrent(text === '' ? null : text);
    clearTimeout(timer.current);
    if (text.length >= minLength) {
      const native = event.nativeEvent;
      timer.current = setTimeout(() => search(text, native), debounceMs);
    } else if (completeOnFocus) {
      search(text, event.nativeEvent);
    } else {
      setSearched(false);
    }
  };

  const move = (direction: 1 | -1) => {
    const start = direction === 1 ? 0 : suggestions.length - 1;
    let index = activeIndex < 0 ? start : activeIndex + direction;
    while (index >= 0 && index < suggestions.length) {
      if (!isDisabledOption(suggestions[index])) {
        setActive(index);
        return;
      }
      index += direction;
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = suggestions.length;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        if (visible && count > 0) {
          event.preventDefault();
          move(event.key === 'ArrowDown' ? 1 : -1);
        }
        break;
      case 'Enter':
        if (visible && activeIndex >= 0) {
          event.preventDefault();
          select(suggestions[activeIndex], event.nativeEvent);
        }
        break;
      case 'Backspace':
        if (multiple && query.length === 0 && selected.length > 0) removeAt(selected.length - 1, event.nativeEvent);
        break;
    }
  };

  const items: ListboxItem[] = suggestions.map((option, index) => ({
    key: index,
    selected: isSelected(option),
    disabled: isDisabledOption(option),
    content: renderOption ? (
      renderOption(option)
    ) : (
      <span className="tumaet-ui-listbox-option-label">{label(option)}</span>
    ),
  }));
  const chipKeys = labelKeys(selected.map(label));
  const invalid = ownInvalid === true || ownInvalid === 'true';

  return (
    <div {...rest} ref={root} className={cx('tumaet-ui-autocomplete', className)}>
      {/* The click only forwards focus to the input, which is the keyboard-accessible control. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click only forwards focus to the input, which is the keyboard-accessible control */}
      <div
        ref={container}
        className="tumaet-ui-autocomplete-container"
        data-focused={focused || undefined}
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        data-multiple={multiple || undefined}
        data-has-values={selected.length > 0 || undefined}
        onClick={focusInput}
      >
        {selected.map((v, index) => (
          <span key={chipKeys[index]} className="tumaet-ui-autocomplete-chip" data-removable={!disabled || undefined}>
            <span className="tumaet-ui-autocomplete-chip-label">{label(v)}</span>
            {!disabled && (
              <button
                type="button"
                className="tumaet-ui-autocomplete-chip-remove"
                aria-label={removeAriaLabel ?? `${t('tumAetUi.autocomplete.remove')} ${label(v)}`}
                onClick={(event) => {
                  event.stopPropagation();
                  removeAt(index, event.nativeEvent);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' || event.key === 'Delete') {
                    event.preventDefault();
                    removeAt(index, event.nativeEvent);
                  }
                }}
              >
                <XIcon />
              </button>
            )}
          </span>
        ))}
        <input
          ref={input}
          type="text"
          role="combobox"
          id={inputId}
          name={name}
          autoComplete="off"
          className="tumaet-ui-autocomplete-input"
          value={inputText}
          placeholder={multiple && selected.length > 0 ? undefined : placeholder}
          disabled={disabled}
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={visible ? listboxId : undefined}
          aria-activedescendant={visible && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ownDescribedBy}
          aria-invalid={ownInvalid}
          aria-required={required || undefined}
          onChange={onInput}
          onFocus={(event) => {
            setFocused(true);
            if (completeOnFocus && !disabled) search(query, event.nativeEvent);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={onKeyDown}
        />
      </div>
      <Floating anchor={container} open={visible} matchWidth onDismiss={hide} className="tumaet-ui-autocomplete-panel">
        <Listbox
          id={listboxId}
          items={items}
          activeIndex={activeIndex}
          onActivate={setActive}
          onSelect={(index) => select(suggestions[index])}
          emptyText={emptyMessage ?? t('tumAetUi.autocomplete.empty')}
          multiselectable={multiple}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel !== undefined && ariaLabel !== '' ? undefined : ariaLabelledBy}
        />
      </Floating>
    </div>
  );
}
