import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { ComponentProps } from 'react';
import { cx } from '../../internal/cx';

export const Tooltip = BaseTooltip.Root;
export const TooltipProvider = BaseTooltip.Provider;
export const TooltipTrigger = BaseTooltip.Trigger;
export const TooltipPortal = BaseTooltip.Portal;

export type TooltipProps<Payload = unknown> = BaseTooltip.Root.Props<Payload>;
export type TooltipProviderProps = BaseTooltip.Provider.Props;
export type TooltipTriggerProps<Payload = unknown> = BaseTooltip.Trigger.Props<Payload>;
export type TooltipPortalProps = ComponentProps<typeof TooltipPortal>;
export type TooltipPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;
export type TooltipArrowProps = ComponentProps<typeof BaseTooltip.Arrow>;
/** Pair a popup id with Trigger aria-describedby when an optional description is useful. */
export interface TooltipPopupProps extends ComponentProps<typeof BaseTooltip.Popup> {
  /** Lists and rich non-interactive hints have a wider maximum width. */
  variant?: 'text' | 'list';
}

export function TooltipPositioner({ className, sideOffset = 8, ...props }: TooltipPositionerProps) {
  return (
    <BaseTooltip.Positioner
      {...props}
      sideOffset={sideOffset}
      className={(state) =>
        cx('tumaet-ui-tooltip-positioner', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}

export function TooltipPopup({ className, variant = 'text', role = 'tooltip', ...props }: TooltipPopupProps) {
  return (
    <BaseTooltip.Popup
      {...props}
      role={role}
      data-variant={variant}
      className={(state) =>
        cx(
          'tumaet-ui-overlay',
          'tumaet-ui-tooltip-bubble',
          typeof className === 'function' ? className(state) : className,
        )
      }
    />
  );
}

export function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return (
    <BaseTooltip.Arrow
      {...props}
      className={(state) =>
        cx('tumaet-ui-tooltip-arrow', typeof className === 'function' ? className(state) : className)
      }
    />
  );
}
