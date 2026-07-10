import React, { useState } from 'react';

type StackKey = 'PLATFORM' | 'VIRTUAL' | 'FRAMES';

interface StackDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  memoryConsumed: string;
  allocationScope: string;
  explanation: string;
  characteristics: string[];
}

const STACK_DATA: Record<StackKey, StackDetails> = {
  PLATFORM: {
    title: 'Platform Thread Stack (OS Allocation)',
    type: 'purple',
    memoryConsumed: '1 MB (Fixed Size, Allocated on Startup)',
    allocationScope: 'Operating System Kernel Space / Native Virtual Memory',
    explanation: 'Standard platform threads are directly mapped to physical OS threads. The OS allocates a contiguous, fixed virtual memory block (usually 1MB) to serve as the call stack.',
    characteristics: [
      'Pre-allocated and rigid. Even if a method call only consumes 300 bytes, the full 1MB overhead remains reserved.',
      'Cannot be resized or moved easily. Requires kernel context switching to manage.',
      'Limit: Striving for 100,000 platform threads results in ~100GB of wasted memory, crashing the JVM with OutOfMemoryError.'
    ]
  },
  VIRTUAL: {
    title: 'Virtual Thread Continuation (On-Heap)',
    type: 'cyan',
    memoryConsumed: 'Dynamic (~300 to 800 Bytes average)',
    allocationScope: 'Java Virtual Machine Garbage-Collected Heap Space',
    explanation: 'Virtual threads do not map 1:1 to OS threads. Their execution states are wrapped in java.lang.internal.Continuation objects.',
    characteristics: [
      'Allocated dynamically. Stack frames only consume what they actually use (e.g. three nested method calls = ~450 bytes total).',
      'Fully garbage-collectible when the virtual thread terminates or becomes unreachable.',
      'Allows handling millions of virtual threads concurrently without exhausting OS memory.'
    ]
  },
  FRAMES: {
    title: 'Dynamic Stack Frames',
    type: 'green',
    memoryConsumed: 'Variable (Compact byte arrays)',
    allocationScope: 'Copied between Heap (Unmounted) and Carrier Stack (Mounted)',
    explanation: 'When a Virtual Thread is running, its active frames are mounted onto the carrier thread stack. When it blocks on I/O, the JVM copies only these active frame bytes back to the Heap.',
    characteristics: [
      'Frame 1: Caller execution environment (~100 Bytes)',
      'Frame 2: Intermediate processing frame (~200 Bytes)',
      'Frame 3: Current local primitives & references (~150 Bytes)'
    ]
  }
};

export default function VirtualThreadStackDiagram(): React.JSX.Element {
  const [activeStack, setActiveStack] = useState<StackKey>('VIRTUAL');

  const selectedData = STACK_DATA[activeStack];

  const getStroke = (key: StackKey) => {
    if (activeStack === key) {
      return STACK_DATA[key].type === 'purple' ? '#a855f7' : STACK_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return STACK_DATA[key].type === 'purple' ? '#6b21a8' : STACK_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: StackKey) => {
    if (activeStack === key) {
      return STACK_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : STACK_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return STACK_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : STACK_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 220" className="interactive-diagram-svg">
          {/* Left Block: Platform OS Thread Stack */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStack('PLATFORM')}>
            <rect
              x="40"
              y="30"
              width="260"
              height="160"
              rx="8"
              ry="8"
              fill={getFill('PLATFORM')}
              stroke={getStroke('PLATFORM')}
              strokeWidth={activeStack === 'PLATFORM' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeStack === 'PLATFORM' && (
              <circle cx="285" cy="42" r="4.5" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="170" y="55" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Platform Thread Stack</text>
            
            {/* Rigid 1MB OS block representation */}
            <rect x="60" y="75" width="220" height="95" fill="rgba(168, 85, 247, 0.08)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" />
            <text x="170" y="105" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Fixed 1MB OS Block</text>
            <text x="170" y="125" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>(Mostly Unused Space)</text>
            <text x="170" y="145" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#fbbf24', textAnchor: 'middle' }}>❌ Rigidity prevents scaling</text>
          </g>

          {/* Right Block: Virtual Thread Heap Continuation */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveStack('VIRTUAL')}>
            <rect
              x="380"
              y="30"
              width="260"
              height="160"
              rx="8"
              ry="8"
              fill={getFill('VIRTUAL')}
              stroke={getStroke('VIRTUAL')}
              strokeWidth={activeStack === 'VIRTUAL' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeStack === 'VIRTUAL' && (
              <circle cx="625" cy="42" r="4.5" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="500" y="55" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Virtual Thread Continuation</text>
            
            {/* Heap memory dynamic frames layout */}
            <g style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveStack('FRAMES'); }}>
              <rect x="400" y="75" width="220" height="95" fill="rgba(45, 212, 191, 0.05)" stroke="rgba(45, 212, 191, 0.2)" strokeWidth="1" />
              <text x="510" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#2dd4bf', textAnchor: 'middle' }}>Continuation (On Heap)</text>
              
              {/* Frame 1 */}
              <rect x="410" y="105" width="200" height="15" fill="rgba(74, 222, 128, 0.08)" stroke={activeStack === 'FRAMES' ? '#4ade80' : 'rgba(74, 222, 128, 0.3)'} strokeWidth="1" />
              <text x="510" y="116" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Frame 1 (~100 Bytes)</text>

              {/* Frame 2 */}
              <rect x="410" y="125" width="200" height="15" fill="rgba(74, 222, 128, 0.08)" stroke={activeStack === 'FRAMES' ? '#4ade80' : 'rgba(74, 222, 128, 0.3)'} strokeWidth="1" />
              <text x="510" y="136" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Frame 2 (~200 Bytes)</text>

              {/* Frame 3 */}
              <rect x="410" y="145" width="200" height="15" fill="rgba(74, 222, 128, 0.08)" stroke={activeStack === 'FRAMES' ? '#4ade80' : 'rgba(74, 222, 128, 0.3)'} strokeWidth="1" />
              <text x="510" y="156" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Frame 3 (~150 Bytes)</text>
            </g>
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'green' ? 'card-indicator-green' : selectedData.type === 'purple' ? 'card-indicator-purple' : selectedData.type === 'cyan' ? 'card-indicator-cyan' : ''
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Memory Footprint:</strong> <span style={{ color: '#2dd4bf', fontWeight: 'bold' }}>{selectedData.memoryConsumed}</span></p>
        <p><strong>Allocation Space:</strong> {selectedData.allocationScope}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Architecture Guidelines:</strong>
            <ul>
              {selectedData.characteristics.map((char, i) => (
                <li key={i}>{char}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on the Platform Thread Stack, Virtual Thread Continuation, or individual Heap Stack Frames above to inspect call stack footprints.
      </p>
    </div>
  );
}
