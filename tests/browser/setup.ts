import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../../src/styles/themes.css';
import '../../src/styles/base.css';
import '../../src/components/dialog/dialog.css';
import '../../src/components/popover/popover.css';
import '../../src/components/select/select.css';
import '../../src/components/select/listbox.css';

// Keep native dialog, focus, ResizeObserver, scrolling and layout intact.
afterEach(() => {
  cleanup();
});
