import React, { useState } from 'react';

type SecurityMode = 'FILTER_CHAIN' | 'AUTH_FLOW' | 'EXCEPTION_FLOW';

interface SecurityDetails {
  title: string;
  type: 'purple' | 'cyan' | 'green';
  overview: string;
  bullets: string[];
}

const SECURITY_DATA: Record<SecurityMode, SecurityDetails> = {
  FILTER_CHAIN: {
    title: 'Spring SecurityFilterChain Interception',
    type: 'purple',
    overview: 'HTTP requests are intercepted by a ordered chain of Servlet Filters before arriving at the Spring MVC DispatcherServlet.',
    bullets: [
      'CorsFilter & CsrfFilter: Handles cross-origin setups and validates CSRF tokens to block malicious scripting.',
      'AuthenticationFilter: Intercepts requests looking for credentials (headers, cookies, basic auth) to build authentication tokens.',
      'ExceptionTranslationFilter: Wraps subsequent filter execution in a try-catch block to intercept downstream security faults.',
      'AuthorizationFilter: The final gatekeeper that checks the authenticated user\'s roles and permissions against context paths.'
    ]
  },
  AUTH_FLOW: {
    title: 'Spring Authentication Manager & Provider Architecture',
    type: 'cyan',
    overview: 'Details how credentials are validated to establish the caller\'s identity context.',
    bullets: [
      'AuthenticationFilter delegate: Extract credentials from request headers/body and delegates to AuthenticationManager.',
      'AuthenticationManager (ProviderManager): Directs authentication requests to registered AuthenticationProviders.',
      'AuthenticationProvider: Implements specific checks (e.g., DaoAuthenticationProvider queries UserDetailsService to load user models and compares digests via PasswordEncoder).',
      'SecurityContextHolder: Stores the final authenticated Principal token in thread-local storage for reference.'
    ]
  },
  EXCEPTION_FLOW: {
    title: 'Security Exceptions Resolution Branching',
    type: 'green',
    overview: 'Explains how ExceptionTranslationFilter catches exceptions and maps them to HTTP responses.',
    bullets: [
      'AuthenticationException: Clears the SecurityContextHolder and delegates to AuthenticationEntryPoint to return a 401 Unauthorized challenge.',
      'AccessDeniedException (Anonymous Caller): Translates to an AuthenticationEntryPoint invoke, prompting the client to log in first (401).',
      'AccessDeniedException (Authenticated Caller): Invokes the AccessDeniedHandler, returning a 403 Forbidden because of insufficient authorization roles.'
    ]
  }
};

