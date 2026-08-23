import React, { useState } from 'react';

interface RecordBatchField {
  name: string;
  bytes: string;
  type: string;
  desc: string;
  role: string;
  color: string;
}

export default function KafkaRecordBatchIndexDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'batch' | 'index' | 'flow'>('batch');
  const [selectedFieldIdx, setSelectedFieldIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<number>(1256);

  const batchFields: RecordBatchField[] = [
    { name: 'BaseOffset', bytes: '8 Bytes', type: 'Int64', desc: 'Starting logical offset assigned by broker to the first record in this batch.', role: 'Logical Addressing', color: '#38bdf8' },
    { name: 'BatchLength', bytes: '4 Bytes', type: 'Int32', desc: 'Total byte size of the batch (excluding BaseOffset and BatchLength itself).', role: 'Framing & Slicing', color: '#38bdf8' },
    { name: 'PartitionLeaderEpoch', bytes: '4 Bytes', type: 'Int32', desc: 'Leader epoch counter to fence stale leader writes and prevent log truncation anomalies.', role: 'KRaft/ZK Quorum Fencing', color: '#fbbf24' },
    { name: 'MagicByte', bytes: '1 Byte', type: 'Int8 (0x02)', desc: 'Format version flag. 0x02 indicates Kafka 0.11+ RecordBatch format with batch header compression.', role: 'Schema Versioning', color: '#34d399' },
    { name: 'CRC32C', bytes: '4 Bytes', type: 'Int32', desc: 'Castagnoli polynomial CRC checksum covering from Attributes to the end of the batch.', role: 'Disk & Wire Integrity', color: '#34d399' },
    { name: 'Attributes', bytes: '2 Bytes', type: 'Int16', desc: 'Bitmask encoding compression codec (0=None, 1=GZIP, 2=Snappy, 3=LZ4, 4=zstd) and TimestampType.', role: 'Codec & Semantics', color: '#a78bfa' },
    { name: 'LastOffsetDelta', bytes: '4 Bytes', type: 'Int32', desc: 'Difference between the last record offset and BaseOffset: LastOffset = BaseOffset + LastOffsetDelta.', role: 'Offset Computation', color: '#38bdf8' },
    { name: 'FirstTimestamp', bytes: '8 Bytes', type: 'Int64 (Epoch ms)', desc: 'Creation or LogAppend timestamp of the first record in the batch.', role: 'Time-Indexed Querying', color: '#2dd4bf' },
    { name: 'MaxTimestamp', bytes: '8 Bytes', type: 'Int64 (Epoch ms)', desc: 'Maximum timestamp across all records, used for log retention time rollouts and .timeindex.', role: 'Retention Cleanup', color: '#2dd4bf' },
    { name: 'ProducerId (PID)', bytes: '8 Bytes', type: 'Int64', desc: 'Unique Producer ID allocated by Transaction Coordinator for exactly-once idempotency.', role: 'Idempotency Gate', color: '#f87171' },
    { name: 'ProducerEpoch', bytes: '2 Bytes', type: 'Int16', desc: 'Epoch counter incremented on producer initialization to fence zombie producers.', role: 'Zombie Producer Fencing', color: '#f87171' },
    { name: 'BaseSequence', bytes: '4 Bytes', type: 'Int32', desc: 'Starting sequence number of the first record. Broker validates seq = lastSeq + 1 to prevent duplicates.', role: 'Deduplication Contract', color: '#f87171' },
    { name: 'Records Array', bytes: 'Variable', type: 'Compact Array', desc: 'Compressed inner payload containing varint-encoded individual records.', role: 'Payload Storage', color: '#34d399' }
  ];

  const currentField = batchFields[selectedFieldIdx];

  // Index calculation demo
  const baseOffset = 1000;
  const relativeOffset = Math.max(0, searchQuery - baseOffset);
  const estimatedPhysicalPos = 107520 + (relativeOffset * 420);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Kafka Binary RecordBatch (v2) &amp; Memory Offset Index Architecture
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setActiveTab('batch')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'batch' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'batch' ? '#34d39918' : 'transparent',
              color: activeTab === 'batch' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            RecordBatch Layout (61B)
          </button>
          <button
            onClick={() => setActiveTab('index')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'index' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'index' ? '#34d39918' : 'transparent',
              color: activeTab === 'index' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            .index 8-Byte Entry
          </button>
          <button
            onClick={() => setActiveTab('flow')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'flow' ? '1px solid #34d39950' : '1px solid transparent',
              background: activeTab === 'flow' ? '#34d39918' : 'transparent',
              color: activeTab === 'flow' ? '#34d399' : 'var(--ifm-color-content-secondary)'
            }}
          >
            Zero-Copy Read Path
          </button>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tab 1: RecordBatch v2 Binary Layout */}
        {activeTab === 'batch' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '55% 45%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: Interactive Memory Field Map */}
              <div style={{
                background: '#090b14',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', marginBottom: '10px' }}>
                  Click a binary field to inspect its payload encoding and role:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
                  {batchFields.map((field, idx) => (
                    <button
                      key={field.name}
                      onClick={() => setSelectedFieldIdx(idx)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: selectedFieldIdx === idx ? `1px solid ${field.color}` : '1px solid rgba(255,255,255,0.06)',
                        background: selectedFieldIdx === idx ? `${field.color}20` : '#0d1117',
                        color: selectedFieldIdx === idx ? field.color : 'var(--ifm-color-content)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '11px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{field.name}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)' }}>{field.bytes} • {field.type}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Selected Field Inspection Panel */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: `1px solid ${currentField.color}40`,
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: currentField.color }}>
                    {currentField.name}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: `${currentField.color}18`,
                    color: currentField.color,
                    border: `1px solid ${currentField.color}40`
                  }}>
                    {currentField.role}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: '#090b14', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Memory Overhead</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{currentField.bytes}</div>
                  </div>
                  <div style={{ background: '#090b14', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Wire Data Type</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: currentField.color }}>{currentField.type}</div>
                  </div>
                </div>

                <div style={{
                  background: '#090b14',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '11.5px',
                  lineHeight: 1.5,
                  color: 'var(--ifm-color-content)'
                }}>
                  {currentField.desc}
                </div>
              </div>
            </div>
            <style>{`
              @media (max-width: 768px) {
                div[style*="grid-template-columns: 55% 45%"] {
                  grid-template-columns: 1fr !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* Tab 2: Offset Index Entry (.index) */}
        {activeTab === 'index' && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '50% 50%',
              gap: '16px',
              alignItems: 'start'
            }}>
              {/* Left Column: 8-Byte Binary Entry Structure */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
                  8-Byte Fixed-Size Index Entry (.index)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                  Kafka uses a sparse index where each entry occupies exactly <strong>8 bytes</strong> in memory mapped cache (`mmap`):
                </div>

                {/* 2-Word Binary Representation */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <div style={{
                    background: '#090b14',
                    border: '1px solid #38bdf8',
                    padding: '10px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>RelativeOffset (4B)</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Int32: Offset - BaseOffset</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#fbbf24', marginTop: '4px' }}>0x00000100 (256)</div>
                  </div>

                  <div style={{
                    background: '#090b14',
                    border: '1px solid #34d399',
                    padding: '10px',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#34d399' }}>PhysicalPosition (4B)</div>
                    <div style={{ fontSize: '10px', color: 'var(--ifm-color-content-secondary)' }}>Int32: Byte pos in .log</div>
                    <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#34d399', marginTop: '4px' }}>0x0001A400 (107520B)</div>
                  </div>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>
                  <strong>Memory Savings:</strong> Storing a 4-byte relative offset instead of an 8-byte absolute offset cuts memory index footprint by <strong>50%</strong>, allowing OS PageCache to keep millions of partition indexes pinned in RAM!
                </div>
              </div>

              {/* Right Column: Interactive Search Calculator */}
              <div style={{
                background: '#0c0e17',
                borderRadius: '10px',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                padding: '16px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', marginBottom: '10px' }}>
                  Interactive Binary Index Lookup
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', display: 'block', marginBottom: '4px' }}>
                    Target Consumer Fetch Offset:
                  </label>
                  <input
                    type="number"
                    min="1000"
                    max="2000"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(Math.max(1000, Number(e.target.value)))}
                    style={{
                      width: '100%',
                      background: '#090b14',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#34d399',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '13px',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', fontSize: '11px', lineHeight: 1.6, color: 'var(--ifm-color-content)' }}>
                  <div>• <strong>Segment Base Offset:</strong> {baseOffset}</div>
                  <div>• <strong>Relative Offset:</strong> {searchQuery} - {baseOffset} = <span style={{ color: '#fbbf24', fontWeight: 700 }}>{relativeOffset}</span></div>
                  <div>• <strong>Mapped Disk Byte Seek:</strong> <span style={{ color: '#34d399', fontWeight: 700 }}>{estimatedPhysicalPos.toLocaleString()} bytes</span> into `.log`</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Zero-Copy Read Path Flow */}
        {activeTab === 'flow' && (
          <div style={{
            background: '#0c0e17',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px' }}>
              From Binary Index Search to Zero-Copy OS `sendfile()`
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '11px' }}>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #38bdf8' }}>
                <strong style={{ color: '#38bdf8' }}>1. Binary Search in .index:</strong> Broker runs fast in-memory binary search in the mmapped `.index` file to locate the nearest physical byte offset ≤ requested offset.
              </div>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #fbbf24' }}>
                <strong style={{ color: '#fbbf24' }}>2. Seek into .log:</strong> Broker jumps directly to the physical byte position in the append-only `.log` segment file.
              </div>
              <div style={{ background: '#090b14', padding: '10px', borderRadius: '6px', borderLeft: '3px solid #34d399' }}>
                <strong style={{ color: '#34d399' }}>3. Zero-Copy sendfile():</strong> Linux kernel transfers data directly from OS PageCache to Network Socket buffer, bypassing JVM user space completely!
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
