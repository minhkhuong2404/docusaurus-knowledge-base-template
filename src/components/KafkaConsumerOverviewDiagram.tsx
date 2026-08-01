import React, { useState } from 'react';

export default function KafkaConsumerOverviewDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'overview' | 'details'>('overview');

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Consumer Polling Loop & Fetch Architecture
        </span>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button onClick={() => setActiveTab('overview')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTab === 'overview' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTab === 'overview' ? 'rgba(56, 189, 248, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Architecture Flow</button>
          <button onClick={() => setActiveTab('details')} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: activeTab === 'details' ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.1)', backgroundColor: activeTab === 'details' ? 'rgba(52, 211, 153, 0.15)' : '#0c0e17', color: '#fff', fontSize: '11px', cursor: 'pointer' }}>Production Gotchas &amp; Metrics</button>
        </div>
        <div style={{ backgroundColor: '#0c0e17', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
          {activeTab === 'overview' ? (
            <p style={{ margin: 0, fontSize: '12px', color: '#38bdf8' }}>Interactive visualization of kafka consumer polling loop & fetch architecture. Guarantees high-throughput event streaming with zero-copy I/O.</p>
          ) : (
            <p style={{ margin: 0, fontSize: '12px', color: '#34d399' }}>Key Metrics: Monitor ISR shrink, fetch latency, GC pause times, and disk utilization.</p>
          )}
        </div>
      </div>
    </div>
  );
}