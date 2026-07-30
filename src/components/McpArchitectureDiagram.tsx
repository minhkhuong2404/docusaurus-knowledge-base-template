import React, { useState } from 'react';

interface McpComponent {
  id: string;
  name: string;
  badge: string;
  color: string;
  role: string;
  features: string[];
  example: string;
}

const COMPONENTS: McpComponent[] = [
  {
    id: 'client',
    name: 'MCP Client (Host Agent)',
    badge: 'CLIENT',
    color: '#38bdf8', // Sky Blue
    role: 'The AI application or IDE runtime (e.g. Cursor, Claude Desktop, Antigravity) that initiates MCP connections.',
    features: [
      'Discovers available MCP servers and tools',
      'Translates LLM intent into MCP JSON-RPC requests',
      'Manages user authorization & permission prompt dialogues'
    ],
    example: 'Cursor IDE connecting to a local Postgres MCP Server via stdio.'
  },
  {
    id: 'server',
    name: 'MCP Server (Tool / Data Provider)',
    badge: 'SERVER',
    color: '#34d399', // Emerald
    role: 'Lightweight service exposing standardized endpoints for Prompts, Resources (data), and Tools (functions).',
    features: [
      'Exposes Prompts: pre-configured system templates',
      'Exposes Resources: file contents, DB schema data, API objects',
      'Exposes Tools: executable functions with typed JSON schemas'
    ],
    example: 'A Python service running `mcp-server-postgres` exposing read_query() tool.'
  },
  {
    id: 'protocol',
    name: 'MCP Protocol Layer (JSON-RPC 2.0)',
    badge: 'PROTOCOL',
    color: '#a78bfa', // Purple
    role: 'Standardized communication format for request/response and bidirectional event streaming.',
    features: [
      'tools/list: Returns JSON schema of registered tools',
      'tools/call: Executes tool with arguments and returns result',
      'resources/read: Stream raw binary or text data'
    ],
    example: '{"jsonrpc": "2.0", "method": "tools/call", "params": {"name": "execute_sql"}}'
  }
];

export default function McpArchitectureDiagram() {
  const [activeId, setActiveId] = useState<string>('server');
  const activeComp = COMPONENTS.find(c => c.id === activeId) || COMPONENTS[1];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header Bar */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
          <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
          <line x1="6" y1="6" x2="6.01" y2="6" />
          <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 600 }}>Model Context Protocol (MCP) Architecture</span>
      </div>

      {/* Selector Tabs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '10px',
        padding: '16px',
        background: '#0d0f1e',
        borderBottom: '1px solid #1e2342'
      }}>
        {COMPONENTS.map((comp) => {
          const isActive = activeId === comp.id;
          return (
            <button
              key={comp.id}
              onClick={() => setActiveId(comp.id)}
              style={{
                background: isActive ? `${comp.color}18` : '#13162b',
                border: `1.5px solid ${isActive ? comp.color : '#1e2342'}`,
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 800, color: comp.color, background: `${comp.color}20`, padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>
                {comp.badge}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ifm-color-content)' }}>
                {comp.name.split(' (')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Details Card */}
      <div className="interactive-diagram-details-card" style={{ background: '#090b14', padding: '20px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: activeComp.color, marginBottom: '6px' }}>
          {activeComp.name}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ifm-color-content-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
          {activeComp.role}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: activeComp.color, textTransform: 'uppercase', marginBottom: '6px' }}>
              Key Responsibilities & Endpoints
            </div>
            <ul style={{ paddingLeft: '16px', margin: 0, fontSize: '12px', color: 'var(--ifm-color-content-secondary)', lineHeight: '1.5' }}>
              {activeComp.features.map((feat, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{feat}</li>
              ))}
            </ul>
          </div>

          <div style={{ background: '#13162b', padding: '12px', borderRadius: '6px', border: '1px solid #1e2342' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              Real-World Code / Payload Example
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-content)', fontFamily: 'monospace' }}>
              {activeComp.example}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
