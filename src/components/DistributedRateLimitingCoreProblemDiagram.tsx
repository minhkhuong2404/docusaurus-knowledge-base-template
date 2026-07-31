import React, { useState } from 'react';

export default function DistributedRateLimitingCoreProblemDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<'naive' | 'centralized'>('naive');
  const [podCounts, setPodCounts] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [redisCount, setRedisCount] = useState<number>(0);
  const [log, setLog] = useState<string>('Simulator initialized. Global desired limit = 100 req/min across 10 Pods.');

  const limitPerWindow = 100;

  const handleSimulateTraffic = (reqCount: number) => {
    if (mode === 'naive') {
      // In naive mode, each pod tracks its own limit (100 per pod)
      const newCounts = [...podCounts];
      let totalPassed = 0;
      let totalBlocked = 0;

      for (let i = 0; i < reqCount; i++) {
        const randomPodIndex = Math.floor(Math.random() * 10);
        if (newCounts[randomPodIndex] < limitPerWindow) {
          newCounts[randomPodIndex]++;
          totalPassed++;
        } else {
          totalBlocked++;
        }
      }

      setPodCounts(newCounts);
      const grandTotal = newCounts.reduce((a, b) => a + b, 0);
      setLog(`⚠️ Naive Mode: Sent ${reqCount} requests across 10 Pods. Passed: ${totalPassed}, Blocked: ${totalBlocked}. Total Global Traffic Passed: ${grandTotal}/100 desired ceiling!`);
    } else {
      // Centralized mode: all pods update single Redis counter
      let newRedisCount = redisCount;
      let totalPassed = 0;
      let totalBlocked = 0;

      for (let i = 0; i < reqCount; i++) {
        if (newRedisCount < limitPerWindow) {
          newRedisCount++;
          totalPassed++;
        } else {
          totalBlocked++;
        }
      }

      setRedisCount(newRedisCount);
      setLog(`✅ Centralized Redis Mode: Sent ${reqCount} requests. Passed: ${totalPassed}, Blocked: ${totalBlocked}. Total Redis Counter: ${newRedisCount}/100.`);
    }
  };

  const handleReset = () => {
    setPodCounts([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setRedisCount(0);
    setLog('Counters reset for new window.');
  };

  const totalNaivePassed = podCounts.reduce((a, b) => a + b, 0);
  const totalPassed = mode === 'naive' ? totalNaivePassed : redisCount;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
          <line x1="6" y1="6" x2="6.01" y2="6"/>
          <line x1="6" y1="18" x2="6.01" y2="18"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Distributed Rate Limiting: Local Pod vs Centralized Redis Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => { setMode('naive'); handleReset(); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: mode === 'naive' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: mode === 'naive' ? 'rgba(248, 113, 113, 0.15)' : '#0c0e17',
              color: mode === 'naive' ? '#f87171' : 'var(--ifm-color-content-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ❌ Naive Mode (In-Process Per-Pod Limit)
          </button>

          <button
            onClick={() => { setMode('centralized'); handleReset(); }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: mode === 'centralized' ? '1px solid #34d399' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: mode === 'centralized' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17',
              color: mode === 'centralized' ? '#34d399' : 'var(--ifm-color-content-secondary)',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ✅ Centralized Mode (Shared Redis Counter)
          </button>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleSimulateTraffic(50)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#38bdf8', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            + Send 50 Requests
          </button>
          <button
            onClick={() => handleSimulateTraffic(250)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#fbbf24', color: '#000', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            + Burst 250 Requests
          </button>
          <button
            onClick={() => handleSimulateTraffic(1000)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#ec4899', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            + Flood 1,000 Requests
          </button>
          <button
            onClick={handleReset}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginLeft: 'auto' }}
          >
            Reset
          </button>
        </div>

        {/* Global Summary Badge */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: totalPassed > limitPerWindow ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
            border: totalPassed > limitPerWindow ? '1px solid #f87171' : '1px solid #34d399',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', fontWeight: 600 }}>
              Global Traffic Allowed vs Target Ceiling:
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: totalPassed > limitPerWindow ? '#f87171' : '#34d399' }}>
              {totalPassed} / {limitPerWindow} req/min
            </div>
          </div>
          <div style={{ fontSize: '12px', textAlign: 'right', color: 'var(--ifm-color-content)' }}>
            {totalPassed > limitPerWindow ? '🚨 LIMIT BREACHED BY ' + (totalPassed - limitPerWindow) + ' REQUESTS!' : '✅ System Operating Safely Within Quota'}
          </div>
        </div>

        {/* Pods Grid / Redis Central View */}
        {mode === 'naive' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '16px' }}>
            {podCounts.map((cnt, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#0c0e17',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Pod #{idx + 1}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: cnt >= limitPerWindow ? '#f87171' : '#38bdf8' }}>
                  {cnt} / 100
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: '#0c0e17',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #34d399',
              textAlign: 'center',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Centralized Atomic Redis Counter (`rl:v1:global:order-service`)
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#34d399', margin: '8px 0' }}>
              {redisCount} / {limitPerWindow}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>
              All 10 app pods share this single atomic key via Lua script / INCR
            </div>
          </div>
        )}

        {/* Log Box */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: 'var(--ifm-color-content)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {log}
        </div>
      </div>
    </div>
  );
}
