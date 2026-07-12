import React, { useState } from 'react';

type GitStep = 'STAGE' | 'COMMIT' | 'RESTORE';

interface GitStepDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  cmd: string;
  desc: string;
  bullets: string[];
}

const GIT_STEPS: Record<GitStep, GitStepDetails> = {
  STAGE: {
    title: 'Staging Area (Index)',
    type: 'purple',
    cmd: 'git add <file>',
    desc: 'Prepares local working changes to be recorded in the next history commit.',
    bullets: [
      'Moves your changes from the Working Tree (local disk) to the Staging Area.',
      'Computes file content SHA-1 hashes and creates blob objects in Git\'s index database.',
      'Allows selective chunk/hunk commits using command flags like git add -p.'
    ]
  },
  COMMIT: {
    title: 'Commit snapshot (Local Repository)',
    type: 'cyan',
    cmd: 'git commit -m "message"',
    desc: 'Saves your staged draft into the immutable repository tree history.',
    bullets: [
      'Binds the staged snapshot draft into a permanent commit object.',
      'Creates tree references for directory paths and records author, date, and commit message metadata.',
      'Advances the active branch pointer pointer (HEAD) to this new commit hash.'
    ]
  },
  RESTORE: {
    title: 'Discarding changes (Working Tree Restore)',
    type: 'green',
    cmd: 'git checkout / git restore',
    desc: 'Rolls back working disk modifications to match index or commit states.',
    bullets: [
      'git restore <file>: Discards unstaged modifications in the Working Tree.',
      'git restore --staged <file>: Unstages files, moving them back from Index to Working Tree.',
      'git checkout <branch>: Updates files on disk to match the tip of the selected branch.'
    ]
  }
};

export default function GitFlowMapDiagram(): React.JSX.Element {
  const [step, setStep] = useState<GitStep>('STAGE');

  const selectedData = GIT_STEPS[step];

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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🌴</span>
            <span style={{ color: step === 'STAGE' ? '#a855f7' : step === 'COMMIT' ? '#2dd4bf' : '#4ade80' }}>
              Git Trees: {step}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setStep('STAGE')}
            style={{
              background: step === 'STAGE' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: step === 'STAGE' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: step === 'STAGE' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            git add
          </button>
          <button 
            onClick={() => setStep('COMMIT')}
            style={{
              background: step === 'COMMIT' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: step === 'COMMIT' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: step === 'COMMIT' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            git commit
          </button>
          <button 
            onClick={() => setStep('RESTORE')}
            style={{
              background: step === 'RESTORE' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: step === 'RESTORE' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: step === 'RESTORE' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            git restore
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
          <defs>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#a855f7" /></marker>
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2dd4bf" /></marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#4ade80" /></marker>
          </defs>

          {/* Working Tree Box */}
          <g>
            <rect x="30" y="55" width="150" height="70" rx="6" ry="6" fill={step === 'RESTORE' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(255,255,255,0.01)'} stroke={step === 'RESTORE' ? '#4ade80' : 'rgba(255,255,255,0.05)'} strokeWidth={step === 'RESTORE' ? 2 : 1} />
            <text x="105" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Working Tree</text>
            <text x="105" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>(Your Files on Disk)</text>
          </g>

          {/* Index/Stage Box */}
          <g>
            <rect x="260" y="55" width="160" height="70" rx="6" ry="6" fill={step === 'STAGE' ? 'rgba(168, 85, 247, 0.05)' : 'rgba(255,255,255,0.01)'} stroke={step === 'STAGE' ? '#a855f7' : 'rgba(255,255,255,0.05)'} strokeWidth={step === 'STAGE' ? 2 : 1} />
            <text x="340" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Staging Area</text>
            <text x="340" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>(Index Snapshot Draft)</text>
          </g>

          {/* Repository Box */}
          <g>
            <rect x="500" y="55" width="150" height="70" rx="6" ry="6" fill={step === 'COMMIT' ? 'rgba(45, 212, 191, 0.05)' : 'rgba(255,255,255,0.01)'} stroke={step === 'COMMIT' ? '#2dd4bf' : 'rgba(255,255,255,0.05)'} strokeWidth={step === 'COMMIT' ? 2 : 1} />
            <text x="575" y="85" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#ffffff', textAnchor: 'middle' }}>Local Repository</text>
            <text x="575" y="98" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>(Immutable Commits)</text>
          </g>

          {/* Transition Paths */}
          <g>
            {/* Stage Path */}
            <path id="path-git-stage" d="M 180 80 L 254 80" fill="none" stroke={step === 'STAGE' ? '#a855f7' : '#2e354f'} strokeWidth="1.5" markerEnd="url(#arrow-purple)" className={step === 'STAGE' ? 'interactive-diagram-flowing-path' : ''} />
            {step === 'STAGE' && <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-git-stage" /></animateMotion></circle>}
            <text x="217" y="70" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: step === 'STAGE' ? '#a855f7' : '#475569', textAnchor: 'middle' }}>git add</text>

            {/* Commit Path */}
            <path id="path-git-commit" d="M 420 80 L 494 80" fill="none" stroke={step === 'COMMIT' ? '#2dd4bf' : '#2e354f'} strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className={step === 'COMMIT' ? 'interactive-diagram-flowing-path' : ''} />
            {step === 'COMMIT' && <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-git-commit" /></animateMotion></circle>}
            <text x="457" y="70" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: step === 'COMMIT' ? '#2dd4bf' : '#475569', textAnchor: 'middle' }}>git commit</text>

            {/* Restore/Checkout Path */}
            <path id="path-git-restore" d="M 575 125 L 575 145 L 105 145 L 105 127" fill="none" stroke={step === 'RESTORE' ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd="url(#arrow-green)" className={step === 'RESTORE' ? 'interactive-diagram-flowing-path' : ''} strokeDasharray={step === 'RESTORE' ? 'none' : '3 3'} />
            {step === 'RESTORE' && <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#path-git-restore" /></animateMotion></circle>}
            <text x="340" y="140" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: step === 'RESTORE' ? '#4ade80' : '#475569', textAnchor: 'middle' }}>git checkout / git restore</text>
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        step === 'STAGE' ? 'details-purple' : step === 'COMMIT' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Syntax:</strong> <code style={{ color: '#ffffff', background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>{selectedData.cmd}</code></p>
        <p><strong>Description:</strong> {selectedData.desc}</p>
        
        <ul>
          <li><strong>Internal Mechanics:</strong>
            <ul>
              {selectedData.bullets.map((b, idx) => (
                <li key={idx}>{b}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Use the tabs above to trigger file flows between Working Tree, Index/Stage, and Repository states.
      </p>
    </div>
  );
}
