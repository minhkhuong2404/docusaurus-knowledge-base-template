import React, { useState } from 'react';

type ComponentKey = 'CORE_0' | 'L1_L2' | 'L3_SHARED' | 'RAM_MAIN' | 'VISIBILITY_BUG';

interface ComponentDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow' | 'red';
  latency: string;
  explanation: string;
  keyPoints: string[];
}

const COMPONENT_DATA: Record<ComponentKey, ComponentDetails> = {
  CORE_0: {
    title: 'CPU Core 0 & Core 1 Execution Units',
    type: 'purple',
    latency: 'Blazing Fast (1-2 clock cycles, < 0.5ns)',
    explanation: 'Contains CPU registers and local execution engines where instructions are calculated. Threads run concurrently on these physical cores.',
    keyPoints: [
      'Each core reads and writes values locally. Operations here are extremely fast.',
      'Instruction reordering happens here to keep the CPU pipeline full (as-if-serial semantics).'
    ]
  },
  L1_L2: {
    title: 'L1 & L2 Local Hardware Caches',
    type: 'cyan',
    latency: 'Very Fast (~4-12 clock cycles, ~1-3ns)',
    explanation: 'Hardware memory caches private to each CPU core. They store copies of recently accessed cache lines from main memory.',
    keyPoints: [
      'Core 0 cannot directly read or write Core 1\'s L1/L2 caches.',
      'Changes to variables are written to local caches first, creating a latency barrier before they propagate down.'
    ]
  },
  L3_SHARED: {
    title: 'L3 Shared Cache (Last Level Cache - LLC)',
    type: 'green',
    latency: 'Medium (~40-60 clock cycles, ~10-15ns)',
    explanation: 'A shared cache slice available to all CPU cores on the processor die. Serves as a bridge between private core caches and physical RAM.',
    keyPoints: [
      'Acts as a synchronization point for cache coherence protocols (like MESI).',
      'Flushing local core changes to L3 makes them visible to other cores on the same chip.'
    ]
  },
  RAM_MAIN: {
    title: 'Main Memory (Physical RAM)',
    type: 'cyan',
    latency: 'Slow (~200-300 clock cycles, ~50-80ns)',
    explanation: 'The physical system memory where the global JVM Heap space resides.',
    keyPoints: [
      'Reading directly from RAM is the worst-case cache miss, stalling execution pipelines.',
      'Without memory barriers, a thread may run for millions of cycles reading stale cached variables without checking RAM.'
    ]
  },
  VISIBILITY_BUG: {
    title: 'The CPU Cache Visibility Problem',
    type: 'red',
    latency: 'N/A (Architecture Flaw)',
    explanation: 'Why Thread 1 changes are invisible to Thread 2 without synchronization.',
    keyPoints: [
      'Core 0 writes variable x = 42. The change is buffered in Core 0\'s write buffer and L1 cache.',
      'Core 1 reads x from its own L1 cache which still contains the stale value (x = 0).',
      'Fix: Declaring a variable volatile or using synchronized inserts a memory fence (barrier) that forces Core 0 to flush its store buffer and Core 1 to invalidate its local caches.'
    ]
  }
};

