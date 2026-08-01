import React, { useState } from 'react';

const TABS = [
  {
    id: 'vfs', label: 'VFS Layer', color: '#fbbf24',
    overview: 'The Virtual File System (VFS) is a kernel abstraction layer that presents a uniform POSIX interface (open/read/write/close/stat) regardless of the underlying filesystem type (ext4, XFS, tmpfs, NFS, procfs, sysfs).',
    items: [
      { label: 'open("/etc/hosts", O_RDONLY)', detail: 'Triggers sys_open() syscall. Kernel looks up dentry cache (dcache) for path. On miss, traverses directory entries. Creates file descriptor (fd) in process fd table. Returns integer fd to caller.' },
      { label: 'Dentry Cache (dcache)', detail: 'In-memory cache of directory entry → inode mappings. Avoids repeated disk reads for path components. Keyed by (parent_inode, name). Nearly all path lookups resolve from dcache (> 95% hit rate).' },
      { label: 'Inode', detail: 'In-memory struct representing a file: permissions, uid/gid, size, timestamps (ctime/mtime/atime), block pointers. Does NOT contain the filename — that lives in the directory entry. Hard links share one inode.' },
      { label: 'Page Cache', detail: 'All file reads go through the page cache (a radix tree of physical page frames, keyed by inode + offset). On cache hit: data copied from page cache to userspace buffer. On miss: block I/O issued to disk, page filled, then copied.' },
      { label: 'Superblock', detail: 'Per-mounted filesystem metadata: magic number, block size, inode count, free blocks. Loaded into memory on mount(). Operations on it use filesystem-specific implementations registered via file_system_type.' },
    ],
  },
  {
    id: 'fd', label: 'File Descriptors', color: '#38bdf8',
    overview: 'File descriptors are per-process integers that reference open files, sockets, pipes, and devices. Every process inherits stdin(0), stdout(1), stderr(2). The kernel maintains three tables: per-process fd table → system-wide open file table → inode table.',
    items: [
      { label: 'fd 0 (stdin), 1 (stdout), 2 (stderr)', detail: 'Every process has these three by default. fork() inherits parent\'s fd table. Shell redirection (> file) just changes which file fd 1 points to before exec().' },
      { label: 'ulimit -n (open file limit)', detail: 'Default soft limit: 1024 fd per process. Hard limit: 65536. For high-concurrency servers (Netty, Kafka): increase via /etc/security/limits.conf or systemd LimitNOFILE=65536. Check: /proc/<pid>/fd.' },
      { label: 'dup2(oldfd, newfd)', detail: 'Duplicates oldfd to newfd. Used for shell redirects: dup2(file_fd, 1) makes stdout write to file. Both fds reference same open file table entry (same offset, same status flags).' },
      { label: 'Non-blocking I/O (O_NONBLOCK)', detail: 'fd marked O_NONBLOCK: read/write returns EAGAIN instead of blocking. Used with epoll/select/poll for event-driven I/O. Foundation of Java NIO (Selector, SelectionKey).' },
      { label: 'epoll (Linux event notification)', detail: 'epoll_create() + epoll_ctl(EPOLL_CTL_ADD) + epoll_wait(). O(1) per ready fd. Used by nginx, Netty, Node.js, Redis. Java NIO maps to epoll on Linux. Replaces select() (FD_SETSIZE=1024 limit) and poll().' },
    ],
  },
  {
    id: 'io', label: 'I/O Modes', color: '#34d399',
    overview: 'Linux supports multiple I/O access patterns: standard buffered I/O (page cache), direct I/O (bypass cache), and memory-mapped I/O. Each has specific use cases and performance tradeoffs.',
    items: [
      { label: 'Buffered I/O (default)', detail: 'All reads/writes go through the page cache. Kernel reads full pages (4KB) even for small reads. Writes are buffered (dirty pages) and flushed asynchronously by pdflush/kworker. Best for most workloads.' },
      { label: 'Direct I/O (O_DIRECT)', detail: 'Bypasses page cache entirely. Data transferred directly between userspace buffer and disk. Requires 512-byte aligned buffers and sizes. Used by databases (PostgreSQL, MySQL InnoDB) that manage their own buffer pool to avoid double-buffering.' },
      { label: 'mmap() — memory-mapped files', detail: 'Maps file contents into process virtual address space. Access via pointer — kernel handles paging automatically. Zero-copy for reads (no user/kernel buffer copy). Used by: Kafka log segments, JVM class loading, shared memory IPC.' },
      { label: 'sendfile() — zero-copy transfer', detail: 'Transfers data from file fd to socket fd without copying to userspace. Kernel: page cache → DMA to NIC buffer. Kafka, nginx, and Tomcat use sendfile for static file serving. ~2× throughput vs read()+write().' },
      { label: 'io_uring (Linux 5.1+)', detail: 'Async I/O using shared ring buffers between kernel and userspace. Near-zero syscall overhead — multiple operations batched in one submission. Lower CPU usage than epoll for very high IOPS workloads. Java 21 Loom investigates io_uring support.' },
    ],
  },
];

export default function OsFileSystemsIoDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('vfs');
  const [expanded, setExpanded] = useState<number | null>(null);
  const tab = TABS.find(t => t.id === activeTab)!;

  const handleTabChange = (id: string) => { setActiveTab(id); setExpanded(null); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>File Systems &amp; I/O Internals</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '7px', marginBottom: '14px' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{tab.overview}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tab.items.map((item, i) => {
            const isExp = expanded === i;
            return (
              <div key={i} onClick={() => setExpanded(isExp ? null : i)}
                style={{ background: isExp ? `${tab.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isExp ? tab.color + '40' : 'rgba(255,255,255,0.07)'}`, borderRadius: '8px', padding: '9px 12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '9.5px', fontWeight: 700, color: tab.color, background: `${tab.color}18`, borderRadius: '4px', padding: '2px 6px', flexShrink: 0, fontFamily: 'monospace' }}>{String(i + 1).padStart(2, '0')}</span>
                  <code style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ifm-color-content)', flex: 1 }}>{item.label}</code>
                  <span style={{ color: 'var(--ifm-color-content-secondary)', fontSize: '11px', flexShrink: 0 }}>{isExp ? '▲' : '▼'}</span>
                </div>
                {isExp && <p style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', margin: '8px 0 0 36px', lineHeight: 1.65 }}>{item.detail}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}