import React, { useState } from 'react';

export default function BloomFilterVisualRepresentationDiagram(): React.JSX.Element {
  const [showApple, setShowApple] = useState(true);
  const [showBanana, setShowBanana] = useState(false);
  const [showCherry, setShowCherry] = useState(false);

  const appleBits = [1, 4, 7];
  const bananaBits = [2, 5, 8];
  const cherryBits = [1, 5, 9];

  const bitArraySize = 10;
  const bitArray = Array.from({ length: bitArraySize }, (_, idx) => {
    const appleHas = showApple && appleBits.includes(idx);
    const bananaHas = showBanana && bananaBits.includes(idx);
    const cherryHas = showCherry && cherryBits.includes(idx);
    const totalSet = [appleHas, bananaHas, cherryHas].filter(Boolean).length;

    return {
      index: idx,
      appleHas,
      bananaHas,
      cherryHas,
      totalSet
    };
  });

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span>Bloom Filter Array: Overlapping Bit Allocations</span>
      </div>

      {/* Checkbox selectors */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px', background: 'rgba(255,255,255,0.02)', padding: '10px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#34d399' }}>
          <input type="checkbox" checked={showApple} onChange={e => setShowApple(e.target.checked)} />
          Show "apple" mapping [1, 4, 7]
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#38bdf8' }}>
          <input type="checkbox" checked={showBanana} onChange={e => setShowBanana(e.target.checked)} />
          Show "banana" mapping [2, 5, 8]
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#a78bfa' }}>
          <input type="checkbox" checked={showCherry} onChange={e => setShowCherry(e.target.checked)} />
          Show "cherry" mapping [1, 5, 9]
        </label>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .bfv-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      <div className="bfv-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px', alignItems: 'start' }}>
        {/* Array display */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '24px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {bitArray.map(bit => {
              // Decide background color and border based on who has it
              let border = 'rgba(255, 255, 255, 0.15)';
              let bg = 'rgba(0, 0, 0, 0.15)';
              let glow = 'none';

              if (bit.totalSet === 1) {
                if (bit.appleHas) { border = '#34d399'; bg = 'rgba(52, 211, 153, 0.08)'; }
                if (bit.bananaHas) { border = '#38bdf8'; bg = 'rgba(56, 189, 248, 0.08)'; }
                if (bit.cherryHas) { border = '#a78bfa'; bg = 'rgba(167, 139, 250, 0.08)'; }
              } else if (bit.totalSet > 1) {
                // Multi-overlap (Collision point)
                border = '#fbbf24';
                bg = 'rgba(251, 191, 36, 0.15)';
                glow = '0 0 8px rgba(251, 191, 36, 0.2)';
              }

              return (
                <div
                  key={bit.index}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: `2.5px solid ${border}`,
                    background: bg,
                    boxShadow: glow,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: bit.totalSet > 0 ? 'var(--ifm-color-content)' : 'var(--ifm-color-content-secondary)',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  {bit.index}
                  {bit.totalSet > 1 && (
                    <span style={{ fontSize: '5.5px', color: '#fbbf24', position: 'absolute', bottom: '-12px', fontWeight: 'bold' }}>
                      Overlap
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Details */}
        <div className="interactive-diagram-details-card" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ifm-color-content)' }}>
              🔎 Hash Overlap & Collisions
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.45' }}>
            Toggle multiple checkboxes to observe how bits overlap:
            <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
              <li><strong>Index 1:</strong> Shared between <strong>"apple"</strong> and <strong>"cherry"</strong>.</li>
              <li><strong>Index 5:</strong> Shared between <strong>"banana"</strong> and <strong>"cherry"</strong>.</li>
            </ul>
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
              If "apple" [1, 4, 7] and "banana" [2, 5, 8] are inserted:
              <br />
              Indices [1, 2, 4, 5, 7, 8] are set to 1.
              <br />
              A test for uninserted "cherry" [1, 5, 9] checks bits 1, 5, 9. Since index 9 is still 0, the query safely misses.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
