import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs } from './tabs';

const meta = {
  title: 'Navigation/Tabs',
  component: Tabs,
  subcomponents: { TabList, Tab, TabIndicator, TabPanels, TabPanel },
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Base UI owns selection, IDs and navigation. TabList defaults to manual activation; activateOnFocus selects on arrow focus. Values are string, number or null (no selection); JSX parts are independently typed. Use DirectionProvider for RTL keyboard behavior.',
      },
    },
  },
  render: (args) => (
    <Tabs {...args} defaultValue="overview">
      <TabList aria-label="Course">
        <Tab value="overview">Overview</Tab>
        <Tab value="exercises">Exercises</Tab>
        <Tab value="grading" disabled>
          Grading
        </Tab>
        <Tab value="settings">Settings</Tab>
        <TabIndicator />
      </TabList>
      <TabPanels>
        <TabPanel value="overview">Course overview</TabPanel>
        <TabPanel value="exercises">Exercise list</TabPanel>
        <TabPanel value="settings">Course settings</TabPanel>
      </TabPanels>
    </Tabs>
  ),
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Overview' }));
    await userEvent.keyboard('{End}');
    await expect(canvas.getByRole('tab', { name: 'Settings' })).toHaveFocus();
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Course overview');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Course settings');
  },
};

export const BoundedContent: Story = {
  render: () => {
    const messages = Array.from({ length: 50 }, (_, index) => `Message ${index + 1}`);
    return <BoundedTabs messages={messages} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bounds = canvas.getByTestId('bounded-tabs');
    const chat = canvas.getByRole('region', { name: 'Chat conversation' });
    const messages = canvas.getByRole('log', { name: 'Messages' });
    const composer = canvas.getByRole('textbox', { name: 'Message' });

    await waitFor(async () => {
      await expect(chat.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        bounds.getBoundingClientRect().bottom + 0.5,
      );
      await expect(chat.getBoundingClientRect().height).toBeGreaterThan(0);
      await expect(chat.getBoundingClientRect().height).toBeLessThan(bounds.getBoundingClientRect().height);
      await expect(composer.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        bounds.getBoundingClientRect().bottom + 0.5,
      );
      await expect(messages.scrollHeight).toBeGreaterThan(messages.clientHeight);
    });
    await userEvent.type(composer, 'Unsaved draft');
    const composerTop = composer.getBoundingClientRect().top;
    messages.scrollTop = messages.scrollHeight;
    await expect(composer.getBoundingClientRect().top).toBeCloseTo(composerTop, 1);

    await userEvent.click(canvas.getByRole('tab', { name: 'Notes' }));
    await waitFor(async () => expect(chat).not.toBeVisible());
    await userEvent.click(canvas.getByRole('tab', { name: 'Chat' }));
    await waitFor(async () => expect(chat).toBeVisible());
    await expect(canvas.getByRole('textbox', { name: 'Message' })).toBe(composer);
    await expect(composer).toHaveValue('Unsaved draft');
  },
};

function BoundedTabs({ messages }: { messages: string[] }) {
  const [value, setValue] = useState<number | string | null>('chat');
  return (
    <div data-testid="bounded-tabs" style={{ height: '20rem', width: 'min(36rem, 100%)' }}>
      <Tabs value={value} onValueChange={setValue} style={{ height: '100%', minHeight: 0 }}>
        <TabList aria-label="Workspace" style={{ flexShrink: 0 }}>
          <Tab value="chat">Chat</Tab>
          <Tab value="notes">Notes</Tab>
          <TabIndicator />
        </TabList>
        <TabPanels style={{ flex: 1, minHeight: 0, padding: 0, overflow: 'auto' }}>
          <TabPanel value="chat" keepMounted fill>
            <section
              aria-label="Chat conversation"
              style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be keyboard focusable so it can be scrolled */}
              <div role="log" aria-label="Messages" tabIndex={0} style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {messages.map((message) => (
                  <p key={message}>{message}</p>
                ))}
              </div>
              <label style={{ flexShrink: 0 }}>
                Message
                <textarea aria-label="Message" style={{ display: 'block' }} />
              </label>
            </section>
          </TabPanel>
          <TabPanel value="notes">Workspace notes</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
