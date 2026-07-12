import React, { useState } from 'react';

type NettyKey = 'BOSS' | 'WORKER_GROUP' | 'PIPELINE';

interface NettyDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  sizing: string;
  concept: string;
  keyPoints: string[];
}

const NETTY_DATA: Record<NettyKey, NettyDetails> = {
  BOSS: {
    title: 'Boss EventLoop Group',
    type: 'purple',
    sizing: 'Typically 1 thread (per socket port bind)',
    concept: 'Main socket acceptor engine.',
    keyPoints: [
      'Executes a Selector.select() block to detect incoming TCP SYN packets.',
      'Instantly accepts connection, wraps it in a Channel (SocketChannel), and registers it with a Worker EventLoop.',
      'Does not do any parsing or data processing, which avoids bottlenecking the connection rate.'
    ]
  },
  WORKER_GROUP: {
    title: 'Worker EventLoop Group',
    type: 'cyan',
    sizing: 'Default = 2 × CPU Core Count',
    concept: 'Non-blocking multi-connection multiplexer pool.',
    keyPoints: [
      'Each Worker EventLoop runs a single thread executing a Selector.select() loop in an infinite cycle.',
      'A single Worker EventLoop manages many Channels concurrently (Thread affinity keeps L1/L2 caches hot).',
      'Fires read and write socket events and triggers the ChannelPipeline.'
    ]
  },
  PIPELINE: {
    title: 'ChannelPipeline & Handler Chain',
    type: 'green',
    sizing: '1 Pipeline per active Channel',
    concept: 'Assembly line for data transformations.',
    keyPoints: [
      'Decoder: Converts raw byte streams into domain objects (e.g. ByteBuf to HttpRequest).',
      'Idle State Handler: Detects heartbeats or socket read timeouts.',
      'Business Logic Handler: Invokes controller logic. Must delegate long-running or blocking database/external service calls to a separate thread pool to keep the EventLoop free.'
    ]
  }
};

export default function NettyArchitectureDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NettyKey>('WORKER_GROUP');

  const selectedData = NETTY_DATA[activeTab];

  const getStroke = (key: NettyKey) => {
    if (activeTab === key) {
      return NETTY_DATA[key].type === 'purple' ? '#a855f7' : NETTY_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return NETTY_DATA[key].type === 'purple' ? '#6b21a8' : NETTY_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: NettyKey) => {
    if (activeTab === key) {
      return NETTY_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : NETTY_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return NETTY_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : NETTY_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
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

          {/* Boss EventLoop */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('BOSS')}>
            <rect
              x="30"
              y="25"
              width="240"
              height="55"
              rx="6"
              ry="6"
              fill={getFill('BOSS')}
              stroke={getStroke('BOSS')}
              strokeWidth={activeTab === 'BOSS' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="150" y="47" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Boss EventLoop</text>
            <text x="150" y="62" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7.5, fill: '#a855f7', textAnchor: 'middle' }}>Selector.select() → Accept TCP</text>
          </g>

          {/* Workers EventLoop Group */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('WORKER_GROUP')}>
            <rect
              x="30"
              y="125"
              width="240"
              height="80"
              rx="6"
              ry="6"
              fill={getFill('WORKER_GROUP')}
              stroke={getStroke('WORKER_GROUP')}
              strokeWidth={activeTab === 'WORKER_GROUP' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="150" y="145" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Worker EventLoopGroup</text>
            
            {/* Thread lists */}
            <rect x="45" y="157" width="60" height="35" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="75" y="170" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#2dd4bf', textAnchor: 'middle' }}>Loop 1</text>
            <text x="75" y="182" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#94a3b8', textAnchor: 'middle' }}>[fd1, fd4]</text>

            <rect x="120" y="157" width="60" height="35" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="150" y="170" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#2dd4bf', textAnchor: 'middle' }}>Loop 2</text>
            <text x="150" y="182" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#94a3b8', textAnchor: 'middle' }}>[fd2, fd5]</text>

            <rect x="195" y="157" width="60" height="35" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.06)" />
            <text x="225" y="170" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#2dd4bf', textAnchor: 'middle' }}>Loop 3</text>
            <text x="225" y="182" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#94a3b8', textAnchor: 'middle' }}>[fd3, fd6]</text>
          </g>

          {/* Channel Pipeline */}
          <g style={{ cursor: 'pointer' }} onClick={() => setActiveTab('PIPELINE')}>
            <rect
              x="360"
              y="55"
              width="290"
              height="120"
              rx="8"
              ry="8"
              fill={getFill('PIPELINE')}
              stroke={getStroke('PIPELINE')}
              strokeWidth={activeTab === 'PIPELINE' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="505" y="78" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>ChannelPipeline (Handler Chain)</text>
            
            {/* Pipeline blocks */}
            <rect x="375" y="95" width="60" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <text x="405" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>Decoder</text>
            <text x="405" y="135" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#cbd5e1', textAnchor: 'middle' }}>bytes $\rightarrow$ req</text>

            <rect x="445" y="95" width="60" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <text x="475" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>Encoder</text>
            <text x="475" y="135" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#cbd5e1', textAnchor: 'middle' }}>resp $\rightarrow$ bytes</text>

            <rect x="515" y="95" width="60" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <text x="545" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>IdleState</text>
            <text x="545" y="135" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Heartbeat</text>

            <rect x="585" y="95" width="55" height="60" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
            <text x="612" y="120" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>Business</text>
            <text x="612" y="135" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 6.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Logic</text>
          </g>

          {/* Boss -> Worker Handoff Arrow */}
          <g>
            <path
              id="path-boss-worker"
              d="M 150 80 L 150 118"
              fill="none"
              stroke={activeTab === 'BOSS' || activeTab === 'WORKER_GROUP' ? '#2dd4bf' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeTab === 'BOSS' || activeTab === 'WORKER_GROUP' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeTab === 'BOSS' || activeTab === 'WORKER_GROUP' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeTab === 'BOSS' || activeTab === 'WORKER_GROUP') && (
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-boss-worker" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Worker -> Pipeline Arrow */}
          <g>
            <path
              id="path-worker-pipeline"
              d="M 270 160 L 353 135"
              fill="none"
              stroke={activeTab === 'WORKER_GROUP' || activeTab === 'PIPELINE' ? '#4ade80' : '#2e354f'}
              strokeWidth="1.5"
              markerEnd={activeTab === 'WORKER_GROUP' || activeTab === 'PIPELINE' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeTab === 'WORKER_GROUP' || activeTab === 'PIPELINE' ? 'interactive-diagram-flowing-path' : ''
              }`}
            />
            {(activeTab === 'WORKER_GROUP' || activeTab === 'PIPELINE') && (
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-worker-pipeline" />
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
        <p><strong>Capacity / Sizing:</strong> {selectedData.sizing}</p>
        <p><strong>Core Concept:</strong> <span style={{ fontWeight: 'bold' }}>{selectedData.concept}</span></p>
        
        <ul>
          <li><strong>Architecture Guidelines:</strong>
            <ul>
              {selectedData.keyPoints.map((pt, i) => (
                <li key={i}>{pt}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on Boss Group, Worker Group, or the ChannelPipeline block to inspect Netty socket routing internals.
      </p>
    </div>
  );
}
