import React, { useState } from 'react';

type ConnectTab = 'WORKER_INTERNAL' | 'SOURCE_LOOP' | 'SINK_LOOP';

interface ConnectDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  overview: string;
  bullets: string[];
}

const CONNECT_DATA: Record<ConnectTab, ConnectDetails> = {
  WORKER_INTERNAL: {
    title: 'Kafka Connect Worker JVM Process Internals',
    type: 'purple',
    overview: 'Workers host connectors and task threads. In distributed mode, they form a coordinated cluster via Group Membership Protocols.',
    bullets: [
      'Connector Thread: Responsible for parsing configurations, splitting partition workloads, and orchestrating task creation.',
      'Task Threads: Independent runners that execute the data pipeline loops. Source tasks run poll() loops; Sink tasks run put() loops.',
      'OffsetBackingStore: Persists connector metadata and progress logs (written to Kafka connect-offsets topic in distributed mode).'
    ]
  },
  SOURCE_LOOP: {
    title: 'Source Task Execution Loop (Pull from Source, Push to Kafka)',
    type: 'cyan',
    overview: 'Detailed lifecycle steps for ingesting data into Kafka.',
    bullets: [
      '1. poll() - The task queries the source system (e.g. database rows) and returns a list of SourceRecords.',
      '2. SMT (Simple Message Transforms) - Modifies payload fields, updates schema headers, or drops rows.',
      '3. Converter - Serializes records (e.g., Avro, JSON Schema) into binary payload formats.',
      '4. send() - Routes binary messages to Kafka using the internal KafkaProducer, committing source offsets on broker acknowledgement.'
    ]
  },
  SINK_LOOP: {
    title: 'Sink Task Execution Loop (Pull from Kafka, Push to Sink)',
    type: 'green',
    overview: 'Detailed lifecycle steps for exporting data out of Kafka.',
    bullets: [
      '1. poll() - Fetches new binary records from Kafka topics using the internal KafkaConsumer.',
      '2. Converter - Deserializes binary payloads back into structured Connect records.',
      '3. SMT - Applies modifications, filters, or headers.',
      '4. put() - Flushes structured payloads to the destination sink system, committing Kafka consumer offsets on success.'
    ]
  }
};

export default function KafkaConnectFlowDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<ConnectTab>('WORKER_INTERNAL');

  const selectedData = CONNECT_DATA[tab];

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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🔌</span>
            <span style={{ color: tab === 'WORKER_INTERNAL' ? '#a855f7' : tab === 'SOURCE_LOOP' ? '#2dd4bf' : '#4ade80' }}>
              Kafka Connect: {tab === 'WORKER_INTERNAL' ? 'Worker Internals' : tab === 'SOURCE_LOOP' ? 'Source Task' : 'Sink Task'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setTab('WORKER_INTERNAL')}
            style={{
              background: tab === 'WORKER_INTERNAL' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'WORKER_INTERNAL' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'WORKER_INTERNAL' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Worker JVM
          </button>
          <button 
            onClick={() => setTab('SOURCE_LOOP')}
            style={{
              background: tab === 'SOURCE_LOOP' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'SOURCE_LOOP' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'SOURCE_LOOP' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Source Task
          </button>
          <button 
            onClick={() => setTab('SINK_LOOP')}
            style={{
              background: tab === 'SINK_LOOP' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'SINK_LOOP' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'SINK_LOOP' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Sink Task
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
          </defs>

          {tab === 'WORKER_INTERNAL' && (
            /* WORKER JVM ARCHITECTURE INTERNALS */
            <g>
              {/* JVM boundary */}
              <rect x="25" y="15" width="630" height="150" rx="6" ry="6" fill="rgba(168, 85, 247, 0.02)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="340" y="32" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#c084fc', textAnchor: 'middle' }}>Worker JVM Container Process</text>

              {/* Connector thread */}
              <rect x="50" y="55" width="160" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
              <text x="130" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>ConnectorThread</text>
              <text x="130" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>[Work Division & Config]</text>

              {/* Task threads */}
              <rect x="260" y="55" width="180" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
              <text x="350" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>TaskThread(s)</text>
              <text x="350" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>[Source/Sink I/O Loops]</text>

              {/* Offset store */}
              <rect x="490" y="55" width="140" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
              <text x="560" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>OffsetBackingStore</text>
              <text x="560" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>[Persistence Store]</text>

              {/* Connection lines */}
              <path id="path-wi-1" d="M 210 85 L 254 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-wi-1" /></animateMotion></circle>

              <path id="path-wi-2" d="M 440 85 L 484 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-wi-2" /></animateMotion></circle>
            </g>
          )}

          {tab === 'SOURCE_LOOP' && (
            /* SOURCE LOOP TAB */
            <g>
              {/* Source DB */}
              <rect x="15" y="65" width="100" height="40" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="65" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Source DB</text>

              {/* poll */}
              <rect x="155" y="60" width="80" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="195" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>1. poll()</text>
              <text x="195" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>SourceRecords</text>

              {/* transform */}
              <rect x="270" y="60" width="80" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="310" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>2. SMT</text>
              <text x="310" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Transforms</text>

              {/* convert */}
              <rect x="385" y="60" width="90" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="430" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>3. Converter</text>
              <text x="430" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Byte Array</text>

              {/* Kafka */}
              <rect x="525" y="60" width="130" height="50" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="2" />
              <text x="590" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Kafka Topic</text>
              <text x="590" y="98" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Offsets Committed]</text>

              {/* Connections */}
              <path id="path-sl-1" d="M 115 85 L 149 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sl-1" /></animateMotion></circle>

              <path id="path-sl-2" d="M 235 85 L 264 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sl-2" /></animateMotion></circle>

              <path id="path-sl-3" d="M 350 85 L 379 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sl-3" /></animateMotion></circle>

              <path id="path-sl-4" d="M 475 85 L 519 85" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sl-4" /></animateMotion></circle>
            </g>
          )}

          {tab === 'SINK_LOOP' && (
            /* SINK LOOP TAB */
            <g>
              {/* Kafka */}
              <rect x="15" y="65" width="100" height="40" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="65" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Kafka Topic</text>

              {/* poll */}
              <rect x="155" y="60" width="80" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="195" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>1. poll()</text>
              <text x="195" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Binary Record</text>

              {/* convert */}
              <rect x="270" y="60" width="90" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="315" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>2. Converter</text>
              <text x="315" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Connect Data</text>

              {/* transform */}
              <rect x="395" y="60" width="80" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="435" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>3. SMT</text>
              <text x="435" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Transforms</text>

              {/* Target System */}
              <rect x="525" y="60" width="130" height="50" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="2" />
              <text x="590" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>External Sink</text>
              <text x="590" y="98" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Offsets Flushed]</text>

              {/* Connections */}
              <path id="path-sil-1" d="M 115 85 L 149 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sil-1" /></animateMotion></circle>

              <path id="path-sil-2" d="M 235 85 L 264 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sil-2" /></animateMotion></circle>

              <path id="path-sil-3" d="M 360 85 L 389 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sil-3" /></animateMotion></circle>

              <path id="path-sil-4" d="M 475 85 L 519 85" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-sil-4" /></animateMotion></circle>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
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
        💡 Use the controls above to toggle between Worker Internals, Source Loops, and Sink Loops.
      </p>
    </div>
  );
}
