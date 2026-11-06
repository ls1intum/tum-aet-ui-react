import {
  createContext,
  useContext,
  useId,
  type ChangeEvent,
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { useControllable } from '../../internal/use-controllable';

type RadioValue = string | number;

interface RadioGroupContextValue {
  name: string;
  value: RadioValue | null;
  disabled: boolean;
  onSelect: (value: RadioValue) => void;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Selected value; `null` is none. Omit for an uncontrolled group. */
  value?: RadioValue | null;
  /** Initially selected value of an uncontrolled group. */
  defaultValue?: RadioValue | null;
  /** Called with the value of the newly selected radio. */
  onChange?: (value: RadioValue) => void;
  /** Shared native `name`. Generated when omitted. */
  name?: string;
  /** Disables every radio of the group. */
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * `role="radiogroup"` around `RadioButton`s. The radios are native inputs sharing a `name`, so the browser
 * provides the WAI-ARIA keyboard model: one tab stop, arrow keys move and select, wrapping, skipping disabled.
 * Give the group an accessible name with `aria-label` or `aria-labelledby`.
 */
export function RadioGroup({
  value,
  defaultValue = null,
  onChange,
  name,
  disabled = false,
  className,
  ...rest
}: RadioGroupProps) {
  const generated = useId();
  const [current, setCurrent] = useControllable<RadioValue | null>(
    value,
    defaultValue,
    (next) => next !== null && onChange?.(next),
  );
  const ctx: RadioGroupContextValue = { name: name ?? generated, value: current, disabled, onSelect: setCurrent };
  return (
    <RadioGroupContext value={ctx}>
      <div
        role="radiogroup"
        aria-disabled={disabled || undefined}
        {...rest}
        className={cx('tumaet-ui-radio-group', className)}
      />
    </RadioGroupContext>
  );
}

export interface RadioButtonProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'value' | 'checked' | 'defaultChecked' | 'onChange' | 'className' | 'style'
> {
  /** Value of this option. */
  value?: RadioValue;
  /** Only without a RadioGroup. Omit it for an uncontrolled radio, which the browser keeps exclusive within its `name`. */
  checked?: boolean;
  /** Only without a RadioGroup. */
  defaultChecked?: boolean;
  /** Called when this radio becomes selected. */
  onChange?: (value: RadioValue | undefined, event: ChangeEvent<HTMLInputElement>) => void;
  /** Marks the radio invalid (set aria-invalid for external errors). */
  invalid?: boolean;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
}

/** Native radio with the TUM AET UI look. Inside a `RadioGroup` selection comes from the group. */
export function RadioButton({
  value,
  checked,
  defaultChecked,
  onChange,
  invalid,
  disabled,
  name,
  className,
  style,
  ref,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: RadioButtonProps) {
  const group = useContext(RadioGroupContext);
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true';
  const isChecked = group ? value !== undefined && group.value === value : checked;
  const isDisabled = disabled === true || group?.disabled === true;

  return (
    <span
      className={cx('tumaet-ui-radio-button', className)}
      style={style}
      data-checked={isChecked === true ? true : undefined}
      data-disabled={isDisabled || undefined}
      data-invalid={isInvalid || undefined}
    >
      {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props -- the field's invalid state is deliberately exposed on the native radio */}
      <input
        {...rest}
        ref={ref}
        type="radio"
        id={controlId}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (invalid === true ? true : undefined)}
        className="tumaet-ui-radio-button-input"
        name={group?.name ?? name}
        value={value === undefined ? undefined : String(value)}
        // Uncontrolled standalone radios stay native, so same-named radios uncheck each other without React state.
        {...(isChecked === undefined ? { defaultChecked } : { checked: isChecked })}
        disabled={isDisabled}
        onChange={(event) => {
          if (group && value !== undefined) group.onSelect(value);
          onChange?.(value, event);
        }}
      />
      <span className="tumaet-ui-radio-button-box" aria-hidden="true">
        <span className="tumaet-ui-radio-button-icon" />
      </span>
    </span>
  );
}
