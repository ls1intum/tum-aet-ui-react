import {
  useLayoutEffect,
  useRef,
  useId,
  type ChangeEvent,
  type CSSProperties,
  type InputHTMLAttributes,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { CheckIcon, MinusIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'checked' | 'defaultChecked' | 'onChange' | 'className' | 'style'
> {
  /** Checked state of a controlled checkbox. Omit it for an uncontrolled one. */
  checked?: boolean;
  /** Initial state of an uncontrolled checkbox. */
  defaultChecked?: boolean;
  /** Called with the new state and the originating event. */
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
  /** Shows the partial-selection dash. Purely visual and exposed as the native indeterminate state; `checked` is unchanged. */
  indeterminate?: boolean;
  /** Marks the checkbox invalid (set aria-invalid for external errors). */
  invalid?: boolean;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  ref?: Ref<HTMLInputElement>;
}

/**
 * Native checkbox with the TUM AET UI look. Native props (`id`, `name`, `value`, `aria-*`, ...) go to the `<input>`;
 * `className` and `style` go to the wrapper. Label it with a `<label htmlFor>` or `aria-label`.
 */
export function Checkbox({
  checked,
  defaultChecked = false,
  onChange,
  indeterminate = false,
  invalid,
  disabled,
  className,
  style,
  ref,
  id,
  'aria-describedby': describedBy,
  'aria-invalid': ariaInvalid,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const isInvalid = invalid === true || ariaInvalid === true || ariaInvalid === 'true';
  const [isChecked, setChecked] = useControllable<boolean>(checked, defaultChecked);
  const inputRef = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate, isChecked]);

  let icon = null;
  if (indeterminate) icon = <MinusIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon" />;
  else if (isChecked) icon = <CheckIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon" />;

  return (
    <span
      className={cx('tumaet-ui-checkbox', className)}
      style={style}
      data-checked={isChecked || undefined}
      data-indeterminate={indeterminate || undefined}
      data-disabled={disabled === true || undefined}
      data-invalid={isInvalid || undefined}
    >
      <input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        type="checkbox"
        id={controlId}
        aria-describedby={describedBy}
        aria-invalid={ariaInvalid ?? (invalid === true ? true : undefined)}
        className="tumaet-ui-checkbox-input"
        checked={isChecked}
        disabled={disabled}
        onChange={(event) => {
          // A click makes the browser drop the native mixed state; the parent owns it, so put it back.
          event.target.indeterminate = indeterminate;
          setChecked(event.target.checked);
          onChange?.(event.target.checked, event);
        }}
      />
      <span className="tumaet-ui-checkbox-box" aria-hidden="true">
        {icon}
      </span>
    </span>
  );
}
