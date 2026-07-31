import React, { useState } from 'react';

interface StorageTier {
  id: string;
  name: string;
  badge: string;
  color: string;
  timeRange: string;
  granularity: string;
  mediaType: string;
  compression: string;
  queryPerformance: string;
}

const TIERS: StorageTier[] = [
  {
    id: 'hot',
    name: '1. Hot Tier (Raw Ingestion)',
    badge: 'Real-Time Writing',
    color: '#f87171',
    timeRange: 'Last 0 - 7 Days',
    granularity: '1-Second Raw Metrics (High resolution)',
    mediaType: 'High-IOPS NVMe SSD (In-Memory WAL + Gorilla Compression)',
    compression: 'Delta-of-Delta timestamp compression (10:1 ratio)',
    queryPerformance: 'Sub-millisecond latency for live alerts and operational dashboards.',
  },
  {
    id: 'warm',
    name: '2. Warm Tier (Downsampled 1-Minute)',
    badge: 'Aggregated Storage',
    color: '#fbbf24',
    timeRange: '7 Days - 90 Days',
    granularity: '1-Minute Downsampled (AVG, MIN, MAX, P99)',
    mediaType: 'Standard SSD Volumes (TimescaleDB Hypertables / InfluxDB TSM)',
    compression: 'Run-Length & Frame-of-Reference (20:1 ratio)',
    queryPerformance: 'Fast multi-day trend analysis & team reporting queries.',
  },
  {
    id: 'cold',
    name: '3. Cold Tier (Long-Term Archival)',
    badge: 'Cost-Optimized',
    color: '#38bdf8',
    timeRange: '90 Days - 7 Years (Compliance)',
    granularity: '1-Hour Aggregates (Parquet columnar format)',
    mediaType: 'Cloud Object Storage (AWS S3 Glacier / GCS Coldline)',
    compression: 'Snappy / ZSTD Compressed Parquet (50:1 ratio)',
    queryPerformance: 'Seconds-to-minutes query latency for historical auditing.',
  },
];

export default function TimeSeriesDatabaseEngineDiagram(): React.JSX.Element {
  const [selectedTier, setSelectedTier] = useState<StorageTier>(TIERS[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Time-Series Database Downsampling & Tiered Storage Lifecycle (Hot / Warm / Cold)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tier Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {TIERS.map((t) => {
            const isSelected = t.id === selectedTier.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${t.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${t.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {t.name}
              </button>
            );
          })}
        </div>

        {/* Selected Tier Summary */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedTier.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedTier.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedTier.color}22`, color: selectedTier.color, fontWeight: 700 }}>
              {selectedTier.badge}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--ifm-color-content)', lineHeight: 1.5 }}>
            Retention Window: <strong>{selectedTier.timeRange}</strong> — Data resolution: {selectedTier.granularity}
          </p>
        </div>

        {/* Grid Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Storage Hardware & Compression
            </div>
            <div style={{ fontSize: '12.5px', color: selectedTier.color, fontWeight: 700, marginBottom: '8px' }}>
              {selectedTier.mediaType}
            </div>

            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Encoding Algorithm
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {selectedTier.compression}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Query Latency Expectations
            </div>
            <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 600 }}>
              {selectedTier.queryPerformance}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
