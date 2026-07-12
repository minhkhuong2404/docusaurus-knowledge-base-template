import React, { useState } from 'react';

type StepKey = 'LOADING' | 'VERIFICATION' | 'PREPARATION' | 'RESOLUTION' | 'INITIALIZATION';

interface StepDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  phase: string;
  description: string;
  actions: string[];
  keyOutcome: string;
}

const STEP_DATA: Record<StepKey, StepDetails> = {
  LOADING: {
    title: '1. Loading Phase',
    type: 'purple',
    phase: 'Loading',
    description: 'Finds the binary representation of a class (compiled .class byte stream) by its fully qualified name and loads it into memory.',
    actions: [
      'Generates a binary stream from filesystem, JAR file, network, or dynamic proxies.',
      'Parses the stream into class metadata structures in the Metaspace (method area).',
      'Instantiates a corresponding java.lang.Class object in the Heap to represent the type.'
    ],
    keyOutcome: 'Class metadata created in Metaspace; Class instance reference created on Heap.'
  },
  VERIFICATION: {
    title: '2. Verification (Linking Phase)',
    type: 'cyan',
    phase: 'Linking - Verification',
    description: 'Ensures the structural correctness of the compiled bytecode to protect JVM runtime safety.',
    actions: [
      'Validates that the class file format matches the exact JVM specification rules.',
      'Checks compiler version compatibility and class file structure integrity.',
      'Runs static analysis checks to guarantee type safety, stack map validity, and no execution flow violations (like jumping out of method bounds).'
    ],
    keyOutcome: 'Rejects corrupted, malicious, or incompatible bytecode files with a java.lang.VerifyError.'
  },
  PREPARATION: {
    title: '3. Preparation (Linking Phase)',
    type: 'cyan',
    phase: 'Linking - Preparation',
    description: 'Allocates memory spaces for static variables declared in the class and initializes them to default initial values.',
    actions: [
      'Allocates Metaspace fields for class-level static variables.',
      'Assigns standard default primitive values (0, 0.0, false, null) to static variables.',
      'Note: Does NOT execute static variable initializations or values defined in code yet (except for constant value attributes like static final constants which are set immediately).'
    ],
    keyOutcome: 'Static fields allocated and default-initialized (e.g. static int count; is allocated and set to 0).'
  },
  RESOLUTION: {
    title: '4. Resolution (Linking Phase)',
    type: 'cyan',
    phase: 'Linking - Resolution',
    description: 'Dynamically replaces symbolic references in the run-time constant pool with direct memory addresses.',
    actions: [
      'Translates symbol names (such as class names, method descriptors, or field names) into physical memory offsets.',
      'Resolves class references, method names, and field locations in loaded libraries.',
      'May execute lazily (only when a symbolic reference is first used by a thread) or eagerly during class verification.'
    ],
    keyOutcome: 'Class constant pool resolved to direct runtime pointers.'
  },
  INITIALIZATION: {
    title: '5. Initialization Phase',
    type: 'green',
    phase: 'Initialization',
    description: 'The final phase where static variables are assigned their actual declared values and static initializers (<clinit> blocks) are executed.',
    actions: [
      'Runs the compiler-generated class initializer method <clinit>.',
      'Executes all static block declarations: static { ... }.',
      'Assigns specified value expressions to static variables (e.g. static int count = 42; is finally set to 42).'
    ],
    keyOutcome: 'Class is fully initialized and ready for instantiation or static access.'
  }
};

