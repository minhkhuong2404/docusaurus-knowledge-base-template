import React, { useState } from 'react';

type ElementKey = 'HEAP' | 'YOUNG' | 'OLD' | 'EDEN' | 'S0' | 'S1';

interface ElementDetails {
  title: string;
  type: 'purple' | 'green' | 'blue';
  ratio: string;
  description: string;
  gcRole: string;
  tuningFlags: string[];
}

const ELEMENT_DATA: Record<ElementKey, ElementDetails> = {
  HEAP: {
    title: 'Heap Memory (GC-Managed Shared Area)',
    type: 'purple',
    ratio: '100% of Heap Allocation',
    description: 'The primary memory workspace of the JVM where all objects, class instances, and array payloads are allocated.',
    gcRole: 'Scanned continuously by minor, major, and mixed GC threads to recover unreachable blocks.',
    tuningFlags: ['-Xms (Initial Heap size)', '-Xmx (Maximum Heap size)', '-XX:MinHeapFreeRatio', '-XX:MaxHeapFreeRatio']
  },
  YOUNG: {
    title: 'Young Generation',
    type: 'blue',
    ratio: 'Typically 33% of Heap (-XX:NewRatio=2)',
    description: 'The active memory generation designated for allocating newly created objects and transient data instances.',
    gcRole: 'Collected during fast, parallel Minor GCs. Surviving objects are evacuated to Survivor spaces.',
    tuningFlags: ['-XX:NewRatio=2 (Old-to-Young ratio, default 2:1)', '-XX:NewSize', '-XX:MaxNewSize']
  },
  OLD: {
    title: 'Old Generation (Tenured)',
    type: 'purple',
    ratio: 'Typically 66% of Heap',
    description: 'The long-term memory holding persistent objects that have survived multiple minor collections and crossed the tenuring age.',
    gcRole: 'Subject to Major GCs (Full GC / CMS / G1 Old Sweep). Uses mark-sweep-compact or concurrent marking to reclaim memory.',
    tuningFlags: ['-XX:InitiatingHeapOccupancyPercent (triggers concurrent marking in G1)', '-XX:CMSInitiatingOccupancyFraction']
  },
  EDEN: {
    title: 'Eden Space (Young Generation)',
    type: 'green',
    ratio: '80% of Young Gen (-XX:SurvivorRatio=8)',
    description: 'The entry point space where all thread object allocations (via TLABs) occur.',
    gcRole: 'Evacuated completely during Minor GC. Surviving objects move to the active Survivor space.',
    tuningFlags: ['-XX:SurvivorRatio=8 (Eden-to-Survivor ratio, default 8:1:1)']
  },
  S0: {
    title: 'Survivor 0 Space (S0 / From Space)',
    type: 'green',
    ratio: '10% of Young Gen',
    description: 'One of the twin young generation survivor spaces. Holds survivor objects from the previous GC cycle.',
    gcRole: 'Acts as the source copy segment (From Space) during Minor GC cycles.',
    tuningFlags: ['-XX:MaxTenuringThreshold=15 (Maximum age before promotion to Old Gen)']
  },
  S1: {
    title: 'Survivor 1 Space (S1 / To Space)',
    type: 'green',
    ratio: '10% of Young Gen',
    description: 'The destination target young survivor space. Receives active survivors from Eden and S0.',
    gcRole: 'Acts as the target copy segment (To Space) during Minor GC cycles, then swaps roles with S0.',
    tuningFlags: ['-XX:TargetSurvivorRatio (survivor occupancy target after Minor GC)']
  }
};

