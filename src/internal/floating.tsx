import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from './cx';

// A child portal may be a DOM sibling of its parent panel. Its anchor still
// identifies the nesting, independently of React effect order or positioning.
const openPanels: Array<{ panel: HTMLDivElement; anchor: RefObject<HTMLElement | null> }> = [];
const handledEscapes = new WeakSet<KeyboardEvent>();

function escapeOwner() {
  return openPanels.findLast(
    (entry) => !openPanels.some((other) => other !== entry && entry.panel.contains(other.anchor.current)),
  )?.panel;
}

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Placement = Side | `${Side}-start` | `${Side}-end`;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Offset of the floating box along the cross axis for an alignment. */
function alignOffset(align: 'start' | 'end' | undefined, start: number, end: number, center: number): number {
  if (align === 'start') {
    return start;
  }
  return align === 'end' ? end : center;
}

/** Pure positioning: places `floating` next to `anchor`, flips to the opposite side when it does not fit and keeps it inside the viewport. */
export function computePosition(
  anchor: Box,
  floating: { width: number; height: number },
  placement: Placement,
  viewport: { width: number; height: number },
  offset = 4,
): { top: number; left: number; side: Side } {
  const [wanted, align] = placement.split('-') as [Side, ('start' | 'end')?];
  const fits = (side: Side) => {
    switch (side) {
      case 'bottom':
        return anchor.top + anchor.height + offset + floating.height <= viewport.height;
      case 'top':
        return anchor.top - offset - floating.height >= 0;
      case 'right':
        return anchor.left + anchor.width + offset + floating.width <= viewport.width;
      case 'left':
        return anchor.left - offset - floating.width >= 0;
    }
  };
  const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  const side = fits(wanted) || !fits(opposite[wanted]) ? wanted : opposite[wanted];
  let top: number;
  let left: number;
  if (side === 'top' || side === 'bottom') {
    top = side === 'bottom' ? anchor.top + anchor.height + offset : anchor.top - offset - floating.height;
    left = alignOffset(
      align,
      anchor.left,
      anchor.left + anchor.width - floating.width,
      anchor.left + (anchor.width - floating.width) / 2,
    );
    left = Math.max(4, Math.min(left, viewport.width - floating.width - 4));
  } else {
    left = side === 'right' ? anchor.left + anchor.width + offset : anchor.left - offset - floating.width;
    top = alignOffset(
      align,
      anchor.top,
      anchor.top + anchor.height - floating.height,
      anchor.top + (anchor.height - floating.height) / 2,
    );
    top = Math.max(4, Math.min(top, viewport.height - floating.height - 4));
  }
  return { top, left, side };
}

/** Measures the anchor and the panel and returns the position of the panel, or null while either is not mounted. */
function measure(
  a: HTMLElement | null,
  p: HTMLElement | null,
  matchWidth: boolean,
  placement: Placement,
  offset: number,
): { minWidth: number | undefined; pos: { top: number; left: number; side: Side } } | null {
  if (a === null || p === null) return null;
  const r = a.getBoundingClientRect();
  const f = p.getBoundingClientRect();
  return {
    minWidth: matchWidth ? r.width : undefined,
    pos: computePosition(
      { top: r.top, left: r.left, width: r.width, height: r.height },
      { width: f.width, height: f.height },
      placement,
      { width: window.innerWidth, height: window.innerHeight },
      offset,
    ),
  };
}

export interface FloatingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Element the panel is placed next to. Clicks on it do not count as outside clicks. */
  anchor: RefObject<HTMLElement | null>;
  open: boolean;
  placement?: Placement;
  offset?: number;
  /** Gives the panel at least the width of the anchor. */
  matchWidth?: boolean;
  /** Called on Escape and on a pointer press outside the panel and the anchor. */
  onDismiss?: () => void;
  children?: ReactNode;
}

/**
 * Portal-rendered, viewport-aware panel for popovers, menus, select lists and tooltips.
 * Renders nothing while closed. Focus handling is up to the caller.
 */
export function Floating({
  anchor,
  open,
  placement = 'bottom-start',
  offset = 4,
  matchWidth,
  onDismiss,
  className,
  style,
  children,
  ref,
  ...rest
}: FloatingProps & { ref?: React.Ref<HTMLDivElement> }) {
  const panel = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: Side } | null>(null);
  const [minWidth, setMinWidth] = useState<number | undefined>();
  const dismiss = useRef(onDismiss);
  useLayoutEffect(() => {
    dismiss.current = onDismiss;
  });

  // Forget the position when closed, so the next opening starts invisible until it is measured.
  if (!open && pos !== null) {
    setPos(null);
  }

  useLayoutEffect(() => {
    if (!open) return;
    const m = measure(anchor.current, panel.current, matchWidth === true, placement, offset);
    if (m === null) return;
    setMinWidth(m.minWidth);
    setPos(m.pos);
  }, [open, anchor, matchWidth, placement, offset, children]);

  useEffect(() => {
    const currentPanel = panel.current;
    if (!open || currentPanel === null) return;
    const entry = { panel: currentPanel, anchor };
    openPanels.push(entry);
    return () => {
      const index = openPanels.indexOf(entry);
      if (index >= 0) openPanels.splice(index, 1);
    };
  }, [open, anchor]);

  useEffect(() => {
    if (!open) return;
    const currentPanel = panel.current;
    if (currentPanel === null) return;
    const onScroll = () => {
      const m = measure(anchor.current, panel.current, matchWidth === true, placement, offset);
      if (m === null) return;
      setMinWidth(m.minWidth);
      setPos(m.pos);
    };
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panel.current?.contains(target) === true || anchor.current?.contains(target) === true) return;
      dismiss.current?.();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !handledEscapes.has(event) && escapeOwner() === currentPanel) {
        // A native dialog already prevents Escape's default. Track our own
        // consumption so effect cleanup cannot give the same event to a parent.
        handledEscapes.add(event);
        event.preventDefault();
        event.stopPropagation();
        dismiss.current?.();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, anchor, matchWidth, placement, offset]);

  if (!open) return null;
  // A modal dialog sits in the top layer, above everything in <body>, so popups opened inside it are portalled into it.
  const container = anchor.current?.closest('dialog') ?? document.body;
  // With `matchWidth`, a numeric `style.minWidth` is a floor for the anchor width instead of replacing it.
  const styleMinWidth = style?.minWidth;
  const css: CSSProperties = {
    position: 'fixed',
    top: pos?.top ?? 0,
    left: pos?.left ?? 0,
    // Invisible but focusable until positioned: `visibility: hidden` would make `autoFocus` inside the panel fail in browsers.
    ...(pos ? null : { opacity: 0, pointerEvents: 'none' as const }),
    ...style,
    minWidth:
      typeof styleMinWidth === 'number' && minWidth !== undefined
        ? Math.max(minWidth, styleMinWidth)
        : (styleMinWidth ?? minWidth),
  };
  return createPortal(
    <div
      {...rest}
      ref={(node) => {
        panel.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cx('tumaet-ui-overlay', className)}
      data-side={pos?.side}
      style={css}
    >
      {children}
    </div>,
    container,
  );
}
