import React, { useState } from 'react';

type GeoTab = 'hilbert' | 'h3_hexagons';

export default function GeospatialIndexingDiagram({ initialTab = 'hilbert' }: { initialTab?: GeoTab }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<GeoTab>(initialTab);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [h3Ring, setH3Ring] = useState<number>(1);

  // 4x4 Hilbert Grid Mapping
  const HILBERT_GRID = [
    [0, 1, 14, 15],
    [3, 2, 13, 12],
    [4, 7, 8, 11],
    [5, 6, 9, 10]
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Geospatial Space-Filling Curves & Hexagonal Tiling (Uber H3)
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {[
            { id: 'hilbert', label: '📐 2D ➔ 1D Hilbert Curve', color: '#38bdf8' },
            { id: 'h3_hexagons', label: '⬡ Square vs H3 Hexagon', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as GeoTab)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: `1px solid ${activeTab === t.id ? t.color : 'rgba(255,255,255,0.1)'}`,
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: activeTab === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* TAB 1: HILBERT SPACE-FILLING CURVE */}
        {activeTab === 'hilbert' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 260" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <marker id="geo-arr" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                    <path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Left 4x4 Grid with continuous Hilbert path */}
                <g transform="translate(60, 20)">
                  <text x="110" y="0" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">
                    2D Coordinate Grid (x, y)
                  </text>

                  {/* 4x4 Grid Cells */}
                  {HILBERT_GRID.map((row, rIdx) =>
                    row.map((val, cIdx) => {
                      const isHovered = activeCell === val;
                      return (
                        <g key={val} transform={`translate(${cIdx * 54}, ${rIdx * 54 + 10})`} onClick={() => setActiveCell(val)} style={{ cursor: 'pointer' }}>
                          <rect
                            width="50"
                            height="50"
                            rx="6"
                            fill={isHovered ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.85)'}
                            stroke={isHovered ? '#38bdf8' : 'rgba(56, 189, 248, 0.3)'}
                            strokeWidth={isHovered ? '2' : '1'}
                          />
                          <text x="25" y="32" textAnchor="middle" fill={isHovered ? '#38bdf8' : '#e2e8f0'} fontSize="14" fontWeight="800">
                            {val}
                          </text>
                        </g>
                      );
                    })
                  )}

                  {/* Continuous Hilbert Curve Path */}
                  <path
                    d="M 25 35 L 79 35 L 79 89 L 25 89 L 25 143 L 79 143 L 79 197 L 25 197 L 25 197 M 79 197 L 133 197 L 133 143 L 187 143 L 187 197 L 187 143 M 133 143 L 133 89 L 187 89 L 187 35 L 133 35"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    className="interactive-diagram-flowing-path"
                  />
                </g>

                {/* Right: 1D B-Tree Index Projection */}
                <g transform="translate(380, 20)">
                  <text x="160" y="0" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
                    1D B-Tree Continuous Index (Range Scan)
                  </text>

                  {/* 1D Strip */}
                  <rect x="0" y="25" width="320" height="45" rx="8" fill="rgba(52, 211, 153, 0.1)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="160" y="52" textAnchor="middle" fill="#86efac" fontSize="11" fontWeight="700">
                    [0] ➔ [1] ➔ [2] ➔ [3] ➔ [4] ➔ ... ➔ [15]
                  </text>

                  {/* Range scan demonstration */}
                  <g transform="translate(0, 95)">
                    <rect x="0" y="0" width="320" height="120" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255,255,255,0.08)" />
                    <text x="16" y="24" fill="#38bdf8" fontSize="11" fontWeight="700">How B-Tree Queries 2D Proximity:</text>
                    <text x="16" y="46" fill="#cbd5e1" fontSize="9.5">1. Target point (e.g. Cell 7) maps to 1D index 7.</text>
                    <text x="16" y="66" fill="#cbd5e1" fontSize="9.5">2. Neighbor points [4, 6, 8] are clustered in 1D sequence.</text>
                    <text x="16" y="86" fill="#34d399" fontSize="9.5" fontWeight="700">3. Standard SQL: SELECT * FROM points</text>
                    <text x="32" y="104" fill="#34d399" fontSize="9" fontFamily="monospace">WHERE hilbert_id BETWEEN 4 AND 8;</text>
                  </g>
                </g>
              </svg>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
              💡 <strong>The Space-Filling Curve Advantage:</strong> Transforms complex 2-dimensional geometric bounding-box joins into a fast <strong>single-dimensional B-Tree index scan</strong>. Nearby physical points on Earth map to contiguous integer ranges in standard databases (PostgreSQL, MySQL, Cassandra).
            </div>
          </div>
        )}

        {/* TAB 2: SQUARE VS H3 HEXAGON */}
        {activeTab === 'h3_hexagons' && (
          <div>
            <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <svg viewBox="0 0 760 250" style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Left: Square Grid Distortion */}
                <g transform="translate(60, 25)">
                  <text x="120" y="0" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="700">
                    ❌ Square Grid (Distance Distortion)
                  </text>

                  {/* 3x3 Square Matrix */}
                  <g transform="translate(45, 20)">
                    {[0, 1, 2].map(r =>
                      [0, 1, 2].map(c => {
                        const isCenter = r === 1 && c === 1;
                        return (
                          <rect
                            key={`${r}-${c}`}
                            x={c * 50}
                            y={r * 50}
                            width="48"
                            height="48"
                            rx="4"
                            fill={isCenter ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.02)'}
                            stroke={isCenter ? '#38bdf8' : 'rgba(255,255,255,0.1)'}
                          />
                        );
                      })
                    )}
                    <text x="74" y="79" textAnchor="middle" fill="#38bdf8" fontSize="14" fontWeight="800">✦</text>

                    {/* Edge distance line (1.0) */}
                    <line x1="74" y1="74" x2="74" y2="24" stroke="#34d399" strokeWidth="2" />
                    <text x="80" y="52" fill="#34d399" fontSize="9" fontWeight="700">1.0</text>

                    {/* Corner distance line (1.414) */}
                    <line x1="74" y1="74" x2="24" y2="24" stroke="#f87171" strokeWidth="2" strokeDasharray="2 2" />
                    <text x="32" y="58" fill="#f87171" fontSize="9" fontWeight="700">1.414</text>
                  </g>

                  <text x="120" y="195" textAnchor="middle" fill="#fca5a5" fontSize="10">
                    Corner neighbor is 41.4% farther than edge!
                  </text>
                  <text x="120" y="210" textAnchor="middle" fill="#94a3b8" fontSize="9">
                    Causes distortion in radial proximity queries
                  </text>
                </g>

                {/* Right: Uber H3 Hexagonal Uniformity */}
                <g transform="translate(440, 25)">
                  <text x="120" y="0" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">
                    ✅ Uber H3 Hexagonal Grid (Equidistant)
                  </text>

                  {/* Hexagon Cluster */}
                  <g transform="translate(120, 95)">
                    {/* Center Hexagon */}
                    <polygon
                      points="0,-30 26,-15 26,15 0,30 -26,15 -26,-15"
                      fill="rgba(56, 189, 248, 0.3)"
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    <text x="0" y="5" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="800">✦</text>

                    {/* 6 Equidistant Neighbor Hexagons */}
                    {[
                      { angle: 0, x: 0, y: -52 },
                      { angle: 60, x: 45, y: -26 },
                      { angle: 120, x: 45, y: 26 },
                      { angle: 180, x: 0, y: 52 },
                      { angle: 240, x: -45, y: 26 },
                      { angle: 300, x: -45, y: -26 },
                    ].map((h, i) => (
                      <g key={i} transform={`translate(${h.x}, ${h.y})`}>
                        <polygon
                          points="0,-28 24,-14 24,14 0,28 -24,14 -24,-14"
                          fill="rgba(52, 211, 153, 0.12)"
                          stroke="#34d399"
                          strokeWidth="1.5"
                        />
                        <text x="0" y="4" textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="700">
                          1.0
                        </text>
                      </g>
                    ))}
                  </g>

                  <text x="120" y="195" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="700">
                    All 6 neighbors are strictly equidistant (1.0)
                  </text>
                  <text x="120" y="210" textAnchor="middle" fill="#94a3b8" fontSize="9">
                    Enables invariant, circular concentric ring expansion
                  </text>
                </g>
              </svg>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(248, 113, 113, 0.08)', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
                <strong style={{ color: '#f87171', fontSize: '11px' }}>Square Grid Flaw:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Diagonal cells share only a vertex, introducing <code>√2 ≈ 1.414</code> distance variance. Searching adjacent squares creates an irregular search boundary with distorted edge buffers.
                </p>
              </div>

              <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.08)', borderRadius: '6px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                <strong style={{ color: '#34d399', fontSize: '11px' }}>Uber H3 Uniform Rings:</strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
                  Every adjacent hexagon shares an entire edge of identical length. <code>kRing(1)</code> always yields 6 equal neighbors, and <code>kRing(2)</code> adds 12 more, approximating a perfect geometric circle.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
