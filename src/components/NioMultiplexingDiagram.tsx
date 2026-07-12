import React, { useState } from 'react';

interface StageInfo {
  title: string;
  desc: string;
  color: string;
  detail: string;
}

const STAGES: Record<string, StageInfo> = {
  CLIENTS: {
    title: '1. Non-Blocking Channels',
    desc: 'SocketChannels represent TCP connections. Unlike blocking sockets, read/write calls return immediately.',
    color: '#38bdf8',
    detail: 'Connections do not pin one thread per connection. Instead, they are registered with a Selector with interest sets (OP_READ, OP_WRITE).',
  },
  SELECTOR: {
    title: '2. OS Selector (Epoll/Kqueue)',
    desc: 'The Selector acts as a single monitoring multiplexer. It delegates event polling to the OS kernel.',
    color: '#a78bfa',
    detail: 'Underneath, Java NIO uses efficient native syscalls like epoll_wait() (Linux) or kqueue() (BSD/macOS). The kernel monitors file descriptors without thread-polling overhead.',
  },
  THREAD: {
    title: '3. Selector Event Thread',
    desc: 'A single dedicated background thread runs the selector event loop, blocking only on select().',
    color: '#34d399',
    detail: 'The thread calls selector.select(). This blocks until at least one channel is ready. Once awake, it handles ready channels via selection keys.',
  },
  KEYS: {
    title: '4. Selection Keys Dispatch',
    desc: 'A set of SelectionKeys represents ready events. The Selector thread dispatches them to handler pools.',
    color: '#fbbf24',
    detail: 'The thread iterates through selector.selectedKeys(). It reads raw bytes into a ByteBuffer and immediately dispatches the processing to a worker thread pool (e.g. Netty EventLoop).',
  },
};

