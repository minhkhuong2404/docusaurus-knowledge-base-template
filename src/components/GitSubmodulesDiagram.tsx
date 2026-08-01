import React, { useState } from 'react';

const NODES = [
  { id: 'parent', label: 'Parent Repository', subtitle: 'root .git', x: 40, y: 50, w: 150, h: 60, color: '#38bdf8', detail: { title: 'Parent Repository', body: 'Main repository directory. Contains a .gitmodules configuration file mapping submodule paths to remote URLs.', tags: ['.gitmodules', 'git submodule add'] } },
  { id: 'submodule', label: 'Submodule Repo', subtitle: 'libs/ui @ commit 8a2f1c', x: 250, y: 50, w: 160, h: 60, color: '#a78bfa', detail: { title: 'Submodule Repository Pointer', body: 'Nested Git repository embedded at libs/ui. The parent repository tracks ONLY a commit SHA-1 pointer to this submodule repo, not its individual files.', tags: ['git submodule update', 'git clone --recursive'] } },
];

export default function GitSubmodulesDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-sub-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Submodule Pointer Mechanics (.gitmodules)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-sub-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 450 160" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-p" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#a78bfa" />
                </marker>
              </defs>
              <line x1="190" y1="80" x2="242" y2="80" stroke="#a78bfa" strokeWidth="2" markerEnd="url(#arr-p)" />

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

          <div className={`interactive-diagram-details-card ${selNode ? 'details-purple' : 'details-gray'}`} style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center' }}>
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
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click parent or submodule node to inspect pointer mapping</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
