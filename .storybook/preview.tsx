import type { Decorator, Preview } from '@storybook/react-vite';
import '../src/styles/index.css';

const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.body.style.background = 'var(--tumaet-ui-content-background)';
  document.body.style.color = 'var(--tumaet-ui-text-color)';
  document.body.style.fontFamily = 'var(--tumaet-ui-font-family)';
  return <Story />;
};

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: 'Theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light' },
  parameters: { layout: 'centered', a11y: { test: 'error' } },
};
export default preview;