export default function CPUCacheHierarchyDiagram(): React.JSX.Element {
  const [activeComp, setActiveComp] = useState<ComponentKey>('VISIBILITY_BUG');

  const selectedData = COMPONENT_DATA[activeComp];

  const getStroke = (key: ComponentKey) => {
    if (activeComp === key) {
      return COMPONENT_DATA[key].type === 'purple' ? '#a855f7' : COMPONENT_DATA[key].type === 'cyan' ? '#2dd4bf' : COMPONENT_DATA[key].type === 'green' ? '#4ade80' : COMPONENT_DATA[key].type === 'red' ? '#f87171' : '#3b82f6';
    }
    return COMPONENT_DATA[key].type === 'purple' ? '#6b21a8' : COMPONENT_DATA[key].type === 'cyan' ? '#0891b2' : COMPONENT_DATA[key].type === 'green' ? '#15803d' : COMPONENT_DATA[key].type === 'red' ? '#991b1b' : '#1d4ed8';
  };

  const getFill = (key: ComponentKey) => {
    if (activeComp === key) {
      return COMPONENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : COMPONENT_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : COMPONENT_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : COMPONENT_DATA[key].type === 'red' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    }
    return COMPONENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : COMPONENT_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : COMPONENT_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : COMPONENT_DATA[key].type === 'red' ? 'rgba(127, 29, 29, 0.05)' : 'rgba(30, 58, 138, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 230" className="interactive-diagram-svg">
          <defs>
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

          {/* Core 0 Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveComp('CORE_0')}>
            <rect
              x="50"
              y="20"
              width="180"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('CORE_0')}
              stroke={getStroke('CORE_0')}
              strokeWidth={activeComp === 'CORE_0' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="140" y="45" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>CPU Core 0</text>
            
            {/* L1 Cache */}
            <rect x="70" y="55" width="140" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#0891b2" strokeWidth="1" />
            <text x="140" y="77" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>L1 & L2 (Private)</text>
          </g>

          {/* Core 1 Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveComp('CORE_0')}>
            <rect
              x="450"
              y="20"
              width="180"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('CORE_0')}
              stroke={getStroke('CORE_0')}
              strokeWidth={activeComp === 'CORE_0' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="540" y="45" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>CPU Core 1</text>
            
            {/* L1 Cache */}
            <rect x="470" y="55" width="140" height="35" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#0891b2" strokeWidth="1" />
            <text x="540" y="77" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>L1 & L2 (Private)</text>
          </g>

          {/* L3 Cache Shared Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveComp('L3_SHARED')}>
            <rect
              x="220"
              y="120"
              width="240"
              height="40"
              rx="6"
              ry="6"
              fill={getFill('L3_SHARED')}
              stroke={getStroke('L3_SHARED')}
              strokeWidth={activeComp === 'L3_SHARED' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="340" y="145" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>L3 Cache (Shared LLC)</text>
          </g>

          {/* RAM Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveComp('RAM_MAIN')}>
            <rect
              x="220"
              y="175"
              width="240"
              height="40"
              rx="6"
              ry="6"
              fill={getFill('RAM_MAIN')}
              stroke={getStroke('RAM_MAIN')}
              strokeWidth={activeComp === 'RAM_MAIN' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="340" y="200" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Main Memory (RAM)</text>
          </g>

          {/* CONNECTOR PATHS */}
          {/* Core 0 -> L3 */}
          <path
            d="M 140 100 L 260 120"
            fill="none"
            stroke="#2e354f"
            strokeWidth="1.5"
            markerEnd="url(#arrow-gray)"
          />

          {/* Core 1 -> L3 */}
          <path
            d="M 540 100 L 420 120"
            fill="none"
            stroke="#2e354f"
            strokeWidth="1.5"
            markerEnd="url(#arrow-gray)"
          />

          {/* L3 -> RAM */}
          <path
            d="M 340 160 L 340 172"
            fill="none"
            stroke="#2e354f"
            strokeWidth="1.5"
            markerEnd="url(#arrow-gray)"
          />

          {/* Visibility Problem Link (RED DOTTED LINE) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveComp('VISIBILITY_BUG')}>
            <path
              id="path-visibility"
              d="M 230 60 L 444 60"
              fill="none"
              stroke={activeComp === 'VISIBILITY_BUG' ? '#f87171' : '#2e354f'}
              strokeWidth={activeComp === 'VISIBILITY_BUG' ? '2.5' : '1.5'}
              strokeDasharray="4 4"
              markerEnd={activeComp === 'VISIBILITY_BUG' ? 'url(#arrow-red)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeComp === 'VISIBILITY_BUG' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            <text x="340" y="52" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: activeComp === 'VISIBILITY_BUG' ? '#f87171' : '#64748b', textAnchor: 'middle' }}>Stale read barrier (No volatile)</text>
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'red' ? 'details-red' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Access Latency:</strong> {selectedData.latency}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Under-The-Hood Details:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on CPU Cores, L3 Shared cache, Main RAM, or the stale read line above to diagnose JMM Visibility Bugs.
      </p>
    </div>
  );
}
