import React, { useState } from 'react';

interface GitFile {
  name: string;
  status: 'untracked' | 'modified' | 'staged' | 'committed';
}

export default function GitAddStagingDiagram(): React.JSX.Element {
  const [files, setFiles] = useState<GitFile[]>([
    { name: 'index.js', status: 'untracked' },
    { name: 'app.css', status: 'modified' },
    { name: 'README.md', status: 'staged' },
  ]);

  const stageFile = (name: string) => {
    setFiles(files.map(f => f.name === name ? { ...f, status: 'staged' } : f));
  };

  const commitFile = (name: string) => {
    setFiles(files.map(f => f.name === name ? { ...f, status: 'committed' } : f));
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="12 5 19 12 12 19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git 3-State Lifecycle Simulator (Working Tree ➔ Staging Area ➔ Commit)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
          {/* Working Directory */}
          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#f87171', fontWeight: 700, marginBottom: '8px' }}>
              1. Working Directory
            </div>
            {files.filter(f => f.status === 'untracked' || f.status === 'modified').map(f => (
              <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#05070e', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px', color: '#fff' }}>
                <span>{f.name} ({f.status})</span>
                <button onClick={() => stageFile(f.name)} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#38bdf8', color: '#000', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  git add
                </button>
              </div>
            ))}
          </div>

          {/* Staging Area */}
          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#fbbf24', fontWeight: 700, marginBottom: '8px' }}>
              2. Staging Area (Index)
            </div>
            {files.filter(f => f.status === 'staged').map(f => (
              <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#05070e', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px', color: '#fff' }}>
                <span>{f.name}</span>
                <button onClick={() => commitFile(f.name)} style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: '#34d399', color: '#000', border: 'none', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>
                  git commit
                </button>
              </div>
            ))}
          </div>

          {/* Repository */}
          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#34d399', fontWeight: 700, marginBottom: '8px' }}>
              3. Local Repository (HEAD)
            </div>
            {files.filter(f => f.status === 'committed').map(f => (
              <div key={f.name} style={{ backgroundColor: '#05070e', padding: '6px 8px', borderRadius: '4px', marginBottom: '6px', fontSize: '12px', color: '#34d399', fontWeight: 600 }}>
                {f.name} (Committed)
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
