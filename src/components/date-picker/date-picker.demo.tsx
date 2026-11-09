import { useState } from 'react';
import { DatePicker } from './date-picker';

const row = { display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 24 } as const;
const label = { display: 'block', marginBottom: 4, fontWeight: 600 } as const;

export default function DatePickerDemo() {
  const [deadline, setDeadline] = useState<Date | null>(new Date(2026, 5, 13, 8, 30));
  const [end, setEnd] = useState<Date | null>(null);
  const [start, setStart] = useState<Date | null>(new Date(2026, 5, 13, 8, 30));
  const today = new Date();
  const inThirtyDays = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

  return (
    <>
      <div style={row}>
        <div>
          <label htmlFor="dp-deadline" style={label}>
            Deadline
          </label>
          <DatePicker id="dp-deadline" value={deadline} onValueChange={setDeadline} showTimeZoneWarning />
          <p>Value: {deadline ? deadline.toString() : 'none'}</p>
        </div>
        <div>
          <label htmlFor="dp-end" style={label}>
            Access end (date only, today to +30 days)
          </label>
          <DatePicker
            id="dp-end"
            dateOnly
            value={end}
            onValueChange={setEnd}
            min={today}
            max={inThirtyDays}
            aria-describedby="dp-end-hint"
          />
          <p id="dp-end-hint">Pick a day within the next 30 days.</p>
        </div>
      </div>
      <div style={row}>
        <div>
          <label htmlFor="dp-time" style={label}>
            Start time
          </label>
          <DatePicker id="dp-time" timeOnly value={start} onValueChange={setStart} />
        </div>
        <div>
          <label htmlFor="dp-blur" style={label}>
            Validate on blur
          </label>
          <DatePicker id="dp-blur" validateOnBlur openOnClick />
        </div>
        <div>
          <label htmlFor="dp-invalid" style={label}>
            External error
          </label>
          <DatePicker id="dp-invalid" aria-invalid defaultValue={new Date(2026, 0, 31, 12, 0)} />
        </div>
        <div>
          <label htmlFor="dp-disabled" style={label}>
            Disabled
          </label>
          <DatePicker id="dp-disabled" disabled defaultValue={new Date(2026, 5, 13, 8, 30)} />
        </div>
      </div>
      <div style={row}>
        <DatePicker inline aria-label="Inline date and time" defaultValue={new Date(2026, 5, 13, 8, 30)} />
        <DatePicker inline timeOnly aria-label="Inline time" defaultValue={new Date(2026, 5, 13, 8, 30)} />
      </div>
    </>
  );
}
