import React, { useState } from 'react';

type StreamsTab = 'DSL_DAG' | 'NAMING_TRAP';

interface StreamsDetails {
  title: string;
  type: 'purple' | 'cyan';
  overview: string;
  bullets: string[];
}

const STREAMS_DATA: Record<StreamsTab, StreamsDetails> = {
  DSL_DAG: {
    title: 'Kafka Streams Topology DAG (Directed Acyclic Graph)',
    type: 'purple',
    overview: 'Visualizes the compilation of DSL code into physical processor nodes (Source, Processor, Sink).',
    bullets: [
      'Source Processor: Subscribes to the input topic (e.g. orders) and parses key-value records.',
      'Filter Processor: Applies boolean predicates to stream elements, discarding records that do not match.',
      'MapValues Processor: Performs stateless transformations on record values while preserving the partition key.',
      'Sink Processor: Publishes the final transformed stream to output topics (e.g. high-value-orders).'
    ]
  },
  NAMING_TRAP: {
    title: 'The Auto-Generated Naming Shift Trap',
    type: 'cyan',
    overview: 'Explains why explicit node naming is critical for stateful production deployments.',
    bullets: [
      'Stateful operators (aggregations, joins) compile into state stores (e.g. RocksDB) backed by changelog topics.',
      'By default, Kafka Streams auto-generates names sequentially: KSTREAM-SOURCE-0000000000 -> KSTREAM-FILTER-0000000001.',
      'If you insert or reorder a simple filter node, the counter shifts downstream, corrupting local state bindings and changelog topic alignment!'
    ]
  }
};

export default function KafkaStreamsTopologyDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<StreamsTab>('DSL_DAG');
  const [isContended, setIsContended] = useState<boolean>(false); // toggle to show shift state

  const selectedData = STREAMS_DATA[tab];

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
            <span>🌊</span>
            <span style={{ color: tab === 'DSL_DAG' ? '#a855f7' : '#2dd4bf' }}>
              Kafka Streams: {tab === 'DSL_DAG' ? 'Processing DAG' : 'Naming Trap'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setTab('DSL_DAG')}
            style={{
              background: tab === 'DSL_DAG' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'DSL_DAG' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'DSL_DAG' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Topology DAG
          </button>
          <button 
            onClick={() => setTab('NAMING_TRAP')}
            style={{
              background: tab === 'NAMING_TRAP' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'NAMING_TRAP' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'NAMING_TRAP' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Naming Trap
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" /></marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" /></marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" /></marker>
          </defs>

          {tab === 'DSL_DAG' && (
            /* VISUAL DSL TOPOLOGY DAG */
            <g>
              {/* Input Topic */}
              <rect x="20" y="65" width="80" height="40" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="60" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>"orders" topic</text>

              {/* Source Processor */}
              <rect x="140" y="60" width="100" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="190" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Source Processor</text>
              <text x="190" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#c084fc', textAnchor: 'middle' }}>KStream-Source</text>

              {/* Filter Processor */}
              <rect x="280" y="60" width="100" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="330" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Filter Processor</text>
              <text x="330" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>amount &gt; 100</text>

              {/* MapValues Processor */}
              <rect x="420" y="60" width="100" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="470" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>MapValues</text>
              <text x="470" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Enrich Order</text>

              {/* Sink Processor */}
              <rect x="560" y="60" width="100" height="50" rx="4" ry="4" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="610" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Sink Processor</text>
              <text x="610" y="98" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#a855f7', textAnchor: 'middle' }}>"high-value-orders"</text>

              {/* Flows */}
              <path id="path-st-1" d="M 100 85 L 134 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-st-1" /></animateMotion></circle>

              <path id="path-st-2" d="M 240 85 L 274 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-st-2" /></animateMotion></circle>

              <path id="path-st-3" d="M 380 85 L 414 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-st-3" /></animateMotion></circle>

              <path id="path-st-4" d="M 520 85 L 554 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2" fill="#a855f7"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-st-4" /></animateMotion></circle>
            </g>
          )}

          {tab === 'NAMING_TRAP' && (
            /* NAMING SHIFT TRAP SIMULATION */
            <g>
              <foreignObject x="250" y="10" width="200" height="30">
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button onClick={() => setIsContended(!isContended)} style={{ background: isContended ? '#f87171' : '#2dd4bf', color: '#000000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    {isContended ? 'Reset to Default' : '⚠️ Insert Filter Node'}
                  </button>
                </div>
              </foreignObject>

              {/* Node A (Source) */}
              <g>
                <rect x="50" y="60" width="150" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="125" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>KStream-Source</text>
                <text x="125" y="95" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>...SOURCE-000000</text>
              </g>

              {/* Flow link */}
              <path d="M 200 85 L 264 85" fill="none" stroke="#2e354f" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />

              {/* Middle node (Aggregator / Stateful Store) */}
              <g>
                <rect x="270" y="60" width="160" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={isContended ? '#f87171' : '#2dd4bf'} strokeWidth="1.5" />
                <text x="350" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>{isContended ? 'Stateful: Aggregate Shifted' : 'Stateful: Aggregate'}</text>
                <text x="350" y="95" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: isContended ? '#f87171' : '#2dd4bf', textAnchor: 'middle' }}>
                  {isContended ? '...AGGREGATE-000002 🚨' : '...AGGREGATE-000001'}
                </text>
              </g>

              {/* Flow link */}
              <path d="M 430 85 L 494 85" fill="none" stroke="#2e354f" strokeWidth="1.5" markerEnd={isContended ? 'url(#arrow-red)' : 'url(#arrow-cyan)'} />

              {/* State Store */}
              <g>
                <rect x="500" y="60" width="130" height="50" rx="4" ry="4" fill="rgba(255,255,255,0.01)" stroke={isContended ? '#f87171' : 'rgba(255,255,255,0.1)'} strokeDasharray={isContended ? '3 3' : 'none'} />
                <text x="565" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: isContended ? '#f87171' : '#cbd5e1', textAnchor: 'middle' }}>
                  {isContended ? 'Broken Changelog!' : 'Changelog Topic'}
                </text>
                <text x="565" y="95" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 6.5, fill: '#94a3b8', textAnchor: 'middle' }}>
                  {isContended ? 'Mapping Mismatch!' : 'state-store-000001'}
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
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
        💡 Use the tabs above to toggle between the compiled processing DAG and the Auto-Naming shift trap simulation.
      </p>
    </div>
  );
}
