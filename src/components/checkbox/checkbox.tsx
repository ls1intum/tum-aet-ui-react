import { useLayoutEffect, useMemo, useRef, type ComponentPropsWithRef } from 'react';
import { cx } from '../../internal/cx';
import { CheckIcon, MinusIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';

export type CheckboxProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> & {
  /** Applied to the native input property after each render; activation clears it natively. */
  indeterminate?: boolean;
};

/** Native checkbox. className/style target the visual wrapper; all other props and ref target the input. */
export function Checkbox({
  className,
  style,
  indeterminate = false,
  ref,
  readOnly = false,
  onClick,
  onChange,
  ...props
}: CheckboxProps) {
  const input = useRef<HTMLInputElement>(null);
  const inputRef = useMemo(() => mergeRefs(input, ref), [ref]);
  useLayoutEffect(() => {
    if (input.current) input.current.indeterminate = indeterminate;
  });
  return (
    <span className={cx('tumaet-ui-checkbox', className)} style={style}>
      <input
        {...props}
        ref={inputRef}
        type="checkbox"
        className="tumaet-ui-checkbox-input"
        readOnly={readOnly}
        aria-readonly={readOnly ? true : props['aria-readonly']}
        onChange={readOnly ? undefined : onChange}
        onClick={(event) => {
          onClick?.(event);
          if (readOnly) event.preventDefault();
        }}
      />
      <span className="tumaet-ui-checkbox-box" aria-hidden="true">
        <CheckIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon tumaet-ui-checkbox-check" />
        <MinusIcon className="tumaet-ui-icon tumaet-ui-checkbox-icon tumaet-ui-checkbox-minus" />
      </span>
    </span>
  );
}
