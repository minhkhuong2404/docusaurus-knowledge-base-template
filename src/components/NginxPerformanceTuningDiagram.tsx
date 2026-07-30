import React, { useState } from 'react';

export default function NginxPerformanceTuningDiagram() {
  const [selectedCategory, setSelectedCategory] = useState<'workers' | 'buffers' | 'kernel'>('workers');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>Nginx Performance Tuning & Directive Reference</span>

        {/* Category selector */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button onClick={() => setSelectedCategory('workers')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: selectedCategory === 'workers' ? '#38bdf818' : 'rgba(255,255,255,0.04)',
            color: selectedCategory === 'workers' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedCategory === 'workers' ? '0 0 0 1.5px #38bdf850' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Workers & FDs
          </button>

          <button onClick={() => setSelectedCategory('buffers')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: selectedCategory === 'buffers' ? '#34d39918' : 'rgba(255,255,255,0.04)',
            color: selectedCategory === 'buffers' ? '#34d399' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedCategory === 'buffers' ? '0 0 0 1.5px #34d39950' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Buffers & TCP
          </button>

          <button onClick={() => setSelectedCategory('kernel')} style={{
            padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '11.5px',
            background: selectedCategory === 'kernel' ? '#a78bfa18' : 'rgba(255,255,255,0.04)',
            color: selectedCategory === 'kernel' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
            boxShadow: selectedCategory === 'kernel' ? '0 0 0 1.5px #a78bfa50' : '0 0 0 1px rgba(255,255,255,0.08)'
          }}>
            Kernel (sysctl.conf)
          </button>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{
        borderColor: selectedCategory === 'workers' ? '#38bdf840' : selectedCategory === 'buffers' ? '#34d39940' : '#a78bfa40'
      }}>
        <h3 style={{
          color: selectedCategory === 'workers' ? '#38bdf8' : selectedCategory === 'buffers' ? '#34d399' : '#a78bfa',
          margin: '0 0 6px 0', fontSize: '14px'
        }}>
          {selectedCategory === 'workers' && 'Worker Processes & File Descriptor Sizing'}
          {selectedCategory === 'buffers' && 'TCP & Buffer Optimizations (sendfile, tcp_nopush, tcp_nodelay)'}
          {selectedCategory === 'kernel' && 'Kernel System Parameters (net.core.somaxconn, tcp_tw_reuse)'}
        </h3>

        <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: 0 }}>
          {selectedCategory === 'workers' && (
            <>
              Set <code>worker_processes auto</code> to match available CPU cores and pin cores with <code>worker_cpu_affinity auto</code>.<br/>
              Ensure <code>worker_rlimit_nofile &gt;= worker_connections × 4</code> to prevent socket file descriptor exhaustion under high concurrency.
            </>
          )}
          {selectedCategory === 'buffers' && (
            <>
              Enable <code>sendfile on</code> for zero-copy file transfer from kernel page cache straight to socket buffer.<br/>
              Use <code>tcp_nopush on</code> with sendfile to batch headers and file data into full TCP packets, combined with <code>tcp_nodelay on</code> to disable Nagle’s algorithm on keepalives.
            </>
          )}
          {selectedCategory === 'kernel' && (
            <>
              Increase <code>net.core.somaxconn = 65535</code> for TCP accept queues under heavy bursts.<br/>
              Enable <code>net.ipv4.tcp_tw_reuse = 1</code> to safely reuse TIME_WAIT sockets for outgoing proxy connections to backends.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
