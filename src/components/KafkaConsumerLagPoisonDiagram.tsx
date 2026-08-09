import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'normal',
    label: 'Healthy Consumer',
    color: '#34d399',
    leo: 1000,
    committed: 998,
    lag: 2,
    desc: 'Consumer is keeping up. Lag is minimal (2 messages behind LEO). This is normal operating state — small lag is expected due to network round trips.',
    tags: ['Consumer lag: 2', 'Status: Healthy', 'Action: Monitor periodically'],
  },
  {
    id: 'growing',
    label: 'Growing Lag',
    color: '#fbbf24',
    leo: 1000,
    committed: 880,
    lag: 120,
    desc: 'Consumer is falling behind. Lag is growing — either the consumer is slow (CPU/DB bottleneck) or the producer rate has spiked. Without intervention, the lag will continue growing.',
    tags: ['Consumer lag: 120', 'Status: Warning', 'Action: Scale consumers or optimize processing'],
  },
  {
    id: 'poison',
    label: 'Poison Pill',
    color: '#f87171',
    leo: 1000,
    committed: 730,
    lag: 270,
    desc: 'A "poison pill" is a malformed or processing-breaking record that causes the consumer to crash or throw on every retry. The consumer restarts, reads the same offset, crashes again — lag grows unbounded.',
    tags: ['Consumer lag: 270 (growing)', 'Status: CRITICAL', 'Fix: Dead Letter Topic + skip offset'],
  },
  {
    id: 'stalled',
    label: 'Stalled Consumer',
    color: '#f97316',
    leo: 1000,
    committed: 500,
    lag: 500,
    desc: 'Consumer process has stalled — heartbeats may still be sent but poll() is not being called fast enough (exceeds max.poll.interval.ms). A rebalance will eventually trigger and the partition will be reassigned.',
    tags: ['Consumer lag: 500', 'max.poll.interval.ms exceeded', 'Rebalance imminent'],
  },
];

export default function KafkaConsumerLagPoisonDiagram({ initialScenario = 'normal' }: { initialScenario?: string }): React.JSX.Element {
  const [selected, setSelected] = useState<string>(initialScenario);
  const scenario = SCENARIOS.find(s => s.id === selected) || SCENARIOS[0];

  const lagPct = Math.round((scenario.lag / scenario.leo) * 100);
  const committedPct = Math.round((scenario.committed / scenario.leo) * 100);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Consumer Lag &amp; Poison Pill Detection</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Scenario buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => setSelected(s.id)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: selected === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)', color: selected === s.id ? s.color : 'var(--ifm-color-content-secondary)', boxShadow: selected === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {s.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 16px', lineHeight: 1.6 }}>{scenario.desc}</p>

        {/* Partition log visualization */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Partition 0 Log
          </div>

          {/* Log bar */}
          <div style={{ position: 'relative', height: '44px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
            {/* Committed region */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: `${committedPct}%`, height: '100%', background: `${scenario.color}20`, borderRight: `2px solid ${scenario.color}`, transition: 'width 0.5s ease' }} />
            {/* Labels */}
            <div style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: scenario.color, fontWeight: 700 }}>
              offset 0
            </div>
            <div style={{ position: 'absolute', left: `${committedPct - 1}%`, top: '2px', fontSize: '9px', color: scenario.color, fontWeight: 700, whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
              committed
            </div>
            <div style={{ position: 'absolute', left: `${committedPct - 1}%`, top: '60%', fontSize: '9px', color: scenario.color, opacity: 0.7, whiteSpace: 'nowrap', transform: 'translateX(-50%)' }}>
              {scenario.committed}
            </div>
            <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
              LEO: {scenario.leo}
            </div>
          </div>

          {/* Lag bar */}
          <div style={{ position: 'relative', height: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: `${committedPct}%`, top: 0, width: `${100 - committedPct}%`, height: '100%', background: `${scenario.lag > 200 ? '#f87171' : scenario.lag > 50 ? '#fbbf24' : '#34d399'}20`, transition: 'all 0.5s ease' }} />
            <div style={{ position: 'absolute', left: `${committedPct + (100 - committedPct) / 2}%`, top: '50%', transform: 'translate(-50%, -50%)', fontSize: '11px', fontWeight: 700, color: scenario.lag > 200 ? '#f87171' : scenario.lag > 50 ? '#fbbf24' : '#34d399', whiteSpace: 'nowrap' }}>
              LAG: {scenario.lag} messages
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Committed Offset', val: scenario.committed, color: scenario.color },
            { label: 'Log End Offset (LEO)', val: scenario.leo, color: '#38bdf8' },
            { label: 'Consumer Lag', val: scenario.lag, color: scenario.lag > 200 ? '#f87171' : scenario.lag > 50 ? '#fbbf24' : '#34d399' },
          ].map(m => (
            <div key={m.label} style={{ background: `${m.color}0d`, border: `1px solid ${m.color}30`, borderRadius: '8px', padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px' }}>{m.label}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {scenario.tags.map(t => (
            <code key={t} style={{ fontSize: '10.5px', background: `${scenario.color}18`, color: scenario.color, border: `1px solid ${scenario.color}40`, borderRadius: '5px', padding: '2px 8px' }}>{t}</code>
          ))}
        </div>
      </div>
    </div>
  );
}