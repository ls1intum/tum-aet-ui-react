import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, type ButtonSeverity } from '../button';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { useTranslate } from '../../internal/i18n';
import { XIcon } from '../../internal/icons';

/** Content and callbacks for one confirmation decision. */
export interface ConfirmationRequest {
  /** Dialog title. */
  title: string;
  /** Body text shown next to the optional icon. */
  message: ReactNode;
  /** Localized confirm-button label. */
  acceptLabel: string;
  /** Localized cancel-button label. */
  rejectLabel: string;
  /** Confirm button severity (default `'primary'`). */
  acceptSeverity?: ButtonSeverity;
  /** Cancel button severity (default `'secondary'`). */
  rejectSeverity?: ButtonSeverity;
  /** Optional leading icon shown before the message. Decorative. */
  icon?: ReactNode;
  /** Routes the request to the `ConfirmDialog` with the same `key`. */
  key?: string;
  /** Invoked on confirmation. Awaited before resolution; errors reject the request promise. */
  accept?: () => void | Promise<void>;
  /** Invoked on cancellation, dismissal, replacement or provider unmount. Errors reject the request promise. */
  reject?: () => void | Promise<void>;
}

export type ConfirmFunction = (request: ConfirmationRequest) => Promise<boolean>;

interface Entry {
  request: ConfirmationRequest;
  settle: (accepted: boolean) => void;
}

interface ConfirmContextValue {
  entries: ReadonlyMap<string | undefined, Entry>;
  confirm: ConfirmFunction;
  /** Settles and removes the pending request for `key`. */
  settle: (key: string | undefined, accepted: boolean) => void;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

function useConfirmContext(): ConfirmContextValue {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm and ConfirmDialog must be used inside a ConfirmProvider');
  return context;
}

/** Coordinates confirmation requests with the `ConfirmDialog` components below it. */
export function ConfirmProvider({ children }: { children?: ReactNode }) {
  const [entries, setEntries] = useState<ReadonlyMap<string | undefined, Entry>>(new Map());
  const latest = useRef(entries);
  const owner = useRef({ active: true });

  useEffect(() => {
    const lifetime = { active: true };
    owner.current = lifetime;
    return () => {
      // Strict Mode reconnects effects synchronously. Dispose only if this owner stays unmounted.
      queueMicrotask(() => {
        if (owner.current !== lifetime) return;
        lifetime.active = false;
        const pending = latest.current;
        latest.current = new Map();
        for (const entry of pending.values()) entry.settle(false);
      });
    };
  }, []);

  const commit = useCallback((next: ReadonlyMap<string | undefined, Entry>) => {
    latest.current = next;
    setEntries(next);
  }, []);

  const settle = useCallback(
    (key: string | undefined, accepted: boolean) => {
      const entry = latest.current.get(key);
      if (!entry) return;
      const next = new Map(latest.current);
      next.delete(key);
      commit(next);
      // Reentrant confirmation callbacks must see the updated queue.
      entry.settle(accepted);
    },
    [commit],
  );

  const confirm = useCallback<ConfirmFunction>(
    async (request) => {
      if (!owner.current.active) return false;
      return new Promise<boolean>((resolve, reject) => {
        const previous = latest.current.get(request.key);
        const entry: Entry = {
          request,
          settle: (accepted) => {
            // Callback failures reject this request's promise without blocking replacement or cleanup.
            try {
              const result = accepted ? request.accept?.() : request.reject?.();
              Promise.resolve(result).then(() => resolve(accepted), reject);
            } catch (error) {
              reject(error instanceof Error ? error : new Error('Confirmation callback failed', { cause: error }));
            }
          },
        };
        commit(new Map(latest.current).set(request.key, entry));
        previous?.settle(false);
      });
    },
    [commit],
  );

  const value = useMemo(() => ({ entries, confirm, settle }), [entries, confirm, settle]);
  return <ConfirmContext value={value}>{children}</ConfirmContext>;
}

/** Resolves to the decision, or false on provider unmount/replacement. Callback errors reject the promise. */
export function useConfirm(): ConfirmFunction {
  return useConfirmContext().confirm;
}

export interface ConfirmDialogProps {
  /** Static key used to select this dialog's confirmation requests. */
  confirmKey?: string;
  container?: AlertDialog.Portal.Props['container'];
  /** Cancel an upstream dismissal before the pending confirmation is rejected. */
  onOpenChange?: AlertDialog.Root.Props['onOpenChange'];
}

/** Modal alert-dialog composition. Backdrop presses never settle a decision. */
export function ConfirmDialog({ confirmKey, container, onOpenChange }: ConfirmDialogProps) {
  const { entries, settle } = useConfirmContext();
  const t = useTranslate();
  const rejectButton = useRef<HTMLButtonElement>(null);
  const request = entries.get(confirmKey)?.request;
  return (
    <AlertDialog.Root
      open={request !== undefined}
      onOpenChange={(open, details) => {
        onOpenChange?.(open, details);
        if (!open && !details.isCanceled) settle(confirmKey, false);
      }}
    >
      {request !== undefined ? (
        <AlertDialog.Portal container={container} className="tumaet-ui-dialog-portal">
          <AlertDialog.Backdrop className="tumaet-ui-dialog-backdrop" />
          <AlertDialog.Popup className="tumaet-ui-dialog" initialFocus={rejectButton}>
            <div className="tumaet-ui-dialog-header">
              <AlertDialog.Title className="tumaet-ui-dialog-title">{request.title}</AlertDialog.Title>
              <AlertDialog.Close
                data-icon-only
                className="tumaet-ui-dialog-close"
                aria-label={t('tumAetUi.dialog.close')}
              >
                <XIcon />
              </AlertDialog.Close>
            </div>
            <div className="tumaet-ui-dialog-content">
              <div className="tumaet-ui-confirm-dialog-body">
                {Boolean(request.icon) && (
                  <span className="tumaet-ui-confirm-dialog-icon" aria-hidden="true">
                    {request.icon}
                  </span>
                )}
                <AlertDialog.Description render={<span />} className="tumaet-ui-confirm-dialog-message">
                  {request.message}
                </AlertDialog.Description>
              </div>
            </div>
            <div className="tumaet-ui-dialog-footer">
              <Button
                ref={rejectButton}
                severity={request.rejectSeverity ?? 'secondary'}
                onClick={() => settle(confirmKey, false)}
              >
                {request.rejectLabel}
              </Button>
              <Button severity={request.acceptSeverity ?? 'primary'} onClick={() => settle(confirmKey, true)}>
                {request.acceptLabel}
              </Button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      ) : null}
    </AlertDialog.Root>
  );
}
