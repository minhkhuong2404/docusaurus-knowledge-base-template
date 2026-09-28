import React, { useState } from 'react';

type SchemaType = 'star' | 'snowflake';

export default function StarVsSnowflakeSchemaDiagram(): React.JSX.Element {
  const [schemaType, setSchemaType] = useState<SchemaType>('star');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Data Warehousing Schemas: Star vs. Snowflake Architecture
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setSchemaType('star')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${schemaType === 'star' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
              background: schemaType === 'star' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.04)',
              color: schemaType === 'star' ? '#fbbf24' : 'var(--ifm-color-content-secondary)',
              fontWeight: schemaType === 'star' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ⭐ Star Schema (1-Hop Joins)
          </button>
          <button
            onClick={() => setSchemaType('snowflake')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              border: `1px solid ${schemaType === 'snowflake' ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
              background: schemaType === 'snowflake' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.04)',
              color: schemaType === 'snowflake' ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              fontWeight: schemaType === 'snowflake' ? 700 : 500,
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
          >
            ❄️ Snowflake Schema (Normalized)
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          {schemaType === 'star' ? (
            <svg viewBox="0 0 760 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="star-gold" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
              </defs>

              {/* Central Fact Table */}
              <g transform="translate(290, 80)">
                <rect width="180" height="140" rx="8" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="2" />
                <text x="90" y="24" textAnchor="middle" fill="#fef08a" fontSize="13" fontWeight="800">📊 fact_sales</text>
                <line x1="0" y1="34" x2="180" y2="34" stroke="#fbbf24" strokeWidth="1" />
                <text x="14" y="52" fill="#cbd5e1" fontSize="9.5" fontFamily="monospace">sale_id PK</text>
                <text x="14" y="68" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">date_key FK</text>
                <text x="14" y="84" fill="#34d399" fontSize="9.5" fontFamily="monospace">customer_key FK</text>
                <text x="14" y="100" fill="#a78bfa" fontSize="9.5" fontFamily="monospace">product_key FK</text>
                <text x="14" y="116" fill="#f87171" fontSize="9.5" fontFamily="monospace">store_key FK</text>
                <text x="14" y="132" fill="#e2e8f0" fontSize="9.5" fontWeight="700">revenue, qty, discount</text>
              </g>

              {/* Top Dimension: Date */}
              <g transform="translate(300, 10)">
                <rect width="160" height="48" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="80" y="20" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="700">📅 dim_date</text>
                <text x="80" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8.5">date_key PK, year, month</text>
              </g>

              {/* Left Dimension: Customer */}
              <g transform="translate(40, 115)">
                <rect width="170" height="65" rx="6" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="85" y="22" textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="700">👤 dim_customer</text>
                <text x="85" y="40" textAnchor="middle" fill="#94a3b8" fontSize="8.5">customer_key PK, name</text>
                <text x="85" y="54" textAnchor="middle" fill="#86efac" fontSize="8">Denormalized (city, state, country)</text>
              </g>

              {/* Right Dimension: Product */}
              <g transform="translate(550, 115)">
                <rect width="170" height="65" rx="6" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="85" y="22" textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700">📦 dim_product</text>
                <text x="85" y="40" textAnchor="middle" fill="#94a3b8" fontSize="8.5">product_key PK, name, SKU</text>
                <text x="85" y="54" textAnchor="middle" fill="#c4b5fd" fontSize="8">Denormalized (category, dept)</text>
              </g>

              {/* Bottom Dimension: Store */}
              <g transform="translate(300, 240)">
                <rect width="160" height="48" rx="6" fill="rgba(248, 113, 113, 0.12)" stroke="#f87171" strokeWidth="1.5" />
                <text x="80" y="20" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="700">🏬 dim_store</text>
                <text x="80" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8.5">store_key PK, city, region</text>
              </g>

              {/* Flow Arrows into Fact Table */}
              <path d="M 380 58 L 380 75" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#star-gold)" className="interactive-diagram-flowing-path" />
              <path d="M 210 148 L 282 148" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#star-gold)" className="interactive-diagram-flowing-path" />
              <path d="M 550 148 L 478 148" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#star-gold)" className="interactive-diagram-flowing-path" />
              <path d="M 380 240 L 380 225" fill="none" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#star-gold)" className="interactive-diagram-flowing-path" />
            </svg>
          ) : (
            <svg viewBox="0 0 760 300" style={{ width: '100%', height: 'auto', display: 'block' }}>
              <defs>
                <marker id="snow-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
              </defs>

              {/* Central Fact Table */}
              <g transform="translate(290, 85)">
                <rect width="180" height="130" rx="8" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="2" />
                <text x="90" y="24" textAnchor="middle" fill="#fef08a" fontSize="13" fontWeight="800">📊 fact_sales</text>
                <line x1="0" y1="34" x2="180" y2="34" stroke="#fbbf24" strokeWidth="1" />
                <text x="14" y="54" fill="#38bdf8" fontSize="9.5" fontFamily="monospace">date_key FK</text>
                <text x="14" y="72" fill="#34d399" fontSize="9.5" fontFamily="monospace">customer_key FK</text>
                <text x="14" y="90" fill="#a78bfa" fontSize="9.5" fontFamily="monospace">product_key FK</text>
                <text x="14" y="112" fill="#e2e8f0" fontSize="9.5" fontWeight="700">revenue, qty, discount</text>
              </g>

              {/* Normalized Customer Chain (Left) */}
              <g transform="translate(145, 120)">
                <rect width="115" height="50" rx="5" fill="rgba(52, 211, 153, 0.12)" stroke="#34d399" strokeWidth="1.5" />
                <text x="57" y="20" textAnchor="middle" fill="#34d399" fontSize="10" fontWeight="700">dim_customer</text>
                <text x="57" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8">city_id FK</text>
              </g>

              <g transform="translate(10, 120)">
                <rect width="105" height="50" rx="5" fill="rgba(52, 211, 153, 0.08)" stroke="#34d399" strokeWidth="1" strokeDasharray="3 2" />
                <text x="52" y="20" textAnchor="middle" fill="#86efac" fontSize="9.5" fontWeight="700">dim_city</text>
                <text x="52" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8">country_id FK</text>
              </g>

              {/* Normalized Product Chain (Right) */}
              <g transform="translate(500, 120)">
                <rect width="115" height="50" rx="5" fill="rgba(167, 139, 250, 0.12)" stroke="#a78bfa" strokeWidth="1.5" />
                <text x="57" y="20" textAnchor="middle" fill="#a78bfa" fontSize="10" fontWeight="700">dim_product</text>
                <text x="57" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8">category_id FK</text>
              </g>

              <g transform="translate(645, 120)">
                <rect width="105" height="50" rx="5" fill="rgba(167, 139, 250, 0.08)" stroke="#a78bfa" strokeWidth="1" strokeDasharray="3 2" />
                <text x="52" y="20" textAnchor="middle" fill="#c4b5fd" fontSize="9.5" fontWeight="700">dim_category</text>
                <text x="52" y="36" textAnchor="middle" fill="#94a3b8" fontSize="8">dept_id FK</text>
              </g>

              {/* Normalized Chains */}
              <path d="M 115 145 L 140 145" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#snow-blue)" />
              <path d="M 260 145 L 284 145" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#snow-blue)" className="interactive-diagram-flowing-path" />
              <path d="M 645 145 L 620 145" fill="none" stroke="#38bdf8" strokeWidth="1.5" markerEnd="url(#snow-blue)" />
              <path d="M 500 145 L 476 145" fill="none" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#snow-blue)" className="interactive-diagram-flowing-path" />
            </svg>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <strong style={{ color: '#fbbf24', fontSize: '11px' }}>Star Schema (Fastest OLAP):</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Denormalized dimension tables allow direct 1-hop joins to the central fact table. Maximizes query performance and BI tool compatibility at the cost of some duplicate strings.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <strong style={{ color: '#38bdf8', fontSize: '11px' }}>Snowflake Schema (Zero Redundancy):</strong>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              Dimensions are normalized into third normal form (3NF). Saves disk storage and eliminates update anomalies, but queries require complex multi-hop joins across hierarchies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
