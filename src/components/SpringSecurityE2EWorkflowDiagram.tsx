import React, { useState } from 'react';

interface WorkflowStep {
  id: number;
  title: string;
  component: string;
  badge: string;
  color: string;
  description: string;
  technicalDetails: string;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    title: '1. Client HTTP Request',
    component: 'Client / Browser',
    badge: 'Inbound Request',
    color: '#38bdf8',
    description: 'The client sends an HTTP request containing credentials (e.g. Bearer JWT token, Basic Auth header, or Form Login parameters).',
    technicalDetails: 'Standard HTTP request arriving at the Servlet Container (Tomcat / Jetty / Undertow).',
  },
  {
    id: 2,
    title: '2. DelegatingFilterProxy Interception',
    component: 'DelegatingFilterProxy',
    badge: 'Servlet Bridge',
    color: '#a78bfa',
    description: 'Servlet container delegates request to DelegatingFilterProxy, a standard Servlet Filter registered in web.xml / Spring Boot Servlet context.',
    technicalDetails: 'Bridges standard Servlet container lifecycle with Spring ApplicationContext. Finds the Spring Bean named "springSecurityFilterChain".',
  },
  {
    id: 3,
    title: '3. FilterChainProxy Routing',
    component: 'FilterChainProxy',
    badge: 'Chain Router',
    color: '#38bdf8',
    description: 'FilterChainProxy inspects request URL patterns and selects the matching SecurityFilterChain bean.',
    technicalDetails: 'Matches request path against requestMatchers (e.g. /api/** vs /public/**) to pick the exact filter array to execute.',
  },
  {
    id: 4,
    title: '4. AuthenticationFilter Execution',
    component: 'AuthenticationFilter',
    badge: 'Credential Extractor',
    color: '#fbbf24',
    description: 'AuthenticationFilter (e.g. UsernamePasswordAuthenticationFilter or BearerTokenAuthenticationFilter) extracts raw credentials.',
    technicalDetails: 'Instantiates an unauthenticated Authentication object (e.g., UsernamePasswordAuthenticationToken) holding raw principal & credentials.',
  },
  {
    id: 5,
    title: '5. AuthenticationManager (ProviderManager)',
    component: 'ProviderManager',
    badge: 'Manager Orchestrator',
    color: '#2dd4bf',
    description: 'The filter passes the unauthenticated token to AuthenticationManager (default implementation: ProviderManager).',
    technicalDetails: 'Iterates through registered AuthenticationProvider list until a provider reports support for the token type via supports().',
  },
  {
    id: 6,
    title: '6. AuthenticationProvider & PasswordEncoder',
    component: 'DaoAuthenticationProvider',
    badge: 'Credential Verifier',
    color: '#34d399',
    description: 'DaoAuthenticationProvider delegates to UserDetailsService to retrieve UserDetails, then verifies the raw password using PasswordEncoder.',
    technicalDetails: 'Calls PasswordEncoder.matches(rawPassword, encodedPassword). Uses BCrypt / Argon2 to prevent timing and brute-force attacks.',
  },
  {
    id: 7,
    title: '7. UserDetailsService & DB Lookup',
    component: 'UserDetailsService / DAO',
    badge: 'User Loader',
    color: '#fbbf24',
    description: 'UserDetailsService queries the database or directory to load the user profile and GrantedAuthority roles/permissions.',
    technicalDetails: 'Returns UserDetails domain object containing user status flags (accountNonExpired, credentialsNonExpired, enabled) and GrantedAuthority list.',
  },
  {
    id: 8,
    title: '8. SecurityContextHolder Storage',
    component: 'SecurityContextHolder',
    badge: 'ThreadLocal Storage',
    color: '#4ade80',
    description: 'On successful verification, a fully authenticated Authentication object is stored in SecurityContextHolder.',
    technicalDetails: 'Stored inside ThreadLocal by default. Accessible statically via SecurityContextHolder.getContext().getAuthentication() throughout the HTTP request thread.',
  },
];

export default function SpringSecurityE2EWorkflowDiagram(): React.JSX.Element {
  const [activeStep, setActiveStep] = useState<WorkflowStep>(WORKFLOW_STEPS[3]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
        <span>Spring Security End-to-End Authentication Workflow Explorer</span>
      </div>

      {/* Step Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
        {WORKFLOW_STEPS.map(s => {
          const isSelected = activeStep.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s)}
              style={{
                padding: '8px 6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, textAlign: 'center',
                background: isSelected ? `${s.color}25` : 'rgba(255,255,255,0.03)',
                color: isSelected ? s.color : 'var(--ifm-color-content-secondary)',
                boxShadow: isSelected ? `0 0 0 1.5px ${s.color}60` : '0 0 0 1px rgba(255,255,255,0.08)',
                transition: 'all 0.2s ease',
              }}
            >
              Step {s.id}
            </button>
          );
        })}
      </div>

      {/* Pipeline Flow Visualization */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.2fr 1fr 0.2fr 1fr 0.2fr 1.2fr', gap: '6px', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: activeStep.id <= 2 ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${activeStep.id <= 2 ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, padding: '10px 6px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8' }}>Servlet Container</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>DelegatingFilterProxy</div>
          </div>

          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 800 }}>➔</div>

          <div style={{ background: activeStep.id >= 3 && activeStep.id <= 4 ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${activeStep.id >= 3 && activeStep.id <= 4 ? '#fbbf24' : 'rgba(255,255,255,0.08)'}`, padding: '10px 6px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24' }}>FilterChainProxy</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>AuthenticationFilter</div>
          </div>

          <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 800 }}>➔</div>

          <div style={{ background: activeStep.id >= 5 && activeStep.id <= 7 ? 'rgba(45,212,191,0.15)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${activeStep.id >= 5 && activeStep.id <= 7 ? '#2dd4bf' : 'rgba(255,255,255,0.08)'}`, padding: '10px 6px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#2dd4bf' }}>ProviderManager</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>UserDetailsService + DB</div>
          </div>

          <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: 800 }}>➔</div>

          <div style={{ background: activeStep.id === 8 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${activeStep.id === 8 ? '#4ade80' : 'rgba(255,255,255,0.08)'}`, padding: '10px 6px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#4ade80' }}>SecurityContext</div>
            <div style={{ fontSize: '9.5px', color: 'var(--ifm-color-content-secondary)', marginTop: '2px' }}>ThreadLocal Principal</div>
          </div>
        </div>
      </div>

      {/* Step Detail Card */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${activeStep.color}50` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13.5px', fontWeight: 800, color: activeStep.color }}>{activeStep.title}</span>
          <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: `${activeStep.color}25`, color: activeStep.color, fontWeight: 700 }}>
            {activeStep.badge}
          </span>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', lineHeight: '1.5', marginBottom: '8px' }}>
          <strong>Workflow Function:</strong> {activeStep.description}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', border: '1px solid rgba(255,255,255,0.08)', lineHeight: '1.4' }}>
          <strong>Under-The-Hood Architecture:</strong> {activeStep.technicalDetails}
        </div>
      </div>
    </div>
  );
}
