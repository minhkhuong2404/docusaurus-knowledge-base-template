import React, { useState } from 'react';

const TABS = [
  {
    id: 'latency', label: 'Latency Hierarchy', color: '#38bdf8',
    overview: 'Latency is the single most impactful variable in distributed system performance. Understanding the hardware realities — from CPU cache to transatlantic fiber — helps engineers make correct architectural tradeoffs.',
    items: [
      { label: 'L1 Cache hit', val: '0.5 ns', visual: 1, color: '#34d399' },
      { label: 'L2 Cache hit', val: '7 ns', visual: 2, color: '#34d399' },
      { label: 'L3 Cache hit', val: '20 ns', visual: 3, color: '#a78bfa' },
      { label: 'Main memory (RAM)', val: '100 ns', visual: 5, color: '#fbbf24' },
      { label: 'SSD random read (NVMe)', val: '0.1 ms', visual: 12, color: '#f97316' },
      { label: 'Same-DC network round trip', val: '0.5 ms', visual: 20, color: '#f97316' },
      { label: 'HDD sequential read', val: '1 ms', visual: 28, color: '#f97316' },
      { label: 'Cross-region cloud (AWS us-east → eu-west)', val: '80 ms', visual: 55, color: '#f87171' },
      { label: 'Transatlantic round trip (NY → London)', val: '130 ms', visual: 70, color: '#f87171' },
      { label: 'Transcontinental (LA → Tokyo)', val: '200 ms', visual: 90, color: '#f87171' },
    ],
  },
  {
    id: 'tcp', label: 'TCP Tuning', color: '#34d399',
    overview: 'TCP has many kernel-tunable parameters that directly affect throughput and connection efficiency in high-load servers. These are the most impactful settings for production Java/Spring services.',
    items: [
      { label: 'tcp_keepalive_time', val: '7200s → 60s', visual: 0, color: '#34d399', note: 'Time before idle connection gets keepalive probes. Lower for fast dead connection detection.' },
      { label: 'tcp_fin_timeout', val: '60s → 15s', visual: 0, color: '#34d399', note: 'Time socket stays in FIN_WAIT_2. Reduces TIME_WAIT accumulation under high request rate.' },
      { label: 'net.core.somaxconn', val: '128 → 65535', visual: 0, color: '#34d399', note: 'Max listen() backlog. Increase for high-concurrency servers. Must also set Spring server.tomcat.accept-count.' },
      { label: 'tcp_tw_reuse', val: '0 → 1', visual: 0, color: '#34d399', note: 'Allow reuse of TIME_WAIT sockets for new outgoing connections. Prevents port exhaustion.' },
      { label: 'tcp_rmem / tcp_wmem', val: '87380 → 4MB', visual: 0, color: '#34d399', note: 'Receive/send buffer sizes. Larger buffers improve throughput on high-bandwidth-delay-product links.' },
      { label: 'Connection pooling (HikariCP)', val: 'maximumPoolSize', visual: 0, color: '#38bdf8', note: 'Formula: (cpu_cores × 2) + effective_spindle_count. Avoid > 20 for typical OLTP workloads.' },
      { label: 'HTTP keep-alive', val: 'keep-alive: timeout=5', visual: 0, color: '#a78bfa', note: 'Reuses TCP connections across multiple requests. Default in HTTP/1.1. Reduces 3-way handshake overhead.' },
    ],
  },
  {
    id: 'multiplexing', label: 'HTTP/1.1 vs HTTP/2', color: '#a78bfa',
    overview: 'HTTP/2 fundamentally changes how requests flow over a single TCP connection — stream multiplexing eliminates head-of-line blocking at the HTTP layer. HTTP/3 goes further by moving to QUIC (UDP).',
    items: [
      { label: 'HTTP/1.1: Serial requests', val: 'Req1 → Resp1 → Req2 → Resp2', visual: 0, color: '#f87171', note: 'One request at a time per connection. Browser opens 6 parallel connections to work around this.' },
      { label: 'HTTP/1.1: Head-of-line blocking', val: 'HOL at transport', visual: 0, color: '#f87171', note: 'If a response is slow, all subsequent responses on the same connection are blocked.' },
      { label: 'HTTP/2: Stream multiplexing', val: '128 streams / connection', visual: 0, color: '#34d399', note: 'Multiple requests/responses interleaved on a single TCP connection using independent streams.' },
      { label: 'HTTP/2: Header compression (HPACK)', val: '80–90% size reduction', visual: 0, color: '#34d399', note: 'HPACK compresses headers using a static + dynamic table. Eliminates repetitive headers (User-Agent, Cookie) across requests.' },
      { label: 'HTTP/2: Server Push', val: 'Push CSS before request', visual: 0, color: '#a78bfa', note: 'Server can push resources before the client requests them. Useful for critical CSS/JS assets.' },
      { label: 'HTTP/3 (QUIC): 0-RTT resumption', val: '0 RTT vs 2 RTT (TLS)', visual: 0, color: '#38bdf8', note: 'QUIC + TLS 1.3 0-RTT allows sending data on the very first packet for known servers. Cuts connection time.' },
      { label: 'HTTP/3: No TCP HOL blocking', val: 'Stream-level loss recovery', visual: 0, color: '#38bdf8', note: 'QUIC streams are independent at transport. A lost packet only stalls its own stream, not all streams.' },
    ],
  },
  {
    id: 'compression', label: 'Bandwidth Optimization', color: '#fbbf24',
    overview: 'Reducing payload size and eliminating redundant connections are the highest-leverage bandwidth optimizations for REST APIs and streaming services.',
    items: [
      { label: 'gzip compression', val: '~70% JSON size reduction', visual: 0, color: '#fbbf24', note: 'Content-Encoding: gzip. Spring Boot: server.compression.enabled=true. Best for text (JSON, HTML, CSS).' },
      { label: 'Brotli compression', val: '~20% better than gzip', visual: 0, color: '#fbbf24', note: 'Modern alternative. Lower CPU on decompress. Supported by all major browsers and CDNs.' },
      { label: 'Protocol Buffers (gRPC)', val: '5–10× smaller than JSON', visual: 0, color: '#34d399', note: 'Binary serialization. Fixed schema. Used by gRPC. Eliminates verbose field names in payloads.' },
      { label: 'CDN edge caching', val: 'Cache-Control: max-age=86400', visual: 0, color: '#38bdf8', note: 'Static assets served from 200+ PoPs globally. TTFB < 10ms. Reduce origin load by 90%+.' },
      { label: 'Connection reuse (HikariCP)', val: 'pool-size = 10–20', visual: 0, color: '#a78bfa', note: 'Reuse database connections. Each TCP + TLS handshake costs ~100ms. Pool saves per-request overhead.' },
      { label: 'Avoid N+1 queries', val: 'fetch join or batch', visual: 0, color: '#f87171', note: 'N+1 = 1 query for list + N queries for each item. Use JOIN FETCH in JPQL or @EntityGraph.' },
    ],
  },
];

export default function NetworkPerformanceOptimizationDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<string>('latency');
  const tab = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      <style>{`@media (max-width: 768px) { .net-perf-two { display: block !important; } }`}</style>
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>Network Performance &amp; Optimization</span>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '7px', marginBottom: '14px', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '11.5px', background: activeTab === t.id ? `${t.color}18` : 'rgba(255,255,255,0.04)', color: activeTab === t.id ? t.color : 'var(--ifm-color-content-secondary)', boxShadow: activeTab === t.id ? `0 0 0 1.5px ${t.color}50` : '0 0 0 1px rgba(255,255,255,0.08)', transition: 'all 0.2s ease' }}>
              {t.label}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '12.5px', color: 'var(--ifm-color-content-secondary)', margin: '0 0 14px', lineHeight: 1.6 }}>{tab.overview}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {tab.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', padding: '9px 12px' }}>
              {tab.id === 'latency' && item.visual > 0 && (
                <div style={{ width: '90px', flexShrink: 0, display: 'flex', alignItems: 'center', paddingTop: '2px' }}>
                  <div style={{ height: '8px', borderRadius: '4px', background: item.color, width: `${item.visual}%`, minWidth: '4px', transition: 'width 0.4s ease' }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: item.note ? '3px' : 0 }}>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--ifm-color-content)' }}>{item.label}</span>
                  <code style={{ fontSize: '10.5px', color: item.color, background: `${item.color}15`, border: `1px solid ${item.color}30`, borderRadius: '4px', padding: '1px 6px', flexShrink: 0 }}>{item.val}</code>
                </div>
                {item.note && <div style={{ fontSize: '11px', color: 'var(--ifm-color-content-secondary)', lineHeight: 1.5 }}>{item.note}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
