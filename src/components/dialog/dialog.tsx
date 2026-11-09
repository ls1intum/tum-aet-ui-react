import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { XIcon } from '../../internal/icons';

export type DialogSize = 'small' | 'medium' | 'large' | 'full';
export type DialogProps<Payload = unknown> = BaseDialog.Root.Props<Payload>;

export function Dialog<Payload = unknown>(props: DialogProps<Payload>) {
  return <BaseDialog.Root {...props} />;
}

export type DialogTriggerProps<Payload = unknown> = BaseDialog.Trigger.Props<Payload>;
export function DialogTrigger<Payload = unknown>({ className, ...props }: DialogTriggerProps<Payload>) {
  return (
    <BaseDialog.Trigger
      {...props}
      className={(state) =>
        cx('tumaet-ui-dialog-trigger', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type DialogPortalProps = BaseDialog.Portal.Props;
export function DialogPortal({ className, ...props }: DialogPortalProps) {
  return (
    <BaseDialog.Portal
      {...props}
      className={(state) =>
        cx('tumaet-ui-dialog-portal', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type DialogBackdropProps = BaseDialog.Backdrop.Props;
export function DialogBackdrop({ className, ...props }: DialogBackdropProps) {
  return (
    <BaseDialog.Backdrop
      {...props}
      className={(state) =>
        cx('tumaet-ui-dialog-backdrop', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type DialogPopupProps = BaseDialog.Popup.Props & { size?: DialogSize };
export function DialogPopup({ className, size, ...props }: DialogPopupProps) {
  return (
    <BaseDialog.Popup
      {...props}
      data-size={size}
      className={(state) => cx('tumaet-ui-dialog', typeof className === 'function' ? className(state) : className)}
    />
  );
}

export type DialogTitleProps = BaseDialog.Title.Props;
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      {...props}
      className={(state) =>
        cx('tumaet-ui-dialog-title', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type DialogDescriptionProps = BaseDialog.Description.Props;
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      {...props}
      className={(state) =>
        cx('tumaet-ui-dialog-description', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export type DialogCloseProps = BaseDialog.Close.Props;
export function DialogClose({ className, children, 'aria-label': ariaLabel, ...props }: DialogCloseProps) {
  const t = useTranslate();
  const iconOnly = children === undefined || children === null;
  return (
    <BaseDialog.Close
      {...props}
      aria-label={ariaLabel ?? (iconOnly ? t('tumAetUi.dialog.close') : undefined)}
      data-icon-only={iconOnly || undefined}
      className={(state) =>
        cx('tumaet-ui-dialog-close', typeof className === 'function' ? className(state) : className)
      }
    >
      {children ?? <XIcon />}
    </BaseDialog.Close>
  );
}
