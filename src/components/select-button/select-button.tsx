import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { Toggle } from '@base-ui/react/toggle';
import { cx } from '../../internal/cx';

export type SelectButtonSize = 'small' | 'default' | 'large';
export interface SelectButtonItem<Value extends string> {
  /** Stable, unique, nonempty key; compared by string equality. */
  value: Value;
  label: ReactNode;
  props?: Omit<Toggle.Props<NoInfer<Value>>, 'value' | 'pressed' | 'defaultPressed' | 'children'> & {
    ref?: Ref<HTMLButtonElement>;
  };
}
export interface SelectButtonProps<Value extends string> extends Omit<
  ToggleGroup.Props<NoInfer<Value>>,
  'children' | 'onChange'
> {
  items: ReadonlyArray<SelectButtonItem<Value>>;
  size?: SelectButtonSize;
  ref?: ComponentPropsWithRef<typeof ToggleGroup>['ref'];
}

/** Non-form toggle group. Both single and multiple modes use arrays; empty is []. */
export function SelectButton<Value extends string>({
  items,
  size = 'default',
  className,
  ...props
}: SelectButtonProps<Value>) {
  const values = new Set<string>();
  for (const { value } of items) {
    if (value === '' || values.has(value)) {
      throw new Error('SelectButton item values must be unique, nonempty strings.');
    }
    values.add(value);
  }
  return (
    <ToggleGroup<Value>
      {...props}
      data-size={size}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-select-button', className(state))
          : cx('tumaet-ui-select-button', className)
      }
    >
      {items.map(({ value, label, props: { className: itemClassName, ...itemProps } = {} }) => (
        <Toggle<Value>
          {...itemProps}
          key={value}
          value={value}
          className={
            typeof itemClassName === 'function'
              ? (state) => cx('tumaet-ui-select-button-option', itemClassName(state))
              : cx('tumaet-ui-select-button-option', itemClassName)
          }
        >
          {label}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}
