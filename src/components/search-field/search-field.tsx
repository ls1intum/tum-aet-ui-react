import { useMemo, useRef, type CSSProperties, type ChangeEvent, type Ref } from 'react';
import { cx } from '../../internal/cx';
import { SearchIcon, XIcon } from '../../internal/icons';
import { useTranslate } from '../../internal/i18n';
import { mergeRefs } from '../../internal/merge-refs';
import { Input, type InputProps } from '../input/input';

export interface SearchFieldProps extends Omit<
  InputProps,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'className' | 'style' | 'ref'
> {
  /** Controlled term. The caller owns reset policy. */
  value: string;
  /** Called on every keystroke and on clear with the new term. */
  onValueChange?: (value: string) => void;
  /** Defaults to the translated "Search". Also the accessible name when no id or explicit ARIA label is supplied. */
  placeholder?: string;
  /** Class of the wrapper element. */
  className?: string;
  /** Style of the wrapper element. */
  style?: CSSProperties;
  /** Class of the inner `<input>`. */
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

/** Text field for filtering a view: leading magnifier and a clear button once there is a term. Native props go to the `<input type="search">`. */
export function SearchField({
  value,
  onValueChange,
  placeholder,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': labelledBy,
  className,
  style,
  inputClassName,
  disabled,
  readOnly,
  ref,
  ...rest
}: SearchFieldProps) {
  const t = useTranslate();
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedInputRef = useMemo(() => mergeRefs(inputRef, ref), [ref]);
  const placeholderText = placeholder ?? t('tumAetUi.searchField.placeholder');

  return (
    <div className={cx('tumaet-ui-search-field', className)} style={style}>
      <span className="tumaet-ui-search-field-icon" aria-hidden="true">
        <SearchIcon />
      </span>
      <Input
        {...rest}
        id={id}
        ref={mergedInputRef}
        type="search"
        className={inputClassName}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholderText}
        // With an explicit id or aria-labelledby, the caller supplies the label association.
        aria-label={
          (labelledBy !== undefined && labelledBy !== '') || id !== undefined
            ? ariaLabel
            : (ariaLabel ?? placeholderText)
        }
        aria-labelledby={labelledBy}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange?.(event.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="tumaet-ui-search-field-clear"
          disabled={disabled === true || readOnly === true}
          aria-label={t('tumAetUi.searchField.clear')}
          onClick={() => {
            onValueChange?.('');
            inputRef.current?.focus();
          }}
        >
          <XIcon />
        </button>
      ) : null}
    </div>
  );
}
