import React, { useState } from 'react';

interface Transport {
  id: string;
  name: string;
  badge: string;
  color: string;
  mechanism: string;
  useCase: string;
  security: string;
  codeSnippet: string;
}

const TRANSPORTS: Transport[] = [
  {
    id: 'stdio',
    name: '1. Standard I/O (Stdio)',
    badge: 'LOCAL PROCESS',
    color: '#38bdf8', // Sky Blue
    mechanism: 'Communication via standard input (stdin) and standard output (stdout) between parent agent and child process.',
    useCase: 'Local developer environments, VS Code / Cursor extensions launching local tool subprocesses.',
    security: 'Inherits local process isolation. No network port exposed.',
    codeSnippet: 'const transport = new StdioClientTransport({\n  command: "npx",\n  args: ["-y", "@modelcontextprotocol/server-postgres"]\n});'
  },
  {
    id: 'sse',
    name: '2. Server-Sent Events (SSE over HTTP)',
    badge: 'REMOTE HTTP',
    color: '#a78bfa', // Purple
    mechanism: 'HTTP POST for client-to-server requests + SSE stream for server-to-client event pushing.',
    useCase: 'Remote microservices, cloud-hosted MCP servers, enterprise shared API tools.',
    security: 'Requires TLS/HTTPS encryption, bearer token headers, and OAuth2 authorization.',
    codeSnippet: 'const transport = new SSEClientTransport(\n  new URL("https://api.internal.com/mcp/sse"),\n  { headers: { Authorization: "Bearer secret-token" } }\n);'
  },
  {
    id: 'websocket',
    name: '3. WebSockets / Custom Transport',
    badge: 'FULL-DUPLEX',
    color: '#34d399', // Emerald
    mechanism: 'Bi-directional persistent TCP socket stream for real-time low-latency tool execution.',
    useCase: 'High-frequency telemetry streams, collaborative multi-user agent environments.',
    security: 'WSS (WebSocket Secure) + message-level signature verification.',
    codeSnippet: 'const transport = new WebSocketClientTransport(\n  new WebSocket("wss://mcp.agent.internal/ws")\n);'
  }
];

export default function McpTransportLayersDiagram() {
  const [activeId, setActiveId] = useState<string>('stdio');
  const activeTransport = TRANSPORTS.find(t => t.id === activeId) || TRANSPORTS[0];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>MCP Transport Layers & Communication Protocols</span>
      </div>

      {/* Selector Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {TRANSPORTS.map((t) => {
          const isActive = activeId === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              style={{
                background: isActive ? `${t.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? t.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: t.color, background: `${t.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {t.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {t.name.split('. ')[1]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Transport Details Panel */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeTransport.color, marginBottom: '6px' }}>
          {activeTransport.name}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeTransport.mechanism}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeTransport.color, textTransform: 'uppercase', marginBottom: '4px' }}>
              Target Use Case
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ifm-color-content)' }}>
              {activeTransport.useCase}
            </div>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
              Transport Configuration Code
            </div>
            <pre style={{
              background: '#090b14',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '10px',
              color: 'var(--ifm-color-content)',
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
            }}>
              {activeTransport.codeSnippet}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
