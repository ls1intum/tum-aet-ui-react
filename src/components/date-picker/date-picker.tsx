import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FocusEventHandler,
  type HTMLAttributes,
  type Ref,
} from 'react';
import { Popover } from '@base-ui/react/popover';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { CalendarIcon, XIcon } from '../../internal/icons';
import { mergeRefs } from '../../internal/merge-refs';
import { useControllable } from '../../internal/use-controllable';
import { Button } from '../button/button';
import {
  Tooltip,
  TooltipArrow,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
} from '../tooltip/tooltip';
import { Calendar } from './calendar';
import {
  combineDateAndTime,
  formatDisplay,
  matchesDisplayFormat,
  nearestAllowedDay,
  normalizeDisplayText,
  parseDisplay,
  startOfDay,
  startOfMonth,
  valuesEqual,
} from './date-picker-utils';
import { ClockIcon, GlobeIcon } from './icons';
import { TimeControls } from './time-controls';

export interface DatePickerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue' | 'onBlur' | 'id' | 'children'
> {
  /** The committed value. Text that is not a valid date never changes it. `null` is empty. */
  value?: Date | null;
  /** The initial value of an uncontrolled picker. */
  defaultValue?: Date | null;
  /** Called with the new value, or `null` when the field is emptied. */
  onValueChange?: (value: Date | null) => void;
  /** Id of the text field. The label's `htmlFor` points here. */
  id?: string;
  /** Marks the field invalid for an error the consumer explains, such as an end before the start. */
  'aria-invalid'?: HTMLAttributes<HTMLDivElement>['aria-invalid'];
  /** Disables the field, the calendar button and the time steppers, and closes the calendar if it is open. */
  disabled?: boolean;
  /** Edit `HH:mm` without a calendar. The date of the value is kept, or today is used when empty. */
  timeOnly?: boolean;
  /** Edit a date (`DD.MM.YYYY`) with no time. The value is kept at the start of the day. */
  dateOnly?: boolean;
  /** Renders the calendar and time steppers in place, without a text field or popup. */
  inline?: boolean;
  /** Opens the calendar when the field itself is clicked, not only its icon. */
  openOnClick?: boolean;
  /** Month the calendar opens on while the field is empty. A held value wins. Defaults to the current month. */
  startAt?: Date;
  /** Days before this day are disabled in the calendar. Typed text is not checked against it, the consumer validates the value. */
  min?: Date;
  /** Days after this day are disabled in the calendar. See `min`. */
  max?: Date;
  /** Shows text errors only after the field loses focus, while `onInputValidityChange` keeps reporting during typing. */
  validateOnBlur?: boolean;
  /** Hides the built-in message for text that is not a date; `aria-invalid` stays. */
  hideValidationMessage?: boolean;
  /** Shows the browser time zone as an indicator above the field. */
  showTimeZoneWarning?: boolean;
  /** Reports whether the typed text is a valid entry, independent of `aria-invalid`. */
  onInputValidityChange?: (valid: boolean) => void;
  /** Called when the text field loses focus. */
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** Replaces the format hint (`DD.MM.YYYY HH:mm`, `DD.MM.YYYY` or `HH:mm`) shown in an empty field. */
  placeholder?: string;
  /** Ref of the text field, for `focus()`. `ref` points at the root element. */
  inputRef?: Ref<HTMLInputElement>;
  /** Destination for the popup and time-zone tooltip. Place the host within the intended theme, outside clipping containers. */
  portalContainer?: Popover.Portal.Props['container'];
  ref?: Ref<HTMLDivElement>;
}

/** Local date/time editor with a nonmodal calendar popup. Done and Escape return focus to the text field.
 * `defaultValue` initializes domain state; native form submission and reset are not exposed. Controlled reset is caller-owned.
 */
