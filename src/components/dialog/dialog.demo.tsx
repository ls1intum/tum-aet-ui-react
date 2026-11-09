import { Button } from '../button';
import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog';

export default function DialogDemo() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {(['small', 'medium', 'large', 'full'] as const).map((size) => (
        <Dialog key={size}>
          <DialogTrigger render={<Button variant="outlined" />}>Open {size}</DialogTrigger>
          <DialogPortal>
            <DialogBackdrop />
            <DialogPopup size={size}>
              <div className="tumaet-ui-dialog-header">
                <DialogTitle>Dialog ({size})</DialogTitle>
                <DialogClose />
              </div>
              <div className="tumaet-ui-dialog-content">
                <DialogDescription>Press Escape to close and return focus to the trigger.</DialogDescription>
                {size === 'full' && Array.from({ length: 40 }, (_, i) => <p key={i}>Scrolling content line {i + 1}</p>)}
              </div>
              <div className="tumaet-ui-dialog-footer">
                <DialogClose render={<Button />}>Done</DialogClose>
              </div>
            </DialogPopup>
          </DialogPortal>
        </Dialog>
      ))}
    </div>
  );
}
