import { useId, useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import { Button } from '../button';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipPortal,
  TooltipPositioner,
  TooltipPopup,
  TooltipArrow,
} from './tooltip';

const TEXT = 'Download a CSV of the current results';
const meta = {
  title: 'Overlays/Tooltip',
  component: Tooltip,
  render: function Render(args) {
    const descriptionId = useId();
    return (
      <TooltipProvider delay={150} closeDelay={100}>
        <Tooltip {...args}>
          <TooltipTrigger render={<Button />} aria-describedby={descriptionId}>
            Export
          </TooltipTrigger>
          <TooltipPortal>
            <TooltipPositioner>
              <TooltipPopup id={descriptionId}>
                {TEXT}
                <TooltipArrow />
              </TooltipPopup>
            </TooltipPositioner>
          </TooltipPortal>
        </Tooltip>
      </TooltipProvider>
    );
  },
  parameters: {
    docs: {
      description: {
        component:
          'Compose Trigger, Portal, Positioner and Popup with optional Arrow. Base UI owns hover, focus, Escape and delays. Optional descriptions use an explicit popup id and Trigger aria-describedby; label the trigger independently. Provider shares hover delays across nearby hints; keyboard focus opens immediately. Put essential information in visible text. Popup accepts variant="list" for wider non-interactive content. Portal accepts container for scoped themes.',
      },
    },
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Shown: Story = {
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Export' });
    await userEvent.hover(trigger);
    await expect(await screen.findByRole('tooltip')).toBeVisible();
    await expect(trigger).toHaveAccessibleDescription(TEXT);
  },
};
export const List: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outlined" />}>Validation reasons</TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner>
          <TooltipPopup variant="list">
            <ul>
              <li>Needs at least one submission</li>
              <li>Is not yet graded</li>
              <li>Due date has passed</li>
            </ul>
            <TooltipArrow />
          </TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </Tooltip>
  ),
};
export const DisabledControl: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            role="button"
            aria-disabled="true"
            aria-label="Export unavailable"
            style={{ display: 'inline-flex' }}
          />
        }
      >
        <Button disabled style={{ pointerEvents: 'none' }}>
          Export
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipPositioner>
          <TooltipPopup>
            Choose a course before exporting
            <TooltipArrow />
          </TooltipPopup>
        </TooltipPositioner>
      </TooltipPortal>
    </Tooltip>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A focusable wrapper receives hover and keyboard focus around the native disabled button.',
      },
    },
  },
};

function ScopedTooltip() {
  const portalHost = useRef<HTMLDivElement>(null);
  return (
    <div data-theme="dark" className="tumaet-ui-root" style={{ padding: 24 }}>
      <Tooltip>
        <TooltipTrigger render={<Button variant="outlined" />}>Scoped dark hint</TooltipTrigger>
        <TooltipPortal container={portalHost}>
          <TooltipPositioner>
            <TooltipPopup>
              {TEXT}
              <TooltipArrow />
            </TooltipPopup>
          </TooltipPositioner>
        </TooltipPortal>
      </Tooltip>
      <div ref={portalHost} />
    </div>
  );
}
export const ScopedTheme: Story = {
  render: () => <ScopedTooltip />,
  parameters: {
    docs: { description: { story: 'The portal host is inside the theme boundary and outside clipping containers.' } },
  },
};
