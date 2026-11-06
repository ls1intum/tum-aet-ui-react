import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import '../../src/styles/index.css';

// Keep native dialog, focus, ResizeObserver, scrolling and layout intact.
afterEach(() => {
  cleanup();
});
