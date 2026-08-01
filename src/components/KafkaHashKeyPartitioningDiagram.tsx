import React, { useState } from 'react';

const PARTITIONS = [
  { id: 'p0', label: 'Partition 0', x: 480, y: 60, w: 120, h: 45, color: '#38bdf8' },
  { id: 'p1', label: 'Partition 1', x: 480, y: 125, w: 120, h: 45, color: '#34d399' },
  { id: 'p2', label: 'Partition 2', x: 480, y: 190, w: 120, h: 45, color: '#a78bfa' },
  { id: 'p3', label: 'Partition 3', x: 480, y: 255, w: 120, h: 45, color: '#fbbf24' },
  { id: 'p4', label: 'Partition 4', x: 480, y: 320, w: 120, h: 45, color: '#f97316' },
];

const KEYS = [
  { key: '"ACC-001"', hex: '0x7A4B21C3', result: 0, y: 65, color: '#38bdf8' },
  { key: '"ACC-002"', hex: '0x1D8F405A', result: 1, y: 130, color: '#34d399' },
  { key: '"ACC-001"', hex: '0x7A4B21C3', result: 0, y: 195, color: '#38bdf8', repeat: true },
  { key: '"ORDER-99"', hex: '0x82C3FD01', result: 2, y: 260, color: '#a78bfa' },
  { key: '"USER-X1"', hex: '0x3FA91B7C', result: 3, y: 325, color: '#fbbf24' },
];

export default function KafkaHashKeyPartitioningDiagram(): React.JSX.Element {
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Key-Based Hashing — MurmurHash2 Partitioning</span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Formula */}
        <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', textAlign: 'center' }}>
          <code style={{ fontSize: '13px', color: '#38bdf8' }}>partition = toPositive(murmur2(keyBytes)) % numPartitions</code>
          <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '5px' }}>Same key → same hash → same partition (guaranteed ordering per key)</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
          {/* SVG visualization */}
          <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
            <svg viewBox="0 0 620 390" style={{ width: '100%', height: 'auto' }}>
              <defs>
                {KEYS.map(k => (
                  <marker key={`${k.key}-${k.y}`} id={`hash-arr-${k.color.slice(1)}-${k.y}`} markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L7,3 z" fill={k.color} />
                  </marker>
                ))}
              </defs>

              {/* Column labels */}
              <text x="100" y="22" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600" opacity="0.7">PRODUCER KEYS</text>
              <text x="300" y="22" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="600" opacity="0.7">MURMUR2 HASH → % N</text>
              <text x="535" y="22" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="600" opacity="0.7">PARTITIONS (N=5)</text>

              {/* Key boxes */}
              {KEYS.map((k, i) => {
                const isSelected = selectedKey === i;
                return (
                  <g key={i} onClick={() => setSelectedKey(selectedKey === i ? null : i)} style={{ cursor: 'pointer' }}>
                    <rect x="10" y={k.y} width="130" height="35" rx="6"
                      fill={isSelected ? `${k.color}25` : `${k.color}12`}
                      stroke={k.color} strokeWidth={isSelected ? 2 : 1.2}
                      opacity={selectedKey !== null && !isSelected ? 0.25 : 1}
                      style={{ transition: 'all 0.25s ease' }} />
                    <text x="75" y={k.y + 13} textAnchor="middle" fill={k.color} fontSize="10.5" fontWeight="700"
                      opacity={selectedKey !== null && !isSelected ? 0.25 : 1}>
                      {k.key}
                    </text>
                    {k.repeat && (
                      <text x="75" y={k.y + 27} textAnchor="middle" fill={k.color} fontSize="9" opacity={selectedKey !== null && !isSelected ? 0.2 : 0.65}>
                        (same key as #1)
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Hash labels */}
              {KEYS.map((k, i) => {
                const isSelected = selectedKey === i;
                return (
                  <text key={i} x="240" y={k.y + 17} textAnchor="middle" fill={k.color} fontSize="9.5" fontFamily="monospace"
                    opacity={selectedKey !== null && !isSelected ? 0.15 : 0.8}
                    style={{ transition: 'opacity 0.25s ease' }}>
                    {k.hex} % 5 = {k.result}
                  </text>
                );
              })}

              {/* Arrows key → partition */}
              {KEYS.map((k, i) => {
                const isSelected = selectedKey === i;
                const targetP = PARTITIONS[k.result];
                return (
                  <line key={i} x1="150" y1={k.y + 17} x2="474" y2={targetP.y + 22}
                    stroke={k.color} strokeWidth={isSelected ? 2.5 : 1.2}
                    opacity={selectedKey !== null ? (isSelected ? 1 : 0.08) : 0.45}
                    strokeDasharray={k.repeat ? '5 3' : undefined}
                    markerEnd={`url(#hash-arr-${k.color.slice(1)}-${k.y})`}
                    style={{ transition: 'opacity 0.25s ease' }} />
                );
              })}

              {/* Partition boxes */}
              {PARTITIONS.map(p => (
                <g key={p.id}>
                  <rect x={p.x} y={p.y} width={p.w} height={p.h} rx="6"
                    fill={`${p.color}12`} stroke={p.color} strokeWidth="1.5" />
                  <text x={p.x + p.w / 2} y={p.y + 28} textAnchor="middle" fill={p.color} fontSize="11" fontWeight="700">{p.label}</text>
                </g>
              ))}
            </svg>
          </div>

          {/* Info panel */}
          <div>
            {selectedKey !== null ? (() => {
              const k = KEYS[selectedKey];
              const p = PARTITIONS[k.result];
              return (
                <div className="interactive-diagram-details-card details-cyan" style={{ transition: 'all 0.25s ease' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: k.color, marginBottom: '10px' }}>Key Routing Details</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { label: 'Key', val: k.key, color: k.color },
                      { label: 'murmur2(key)', val: k.hex, color: '#fbbf24' },
                      { label: 'toPositive(hash) % 5', val: `= ${k.result}`, color: '#fbbf24' },
                      { label: 'Assigned to', val: p.label, color: p.color },
                      { label: 'Ordering', val: k.repeat ? 'Same key → Same partition ✓' : 'Strictly ordered within partition', color: '#34d399' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px' }}>
                        <span style={{ color: 'var(--ifm-color-content-secondary)', minWidth: '140px', flexShrink: 0 }}>{row.label}:</span>
                        <code style={{ color: row.color, background: `${row.color}15`, borderRadius: '4px', padding: '1px 6px', fontSize: '11.5px' }}>{row.val}</code>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })() : (
              <div>
                <div className="interactive-diagram-details-card details-gray" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: '12px' }}>
                  <div className="interactive-diagram-helper-text" style={{ textAlign: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px', opacity: 0.4 }}>
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                    </svg>
                    <div>Click a producer key to trace its hash → partition routing</div>
                  </div>
                </div>
                {/* Key properties */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { icon: '✓', text: 'Same key always maps to same partition', color: '#34d399' },
                    { icon: '✓', text: 'Messages with same key are strictly ordered', color: '#34d399' },
                    { icon: '⚠', text: 'Hot key = hot partition (e.g. single userId)', color: '#fbbf24' },
                    { icon: '⚠', text: 'Adding partitions breaks existing assignments', color: '#fbbf24' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '7px 10px' }}>
                      <span style={{ color: item.color, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}