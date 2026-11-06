import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../internal/cx';

export type ToggleSwitchProps = Omit<ComponentPropsWithRef<'input'>, 'type' | 'role' | 'children'>;

/** Native checkbox with switch semantics. className/style target the wrapper; other props/ref target the input. */
export function ToggleSwitch({ className, style, readOnly = false, onClick, onChange, ...props }: ToggleSwitchProps) {
  return (
    <span className={cx('tumaet-ui-toggle-switch', className)} style={style}>
      <input
        {...props}
        type="checkbox"
        role="switch"
        className="tumaet-ui-toggle-switch-input"
        readOnly={readOnly}
        aria-readonly={readOnly ? true : props['aria-readonly']}
        onChange={readOnly ? undefined : onChange}
        onClick={(event) => {
          onClick?.(event);
          if (readOnly) event.preventDefault();
        }}
      />
      <span className="tumaet-ui-toggle-switch-track" aria-hidden="true">
        <span className="tumaet-ui-toggle-switch-handle" />
      </span>
    </span>
  );
}
