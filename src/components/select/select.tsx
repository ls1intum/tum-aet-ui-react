import {
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { Floating } from '../../internal/floating';
import { useTranslate } from '../../internal/i18n';
import { CheckIcon, ChevronDownIcon, XIcon } from '../../internal/icons';
import { useControllable } from '../../internal/use-controllable';
import { Listbox, optionId, type ListboxItem } from './listbox';
import {
  isPrintableKey,
  navigate,
  optionLabelOf,
  optionValueOf,
  toText,
  useTypeahead,
  valuesMatch,
} from './use-listbox';

export type SelectSize = 'small' | 'default' | 'large';

export interface SelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue' | 'placeholder'> {
  /** The options: primitives, or objects read through `optionLabel` and `optionValue`. */
  options?: readonly unknown[];
  /** Property used as the visible label of object options. */
  optionLabel?: string;
  /** Property written as the value; omit it to use the option itself. */
  optionValue?: string;
  /** Selected value. Cleared with `null`. */
  value?: unknown;
  /** Initial value when the select is uncontrolled. */
  defaultValue?: unknown;
  /** Called with the new value (`null` after clearing). */
  onChange?: (value: unknown) => void;
  /** Text of the trigger while nothing is selected. */
  placeholder?: string;
  /** Disables the trigger; an open list closes. */
  disabled?: boolean;
  /** Reports the control as required to assistive technology. */
  required?: boolean;
  /** Shows a button that clears the selection. */
  showClear?: boolean;
  /** Adds a search field above the list. */
  filter?: boolean;
  /** Comma-separated property names searched by the filter; defaults to the label. */
  filterBy?: string;
  /** Placeholder of the search field. */
  filterPlaceholder?: string;
  /** Accessible name of the search field. */
  filterAriaLabel?: string;
  /** Accessible name of the clear button. */
  clearAriaLabel?: string;
  /** Message shown when there are no options. */
  emptyMessage?: string;
  /** Height and font size of the trigger. */
  size?: SelectSize;
  /** Id of the trigger, so an external `<label for>` associates. */
  id?: string;
  /** Name of a hidden input that carries the value in a native form. */
  name?: string;
  /** Accessible name of the trigger and the list. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Marks the control as invalid and draws the danger border. */
  'aria-invalid'?: boolean | 'true' | 'false';
  /** Ref of the root element. */
  ref?: Ref<HTMLDivElement>;
}

const NAVIGATION_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

