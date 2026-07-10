import React, { useState } from 'react';

type LoaderKey = 'BOOTSTRAP' | 'PLATFORM' | 'APPLICATION' | 'CUSTOM';

interface LoaderDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow';
  parent: string;
  sourcePaths: string[];
  description: string;
  delegationRule: string;
}

const LOADER_DATA: Record<LoaderKey, LoaderDetails> = {
  BOOTSTRAP: {
    title: 'Bootstrap ClassLoader (Primordial)',
    type: 'purple',
    parent: 'None (Base Native Loader)',
    sourcePaths: [
      'JDK 9+: loaded from jrt:/ filesystem (java.base module)',
      'JDK 8 and earlier: loaded from jre/lib/rt.jar, charsets.jar'
    ],
    description: 'The native VM loader written in C++ that bootstrap-loads the core runtime Java classes.',
    delegationRule: 'Highest level loader. Has no parent. If it cannot find a class, JVM throws ClassNotFoundException down the stack.'
  },
  PLATFORM: {
    title: 'Platform ClassLoader (Extension in Java 8)',
    type: 'cyan',
    parent: 'Bootstrap ClassLoader',
    sourcePaths: [
      'JDK 9+: loads platform extension modules (java.compiler, java.xml, etc.)',
      'JDK 8 and earlier: loaded from jre/lib/ext/ directory or java.ext.dirs'
    ],
    description: 'Loads extension libraries and platform-specific service interfaces.',
    delegationRule: 'Delegates upward to Bootstrap first. If Bootstrap fails to find the class, Platform checks its own path.'
  },
  APPLICATION: {
    title: 'Application ClassLoader (System ClassLoader)',
    type: 'green',
    parent: 'Platform ClassLoader',
    sourcePaths: [
      'Class paths specified by environment variable CLASSPATH',
      'Class paths specified by startup arguments -classpath or -cp',
      'Main application JAR / classes'
    ],
    description: 'Loads standard application-level classes and dependency jars.',
    delegationRule: 'Delegates upward to Platform. If Platform and Bootstrap both fail, Application searches classpath.'
  },
  CUSTOM: {
    title: 'Custom ClassLoader',
    type: 'yellow',
    parent: 'Application ClassLoader',
    sourcePaths: [
      'User-defined code routes (Database, network streams, decrypted files, hot-swap plugin dirs)'
    ],
    description: 'Developer-defined loader extending java.lang.ClassLoader to custom load classes at runtime.',
    delegationRule: 'Delegates upward to Application first. If all parent loaders fail to load the class, executes custom findClass() override logic.'
  }
};

