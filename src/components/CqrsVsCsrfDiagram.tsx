import React, { useState } from 'react';

export default function CqrsVsCsrfDiagram(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'cqrs' | 'csrf'>('cqrs');

  return (
    <div className="interactive-diagram-container" style={{ margin: '1.5rem 0' }}>
      <div className="interactive-diagram-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
          💡 CQRS vs. CSRF Comparison
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setActiveTab('cqrs')} style={{ background: activeTab === 'cqrs' ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'cqrs' ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'cqrs' ? '#38bdf8' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>CQRS Pattern</button>
          <button onClick={() => setActiveTab('csrf')} style={{ background: activeTab === 'csrf' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${activeTab === 'csrf' ? '#f87171' : 'rgba(255,255,255,0.08)'}`, borderRadius: 4, color: activeTab === 'csrf' ? '#f87171' : '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}>CSRF Security</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem' }} className="interactive-diagram-grid-bg">
        <div style={{ background: activeTab === 'cqrs' ? 'rgba(56,189,248,0.08)' : 'rgba(255,255,255,0.02)', padding: '1rem', border: `1px solid ${activeTab === 'cqrs' ? '#38bdf8' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, transition: 'all 0.3s' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#38bdf8' }}>CQRS</h4>
          <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Command Query Responsibility Segregation</span>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#e2e8f0', lineHeight: 1.4 }}>
            An **architectural pattern** that separates database read operations (Queries) from write/update operations (Commands) to optimize performance, scaling, and database indexing.
          </p>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
            🏷️ Type: Database & API Architecture Pattern
          </div>
        </div>

        <div style={{ background: activeTab === 'csrf' ? 'rgba(248,113,113,0.08)' : 'rgba(255,255,255,0.02)', padding: '1rem', border: `1px solid ${activeTab === 'csrf' ? '#f87171' : 'rgba(255,255,255,0.06)'}`, borderRadius: 8, transition: 'all 0.3s' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#f87171' }}>CSRF</h4>
          <span style={{ fontSize: '0.68rem', color: '#fca5a5', display: 'block', marginBottom: '8px' }}>Cross-Site Request Forgery</span>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.76rem', color: '#e2e8f0', lineHeight: 1.4 }}>
            A **security vulnerability** where a malicious third-party website tricks a user's browser into executing unwanted actions on an application where they are logged in.
          </p>
          <div style={{ fontSize: '0.7rem', color: '#fca5a5', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '6px' }}>
            🏷️ Type: Web Security Vulnerability
          </div>
        </div>
      </div>

      <div className="interactive-diagram-details-card" style={{ margin: 0, borderTop: 0, borderRadius: '0 0 6px 6px' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
          ⚠️ <strong>Don't mix these up in interviews!</strong> They sound similar but are entirely unrelated. <strong>CQRS</strong> is about database read/write optimization, while <strong>CSRF</strong> is a cross-site session takeover security risk.
        </p>
      </div>
    </div>
  );
}
