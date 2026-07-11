import React, { useState } from 'react';

type ModelKey = 'TOMCAT' | 'NETTY';

interface ModelDetails {
  title: string;
  type: 'purple' | 'cyan';
  threadsNeeded: string;
  maxConnections: string;
  mechanics: string;
  bullets: string[];
}

const MODEL_DATA: Record<ModelKey, ModelDetails> = {
  TOMCAT: {
    title: 'Traditional Tomcat Model: 1 Thread = 1 Connection',
    type: 'purple',
    threadsNeeded: 'High (e.g. 200 Threads)',
    maxConnections: 'Capped at Thread Pool Size (typically 200 concurrent)',
    mechanics: 'Thread-Per-Request blocking model.',
    bullets: [
      'Each incoming HTTP connection is allocated a dedicated platform thread from the executor pool.',
      'The thread is physically blocked during socket reads, writes, and database query roundtrips.',
      'Under heavy load, threads consume ~1MB of heap stack each, leading to severe RAM exhaustions and OS context-switching overheads.'
    ]
  },
  NETTY: {
    title: 'Netty Model: 1 Thread = Thousands of Connections',
    type: 'cyan',
    threadsNeeded: 'Low (e.g. 1 Thread per CPU core)',
    maxConnections: 'Virtually unlimited (easily 10,000+ per instance)',
    mechanics: 'Non-blocking Selector epoll/kqueue multiplexing model.',
    bullets: [
      'EventLoop threads are never blocked. Sockets register file descriptors (FD) with Java NIO selectors.',
      'A single thread loops continuously, processing read/write events across multiple active channels.',
      'Memory footprint is extremely low (~1KB per socket channel state), allowing massive concurrency scales.'
    ]
  }
};

