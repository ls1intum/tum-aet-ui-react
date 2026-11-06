import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, screen, waitFor, waitForElementToBeRemoved, within } from 'storybook/test';
import { Button, type ButtonSeverity } from '../button';
import { ConfirmDialog, ConfirmProvider, useConfirm, type ConfirmationRequest } from './confirm-dialog';

interface ConfirmStoryArgs {
  /** Routes the request to the `ConfirmDialog` with the same `confirmKey`. */
  confirmKey?: string;
  title: string;
  message: string;
  acceptLabel: string;
  rejectLabel: string;
  acceptSeverity?: ButtonSeverity;
  rejectSeverity?: ButtonSeverity;
  withIcon?: boolean;
  /** Called with the result of `confirm()`. */
  onResult?: (accepted: boolean) => void;
  accept?: () => void;
  reject?: () => void;
}

/** Font Awesome Free solid `triangle-exclamation` (CC BY 4.0). */
function WarningGlyph() {
  return (
    <svg viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M256 0c14.7 0 28.2 8.1 35.2 21l216 400c6.7 12.4 6.4 27.4-.8 39.5S486.1 480 472 480L40 480c-14.1 0-27.2-7.4-34.4-19.5s-7.5-27.1-.8-39.5l216-400c7-12.9 20.5-21 35.2-21zm0 352a32 32 0 1 0 0 64 32 32 0 1 0 0-64zm0-192c-18.2 0-32.7 15.5-31.4 33.7l7.4 104c.9 12.5 11.4 22.3 23.9 22.3 12.6 0 23-9.7 23.9-22.3l7.4-104c1.3-18.2-13.1-33.7-31.4-33.7z" />
    </svg>
  );
}

function Launcher({ onResult, withIcon, confirmKey, ...request }: ConfirmStoryArgs) {
  const confirm = useConfirm();
  return (
    <Button
      onClick={() =>
        void confirm({
          ...request,
          key: confirmKey,
          icon: withIcon === true ? <WarningGlyph /> : undefined,
        } satisfies ConfirmationRequest).then((accepted) => onResult?.(accepted))
      }
    >
      Delete tutorial group
    </Button>
  );
}

function ConfirmExample(args: ConfirmStoryArgs) {
  return (
    <ConfirmProvider>
      <Launcher {...args} />
      <ConfirmDialog confirmKey={args.confirmKey} />
    </ConfirmProvider>
  );
}

const meta = {
  title: 'Overlays/Confirm Dialog',
  component: ConfirmExample,
  args: {
    title: 'Delete tutorial group?',
    message: 'This action cannot be undone.',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptSeverity: 'danger',
    rejectSeverity: 'secondary',
    withIcon: false,
    onResult: fn(),
    accept: fn(),
    reject: fn(),
  },
  argTypes: {
    acceptSeverity: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
    },
    rejectSeverity: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'info', 'warn', 'danger', 'contrast'],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Imperative confirmation. Mount one `ConfirmProvider` and a `ConfirmDialog` (optionally with a `confirmKey`), then call `const confirm = useConfirm()` anywhere below: `await confirm({ title, message, acceptLabel, rejectLabel })` resolves to `true` when accepted and to `false` when rejected, dismissed with the close button or Escape, or replaced by a newer request with the same key. Pending requests resolve false on provider unmount. The provider owns request lifetime, including keyed requests with no mounted dialog. `accept`/`reject` callbacks are awaited; callback errors reject the request promise and must be handled by the caller. The dialog is a `role="alertdialog"` described by the message; the message keeps its line breaks. Requests with different keys are independent.',
      },
    },
  },
} satisfies Meta<typeof ConfirmExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = { args: { withIcon: true } };

export const MultiLineMessage: Story = {
  args: { message: 'This action cannot be undone.\nAll submissions of the group are deleted as well.' },
};

export const AcceptsDecision: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete tutorial group' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete tutorial group?' });
    await expect(dialog).toHaveAccessibleDescription('This action cannot be undone.');
    const removed = waitForElementToBeRemoved(dialog);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await removed;
    await waitFor(async () => expect(args.onResult).toHaveBeenCalledWith(true));
    await expect(args.accept).toHaveBeenCalledOnce();
  },
};

export const RejectsDecision: Story = {
  tags: ['!dev', '!autodocs'],
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Delete tutorial group' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete tutorial group?' });
    const removed = waitForElementToBeRemoved(dialog);
    await userEvent.keyboard('{Escape}');
    await removed;
    await waitFor(async () => expect(args.onResult).toHaveBeenCalledWith(false));
    await expect(args.reject).toHaveBeenCalledOnce();
    await expect(args.accept).not.toHaveBeenCalled();
  },
};

/** A dialog with a key only shows requests with the same key. */
export const Keyed: Story = {
  args: { confirmKey: 'tutorial-groups' },
};
