import React, { useState } from 'react';

const REFS = [
  { id: 'head', label: 'HEAD', subtitle: 'ref: refs/heads/feature', x: 40, y: 50, w: 140, h: 60, color: '#f87171', detail: { title: 'HEAD Pointer (.git/HEAD)', body: 'Text file containing a symbolic reference to the currently checked-out branch (ref: refs/heads/feature). In detached HEAD state, contains a direct 40-character commit SHA-1.', tags: ['Symbolic ref', 'Detached HEAD mode'] } },
  { id: 'feature', label: 'refs/heads/feature', subtitle: 'SHA-1: c2f4a1', x: 220, y: 30, w: 150, h: 55, color: '#38bdf8', detail: { title: 'Feature Branch Pointer (.git/refs/heads/feature)', body: 'A 41-byte text file storing the 40-character SHA-1 hash of the tip commit on the feature branch. Creating a branch is fast (O(1)) — Git simply writes 41 bytes to disk.', tags: ['Cheap branch creation', 'Pointers in refs/heads/'] } },
  { id: 'main', label: 'refs/heads/main', subtitle: 'SHA-1: a1b2c3', x: 220, y: 100, w: 150, h: 55, color: '#34d399', detail: { title: 'Main Branch Pointer (.git/refs/heads/main)', body: 'Stores the commit hash for the main branch tip.', tags: ['Default branch'] } },
  { id: 'commit_feat', label: 'Commit c2f4a1', subtitle: 'parent: a1b2c3', x: 410, y: 30, w: 130, h: 55, color: '#38bdf8', detail: { title: 'Feature Tip Commit (c2f4a1)', body: 'Commit node created on feature branch. Points to parent commit a1b2c3.', tags: ['DAG Node'] } },
  { id: 'commit_main', label: 'Commit a1b2c3', subtitle: 'parent: e8f9d0', x: 410, y: 100, w: 130, h: 55, color: '#34d399', detail: { title: 'Main Tip Commit (a1b2c3)', body: 'Commit node on main branch.', tags: ['DAG Node'] } },
];

export default function GitBranchesInternalsDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = REFS.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-bi-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
          <path d="M18 9a9 9 0 0 1-9 9"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Branch Pointers &amp; References (.git/refs/heads)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-bi-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 570 170" style={{ width: '100%', height: 'auto' }}>
              <defs>
                <marker id="arr-r" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
                </marker>
              </defs>
              <line x1="180" y1="65" x2="212" y2="52" stroke="#f87171" strokeWidth="2" markerEnd="url(#arr-r)" />
              <line x1="370" y1="57" x2="402" y2="57" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arr-r)" />
              <line x1="370" y1="127" x2="402" y2="127" stroke="#34d399" strokeWidth="2" markerEnd="url(#arr-r)" />
              <line x1="475" y1="85" x2="475" y2="100" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

              {REFS.map(n => {
                const isActive = selected === n.id;
                return (
                  <g key={n.id} onClick={() => setSelected(selected === n.id ? null : n.id)} style={{ cursor: 'pointer' }}>
                    <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="8" fill={isActive ? `${n.color}25` : `${n.color}10`} stroke={n.color} strokeWidth={isActive ? 2 : 1.5} />
                    <text x={n.x + n.w / 2} y={n.y + 24} textAnchor="middle" fill={n.color} fontSize="10.5" fontWeight="700">{n.label}</text>
                    <text x={n.x + n.w / 2} y={n.y + 42} textAnchor="middle" fill={n.color} fontSize="8.5" opacity={0.7}>{n.subtitle}</text>
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
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click HEAD or a branch ref to inspect internals</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
