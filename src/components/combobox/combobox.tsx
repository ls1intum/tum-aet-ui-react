import { createContext, useContext, useEffect, useRef, type Key, type ReactNode } from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { cx } from '../../internal/cx';
import { CheckIcon, ChevronDownIcon, XIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';

export type ComboboxSize = 'small' | 'default' | 'large';
export interface ComboboxOption<Value> {
  /** Stable rendered identity, independent of order, equality and serialization. */
  key: Key;
  value: Value;
  label: string;
  disabled?: boolean;
}
export type ComboboxProps<Value, Multiple extends boolean = false> = Omit<
  BaseCombobox.Root.Props<NoInfer<Value>, Multiple>,
  'items' | 'filteredItems' | 'value' | 'defaultValue'
> & {
  /** Keep selected descriptors in items, including during async searches. */
  items: ReadonlyArray<ComboboxOption<Value>>;
  /** Server-filtered results; use filter={null} to disable local filtering. */
  filteredItems?: ReadonlyArray<NoInfer<Value>>;
  /** Required controlled selection. The caller owns native form reset policy. */
  value: Multiple extends true ? ReadonlyArray<NoInfer<Value>> : NoInfer<Value> | null;
  renderItem?: (item: ComboboxOption<Value>, index: number) => ReactNode;
  /** Chip content; include ComboboxChipRemove when removal is wanted. */
  renderChip?: (item: ComboboxOption<Value>) => ReactNode;
};

const CollectionContext = createContext<ReactNode>(null);
const ChipsContext = createContext<(() => ReactNode) | null>(null);

/** Searchable selection. Query text uses inputValue, separate from the controlled selection. */
export function Combobox<Value, Multiple extends boolean = false>({
  items,
  value,
  multiple,
  renderItem,
  renderChip,
  children,
  itemToStringLabel,
  isItemEqualToValue = Object.is,
  actionsRef: externalActionsRef,
  disabled,
  ...props
}: ComboboxProps<Value, Multiple>) {
  const t = useTranslate();
  const internalActionsRef = useRef<BaseCombobox.Root.Actions | null>(null);
  const actionsRef = externalActionsRef ?? internalActionsRef;
  // A disabled control should not leave an unusable popup open.
  useEffect(() => {
    if (disabled === true) actionsRef.current?.close();
  }, [disabled, actionsRef]);
  const optionFor = (selected: Value) => items.find((item) => isItemEqualToValue(item.value, selected));
  const labelFor = (selected: Value) => itemToStringLabel?.(selected) ?? optionFor(selected)?.label ?? String(selected);
  const chips = () => {
    if (multiple !== true || !Array.isArray(value)) return null;
    return (value as readonly Value[]).map((selected) => {
      const item = optionFor(selected);
      if (!item)
        throw new Error('ComboboxChips requires selected descriptors in items. Keep them when updating async results.');
      return (
        <BaseCombobox.Chip key={item.key} className="tumaet-ui-autocomplete-chip">
          {renderChip ? (
            renderChip(item)
          ) : (
            <>
              <span className="tumaet-ui-autocomplete-chip-label">{item.label}</span>
              <ComboboxChipRemove aria-label={`${t('tumAetUi.autocomplete.remove')} ${item.label}`} />
            </>
          )}
        </BaseCombobox.Chip>
      );
    });
  };
  return (
    <BaseCombobox.Root<Value, Multiple>
      {...props}
      multiple={multiple}
      disabled={disabled}
      actionsRef={actionsRef}
      value={value as BaseCombobox.Root.Props<Value, Multiple>['value']}
      items={items.map((item) => item.value)}
      itemToStringLabel={labelFor}
      isItemEqualToValue={isItemEqualToValue}
    >
      <CollectionContext
        value={
          <BaseCombobox.Collection>
            {(itemValue: Value, index: number) => {
              const item = optionFor(itemValue);
              if (!item) throw new Error('Combobox filteredItems must reference values in items.');
              return (
                <BaseCombobox.Item
                  key={item.key}
                  value={item.value}
                  disabled={item.disabled}
                  className="tumaet-ui-combobox-option"
                >
                  <span className="tumaet-ui-combobox-option-label">
                    {renderItem ? renderItem(item, index) : item.label}
                  </span>
                  <BaseCombobox.ItemIndicator className="tumaet-ui-combobox-check">
                    <CheckIcon />
                  </BaseCombobox.ItemIndicator>
                </BaseCombobox.Item>
              );
            }}
          </BaseCombobox.Collection>
        }
      >
        <ChipsContext value={chips}>{children}</ChipsContext>
      </CollectionContext>
    </BaseCombobox.Root>
  );
}

export type ComboboxInputGroupProps = BaseCombobox.InputGroup.Props & {
  size?: ComboboxSize;
  variant?: 'default' | 'outlined';
};
export function ComboboxInputGroup({
  className,
  size = 'default',
  variant = 'default',
  ...props
}: ComboboxInputGroupProps) {
  return (
    <BaseCombobox.InputGroup
      {...props}
      data-size={size}
      data-variant={variant}
      className={(state) =>
        cx('tumaet-ui-autocomplete-container', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
export type ComboboxInputProps = BaseCombobox.Input.Props;
export function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return (
    <BaseCombobox.Input
      {...props}
      className={(state) =>
        cx('tumaet-ui-autocomplete-input', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
export type ComboboxTriggerProps = BaseCombobox.Trigger.Props;
export function ComboboxTrigger({ className, children, ...props }: ComboboxTriggerProps) {
  const t = useTranslate();
  return (
    <BaseCombobox.Trigger
      aria-label={t('tumAetUi.select.filter')}
      {...props}
      className={(state) =>
        cx('tumaet-ui-combobox-trigger', typeof className === 'function' ? className(state) : className)
      }
    >
      {children ?? <ChevronDownIcon />}
    </BaseCombobox.Trigger>
  );
}
/** Display only. Typed custom item and chip rendering belongs to the root callbacks. */
export type ComboboxValueProps = Omit<BaseCombobox.Value.Props, 'children'> & { children?: ReactNode };
export function ComboboxValue(props: ComboboxValueProps) {
  return <BaseCombobox.Value {...props} />;
}
export type ComboboxPortalProps = BaseCombobox.Portal.Props;
export function ComboboxPortal({ className, ...props }: ComboboxPortalProps) {
  return (
    <BaseCombobox.Portal
      {...props}
      className={(state) =>
        cx('tumaet-ui-combobox-portal', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
export type ComboboxPositionerProps = BaseCombobox.Positioner.Props;
export function ComboboxPositioner({ className, sideOffset = 4, ...props }: ComboboxPositionerProps) {
  return (
    <BaseCombobox.Positioner
      {...props}
      sideOffset={sideOffset}
      className={(state) =>
        cx('tumaet-ui-combobox-positioner', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
export type ComboboxPopupProps = BaseCombobox.Popup.Props;
export function ComboboxPopup({ className, ...props }: ComboboxPopupProps) {
  return (
    <BaseCombobox.Popup
      {...props}
      className={(state) =>
        cx('tumaet-ui-autocomplete-panel', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
export type ComboboxListProps = Omit<BaseCombobox.List.Props, 'children'> & { emptyMessage?: ReactNode };
export function ComboboxList({ className, emptyMessage, ...props }: ComboboxListProps) {
  const collection = useContext(CollectionContext);
  const t = useTranslate();
  return (
    <>
      <BaseCombobox.Empty className="tumaet-ui-combobox-empty">
        {emptyMessage ?? t('tumAetUi.autocomplete.empty')}
      </BaseCombobox.Empty>
      <BaseCombobox.List
        {...props}
        className={(state) =>
          cx('tumaet-ui-combobox-list', typeof className === 'function' ? className(state) : className)
        }
      >
        {collection}
      </BaseCombobox.List>
    </>
  );
}
export type ComboboxChipsProps = BaseCombobox.Chips.Props;
/** Renders selected chips with root-owned stable keys, followed by the input and controls. */
export function ComboboxChips({ className, children, ...props }: ComboboxChipsProps) {
  const chips = useContext(ChipsContext);
  return (
    <BaseCombobox.Chips
      {...props}
      className={(state) =>
        cx('tumaet-ui-combobox-chips', typeof className === 'function' ? className(state) : className)
      }
    >
      {chips?.()}
      {children}
    </BaseCombobox.Chips>
  );
}
export type ComboboxChipRemoveProps = BaseCombobox.ChipRemove.Props;
export function ComboboxChipRemove({ className, children, ...props }: ComboboxChipRemoveProps) {
  const t = useTranslate();
  return (
    <BaseCombobox.ChipRemove
      aria-label={t('tumAetUi.autocomplete.remove')}
      {...props}
      className={(state) =>
        cx('tumaet-ui-autocomplete-chip-remove', typeof className === 'function' ? className(state) : className)
      }
    >
      {children ?? <XIcon />}
    </BaseCombobox.ChipRemove>
  );
}
export type ComboboxClearProps = BaseCombobox.Clear.Props;
export function ComboboxClear({ className, children, ...props }: ComboboxClearProps) {
  const t = useTranslate();
  return (
    <BaseCombobox.Clear
      aria-label={t('tumAetUi.select.clear')}
      {...props}
      className={(state) =>
        cx('tumaet-ui-combobox-clear', typeof className === 'function' ? className(state) : className)
      }
    >
      {children ?? <XIcon />}
    </BaseCombobox.Clear>
  );
}
