import React, { useState } from 'react';

interface DiagnosticMetric {
  id: string;
  name: string;
  badge: string;
  color: string;
  currentValue: string;
  healthyThreshold: string;
  rootCause: string;
  resolutionAction: string;
}

const METRICS: DiagnosticMetric[] = [
  {
    id: 'cache-hit',
    name: '1. Shared Buffer Cache Hit Ratio',
    badge: 'Memory Health',
    color: '#34d399',
    currentValue: '99.4%',
    healthyThreshold: '> 99.0% for OLTP production',
    rootCause: 'If drop below 95%: Working dataset exceeds assigned RAM buffer size (`shared_buffers`), forcing disk reads.',
    resolutionAction: 'Increase `shared_buffers`, optimize queries to reduce unindexed full table scans.',
  },
  {
    id: 'slow-queries',
    name: '2. Slow Query Log (pg_stat_statements)',
    badge: 'Query Bottlenecks',
    color: '#fbbf24',
    currentValue: '12 queries > 2000ms',
    healthyThreshold: '0 queries > 500ms',
    rootCause: 'Missing indexes, un-analyzed tables with stale statistics, or Cartesian JOIN explosion.',
    resolutionAction: 'Run `EXPLAIN ANALYZE`, add composite/covering index, update statistics via `ANALYZE`.',
  },
  {
    id: 'lock-waits',
    name: '3. Transaction Lock Wait Duration',
    badge: 'Lock Contention',
    color: '#f87171',
    currentValue: '4,200ms lock wait',
    healthyThreshold: '< 50ms lock wait',
    rootCause: 'Long-running transactions holding Exclusive (X) locks (e.g. unindexed `UPDATE` or bulk `ALTER TABLE`).',
    resolutionAction: 'Enforce strict query timeout (`statement_timeout = 5s`), break up monolithic transactions into smaller batches.',
  },
  {
    id: 'connection-saturation',
    name: '4. Connection Pool Saturation',
    badge: 'Pool Exhaustion',
    color: '#c084fc',
    currentValue: '98 / 100 Connections Used',
    healthyThreshold: '< 80% pool utilization',
    rootCause: 'Connection leaks in application code or client threads holding connections idle during slow REST calls.',
    resolutionAction: 'Use HikariCP with connection timeout (`connectionTimeout = 3000ms`), deploy PgBouncer connection pooler.',
  },
];

export default function DatabasePerformanceMonitoringDiagram(): React.JSX.Element {
  const [selectedMetric, setSelectedMetric] = useState<DiagnosticMetric>(METRICS[1]); // Default to Slow Queries

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Database Production Diagnostics & Performance Monitoring Inspector
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Metric Selector Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {METRICS.map((m) => {
            const isSelected = m.id === selectedMetric.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: isSelected ? `1px solid ${m.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isSelected ? `${m.color}15` : '#0c0e17',
                  color: isSelected ? '#fff' : 'var(--ifm-color-content-secondary)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '12px',
                }}
              >
                {m.name}
              </button>
            );
          })}
        </div>

        {/* Selected Metric Summary */}
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', borderLeft: `4px solid ${selectedMetric.color}`, marginBottom: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff' }}>{selectedMetric.name}</span>
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${selectedMetric.color}22`, color: selectedMetric.color, fontWeight: 700 }}>
              {selectedMetric.badge}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Current State: </span>
              <strong style={{ color: selectedMetric.color, fontSize: '14px' }}>{selectedMetric.currentValue}</strong>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>Target Benchmark: </span>
              <strong style={{ color: '#34d399', fontSize: '14px' }}>{selectedMetric.healthyThreshold}</strong>
            </div>
          </div>
        </div>

        {/* Root Cause & Resolution Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Underlying Performance Root Cause
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: 1.4 }}>
              {selectedMetric.rootCause}
            </div>
          </div>

          <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)', marginBottom: '4px', fontWeight: 600 }}>
              Senior Remediation Action
            </div>
            <div style={{ fontSize: '12.5px', color: '#38bdf8', fontWeight: 600, lineHeight: 1.4 }}>
              {selectedMetric.resolutionAction}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
