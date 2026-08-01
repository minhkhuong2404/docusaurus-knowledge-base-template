import React, { useState } from 'react';

export default function OsFileSystemsIoDiagram(): React.JSX.Element {
  const [component, setComponent] = useState<'vfs' | 'inode' | 'fd'>('vfs');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Virtual File System (VFS), Inode Table &amp; File Descriptors
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setComponent('vfs')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'vfs' ? '1px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'vfs' ? 'rgba(251, 191, 36, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>VFS Abstraction</button>
          <button onClick={() => setComponent('inode')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'inode' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'inode' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Inode Metadata Structure</button>
          <button onClick={() => setComponent('fd')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: component === 'fd' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: component === 'fd' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>File Descriptor Map</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {component === 'vfs' && <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>VFS provides unified API (open, read, write) across ext4, XFS, NFS, and pseudofs (/proc, /sys).</p>}
          {component === 'inode' && <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Inode stores file size, permissions, owner UID, timestamps, and data block pointers. Filename is stored in Directory Entry (dentry).</p>}
          {component === 'fd' && <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Per-process File Descriptor table maps integer FDs (0=stdin, 1=stdout, 2=stderr) to open file table entries in system memory.</p>}
        </div>
      </div>
    </div>
  );
}