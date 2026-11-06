import type { InputHTMLAttributes, Ref, TextareaHTMLAttributes } from 'react';
import { cx } from '../../internal/cx';

export type InputSize = 'small' | 'default' | 'large';

interface InputCommon {
  /** Size variant: `small`, `default` or `large`. */
  size?: InputSize;
  /** Caller-owned invalid appearance and default aria-invalid. */
  invalid?: boolean;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, InputCommon {
  ref?: Ref<HTMLInputElement>;
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, InputCommon {
  ref?: Ref<HTMLTextAreaElement>;
}

/** Native input props, events, refs, validity and reset with AET appearance. */
export function Input({
  size = 'default',
  invalid = false,
  className,
  'aria-invalid': ariaInvalid,
  ...rest
}: InputProps) {
  const resolvedInvalid = ariaInvalid ?? (invalid || undefined);
  return (
    <input
      {...rest}
      data-size={size}
      className={cx('tumaet-ui-input', className)}
      aria-invalid={resolvedInvalid}
      data-invalid={invalid || resolvedInvalid === true || resolvedInvalid === 'true' || undefined}
    />
  );
}

/** Native textarea with the same appearance as Input. */
export function Textarea({
  size = 'default',
  invalid = false,
  className,
  'aria-invalid': ariaInvalid,
  ...rest
}: TextareaProps) {
  const resolvedInvalid = ariaInvalid ?? (invalid || undefined);
  return (
    <textarea
      {...rest}
      data-size={size}
      className={cx('tumaet-ui-input', className)}
      aria-invalid={resolvedInvalid}
      data-invalid={invalid || resolvedInvalid === true || resolvedInvalid === 'true' || undefined}
    />
  );
}