export default function SpringSecurityFilterDiagram({ defaultMode = 'FILTER_CHAIN' }: { defaultMode?: SecurityMode }): React.JSX.Element {
  const [mode, setMode] = useState<SecurityMode>(defaultMode);

  const selectedData = SECURITY_DATA[mode];

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
          
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>🛡️</span>
            <span style={{ color: mode === 'FILTER_CHAIN' ? '#a855f7' : mode === 'AUTH_FLOW' ? '#2dd4bf' : '#4ade80' }}>
              Security Context: {mode === 'FILTER_CHAIN' ? 'Filter Chain' : mode === 'AUTH_FLOW' ? 'Authentication' : 'Exception Handler'}
            </span>
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setMode('FILTER_CHAIN')}
            style={{
              background: mode === 'FILTER_CHAIN' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'FILTER_CHAIN' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'FILTER_CHAIN' ? '#a855f7' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Filter Chain
          </button>
          <button 
            onClick={() => setMode('AUTH_FLOW')}
            style={{
              background: mode === 'AUTH_FLOW' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'AUTH_FLOW' ? '1px solid #2dd4bf' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'AUTH_FLOW' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Authentication
          </button>
          <button 
            onClick={() => setMode('EXCEPTION_FLOW')}
            style={{
              background: mode === 'EXCEPTION_FLOW' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: mode === 'EXCEPTION_FLOW' ? '1px solid #4ade80' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '4px',
              color: mode === 'EXCEPTION_FLOW' ? '#4ade80' : '#94a3b8',
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
          >
            Exception Flow
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

          {mode === 'FILTER_CHAIN' && (
            /* FILTER CHAIN REQUEST INTERCEPTION */
            <g>
              {/* HTTP Request */}
              <rect x="20" y="80" width="80" height="40" rx="4" ry="4" fill="none" stroke="rgba(255,255,255,0.08)" />
              <text x="60" y="104" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>HTTP Request</text>

              {/* Filters Container */}
              <rect x="150" y="25" width="340" height="150" rx="6" ry="6" fill="rgba(168, 85, 247, 0.05)" stroke="#a855f7" strokeWidth="2" />
              <text x="320" y="42" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 10, fill: '#c084fc', textAnchor: 'middle' }}>SecurityFilterChain (Servlet Filters)</text>

              <rect x="170" y="55" width="300" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="320" y="70" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>CorsFilter → CsrfFilter</text>

              <rect x="170" y="85" width="300" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="320" y="100" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>AuthenticationFilter → ExceptionTranslationFilter</text>

              <rect x="170" y="115" width="300" height="24" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="320" y="130" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8.5, fill: '#cbd5e1', textAnchor: 'middle' }}>AuthorizationFilter (Gatekeeper)</text>

              {/* DispatcherServlet */}
              <rect x="530" y="80" width="130" height="40" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="595" y="104" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#a855f7', textAnchor: 'middle' }}>DispatcherServlet</text>

              {/* Flow Path */}
              <path id="path-fc-1" d="M 100 100 L 144 100" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-fc-1" /></animateMotion></circle>

              <path id="path-fc-2" d="M 490 100 L 524 100" fill="none" stroke="#a855f7" strokeWidth="1.5" markerEnd="url(#arrow-purple)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#a855f7" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-fc-2" /></animateMotion></circle>
            </g>
          )}

          {mode === 'AUTH_FLOW' && (
            /* AUTHENTICATION PROVIDER AND MANAGER INTERNALS */
            <g>
              {/* Auth Filter */}
              <rect x="15" y="60" width="115" height="45" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="72.5" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>Authentication</text>
              <text x="72.5" y="95" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7.5, fill: '#2dd4bf', textAnchor: 'middle' }}>Filter</text>

              {/* Manager */}
              <rect x="175" y="60" width="130" height="45" rx="4" ry="4" fill="rgba(45, 212, 191, 0.05)" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="240" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#ffffff', textAnchor: 'middle' }}>Authentication</text>
              <text x="240" y="95" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#cbd5e1', textAnchor: 'middle' }}>Manager</text>

              {/* Provider */}
              <rect x="350" y="60" width="130" height="45" rx="4" ry="4" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="415" y="82" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9, fill: '#cbd5e1', textAnchor: 'middle' }}>Authentication</text>
              <text x="415" y="95" style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: 7, fill: '#94a3b8', textAnchor: 'middle' }}>Provider</text>

              {/* Helpers */}
              <rect x="525" y="30" width="130" height="30" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="590" y="49" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>UserDetailsService</text>

              <rect x="525" y="70" width="130" height="30" rx="3" ry="3" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" />
              <text x="590" y="89" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#cbd5e1', textAnchor: 'middle' }}>PasswordEncoder</text>

              {/* Context */}
              <rect x="290" y="135" width="250" height="30" rx="4" ry="4" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="1.5" />
              <text x="415" y="154" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#4ade80', textAnchor: 'middle' }}>🔒 SecurityContextHolder (Principal Saved)</text>

              {/* Flow Paths */}
              <path id="path-af-1" d="M 130 82 L 169 82" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-af-1" /></animateMotion></circle>

              <path id="path-af-2" d="M 305 82 L 344 82" fill="none" stroke="#2dd4bf" strokeWidth="1.5" markerEnd="url(#arrow-cyan)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#2dd4bf" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-af-2" /></animateMotion></circle>

              <path id="path-af-db" d="M 480 75 L 519 55" fill="none" stroke="#2dd4bf" strokeWidth="1" markerEnd="url(#arrow-cyan)" />
              <path id="path-af-pw" d="M 480 85 L 519 85" fill="none" stroke="#2dd4bf" strokeWidth="1" markerEnd="url(#arrow-cyan)" />

              <path id="path-af-context" d="M 415 105 L 415 130" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" />
            </g>
          )}

          {mode === 'EXCEPTION_FLOW' && (
            /* EXCEPTION TRANSLATION DECISION PATHS */
            <g>
              {/* Entry translation filter */}
              <rect x="20" y="65" width="160" height="50" rx="6" ry="6" fill="rgba(74, 222, 128, 0.05)" stroke="#4ade80" strokeWidth="2" />
              <text x="100" y="90" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 9.5, fill: '#ffffff', textAnchor: 'middle' }}>ExceptionTranslation</text>
              <text x="100" y="103" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 8, fill: '#4ade80', textAnchor: 'middle' }}>Filter (Try-Catch)</text>

              {/* Choice point */}
              <polygon points="300,90 340,65 380,90 340,115" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" />
              <text x="340" y="94" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#fbbf24', textAnchor: 'middle' }}>Which type?</text>
              
              <path id="path-ef-catch" d="M 180 90 L 294 90" fill="none" stroke="#4ade80" strokeWidth="1.5" markerEnd="url(#arrow-green)" className="interactive-diagram-flowing-path" />
              <circle r="2.5" fill="#4ade80" className="interactive-diagram-flowing-dot"><animateMotion dur="0.8s" repeatCount="indefinite"><mpath href="#path-ef-catch" /></animateMotion></circle>

              {/* Branch 1: AuthenticationException */}
              <g>
                <rect x="470" y="30" width="180" height="45" rx="4" ry="4" fill="rgba(239,68,68,0.08)" stroke="#f87171" strokeWidth="1.5" />
                <text x="560" y="51" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#f87171', textAnchor: 'middle' }}>AuthenticationEntryPoint</text>
                <text x="560" y="64" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>Returns 401 Unauthorized</text>
                
                <path id="path-ef-401" d="M 340 65 Q 340 50 464 50" fill="none" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
              </g>

              {/* Branch 2: AccessDeniedException */}
              <g>
                <rect x="470" y="110" width="180" height="45" rx="4" ry="4" fill="rgba(239,68,68,0.08)" stroke="#f87171" strokeWidth="1.5" />
                <text x="560" y="131" style={{ fontFamily: 'Inter', fontWeight: 800, fontSize: 8.5, fill: '#f87171', textAnchor: 'middle' }}>AccessDeniedHandler</text>
                <text x="560" y="144" style={{ fontFamily: 'Inter', fontWeight: 700, fontSize: 7, fill: '#f87171', textAnchor: 'middle' }}>Returns 403 Forbidden</text>
                
                <path id="path-ef-403" d="M 340 115 Q 340 130 464 130" fill="none" stroke="#f87171" strokeWidth="1.5" markerEnd="url(#arrow-red)" />
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* Details Card */}
      <div className={`interactive-diagram-details-card ${
        selectedData.type === 'purple' ? 'details-purple' : selectedData.type === 'cyan' ? 'details-cyan' : 'details-green'
      }`}>
        <div className="interactive-diagram-card-header">
          
          <h3>{selectedData.title}</h3>
        </div>
        <p><strong>Architecture Mapping:</strong> {selectedData.overview}</p>
        
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
        💡 Use the tabs above to toggle between Filter Chain, Authentication, and Exception Resolution views.
      </p>
    </div>
  );
}
