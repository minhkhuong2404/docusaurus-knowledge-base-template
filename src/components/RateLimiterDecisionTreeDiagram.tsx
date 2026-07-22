import React, { useState } from 'react';

export default function RateLimiterDecisionTreeDiagram() {
  const [allowBursts, setAllowBursts] = useState<boolean | null>(null);
  const [strictSmoothing, setStrictSmoothing] = useState<boolean | null>(null);
  const [memConstraint, setMemConstraint] = useState<boolean | null>(null);
  const [allowBoundarySpike, setAllowBoundarySpike] = useState<boolean | null>(null);

  const resetAll = () => {
    setAllowBursts(null);
    setStrictSmoothing(null);
    setMemConstraint(null);
    setAllowBoundarySpike(null);
  };

  const getRecommendation = () => {
    if (allowBursts === true) return { name: 'Token Bucket', color: '#38bdf8', desc: 'Best choice for general APIs & monetization tiers where bursty traffic is allowed up to bucket capacity C.' };
    if (strictSmoothing === true) return { name: 'Leaky Bucket', color: '#34d399', desc: 'Best choice for database write throttling and egress shaping where constant outflow processing rate r is strictly enforced.' };
    if (memConstraint === false) return { name: 'Fixed Window Counter', color: '#f87171', desc: 'Simple quota-based limits (e.g., 10,000/day) where low memory is prioritized over microsecond accuracy.' };
    if (allowBoundarySpike === true) return { name: 'Sliding Window Counter', color: '#a78bfa', desc: 'Industry standard for high-throughput microservices (Cloudflare, Kong) - O(1) memory with smooth interpolation.' };
    if (allowBoundarySpike === false) return { name: 'Sliding Window Log', color: '#fbbf24', desc: 'Strict security & checkout endpoints where zero boundary spikes can be tolerated (requires Redis ZSET logs).' };
    return null;
  };

  const rec = getRecommendation();

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
        </svg>
        <span>Rate Limiting Algorithm Decision Wizard</span>

        <button onClick={resetAll} style={{
          marginLeft: 'auto', padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', fontSize: '11px'
        }}>Reset Questions</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Step 1 */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <strong style={{ fontSize: '12px', color: '#38bdf8' }}>1. Do you need to allow bursts of traffic?</strong>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button onClick={() => { setAllowBursts(true); setStrictSmoothing(null); }} style={{
              padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
              background: allowBursts === true ? '#38bdf820' : 'rgba(255,255,255,0.04)',
              color: allowBursts === true ? '#38bdf8' : '#94a3b8'
            }}>Yes (Allow Bursts)</button>
            <button onClick={() => { setAllowBursts(false); }} style={{
              padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
              background: allowBursts === false ? '#f8717120' : 'rgba(255,255,255,0.04)',
              color: allowBursts === false ? '#f87171' : '#94a3b8'
            }}>No (Constant Rate Only)</button>
          </div>
        </div>

        {/* Step 2 */}
        {allowBursts === false && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ fontSize: '12px', color: '#34d399' }}>2. Is strict rate smoothing (FIFO queueing) required?</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={() => setStrictSmoothing(true)} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: strictSmoothing === true ? '#34d39920' : 'rgba(255,255,255,0.04)',
                color: strictSmoothing === true ? '#34d399' : '#94a3b8'
              }}>Yes (Smooth Queue Outflow)</button>
              <button onClick={() => { setStrictSmoothing(false); setMemConstraint(null); }} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: strictSmoothing === false ? '#f8717120' : 'rgba(255,255,255,0.04)',
                color: strictSmoothing === false ? '#f87171' : '#94a3b8'
              }}>No</button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {allowBursts === false && strictSmoothing === false && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ fontSize: '12px', color: '#a78bfa' }}>3. Is memory consumption per client a strict constraint?</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={() => setMemConstraint(true)} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: memConstraint === true ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
                color: memConstraint === true ? '#a78bfa' : '#94a3b8'
              }}>Yes (O(1) Memory Required)</button>
              <button onClick={() => setMemConstraint(false)} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: memConstraint === false ? '#f8717120' : 'rgba(255,255,255,0.04)',
                color: memConstraint === false ? '#f87171' : '#94a3b8'
              }}>No (Simple Daily Quotas)</button>
            </div>
          </div>
        )}

        {/* Step 4 */}
        {allowBursts === false && strictSmoothing === false && memConstraint === true && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <strong style={{ fontSize: '12px', color: '#fbbf24' }}>4. Is slight boundary spike estimation acceptable?</strong>
            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button onClick={() => setAllowBoundarySpike(true)} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: allowBoundarySpike === true ? '#a78bfa20' : 'rgba(255,255,255,0.04)',
                color: allowBoundarySpike === true ? '#a78bfa' : '#94a3b8'
              }}>Yes (Interpolated Approximation)</button>
              <button onClick={() => setAllowBoundarySpike(false)} style={{
                padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '11px',
                background: allowBoundarySpike === false ? '#fbbf2420' : 'rgba(255,255,255,0.04)',
                color: allowBoundarySpike === false ? '#fbbf24' : '#94a3b8'
              }}>No (Strict Timestamp Log)</button>
            </div>
          </div>
        )}

        {/* Recommendation Result */}
        {rec && (
          <div className="interactive-diagram-details-card" style={{ borderColor: `${rec.color}50`, marginTop: '4px' }}>
            <h3 style={{ color: rec.color, margin: '0 0 4px 0', fontSize: '14px' }}>
              Recommended Algorithm: {rec.name}
            </h3>
            <p style={{ fontSize: '12px', color: '#e2e8f0', margin: 0 }}>
              {rec.desc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