export default function NioMultiplexingDiagram(): React.JSX.Element {
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [channelEvents, setChannelEvents] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
  });

  const toggleChannelEvent = (id: number) => {
    setChannelEvents(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    setActiveStage('CLIENTS');
  };

  const handleStageClick = (stage: string) => {
    setActiveStage(prev => (prev === stage ? null : stage));
  };

  const stage = activeStage ? STAGES[activeStage] : null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span>Java NIO Selector (I/O Multiplexing) Architecture</span>
      </div>

      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 280" className="interactive-diagram-svg">
          <defs>
            <marker id="nio-arr" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 2 L 8 5 L 0 8 z" fill="rgba(148,163,184,0.4)" />
            </marker>
            <filter id="nio-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Left Side: Clients & Channels */}
          <text x="80" y="30" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#64748b', textAnchor: 'middle' }}>
            Client Sockets (Channels)
          </text>

          {[1, 2, 3].map(id => {
            const y = 60 + (id - 1) * 70;
            const isEvent = channelEvents[id];
            return (
              <g key={id} style={{ cursor: 'pointer' }} onClick={() => toggleChannelEvent(id)}>
                {/* Channel box */}
                <rect
                  x="20" y={y} width="120" height="40" rx="6"
                  fill={isEvent ? 'rgba(56,189,248,0.15)' : 'rgba(15,23,42,0.6)'}
                  stroke={isEvent ? '#38bdf8' : 'rgba(255,255,255,0.08)'}
                  strokeWidth="1.5"
                  filter={isEvent ? 'url(#nio-glow)' : ''}
                  style={{ transition: 'all 0.3s ease' }}
                />
                <text x="80" y={y + 20} style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 11, fill: isEvent ? '#38bdf8' : '#94a3b8', textAnchor: 'middle' }}>
                  SocketChannel #{id}
                </text>
                <text x="80" y={y + 32} style={{ fontFamily: 'Inter', fontSize: 8, fill: isEvent ? '#38bdf8' : '#475569', textAnchor: 'middle' }}>
                  {isEvent ? '⚡ OP_READ (Data Ready)' : 'Idle (Keep-Alive)'}
                </text>

                {/* Connection lines to Selector */}
                <path
                  d={`M 140 ${y + 20} L 280 140`}
                  fill="none"
                  stroke={isEvent ? '#38bdf8' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isEvent ? 2 : 1.2}
                  strokeDasharray={isEvent ? '5,5' : 'none'}
                  className={isEvent ? 'interactive-diagram-flowing-path' : ''}
                  style={{ transition: 'stroke 0.3s ease' }}
                />
              </g>
            );
          })}

          {/* Center: Selector multiplexer */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStageClick('SELECTOR')}>
            <rect
              x="280" y="80" width="140" height="120" rx="8"
              fill={activeStage === 'SELECTOR' ? 'rgba(167,135,250,0.15)' : 'rgba(15,23,42,0.7)'}
              stroke={activeStage === 'SELECTOR' ? '#a78bfa' : 'rgba(167,135,250,0.4)'}
              strokeWidth="2"
              style={{ transition: 'all 0.3s' }}
            />
            <text x="350" y="125" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 14, fill: '#a78bfa', textAnchor: 'middle' }}>
              Selector
            </text>
            <text x="350" y="145" style={{ fontFamily: 'Inter', fontSize: 10, fill: '#64748b', textAnchor: 'middle' }}>
              epoll_wait() loop
            </text>
            <text x="350" y="165" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#475569', textAnchor: 'middle', fontWeight: 600 }}>
              {Object.values(channelEvents).some(Boolean) ? '🔥 Active Keys Ready' : '💤 Blocked on select()'}
            </text>
          </g>

          {/* Right side: Event Thread & Handler Pool */}
          {/* Selector Thread */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStageClick('THREAD')}>
            <circle
              cx="540" cy="100" r="30"
              fill={activeStage === 'THREAD' ? 'rgba(52,211,153,0.15)' : 'rgba(15,23,42,0.6)'}
              stroke={activeStage === 'THREAD' ? '#34d399' : 'rgba(52,211,153,0.4)'}
              strokeWidth="2"
              style={{ transition: 'all 0.3s' }}
            />
            <text x="540" y="103" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#34d399', textAnchor: 'middle' }}>
              NIO-Loop
            </text>
            <text x="540" y="115" style={{ fontFamily: 'Inter', fontSize: 7, fill: '#64748b', textAnchor: 'middle' }}>
              Thread
            </text>
          </g>

          {/* Selector to Thread Arrow */}
          <line
            x1="420" y1="120" x2="505" y2="105"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="1.5"
            markerEnd="url(#nio-arr)"
          />

          {/* SelectedKeys / Dispatcher */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStageClick('KEYS')}>
            <rect
              x="480" y="170" width="120" height="46" rx="6"
              fill={activeStage === 'KEYS' ? 'rgba(251,191,36,0.15)' : 'rgba(15,23,42,0.6)'}
              stroke={activeStage === 'KEYS' ? '#fbbf24' : 'rgba(251,191,36,0.4)'}
              strokeWidth="1.5"
              style={{ transition: 'all 0.3s' }}
            />
            <text x="540" y="188" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9.5, fill: '#fbbf24', textAnchor: 'middle' }}>
              SelectedKeys
            </text>
            <text x="540" y="202" style={{ fontFamily: 'Inter', fontSize: 8, fill: '#64748b', textAnchor: 'middle' }}>
              Worker Pool Dispatch
            </text>
          </g>

          {/* Connection lines from Selector to keys */}
          <line
            x1="400" y1="180" x2="475" y2="190"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="1.5"
            markerEnd="url(#nio-arr)"
          />

          {/* Legend */}
          <text x="340" y="255" style={{ fontFamily: 'Inter', fontSize: 9, fill: '#475569', textAnchor: 'middle', fontStyle: 'italic' }}>
            💡 Click SocketChannels to simulate I/O packets. Click Selector/Thread/Keys nodes to view internals.
          </text>
        </svg>
      </div>

      {/* Details Box */}
      {stage ? (
        <div className="interactive-diagram-details-card" style={{ borderColor: `${stage.color}40`, background: `${stage.color}08`, transition: 'all 0.3s ease' }}>
          <div className="interactive-diagram-card-header">
            <h3 style={{ color: stage.color, margin: 0 }}>{stage.title}</h3>
          </div>
          <p style={{ marginTop: '8px' }}><strong>Overview:</strong> {stage.desc}</p>
          <p style={{ marginTop: '8px', fontSize: '0.9rem', color: 'var(--ifm-color-content-secondary)' }}>
            {stage.detail}
          </p>
        </div>
      ) : (
        <p className="interactive-diagram-helper-text">💡 Click on any component or channel in the diagram to inspect its event-driven behavior.</p>
      )}
    </div>
  );
}
