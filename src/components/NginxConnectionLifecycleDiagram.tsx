import React, { useState } from 'react';

export default function NginxConnectionLifecycleDiagram() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [pathType, setPathType] = useState<'static' | 'disk' | 'proxy'>('static');

  const steps = [
    { step: 1, title: 'Step 1: TCP Handshake', desc: 'OS Kernel performs SYN → SYN-ACK → ACK handshake. Nginx master/worker process does not touch packet yet.', color: '#38bdf8' },
    { step: 2, title: 'Step 2: Accept Queue & epoll', desc: 'Kernel places socket in accept queue. epoll notifies worker event loop: listen_fd is readable.', color: '#34d399' },
    { step: 3, title: 'Step 3: Non-Blocking FD Setup', desc: 'Worker calls accept() → gets client fd=47. Sets fd 47 to non-blocking and registers with epoll (EPOLLET).', color: '#a78bfa' },
    { step: 4, title: 'Step 4: Request Parsing', desc: 'Client sends HTTP request bytes. epoll fires EPOLLIN. Worker reads non-blocking until EAGAIN and parses headers.', color: '#fbbf24' },
    { step: 5, title: 'Step 5: Location Routing', desc: 'Worker matches request URI against location blocks in nginx.conf to choose handler execution path.', color: '#f87171' },
    { step: 6, title: 'Step 6: Handler Execution', desc: 'Executes chosen handler path: Zero-copy sendfile, Thread Pool Disk Read, or Upstream Proxying.', color: '#2dd4bf' },
    { step: 7, title: 'Step 7: Keepalive or Close', desc: 'If keepalive: fd 47 remains registered in epoll for next request. If close: close(fd 47) and free struct.', color: '#38bdf8' }
  ];

  const current = steps[activeStep - 1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>Nginx Complete Connection Lifecycle (7-Step Visualizer)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '45% 55%', gap: '14px', alignItems: 'start' }} className="lifecycle-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .lifecycle-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Step List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {steps.map(s => {
            const isSelected = activeStep === s.step;
            return (
              <button key={s.step} onClick={() => setActiveStep(s.step)} style={{
                padding: '7px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: isSelected ? `${s.color}15` : 'rgba(255,255,255,0.03)',
                boxShadow: isSelected ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.06)',
                transition: 'all 0.2s'
              }}>
                <strong style={{ fontSize: '11.5px', color: isSelected ? s.color : '#e2e8f0' }}>{s.title}</strong>
              </button>
            );
          })}
        </div>

        {/* Details Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${current.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: current.color, margin: 0, fontSize: '14px' }}>{current.title}</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '8px' }}>
            {current.desc}
          </p>

          {activeStep === 6 && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px' }}>
              <strong style={{ fontSize: '11px', color: '#94a3b8' }}>Select Execution Handler Path:</strong>
              <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                <button onClick={() => setPathType('static')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10.5px',
                  background: pathType === 'static' ? '#34d39920' : 'rgba(255,255,255,0.04)',
                  color: pathType === 'static' ? '#34d399' : '#94a3b8'
                }}>6a. Cached Static (sendfile)</button>
                <button onClick={() => setPathType('disk')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10.5px',
                  background: pathType === 'disk' ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
                  color: pathType === 'disk' ? '#fbbf24' : '#94a3b8'
                }}>6b. Disk Read (Thread Pool)</button>
                <button onClick={() => setPathType('proxy')} style={{
                  padding: '4px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10.5px',
                  background: pathType === 'proxy' ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
                  color: pathType === 'proxy' ? '#a78bfa' : '#94a3b8'
                }}>6c. Upstream Proxy</button>
              </div>

              <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '8px' }}>
                {pathType === 'static' && '6a: sendfile(fd 47, file_fd) copies page cache directly to socket buffer in kernel space (zero-copy).'}
                {pathType === 'disk' && '6b: Pushes disk read task to thread pool. Worker thread blocks on pread() and notifies event loop via eventfd.'}
                {pathType === 'proxy' && '6c: Worker opens non-blocking connection to backend upstream FD. Both FDs managed concurrently by event loop.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
