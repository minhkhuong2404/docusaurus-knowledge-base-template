import React, { useState } from 'react';

const NODES = [
  { id: 'hw', label: 'Hardware', subtitle: 'CPU · RAM · Disk · NIC', x: 340, y: 295, w: 280, h: 45, color: '#f97316',
    detail: { title: 'Hardware Layer', body: 'Physical resources managed by the OS. The CPU executes machine instructions. The MMU translates virtual to physical addresses. Interrupt controllers (APIC) route hardware interrupts (timer, NIC, disk) to the kernel interrupt handlers. The OS never directly programs hardware from user space.', tags: ['CPU ISA (x86_64, ARM64)', 'MMU virtual→physical', 'APIC interrupt controller', 'DMA for I/O transfers'] } },
  { id: 'kernel', label: 'Kernel Space', subtitle: 'Ring 0 — full hardware access', x: 235, y: 185, w: 490, h: 90, color: '#a78bfa',
    detail: { title: 'Kernel Space (Ring 0)', body: 'The kernel runs with unrestricted CPU privilege (Ring 0). It is the only code that can directly execute privileged instructions and access hardware I/O ports. The monolithic Linux kernel contains all subsystem code in a single address space for performance (no IPC overhead between subsystems).', tags: ['Ring 0 privilege level', 'Kernel virtual address space', 'Linux kernel: monolithic', 'macOS/Windows: hybrid kernel'] } },
  { id: 'sched', label: 'CPU Scheduler (CFS)', subtitle: 'vruntime red-black tree', x: 250, y: 200, w: 130, h: 60, color: '#38bdf8',
    detail: { title: 'CPU Scheduler — Linux CFS', body: 'The Completely Fair Scheduler models ideal multi-tasking. Each task has a vruntime (virtual runtime). The task with lowest vruntime is selected. Tasks are stored in a red-black tree keyed by vruntime for O(log n) selection. Time slice = (scheduling period) × (weight / total weight). Nice values adjust weight.', tags: ['O(log n) task selection', 'vruntime red-black tree', 'sched_latency_ns = 6ms', 'CFS + RT + Deadline classes'] } },
  { id: 'mm', label: 'Memory Manager', subtitle: 'Virtual memory + paging', x: 395, y: 200, w: 130, h: 60, color: '#34d399',
    detail: { title: 'Memory Management Subsystem', body: 'Manages virtual address spaces, page tables, and physical frame allocation. On page fault: checks VMA, allocates physical frame, updates PTE. OOM killer kills processes when RAM exhausted. Uses buddy allocator for page-granularity and slab allocator for kernel objects.', tags: ['Buddy allocator (pages)', 'Slab allocator (objects)', 'OOM killer', 'vm.swappiness controls swap'] } },
  { id: 'vfs', label: 'VFS Layer', subtitle: 'inode · dentry · page cache', x: 540, y: 200, w: 130, h: 60, color: '#fbbf24',
    detail: { title: 'Virtual File System (VFS)', body: 'Abstraction layer that presents a uniform interface (open/read/write/close) over different filesystem implementations (ext4, xfs, tmpfs, NFS). Key structures: superblock (fs metadata), inode (file metadata), dentry (directory entry cache), file (open file descriptor). Page cache buffers disk reads in RAM.', tags: ['inode: metadata (not name)', 'dentry cache: path → inode', 'Page cache: disk → RAM', 'ext4, xfs, btrfs, tmpfs'] } },
  { id: 'ipc', label: 'IPC & Signals', subtitle: 'Pipes · Sockets · Shmem', x: 250, y: 265, w: 130, h: 50, color: '#f472b6',
    detail: { title: 'IPC & Signals Subsystem', body: 'Inter-Process Communication mechanisms: Anonymous pipes (unidirectional, parent↔child only), Named pipes (FIFO, any processes), Unix Domain Sockets (bidirectional, same host), Shared memory (shmget — fastest IPC, zero-copy), Message queues (POSIX mq_open). Signals are async notifications (SIGKILL, SIGTERM, SIGSEGV).', tags: ['pipe() → fd[0] read, fd[1] write', 'shmget() + shmat()', 'SIGTERM: graceful shutdown', 'SIGSEGV: segfault'] } },
  { id: 'syscall', label: 'System Call Interface', subtitle: 'SYSCALL / INT 0x80', x: 235, y: 145, w: 490, h: 32, color: '#38bdf8',
    detail: { title: 'System Call Interface', body: 'The controlled gate between user space and kernel. On x86_64 Linux: SYSCALL instruction saves registers, switches to kernel stack, looks up syscall number in sys_call_table[], executes handler, SYSRET back to user. Context switch costs: 200–1000ns (register save/restore, TLB flush on address space change).', tags: ['~400 syscalls on Linux x86_64', 'SYSCALL saves RIP, RSP, RFLAGS', 'vDSO: gettimeofday() no mode switch', 'strace to trace syscalls'] } },
  { id: 'userspace', label: 'User Space', subtitle: 'Ring 3 — restricted access · libc · JVM · app code', x: 235, y: 65, w: 490, h: 65, color: '#a78bfa',
    detail: { title: 'User Space (Ring 3)', body: 'All application code (JVM, Python, nginx) runs in Ring 3 with restricted CPU instructions. Cannot directly access hardware or kernel memory. Any privileged operation requires a system call. The C library (glibc) wraps syscalls. The JVM uses JNI for native calls. Virtual threads (Java 21) use continuation-based parking instead of OS thread blocking.', tags: ['Ring 3 privilege', 'glibc: syscall wrapper', 'JVM: JNI for native', 'Virtual threads (Loom)'] } },
];

