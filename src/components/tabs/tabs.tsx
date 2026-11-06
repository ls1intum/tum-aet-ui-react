import type { ComponentPropsWithRef } from 'react';
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import { cx } from '../../internal/cx';

export type TabValue = string | number;
export interface TabsProps extends Omit<
  ComponentPropsWithRef<typeof BaseTabs.Root>,
  'value' | 'defaultValue' | 'onValueChange' | 'onChange'
> {
  value?: TabValue | null;
  defaultValue?: TabValue | null;
  onValueChange?: (value: TabValue | null, details: BaseTabs.Root.ChangeEventDetails) => void;
}

/** Values are strings or numbers. Each JSX part is checked independently. */
export function Tabs({ className, ...props }: TabsProps) {
  return (
    <BaseTabs.Root
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-tabs', className(state))
          : cx('tumaet-ui-tabs', className)
      }
    />
  );
}

export type TabListProps = ComponentPropsWithRef<typeof BaseTabs.List>;
/** Base UI defaults to manual activation; opt into selection on focus with activateOnFocus. */
export function TabList({ className, ...props }: TabListProps) {
  return (
    <BaseTabs.List
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-tab-list', className(state))
          : cx('tumaet-ui-tab-list', className)
      }
    />
  );
}

export interface TabProps extends Omit<ComponentPropsWithRef<typeof BaseTabs.Tab>, 'value'> {
  value: TabValue;
}
export function Tab({ className, ...props }: TabProps) {
  return (
    <BaseTabs.Tab
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-tab', className(state))
          : cx('tumaet-ui-tab', className)
      }
    />
  );
}

export type TabIndicatorProps = ComponentPropsWithRef<typeof BaseTabs.Indicator>;
export function TabIndicator({ className, ...props }: TabIndicatorProps) {
  return (
    <BaseTabs.Indicator
      {...props}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-tab-indicator', className(state))
          : cx('tumaet-ui-tab-indicator', className)
      }
    />
  );
}

export type TabPanelsProps = ComponentPropsWithRef<'div'>;
/** Optional AET layout container. */
export function TabPanels({ className, ...props }: TabPanelsProps) {
  return <div {...props} className={cx('tumaet-ui-tab-panels', className)} />;
}

export interface TabPanelProps extends Omit<ComponentPropsWithRef<typeof BaseTabs.Panel>, 'value'> {
  value: TabValue;
  /** Fills the height of a bounded parent. */
  fill?: boolean;
}
export function TabPanel({ fill, className, ...props }: TabPanelProps) {
  return (
    <BaseTabs.Panel
      {...props}
      data-fill={fill === true || undefined}
      className={
        typeof className === 'function'
          ? (state) => cx('tumaet-ui-tab-panel', className(state))
          : cx('tumaet-ui-tab-panel', className)
      }
    />
  );
}
