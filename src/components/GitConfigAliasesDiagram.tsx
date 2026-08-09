import React, { useState } from 'react';

const ALIASES = [
  { name: 'alias.st = status -sb', category: 'Shortcuts', color: '#38bdf8', desc: 'Short status display with branch info.' },
  { name: 'alias.co = checkout', category: 'Shortcuts', color: '#38bdf8', desc: 'Quick checkout command.' },
  { name: 'alias.lg = log --oneline --graph', category: 'History', color: '#34d399', desc: 'Pretty ASCII DAG graph log.' },
  { name: 'rebase.autoStash = true', category: 'Automation', color: '#fbbf24', desc: 'Automatically stashes uncommitted changes before rebase and applies them after.' },
  { name: 'rerere.enabled = true', category: 'Automation', color: '#fbbf24', desc: 'Reuse Recorded Resolution — remembers how you resolved merge conflicts and auto-resolves identical future conflicts.' },
  { name: 'pull.rebase = true', category: 'Sync', color: '#a78bfa', desc: 'Configures git pull to rebase local commits instead of creating merge commits.' },
];

export default function GitConfigAliasesDiagram(): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>('alias.lg = log --oneline --graph');

  const filtered = ALIASES.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase()));
  const sel = ALIASES.find(a => a.name === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Configuration &amp; Essential Aliases (.gitconfig)
        </span>
        <input type="text" placeholder="Search config…" value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
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
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', textAlign: 'center' }}>Select a config alias</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
