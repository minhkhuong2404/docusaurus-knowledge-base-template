import React, { useState } from 'react';

type ElementKey = 'GC_ROOT' | 'HASH_MAP' | 'ENTRIES' | 'EVENT_LIST';

interface ElementDetails {
  title: string;
  type: 'red' | 'yellow' | 'cyan' | 'green';
  retainedSize: string;
  shallowSize: string;
  explanation: string;
  leakDetails: string[];
}

const ELEMENT_DATA: Record<ElementKey, ElementDetails> = {
  GC_ROOT: {
    title: 'GC Root (static field EventTracker.events)',
    type: 'red',
    retainedSize: '1.2 GB (Retained Heap)',
    shallowSize: '8 Bytes (Reference Pointer)',
    explanation: 'A garbage collection root (GC Root) is a starting pointer that is always reachable by the garbage collector. Static variables live in Metaspace and are never collected while their class is loaded.',
    leakDetails: [
      'Static fields persist for the lifetime of the JVM application process.',
      'Any object directly or indirectly reachable from a GC Root is protected from garbage collection, even if it is never accessed by application threads again.'
    ]
  },
  HASH_MAP: {
    title: 'java.util.HashMap Instance',
    type: 'yellow',
    retainedSize: '1.2 GB (Retained Heap)',
    shallowSize: '48 Bytes (Object Shell)',
    explanation: 'The wrapper map container holding the references to the loaded event records.',
    leakDetails: [
      'Shallow size is extremely small (holds only field definitions, thresholds, load factor).',
      'Retained size is massive (1.2GB) because it prevents all nested nodes, entry arrays, and event records from being garbage collected.'
    ]
  },
  ENTRIES: {
    title: '500,000 HashMap$Node Instances',
    type: 'cyan',
    retainedSize: '1.19 GB (Retained Heap)',
    shallowSize: '16 MB (Shallow memory for entry shell nodes)',
    explanation: 'Individual node buckets inside the HashMap which connect the key-value hashes.',
    leakDetails: [
      'Each HashMap$Node holds strong references to the Key object, the Value object, and the next node pointer in the hash bucket.',
      'Accumulating 500,000 entries indicates that events are continuously pushed without any eviction or removal cycles.'
    ]
  },
  EVENT_LIST: {
    title: 'List<Event> & Event Payloads',
    type: 'green',
    retainedSize: '1.17 GB (Retained Heap)',
    shallowSize: '1.17 GB (Actual data bytes on Heap)',
    explanation: 'The actual Event domain objects containing user event metadata, payloads, and logs.',
    leakDetails: [
      'This is where the actual memory bytes are consumed (strings, timestamps, logs).',
      'Solution: To fix the leak, implement a WeakHashMap, configure an active eviction policy (e.g. LRU cache), or explicitly invoke list.clear() or map.remove() when event processing completes.'
    ]
  }
};

