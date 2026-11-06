import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../../dist/styles.css';

// Keep native dialog, focus, ResizeObserver, scrolling and layout intact.
afterEach(() => {
  cleanup();
});
