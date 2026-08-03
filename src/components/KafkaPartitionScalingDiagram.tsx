import React, { useState } from 'react';

const SCALING_SCENARIOS = [
  { partitions: 3, consumers: 3, state: 'Ideal 1:1 Mapping', color: '#34d399', desc: '3 Partitions assigned to 3 Consumers. Each consumer thread processes exactly 1 partition. Maximum parallel throughput.' },
  { partitions: 3, consumers: 5, state: 'Idle Consumers (Over-provisioned)', color: '#fbbf24', desc: '3 Partitions assigned to 5 Consumers. 2 consumers sit IDLE receiving 0 partitions. Adding consumers past partition count yields 0 extra throughput.' },
  { partitions: 6, consumers: 3, state: 'Shared Partitions per Consumer', color: '#38bdf8', desc: '6 Partitions assigned to 3 Consumers. Each consumer thread processes 2 partitions. Consumer group can be scaled up to 6 consumers.' }
];

export default function KafkaPartitionScalingDiagram(): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const curr = SCALING_SCENARIOS[selectedIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .scaling-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Partition & Consumer Group Parallelism Scaling Calculator
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {SCALING_SCENARIOS.map((s, idx) => (
            <button
              key={s.state}
              onClick={() => setSelectedIdx(idx)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedIdx === idx ? `${s.color}20` : 'rgba(255,255,255,0.04)',
                color: selectedIdx === idx ? s.color : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedIdx === idx ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.partitions} Partitions / {s.consumers} Consumers
            </button>
          ))}
        </div>

        <div className="scaling-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: curr.color, marginBottom: '10px' }}>
              SCALING RATIO SPECIFICATION
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Topic Partitions:</strong> <span style={{ color: '#38bdf8' }}>{curr.partitions}</span></div>
              <div><strong>Active Consumer Instances:</strong> <span style={{ color: '#34d399' }}>{curr.consumers}</span></div>
              <div><strong>Max Parallelism Limit:</strong> <span style={{ color: '#fbbf24' }}>{curr.partitions} Consumers</span></div>
            </div>
          </div>

          <div className="interactive-diagram-details-card details-blue">
            <div style={{ fontSize: '10px', fontWeight: 800, color: curr.color, textTransform: 'uppercase', marginBottom: '6px' }}>
              CONSUMER GROUP ASSIGNMENT STATUS
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: curr.color, marginBottom: '8px' }}>
              {curr.state}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {curr.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}