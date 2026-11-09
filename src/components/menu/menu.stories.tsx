import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Menu, MenuTrigger, MenuPortal, MenuPositioner, MenuPopup, MenuItem, MenuLinkItem } from './menu';

const meta = {
  title: 'Navigation/Menu',
  component: Menu,
  render: (args) => (
    <Menu {...args}>
      <MenuTrigger render={<Button />}>Course actions</MenuTrigger>
      <MenuPortal>
        <MenuPositioner align="start">
          <MenuPopup>
            <MenuItem>Add students</MenuItem>
            <MenuItem disabled>Add editors</MenuItem>
            <MenuItem>Add tutors</MenuItem>
            <MenuLinkItem href="https://docs.artemis.cit.tum.de" target="_blank" rel="noreferrer" closeOnClick>
              Open documentation
            </MenuLinkItem>
          </MenuPopup>
        </MenuPositioner>
      </MenuPortal>
    </Menu>
  ),
  parameters: {
    docs: {
      description: {
        component:
          'Compose Trigger, Portal, Positioner and Popup. Base UI owns keyboard navigation, typeahead, selection, dismissal and focus return. Disabled items remain focusable and cannot be activated. Use render for a Button or custom element, and MenuLinkItem for navigation. Root callbacks receive cancelable Base UI event details. Portal accepts container for a scoped theme or direction boundary. Use Popover for rich interactive content.',
      },
    },
  },
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Opened: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Course actions' }));
    const menu = await screen.findByRole('menu');
    await waitFor(async () => expect(menu).toBeVisible());
  },
};
export const KeyboardNavigation: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Course actions' });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(async () => expect(screen.getByRole('menuitem', { name: 'Add students' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowDown}');
    await waitFor(async () => expect(screen.getByRole('menuitem', { name: 'Add tutors' })).toHaveFocus());
    await userEvent.keyboard('{Escape}');
    await waitFor(async () => expect(trigger).toHaveFocus());
  },
};

function ScopedMenu() {
  const portalHost = useRef<HTMLDivElement>(null);
  return (
    <div
      data-theme="dark"
      className="tumaet-ui-root"
      style={{ padding: 24, background: 'var(--tumaet-ui-content-background)', color: 'var(--tumaet-ui-text-color)' }}
    >
      <Menu>
        <MenuTrigger render={<Button variant="outlined" />}>Scoped dark menu</MenuTrigger>
        <MenuPortal container={portalHost}>
          <MenuPositioner align="end">
            <MenuPopup>
              <MenuItem>Rename</MenuItem>
              <MenuItem>Duplicate</MenuItem>
            </MenuPopup>
          </MenuPositioner>
        </MenuPortal>
      </Menu>
      <div ref={portalHost} />
    </div>
  );
}

export const ScopedTheme: Story = {
  render: () => <ScopedMenu />,
  parameters: {
    docs: { description: { story: 'The portal host is inside the theme boundary and outside clipping containers.' } },
  },
};
