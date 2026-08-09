import React, { useState, useEffect } from 'react';

interface TierConfig {
  name: string;
  badge: string;
  color: string;
  capacity: number;
  refillPerSec: number;
  description: string;
}

const TIERS: Record<string, TierConfig> = {
  free: {
    name: 'Free Tier',
    badge: 'Coarse Cap',
    color: '#94a3b8',
    capacity: 60,
    refillPerSec: 1,
    description: 'Max 60 request burst. Sustained rate: 1 req/sec (60 req/min). Prevents web scraping & automated spam.',
  },
  pro: {
    name: 'Pro Tier',
    badge: 'Developer Burst',
    color: '#38bdf8',
    capacity: 600,
    refillPerSec: 10,
    description: 'Max 600 request burst. Sustained rate: 10 req/sec. Supports batch jobs & active mobile/web SDK usage.',
  },
  enterprise: {
    name: 'Enterprise Tier',
    badge: 'High Throughput',
    color: '#34d399',
    capacity: 6000,
    refillPerSec: 100,
    description: 'Max 6,000 request burst. Sustained rate: 100 req/sec. Designed for real-time firehoses & high-volume integrations.',
  },
};

export default function TieredBurstAllowanceDiagram(): React.JSX.Element {
  const [selectedTierKey, setSelectedTierKey] = useState<string>('pro');
  const [tokens, setTokens] = useState<number>(TIERS['pro'].capacity);
  const [log, setLog] = useState<string>('Select a tier and simulate bursts to observe token bucket dynamics.');

  const activeTier = TIERS[selectedTierKey];

  // Reset tokens when tier changes
  useEffect(() => {
    setTokens(TIERS[selectedTierKey].capacity);
    setLog(`Switched to ${TIERS[selectedTierKey].name}. Bucket filled to max capacity (${TIERS[selectedTierKey].capacity} tokens).`);
  }, [selectedTierKey]);

  // Automatic token refill effect (ticks every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setTokens((prev) => Math.min(activeTier.capacity, prev + activeTier.refillPerSec));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTier]);

  const handleBurst = (amount: number) => {
    if (tokens >= amount) {
      setTokens((prev) => prev - amount);
      setLog(`✅ BURST SUCCESSFUL! Consumed ${amount} tokens. Remaining in bucket: ${tokens - amount}/${activeTier.capacity}.`);
    } else {
      const allowed = tokens;
      setTokens(0);
      setLog(`🚨 BURST TRUNCATED / REJECTED! Requested ${amount} tokens, but only ${allowed} were available! ${amount - allowed} requests rejected (HTTP 429).`);
    }
  };

  const percentage = Math.min(100, Math.max(0, (tokens / activeTier.capacity) * 100));

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Tiered Token Bucket & Burst Allowance Simulator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tier Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {Object.entries(TIERS).map(([key, tier]) => {
            const isSelected = key === selectedTierKey;
            return (
              <button
                key={key}
                onClick={() => setSelectedTierKey(key)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1.5px solid ${tier.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${tier.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  fontWeight: isSelected ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s ease',
                }}
              >
                {tier.name}
              </button>
            );
          })}
        </div>

        {/* Tier Description */}
        <div style={{ backgroundColor: '#0c0e17', padding: '12px 16px', borderRadius: '8px', borderLeft: `4px solid ${activeTier.color}`, marginBottom: '16px', fontSize: '13px', color: 'var(--ifm-color-content)' }}>
          {activeTier.description}
        </div>

        {/* Bucket Level Indicator & Fill Bar */}
        <div style={{ backgroundColor: '#0c0e17', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ fontWeight: 600, color: 'var(--ifm-color-content-secondary)' }}>
              Token Bucket Available Capacity:
            </span>
            <span style={{ fontWeight: 800, color: activeTier.color, fontSize: '15px' }}>
              {Math.floor(tokens)} / {activeTier.capacity} tokens ({activeTier.refillPerSec} refilled/sec)
            </span>
          </div>

          <div style={{ width: '100%', height: '16px', backgroundColor: '#05070e', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div
              style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: activeTier.color,
                boxShadow: `0 0 10px ${activeTier.color}`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Simulation Controls */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleBurst(1)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#38bdf8', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Send 1 Request
          </button>
          <button
            onClick={() => handleBurst(50)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#fbbf24', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Burst 50 Requests
          </button>
          <button
            onClick={() => handleBurst(500)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: '#ec4899', color: '#fff', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            Burst 500 Requests
          </button>
          <button
            onClick={() => setTokens(activeTier.capacity)}
            style={{ padding: '8px 14px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginLeft: 'auto' }}
          >
            Refill Full
          </button>
        </div>

        {/* Log Box */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: 'var(--ifm-color-content)', border: '1px solid rgba(255,255,255,0.05)' }}>
          {log}
        </div>
      </div>
    </div>
  );
}
