import React, { useState } from 'react';

type ElementKey = 'JDBC' | 'DRIVER' | 'CONUNDRUM' | 'WORKAROUND';

interface ElementDetails {
  title: string;
  type: 'purple' | 'cyan' | 'red' | 'green';
  scope: string;
  problem: string;
  solution: string;
  codeSnippet: string[];
}

const ELEMENT_DATA: Record<ElementKey, ElementDetails> = {
  JDBC: {
    title: 'java.sql.DriverManager (Service Provider API)',
    type: 'purple',
    scope: 'Bootstrap ClassLoader (Java Core rt.jar / base module)',
    problem: 'DriverManager is loaded by the Bootstrap loader, which sits at the root of the ClassLoader hierarchy.',
    solution: 'Must load database drivers implemented by third-party vendors (like MySQL, PostgreSQL) located in the Application ClassLoader classpath.',
    codeSnippet: [
      '// Loaded by Bootstrap ClassLoader:',
      'public class DriverManager {',
      '    static { loadInitialDrivers(); }',
      '}'
    ]
  },
  DRIVER: {
    title: 'com.mysql.cj.jdbc.Driver (Service Provider Implementation)',
    type: 'cyan',
    scope: 'Application ClassLoader (Dependency JAR / Classpath)',
    problem: 'Located in application-level classpath. The Bootstrap ClassLoader has zero visibility into files managed by child classloaders.',
    solution: 'DriverManager cannot directly load this class via standard parent delegation lookup (Class.forName() called from DriverManager fails with ClassNotFoundException).',
    codeSnippet: [
      '// Loaded by Application ClassLoader:',
      'package com.mysql.cj.jdbc;',
      'public class Driver implements java.sql.Driver { ... }'
    ]
  },
  CONUNDRUM: {
    title: 'The Parent Delegation Conundrum (Visibility Boundary)',
    type: 'red',
    scope: 'ClassLoader Delegation Architecture Violation',
    problem: 'Parent classloaders CANNOT see or load classes from child classloaders (e.g. Bootstrap ClassLoader cannot see Application ClassLoader JARs).',
    solution: 'This breaks standard Service Provider Interfaces (SPI) like JDBC, JNDI, and JAXB where core APIs are in the Java standard library but implementations are user dependencies.',
    codeSnippet: [
      '// Standard class loading fails:',
      '// Parents only search upward, never downward!',
      'BootstrapLoader -> (no visibility) -> ApplicationLoader classpath'
    ]
  },
  WORKAROUND: {
    title: 'Thread Context ClassLoader (TCCL) Workaround',
    type: 'green',
    scope: 'Thread-Local Context Class Retrieval',
    problem: 'Allows parent-level APIs to bypass standard parent delegation limits to resolve implementation classes.',
    solution: 'The DriverManager fetches the Thread Context ClassLoader (which points to the Application ClassLoader) to load the MySQL Driver implementation.',
    codeSnippet: [
      '// TCCL Workaround Code Pattern:',
      'ClassLoader tccl = Thread.currentThread().getContextClassLoader();',
      'Class<?> driverClass = Class.forName("com.mysql.cj.jdbc.Driver", true, tccl);'
    ]
  }
};