export default function NettyThreadModelDiagram(): React.JSX.Element {
  const [model, setModel] = useState<ModelKey>('TOMCAT');

  const selectedData = MODEL_DATA[model];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Control Tabs */}
      <div 
        className="interactive-diagram-card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.6rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span 
            className={`interactive-diagram-indicator-dot ${model === 'TOMCAT' ? 'card-indicator-purple' : 'card-indicator-cyan'}`} 
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: model === 'TOMCAT' ? '#a855f7' : '#2dd4bf' }}
          />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: model === 'TOMCAT' ? '#a855f7' : '#2dd4bf' }}>
            🧵 Threading Layout: {model === 'TOMCAT' ? 'Tomcat (Blocking)' : 'Netty (Multiplexed)'}
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setModel('TOMCAT')}
            style={{
              background: model === 'TOMCAT' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: model === 'TOMCAT' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: model === 'TOMCAT' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Tomcat Model
          </button>
          <button 
            onClick={() => setModel('NETTY')}
            style={{
              background: model === 'NETTY' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: model === 'NETTY' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: model === 'NETTY' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Netty Model
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 200" className="interactive-diagram-svg">
          <defs>
            <marker
              id="arrow-purple"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" />
            </marker>
            <marker
              id="arrow-cyan"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" />
            </marker>
            <marker
              id="arrow-red"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f87171" />
            </marker>
          </defs>

          {model === 'TOMCAT' && (
            /* TOMCAT 1-to-1 THREAD SCHEDULING */
            <g>
              {/* Connections */}
              <rect x="30" y="30" width="100" height="35" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="52" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Conn 1 (Active)</text>

              <rect x="30" y="85" width="100" height="35" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="107" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Conn 2 (Blocked)</text>

              <rect x="30" y="140" width="100" height="35" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="162" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Conn 3 (Blocked)</text>

              {/* Threads */}
              <rect x="260" y="25" width="380" height="45" rx="5" ry="5" fill="rgba(168, 85, 247, 0.1)" stroke="#a855f7" strokeWidth="2" />
              <text x="280" y="52" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff' }}>Thread-1</text>
              <text x="450" y="51" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8.5, fill: '#cbd5e1' }}>[read] → [process] → [write]</text>
              <path id="flow-tc-1" d="M 130 47 L 252 47" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#flow-tc-1" />
                </animateMotion>
              </circle>

              <rect x="260" y="80" width="380" height="45" rx="5" ry="5" fill="rgba(239, 68, 68, 0.08)" stroke="#f87171" strokeWidth="1.5" />
              <text x="280" y="107" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#f87171' }}>Thread-2</text>
              <text x="450" y="106" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#f87171' }}>🚨 BLOCKED on DB I/O wait</text>
              <path d="M 130 102 L 252 102" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />

              <rect x="260" y="135" width="380" height="45" rx="5" ry="5" fill="rgba(239, 68, 68, 0.08)" stroke="#f87171" strokeWidth="1.5" />
              <text x="280" y="162" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#f87171' }}>Thread-3</text>
              <text x="450" y="161" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#f87171' }}>🚨 BLOCKED on Socket read wait</text>
              <path d="M 130 157 L 252 157" fill="none" stroke="#f87171" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow-red)" />
            </g>
          )}

          {model === 'NETTY' && (
            /* NETTY EVENTLOOP MULTIPLEXING */
            <g>
              {/* Sockets (File Descriptors) */}
              <g>
                <rect x="30" y="25" width="90" height="30" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="75" y="44" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Socket fd1</text>

                <rect x="30" y="65" width="90" height="30" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="75" y="84" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Socket fd2</text>

                <rect x="30" y="105" width="90" height="30" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="75" y="124" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Socket fd3</text>

                <rect x="30" y="145" width="90" height="30" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
                <text x="75" y="164" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#94a3b8', textAnchor: 'middle' }}>Socket fd4</text>
              </g>

              {/* Selector / Multiplexer */}
              <g>
                <rect x="180" y="45" width="100" height="110" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
                <text x="230" y="95" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Selector</text>
                <text x="230" y="112" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#67e8f9', textAnchor: 'middle' }}>epoll loop</text>

                {/* Sockets lines to Selector */}
                <path id="flow-fd1" d="M 120 40 L 180 65" fill="none" stroke="#2dd4bf" strokeWidth="1" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#flow-fd1" /></animateMotion></circle>

                <path id="flow-fd2" d="M 120 80 L 180 85" fill="none" stroke="#2dd4bf" strokeWidth="1" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="1.2s" repeatCount="indefinite"><mpath href="#flow-fd2" /></animateMotion></circle>

                <path id="flow-fd3" d="M 120 120 L 180 115" fill="none" stroke="#2dd4bf" strokeWidth="1" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#flow-fd3" /></animateMotion></circle>

                <path id="flow-fd4" d="M 120 160 L 180 135" fill="none" stroke="#2dd4bf" strokeWidth="1" className="interactive-diagram-flowing-path" />
                <circle r="2" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="1.4s" repeatCount="indefinite"><mpath href="#flow-fd4" /></animateMotion></circle>
              </g>

              {/* EventLoop Thread */}
              <g>
                <rect x="340" y="60" width="310" height="80" rx="6" ry="6" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="2.5" />
                <text x="495" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>EventLoop Thread (Active & Free)</text>
                <text x="495" y="110" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 8, fill: '#86efac', textAnchor: 'middle' }}>🔄 Loops non-blocking over active events</text>

                <path id="flow-sel-loop" d="M 280 100 L 334 100" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
                <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                  <animateMotion dur="0.6s" repeatCount="indefinite">
                    <mpath href="#flow-sel-loop" />
                  </animateMotion>
                </circle>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'purple' ? 'card-indicator-purple' : 'card-indicator-cyan'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Concurrency Model:</strong> {selectedData.mechanics}</p>
        <p><strong>Required OS Threads:</strong> {selectedData.threadsNeeded}</p>
        <p><strong>Connection Scaling:</strong> <code style={{ color: '#fbbf24' }}>{selectedData.maxConnections}</code></p>
        
        <ul>
          <li><strong>Architecture Details:</strong>
            <ul>
              {selectedData.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Switch between Tomcat Model and Netty Model tabs to analyze how thread blockages compare.
      </p>
    </div>
  );
}
