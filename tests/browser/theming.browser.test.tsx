import { render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { Button } from '@tumaet/ui-react';

const palettes = {
  light: { backgroundColor: 'rgb(55, 121, 180)', color: 'rgb(255, 255, 255)' },
  dark: { backgroundColor: 'rgb(101, 161, 214)', color: 'rgb(22, 25, 29)' },
};
const surfaceStyle = { backgroundColor: 'var(--tumaet-ui-content-background)' };
let rootClass: string | null;
let rootTheme: string | null;

beforeEach(() => {
  rootClass = document.documentElement.getAttribute('class');
  rootTheme = document.documentElement.getAttribute('data-theme');
  document.documentElement.removeAttribute('class');
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  for (const [name, value] of [
    ['class', rootClass],
    ['data-theme', rootTheme],
  ] as const) {
    if (value === null) document.documentElement.removeAttribute(name);
    else document.documentElement.setAttribute(name, value);
  }
});

async function expectPalette(name: string, theme: keyof typeof palettes) {
  const button = page.getByRole('button', { name, exact: true });
  await expect.element(button).toHaveStyle({ colorScheme: theme });
  // Computed component colours catch missing token declarations even when the
  // colour-scheme marker itself is still correct. Poll through CSS transitions.
  await expect.poll(() => getComputedStyle(button.element()).backgroundColor).toBe(palettes[theme].backgroundColor);
  await expect.poll(() => getComputedStyle(button.element()).color).toBe(palettes[theme].color);
}

test('uses the light palette by default and resolves root theme markers', async () => {
  render(<Button>Root palette</Button>);
  await expectPalette('Root palette', 'light');
  for (const { className, attribute, theme } of [
    { className: 'dark', attribute: undefined, theme: 'dark' },
    { className: 'light', attribute: undefined, theme: 'light' },
    { className: 'light', attribute: 'dark', theme: 'dark' },
    { className: 'dark', attribute: 'light', theme: 'light' },
    { className: 'dark light', attribute: undefined, theme: 'light' },
    { className: 'dark', attribute: 'invalid', theme: 'dark' },
  ] as const) {
    document.documentElement.className = className;
    if (attribute === undefined) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', attribute);
    await expectPalette('Root palette', theme);
  }
});

test('renders distinct palettes across nested light and dark scopes', async () => {
  render(
    <>
      <section data-theme="light" aria-label="Light outer surface" style={surfaceStyle}>
        <Button>Light outer</Button>
        <section className="dark" aria-label="Dark middle surface" style={surfaceStyle}>
          <Button>Dark middle</Button>
          <section className="light" aria-label="Light inner surface" style={surfaceStyle}>
            <Button>Light inner</Button>
          </section>
        </section>
      </section>
      <section data-theme="dark" aria-label="Dark outer surface" style={surfaceStyle}>
        <Button>Dark outer</Button>
        <section className="light" aria-label="Light middle surface" style={surfaceStyle}>
          <Button>Light middle</Button>
          <section className="dark" aria-label="Dark inner surface" style={surfaceStyle}>
            <Button>Dark inner</Button>
          </section>
        </section>
      </section>
    </>,
  );
  for (const name of ['Light outer', 'Light middle', 'Light inner']) {
    await expectPalette(name, 'light');
    await expect
      .element(page.getByRole('region', { name: `${name} surface` }))
      .toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' });
  }
  for (const name of ['Dark outer', 'Dark middle', 'Dark inner']) {
    await expectPalette(name, 'dark');
    await expect
      .element(page.getByRole('region', { name: `${name} surface` }))
      .toHaveStyle({ backgroundColor: 'rgb(22, 25, 29)' });
  }
});

test('lets application CSS override tokens and component layout', async () => {
  const style = document.createElement('style');
  style.textContent = `
    @layer app {
      .theme-test-override {
        --tumaet-ui-primary-color: rgb(18, 52, 86);
        padding-inline: 37px;
      }
    }
    .theme-test-unlayered { padding-inline: 41px; }
    @layer utilities { .theme-test-utility { padding-inline: 43px; } }
  `;
  document.head.append(style);
  try {
    render(
      <>
        <Button size="small" className="theme-test-override">
          Application override
        </Button>
        <Button size="small" className="theme-test-unlayered">
          Unlayered override
        </Button>
        <Button size="small" className="theme-test-utility">
          Utility override
        </Button>
      </>,
    );
    const button = page.getByRole('button', { name: 'Application override' });
    await expect.element(button).toHaveStyle({ backgroundColor: 'rgb(18, 52, 86)', paddingInlineStart: '37px' });
    await expect
      .element(page.getByRole('button', { name: 'Unlayered override' }))
      .toHaveStyle({ paddingInlineStart: '41px' });
    await expect
      .element(page.getByRole('button', { name: 'Utility override' }))
      .toHaveStyle({ paddingInlineStart: '43px' });
  } finally {
    style.remove();
  }
});
