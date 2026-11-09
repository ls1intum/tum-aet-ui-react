import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { Dialog, DialogTrigger, Popover, PopoverTrigger } from '@tumaet/ui-react';

export function TypedOverlayTriggers() {
  const dialog = BaseDialog.createHandle<{ id: string }>();
  const popover = BasePopover.createHandle<{ id: string }>();
  // @ts-expect-error The payload must match the dialog handle.
  const wrongDialog = <DialogTrigger handle={dialog} payload={42} />;
  // @ts-expect-error The payload must match the popover handle.
  const wrongPopover = <PopoverTrigger handle={popover} payload={42} />;
  return (
    <>
      <DialogTrigger handle={dialog} payload={{ id: 'course' }}>
        Open course
      </DialogTrigger>
      <PopoverTrigger handle={popover} payload={{ id: 'settings' }}>
        Open settings
      </PopoverTrigger>
      <Dialog handle={dialog}>
        {({ payload }) => {
          const id: string | undefined = payload?.id;
          return id;
        }}
      </Dialog>
      <Popover handle={popover}>
        {({ payload }) => {
          const id: string | undefined = payload?.id;
          return id;
        }}
      </Popover>
      {wrongDialog}
      {wrongPopover}
    </>
  );
}
