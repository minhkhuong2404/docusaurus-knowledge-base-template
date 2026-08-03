import React, { useState } from 'react';

const KAFKA_SCHEMAS = [
  {
    id: 'record_batch',
    name: '1. Kafka RecordBatch v2 Binary Layout (61 Bytes Overhead)',
    spec: `BaseOffset      => Int64 (8 bytes)   - First offset in batch
BatchLength     => Int32 (4 bytes)   - Total byte size of batch
PartitionLeader => Int32 (4 bytes)   - Leader epoch
Magic           => Int8  (1 byte)    - Magic byte (0x02 for v2)
CRC             => Int32 (4 bytes)   - CRC32C checksum
Attributes      => Int16 (2 bytes)   - Compression (gzip/snappy/lz4/zstd), TimestampType
LastOffsetDelta => Int32 (4 bytes)   - Difference between last & base offset
FirstTimestamp  => Int64 (8 bytes)   - Timestamp of first record
MaxTimestamp    => Int64 (8 bytes)   - Max timestamp in batch
ProducerId      => Int64 (8 bytes)   - PID for idempotency / transactions
ProducerEpoch   => Int16 (2 bytes)   - Epoch for PID fence
BaseSequence    => Int32 (4 bytes)   - Sequence number for deduplication
RecordsArray    => Array[Record]     - Compact array of compressed records`,
    fields: [
      { name: 'BaseOffset', type: 'Int64 (8B)', desc: 'Starting logical offset assigned by broker to first record in batch.' },
      { name: 'Magic Byte', type: 'Int8 (1B)', desc: 'Format version flag. 0x02 indicates Kafka 0.11+ RecordBatch format.' },
      { name: 'CRC32C', type: 'Int32 (4B)', desc: 'Checksum verifying batch data integrity on disk and over wire.' },
      { name: 'ProducerId & Seq', type: 'Int64 + Int32', desc: 'Enables strict exactly-once idempotent deduplication at broker.' }
    ]
  },
  {
    id: 'index_entry',
    name: '2. Kafka Offset Index File (.index) 8-Byte Entry',
    spec: `RelativeOffset => Int32 (4 bytes) - Offset relative to base offset (Offset - BaseOffset)
PhysicalPosition=> Int32 (4 bytes) - Absolute byte position in .log file

Example Index Entry #42:
  RelativeOffset: 0x00000100 (256) -> Absolute Offset = 1000 + 256 = 1256
  Position:       0x0001A400 (107520 bytes into .log file)`,
    fields: [
      { name: 'RelativeOffset', type: 'Int32 (4B)', desc: 'Saves 50% index space compared to 8-byte absolute offset.' },
      { name: 'PhysicalPosition', type: 'Int32 (4B)', desc: 'Allows O(1) OS sendfile seek directly into disk log segment.' }
    ]
  }
];

export default function KafkaMonospaceSchemaInspector(): React.JSX.Element {
  const [selectedSchemaIdx, setSelectedSchemaIdx] = useState<number>(0);
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number>(0);

  const currSchema = KAFKA_SCHEMAS[selectedSchemaIdx];
  const currField = currSchema.fields[selectedFieldIdx] || currSchema.fields[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`
        @media (max-width: 768px) {
          .kafka-schema-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Monospace Binary Schema & Segment Index Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Schema Switcher Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {KAFKA_SCHEMAS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => { setSelectedSchemaIdx(idx); setSelectedFieldIdx(0); }}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                background: selectedSchemaIdx === idx ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.04)',
                color: selectedSchemaIdx === idx ? '#34d399' : 'var(--ifm-color-content-secondary)',
                boxShadow: selectedSchemaIdx === idx ? '0 0 0 1.5px #34d399' : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Main Monospace Inspector Grid */}
        <div className="kafka-schema-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '14px', alignItems: 'start' }}>
          {/* Monospace Code View */}
          <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '12px', overflowX: 'auto' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
              BINARY SPECIFICATION LAYOUT (MONOSPACE)
            </div>
            <pre style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: '11px', color: '#e2e8f0', lineHeight: 1.45, margin: 0, background: 'transparent' }}>
              {currSchema.spec}
            </pre>
          </div>

          {/* Interactive Field Inspector Panel */}
          <div className="interactive-diagram-details-card details-green" style={{ minHeight: '260px' }}>
            <div style={{ fontSize: '10px', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              FIELD STRUCTURE INSPECTOR
            </div>

            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {currSchema.fields.map((f, idx) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFieldIdx(idx)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    background: selectedFieldIdx === idx ? '#34d399' : 'rgba(255,255,255,0.06)',
                    color: selectedFieldIdx === idx ? '#090b14' : 'var(--ifm-color-content)'
                  }}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--ifm-color-content)', marginBottom: '4px' }}>
              {currField.name}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '8px' }}>
              Byte Size: {currField.type}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: 0 }}>
              {currField.desc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
