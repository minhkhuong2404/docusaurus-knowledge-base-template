import React, { useState } from 'react';

interface Structure {
  id: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  memoryFootprint: string;
  timeComplexity: string;
  commands: string;
  useCase: string;
}

const STRUCTURES: Structure[] = [
  {
    id: 'bitmaps',
    name: '1. Bitmaps (Bit Vectors)',
    badge: 'Bit-Level Flags',
    color: '#38bdf8',
    description: 'String bit-array operations allowing set, clear, and count operations on single bits. 1 million active daily users can be tracked in just 125 KB of RAM!',
    memoryFootprint: 'Ultra Compact: 1 bit per flag (100 million flags = ~12 MB RAM).',
    timeComplexity: 'O(1) for SETBIT / GETBIT; O(N) for BITCOUNT / BITOP.',
    commands: `SETBIT user:active:2026-07-31 1001 1\nGETBIT user:active:2026-07-31 1001\nBITCOUNT user:active:2026-07-31`,
    useCase: 'Daily active user (DAU) retention, feature flag tracking, binary user status.',
  },
  {
    id: 'hll',
    name: '2. HyperLogLog (HLL)',
    badge: 'Probabilistic Cardinality',
    color: '#34d399',
    description: 'Estimates the unique cardinality of billions of items with a fixed 0.81% standard error while using a constant 12 KB memory footprint.',
    memoryFootprint: 'Constant 12 KB regardless of 1,000 or 1,000,000,000 unique elements.',
    timeComplexity: 'O(1) to add (`PFADD`); O(1) to count (`PFCOUNT`).',
    commands: `PFADD unique:visitors "ip_192.168.1.1"\nPFCOUNT unique:visitors\nPFMERGE combined:visitors day1 day2`,
    useCase: 'Unique website visitors (UV), unique IP counts, search query cardinality.',
  },
  {
    id: 'geospatial',
    name: '3. Geospatial (GEO)',
    badge: 'Geohash Index',
    color: '#fbbf24',
    description: 'Encodes latitude and longitude coordinates into a 52-bit Geohash stored inside a Sorted Set (ZSet). Enables high-speed radius and distance queries.',
    memoryFootprint: 'Standard ZSet memory overhead (~100 bytes per coordinate node).',
    timeComplexity: 'O(log N + M) for radius queries (`GEORADIUS`).',
    commands: `GEOADD drivers 106.6297 10.8231 "driver_42"\nGEODIST drivers driver_42 driver_99 km\nGEOSEARCH drivers FROMMEMBER driver_42 BYRADIUS 5 km`,
    useCase: 'Ride-sharing driver locator (Uber/Grab), nearby store finder, delivery tracking.',
  },
  {
    id: 'bitfield',
    name: '4. Bitfields',
    badge: 'Arbitrary Bit Integers',
    color: '#c084fc',
    description: 'Allows setting, incrementing, and reading arbitrary bit-width integers (e.g. 5-bit unsigned integer, 16-bit signed integer) stored directly in a String.',
    memoryFootprint: 'Packed bit array memory layout without byte alignment waste.',
    timeComplexity: 'O(1) per bitfield sub-command.',
    commands: `BITFIELD player:100 SET u4 #0 15 OVERFLOW SAT\nBITFIELD player:100 INCRBY u4 #0 1`,
    useCase: 'Gaming player stats (HP, Level, Mana packed into 32 bits), compressed counter arrays.',
  },
];

export default function RedisAdvancedDataStructuresDiagram(): React.JSX.Element {
  const [selectedStructure, setSelectedStructure] = useState<Structure>(STRUCTURES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Advanced Data Structures: Bitmaps, HyperLogLog, Geospatial & Bitfields
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Structure Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {STRUCTURES.map((st) => {
            const isSelected = st.id === selectedStructure.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStructure(st)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${st.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {st.name}
              </button>
            );
          })}
        </div>

        {/* Selected Overview */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedStructure.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedStructure.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedStructure.color}22`, color: selectedStructure.color, fontWeight: 700 }}>
              {selectedStructure.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            {selectedStructure.description}
          </p>
        </div>

        {/* Grid Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Memory Footprint Efficiency
            </div>
            <div style={{ fontSize: '12.5px', color: selectedStructure.color, fontWeight: 700, marginBottom: '10px' }}>
              {selectedStructure.memoryFootprint}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Time Complexity
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '10px' }}>
              {selectedStructure.timeComplexity}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Production Use Cases
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedStructure.useCase}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '6px', fontWeight: 600 }}>
              CLI Commands & Code Example
            </div>
            <pre style={{ margin: 0, padding: '10px', backgroundColor: '#05070e', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)', lineHeight: 1.5 }}>
              <code>{selectedStructure.commands}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