export default function HeapStructureDiagram(): React.JSX.Element {
  const [activeEl, setActiveEl] = useState<ElementKey>('HEAP');

  const selectedData = ELEMENT_DATA[activeEl];

  const getStroke = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'green' ? '#4ade80' : ELEMENT_DATA[key].type === 'purple' ? '#a855f7' : '#3b82f6';
    }
    return ELEMENT_DATA[key].type === 'green' ? '#15803d' : ELEMENT_DATA[key].type === 'purple' ? '#6b21a8' : '#1d4ed8';
  };

  const getFill = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : ELEMENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    }
    return ELEMENT_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : ELEMENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : 'rgba(30, 58, 138, 0.05)';
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
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-blue"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
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

          {/* Heap Memory Node */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveEl('HEAP')}
          >
            <rect
              x="20"
              y="50"
              width="130"
              height="150"
              rx="10"
              ry="10"
              fill={getFill('HEAP')}
              stroke={getStroke('HEAP')}
              strokeWidth={activeEl === 'HEAP' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'HEAP' && (
              <circle cx="140" cy="62" r="4.5" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="85" y="120" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 13, fill: '#ffffff', textAnchor: 'middle' }}>Heap Memory</text>
            <text x="85" y="140" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>GC Managed</text>
          </g>

          {/* Young Gen Box */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveEl('YOUNG')}
          >
            <rect
              x="200"
              y="50"
              width="280"
              height="150"
              rx="10"
              ry="10"
              fill={getFill('YOUNG')}
              stroke={getStroke('YOUNG')}
              strokeWidth={activeEl === 'YOUNG' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'YOUNG' && (
              <circle cx="470" cy="62" r="4.5" fill="#3b82f6" className="interactive-diagram-pulse-dot" />
            )}
            <text x="340" y="74" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#3b82f6', textAnchor: 'middle' }}>Young Generation</text>
          </g>

          {/* Eden Space Node */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setActiveEl('EDEN'); }}
          >
            <rect
              x="215"
              y="90"
              width="90"
              height="95"
              rx="6"
              ry="6"
              fill={getFill('EDEN')}
              stroke={getStroke('EDEN')}
              strokeWidth={activeEl === 'EDEN' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="260" y="135" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Eden</text>
            <text x="260" y="152" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>~80% size</text>
          </g>

          {/* S0 Node */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setActiveEl('S0'); }}
          >
            <rect
              x="315"
              y="90"
              width="70"
              height="95"
              rx="6"
              ry="6"
              fill={getFill('S0')}
              stroke={getStroke('S0')}
              strokeWidth={activeEl === 'S0' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="350" y="135" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>S0 (From)</text>
            <text x="350" y="152" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>~10% size</text>
          </g>

          {/* S1 Node */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); setActiveEl('S1'); }}
          >
            <rect
              x="395"
              y="90"
              width="75"
              height="95"
              rx="6"
              ry="6"
              fill={getFill('S1')}
              stroke={getStroke('S1')}
              strokeWidth={activeEl === 'S1' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="432" y="135" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>S1 (To)</text>
            <text x="432" y="152" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>~10% size</text>
          </g>

          {/* Old Gen Node */}
          <g
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveEl('OLD')}
          >
            <rect
              x="510"
              y="50"
              width="170"
              height="150"
              rx="10"
              ry="10"
              fill={getFill('OLD')}
              stroke={getStroke('OLD')}
              strokeWidth={activeEl === 'OLD' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'OLD' && (
              <circle cx="670" cy="62" r="4.5" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="595" y="120" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 12, fill: '#ffffff', textAnchor: 'middle' }}>Old Gen (Tenured)</text>
            <text x="595" y="140" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Major GC Mark-Compact</text>
          </g>

          {/* FLOW CONDUITS */}
          {/* Heap -> Young */}
          <g>
            <path
              id="path-heap-young"
              d="M 150 125 L 194 125"
              fill="none"
              stroke={activeEl === 'HEAP' || activeEl === 'YOUNG' || activeEl === 'EDEN' || activeEl === 'S0' || activeEl === 'S1' ? '#3b82f6' : '#2e354f'}
              strokeWidth={activeEl === 'HEAP' || activeEl === 'YOUNG' || activeEl === 'EDEN' || activeEl === 'S0' || activeEl === 'S1' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'HEAP' || activeEl === 'YOUNG' || activeEl === 'EDEN' || activeEl === 'S0' || activeEl === 'S1' ? 'url(#arrow-blue)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'HEAP' || activeEl === 'YOUNG' || activeEl === 'EDEN' || activeEl === 'S0' || activeEl === 'S1' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeEl === 'HEAP' || activeEl === 'YOUNG' || activeEl === 'EDEN' || activeEl === 'S0' || activeEl === 'S1') && (
              <circle r="3.5" fill="#3b82f6" filter="url(#glowBlue)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.8s" repeatCount="indefinite">
                  <mpath href="#path-heap-young" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Heap -> Old */}
          <g>
            <path
              id="path-heap-old"
              d="M 150 155 C 230 220, 420 220, 504 155"
              fill="none"
              stroke={activeEl === 'HEAP' || activeEl === 'OLD' ? '#a855f7' : '#2e354f'}
              strokeWidth={activeEl === 'HEAP' || activeEl === 'OLD' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'HEAP' || activeEl === 'OLD' ? 'url(#arrow-purple)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'HEAP' || activeEl === 'OLD' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeEl === 'HEAP' || activeEl === 'OLD') && (
              <circle r="3.5" fill="#a855f7" filter="url(#glowPurple)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="2.4s" repeatCount="indefinite">
                  <mpath href="#path-heap-old" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : 'details-blue'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : 'card-indicator-blue'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Capacity Ratio:</strong> {selectedData.ratio}</p>
        <p><strong>Overview:</strong> {selectedData.description}</p>
        
        <ul>
          <li><strong>GC Role & Management:</strong> {selectedData.gcRole}</li>
          <li><strong>JVM Sizing Flags:</strong>
            <ul>
              {selectedData.tuningFlags.map((flag, i) => (
                <li key={i}>{flag}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any segment (Heap, Young Gen, Eden, S0, S1, or Old Gen) in the diagram above to inspect JVM memory sizing parameters.
      </p>
    </div>
  );
}
