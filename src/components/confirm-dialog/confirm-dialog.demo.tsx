import { useState } from 'react';
import { Button } from '../button';
import { WarningIcon } from '../../internal/icons';
import { ConfirmDialog, ConfirmProvider, useConfirm } from './confirm-dialog';

function Demo() {
  const confirm = useConfirm();
  const [result, setResult] = useState('No decision yet');
  const ask = async () => {
    const accepted = await confirm({
      title: 'Delete tutorial group?',
      message: 'This action cannot be undone.',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      acceptSeverity: 'danger',
      icon: <WarningIcon />,
    });
    setResult(accepted ? 'Deleted' : 'Cancelled');
  };
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button
        severity="danger"
        variant="outlined"
        onClick={() => {
          void ask();
        }}
      >
        Delete tutorial group
      </Button>
      <span>{result}</span>
      <ConfirmDialog />
    </div>
  );
}

export default function ConfirmDialogDemo() {
  return (
    <ConfirmProvider>
      <Demo />
    </ConfirmProvider>
  );
}