/** Single-value select with a listbox popup, optional filter and clear button. */
export function Select({
  options = [],
  optionLabel,
  optionValue,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  showClear = false,
  filter = false,
  filterBy,
  filterPlaceholder,
  filterAriaLabel,
  clearAriaLabel,
  emptyMessage,
  size = 'default',
  id: ownId,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ownDescribedBy,
  'aria-invalid': ownInvalid,
  className,
  ref,
  ...rest
}: SelectProps) {
  const t = useTranslate();
  // Moves focus to the search field when the popup opens and mounts it.
  const focusOnMount = useCallback((node: HTMLInputElement | null) => node?.focus(), []);
  const generatedId = useId();
  const ariaDescribedBy = ownDescribedBy;
  const ariaInvalid = ownInvalid;
  const triggerId = ownId ?? generatedId;
  const listboxId = `${generatedId}-listbox`;
  const root = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const typeahead = useTypeahead();
  // A stable ref: Floating measures the anchor in a layout effect that runs before an inline callback ref is re-attached.
  useImperativeHandle(ref, () => {
    if (root.current === null) throw new Error('Select root element is not mounted');
    return root.current;
  }, []);

  const [current, setCurrent] = useControllable<unknown>(value, defaultValue, onChange);
  const [openState, setOpenState] = useState(false);
  const [active, setActive] = useState(-1);
  const [query, setQuery] = useState('');
  const open = openState && !disabled;
  if (disabled && openState) {
    // Disabling while open closes the list for good, so it does not reappear when the select is enabled again.
    setOpenState(false);
    setQuery('');
  }

  const hasValue = current !== undefined && current !== null;
  const isSelected = (option: unknown) => hasValue && valuesMatch(optionValueOf(option, optionValue), current);
  const selectedOption = hasValue ? options.find(isSelected) : undefined;
  const hasSelection = selectedOption !== undefined;

  const filtering = filter && query.trim().length > 0;
  const keys = filterBy
    ?.split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const fields = (option: unknown): string[] =>
    keys === undefined || keys.length === 0 || option === null || typeof option !== 'object'
      ? [optionLabelOf(option, optionLabel)]
      : keys.map((k) => toText((option as Record<string, unknown>)[k]));
  const needle = query.trim().toLocaleLowerCase();
  const visible = filtering
    ? options.filter((o) => fields(o).some((f) => f.toLocaleLowerCase().includes(needle)))
    : options;
  // Keeps aria-activedescendant valid when the list shrinks, and activates the first option of an open list that was empty.
  const activeIndex = open && active < 0 && visible.length > 0 ? 0 : Math.min(active, visible.length - 1);

  const openPanel = (initial?: { index?: number; query?: string }) => {
    if (open || disabled) return;
    const selectedIndex = visible.findIndex(isSelected);
    let fallbackIndex = -1;
    if (selectedIndex >= 0) fallbackIndex = selectedIndex;
    else if (visible.length > 0) fallbackIndex = 0;
    setActive(initial?.index ?? fallbackIndex);
    setQuery(initial?.query ?? '');
    setOpenState(true);
  };
  const close = (restoreFocus = true) => {
    typeahead.reset();
    setOpenState(false);
    setQuery('');
    if (restoreFocus) trigger.current?.focus();
  };
  const commit = (next: unknown) => {
    setCurrent(next);
    close();
  };
  const selectAt = (index: number) => {
    if (index >= 0 && index < visible.length) commit(optionValueOf(visible[index], optionValue));
  };
  const clear = () => {
    setCurrent(null);
    trigger.current?.focus();
  };

  const labels = visible.map((o) => optionLabelOf(o, optionLabel));

  /** Keys of the trigger, and, while filtering, of the search field (where Home/End and characters stay with the text). */
  const onKeyDown = (event: KeyboardEvent, inFilter: boolean) => {
    if (disabled) return;
    const { key } = event;
    if (!open) {
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        openPanel();
      } else if (key === 'Home' || key === 'End') {
        event.preventDefault();
        openPanel({ index: key === 'Home' ? 0 : visible.length - 1 });
      } else if (isPrintableKey(event)) {
        if (filter) {
          // The character belongs in the search field that takes focus.
          event.preventDefault();
          openPanel({ query: key });
        } else {
          const selectedIndex = visible.findIndex(isSelected);
          const start = selectedIndex >= 0 ? selectedIndex : 0;
          const match = typeahead.match(key, labels, start);
          openPanel({ index: match >= 0 ? match : undefined });
        }
      }
      return;
    }
    if (key === 'Enter' || (key === ' ' && !inFilter)) {
      event.preventDefault();
      selectAt(activeIndex);
    } else if (key === 'Tab') {
      if (activeIndex >= 0) selectAt(activeIndex);
      else close();
    } else if (NAVIGATION_KEYS.includes(key) && !(inFilter && (key === 'Home' || key === 'End'))) {
      const next = navigate(key, activeIndex, visible.length);
      event.preventDefault();
      if (next !== undefined) setActive(next);
    } else if (!inFilter && isPrintableKey(event)) {
      const match = typeahead.match(key, labels, activeIndex);
      if (match >= 0) setActive(match);
    }
  };

  const items: ListboxItem[] = visible.map((option, index) => ({
    key: index,
    selected: isSelected(option),
    content: (
      <>
        <span className="tumaet-ui-listbox-option-label">{optionLabelOf(option, optionLabel)}</span>
        {isSelected(option) && <CheckIcon className="tumaet-ui-select-check" />}
      </>
    ),
  }));
  const activeId = open && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined;
  const showClearButton = showClear && hasSelection && !disabled;
  const filterLabel = filterAriaLabel ?? t('tumAetUi.select.filter');

  return (
    <div
      {...rest}
      ref={root}
      className={cx('tumaet-ui-select', className)}
      data-size={size}
      data-open={open || undefined}
    >
      <button
        ref={trigger}
        type="button"
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="none"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && !filter ? activeId : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        disabled={disabled}
        className="tumaet-ui-select-trigger"
        data-invalid={ariaInvalid === true || ariaInvalid === 'true' || undefined}
        data-clearable={showClearButton || undefined}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={(event) => onKeyDown(event, false)}
      >
        <span className="tumaet-ui-select-value" data-placeholder={!hasSelection || undefined}>
          {hasSelection ? optionLabelOf(selectedOption, optionLabel) : placeholder}
        </span>
      </button>
      {name !== undefined && name !== '' ? (
        <input type="hidden" name={name} value={hasSelection ? toText(current) : ''} disabled={disabled} />
      ) : null}
      <span className="tumaet-ui-select-chevron" aria-hidden="true">
        <ChevronDownIcon />
      </span>
      {showClearButton ? (
        <button
          type="button"
          className="tumaet-ui-select-clear"
          aria-label={clearAriaLabel ?? t('tumAetUi.select.clear')}
          onClick={clear}
        >
          <XIcon />
        </button>
      ) : null}
      <Floating anchor={root} open={open} matchWidth onDismiss={() => close()} className="tumaet-ui-select-panel">
        {filter ? (
          <div className="tumaet-ui-select-filter-wrapper">
            <input
              type="text"
              ref={focusOnMount}
              autoComplete="off"
              className="tumaet-ui-select-filter"
              value={query}
              placeholder={filterPlaceholder ?? t('tumAetUi.select.filter')}
              aria-label={filterLabel}
              aria-controls={listboxId}
              aria-activedescendant={activeId}
              onChange={(event) => {
                setQuery(event.target.value);
                // The previous active option may have been filtered away: start again at the top.
                setActive(0);
              }}
              onKeyDown={(event) => onKeyDown(event, true)}
            />
          </div>
        ) : null}
        <Listbox
          id={listboxId}
          items={items}
          activeIndex={activeIndex}
          onActivate={setActive}
          onSelect={selectAt}
          emptyText={filtering ? t('tumAetUi.select.noResults') : (emptyMessage ?? t('tumAetUi.select.empty'))}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel !== undefined && ariaLabel !== '' ? undefined : ariaLabelledBy}
        />
      </Floating>
    </div>
  );
}
