import React, { useState } from 'react';

type StepKey = 'ACCEPTOR' | 'POLLER' | 'WORKER';

interface StepDetails {
  num: string;
  title: string;
  subtitle: string;
  explanation: string;
  type: 'purple' | 'cyan' | 'green';
  metrics: string[];
}

const STEP_DATA: Record<StepKey, StepDetails> = {
  ACCEPTOR: {
    num: '01',
    title: 'Acceptor Thread',
    subtitle: 'ServerSocketChannel.accept()',
    explanation: 'A simple blocking loop that accepts incoming TCP socket connections from the OS kernel backlog queue. Instantly sets the socket to non-blocking and passes it to the Poller selector.',
    type: 'purple',
    metrics: [
      'Executes standard TCP handshake completion.',
      'Passes socket descriptor (FD) to the next stage immediately.'
    ]
  },
  POLLER: {
    num: '02',
    title: 'Poller Thread (NIO)',
    subtitle: 'Selector Multiplexing Loop',
    explanation: 'Monitors thousands of registered sockets via epoll (Linux) or kqueue (macOS) multiplexing. Keeps socket connections open without wasting threads until HTTP header payload byte packets actually arrive.',
    type: 'cyan',
    metrics: [
      'Buffers incoming bytes from connection streams.',
      'Triggers once socket bytes are fully readable, scheduling handoff.'
    ]
  },
  WORKER: {
    num: '03',
    title: 'Worker Thread (Pool)',
    subtitle: 'DispatcherServlet Execution',
    explanation: 'Borrowed from Tomcat\'s executor pool. Parses HTTP headers/body into request objects, executes the entire servlet filter chain, dispatches to @RestController, and writes back the socket response.',
    type: 'green',
    metrics: [
      'Default maximum count: 200 worker threads.',
      'Remains blocked (occupied) during long database queries or I/O.'
    ]
  }
};

export default function TomcatRequestFlowDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<StepKey>('ACCEPTOR');

  const selectedData = STEP_DATA[activeStep];

  const getBorderColor = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? '#a855f7' : STEP_DATA[key].type === 'cyan' ? '#2dd4bf' : '#4ade80';
    }
    return 'rgba(255, 255, 255, 0.08)';
  };

  const getNumColor = (key: StepKey) => {
    if (activeStep === key) {
      return STEP_DATA[key].type === 'purple' ? '#c084fc' : STEP_DATA[key].type === 'cyan' ? '#67e8f9' : '#86efac';
    }
    return '#475569';
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: '12px',
          margin: '0.8rem 0'
        }}
      >
        {(Object.keys(STEP_DATA) as StepKey[]).map((key) => {
          const step = STEP_DATA[key];
          return (
            <div
              key={key}
              onClick={() => setActiveStep(key)}
              style={{
                flex: '1 1 200px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1.5px solid ${getBorderColor(key)}`,
                borderRadius: '8px',
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: activeStep === key ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: getNumColor(key) }}>STEP {step.num}</span>
                
              </div>
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>{step.title}</h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>{step.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>Tomcat Pipeline: {selectedData.title}</h3>
        </div>
        <p><strong>Overview:</strong> {selectedData.explanation}</p>
        
        <ul>
          <li><strong>Processing Mechanics:</strong>
            <ul>
              {selectedData.metrics.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Click on Step 01, 02, or 03 above to trace standard Tomcat request execution stages.
      </p>
    </div>
  );
}