export default function OsOverviewDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);
  const selNode = NODES.find(n => n.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-overview-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Operating System Kernel Architecture</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Click any subsystem</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="os-overview-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 960 365" style={{ width: '100%', height: 'auto' }}>
              {/* Layer labels */}
              <text x="70" y="98" fill="rgba(167,139,250,0.5)" fontSize="9" fontWeight="600">USER SPACE (Ring 3)</text>
              <text x="70" y="175" fill="rgba(56,189,248,0.5)" fontSize="9" fontWeight="600">SYSTEM CALL INTERFACE</text>
              <text x="70" y="228" fill="rgba(167,139,250,0.5)" fontSize="9" fontWeight="600">KERNEL SPACE (Ring 0)</text>
              <text x="70" y="310" fill="rgba(249,115,22,0.5)" fontSize="9" fontWeight="600">HARDWARE</text>

              {/* Dividing lines */}
              <line x1="230" y1="138" x2="730" y2="138" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="230" y1="182" x2="730" y2="182" stroke="rgba(167,139,250,0.2)" strokeWidth="1" strokeDasharray="4 3" />
              <line x1="230" y1="290" x2="730" y2="290" stroke="rgba(249,115,22,0.2)" strokeWidth="1" strokeDasharray="4 3" />

              {/* Arrows syscall up/down */}
              <line x1="480" y1="138" x2="480" y2="145" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
              <line x1="480" y1="182" x2="480" y2="195" stroke="#38bdf8" strokeWidth="1.5" opacity="0.4" />
              <line x1="480" y1="275" x2="480" y2="290" stroke="#f97316" strokeWidth="1.5" opacity="0.4" />

              {/* Nodes */}
              {NODES.map(node => {
                const isActive = selected === node.id;
                return (
                  <g key={node.id} onClick={() => setSelected(selected === node.id ? null : node.id)} style={{ cursor: 'pointer' }}>
                    <rect x={node.x} y={node.y} width={node.w} height={node.h} rx="8"
                      fill={isActive ? `${node.color}22` : `${node.color}0d`}
                      stroke={node.color} strokeWidth={isActive ? 2 : 1.5}
                      opacity={selected && !isActive ? 0.25 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    <text x={node.x + node.w / 2} y={node.y + (node.h > 50 ? 22 : 20)} textAnchor="middle" fill={node.color} fontSize="11" fontWeight="700" opacity={selected && !isActive ? 0.3 : 1}>{node.label}</text>
                    <text x={node.x + node.w / 2} y={node.y + node.h - 8} textAnchor="middle" fill={node.color} fontSize="8.5" opacity={selected && !isActive ? 0.2 : 0.6}>{node.subtitle}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className={`interactive-diagram-details-card ${selNode ? 'details-purple' : 'details-gray'}`}
            style={{ minHeight: '220px', display: 'flex', flexDirection: 'column', justifyContent: selNode ? 'flex-start' : 'center', transition: 'all 0.25s ease' }}>
            {selNode ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: selNode.color, marginBottom: '10px' }}>{selNode.detail.title}</div>
                <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>{selNode.detail.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selNode.detail.tags.map(t => (
                    <code key={t} style={{ fontSize: '10.5px', background: `${selNode.color}18`, color: selNode.color, border: `1px solid ${selNode.color}40`, borderRadius: '5px', padding: '2px 7px' }}>{t}</code>
                  ))}
                </div>
              </div>
            ) : (
              <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                </svg>
                <div>Click any layer or subsystem to inspect internals</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}