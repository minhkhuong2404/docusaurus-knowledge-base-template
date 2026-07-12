import React, { useState } from 'react';

type ReqSection = 'line' | 'headers' | 'body';

export default function HttpIntroDiagram(): React.JSX.Element {
  const [activeSection, setActiveSection] = useState<ReqSection>('line');

  const sections = {
    line: {
      title: 'Request Line',
      desc: 'The starting line of every HTTP request. Contains: Method (e.g. GET/POST), Request URI path, and HTTP protocol version (e.g. HTTP/1.1).'
    },
    headers: {
      title: 'HTTP Headers',
      desc: 'Key-value pairs separated by colons. Provides metadata about the request, content formatting, credentials, cookies, and cache settings.'
    },
    body: {
      title: 'Request Body (Payload)',
      desc: 'The actual data payload (often formatted as JSON, XML, or form data) sent to the server. Typically omitted in GET/DELETE requests.'
    }
  };

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          📨 Interactive HTTP Request Anatomy Structure
        </h3>
      </div>

      <div style={{ padding: '1.2rem' }} className="interactive-diagram-grid-bg">
        {/* Anatomy Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'monospace', fontSize: '0.74rem', marginBottom: '1.2rem' }}>
          
          <div onMouseEnter={() => setActiveSection('line')} style={{ padding: '10px 14px', background: activeSection === 'line' ? 'rgba(56,189,248,0.12)' : '#0d1527', border: `1px solid ${activeSection === 'line' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, cursor: 'pointer' }}>
            POST /api/v1/users HTTP/1.1
          </div>

          <div onMouseEnter={() => setActiveSection('headers')} style={{ padding: '10px 14px', background: activeSection === 'headers' ? 'rgba(167,139,250,0.12)' : '#0d1527', border: `1px solid ${activeSection === 'headers' ? '#a78bfa' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, cursor: 'pointer' }}>
            Host: api.example.com<br />
            Content-Type: application/json<br />
            Authorization: Bearer eyJhbGciOi...
          </div>

          <div onMouseEnter={() => setActiveSection('body')} style={{ padding: '10px 14px', background: activeSection === 'body' ? 'rgba(74,222,128,0.12)' : '#0d1527', border: `1px solid ${activeSection === 'body' ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, cursor: 'pointer' }}>
            {"{"}<br />
            &nbsp;&nbsp;"name": "John Doe",<br />
            &nbsp;&nbsp;"email": "john@example.com"<br />
            {"}"}
          </div>

        </div>

        {/* Info Box */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>{sections[activeSection].title}</h4>
          <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {sections[activeSection].desc}
          </p>
        </div>
      </div>
      <p className="interactive-diagram-helper-text">💡 Hover over request blocks to inspect their layout details.</p>
    </div>
  );
}
