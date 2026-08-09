import React, { useState } from 'react';

export default function TcpStateTransitionDiagram(): React.JSX.Element {
  const [state, setState] = useState<'CLOSED' | 'LISTEN' | 'SYN_SENT' | 'SYN_RCVD' | 'ESTABLISHED' | 'FIN_WAIT_1' | 'TIME_WAIT'>('ESTABLISHED');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          TCP Finite State Machine (FSM) Lifecycle Transition Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {(['CLOSED', 'LISTEN', 'SYN_SENT', 'SYN_RCVD', 'ESTABLISHED', 'FIN_WAIT_1', 'TIME_WAIT'] as const).map(s => (
            <button
              key={s}
              onClick={() => setState(s)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: state === s ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: state === s ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17',
                color: '#fff',
                fontSize: '11px',
                fontWeight: state === s ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
            Current TCP Socket State:
          </div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
            {state}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
            {state === 'CLOSED' && 'Socket is not in use. Default initial state.'}
            {state === 'LISTEN' && 'Server socket is waiting for incoming client connection requests.'}
            {state === 'SYN_SENT' && 'Client sent SYN packet, waiting for server SYN-ACK.'}
            {state === 'SYN_RCVD' && 'Server received SYN, sent SYN-ACK, waiting for client ACK.'}
            {state === 'ESTABLISHED' && 'Full-duplex connection active! Data transfer in progress.'}
            {state === 'FIN_WAIT_1' && 'Application initiated connection teardown by sending FIN.'}
            {state === 'TIME_WAIT' && 'Active closer waits 2 * MSL (60s) to catch delayed duplicate packets.'}
          </div>
        </div>
      </div>
    </div>
  );
}
