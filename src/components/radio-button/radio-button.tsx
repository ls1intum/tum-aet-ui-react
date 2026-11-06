import { createContext, useContext, type ChangeEvent, type ComponentPropsWithRef } from 'react';
import { cx } from '../../internal/cx';

/** Strict equality for selection; native submission stringifies values. Use distinct serialized values. */
export type RadioValue = string | number;
export type RadioGroupProps<Value extends RadioValue = RadioValue> = Omit<
  ComponentPropsWithRef<'fieldset'>,
  'value' | 'defaultValue' | 'onChange' | 'name'
> & {
  /** Required for native exclusivity, keyboard navigation and submission. */
  name: string;
  value?: Value | null;
  defaultValue?: Value | null;
  onValueChange?: (value: Value, event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  readOnly?: boolean;
};
export type RadioButtonProps<Value extends RadioValue = RadioValue> = Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'children' | 'name' | 'form' | 'checked' | 'defaultChecked' | 'value' | 'defaultValue'
> & { value: Value };

type GroupContext = Pick<
  RadioGroupProps,
  'name' | 'form' | 'value' | 'defaultValue' | 'disabled' | 'required' | 'readOnly' | 'onValueChange'
>;
const RadioContext = createContext<GroupContext | null>(null);

/** Native fieldset. Uncontrolled selection belongs to the inputs, not the group. JSX children are independently typed. */
export function RadioGroup<Value extends RadioValue = RadioValue>({
  name,
  form,
  value,
  defaultValue,
  onValueChange,
  disabled,
  required,
  readOnly,
  className,
  children,
  ...props
}: RadioGroupProps<Value>) {
  return (
    <RadioContext
      value={{
        name,
        form,
        value,
        defaultValue,
        disabled,
        required,
        readOnly,
        onValueChange: (next, event) => onValueChange?.(next as Value, event),
      }}
    >
      <fieldset
        {...props}
        name={name}
        form={form}
        disabled={disabled}
        // ARIA in HTML explicitly permits radiogroup on fieldset; inputs provide native interaction.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
        role="radiogroup"
        aria-readonly={readOnly === true ? true : props['aria-readonly']}
        aria-required={required === true ? true : props['aria-required']}
        className={cx('tumaet-ui-radio-group', className)}
      >
        {children}
      </fieldset>
    </RadioContext>
  );
}

/** Native radio inside RadioGroup. className/style target the wrapper; other props/ref target the input. */
export function RadioButton<Value extends RadioValue = RadioValue>({
  value,
  className,
  style,
  disabled,
  required,
  readOnly,
  onChange,
  onClick,
  onKeyDown,
  ...props
}: RadioButtonProps<Value>) {
  const group = useContext(RadioContext);
  if (!group) throw new Error('RadioButton must be inside RadioGroup');
  const immutable = group.readOnly === true || readOnly === true;
  return (
    <span className={cx('tumaet-ui-radio-button', className)} style={style}>
      <input
        {...props}
        type="radio"
        className="tumaet-ui-radio-button-input"
        name={group.name}
        form={group.form}
        value={value}
        checked={group.value === undefined ? undefined : group.value === value}
        defaultChecked={group.value === undefined ? group.defaultValue === value : undefined}
        disabled={group.disabled === true || disabled}
        required={group.required === true || required}
        readOnly={immutable}
        onChange={(event) => {
          if (immutable) return;
          onChange?.(event);
          group.onValueChange?.(value, event);
        }}
        onClick={(event) => {
          onClick?.(event);
          if (immutable) event.preventDefault();
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          // HTML radio readOnly does not veto arrow activation. Leave all other navigation native.
          if (immutable && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key))
            event.preventDefault();
        }}
      />
      <span className="tumaet-ui-radio-button-box" aria-hidden="true">
        <span className="tumaet-ui-radio-button-icon" />
      </span>
    </span>
  );
}
