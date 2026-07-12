import React, { useState } from 'react';

type MVCStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface MVCStepDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green' | 'yellow';
  overview: string;
  keyPoints: string[];
}

const STEPS_DATA: Record<MVCStep, MVCStepDetails> = {
  1: {
    title: 'Step 1: Client sends HTTP request',
    type: 'purple',
    overview: 'The client (browser or REST client) initiates an HTTP request (e.g., GET /products).',
    keyPoints: [
      'The request travels over TCP/IP to the servlet container (Tomcat).',
      'Tomcat allocates a worker thread and maps the request to the mapped servlet path context.'
    ]
  },
  2: {
    title: 'Step 2: DispatcherServlet receives request',
    type: 'cyan',
    overview: 'The request is intercepted by Spring\'s DispatcherServlet (the Front Controller pattern).',
    keyPoints: [
      'Acts as the single entry point for all incoming HTTP traffic.',
      'Initializes web context parameters and acts as orchestrator for downstream helpers.'
    ]
  },
  3: {
    title: 'Step 3: HandlerMapping lookup',
    type: 'yellow',
    overview: 'DispatcherServlet queries the HandlerMapping registry.',
    keyPoints: [
      'HandlerMapping matches the request URL path and HTTP method against registered @RequestMapping patterns.',
      'Returns a HandlerExecutionChain containing the target Controller method along with configured interceptors.'
    ]
  },
  4: {
    title: 'Step 4: Controller processes request',
    type: 'green',
    overview: 'The request is dispatched to the controller handler method.',
    keyPoints: [
      'Calls downstream business logic services and databases.',
      'Populates model variables and returns either a logical View Name (SSR) or serializable response DTO (REST).'
    ]
  },
  5: {
    title: 'Step 5: ViewResolver lookup (for SSR)',
    type: 'purple',
    overview: 'If returning a logical view name, DispatcherServlet queries ViewResolver.',
    keyPoints: [
      'Maps names (e.g., "products") to physical file paths (e.g., "/WEB-INF/views/products.jsp" or Thymeleaf templates).',
      'Note: Bypassed for REST APIs (@RestController / @ResponseBody) where HttpMessageConverter serializes the output directly to JSON/XML.'
    ]
  },
  6: {
    title: 'Step 6: View renders response',
    type: 'cyan',
    overview: 'The View implementation renders the final response payload.',
    keyPoints: [
      'Combines model data variables with templates to generate dynamic HTML.',
      'For REST APIs, outputs raw serialized byte frames.'
    ]
  },
  7: {
    title: 'Step 7: DispatcherServlet sends response',
    type: 'green',
    overview: 'DispatcherServlet sends the response headers and payload back to Tomcat, which streams it to the client socket.',
    keyPoints: [
      'The Tomcat worker thread flushes socket buffers and returns to the thread pool.',
      'The HTTP request lifecycle is complete.'
    ]
  }
};

