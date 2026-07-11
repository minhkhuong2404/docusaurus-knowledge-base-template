import React, { useState } from 'react';

type BatchTab = 'ARCH_HIERARCHY' | 'CHUNK_LIFECYCLE';

interface BatchDetails {
  title: string;
  type: 'purple' | 'cyan';
  overview: string;
  bullets: string[];
}

const BATCH_DATA: Record<BatchTab, BatchDetails> = {
  ARCH_HIERARCHY: {
    title: 'Spring Batch Core Architecture Hierarchy',
    type: 'purple',
    overview: 'Defines the structural blueprint of a batch execution scope.',
    bullets: [
      'JobLauncher: The entry point that boots a Job execution using specific JobParameters.',
      'Job: A container representing the entire batch process, consisting of one or more sequential or parallel Steps.',
      'Step: An independent, sequential phase of a Job (commonly containing an ItemReader, ItemProcessor, and ItemWriter).',
      'JobRepository: The shared persistence layer that tracks execution states, parameters, and results (JobInstance, JobExecution, StepExecution).'
    ]
  },
  CHUNK_LIFECYCLE: {
    title: 'Chunk-Oriented Processing Loop (Read-Process-Write)',
    type: 'cyan',
    overview: 'Explains how Spring Batch processes records in transactional chunks to balance speed and memory consumption.',
    bullets: [
      'ItemReader: Reads data items one-by-one (e.g. database rows, file lines) until the configured Chunk Size is reached.',
      'ItemProcessor: Processes each read item individually (filtering, transforming, validating). Returns null to filter an item.',
      'ItemWriter: Receives the entire list/chunk of processed items and writes them in a single transaction commit (e.g. batch SQL insert).'
    ]
  }
};

export default function SpringBatchArchDiagram(): React.JSX.Element {
  const [tab, setTab] = useState<BatchTab>('ARCH_HIERARCHY');

  const selectedData = BATCH_DATA[tab];

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header controls */}
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
          <span className={`interactive-diagram-indicator-dot ${tab === 'ARCH_HIERARCHY' ? 'card-indicator-purple' : 'card-indicator-cyan'}`} />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>⚙️</span>
            <span style={{ color: tab === 'ARCH_HIERARCHY' ? '#a855f7' : '#2dd4bf' }}>
              Spring Batch: {tab === 'ARCH_HIERARCHY' ? 'Architecture' : 'Chunk Processing'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            onClick={() => setTab('ARCH_HIERARCHY')}
            style={{
              background: tab === 'ARCH_HIERARCHY' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'ARCH_HIERARCHY' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'ARCH_HIERARCHY' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Architecture
          </button>
          <button 
            onClick={() => setTab('CHUNK_LIFECYCLE')}
            style={{
              background: tab === 'CHUNK_LIFECYCLE' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: tab === 'CHUNK_LIFECYCLE' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: tab === 'CHUNK_LIFECYCLE' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Chunk Lifecycle
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

          {tab === 'ARCH_HIERARCHY' && (
            /* BATCH METADATA ARCHITECTURE HIERARCHY */
            <g>
              {/* JobLauncher */}
              <rect x="20" y="65" width="100" height="40" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="70" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>JobLauncher</text>

              {/* Job */}
              <rect x="175" y="45" width="130" height="80" rx="6" ry="6" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="1.5" />
              <text x="240" y="80" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Job Instance</text>
              <text x="240" y="93" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>+ JobParameters</text>

              {/* Steps */}
              <rect x="360" y="20" width="120" height="32" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="420" y="39" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Step 1: Read/Write</text>

              <rect x="360" y="70" width="120" height="32" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="420" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Step 2: Aggregate</text>

              <rect x="360" y="120" width="120" height="32" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="420" y="139" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>Step 3: Cleanup</text>

              {/* JobRepository */}
              <rect x="525" y="65" width="135" height="40" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="592.5" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>JobRepository</text>

              {/* Flow Paths */}
              <path id="path-ba-1" d="M 120 85 L 169 85" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-ba-1" /></animateMotion></circle>

              <path d="M 305 75 L 354 45" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#arrow-purple)" />
              <path d="M 305 85 L 354 85" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#arrow-purple)" />
              <path d="M 305 95 L 354 125" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" markerEnd="url(#arrow-purple)" />

              <path id="path-ba-repo" d="M 480 85 L 519 85" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
            </g>
          )}

          {tab === 'CHUNK_LIFECYCLE' && (
            /* CHUNK ORIENTED PROCESSING PIPELINE */
            <g>
              {/* Database / Source */}
              <rect x="20" y="65" width="90" height="40" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="65" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#94a3b8', textAnchor: 'middle' }}>Data Source</text>

              {/* Reader */}
              <rect x="160" y="60" width="115" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="217.5" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>ItemReader</text>
              <text x="217.5" y="95" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[One-by-One]</text>

              {/* Processor */}
              <rect x="330" y="60" width="115" height="50" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="387.5" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>ItemProcessor</text>
              <text x="387.5" y="95" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[Process/Filter]</text>

              {/* Writer */}
              <rect x="500" y="60" width="115" height="50" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="2" />
              <text x="557.5" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>ItemWriter</text>
              <text x="557.5" y="95" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#4ade80', textAnchor: 'middle' }}>[Writes Chunk]</text>

              {/* Chunk box boundary */}
              <rect x="490" y="50" width="135" height="70" rx="6" ry="6" fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 3" />
              <text x="557.5" y="42" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#4ade80', textAnchor: 'middle' }}>Chunk Tx Boundary</text>

              {/* Flow Paths */}
              <path id="path-ch-1" d="M 110 85 L 154 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-ch-1" /></animateMotion></circle>

              <path id="path-ch-2" d="M 275 85 L 324 85" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-ch-2" /></animateMotion></circle>

              <path id="path-ch-3" d="M 445 85 L 494 85" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-ch-3" /></animateMotion></circle>
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
        <p><strong>Overview:</strong> {selectedData.overview}</p>
        
        <ul>
          <li><strong>Processing Mechanics:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Use the controls above to toggle between Job Architecture and Chunk Processing Lifecycle.
      </p>
    </div>
  );
}
