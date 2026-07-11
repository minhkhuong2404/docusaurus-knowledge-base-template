import React, { useState } from 'react';

type MQTab = 'PREVENTION' | 'AT_LEAST_ONCE' | 'SCALING';

interface MQDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  overview: string;
  bullets: string[];
}

const MQ_DATA: Record<MQTab, MQDetails> = {
  PREVENTION: {
    title: 'Duplicate Worker Prevention Mechanics',
    type: 'purple',
    overview: 'Explains how SQS and Kafka guarantee that multiple workers do not process the same message concurrently.',
    bullets: [
      'SQS Visibility Timeout: When Worker A fetches a message, SQS makes it invisible to others for a configured window (e.g., 30s). If Worker A finishes, it deletes the message. If it crashes, the window expires and the message becomes visible again.',
      'Kafka Partition Assignment: A partition inside a topic can only be assigned to a single consumer in a group at any time, making duplicate reads structurally impossible.'
    ]
  },
  AT_LEAST_ONCE: {
    title: 'At-Least-Once Delivery & Failed ACKs',
    type: 'cyan',
    overview: 'Demonstrates why message brokers redeliver messages on worker crashes, necessitating client-side idempotency.',
    bullets: [
      'Worker executes processing successfully (database updated).',
      'Worker crashes right before sending the Acknowledgement (ACK) packet to the broker.',
      'Broker detects connection/session loss, assumes execution failed, and redelivers the message to a backup worker.'
    ]
  },
  SCALING: {
    title: 'The Scaling Ceiling: Single Queue vs. Partitioned Topic',
    type: 'green',
    overview: 'Compares the performance bottlenecks of a shared queue versus parallel partitions.',
    bullets: [
      'Single Queue Bottleneck: Multiple consumers compete for the same queue lock, causing mutex contention and limiting throughput.',
      'Partitioned Scaling: Splitting a topic into multiple independent partitions allows workers to consume in parallel with zero contention.'
    ]
  }
};

