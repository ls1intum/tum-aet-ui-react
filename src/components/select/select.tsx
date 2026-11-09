import { createContext, useContext, type Key, type ReactNode } from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { cx } from '../../internal/cx';
import { CheckIcon, ChevronDownIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';

export type SelectSize = 'small' | 'default' | 'large';

export interface SelectOption<Value> {
  /** Stable identity for the item and its rendered content, independent of order or serialization. */
  key: Key;
  value: Value;
  label: ReactNode;
  disabled?: boolean;
}

export type SelectProps<Value, Multiple extends boolean = false> = Omit<
  BaseSelect.Root.Props<NoInfer<Value>, Multiple>,
  'items' | 'value' | 'defaultValue'
> & {
  /** The checked collection rendered by SelectList. JSX descendants are not typechecked by the root. */
  items: ReadonlyArray<SelectOption<Value>>;
  /** Controlled selection. Reset policy belongs to the caller, including native form resets. */
  value: Multiple extends true ? ReadonlyArray<NoInfer<Value>> : NoInfer<Value> | null;
  /** Custom item content; values and disabled state still come from the root-owned collection. */
  renderItem?: (item: SelectOption<Value>, index: number) => ReactNode;
};

const ItemsContext = createContext<ReactNode>(null);

/** Controlled selection; Base UI owns open state and interaction. Single empties are null; multiple empties are []. */
export function Select<Value, Multiple extends boolean = false>({
  items,
  renderItem,
  children,
  value,
  multiple,
  itemToStringLabel,
  ...props
}: SelectProps<Value, Multiple>) {
  // The wrapper excludes null in multiple mode; TypeScript cannot reduce this narrower conditional
  // to Base UI's input type until Multiple is known, hence the value cast below.
  return (
    <BaseSelect.Root<Value, Multiple>
      {...props}
      multiple={multiple}
      value={value as BaseSelect.Root.Props<Value, Multiple>['value']}
      items={items}
      itemToStringLabel={itemToStringLabel}
    >
      <ItemsContext
        value={items.map((item, index) => (
          <SelectItem
            key={item.key}
            value={item.value}
            disabled={item.disabled}
            label={itemToStringLabel?.(item.value) ?? (typeof item.label === 'string' ? item.label : undefined)}
          >
            <SelectItemText>{renderItem ? renderItem(item, index) : item.label}</SelectItemText>
            <SelectItemIndicator>
              <CheckIcon />
            </SelectItemIndicator>
          </SelectItem>
        ))}
      >
        {children}
      </ItemsContext>
    </BaseSelect.Root>
  );
}

export type SelectTriggerProps = BaseSelect.Trigger.Props & { size?: SelectSize };
export function SelectTrigger({ className, size = 'default', children, ...props }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger
      {...props}
      data-size={size}
      className={(state) =>
        cx('tumaet-ui-select-trigger', typeof className === 'function' ? className(state) : className)
      }
    >
      {children}
      <BaseSelect.Icon className="tumaet-ui-select-chevron">
        <ChevronDownIcon />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export type SelectValueProps = BaseSelect.Value.Props;
export function SelectValue({ className, ...props }: SelectValueProps) {
  return (
    <BaseSelect.Value
      {...props}
      className={(state) =>
        cx('tumaet-ui-select-value', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectPortalProps = BaseSelect.Portal.Props;
export function SelectPortal({ className, ...props }: SelectPortalProps) {
  return (
    <BaseSelect.Portal
      {...props}
      className={(state) =>
        cx('tumaet-ui-select-portal', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectPositionerProps = BaseSelect.Positioner.Props;
export function SelectPositioner({
  className,
  alignItemWithTrigger = false,
  sideOffset = 4,
  ...props
}: SelectPositionerProps) {
  return (
    <BaseSelect.Positioner
      {...props}
      alignItemWithTrigger={alignItemWithTrigger}
      sideOffset={sideOffset}
      className={(state) =>
        cx('tumaet-ui-select-positioner', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectPopupProps = BaseSelect.Popup.Props;
export function SelectPopup({ className, ...props }: SelectPopupProps) {
  return (
    <BaseSelect.Popup
      {...props}
      className={(state) =>
        cx('tumaet-ui-select-panel', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectListProps = Omit<BaseSelect.List.Props, 'children'> & { emptyMessage?: ReactNode };
/** Renders the root-owned typed collection. Use SelectItem directly only for independently typed compositions. */
export function SelectList({ className, emptyMessage, ...props }: SelectListProps) {
  const items = useContext(ItemsContext);
  const t = useTranslate();
  return (
    <BaseSelect.List
      {...props}
      className={(state) => cx('tumaet-ui-listbox', typeof className === 'function' ? className(state) : className)}
    >
      {Array.isArray(items) && items.length === 0 ? (
        <div className="tumaet-ui-listbox-empty">{emptyMessage ?? t('tumAetUi.select.empty')}</div>
      ) : (
        items
      )}
    </BaseSelect.List>
  );
}

export type SelectItemProps<Value = unknown> = Omit<BaseSelect.Item.Props, 'value'> & { value: Value };
export function SelectItem<Value>({ className, ...props }: SelectItemProps<Value>) {
  return (
    <BaseSelect.Item
      {...props}
      className={(state) =>
        cx('tumaet-ui-listbox-option', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectItemTextProps = BaseSelect.ItemText.Props;
export function SelectItemText({ className, ...props }: SelectItemTextProps) {
  return (
    <BaseSelect.ItemText
      {...props}
      className={(state) =>
        cx('tumaet-ui-listbox-option-label', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type SelectItemIndicatorProps = BaseSelect.ItemIndicator.Props;
export function SelectItemIndicator({ className, ...props }: SelectItemIndicatorProps) {
  return (
    <BaseSelect.ItemIndicator
      {...props}
      className={(state) =>
        cx('tumaet-ui-select-check', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
