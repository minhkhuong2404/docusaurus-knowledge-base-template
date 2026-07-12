import React, { useState } from 'react';

type ModelKey = 'MVC' | 'WEBFLUX' | 'VIRTUAL';

interface ModelDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  threading: string;
  overhead: string;
  verdict: string;
  description: string[];
}

const MODEL_DATA: Record<ModelKey, ModelDetails> = {
  MVC: {
    title: 'Spring MVC: Thread-Per-Request (Blocking)',
    type: 'purple',
    threading: '1 OS Thread per HTTP Connection',
    overhead: 'High Memory (~1MB per Thread stack)',
    verdict: 'Inefficient under high concurrent I/O wait times.',
    description: [
      'An HTTP request borrows a dedicated worker thread (e.g. http-nio-8080-exec-42).',
      'The worker thread is physically BLOCKED during database database SQL queries, remote API calls, or file reads.',
      'Saturating the pool prevents the application from accepting future connections, causing high latency or downtime.'
    ]
  },
  WEBFLUX: {
    title: 'Spring WebFlux: EventLoop (Reactive Non-Blocking)',
    type: 'cyan',
    threading: 'Few Loops (Typically 1 per CPU Core) for 10,000+ connections',
    overhead: 'Tiny Memory (~1KB per Channel state descriptor)',
    verdict: 'Exceptional throughput, but requires complex reactive APIs.',
    description: [
      'Netty worker thread gets request, triggers R2DBC query, and immediately returns execution context.',
      'The EventLoop thread is instantly FREE to process other active connections while the database queries run asynchronously.',
      'Once the database finishes, a callback event schedules the event loop to write the response.'
    ]
  },
  VIRTUAL: {
    title: 'Java 21 Virtual Threads: Carrier-Worker Unmounting',
    type: 'green',
    threading: 'Millions of Virtual Threads mapped to a small ForkJoinPool',
    overhead: 'Negligible Memory (~1KB heap metadata representation)',
    verdict: 'Best of both worlds: simple imperative style + high throughput.',
    description: [
      'Tomcat allocates a lightweight Virtual Thread (VThread) per request.',
      'On blocking calls (e.g. database query), the virtual thread yields and UNMOUNTS from its physical Carrier Thread (ForkJoinPool worker).',
      'The Carrier Thread is free to execute other VThreads. On I/O completion, the VThread mounts back to a carrier thread and resumes.'
    ]
  }
};

