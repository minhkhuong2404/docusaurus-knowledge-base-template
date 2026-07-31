import React, { useState } from 'react';

export default function RedisSkipListDiagram(): React.JSX.Element {
  const [selectedMember, setSelectedMember] = useState<string>('carol');

  const members = [
    { name: 'alice', score: 1500, level3: true, level2: true, level1: true },
    { name: 'dave', score: 1750, level3: false, level2: false, level1: true },
    { name: 'carol', score: 1900, level3: false, level2: true, level1: true },
    { name: 'eve', score: 2100, level3: false, level2: false, level1: true },
    { name: 'bob', score: 2300, level3: true, level2: true, level1: true },
  ];

  const current = members.find((m) => m.name === selectedMember) || members[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Sorted Set Dual Structure: Skip List (Range O(log N)) + Hash Table (Lookup O(1))
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {members.map((m) => {
            const isSelected = m.name === selectedMember;
            return (
              <button
                key={m.name}
                onClick={() => setSelectedMember(m.name)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {m.name} (Score: {m.score})
              </button>
            );
          })}
        </div>

        {/* Skip List Express Lanes Visualizer */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px', fontWeight: 600 }}>
            Skip List Multilevel Express Lanes (O(log N) Traversal)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Level 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, width: '60px' }}>Level 3:</span>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', fontSize: '11px', color: '#fbbf24' }}>HEAD</span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>──────────────────────────────►</span>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: selectedMember === 'alice' ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }}>alice (1500)</span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>──────────────────────────────►</span>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: selectedMember === 'bob' ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }}>bob (2300)</span>
              </div>
            </div>

            {/* Level 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, width: '60px' }}>Level 2:</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', fontSize: '11px', color: '#38bdf8' }}>HEAD</span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>────────►</span>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: selectedMember === 'alice' ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }}>alice</span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>────────►</span>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: selectedMember === 'carol' ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }}>carol (1900)</span>
                <span style={{ color: 'var(--ifm-color-content-secondary)' }}>────────►</span>
                <span style={{ padding: '4px 10px', borderRadius: '4px', backgroundColor: selectedMember === 'bob' ? '#38bdf8' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff' }}>bob</span>
              </div>
            </div>

            {/* Level 1 (Full list) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, width: '60px' }}>Level 1:</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(52, 211, 153, 0.2)', border: '1px solid #34d399', fontSize: '11px', color: '#34d399' }}>HEAD</span>
                ➔
                {members.map((m) => (
                  <span
                    key={m.name}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: m.name === selectedMember ? '#34d399' : 'rgba(255,255,255,0.05)',
                      color: m.name === selectedMember ? '#000' : 'var(--ifm-color-content)',
                      fontSize: '11px',
                      fontWeight: m.name === selectedMember ? 700 : 400,
                    }}
                  >
                    {m.name}: {m.score}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dual Lookup Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Hash Table Lookup (`ZSCORE {current.name}`)
            </div>
            <div style={{ fontSize: '13px', color: '#34d399', fontWeight: 700, fontFamily: 'monospace' }}>
              O(1) Instant Lookup → Score: {current.score}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Skip List Traversal (`ZRANK / ZRANGE`)
            </div>
            <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
              O(log N) Traversal via Express Lanes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
