import type { ComponentPropsWithRef } from 'react';
import { Collapsible } from '@base-ui/react/collapsible';
import { cx } from '../../internal/cx';
import { useTranslate } from '../../internal/i18n';
import { ChevronDownIcon } from '../../internal/icons';

export type PanelProps = ComponentPropsWithRef<typeof Collapsible.Root>;
export function Panel({ className, ...props }: PanelProps) {
  return (
    <Collapsible.Root
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-panel', className(state))
          : cx('tumaet-ui-panel', className)
      }
    />
  );
}
export type PanelHeaderProps = ComponentPropsWithRef<'div'>;
export function PanelHeader({ className, ...props }: PanelHeaderProps) {
  return <div {...props} className={cx('tumaet-ui-panel-header', className)} />;
}
export type PanelTitleProps = ComponentPropsWithRef<'span'>;
export function PanelTitle({ className, ...props }: PanelTitleProps) {
  return <span {...props} className={cx('tumaet-ui-panel-title', className)} />;
}
export type PanelTriggerProps = ComponentPropsWithRef<typeof Collapsible.Trigger>;
/** Defaults to translated Expand/Collapse. Children supply button content; render replaces the control. */
export function PanelTrigger({ className, children, render, ...props }: PanelTriggerProps) {
  const t = useTranslate();
  const defaultRender: Collapsible.Trigger.Props['render'] = (buttonProps, state) => (
    <button
      type="button"
      {...buttonProps}
      aria-label={buttonProps['aria-label'] ?? t(state.open ? 'tumAetUi.panel.collapse' : 'tumAetUi.panel.expand')}
    >
      <ChevronDownIcon className="tumaet-ui-panel-toggle-icon" />
    </button>
  );
  return (
    <Collapsible.Trigger
      {...props}
      render={render ?? (children === null || children === undefined ? defaultRender : undefined)}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-panel-toggler', className(state))
          : cx('tumaet-ui-panel-toggler', className)
      }
    >
      {children}
    </Collapsible.Trigger>
  );
}
export type PanelContentProps = ComponentPropsWithRef<typeof Collapsible.Panel>;
export function PanelContent({ className, children, ...props }: PanelContentProps) {
  return (
    <Collapsible.Panel
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-panel-content-container', className(state))
          : cx('tumaet-ui-panel-content-container', className)
      }
    >
      <div className="tumaet-ui-panel-content-wrapper">
        <div className="tumaet-ui-panel-content">{children}</div>
      </div>
    </Collapsible.Panel>
  );
}