export default function RequestPipelineModelDiagram(): React.JSX.Element {
  const [model, setModel] = useState<ModelKey>('MVC');

  const selectedData = MODEL_DATA[model];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Control bar */}
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
          
          <h3 style={{ margin: '0 !important', fontSize: '0.95rem', fontWeight: 700, color: model === 'MVC' ? '#a855f7 !important' : model === 'WEBFLUX' ? '#2dd4bf !important' : '#4ade80 !important' }}>
            🔄 Concurrency Model: {model === 'MVC' ? 'Spring MVC (Tomcat)' : model === 'WEBFLUX' ? 'WebFlux (Netty)' : 'Virtual Threads (Loom)'}
          </h3>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setModel('MVC')}
            style={{
              background: model === 'MVC' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: model === 'MVC' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: model === 'MVC' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Spring MVC
          </button>
          <button 
            onClick={() => setModel('WEBFLUX')}
            style={{
              background: model === 'WEBFLUX' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: model === 'WEBFLUX' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: model === 'WEBFLUX' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Spring WebFlux
          </button>
          <button 
            onClick={() => setModel('VIRTUAL')}
            style={{
              background: model === 'VIRTUAL' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: model === 'VIRTUAL' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: model === 'VIRTUAL' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Virtual Threads
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 170" className="interactive-diagram-svg">
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
              id="arrow-green"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" />
            </marker>
          </defs>

          {model === 'MVC' && (
            /* SPRING MVC BLOCKING VISUALS */
            <g>
              {/* Client */}
              <rect x="30" y="55" width="100" height="50" rx="5" ry="5" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="84" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#cbd5e1', textAnchor: 'middle' }}>HTTP Client</text>

              {/* Tomcat Thread */}
              <rect x="230" y="45" width="180" height="70" rx="6" ry="6" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="2.5" />
              <text x="320" y="75" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Tomcat Worker Thread</text>
              <text x="320" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#f87171', textAnchor: 'middle' }}>🚨 BLOCKED on Database</text>

              {/* Database */}
              <rect x="520" y="55" width="120" height="50" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="580" y="84" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#94a3b8', textAnchor: 'middle' }}>Database Server</text>

              {/* Connection Paths */}
              <path id="path-mvc-block" d="M 410 80 L 512 80" fill="none" stroke="#f87171" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#f87171" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-mvc-block" />
                </animateMotion>
              </circle>

              <path d="M 130 80 L 222 80" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" />
            </g>
          )}

          {model === 'WEBFLUX' && (
            /* SPRING WEBFLUX REACTIVE VISUALS */
            <g>
              {/* Client */}
              <rect x="30" y="55" width="100" height="50" rx="5" ry="5" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="80" y="84" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#cbd5e1', textAnchor: 'middle' }}>HTTP Client</text>

              {/* Netty EventLoop */}
              <rect x="230" y="45" width="180" height="70" rx="6" ry="6" fill="rgba(45, 212, 191, 0.15)" stroke="#2dd4bf" strokeWidth="2.5" />
              <text x="320" y="75" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Netty EventLoop Thread</text>
              <text x="320" y="93" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#4ade80', textAnchor: 'middle' }}>⚡ FREE (Handles other connections)</text>

              {/* Database */}
              <rect x="520" y="55" width="120" height="50" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="580" y="84" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#94a3b8', textAnchor: 'middle' }}>R2DBC Database</text>

              {/* Non blocking query line */}
              <path id="path-flux-nonblock" d="M 410 80 L 512 80" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#2dd4bf" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-flux-nonblock" />
                </animateMotion>
              </circle>

              <path d="M 130 80 L 222 80" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" />
            </g>
          )}

          {model === 'VIRTUAL' && (
            /* JAVA 21 LOOM VIRTUAL THREAD VISUALS */
            <g>
              {/* Virtual Thread stack */}
              <rect x="30" y="30" width="180" height="45" rx="5" ry="5" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" strokeWidth="2" />
              <text x="120" y="57" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>VThread "vt-http-42"</text>
              
              {/* Carrier Thread */}
              <rect x="270" y="60" width="180" height="60" rx="6" ry="6" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
              <text x="360" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#cbd5e1', textAnchor: 'middle' }}>Carrier (ForkJoinPool worker)</text>
              <text x="360" y="105" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#4ade80', textAnchor: 'middle' }}>⚡ UNMOUNTED (Runs other VTs)</text>

              {/* Database */}
              <rect x="520" y="65" width="120" height="50" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="580" y="94" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#94a3b8', textAnchor: 'middle' }}>JDBC Database</text>

              {/* Yield / Unmount path */}
              <path id="path-loom-unmount" d="M 210 52 L 270 75" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
              
              {/* Database access */}
              <path id="path-loom-block" d="M 450 90 L 512 90" fill="none" stroke="#4ade80" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="3" fill="#4ade80" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1s" repeatCount="indefinite">
                  <mpath href="#path-loom-block" />
                </animateMotion>
              </circle>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'green' ? 'details-green' : selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Thread Layout Sizing:</strong> {selectedData.threading}</p>
        <p><strong>Memory Footprint:</strong> <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{selectedData.overhead}</span></p>
        <p><strong>Tuning Sizing:</strong> {selectedData.verdict}</p>
        
        <ul>
          <li><strong>Execution flow details:</strong>
            <ul>
              {selectedData.description.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Toggle between Spring MVC, Spring WebFlux, and Java 21 Virtual Threads tabs to compare thread scheduling block overheads.
      </p>
    </div>
  );
}
