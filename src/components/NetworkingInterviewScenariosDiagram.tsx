import React, { useState } from 'react';

const SCENARIOS = [
  {
    id: 'url',
    label: 'Type a URL',
    color: '#38bdf8',
    question: 'What happens when you type https://api.example.com/users in a browser?',
    steps: [
      { step: 1, label: 'DNS Resolution', detail: 'Browser checks local cache → OS hosts file → OS DNS cache → Recursive resolver → Root → TLD → Authoritative NS → returns A record IP. Cached for TTL seconds.' },
      { step: 2, label: 'TCP 3-Way Handshake', detail: 'Client SYN → Server SYN-ACK → Client ACK. Establishes TCP connection to port 443. Total: 1 RTT. QUIC eliminates this for HTTP/3.' },
      { step: 3, label: 'TLS 1.3 Handshake', detail: 'Client Hello (supported ciphers, key share) → Server Hello (chosen cipher, key share, cert) → Client verifies cert against trusted CA → Derives symmetric session key. Total: 1 RTT.' },
      { step: 4, label: 'HTTP GET Request', detail: 'Browser sends HTTP GET /users with headers (Host, Accept, Cookie, Authorization). Connection is reused for subsequent requests (keep-alive / HTTP/2 multiplexing).' },
      { step: 5, label: 'Server Processing', detail: 'Load balancer routes to app server. Spring DispatcherServlet routes to @GetMapping("/users"). Service layer queries DB. Response serialized to JSON.' },
      { step: 6, label: 'HTTP Response + Browser Render', detail: 'Server sends HTTP 200 with Content-Type: application/json. Browser receives, parses, and renders. Cache-Control header determines future caching.' },
    ],
  },
  {
    id: 'tcp-udp',
    label: 'TCP vs UDP',
    color: '#34d399',
    question: 'When should you choose TCP vs UDP?',
    steps: [
      { step: 1, label: 'TCP — Reliable, Ordered', detail: '3-way handshake, guaranteed delivery, byte-stream ordering, flow control, congestion control. Perfect when every byte matters: REST APIs, database connections, file transfers.' },
      { step: 2, label: 'UDP — Fast, Unreliable', detail: 'No handshake, no ordering, no retry. Fire-and-forget. Packet loss is OK or handled at application layer. Best for: DNS (1 packet), video streaming, live audio, gaming, VoIP.' },
      { step: 3, label: 'QUIC — Best of both', detail: 'UDP-based with TLS 1.3 built in. Streams are independent (no TCP HOL blocking). Connection migration survives IP change. 0-RTT resumption. Used by HTTP/3, YouTube, Google services.' },
      { step: 4, label: 'Use TCP when…', detail: 'REST/HTTP, JDBC, Redis, Kafka, gRPC — any protocol requiring ordered, reliable delivery. Also when firewalls block UDP (corporate networks often block UDP except DNS port 53).' },
      { step: 5, label: 'Use UDP when…', detail: 'Real-time audio/video (WebRTC, Zoom), live game state, DNS queries, SNMP, NTP clock sync, IoT sensor data. Latency matters more than reliability.' },
      { step: 6, label: 'Common trap', detail: '"UDP is always faster" is false. TCP with keep-alive and connection pooling is faster than UDP with repeated connection setup for high-volume API traffic.' },
    ],
  },
  {
    id: 'https',
    label: 'HTTPS Handshake',
    color: '#a78bfa',
    question: 'Walk me through the complete HTTPS/TLS 1.3 handshake.',
    steps: [
      { step: 1, label: 'Client Hello', detail: 'Client sends: TLS version, supported cipher suites, random nonce (client_random), and key share (ECDH public key for X25519 or P-256). No round trip wasted — key share is included upfront in TLS 1.3.' },
      { step: 2, label: 'Server Hello + Certificate', detail: 'Server responds: chosen cipher suite, server_random, server key share (ECDH public key), and X.509 certificate chain (Leaf → Intermediate → Root CA). Also sends CertificateVerify (signature over handshake).' },
      { step: 3, label: 'Key Derivation (HKDF)', detail: 'Both sides independently derive the same symmetric session key using ECDH shared secret + both random nonces via HKDF (HMAC-based key derivation). No session key is transmitted — forward secrecy guaranteed.' },
      { step: 4, label: 'Certificate Validation', detail: 'Client verifies: signature chain leads to trusted root CA, CN/SAN matches hostname, certificate not expired, not revoked (OCSP stapling or CRL). In Java: controlled by TrustManager.' },
      { step: 5, label: 'Finished Messages', detail: 'Both sides send Finished (HMAC of entire handshake transcript encrypted with session key). Mutual verification of handshake integrity. Handshake complete in 1 RTT total.' },
      { step: 6, label: 'Application Data', detail: 'All subsequent HTTP requests/responses are encrypted with AES-256-GCM (authenticated encryption — provides both confidentiality AND integrity). MAC prevents tampering.' },
    ],
  },
  {
    id: 'debug',
    label: 'Debug Slow API',
    color: '#f97316',
    question: 'Your Spring Boot API is responding in 2 seconds. How do you diagnose it?',
    steps: [
      { step: 1, label: 'Measure TTFB first', detail: 'curl -w "TTFB: %{time_starttransfer}s\\nTotal: %{time_total}s" https://api/endpoint. If TTFB is high → server processing issue. If TTFB is low but total is high → large response/transfer issue.' },
      { step: 2, label: 'Check DNS + Connection time', detail: 'curl -w "DNS: %{time_namelookup}s\\nConnect: %{time_connect}s\\nTLS: %{time_appconnect}s". Slow DNS → fix resolv.conf or cache. Slow TLS → check certificate chain length and OCSP.' },
      { step: 3, label: 'Check database queries', detail: 'Enable Spring slow query log: spring.jpa.properties.hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS=100. Use pg_stat_statements for PostgreSQL. EXPLAIN ANALYZE to check missing indexes.' },
      { step: 4, label: 'Check thread pool saturation', detail: 'Actuator: /actuator/metrics/executor.active. If active ≈ max → pool exhausted, requests queue. Increase tomcat max-threads or switch to Spring WebFlux for non-blocking I/O.' },
      { step: 5, label: 'Check external service calls', detail: 'Use Spring Sleuth/Micrometer tracing to find slow downstream calls. Add timeouts: RestClient with .readTimeout(500ms). Check if retry storms are amplifying latency.' },
      { step: 6, label: 'Add metrics + traces', detail: 'Micrometer + Prometheus + Grafana for p99 latency. Add @Timed on slow methods. OpenTelemetry distributed tracing to identify which microservice is the bottleneck in the call chain.' },
    ],
  },
];

