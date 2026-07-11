import React, { useState } from 'react';

type NettyMemoryKey = 'NIC' | 'OS_BUFFER' | 'POOLED_DIRECT' | 'HEAP_OBJECT';

interface NettyMemoryDetails {
  title: string;
  type: 'purple' | 'cyan' | 'yellow' | 'green';
  scope: string;
  concept: string;
  keyPoints: string[];
}

const NETTY_MEM_DATA: Record<NettyMemoryKey, NettyMemoryDetails> = {
  NIC: {
    title: 'NIC Ring Buffer',
    type: 'purple',
    scope: 'Hardware Layer',
    concept: 'Receives raw packet frames from network socket interfaces.',
    keyPoints: [
      'Stores incoming byte packages directly in hardware memory registers.',
      'Triggers hardware DMA interrupts to copy frames to the kernel space.'
    ]
  },
  OS_BUFFER: {
    title: 'OS Socket Buffer',
    type: 'cyan',
    scope: 'Kernel Space Memory',
    concept: 'Copies byte streams from hardware memory to the OS TCP socket buffers.',
    keyPoints: [
      'Requires standard Linux kernel network stack socket management.',
      'Cannot be accessed directly by JVM heap arrays because GC compactors constantly relocate heap memory pointers.'
    ]
  },
  POOLED_DIRECT: {
    title: 'Pooled Direct Memory (Off-Heap)',
    type: 'yellow',
    scope: 'JVM Off-Heap Native Memory',
    concept: 'Pooled off-heap ByteBuf blocks managed by PooledByteBufAllocator.',
    keyPoints: [
      'Eliminates the intermediate copy to heap arrays, saving significant CPU cycles and GC load (Zero-Copy parser path).',
      'Leases tiny slices (e.g. 64KB) from massive 4MB native chunks to handle socket payloads.',
      '⚠️ GC BLIND SPOT: Must be released manually using byteBuf.release(). Forgetting to release leaves chunks pinned off-heap forever, leading to container OOM kills.'
    ]
  },
  HEAP_OBJECT: {
    title: 'Java Domain Objects (On-Heap)',
    type: 'green',
    scope: 'JVM Heap Space',
    concept: 'Final parsed domain objects that represent business logic payload.',
    keyPoints: [
      'Instantiated on the JVM heap once off-heap buffer payloads are parsed.',
      'Cleaned up normally by standard generational garbage collectors.'
    ]
  }
};

export default function NettyDirectMemoryDiagram(): React.JSX.Element {
  const [activeLayer, setActiveLayer] = useState<NettyMemoryKey>('POOLED_DIRECT');

  const selectedData = NETTY_MEM_DATA[activeLayer];

  const getStroke = (key: NettyMemoryKey) => {
    if (activeLayer === key) {
      return NETTY_MEM_DATA[key].type === 'purple' ? '#a855f7' : NETTY_MEM_DATA[key].type === 'cyan' ? '#2dd4bf' : NETTY_MEM_DATA[key].type === 'green' ? '#4ade80' : '#fbbf24';
    }
    return NETTY_MEM_DATA[key].type === 'purple' ? '#6b21a8' : NETTY_MEM_DATA[key].type === 'cyan' ? '#0891b2' : NETTY_MEM_DATA[key].type === 'green' ? '#15803d' : '#d97706';
  };

  const getFill = (key: NettyMemoryKey) => {
    if (activeLayer === key) {
      return NETTY_MEM_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : NETTY_MEM_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : NETTY_MEM_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    }
    return NETTY_MEM_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : NETTY_MEM_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : NETTY_MEM_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(120, 53, 4, 0.05)';
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

          {/* Legend */}
          <text x="30" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#64748b', letterSpacing: '0.5px' }}>Netty Copy Pipeline (Zero-Copy Heap Path)</text>

          {/* Layer 1: NIC */}
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
            <text x="80" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#a855f7', textAnchor: 'middle' }}>Hardware Ring</text>
          </g>

          {/* Layer 2: OS Buffer */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('OS_BUFFER')}>
            <rect
              x="180"
              y="50"
              width="130"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('OS_BUFFER')}
              stroke={getStroke('OS_BUFFER')}
              strokeWidth={activeLayer === 'OS_BUFFER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="245" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>OS Socket Buffer</text>
            <text x="245" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#2dd4bf', textAnchor: 'middle' }}>Kernel TCP buffer</text>
          </g>

          {/* Layer 3: Pooled Direct */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('POOLED_DIRECT')}>
            <rect
              x="350"
              y="50"
              width="145"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('POOLED_DIRECT')}
              stroke={getStroke('POOLED_DIRECT')}
              strokeWidth={activeLayer === 'POOLED_DIRECT' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="422.5" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Pooled ByteBuf (Off-Heap)</text>
            <text x="422.5" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#fbbf24', textAnchor: 'middle' }}>4MB Chunk Allocator</text>
          </g>

          {/* Layer 4: Heap Object */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLayer('HEAP_OBJECT')}>
            <rect
              x="535"
              y="50"
              width="125"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('HEAP_OBJECT')}
              stroke={getStroke('HEAP_OBJECT')}
              strokeWidth={activeLayer === 'HEAP_OBJECT' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="597.5" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Java Object</text>
            <text x="597.5" y="93" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>JVM Heap Space</text>
          </g>

          {/* Copy Flow Arrows */}
          <g>
            <path
              id="path-netty-nic-os"
              d="M 140 80 L 174 80"
              fill="none"
              stroke={activeLayer === 'NIC' || activeLayer === 'OS_BUFFER' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'NIC' || activeLayer === 'OS_BUFFER' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'NIC' || activeLayer === 'OS_BUFFER' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'NIC' || activeLayer === 'OS_BUFFER') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-netty-nic-os" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-netty-os-direct"
              d="M 310 80 L 344 80"
              fill="none"
              stroke={activeLayer === 'OS_BUFFER' || activeLayer === 'POOLED_DIRECT' ? '#fbbf24' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'OS_BUFFER' || activeLayer === 'POOLED_DIRECT' ? 'url(#arrow-yellow)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'OS_BUFFER' || activeLayer === 'POOLED_DIRECT' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'OS_BUFFER' || activeLayer === 'POOLED_DIRECT') && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-netty-os-direct" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-netty-direct-heap"
              d="M 495 80 L 529 80"
              fill="none"
              stroke={activeLayer === 'POOLED_DIRECT' || activeLayer === 'HEAP_OBJECT' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeLayer === 'POOLED_DIRECT' || activeLayer === 'HEAP_OBJECT' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLayer === 'POOLED_DIRECT' || activeLayer === 'HEAP_OBJECT' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeLayer === 'POOLED_DIRECT' || activeLayer === 'HEAP_OBJECT') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-netty-direct-heap" />
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
        <p><strong>Memory Scope:</strong> {selectedData.scope}</p>
        <p><strong>Overview:</strong> {selectedData.concept}</p>
        
        <ul>
          <li><strong>Off-heap Optimization Implications:</strong>
            <ul>
              {selectedData.keyPoints.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on NIC Buffer, OS Socket, Pooled ByteBuf, or Java Object above to analyze Netty off-heap allocations.
      </p>
    </div>
  );
}