export default function MessageQueueArchDiagram({ defaultTab = 'PREVENTION' }: { defaultTab?: MQTab }): React.JSX.Element {
  const [tab, setTab] = useState<MQTab>(defaultTab);
  const [prevMode, setPrevMode] = useState<'SQS' | 'KAFKA'>('SQS');

  const selectedData = MQ_DATA[tab];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header controls */}
      <div 
        className="interactive-diagram-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`interactive-diagram-indicator-dot ${
            tab === 'PREVENTION' ? 'card-indicator-purple' : tab === 'AT_LEAST_ONCE' ? 'card-indicator-cyan' : 'card-indicator-green'
          }`} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📊</span>
            <span style={{ color: tab === 'PREVENTION' ? '#a855f7' : tab === 'AT_LEAST_ONCE' ? '#2dd4bf' : '#4ade80' }}>
              Message Queue: {tab === 'PREVENTION' ? 'Prevention' : tab === 'AT_LEAST_ONCE' ? 'At-Least-Once' : 'Scaling'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setTab('PREVENTION')}
            style={{
              background: tab === 'PREVENTION' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'PREVENTION' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'PREVENTION' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Worker Conflict
          </button>
          <button 
            onClick={() => setTab('AT_LEAST_ONCE')}
            style={{
              background: tab === 'AT_LEAST_ONCE' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'AT_LEAST_ONCE' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'AT_LEAST_ONCE' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            At-Least-Once
          </button>
          <button 
            onClick={() => setTab('SCALING')}
            style={{
              background: tab === 'SCALING' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'SCALING' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'SCALING' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Scaling
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" /></marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" /></marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" /></marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
          </defs>

          {tab === 'PREVENTION' && (
            /* CONFLICT PREVENTION TAB */
            <g>
              {/* Inner Toggle for SQS vs Kafka */}
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button onClick={() => setPrevMode('SQS')} style={{ background: prevMode === 'SQS' ? '#a855f7' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>SQS Visibility</button>
                  <button onClick={() => setPrevMode('KAFKA')} style={{ background: prevMode === 'KAFKA' ? '#a855f7' : 'rgba(255,255,255,0.05)', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem' }}>Kafka Partition</button>
                </div>
              </foreignObject>

              {prevMode === 'SQS' ? (
                <g>
                  {/* SQS queue */}
                  <rect x="50" y="70" width="130" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
                  <text x="115" y="95" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Amazon SQS Queue</text>
                  <text x="115" y="108" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#cbd5e1', textAnchor: 'middle' }}>(Shared FIFO or Standard)</text>

                  {/* Workers */}
                  <rect x="300" y="50" width="110" height="35" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#a855f7" />
                  <text x="355" y="72" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#ffffff', textAnchor: 'middle' }}>Worker A (Locks Msg)</text>

                  <rect x="300" y="105" width="110" height="35" rx="3" ry="3" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.1)" />
                  <text x="355" y="127" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Worker B (Blocked)</text>

                  {/* Connection lines */}
                  <path id="sqs-p1" d="M 180 85 L 294 70" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
                  <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#sqs-p1" /></animateMotion></circle>

                  <path d="M 180 100 L 294 120" fill="none" stroke="#2e354f" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="240" y="125" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 6.5, fill: '#f87171', textAnchor: 'middle' }}>Invisible (30s)</text>
                </g>
              ) : (
                <g>
                  {/* Kafka partitions */}
                  <g>
                    <rect x="50" y="45" width="130" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                    <text x="115" y="60" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Partition 0</text>
                    <rect x="50" y="75" width="130" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                    <text x="115" y="90" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Partition 1</text>
                    <rect x="50" y="105" width="130" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                    <text x="115" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Partition 2</text>
                  </g>

                  {/* Consumers */}
                  <rect x="300" y="45" width="110" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#a855f7" />
                  <text x="355" y="60" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Consumer A</text>

                  <rect x="300" y="75" width="110" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#a855f7" />
                  <text x="355" y="90" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Consumer B</text>

                  <rect x="300" y="105" width="110" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#a855f7" />
                  <text x="355" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Consumer C</text>

                  {/* Flow links */}
                  <path d="M 180 57 L 294 57" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" />
                  <path d="M 180 87 L 294 87" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" />
                  <path d="M 180 117 L 294 117" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" />
                </g>
              )}
            </g>
          )}

          {tab === 'AT_LEAST_ONCE' && (
            /* AT-LEAST-ONCE DUPLICATE ARRIVAL FLOW */
            <g>
              {/* MQ Broker */}
              <rect x="25" y="65" width="110" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Broker</text>
              <text x="80" y="103" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>[Waiting for ACK]</text>

              {/* Worker A */}
              <rect x="230" y="30" width="130" height="45" rx="4" ry="4" fill="rgba(239, 68, 68, 0.08)" stroke="#f87171" strokeWidth="1.5" />
              <text x="295" y="52" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#f87171', textAnchor: 'middle' }}>Worker A</text>
              <text x="295" y="65" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>[🔥 Crashes before ACK]</text>

              {/* Worker B */}
              <rect x="230" y="105" width="130" height="45" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="295" y="127" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#4ade80', textAnchor: 'middle' }}>Worker B</text>
              <text x="295" y="140" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#86efac', textAnchor: 'middle' }}>[Gets Duplicate Msg]</text>

              {/* Database */}
              <rect x="490" y="65" width="140" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="560" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Target Database</text>
              <text x="560" y="103" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#fbbf24', textAnchor: 'middle' }}>[Must Be Idempotent]</text>

              {/* Connections */}
              <path id="path-alo-1" d="M 135 80 L 224 55" fill="none" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
              <path id="path-alo-db1" d="M 360 55 L 484 80" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
              <text x="420" y="58" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>1. DB Inserted</text>

              <path id="path-alo-2" d="M 135 100 L 224 125" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-alo-2" /></animateMotion></circle>
              <text x="175" y="125" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>2. Redelivered</text>
            </g>
          )}

          {tab === 'SCALING' && (
            /* SCALING TOPOLOGY TAB */
            <g>
              {/* Single Queue Bottleneck */}
              <g>
                <rect x="25" y="25" width="200" height="120" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" />
                <text x="125" y="42" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Single Queue (Bottleneck)</text>

                <rect x="45" y="65" width="160" height="24" rx="3" ry="3" fill="rgba(239, 68, 68, 0.05)" stroke="#f87171" />
                <text x="125" y="80" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#f87171', textAnchor: 'middle' }}>Shared Queue Lock</text>

                {/* Mutex competition links */}
                <path d="M 125 95 L 85 125" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 125 95 L 125 125" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M 125 95 L 165 125" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />

                <text x="125" y="140" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>Mutex contention</text>
              </g>

              {/* Partitioned Scaling */}
              <g>
                <rect x="280" y="25" width="370" height="120" rx="6" ry="6" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
                <text x="465" y="42" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#86efac', textAnchor: 'middle' }}>Partitioned Topic (Parallel Scaling)</text>

                <rect x="300" y="55" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="350" y="68" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Part 0</text>
                <rect x="300" y="80" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="350" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Part 1</text>
                <rect x="300" y="105" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="350" y="118" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Part 2</text>

                <rect x="520" y="55" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="570" y="68" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Worker A</text>
                <rect x="520" y="80" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="570" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Worker B</text>
                <rect x="520" y="105" width="100" height="20" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="#4ade80" />
                <text x="570" y="118" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#ffffff', textAnchor: 'middle' }}>Worker C</text>

                {/* Independent connection lines */}
                <path id="path-scal-0" d="M 400 65 L 514 65" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-scal-0" /></animateMotion></circle>

                <path id="path-scal-1" d="M 400 90 L 514 90" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-scal-1" /></animateMotion></circle>

                <path id="path-scal-2" d="M 400 115 L 514 115" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-scal-2" /></animateMotion></circle>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'cyan' ? 'card-indicator-cyan' : 'card-indicator-green'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.overview}</p>
        
        <ul>
          <li><strong>Processing Mechanics:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Use the controls above to toggle between worker conflict, at-least-once, and scaling views.
      </p>
    </div>
  );
}
