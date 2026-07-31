import React, { useState } from 'react';

export default function GitCommitInternalsDiagram(): React.JSX.Element {
  const [selectedNode, setSelectedNode] = useState<'commit' | 'tree' | 'blob'>('commit');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Git Internal Object Graph: Commit ➔ Tree ➔ Blob SHA-1 Objects
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setSelectedNode('commit')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedNode === 'commit' ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedNode === 'commit' ? 'rgba(167, 139, 250, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            1. Commit Object (`a1b2c3d`)
          </button>
          <button onClick={() => setSelectedNode('tree')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedNode === 'tree' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedNode === 'tree' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            2. Tree Object (`e5f6g7h`)
          </button>
          <button onClick={() => setSelectedNode('blob')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: selectedNode === 'blob' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: selectedNode === 'blob' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '12px', cursor: 'pointer' }}>
            3. Blob Object (`9x8y7z6`)
          </button>
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {selectedNode === 'commit' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>Commit Object (`a1b2c3d`)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Stores metadata: Top-level Tree SHA-1 pointer, parent commit SHA-1, author, committer, and commit message string.</p>
            </div>
          )}
          {selectedNode === 'tree' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>Tree Object (`e5f6g7h`)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Represents a directory in the filesystem. Contains a list of file modes, filenames, and SHA-1 pointers to child Blobs or sub-Trees.</p>
            </div>
          )}
          {selectedNode === 'blob' && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>Blob Object (`9x8y7z6`)</div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content)', margin: 0 }}>Binary Large Object storing pure raw file contents. Blobs do NOT store filenames or directory paths — metadata is held in Trees!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
