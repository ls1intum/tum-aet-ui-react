import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type Ref,
} from 'react';
import { cx } from '../../internal/cx';
import { ChevronDownIcon, ChevronUpIcon } from '../../internal/icons';
import { useLocale } from '../../internal/i18n';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';
import { Input } from '../input/input';

interface NumberSyntax {
  digitBySymbol: ReadonlyMap<string, string>;
  digitSymbols: readonly string[];
  groupSeparators: readonly string[];
  decimalSeparators: readonly string[];
  minusSigns: readonly string[];
}

export interface InputNumberProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'size'
  | 'type'
  | 'prefix'
  | 'min'
  | 'max'
  | 'step'
  | 'className'
  | 'style'
  | 'role'
> {
  /** Current value; `null` is empty. Omit for an uncontrolled field. */
  value?: number | null;
  /** Initial value of an uncontrolled field. */
  defaultValue?: number | null;
  /** Called with the new number, or `null` when the field is emptied, on every keystroke, step and clamp. */
  onChange?: (value: number | null) => void;
  /** Lower bound, applied on blur and when stepping. */
  min?: number;
  /** Upper bound, applied on blur and when stepping. */
  max?: number;
  /** Increment of the stepper buttons and ArrowUp / ArrowDown. */
  step?: number;
  /** Steps land on the next multiple of the step, like the native `stepUp`/`stepDown`. */
  snapToStep?: boolean;
  /** Shows increment and decrement buttons (hidden from assistive technology; the keyboard steps with the arrow keys). */
  showButtons?: boolean;
  /** Text before the number. */
  prefix?: string;
  /** Text after the number. */
  suffix?: string;
  /** Marks the field invalid. */
  invalid?: boolean;
  /** Expands the field to the available width. */
  fluid?: boolean;
  /** Locale-specific digit grouping, for example `1,234`. */
  useGrouping?: boolean;
  /** `0` keeps the field integer-only; fractions are truncated (not rounded) to this many digits. */
  maxFractionDigits?: number;
  /** Locale for formatting and parsing; defaults to the provider locale, then the browser. */
  locale?: string;
  /** Extra symbols accepted as decimal separator while typing. */
  acceptedDecimalSeparators?: readonly string[];
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: React.CSSProperties;
  /** Class of the inner `<input>`. */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

function createSyntax(locale: string | undefined, accepted: readonly string[]): NumberSyntax {
  const formatter = new Intl.NumberFormat(locale, { useGrouping: true, maximumFractionDigits: 0 });
  const digitBySymbol = new Map<string, string>();
  for (let digit = 0; digit <= 9; digit++) {
    const localized = formatter
      .formatToParts(digit)
      .filter((p) => p.type === 'integer')
      .map((p) => p.value)
      .join('');
    digitBySymbol.set(String(digit), String(digit));
    digitBySymbol.set(localized, String(digit));
  }
  const longestFirst = (a: string, b: string) => b.length - a.length;
  return {
    digitBySymbol,
    digitSymbols: [...digitBySymbol.keys()].sort(longestFirst),
    groupSeparators: [
      ...new Set(
        formatter
          .formatToParts(123456789)
          .filter((p) => p.type === 'group')
          .map((p) => p.value),
      ),
    ].sort(longestFirst),
    minusSigns: [
      ...new Set([
        '-',
        ...formatter
          .formatToParts(-1)
          .filter((p) => p.type === 'minusSign')
          .map((p) => p.value),
      ]),
    ].sort(longestFirst),
    decimalSeparators: [
      ...new Set([
        ...new Intl.NumberFormat(locale, { minimumFractionDigits: 1 })
          .formatToParts(1.1)
          .filter((p) => p.type === 'decimal')
          .map((p) => p.value),
        ...accepted,
      ]),
    ].sort(longestFirst),
  };
}

const matchAt = (text: string, index: number, candidates: readonly string[]) =>
  candidates.find((c) => c.length > 0 && text.startsWith(c, index));
const charLength = (text: string, index: number) => ((text.codePointAt(index) ?? 0) > 0xffff ? 2 : 1);

/** Numeric text field with locale grouping, affixes, optional decimals and step controls (`role="spinbutton"`). */
export function InputNumber({
  value,
  defaultValue,
  onChange,
  min,
  max,
  step = 1,
  snapToStep = false,
  showButtons = false,
  prefix = '',
  suffix = '',
  invalid,
  fluid = false,
  useGrouping = true,
  maxFractionDigits = 0,
  locale,
  acceptedDecimalSeparators,
  className,
  style,
  inputClassName,
  disabled,
  readOnly,
  ref,
  onBlur,
  onKeyDown,
  ...rest
}: InputNumberProps) {
  const providerLocale = useLocale();
  const effectiveLocale = locale ?? providerLocale;
  const [current, setCurrent] = useControllable<number | null>(value, defaultValue ?? null, onChange);
  /** Raw text kept while a fraction (`12.`, `12.50`) or a lone minus sign is still being typed. */
  const [draft, setDraft] = useState<{ text: string; forValue: number | null } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accepted = acceptedDecimalSeparators;
  const syntax = useMemo(() => createSyntax(effectiveLocale, accepted ?? []), [effectiveLocale, accepted]);
  const formatter = useMemo(
    () => new Intl.NumberFormat(effectiveLocale, { useGrouping, maximumFractionDigits: maxFractionDigits }),
    [effectiveLocale, useGrouping, maxFractionDigits],
  );

  const format = (n: number | null) =>
    n === null || Number.isNaN(n) ? '' : `${prefix}${formatter.format(n)}${suffix}`;
  const strip = (text: string) => {
    let body = text;
    if (prefix !== '' && body.startsWith(prefix)) body = body.slice(prefix.length);
    if (suffix !== '' && body.endsWith(suffix)) body = body.slice(0, body.length - suffix.length);
    return body;
  };

  const parse = (text: string): number | null => {
    const body = strip(text);
    let integer = '';
    let fraction = '';
    let negative = false;
    let inFraction = false;
    for (let i = 0; i < body.length;) {
      const digit = matchAt(body, i, syntax.digitSymbols);
      if (digit !== undefined) {
        const ascii = syntax.digitBySymbol.get(digit) ?? '';
        if (inFraction) {
          if (fraction.length < maxFractionDigits) fraction += ascii;
        } else integer += ascii;
        i += digit.length;
        continue;
      }
      const minus = matchAt(body, i, syntax.minusSigns);
      if (minus !== undefined) {
        negative ||= integer.length === 0;
        i += minus.length;
        continue;
      }
      if (maxFractionDigits > 0 && !inFraction) {
        const decimal = matchAt(body, i, syntax.decimalSeparators);
        if (decimal !== undefined) {
          inFraction = true;
          i += decimal.length;
          continue;
        }
      }
      const group = matchAt(body, i, syntax.groupSeparators);
      i += group?.length ?? charLength(body, i);
    }
    if (integer === '' && fraction === '') return null;
    const parsed = Number.parseFloat(
      `${negative ? '-' : ''}${integer === '' ? '0' : integer}.${fraction === '' ? '0' : fraction}`,
    );
    return Number.isNaN(parsed) ? null : parsed;
  };

  const countDigits = (text: string) => {
    let count = 0;
    for (let i = 0; i < text.length;) {
      const digit = matchAt(text, i, syntax.digitSymbols);
      if (digit !== undefined) {
        count++;
        i += digit.length;
      } else i += charLength(text, i);
    }
    return count;
  };

  const caretAfterDigits = (text: string, digits: number) => {
    const start = prefix.length;
    if (digits <= 0) return start;
    const end = text.length - suffix.length;
    let seen = 0;
    for (let i = start; i < end;) {
      const digit = matchAt(text, i, syntax.digitSymbols);
      if (digit !== undefined && ++seen === digits) return i + digit.length;
      i += digit?.length ?? charLength(text, i);
    }
    return end;
  };

  /** True while a fraction is being entered that reformatting would swallow: `12.` or `12.50`. */
  const fractionInProgress = (text: string) => {
    if (maxFractionDigits === 0) return false;
    const body = strip(text);
    for (let i = 0; i < body.length;) {
      const decimal = matchAt(body, i, syntax.decimalSeparators);
      if (decimal !== undefined) {
        let ascii = '';
        const afterDecimal = body.slice(i + decimal.length);
        for (let j = 0; j < afterDecimal.length;) {
          const d = matchAt(afterDecimal, j, syntax.digitSymbols);
          if (d !== undefined) {
            ascii += syntax.digitBySymbol.get(d) ?? '';
            j += d.length;
          } else j += charLength(afterDecimal, j);
        }
        return ascii === '' || ascii.endsWith('0');
      }
      i += charLength(body, i);
    }
    return false;
  };

  const clamp = (n: number) => {
    let result = n;
    if (min !== undefined && result < min) result = min;
    if (max !== undefined && result > max) result = max;
    return result;
  };

  const steppedValue = (base: number, delta: number) => {
    const size = Math.abs(delta);
    if (!snapToStep || size === 0) return base + delta;
    const position = base / size;
    if (Math.abs(position - Math.round(position)) < 1e-9) return base + delta;
    return (delta > 0 ? Math.ceil(position) : Math.floor(position)) * size;
  };

  const stepBy = (delta: number) => {
    if (disabled === true || readOnly === true) return;
    const next = clamp(Number(steppedValue(current ?? 0, delta).toFixed(maxFractionDigits)));
    setDraft(null);
    setCurrent(next);
    inputRef.current?.focus();
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    const caret = el.selectionStart ?? el.value.length;
    const digitsBeforeCaret = countDigits(el.value.slice(prefix.length, caret));
    const parsed = parse(el.value);
    setCurrent(parsed);
    const loneMinus =
      parsed === null && syntax.minusSigns.some((m) => el.value.includes(m)) && countDigits(el.value) === 0;
    if (loneMinus || fractionInProgress(el.value)) {
      setDraft({ text: el.value, forValue: parsed });
      return;
    }
    setDraft(null);
    const formatted = format(parsed);
    el.value = formatted;
    const next = caretAfterDigits(formatted, digitsBeforeCaret);
    el.setSelectionRange(next, next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      stepBy(step);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      stepBy(-step);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(event);
    if (current !== null) {
      const clamped = clamp(current);
      if (clamped !== current) setCurrent(clamped);
    }
    setDraft(null);
  };

  const displayText = draft?.forValue === current ? draft.text : format(current);
  const buttonsDisabled = disabled === true || readOnly === true;

  return (
    <span
      className={cx('tumaet-ui-input-number', className)}
      style={style}
      data-fluid={fluid || undefined}
      data-buttons={showButtons || undefined}
    >
      <Input
        {...rest}
        ref={mergeRefs(inputRef, ref)}
        type="text"
        role="spinbutton"
        inputMode={maxFractionDigits > 0 ? 'decimal' : 'numeric'}
        className={cx('tumaet-ui-input-number-input', inputClassName)}
        value={displayText}
        disabled={disabled}
        readOnly={readOnly}
        invalid={invalid}
        aria-valuenow={current ?? undefined}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={format(current) || undefined}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {showButtons ? (
        <span className="tumaet-ui-input-number-button-group">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            disabled={buttonsDisabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stepBy(step)}
            className="tumaet-ui-input-number-button tumaet-ui-input-number-increment"
          >
            <ChevronUpIcon />
          </button>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden
            disabled={buttonsDisabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => stepBy(-step)}
            className="tumaet-ui-input-number-button tumaet-ui-input-number-decrement"
          >
            <ChevronDownIcon />
          </button>
        </span>
      ) : null}
    </span>
  );
}
