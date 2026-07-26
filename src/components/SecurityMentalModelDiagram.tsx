import React, { useState } from 'react';

interface Layer {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  technologies: string[];
  threats: string[];
  principle: string;
}

const LAYERS: Layer[] = [
  {
    id: 'perimeter',
    label: 'PERIMETER',
    sublabel: 'First line of defence',
    color: '#f87171',
    technologies: ['WAF', 'DDoS Protection', 'Firewall', 'CDN Edge Rules'],
    threats: ['DDoS attacks', 'Bot traffic', 'IP-based attacks', 'Volumetric floods'],
    principle: 'Block malicious traffic before it ever reaches your application servers.',
  },
  {
    id: 'transport',
    label: 'TRANSPORT',
    sublabel: 'Encrypted in transit',
    color: '#f97316',
    technologies: ['TLS 1.3', 'mTLS', 'Certificate Management', 'HSTS'],
    threats: ['Man-in-the-middle', 'Downgrade attacks', 'Certificate spoofing', 'Eavesdropping'],
    principle: 'Encrypt all communication channels — never transmit secrets over plain HTTP.',
  },
  {
    id: 'identity',
    label: 'IDENTITY',
    sublabel: 'Who you are',
    color: '#fbbf24',
    technologies: ['AuthN / OAuth 2.0', 'MFA / Passkeys', 'SSO / SAML / OIDC', 'Token Rotation'],
    threats: ['Credential stuffing', 'Phishing', 'Session hijacking', 'Token leakage'],
    principle: 'Verify identity strongly — passwords alone are not enough. Rotate tokens, enforce MFA.',
  },
  {
    id: 'application',
    label: 'APPLICATION',
    sublabel: 'What you can do',
    color: '#34d399',
    technologies: ['AuthZ / RBAC / ABAC', 'Input Validation', 'OWASP Controls', 'CSP / CORS'],
    threats: ['SQL Injection', 'XSS', 'CSRF', 'IDOR / Broken Access Control'],
    principle: 'Validate every input. Authorise every action server-side — never trust the client.',
  },
  {
    id: 'data',
    label: 'DATA',
    sublabel: 'Protect the crown jewels',
    color: '#38bdf8',
    technologies: ['AES-256-GCM at rest', 'Field-level masking', 'PII tokenisation', 'Key Management (Vault)'],
    threats: ['Data exfiltration', 'Insider threats', 'Unencrypted backups', 'Key exposure'],
    principle: 'Encrypt sensitive data at rest. Mask PII in logs. Never store plaintext passwords.',
  },
  {
    id: 'audit',
    label: 'AUDIT',
    sublabel: 'Know what happened',
    color: '#a78bfa',
    technologies: ['Immutable Logs', 'SIEM / Alerting', 'Anomaly Detection', 'Forensic Trails'],
    threats: ['Log tampering', 'Silent breaches', 'Insider cover-ups', 'Compliance gaps'],
    principle: 'Log every auth event and data access. Alerts must fire before you hear from customers.',
  },
];

