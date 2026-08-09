import React, { useState } from 'react';

export default function SocketLifecycleDiagram(): React.JSX.Element {
  const [step, setStep] = useState<number>(1);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          POSIX Socket Lifecycle State Machine (`bind` ➔ `listen` ➔ `accept`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          {[1, 2, 3, 4].map(s => (
            <button
              key={s}
              onClick={() => setStep(s)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '6px',
                border: step === s ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: step === s ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              Step {s}: {s === 1 ? 'socket()' : s === 2 ? 'bind()' : s === 3 ? 'listen()' : 'accept()'}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {step === 1 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 1: <code>socket(AF_INET, SOCK_STREAM, 0)</code> creates an unbound socket file descriptor in kernel RAM.</p>}
          {step === 2 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 2: <code>bind(sockfd, &amp;addr, sizeof(addr))</code> binds socket to a specific local IP address and Port number (e.g. 0.0.0.0:8080).</p>}
          {step === 3 && <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--ifm-color-content)' }}>Step 3: <code>listen(sockfd, backlog)</code> marks socket as passive server socket, initializing SYN backlog queue and Accept queue.</p>}
          {step === 4 && <p style={{ margin: 0, fontSize: '12.5px', color: '#34d399', fontWeight: 700 }}>Step 4: <code>accept(sockfd, ...)</code> extracts first completed connection from Accept queue, returning a BRAND NEW client socket descriptor for read/write I/O!</p>}
        </div>
      </div>
    </div>
  );
}