export default function SPIDiagram(): React.JSX.Element {
  const [activeEl, setActiveEl] = useState<ElementKey>('CONUNDRUM');

  const selectedData = ELEMENT_DATA[activeEl];

  const getStroke = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'purple' ? '#a855f7' : ELEMENT_DATA[key].type === 'cyan' ? '#2dd4bf' : ELEMENT_DATA[key].type === 'red' ? '#f87171' : '#4ade80';
    }
    return ELEMENT_DATA[key].type === 'purple' ? '#6b21a8' : ELEMENT_DATA[key].type === 'cyan' ? '#0891b2' : ELEMENT_DATA[key].type === 'red' ? '#991b1b' : '#15803d';
  };

  const getFill = (key: ElementKey) => {
    if (activeEl === key) {
      return ELEMENT_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : ELEMENT_DATA[key].type === 'red' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return ELEMENT_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : ELEMENT_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : ELEMENT_DATA[key].type === 'red' ? 'rgba(127, 29, 29, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 250" className="interactive-diagram-svg">
          <defs>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
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

          {/* Bootstrap Scope Subgraph */}
          <rect x="20" y="40" width="280" height="180" fill="none" stroke="rgba(168, 85, 247, 0.25)" strokeWidth="1.5" strokeDasharray="3 3" rx="10" ry="10" />
          <text x="35" y="58" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#a855f7', letterSpacing: '0.5px' }}>Bootstrap ClassLoader (Core Java)</text>

          {/* java.sql.DriverManager Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('JDBC')}>
            <rect
              x="40"
              y="90"
              width="240"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('JDBC')}
              stroke={getStroke('JDBC')}
              strokeWidth={activeEl === 'JDBC' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'JDBC' && (
              <circle cx="265" cy="102" r="4.5" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="160" y="130" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11.5, fill: '#ffffff', textAnchor: 'middle' }}>DriverManager</text>
            <text x="160" y="148" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>java.sql (API Scope)</text>
          </g>

          {/* Application Scope Subgraph */}
          <rect x="380" y="40" width="280" height="180" fill="none" stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1.5" strokeDasharray="3 3" rx="10" ry="10" />
          <text x="395" y="58" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#2dd4bf', letterSpacing: '0.5px' }}>Application ClassLoader (Classpath)</text>

          {/* MySQL Driver Implementation Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('DRIVER')}>
            <rect
              x="400"
              y="90"
              width="240"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('DRIVER')}
              stroke={getStroke('DRIVER')}
              strokeWidth={activeEl === 'DRIVER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeEl === 'DRIVER' && (
              <circle cx="625" cy="102" r="4.5" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="520" y="130" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11.5, fill: '#ffffff', textAnchor: 'middle' }}>com.mysql.cj.jdbc.Driver</text>
            <text x="520" y="148" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Vendor Implementation JAR</text>
          </g>

          {/* CONUNDRUM PATH (RED) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('CONUNDRUM')}>
            <path
              id="path-conundrum"
              d="M 280 115 L 394 115"
              fill="none"
              stroke={activeEl === 'CONUNDRUM' ? '#f87171' : '#2e354f'}
              strokeWidth={activeEl === 'CONUNDRUM' ? '2.5' : '1.5'}
              strokeDasharray="4 4"
              markerEnd={activeEl === 'CONUNDRUM' ? 'url(#arrow-red)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'CONUNDRUM' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {activeEl === 'CONUNDRUM' && (
              <circle r="3.5" fill="#f87171" filter="url(#glowRed)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-conundrum" />
                </animateMotion>
              </circle>
            )}
            <text x="340" y="105" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: activeEl === 'CONUNDRUM' ? '#f87171' : '#64748b', textAnchor: 'middle' }}>❌ Direct Load fails</text>
          </g>

          {/* WORKAROUND PATH (GREEN) */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveEl('WORKAROUND')}>
            <path
              id="path-workaround"
              d="M 280 145 C 320 180, 360 180, 394 145"
              fill="none"
              stroke={activeEl === 'WORKAROUND' ? '#4ade80' : '#2e354f'}
              strokeWidth={activeEl === 'WORKAROUND' ? '2.5' : '1.5'}
              markerEnd={activeEl === 'WORKAROUND' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeEl === 'WORKAROUND' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {activeEl === 'WORKAROUND' && (
              <circle r="3.5" fill="#4ade80" filter="url(#glowGreen)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.5s" repeatCount="indefinite">
                  <mpath href="#path-workaround" />
                </animateMotion>
              </circle>
            )}
            <text x="340" y="185" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: activeEl === 'WORKAROUND' ? '#4ade80' : '#64748b', textAnchor: 'middle' }}>✅ TCCL Workaround</text>
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
        <p><strong>Loader Scope:</strong> {selectedData.scope}</p>
        <p><strong>Visibility Issue:</strong> {selectedData.problem}</p>
        <p><strong>Workaround / Resolution:</strong> {selectedData.solution}</p>
        
        <div style={{ marginTop: '0.75rem' }}>
          <strong>JVM Code Execution:</strong>
          <pre style={{ margin: '0.4rem 0 0 0', padding: '0.5rem', background: '#07080d', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '6px', fontSize: '0.8rem', color: '#818cf8', fontFamily: 'Fira Code, monospace', overflowX: 'auto' }}>
            {selectedData.codeSnippet.join('\n')}
          </pre>
        </div>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any component or connection path (Direct Load vs TCCL Workaround) in the diagram above to inspect how JVM SPI loaders bypass visibility boundaries.
      </p>
    </div>
  );
}
