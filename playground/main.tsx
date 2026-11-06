import { createRoot } from 'react-dom/client';
import { useEffect, useState, type ComponentType } from 'react';
import '../src/styles/index.css';

// Every *.demo.tsx in src/components shows up here automatically.
const demos = import.meta.glob<{ default: ComponentType }>('../src/components/**/*.demo.tsx', { eager: true });
const entries = Object.entries(demos)
  .map(([path, mod]) => ({ name: (path.split('/').pop() ?? path).replace('.demo.tsx', ''), Demo: mod.default }))
  .sort((a, b) => a.name.localeCompare(b.name));

function App() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  return (
    <div
      className="tumaet-ui-root"
      style={{
        background: 'var(--tumaet-ui-content-background)',
        color: 'var(--tumaet-ui-text-color)',
        minHeight: '100vh',
        padding: 24,
        fontFamily: 'var(--tumaet-ui-font-family)',
      }}
    >
      <label>
        <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Dark
      </label>
      {entries.map(({ name, Demo }) => (
        <section
          key={name}
          id={name}
          style={{ margin: '24px 0', paddingTop: 16, borderTop: '1px solid var(--tumaet-ui-border-color)' }}
        >
          <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{name}</h2>
          <Demo />
        </section>
      ))}
    </div>
  );
}
const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Missing #root element');
createRoot(rootElement).render(<App />);
