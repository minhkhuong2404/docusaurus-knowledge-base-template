import React, { useState } from 'react';

interface SysCallInfo {
  call: string;
  behavior: string;
  latency: string;
  durability: string;
  color: string;
}

const SYSCALLS: SysCallInfo[] = [
  { call: 'write(fd, buf, count)', behavior: 'Copies app buffer to OS Page Cache. Does NOT flush disk.', latency: '~ 1 μs', durability: 'Volatile (Lost on OS crash)', color: '#38bdf8' },
  { call: 'fdatasync(fd)', behavior: 'Flushes data pages to non-volatile disk; omits non-essential metadata updates.', latency: '~ 0.5 - 2 ms', durability: 'Durable', color: '#fbbf24' },
  { call: 'fsync(fd)', behavior: 'Flushes data pages AND file inode metadata (file size, access timestamps).', latency: '~ 1 - 3 ms', durability: 'Durable + Metadata', color: '#34d399' },
  { call: 'open(..., O_DIRECT | O_DSYNC)', behavior: 'Bypasses OS Page Cache entirely; performs direct synchronous I/O.', latency: 'Variable', durability: 'Direct Hardware Durability', color: '#a78bfa' },
];

export default function AcidOsStorageStackDiagram(): React.JSX.Element {
  const [selectedCallIdx, setSelectedCallIdx] = useState(2); // fsync by default

  const current = SYSCALLS[selectedCallIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .stack-grid { grid-template-columns: 1fr !important; } }`}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="10" x2="6" y2="14" />
          <line x1="18" y1="10" x2="18" y2="14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          OS Kernel Storage Stack & System Call Selector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="stack-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          
          {/* Left: System Call Selector Buttons */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '8px' }}>
              Select I/O System Call
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SYSCALLS.map((s, idx) => {
                const isSel = selectedCallIdx === idx;
                return (
                  <button
                    key={s.call}
                    onClick={() => setSelectedCallIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      background: isSel ? `${s.color}20` : 'rgba(255,255,255,0.03)',
                      boxShadow: isSel ? `0 0 0 1.5px ${s.color}` : '0 0 0 1px rgba(255,255,255,0.08)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <code style={{ fontSize: '11.5px', fontWeight: 700, color: isSel ? s.color : 'var(--ifm-color-content)' }}>{s.call}</code>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>
                      Latency: <strong style={{ color: s.color }}>{s.latency}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: System Call Behavior Detail Card */}
          <div className={`interactive-diagram-details-card details-${selectedCallIdx === 0 ? 'blue' : selectedCallIdx === 1 ? 'yellow' : selectedCallIdx === 2 ? 'green' : 'purple'}`} style={{ minHeight: '190px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: current.color, textTransform: 'uppercase', marginBottom: '2px' }}>
              System Call Profile
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
              <code>{current.call}</code>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 12px', lineHeight: 1.6 }}>
              {current.behavior}
            </p>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Latency: </span><strong style={{ color: current.color }}>{current.latency}</strong></div>
              <div><span style={{ color: 'var(--ifm-color-content-secondary)' }}>Durability: </span><strong style={{ color: current.durability.includes('Durable') ? '#34d399' : '#f87171' }}>{current.durability}</strong></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
