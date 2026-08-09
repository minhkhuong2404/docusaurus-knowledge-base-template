import React, { useState } from 'react';

const SCHEMA_COMPATIBILITY_MODES = [
  { mode: 'BACKWARD (Default)', desc: 'New schema can read data written by previous schema version. Deleting optional fields or adding new optional fields.' },
  { mode: 'FORWARD', desc: 'Previous schema version can read data written by new schema version. Adding optional fields or deleting fields.' },
  { mode: 'FULL', desc: 'Schemas are both backward and forward compatible. Only optional fields can be added or removed.' },
  { mode: 'NONE', desc: 'Schema compatibility checks disabled. Breaking changes permitted (risks consumer runtime serialization exceptions).' }
];

export default function KafkaSchemaRegistryDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'flow' | 'modes'>('flow');
  const [selectedModeIdx, setSelectedModeIdx] = useState<number>(0);

  const currMode = SCHEMA_COMPATIBILITY_MODES[selectedModeIdx];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .schema-registry-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Confluent Schema Registry (Avro / Protobuf / JSON Schema Serialization)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {[
            { id: 'flow', label: '🔄 5-Byte Wire Format & Schema ID Lookup Pipeline', color: '#a78bfa' },
            { id: 'modes', label: '🛡️ Schema Evolution Compatibility Modes (Backward/Forward)', color: '#34d399' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                flex: 1,
                minWidth: '160px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: activeTab === t.id ? `${t.color}20` : 'rgba(255,255,255,0.04)',
                color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Wire Format */}
        {activeTab === 'flow' && (
          <div className="schema-registry-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
            <div style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#a78bfa' }}>Byte 0: Magic Byte</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Always <code>0x00</code>. Identifies Confluent Schema Registry wire format.</div>
            </div>

            <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Bytes 1–4: Schema ID</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>4-byte big-endian integer schema ID (e.g. <code>SchemaId = 42</code>).</div>
            </div>

            <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399' }}>Bytes 5+: Binary Payload</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Avro binary encoded payload (no field names in payload &rarr; 90% bandwidth savings).</div>
            </div>

            <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', padding: '10px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>Consumer Cache</div>
              <div style={{ fontSize: '10.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '4px' }}>Consumer fetches Schema #42 once and caches schema definition in local memory.</div>
            </div>
          </div>
        )}

        {/* Tab 2: Compatibility Modes */}
        {activeTab === 'modes' && (
          <div className="schema-registry-grid" style={{ display: 'grid', gridTemplateColumns: '50% 50%', gap: '14px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {SCHEMA_COMPATIBILITY_MODES.map((m, idx) => {
                const isSel = idx === selectedModeIdx;
                return (
                  <div
                    key={m.mode}
                    onClick={() => setSelectedModeIdx(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isSel ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSel ? '#34d399' : 'rgba(255,255,255,0.08)'}`,
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isSel ? '#34d399' : 'var(--ifm-color-content)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {m.mode}
                  </div>
                );
              })}
            </div>

            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '220px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '6px' }}>
                COMPATIBILITY RULE SPECIFICATION
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '8px' }}>
                Mode: {currMode.mode}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
                {currMode.desc}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}