import { useState } from 'react';
import { Dialog, type DialogProps } from '../../src/components/dialog/dialog';
import { Popover } from '../../src/components/popover/popover';
import { Select } from '../../src/components/select/select';

const OPTIONS = ['Alpha', 'Beta', 'Gamma'];

export function DialogFixture({
  initialFocus,
  closeOnEscape,
}: {
  initialFocus?: DialogProps['autoFocus'];
  closeOnEscape?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="tumaet-ui-root">
      <button type="button" onClick={() => setOpen(true)}>
        Open settings
      </button>
      <Dialog
        autoFocus={initialFocus}
        closeOnEscape={closeOnEscape}
        open={open}
        onOpenChange={setOpen}
        header="Settings"
        closable={false}
        size="small"
        footer={
          <button type="button" onClick={() => setOpen(false)}>
            Save settings
          </button>
        }
      >
        <label>
          Display name
          <input defaultValue="Ada" />
        </label>
        <Select aria-label="Course" options={OPTIONS} filter filterAriaLabel="Search courses" />
        <Popover trigger={<button type="button">More settings</button>} aria-label="Advanced settings">
          <label>
            Nickname
            <input />
          </label>
          <Select aria-label="Advanced course" options={OPTIONS} />
          <button type="button">Last popup action</button>
        </Popover>
      </Dialog>
      <button type="button">Outside action</button>
    </div>
  );
}

export function OverflowFixture() {
  return (
    <div className="tumaet-ui-root">
      <div
        role="region"
        aria-label="Scrollable content"
        style={{ overflow: 'auto', height: 180, width: 320, margin: 80 }}
      >
        <div style={{ paddingTop: 100, height: 600 }}>
          <Select aria-label="Overflow course" options={OPTIONS} />
        </div>
      </div>
    </div>
  );
}

export function ViewportEdgeFixture() {
  return (
    <div className="tumaet-ui-root" style={{ position: 'fixed', bottom: 8, right: 8, width: 240 }}>
      <Select aria-label="Edge course" options={OPTIONS} />
    </div>
  );
}