export default function HeapDumpLeakDiagram(): React.JSX.Element {
  const [activeEl, setActiveEl] = useState<ElementKey>('GC_ROOT');

  const selectedData = ELEMENT_DATA[activeEl];

  const getStroke = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'red' ? '#f87171' : ELEMENT_DATA[key].type === 'yellow' ? '#fbbf24' : ELEMENT_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return ELEMENT_DATA[key].type === 'red' ? '#991b1b' : ELEMENT_DATA[key].type === 'yellow' ? '#d97706' : ELEMENT_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'red' ? 'rgba(239, 68, 68, 0.15)' : ELEMENT_DATA[key].type === 'yellow' ? 'rgba(251, 191, 36, 0.15)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return ELEMENT_DATA[key].type === 'red' ? 'rgba(127, 29, 29, 0.05)' : ELEMENT_DATA[key].type === 'yellow' ? 'rgba(120, 53, 4, 0.05)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 700 240" className="interactive-diagram-svg">
          <defs>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
            <marker
              id="arrow-yellow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-gray"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* GC Root Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('GC_ROOT')}>
            <rect
              x="30"
              y="70"
              width="135"
              height="85"
              rx="8"
              ry="8"
              fill={getFill('GC_ROOT')}
              stroke={getStroke('GC_ROOT')}
              strokeWidth={activeEl === 'GC_ROOT' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'GC_ROOT' && (
              <circle cx="150" cy="82" r="4.5" fill="#f87171" className="interactive-diagram-pulse-dot" />
            )}
            <text x="97" y="112" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>GC Root</text>
            <text x="97" y="130" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#f87171', textAnchor: 'middle' }}>static events field</text>
          </g>

          {/* HashMap Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('HASH_MAP')}>
            <rect
              x="200"
              y="70"
              width="130"
              height="85"
              rx="8"
              ry="8"
              fill={getFill('HASH_MAP')}
              stroke={getStroke('HASH_MAP')}
              strokeWidth={activeEl === 'HASH_MAP' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'HASH_MAP' && (
              <circle cx="315" cy="82" r="4.5" fill="#fbbf24" className="interactive-diagram-pulse-dot" />
            )}
            <text x="265" y="112" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>HashMap</text>
            <text x="265" y="130" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Retained: 1.2 GB</text>
          </g>

          {/* HashMap$Node (Entries) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('ENTRIES')}>
            <rect
              x="370"
              y="70"
              width="135"
              height="85"
              rx="8"
              ry="8"
              fill={getFill('ENTRIES')}
              stroke={getStroke('ENTRIES')}
              strokeWidth={activeEl === 'ENTRIES' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'ENTRIES' && (
              <circle cx="490" cy="82" r="4.5" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="437" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>500,000 Entries</text>
            <text x="437" y="122" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#2dd4bf', textAnchor: 'middle' }}>HashMap$Node</text>
            <text x="437" y="138" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Retained: 1.19 GB</text>
          </g>

          {/* List / Event Payload Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('EVENT_LIST')}>
            <rect
              x="540"
              y="70"
              width="130"
              height="85"
              rx="8"
              ry="8"
              fill={getFill('EVENT_LIST')}
              stroke={getStroke('EVENT_LIST')}
              strokeWidth={activeEl === 'EVENT_LIST' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'EVENT_LIST' && (
              <circle cx="655" cy="82" r="4.5" fill="#4ade80" className="interactive-diagram-pulse-dot" />
            )}
            <text x="605" y="112" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>List&lt;Event&gt;</text>
            <text x="605" y="130" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Retained: 1.17 GB</text>
          </g>

          {/* CONNECTOR PATHS */}
          {/* GC Root -> HashMap */}
          <g>
            <path
              id="path-root-map"
              d="M 165 112 L 194 112"
              fill="none"
              stroke={activeEl === 'GC_ROOT' || activeEl === 'HASH_MAP' ? '#f87171' : '#2e354f'}
              strokeWidth={activeEl === 'GC_ROOT' || activeEl === 'HASH_MAP' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'GC_ROOT' || activeEl === 'HASH_MAP' ? 'url(#arrow-red)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'GC_ROOT' || activeEl === 'HASH_MAP' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeEl === 'GC_ROOT' || activeEl === 'HASH_MAP') && (
              <circle r="3" fill="#f87171" filter="url(#glowRed)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-root-map" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* HashMap -> Entries */}
          <g>
            <path
              id="path-map-entries"
              d="M 330 112 L 364 112"
              fill="none"
              stroke={activeEl === 'HASH_MAP' || activeEl === 'ENTRIES' ? '#fbbf24' : '#2e354f'}
              strokeWidth={activeEl === 'HASH_MAP' || activeEl === 'ENTRIES' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'HASH_MAP' || activeEl === 'ENTRIES' ? 'url(#arrow-yellow)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'HASH_MAP' || activeEl === 'ENTRIES' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeEl === 'HASH_MAP' || activeEl === 'ENTRIES') && (
              <circle r="3" fill="#fbbf24" filter="url(#glowYellow)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-map-entries" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Entries -> List */}
          <g>
            <path
              id="path-entries-list"
              d="M 505 112 L 534 112"
              fill="none"
              stroke={activeEl === 'ENTRIES' || activeEl === 'EVENT_LIST' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeEl === 'ENTRIES' || activeEl === 'EVENT_LIST' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'ENTRIES' || activeEl === 'EVENT_LIST' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'ENTRIES' || activeEl === 'EVENT_LIST' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeEl === 'ENTRIES' || activeEl === 'EVENT_LIST') && (
              <circle r="3" fill="#2dd4bf" filter="url(#glowCyan)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-entries-list" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'red' ? 'details-red' : 'details-yellow'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'red' ? 'card-indicator-red' : 'card-indicator-yellow'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Retained Size (Leak weight):</strong> <span style={{ color: '#f87171', fontWeight: 'bold' }}>{selectedData.retainedSize}</span></p>
        <p><strong>Shallow Size (Object footprint):</strong> {selectedData.shallowSize}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Memory Profiler Details:</strong>
            <ul>
              {selectedData.leakDetails.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any component (GC Root, HashMap, Entries, or List payload) in the leak chain above to inspect heap dominator tree pointers.
      </p>
    </div>
  );
}
