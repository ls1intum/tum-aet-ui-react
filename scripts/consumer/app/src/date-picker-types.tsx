import { createRef, useState } from 'react';
import {
  DatePicker,
  Calendar,
  parseDatePickerText,
  formatDatePickerText,
  type DatePickerProps,
} from '@tumaet/ui-react';

export function DatePickerTypes() {
  const [value, setValue] = useState<Date | null>(null);
  const root = createRef<HTMLDivElement>();
  const input = createRef<HTMLInputElement>();
  const calendar = createRef<HTMLDivElement>();
  const host = createRef<HTMLDivElement>();
  const onValueChange: NonNullable<DatePickerProps['onValueChange']> = (next) => {
    const date: Date | null = next;
    setValue(date);
  };
  const parsed: Date | undefined = parseDatePickerText('13.06.2026 08:30');
  const formatted: string = formatDatePickerText(new Date(2026, 5, 13), false);
  // @ts-expect-error DatePicker domain values are Date or null.
  const invalidValue = <DatePicker value="13.06.2026" />;
  // @ts-expect-error The legacy value callback was replaced by onValueChange.
  const legacyCallback = <DatePicker onChange={() => {}} />;
  // @ts-expect-error A portal container is a DOM destination or ref, not a selector.
  const invalidContainer = <DatePicker portalContainer="#host" />;
  // @ts-expect-error DatePicker does not expose native form submission through a name prop.
  const nativeName = <DatePicker name="deadline" />;
  // @ts-expect-error The input ref points to the text input, not the root div.
  const invalidRef = <DatePicker inputRef={root} />;
  return (
    <div>
      <label htmlFor="typed-deadline">Deadline</label>
      <DatePicker
        id="typed-deadline"
        value={value}
        onValueChange={onValueChange}
        ref={root}
        inputRef={input}
        portalContainer={host}
        onBlur={(event) => {
          const field: HTMLInputElement = event.currentTarget;
          void field;
        }}
      />
      <Calendar ref={calendar} selected={value} activeMonth={parsed ?? new Date()} onDaySelect={setValue} />
      <div ref={host} />
      <output>{formatted}</output>
      {invalidValue}
      {legacyCallback}
      {invalidContainer}
      {nativeName}
      {invalidRef}
    </div>
  );
}
