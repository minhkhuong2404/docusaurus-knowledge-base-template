import React, { useState } from 'react';

const NODES = [
  { id: 'local', label: 'Local Repository', subtitle: 'main @ HEAD', x: 30, y: 50, w: 140, h: 60, color: '#38bdf8', detail: { title: 'Local Repository', body: 'Your local working copy and .git database on your machine.', tags: ['git push', 'git fetch'] } },
  { id: 'origin', label: 'origin (Fork)', subtitle: 'github.com/user/repo', x: 230, y: 50, w: 150, h: 60, color: '#34d399', detail: { title: 'origin Remote (Personal Fork)', body: 'Your personal GitHub fork. You push feature branches here and open Pull Requests to upstream.', tags: ['git push origin feat'] } },
  { id: 'upstream', label: 'upstream (Main)', subtitle: 'github.com/org/repo', x: 430, y: 50, w: 150, h: 60, color: '#fbbf24', detail: { title: 'upstream Remote (Organization Repo)', body: 'The central canonical repository. You fetch latest updates from upstream to keep your fork in sync.', tags: ['git fetch upstream'] } },
];

export default function GitRemotesDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-remote-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Remote Topology (Local ↔ Origin ↔ Upstream)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-remote-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 600 160" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-b" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                </marker>
              </defs>
              <line x1="170" y1="80" x2="222" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-b)" />
              <line x1="380" y1="80" x2="422" y2="80" stroke="#34d399" strokeWidth="2" markerEnd="url(#arr-b)" />

              {NODES.map(n => {
                const isActive = selected === n.id;
                return (
                  <g key={n.id} onClick={() => setSelected(selected === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" fill={isActive ? `${n.color}25` : `${n.color}10`} stroke={n.color} strokeWidth={isActive ? 2 : 1.5} />
                    <text x={n.x + n.w / 2} y={n.y + 26} textAnchor="middle" fill={n.color} fontSize="11" fontWeight="700">{n.label}</text>
                    <text x={n.x + n.w / 2} y={n.y + 44} textAnchor="middle" fill={n.color} fontSize="8.5" opacity={0.7}>{n.subtitle}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`interactive-diagram-details-card ${selNode ? 'details-blue' : 'details-gray'}`} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '8px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 10px', lineHeight: 1.6 }}>{selNode.detail.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}40`, borderRadius: '4px', padding: '2px 6px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a remote node to inspect topology</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
