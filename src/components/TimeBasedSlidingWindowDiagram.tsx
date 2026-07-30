import React, { useState } from 'react';

interface SecondBucket {
  secOffset: number; // e.g. -9 to 0
  successes: number;
  failures: number;
}

export default function TimeBasedSlidingWindowDiagram() {
  const [buckets, setBuckets] = useState<SecondBucket[]>([
    { secOffset: -9, successes: 4, failures: 0 },
    { secOffset: -8, successes: 5, failures: 0 },
    { secOffset: -7, successes: 3, failures: 1 },
    { secOffset: -6, successes: 4, failures: 0 },
    { secOffset: -5, successes: 2, failures: 0 },
    { secOffset: -4, successes: 5, failures: 0 },
    { secOffset: -3, successes: 4, failures: 0 },
    { secOffset: -2, successes: 3, failures: 0 },
    { secOffset: -1, successes: 5, failures: 0 },
    { secOffset: 0, successes: 4, failures: 0 },
  ]);

  const threshold = 50;

  const advanceTime = () => {
    setBuckets(prev => {
      const shifted = prev.slice(1).map((b, i) => ({
        ...b,
        secOffset: -9 + i
      }));
      shifted.push({ secOffset: 0, successes: 0, failures: 0 });
      return shifted;
    });
  };

  const addCallsToCurrent = (succ: number, fail: number) => {
    setBuckets(prev => {
      const copy = [...prev];
      const current = copy[copy.length - 1];
      copy[copy.length - 1] = {
        ...current,
        successes: current.successes + succ,
        failures: current.failures + fail
      };
      return copy;
    });
  };

  const totalSuccesses = buckets.reduce((acc, b) => acc + b.successes, 0);
  const totalFailures = buckets.reduce((acc, b) => acc + b.failures, 0);
  const totalCalls = totalSuccesses + totalFailures;
  const failureRate = totalCalls > 0 ? Math.round((totalFailures / totalCalls) * 100) : 0;
  const isTripped = totalCalls >= 5 && failureRate >= threshold;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span>TIME_BASED Sliding Window Simulator</span>

        <button onClick={advanceTime} style={{
          marginLeft: 'auto', padding: '5px 12px', borderRadius: '6px', border: 'none',
          background: '#38bdf8', color: '#090b14', fontSize: '11.5px', cursor: 'pointer', fontWeight: 'bold'
        }}>
          ⏰ Advance Time (+1 sec)
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }} className="time-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .time-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Bucket Timeline Chart */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
            10 Per-Second Aggregation Buckets:
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '12px' }}>
            {buckets.map((b, idx) => {
              const total = b.successes + b.failures;
              const isCurrent = idx === 9;
              return (
                <div key={idx} style={{
                  padding: '8px 4px', borderRadius: '6px',
                  background: isCurrent ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isCurrent ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '9px', color: 'var(--ifm-color-content-secondary)', marginBottom: '2px' }}>
                    {isCurrent ? 'T (Current)' : `T${b.secOffset}s`}
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399' }}>{b.successes} s</div>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: b.failures > 0 ? '#f87171' : '#64748b' }}>{b.failures} f</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => addCallsToCurrent(5, 0)} style={{
              padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#34d399',
              color: '#090b14', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>
              +5 Successes (Current Sec)
            </button>
            <button onClick={() => addCallsToCurrent(0, 4)} style={{
              padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#f87171',
              color: '#ffffff', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer'
            }}>
              +4 Failures (Current Sec)
            </button>
          </div>
        </div>

        {/* Aggregate Info Card */}
        <div className="interactive-diagram-details-card" style={{ borderColor: isTripped ? '#f8717140' : '#34d39940' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: isTripped ? '#f87171' : '#34d399' }}>
              10-Second Window Metrics
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Total Window Volume:</span>
              <strong>{totalCalls} calls ({totalSuccesses} ok, {totalFailures} fail)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>Computed Failure Rate:</span>
              <strong style={{ color: isTripped ? '#f87171' : '#34d399' }}>{failureRate}% (Threshold: {threshold}%)</strong>
            </div>
          </div>

          <div style={{
            fontSize: '11.5px', padding: '10px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            marginTop: '10px'
          }}>
            <strong style={{ color: '#38bdf8' }}>Bursty Traffic Advantage:</strong>
            <p style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', margin: '4px 0 0 0' }}>
              As time advances (+1 sec), old failure spikes automatically roll off the 10-second window. Time-based windows prevent historical failures from pinning the breaker open during quiet traffic periods.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
