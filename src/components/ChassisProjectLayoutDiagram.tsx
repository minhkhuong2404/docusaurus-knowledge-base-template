import React, { useState } from 'react';

interface FileNode {
  id: string;
  path: string;
  type: 'file' | 'folder';
  description: string;
  details: string;
  badge: string;
  color: string;
}

const FILES: FileNode[] = [
  {
    id: 'pom',
    path: 'pom.xml',
    type: 'file',
    description: 'Maven Project Object Model for chassis library.',
    details: 'Declares spring-boot-autoconfigure, resilience4j-spring-boot3, micrometer-tracing-bridge-otel, and spring-boot-starter-security dependencies.',
    badge: 'Maven Build',
    color: '#fbbf24',
  },
  {
    id: 'autoconfig',
    path: 'com/company/chassis/ChassisAutoConfiguration.java',
    type: 'file',
    description: 'Root Spring Boot @AutoConfiguration entry point.',
    details: 'Annotated with @AutoConfiguration and @ConditionalOnWebApplication. Imports all sub-configurations (logging, security, error handling, tracing, resilience).',
    badge: 'Auto-Config Root',
    color: '#34d399',
  },
  {
    id: 'logging',
    path: 'com/company/chassis/logging/MdcRequestContextFilter.java',
    type: 'file',
    description: 'Servlet filter for MDC context enrichment.',
    details: 'Ordered HIGHEST_PRECEDENCE. Extracts traceId, userId, customerId, tenantId from HTTP headers and populates org.slf4j.MDC for JSON logs.',
    badge: 'Logging Filter',
    color: '#38bdf8',
  },
  {
    id: 'error',
    path: 'com/company/chassis/error/GlobalExceptionHandler.java',
    type: 'file',
    description: 'Canonical Spring @RestControllerAdvice error handler.',
    details: 'Catches ResourceNotFoundException, ValidationException, and generic Exceptions. Returns standardized ErrorResponse DTO with traceId.',
    badge: 'Error Handler',
    color: '#f87171',
  },
  {
    id: 'security',
    path: 'com/company/chassis/security/SecurityHeadersFilter.java',
    type: 'file',
    description: 'Security headers enforcement filter.',
    details: 'Automatically sets HSTS, Content-Security-Policy (CSP), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), and Referrer-Policy on all HTTP responses.',
    badge: 'Security Filter',
    color: '#f97316',
  },
  {
    id: 'observability',
    path: 'com/company/chassis/observability/TracingConfiguration.java',
    type: 'file',
    description: 'OpenTelemetry & Micrometer tracing wiring.',
    details: 'Configures OTLP trace exporters and W3C tracecontext header propagation across microservice calls.',
    badge: 'Tracing Config',
    color: '#a78bfa',
  },
  {
    id: 'resilience',
    path: 'com/company/chassis/resilience/ResilienceDefaultsConfiguration.java',
    type: 'file',
    description: 'Resilience4j default registry setup.',
    details: 'Provides default CircuitBreakerRegistry & TimeLimiterRegistry beans with @ConditionalOnMissingBean fallback.',
    badge: 'Resilience Config',
    color: '#2dd4bf',
  },
  {
    id: 'imports',
    path: 'resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports',
    type: 'file',
    description: 'Spring Boot 3 auto-configuration registration file.',
    details: 'Contains the fully qualified class name com.company.chassis.ChassisAutoConfiguration so Spring Boot 3 automatically loads the starter.',
    badge: 'SPI Registration',
    color: '#8b5cf6',
  },
  {
    id: 'logback',
    path: 'resources/logback-spring.xml',
    type: 'file',
    description: 'Standard JSON Logback configuration.',
    details: 'Configures LogstashEncoder with MDC field inclusion and console appender for cloud-native container log aggregation (Kubernetes / Datadog).',
    badge: 'Log Config',
    color: '#38bdf8',
  },
];

export default function ChassisProjectLayoutDiagram() {
  const [selected, setSelected] = useState<FileNode>(FILES[1]);

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <span>Microservice Chassis Project Layout &amp; Class Hierarchy Explorer</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* File Tree List */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ padding: '14px', borderRadius: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase', marginBottom: '10px' }}>
            shared-service-chassis / src / main /
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {FILES.map(f => {
              const isSelected = selected.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelected(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                    background: isSelected ? `${f.color}20` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? f.color : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ color: f.color, fontFamily: 'monospace', fontSize: '13px' }}>📄</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: isSelected ? f.color : 'var(--ifm-color-content)', fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.path}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected File Details */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: `1.5px solid ${selected.color}50` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: `${selected.color}20`, color: selected.color }}>
              {selected.badge}
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 800, color: selected.color, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '10px' }}>
            {selected.path}
          </div>

          <div style={{ fontSize: '12.5px', color: 'var(--ifm-color-content)', marginBottom: '12px', lineHeight: '1.5' }}>
            {selected.description}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
            <strong style={{ color: selected.color }}>Under the hood: </strong>{selected.details}
          </div>
        </div>
      </div>
    </div>
  );
}
