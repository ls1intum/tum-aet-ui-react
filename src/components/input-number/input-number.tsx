import type { ComponentPropsWithRef, ReactNode, Ref } from 'react';
import { NumberField } from '@base-ui/react/number-field';
import { cx } from '../../internal/cx';
import { ChevronDownIcon, ChevronUpIcon } from '../../internal/icons';
import { useLocale, useTranslate } from '../../internal/i18n';
import type { InputSize } from '../input/input';

type NumberOptions =
  | 'min'
  | 'max'
  | 'step'
  | 'smallStep'
  | 'largeStep'
  | 'required'
  | 'disabled'
  | 'readOnly'
  | 'name'
  | 'form'
  | 'allowWheelScrub'
  | 'snapOnStep'
  | 'allowOutOfRange'
  | 'format'
  | 'locale'
  | 'onValueChange'
  | 'onValueCommitted';
type RootProps = ComponentPropsWithRef<typeof NumberField.Root>;

const preventDisabledPress: NumberField.Increment.Props['onPointerDown'] = (event) => {
  // Native disabled fieldsets suppress clicks, but can still dispatch pointerdown.
  if (event.currentTarget.matches(':disabled')) event.preventBaseUIHandler();
};

export interface InputNumberProps
  extends
    Omit<
      NumberField.Input.Props,
      NumberOptions | 'value' | 'defaultValue' | 'onChange' | 'size' | 'type' | 'prefix' | 'children'
    >,
    Pick<NumberField.Root.Props, NumberOptions> {
  /** Controlled numeric value. Empty is null. The caller owns reset policy. */
  value: number | null;
  /** Native props and this ref target the visible, labelable input. */
  ref?: Ref<HTMLInputElement>;
  /** Root element props, render function and ref; id belongs to the input. */
  rootProps?: Omit<RootProps, NumberOptions | 'value' | 'defaultValue' | 'children' | 'id'>;
  size?: InputSize;
  invalid?: boolean;
  fluid?: boolean;
  showButtons?: boolean;
  /** Decorative affixes; use format for currency/unit parsing and formatting. */
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Overrides the translated stepper label. */
  incrementLabel?: string;
  /** Overrides the translated stepper label. */
  decrementLabel?: string;
}

/** Base UI owns parsing, formatting, stepping, holding and form serialization. */
export function InputNumber({
  value,
  onValueChange,
  onValueCommitted,
  min,
  max,
  step,
  smallStep,
  largeStep,
  required,
  disabled,
  readOnly,
  name,
  form,
  allowWheelScrub,
  snapOnStep,
  allowOutOfRange,
  format,
  locale,
  rootProps,
  size = 'default',
  invalid = false,
  fluid = false,
  showButtons = false,
  prefix,
  suffix,
  incrementLabel,
  decrementLabel,
  className,
  id,
  'aria-invalid': ariaInvalid,
  'aria-roledescription': roleDescription,
  ...inputProps
}: InputNumberProps) {
  const providerLocale = useLocale();
  const translate = useTranslate();
  const { className: rootClassName, ...rootRest } = rootProps ?? {};
  const resolvedInvalid = ariaInvalid ?? (invalid || undefined);
  return (
    <NumberField.Root
      {...rootRest}
      id={id}
      value={value}
      onValueChange={onValueChange}
      onValueCommitted={onValueCommitted}
      min={min}
      max={max}
      step={step}
      smallStep={smallStep}
      largeStep={largeStep}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      name={name}
      form={form}
      allowWheelScrub={allowWheelScrub}
      snapOnStep={snapOnStep}
      allowOutOfRange={allowOutOfRange}
      format={format}
      locale={locale ?? providerLocale}
      className={
        typeof rootClassName === 'function'
          ? (state) => cx('tumaet-ui-input-number', rootClassName(state))
          : cx('tumaet-ui-input-number', rootClassName)
      }
      data-fluid={fluid || undefined}
      data-buttons={showButtons || undefined}
    >
      {prefix !== null && prefix !== undefined && (
        <span className="tumaet-ui-input-number-prefix" aria-hidden="true">
          {prefix}
        </span>
      )}
      <NumberField.Input
        {...inputProps}
        form={form}
        data-size={size}
        aria-invalid={resolvedInvalid}
        aria-roledescription={roleDescription ?? translate('tumAetUi.inputNumber.roleDescription')}
        data-invalid={invalid || resolvedInvalid === true || resolvedInvalid === 'true' || undefined}
        className={
          typeof className === 'function'
            ? (state) => cx('tumaet-ui-input', 'tumaet-ui-input-number-input', className(state))
            : cx('tumaet-ui-input', 'tumaet-ui-input-number-input', className)
        }
      />
      {suffix !== null && suffix !== undefined && (
        <span className="tumaet-ui-input-number-suffix" aria-hidden="true">
          {suffix}
        </span>
      )}
      {showButtons ? (
        <span className="tumaet-ui-input-number-button-group">
          <NumberField.Increment
            onPointerDown={preventDisabledPress}
            aria-label={incrementLabel ?? translate('tumAetUi.inputNumber.increment')}
            className="tumaet-ui-input-number-button tumaet-ui-input-number-increment"
          >
            <ChevronUpIcon />
          </NumberField.Increment>
          <NumberField.Decrement
            onPointerDown={preventDisabledPress}
            aria-label={decrementLabel ?? translate('tumAetUi.inputNumber.decrement')}
            className="tumaet-ui-input-number-button tumaet-ui-input-number-decrement"
          >
            <ChevronDownIcon />
          </NumberField.Decrement>
        </span>
      ) : null}
    </NumberField.Root>
  );
}
