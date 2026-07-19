import React, { useState } from 'react';

interface CompareMetric {
  dimension: string;
  pollingValue: string;
  pollingScore: number; // 0-100
  pollingColor: string;
  cdcValue: string;
  cdcScore: number; // 0-100
  cdcColor: string;
  note: string;
}

const METRICS: Record<string, CompareMetric[]> = {
  PERFORMANCE: [
    {
      dimension: 'Latency',
      pollingValue: '0–500ms (Poll Interval)',
      pollingScore: 60,
      pollingColor: '#fbbf24',
      cdcValue: 'Sub-50ms (WAL Streaming)',
      cdcScore: 95,
      cdcColor: '#34d399',
      note: 'CDC tails the WAL in real time. Polling adds database wait states.',
    },
    {
      dimension: 'Database CPU Load',
      pollingValue: 'Constant query pressure',
      pollingScore: 40,
      pollingColor: '#f87171',
      cdcValue: 'Near Zero (Non-blocking)',
      cdcScore: 90,
      cdcColor: '#34d399',
      note: 'Polling runs active SELECT statements constantly. CDC reads raw WAL bytes asynchronously.',
    },
  ],
  INFRASTRUCTURE: [
    {
      dimension: 'Setup Complexity',
      pollingValue: 'Very Simple (App code only)',
      pollingScore: 95,
      pollingColor: '#34d399',
      cdcValue: 'Complex (Heavy)',
      cdcScore: 30,
      cdcColor: '#f87171',
      note: 'Polling is a scheduling function. CDC requires Kafka Connect, Debezium, and database logical replication permissions.',
    },
    {
      dimension: 'Maintenance Cost',
      pollingValue: 'Extremely Low',
      pollingScore: 90,
      pollingColor: '#34d399',
      cdcValue: 'Medium-High',
      cdcScore: 45,
      cdcColor: '#fbbf24',
      note: 'Replication slots hold PostgreSQL WAL if Kafka Connect halts, potentially filling PostgreSQL disks if unmonitored.',
    },
  ],
  SCALING: [
    {
      dimension: 'Write Ordering',
      pollingValue: 'Requires manual locks',
      pollingScore: 50,
      pollingColor: '#fbbf24',
      cdcValue: 'Strict WAL sequence order',
      cdcScore: 95,
      cdcColor: '#34d399',
      note: 'CDC naturally publishes events in the exact sequence they were committed to the transaction log.',
    },
    {
      dimension: 'Horizontal Scaling',
      pollingValue: 'Scalable via SELECT SKIP LOCKED',
      pollingScore: 80,
      pollingColor: '#34d399',
      cdcValue: 'Single reader per slot constraint',
      cdcScore: 70,
      cdcColor: '#fbbf24',
      note: 'PostgreSQL only permits one active reader slot. Scaling CDC must occur in downstream Kafka consumer groups.',
    },
  ],
};

export default function CdcVsPollingDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'INFRASTRUCTURE' | 'SCALING'>('PERFORMANCE');

  const currentMetrics = METRICS[activeTab];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
        <span>Relay Strategy: CDC vs Polling Deep Dive</span>
      </div>

      {/* Tabs list */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
        {(['PERFORMANCE', 'INFRASTRUCTURE', 'SCALING'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 700, fontSize: '11.5px',
              background: activeTab === tab ? 'rgba(56,189,248,0.15)' : 'transparent',
              color: activeTab === tab ? '#38bdf8' : 'var(--ifm-color-content-secondary)',
              border: `1px solid ${activeTab === tab ? '#38bdf850' : 'transparent'}`,
              transition: 'all 0.2s',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Comparison Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentMetrics.map((metric, idx) => (
          <div
            key={idx}
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#e2e8f0', marginBottom: '12px' }}>
              {metric.dimension}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              {/* Polling Strategy Card */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>Polling Relay</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: metric.pollingColor }}>
                    Score: {metric.pollingScore}/100
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${metric.pollingScore}%`, background: metric.pollingColor, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
                  {metric.pollingValue}
                </div>
              </div>

              {/* CDC Strategy Card */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1' }}>CDC (Debezium)</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: metric.cdcColor }}>
                    Score: {metric.cdcScore}/100
                  </span>
                </div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ height: '100%', width: `${metric.cdcScore}%`, background: metric.cdcColor, borderRadius: '2px' }} />
                </div>
                <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)', fontWeight: 600 }}>
                  {metric.cdcValue}
                </div>
              </div>

            </div>

            {/* Explanation Note */}
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid #38bdf8', fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.45 }}>
              💡 {metric.note}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
