import { resolve } from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    reporters: ['default', 'junit'],
    outputFile: { junit: 'build/storybook-results/junit.xml' },
    projects: ['light', 'dark'].map((theme) => ({
      extends: true,
      plugins: [storybookTest({ configDir: resolve(import.meta.dirname, '.storybook'), initialGlobals: { theme } })],
      test: {
        name: `storybook-${theme}`,
        browser: {
          enabled: true,
          headless: true,
          provider: playwright(),
          instances: [
            {
              browser: 'chromium',
              attachmentsDir: resolve(import.meta.dirname, `build/storybook-results/${theme}/attachments`),
            },
          ],
          screenshotFailures: true,
        },
      },
    })),
  },
});
