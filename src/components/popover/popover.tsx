import { Popover as BasePopover } from '@base-ui/react/popover';
import { cx } from '../../internal/cx';

export type PopoverPadding = 'default' | 'none';
export type PopoverProps<Payload = unknown> = BasePopover.Root.Props<Payload>;

export function Popover<Payload = unknown>(props: PopoverProps<Payload>) {
  return <BasePopover.Root {...props} />;
}

export type PopoverTriggerProps<Payload = unknown> = BasePopover.Trigger.Props<Payload>;
export function PopoverTrigger<Payload = unknown>({ className, ...props }: PopoverTriggerProps<Payload>) {
  return (
    <BasePopover.Trigger
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-trigger', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverPortalProps = BasePopover.Portal.Props;
export function PopoverPortal({ className, ...props }: PopoverPortalProps) {
  return (
    <BasePopover.Portal
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-portal', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverBackdropProps = BasePopover.Backdrop.Props;
export function PopoverBackdrop({ className, ...props }: PopoverBackdropProps) {
  return (
    <BasePopover.Backdrop
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-backdrop', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverPositionerProps = BasePopover.Positioner.Props;
export function PopoverPositioner({ className, ...props }: PopoverPositionerProps) {
  return (
    <BasePopover.Positioner
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-positioner', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverPopupProps = BasePopover.Popup.Props & { padding?: PopoverPadding };
export function PopoverPopup({ className, padding = 'default', ...props }: PopoverPopupProps) {
  return (
    <BasePopover.Popup
      {...props}
      data-padding={padding}
      className={(state) =>
        cx('tumaet-ui-popover-panel', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverTitleProps = BasePopover.Title.Props;
export function PopoverTitle({ className, ...props }: PopoverTitleProps) {
  return (
    <BasePopover.Title
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-title', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverDescriptionProps = BasePopover.Description.Props;
export function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
  return (
    <BasePopover.Description
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-description', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type PopoverCloseProps = BasePopover.Close.Props;
export function PopoverClose({ className, ...props }: PopoverCloseProps) {
  return (
    <BasePopover.Close
      {...props}
      className={(state) =>
        cx('tumaet-ui-popover-close', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
