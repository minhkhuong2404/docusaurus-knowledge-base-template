import React, { useState } from 'react';

type SectionKey = 'HTTP_SERVER' | 'DATABASE_ACCESS' | 'APP_EXECUTORS';

interface SectionDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  pools: string[];
  explanation: string;
  keyPoints: string[];
}

const SECTION_DATA: Record<SectionKey, SectionDetails> = {
  HTTP_SERVER: {
    title: 'HTTP Web Server Thread Pools',
    type: 'purple',
    pools: ['Tomcat Thread Pool (Default: max=200)', 'Netty EventLoopGroup (Default: 2 × Cores)'],
    explanation: 'The front door of your web application. Responsible for handling incoming network requests (TCP connections), reading data, and dispatching requests into Spring controller mappings.',
    keyPoints: [
      'Tomcat: Thread-per-request model. Blocks spare threads during I/O blockages.',
      'Netty: Non-blocking EventLoop model. Uses few threads to manage thousands of active requests.'
    ]
  },
  DATABASE_ACCESS: {
    title: 'Database Connection Pools',
    type: 'cyan',
    pools: ['HikariCP Connection Pool (JDBC)', 'R2DBC Connection Pool (Reactive)'],
    explanation: 'Coordinates raw socket connections to SQL databases. Since creating physical DB connections takes ~10-100ms, pools cache pre-opened connections so threads can borrow and return them instantly.',
    keyPoints: [
      'Connection pool size is typically much smaller than HTTP thread count (e.g. 10-30 connections vs 200 HTTP worker threads).',
      'If pool is empty, threads block or yield until another thread returns its borrowed connection.'
    ]
  },
  APP_EXECUTORS: {
    title: 'Application Internal Executors',
    type: 'green',
    pools: ['@Async Executor (TaskExecutor)', '@Scheduled ThreadPool (Cron/Timers)', 'ForkJoinPool (parallelStream/CompletableFuture)', 'Virtual Thread Executor (Loom)'],
    explanation: 'Dedicated internal pools configured to run parallel CPU-bound work, background scheduler cron tasks, asynchronous event handlers, and task queues.',
    keyPoints: [
      '@Async: Offloads heavy computation from HTTP workers to prevent bottlenecking server threads.',
      'ForkJoinPool: Leverages work-stealing queues to maximize multiple core utilization on bulk operations.'
    ]
  }
};

export default function AppServerThreadTopologyDiagram(): React.JSX.Element {
  const [activeSec, setActiveSec] = useState<SectionKey>('HTTP_SERVER');

  const selectedData = SECTION_DATA[activeSec];

  const getStroke = (key: SectionKey) => {
    if (activeSec === key) {
      return SECTION_DATA[key].type === 'purple' ? '#a855f7' : SECTION_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return SECTION_DATA[key].type === 'purple' ? '#6b21a8' : SECTION_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: SectionKey) => {
    if (activeSec === key) {
      return SECTION_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : SECTION_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return SECTION_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : SECTION_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
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

          {/* Group 1: HTTP Servers */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveSec('HTTP_SERVER')}>
            <rect
              x="20"
              y="20"
              width="280"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('HTTP_SERVER')}
              stroke={getStroke('HTTP_SERVER')}
              strokeWidth={activeSec === 'HTTP_SERVER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="160" y="40" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>HTTP Web Servers</text>
            
            {/* Sub pools */}
            <rect x="35" y="52" width="115" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="92.5" y="73" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#a855f7', textAnchor: 'middle' }}>Tomcat (BIO/NIO)</text>
            
            <rect x="170" y="52" width="115" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="227.5" y="73" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#a855f7', textAnchor: 'middle' }}>Netty (EventLoop)</text>
          </g>

          {/* Group 2: DB Access */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveSec('DATABASE_ACCESS')}>
            <rect
              x="380"
              y="20"
              width="280"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('DATABASE_ACCESS')}
              stroke={getStroke('DATABASE_ACCESS')}
              strokeWidth={activeSec === 'DATABASE_ACCESS' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="520" y="40" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Database Connection Pools</text>

            {/* Sub pools */}
            <rect x="395" y="52" width="115" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="452.5" y="73" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#2dd4bf', textAnchor: 'middle' }}>HikariCP (JDBC)</text>

            <rect x="530" y="52" width="115" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="587.5" y="73" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#2dd4bf', textAnchor: 'middle' }}>R2DBC Pool (Reactive)</text>
          </g>

          {/* Group 3: App Executors */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveSec('APP_EXECUTORS')}>
            <rect
              x="20"
              y="130"
              width="640"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('APP_EXECUTORS')}
              stroke={getStroke('APP_EXECUTORS')}
              strokeWidth={activeSec === 'APP_EXECUTORS' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="340" y="148" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Application Thread Pools (TaskExecutor & Schedulers)</text>

            {/* Sub pools */}
            <rect x="35" y="160" width="135" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="102.5" y="181" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>@Async Executor</text>

            <rect x="185" y="160" width="135" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="252.5" y="181" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>@Scheduled Pool</text>

            <rect x="335" y="160" width="135" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="402.5" y="181" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>ForkJoinPool (Streams)</text>

            <rect x="485" y="160" width="160" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="565" y="181" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>Virtual Thread Executor</text>
          </g>

          {/* Connectors */}
          {/* Server -> DB */}
          <g>
            <path
              id="path-sec-db"
              d="M 300 60 L 374 60"
              fill="none"
              stroke={activeSec === 'HTTP_SERVER' || activeSec === 'DATABASE_ACCESS' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeSec === 'HTTP_SERVER' || activeSec === 'DATABASE_ACCESS' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeSec === 'HTTP_SERVER' || activeSec === 'DATABASE_ACCESS' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeSec === 'HTTP_SERVER' || activeSec === 'DATABASE_ACCESS') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-sec-db" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Server -> Executors */}
          <g>
            <path
              id="path-sec-exec"
              d="M 160 100 L 160 124"
              fill="none"
              stroke={activeSec === 'HTTP_SERVER' || activeSec === 'APP_EXECUTORS' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeSec === 'HTTP_SERVER' || activeSec === 'APP_EXECUTORS' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeSec === 'HTTP_SERVER' || activeSec === 'APP_EXECUTORS' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeSec === 'HTTP_SERVER' || activeSec === 'APP_EXECUTORS') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-sec-exec" />
                </animateMotion>
              </circle>
            )}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Configured Pools:</strong>
            <ul>
              {selectedData.pools.map((p, i) => (
                <li key={i}><code style={{ color: '#fbbf24' }}>{p}</code></li>
              ))}
            </ul>
          </li>
          <li style={{ marginTop: '6px' }}><strong>Threading Impact:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on HTTP Web Servers, Database Connection Pools, or Application Thread Pools above to trace JVM threading boundaries.
      </p>
    </div>
  );
}
