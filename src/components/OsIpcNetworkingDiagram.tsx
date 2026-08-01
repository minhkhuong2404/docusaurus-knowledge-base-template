import React, { useState } from 'react';

const IPC_MECHANISMS = [
  {
    id: 'pipe', label: 'Pipes (Anonymous)', color: '#38bdf8',
    badge: 'Parent ↔ Child only · Unidirectional',
    desc: 'Simplest IPC. A pipe creates two file descriptors: read-end (fd[0]) and write-end (fd[1]). Anonymous pipes only work between related processes (parent/child via fork). Shell commands connected by | use anonymous pipes.',
    api: ['int fd[2]; pipe(fd);', 'fork() → child inherits fd[]', 'parent: write(fd[1], data, n)', 'child: read(fd[0], buf, n)', 'close unused ends to avoid hang'],
    props: [
      { k: 'Direction', v: 'Unidirectional' }, { k: 'Related processes?', v: 'Yes (parent/child only)' },
      { k: 'Capacity', v: '64KB kernel buffer (Linux)' }, { k: 'Blocking', v: 'Yes (blocks when full/empty)' },
    ],
  },
  {
    id: 'shm', label: 'Shared Memory', color: '#34d399',
    badge: 'Fastest IPC · Zero-copy · Any process',
    desc: 'Fastest IPC mechanism — processes share the same physical memory pages mapped into their respective virtual address spaces. No data copying. Requires explicit synchronization (semaphores/mutexes) to avoid race conditions.',
    api: ['key_t key = ftok("/tmp/shm", 1);', 'int shmid = shmget(key, SIZE, IPC_CREAT|0666);', 'void* ptr = shmat(shmid, NULL, 0);', '// use ptr as shared buffer', 'shmdt(ptr); shmctl(shmid, IPC_RMID, NULL);'],
    props: [
      { k: 'Direction', v: 'Bidirectional' }, { k: 'Speed', v: 'Fastest (RAM speed)' },
      { k: 'Synchronization', v: 'Manual (semaphores)' }, { k: 'Java', v: 'MappedByteBuffer (mmap)' },
    ],
  },
  {
    id: 'uds', label: 'Unix Domain Sockets', color: '#a78bfa',
    badge: 'Bidirectional · Stream or Datagram · Any process',
    desc: 'Unix Domain Sockets (AF_UNIX) provide full-duplex, stream-oriented IPC between any processes on the same host. Unlike TCP sockets, no network stack overhead — data stays in kernel. Nginx, Docker, and PostgreSQL use UDS for control communication.',
    api: ['socket(AF_UNIX, SOCK_STREAM, 0)', 'bind(fd, struct sockaddr_un {"/tmp/myapp.sock"})', 'listen(fd, BACKLOG)', 'accept(fd, NULL, NULL)', 'read()/write() as normal fds'],
    props: [
      { k: 'Direction', v: 'Bidirectional' }, { k: 'Performance', v: '2× faster than TCP loopback' },
      { k: 'File path', v: '/tmp/app.sock (filesystem namespace)' }, { k: 'Java', v: 'UnixDomainSocketAddress (JDK 16+)' },
    ],
  },
  {
    id: 'signals', label: 'Signals', color: '#fbbf24',
    badge: 'Async notifications · Process lifecycle',
    desc: 'Signals are lightweight asynchronous notifications sent to a process. The kernel delivers them by setting a bit in the process\'s signal_pending mask. Signal handler runs on the next context switch back to user space (or asynchronously via direct kernel injection).',
    api: ['signal(SIGTERM, handler)', 'kill(pid, SIGTERM)', 'kill(pid, SIGUSR1) // custom', 'sigaction(SIGINT, &sa, NULL)', '// Java: Runtime.addShutdownHook()'],
    props: [
      { k: 'SIGTERM (15)', v: 'Graceful shutdown request' }, { k: 'SIGKILL (9)', v: 'Force kill (not catchable)' },
      { k: 'SIGSEGV (11)', v: 'Segmentation fault' }, { k: 'SIGUSR1/2', v: 'User-defined (JVM GC trigger)' },
    ],
  },
  {
    id: 'msgqueue', label: 'Message Queues', color: '#f97316',
    badge: 'Structured messages · Priority ordering',
    desc: 'POSIX message queues (mq_open) allow processes to exchange typed, prioritized messages via a kernel-maintained queue. Unlike pipes, messages have explicit type and priority fields. Sender/receiver can be unrelated processes with no shared ancestor.',
    api: ['mqd_t mq = mq_open("/my-queue", O_RDWR|O_CREAT, 0644, &attrs);', 'mq_send(mq, msg, sizeof(msg), priority);', 'mq_receive(mq, buf, sizeof(buf), &prio);', 'mq_close(mq); mq_unlink("/my-queue");'],
    props: [
      { k: 'Message ordering', v: 'Priority + FIFO within priority' }, { k: 'Persistence', v: 'Survives process exit (until unlinked)' },
      { k: 'Max messages', v: '/proc/sys/fs/mqueue/msg_max (10 default)' }, { k: 'Java', v: 'Not natively wrapped (use JNI or sockets)' },
    ],
  },
];

export default function OsIpcNetworkingDiagram(): React.JSX.Element {
  const [active, setActive] = useState<string>('pipe');
  const mech = IPC_MECHANISMS.find(m => m.id === active)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .os-ipc-grid { grid-template-columns: 1fr !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 3 21 8 8 21"/><line x1="3" y1="3" x2="21" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>IPC &amp; Networking Mechanisms</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* IPC selector */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {IPC_MECHANISMS.map(m => (
            <button key={m.id} onClick={() => setActive(m.id)}
              style={{ flex: 1, padding: '8px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11px', background: active === m.id ? `${m.color}18` : 'rgba(255,255,255,0.04)', color: active === m.id ? m.color : 'var(--ifm-color-content-secondary)', boxShadow: active === m.id ? `0 0 0 1.5px ${m.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: '11px', background: `${mech.color}15`, border: `1px solid ${mech.color}40`, borderRadius: '6px', padding: '4px 10px', marginBottom: '12px', color: mech.color, display: 'inline-block', fontWeight: 600 }}>
          {mech.badge}
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{mech.desc}</p>

        <div className="os-ipc-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          {/* API */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>API Example</div>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '12px 14px', fontFamily: 'monospace' }}>
              {mech.api.map((line, i) => (
                <div key={i} style={{ fontSize: '11px', color: line.startsWith('//') ? '#6b7280' : mech.color, marginBottom: '3px', lineHeight: 1.5 }}>{line}</div>
              ))}
            </div>
          </div>

          {/* Properties */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Properties</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {mech.props.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', background: `${mech.color}08`, border: `1px solid ${mech.color}20`, borderRadius: '7px', padding: '8px 10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: mech.color, minWidth: '120px', flexShrink: 0 }}>{p.k}:</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>{p.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}