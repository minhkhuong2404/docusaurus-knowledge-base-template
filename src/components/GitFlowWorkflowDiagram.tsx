import React, { useState } from 'react';

const NODES = [
  { id: 'main', label: 'main', subtitle: 'Production releases', x: 30, y: 50, w: 120, h: 60, color: '#38bdf8', detail: { title: 'main Branch', body: 'Production-ready code ONLY. Every commit on main is tagged with a release version (v1.0.0).', tags: ['Tagged releases'] } },
  { id: 'develop', label: 'develop', subtitle: 'Integration branch', x: 190, y: 50, w: 120, h: 60, color: '#fbbf24', detail: { title: 'develop Branch', body: 'Nightly integration branch. Features merge into develop when complete.', tags: ['Nightly builds'] } },
  { id: 'feature', label: 'feature/*', subtitle: 'Topic branches', x: 350, y: 20, w: 120, h: 55, color: '#34d399', detail: { title: 'feature/* Branches', body: 'Branched from develop, merged back into develop via Pull Requests.', tags: ['Short-lived'] } },
  { id: 'hotfix', label: 'hotfix/*', subtitle: 'Emergency fixes', x: 350, y: 95, w: 120, h: 55, color: '#f87171', detail: { title: 'hotfix/* Branches', body: 'Branched from main to fix critical production bugs. Merged to BOTH main AND develop.', tags: ['Emergency fix'] } },
];

export default function GitFlowWorkflowDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-flow-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
          <path d="M18 9a9 9 0 0 1-9 9"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git-Flow Branching Strategy Topology
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-flow-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 500 170" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                </marker>
              </defs>
              <line x1="150" y1="80" x2="182" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-g)" />
              <line x1="310" y1="65" x2="342" y2="47" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-g)" />
              <line x1="310" y1="95" x2="342" y2="115" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arr-g)" />

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

          <div className={`interactive-diagram-details-card ${selNode ? 'details-blue' : 'details-gray'}`} style={{ minHeight: '170px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center' }}>
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
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click a branch node to inspect Git-Flow mechanics</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