export default function SpringMVCFlowDiagram(): React.JSX.Element {
  const [step, setStep] = useState<MVCStep>(1);

  const current = STEPS_DATA[step];

  const getBorderColor = (s: MVCStep) => (step === s ? '#2dd4bf' : 'rgba(255, 255, 255, 0.08)');
  const getNumColor = (s: MVCStep) => (step === s ? '#67e8f9' : '#475569');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      {/* Header */}
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
            <span>🔄</span>
            <span style={{ color: '#2dd4bf' }}>Spring MVC Request Lifecycle</span>
          </h3>
        </div>

        {/* Stepper buttons */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button 
            disabled={step === 1}
            onClick={() => setStep(prev => (prev - 1) as MVCStep)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: step === 1 ? '#475569' : '#ffffff',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem'
            }}
          >
            ◀ Back
          </button>
          <span style={{ fontSize: '0.85rem', color: '#cbd5e1', width: '80px', textAlign: 'center' }}>
            Step {step} of 7
          </span>
          <button 
            disabled={step === 7}
            onClick={() => setStep(prev => (prev + 1) as MVCStep)}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: step === 7 ? '#475569' : '#ffffff',
              cursor: step === 7 ? 'not-allowed' : 'pointer',
              padding: '2px 8px',
              fontSize: '0.8rem'
            }}
          >
            Next ▶
          </button>
        </div>
      </div>

      {/* Visual Canvas Area */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg">
        <svg viewBox="0 0 680 180" className="interactive-diagram-svg">
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

          {/* Client Node */}
          <g>
            <rect x="20" y="65" width="90" height="40" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={step === 1 || step === 7 ? '#a855f7' : 'rgba(255,255,255,0.08)'} />
            <text x="65" y="89" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>Client</text>
          </g>

          {/* DispatcherServlet (Front Controller) */}
          <g>
            <rect x="160" y="50" width="130" height="70" rx="6" ry="6" fill="rgba(45, 212, 191, 0.05)" stroke={step >= 2 ? '#2dd4bf' : 'rgba(255, 255, 255, 0.08)'} strokeWidth="1.5" />
            <text x="225" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>DispatcherServlet</text>
            <text x="225" y="96" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>[Front Controller]</text>
          </g>

          {/* HandlerMapping helper */}
          <g>
            <rect x="330" y="15" width="120" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={step >= 3 ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)'} />
            <text x="390" y="37" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 3 ? '#fbbf24' : '#94a3b8', textAnchor: 'middle' }}>HandlerMapping</text>
          </g>

          {/* Controller helper */}
          <g>
            <rect x="490" y="45" width="110" height="35" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke={step >= 4 ? '#4ade80' : 'rgba(255, 255, 255, 0.08)'} />
            <text x="545" y="67" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 4 ? '#4ade80' : '#94a3b8', textAnchor: 'middle' }}>@Controller</text>
          </g>

          {/* ViewResolver helper */}
          <g>
            <rect x="490" y="95" width="110" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={step >= 5 ? '#a855f7' : 'rgba(255, 255, 255, 0.08)'} />
            <text x="545" y="117" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 5 ? '#a855f7' : '#94a3b8', textAnchor: 'middle' }}>ViewResolver</text>
          </g>

          {/* View renderer */}
          <g>
            <rect x="330" y="130" width="120" height="35" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke={step >= 6 ? '#2dd4bf' : 'rgba(255, 255, 255, 0.08)'} />
            <text x="390" y="152" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: step >= 6 ? '#2dd4bf' : '#94a3b8', textAnchor: 'middle' }}>View Render</text>
          </g>

          {/* Flow Lines */}
          <g>
            {/* Step 1 Flow */}
            <path id="flow-1" d="M 110 85 L 154 85" fill="none" stroke={step === 1 ? '#2dd4bf' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 1 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 1 ? 'interactive-diagram-flowing-path' : ''} />
            {step === 1 && <circle r="2.5" fill="#2dd4bf"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#flow-1" /></animateMotion></circle>}

            {/* Step 3 Flow: DS -> HandlerMapping */}
            <path id="flow-2" d="M 260 50 Q 290 28 324 28" fill="none" stroke={step === 2 || step === 3 ? '#fbbf24' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 2 || step === 3 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 2 || step === 3 ? 'interactive-diagram-flowing-path' : ''} />
            {(step === 2 || step === 3) && <circle r="2.5" fill="#fbbf24"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#flow-2" /></mpath></circle>}

            {/* Step 4 Flow: DS -> Controller */}
            <path id="flow-3" d="M 290 70 L 484 70" fill="none" stroke={step === 4 ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 4 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 4 ? 'interactive-diagram-flowing-path' : ''} />
            {step === 4 && <circle r="2.5" fill="#4ade80"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#flow-3" /></animateMotion></circle>}

            {/* Step 5 Flow: DS -> ViewResolver */}
            <path id="flow-4" d="M 290 95 L 484 105" fill="none" stroke={step === 5 ? '#a855f7' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 5 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 5 ? 'interactive-diagram-flowing-path' : ''} />
            {step === 5 && <circle r="2.5" fill="#a855f7"><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#flow-4" /></animateMotion></circle>}

            {/* Step 6 Flow: DS -> View */}
            <path id="flow-5" d="M 260 120 Q 290 142 324 142" fill="none" stroke={step === 6 ? '#2dd4bf' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 6 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 6 ? 'interactive-diagram-flowing-path' : ''} />
            {step === 6 && <circle r="2.5" fill="#2dd4bf"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#flow-5" /></animateMotion></circle>}

            {/* Step 7 Flow: DS -> Client */}
            <path id="flow-6" d="M 160 95 L 116 95" fill="none" stroke={step === 7 ? '#4ade80' : '#2e354f'} strokeWidth="1.5" markerEnd={step === 7 ? 'url(#arrow-cyan)' : 'url(#arrow-gray)'} className={step === 7 ? 'interactive-diagram-flowing-path' : ''} />
            {step === 7 && <circle r="2.5" fill="#4ade80"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#flow-6" /></animateMotion></circle>}
          </g>
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        current.type === 'purple' ? 'details-purple' : current.type === 'cyan' ? 'details-cyan' : current.type === 'yellow' ? 'details-yellow' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{current.title}</h3>
        </div>
        <p><strong>Overview:</strong> {current.overview}</p>
        
        <ul>
          <li><strong>Processing Mechanics:</strong>
            <ul>
              {current.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </li>
        </ul>
      </div>

      <p className="interactive-diagram-helper-text">
        💡 Use the "Next" and "Back" controls above to follow the request lifecycle in order.
      </p>
    </div>
  );
}