export default function NetworkingInterviewScenariosDiagram(): React.JSX.Element {
  const [activeScenario, setActiveScenario] = useState<string>('url');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const scenario = SCENARIOS.find(s => s.id === activeScenario)!;

  const handleTabChange = (id: string) => { setActiveScenario(id); setExpandedStep(null); };

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Networking Interview Scenarios</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {SCENARIOS.map(s => (
            <button key={s.id} onClick={() => handleTabChange(s.id)}
              style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeScenario === s.id ? `${s.color}18` : 'rgba(255,255,255,0.04)', color: activeScenario === s.id ? s.color : 'var(--ifm-color-content-secondary)', boxShadow: activeScenario === s.id ? `0 0 0 1.5px ${s.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {s.label}
            </button>
          ))}
        </div>

        <div style={{ background: `${scenario.color}0d`, border: `1px solid ${scenario.color}30`, borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: scenario.color }}>"{scenario.question}"</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {scenario.steps.map((step, i) => {
            const isExpanded = expandedStep === i;
            return (
              <div key={i} onClick={() => setExpandedStep(isExpanded ? null : i)}
                style={{ background: isExpanded ? `${scenario.color}10` : 'rgba(255,255,255,0.03)', border: `1px solid ${isExpanded ? scenario.color + '40' : 'rgba(255,255,255,0.08)'}`, borderRadius: '8px', padding: '10px 12px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: scenario.color, background: `${scenario.color}18`, borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{step.step}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>{step.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--ifm-color-content-secondary)' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>
                {isExpanded && (
                  <div style={{ marginTop: '8px', paddingLeft: '34px', fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.65 }}>
                    {step.detail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