export default function ClassLoadingProcessDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<StepKey>('LOADING');

  const selectedData = STEP_DATA[activeStep];

  const handleStepClick = (key: StepKey) => {
    setActiveStep(key);
  };

  const getStroke = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? '#a855f7' : STEP_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return STEP_DATA[key].type === 'purple' ? '#6b21a8' : STEP_DATA[key].type === 'cyan' ? '#0891b2' : '#15803d';
  };

  const getFill = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? 'rgba(168, 85, 247, 0.15)' : STEP_DATA[key].type === 'cyan' ? 'rgba(45, 212, 191, 0.15)' : 'rgba(74, 222, 128, 0.15)';
    }
    return STEP_DATA[key].type === 'purple' ? 'rgba(30, 27, 75, 0.05)' : STEP_DATA[key].type === 'cyan' ? 'rgba(8, 51, 68, 0.05)' : 'rgba(20, 83, 45, 0.05)';
  };

  return (
    <div className="interactive-diagram-container">
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 720 220" className="interactive-diagram-svg">
          <defs>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

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

          {/* Loading Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStepClick('LOADING')}>
            <rect
              x="20"
              y="60"
              width="100"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('LOADING')}
              stroke={getStroke('LOADING')}
              strokeWidth={activeStep === 'LOADING' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="70" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Loading</text>
            <text x="70" y="118" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Phase 1</text>
          </g>

          {/* Linking Subgraph Boundary */}
          <rect x="160" y="30" width="380" height="150" fill="none" stroke="rgba(45, 212, 191, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" rx="10" ry="10" />
          <text x="175" y="48" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 10, fill: '#2dd4bf', letterSpacing: '0.5px' }}>Linking Phase (Steps 2-4)</text>

          {/* Verification Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStepClick('VERIFICATION')}>
            <rect
              x="180"
              y="60"
              width="95"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('VERIFICATION')}
              stroke={getStroke('VERIFICATION')}
              strokeWidth={activeStep === 'VERIFICATION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="227" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Verification</text>
            <text x="227" y="118" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Bytecode checks</text>
          </g>

          {/* Preparation Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStepClick('PREPARATION')}>
            <rect
              x="300"
              y="60"
              width="95"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('PREPARATION')}
              stroke={getStroke('PREPARATION')}
              strokeWidth={activeStep === 'PREPARATION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="347" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Preparation</text>
            <text x="347" y="118" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Static default set</text>
          </g>

          {/* Resolution Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStepClick('RESOLUTION')}>
            <rect
              x="420"
              y="60"
              width="95"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('RESOLUTION')}
              stroke={getStroke('RESOLUTION')}
              strokeWidth={activeStep === 'RESOLUTION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="467" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10.5, fill: '#ffffff', textAnchor: 'middle' }}>Resolution</text>
            <text x="467" y="118" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Constant pool</text>
          </g>

          {/* Initialization Block */}
          <g style={{ cursor: 'pointer' }} onClick={() => handleStepClick('INITIALIZATION')}>
            <rect
              x="580"
              y="60"
              width="115"
              height="80"
              rx="8"
              ry="8"
              fill={getFill('INITIALIZATION')}
              stroke={getStroke('INITIALIZATION')}
              strokeWidth={activeStep === 'INITIALIZATION' ? '2.5' : '1.5'}
              style={{ transition: 'all 0.2s ease' }}
            />
            <text x="637" y="100" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 11, fill: '#ffffff', textAnchor: 'middle' }}>Initialization</text>
            <text x="637" y="118" style={{ fontFamily: 'Inter', fontWeight: 500, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>Run static initializers</text>
          </g>

          {/* CONNECTOR PATHS */}
          {/* Loading -> Verification */}
          <g>
            <path
              id="path-load-verify"
              d="M 120 100 L 174 100"
              fill="none"
              stroke={activeStep === 'LOADING' || activeStep === 'VERIFICATION' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeStep === 'LOADING' || activeStep === 'VERIFICATION' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'LOADING' || activeStep === 'VERIFICATION' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'LOADING' || activeStep === 'VERIFICATION' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeStep === 'LOADING' || activeStep === 'VERIFICATION') && (
              <circle r="3" fill="#2dd4bf" filter="url(#glowCyan)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-load-verify" />
                </animateMotion>
              </circle>
            )}
          </g>

          {/* Verification -> Preparation */}
          <g>
            <path
              id="path-verify-prep"
              d="M 275 100 L 294 100"
              fill="none"
              stroke={activeStep === 'VERIFICATION' || activeStep === 'PREPARATION' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeStep === 'VERIFICATION' || activeStep === 'PREPARATION' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'VERIFICATION' || activeStep === 'PREPARATION' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'VERIFICATION' || activeStep === 'PREPARATION' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
          </g>

          {/* Preparation -> Resolution */}
          <g>
            <path
              id="path-prep-resol"
              d="M 395 100 L 414 100"
              fill="none"
              stroke={activeStep === 'PREPARATION' || activeStep === 'RESOLUTION' ? '#2dd4bf' : '#2e354f'}
              strokeWidth={activeStep === 'PREPARATION' || activeStep === 'RESOLUTION' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'PREPARATION' || activeStep === 'RESOLUTION' ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'PREPARATION' || activeStep === 'RESOLUTION' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
          </g>

          {/* Resolution -> Initialization */}
          <g>
            <path
              id="path-resol-init"
              d="M 515 100 L 574 100"
              fill="none"
              stroke={activeStep === 'RESOLUTION' || activeStep === 'INITIALIZATION' ? '#4ade80' : '#2e354f'}
              strokeWidth={activeStep === 'RESOLUTION' || activeStep === 'INITIALIZATION' ? '2.5' : '1.5'}
              markerEnd={activeStep === 'RESOLUTION' || activeStep === 'INITIALIZATION' ? 'url(#arrow-green)' : 'url(#arrow-gray)'}
              className={`interactive-diagram-transition-path ${
                activeStep === 'RESOLUTION' || activeStep === 'INITIALIZATION' ? 'interactive-diagram-flowing-path' : ''
              }`}
              style={{ transition: 'all 0.3s ease' }}
            />
            {(activeStep === 'RESOLUTION' || activeStep === 'INITIALIZATION') && (
              <circle r="3" fill="#4ade80" filter="url(#glowGreen)" className="interactive-diagram-flowing-dot">
                <animateMotion dur="1.2s" repeatCount="indefinite">
                  <mpath href="#path-resol-init" />
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
        <p><strong>Phase Group:</strong> {selectedData.phase}</p>
        <p><strong>Overview:</strong> {selectedData.description}</p>
        
        <ul>
          <li><strong>Internal Steps & Actions:</strong>
            <ul>
              {selectedData.actions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          </li>
          <li><strong>Phase Output / Outcome:</strong> <strong>{selectedData.keyOutcome}</strong></li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on any step (Loading, Verification, Preparation, Resolution, or Initialization) in the pipeline to inspect compiler execution.
      </p>
    </div>
  );
}
