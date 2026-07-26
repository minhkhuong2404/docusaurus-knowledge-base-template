import React, { useState } from 'react';

interface ModuleItem {
  id: string;
  name: string;
  category: string;
  color: string;
  description: string;
  beans: string[];
}

const MODULES: ModuleItem[] = [
  {
    id: 'logging',
    name: 'Structured Logging',
    category: 'Observability',
    color: '#38bdf8',
    description: 'Logback JSON layout with MDC RequestContextFilter. Injects traceId, userId, customerId, tenantId into every log event.',
    beans: ['MdcRequestContextFilter', 'LogbackSpringProperties'],
  },
  {
    id: 'tracing',
    name: 'Distributed Tracing',
    category: 'Observability',
    color: '#34d399',
    description: 'Micrometer Tracing + OpenTelemetry auto-configuration. Propagates W3C traceparent headers across HTTP and Kafka boundaries.',
    beans: ['TracingConfiguration', 'OtelSpanExporter'],
  },
  {
    id: 'metrics',
    name: 'Prometheus Metrics',
    category: 'Observability',
    color: '#fbbf24',
    description: 'Micrometer Prometheus meter registry export with standard JVM, Tomcat, and HTTP request metrics pre-configured.',
    beans: ['PrometheusMeterRegistry', 'CommonTagsCustomizer'],
  },
  {
    id: 'health',
    name: 'Health Indicators',
    category: 'Operations',
    color: '#a78bfa',
    description: 'Spring Boot Actuator health endpoint with custom DB, Redis, and downstream service health indicators.',
    beans: ['ServiceHealthIndicator', 'CompositeHealthContributor'],
  },
  {
    id: 'error',
    name: 'Canonical Error Handler',
    category: 'Core API',
    color: '#f87171',
    description: 'GlobalControllerAdvice returning standard RFC7807 ErrorResponse DTO linked to MDC trace ID.',
    beans: ['GlobalExceptionHandler', 'ErrorResponseBuilder'],
  },
  {
    id: 'security',
    name: 'Security Headers',
    category: 'Security',
    color: '#f97316',
    description: 'OncePerRequestFilter enforcing HSTS, CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), and Referrer Policy.',
    beans: ['SecurityHeadersFilter'],
  },
  {
    id: 'resilience',
    name: 'Resilience Defaults',
    category: 'Resilience',
    color: '#2dd4bf',
    description: 'Resilience4j CircuitBreakerRegistry & TimeLimiterRegistry defaults with @ConditionalOnMissingBean fallback.',
    beans: ['ChassisCircuitBreakerRegistry', 'ChassisTimeLimiterRegistry'],
  },
  {
    id: 'config',
    name: 'Config Bootstrap',
    category: 'Infrastructure',
    color: '#8b5cf6',
    description: 'Spring Cloud Config / HashiCorp Vault bootstrap listener for centralized property resolution.',
    beans: ['VaultBootstrapConfiguration', 'CloudConfigPropertySource'],
  },
];

export default function ChassisArchitectureDiagram() {
  const [selectedModule, setSelectedModule] = useState<ModuleItem>(MODULES[0]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>Microservice Chassis Modular Architecture Explorer</span>
      </div>

      {/* Module Grid */}
      <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>
          Bundled Chassis Modules (shared-service-chassis.jar)
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          {MODULES.map(m => {
            const isSelected = selectedModule.id === m.id;
            return (
              <div
                key={m.id}
                onClick={() => setSelectedModule(m)}
                style={{
                  background: isSelected ? `${m.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? m.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: '10px',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? `0 0 12px ${m.color}30` : 'none',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: m.color, textTransform: 'uppercase' }}>{m.category}</div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--ifm-color-content)', marginTop: '2px' }}>{m.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Panel */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1px solid ${selectedModule.color}50` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: selectedModule.color }}>{selectedModule.name}</div>
          <div style={{ fontSize: '10.5px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: `${selectedModule.color}20`, color: selectedModule.color }}>
            {selectedModule.category}
          </div>
        </div>

        <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: '1.5' }}>
          {selectedModule.description}
        </div>

        <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Auto-Exported Beans &amp; Filters
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {selectedModule.beans.map(b => (
            <span key={b} style={{ fontSize: '11px', fontFamily: 'monospace', padding: '3px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.3)', color: selectedModule.color, border: '1px solid rgba(255,255,255,0.08)' }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
