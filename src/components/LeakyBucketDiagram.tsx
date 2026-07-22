import React, { useState } from 'react';

export default function LeakyBucketDiagram() {
  const maxQueue = 5;
  const [queueCount, setQueueCount] = useState<number>(0);
  const [log, setLog] = useState<string>('Leaky Bucket initialized. Queue size: 0/5.');

  const handleEnqueue = () => {
    if (queueCount < maxQueue) {
      setQueueCount(prev => prev + 1);
      setLog('📥 Request enqueued in FIFO buffer.');
    } else {
      setLog('🚨 Queue FULL! Request dropped instantly (HTTP 429).');
    }
  };

  const handleEnqueueMultiple = () => {
    setQueueCount(prev => {
      const next = Math.min(maxQueue, prev + 3);
      if (prev + 3 > maxQueue) {
        setLog(`⚠️ Enqueued requests. ${prev + 3 - maxQueue} request(s) dropped due to buffer overflow!`);
      } else {
        setLog('📥 3 requests enqueued into FIFO buffer.');
      }
      return next;
    });
  };

  const handleLeak = () => {
    if (queueCount > 0) {
      setQueueCount(prev => prev - 1);
      setLog('💧 Leak worker processed 1 request at constant rate r.');
    } else {
      setLog('💤 Queue is empty. Leak worker waiting for next request.');
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
        <span>Leaky Bucket Traffic Shaping Simulator (FIFO Queue Q = 5)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="leaky-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .leaky-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* FIFO Queue Container */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '11.5px' }}>
            <strong style={{ color: '#34d399' }}>FIFO Queue Buffer:</strong>
            <span style={{ color: queueCount < maxQueue ? '#34d399' : '#f87171', fontWeight: 'bold' }}>{queueCount} / {maxQueue} Queued</span>
          </div>

          <div style={{ display: 'flex', gap: '4px', height: '24px' }}>
            {[...Array(maxQueue)].map((_, i) => (
              <div key={i} style={{
                flex: 1, borderRadius: '4px',
                background: i < queueCount ? '#34d399' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            <button onClick={handleEnqueue} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#34d399',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Enqueue 1</button>

            <button onClick={handleEnqueueMultiple} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#38bdf8',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Enqueue 3 Burst</button>

            <button onClick={handleLeak} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#fbbf24', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Leak / Process 1</button>
          </div>
        </div>

        {/* Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: '#34d39940' }}>
          <h4 style={{ color: '#34d399', margin: '0 0 4px 0', fontSize: '13px' }}>Queue Outflow State</h4>
          <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
            {log}
          </p>
        </div>
      </div>
    </div>
  );
}
