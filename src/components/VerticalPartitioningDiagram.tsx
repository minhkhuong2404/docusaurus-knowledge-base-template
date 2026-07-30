import React, { useState } from 'react';

export default function VerticalPartitioningDiagram(): React.JSX.Element {
  const [split, setSplit] = useState(false);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
        </svg>
        <span>Vertical Partitioning Mechanics</span>
        <button
          onClick={() => setSplit(!split)}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '12px',
            background: split ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
            color: split ? '#f87171' : '#34d399',
            boxShadow: `0 0 0 1.5px ${split ? '#f8717150' : '#34d39950'}`,
            transition: 'all 0.2s'
          }}
        >
          {split ? 'Merge Tables' : 'Split Vertically'}
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .vp-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="vp-layout-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Left Side: Visual Table Representation */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {!split ? (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--ifm-color-content-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                Single Wide Table (Before Split)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1.5fr 2.5fr 2.5fr', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '4px', fontWeight: 'bold', fontSize: '10px', color: '#38bdf8' }}>
                  <span>user_id</span>
                  <span>username</span>
                  <span>email</span>
                  <span>profile_bio</span>
                  <span>avatar_blob</span>
                </div>
                {[1, 2, 3].map(row => (
                  <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 1.5fr 2.5fr 2.5fr', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '6px', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>
                    <span>{row}</span>
                    <span>user_{row}</span>
                    <span>usr{row}@mail</span>
                    <span style={{ color: '#f97316' }}>{`"Senior Java Dev..."`}</span>
                    <span style={{ color: '#f87171' }}>{`0xFD29B8C...`}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Hot Table */}
              <div style={{ border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px', borderRadius: '8px', background: 'rgba(52, 211, 153, 0.04)' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#34d399', marginBottom: '6px', textTransform: 'uppercase' }}>
                  🔥 Table A: User Credentials (Hot Table)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '3px', fontWeight: 'bold', fontSize: '9px', color: '#34d399' }}>
                    <span>user_id</span>
                    <span>username</span>
                    <span>email</span>
                  </div>
                  {[1, 2, 3].map(row => (
                    <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>
                      <span>{row}</span>
                      <span>user_{row}</span>
                      <span>usr{row}@mail</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cold Table */}
              <div style={{ border: '1px solid rgba(167, 139, 250, 0.3)', padding: '10px', borderRadius: '8px', background: 'rgba(167, 139, 250, 0.04)' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', marginBottom: '6px', textTransform: 'uppercase' }}>
                  ❄️ Table B: User Profile Assets (Cold Table)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 2.5fr', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '3px', fontWeight: 'bold', fontSize: '9px', color: '#a78bfa' }}>
                    <span>user_id</span>
                    <span>profile_bio</span>
                    <span>avatar_blob</span>
                  </div>
                  {[1, 2, 3].map(row => (
                    <div key={row} style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.5fr 2.5fr', gap: '4px', background: 'rgba(0,0,0,0.15)', padding: '4px', borderRadius: '3px', fontSize: '9px', fontFamily: 'monospace', color: 'var(--ifm-color-content-secondary)' }}>
                      <span>{row}</span>
                      <span style={{ color: '#f97316' }}>{`"Senior Java Dev..."`}</span>
                      <span style={{ color: '#f87171' }}>{`0xFD29B8C...`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Sizing / Performance details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: split ? '#34d399' : '#38bdf8' }}>
          {!split ? (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '6px' }}>
                ⚠️ Performance Limitation (Wide Table)
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**Row Size Bloat**: Reading rows loads the massive `profile_bio` text and `avatar_blob` binary data into memory.</li>
                <li>**Cache Pollution**: Fewer rows fit in the database buffer pool page, increasing disk I/O reads.</li>
                <li>**Memory consumption**: 1,000 login query records pull ~25MB of unused binary chunks into memory page caches.</li>
              </ul>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#34d399', marginBottom: '6px' }}>
                🚀 Optimization Accomplished (Split Tables)
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--ifm-color-content)' }}>
                <li>**High Cache Locality**: The Hot Table has small row sizes. Up to 10x more records fit in the database memory pages.</li>
                <li>**Selective Fetching**: Queries only fetch profile blobs and bios when the user explicitly clicks the profile settings tab.</li>
                <li>**Reduced RAM Footprint**: 1,000 query records now consume less than 150KB of page memory, freeing server allocations.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
