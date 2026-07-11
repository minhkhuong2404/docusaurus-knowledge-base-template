import React, { useState } from 'react';

type GCMode = 'BEFORE_GC' | 'AFTER_GC';

interface GCDetails {
  title: string;
  type: 'purple' | 'cyan';
  keyState: string;
  valueState: string;
  leakStatus: string;
  bullets: string[];
}

const GC_DATA: Record<GCMode, GCDetails> = {
  BEFORE_GC: {
    title: 'Before GC: ThreadLocal Reference Active',
    type: 'purple',
    keyState: 'Referenced (Active)',
    valueState: 'Reachable & Active',
    leakStatus: 'No Leak (Safe)',
    bullets: [
      'The thread holds a strong reference to the ThreadLocalMap.',
      'The map entry holds a WeakReference to the ThreadLocal key (e.g., UserContext).',
      'The value object (e.g., User entity) is strongly referenced and reachable.'
    ]
  },
  AFTER_GC: {
    title: 'After GC: ThreadLocal Key Reclaimed, Value Leaked',
    type: 'cyan',
    keyState: 'null (Garbage Collected)',
    valueState: 'Stuck in Memory (Strong Reference active)',
    leakStatus: '⚠️ MEMORY LEAK ACTIVE',
    bullets: [
      'The thread local variable goes out of scope and is collected. The WeakReference key becomes null.',
      'However, the thread remains alive in Tomcat\'s thread pool.',
      'The Entry value is still strongly referenced by the thread, preventing it from being garbage collected!'
    ]
  }
};

export default function ThreadLocalMapLeakDiagram(): React.JSX.Element {
  const [mode, setMode] = useState<GCMode>('BEFORE_GC');

  const selectedData = GC_DATA[mode];

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
            className={`interactive-diagram-indicator-dot ${mode === 'BEFORE_GC' ? 'card-indicator-purple' : 'card-indicator-red'}`} 
            style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: mode === 'BEFORE_GC' ? '#a855f7' : '#f87171' }}
          />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🧬</span>
            <span style={{ color: mode === 'BEFORE_GC' ? '#a855f7' : '#f87171' }}>
              ThreadLocal Lifecycle: {mode === 'BEFORE_GC' ? 'Active' : 'Leaked'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setMode('BEFORE_GC')}
            style={{
              background: mode === 'BEFORE_GC' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'BEFORE_GC' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'BEFORE_GC' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Before GC
          </button>
          <button 
            onClick={() => setMode('AFTER_GC')}
            style={{
              background: mode === 'AFTER_GC' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'AFTER_GC' ? '1px solid #f87171' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'AFTER_GC' ? '#f87171' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            After GC
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
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

          {/* Thread (Stack -> Heap Root) */}
          <g>
            <rect x="20" y="60" width="100" height="50" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="70" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Active Thread</text>
            <text x="70" y="98" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>(Pooled Tomcat)</text>
          </g>

          {/* ThreadLocalMap */}
          <g>
            <rect x="180" y="45" width="220" height="85" rx="6" ry="6" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
            <text x="290" y="65" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#67e8f9', textAnchor: 'middle' }}>ThreadLocalMap.Entry</text>

            <path id="path-th-map" d="M 120 85 L 174 85" fill="none" stroke="#67e8f9" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
            <circle r="2.5" fill="#67e8f9" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-th-map" /></animateMotion></circle>
          </g>

          {/* WeakReference Key */}
          <g>
            <rect x="200" y="80" width="80" height="35" rx="4" ry="4" fill={mode === 'BEFORE_GC' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(239, 68, 68, 0.05)'} stroke={mode === 'BEFORE_GC' ? '#a855f7' : '#f87171'} strokeWidth="1.5" />
            <text x="240" y="98" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: mode === 'BEFORE_GC' ? '#c084fc' : '#f87171', textAnchor: 'middle' }}>
              {mode === 'BEFORE_GC' ? 'Key: WeakRef' : 'Key: null'}
            </text>
          </g>

          {/* Value Object (StrongReference) */}
          <g>
            <rect x="300" y="80" width="85" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.1)" stroke="#4ade80" strokeWidth="1.5" />
            <text x="342.5" y="98" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#86efac', textAnchor: 'middle' }}>Value: Strong</text>
          </g>

          {/* ThreadLocal Variable */}
          {mode === 'BEFORE_GC' ? (
            <g>
              <rect x="470" y="55" width="160" height="60" rx="6" ry="6" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" strokeWidth="2.5" />
              <text x="550" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>ThreadLocal instance</text>
              <text x="550" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7.5, fill: '#c084fc', textAnchor: 'middle' }}>UserContext (Active)</text>

              <path id="path-weak-ref" d="M 280 97 L 464 97" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-weak-ref" /></animateMotion></circle>
            </g>
          ) : (
            <g>
              <rect x="470" y="55" width="160" height="60" rx="6" ry="6" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <text x="550" y="90" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 9, fill: '#475569', textAnchor: 'middle' }}>Collected by GC</text>
              <path d="M 280 97 L 464 97" fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="3 3" />
            </g>
          )}

          {/* Heap value object */}
          <g>
            <rect x="290" y="145" width="220" height="25" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke={mode === 'BEFORE_GC' ? '#4ade80' : '#fbbf24'} strokeWidth="1" />
            <text x="400" y="161" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: mode === 'BEFORE_GC' ? '#86efac' : '#fbbf24', textAnchor: 'middle' }}>
              {mode === 'BEFORE_GC' ? 'UserContext Object (In-Use)' : '🚨 Leaked Context (Stuck in memory)'}
            </text>
            
            <path id="path-strong-ref" d="M 342.5 115 L 342.5 140" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
            <circle r="2" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-strong-ref" /></animateMotion></circle>
          </g>
        </svg>
      </div>

      {/* Narrative Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : 'details-cyan'
      }`}>
        <div className="interactive-diagram-card-header">
          <span className={`interactive-diagram-indicator-dot ${
            selectedData.type === 'purple' ? 'card-indicator-purple' : 'card-indicator-red'
          }`} />
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>WeakRef Key:</strong> {selectedData.keyState}</p>
        <p><strong>StrongRef Value:</strong> {selectedData.valueState}</p>
        <p><strong>Leak Status:</strong> <span style={{ color: selectedData.type === 'purple' ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>{selectedData.leakStatus}</span></p>
        
        <ul>
          <li><strong>Memory Operations:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Switch between Before GC and After GC tabs to analyze how ThreadLocal reference leaks occur.
      </p>
    </div>
  );
}
