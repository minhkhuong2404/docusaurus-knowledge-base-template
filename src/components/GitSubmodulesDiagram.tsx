import React, { useState } from 'react';

export default function GitSubmodulesDiagram(): React.JSX.Element {
  const [selectedPointer, setSelectedPointer] = useState<string>('c1a2b3');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Submodules Gitlink Mode `160000` SHA-1 Pointer Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Parent Repo Tree Object Entry for <code>vendor/libfoo</code>:
          </div>
          <div style={{ fontSize: '12.5px', fontFamily: 'monospace', color: '#38bdf8' }}>
            160000 commit {selectedPointer} vendor/libfoo
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setSelectedPointer('c1a2b3')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedPointer === 'c1a2b3' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedPointer === 'c1a2b3' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Pin to v1.2.0 (`c1a2b3`)
          </button>
          <button onClick={() => setSelectedPointer('f9e8d7')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedPointer === 'f9e8d7' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedPointer === 'f9e8d7' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11.5px', cursor: 'pointer' }}>
            Update to v1.3.0 (`f9e8d7`)
          </button>
        </div>
      </div>
    </div>
  );
}
