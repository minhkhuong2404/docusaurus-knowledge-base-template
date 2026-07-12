import React, { useState } from 'react';

type ElementKey = 'MAIN_FRAME' | 'SAY_HELLO_FRAME' | 'PRIMITIVES' | 'REFERENCES';

interface ElementDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'blue';
  lifetime: string;
  footprint: string;
  explanation: string;
  details: string[];
}

const ELEMENT_DATA: Record<ElementKey, ElementDetails> = {
  MAIN_FRAME: {
    title: 'main() Stack Frame',
    type: 'purple',
    lifetime: 'Active for the entire lifespan of the application main thread',
    footprint: 'Variable (Depends on compiled local variables array size)',
    explanation: 'The entry point stack frame pushed onto the thread stack when the main thread starts execution.',
    details: [
      'Stores local variable count (primitive value 10).',
      'Stores reference pointer label (points to String literal "Java" in the Heap Pool).',
      'Stores reference pointer p (points to Person instance on the Heap).'
    ]
  },
  SAY_HELLO_FRAME: {
    title: 'p.sayHello() Stack Frame',
    type: 'cyan',
    lifetime: 'Transient (Instantly destroyed when method returns)',
    footprint: 'Very small (Holds method parameters and local execution context)',
    explanation: 'Pushed on top of the stack when sayHello() is invoked. Wiped from memory instantly when sayHello() exits.',
    details: [
      'Stores local primitive variable greetingCount (value 1).',
      'Stores reference pointer msg (points to String literal "Hi" in Heap String Pool).',
      'Holds return address link pointing back to main() instruction registry so CPU knows where to resume.'
    ]
  },
  PRIMITIVES: {
    title: 'Primitives (int count = 10, int greetingCount = 1)',
    type: 'green',
    lifetime: 'Linked directly to their hosting stack frame lifespan',
    footprint: '4 Bytes (int datatype)',
    explanation: 'Primitive variables (boolean, char, byte, short, int, long, float, double) declared locally in methods are stored directly inside the Stack Frame.',
    details: [
      'Zero pointer dereferencing overhead — values are fetched directly by CPU registers.',
      'Always initialized or set explicitly; no default null values are permitted on the stack.'
    ]
  },
  REFERENCES: {
    title: 'Object References (label, p, msg)',
    type: 'blue',
    lifetime: 'Reference pointer dies when frame pops; payload object remains on Heap',
    footprint: '8 Bytes (64-bit native pointer) | 4 Bytes (with Compressed OOPs)',
    explanation: 'Local variables holding class types do NOT contain the actual object data. They store a memory address pointer (reference) pointing to the object location in the Heap.',
    details: [
      'p points to a Person object instance.',
      'label and msg point to String intern instances inside the Heap String Pool.',
      'References are popped automatically on method exit, but the heap object stays alive until the GC reclaims it.'
    ]
  }
};

export default function StackFrameDiagram(): React.JSX.Element {
  const [activeEl, setActiveEl] = useState<ElementKey>('MAIN_FRAME');

  const selectedData = ELEMENT_DATA[activeEl];

  const getStroke = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'purple' ? '#a855f7' : ELEMENT_DATA[key].type === 'cyan' ? '#2dd4bf' : ELEMENT_DATA[key].type === 'green' ? '#4ade80' : '#3b82f6';
    }
    return ELEMENT_DATA[key].type === 'purple' ? '#6b21a8' : ELEMENT_DATA[key].type === 'cyan' ? '#0891b2' : ELEMENT_DATA[key].type === 'green' ? '#15803d' : '#1d4ed8';
  };

  const getFill = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : ELEMENT_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    }
    return ELEMENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : ELEMENT_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(30, 58, 138, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 540 220" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-down"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="5"
              markerHeight="5"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-down-gray"
              viewBox="0 0 10 10"
              refX="5"
              refY="6"
              markerWidth="5"
              markerHeight="5"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* Thread Stack Box */}
          <rect x="10" y="10" width="520" height="200" fill="none" stroke="#2dd4bf" strokeWidth="1" strokeDasharray="3 3" rx="10" ry="10" />
          <text x="25" y="26" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#2dd4bf', letterSpacing: '0.5px' }}>Thread Stack (Growing Downward)</text>

          {/* main() stack frame */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('MAIN_FRAME')}>
            <rect
              x="30"
              y="40"
              width="480"
              height="65"
              rx="6"
              ry="6"
              fill={getFill('MAIN_FRAME')}
              stroke={getStroke('MAIN_FRAME')}
              strokeWidth={activeEl === 'MAIN_FRAME' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'MAIN_FRAME' && (
              <circle cx="495" cy="50" r="4" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="45" y="60" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff' }}>main() Frame</text>
            <text
              x="45"
              y="85"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: activeEl === 'PRIMITIVES' ? '#4ade80' : '#94a3b8', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setActiveEl('PRIMITIVES'); }}
            >
              • int count = 10
            </text>
            <text
              x="200"
              y="85"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: activeEl === 'REFERENCES' ? '#3b82f6' : '#94a3b8', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setActiveEl('REFERENCES'); }}
            >
              • String label = 0xABC...
            </text>
            <text
              x="390"
              y="85"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: activeEl === 'REFERENCES' ? '#3b82f6' : '#94a3b8', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setActiveEl('REFERENCES'); }}
            >
              • Person p = 0xDEF...
            </text>
          </g>

          {/* p.sayHello() stack frame */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('SAY_HELLO_FRAME')}>
            <rect
              x="30"
              y="135"
              width="480"
              height="65"
              rx="6"
              ry="6"
              fill={getFill('SAY_HELLO_FRAME')}
              stroke={getStroke('SAY_HELLO_FRAME')}
              strokeWidth={activeEl === 'SAY_HELLO_FRAME' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'SAY_HELLO_FRAME' && (
              <circle cx="495" cy="145" r="4" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="45" y="155" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff' }}>p.sayHello() Frame</text>
            <text
              x="45"
              y="180"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: activeEl === 'PRIMITIVES' ? '#4ade80' : '#94a3b8', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setActiveEl('PRIMITIVES'); }}
            >
              • int greetingCount = 1
            </text>
            <text
              x="200"
              y="180"
              style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 9.5, fill: activeEl === 'REFERENCES' ? '#3b82f6' : '#94a3b8', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setActiveEl('REFERENCES'); }}
            >
              • String msg = 0x123...
            </text>
            <text x="390" y="180" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 9, fill: '#cbd5e1' }}>• [return addr → main()]</text>
          </g>

          <g>
            <path
              id="path-stack-growth"
              d="M 270 105 L 270 130"
              fill="none"
              stroke={activeEl === 'MAIN_FRAME' || activeEl === 'SAY_HELLO_FRAME' ? '#a855f7' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeEl === 'MAIN_FRAME' || activeEl === 'SAY_HELLO_FRAME' ? 'url(#arrow-down)' : 'url(#arrow-down-gray)'}
              className={`interactive-diagram-transition-path ${activeEl === 'MAIN_FRAME' || activeEl === 'SAY_HELLO_FRAME' ? 'interactive-diagram-flowing-path' : ''}`}
            />
            {(activeEl === 'MAIN_FRAME' || activeEl === 'SAY_HELLO_FRAME') && (
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-stack-growth" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'blue' ? 'details-blue' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Lifespan Context:</strong> {selectedData.lifetime}</p>
        <p><strong>Memory Footprint:</strong> {selectedData.footprint}</p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Frame Details:</strong>
            <ul>
              {selectedData.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any frame block (main() frame, sayHello() frame) or specific local variables in the stack above to inspect execution memory footprints.
      </p>
    </div>
  );
}
