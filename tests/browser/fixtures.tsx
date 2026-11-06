import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogClose,
} from '../../src/components/dialog';
import {
  Popover,
  PopoverTrigger,
  PopoverPortal,
  PopoverPositioner,
  PopoverPopup,
  PopoverTitle,
  PopoverClose,
} from '../../src/components/popover';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectPortal,
  SelectPositioner,
  SelectPopup,
  SelectList,
  type SelectProps,
} from '../../src/components/select';
import { Field, FieldLabel, FieldDescription } from '../../src/components/form-field';

export const OPTIONS = ['Alpha', 'Beta', 'Gamma'].map((value) => ({ key: value, value, label: value }));

export function CourseSelect({
  label,
  container,
  value,
  onValueChange,
  ...props
}: Partial<SelectProps<string>> & { label: string; container?: React.RefObject<HTMLDivElement | null> }) {
  const id = useId();
  const [localValue, setLocalValue] = useState<string | null>(null);
  return (
    <Field>
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
      </FieldLabel>
      <Select
        items={OPTIONS}
        {...props}
        value={value === undefined ? localValue : value}
        onValueChange={(next, details) => {
          onValueChange?.(next, details);
          if (!details.isCanceled) setLocalValue(next);
        }}
      >
        <SelectTrigger id={id} aria-labelledby={`${id}-label`}>
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectPortal container={container}>
          <SelectPositioner align="start">
            <SelectPopup>
              <SelectList />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>
    </Field>
  );
}

