import { ToggleSwitch } from './toggle-switch';

const rowStyle = { display: 'flex', gap: 8, alignItems: 'center' } as const;

export default function ToggleSwitchDemo() {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-off" aria-labelledby="toggle-demo-off-label" />
        <label id="toggle-demo-off-label" htmlFor="toggle-demo-off">
          Off
        </label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-on" aria-labelledby="toggle-demo-on-label" defaultChecked />
        <label id="toggle-demo-on-label" htmlFor="toggle-demo-on">
          On
        </label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch id="toggle-demo-disabled" aria-labelledby="toggle-demo-disabled-label" disabled />
        <label id="toggle-demo-disabled-label" htmlFor="toggle-demo-disabled">
          Disabled
        </label>
      </div>
      <div style={rowStyle}>
        <ToggleSwitch
          id="toggle-demo-disabled-on"
          aria-labelledby="toggle-demo-disabled-on-label"
          disabled
          defaultChecked
        />
        <label id="toggle-demo-disabled-on-label" htmlFor="toggle-demo-disabled-on">
          Disabled on
        </label>
      </div>
    </div>
  );
}