export function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  id: idProp,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ownDescribedBy,
  'aria-invalid': ownInvalid,
  'aria-required': ariaRequired,
  disabled = false,
  timeOnly = false,
  dateOnly = false,
  inline = false,
  openOnClick = false,
  startAt,
  min,
  max,
  validateOnBlur = false,
  hideValidationMessage = false,
  showTimeZoneWarning = false,
  onInputValidityChange,
  onBlur,
  placeholder,
  inputRef,
  className,
  portalContainer,
  ref,
  ...rest
}: DatePickerProps) {
  const translate = useTranslate();
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const panelId = `${id}-dialog`;
  const triggerId = `${id}-trigger`;
  const errorId = `${id}-error`;
  const [value, setValue] = useControllable<Date | null>(valueProp, defaultValue, onValueChange);
  const valueKey = value ? formatDisplay(value, timeOnly, dateOnly) : '';

  // Invalid text stays visible without touching the value. It is keyed by the displayed value, so an equal-but-new Date does not wipe it,
  // while a different value from outside replaces it.
  const [draft, setDraft] = useState<{ base: string; text: string } | null>(null);
  if (draft && draft.base !== valueKey) setDraft(null);
  const activeDraft = draft?.base === valueKey ? draft : null;
  const inputText = activeDraft ? activeDraft.text : valueKey;
  const textValid = !activeDraft;
  const [editing, setEditing] = useState(false);

  const [activeMonth, setActiveMonth] = useState(() => startOfMonth(value ?? startAt ?? nearestAllowedDay(min, max)));
  // The shown month follows the value when it changes, also from outside.
  const [followedKey, setFollowedKey] = useState(valueKey);
  if (followedKey !== valueKey) {
    setFollowedKey(valueKey);
    if (value) setActiveMonth(startOfMonth(value));
  }

  const [isOpenState, setIsOpenState] = useState(false);
  // A picker that is disabled while open closes for good: it must not pop open again when it is enabled later.
  if (isOpenState && (disabled || inline)) setIsOpenState(false);
  const isOpen = isOpenState && !disabled && !inline;
  const field = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement | null>(null);
  const mergedInputRef = useMemo(() => mergeRefs(input, inputRef), [inputRef]);
  const hourInput = useRef<HTMLInputElement | null>(null);
  const calendarRoot = useRef<HTMLDivElement | null>(null);

  const reportedValidity = useRef(true);
  const validityCallback = useRef(onInputValidityChange);
  useEffect(() => {
    validityCallback.current = onInputValidityChange;
  });
  useEffect(() => {
    if (reportedValidity.current === textValid) return;
    reportedValidity.current = textValid;
    validityCallback.current?.(textValid);
  }, [textValid]);

  const ownLabel = ariaLabelledBy === undefined || ariaLabelledBy === '' ? ariaLabel : undefined;
  const externallyInvalid = ownInvalid === true || ownInvalid === 'true';
  const showTextError = !textValid && (!validateOnBlur || !editing);
  const showError = externallyInvalid || showTextError;
  const showMessage = !hideValidationMessage && showTextError;
  const describedBy = [showMessage ? errorId : undefined, ownDescribedBy].filter(Boolean).join(' ') || undefined;

  let mode: 'date' | 'time' | 'datetime' = 'datetime';
  if (dateOnly) mode = 'date';
  else if (timeOnly) mode = 'time';
  const placeholderKey = {
    date: 'tumAetUi.datePicker.datePlaceholder',
    time: 'tumAetUi.datePicker.timePlaceholder',
    datetime: 'tumAetUi.datePicker.placeholder',
  }[mode];
  const dialogKey = {
    date: 'tumAetUi.datePicker.dateDialog',
    time: 'tumAetUi.datePicker.timeDialog',
    datetime: 'tumAetUi.datePicker.dialog',
  }[mode];
  const invalidKey = {
    date: 'tumAetUi.datePicker.invalidDate',
    time: 'tumAetUi.datePicker.invalidTime',
    datetime: 'tumAetUi.datePicker.invalid',
  }[mode];

  const commit = (next: Date) => {
    setDraft(null);
    if (!valuesEqual(value, next)) setValue(next);
  };

  const commitTime = (hour: number, minute: number) => {
    const next = new Date((value ?? startOfDay(new Date())).getTime());
    next.setHours(hour, minute, 0, 0);
    commit(next);
  };

  const selectDay = (day: Date) => {
    commit(dateOnly ? startOfDay(day) : combineDateAndTime(day, value ?? startOfDay(new Date())));
  };

  const onInput = (raw: string) => {
    setEditing(true);
    const parsed = parseDisplay(raw, timeOnly, value, dateOnly);
    if (parsed) {
      commit(parsed);
    } else if (!raw.trim()) {
      setDraft(null);
      if (value) setValue(null);
    } else {
      setDraft({ base: valueKey, text: raw });
    }
  };

  const onInputBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    setEditing(false);
    const trimmed = normalizeDisplayText(event.currentTarget.value);
    if (trimmed && !matchesDisplayFormat(trimmed, timeOnly, dateOnly))
      setDraft({ base: valueKey, text: event.currentTarget.value });
    onBlur?.(event);
  };

  const clear = () => {
    setDraft(null);
    if (value) setValue(null);
    input.current?.focus();
  };

  const changeOpen = (open: boolean) => {
    if (open && disabled) return;
    if (open) setActiveMonth(startOfMonth(value ?? startAt ?? nearestAllowedDay(min, max)));
    setIsOpenState(open);
  };

  const calendar = () => (
    <Calendar
      selected={value}
      min={min}
      max={max}
      activeMonth={activeMonth}
      disabled={disabled}
      ref={calendarRoot}
      onDaySelect={selectDay}
      onMonthChange={setActiveMonth}
    />
  );
  const timeControls = (
    <TimeControls
      value={value}
      disabled={disabled}
      required={ariaRequired === true || ariaRequired === 'true'}
      onCommit={commitTime}
      hourRef={hourInput}
    />
  );

  const rootProps = {
    ...rest,
    ref,
    className: cx('tumaet-ui-date-picker', className),
    'data-mode': mode,
    'data-inline': inline || undefined,
  };

  if (inline) {
    return (
      <div {...rootProps}>
        <div
          className="tumaet-ui-date-picker-inline"
          role="group"
          aria-label={ownLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ownDescribedBy}
          id={id}
        >
          {!timeOnly && calendar()}
          {!dateOnly && timeControls}
        </div>
      </div>
    );
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeZoneText = translate('tumAetUi.datePicker.timeZoneWarning', { timeZone });

  return (
    <Popover.Root open={isOpen} onOpenChange={changeOpen} triggerId={triggerId} modal={false}>
      <div {...rootProps}>
        {showTimeZoneWarning ? (
          <Tooltip>
            <TooltipTrigger
              render={
                // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- focus exposes the time-zone tooltip to keyboard users
                <span className="tumaet-ui-date-picker-timezone" tabIndex={0} role="img" aria-label={timeZoneText} />
              }
            >
              <GlobeIcon />
              <ClockIcon className="tumaet-ui-date-picker-timezone-clock" />
            </TooltipTrigger>
            <TooltipPortal container={portalContainer}>
              <TooltipPositioner>
                <TooltipPopup>
                  {timeZoneText}
                  <TooltipArrow />
                </TooltipPopup>
              </TooltipPositioner>
            </TooltipPortal>
          </Tooltip>
        ) : null}
        <div ref={field} className="tumaet-ui-date-picker-field">
          <input
            ref={mergedInputRef}
            id={id}
            type="text"
            role="combobox"
            className="tumaet-ui-date-picker-input"
            value={inputText}
            disabled={disabled}
            placeholder={placeholder ?? translate(placeholderKey)}
            autoComplete="off"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={isOpen ? panelId : undefined}
            aria-invalid={showError}
            aria-required={ariaRequired}
            aria-label={ownLabel}
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedBy}
            onChange={(event) => onInput(event.target.value)}
            onBlur={onInputBlur}
            onClick={(event) => {
              if (!event.defaultPrevented && openOnClick && !isOpen) changeOpen(true);
            }}
            onKeyDown={(event) => {
              if (
                !event.defaultPrevented &&
                event.key === 'ArrowDown' &&
                !event.altKey &&
                !event.ctrlKey &&
                !event.metaKey
              ) {
                event.preventDefault();
                changeOpen(true);
              }
            }}
          />
          {inputText !== '' && !disabled ? (
            <button
              type="button"
              className="tumaet-ui-date-picker-clear"
              onClick={clear}
              aria-label={translate('tumAetUi.datePicker.clear')}
              title={translate('tumAetUi.datePicker.clear')}
            >
              <XIcon />
            </button>
          ) : null}
          <Popover.Trigger
            id={triggerId}
            type="button"
            className="tumaet-ui-date-picker-toggle"
            disabled={disabled}
            aria-label={translate(timeOnly && !dateOnly ? 'tumAetUi.datePicker.openTime' : 'tumAetUi.datePicker.open')}
          >
            {timeOnly && !dateOnly ? <ClockIcon /> : <CalendarIcon />}
          </Popover.Trigger>
        </div>
        {showMessage ? (
          <span id={errorId} role="alert" className="tumaet-ui-date-picker-error">
            {translate(invalidKey)}
          </span>
        ) : null}
        <Popover.Portal container={portalContainer}>
          <Popover.Positioner
            anchor={field}
            side="bottom"
            align="start"
            sideOffset={4}
            className="tumaet-ui-date-picker-positioner"
          >
            <Popover.Popup
              id={panelId}
              aria-label={translate(dialogKey)}
              className="tumaet-ui-date-picker-panel"
              initialFocus={() =>
                timeOnly
                  ? hourInput.current
                  : (calendarRoot.current?.querySelector<HTMLButtonElement>('button[data-date][tabindex="0"]') ?? true)
              }
              finalFocus={input}
            >
              {!timeOnly && calendar()}
              {!dateOnly && timeControls}
              <div className="tumaet-ui-date-picker-actions">
                <Popover.Close render={<Button severity="secondary" variant="text" size="small" />}>
                  {translate('tumAetUi.datePicker.done')}
                </Popover.Close>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </div>
    </Popover.Root>
  );
}
