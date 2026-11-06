import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, useEffect } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { ConfirmDialog, ConfirmProvider, useConfirm, type ConfirmationRequest } from './confirm-dialog';

const base: ConfirmationRequest = {
  title: 'Delete?',
  message: 'Cannot be undone.',
  acceptLabel: 'Delete',
  rejectLabel: 'Cancel',
};

function Host({ request = base, results }: { request?: ConfirmationRequest; results?: boolean[] }) {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={() => {
        void confirm(request).then((r) => results?.push(r));
      }}
    >
      Ask
    </button>
  );
}

type Confirm = ReturnType<typeof useConfirm>;
const captured: { current: Confirm | null } = { current: null };

function Grab() {
  const confirm = useConfirm();
  useEffect(() => {
    captured.current = confirm;
  }, [confirm]);
  return null;
}

function grabbedConfirm(): Confirm {
  if (captured.current === null) {
    throw new Error('Grab was not rendered.');
  }
  return captured.current;
}

function mountHost(request?: ConfirmationRequest, results: boolean[] = []) {
  render(
    <ConfirmProvider>
      <Host request={request} results={results} />
      <ConfirmDialog confirmKey={request?.key} />
    </ConfirmProvider>,
  );
  return results;
}

const ask = async () => userEvent.click(screen.getByRole('button', { name: 'Ask' }));
const flush = async () => new Promise((resolve) => setTimeout(resolve));

