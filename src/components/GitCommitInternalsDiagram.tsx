import React, { useState } from 'react';

const OBJECTS = [
  { id: 'commit', label: 'Commit Object', subtitle: 'SHA-1: 9a3f2b', x: 40, y: 50, w: 140, h: 65, color: '#38bdf8',
    detail: { title: 'Commit Object (9a3f2b)', body: 'Points to a top-level Tree object representing the root directory at commit time. Contains metadata: parent commit hash, author, committer, timestamp, and commit message.', tags: ['tree 7f8a1c', 'parent e4d201', 'author Alice', 'msg: Add auth'] } },
  { id: 'tree_root', label: 'Tree Object', subtitle: 'SHA-1: 7f8a1c (root /)', x: 230, y: 50, w: 140, h: 65, color: '#fbbf24',
    detail: { title: 'Tree Object (Root Directory)', body: 'A directory listing object. Contains entries mapping file names to Blob SHA-1 hashes (file mode 100644) and subdirectories to other Tree SHA-1 hashes (file mode 040000).', tags: ['100644 blob c3a1 → index.js', '040000 tree b2e9 → src/'] } },
  { id: 'blob1', label: 'Blob Object', subtitle: 'index.js (c3a1)', x: 420, y: 20, w: 130, h: 55, color: '#34d399',
    detail: { title: 'Blob Object (c3a1 - index.js)', body: 'Stores raw file content ONLY. Does not store filename, directory path, or permissions — metadata lives in the parent Tree object. Identical file content produces identical SHA-1 hashes.', tags: ['Binary data', 'zlib compressed', 'No filename stored'] } },
  { id: 'tree_src', label: 'Sub-Tree (src/)', subtitle: 'SHA-1: b2e9', x: 420, y: 95, w: 130, h: 55, color: '#fbbf24',
    detail: { title: 'Tree Object (src/ Subdirectory)', body: 'Nested tree for the src/ folder. Points to child blobs or further sub-trees.', tags: ['100644 blob d9f4 → app.css'] } },
];

export default function GitCommitInternalsDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = OBJECTS.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .git-commit-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17" y1="12" x2="22.95" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Object Database (.git/objects DAG)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="git-commit-grid" style={{ display: 'grid', gridTemplateColumns: '58% 42%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 580 170" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {['#38bdf8', '#fbbf24', '#34d399'].map(c => (
                  <marker key={c} id={`git-arr-${c.slice(1)}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill={c} />
                  </marker>
                ))}
              </defs>

              <line x1="180" y1="82" x2="222" y2="82" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#git-arr-38bdf8)" />
              <line x1="370" y1="65" x2="412" y2="47" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#git-arr-fbbf24)" />
              <line x1="370" y1="95" x2="412" y2="115" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#git-arr-fbbf24)" />

              {OBJECTS.map(n => {
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
                    <code key={t} style={{ fontSize: '10px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}30`, borderRadius: '4px', padding: '2px 6px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>Click an object (Commit, Tree, Blob) to inspect DAG relations</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
