import { render } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { Splitter } from '@tumaet/ui-react';

test.each([
  { layout: 'horizontal', direction: 'ltr' },
  { layout: 'horizontal', direction: 'rtl' },
  { layout: 'vertical', direction: 'rtl' },
] as const)(
  '$layout splitter follows physical keyboard and pointer movement in $direction',
  async ({ layout, direction }) => {
    const end = vi.fn();
    render(
      <div dir={direction}>
        <Splitter
          data-testid="splitter"
          layout={layout}
          panelSizes={[60, 40]}
          minSizes={[20, 20]}
          onResizeEnd={end}
          style={{ width: 500, height: 300 }}
        >
          <p>First panel</p>
          <p>Second panel</p>
        </Splitter>
      </div>,
    );
    const root = page.getByTestId('splitter');
    const separator = page.getByRole('separator', { name: 'Resize panels' });
    const horizontal = layout === 'horizontal';
    const position = () => {
      const rect = separator.element().getBoundingClientRect();
      return horizontal ? rect.left : rect.top;
    };
    const initial = position();
    separator.element().focus();
    await userEvent.keyboard(horizontal ? '{ArrowLeft}' : '{ArrowUp}');
    await expect.poll(position).toBeLessThan(initial - 1);
    const afterKey = horizontal && direction === 'rtl' ? 62 : 58;
    await expect.element(separator).toHaveAttribute('aria-valuenow', String(afterKey));
    await expect.element(separator).toHaveFocus();

    const beforeDrag = position();
    const dividerRect = separator.element().getBoundingClientRect();
    const rootRect = root.element().getBoundingClientRect();
    const available = horizontal ? rootRect.width - dividerRect.width : rootRect.height - dividerRect.height;
    await userEvent.dragAndDrop(separator, root, {
      // The pointer shield deliberately covers the destination after the press.
      force: true,
      sourcePosition: { x: dividerRect.width / 2, y: dividerRect.height / 2 },
      targetPosition: {
        x: dividerRect.left - rootRect.left + dividerRect.width / 2 + (horizontal ? 40 : 0),
        y: dividerRect.top - rootRect.top + dividerRect.height / 2 + (horizontal ? 0 : 40),
      },
    });

    await expect.poll(() => Math.abs(position() - beforeDrag - 40)).toBeLessThan(2);
    const sign = horizontal && direction === 'rtl' ? -1 : 1;
    expect(Number(separator.element().getAttribute('aria-valuenow'))).toBeCloseTo(
      afterKey + (sign * 4000) / available,
      0,
    );
    expect(end).toHaveBeenCalledTimes(2);
    expect(document.querySelector('[data-tumaet-splitter-shield]')).toBeNull();
    await userEvent.keyboard('{Home}');
    await expect.element(separator).toHaveAttribute('aria-valuenow', '20');
    await userEvent.keyboard('{End}');
    await expect.element(separator).toHaveAttribute('aria-valuenow', '80');
  },
);

test('hydrates the server size before restoring persistence and resizing from the visible value', async () => {
  const key = 'splitter-hydration-regression-horizontal';
  const previous = localStorage.getItem(key);
  localStorage.removeItem(key);
  const host = document.createElement('div');
  host.dir = 'ltr';
  const element = (
    <Splitter
      stateKey="splitter-hydration-regression"
      separatorLabel="Resize persisted panels"
      panelSizes={[50, 50]}
      style={{ width: 500, height: 200 }}
    >
      <p>First panel</p>
      <p>Second panel</p>
    </Splitter>
  );
  host.innerHTML = renderToString(element);
  document.body.appendChild(host);
  const separator = page.getByRole('separator', { name: 'Resize persisted panels' });
  expect(separator.element()).toHaveAttribute('aria-valuenow', '50');
  localStorage.setItem(key, '20');
  const recoverable = vi.fn();
  let view: { unmount: () => void } | undefined;
  try {
    view = render(element, { container: host, hydrate: true, onRecoverableError: recoverable });
    await expect.element(separator).toHaveAttribute('aria-valuenow', '20');
    const firstPanel = host.querySelector('.tumaet-ui-splitter-panel');
    if (!firstPanel) throw new Error('Missing persisted panel');
    await expect.poll(() => firstPanel.getBoundingClientRect().width).toBeCloseTo((500 - 6) * 0.2, 0);
    expect(recoverable).not.toHaveBeenCalled();
    separator.element().focus();
    await userEvent.keyboard('{ArrowRight}');
    await expect.element(separator).toHaveAttribute('aria-valuenow', '22');
    expect(localStorage.getItem(key)).toBe('22');
  } finally {
    view?.unmount();
    host.remove();
    if (previous === null) localStorage.removeItem(key);
    else localStorage.setItem(key, previous);
  }
});
