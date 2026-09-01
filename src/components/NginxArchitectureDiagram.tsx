import React, { useState } from 'react';

type NginxViewMode = 'c10k_epoll' | 'master_worker' | 'forward_reverse' | 'sendfile_dma';

export default function NginxArchitectureDiagram(): React.JSX.Element {
  const [viewMode, setViewMode] = useState<NginxViewMode>('c10k_epoll');
  const [reloadStep, setReloadStep] = useState<number>(1);
  const [proxyType, setProxyType] = useState<'reverse' | 'forward'>('reverse');
  const [connections, setConnections] = useState<number>(10000);

  // Math for C10K comparison
  const apacheMemoryMb = Math.round((connections * 2048) / 1024); // ~2MB per thread stack
  const nginxMemoryMb = Math.round((connections * 2.5) / 1024); // ~2.5KB per connection

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="4"/>
          <line x1="10" y1="2" x2="10" y2="22"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          NGINX Architecture & Event-Driven Engine Demystified
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'c10k_epoll', label: '⚡ C10K & epoll', color: '#34d399' },
            { id: 'master_worker', label: '🔄 Master-Worker', color: '#38bdf8' },
            { id: 'forward_reverse', label: '🛡️ Reverse vs Forward', color: '#fbbf24' },
            { id: 'sendfile_dma', label: '🚀 Zero-Copy sendfile', color: '#a78bfa' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as NginxViewMode)}
              style={{
                background: viewMode === tab.id ? `${tab.color}22` : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${viewMode === tab.id ? tab.color : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '6px',
                padding: '4px 10px',
                color: viewMode === tab.id ? tab.color : 'var(--ifm-color-content-secondary)',
                fontWeight: viewMode === tab.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* VIEW 1: C10K & EPOLL EVENT LOOP */}
        {viewMode === 'c10k_epoll' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)' }}>
                Simulate Concurrent Client Connections (C10K Problem):
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={connections}
                  onChange={e => setConnections(Number(e.target.value))}
                  style={{ cursor: 'pointer', width: '140px' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                  {connections.toLocaleString()} Clients
                </span>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 820 220" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="arrow-green" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#34d399" />
                  </marker>
                  <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
                    <path d="M 0 0 L 8 4 L 0 8 Z" fill="#f87171" />
                  </marker>
                </defs>

                {/* Left: Apache Model */}
                <g transform="translate(15, 15)">
                  <rect x="0" y="0" width="370" height="190" rx="8" fill="rgba(248, 113, 113, 0.05)" stroke="#f87171" strokeWidth="1" strokeDasharray="4 4" />
                  <text x="15" y="24" fill="#f87171" fontSize="12" fontWeight="700">
                    ❌ Traditional Thread-Per-Conn (Apache)
                  </text>
                  
                  {/* Threads exploding */}
                  <g transform="translate(15, 40)">
                    <rect x="0" y="0" width="100" height="30" rx="4" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" />
                    <text x="8" y="19" fill="#fca5a5" fontSize="10">Thread #1 (2MB)</text>

                    <rect x="0" y="38" width="100" height="30" rx="4" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" />
                    <text x="8" y="57" fill="#fca5a5" fontSize="10">Thread #2 (2MB)</text>

                    <rect x="0" y="76" width="100" height="30" rx="4" fill="rgba(248, 113, 113, 0.2)" stroke="#f87171" />
                    <text x="8" y="95" fill="#fca5a5" fontSize="10">Thread #N ...</text>

                    {/* Context switch storm */}
                    <path d="M 110 55 L 210 55" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />
                    <text x="115" y="45" fill="#f87171" fontSize="9" fontWeight="700">⚡ CPU Thrashing</text>

                    <rect x="220" y="15" width="115" height="95" rx="6" fill="rgba(248, 113, 113, 0.25)" stroke="#f87171" />
                    <text x="230" y="40" fill="#ffffff" fontSize="11" fontWeight="700">Kernel CPU</text>
                    <text x="230" y="60" fill="#fca5a5" fontSize="10">Context Switch</text>
                    <text x="230" y="80" fill="#fca5a5" fontSize="10">Stack: {apacheMemoryMb.toLocaleString()} MB</text>
                  </g>
                </g>

                {/* Right: Nginx Epoll Model */}
                <g transform="translate(415, 15)">
                  <rect x="0" y="0" width="390" height="190" rx="8" fill="rgba(52, 211, 153, 0.05)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="15" y="24" fill="#34d399" fontSize="12" fontWeight="700">
                    ✅ Nginx Event Loop + Linux epoll
                  </text>

                  <g transform="translate(15, 40)">
                    {/* Sockets */}
                    <rect x="0" y="10" width="90" height="100" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
                    <text x="10" y="32" fill="#38bdf8" fontSize="10" fontWeight="700">10K Sockets</text>
                    <text x="10" y="55" fill="#e0f2fe" fontSize="9">Non-blocking</text>
                    <text x="10" y="75" fill="#e0f2fe" fontSize="9">Zero wait</text>

                    {/* epoll pipe */}
                    <path d="M 95 60 L 140 60" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />

                    {/* Kernel epoll */}
                    <rect x="145" y="10" width="105" height="100" rx="6" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
                    <text x="155" y="32" fill="#fbbf24" fontSize="10" fontWeight="700">Linux epoll</text>
                    <text x="155" y="55" fill="#fef3c7" fontSize="9">OS notifies</text>
                    <text x="155" y="75" fill="#fef3c7" fontSize="9">Ready events</text>

                    {/* epoll to worker */}
                    <path d="M 255 60 L 285 60" fill="none" stroke="#34d399" strokeWidth="2" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />

                    {/* Single Worker */}
                    <rect x="290" y="10" width="80" height="100" rx="6" fill="rgba(52, 211, 153, 0.25)" stroke="#34d399" />
                    <text x="298" y="32" fill="#34d399" fontSize="10" fontWeight="700">1 Worker</text>
                    <text x="298" y="55" fill="#ffffff" fontSize="9">1 CPU Core</text>
                    <text x="298" y="75" fill="#6ee7b7" fontSize="9">RAM: ~{nginxMemoryMb} MB</text>
                  </g>
                </g>
              </svg>
            </div>

            {/* Metrics Comparison Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(248, 113, 113, 0.08)', border: '1px solid rgba(248, 113, 113, 0.25)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                  Apache: {connections.toLocaleString()} Threads
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  RAM: <strong>~{apacheMemoryMb.toLocaleString()} MB</strong> (Thread stacks). CPU spent on kernel context switching rather than serving HTTP traffic.
                </div>
              </div>

              <div style={{ padding: '12px 16px', background: 'rgba(52, 211, 153, 0.08)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '4px' }}>
                  NGINX: Single Event Loop Worker
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                  RAM: <strong>~{nginxMemoryMb} MB</strong> total (~2.5KB/connection). Zero CPU context switches; OS kernel <code>epoll</code> fires only when data arrives.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: MASTER-WORKER & ZERO-DOWNTIME RELOAD */}
        {viewMode === 'master_worker' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              {[
                { step: 1, label: '1. SIGHUP Signal', desc: 'Master validates nginx.conf and prepares new generation.', color: '#38bdf8' },
                { step: 2, label: '2. Fork New Workers', desc: 'New workers start accepting new connections on port 80/443.', color: '#34d399' },
                { step: 3, label: '3. Drain Old Workers', desc: 'Old workers complete existing requests and exit cleanly.', color: '#a78bfa' }
              ].map(s => (
                <button
                  key={s.step}
                  onClick={() => setReloadStep(s.step)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '6px',
                    border: `1px solid ${reloadStep === s.step ? s.color : 'rgba(255,255,255,0.1)'}`,
                    background: reloadStep === s.step ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                    color: reloadStep === s.step ? s.color : 'var(--ifm-color-content-secondary)',
                    fontWeight: reloadStep === s.step ? 700 : 500,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>
                {reloadStep === 1 && 'Step 1: Master Process Receives `nginx -s reload` (SIGHUP)'}
                {reloadStep === 2 && 'Step 2: Master Spawns Generation 2 Workers (Zero Port Binding Drop)'}
                {reloadStep === 3 && 'Step 3: Old Generation 1 Workers Gracefully Drain Active Connections'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.6, margin: 0 }}>
                {reloadStep === 1 && 'The master process runs as root to hold open listening ports (80/443). When `nginx -s reload` is issued, the master re-reads and validates the configuration files. If syntax fails, old workers continue unaffected.'}
                {reloadStep === 2 && 'The master forks new worker processes running the new config. The listening socket file descriptors are inherited directly, so new incoming connections are instantly handled by new workers without dropping a single packet.'}
                {reloadStep === 3 && 'The master sends SIGQUIT to the old workers. Old workers stop accepting new connections and finish processing all in-flight HTTP requests. Once all active connections reach 0, old workers exit.'}
              </p>
            </div>
          </div>
        )}

        {/* VIEW 3: FORWARD PROXY VS REVERSE PROXY */}
        {viewMode === 'forward_reverse' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <button
                onClick={() => setProxyType('reverse')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${proxyType === 'reverse' ? '#34d399' : 'rgba(255,255,255,0.1)'}`,
                  background: proxyType === 'reverse' ? '#34d39915' : 'rgba(255,255,255,0.02)',
                  color: proxyType === 'reverse' ? '#34d399' : 'var(--ifm-color-content-secondary)',
                  fontWeight: proxyType === 'reverse' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🛡️ NGINX as Reverse Proxy (Server Side)
              </button>
              <button
                onClick={() => setProxyType('forward')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: `1px solid ${proxyType === 'forward' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  background: proxyType === 'forward' ? '#38bdf815' : 'rgba(255,255,255,0.02)',
                  color: proxyType === 'forward' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
                  fontWeight: proxyType === 'forward' ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                🌐 Forward Proxy (Client Side)
              </button>
            </div>

            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', padding: '16px' }}>
              {proxyType === 'reverse' ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '8px' }}>
                    Reverse Proxy Topology: Clients only see Nginx. Backend servers are completely hidden in private VPC.
                  </div>
                  <pre style={{ margin: 0, background: '#090b14', padding: '12px', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px' }}>
                    <code>{`# Public Internet Clients ➔ [NGINX Reverse Proxy :443] ➔ [Private Upstream Servers :8080]
http {
    upstream backend_cluster {
        least_conn; # Load balance algorithm
        server 10.0.1.10:8080 max_fails=3 fail_timeout=10s;
        server 10.0.1.11:8080 max_fails=3 fail_timeout=10s;
        keepalive 32; # Connection pooling to upstream
    }

    server {
        listen 443 ssl http2;
        server_name api.example.com;

        location / {
            proxy_pass http://backend_cluster;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}`}</code>
                  </pre>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
                    Forward Proxy Topology: Sits in front of internal clients to hide client IPs and bypass geoblocks.
                  </div>
                  <pre style={{ margin: 0, background: '#090b14', padding: '12px', borderRadius: '6px', color: '#e2e8f0', fontSize: '12px' }}>
                    <code>{`# Internal Corporate Clients ➔ [NGINX Forward Proxy] ➔ Public Internet Web
server {
    listen 8888;
    resolver 8.8.8.8;

    location / {
        # Acts as forward gateway for outbound client HTTP traffic
        proxy_pass http://$http_host$request_uri;
        proxy_set_header Host $http_host;
    }
}`}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 4: ZERO-COPY SENDFILE DMA */}
        {viewMode === 'sendfile_dma' && (
          <div>
            <div style={{
              background: 'rgba(167, 139, 250, 0.08)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '14px'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', marginBottom: '4px' }}>
                Zero-Copy Static File Delivery (`sendfile on;`)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
                Traditional servers use <code>read()</code> and <code>write()</code> syscalls, copying files from disk to kernel page cache, then userspace buffer, then kernel socket buffer, and finally to the NIC (4 context switches + 2 CPU copies). NGINX's <code>sendfile on;</code> bypasses userspace entirely with Direct Memory Access (DMA).
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', background: 'rgba(248, 113, 113, 0.05)', border: '1px solid rgba(248, 113, 113, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#f87171', fontSize: '13px' }}>❌ Traditional read() / write()</strong>
                <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: '6px 0 0 0' }}>
                  Disk ➔ Page Cache ➔ <strong>Userspace RAM Buffer</strong> ➔ Socket Buffer ➔ NIC.<br/>
                  4 context switches + CPU pegged copying memory buffers.
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '6px' }}>
                <strong style={{ color: '#34d399', fontSize: '13px' }}>✅ NGINX sendfile + tcp_nopush</strong>
                <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: '6px 0 0 0' }}>
                  Disk ➔ OS Page Cache ➔ <strong>DMA Direct to NIC</strong>.<br/>
                  Zero userspace copies, zero CPU thrashing, full wire throughput.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
