import React, { useState } from 'react';

export default function FixedWindowCounterDiagram() {
  const limit = 5;
  const [currentWindow, setCurrentWindow] = useState<'A' | 'B'>('A');
  const [counterA, setCounterA] = useState<number>(3);
  const [counterB, setCounterB] = useState<number>(0);
  const [log, setLog] = useState<string>('Window A active [00:00 - 01:00]. Current count: 3/5.');

  const handleSendRequest = () => {
    if (currentWindow === 'A') {
      if (counterA < limit) {
        setCounterA(prev => prev + 1);
        setLog(`✅ Request APPROVED in Window A! Counter incremented to ${counterA + 1}/${limit}.`);
      } else {
        setLog(`🚨 Window A counter limit (${limit}) reached! Request rejected (HTTP 429).`);
      }
    } else {
      if (counterB < limit) {
        setCounterB(prev => prev + 1);
        setLog(`✅ Request APPROVED in Window B! Counter incremented to ${counterB + 1}/${limit}.`);
      } else {
        setLog(`🚨 Window B counter limit (${limit}) reached! Request rejected (HTTP 429).`);
      }
    }
  };

  const handleNextWindow = () => {
    if (currentWindow === 'A') {
      setCurrentWindow('B');
      setCounterB(0);
      setLog('⏰ Window advanced to Window B [01:00 - 02:00]. Counter automatically reset to 0/5!');
    } else {
      setCurrentWindow('A');
      setCounterA(0);
      setLog('⏰ Window advanced to Window A [02:00 - 03:00]. Counter automatically reset to 0/5!');
    }
  };

  const activeCount = currentWindow === 'A' ? counterA : counterB;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/>
        </svg>
        <span>Fixed Window Counter Mechanism (Limit = 5 / Window)</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'center' }} className="fw-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .fw-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Windows Visualization */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Window A */}
          <div style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            background: currentWindow === 'A' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.02)',
            border: currentWindow === 'A' ? '1.5px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '11.5px', color: '#38bdf8' }}>Window A [00:00 - 01:00]</strong>
              {currentWindow === 'A' && <span style={{ fontSize: '9px', background: '#38bdf8', color: '#090b14', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>ACTIVE</span>}
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#e2e8f0' }}>
              Counter: <strong style={{ color: counterA < limit ? '#34d399' : '#f87171' }}>{counterA} / {limit}</strong>
            </div>
          </div>

          {/* Window B */}
          <div style={{
            flex: 1, padding: '10px', borderRadius: '8px',
            background: currentWindow === 'B' ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255,255,255,0.02)',
            border: currentWindow === 'B' ? '1.5px solid #34d399' : '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '11.5px', color: '#34d399' }}>Window B [01:00 - 02:00]</strong>
              {currentWindow === 'B' && <span style={{ fontSize: '9px', background: '#34d399', color: '#090b14', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px' }}>ACTIVE</span>}
            </div>
            <div style={{ fontSize: '12px', marginTop: '6px', color: '#e2e8f0' }}>
              Counter: <strong style={{ color: counterB < limit ? '#34d399' : '#f87171' }}>{counterB} / {limit}</strong>
            </div>
          </div>
        </div>

        {/* Info & Controls Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: currentWindow === 'A' ? '#38bdf840' : '#34d39940' }}>
          <div style={{ fontSize: '12px', color: '#e2e8f0', marginBottom: '8px' }}>
            {log}
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleSendRequest} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: currentWindow === 'A' ? '#38bdf8' : '#34d399',
              color: '#0f172a', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Send Request</button>

            <button onClick={handleNextWindow} style={{
              padding: '6px 10px', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.06)',
              color: '#fbbf24', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>Advance to Next Window ⏰</button>
          </div>
        </div>
      </div>
    </div>
  );
}
