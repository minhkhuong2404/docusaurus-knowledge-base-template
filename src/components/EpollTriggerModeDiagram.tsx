import React, { useState } from 'react';

export default function EpollTriggerModeDiagram() {
  const [unreadBytes, setUnreadBytes] = useState<number>(500);

  const handlePartialRead = () => {
    setUnreadBytes(prev => Math.max(0, prev - 100));
  };

  const handleReset = () => {
    setUnreadBytes(500);
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Level-Triggered vs Edge-Triggered epoll Buffer Simulator</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }} className="epoll-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .epoll-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Controls & Buffer */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#38bdf840' }}>
          <h4 style={{ color: '#38bdf8', margin: '0 0 6px 0', fontSize: '13px' }}>Kernel Socket Buffer</h4>
          <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: 0 }}>
            Remaining Unread Bytes: <strong style={{ color: unreadBytes > 0 ? '#34d399' : '#94a3b8' }}>{unreadBytes} bytes</strong>
          </p>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={handlePartialRead} disabled={unreadBytes === 0} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#38bdf8',
              color: '#090b14', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', opacity: unreadBytes === 0 ? 0.5 : 1
            }}>
              Partial read(100 B)
            </button>
            <button onClick={handleReset} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#e2e8f0', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>
              Reset (500 B)
            </button>
          </div>
        </div>

        {/* Triggers */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
          <h4 style={{ color: '#34d399', margin: '0 0 6px 0', fontSize: '13px' }}>epoll Notification State</h4>

          <div style={{ fontSize: '11.5px', marginTop: '6px' }}>
            <strong style={{ color: '#38bdf8' }}>Level-Triggered:</strong>
            <span style={{ marginLeft: '6px', color: unreadBytes > 0 ? '#34d399' : '#f87171' }}>
              {unreadBytes > 0 ? '⚡ epoll_wait fires again (Buffer non-empty)' : '💤 Idle (Buffer empty)'}
            </span>
          </div>

          <div style={{ fontSize: '11.5px', marginTop: '8px' }}>
            <strong style={{ color: '#34d399' }}>Edge-Triggered (EPOLLET — Nginx):</strong>
            <span style={{ marginLeft: '6px', color: '#94a3b8' }}>
              {unreadBytes === 500 ? '⚡ Fired ONCE on new arrival' : '💤 Does NOT re-fire! Must read until EAGAIN.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
