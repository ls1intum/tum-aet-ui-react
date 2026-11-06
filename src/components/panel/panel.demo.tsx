import { Panel, PanelHeader, PanelTitle, PanelTrigger, PanelContent } from './panel';
export default function PanelDemo() {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Panel defaultOpen>
        <PanelHeader>
          <PanelTitle>Static panel</PanelTitle>
        </PanelHeader>
        <PanelContent>Always visible content.</PanelContent>
      </Panel>
      <Panel defaultOpen>
        <PanelHeader>
          <PanelTitle>Exercise details</PanelTitle>
          <PanelTrigger />
        </PanelHeader>
        <PanelContent>
          Toggleable content and <a href="#details">details</a>.
        </PanelContent>
      </Panel>
      <Panel>
        <PanelHeader>
          <PanelTitle>Custom control</PanelTitle>
          <PanelTrigger aria-label="Toggle custom panel">Details</PanelTrigger>
        </PanelHeader>
        <PanelContent>Initially closed.</PanelContent>
      </Panel>
    </div>
  );
}
