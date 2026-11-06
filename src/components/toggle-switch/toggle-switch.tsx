import { useId, type ChangeEvent, type CSSProperties, type InputHTMLAttributes, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { useControllable } from '../../internal/use-controllable';

export interface ToggleSwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'role' | 'checked' | 'defaultChecked' | 'onChange' | 'className' | 'style'
> {
  /** State of a controlled switch. Omit it for an uncontrolled one. */
  checked?: boolean;
  /** Initial state of an uncontrolled switch. */
  defaultChecked?: boolean;
  /** Called with the new state and the originating event. */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /** Marks the switch invalid (set aria-invalid for external errors). */
  invalid?: boolean;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
}

/** On/off switch (`<input type="checkbox" role="switch">`). Needs an accessible name: `<label htmlFor>`, `aria-label` or `aria-labelledby`. */
export function ToggleSwitch({
  checked,
  defaultChecked = false,
  onChange,
  invalid,
  disabled,
  className,
  style,
  ref,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: ToggleSwitchProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true';
  const [isChecked, setChecked] = useControllable<boolean>(checked, defaultChecked);
  return (
    <span
      className={cx('tumaet-ui-toggle-switch', className)}
      style={style}
      data-checked={isChecked}
      data-disabled={disabled === true ? true : undefined}
      data-invalid={isInvalid || undefined}
    >
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        role="switch"
        id={controlId}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (invalid === true ? true : undefined)}
        className="tumaet-ui-toggle-switch-input"
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => {
          setChecked(event.target.checked);
          onChange?.(event.target.checked, event);
        }}
      />
      <span className="tumaet-ui-toggle-switch-handle" aria-hidden="true" />
    </span>
  );
}
