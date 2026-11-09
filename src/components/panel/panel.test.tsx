import { createRef } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Panel, PanelContent, PanelHeader, PanelTitle, PanelTrigger, type PanelProps } from './panel';
function Example(props: PanelProps) {
  return (
    <Panel defaultOpen {...props}>
      <PanelHeader>
        <PanelTitle id="title">Details</PanelTitle>
        <PanelTrigger />
      </PanelHeader>
      <PanelContent role="region" aria-labelledby="title">
        Body <input aria-label="Draft" />
      </PanelContent>
    </Panel>
  );
}
describe('Panel', () => {
  it('uses upstream disclosure IDs and keyboard toggling', async () => {
    const change = vi.fn();
    render(<Example onOpenChange={change} />);
    const trigger = screen.getByRole('button', { name: 'Collapse' });
    const content = screen.getByRole('region', { name: 'Details' });
    expect(trigger).toHaveAttribute('aria-controls', content.id);
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(change).toHaveBeenLastCalledWith(false, expect.objectContaining({ reason: 'trigger-press' }));
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
    await userEvent.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox')).toBeVisible();
  });
  it('allows cancellation without changing open state', async () => {
    render(<Example onOpenChange={(_, details) => details.cancel()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(screen.getByRole('textbox')).toBeVisible();
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });
  it('keeps additional header controls independent and forwards refs/render state', async () => {
    const trigger = createRef<HTMLButtonElement>();
    const content = createRef<HTMLDivElement>();
    const edit = vi.fn();
    render(
      <Panel defaultOpen>
        <PanelHeader>
          <PanelTitle>Course</PanelTitle>
          <button type="button" onClick={edit}>
            Edit
          </button>
          <PanelTrigger
            ref={trigger}
            aria-label="Toggle course"
            render={(props, state) => <button type="button" {...props} data-open-state={state.open} />}
          />
        </PanelHeader>
        <PanelContent ref={content}>Course details</PanelContent>
      </Panel>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(edit).toHaveBeenCalledOnce();
    expect(trigger.current).toHaveAttribute('data-open-state', 'true');
    expect(content.current).toHaveTextContent('Course details');
  });
  it('preserves content when requested and follows controlled state', () => {
    const view = (open: boolean) => (
      <Panel open={open}>
        <PanelTrigger>Toggle</PanelTrigger>
        <PanelContent keepMounted>
          <input aria-label="Kept" defaultValue="draft" />
        </PanelContent>
      </Panel>
    );
    const { rerender } = render(view(true));
    const input = screen.getByRole('textbox');
    rerender(view(false));
    expect(input).not.toBeVisible();
    rerender(view(true));
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveValue('draft');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});
