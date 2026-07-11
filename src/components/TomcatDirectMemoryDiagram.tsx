import React, { useState } from 'react';

type MemoryKey = 'NIC' | 'OS_SOCKET' | 'OFF_HEAP' | 'HEAP_BUFFER';

interface MemoryDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow';
  layer: string;
  explanation: string;
  keyPoints: string[];
}

const MEMORY_DATA: Record<MemoryKey, MemoryDetails> = {
  NIC: {
    title: 'NIC (Network Interface Card) Buffer',
    type: 'purple',
    layer: 'Hardware Layer',
    explanation: 'The physical network card receives incoming Ethernet frames over the wire and writes them into a hardware ring buffer.',
    keyPoints: [
      'Operates completely on raw packet stream bytes.',
      'Interrupts the OS kernel once frames are successfully stored.'
    ]
  },
  OS_SOCKET: {
    title: 'OS Socket Buffer (Kernel Space)',
    type: 'cyan',
    layer: 'Kernel Memory Space',
    explanation: 'The operating system reads the network packets, parses TCP headers, and copies the stream payload into the kernel socket buffer.',
    keyPoints: [
      'Managed directly by the OS network stack.',
      'Cannot be accessed directly by JVM heap pointers because the Garbage Collector relocates objects, which would corrupt native DMA (Direct Memory Access) transfers.'
    ]
  },
  OFF_HEAP: {
    title: 'Temporary Direct Buffer (Off-Heap)',
    type: 'yellow',
    layer: 'JVM Native Memory Space',
    explanation: 'Tomcat allocates off-heap Direct Buffers to bridge the gap. Data is copied from kernel space directly to this stable native memory block.',
    keyPoints: [
      'Eliminates Garbage Collector relocation blockages during socket reads.',
      '⚠️ THE THREAD-LOCAL TRAP: sun.nio.ch.Util caches the largest buffer ever used by a thread. A 50MB file read leaves a persistent 50MB native cache per worker thread, causing container OOM crashes!',
      'Remediation: Configure -Djdk.nio.maxCachedBufferSize=262144 (256KB) to enforce clean buffer eviction.'
    ]
  },
  HEAP_BUFFER: {
    title: 'Heap Byte Array & Java Objects',
    type: 'green',
    layer: 'JVM Heap Space',
    explanation: 'Off-heap direct buffer bytes are copied into standard Java heap arrays (byte[]) so Tomcat can parse HTTP headers/body and instantiate controller parameters.',
    keyPoints: [
      'Subject to full garbage collection tracing and compacting.',
      'Ready for application business logic manipulation.'
    ]
  }
};

export default function TomcatDirectMemoryDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<MemoryKey>('OFF_HEAP');

  const selectedData = MEMORY_DATA[activeLayer];

  const getStroke = (key: MemoryKey) => {
    if (activeLayer === key) {
      return MEMORY_DATA[key].type === 'purple' ? '#a855f7' : MEMORY_DATA[key].type === 'cyan' ? '#2dd4bf' : MEMORY_DATA[key].type === 'green' ? '#4ade80' : '#fbbf24';
    }
    return MEMORY_DATA[key].type === 'purple' ? '#6b21a8' : MEMORY_DATA[key].type === 'cyan' ? '#0891b2' : MEMORY_DATA[key].type === 'green' ? '#15803d' : '#d97706';
  };

  const getFill = (key: MemoryKey) => {
    if (activeLayer === key) {
      return MEMORY_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : MEMORY_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : MEMORY_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    }
    return MEMORY_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : MEMORY_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : MEMORY_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(120, 53, 4, 0.05)';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
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
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
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

          {/* Physical Layer: NIC */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('NIC')}>
            <rect
              x="20"
              y="50"
              width="120"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('NIC')}
              stroke={getStroke('NIC')}
              strokeWidth={activeLayer === 'NIC' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="80" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>NIC Buffer</text>
            <text x="80" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#a855f7', textAnchor: 'middle' }}>Ethernet RJ-45</text>
          </g>

          {/* Kernel Layer: OS Socket Buffer */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('OS_SOCKET')}>
            <rect
              x="180"
              y="50"
              width="130"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('OS_SOCKET')}
              stroke={getStroke('OS_SOCKET')}
              strokeWidth={activeLayer === 'OS_SOCKET' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="245" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>OS Socket Buffer</text>
            <text x="245" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>Kernel Space</text>
          </g>

          {/* Native Layer: Off-heap Buffer */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('OFF_HEAP')}>
            <rect
              x="350"
              y="50"
              width="140"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('OFF_HEAP')}
              stroke={getStroke('OFF_HEAP')}
              strokeWidth={activeLayer === 'OFF_HEAP' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="415" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Direct Buffer (Off-Heap)</text>
            <text x="415" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#fbbf24', textAnchor: 'middle' }}>sun.nio.ch.Util Cache</text>
          </g>

          {/* Heap Layer: On-heap Buffer */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('HEAP_BUFFER')}>
            <rect
              x="530"
              y="50"
              width="130"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('HEAP_BUFFER')}
              stroke={getStroke('HEAP_BUFFER')}
              strokeWidth={activeLayer === 'HEAP_BUFFER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="595" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Heap Byte Array</text>
            <text x="595" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>JVM GC Managed</text>
          </g>

          {/* Copy Flow Arrows */}
          {/* NIC -> OS Socket */}
          <g>
            <path
              id="path-nic-os"
              d="M 140 80 L 174 80"
              fill="none"
              stroke={activeLayer === 'NIC' || activeLayer === 'OS_SOCKET' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'NIC' || activeLayer === 'OS_SOCKET' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'NIC' || activeLayer === 'OS_SOCKET' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'NIC' || activeLayer === 'OS_SOCKET') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-nic-os" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* OS Socket -> Off-heap */}
          <g>
            <path
              id="path-os-offheap"
              d="M 310 80 L 344 80"
              fill="none"
              stroke={activeLayer === 'OS_SOCKET' || activeLayer === 'OFF_HEAP' ? '#fbbf24' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'OS_SOCKET' || activeLayer === 'OFF_HEAP' ? 'url(#arrow-yellow)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'OS_SOCKET' || activeLayer === 'OFF_HEAP' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'OS_SOCKET' || activeLayer === 'OFF_HEAP') && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-os-offheap" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Off-heap -> Heap */}
          <g>
            <path
              id="path-offheap-heap"
              d="M 490 80 L 524 80"
              fill="none"
              stroke={activeLayer === 'OFF_HEAP' || activeLayer === 'HEAP_BUFFER' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'OFF_HEAP' || activeLayer === 'HEAP_BUFFER' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'OFF_HEAP' || activeLayer === 'HEAP_BUFFER' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'OFF_HEAP' || activeLayer === 'HEAP_BUFFER') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-offheap-heap" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'yellow' ? 'details-yellow' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'yellow' ? 'card-indicator-yellow' : 'card-indicator-cyan'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Memory Domain:</strong> {selectedData.layer}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Direct Memory copy pipeline implications:</strong>
            <ul>
              {selectedData.keyPoints.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on NIC, OS Socket, Off-Heap, or Heap boxes above to explore off-heap memory leak gotchas.
      </p>
    </div>
  );
}
