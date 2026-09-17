import React, { useState } from 'react';

type TransportType = 'short-polling' | 'long-polling' | 'sse' | 'websocket';

interface TransportSpec {
  id: TransportType;
  name: string;
  direction: string;
  protocol: string;
  overhead: string;
  latency: string;
  color: string;
  desc: string;
  steps: { from: 'client' | 'server'; label: string; delay: string; color: string }[];
}

const TRANSPORTS: TransportSpec[] = [
  {
    id: 'short-polling',
    name: '1. Short Polling',
    direction: 'Unidirectional (Client ➔ Server)',
    protocol: 'Repeated HTTP GET',
    overhead: 'Extremely High (TCP + TLS setup per poll)',
    latency: 'Poor (Bound by poll interval e.g. 5s)',
    color: '#f87171',
    desc: 'Client sends periodic HTTP requests every N seconds regardless of whether new data exists. 95%+ of requests return empty 204 or 304, causing high CPU/QPS amplification.',
    steps: [
      { from: 'client', label: 'GET /messages?since=100 (t=0s)', delay: '0s', color: '#38bdf8' },
      { from: 'server', label: '200 OK [Empty / No Updates]', delay: '0.2s', color: '#94a3b8' },
      { from: 'client', label: 'GET /messages?since=100 (t=5s)', delay: '5s', color: '#38bdf8' },
      { from: 'server', label: '200 OK [New Message arrived!]', delay: '5.2s', color: '#34d399' }
    ]
  },
  {
    id: 'long-polling',
    name: '2. Long Polling (Comet)',
    direction: 'Unidirectional (Client ➔ Server)',
    protocol: 'Held HTTP GET',
    overhead: 'Moderate (Connection held open until event)',
    latency: 'Medium (~100-300ms reconnect penalty)',
    color: '#fbbf24',
    desc: 'Client sends HTTP request; server parks the thread or DeferredResult and holds connection open until an event occurs or 30s timeout expires. Upon receiving data, client immediately re-establishes a new request.',
    steps: [
      { from: 'client', label: 'GET /updates (Connection Held Open...)', delay: '0s', color: '#38bdf8' },
      { from: 'server', label: '... Server waits for event on bus ...', delay: '2.5s', color: '#fbbf24' },
      { from: 'server', label: '200 OK [Data Available!] ➔ Connection Closes', delay: '5s', color: '#34d399' },
      { from: 'client', label: 'Immediate Reconnect: GET /updates', delay: '5.1s', color: '#38bdf8' }
    ]
  },
  {
    id: 'sse',
    name: '3. Server-Sent Events (SSE)',
    direction: 'Unidirectional (Server ➔ Client)',
    protocol: 'HTTP/2 Streaming (text/event-stream)',
    overhead: 'Low (Single persistent HTTP connection)',
    latency: 'Ultra-low (Instant sub-10ms push)',
    color: '#2dd4bf',
    desc: 'Client initiates a single persistent HTTP connection. The server streams events whenever state changes. Fully native in browsers (EventSource API) with automatic reconnection and HTTP/2 multiplexing support.',
    steps: [
      { from: 'client', label: 'GET /stream (Accept: text/event-stream)', delay: '0s', color: '#38bdf8' },
      { from: 'server', label: 'HTTP 200 OK (Connection Persists)', delay: '0.1s', color: '#2dd4bf' },
      { from: 'server', label: 'data: {"order_id": 42, "status": "SHIPPED"}', delay: '1.8s', color: '#34d399' },
      { from: 'server', label: 'data: {"order_id": 42, "status": "DELIVERED"}', delay: '4.2s', color: '#34d399' }
    ]
  },
  {
    id: 'websocket',
    name: '4. WebSockets',
    direction: 'Full-Duplex Bidirectional',
    protocol: 'WS / WSS (Upgraded TCP Socket)',
    overhead: 'Minimal frame headers (2-10 bytes)',
    latency: 'Sub-millisecond (Lowest possible)',
    color: '#a78bfa',
    desc: 'Starts as an HTTP GET request with Upgrade: websocket header. Once upgraded, it becomes a persistent, stateful, bidirectional TCP socket allowing simultaneous two-way messaging with negligible framing overhead.',
    steps: [
      { from: 'client', label: 'GET /ws (Upgrade: websocket)', delay: '0s', color: '#38bdf8' },
      { from: 'server', label: 'HTTP 101 Switching Protocols', delay: '0.1s', color: '#a78bfa' },
      { from: 'client', label: 'Client Frame ➔ {"type": "chat", "msg": "Hi"}', delay: '1.2s', color: '#38bdf8' },
      { from: 'server', label: 'Server Frame ➔ {"type": "ack", "seq": 1}', delay: '1.25s', color: '#34d399' }
    ]
  }
];