export default function ClassLoadersDiagram(): React.JSX.Element {
  const [activeLoader, setActiveLoader] = useState<LoaderKey>('APPLICATION');

  const selectedData = LOADER_DATA[activeLoader];

  const getStroke = (key: LoaderKey) => {
    if (activeLoader === key) {
      return LOADER_DATA[key].type === 'purple' ? '#a855f7' : LOADER_DATA[key].type === 'cyan' ? '#2dd4bf' : LOADER_DATA[key].type === 'green' ? '#4ade80' : '#fbbf24';
    }
    return LOADER_DATA[key].type === 'purple' ? '#6b21a8' : LOADER_DATA[key].type === 'cyan' ? '#0891b2' : LOADER_DATA[key].type === 'green' ? '#15803d' : '#d97706';
  };

  const getFill = (key: LoaderKey) => {
    if (activeLoader === key) {
      return LOADER_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : LOADER_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : LOADER_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(251, 191, 36, 0.15)';
    }
    return LOADER_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : LOADER_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : LOADER_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(120, 53, 4, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 640 290" className="interactive-diagram-svg">
          <defs>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowYellow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Upward marker (Delegation) */}
            <marker
              id="arrow-up-purple"
              viewBox="0 0 10 10"
              refX="5"
              refY="3"
              markerWidth="5"
              markerHeight="5"
              orient="270"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-up-cyan"
              viewBox="0 0 10 10"
              refX="5"
              refY="3"
              markerWidth="5"
              markerHeight="5"
              orient="270"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-up-gray"
              viewBox="0 0 10 10"
              refX="5"
              refY="3"
              markerWidth="5"
              markerHeight="5"
              orient="270"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>

            {/* Downward marker (Resolution lookup) */}
            <marker
              id="arrow-down-yellow"
              viewBox="0 0 10 10"
              refX="5"
              refY="7"
              markerWidth="5"
              markerHeight="5"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
            </marker>
            <marker
              id="arrow-down-gray"
              viewBox="0 0 10 10"
              refX="5"
              refY="7"
              markerWidth="5"
              markerHeight="5"
              orient="90"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2e354f" />
            </marker>
          </defs>

          {/* Bootstrap ClassLoader Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLoader('BOOTSTRAP')}>
            <rect
              x="220"
              y="20"
              width="200"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('BOOTSTRAP')}
              stroke={getStroke('BOOTSTRAP')}
              strokeWidth={activeLoader === 'BOOTSTRAP' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeLoader === 'BOOTSTRAP' && (
              <circle cx="410" cy="30" r="4" fill="#a855f7" className="interactive-diagram-pulse-dot" />
            )}
            <text x="320" y="47" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Bootstrap ClassLoader</text>
          </g>

          {/* Platform ClassLoader Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLoader('PLATFORM')}>
            <rect
              x="220"
              y="90"
              width="200"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('PLATFORM')}
              stroke={getStroke('PLATFORM')}
              strokeWidth={activeLoader === 'PLATFORM' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeLoader === 'PLATFORM' && (
              <circle cx="410" cy="100" r="4" fill="#2dd4bf" className="interactive-diagram-pulse-dot" />
            )}
            <text x="320" y="117" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Platform ClassLoader</text>
          </g>

          {/* Application ClassLoader Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLoader('APPLICATION')}>
            <rect
              x="220"
              y="160"
              width="200"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('APPLICATION')}
              stroke={getStroke('APPLICATION')}
              strokeWidth={activeLoader === 'APPLICATION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeLoader === 'APPLICATION' && (
              <circle cx="410" cy="170" r="4" fill="#4ade80" className="interactive-diagram-pulse-dot" />
            )}
            <text x="320" y="187" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Application ClassLoader</text>
          </g>

          {/* Custom ClassLoader Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveLoader('CUSTOM')}>
            <rect
              x="220"
              y="230"
              width="200"
              height="45"
              rx="6"
              ry="6"
              fill={getFill('CUSTOM')}
              stroke={getStroke('CUSTOM')}
              strokeWidth={activeLoader === 'CUSTOM' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            {activeLoader === 'CUSTOM' && (
              <circle cx="410" cy="240" r="4" fill="#fbbf24" className="interactive-diagram-pulse-dot" />
            )}
            <text x="320" y="257" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Custom ClassLoader</text>
          </g>

          {/* DELEGATION ARROWS (UPWARD) */}
          <g>
            <path
              id="path-del-custom"
              d="M 335 230 L 335 208"
              fill="none"
              stroke={activeLoader === 'CUSTOM' ? '#fbbf24' : '#2e354f'}
              strokeWidth={activeLoader === 'CUSTOM' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'CUSTOM' ? 'url(#arrow-up-cyan)' : 'url(#arrow-up-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'CUSTOM' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {activeLoader === 'CUSTOM' && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-del-custom" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-del-app"
              d="M 335 160 L 335 138"
              fill="none"
              stroke={activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? 'url(#arrow-up-cyan)' : 'url(#arrow-up-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-del-app" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-del-plat"
              d="M 335 90 L 335 68"
              fill="none"
              stroke={activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? '#a855f7' : '#2e354f'}
              strokeWidth={activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? 'url(#arrow-up-purple)' : 'url(#arrow-up-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' || activeLoader === 'CUSTOM') && (
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-del-plat" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* LOOKUP ARROWS (DOWNWARD) */}
          <g>
            <path
              id="path-look-plat"
              d="M 305 65 L 305 87"
              fill="none"
              stroke={activeLoader === 'BOOTSTRAP' ? '#fbbf24' : '#2e354f'}
              strokeWidth={activeLoader === 'BOOTSTRAP' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'BOOTSTRAP' ? 'url(#arrow-down-yellow)' : 'url(#arrow-down-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'BOOTSTRAP' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {activeLoader === 'BOOTSTRAP' && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-look-plat" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-look-app"
              d="M 305 135 L 305 157"
              fill="none"
              stroke={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' ? '#fbbf24' : '#2e354f'}
              strokeWidth={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' ? 'url(#arrow-down-yellow)' : 'url(#arrow-down-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM') && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-look-app" />
                </animateMotion>
              </circle>
            )}
          </g>

          <g>
            <path
              id="path-look-cust"
              d="M 305 205 L 305 227"
              fill="none"
              stroke={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' ? '#fbbf24' : '#2e354f'}
              strokeWidth={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' ? '2.5' : '1.5'}
              markerEnd={activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' ? 'url(#arrow-down-yellow)' : 'url(#arrow-down-gray)'}
              className={`interactive-diagram-transition-path ${
                activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeLoader === 'BOOTSTRAP' || activeLoader === 'PLATFORM' || activeLoader === 'APPLICATION') && (
              <circle r="2.5" fill="#fbbf24" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-look-cust" />
                </animateMotion>
              </circle>
            )}
          </g>

          <text x="440" y="105" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8.5, fill: '#2dd4bf' }}>⬆ Delegation Request Flow</text>
          <text x="100" y="105" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8.5, fill: '#fbbf24' }}>⬇ Lookup Fallback Flow</text>
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
        <p><strong>Parent Loader:</strong> {selectedData.parent}</p>
        <p><strong>Overview:</strong> {selectedData.description}</p>
        
        <ul>
          <li><strong>Source Directories / Targets:</strong>
            <ul>
              {selectedData.sourcePaths.map((path, i) => (
                <li key={i}>{path}</li>
              ))}
            </ul>
          </li>
          <li><strong>Delegation & Scope Rules:</strong> {selectedData.delegationRule}</li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any ClassLoader in the tree to inspect its library classpath and upward parent delegation path.
      </p>
    </div>
  );
}
