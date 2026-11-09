import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expectNoA11yViolations } from '../../test-utils';
import { Splitter } from './splitter';

function setup(props: Partial<React.ComponentProps<typeof Splitter>> = {}) {
  const utils = render(
    <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} {...props}>
      <input aria-label="Draft" />
      <p>Second</p>
    </Splitter>,
  );
  return { ...utils, separator: screen.getByRole('separator', { hidden: true }) };
}

describe('Splitter', () => {
  beforeEach(() => window.localStorage.clear());

  it('renders two panels and a named focusable separator with value attributes', () => {
    const { separator } = setup();
    expect(screen.getByLabelText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(separator).toHaveAccessibleName('Resize panels');
    expect(separator).toHaveAttribute('tabindex', '0');
    expect(separator).toHaveAttribute('aria-orientation', 'vertical');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    expect(separator).toHaveAttribute('aria-valuemin', '20');
    expect(separator).toHaveAttribute('aria-valuemax', '70');
  });

  it('resizes with arrow keys, Shift, Home and End and clamps to the minimums', async () => {
    const onResizeEnd = vi.fn();
    const onSizesChange = vi.fn();
    const { separator } = setup({ onResizeEnd, onSizesChange });
    separator.focus();
    expect(separator).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    expect(onResizeEnd).toHaveBeenLastCalledWith([62, 38]);
    await userEvent.keyboard('{ArrowLeft}');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    await userEvent.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    expect(separator).toHaveAttribute('aria-valuenow', '50');
    await userEvent.keyboard('{Home}');
    expect(separator).toHaveAttribute('aria-valuenow', '20');
    await userEvent.keyboard('{End}{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    expect(onSizesChange).toHaveBeenCalled();
  });

  it('uses Up/Down in vertical layout and ignores Left/Right', async () => {
    const { separator } = setup({ layout: 'vertical' });
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    separator.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(separator).toHaveAttribute('aria-valuenow', '58');
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '58');
  });

  it('normalizes weights, impossible minimums and invalid sizes', () => {
    const { rerender } = setup({ panelSizes: [6, 4] });
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '60');
    rerender(
      <Splitter panelSizes={[Number.NaN, 40]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('aria-valuenow', '50');
    rerender(
      <Splitter minSizes={[80, 80]}>
        <i />
        <i />
      </Splitter>,
    );
    const separator = screen.getByRole('separator');
    expect(separator).toHaveAttribute('aria-valuemin', '50');
    expect(separator).toHaveAttribute('aria-valuemax', '50');
  });

  it('keeps user resizes until panelSizes change', async () => {
    const { rerender, separator } = setup();
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    rerender(
      <Splitter panelSizes={[60, 40]} minSizes={[20, 30]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '62');
    rerender(
      <Splitter panelSizes={[40, 60]} minSizes={[20, 30]}>
        <i />
        <i />
      </Splitter>,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '40');
  });

  it('resizes by pointer drag and finishes with onResizeEnd; Escape-less cancel via pointercancel restores', () => {
    const onResizeEnd = vi.fn();
    const { container, separator } = setup({ onResizeEnd, gutterSize: 8 });
    const root = container.firstElementChild as HTMLElement;
    vi.spyOn(root, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1008, height: 508 } as DOMRect);
    const pointer = (target: Element | Document, type: string, x: number, init: PointerEventInit = {}) =>
      fireEvent(
        target,
        Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button: 0, ...init }), {
          pointerId: 1,
        }),
      );
    pointer(separator, 'pointerdown', 600);
    expect(document.querySelector('[data-tumaet-splitter-shield]')).not.toBeNull();
    pointer(document, 'pointermove', 700);
    // 100px of 1000px available is 10 points.
    expect(separator).toHaveAttribute('aria-valuenow', '70');
    pointer(document, 'pointermove', 650);
    expect(separator).toHaveAttribute('aria-valuenow', '65');
    pointer(document, 'pointerup', 650);
    expect(document.querySelector('[data-tumaet-splitter-shield]')).toBeNull();
    expect(onResizeEnd).toHaveBeenLastCalledWith([65, 35]);

    pointer(separator, 'pointerdown', 600);
    pointer(document, 'pointermove', 500);
    pointer(document, 'pointercancel', 500);
    expect(separator).toHaveAttribute('aria-valuenow', '65');
    expect(document.querySelector('[data-tumaet-splitter-shield]')).toBeNull();
  });

  it('persists to localStorage per layout when stateKey is set', async () => {
    const { separator } = setup({ stateKey: 'k' });
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(window.localStorage.getItem('k-horizontal')).toBe('62');
  });

  it('hides the separator and ignores keys when the second panel is collapsed, keeping both panels mounted', async () => {
    const { rerender, separator } = setup({ collapsedSecondSize: '3rem' });
    expect(separator).not.toBeVisible();
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByLabelText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    rerender(
      <Splitter>
        <i />
        <i />
      </Splitter>,
    );
  });

  it('has no accessibility violations', async () => {
    render(
      <main>
        <Splitter separatorLabel="Resize documents">
          <p>A</p>
          <p>B</p>
        </Splitter>
      </main>,
    );
    await expectNoA11yViolations();
  });

  describe('pointer gestures', () => {
    const pointer = (target: Element | Document | Window, type: string, x = 0, pointerId = 1, button = 0) =>
      fireEvent(
        target,
        Object.assign(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, button }), { pointerId }),
      );
    const shield = () => document.querySelector('[data-tumaet-splitter-shield]');
    const mockWidth = (container: HTMLElement, width = 1008) =>
      vi.spyOn(container.firstElementChild as HTMLElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width,
        height: 508,
      } as DOMRect);

    it('ignores the secondary button, other pointers, and rolls back cancellations without onResizeEnd', () => {
      const onResizeEnd = vi.fn();
      const { container, separator } = setup({ onResizeEnd, gutterSize: 8 });
      mockWidth(container);
      pointer(separator, 'pointerdown', 600, 1, 2);
      expect(shield()).toBeNull();
      pointer(separator, 'pointerdown', 600);
      pointer(document, 'pointermove', 650, 2);
      pointer(document, 'pointercancel', 0, 2);
      expect(separator).toHaveAttribute('aria-valuenow', '60');
      expect(shield()).not.toBeNull();
      pointer(document, 'pointermove', 650);
      expect(separator).toHaveAttribute('aria-valuenow', '65');
      pointer(document, 'pointercancel', 650);
      expect(separator).toHaveAttribute('aria-valuenow', '60');
      expect(onResizeEnd).not.toHaveBeenCalled();
    });

    it.each(['lostpointercapture', 'blur'])('cancels the gesture on %s', (event) => {
      const { container, separator } = setup({ gutterSize: 8 });
      mockWidth(container);
      pointer(separator, 'pointerdown', 600);
      pointer(document, 'pointermove', 650);
      pointer(event === 'blur' ? window : separator, event);
      expect(shield()).toBeNull();
      expect(separator).toHaveAttribute('aria-valuenow', '60');
    });

    it('uses the rendered gutter size for the pointer percentages', () => {
      const { container, separator } = setup();
      mockWidth(container);
      vi.spyOn(separator, 'getBoundingClientRect').mockReturnValue({ width: 108, height: 508 } as DOMRect);
      pointer(separator, 'pointerdown', 600);
      pointer(document, 'pointermove', 645);
      expect(separator).toHaveAttribute('aria-valuenow', '65');
      pointer(document, 'pointerup', 645);
    });

    it('continues a persisted drag when the parent echoes the emitted sizes', () => {
      function Controlled() {
        const [sizes, setSizes] = useState<[number, number]>([60, 40]);
        return (
          <Splitter panelSizes={sizes} minSizes={[20, 30]} gutterSize={8} stateKey="echo" onSizesChange={setSizes}>
            <i />
            <i />
          </Splitter>
        );
      }
      window.localStorage.setItem('echo-horizontal', '60');
      const { container } = render(<Controlled />);
      mockWidth(container, 966);
      const separator = screen.getByRole('separator');
      pointer(separator, 'pointerdown', 600);
      pointer(document, 'pointermove', 601);
      expect(shield()).not.toBeNull();
      pointer(document, 'pointermove', 603);
      expect(shield()).not.toBeNull();
      expect(Number(separator.getAttribute('aria-valuenow'))).toBeCloseTo(60 + (3 * 100) / 958, 8);
      pointer(document, 'pointerup', 603);
      expect(shield()).toBeNull();
    });

    it('ends a running drag when the parent replaces the panel sizes', () => {
      const { container, rerender, separator } = setup({ gutterSize: 8 });
      mockWidth(container);
      pointer(separator, 'pointerdown', 600);
      pointer(document, 'pointermove', 650);
      rerender(
        <Splitter panelSizes={[45, 55]} minSizes={[20, 30]} gutterSize={8}>
          <i />
          <i />
        </Splitter>,
      );
      expect(shield()).toBeNull();
      expect(separator).toHaveAttribute('aria-valuenow', '45');
      pointer(document, 'pointermove', 700);
      expect(separator).toHaveAttribute('aria-valuenow', '45');
    });

    it('ends a running drag when the second panel collapses or the layout changes, and on unmount', () => {
      const { container, rerender, separator, unmount } = setup({ gutterSize: 8 });
      mockWidth(container);
      pointer(separator, 'pointerdown', 600);
      rerender(
        <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} gutterSize={8} collapsedSecondSize="3rem">
          <i />
          <i />
        </Splitter>,
      );
      expect(shield()).toBeNull();
      rerender(
        <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} gutterSize={8}>
          <i />
          <i />
        </Splitter>,
      );
      pointer(separator, 'pointerdown', 600);
      rerender(
        <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} gutterSize={8} layout="vertical">
          <i />
          <i />
        </Splitter>,
      );
      expect(shield()).toBeNull();
      pointer(separator, 'pointerdown', 600);
      expect(shield()).not.toBeNull();
      unmount();
      expect(shield()).toBeNull();
    });
  });

  it('ignores unrelated keys and invalid stored values, and keeps independent sizes per layout', async () => {
    window.localStorage.setItem('k-horizontal', 'invalid');
    window.localStorage.setItem('k-vertical', '35');
    const { rerender, separator } = setup({ stateKey: 'k' });
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    separator.focus();
    await userEvent.keyboard('{Enter}');
    expect(separator).toHaveAttribute('aria-valuenow', '60');
    rerender(
      <Splitter panelSizes={[60, 40]} minSizes={[20, 30]} stateKey="k" layout="vertical">
        <i />
        <i />
      </Splitter>,
    );
    expect(separator).toHaveAttribute('aria-valuenow', '35');
  });

  it('keeps resizing available when local storage fails', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('disabled');
    });
    const onResizeEnd = vi.fn();
    const { separator } = setup({ stateKey: 'k', onResizeEnd });
    separator.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onResizeEnd).toHaveBeenCalledWith([62, 38]);
    vi.restoreAllMocks();
  });

  it('uses an explicit separator label', () => {
    const { separator } = setup({ separatorLabel: 'Resize documents' });
    expect(separator).toHaveAccessibleName('Resize documents');
  });

  it('keeps the panel content mounted across collapse and expand', () => {
    const { rerender } = setup();
    const input = screen.getByLabelText<HTMLInputElement>('Draft');
    input.value = 'Edited';
    rerender(
      <Splitter collapsedSecondSize="3rem">
        <input aria-label="Draft" />
        <p>Second</p>
      </Splitter>,
    );
    rerender(
      <Splitter>
        <input aria-label="Draft" />
        <p>Second</p>
      </Splitter>,
    );
    expect(screen.getByLabelText('Draft')).toBe(input);
    expect(input.value).toBe('Edited');
  });

  it('keeps a stable caller ref attached across resizing and releases it on unmount', async () => {
    const cleanup = vi.fn();
    const ref = vi.fn((node: HTMLDivElement | null) => (node ? cleanup : undefined));
    const { separator, unmount } = setup({ ref });
    const root = ref.mock.calls[0]?.[0];
    expect(root).toHaveClass('tumaet-ui-splitter');
    separator.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}');
    expect(ref).toHaveBeenCalledOnce();
    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
