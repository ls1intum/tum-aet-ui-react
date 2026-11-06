import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expectNoA11yViolations } from '../../test-utils';
import { Tab, TabIndicator, TabList, TabPanel, TabPanels, Tabs, type TabsProps } from './tabs';

function Example(props: TabsProps) {
  return (
    <Tabs defaultValue="a" {...props}>
      <TabList aria-label="Sections">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c" disabled>
          Gamma
        </Tab>
        <TabIndicator />
      </TabList>
      <TabPanels>
        <TabPanel value="a">Panel A</TabPanel>
        <TabPanel value="b">Panel B</TabPanel>
      </TabPanels>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('associates tabs and panels through upstream IDs', () => {
    render(<Example />);
    const panel = screen.getByRole('tabpanel', { name: 'Alpha' });
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-controls', panel.id);
    expect(panel).toHaveTextContent('Panel A');
  });
  it('defaults to manual activation and reports upstream change details', async () => {
    const change = vi.fn();
    render(<Example onValueChange={change} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Alpha' }));
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
    await userEvent.keyboard('{Enter}');
    expect(change).toHaveBeenLastCalledWith('b', expect.objectContaining({ reason: 'none' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel B');
  });
  it('honors value cancellation and native handler composition', async () => {
    const change = vi.fn<NonNullable<TabsProps['onValueChange']>>((_, details) => details.cancel());
    render(<Example onValueChange={change} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(change).toHaveBeenCalled();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
  });
  it('keeps numeric and string values distinct, and preserves mounted panels', async () => {
    render(
      <Tabs defaultValue={1}>
        <TabList aria-label="Typed">
          <Tab value={1}>Number</Tab>
          <Tab value="1">String</Tab>
        </TabList>
        <TabPanel value={1} keepMounted>
          <input aria-label="Draft" />
        </TabPanel>
        <TabPanel value="1">String panel</TabPanel>
      </Tabs>,
    );
    const draft = screen.getByRole('textbox', { name: 'Draft' });
    await userEvent.type(draft, 'saved');
    await userEvent.click(screen.getByRole('tab', { name: 'String' }));
    expect(draft).not.toBeVisible();
    await userEvent.click(screen.getByRole('tab', { name: 'Number' }));
    expect(screen.getByRole('textbox', { name: 'Draft' })).toBe(draft);
    expect(draft).toHaveValue('saved');
  });
  it('preserves render state, refs and prevented button handlers', async () => {
    const tab = createRef<HTMLButtonElement>();
    render(
      <Tabs defaultValue="a">
        <TabList aria-label="Render">
          <Tab value="a">Alpha</Tab>
          <Tab
            ref={tab}
            value="b"
            render={(props, state) => <button type="button" {...props} data-active-state={state.active} />}
            onClick={(event) => event.preventBaseUIHandler()}
          >
            Beta
          </Tab>
        </TabList>
        <TabPanel value="a">Panel A</TabPanel>
      </Tabs>,
    );
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(tab.current).toBe(screen.getByRole('tab', { name: 'Beta' }));
    expect(tab.current).toHaveAttribute('data-active-state', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel A');
  });
  it('has no axe violations', async () => {
    const { container } = render(<Example />);
    await expectNoA11yViolations(container);
  });
});