export default function RealTimeTransportsDiagram({ initialTransport = 'websocket' }: { initialTransport?: TransportType }): React.JSX.Element {
  const [selectedTransport, setSelectedTransport] = useState<TransportType>(initialTransport);
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);

  const curSpec = TRANSPORTS.find(t => t.id === selectedTransport) || TRANSPORTS[3];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)', margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 768px) {
          .rt-2col {
            grid-template-columns: 1fr !important;
          }
          .rt-tab-btn {
            font-size: 11px !important;
            padding: 6px 8px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700, fontSize: '15px' }}>
          Real-Time Transport Protocols: Polling vs. SSE vs. WebSockets
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {TRANSPORTS.map(t => (
            <button
              key={t.id}
              className="rt-tab-btn"
              onClick={() => {
                setSelectedTransport(t.id);
                setActiveStepIdx(0);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: `1px solid ${selectedTransport === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: selectedTransport === t.id ? `${t.color}22` : 'rgba(255,255,255,0.03)',
                color: selectedTransport === t.id ? t.color : 'var(--ifm-color-content-secondary)',
                fontWeight: selectedTransport === t.id ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Top Info Banner */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }} className="rt-2col">
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Directionality</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: curSpec.color }}>{curSpec.direction}</span>
          </div>
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Protocol</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{curSpec.protocol}</span>
          </div>
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Latency Guarantee</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: curSpec.color }}>{curSpec.latency}</span>
          </div>
          <div style={{ padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '10.5px', color: '#94a3b8', display: 'block' }}>Overhead</span>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>{curSpec.overhead}</span>
          </div>
        </div>

        {/* Visual Sequence Flow Canvas */}
        <div className="interactive-diagram-svg-wrapper interactive-diagram-grid-bg" style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
          <svg viewBox="0 0 740 250" className="interactive-diagram-svg">
            <defs>
              <marker id="rt-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#38bdf8" /></marker>
              <marker id="rt-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#34d399" /></marker>
              <marker id="rt-amber" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#fbbf24" /></marker>
              <marker id="rt-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M 0 0 L 6 3 L 0 6 Z" fill="#a78bfa" /></marker>
            </defs>

            {/* Client Lifeline */}
            <g transform="translate(130, 20)">
              <rect width="100" height="36" rx="6" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="50" y="22" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">CLIENT</text>
              <line x1="50" y1="36" x2="50" y2="220" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
            </g>

            {/* Server Lifeline */}
            <g transform="translate(510, 20)">
              <rect width="100" height="36" rx="6" fill="rgba(52, 211, 153, 0.15)" stroke="#34d399" strokeWidth="1.5" />
              <text x="50" y="22" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="700">SERVER</text>
              <line x1="50" y1="36" x2="50" y2="220" stroke="#34d399" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
            </g>

            {/* Sequence Steps */}
            {curSpec.steps.map((step, idx) => {
              const y = 80 + idx * 36;
              const isClient = step.from === 'client';
              const xStart = isClient ? 180 : 560;
              const xEnd = isClient ? 560 : 180;
              const markerId = step.color === '#38bdf8' ? 'rt-blue' : step.color === '#34d399' ? 'rt-green' : step.color === '#fbbf24' ? 'rt-amber' : 'rt-purple';

              return (
                <g key={idx} onClick={() => setActiveStepIdx(idx)} style={{ cursor: 'pointer' }}>
                  {/* Arrow Path */}
                  <path
                    d={`M ${xStart} ${y} L ${xEnd} ${y}`}
                    stroke={step.color}
                    strokeWidth="2"
                    markerEnd={`url(#${markerId})`}
                    className="interactive-diagram-flowing-path"
                  />
                  <rect
                    x={(xStart + xEnd) / 2 - 120}
                    y={y - 14}
                    width="240"
                    height="18"
                    rx="4"
                    fill="rgba(0,0,0,0.75)"
                    stroke={step.color}
                    strokeWidth="0.8"
                  />
                  <text
                    x={(xStart + xEnd) / 2}
                    y={y - 2}
                    textAnchor="middle"
                    fill="var(--ifm-color-content)"
                    fontSize="9.5"
                    fontWeight="600"
                  >
                    {step.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Protocol Description Card */}
        <div className="interactive-diagram-details-card" style={{ borderLeft: `4px solid ${curSpec.color}` }}>
          <div className="interactive-diagram-card-header" style={{ marginBottom: '6px' }}>
            <span style={{ color: curSpec.color, fontWeight: 800, fontSize: '13px' }}>
              Architecture Breakdown: {curSpec.name}
            </span>
          </div>
          <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--ifm-color-content)', lineHeight: 1.45 }}>
            {curSpec.desc}
          </p>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            {curSpec.id === 'sse' && '💡 Ideal for news tickers, financial tickers, LLM streaming output, and social media activity feeds.'}
            {curSpec.id === 'websocket' && '💡 Essential for online multi-player gaming, interactive Whiteboards (Figma), and low-latency chat.'}
            {curSpec.id === 'long-polling' && '💡 Common fallback transport when corporate proxies block WebSockets.'}
            {curSpec.id === 'short-polling' && '💡 Acceptable only for very rare status checks (e.g. checking if a 30-minute background export finished).'}
          </div>
        </div>

      </div>
    </div>
  );
}
