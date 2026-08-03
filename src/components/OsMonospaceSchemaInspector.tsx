import React, { useState } from 'react';

const OS_SCHEMAS = [
  {
    id: 'inode_struct',
    name: '1. Linux Inode Monospace Layout (128 Bytes Kernel Struct)',
    spec: `struct inode {
  umode_t         i_mode;     /* File type & permissions (2 bytes) */
  uid_t           i_uid;      /* Owner User ID (4 bytes) */
  gid_t           i_gid;      /* Group ID (4 bytes) */
  unsigned long   i_ino;      /* Inode serial number (8 bytes) */
  loff_t          i_size;     /* File size in bytes (8 bytes) */
  struct timespec i_atime;    /* Access time (16 bytes) */
  struct timespec i_mtime;    /* Modify time (16 bytes) */
  struct timespec i_ctime;    /* Change time (16 bytes) */
  nlink_t         i_nlink;    /* Hard link count (4 bytes) */
  blkcnt_t        i_blocks;   /* 512B blocks allocated (8 bytes) */
  unsigned int    i_flags;    /* File flags (e.g. append, immutable) */
};`,
    fields: [
      { name: 'i_mode & i_ino', type: 'uint16 + uint64', desc: 'Encodes POSIX permissions (e.g. 0644) and unique filesystem serial number.' },
      { name: 'i_size', type: 'int64 (8B)', desc: 'Exact file size in bytes. Unrelated to block allocation on disk.' },
      { name: 'i_nlink', type: 'uint32 (4B)', desc: 'Reference counter for hard links. File deleted from disk when i_nlink == 0.' }
    ]
  },
  {
    id: 'syscall_frame',
    name: '2. Linux x86_64 SYSCALL Register Frame (Ring 3 -> Ring 0)',
    spec: `Register   Role / Purpose                 Example Value
--------   ────────────────────────────── ──────────────────────────────
rax        Syscall Number (sys_call_table) 1 (sys_write), 0 (sys_read)
rdi        Argument 1                     fd (File Descriptor e.g. 1 stdout)
rsi        Argument 2                     char *buf (Buffer address)
rdx        Argument 3                     count (Byte count e.g. 13)
r10        Argument 4                     flags (Optional e.g. sendto)
r8         Argument 5                     sockaddr (Optional)
r9         Argument 6                     addrlen (Optional)`,
    fields: [
      { name: 'rax (Syscall #)', type: 'Register rax', desc: 'Holds unique Linux kernel syscall index (e.g. rax=1 for sys_write).' },
      { name: 'rdi, rsi, rdx', type: 'Registers rdi/rsi/rdx', desc: 'Standard System V ABI registers for first 3 syscall parameters.' }
    ]
  }
];

export default function OsMonospaceSchemaInspector(): React.JSX.Element {
  const [selectedSchemaIdx, setSelectedSchemaIdx] = useState<number>(0);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number>(0);

  const currSchema = OS_SCHEMAS[selectedSchemaIdx];
  const currField = currSchema.fields[selectedFieldIdx] || currSchema.fields[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .os-schema-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Linux Operating System Kernel Monospace Struct & SYSCALL Register Frame Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Schema Switcher Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {OS_SCHEMAS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSchemaIdx(idx); setSelectedFieldIdx(0); }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedSchemaIdx === idx ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedSchemaIdx === idx ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedSchemaIdx === idx ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Main Monospace Inspector Grid */}
        <div className="os-schema-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              KERNEL STRUCT / REGISTER FRAME (MONOSPACE)
            </div>
            <pre style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, margin: 0, background: 'transparent' }}>
              {currSchema.spec}
            </pre>
          </div>

          <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
              STRUCT MEMBER INSPECTOR
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {currSchema.fields.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFieldIdx(idx)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: selectedFieldIdx === idx ? '#a78bfa' : 'rgba(255,255,255,0.06)',
                    color: selectedFieldIdx === idx ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              {currField.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Member Type: {currField.type}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {currField.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
