import React, { useState } from 'react';

export default function OsInodeSyscallFrameDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'inode' | 'syscall' | 'blocks'>('inode');
  const [selectedSyscall, setSelectedSyscall] = useState<'write' | 'read' | 'mmap' | 'epoll'>('write');
  const [selectedInodeField, setSelectedInodeField] = useState<number>(0);

  const inodeFields = [
    { name: 'i_mode', bytes: '2 Bytes (uint16)', desc: 'File type (regular, directory, symlink, socket, FIFO) and POSIX permissions (e.g. 0755, 0644).', role: 'Permissions & Type', color: '#38bdf8' },
    { name: 'i_uid & i_gid', bytes: '4 + 4 Bytes', desc: 'Owner User ID and Group ID used by Linux DAC (Discretionary Access Control).', role: 'Ownership', color: '#38bdf8' },
    { name: 'i_ino', bytes: '8 Bytes (uint64)', desc: 'Unique filesystem serial number identifying the file entry inside the superblock.', role: 'Unique File ID', color: '#fbbf24' },
    { name: 'i_size', bytes: '8 Bytes (loff_t)', desc: 'Exact logical file size in bytes. Distinct from disk block allocation.', role: 'File Size', color: '#34d399' },
    { name: 'i_atime / mtime / ctime', bytes: '16 + 16 + 16 Bytes', desc: 'Access time, Modification time (data), and Change time (inode metadata).', role: 'Temporal Lifecycle', color: '#2dd4bf' },
    { name: 'i_nlink', bytes: '4 Bytes (nlink_t)', desc: 'Reference count of hard links pointing to this inode. When i_nlink == 0 and open fd == 0, file is deleted.', role: 'Hard Link Counter', color: '#f87171' },
    { name: 'i_blocks', bytes: '8 Bytes (blkcnt_t)', desc: 'Total number of 512-byte disk sectors allocated. Sparse files have i_blocks << i_size / 512.', role: 'Physical Disk Allocation', color: '#a78bfa' },
    { name: 'i_flags', bytes: '4 Bytes (uint32)', desc: 'Filesystem flags such as immutable (chattr +i), append-only (+a), and synchronous updates.', role: 'Kernel Behavioral Flags', color: '#f472b6' }
  ];

  const syscallPresets = {
    write: {
      name: 'sys_write (Syscall #1)',
      desc: 'Writes data from a user-space memory buffer to an open file descriptor.',
      rax: '1 (sys_write)',
      rdi: '1 (stdout / file descriptor fd)',
      rsi: '0x7ffd9b8f2000 (char *buf memory pointer)',
      rdx: '1024 (count: 1024 bytes to write)',
      r10: '0 (unused)',
      r8: '0 (unused)',
      r9: '0 (unused)',
      returns: 'Number of bytes written or -1 (errno)'
    },
    read: {
      name: 'sys_read (Syscall #0)',
      desc: 'Reads data from an open file descriptor into a user-space memory buffer.',
      rax: '0 (sys_read)',
      rdi: '3 (socket fd / file fd)',
      rsi: '0x7ffd9b8f3000 (char *buf memory pointer)',
      rdx: '4096 (count: max bytes to read)',
      r10: '0 (unused)',
      r8: '0 (unused)',
      r9: '0 (unused)',
      returns: 'Number of bytes read, 0 (EOF), or -1'
    },
    mmap: {
      name: 'sys_mmap (Syscall #9)',
      desc: 'Maps files or anonymous memory into the process virtual address space.',
      rax: '9 (sys_mmap)',
      rdi: '0 (NULL / OS chooses address)',
      rsi: '65536 (length: 64 KB)',
      rdx: '0x3 (PROT_READ | PROT_WRITE)',
      r10: '0x22 (MAP_PRIVATE | MAP_ANONYMOUS)',
      r8: '-1 (fd: no file for anonymous)',
      r9: '0 (offset: 0)',
      returns: 'Virtual memory pointer (0x7f...)'
    },
    epoll: {
      name: 'sys_epoll_wait (Syscall #232)',
      desc: 'Waits for I/O events on an epoll file descriptor without busy polling.',
      rax: '232 (sys_epoll_wait)',
      rdi: '5 (epoll_fd)',
      rsi: '0x7ffd9b8f4000 (struct epoll_event *events)',
      rdx: '64 (maxevents)',
      r10: '1000 (timeout: 1000ms)',
      r8: '0 (unused)',
      r9: '0 (unused)',
      returns: 'Number of ready file descriptors'
    }
  };

  const currField = inodeFields[selectedInodeField];
  const currSyscall = syscallPresets[selectedSyscall];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
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
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Linux Inode Memory Layout &amp; SYSCALL Register Execution Frame
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('inode')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'inode' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'inode' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'inode' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            128-Byte Inode Struct
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'blocks' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'blocks' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'blocks' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Direct / Indirect Block Tree
          </button>
          <button
            onClick={() => setActiveTab('syscall')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'syscall' ? '1px solid #a78bfa50' : '1px solid transparent',
              background: activeTab === 'syscall' ? '#a78bfa18' : 'transparent',
              color: activeTab === 'syscall' ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
            }}
          >
            x86_64 SYSCALL Frame
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: Inode Struct */}
        {activeTab === 'inode' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left: Inode Struct Field Selector */}
              <div style={{
                background: '#090b14',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
                  Click an Inode field to inspect its memory size and OS role:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                  {inodeFields.map((field, idx) => (
                    <button
                      key={field.name}
                      onClick={() => setSelectedInodeField(idx)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: selectedInodeField === idx ? `1px solid ${field.color}` : '1px solid rgba(255,255,255,0.06)',
                        background: selectedInodeField === idx ? `${field.color}20` : '#0d1117',
                        color: selectedInodeField === idx ? field.color : 'var(--ifm-color-content)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{field.name}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{field.bytes}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Inode Inspection Details */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: `1px solid ${currField.color}40`,
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: currField.color }}>
                    {currField.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${currField.color}18`,
                    color: currField.color,
                    border: `1px solid ${currField.color}40`
                  }}>
                    {currField.role}
                  </span>
                </div>

                <div style={{ background: '#090b14', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Struct Size &amp; Type</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{currField.bytes}</div>
                </div>

                <div style={{
                  background: '#090b14',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '11.5px',
                  lineHeight: 1.5,
                  color: 'var(--ifm-color-content)'
                }}>
                  {currField.desc}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Direct / Indirect Blocks */}
        {activeTab === 'blocks' && (
          <div style={{
            background: '#0c0e17',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '12px' }}>
              Ext4 Inode Data Block Pointer Hierarchy (Fast O(1) File Seeks)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              <div style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                <div style={{ color: '#34d399', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  12 Direct Pointers (0 – 48 KB)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Point directly to 4KB data blocks on disk. Over 80% of UNIX files fit entirely in direct blocks, requiring zero pointer indirection.
                </div>
              </div>

              <div style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  1 Single Indirect (Up to 4 MB)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Points to a 4KB block containing 1,024 block pointers (4B each), enabling fast linear expansion.
                </div>
              </div>

              <div style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  1 Double Indirect (Up to 4 GB)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  Points to 1,024 single-indirect blocks (1M data blocks = 4GB).
                </div>
              </div>

              <div style={{ background: '#090b14', padding: '12px', borderRadius: '6px', borderLeft: '3px solid #a78bfa' }}>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>
                  1 Triple Indirect (Up to 4 TB)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  3 levels of pointer tree for multi-terabyte files before Ext4 extents migration.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: SYSCALL Register Frame */}
        {activeTab === 'syscall' && (
          <div>
            {/* Syscall Selector Buttons */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {(['write', 'read', 'mmap', 'epoll'] as const).map((scKey) => (
                <button
                  key={scKey}
                  onClick={() => setSelectedSyscall(scKey)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedSyscall === scKey ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.08)',
                    background: selectedSyscall === scKey ? '#a78bfa18' : '#090b14',
                    color: selectedSyscall === scKey ? '#a78bfa' : 'var(--ifm-color-content-secondary)'
                  }}
                >
                  {syscallPresets[scKey].name}
                </button>
              ))}
            </div>

            <div style={{
              background: '#0c0e17',
              borderRadius: '10px',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#a78bfa', fontWeight: 700, fontSize: '13px' }}>
                  {currSyscall.name} (Ring 3 User Mode &rarr; Ring 0 Kernel Mode)
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '12px' }}>
                {currSyscall.desc}
              </p>

              {/* Register Table Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #f87171' }}>
                  <span style={{ color: '#f87171', fontWeight: 700 }}>rax (Syscall Index):</span> {currSyscall.rax}
                </div>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>rdi (Argument 1):</span> {currSyscall.rdi}
                </div>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>rsi (Argument 2):</span> {currSyscall.rsi}
                </div>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                  <span style={{ color: '#fbbf24', fontWeight: 700 }}>rdx (Argument 3):</span> {currSyscall.rdx}
                </div>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #a78bfa' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>r10 (Argument 4):</span> {currSyscall.r10}
                </div>
                <div style={{ background: '#090b14', padding: '8px 10px', borderRadius: '6px', borderLeft: '3px solid #2dd4bf' }}>
                  <span style={{ color: '#2dd4bf', fontWeight: 700 }}>Return (rax):</span> {currSyscall.returns}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
