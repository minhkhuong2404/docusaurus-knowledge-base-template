import React, { useState } from 'react';

interface StrategyDetail {
  id: string;
  name: string;
  formula: string;
  delays: number[]; // Initial delays for attempts 1..5 in ms (average)
  jittered: boolean;
  color: string;
  desc: string;
  pros: string;
  cons: string;
  recommendation: string;
}

const STRATEGIES: StrategyDetail[] = [
  {
    id: 'constant',
    name: 'Constant (Fixed) Backoff',
    formula: 'wait = initialDelay (e.g. 500ms)',
    delays: [500, 500, 500, 500, 500],
    jittered: false,
    color: '#38bdf8',
    desc: 'Waits an exact fixed duration between every retry attempt.',
    pros: 'Simple to understand and configure.',
    cons: 'Creates synchronized traffic waves (retry storms) if multiple callers fail simultaneously.',
    recommendation: 'Use only for single-client internal jobs where concurrent callers do not exist.'
  },
  {
    id: 'linear',
    name: 'Linear Backoff',
    formula: 'wait = initialDelay * attempt (e.g. 200ms * n)',
    delays: [200, 400, 600, 800, 1000],
    jittered: false,
    color: '#fbbf24',
    desc: 'Wait duration increases linearly with each retry attempt.',
    pros: 'Gives the downstream service slightly more time with each failure.',
    cons: 'Still predictable — multiple failing callers retain synchronized wave intervals.',
    recommendation: 'Rarely optimal for high-scale microservices.'
  },
  {
    id: 'exponential',
    name: 'Exponential Backoff',
    formula: 'wait = min(maxDelay, initialDelay * 2^(attempt-1))',
    delays: [100, 200, 400, 800, 1600],
    jittered: false,
    color: '#a78bfa',
    desc: 'Wait duration doubles with each attempt, rapidly backing off under sustained failure.',
    pros: 'Gives recovering services breathing room to heal.',
    cons: 'Without jitter, all callers fail at t=0 and fire synchronized pulses at t=1s, 2s, 4s.',
    recommendation: 'Good base mechanism, but MUST be paired with randomized Jitter.'
  },
  {
    id: 'jitter',
    name: 'Exponential Backoff with Full Jitter',
    formula: 'wait = random(0, min(maxDelay, initialDelay * 2^attempt))',
    delays: [90, 180, 360, 720, 1400], // representative avg random values
    jittered: true,
    color: '#34d399',
    desc: 'Adds randomized variance [0, expWait] to scatter retries into a smooth continuous distribution.',
    pros: 'Eliminates thundering herd spikes completely; recommended standard by AWS.',
    cons: 'Occasionally produces very short wait times.',
    recommendation: 'Recommended default for almost all distributed cloud microservices.'
  },
  {
    id: 'decorrelated',
    name: 'Decorrelated Jitter',
    formula: 'wait[n] = min(maxDelay, random(initialDelay, wait[n-1] * 3))',
    delays: [150, 320, 580, 1100, 1800],
    jittered: true,
    color: '#2dd4bf',
    desc: 'Each attempt wait is randomly picked relative to the PREVIOUS attempt duration.',
    pros: 'Spreads fleet retries even more uniformly across high-cardinality callers (thousands of clients).',
    cons: 'Slightly higher memory overhead to track previous wait state.',
    recommendation: 'Best for massive API gateways with 10,000+ simultaneous clients.'
  }
];

export default function BackoffStrategiesDiagram() {
  const [activeId, setActiveId] = useState<string>('jitter');

  const strategy = STRATEGIES.find(s => s.id === activeId) || STRATEGIES[3];
  const maxDelayVal = 2000;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Backoff Strategy Visualizer</span>

        {/* Tabs */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {STRATEGIES.map(s => (
            <button key={s.id} onClick={() => setActiveId(s.id)} style={{
              padding: '5px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '11px',
              background: activeId === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)',
              color: activeId === s.id ? s.color : 'var(--ifm-color-content-secondary)',
              boxShadow: activeId === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease',
            }}>
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '16px', alignItems: 'start' }} className="backoff-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 768px) {
            .backoff-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Timeline Delay Chart */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: strategy.color, marginBottom: '12px' }}>
            RETRY DELAY PER ATTEMPT (ms):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {strategy.delays.map((delay, idx) => {
              const widthPct = Math.min(100, (delay / maxDelayVal) * 100);
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', width: '70px', color: 'var(--ifm-color-content-secondary)', flexShrink: 0 }}>
                    Attempt {idx + 1}:
                  </span>
                  <div style={{ flex: 1, height: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${widthPct}%`, height: '100%',
                      background: strategy.jittered
                        ? `linear-gradient(90deg, ${strategy.color}80, ${strategy.color})`
                        : strategy.color,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '8px'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#090b14' }}>
                        {delay}ms
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formula & Use Case Details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: `${strategy.color}40` }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: strategy.color }}>{strategy.name}</h3>
          </div>

          <div style={{ marginBottom: '10px' }}>
            <span style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', fontWeight: 'bold' }}>MATHEMATICAL FORMULA:</span>
            <code style={{
              display: 'block', padding: '6px 10px', background: '#090b14', borderRadius: '6px',
              color: strategy.color, fontSize: '11.5px', marginTop: '4px', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {strategy.formula}
            </code>
          </div>

          <p style={{ fontSize: '12.5px', color: '#e2e8f0', margin: '8px 0' }}>
            {strategy.desc}
          </p>

          <div style={{ fontSize: '11.5px', marginTop: '10px' }}>
            <div style={{ color: '#34d399', marginBottom: '4px' }}>✅ <strong>Pros:</strong> {strategy.pros}</div>
            <div style={{ color: '#f87171', marginBottom: '8px' }}>❌ <strong>Cons:</strong> {strategy.cons}</div>
            <div style={{
              background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: '6px',
              border: `1px solid ${strategy.color}30`
            }}>
              <strong style={{ color: strategy.color }}>Recommendation:</strong> {strategy.recommendation}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
