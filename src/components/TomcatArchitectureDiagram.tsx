import React, { useState } from 'react';

type NodeKey = 'ACCEPTOR' | 'POLLER' | 'WORKER_POOL' | 'DISPATCHER';

interface NodeDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'blue';
  threadModel: string;
  tuningFlag: string;
  explanation: string;
  keyPoints: string[];
}

const NODE_DATA: Record<NodeKey, NodeDetails> = {
  ACCEPTOR: {
    title: 'Tomcat Acceptor Thread',
    type: 'purple',
    threadModel: 'Single Thread (Typically 1 per connector)',
    tuningFlag: 'server.tomcat.acceptor-thread-count=1',
    explanation: 'A simple blocking thread that runs in a loop executing ServerSocketChannel.accept() to intercept new physical TCP socket connections.',
    keyPoints: [
      'Accepts new TCP sockets from the OS kernel backlog queue.',
      'Configures socket to non-blocking NIO mode, then registers it directly with one of Tomcat\'s Poller selector threads.'
    ]
  },
  POLLER: {
    title: 'Tomcat Poller Thread(s)',
    type: 'cyan',
    threadModel: 'NIO Selector Threads (Typically 2 per CPU core)',
    tuningFlag: 'server.tomcat.poller-thread-count (automatic scale)',
    explanation: 'A Java NIO Selector multiplexer loop (using epoll on Linux, kqueue on macOS) that manages thousands of concurrent open socket connections.',
    keyPoints: [
      'Monitors open channels for readable events (incoming HTTP headers or body data).',
      'Once a socket is fully readable, it detaches the channel and hands it off to a Worker thread for processing.'
    ]
  },
  WORKER_POOL: {
    title: 'Tomcat Worker Thread Pool',
    type: 'green',
    threadModel: 'Thread-Per-Request Pool (ExecutorService)',
    tuningFlag: 'server.tomcat.threads.max=200 (Default)',
    explanation: 'A pool of platform threads that carry out the actual business logic, request parsing, servlet filtering, and controller invocation.',
    keyPoints: [
      'Executes the entire lifecycle of a single request blocking on database or downstream APIs.',
      'Saturating the max-threads limit (200) stalls all future incoming connections in the OS backlog.'
    ]
  },
  DISPATCHER: {
    title: 'DispatcherServlet & MVC Pipeline',
    type: 'blue',
    threadModel: 'Runs on the borrowed Tomcat Worker Thread',
    tuningFlag: 'server.tomcat.threads.min-spare=10',
    explanation: 'The entry point of the Spring MVC web application framework. Dispatches requests to the appropriate @RestController.',
    keyPoints: [
      'Executes custom Interceptors, Spring Security chains, and jackson object serialization.',
      'Blocks on database repositories (JPA/HikariCP) or downstream APIs on the same HTTP worker thread.'
    ]
  }
};