export default function SecurityMentalModelDiagram() {
  const [selected, setSelected] = useState<string | null>(null);

  const selectedLayer = LAYERS.find(l => l.id === selected) ?? null;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Security Mental Model — Defence in Depth</span>
        <span style={{
          marginLeft: 'auto', fontSize: '11px', padding: '4px 10px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.06)', color: 'var(--ifm-color-content-secondary)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          Click a layer to inspect
        </span>
      </div>

      {/* Two-column layout: layers + detail */}
      <style>{`
        @media (max-width: 768px) {
          .smm-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="smm-grid" style={{
        display: 'grid',
        gridTemplateColumns: '55% 45%',
        gap: '16px',
        alignItems: 'start',
      }}>

        {/* LEFT: stacked layer cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {LAYERS.map((layer, idx) => {
            const isSelected = selected === layer.id;
            const isAbove = selected !== null && LAYERS.findIndex(l => l.id === selected) > idx;
            return (
              <div
                key={layer.id}
                onClick={() => setSelected(isSelected ? null : layer.id)}
                style={{
                  position: 'relative',
                  padding: '14px 18px',
                  cursor: 'pointer',
                  background: isSelected
                    ? `${layer.color}15`
                    : isAbove
                    ? 'rgba(255,255,255,0.025)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${isSelected ? layer.color + '60' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: idx === 0 ? '10px 10px 0 0' : idx === LAYERS.length - 1 ? '0 0 10px 10px' : '0',
                  borderTop: idx > 0 ? 'none' : undefined,
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 0 0 1px ${layer.color}40, inset 0 0 20px ${layer.color}08` : 'none',
                }}
              >
                {/* Left accent bar */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                  background: layer.color,
                  borderRadius: idx === 0 ? '10px 0 0 0' : idx === LAYERS.length - 1 ? '0 0 0 10px' : '0',
                  opacity: isSelected ? 1 : 0.35,
                  transition: 'opacity 0.25s ease',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '6px' }}>
                  {/* Layer badge */}
                  <div style={{
                    minWidth: '96px',
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                    color: layer.color,
                    textTransform: 'uppercase' as const,
                  }}>
                    {layer.label}
                  </div>

                  {/* Divider */}
                  <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' }} />

                  {/* Technologies pills */}
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '5px', flex: 1 }}>
                    {layer.technologies.map(tech => (
                      <span key={tech} style={{
                        fontSize: '10.5px', padding: '2px 7px', borderRadius: '4px',
                        background: `${layer.color}12`,
                        border: `1px solid ${layer.color}28`,
                        color: 'var(--ifm-color-content-secondary)',
                        fontFamily: 'monospace',
                        transition: 'all 0.2s ease',
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Chevron */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                       stroke={isSelected ? layer.color : 'rgba(255,255,255,0.3)'}
                       strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                       style={{ flexShrink: 0, transition: 'transform 0.25s ease, stroke 0.25s ease',
                                transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            );
          })}

          {/* Bottom label */}
          <div style={{
            marginTop: '10px', textAlign: 'center', fontSize: '10.5px',
            color: 'var(--ifm-color-content-secondary)', letterSpacing: '0.06em',
          }}>
            Attackers always find the weakest layer — every layer must hold independently
          </div>
        </div>

        {/* RIGHT: detail panel */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '20px',
          minHeight: '260px',
          display: 'flex', flexDirection: 'column',
          justifyContent: selectedLayer ? 'flex-start' : 'center',
          transition: 'all 0.3s ease',
        }}>
          {selectedLayer ? (
            <div>
              {/* Detail header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: selectedLayer.color,
                  boxShadow: `0 0 6px ${selectedLayer.color}`,
                }} />
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedLayer.color }}>
                  {selectedLayer.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)' }}>
                  — {selectedLayer.sublabel}
                </div>
              </div>

              {/* Principle */}
              <div style={{
                fontSize: '12px', lineHeight: '1.6',
                color: 'var(--ifm-color-content)',
                padding: '10px 12px', borderRadius: '8px',
                background: `${selectedLayer.color}0e`,
                border: `1px solid ${selectedLayer.color}25`,
                marginBottom: '14px',
              }}>
                {selectedLayer.principle}
              </div>

              {/* Threats */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' as const,
                  marginBottom: '7px',
                }}>
                  Threats at this layer
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '6px' }}>
                  {selectedLayer.threats.map(t => (
                    <span key={t} style={{
                      fontSize: '11px', padding: '3px 8px', borderRadius: '5px',
                      background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                      color: '#f87171',
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div>
                <div style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                  color: 'var(--ifm-color-content-secondary)', textTransform: 'uppercase' as const,
                  marginBottom: '7px',
                }}>
                  Controls &amp; technologies
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {selectedLayer.technologies.map((tech, i) => (
                    <div key={tech} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      fontSize: '12px', color: 'var(--ifm-color-content)',
                      padding: '5px 8px', borderRadius: '6px',
                      background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                    }}>
                      <div style={{
                        width: '5px', height: '5px', borderRadius: '50%', flexShrink: 0,
                        background: selectedLayer.color,
                      }} />
                      <span style={{ fontFamily: 'monospace', fontSize: '11.5px' }}>{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--ifm-color-content-secondary)', fontSize: '13px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                   stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                   style={{ display: 'block', margin: '0 auto 10px' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Select a layer to inspect</div>
              <div style={{ fontSize: '11px' }}>Technologies, threats, and design principles</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
