import { Menu as BaseMenu } from '@base-ui/react/menu';
import type { ComponentProps } from 'react';
import { cx } from '../../internal/cx';

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;
export const MenuPortal = BaseMenu.Portal;

export type MenuProps<Payload = unknown> = BaseMenu.Root.Props<Payload>;
export type MenuTriggerProps<Payload = unknown> = BaseMenu.Trigger.Props<Payload>;
export type MenuPortalProps = ComponentProps<typeof MenuPortal>;
export type MenuPositionerProps = ComponentProps<typeof BaseMenu.Positioner>;
export type MenuPopupProps = ComponentProps<typeof BaseMenu.Popup>;
export type MenuItemProps = ComponentProps<typeof BaseMenu.Item>;
export type MenuLinkItemProps = ComponentProps<typeof BaseMenu.LinkItem>;

export function MenuPositioner({ className, ...props }: MenuPositionerProps) {
  return (
    <BaseMenu.Positioner
      {...props}
      className={(state) =>
        cx('tumaet-ui-menu-positioner', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export function MenuPopup({ className, ...props }: MenuPopupProps) {
  return (
    <BaseMenu.Popup
      {...props}
      className={(state) =>
        cx('tumaet-ui-overlay', 'tumaet-ui-menu', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export function MenuItem({ className, ...props }: MenuItemProps) {
  return (
    <BaseMenu.Item
      {...props}
      className={(state) => cx('tumaet-ui-menu-item', typeof className === 'function' ? className(state) : className)}
    />
  );
}

/** Navigation entries render anchors. Set closeOnClick when selection should dismiss the menu. */
export function MenuLinkItem({ className, ...props }: MenuLinkItemProps) {
  return (
    <BaseMenu.LinkItem
      {...props}
      className={(state) => cx('tumaet-ui-menu-item', typeof className === 'function' ? className(state) : className)}
    />
  );
}
