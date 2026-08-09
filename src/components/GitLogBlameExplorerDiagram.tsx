import React, { useState } from 'react';

const COMMANDS = [
  { name: 'git log --oneline --graph', category: 'Log Formatting', color: '#38bdf8', desc: 'Displays ASCII commit DAG graph with single-line commit summaries and short SHA-1 hashes.' },
  { name: 'git log -p -2', category: 'Diff Inspection', color: '#34d399', desc: 'Displays full patch diffs for the last 2 commits.' },
  { name: 'git blame -L 10,20 app.js', category: 'Line Annotation', color: '#fbbf24', desc: 'Annotates lines 10 to 20 of app.js with the commit SHA, author, and timestamp of the last modification.' },
  { name: 'git log -S "SECRET_KEY"', category: 'Code Search (Pickaxe)', color: '#f87171', desc: 'Searches history for commits that added or removed the specific string "SECRET_KEY".' },
];

export default function GitLogBlameExplorerDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>('git log --oneline --graph');

  const filtered = COMMANDS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.toLowerCase().includes(search.toLowerCase()));
  const sel = COMMANDS.find(c => c.name === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Log &amp; Blame History Search Reference
        </span>
        <input type="text" placeholder="Search commands…" value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
          style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'var(--ifm-color-content)', fontSize: '12px', outline: 'none', width: '140px' }} />
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {filtered.map(item => (
              <button key={item.name} onClick={() => setSelected(item.name === selected ? null : item.name)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', textAlign: 'left', background: selected === item.name ? `${item.color}15` : 'rgba(255,255,255,0.03)', boxShadow: selected === item.name ? `0 0 0 1.5px ${item.color}50` : '0 0 0 1px rgba(255,255,255,0.06)' }}>
                <code style={{ fontSize: '11px', color: item.color, fontWeight: 700 }}>{item.name}</code>
              </button>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', padding: '14px' }}>
            {sel ? (
              <div>
                <code style={{ fontSize: '12px', fontWeight: 700, color: sel.color, display: 'block', marginBottom: '6px' }}>{sel.name}</code>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: 0, lineHeight: 1.6 }}>{sel.desc}</p>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center' }}>Select a command</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