export function DialogFixture({
  cancelEscape = false,
  cancelValue = false,
  scoped = false,
}: {
  cancelEscape?: boolean;
  cancelValue?: boolean;
  scoped?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [actions, setActions] = useState(0);
  const [advancedValue, setAdvancedValue] = useState<string | null>(null);
  return (
    <DirectionProvider direction={scoped ? 'rtl' : 'ltr'}>
      <div className="tumaet-ui-root" data-theme={scoped ? 'dark' : 'light'} dir={scoped ? 'rtl' : 'ltr'}>
        <Dialog
          open={open}
          onOpenChange={(next, details) => {
            if (!next && cancelEscape && details.reason === 'escape-key') details.cancel();
            if (!details.isCanceled) setOpen(next);
          }}
        >
          <DialogTrigger>Open settings</DialogTrigger>
          <DialogPortal container={host}>
            <DialogBackdrop />
            <DialogPopup size="small" initialFocus={input}>
              <div className="tumaet-ui-dialog-header">
                <DialogTitle>Settings</DialogTitle>
                <DialogClose />
              </div>
              <div className="tumaet-ui-dialog-content">
                <label>
                  Display name
                  <input ref={input} defaultValue="Ada" />
                </label>
                <CourseSelect label="Course" container={host} />
                <Popover>
                  <PopoverTrigger>More settings</PopoverTrigger>
                  <PopoverPortal container={host}>
                    <PopoverPositioner sideOffset={8} align="start">
                      <PopoverPopup>
                        <PopoverTitle>Advanced settings</PopoverTitle>
                        <label>
                          Nickname
                          <input />
                        </label>
                        <CourseSelect
                          label="Advanced course"
                          value={advancedValue}
                          container={host}
                          onValueChange={(next, details) => {
                            if (cancelValue) details.cancel();
                            if (!details.isCanceled) setAdvancedValue(next);
                          }}
                        />
                        <PopoverClose>Done with advanced settings</PopoverClose>
                      </PopoverPopup>
                    </PopoverPositioner>
                  </PopoverPortal>
                </Popover>
              </div>
              <div className="tumaet-ui-dialog-footer">
                <DialogClose>Save settings</DialogClose>
              </div>
            </DialogPopup>
          </DialogPortal>
        </Dialog>
        <button type="button" onClick={() => setActions((count) => count + 1)}>
          Outside action
        </button>
        <output aria-label="Background actions">{actions}</output>
        {/* All portals share a scoped host outside the dialog's scrolling content. */}
        <div ref={host} data-testid="overlay-host" />
      </div>
    </DirectionProvider>
  );
}

export function OverflowFixture() {
  const host = useRef<HTMLDivElement>(null);
  return (
    <div className="tumaet-ui-root">
      <div
        role="region"
        aria-label="Scrollable content"
        style={{ overflow: 'auto', height: 180, width: 320, margin: 80 }}
      >
        <div style={{ paddingTop: 100, height: 600 }}>
          <CourseSelect label="Overflow course" container={host} modal={false} />
        </div>
      </div>
      <div ref={host} />
    </div>
  );
}
export function ViewportEdgeFixture() {
  return (
    <div className="tumaet-ui-root" style={{ position: 'fixed', bottom: 8, right: 8, width: 240 }}>
      <CourseSelect label="Edge course" />
    </div>
  );
}

export function SelectFormFixture({
  cancelReset = false,
  preserveOnReset = false,
}: {
  cancelReset?: boolean;
  preserveOnReset?: boolean;
}) {
  const [value, setValue] = useState<string | null>('Alpha');
  const [selected, setSelected] = useState<string[]>([]);
  const [renderCount, setRenderCount] = useState(0);
  const [entries, setEntries] = useState('');
  const [invalid, setInvalid] = useState(false);
  const id = useId();
  return (
    <form
      aria-label="Courses"
      onInvalid={() => setInvalid(true)}
      onReset={(event) => {
        if (cancelReset) event.preventDefault();
        if (!event.defaultPrevented && !preserveOnReset)
          flushSync(() => {
            setValue('Alpha');
            setSelected([]);
            setInvalid(false);
          });
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setEntries(JSON.stringify(Array.from(new FormData(event.currentTarget))));
      }}
    >
      <CourseSelect label="Single course" name="course" value={value} onValueChange={setValue} />
      <Field>
        <FieldLabel id={`${id}-label`} htmlFor={id}>
          Required courses
        </FieldLabel>
        <Select
          multiple
          name="courses"
          required
          items={OPTIONS}
          value={selected}
          onValueChange={(next) => {
            setSelected(next);
            setInvalid(next.length === 0);
          }}
        >
          <SelectTrigger
            id={id}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-description${invalid ? ` ${id}-error` : ''}`}
            aria-invalid={invalid || undefined}
          >
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectPortal>
            <SelectPositioner>
              <SelectPopup>
                <SelectList />
              </SelectPopup>
            </SelectPositioner>
          </SelectPortal>
        </Select>
        <FieldDescription id={`${id}-description`}>Choose at least one.</FieldDescription>
        {invalid ? (
          <p id={`${id}-error`} className="tumaet-ui-form-field-error" role="alert">
            A course is required.
          </p>
        ) : null}
      </Field>
      <CourseSelect label="Disabled course" name="disabled" value="Gamma" disabled />
      <CourseSelect label="Read only course" name="readonly" value="Alpha" readOnly />
      <button type="reset">Reset courses</button>
      <button type="button" onClick={() => setRenderCount(renderCount + 1)}>
        Rerender {renderCount}
      </button>
      <button type="submit">Submit courses</button>
      <output aria-label="Submitted entries">{entries}</output>
    </form>
  );
}

function ResetCounter() {
  const [count, setCount] = useState(0);
  return (
    <button type="button" onClick={() => setCount((current) => current + 1)}>
      Counter {count}
    </button>
  );
}

export function SelectResetFixture({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [value, setValue] = useState<string | null>('Alpha');
  return (
    <form aria-label="Reset form" onReset={() => flushSync(() => setValue('Alpha'))}>
      <Select items={OPTIONS} name="course" value={value} onValueChange={setValue} defaultOpen={defaultOpen}>
        <ResetCounter />
        <SelectTrigger aria-label="Reset course">
          <SelectValue />
        </SelectTrigger>
        <SelectPortal>
          <SelectPositioner>
            <SelectPopup>
              <SelectList />
            </SelectPopup>
          </SelectPositioner>
        </SelectPortal>
      </Select>
    </form>
  );
}

export function LateFormSelectFixture({ mounted = false, form = 'late' }: { mounted?: boolean; form?: string }) {
  const [value, setValue] = useState<string | null>('Alpha');
  const reset = () => flushSync(() => setValue('Alpha'));
  return (
    <>
      <CourseSelect label="External course" name="course" form={form} value={value} onValueChange={setValue} />
      {mounted ? (
        <>
          <form id="late" aria-label="Late form" onReset={form === 'late' ? reset : undefined} />
          <form id="other" aria-label="Other form" onReset={form === 'other' ? reset : undefined} />
        </>
      ) : null}
    </>
  );
}

function StatefulItemLabel({ value }: { value: string }) {
  // eslint-disable-next-line react/hook-use-state -- Immutable initial state exposes cross-item state reuse after reordering.
  const [original] = useState(value);
  return (
    <span>
      {value} originally {original}
    </span>
  );
}

export function SelectReorderFixture({ reversed = false }: { reversed?: boolean }) {
  return (
    <Select
      items={reversed ? [...OPTIONS].reverse() : OPTIONS}
      value={null}
      defaultOpen
      renderItem={(item) => <StatefulItemLabel value={item.value} />}
    >
      <SelectTrigger aria-label="Reordered course">
        <SelectValue />
      </SelectTrigger>
      <SelectPortal>
        <SelectPositioner>
          <SelectPopup>
            <SelectList />
          </SelectPopup>
        </SelectPositioner>
      </SelectPortal>
    </Select>
  );
}