describe('ConfirmDialog', () => {
  it('shows an alertdialog described by the message', async () => {
    mountHost();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    await ask();
    const dialog = screen.getByRole('alertdialog', { name: 'Delete?' });
    expect(dialog).toHaveAccessibleDescription('Cannot be undone.');
  });

  it('resolves true and calls accept when confirmed', async () => {
    const accept = vi.fn();
    const results = mountHost({ ...base, accept });
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await flush();
    expect(results).toEqual([true]);
    expect(accept).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('resolves false and calls reject when cancelled, closed or dismissed with Escape', async () => {
    const reject = vi.fn();
    const results = mountHost({ ...base, reject });
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await ask();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await ask();
    await userEvent.keyboard('{Escape}');
    await flush();
    expect(results).toEqual([false, false, false]);
    expect(reject).toHaveBeenCalledTimes(3);
  });

  it('initially focuses rejection, ignores backdrop presses, and restores the opener after Escape', async () => {
    mountHost();
    const opener = screen.getByRole('button', { name: 'Ask' });
    await ask();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus());
    const backdrop = document.querySelector('.tumaet-ui-dialog-backdrop');
    if (!(backdrop instanceof HTMLElement)) throw new Error('Missing backdrop');
    await userEvent.click(backdrop);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('does not settle a dismissal canceled through upstream event details', async () => {
    const results: boolean[] = [];
    render(
      <ConfirmProvider>
        <Host results={results} />
        <ConfirmDialog onOpenChange={(_open, details) => details.cancel()} />
      </ConfirmProvider>,
    );
    await ask();
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(results).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(results).toEqual([false]);
  });

  it('keeps a replacement queued by the dismissal callback pending until its own decision', async () => {
    const firstResults: boolean[] = [];
    const replacementResults: boolean[] = [];
    const replacementReject = vi.fn();
    let replaced = false;
    render(
      <ConfirmProvider>
        <Grab />
        <Host results={firstResults} />
        <ConfirmDialog
          onOpenChange={(open) => {
            if (open || replaced) return;
            replaced = true;
            void grabbedConfirm()({ ...base, title: 'Next decision', reject: replacementReject }).then((result) =>
              replacementResults.push(result),
            );
          }}
        />
      </ConfirmProvider>,
    );
    await ask();
    await userEvent.keyboard('{Escape}');
    expect(firstResults).toEqual([false]);
    expect(await screen.findByRole('alertdialog', { name: 'Next decision' })).toBeInTheDocument();
    expect(replacementResults).toEqual([]);
    expect(replacementReject).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(replacementResults).toEqual([true]);
  });

  it('routes requests by key and shows the icon decoratively with severities', async () => {
    mountHost({ ...base, key: 'a', icon: <svg data-testid="icon" />, acceptSeverity: 'danger' });
    await ask();
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveAttribute('data-severity', 'danger');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-severity', 'secondary');
  });

  it('does not show a dialog for a request with a different key', async () => {
    render(
      <ConfirmProvider>
        <Host request={{ ...base, key: 'other' }} />
        <ConfirmDialog confirmKey="mine" />
      </ConfirmProvider>,
    );
    await ask();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('rejects a pending request that is replaced by a new one with the same key', async () => {
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    const first = confirm(base);
    const second = confirm({ ...base, title: 'Second' });
    await expect(first).resolves.toBe(false);
    expect(await screen.findByRole('alertdialog', { name: 'Second' })).toBeInTheDocument();
    void second;
  });

  it('keeps keyed requests independent: opening one neither dismisses nor rejects another', () => {
    const rejectA = vi.fn();
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog confirmKey="a" />
        <ConfirmDialog confirmKey="b" />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    act(() => void confirm({ ...base, title: 'A', message: 'request-a', key: 'a', reject: rejectA }));
    act(() => void confirm({ ...base, title: 'B', message: 'request-b', key: 'b' }));
    expect(screen.getByRole('alertdialog', { name: 'A', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('alertdialog', { name: 'B' })).toBeInTheDocument();
    expect(rejectA).not.toHaveBeenCalled();
  });

  it('preserves message line breaks, custom labels and button severities', async () => {
    mountHost({ ...base, message: 'First line\nSecond line', acceptLabel: 'Yes', rejectSeverity: 'danger' });
    await ask();
    const message = document.querySelector('.tumaet-ui-confirm-dialog-message')!;
    expect(message.textContent).toBe('First line\nSecond line');
    expect(screen.getByRole('button', { name: 'Yes' })).toHaveAttribute('data-severity', 'primary');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('data-severity', 'danger');
  });

  it('survives StrictMode: the dialog is not rejected right after opening', async () => {
    const results: boolean[] = [];
    render(
      <StrictMode>
        <ConfirmProvider>
          <Host results={results} />
          <ConfirmDialog />
        </ConfirmProvider>
      </StrictMode>,
    );
    await ask();
    await flush();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(results).toEqual([]);
  });

  it('keeps effect-driven requests usable after StrictMode effect replay', async () => {
    const decisions: boolean[] = [];
    function EffectRequest() {
      const confirm = useConfirm();
      useEffect(() => {
        void confirm(base).then((value) => decisions.push(value));
      }, [confirm]);
      return null;
    }
    render(
      <StrictMode>
        <ConfirmProvider>
          <EffectRequest />
          <ConfirmDialog />
        </ConfirmProvider>
      </StrictMode>,
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(decisions).toEqual([false, true]));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('throws outside a provider', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    expect(() => render(<ConfirmDialog />)).toThrow(/ConfirmProvider/);
    error.mockRestore();
  });

  it('settles every pending request on provider unmount and ignores retained calls', async () => {
    const reject = vi.fn();
    const { unmount } = render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    let first!: Promise<boolean>;
    let keyed!: Promise<boolean>;
    act(() => {
      first = confirm({ ...base, reject });
      keyed = confirm({ ...base, key: 'other', reject });
    });
    unmount();
    await expect(first).resolves.toBe(false);
    await expect(keyed).resolves.toBe(false);
    await expect(confirm(base)).resolves.toBe(false);
    expect(reject).toHaveBeenCalledTimes(2);
  });

  it('rejects callback failures without blocking replacement or future confirmations', async () => {
    const failure = new Error('callback failed');
    render(
      <ConfirmProvider>
        <Grab />
        <ConfirmDialog />
      </ConfirmProvider>,
    );
    const confirm = grabbedConfirm();
    let first!: Promise<boolean>;
    let second!: Promise<boolean>;
    act(() => {
      first = confirm({
        ...base,
        reject: () => {
          throw failure;
        },
      });
      second = confirm({
        ...base,
        title: 'Replacement',
        accept: async () => {
          await Promise.reject(failure);
        },
      });
    });
    await expect(first).rejects.toBe(failure);
    const secondFailure = second.catch((error: unknown) => error);
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await secondFailure).toBe(failure);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    let third!: Promise<boolean>;
    act(() => {
      third = confirm(base);
    });
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await expect(third).resolves.toBe(false);
  });

  it('has no accessibility violations', async () => {
    mountHost();
    await ask();
    await expectNoA11yViolations();
  });
});
