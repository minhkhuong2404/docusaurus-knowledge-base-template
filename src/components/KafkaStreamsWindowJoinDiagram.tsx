import React, { useState } from 'react';

type WindowType = 'tumbling' | 'hopping' | 'sliding' | 'session';

export default function KafkaStreamsWindowJoinDiagram({ initialMode = 'tumbling' }: { initialMode?: WindowType }): React.JSX.Element {
  const [activeWindow, setActiveWindow] = useState<WindowType>(initialMode);
  const [activeTab, setActiveTab] = useState<'windows' | 'joins'>('windows');
  const [selectedJoinType, setSelectedJoinType] = useState<'stream_stream' | 'stream_table' | 'stream_global'>('stream_table');

  const windows = {
    tumbling: {
      title: 'Tumbling Window (Fixed Duration, Non-Overlapping)',
      desc: 'Time is divided into discrete, contiguous buckets of equal duration (e.g. 5 minutes). Every record belongs to exactly one window.',
      example: '[10:00, 10:05) ➔ [10:05, 10:10) ➔ [10:10, 10:15)',
      color: '#38bdf8'
    },
    hopping: {
      title: 'Hopping Window (Fixed Duration, Overlapping Advance)',
      desc: 'Windows have fixed duration (e.g. 5 min) but advance by a smaller step (e.g. 1 min). A single record falls into multiple overlapping windows.',
      example: '[10:00, 10:05), [10:01, 10:06), [10:02, 10:07)',
      color: '#34d399'
    },
    sliding: {
      title: 'Sliding Window (Dynamic Event-Time Difference)',
      desc: 'Evaluated continuously around individual record timestamps (within time difference Δ). Used primarily for stream-stream join correlation.',
      example: 'Join matches if |timestamp_A - timestamp_B| <= 5 minutes',
      color: '#a78bfa'
    },
    session: {
      title: 'Session Window (Data-Driven Inactivity Gap)',
      desc: 'Windows expand dynamically with each new event and close only when an inactivity gap threshold (e.g. 15 min of silence) is exceeded.',
      example: 'User activity bursts merge into one session until idle gap occurs',
      color: '#fbbf24'
    }
  };

  const joins = {
    stream_stream: {
      name: 'Stream-Stream Join (Windowed)',
      copartitioned: 'Required',
      stateStore: 'WindowedStore on both sides',
      retention: 'Stores records for window duration + grace period',
      behavior: 'Matches events from Stream A and Stream B that arrive within the configured join time window.'
    },
    stream_table: {
      name: 'Stream-Table Join (Non-Windowed Lookup)',
      copartitioned: 'Required',
      stateStore: 'KeyValueStore (Table side only)',
      retention: 'Indefinite (latest key state)',
      behavior: 'Stream records trigger instant lookups against the partitioned local KTable state store. Table updates do not trigger retroactive stream joins.'
    },
    stream_global: {
      name: 'Stream-GlobalKTable Join (Foreign Key Lookup)',
      copartitioned: 'NOT Required',
      stateStore: 'Fully replicated KeyValueStore on every pod',
      retention: 'Indefinite',
      behavior: 'Stream records can join on arbitrary foreign keys (e.g. record.customerId) without repartitioning the input stream topic.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .kstreams-win-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Kafka Streams Windowing Types & Join Co-Partitioning Rules
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Main Section Switcher */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            onClick={() => setActiveTab('windows')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: activeTab === 'windows' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'windows' ? '#2dd4bf' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'windows' ? '0 0 0 1.5px #2dd4bf' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            1. Windowing Archetypes
          </button>
          <button
            onClick={() => setActiveTab('joins')}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12px',
              background: activeTab === 'joins' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'joins' ? '#a78bfa' : 'var(--ifm-color-content-secondary)',
              boxShadow: activeTab === 'joins' ? '0 0 0 1.5px #a78bfa' : '0 0 0 1px rgba(255,255,255,0.08)',
              transition: 'all 0.2s ease'
            }}
          >
            2. Stream Joins & Co-Partitioning
          </button>
        </div>

        {activeTab === 'windows' && (
          <div className="kstreams-win-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', alignItems: 'start' }}>
            {/* Window Type Selector */}
            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                SELECT WINDOW TYPE
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(['tumbling', 'hopping', 'sliding', 'session'] as WindowType[]).map(wt => (
                  <button
                    key={wt}
                    onClick={() => setActiveWindow(wt)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textAlign: 'left',
                      background: activeWindow === wt ? `${windows[wt].color}22` : 'rgba(255,255,255,0.03)',
                      color: activeWindow === wt ? windows[wt].color : 'var(--ifm-color-content)',
                      borderLeft: activeWindow === wt ? `3px solid ${windows[wt].color}` : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {windows[wt].title}
                  </button>
                ))}
              </div>
            </div>

            {/* Window Details */}
            <div className="interactive-diagram-details-card details-cyan" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: windows[activeWindow].color, textTransform: 'uppercase', marginBottom: '4px' }}>
                WINDOW SPECIFICATION
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                {windows[activeWindow].title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                {windows[activeWindow].desc}
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px', fontSize: '11px', color: '#e2e8f0', fontFamily: 'monospace' }}>
                {windows[activeWindow].example}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'joins' && (
          <div className="kstreams-win-grid" style={{ display: 'grid', gridTemplateColumns: '48% 52%', gap: '14px', alignItems: 'start' }}>
            {/* Joins Selector */}
            <div style={{ background: '#090b14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                SELECT JOIN TOPOLOGY
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { id: 'stream_stream', label: '1. KStream - KStream Join (Windowed)' },
                  { id: 'stream_table', label: '2. KStream - KTable Join (Keyed)' },
                  { id: 'stream_global', label: '3. KStream - GlobalKTable (Foreign Key)' }
                ].map(j => (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJoinType(j.id as any)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      textAlign: 'left',
                      background: selectedJoinType === j.id ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.03)',
                      color: selectedJoinType === j.id ? '#a78bfa' : 'var(--ifm-color-content)',
                      borderLeft: selectedJoinType === j.id ? '3px solid #a78bfa' : '3px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {j.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Join Requirements Panel */}
            <div className="interactive-diagram-details-card details-purple" style={{ minHeight: '260px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>
                CO-PARTITIONING MATRIX
              </div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--ifm-color-content)' }}>
                {joins[selectedJoinType].name}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                {joins[selectedJoinType].behavior}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <strong style={{ color: '#a78bfa' }}>Co-Partitioning:</strong>
                  <div style={{ color: joins[selectedJoinType].copartitioned === 'Required' ? '#f87171' : '#34d399', fontWeight: 700 }}>
                    {joins[selectedJoinType].copartitioned}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '4px' }}>
                  <strong style={{ color: '#a78bfa' }}>State Store:</strong>
                  <div>{joins[selectedJoinType].stateStore}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
