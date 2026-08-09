import React, { useState } from 'react';

const NODES = [
  { id: 'main_repo', label: 'Main Repo (.git)', subtitle: 'Single object store', x: 40, y: 50, w: 150, h: 60, color: '#38bdf8', detail: { title: 'Central Git Database (.git)', body: 'Stores all commit objects, trees, blobs, and ref logs in a single shared .git directory.', tags: ['Shared .git DB'] } },
  { id: 'wt1', label: 'Worktree 1 (main)', subtitle: '/project-main', x: 240, y: 20, w: 160, h: 55, color: '#34d399', detail: { title: 'Worktree 1 (main branch)', body: 'First working tree checked out to branch main.', tags: ['git worktree add'] } },
  { id: 'wt2', label: 'Worktree 2 (hotfix)', subtitle: '/project-hotfix', x: 240, y: 95, w: 160, h: 55, color: '#fbbf24', detail: { title: 'Worktree 2 (hotfix branch)', body: 'Second working tree checked out simultaneously to branch hotfix/bug-123. Allows instant hotfix editing without stashing or switching branches!', tags: ['Simultaneous checkout'] } },
];

export default function GitWorktreeDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-wt-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Worktree Parallel Checkouts (`git worktree add`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-wt-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 440 170" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-w" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                </marker>
              </defs>
              <line x1="190" y1="65" x2="232" y2="47" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-w)" />
              <line x1="190" y1="95" x2="232" y2="115" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-w)" />

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
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click main repo or worktree node to inspect mechanics</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
