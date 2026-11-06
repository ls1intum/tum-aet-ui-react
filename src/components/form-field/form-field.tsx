import { useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { cx } from '../../internal/cx';

export type FieldProps = ComponentPropsWithRef<'div'>;
export type FieldLabelProps = ComponentPropsWithRef<'label'>;
export type FieldDescriptionProps = ComponentPropsWithRef<'p'>;
export type FieldErrorProps = ComponentPropsWithRef<'div'>;

/** Presentation only. Associate the label, control and descriptions explicitly. */
export function Field({ className, ...props }: FieldProps) {
  return <div {...props} className={cx('tumaet-ui-form-field', className)} />;
}

export function FieldLabel({ className, htmlFor, ...props }: FieldLabelProps) {
  return <label {...props} htmlFor={htmlFor} className={cx('tumaet-ui-form-field-label', className)} />;
}

export function FieldDescription({ className, ...props }: FieldDescriptionProps) {
  return <p {...props} className={cx('tumaet-ui-form-field-hint', className)} />;
}

/** Render when the caller has an error; native validity is never inferred. */
export function FieldError({ className, role = 'alert', ...props }: FieldErrorProps) {
  return <div {...props} role={role} className={cx('tumaet-ui-form-field-error', className)} />;
}

export interface FormFieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FormFieldProps extends Omit<FieldProps, 'children'> {
  label?: ReactNode;
  /** Decorative marker only; set `required` on the control for native validation. */
  required?: boolean;
  /** Helper text shown while valid. */
  hint?: ReactNode;
  /** Caller-owned validation state. */
  invalid?: boolean;
  /** Error text shown while invalid. */
  error?: ReactNode;
  /** Spread the supplied native associations onto one labelable control. */
  children: (props: FormFieldControlProps) => ReactNode;
}

const isPresent = (node: ReactNode) =>
  node !== undefined &&
  node !== null &&
  node !== false &&
  node !== '' &&
  !(typeof node === 'string' && node.trim() === '');

/**
 * Concise composition for one native labelable control. For custom IDs, multiple
 * controls or nonlabelable widget roots, compose the flat Field parts explicitly.
 */
export function FormField({
  label,
  required = false,
  hint,
  invalid = false,
  error,
  className,
  children,
  ...rest
}: FormFieldProps) {
  const base = useId();
  const controlId = `${base}-control`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const showHint = !invalid && isPresent(hint);
  const showError = invalid && isPresent(error);
  const describedBy = showError ? errorId : undefined;
  return (
    <Field {...rest} data-invalid={invalid || undefined} className={className}>
      {isPresent(label) ? (
        <FieldLabel htmlFor={controlId}>
          {label}
          {required ? (
            <span className="tumaet-ui-form-field-required" aria-hidden="true">
              *
            </span>
          ) : null}
        </FieldLabel>
      ) : null}
      <div className="tumaet-ui-form-field-control">
        {children({
          id: controlId,
          'aria-describedby': showHint ? hintId : describedBy,
          'aria-invalid': invalid || undefined,
        })}
      </div>
      {showHint ? <FieldDescription id={hintId}>{hint}</FieldDescription> : null}
      {showError ? <FieldError id={errorId}>{error}</FieldError> : null}
    </Field>
  );
}