export default function TomcatArchitectureDiagram(): React.JSX.Element {
  const [activeNode, setActiveNode] = useState<NodeKey>('WORKER_POOL');

  const selectedData = NODE_DATA[activeNode];

  const getStroke = (key: NodeKey) => {
    if (activeNode === key) {
      return NODE_DATA[key].type === 'purple' ? '#a855f7' : NODE_DATA[key].type === 'cyan' ? '#2dd4bf' : NODE_DATA[key].type === 'green' ? '#4ade80' : '#3b82f6';
    }
    return NODE_DATA[key].type === 'purple' ? '#6b21a8' : NODE_DATA[key].type === 'cyan' ? '#0891b2' : NODE_DATA[key].type === 'green' ? '#15803d' : '#1d4ed8';
  };

  const getFill = (key: NodeKey) => {
    if (activeNode === key) {
      return NODE_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : NODE_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : NODE_DATA[key].type === 'green' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(59, 130, 246, 0.15)';
    }
    return NODE_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : NODE_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : NODE_DATA[key].type === 'green' ? 'rgba(20, 83, 45, 0.05)' : 'rgba(30, 58, 138, 0.05)';
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

          {/* Title Context */}
          <text x="30" y="25" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#64748b', letterSpacing: '0.5px' }}>Tomcat Server Boundary</text>

          {/* Acceptor Thread Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveNode('ACCEPTOR')}>
            <rect
              x="30"
              y="45"
              width="150"
              height="55"
              rx="6"
              ry="6"
              fill={getFill('ACCEPTOR')}
              stroke={getStroke('ACCEPTOR')}
              strokeWidth={activeNode === 'ACCEPTOR' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="105" y="72" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Acceptor Thread</text>
            <text x="105" y="87" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#a855f7', textAnchor: 'middle' }}>ServerSocket.accept()</text>
          </g>

          {/* Poller selector Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveNode('POLLER')}>
            <rect
              x="30"
              y="140"
              width="150"
              height="55"
              rx="6"
              ry="6"
              fill={getFill('POLLER')}
              stroke={getStroke('POLLER')}
              strokeWidth={activeNode === 'POLLER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="105" y="167" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Poller Thread</text>
            <text x="105" y="182" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#2dd4bf', textAnchor: 'middle' }}>NIO epoll selector</text>
          </g>

          {/* Worker Thread Pool Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveNode('WORKER_POOL')}>
            <rect
              x="250"
              y="90"
              width="180"
              height="60"
              rx="8"
              ry="8"
              fill={getFill('WORKER_POOL')}
              stroke={getStroke('WORKER_POOL')}
              strokeWidth={activeNode === 'WORKER_POOL' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="340" y="117" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Worker Thread Pool</text>
            <text x="340" y="132" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#4ade80', textAnchor: 'middle' }}>max-threads=200</text>
          </g>

          {/* Dispatcher Servlet Node */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveNode('DISPATCHER')}>
            <rect
              x="500"
              y="90"
              width="150"
              height="60"
              rx="6"
              ry="6"
              fill={getFill('DISPATCHER')}
              stroke={getStroke('DISPATCHER')}
              strokeWidth={activeNode === 'DISPATCHER' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="575" y="117" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>DispatcherServlet</text>
            <text x="575" y="132" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#60a5fa', textAnchor: 'middle' }}>@RestController MVC</text>
          </g>

          {/* FLOW ARROWS */}
          {/* Acceptor -> Poller */}
          <g>
            <path
              id="path-acceptor-poller"
              d="M 105 100 L 105 133"
              fill="none"
              stroke={activeNode === 'ACCEPTOR' || activeNode === 'POLLER' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeNode === 'ACCEPTOR' || activeNode === 'POLLER' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeNode === 'ACCEPTOR' || activeNode === 'POLLER' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeNode === 'ACCEPTOR' || activeNode === 'POLLER') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-acceptor-poller" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Poller -> Worker Pool */}
          <g>
            <path
              id="path-poller-worker"
              d="M 180 160 L 250 135"
              fill="none"
              stroke={activeNode === 'POLLER' || activeNode === 'WORKER_POOL' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeNode === 'POLLER' || activeNode === 'WORKER_POOL' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeNode === 'POLLER' || activeNode === 'WORKER_POOL' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeNode === 'POLLER' || activeNode === 'WORKER_POOL') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-poller-worker" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Worker Pool -> Dispatcher */}
          <g>
            <path
              id="path-worker-dispatcher"
              d="M 430 120 L 493 120"
              fill="none"
              stroke={activeNode === 'WORKER_POOL' || activeNode === 'DISPATCHER' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeNode === 'WORKER_POOL' || activeNode === 'DISPATCHER' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeNode === 'WORKER_POOL' || activeNode === 'DISPATCHER' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeNode === 'WORKER_POOL' || activeNode === 'DISPATCHER') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-worker-dispatcher" />
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
        <p><strong>Thread Context Sizing:</strong> {selectedData.threadModel}</p>
        <p><strong>Tuning Parameter:</strong> <code style={{ color: '#fbbf24' }}>{selectedData.tuningFlag}</code></p>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Processing Details:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on Acceptor, Poller, Worker Pool, or DispatcherServlet above to analyze HTTP request boundaries.
      </p>
    </div>
  );
}
