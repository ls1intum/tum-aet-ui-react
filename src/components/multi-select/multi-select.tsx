import {
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { Floating } from '../../internal/floating';
import { useTranslate } from '../../internal/i18n';
import { CheckIcon, ChevronDownIcon } from '../../internal/icons';
import { useControllable } from '../../internal/use-controllable';
import { Listbox, optionId, type ListboxItem } from '../select/listbox';
import { navigate, optionLabelOf, optionValueOf } from '../select/use-listbox';

export type MultiSelectSize = 'small' | 'default' | 'large';
/** `outlined` matches an outlined primary button, for toolbars. */
export type MultiSelectVariant = 'default' | 'outlined';

/** The panel is at least as wide as the trigger and never narrower than this. */
const MIN_PANEL_WIDTH_PX = 192;
const NO_VALUES: readonly unknown[] = [];

export interface MultiSelectProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'placeholder'
> {
  /** The options: primitives, or objects read through `optionLabel` and `optionValue`. */
  options?: readonly unknown[];
  /** Property used as the visible label of object options. */
  optionLabel?: string;
  /** Property written as the value; omit it to use the option itself. */
  optionValue?: string;
  /** Array of the chosen values. */
  value?: readonly unknown[];
  /** Initial values when the control is uncontrolled. */
  defaultValue?: readonly unknown[];
  /** Called with the new array of chosen values whenever an option is toggled. */
  onChange?: (value: unknown[]) => void;
  /** Text of the trigger while nothing is chosen. */
  placeholder?: string;
  /** Disables the trigger; an open list closes. */
  disabled?: boolean;
  /** Reports the control as required to assistive technology. */
  required?: boolean;
  /** Height and font size of the trigger. */
  size?: MultiSelectSize;
  /** `outlined` looks like an outlined primary button. */
  variant?: MultiSelectVariant;
  /** How many chosen labels the default summary lists before it falls back to a count. */
  maxSelectedLabels?: number;
  /** Message shown when there are no options. */
  emptyMessage?: string;
  /** Replaces the label of an option row. */
  renderOption?: (option: unknown, state: { selected: boolean }) => ReactNode;
  /** Replaces the summary inside the trigger; receives the chosen options. Interactive content (a remove button) is allowed. */
  renderSelectedItems?: (options: unknown[]) => ReactNode;
  /** Id of the trigger, so an external `<label for>` associates. */
  id?: string;
  /** Name of the hidden inputs (one per value) that carry the values in a native form. */
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

/** Text of a chosen value in a hidden form input; objects are not representable and give an empty string. */
function hiddenInputValue(v: unknown): string {
  switch (typeof v) {
    case 'string':
      return v;
    case 'number':
    case 'boolean':
    case 'bigint':
    case 'undefined':
      return String(v);
    case 'symbol':
    case 'function':
      return v.toString();
    case 'object':
      return '';
  }
}

/** Chooses any number of values from a listbox popup that stays open while options are toggled. */
export function MultiSelect({
  options = [],
  optionLabel,
  optionValue,
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  size = 'default',
  variant = 'default',
  maxSelectedLabels = 3,
  emptyMessage,
  renderOption,
  renderSelectedItems,
  id: ownId,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ownDescribedBy,
  'aria-invalid': ownInvalid,
  className,
  ref,
  ...rest
}: MultiSelectProps) {
  const t = useTranslate();
  const generatedId = useId();
  const triggerId = ownId ?? generatedId;
  const listboxId = `${generatedId}-listbox`;
  const root = useRef<HTMLDivElement | null>(null);
  const trigger = useRef<HTMLDivElement | null>(null);
  // A stable ref: Floating measures the anchor in a layout effect that runs before an inline callback ref is re-attached.
  useImperativeHandle(ref, () => {
    const element = root.current;
    if (element === null) {
      throw new Error('MultiSelect root element is not mounted.');
    }
    return element;
  }, []);

  const [values, setValues] = useControllable<readonly unknown[]>(
    value,
    defaultValue ?? NO_VALUES,
    onChange as ((next: readonly unknown[]) => void) | undefined,
  );
  const [openRequested, setOpenRequested] = useState(false);
  const [active, setActive] = useState(-1);
  const open = openRequested && !disabled;
  if (disabled && openRequested) {
    // Disabling while open closes the list for good, so it does not reappear when the control is enabled again.
    setOpenRequested(false);
  }

  const isSelected = (option: unknown) => {
    const v = optionValueOf(option, optionValue);
    return values.some((selected) => Object.is(selected, v));
  };
  // In the order of the option list, so the summary does not depend on the order of choosing.
  const selectedOptions = options.filter(isSelected);
  // Also activates the first option of an open list that was empty.
  const activeIndex = open && active < 0 && options.length > 0 ? 0 : Math.min(active, options.length - 1);

  const openPanel = () => {
    if (open || disabled) return;
    const first = options.findIndex(isSelected);
    const fallback = options.length > 0 ? 0 : -1;
    setActive(first >= 0 ? first : fallback);
    setOpenRequested(true);
  };
  const close = (restoreFocus = true) => {
    setOpenRequested(false);
    if (restoreFocus) trigger.current?.focus();
  };
  const toggleOption = (index: number) => {
    if (index < 0 || index >= options.length) return;
    const option = options[index];
    const v = optionValueOf(option, optionValue);
    setValues(isSelected(option) ? values.filter((s) => !Object.is(s, v)) : [...values, v]);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Keys pressed inside a projected control (a chip's remove button) belong to that control.
    if (disabled || event.target !== event.currentTarget) return;
    const { key } = event;
    if (!open) {
      if (key === 'Enter' || key === ' ' || key === 'ArrowDown' || key === 'ArrowUp') {
        event.preventDefault();
        openPanel();
      }
      return;
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (activeIndex >= 0) toggleOption(activeIndex);
    } else if (key === 'Tab') {
      close(false);
    } else {
      const next = navigate(key, activeIndex, options.length);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        if (next !== undefined) setActive(next);
      }
    }
  };

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    // Interactive content projected into the trigger handles its own clicks.
    const target = event.target as Element;
    if (target !== event.currentTarget && target.closest('button, a, input, select, textarea')) return;
    if (open) close();
    else openPanel();
  };

  const items: ListboxItem[] = options.map((option, index) => {
    const selected = isSelected(option);
    return {
      key: index,
      selected,
      content: (
        <>
          <span className="tumaet-ui-multi-select-box" data-checked={selected || undefined} aria-hidden="true">
            {selected ? <CheckIcon /> : null}
          </span>
          {renderOption ? (
            renderOption(option, { selected })
          ) : (
            <span className="tumaet-ui-listbox-option-label">{optionLabelOf(option, optionLabel)}</span>
          )}
        </>
      ),
    };
  });

  const labels = selectedOptions.map((o) => optionLabelOf(o, optionLabel));
  const placeholderNode =
    placeholder !== undefined && placeholder !== '' ? (
      <span className="tumaet-ui-multi-select-text tumaet-ui-multi-select-placeholder">{placeholder}</span>
    ) : null;
  let summary: ReactNode;
  if (renderSelectedItems) {
    summary = (
      <>
        {renderSelectedItems(selectedOptions)}
        {selectedOptions.length === 0 && placeholderNode}
      </>
    );
  } else if (selectedOptions.length === 0) {
    summary = placeholderNode;
  } else if (labels.length > maxSelectedLabels) {
    summary = (
      <span className="tumaet-ui-multi-select-text">
        {t('tumAetUi.multiSelect.selected', { count: labels.length })}
      </span>
    );
  } else {
    summary = <span className="tumaet-ui-multi-select-text">{labels.join(', ')}</span>;
  }

  // One hidden input per chosen value, in order; the position is the identity of an entry.
  const hiddenInputs = values.map((v, position) => ({ key: position, value: hiddenInputValue(v) }));
  const invalid = ownInvalid === true || ownInvalid === 'true';

  return (
    <div
      {...rest}
      ref={root}
      className={cx('tumaet-ui-multi-select', className)}
      data-size={size}
      data-variant={variant}
      data-open={open || undefined}
      data-disabled={disabled || undefined}
    >
      <div
        ref={trigger}
        id={triggerId}
        role="combobox"
        aria-haspopup="listbox"
        aria-autocomplete="none"
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(listboxId, activeIndex) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ownDescribedBy}
        aria-invalid={ownInvalid}
        aria-required={required || undefined}
        className="tumaet-ui-multi-select-trigger"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        onClick={onClick}
        onKeyDown={onKeyDown}
      >
        {summary}
      </div>
      {name !== undefined && name !== ''
        ? hiddenInputs.map((input) => (
            <input key={input.key} type="hidden" name={name} value={input.value} disabled={disabled} />
          ))
        : null}
      <span className="tumaet-ui-multi-select-chevron" aria-hidden="true">
        <ChevronDownIcon />
      </span>
      <Floating
        anchor={root}
        open={open}
        matchWidth
        onDismiss={() => close()}
        className="tumaet-ui-multi-select-panel"
        style={{ minWidth: MIN_PANEL_WIDTH_PX }}
      >
        <Listbox
          id={listboxId}
          items={items}
          activeIndex={activeIndex}
          onActivate={setActive}
          onSelect={toggleOption}
          emptyText={emptyMessage ?? t('tumAetUi.select.empty')}
          multiselectable
          aria-label={ariaLabel}
          aria-labelledby={ariaLabel !== undefined && ariaLabel !== '' ? undefined : ariaLabelledBy}
        />
      </Floating>
    </div>
  );
}
