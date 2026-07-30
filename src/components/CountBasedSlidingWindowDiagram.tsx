import React, { useState } from 'react';

type Outcome = 'SUCCESS' | 'FAILURE' | 'SLOW';

export default function CountBasedSlidingWindowDiagram() {
  const [window, setWindow] = useState<Outcome[]>(['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS']);
  const windowSize = 5;
  const minCalls = 3;
  const failureThreshold = 50;

  const addOutcome = (type: Outcome) => {
    setWindow(prev => {
      const next = [...prev.slice(1), type];
      return next;
    });
  };

  const resetWindow = () => {
    setWindow(['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS']);
  };

  const failures = window.filter(o => o === 'FAILURE' || o === 'SLOW').length;
  const failureRate = Math.round((failures / windowSize) * 100);
  const isTripped = window.length >= minCalls && failureRate >= failureThreshold;

  const getOutcomeColor = (o: Outcome) => {
    if (o === 'SUCCESS') return '#34d399';
    if (o === 'SLOW') return '#fbbf24';
    return '#f87171';
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
        <span>COUNT_BASED Sliding Window Simulator</span>

        <button onClick={resetWindow} style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px', border: 'none',
          background: 'rgba(255,255,255,0.06)', color: 'var(--ifm-color-content-secondary)',
          fontSize: '11.5px', cursor: 'pointer', fontWeight: 600
        }}>
          🔄 Reset Window
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="count-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .count-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Circular Array Visualizer */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--ifm-color-content)' }}>
              Circular Array (Size N={windowSize}):
            </span>
            <span style={{
              fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '4px',
              color: isTripped ? '#f87171' : '#34d399',
              background: isTripped ? '#f8717118' : '#34d39918',
              border: `1px solid ${isTripped ? '#f8717140' : '#34d39940'}`
            }}>
              State: {isTripped ? 'OPEN 🔴' : 'CLOSED 🟢'}
            </span>
          </div>

          {/* Slots */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
            {window.map((outcome, idx) => {
              const color = getOutcomeColor(outcome);
              const isOldest = idx === 0;
              const isNewest = idx === windowSize - 1;
              return (
                <div key={idx} style={{
                  flex: 1, minWidth: '70px', padding: '10px 6px', borderRadius: '8px',
                  background: `${color}15`, border: `1.5px solid ${color}`,
                  textAlign: 'center', transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>
                    {isOldest ? 'Oldest (Evicting)' : isNewest ? 'Newest' : `Slot ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: color }}>
                    {outcome}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Controls to push calls */}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 'bold' }}>RECORD CALL OUTCOME:</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => addOutcome('SUCCESS')} style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#34d399',
                color: '#090b14', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
              }}>
                + Success (200)
              </button>
              <button onClick={() => addOutcome('FAILURE')} style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#f87171',
                color: '#ffffff', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
              }}>
                + Failure (500)
              </button>
              <button onClick={() => addOutcome('SLOW')} style={{
                padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#fbbf24',
                color: '#090b14', fontWeight: 'bold', fontSize: '11.5px', cursor: 'pointer'
              }}>
                + Slow Call (&gt;2s)
              </button>
            </div>
          </div>
        </div>

        {/* Metrics & Calculations Panel */}
        <div className="interactive-diagram-details-card" style={{ borderColor: isTripped ? '#f8717140' : '#34d39940' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: isTripped ? '#f87171' : '#34d399' }}>
              Sliding Window Metrics
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Recorded Calls:</span>
              <strong>{windowSize} / {windowSize}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Minimum Calls Guard:</span>
              <strong style={{ color: '#34d399' }}>Passed ({minCalls} min)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Current Failure Rate:</span>
              <strong style={{ color: isTripped ? '#f87171' : '#34d399' }}>{failureRate}% (Threshold: {failureThreshold}%)</strong>
            </div>
          </div>

          <div style={{
            fontSize: '11.5px', padding: '10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '10px'
          }}>
            {isTripped ? (
              <div style={{ color: '#f87171' }}>
                🚨 <strong>BREAKER TRIPPED!</strong> Failure rate ({failureRate}%) &gt;= threshold ({failureThreshold}%). Breaker opens for 30s to prevent further downstream damage.
              </div>
            ) : (
              <div style={{ color: '#34d399' }}>
                🟢 <strong>BREAKER HEALTHY.</strong> Failure rate ({failureRate}%) is under safety threshold ({failureThreshold}%).
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
